export interface CloudflareAccount {
  id: string;
  username: string;
  role: 'student' | 'educator' | 'director' | 'owner';
  schoolId: string;
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
  schoolId: string;
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
  teacherName: string;
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
  id?: string;
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
export interface ClassroomMessage {
  id: number;
  senderId: string;
  message: string;
  createdAt: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
}
export interface SchoolRecord {
  id: string;
  name: string;
}

export interface SchoolEducator {
  id: string;
  fullName: string;
  subject: string;
  gradeId: string;
  registeredSessionId: string | null;
}

export interface EducatorLesson {
  id: string;
  schoolId: string;
  educatorId: string;
  slot: number;
  title: string;
  subject: string;
  description: string;
  mediaUrl: string | null;
  mediaName: string | null;
  mediaType: string | null;
  mediaSize: number;
  updatedAt: string;
}

export interface DirectorProfile {
  schoolId: string;
  schoolName: string;
  username: string;
}

export interface SchoolGradePrice {
  gradeId: string;
  monthlyRateUsd: number;
}

export interface SchoolPublicContext {
  schoolId: string;
  schoolName: string;
  defaultMonthlyRateUsd: number;
  prices: SchoolGradePrice[];
  sessions: Array<{ gradeId: string; subject: string; sessionName: string; educatorName: string }>;
  educators: Array<{ id: string; name: string; subject: string; gradeId: string }>;
  guidance: {
    register: string;
    signIn: string;
    live: string;
    lessons: string;
  };
}
const API_BASE_URL = (
  import.meta.env.VITE_CLOUDFLARE_API_URL ||
  'https://agenda-api.malazhub-agenda.workers.dev'
).replace(/\/+$/, '');
function withAbsoluteLessonMedia(
  lesson: EducatorLesson
): EducatorLesson {
  return {
    ...lesson,
    mediaUrl: lesson.mediaUrl && API_BASE_URL
      ? `${API_BASE_URL}${lesson.mediaUrl}`
      : lesson.mediaUrl,
  };
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      'Cloudflare API URL is not configured. Set VITE_CLOUDFLARE_API_URL before using account or session features.'
    );
  }

  const isFormData =
    typeof FormData !== 'undefined' &&
    init?.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body && !isFormData
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...init?.headers,
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof body?.error === 'string'
        ? body.error
        : 'Cloudflare API request failed';

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

export function getSchools(schoolId = 'default-agenda-school'): Promise<{ schools: SchoolRecord[]; activeSchoolId?: string }> {
  const query = new URLSearchParams({ schoolId });
  return request(`/api/schools?${query.toString()}`);
}

export function getSchoolPublicContext(schoolId: string): Promise<SchoolPublicContext> {
  const query = new URLSearchParams({ schoolId });
  return request(`/api/school-context?${query.toString()}`, {
    signal: AbortSignal.timeout(5_000),
  });
}

export function getRegistrationSessions(
  schoolId: string
): Promise<{ sessions: RegistrationSession[] }> {
  const query = new URLSearchParams({ schoolId });
  return request(`/api/registration/sessions?${query.toString()}`);
}

export function getRegistrationGrades(
  schoolId: string
): Promise<{ grades: string[] }> {
  const query = new URLSearchParams({ schoolId });
  return request(`/api/registration/grades?${query.toString()}`);
}

export function getRegistrationEducators(
  schoolId: string
): Promise<{ educators: RegistrationEducator[] }> {
  const query = new URLSearchParams({ schoolId });
  return request(`/api/registration/educators?${query.toString()}`);
}

export function getSchoolEducators(
  schoolId: string
): Promise<{ educators: SchoolEducator[] }> {
  return request(
    `/api/schools/${encodeURIComponent(schoolId)}/educators`
  );
}

