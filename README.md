# 🛠️ SISTEM INFORMASI PEMINJAMAN ALAT BENGKEL (SIPAB) v2.0
### Platform Manajemen Inventaris & Peminjaman Alat Bengkel Berbasis Node.js & Vercel Serverless

Aplikasi web modern yang mendigitalisasi administrasi peminjaman dan pengembalian alat praktikum teknik/bengkel sekolah dengan alur verifikasi fisik bertingkat (*two-tier approval workflow*), pengerasan keamanan siber OWASP, dan kesiapan arsitektur *serverless cloud*.

---

## 👤 IDENTITAS PENGEMBANG
* **Nama Pengembang** : Yeyen Ai Nurhidayati
* **NIM**             : 20240810020
* **Mata Kuliah**     : Pemrograman Web & Cyber Security
* **Target Stack**    : Node.js (LTS v22.x, ES Modules) + Express.js + TiDB Cloud / MySQL + Vercel Blob CDN

---

## 📚 PANDUAN & DOKUMENTASI LENGKAP
Projek ini dilengkapi dengan paket dokumentasi serah-terima komprehensif untuk pengujian dan demonstrasi:

* 📖 [**`SETUP.md`**](file:///c:/xampp/htdocs/Projek_P.Web-Native/SETUP.md): Panduan langkah-demi-langkah (klik-demi-klik) untuk pemula: setup lokal, akun TiDB Cloud, GitHub, Vercel Blob, deployment, dan solusi error.
* 🧠 [**`docs/PENJELASAN-KODE.md`**](file:///c:/xampp/htdocs/Projek_P.Web-Native/docs/PENJELASAN-KODE.md): Penjelasan alur request-response, arsitektur modul, dan 9 alur kunci keamanan dengan analogi dunia nyata serta nomor baris kode.
* 🎓 [**`docs/QNA-DEMO.md`**](file:///c:/xampp/htdocs/Projek_P.Web-Native/docs/QNA-DEMO.md): 30 pertanyaan yang sering diajukan dosen penguji (hashing, CSRF, XSS, SQLi, IDOR, dsb.) beserta jawaban taktis 2-4 kalimat dan letak kodenya.
* 🔍 [**`docs/self-testing-before.md`**](file:///c:/xampp/htdocs/Projek_P.Web-Native/docs/self-testing-before.md): Laporan pengujian empiris kerentanan pada aplikasi PHP legacy (SEC-01 s/d SEC-06).
* 🛡️ [**`docs/self-testing-after.md`**](file:///c:/xampp/htdocs/Projek_P.Web-Native/docs/self-testing-after.md): Laporan empiris pembuktian seluruh mitigasi keamanan pada arsitektur Node.js baru (SEC-AFT-01 s/d SEC-AFT-16).
* 🤖 [**`docs/ai-usage-log.md`**](file:///c:/xampp/htdocs/Projek_P.Web-Native/docs/ai-usage-log.md): Catatan transparansi pengerjaan modul bersama asisten AI.

---

## ⚡ TEKNOLOGI & ARSITEKTUR
* **Backend:** Node.js (v22 LTS) dengan Express.js 4.21.2.
* **Frontend:** Template Admin Mazer (Bootstrap 5, Bootstrap Icons, DataTables) dikonversi 100% identik ke template engine EJS dengan *auto-escaping*.
* **Basis Data:** MariaDB / MySQL 10.4.x (Lokal XAMPP) dan TiDB Cloud Starter (Produksi, Region Singapore `ap-southeast-1` dengan koneksi TLS/SSL).
* **Manajemen Sesi:** Database-backed sessions (`express-mysql-session`) dengan cookie `httpOnly`, `sameSite: 'lax'`, dan `secure` pada produksi.
* **Storage Adapter:** Mengunggah ke Vercel Blob CDN saat produksi dan disk lokal saat development, divalidasi dengan *binary magic bytes* (JPG, PNG, WebP) dan limit 4MB.
* **Keamanan Tambahan:** Helmet (Content Security Policy khusus CDN terdaftar), Perlindungan Token CSRF, Database-Backed Rate Limiting (HTTP 429 Lockout setelah 20 kali kegagalan), Zod input validation, dan Audit Logging.

---

## 🚀 PANDUAN CEPAT MEMULAI (QUICK START)

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Verifikasi Otomatis Lingkungan & Database
Jalankan skrip pembantu setup yang akan memeriksa versi Node, konfigurasi `.env`, koneksi database, menjalankan migrasi, dan memeriksa kesehatan endpoint:
```bash
npm run setup
```

### 3. Menjalankan Server Lokal
```bash
npm run dev
```
Buka browser dan akses: `http://localhost:3000`

### 4. Menjalankan Pengujian Mandiri (Self-Testing)
Jalankan pengujian non-destruktif untuk memverifikasi keamanan dan fungsionalitas sistem (menghasilkan tabel screenshot-ready):
```bash
npm run selftest
```

---

## 👥 FITUR UTAMA SISTEM

### 1. 👨‍🎓 Siswa (Peminjam)
* **Registrasi Publik:** Mendaftar akun mandiri dengan server-enforced role `siswa` (mencegah eskalasi hak akses).
* **Dashboard Personal:** Menampilkan ringkasan alat yang sedang dipinjam secara aktif, riwayat barang yang sudah dikembalikan, dan tombol aksi cepat.
* **Pengajuan Pinjam:** Memilih alat bengkel dari katalog yang tersedia (stok > 0).
* **Ajukan Pengembalian Bersyarat:** Wajib mengunggah foto bukti fisik alat bengkel dan catatan kondisi fisik sebelum pengembalian dapat diproses.
* **Profil Saya:** Memperbarui nama dan foto profil dengan verifikasi kata sandi lama (anti-IDOR).

### 2. 👨‍🏫 Guru (Reviewer / Validator)
* **Dashboard Rekapitulasi:** Melihat statistik global alat, peminjaman aktif, badge counter notifikasi pending, dan tabel 5 aktivitas terbaru.
* **Review Pengembalian:** Memeriksa foto kondisi fisik alat yang dikembalikan siswa dalam modal gambar.
* **Tindakan Persetujuan (ACC):** Mengonfirmasi alat telah kembali dengan baik; stok barang otomatis bertambah (+1).
* **Tindakan Penolakan:** Menolak pengembalian disertai alasan spesifik (misal: "Alat kotor, harap dibersihkan dulu"); status peminjaman dikembalikan ke siswa untuk diperbaiki.
* **Laporan Transaksi:** Melihat dan mencetak laporan seluruh riwayat peminjaman.

### 3. 👑 Administrator (Pengelola Sistem)
* **Manajemen Pengguna (CRUD):** Mengelola akun seluruh aktor (Admin, Guru, Siswa).
* **Manajemen Alat Bengkel (CRUD):** Menambah, mengedit data, dan menghapus alat bengkel dengan upload gambar aman.
* **Audit Trail:** Memantau riwayat aktivitas penting pengguna melalui tabel `audit_logs`.

---

## 🤖 PERNYATAAN PENGGUNAAN AI (AI USAGE DISCLOSURE)

Sebagai wujud integritas dan transparansi akademik, pengembangan versi Node.js ini dilakukan secara *pair programming* bersama asisten AI (Google Antigravity).

### Kontribusi AI dalam Projek Ini:
1. **Analisis Kerentanan Kode Warisan:** Mengidentifikasi dan membuktikan secara empiris kerentanan keamanan pada kode PHP lama (SQL Injection, XSS, IDOR, dan plaintext passwords) yang didokumentasikan di `docs/self-testing-before.md`.
2. **Refactor Arsitektur:** Membangun fondasi Express.js berbasis ES Modules, koneksi pool MySQL dengan SSL TLS untuk TiDB Cloud, serta migrasi sesi ke database (`express-mysql-session`).
3. **Penerapan Standar Keamanan OWASP:** Menulis middleware anti-CSRF, database-backed rate limiter, Zod validation schema, sanitasi EJS escaping, Helmet CSP, dan penghapusan total plaintext passwords dengan bcrypt.
4. **Pembuatan Otomasi Pengujian:** Menulis skrip `setup.js`, `selftest.js`, dan suite uji otomatis yang menjamin integritas sistem secara berkelanjutan.

---

### Bagian Refleksi Mandiri Mahasiswa (Silakan Diisi oleh Pemilik Projek):

> *Catatan untuk Yeyen Ai Nurhidayati: Silakan isi bagian di bawah ini sesuai pemahaman dan pengalaman pribadi Anda sebelum mengumpulkan laporan atau mempresentasikannya di depan dosen.*

* **Refleksi Pembelajaran Pribadi Selama Pengerjaan Projek:**  
  `[Isi sendiri oleh mahasiswa: Ceritakan apa yang Anda pelajari mengenai perbedaan arsitektur PHP Native dengan Node.js Express, pentingnya prepared statement, dan bagaimana hashing bcrypt melindungi data pengguna...]`

* **Bagian Arsitektur atau Keamanan yang Paling Menantang untuk Dipahami:**  
  `[Isi sendiri oleh mahasiswa: Ceritakan bagian mana yang paling menantang bagi Anda, misalnya memahami siklus hidup token CSRF, mekanisme session fixation, atau bagaimana rate limiter serverless bekerja menggunakan database...]`

* **Rencana Pengembangan Lebih Lanjut di Masa Depan:**  
  `[Isi sendiri oleh mahasiswa: Sebutkan fitur yang ingin Anda kembangkan di masa depan, misalnya integrasi barcode scanner untuk peminjaman alat bengkel secara instan atau notifikasi WhatsApp/Telegram kepada guru...]`

---

*Hak Cipta © 2026 Yeyen Ai Nurhidayati (20240810020). Dibuat untuk pemenuhan tugas Pemrograman Web & Cyber Security.*
