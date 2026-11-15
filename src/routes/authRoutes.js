import express from 'express';
import authController from '../controllers/authController.js';
import { checkLoginRateLimit, checkRegisterRateLimit } from '../middlewares/dbRateLimiter.js';

const router = express.Router();

router.get('/login', authController.showLogin);
router.post('/login', checkLoginRateLimit, authController.processLogin);

router.get('/register', authController.showRegister);
router.post('/register', checkRegisterRateLimit, authController.processRegister);

router.get('/logout', authController.logout);

export default router;
