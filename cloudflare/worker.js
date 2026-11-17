const SESSION_TTL_SECONDS = 12 * 60 * 60;
const PASSWORD_ITERATIONS = 100000;
const MAX_PASSWORD_LENGTH = 1024;
const STREAM_VIDEO_CALL_ID = "agenda-shared-classroom";
const encoder = new TextEncoder();

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  const allowList = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowList.includes(origin) ? origin : null;
}

function corsHeaders(origin) {
  return origin
    ? {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
        "access-control-allow-headers": "Authorization, Content-Type",
        "access-control-max-age": "86400",
        vary: "Origin",
      }
    : {};
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - (normalized.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function randomId() {
  return crypto.randomUUID();
}

function passwordBytes(password) {
  return encoder.encode(password);
}

async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey("raw", passwordBytes(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS },
    key,
    256,
  );
  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${base64UrlEncode(salt)}$${base64UrlEncode(new Uint8Array(bits))}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, iterationsText, saltText, expectedText] = storedHash.split("$");
  const iterations = Number(iterationsText);
  if (algorithm !== "pbkdf2_sha256" || iterations !== PASSWORD_ITERATIONS) {
    return false;
  }
  const actual = await hashPassword(password, base64UrlDecode(saltText));
  const actualBytes = base64UrlDecode(actual.split("$")[3]);
  const expectedBytes = base64UrlDecode(expectedText);
  if (actualBytes.length !== expectedBytes.length) return false;
  let difference = 0;
  for (let index = 0; index < actualBytes.length; index += 1) {
    difference |= actualBytes[index] ^ expectedBytes[index];
  }
  return difference === 0;
}

async function signToken(payload, secret) {
  if (!secret || secret.length < 32) throw new Error("SESSION_SIGNING_KEY must be configured with at least 32 characters");
  const data = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return `${data}.${base64UrlEncode(new Uint8Array(signature))}`;
}




async function signStreamCallToken(   env,   userId,   sessionId,   role,   callType = "livestream" ) {
  const apiKey = env.STREAM_VIDEO_API_KEY;
  const secret = env.STREAM_VIDEO_API_SECRET;

  if (!apiKey || !secret || !sessionId) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const callId = sessionId;

  const header = base64UrlEncode(
    encoder.encode(
      JSON.stringify({
        alg: "HS256",
        typ: "JWT",
      })
    )
  );

  const payload = base64UrlEncode(
    encoder.encode(
      JSON.stringify({
        user_id: userId,
        call_cids: [`${callType}:${callId}`],
        ...(role ? { role } : {}),
        iat: now,
        exp: now + 60 * 60,
      })
    )
  );

  const data = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );

  return {
    apiKey,
    callId,
    token: `${data}.${base64UrlEncode(
      new Uint8Array(signature)
    )}`,
    userId,
  };
}


async function signStreamServerToken(env) {
  const secret = env.STREAM_VIDEO_API_SECRET;

  if (!secret) {
    throw new Error("STREAM_VIDEO_API_SECRET is not configured.");
  }

  const header = base64UrlEncode(
    encoder.encode(JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    }))
  );

  const payload = base64UrlEncode(
    encoder.encode(JSON.stringify({
      server: true,
    }))
  );

  const data = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );

  return `${data}.${base64UrlEncode(
    new Uint8Array(signature)
  )}`;
}

async function verifyToken(token, secret) {
  if (!secret || secret.length < 32) throw new Error("SESSION_SIGNING_KEY must be configured with at least 32 characters");
  const [data, signatureText] = token.split(".");
  if (
    !data ||
    !signatureText ||
    !/^[A-Za-z0-9_-]+$/.test(data) ||
    !/^[A-Za-z0-9_-]+$/.test(signatureText)
  ) return null;
  try {
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", key, base64UrlDecode(signatureText), encoder.encode(data));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(data)));
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}

async function requestJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function publicAccount(account) {
  return {
    id: account.id,
    username: account.username,
    role: account.role,
    schoolId: account.school_id || "",
    fullName: account.full_name,
    email: account.email,
    phone: account.phone,
    schoolOrSubject: account.school_or_subject,
    gradeId: account.grade_id,
    registeredSessionId: account.registered_session_id || null,
    createdAt: account.created_at,
    expiresAt: account.expires_at,
    activated: Boolean(account.activated),
    paid: Boolean(account.paid),
  };
}

async function authenticate(request, env, requiredRole) {
  const authorization = request.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer ([A-Za-z0-9._-]+)$/);
  if (!match) return null;
  const payload = await verifyToken(match[1], env.SESSION_SIGNING_KEY);
  if (!payload || (requiredRole && payload.role !== requiredRole)) return null;
  return payload;
}

async function getDirectorSchoolId(env, director) {
  const row = await env.DB.prepare(
    `SELECT accounts.school_id
     FROM accounts
     INNER JOIN schools
       ON schools.id = accounts.school_id
       AND schools.director_id = accounts.id
     WHERE accounts.id = ? AND accounts.role = 'director'`
  ).bind(director.sub).first();
  return row?.school_id || null;
}

async function handleRegister(request, env) {
  const body = await requestJson(request);
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = body?.role;
  const schoolId = typeof body?.schoolId === "string" ? body.schoolId.trim() : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const schoolOrSubject = typeof body?.schoolOrSubject === "string" ? body.schoolOrSubject.trim() : "";
  const requestedGradeId = typeof body?.gradeId === "string" ? body.gradeId.trim() : "";
  const registeredSessionId = typeof body?.registeredSessionId === "string" ? body.registeredSessionId.trim() : "";

  if (!schoolId || !(await env.DB.prepare("SELECT id FROM schools WHERE id = ?").bind(schoolId).first())) {
    return json({ error: "Choose a valid school before registering." }, 400);
  }
  if (!/^[a-z0-9._-]{3,32}$/.test(username) || !password || password.length > MAX_PASSWORD_LENGTH) {
    return json({ error: "Use a 3–32 character username and a non-empty password of at most 1,024 characters." }, 400);
  }
  if (!["student", "educator"].includes(role) || fullName.length < 2 || fullName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Complete the required name, email, and account role fields." }, 400);
  }
  if (phone.length > 40 || schoolOrSubject.length > 160 || registeredSessionId.length > 100) {
    return json({ error: "One or more profile fields are too long." }, 400);
  }

    if (role === "student" && !registeredSessionId) {
    return json({
      error: "Please select your registered educator before registering."
    }, 400);
  }

  const selectedSession = registeredSessionId
    ? await env.DB.prepare(
        `SELECT
           s.id,
           s.grade_id
         FROM sessions s
         INNER JOIN accounts educator
           ON educator.registered_session_id = s.id
           AND educator.role = 'educator'
         WHERE s.id = ? AND s.school_id = ? AND educator.school_id = ?`
      ).bind(registeredSessionId, schoolId, schoolId).first()
    : null;

  if (role === "student" && !selectedSession) {
    return json({
      error: "Choose a valid session: the selected educator does not have an assigned classroom."
    }, 400);
  }

  if (registeredSessionId && !selectedSession) {
    return json({
      error: "Choose a valid educator classroom before registering."
    }, 400);
  }

  // A student's grade must match the selected educator's actual classroom.
  const gradeId =
    role === "student"
      ? selectedSession.grade_id
      : requestedGradeId;

  const selectedGrade = gradeId
    ? await env.DB.prepare(
        "SELECT grade_id FROM sessions WHERE grade_id = ? AND school_id = ? LIMIT 1"
      ).bind(gradeId, schoolId).first()
    : null;

  if (!selectedGrade) {
    return json({
      error: "Choose a valid grade before registering."
    }, 400);
  }

  const existing = await env.DB.prepare("SELECT * FROM accounts WHERE username = ? COLLATE NOCASE")
    .bind(username)
    .first();
  const registration = {
    password,
    role,
    schoolId,
    fullName,
    email,
    phone,
    schoolOrSubject,
    gradeId,
    registeredSessionId,
  };
  if (existing) return existingRegistrationResponse(existing, registration, env, selectedSession);

  const passwordHash = await hashPassword(password);
  const id = randomId();
  try {
    await env.DB.prepare(
      "INSERT INTO accounts (id, username, password_hash, role, school_id, full_name, email, phone, school_or_subject, grade_id, registered_session_id, expires_at, activated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+1 month'), 0)",
    ).bind(id, username, passwordHash, role, schoolId, fullName, email, phone, schoolOrSubject, gradeId, registeredSessionId || null).run();
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
      const conflictingAccount = await env.DB.prepare("SELECT * FROM accounts WHERE username = ? COLLATE NOCASE")
        .bind(username)
        .first();
      if (conflictingAccount) {
        return existingRegistrationResponse(conflictingAccount, registration, env, selectedSession);
      }
    }
    throw error;
  }

  if (role === "educator") {
    const lessonSlots = Array.from({ length: 10 }, (_, index) =>
      env.DB.prepare(
        "INSERT OR IGNORE INTO educator_lessons (id, school_id, educator_id, slot) VALUES (?, ?, ?, ?)"
      ).bind(randomId(), schoolId, id, index + 1)
    );
    await env.DB.batch(lessonSlots);
  }

  const account = await env.DB.prepare("SELECT * FROM accounts WHERE id = ?").bind(id).first();
  const token = await signToken(
    { sub: id, role, username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS },
    env.SESSION_SIGNING_KEY,
  );
  return json({ account: publicAccount(account), token }, 201);
}

async function existingRegistrationResponse(account, registration, env, selectedSession) {
  const matches = await verifyPassword(registration.password, account.password_hash);
  if (account.school_id !== registration.schoolId) return json({ error: "That username is already registered at another school." }, 409);
  if (!matches) return json({ error: "That username is already registered. Sign in or choose another username." }, 409);
  const accountIsActive = Boolean(account.activated);
  if (accountIsActive && account.role !== registration.role) {
    return json({ error: "That username is already registered. Sign in or choose another username." }, 409);
  }
  if (accountIsActive && registration.gradeId && account.grade_id !== registration.gradeId) {
    return json({ error: "This account is already registered for another grade." }, 409);
  }
  if (!accountIsActive) {
    const registeredSessionId = registration.registeredSessionId || null;
    await env.DB.prepare(
      "UPDATE accounts SET role = ?, school_id = ?, full_name = ?, email = ?, phone = ?, school_or_subject = ?, grade_id = ?, registered_session_id = ? WHERE id = ?",
    ).bind(
      registration.role,
      registration.schoolId,
      registration.fullName,
      registration.email,
      registration.phone,
      registration.schoolOrSubject,
      registration.gradeId,
      registeredSessionId,
      account.id,
    ).run();
    account.role = registration.role;
    account.school_id = registration.schoolId;
    account.full_name = registration.fullName;
    account.email = registration.email;
    account.phone = registration.phone;
    account.school_or_subject = registration.schoolOrSubject;
    account.grade_id = registration.gradeId;
    account.registered_session_id = registeredSessionId;
  } else if (registration.registeredSessionId && account.registered_session_id !== registration.registeredSessionId) {
    if (account.registered_session_id) {
      return json({ error: "This account is already registered for another session." }, 409);
    }
    if (!selectedSession) return json({ error: "Choose a valid session before registering." }, 400);
    await env.DB.prepare(
      "UPDATE accounts SET registered_session_id = ?, grade_id = ? WHERE id = ?",
    ).bind(registration.registeredSessionId, selectedSession.grade_id, account.id).run();
    account.registered_session_id = registration.registeredSessionId;
    account.grade_id = selectedSession.grade_id;
  }
  const token = await signToken(
    { sub: account.id, role: account.role, username: account.username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS },
    env.SESSION_SIGNING_KEY,
  );
  return json({ account: publicAccount(account), token });
}


