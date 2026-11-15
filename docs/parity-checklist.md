# Checklist Paritas Fitur & Endpoint (PHP Legacy ke Node.js Express)

Dokumen ini memetakan seluruh file, halaman, dan endpoint dari inventaris awal aplikasi PHP Native SIPAB ke arsitektur Node.js Express, beserta status implementasi dan perencanaannya.

## 1. Tabel Inventaris Halaman & Endpoint

| No | File PHP Legacy | Peran / Fungsi | Endpoint Target Node.js | Status | Keterangan & Rencana Modul |
|---|---|---|---|---|---|
| 1 | `index.php` | Root Redirect ke Login / Dashboard | `GET /` | **Selesai** | Mengarahkan ke `/dashboard` jika ada sesi, atau `/auth/login` jika belum login. |
| 2 | `auth/login.php` | Tampilan Halaman Login | `GET /auth/login` | **Selesai** | Template Mazer identik, proteksi rate limit, CSRF token. |
| 3 | `auth/proses_login.php` | Autentikasi Pengguna & Sesi | `POST /auth/login` | **Selesai** | Pure `bcrypt.compare`, anti-brute-force DB, penolakan password plaintext. |
| 4 | *(Baru)* | Registrasi Publik Akun Siswa | `GET /auth/register`<br>`POST /auth/register` | **Selesai** | Role terkunci `siswa`, verifikasi password minimal 10 karakter + komposisi + blacklist. |
| 5 | `auth/logout.php` | Terminasi Sesi | `POST /auth/logout`<br>`GET /auth/logout` | **Selesai** | Menghancurkan sesi server & membersihkan cookie sesi di peramban. |
| 6 | `auth/cek_login.php` | Middleware Proteksi Sesi | `isAuthenticated` | **Selesai** | Middleware Express di `src/middlewares/auth.js`. |
| 7 | `auth/cek_role.php` | Middleware Pembatasan Role (RBAC) | `requireRole(['...'])` | **Selesai** | Middleware RBAC di `src/middlewares/auth.js`. |
| 8 | `dashboard.php` (Admin) | Dashboard Metrik Administrator | `GET /dashboard` | **Selesai** | Agregasi total alat, pinjaman aktif, pengguna, dan log aktivitas. |
| 9 | `dashboard.php` (Guru) | Dashboard Verifikasi Guru | `GET /dashboard` | **Selesai** | Metrik alat bengkel, pengembalian butuh review, filter role guru. |
| 10 | `dashboard.php` (Siswa) | Dashboard Peminjaman Siswa | `GET /dashboard` | **Selesai** | Ringkasan alat yang sedang dipinjam siswa dan panduan peminjaman. |
| 11 | `alat/index.php` | Katalog & Manajemen Alat | `GET /alat` | **Selesai** | Tabel inventaris, filter kategori, pencarian parameter, modal tambah & edit. |
| 12 | `alat/tambah.php` | Form Tambah Alat Baru | `POST /api/alat` | **Selesai** | RESTful endpoint, validasi Zod, verifikasi *magic bytes* gambar, CSRF 403. |
| 13 | `alat/edit.php` | Form Pembaruan Alat | `GET /api/alat/:id`<br>`PUT /api/alat/:id` | **Selesai** | RESTful endpoint, validasi form, CSRF token, preservasi gambar lama. |
| 14 | `alat/hapus.php` | Penghapusan Alat | `DELETE /api/alat/:id` | **Selesai** | Soft-delete (`deleted_at`) jika ada riwayat kembali/ditolak, cegah hapus jika dipinjam. |
| 15 | `api/alat.php` | API Legacy Alat (`?action=`) | `GET/POST /api/alat`<br>`PUT/DELETE /api/alat/:id` | **Selesai** | Alias legacy dinonaktifkan demi REST murni, mutasi via GET ditolak HTTP 405. |
| 16 | `users/index.php` | Manajemen Pengguna (Admin) | `GET /users` | **Selesai** | Tabel data pengguna, badge role, filter, proteksi RBAC admin. |
| 17 | `users/tambah.php` | Form Tambah Pengguna Baru | `GET /users/tambah`<br>`POST /users/tambah` | **Selesai** | Validasi Zod, kebijakan password 10 karakter, role admin/guru/siswa. |
| 18 | `users/edit.php` | Form Edit Pengguna | `GET /users/edit/:id`<br>`POST /users/edit/:id` | **Selesai** | Update data profil, proteksi reset password dengan kebijakan kuat. |
| 19 | `users/hapus.php` | Hapus Akun Pengguna | `POST /users/hapus/:id` | **Selesai** | Admin tidak bisa menghapus diri sendiri, cegah penghapusan user berelasi pinjam. |
| 20 | `profil/index.php` | Halaman Pengaturan Profil | `GET /profil` | **Selesai** | Tampil data pengguna yang sedang login berdasarkan `req.session.user.id`. |
| 21 | `profil/proses_edit.php` | Pembaruan Profil Mandiri | `POST /profil` | **Selesai** | Anti-IDOR (hanya ubah profil sendiri), validasi magic bytes foto, password 10 karakter. |
| 22 | `peminjaman/index.php` (Siswa) | Daftar Peminjaman Siswa | `GET /peminjaman` | **Selesai** | Siswa hanya melihat data miliknya (`WHERE id_user = ?`), modal ajukan pinjam. |
| 23 | `peminjaman/index.php` (Guru/Admin) | Daftar Seluruh Peminjaman | `GET /peminjaman` | **Selesai** | Guru/Admin melihat seluruh data peminjaman, filter status, aksi persetujuan. |
| 24 | `peminjaman/proses_pinjam.php` | Pengajuan Peminjaman Alat | `POST /api/peminjaman/ajukan` | **Selesai** | Transaksi atomik, anti-race condition stok (`FOR UPDATE`), status `pending`. |
| 25 | `peminjaman/acc.php` | Persetujuan Pinjaman oleh Guru | `POST /api/peminjaman/:id/acc` | **Selesai** | State machine ketat (`pending` -> `disetujui`), kurangi stok, role Guru/Admin. |
| 26 | `peminjaman/tolak.php` | Penolakan Pinjaman oleh Guru | `POST /api/peminjaman/:id/tolak` | **Selesai** | State machine (`pending` -> `ditolak`), catatan penolakan, role Guru/Admin. |
| 27 | `peminjaman/kembali.php` | Form Pengajuan Pengembalian | `GET /peminjaman/kembali/:id` | **Selesai** | Anti-IDOR (verifikasi kepemilikan peminjaman), unggah bukti foto. |
| 28 | `peminjaman/proses_ajukan_kembali.php` | Unggah Bukti Pengembalian | `POST /peminjaman/kembali/:id` | **Selesai** | Unggah foto bukti (magic bytes, batas 4MB, storageAdapter private), status `menunggu_pengembalian`. |
| 29 | `peminjaman/review_kembali.php` | Halaman Review Pengembalian | `GET /peminjaman/review` | **Selesai** | Verifikasi bukti fisik alat, modal bukti foto terproteksi, tombol terima & tolak pengembalian. |
| 30 | `peminjaman/proses_review_kembali.php` | Eksekusi Review Pengembalian | `POST /api/peminjaman/:id/review` | **Selesai** | Jika terima: stok + 1, status `kembali`. Jika tolak: status `disetujui` + catatan penolakan. |
| 31 | `riwayat/index.php` | Riwayat Peminjaman Siswa | `GET /riwayat` | **Selesai** | Siswa melihat riwayat alat yang selesai dikembalikan atau ditolak. |
| 32 | `api/peminjaman.php` | API Legacy Peminjaman | `GET/POST /api/peminjaman/*` | **Selesai** | RESTful endpoint murni dengan validasi RBAC dan CSRF token, GET mutasi ditolak 405. |
| 33 | `laporan/index.php` | Halaman Laporan Terpadu | `GET /laporan` | **Selesai** | Filter rentang tanggal, filter status peminjaman, proteksi RBAC Guru/Admin. |
| 34 | `laporan/cetak.php` | Ekspor Laporan ke Format PDF | `GET /laporan/cetak/pdf` | **Selesai** | Pembuatan PDF server-side menggunakan `pdfkit`, kop surat SMKN 5 Kuningan, tanda tangan. |
| 35 | *(Fitur Baru Laporan)* | Ekspor Laporan ke Format CSV/Excel | `GET /laporan/cetak/csv` | **Selesai** | Ekspor CSV tabular dengan UTF-8 BOM dan proteksi Formula Injection. |
| 36 | `install.php` & `test.php` | Skrip Inisialisasi Lama | `npm run setup`<br>`npm run selftest` | **Digantikan Skrip** | Digantikan oleh skrip otomasi Node.js modern di `scripts/setup.js` & `scripts/selftest.js`. |

