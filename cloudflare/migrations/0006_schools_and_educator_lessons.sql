CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO schools (id, name)
VALUES ('default-agenda-school', 'Agenda');

ALTER TABLE accounts ADD COLUMN school_id TEXT;
ALTER TABLE sessions ADD COLUMN school_id TEXT;

UPDATE accounts
SET school_id = 'default-agenda-school'
WHERE school_id IS NULL OR school_id = '';

UPDATE sessions
SET school_id = 'default-agenda-school'
WHERE school_id IS NULL OR school_id = '';

CREATE UNIQUE INDEX IF NOT EXISTS schools_name_unique_idx
  ON schools(name COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS accounts_school_role_idx
  ON accounts(school_id, role, created_at DESC);

CREATE INDEX IF NOT EXISTS sessions_school_grade_idx
  ON sessions(school_id, grade_id, is_live);

CREATE TABLE IF NOT EXISTS educator_lessons (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  educator_id TEXT NOT NULL,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 10),
  title TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  media_key TEXT,
  media_name TEXT,
  media_type TEXT,
  media_size INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (educator_id, slot)
);

CREATE INDEX IF NOT EXISTS educator_lessons_owner_idx
  ON educator_lessons(school_id, educator_id, slot);

WITH RECURSIVE lesson_slots(slot) AS (
  VALUES (1)
  UNION ALL
  SELECT slot + 1
  FROM lesson_slots
  WHERE slot < 10
)
INSERT OR IGNORE INTO educator_lessons (
  id,
  school_id,
  educator_id,
  slot
)
SELECT
  lower(hex(randomblob(16))),
  accounts.school_id,
  accounts.id,
  lesson_slots.slot
FROM accounts
CROSS JOIN lesson_slots
WHERE accounts.role = 'educator';

-- Remove old sample catalogue entries, but preserve any session
-- currently assigned to a real educator.
DELETE FROM sessions
WHERE (
    id LIKE 'curriculum-%'
    OR id LIKE 'ka-%'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM accounts
    WHERE accounts.registered_session_id = sessions.id
      AND accounts.role = 'educator'
  );