async function registrationSessions(env, schoolId) {
  const result = await env.DB.prepare(
    `SELECT
       id,
       grade_id,
       subject,
       title,
       teacher_name
     FROM sessions
     WHERE school_id = ?
     ORDER BY grade_id, subject, teacher_name COLLATE NOCASE, title`
  ).bind(schoolId).all();

  return json({
    sessions: (result.results || []).map((session) => ({
      id: session.id,
      gradeId: session.grade_id,
      subject: session.subject,
      title: session.title,
      teacherName: session.teacher_name || "",
    })),
  });
}


async function registrationGrades(env, schoolId) {
  const result = await env.DB.prepare(
    "SELECT DISTINCT grade_id FROM sessions WHERE grade_id != '' AND school_id = ? ORDER BY grade_id",
  ).bind(schoolId).all();
  return json({ grades: (result.results || []).map((row) => row.grade_id) });
}
async function registrationEducators(env, schoolId) {
  const result = await env.DB.prepare(
    `SELECT
       a.id,
       a.full_name,
       a.school_or_subject,
       a.grade_id,
       a.registered_session_id,
       s.id AS assigned_session_id,
       s.grade_id AS assigned_grade_id,
       s.subject AS assigned_subject
     FROM accounts a
     LEFT JOIN sessions s
       ON s.id = a.registered_session_id
     WHERE a.role = 'educator' AND a.school_id = ?
     ORDER BY a.full_name COLLATE NOCASE`
  ).bind(schoolId).all();

  return json({
    educators: (result.results || []).map((educator) => ({
      id: educator.id,
      name: educator.full_name,
      subject:
        educator.assigned_subject ||
        educator.school_or_subject ||
        "Academic Subject",
      gradeId: educator.assigned_grade_id || educator.grade_id,
      registeredSessionId: educator.assigned_session_id || null,
      hasAssignedClassroom: Boolean(educator.assigned_session_id),
    })),
  });
}

// Public read-only directory of educators who are currently live.
// This endpoint does not provide Stream credentials or classroom access.
async function liveEducators(request, env, schoolId) {
  const result = await env.DB.prepare(
    `SELECT
       s.id AS session_id,
       s.grade_id,
       s.subject,
       s.live_starts_at,
       a.id AS educator_id,
       a.full_name AS educator_name
     FROM sessions s
     INNER JOIN accounts a
       ON a.registered_session_id = s.id
       AND a.role = 'educator'
     WHERE s.is_live = 1 AND s.school_id = ? AND a.school_id = ?
     ORDER BY s.live_starts_at DESC, a.full_name COLLATE NOCASE`
  ).bind(schoolId, schoolId).all();

  return json({
    educators: (result.results || []).map((row) => ({
      sessionId: row.session_id,
      educatorId: row.educator_id,
      educatorName: row.educator_name,
      gradeId: row.grade_id,
      subject: row.subject,
      liveStartsAt: row.live_starts_at,
      isLive: true,
    })),
  });
}

async function handleLogin(request, env) {
  const body = await requestJson(request);
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password || password.length > MAX_PASSWORD_LENGTH) return json({ error: "Invalid username or password." }, 401);

  const recentAttempts = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM login_attempts WHERE username = ? COLLATE NOCASE AND succeeded = 0 AND created_at >= datetime('now', '-15 minutes')",
  ).bind(username).first();
  if ((recentAttempts?.count || 0) >= 5) {
    return json({ error: "Too many failed sign-in attempts. Try again in 15 minutes." }, 429);
  }

  const account = await env.DB.prepare("SELECT * FROM accounts WHERE username = ? COLLATE NOCASE")
    .bind(username)
    .first();
  const valid = account ? await verifyPassword(password, account.password_hash) : false;
  const ownerRow = account ? await env.DB.prepare("SELECT account_id FROM platform_owners WHERE account_id = ?").bind(account.id).first() : null;
  const isOwner = Boolean(ownerRow);
  const expiryTime = account?.expires_at ? Date.parse(`${account.expires_at.replace(' ', 'T')}Z`) : null;
  const expired = expiryTime !== null && (!Number.isFinite(expiryTime) || expiryTime <= Date.now());
  if (!account || !valid || !account.activated || (!isOwner && expired)) {
    await env.DB.prepare("INSERT INTO login_attempts (username, succeeded) VALUES (?, 0)").bind(username).run();
    return json({ error: "Invalid username or password, or account is not activated or has expired." }, 401);
  }
  if (account.role === "director" && !isOwner) {
    const school = await env.DB.prepare("SELECT license_active, license_expires_at FROM schools WHERE id = ? AND director_id = ?").bind(account.school_id, account.id).first();
    const licenseExpiry = school?.license_expires_at ? Date.parse(`${String(school.license_expires_at).replace(' ', 'T')}Z`) : null;
    if (!school || !Number(school.license_active) || (licenseExpiry !== null && (!Number.isFinite(licenseExpiry) || licenseExpiry <= Date.now()))) {
      return json({ error: "This school's one-year licence has expired or is suspended. Contact the platform Owner." }, 403);
    }
  }

  await env.DB.prepare("DELETE FROM login_attempts WHERE username = ? COLLATE NOCASE AND succeeded = 0").bind(username).run();
  const effectiveAccount = isOwner ? { ...account, role: "owner" } : account;
  const token = await signToken(
    { sub: account.id, role: effectiveAccount.role, username: account.username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS },
    env.SESSION_SIGNING_KEY,
  );
  return json({ account: publicAccount(effectiveAccount), token });
}

async function getCurrentAccount(request, env) {
  const claims = await authenticate(request, env, null);
  if (!claims || !["student", "educator", "owner"].includes(claims.role)) {
    return json({ error: "Account authentication required." }, 401);
  }
  const account = await env.DB.prepare("SELECT * FROM accounts WHERE id = ?").bind(claims.sub).first();
  if (claims.role === "owner") {
    const owner = await env.DB.prepare("SELECT account_id FROM platform_owners WHERE account_id = ?").bind(claims.sub).first();
    if (!account || !owner) return json({ error: "Owner account not found." }, 404);
    return json({ account: publicAccount({ ...account, role: "owner" }) });
  }
  if (!account || account.role !== claims.role) return json({ error: "Account not found." }, 404);
  return json({ account: publicAccount(account) });
}

async function directorProfile(request, env) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const profile = await env.DB.prepare(
    `SELECT a.school_id, a.username, schools.name AS school_name
     FROM accounts a
     INNER JOIN schools ON schools.id = a.school_id AND schools.director_id = a.id
     WHERE a.id = ? AND a.role = 'director'`
  ).bind(director.sub).first();
  if (!profile) return json({ error: "Director school profile not found." }, 404);
  return json({ profile: {
    schoolId: profile.school_id,
    schoolName: profile.school_name,
    username: profile.username,
  } });
}

async function updateDirectorProfile(request, env) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const body = await requestJson(request);
  const schoolName = typeof body?.schoolName === "string" ? body.schoolName.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!schoolName || schoolName.length > 160 ||
      !/^[a-z0-9._-]{3,32}$/.test(username)) {
    return json({ error: "Enter a school name and a valid 3–32 character username." }, 400);
  }
  if (body.password !== undefined && (!password || password.length > MAX_PASSWORD_LENGTH)) {
    return json({ error: "A password must contain 1–1,024 characters." }, 400);
  }

  const account = await env.DB.prepare(
    `SELECT accounts.id, accounts.school_id
     FROM accounts
     INNER JOIN schools
       ON schools.id = accounts.school_id
       AND schools.director_id = accounts.id
     WHERE accounts.id = ? AND accounts.role = 'director'`
  ).bind(director.sub).first();
  if (!account) return json({ error: "Your school ownership is not configured. Contact platform support." }, 403);

  const duplicate = await env.DB.prepare(
    "SELECT id FROM accounts WHERE username = ? COLLATE NOCASE AND id != ?"
  ).bind(username, director.sub).first();
  if (duplicate) return json({ error: "That username is already in use." }, 409);

  const statements = [
    env.DB.prepare("UPDATE schools SET name = ? WHERE id = ? AND director_id = ?")
      .bind(schoolName, account.school_id, director.sub),
  ];
  if (password) {
    statements.push(env.DB.prepare(
      "UPDATE accounts SET username = ?, password_hash = ? WHERE id = ? AND role = 'director'"
    ).bind(username, await hashPassword(password), director.sub));
  } else {
    statements.push(env.DB.prepare(
      "UPDATE accounts SET username = ? WHERE id = ? AND role = 'director'"
    ).bind(username, director.sub));
  }

  try {
    await env.DB.batch(statements);
  } catch {
    return json({ error: "That school name is already in use, or the settings could not be saved." }, 409);
  }

  const token = await signToken(
    { sub: director.sub, role: "director", username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS },
    env.SESSION_SIGNING_KEY,
  );
  return json({ profile: { schoolId: account.school_id, schoolName, username }, token });
}

async function getDirectorGradePricing(request, env) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const schoolId = await getDirectorSchoolId(env, director);
  if (!schoolId) return json({ error: "Director school is not configured." }, 403);
  const result = await env.DB.prepare(
    "SELECT grade_id, monthly_rate_usd FROM school_grade_pricing WHERE school_id = ? ORDER BY grade_id"
  ).bind(schoolId).all();
  return json({ prices: (result.results || []).map((row) => ({
    gradeId: row.grade_id,
    monthlyRateUsd: Number(row.monthly_rate_usd),
  })) });
}

async function updateDirectorGradePricing(request, env) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const schoolId = await getDirectorSchoolId(env, director);
  if (!schoolId) return json({ error: "Director school is not configured." }, 403);
  const body = await requestJson(request);
  const gradeId = typeof body?.gradeId === "string" ? body.gradeId.trim() : "";
  const monthlyRateUsd = Number(body?.monthlyRateUsd);
  if (!/^[a-z0-9_-]{1,40}$/.test(gradeId) ||
      !Number.isFinite(monthlyRateUsd) || monthlyRateUsd < 0 || monthlyRateUsd > 1000000) {
    return json({ error: "Enter a valid grade and a monthly rate between 0 and 1,000,000 USD." }, 400);
  }
  await env.DB.prepare(
    `INSERT INTO school_grade_pricing (school_id, grade_id, monthly_rate_usd, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(school_id, grade_id) DO UPDATE SET
       monthly_rate_usd = excluded.monthly_rate_usd,
       updated_at = datetime('now')`
  ).bind(schoolId, gradeId, monthlyRateUsd).run();
  return json({ price: { gradeId, monthlyRateUsd } });
}


async function requireOwner(request, env) {
  const claims = await authenticate(request, env, "owner");
  if (!claims) return null;
  const owner = await env.DB.prepare("SELECT account_id FROM platform_owners WHERE account_id = ?").bind(claims.sub).first();
  return owner ? claims : null;
}

