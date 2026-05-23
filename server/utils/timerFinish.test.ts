import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { finishActiveTimerTransaction } from './timerFinish.js';

function createDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT
    );

    CREATE TABLE time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      category TEXT NOT NULL,
      note TEXT DEFAULT '',
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      linked_goal_id INTEGER DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE active_timers (
      user_id INTEGER PRIMARY KEY,
      goal_data TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      note TEXT DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  return db;
}

test('finishActiveTimerTransaction creates one entry and clears active timer atomically', () => {
  const db = createDb();
  const startedAt = new Date('2026-05-23T08:10:00+08:00').getTime();
  const endedAt = new Date('2026-05-23T09:45:00+08:00').getTime();

  db.prepare('INSERT INTO users (id) VALUES (1)').run();
  db.prepare('INSERT INTO active_timers (user_id, goal_data, started_at, note) VALUES (?, ?, ?, ?)').run(
    1,
    JSON.stringify({ id: '7', title: '深度工作', category: '工作' }),
    startedAt,
    '完成接口测试'
  );

  const result = finishActiveTimerTransaction(db, 1, endedAt);

  assert.equal(result.created, true);
  assert.equal(result.entry?.category, '工作');
  assert.equal(result.entry?.durationMinutes, 95);
  assert.equal(result.entry?.linkedGoalId, '7');
  assert.equal((db.prepare('SELECT COUNT(*) AS count FROM active_timers').get() as { count: number }).count, 0);
  assert.equal((db.prepare('SELECT COUNT(*) AS count FROM time_entries').get() as { count: number }).count, 1);
});

test('finishActiveTimerTransaction is idempotent after the timer is already cleared', () => {
  const db = createDb();
  db.prepare('INSERT INTO users (id) VALUES (1)').run();

  const result = finishActiveTimerTransaction(db, 1, Date.now());

  assert.equal(result.created, false);
  assert.equal(result.entry, null);
  assert.equal((db.prepare('SELECT COUNT(*) AS count FROM time_entries').get() as { count: number }).count, 0);
});
