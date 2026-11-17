ALTER TABLE accounts
  ADD COLUMN password_must_change INTEGER NOT NULL DEFAULT 0
  CHECK (password_must_change IN (0, 1));

-- Existing non-owner Directors receive the Owner-entered phone number as
-- their initial password and must replace it after their next sign-in.
UPDATE accounts
SET password_must_change = 1
WHERE role = 'director'
  AND length(trim(COALESCE(phone, ''))) >= 6
  AND id NOT IN (SELECT account_id FROM platform_owners);
