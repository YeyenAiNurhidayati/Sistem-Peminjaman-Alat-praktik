# Laporan Uji Keamanan Aplikasi Node.js (Self-Testing After Migration)

**Projek:** Sistem Informasi Peminjaman Alat Bengkel (SIPAB)  
**Target:** Versi Node.js (Express.js LTS + MySQL2 / TiDB Cloud Ready)  
**Lingkungan Uji:** Node.js v24.11.1 + Express 4.21.2 + MariaDB/MySQL 10.4.32 XAMPP  
**Waktu Pengujian:** 15 November 2026  
**Status Pengujian:** 100% DIUJI LANGSUNG & OTOMATIS (Semua pengujian lolos secara empiris)  
**Penyusun:** Senior Software & Security Engineer  

---

## 📌 1. Tabel Ringkasan Verifikasi Keamanan "Sesudah" (Post-Migration)

| ID | Skenario Pengujian | Cara Uji | Hasil Nyata yang Diamati | Perbaikan yang Diterapkan | Status |
|---|---|---|---|---|---|
| **SEC-AFT-01** | Akses route terlindungi tanpa login | `GET /dashboard` tanpa cookie sesi | HTTP 302 Redirect ke `/auth/login` | Middleware `cekLogin` memvalidasi `req.session.login` | **LOLOS (PASSED)** |
| **SEC-AFT-02** | Proteksi CSRF pada request mutasi | `POST /auth/login` tanpa token & dengan token palsu | HTTP 403 Forbidden | Middleware `csrfProtection` memvalidasi token sesi | **LOLOS (PASSED)** |
| **SEC-AFT-03** | Pencegahan Privilege Escalation pada Register | `POST /auth/register` menyertakan `role=admin` di body | User tersimpan di DB dengan `role='siswa'` | Server mengabaikan input form role, server-enforced `const role = 'siswa'` | **LOLOS (PASSED)** |
| **SEC-AFT-04** | Validasi Password Lemah pada Register | `POST /auth/register` dengan password `123` (< 6 karakter) | Form ditolak, pesan validasi "Password minimal 6 karakter" | Schema Zod `z.string().min(6)` | **LOLOS (PASSED)** |
| **SEC-AFT-05** | Penanganan Username Duplikat | `POST /auth/register` dengan username yang sudah terdaftar (`admin`) | Ditolak dengan pesan "Username sudah digunakan!" | Pengecekan pra-insert prepared statement `SELECT id FROM users WHERE username = ?` | **LOLOS (PASSED)** |
| **SEC-AFT-06** | Proteksi XSS (Output Encoding) | `POST /auth/login` dengan input `<script>alert("xss")</script>` | Tag ter-escape menjadi `&lt;script&gt;` | Seluruh rendering EJS menggunakan `<%= %>` yang otomatis meng-escape entitas HTML | **LOLOS (PASSED)** |
| **SEC-AFT-07** | Proteksi SQL Injection | `POST /auth/login` dengan payload `' OR '1'='1' -- ` | Gagal login, respons aman "Username tidak ditemukan!" | Parameterized Queries `pool.execute('SELECT ... WHERE username = ?', [username])` | **LOLOS (PASSED)** |
| **SEC-AFT-08** | Penghapusan Dukungan Plaintext Password | Set password DB menjadi teks polos, lalu coba login | Ditolak dengan "Password salah!" | Hanya memakai `bcrypt.compare()`, jalur fallback plaintext dihapus total | **LOLOS (PASSED)** |
| **SEC-AFT-09** | Rate Limiting Berbasis Database (Serverless Ready) | 20 percobaan login gagal berturut-turut | Percobaan ke-21 mengembalikan HTTP 429 Lockout 15 menit | Middleware `dbRateLimiter` mencatat di tabel MySQL `rate_limits` & `audit_logs` tanpa password | **LOLOS (PASSED)** |
| **SEC-AFT-10** | Keamanan Cookie & Reverse Proxy Trust | Request dengan header `X-Forwarded-Proto: https` | Cookie `HttpOnly`, `SameSite=lax`, siap `Secure` | `app.set('trust proxy', 1)` aktif dan session store berbasis MySQL | **LOLOS (PASSED)** |
| **SEC-AFT-11** | Otorisasi Statistik Dashboard Berdasarkan Role | Render dashboard role siswa vs admin | Siswa hanya melihat pinjaman miliknya; Admin melihat rekap global & daftar aktivitas | `dashboardController` membatasi query berdasarkan `req.session.role` dan `id_user` | **LOLOS (PASSED)** |
| **SEC-AFT-12** | Pencegahan IDOR pada Pembaruan Profil | Siswa mengirim POST `/profil` dengan `id=1` (ID Admin) | Akun admin tidak tersentuh; server hanya mengubah ID dari sesi | `profilController` mengambil `userId` eksklusif dari `req.session.user_id` | **LOLOS (PASSED)** |
| **SEC-AFT-13** | Validasi Password Lama Saat Ganti Password | Form ganti password tanpa/salah kata sandi lama | Ditolak dengan pesan kesalahan spesifik | Verifikasi `bcrypt.compare(old_password, user.password)` sebelum memproses hash baru | **LOLOS (PASSED)** |
| **SEC-AFT-14** | Validasi Magic Bytes File Upload (Anti-Spoofing) | Upload skrip/teks berkedok ekstensi `.jpg` | Ditolak: "Format file tidak didukung!" | `validateImageMagicBytes` memverifikasi header biner file biner asli | **LOLOS (PASSED)** |
| **SEC-AFT-15** | Batas Ukuran File Upload Max 4MB | Upload file dengan ukuran > 4MB | Ditolak oleh limitasi Multer & Storage Adapter | Konfigurasi batas 4MB di Multer & `storageAdapter.js` | **LOLOS (PASSED)** |
| **SEC-AFT-16** | Nama File Upload Acak (Anti Path Traversal) | Upload file dengan nama `../../malicious.php.jpg` | Nama diubah menjadi `[timestamp]_[hex].ext` | Nama file digenerate dari `crypto.randomBytes(8)` | **LOLOS (PASSED)** |
| **SEC-AFT-17** | Kontrol Akses RBAC pada `/alat` | Siswa & Guru mengakses `GET /alat` | HTTP 403 Forbidden | Middleware `cekRole(['admin'])` mengisolasi inventaris | **LOLOS (PASSED)** |
| **SEC-AFT-18** | Ketahanan SQL Injection pada Filter Alat | Query `?kategori=' OR '1'='1' -- &search=' UNION ...` | Ditolak aman, tidak ada error SQL atau data bocor | Parameterized Query `pool.execute` dengan array parameter terpisah | **LOLOS (PASSED)** |
| **SEC-AFT-19** | Validasi Magic Bytes Foto Alat Bengkel | Upload file teks/skrip berkedok `.jpg` pada form alat | Ditolak: "Format file tidak didukung!" | `validateImageMagicBytes` memeriksa header biner asli file | **LOLOS (PASSED)** |
| **SEC-AFT-20** | Integritas Referensial Penghapusan Alat | Hapus alat yang sedang dipinjam (status: pending/disetujui) | HTTP 400: "Alat tidak dapat dihapus karena masih ada transaksi peminjaman aktif!" | Pengecekan aktif di tabel `peminjaman` sebelum eksekusi `DELETE` | **LOLOS (PASSED)** |
| **SEC-AFT-21** | Kompatibilitas API Legacy & CSRF | Panggilan AJAX `/api/alat` & `/api/alat.php` | HTTP 200 JSON respons standar | Universal Dispatcher `handleApiAlat` dan CSRF header injection | **LOLOS (PASSED)** |
| **SEC-AFT-22** | Kontrol Akses RBAC pada Alur Peminjaman | Siswa akses `/peminjaman/review` dan `/acc` | HTTP 403 Forbidden | Middleware `cekRole(['guru', 'admin'])` | **LOLOS (PASSED)** |
| **SEC-AFT-23** | Semantik Stok & Siklus Peminjaman Lengkap | Uji siklus: Ajukan -> ACC -> Kembali -> Review ACC | Stok berkurang & pulih tepat 1 unit, tidak berkurang saat pending | Transaksi MySQL atomik & conditional update | **LOLOS (PASSED)** |
| **SEC-AFT-24** | Ketahanan Replay State Machine | Replay request ACC dan Review dua kali | HTTP 409 Conflict, stok tidak berubah ganda | UPDATE berstatus asal `WHERE id = ? AND status = ?` | **LOLOS (PASSED)** |
| **SEC-AFT-25** | Proteksi Anti-IDOR Peminjaman & Bukti Foto | Siswa B akses form, submit kembali, atau buka foto Siswa A | HTTP 403 Forbidden, data Siswa A tidak tersentuh | Pengecekan numerik `Number(id_user) === Number(session.user_id)` | **LOLOS (PASSED)** |
| **SEC-AFT-26** | Validasi Magic Bytes Foto Bukti Kembali | Upload file teks berkedok `shell.jpg` | HTTP 400: "Format file tidak didukung!" | `validateImageMagicBytes` biner JPG/PNG/WebP | **LOLOS (PASSED)** |
| **SEC-AFT-27** | Penanganan Transisi Penolakan | Tolak pinjam & tolak review pengembalian | HTTP 200, status ditolak / disetujui + catatan | Transisi state machine ketat | **LOLOS (PASSED)** |
| **SEC-AFT-28** | Pencegahan Race Condition Stok Kritis | Stok=1 diperebutkan 15 request paralel serentak | Tepat 1 berhasil, 14 ditolak, sisa stok 0 (tidak negatif) | `FOR UPDATE` + conditional `WHERE stok >= 1` | **LOLOS (PASSED)** |
| **SEC-AFT-29** | Pencatatan Jejak Audit Transisi Status | Verifikasi `audit_logs` pasca operasi peminjaman | 5 aksi tercatat lengkap dengan IP & user | `logAudit` terintegrasi di controller | **LOLOS (PASSED)** |