export function getLiveEducators(
  schoolId: string
): Promise<{ educators: LiveEducatorSession[] }> {
  const query = new URLSearchParams({ schoolId });
  return request(`/api/live-educators?${query.toString()}`);
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
export async function getEducatorLessons(
  schoolId: string,
  educatorId: string
): Promise<{ lessons: EducatorLesson[] }> {
  const query = new URLSearchParams({ schoolId });

  const result = await request<{ lessons: EducatorLesson[] }>(
    `/api/learning/educators/${encodeURIComponent(educatorId)}/lessons?${query.toString()}`
  );

  return {
    lessons: result.lessons.map(withAbsoluteLessonMedia),
  };
}

export async function saveEducatorLesson(
  token: string,
  lessonId: string,
  input: {
    title: string;
    subject: string;
    description: string;
    file: File | null;
  }
): Promise<{ saved: boolean; lesson: EducatorLesson }> {
  const formData = new FormData();

  formData.append('title', input.title);
  formData.append('subject', input.subject);
  formData.append('description', input.description);

  if (input.file) {
    formData.append('file', input.file, input.file.name);
  }

  const result = await request<{
    saved: boolean;
    lesson: EducatorLesson;
  }>(
    `/api/learning/lessons/${encodeURIComponent(lessonId)}`,
    {
      method: 'PUT',
      headers: authHeaders(token),
      body: formData,
    }
  );

  return {
    ...result,
    lesson: withAbsoluteLessonMedia(result.lesson),
  };
}

export async function deleteEducatorLesson(
  token: string,
  lessonId: string
): Promise<{ deleted: boolean; lesson: EducatorLesson }> {
  const result = await request<{
    deleted: boolean;
    lesson: EducatorLesson;
  }>(
    `/api/learning/lessons/${encodeURIComponent(lessonId)}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
    }
  );

  return {
    ...result,
    lesson: withAbsoluteLessonMedia(result.lesson),
  };
}
export function getDirectorAccounts(token: string): Promise<{
  students: CloudflareAccount[];
  educators: CloudflareAccount[];
}> {
  return request('/api/director/accounts', { headers: authHeaders(token) });
}
export function getDirectorProfile(
  token: string
): Promise<{ profile: DirectorProfile }> {
  return request('/api/director/profile', {
    headers: authHeaders(token),
  });
}

export function updateDirectorProfile(
  token: string,
  input: {
    schoolName: string;
    username: string;
    password?: string;
  }
): Promise<{
  profile: DirectorProfile;
  token: string;
}> {
  return request('/api/director/profile', {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}
export function getDirectorGradePricing(token: string): Promise<{ prices: SchoolGradePrice[] }> {
  return request('/api/director/pricing', { headers: authHeaders(token) });
}

export function updateDirectorGradePricing(
  token: string,
  gradeId: string,
  monthlyRateUsd: number
): Promise<{ price: SchoolGradePrice }> {
  return request('/api/director/pricing', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ gradeId, monthlyRateUsd }),
  });
}

export function getDirectorLiveStream(token: string, sessionId: string): Promise<LiveStreamStatus> {
  const query = new URLSearchParams({ sessionId });
  return request(`/api/director/live-stream?${query.toString()}`, {
    headers: authHeaders(token),
  });
}
export function updateDirectorAccount(
  token: string,
  accountId: string,
  update: {
    activated?: boolean;
    paid?: boolean;
    renew?: boolean;
    password?: string;
    username?: string;
    registeredSessionId?: string;
    educatorId?: string;
  },
): Promise<{ account: CloudflareAccount }> {
  return request(`/api/director/accounts/${encodeURIComponent(accountId)}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(update),
  });
}

