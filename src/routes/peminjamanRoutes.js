import { Router } from 'express';
import multer from 'multer';
import { cekLogin, cekRole, withPendingCount } from '../middlewares/authMiddleware.js';
import peminjamanController from '../controllers/peminjamanController.js';

const router = Router();

// Konfigurasi Multer untuk unggah bukti pengembalian (Memory Storage, Limit 4MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }
});

// Middleware autentikasi untuk seluruh rute peminjaman
router.use(cekLogin);
router.use(withPendingCount);

// 1. Tampilan Utama Peminjaman (HTML View)
router.get('/', peminjamanController.listPeminjaman);

// 2. Alur Pengajuan Peminjaman oleh Siswa
router.post('/ajukan', cekRole(['siswa']), peminjamanController.ajukanPinjam);

// 3. Alur Persetujuan & Penolakan oleh Guru/Admin (POST only)
router.post('/acc/:id', cekRole(['guru', 'admin']), peminjamanController.accPinjam);
router.post('/tolak/:id', cekRole(['guru', 'admin']), peminjamanController.tolakPinjam);

// Blokir mutasi via GET (HTTP 405)
router.get('/acc/:id', cekRole(['guru', 'admin']), (req, res) => {
  return res.status(405).send('Metode HTTP GET tidak diizinkan untuk menyetujui peminjaman. Gunakan POST.');
});
router.get('/tolak/:id', cekRole(['guru', 'admin']), (req, res) => {
  return res.status(405).send('Metode HTTP GET tidak diizinkan untuk menolak peminjaman. Gunakan POST.');
});

// 4. Alur Pengembalian Barang oleh Siswa (Anti-IDOR)
router.get('/kembali/:id', cekRole(['siswa']), peminjamanController.getFormKembali);
router.post(
  '/kembali/:id',
  cekRole(['siswa']),
  upload.single('bukti_kembali'),
  peminjamanController.ajukanKembali
);

// 5. Alur Review Pengembalian oleh Guru/Admin
router.get('/review', cekRole(['guru', 'admin']), peminjamanController.listReviewKembali);
router.get('/review_kembali', cekRole(['guru', 'admin']), peminjamanController.listReviewKembali);
router.post('/review/:id', cekRole(['guru', 'admin']), peminjamanController.reviewKembali);
router.get('/review/:id', cekRole(['guru', 'admin']), (req, res) => {
  return res.status(405).send('Metode HTTP GET tidak diizinkan untuk me-review peminjaman. Gunakan POST.');
});

// 6. Akses Bukti Foto Terlindungi (Anti-IDOR & Autentikasi Wajib)
router.get('/bukti/:filename', cekLogin, peminjamanController.getBuktiFoto);

export default router;
