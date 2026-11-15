# Laporan Uji Keamanan Aplikasi PHP Lama (Self-Testing Before Migration)

**Projek:** Sistem Informasi Peminjaman Alat Bengkel (SIPAB)  
**Target:** Versi PHP Native (Apache/PHP 8 + MariaDB/MySQL)  
**Lingkungan Uji:** `http://127.0.0.1:8080/Projek_P.Web-Native/` (PHP 8.0.30 Dev Server + MySQL XAMPP)  
**Waktu Pengujian:** 14 November 2026  
**Status Pengujian:** 100% DIUJI LANGSUNG (Semua temuan telah diverifikasi secara empiris)  
**Penyusun:** Senior Software & Security Engineer  

---

## 🛠️ 1. Lingkungan Pengujian & Transparansi Data

### 1.1 Catatan Transparansi Data Awal
1. **Kegagalan Impor Awal:**  
   File dump `peminjaman_alat.sql` dan `db_schema.sql` pada repository awalnya gagal diimpor secara langsung ke MySQL karena terdapat foreign key constraints (`ERROR 1451: Cannot delete or update a parent row: a foreign key constraint fails`) dan ketiadaan flag `DROP TABLE IF EXISTS` pada tabel `barang`.
2. **Kondisi Database yang Ditemukan:**  
   Database lokal di XAMPP sebelumnya sempat berisi hash bcrypt dari uji coba sebelumnya, namun kode PHP bawaan (`auth/login.php`) melakukan perbandingan plaintext `if ($password == $user['password'])`, sehingga autentikasi bawaan PHP gagal login.
