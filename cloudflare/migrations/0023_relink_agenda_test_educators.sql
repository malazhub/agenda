-- Repair test educator records by username rather than assuming a generated account ID.
-- This safely reconnects classrooms, saved lessons, and student assignments
-- even when an educator account existed before the test-data migration.

INSERT OR IGNORE INTO sessions
(id, school_id, grade_id, subject, title, teacher_name, source_name, source_url, playback_url, media_key, is_live, live_starts_at)
VALUES
('agenda-test-session-educator1','default-agenda-school','class_bach1','Math','Bach1','Maya Khoury','Maya Khoury','https://agenda.live/room/class_bach1','https://agenda.live/room/class_bach1',NULL,0,NULL),
('agenda-test-session-educator2','default-agenda-school','class_second','Physics','Second','Daniel Haddad','Daniel Haddad','https://agenda.live/room/class_second','https://agenda.live/room/class_second',NULL,0,NULL),
('agenda-test-session-educator3','default-agenda-school','class_grade7','Biology','Grade 7','Lina Nassar','Lina Nassar','https://agenda.live/room/class_grade7','https://agenda.live/room/class_grade7',NULL,0,NULL);

UPDATE accounts
SET full_name = 'Maya Khoury',
    school_or_subject = 'Math',
    grade_id = 'class_bach1',
    registered_session_id = 'agenda-test-session-educator1',
    activated = 1
WHERE username = 'educator1' COLLATE NOCASE
  AND role = 'educator'
  AND school_id = 'default-agenda-school';

UPDATE accounts
SET full_name = 'Daniel Haddad',
    school_or_subject = 'Physics',
    grade_id = 'class_second',
    registered_session_id = 'agenda-test-session-educator2',
    activated = 1
WHERE username = 'educator2' COLLATE NOCASE
  AND role = 'educator'
  AND school_id = 'default-agenda-school';

UPDATE accounts
SET full_name = 'Lina Nassar',
    school_or_subject = 'Biology',
    grade_id = 'class_grade7',
    registered_session_id = 'agenda-test-session-educator3',
    activated = 1
WHERE username = 'educator3' COLLATE NOCASE
  AND role = 'educator'
  AND school_id = 'default-agenda-school';

-- Move any previously seeded lesson slots from synthetic IDs to the actual
-- account IDs associated with the usernames.
UPDATE educator_lessons
SET educator_id = (SELECT id FROM accounts WHERE username = 'educator1' COLLATE NOCASE AND role = 'educator' AND school_id = 'default-agenda-school')
WHERE school_id = 'default-agenda-school'
  AND educator_id = 'agenda-test-educator-1'
  AND EXISTS (SELECT 1 FROM accounts WHERE username = 'educator1' COLLATE NOCASE AND role = 'educator' AND school_id = 'default-agenda-school');

UPDATE educator_lessons
SET educator_id = (SELECT id FROM accounts WHERE username = 'educator2' COLLATE NOCASE AND role = 'educator' AND school_id = 'default-agenda-school')
WHERE school_id = 'default-agenda-school'
  AND educator_id = 'agenda-test-educator-2'
  AND EXISTS (SELECT 1 FROM accounts WHERE username = 'educator2' COLLATE NOCASE AND role = 'educator' AND school_id = 'default-agenda-school');

UPDATE educator_lessons
SET educator_id = (SELECT id FROM accounts WHERE username = 'educator3' COLLATE NOCASE AND role = 'educator' AND school_id = 'default-agenda-school')
WHERE school_id = 'default-agenda-school'
  AND educator_id = 'agenda-test-educator-3'
  AND EXISTS (SELECT 1 FROM accounts WHERE username = 'educator3' COLLATE NOCASE AND role = 'educator' AND school_id = 'default-agenda-school');

-- Recreate all five lesson slots per educator against the real account IDs.
INSERT OR IGNORE INTO educator_lessons (id, school_id, educator_id, slot, title, subject, description)
SELECT 'agenda-test-educator1-lesson-' || slots.slot, 'default-agenda-school', a.id, slots.slot,
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
FROM accounts a
CROSS JOIN (SELECT 1 AS slot UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) slots
WHERE a.username = 'educator1' COLLATE NOCASE AND a.role = 'educator' AND a.school_id = 'default-agenda-school';

