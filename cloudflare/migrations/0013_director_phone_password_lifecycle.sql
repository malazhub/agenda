ALTER TABLE accounts ADD COLUMN phone_password_disabled_at TEXT;

-- Phone stays valid as the temporary first credential until the Director
-- explicitly saves a personal password or the Owner resets it again.
UPDATE accounts
SET phone_password_disabled_at = NULL
WHERE role = 'director'
  AND id NOT IN (SELECT account_id FROM platform_owners);
