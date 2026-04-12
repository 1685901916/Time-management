import { Router, Request, Response } from 'express';
import db from '../database.js';

const router = Router();

// GET /api/entries?date=YYYY-MM-DD
router.get('/', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { date, from, to } = req.query;

  let rows: any[];
  if (date) {
    rows = db.prepare(
      'SELECT * FROM time_entries WHERE user_id = ? AND date = ? AND is_archived = 0 ORDER BY start_time'
    ).all(userId, date);
  } else if (from && to) {
    rows = db.prepare(
      'SELECT * FROM time_entries WHERE user_id = ? AND date BETWEEN ? AND ? AND is_archived = 0 ORDER BY date, start_time'
    ).all(userId, from, to);
  } else {
    rows = db.prepare(
      'SELECT * FROM time_entries WHERE user_id = ? AND is_archived = 0 ORDER BY date DESC, start_time'
    ).all(userId);
  }

  // Attach photos
  const entries = rows.map((row: any) => {
    const photos = db.prepare('SELECT * FROM entry_photos WHERE entry_id = ?').all(row.id);
    return {
      id: String(row.id),
      startTime: row.start_time,
      endTime: row.end_time,
      category: row.category,
      note: row.note,
      durationMinutes: row.duration_minutes,
      date: row.date,
      isArchived: !!row.is_archived,
      linkedTodoId: row.linked_todo_id ? String(row.linked_todo_id) : undefined,
      linkedGoalId: row.linked_goal_id ? String(row.linked_goal_id) : undefined,
      photos: photos.map((p: any) => ({
        id: String(p.id),
        entryId: String(p.entry_id),
        filePath: p.file_path,
        caption: p.caption,
        createdAt: p.created_at,
      })),
    };
  });

  res.json({ entries });
});

// POST /api/entries
router.post('/', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { date, startTime, endTime, category, note, linkedTodoId, linkedGoalId } = req.body;

  if (!date || !startTime || !endTime || !category) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }

  const [h1, m1] = startTime.split(':').map(Number);
  const [h2, m2] = endTime.split(':').map(Number);
  let duration = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (duration < 0) duration += 24 * 60;

  const result = db.prepare(
    'INSERT INTO time_entries (user_id, date, start_time, end_time, category, note, duration_minutes, linked_todo_id, linked_goal_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, date, startTime, endTime, category, note || '', duration, linkedTodoId || null, linkedGoalId || null);

  res.status(201).json({
    entry: {
      id: String(result.lastInsertRowid),
      date,
      startTime,
      endTime,
      category,
      note: note || '',
      durationMinutes: duration,
      linkedTodoId: linkedTodoId || undefined,
      linkedGoalId: linkedGoalId || undefined,
      photos: [],
    },
  });
});

// PUT /api/entries/:id
router.put('/:id', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const entryId = req.params.id;
  const { startTime, endTime, category, note, linkedTodoId, linkedGoalId } = req.body;

  const existing: any = db.prepare('SELECT * FROM time_entries WHERE id = ? AND user_id = ?').get(entryId, userId);
  if (!existing) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }

  const newStart = startTime || existing.start_time;
  const newEnd = endTime || existing.end_time;
  const newCat = category || existing.category;
  const newNote = note !== undefined ? note : existing.note;
  const newLinkedTodoId = linkedTodoId !== undefined ? (linkedTodoId || null) : existing.linked_todo_id;
  const newLinkedGoalId = linkedGoalId !== undefined ? (linkedGoalId || null) : existing.linked_goal_id;

  const [h1, m1] = newStart.split(':').map(Number);
  const [h2, m2] = newEnd.split(':').map(Number);
  let duration = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (duration < 0) duration += 24 * 60;

  db.prepare(
    `UPDATE time_entries SET start_time=?, end_time=?, category=?, note=?, duration_minutes=?, linked_todo_id=?, linked_goal_id=?, updated_at=datetime('now') WHERE id=?`
  ).run(newStart, newEnd, newCat, newNote, duration, newLinkedTodoId, newLinkedGoalId, entryId);

  res.json({
    entry: {
      id: entryId,
      date: existing.date,
      startTime: newStart,
      endTime: newEnd,
      category: newCat,
      note: newNote,
      durationMinutes: duration,
      linkedTodoId: newLinkedTodoId ? String(newLinkedTodoId) : undefined,
      linkedGoalId: newLinkedGoalId ? String(newLinkedGoalId) : undefined,
    },
  });
});

// DELETE /api/entries/:id (soft delete)
router.delete('/:id', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const entryId = req.params.id;

  const existing = db.prepare('SELECT id FROM time_entries WHERE id = ? AND user_id = ?').get(entryId, userId);
  if (!existing) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }

  db.prepare(`UPDATE time_entries SET is_archived = 1, updated_at = datetime('now') WHERE id = ?`).run(entryId);
  res.json({ success: true });
});

export default router;
