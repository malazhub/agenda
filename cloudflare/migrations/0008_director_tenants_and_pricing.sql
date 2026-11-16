-- Give every Director a distinct, immutable school tenant.
ALTER TABLE schools ADD COLUMN director_id TEXT;

-- Keep the existing default school with its first Director.
UPDATE schools
SET director_id = (
  SELECT accounts.id
  FROM accounts
  WHERE accounts.role = 'director'
    AND accounts.school_id = schools.id
  ORDER BY accounts.created_at, accounts.id
  LIMIT 1
)
WHERE director_id IS NULL;

-- If legacy Director accounts shared one school, split the Director accounts
-- into independent school tenants. Existing non-Director accounts remain with
-- the original school because their previous ownership cannot be inferred.
INSERT INTO schools (id, name, director_id)
SELECT
  'school-' || accounts.id,
  'School - ' || accounts.username,
  accounts.id
FROM accounts
WHERE accounts.role = 'director'
  AND NOT EXISTS (
    SELECT 1 FROM schools WHERE schools.director_id = accounts.id
  );

UPDATE accounts
SET school_id = (
  SELECT schools.id FROM schools WHERE schools.director_id = accounts.id
)
WHERE role = 'director'
  AND EXISTS (
    SELECT 1 FROM schools WHERE schools.director_id = accounts.id
  );

CREATE UNIQUE INDEX IF NOT EXISTS schools_director_unique_idx
  ON schools(director_id)
  WHERE director_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS school_grade_pricing (
  school_id TEXT NOT NULL,
  grade_id TEXT NOT NULL,
  monthly_rate_usd REAL NOT NULL DEFAULT 125
    CHECK (monthly_rate_usd >= 0 AND monthly_rate_usd <= 1000000),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (school_id, grade_id)
);

CREATE INDEX IF NOT EXISTS school_grade_pricing_school_idx
  ON school_grade_pricing(school_id, grade_id);