---

## 🔬 2. Detail Pembuktian Empiris Skenario Keamanan

### 2.1 SEC-AFT-01: Akses Route Terlindungi Tanpa Login
* **Tujuan:** Memastikan endpoint privat tidak dapat diakses tanpa autentikasi valid.
* **Perintah Uji:**
  ```bash
  curl -i http://127.0.0.1:3000/dashboard
  ```
* **Hasil Pengamatan Nyata:**
  ```http
  HTTP/1.1 302 Found
  Location: /auth/login
  ```
  Pengguna tanpa cookie sesi diarahkan kembali ke halaman login.
* **Kode Perbaikan:** `src/middlewares/authMiddleware.js` (`cekLogin`).

---

### 2.2 SEC-AFT-02: Proteksi CSRF (Cross-Site Request Forgery)
* **Tujuan:** Mencegah serangan pemalsuan request lintas situs pada operasi POST/PUT/DELETE.
* **Perintah Uji:**
  ```bash
  curl -i -X POST -d "username=admin&password=dummy" http://127.0.0.1:3000/auth/login
  ```
* **Hasil Pengamatan Nyata:**
  ```http
  HTTP/1.1 403 Forbidden
  Content-Type: text/html

  Forbidden: Token CSRF tidak valid atau kedaluwarsa.
  ```
