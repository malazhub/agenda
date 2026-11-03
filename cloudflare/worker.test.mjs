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
      if (this.sql.includes('SELECT * FROM accounts WHERE id')) return accounts.get(this.values[0]) || null;
      return null;
    }

    async all() {
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
        const [id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id] = this.values;
        if ([...accounts.values()].some((item) => item.username.toLowerCase() === username.toLowerCase())) {
          throw new Error('UNIQUE constraint failed: accounts.username');
        }
        accounts.set(id, {
          id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id,
          created_at: '2026-11-03 10:00:00', expires_at: null, activated: 1, paid: 0,
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
      if (this.sql.startsWith('UPDATE accounts SET')) {
        const id = this.values[this.values.length - 1];
        const account = accounts.get(id);
        if (!account || account.role === 'director') return { meta: { changes: 0 } };
        let valueIndex = 0;
        if (this.sql.includes('activated = ?')) account.activated = this.values[valueIndex++];
        if (this.sql.includes('paid = ?')) account.paid = this.values[valueIndex];
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
    created_at: '2026-11-03 09:00:00',
    expires_at: null,
    activated: 1,
    paid: 1,
  });

  return { env: { DB, SESSION_SIGNING_KEY: signingKey, ALLOWED_ORIGINS: 'https://malazhub.github.io' }, accounts, sessions, password };
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
    password: 'A-long-password-2026',
    role: 'student',
    fullName: 'Learner One',
    email: 'learner@example.com',
    phone: '',
    schoolOrSubject: 'Grade 8',
    gradeId: 'eb8',
  };
  const response = await send(env, '/api/auth/register', { method: 'POST', body: registration });
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.account.role, 'student');
  assert.equal('password_hash' in result.account, false);
  assert.equal(accounts.get(result.account.id).password_hash.startsWith('pbkdf2_sha256$'), true);

  const login = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: registration.username, password: registration.password },
  });
  assert.equal(login.status, 200);

  const duplicate = await send(env, '/api/auth/register', { method: 'POST', body: registration });
  assert.equal(duplicate.status, 409);
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
    gradeId: '',
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
    body: { activated: false, paid: true },
  });
  assert.equal(updated.status, 200);
  const { account } = await updated.json();
  assert.equal(account.activated, false);
  assert.equal(account.paid, true);

  const denied = await send(env, '/api/director/accounts');
  assert.equal(denied.status, 401);
});

test('Director can save a live session and the grade catalog returns its playback URL', async () => {
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

  const response = await send(env, '/api/sessions?gradeId=eb8&live=true');
  const { sessions } = await response.json();
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].isLive, true);
  assert.equal(sessions[0].playbackUrl, 'https://example.org/live/video');
});
