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
        return { id: account.id, school_id: account.school_id };
      }
      if (this.sql.includes('FROM director_setup_tokens')) {
        const record = setupTokens.get(this.values[0]);
        if (!record || record.used_at) return null;
        const account = accounts.get(record.account_id);
        return account ? { id: account.id, username: account.username, role: account.role, school_id: account.school_id } : null;
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
      if (this.sql.includes('SELECT id FROM accounts WHERE username')) {
        const account = [...accounts.values()].find((item) => item.username.toLowerCase() === this.values[0].toLowerCase());
        return account ? { id: account.id } : null;
      }
      if (this.sql.includes('SELECT COUNT(*) AS count FROM login_attempts')) {
        const recent = attempts.filter((item) => item.username === this.values[0].toLowerCase() && !item.succeeded);
        return { count: recent.length };
      }
      if (this.sql.includes('SELECT * FROM accounts WHERE username')) {
        return [...accounts.values()].find((item) => item.username.toLowerCase() === this.values[0].toLowerCase()) || null;
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
      if (this.sql.includes("FROM accounts a") && this.sql.includes("INNER JOIN schools s ON s.director_id = a.id")) {
        const results = [...accounts.values()]
          .filter((account) => {
            const school = schools.get(account.school_id);
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
        const [id, username, password_hash, role, school_id, full_name, email, phone, school_or_subject, grade_id, registered_session_id] = this.values;
        if ([...accounts.values()].some((item) => item.username.toLowerCase() === username.toLowerCase())) {
          throw new Error('UNIQUE constraint failed: accounts.username');
        }
        const isDirectorCreation = this.sql.includes("datetime('now', '+1 year')");
        accounts.set(id, {
          id, username, password_hash, role, school_id, full_name, email, phone, school_or_subject, grade_id, registered_session_id,
          created_at: '2026-11-03 10:00:00',
          expires_at: isDirectorCreation ? '2027-11-17 10:00:00' : '2026-12-03 10:00:00',
          activated: isDirectorCreation ? 1 : 0,
          paid: isDirectorCreation ? 1 : 0,
        });
        return { meta: { changes: 1 } };
      }
      if (this.sql.includes('INSERT INTO login_attempts')) {
        attempts.push({ username: this.values[0].toLowerCase(), succeeded: Boolean(this.values[1]) });
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('DELETE FROM login_attempts')) {
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
      if (this.sql.startsWith('INSERT INTO schools')) {
        const [id, name, director_id] = this.values;
        schools.set(id, { id, name, director_id, license_expires_at: '2027-11-17 10:00:00', license_active: 1 });
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('UPDATE schools SET name')) {
        const school = schools.get(this.values[1]);
        if (school && (!this.values[2] || school.director_id === this.values[2])) school.name = this.values[0];
        return { meta: { changes: school ? 1 : 0 } };
      }
      if (this.sql.startsWith('UPDATE accounts SET username = ?, password_hash = ?')) {
        const [username, password_hash, id] = this.values;
        const account = accounts.get(id);
        if (!account || account.role !== 'director') return { meta: { changes: 0 } };
        account.username = username;
        account.password_hash = password_hash;
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('UPDATE accounts SET') && this.sql.includes('WHERE id = ?') && !this.sql.includes('username = ?')) {
        const id = this.values[this.values.length - 1];
        const account = accounts.get(id);
        if (!account || account.role !== 'director') return { meta: { changes: 0 } };
        let valueIndex = 0;
        if (this.sql.includes('activated = ?')) account.activated = this.values[valueIndex++];
        if (this.sql.includes('paid = ?')) account.paid = this.values[valueIndex++];
        if (this.sql.includes("expires_at = datetime('now', '+1 year')")) account.expires_at = '2027-11-17 10:00:00';
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('UPDATE schools SET') && this.sql.includes('WHERE id = ?')) {
        const id = this.values[this.values.length - 1];
        const school = schools.get(id);
        if (!school) return { meta: { changes: 0 } };
        let valueIndex = 0;
        if (this.sql.includes('license_active = ?')) school.license_active = this.values[valueIndex++];
        if (this.sql.includes("license_expires_at = datetime('now', '+1 year')")) school.license_expires_at = '2027-11-17 10:00:00';
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
        if (statement.sql.includes("INTO sessions")) {
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
      ALLOWED_ORIGINS: 'https://malazhub.github.io',
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

  const options = await worker.fetch(new Request('https://agenda-api.test/api/auth/register', {
    method: 'OPTIONS',
    headers: { Origin: 'https://malazhub.github.io' },
  }), env);
  assert.equal(options.status, 204);
  assert.equal(options.headers.get('access-control-allow-origin'), 'https://malazhub.github.io');
});

test('registration hashes credentials and rejects duplicate usernames', async () => {
  const { env, accounts, sessions } = fakeEnvironment();
  const registration = {
    username: 'learner.one',
    password: 'x !',
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
  assert.equal('password_hash' in result.account, false);
  assert.ok(result.account.expiresAt);
  assert.equal(accounts.get(result.account.id).password_hash.startsWith('pbkdf2_sha256$'), true);

  const invalidSession = await send(env, '/api/auth/register', {
    method: 'POST',
    body: { ...registration, username: 'learner.invalid', registeredSessionId: 'missing-session' },
  });
  assert.equal(invalidSession.status, 400);
  assert.match((await invalidSession.json()).error, /choose a valid session/i);

  const registrationSessions = await send(env, '/api/registration/sessions');
  assert.equal(registrationSessions.status, 200);
  assert.ok((await registrationSessions.json()).sessions.some((session) => session.id === 'test-registration-session'));

  const pendingLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: registration.username, password: registration.password },
  });
  assert.equal(pendingLogin.status, 401);

  const legacyAccount = accounts.get(result.account.id);
  legacyAccount.registered_session_id = null;
  legacyAccount.grade_id = '';
  const retry = await send(env, '/api/auth/register', { method: 'POST', body: registration });
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).account.activated, false);
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
  const login = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: registration.username, password: registration.password },
  });
  assert.equal(login.status, 200);
  sessions.get(registration.registeredSessionId).is_live = 1;
  const sharedStream = await send(env, `/api/live-stream?sessionId=${registration.registeredSessionId}`, {
    token: (await login.json()).token,
  });
  assert.equal(sharedStream.status, 200);
  assert.equal((await sharedStream.json()).status, 'waiting');
});

