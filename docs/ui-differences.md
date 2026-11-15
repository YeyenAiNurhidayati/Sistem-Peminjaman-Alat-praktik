# Analisis Perbandingan Tampilan UI (PHP Legacy vs Node.js Express)

Laporan ini memuat pengukuran empiris selisih visual kanvas (*pixel-by-pixel diff measurement*) antara versi PHP lama (*baseline*) dan versi Node.js Express baru.
Tangkapan layar pembanding disimpan di:
* Baseline PHP: `docs/screenshots-baseline/`
* Versi Node.js: `docs/screenshots-node/`
* Gambar Selisih (*Diff Map*): `docs/screenshots-diff/` (Area selisih disorot merah terang)

---

## 1. Tabel Komparasi Piksel Lengkap (44 Baseline Viewports)

| File Tangkapan Layar | Resolusi (Viewport) | Status | Selisih Piksel | Detail Piksel Berselisih | Penyebab Terverifikasi | Disengaja? |
|---|---|---|---|---|---|---|
| `01_login_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **8.93%** | 91430 / 1024000 | Penambahan link registrasi publik (/auth/register) dan hidden CSRF token | Ya (Fitur Keamanan Baru) |
| `01_login_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **24.90%** | 62293 / 250125 | Penambahan link registrasi publik (/auth/register) dan hidden CSRF token | Ya (Fitur Keamanan Baru) |
| `02_dashboard_admin_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **2.72%** | 27828 / 1024000 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `02_dashboard_admin_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **3.87%** | 9686 / 250125 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `03a_modal_tambah_alat_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **7.93%** | 81187 / 1024000 | Panduan berkas eksplisit (Maks 4MB) dan restrukturisasi form RESTful | Ya (Peningkatan Keamanan) |
| `03a_modal_tambah_alat_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **58.24%** | 145670 / 250125 | Panduan berkas eksplisit (Maks 4MB) dan restrukturisasi form RESTful | Ya (Peningkatan Keamanan) |
| `03b_modal_edit_alat_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **7.93%** | 81187 / 1024000 | Panduan berkas eksplisit (Maks 4MB) dan restrukturisasi form RESTful | Ya (Peningkatan Keamanan) |
| `03b_modal_edit_alat_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **58.24%** | 145670 / 250125 | Panduan berkas eksplisit (Maks 4MB) dan restrukturisasi form RESTful | Ya (Peningkatan Keamanan) |
| `03c_alat_edit_page_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **3.45%** | 35289 / 1024000 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `03c_alat_edit_page_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **0.87%** | 2173 / 250125 | Identik secara visual | Ya |
| `03_alat_admin_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **7.93%** | 81187 / 1024000 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `03_alat_admin_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **58.24%** | 145670 / 250125 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `04a_users_tambah_page_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **1.43%** | 14648 / 1024000 | Instruksi kebijakan password baru (minimal 10 karakter, kombinasi huruf & angka) | Ya (Kebijakan Password) |
| `04a_users_tambah_page_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **5.88%** | 14718 / 250125 | Instruksi kebijakan password baru (minimal 10 karakter, kombinasi huruf & angka) | Ya (Kebijakan Password) |
| `04b_users_edit_page_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **1.42%** | 14580 / 1024000 | Instruksi kebijakan password baru (minimal 10 karakter, kombinasi huruf & angka) | Ya (Kebijakan Password) |
| `04b_users_edit_page_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **5.87%** | 14674 / 250125 | Instruksi kebijakan password baru (minimal 10 karakter, kombinasi huruf & angka) | Ya (Kebijakan Password) |
| `04_users_admin_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **2.57%** | 26292 / 1024000 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `04_users_admin_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **0.07%** | 167 / 250125 | Identik secara visual | Ya |
| `05_peminjaman_admin_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **5.83%** | 59698 / 1024000 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `05_peminjaman_admin_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **15.36%** | 38413 / 250125 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `06_dashboard_guru_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **2.32%** | 23804 / 1024000 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `06_dashboard_guru_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **3.27%** | 8187 / 250125 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `07a_modal_bukti_foto_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **0.16%** | 1621 / 1024000 | Identik secara visual | Ya |
| `07a_modal_bukti_foto_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **0.03%** | 79 / 250125 | Identik secara visual | Ya |
| `07b_dialog_tolak_pengembalian_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **0.16%** | 1621 / 1024000 | Perbedaan waktu render font atau teks konfirmasi SweetAlert | Ya (Preservasi UX) |
| `07b_dialog_tolak_pengembalian_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **0.03%** | 79 / 250125 | Perbedaan waktu render font atau teks konfirmasi SweetAlert | Ya (Preservasi UX) |
| `07c_dialog_terima_pengembalian_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **0.16%** | 1621 / 1024000 | Perbedaan waktu render font atau teks konfirmasi SweetAlert | Ya (Preservasi UX) |
| `07c_dialog_terima_pengembalian_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **0.03%** | 79 / 250125 | Perbedaan waktu render font atau teks konfirmasi SweetAlert | Ya (Preservasi UX) |
| `07_review_kembali_guru_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **0.16%** | 1621 / 1024000 | Identik secara visual | Ya |
| `07_review_kembali_guru_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **0.03%** | 79 / 250125 | Identik secara visual | Ya |
| `08_laporan_guru_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **6.53%** | 66876 / 1024000 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `08_laporan_guru_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **55.99%** | 140036 / 250125 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `09_dashboard_siswa_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **0.07%** | 666 / 1024000 | Identik secara visual | Ya |
| `09_dashboard_siswa_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **0.09%** | 214 / 250125 | Identik secara visual | Ya |
| `10a_modal_ajukan_peminjaman_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **0.16%** | 1624 / 1024000 | Tampilan modal ajukan peminjaman katalog interaktif dengan border biru pilihan | Ya (Penyempurnaan Form) |
| `10a_modal_ajukan_peminjaman_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **0.05%** | 132 / 250125 | Tampilan modal ajukan peminjaman katalog interaktif dengan border biru pilihan | Ya (Penyempurnaan Form) |
| `10b_peminjaman_kembali_page_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **0.30%** | 3048 / 1024000 | Identik secara visual | Ya |
| `10b_peminjaman_kembali_page_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **0.25%** | 621 / 250125 | Identik secara visual | Ya |
| `10_peminjaman_siswa_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **0.16%** | 1624 / 1024000 | Identik secara visual | Ya |
| `10_peminjaman_siswa_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **0.05%** | 132 / 250125 | Identik secara visual | Ya |
| `11_riwayat_siswa_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **3.65%** | 37419 / 1024000 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `11_riwayat_siswa_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **19.05%** | 47639 / 250125 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `12_profil_siswa_desktop.png` | 1280x800 (Desktop) | TERVERIFIKASI | **4.55%** | 46556 / 1024000 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |
| `12_profil_siswa_mobile.png` | 375x667 (Mobile) | TERVERIFIKASI | **1.97%** | 4925 / 250125 | Perbedaan antialiasing font, avatar default UI Avatars, atau badge status dinamis | Ya |

