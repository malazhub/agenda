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

  // Expiration calculation & verification
  const expiryTime = registeredAccount?.expiresAt
    ? Date.parse(`${registeredAccount.expiresAt.replace(' ', 'T').replace(/Z$/, '')}Z`)
    : null;
  const accountExpired = expiryTime !== null && (!Number.isFinite(expiryTime) || expiryTime <= Date.now());
  const isSignedIn = Boolean(registeredAccount && sessionToken);
  const isPaidAndActivated = Boolean(registeredAccount?.activated && !accountExpired);

  // Role detection
  const isEducator = registeredAccount?.role === 'educator' || localStorage.getItem('registered_account_role') === 'educator';
  const educatorName = registeredAccount?.fullName || localStorage.getItem('registered_educator_name') || 'Prof. Educator';
  const educatorSubject = registeredAccount?.schoolOrSubject || 'Academic Subject';
  const myRegisteredEducator = localStorage.getItem('registered_educator_name') || '';

  // In-call conference state
  const [inLiveConference, setInLiveConference] = useState(false);
  const [activeCallSession, setActiveCallSession] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45-minute countdown timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
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

  // Educator authorization check
  const handleEducatorOpenRoom = (session: any) => {
    if (!isSignedIn) {
      alert(currentLang === 'ar' ? 'يجب تسجيل الدخول كأستاذ لفتح البث المباشر.' : 'Please sign in with your educator account to open the live session.');
      return;
    }
    if (registeredAccount?.role !== 'educator') {
      alert(currentLang === 'ar' ? 'هذه الخاصية مخصصة للأساتذة المسجلين فقط.' : 'Only registered educators can open this live room.');
      return;
    }
    if (!isPaidAndActivated) {
      alert(currentLang === 'ar' ? 'حسابك بانتظار تفعيل الإدارة وتأكيد الدفع.' : 'Your educator account is pending Director activation and payment confirmation.');
      return;
    }
    startLiveCall(session);
  };

  // Student authorization check (Paid, activated, and signed with this particular educator)
  const handleStudentJoinRoom = (session: any) => {
    // 1. Must be signed in
    if (!isSignedIn) {
      alert(
        currentLang === 'ar'
          ? 'لا يمكنك الدخول! يجب تسجيل الدخول بحساب مسجل ومفعّل للانضمام إلى البث المباشر.'
          : 'Access Denied: You must sign in with a registered account to join this live session.'
      );
      return;
    }

    // 2. Must be paid and activated by Director
    if (!isPaidAndActivated) {
      alert(
        currentLang === 'ar'
          ? 'لا يمكنك الانضمام! حسابك بانتظار تأكيد الدفع وتفعيل الإدارة.'
          : 'Access Denied: Your account is pending payment confirmation and Director activation.'
      );
      return;
    }

    // 3. Must be a student
    if (registeredAccount?.role !== 'student') {
      alert(
        currentLang === 'ar'
          ? 'أنت مسجل كأستاذ وليس كطالب لهذا الصف.'
          : 'You are signed in as an educator, not an enrolled student.'
      );
      return;
    }

    // 4. Must match the particular educator selected during registration
    const assignedEducator = myRegisteredEducator || registeredAccount?.schoolOrSubject || '';
    const isSignedForThisEducator = assignedEducator &&
      session.educatorName.trim().toLowerCase() === assignedEducator.trim().toLowerCase();

    if (!isSignedForThisEducator && assignedEducator) {
      alert(
        currentLang === 'ar'
          ? `لا يمكنك الانضمام! أنت مسجل مع الأستاذ (${assignedEducator}). لا يحق لك دخول صف أستاذ آخر.`
          : `Access Denied: You are registered with ${assignedEducator}. You cannot join another educator's room.`
      );
      return;
    }

    // All registration & payment validations passed -> join conference!
    startLiveCall(session);
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