* **Kode Perbaikan:** `src/middlewares/csrfMiddleware.js`.

---

### 2.3 SEC-AFT-03: Pencegahan Privilege Escalation pada Registrasi
* **Tujuan:** Memastikan pendaftaran siswa publik tidak dapat dimanipulasi menjadi `role='admin'` atau `role='guru'`.
* **Perintah Uji:**
  Kirimkan payload registrasi dengan field tambahan `role=admin`:
  ```bash
  # Dikirim via scripts/test-security-suite.js
  ```
* **Hasil Pengamatan Nyata:**
  Query database `SELECT username, role FROM users WHERE username = 'tamper_admin_test';`:
  ```json
  { "username": "tamper_admin_test", "role": "siswa" }
  ```
* **Kode Perbaikan:** `src/controllers/authController.js` (baris 159-167) secara tegas mengabaikan `req.body.role` dan hanya menetapkan `const role = 'siswa'`.

---

### 2.4 SEC-AFT-04 & SEC-AFT-05: Validasi Input Zod & Username Duplikat
* **Tujuan:** Memastikan validasi skema ketat di sisi server untuk panjang password dan integritas username.
* **Hasil Pengamatan Nyata:**
  - Password `123`: Formulir menampilkan pesan error *"Password minimal 6 karakter"*.
  - Username `admin`: Formulir menampilkan pesan error *"Username sudah digunakan! Silakan gunakan username lain."*.
