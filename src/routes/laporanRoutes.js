import express from 'express';
import { cekLogin, cekRole, withPendingCount } from '../middlewares/authMiddleware.js';
import laporanController from '../controllers/laporanController.js';

const router = express.Router();

router.use(cekLogin);
router.use(withPendingCount);
router.use(cekRole(['guru', 'admin']));

router.get('/', laporanController.getLaporanPage);
router.get('/index.php', (req, res) => res.redirect('/laporan'));
router.get('/cetak/csv', laporanController.exportCsv);
router.get('/cetak/pdf', laporanController.exportPdf);
router.get('/cetak.php', laporanController.exportPdf);

export default router;
