/**
 * LUCKY WHEEL – Backend Google Sheet (Google Apps Script)
 *
 * ATURAN UTAMA
 *  - Hanya kode yang ada di sheet "Kode" yang bisa menang (default: 10 kode, ZONK 0%).
 *  - Kode lain (tidak terdaftar) otomatis ZONK dan dicatat di sheet "KodeLain".
 *  - Hadiah tiap kode bisa DITENTUKAN (kolom B, opsional). Kosong = diundi pakai Persen (%) di sheet "Hadiah".
 *
 * Sheet "Kode"       : A Kode | B Hadiah tetap (opsional) | C Status | D Hadiah | E Segmen | F Nama | G Kelas | H Waktu tukar | I Waktu putar | J Waktu klaim | K Diserahkan
 *   Status: (kosong) -> DITUKAR (sudah redeem, belum diputar) -> MENANG / ZONK (sudah diputar)
 * Sheet "Hadiah"     : A Segmen | B Hadiah | C Persen (%) | D Stok | E Terpakai
 * Sheet "Pengaturan" : B2 = "Kode terdaftar bisa ZONK?"  TIDAK (default, zonk 0%) / YA (zonk ikut diundi sesuai Persen)
 * Sheet "KodeLain"   : log kode yang tidak terdaftar
 * Hadiah ditentukan di server (sini), jadi tidak bisa dicurangi lewat browser.
 */
const SHEET_KODE = 'Kode';
const SHEET_HADIAH = 'Hadiah';
const SHEET_SET = 'Pengaturan';
const SHEET_LAIN = 'KodeLain';
const KELAS_OK = /^(10|11) (TKJ|DKV|MP|TKR|TSM|APAT|ATPH|TATA BOGA)$/i;
const NCOL = 11;
// nomor kolom (1-based)
const C = { KODE: 1, TETAP: 2, STATUS: 3, HADIAH: 4, SEG: 5, NAMA: 6, KELAS: 7, TUKAR: 8, PUTAR: 9, KLAIM: 10, SERAH: 11 };

/** Jalankan SEKALI untuk membuat semua sheet (menghapus isi sheet lama). */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const get = n => ss.getSheetByName(n) || ss.insertSheet(n);

  const h = get(SHEET_HADIAH);
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

  const s = get(SHEET_SET);
  s.clear();
  s.getRange(1, 1, 1, 3).setValues([['Pengaturan', 'Nilai', 'Keterangan']]).setFontWeight('bold');
  s.getRange(2, 1, 1, 3).setValues([['Kode terdaftar bisa ZONK?', 'TIDAK', 'TIDAK = kode di sheet Kode pasti menang (ZONK 0%). YA = ZONK ikut diundi sesuai Persen di sheet Hadiah.']]);
  s.getRange('B2').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['TIDAK', 'YA'], true).build());

  const l = get(SHEET_LAIN);
  l.clear();
  l.getRange(1, 1, 1, 3).setValues([['Kode dicoba', 'Waktu putar', 'Hasil']]).setFontWeight('bold');
  l.setFrozenRows(1);

  const k = get(SHEET_KODE);
  k.clear();
  k.getRange(1, 1, 1, NCOL).setValues([['Kode', 'Hadiah tetap (opsional)', 'Status', 'Hadiah', 'Segmen', 'Nama', 'Kelas', 'Waktu tukar', 'Waktu putar', 'Waktu klaim', 'Diserahkan']]).setFontWeight('bold');
  k.setFrozenRows(1);
  buatKode(10);
  trimRows_(h, 10);
  trimRows_(s, 3);
  trimRows_(l, 3);
}

/** Hapus baris kosong berlebih di bawah data (default Google Sheet = 1000 baris). */
function trimRows_(sh, minRows) {
  const keep = Math.max(sh.getLastRow(), minRows || 2);
  const extra = sh.getMaxRows() - keep;
  if (extra > 0) sh.deleteRows(keep + 1, extra);
}

