CREATE TABLE IF NOT EXISTS app_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO app_settings (setting_key, setting_value)
VALUES (
  'active_school_id',
  COALESCE(
    (SELECT school_id FROM accounts WHERE role = 'director' AND school_id IS NOT NULL ORDER BY created_at LIMIT 1),
    'default-agenda-school'
  )
);
