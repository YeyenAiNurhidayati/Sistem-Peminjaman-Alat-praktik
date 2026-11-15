# Panduan & Penjelasan Arsitektur Kode (Code Architecture Guide)
**Sistem Informasi Peminjaman Alat Bengkel (SIPAB) v2.0**  
*Ditulis dengan bahasa sederhana, analogi nyata, dan referensi file serta baris kode untuk persiapan ujian/demo.*

> ⚠️ **Catatan Penting Pengembang:** Nomor baris yang tercantum dalam panduan ini diverifikasi langsung pada commit `92b9a98` (setelah penyesuaian Modul 3, RESTful API alat, dan kebijakan password 10 karakter). Silakan gunakan nama fungsi, konstanta, dan kata kunci pencarian yang dicantumkan untuk verifikasi visual langsung jika terjadi pergeseran baris di masa mendatang.

---

## 🧭 1. Siklus Hidup Request-Response (Dari Browser ke Database & Kembali)

Saat Anda mengklik tombol atau membuka halaman di SIPAB, berikut alur perjalanannya di dalam server:

```
[ Browser Klien ]
       │  (1. Mengirim HTTP Request: GET / POST / PUT / DELETE)
       ▼
[ Vercel Edge Proxy / Nginx ]
       │  (Meneruskan IP asli via X-Forwarded-For & protokol HTTPS via X-Forwarded-Proto)
       ▼
[ src/app.js ] ──► app.set('trust proxy', 1) membaca proxy secara aman
       │
       ├─► [ Helmet ]: Memasang header keamanan (CSP, X-Frame-Options, no-sniff)
       ├─► [ Express Static ]: Melayani file CSS, gambar, dan ikon Mazer secara langsung
       ├─► [ Body & Cookie Parser ]: Mengubah data form dan cookie menjadi objek JavaScript
       ├─► [ Session Middleware ]: Mengambil data sesi pengguna dari tabel MySQL `sessions`
       ├─► [ CSRF Middleware ]: Memeriksa stempel token keamanan pada request mutasi (POST/PUT/DELETE)
       │
       ▼
[ Router (src/routes/) ] ──► Mengarahkan URL ke Controller yang tepat
       │
       ├─► [ Middleware Penjaga (authMiddleware.js) ]: Cek login & cek role izin akses
       ├─► [ Rate Limiter (dbRateLimiter.js) ]: Cek apakah Akun atau IP sedang diblokir
       │
       ▼
[ Controller (src/controllers/) ]
       │  1. Validasi input dengan Zod & Password Policy (panjang, komposisi, blacklist)
       │  2. Kirim kueri aman (Prepared Statement) ke Database melalui Connection Pool
       ▼
[ Database (MySQL / TiDB Cloud) ] ──► Mengeksekusi data & mengembalikan hasil
       │
       ▼
[ Controller ] ──► Mengolah hasil data & menyiapkan variabel tampilan
       │
       ▼
[ View Engine EJS (src/views/) ] ──► Merender HTML dengan auto-escaping (<%= %>)
       │
       ▼
[ Browser Klien ] ◄── Menerima halaman web lengkap (100% tampilan Mazer UI)
```

### 💡 Analogi Dunia Nyata: "Restoran Berbintang"
1. **Browser** = Pelanggan yang datang ke restoran.
2. **`app.js` & Middleware** = Resepsionis & Satpam di pintu depan (memeriksa kartu identitas, masker, dan memastikan pengunjung tidak membawa barang terlarang).
3. **Router (`routes/`)** = Pramusaji yang mengantarkan pesanan pelanggan ke bagian dapur yang tepat.
4. **Controller (`controllers/`)** = Koki dapur yang mengolah bahan makanan sesuai pesanan.
5. **Database (`MySQL / TiDB`)** = Gudang bahan makanan segar tempat koki mengambil data.
6. **View EJS (`views/`)** = Piring saji berhias tempat hidangan ditata rapi sebelum disajikan kembali ke pelanggan.

---