async function ownerDirectors(request, env) {
  const owner = await requireOwner(request, env);
  if (!owner) return json({ error: "Owner access required." }, 401);
  const result = await env.DB.prepare(`
    SELECT a.id, a.username, a.full_name, a.email, a.phone, a.created_at,
           a.activated, a.paid, a.expires_at,
           s.id AS school_id, s.name AS school_name, s.license_expires_at,
           s.license_active, s.payment_method, s.payment_value,
           (SELECT COUNT(*) FROM accounts students
             WHERE students.school_id = s.id AND students.role = 'student') AS student_count,
           (SELECT COUNT(*) FROM accounts educators
             WHERE educators.school_id = s.id AND educators.role = 'educator') AS educator_count
    FROM accounts a
    INNER JOIN schools s ON s.director_id = a.id AND s.id = a.school_id
    WHERE a.role = 'director'
    ORDER BY a.created_at DESC
  `).all();
  return json({ directors: (result.results || []).map((row) => ({
    id: row.id, username: row.username, fullName: row.full_name,
    email: row.email, phone: row.phone, createdAt: row.created_at,
    activated: Boolean(row.activated), paid: Boolean(row.paid),
    expiresAt: row.license_expires_at || row.expires_at,
    schoolId: row.school_id, schoolName: row.school_name,
    licenseActive: Boolean(row.license_active),
    paymentMethod: row.payment_method || "suyool",
    paymentValue: row.payment_value || "https://payments.suyool.com/qr/p585_malazjanbeih",
    studentCount: Number(row.student_count || 0),
    educatorCount: Number(row.educator_count || 0),
    directorLink: `https://malazhub.github.io/agenda/?schoolId=${encodeURIComponent(row.school_id)}`,
  })) });
}

async function updateOwnerDirector(request, env, directorId) {
  const owner = await requireOwner(request, env);
  if (!owner) return json({ error: "Owner access required." }, 401);
  const body = await requestJson(request);
  const director = await env.DB.prepare(
    "SELECT a.id, a.school_id FROM accounts a INNER JOIN schools s ON s.director_id = a.id AND s.id = a.school_id WHERE a.id = ? AND a.role = 'director'"
  ).bind(directorId).first();
  if (!director) return json({ error: "Director not found." }, 404);
  const updates = [];
  const values = [];
  if (body?.paymentMethod !== undefined || body?.paymentValue !== undefined) {
    const method = String(body.paymentMethod || "").toLowerCase();
    const value = typeof body.paymentValue === "string" ? body.paymentValue.trim() : "";
    const methods = ["suyool", "whatsapp", "phone", "email", "bank"];
    if (!methods.includes(method) || !value || value.length > 500) {
      return json({ error: "Choose a supported payment method and provide its destination." }, 400);
    }
    if (["suyool", "bank"].includes(method) && !/^https:\/\//i.test(value)) return json({ error: "Payment links must use HTTPS." }, 400);
    if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return json({ error: "Enter a valid email address." }, 400);
    if (["phone", "whatsapp"].includes(method) && !/^\+?[0-9\s().-]{6,25}$/.test(value)) return json({ error: "Enter a valid phone number with country code." }, 400);
    updates.push("payment_method = ?", "payment_value = ?");
    values.push(method, value);
  }
  if (body?.renewLicense === true) {
    updates.push("license_expires_at = datetime('now', '+1 year')", "license_active = 1");
    await env.DB.prepare("UPDATE accounts SET expires_at = datetime('now', '+1 year'), activated = 1, paid = 1 WHERE id = ?").bind(directorId).run();
  }
  if (typeof body?.licenseActive === "boolean") {
    updates.push("license_active = ?");
    values.push(body.licenseActive ? 1 : 0);
  }
  if (!updates.length) return json({ error: "No supported Director changes were provided." }, 400);
  values.push(director.school_id);
  await env.DB.prepare(`UPDATE schools SET ${updates.join(", ")}, updated_at = datetime('now') WHERE id = ?`).bind(...values).run().catch(async () => {
    // Older D1 schemas may not have updated_at on schools.
    const safeUpdates = updates.filter((item) => item !== "updated_at = datetime('now')");
    await env.DB.prepare(`UPDATE schools SET ${safeUpdates.join(", ")} WHERE id = ?`).bind(...values).run();
  });
  return json({ updated: true });
}

async function publicSchoolPayment(url, env) {
  const schoolId = url.searchParams.get("schoolId") || "";
  if (!schoolId || schoolId.length > 100) return json({ error: "A valid schoolId is required." }, 400);
  const school = await env.DB.prepare("SELECT payment_method, payment_value FROM schools WHERE id = ?").bind(schoolId).first();
  if (!school) return json({ error: "School not found." }, 404);
  return json({
    paymentMethod: school.payment_method || "suyool",
    paymentValue: school.payment_value || "https://payments.suyool.com/qr/p585_malazjanbeih",
  });
}

async function schoolPublicContext(env, schoolId) {
  if (!schoolId || schoolId.length > 100) return json({ error: "A valid schoolId is required." }, 400);
  const school = await env.DB.prepare(
    "SELECT id, name FROM schools WHERE id = ?"
  ).bind(schoolId).first();
  if (!school) return json({ error: "School not found." }, 404);
  const [prices, sessions, educators] = await Promise.all([
    env.DB.prepare("SELECT grade_id, monthly_rate_usd FROM school_grade_pricing WHERE school_id = ?").bind(schoolId).all(),
    env.DB.prepare(
      "SELECT grade_id, subject, title, teacher_name FROM sessions WHERE school_id = ? ORDER BY grade_id, subject LIMIT 500"
    ).bind(schoolId).all(),
    env.DB.prepare(
      "SELECT id, full_name, school_or_subject, grade_id FROM accounts WHERE school_id = ? AND role = 'educator' ORDER BY full_name COLLATE NOCASE"
    ).bind(schoolId).all(),
  ]);
  const priceMap = new Map((prices.results || []).map((row) => [row.grade_id, Number(row.monthly_rate_usd)]));
  const grades = [...new Set((sessions.results || []).map((row) => row.grade_id))];
  return json({
    schoolId: school.id,
    schoolName: school.name,
    defaultMonthlyRateUsd: 125,
    prices: grades.map((gradeId) => ({ gradeId, monthlyRateUsd: priceMap.get(gradeId) ?? 125 })),
    sessions: (sessions.results || []).map((row) => ({
      gradeId: row.grade_id,
      subject: row.subject,
      sessionName: row.title,
      educatorName: row.teacher_name || row.title,
    })),
    educators: (educators.results || []).map((row) => ({
      id: row.id,
      name: row.full_name,
      subject: row.school_or_subject || "",
      gradeId: row.grade_id || "",
    })),
    guidance: {
      register: "Choose this school's shared link, select Student or Educator, complete the registration fields, choose an available educator/session, and wait for Director activation.",
      signIn: "Use the username and password created during registration. The Director can activate, renew, or reset credentials.",
      live: "Sign in with the account assigned to the exact educator session. Educators start their class; activated and paid students join their registered live class. The Director can monitor any class from Manage Sessions.",
      lessons: "Open Learning Resources from the classroom tabs to view an educator's saved lesson slots and media. Educators manage their own lesson slots.",
    },
  });
}

async function getDirectorLiveStream(request, env) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const schoolId = await getDirectorSchoolId(env, director);
  if (!schoolId) return json({ error: "Director school is not configured." }, 403);
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId") || "";
  const session = await env.DB.prepare(
    "SELECT id, title, teacher_name FROM sessions WHERE id = ? AND school_id = ?"
  ).bind(sessionId, schoolId).first();
  if (!session) return json({ error: "This class does not belong to your school." }, 404);

  const stream = await signStreamCallToken(env, director.sub, session.id, "admin", "default");
  if (!stream) return json({ error: "Stream Video is not configured." }, 503);

  let serverToken;
  try { serverToken = await signStreamServerToken(env); }
  catch { return json({ error: "Stream server authentication is not configured." }, 503); }
  const headers = { Authorization: serverToken, "stream-auth-type": "jwt", "Content-Type": "application/json" };
  const userResponse = await fetch(
    `https://video.stream-io-api.com/api/v2/users?api_key=${encodeURIComponent(stream.apiKey)}`,
    { method: "POST", headers, body: JSON.stringify({ users: { [director.sub]: { id: director.sub, name: director.username || "Director" } } }) }
  );
  if (!userResponse.ok && userResponse.status !== 409) return json({ error: "Could not register the Director with Stream Video." }, 502);

  const callUrl = `https://video.stream-io-api.com/api/v2/video/call/default/${encodeURIComponent(stream.callId)}?api_key=${encodeURIComponent(stream.apiKey)}`;
  const existingCall = await fetch(callUrl, { headers });
  if (existingCall.status === 404) {
    const createResponse = await fetch(callUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ data: { created_by_id: director.sub, members: [{ user_id: director.sub, role: "admin" }] } }),
    });
    if (!createResponse.ok && createResponse.status !== 409) {
      return json({ error: "Could not open this classroom for Director monitoring." }, 502);
    }
  } else if (!existingCall.ok) {
    return json({ error: "Could not retrieve the classroom for Director monitoring." }, 502);
  }
  return json({ status: "waiting", ...stream, userName: director.username || "Director" });
}

async function directorAccounts(request, env) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const schoolId = await getDirectorSchoolId(env, director);
  if (!schoolId) return json({ error: "Director school is not configured." }, 403);
  const [students, educators] = await Promise.all([
    env.DB.prepare("SELECT * FROM accounts WHERE role = 'student' AND school_id = ? ORDER BY created_at DESC").bind(schoolId).all(),
    env.DB.prepare("SELECT * FROM accounts WHERE role = 'educator' AND school_id = ? ORDER BY created_at DESC").bind(schoolId).all(),
  ]);
  return json({
    students: (students.results || []).map(publicAccount),
    educators: (educators.results || []).map(publicAccount),
  });
}


async function deleteAccount(request, env, accountId) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const schoolId = await getDirectorSchoolId(env, director);
  if (!schoolId) return json({ error: "Director school is not configured." }, 403);
  const account = await env.DB.prepare(
    "SELECT id, role FROM accounts WHERE id = ? AND school_id = ? AND role IN ('student', 'educator')"
  ).bind(accountId, schoolId).first();
  if (!account) return json({ error: "Account not found." }, 404);

  if (account.role === "educator") {
    const lessons = await env.DB.prepare(
      "SELECT media_key FROM educator_lessons WHERE educator_id = ? AND school_id = ?"
    ).bind(accountId, schoolId).all();
    for (const lesson of lessons.results || []) {
      if (lesson.media_key) await env.SESSION_MEDIA_BUCKET.delete(lesson.media_key);
    }
    await env.DB.prepare(
      "DELETE FROM educator_lessons WHERE educator_id = ? AND school_id = ?"
    ).bind(accountId, schoolId).run();
  }

  await env.DB.prepare(
    "DELETE FROM accounts WHERE id = ? AND school_id = ?"
  ).bind(accountId, schoolId).run();
  return json({ deleted: true, fileCleanupComplete: true });
}

