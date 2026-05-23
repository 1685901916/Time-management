import { Router, Request, Response } from 'express';
import db from '../database.js';

const router = Router();

const defaultCategories = [
  ['学习', '#FFD966'],
  ['睡觉', '#6DADD1'],
  ['刷手机', '#76C893'],
  ['游戏', '#E63946'],
  ['工作', '#F4A261'],
  ['信息', '#5C7CFA'],
  ['户外', '#F77F00'],
  ['写笔记', '#E76F51'],
  ['休息', '#A8DADC'],
  ['运动', '#F08080'],
] as const;

const mapCategory = (row: any) => ({
  id: String(row.id),
  name: row.name,
  color: row.color,
  sortOrder: row.sort_order,
});

const ensureDefaultCategories = (userId: number) => {
  const count = db
    .prepare('SELECT COUNT(*) AS count FROM categories WHERE user_id = ? AND is_archived = 0')
    .get(userId) as { count: number };

  if (count.count > 0) return;

  const insert = db.prepare(
    `INSERT OR IGNORE INTO categories (user_id, name, color, sort_order)
     VALUES (?, ?, ?, ?)`
  );

  const transaction = db.transaction(() => {
    defaultCategories.forEach(([name, color], index) => {
      insert.run(userId, name, color, index + 1);
    });
  });

  transaction();
};

router.get('/', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  ensureDefaultCategories(userId);
  const rows = db
    .prepare('SELECT * FROM categories WHERE user_id = ? AND is_archived = 0 ORDER BY sort_order ASC, created_at ASC')
    .all(userId);

  res.json({ categories: rows.map(mapCategory) });
});

router.post('/', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const color = typeof req.body?.color === 'string' && req.body.color.trim() ? req.body.color.trim() : '#64748B';

  if (!name) {
    res.status(400).json({ error: '分类名称不能为空' });
    return;
  }

  const existing = db
    .prepare('SELECT * FROM categories WHERE user_id = ? AND name = ?')
    .get(userId, name) as any | undefined;

  if (existing) {
    if (existing.is_archived) {
      db.prepare('UPDATE categories SET color = ?, is_archived = 0, updated_at = datetime(\'now\') WHERE id = ?').run(
        color,
        existing.id
      );
      const restored = db.prepare('SELECT * FROM categories WHERE id = ?').get(existing.id);
      res.status(201).json({ category: mapCategory(restored) });
      return;
    }

    res.status(409).json({ error: '分类已存在' });
    return;
  }

  const maxSortRow = db
    .prepare('SELECT COALESCE(MAX(sort_order), 0) AS maxSortOrder FROM categories WHERE user_id = ?')
    .get(userId) as any;

  const result = db
    .prepare('INSERT INTO categories (user_id, name, color, sort_order) VALUES (?, ?, ?, ?)')
    .run(userId, name, color, (maxSortRow?.maxSortOrder || 0) + 1);

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ category: mapCategory(category) });
});

router.put('/:id', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const categoryId = req.params.id;
  const existing = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(categoryId, userId) as any;

  if (!existing) {
    res.status(404).json({ error: '分类不存在' });
    return;
  }

  const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim() : existing.name;
  const color = typeof req.body?.color === 'string' && req.body.color.trim() ? req.body.color.trim() : existing.color;
  const sortOrder = req.body?.sortOrder !== undefined ? req.body.sortOrder : existing.sort_order;

  const transaction = db.transaction(() => {
    db.prepare(
      `UPDATE categories
       SET name = ?, color = ?, sort_order = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`
    ).run(name, color, sortOrder, categoryId, userId);

    if (name !== existing.name) {
      db.prepare("UPDATE goals SET category = ?, updated_at = datetime('now') WHERE user_id = ? AND category = ?").run(
        name,
        userId,
        existing.name
      );
      db.prepare("UPDATE time_entries SET category = ?, updated_at = datetime('now') WHERE user_id = ? AND category = ?").run(
        name,
        userId,
        existing.name
      );
    }
  });

  try {
    transaction();
  } catch (error: any) {
    if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: '分类已存在' });
      return;
    }
    throw error;
  }

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId);
  res.json({ category: mapCategory(category) });
});

router.put('/reorder/all', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { categoryIds } = req.body as { categoryIds?: string[] };

  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    res.status(400).json({ error: '缺少排序数据' });
    return;
  }

  const transaction = db.transaction((ids: string[]) => {
    ids.forEach((categoryId, index) => {
      db.prepare("UPDATE categories SET sort_order = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?").run(
        index + 1,
        categoryId,
        userId
      );
    });
  });

  transaction(categoryIds);
  res.json({ success: true });
});

router.delete('/:id', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const categoryId = req.params.id;
  const existing = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(categoryId, userId) as any;

  if (!existing) {
    res.status(404).json({ error: '分类不存在' });
    return;
  }

  const usage = db
    .prepare('SELECT COUNT(*) AS count FROM goals WHERE user_id = ? AND category = ? AND is_archived = 0')
    .get(userId, existing.name) as any;

  if (usage.count > 0) {
    res.status(409).json({ error: '分类下还有目标，先调整这些目标后再删除' });
    return;
  }

  db.prepare('UPDATE categories SET is_archived = 1, updated_at = datetime(\'now\') WHERE id = ?').run(categoryId);
  res.json({ success: true });
});

export default router;