## 📂 2. Struktur Modul & Fungsi File Kunci

| Path File | Fungsi Utama | Konsep Kunci |
|---|---|---|
| [`src/app.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/app.js) | Entrypoint aplikasi Express | Konfigurasi Helmet CSP, trust proxy, routing utama, dan static assets. |
| [`src/config/database.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/config/database.js) | Pengelola koneksi basis data | Connection Pool MySQL2 dengan dukungan SSL TLS untuk TiDB Cloud. |
| [`src/config/session.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/config/session.js) | Penyimpanan sesi database | `express-mysql-session` agar sesi tidak hilang saat instance serverless mati. |
| [`src/utils/passwordPolicy.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/utils/passwordPolicy.js) | Mesin Kebijakan Password | Menegakkan syarat minimal 10 karakter, huruf besar, huruf kecil, angka, daftar hitam 100+ kata sandi umum, dan larangan memuat username. |
| [`src/middlewares/authMiddleware.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/middlewares/authMiddleware.js) | Pengaman otentikasi & RBAC | `cekLogin`, `cekRole`, dan penghitung notifikasi pending badge. |
| [`src/middlewares/csrfMiddleware.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/middlewares/csrfMiddleware.js) | Proteksi serangan CSRF | Menghasilkan & memvalidasi token kriptografis 32-byte pada setiap form dan mutasi AJAX. |
| [`src/middlewares/dbRateLimiter.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/middlewares/dbRateLimiter.js) | Anti Brute-Force Serverless | Menghitung gagal login di tabel `rate_limits` berbasis akun & IP (`req.ip`), memberi lockout 429. |
| [`src/utils/storageAdapter.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/utils/storageAdapter.js) | Penyimpanan file gambar | Menolak upload di produksi jika token Blob tidak ada (tidak diam-diam menulis ke disk lokal). Adaptor lokal hanya di dev. |
| [`src/utils/auditLogger.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/utils/auditLogger.js) | Pencatat riwayat aktivitas | Menyimpan log audit ke tabel `audit_logs` tanpa menyimpan password. |
| [`src/controllers/authController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/authController.js) | Logika login & registrasi | Skema Zod, kebijakan password ketat, perbandingan murni `bcrypt.compare`, regenerasi sesi. |
| [`src/controllers/dashboardController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/dashboardController.js) | Logika halaman dashboard | Statistik terisolasi (Siswa hanya data miliknya; Guru/Admin rekap global). |
| [`src/controllers/profilController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/profilController.js) | Logika profil & ganti kata sandi | Anti-IDOR mutlak, verifikasi kata sandi lama via bcrypt dan kebijakan password baru. |
| [`src/controllers/alatController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/alatController.js) | Manajemen Alat & Filter Kategori | RESTful CRUD alat, query kebal SQLi, soft-delete untuk menjaga keutuhan riwayat peminjaman & laporan. |
| [`src/routes/apiAlatRoutes.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/routes/apiAlatRoutes.js) | Rute REST API Alat | `GET/POST /api/alat` dan `PUT/DELETE /api/alat/:id`. Menolak tegas mutasi via GET (HTTP 405). |

---

## 🛡️ 3. Penjelasan 10 Alur Kunci Keamanan & Fungsionalitas

### 1. Registrasi Siswa Publik & Kebijakan Kata Sandi Ketat
* **File:** [`src/controllers/authController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/authController.js) (Baris 13-39, 169) dan [`src/utils/passwordPolicy.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/utils/passwordPolicy.js) (Baris 32-75)
* **Potongan Kode:**
  ```javascript
  // Server strictly enforces role = 'siswa', never from user input
  const role = 'siswa';

  // Validasi kebijakan kata sandi standar keamanan siber
  const policy = validatePasswordPolicy(data.password, data.username);
  if (!policy.valid) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: policy.message, path: ['password'] });
  }
  ```
* **Cara Kerja:**  
  Server menolak pendaftaran jika password kurang dari 10 karakter, tidak memiliki huruf besar/kecil/angka, termasuk 100 password terpopuler (seperti `password`, `123456`, `bengkel123`), atau memuat username pendaftar. Server juga memaksa nilai `role = 'siswa'`, mengabaikan input role manipulatif klien.
