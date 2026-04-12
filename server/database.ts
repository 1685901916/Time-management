import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'itime.db');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

// Ensure directories exist
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
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
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    DEFAULT (datetime('now')),
    updated_at  TEXT    DEFAULT (datetime('now'))
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
`);

// Migrations for existing databases
try {
  db.exec(`ALTER TABLE time_entries ADD COLUMN linked_todo_id INTEGER DEFAULT NULL`);
} catch (_) { /* column already exists */ }
try {
  db.exec(`ALTER TABLE time_entries ADD COLUMN linked_goal_id INTEGER DEFAULT NULL`);
} catch (_) { /* column already exists */ }

export default db;
