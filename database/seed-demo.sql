-- ============================================================
-- DEMO SEED DATA: SISTEM INFORMASI PEMINJAMAN ALAT BENGKEL (SIPAB)
-- Compatible with MySQL 8.x, MariaDB, and TiDB Cloud Starter
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table Seed
-- Strong passwords hashed with bcrypt (salt rounds = 10)
-- admin: SuperBengkel#2026!
-- guru:  PengawasPraktik#2026!
-- siswa: TeknikOtomotif#2026!
DELETE FROM `users`;
INSERT INTO `users` (`id`, `nama`, `username`, `password`, `role`, `foto_profil`, `nip`, `nisn`, `kelas`) VALUES
(1, 'Hendrik Administrator', 'admin', '$2a$10$OQTMbebSmEtQ75.BlWcn7u4fHKC.ycqNjAeeUQl1CmEWBZSRAySDq', 'admin', '1768733609_1252.png', '198505112008011001', NULL, NULL),
(2, 'Pak Guru Mesin', 'guru', '$2a$10$.VGkPJWVJx5uL0aEJqnszOFbkYW997x6ksgDLen/FifOOKdLF.gEq', 'guru', '1768735977_1482.jpeg', '197203151998021002', NULL, NULL),
(3, 'Siswa Teladan', 'siswa', '$2a$10$BUw9PBx9isQym06gFkzSj.Dis78xhhPDIwcgOi8UqRuTX9cVpY6Xy', 'siswa', '1768738457_3523.jpeg', NULL, '202401001', '12A'),
(4, 'Budi Santoso', 'siswa2', '$2a$10$BUw9PBx9isQym06gFkzSj.Dis78xhhPDIwcgOi8UqRuTX9cVpY6Xy', 'siswa', NULL, NULL, '202401002', '12A'),
(5, 'Ani Wijaya', 'siswa3', '$2a$10$BUw9PBx9isQym06gFkzSj.Dis78xhhPDIwcgOi8UqRuTX9cVpY6Xy', 'siswa', NULL, NULL, '202401003', '12B'),
(6, 'Ibu Koordinator Praktikum', 'guru2', '$2a$10$.VGkPJWVJx5uL0aEJqnszOFbkYW997x6ksgDLen/FifOOKdLF.gEq', 'guru', NULL, '197805201999032001', NULL, NULL);

-- 2. Barang Table Seed
DELETE FROM `barang`;
INSERT INTO `barang` (`id`, `nama_barang`, `kategori`, `stok`, `kondisi`, `foto`) VALUES
(1, 'Kunci Inggris 10 inch', 'Hand Tools', 10, 'Baik', 'kunci_pas.jpg'),
(2, 'Kunci Shock Set 24 pcs', 'SST', 6, 'Baik', 'kunci_shock.jpg'),
(3, 'Obeng Plus 6 inch', 'Hand Tools', 15, 'Baik', 'obeng.jpg'),
(4, 'Obeng Minus 5 inch', 'Hand Tools', 12, 'Baik', 'obeng.jpg'),
(5, 'Dongkrak Buaya 2 Ton', 'Power Tools', 4, 'Baik', 'bearing_puller.jpg'),
(6, 'Dongkrak Botol 3 Ton', 'Power Tools', 3, 'Perlu Perbaikan', 'coil_spring_compressor.jpg'),
(7, 'Palu Besi 500 gram', 'Hand Tools', 7, 'Baik', 'palu.jpg'),
(8, 'Palu Konde 750 gram', 'Hand Tools', 6, 'Baik', 'palu.jpg'),
(9, 'Tang Kombinasi 8 inch', 'Hand Tools', 9, 'Baik', 'tang.jpg'),
(10, 'Tang Potong 10 inch', 'Hand Tools', 8, 'Rusak', 'tang.jpg'),
(11, 'Gergaji Besi Manual', 'Hand Tools', 5, 'Baik', 'kikir.jpg'),
(12, 'Bor Listrik Tangan 450W', 'Power Tools', 2, 'Baik', 'bor_listrik.jpg'),
(13, 'Meteran Baja 5 meter', 'SST', 10, 'Baik', 'disc_brake_piston_compressor.jpg'),
(14, 'Gerinda Tangan Listrik 4 inch', 'Power Tools', 3, 'Baik', 'gerinda_listrik.jpg'),
(15, 'Kacamata Pelindung Safety', 'Hand Tools', 25, 'Baik', 'clutch_aligning_tool.jpg');

-- 3. Peminjaman Table Seed (Menyediakan semua 5 status)
DELETE FROM `peminjaman`;
INSERT INTO `peminjaman` (`id`, `id_user`, `nama_peminjam`, `id_barang`, `tgl_pinjam`, `tgl_kembali`, `status`, `bukti_kembali`, `catatan_pengembalian`, `catatan_penolakan`) VALUES
(1, 3, 'Siswa Teladan', 1, '2026-05-01', '2026-05-03', 'kembali', '1778142132_6721.jpg', 'Kunci inggris dikembalikan lengkap, tidak selek dan sudah dilap bersih.', NULL),
(2, 4, 'Budi Santoso', 5, '2026-05-04', NULL, 'disetujui', NULL, NULL, NULL),
(3, 5, 'Ani Wijaya', 12, '2026-05-05', NULL, 'pending', NULL, NULL, NULL),
(4, 3, 'Siswa Teladan', 3, '2026-05-06', NULL, 'menunggu_pengembalian', '1778142132_6721.jpg', 'Obeng plus dikembalikan dalam kondisi mulus, mata obeng tidak gompal.', NULL),
(5, 4, 'Budi Santoso', 10, '2026-05-02', NULL, 'ditolak', NULL, NULL, 'Alat sedang dalam masa perbaikan teknisi bengkel, silakan gunakan tang kombinasi.'),
(6, 5, 'Ani Wijaya', 2, '2026-05-03', NULL, 'menunggu_pengembalian', '1778142132_6721.jpg', 'Kunci shock set lengkap 24 mata kunci, box rapi.', NULL),
(7, 3, 'Siswa Teladan', 7, '2026-04-28', '2026-04-30', 'kembali', '1778142132_6721.jpg', 'Palu besi gagang kayu kuat dan bersih.', NULL);

SET FOREIGN_KEY_CHECKS = 1;
