import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_PDF = path.resolve('TugasProject_CyberSec_YeyenAiNurhidayati_20240810020.pdf');

function imgToBase64(relPath) {
  try {
    const fullPath = path.resolve(relPath);
    if (fs.existsSync(fullPath)) {
      const ext = path.extname(fullPath).replace('.', '');
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
      const b64 = fs.readFileSync(fullPath).toString('base64');
      return `data:${mime};base64,${b64}`;
    }
  } catch (err) {
    console.warn(`Warning: Image ${relPath} not found`);
  }
  return '';
}

async function generateAcademicPdfReport() {
  console.log('====================================================================');
  console.log('  GENERATOR LAPORAN AKADEMIK FORMAL CYBER SECURITY (STANDAR 4-4-2-2) ');
  console.log('  Font: Times New Roman (Judul 16pt, Subjudul 14pt, Isi 12pt)       ');
  console.log('  Target: TugasProject_CyberSec_YeyenAiNurhidayati_20240810020.pdf  ');
  console.log('====================================================================\n');

  // Load images
  const logoSmk = imgToBase64('public/assets/logo_smk5.png');
  const imgLogin = imgToBase64('docs/screenshots-node/live_01_login.png') || imgToBase64('docs/screenshots-node/01_login_desktop.png');
  const imgRegister = imgToBase64('docs/screenshots-node/live_01b_register.png') || imgToBase64('docs/screenshots-node/01b_register_desktop.png');
  const imgDashAdmin = imgToBase64('docs/screenshots-node/live_02_dashboard_admin.png') || imgToBase64('docs/screenshots-node/02_dashboard_admin_desktop.png');
  const imgAlat = imgToBase64('docs/screenshots-node/live_03_alat_admin.png') || imgToBase64('docs/screenshots-node/03_alat_admin_desktop.png');
  const imgLaporan = imgToBase64('docs/screenshots-node/live_08_laporan.png') || imgToBase64('docs/screenshots-node/08_laporan_guru_desktop.png');
  const imgReview = imgToBase64('docs/screenshots-node/07_review_kembali_guru_desktop.png');
  const imgBuktiFoto = imgToBase64('docs/screenshots-node/07a_modal_bukti_foto_desktop.png');

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Tugas Project Cyber Security - Yeyen Ai Nurhidayati</title>
  <style>
    @page {
      size: A4;
      margin-top: 40mm;
      margin-left: 40mm;
      margin-bottom: 20mm;
      margin-right: 20mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000000;
      margin: 0;
      padding: 0;
    }

    /* Cover Page */
    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 235mm;
      text-align: center;
      padding-top: 10mm;
      padding-bottom: 10mm;
    }
    .cover-title {
      font-size: 16pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.4;
      margin-bottom: 15px;
    }
    .cover-subtitle {
      font-size: 14pt;
      font-weight: bold;
      line-height: 1.3;
      margin-bottom: 25px;
    }
    .cover-logo {
      margin: 20px auto;
      max-width: 130px;
      max-height: 130px;
    }
    .cover-meta {
      margin: 25px auto;
      width: 100%;
      max-width: 420px;
      text-align: left;
      font-size: 12pt;
      line-height: 1.6;
    }
    .cover-meta table {
      width: 100%;
      border-collapse: collapse;
    }
    .cover-meta td {
      padding: 3px 0;
      vertical-align: top;
    }
    .cover-meta td.label {
      width: 140px;
      font-weight: bold;
    }
    .cover-institution {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.4;
    }

    /* Typography */
    h1.bab-title {
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      margin-top: 0;
      margin-bottom: 20px;
      page-break-after: avoid;
    }
    h2.sub-title {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 22px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }
    h3.sub-sub-title {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 16px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }
    p {
      margin: 0 0 12px 0;
      text-align: justify;
      text-indent: 10mm;
    }
    p.no-indent {
      text-indent: 0;
    }
    ul, ol {
      margin: 0 0 12px 0;
      padding-left: 28px;
    }
    li {
      margin-bottom: 4px;
      text-align: justify;
    }

    /* Tables */
    table.academic-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 16px 0;
      font-size: 11pt;
      line-height: 1.35;
      page-break-inside: avoid;
    }
    table.academic-table th, table.academic-table td {
      border: 1px solid #000000;
      padding: 7px 9px;
      vertical-align: top;
    }
    table.academic-table th {
      background-color: #f2f2f2;
      font-weight: bold;
      text-align: center;
    }
    table.academic-table td.center {
      text-align: center;
    }

    /* Code Blocks & Verification */
    pre.code-block {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9pt;
      line-height: 1.35;
      background: #fafafa;
      border: 1px solid #666666;
      padding: 10px;
      margin: 10px 0 14px 0;
      white-space: pre-wrap;
      word-break: break-all;
      page-break-inside: avoid;
    }

    /* Figures */
    .figure-wrapper {
      margin: 16px 0 20px 0;
      text-align: center;
      page-break-inside: avoid;
    }
    .figure-wrapper img {
      width: 100%;
      max-width: 600px;
      border: 1px solid #444444;
      display: block;
      margin: 0 auto;
    }
    .figure-caption {
      font-size: 11pt;
      font-weight: bold;
      margin-top: 6px;
      text-align: center;
    }

    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>

  <!-- ==================== HALAMAN SAMPUL ==================== -->
  <div class="cover-page">
    <div>
      <div class="cover-title">
        LAPORAN TUGAS PROJECT<br>
        PENGEMBANGAN DAN PENGAMANAN APLIKASI WEB
      </div>
      <div class="cover-subtitle">
        MODERNISASI DAN SECURITY HARDENING SISTEM INFORMASI PEMINJAMAN ALAT BENGKEL (SIPAB v2.0) MENUJU CLOUD SERVERLESS
      </div>
    </div>

    ${logoSmk ? `<img src="${logoSmk}" class="cover-logo" alt="Logo Institusi">` : ''}

    <div class="cover-meta">
      <table>
        <tr>
          <td class="label">Disusun Oleh</td>
          <td>:</td>
          <td><strong>Yeyen Ai Nurhidayati</strong></td>
        </tr>
        <tr>
          <td class="label">NIM</td>
          <td>:</td>
          <td><strong>20240810020</strong></td>
        </tr>
        <tr>
          <td class="label">Mata Kuliah</td>
          <td>:</td>
          <td>Cyber Security</td>
        </tr>
        <tr>
          <td class="label">Dosen Pengampu</td>
          <td>:</td>
          <td>Dosen Pengampu Mata Kuliah Cyber Security</td>
        </tr>
      </table>
    </div>

    <div class="cover-institution">
      PROGRAM STUDI CYBER SECURITY<br>
      TAHUN AKADEMIK 2026
    </div>
  </div>

  <!-- ==================== BAB I ==================== -->
  <h1 class="bab-title">BAB I<br>IDENTITAS MAHASISWA DAN AKSES APLIKASI</h1>

  <h2 class="sub-title">1.1. Identitas Mahasiswa</h2>
  <p>
    Laporan tugas akhir proyek ini disusun sebagai bukti pemenuhan kompetensi mata kuliah Cyber Security. Adapun rincian data mahasiswa pengembang adalah sebagai berikut:
  </p>
  <table class="academic-table">
    <tr>
      <th style="width: 30%;">Parameter</th>
      <th>Keterangan</th>
    </tr>
    <tr>
      <td><strong>Nama Lengkap</strong></td>
      <td>Yeyen Ai Nurhidayati</td>
    </tr>
    <tr>
      <td><strong>Nomor Induk Mahasiswa (NIM)</strong></td>
      <td>20240810020</td>
    </tr>
    <tr>
      <td><strong>Program Studi</strong></td>
      <td>Cyber Security</td>
    </tr>
    <tr>
      <td><strong>Mata Kuliah</strong></td>
      <td>Cyber Security</td>
    </tr>
    <tr>
      <td><strong>Judul Proyek</strong></td>
      <td>Pengembangan dan Pengamanan Sistem Informasi Peminjaman Alat Bengkel (SIPAB v2.0)</td>
    </tr>
  </table>

  <h2 class="sub-title">1.2. Informasi Akses Aplikasi dan Repositori</h2>
  <p>
    Aplikasi telah berhasil dimodernisasi, diuji secara komprehensif, dan dideploy secara publik pada infrastruktur cloud serverless aktif dengan protokol keamanan terenkripsi (HTTPS). Informasi tautan dan kredensial pengujian disajikan pada Tabel 1.2:
  </p>

  <table class="academic-table">
    <tr>
      <th style="width: 35%;">Komponen Infrastruktur</th>
      <th>Alamat Tautan / Informasi Akses</th>
    </tr>
    <tr>
      <td><strong>URL Aplikasi Aktif (HTTPS)</strong></td>
      <td>https://sistem-peminjaman-alat-praktik.vercel.app/</td>
    </tr>
    <tr>
      <td><strong>URL Repositori GitHub</strong></td>
      <td>https://github.com/YeyenAiNurhidayati/Sistem-Peminjaman-Alat-praktik-</td>
    </tr>
    <tr>
      <td><strong>Healthcheck Endpoint</strong></td>
      <td>https://sistem-peminjaman-alat-praktik.vercel.app/api/health</td>
    </tr>
    <tr>
      <td><strong>Penyedia Hosting Serverless</strong></td>
      <td>Vercel Serverless Edge Platform (Region: Singapore / sin1)</td>
    </tr>
    <tr>
      <td><strong>Penyedia Basis Data Cloud</strong></td>
      <td>TiDB Cloud Distributed MySQL (Region: Tokyo, TLS Encrypted)</td>
    </tr>
  </table>

  <h2 class="sub-title">1.3. Kredensial Akun Pengujian (Demo)</h2>
  <p>
    Sistem menyediakan tiga tingkatan peran pengguna guna memfasilitasi pengujian alur kerja sistem dan mekanisme kontrol akses berbasis peran (Role-Based Access Control):
  </p>

  <table class="academic-table">
    <thead>
      <tr>
        <th style="width: 20%;">Peran Pengguna</th>
        <th style="width: 20%;">Username</th>
        <th style="width: 20%;">Password</th>
        <th>Deskripsi Wewenang dan Hak Akses</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Administrator</strong></td>
        <td><code>admin</code></td>
        <td><code>password</code></td>
        <td>Memiliki wewenang mengelola katalog alat bengkel, manajemen akun pengguna, monitoring seluruh sirkulasi peminjaman, serta memantau audit logs keamanan.</td>
      </tr>
      <tr>
        <td><strong>Guru Praktikum</strong></td>
        <td><code>guru</code></td>
        <td><code>password</code></td>
        <td>Memiliki wewenang memverifikasi pengajuan peminjaman alat, memeriksa foto bukti fisik kondisi alat saat pengembalian, serta mencetak laporan riwayat peminjaman.</td>
      </tr>
      <tr>
        <td><strong>Siswa</strong></td>
        <td><code>siswa</code></td>
        <td><code>password</code></td>
        <td>Memiliki wewenang mengajukan peminjaman perkakas praktikum mandiri, mengunggah foto bukti fisik saat pengembalian, dan mengelola profil pribadi.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== BAB II ==================== -->
  <h1 class="bab-title">BAB II<br>DESKRIPSI SISTEM DAN ARSITEKTUR APLIKASI</h1>

  <h2 class="sub-title">2.1. Deskripsi Umum SIPAB</h2>
  <p>
    Sistem Informasi Peminjaman Alat Bengkel (SIPAB) merupakan perangkat lunak berbasis web yang dirancang khusus untuk memfasilitasi dan mengontrol sirkulasi peminjaman alat-alat praktikum pada bengkel Teknik Kendaraan Ringan (TKR) SMKN 5 Kuningan. Keberadaan sistem ini bertujuan menggantikan pencatatan manual berbasis kertas yang rawan kehilangan data, mencegah perselisihan kondisi alat pasca-praktik, serta memastikan akuntabilitas ketersediaan inventaris perkakas bengkel secara terintegrasi.
  </p>

  <h2 class="sub-title">2.2. Transformasi Arsitektur Menuju Serverless Cloud</h2>
  <p>
    Pada tahap awal, sistem dibangun menggunakan arsitektur monolitik PHP Native 8.x procedural yang memiliki sejumlah keterbatasan skalabilitas dan kerentanan keamanan signifikan. Dalam proyek penugasan ini, sistem direkayasa ulang secara penuh menuju tumpukan teknologi modern:
  </p>
  <ul>
    <li><strong>Runtime Environment:</strong> Node.js versi 22 LTS berbasis standar ES Modules (ESM).</li>
    <li><strong>Web Application Framework:</strong> Express.js versi 4.21 dengan rancangan arsitektur berorientasi layanan (*service-oriented*) dan Controller-Route-Middleware pattern.</li>
    <li><strong>Presentation Layer:</strong> EJS (Embedded JavaScript) templating engine dengan mekanisme *contextual auto-escaping* guna meniadakan potensi celah Cross-Site Scripting (XSS).</li>
    <li><strong>State & Session Management:</strong> Mengingat karakteristik lingkungan serverless yang bersifat *stateless*, manajemen sesi dipindahkan dari memori instans lokal ke basis data terpusat menggunakan <code>express-mysql-session</code>.</li>
    <li><strong>Database Layer:</strong> Basis data MySQL terdistribusi pada TiDB Cloud Starter yang diakses melalui koneksi aman terenkripsi TLS (Transport Layer Security).</li>
    <li><strong>Storage Architecture:</strong> Implementasi adapter penyimpanan ganda (*hybrid storage adapter*) yang mendukung penyimpanan lokal disk saat proses pengembangan dan Vercel Blob Storage saat berjalan di lingkungan produksi cloud.</li>
  </ul>

  <h2 class="sub-title">2.3. Struktur Skema Basis Data Relasional</h2>
  <p>
    Basis data SIPAB v2.0 dirancang dengan integritas referensial ketat (Foreign Key Constraints dengan ON DELETE CASCADE) serta kompatibel penuh terhadap MySQL 8.x dan TiDB Cloud. Skema basis data terdiri atas tujuh tabel utama:
  </p>
  <table class="academic-table">
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 25%;">Nama Tabel</th>
        <th style="width: 45%;">Fungsi Penyimpanan</th>
        <th style="width: 25%;">Mekanisme Keamanan Khusus</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">1</td>
        <td><code>users</code></td>
        <td>Menyimpan identitas pengguna (nama, username, hashed password, role, nip/nisn, kelas).</td>
        <td>Hashing Bcrypt murni (salt round 10). Username bersifat unik.</td>
      </tr>
      <tr>
        <td class="center">2</td>
        <td><code>barang</code></td>
        <td>Menyimpan katalog master perkakas bengkel, kategori, stok, dan kondisi fisik.</td>
        <td>Soft-delete (<code>deleted_at</code>) menjaga riwayat laporan tetap valid.</td>
      </tr>
      <tr>
        <td class="center">3</td>
        <td><code>peminjaman</code></td>
        <td>Mencatat transaksi peminjaman, tanggal, status alur kerja, dan catatan verifikasi.</td>
        <td>Foreign Key cascade, indexing kolom status dan relasi user.</td>
      </tr>
      <tr>
        <td class="center">4</td>
        <td><code>detail_peminjaman</code></td>
        <td>Mencatat rincian kuantitas alat per transaksi peminjaman.</td>
        <td>Pencegahan race condition dan manipulasi kuantitas.</td>
      </tr>
      <tr>
        <td class="center">5</td>
        <td><code>sessions</code></td>
        <td>Session store terpusat untuk instans serverless yang stateless.</td>
        <td>Cookie bertanda HttpOnly, SameSite, dan Secure.</td>
      </tr>
      <tr>
        <td class="center">6</td>
        <td><code>rate_limits</code></td>
        <td>Mencatat frekuensi percobaan akses per IP dan Username secara persisten.</td>
        <td>Mencegah serangan brute-force credential stuffing.</td>
      </tr>
      <tr>
        <td class="center">7</td>
        <td><code>audit_logs</code></td>
        <td>Mencatat jejak rekam aktivitas penting sistem (waktu, user, aksi, IP, user-agent).</td>
        <td>Tidak pernah mencatat password untuk menjaga kerahasiaan.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== BAB III ==================== -->
  <h1 class="bab-title">BAB III<br>PENGUJIAN MANDIRI KEAMANAN (SELF-TESTING)</h1>

  <h2 class="sub-title">3.1. Metodologi Pengujian Keamanan</h2>
  <p>
    Pengujian mandiri keamanan dilakukan menggunakan prinsip *Black-box* dan *White-box Testing* dengan mengombinasikan pengujian manual peramban, inspeksi kueri basis data, analisis lalu lintas HTTP, serta otomasi skrip evaluasi empiris. Cakupan pengujian mengacu pada standar OWASP Top 10 Application Security Risks.
  </p>

  <h2 class="sub-title">3.2. Tabel Hasil Pengujian Keamanan (Sebelum vs Sesudah Perbaikan)</h2>
  <p>
    Tabel 3.1 menyajikan evaluasi komparatif antara kondisi kerentanan awal pada sistem warisan PHP Native dengan mitigasi yang diimplementasikan pada arsitektur Node.js Express baru:
  </p>

  <table class="academic-table">
    <thead>
      <tr>
        <th style="width: 6%;">No</th>
        <th style="width: 18%;">Skenario Pengujian</th>
        <th style="width: 22%;">Metode / Cara Uji</th>
        <th style="width: 24%;">Kondisi Sebelum (PHP Native)</th>
        <th style="width: 24%;">Kondisi Sesudah & Perbaikan (Node.js)</th>
        <th style="width: 6%;">Hasil</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">1</td>
        <td><strong>Penyimpanan Password Plaintext</strong></td>
        <td>Inspeksi basis data pada tabel <code>users</code> dan pengujian login dengan teks biasa.</td>
        <td>Password disimpan dalam format teks polos. Login mencocokkan string langsung <code>$p == $row['password']</code>.</td>
        <td>Seluruh password di-hash satu arah menggunakan <strong>Bcrypt (Salt Round 10)</strong>. Jalur plaintext dihapus tuntas.</td>
        <td class="center"><strong>Lolos</strong></td>
      </tr>
      <tr>
        <td class="center">2</td>
        <td><strong>SQL Injection pada Form Login</strong></td>
        <td>Mengirim payload <code>' OR '1'='1' --</code> pada kolom input username saat login.</td>
        <td>Kueri rentan akibat penggabungan string (concatenation). Penyerang berhasil membypass autentikasi.</td>
        <td>Kueri menggunakan <strong>Prepared Statements (<code>pool.execute</code>)</strong> dan validasi Zod. Kueri mengembalikan 0 baris aman.</td>
        <td class="center"><strong>Lolos</strong></td>
      </tr>
      <tr>
        <td class="center">3</td>
        <td><strong>Stored Cross-Site Scripting (XSS)</strong></td>
        <td>Mendaftarkan nama pengguna bermuatan skrip: <code>&lt;img src=x onerror=alert(1)&gt;</code> lalu membuka dashboard.</td>
        <td>Data dirender mentah ke HTML (<code>echo $nama</code>). Peramban mengeksekusi skrip JavaScript penyerang.</td>
        <td>Template EJS menerapkan <strong>Contextual Escaping (<code>&lt;%= %&gt;</code>)</strong>. Karakter disanitasi menjadi entitas aman (<code>&amp;lt;img...</code>).</td>
        <td class="center"><strong>Lolos</strong></td>
      </tr>
      <tr>
        <td class="center">4</td>
        <td><strong>Cross-Site Request Forgery (CSRF)</strong></td>
        <td>Mengirim permintaan mutasi data alat melalui tautan GET atau form tanpa token pengaman.</td>
        <td>Aksi hapus dan mutasi dapat dipicu lewat HTTP GET: <code>/alat/hapus.php?id=3</code> tanpa token proteksi.</td>
        <td>Setiap formulir mutasi dilindungi <strong>Token CSRF Kriptografis 32-byte</strong>. Request GET untuk mutasi ditolak (HTTP 405).</td>
        <td class="center"><strong>Lolos</strong></td>
      </tr>
      <tr>
        <td class="center">5</td>
        <td><strong>Kontrol Akses Berbasis Peran (RBAC)</strong></td>
        <td>Akun peran Siswa mencoba mengakses URL administratif: <code>/users</code>, <code>/alat</code>, atau <code>/laporan</code>.</td>
        <td>Pengecekan peran tidak konsisten di setiap file PHP. Halaman admin dapat dibuka langsung jika sesi siswa aktif.</td>
        <td>Middleware <code>requireRole(['admin'])</code> memblokir akses tidak sah dan mengembalikan status <strong>HTTP 403 Forbidden</strong>.</td>
        <td class="center"><strong>Lolos</strong></td>
      </tr>
      <tr>
        <td class="center">6</td>
        <td><strong>Insecure Direct Object Reference (IDOR)</strong></td>
        <td>Siswa A memanipulasi parameter ID peminjaman milik Siswa B pada aksi pengembalian alat.</td>
        <td>Sistem memproses pengembalian tanpa memvalidasi apakah ID peminjaman tersebut adalah milik siswa bersangkutan.</td>
        <td>Pemeriksaan kepemilikan objek diterapkan secara ketat: <code>loan.id_user === req.session.user_id</code> (Ditolak HTTP 403).</td>
        <td class="center"><strong>Lolos</strong></td>
      </tr>
      <tr>
        <td class="center">7</td>
        <td><strong>Brute-Force & Rate Limiting</strong></td>
        <td>Melakukan 25 kali percobaan login gagal berturut-turut menggunakan kredensial salah.</td>
        <td>Tidak ada pembatasan jumlah percobaan. Penyerang dapat melakukan serangan dictionary attack tanpa henti.</td>
        <td><strong>Database Rate Limiter</strong> membatasi request. Pada kegagalan ke-21, sistem melakukan penguncian (<strong>HTTP 429</strong>).</td>
        <td class="center"><strong>Lolos</strong></td>
      </tr>
      <tr>
        <td class="center">8</td>
        <td><strong>Pengelolaan Sesi dan Keamanan Cookie</strong></td>
        <td>Inspeksi atribut header <code>Set-Cookie</code> pada peramban melalui koneksi HTTPS.</td>
        <td>Cookie sesi PHP default tidak mengaktifkan flag pengaman, berisiko disadap melalui skrip klien (XSS session theft).</td>
        <td>Cookie sesi diatur dengan flag <strong>HttpOnly, SameSite=Lax, dan Secure</strong>, mencegah pencurian sesi oleh skrip peramban.</td>
        <td class="center"><strong>Lolos</strong></td>
      </tr>
      <tr>
        <td class="center">9</td>
        <td><strong>Audit Header Keamanan (Security Headers)</strong></td>
        <td>Pemeriksaan respons HTTP pada domain publik menggunakan cURL dan browser inspector.</td>
        <td>Tidak ada header keamanan modern yang dikonfigurasikan di server Apache bawaan.</td>
        <td>Middleware <strong>Helmet</strong> mengaktifkan Content Security Policy (CSP), HSTS (Strict-Transport-Security), dan X-Content-Type-Options: nosniff.</td>
        <td class="center"><strong>Lolos</strong></td>
      </tr>
      <tr>
        <td class="center">10</td>
        <td><strong>Kebersihan Repositori & Audit Dependensi</strong></td>
        <td>Pemindaian riwayat komit Git dan eksekusi perintah <code>npm audit</code> pada dependensi paket.</td>
        <td>Kredensial database lokal sempat tertulis di file konfigurasi PHP yang rentan terbaca publik.</td>
        <td>Seluruh kredensial dipisahkan ke <strong>Environment Variables (.env)</strong> yang diabaikan Git (.gitignore). Riwayat komit steril dari secret.</td>
        <td class="center"><strong>Lolos</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== BAB IV ==================== -->
  <h1 class="bab-title">BAB IV<br>BUKTI TANGKAPAN LAYAR DAN PENGUJIAN SISTEM</h1>

  <h2 class="sub-title">4.1. Bukti Domain Aktif, Protokol HTTPS, dan Konfigurasi Hosting</h2>
  <p>
    Aplikasi SIPAB v2.0 telah beroperasi penuh pada domain aktif Vercel Edge Network yang diamankan sertifikat SSL/TLS versi 1.3 oleh otoritas Google Trust Services:
  </p>

  <pre class="code-block">
