import assert from 'node:assert/strict';
import { createHmac, pbkdf2Sync, randomBytes } from 'node:crypto';
import { test } from 'node:test';
import worker from './worker.js';

const signingKey = 'test-session-signing-key-with-enough-entropy';

// Stream Video is an external dependency. Keep Worker tests deterministic by
// mocking successful provider responses instead of calling the real service.
globalThis.fetch = async () =>
  new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return `pbkdf2_sha256$100000$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

function fakeEnvironment() {
  const accounts = new Map();
  const platformOwners = new Set();
  const setupTokens = new Map();
  const schools = new Map([['default-agenda-school', { id: 'default-agenda-school', name: 'Agenda', director_id: 'director-account-0000000000000000' }]]);
  const pricing = new Map();
  const attempts = [];
  const sessions = new Map();
  sessions.set('test-registration-session', {
    id: 'test-registration-session',
    school_id: 'default-agenda-school',
    grade_id: 'eb8',
    subject: 'Mathematics',
    title: 'Registered algebra session',
    teacher_name: '',
    source_name: 'Agenda',
    source_url: 'https://example.org/session',
    playback_url: 'https://example.org/session/video',
    media_key: null,
    is_live: 0,
    live_starts_at: null,
  });

  class Statement {
    constructor(sql) {
      this.sql = sql;
      this.values = [];
    }

    bind(...values) {
      this.values = values;
      return this;
    }

    async first() {
      if (this.sql.includes("FROM accounts a") &&
          this.sql.includes("NOT EXISTS (SELECT 1 FROM platform_owners p") &&
          this.sql.includes("WHERE a.id = ?")) {
        const account = accounts.get(this.values[0]);
        const school = account ? schools.get(account.school_id) : null;
        if (!account || account.role !== 'director' ||
            !school || school.director_id !== account.id ||
            platformOwners.has(account.id)) return null;
        return {
          id: account.id, school_id: account.school_id, phone: account.phone,
          username: account.username, activated: account.activated, paid: account.paid,
          expires_at: account.expires_at,
          license_active: school.license_active ?? 1,
          license_expires_at: school.license_expires_at || null,
        };
      }
      if (this.sql.includes('FROM director_setup_tokens')) {
        const record = setupTokens.get(this.values[0]);
        if (!record || record.used_at) return null;
        const account = accounts.get(record.account_id);
        return account ? { id: account.id, username: account.username, role: account.role, school_id: account.school_id, phone: account.phone } : null;
      }
      if (this.sql.includes('FROM platform_owners')) {
        const accountId = this.values[0];
        const account = accounts.get(accountId);
        const school = account ? schools.get(account.school_id) : null;
        if (!platformOwners.has(accountId)) return null;
        if (this.sql.includes('INNER JOIN accounts')) {
          return account?.role === 'director' && school?.director_id === accountId
            ? { account_id: accountId }
            : null;
        }
        return { account_id: accountId };
      }
      if (this.sql.includes('FROM schools WHERE id = ?')) {
        const school = schools.get(this.values[0]);
        if (this.sql.includes('director_id = ?') && school?.director_id !== this.values[1]) return null;
        return school ? { id: school.id, name: school.name } : null;
      }
      if (this.sql.includes('schools.director_id = accounts.id') || this.sql.includes('schools.director_id = a.id')) {
        const account = accounts.get(this.values[0]);
        const school = account ? schools.get(account.school_id) : null;
        return school?.director_id === account?.id ? {
          school_id: school.id,
          id: school.id,
          username: account.username,
          school_name: school.name,
          activated: account.activated,
          paid: account.paid,
          expires_at: account.expires_at,
          license_active: school.license_active ?? 1,
          license_expires_at: school.license_expires_at || null,
        } : null;
      }
      if (this.sql.includes("SELECT id FROM accounts WHERE role = 'educator'") && this.sql.includes('registered_session_id = ?')) {
        const educator = [...accounts.values()].find((item) =>
          item.role === 'educator' &&
          item.school_id === this.values[0] &&
          item.registered_session_id === this.values[1]
        );
        return educator ? { id: educator.id } : null;
      }
      if (this.sql.includes('SELECT id FROM accounts WHERE username')) {
        const account = [...accounts.values()].find((item) =>
          item.username.toLowerCase() === this.values[0].toLowerCase() &&
          (!this.sql.includes('id != ?') || item.id !== this.values[1])
        );
        return account ? { id: account.id } : null;
      }
      if (this.sql.includes('SELECT COUNT(*) AS count FROM login_attempts')) {
        const recent = attempts.filter((item) => item.username === this.values[0].toLowerCase() && !item.succeeded);
        return { count: recent.length };
      }
      if (this.sql.includes("SELECT * FROM accounts WHERE role = 'director' AND lower(trim(email)) = ?")) {
        const email = String(this.values[0] || '').trim().toLowerCase();
        return [...accounts.values()].find((item) =>
          item.role === 'director' && String(item.email || '').trim().toLowerCase() === email
        ) || null;
      }
      if (this.sql.includes('SELECT * FROM accounts WHERE username')) {
        const loginIdentifier = String(this.values[0] || '').toLowerCase();
        return [...accounts.values()].find((item) =>
          item.username.toLowerCase() === loginIdentifier ||
          (item.role === 'director' && String(item.email || '').toLowerCase() === loginIdentifier)
        ) || null;
      }
      if (this.sql.includes("SELECT id FROM accounts WHERE role = 'director' AND email = ?")) {
        const email = String(this.values[0] || '').toLowerCase();
        const account = [...accounts.values()].find((item) =>
          item.role === 'director' && String(item.email || '').toLowerCase() === email
        );
        return account ? { id: account.id } : null;
      }
      if (this.sql.includes('FROM accounts') && (this.sql.includes('WHERE id = ?') || this.sql.includes('WHERE a.id = ?'))) {
        const account = accounts.get(this.values[0]) || null;
        if (!account) return null;
        const schoolId = this.values.slice(1).find((value) => schools.has(value));
        if (schoolId && account.school_id !== schoolId) return null;
        if (this.sql.includes("role = 'director'") && account.role !== 'director') return null;
        if (this.sql.includes("role IN ('student', 'educator')") && !['student', 'educator'].includes(account.role)) return null;
        return account;
      }
      if (this.sql.includes('INNER JOIN accounts educator')) {
        const sessionId = this.values[0];
        const session = sessions.get(sessionId);
        const schoolId = this.values.slice(1).find((value) => schools.has(value));
        const educator = [...accounts.values()].find((item) =>
          item.role === 'educator' &&
          item.registered_session_id === sessionId &&
          item.school_id === schoolId
        );
        return session && session.school_id === schoolId && educator
          ? { id: session.id, grade_id: session.grade_id }
          : null;
      }
      if (this.sql.includes('SELECT id, grade_id FROM sessions WHERE id')) {
        const session = sessions.get(this.values[0]);
        return session && (!this.values[1] || session.school_id === this.values[1]) ? { id: session.id, grade_id: session.grade_id } : null;
      }
      if (this.sql.includes('SELECT * FROM sessions WHERE id = ? AND school_id = ?')) {
        const session = sessions.get(this.values[0]);
        return session && session.school_id === this.values[1] && (!this.sql.includes('is_live = 1') || Boolean(session.is_live)) ? session : null;
      }
      if (this.sql.includes('SELECT grade_id FROM sessions WHERE grade_id')) {
        const session = [...sessions.values()].find((item) =>
          item.grade_id === this.values[0] && (!this.values[1] || item.school_id === this.values[1])
        );
        return session ? { grade_id: session.grade_id } : null;
      }
      if (this.sql.includes('SELECT * FROM sessions WHERE id = ? AND is_live = 1')) {
        const session = sessions.get(this.values[0]);
        return session?.is_live ? session : null;
      }
      return null;
    }

    async all() {
      if (this.sql.includes("lower(trim(full_name))") && this.sql.includes("role = 'director'")) {
        const name = String(this.values[0] || '').trim().toLowerCase();
        return {
          results: [...accounts.values()].filter((item) =>
            item.role === 'director' && String(item.full_name || '').trim().toLowerCase() === name
          ).slice(0, 2),
        };
      }
      if (this.sql.includes("FROM accounts a") && this.sql.includes("INNER JOIN schools s ON s.director_id = a.id")) {
        const requestedIds = this.sql.includes('a.id IN (') ? new Set(this.values) : null;
        const results = [...accounts.values()]
          .filter((account) => {
            const school = schools.get(account.school_id);
            if (requestedIds && !requestedIds.has(account.id)) return false;
            return account.role === 'director' && school?.director_id === account.id && !platformOwners.has(account.id);
          })
          .map((account) => {
            const school = schools.get(account.school_id);
            return {
              id: account.id,
              username: account.username,
              full_name: account.full_name,
              email: account.email,
              phone: account.phone,
              password_hash: account.password_hash,
              phone_password_disabled_at: account.phone_password_disabled_at ?? null,
              created_at: account.created_at,
              activated: account.activated,
              paid: account.paid,
              expires_at: account.expires_at,
              school_id: school.id,
              school_name: school.name,
              license_expires_at: school.license_expires_at || null,
              license_active: school.license_active ?? 1,
              payment_method: school.payment_method || 'unset',
              payment_value: school.payment_value || '',
              setup_pending: [...setupTokens.values()].some((item) => item.account_id === account.id && !item.used_at),
              student_count: [...accounts.values()].filter((item) => item.school_id === school.id && item.role === 'student').length,
              educator_count: [...accounts.values()].filter((item) => item.school_id === school.id && item.role === 'educator').length,
            };
          });
        return { results };
      }
      if (this.sql.includes('FROM school_grade_pricing')) {
        const schoolId = this.values[0];
        return { results: [...pricing.values()].filter((item) => item.school_id === schoolId) };
      }
      if (this.sql.includes('SELECT DISTINCT grade_id FROM sessions')) {
        const schoolId = this.values[0];
        return { results: [...new Set([...sessions.values()].filter((item) => !schoolId || item.school_id === schoolId).map((item) => item.grade_id))].map((grade_id) => ({ grade_id })) };
      }
      if (this.sql.includes('FROM sessions') && this.sql.includes('school_id = ?')) {
        const schoolId = this.values[0];
        const gradeId = this.sql.includes('grade_id = ?') ? this.values[1] : null;
        const liveOnly = this.sql.includes('is_live = 1');
        return { results: [...sessions.values()].filter((item) => item.school_id === schoolId && (!gradeId || item.grade_id === gradeId) && (this.sql.includes('is_live =') ? Boolean(item.is_live) === liveOnly : true)) };
      }
      if (this.sql.includes('FROM sessions ORDER BY')) return { results: [...sessions.values()] };
      if (this.sql.includes('FROM accounts') && this.sql.includes("role = '")) {
        const role = this.sql.match(/role = '([^']+)'/)?.[1];
        const schoolId = this.sql.includes('school_id = ?') ? this.values[this.sql.indexOf('school_id = ?') > this.sql.indexOf('role =') ? 0 : 0] : null;
        return { results: [...accounts.values()].filter((item) => item.role === role && (!schoolId || item.school_id === schoolId)) };
      }
      if (this.sql.includes('FROM accounts WHERE school_id = ?')) {
        const schoolId = this.values[0];
        return { results: [...accounts.values()].filter((item) => item.school_id === schoolId) };
      }
      if (this.sql.includes('FROM sessions WHERE grade_id')) {
        const gradeId = this.values[this.values.length - 1];
        const liveOnly = this.sql.includes('is_live = 1');
        return {
          results: [...sessions.values()].filter((item) => item.grade_id === gradeId && Boolean(item.is_live) === liveOnly),
        };
      }
      return { results: [] };
    }

    async run() {
      if (this.sql.startsWith('INSERT INTO director_setup_tokens')) {
        const [token_hash, account_id] = this.values;
        setupTokens.set(token_hash, { token_hash, account_id, used_at: null });
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith("UPDATE director_setup_tokens SET used_at")) {
        const record = setupTokens.get(this.values[0]);
        if (!record || record.used_at) return { meta: { changes: 0 } };
        record.used_at = '2026-11-17 10:00:00';
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('INSERT INTO accounts')) {
        const [id, username, password_hash, role, school_id, full_name, email, phone, school_or_subject, grade_id, student_grade_label, registered_session_id, registered_educator_id] = this.values;
        if ([...accounts.values()].some((item) => item.username.toLowerCase() === username.toLowerCase())) {
          throw new Error('UNIQUE constraint failed: accounts.username');
        }
        const isDirectorCreation = this.sql.includes("datetime('now', '+1 year'), 1, 1, 1");
        accounts.set(id, {
          id, username, password_hash, role, school_id, full_name, email, phone, school_or_subject, grade_id, registered_session_id,
          student_grade_label: student_grade_label || '',
          registered_educator_id: registered_educator_id || null,
          created_at: '2026-11-03 10:00:00',
          expires_at: isDirectorCreation ? '2027-11-17 10:00:00' : '2026-12-03 10:00:00',
          activated: isDirectorCreation ? 1 : 0,
          paid: isDirectorCreation ? 1 : 0,
          password_must_change: isDirectorCreation ? 1 : 0,
          phone_password_disabled_at: null,
        });
        return { meta: { changes: 1 } };
      }
      if (this.sql.includes('INSERT INTO login_attempts')) {
        attempts.push({ username: this.values[0].toLowerCase(), succeeded: Boolean(this.values[1]) });
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('DELETE FROM login_attempts')) {
        const account = this.sql.includes('SELECT username FROM accounts')
          ? accounts.get(this.values[0])
          : null;
        const username = account?.username || this.values[0];
        for (let index = attempts.length - 1; index >= 0; index -= 1) {
          if (attempts[index].username === String(username).toLowerCase()) attempts.splice(index, 1);
        }
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('DELETE FROM sessions WHERE id')) {
        const session = sessions.get(this.values[0]);
        if (!session || (this.values[1] && session.school_id !== this.values[1])) return { meta: { changes: 0 } };
        sessions.delete(this.values[0]);
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('INSERT INTO school_grade_pricing')) {
        pricing.set(`${this.values[0]}:${this.values[1]}`, { school_id: this.values[0], grade_id: this.values[1], monthly_rate_usd: this.values[2] });
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('DELETE FROM school_grade_pricing')) {
        const [schoolId, gradeId] = this.values;
        const existed = pricing.delete(`${schoolId}:${gradeId}`);
        return { meta: { changes: existed ? 1 : 0 } };
      }
      if (this.sql.startsWith('INSERT INTO schools')) {
        const [id, name, director_id] = this.values;
        const inactive = this.sql.includes('license_expires_at, license_active) VALUES (?, ?, ?, NULL, 0)') || this.sql.includes("license_expires_at, license_active) VALUES (?, ?, ?, datetime('now', '+1 year'), 0)");
        schools.set(id, { id, name, director_id, license_expires_at: inactive ? (this.sql.includes("datetime('now', '+1 year')") ? '2027-11-18 10:00:00' : null) : '2027-11-17 10:00:00', license_active: inactive ? 0 : 1 });
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('UPDATE schools SET name')) {
        const school = schools.get(this.values[1]);
        if (school && (!this.values[2] || school.director_id === this.values[2])) school.name = this.values[0];
        return { meta: { changes: school ? 1 : 0 } };
      }
      if (this.sql.startsWith('UPDATE accounts SET student_grade_label = ? WHERE id = ? AND school_id = ? AND role = \'student\'')) {
        const [student_grade_label, id, school_id] = this.values;
        const account = accounts.get(id);
        if (!account || account.school_id !== school_id || account.role !== 'student') return { meta: { changes: 0 } };
        account.student_grade_label = student_grade_label;
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('UPDATE accounts SET registered_session_id = ? WHERE id = ? AND school_id = ? AND role = \'educator\'')) {
        const [registered_session_id, id, school_id] = this.values;
        const account = accounts.get(id);
        if (!account || account.school_id !== school_id || account.role !== 'educator') return { meta: { changes: 0 } };
        account.registered_session_id = registered_session_id;
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('UPDATE accounts SET registered_educator_id = ?, registered_session_id = ?, grade_id = ? WHERE id = ?')) {
        const [registered_educator_id, registered_session_id, grade_id, id] = this.values;
        const account = accounts.get(id);
        if (!account || account.role !== 'student') return { meta: { changes: 0 } };
        Object.assign(account, { registered_educator_id, registered_session_id, grade_id });
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('UPDATE accounts SET password_hash = ?, password_must_change = 1, phone_password_disabled_at = NULL')) {
        const [password_hash, id] = this.values;
        const account = accounts.get(id);
        if (!account || account.role !== 'director') return { meta: { changes: 0 } };
        account.password_hash = password_hash;
        account.password_must_change = 1;
        account.phone_password_disabled_at = null;
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('UPDATE accounts SET password_hash = ?, password_must_change = 1')) {
        const [password_hash, id] = this.values;
        const account = accounts.get(id);
        if (!account || account.role !== 'director') return { meta: { changes: 0 } };
        account.password_hash = password_hash;
        account.password_must_change = 1;
        account.phone_password_disabled_at = null;
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('UPDATE accounts SET username = ?, password_hash = ?')) {
        const [username, password_hash, id] = this.values;
        const account = accounts.get(id);
        if (!account || account.role !== 'director') return { meta: { changes: 0 } };
        account.username = username;
        account.password_hash = password_hash;
        account.password_must_change = this.sql.includes('password_must_change = 1') ? 1 : 0;
        if (this.sql.includes('phone_password_disabled_at = NULL')) account.phone_password_disabled_at = null;
        else if (this.sql.includes('phone_password_disabled_at = datetime')) account.phone_password_disabled_at = '2026-11-17 12:00:00';
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('UPDATE accounts SET activated = ?, paid = ?, grade_id = ?, registered_session_id = ?, registered_educator_id = ?')) {
        const hasSchoolOrSubject = this.sql.includes('school_or_subject = ?');
        const [activated, paid, grade_id, registered_session_id, registered_educator_id, schoolOrSubject, idOrLegacyId, schoolOrLegacySchoolId] = this.values;
        const id = hasSchoolOrSubject ? idOrLegacyId : schoolOrSubject;
        const school_id = hasSchoolOrSubject ? schoolOrLegacySchoolId : idOrLegacyId;
        const account = accounts.get(id);
        if (!account || account.school_id !== school_id || !['student', 'educator'].includes(account.role)) return { meta: { changes: 0 } };
        Object.assign(account, { activated, paid, grade_id, registered_session_id, registered_educator_id });
        if (hasSchoolOrSubject) account.school_or_subject = schoolOrSubject;
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('UPDATE accounts SET') && this.sql.includes('WHERE id = ?') && !this.sql.includes('username = ?')) {
        const id = this.values[this.values.length - 1];
        const account = accounts.get(id);
        if (!account || account.role !== 'director') return { meta: { changes: 0 } };
        let valueIndex = 0;
        if (this.sql.includes('activated = ?')) account.activated = this.values[valueIndex++];
        if (this.sql.includes('paid = ?')) account.paid = this.values[valueIndex++];
        if (this.sql.includes('password_must_change = 1')) account.password_must_change = 1;
        if (this.sql.includes("phone_password_disabled_at = datetime('now')")) account.phone_password_disabled_at = '2026-11-17 12:00:00';
        if (this.sql.includes("expires_at = datetime('now', '+1 year')")) account.expires_at = '2027-11-17 10:00:00';
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('UPDATE schools SET') && (this.sql.includes('WHERE id = ?') || this.sql.includes('WHERE director_id = ?'))) {
        const directorScoped = this.sql.includes('WHERE director_id = ?');
        const id = this.values[this.values.length - 1];
        const school = directorScoped
          ? [...schools.values()].find((item) => item.director_id === id)
          : schools.get(id);
        if (!school) return { meta: { changes: 0 } };
        let valueIndex = 0;
        if (this.sql.includes('license_active = ?')) school.license_active = this.values[valueIndex++];
        if (this.sql.includes("license_expires_at = datetime('now', '+1 year')") ||
            (this.sql.includes("license_expires_at = CASE WHEN") && Number(this.values[valueIndex] ?? this.values[1]) === 1)) {
          school.license_expires_at = '2027-11-17 10:00:00';
        }
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('UPDATE accounts') && this.sql.includes(' SET ')) {
        const id = this.values[this.sql.includes('AND school_id = ?') ? this.values.length - 2 : this.values.length - 1];
        const account = accounts.get(id);
        if (!account || account.role === 'director') return { meta: { changes: 0 } };
        let valueIndex = 0;
        if (this.sql.includes('activated = ?')) account.activated = this.values[valueIndex++];
        if (this.sql.includes('paid = ?')) account.paid = this.values[valueIndex++];
        if (this.sql.includes('registered_session_id = ?')) {
          account.registered_session_id = this.values[valueIndex++];
          account.grade_id = this.values[valueIndex++];
        }
        if (this.sql.includes('password_hash = ?')) account.password_hash = this.values[valueIndex++];
        if (this.sql.includes("expires_at = datetime('now', '+1 month')")) account.expires_at = '2026-12-03 10:00:00';
        return { meta: { changes: 1 } };
      }
      return { meta: { changes: 0 } };
    }
  }

  const DB = {
    prepare(sql) {
      return new Statement(sql);
    },
    async batch(statements) {
      const results = [];
      for (const statement of statements) {
        if (statement.sql.startsWith("INSERT INTO accounts") && statement.sql.includes("VALUES (?, ?, ?, 'director'")) {
          const [id, username, password_hash, school_id, full_name, email, phone] = statement.values;
          accounts.set(id, {
            id, username, password_hash, role: 'director', school_id, full_name, email, phone,
            school_or_subject: '', grade_id: '', registered_session_id: null, registered_educator_id: null,
            created_at: '2026-11-18 10:00:00', expires_at: null, activated: 0, paid: 0,
            password_must_change: 0, phone_password_disabled_at: '2026-11-18 10:00:00',
          });
          results.push({ meta: { changes: 1 } });
        } else if (statement.sql.includes("INTO sessions")) {
          const [id, school_id, grade_id, subject, title, teacher_name, source_name, source_url, playback_url, media_key, is_live, live_starts_at] = statement.values;
          sessions.set(id, {
            id, school_id, grade_id, subject, title, teacher_name, source_name, source_url, playback_url, is_live, live_starts_at,
            media_key,
          });
          results.push({ meta: { changes: 1 } });
        } else if (statement.sql.startsWith("INSERT OR IGNORE INTO educator_lessons")) {
          results.push({ meta: { changes: 1 } });
        } else {
          results.push(await statement.run());
        }
      }
      return results;
    },
  };

  const password = 'DirectorPassword#2026';
  accounts.set('director-account-0000000000000000', {
    id: 'director-account-0000000000000000',
    username: 'director',
    password_hash: hashPassword(password),
    role: 'director',
    school_id: 'default-agenda-school',
    full_name: 'Director',
    email: '',
    phone: '',
    school_or_subject: '',
    grade_id: '',
    registered_session_id: null,
    created_at: '2026-11-03 09:00:00',
    expires_at: null,
    activated: 1,
    paid: 1,
  });

  accounts.set('00000000-0000-4000-8000-000000000001', {
    id: '00000000-0000-4000-8000-000000000001',
    username: 'assigned.educator',
    password_hash: 'unused',
    role: 'educator',
    school_id: 'default-agenda-school',
    full_name: 'Assigned Educator',
    email: 'assigned@example.com',
    phone: '',
    school_or_subject: 'Mathematics',
    grade_id: 'eb8',
    registered_session_id: 'test-registration-session',
    created_at: '2026-11-03 09:00:30',
    expires_at: null,
    activated: 1,
    paid: 1,
  });

  return {
    env: {
      DB,
      SESSION_SIGNING_KEY: signingKey,
      ALLOWED_ORIGINS: 'https://riobase.github.io,https://agenda.mycamp.workers.dev',
      APP_BASE_URL: 'https://agenda.mycamp.workers.dev',
      STREAM_VIDEO_API_KEY: 'test-stream-video-key',
      STREAM_VIDEO_API_SECRET: 'test-stream-video-secret-with-sufficient-length',
      AI: { run: async () => ({ response: 'Workers AI test response' }) },
    },
    accounts,
    platformOwners,
    setupTokens,
    schools,
    sessions,
    pricing,
    attempts,
    password,
  };
}

async function send(env, path, { method = 'GET', body, token, origin } = {}) {
  const headers = new Headers();
  if (body !== undefined) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (origin) headers.set('origin', origin);
  let requestPath = path;
  let requestBody = body;
  if (path === '/api/auth/register' && body && !body.schoolId) requestBody = { ...body, schoolId: 'default-agenda-school' };
  if (path === '/api/auth/login' && requestBody && !requestBody.schoolId) requestBody = { ...requestBody, schoolId: 'default-agenda-school' };
  if (path === '/api/auth/me' && !path.includes('schoolId=')) requestPath += '?schoolId=default-agenda-school';
  if ((path.startsWith('/api/registration/') || path.startsWith('/api/sessions?')) && !path.includes('schoolId=')) {
    requestPath += `${path.includes('?') ? '&' : '?'}schoolId=default-agenda-school`;
  }
  const request = new Request(`https://agenda-api.test${requestPath}`, {
    method,
    headers,
    body: requestBody === undefined ? undefined : JSON.stringify(requestBody),
  });
  return worker.fetch(request, env);
}

