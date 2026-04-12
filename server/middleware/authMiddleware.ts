import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未登录' });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    (req as any).user = { userId: decoded.userId };
    next();
  } catch {
    res.status(401).json({ error: '登录已过期' });
  }
}
