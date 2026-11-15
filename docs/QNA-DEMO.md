# 30 Tanya-Jawab Kunci Ujian / Demo Projek (QnA Defense Guide)
**Sistem Informasi Peminjaman Alat Bengkel (SIPAB) v2.0**  
*Panduan taktis bagi mahasiswa untuk menjawab pertanyaan dosen penguji dengan percaya diri, tepat sasaran (2-4 kalimat), dan disertai referensi file serta baris kode.*

---

## 🔐 Bagian 1: Autentikasi, Kata Sandi, & Kriptografi (Q1 - Q5)

### Q1: Apa perbedaan mendasar antara Hashing dan Enkripsi?
* **Jawaban:**  
  Enkripsi adalah proses transformasi data dua arah (*two-way*) yang dirancang untuk dapat didekripsi kembali menjadi bentuk aslinya menggunakan kunci (*key*). Sebaliknya, Hashing adalah proses matematika satu arah (*one-way*) yang tidak dapat dibalikkan (*irreversible*) menjadi teks aslinya; hashing digunakan untuk memverifikasi kecocokan data tanpa perlu mengetahui isi aslinya.
* **Tunjukkan di Kode:**  
  File [`src/controllers/authController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/authController.js) baris 166 (proses hash saat register) dan baris 72 (verifikasi satu arah saat login).

### Q2: Mengapa sistem ini menggunakan bcrypt, bukan MD5 atau SHA-256 murni?
* **Jawaban:**  
  MD5 dan SHA-256 dirancang untuk kecepatan komputasi tinggi sehingga sangat rentan dibobol menggunakan serangan *Brute-Force* dan kartu grafis (GPU) modern dengan miliaran tebakan per detik. Bcrypt dirancang lambat secara adaptif (*slow-by-design*), memiliki *cost factor* (salt rounds), dan otomatis menyematkan *salt* acak sehingga kebal terhadap serangan kamus (*Dictionary Attack*) dan *Rainbow Table*.
* **Tunjukkan di Kode:**  
  File [`src/controllers/authController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/authController.js) baris 166 (`await bcrypt.hash(password, 10)`).

### Q3: Tunjukkan di kode di mana sistem memeriksa password saat login tanpa fallback plaintext!
* **Jawaban:**  
  Pengecekan login sepenuhnya menggunakan fungsi asinkron `bcrypt.compare` terhadap hash yang tersimpan di database. Seluruh jalur fallback perbandingan langsung (`password === user.password`) telah dihapus secara permanen; jika di database terdapat teks polos, fungsi ini otomatis mengembalikan nilai `false`.
* **Tunjukkan di Kode:**  
  File [`src/controllers/authController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/authController.js) baris 72-83:
  ```javascript
  const isMatch = await bcrypt.compare(password, user.password || '');
  if (!isMatch) {
    await recordLoginFailure(req, user.username);
    return res.render('auth/login', { error: 'Password salah!' });
  }
  ```

### Q4: Bagaimana kebijakan password ketat diterapkan pada registrasi dan ganti password?
* **Jawaban:**  
  Sistem mewajibkan panjang kata sandi minimal 10 karakter, harus mengombinasikan huruf besar, huruf kecil, dan angka, serta divalidasi terhadap daftar hitam (*blacklist*) 100+ kata sandi terpopuler (seperti `123456`, `password`, `bengkel123`). Selain itu, kata sandi secara ketat ditolak jika memuat username pengguna untuk mencegah tebakan kredensial sederhana.
* **Tunjukkan di Kode:**  
  File [`src/utils/passwordPolicy.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/utils/passwordPolicy.js) baris 32-75 dan integrasinya pada Zod schema di [`src/controllers/authController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/authController.js) baris 24-32 serta [`src/controllers/profilController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/profilController.js) baris 108.

### Q5: Apa itu Session Fixation Attack dan bagaimana aplikasi ini mencegahnya?
* **Jawaban:**  
  *Session Fixation* adalah serangan di mana penyerang menetapkan ID sesi tertentu kepada korban sebelum login, lalu membajak akun korban setelah korban berhasil login dengan ID sesi tersebut. Aplikasi ini mencegahnya dengan memanggil `req.session.regenerate()` segera setelah password terverifikasi, sehingga ID sesi lama langsung dihancurkan dan diganti dengan ID sesi baru yang sepenuhnya acak.
