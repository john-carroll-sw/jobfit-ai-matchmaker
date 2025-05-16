import { Request, Response } from 'express';
import { reasonAboutDisruption } from '../azure/reasoningService';
import { detectDisruptions, currentSupplyChain, closedBridges } from './supplyChainController';

/**
 * POST /api/reason
 * Generate reasoning and recommendations for the current supply chain state
 */
export const postReasonAboutDisruption = async (req: Request, res: Response): Promise<void> => {
  try {
    // Defensive: ensure req.body is always an object
    const body = req.body || {};
    const { optimizationPriority } = body;
    // Use the current mutable V1 supply chain state
    const currentState = currentSupplyChain;

    // Use closedBridges imported from supplyChainController
    const disruptions = detectDisruptions(currentState, closedBridges);

    // Call Azure OpenAI to reason about the current state and disruptions
    const result = await reasonAboutDisruption({ state: currentState, disruptions, optimizationPriority });

    // Only return the parsed reasoning output (reasoning + recommendations)
    const parsed = result?.output_parsed || result;
    res.json({
      status: 'ok',
      data: parsed
    });
  } catch (error) {
    console.error('Error generating reasoning:', error);
    res.status(500).json({
      status: 'error',
      message: (error as Error).message || 'Failed to generate reasoning'
    });
  }
};

// Export detectDisruptions for use in other controllers
export { detectDisruptions };