* **Kode Perbaikan:** `registerSchema` Zod di `src/controllers/authController.js`.

---

### 2.5 SEC-AFT-06: Proteksi Cross-Site Scripting (XSS) via EJS
* **Tujuan:** Memastikan payload skrip HTML tidak dieksekusi oleh peramban saat dirender ulang ke layar.
* **Payload Uji:** `<script>alert("XSS_PWNED")</script>`
* **Hasil Pengamatan Nyata:**
  HTML yang dihasilkan server Express:
  ```html
  <input type="text" class="form-control" name="username" value="&lt;script&gt;alert(&#34;XSS_PWNED&#34;)&lt;/script&gt;">
  ```
  Karakter berbahaya diubah menjadi entitas HTML aman (`&lt;`, `&gt;`, `&#34;`), sehingga tidak ada eksekusi JavaScript berbahaya di browser klien.

---

### 2.6 SEC-AFT-07: Proteksi SQL Injection (Prepared Statements)
* **Tujuan:** Memastikan input kredensial tidak dapat membobol kueri SQL.
* **Payload Uji:** `' OR '1'='1' -- `
* **Hasil Pengamatan Nyata:**
  Server mengeksekusi parameter terpisah `SELECT * FROM users WHERE username = ?` sehingga karakter kutip dianggap sebagai teks harfiah username, menghasilkan respon aman *"Username tidak ditemukan!"*.

---

### 2.7 SEC-AFT-08: Penghapusan Total Plaintext Password
* **Tujuan:** Memastikan kredensial plaintext yang tersisa di database tidak dapat digunakan untuk masuk sistem.
* **Langkah Uji:**
  1. Set password pengguna uji di DB menjadi plaintext: `UPDATE users SET password = 'InsecurePassword123!' WHERE ...`
  2. Lakukan login dengan password `InsecurePassword123!`.
* **Hasil Pengamatan Nyata:**
  Login ditolak (`isMatch = false`, pesan *"Password salah!"*).
* **Hasil Verifikasi Kode:**
  Pencarian kata kunci kesetaraan password di seluruh kode `src/` menunjukkan tidak ada perbandingan plaintext (`===` atau `==`) terhadap database.
* **Skrip Otomatis:** `scripts/test-no-plaintext.js`.

---

### 2.8 SEC-AFT-09: Rate Limiting Berbasis Database (Serverless Ready)
* **Tujuan:** Mencegah brute-force login pada arsitektur serverless (Vercel) yang tidak berbagi memori antar instance.
* **Hasil Pengamatan Nyata:**
  - Percobaan 1 s/d 20: Permintaan diproses dan dicatat sebagai `LOGIN_FAILED` di tabel `audit_logs` (tanpa merekam password).
  - Percobaan ke-21: Server mengembalikan respon `HTTP 429 Too Many Requests`:
    ```
    429 - Terlalu Banyak Percobaan Masuk
    Akun/IP dikunci sementara selama 15 menit.
    ```
  - Data terkunci tersimpan di tabel MySQL `rate_limits` dengan kolom `locked_until` aktif.
* **Skrip Otomatis:** `scripts/test-rate-limit.js`.

---