* **Analogi:**  
  Pintu masuk area parkir bandara. Kartu tiket otomatis mencetak "Pengunjung", tidak peduli apakah pengemudi mengenakan seragam pilot. Mesin juga menolak kunci gembok standar murah dan mewajibkan gembok berkombinasi rumit.

---

### 2. Login & Bcrypt Verification (Zero Plaintext Password)
* **File:** [`src/controllers/authController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/authController.js) (Baris 72-83)
* **Potongan Kode:**
  ```javascript
  const user = users[0];
  // Pure bcrypt verification only (Zero plaintext fallback)
  const isMatch = await bcrypt.compare(password, user.password || '');

  if (!isMatch) {
    await recordLoginFailure(req, user.username);
    return res.render('auth/login', { error: 'Password salah!' });
  }
  ```
* **Cara Kerja:**  
  Password tidak pernah disimpan dalam bentuk teks biasa. Di database, tersimpan hash satu arah (contoh: `$2a$10$abcdef...`). Saat user login, bcrypt menguji kecocokan secara matematis tanpa pernah mendekripsi hash tersebut. Jika di database terdapat password plaintext lama, fungsi `bcrypt.compare` akan langsung mengembalikan nilai `false`.
* **Analogi:**  
  Kunci sidik jari biometrik. Mesin sidik jari tidak menyimpan foto jari Anda, melainkan formula matematika rumit dari sidik jari tersebut. Tidak ada yang bisa "membaca kembali" sidik jari dari formula itu.

---

### 3. Sesi Serverless & Cookie Security Flags
* **File:** [`src/config/session.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/config/session.js) (Baris 25-37) & [`src/controllers/authController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/authController.js) (Baris 91-105)
* **Potongan Kode:**
  ```javascript
  // Regenerasi ID sesi untuk mencegah Session Fixation
  req.session.regenerate(async (err) => {
    req.session.login = true;
    req.session.user_id = user.id;
    req.session.role = user.role;
    // ...
  });
  ```
  ```javascript
  cookie: {
    httpOnly: true,                               // Mencegah pencurian cookie via JavaScript (XSS)
    secure: process.env.NODE_ENV === 'production',// Wajib HTTPS pada produksi
    sameSite: 'lax',                              // Mencegah pengiriman cookie lintas situs
    maxAge: 1000 * 60 * 60 * 24                   // Berlaku 24 jam
  }
  ```
* **Cara Kerja:**  
  Karena Vercel bersifat serverless (mesin server bisa berganti setiap detik), sesi disimpan di tabel MySQL `sessions`. Saat login berhasil, ID sesi lama dihancurkan dan diganti dengan ID baru (`session.regenerate`). Cookie sesi dilindungi flag `httpOnly` sehingga skrip jahat di browser tidak bisa mencurinya.
* **Analogi:**  
  Tiket gelang di konser festival. Ketika Anda menukarkan tiket di loket, gelang uji coba digunting dan diganti dengan gelang resmi bersegel kedap air yang tidak bisa dipindahkan ke tangan orang lain.

---

### 4. Proteksi CSRF (Cross-Site Request Forgery)
* **File:** [`src/middlewares/csrfMiddleware.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/middlewares/csrfMiddleware.js) (Baris 29-37) & [`src/views/layout/footer.ejs`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/views/layout/footer.ejs) (Baris 40-60)
* **Potongan Kode:**
  ```javascript
  // Pengecekan token pada mutasi POST/PUT/DELETE
  const token = req.body?._csrf || req.headers['x-csrf-token'] || req.headers['csrf-token'];
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).send(`... 403 - Invalid CSRF Token ...`);
  }
  ```