test('Workers AI endpoint converts chat content and returns model text', async () => {
  const { env } = fakeEnvironment();
  let capturedModel;
  let capturedInput;
  env.AI.run = async (model, input) => {
    capturedModel = model;
    capturedInput = input;
    return { choices: [{ message: { content: 'Qwen test response' } }] };
  };

  const response = await send(env, '/api/ai/generate', {
    method: 'POST',
    body: {
      contents: [
        { role: 'system', parts: [{ text: 'Answer in the language of the latest user message.' }] },
        { role: 'user', parts: [{ text: 'مرحبا، كيف حالك؟' }] }
      ],
      maxOutputTokens: 384
    }
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: 'Qwen test response' });
  assert.equal(capturedModel, '@cf/qwen/qwen3.8-27b');
  assert.deepEqual(capturedInput.messages, [
    { role: 'system', content: 'Answer in the language of the latest user message.' },
    { role: 'user', content: 'مرحبا، كيف حالك؟' }
  ]);
  assert.equal(capturedInput.max_tokens, 384);
  assert.equal(capturedInput.reasoning_effort, 'low');
});

test('Workers AI endpoint converts inline images to Qwen image_url parts', async () => {
  const { env } = fakeEnvironment();
  let capturedInput;
  env.AI.run = async (_model, input) => {
    capturedInput = input;
    return { response: 'Image received.' };
  };

  const response = await send(env, '/api/ai/generate', {
    method: 'POST',
    body: {
      contents: [
        { inlineData: { mimeType: 'image/png', data: 'aGVsbG8=' } },
        'Describe this image.'
      ]
    }
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: 'Image received.' });
  assert.deepEqual(capturedInput.messages, [{
    role: 'user',
    content: [
      { type: 'image_url', image_url: { url: 'data:image/png;base64,aGVsbG8=' } },
      { type: 'text', text: 'Describe this image.' }
    ]
  }]);
});

