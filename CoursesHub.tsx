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
  ChevronLeft,
  ShieldCheck,
  User,
  Lock
} from 'lucide-react';

interface CoursesHubProps {
  currentLang: Language;
  onBookTeacher: (teacher: any, slot: string) => void;
  onSelectQuestionForBooking: (question: any, exam: any) => void;
  onStartPractice: (exam: any) => void;
  onEnterLiveClassroom?: (session?: LiveSessionInfo) => void;
}

type DirectorRow = {
  name: string;
  joiningDate: string;
  expiryDate: string;
  activated: boolean;
  paid: boolean;
};

export const CoursesHub: React.FC<CoursesHubProps> = ({
  currentLang,
  onEnterLiveClassroom
}) => {
  const t = translations[currentLang];
  const isRTL = currentLang === 'ar';

  const [activeGradeForSessions, setActiveGradeForSessions] = useState<GradeLevelDef | null>(null);
  const [directorScreen, setDirectorScreen] = useState<'home' | 'login' | 'dashboard'>('home');
  const [directorForm, setDirectorForm] = useState({ username: '', password: '' });
  const [directorError, setDirectorError] = useState('');

  const [studentRows, setStudentRows] = useState<DirectorRow[]>([
    { name: 'Karim Mansour', joiningDate: '2026-10-01', expiryDate: '2027-01-31', activated: true, paid: true },
    { name: 'Sanaa Karam', joiningDate: '2026-09-15', expiryDate: '2026-12-15', activated: true, paid: false },
    { name: 'Rami El Feghali', joiningDate: '2026-07-11', expiryDate: '2026-11-30', activated: false, paid: false }
  ]);

  const [educatorRows, setEducatorRows] = useState<DirectorRow[]>([
    { name: 'Jad Khoury', joiningDate: '2026-10-02', expiryDate: '2027-02-15', activated: true, paid: true },
    { name: 'Nour Haddad', joiningDate: '2026-09-20', expiryDate: '2027-01-20', activated: false, paid: false },
    { name: 'Charbel Daou', joiningDate: '2026-07-15', expiryDate: '2026-12-14', activated: true, paid: true }
  ]);

  const handleDirectorLogin = () => {
    if (
      directorForm.username.trim() === 'malaz' &&
      directorForm.password === 'mjagenda1971'
    ) {
      setDirectorError('');
      setDirectorScreen('dashboard');
      return;
    }

    setDirectorError(
      currentLang === 'ar'
        ? 'اسم المستخدم أو كلمة المرور غير صحيح'
        : currentLang === 'fr'
        ? 'Nom d’utilisateur ou mot de passe incorrect'
        : 'Incorrect username or password'
    );
  };

  const toggleStudentRow = (index: number) => {
    setStudentRows(prev =>
      prev.map((row, i) =>
        i === index ? { ...row, activated: !row.activated } : row
      )
    );
  };

  const toggleEducatorRow = (index: number) => {
    setEducatorRows(prev =>
      prev.map((row, i) =>
        i === index ? { ...row, activated: !row.activated } : row
      )
    );
  };

  const toggleStudentPaid = (index: number) => {
    setStudentRows(prev =>
      prev.map((row, i) =>
        i === index ? { ...row, paid: !row.paid } : row
      )
    );
  };

  const toggleEducatorPaid = (index: number) => {
    setEducatorRows(prev =>
      prev.map((row, i) =>
        i === index ? { ...row, paid: !row.paid } : row
      )
    );
  };

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

  if (directorScreen === 'login') {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {currentLang === 'ar' ? 'دخول المدير' : currentLang === 'fr' ? 'Connexion directeur' : 'Director Login'}
              </h2>
              <p className="text-xs text-slate-500">
                {currentLang === 'ar' ? 'لوحة التحكم الداخلية' : currentLang === 'fr' ? 'Panneau de contrôle interne' : 'Internal control panel'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setDirectorScreen('home')}
            className="text-slate-500 hover:text-slate-800 text-xs font-bold"
          >
            {currentLang === 'ar' ? 'رجوع' : currentLang === 'fr' ? 'Retour' : 'Back'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              {currentLang === 'ar' ? 'اسم المستخدم' : currentLang === 'fr' ? 'Nom d’utilisateur' : 'Username'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                value={directorForm.username}
                onChange={e => setDirectorForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-indigo-600"
                placeholder="malaz"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              {currentLang === 'ar' ? 'كلمة المرور' : currentLang === 'fr' ? 'Mot de passe' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={directorForm.password}
                onChange={e => setDirectorForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-indigo-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          {directorError && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold px-3 py-2">
              {directorError}
            </div>
          )}

          <button
            onClick={handleDirectorLogin}
            className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-black px-4 py-3 rounded-2xl transition cursor-pointer"
          >
            {currentLang === 'ar' ? 'دخول المدير' : currentLang === 'fr' ? 'Se connecter' : 'Login as Director'}
          </button>
        </div>
      </div>
    );
  }

  if (directorScreen === 'dashboard') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {currentLang === 'ar' ? 'لوحة المدير' : currentLang === 'fr' ? 'Tableau directeur' : 'Director Dashboard'}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setDirectorScreen('home')}
            className="text-slate-600 hover:text-slate-800 text-xs font-bold"
          >
            {currentLang === 'ar' ? 'العودة' : currentLang === 'fr' ? 'Retour' : 'Back'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <h3 className="px-4 py-3 text-sm font-black text-slate-900 bg-slate-100 border-b border-slate-200">
              {currentLang === 'ar' ? 'الطلاب' : currentLang === 'fr' ? 'Étudiants' : 'Students'}
            </h3>
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-3 text-left font-black text-slate-700">Name</th>
                  <th className="px-3 py-3 text-left font-black text-slate-700">Joining date</th>
                  <th className="px-3 py-3 text-left font-black text-slate-700">Expiry date</th>
                  <th className="px-3 py-3 text-left font-black text-slate-700">Activated</th>
                  <th className="px-3 py-3 text-left font-black text-slate-700">Paid</th>
                </tr>
              </thead>
              <tbody>
                {studentRows.map((row, index) => (
                  <tr key={index} className="border-t border-slate-200">
                    <td className="px-3 py-3 font-semibold text-slate-800">{row.name}</td>
                    <td className="px-3 py-3 text-slate-700">{row.joiningDate}</td>
                    <td className="px-3 py-3 text-slate-700">{row.expiryDate}</td>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={row.activated}
                        onChange={() => toggleStudentRow(index)}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={row.paid}
                        onChange={() => toggleStudentPaid(index)}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <h3 className="px-4 py-3 text-sm font-black text-slate-900 bg-slate-100 border-b border-slate-200">
              {currentLang === 'ar' ? 'المعلمون' : currentLang === 'fr' ? 'Éducateurs' : 'Educators'}
            </h3>
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-3 text-left font-black text-slate-700">Name</th>
                  <th className="px-3 py-3 text-left font-black text-slate-700">Joining date</th>
                  <th className="px-3 py-3 text-left font-black text-slate-700">Expiry date</th>
                  <th className="px-3 py-3 text-left font-black text-slate-700">Activated</th>
                  <th className="px-3 py-3 text-left font-black text-slate-700">Paid</th>
                </tr>
              </thead>
              <tbody>
                {educatorRows.map((row, index) => (
                  <tr key={index} className="border-t border-slate-200">
                    <td className="px-3 py-3 font-semibold text-slate-800">{row.name}</td>
                    <td className="px-3 py-3 text-slate-700">{row.joiningDate}</td>
                    <td className="px-3 py-3 text-slate-700">{row.expiryDate}</td>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={row.activated}
                        onChange={() => toggleEducatorRow(index)}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={row.paid}
                        onChange={() => toggleEducatorPaid(index)}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
        </div>
      </div>

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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {LEBANESE_GRADE_LEVELS.map(grade => (
            <button
              key={grade.id}
              onClick={() => setActiveGradeForSessions(grade)}
              className="p-3 rounded-2xl text-start transition-all cursor-pointer border bg-white hover:bg-indigo-50/70 hover:border-indigo-400 text-slate-800 shadow-2xs hover:shadow-md hover:shadow-indigo-200"
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
          ))}
        </div>

        <div className="mt-4">
          <button
            onClick={() => setDirectorScreen('login')}
            className="w-full bg-gradient-to-r from-indigo-700 to-blue-700 hover:from-indigo-800 hover:to-blue-800 text-white font-black px-4 py-3 rounded-2xl shadow-sm transition cursor-pointer"
          >
            <span className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>{currentLang === 'ar' ? 'المدير' : currentLang === 'fr' ? 'Directeur' : 'Director'}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
