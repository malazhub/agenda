import React, { useEffect, useState } from 'react';
import { Language, GradeLevelDef, LiveSessionInfo } from '../types';
import { translations } from '../translations';
import { LEBANESE_GRADE_LEVELS } from '../data/mockGradesAndSessions';
import { GradeSessionsView } from './GradeSessionsView';
import { getDirectorAccounts, loginAccount, updateDirectorAccount } from '../services/cloudflareApi';
import type { CloudflareAccount } from '../services/cloudflareApi';
import {
  Clock,
  GraduationCap,
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

type DirectorRow = CloudflareAccount;

export const CoursesHub: React.FC<CoursesHubProps> = ({
  currentLang
}) => {
  const t = translations[currentLang];
  const isRTL = currentLang === 'ar';

  const [activeGradeForSessions, setActiveGradeForSessions] = useState<GradeLevelDef | null>(null);
  const [directorScreen, setDirectorScreen] = useState<'home' | 'login' | 'dashboard'>('home');
  const [directorForm, setDirectorForm] = useState({ username: '', password: '' });
  const [directorError, setDirectorError] = useState('');
  const [directorToken, setDirectorToken] = useState(() =>
    typeof window === 'undefined' ? '' : window.sessionStorage.getItem('agenda-director-token') || ''
  );
  const [studentRows, setStudentRows] = useState<DirectorRow[]>([]);
  const [educatorRows, setEducatorRows] = useState<DirectorRow[]>([]);
  const [directorLoading, setDirectorLoading] = useState(false);
  const [directorDataError, setDirectorDataError] = useState('');

  useEffect(() => {
    if (directorScreen !== 'dashboard' || !directorToken) return;
    let active = true;
    setDirectorLoading(true);
    setDirectorDataError('');
    getDirectorAccounts(directorToken)
      .then(({ students, educators }) => {
        if (!active) return;
        setStudentRows(students);
        setEducatorRows(educators);
      })
      .catch((error) => {
        if (active) setDirectorDataError(error instanceof Error ? error.message : 'Unable to load registrations.');
      })
      .finally(() => {
        if (active) setDirectorLoading(false);
      });
    return () => {
      active = false;
    };
  }, [directorScreen, directorToken]);

  const handleDirectorLogin = async () => {
    setDirectorError('');
    try {
      const { account, token } = await loginAccount(directorForm.username, directorForm.password);
      if (account.role !== 'director') {
        throw new Error('This account does not have Director access.');
      }
      sessionStorage.setItem('agenda-director-token', token);
      setDirectorToken(token);
      setDirectorScreen('dashboard');
      setDirectorForm({ username: '', password: '' });
    } catch (error) {
      setDirectorError(error instanceof Error ? error.message : 'Unable to sign in.');
    }
  };

  const updateAccount = async (account: DirectorRow, update: { activated?: boolean; paid?: boolean }) => {
    if (!directorToken) return;
    setDirectorDataError('');
    try {
      const { account: savedAccount } = await updateDirectorAccount(directorToken, account.id, update);
      const setRows = account.role === 'student' ? setStudentRows : setEducatorRows;
      setRows((rows) => rows.map((row) => row.id === savedAccount.id ? savedAccount : row));
    } catch (error) {
      setDirectorDataError(error instanceof Error ? error.message : 'Unable to save the account status.');
    }
  };

  const renderDirectorTable = (title: string, rows: DirectorRow[]) => (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <h3 className="px-4 py-3 text-sm font-black text-slate-900 bg-slate-100 border-b border-slate-200">
        {title} ({rows.length})
      </h3>
      <table className="min-w-full text-xs">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-3 py-3 text-left font-black text-slate-700">{currentLang === 'ar' ? 'الاسم' : currentLang === 'fr' ? 'Nom' : 'Name'}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{currentLang === 'ar' ? 'اسم المستخدم' : currentLang === 'fr' ? 'Identifiant' : 'Username'}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">Email</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{currentLang === 'ar' ? 'المدرسة / المادة' : currentLang === 'fr' ? 'École / matière' : 'School / subject'}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{currentLang === 'ar' ? 'تاريخ التسجيل' : currentLang === 'fr' ? 'Inscription' : 'Joined'}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{currentLang === 'ar' ? 'تاريخ الانتهاء' : currentLang === 'fr' ? 'Expiration' : 'Expiry date'}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{currentLang === 'ar' ? 'مفعّل' : currentLang === 'fr' ? 'Activé' : 'Activated'}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{currentLang === 'ar' ? 'مدفوع' : currentLang === 'fr' ? 'Payé' : 'Paid'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-200">
              <td className="px-3 py-3 font-semibold text-slate-800">{row.fullName}</td>
              <td className="px-3 py-3 text-slate-700">{row.username}</td>
              <td className="px-3 py-3 text-slate-700">{row.email}</td>
              <td className="px-3 py-3 text-slate-700">{row.schoolOrSubject || '—'}</td>
              <td className="px-3 py-3 text-slate-700">{new Date(`${row.createdAt.replace(' ', 'T')}Z`).toLocaleDateString()}</td>
              <td className="px-3 py-3 text-slate-700">{row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : '—'}</td>
              <td className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={row.activated}
                  onChange={() => void updateAccount(row, { activated: !row.activated })}
                  aria-label={`${row.fullName} activated`}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </td>
              <td className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={row.paid}
                  onChange={() => void updateAccount(row, { paid: !row.paid })}
                  aria-label={`${row.fullName} paid`}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                {currentLang === 'ar' ? 'لا توجد تسجيلات بعد.' : currentLang === 'fr' ? 'Aucune inscription pour le moment.' : 'No registrations yet.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  if (activeGradeForSessions) {
    return (
      <GradeSessionsView
        currentLang={currentLang}
        selectedGrade={activeGradeForSessions}
        onBack={() => setActiveGradeForSessions(null)}
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

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleDirectorLogin();
          }}
        >
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              {currentLang === 'ar' ? 'اسم المستخدم' : currentLang === 'fr' ? 'Nom d’utilisateur' : 'Username'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                autoComplete="username"
                required
                value={directorForm.username}
                onChange={e => setDirectorForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-indigo-600"
                placeholder="username"
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
                autoComplete="current-password"
                required
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
            type="submit"
            className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-black px-4 py-3 rounded-2xl transition cursor-pointer"
          >
            {currentLang === 'ar' ? 'دخول المدير' : currentLang === 'fr' ? 'Se connecter' : 'Login as Director'}
          </button>
        </form>
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

        {directorDataError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {directorDataError}
          </div>
        )}
        {directorLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            {currentLang === 'ar' ? 'جارٍ تحميل التسجيلات...' : currentLang === 'fr' ? 'Chargement des inscriptions...' : 'Loading registrations...'}
          </div>
        ) : (
          <div className="space-y-6">
            {renderDirectorTable(currentLang === 'ar' ? 'الطلاب' : currentLang === 'fr' ? 'Étudiants' : 'Students', studentRows)}
            {renderDirectorTable(currentLang === 'ar' ? 'المعلمون' : currentLang === 'fr' ? 'Éducateurs' : 'Educators', educatorRows)}
          </div>
        )}
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
          <button
            type="button"
            onClick={() => setDirectorScreen('login')}
            className="min-h-24 p-3 rounded-2xl text-start transition-all cursor-pointer border border-indigo-200 bg-gradient-to-br from-indigo-700 to-blue-700 text-white shadow-sm hover:from-indigo-800 hover:to-blue-800 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white/15 text-white">
                {currentLang === 'ar' ? 'إدارة' : currentLang === 'fr' ? 'ADMIN' : 'ADMIN'}
              </span>
              <ShieldCheck className="w-4 h-4 text-white/80" />
            </div>
            <h4 className="font-black text-xs leading-tight">
              {currentLang === 'ar' ? 'المدير' : currentLang === 'fr' ? 'Directeur' : 'Director'}
            </h4>
            <span className="text-[9px] block mt-1 font-semibold text-indigo-100">
              {currentLang === 'ar' ? 'لوحة الإدارة' : currentLang === 'fr' ? 'Espace de gestion' : 'Management dashboard'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