INSERT OR IGNORE INTO educator_lessons (id, school_id, educator_id, slot, title, subject, description)
SELECT 'agenda-test-educator2-lesson-' || slots.slot, 'default-agenda-school', a.id, slots.slot,
       CASE slots.slot
         WHEN 1 THEN 'Common Test 1 – Motion and Speed'
         WHEN 2 THEN 'Common Test 2 – Forces'
         WHEN 3 THEN 'Common Test 3 – Work, Energy and Power'
         WHEN 4 THEN 'Common Test 4 – Electricity'
         ELSE 'Common Test 5 – Waves and Sound'
       END,
       'Physics',
       CASE slots.slot
         WHEN 1 THEN 'A car travels 120 km in 2 h. Find its average speed. Convert 3.5 h to minutes. A runner covers 400 m in 80 s. Find speed. Define displacement. Answer key: 60 km/h; 210 min; 5 m/s; change in position with direction.'
         WHEN 2 THEN 'Find the weight of a 5 kg object using g = 10 N/kg. State the SI unit of force. What is the resultant force when 8 N right and 3 N left act together? State Newton''s first law. Answer key: 50 N; newton; 5 N right; an object maintains its state unless acted on by a resultant force.'
         WHEN 3 THEN 'Calculate work when a 10 N force moves an object 3 m in its direction. Find kinetic energy for m=2 kg and v=3 m/s. Define power. Answer key: 30 J; 9 J; work done per unit time.'
         WHEN 4 THEN 'A 6 V battery is connected to a 3 Ω resistor. Find current. State the unit of resistance. Name the device used to measure current. Answer key: 2 A; ohm; ammeter.'
         ELSE 'Define frequency. Find the period of a 5 Hz wave. Can sound travel through a vacuum? Name the unit of frequency. Answer key: number of cycles per second; 0.2 s; no; hertz.'
       END
FROM accounts a
CROSS JOIN (SELECT 1 AS slot UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) slots
WHERE a.username = 'educator2' COLLATE NOCASE AND a.role = 'educator' AND a.school_id = 'default-agenda-school';

INSERT OR IGNORE INTO educator_lessons (id, school_id, educator_id, slot, title, subject, description)
SELECT 'agenda-test-educator3-lesson-' || slots.slot, 'default-agenda-school', a.id, slots.slot,
       CASE slots.slot
         WHEN 1 THEN 'Common Test 1 – Cells'
         WHEN 2 THEN 'Common Test 2 – Human Digestion'
         WHEN 3 THEN 'Common Test 3 – Plants'
         WHEN 4 THEN 'Common Test 4 – Ecosystems'
         ELSE 'Common Test 5 – Human Body Systems'
       END,
       'Biology',
       CASE slots.slot
         WHEN 1 THEN 'Name the basic unit of life. Which cell part controls activities? Which structure contains genetic material? Name the jelly-like material inside a cell. Answer key: cell; nucleus; nucleus; cytoplasm.'
         WHEN 2 THEN 'Where does digestion begin? Which organ produces bile? Where are most nutrients absorbed? What is the role of the stomach? Answer key: mouth; liver; small intestine; mixes food and begins protein digestion.'
         WHEN 3 THEN 'Name the process by which plants make food. Which gas is absorbed? Which plant part absorbs most water? What is the role of leaves? Answer key: photosynthesis; carbon dioxide; roots; capture light and exchange gases.'
         WHEN 4 THEN 'Define producer. Give one example of a consumer. What do decomposers do? In a grass-rabbit-fox chain, identify the primary consumer. Answer key: organism that makes its own food; rabbit; break down dead matter and recycle nutrients; rabbit.'
         ELSE 'Which organ pumps blood? Which organs exchange oxygen and carbon dioxide? What is the main role of the skeleton? Name the system that breaks down food. Answer key: heart; lungs; support and protection; digestive system.'
       END
FROM accounts a
CROSS JOIN (SELECT 1 AS slot UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) slots
WHERE a.username = 'educator3' COLLATE NOCASE AND a.role = 'educator' AND a.school_id = 'default-agenda-school';

-- Reattach the nine sample students to the matching educator and classroom.
UPDATE accounts
SET registered_educator_id = (SELECT id FROM accounts WHERE username = 'educator1' COLLATE NOCASE AND role = 'educator' AND school_id = 'default-agenda-school'),
    registered_session_id = 'agenda-test-session-educator1',
    school_or_subject = 'Math',
    grade_id = 'class_bach1',
    student_grade_label = 'Bach1'
WHERE username IN ('student1','student2','student3') COLLATE NOCASE
  AND role = 'student' AND school_id = 'default-agenda-school';

UPDATE accounts
SET registered_educator_id = (SELECT id FROM accounts WHERE username = 'educator2' COLLATE NOCASE AND role = 'educator' AND school_id = 'default-agenda-school'),
    registered_session_id = 'agenda-test-session-educator2',
    school_or_subject = 'Physics',
    grade_id = 'class_second',
    student_grade_label = 'Second'
WHERE username IN ('student4','student5','student6') COLLATE NOCASE
  AND role = 'student' AND school_id = 'default-agenda-school';

UPDATE accounts
SET registered_educator_id = (SELECT id FROM accounts WHERE username = 'educator3' COLLATE NOCASE AND role = 'educator' AND school_id = 'default-agenda-school'),
    registered_session_id = 'agenda-test-session-educator3',
    school_or_subject = 'Biology',
    grade_id = 'class_grade7',
    student_grade_label = 'Grade 7'
WHERE username IN ('student7','student8','student9') COLLATE NOCASE
  AND role = 'student' AND school_id = 'default-agenda-school';

-- Keep the sample accounts unpaid; activation remains enabled for test visibility.
UPDATE accounts
SET paid = 0
WHERE username IN ('educator1','educator2','educator3','student1','student2','student3','student4','student5','student6','student7','student8','student9')
  AND school_id = 'default-agenda-school';
