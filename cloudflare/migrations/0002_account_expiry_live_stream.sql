UPDATE accounts
SET expires_at = datetime(created_at, '+1 month')
WHERE expires_at IS NULL;

CREATE TABLE IF NOT EXISTS live_stream_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  input_uid TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
