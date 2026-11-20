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
  studentGradeLabel?: string;
  registeredSessionId: string | null;
  registeredEducatorId: string | null;
  createdAt: string;
  expiresAt: string | null;
  activated: boolean;
  paid: boolean;
  mustChangePassword: boolean;
}

export interface AuthResponse {
  account: CloudflareAccount;
  token: string;
  directorLink?: string;
  chatOnly?: boolean;
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
  registeredEducatorId?: string;
  studentGradeLabel?: string;
  className?: string;
}

export interface PublicDirectorRegistrationInput {
  fullName: string;
  schoolName: string;
  email: string;
  phone: string;
  password: string;
}

export interface PublicDirectorRegistrationResult {
  registered: boolean;
  loginEmail: string;
  schoolId: string;
  directorLink: string;
  director: {
    id: string;
    fullName: string;
    schoolName: string;
    email: string;
    phone: string;
    activated: false;
    paid: false;
    licenseActive: false;
    setupPending: false;
  };
}

export function registerPublicDirectorSchool(
  input: PublicDirectorRegistrationInput
): Promise<PublicDirectorRegistrationResult> {
  return request('/api/director/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
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
  educatorId?: string;
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
  studentId?: string;
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
  'https://agenda-api.mycamp.workers.dev'
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

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body && !isFormData
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown browser origin';
    const detail = error instanceof Error ? error.message : String(error);
    const diagnostic =
      `Could not reach Agenda API at ${API_BASE_URL}${path} from ${origin}. ` +
      `The browser received no HTTP response (network, DNS, browser blocking, or CORS). ` +
      `Browser detail: ${detail}`;
    console.error('Agenda API network request failed', {
      apiUrl: `${API_BASE_URL}${path}`,
      origin,
      detail,
    });
    throw new Error(diagnostic);
  }

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

export function loginAccount(username: string, password: string, schoolId: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, schoolId }),
  });
}