test('grade registration loads available grades and grants grade-scoped live access', async () => {
  const { env, accounts, sessions } = fakeEnvironment();
  const grades = await send(env, '/api/registration/grades');
  assert.equal(grades.status, 200);
  assert.deepEqual(await grades.json(), { grades: ['eb8'] });

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
      registeredSessionId: 'test-registration-session',
    },
  });
  assert.equal(registration.status, 201);
  const { account, token } = await registration.json();
  assert.equal(account.gradeId, 'eb8');
  assert.equal(account.registeredSessionId, 'test-registration-session');
  assert.equal(accounts.get(account.id).grade_id, 'eb8');

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
  sessions.get('test-registration-session').is_live = 1;
  const liveStatus = await send(env, '/api/live-stream?sessionId=test-registration-session', { token });
  assert.equal(liveStatus.status, 200);
  assert.equal((await liveStatus.json()).status, 'waiting');
  const liveCatalog = await send(env, '/api/sessions?gradeId=eb8&live=true&sessionId=test-registration-session', { token });
  assert.equal(liveCatalog.status, 200);
  assert.equal((await liveCatalog.json()).sessions[0].id, 'test-registration-session');

  const wrongGrade = await send(env, '/api/sessions?gradeId=eb7&live=true&sessionId=test-registration-session', { token });
  assert.equal(wrongGrade.status, 403);
});