* **Tunjukkan di Kode:**  
  File [`src/controllers/authController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/authController.js) baris 91-97 (`req.session.regenerate(...)`).

---

## 🍪 Bagian 2: Sesi, Cookie, & State Management (Q6 - Q10)

### Q6: Apa perbedaan antara Sesi (Session) dan Cookie?
* **Jawaban:**  
  Cookie adalah berkas data kecil yang disimpan di sisi browser klien dan dikirimkan ke server pada setiap request HTTP. Sesi adalah ruang penyimpanan data sensitif (seperti status login, role, dan user ID) yang tersimpan aman di sisi server; browser klien hanya memegang token ID sesi di dalam cookie untuk mengidentifikasi dirinya.
* **Tunjukkan di Kode:**  
  File [`src/config/session.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/config/session.js) baris 25-37 (konfigurasi nama cookie `sipab_session` dan session store MySQL).

### Q7: Apa fungsi flag `httpOnly`, `secure`, dan `sameSite` pada cookie sesi? Tunjukkan di kode!
* **Jawaban:**  
  Flag `httpOnly: true` melarang skrip JavaScript klien (seperti `document.cookie`) membaca cookie untuk mencegah pencurian sesi via serangan XSS. Flag `secure: true` memastikan cookie hanya ditransmisikan melalui protokol terenkripsi HTTPS. Flag `sameSite: 'lax'` mencegah cookie dikirimkan secara otomatis pada request lintas situs ilegal guna memitigasi serangan CSRF.
* **Tunjukkan di Kode:**  
  File [`src/config/session.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/config/session.js) baris 31-36:
  ```javascript
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24
  }
  ```

### Q8: Mengapa sesi pengguna disimpan di database (`express-mysql-session`), bukan di memori server?
* **Jawaban:**  
  Karena aplikasi ini di-deploy pada arsitektur serverless (seperti Vercel) di mana instans server bersifat stateless dan dapat di-reboot atau diskalakan kapan saja. Jika sesi disimpan di memori lokal RAM server (*MemoryStore*), pengguna akan otomatis ter-logout setiap kali instans berganti; dengan session store MySQL, sesi tetap persisten di semua node server.
* **Tunjukkan di Kode:**  
  File [`src/config/session.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/config/session.js) baris 15-24 (`new MySQLStore(sessionStoreOptions, pool)`).

### Q9: Kapan session cookie kedaluwarsa dan bagaimana cara menghapusnya saat logout?
* **Jawaban:**  
  Cookie sesi diatur dengan masa berlaku `maxAge` 24 jam ($86.400.000$ ms). Saat logout, server memanggil `req.session.destroy()` untuk menghapus baris sesi dari database MySQL dan mengeksekusi `res.clearCookie('sipab_session')` untuk memusnahkan cookie dari peramban klien.
* **Tunjukkan di Kode:**  
  File [`src/controllers/authController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/authController.js) baris 214-220 (`req.session.destroy(...)`).

### Q10: Bagaimana aplikasi menangani sesi jika koneksi database mengalami gangguan sesaat?
* **Jawaban:**  
  Session store MySQL dikonfigurasi dengan `clearExpired: true` dan interval pengecekan otomatis, serta memanfaatkan pool koneksi MySQL2 yang siap menghubungkan ulang (*reconnect*) secara transien tanpa mematikan aplikasi utama.
* **Tunjukkan di Kode:**  
  File [`src/config/session.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/config/session.js) baris 16-21.

---

## 🛡️ Bagian 3: OWASP Top 10 & Pertahanan Serangan (Q11 - Q20)

### Q11: Apa itu SQL Injection dan bagaimana aplikasi ini mencegahnya?
* **Jawaban:**  
  SQL Injection adalah teknik eksploitasi di mana penyerang menyisipkan karakter atau perintah SQL jahat ke dalam input pengguna untuk memanipulasi struktur kueri database. Aplikasi ini mencegahnya 100% menggunakan *Parameterized Queries* / *Prepared Statements* (`pool.execute`), di mana input diperlakukan murni sebagai data literal dan tidak pernah digabungkan (*concatenated*) ke dalam string query SQL.
