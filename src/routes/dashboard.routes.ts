import { Router } from 'express';
import * as dashboardController from '@/controllers/dashboard.controller';
import { authenticate } from '@/middlewares/authenticate';

const router = Router();

router.use(authenticate);

router.get('/stats', dashboardController.stats);
router.get('/weekly', dashboardController.weekly);
router.get('/monthly', dashboardController.monthly);
router.get('/recent', dashboardController.recent);
router.get('/status-counts', dashboardController.statusCounts);

export default router;
