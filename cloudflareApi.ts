export interface CloudflareAccount {
  id: string;
  username: string;
  role: 'student' | 'educator' | 'director';
  fullName: string;
  email: string;
  phone: string;
  schoolOrSubject: string;
  gradeId: string;
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
  status: 'unconfigured' | 'waiting';
  playbackUrl: string | null;
}

export interface LiveStreamSetup {
  inputUid: string;
  rtmpsUrl: string;
  streamKey: string;
  playbackUrl: string | null;
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
    throw new Error(typeof body?.error === 'string' ? body.error : `Cloudflare API request failed (${response.status}).`);
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

export function loginAccount(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
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
  update: { activated?: boolean; paid?: boolean; renew?: boolean; password?: string },
): Promise<{ account: CloudflareAccount }> {
  return request(`/api/director/accounts/${encodeURIComponent(accountId)}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(update),
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

export function getLiveStreamStatus(): Promise<LiveStreamStatus> {
  return request('/api/live-stream');
}

export function setupLiveStream(token: string): Promise<LiveStreamSetup> {
  return request('/api/director/live-stream', {
    method: 'POST',
    headers: authHeaders(token),
  });
}

export function getGradeSessions(gradeId: string, live = false): Promise<{ sessions: StoredSessionRecord[] }> {
  const query = new URLSearchParams({ gradeId, ...(live ? { live: 'true' } : {}) });
  return request<{ sessions: StoredSessionRecord[] }>(`/api/sessions?${query.toString()}`).then(({ sessions }) => ({
    sessions: sessions.map((session) => ({
      ...session,
      mediaUrl: session.mediaUrl && API_BASE_URL
        ? `${API_BASE_URL}${session.mediaUrl}`
        : session.mediaUrl,
    })),
  }));
}
