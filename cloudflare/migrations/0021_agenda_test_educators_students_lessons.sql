-- Test-only Agenda dataset: 3 educators, 9 students, and 15 saved common tests.
-- All test accounts are activated in the existing Agenda school.
-- Passwords are stored using the same PBKDF2-SHA256 format as the live API.

INSERT OR IGNORE INTO accounts
(id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, expires_at, activated, paid, school_id, registered_session_id, registered_educator_id, student_grade_label, password_must_change)
VALUES
('agenda-test-educator-1','educator1','pbkdf2_sha256$100000$Dm1KdRqY9IxWGuhXncw4Ww$5dhQIY71zSe-7xI9HcIbGAPP9Ny_51pnUnoLXCFO11s','educator','Maya Khoury','educator1@agenda.test','','Math','class_bach1',datetime('now','+1 year'),1,1,'default-agenda-school',NULL,NULL,'',0);

INSERT OR IGNORE INTO accounts
(id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, expires_at, activated, paid, school_id, registered_session_id, registered_educator_id, student_grade_label, password_must_change)
VALUES
('agenda-test-educator-2','educator2','pbkdf2_sha256$100000$hLNfqHLyiDM6yuPQX9ukUg$aXqShVIGFh-9_ersMm912nIZEhwgc7n5Y5V0lUcqlLk','educator','Daniel Haddad','educator2@agenda.test','','Physics','class_second',datetime('now','+1 year'),1,1,'default-agenda-school',NULL,NULL,'',0);

INSERT OR IGNORE INTO accounts
(id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, expires_at, activated, paid, school_id, registered_session_id, registered_educator_id, student_grade_label, password_must_change)
VALUES
('agenda-test-educator-3','educator3','pbkdf2_sha256$100000$p_r2SAUEEmZFGK-D9mlcPw$6DHDziRsXhoPUYD15p6GlSx_o4ip14fnhOXlPjY5RCg','educator','Lina Nassar','educator3@agenda.test','','Biology','class_grade7',datetime('now','+1 year'),1,1,'default-agenda-school',NULL,NULL,'',0);

INSERT OR IGNORE INTO sessions
(id, school_id, grade_id, subject, title, teacher_name, source_name, source_url, playback_url, media_key, is_live, live_starts_at)
VALUES
('agenda-test-session-educator1','default-agenda-school','class_bach1','Math','Bach1','Maya Khoury','Maya Khoury','https://agenda.live/room/class_bach1','https://agenda.live/room/class_bach1',NULL,0,NULL);

UPDATE accounts
SET registered_session_id='agenda-test-session-educator1', school_or_subject='Math', grade_id='class_bach1', activated=1, paid=1
WHERE id='agenda-test-educator-1' AND role='educator' AND school_id='default-agenda-school';

INSERT OR IGNORE INTO sessions
(id, school_id, grade_id, subject, title, teacher_name, source_name, source_url, playback_url, media_key, is_live, live_starts_at)
VALUES
('agenda-test-session-educator2','default-agenda-school','class_second','Physics','Second','Daniel Haddad','Daniel Haddad','https://agenda.live/room/class_second','https://agenda.live/room/class_second',NULL,0,NULL);

UPDATE accounts
SET registered_session_id='agenda-test-session-educator2', school_or_subject='Physics', grade_id='class_second', activated=1, paid=1
WHERE id='agenda-test-educator-2' AND role='educator' AND school_id='default-agenda-school';

INSERT OR IGNORE INTO sessions
(id, school_id, grade_id, subject, title, teacher_name, source_name, source_url, playback_url, media_key, is_live, live_starts_at)
VALUES
('agenda-test-session-educator3','default-agenda-school','class_grade7','Biology','Grade 7','Lina Nassar','Lina Nassar','https://agenda.live/room/class_grade7','https://agenda.live/room/class_grade7',NULL,0,NULL);

UPDATE accounts
SET registered_session_id='agenda-test-session-educator3', school_or_subject='Biology', grade_id='class_grade7', activated=1, paid=1
WHERE id='agenda-test-educator-3' AND role='educator' AND school_id='default-agenda-school';

INSERT OR IGNORE INTO accounts
(id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, expires_at, activated, paid, school_id, registered_session_id, registered_educator_id, student_grade_label, password_must_change)
VALUES
('agenda-test-student-1','student1','pbkdf2_sha256$100000$LPQ9CyeSl1A8vUREUxWbWg$5XSBTyhOa2Zgz90FnKt8aM0Z8-XasukguR6eUeWQ97A','student','Olivia Martin','student1@agenda.test','','Math','class_bach1',datetime('now','+1 year'),1,1,'default-agenda-school','agenda-test-session-educator1','agenda-test-educator-1','Bach1',0);

INSERT OR IGNORE INTO accounts
(id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, expires_at, activated, paid, school_id, registered_session_id, registered_educator_id, student_grade_label, password_must_change)
VALUES
('agenda-test-student-2','student2','pbkdf2_sha256$100000$kJYw2NQnP_j-dEfKDxQ8DQ$-u9FYrx-U7lWey66FWN39UdbgU5VgigRbKuk5p6pW6Q','student','Noah Saad','student2@agenda.test','','Math','class_bach1',datetime('now','+1 year'),1,1,'default-agenda-school','agenda-test-session-educator1','agenda-test-educator-1','Bach1',0);