async function updateAccount(request, env, accountId) {
  const director = await authenticate(request, env, "director");
  if (!director) {
    return json({ error: "Director authentication required." }, 401);
  }

  const body = await requestJson(request);
  const schoolId = await getDirectorSchoolId(env, director);
  if (!schoolId) return json({ error: "Director school is not configured." }, 403);

  const account = await env.DB.prepare(
    `SELECT id, role, full_name, registered_session_id, school_id
     FROM accounts
     WHERE id = ? AND school_id = ?
       AND role IN ('student', 'educator')`
  ).bind(accountId, schoolId).first();

  if (!account) {
    return json({ error: "Account not found." }, 404);
  }

  const updates = [];
  const values = [];
  let createClassroomStatement = null;

  if (typeof body?.activated === "boolean") {
    updates.push("activated = ?");
    values.push(Number(body.activated));
  }

  if (typeof body?.paid === "boolean") {
    updates.push("paid = ?");
    values.push(Number(body.paid));
  }
  if (typeof body?.educatorId === "string") {
    if (account.role !== "student") {
      return json({
        error: "Only student accounts can be assigned to an educator."
      }, 400);
    }

    const selectedEducator = await env.DB.prepare(
      `SELECT id, registered_session_id
       FROM accounts
       WHERE id = ? AND school_id = ?
         AND role = 'educator'`
    ).bind(body.educatorId, schoolId).first();

    if (!selectedEducator || !selectedEducator.registered_session_id) {
      return json({
        error: "The selected educator does not have an assigned classroom."
      }, 400);
    }

    const selectedEducatorSession = await env.DB.prepare(
      "SELECT * FROM sessions WHERE id = ? AND school_id = ?"
    ).bind(selectedEducator.registered_session_id, schoolId).first();

    if (!selectedEducatorSession) {
      return json({
        error: "The selected educator classroom could not be found."
      }, 400);
    }

    updates.push(
      "registered_session_id = ?",
      "grade_id = ?"
    );

    values.push(
      selectedEducatorSession.id,
      selectedEducatorSession.grade_id
    );
  }
  if (typeof body?.registeredSessionId === "string") {
    const selectedSession = await env.DB.prepare(
      "SELECT * FROM sessions WHERE id = ? AND school_id = ?"
    ).bind(body.registeredSessionId, schoolId).first();

    if (!selectedSession) {
      return json({
        error: "Choose a valid registered session."
      }, 400);
    }

    let assignedSessionId = selectedSession.id;

    if (account.role === "educator") {
      const anotherEducator = await env.DB.prepare(
        `SELECT id
         FROM accounts
         WHERE role = 'educator'
           AND registered_session_id = ?
           AND id != ?
         LIMIT 1`
      ).bind(selectedSession.id, account.id).first();

      const alreadyOwnsThisRoom =
        String(account.registered_session_id || "") ===
        String(selectedSession.id);

      // Every educator must have an independent classroom.
      // A new assignment gets a new classroom ID, even when
      // the lesson, grade and subject are identical.
      // An existing unique classroom is retained.
      if (!alreadyOwnsThisRoom || anotherEducator) {
        assignedSessionId = randomId();

        createClassroomStatement = env.DB.prepare(
          `INSERT INTO sessions (
            id,
            school_id,
            grade_id,
            subject,
            title,
            teacher_name,
            source_name,
            source_url,
            playback_url,
            media_key,
            is_live,
            live_starts_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)`
        ).bind(
          assignedSessionId,
          schoolId,
          selectedSession.grade_id,
          selectedSession.subject,
          selectedSession.title,
          account.full_name,
          selectedSession.source_name,
          selectedSession.source_url,
          selectedSession.playback_url || selectedSession.source_url,
          selectedSession.media_key
        );
      } else {
        // Keep the educator's existing unique room.
        await env.DB.prepare(
          `UPDATE sessions
           SET teacher_name = ?
           WHERE id = ?`
        ).bind(
          account.full_name,
          selectedSession.id
        ).run();
      }
    }

    // Students keep the exact educator classroom they selected.
    // Educators receive their own classroom ID.
    updates.push("registered_session_id = ?", "grade_id = ?");
    values.push(assignedSessionId, selectedSession.grade_id);
  }

  if (typeof body?.username === "string") {
    const username = body.username.trim();
    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)) {
      return json({ error: "Username must be 3–40 characters using letters, numbers, dot, underscore or hyphen." }, 400);
    }
    const existingUsername = await env.DB.prepare(
      "SELECT id FROM accounts WHERE username = ? COLLATE NOCASE AND id != ?"
    ).bind(username, accountId).first();
    if (existingUsername) {
      return json({ error: "That username is already in use." }, 409);
    }
    updates.push("username = ?");
    values.push(username);
  }

  if (typeof body?.password === "string") {
    if (!body.password || body.password.length > MAX_PASSWORD_LENGTH) {
      return json({
        error: "A password must contain 1–1,024 characters."
      }, 400);
    }

    updates.push("password_hash = ?");
    values.push(await hashPassword(body.password));
  }

  if (body?.renew === true) {
    updates.push("expires_at = datetime('now', '+1 month')");
  }

  if (!updates.length) {
    return json({
      error: "Provide at least one supported account update."
    }, 400);
  }

  values.push(accountId);

  const accountUpdateStatement = env.DB.prepare(
    `UPDATE accounts
     SET ${updates.join(", ")}
     WHERE id = ?
       AND role IN ('student', 'educator')`
  ).bind(...values);

  let result;

  if (createClassroomStatement) {
    // Create the classroom and assign it to the educator together.
    const batchResults = await env.DB.batch([
      createClassroomStatement,
      accountUpdateStatement
    ]);

    result = batchResults[1];
  } else {
    result = await accountUpdateStatement.run();
  }

  if (!result.meta.changes) {
    return json({ error: "Account not found." }, 404);
  }

  const savedAccount = await env.DB.prepare(
    "SELECT * FROM accounts WHERE id = ? AND school_id = ?"
  ).bind(accountId, schoolId).first();

  return json({
    account: publicAccount(savedAccount)
  });
}


async function directorSessions(request, env) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const schoolId = await getDirectorSchoolId(env, director);
  if (!schoolId) return json({ error: "Director school is not configured." }, 403);
  const result = await env.DB.prepare(
    "SELECT * FROM sessions WHERE school_id = ? ORDER BY grade_id, subject, title LIMIT 1000",
  ).bind(schoolId).all();
  return json({ sessions: (result.results || []).map(publicSession) });
}

function publicSession(session) {
  return {
    id: session.id,
    gradeId: session.grade_id,
    subject: session.subject,
    title: session.title,
    teacherName: session.teacher_name,
    sourceName: session.source_name,
    sourceUrl: session.source_url,
    playbackUrl: session.playback_url || session.source_url,
    isLive: Boolean(session.is_live),
    liveStartsAt: session.live_starts_at,
    mediaUrl: session.media_key ? `/api/media/${encodeURIComponent(session.media_key)}?schoolId=${encodeURIComponent(session.school_id)}` : null,
  };
}

async function deleteSession(request, env, sessionId) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const schoolId = await getDirectorSchoolId(env, director);
  if (!schoolId) return json({ error: "Director school is not configured." }, 403);
  const result = await env.DB.prepare("DELETE FROM sessions WHERE id = ? AND school_id = ?").bind(sessionId, schoolId).run();
  if (!result.meta.changes) return json({ error: "Session not found." }, 404);
  return json({ deleted: true });
}

async function updateDirectorSessionLive(request, env, sessionId) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const schoolId = await getDirectorSchoolId(env, director);
  if (!schoolId) return json({ error: "Director school is not configured." }, 403);
  const body = await requestJson(request);
  if (typeof body?.isLive !== "boolean") return json({ error: "isLive must be a boolean." }, 400);
  const result = await env.DB.prepare(
    "UPDATE sessions SET is_live = ?, live_starts_at = CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END WHERE id = ? AND school_id = ?"
  ).bind(Number(body.isLive), Number(body.isLive), sessionId, schoolId).run();
  if (!result.meta.changes) return json({ error: "Session not found." }, 404);
  const session = await env.DB.prepare("SELECT * FROM sessions WHERE id = ? AND school_id = ?").bind(sessionId, schoolId).first();
  return json({ session: publicSession(session) });
}

async function listSessions(url, env, request) {
  const gradeId = url.searchParams.get("gradeId") || "";
  const liveOnly = url.searchParams.get("live") === "true";
  const sessionId = url.searchParams.get("sessionId") || "";
  const schoolId = url.searchParams.get("schoolId") || "";

  if (!schoolId || !/^[a-z0-9_-]{1,40}$/.test(gradeId)) {
    return json({ error: "A valid gradeId is required." }, 400);
  }

  if (liveOnly) {
    const claims = await authenticate(request, env, null);

    if (!claims || !["student", "educator"].includes(claims.role)) {
      return json({ error: "Please sign in first." }, 401);
    }

    const account = await env.DB.prepare(
      `SELECT id, role, school_id, activated, paid, expires_at,
              grade_id, registered_session_id
       FROM accounts
       WHERE id = ?`
    ).bind(claims.sub).first();

    if (!account || claims.role !== account.role || account.school_id !== schoolId) {
      return json({ error: "Account verification failed for this school." }, 403);
    }

    const isActivated =
      account.activated === true ||
      account.activated === 1 ||
      String(account.activated).toLowerCase() === "true" ||
      String(account.activated) === "1";

    const isPaid =
      account.paid === true ||
      account.paid === 1 ||
      String(account.paid).toLowerCase() === "true" ||
      String(account.paid) === "1";

    const expiryTime = account.expires_at
      ? Date.parse(`${String(account.expires_at).replace(" ", "T")}Z`)
      : null;

    if (
      !isActivated ||
      !isPaid ||
      (expiryTime !== null &&
        (!Number.isFinite(expiryTime) || expiryTime <= Date.now()))
    ) {
      return json({
        error: "Your account must be activated, paid, and not expired."
      }, 403);
    }

    if (account.grade_id !== gradeId) {
      return json({
        error: "Live sessions are limited to your registered grade."
      }, 403);
    }

    if (sessionId) {
      const access = await registeredLiveSession(
        request,
        env,
        sessionId
      );

      if (access.error) {
        return access.error;
      }

      if (access.session.grade_id !== gradeId) {
        return json({ error: "Invalid session grade." }, 403);
      }

      return json({
        sessions: [publicSession(access.session)]
      });
    }

    // Only show the exact classroom assigned to this account.
    if (!account.registered_session_id) {
      return json({ sessions: [] });
    }

    const assignedSession = await env.DB.prepare(
      `SELECT *
       FROM sessions
       WHERE id = ?
         AND school_id = ?
         AND grade_id = ?
         AND is_live = 1`
    ).bind(
      account.registered_session_id,
      schoolId,
      gradeId
    ).first();

    return json({
      sessions: assignedSession
        ? [publicSession(assignedSession)]
        : []
    });
  }

  const result = await env.DB.prepare(
    `SELECT *
     FROM sessions
     WHERE school_id = ? AND grade_id = ? AND is_live = 0
     ORDER BY RANDOM()
     LIMIT 20`
  ).bind(schoolId, gradeId).all();

  return json({
    sessions: (result.results || []).map(publicSession)
  });
}

