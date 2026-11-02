# Panduan Pasang Lucky Wheel

## Alur pemain
1. Tekan **Redeem** (tombol tengah di navigasi bawah), masukkan kode dari kemasan, dapat 1 tiket.
2. Putar roda di **Beranda** memakai tiket.
3. Menang -> isi **nama** dan **kelas** -> data masuk ke Google Sheet.

## 1. Siapkan Google Sheet
1. Buka sheets.new, beri nama bebas.
2. **Ekstensi > Apps Script**. Hapus isi default, tempel seluruh isi `Code.gs`, simpan.
3. Pilih fungsi **setup** lalu **Jalankan**, setujui izin. Ini membuat sheet **Kode** (100 kode) dan **Hadiah**.
   (Catatan: setup menghapus isi sheet Kode & Hadiah lama. Struktur kolom berubah dari versi sebelumnya, jadi jalankan ulang.)
4. Kode untuk dicetak di kemasan ada di kolom A sheet **Kode**. Tambah kode: jalankan `buatKode` (ubah angka jumlahnya).

## 2. Deploy sebagai Web App
1. **Deploy > New deployment > Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. Deploy, salin **Web app URL** (berakhiran `/exec`).
4. Setiap script diubah: Deploy > Manage deployments > edit > Version: **New version**.

## 3. Hubungkan ke website
Di `index.html` bagian `CONFIG`, isi `API_URL` dan `BRAND`.
Selama `API_URL` kosong, website jalan di **mode demo** (kode `DEMO-1`, `DEMO-2`, dst, tanpa Google Sheet).

## 4. Upload
Upload folder (index.html + folder assets) ke Netlify Drop, Vercel, GitHub Pages, atau hosting biasa.

## Sheet "Kode" (hanya 10 kode pemenang)
Kolom: Kode | **Hadiah tetap (opsional)** | Status | Hadiah | Segmen | Nama | Kelas | Waktu tukar | Waktu putar | Waktu klaim | Diserahkan
- `setup()` membuat **10 kode**. Hanya 10 kode ini yang bisa menang, **ZONK 0%**. Kode lain otomatis ZONK (dicatat di sheet KodeLain).
- Tambah kode: jalankan `buatKode` (ubah angka jumlahnya).
- Status: kosong (belum ditukar), DITUKAR, MENANG, ZONK. Filter MENANG untuk daftar pemenang, centang **Diserahkan** saat hadiah diambil.
- Kelas tersimpan seperti `10 TKJ`, `11 Tata Boga`. Pemenang yang belum isi data bisa melengkapi dari tab Tiket.

## Mengatur hadiah (opsional, per kode)
- **Mau tentukan hadiah:** di kolom B (Hadiah tetap) pilih hadiah dari dropdown. Kode itu pasti dapat hadiah tersebut, persentase tidak dipakai (stok diabaikan).
- **Mau diundi:** kosongkan kolom B. Hadiah diundi memakai **Persen (%)** dan **Stok** di sheet Hadiah (ZONK dilewati).
- Boleh campur: sebagian kode ditentukan, sisanya diundi.

## Sheet "Hadiah"
- Baris 1-8 = urutan irisan roda. **Persen (%)**: peluang hadiah (30 = 30%), total idealnya 100 (cek kolom G). **Stok**: batas jumlah, kosong = tanpa batas.
- Nama yang mengandung "ZONK" dianggap tidak menang. Wajib ada minimal satu baris ZONK (dipakai untuk kode tidak terdaftar).

## Sheet "Pengaturan"
- B2 **Kode terdaftar bisa ZONK?** `TIDAK` (default, zonk 0%) atau `YA` (ZONK ikut diundi sesuai persen, seperti sistem lama).

## Kode yang tidak ada di sheet
Kode apa pun yang tidak terdaftar tetap bisa ditukar dan diputar, tapi hasilnya **otomatis ZONK** (tanpa form klaim). Tiap kode asal hanya sekali pakai dan tercatat di sheet **KodeLain**.
