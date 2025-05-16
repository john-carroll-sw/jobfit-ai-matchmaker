import { Router } from 'express';
import { healthCheck } from '../controllers/healthController';

const router = Router();

// GET /api/health
router.get('/', healthCheck);

export default router;
