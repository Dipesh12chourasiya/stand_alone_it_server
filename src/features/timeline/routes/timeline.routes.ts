import { Router } from 'express';
import * as timelineController from '../controllers/timeline.controller';
import { authenticate } from '@/middlewares/authenticate';

const router = Router();

// All timeline routes require authentication
router.use(authenticate);

// POST /api/v1/timeline  —  Create a timeline event (reusable by any service)
router.post('/', timelineController.create);

// GET /api/v1/timeline/:sessionId  —  List events for a session
router.get('/:sessionId', timelineController.list);

// GET /api/v1/timeline/:sessionId/export  —  Export events as JSON
router.get('/:sessionId/export', timelineController.exportEvents);

export default router;
