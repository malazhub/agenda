import React, { useEffect, useState, useRef } from 'react';
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
  Minimize2, 
  Mic, 
  MicOff, 
  Users, 
  Clock, 
  Radio 
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

  // Role detection
  const isEducator = registeredAccount?.role === 'educator' || localStorage.getItem('registered_account_role') === 'educator';
  const educatorName = registeredAccount?.fullName || localStorage.getItem('registered_educator_name') || 'Prof. Educator';
  const educatorSubject = registeredAccount?.schoolOrSubject || 'Academic Subject';
  const myRegisteredEducator = localStorage.getItem('registered_educator_name') || '';

  // In-call conference state
  const [inLiveConference, setInLiveConference] = useState(false);
  const [activeCallSession, setActiveCallSession] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45-minute timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Dynamic live sessions list for this grade
  const [liveSessionsList, setLiveSessionsList] = useState<Array<{
    id: string;
    grade: string;
    educatorName: string;
    subject: string;
    isLive: boolean;
  }>>([]);

  // Load dynamic sessions from Director's saved sessions + educator's registered room
  const loadLiveSessions = () => {
    let list: any[] = [];
    try {
      const saved = localStorage.getItem('director_saved_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter matching selected grade
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

    // If user is Educator, ensure their registered session appears in their name, subject, and grade
    if (isEducator) {
      const mySessionIndex = list.findIndex(s => s.educatorName.toLowerCase() === educatorName.toLowerCase());
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

    // Default fallback if no sessions configured by director
    if (list.length === 0) {
      list = [
        {
          id: `sess_1_${selectedGrade.id}`,
          grade: selectedGrade.name[currentLang],
          educatorName: 'Prof. Malaz',
          subject: 'Mathematics',
          isLive: true,
        },
        {
          id: `sess_2_${selectedGrade.id}`,
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
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Launch live video call
  const startLiveCall = async (session: any) => {
    setActiveCallSession(session);
    setInLiveConference(true);
    setTimerRunning(true);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('Camera/mic access warning:', err);
    }

    if (onEnterLiveClassroom) {
      onEnterLiveClassroom(session);
    }
  };

  const endLiveCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setInLiveConference(false);
    setTimerRunning(false);
    setTimeLeft(45 * 60);
    setActiveCallSession(null);
  };

  const openSession = (session: StoredSessionRecord) => {
    const url = session.mediaUrl || session.playbackUrl || session.sourceUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-start" ref={containerRef}>
      
      {/* IN-CALL VIDEO CLASSROOM VIEW (Active Video Session) */}
      {inLiveConference && activeCallSession ? (
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[82vh] text-white">
          <div className="px-6 py-4 bg-slate-800/90 backdrop-blur-md flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-3">
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

            {/* 45-Minute Synchronized Timer */}
            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-700 font-mono text-sm text-amber-400 font-black">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{formatTimer(timeLeft)}</span>
            </div>

            {/* Actions: Fullscreen and Leave */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 transition text-slate-200 cursor-pointer"
                title="Full Screen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={endLiveCall}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                {t.endSession}
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Live Video Call Screen */}
            <div className="flex-1 bg-black flex items-center justify-center relative p-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isEducator}
                className="w-full h-full object-contain rounded-2xl bg-slate-950"
              />
              <span className="absolute bottom-5 left-5 bg-black/60 backdrop-blur-xs px-3 py-1 rounded-lg text-xs font-semibold">
                {isEducator ? `${educatorName} (Educator)` : `${registeredAccount?.fullName || 'Student'} (Live)`}
              </span>
            </div>

            {/* Attendance List Sidebar */}
            <div className="w-64 bg-slate-800 p-4 border-l border-slate-700 flex flex-col">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-700 text-xs font-black uppercase text-slate-400">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>{currentLang === 'ar' ? 'حضور الطلاب' : 'Student Attendance'}</span>
              </div>

              <div className="space-y-2 mt-3 flex-1 overflow-y-auto text-xs">
                {[
                  { name: 'Bilal Ahmad', isLive: true },
                  { name: 'كريم منصور', isLive: true },
                  { name: 'نور حداد', isLive: false },
                  { name: 'Marc Abou-Jaoudé', isLive: true },
                  { name: 'Céline Khater', isLive: false }
                ].map((st, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-700/50">
                    <span className="font-semibold text-slate-200">{st.name}</span>
                    {st.isLive ? (
                      <span className="text-[10px] text-emerald-400 font-bold">● Live</span>
                    ) : (
                      <span className="text-[10px] text-rose-400">Absent</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-2.5 rounded-xl transition cursor-pointer ${isMicOn ? 'bg-slate-700' : 'bg-rose-600'}`}
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (

        /* NORMAL SESSIONS VIEW */
        <>
          {/* Top Bar with Grade Info & The 2 Main Buttons */}
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
                    {currentLang === 'ar' ? 'منهاج رسمي لبناني معتمد' : currentLang === 'fr' ? 'Programme officiel libanais' : 'Certified Official Curriculum'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {selectedGrade.name[currentLang]}
                </h2>
              </div>
            </div>

            {/* The 2 Buttons: 1. Saved Sessions | 2. Live Sessions (ALWAYS CLICKABLE) */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveTab('stored')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  activeTab === 'stored' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'الموارد التعليمية' : currentLang === 'fr' ? 'Ressources pédagogiques' : 'Learning resources'}</span>
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
                <span>{currentLang === 'ar' ? 'الحصص المباشرة' : currentLang === 'fr' ? 'Sessions en direct' : 'Live Sessions'}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: LIVE SESSIONS (Educator Open Live vs Student Join dedicated session) */}
          {activeTab === 'live' ? (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                    <h3 className="font-black text-base">
                      {isEducator
                        ? (currentLang === 'ar' ? 'بدء الحصة المباشرة' : 'Start Live Session')
                        : (currentLang === 'ar' ? 'الانضمام إلى الحصة المباشرة' : 'Join Live Session')}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {isEducator
                      ? (currentLang === 'ar' ? `لوحة الأستاذ: اضغط افتح الحصة المباشرة لبدء البث في مادة (${educatorSubject})` : `Educator: Open live video session for ${educatorSubject}`)
                      : (currentLang === 'ar' ? 'اضغط زر الانضمام للدخول مباشرة إلى الغرفة المباشرة مع أستاذك' : 'Click Join to enter the live conference room with your educator')}
                  </p>
                </div>

                {/* Direct Action for Student: Join Live Session directly into the conference room */}
                {!isEducator && (
                  <button
                    type="button"
                    onClick={() => {
                      const mySession = liveSessionsList.find(s => 
                        myRegisteredEducator && s.educatorName.trim().toLowerCase() === myRegisteredEducator.trim().toLowerCase()
                      ) || liveSessionsList[0];
                      if (mySession) {
                        startLiveCall(mySession);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    <Video className="w-4 h-4" />
                    <span>{currentLang === 'ar' ? 'الانضمام للحصة المباشرة' : 'Join Live Session'}</span>
                  </button>
                )}
              </div>

              {/* Grid of Live Sessions */}
              <div className="grid gap-4 md:grid-cols-2">
                {liveSessionsList.map((session) => {
                  const isMyAssignedRoom = myRegisteredEducator && 
                    session.educatorName.trim().toLowerCase() === myRegisteredEducator.trim().toLowerCase();
                  const isEducatorOwnRoom = isEducator && 
                    session.educatorName.trim().toLowerCase().includes(educatorName.trim().toLowerCase());

                  return (
                    <article
                      key={session.id}
                      className={`rounded-3xl border p-5 shadow-sm space-y-4 transition flex flex-col justify-between ${
                        isMyAssignedRoom || isEducatorOwnRoom
                          ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-300'
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
                          <span className="inline-block mt-2 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            ✓ {currentLang === 'ar' ? 'أستاذك المعتمد لهذا الصف' : 'Your Assigned Educator'}
                          </span>
                        )}
                      </div>

                      {/* Action Button: Educator Open Live vs Student Join */}
                      <div>
                        {isEducator ? (
                          isEducatorOwnRoom ? (
                            <button
                              type="button"
                              onClick={() => startLiveCall(session)}
                              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                            >
                              <Video className="w-4 h-4" />
                              <span>{currentLang === 'ar' ? 'افتح الحصة المباشرة (Open Live Session)' : 'Open Live Video Session'}</span>
                            </button>
                          ) : (
                            <div className="w-full py-2 text-center text-xs font-bold text-slate-400 bg-slate-100 rounded-xl">
                              {currentLang === 'ar' ? 'صف أستاذ آخر' : "Another Educator's Room"}
                            </div>
                          )
                        ) : (
                          isMyAssignedRoom ? (
                            <button
                              type="button"
                              onClick={() => startLiveCall(session)}
                              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                            >
                              <Video className="w-4 h-4" />
                              <span>{currentLang === 'ar' ? 'انضمام لحصة أستاذك (Join)' : 'Join Live Session'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="w-full rounded-xl bg-slate-100 text-slate-400 py-2.5 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1.5"
                              title="You did not sign for this educator"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>{currentLang === 'ar' ? 'غير مسجل مع هذا الأستاذ' : 'Cannot Join (Not Registered)'}</span>
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
                {currentLang === 'ar' ? 'جارٍ تحميل الحصص...' : currentLang === 'fr' ? 'Chargement des sessions...' : 'Loading sessions...'}
              </div>
            ) : error ? (
              <div role="alert" className="bg-white rounded-3xl border border-red-200 p-6 text-center space-y-3">
                <p className="text-sm font-semibold text-red-700">{error}</p>
                <button
                  onClick={() => setReloadKey((key) => key + 1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {currentLang === 'ar' ? 'إعادة المحاولة' : currentLang === 'fr' ? 'Réessayer' : 'Retry'}
                </button>
              </div>
            ) : storedSessions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
                <p className="text-sm font-bold text-slate-800">
                  {currentLang === 'ar' ? 'لا توجد حصص محفوظة لهذا الصف حتى الآن.' : currentLang === 'fr' ? 'Aucune session enregistrée pour ce niveau.' : 'No stored sessions are available for this grade yet.'}
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
                        {session.teacherName && <p className="mt-1 text-xs text-slate-500">{session.teacherName}</p>}
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
