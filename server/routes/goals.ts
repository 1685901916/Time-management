import { Router, Request, Response } from 'express';
import db from '../database.js';

const router = Router();

// GET /api/goals
router.get('/', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const rows = db.prepare('SELECT * FROM goals WHERE user_id = ? AND is_archived = 0 ORDER BY created_at DESC').all(userId);

  const goals = rows.map((row: any) => ({
    id: String(row.id),
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
  }));

  res.json({ goals });
});

// POST /api/goals
router.post('/', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { title, subtitle, category } = req.body;

  if (!title || !category) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO goals (user_id, title, subtitle, category) VALUES (?, ?, ?, ?)'
  ).run(userId, title, subtitle || '', category);

  res.status(201).json({
    goal: {
      id: String(result.lastInsertRowid),
      title,
      subtitle: subtitle || '',
      category,
    },
  });
});

// PUT /api/goals/:id
router.put('/:id', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const goalId = req.params.id;
  const { title, subtitle, category } = req.body;

  const existing: any = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(goalId, userId);
  if (!existing) {
    res.status(404).json({ error: '目标不存在' });
    return;
  }

  const newTitle = title || existing.title;
  const newSubtitle = subtitle !== undefined ? subtitle : existing.subtitle;
  const newCategory = category || existing.category;

  db.prepare(`UPDATE goals SET title=?, subtitle=?, category=?, updated_at=datetime('now') WHERE id=?`)
    .run(newTitle, newSubtitle, newCategory, goalId);

  res.json({ goal: { id: goalId, title: newTitle, subtitle: newSubtitle, category: newCategory } });
});

// DELETE /api/goals/:id
router.delete('/:id', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const goalId = req.params.id;

  const existing = db.prepare('SELECT id FROM goals WHERE id = ? AND user_id = ?').get(goalId, userId);
  if (!existing) {
    res.status(404).json({ error: '目标不存在' });
    return;
  }

  db.prepare('DELETE FROM goals WHERE id = ?').run(goalId);
  res.json({ success: true });
});

export default router;
