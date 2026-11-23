-- Test accounts are active for classroom testing but are not marked as paid.
UPDATE accounts
SET paid = 0
WHERE id IN (
  'agenda-test-educator-1',
  'agenda-test-educator-2',
  'agenda-test-educator-3',
  'agenda-test-student-1',
  'agenda-test-student-2',
  'agenda-test-student-3',
  'agenda-test-student-4',
  'agenda-test-student-5',
  'agenda-test-student-6',
  'agenda-test-student-7',
  'agenda-test-student-8',
  'agenda-test-student-9'
)
AND school_id = 'default-agenda-school';
