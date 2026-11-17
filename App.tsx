import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Language, 
  UserProfile, 
  OfficialExam, 
  ExamQuestion, 
  Teacher, 
  TutorBooking 
} from './types';
import { translations } from './translations';
import { MOCK_TEACHERS } from './data/mockTeachers';
import { getCurrentAccount, getSchools } from './services/cloudflareApi';
import type { CloudflareAccount, SchoolRecord } from './services/cloudflareApi';

import { Header } from './components/Header';
import { CoursesHub } from './components/CoursesHub';
import { VirtualClassroom } from './components/VirtualClassroom';
import { BookingModal } from './components/BookingModal';
import { RegisterModal } from './components/RegisterModal';
import { ArchiveSessionsModal } from './components/ArchiveSessionsModal';
import { ExamPracticeModal } from './components/ExamPracticeModal';
import { AIChatBot } from './components/AIChatBot';
import { OwnerDashboard } from './components/OwnerDashboard';
import { DirectorSetupPage } from './components/DirectorSetupPage';

import { 
  CheckCircle2, 
  Heart,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('ar');
  const [isClassroomActive, setIsClassroomActive] = useState(false);

  // User Profile: Student & Educator only
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'كريم منصور',
    email: 'karim.mansour@gmail.com',
    role: 'student',
    grade: 'BAC_SG',
    schoolSystem: 'Francophone',
    schoolName: 'Collège Notre-Dame de Jamhour',
    freeTrialsRemaining: 3, // silently applied under the hood
    completedSessions: 4,
    savedExamCount: 12,
    preferredLanguage: 'ar'
  });

  // Active bookings list
  const [bookings, setBookings] = useState<TutorBooking[]>([]);

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedTeacherForBooking, setSelectedTeacherForBooking] = useState<Teacher | undefined>(undefined);
  const [selectedQuestionForBooking, setSelectedQuestionForBooking] = useState<{ question: ExamQuestion; exam: OfficialExam } | undefined>(undefined);

  // Register Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [directorLoginRequest, setDirectorLoginRequest] = useState(0);
  const [registeredAccount, setRegisteredAccount] = useState<CloudflareAccount | null>(null);
  const [sessionToken, setSessionToken] = useState('');
  const [ownerAccount, setOwnerAccount] = useState<CloudflareAccount | null>(null);
  const [ownerToken, setOwnerToken] = useState('');
  const [ownerSchoolMode, setOwnerSchoolMode] = useState(false);
  const [directorSetupToken, setDirectorSetupToken] = useState(() => new URLSearchParams(window.location.search).get('directorSetup') || '');
  const [directorAccessToken, setDirectorAccessToken] = useState('');
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [activeSchoolId, setActiveSchoolId] = useState(() => new URLSearchParams(window.location.search).get('schoolId') || 'default-agenda-school');
  const activeSchoolName = schools.find((school) => school.id === activeSchoolId)?.name || '';
  const signOutCleanupRef = useRef<(() => Promise<void>) | null>(null);

