import React, { useState, useEffect } from 'react';
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
import { getCurrentAccount } from './services/cloudflareApi';
import type { CloudflareAccount } from './services/cloudflareApi';

import { Header } from './components/Header';
import { CoursesHub } from './components/CoursesHub';
import { VirtualClassroom } from './components/VirtualClassroom';
import { BookingModal } from './components/BookingModal';
import { RegisterModal } from './components/RegisterModal';
import { ArchiveSessionsModal } from './components/ArchiveSessionsModal';
import { ExamPracticeModal } from './components/ExamPracticeModal';
import { AIChatBot } from './components/AIChatBot';

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
        onOpenArchiveSessions={() => setIsArchiveSessionsOpen(true)}
      />

      {/* Main Content: Courses Hub or Live Classroom */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        {isClassroomActive ? (
          <VirtualClassroom
            currentLang={currentLang}
            teacher={selectedTeacherForBooking || MOCK_TEACHERS[0]}
            onLeaveClassroom={() => setIsClassroomActive(false)}
          />
        ) : (
          <CoursesHub
            currentLang={currentLang}
            directorLoginRequest={directorLoginRequest}
            registeredAccount={registeredAccount}
            sessionToken={sessionToken}
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
                  Agenda
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
                    {currentLang === 'ar' ? 'المدير' : currentLang === 'fr' ? 'Directeur' : 'Director'}
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-300">
                    {currentLang === 'ar' ? 'تسجيل الدخول وإدارة المحتوى' : currentLang === 'fr' ? 'Connexion et gestion du contenu' : 'Sign in and manage content'}
                  </span>
                </span>
              </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <span>Made for Lebanese students & educators with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            </div>
            <div>
              © {new Date().getFullYear()} Agenda. Certified K-12 Tutoring & Official Exam Preparation.
            </div>
          </div>
        </div>
      </footer>

      {/* AI Assistant Chatbot: Auto responds about pricing, agenda, live sessions, and saved issues */}
      <AIChatBot currentLang={currentLang} />
    </div>
  );
}