/** Tambah kode acak ke sheet "Kode" (default 10). Ubah angka lalu jalankan untuk menambah. */
function buatKode(jumlah) {
  jumlah = jumlah || 10;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_KODE);
  const hadiah = ss.getSheetByName(SHEET_HADIAH);

  // baris terakhir berdasarkan kolom A saja (bukan checkbox / kolom lain)
  const colA = sh.getRange(1, 1, sh.getMaxRows(), 1).getValues();
  let lastRow = 1;
  const ada = {};
  for (let i = 1; i < colA.length; i++) {
    const v = String(colA[i][0]).trim();
    if (v) { lastRow = i + 1; ada[v.toUpperCase()] = 1; }
  }

  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa 0/O/1/I biar tidak salah baca
  const rows = [];
  while (rows.length < jumlah) {
    let c = '';
    for (let i = 0; i < 8; i++) c += abc[Math.floor(Math.random() * abc.length)];
    c = 'ES-' + c.slice(0, 4) + '-' + c.slice(4);
    if (!ada[c]) { ada[c] = 1; rows.push([c]); }
  }

  const start = lastRow + 1, end = lastRow + rows.length;
  if (sh.getMaxRows() < end) sh.insertRowsAfter(sh.getMaxRows(), end - sh.getMaxRows());
  sh.getRange(start, 1, rows.length, 1).setValues(rows);
  // dropdown hadiah & checkbox hanya untuk baris yang berisi kode
  sh.getRange(start, C.TETAP, rows.length, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(hadiah.getRange('B2:B9'), true).setAllowInvalid(false).build());
  sh.getRange(start, C.SERAH, rows.length, 1).insertCheckboxes();
  trimRows_(sh, end);
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = p.action;
  if (['redeem', 'spin', 'klaim'].indexOf(action) < 0) return out({ ok: true, message: 'Lucky Wheel API aktif' });

  const kode = String(p.kode || '').trim().toUpperCase();
  if (!kode) return out({ ok: false, message: 'Kode belum diisi.' });

  const lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch (err) { return out({ ok: false, code: 'BUSY', message: 'Server sedang ramai, coba lagi.' }); }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sk = ss.getSheetByName(SHEET_KODE);
    const last = lastRowA_(sk);
    const data = last < 2 ? [] : sk.getRange(2, 1, last - 1, NCOL).getValues();
    let i = -1;
    for (let n = 0; n < data.length; n++) {
      if (String(data[n][C.KODE - 1]).trim().toUpperCase() === kode) { i = n; break; }
    }
    if (i < 0) return kodeLain_(ss, action, kode); // tidak terdaftar -> otomatis ZONK

    const row = data[i];
    const status = String(row[C.STATUS - 1]).trim();
    const r = i + 2;

    if (action === 'redeem') {
      if (status === 'MENANG' || status === 'ZONK') return out({ ok: false, code: 'USED', message: 'Kode ini sudah dipakai.' });
      if (status === '') {
        sk.getRange(r, C.STATUS).setValue('DITUKAR');
        sk.getRange(r, C.TUKAR).setValue(new Date());
      }
      return out({ ok: true, kode: kode });
    }

    if (action === 'spin') {
      if (status === 'MENANG' || status === 'ZONK') return out({ ok: false, code: 'USED', message: 'Kode ini sudah dipakai.' });
      if (status !== 'DITUKAR') return out({ ok: false, code: 'NOT_REDEEMED', message: 'Tukar kode dulu lewat tombol Redeem.' });

      const sh = ss.getSheetByName(SHEET_HADIAH);
      const hd = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues();
      const sset = ss.getSheetByName(SHEET_SET);
      const zonkOk = !!sset && /^ya$/i.test(String(sset.getRange('B2').getValue()).trim());

      let pick = null;

      // 1) Hadiah tetap (opsional): kalau diisi, persentase tidak dipakai untuk kode ini
      const tetap = String(row[C.TETAP - 1]).trim().toUpperCase();
      if (tetap) {
        const m = [];
        hd.forEach((h, x) => { if (String(h[1]).trim().toUpperCase() === tetap) m.push(x); });
        if (m.length) pick = m[Math.floor(Math.random() * m.length)];
      }

      // 2) Tidak diatur -> undi pakai Persen (%) & Stok
      if (pick === null) {
        const pool = [];
        let total = 0;
        hd.forEach((h, x) => {
          const w = Number(h[2]) || 0;
          const stok = h[3] === '' ? null : Number(h[3]);
          const pakai = Number(h[4]) || 0;
          if (!zonkOk && /zonk/i.test(String(h[1]))) return; // ZONK 0% untuk kode terdaftar
          if (w > 0 && (stok === null || pakai < stok)) { pool.push({ x: x, w: w }); total += w; }
        });
        if (!pool.length) return out({ ok: false, code: 'EMPTY', message: 'Hadiah sedang habis. Hubungi panitia.' });
        let rnd = Math.random() * total, it = pool[pool.length - 1];
        for (const c of pool) { rnd -= c.w; if (rnd < 0) { it = c; break; } }
        pick = it.x;
      }

      const seg = Number(hd[pick][0]);
      const nama = String(hd[pick][1]);
      sh.getRange(pick + 2, 5).setValue((Number(hd[pick][4]) || 0) + 1);
      const zonk = /zonk/i.test(nama);
      sk.getRange(r, C.STATUS, 1, 3).setValues([[zonk ? 'ZONK' : 'MENANG', nama, seg]]);
      sk.getRange(r, C.PUTAR).setValue(new Date());
      SpreadsheetApp.flush();
      return out({ ok: true, segment: seg - 1, prize: nama, zonk: zonk });
    }

    if (action === 'klaim') {
      const nama = String(p.nama || '').trim().slice(0, 40);
      const kelas = String(p.kelas || '').trim().toUpperCase();
      if (status !== 'MENANG') return out({ ok: false, message: 'Kode ini tidak punya hadiah untuk diklaim.' });
      if (nama.length < 2) return out({ ok: false, message: 'Nama belum diisi.' });
      if (!KELAS_OK.test(kelas)) return out({ ok: false, message: 'Kelas tidak valid.' });
      if (String(row[C.NAMA - 1]).trim() !== '') return out({ ok: true, message: 'Data sudah tercatat.' });
      sk.getRange(r, C.NAMA, 1, 2).setValues([[nama, kelas]]);
      sk.getRange(r, C.KLAIM).setValue(new Date());
      SpreadsheetApp.flush();
      return out({ ok: true });
    }
  } finally {
    lock.releaseLock();
  }
}