* **Cara Kerja:**  
  Setiap sesi pengguna memiliki token acak unik 32-byte. Setiap form HTML menyertakan input tersembunyi `<input type="hidden" name="_csrf" value="...">`. Pada panggilan JavaScript `fetch`, interceptor footer secara otomatis menyisipkan header `X-CSRF-Token`. Jika penyerang dari situs lain memicu submit form palsu, browser tidak akan memiliki token rahasia ini sehingga server menolaknya dengan kode HTTP 403.
* **Analogi:**  
  Cap stempel berhologram pada surat perintah transfer bank. Bank hanya memproses transfer jika surat tersebut memiliki stempel hologram asli yang hanya Anda pegang di kantor bank.

---

### 5. Role-Based Access Control (RBAC)
* **File:** [`src/middlewares/authMiddleware.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/middlewares/authMiddleware.js) (Baris 16-46)
* **Potongan Kode:**
  ```javascript
  export function cekRole(allowedRoles = []) {
    return (req, res, next) => {
      const userRole = req.session.role;
      if (allowedRoles.includes(userRole)) {
        return next();
      }
      return res.status(403).send(`... 403 - Akses Ditolak ...`);
    };
  }
  ```
* **Cara Kerja:**  
  Setiap route privat dilindungi oleh middleware `cekRole(['admin'])`. Jika siswa atau guru mencoba membuka `/alat` (manajemen alat) atau melakukan mutasi data inventaris, middleware langsung menghentikan eksekusi dan mengembalikan respons HTTP 403 Forbidden.
* **Analogi:**  
  Pintu berpembaca kartu RFID di bengkel. Siswa hanya dapat membuka loker peralatan umum, sedangkan lemari perkakas khusus dan ruang admin hanya terbuka bagi kartu staf administrator.

---

### 6. Pencegahan IDOR (Insecure Direct Object Reference)
* **File:** [`src/controllers/profilController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/profilController.js) (Baris 16, 51, 138-142)
* **Potongan Kode:**
  ```javascript
  // Strict Anti-IDOR: ID diambil EKSKLUSIF dari sesi server, BUKAN dari form/URL!
  const userId = req.session.user_id;

  await pool.execute(`
    UPDATE users 
    SET nama = ?, password = ?, foto_profil = ?, updated_at = NOW() 
    WHERE id = ?
  `, [nama, finalHashedPassword, finalFotoProfil, userId]);
  ```
* **Cara Kerja:**  
  Pada PHP lama, file `profil/proses_edit.php` membaca `$id = $_POST['id']`, sehingga Siswa (ID 3) dapat mengirim `id=1` untuk menimpa nama/password Admin. Pada versi Node.js baru, server **sepenuhnya mengabaikan** parameter `id` dari form klien dan selalu menggunakan `req.session.user_id` yang tersimpan aman di sesi server.
* **Analogi:**  
  Pengambilan paket di kantor pos. Petugas pos menyerahkan paket berdasarkan nomor identitas di KTP resmi Anda, bukan berdasarkan secarik kertas tulisan tangan yang bisa Anda ubah sesuka hati.

---

### 7. Universal Storage Adapter & Validasi Magic Bytes
* **File:** [`src/utils/storageAdapter.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/utils/storageAdapter.js) (Baris 16-45, 72-113)
* **Potongan Kode:**
  ```javascript
  // Memeriksa header biner file asli (Magic Bytes)
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, mime: 'image/jpeg', ext: '.jpg' };
  }
  // Di production: Wajib Vercel Blob, tidak diam-diam menulis ke disk lokal
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('Penyimpanan cloud Vercel Blob belum dikonfigurasi...');
    }
    // Upload ke Vercel Blob CDN
  }
  ```
* **Cara Kerja:**  
  Penyerang sering kali mengganti ekstensi file virus `shell.php` menjadi `shell.php.jpg`. Fungsi `validateImageMagicBytes` memeriksa 4 byte pertama file biner untuk membuktikan apakah file tersebut benar-benar foto asli. Di lingkungan produksi (`production`), sistem mewajibkan Vercel Blob dan tidak pernah menulis ke disk lokal; adaptor lokal hanya aktif di lingkungan pengembangan non-produksi.
* **Analogi:**  
  Pemeriksaan sinar-X bagasi di bandara. Petugas keamanan bandara tidak hanya membaca label koper bertuliskan "Pakaian", melainkan memindai struktur fisik di dalam koper tersebut untuk memastikan tidak ada benda berbahaya.

---

### 8. Rate Limiting Anti-Spoofing Berbasis Database
* **File:** [`src/middlewares/dbRateLimiter.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/middlewares/dbRateLimiter.js) (Baris 16, 23, 41-65, 84-115)
* **Potongan Kode:**
  ```javascript
  // IP diambil secara aman dari req.ip (dinormalisasi Express trust proxy)
  export function getClientIp(req) {
    return req.ip || req.socket?.remoteAddress || '127.0.0.1';
  }
  // Proteksi akun: Kunci dihitung dari username target
  export function getUserRateLimitKey(username = '') {
    return `login:user:${username.trim().toLowerCase() || 'anon'}`;
  }
  ```
