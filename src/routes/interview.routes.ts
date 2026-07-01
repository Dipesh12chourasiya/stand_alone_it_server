import { Router } from 'express';
import * as interviewController from '@/controllers/interview.controller';
import { authenticate } from '@/middlewares/authenticate';
import { validate } from '@/middlewares/validate';
import {
  createInterviewSchema,
  updateInterviewSchema,
} from '@/validators/interview.validator';

const router = Router();

// All interview routes require authentication
router.use(authenticate);

// POST /api/v1/interviews  —  Create a new interview
router.post('/', validate(createInterviewSchema), interviewController.create);

// GET /api/v1/interviews  —  List all interviews for the recruiter
router.get('/', interviewController.list);

// GET /api/v1/interviews/:id  —  Get a single interview by ID
router.get('/:id', interviewController.getById);

// PATCH /api/v1/interviews/:id  —  Update an interview
router.patch('/:id', validate(updateInterviewSchema), interviewController.update);

// DELETE /api/v1/interviews/:id  —  Delete an interview
router.delete('/:id', interviewController.remove);

export default router;
