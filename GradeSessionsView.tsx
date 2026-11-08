import React, { useEffect, useState } from 'react';
import { Language, GradeLevelDef } from '../types';
import { translations } from '../translations';
import { getGradeSessions } from '../services/cloudflareApi';
import type { CloudflareAccount, StoredSessionRecord } from '../services/cloudflareApi';
import { 
  ArrowLeft, 
  ArrowRight, 
  Video, 
  FileText, 
  ExternalLink, 
  RefreshCw, 
  Lock, 
  Maximize2, 
  Users, 
  Clock, 
  Radio,
  CheckCircle2,
  PhoneOff
} from 'lucide-react';

interface GradeSessionsViewProps {
  currentLang: Language;
  selectedGrade: GradeLevelDef;
  initialTab?: 'stored' | 'live';
  registeredAccount: CloudflareAccount | null;
  sessionToken: string;
  onBack: () => void;
  onEnterLiveClassroom?: (session?: any) => void;
}

export const GradeSessionsView: React.FC<GradeSessionsViewProps> = ({
  currentLang,
  selectedGrade,
  initialTab = 'stored',
  registeredAccount,
  sessionToken,
  onBack,
  onEnterLiveClassroom,
}) => {
  const isRTL = currentLang === 'ar';
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<'stored' | 'live'>(initialTab);
  const [storedSessions, setStoredSessions] = useState<StoredSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Authentication & safe verification
  const isSignedIn = Boolean(registeredAccount && (sessionToken || registeredAccount.id));
  const isAccountActive = Boolean(
    registeredAccount?.activated === true || 
    (registeredAccount as any)?.activated === 1 || 
    String(registeredAccount?.activated) === 'true' ||
    String(registeredAccount?.activated) === '1'
  );

  const isAccountExpired = Boolean(
    registeredAccount?.expiresAt &&
    registeredAccount.expiresAt.trim() !== '' &&
    Number.isFinite(Date.parse(registeredAccount.expiresAt.replace(' ', 'T').replace(/Z$/, '') + 'Z')) &&
    Date.parse(registeredAccount.expiresAt.replace(' ', 'T').replace(/Z$/, '') + 'Z') <= Date.now()
  );

  const isPaidAndActivated = isAccountActive && !isAccountExpired;

  // Role detection
  const isEducator = registeredAccount?.role === 'educator' || localStorage.getItem('registered_account_role') === 'educator';
  const educatorName = registeredAccount?.fullName || localStorage.getItem('registered_educator_name') || 'Prof. Educator';
  const educatorSubject = registeredAccount?.schoolOrSubject || 'Academic Subject';

  // Dynamic assigned educator retrieval
  const assignedEduName = 
    localStorage.getItem('registered_educator_name') || 
    sessionStorage.getItem('registered_educator_name') || 
    '';
  const assignedSessionId = 
    registeredAccount?.registeredSessionId || 
    localStorage.getItem('registered_educator_id') || 
    '';

  const cleanText = (str: string) => 
    (str || '')
      .toLowerCase()
      .replace(/^(prof|dr|mme|mr|أستاذ|دكتور)\.?\s+/i, '')
      .replace(/[^a-z0-9\u0600-\u06FF]/gi, '')
      .trim();

  // In-call conference state
  const [inLiveConference, setInLiveConference] = useState(false);
  const [activeCallSession, setActiveCallSession] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45-minute countdown timer
  const [timerRunning, setTimerRunning] = useState(false);

  // Dynamic live sessions list for this grade
  const [liveSessionsList, setLiveSessionsList] = useState<Array<{
    id: string;
    grade: string;
    educatorName: string;
    subject: string;
    isLive: boolean;
  }>>([]);

  const loadLiveSessions = () => {
    let list: any[] = [];
    try {
      const saved = localStorage.getItem('director_saved_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          list = parsed
            .filter((s: any) => !s.gradeId || s.gradeId.toLowerCase() === selectedGrade.id.toLowerCase())
            .map((s: any) => ({
              id: s.id,
              grade: selectedGrade.name[currentLang],
              educatorName: s.title || s.sourceName || 'Educator',
              subject: s.subject || 'Subject',
              isLive: Boolean(s.isLive),
            }));
        }
      }
    } catch {}

    if (isEducator) {
      const mySessionIndex = list.findIndex(s => cleanText(s.educatorName) === cleanText(educatorName));
      if (mySessionIndex === -1) {
        list.unshift({
          id: `edu_live_${selectedGrade.id}`,
          grade: selectedGrade.name[currentLang],
          educatorName,
          subject: educatorSubject,
          isLive: true,
        });
      }
    }

    if (list.length === 0) {
      list = [
        {
          id: `sess_malaz_${selectedGrade.id}`,
          grade: selectedGrade.name[currentLang],
          educatorName: 'Prof. Malaz',
          subject: 'Mathematics',
          isLive: true,
        },
        {
          id: `sess_jad_${selectedGrade.id}`,
          grade: selectedGrade.name[currentLang],
          educatorName: 'Prof. Jad Khoury',
          subject: 'Physics',
          isLive: true,
        }
      ];
    }
    setLiveSessionsList(list);
  };

  useEffect(() => {
    loadLiveSessions();
  }, [selectedGrade.id, isEducator, educatorName, reloadKey]);

  // Load stored learning resources
  useEffect(() => {
    let active = true;
    if (activeTab === 'stored') {
      setIsLoading(true);
      setError(null);
      getGradeSessions(selectedGrade.id)
        .then(({ sessions: loadedSessions }) => {
          if (!active) return;
          setStoredSessions(loadedSessions);
        })
        .catch((requestError) => {
          if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load sessions.');
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [selectedGrade.id, activeTab, reloadKey]);

  // 45-minute countdown timer
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startLiveCall = (session: any) => {
    setActiveCallSession(session);
    setInLiveConference(true);
    setTimerRunning(true);

    if (onEnterLiveClassroom) {
      onEnterLiveClassroom(session);
    }
  };

  const endLiveCall = () => {
    setInLiveConference(false);
    setTimerRunning(false);
    setTimeLeft(45 * 60);
    setActiveCallSession(null);
  };

  // Check if session belongs to this student
  const isStudentSessionMatch = (session: any) => {
    if (!session) return false;
    if (assignedSessionId && session.id === assignedSessionId) {
      return true;
    }
    if (assignedEduName) {
      const cleanAssigned = cleanText(assignedEduName);
      const cleanEdu = cleanText(session.educatorName);
      if (cleanAssigned && cleanEdu && (cleanEdu.includes(cleanAssigned) || cleanAssigned.includes(cleanEdu))) {
        return true;
      }
    }
    return !assignedEduName && !assignedSessionId;
  };

  const studentPrimarySession = liveSessionsList.find((s) => isStudentSessionMatch(s)) || liveSessionsList[0];

  // Student join validation
  const handleStudentJoinRoom = (session: any) => {
    if (!isSignedIn) {
      alert(
        currentLang === 'ar'
          ? 'يجب تسجيل الدخول أولاً بحساب طالب للانضمام إلى الحصة المباشرة.'
          : 'Access Denied: Please sign in with your student account to join.'
      );
      return;
    }

    if (!isPaidAndActivated) {
      alert(
        currentLang === 'ar'
          ? 'لا يمكنك الدخول! يجب أن يكون حسابك مفعلاً ومدفوعاً من قِبل الإدارة.'
          : 'Access Denied: Your account is pending activation by the Director.'
      );
      return;
    }

    if (!isStudentSessionMatch(session)) {
      const targetName = assignedEduName || 'أستاذك المعتمد';
      alert(
        currentLang === 'ar'
          ? `لا يمكنك الانضمام! أنت مسجل مع الأستاذ (${targetName}). لا يحق لك دخول صف أستاذ آخر.`
          : `Access Denied: You are registered with ${targetName}. You cannot join another educator's room.`
      );
      return;
    }

    startLiveCall(session);
  };

  // Educator opens the live room
  const handleEducatorOpenRoom = (session: any) => {
    if (!isSignedIn) {
      alert(currentLang === 'ar' ? 'يجب تسجيل الدخول كأستاذ لفتح البث المباشر.' : 'Please sign in with your educator account.');
      return;
    }
    startLiveCall(session);
  };

  const openSession = (session: StoredSessionRecord) => {
    const s = session as any;
    const url = s.mediaUrl || session.playbackUrl || session.sourceUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Unique Room Name for this class
  const liveRoomName = activeCallSession 
    ? `Agenda-${cleanText(selectedGrade.id)}-${cleanText(activeCallSession.educatorName)}`
    : `Agenda-Classroom-${cleanText(selectedGrade.id)}`;

  const currentParticipantName = isEducator
    ? `${educatorName} (Teacher)`
    : `${registeredAccount?.fullName || 'Bilal'} (Student)`;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-start">
      
      {/* REAL 2-DEVICE LIVE VIDEO CLASSROOM (Malaz & Bilal connect live across devices) */}
      {inLiveConference && activeCallSession ? (
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[88vh] text-white">
          {/* Top Bar: Timer, Info, Leave Button */}
          <div className="px-6 py-3.5 bg-slate-800/95 backdrop-blur-md flex flex-wrap items-center justify-between border-b border-slate-700 gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  endLiveCall();
                  onBack();
                }}
                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white font-bold px-3 py-1.5 rounded-xl transition cursor-pointer text-xs"
                title="Back"
              >
                {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{currentLang === 'ar' ? 'الرئيسية' : 'Main'}</span>
              </button>

              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <div>
                <h3 className="font-bold text-sm">{activeCallSession.subject} — {selectedGrade.name[currentLang]}</h3>
                <p className="text-xs text-slate-400">
                  {currentLang === 'ar' ? 'الأستاذ: ' : 'Educator: '}{activeCallSession.educatorName}
                </p>
              </div>
            </div>

            {/* 45-Minute Timer */}
            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-700 font-mono text-sm text-amber-400 font-black">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{formatTimer(timeLeft)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={endLiveCall}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{t.endSession}</span>
              </button>
            </div>
          </div>

          {/* WebRTC Video Room: Real bidirectional video/audio between Teacher & Student */}
          <div className="flex-1 w-full bg-black relative">
            <iframe
              src={`https://meet.jit.si/${liveRoomName}#userInfo.displayName="${encodeURIComponent(currentParticipantName)}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
              title="Live Classroom Video Call"
            />
          </div>

          {/* Real Live Attendance Bar Below the Video */}
          <div className="bg-slate-800 px-6 py-3 border-t border-slate-700 flex flex-wrap items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="font-bold">{currentLang === 'ar' ? 'أنت متصل الآن في الغرفة:' : 'Connected in Room:'}</span>
              <span className="text-emerald-400 font-semibold">{currentParticipantName}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentLang === 'ar' ? 'الاتصال المباشر بالصوت والصورة نشط بين الأستاذ والطلاب' : 'Live two-way video & audio is active'}</span>
            </div>
          </div>
        </div>
      ) : (

        /* NORMAL SESSIONS VIEW */
        <>
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-2xl transition cursor-pointer text-xs sm:text-sm shadow-2xs"
              >
                {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{currentLang === 'ar' ? 'رجوع' : currentLang === 'fr' ? 'Retour' : 'Back'}</span>
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    {selectedGrade.cycle[currentLang]}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {currentLang === 'ar' ? 'منهاج رسمي لبناني معتمد' : 'Certified Official Curriculum'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {selectedGrade.name[currentLang]}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveTab('stored')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  activeTab === 'stored' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'الموارد التعليمية' : 'Learning resources'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('live')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  activeTab === 'live' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
                <Video className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'الحصص المباشرة' : 'Live Sessions'}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: LIVE SESSIONS */}
          {activeTab === 'live' ? (
            <div className="space-y-4">
              
              {/* STUDENT JOIN CARD */}
              {!isEducator && studentPrimarySession && (
                <div className="bg-linear-to-r from-emerald-950 via-slate-900 to-indigo-950 border-2 border-emerald-400 p-5 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4 text-white">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      {currentLang === 'ar' ? 'حصتك المباشرة المعتمدة جاهزة للانضمام' : 'Your Enrolled Live Classroom is Ready'}
                    </span>
                    <h3 className="text-xl font-black text-white">
                      {currentLang === 'ar' ? 'الأستاذ: ' : 'Educator: '}{studentPrimarySession.educatorName}
                    </h3>
                    <p className="text-xs text-slate-300 font-semibold">
                      {selectedGrade.name[currentLang]} • {studentPrimarySession.subject}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStudentJoinRoom(studentPrimarySession)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl transition cursor-pointer text-sm shadow-xl flex items-center gap-2 transform hover:scale-105 active:scale-95"
                  >
                    <Video className="w-5 h-5 text-slate-950" />
                    <span>{currentLang === 'ar' ? 'اضغط هنا للدخول إلى الصف (Join Class Now)' : 'Click to Join Class Now'}</span>
                  </button>
                </div>
              )}

              {/* Educator Heading */}
              {isEducator && (
                <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                      <h3 className="font-black text-base">
                        {currentLang === 'ar' ? 'بدء الحصة المباشرة' : 'Start Live Session'}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {currentLang === 'ar' ? `لوحة الأستاذ: افتح حصتك المباشرة لبدء البث في مادة (${educatorSubject})` : `Educator: Open your live video session for ${educatorSubject}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Grid of All Live Rooms */}
              <div className="grid gap-4 md:grid-cols-2">
                {liveSessionsList.map((session) => {
                  const isMyAssignedRoom = isStudentSessionMatch(session);
                  const isEducatorOwnRoom = isEducator && (
                    cleanText(session.educatorName).includes(cleanText(educatorName)) ||
                    cleanText(educatorName).includes(cleanText(session.educatorName))
                  );

                  return (
                    <article
                      key={session.id}
                      className={`rounded-3xl border p-5 shadow-sm space-y-4 transition flex flex-col justify-between ${
                        isMyAssignedRoom || isEducatorOwnRoom
                          ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wide bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-md">
                            {session.subject}
                          </span>
                          {session.isLive ? (
                            <span className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                              LIVE
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">Scheduled</span>
                          )}
                        </div>

                        <h3 className="text-base font-black text-slate-900">{session.educatorName}</h3>
                        <p className="text-xs text-slate-500">{selectedGrade.name[currentLang]}</p>

                        {isMyAssignedRoom && !isEducator && (
                          <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{currentLang === 'ar' ? 'صفك الدراسي المعتمد' : 'Your Enrolled Class'}</span>
                          </span>
                        )}
                      </div>

                      <div>
                        {isEducator ? (
                          isEducatorOwnRoom ? (
                            <button
                              type="button"
                              onClick={() => handleEducatorOpenRoom(session)}
                              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95"
                            >
                              <Video className="w-4 h-4" />
                              <span>{currentLang === 'ar' ? 'افتح الحصة المباشرة (Open Live Session)' : 'Open Live Video Session'}</span>
                            </button>
                          ) : (
                            <div className="w-full py-2.5 text-center text-xs font-bold text-slate-400 bg-slate-100 rounded-xl">
                              {currentLang === 'ar' ? 'صف أستاذ آخر' : "Another Educator's Room"}
                            </div>
                          )
                        ) : (
                          isMyAssignedRoom ? (
                            <button
                              type="button"
                              onClick={() => handleStudentJoinRoom(session)}
                              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95"
                            >
                              <Video className="w-4 h-4" />
                              <span>{currentLang === 'ar' ? 'انضمام للحصة المباشرة (Join Now)' : 'Join Live Session'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStudentJoinRoom(session)}
                              className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 py-3 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
                            >
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{currentLang === 'ar' ? 'غير مسجل مع هذا الأستاذ' : 'Cannot Join (Different Educator)'}</span>
                            </button>
                          )
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (

            /* TAB 2: STORED RESOURCES */
            isLoading ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
                {currentLang === 'ar' ? 'جارٍ تحميل الحصص...' : 'Loading sessions...'}
              </div>
            ) : error ? (
              <div role="alert" className="bg-white rounded-3xl border border-red-200 p-6 text-center space-y-3">
                <p className="text-sm font-semibold text-red-700">{error}</p>
                <button
                  onClick={() => setReloadKey((key) => key + 1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {currentLang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </div>
            ) : storedSessions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
                <p className="text-sm font-bold text-slate-800">
                  {currentLang === 'ar' ? 'لا توجد حصص محفوظة لهذا الصف حتى الآن.' : 'No stored sessions are available for this grade yet.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {storedSessions.map((session) => (
                  <article key={session.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wide text-indigo-600">{session.subject}</p>
                        <h3 className="mt-1 text-base font-black text-slate-900">{session.title}</h3>
                        {(session as any).teacherName && <p className="mt-1 text-xs text-slate-500">{(session as any).teacherName}</p>}
                      </div>
                      {session.isLive && (
                        <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black text-rose-700">LIVE</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <a
                        href={session.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-slate-500 underline"
                      >
                        {session.sourceName}
                      </a>
                      <button
                        type="button"
                        onClick={() => openSession(session)}
                        className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black text-white ${
                          session.isLive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-700 hover:bg-indigo-800'
                        }`}
                      >
                        {session.isLive ? <Video className="w-4 h-4" /> : <ExternalLink className="w-3.5 h-3.5" />}
                        {session.isLive
                          ? currentLang === 'ar' ? 'افتح البث المباشر' : 'Open live video'
                          : currentLang === 'ar' ? 'افتح الحصة' : 'Open session'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};