test('health and CORS preflight are served', async () => {
  const { env } = fakeEnvironment();
  const health = await send(env, '/api/health');
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });

  for (const origin of ['https://riobase.github.io', 'https://agenda.mycamp.workers.dev']) {
    const options = await worker.fetch(new Request('https://agenda-api.test/api/auth/register', {
      method: 'OPTIONS',
      headers: { Origin: origin },
    }), env);
    assert.equal(options.status, 204);
    assert.equal(options.headers.get('access-control-allow-origin'), origin);
  }
});

test('registration hashes credentials and rejects duplicate usernames', async () => {
  const { env, accounts, sessions } = fakeEnvironment();
  const registration = {
    username: 'learner.one',
    password: 'x',
    role: 'student',
    fullName: 'Learner One',
    email: 'learner@example.com',
    phone: '',
    schoolOrSubject: 'Grade 8',
    registeredSessionId: 'test-registration-session',
  };
  const response = await send(env, '/api/auth/register', { method: 'POST', body: registration });
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.account.role, 'student');
  assert.equal(result.account.activated, false);
  assert.equal(result.account.registeredSessionId, 'test-registration-session');
  assert.equal(result.chatOnly, true);
  assert.equal('password_hash' in result.account, false);
  const firstRegistrationLiveAccess = await send(env, '/api/live-stream?sessionId=test-registration-session', { token: result.token });
  assert.ok([401, 403].includes(firstRegistrationLiveAccess.status), 'a newly registered unactivated account cannot enter the live classroom');
  assert.ok(result.account.expiresAt);
  assert.equal(accounts.get(result.account.id).password_hash.startsWith('pbkdf2_sha256$'), true);

  const invalidSession = await send(env, '/api/auth/register', {
    method: 'POST',
    body: { ...registration, username: 'learner.invalid', registeredSessionId: 'missing-session', registeredEducatorId: 'missing-educator' },
  });
  assert.equal(invalidSession.status, 400);
  assert.match((await invalidSession.json()).error, /choose an educator registered at this school/i);

  const registrationSessions = await send(env, '/api/registration/sessions');
  assert.equal(registrationSessions.status, 200);
  assert.ok((await registrationSessions.json()).sessions.some((session) => session.id === 'test-registration-session'));

  const pendingLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: registration.username, password: registration.password, schoolId: 'default-agenda-school' },
  });
  assert.equal(pendingLogin.status, 200);
  const pendingSession = await pendingLogin.json();
  assert.equal(pendingSession.chatOnly, true);
  assert.equal(pendingSession.account.activated, false);

  const pendingProfile = await send(env, '/api/auth/me?schoolId=default-agenda-school', {
    token: pendingSession.token,
  });
  assert.equal(pendingProfile.status, 200);
  assert.equal((await pendingProfile.json()).chatOnly, true);

  // Pending credentials can reach the founder-chat identity endpoint but may
  // not access the live classroom with the chat-only token.
  const blockedLiveClass = await send(env, '/api/live-stream?sessionId=test-registration-session', {
    token: pendingSession.token,
  });
  assert.ok([401, 403].includes(blockedLiveClass.status));

  const legacyAccount = accounts.get(result.account.id);
  legacyAccount.registered_session_id = null;
  legacyAccount.grade_id = '';
  const retry = await send(env, '/api/auth/register', { method: 'POST', body: registration });
  assert.equal(retry.status, 200);
  const retryRegistration = await retry.json();
  assert.equal(retryRegistration.account.activated, false);
  assert.equal(retryRegistration.chatOnly, true);
  const retryLiveAccess = await send(env, '/api/live-stream?sessionId=test-registration-session', { token: retryRegistration.token });
  assert.ok([401, 403].includes(retryLiveAccess.status), 'a repeated pending registration must remain blocked from live classroom');
  assert.equal(legacyAccount.registered_session_id, 'test-registration-session');

  const directorLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026' },
  });
  const { token: directorToken } = await directorLogin.json();
  await send(env, `/api/director/accounts/${result.account.id}`, {
    method: 'PATCH',
    token: directorToken,
    body: { activated: true, paid: true },
  });

  // The same restricted session is promoted automatically after approval.
  const promotedProfile = await send(env, '/api/auth/me?schoolId=default-agenda-school', {
    token: pendingSession.token,
  });
  assert.equal(promotedProfile.status, 200);
  const promotedSession = await promotedProfile.json();
  assert.equal(promotedSession.chatOnly, false);
  assert.ok(promotedSession.token);

  sessions.get(registration.registeredSessionId).is_live = 1;
  const sharedStream = await send(env, `/api/live-stream?sessionId=${registration.registeredSessionId}`, {
    token: promotedSession.token,
  });
  assert.equal(sharedStream.status, 200);
  assert.equal((await sharedStream.json()).status, 'waiting');
});

