# Catatan Penggunaan AI & Panduan Arsitektur Sistem (AI Usage Log)

**Projek:** Sistem Informasi Peminjaman Alat Bengkel (SIPAB)  
**Pengembang:** Yeyen Ai Nurhidayati (NIM: 20240810020)  
**Mitra Pair Programming:** Antigravity AI Assistant  
**Mata Kuliah:** Pemrograman Web & Cyber Security  
**Versi:** 2.0.0 (Node.js Express + TiDB / Vercel Ready)  

---

## 🎯 1. Ringkasan Pekerjaan Per Modul

Dokumen ini mencatat kontribusi implementasi AI serta arsitektur teknis yang wajib dipahami oleh mahasiswa untuk keperluan presentasi dan ujian projek.

### Modul 0: Fondasi Serverless Vercel & TiDB Cloud
* **Yang Dikerjakan AI:**
  1. Menyiapkan arsitektur Node.js Express (ES Modules) berbasis Node LTS (`>=22.0.0`).
  2. Mengonfigurasi `vercel.json` dengan region `sin1` (Singapore) agar memiliki latensi minimal terhadap cluster TiDB Cloud Starter di Singapura (`ap-southeast-1`).
  3. Mengonfigurasi connection pool MySQL2 (`src/config/database.js`) dengan dukungan SSL `rejectUnauthorized: true` menggunakan CA certificate bawaan Node/OS untuk TiDB Cloud.
  4. Menyiapkan database session store (`express-mysql-session`) di `src/config/session.js` agar aplikasi bersifat stateless dan tidak bergantung pada disk/memori lokal serverless.
  5. Menyiapkan skema basis data bersih di `database/schema.sql` dan data demo realistis di `database/seed-demo.sql` dengan proteksi `FOREIGN_KEY_CHECKS`.

### Modul 1: Layout Core, Autentikasi Bcrypt, Registrasi Siswa, dan Pengerasan Keamanan
* **Yang Dikerjakan AI:**
  1. **Konversi Template UI (Identik Piksel):**
     - Mengonversi `layout/header.php`, `layout/sidebar.php`, dan `layout/footer.php` ke template engine EJS (`src/views/layout/`).
     - Menyusun URL absolut berbasis root (`/dashboard`, `/alat`, `/peminjaman`, `/users`, `/laporan`, `/profil`, `/auth/logout`) menggantikan relative path PHP (`../`).
     - Menambahkan badge notifikasi dinamis pada menu peminjaman untuk guru/admin jika ada peminjaman berstatus `pending` atau `menunggu_pengembalian`.
     - Menginjeksikan token CSRF global secara otomatis ke setiap panggilan AJAX `fetch` melalui interceptor di `src/views/layout/footer.ejs`.
  2. **Autentikasi Ketat (Pure Bcrypt Only):**
     - Membangun `src/controllers/authController.js` dengan verifikasi password murni `bcrypt.compare()`.
     - Menghapus total seluruh fallback plaintext. Menjalankan skrip migrasi sekali jalan `scripts/migrate-passwords.js` untuk meng-hash seluruh akun lama.
     - Menerapkan Session Regeneration (`req.session.regenerate()`) saat login sukses guna mencegah serangan Session Fixation.
  3. **Halaman Registrasi Siswa Publik (`/auth/register`):**
     - Membuat tampilan registrasi identik dengan login Mazer UI.
     - Server secara ketat memaksakan `role = 'siswa'`, mengabaikan input role apa pun dari sisi klien untuk mencegah eskalasi hak akses (*Privilege Escalation*).
     - Validasi skema input dengan Zod (panjang password minimal 6 karakter, format username alfanumerik).
  4. **Proteksi CSRF (Cross-Site Request Forgery):**
     - Membangun middleware `src/middlewares/csrfMiddleware.js` berbasis token kriptografis acak per sesi.
  5. **Rate Limiting Berbasis Basis Data (Serverless Ready):**
     - Membangun middleware `src/middlewares/dbRateLimiter.js` yang menyimpan counter percobaan login di tabel `rate_limits`.
     - Mengunci sementara akun/IP selama 15 menit (HTTP 429) jika terjadi 20 kali percobaan login gagal berturut-turut.
     - Mencatat event `LOGIN_FAILED` ke tabel `audit_logs` tanpa pernah menyimpan atau membocorkan password pengguna.

