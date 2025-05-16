import { Request, Response } from 'express';

export const healthCheck = (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend API is healthy.' });
};