test('An inactive Director can sign in only to the Founder chat until Owner activation', async () => {
  const { env, accounts, schools } = fakeEnvironment();
  const directorId = 'pending-director-000000000000000';
  const schoolId = 'pending-school-0000000000000000';
  accounts.set(directorId, {
    id: directorId,
    username: 'director.pending',
    password_hash: hashPassword('pending-director-password'),
    role: 'director',
    school_id: schoolId,
    full_name: 'Pending Director',
    email: 'pending.director@example.com',
    phone: '',
    school_or_subject: '',
    grade_id: '',
    registered_session_id: null,
    created_at: '2026-11-19 09:00:00',
    expires_at: '2027-11-19 09:00:00',
    activated: 0,
    paid: 0,
  });
  schools.set(schoolId, {
    id: schoolId,
    name: 'Pending School',
    director_id: directorId,
    license_active: 0,
    license_expires_at: '2027-11-19 09:00:00',
  });

  const login = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director.pending', password: 'pending-director-password' },
  });
  assert.equal(login.status, 200);
  const session = await login.json();
  assert.equal(session.chatOnly, true);
  assert.equal(session.account.role, 'director');
  assert.equal(session.account.activated, false);

  const profile = await send(env, '/api/auth/me?schoolId=' + schoolId, { token: session.token });
  assert.equal(profile.status, 200);
  assert.equal((await profile.json()).chatOnly, true);

  const dashboard = await send(env, '/api/director/sessions', { token: session.token });
  assert.ok([401, 403].includes(dashboard.status));
});

test('Student registration saves their chosen custom grade label without changing the educator live-session grade', async () => {
  const { env, accounts } = fakeEnvironment();
  accounts.set('00000000-0000-4000-8000-000000000001', {
    id: '00000000-0000-4000-8000-000000000001',
    username: 'registered.educator',
    password_hash: hashPassword('educator-pass'),
    role: 'educator',
    school_id: 'default-agenda-school',
    full_name: 'Registered Educator',
    email: 'educator@agenda.example',
    phone: '',
    school_or_subject: 'Mathematics',
    grade_id: 'eb8',
    student_grade_label: '',
    registered_session_id: 'test-registration-session',
    registered_educator_id: null,
    created_at: '2026-11-18 10:00:00',
    expires_at: '2027-11-18 10:00:00',
    activated: 1,
    paid: 1,
  });
  const response = await send(env, '/api/auth/register', {
    method: 'POST',
    body: {
      schoolId: 'default-agenda-school',
      username: 'student.custom',
      password: 'x',
      role: 'student',
      fullName: 'Student Custom Class',
      email: 'student.custom@example.com',
      phone: '',
      schoolOrSubject: '',
      gradeId: 'eb8',
      studentGradeLabel: 'My Special Class 7',
      registeredEducatorId: '00000000-0000-4000-8000-000000000001',
    },
  });
  assert.equal(response.status, 201, await response.clone().text());
  const { account } = await response.json();
  const stored = accounts.get(account.id);
  assert.equal(stored.grade_id, 'eb8');
  assert.equal(stored.student_grade_label, 'My Special Class 7');
  assert.equal(account.studentGradeLabel, 'My Special Class 7');
});

test('grade registration loads available grades and grants grade-scoped live access', async () => {
  const { env, accounts, sessions } = fakeEnvironment();
  const grades = await send(env, '/api/registration/grades');
  assert.equal(grades.status, 200);
  const gradeCatalogue = await grades.json();
  assert.equal(gradeCatalogue.grades.length, 17);
  assert.ok(gradeCatalogue.grades.includes('bac_sv'));
  assert.ok(gradeCatalogue.grades.includes('kg'));
  assert.ok(gradeCatalogue.grades.includes('eb1'));
  assert.ok(gradeCatalogue.grades.includes('eb8'));

  const registration = await send(env, '/api/auth/register', {
    method: 'POST',
    body: {
      username: 'grade.student',
      password: 'no restrictions !',
      role: 'student',
      fullName: 'Grade Student',
      email: 'grade@example.com',
      phone: '+1 555 0100',
      schoolOrSubject: 'Grade 8',
      gradeId: 'eb8',
      registeredEducatorId: '00000000-0000-4000-8000-000000000001',
      registeredSessionId: 'test-registration-session',
    },
  });
  assert.equal(registration.status, 201);
  const { account, token } = await registration.json();
  assert.equal(account.gradeId, 'eb8');
  assert.equal(account.registeredSessionId, 'test-registration-session');
  assert.equal(account.registeredEducatorId, '00000000-0000-4000-8000-000000000001');
  assert.equal(accounts.get(account.id).grade_id, 'eb8');
  assert.equal(accounts.get(account.id).registered_educator_id, '00000000-0000-4000-8000-000000000001');

  const directorLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026' },
  });
  const { token: directorToken } = await directorLogin.json();
  await send(env, `/api/director/accounts/${account.id}`, {
    method: 'PATCH',
    token: directorToken,
    body: { activated: true, paid: true },
  });
  // The token issued at registration remains chat-only. Sign in again after
  // activation to obtain the normal classroom-capable session.
  const activatedLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'grade.student', password: 'no restrictions !', schoolId: 'default-agenda-school' },
  });
  assert.equal(activatedLogin.status, 200);
  const { token: activeToken, chatOnly } = await activatedLogin.json();
  assert.notEqual(chatOnly, true);
  sessions.get('test-registration-session').is_live = 1;
  const liveStatus = await send(env, '/api/live-stream?sessionId=test-registration-session', { token: activeToken });
  assert.equal(liveStatus.status, 200);
  assert.equal((await liveStatus.json()).status, 'waiting');
  const liveCatalog = await send(env, '/api/sessions?gradeId=eb8&live=true&sessionId=test-registration-session', { token: activeToken });
  assert.equal(liveCatalog.status, 200);
  assert.equal((await liveCatalog.json()).sessions[0].id, 'test-registration-session');

  const wrongGrade = await send(env, '/api/sessions?gradeId=eb7&live=true&sessionId=test-registration-session', { token: activeToken });
  assert.equal(wrongGrade.status, 403);

  // A student can select an educator before the Director has assigned a class.
  sessions.clear();
  const assignedEducator = accounts.get('00000000-0000-4000-8000-000000000001');
  assignedEducator.registered_session_id = null;
  const pendingClassStudent = await send(env, '/api/auth/register', {
    method: 'POST',
    body: {
      username: 'pending.class.student',
      password: 'PendingClassStudent#2026',
      role: 'student',
      fullName: 'Pending Class Student',
      email: 'pending.class.student@example.com',
      phone: '+961 70 123 456',
      schoolOrSubject: 'Life Sciences',
      registeredEducatorId: assignedEducator.id,
      gradeId: 'eb8',
    },
  });
  assert.equal(pendingClassStudent.status, 201, JSON.stringify(await pendingClassStudent.clone().json()));
  const pendingClassResult = await pendingClassStudent.json();
  assert.equal(pendingClassResult.account.registeredEducatorId, assignedEducator.id);
  assert.equal(pendingClassResult.account.registeredSessionId, null);
  assert.equal(pendingClassResult.account.gradeId, 'eb8');
  assert.equal(accounts.get(pendingClassResult.account.id).registered_educator_id, assignedEducator.id);

  // A school with no sessions must still be able to register its first educator.
  const firstEducator = await send(env, '/api/auth/register', {
    method: 'POST',
    body: {
      username: 'first.educator',
      password: '1',
      role: 'educator',
      fullName: 'First Educator',
      email: 'first.educator@example.com',
      phone: '+961 70 123 456',
      schoolOrSubject: 'Life Sciences',
      gradeId: '',
      className: 'Life Sciences Class 12',
    },
  });
  assert.equal(firstEducator.status, 201, JSON.stringify(await firstEducator.clone().json()));
  const firstEducatorResult = await firstEducator.json();
  assert.equal(firstEducatorResult.account.gradeId, 'class_life_sciences_class_12');
  assert.equal(firstEducatorResult.account.role, 'educator');
  assert.ok(firstEducatorResult.account.registeredSessionId);
  assert.equal(sessions.get(firstEducatorResult.account.registeredSessionId).title, 'Life Sciences Class 12');
});

