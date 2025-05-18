import { Request, Response } from 'express';

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check API health
 *     description: Returns the health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Backend API is healthy.
 */
export const healthCheck = (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend API is healthy.' });
};
