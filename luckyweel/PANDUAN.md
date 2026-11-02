# Panduan Pasang Lucky Wheel

## 1. Siapkan Google Sheet
1. Buka sheets.new, beri nama bebas (mis. "Lucky Wheel Es").
2. Menu **Ekstensi > Apps Script**. Hapus isi default, tempel seluruh isi `Code.gs`, simpan.
3. Pilih fungsi **setup** di dropdown atas lalu klik **Jalankan**. Setujui izin akses.
   Ini membuat sheet **Kode** (100 kode acak) dan **Hadiah** (persen & stok).
4. Kode untuk dicetak di kemasan ada di kolom A sheet **Kode**. Mau tambah? Jalankan `buatKode` (ubah angka jumlahnya).

## 2. Deploy sebagai Web App
1. Klik **Deploy > New deployment > Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. Klik Deploy, salin **Web app URL** (berakhiran `/exec`).
4. Kalau script diubah nanti: Deploy > Manage deployments > edit > Version: New version.

## 3. Hubungkan ke website
Buka `index.html`, di bagian `CONFIG` isi:
- `API_URL` : URL Web App tadi
- `ADMIN_WA`: nomor WA admin format `62812...`
- `BRAND`   : nama produk es

Selama `API_URL` kosong, website jalan di **mode demo** (kode berawalan `DEMO`, hadiah acak lokal).

## 4. Upload
Upload folder ini (index.html + folder assets) ke hosting statis: Netlify Drop, Vercel, GitHub Pages, atau hosting biasa.

## Mengatur hadiah (sheet "Hadiah")
- Urutan baris 1-8 = urutan irisan di roda (jangan ditukar, kecuali urutan `PRIZES` di index.html ikut diubah).
- **Persen (%)**: peluang tiap hadiah, isi langsung angkanya (30 = 30%). Total idealnya 100, cek di kolom G. Kalau stok hadiah habis, sisanya otomatis dibagi ulang secara proporsional. **Stok**: batas jumlah (kosong = tanpa batas). Pajero & Vario default stok 1.
- Nama hadiah yang mengandung kata "ZONK" dianggap tidak menang.

## Memantau pemenang
Sheet **Kode**: kolom Status (MENANG/ZONK), Hadiah, Nama, WhatsApp, Waktu terisi otomatis.
Filter Status = MENANG untuk daftar hadiah yang harus dikirim.
