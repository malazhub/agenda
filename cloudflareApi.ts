export interface CloudflareAccount {
  id: string;
  username: string;
  role: 'student' | 'educator' | 'director';
  fullName: string;
  email: string;
  phone: string;
  schoolOrSubject: string;
  gradeId: string;
  registeredSessionId: string | null;
  createdAt: string;
  expiresAt: string | null;
  activated: boolean;
  paid: boolean;
}

export interface AuthResponse {
  account: CloudflareAccount;
  token: string;
}

export interface RegistrationInput {
  username: string;
  password: string;
  role: 'student' | 'educator';
  fullName: string;
  email: string;
  phone: string;
  schoolOrSubject: string;
  gradeId: string;
  registeredSessionId?: string;
}

export interface RegistrationEducator {
  id: string;
  name: string;
  subject: string;
  gradeId: string;
  registeredSessionId: string | null;
  hasAssignedClassroom: boolean;
}

export interface LiveEducatorSession {
  sessionId: string;
  educatorId: string;
  educatorName: string;
  gradeId: string;
  subject: string;
  liveStartsAt: string | null;
  isLive: boolean;
}

export interface RegistrationSession {
  id: string;
  gradeId: string;
  subject: string;
  title: string;
}

export interface StoredSessionRecord {
  id: string;
  gradeId: string;
  subject: string;
  title: string;
  teacherName: string;
  sourceName: string;
  sourceUrl: string;
  playbackUrl: string;
  isLive: boolean;
  liveStartsAt: string | null;
  mediaUrl: string | null;
  assignedStudents?: string[];
}

export interface SessionInput {
  gradeId: string;
  subject: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  playbackUrl?: string;
  teacherName?: string;
  isLive?: boolean;
}

export interface LiveStreamStatus {
  status: 'waiting';
  apiKey: string;
  callId: string;
  token: string;
  userId: string;
  userName: string;
}

export interface LiveStreamSetup {
  apiKey: string;
  callId: string;
  token: string;
  userId: string;
  userName: string;
}

const API_BASE_URL = (import.meta.env.VITE_CLOUDFLARE_API_URL || '').replace(/\/+$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('Cloudflare API URL is not configured. Set VITE_CLOUDFLARE_API_URL before using account or session features.');
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof body?.error === 'string' ? body.error : 'Cloudflare API request failed';
    throw new Error(`${message} (${response.status})`);
  }
  return body as T;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export function registerAccount(input: RegistrationInput): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getRegistrationSessions(): Promise<{ sessions: RegistrationSession[] }> {
  return request('/api/registration/sessions');
}

export function getRegistrationGrades(): Promise<{ grades: string[] }> {
  return request('/api/registration/grades');
}
export function getRegistrationEducators(): Promise<{
  educators: RegistrationEducator[];
}> {
  return request('/api/registration/educators');
}

export function getLiveEducators(token: string): Promise<{
  educators: LiveEducatorSession[];
}> {
  return request('/api/live-educators', {
    headers: authHeaders(token),
  });
}

export function loginAccount(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function getCurrentAccount(token: string): Promise<{ account: CloudflareAccount }> {
  return request('/api/auth/me', { headers: authHeaders(token) });
}

export function getDirectorAccounts(token: string): Promise<{
  students: CloudflareAccount[];
  educators: CloudflareAccount[];
}> {
  return request('/api/director/accounts', { headers: authHeaders(token) });
}

export function updateDirectorAccount(
  token: string,
  accountId: string,
  update: { activated?: boolean; paid?: boolean; renew?: boolean; password?: string; registeredSessionId?: string },
): Promise<{ account: CloudflareAccount }> {
  return request(`/api/director/accounts/${encodeURIComponent(accountId)}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(update),
  });
}

export function deleteDirectorAccount(token: string, accountId: string): Promise<{ deleted: boolean }> {
  return request(`/api/director/accounts/${encodeURIComponent(accountId)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export function getDirectorSessions(token: string): Promise<{ sessions: StoredSessionRecord[] }> {
  return request('/api/director/sessions', { headers: authHeaders(token) });
}

export function createDirectorSession(token: string, session: SessionInput): Promise<{ saved: number }> {
  return request('/api/director/sessions', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ sessions: [session] }),
  });
}

export function deleteDirectorSession(token: string, sessionId: string): Promise<{ deleted: boolean }> {
  return request(`/api/director/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export function getLiveStreamStatus(
  token: string,
  sessionId: string,
): Promise<LiveStreamStatus> {
  if (!token || !sessionId) {
    return Promise.reject(
      new Error('A valid login and assigned classroom are required.')
    );
  }

  return request<LiveStreamStatus>(
    `/api/live-stream?sessionId=${encodeURIComponent(sessionId)}`,
    {
      headers: authHeaders(token),
    }
  );
}

export function setupLiveStream(token: string): Promise<LiveStreamSetup> {
  return request('/api/director/live-stream', {
    method: 'POST',
    headers: authHeaders(token),
  });
}
export function setEducatorLiveSession(
  token: string,
  isLive: boolean,
): Promise<{
  updated: boolean;
  sessionId: string;
  isLive: boolean;
}> {
  return request('/api/educator/live-session', {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ isLive }),
  });
}

export function getGradeSessions(
  gradeId: string,
  live = false,
  token?: string,
  sessionId?: string,
): Promise<{ sessions: StoredSessionRecord[] }> {
  const query = new URLSearchParams({
    gradeId,
    ...(live ? { live: 'true', ...(sessionId ? { sessionId } : {}) } : {}),
  });
  return request<{ sessions: StoredSessionRecord[] }>(`/api/sessions?${query.toString()}`, {
    ...(live && token ? { headers: authHeaders(token) } : {}),
  }).then(({ sessions }) => ({
    sessions: sessions.map((session) => ({
      ...session,
      mediaUrl: session.mediaUrl && API_BASE_URL
        ? `${API_BASE_URL}${session.mediaUrl}`
        : session.mediaUrl,
    })),
  }));
}
