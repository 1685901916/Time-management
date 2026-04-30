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

// 给 SSE 端点用：EventSource 不能自定义 header，token 通过 query 传入
export function authQueryMiddleware(req: Request, res: Response, next: NextFunction) {
  const queryToken = typeof req.query.token === 'string' ? req.query.token : '';
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : '';
  const token = queryToken || headerToken;

  if (!token) {
    res.status(401).json({ error: '未登录' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    (req as any).user = { userId: decoded.userId };
    next();
  } catch {
    res.status(401).json({ error: '登录已过期' });
  }
}