### Modul 2: Dashboard & Profil Saya (Storage Adapter & Anti-IDOR)
* **Yang Dikerjakan AI:**
  1. **Dashboard Berbasis Role (100% Identik Piksel):**
     - Membangun `src/controllers/dashboardController.js` dan `src/views/dashboard.ejs`.
     - Mengisolasi statistik: Role Siswa hanya melihat pinjaman aktif dan riwayat miliknya sendiri beserta tombol aksi cepat. Role Guru dan Admin melihat ringkasan inventaris global, badge counter pending, serta tabel 5 aktivitas terbaru.
     - Mengambil foto profil pengguna atau fallback otomatis ke UI Avatars.
  2. **Profil Pengguna & Proteksi Anti-IDOR Mutlak:**
     - Membangun `src/controllers/profilController.js` dan `src/views/profil/index.ejs`.
     - Menghapus kerentanan IDOR warisan PHP: `id` pengguna diambil eksklusif dari `req.session.user_id`, mengabaikan parameter form atau URL query manipulatif dari penyerang.
  3. **Verifikasi Kata Sandi Lama Saat Mengubah Password:**
     - Wajib memasukkan kata sandi lama saat mengganti kata sandi.
     - Memvalidasi kata sandi lama via `bcrypt.compare()` sebelum menghasilkan hash baru dengan salt rounds 10.
  4. **Universal Storage Adapter (`src/utils/storageAdapter.js`):**
     - Serverless Ready: otomatis mendeteksi ketersediaan token `BLOB_READ_WRITE_TOKEN` untuk mengunggah ke Vercel Blob (CDN Cloud), dengan fallback ke penyimpanan disk lokal di development.
     - Validasi Magic Bytes: memverifikasi header biner file asli (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, WebP: `RIFF...WEBP`) untuk menangkal file berbahaya / skrip web berkedok gambar.
     - Batas ukuran upload ketat 4MB dan nama file diacak menggunakan `crypto.randomBytes(8)` untuk mencegah Path Traversal.

### Modul 3: Manajemen Alat / Inventaris & Filter Kategori
* **Yang Dikerjakan AI:**
  1. **Manajemen Alat & Filter Kategori (`src/controllers/alatController.js` & `src/views/alat/index.ejs`):**
     - Membangun antarmuka inventaris 100% identik piksel dengan layout Mazer lama.
     - Menambahkan Filter Kategori interaktif (Semua, Hand Tools, Power Tools, SST) dengan badge hitungan data aktual.
     - Menerapkan isolasi otorisasi RBAC ketat: route `/alat` hanya dapat diakses oleh role Admin (`cekRole(['admin'])`), sedangkan Siswa dan Guru langsung ditolak dengan HTTP 403 Forbidden.
  2. **Mitigasi Total SQL Injection pada Inventaris:**
     - Menghilangkan interpolasi string SQL warisan PHP pada pencarian dan filter kategori.
     - Seluruh query dikonstruksi secara dinamis namun dieksekusi dengan Prepared Statements (`pool.execute`) dan parameter terpisah.
  3. **Validasi Input Zod & Magic Bytes Upload Foto Alat:**
     - Memvalidasi skema input (nama alat, kategori enum, stok non-negatif, kondisi enum) menggunakan Zod.
     - Memeriksa keaslian biner foto alat menggunakan `validateImageMagicBytes` guna mencegah pengunggahan file berbahaya / webshell PHP berkedok gambar `.jpg`.
  4. **Integritas Referensial Penghapusan Alat:**
     - Sebelum menghapus data barang, server memverifikasi apakah ada transaksi peminjaman aktif berstatus `pending`, `disetujui`, atau `menunggu_pengembalian`. Jika ada, penghapusan ditolak secara aman dengan HTTP 400.
  5. **Kompatibilitas Penuh API Legacy (`/api/alat` & `/api/alat.php`):**
     - Menyediakan Universal Action Dispatcher untuk aksi `get_all`, `get_one`, `create`, `update`, dan `delete` yang tetap kompatibel dengan skrip klien warisan PHP.
     - Menghubungkan seluruh form modal dan AJAX dengan proteksi CSRF otomatis.

