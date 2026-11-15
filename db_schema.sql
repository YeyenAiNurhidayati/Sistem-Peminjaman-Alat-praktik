-- Database Schema for Peminjaman Alat
-- Import this into a database named `peminjaman_alat`

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Table structure for table `barang`
--

DROP TABLE IF EXISTS `barang`;
CREATE TABLE `barang` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_barang` varchar(100) NOT NULL,
  `kategori` enum('Hand Tools','Power Tools','SST') NOT NULL,
  `stok` int(11) NOT NULL,
  `kondisi` varchar(50) NOT NULL,
  `gambar` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `barang`
--

INSERT INTO `barang` (`id`, `nama_barang`, `kategori`, `stok`, `kondisi`, `gambar`) VALUES
(1, 'Kunci Inggris', 'Hand Tools', 10, 'Baik', NULL),
(2, 'Obeng Plus', 'Hand Tools', 15, 'Baik', NULL),
(3, 'Dongkrak', 'Power Tools', 5, 'Baik', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','guru','siswa') NOT NULL,
  `foto_profil` varchar(255) DEFAULT NULL,
  `nip` varchar(30) DEFAULT NULL,
  `nisn` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nama`, `username`, `password`, `role`, `foto_profil`, `nip`, `nisn`) VALUES 
(1, 'Administrator', 'admin', '$2a$10$uriJ9HdK56sJcyTPr6ECAuZaOvagulk50bj2eh85VpVSpuVBkpuE6', 'admin', NULL, NULL, NULL),
(2, 'Pak Guru', 'guru', '$2a$10$Jj7JBHcDqzCkzJMbu7qgYebpFGYBwyEGIkxmWA6ByUnaQBQE0i4Jm', 'guru', NULL, '198501012010011001', NULL),
(3, 'Siswa Teladan', 'siswa', '$2a$10$HhNHVTfCz4NYiS5CoIqzae6fInXWfxchhBQpph5AHrCxqLIbkIrk2', 'siswa', NULL, NULL, '0012345678');

-- --------------------------------------------------------

--
-- Table structure for table `peminjaman`
--

DROP TABLE IF EXISTS `peminjaman`;
CREATE TABLE `peminjaman` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `id_barang` int(11) NOT NULL,
  `tgl_pinjam` date NOT NULL,
  `tgl_kembali` date DEFAULT NULL,
  `bukti_kembali` varchar(255) DEFAULT NULL,
  `catatan_pengembalian` text DEFAULT NULL,
  `catatan_penolakan` text DEFAULT NULL,
  `status` enum('pending','disetujui','ditolak','menunggu_pengembalian','kembali') DEFAULT 'pending',
  `nama_peminjam` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_user` (`id_user`),
  KEY `id_barang` (`id_barang`),
  CONSTRAINT `peminjaman_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `peminjaman_ibfk_2` FOREIGN KEY (`id_barang`) REFERENCES `barang` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `detail_peminjaman`
--

DROP TABLE IF EXISTS `detail_peminjaman`;
CREATE TABLE `detail_peminjaman` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_peminjaman` int(11) NOT NULL,
  `id_barang` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `id_peminjaman` (`id_peminjaman`),
  KEY `id_barang` (`id_barang`),
  CONSTRAINT `detail_peminjaman_ibfk_1` FOREIGN KEY (`id_peminjaman`) REFERENCES `peminjaman` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detail_peminjaman_ibfk_2` FOREIGN KEY (`id_barang`) REFERENCES `barang` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
