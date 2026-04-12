import { Router, Request, Response } from 'express';
import db from '../database.js';

const router = Router();

// GET /api/todos?date=YYYY-MM-DD
router.get('/', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { date } = req.query;

  let rows: any[];
  if (date) {
    rows = db.prepare(
      'SELECT * FROM todos WHERE user_id = ? AND (date = ? OR date IS NULL) AND is_archived = 0 ORDER BY created_at DESC'
    ).all(userId, date);
  } else {
    rows = db.prepare(
      'SELECT * FROM todos WHERE user_id = ? AND is_archived = 0 ORDER BY created_at DESC'
    ).all(userId);
  }

  const todos = rows.map((row: any) => ({
    id: String(row.id),
    title: row.title,
    note: row.note,
    completed: !!row.completed,
    quadrant: row.quadrant,
    date: row.date,
    isArchived: !!row.is_archived,
  }));

  res.json({ todos });
});

// POST /api/todos
router.post('/', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { title, quadrant, note, date } = req.body;

  if (!title || !quadrant) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO todos (user_id, title, note, quadrant, date) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, title, note || '', quadrant, date || null);

  res.status(201).json({
    todo: {
      id: String(result.lastInsertRowid),
      title,
      note: note || '',
      completed: false,
      quadrant,
      date: date || undefined,
    },
  });
});

// PUT /api/todos/:id
router.put('/:id', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const todoId = req.params.id;
  const { title, note, completed, quadrant, date } = req.body;

  const existing: any = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(todoId, userId);
  if (!existing) {
    res.status(404).json({ error: '待办不存在' });
    return;
  }

  db.prepare(
    `UPDATE todos SET title=?, note=?, completed=?, quadrant=?, date=?, updated_at=datetime('now') WHERE id=?`
  ).run(
    title || existing.title,
    note !== undefined ? note : existing.note,
    completed !== undefined ? (completed ? 1 : 0) : existing.completed,
    quadrant || existing.quadrant,
    date !== undefined ? date : existing.date,
    todoId
  );

  res.json({
    todo: {
      id: todoId,
      title: title || existing.title,
      note: note !== undefined ? note : existing.note,
      completed: completed !== undefined ? completed : !!existing.completed,
      quadrant: quadrant || existing.quadrant,
      date: date !== undefined ? date : existing.date,
    },
  });
});

// DELETE /api/todos/:id (soft delete)
router.delete('/:id', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const todoId = req.params.id;

  const existing = db.prepare('SELECT id FROM todos WHERE id = ? AND user_id = ?').get(todoId, userId);
  if (!existing) {
    res.status(404).json({ error: '待办不存在' });
    return;
  }

  db.prepare(`UPDATE todos SET is_archived = 1, updated_at = datetime('now') WHERE id = ?`).run(todoId);
  res.json({ success: true });
});

export default router;