### Modul 4: Alur Peminjaman, Anti-Race Condition Stok, State Machine, & Anti-IDOR
* **Yang Dikerjakan AI:**
  1. **Preservasi Semantik Stok PHP Asli:**
     - Meniru semantik PHP asli secara persis: stok tidak dikurangi saat pengajuan (`pending`), dikurangi 1 saat disetujui Guru (`disetujui`), tidak bertambah saat siswa unggah bukti (`menunggu_pengembalian`), dan dipulihkan +1 saat Guru menyetujui pengembalian fisik (`kembali`).
  2. **Transaksi Atomik & Kunci Baris Anti-Race Condition:**
     - Membungkus mutasi stok dalam transaksi MySQL dengan kunci baris `SELECT ... FOR UPDATE` dan pembaruan kondisional `UPDATE barang SET stok = stok - 1 WHERE id = ? AND stok >= 1 AND deleted_at IS NULL`.
     - Terbukti secara empiris: saat 15 request paralel serentak memperebutkan alat dengan sisa stok 1, tepat 1 transaksi berhasil dan 14 lainnya dibatalkan, dengan sisa stok akhir tepat 0 (tidak pernah negatif).
  3. **Immutability State Machine:**
     - Setiap pembaruan status memvalidasi status asal (`WHERE id = ? AND status = 'status_asal'`). Replay request (misal tombol Setuju diklik ganda) langsung ditolak dengan HTTP 409 Conflict.
  4. **Proteksi Anti-IDOR Pengembalian & Akses Foto Bukti:**
     - Memeriksa kepemilikan numerik `Number(data.id_user) === Number(req.session.user_id)` pada pembukaan form pengembalian (`/peminjaman/kembali/:id`), eksekusi unggah bukti, hingga endpoint pengambilan foto bukti (`/peminjaman/bukti/:filename`). Siswa lain ditolak dengan HTTP 403 Forbidden.
  5. **Validasi Magic Bytes & Batas 4MB Foto Bukti:**
     - Menggunakan `storageAdapter` untuk memvalidasi byte biner foto pengembalian (JPG, PNG, WebP) dan nama file acak kriptografis.
  6. **Pencatatan Audit Trail Otomatis:**
     - Mencatat setiap transisi status (`ajukan_peminjaman`, `acc_peminjaman`, `tolak_peminjaman`, `ajukan_pengembalian`, `acc_pengembalian`, `tolak_pengembalian`) ke tabel `audit_logs`.

---

## 🔑 2. File Kunci & Konsep Teknis yang Wajib Dipahami Mahasiswa

Sebagai pengembang utama sistem, berikut adalah file-file inti yang perlu Anda pahami alurnya saat sesi tanya-jawab atau demonstrasi:

