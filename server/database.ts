import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'itime.db');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    display_name  TEXT    DEFAULT '',
    avatar_url    TEXT    DEFAULT NULL,
    created_at    TEXT    DEFAULT (datetime('now')),
    updated_at    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS time_entries (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL REFERENCES users(id),
    date             TEXT    NOT NULL,
    start_time       TEXT    NOT NULL,
    end_time         TEXT    NOT NULL,
    category         TEXT    NOT NULL,
    note             TEXT    DEFAULT '',
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    is_archived      INTEGER NOT NULL DEFAULT 0,
    linked_todo_id   INTEGER DEFAULT NULL,
    linked_goal_id   INTEGER DEFAULT NULL,
    created_at       TEXT    DEFAULT (datetime('now')),
    updated_at       TEXT    DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_entries_user_date ON time_entries(user_id, date);

  CREATE TABLE IF NOT EXISTS entry_photos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id   INTEGER NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
    file_path  TEXT    NOT NULL,
    caption    TEXT    DEFAULT '',
    file_size  INTEGER DEFAULT 0,
    mime_type  TEXT    DEFAULT 'image/jpeg',
    created_at TEXT    DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_photos_entry ON entry_photos(entry_id);

  CREATE TABLE IF NOT EXISTS goals (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    title       TEXT    NOT NULL,
    subtitle    TEXT    DEFAULT '',
    category    TEXT    NOT NULL,
    color       TEXT    DEFAULT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    DEFAULT (datetime('now')),
    updated_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    name        TEXT    NOT NULL,
    color       TEXT    NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    DEFAULT (datetime('now')),
    updated_at  TEXT    DEFAULT (datetime('now')),
    UNIQUE(user_id, name)
  );

  CREATE TABLE IF NOT EXISTS daily_reviews (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    date       TEXT    NOT NULL,
    content    TEXT    NOT NULL DEFAULT '',
    created_at TEXT    DEFAULT (datetime('now')),
    updated_at TEXT    DEFAULT (datetime('now')),
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS todos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    title       TEXT    NOT NULL,
    note        TEXT    DEFAULT '',
    completed   INTEGER NOT NULL DEFAULT 0,
    quadrant    TEXT    NOT NULL DEFAULT '重要且紧急',
    date        TEXT    DEFAULT NULL,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    DEFAULT (datetime('now')),
    updated_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS active_timers (
    user_id    INTEGER PRIMARY KEY REFERENCES users(id),
    goal_data  TEXT    NOT NULL,
    started_at INTEGER NOT NULL,
    note       TEXT    DEFAULT '',
    updated_at TEXT    DEFAULT (datetime('now'))
  );
`);

const safeExec = (sql: string) => {
  try {
    db.exec(sql);
  } catch {
    // Ignore repeated migrations.
  }
};

safeExec(`ALTER TABLE time_entries ADD COLUMN linked_todo_id INTEGER DEFAULT NULL`);
safeExec(`ALTER TABLE time_entries ADD COLUMN linked_goal_id INTEGER DEFAULT NULL`);
safeExec(`ALTER TABLE goals ADD COLUMN color TEXT DEFAULT NULL`);
safeExec(`ALTER TABLE goals ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`);

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

const userRows = db.prepare('SELECT id FROM users').all() as Array<{ id: number }>;
const insertCategory = db.prepare(
  `INSERT OR IGNORE INTO categories (user_id, name, color, sort_order)
   VALUES (?, ?, ?, ?)`
);

for (const user of userRows) {
  defaultCategories.forEach(([name, color], index) => {
    insertCategory.run(user.id, name, color, index + 1);
  });

  const customRows = db
    .prepare(
      `SELECT category AS name, MIN(COALESCE(color, '')) AS color
       FROM goals
       WHERE user_id = ? AND category IS NOT NULL AND category != '' AND category != '未记录'
       GROUP BY category`
    )
    .all(user.id) as Array<{ name: string; color: string }>;

  customRows.forEach((row, index) => {
    insertCategory.run(
      user.id,
      row.name,
      row.color || defaultCategories[index % defaultCategories.length][1],
      defaultCategories.length + index + 1
    );
  });
}

db.prepare(`
  UPDATE goals
  SET category = CASE category
    WHEN '瀛︿範' THEN '学习'
    WHEN '鐫¤' THEN '睡觉'
    WHEN '鍒锋墜鏈�' THEN '刷手机'
    WHEN '鍒锋墜鏈?' THEN '刷手机'
    WHEN '娓告垙' THEN '游戏'
    WHEN '淇℃伅宸ヤ綔' THEN '工作'
    WHEN '信息工作' THEN '工作'
    WHEN '鎴峰' THEN '户外'
    WHEN '鍐欑瑪璁�' THEN '写笔记'
    WHEN '鍐欑瑪璁?' THEN '写笔记'
    WHEN '浼戞伅' THEN '休息'
    WHEN '鐞愪簨' THEN '未记录'
    WHEN '杩愬姩' THEN '运动'
    WHEN '�˶�' THEN '运动'
    WHEN '鏈褰�' THEN '未记录'
    WHEN '鏈褰?' THEN '未记录'
    ELSE category
  END
  WHERE category IN (
    '瀛︿範','鐫欒','鐫¤','鍒锋墜鏈�','鍒锋墜鏈?','娓告垙','淇℃伅宸ヤ綔','信息工作',
    '鎴峰','鍐欑瑪璁�','鍐欑瑪璁?','浼戞伅','鐞愪簨','杩愬姩','�˶�','鏈褰�','鏈褰?'
  )
`).run();

db.prepare(`
  UPDATE goals
  SET category = '工作'
  WHERE title = '工作' AND category = '信息工作'
`).run();

db.prepare(`
  UPDATE goals
  SET category = '信息'
  WHERE title = '信息' AND category = '未记录'
`).run();

db.prepare(`
  UPDATE goals
  SET category = '未记录'
  WHERE title = '琐事' AND category = '琐事'
`).run();

db.prepare(`
  UPDATE time_entries
  SET category = CASE category
    WHEN '淇℃伅宸ヤ綔' THEN '工作'
    WHEN '信息工作' THEN '工作'
    WHEN '鐞愪簨' THEN '未记录'
    ELSE category
  END
  WHERE category IN ('淇℃伅宸ヤ綔', '信息工作', '鐞愪簨')
`).run();

db.prepare(`
  UPDATE time_entries
  SET category = (
    SELECT category
    FROM goals
    WHERE goals.id = time_entries.linked_goal_id
  )
  WHERE linked_goal_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM goals
      WHERE goals.id = time_entries.linked_goal_id
        AND goals.category IS NOT NULL
    )
`).run();

db.prepare(`
  UPDATE todos
  SET quadrant = CASE quadrant
    WHEN '閲嶈涓旂揣鎬�' THEN '重要且紧急'
    WHEN '閲嶈涓旂揣鎬?' THEN '重要且紧急'
    WHEN '閲嶈涓嶇揣鎬�' THEN '重要不紧急'
    WHEN '閲嶈涓嶇揣鎬?' THEN '重要不紧急'
    WHEN '涓嶉噸瑕佷絾绱ф€�' THEN '不重要但紧急'
    WHEN '涓嶉噸瑕佷絾绱ф€?' THEN '不重要但紧急'
    WHEN '涓嶉噸瑕佷笉绱ф€�' THEN '不重要不紧急'
    WHEN '涓嶉噸瑕佷笉绱ф€?' THEN '不重要不紧急'
    ELSE quadrant
  END
  WHERE quadrant IN (
    '閲嶈涓旂揣鎬�','閲嶈涓旂揣鎬?','閲嶈涓嶇揣鎬�','閲嶈涓嶇揣鎬?',
    '涓嶉噸瑕佷絾绱ф€�','涓嶉噸瑕佷絾绱ф€?','涓嶉噸瑕佷笉绱ф€�','涓嶉噸瑕佷笉绱ф€?'
  )
`).run();

db.prepare(`
  UPDATE goals
  SET sort_order = id
  WHERE sort_order = 0
`).run();

export default db;
