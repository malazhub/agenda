-- Normalize educator1 to the same account, classroom, student-link and
-- saved-lesson structure as educator2 and educator3.
-- This also repairs the empty lesson placeholders created by migration 0006.
-- Those placeholders conflict with INSERT OR IGNORE on UNIQUE(educator_id, slot),
-- so the test lessons must be written into the existing rows.

INSERT OR IGNORE INTO sessions
(id, school_id, grade_id, subject, title, teacher_name, source_name, source_url, playback_url, media_key, is_live, live_starts_at)
VALUES
('agenda-test-session-educator1','default-agenda-school','class_bach1','Math','Bach1','Maya Khoury','Maya Khoury','https://agenda.live/room/class_bach1','https://agenda.live/room/class_bach1',NULL,0,NULL);

UPDATE sessions
SET school_id = 'default-agenda-school',
    grade_id = 'class_bach1',
    subject = 'Math',
    title = 'Bach1',
    teacher_name = 'Maya Khoury',
    source_name = 'Maya Khoury',
    source_url = 'https://agenda.live/room/class_bach1',
    playback_url = 'https://agenda.live/room/class_bach1'
WHERE id = 'agenda-test-session-educator1';

UPDATE accounts
SET full_name = 'Maya Khoury',
    school_or_subject = 'Math',
    grade_id = 'class_bach1',
    registered_session_id = 'agenda-test-session-educator1',
    activated = 1
WHERE username = 'educator1' COLLATE NOCASE
  AND role = 'educator'
  AND school_id = 'default-agenda-school';

-- Populate any existing empty lesson placeholders for educator1. Keep existing
-- non-empty lesson content and media intact.
UPDATE educator_lessons
SET title = CASE slot
      WHEN 1 THEN 'Common Test 1 – Algebraic Expressions'
      WHEN 2 THEN 'Common Test 2 – Linear Equations'
      WHEN 3 THEN 'Common Test 3 – Functions and Graphs'
      WHEN 4 THEN 'Common Test 4 – Quadratic Basics'
      WHEN 5 THEN 'Common Test 5 – Geometry and Trigonometry'
    END,
    subject = 'Math',
    description = CASE slot
      WHEN 1 THEN 'Simplify: 3x + 2x; evaluate 2a + 5 when a = 3; expand 2(x + 4); factor 6x + 12; find the coefficient of y in 7y - 2. Answer key: 5x; 11; 2x + 8; 6(x + 2); 7.'
      WHEN 2 THEN 'Solve: x + 7 = 15; 3x = 21; 2x - 5 = 9; 4(x + 1) = 20; x/3 + 2 = 6. Answer key: 8; 7; 7; 4; 12.'
      WHEN 3 THEN 'For f(x) = 2x + 1, find f(0), f(3), and x when f(x)=9. State the slope and y-intercept. Answer key: 1; 7; 4; slope 2; intercept 1.'
      WHEN 4 THEN 'Solve x² = 25; factor x² + 5x + 6; find the roots of x² - 9 = 0; calculate the discriminant of x² - 4x + 3. Answer key: x=±5; (x+2)(x+3); x=±3; Δ=4.'
      WHEN 5 THEN 'Find the angles in a triangle with two angles 50° and 60°; area of a 6-by-4 rectangle; circumference of a circle of radius 3; sin 30°; Pythagoras hypotenuse for legs 3 and 4. Answer key: 70°; 24; 6π; 1/2; 5.'
    END,
    updated_at = datetime('now')
WHERE school_id = 'default-agenda-school'
  AND educator_id = (
    SELECT id FROM accounts
    WHERE username = 'educator1' COLLATE NOCASE
      AND role = 'educator'
      AND school_id = 'default-agenda-school'
    LIMIT 1
  )
  AND slot BETWEEN 1 AND 5
  AND (
    TRIM(COALESCE(title, '')) = ''
    OR TRIM(COALESCE(subject, '')) = ''
    OR TRIM(COALESCE(description, '')) = ''
  );

-- Insert a lesson only when the educator genuinely has no row for that slot.
INSERT OR IGNORE INTO educator_lessons
(id, school_id, educator_id, slot, title, subject, description)
SELECT
  'agenda-test-educator1-lesson-' || slots.slot,
  'default-agenda-school',
  educator.id,
  slots.slot,
  CASE slots.slot
    WHEN 1 THEN 'Common Test 1 – Algebraic Expressions'
    WHEN 2 THEN 'Common Test 2 – Linear Equations'
    WHEN 3 THEN 'Common Test 3 – Functions and Graphs'
    WHEN 4 THEN 'Common Test 4 – Quadratic Basics'
    ELSE 'Common Test 5 – Geometry and Trigonometry'
  END,
  'Math',
  CASE slots.slot
    WHEN 1 THEN 'Simplify: 3x + 2x; evaluate 2a + 5 when a = 3; expand 2(x + 4); factor 6x + 12; find the coefficient of y in 7y - 2. Answer key: 5x; 11; 2x + 8; 6(x + 2); 7.'
    WHEN 2 THEN 'Solve: x + 7 = 15; 3x = 21; 2x - 5 = 9; 4(x + 1) = 20; x/3 + 2 = 6. Answer key: 8; 7; 7; 4; 12.'
    WHEN 3 THEN 'For f(x) = 2x + 1, find f(0), f(3), and x when f(x)=9. State the slope and y-intercept. Answer key: 1; 7; 4; slope 2; intercept 1.'
    WHEN 4 THEN 'Solve x² = 25; factor x² + 5x + 6; find the roots of x² - 9 = 0; calculate the discriminant of x² - 4x + 3. Answer key: x=±5; (x+2)(x+3); x=±3; Δ=4.'
    ELSE 'Find the angles in a triangle with two angles 50° and 60°; area of a 6-by-4 rectangle; circumference of a circle of radius 3; sin 30°; Pythagoras hypotenuse for legs 3 and 4. Answer key: 70°; 24; 6π; 1/2; 5.'
  END
FROM accounts educator
CROSS JOIN (
  SELECT 1 AS slot UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
) slots
WHERE educator.username = 'educator1' COLLATE NOCASE
  AND educator.role = 'educator'
  AND educator.school_id = 'default-agenda-school';

-- Reconnect the three matching students to the same educator account and class.
UPDATE accounts
SET registered_educator_id = (
      SELECT id FROM accounts
      WHERE username = 'educator1' COLLATE NOCASE
        AND role = 'educator'
        AND school_id = 'default-agenda-school'
      LIMIT 1
    ),
    registered_session_id = 'agenda-test-session-educator1',
    school_or_subject = 'Math',
    grade_id = 'class_bach1',
    student_grade_label = 'Bach1'
WHERE username IN ('student1', 'student2', 'student3') COLLATE NOCASE
  AND role = 'student'
  AND school_id = 'default-agenda-school';