| Nama File | Peran Utama | Konsep Kunci yang Perlu Dijelaskan |
|---|---|---|
| [`src/app.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/app.js) | Entrypoint aplikasi Express | Pipeline middleware, Content Security Policy (Helmet) untuk CDN Mazer/Bootstrap/DataTables, dan `app.set('trust proxy', 1)` untuk reverse proxy Vercel. |
| [`src/config/database.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/config/database.js) | Koneksi Basis Data | Menggunakan `mysql2/promise` connection pool. Mendukung SSL CA otomatis ketika variabel `DB_SSL=true` aktif untuk TiDB Cloud. |
| [`src/config/session.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/config/session.js) | Manajemen Sesi Serverless | Menyimpan sesi di tabel MySQL `sessions` melalui `express-mysql-session`. Cookie dikonfigurasi `httpOnly: true`, `sameSite: 'lax'`, dan `secure: true` pada mode produksi. |
| [`src/middlewares/csrfMiddleware.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/middlewares/csrfMiddleware.js) | Proteksi CSRF | Membuat token acak 32-byte pada sesi pengguna, memvalidasi header `X-CSRF-Token` atau field form `_csrf` pada metode POST, PUT, dan DELETE. Menolak request manipulasi dengan HTTP 403. |
| [`src/middlewares/dbRateLimiter.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/middlewares/dbRateLimiter.js) | Anti Brute-Force Serverless | Menggantikan memori lokal dengan tabel MySQL `rate_limits`. Menerapkan kunci kombinasi `IP + Username`, jendela waktu 15 menit, dan status lockout HTTP 429 setelah 20 kali kegagalan. |
| [`src/middlewares/authMiddleware.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/middlewares/authMiddleware.js) | Kontrol Akses & Otorisasi | `cekLogin`: Memeriksa apakah `req.session.login` aktif.<br>`cekRole([...])`: Memeriksa apakah role pengguna memenuhi daftar role yang diizinkan (mencegah siswa mengakses fitur admin/guru).<br>`withPendingCount`: Menghitung badge notifikasi persetujuan. |
| [`src/controllers/authController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/authController.js) | Logika Bisnis Autentikasi | Validasi input dengan Zod, pengecekan password murni dengan `bcrypt.compare`, mitigasi SQL Injection dengan prepared statements (`pool.execute`), regenerasi ID sesi, dan logging audit trail. |
| [`src/controllers/dashboardController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/dashboardController.js) | Agregasi Data Dashboard | Menghitung statistik inventaris dan peminjaman dengan filter role (Siswa terisolasi dari rekap publik). Menampilkan aktivitas terbaru. |
| [`src/controllers/profilController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/profilController.js) | Manajemen Profil & Ganti Password | Mengeliminasi IDOR dengan membaca ID dari sesi saja. Wajib verifikasi password lama via bcrypt sebelum password baru disimpan. |
| [`src/controllers/alatController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/alatController.js) | Inventaris Alat & Filter Kategori | CRUD inventaris bengkel, filter kategori & pencarian SQL aman, validasi Zod + Magic Bytes, proteksi referensial hapus alat, dan kompatibilitas API legacy. |
| [`src/controllers/peminjamanController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/peminjamanController.js) | Alur Peminjaman & Pengembalian | Transaksi atomik anti-race condition stok (`FOR UPDATE`), immutability state machine, anti-IDOR pengembalian & foto bukti, dan audit logging transisi status. |
| [`src/routes/peminjamanRoutes.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/routes/peminjamanRoutes.js) | Rute & Otorisasi Peminjaman | Pipeline middleware RBAC peminjaman, proteksi unggah Multer 4MB, dan penolakan mutasi via GET (HTTP 405). |
| [`src/utils/storageAdapter.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/utils/storageAdapter.js) | Storage Cloud & Validasi Biner | Otomatis beralih antara Vercel Blob (production) dan penyimpanan lokal (development). Validasi Magic Bytes anti file spoofing dan pembatasan 4MB. |

---

## 🔍 3. Panduan Verifikasi Manual Pengembang (Tanpa Membuka Rahasia)

Anda dapat membuktikan seluruh fitur dan keamanan sistem secara langsung di komputer Anda dengan langkah-langkah berikut:

### 1. Menjalankan Server Node.js Lokal
Pastikan MySQL XAMPP berjalan di port 3306, lalu jalankan:
```bash
npm run dev
```
Buka peramban di `http://localhost:3000`.

### 2. Menguji Registrasi Siswa Baru
1. Buka `http://localhost:3000/auth/register`.
2. Daftarkan akun baru (misal Nama: `Siswa Baru Uji`, Username: `siswabaru`, Password: `PasswordKuat123!`).
3. Periksa database MySQL: user tersimpan dengan role `siswa` dan password ter-enkripsi hash `$2a$10$...`.
4. Masuk ke `http://localhost:3000/auth/login` menggunakan akun baru tersebut.

### 3. Menjalankan Suite Pengujian Otomatis
Jalankan perintah ini di terminal:
```bash
# Uji seluruh skenario OWASP (CSRF, SQLi, XSS, Role Tampering, dsb.)
node scripts/test-security-suite.js

# Uji ketat penolakan password plaintext
node scripts/test-no-plaintext.js

# Uji penolakan brute force (429 Lockout setelah 20 kali percobaan gagal)
node scripts/test-rate-limit.js
```
Semua perintah di atas akan menampilkan status hijau `PASSED (LOLOS)` secara otomatis.
