-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 07, 2026 at 05:32 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `peminjaman_alat`
--

-- --------------------------------------------------------

--
-- Table structure for table `barang`
--

CREATE TABLE `barang` (
  `id` int(11) NOT NULL,
  `nama_barang` varchar(100) NOT NULL,
  `kategori` varchar(50) NOT NULL,
  `stok` int(11) NOT NULL,
  `kondisi` varchar(50) NOT NULL,
  `foto` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `barang`
--

INSERT INTO `barang` (`id`, `nama_barang`, `kategori`, `stok`, `kondisi`, `foto`) VALUES
(1, 'Kunci Inggris 10 inch', 'Kunci', 10, 'Baik', NULL),
(2, 'Kunci Inggris 8 inch', 'Kunci', 8, 'Baik', NULL),
(3, 'Obeng Plus 6 inch', 'Obeng', 15, 'Baik', NULL),
(4, 'Obeng Minus 5 inch', 'Obeng', 12, 'Baik', NULL),
(5, 'Dongkrak 2 Ton', 'Dongkrak', 4, 'Baik', NULL),
(6, 'Dongkrak 3 Ton', 'Dongkrak', 3, 'Baik', NULL),
(7, 'Palu Besi 500 gram', 'Palu', 7, 'Baik', NULL),
(8, 'Palu Besi 750 gram', 'Palu', 6, 'Baik', NULL),
(9, 'Tang Jepit 8 inch', 'Tang', 9, 'Baik', NULL),
(10, 'Tang Potong 10 inch', 'Tang', 8, 'Rusak', NULL),
(11, 'Gergaji Tangan', 'Gergaji', 5, 'Baik', NULL),
(12, 'Bor Listrik 450W', 'Mesin', 2, 'Baik', NULL),
(13, 'Meteran 5 meter', 'Pengukur', 10, 'Baik', NULL),
(14, 'Tingkat Air Laser', 'Pengukur', 3, 'Baik', NULL),
(15, 'Kacamata Kerja Safety', 'Perlengkapan Keselamatan', 25, 'Baik', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `peminjaman`
--

CREATE TABLE `peminjaman` (
  `id` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `nama_peminjam` varchar(100) DEFAULT NULL,
  `id_barang` int(11) NOT NULL,
  `tgl_pinjam` date NOT NULL,
  `tgl_kembali` date DEFAULT NULL,
  `status` enum('pending','disetujui','ditolak','menunggu_pengembalian','kembali') DEFAULT 'pending',
  `bukti_kembali` varchar(255) DEFAULT NULL,
  `catatan_pengembalian` text DEFAULT NULL,
  `catatan_penolakan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `peminjaman`
--

INSERT INTO `peminjaman` (`id`, `id_user`, `nama_peminjam`, `id_barang`, `tgl_pinjam`, `tgl_kembali`, `status`, `bukti_kembali`, `catatan_pengembalian`, `catatan_penolakan`) VALUES
(1, 3, 'Siswa Teladan', 3, '2026-05-05', '2026-05-07', 'kembali', NULL, 'Dalam kondisi baik', NULL),
(2, 4, 'Budi Santoso', 1, '2026-05-06', NULL, 'disetujui', NULL, NULL, NULL),
(3, 5, 'Ani Wijaya', 5, '2026-05-07', NULL, 'disetujui', NULL, NULL, NULL),
(4, 3, 'Siswa Teladan', 7, '2026-05-04', '2026-05-07', 'kembali', NULL, 'Masih dalam kondisi baik', NULL),
(5, 4, 'Budi Santoso', 9, '2026-05-07', NULL, 'pending', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','guru','siswa') NOT NULL,
  `foto_profil` varchar(255) DEFAULT NULL,
  `nip` varchar(30) DEFAULT NULL,
  `nisn` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nama`, `username`, `password`, `role`, `foto_profil`, `nip`, `nisn`) VALUES
(1, 'Hendrik Admin', 'admin', '$2b$10$Y148g6rK.f837D9sE9l0ce.X52l/fS3J22vXk/2Vd/4vT5Qc8hY7a', 'admin', NULL, '198505112008011001', NULL),
(2, 'Pak Guru Mesin', 'guru', '$2b$10$Y148g6rK.f837D9sE9l0ce.X52l/fS3J22vXk/2Vd/4vT5Qc8hY7a', 'guru', NULL, '197203151998021002', NULL),
(3, 'Siswa Teladan', 'siswa', '$2b$10$Y148g6rK.f837D9sE9l0ce.X52l/fS3J22vXk/2Vd/4vT5Qc8hY7a', 'siswa', NULL, NULL, '202401001'),
(4, 'Budi Santoso', 'siswa2', '$2b$10$Y148g6rK.f837D9sE9l0ce.X52l/fS3J22vXk/2Vd/4vT5Qc8hY7a', 'siswa', NULL, NULL, '202401002'),
(5, 'Ani Wijaya', 'siswa3', '$2b$10$Y148g6rK.f837D9sE9l0ce.X52l/fS3J22vXk/2Vd/4vT5Qc8hY7a', 'siswa', NULL, NULL, '202401003'),
(6, 'Ibu Koordinator', 'guru2', '$2b$10$Y148g6rK.f837D9sE9l0ce.X52l/fS3J22vXk/2Vd/4vT5Qc8hY7a', 'guru', NULL, '197805201999032001', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `barang`
--
ALTER TABLE `barang`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `peminjaman`
--
ALTER TABLE `peminjaman`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_user` (`id_user`),
  ADD KEY `id_barang` (`id_barang`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `barang`
--
ALTER TABLE `barang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `peminjaman`
--
ALTER TABLE `peminjaman`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `peminjaman`
--
ALTER TABLE `peminjaman`
  ADD CONSTRAINT `peminjaman_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `peminjaman_ibfk_2` FOREIGN KEY (`id_barang`) REFERENCES `barang` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
