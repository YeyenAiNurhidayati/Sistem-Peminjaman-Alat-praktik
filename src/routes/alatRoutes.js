import express from 'express';
import multer from 'multer';
import { cekLogin, cekRole, withPendingCount } from '../middlewares/authMiddleware.js';
import alatController from '../controllers/alatController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 } // 4MB
});

const uploadFields = upload.fields([
  { name: 'foto', maxCount: 1 },
  { name: 'gambar', maxCount: 1 }
]);

const router = express.Router();

// List all tools (Admin only HTML view)
router.get('/', cekLogin, withPendingCount, cekRole(['admin']), alatController.listAlat);

// Standalone edit page (Admin only HTML view)
router.get('/edit/:id', cekLogin, withPendingCount, cekRole(['admin']), alatController.showEditPage);

// HTML Form Submissions (fallback for standard non-AJAX browser forms)
router.post('/edit/:id', cekLogin, cekRole(['admin']), uploadFields, alatController.updateAlat);
router.post('/hapus/:id', cekLogin, cekRole(['admin']), alatController.deleteAlat);

export default router;