### Catatan Penjelasan Jumlah Entri Paritas (Total 36 Entri)
Terdapat pertanyaan mengapa checklist paritas mencatat total **36 entri**, sedangkan penjumlahan modul adalah 21 + 11 + 3 = 35:
* **21 Entri Selesai (Modul 1 s.d. Modul 3):** Baris no. 1 sampai 21 (Root redirect, Login, Register publik baru, Logout, Middleware Sesi/RBAC, Dashboard Admin/Guru/Siswa, Manajemen Alat & REST API, Manajemen Pengguna, dan Profil mandiri).
* **11 Entri Modul 4 (Peminjaman & Alur Persetujuan):** Baris no. 22 sampai 32 (Peminjaman Siswa & Guru, Pengajuan Pinjam, ACC Pinjam, Tolak Pinjam, Form Kembali Siswa, Pengajuan Bukti Kembali, Review Pengembalian, Eksekusi Review, Riwayat Siswa, dan API Peminjaman RESTful).
* **3 Entri Modul 5 (Pelaporan & Ekspor Data):** Baris no. 33 sampai 35 (Halaman Laporan terpadu, Ekspor PDF landscape A4, dan Ekspor CSV spreadsheet dengan proteksi formula injection).
* **1 Entri Skrip Utilitas (Baris no. 36):** File legasi `install.php` & `test.php` dari versi PHP lama tidak dijadikan endpoint web karena risiko keamanan, melainkan **digantikan oleh skrip CLI Node.js modern** (`npm run setup` dan `npm run selftest`).
* **Total Keseluruhan Inventaris:** 21 + 11 + 3 + 1 = **36 Entri**.


