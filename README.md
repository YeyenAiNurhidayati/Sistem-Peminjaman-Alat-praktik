# Sistem Informasi Peminjaman Alat Bengkel (SIPAB v2.0)
Aplikasi Manajemen Inventaris dan Peminjaman Alat Bengkel Berbasis Node.js dan Serverless Cloud

Aplikasi web Sistem Informasi Peminjaman Alat Bengkel (SIPAB v2.0) dikembangkan untuk mendigitalkan administrasi peminjaman dan pengembalian perkakas praktikum pada bengkel Teknik Kendaraan Ringan (TKR) SMKN 5 Kuningan. Proyek ini merupakan hasil modernisasi dan pengerasan keamanan (*security hardening*) dari sistem monolitik PHP Native menuju arsitektur cloud serverless modern yang memenuhi standar keamanan OWASP Top 10.

---

## Identitas Pengembang
* **Nama**: Yeyen Ai Nurhidayati
* **NIM**: 20240810020
* **Program Studi**: Cyber Security
* **Mata Kuliah**: Cyber Security

---

## Tautan Akses & Repositori
* **Aplikasi Web Aktif (HTTPS)**: [https://sistem-peminjaman-alat-praktik.vercel.app/](https://sistem-peminjaman-alat-praktik.vercel.app/)
* **Repositori GitHub**: [https://github.com/YeyenAiNurhidayati/Sistem-Peminjaman-Alat-praktik-](https://github.com/YeyenAiNurhidayati/Sistem-Peminjaman-Alat-praktik-)
* **API Healthcheck**: [https://sistem-peminjaman-alat-praktik.vercel.app/api/health](https://sistem-peminjaman-alat-praktik.vercel.app/api/health)

### Kredensial Akun Pengujian (Demo)
| Peran (Role) | Username | Password | Deskripsi Wewenang |
| :--- | :--- | :--- | :--- |
| Administrator | `admin` | `password` | Akses penuh inventaris alat, manajemen pengguna, audit log, dan laporan. |
| Guru Praktikum | `guru` | `password` | Verifikasi fisik alat, persetujuan pengembalian, dan ekspor laporan. |
| Siswa | `siswa` | `password` | Peminjaman alat, unggah foto bukti pengembalian, dan pengelolaan profil. |

---

## Arsitektur dan Tumpukan Teknologi
Aplikasi dibangun menggunakan tumpukan teknologi modern yang dirancang untuk keandalan dan skalabilitas tinggi:
* **Runtime**: Node.js versi 22 LTS (ES Modules)
* **Web Framework**: Express.js 4.21
* **Template Engine**: EJS (Embedded JavaScript) dengan contextual HTML escaping
* **Basis Data**: TiDB Cloud Distributed MySQL (Environment Produksi dengan TLS Encrypted Connection) dan MariaDB/MySQL (Environment Pengembangan Lokal)
* **Penyimpanan Sesi**: Database-backed session store (`express-mysql-session`) dengan konfigurasi cookie `HttpOnly`, `SameSite=Lax`, dan `Secure`
* **Infrastruktur Hosting**: Vercel Serverless Function (Region: `sin1` Singapore)
* **Penyimpanan Berkas**: Adapter penyimpanan ganda (Vercel Blob Storage pada mode produksi dan disk lokal pada mode pengembangan) dengan validasi tipe berkas biner dan batas ukuran berkas 4 MB

---

## Fitur Utama Sistem

### 1. Modul Siswa (Peminjam)
* **Registrasi Publik Mandiri**: Pendaftaran akun siswa dengan penegakan peran `role=siswa` di sisi server untuk mencegah eskalasi hak akses (*privilege escalation*).
* **Katalog Alat**: Eksplorasi daftar perkakas bengkel yang tersedia secara *real-time*.
* **Pengajuan Pinjaman**: Pengajuan peminjaman alat praktikum secara langsung.
* **Pengembalian Bersyarat**: Alur pengembalian alat yang mewajibkan siswa mengunggah bukti foto fisik kondisi alat dan catatan pengembalian.
* **Manajemen Profil Mandiri**: Pembaruan data pribadi siswa dengan proteksi kepemilikan objek (*anti-IDOR*).

### 2. Modul Guru (Verifikator Praktikum)
* **Dashboard Monitoring**: Pemantauan status sirkulasi perkakas dan transaksi peminjaman yang sedang berjalan.
* **Verifikasi Pengembalian**: Pemeriksaan foto bukti fisik kondisi alat sebelum memberikan persetujuan.
* **Persetujuan dan Penolakan**: Pemberian konfirmasi penerimaan alat (stok bertambah otomatis) atau penolakan dengan catatan perbaikan untuk siswa.
* **Laporan Terpadu**: Akses rekapitulasi data peminjaman dengan filter status dan rentang tanggal.

### 3. Modul Administrator (Pengelola Sistem)
* **Manajemen Inventaris Alat**: Pengelolaan data perkakas bengkel (CRUD) dengan mekanisme *soft-delete* guna menjaga integritas riwayat transaksi.
* **Manajemen Pengguna**: Pengelolaan akun seluruh pengguna sistem (Admin, Guru, Siswa).
* **Audit Trail**: Pemantauan jejak digital aktivitas sistem melalui tabel `audit_logs` untuk keperluan forensik keamanan.

---

## Implementasi Pengamanan Aplikasi Web (Security Hardening)

1. **Hashing Password Satu Arah (Bcrypt)**
   Seluruh kredensial pengguna dienkripsi menggunakan algoritma hashing Bcrypt (salt rounds = 10). Jalur verifikasi plaintext telah dihapus menyeluruh dari kode sumber.
2. **Mitigasi SQL Injection**
   Semua kueri ke basis data menggunakan *Prepared Statements* (`pool.execute`) dengan pengikatan parameter (*parameter binding*). Validasi skema input juga diperkuat menggunakan pustaka Zod.
3. **Mitigasi Cross-Site Scripting (XSS)**
   Penyajian data dinamis pada antarmuka EJS menggunakan mekanisme *contextual escaping* (`<%= %>`), sehingga seluruh tag berbahaya dinetralkan menjadi entitas teks aman.
4. **Proteksi Cross-Site Request Forgery (CSRF)**
   Setiap formulir mutasi data (POST, PUT, DELETE) dilindungi token CSRF berbasis sesi yang dihasilkan melalui algoritma kriptografi acak (32 byte). Akses mutasi data melalui metode GET telah dinonaktifkan secara ketat (HTTP 405).
5. **Kontrol Akses Berbasis Peran (RBAC) & Anti-IDOR**
   Setiap rute dilindungi middleware autentikasi dan otorisasi berjenjang. Pengecekan kepemilikan data diterapkan secara eksplisit untuk mencegah manipulasi data antar-pengguna.
6. **Rate Limiting Berbasis Basis Data**
   Sistem pencatat frekuensi permintaan login disimpan di basis data `rate_limits`, memungkinkan perlindungan *brute-force* tetap aktif secara terdistribusi pada lingkungan serverless. Akun dikunci otomatis selama 15 menit setelah 20 kali kegagalan berturut-turut (HTTP 429).
7. **Keamanan Penyimpanan Berkas Foto**
   Bukti foto disimpan secara privat dengan penamaan acak 128-bit (`crypto.randomBytes(16)`). Pengunduhan foto diatur melalui rute proxy terautentikasi dengan verifikasi hak akses.
8. **Mitigasi CSV Formula Injection & Pembuatan PDF Server-Side**
   Fitur ekspor CSV menyematkan UTF-8 BOM dan melakukan sanitasi tanda petik tunggal pada karakter formula (`=`, `+`, `-`, `@`). Modul PDF menghasilkan dokumen laporan langsung di sisi server menggunakan *pdfkit*.

---

## Panduan Instalasi Lokal

### Prasyarat
* Node.js (minimal versi 22 LTS)
* MySQL / MariaDB (XAMPP atau server basis data lokal)
* Git

### Langkah Menjalankan Aplikasi
1. Kloning repositori:
   ```bash
   git clone https://github.com/YeyenAiNurhidayati/Sistem-Peminjaman-Alat-praktik-.git
   cd Sistem-Peminjaman-Alat-praktik-
   ```
2. Pasang paket dependensi:
   ```bash
   npm install
   ```
3. Konfigurasi variabel lingkungan:
   Salin `.env.example` menjadi `.env`, lalu sesuaikan kredensial basis data lokal Anda:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=peminjaman_alat
   DB_SSL=false
   SESSION_SECRET=kunci_rahasia_sesi_lokal_2026
   ```
4. Inisialisasi basis data dan seed awal:
   ```bash
   npm run setup
   ```
5. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses melalui peramban di `http://localhost:3000`.

---

## Pengujian Mandiri Keamanan (Self-Testing)
Proyek ini dilengkapi skrip pengujian keamanan otomatis untuk memverifikasi keandalan seluruh lapisan proteksi:
* Menjalankan suite pengujian mandiri utama:
  ```bash
  npm run selftest
  ```
* Menjalankan pengujian konkurensi stok (race condition prevention):
  ```bash
  npm run test:concurrency
  ```
* Menjalankan pengujian modul laporan (RBAC, PDF, CSV sanitization):
  ```bash
  npm run test:module5
  ```

---

## Transparansi Penggunaan Perangkat Bantu AI

Pengembangan proyek modernisasi dan pengerasan keamanan Sistem Informasi Peminjaman Alat Bengkel (SIPAB v2.0) dilakukan dengan memanfaatkan perangkat bantu kecerdasan buatan, yaitu **Antigravity AI Coding Assistant (Google DeepMind)**, dengan pembagian peran yang terukur dan bertanggung jawab:

### Pembagian Peran dan Tanggung Jawab
* **Mahasiswa Pengembang (Yeyen Ai Nurhidayati)**:
  * Bertindak sebagai *Lead Developer* dan *System Architect* yang merancang arsitektur sistem, aturan bisnis peminjaman bengkel TKR, serta pemodelan skema basis data relasional (7 tabel).
  * Melakukan konfigurasi infrastruktur cloud secara langsung pada platform Vercel Edge dan TiDB Cloud.
  * Melakukan penelaahan kode (*code review*), pengujian fungsional manual pada peramban, serta validasi integritas data.
* **Peran AI Coding Assistant**:
  * Berfungsi sebagai mitra pemrograman (*pair programming partner*) untuk membantu pemindaian awal kerentanan keamanan pada kode legacy PHP (OWASP Top 10).
  * Membantu penyusunan kerangka kerja (*scaffolding*) controller Express.js ESM dan skema validasi Zod.
  * Membantu perancangan skrip pengujian mandiri otomatis (*automated security test runner*).

### Contoh Prompt Utama yang Digunakan
1. **Analisis Kerentanan Awal**:
   > *"Identifikasi potensi kerentanan keamanan OWASP Top 10 pada modul autentikasi dan peminjaman berbasis PHP legacy ini, khususnya terkait penanganan password dan parameter query SQL."*
2. **Perancangan Mekanisme Rate Limiter Serverless**:
   > *"Bantu rancang arsitektur rate limiting login yang kompatibel dengan karakteristik stateless pada Vercel Serverless Function menggunakan tabel MySQL terpusat untuk menyimpan counter kegagalan."*
3. **Penyusunan Skrip Pengujian Mandiri Otomatis**:
   > *"Buatkan skrip otomasi pengujian mandiri (self-testing runner) berbasis Node.js yang memverifikasi mitigasi SQL Injection, XSS escaping, proteksi CSRF, dan kontrol akses RBAC secara empiris."*
