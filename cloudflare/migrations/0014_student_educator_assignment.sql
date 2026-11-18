ALTER TABLE accounts ADD COLUMN registered_educator_id TEXT;

-- Preserve the educator relationship for existing students. Previously it was
-- inferred indirectly from registered_session_id, which fails for students
-- who selected an educator before that educator received a classroom.
UPDATE accounts
SET registered_educator_id = (
  SELECT educator.id
  FROM accounts AS educator
  WHERE educator.role = 'educator'
    AND educator.school_id = accounts.school_id
    AND educator.registered_session_id = accounts.registered_session_id
  ORDER BY educator.created_at ASC
  LIMIT 1
)
WHERE accounts.role = 'student'
  AND accounts.registered_session_id IS NOT NULL;