test('Director can batch-save grades, payment, activation, and educator assignments', async () => {
  const { env, accounts } = fakeEnvironment();
  const educator = accounts.get('00000000-0000-4000-8000-000000000001');
  educator.grade_id = 'bac_sv';
  educator.registered_session_id = null;
  const student = {
    id: '00000000-0000-4000-8000-000000000099',
    username: 'batch.student',
    password_hash: hashPassword('BatchStudentPassword#2026'),
    role: 'student',
    school_id: 'default-agenda-school',
    full_name: 'Batch Student',
    email: 'batch.student@example.com',
    phone: '',
    school_or_subject: '',
    grade_id: 'eb8',
    registered_session_id: null,
    registered_educator_id: null,
    created_at: '2026-11-18 08:00:00',
    expires_at: '2026-12-18 08:00:00',
    activated: 0,
    paid: 0,
  };
  accounts.set(student.id, student);

  const directorLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026' },
  });
  assert.equal(directorLogin.status, 200);
  const { token } = await directorLogin.json();

  const save = await send(env, '/api/director/accounts/status', {
    method: 'PATCH',
    token,
    body: {
      updates: [{
        id: student.id,
        activated: true,
        paid: true,
        gradeId: 'bac_sv',
        registeredSessionId: null,
        registeredEducatorId: educator.id,
      }],
    },
  });
  assert.equal(save.status, 200, JSON.stringify(await save.clone().json()));
  const result = await save.json();
  assert.equal(result.updated, 1);
  assert.equal(result.accounts[0].registeredEducatorId, educator.id);
  assert.equal(result.accounts[0].gradeId, 'bac_sv');
  assert.equal(result.accounts[0].registeredSessionId, null);
  assert.equal(result.accounts[0].activated, true);
  assert.equal(result.accounts[0].paid, true);
  assert.equal(student.registered_educator_id, educator.id);
});

test('Owner creates a one-year Director school with phone initial password; Director chooses username and changes password after sign-in', async () => {
  const { env, accounts, platformOwners, setupTokens } = fakeEnvironment();
  platformOwners.add('director-account-0000000000000000');

  const ownerLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026' },
  });
  assert.equal(ownerLogin.status, 200);
  const { token: ownerToken, account: ownerAccount } = await ownerLogin.json();
  assert.equal(ownerAccount.role, 'owner');

  const missingPaymentConfirmation = await send(env, '/api/owner/directors', {
    method: 'POST',
    token: ownerToken,
    body: { fullName: 'New Director', email: 'new.director@example.com', phone: '+961 70 123 456', schoolName: 'New Learning School', paymentReceived: false },
  });
  assert.equal(missingPaymentConfirmation.status, 400);

  const created = await send(env, '/api/owner/directors', {
    method: 'POST',
    token: ownerToken,
    body: { fullName: 'New Director', email: 'new.director@example.com', phone: '+961 70 123 456', schoolName: 'New Learning School', paymentReceived: true },
  });
  assert.equal(created.status, 201);
  const { director, setupLink } = await created.json();
  assert.equal(director.schoolName, 'New Learning School');
  assert.equal(director.licenseActive, true);
  assert.equal(director.paid, true);
  assert.equal(director.setupPending, true);
  assert.match(setupLink, /directorSetup=/);
  assert.equal(new URL(setupLink).origin, env.APP_BASE_URL);
  assert.equal(new URL(setupLink).searchParams.get('schoolId'), director.schoolId);
  assert.equal(
    director.directorLink,
    `https://agenda.mycamp.workers.dev/new-learning-school?schoolId=${encodeURIComponent(director.schoolId)}`
  );
  assert.equal(director.username.startsWith('pending-'), true);

  const setupToken = new URL(setupLink).searchParams.get('directorSetup');
  const setupRecord = [...setupTokens.values()].find((row) => row.account_id === director.id);
  assert.ok(setupRecord);
  // Simulate a stale disable marker left by an interrupted/older setup attempt.
  accounts.get(director.id).phone_password_disabled_at = '2026-11-01 10:00:00';

  const claimed = await send(env, '/api/director/claim', {
    method: 'POST',
    body: { token: setupToken, username: 'new.director' },
  });
  assert.equal(claimed.status, 200);
  const { token: directorToken, account } = await claimed.json();
  assert.equal(account.role, 'director');
  assert.equal(account.username, 'new.director');
  assert.equal(account.schoolId, director.schoolId);
  assert.equal(accounts.get(director.id).phone_password_disabled_at, null);

  const replay = await send(env, '/api/director/claim', {
    method: 'POST',
    body: { token: setupToken, username: 'new.director' },
  });
  assert.equal(replay.status, 400);

  const stagedStatuses = await send(env, '/api/owner/directors/status', {
    method: 'PATCH', token: ownerToken,
    body: { updates: [{ id: director.id, activated: false, paid: false }] },
  });
  assert.equal(stagedStatuses.status, 200);
  const stagedStatusResult = await stagedStatuses.json();
  assert.deepEqual(stagedStatusResult.statuses, [{ id: director.id, activated: false, paid: false, phonePasswordReady: true }]);
  assert.equal(accounts.get(director.id).activated, 0);
  assert.equal(accounts.get(director.id).paid, 0);
  const blockedLogin = await send(env, '/api/auth/login', {
    method: 'POST', body: { username: 'new.director', password: '+961 70 123 456', schoolId: director.schoolId },
  });
  assert.equal(blockedLogin.status, 200);
  const pendingDirectorSession = await blockedLogin.json();
  assert.equal(pendingDirectorSession.chatOnly, true);
  assert.equal(pendingDirectorSession.account.role, 'director');
  const pendingDirectorProfile = await send(env, `/api/auth/me?schoolId=${director.schoolId}`, { token: pendingDirectorSession.token });
  assert.equal(pendingDirectorProfile.status, 200);
  assert.equal((await pendingDirectorProfile.json()).chatOnly, true);
  const blockedDirectorDashboard = await send(env, '/api/director/sessions', { token: pendingDirectorSession.token });
  assert.ok([401, 403].includes(blockedDirectorDashboard.status));
  const savedStatuses = await send(env, '/api/owner/directors/status', {
    method: 'PATCH', token: ownerToken,
    body: { updates: [{ id: director.id, activated: true, paid: true }] },
  });
  assert.equal(savedStatuses.status, 200, await savedStatuses.clone().text());
  assert.equal(accounts.get(director.id).activated, 1);
  assert.equal(accounts.get(director.id).paid, 1);
  assert.equal(accounts.get(director.id).phone_password_disabled_at, null);
  const savedStatusResult = await savedStatuses.json();
  assert.deepEqual(savedStatusResult.statuses, [{ id: director.id, activated: true, paid: true, phonePasswordReady: true }]);
  // Legacy data may have password_must_change=0; the independent phone-password
  // flag still permits the phone credential until a personal password is saved.
  accounts.get(director.id).password_must_change = 0;
  const directorLogin = await send(env, '/api/auth/login', {
    method: 'POST', body: { username: 'new.director', password: '+961 70 123 456', schoolId: director.schoolId },
  });
  assert.equal(directorLogin.status, 200);
  const directorLoginResult = await directorLogin.json();
  assert.equal(directorLoginResult.account.role, 'director');
  assert.equal(directorLoginResult.account.mustChangePassword, true);
  assert.equal(accounts.get(director.id).password_must_change, 1);
  const phoneReset = await send(env, `/api/owner/directors/${director.id}/reset-phone-password`, {
    method: 'POST', token: ownerToken,
  });
  assert.equal(phoneReset.status, 200);
  assert.equal(accounts.get(director.id).password_must_change, 1);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const wrongPassword = await send(env, '/api/auth/login', {
      method: 'POST', body: { username: 'new.director', password: 'incorrect', schoolId: director.schoolId },
    });
    assert.equal(wrongPassword.status, 401);
    assert.deepEqual(await wrongPassword.json(), { error: 'Invalid username or password.' });
  }
  const phoneLoginAfterFailedAttempts = await send(env, '/api/auth/login', {
    method: 'POST', body: { username: 'new.director', password: '+961 70 123 456', schoolId: director.schoolId },
  });
  assert.equal(phoneLoginAfterFailedAttempts.status, 200);
  const normalizedPhoneLogin = await send(env, '/api/auth/login', {
    method: 'POST', body: { username: 'new.director', password: '70 123 456', schoolId: director.schoolId },
  });
  assert.equal(normalizedPhoneLogin.status, 200);
  const trunkZeroPhoneLogin = await send(env, '/api/auth/login', {
    method: 'POST', body: { username: 'new.director', password: '070123456', schoolId: director.schoolId },
  });
  assert.equal(trunkZeroPhoneLogin.status, 200);
  const currentDirector = await send(env, `/api/auth/me?schoolId=${director.schoolId}`, { token: directorToken });
  assert.equal(currentDirector.status, 200);
  assert.equal((await currentDirector.json()).account.role, 'director');
  const profile = await send(env, '/api/director/profile', { token: directorToken });
  assert.equal(profile.status, 200);
  assert.equal((await profile.json()).profile.schoolName, 'New Learning School');
  const passwordChanged = await send(env, '/api/director/profile', {
    method: 'PATCH', token: directorToken,
    body: { schoolName: 'New Learning School', username: 'nostafa.director', password: 'NewPrivatePassword#2026', schoolId: director.schoolId },
  });
  assert.equal(passwordChanged.status, 200);
  assert.equal(accounts.get(director.id).password_must_change, 0);
  assert.ok(accounts.get(director.id).phone_password_disabled_at);
  const changedProfileResult = await passwordChanged.json();
  assert.equal(changedProfileResult.profile.username, 'nostafa.director');
  const changedTokenClaims = JSON.parse(Buffer.from(changedProfileResult.token.split('.')[0], 'base64url').toString());
  assert.equal(changedTokenClaims.username, 'nostafa.director');

  // A logout is stateless server-side: verify a new login request after the
  // profile/password update using the renamed username and chosen password.
  const reloginAfterLogout = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'nostafa.director', password: 'NewPrivatePassword#2026', schoolId: director.schoolId },
  });
  assert.equal(reloginAfterLogout.status, 200);
  const staleUsernameLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'new.director', password: 'NewPrivatePassword#2026', schoolId: director.schoolId },
  });
  assert.equal(staleUsernameLogin.status, 401);
  const oldPhoneAfterPasswordChange = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'nostafa.director', password: '+961 70 123 456', schoolId: director.schoolId },
  });
  assert.equal(oldPhoneAfterPasswordChange.status, 401);

  const ownerRows = await send(env, '/api/owner/directors', { token: ownerToken });
  assert.equal(ownerRows.status, 200);
  const listedDirector = (await ownerRows.json()).directors.find((item) => item.id === director.id);
  assert.equal(listedDirector.fullName, 'New Director');
  assert.equal(listedDirector.createdAt, '2026-11-03 10:00:00');
  assert.equal(listedDirector.activated, true);
  assert.equal(listedDirector.paid, true);

  const disabledAndUnpaid = await send(env, `/api/owner/directors/${director.id}`, {
    method: 'PATCH',
    token: ownerToken,
    body: { activated: false, paid: false },
  });
  assert.equal(disabledAndUnpaid.status, 200, JSON.stringify(await disabledAndUnpaid.clone().json()));
  const updatedRows = await send(env, '/api/owner/directors', { token: ownerToken });
  const updatedDirector = (await updatedRows.json()).directors.find((item) => item.id === director.id);
  assert.equal(updatedDirector.activated, false);
  assert.equal(updatedDirector.paid, false);

  const blockedDirectorLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'nostafa.director', password: 'NewPrivatePassword#2026', schoolId: director.schoolId },
  });
  assert.equal(blockedDirectorLogin.status, 200);
  const limitedDirectorSession = await blockedDirectorLogin.json();
  assert.equal(limitedDirectorSession.chatOnly, true);
  assert.equal(limitedDirectorSession.account.role, 'director');
  const limitedDirectorProfile = await send(env, `/api/auth/me?schoolId=${director.schoolId}`, { token: limitedDirectorSession.token });
  assert.equal(limitedDirectorProfile.status, 200);
  assert.equal((await limitedDirectorProfile.json()).chatOnly, true);
  const limitedDirectorDashboard = await send(env, '/api/director/profile', { token: limitedDirectorSession.token });
  assert.equal(limitedDirectorDashboard.status, 401);
  const blockedExistingSession = await send(env, '/api/director/profile', { token: directorToken });
  assert.equal(blockedExistingSession.status, 401);

  const restored = await send(env, `/api/owner/directors/${director.id}`, {
    method: 'PATCH',
    token: ownerToken,
    body: { activated: true, paid: true },
  });
  assert.equal(restored.status, 200);
  const upgradedProfile = await send(env, `/api/auth/me?schoolId=${director.schoolId}`, {
    token: limitedDirectorSession.token,
  });
  assert.equal(upgradedProfile.status, 200);
  const upgradedDirectorSession = await upgradedProfile.json();
  assert.equal(upgradedDirectorSession.chatOnly, false);
  assert.ok(upgradedDirectorSession.token);

  const restoredLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'nostafa.director', password: 'NewPrivatePassword#2026', schoolId: director.schoolId },
  });
  assert.equal(restoredLogin.status, 200);
});

