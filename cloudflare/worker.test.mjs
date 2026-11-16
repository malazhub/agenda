import assert from 'node:assert/strict';
import { createHmac, pbkdf2Sync, randomBytes } from 'node:crypto';
import { test } from 'node:test';
import worker from './worker.js';

const signingKey = 'test-session-signing-key-with-enough-entropy';

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  if (url.hostname === 'video.stream-io-api.com') {
    return new Response('{}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  return originalFetch(input, init);
};

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return `pbkdf2_sha256$100000$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

function fakeEnvironment() {
  const accounts = new Map();
  const attempts = [];
  const sessions = new Map();
  const schools = new Map([
    ['default-agenda-school', { id: 'default-agenda-school', name: 'Agenda' }],
    ['other-school', { id: 'other-school', name: 'Other School' }],
  ]);
  const lessons = new Map();
  const classroomMessages = [];
  const bucketObjects = new Map();

  sessions.set('test-registration-session', {
    id: 'test-registration-session',
    school_id: 'default-agenda-school',
    grade_id: 'eb8',
    subject: 'Mathematics',
    title: 'Registered algebra session',
    teacher_name: 'Assigned Educator',
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
      this.normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();
      this.values = [];
    }

    bind(...values) {
      this.values = values;
      return this;
    }

    async first() {
      const q = this.normalized;
      const v = this.values;

      if (q.includes('from schools where id = ?')) {
        return schools.get(v[0]) || null;
      }
      if (q.includes('from schools where name = ?')) {
        return [...schools.values()].find(
          (school) => school.name.toLowerCase() === String(v[0]).toLowerCase() &&
            school.id !== v[1]
        ) || null;
      }
      if (q.includes('select id from accounts where username')) {
        const account = [...accounts.values()].find(
          (item) => item.username.toLowerCase() === String(v[0]).toLowerCase()
        );
        return account ? { id: account.id } : null;
      }
      if (q.includes('select * from accounts where username')) {
        return [...accounts.values()].find(
          (item) => item.username.toLowerCase() === String(v[0]).toLowerCase()
        ) || null;
      }
      if (q.includes('select count(*) as count from login_attempts')) {
        const recent = attempts.filter(
          (item) => item.username === String(v[0]).toLowerCase() && !item.succeeded
        );
        return { count: recent.length };
      }
      if (q.includes('from accounts educator')) {
        const session = sessions.get(v[0]);
        if (!session || session.school_id !== v[1]) return null;
        const educator = [...accounts.values()].find(
          (item) =>
            item.role === 'educator' &&
            item.registered_session_id === session.id &&
            item.school_id === v[2]
        );
        return educator ? { id: session.id, grade_id: session.grade_id } : null;
      }
      if (q.includes('from sessions s inner join accounts educator')) {
        const session = sessions.get(v[0]);
        if (!session || session.school_id !== v[1]) return null;
        const educator = [...accounts.values()].find(
          (item) =>
            item.role === 'educator' &&
            item.registered_session_id === session.id &&
            item.school_id === v[2]
        );
        return educator ? { id: session.id, grade_id: session.grade_id } : null;
      }
      if (q.includes('select school_id from sessions where id = ?')) {
        const session = sessions.get(v[0]);
        return session ? { school_id: session.school_id } : null;
      }
      if (q.includes('from sessions where media_key = ?')) {
        const session = [...sessions.values()].find(
          (item) => item.media_key === v[0] && item.school_id === v[1]
        );
        return session ? { id: session.id } : null;
      }
      if (q.includes('from educator_lessons') && q.includes('where id = ?')) {
        const lesson = lessons.get(v[0]);
        if (!lesson) return null;
        if (q.includes('school_id = ?') && lesson.school_id !== v[1]) return null;
        if (q.includes('educator_id = ?') && lesson.educator_id !== v[q.includes('school_id = ?') ? 2 : 1]) return null;
        if (q.includes('media_key is not null') && !lesson.media_key) return null;
        return { ...lesson };
      }
      if (q.includes('from educator_lessons') && q.includes('where educator_id = ?')) {
        const lesson = [...lessons.values()].find(
          (item) => item.educator_id === v[0] && item.school_id === v[1] && item.media_key
        );
        return lesson ? { media_key: lesson.media_key, media_name: lesson.media_name, media_type: lesson.media_type } : null;
      }
      if (q.includes('from schools')) {
        return [...schools.values()][0] || null;
      }
      if (q.includes('from accounts where id')) {
        const account = accounts.get(v[0]);
        if (!account) return null;
        if (q.includes('school_id = ?') && account.school_id !== v[v.length - 1]) return null;
        const roleMatch = q.match(/role = '([^']+)'/);
        if (roleMatch && account.role !== roleMatch[1]) return null;
        if (q.includes("role in ('student', 'educator')") && !['student', 'educator'].includes(account.role)) return null;
        return { ...account };
      }
      if (q.includes('from sessions where id = ?')) {
        const session = sessions.get(v[0]);
        if (!session) return null;
        if (q.includes('school_id = ?') && session.school_id !== v[1]) return null;
        if (q.includes('is_live = 1') && !session.is_live) return null;
        return { ...session };
      }
      if (q.includes('select id, grade_id from sessions where id = ?')) {
        const session = sessions.get(v[0]);
        return session ? { id: session.id, grade_id: session.grade_id } : null;
      }
      if (q.includes('select grade_id from sessions where grade_id')) {
        return [...sessions.values()].some((item) => item.grade_id === v[0])
          ? { grade_id: v[0] }
          : null;
      }
      if (q.includes('from sessions where id = ? and grade_id = ?')) {
        const session = sessions.get(v[0]);
        return session && session.grade_id === v[1] && session.school_id === v[2]
          ? { ...session }
          : null;
      }
      if (q.includes('select id from sessions where id = ?')) {
        const session = sessions.get(v[0]);
        return session ? { id: session.id } : null;
      }
      if (q.includes('select id from accounts where role')) {
        return null;
      }
      return null;
    }

    async all() {
      const q = this.normalized;
      const v = this.values;

      if (q.includes('from schools')) {
        return { results: [...schools.values()].map((school) => ({ ...school })) };
      }
      if (q.includes('from educator_lessons')) {
        let result = [...lessons.values()];
        if (q.includes('school_id = ?')) result = result.filter((item) => item.school_id === v[0]);
        if (q.includes('educator_id = ?')) {
          const educatorIndex = q.includes('school_id = ?') ? 1 : 0;
          result = result.filter((item) => item.educator_id === v[educatorIndex]);
        }
        return { results: result.sort((a, b) => a.slot - b.slot).map((item) => ({ ...item })) };
      }
      if (q.includes('from classroom_messages')) {
        let result = [...classroomMessages];
        if (q.includes('educator_id = ?')) result = result.filter((item) => item.educator_id === v[0]);
        if (q.includes('student_id = ?')) result = result.filter((item) => item.student_id === v[0]);
        return { results: result.filter((item) => item.attachment_key).map((item) => ({ attachment_key: item.attachment_key })) };
      }
      if (q.includes('from accounts a left join sessions s')) {
        const schoolId = v[0];
        return {
          results: [...accounts.values()]
            .filter((item) => item.role === 'educator' && item.school_id === schoolId)
            .map((educator) => {
              const session = sessions.get(educator.registered_session_id);
              return {
                id: educator.id,
                full_name: educator.full_name,
                school_or_subject: educator.school_or_subject,
                grade_id: educator.grade_id,
                registered_session_id: educator.registered_session_id,
                assigned_session_id: session?.id || null,
                assigned_grade_id: session?.grade_id || null,
                assigned_subject: session?.subject || null,
              };
            }),
        };
      }
      if (q.includes('from accounts where role')) {
        const role = q.match(/role = '([^']+)'/)?.[1];
        let result = [...accounts.values()].filter((item) => !role || item.role === role);
        if (q.includes('school_id = ?')) result = result.filter((item) => item.school_id === v[0]);
        return { results: result.map((item) => ({ ...item })) };
      }
      if (q.includes('from sessions') && q.includes('school_id = ?')) {
        const schoolId = v.find((value) => schools.has(value));
        let result = [...sessions.values()].filter((item) => item.school_id === schoolId);
        if (q.includes('grade_id = ?')) {
          const gradeId = v[0];
          result = result.filter((item) => item.grade_id === gradeId);
        }
        if (q.includes('is_live = 0')) result = result.filter((item) => !item.is_live);
        if (q.includes('is_live = 1')) result = result.filter((item) => Boolean(item.is_live));
        return { results: result.map((item) => ({ ...item })) };
      }
      if (q.includes('from sessions where grade_id')) {
        const gradeId = v[0];
        const liveOnly = q.includes('is_live = 1');
        return {
          results: [...sessions.values()].filter(
            (item) => item.grade_id === gradeId && Boolean(item.is_live) === liveOnly
          ),
        };
      }
      if (q.includes('select distinct grade_id from sessions')) {
        return { results: [...new Set([...sessions.values()].map((item) => item.grade_id))].map((grade_id) => ({ grade_id })) };
      }
      if (q.includes('select id, grade_id, subject, title from sessions')) {
        return { results: [...sessions.values()] };
      }
      return { results: [] };
    }

    async run() {
      const q = this.normalized;
      const v = this.values;

      if (q.startsWith('insert into accounts')) {
        const [id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, registered_session_id, school_id] = v;
        if ([...accounts.values()].some((item) => item.username.toLowerCase() === username.toLowerCase())) {
          throw new Error('UNIQUE constraint failed: accounts.username');
        }
        accounts.set(id, {
          id, username, password_hash, role, full_name, email, phone, school_or_subject,
          grade_id, registered_session_id, school_id,
          created_at: '2026-11-03 10:00:00',
          expires_at: '2026-12-03 10:00:00',
          activated: 0,
          paid: 0,
        });
        return { meta: { changes: 1 } };
      }
      if (q.startsWith('insert or ignore into educator_lessons')) {
        const [id, school_id, educator_id, slot] = v;
        if (![...lessons.values()].some((item) => item.educator_id === educator_id && item.slot === slot)) {
          lessons.set(id, {
            id, school_id, educator_id, slot, title: '', subject: '', description: '',
            media_key: null, media_name: null, media_type: null, media_size: 0,
            updated_at: '2026-11-03 10:00:00',
          });
        }
        return { meta: { changes: 1 } };
      }
      if (q.startsWith('insert or replace into sessions') || q.startsWith('insert into sessions')) {
        const [id, school_id, grade_id, subject, title, teacher_name, source_name, source_url, playback_url, media_key] = v;
        const is_live = q.includes('is_live, live_starts_at') ? Number(v[10] || 0) : 0;
        const live_starts_at = q.includes('is_live, live_starts_at') ? v[11] || null : null;
        sessions.set(id, { id, school_id, grade_id, subject, title, teacher_name, source_name, source_url, playback_url, media_key, is_live, live_starts_at });
        return { meta: { changes: 1 } };
      }
      if (q.includes('insert into login_attempts')) {
        attempts.push({ username: String(v[0]).toLowerCase(), succeeded: Boolean(v[1]) });
        return { meta: { changes: 1 } };
      }
      if (q.startsWith('delete from login_attempts')) {
        return { meta: { changes: 1 } };
      }
      if (q.startsWith('update schools set name = ?')) {
        const school = schools.get(v[1]);
        if (!school) return { meta: { changes: 0 } };
        school.name = v[0];
        return { meta: { changes: 1 } };
      }
      if (q.startsWith("update accounts set registered_session_id = null")) {
        const [schoolId, sessionId] = v;
        let changes = 0;
        for (const account of accounts.values()) {
          if (
            account.role === 'student' &&
            account.school_id === schoolId &&
            account.registered_session_id === sessionId
          ) {
            account.registered_session_id = null;
            changes++;
          }
        }
        return { meta: { changes } };
      }
      if (q.startsWith('update educator_lessons')) {
        const lesson = lessons.get(v[v.length - 3]);
        if (!lesson) return { meta: { changes: 0 } };
        if (q.includes("set title = '', subject = '', description = ''")) {
          if (lesson.school_id !== v[1] || lesson.educator_id !== v[2]) return { meta: { changes: 0 } };
          Object.assign(lesson, {
            title: '', subject: '', description: '',
            media_key: null, media_name: null, media_type: null, media_size: 0,
            updated_at: '2026-11-03 10:00:00',
          });
        } else {
          const [title, subject, description, media_key, media_name, media_type, media_size] = v;
          Object.assign(lesson, { title, subject, description, media_key, media_name, media_type, media_size, updated_at: '2026-11-03 10:00:00' });
        }
        return { meta: { changes: 1 } };
      }
      if (q.startsWith('update sessions set is_live')) {
        const session = sessions.get(v[2]);
        if (!session || session.school_id !== v[3]) return { meta: { changes: 0 } };
        session.is_live = v[0];
        session.live_starts_at = v[1];
        return { meta: { changes: 1 } };
      }
      if (q.startsWith('update accounts set')) {
        let accountId = v[v.length - 1];
        let schoolId = null;
        if (q.includes('and school_id = ?')) {
          schoolId = v[v.length - 1];
          accountId = v[v.length - 2];
        }
        const account = accounts.get(accountId);
        if (!account || (account.role === 'director' && !q.includes("role = 'director'"))) return { meta: { changes: 0 } };
        if (schoolId && account.school_id !== schoolId) return { meta: { changes: 0 } };

        const setClause = q.split(' set ')[1].split(' where ')[0];
        let index = 0;
        for (const assignment of setClause.split(',')) {
          if (assignment.includes('activated = ?')) account.activated = v[index++];
          else if (assignment.includes('paid = ?')) account.paid = v[index++];
          else if (assignment.includes('registered_session_id = ?')) account.registered_session_id = v[index++];
          else if (assignment.includes('grade_id = ?')) account.grade_id = v[index++];
          else if (assignment.includes('password_hash = ?')) account.password_hash = v[index++];
          else if (assignment.includes('username = ?')) account.username = v[index++];
          else if (assignment.includes("expires_at = datetime('now', '+1 month')")) account.expires_at = '2026-12-03 10:00:00';
        }
        return { meta: { changes: 1 } };
      }
      if (q.startsWith('delete from educator_lessons')) {
        const educatorId = v[0];
        const schoolId = v[1];
        let changes = 0;
        for (const [id, lesson] of lessons.entries()) {
          if (lesson.educator_id === educatorId && lesson.school_id === schoolId) {
            lessons.delete(id);
            changes++;
          }
        }
        return { meta: { changes } };
      }
      if (q.startsWith('delete from classroom_messages')) {
        const key = q.includes('educator_id = ?') ? 'educator_id' : 'student_id';
        return { meta: { changes: classroomMessages.filter((item) => item[key] === v[0]).length } };
      }
      if (q.startsWith('delete from sessions where id')) {
        const session = sessions.get(v[0]);
        if (!session || (v.length > 1 && session.school_id !== v[1])) return { meta: { changes: 0 } };
        sessions.delete(v[0]);
        return { meta: { changes: 1 } };
      }
      if (q.startsWith('delete from accounts where id')) {
        const account = accounts.get(v[0]);
        if (!account || account.school_id !== v[1]) return { meta: { changes: 0 } };
        accounts.delete(v[0]);
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
        results.push(await statement.run());
      }
      return results;
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
    school_id: 'default-agenda-school',
    created_at: '2026-11-03 09:00:00',
    expires_at: null,
    activated: 1,
    paid: 1,
  });

  const educatorSalt = randomBytes(16);
  const educatorHash = pbkdf2Sync('SeedEducatorPassword#2026', educatorSalt, 100000, 32, 'sha256');
  accounts.set('seed-educator-account-0000000000000', {
    id: 'seed-educator-account-0000000000000',
    username: 'assigned.educator',
    password_hash: `pbkdf2_sha256$100000$${educatorSalt.toString('base64url')}$${educatorHash.toString('base64url')}`,
    role: 'educator',
    full_name: 'Assigned Educator',
    email: 'assigned@example.com',
    phone: '',
    school_or_subject: 'Mathematics',
    grade_id: 'eb8',
    registered_session_id: 'test-registration-session',
    school_id: 'default-agenda-school',
    created_at: '2026-11-03 08:00:00',
    expires_at: null,
    activated: 1,
    paid: 1,
  });

  const SESSION_MEDIA_BUCKET = {
    async put(key, value, options = {}) {
      const bytes = value instanceof ArrayBuffer
        ? new Uint8Array(value)
        : new Uint8Array(await value.arrayBuffer());
      bucketObjects.set(key, { bytes, contentType: options.httpMetadata?.contentType || 'application/octet-stream' });
    },
    async get(key) {
      const stored = bucketObjects.get(key);
      if (!stored) return null;
      return {
        body: new Response(stored.bytes).body,
        httpEtag: '"test-etag"',
        writeHttpMetadata(headers) {
          headers.set('content-type', stored.contentType);
        },
      };
    },
    async delete(key) {
      bucketObjects.delete(key);
    },
    async head(key) {
      return bucketObjects.has(key) ? { key } : null;
    },
  };

  return {
    env: {
      DB,
      SESSION_MEDIA_BUCKET,
      SESSION_SIGNING_KEY: signingKey,
      ALLOWED_ORIGINS: 'https://malazhub.github.io',
      STREAM_VIDEO_API_KEY: 'test-stream-video-key',
      STREAM_VIDEO_API_SECRET: 'test-stream-video-secret-with-sufficient-length',
    },
    accounts,
    sessions,
    schools,
    lessons,
    bucketObjects,
    password,
  };
}

async function send(env, path, { method = 'GET', body, token, origin } = {}) {
  const headers = new Headers();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (origin) headers.set('origin', origin);
  return worker.fetch(new Request(`https://agenda-api.test${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  }), env);
}

