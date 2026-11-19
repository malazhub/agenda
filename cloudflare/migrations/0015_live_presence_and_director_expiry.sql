-- Actual educator-presence heartbeat: old live flags expire automatically.
ALTER TABLE sessions ADD COLUMN live_heartbeat_at TEXT;

CREATE INDEX IF NOT EXISTS sessions_live_heartbeat_idx
  ON sessions(school_id, is_live, live_heartbeat_at);

-- Backfill one-year Director expiry from each account's original joining date.
UPDATE accounts
SET expires_at = datetime(created_at, '+1 year')
WHERE role = 'director'
  AND expires_at IS NULL
  AND id NOT IN (SELECT account_id FROM platform_owners);

UPDATE schools
SET license_expires_at = (
  SELECT accounts.expires_at
  FROM accounts
  WHERE accounts.id = schools.director_id
)
WHERE director_id IS NOT NULL
  AND license_expires_at IS NULL;