* **Cara Kerja:**  
  Rate limiter mengunci akun target jika terjadi 20 kali kegagalan berturut-turut. Penyerang **tidak dapat membypass** batas ini dengan memutar header `X-Forwarded-For` palsu, karena sistem mengunci username target dan mengekstrak IP melalui `req.ip` yang diverifikasi Express melalui reverse proxy hop yang sah (`trust proxy 1`).
* **Analogi:**  
  Sistem keamanan pintu brankas digital. Jika seseorang salah menekan kombinasi brankas 20 kali, brankas terkunci 15 menit, tidak peduli apakah penyerang berganti-ganti topeng atau menggunakan nama samaran yang berbeda.

---

### 9. RESTful API Alat & Preservasi Soft-Delete Riwayat Laporan
* **File:** [`src/controllers/alatController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/alatController.js) (Baris 266-315) & [`src/routes/apiAlatRoutes.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/routes/apiAlatRoutes.js) (Baris 18-39)
* **Potongan Kode:**
  ```javascript
  // Menolak mutasi via GET (HTTP 405 Method Not Allowed)
  router.get('/', (req, res, next) => {
    if (req.query.action && ['delete', 'create', 'update'].includes(req.query.action)) {
      return res.status(405).json({ message: 'Aksi mutasi data alat tidak boleh dipicu melalui GET.' });
    }
    next();
  }, alatController.getAllAlat);

  // Soft-delete alat jika memiliki riwayat peminjaman masa lalu
  if (historyLoans.length > 0) {
    await pool.execute('UPDATE barang SET deleted_at = NOW() WHERE id = ?', [toolId]);
    return res.json({ success: true, message: 'Alat diarsipkan (riwayat laporan tetap terjaga).' });
  }
  ```
* **Cara Kerja:**  
  Seluruh aksi manipulasi alat menggunakan endpoint RESTful murni (`GET /api/alat`, `GET /api/alat/:id`, `POST /api/alat`, `PUT /api/alat/:id`, `DELETE /api/alat/:id`). Jika alat pernah dipinjam di masa lalu (`kembali` / `ditolak`), alat tidak dihapus permanen melainkan diarsipkan (`deleted_at = NOW()`) sehingga riwayat peminjaman dan rekap laporan tetap utuh tanpa memicu error basis data 500.
* **Analogi:**  
  Pengarsipan buku inventaris perpustakaan. Buku lama yang rusak tidak dibakar atau dihilangkan dari kartu peminjaman sejarah, melainkan disimpan ke lemari arsip agar data transaksi peminjam di masa lampau tetap tercatat rapi.

---