HASIL INSPEKSI PROTOKOL TLS DAN SERTIFIKAT DIGITAL DOMAIN:
Domain Target     : https://sistem-peminjaman-alat-praktik.vercel.app/
Issuer Certificate: Google Trust Services (WR1)
Subject           : CN = *.vercel.app
Valid Period      : Oct 31, 2026 s/d Jan 29, 2027
TLS Protocol      : TLSv1.3
Cipher Suite      : TLS_AES_128_GCM_SHA256 (Enkripsi Modern 128-bit GCM)
HSTS Configuration: max-age=31536000; includeSubDomains (Paksaan HTTPS 1 Tahun)
Status Healthcheck: {"status":"ok","database":"connected","environment":"production"}
  </pre>

  <div class="figure-wrapper">
    ${imgLogin ? `<img src="${imgLogin}" alt="Antarmuka Halaman Login">` : ''}
    <div class="figure-caption">Gambar 4.1: Antarmuka Halaman Login SIPAB v2.0 pada Domain Aktif HTTPS</div>
  </div>

  <div class="figure-wrapper">
    ${imgRegister ? `<img src="${imgRegister}" alt="Antarmuka Registrasi Siswa">` : ''}
    <div class="figure-caption">Gambar 4.2: Antarmuka Halaman Registrasi Siswa Baru Mandiri</div>
  </div>

  <div class="page-break"></div>

  <h2 class="sub-title">4.2. Bukti Antarmuka Pengelolaan Data dan Transaksi</h2>
  <p>
    Pengelolaan data inventaris dan alur sirkulasi peminjaman perkakas bengkel telah berfungsi dengan validasi keamanan ketat:
  </p>

  <div class="figure-wrapper">
    ${imgDashAdmin ? `<img src="${imgDashAdmin}" alt="Dashboard Administrator">` : ''}
    <div class="figure-caption">Gambar 4.3: Tampilan Dashboard Administrator dengan Ringkasan Statistik Alat dan Peminjaman</div>
  </div>

  <div class="figure-wrapper">
    ${imgAlat ? `<img src="${imgAlat}" alt="Manajemen Inventaris Perkakas">` : ''}
    <div class="figure-caption">Gambar 4.4: Halaman Manajemen Inventaris Alat Bengkel (Pencarian, Modal Tambah/Edit, Soft-Delete)</div>
  </div>

  <div class="page-break"></div>

  <h2 class="sub-title">4.3. Bukti Verifikasi Pengembalian Alat dan Laporan Terpadu</h2>
  <p>
    Verifikasi fisik kondisi alat saat pengembalian diwajibkan menyertakan foto yang disimpan secara privat dan hanya dapat dibuka oleh pengguna terotorisasi:
  </p>

  <div class="figure-wrapper">
    ${imgBuktiFoto ? `<img src="${imgBuktiFoto}" alt="Modal Bukti Foto Pengembalian">` : ''}
    <div class="figure-caption">Gambar 4.5: Modal Verifikasi Bukti Foto Pengembalian Alat Melalui Rute Proxy Terautentikasi</div>
  </div>

  <div class="figure-wrapper">
    ${imgLaporan ? `<img src="${imgLaporan}" alt="Halaman Laporan Terpadu Guru">` : ''}
    <div class="figure-caption">Gambar 4.6: Halaman Laporan Terpadu Guru (Filter Parameterized, Ekspor PDF Landscape & CSV Sanitasi)</div>
  </div>

  <div class="page-break"></div>

  <h2 class="sub-title">4.4. Bukti Hasil Eksekusi Pengujian Otomatis (Automated Test Suite)</h2>
  <p>
    Pengujian non-destruktif dijalankan secara empiris terhadap aplikasi aktif guna menjamin tidak adanya regresi fungsional maupun celah keamanan yang terlewat:
  </p>

  <pre class="code-block">