/** Kode yang tidak terdaftar: dapat tiket & bisa diputar, hasilnya selalu ZONK (sekali per kode). */
function kodeLain_(ss, action, kode) {
  if (action === 'klaim') return out({ ok: false, message: 'Kode ini tidak punya hadiah untuk diklaim.' });
  const lg = ss.getSheetByName(SHEET_LAIN) || ss.insertSheet(SHEET_LAIN);
  if (lg.getLastRow() < 1) lg.getRange(1, 1, 1, 3).setValues([['Kode dicoba', 'Waktu putar', 'Hasil']]).setFontWeight('bold');
  const lr = lg.getLastRow();
  const sudah = lr > 1 && lg.getRange(2, 1, lr - 1, 1).getValues().some(r => String(r[0]).trim().toUpperCase() === kode);
  if (sudah) return out({ ok: false, code: 'USED', message: 'Kode ini sudah dipakai.' });
  if (action === 'redeem') return out({ ok: true, kode: kode });

  const sh = ss.getSheetByName(SHEET_HADIAH);
  const hd = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
  const z = hd.filter(r => /zonk/i.test(String(r[1])));
  if (!z.length) return out({ ok: false, code: 'EMPTY', message: 'Hadiah belum diatur. Hubungi panitia.' });
  const seg = Number(z[Math.floor(Math.random() * z.length)][0]);
  lg.appendRow([kode, new Date(), 'ZONK']);
  SpreadsheetApp.flush();
  return out({ ok: true, segment: seg - 1, prize: 'ZONK', zonk: true });
}
