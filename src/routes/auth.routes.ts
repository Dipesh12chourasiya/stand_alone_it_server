import { Router } from 'express';
import * as authController from '@/controllers/auth.controller';
import { authenticate } from '@/middlewares/authenticate';
import { validate } from '@/middlewares/validate';
import { registerSchema, loginSchema } from '@/validators/auth.validator';

const router = Router();

// POST /api/v1/auth/register  —  Create a new account
router.post('/register', validate(registerSchema), authController.register);

// POST /api/v1/auth/login  —  Authenticate an existing account
router.post('/login', validate(loginSchema), authController.login);

// GET /api/v1/auth/me  —  Return the authenticated recruiter's profile
router.get('/me', authenticate, authController.me);

// POST /api/v1/auth/logout  —  Logout
router.post('/logout', authenticate, authController.logout);

export default router;
