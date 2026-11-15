import express from 'express';
import multer from 'multer';
import { cekLogin, cekRole, withPendingCount } from '../middlewares/authMiddleware.js';
import usersController from '../controllers/usersController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }
});

const router = express.Router();

router.use(cekLogin);
router.use(withPendingCount);
router.use(cekRole(['admin']));

router.get('/', usersController.listUsers);
router.get('/tambah', usersController.showTambah);
router.post('/tambah', upload.single('foto_profil'), usersController.createUser);
router.get('/edit/:id', usersController.showEdit);
router.post('/edit/:id', upload.single('foto_profil'), usersController.updateUser);
router.post('/hapus/:id', usersController.deleteUser);

export default router;
