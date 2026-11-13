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
        "access-control-allow-methods": "GET, POST, PATCH, PUT, OPTIONS",
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

async function signStreamCallToken(env, userId, sessionId, role) {
  const apiKey = env.STREAM_VIDEO_API_KEY;
  const secret = env.STREAM_VIDEO_API_SECRET;

  if (!apiKey || !secret || !sessionId) return null;

  const now = Math.floor(Date.now() / 1000);
  const callId = sessionId;

  const header = base64UrlEncode(
    encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  );

  const payload = base64UrlEncode(
    encoder.encode(
      JSON.stringify({
        user_id: userId,
        call_cids: [`livestream:${callId}`],
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
    { name: "HMAC", hash: "SHA-256" },
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
    token: `${data}.${base64UrlEncode(new Uint8Array(signature))}`,
    userId,
  };
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

async function handleRegister(request, env) {
  const body = await requestJson(request);
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = body?.role;
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const schoolOrSubject = typeof body?.schoolOrSubject === "string" ? body.schoolOrSubject.trim() : "";
  const requestedGradeId = typeof body?.gradeId === "string" ? body.gradeId.trim() : "";
  const registeredSessionId = typeof body?.registeredSessionId === "string" ? body.registeredSessionId.trim() : "";

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
         WHERE s.id = ?`
      ).bind(registeredSessionId).first()
    : null;

  if (role === "student" && !selectedSession) {
    return json({
      error: "The selected educator does not have an assigned classroom."
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
        "SELECT grade_id FROM sessions WHERE grade_id = ? LIMIT 1"
      ).bind(gradeId).first()
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
      "INSERT INTO accounts (id, username, password_hash, role, full_name, email, phone, school_or_subject, grade_id, registered_session_id, expires_at, activated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+1 month'), 0)",
    ).bind(id, username, passwordHash, role, fullName, email, phone, schoolOrSubject, gradeId, registeredSessionId || null).run();
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

  const account = await env.DB.prepare("SELECT * FROM accounts WHERE id = ?").bind(id).first();
  const token = await signToken(
    { sub: id, role, username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS },
    env.SESSION_SIGNING_KEY,
  );
  return json({ account: publicAccount(account), token }, 201);
}

async function existingRegistrationResponse(account, registration, env, selectedSession) {
  const matches = await verifyPassword(registration.password, account.password_hash);
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
      "UPDATE accounts SET role = ?, full_name = ?, email = ?, phone = ?, school_or_subject = ?, grade_id = ?, registered_session_id = ? WHERE id = ?",
    ).bind(
      registration.role,
      registration.fullName,
      registration.email,
      registration.phone,
      registration.schoolOrSubject,
      registration.gradeId,
      registeredSessionId,
      account.id,
    ).run();
    account.role = registration.role;
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

async function registrationSessions(env) {
  const result = await env.DB.prepare(
    "SELECT id, grade_id, subject, title FROM sessions ORDER BY grade_id, subject, title LIMIT 1000",
  ).all();
  return json({
    sessions: (result.results || []).map((session) => ({
      id: session.id,
      gradeId: session.grade_id,
      subject: session.subject,
      title: session.title,
    })),
  });
}

async function registrationGrades(env) {
  const result = await env.DB.prepare(
    "SELECT DISTINCT grade_id FROM sessions WHERE grade_id != '' ORDER BY grade_id",
  ).all();
  return json({ grades: (result.results || []).map((row) => row.grade_id) });
}
async function registrationEducators(env) {
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
     WHERE a.role = 'educator'
     ORDER BY a.full_name COLLATE NOCASE`
  ).all();

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

async function liveEducators(request, env) {
  const claims = await authenticate(request, env, null);

  if (!claims || !["student", "educator"].includes(claims.role)) {
    return json({
      error: "Please sign in with your student or educator account."
    }, 401);
  }

  const account = await env.DB.prepare(
    `SELECT id, role, activated, paid, expires_at
     FROM accounts
     WHERE id = ?`
  ).bind(claims.sub).first();

  if (!account || account.role !== claims.role) {
    return json({ error: "Account verification failed." }, 403);
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
     WHERE s.is_live = 1
     ORDER BY s.live_starts_at DESC, a.full_name COLLATE NOCASE`
  ).all();

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
  const expiryTime = account?.expires_at ? Date.parse(`${account.expires_at.replace(' ', 'T')}Z`) : null;
  const expired = expiryTime !== null && (!Number.isFinite(expiryTime) || expiryTime <= Date.now());
  if (!account || !valid || !account.activated || expired) {
    await env.DB.prepare("INSERT INTO login_attempts (username, succeeded) VALUES (?, 0)").bind(username).run();
    return json({ error: "Invalid username or password, or account is not activated or has expired." }, 401);
  }

  await env.DB.prepare("DELETE FROM login_attempts WHERE username = ? COLLATE NOCASE AND succeeded = 0").bind(username).run();
  const token = await signToken(
    { sub: account.id, role: account.role, username: account.username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS },
    env.SESSION_SIGNING_KEY,
  );
  return json({ account: publicAccount(account), token });
}

async function getCurrentAccount(request, env) {
  const claims = await authenticate(request, env, null);
  if (!claims || !["student", "educator"].includes(claims.role)) {
    return json({ error: "Student or educator authentication required." }, 401);
  }
  const account = await env.DB.prepare("SELECT * FROM accounts WHERE id = ?").bind(claims.sub).first();
  if (!account || account.role !== claims.role) return json({ error: "Account not found." }, 404);
  return json({ account: publicAccount(account) });
}

async function directorAccounts(request, env) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const [students, educators] = await Promise.all([
    env.DB.prepare("SELECT * FROM accounts WHERE role = 'student' ORDER BY created_at DESC").all(),
    env.DB.prepare("SELECT * FROM accounts WHERE role = 'educator' ORDER BY created_at DESC").all(),
  ]);
  return json({
    students: (students.results || []).map(publicAccount),
    educators: (educators.results || []).map(publicAccount),
  });
}

async function updateAccount(request, env, accountId) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const body = await requestJson(request);
  const updates = [];
  const values = [];
  if (typeof body?.activated === "boolean") {
    updates.push("activated = ?");
    values.push(Number(body.activated));
  }
  if (typeof body?.paid === "boolean") {
    updates.push("paid = ?");
    values.push(Number(body.paid));
  }
  if (typeof body?.registeredSessionId === "string") {
    const session = await env.DB.prepare("SELECT id, grade_id FROM sessions WHERE id = ?")
      .bind(body.registeredSessionId)
      .first();
    if (!session) return json({ error: "Choose a valid registered session." }, 400);
    updates.push("registered_session_id = ?", "grade_id = ?");
    values.push(session.id, session.grade_id);
  }
  if (typeof body?.password === "string") {
    if (!body.password || body.password.length > MAX_PASSWORD_LENGTH) {
      return json({ error: "A password must contain 1–1,024 characters." }, 400);
    }
    updates.push("password_hash = ?");
    values.push(await hashPassword(body.password));
  }
  if (body?.renew === true) {
    updates.push("expires_at = datetime('now', '+1 month')");
  }
  if (!updates.length) return json({ error: "Provide at least one supported account update." }, 400);
  values.push(accountId);
  const result = await env.DB.prepare(`UPDATE accounts SET ${updates.join(", ")} WHERE id = ? AND role IN ('student', 'educator')`)
    .bind(...values)
    .run();
  if (!result.meta.changes) return json({ error: "Account not found." }, 404);
  const account = await env.DB.prepare("SELECT * FROM accounts WHERE id = ?").bind(accountId).first();
  return json({ account: publicAccount(account) });
}

async function directorSessions(request, env) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const result = await env.DB.prepare(
    "SELECT * FROM sessions ORDER BY grade_id, subject, title LIMIT 1000",
  ).all();
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
    mediaUrl: session.media_key ? `/api/media/${encodeURIComponent(session.media_key)}` : null,
  };
}

async function deleteSession(request, env, sessionId) {
  const director = await authenticate(request, env, "director");
  if (!director) return json({ error: "Director authentication required." }, 401);
  const result = await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
  if (!result.meta.changes) return json({ error: "Session not found." }, 404);
  return json({ deleted: true });
}

async function listSessions(url, env, request) {
  const gradeId = url.searchParams.get("gradeId") || "";
  const liveOnly = url.searchParams.get("live") === "true";
  const sessionId = url.searchParams.get("sessionId") || "";

  if (!/^[a-z0-9_-]{1,40}$/.test(gradeId)) {
    return json({ error: "A valid gradeId is required." }, 400);
  }

  if (liveOnly) {
    const claims = await authenticate(request, env, null);

    if (!claims || !["student", "educator"].includes(claims.role)) {
      return json({ error: "Please sign in first." }, 401);
    }

    const account = await env.DB.prepare(
      `SELECT id, role, activated, paid, expires_at,
              grade_id, registered_session_id
       FROM accounts
       WHERE id = ?`
    ).bind(claims.sub).first();

    if (!account || claims.role !== account.role) {
      return json({ error: "Account verification failed." }, 403);
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
         AND grade_id = ?
         AND is_live = 1`
    ).bind(
      account.registered_session_id,
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
     WHERE grade_id = ? AND is_live = 0
     ORDER BY RANDOM()
     LIMIT 20`
  ).bind(gradeId).all();

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
    `SELECT id, role, full_name, activated, paid, expires_at,
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

  const session = await env.DB.prepare(
    "SELECT * FROM sessions WHERE id = ? AND is_live = 1"
  ).bind(sessionId).first();

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
    access.account.role === "educator" ? "host" : undefined
  );

  if (!stream) {
    return json({
      error: "Live video is not configured. Please ask the Director to configure Stream Video."
    }, 503);
  }

  return json({
    status: "waiting",
    ...stream,
    userName: access.account.full_name
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
    const playbackUrl = typeof session?.playbackUrl === "string" ? session.playbackUrl.trim() : sourceUrl;
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
        "INSERT OR REPLACE INTO sessions (id, grade_id, subject, title, teacher_name, source_name, source_url, playback_url, media_key, is_live, live_starts_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(
        typeof session.id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(session.id) ? session.id : randomId(),
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

async function readMedia(env, objectKey) {
  const key = decodeURIComponent(objectKey);
  if (!key || key.split("/").some((part) => part === "." || part === "..")) return json({ error: "Invalid media key." }, 400);
  const object = await env.SESSION_MEDIA_BUCKET.get(key);
  if (!object) return json({ error: "Media not found." }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=3600");
  return new Response(object.body, { headers });
}

async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (request.method === "GET" && path === "/api/health") return json({ status: "ok" });
  if (request.method === "POST" && path === "/api/auth/register") return handleRegister(request, env);
  if (request.method === "POST" && path === "/api/auth/login") return handleLogin(request, env);
  if (request.method === "GET" && path === "/api/auth/me") return getCurrentAccount(request, env);
    if (request.method === "GET" && path === "/api/registration/sessions") return registrationSessions(env);
  if (request.method === "GET" && path === "/api/registration/grades") return registrationGrades(env);
  if (request.method === "GET" && path === "/api/registration/educators") return registrationEducators(env);
  if (request.method === "GET" && path === "/api/live-educators") return liveEducators(request, env);
  if (request.method === "GET" && path === "/api/director/accounts") return directorAccounts(request, env);
  if (request.method === "GET" && path === "/api/director/sessions") return directorSessions(request, env);
  if (request.method === "POST" && path === "/api/director/sessions") return createSessions(request, env);
  if (request.method === "PATCH" && path === "/api/educator/live-session") return setEducatorLiveSession(request, env);
  if (request.method === "POST" && path === "/api/director/live-stream") return ensureLiveStream(request, env);
  if (request.method === "GET" && path === "/api/live-stream") return getLiveStream(request, env);
  if (request.method === "GET" && path === "/api/sessions") return listSessions(url, env, request);

  const accountMatch = path.match(/^\/api\/director\/accounts\/([0-9a-f-]{36})$/i);
  if (request.method === "PATCH" && accountMatch) return updateAccount(request, env, accountMatch[1]);

  const sessionMatch = path.match(/^\/api\/director\/sessions\/([a-zA-Z0-9_-]{1,100})$/);
  if (request.method === "DELETE" && sessionMatch) return deleteSession(request, env, sessionMatch[1]);

  const uploadMatch = path.match(/^\/api\/director\/media\/(.+)$/);
  if (request.method === "PUT" && uploadMatch) return uploadMedia(request, env, uploadMatch[1]);

  const mediaMatch = path.match(/^\/api\/media\/(.+)$/);
  if (request.method === "GET" && mediaMatch) return readMedia(env, mediaMatch[1]);

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
      console.error("Agenda API request failed", error);
      return json({ error: "The service could not complete the request." }, 500, headers);
    }
  },
};
