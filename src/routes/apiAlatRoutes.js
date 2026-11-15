import express from 'express';
import multer from 'multer';
import { cekLogin, cekRole } from '../middlewares/authMiddleware.js';
import alatController from '../controllers/alatController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }
});

const uploadFields = upload.fields([
  { name: 'foto', maxCount: 1 },
  { name: 'gambar', maxCount: 1 }
]);

const router = express.Router();

// GET /api/alat
// Rejects any attempt to invoke mutation via GET (e.g. ?action=delete)
router.get('/', cekLogin, cekRole(['admin']), (req, res, next) => {
  if (req.query.action && ['delete', 'create', 'update'].includes(req.query.action)) {
    return res.status(405).json({
      success: false,
      message: 'Metode HTTP tidak diizinkan! Aksi mutasi data alat tidak boleh dipicu melalui GET. Gunakan metode POST, PUT, atau DELETE.'
    });
  }
  next();
}, alatController.getAllAlat);

// GET /api/alat/:id (Tool Detail)
router.get('/:id', cekLogin, cekRole(['admin']), alatController.getAlatById);

// POST /api/alat (Create Tool - Admin Only + CSRF)
router.post('/', cekLogin, cekRole(['admin']), uploadFields, alatController.createAlat);

// PUT /api/alat/:id (Update Tool - Admin Only + CSRF)
router.put('/:id', cekLogin, cekRole(['admin']), uploadFields, alatController.updateAlat);

// DELETE /api/alat/:id (Delete/Archive Tool - Admin Only + CSRF)
router.delete('/:id', cekLogin, cekRole(['admin']), alatController.deleteAlat);

export default router;