INSERT OR IGNORE INTO accounts
(id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, expires_at, activated, paid, school_id, registered_session_id, registered_educator_id, student_grade_label, password_must_change)
VALUES
('agenda-test-student-3','student3','pbkdf2_sha256$100000$Qz62W45ua0_vNQsX0xLNHw$TdH-RhWRZvVZhxqbDOIn_PBe-iT0Nz4ZFEUBIuAmZ-A','student','Emma Farah','student3@agenda.test','','Math','class_bach1',datetime('now','+1 year'),1,1,'default-agenda-school','agenda-test-session-educator1','agenda-test-educator-1','Bach1',0);

INSERT OR IGNORE INTO accounts
(id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, expires_at, activated, paid, school_id, registered_session_id, registered_educator_id, student_grade_label, password_must_change)
VALUES
('agenda-test-student-4','student4','pbkdf2_sha256$100000$VzF37TGoVkTjWRxesHvp2g$OlIyT3TPEj6dfb4QI0c8hjSWARrL6tHE1O7G4lob9sE','student','Liam Haddad','student4@agenda.test','','Physics','class_second',datetime('now','+1 year'),1,1,'default-agenda-school','agenda-test-session-educator2','agenda-test-educator-2','Second',0);

INSERT OR IGNORE INTO accounts
(id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, expires_at, activated, paid, school_id, registered_session_id, registered_educator_id, student_grade_label, password_must_change)
VALUES
('agenda-test-student-5','student5','pbkdf2_sha256$100000$7zIRvH-Drjvyglr-SCgQ2Q$3jYLuSG6u5cq40F1Aq1uvMLgMOvJivr8MedRY3AjHdM','student','Sofia Rahme','student5@agenda.test','','Physics','class_second',datetime('now','+1 year'),1,1,'default-agenda-school','agenda-test-session-educator2','agenda-test-educator-2','Second',0);

INSERT OR IGNORE INTO accounts
(id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, expires_at, activated, paid, school_id, registered_session_id, registered_educator_id, student_grade_label, password_must_change)
VALUES
('agenda-test-student-6','student6','pbkdf2_sha256$100000$RwHsnNbLrN9q_MmWxFY6FA$w2mpiL3b8_UBUSqLesJL2Go3SylrlxwsUIy2bpXsjW8','student','Adam Khoury','student6@agenda.test','','Physics','class_second',datetime('now','+1 year'),1,1,'default-agenda-school','agenda-test-session-educator2','agenda-test-educator-2','Second',0);

INSERT OR IGNORE INTO accounts
(id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, expires_at, activated, paid, school_id, registered_session_id, registered_educator_id, student_grade_label, password_must_change)
VALUES
('agenda-test-student-7','student7','pbkdf2_sha256$100000$FH6ahrRW8_FyN8Ci5or4vg$4yNWFcpWRgVOQnjD1v_U8j4s1ZEMrRj5rQS3F2rgzYI','student','Mia Nassar','student7@agenda.test','','Biology','class_grade7',datetime('now','+1 year'),1,1,'default-agenda-school','agenda-test-session-educator3','agenda-test-educator-3','Grade 7',0);

INSERT OR IGNORE INTO accounts
(id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, expires_at, activated, paid, school_id, registered_session_id, registered_educator_id, student_grade_label, password_must_change)
VALUES
('agenda-test-student-8','student8','pbkdf2_sha256$100000$3vg7PNPGVxvtNOfM3qwMgQ$jttLrc10CVVH82glViJ23-Cx1oUQeD0aRR93xC0McOo','student','Ethan Mansour','student8@agenda.test','','Biology','class_grade7',datetime('now','+1 year'),1,1,'default-agenda-school','agenda-test-session-educator3','agenda-test-educator-3','Grade 7',0);

INSERT OR IGNORE INTO accounts
(id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, expires_at, activated, paid, school_id, registered_session_id, registered_educator_id, student_grade_label, password_must_change)
VALUES
('agenda-test-student-9','student9','pbkdf2_sha256$100000$a8KNmq7ZM85688Ev2uVbZw$2SUSeJSWrOIbRpL2XOPIBPaa-amgn2yE2FKny1WepQQ','student','Chloe Younes','student9@agenda.test','','Biology','class_grade7',datetime('now','+1 year'),1,1,'default-agenda-school','agenda-test-session-educator3','agenda-test-educator-3','Grade 7',0);