test('Public Director registration saves chosen password and signs in by email after Owner approval', async () => {
  const { env, accounts, schools, platformOwners, attempts } = fakeEnvironment();
  platformOwners.add('director-account-0000000000000000');
  const registration = await send(env, '/api/director/register', {
    method: 'POST',
    body: {
      fullName: 'New School Director',
      schoolName: 'New School',
      email: 'director@newschool.example',
      phone: '+961 70 123 456',
      password: 'x',
    },
  });
  assert.equal(registration.status, 201, await registration.clone().text());
  const created = await registration.json();
  assert.equal(created.director.activated, false);
  assert.equal(created.director.paid, false);

  const account = accounts.get(created.director.id);
  assert.ok(account);
  const school = schools.get(account.school_id);
  assert.equal(created.schoolId, school.id);
  assert.equal(
    created.directorLink,
    `https://agenda.mycamp.workers.dev/new-school?schoolId=${encodeURIComponent(school.id)}`
  );
  assert.equal(account.role, 'director');
  assert.equal(account.activated, 0);
  assert.equal(account.paid, 0);
  assert.equal(school.license_active, 0);
  assert.ok(account.password_hash.startsWith('pbkdf2_sha256$'));

  // A different account username must never shadow an exact Director email.
  accounts.set('unrelated-account', {
    id: 'unrelated-account',
    username: 'director@newschool.example',
    password_hash: 'not-the-director-password',
    role: 'educator',
    school_id: 'default-agenda-school',
    full_name: 'Unrelated Educator',
    email: '',
    phone: '',
    school_or_subject: '',
    grade_id: 'eb8',
    registered_session_id: 'test-registration-session',
    created_at: '2026-11-18 10:00:00',
    expires_at: null,
    activated: 1,
    paid: 1,
  });
  const pendingLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: ' DIRECTOR@NEWSCHOOL.EXAMPLE ', password: 'x', schoolId: created.schoolId },
  });
  assert.equal(pendingLogin.status, 200);
  const pendingEmailSession = await pendingLogin.json();
  assert.equal(pendingEmailSession.chatOnly, true);
  assert.equal(pendingEmailSession.account.role, 'director');

  // No separate username is collected on public Director registration. The
  // Director can also enter their exact full name, with the same password.
  const fullNamePendingLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: '  New School Director  ', password: 'x', schoolId: created.schoolId },
  });
  assert.equal(fullNamePendingLogin.status, 200);
  const pendingNameSession = await fullNamePendingLogin.json();
  assert.equal(pendingNameSession.chatOnly, true);
  assert.equal(pendingNameSession.account.role, 'director');

  const ownerLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026' },
  });
  assert.equal(ownerLogin.status, 200);
  const { token: ownerToken } = await ownerLogin.json();

  const approval = await send(env, '/api/owner/directors/status', {
    method: 'PATCH',
    token: ownerToken,
    body: { updates: [{ id: account.id, activated: true, paid: true }] },
  });
  assert.equal(approval.status, 200, await approval.clone().text());

  // Prior failed attempts must not reject the correct saved password.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    attempts.push({ username: 'director@newschool.example', succeeded: false });
  }
  const approvedLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director@newschool.example', password: 'x', schoolId: created.schoolId },
  });
  assert.equal(approvedLogin.status, 200);
  const approvedLoginResult = await approvedLogin.json();
  assert.equal(approvedLoginResult.account.role, 'director');
  assert.equal(
    approvedLoginResult.directorLink,
    `https://agenda.mycamp.workers.dev/new-school?schoolId=${encodeURIComponent(created.schoolId)}`
  );

  const differentSchoolEntryLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director@newschool.example', password: 'x', schoolId: 'another-school-entry' },
  });
  assert.equal(differentSchoolEntryLogin.status, 200);
  assert.equal(
    (await differentSchoolEntryLogin.json()).directorLink,
    `https://agenda.mycamp.workers.dev/new-school?schoolId=${encodeURIComponent(created.schoolId)}`
  );

  const agendaEntryLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director@newschool.example', password: 'x', schoolId: 'default-agenda-school' },
  });
  assert.equal(agendaEntryLogin.status, 200);
  const agendaEntryResult = await agendaEntryLogin.json();
  assert.equal(
    agendaEntryResult.directorLink,
    `https://agenda.mycamp.workers.dev/new-school?schoolId=${encodeURIComponent(created.schoolId)}`
  );
  const approvedToken = approvedLoginResult.token;
  // If a Director's token is present while the current tab still shows
  // Agenda (or a different school A), session restore returns the canonical
  // school B link so the frontend can replace the current tab immediately.
  const directorSessionOnAgenda = await send(env, '/api/auth/me?schoolId=default-agenda-school', { token: approvedToken });
  assert.equal(directorSessionOnAgenda.status, 200);
  const agendaRestore = await directorSessionOnAgenda.json();
  assert.equal(agendaRestore.account.schoolId, created.schoolId);
  assert.equal(agendaRestore.schoolSwitchRequired, true);
  assert.equal(
    agendaRestore.directorLink,
    `https://agenda.mycamp.workers.dev/new-school?schoolId=${encodeURIComponent(created.schoolId)}`
  );
  const directorSessionOnSchool = await send(
    env,
    `/api/auth/me?schoolId=${encodeURIComponent(created.schoolId)}`,
    { token: approvedToken },
  );
  assert.equal(directorSessionOnSchool.status, 200);
  const ownSchoolRestore = await directorSessionOnSchool.json();
  assert.equal(ownSchoolRestore.account.schoolId, created.schoolId);
  assert.equal(ownSchoolRestore.schoolSwitchRequired, false);

  const directorRestoreWithoutSchool = await send(env, '/api/auth/me', { token: approvedToken });
  assert.equal(directorRestoreWithoutSchool.status, 200);
  assert.equal((await directorRestoreWithoutSchool.json()).account.schoolId, created.schoolId);

  const fullNameLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'New School Director', password: 'x', schoolId: created.schoolId },
  });
  assert.equal(fullNameLogin.status, 200);
  assert.equal((await fullNameLogin.json()).account.role, 'director');
});

