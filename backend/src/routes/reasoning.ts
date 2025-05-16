import { Router } from 'express';
import { postReasonAboutDisruption } from '../controllers/reasoningController';

const router = Router();

// POST /api/reason
router.post('/', postReasonAboutDisruption);

export default router;