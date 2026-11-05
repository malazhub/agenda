ALTER TABLE accounts
ADD COLUMN registered_session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL;
