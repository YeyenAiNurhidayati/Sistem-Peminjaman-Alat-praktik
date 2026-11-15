# Panduan Instalasi & Deployment Mandiri (Setup Guide)
**Sistem Informasi Peminjaman Alat Bengkel (SIPAB) v2.0**  
*Panduan langkah-demi-langkah ramah pemula (tanpa perlu pengalaman Node.js sebelumnya)*

---

## 📋 Daftar Isi
1. [Prasyarat Perangkat Lunak (Software)](file:///c:/xampp/htdocs/Projek_P.Web-Native/SETUP.md#1-prasyarat-perangkat-lunak-software)
2. [Langkah 1: Menjalankan Projek di Komputer Lokal (XAMPP + Node.js)](file:///c:/xampp/htdocs/Projek_P.Web-Native/SETUP.md#2-langkah-1-menjalankan-projek-di-komputer-lokal-xampp--nodejs)
3. [Langkah 2: Menyiapkan Basis Data Cloud Gratis di TiDB Cloud](file:///c:/xampp/htdocs/Projek_P.Web-Native/SETUP.md#3-langkah-2-menyiapkan-basis-data-cloud-gratis-di-tidb-cloud)
4. [Langkah 3: Menyiapkan Repositori GitHub Milik Sendiri](file:///c:/xampp/htdocs/Projek_P.Web-Native/SETUP.md#4-langkah-3-menyiapkan-repositori-github-milik-sendiri)
5. [Langkah 4: Menyiapkan Vercel Blob Storage (Penyimpanan Foto)](file:///c:/xampp/htdocs/Projek_P.Web-Native/SETUP.md#5-langkah-4-menyiapkan-vercel-blob-storage-penyimpanan-foto)
6. [Langkah 5: Deploy Projek ke Vercel](file:///c:/xampp/htdocs/Projek_P.Web-Native/SETUP.md#6-langkah-5-deploy-projek-ke-vercel)
7. [🛠️ Panduan Pemecahan Masalah (Troubleshooting: Jika Muncul Error X, Lakukan Y)](file:///c:/xampp/htdocs/Projek_P.Web-Native/SETUP.md#%EF%B8%8F-panduan-pemecahan-masalah-troubleshooting-jika-muncul-error-x-lakukan-y)

---

## 1. Prasyarat Perangkat Lunak (Software)

Sebelum memulai, pastikan perangkat lunak berikut telah terpasang di laptop Anda:
1. **Node.js (Versi LTS terbaru, minimal v22.x atau v20.x):**  
   Unduh dari [nodejs.org](https://nodejs.org/) (pilih versi LTS). Centang *"Automatically install necessary tools"* saat instalasi.  
   *Cek instalasi di terminal:* `node -v` dan `npm -v`.
2. **XAMPP (untuk database MySQL lokal):**  
   Pastikan modul **MySQL** dapat dijalankan (berwarna hijau di control panel XAMPP).
3. **Git:**  
   Unduh dari [git-scm.com](https://git-scm.com/).
4. **Visual Studio Code (atau teks editor favorit Anda).**

---

## 2. Langkah 1: Menjalankan Projek di Komputer Lokal (XAMPP + Node.js)

### 1. Nyalakan MySQL di XAMPP
Buka **XAMPP Control Panel**, lalu klik tombol **Start** pada modul **MySQL**. (Modul Apache tidak perlu dinyalakan).

### 2. Buka Terminal di Folder Projek
Buka terminal (PowerShell atau Command Prompt) dan arahkan ke folder projek ini:
```bash
cd c:\xampp\htdocs\Projek_P.Web-Native
```

### 3. Buat File Konfigurasi `.env`
Salin file `.env.example` menjadi `.env`:
- Di Windows PowerShell:
  ```powershell
  Copy-Item .env.example .env
  ```
- Atau di Command Prompt:
  ```cmd
  copy .env.example .env
  ```

Buka file `.env` di VS Code dan pastikan isinya untuk database lokal:
```env
PORT=3000
NODE_ENV=development

# Database Lokal XAMPP
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=peminjaman_alat
DB_SSL=false

# Kunci Rahasia Sesi (acak bebas untuk lokal)
SESSION_SECRET=kunci_rahasia_sesi_sipab_lokal_2026
```

### 4. Jalankan Skrip Setup Otomatis
Jalankan perintah berikut:
```bash
npm run setup
```
Skrip ini akan secara otomatis:
- Memeriksa versi Node.js Anda.
- Memeriksa keberadaan file `.env`.
- Menguji koneksi ke basis data MySQL.
- Menjalankan migrasi skema tabel (`schema.sql`).
- Mengisi data awal akun dan barang demo (`seed-demo.sql`).

### 5. Jalankan Aplikasi
```bash
npm run dev
```
Buka browser dan akses:  
👉 **`http://localhost:3000`**

**Akun Uji Coba Awal (Kredensial dikonfigurasi melalui `.env`):**
* **Admin:** Username: `admin` | Password: (sesuai nilai `SEED_ADMIN_PASSWORD` di file `.env`)
* **Guru:** Username: `guru` | Password: (sesuai nilai `SEED_GURU_PASSWORD` di file `.env`)
* **Siswa:** Username: `siswa` | Password: (sesuai nilai `SEED_SISWA_PASSWORD` di file `.env`)

---

## 3. Langkah 2: Menyiapkan Basis Data Cloud Gratis di TiDB Cloud

Aplikasi serverless di Vercel tidak bisa mengakses `localhost` laptop Anda. Oleh karena itu, kita menggunakan database MySQL cloud gratis dari **TiDB Cloud**.

1. Buka [tidbcloud.com](https://tidbcloud.com/) dan klik **Sign Up** (bisa login dengan akun Google atau GitHub Anda).
2. Setelah masuk ke console, klik **Create Cluster**.
3. Pilih paket **Serverless** (Gratis / Free Tier $0).
4. Pilih Cloud Provider **AWS** dan Region **Singapore (ap-southeast-1)**.  
   *(Penting: Region Singapore dipilih agar sama dengan region Vercel `sin1`, sehingga akses data sangat cepat).*
5. Beri nama cluster (misal: `sipab-db`), lalu klik **Create**.
6. Setelah cluster siap (sekitar 30 detik), akan muncul jendela **Connect**:
   - Pilih tab **General Connection**.
   - Catat data yang ditampilkan:
     - **Host:** (contoh: `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`)
     - **Port:** `4000`
     - **User:** (contoh: `xxxxxxxx.root`)
     - **Password:** Klik tombol **Generate Password**, lalu salin dan simpan di catatan rahasia Anda.
7. Di TiDB Cloud console, buka tab **SQL Editor**, lalu:
   - Salin seluruh isi file [`database/schema.sql`](file:///c:/xampp/htdocs/Projek_P.Web-Native/database/schema.sql), tempel ke SQL Editor, lalu klik **Run**.
   - Salin seluruh isi file [`database/seed-demo.sql`](file:///c:/xampp/htdocs/Projek_P.Web-Native/database/seed-demo.sql), tempel ke SQL Editor, lalu klik **Run**.
8. Basis data cloud Anda kini siap digunakan!

---

## 4. Langkah 3: Menyiapkan Repositori GitHub Milik Sendiri

1. Buka [github.com](https://github.com/) dan login ke akun Anda sendiri.
2. Klik tombol **+** di pojok kanan atas, lalu pilih **New repository**.
3. Beri nama repositori, misalnya: `sipab-nodejs`.
4. Pilih opsi **Public** atau **Private** (bebas).
5. **Jangan centang** "Add a README file" (karena projek sudah memiliki README).
6. Klik **Create repository**.
7. Salin URL repositori Anda (contoh: `https://github.com/username-anda/sipab-nodejs.git`).
8. Di terminal komputer Anda, hubungkan projek ke repositori GitHub baru Anda:
   ```bash
   git remote set-url origin https://github.com/username-anda/sipab-nodejs.git
   git push -u origin master
   ```
   *(Jika diminta login oleh GitHub, masukkan kredensial akun GitHub Anda).*

---

## 5. Langkah 4: Menyiapkan Vercel Blob Storage (Penyimpanan Foto)

Di platform serverless Vercel, server tidak memiliki harddisk permanen untuk menyimpan foto yang diunggah pengguna. Kita menggunakan **Vercel Blob** sebagai CDN cloud storage:

1. Buka [vercel.com](https://vercel.com/) dan login menggunakan akun GitHub Anda.
2. Buat projek baru atau buka projek yang telah terhubung ke GitHub Anda.
3. Di dashboard projek Vercel Anda, klik tab **Storage** pada menu bagian atas.
4. Klik tombol **Create Database** atau **Connect Store**, lalu pilih **Blob**.
5. Masukkan nama Blob Store (misal: `sipab-blob`).
6. Pilih region **Singapore (sin1)**.
7. Klik tombol **Create**.
8. Setelah terbuat, buka tab **Settings** pada store tersebut.
9. Cari bagian environment variable dan klik **Copy** pada variabel:
   `BLOB_READ_WRITE_TOKEN` (nilainya berawalan `vercel_blob_rw_...`).

---

## 6. Langkah 5: Deploy Projek ke Vercel

1. Di dashboard utama Vercel, klik tombol **Add New...** > **Project**.
2. Di bagian **Import Git Repository**, cari repositori GitHub Anda (`sipab-nodejs`) dan klik **Import**.
3. Di halaman konfigurasi deployment:
   - **Framework Preset:** Pilih **Other** (jangan ubah, Vercel akan otomatis membaca file `vercel.json`).
   - **Root Directory:** `./`
4. Buka menu akordeon **Environment Variables** dan tambahkan variabel-variabel berikut satu per satu:

| Nama Variabel (Key) | Nilai (Value) | Keterangan |
|---|---|---|
| `NODE_ENV` | `production` | Mengaktifkan mode produksi dan proteksi cookie secure |
| `DB_HOST` | `gateway01.ap-southeast-1.prod.aws.tidbcloud.com` | Host dari TiDB Cloud Anda |
| `DB_PORT` | `4000` | Port TiDB Cloud |
| `DB_USER` | `xxxxxxx.root` | Username dari TiDB Cloud Anda |
| `DB_PASSWORD` | `[Password TiDB Anda]` | Password yang digenerate di TiDB |
| `DB_NAME` | `test` (atau nama DB TiDB Anda) | Nama basis data TiDB |
| `DB_SSL` | `true` | Wajib `true` untuk koneksi aman ke TiDB |
| `SESSION_SECRET` | `[Buat 32 Karakter Acak Bebas]` | Kunci enkripsi sesi express |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_...` | Token dari Vercel Blob (Langkah 4) |

5. Klik tombol **Deploy**!
6. Tunggu proses build selesai (sekitar 1-2 menit).
7. Selamat! Aplikasi SIPAB Anda kini telah tayang di internet dengan domain gratis (contoh: `https://sipab-nodejs.vercel.app`).

---

## 🛠️ Panduan Pemecahan Masalah (Troubleshooting: Jika Muncul Error X, Lakukan Y)

### 🔴 Masalah 1: Error `connect ECONNREFUSED 127.0.0.1:3306` saat `npm run setup`
* **Penyebab:** Modul MySQL di komputer Anda belum menyala.
* **Solusi:**
  1. Buka **XAMPP Control Panel**.
  2. Klik tombol **Start** pada baris **MySQL** sampai labelnya berwarna hijau.
  3. Jalankan kembali `npm run setup`.

---

### 🔴 Masalah 2: Error `Access denied for user 'root'@'localhost'`
* **Penyebab:** Password database lokal Anda tidak kosong atau username salah.
* **Solusi:**
  1. Buka file `.env`.
  2. Jika database XAMPP Anda memiliki password, isi `DB_PASSWORD=password_anda`.
  3. Jika instalasi standar XAMPP tanpa password, pastikan tertulis `DB_PASSWORD=` (kosongkan setelah tanda sama dengan).

---

### 🔴 Masalah 3: Error `Cannot find module` saat menjalankan server
* **Penyebab:** Dependensi Node belum terunduh secara lengkap.
* **Solusi:**
  Jalankan perintah instalasi dependensi di terminal:
  ```bash
  npm install
  ```

---

### 🔴 Masalah 4: Di Vercel muncul `500 INTERNAL SERVER ERROR` atau `Database disconnected`
* **Penyebab:** Variabel environment di dashboard Vercel belum lengkap atau kredensial TiDB salah.
* **Solusi:**
  1. Buka dashboard Vercel > Projek Anda > **Settings** > **Environment Variables**.
  2. Pastikan `DB_SSL` disetel ke `true`.
  3. Periksa kembali `DB_HOST`, `DB_USER`, dan `DB_PASSWORD` apakah sudah sama persis dengan yang ada di konsol TiDB Cloud.
  4. Lakukan re-deploy: Buka tab **Deployments** di Vercel, klik titik tiga `...` pada deployment terakhir, lalu pilih **Redeploy**.

---

### 🔴 Masalah 5: Error Git `Permission denied (publickey)` atau `403 Forbidden` saat git push
* **Penyebab:** Kredensial Git di Windows Credential Manager masih menggunakan akun GitHub orang lain / akun lama.
* **Solusi:**
  1. Buka menu Windows Start, ketik dan buka **Credential Manager** (Pengelola Kredensial).
  2. Pilih **Windows Credentials**.
  3. Cari entri bernama `git:https://github.com`.
  4. Hapus entri tersebut (*Remove*).
  5. Buka terminal kembali dan ketik `git push -u origin master`.
  6. Jendela browser akan muncul meminta Anda untuk login ke akun GitHub Anda sendiri.

---

### 🔴 Masalah 6: Error `429 Too Many Requests` saat mencoba login berkali-kali
* **Penyebab:** Fitur keamanan Rate Limiter mendeteksi 20 kali percobaan gagal berturut-turut dan mengunci akun/IP sementara selama 15 menit.
* **Solusi:**
  1. Tunggu 15 menit hingga lockout kedaluwarsa secara otomatis.
  2. Atau untuk reset manual di database lokal:
     ```sql
     DELETE FROM rate_limits;
     ```