test('Student and educator accounts can only sign in and restore sessions on their own school link', async () => {
  const { env, accounts, schools } = fakeEnvironment();
  schools.set('school-two', {
    id: 'school-two',
    name: 'School Two',
    director_id: 'school-two-director',
    license_active: 1,
  });
  const passwordHash = hashPassword('student-pass');
  accounts.set('school-two-student', {
    id: 'school-two-student',
    username: 'schooltwo.student',
    password_hash: passwordHash,
    role: 'student',
    school_id: 'school-two',
    full_name: 'School Two Student',
    email: 'student@schooltwo.example',
    phone: '',
    school_or_subject: '',
    grade_id: 'eb8',
    student_grade_label: 'EB8',
    registered_session_id: 'school-two-session',
    registered_educator_id: null,
    created_at: '2026-11-18 10:00:00',
    expires_at: '2027-11-18 10:00:00',
    activated: 1,
    paid: 1,
  });

  const wrongSchoolLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'schooltwo.student', password: 'student-pass', schoolId: 'default-agenda-school' },
  });
  assert.equal(wrongSchoolLogin.status, 403);
  assert.match((await wrongSchoolLogin.json()).error, /belongs to another school/i);

  const correctSchoolLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'schooltwo.student', password: 'student-pass', schoolId: 'school-two' },
  });
  assert.equal(correctSchoolLogin.status, 200);
  const { token } = await correctSchoolLogin.json();

  const wrongSchoolRestore = await send(env, '/api/auth/me?schoolId=default-agenda-school', { token });
  assert.equal(wrongSchoolRestore.status, 401);
  const correctSchoolRestore = await send(env, '/api/auth/me?schoolId=school-two', { token });
  assert.equal(correctSchoolRestore.status, 200);
});

test('Two users in the same school can stay signed in at the same time', async () => {
  const { env, accounts, schools } = fakeEnvironment();
  schools.set('shared-school', {
    id: 'shared-school',
    name: 'Shared School',
    director_id: 'shared-school-director',
    license_active: 1,
  });

  const commonPassword = 'shared-school-password';
  const passwordHash = hashPassword(commonPassword);
  for (const [id, username, fullName] of [
    ['shared-student-one', 'student.one', 'Student One'],
    ['shared-student-two', 'student.two', 'Student Two'],
  ]) {
    accounts.set(id, {
      id,
      username,
      password_hash: passwordHash,
      role: 'student',
      school_id: 'shared-school',
      full_name: fullName,
      email: `${username}@shared-school.example`,
      phone: '',
      school_or_subject: 'Shared School',
      grade_id: 'eb8',
      student_grade_label: 'EB8',
      registered_session_id: 'shared-school-session',
      registered_educator_id: null,
      created_at: '2026-11-19 08:00:00',
      expires_at: '2027-11-19 08:00:00',
      activated: 1,
      paid: 1,
    });
  }

  const [firstLogin, secondLogin] = await Promise.all([
    send(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'student.one', password: commonPassword, schoolId: 'shared-school' },
    }),
    send(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'student.two', password: commonPassword, schoolId: 'shared-school' },
    }),
  ]);

  assert.equal(firstLogin.status, 200);
  assert.equal(secondLogin.status, 200);
  const [{ token: firstToken }, { token: secondToken }] = await Promise.all([
    firstLogin.json(),
    secondLogin.json(),
  ]);
  assert.notEqual(firstToken, secondToken);

  // Signing in the second account must not replace/revoke the first account's
  // independent session. Both browsers can restore their own identity.
  const [firstRestore, secondRestore] = await Promise.all([
    send(env, '/api/auth/me?schoolId=shared-school', { token: firstToken }),
    send(env, '/api/auth/me?schoolId=shared-school', { token: secondToken }),
  ]);
  assert.equal(firstRestore.status, 200);
  assert.equal(secondRestore.status, 200);
  assert.equal((await firstRestore.json()).account.id, 'shared-student-one');
  assert.equal((await secondRestore.json()).account.id, 'shared-student-two');
});

test('Educators are also blocked from signing into a different school', async () => {
  const { env, accounts, schools } = fakeEnvironment();
  schools.set('school-three', { id: 'school-three', name: 'School Three', director_id: 'other-director' });
  accounts.set('school-three-educator', {
    id: 'school-three-educator',
    username: 'schoolthree.educator',
    password_hash: hashPassword('educator-pass'),
    role: 'educator',
    school_id: 'school-three',
    full_name: 'School Three Educator',
    email: 'educator@schoolthree.example',
    phone: '',
    school_or_subject: 'Science',
    grade_id: 'eb8',
    student_grade_label: '',
    registered_session_id: null,
    registered_educator_id: null,
    created_at: '2026-11-18 10:00:00',
    expires_at: '2027-11-18 10:00:00',
    activated: 1,
    paid: 1,
  });
  const response = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'schoolthree.educator', password: 'educator-pass', schoolId: 'default-agenda-school' },
  });
  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /belongs to another school/i);
});

test('A platform Owner can sign in and restore Owner access from any school context', async () => {
  const { env, platformOwners } = fakeEnvironment();
  platformOwners.add('director-account-0000000000000000');
  const login = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026', schoolId: 'school-two' },
  });
  assert.equal(login.status, 200);
  const { account, token } = await login.json();
  assert.equal(account.role, 'owner');

  const restored = await send(env, '/api/auth/me?schoolId=school-two', { token });
  assert.equal(restored.status, 200);
  assert.equal((await restored.json()).account.role, 'owner');

  const ownerDashboard = await send(env, '/api/owner/directors', { token });
  assert.equal(ownerDashboard.status, 200);
});

test('Only the platform Owner can create Director schools', async () => {
  const { env } = fakeEnvironment();
  const response = await send(env, '/api/owner/directors', {
    method: 'POST',
    body: {
      username: 'blocked.director',
      password: 'TemporaryDirectorPassword#2026',
      fullName: 'Blocked Director',
      email: 'blocked@example.com',
      schoolName: 'Blocked School',
      paymentReceived: true,
    },
  });
  assert.equal(response.status, 401);
});

test('Director login reads persisted role tables and saves status updates', async () => {
  const { env } = fakeEnvironment();
  const registration = {
    username: 'educator.one',
    password: 'A-long-password-2026',
    role: 'educator',
    fullName: 'Educator One',
    email: 'educator@example.com',
    phone: '',
    schoolOrSubject: 'Mathematics',
    gradeId: 'eb8',
    className: 'Mathematics Class EB8',
  };
  await send(env, '/api/auth/register', { method: 'POST', body: registration });

  const login = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026' },
  });
  assert.equal(login.status, 200);
  const { token } = await login.json();
  const dashboard = await send(env, '/api/director/accounts', { token });
  const lists = await dashboard.json();
  assert.equal(lists.students.length, 0);
  assert.equal(lists.educators.length, 2);
  const educatorAccount = lists.educators.find((item) => item.username === 'educator.one');
  assert.ok(educatorAccount);

  const updated = await send(env, `/api/director/accounts/${educatorAccount.id}`, {
    method: 'PATCH',
    token,
    body: { activated: false, paid: true, registeredSessionId: 'test-registration-session' },
  });
  assert.equal(updated.status, 200);
  const { account } = await updated.json();
  assert.equal(account.activated, false);
  assert.equal(account.paid, true);
  assert.notEqual(account.registeredSessionId, 'test-registration-session');

  const renewed = await send(env, `/api/director/accounts/${account.id}`, {
    method: 'PATCH',
    token,
    body: { activated: true, renew: true, password: 'new pass !' },
  });
  assert.equal(renewed.status, 200);
  assert.equal((await renewed.json()).account.expiresAt, '2026-12-03 10:00:00');
  const relogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'educator.one', password: 'new pass !' },
  });
  assert.equal(relogin.status, 200);

  const denied = await send(env, '/api/director/accounts');
  assert.equal(denied.status, 401);
});

test('Platform Owner can manage only the school owned by their Director account', async () => {
  const { env, platformOwners } = fakeEnvironment();
  platformOwners.add('director-account-0000000000000000');

  const login = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026' },
  });
  assert.equal(login.status, 200);
  const { account, token } = await login.json();
  assert.equal(account.role, 'owner');

  const profile = await send(env, '/api/director/profile', { token });
  assert.equal(profile.status, 200);
  assert.deepEqual(await profile.json(), {
    profile: {
      schoolId: 'default-agenda-school',
      schoolName: 'Agenda',
      username: 'director',
    },
  });

  const dashboard = await send(env, '/api/director/accounts', { token });
  assert.equal(dashboard.status, 200);

  // Owner identity remains Owner for platform-level routes.
  const ownerDashboard = await send(env, '/api/owner/directors', { token });
  assert.equal(ownerDashboard.status, 200);
});

test('A platform Owner without a Director-owned school cannot use Director endpoints', async () => {
  const { env, accounts, platformOwners } = fakeEnvironment();
  const educator = accounts.get('00000000-0000-4000-8000-000000000001');
  educator.password_hash = hashPassword('PlatformOwnerPassword#2026');
  platformOwners.add(educator.id);

  const login = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'assigned.educator', password: 'PlatformOwnerPassword#2026' },
  });
  assert.equal(login.status, 200);
  const { account, token } = await login.json();
  assert.equal(account.role, 'owner');

  const profile = await send(env, '/api/director/profile', { token });
  assert.equal(profile.status, 401);
});