async function registeredLiveSession(request, env, sessionId) {
  const claims = await authenticate(request, env, null);

  if (!claims || !["student", "educator"].includes(claims.role)) {
    return {
      error: json({
        error: "Please sign in with your student or educator account."
      }, 401)
    };
  }

  if (!sessionId || !/^[a-zA-Z0-9_-]{1,100}$/.test(sessionId)) {
    return {
      error: json({ error: "A valid session ID is required." }, 400)
    };
  }

  const account = await env.DB.prepare(
    `SELECT id, role, school_id, full_name, activated, paid, expires_at,
            registered_session_id, grade_id
     FROM accounts
     WHERE id = ?`
  ).bind(claims.sub).first();

  if (!account) {
    return {
      error: json({ error: "Account not found." }, 404)
    };
  }

  const isActivated =
    account.activated === true ||
    account.activated === 1 ||
    String(account.activated).toLowerCase() === "true" ||
    String(account.activated) === "1";

  const isPaid =
    account.paid === true ||
    account.paid === 1 ||
    String(account.paid).toLowerCase() === "true" ||
    String(account.paid) === "1";

  const expiryTime = account.expires_at
    ? Date.parse(`${String(account.expires_at).replace(" ", "T")}Z`)
    : null;

  if (
    !isActivated ||
    !isPaid ||
    (expiryTime !== null &&
      (!Number.isFinite(expiryTime) || expiryTime <= Date.now()))
  ) {
    return {
      error: json({
        error: "Your account must be activated, paid, and not expired."
      }, 403)
    };
  }

  // The signed-in account must match the role stored in the database.
  if (claims.role !== account.role) {
    return {
      error: json({ error: "Account role verification failed." }, 403)
    };
  }

  // Educators must be able to obtain credentials to CREATE
// an offline classroom. Students can obtain credentials only
// after the educator has marked the classroom live.
const sessionQuery =
  claims.role === "educator"
    ? "SELECT * FROM sessions WHERE id = ? AND school_id = ?"
    : "SELECT * FROM sessions WHERE id = ? AND school_id = ? AND is_live = 1";

const session = await env.DB.prepare(sessionQuery)
  .bind(sessionId, account.school_id)
  .first();

  if (!session) {
    return {
      error: json({
        error: "This live session is currently offline."
      }, 404)
    };
  }

  // Exact Director-assigned session ID is mandatory.
  // No grade-only access and no educator-name matching.
  if (
    !account.registered_session_id ||
    String(account.registered_session_id) !== String(session.id)
  ) {
    return {
      error: json({
        error: "You are not registered for this exact educator session."
      }, 403)
    };
  }

  if (
  account.role === "student" &&
  account.grade_id !== session.grade_id
) {
  return {
    error: json({
      error: "This session does not belong to your registered grade."
    }, 403)
  };
}

  return { account, session };
}
async function setEducatorLiveSession(request, env) {
  const claims = await authenticate(request, env, null);

  if (!claims || claims.role !== "educator") {
    return json({ error: "Educator authentication required." }, 401);
  }

  const body = await requestJson(request);

  if (typeof body?.isLive !== "boolean") {
    return json({ error: "The isLive field must be a boolean." }, 400);
  }

  const account = await env.DB.prepare(
    `SELECT id, role, activated, paid, expires_at,
            registered_session_id, grade_id
     FROM accounts
     WHERE id = ?`
  ).bind(claims.sub).first();

  if (!account || account.role !== "educator") {
    return json({ error: "Educator account verification failed." }, 403);
  }

  if (!account.registered_session_id) {
    return json({
      error: "No classroom is assigned to this educator."
    }, 403);
  }

  const session = await env.DB.prepare(
  `SELECT id, grade_id
   FROM sessions
   WHERE id = ?`
).bind(account.registered_session_id).first();

  if (!session) {
    return json({
      error: "The educator's assigned classroom was not found."
    }, 404);
  }

  if (body.isLive) {
    const isActivated =
      account.activated === true ||
      account.activated === 1 ||
      String(account.activated).toLowerCase() === "true" ||
      String(account.activated) === "1";

    const isPaid =
      account.paid === true ||
      account.paid === 1 ||
      String(account.paid).toLowerCase() === "true" ||
      String(account.paid) === "1";

    const expiryTime = account.expires_at
      ? Date.parse(`${String(account.expires_at).replace(" ", "T")}Z`)
      : null;

    if (
      !isActivated ||
      !isPaid ||
      (expiryTime !== null &&
        (!Number.isFinite(expiryTime) || expiryTime <= Date.now()))
    ) {
      return json({
        error: "Your educator account must be activated, paid, and not expired."
      }, 403);
    }
  }

  await env.DB.prepare(
    `UPDATE sessions
     SET is_live = ?, live_starts_at = ?
     WHERE id = ?`
  ).bind(
    Number(body.isLive),
    body.isLive ? new Date().toISOString() : null,
    session.id
  ).run();

  return json({
    updated: true,
    sessionId: session.id,
    isLive: body.isLive
  });
}


async function getLiveStream(request, env) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId") || "";

  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(sessionId)) {
    return json({ error: "A valid session ID is required." }, 400);
  }

  const access = await registeredLiveSession(
    request,
    env,
    sessionId
  );

  if (access.error) {
    return access.error;
  }

  const stream = await signStreamCallToken(
    env,
    access.account.id,
    access.session.id,
    access.account.role === "educator" ? "admin" : undefined,
    "default"
  );

  if (!stream) {
    return json({
      error: "Stream Video is not configured. Check STREAM_VIDEO_API_KEY and STREAM_VIDEO_API_SECRET."
    }, 503);
  }

  let serverToken;

  try {
    serverToken = await signStreamServerToken(env);
  } catch (error) {
    console.error("Stream server authentication failed:", error);

    return json({
      error: "Stream server authentication is not configured correctly."
    }, 503);
  }

  const serverHeaders = {
    "Authorization": serverToken,
    "stream-auth-type": "jwt",
    "Content-Type": "application/json"
  };

  // Register the authenticated participant in the same Stream project.
  const userUrl =
    `https://video.stream-io-api.com/api/v2/users?api_key=${encodeURIComponent(stream.apiKey)}`;

  let userResponse;

  try {
    userResponse = await fetch(userUrl, {
      method: "POST",
      headers: serverHeaders,
      body: JSON.stringify({
        users: {
          [access.account.id]: {
            id: access.account.id,
            name: access.account.full_name || access.account.id
          }
        }
      })
    });
  } catch (error) {
    console.error("Stream user registration request failed:", error);

    return json({
      error: "Could not connect to Stream to register the classroom participant."
    }, 502);
  }

  if (!userResponse.ok) {
    const details = await userResponse.text();

    console.error(
      "Stream user registration failed:",
      userResponse.status,
      details
    );

    return json({
      error: `Stream user registration failed (HTTP ${userResponse.status}).`
    }, 502);
  }

  // Only the assigned educator creates or retrieves the classroom.
  // Students receive credentials only after the educator has marked it live.
  if (access.account.role === "educator") {
    const createCallUrl =
      `https://video.stream-io-api.com/api/v2/video/call/default/${encodeURIComponent(stream.callId)}?api_key=${encodeURIComponent(stream.apiKey)}`;

    let createCallResponse;

    try {
      createCallResponse = await fetch(createCallUrl, {
        method: "POST",
        headers: serverHeaders,
        body: JSON.stringify({
          data: {
            created_by_id: access.account.id,
            members: [
              {
                user_id: access.account.id,
                role: "admin"
              }
            ]
          }
        })
      });
    } catch (error) {
      console.error("Stream classroom creation request failed:", error);

      return json({
        error: "Could not connect to Stream to create the assigned classroom."
      }, 502);
    }

    if (!createCallResponse.ok && createCallResponse.status !== 409) {
      const details = await createCallResponse.text();

      console.error(
        "Stream classroom creation failed:",
        createCallResponse.status,
        details
      );

      return json({
        error: `Stream classroom creation failed (HTTP ${createCallResponse.status}). Check the Worker logs.`
      }, 502);
    }

    console.log(
      "Stream classroom ready:",
      `default:${stream.callId}`
    );
  }

  return json({
    status: "waiting",
    ...stream,
    userName: access.account.full_name
  });
}

// Create an isolated, temporary Stream call for an anonymous guest.
// It never uses an educator's assigned session ID.
async function createGuestLiveStream(request, env) {
  const ipAddress =
    request.headers.get("CF-Connecting-IP") || "unknown";

  // Hash the visitor IP before storing it for rate limiting.
  const ipDigest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(
      `${env.SESSION_SIGNING_KEY}:${ipAddress}`
    )
  );

  const ipHash = base64UrlEncode(
    new Uint8Array(ipDigest)
  );

  // Keep guest credential creation rate-limited.
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS guest_stream_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  ).run();

  const recentAttempts = await env.DB.prepare(
    `SELECT COUNT(*) AS attempts
     FROM guest_stream_attempts
     WHERE ip_hash = ?
       AND created_at >= datetime('now', '-10 minutes')`
  ).bind(ipHash).first();

  if (Number(recentAttempts?.attempts || 0) >= 8) {
    return json({
      error: "Too many guest-room attempts. Please try again later."
    }, 429);
  }

  await env.DB.prepare(
    `INSERT INTO guest_stream_attempts (ip_hash)
     VALUES (?)`
  ).bind(ipHash).run();

  await env.DB.prepare(
    `DELETE FROM guest_stream_attempts
     WHERE created_at < datetime('now', '-1 day')`
  ).run();

  // Both identifiers are generated by the Worker, not the browser.
  const guestUserId =
    `guest_${randomId().replace(/-/g, "")}`;

  const guestCallId =
    `agenda_guest_${randomId().replace(/-/g, "")}`;

  const stream = await signStreamCallToken(
    env,
    guestUserId,
    guestCallId,
    undefined,
    "default"
  );

  if (!stream) {
    return json({
      error: "Stream Video is not configured."
    }, 503);
  }

  let serverToken;

  try {
    serverToken = await signStreamServerToken(env);
  } catch (error) {
    console.error(
      "Guest Stream server authentication failed:",
      error
    );

    return json({
      error: "Stream server authentication is not configured."
    }, 503);
  }

  const serverHeaders = {
    "Authorization": serverToken,
    "stream-auth-type": "jwt",
    "Content-Type": "application/json"
  };

  // Register the temporary user in the Stream project.
  const userUrl =
    `https://video.stream-io-api.com/api/v2/users?api_key=${encodeURIComponent(stream.apiKey)}`;

  let userResponse;

  try {
    userResponse = await fetch(userUrl, {
      method: "POST",
      headers: serverHeaders,
      body: JSON.stringify({
        users: {
          [guestUserId]: {
            id: guestUserId,
            name: "Guest"
          }
        }
      })
    });
  } catch (error) {
    console.error(
      "Guest Stream user registration failed:",
      error
    );

    return json({
      error: "Could not register the guest test user with Stream."
    }, 502);
  }

  if (!userResponse.ok) {
    const details = await userResponse.text();

    console.error(
      "Guest Stream user registration rejected:",
      userResponse.status,
      details
    );

    return json({
      error: "Could not register the guest test user with Stream."
    }, 502);
  }

  return json({
    status: "waiting",
    ...stream,
    userName: "Guest"
  });
}

async function ensureLiveStream(request, env) {
  const director = await authenticate(request, env, "director");
  if (!director) {
    return json({ error: "Director authentication required." }, 401);
  }

  const stream = await signStreamCallToken(
    env,
    director.sub,
    STREAM_VIDEO_CALL_ID,
    "admin"
  );

  if (!stream) {
    return json({
      error: "Live video is not configured. Ask the administrator to configure Stream Video credentials."
    }, 503);
  }

  return json({
    ...stream,
    userName: "Agenda Director"
  });
}

