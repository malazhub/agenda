import React, { useEffect, useState, useRef } from 'react';
import { Language, GradeLevelDef } from '../types';
import { translations } from '../translations';
import { getGradeSessions } from '../services/cloudflareApi';
import type { CloudflareAccount, StoredSessionRecord } from '../services/cloudflareApi';
import { 
  ArrowLeft, 
  ArrowRight, 
  Video, 
  VideoOff,
  FileText, 
  ExternalLink, 
  RefreshCw, 
  Lock, 
  Maximize2, 
  Minimize, 
  Mic, 
  MicOff, 
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

  // In-call conference state & REAL MediaStream state
  const [inLiveConference, setInLiveConference] = useState(false);
  const [activeCallSession, setActiveCallSession] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45-minute countdown timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic live sessions list for this grade
  const [liveSessionsList, setLiveSessionsList] = useState<Array<{
    id: string;
    grade: string;
    educatorName: string;
    subject: string;
    isLive: boolean;
  }>>([]);

    useEffect(() => {
    let active = true;

    const loadLiveSessions = async () => {
      try {
        const { sessions } = await getGradeSessions(
          selectedGrade.id,
          true,
          sessionToken
        );

        if (!active) return;

        const liveSessions = (sessions || [])
          .filter((session) => session.isLive)
          .map((session) => ({
            id: session.id,
            grade: selectedGrade.name[currentLang],
            educatorName:
              session.teacherName ||
              session.title ||
              session.sourceName ||
              'Educator',
            subject: session.subject || 'Subject',
            isLive: true,
          }));

        setLiveSessionsList(liveSessions);
      } catch (error) {
        console.error('Failed to load live educator sessions:', error);

        if (active) {
          setLiveSessionsList([]);
        }
      }
    };

    loadLiveSessions();

    return () => {
      active = false;
    };
  }, [
    selectedGrade.id,
    selectedGrade.name,
    currentLang,
    sessionToken,
    reloadKey,
  ]);

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

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // NATIVE CAMERA & MIC ACTIVATION
  const startLiveCall = async (session: any) => {
    setCameraError(null);
    setActiveCallSession(session);
    setInLiveConference(true);
    setTimerRunning(true);

    try {
      let stream: MediaStream;
      try {
        // Request video and audio
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch {
        // Fallback to video only if mic is occupied
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setLocalStream(stream);
      setIsVideoOn(true);
      setIsMicOn(true);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError(err.message || "Camera permission denied");
    }
  };

  // Safely end live call and shut down hardware tracks
  const endLiveCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setInLiveConference(false);
    setTimerRunning(false);
    setTimeLeft(45 * 60);
    setActiveCallSession(null);
    setCameraError(null);
  };

  // Video track toggle
  const toggleVideoTrack = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !isVideoOn;
        videoTracks.forEach((t) => { t.enabled = nextState; });
        setIsVideoOn(nextState);
      }
    }
  };

  // Mic track toggle
  const toggleAudioTrack = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !isMicOn;
        audioTracks.forEach((t) => { t.enabled = nextState; });
        setIsMicOn(nextState);
      }
    }
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

    void startLiveCall(session);
  };

  // Educator opens the live room
  const handleEducatorOpenRoom = (session: any) => {
    if (!isSignedIn) {
      alert(currentLang === 'ar' ? 'يجب تسجيل الدخول كأستاذ لفتح البث المباشر.' : 'Please sign in with your educator account.');
      return;
    }
    void startLiveCall(session);
  };

  const openSession = (session: StoredSessionRecord) => {
    const s = session as any;
    const url = s.mediaUrl || session.playbackUrl || session.sourceUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Real attendees list only (Zero hardcoded names)
  const realAttendees: Array<{ id: string; name: string; isLive: boolean }> = [];
  if (!isEducator && isSignedIn) {
    realAttendees.push({
      id: registeredAccount?.id || 'current_user',
      name: registeredAccount?.fullName || 'You (Student)',
      isLive: true,
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-start" ref={containerRef}>
      
      {/* IN-CALL VIDEO CLASSROOM VIEW */}
      {inLiveConference && activeCallSession ? (
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] text-white">
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
                title="Back to Main Screen"
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
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 transition text-slate-200 cursor-pointer"
                title="Full Screen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

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

          {/* MAIN VIDEO STAGE: Full-width on top with immediate stream playback */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="w-full bg-slate-950 flex items-center justify-center relative p-3 min-h-[50vh] sm:min-h-[58vh]">
              {/* Native HTML5 Video Element connected directly via Ref Callback */}
              <video
                ref={(videoEl) => {
                  if (videoEl && localStream) {
                    if (videoEl.srcObject !== localStream) {
                      videoEl.srcObject = localStream;
                      videoEl.muted = true;
                      videoEl.play().catch(() => {});
                    }
                  }
                }}
                autoPlay
                playsInline
                muted
                className={`w-full h-full max-h-[58vh] object-contain rounded-2xl bg-black ${
                  localStream && isVideoOn ? 'block' : 'hidden'
                }`}
              />

              {/* Status Badge when camera is live */}
              {localStream && isVideoOn && (
                <div className="absolute top-5 right-5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{currentLang === 'ar' ? 'البث المباشر نشط (HD)' : 'Live Video Stream Active (HD)'}</span>
                </div>
              )}

              {/* Center message if camera permission was denied or loading */}
              {(!localStream || !isVideoOn) && (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400">
                    <Video className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-white">
                    {cameraError 
                      ? (currentLang === 'ar' ? 'تعذر تشغيل الكاميرا' : 'Camera Access Error')
                      : (currentLang === 'ar' ? 'الكاميرا المباشرة متوقفة' : 'Live Camera is Off')}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {cameraError
                      ? (currentLang === 'ar' ? 'يرجى السماح بصلاحيات الكاميرا في متصفحك والضغط على إعادة التشغيل' : 'Please allow camera permissions in your browser and click retry')
                      : (currentLang === 'ar' ? 'اضغط على الزر أدناه لتشغيل الكاميرا والميكروفون' : 'Click the button below to turn on video and audio')}
                  </p>
                  <button
                    type="button"
                    onClick={() => void startLiveCall(activeCallSession)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer shadow-md transition"
                  >
                    {currentLang === 'ar' ? 'تشغيل الكاميرا الآن' : 'Enable Camera Now'}
                  </button>
                </div>
              )}

              {/* User Name Badge on Video */}
              <div className="absolute bottom-5 left-5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 border border-white/10">
                <span className={`w-2 h-2 rounded-full ${localStream && isVideoOn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                <span>
                  {isEducator ? `${educatorName} (Educator)` : `${registeredAccount?.fullName || 'Student'} (Live)`}
                </span>
              </div>
            </div>

            {/* Student Attendance Section BELOW the Video Call (Zero hardcoded names) */}
            <div className="w-full bg-slate-800 p-4 border-t border-slate-700">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-700 gap-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-300">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>{currentLang === 'ar' ? 'حضور طلاب الصف المشاركين في الحصة:' : 'Student Attendance in This Live Class:'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {currentLang === 'ar' ? `${realAttendees.length} متصلون الآن` : `${realAttendees.length} Live Online`}
                  </span>

                  {/* Camera Toggle Button */}
                  <button
                    type="button"
                    onClick={toggleVideoTrack}
                    className={`p-2 rounded-xl transition cursor-pointer ${isVideoOn ? 'bg-slate-700 text-slate-200' : 'bg-rose-600 text-white'}`}
                    title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
                  >
                    {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>

                  {/* Mic Toggle Button */}
                  <button
                    type="button"
                    onClick={toggleAudioTrack}
                    className={`p-2 rounded-xl transition cursor-pointer ${isMicOn ? 'bg-slate-700 text-slate-200' : 'bg-rose-600 text-white'}`}
                    title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
                  >
                    {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Dynamic Real Attendees Grid */}
              {realAttendees.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 font-semibold">
                  {currentLang === 'ar' 
                    ? 'لا يوجد طلاب متصلون حالياً في هذه الحصة المباشرة. في انتظار انضمام الطلاب...'
                    : 'No students currently connected to this live room. Waiting for students to join...'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mt-3 text-xs">
                  {realAttendees.map((st) => (
                    <div key={st.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-700/60 border border-slate-600/40">
                      <span className="font-semibold text-slate-200 truncate">{st.name}</span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md">● Live</span>
                    </div>
                  ))}
                </div>
              )}
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
                <span>{currentLang === 'ar' ? 'رجوع' : 'Back'}</span>
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

                                          {/* CLICKABLE EDUCATOR START LIVE SESSION */}
              {isEducator && (
                <button
                  type="button"
                  onClick={() => {
                    // Require an authenticated educator account
                    if (!isSignedIn) {
                      alert(
                        currentLang === 'ar'
                          ? 'يرجى تسجيل الدخول بحساب الأستاذ.'
                          : 'Please sign in with your educator account.'
                      );
                      return;
                    }

                    // Only activated, non-expired accounts may open a class
                    if (!isPaidAndActivated) {
                      alert(
                        currentLang === 'ar'
                          ? 'حسابك غير مفعل أو انتهت صلاحيته. يرجى مراجعة الإدارة لتفعيل حسابك.'
                          : 'Your educator account is not activated or has expired. Please contact the Director to activate your account.'
                      );
                      return;
                    }

                    // Open the educator's own class directly.
                    // Do not require the educator to appear in liveSessionsList.
                    const mySession = {
                      id:
                        registeredAccount?.registeredSessionId ||
                        `educator_${registeredAccount?.id || cleanText(educatorName)}_${selectedGrade.id}`,
                      grade: selectedGrade.name[currentLang],
                      educatorName,
                      subject: educatorSubject,
                      isLive: true,
                    };

                    handleEducatorOpenRoom(mySession);
                  }}
                  className="w-full text-start bg-slate-900 hover:bg-indigo-950 text-white rounded-3xl p-5 border-2 border-slate-800 hover:border-indigo-400 flex flex-wrap items-center justify-between gap-3 shadow-md transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                      <h3 className="font-black text-base">
                        {currentLang === 'ar'
                          ? 'بدء الحصة المباشرة'
                          : 'Start Live Session'}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-300 mt-2">
                      {currentLang === 'ar'
                        ? `اضغط هنا لفتح صفك المباشر وبدء البث في مادة (${educatorSubject})`
                        : `Click here to open your live classroom and start broadcasting ${educatorSubject}.`}
                    </p>
                  </div>

                  <span className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-5 py-3 rounded-xl shadow-md">
                    <Video className="w-4 h-4" />
                    {currentLang === 'ar' ? 'افتح الحصة الآن' : 'OPEN LIVE CLASS'}
                  </span>
                </button>
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
