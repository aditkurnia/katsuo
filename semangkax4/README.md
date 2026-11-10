# 🍉 Dashboard Aktivasi SoalPintar - SemangkaX4

Website dashboard modern untuk mengelola kode aktivasi dan perangkat siswa/pengawas pada aplikasi ujian **SoalPintar v.2 (SemangkaX4)**. 

Website ini dirancang khusus dengan **UI Navigasi Bawah (Bottom Navigation Bar) bergaya Instagram & TikTok** saat dibuka di HP, serta tampilan responsif yang elegan saat dibuka di Laptop / PC.

---

## 🚀 Fitur Unggulan

1. **Mobile Bottom Navigation (IG / TikTok Style)**:
   - Navigasi jempol mudah diakses di bagian bawah layar HP.
   - Tombol tengah melayang (*floating action*) untuk membuat kode aktivasi baru secara cepat.
2. **Pengelolaan Lisensi Lengkap**:
   - **Ringkasan Real-Time**: Total Kode, HP Terdaftar, Kode Siap Pakai, dan Kode Nonaktif.
   - **Pencarian Cepat & Filter**: Cari instan berdasarkan nama siswa, kode aktivasi, atau ID/Model HP.
   - **Ganti HP / Reset Perangkat (1-Click)**: Menghapus keterikatan ID HP lama agar kode bisa digunakan siswa di HP baru jika HP lama rusak/ganti.
   - **Kirim via WhatsApp**: Tombol instan untuk mengirim kode langsung ke chat WhatsApp siswa dengan format pesan otomatis yang rapi.
   - **Generate Massal**: Buat hingga 50 kode sekaligus untuk satu kelas dalam satu klik.
3. **Koneksi Langsung ke Google Apps Script**:
   - Terhubung langsung ke API Google Apps Script Anda tanpa database rumit.
   - Semua data tersimpan aman di Google Spreadsheet Anda.

---

## 📱 Cara Membuka Dashboard

### Cara 1: Buka Langsung di Laptop / PC (Offline & Online)
Cukup buka berkas **`index.html`** langsung menggunakan browser apa pun (Google Chrome, Microsoft Edge, Firefox, Safari).

### Cara 2: Akses dari HP (Bisa Dimana Saja)
Agar bisa dibuka langsung dari HP di mana pun Anda berada, Anda dapat meng-upload folder `dashboard` ini secara gratis ke layanan hosting instan:
- **GitHub Pages** (Gratis, cukup push ke repo GitHub dan aktifkan GitHub Pages).
- **Vercel / Netlify** (Gratis, cukup *drag-and-drop* folder `dashboard` ke [app.netlify.com/drop](https://app.netlify.com/drop)).
- Atau gunakan fitur live preview browser lokal.

---

## ⚠️ Langkah Penting: Pembaruan Google Apps Script (v2)

Agar dashboard bisa membaca daftar kode dan menambahkan data otomatis ke Google Sheets, pastikan skrip di Google Apps Script Anda sudah diperbarui ke versi v2:

1. Buka spreadsheet Anda di [Google Sheets](https://sheets.google.com).
2. Klik menu **Ekstensi (Extensions)** &rarr; **Apps Script**.
3. Buka file **`GoogleAppsScript_v2.gs`** di folder ini, salin seluruh kodenya, lalu tempel (*paste*) ke editor Apps Script menggantikan kode lama.
4. Klik tombol **Simpan (ikon Disket)**.
5. Klik **Terapkan (Deploy)** &rarr; **Kelola Penerapan (Manage deployments)**:
   - Klik ikon **Pensil (Edit)** pada deployment aktif.
   - Pada dropdown **Versi (Version)**, pilih **Versi baru (New version)**.
   - Klik **Terapkan (Deploy)**.

Dashboard Anda kini siap digunakan 100%!
