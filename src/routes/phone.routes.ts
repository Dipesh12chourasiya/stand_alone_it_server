import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import * as phoneController from '@/controllers/phone.controller';

const router = Router();

// ─── Authenticated routes (recruiter) ──────────────────────────

// Create a phone session for an interview
router.post('/session/:interviewId', authenticate, phoneController.createSession);

// Get active session for an interview (used on session page load)
router.get('/active/:interviewId', authenticate, phoneController.getActiveSession);

// ─── Public routes (phone scans QR — no auth) ──────────────────

// Validate session token
router.get('/validate/:sessionToken', phoneController.validateSession);

// Get full session details
router.get('/session/:sessionToken', phoneController.getSession);

// Mark phone as connected
router.post('/connect/:sessionToken', phoneController.connectPhone);

// Update device info
router.patch('/device-info/:sessionToken', phoneController.updateDeviceInfo);

export default router;
