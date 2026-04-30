import { Router, Request, Response } from 'express';
import db from '../database.js';
import { authMiddleware, authQueryMiddleware } from '../middleware/authMiddleware.js';
import { emit, subscribe, unsubscribe } from '../utils/timerEvents.js';

const router = Router();

interface TimerRow {
  user_id: number;
  goal_data: string;
  started_at: number;
  note: string;
}

const rowToTimer = (row: TimerRow | undefined) => {
  if (!row) return null;
  let goal: any = null;
  try {
    goal = JSON.parse(row.goal_data);
  } catch {
    goal = null;
  }
  return {
    goal,
    startTime: row.started_at,
    note: row.note || '',
  };
};

const fetchTimer = (userId: number) => {
  const row = db
    .prepare('SELECT user_id, goal_data, started_at, note FROM active_timers WHERE user_id = ?')
    .get(userId) as TimerRow | undefined;
  return rowToTimer(row);
};

router.get('/', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).user.userId as number;
  res.json({ timer: fetchTimer(userId) });
});

router.post('/start', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).user.userId as number;
  const { goal, startTime } = req.body || {};

  if (!goal || typeof goal !== 'object' || !goal.id || !goal.category) {
    res.status(400).json({ error: '缺少 goal 信息' });
    return;
  }

  const startedAt = typeof startTime === 'number' && Number.isFinite(startTime) ? startTime : Date.now();
  const goalData = JSON.stringify(goal);

  db.prepare(
    `INSERT INTO active_timers (user_id, goal_data, started_at, note, updated_at)
     VALUES (?, ?, ?, '', datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       goal_data = excluded.goal_data,
       started_at = excluded.started_at,
       note = '',
       updated_at = datetime('now')`
  ).run(userId, goalData, startedAt);

  const timer = fetchTimer(userId);
  emit(userId, 'started', timer);
  res.json({ timer });
});

router.patch('/note', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).user.userId as number;
  const { note } = req.body || {};
  const safeNote = typeof note === 'string' ? note : '';

  const result = db
    .prepare('UPDATE active_timers SET note = ?, updated_at = datetime(\'now\') WHERE user_id = ?')
    .run(safeNote, userId);

  if (result.changes === 0) {
    res.status(404).json({ error: '没有进行中的计时器' });
    return;
  }

  const timer = fetchTimer(userId);
  emit(userId, 'note', timer);
  res.json({ timer });
});

router.delete('/', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).user.userId as number;
  db.prepare('DELETE FROM active_timers WHERE user_id = ?').run(userId);
  emit(userId, 'stopped', null);
  res.json({ ok: true });
});

router.get('/stream', authQueryMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).user.userId as number;

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  // 初次推送当前快照
  const initial = fetchTimer(userId);
  res.write(`event: snapshot\ndata: ${JSON.stringify(initial)}\n\n`);

  subscribe(userId, res);

  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    } catch {
      // ignore
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe(userId, res);
  });
});

export default router;
