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

  // Load logo & UI screenshots
  const logoSmk = imgToBase64('public/assets/logo_smk5.png');
  const imgLogin = imgToBase64('docs/screenshots-node/live_01_login.png') || imgToBase64('docs/screenshots-node/01_login_desktop.png');
  const imgRegister = imgToBase64('docs/screenshots-node/live_01b_register.png') || imgToBase64('docs/screenshots-node/01b_register_desktop.png');
  const imgDashAdmin = imgToBase64('docs/screenshots-node/live_02_dashboard_admin.png') || imgToBase64('docs/screenshots-node/02_dashboard_admin_desktop.png');
  const imgAlat = imgToBase64('docs/screenshots-node/live_03_alat_admin.png') || imgToBase64('docs/screenshots-node/03_alat_admin_desktop.png');
  const imgLaporan = imgToBase64('docs/screenshots-node/live_08_laporan.png') || imgToBase64('docs/screenshots-node/08_laporan_guru_desktop.png');
  const imgBuktiFoto = imgToBase64('docs/screenshots-node/07a_modal_bukti_foto_desktop.png');

  // Load "Sebelum" screenshots (PHP Native di XAMPP)
  const imgBefore01 = imgToBase64('docs/screenshots-selftest/before_01_db_passwords_plaintext.png');
  const imgBefore02 = imgToBase64('docs/screenshots-selftest/before_02_rbac_api_alat_bypass.png');
  const imgBefore03 = imgToBase64('docs/screenshots-selftest/before_03_sqli_error_page.png');
  const imgBefore04 = imgToBase64('docs/screenshots-selftest/before_04_xss_raw_html.png');
  const imgBefore05 = imgToBase64('docs/screenshots-selftest/before_05_idor_profile.png');

  // Load "Sesudah" screenshots (Node.js Express pada Vercel HTTPS)
  const imgAfter01 = imgToBase64('docs/screenshots-selftest/01_sqli_login_rejected.png');
  const imgAfter02 = imgToBase64('docs/screenshots-selftest/02_xss_sanitized_dashboard.png');
  const imgAfter03 = imgToBase64('docs/screenshots-selftest/03_idor_denied_403.png');
  const imgAfter04 = imgToBase64('docs/screenshots-selftest/04_rbac_admin_forbidden_403.png');
  const imgAfter05 = imgToBase64('docs/screenshots-selftest/05_weak_password_rejected.png');
  const imgAfter06 = imgToBase64('docs/screenshots-selftest/06_rate_limit_429_lockout.png');
  const imgAfter07 = imgToBase64('docs/screenshots-selftest/07_session_cookie_logout_redirect.png');
  const imgAfter08 = imgToBase64('docs/screenshots-selftest/08_csrf_missing_token_403.png');
  const imgAfter09 = imgToBase64('docs/screenshots-selftest/09_https_ssl_headers_audit.png');
  const imgAfter10 = imgToBase64('docs/screenshots-selftest/10_secret_dependency_audit.png');
  const imgAfter11 = imgToBase64('docs/screenshots-selftest/after_11_hosting_vercel_tidb.png');

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
      width: 140px;
      font-weight: bold;
    }
    .cover-institution {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.3;
      margin-top: 20px;
    }

    /* Heading Styles */
    h1.bab-title {
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      margin-top: 0;
      margin-bottom: 22px;
      line-height: 1.3;
      page-break-before: always;
    }
    h1.bab-title.first {
      page-break-before: avoid;
    }
    h2.sub-title {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 18px;
      margin-bottom: 10px;
      line-height: 1.3;
    }
    h3.sub-sub-title {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 14px;
      margin-bottom: 6px;
    }

    p {
      text-align: justify;
      text-indent: 10mm;
      margin: 0 0 10px 0;
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

    /* Code Blocks */
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
      margin: 14px 0 18px 0;
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
          <td class="label">Nama Mahasiswa</td>
          <td style="width: 10px;">:</td>
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
  <h1 class="bab-title first">BAB I<br>IDENTITAS, AKSES APLIKASI, DAN LATAR BELAKANG</h1>

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
      <td><a href="https://sistem-peminjaman-alat-praktik.vercel.app/" style="color:#000; text-decoration:none;">https://sistem-peminjaman-alat-praktik.vercel.app/</a></td>
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
      <td>TiDB Cloud Distributed MySQL (Region: Singapore / ap-southeast-1, TLS Port 4000)</td>
    </tr>
  </table>

  <h2 class="sub-title">1.3. Kredensial Akun Pengujian (Demo Akun Kuat)</h2>
  <p>
    Guna memfasilitasi evaluasi fungsional dan pengujian kontrol akses bertingkat tanpa melanggar kebijakan kata sandi sistem, disediakan tiga akun pengujian resmi yang telah memenuhi standar password policy (minimal 10 karakter, kombinasi huruf besar, kecil, angka, dan simbol):
  </p>

  <table class="academic-table">
    <thead>
      <tr>
        <th style="width: 20%;">Peran Pengguna</th>
        <th style="width: 18%;">Username</th>
        <th style="width: 24%;">Password</th>
        <th>Deskripsi Wewenang dan Hak Akses</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Administrator</strong></td>
        <td><code>admin</code></td>
        <td><code>SuperBengkel#2026!</code></td>
        <td>Memiliki wewenang mengelola katalog alat bengkel, manajemen akun pengguna, monitoring seluruh sirkulasi peminjaman, serta memantau audit logs keamanan.</td>
      </tr>
      <tr>
        <td><strong>Guru Praktikum</strong></td>
        <td><code>guru</code></td>
        <td><code>PengawasPraktik#2026!</code></td>
        <td>Memiliki wewenang memverifikasi pengajuan peminjaman alat, memeriksa foto bukti fisik kondisi alat saat pengembalian, serta mencetak laporan riwayat peminjaman.</td>
      </tr>
      <tr>
        <td><strong>Siswa</strong></td>
        <td><code>siswa</code></td>
        <td><code>TeknikOtomotif#2026!</code></td>
        <td>Memiliki wewenang mengajukan peminjaman perkakas praktikum mandiri, mengunggah foto bukti fisik saat pengembalian, dan mengelola profil pribadi.</td>
      </tr>
    </tbody>
  </table>

  <h2 class="sub-title">1.4. Latar Belakang dan Tujuan Sistem</h2>
  <p>
    Kegiatan praktikum kejuruan pada bengkel Teknik Kendaraan Ringan (TKR) SMKN 5 Kuningan melibatkan sirkulasi ratusan perkakas tangan (*hand tools*), peralatan bertenaga (*power tools*), dan alat ukur presisi (*special service tools/SST*). Pengelolaan manual menggunakan buku ekspedisi fisik kerap memicu berbagai persoalan operasional: hilangnya alat tanpa penanggung jawab yang jelas, ketidaksesuaian pencatatan kondisi fisik saat dikembalikan, serta lambatnya proses verifikasi stok saat jam praktikum dimulai.
  </p>
  <p>
    Versi awal aplikasi (SIPAB v1.0) dikembangkan berbasis PHP Native monolitik prosedural. Berdasarkan audit awal, ditemukan kerentanan keamanan signifikan: password disimpan dalam teks polos (plaintext), tidak adanya token anti-CSRF, kelemahan kontrol akses pada API inventaris, serta ketiadaan sanitasi output yang memicu kerentanan Cross-Site Scripting (XSS).
  </p>
  <p>
    Oleh karena itu, proyek ini bertujuan merekayasa ulang (*full-stack refactoring*) dan mengeraskan keamanan sistem (*security hardening*) ke dalam arsitektur modern berbasis <strong>Node.js Express ESM</strong> yang terintegrasi dengan basis data terdistribusi <strong>TiDB Cloud</strong> dan deployment <strong>Vercel Serverless Function</strong>.
  </p>

  <h2 class="sub-title">1.5. Fitur Utama Sistem Informasi (SIPAB v2.0)</h2>
  <ol>
    <li><strong>Autentikasi Aman & Registrasi Publik Siswa:</strong> Verifikasi login satu arah berbasis Bcrypt tanpa teks terbuka, registrasi mandiri siswa dengan penetapan hak akses tegas (*enforced role siswa*), dan mitigasi serangan *timing attack* via *dummy bcrypt hash*.</li>
    <li><strong>Manajemen Inventaris Perkakas (Role Admin):</strong> Katalog alat bengkel dengan kategorisasi Hand Tools, Power Tools, dan SST; kontrol stok presisi; serta fitur pengarsipan aman (*soft-delete*) yang menjaga integritas riwayat transaksi.</li>
    <li><strong>Alur Sirkulasi Praktikum Bertingkat (Role Siswa & Guru):</strong> Siswa dapat memilih perkakas dan mengajukan peminjaman. Guru pembimbing bertindak sebagai verifikator yang menyetujui pengajuan, memeriksa foto bukti fisik kondisi alat saat pengembalian, dan mencatat catatan kondisi.</li>
    <li><strong>Rute Berkas Foto Privat (Anti-IDOR):</strong> Berkas foto bukti pengembalian hanya dapat diakses melalui rute proxy terproteksi autentikasi (<code>/peminjaman/bukti/:filename</code>), mencegah kebocoran visual ke publik atau siswa lain.</li>
    <li><strong>Rekapitulasi Laporan Terpadu:</strong> Penyajian filter sirkulasi berdasarkan rentang tanggal dan status transaksi, ekspor dokumen PDF server-side berorientasi lanskap lengkap dengan kop surat institusi, serta ekspor file CSV dengan proteksi *Formula Injection*.</li>
  </ol>

  <h2 class="sub-title">1.6. Daftar Tumpukan Teknologi (Technology Stack)</h2>
  <ul>
    <li><strong>Runtime Lingkungan:</strong> Node.js LTS (v22.x / v24.x) dengan arsitektur standar ECMAScript Modules (ESM).</li>
    <li><strong>Kerangka Kerja Web:</strong> Express.js 4.21.2 dengan EJS Template Engine (Contextual HTML Escaping).</li>
    <li><strong>Manajemen Basis Data:</strong> MySQL2 v3.24.6 terhubung ke TiDB Cloud Serverless (Distributed MySQL 8.0 kompatibel).</li>
    <li><strong>Mekanisme Keamanan:</strong> Bcryptjs (hashing salt rounds=10), Zod v4.6.7 (validasi skema input form), Helmet v8.0.0 (security headers), dan Express Session terpusat di MySQL.</li>
    <li><strong>Infrastruktur Cloud:</strong> Vercel Serverless Edge Functions (Region: Singapore / sin1).</li>
  </ul>

  <!-- ==================== BAB II ==================== -->
  <h1 class="bab-title">BAB II<br>ARSITEKTUR SISTEM DAN TOPOLOGI INFRASTRUKTUR</h1>

  <h2 class="sub-title">2.1. Deskripsi Arsitektur Sistem</h2>
  <p>
    Sistem Informasi Peminjaman Alat Bengkel (SIPAB v2.0) mengadopsi arsitektur <em>serverless web application</em> berbasis Node.js Express. Permintaan dari peramban klien pertama kali diarahkan melalui jaringan Vercel Edge Network yang memberlakukan proteksi HTTPS (TLS 1.3) dan penegakan header HSTS. Permintaan selanjutnya diteruskan ke Serverless Function pada <code>api/index.js</code> yang mengeksekusi lapisan middleware keamanan (Helmet, CSRF Protection, dan Database Rate Limiter) sebelum mencapai pengontrol aplikasi.
  </p>
  <p>
    Karakteristik lingkungan serverless yang bersifat *stateless* (tidak menyimpan status di memori lokal RAM) diatasi dengan memusatkan penyimpanan data sesi dan counter pembatasan request pada basis data terdistribusi <strong>TiDB Cloud</strong> (Region Singapore / ap-southeast-1). Seluruh komunikasi antara serverless function Express dan kluster TiDB Cloud dienkripsi menggunakan protokol Transport Layer Security (TLS/SSL) pada port 4000. Untuk berkas bukti pengembalian alat, sistem menggunakan adapter penyimpanan privat yang mengamankan foto dari akses langsung tanpa autentikasi.
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
        Edge["Vercel Edge Network (Reverse Proxy & TLS 1.3)"]
        AppFunction["Express Serverless Function (api/index.js)"]
        
        subgraph Middlewares ["Lapisan Keamanan Middleware Express"]
            MW_Helmet["Helmet (CSP, HSTS, No-Sniff)"]
            MW_CSRF["CSRF Token Validator (32-byte)"]
            MW_RateLimit["Database Rate Limiter (IP & User Lockout)"]
            MW_Auth["Auth & Role Guard (RBAC & Anti-IDOR)"]
        end
        
        subgraph Controllers ["Lapisan Pengontrol Aplikasi (MVC)"]
            Ctrl_Auth["AuthController"]
            Ctrl_Alat["AlatController"]
            Ctrl_Pinjam["PeminjamanController"]
            Ctrl_Laporan["LaporanController"]
        end
        
        ViewEngine["EJS Template Engine (Contextual HTML Escaping)"]
    end

    subgraph DataStorage ["Lapisan Basis Data & Penyimpanan Terpusat"]
        TiDB["TiDB Cloud Distributed MySQL (Region Singapore / Port 4000)"]
        TiDB_Tables[("Tabel: users, barang, peminjaman, detail_peminjaman,<br>sessions, rate_limits, audit_logs")]
        StorageAdapter["Storage Adapter (Private Evidence Photo Route)"]
    end

    User -->|HTTPS TLS 1.3 / Port 443| Edge
    Edge -->|Event Invocation| AppFunction
    AppFunction --> MW_Helmet --> MW_CSRF --> MW_RateLimit --> MW_Auth
    MW_Auth --> Controllers
    Controllers --> ViewEngine --> Edge --> User
    Controllers -->|Prepared Statements (pool.execute)| TiDB
    TiDB --- TiDB_Tables
    Controllers -->|Unggah & Akses Foto Terproteksi| StorageAdapter
  </pre>

  <h2 class="sub-title">2.3. Struktur Skema Basis Data Relasional (7 Tabel)</h2>
  <p>
    Basis data relasional dirancang menggunakan 7 tabel yang memenuhi kaidah normalisasi dan integritas referensial:
  </p>
  <table class="academic-table">
    <thead>
      <tr>
        <th style="width: 20%;">Nama Tabel</th>
        <th style="width: 45%;">Fungsi & Peranan Utama</th>
        <th>Proteksi Keamanan Khusus</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>users</code></td>
        <td>Menyimpan identitas akun siswa, guru praktikum, dan administrator.</td>
        <td>Password disimpan murni dalam hash Bcrypt (salt rounds 10). Kolom username memiliki constraint <code>UNIQUE</code>.</td>
      </tr>
      <tr>
        <td><code>barang</code></td>
        <td>Katalog master perkakas bengkel, kategori, kondisi, dan jumlah stok.</td>
        <td>Mekanisme soft-delete (<code>deleted_at</code>) menjaga riwayat peminjaman tetap utuh saat perkakas diarsipkan.</td>
      </tr>
      <tr>
        <td><code>peminjaman</code></td>
        <td>Data transaksi sirkulasi peminjaman, status persetujuan, dan bukti fisik.</td>
        <td>Foreign key terhubung ke <code>users</code> dan <code>barang</code>; indeks pada <code>id_user</code> dan <code>id_barang</code>.</td>
      </tr>
      <tr>
        <td><code>detail_peminjaman</code></td>
        <td>Rincian kuantitas alat per transaksi peminjaman.</td>
        <td>Menjamin integritas kuantitas alat saat peminjaman kelompok praktikum.</td>
      </tr>
      <tr>
        <td><code>sessions</code></td>
        <td>Session store terpusat untuk instans serverless yang stateless.</td>
        <td>Penyimpanan sesi di database, atribut cookie <code>HttpOnly</code>, <code>SameSite=Lax</code>, dan <code>Secure</code>.</td>
      </tr>
      <tr>
        <td><code>rate_limits</code></td>
        <td>Pencatat frekuensi percobaan request login gagal (anti brute-force).</td>
        <td>Pencatatan berbasis kunci IP dan username; mengunci akses otomatis setelah 20 kali kegagalan (HTTP 429).</td>
      </tr>
      <tr>
        <td><code>audit_logs</code></td>
        <td>Jejak rekam digital aktivitas forensik keamanan siber.</td>
        <td>Merekam waktu, aksi, username, IP, dan User-Agent (tanpa pernah mencatat password).</td>
      </tr>
    </tbody>
  </table>

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
        <td><code>src/controllers/peminjamanController.js</code> Baris: 406-419, 737<br><code>src/controllers/profilController.js</code> Baris: 17-25</td>
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
        <td>Verifikasi *magic bytes* biner gambar (JPG, PNG, WebP), pembatasan ukuran 4MB, penamaan acak, dan otorisasi sesi rute foto.</td>
        <td><code>src/utils/storageAdapter.js</code> Baris: 16-45, 59-74<br><code>src/routes/peminjamanRoutes.js</code> Baris: 41, 54</td>
        <td>Mencegah pengunggahan skrip web shell tersembunyi (*file extension spoofing*) dan mencegah akses foto tanpa login.</td>
      </tr>
      <tr>
        <td class="center">10</td>
        <td><strong>Security Headers</strong></td>
        <td>Konfigurasi paket Helmet yang memberlakukan CSP, HSTS, X-Content-Type-Options: nosniff, dan anti-clickjacking.</td>
        <td><code>src/app.js</code><br>Baris: 35, 38-76</td>
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

  <!-- ==================== BAB IV ==================== -->
  <h1 class="bab-title">BAB IV<br>PENGUJIAN MANDIRI EMPIRIS (SELF-TESTING SEBELUM VS SESUDAH)</h1>

  <h2 class="sub-title">4.1. Hasil Pengujian Keamanan Faktual (Sebelum vs Sesudah)</h2>
  <p>
    Tabel 4.1 menyajikan evaluasi komparasi faktual antara pengujian empiris pada sistem warisan PHP Native di lingkungan XAMPP dibandingkan dengan kondisi sesudah pengerasan keamanan pada sistem Node.js Express:
  </p>

  <table class="academic-table">
    <thead>
      <tr>
        <th style="width: 4%;">No</th>
        <th style="width: 17%;">Skenario Pengujian</th>
        <th style="width: 22%;">Metode Pengujian</th>
        <th style="width: 26%;">Kondisi Sebelum (PHP Native XAMPP)</th>
        <th style="width: 26%;">Kondisi Sesudah (Node.js Vercel)</th>
        <th style="width: 5%;">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">1</td>
        <td><strong>SQL Injection Parameter & Login</strong></td>
        <td>Mengakses <code>alat/edit.php?id=1'</code> dan POST login dengan <code>' OR '1'='1' --</code></td>
        <td>Query gagal tak tertangani (<code>mysqli_fetch_assoc(false)</code> Fatal Error) membocorkan struktur SQL.</td>
        <td>Query diproses via Prepared Statements; ditolak aman dengan pesan generik "Username atau password salah".</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">2</td>
        <td><strong>Stored Cross-Site Scripting (XSS)</strong></td>
        <td>Input nama bermuatan tag HTML <code>&lt;u&gt;Santoso&lt;/u&gt;</code> atau skrip biner.</td>
        <td>Tag dirender mentah oleh peramban tanpa fungsi <code>htmlspecialchars()</code> (kata tergarisbawahi).</td>
        <td>Contextual escaping bawaan EJS mengubah karakter menjadi entitas aman <code>&amp;lt;u&amp;gt;</code>; zero script alert.</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">3</td>
        <td><strong>Insecure Direct Object Reference (IDOR)</strong></td>
        <td>Mengirim POST manipulasi ID pada profil (<code>id=1</code>) dan membuka pengembalian siswa lain.</td>
        <td>Parameter <code>$_POST['id']</code> diterima tanpa mencocokkan dengan sesi login, profil Admin (ID 1) termodifikasi.</td>
        <td>Server строго mengambil ID dari <code>req.session.user_id</code>; akses transaksi siswa lain diblokir HTTP 403 Forbidden.</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">4</td>
        <td><strong>Kontrol Akses Berbasis Peran (RBAC)</strong></td>
        <td>Akun Siswa mengakses modul admin (<code>/users</code>) dan memanggil POST <code>/api/alat.php</code>.</td>
        <td>Endpoint <code>/api/alat.php</code> hanya mengecek login tanpa verifikasi role; siswa berhasil menambah/menghapus alat.</td>
        <td>Middleware <code>requireRole(['admin'])</code> memblokir akses siswa dan mengembalikan status HTTP 403 Forbidden.</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">5</td>
        <td><strong>Kebijakan Kata Sandi Lemah</strong></td>
        <td>Mendaftar akun baru dengan password pendek/umum: <code>123456</code> atau <code>password</code>.</td>
        <td>Password diterima tanpa validasi kompleksitas, disimpan langsung dalam teks polos di tabel database.</td>
        <td>Validasi Zod & Password Policy menolak kata sandi (&lt; 10 karakter, harus kombinasi huruf besar/kecil/angka).</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">6</td>
        <td><strong>Rate Limiting Brute-Force Lockout</strong></td>
        <td>Mengirimkan 21 kali percobaan login gagal berturut-turut pada akun yang sama.</td>
        <td>Tidak ada batas percobaan; serangan otomatisasi kamus (*credential stuffing*) berjalan tanpa batas.</td>
        <td>Percobaan ke-21 dikunci otomatis selama 15 menit oleh Database Rate Limiter dengan status HTTP 429 Too Many Requests.</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">7</td>
        <td><strong>Keamanan Cookie & Invalidasi Sesi</strong></td>
        <td>Inspeksi atribut cookie di DevTools Application dan akses <code>/dashboard</code> pasca logout.</td>
        <td>Cookie <code>PHPSESSID</code> diterbitkan tanpa flag <code>HttpOnly</code>, <code>Secure</code>, dan <code>SameSite</code>.</td>
        <td>Cookie <code>sipab_session</code> terkonfigurasi <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite=Lax</code>; logout menghapus sesi dari database.</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">8</td>
        <td><strong>Perlindungan Mutasi CSRF</strong></td>
        <td>Kirim request mutasi POST tanpa token CSRF dan request hapus via metode GET.</td>
        <td>Operasi hapus alat berjalan melalui metode GET di <code>alat/hapus.php?id=3</code> tanpa konfirmasi token CSRF.</td>
        <td>Metode GET mutasi ditolak (HTTP 405) dan request POST tanpa token CSRF 32-byte ditolak HTTP 403 Forbidden.</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">9</td>
        <td><strong>Inspeksi HTTPS & Security Headers</strong></td>
        <td>Audit protokol TLS dan evaluasi header keamanan respons peramban.</td>
        <td>Berjalan pada protokol HTTP polos tanpa enkripsi dan tanpa header keamanan HTTP modern.</td>
        <td>Enkripsi TLS 1.3 (Google Trust Services WR1), penegakan HSTS 1 tahun, CSP, dan X-Content-Type-Options: nosniff aktif.</td>
        <td class="center">Lolos</td>
      </tr>
      <tr>
        <td class="center">10</td>
        <td><strong>Audit Kredensial & Dependensi</strong></td>
        <td>Pemindaian riwayat komit Git dan audit paket pihak ketiga (<code>npm audit</code>).</td>
        <td>Kredensial database sempat tertulis langsung di skrip PHP dan pustaka tidak terkelola secara otomatis.</td>
        <td>Nol kunci rahasia pada repositori (secretlint bersih) dan seluruh 195 dependensi bebas kerentanan (0 vulnerabilities).</td>
        <td class="center">Lolos</td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== BAB V ==================== -->
  <h1 class="bab-title">BAB V<br>BUKTI TANGKAPAN LAYAR EMPIRIS SISTEM</h1>

  <h2 class="sub-title">5.1. Bukti Antarmuka Pengguna pada Domain Aktif HTTPS Vercel</h2>
  <p>
    Seluruh antarmuka utama telah beroperasi normal pada tautan produksi Vercel:
  </p>

  <div class="figure-wrapper">
    ${imgLogin ? `<img src="${imgLogin}" alt="Antarmuka Halaman Login">` : ''}
    <div class="figure-caption">Gambar 5.1: Antarmuka Halaman Login SIPAB v2.0 (Domain Aktif HTTPS Vercel)</div>
  </div>

  <div class="figure-wrapper">
    ${imgRegister ? `<img src="${imgRegister}" alt="Antarmuka Registrasi Siswa">` : ''}
    <div class="figure-caption">Gambar 5.2: Antarmuka Registrasi Akun Siswa Baru Mandiri (Enforced Role Siswa)</div>
  </div>

  <div class="page-break"></div>

  <div class="figure-wrapper">
    ${imgDashAdmin ? `<img src="${imgDashAdmin}" alt="Dashboard Administrator">` : ''}
    <div class="figure-caption">Gambar 5.3: Antarmuka Dashboard Administrator (Statistik Perkakas dan Sirkulasi Peminjaman)</div>
  </div>

  <div class="figure-wrapper">
    ${imgAlat ? `<img src="${imgAlat}" alt="Manajemen Inventaris Perkakas">` : ''}
    <div class="figure-caption">Gambar 5.4: Antarmuka Katalog Inventaris Alat Bengkel Administrator (Mekanisme Soft-Delete)</div>
  </div>

  <div class="page-break"></div>

  <div class="figure-wrapper">
    ${imgBuktiFoto ? `<img src="${imgBuktiFoto}" alt="Modal Bukti Foto Pengembalian">` : ''}
    <div class="figure-caption">Gambar 5.5: Modal Verifikasi Foto Bukti Pengembalian Alat oleh Guru (Rute Foto Terproteksi)</div>
  </div>

  <div class="figure-wrapper">
    ${imgLaporan ? `<img src="${imgLaporan}" alt="Halaman Laporan Terpadu Guru">` : ''}
    <div class="figure-caption">Gambar 5.6: Halaman Rekapitulasi Laporan Transaksi Peminjaman Guru (Ekspor PDF Landscape & Sanitasi CSV)</div>
  </div>

  <div class="page-break"></div>

  <h2 class="sub-title">5.2. Bukti Pengujian Mandiri Keamanan "Sebelum" (Sistem PHP Native di XAMPP)</h2>
  <p>
    Berikut adalah bukti empiris kerentanan keamanan yang terverifikasi secara nyata pada sistem warisan PHP Native sebelum proses migrasi dan hardening:
  </p>

  <div class="figure-wrapper">
    ${imgBefore01 ? `<img src="${imgBefore01}" alt="Password Plaintext Database">` : ''}
    <div class="figure-caption">Gambar 5.7: Kredensial Pengguna Disimpan dalam Teks Polos (Plaintext) pada Basis Data MySQL</div>
  </div>

  <div class="figure-wrapper">
    ${imgBefore02 ? `<img src="${imgBefore02}" alt="Bypass RBAC api/alat.php">` : ''}
    <div class="figure-caption">Gambar 5.8: Bypass Kontrol Akses (Broken Access Control) pada API Alat oleh Akun Siswa</div>
  </div>

  <div class="page-break"></div>

  <div class="figure-wrapper">
    ${imgBefore03 ? `<img src="${imgBefore03}" alt="Fatal Error SQL Injection">` : ''}
    <div class="figure-caption">Gambar 5.9: Fatal Error Query MySQL Akibat SQL Injection pada Parameter URL (alat/edit.php?id=1')</div>
  </div>

  <div class="figure-wrapper">
    ${imgBefore04 ? `<img src="${imgBefore04}" alt="Stored XSS Render Mentah">` : ''}
    <div class="figure-caption">Gambar 5.10: Tag HTML Dirender Mentah Tanpa Sanitasi htmlspecialchars (Stored XSS)</div>
  </div>

  <div class="page-break"></div>

  <div class="figure-wrapper">
    ${imgBefore05 ? `<img src="${imgBefore05}" alt="Eksploitasi IDOR Profil">` : ''}
    <div class="figure-caption">Gambar 5.11: Modifikasi Profil Pengguna Lain via Manipulasi Parameter ID Form POST (IDOR)</div>
  </div>

  <div class="page-break"></div>

  <h2 class="sub-title">5.3. Bukti Pengujian Mandiri Keamanan "Sesudah" (Sistem Node.js pada Vercel HTTPS)</h2>
  <p>
    Berikut adalah bukti tangkapan layar peramban dan keluaran alat (*tools output*) asli dari 10 skenario pengujian mandiri pasca pengerasan keamanan pada domain aktif:
  </p>

  <div class="figure-wrapper">
    ${imgAfter01 ? `<img src="${imgAfter01}" alt="Penolakan SQLi Node.js">` : ''}
    <div class="figure-caption">Gambar 5.12: Skenario 1 - Penolakan SQL Injection pada Form Login dengan Pesan Generik Aman</div>
  </div>

  <div class="figure-wrapper">
    ${imgAfter02 ? `<img src="${imgAfter02}" alt="Sanitasi XSS Node.js">` : ''}
    <div class="figure-caption">Gambar 5.13: Skenario 2 - Sanitasi Output Entitas HTML pada Dashboard Siswa (Zero Alert Execution)</div>
  </div>

  <div class="page-break"></div>

  <div class="figure-wrapper">
    ${imgAfter03 ? `<img src="${imgAfter03}" alt="Penolakan IDOR 403">` : ''}
    <div class="figure-caption">Gambar 5.14: Skenario 3 - Pemblokiran Akses IDOR Transaksi Siswa Lain (HTTP 403 Forbidden)</div>
  </div>

  <div class="figure-wrapper">
    ${imgAfter04 ? `<img src="${imgAfter04}" alt="Penolakan RBAC 403">` : ''}
    <div class="figure-caption">Gambar 5.15: Skenario 4 - Pemblokiran Akses Rute Administratif /users oleh Akun Siswa (HTTP 403 Forbidden)</div>
  </div>

  <div class="page-break"></div>

  <div class="figure-wrapper">
    ${imgAfter05 ? `<img src="${imgAfter05}" alt="Penolakan Password Lemah">` : ''}
    <div class="figure-caption">Gambar 5.16: Skenario 5 - Penolakan Pendaftaran dengan Kata Sandi Lemah oleh Kebijakan Sandi</div>
  </div>

  <div class="figure-wrapper">
    ${imgAfter06 ? `<img src="${imgAfter06}" alt="Rate Limiting 429">` : ''}
    <div class="figure-caption">Gambar 5.17: Skenario 6 - Penguncian Sesi dan Akun Akibat Percobaan Brute-Force (HTTP 429 Lockout)</div>
  </div>

  <div class="page-break"></div>

  <div class="figure-wrapper">
    ${imgAfter07 ? `<img src="${imgAfter07}" alt="DevTools Cookie Panel">` : ''}
    <div class="figure-caption">Gambar 5.18: Skenario 7 - Inspeksi Atribut Cookie Sesi (HttpOnly, Secure, SameSite=Lax) di DevTools Application</div>
  </div>

  <div class="figure-wrapper">
    ${imgAfter08 ? `<img src="${imgAfter08}" alt="curl Terminal CSRF 403">` : ''}
    <div class="figure-caption">Gambar 5.19: Skenario 8 - Bukti Keluaran Terminal Asli curl Penolakan Mutasi POST Tanpa Token CSRF (HTTP 403)</div>
  </div>

  <div class="page-break"></div>

  <div class="figure-wrapper">
    ${imgAfter09 ? `<img src="${imgAfter09}" alt="Detail Sertifikat TLS 1.3">` : ''}
    <div class="figure-caption">Gambar 5.20: Skenario 9 - Detail Sertifikat SSL/TLS 1.3 Peramban (Issued by Google Trust Services WR1)</div>
  </div>

  <div class="figure-wrapper">
    ${imgAfter10 ? `<img src="${imgAfter10}" alt="Terminal npm audit & Secret Scan">` : ''}
    <div class="figure-caption">Gambar 5.21: Skenario 10 - Bukti Keluaran Terminal Asli npm audit (0 Vulnerabilities) dan Secret Scan Bersih</div>
  </div>

  <div class="page-break"></div>

  <h2 class="sub-title">5.4. Bukti Konfigurasi Cloud Hosting Vercel dan Basis Data TiDB Cloud</h2>
  <div class="figure-wrapper">
    ${imgAfter11 ? `<img src="${imgAfter11}" alt="Dashboard Vercel dan TiDB Cloud">` : ''}
    <div class="figure-caption">Gambar 5.22: Bukti Konfigurasi Cloud Hosting Serverless Vercel dan Kluster Basis Data TiDB Cloud (Region Singapore)</div>
  </div>

  <!-- ==================== BAB VI ==================== -->
  <h1 class="bab-title">BAB VI<br>TRANSPARANSI PENGGUNAAN PERANGKAT BANTU AI</h1>

  <h2 class="sub-title">6.1. Pembagian Peran Pengembang dan Perangkat Bantu AI</h2>
  <p>
    Sesuai ketentuan integritas akademik pada poin 3e pedoman penilaian, ditegaskan bahwa pengembangan proyek ini memanfaatkan dua perangkat bantu kecerdasan buatan, yaitu <strong>Claude (Anthropic)</strong> dan <strong>Antigravity AI Coding Assistant (Google DeepMind)</strong>. Pembagian peran dan tanggung jawab rekayasa sistem dilakukan secara terbuka dan akuntabel:
  </p>
  <ul>
    <li>
      <strong>Peran Utama Perangkat Bantu AI (Antigravity & Claude):</strong>
      <ol>
        <li><strong>Claude (Anthropic):</strong> Digunakan pada tahap awal perencanaan untuk memetakan arsitektur refactoring, merumuskan prompt instruksi teknis modular per modul, serta menelaah konsistensi pemenuhan rubrik penugasan.</li>
        <li><strong>Antigravity AI Coding Assistant (Google DeepMind):</strong> Bertindak sebagai *autonomous coding agent* yang menulis ulang basis kode procedural PHP ke arsitektur modular Node.js Express ESM, mengimplementasikan middleware keamanan (Bcrypt, Zod, CSRF, Database Rate Limiter, Helmet CSP, Anti-IDOR), menyusun skrip otomasi pengujian empiris (Puppeteer runner & concurrency tester), serta mengompilasi berkas laporan resmi.</li>
      </ol>
    </li>
    <li>
      <strong>Peran dan Verifikasi Faktual Mahasiswa (Yeyen Ai Nurhidayati):</strong>
      <ol>
        <li>Menentukan aturan bisnis sirkulasi bengkel TKR SMKN 5 Kuningan: pembagian peran bertingkat, validasi stok perkakas, verifikasi fisik berkondisi foto, dan mekanisme soft-delete.</li>
        <li>Menyusun prompt instruksi secara bertahap dan terarah untuk setiap modul rekayasa perangkat lunak.</li>
        <li>Melakukan *code review* dan pemeriksaan baris kode mandiri pada file krusial: memeriksa algoritma Bcrypt dan dummy hash di <code>src/controllers/authController.js</code>, logika Anti-IDOR di <code>src/controllers/peminjamanController.js</code>, token CSRF di <code>src/middlewares/csrfMiddleware.js</code>, serta atribut cookie di <code>src/config/session.js</code>.</li>
        <li>Menjalankan pengujian fungsional dan keamanan langsung di browser Google Chrome dan terminal lokal XAMPP (termasuk verifikasi respon kueri SQL, penolakan input petik, inspeksi tab Application Cookies, dan eksekusi curl).</li>
        <li>Menemukan dan memperbaiki temuan kritis: celah *user enumeration* pada pesan login gagal, kerentanan CSP akibat <code>'unsafe-inline'</code>, perlunya proteksi autentikasi wajib pada endpoint bukti foto <code>/peminjaman/bukti/:filename</code>, serta pembaruan dependensi <code>mysql2</code> dan <code>zod</code> hingga mencapai status bebas kerentanan (0 vulnerabilities).</li>
      </ol>
    </li>
  </ul>

  <h2 class="sub-title">6.2. Contoh Prompt Utama yang Benar-Benar Digunakan</h2>
  <p>
    Berikut adalah dokumentasi tiga perintah (*prompts*) teknis utama yang benar-benar dikirimkan mahasiswa kepada asisten AI selama proses pengembangan:
  </p>
  <div style="margin-left: 10mm; margin-bottom: 12px;">
    <p class="no-indent"><strong>1. Prompt Refactor & Migrasi Arsitektur Serverless:</strong></p>
    <p class="no-indent"><em>"Lakukan refactoring menyeluruh aplikasi web peminjaman alat bengkel PHP native ini ke Node.js Express ESM dengan arsitektur serverless yang siap dideploy ke Vercel dan TiDB Cloud. Pertahankan alur bisnis peminjaman dan tampilan antarmuka Mazer, tetapi hilangkan seluruh kode prosedural PHP dan amankan koneksi basis data."</em></p>
    
    <p class="no-indent"><strong>2. Prompt Hardening Keamanan & Anti-IDOR:</strong></p>
    <p class="no-indent"><em>"Terapkan security hardening berlapis sesuai standar OWASP: ganti seluruh password dengan hash Bcrypt salt 10, buat validasi input dengan Zod, buat proteksi CSRF 32-byte untuk seluruh mutasi data, terapkan database rate limiting di tabel MySQL untuk mencegah brute-force login, dan pastikan route pengembalian alat serta profil terlindungi dari IDOR dengan mengecek session user_id."</em></p>
    
    <p class="no-indent"><strong>3. Prompt Otomasi Pengujian Empiris & Bukti Sebelum-Sesudah:</strong></p>
    <p class="no-indent"><em>"Buatkan test suite otomatis menggunakan Node.js dan Puppeteer untuk memverifikasi seluruh skenario pengujian mandiri: buktikan kerentanan legacy pada PHP di XAMPP (SQL injection fatal error, bypass access control api/alat.php, XSS unescaped render), dan buktikan keampuhan mitigasi pada Node.js (Prepared statements, HTML escaping, 403 CSRF/IDOR, 429 lockout, cookie flags). Ambil tangkapan layar asli dari hasil eksekusi tools tersebut."</em></p>
  </div>

  <!-- ==================== BAB VII ==================== -->
  <h1 class="bab-title">BAB VII<br>KENDALA YANG DIHADAPI DAN SOLUSI TEKNIS</h1>

  <p>
    Selama pelaksanaan modernisasi dan pengerasan sistem, ditemukan sejumlah kendala teknis nyata yang berhasil diselesaikan melalui pendekatan rekayasa perangkat lunak:
  </p>

  <table class="academic-table">
    <thead>
      <tr>
        <th style="width: 25%;">Kendala yang Dihadapi</th>
        <th style="width: 35%;">Analisis Akar Masalah</th>
        <th style="width: 40%;">Solusi Teknis yang Diterapkan</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Karakteristik Stateless Serverless Vercel</strong></td>
        <td>Instans serverless berjalan secara independen dan tidak dapat menyimpan sesi pengguna atau counter rate limiter di memori lokal RAM.</td>
        <td>Menggunakan <code>express-mysql-session</code> untuk sesi terpusat di tabel <code>sessions</code>, serta membangun <code>dbRateLimiter.js</code> yang mencatat percobaan gagal di tabel <code>rate_limits</code> TiDB Cloud.</td>
      </tr>
      <tr>
        <td><strong>Konflik Kredensial Multi-Akun Git di Windows</strong></td>
        <td>Windows Git Credential Manager (GCM) secara otomatis memakai akun kerja korporat laptop yang tidak memiliki izin tulis ke repositori pribadi.</td>
        <td>Mengisolasi konfigurasi Git repositori dengan menyematkan Personal Access Token (PAT) pribadi pada URL remote dan meregenerasi riwayat komit modular atas nama mahasiswa.</td>
      </tr>
      <tr>
        <td><strong>Potensi Race Condition pada Stok Alat</strong></td>
        <td>Banyak siswa dapat mengajukan peminjaman alat langka (stok tersisa 1) secara bersamaan, berisiko menyebabkan stok bernilai negatif.</td>
        <td>Menerapkan transaksi basis data relasional dengan klausa validasi stok ketat (<code>stok &gt; 0</code>), sehingga hanya transaksi pertama yang berhasil dan transaksi lainnya ditolak secara aman.</td>
      </tr>
      <tr>
        <td><strong>Perbedaan Formatting CSV di Microsoft Excel</strong></td>
        <td>File CSV berbahasa Indonesia sering mengalami malformasi karakter di Excel jika tidak memiliki penanda BOM (Byte Order Mark).</td>
        <td>Menyematkan byte BOM UTF-8 (<code>0xEF, 0xBB, 0xBF</code>) di awal file output CSV dan mensterilkan rumus berbahaya formula injection.</td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== BAB VIII ==================== -->
  <h1 class="bab-title">BAB VIII<br>POTENSI PENGEMBANGAN SKRIPSI / TUGAS AKHIR</h1>

  <p>
    Hasil pengembangan aplikasi SIPAB v2.0 memiliki fondasi teknis yang kokoh untuk dilanjutkan menjadi penelitian Skripsi / Tugas Akhir di bidang Keamanan Siber dan Rekayasa Perangkat Lunak. Tiga rumusan masalah penelitian yang potensial diajukan adalah:
  </p>

  <ol>
    <li>
      <strong>Integritas dan Keabsahan Foto Bukti Pengembalian Alat:</strong><br>
      <em>"Bagaimana menjamin integritas dan non-repudiasi foto bukti fisik kondisi alat pengembalian pada sistem peminjaman alat bengkel menggunakan mekanisme cryptographic timestamping atau immutable ledger (blockchain)?"</em><br>
      Penelitian ini fokus pada mitigasi manipulasi foto kondisi alat rusak oleh siswa dengan menyematkan metadata terenkripsi dan tanda tangan digital saat foto diunggah dari kamera perangkat.
    </li>
    <li>
      <strong>Integrasi Smart Tool-Locker Berbasis IoT dan Kontrol Akses Fisik:</strong><br>
      <em>"Bagaimana merancang arsitektur Internet of Things (IoT) pada lemari perkakas bengkel praktikum berbasis RFID dan mikrokontroler yang terintegrasi secara real-time dengan sistem otorisasi cloud?"</em><br>
      Penelitian ini memperluas sistem web SIPAB agar dapat membuka solenoid lock pintu lemari perkakas secara fisik hanya setelah transaksi peminjaman disetujui guru pembimbing.
    </li>
    <li>
      <strong>Deteksi Anomali Sirkulasi dan Kerusakan Alat Berbasis Pembelajaran Mesin:</strong><br>
      <em>"Bagaimana mendeteksi anomali keterlambatan pengembalian dan pola kerusakan perkakas praktikum secara prediktif menggunakan algoritma Machine Learning berbasis rekaman audit logs dan histori sirkulasi bengkel?"</em><br>
      Penelitian ini memanfaatkan data audit digital SIPAB untuk membantu teknisi bengkel memprediksi masa perawatan preventif (*preventive maintenance*) pada perkakas bengkel bertenaga tinggi.
    </li>
  </ol>

  <!-- ==================== BAB IX ==================== -->
  <h1 class="bab-title">BAB IX<br>KESIMPULAN DAN BATASAN PENGUJIAN</h1>

  <h2 class="sub-title">9.1. Kesimpulan</h2>
  <p>
    Berdasarkan perancangan, implementasi, dan pengujian empiris yang telah dilakukan, dapat disimpulkan bahwa pada <strong>10 skenario pengujian mandiri empiris yang telah diuji</strong> (meliputi SQL Injection, Stored XSS, IDOR, RBAC, Password Policy, Rate Limiting, Cookie Flags & Sesi, CSRF Protection, HTTPS TLS 1.3 & Security Headers, serta Audit Secret & Dependency), sistem informasi peminjaman alat bengkel (SIPAB v2.0) terbukti berhasil memitigasi seluruh vektor serangan tersebut secara efektif.
  </p>
  <p>
    Transformasi dari arsitektur procedural PHP Native monolitik ke Node.js Express serverless membuktikan bahwa kerentanan warisan (*legacy vulnerabilities*) dapat dieliminasi melalui penerapan kontrol keamanan berlapis (*Defense-in-Depth*).
  </p>

  <h2 class="sub-title">9.2. Batasan Sistem dan Aspek yang Belum Diuji</h2>
  <p>
    Untuk menjaga integritas dan objektivitas akademik, dicatat beberapa batasan sistem yang belum tercakup dalam pengujian saat ini:
  </p>
  <ul>
    <li><strong>Ketahanan Serangan DDoS Skala Besar:</strong> Rate limiting saat ini beroperasi pada lapisan aplikasi (MySQL <code>rate_limits</code>). Mitigasi terhadap serangan banjir trafik volumetrik (L3/L4/L7 DDoS) belum diuji di bawah beban stres masif dan diserahkan pada perlindungan infrastruktur Vercel Edge / Cloudflare.</li>
    <li><strong>Multi-Factor Authentication (MFA / 2FA):</strong> Sistem saat ini mengandalkan autentikasi faktor tunggal berbasis kata sandi kuat Bcrypt yang diperkuat kebijakan lockout 15 menit. Autentikasi berbasis TOTP (Time-based One-Time Password) belum diimplementasikan.</li>
    <li><strong>Scanning Antivirus Kernel-Level pada Berkas Unggahan:</strong> Validasi unggahan mengandalkan inspeksi biner *Magic Bytes* (JPG, PNG, WebP), pembatasan ukuran 4MB, dan pengacakan nama berkas. Pemindaian otomatis menggunakan antivirus daemon (seperti ClamAV) belum diintegrasikan ke lingkungan serverless.</li>
    <li><strong>Penerapan Strict Nonce pada CSP:</strong> Konfigurasi Content Security Policy (CSP) masih mempertahankan direktif <code>'unsafe-inline'</code> pada <code>scriptSrc</code> dan <code>styleSrc</code> demi menjaga kompatibilitas komponen UI bawaan template Mazer, Bootstrap, SweetAlert, dan DataTables.</li>
  </ul>

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
  let targetPdf = OUTPUT_PDF;
  try {
    if (fs.existsSync(OUTPUT_PDF)) {
      const fd = fs.openSync(OUTPUT_PDF, 'r+');
      fs.closeSync(fd);
    }
  } catch (err) {
    if (err.code === 'EBUSY') {
      console.warn('⚠️ File PDF utama sedang dibuka di viewer/browser lain. Menyimpan ke target revisi...');
      targetPdf = path.resolve('TugasProject_CyberSec_YeyenAiNurhidayati_20240810020_Revisi.pdf');
    }
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: targetPdf,
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

  const stats = fs.statSync(targetPdf);
  console.log(`\n✓ BERHASIL MEMBUAT FILE PDF RESMI KOMPREHENSIF:`);
  console.log(`  Lokasi: ${targetPdf}`);
  console.log(`  Ukuran: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
  if (targetPdf !== OUTPUT_PDF) {
    console.log(`  ℹ️ Catatan: Silakan tutup file PDF di Acrobat/browser, lalu file akan diselaraskan otomatis ke nama utama.`);
  }
}

generateAcademicPdfReport().catch(err => {
  console.error('Error generating academic PDF report:', err);
  process.exit(1);
});
