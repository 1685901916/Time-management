import { Router, Request, Response } from 'express';
import db from '../database.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { date } = req.query;

  if (!date) {
    res.status(400).json({ error: '缺少 date 参数' });
    return;
  }

  const row: any = db.prepare('SELECT * FROM daily_reviews WHERE user_id = ? AND date = ?').get(userId, date);

  if (!row) {
    res.json({ review: null });
    return;
  }

  res.json({
    review: {
      id: String(row.id),
      date: row.date,
      content: row.content,
      updatedAt: row.updated_at,
    },
  });
});

router.put('/', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { date, content } = req.body;

  if (!date) {
    res.status(400).json({ error: '缺少 date 参数' });
    return;
  }

  db.prepare(`
    INSERT INTO daily_reviews (user_id, date, content, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET
      content=excluded.content,
      updated_at=datetime('now')
  `).run(userId, date, content || '');

  const row: any = db.prepare('SELECT * FROM daily_reviews WHERE user_id = ? AND date = ?').get(userId, date);

  res.json({
    review: {
      id: String(row.id),
      date: row.date,
      content: row.content,
      updatedAt: row.updated_at,
    },
  });
});

export default router;