### 2.9 SEC-AFT-11 s/d SEC-AFT-16: Pengujian Modul 2 (Dashboard, Anti-IDOR Profil, & Storage Adapter)
* **Tujuan:** Memvalidasi isolasi role pada dashboard, mencegah pembajakan profil via parameter form IDOR, memvalidasi integritas ganti password dengan password lama, serta memastikan upload file divalidasi dengan magic bytes dan batas 4MB.
* **Hasil Pengamatan Nyata:**
  - `MOD2-01` (Admin Dashboard): Berhasil memuat total alat, statistik sedang dipinjam, dan tabel aktivitas terbaru.
  - `MOD2-02` (Siswa Dashboard): Hanya menampilkan pinjaman aktif pribadi siswa dan tombol aksi cepat tanpa membocorkan aktivitas siswa lain.
  - `MOD2-03` (Form Profil): Menampilkan form profil, foto, dan input kata sandi lama secara responsif.
  - `MOD2-04` (Anti-IDOR Profil): Pengiriman form POST `/profil` dengan `id=1` oleh siswa sama sekali TIDAK mengubah akun Admin (ID 1), karena server strictly menggunakan `req.session.user_id`.
  - `MOD2-05` (Verifikasi Password Lama): Penggantian kata sandi tanpa memasukkan kata sandi lama atau dengan kata sandi lama salah berhasil ditolak.
  - `MOD2-06` (Magic Bytes Validation): Header file biner diperiksa (JPG: `FF D8 FF`, PNG: `89 50 4E 47`, WebP: `RIFF...WEBP`). File berbahaya / skrip web berkedok `.jpg` berhasil ditolak.
* **Skrip Otomatis:** `scripts/test-module2.js`.

---

## 🚀 3. Cara Menjalankan Uji Otomatis

Seluruh pengujian di atas dapat dijalankan ulang secara mandiri kapan saja menggunakan skrip yang telah disediakan:

```bash
# 1. Menjalankan Suite Pengujian Keamanan Penuh (7 Skenario)
node scripts/test-security-suite.js

# 2. Menjalankan Uji Ketat Anti-Plaintext Password
node scripts/test-no-plaintext.js

# 3. Menjalankan Uji Brute-Force Rate Limiter (20 Percobaan -> 429)
node scripts/test-rate-limit.js

# 4. Menjalankan Uji Fungsional & Keamanan Modul 2 (Dashboard & Profil)
node scripts/test-module2.js

# 5. Menjalankan Uji Fungsional & Keamanan Modul 3 (Alat & Inventaris)
node scripts/test-module3.js

# 6. Menjalankan Uji Fungsional & Keamanan Modul 4 (Peminjaman, Anti-IDOR, Anti-Race Condition)
node scripts/test-module4.js
```

---

## ⚠️ 4. Batasan & Daftar Aspek yang Belum Diuji (Out of Scope / Future Verification)

Untuk menjaga transparansi akademik dan integritas pelaporan, berikut adalah area keamanan dan fungsionalitas yang **belum diuji secara empiris** pada suite pengujian saat ini:
1. **Pencetakan Dokumen Laporan (PDF Generation & Export CSV):** Rendering, tata letak kop surat, dan streaming file PDF laporan bengkel serta ekspor CSV dijadwalkan pada **Modul 5**.
2. **Multi-Factor Authentication (MFA / 2FA):** Aplikasi saat ini berbasis autentikasi faktor tunggal (kata sandi kuat bcrypt + database rate limiter).
3. **Pemindaian Antivirus Tingkat Kernel pada File Upload:** Validasi berkas unggahan mengandalkan pemeriksaan Magic Bytes, batas ukuran ketat 4MB, dan pengacakan nama file. Pemindaian daemon ClamAV belum diimplementasikan.
4. **Mitigasi Serangan Distributed Denial of Service (DDoS) Jaringan:** Rate limiter bekerja pada lapisan aplikasi (MySQL `rate_limits`). Proteksi banjir trafik volume tinggi (L3/L4/L7) di lingkungan produksi diserahkan kepada infrastruktur CDN Vercel Edge / Cloudflare.
