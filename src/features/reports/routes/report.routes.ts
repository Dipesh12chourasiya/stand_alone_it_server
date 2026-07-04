import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate } from '@/middlewares/authenticate';

const router = Router();

// All report routes require authentication
router.use(authenticate);

// POST /api/v1/reports  —  Generate a new report
router.post('/', reportController.create);

// GET /api/v1/reports  —  List reports (paginated, searchable)
router.get('/', reportController.list);

// GET /api/v1/reports/:id  —  Get report details
router.get('/:id', reportController.getById);

// DELETE /api/v1/reports/:id  —  Delete a report
router.delete('/:id', reportController.remove);

// GET /api/v1/reports/:id/download  —  Download report as PDF
router.get('/:id/download', reportController.download);

export default router;
