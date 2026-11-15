import { Router } from 'express';
import { cekLogin, cekRole } from '../middlewares/authMiddleware.js';
import peminjamanController from '../controllers/peminjamanController.js';
import pool from '../config/database.js';

const router = Router();

// Middleware autentikasi untuk seluruh API peminjaman
router.use(cekLogin);

// 1. GET /api/peminjaman/barang - Katalog barang tersedia (stok > 0)
router.get('/barang', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nama_barang, kategori, stok, kondisi, foto
      FROM barang
      WHERE deleted_at IS NULL AND stok > 0
      ORDER BY nama_barang ASC
    `);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. POST /api/peminjaman/ajukan - Siswa mengajukan peminjaman
router.post('/ajukan', cekRole(['siswa']), peminjamanController.ajukanPinjam);

// 3. POST /api/peminjaman/:id/acc - Guru / Admin menyetujui peminjaman
router.post('/:id/acc', cekRole(['guru', 'admin']), peminjamanController.accPinjam);

// 4. POST /api/peminjaman/:id/tolak - Guru / Admin menolak peminjaman
router.post('/:id/tolak', cekRole(['guru', 'admin']), peminjamanController.tolakPinjam);

// 5. POST /api/peminjaman/:id/review - Guru / Admin me-review pengembalian
router.post('/:id/review', cekRole(['guru', 'admin']), peminjamanController.reviewKembali);

// Penolakan tegas mutasi via GET (HTTP 405 Method Not Allowed)
const methodNotAllowed = (req, res) => {
  return res.status(405).json({
    success: false,
    message: 'Method Not Allowed: Aksi mutasi data peminjaman tidak boleh dipicu melalui GET. Gunakan metode POST dengan CSRF Token.'
  });
};

router.get('/ajukan', methodNotAllowed);
router.get('/:id/acc', methodNotAllowed);
router.get('/:id/tolak', methodNotAllowed);
router.get('/:id/review', methodNotAllowed);

// Penolakan tegas query dispatcher ?action= pada root API
router.all('/', (req, res) => {
  if (req.method === 'GET') {
    if (req.query.action) {
      return res.status(405).json({
        success: false,
        message: 'Method Not Allowed: Mutasi data melalui query action pada GET dilarang.'
      });
    }
    return res.status(400).json({ success: false, message: 'Endpoint root API peminjaman membutuhkan rute RESTful spesifik.' });
  }
  return res.status(404).json({ success: false, message: 'Rute legacy dengan dispatcher ?action= telah dihapus. Gunakan endpoint RESTful /api/peminjaman/:id/{acc,tolak,review}.' });
});

export default router;
