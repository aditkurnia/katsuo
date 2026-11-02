/**
 * LUCKY WHEEL – Backend Google Sheet (Google Apps Script)
 * Sheet "Kode"   : A Kode | B Status | C Hadiah | D Segmen | E Nama | F WhatsApp | G Waktu
 * Sheet "Hadiah" : A Segmen | B Hadiah | C Persen (%) | D Stok | E Terpakai
 *   - Persen (%) = peluang tiap hadiah (isi misal 30 = 30%). 0 = tidak pernah keluar. Idealnya total 100.
 *   - Stok  = batas jumlah hadiah (kosong = tanpa batas). Contoh Pajero stok 1.
 * Hadiah ditentukan DI SINI (server), bukan di browser, jadi tidak bisa dicurangi.
 */
const SHEET_KODE = 'Kode';
const SHEET_HADIAH = 'Hadiah';

/** Jalankan SEKALI untuk membuat sheet & isi awal. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let k = ss.getSheetByName(SHEET_KODE) || ss.insertSheet(SHEET_KODE);
  k.clear();
  k.getRange(1, 1, 1, 7).setValues([['Kode', 'Status', 'Hadiah', 'Segmen', 'Nama', 'WhatsApp', 'Waktu']]).setFontWeight('bold');
  k.setFrozenRows(1);
  k.getRange('F:F').setNumberFormat('@');

  let h = ss.getSheetByName(SHEET_HADIAH) || ss.insertSheet(SHEET_HADIAH);
  h.clear();
  h.getRange(1, 1, 1, 5).setValues([['Segmen', 'Hadiah', 'Persen (%)', 'Stok', 'Terpakai']]).setFontWeight('bold');
  h.getRange(2, 1, 8, 5).setValues([
    [1, 'Mitsubishi Pajero Sport', 0.5, 1, 0],
    [2, 'ZONK', 30, '', 0],
    [3, 'Es Gratis 1 Botol', 22, '', 0],
    [4, 'Pensil 2B (1 Box)', 18, '', 0],
    [5, 'Honda Vario', 1.5, 1, 0],
    [6, 'Basreng Jumbo', 8, '', 0],
    [7, 'Buku Tulis Big Boss', 12, '', 0],
    [8, 'Tiket Wisata', 8, '', 0]
  ]);
  h.getRange('G1:H1').setValues([['Total persen', 'Status']]).setFontWeight('bold');
  h.getRange('G2').setFormula('=SUM(C2:C9)');
  h.getRange('H2').setFormula('=IF(ROUND(G2,2)=100,"OK, total 100%","Total belum 100% (tetap jalan, dihitung proporsional)")');
  h.setFrozenRows(1);
  buatKode(100);
}

/** Tambah kode acak ke sheet "Kode". Ubah angka lalu jalankan untuk menambah. */
function buatKode(jumlah) {
  jumlah = jumlah || 100;
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_KODE);
  const ada = {};
  const last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, 1).getValues().forEach(r => ada[String(r[0]).toUpperCase()] = 1);
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa 0/O/1/I biar tidak salah baca
  const rows = [];
  while (rows.length < jumlah) {
    let c = '';
    for (let i = 0; i < 8; i++) c += abc[Math.floor(Math.random() * abc.length)];
    c = 'ES-' + c.slice(0, 4) + '-' + c.slice(4);
    if (!ada[c]) { ada[c] = 1; rows.push([c]); }
  }
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 1).setValues(rows);
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== 'spin') return out({ ok: true, message: 'Lucky Wheel API aktif' });

  const kode = String(p.kode || '').trim().toUpperCase();
  const nama = String(p.nama || '').trim().slice(0, 40);
  const wa = String(p.wa || '').replace(/[^\d]/g, '').slice(0, 16);
  if (!kode || !nama || !wa) return out({ ok: false, message: 'Data belum lengkap.' });

  const lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch (err) { return out({ ok: false, message: 'Server sedang ramai, coba lagi.' }); }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sk = ss.getSheetByName(SHEET_KODE);
    const sh = ss.getSheetByName(SHEET_HADIAH);
    const lastK = sk.getLastRow();
    if (lastK < 2) return out({ ok: false, message: 'Kode tidak ditemukan.' });

    const kodes = sk.getRange(2, 1, lastK - 1, 2).getValues();
    let row = -1;
    for (let i = 0; i < kodes.length; i++) {
      if (String(kodes[i][0]).trim().toUpperCase() === kode) { row = i; break; }
    }
    if (row < 0) return out({ ok: false, message: 'Kode tidak ditemukan. Periksa lagi penulisannya.' });
    if (String(kodes[row][1]).trim() !== '') return out({ ok: false, message: 'Kode ini sudah pernah dipakai.' });

    // pilih hadiah berdasarkan bobot & stok
    const hd = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues();
    const pool = [];
    let total = 0;
    hd.forEach((r, i) => {
      const w = Number(r[2]) || 0;
      const stok = r[3] === '' ? null : Number(r[3]);
      const pakai = Number(r[4]) || 0;
      if (w > 0 && (stok === null || pakai < stok)) { pool.push({ i: i, w: w }); total += w; }
    });
    if (!pool.length) return out({ ok: false, message: 'Hadiah sedang habis. Hubungi admin.' });

    let r = Math.random() * total, pick = pool[pool.length - 1];
    for (const it of pool) { r -= it.w; if (r < 0) { pick = it; break; } }

    const seg = Number(hd[pick.i][0]);
    const namaHadiah = String(hd[pick.i][1]);
    sh.getRange(pick.i + 2, 5).setValue((Number(hd[pick.i][4]) || 0) + 1);

    const isZonk = /zonk/i.test(namaHadiah);
    sk.getRange(row + 2, 2, 1, 6).setValues([[isZonk ? 'ZONK' : 'MENANG', namaHadiah, seg, nama, "'" + wa, new Date()]]);
    SpreadsheetApp.flush();

    return out({ ok: true, segment: seg - 1, prize: namaHadiah });
  } finally {
    lock.releaseLock();
  }
}