test('Owner creates a one-year Director school and Director sets their own username and password', async () => {
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
  assert.equal(director.username.startsWith('pending-'), true);

  const setupToken = new URL(setupLink).searchParams.get('directorSetup');
  const setupRecord = [...setupTokens.values()].find((row) => row.account_id === director.id);
  assert.ok(setupRecord);

  const claimed = await send(env, '/api/director/claim', {
    method: 'POST',
    body: { token: setupToken, username: 'new.director', password: 'x' },
  });
  assert.equal(claimed.status, 200);
  const { token: directorToken, account } = await claimed.json();
  assert.equal(account.role, 'director');
  assert.equal(account.username, 'new.director');
  assert.equal(account.schoolId, director.schoolId);

  const replay = await send(env, '/api/director/claim', {
    method: 'POST',
    body: { token: setupToken, username: 'new.director', password: 'AnotherPassword#2026' },
  });
  assert.equal(replay.status, 400);

  const stagedStatuses = await send(env, '/api/owner/directors/status', {
    method: 'PATCH', token: ownerToken,
    body: { updates: [{ id: director.id, activated: false, paid: false }] },
  });
  assert.equal(stagedStatuses.status, 200);
  assert.deepEqual((await stagedStatuses.json()).statuses, [{ id: director.id, activated: false, paid: false }]);
  assert.equal(accounts.get(director.id).activated, 0);
  assert.equal(accounts.get(director.id).paid, 0);
  const blockedLogin = await send(env, '/api/auth/login', {
    method: 'POST', body: { username: 'new.director', password: 'x' },
  });
  assert.equal(blockedLogin.status, 403);
  assert.match((await blockedLogin.json()).error, /Director account is inactive/i);
  const savedStatuses = await send(env, '/api/owner/directors/status', {
    method: 'PATCH', token: ownerToken,
    body: { updates: [{ id: director.id, activated: true, paid: true }] },
  });
  assert.equal(savedStatuses.status, 200);
  assert.equal(accounts.get(director.id).activated, 1);
  assert.equal(accounts.get(director.id).paid, 1);
  const directorLogin = await send(env, '/api/auth/login', {
    method: 'POST', body: { username: 'new.director', password: 'x' },
  });
  assert.equal(directorLogin.status, 200);
  assert.equal((await directorLogin.json()).account.role, 'director');
  const wrongPassword = await send(env, '/api/auth/login', {
    method: 'POST', body: { username: 'new.director', password: 'incorrect' },
  });
  assert.equal(wrongPassword.status, 401);
  assert.deepEqual(await wrongPassword.json(), { error: 'Invalid username or password.' });
  const currentDirector = await send(env, '/api/auth/me', { token: directorToken });
  assert.equal(currentDirector.status, 200);
  assert.equal((await currentDirector.json()).account.role, 'director');
  const profile = await send(env, '/api/director/profile', { token: directorToken });
  assert.equal(profile.status, 200);
  assert.equal((await profile.json()).profile.schoolName, 'New Learning School');
  const tokenClaims = JSON.parse(Buffer.from(directorToken.split('.')[0], 'base64url').toString());
  assert.equal(tokenClaims.username, 'new.director');

  const oneCharacterLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'new.director', password: 'x' },
  });
  assert.equal(oneCharacterLogin.status, 200);

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
    body: { username: 'new.director', password: 'x' },
  });
  assert.equal(blockedDirectorLogin.status, 401);
  const blockedExistingSession = await send(env, '/api/director/profile', { token: directorToken });
  assert.equal(blockedExistingSession.status, 401);

  const restored = await send(env, `/api/owner/directors/${director.id}`, {
    method: 'PATCH',
    token: ownerToken,
    body: { activated: true, paid: true },
  });
  assert.equal(restored.status, 200);
  const restoredLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'new.director', password: 'x' },
  });
  assert.equal(restoredLogin.status, 200);
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
    registeredSessionId: 'test-registration-session',
    gradeId: 'eb8',
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
  assert.equal(account.registeredSessionId, 'test-registration-session');

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
  assert.equal(blockedBeforeActivation.status, 403);

  await send(env, `/api/director/accounts/${account.id}`, {
    method: 'PATCH',
    token: directorToken,
    body: { activated: true, paid: true },
  });
  const anonymous = await send(env, '/api/sessions?gradeId=eb8&live=true&sessionId=live-eb8-math');
  assert.equal(anonymous.status, 401);
  sessionMap.get('test-registration-session').is_live = 1;
  const wrongSession = await send(env, '/api/sessions?gradeId=eb8&live=true&sessionId=test-registration-session', { token });
  assert.equal(wrongSession.status, 403);

  const response = await send(env, '/api/sessions?gradeId=eb8&live=true&sessionId=live-eb8-math', { token });
  const { sessions } = await response.json();
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].isLive, true);
  assert.equal(sessions[0].playbackUrl, 'https://example.org/live/video');
  const liveStatus = await send(env, '/api/live-stream?sessionId=live-eb8-math', { token });
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
    body: { username: 'director.two', password: secondPassword },
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