const registerSignOutCleanup = useCallback(
  (cleanup: (() => Promise<void>) | null) => {
    signOutCleanupRef.current = cleanup;
  },
  []
);
  // Archive Sessions Modal State
  const [isArchiveSessionsOpen, setIsArchiveSessionsOpen] = useState(false);

  // Practice Exam Modal State
  const [practiceExam, setPracticeExam] = useState<OfficialExam | null>(null);

  // Notification Banner
  const [notification, setNotification] = useState<string | null>(null);

  const t = translations[currentLang];
  const isRTL = currentLang === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [currentLang, isRTL]);

  useEffect(() => {
    document.title = activeSchoolName || 'Agenda';
  }, [activeSchoolName]);

  useEffect(() => {
    let active = true;
    void getSchools(activeSchoolId).then(({ schools: records }) => {
      if (!active) return;
      setSchools(records);
      setActiveSchoolId(records[0]?.id || activeSchoolId);
    }).catch((error) => console.error('Unable to load schools.', error));
    return () => { active = false; };
  }, [activeSchoolId]);

  // Keep the public school title in sync when a Director changes it from another device.
  useEffect(() => {
    const refreshSchoolBrand = () => {
      void getSchools(activeSchoolId).then(({ schools: records }) => {
        setSchools(records);
        if (records[0]?.id) setActiveSchoolId(records[0].id);
      }).catch((error) => console.error('Unable to refresh school branding.', error));
    };
    const intervalId = window.setInterval(refreshSchoolBrand, 30_000);
    window.addEventListener('focus', refreshSchoolBrand);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshSchoolBrand);
    };
  }, [activeSchoolId]);

  useEffect(() => {
    const storedOwnerToken = sessionStorage.getItem('agenda-owner-token');
    if (storedOwnerToken) { setOwnerToken(storedOwnerToken); void getCurrentAccount(storedOwnerToken).then(({account}) => setOwnerAccount(account)).catch(() => { sessionStorage.removeItem('agenda-owner-token'); setOwnerToken(''); }); }
    const storedToken = sessionStorage.getItem('agenda-session-token');
    if (storedToken) setSessionToken(storedToken);
  }, []);

  useEffect(() => {
    if (!sessionToken) return;
    let active = true;
    const refreshAccount = async () => {
      try {
        const { account } = await getCurrentAccount(sessionToken);
        if (!active) return;
        if (account.role === 'owner') { setOwnerAccount(account); setOwnerToken(sessionToken); return; }
        setRegisteredAccount(account);
        setUserProfile((previous) => ({
          ...previous,
          name: account.fullName,
          email: account.email,
          role: account.role === 'educator' ? 'teacher' : 'student',
        }));
      } catch (error) {
        if (!active) return;
        if (error instanceof Error && error.message.includes('(401)')) {
          sessionStorage.removeItem('agenda-session-token');
          setSessionToken('');
          setRegisteredAccount(null);
        } else {
          console.error('Unable to refresh the signed-in account status.', error);
        }
      }
    };
    void refreshAccount();
    const intervalId = window.setInterval(() => void refreshAccount(), 30_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [sessionToken]);

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleSelectQuestionForBooking = (question: ExamQuestion, exam: OfficialExam) => {
    setSelectedQuestionForBooking({ question, exam });
    setSelectedTeacherForBooking(MOCK_TEACHERS[0]);
    setIsBookingOpen(true);
  };

  const handleBookTeacherDirect = (teacher: Teacher, slot: string) => {
    setSelectedTeacherForBooking(teacher);
    setSelectedQuestionForBooking(undefined);
    setIsBookingOpen(true);
  };

  const handleConfirmBooking = (newBooking: TutorBooking) => {
    setBookings(prev => [newBooking, ...prev]);

    // Silently deduct trial if available
    if (newBooking.isFreeTrial && userProfile.freeTrialsRemaining > 0) {
      setUserProfile(prev => ({
        ...prev,
        freeTrialsRemaining: prev.freeTrialsRemaining - 1
      }));
    }

    showToast(
      currentLang === 'ar'
        ? `تم تأكيد حجز الحصة بنجاح مع الأستاذ ${newBooking.teacherName}`
        : currentLang === 'fr'
          ? `Cours réservé avec succès auprès de ${newBooking.teacherName}`
          : currentLang === 'es'
            ? `Sesión reservada correctamente con ${newBooking.teacherName}`
            : currentLang === 'it'
              ? `Lezione prenotata correttamente con ${newBooking.teacherName}`
              : `Session booked successfully with ${newBooking.teacherName}`
    );

    // Launch classroom for booked session
    setIsClassroomActive(true);
  };

  const handleRegisterSuccess = (account: CloudflareAccount, token: string) => {
    const role = account.role === 'educator' ? 'teacher' : 'student';
    sessionStorage.setItem('agenda-session-token', token);
    setSessionToken(token);
    setRegisteredAccount(account);
    setUserProfile(prev => ({ ...prev, name: account.fullName, email: account.email, role }));
    showToast(`${account.fullName}: ${account.activated ? t.accountSignedIn : t.registrationPendingActivation}`);
  };

    const handleSignOut = async () => {
    // First leave the live classroom and clear its private chat.
    try {
      await signOutCleanupRef.current?.();
    } catch (error) {
      console.error(
        'Unable to clean up the classroom before signing out:',
        error
      );
    }

    // Only remove the account credentials after classroom cleanup.
    sessionStorage.removeItem('agenda-session-token');

    setSessionToken('');
    setRegisteredAccount(null);
    setOwnerAccount(null);
    setOwnerToken('');
    setOwnerSchoolMode(false);
    sessionStorage.removeItem('agenda-owner-token');

    setUserProfile({
      name: '',
      email: '',
      role: 'student',
      grade: 'BAC_SG',
      schoolSystem: 'Francophone',
      schoolName: '',
      freeTrialsRemaining: 3,
      completedSessions: 0,
      savedExamCount: 0,
      preferredLanguage: currentLang
    });

    setIsClassroomActive(false);

    showToast(
      currentLang === 'ar'
        ? 'تم تسجيل الخروج والعودة للشاشة الرئيسية'
        : currentLang === 'fr'
          ? 'Déconnexion réussie.'
          : currentLang === 'es'
            ? 'Sesión cerrada correctamente.'
            : currentLang === 'it'
              ? 'Disconnessione completata.'
              : 'Signed out successfully'
    );
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${isRTL ? 'font-[Cairo]' : 'font-[Plus_Jakarta_Sans]'}`}>
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 right-4 left-4 sm:left-auto z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-150 max-w-sm border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        activeTab="tutors"
        onTabChange={() => setIsClassroomActive(false)}
        userProfile={userProfile}
        onRoleChange={(role) => setUserProfile(prev => ({ ...prev, role }))}
        onOpenRegister={() => setIsRegisterOpen(true)}
        signedInName={ownerAccount?.fullName || registeredAccount?.fullName}
        isOwner={Boolean(ownerAccount)}
        onOpenOwner={() => setIsClassroomActive(false)}
        schoolName={activeSchoolName}
        schoolId={activeSchoolId}
        onOpenArchiveSessions={() => setIsArchiveSessionsOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content: Courses Hub or Live Classroom */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        {directorSetupToken ? (
          <DirectorSetupPage
            token={directorSetupToken}
            currentLang={currentLang}
            onComplete={(account, token) => {
              sessionStorage.setItem('agenda-director-token', token);
              sessionStorage.setItem('agenda-session-token', token);
              setDirectorAccessToken(token);
              setSessionToken(token);
              setRegisteredAccount(account);
              setDirectorSetupToken('');
              const nextUrl = new URL(window.location.href);
              nextUrl.searchParams.delete('directorSetup');
              window.history.replaceState({}, '', nextUrl.toString());
              showToast(currentLang === 'ar' ? 'تم تفعيل حساب المدير.' : 'Director account activated.');
            }}
          />
        ) : ownerAccount && ownerToken ? (
          ownerSchoolMode ? (
            <CoursesHub
              currentLang={currentLang}
              directorLoginRequest={0}
              registeredAccount={null}
              schoolId={ownerAccount.schoolId || activeSchoolId}
              sessionToken=""
              ownerSchoolToken={ownerToken}
              onBackToOwner={() => setOwnerSchoolMode(false)}
              onOwnerTokenRefresh={(token) => {
                sessionStorage.setItem('agenda-owner-token', token);
                setOwnerToken(token);
              }}
              onSchoolBrandChange={(schoolId, schoolName) => {
                setActiveSchoolId(schoolId);
                const nextUrl = new URL(window.location.href);
                nextUrl.searchParams.set('schoolId', schoolId);
                window.history.replaceState({}, '', nextUrl.toString());
                setSchools((current) => {
                  const exists = current.some((school) => school.id === schoolId);
                  return exists
                    ? current.map((school) => school.id === schoolId ? { ...school, name: schoolName } : school)
                    : [...current, { id: schoolId, name: schoolName }].sort((a, b) => a.name.localeCompare(b.name));
                });
              }}
              onRegisterSignOutCleanup={registerSignOutCleanup}
              onShowMessage={showToast}
              onBookTeacher={handleBookTeacherDirect}
              onSelectQuestionForBooking={handleSelectQuestionForBooking}
              onStartPractice={(exam) => setPracticeExam(exam)}
              onEnterLiveClassroom={(liveSession) => {
                if (liveSession) {
                  const matchTeacher = MOCK_TEACHERS.find(t => t.name.includes(liveSession.teacherName.replace('Prof. ', '').replace('Dr. ', '').replace('Mme. ', ''))) || MOCK_TEACHERS[0];
                  setSelectedTeacherForBooking(matchTeacher);
                }
                setIsClassroomActive(true);
              }}
            />
          ) : (
            <OwnerDashboard
              currentLang={currentLang}
              token={ownerToken}
              onSignOut={handleSignOut}
              onManageMySchool={() => {
                setIsClassroomActive(false);
                setOwnerSchoolMode(true);
              }}
            />
          )
        ) : isClassroomActive ? (
          <VirtualClassroom
            currentLang={currentLang}
            teacher={selectedTeacherForBooking || MOCK_TEACHERS[0]}
            onLeaveClassroom={() => setIsClassroomActive(false)}
            currentUserRole={registeredAccount?.role === 'educator' ? 'educator' : 'student'}
            currentUserName={registeredAccount?.fullName || userProfile.name}
          />
        ) : (
                    <CoursesHub
            currentLang={currentLang}
            directorLoginRequest={directorLoginRequest}
            registeredAccount={registeredAccount}
            onOwnerLogin={(account, token) => { sessionStorage.setItem('agenda-owner-token', token); sessionStorage.removeItem('agenda-session-token'); setSessionToken(''); setOwnerAccount(account); setOwnerToken(token); setRegisteredAccount(null); }}
            schoolId={registeredAccount?.schoolId || activeSchoolId}
            sessionToken={sessionToken}
            directorAccessToken={directorAccessToken}
            onSchoolBrandChange={(schoolId, schoolName) => {
              setActiveSchoolId(schoolId);
              const nextUrl = new URL(window.location.href);
              nextUrl.searchParams.set('schoolId', schoolId);
              window.history.replaceState({}, '', nextUrl.toString());
              setSchools((current) => {
                const exists = current.some((school) => school.id === schoolId);
                return exists
                  ? current.map((school) => school.id === schoolId ? { ...school, name: schoolName } : school)
                  : [...current, { id: schoolId, name: schoolName }].sort((a, b) => a.name.localeCompare(b.name));
              });
            }}
            onRegisterSignOutCleanup={registerSignOutCleanup}
            
            onShowMessage={showToast}
            onBookTeacher={handleBookTeacherDirect}
            onSelectQuestionForBooking={handleSelectQuestionForBooking}
            onStartPractice={(exam) => setPracticeExam(exam)}
            onEnterLiveClassroom={(liveSession) => {
              if (liveSession) {
                const matchTeacher = MOCK_TEACHERS.find(t => t.name.includes(liveSession.teacherName.replace('Prof. ', '').replace('Dr. ', '').replace('Mme. ', ''))) || MOCK_TEACHERS[0];
                setSelectedTeacherForBooking(matchTeacher);
              }
              setIsClassroomActive(true);
            }}
          />
        )}
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        currentLang={currentLang}
        initialTeacher={selectedTeacherForBooking}
        initialQuestion={selectedQuestionForBooking}
        freeTrialsRemaining={userProfile.freeTrialsRemaining}
        onConfirmBooking={handleConfirmBooking}
      />

      {/* Register Modal */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        currentLang={currentLang}
        schoolId={activeSchoolId}
        onRegisterSuccess={handleRegisterSuccess}
      />

      {/* Archive Sessions Modal */}
      <ArchiveSessionsModal
        isOpen={isArchiveSessionsOpen}
        onClose={() => setIsArchiveSessionsOpen(false)}
        currentLang={currentLang}
        bookings={bookings}
        onBookAgain={(teacherId) => {
          const matchTeacher = MOCK_TEACHERS.find(t => t.id === teacherId) || MOCK_TEACHERS[0];
          setSelectedTeacherForBooking(matchTeacher);
          setIsBookingOpen(true);
        }}
      />

      {/* Practice Exam Simulator Modal */}
      {practiceExam && (
        <ExamPracticeModal
          exam={practiceExam}
          currentLang={currentLang}
          onClose={() => setPracticeExam(null)}
          onBookTutorReview={() => {
            setPracticeExam(null);
            setSelectedTeacherForBooking(MOCK_TEACHERS[0]);
            setIsBookingOpen(true);
          }}
        />
      )}

      {/* Clean, Colorful Footer without payment badges */}
      <footer className="bg-linear-to-b from-slate-900 to-indigo-950 text-white mt-16 pt-8 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-linear-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                A
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white block">
                  {activeSchoolName || 'Agenda'}
                </span>
                <p className="text-xs text-slate-300 font-medium">
                  {t.heroTitle}
                </p>
              </div>
            </div>
            <button
                type="button"
                onClick={() => {
                  setIsClassroomActive(false);
                  setDirectorLoginRequest((request) => request + 1);
                }}
                className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-start transition hover:bg-white/10"
              >
                <ShieldCheck className="h-5 w-5 shrink-0 text-amber-300" />
                <span>
                  <span className="block text-sm font-black text-white">
                    {currentLang === 'ar' ? 'المدير' : currentLang === 'fr' ? 'Directeur' : currentLang === 'es' ? 'Director' : currentLang === 'it' ? 'Direttore' : 'Director'}
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-300">
                    {currentLang === 'ar' ? 'تسجيل الدخول وإدارة المحتوى' : currentLang === 'fr' ? 'Connexion et gestion du contenu' : currentLang === 'es' ? 'Iniciar sesión y gestionar el contenido' : currentLang === 'it' ? 'Accedi e gestisci i contenuti' : 'Sign in and manage content'}
                  </span>
                </span>
              </button>
          </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <span>{currentLang === 'ar' ? 'صُنع للطلاب والمعلمين بكل' : currentLang === 'fr' ? 'Conçu pour les élèves et les éducateurs avec' : currentLang === 'es' ? 'Creado para estudiantes y educadores con' : currentLang === 'it' ? 'Creato per studenti ed educatori con' : 'Made for students & educators with'}</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            </div>
            <div>
              © {activeSchoolName || 'Agenda'}. {currentLang === 'ar' ? 'تعليم ودروس معتمدة وتحضير للامتحانات الرسمية.' : currentLang === 'fr' ? 'Éducation, cours certifiés et préparation aux examens officiels.' : currentLang === 'es' ? 'Educación, tutorías certificadas y preparación para exámenes oficiales.' : currentLang === 'it' ? 'Istruzione, lezioni certificate e preparazione agli esami ufficiali.' : 'Education. Certified Tutoring & Official Exam Preparation.'}
            </div>
          </div>
        </div>
      </footer>

      {/* AI Assistant Chatbot: Auto responds about pricing, agenda, live sessions, and saved issues */}
      <AIChatBot currentLang={currentLang} schoolId={activeSchoolId} schoolName={activeSchoolName} />
    </div>
  );
}