export function deleteDirectorAccount(
  token: string,
  accountId: string
): Promise<{ deleted: boolean; fileCleanupComplete?: boolean }> {
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

export function updateDirectorSessionLive(
  token: string,
  sessionId: string,
  isLive: boolean
): Promise<{ session: StoredSessionRecord }> {
  return request(`/api/director/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ isLive }),
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
// Request a temporary Stream identity for the anonymous guest test room.
export function createGuestLiveStream(): Promise<LiveStreamStatus> {
  return request<LiveStreamStatus>(
    '/api/guest/live-stream',
    {
      method: 'POST',
    }
  );
}
export function setupLiveStream(token: string): Promise<LiveStreamSetup> {
  return request('/api/director/live-stream', {
    method: 'POST',
    headers: authHeaders(token),
  });
}
export function getClassroomMessages(
  token: string,
  sessionId: string,
  studentId: string,
): Promise<{ messages: ClassroomMessage[] }> {
  const query = new URLSearchParams({ sessionId, studentId });

  return request(`/api/classroom/messages?${query.toString()}`, {
    headers: authHeaders(token),
  });
}

export function uploadClassroomAttachment(
  token: string,
  sessionId: string,
  studentId: string,
  file: File,
): Promise<{
  attachmentKey: string;
  attachmentName: string;
  attachmentType: string;
}> {
  const formData = new FormData();

  formData.append('sessionId', sessionId);
  formData.append('studentId', studentId);
  formData.append('file', file, file.name);

  return request('/api/classroom/attachments', {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });
}

export function sendClassroomMessage(
  token: string,
  sessionId: string,
  studentId: string,
  message: string,
  attachment?: {
    attachmentKey: string;
    attachmentName: string;
    attachmentType: string;
  },
): Promise<{
  sent: boolean;
  message: ClassroomMessage;
}> {
  return request('/api/classroom/messages', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      sessionId,
      studentId,
      message,
      attachmentKey: attachment?.attachmentKey || null,
      attachmentName: attachment?.attachmentName || null,
      attachmentType: attachment?.attachmentType || null,
    }),
  });
}

export function clearClassroomMessages(
  token: string,
  sessionId: string,
  studentId: string,
): Promise<{ cleared: boolean }> {
  return request('/api/classroom/messages/clear', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      sessionId,
      studentId,
    }),
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
  schoolId: string,
  live = false,
  token?: string,
  sessionId?: string,
): Promise<{ sessions: StoredSessionRecord[] }> {
  const query = new URLSearchParams({
    gradeId,
    schoolId,
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


/**
 * Calls Cloudflare Workers AI through the server-side Worker binding.
 * No third-party model API key is exposed to the browser.
 */
export async function generateAIContent(
  contents: unknown,
  options?: { maxOutputTokens?: number },
): Promise<{ text: string }> {
  return request<{ text: string }>('/api/ai/generate', {
    method: 'POST',
    signal: AbortSignal.timeout(55_000),
    body: JSON.stringify({
      contents,
      maxOutputTokens: options?.maxOutputTokens || 1024,
    }),
  });
}

export interface OwnerDirector {id:string;username:string;fullName:string;email:string;phone:string;createdAt:string;activated:boolean;paid:boolean;expiresAt:string|null;schoolId:string;schoolName:string;licenseActive:boolean;paymentMethod:'suyool'|'whatsapp'|'phone'|'email'|'bank'|'unset';paymentValue:string;studentCount:number;educatorCount:number;directorLink:string;}
export function getOwnerDirectors(token:string):Promise<{directors:OwnerDirector[]}>{return request('/api/owner/directors',{headers:authHeaders(token)});}
export function updateOwnerDirector(token:string,id:string,update:{paymentMethod?:OwnerDirector['paymentMethod'];paymentValue?:string;renewLicense?:boolean;licenseActive?:boolean}):Promise<{updated:boolean}>{return request('/api/owner/directors/'+encodeURIComponent(id),{method:'PATCH',headers:authHeaders(token),body:JSON.stringify(update)});}
export function getSchoolPayment(schoolId:string):Promise<{paymentMethod:OwnerDirector['paymentMethod'];paymentValue:string}>{return request('/api/school-payment?'+new URLSearchParams({schoolId}).toString());}