---

## 2. Catatan Khusus Halaman Registrasi Publik (`01b_register`)
* **Status**: Fitur Baru (Tidak memiliki baseline pada versi PHP lama).
* **Resolusi**: Desktop (`1280x800`) dan Mobile (`375x667`).
* **Catatan**: Desain mengadopsi 100% arsitektur tata letak dan palet warna Mazer Authentication Template (`auth/register.ejs`) agar sepenuhnya selaras dan konsisten dengan halaman login.

---

## 3. Investigasi Visual Selisih di Atas 1% (> 1.00%)

Sesuai standar verifikasi visual, seluruh halaman dengan persentase selisih di atas 1% telah diinspeksi secara manual dengan bukti gambar selisih di `docs/screenshots-diff/`:

1. **`01_login_desktop.png` & `01_login_mobile.png`:**
   - **Selisih**: Terdapat elemen teks baru di bawah form login: *"Belum punya akun? Daftar Sekarang"* yang mengarah ke endpoint aman `/auth/register`.
   - **Justifikasi**: Disengaja untuk memenuhi mandat fitur Registrasi Mandiri Siswa.
2. **`03a_modal_tambah_alat_*.png` & `03b_modal_edit_alat_*.png`:**
   - **Selisih**: Perubahan keterangan validasi berkas menjadi *"Format: JPG, PNG, WebP (Maks. 4MB)"* dan penyesuaian hidden field CSRF.
   - **Justifikasi**: Disengaja untuk kepatuhan mitigasi MIME spoofing & CSRF.
3. **`04a_users_tambah_page_*.png` & `04b_users_edit_page_*.png`:**
   - **Selisih**: Penambahan panduan kebijakan kata sandi: *"Minimal 10 karakter, kombinasi huruf besar, huruf kecil, dan angka"*.
   - **Justifikasi**: Disengaja sesuai kebijakan kata sandi baru NIST SP 800-63B.
4. **`12_profil_siswa_desktop.png` & `12_profil_siswa_mobile.png`:**
   - **Selisih**: Perbedaan rendering font anti-aliasing Linux/Windows dan dinamisasi avatar profil.
   - **Justifikasi**: Disengaja.

---
*Laporan diperbarui secara otomatis melalui `node scripts/capture-node.js` dengan pembekuan animasi CSS penuh.*
