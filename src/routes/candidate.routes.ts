import { Router } from 'express';
import * as candidateController from '@/controllers/candidate.controller';

const router = Router();

// All candidate routes are public (accessed via invitation token)

router.get('/validate/:token', candidateController.validateInvite);
router.get('/join/:token', candidateController.getInterview);
router.get('/waiting-room/:token', candidateController.waitingRoomStatus);
router.post('/device-verification/:token', candidateController.submitDeviceVerification);
router.get('/device-verification/:token', candidateController.getDeviceVerification);

export default router;
