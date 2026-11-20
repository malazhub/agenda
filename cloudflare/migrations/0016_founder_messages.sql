CREATE TABLE IF NOT EXISTS founder_messages (
  id TEXT PRIMARY KEY,
  thread_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'educator', 'director', 'owner')),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 4000),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at TEXT
);

CREATE INDEX IF NOT EXISTS founder_messages_thread_idx
  ON founder_messages(thread_account_id, id);

CREATE INDEX IF NOT EXISTS founder_messages_unread_idx
  ON founder_messages(thread_account_id, read_at, sender_role);
