CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'educator', 'director')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  school_or_subject TEXT NOT NULL DEFAULT '',
  grade_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT,
  activated INTEGER NOT NULL DEFAULT 1 CHECK (activated IN (0, 1)),
  paid INTEGER NOT NULL DEFAULT 0 CHECK (paid IN (0, 1))
);

CREATE INDEX IF NOT EXISTS accounts_role_created_idx
  ON accounts(role, created_at DESC);

CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL COLLATE NOCASE,
  succeeded INTEGER NOT NULL CHECK (succeeded IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS login_attempts_username_created_idx
  ON login_attempts(username, created_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  grade_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  teacher_name TEXT NOT NULL DEFAULT '',
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  playback_url TEXT,
  media_key TEXT,
  is_live INTEGER NOT NULL DEFAULT 0 CHECK (is_live IN (0, 1)),
  live_starts_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS sessions_grade_live_idx
  ON sessions(grade_id, is_live);
