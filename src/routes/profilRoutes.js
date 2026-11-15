import express from 'express';
import multer from 'multer';
import { cekLogin, withPendingCount } from '../middlewares/authMiddleware.js';
import profilController from '../controllers/profilController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 } // 4MB
});

const router = express.Router();

router.get('/', cekLogin, withPendingCount, profilController.showProfile);
router.post('/', cekLogin, withPendingCount, upload.single('foto_profil'), profilController.updateProfile);

export default router;
