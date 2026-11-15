import express from 'express';
import { cekLogin, withPendingCount } from '../middlewares/authMiddleware.js';
import dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/', cekLogin, withPendingCount, dashboardController.showDashboard);

export default router;