---

## 2. Rencana Pelaksanaan Tahapan Berikutnya

### Tahap 1: Modul 4 (Peminjaman, Pengembalian, Anti-IDOR, dan Anti-Race Condition)
- **Cakupan**: Baris 22 s.d. 32 pada tabel di atas.
- **Fitur Kunci**:
  1. Transaksi MySQL atomik dengan kunci baris (`FOR UPDATE`) dan kondisional update (`stok = stok - 1 WHERE id = ? AND stok > 0`).
  2. State machine ketat untuk transisi status (`pending` -> `disetujui`/`ditolak` -> `menunggu_pengembalian` -> `kembali`).
  3. Anti-IDOR pada alur pengembalian siswa dan pencegahan akses bukti foto pihak lain.
  4. Penyimpanan bukti pengembalian via `storageAdapter` (magic bytes, batas 4MB, random hex filename).
  5. Pengujian konkurensi multi-request (10-20 request paralel) pada stok tersisa 1.

### Tahap 2: Modul 5 (Pelaporan Terpadu, Ekspor PDF & CSV, Audit Trail)
- **Cakupan**: Baris 33 s.d. 35 pada tabel di atas.
- **Fitur Kunci**:
  1. Laporan peminjaman terintegrasi dengan filter tanggal dan kategori.
  2. Ekspor PDF native dengan `pdfkit` (tanpa dependensi eksternal C++ yang rentan di Vercel).
  3. Ekspor format CSV untuk analisis spreadsheet.
  4. Visualisasi audit log untuk aktivitas sensitif sistem.