test('Director can save a live session and the grade catalog returns its playback URL', async () => {
  const { env, accounts, sessions: sessionMap } = fakeEnvironment();
  const login = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026' },
  });
  const { token: directorToken } = await login.json();
  const saved = await send(env, '/api/director/sessions', {
    method: 'POST',
    token: directorToken,
    body: {
      sessions: [{
        id: 'live-eb8-math',
        gradeId: 'eb8',
        subject: 'Mathematics',
        title: 'Live algebra lesson',
        sourceName: 'Agenda Classroom',
        sourceUrl: 'https://example.org/live',
        playbackUrl: 'https://example.org/live/video',
        isLive: true,
        liveStartsAt: '2026-11-03T10:00:00Z',
      }],
    },
  });
  assert.equal(saved.status, 201);

  env.DB; // The fake environment shares the mutable account map used by the Worker.
  const liveEducator = {
    id: 'live-session-educator',
    username: 'live.educator',
    password_hash: 'unused',
    role: 'educator',
    school_id: 'default-agenda-school',
    full_name: 'Live Educator',
    email: 'live.educator@example.com',
    phone: '',
    school_or_subject: 'Mathematics',
    grade_id: 'eb8',
    registered_session_id: 'live-eb8-math',
    created_at: '2026-11-03 09:03:00',
    expires_at: null,
    activated: 1,
    paid: 1,
  };
  accounts.set(liveEducator.id, liveEducator);
  const registration = await send(env, '/api/auth/register', {
    method: 'POST',
    body: {
      username: 'live.student',
      password: 'live session password',
      role: 'student',
      fullName: 'Live Student',
      email: 'live@example.com',
      phone: '',
      schoolOrSubject: 'Grade 8',
      registeredSessionId: 'live-eb8-math',
    },
  });
  assert.equal(registration.status, 201);
  const { account, token } = await registration.json();
  const blockedBeforeActivation = await send(env, '/api/sessions?gradeId=eb8&live=true&sessionId=live-eb8-math', { token });
  assert.equal(blockedBeforeActivation.status, 401);

  await send(env, `/api/director/accounts/${account.id}`, {
    method: 'PATCH',
    token: directorToken,
    body: { activated: true, paid: true },
  });
  const anonymous = await send(env, '/api/sessions?gradeId=eb8&live=true&sessionId=live-eb8-math');
  assert.equal(anonymous.status, 401);
  // Re-authenticate after approval; a token created before approval is still
  // intentionally limited to Founder chat.
  const activatedLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'live.student', password: 'live session password', schoolId: 'default-agenda-school' },
  });
  assert.equal(activatedLogin.status, 200);
  const { token: activeToken, chatOnly } = await activatedLogin.json();
  assert.notEqual(chatOnly, true);
  sessionMap.get('test-registration-session').is_live = 1;
  const wrongSession = await send(env, '/api/sessions?gradeId=eb8&live=true&sessionId=test-registration-session', { token: activeToken });
  assert.equal(wrongSession.status, 403);

  const response = await send(env, '/api/sessions?gradeId=eb8&live=true&sessionId=live-eb8-math', { token: activeToken });
  const { sessions } = await response.json();
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].isLive, true);
  assert.equal(sessions[0].playbackUrl, 'https://example.org/live/video');
  const liveStatus = await send(env, '/api/live-stream?sessionId=live-eb8-math', { token: activeToken });
  const liveCredentials = await liveStatus.json();
  assert.equal(liveStatus.status, 200);
  assert.equal(liveCredentials.status, 'waiting');
    assert.equal(liveCredentials.callId, 'live-eb8-math');
  assert.equal(liveCredentials.apiKey, 'test-stream-video-key');

  const videoTokenPayload = JSON.parse(
    Buffer.from(
      liveCredentials.token.split('.')[1],
      'base64url'
    ).toString()
  );

  assert.deepEqual(
  videoTokenPayload.call_cids,
  ['default:live-eb8-math']
);
  assert.equal('STREAM_VIDEO_API_SECRET' in liveCredentials, false);
  const [header, payload, signature] = liveCredentials.token.split('.');
  assert.equal(
    signature,
    createHmac('sha256', 'test-stream-video-secret-with-sufficient-length')
      .update(`${header}.${payload}`)
      .digest('base64url'),
  );
});

test('Director can list and delete stored sessions', async () => {
  const { env } = fakeEnvironment();
  const login = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026' },
  });
  const { token } = await login.json();
  const saved = await send(env, '/api/director/sessions', {
    method: 'POST',
    token,
    body: {
      sessions: [{
        id: 'resource-eb8-science',
        gradeId: 'eb8',
        subject: 'Science',
        title: 'Ecosystems',
        sourceName: 'Khan Academy',
        sourceUrl: 'https://www.khanacademy.org/science',
      }],
    },
  });
  assert.equal(saved.status, 201);
  const listed = await send(env, '/api/director/sessions', { token });
  assert.ok((await listed.json()).sessions.some((session) => session.id === 'resource-eb8-science'));
  const deleted = await send(env, '/api/director/sessions/resource-eb8-science', { method: 'DELETE', token });
  assert.equal(deleted.status, 200);
  assert.deepEqual(await deleted.json(), { deleted: true });
  const afterDelete = await send(env, '/api/director/sessions', { token });
  assert.equal((await afterDelete.json()).sessions.some((session) => session.id === 'resource-eb8-science'), false);
});

test('Director can obtain a call-scoped host token for the shared livestream', async () => {
  const { env } = fakeEnvironment();
  const login = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026' },
  });
  const { token } = await login.json();
  const setup = await send(env, '/api/director/live-stream', { method: 'POST', token });
  assert.equal(setup.status, 200);
  const credentials = await setup.json();
  assert.equal(credentials.callId, 'agenda-shared-classroom');
  assert.equal(credentials.userId, 'director-account-0000000000000000');
  const videoTokenPayload = JSON.parse(Buffer.from(credentials.token.split('.')[1], 'base64url').toString());
  assert.equal(videoTokenPayload.role, 'admin');
  assert.deepEqual(videoTokenPayload.call_cids, ['livestream:agenda-shared-classroom']);
  assert.equal('STREAM_VIDEO_API_SECRET' in credentials, false);
});

test('live-video setup reports missing provider credentials explicitly', async () => {
  const { env } = fakeEnvironment();
  delete env.STREAM_VIDEO_API_KEY;
  delete env.STREAM_VIDEO_API_SECRET;
  const login = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026' },
  });
  const { token } = await login.json();
  const response = await send(env, '/api/director/live-stream', { method: 'POST', token });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /Stream Video credentials/i);
});

test('live stream endpoint rejects users without an assigned activated session', async () => {
  const { env } = fakeEnvironment();
  const response = await send(env, '/api/live-stream?sessionId=test-registration-session');
  assert.equal(response.status, 401);
});

test('Director accounts, sessions, and monthly grade prices are isolated by owned school', async () => {
  const { env, accounts, schools, sessions, pricing } = fakeEnvironment();
  const secondPassword = 'DirectorTwoPassword#2026';
  schools.set('school-two', { id: 'school-two', name: 'Second School', director_id: 'director-account-two' });
  accounts.set('director-account-two', {
    id: 'director-account-two',
    username: 'director.two',
    password_hash: hashPassword(secondPassword),
    role: 'director',
    school_id: 'school-two',
    full_name: 'Second Director',
    email: '',
    phone: '',
    school_or_subject: '',
    grade_id: '',
    registered_session_id: null,
    created_at: '2026-11-03 09:01:00',
    expires_at: null,
    activated: 1,
    paid: 1,
  });
  accounts.set('educator-two', {
    id: 'educator-two',
    username: 'educator.two',
    password_hash: hashPassword('EducatorTwoPassword#2026'),
    role: 'educator',
    school_id: 'school-two',
    full_name: 'Educator Two',
    email: 'educator.two@example.com',
    phone: '',
    school_or_subject: 'Science',
    grade_id: 'eb8',
    registered_session_id: 'other-school-session',
    created_at: '2026-11-03 09:02:00',
    expires_at: '2026-12-03 10:00:00',
    activated: 1,
    paid: 1,
  });
  sessions.set('other-school-session', {
    id: 'other-school-session',
    school_id: 'school-two',
    grade_id: 'eb8',
    subject: 'Science',
    title: 'Other school class',
    teacher_name: 'Educator Two',
    source_name: 'Agenda',
    source_url: 'https://example.org/other',
    playback_url: 'https://example.org/other/video',
    media_key: null,
    is_live: 0,
    live_starts_at: null,
  });

  const firstLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026' },
  });
  const { token: firstToken } = await firstLogin.json();
  const firstAccounts = await send(env, '/api/director/accounts', { token: firstToken });
  const firstAccountData = await firstAccounts.json();
  assert.equal(firstAccounts.status, 200);
  assert.equal(firstAccountData.educators.some((account) => account.id === 'educator-two'), false);

  const firstSessions = await send(env, '/api/director/sessions', { token: firstToken });
  const firstSessionData = await firstSessions.json();
  assert.equal(firstSessionData.sessions.some((session) => session.id === 'other-school-session'), false);

  const savedPrice = await send(env, '/api/director/pricing', {
    method: 'PUT',
    token: firstToken,
    body: { gradeId: 'eb8', monthlyRateUsd: 500 },
  });
  assert.equal(savedPrice.status, 200);
  assert.equal((await savedPrice.json()).price.monthlyRateUsd, 500);

  const firstPricing = await send(env, '/api/director/pricing', { token: firstToken });
  assert.equal((await firstPricing.json()).prices[0].monthlyRateUsd, 500);

  const secondLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director.two', password: secondPassword, schoolId: 'school-two' },
  });
  const { token: secondToken } = await secondLogin.json();
  const secondPricing = await send(env, '/api/director/pricing', { token: secondToken });
  assert.deepEqual((await secondPricing.json()).prices, []);

  const context = await send(env, '/api/school-context?schoolId=default-agenda-school');
  const contextData = await context.json();
  assert.equal(contextData.schoolName, 'Agenda');
  assert.equal(contextData.prices.find((price) => price.gradeId === 'eb8').monthlyRateUsd, 500);
  assert.equal(pricing.get('default-agenda-school:eb8').monthly_rate_usd, 500);
});
