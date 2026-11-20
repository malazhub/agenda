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
} from 'lucide-react';

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    const saved = window.localStorage.getItem('agenda-language');
    return saved === 'ar' || saved === 'en' || saved === 'fr' || saved === 'es' || saved === 'it' ? saved : 'en';
  });
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
  const [registeredAccount, setRegisteredAccount] = useState<CloudflareAccount | null>(null);
  const [chatOnlyMode, setChatOnlyMode] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [ownerAccount, setOwnerAccount] = useState<CloudflareAccount | null>(null);
  const [ownerToken, setOwnerToken] = useState('');
  const [ownerSchoolMode, setOwnerSchoolMode] = useState(false);
  const [ownerGuestClassroom, setOwnerGuestClassroom] = useState(false);
  const [ownerDirectorLoginMode, setOwnerDirectorLoginMode] = useState(false);
  const [directorSetupToken, setDirectorSetupToken] = useState(() => new URLSearchParams(window.location.search).get('directorSetup') || '');
  const [directorAccessToken, setDirectorAccessToken] = useState('');
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [activeSchoolId, setActiveSchoolId] = useState(() => new URLSearchParams(window.location.search).get('schoolId') || 'default-agenda-school');
  const schoolPathTitle = (() => {
    if (!new URLSearchParams(window.location.search).has('schoolId')) return '';
    const segment = window.location.pathname.split('/').filter(Boolean).pop() || '';
    try { return decodeURIComponent(segment).replace(/[-_]+/g, ' ').trim(); }
    catch { return segment.replace(/[-_]+/g, ' ').trim(); }
  })();
  const activeSchoolName = schools.find((school) => school.id === activeSchoolId)?.name ||
    (activeSchoolId === 'default-agenda-school' ? 'Agenda' : (schoolPathTitle || 'School'));
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
    window.localStorage.setItem('agenda-language', currentLang);
  }, [currentLang]);

  useEffect(() => {
    // Chrome's "Create a shortcut to this page" uses the live document title.
    // Keep it fixed to the product name regardless of the currently selected
    // school or its database display name (for example, "Agenda (malaz)").
    document.title = 'Agenda';
  }, []);

  // The active school belongs to this browser tab and comes from its own URL.
  // Directory refreshes are read-only with respect to that selection: another
  // user's login, this tab receiving focus, or the 30-second refresh must never
  // switch the tab back to Agenda or to whichever school happens to sort first.
  useEffect(() => {
    let active = true;
    const refreshSchoolDirectory = () => {
      void getSchools(activeSchoolId).then(({ schools: records }) => {
        if (!active) return;
        setSchools(Array.isArray(records) ? records : []);
      }).catch((error) => {
        if (active) console.error('Unable to refresh school branding.', error);
      });
    };

    refreshSchoolDirectory();
    const intervalId = window.setInterval(refreshSchoolDirectory, 30_000);
    window.addEventListener('focus', refreshSchoolDirectory);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshSchoolDirectory);
    };
  }, [activeSchoolId]);

  useEffect(() => {
    const storedOwnerToken = sessionStorage.getItem('agenda-owner-token');
    if (storedOwnerToken) { setOwnerToken(storedOwnerToken); void getCurrentAccount(storedOwnerToken).then(({account}) => setOwnerAccount(account)).catch(() => { sessionStorage.removeItem('agenda-owner-token'); setOwnerToken(''); }); }
    const storedToken = sessionStorage.getItem('agenda-session-token');
    const storedDirectorToken = sessionStorage.getItem('agenda-director-token');
    if (storedDirectorToken) setDirectorAccessToken(storedDirectorToken);
    if (storedToken) setSessionToken(storedToken);
    else if (storedDirectorToken) setSessionToken(storedDirectorToken);
  }, []);

  useEffect(() => {
    if (!sessionToken) return;
    let active = true;
    const refreshAccount = async () => {
      try {
        const { account, directorLink, schoolSwitchRequired, chatOnly } = await getCurrentAccount(sessionToken, activeSchoolId);
        if (!active) return;
        if (chatOnly) {
          setChatOnlyMode(true);
          setRegisteredAccount(account);
          setUserProfile((previous) => ({ ...previous, name: account.fullName, email: account.email, role: account.role === 'educator' ? 'teacher' : 'student' }));
          return;
        }
        setChatOnlyMode(false);
        if (account.role === 'owner') {
          setOwnerAccount(account);
          setOwnerToken(sessionToken);
          const ownerUrl = new URL('https://agenda.mycamp.workers.dev/');
          if (window.location.origin !== ownerUrl.origin || window.location.pathname !== '/' || window.location.search) {
            // The owner always uses the platform root. sessionStorage is shared
            // across paths on this origin, so the owner token survives this tab redirect.
            window.location.replace(ownerUrl.toString());
            return;
          }
          setActiveSchoolId('default-agenda-school');
          return;
        }
        if (account.role === 'director') {
          sessionStorage.setItem('agenda-director-token', sessionToken);
          sessionStorage.setItem('agenda-session-token', sessionToken);
          setDirectorAccessToken(sessionToken);
          if (directorLink && schoolSwitchRequired) {
            // Replace the currently open school (A) with the Director's own
            // school (B) in this same tab. The token survives same-origin
            // navigation because sessionStorage is origin-scoped.
            window.location.replace(directorLink);
            return;
          }
          setActiveSchoolId(account.schoolId);
          setRegisteredAccount(account);
          return;
        }
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
          sessionStorage.removeItem('agenda-director-token');
          setSessionToken('');
          setDirectorAccessToken('');
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
  }, [sessionToken, activeSchoolId]);

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleOwnerLogin = (account: CloudflareAccount, token: string) => {
    sessionStorage.setItem('agenda-owner-token', token);
    sessionStorage.removeItem('agenda-session-token');
    sessionStorage.removeItem('agenda-director-token');
    setSessionToken('');
    setDirectorAccessToken('');
    setRegisteredAccount(null);
    setOwnerAccount(account);
    setOwnerToken(token);
    setOwnerSchoolMode(false);
    setOwnerDirectorLoginMode(false);
    setIsClassroomActive(false);
    // Owner Control Center always belongs to the canonical Agenda root.
    // Replace this tab (rather than only editing history) so app state is
    // re-initialized for the owner context while the same-origin token survives.
    const ownerUrl = 'https://agenda.mycamp.workers.dev/';
    if (window.location.href !== ownerUrl) {
      window.location.replace(ownerUrl);
      return;
    }
    setActiveSchoolId('default-agenda-school');
    showToast(`${account.fullName}: ${currentLang === 'ar' ? 'تم تسجيل دخول المالك.' : 'Owner signed in successfully.'}`);
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

  const handleRegisterSuccess = (account: CloudflareAccount, token: string, chatOnly = false) => {
    if (account.role === 'owner') {
      handleOwnerLogin(account, token);
      return;
    }
    if (account.role === 'director') {
      sessionStorage.setItem('agenda-director-token', token);
      sessionStorage.setItem('agenda-session-token', token);
      setSessionToken(token);
      setDirectorAccessToken(token);
      setRegisteredAccount(account);
      showToast(`${account.fullName}: ${currentLang === 'ar' ? 'تم تسجيل دخول المدير.' : 'Director signed in successfully.'}`);
      return;
    }
    setChatOnlyMode(chatOnly);
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
    sessionStorage.removeItem('agenda-director-token');

    setSessionToken('');
    setChatOnlyMode(false);
    setDirectorAccessToken('');
    setDirectorSetupToken('');
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
        {chatOnlyMode ? (
          <section className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8 text-center shadow-sm">
            <h1 className="text-xl font-black text-slate-900">{currentLang === 'ar' ? 'حسابك بانتظار التفعيل' : currentLang === 'fr' ? 'Votre compte attend son activation' : currentLang === 'es' ? 'Tu cuenta está pendiente de activación' : currentLang === 'it' ? 'Il tuo account è in attesa di attivazione' : 'Your account is awaiting activation'}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-700">{currentLang === 'ar' ? 'يمكنك الآن مراسلة مؤسس المنصة ومتابعة الردود. ستُفتح جميع وظائف المدرسة بعد تفعيل حسابك.' : currentLang === 'fr' ? 'Vous pouvez écrire au fondateur de la plateforme et lire ses réponses. Les fonctions de votre établissement seront disponibles après activation.' : currentLang === 'es' ? 'Ahora puedes escribir al fundador de la plataforma y leer sus respuestas. Las funciones de tu escuela estarán disponibles cuando se active tu cuenta.' : currentLang === 'it' ? 'Ora puoi scrivere al fondatore della piattaforma e leggere le risposte. Le funzioni scolastiche saranno disponibili dopo l’attivazione.' : 'You can now message the platform founder and read replies. Your school features will become available after your account is activated.'}</p>
          </section>
        ) : directorSetupToken ? (
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
         ) : ownerAccount && ownerToken && ownerDirectorLoginMode ? (
          <CoursesHub
            currentLang={currentLang}
            registeredAccount={null}
            schoolId="default-agenda-school"
            sessionToken=""
            initialDirectorLogin
            onOwnerLogin={handleOwnerLogin}
            onDirectorRedirect={() => {
              sessionStorage.removeItem('agenda-owner-token');
              setOwnerAccount(null);
              setOwnerToken('');
              setOwnerDirectorLoginMode(false);
            }}
            onBackToOwner={() => setOwnerDirectorLoginMode(false)}
            onSchoolBrandChange={(schoolId, schoolName) => {
              setActiveSchoolId(schoolId);
              const nextUrl = new URL(window.location.href);
              nextUrl.searchParams.set('schoolId', schoolId);
              nextUrl.searchParams.delete('directorLogin');
              window.history.replaceState({}, '', nextUrl.toString());
              setSchools((current) => current.some((school) => school.id === schoolId)
                ? current.map((school) => school.id === schoolId ? { ...school, name: schoolName } : school)
                : [...current, { id: schoolId, name: schoolName }]);
            }}
            onRegisterSignOutCleanup={registerSignOutCleanup}
            onShowMessage={showToast}
            onBookTeacher={handleBookTeacherDirect}
            onSelectQuestionForBooking={handleSelectQuestionForBooking}
            onStartPractice={(exam) => setPracticeExam(exam)}
            onEnterLiveClassroom={() => setIsClassroomActive(true)}
          />
        ) : ownerAccount && ownerToken ? (
          ownerSchoolMode ? (
            <CoursesHub
              currentLang={currentLang}
              registeredAccount={null}
              schoolId={ownerAccount.schoolId || activeSchoolId}
              sessionToken=""
              ownerSchoolToken={ownerToken}
              initialGuestLiveRoom={ownerGuestClassroom}
              onBackToOwner={() => { setOwnerSchoolMode(false); setOwnerGuestClassroom(false); }}
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
              onDirectorSignIn={() => setOwnerDirectorLoginMode(true)}
              onEnterGuestClassroom={() => {
                setIsClassroomActive(false);
                setOwnerGuestClassroom(true);
                setOwnerSchoolMode(true);
              }}
              onManageMySchool={() => {
                setOwnerGuestClassroom(false);
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
            registeredAccount={registeredAccount}
            onOwnerLogin={handleOwnerLogin}
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
      <AIChatBot
        currentLang={currentLang}
        schoolId={activeSchoolId}
        schoolName={activeSchoolName}
        account={registeredAccount}
        sessionToken={sessionToken}
        chatOnlyMode={chatOnlyMode}
        isOwner={Boolean(ownerAccount)}
        ownerToken={ownerToken}
        onOpenSignIn={() => setIsRegisterOpen(true)}
      />
    </div>
  );
}
