import { Router, Request, Response } from 'express';
import db from '../database.js';
import { hashPassword, comparePassword, signToken } from '../auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }
  if (username.length < 3) {
    res.status(400).json({ error: '用户名至少3个字符' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: '密码至少6个字符' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(409).json({ error: '用户名已存在' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const result = db.prepare('INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)').run(username, passwordHash, username);

  const token = signToken(result.lastInsertRowid as number);
  res.status(201).json({
    token,
    user: {
      id: result.lastInsertRowid,
      username,
      displayName: username,
    },
  });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const token = signToken(user.id);
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name || user.username,
      avatarUrl: user.avatar_url,
    },
  });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const user: any = db.prepare('SELECT id, username, display_name, avatar_url FROM users WHERE id = ?').get(userId);

  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name || user.username,
      avatarUrl: user.avatar_url,
    },
  });
});

export default router;
