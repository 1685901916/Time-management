import { Router, Request, Response } from 'express';
import db from '../database.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const rows = db
    .prepare('SELECT * FROM goals WHERE user_id = ? AND is_archived = 0 ORDER BY sort_order ASC, created_at DESC')
    .all(userId);

  const goals = rows.map((row: any) => ({
    id: String(row.id),
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    color: row.color || undefined,
    sortOrder: row.sort_order,
  }));

  res.json({ goals });
});

router.post('/', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { title, subtitle, category, color } = req.body;

  if (!title || !category) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }

  const maxSortRow: any = db
    .prepare('SELECT COALESCE(MAX(sort_order), 0) AS maxSortOrder FROM goals WHERE user_id = ?')
    .get(userId);
  const nextSortOrder = (maxSortRow?.maxSortOrder || 0) + 1;

  const result = db
    .prepare('INSERT INTO goals (user_id, title, subtitle, category, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
    .run(userId, title, subtitle || '', category, color || null, nextSortOrder);

  res.status(201).json({
    goal: {
      id: String(result.lastInsertRowid),
      title,
      subtitle: subtitle || '',
      category,
      color: color || undefined,
      sortOrder: nextSortOrder,
    },
  });
});

router.put('/:id', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const goalId = req.params.id;
  const { title, subtitle, category, color, sortOrder } = req.body;

  const existing: any = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(goalId, userId);
  if (!existing) {
    res.status(404).json({ error: '目标不存在' });
    return;
  }

  const newTitle = title || existing.title;
  const newSubtitle = subtitle !== undefined ? subtitle : existing.subtitle;
  const newCategory = category || existing.category;
  const newColor = color !== undefined ? (color || null) : existing.color;
  const newSortOrder = sortOrder !== undefined ? sortOrder : existing.sort_order;

  db.prepare(
    `UPDATE goals
     SET title = ?, subtitle = ?, category = ?, color = ?, sort_order = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(newTitle, newSubtitle, newCategory, newColor, newSortOrder, goalId);

  res.json({
    goal: {
      id: goalId,
      title: newTitle,
      subtitle: newSubtitle,
      category: newCategory,
      color: newColor || undefined,
      sortOrder: newSortOrder,
    },
  });
});

router.put('/reorder/all', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { goalIds } = req.body as { goalIds?: string[] };

  if (!Array.isArray(goalIds) || goalIds.length === 0) {
    res.status(400).json({ error: '缺少排序数据' });
    return;
  }

  const transaction = db.transaction((ids: string[]) => {
    ids.forEach((goalId, index) => {
      db.prepare("UPDATE goals SET sort_order = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?").run(
        index + 1,
        goalId,
        userId
      );
    });
  });

  transaction(goalIds);
  res.json({ success: true });
});

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