export function getCurrentAccount(token: string, schoolId?: string): Promise<{ account: CloudflareAccount; directorLink?: string; schoolSwitchRequired?: boolean; chatOnly?: boolean; token?: string }> {
  const query = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
  return request(`/api/auth/me${query}`, { headers: authHeaders(token) });
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

export function deleteDirectorGradePricing(token: string, gradeId: string): Promise<{ deleted: boolean; changes: number }> {
  return request('/api/director/pricing/' + encodeURIComponent(gradeId), {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export function getDirectorLiveStream(token: string, sessionId: string): Promise<LiveStreamStatus> {
  const query = new URLSearchParams({ sessionId });
  return request(`/api/director/live-stream?${query.toString()}`, {
    headers: authHeaders(token),
  });
}
export type DirectorAccountUpdate = {
  id: string;
  activated: boolean;
  paid: boolean;
  gradeId: string;
  registeredSessionId: string | null;
  registeredEducatorId: string | null;
  schoolOrSubject?: string;
};

export function saveDirectorAccountUpdates(
  token: string,
  updates: DirectorAccountUpdate[],
): Promise<{ updated: number; accounts: CloudflareAccount[] }> {
  return request('/api/director/accounts/status', {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ updates }),
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
    registeredSessionId?: string | null;
    educatorId?: string | null;
    registeredEducatorId?: string | null;
    gradeId?: string;
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
export function getEducatorAssignedSession(token: string): Promise<{ session: StoredSessionRecord }> {
  return request('/api/educator/assigned-session', { headers: authHeaders(token) });
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

export type DirectorPaymentMethod = 'suyool'|'whatsapp'|'phone'|'email'|'bank'|'unset';
export interface OwnerDirector {
  id:string; username:string; fullName:string; email:string; phone:string;
  createdAt:string; activated:boolean; paid:boolean; expiresAt:string|null;
  schoolId:string; schoolName:string; licenseActive:boolean;
  paymentMethod:DirectorPaymentMethod; paymentValue:string;
  setupPending:boolean; phonePasswordEnabled:boolean; studentCount:number; educatorCount:number; directorLink:string;
}
export interface CreateOwnerDirectorInput {
  fullName:string; email:string; phone:string;
  schoolName:string; paymentReceived:true;
}
export interface CreatedOwnerDirector {
  id:string; username:string; fullName:string; email:string; phone:string;
  schoolId:string; schoolName:string; licenseActive:boolean; paid:boolean;
  setupPending:boolean; expiresInYears:number; directorLink:string;
}
export function createOwnerDirector(token:string,input:CreateOwnerDirectorInput):Promise<{director:CreatedOwnerDirector;setupLink:string}> {
  return request('/api/owner/directors',{method:'POST',headers:authHeaders(token),body:JSON.stringify(input)});
}
export function getOwnerDirectors(token:string):Promise<{directors:OwnerDirector[]}> {
  return request('/api/owner/directors',{headers:authHeaders(token)});
}
export function updateOwnerDirector(token:string,id:string,update:{renewLicense?:boolean;licenseActive?:boolean;activated?:boolean;paid?:boolean}):Promise<{updated:boolean}> {
  return request('/api/owner/directors/'+encodeURIComponent(id),{method:'PATCH',headers:authHeaders(token),body:JSON.stringify(update)});
}
export function saveOwnerDirectorStatuses(token:string,updates:Array<{id:string;activated:boolean;paid:boolean}>):Promise<{updated:number;statuses:Array<{id:string;activated:boolean;paid:boolean}>}> {
  return request('/api/owner/directors/status',{method:'PATCH',headers:authHeaders(token),body:JSON.stringify({updates})});
}
export function resetOwnerDirectorPhonePassword(token:string,id:string):Promise<{reset:boolean;verified:boolean;username:string;phoneDigits:number;phoneLastTwo:string;activated:boolean;paid:boolean;licenceActive:boolean;accessReady:boolean;message:string}> {
  return request('/api/owner/directors/'+encodeURIComponent(id)+'/reset-phone-password',{method:'POST',headers:authHeaders(token)});
}
export function deleteOwnerDirector(token:string,id:string):Promise<{deleted:boolean}> {
  return request('/api/owner/directors/'+encodeURIComponent(id),{method:'DELETE',headers:authHeaders(token)});
}
export function issueDirectorSetupLink(token:string,id:string):Promise<{setupLink:string}> {
  return request('/api/owner/directors/'+encodeURIComponent(id)+'/setup-link',{method:'POST',headers:authHeaders(token)});
}
export function claimDirectorSetup(token:string,username:string):Promise<{account:CloudflareAccount;token:string}> {
  return request('/api/director/claim',{method:'POST',body:JSON.stringify({token,username})});
}
export function getDirectorPayment(token:string):Promise<{paymentMethod:DirectorPaymentMethod;paymentValue:string}> {
  return request('/api/director/payment',{headers:authHeaders(token)});
}
export function updateDirectorPayment(token:string,paymentMethod:DirectorPaymentMethod,paymentValue:string):Promise<{paymentMethod:DirectorPaymentMethod;paymentValue:string}> {
  return request('/api/director/payment',{method:'PUT',headers:authHeaders(token),body:JSON.stringify({paymentMethod,paymentValue})});
}
export function getSchoolPayment(schoolId:string):Promise<{paymentMethod:DirectorPaymentMethod;paymentValue:string}> {
  return request('/api/school-payment?'+new URLSearchParams({schoolId}).toString());
}

export interface FounderMessage {
  id: string;
  senderId: string;
  senderRole: 'student'|'educator'|'director'|'owner'|'guest';
  message: string;
  createdAt: string;
  readAt: string | null;
}
export interface FounderThread {
  accountId: string;
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  role: 'student'|'educator'|'director'|'guest';
  schoolId: string;
  schoolName: string;
  schoolOrSubject?: string;
  gradeId?: string;
  registeredEducatorId?: string | null;
  educatorName?: string;
  registeredSessionId?: string | null;
  registeredSession?: string;
  createdAt?: string | null;
  expiresAt?: string | null;
  activated?: boolean | number;
  paid?: boolean | number;
  messageCount: number;
  incomingCount: number;
  unreadIncoming: number;
  outgoingCount: number;
  lastMessageAt: string | null;
}
export function getFounderMessages(token:string):Promise<{messages:FounderMessage[]}> {
  return request('/api/founder/messages',{headers:authHeaders(token)});
}
export function sendFounderMessage(token:string,message:string):Promise<{sent:boolean}> {
  return request('/api/founder/messages',{method:'POST',headers:authHeaders(token),body:JSON.stringify({message})});
}
export function getOwnerFounderThreads(token:string):Promise<{threads:FounderThread[]}> {
  return request('/api/owner/founder/messages',{headers:authHeaders(token)});
}
export function getOwnerFounderMessages(token:string,accountId:string):Promise<{messages:FounderMessage[]}> {
  return request('/api/owner/founder/messages?'+new URLSearchParams({accountId}).toString(),{headers:authHeaders(token)});
}
export function replyToFounderThread(token:string,accountId:string,message:string):Promise<{sent:boolean}> {
  return request('/api/owner/founder/messages',{method:'POST',headers:authHeaders(token),body:JSON.stringify({accountId,message})});
}
export function deleteFounderThread(token:string,accountId:string):Promise<{deleted:boolean}> {
  return request('/api/owner/founder/messages?'+new URLSearchParams({accountId}).toString(),{method:'DELETE',headers:authHeaders(token)});
}

export function getGuestContactMessages(guestId:string):Promise<{messages:FounderMessage[]}> {
  return request('/api/guest/contact?'+new URLSearchParams({guestId}).toString());
}
export function sendGuestContactMessage(guestId:string,message:string):Promise<{sent:boolean}> {
  return request('/api/guest/contact?'+new URLSearchParams({guestId}).toString(),{method:'POST',body:JSON.stringify({message})});
}

export function deleteOwnerAccount(token:string,accountId:string):Promise<{deleted:boolean}> {
  return request('/api/owner/accounts/'+encodeURIComponent(accountId),{method:'DELETE',headers:authHeaders(token)});
}