async function send(env, path, { method = 'GET', body, token, origin } = {}) {
  const headers = new Headers();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (body !== undefined && !isFormData) {
    headers.set('content-type', 'application/json');
  }
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (origin) headers.set('origin', origin);

  const request = new Request(`https://agenda-api.test${path}`, {
    method,
    headers,
    body: body === undefined
      ? undefined
      : isFormData
        ? body
        : JSON.stringify(body),
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
  assert.match(options.headers.get('access-control-allow-methods') || '', /DELETE/);
});

test('registration hashes credentials and rejects duplicate usernames', async () => {
  const { env, accounts } = fakeEnvironment();
  const registration = {
    schoolId: 'default-agenda-school',
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

  const registrationSessions = await send(env, '/api/registration/sessions?schoolId=default-agenda-school');
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
  const sharedStream = await send(env, `/api/live-stream?sessionId=${registration.registeredSessionId}`, {
    token: (await login.json()).token,
  });
  assert.equal(sharedStream.status, 200);
  assert.equal((await sharedStream.json()).status, 'waiting');
});

test('grade registration loads available grades and grants grade-scoped live access', async () => {
  const { env, accounts, sessions } = fakeEnvironment();
  const grades = await send(env, '/api/registration/grades?schoolId=default-agenda-school');
  assert.equal(grades.status, 200);
  assert.ok((await grades.json()).grades.includes('eb8'));

  const registration = await send(env, '/api/auth/register', {
    method: 'POST',
    body: {
      username: 'grade.student',
      password: 'no restrictions !',
      role: 'student',
      schoolId: 'default-agenda-school',
      registeredSessionId: 'test-registration-session',
      fullName: 'Grade Student',
      email: 'grade@example.com',
      phone: '+1 555 0100',
      schoolOrSubject: 'Grade 8',
      gradeId: 'eb8',
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

test('Director login reads persisted role tables and saves status updates', async () => {
  const { env } = fakeEnvironment();
  const registration = {
    username: 'educator.one',
    password: 'A-long-password-2026',
    role: 'educator',
    schoolId: 'default-agenda-school',
    fullName: 'Educator One',
    email: 'educator@example.com',
    phone: '',
    schoolOrSubject: 'Mathematics',
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
  const newEducator = lists.educators.find((item) => item.username === 'educator.one');
  assert.ok(newEducator);

  const updated = await send(env, `/api/director/accounts/${newEducator.id}`, {
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
      schoolId: 'default-agenda-school',
      fullName: 'Live Student',
      email: 'live@example.com',
      phone: '',
      schoolOrSubject: 'Grade 8',
      registeredSessionId: 'live-eb8-math',
    },
  });
  assert.equal(registration.status, 400);
  assert.match((await registration.json()).error, /educator classroom|valid educator classroom/i);

  const seedEducatorId = 'seed-educator-account-0000000000000';
  const assigned = await send(env, `/api/director/accounts/${seedEducatorId}`, {
    method: 'PATCH',
    token: directorToken,
    body: { activated: true, paid: true, registeredSessionId: 'live-eb8-math' },
  });
  assert.equal(assigned.status, 200);
  const assignedEducator = (await assigned.json()).account;
  assert.notEqual(assignedEducator.registeredSessionId, 'live-eb8-math');

  const educatorLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'assigned.educator', password: 'SeedEducatorPassword#2026' },
  });
  const { token: educatorToken } = await educatorLogin.json();
  const started = await send(env, '/api/educator/live-session', {
    method: 'PATCH',
    token: educatorToken,
    body: { isLive: true },
  });
  assert.equal(started.status, 200);

  const studentRegistration = await send(env, '/api/auth/register', {
    method: 'POST',
    body: {
      username: 'live.student',
      password: 'live session password',
      role: 'student',
      schoolId: 'default-agenda-school',
      fullName: 'Live Student',
      email: 'live@example.com',
      phone: '',
      schoolOrSubject: 'Grade 8',
      registeredSessionId: assignedEducator.registeredSessionId,
    },
  });
  assert.equal(studentRegistration.status, 201);
  const { account, token } = await studentRegistration.json();
  const blockedBeforeActivation = await send(env, `/api/sessions?gradeId=eb8&live=true&sessionId=${assignedEducator.registeredSessionId}`, { token });
  assert.equal(blockedBeforeActivation.status, 403);

  await send(env, `/api/director/accounts/${account.id}`, {
    method: 'PATCH',
    token: directorToken,
    body: { activated: true, paid: true },
  });
  const anonymous = await send(env, '/api/sessions?gradeId=eb8&live=true&sessionId=live-eb8-math');
  assert.equal(anonymous.status, 401);
  const wrongSession = await send(env, '/api/sessions?gradeId=eb8&live=true&sessionId=test-registration-session', { token });
  assert.equal(wrongSession.status, 403);

  const response = await send(env, `/api/sessions?gradeId=eb8&live=true&sessionId=${assignedEducator.registeredSessionId}`, { token });
  const { sessions } = await response.json();
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].isLive, true);
  assert.equal(sessions[0].playbackUrl, 'https://example.org/live/video');
  const liveStatus = await send(env, `/api/live-stream?sessionId=${assignedEducator.registeredSessionId}`, { token });
  const liveCredentials = await liveStatus.json();
  assert.equal(liveStatus.status, 200);
  assert.equal(liveCredentials.status, 'waiting');
    assert.equal(liveCredentials.callId, assignedEducator.registeredSessionId);
  assert.equal(liveCredentials.apiKey, 'test-stream-video-key');

  const videoTokenPayload = JSON.parse(
    Buffer.from(
      liveCredentials.token.split('.')[1],
      'base64url'
    ).toString()
  );

  assert.deepEqual(
  videoTokenPayload.call_cids,
  [`default:${assignedEducator.registeredSessionId}`]
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


test('schools isolate educator directories and the ten permanent lesson slots', async () => {
  const { env, accounts, lessons, bucketObjects } = fakeEnvironment();

  const schoolsResponse = await send(env, '/api/schools');
  assert.equal(schoolsResponse.status, 200);
  const schoolList = await schoolsResponse.json();
  assert.ok(schoolList.schools.some((school) => school.id === 'default-agenda-school'));
  assert.ok(schoolList.schools.some((school) => school.id === 'other-school'));

  const registration = await send(env, '/api/auth/register', {
    method: 'POST',
    body: {
      schoolId: 'other-school',
      username: 'other.educator',
      password: 'OtherEducatorPassword#2026',
      role: 'educator',
      fullName: 'Other School Educator',
      email: 'other.educator@example.com',
      phone: '',
      schoolOrSubject: 'Science',
      gradeId: 'eb8',
    },
  });
  assert.equal(registration.status, 201);
  const { account, token } = await registration.json();
  assert.equal(account.schoolId, 'other-school');
  assert.equal(lessons.size, 10);

  const otherDirectory = await send(env, '/api/schools/other-school/educators');
  assert.equal(otherDirectory.status, 200);
  assert.deepEqual(
    (await otherDirectory.json()).educators.map((educator) => educator.id),
    [account.id]
  );

  const defaultDirectory = await send(env, '/api/schools/default-agenda-school/educators');
  assert.equal(defaultDirectory.status, 200);
  assert.ok(
    !(await defaultDirectory.json()).educators.some((educator) => educator.id === account.id)
  );

  const lessonList = await send(
    env,
    `/api/learning/educators/${account.id}/lessons?schoolId=other-school`
  );
  assert.equal(lessonList.status, 200);
  const { lessons: educatorLessons } = await lessonList.json();
  assert.equal(educatorLessons.length, 10);
  assert.deepEqual(
    educatorLessons.map((lesson) => lesson.slot),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  );

  const forbiddenLessonList = await send(
    env,
    `/api/learning/educators/${account.id}/lessons?schoolId=default-agenda-school`
  );
  assert.equal(forbiddenLessonList.status, 404);

  const selectedLesson = educatorLessons[0];
  const form = new FormData();
  form.append('title', 'Cells and organisms');
  form.append('subject', 'Science');
  form.append('description', 'A lesson with an uploaded illustration.');
  form.append('file', new Blob(['lesson image bytes'], { type: 'image/png' }), 'cells.png');

  const saved = await send(env, `/api/learning/lessons/${selectedLesson.id}`, {
    method: 'PUT',
    token,
    body: form,
  });
  assert.equal(saved.status, 200);
  const savedLesson = (await saved.json()).lesson;
  assert.equal(savedLesson.title, 'Cells and organisms');
  assert.equal(savedLesson.subject, 'Science');
  assert.equal(savedLesson.mediaName, 'cells.png');
  assert.match(savedLesson.mediaUrl, /schoolId=other-school/);
  assert.equal(bucketObjects.size, 1);

  const media = await send(
    env,
    `/api/learning/lessons/${selectedLesson.id}/media?schoolId=other-school`
  );
  assert.equal(media.status, 200);
  assert.equal(media.headers.get('content-type'), 'image/png');
  assert.equal(await media.text(), 'lesson image bytes');

  const wrongSchoolMedia = await send(
    env,
    `/api/learning/lessons/${selectedLesson.id}/media?schoolId=default-agenda-school`
  );
  assert.equal(wrongSchoolMedia.status, 404);

  const deleted = await send(env, `/api/learning/lessons/${selectedLesson.id}`, {
    method: 'DELETE',
    token,
  });
  assert.equal(deleted.status, 200);
  const clearedLesson = (await deleted.json()).lesson;
  assert.equal(clearedLesson.slot, 1);
  assert.equal(clearedLesson.title, '');
  assert.equal(clearedLesson.mediaUrl, null);
  assert.equal(bucketObjects.size, 0);
  assert.equal(lessons.size, 10);

  const defaultDirectorLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026' },
  });
  const { token: directorToken } = await defaultDirectorLogin.json();

  const defaultDirectorAccounts = await send(env, '/api/director/accounts', {
    token: directorToken,
  });
  const directorLists = await defaultDirectorAccounts.json();
  assert.ok(!directorLists.educators.some((educator) => educator.id === account.id));

  const crossSchoolDelete = await send(env, `/api/director/accounts/${account.id}`, {
    method: 'DELETE',
    token: directorToken,
  });
  assert.equal(crossSchoolDelete.status, 404);
  assert.equal(accounts.has(account.id), true);
});

test('Director profile updates only the Director-owned school and username', async () => {
  const { env, schools, accounts } = fakeEnvironment();
  const login = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'director', password: 'DirectorPassword#2026' },
  });
  assert.equal(login.status, 200);
  const { token } = await login.json();

  const initialProfile = await send(env, '/api/director/profile', { token });
  assert.equal(initialProfile.status, 200);
  assert.deepEqual(await initialProfile.json(), {
    profile: {
      schoolId: 'default-agenda-school',
      schoolName: 'Agenda',
      username: 'director',
    },
  });

  const updated = await send(env, '/api/director/profile', {
    method: 'PATCH',
    token,
    body: {
      schoolName: 'Agenda Secondary School',
      username: 'agenda.director',
    },
  });
  assert.equal(updated.status, 200);
  const result = await updated.json();
  assert.equal(result.profile.schoolId, 'default-agenda-school');
  assert.equal(result.profile.schoolName, 'Agenda Secondary School');
  assert.equal(result.profile.username, 'agenda.director');
  assert.ok(result.token);
  assert.equal(schools.get('default-agenda-school').name, 'Agenda Secondary School');
  assert.equal(accounts.get('director-account-0000000000000').username, 'director');

  const refreshedProfile = await send(env, '/api/director/profile', {
    token: result.token,
  });
  assert.equal(refreshedProfile.status, 200);
  assert.equal((await refreshedProfile.json()).profile.schoolName, 'Agenda Secondary School');

  const renamedLogin = await send(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'agenda.director', password: 'DirectorPassword#2026' },
  });
  assert.equal(renamedLogin.status, 200);
});
