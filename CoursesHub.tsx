import React, { useState } from 'react';
import { Language, GradeLevelDef, LiveSessionInfo } from '../types';
import { translations } from '../translations';
import { LEBANESE_GRADE_LEVELS } from '../data/mockGradesAndSessions';
import { GradeSessionsView } from './GradeSessionsView';
import { 
  Clock, 
  Video, 
  GraduationCap,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface CoursesHubProps {
  currentLang: Language;
  onBookTeacher: (teacher: any, slot: string) => void;
  onSelectQuestionForBooking: (question: any, exam: any) => void;
  onStartPractice: (exam: any) => void;
  onEnterLiveClassroom?: (session?: LiveSessionInfo) => void;
}

interface SmilingStudent {
  name: string;
  ageGrade: string;
  avatar: string;
  quote: { en: string; fr: string; ar: string };
  badge: string;
  badgeColor: string;
}

export const CoursesHub: React.FC<CoursesHubProps> = ({
  currentLang,
  onEnterLiveClassroom
}) => {
  const t = translations[currentLang];
  const isRTL = currentLang === 'ar';

  // State for navigating to the new screen when clicking any grade
  const [activeGradeForSessions, setActiveGradeForSessions] = useState<GradeLevelDef | null>(null);

  // Fictitious mixed Lebanese student profiles with photorealistic human faces (no real personal info, no visible prices)
  const smilingStudents: SmilingStudent[] = [
    {
      name: 'Maya Bitar',
      ageGrade: 'Age 10 • Grade 5 (Elementary)',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      badge: 'Math & Sciences A+',
      badgeColor: 'bg-emerald-500 text-white',
      quote: {
        en: 'I used to find fractions tricky, now my teacher explains them with clear drawings!',
        fr: 'J\'avais du mal avec les fractions, maintenant tout m\'est expliqué par le dessin !',
        ar: 'كنت أجد صعوبة في الكسور والمسائل، والآن يشرحها لي الأستاذ بالرسم وبكل بساطة!'
      }
    },
    {
      name: 'Jad Frem',
      ageGrade: 'Age 15 • Grade 9 (Brevet EB9)',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
      badge: 'Mention Très Bien Candidate',
      badgeColor: 'bg-indigo-600 text-white',
      quote: {
        en: 'Practicing past official Brevet exams with the Barème gave me total confidence.',
        fr: 'S\'entraîner sur les annales de Brevet avec le barème m\'a donné une confiance absolue.',
        ar: 'حل نماذج البريفيه الرسمية مع سلّم التصحيح منحني ثقة تامة قبل الامتحانات.'
      }
    },
    {
      name: 'Rayan Kassir',
      ageGrade: 'Age 17 • Grade 12 (Baccalauréat SG)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      badge: 'Engineering Track',
      badgeColor: 'bg-purple-600 text-white',
      quote: {
        en: 'Complex numbers and RLC circuits finally clicked after interactive live sessions!',
        fr: 'Les nombres complexes et les circuits RLC sont enfin devenus clairs en direct !',
        ar: 'الأعداد العقدية ودارات الفيزياء أصبحت سهلة وممتعة بعد الحصص التفاعلية!'
      }
    },
    {
      name: 'Sanaa Sheatou',
      ageGrade: 'Age 16 • Grade 11 (Secondary)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      badge: 'Honor Roll Student',
      badgeColor: 'bg-amber-500 text-slate-950',
      quote: {
        en: 'Daily agenda homework follow-up and solving exercises step-by-step gave me full mastery.',
        fr: 'Le suivi quotidien des devoirs et la résolution guidée m\'ont apporté une grande aisance.',
        ar: 'المتابعة اليومية لحل الفروض والتمارين خطوة بخطوة منحتني استيعاباً ممتازاً لجميع المواد.'
      }
    }
  ];

  // If a grade level is clicked, render the new dedicated screen with 20 Stored Sessions & Live Session
  if (activeGradeForSessions) {
    return (
      <GradeSessionsView
        currentLang={currentLang}
        selectedGrade={activeGradeForSessions}
        onBack={() => setActiveGradeForSessions(null)}
        onEnterLiveClassroom={() => onEnterLiveClassroom ? onEnterLiveClassroom() : undefined}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Educational Colored Top Banner with Schedule Notice inside under hero subtitle, followed by smiling students */}
      <div className="rounded-3xl bg-linear-to-r from-amber-500 via-emerald-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 text-center relative z-10">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {t.heroTitle}
            </h1>
            <p className="text-slate-100 text-sm sm:text-base font-semibold max-w-2xl mx-auto">
              {t.heroSubtitle}
            </p>
          </div>

          {/* DAILY SCHEDULE NOTICE INSIDE HERO BANNER UNDER TITLE/SUBTITLE AS REQUESTED */}
          <div className="bg-slate-950/40 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 max-w-2xl mx-auto shadow-lg space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                {currentLang === 'ar' ? 'مواعيد الحصص المباشرة الرسمية' : 'Official Live Sessions Schedule'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-sm sm:text-base font-black text-white">
              {currentLang === 'ar' 
                ? 'تبدأ الحصص المباشرة يومياً من الساعة 4:00 عصراً حتى 8:00 مساءً (بتوقيت بيروت)' 
                : currentLang === 'fr'
                ? 'Les cours en direct se déroulent quotidiennement de 16h00 à 20h00 (Heure de Beyrouth)'
                : 'Live Sessions run daily from 4:00 PM to 8:00 PM (Beirut Time)'}
            </p>
          </div>

          {/* Smiling Students Gallery with Real Human Faces */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1 text-start">
            {smilingStudents.map(student => (
              <div
                key={student.name}
                className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 shadow-md flex items-center gap-3 hover:bg-white/20 transition group"
              >
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-13 h-13 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="font-black text-sm text-white truncate">
                      {student.name}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-amber-200 block truncate">
                    {student.ageGrade}
                  </span>
                  <p className="text-[11px] text-slate-100 italic line-clamp-2 leading-tight">
                    "{student.quote[currentLang]}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ALL GRADES SELECTOR: Clicking ANY grade enters the new screen with 20 Stored Sessions and Live Session */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-start">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
              <span>{currentLang === 'ar' ? 'اختر الصف الأكاديمي' : 'Select Grade Level'}</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {currentLang === 'ar'
                ? 'انقر على أي صف للانتقال فوراً إلى شاشة الحصص المخزنة (20 حصة) والحصص المباشرة'
                : 'Click any grade level to access its 20 stored exercise sessions and live interactive stream'}
            </p>
          </div>
        </div>

        {/* Complete Lebanese Grade List (Preschool, Elementary EB1-6, Middle EB7-9, Secondary 10-12) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {LEBANESE_GRADE_LEVELS.map(grade => {
            return (
              <button
                key={grade.id}
                onClick={() => setActiveGradeForSessions(grade)}
                className="p-3 rounded-2xl text-start transition-all cursor-pointer border bg-white hover:bg-indigo-50/70 hover:border-indigo-400 text-slate-800 shadow-2xs hover:shadow-md hover:scale-[1.02] group"
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition">
                    {grade.badge}
                  </span>
                  {isRTL ? (
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-0.5 transition-transform" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </div>
                <h4 className="font-black text-xs leading-tight line-clamp-1 group-hover:text-indigo-900">
                  {grade.name[currentLang]}
                </h4>
                <span className="text-[9px] block mt-1 font-semibold text-slate-400 group-hover:text-indigo-600">
                  {grade.cycle[currentLang]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Button: Enter Live Video Session directly */}
        <div className="pt-4 flex justify-center">
          <button
            onClick={() => onEnterLiveClassroom ? onEnterLiveClassroom() : null}
            className="w-full sm:w-auto min-w-[280px] bg-linear-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-95 text-white font-black text-base px-8 py-4 rounded-2xl transition shadow-xl flex items-center justify-center gap-3 cursor-pointer border border-indigo-500"
          >
            <Video className="w-5 h-5 text-white" />
            <span>
              {currentLang === 'ar' ? 'دخول الحصة المباشرة بالفيديو' : 'Join Live Video Session'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
