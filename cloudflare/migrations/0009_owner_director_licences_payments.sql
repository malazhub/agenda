-- Owner account mapping and independent one-year Director school licences.
ALTER TABLE schools ADD COLUMN license_expires_at TEXT;
ALTER TABLE schools ADD COLUMN license_active INTEGER NOT NULL DEFAULT 1 CHECK (license_active IN (0, 1));
ALTER TABLE schools ADD COLUMN payment_method TEXT;
ALTER TABLE schools ADD COLUMN payment_value TEXT;

CREATE TABLE IF NOT EXISTS platform_owners (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The existing malaz account is designated as the platform Owner without
-- storing or changing its password. Login still verifies its existing hash.
INSERT OR IGNORE INTO platform_owners (account_id)
SELECT id FROM accounts WHERE username = 'malaz' COLLATE NOCASE LIMIT 1;

-- Directors receive a one-year term; student/educator one-month expiry is untouched.
UPDATE accounts
SET expires_at = datetime(created_at, '+1 year')
WHERE role = 'director'
  AND id NOT IN (SELECT account_id FROM platform_owners);

UPDATE schools
SET license_expires_at = (
  SELECT accounts.expires_at FROM accounts
  WHERE accounts.id = schools.director_id
)
WHERE director_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS platform_owners_account_idx ON platform_owners(account_id);

-- Keep the existing platform-owner payment link only on the original default school.
-- Other Director schools must be assigned their own destination by the Owner.
UPDATE schools
SET payment_method = 'suyool',
    payment_value = 'https://payments.suyool.com/qr/p585_malazjanbeih'
WHERE id = 'default-agenda-school'
  AND payment_method IS NULL;