async function createSessions(request, env) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const schoolId = await getDirectorSchoolId(env, director);
  if (!schoolId) return json({ error: "Director school is not configured." }, 403);
  const body = await requestJson(request);
  if (!Array.isArray(body?.sessions) || body.sessions.length < 1 || body.sessions.length > 500) {
    return json({ error: "Provide between 1 and 500 session records." }, 400);
  }

  const statements = [];
  for (const session of body.sessions) {
    const gradeId = typeof session?.gradeId === "string" ? session.gradeId.trim() : "";
    const subject = typeof session?.subject === "string" ? session.subject.trim() : "";
    const title = typeof session?.title === "string" ? session.title.trim() : "";
    const sourceName = typeof session?.sourceName === "string" ? session.sourceName.trim() : "";
    const sourceUrl = typeof session?.sourceUrl === "string" ? session.sourceUrl.trim() : "";
    const playbackUrl = typeof session?.playbackUrl === "string" && session.playbackUrl.trim() ? session.playbackUrl.trim() : sourceUrl;
    const mediaKey = typeof session?.mediaKey === "string" ? session.mediaKey.trim() : "";
    let source;
    let playback;
    try {
      source = new URL(sourceUrl);
      playback = new URL(playbackUrl);
    } catch {
      return json({ error: "Session source and playback URLs must be valid HTTPS URLs." }, 400);
    }
    if (
      !/^[a-z0-9_-]{1,40}$/.test(gradeId) ||
      !subject || subject.length > 80 ||
      !title || title.length > 200 ||
      !sourceName || sourceName.length > 100 ||
      mediaKey.length > 300 ||
      (mediaKey && mediaKey.split("/").some((part) => !part || part === "." || part === "..")) ||
      source.protocol !== "https:" ||
      playback.protocol !== "https:"
    ) {
      return json({ error: "A session has invalid or missing fields." }, 400);
    }
    if (mediaKey && !(await env.SESSION_MEDIA_BUCKET.head(mediaKey))) {
      return json({ error: "The referenced R2 media object does not exist." }, 400);
    }
    if (typeof session.isLive !== "boolean" && session.isLive !== undefined) {
      return json({ error: "The isLive field must be a boolean." }, 400);
    }
    const isLive = session.isLive === true;
    const liveStartsAt = typeof session.liveStartsAt === "string" ? session.liveStartsAt : null;
    if (liveStartsAt && Number.isNaN(Date.parse(liveStartsAt))) {
      return json({ error: "The live start time must be a valid date." }, 400);
    }
    statements.push(
      env.DB.prepare(
        "INSERT OR REPLACE INTO sessions (id, school_id, grade_id, subject, title, teacher_name, source_name, source_url, playback_url, media_key, is_live, live_starts_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(
        typeof session.id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(session.id) ? session.id : randomId(),
        schoolId,
        gradeId,
        subject,
        title,
        typeof session.teacherName === "string" ? session.teacherName.slice(0, 120) : "",
        sourceName,
        sourceUrl,
        playbackUrl,
        mediaKey || null,
        Number(isLive),
        liveStartsAt,
      ),
    );
  }
  for (let offset = 0; offset < statements.length; offset += 100) {
    await env.DB.batch(statements.slice(offset, offset + 100));
  }
  return json({ saved: statements.length }, 201);
}


function publicEducatorLesson(row) {
  return {
    id: row.id,
    schoolId: row.school_id,
    educatorId: row.educator_id,
    slot: row.slot,
    title: row.title || "",
    subject: row.subject || "",
    description: row.description || "",
    mediaUrl: row.media_key ? `/api/media/${encodeURIComponent(row.media_key)}?schoolId=${encodeURIComponent(row.school_id)}` : null,
    mediaName: row.media_name || null,
    mediaType: row.media_type || null,
    mediaSize: Number(row.media_size || 0),
    updatedAt: row.updated_at,
  };
}

async function schoolEducators(env, schoolId) {
  const school = await env.DB.prepare("SELECT id FROM schools WHERE id = ?").bind(schoolId).first();
  if (!school) return json({ error: "School not found." }, 404);
  const result = await env.DB.prepare(
    `SELECT id, full_name, school_or_subject, grade_id, registered_session_id
     FROM accounts
     WHERE school_id = ? AND role = 'educator'
     ORDER BY full_name COLLATE NOCASE`
  ).bind(schoolId).all();
  return json({ educators: (result.results || []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    subject: row.school_or_subject || "",
    gradeId: row.grade_id,
    registeredSessionId: row.registered_session_id || null,
  })) });
}

async function educatorLessons(env, schoolId, educatorId) {
  const educator = await env.DB.prepare(
    "SELECT id FROM accounts WHERE id = ? AND school_id = ? AND role = 'educator'"
  ).bind(educatorId, schoolId).first();
  if (!educator) return json({ error: "Educator not found in this school." }, 404);
  const result = await env.DB.prepare(
    "SELECT * FROM educator_lessons WHERE school_id = ? AND educator_id = ? ORDER BY slot"
  ).bind(schoolId, educatorId).all();
  return json({ lessons: (result.results || []).map(publicEducatorLesson) });
}

async function updateEducatorLesson(request, env, lessonId, clearOnly = false) {
  const claims = await authenticate(request, env, "educator");
  if (!claims) return json({ error: "Educator authentication required." }, 401);
  const educator = await env.DB.prepare(
    "SELECT id, school_id FROM accounts WHERE id = ? AND role = 'educator'"
  ).bind(claims.sub).first();
  if (!educator) return json({ error: "Educator account not found." }, 404);
  const lesson = await env.DB.prepare(
    "SELECT * FROM educator_lessons WHERE id = ? AND educator_id = ? AND school_id = ?"
  ).bind(lessonId, educator.id, educator.school_id).first();
  if (!lesson) return json({ error: "Lesson slot not found." }, 404);

  if (clearOnly) {
    if (lesson.media_key) await env.SESSION_MEDIA_BUCKET.delete(lesson.media_key);
    await env.DB.prepare(
      `UPDATE educator_lessons
       SET title = '', subject = '', description = '', media_key = NULL,
           media_name = NULL, media_type = NULL, media_size = 0, updated_at = datetime('now')
       WHERE id = ? AND educator_id = ? AND school_id = ?`
    ).bind(lessonId, educator.id, educator.school_id).run();
  } else {
    const form = await request.formData();
    const title = String(form.get("title") || "").trim();
    const subject = String(form.get("subject") || "").trim();
    const description = String(form.get("description") || "").trim();
    if (title.length > 200 || subject.length > 100 || description.length > 5000) {
      return json({ error: "Lesson text exceeds the allowed length." }, 400);
    }
    const file = form.get("file");
    let mediaKey = lesson.media_key;
    let mediaName = lesson.media_name;
    let mediaType = lesson.media_type;
    let mediaSize = Number(lesson.media_size || 0);
    if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
      if (file.size > 50 * 1024 * 1024) return json({ error: "Lesson files must be 50 MB or smaller." }, 413);
      const contentType = String(file.type || "").toLowerCase();
      if (!/^(application\/pdf|image\/(jpeg|png|webp)|video\/(mp4|webm|quicktime))$/.test(contentType)) {
        return json({ error: "Supported lesson files are PDF, JPG, PNG, WebP, MP4, WebM and MOV." }, 415);
      }
      const nextKey = `learning/${educator.school_id}/${educator.id}/${lessonId}/${randomId()}`;
      await env.SESSION_MEDIA_BUCKET.put(nextKey, await file.arrayBuffer(), {
        httpMetadata: { contentType },
      });
      if (lesson.media_key) await env.SESSION_MEDIA_BUCKET.delete(lesson.media_key);
      mediaKey = nextKey;
      mediaName = String(file.name || "lesson-file").slice(0, 255);
      mediaType = contentType;
      mediaSize = file.size;
    }
    await env.DB.prepare(
      `UPDATE educator_lessons
       SET title = ?, subject = ?, description = ?, media_key = ?, media_name = ?,
           media_type = ?, media_size = ?, updated_at = datetime('now')
       WHERE id = ? AND educator_id = ? AND school_id = ?`
    ).bind(title, subject, description, mediaKey, mediaName, mediaType, mediaSize,
      lessonId, educator.id, educator.school_id).run();
  }

  const saved = await env.DB.prepare("SELECT * FROM educator_lessons WHERE id = ?").bind(lessonId).first();
  return json({ saved: !clearOnly, deleted: clearOnly, lesson: publicEducatorLesson(saved) });
}

async function uploadMedia(request, env, objectKey) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const key = objectKey.replace(/^\/+/, "");
  if (!key || key.length > 300 || key.split("/").some((part) => !part || part === "." || part === "..")) {
    return json({ error: "Invalid media key." }, 400);
  }
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > 50 * 1024 * 1024) return json({ error: "Media files must be 50 MB or smaller." }, 413);
  const body = await request.arrayBuffer();
  if (body.byteLength > 50 * 1024 * 1024) return json({ error: "Media files must be 50 MB or smaller." }, 413);
  const contentType = request.headers.get("Content-Type") || "application/octet-stream";
  if (!/^(video\/(mp4|webm|ogg)|audio\/(mpeg|ogg|webm)|image\/(jpeg|png|webp))$/i.test(contentType)) {
    return json({ error: "Only common video, audio, and image media types are accepted." }, 415);
  }
  await env.SESSION_MEDIA_BUCKET.put(key, body, {
    httpMetadata: { contentType },
  });
  return json({ mediaKey: key }, 201);
}