INSERT OR IGNORE INTO educator_lessons (id, school_id, educator_id, slot, title, subject, description)
VALUES
('agenda-test-educator1-lesson-1','default-agenda-school','agenda-test-educator-1',1,'Common Test 1 – Algebraic Expressions','Math','Simplify: 3x + 2x; evaluate 2a + 5 when a = 3; expand 2(x + 4); factor 6x + 12; find the coefficient of y in 7y - 2. Answer key: 5x; 11; 2x + 8; 6(x + 2); 7.'),
('agenda-test-educator1-lesson-2','default-agenda-school','agenda-test-educator-1',2,'Common Test 2 – Linear Equations','Math','Solve: x + 7 = 15; 3x = 21; 2x - 5 = 9; 4(x + 1) = 20; x/3 + 2 = 6. Answer key: 8; 7; 7; 4; 12.'),
('agenda-test-educator1-lesson-3','default-agenda-school','agenda-test-educator-1',3,'Common Test 3 – Functions and Graphs','Math','For f(x) = 2x + 1, find f(0), f(3), and x when f(x)=9. State the slope and y-intercept. Answer key: 1; 7; 4; slope 2; intercept 1.'),
('agenda-test-educator1-lesson-4','default-agenda-school','agenda-test-educator-1',4,'Common Test 4 – Quadratic Basics','Math','Solve x² = 25; factor x² + 5x + 6; find the roots of x² - 9 = 0; calculate the discriminant of x² - 4x + 3. Answer key: x=±5; (x+2)(x+3); x=±3; Δ=4.'),
('agenda-test-educator1-lesson-5','default-agenda-school','agenda-test-educator-1',5,'Common Test 5 – Geometry and Trigonometry','Math','Find the angles in a triangle with two angles 50° and 60°; area of a 6-by-4 rectangle; circumference of a circle of radius 3; sin 30°; Pythagoras hypotenuse for legs 3 and 4. Answer key: 70°; 24; 6π; 1/2; 5.');

INSERT OR IGNORE INTO educator_lessons (id, school_id, educator_id, slot, title, subject, description)
VALUES
('agenda-test-educator2-lesson-1','default-agenda-school','agenda-test-educator-2',1,'Common Test 1 – Motion and Speed','Physics','A car travels 120 km in 2 h. Find its average speed. Convert 3.5 h to minutes. A runner covers 400 m in 80 s. Find speed. Define displacement. Answer key: 60 km/h; 210 min; 5 m/s; change in position with direction.'),
('agenda-test-educator2-lesson-2','default-agenda-school','agenda-test-educator-2',2,'Common Test 2 – Forces','Physics','Find the weight of a 5 kg object using g = 10 N/kg. State the SI unit of force. What is the resultant force when 8 N right and 3 N left act together? State Newton''s first law. Answer key: 50 N; newton; 5 N right; an object maintains its state unless acted on by a resultant force.'),
('agenda-test-educator2-lesson-3','default-agenda-school','agenda-test-educator-2',3,'Common Test 3 – Work, Energy and Power','Physics','Calculate work when a 10 N force moves an object 3 m in its direction. Find kinetic energy for m=2 kg and v=3 m/s. Define power. Answer key: 30 J; 9 J; work done per unit time.'),
('agenda-test-educator2-lesson-4','default-agenda-school','agenda-test-educator-2',4,'Common Test 4 – Electricity','Physics','A 6 V battery is connected to a 3 Ω resistor. Find current. State the unit of resistance. Name the device used to measure current. Answer key: 2 A; ohm; ammeter.'),
('agenda-test-educator2-lesson-5','default-agenda-school','agenda-test-educator-2',5,'Common Test 5 – Waves and Sound','Physics','Define frequency. Find the period of a 5 Hz wave. Can sound travel through a vacuum? Name the unit of frequency. Answer key: number of cycles per second; 0.2 s; no; hertz.');

INSERT OR IGNORE INTO educator_lessons (id, school_id, educator_id, slot, title, subject, description)
VALUES
('agenda-test-educator3-lesson-1','default-agenda-school','agenda-test-educator-3',1,'Common Test 1 – Cells','Biology','Name the basic unit of life. Which cell part controls activities? Which structure contains genetic material? Name the jelly-like material inside a cell. Answer key: cell; nucleus; nucleus; cytoplasm.'),
('agenda-test-educator3-lesson-2','default-agenda-school','agenda-test-educator-3',2,'Common Test 2 – Human Digestion','Biology','Where does digestion begin? Which organ produces bile? Where are most nutrients absorbed? What is the role of the stomach? Answer key: mouth; liver; small intestine; mixes food and begins protein digestion.'),
('agenda-test-educator3-lesson-3','default-agenda-school','agenda-test-educator-3',3,'Common Test 3 – Plants','Biology','Name the process by which plants make food. Which gas is absorbed? Which plant part absorbs most water? What is the role of leaves? Answer key: photosynthesis; carbon dioxide; roots; capture light and exchange gases.'),
('agenda-test-educator3-lesson-4','default-agenda-school','agenda-test-educator-3',4,'Common Test 4 – Ecosystems','Biology','Define producer. Give one example of a consumer. What do decomposers do? In a grass-rabbit-fox chain, identify the primary consumer. Answer key: organism that makes its own food; rabbit; break down dead matter and recycle nutrients; rabbit.'),
('agenda-test-educator3-lesson-5','default-agenda-school','agenda-test-educator-3',5,'Common Test 5 – Human Body Systems','Biology','Which organ pumps blood? Which organs exchange oxygen and carbon dioxide? What is the main role of the skeleton? Name the system that breaks down food. Answer key: heart; lungs; support and protection; digestive system.');

