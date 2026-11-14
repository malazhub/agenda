
CREATE TABLE IF NOT EXISTS classroom_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  educator_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 2000),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS classroom_messages_pair_idx
  ON classroom_messages (
    session_id,
    educator_id,
    student_id,
    id
  );