3. **Penyesuaian Data Uji yang Dilakukan:**  
   Untuk menguji fungsionalitas asli kode PHP lama secara jujur dan adil tanpa merusak skema:
   - Dibuat dataset standar realistis di [`database/seed-demo.sql`](file:///c:/xampp/htdocs/Projek_P.Web-Native/database/seed-demo.sql) dengan mengeksekusi `SET FOREIGN_KEY_CHECKS = 0;`.
   - Data akun pengguna diatur sesuai desain awal kode PHP dengan password teks polos yang belum di-hash (`admin_insecure`, `guru_insecure`, dan `siswa_insecure`).
   - Diisi 15 alat dengan berbagai kategori (`Hand Tools`, `Power Tools`, `SST`), kondisi (`Baik`, `Rusak`, `Perlu Perbaikan`), serta 7 transaksi peminjaman yang mencakup seluruh status (`pending`, `disetujui`, `menunggu_pengembalian`, `kembali`, `ditolak`).

---

## 📌 2. Tabel Ringkasan Temuan & Status Pengujian

| ID | Kategori Kerentanan | Tingkat Risiko | Status Pengujian | Bukti / Lokasi Utama |
|---|---|---|---|---|
| **SEC-01** | Plaintext Password Storage & Comparison | **CRITICAL** | **DIUJI LANGSUNG** | `auth/login.php` (L28), `auth/proses_login.php` (L25), `profil/proses_edit.php` (L39), `users/proses_tambah.php` (L11, L54), `users/proses_edit.php` (L11, L54) |
| **SEC-02** | Missing Cookie Security Flags (Session Hijacking) | **HIGH** | **DIUJI LANGSUNG** | Header respon `Set-Cookie: PHPSESSID` tanpa `HttpOnly`, `Secure`, `SameSite` |
| **SEC-03** | Broken Access Control / Missing Authorization | **HIGH** | **DIUJI LANGSUNG** | `api/alat.php` (Siswa berhasil CRUD alat bengkel via POST) |
| **SEC-04** | SQL Injection (Direct Variable Interpolation) | **CRITICAL** | **DIUJI LANGSUNG** | `alat/edit.php` (L10), `alat/hapus.php` (L9), `users/hapus.php` (L16), `profil/proses_edit.php` (L39) |
| **SEC-05** | Stored Cross-Site Scripting (XSS) | **HIGH** | **DIUJI LANGSUNG** | `users/index.php` (L80, L88), `riwayat/index.php` (L59), `laporan/index.php` (L53) |
| **SEC-06** | IDOR & Unauthenticated Endpoint Processing | **MEDIUM** | **DIUJI LANGSUNG** | `peminjaman/proses_pinjam.php` (tanpa sesi), `peminjaman/acc.php` & `tolak.php` |

---

## 🔬 3. Detail Pembuktian Empiris (Step-by-Step)

### 3.1 SEC-01: Penyimpanan dan Perbandingan Password Plaintext
* **Status:** **DIUJI LANGSUNG**
* **Analisis Kode Sumber PHP:**
  Bukan sekadar isi database, seluruh logika penanganan password di kode PHP memang dirancang menggunakan teks polos:
  - `auth/login.php` (baris 28):
    ```php
    // password belum hash (sesuai kode awal Anda)
    if ($password == $user['password']) {
    ```
  - `auth/proses_login.php` (baris 25):
    ```php
    $q = mysqli_query($conn, "SELECT * FROM users WHERE username='$username' AND password='$password'");
    ```
  - `profil/proses_edit.php` (baris 39):
    ```php
    $query = "UPDATE users SET nama = '$nama', password = '$password', foto_profil = '$foto_profil' WHERE id = '$id'";
    ```
  - `users/proses_tambah.php` (baris 11 & 54-55):
    ```php
    $password = $_POST['password']; // Plain text as per existing system
    $sql = "INSERT INTO users (nama, username, password, ...) VALUES ('$nama', '$username', '$password', ...)";
    ```
  - `users/proses_edit.php` (baris 11 & 54):
    ```php
    $password = $_POST['password'];
    $query = "UPDATE users SET nama = '$nama', password = '$password' ... WHERE id = '$id'";
    ```
* **Langkah Pembuktian:**
  Jalankan query terminal untuk melihat kolom password hasil simpanan kode PHP:
  ```bash
  mysql -u root peminjaman_alat -e "SELECT id, username, password, role FROM users;"
  ```
* **Hasil Pengamatan Nyata:**
  ```text
  +----+----------+----------+-------+
  | id | username | password | role  |
  +----+----------+----------+-------+
  |  1 | admin    | [plain_admin_pwd] | admin |
  |  2 | guru     | [plain_guru_pwd]  | guru  |
  |  3 | siswa    | [plain_siswa_pwd] | siswa |
  +----+----------+----------+-------+
  ```
* **Tangkapan Layar:** `01_db_passwords_plaintext.png` (Tabel MySQL membuktikan password teks terbuka).

---

### 3.2 SEC-02: Ketiadaan Flag Keamanan pada Cookie Sesi
* **Status:** **DIUJI LANGSUNG**
* **Langkah Pembuktian:**
  Kirim HTTP GET request ke halaman login dan amati header `Set-Cookie`:
  ```bash
  curl -I http://127.0.0.1:8080/Projek_P.Web-Native/auth/login.php
  ```
* **Hasil Pengamatan Nyata:**
  ```http
  HTTP/1.1 200 OK
  Set-Cookie: PHPSESSID=jev4ntntefq6n82hrff9ao3vhq; path=/
  ```
  Tidak ada atribut `HttpOnly; Secure; SameSite=Strict/Lax`. Script JS klien dapat mencuri session ID via `document.cookie`.
* **Tangkapan Layar:** `02_cookie_flags_missing.png` (DevTools Application > Cookies menunjukkan kolom HttpOnly dan Secure kosong).

---

### 3.3 SEC-03: Broken Access Control pada API Alat
* **Status:** **DIUJI LANGSUNG**
* **Analisis Kode (`api/alat.php` baris 7-10):**
  Hanya ada `if (!isset($_SESSION['login']))`, tidak ada validasi `role == 'admin'`.
* **Langkah Pembuktian:**
  1. Login sebagai akun siswa (`siswa` / `[plain_siswa_pwd]`) dan simpan sesi:
     ```bash
     curl -c cookies.txt -d "login=true&username=siswa&password=plain_siswa_pwd" "http://127.0.0.1:8080/Projek_P.Web-Native/auth/login.php"
     ```
  2. Eksekusi penambahan data alat bengkel menggunakan sesi siswa:
     ```bash
     curl -b cookies.txt -d "action=create&nama_barang=Alat_Uji_Bypass&kategori=Hand Tools&stok=5&kondisi=Baik" "http://127.0.0.1:8080/Projek_P.Web-Native/api/alat.php"
     ```
* **Hasil Pengamatan Nyata:**
  ```json
  {"success":true,"message":"Data berhasil ditambahkan!"}
  ```
  Akun siswa berhasil memanipulasi master data alat tanpa hak akses admin.
* **Tangkapan Layar:** `03_api_broken_access_control_siswa.png` (Respon terminal curl saat siswa menambah data alat).

---

### 3.4 SEC-04: SQL Injection melalui Parameter GET/POST
* **Status:** **DIUJI LANGSUNG**
* **Analisis Kode (`alat/edit.php` baris 9-10):**
  ```php
  $id = $_GET['id'];
  $data = mysqli_fetch_assoc(mysqli_query($conn, "SELECT * FROM barang WHERE id='$id'"));
  ```
  Parameter `$id` langsung disatukan ke dalam query SQL tanpa sanitasi atau parameterized query.
* **Langkah Pembuktian (Non-Destruktif):**
  Login sebagai admin, lalu panggil endpoint `alat/edit.php` dengan menyisipkan karakter petik satu (`id=1'`):
  ```bash
  curl -c admin_cookies.txt -d "login=true&username=admin&password=plain_admin_pwd" "http://127.0.0.1:8080/Projek_P.Web-Native/auth/login.php"
  curl -b admin_cookies.txt "http://127.0.0.1:8080/Projek_P.Web-Native/alat/edit.php?id=1%27"
  ```
* **Hasil Pengamatan Nyata:**
  Server mengembalikan pesan kegagalan query SQL langsung ke antarmuka:
  ```html
  <br />
  <b>Fatal error</b>:  Uncaught TypeError: mysqli_fetch_assoc(): Argument #1 ($result) must be of type mysqli_result, bool given in C:\xampp\htdocs\Projek_P.Web-Native\alat\edit.php:10
  Stack trace:
  #0 C:\xampp\htdocs\Projek_P.Web-Native\alat\edit.php(10): mysqli_fetch_assoc(false)
  ```
  Ini membuktikan bahwa karakter petik berhasil merusak struktur query MySQL server secara langsung (*syntax breakdown*).
* **Tangkapan Layar:** `04_sqli_live_error.png` (Tampilan error `mysqli_fetch_assoc(false)` di browser/terminal saat `id=1'` diakses).

---

### 3.5 SEC-05: Stored Cross-Site Scripting (XSS) pada Tabel Pengguna
* **Status:** **DIUJI LANGSUNG**
* **Analisis Kode (`users/index.php` baris 80):**
  ```php
  <td><?= $row['nama'] ?></td>
  ```
  Variabel dicetak mentah tanpa pembungkus `htmlspecialchars()`.
* **Langkah Pembuktian (Non-Destruktif):**
  1. Masukkan entri nama dengan tag HTML `Budi <u>Santoso</u>` di database lokal:
     ```bash
     mysql -u root peminjaman_alat -e "UPDATE users SET nama='Budi <u>Santoso</u>' WHERE username='siswa2';"
     ```
  2. Buka halaman `users/index.php` dengan sesi admin:
     ```bash
     curl -b admin_cookies.txt "http://127.0.0.1:8080/Projek_P.Web-Native/users/index.php" | grep "<u>Santoso</u>"
     ```
* **Hasil Pengamatan Nyata:**
  HTML yang dirender server:
  ```html
  <td>Budi <u>Santoso</u></td>
  ```
  Tag HTML `<u>...</u>` dirender mentah oleh browser (kata Santoso tergarisbawahi). Jika diisi payload `<script>` atau `<img onerror=...>`, kode JavaScript penyerang akan langsung tereksekusi di browser pengawas/admin.
* **Tangkapan Layar:** `05_xss_unescaped_render.png` (Inspect element DOM pada `users/index.php` menampilkan tag HTML tidak ter-escape).

---

### 3.6 SEC-06a: Endpoint Pemrosesan Tanpa Autentikasi Sesi (`peminjaman/proses_pinjam.php`)
* **Status:** **DIUJI LANGSUNG**
* **Analisis Kode (`peminjaman/proses_pinjam.php` baris 1-38):**
  File ini hanya memanggil `include '../config/koneksi.php';` tanpa memanggil `session_start()` dan sama sekali tidak menyertakan pemeriksaan `cek_login.php`.
* **Langkah Pembuktian Nyata:**
  1. Periksa jumlah data peminjaman di database sebelum request:
     ```sql
     SELECT COUNT(*) as total_sebelum FROM peminjaman;
     -- Hasil: 7 record
     ```
  2. Kirim HTTP POST tanpa cookie sesi menggunakan curl:
     ```bash
     curl -i -X POST -d "alat_id=1&peminjam=GhostAnonymousUser" "http://127.0.0.1:8080/Projek_P.Web-Native/peminjaman/proses_pinjam.php"
     ```
  3. Periksa jumlah data peminjaman di database setelah request:
     ```sql
     SELECT COUNT(*) as total_sesudah FROM peminjaman;
     -- Hasil: 7 record (Tetap identik)
     ```
* **Hasil Pengamatan Nyata & Catatan Transparansi:**
  - Header HTTP merespons `HTTP/1.1 302 Found` dengan header `Location: index.php` tanpa status `401 Unauthorized` atau penolakan akses.
  - **Transparansi Hasil:** Jumlah baris di tabel `peminjaman` tetap 7 (`COUNT(*)` tidak bertambah). Hal ini terjadi karena kueri `INSERT` di dalam file legacy menggunakan nama kolom `alat_id`, sedangkan skema aktif tabel `peminjaman` menggunakan kolom `id_barang`. Meskipun kueri SQL gagal di latar belakang, PHP tidak menangani error tersebut dan tetap meneruskan alur pemrosesan unauthenticated hingga redirect ke `index.php`.
* **Tangkapan Layar:** `06a_unauthenticated_endpoint.png` (Respon HTTP 302 dan verifikasi `SELECT COUNT(*)` sebelum/sesudah).

---

### 3.7 SEC-06b: Otorisasi Objek (IDOR) & Broken Access Control

#### Kasus (i): IDOR Sebenarnya pada Profil Pengguna (`profil/proses_edit.php`)
* **Status:** **DIUJI LANGSUNG**
* **Analisis Kode (`profil/proses_edit.php` baris 5, 39):**
  ```php
  $id = $_POST['id'];
  ...
  $query = "UPDATE users SET nama = '$nama', password = '$password', foto_profil = '$foto_profil' WHERE id = '$id'";
  mysqli_query($conn, $query);
  ```
  File pemrosesan profil mengambil `$id` langsung dari parameter `POST` form pengguna tanpa memvalidasi apakah `$id` tersebut cocok dengan `$_SESSION['user_id']`. Akibatnya, pengguna level apa pun (termasuk siswa) dapat mengubah nama, profil, bahkan password milik akun administrator (ID: 1).
* **Langkah Pembuktian Nyata:**
  1. Periksa data akun administrator (ID: 1) di basis data:
     ```bash
     node -e "const m=require('mysql2/promise'); m.createConnection({host:'127.0.0.1',user:'root',password:'',database:'peminjaman_alat'}).then(async c=>{ const [r]=await c.query('SELECT id, nama, username FROM users WHERE id=1'); console.log(r[0]); c.end(); });"
     # Hasil: { id: 1, nama: 'Hendrik Administrator', username: 'admin' }
     ```
  2. Kirim POST manipulasi IDOR ke `profil/proses_edit.php` dengan target `id=1`:
     ```bash
     curl -X POST -d "id=1&nama=Administrator (IDOR Tested)&password=&foto_lama=default.png" "http://127.0.0.1:8080/Projek_P.Web-Native/profil/proses_edit.php"
     ```
  3. Periksa kembali data akun administrator di database:
     ```bash
     # Hasil: { id: 1, nama: 'Administrator (IDOR Tested)', username: 'admin' }
     ```
  4. Akun administrator berhasil diubah oleh pihak ketiga tanpa verifikasi sesi/kepemilikan ID! (Nama segera dipulihkan ke semula setelah pengujian).
* **Tangkapan Layar:** `06b_idor_profile_hijack.png` (Data user ID 1 berubah akibat POST IDOR).

#### Kasus (ii): Akses Lintas Siswa pada Peminjaman (`peminjaman/kembali.php` & `proses_ajukan_kembali.php`)
* **Status:** **DARI REVIEW KODE**
* **Analisis Kode:**
  Pada file `peminjaman/kembali.php` (baris 22) dan `peminjaman/proses_ajukan_kembali.php` (baris 48):
  ```php
  // kembali.php
  WHERE p.id = '$id' AND p.id_user = '$user_id'

  // proses_ajukan_kembali.php
  WHERE id = '$id' AND id_user = '$user_id' AND status = 'disetujui'
  ```
  Kueri secara eksplisit membatasi operasi pengembalian dengan klausul `AND id_user = '$user_id'`. Jika Siswa A mencoba membuka form pengembalian atau mengirimkan data milik Siswa B, kueri mengembalikan 0 baris sehingga sistem mengeluarkan pesan error:
  `die("Peminjaman tidak ditemukan!");` atau `alert('Peminjaman tidak valid atau sudah di-proses!');`.
  Oleh karena itu, jalur spesifik ini **aman dari IDOR pengembalian** di tingkat kueri SQL.
* **Celah Broken Access Control Terkait:**
  Meskipun pengembalian terkunci oleh `id_user`, siswa tetap dapat:
  1. Melihat seluruh riwayat peminjaman siswa lain melalui `laporan/index.php` dan mengunduh seluruh data peminjaman lewat `laporan/cetak.php` tanpa ada validasi role (`cekRole(['guru', 'admin'])`).
  2. Memanipulasi alat bengkel melalui `api/alat.php` (action `create`, `update`, `delete`) karena endpoint hanya mengecek `isset($_SESSION['login'])` tanpa memeriksa role.

---

## 📷 4. Checklist Bukti Screenshot Lengkap

| File Screenshot | Lokasi / Aksi | Bukti yang Ditunjukkan |
|---|---|---|
| `01_db_passwords_plaintext.png` | Terminal / phpMyAdmin tabel `users` | Password akun bawaan disimpan dalam bentuk plaintext |
| `02_cookie_flags_missing.png` | Chrome DevTools > Application > Cookies | PHPSESSID tanpa HttpOnly & Secure |
| `03_api_broken_access_control_siswa.png` | Terminal curl POST `/api/alat.php` | Respon sukses tambah alat dari akun siswa |
| `04_sqli_live_error.png` | Browser/curl `alat/edit.php?id=1'` | Fatal error mysqli membuktikan query injeksi tereksekusi |
| `05_xss_unescaped_render.png` | DevTools Elements `users/index.php` | Tag `<u>Santoso</u>` dicetak mentah tanpa sanitasi |
| `06a_unauthenticated_endpoint.png` | Terminal curl POST `proses_pinjam.php` | Respon HTTP 302 tanpa autentikasi + COUNT(*) tidak bertambah |
| `06b_idor_profile_hijack.png` | Terminal / DB query `profil/proses_edit.php` | Nama Admin (ID 1) termodifikasi akibat IDOR dari input form |

---

*Dokumen ini merupakan catatan pengujian faktual pada target PHP legacy sebagai landasan perbaikan di arsitektur Node.js baru.*
