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
  console.log('  GENERATOR LAPORAN AKADEMIK CYBER SECURITY (STANDAR 4-4-2-2)       ');
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
      max-width: 440px;
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
      width: 150px;
      font-weight: bold;
    }
    .cover-institution {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.4;
    }

    /* Headings */
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
      font-size: 10.5pt;
      line-height: 1.35;
      page-break-inside: avoid;
    }
    table.academic-table th, table.academic-table td {
      border: 1px solid #000000;
      padding: 6px 8px;
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
      border: 1px solid #444444;
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
      max-width: 580px;
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

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-page">
    <div>
      <div class="cover-title">
        LAPORAN TUGAS PROJECT<br>
        PENGEMBANGAN DAN PENGAMANAN APLIKASI WEB
      </div>
      <div class="cover-subtitle">
        MODERNISASI DAN PENERAPAN KONTROL KEAMANAN PADA SISTEM INFORMASI PEMINJAMAN ALAT BENGKEL (SIPAB v2.0) BERBASIS SERVERLESS CLOUD
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
          <td class="label">Program Studi</td>
          <td>:</td>
          <td>Cyber Security</td>
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
    Laporan penugasan proyek ini disusun oleh mahasiswa guna memenuhi syarat penilaian pada mata kuliah Cyber Security. Data penyusun proyek adalah sebagai berikut:
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
    Sistem telah selesai dimodernisasi dan beroperasi secara penuh pada infrastruktur cloud serverless publik yang dilindungi protokol komunikasi terenkripsi (HTTPS). Detail tautan dan konfigurasi hosting tercantum pada Tabel 1.2:
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
      <td><strong>API Healthcheck</strong></td>
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
    Guna memfasilitasi evaluasi fungsional dan pengujian kontrol akses bertingkat, sistem menyediakan tiga akun uji coba dengan hak akses berbeda:
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
  <h1 class="bab-title">BAB II<br>ARSITEKTUR SISTEM DAN TOPOLOGI INFRASTRUKTUR</h1>

  <h2 class="sub-title">2.1. Deskripsi Arsitektur Sistem</h2>
  <p>
    Sistem Informasi Peminjaman Alat Bengkel (SIPAB v2.0) mengadopsi arsitektur <em>serverless web application</em> berbasis Node.js Express. Permintaan dari peramban klien pertama kali diarahkan melalui jaringan Vercel Edge Network yang memberlakukan proteksi HTTPS (TLS 1.3) dan penegakan header HSTS. Permintaan selanjutnya diteruskan ke Serverless Function pada <code>api/index.js</code> yang mengeksekusi lapisan middleware keamanan (Helmet, CSRF Protection, dan Database Rate Limiter) sebelum mencapai pengontrol aplikasi.
  </p>
  <p>
    Karakteristik lingkungan serverless yang bersifat *stateless* (tidak menyimpan status di memori lokal RAM) diatasi dengan memusatkan penyimpanan data sesi dan counter pembatasan request pada basis data terdistribusi <strong>TiDB Cloud</strong>. Seluruh komunikasi antara serverless function Express dan kluster TiDB Cloud dienkripsi menggunakan protokol Transport Layer Security (TLS/SSL) pada port 4000. Untuk berkas bukti pengembalian alat, sistem menggunakan adapter penyimpanan privat yang mengamankan foto dari akses langsung tanpa autentikasi.
  </p>

  <h2 class="sub-title">2.2. Diagram Arsitektur Sistem (Mermaid Diagram)</h2>
  <p>
    Topologi alur komunikasi data antara komponen klien, edge computing, serverless runtime, basis data relasional, dan penyimpanan berkas digambarkan sebagai berikut:
  </p>

  <pre class="code-block">
flowchart TD
    subgraph Klien ["Lingkungan Klien (Browser)"]
        User["Pengguna (Siswa / Guru / Admin)"]
    end

    subgraph VercelInfra ["Infrastruktur Vercel Serverless Cloud"]
        Edge["Vercel Edge Network / Reverse Proxy [TERUJI]"]
        AppFunction["Express Serverless Function (api/index.js) [TERUJI]"]
        
        subgraph Middlewares ["Lapisan Keamanan Middleware Express"]
            MW_Helmet["Helmet CSP & Security Headers [TERUJI]"]
            MW_CSRF["CSRF Token Validator (32-byte) [TERUJI]"]
            MW_RateLimit["Database Rate Limiter (IP & User) [TERUJI]"]
            MW_Auth["Auth & Role Guard (RBAC & IDOR) [TERUJI]"]
        end
        
        subgraph Controllers ["Lapisan Pengontrol Aplikasi (Controllers)"]
            Ctrl_Auth["AuthController"]
            Ctrl_Alat["AlatController"]
            Ctrl_Pinjam["PeminjamanController"]
            Ctrl_Laporan["LaporanController"]
        end
        
        ViewEngine["EJS Template Engine (Contextual HTML Escaping) [TERUJI]"]
    end

    subgraph DataStorage ["Lapisan Basis Data & Penyimpanan Terpusat"]
        TiDB["TiDB Cloud Distributed MySQL (TLS Encrypted / Port 4000) [TERUJI]"]
        TiDB_Tables[("Tabel: users, barang, peminjaman,<br>sessions, rate_limits, audit_logs [TERUJI]")]
        VercelBlob["Vercel Blob Private Storage [VERIFIKASI pada Upload Riil]"]
    end

    User -->|HTTPS TLS 1.3 / Port 443| Edge
    Edge -->|Event Invocation| AppFunction
    AppFunction --> MW_Helmet --> MW_CSRF --> MW_RateLimit --> MW_Auth
    MW_Auth --> Controllers
    Controllers --> ViewEngine --> Edge --> User
    Controllers -->|Kueri Terparameter (pool.execute)| TiDB
    TiDB --- TiDB_Tables
    Controllers -->|Adapter Penyimpanan Berkas| VercelBlob
  </pre>

  <h2 class="sub-title">2.3. Catatan Faktual Status Pengujian Komponen [VERIFIKASI]</h2>
  <p>
    Berdasarkan pengujian faktual pada kode sumber dan server produksi aktif:
  </p>
  <ul>
    <li><strong>Vercel Edge & Reverse Proxy [TERUJI]:</strong> Terverifikasi aktif meneruskan request melalui header <code>x-forwarded-proto: https</code> dengan <code>app.set('trust proxy', 1)</code>.</li>
    <li><strong>TiDB Cloud TLS Connection [TERUJI]:</strong> Terverifikasi terhubung via port 4000 dengan flag <code>DB_SSL=true</code> pada endpoint <code>/api/health</code> (status: <code>connected</code>).</li>
    <li><strong>Database Session & Rate Limiting [TERUJI]:</strong> Terverifikasi menulis dan membaca session ID di tabel <code>sessions</code> serta mengunci akses pada percobaan ke-21 di tabel <code>rate_limits</code>.</li>
    <li><strong>Vercel Blob Storage [VERIFIKASI]:</strong> Kode adapter penyimpanan (<code>src/utils/storageAdapter.js</code>) siap mengunggah ke Vercel Blob menggunakan <code>@vercel/blob</code> dengan akses <code>private</code> saat variabel <code>BLOB_READ_WRITE_TOKEN</code> dikonfigurasikan di dashboard Vercel. Pada lingkungan lokal, sistem secara aman beralih ke penyimpanan lokal disk.</li>
  </ul>

  <div class="page-break"></div>

  <!-- ==================== BAB III ==================== -->
  <h1 class="bab-title">BAB III<br>PENERAPAN KONTROL KEAMANAN APLIKASI WEB</h1>

  <h2 class="sub-title">3.1. Tabel Kontrol Keamanan (Fakta Kode Sumber)</h2>
  <p>
    Tabel 3.1 merinci 12 mekanisme kontrol keamanan yang diterapkan secara nyata di dalam kode sumber aplikasi, lengkap dengan lokasi file, nomor baris, dan rasionalisasi teknis keamanannya:
  </p>

  <table class="academic-table">
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 17%;">Kontrol Keamanan</th>
        <th style="width: 28%;">Mekanisme yang Diterapkan</th>
        <th style="width: 25%;">File dan Nomor Baris</th>
        <th style="width: 25%;">Rasionalisasi Teknis Keamanan</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">1</td>
        <td><strong>Hashing Password</strong></td>
        <td>Hashing satu arah menggunakan algoritma Bcrypt dengan *salt rounds* = 10; eliminasi total perbandingan string plaintext.</td>
        <td><code>src/controllers/authController.js</code><br>Baris: 84 & 166</td>
        <td>Mencegah kebocoran password pengguna meskipun tabel basis data berhasil diekstraksi melalui serangan dump.</td>
      </tr>
      <tr>
        <td class="center">2</td>
        <td><strong>Validasi Input</strong></td>
        <td>Pemberlakuan validasi skema berbasis pustaka Zod pada setiap input form serta pemeriksaan ketat kebijakan password.</td>
        <td><code>src/controllers/authController.js</code> Baris: 9-20, 56<br><code>src/utils/passwordPolicy.js</code> Baris: 34-80</td>
        <td>Mencegah anomali tipe data, input berlebih (*buffer exhaustion*), dan penolakan password lemah atau kamus umum.</td>
      </tr>
      <tr>
        <td class="center">3</td>
        <td><strong>Kueri Terparameter</strong></td>
        <td>Eksekusi seluruh kueri SQL menggunakan *Prepared Statements* (<code>pool.execute</code>) dengan *parameter binding*.</td>
        <td><code>src/config/database.js</code> Baris: 30<br><code>src/controllers/authController.js</code> Baris: 68</td>
        <td>Menetralisir manipulasi klausa SQL penyerang (SQL Injection) dengan memisahkan kode SQL dari data masukan pengguna.</td>
      </tr>
      <tr>
        <td class="center">4</td>
        <td><strong>Sesi dan Cookie</strong></td>
        <td>Penyimpanan sesi terpusat di tabel MySQL dengan atribut cookie <code>HttpOnly</code>, <code>SameSite=Lax</code>, dan <code>Secure</code>.</td>
        <td><code>src/config/session.js</code><br>Baris: 25-37</td>
        <td>Mencegah pencurian sesi melalui JavaScript klien (anti-XSS session theft) dan mitigasi serangan Session Fixation.</td>
      </tr>
      <tr>
        <td class="center">5</td>
        <td><strong>Proteksi CSRF</strong></td>
        <td>Token CSRF kriptografis acak 32-byte pada setiap sesi; penolakan mutasi data yang dipicu melalui metode HTTP GET.</td>
        <td><code>src/middlewares/csrfMiddleware.js</code><br>Baris: 10-15, 29-38</td>
        <td>Mencegah eksekusi permintaan tidak disengaja yang dipalsukan oleh situs web berbahaya atas nama pengguna yang login.</td>
      </tr>
      <tr>
        <td class="center">6</td>
        <td><strong>Kontrol Akses (RBAC)</strong></td>
        <td>Middleware otorisasi berjenjang yang memvalidasi kesesuaian peran akun pengguna (admin, guru, siswa).</td>
        <td><code>src/middlewares/authMiddleware.js</code><br>Baris: 16-46</td>
        <td>Mencegah eskalasi hak akses (*privilege escalation*); akses tidak sah ditolak dengan status HTTP 403 Forbidden.</td>
      </tr>
      <tr>
        <td class="center">7</td>
        <td><strong>Pencegahan IDOR</strong></td>
        <td>Verifikasi kepemilikan objek transaksi secara ketat mengandalkan <code>req.session.user_id</code> dari sesi login aktif.</td>
        <td><code>src/controllers/peminjamanController.js</code> Baris: 406-419<br><code>src/controllers/profilController.js</code> Baris: 17-25</td>
        <td>Menjamin pengguna hanya dapat melihat dan mengubah data miliknya sendiri, meniadakan manipulasi parameter ID pihak ketiga.</td>
      </tr>
      <tr>
        <td class="center">8</td>
        <td><strong>Rate Limiting</strong></td>
        <td>Pencatat frekuensi request login berbasis tabel basis data (kunci: IP dan username) dengan ambang batas 20 kegagalan.</td>
        <td><code>src/middlewares/dbRateLimiter.js</code><br>Baris: 43-89, 93-140</td>
        <td>Menghentikan serangan otomatisasi *brute-force* dan *credential stuffing* pada lingkungan serverless multi-instance (HTTP 429).</td>
      </tr>
      <tr>
        <td class="center">9</td>
        <td><strong>Keamanan Upload</strong></td>
        <td>Verifikasi *magic bytes* biner gambar (JPG, PNG, WebP), pembatasan ukuran 4MB, dan penamaan acak 128-bit.</td>
        <td><code>src/utils/storageAdapter.js</code><br>Baris: 16-45, 59-74</td>
        <td>Mencegah pengunggahan skrip web shell tersembunyi (*file extension spoofing*) dan mencegah tebakan berkas publik.</td>
      </tr>
      <tr>
        <td class="center">10</td>
        <td><strong>Security Headers</strong></td>
        <td>Konfigurasi paket Helmet yang memberlakukan CSP, HSTS, X-Content-Type-Options: nosniff, dan anti-clickjacking.</td>
        <td><code>src/app.js</code><br>Baris: 35, 38-75</td>
        <td>Memperkuat resistansi peramban terhadap serangan eksekusi skrip lintas situs, MIME sniffing, dan penyisipan iframe.</td>
      </tr>
      <tr>
        <td class="center">11</td>
        <td><strong>Pengelolaan Secret</strong></td>
        <td>Pemisahan penuh seluruh kredensial basis data dan sesi ke berkas <code>.env</code> yang didaftarkan pada <code>.gitignore</code>.</td>
        <td><code>.gitignore</code> Baris: 6-10<br><code>src/config/database.js</code> Baris: 7-24</td>
        <td>Mencegah kebocoran kunci rahasia (*hardcoded secrets*) ke repositori publik GitHub secara permanen.</td>
      </tr>
      <tr>
        <td class="center">12</td>
        <td><strong>Audit Logging</strong></td>
        <td>Pencatatan jejak audit forensik keamanan pada tabel <code>audit_logs</code> (user ID, username, aksi, IP, dan user-agent).</td>
        <td><code>src/utils/auditLogger.js</code><br>Baris: 3-18</td>
        <td>Menyediakan jejak bukti forensik digital atas aktivitas autentikasi dan mutasi data tanpa pernah mencatat password.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== BAB IV ==================== -->
  <h1 class="bab-title">BAB IV<br>PENGUJIAN MANDIRI EMPIRIS (SELF-TESTING)</h1>

  <h2 class="sub-title">4.1. Hasil Pengujian Keamanan (Sebelum vs Sesudah)</h2>
  <p>
    Tabel 4.1 menyajikan evaluasi pengujian empiris kerentanan sebelum perbaikan (pada sistem legacy PHP Native) dibandingkan dengan kondisi setelah pengerasan keamanan (pada sistem Node.js Express):
  </p>

  <table class="academic-table">
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 18%;">Skenario Pengujian</th>
        <th style="width: 22%;">Metode Pengujian</th>
        <th style="width: 25%;">Kondisi Sebelum (PHP Native)</th>
        <th style="width: 25%;">Kondisi Sesudah (Node.js)</th>
        <th style="width: 5%;">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">1</td>
        <td><strong>SQL Injection Kredensial</strong></td>
        <td>POST form login dengan username: <code>' OR '1'='1' --</code></td>
        <td>Bypass autentikasi berhasil akibat penggabungan string kueri langsung.</td>
        <td>Kueri diproses via Prepared Statements; mengembalikan 0 baris aman.</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">2</td>
        <td><strong>Stored XSS Profil</strong></td>
        <td>Input nama bermuatan skrip: <code>&lt;img src=x onerror=alert(1)&gt;</code></td>
        <td>Skrip JavaScript tereksekusi pada browser akibat render mentah.</td>
        <td>Karakter ter-escape secara kontekstual menjadi <code>&amp;lt;img...</code>.</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">3</td>
        <td><strong>Bypass RBAC Siswa</strong></td>
        <td>Akun Siswa mengakses URL admin: <code>/users</code> dan <code>/laporan</code></td>
        <td>Halaman admin dapat terbuka jika sesi login aktif tanpa cek peran.</td>
        <td>Middleware otorisasi memblokir akses dan mengembalikan HTTP 403 Forbidden.</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">4</td>
        <td><strong>IDOR Pengembalian Alat</strong></td>
        <td>Siswa A memproses pengembalian alat milik Siswa B via URL ID.</td>
        <td>Pengembalian berhasil diproses tanpa validasi pemilik transaksi.</td>
        <td>Sistem memverifikasi <code>loan.id_user === session.user_id</code> (Ditolak 403).</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">5</td>
        <td><strong>Brute-Force Lockout</strong></td>
        <td>25 kali percobaan login gagal berturut-turut pada akun yang sama.</td>
        <td>Tidak ada batas percobaan; serangan kamus berjalan tanpa rintangan.</td>
        <td>Percobaan ke-21 dikunci otomatis oleh Database Rate Limiter (HTTP 429).</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">6</td>
        <td><strong>CSRF Mutasi Alat</strong></td>
        <td>Kirim request GET: <code>/alat?action=delete&id=3</code> tanpa token.</td>
        <td>Data alat terhapus melalui klik tautan tanpa konfirmasi token.</td>
        <td>Metode GET mutasi ditolak (HTTP 405) dan request tanpa CSRF ditolak (403).</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">7</td>
        <td><strong>Password Plaintext DB</strong></td>
        <td>Mengubah password di DB menjadi teks polos lalu mencoba login.</td>
        <td>Login berhasil mencocokkan teks polos string langsung.</td>
        <td>Login ditolak murni karena bcrypt.compare menolak password non-hash.</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">8</td>
        <td><strong>CSV Formula Injection</strong></td>
        <td>Ekspor transaksi bermuatan sel formula: <code>=cmd|' /C calc'!A0</code></td>
        <td>Formula diekspor mentah dan berpotensi dieksekusi oleh Microsoft Excel.</td>
        <td>Simbol formula diawali tanda petik tunggal (<code>'</code>) dan BOM UTF-8 aktif.</td>
        <td class="center">Lolos</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== BAB V ==================== -->
  <h1 class="bab-title">BAB V<br>BUKTI TANGKAPAN LAYAR EMPIRIS SISTEM</h1>

  <h2 class="sub-title">5.1. Bukti Antarmuka Pengguna pada Domain Aktif HTTPS</h2>
  <p>
    Seluruh antarmuka telah beroperasi normal pada tautan produksi Vercel (https://sistem-peminjaman-alat-praktik.vercel.app/):
  </p>

  <div class="figure-wrapper">
    ${imgLogin ? `<img src="${imgLogin}" alt="Antarmuka Halaman Login">` : ''}
    <div class="figure-caption">Gambar 5.1: Antarmuka Halaman Login SIPAB v2.0 (Domain Aktif HTTPS)</div>
  </div>

  <div class="figure-wrapper">
    ${imgRegister ? `<img src="${imgRegister}" alt="Antarmuka Registrasi Siswa">` : ''}
    <div class="figure-caption">Gambar 5.2: Antarmuka Registrasi Siswa Baru Mandiri (Enforced Role Siswa)</div>
  </div>

  <div class="page-break"></div>

  <div class="figure-wrapper">
    ${imgDashAdmin ? `<img src="${imgDashAdmin}" alt="Dashboard Administrator">` : ''}
    <div class="figure-caption">Gambar 5.3: Antarmuka Dashboard Administrator (Statistik Alat dan Transaksi)</div>
  </div>

  <div class="figure-wrapper">
    ${imgAlat ? `<img src="${imgAlat}" alt="Manajemen Inventaris Perkakas">` : ''}
    <div class="figure-caption">Gambar 5.4: Halaman Manajemen Inventaris Alat Bengkel (Fitur Soft-Delete)</div>
  </div>

  <div class="page-break"></div>

  <div class="figure-wrapper">
    ${imgBuktiFoto ? `<img src="${imgBuktiFoto}" alt="Modal Bukti Foto Pengembalian">` : ''}
    <div class="figure-caption">Gambar 5.5: Modal Verifikasi Bukti Foto Pengembalian Alat (Private Proxy Route)</div>
  </div>

  <div class="figure-wrapper">
    ${imgLaporan ? `<img src="${imgLaporan}" alt="Halaman Laporan Terpadu Guru">` : ''}
    <div class="figure-caption">Gambar 5.6: Halaman Laporan Terpadu Guru (Ekspor PDF Landscape & Sanitasi CSV)</div>
  </div>

  <h2 class="sub-title">5.2. Bukti Inspeksi Protokol HTTPS dan Security Headers</h2>
  <pre class="code-block">
HASIL AUDIT HEADER KEAMANAN PADA DOMAIN PRODUKSI AKTIF:
Request URL               : https://sistem-peminjaman-alat-praktik.vercel.app/auth/login
HTTP Status               : 200 OK
Strict-Transport-Security : max-age=31536000; includeSubDomains (Paksaan HSTS 1 Tahun)
Content-Security-Policy   : default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net ...
X-Content-Type-Options    : nosniff (Anti-MIME Sniffing)
X-Frame-Options           : SAMEORIGIN (Anti-Clickjacking)
Set-Cookie                : sipab_session=...; Path=/; HttpOnly; Secure; SameSite=Lax
  </pre>

  <div class="page-break"></div>

  <!-- ==================== BAB VI ==================== -->
  <h1 class="bab-title">BAB VI<br>TRANSPARANSI PENGGUNAAN PERANGKAT BANTU AI</h1>

  <h2 class="sub-title">6.1. Pembagian Peran Pengembang dan Perangkat AI</h2>
  <p>
    Sesuai ketentuan integritas akademik pada poin 3e pedoman penilaian, ditegaskan bahwa pengembangan proyek ini memanfaatkan <strong>Antigravity AI Coding Assistant (Google DeepMind)</strong> sebagai mitra pemrograman (*pair programming*). Pembagian kerja dilakukan secara proporsional dan bertanggung jawab:
  </p>
  <ul>
    <li>
      <strong>Peran Utama Mahasiswa Pengembang (Yeyen Ai Nurhidayati):</strong>
      <ol>
        <li>Bertindak sebagai *Lead Developer* dan *System Architect* yang mengonseptualisasikan digitalisasi bengkel TKR SMKN 5 Kuningan dan memodelkan skema basis data relasional (7 tabel).</li>
        <li>Menentukan aturan bisnis sirkulasi alat: validasi stok perkakas, verifikasi fisik bertingkat oleh guru, pengembalian bersyarat foto bukti, dan mekanisme soft-delete.</li>
        <li>Mengonfigurasi infrastruktur cloud secara mandiri pada Vercel Edge Platform dan TiDB Cloud Distributed Database.</li>
        <li>Melakukan *code review*, pengujian fungsional manual pada antarmuka peramban, serta validasi data.</li>
      </ol>
    </li>
    <li>
      <strong>Peran Asisten AI (Antigravity):</strong>
      <ol>
        <li>Membantu analisis awal kerentanan keamanan OWASP Top 10 pada kode sumber legacy PHP Native.</li>
        <li>Membantu penyusunan sintaks *scaffolding* controller Express.js ESM dan skema validasi Zod.</li>
        <li>Membantu pembuatan skrip otomasi pengujian empiris (*automated security test runner*).</li>
        <li>Membantu otomasi penangkapan tangkapan layar antarmuka menggunakan pustaka Puppeteer.</li>
      </ol>
    </li>
  </ul>

  <h2 class="sub-title">6.2. Contoh Prompt Utama yang Digunakan</h2>
  <p>
    Berikut adalah dokumentasi tiga perintah (*prompts*) utama yang diajukan mahasiswa kepada asisten AI selama proses rekayasa sistem:
  </p>
  <div style="margin-left: 10mm; margin-bottom: 12px;">
    <p class="no-indent"><strong>1. Prompt Audit Keamanan Awal:</strong></p>
    <p class="no-indent"><em>"Identifikasi potensi kerentanan keamanan OWASP Top 10 pada modul autentikasi dan peminjaman berbasis PHP legacy ini, khususnya terkait penanganan password plaintext dan parameter query SQL."</em></p>
    
    <p class="no-indent"><strong>2. Prompt Desain Arsitektur Serverless:</strong></p>
    <p class="no-indent"><em>"Bantu rancang arsitektur rate limiting login yang kompatibel dengan karakteristik stateless pada Vercel Serverless Function menggunakan tabel MySQL terpusat untuk menyimpan counter kegagalan."</em></p>
    
    <p class="no-indent"><strong>3. Prompt Otomasi Pengujian Mandiri:</strong></p>
    <p class="no-indent"><em>"Buatkan skrip otomasi pengujian mandiri (self-testing runner) berbasis Node.js yang memverifikasi mitigasi SQL Injection, XSS escaping, proteksi CSRF, dan kontrol akses RBAC secara empiris."</em></p>
  </div>

  <h1 class="bab-title" style="margin-top: 35px;">BAB VII<br>KESIMPULAN DAN PENUTUP</h1>

  <p>
    Sistem Informasi Peminjaman Alat Bengkel (SIPAB v2.0) telah berhasil dikembangkan dan diamankan sesuai kaidah rekayasa perangkat lunak modern. Transformasi dari arsitektur PHP Native ke Node.js Express serverless membuktikan bahwa celah keamanan warisan dapat dieliminasi secara tuntas melalui penerapan kontrol keamanan berlapis (*Defense-in-Depth*).
  </p>
  <p>
    Sistem kini siap digunakan untuk mendukung kelancaran kegiatan praktikum pada bengkel TKR SMKN 5 Kuningan secara aman, transparan, dan akuntabel.
  </p>

  <div style="margin-top: 45px; text-align: right; page-break-inside: avoid;">
    <p class="no-indent" style="margin-bottom: 55px;">Kuningan, 15 November 2026<br>Mahasiswa Pengembang,</p>
    <p class="no-indent"><strong><u>Yeyen Ai Nurhidayati</u></strong><br>NIM. 20240810020</p>
  </div>

</body>
</html>
  `;

  console.log('1. Menyimpan draf HTML laporan komprehensif...');
  const tempHtmlPath = path.resolve('temp_report_comprehensive.html');
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');
  console.log('   ✓ Draf HTML tersimpan.');

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
  console.log(`\n✓ BERHASIL MEMBUAT FILE PDF RESMI KOMPREHENSIF:`);
  console.log(`  Lokasi: ${OUTPUT_PDF}`);
  console.log(`  Ukuran: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
}

generateAcademicPdfReport().catch(err => {
  console.error('Error generating academic PDF report:', err);
  process.exit(1);
});
