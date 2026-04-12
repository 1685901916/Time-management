import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import db from './database.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import authRoutes from './routes/auth.js';
import entryRoutes from './routes/entries.js';
import goalRoutes from './routes/goals.js';
import todoRoutes from './routes/todos.js';
import uploadRoutes from './routes/upload.js';
import aiProxyRoutes from './routes/aiProxy.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Public routes (no auth)
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/entries', authMiddleware, entryRoutes);
app.use('/api/goals', authMiddleware, goalRoutes);
app.use('/api/todos', authMiddleware, todoRoutes);
app.use('/api/entries', authMiddleware, uploadRoutes);
app.use('/api/ai', authMiddleware, aiProxyRoutes);

// Stats endpoint for MeView
app.get('/api/stats', authMiddleware, (req, res) => {
  const userId = (req as any).user.userId;

  const totalEntries = db.prepare('SELECT COUNT(*) as count FROM time_entries WHERE user_id = ? AND is_archived = 0').get(userId) as any;
  const distinctDays = db.prepare('SELECT COUNT(DISTINCT date) as count FROM time_entries WHERE user_id = ? AND is_archived = 0').get(userId) as any;

  // Calculate record rate for last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fromDate = sevenDaysAgo.toISOString().split('T')[0];

  const recentEntries = db.prepare(
    'SELECT date, SUM(duration_minutes) as total_mins FROM time_entries WHERE user_id = ? AND is_archived = 0 AND date >= ? GROUP BY date'
  ).all(userId, fromDate) as any[];

  const totalRecordedMins = recentEntries.reduce((sum, e) => sum + (e.total_mins || 0), 0);
  const totalPossibleMins = 7 * 24 * 60;
  const recordRate = totalPossibleMins > 0 ? Math.round((totalRecordedMins / totalPossibleMins) * 100) : 0;

  res.json({
    stats: {
      totalEntries: totalEntries.count,
      distinctDays: distinctDays.count,
      recordRate,
    },
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: '文件大小不能超过5MB' });
    return;
  }
  res.status(500).json({ error: '服务器错误' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
