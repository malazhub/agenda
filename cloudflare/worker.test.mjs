import assert from 'node:assert/strict';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { test } from 'node:test';
import worker from './worker.js';

const signingKey = 'test-session-signing-key-with-enough-entropy';

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return `pbkdf2_sha256$100000$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

function fakeEnvironment() {
  const accounts = new Map();
  const attempts = [];
  const sessions = new Map();
  const streamConfig = new Map();
  sessions.set('test-registration-session', {
    id: 'test-registration-session',
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
      if (this.sql.includes('FROM accounts WHERE id')) return accounts.get(this.values[0]) || null;
      if (this.sql.includes('SELECT id, grade_id FROM sessions WHERE id')) {
        const session = sessions.get(this.values[0]);
        return session ? { id: session.id, grade_id: session.grade_id } : null;
      }
      if (this.sql.includes('SELECT * FROM sessions WHERE id = ? AND is_live = 1')) {
        const session = sessions.get(this.values[0]);
        return session?.is_live ? session : null;
      }
      if (this.sql.includes('SELECT input_uid FROM live_stream_config')) return streamConfig.get(1) || null;
      return null;
    }

    async all() {
      if (this.sql.includes('SELECT id, grade_id, subject, title FROM sessions')) {
        return { results: [...sessions.values()] };
      }
      if (this.sql.includes('FROM sessions ORDER BY')) return { results: [...sessions.values()] };
      if (this.sql.includes('FROM accounts WHERE role')) {
        const role = this.sql.match(/role = '([^']+)'/)?.[1];
        return { results: [...accounts.values()].filter((item) => item.role === role) };
      }
      if (this.sql.includes('FROM sessions WHERE grade_id')) {
        const gradeId = this.values[0];
        const liveOnly = this.sql.includes('is_live = 1');
        return {
          results: [...sessions.values()].filter((item) => item.grade_id === gradeId && Boolean(item.is_live) === liveOnly),
        };
      }
      return { results: [] };
    }

    async run() {
      if (this.sql.startsWith('INSERT INTO accounts')) {
        const [id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, registered_session_id] = this.values;
        if ([...accounts.values()].some((item) => item.username.toLowerCase() === username.toLowerCase())) {
          throw new Error('UNIQUE constraint failed: accounts.username');
        }
        accounts.set(id, {
          id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, registered_session_id,
          created_at: '2026-11-03 10:00:00', expires_at: '2026-12-03 10:00:00', activated: 0, paid: 0,
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
        return { meta: { changes: sessions.delete(this.values[0]) ? 1 : 0 } };
      }
      if (this.sql.startsWith('INSERT OR REPLACE INTO live_stream_config')) {
        streamConfig.set(this.values[0], { id: this.values[0], input_uid: this.values[1] });
        return { meta: { changes: 1 } };
      }
      if (this.sql.startsWith('UPDATE accounts SET')) {
        const id = this.values[this.values.length - 1];
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
      for (const statement of statements) {
        const values = statement.values;
        const [id, grade_id, subject, title, teacher_name, source_name, source_url, playback_url, media_key, is_live, live_starts_at] = values;
        sessions.set(id, {
          id, grade_id, subject, title, teacher_name, source_name, source_url, playback_url, is_live, live_starts_at,
          media_key,
        });
      }
      return [];
    },
  };

  const salt = randomBytes(16);
  const password = 'DirectorPassword#2026';
  const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  accounts.set('director-account-0000000000000000', {
    id: 'director-account-0000000000000000',
    username: 'director',
    password_hash: `pbkdf2_sha256$100000$${salt.toString('base64url')}$${hash.toString('base64url')}`,
    role: 'director',
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

  return {
    env: { DB, SESSION_SIGNING_KEY: signingKey, ALLOWED_ORIGINS: 'https://malazhub.github.io', STREAM_CUSTOMER_CODE: 'test-customer' },
    accounts,
    sessions,
    streamConfig,
    password,
  };
}

async function send(env, path, { method = 'GET', body, token, origin } = {}) {
  const headers = new Headers();
  if (body !== undefined) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (origin) headers.set('origin', origin);
  const request = new Request(`https://agenda-api.test${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return worker.fetch(request, env);
}

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
  const { env, accounts } = fakeEnvironment();
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
    body: { activated: true },
  });
  const login = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: registration.username, password: registration.password },
  });
  assert.equal(login.status, 200);
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
  assert.equal(lists.educators.length, 1);

  const updated = await send(env, `/api/director/accounts/${lists.educators[0].id}`, {
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

test('Director can save a live session and the grade catalog returns its playback URL', async () => {
  const { env } = fakeEnvironment();
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
    body: { activated: true },
  });
  const anonymous = await send(env, '/api/sessions?gradeId=eb8&live=true&sessionId=live-eb8-math');
  assert.equal(anonymous.status, 401);
  const wrongSession = await send(env, '/api/sessions?gradeId=eb8&live=true&sessionId=test-registration-session', { token });
  assert.equal(wrongSession.status, 403);

  const response = await send(env, '/api/sessions?gradeId=eb8&live=true&sessionId=live-eb8-math', { token });
  const { sessions } = await response.json();
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].isLive, true);
  assert.equal(sessions[0].playbackUrl, 'https://example.org/live/video');
  const liveStatus = await send(env, '/api/live-stream?sessionId=live-eb8-math', { token });
  assert.equal((await liveStatus.json()).status, 'unconfigured');
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

test('live stream endpoint rejects users without an assigned activated session', async () => {
  const { env } = fakeEnvironment();
  const response = await send(env, '/api/live-stream?sessionId=test-registration-session');
  assert.equal(response.status, 401);
});