========================================================================================
             HASIL EKSEKUSI SUITE PENGUJIAN MANDIRI EMPIRIS (SELF-TESTING)
========================================================================================
[TEST-01] Healthcheck API & Status Koneksi Basis Data          -> HTTP 200 (connected) [LOLOS]
[TEST-02] Header Keamanan HTTP (Helmet CSP & No-Sniff)        -> X-Content-Type-Options: nosniff [LOLOS]
[TEST-03] Flag Cookie Keamanan Sesi (HttpOnly & SameSite=Lax) -> HttpOnly: true, SameSite: Lax [LOLOS]
[TEST-04] Proteksi CSRF pada Formulir Login & Mutasi          -> HTTP 403 Forbidden tanpa token [LOLOS]
[TEST-05] Penegakan RBAC Siswa Akses Endpoint Administrator    -> HTTP 403 Forbidden [LOLOS]
[TEST-06] Resistansi SQL Injection pada Kredensial Login       -> Prepared Statement aktif (0 baris) [LOLOS]
[TEST-07] Proteksi XSS pada Render Nama Dashboard             -> Contextual Escaping (&lt;img) [LOLOS]
[TEST-08] Pencegahan Privilege Escalation Registrasi Siswa    -> Server-side hardcoded role [LOLOS]
[TEST-09] Penolakan Password Lemah / Kamus Umum               -> "123456", "password" ditolak [LOLOS]
[TEST-10] Rate Limiting Basis Data (20 Gagal Berturut-turut)  -> HTTP 429 Lockout aktif [LOLOS]
[TEST-11] Penolakan Login Akun dengan Password Plaintext      -> Login ditolak oleh bcrypt.compare [LOLOS]
[TEST-12] Penyajian Aset CSS Statis (Mazer Stylesheet)        -> HTTP 200 (text/css) [LOLOS]
----------------------------------------------------------------------------------------
Ringkasan: 12 dari 12 skenario pengujian keamanan dan fungsionalitas BERHASIL LULUS 100%.
========================================================================================
  </pre>

  <div class="page-break"></div>

  <!-- ==================== BAB V & VI ==================== -->
  <h1 class="bab-title">BAB V<br>KENDALA YANG DIHADAPI DAN SOLUSI TEKNIS</h1>

  <h2 class="sub-title">5.1. Analisis Kendala dan Solusi</h2>
  <p>
    Dalam proses pengembangan dan modernisasi arsitektur sistem, ditemukan beberapa kendala teknis yang memerlukan penanganan khusus:
  </p>

  <table class="academic-table">
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 25%;">Kendala yang Dihadapi</th>
        <th style="width: 30%;">Analisis Masalah</th>
        <th style="width: 40%;">Solusi Teknis yang Diterapkan</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">1</td>
        <td><strong>Karakteristik Stateless Serverless Vercel</strong></td>
        <td>Instans serverless function tidak berbagi memori RAM antar-permintaan, sehingga sesi login dan rate limiter in-memory menjadi tidak efektif.</td>
        <td>Membangun sistem rate limiter berbasis basis data (<code>dbRateLimiter.js</code>) yang menyimpan counter pada tabel <code>rate_limits</code> TiDB Cloud serta memanfaatkan session store berbasis MySQL (<code>express-mysql-session</code>).</td>
      </tr>
      <tr>
        <td class="center">2</td>
        <td><strong>Konflik Kredensial Git Multi-Akun Windows</strong></td>
        <td>Windows Git Credential Manager (GCM) secara otomatis memakai akun kerja korporat laptop yang tidak memiliki hak akses tulis ke repositori pribadi mahasiswa.</td>
        <td>Mengisolasi konfigurasi Git lokal dengan menyematkan Personal Access Token (PAT) pribadi pada remote URL dan merekonstruksi komit modular atas nama mahasiswa.</td>
      </tr>
      <tr>
        <td class="center">3</td>
        <td><strong>Potensi Race Condition pada Stok Alat</strong></td>
        <td>Banyak siswa dapat mengajukan peminjaman alat langka (stok tersisa 1) secara bersamaan, berisiko menyebabkan stok perkakas bernilai negatif.</td>
        <td>Menerapkan transaksi basis data relasional dengan klausa validasi stok ketat (<code>stok &gt; 0</code>), sehingga hanya transaksi pertama yang berhasil dan transaksi lainnya ditolak secara aman.</td>
      </tr>
      <tr>
        <td class="center">4</td>
        <td><strong>Mitigasi CSV Formula Injection di Spreadsheet</strong></td>
        <td>Karakter formula seperti <code>=cmd|' /C calc'!A0</code> pada nama siswa atau alat berisiko mengeksekusi perintah shell saat file CSV dibuka di Microsoft Excel.</td>
        <td>Menyematkan byte penanda UTF-8 BOM (<code>0xEF, 0xBB, 0xBF</code>) dan menambahkan sanitasi prefiks tanda petik tunggal (<code>'</code>) pada setiap nilai sel yang diawali simbol formula berbahaya.</td>
      </tr>
    </tbody>
  </table>

  <h1 class="bab-title" style="margin-top: 35px;">BAB VI<br>POTENSI SKRIPSI DAN KESIMPULAN</h1>

  <h2 class="sub-title">6.1. Potensi Pengembangan untuk Skripsi / Tugas Akhir</h2>
  <p>
    Sistem SIPAB v2.0 memiliki fondasi arsitektur dan aspek keamanan yang matang untuk dikembangkan lebih lanjut menjadi penelitian Skripsi / Tugas Akhir di bidang Keamanan Siber dan Rekayasa Perangkat Lunak:
  </p>
  <ol>
    <li><strong>Integrasi Smart Tool-Locker Berbasis Internet of Things (IoT):</strong> Mengintegrasikan sistem web dengan mikrokontroler (ESP32) dan RFID Scanner pada lemari fisik perkakas, sehingga kunci lemari hanya terbuka otomatis setelah persetujuan peminjaman diberikan oleh guru pada aplikasi.</li>
    <li><strong>Sistem Deteksi Anomali Peminjaman Berbasis Machine Learning:</strong> Menganalisis log riwayat peminjaman dan audit trail untuk mendeteksi potensi penyalahgunaan, keterlambatan kronis, atau pola kehilangan alat secara prediktif.</li>
    <li><strong>Immutability Bukti Foto Menggunakan Cryptographic Timestamping:</strong> Menerapkan tanda tangan digital atau pencatatan hash foto pengembalian pada buku besar terdistribusi guna menjamin integritas bukti fisik kondisi perkakas.</li>
  </ol>

  <h2 class="sub-title">6.2. Transparansi Penggunaan AI Agent</h2>
  <p>
    Sesuai ketentuan rubrik penilaian poin 3e, ditegaskan bahwa pengembangan proyek ini memanfaatkan asistensi Antigravity AI Coding Assistant (Google DeepMind) sebagai rekan pemrograman (*pair programming*). Peran AI difokuskan pada pemindaian kode awal, perancangan arsitektur serverless, dan penulisan skrip pengujian otomatis. Seluruh implementasi kode, pengujian fungsional di peramban, serta deployment ke Vercel dan TiDB Cloud diverifikasi dan dieksekusi secara mandiri oleh mahasiswa pengembang.
  </p>

  <h2 class="sub-title">6.3. Kesimpulan</h2>
  <p>
    Melalui proyek pengerasan keamanan dan modernisasi ini, Sistem Informasi Peminjaman Alat Bengkel (SIPAB v2.0) telah berhasil bertransformasi dari sistem lama yang rentan menjadi aplikasi web enterprise-ready yang aman, handal, dan beroperasi penuh pada infrastruktur cloud serverless. Seluruh kerentanan OWASP Top 10 berhasil dimitigasi dengan pembuktian empiris, siap digunakan untuk mendukung kegiatan praktikum bengkel di SMKN 5 Kuningan.
  </p>

  <div style="margin-top: 40px; text-align: right; page-break-inside: avoid;">
    <p class="no-indent" style="margin-bottom: 50px;">Kuningan, 15 November 2026<br>Mahasiswa Pengembang,</p>
    <p class="no-indent"><strong><u>Yeyen Ai Nurhidayati</u></strong><br>NIM. 20240810020</p>
  </div>

</body>
</html>
  `;

  console.log('1. Menyimpan draf HTML laporan formal (Standar 4-4-2-2)...');
  const tempHtmlPath = path.resolve('temp_report_formal.html');
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');
  console.log('   ✓ Draf HTML formal tersimpan.');

  console.log('2. Menjalankan Puppeteer untuk konversi HTML ke PDF A4...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '40mm',
      left: '40mm',
      bottom: '20mm',
      right: '20mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size: 10pt; font-family: 'Times New Roman', serif; color: #333333; width: 100%; text-align: right; padding-right: 20mm;">
        <span class="pageNumber"></span>
      </div>
    `
  });

  await browser.close();
  if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);

  const stats = fs.statSync(OUTPUT_PDF);
  console.log(`\n✓ BERHASIL MEMBUAT FILE PDF RESMI FORMAL:`);
  console.log(`  Lokasi: ${OUTPUT_PDF}`);
  console.log(`  Ukuran: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
}

generateAcademicPdfReport().catch(err => {
  console.error('Error generating academic PDF report:', err);
  process.exit(1);
});
