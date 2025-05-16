import { Router, Request, Response } from 'express';
import { getSupplyChain, postDisrupt, resetSupplyChain } from '../controllers/supplyChainController';

const router = Router();

// GET /api/supplychain
router.get('/', getSupplyChain);

// POST /api/supplychain/disrupt
router.post('/disrupt', postDisrupt);

// POST /api/supplychain/reset
router.post('/reset', resetSupplyChain);

export default router;
