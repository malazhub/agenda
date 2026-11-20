CREATE TABLE IF NOT EXISTS founder_guest_messages (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('guest','owner')),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 4000),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS founder_guest_messages_thread_idx
  ON founder_guest_messages(guest_id, created_at, id);