### 10. Jejak Audit Tanpa Kebocoran Kredensial
* **File:** [`src/utils/auditLogger.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/utils/auditLogger.js) (Baris 3-18)
* **Potongan Kode:**
  ```javascript
  const ipAddress = req?.ip || req?.socket?.remoteAddress || null;
  const sql = `
    INSERT INTO audit_logs (user_id, username, action, details, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  await pool.execute(sql, [userId, username, action, details, ipAddress, userAgent]);
  ```
* **Cara Kerja:**  
  Setiap aksi penting (registrasi, login sukses, login gagal, tambah/ubah/arsip alat, persetujuan dan pengembalian pinjaman) dicatat ke tabel `audit_logs` bersama alamat IP dan browser pengguna. Fungsi ini **tidak pernah menerima atau mencatat string kata sandi**, menjamin kerahasiaan kredensial pengguna.
* **Analogi:**  
  Buku register tamu di kantor keamanan. Petugas mencatat jam kedatangan, nomor kartu identitas, dan tujuan kunjungan, tanpa pernah meminta atau mencatat nomor PIN rekening tamu.

---

### 11. Transaksi Atomik Peminjaman, Anti-Race Condition Stok, & State Machine (Modul 4)
* **File:** [`src/controllers/peminjamanController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/peminjamanController.js) (Baris 130-220, 240-340, 420-560) & [`src/routes/peminjamanRoutes.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/routes/peminjamanRoutes.js)
* **Potongan Kode:**
  ```javascript
  // Kunci baris peminjaman dan verifikasi status asal
  const [loanRows] = await connection.query(
    'SELECT id, id_barang, status FROM peminjaman WHERE id = ? FOR UPDATE',
    [loanId]
  );
  // Conditional update stok (anti-race condition)
  const [stockUpdate] = await connection.query(
    'UPDATE barang SET stok = stok - 1 WHERE id = ? AND stok >= 1 AND deleted_at IS NULL',
    [loan.id_barang]
  );
  if (stockUpdate.affectedRows === 0) {
    await connection.rollback();
    return res.status(400).json({ success: false, message: 'Stok barang tidak mencukupi!' });
  }
  // Transisi status ketat
  await connection.query(
    "UPDATE peminjaman SET status = 'disetujui' WHERE id = ? AND status = 'pending'",
    [loanId]
  );
  await connection.commit();
  ```
* **Cara Kerja:**  
  1. **Semantik Stok Persis PHP Asli**: Stok **tidak berkurang** saat siswa mengajukan peminjaman (`pending`). Stok berkurang 1 saat Guru menyetujui (`disetujui`). Saat siswa mengunggah bukti pengembalian, status berubah menjadi `menunggu_pengembalian` dan stok belum bertambah. Stok baru bertambah kembali 1 saat Guru menyetujui fisik alat pada review pengembalian (`kembali`).
  2. **Pencegahan Race Condition**: Operasi mutasi stok dibungkus transaksi MySQL dengan kunci baris (`FOR UPDATE`) dan pembaruan berkondisi `WHERE stok >= 1`. Jika 15 siswa atau guru mencoba menyetujui peminjaman untuk 1 unit alat secara bersamaan, hanya tepat 1 transaksi yang berhasil mendapatkan stok (`affectedRows === 1`), sedangkan 14 lainnya dibatalkan (`rollback`), sehingga stok di basis data tidak pernah menjadi negatif.
  3. **Immutability State Machine**: Setiap perubahan status wajib memeriksa status asal (`WHERE id = ? AND status = 'status_asal'`). Replay attack (misalnya mengklik tombol setuju atau review dua kali) ditolak dengan HTTP 409 sehingga stok tidak pernah termutasi dua kali.
  4. **Anti-IDOR Pengembalian & Bukti Foto**: Siswa A tidak dapat membuka form, memutasi pengembalian, ataupun melihat foto bukti milik Siswa B karena server memverifikasi kecocokan numerik `Number(data.id_user) === Number(req.session.user_id)`.
* **Analogi:**  
  Loket peminjaman perkakas khusus dengan 1 unit tersisa. Meskipun 15 siswa mengantre di depan loket, petugas loket hanya menyerahkan perkakas fisik tersebut kepada orang pertama yang dilayani dan langsung mencatat stok habis di buku inventaris. Petugas lain yang melayani antrean berikutnya langsung melihat status habis dan menolak pengajuan tanpa ada perkakas fiktif yang terbagi dua.