* **Tunjukkan di Kode:**  
  File [`src/controllers/authController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/authController.js) baris 63 dan [`src/controllers/alatController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/alatController.js) baris 67 (`pool.execute(query, params)`).

### Q12: Mengapa validasi skema input Zod saja tidak cukup untuk mencegah SQL Injection?
* **Jawaban:**  
  Zod bertugas memvalidasi tipe data dan batasan format (misal memastikan string alfanumerik atau panjang minimal), namun karakter yang valid dalam bahasa manusia (seperti tanda petik pada nama *O'Connor*) tetap dapat merusak query jika digabungkan secara mentah. Pertahanan SQL Injection yang sebenarnya berada pada lapisan basis data melalui *Prepared Statements* yang memisahkan instruksi SQL dari parameter nilai.
* **Tunjukkan di Kode:**  
  File [`src/controllers/alatController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/alatController.js) baris 6-15 (skema Zod) dan baris 67 (eksekusi kueri berparameter).

### Q13: Apa itu Cross-Site Scripting (XSS) dan bagaimana EJS mencegahnya?
* **Jawaban:**  
  XSS adalah serangan di mana penyerang menyuntikkan skrip HTML/JavaScript berbahaya yang kemudian dieksekusi di browser korban saat memuat halaman web. Template engine EJS mencegahnya secara otomatis melalui sintaks output `<%= %>` yang meng-escape entitas karakter khusus (misal `<` diubah menjadi `&lt;` dan `"` menjadi `&quot;`).
* **Tunjukkan di Kode:**  
  File [`src/views/alat/index.ejs`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/views/alat/index.ejs) baris 114 (`<%= row.nama_barang %>`) dan [`src/views/dashboard.ejs`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/views/dashboard.ejs) baris 41.

### Q14: Kapan sintaks `<%- %>` di EJS berbahaya digunakan?
* **Jawaban:**  
  Sintaks `<%- %>` merender data mentah tanpa *HTML escaping*. Jika digunakan untuk menampilkan input yang berasal dari pengguna atau database eksternal, penyerang dapat menyematkan payload `<script>` atau `<img onerror=...>` yang langsung dieksekusi oleh browser. Sintaks ini di SIPAB hanya digunakan untuk me-render partial layout terpercaya seperti `<%- include('../layout/header') %>`.
* **Tunjukkan di Kode:**  
  File [`src/views/alat/index.ejs`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/views/alat/index.ejs) baris 1 dan baris 2.

### Q15: Apa itu CSRF (Cross-Site Request Forgery) dan bagaimana cara kerjanya?
* **Jawaban:**  
  CSRF adalah serangan di mana situs jahat pihak ketiga memanfaatkan sesi cookie aktif milik korban untuk mengirimkan permintaan transaksi palsu (seperti transfer data atau perubahan password) ke aplikasi target tanpa disadari korban. Karena browser secara otomatis menyertakan cookie target, server yang rentan akan mengira permintaan tersebut sah.
* **Tunjukkan di Kode:**  
  File [`src/middlewares/csrfMiddleware.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/middlewares/csrfMiddleware.js) baris 29-37.

### Q16: Tunjukkan di mana token CSRF diperiksa di backend dan disisipkan di frontend!
* **Jawaban:**  
  Di backend, middleware `csrfProtection` memvalidasi token pada semua metode mutasi (POST, PUT, DELETE) melalui `req.body._csrf` atau header `X-CSRF-Token`. Di frontend, token otomatis disisipkan ke form melalui `<input type="hidden" name="_csrf" value="<%= csrfToken %>">` dan diinjeksikan secara transparan ke panggilan `window.fetch` AJAX di footer layout.
* **Tunjukkan di Kode:**  
  - Backend: [`src/middlewares/csrfMiddleware.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/middlewares/csrfMiddleware.js) baris 29-37.
  - Frontend: [`src/views/layout/footer.ejs`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/views/layout/footer.ejs) baris 40-60.

### Q17: Apa itu IDOR (Insecure Direct Object Reference) yang ditemukan di versi PHP lama?
* **Jawaban:**  
  IDOR adalah kerentanan kontrol akses di mana aplikasi menggunakan input langsung dari pengguna (seperti `id` di URL atau form POST) untuk mengakses/memodifikasi objek database tanpa memverifikasi hak kepemilikan. Pada versi PHP lama (`profil/proses_edit.php`), siswa dapat mengirimkan `id=1` untuk mengubah data akun milik Administrator.
* **Tunjukkan di Kode:**  
  Dokumentasi pembuktian empiris di [`docs/self-testing-before.md`](file:///c:/xampp/htdocs/Projek_P.Web-Native/docs/self-testing-before.md) baris 208-235.

### Q18: Tunjukkan bagaimana versi Node.js ini secara mutlak mencegah kerentanan IDOR pada profil!
* **Jawaban:**  
  Aplikasi Node.js ini mengabaikan seluruh parameter ID yang dikirimkan oleh klien di form atau query URL. Server mengambil identitas pengguna secara eksklusif dari sesi server yang terotentikasi (`req.session.user_id`), sehingga pengguna hanya bisa memodifikasi datanya sendiri.
* **Tunjukkan di Kode:**  
  File [`src/controllers/profilController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/profilController.js) baris 16 dan baris 51:
  ```javascript
  const userId = req.session.user_id; // Nilai dari sesi server terpercaya, BUKAN dari req.body.id
  ```

### Q19: Apa itu Privilege Escalation dan bagaimana aplikasi mencegah siswa mendaftar sebagai Admin?
* **Jawaban:**  
  *Privilege Escalation* adalah eksploitasi di mana pengguna memperoleh hak akses yang lebih tinggi daripada yang semestinya. Pada halaman registrasi publik, aplikasi mencegahnya dengan mengabaikan atribut `role` apa pun yang dikirim klien dan secara tegas menetapkan nilai konstan `const role = 'siswa'` di sisi server.
* **Tunjukkan di Kode:**  
  File [`src/controllers/authController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/authController.js) baris 169 (`const role = 'siswa';`).

### Q20: Tunjukkan di mana validasi role (Role-Based Access Control) diimplementasikan!
* **Jawaban:**  
  Validasi role diterapkan melalui middleware `cekRole(['admin'])` atau `cekRole(['admin', 'guru'])`. Middleware ini memeriksa `req.session.role`; jika role pengguna tidak terdaftar dalam array yang diizinkan, server langsung memotong aliran request dan me-render respons 403 Forbidden.
* **Tunjukkan di Kode:**  
  File [`src/middlewares/authMiddleware.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/middlewares/authMiddleware.js) baris 16-46.

---

## ⚡ Bagian 4: Rate Limiting, Serverless, & Storage Cloud (Q21 - Q25)

### Q21: Kenapa counter Rate Limiting harus disimpan di database, bukan di memori (in-memory) RAM?
* **Jawaban:**  
  Arsitektur serverless di Vercel mengeksekusi request di berbagai instans fungsi independen yang tidak saling berbagi memori RAM. Jika rate limit disimpan di memori, penyerang dapat membagi serangan brute-force ke berbagai instans tanpa pernah terblokir; dengan menyimpannya di tabel database `rate_limits`, counter kegagalan bersifat global dan akurat.
* **Tunjukkan di Kode:**  
  File [`src/middlewares/dbRateLimiter.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/middlewares/dbRateLimiter.js) baris 41-75.

### Q22: Bagaimana sistem mencegah penyerang membypass rate limiter dengan memutar header X-Forwarded-For palsu?
* **Jawaban:**  
  Sistem mengekstrak IP klien menggunakan `req.ip` yang diverifikasi Express melalui reverse proxy hop yang sah (`trust proxy: 1`) sehingga header palsu yang disuntikkan klien diabaikan. Selain itu, kunci rate limit diterapkan pada level username target (`login:user:target`), sehingga jika penyerang mencoba menebak password untuk akun yang sama sebanyak 20 kali, akun tersebut tetap terkunci selama 15 menit (HTTP 429) meski IP dirotasi.
* **Tunjukkan di Kode:**  
  File [`src/middlewares/dbRateLimiter.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/middlewares/dbRateLimiter.js) baris 16-27 dan pembuktiannya di [`scripts/test-rate-limit-spoof.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/scripts/test-rate-limit-spoof.js).

### Q23: Mengapa Vercel membutuhkan Vercel Blob untuk file upload dan tidak bisa disimpan di folder lokal `public/assets/uploads/`?
* **Jawaban:**  
  Serverless function di Vercel memiliki sistem berkas *ephemeral* (bersifat sementara dan hanya-baca di sebagian besar direktori). File apa pun yang ditulis ke disk lokal akan langsung terhapus begitu instans fungsi tersebut dimatikan atau di-deploy ulang. Oleh karena itu, file harus diunggah ke *object storage* eksternal permanen seperti Vercel Blob.
* **Tunjukkan di Kode:**  
  File [`src/utils/storageAdapter.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/utils/storageAdapter.js) baris 72-88.

### Q24: Bagaimana storage adapter memastikan tidak ada file yang diam-diam ditulis ke disk lokal di production?
* **Jawaban:**  
  Pada lingkungan `NODE_ENV === 'production'`, fungsi `uploadImage` secara ketat mewajibkan ketersediaan token `BLOB_READ_WRITE_TOKEN`; jika token tidak ada, fungsi langsung melempar error penolakan dan tidak pernah menulis ke folder lokal. Adaptor penyimpanan disk lokal secara tegas dibatasi hanya untuk lingkungan non-produksi (development/testing).
* **Tunjukkan di Kode:**  
  File [`src/utils/storageAdapter.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/utils/storageAdapter.js) baris 72-88 dan pembuktiannya di [`scripts/test-storage-prod.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/scripts/test-storage-prod.js).

### Q25: Mengapa memeriksa ekstensi file saja (`.jpg`) tidak aman? Tunjukkan di mana validasi Magic Bytes dilakukan!
* **Jawaban:**  
  Ekstensi file mudah dipalsukan; penyerang dapat mengubah nama skrip web berbahaya `backdoor.php` menjadi `backdoor.php.jpg` atau memanipulasi MIME type HTTP header. Fungsi `validateImageMagicBytes` membaca *byte* awal biner file (misal JPEG wajib diawali `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF...WEBP`) untuk membuktikan keaslian struktur berkas sebelum diizinkan diunggah.
* **Tunjukkan di Kode:**  
  File [`src/utils/storageAdapter.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/utils/storageAdapter.js) baris 16-45:
  ```javascript
  export function validateImageMagicBytes(buffer) {
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return { valid: true, mime: 'image/jpeg', ext: '.jpg' };
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return { valid: true, mime: 'image/png', ext: '.png' };
    // ...
  }
  ```

---

## 🏗️ Bagian 5: Arsitektur RESTful, Soft-Delete, & TiDB (Q26 - Q30)

### Q26: Mengapa endpoint manipulasi alat diubah menjadi RESTful murni dan menolak aksi mutasi melalui GET?
* **Jawaban:**  
  Metode GET menurut spesifikasi HTTP dirancang bersifat *idempotent* dan *safe* (hanya untuk membaca data). Membiarkan aksi mutasi seperti `GET /api/alat?action=delete&id=1` membuka celah serangan tautan berbahaya atau *prefetching* otomatis peramban yang dapat menghapus data tanpa sengaja; oleh karena itu aksi mutasi wajib menggunakan POST, PUT, atau DELETE dengan token CSRF.
* **Tunjukkan di Kode:**  
  File [`src/routes/apiAlatRoutes.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/routes/apiAlatRoutes.js) baris 18-26 (pengembalian status HTTP 405 Method Not Allowed jika GET mencoba memicu aksi delete/create/update).

### Q27: Bagaimana sistem menangani penghapusan alat yang memiliki riwayat peminjaman ('kembali' atau 'ditolak')?
* **Jawaban:**  
  Jika alat memiliki transaksi aktif (`pending`, `disetujui`, `menunggu_pengembalian`), penghapusan diblokir (HTTP 400). Jika alat hanya memiliki riwayat masa lalu (`kembali`, `ditolak`), sistem menerapkan *Soft-Delete* (`UPDATE barang SET deleted_at = NOW() WHERE id = ?`). Dengan cara ini, alat tidak lagi muncul di daftar aktif bengkel, namun relasi kueri pada tabel `peminjaman` dan laporan cetak masa lalu tetap utuh 100% tanpa memicu error basis data 500.
* **Tunjukkan di Kode:**  
  File [`src/controllers/alatController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/alatController.js) baris 283-305.

### Q28: Apa fungsi `app.set('trust proxy', 1)` di Express? Kapan itu berbahaya jika salah disetel?
* **Jawaban:**  
  Perintah ini memberi tahu Express bahwa aplikasi berjalan di belakang satu lapis *reverse proxy* (seperti Vercel Edge atau Cloudflare), sehingga Express dapat mempercayai header `X-Forwarded-Proto` untuk mendeteksi protokol HTTPS dan `X-Forwarded-For` untuk menentukan `req.ip`. Konfigurasi ini berbahaya jika aplikasi terekspos langsung ke internet tanpa reverse proxy, karena klien dapat memasukkan header sembarang.
* **Tunjukkan di Kode:**  
  File [`src/app.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/app.js) baris 28 (`app.set('trust proxy', 1);`).

### Q29: Mengapa kita memilih region Vercel `sin1` dan TiDB Cloud region Singapura (`ap-southeast-1`)?
* **Jawaban:**  
  Dalam arsitektur serverless, latensi jaringan antara server fungsi Vercel dan basis data sangat memengaruhi kecepatan respon aplikasi. Dengan menempatkan fungsi Vercel di region Singapura (`sin1`) tepat berdampingan dengan cluster TiDB Cloud di Singapura (`ap-southeast-1`), *Round-Trip Time* (RTT) kueri database dapat ditekan seminimal mungkin (di bawah 10-20 milidetik).
* **Tunjukkan di Kode:**  
  File [`vercel.json`](file:///c:/xampp/htdocs/Projek_P.Web-Native/vercel.json) baris 13 (`"regions": ["sin1"]`).

### Q30: Bagaimana Anda membuktikan secara empiris bahwa seluruh perbaikan keamanan ini benar-benar berfungsi dan bukan sekadar klaim?
* **Jawaban:**  
  Kami telah membangun rangkaian suite pengujian empiris otomatis non-destruktif di folder `scripts/` yang menguji langsung setiap endpoint dan lapisan query terhadap server aktif. Seluruh hasil pengujian tercatat secara objektif di tabel dokumen [`docs/self-testing-after.md`](file:///c:/xampp/htdocs/Projek_P.Web-Native/docs/self-testing-after.md) dan dapat direproduksi kapan saja dengan menjalankan skrip `npm run selftest`.
* **Tunjukkan di Kode:**  
  Eksekusi skrip `npm run selftest` atau jalankan langsung [`scripts/selftest.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/scripts/selftest.js) di hadapan dosen penguji.

### Q31: Bagaimana cara kerja pencegahan race condition stok saat 15 siswa meminjam alat yang tersisa 1 unit secara serentak?
* **Jawaban:**  
  Kami menggunakan transaksi basis data dengan kunci baris (*pessimistic row locking*) `SELECT ... FOR UPDATE` dan pembaruan kondisional `UPDATE barang SET stok = stok - 1 WHERE id = ? AND stok >= 1`. Sistem memverifikasi `affectedRows === 1`; jika nol, transaksi langsung di-`rollback`. Hal ini menjamin tepat satu transaksi yang berhasil memperoleh stok dan stok tidak pernah menjadi negatif.
* **Tunjukkan di Kode:**  
  File [`src/controllers/peminjamanController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/peminjamanController.js) fungsi `accPinjam` baris 150-180 dan pengujian konkurensi di [`scripts/test-module4.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/scripts/test-module4.js) skenario TEST-07.

### Q32: Mengapa stok tidak langsung berkurang saat siswa mengajukan peminjaman (status pending)?
* **Jawaban:**  
  Sesuai dengan semantik aplikasi PHP asli (`api/peminjaman.php`), pengajuan awal oleh siswa hanya bersifat reservasi permohonan (*pending approval*). Stok fisik alat baru resmi dikeluarkan dari bengkel saat Guru memeriksa dan menyetujui permohonan tersebut (`acc`). Hal ini mencegah siswa menahan (*hoarding*) stok barang secara fiktif tanpa persetujuan pihak guru.
* **Tunjukkan di Kode:**  
  File [`docs/loan-logic-semantics.md`](file:///c:/xampp/htdocs/Projek_P.Web-Native/docs/loan-logic-semantics.md) Bagian 1 dan implementasi di [`src/controllers/peminjamanController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/peminjamanController.js) fungsi `ajukanPinjam`.

### Q33: Apa bahaya IDOR pada alur pengembalian barang dan bagaimana cara Node.js memitigasinya?
* **Jawaban:**  
  Pada arsitektur rentan, siswa dapat mengganti parameter URL atau form `id` peminjaman untuk mengajukan pengembalian palsu atas barang milik siswa lain, menyebabkan catatan peminjaman korban ditutup secara tidak sah. Node.js mencegah ini dengan mencocokkan kepemilikan numerik `Number(data.id_user) === Number(req.session.user_id)` pada pembukaan formulir, pemrosesan unggah bukti, hingga penyajian berkas foto. Siswa lain yang mencoba mengakses langsung menerima respons HTTP 403 Forbidden.
* **Tunjukkan di Kode:**  
  File [`src/controllers/peminjamanController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/peminjamanController.js) fungsi `getFormKembali` (baris 255-275), `ajukanKembali` (baris 320-340), dan `getBuktiFoto` (baris 520-540).

### Q34: Bagaimana mekanisme state machine mencegah replay request tombol "Setuju" atau "Terima Pengembalian"?
* **Jawaban:**  
  Setiap transisi status diikat dengan klausa kondisi status asal, contohnya `UPDATE peminjaman SET status = 'disetujui' WHERE id = ? AND status = 'pending'`. Jika pengguna menekan tombol setuju dua kali atau terjadi pengiriman ulang request secara tidak sengaja, request kedua akan mendapati status bukan lagi `pending` (`affectedRows === 0`), sehingga server menolaknya dengan HTTP 409 Conflict tanpa mengurangi stok barang untuk kedua kalinya.
* **Tunjukkan di Kode:**  
  File [`src/controllers/peminjamanController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/peminjamanController.js) baris 175-185 dan skenario TEST-03 di [`scripts/test-module4.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/scripts/test-module4.js).

### Q35: Mengapa bukti foto pengembalian wajib divalidasi dengan magic bytes dan batas 4MB?
* **Jawaban:**  
  Validasi ekstensi nama file di sisi klien mudah dipalsukan penyerang (misalnya mengunggah web shell berkedok `shell.php.jpg`). Fungsi `validateImageMagicBytes` membaca struktur byte biner di awal berkas untuk memastikan file tersebut merupakan format JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), atau WebP yang valid. Batas 4MB diterapkan agar file kompatibel dengan batas payload komputasi serverless Vercel dan penyimpanan Vercel Blob.
* **Tunjukkan di Kode:**  
  File [`src/utils/storageAdapter.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/utils/storageAdapter.js) baris 16-45 dan form di [`src/views/peminjaman/kembali.ejs`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/views/peminjaman/kembali.ejs).

### Q36: Bagaimana sistem menangani potensi deadlock (ER_LOCK_DEADLOCK) pada transaksi konkurensi tinggi?
* **Jawaban:**  
  Ketika banyak transaksi saling berebut mengunci baris data di InnoDB/TiDB, MySQL dapat menghentikan salah satu transaksi dengan kode error 1213 (`ER_LOCK_DEADLOCK`). Controller kami menerapkan mekanisme *automatic retry with backoff* hingga 3 kali percobaan sebelum melempar error ke klien, sehingga lonjakan transaksi konkurensi tinggi dapat diselesaikan dengan mulus tanpa memutus koneksi pengguna.
* **Tunjukkan di Kode:**  
  File [`src/controllers/peminjamanController.js`](file:///c:/xampp/htdocs/Projek_P.Web-Native/src/controllers/peminjamanController.js) fungsi `accPinjam` (baris 135-145) dan `reviewKembali` (baris 410-425).