async function readMedia(env, objectKey, schoolId) {
  const key = decodeURIComponent(objectKey);
  if (!key || key.split("/").some((part) => part === "." || part === "..") || !schoolId) return json({ error: "Invalid media key or school." }, 400);
  const ownership = await env.DB.prepare(
    `SELECT id FROM sessions WHERE media_key = ? AND school_id = ?
     UNION ALL
     SELECT id FROM educator_lessons WHERE media_key = ? AND school_id = ?
     LIMIT 1`
  ).bind(key, schoolId, key, schoolId).first();
  if (!ownership) return json({ error: "Media not found in this school." }, 404);
  const object = await env.SESSION_MEDIA_BUCKET.get(key);
  if (!object) return json({ error: "Media not found." }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=3600");
  return new Response(object.body, { headers });
}
async function createClassroomAttachmentUrl(
  request,
  env,
  attachmentKey
) {
  if (!attachmentKey) return null;

  const token = await signToken(
    {
      purpose: "classroom_attachment",
      key: attachmentKey,
      exp: Math.floor(Date.now() / 1000) + 60 * 60
    },
    env.SESSION_SIGNING_KEY
  );

  return (
    `${new URL(request.url).origin}` +
    `/api/classroom/attachments/${attachmentKey}` +
    `?token=${encodeURIComponent(token)}`
  );
}

async function uploadClassroomAttachment(request, env) {
  const formData = await request.formData();

  const sessionId = String(
    formData.get("sessionId") || ""
  ).trim();

  const studentId = String(
    formData.get("studentId") || ""
  ).trim();

  const file = formData.get("file");

  if (
    !file ||
    typeof file.arrayBuffer !== "function"
  ) {
    return json({
      error: "Choose an image, video or PDF to upload."
    }, 400);
  }

  if (file.size > 25 * 1024 * 1024) {
    return json({
      error: "Chat attachments must be 25 MB or smaller."
    }, 413);
  }

  const contentType = String(file.type || "").toLowerCase();

  const allowedType =
    /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime)|application\/pdf)$/;

  if (!allowedType.test(contentType)) {
    return json({
      error: "Supported attachments are JPG, PNG, WebP, GIF, MP4, WebM, MOV and PDF."
    }, 415);
  }

  const access = await classroomChatAccess(
    request,
    env,
    sessionId,
    studentId
  );

  if (access.error) return access.error;

  const attachmentKey = randomId();

  const attachmentName = String(
    file.name || "attachment"
  )
    .replace(/[\\/\r\n"]/g, "_")
    .slice(0, 180) || "attachment";

  await env.SESSION_MEDIA_BUCKET.put(
    `classroom-chat/${attachmentKey}`,
    await file.arrayBuffer(),
    {
      httpMetadata: {
        contentType
      },
      customMetadata: {
        sessionId,
        studentId: access.studentId,
        uploadedBy: access.account.id,
        attachmentName
      }
    }
  );

  return json({
    attachmentKey,
    attachmentName,
    attachmentType: contentType
  }, 201);
}

async function readClassroomAttachment(
  request,
  env,
  attachmentKey
) {
  if (!/^[0-9a-f-]{36}$/i.test(attachmentKey)) {
    return json({ error: "Invalid attachment." }, 400);
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";

  const grant = await verifyToken(
    token,
    env.SESSION_SIGNING_KEY
  );

  if (
    !grant ||
    grant.purpose !== "classroom_attachment" ||
    grant.key !== attachmentKey
  ) {
    return json({
      error: "This attachment link is invalid or expired."
    }, 403);
  }

  const object = await env.SESSION_MEDIA_BUCKET.get(
    `classroom-chat/${attachmentKey}`
  );

  if (!object) {
    return json({ error: "Attachment not found." }, 404);
  }

  const headers = new Headers();

  object.writeHttpMetadata(headers);

  headers.set(
    "cache-control",
    "private, max-age=300"
  );

  headers.set(
    "x-content-type-options",
    "nosniff"
  );

  headers.set(
    "content-disposition",
    "inline"
  );

  return new Response(object.body, {
    headers
  });
}
async function ensureClassroomChatSchema(env) {
  // Check whether the classroom assignment column exists.
  const accountColumns = await env.DB.prepare(
    "PRAGMA table_info(accounts)"
  ).all();

  const hasRegisteredSessionId =
    (accountColumns.results || []).some(
      (column) => column.name === "registered_session_id"
    );

  // Repair the column if its migration was not applied.
  if (!hasRegisteredSessionId) {
    try {
      await env.DB.prepare(
        `ALTER TABLE accounts
         ADD COLUMN registered_session_id TEXT
         REFERENCES sessions(id) ON DELETE SET NULL`
      ).run();
    } catch (error) {
      // Another simultaneous request may have added it.
      const updatedColumns = await env.DB.prepare(
        "PRAGMA table_info(accounts)"
      ).all();

      const columnNowExists =
        (updatedColumns.results || []).some(
          (column) => column.name === "registered_session_id"
        );

      if (!columnNowExists) {
        throw error;
      }
    }
  }

  // Ensure the private-chat table and its lookup index exist.
  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS classroom_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        educator_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        message TEXT NOT NULL
          CHECK (length(message) BETWEEN 1 AND 2000),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    ),

    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS classroom_messages_pair_idx
       ON classroom_messages (
         session_id,
         educator_id,
         student_id,
         id
       )`
    )
  ]);
}
async function classroomChatAccess(request, env, sessionId, studentId) {
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(sessionId || "")) {
    return {
      error: json(
        { error: "A valid classroom is required." },
        400
      )
    };
  }

  await ensureClassroomChatSchema(env);

  const access = await registeredLiveSession(
    request,
    env,
    sessionId
  );

  if (access.error) return { error: access.error };

  const account = access.account;

  if (!["educator", "student"].includes(account.role)) {
    return { error: json({ error: "Classroom access denied." }, 403) };
  }

  const student = await env.DB.prepare(
    `SELECT id, role, registered_session_id, grade_id
     FROM accounts
     WHERE id = ?
       AND role = 'student'
       AND registered_session_id = ?
       AND grade_id = ?`
  ).bind(
    studentId,
    sessionId,
    access.session.grade_id
  ).first();

  if (!student) {
    return {
      error: json({ error: "This student is not assigned to this classroom." }, 403)
    };
  }

  let educatorId;

  if (account.role === "educator") {
    educatorId = account.id;
  } else {
    if (account.id !== student.id) {
      return {
        error: json({ error: "Students can only access their own private chat." }, 403)
      };
    }

    const educator = await env.DB.prepare(
      `SELECT id
       FROM accounts
       WHERE role = 'educator'
         AND registered_session_id = ?
       LIMIT 1`
    ).bind(sessionId).first();

    if (!educator) {
      return {
        error: json({ error: "The assigned educator was not found." }, 404)
      };
    }

    educatorId = educator.id;
  }

  return {
    account,
    session: access.session,
    educatorId,
    studentId: student.id
  };
}

async function getClassroomMessages(request, env) {
  const url = new URL(request.url);

  const sessionId =
    url.searchParams.get("sessionId") || "";

  const studentId =
    url.searchParams.get("studentId") || "";

  const access = await classroomChatAccess(
    request,
    env,
    sessionId,
    studentId
  );

  if (access.error) return access.error;

  const result = await env.DB.prepare(
    `SELECT
       id,
       sender_id AS senderId,
       message,
       created_at AS createdAt,
       attachment_key AS attachmentKey,
       attachment_name AS attachmentName,
       attachment_type AS attachmentType
     FROM classroom_messages
     WHERE session_id = ?
       AND educator_id = ?
       AND student_id = ?
     ORDER BY id DESC
     LIMIT 100`
  ).bind(
    sessionId,
    access.educatorId,
    access.studentId
  ).all();

  const messages = await Promise.all(
    (result.results || [])
      .reverse()
      .map(async (row) => ({
        id: row.id,
        senderId: row.senderId,
        message: row.message,
        createdAt: row.createdAt,
        attachmentName: row.attachmentName || null,
        attachmentType: row.attachmentType || null,
        attachmentUrl: row.attachmentKey
          ? await createClassroomAttachmentUrl(
              request,
              env,
              row.attachmentKey
            )
          : null
      }))
  );

  return json({ messages });
}

async function sendClassroomMessage(request, env) {
  const claims = await authenticate(request, env, null);

  if (
    !claims ||
    !["educator", "student"].includes(claims.role)
  ) {
    return json({
      error: "Classroom authentication required."
    }, 401);
  }

  const body = await requestJson(request);

  const sessionId =
    typeof body?.sessionId === "string"
      ? body.sessionId.trim()
      : "";

  const studentId =
    typeof body?.studentId === "string"
      ? body.studentId.trim()
      : "";

  const message =
    typeof body?.message === "string"
      ? body.message.trim()
      : "";

  const attachmentKey =
    typeof body?.attachmentKey === "string"
      ? body.attachmentKey.trim()
      : "";

  if (
    (!message && !attachmentKey) ||
    message.length > 2000
  ) {
    return json({
      error: "Write a message or attach a file. Messages cannot exceed 2,000 characters."
    }, 400);
  }

  const access = await classroomChatAccess(
    request,
    env,
    sessionId,
    studentId
  );

  if (access.error) return access.error;

  let attachmentName = null;
  let attachmentType = null;

  if (attachmentKey) {
    if (!/^[0-9a-f-]{36}$/i.test(attachmentKey)) {
      return json({
        error: "Invalid attachment reference."
      }, 400);
    }

    const object = await env.SESSION_MEDIA_BUCKET.head(
      `classroom-chat/${attachmentKey}`
    );

    if (!object) {
      return json({
        error: "The uploaded attachment could not be found."
      }, 404);
    }

    const metadata = object.customMetadata || {};

    if (
      metadata.sessionId !== sessionId ||
      metadata.studentId !== access.studentId ||
      metadata.uploadedBy !== access.account.id
    ) {
      return json({
        error: "You do not have permission to attach this file."
      }, 403);
    }

    attachmentName =
      metadata.attachmentName || "Attachment";

    attachmentType =
      object.httpMetadata?.contentType || "";

    const allowedType =
      /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime)|application\/pdf)$/;

    if (!allowedType.test(attachmentType)) {
      return json({
        error: "This attachment type is not supported."
      }, 415);
    }
  }

  // The existing message column is NOT NULL.
  // Store a placeholder for a message containing only a file.
  const storedMessage =
    message || "[Attachment]";

  const insertResult = await env.DB.prepare(
    `INSERT INTO classroom_messages (
       session_id,
       educator_id,
       student_id,
       sender_id,
       message,
       attachment_key,
       attachment_name,
       attachment_type
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    access.educatorId,
    access.studentId,
    access.account.id,
    storedMessage,
    attachmentKey || null,
    attachmentName,
    attachmentType
  ).run();

  const messageId = Number(
    insertResult.meta?.last_row_id
  );

  if (
    !Number.isSafeInteger(messageId) ||
    messageId < 1
  ) {
    throw new Error(
      "The database did not return the inserted message ID."
    );
  }

  const savedMessage = await env.DB.prepare(
    `SELECT
       id,
       sender_id AS senderId,
       message,
       created_at AS createdAt,
       attachment_key AS attachmentKey,
       attachment_name AS attachmentName,
       attachment_type AS attachmentType
     FROM classroom_messages
     WHERE id = ?
       AND session_id = ?
       AND educator_id = ?
       AND student_id = ?
     LIMIT 1`
  ).bind(
    messageId,
    sessionId,
    access.educatorId,
    access.studentId
  ).first();

  if (!savedMessage) {
    throw new Error(
      "The saved message could not be retrieved."
    );
  }

  return json({
    sent: true,
    message: {
      id: savedMessage.id,
      senderId: savedMessage.senderId,
      message: savedMessage.message,
      createdAt: savedMessage.createdAt,
      attachmentName: savedMessage.attachmentName,
      attachmentType: savedMessage.attachmentType,
      attachmentUrl: savedMessage.attachmentKey
        ? await createClassroomAttachmentUrl(
            request,
            env,
            savedMessage.attachmentKey
          )
        : null
    }
  }, 201);
}
async function clearClassroomMessages(request, env) {
  const claims = await authenticate(request, env, null);

  if (
    !claims ||
    !["educator", "student"].includes(claims.role)
  ) {
    return json({
      error: "Classroom authentication required."
    }, 401);
  }

  const body = await requestJson(request);

  const sessionId =
    typeof body?.sessionId === "string"
      ? body.sessionId.trim()
      : "";

  const studentId =
    typeof body?.studentId === "string"
      ? body.studentId.trim()
      : "";

  const access = await classroomChatAccess(
    request,
    env,
    sessionId,
    studentId
  );

  if (access.error) return access.error;

  const attachments = await env.DB.prepare(
    `SELECT attachment_key AS attachmentKey
     FROM classroom_messages
     WHERE session_id = ?
       AND educator_id = ?
       AND student_id = ?
       AND attachment_key IS NOT NULL`
  ).bind(
    sessionId,
    access.educatorId,
    access.studentId
  ).all();

  await Promise.allSettled(
    (attachments.results || []).map((row) =>
      env.SESSION_MEDIA_BUCKET.delete(
        `classroom-chat/${row.attachmentKey}`
      )
    )
  );

  await env.DB.prepare(
    `DELETE FROM classroom_messages
     WHERE session_id = ?
       AND educator_id = ?
       AND student_id = ?`
  ).bind(
    sessionId,
    access.educatorId,
    access.studentId
  ).run();

  return json({
    cleared: true
  });
}
function normalizeWorkersAIMessages(contents) {
  let conversation;
  if (typeof contents === "string") {
    const text = contents.trim();
    conversation = text ? [{ role: "user", parts: [{ text }] }] : [];
  } else if (
    Array.isArray(contents) &&
    contents.length > 0 &&
    contents.every((item) => item && typeof item === "object" && Array.isArray(item.parts))
  ) {
    conversation = contents;
  } else if (Array.isArray(contents) && contents.length > 0) {
    const parts = [];
    for (const item of contents) {
      if (typeof item === "string") {
        if (item.trim()) parts.push({ text: item });
        continue;
      }
      if (!item || typeof item !== "object") return null;
      if (typeof item.text === "string") {
        parts.push({ text: item.text });
        continue;
      }
      if (item.inlineData && typeof item.inlineData === "object") {
        parts.push({ inlineData: item.inlineData });
        continue;
      }
      if (item.inline_data && typeof item.inline_data === "object") {
        const data = item.inline_data;
        parts.push({ inlineData: { mimeType: data.mimeType || data.mime_type, data: data.data } });
        continue;
      }
      return null;
    }
    conversation = parts.length ? [{ role: "user", parts }] : [];
  } else {
    return null;
  }

  const messages = [];
  for (const item of conversation) {
    const role = item.role === "model"
      ? "assistant"
      : ["user", "assistant", "system"].includes(item.role)
        ? item.role
        : "user";
    const content = [];
    for (const part of item.parts || []) {
      if (typeof part?.text === "string" && part.text.length > 0) {
        content.push({ type: "text", text: part.text });
      } else if (part?.inlineData && typeof part.inlineData === "object") {
        const mimeType = part.inlineData.mimeType || part.inlineData.mime_type || "image/jpeg";
        const data = part.inlineData.data;
        if (!/^image\/(jpeg|png|webp|gif)$/i.test(mimeType) || typeof data !== "string" || !data) {
          return null;
        }
        content.push({
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${data}` },
        });
      }
    }
    if (content.length === 0) continue;
    messages.push({
      role,
      content: content.length === 1 && content[0].type === "text" ? content[0].text : content,
    });
  }
  return messages.length ? messages : null;
}

async function generateWorkersAIResponse(request, env) {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!env.AI || typeof env.AI.run !== "function") {
    return json({ error: "Cloudflare Workers AI is not enabled for this Worker. Add the AI binding in Wrangler configuration." }, 503);
  }

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > 1_500_000) return json({ error: "AI request is too large." }, 413);

  let payload;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 1_500_000) return json({ error: "AI request is too large." }, 413);
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid AI request body." }, 400);
  }

  const messages = normalizeWorkersAIMessages(payload?.contents);
  if (!messages) {
    return json({ error: "AI contents are required in a supported text or image format." }, 400);
  }

  const requestedMaxOutputTokens = Number(payload?.maxOutputTokens ?? payload?.generationConfig?.maxOutputTokens);
  const maxTokens = Number.isFinite(requestedMaxOutputTokens)
    ? Math.min(2048, Math.max(32, Math.floor(requestedMaxOutputTokens)))
    : 1024;
  const model = "@cf/qwen/qwen3.8-27b";

  let result;
  try {
    result = await env.AI.run(model, {
      messages,
      max_tokens: maxTokens,
      reasoning_effort: "low",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Cloudflare Workers AI inference failed.", {
      model,
      message: detail.slice(0, 240),
    });
    return json({
      error: `Cloudflare Workers AI request failed: ${detail.slice(0, 240) || "unknown inference error"}`,
    }, 503);
  }

  const generatedText =
    result?.choices?.[0]?.message?.content ??
    result?.response ??
    "";
  const text = typeof generatedText === "string" ? generatedText.trim() : "";
  if (!text) {
    console.error("Cloudflare Workers AI returned no text.", { model });
    return json({ error: "Cloudflare Workers AI returned an empty response." }, 502);
  }
  return json({ text });
}

async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
    if (
    request.method === "GET" &&
    path === "/api/classroom/messages"
  ) {
    return getClassroomMessages(request, env);
  }

  if (
    request.method === "POST" &&
    path === "/api/classroom/messages"
  ) {
    return sendClassroomMessage(request, env);
  }

  if (
    request.method === "POST" &&
    path === "/api/classroom/attachments"
  ) {
    return uploadClassroomAttachment(request, env);
  }

  if (
    request.method === "POST" &&
    path === "/api/classroom/messages/clear"
  ) {
    return clearClassroomMessages(request, env);
  }

  const classroomAttachmentMatch = path.match(
    /^\/api\/classroom\/attachments\/([0-9a-f-]{36})$/i
  );

  if (
    request.method === "GET" &&
    classroomAttachmentMatch
  ) {
    return readClassroomAttachment(
      request,
      env,
      classroomAttachmentMatch[1]
    );
  }
  if (request.method === "POST" && path === "/api/ai/generate") return generateWorkersAIResponse(request, env);
  if (request.method === "GET" && path === "/api/health") return json({ status: "ok" });
  if (request.method === "POST" && path === "/api/auth/register") return handleRegister(request, env);
  if (request.method === "POST" && path === "/api/auth/login") return handleLogin(request, env);
  if (request.method === "GET" && path === "/api/auth/me") return getCurrentAccount(request, env);
  if (request.method === "GET" && path === "/api/owner/directors") return ownerDirectors(request, env);
  if (request.method === "GET" && path === "/api/school-payment") return publicSchoolPayment(url, env);
    const ownerDirectorMatch = path.match(new RegExp("^/api/owner/directors/([a-zA-Z0-9_-]{1,100})$", "i"));
  if (request.method === "PATCH" && ownerDirectorMatch) return updateOwnerDirector(request, env, ownerDirectorMatch[1]);
    const schoolEducatorsMatch = path.match(/^\/api\/schools\/([^/]+)\/educators$/);
  if (request.method === "GET" && schoolEducatorsMatch) {
    return schoolEducators(env, decodeURIComponent(schoolEducatorsMatch[1]));
  }
  const lessonReadMatch = path.match(/^\/api\/learning\/educators\/([^/]+)\/lessons$/);
  if (request.method === "GET" && lessonReadMatch) {
    const requestedSchoolId = url.searchParams.get("schoolId") || "";
    return educatorLessons(env, requestedSchoolId, decodeURIComponent(lessonReadMatch[1]));
  }
  const lessonWriteMatch = path.match(/^\/api\/learning\/lessons\/([a-zA-Z0-9_-]{1,100})$/);
  if (lessonWriteMatch && request.method === "PUT") return updateEducatorLesson(request, env, lessonWriteMatch[1]);
  if (lessonWriteMatch && request.method === "DELETE") return updateEducatorLesson(request, env, lessonWriteMatch[1], true);
  if (request.method === "GET" && path === "/api/schools") {
    const requestedSchoolId = url.searchParams.get("schoolId") || "default-agenda-school";
    const school = await env.DB.prepare("SELECT id, name FROM schools WHERE id = ?").bind(requestedSchoolId).first();
    if (!school) return json({ error: "School not found." }, 404);
    return json({ schools: [school], activeSchoolId: school.id });
  }
  if (request.method === "GET" && path === "/api/school-context") {
    return schoolPublicContext(env, url.searchParams.get("schoolId") || "");
  }
  const schoolId = url.searchParams.get("schoolId") || "";
  if (request.method === "GET" && path === "/api/registration/sessions") return schoolId ? registrationSessions(env, schoolId) : json({ error: "schoolId is required." }, 400);
  if (request.method === "GET" && path === "/api/registration/grades") return schoolId ? registrationGrades(env, schoolId) : json({ error: "schoolId is required." }, 400);
  if (request.method === "GET" && path === "/api/registration/educators") return schoolId ? registrationEducators(env, schoolId) : json({ error: "schoolId is required." }, 400);
  if (request.method === "GET" && path === "/api/live-educators") return schoolId ? liveEducators(request, env, schoolId) : json({ error: "schoolId is required." }, 400);
   if (
    request.method === "POST" &&
    path === "/api/guest/live-stream"
  ) {
    return createGuestLiveStream(request, env);
  }
  if (request.method === "GET" && path === "/api/director/profile") return directorProfile(request, env);
  if (request.method === "PATCH" && path === "/api/director/profile") return updateDirectorProfile(request, env);
  if (request.method === "GET" && path === "/api/director/pricing") return getDirectorGradePricing(request, env);
  if (request.method === "PUT" && path === "/api/director/pricing") return updateDirectorGradePricing(request, env);
  if (request.method === "GET" && path === "/api/director/live-stream") return getDirectorLiveStream(request, env);
  if (request.method === "GET" && path === "/api/director/accounts") return directorAccounts(request, env);
  if (request.method === "GET" && path === "/api/director/sessions") return directorSessions(request, env);
  if (request.method === "POST" && path === "/api/director/sessions") return createSessions(request, env);
  if (request.method === "PATCH" && path === "/api/educator/live-session") return setEducatorLiveSession(request, env);
  if (request.method === "POST" && path === "/api/director/live-stream") return ensureLiveStream(request, env);
  if (request.method === "GET" && path === "/api/live-stream") return getLiveStream(request, env);
  if (request.method === "GET" && path === "/api/sessions") return listSessions(url, env, request);

  const accountMatch = path.match(/^\/api\/director\/accounts\/([0-9a-f-]{36})$/i);
  if (request.method === "PATCH" && accountMatch) return updateAccount(request, env, accountMatch[1]);
  if (request.method === "DELETE" && accountMatch) return deleteAccount(request, env, accountMatch[1]);

  const sessionMatch = path.match(/^\/api\/director\/sessions\/([a-zA-Z0-9_-]{1,100})$/);
  if (request.method === "DELETE" && sessionMatch) return deleteSession(request, env, sessionMatch[1]);
  if (request.method === "PATCH" && sessionMatch) return updateDirectorSessionLive(request, env, sessionMatch[1]);

  const uploadMatch = path.match(/^\/api\/director\/media\/(.+)$/);
  if (request.method === "PUT" && uploadMatch) return uploadMedia(request, env, uploadMatch[1]);

  const mediaMatch = path.match(/^\/api\/media\/(.+)$/);
  if (request.method === "GET" && mediaMatch) return readMedia(env, mediaMatch[1], url.searchParams.get("schoolId") || "");

  return json({ error: "Not found." }, 404);
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (request.headers.has("Origin") && !origin) return json({ error: "Origin is not allowed." }, 403);
    const headers = corsHeaders(origin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    try {
      const response = await handle(request, env);
      const responseHeaders = new Headers(response.headers);
      for (const [key, value] of Object.entries(headers)) responseHeaders.set(key, value);
      return new Response(response.body, { status: response.status, headers: responseHeaders });
        } catch (error) {
      const path =
        new URL(request.url).pathname.replace(/\/+$/, "") || "/";

      const isClassroomChat =
        path === "/api/classroom/messages";

      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      const cause =
        error && typeof error === "object"
          ? error.cause
          : null;

      const causeMessage =
        cause instanceof Error
          ? cause.message
          : cause
            ? String(cause)
            : "";

      const detail = causeMessage || errorMessage;

      console.error("Agenda API request failed", {
        method: request.method,
        path,
        message: errorMessage,
        cause: causeMessage || null,
        stack:
          error instanceof Error
            ? error.stack
            : null
      });

      return json(
        {
          error: isClassroomChat
            ? `Private chat failed: ${detail}`
            : "The service could not complete the request."
        },
        500,
        headers
      );
    }
  },
};
