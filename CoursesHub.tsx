import React, { useEffect, useState } from 'react';
import { Language, GradeLevelDef, LiveSessionInfo } from '../types';
import { translations } from '../translations';
import { LEBANESE_GRADE_LEVELS } from '../data/mockGradesAndSessions';
import { GradeSessionsView } from './GradeSessionsView';
import { DirectorSessionsPanel } from './DirectorSessionsPanel';
import { LiveBroadcastHost } from './LiveBroadcastHost';
import { 
  getDirectorAccounts, 
  getRegistrationSessions, 
  loginAccount, 
  setupLiveStream, 
  updateDirectorAccount,
  deleteDirectorAccount 
} from '../services/cloudflareApi';
import type { CloudflareAccount, LiveStreamSetup, RegistrationSession } from '../services/cloudflareApi';
import {
  Clock,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  User,
  Lock,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

interface CoursesHubProps {
  currentLang: Language;
  onBookTeacher: (teacher: any, slot: string) => void;
  onSelectQuestionForBooking: (question: any, exam: any) => void;
  onStartPractice: (exam: any) => void;
  onEnterLiveClassroom?: (session?: LiveSessionInfo) => void;
  onShowMessage: (message: string) => void;
  directorLoginRequest: number;
  registeredAccount: CloudflareAccount | null;
  sessionToken: string;
}

type DirectorRow = CloudflareAccount;

export const CoursesHub: React.FC<CoursesHubProps> = ({
  currentLang,
  directorLoginRequest,
  registeredAccount,
  sessionToken,
  onShowMessage,
  onEnterLiveClassroom,
}) => {
  const t = translations[currentLang];
  const isRTL = currentLang === 'ar';

  const [activeGradeForSessions, setActiveGradeForSessions] = useState<GradeLevelDef | null>(null);
  const [activeGradeTab, setActiveGradeTab] = useState<'stored' | 'live'>('stored');
  const [directorScreen, setDirectorScreen] = useState<'home' | 'login' | 'dashboard'>('home');
  const [directorForm, setDirectorForm] = useState({ username: '', password: '' });
  const [showDirectorPassword, setShowDirectorPassword] = useState(false);
  const [directorError, setDirectorError] = useState('');
  const [directorToken, setDirectorToken] = useState(() =>
    typeof window === 'undefined' ? '' : window.sessionStorage.getItem('agenda-director-token') || ''
  );
  const [studentRows, setStudentRows] = useState<DirectorRow[]>([]);
  const [educatorRows, setEducatorRows] = useState<DirectorRow[]>([]);
  const [registrationSessions, setRegistrationSessions] = useState<RegistrationSession[]>([]);
  const [directorLoading, setDirectorLoading] = useState(false);
  const [directorDataError, setDirectorDataError] = useState('');
  const [directorMessage, setDirectorMessage] = useState('');
  const [directorTab, setDirectorTab] = useState<'accounts' | 'sessions'>('accounts');
  const [streamSetup, setStreamSetup] = useState<LiveStreamSetup | null>(null);
  const [streamSetupError, setStreamSetupError] = useState('');
  const [streamSetupLoading, setStreamSetupLoading] = useState(false);

  useEffect(() => {
    if (directorLoginRequest > 0) setDirectorScreen('login');
  }, [directorLoginRequest]);

  const formatDate = (value: string | null) => {
    if (!value) return '—';
    const date = new Date(`${value.replace(' ', 'T').replace(/Z$/, '')}Z`);
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(currentLang).format(date);
  };

  const returnToMain = () => {
    sessionStorage.removeItem('agenda-director-token');
    setDirectorToken('');
    setStudentRows([]);
    setEducatorRows([]);
    setActiveGradeForSessions(null);
    setDirectorScreen('home');
  };

  useEffect(() => {
    if (directorScreen !== 'dashboard' || !directorToken) return;
    let active = true;
    setDirectorLoading(true);
    setDirectorDataError('');
    Promise.all([getDirectorAccounts(directorToken), getRegistrationSessions()])
      .then(([{ students, educators }, { sessions }]) => {
        if (!active) return;
        setStudentRows(students);
        setEducatorRows(educators);
        setRegistrationSessions(sessions);
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

  const updateAccount = async (account: DirectorRow, update: { activated?: boolean; paid?: boolean; renew?: boolean; password?: string; registeredSessionId?: string }) => {
    if (!directorToken) return;
    setDirectorDataError('');
    setDirectorMessage('');
    try {
      const { account: savedAccount } = await updateDirectorAccount(directorToken, account.id, update);
      const setRows = account.role === 'student' ? setStudentRows : setEducatorRows;
      setRows((rows) => rows.map((row) => row.id === savedAccount.id ? savedAccount : row));
      setDirectorMessage(update.password ? t.resetPassword : update.renew ? t.renewMonth : '');
    } catch (error) {
      setDirectorDataError(error instanceof Error ? error.message : 'Unable to save the account status.');
    }
  };

  // Permanent Delete: Calls Cloudflare Worker to delete the row from D1 database
  const deleteAccount = async (account: DirectorRow) => {
    const confirmMessage = currentLang === 'ar'
      ? `هل أنت متأكد من حذف حساب (${account.fullName}) نهائياً؟ سيتم مسح بياناته من Cloudflare للأبد.`
      : `Are you sure you want to permanently delete (${account.fullName})? All data will be removed from Cloudflare.`;

    if (!window.confirm(confirmMessage)) return;

    setDirectorDataError('');
    setDirectorMessage('');

    try {
      await deleteDirectorAccount(directorToken, account.id);

      const setRows = account.role === 'student' ? setStudentRows : setEducatorRows;
      setRows((rows) => rows.filter((row) => row.id !== account.id));

      setDirectorMessage(
        currentLang === 'ar'
          ? `تم حذف حساب (${account.fullName}) من Cloudflare نهائياً.`
          : `Account (${account.fullName}) was permanently deleted from Cloudflare.`
      );
    } catch (err) {
      setDirectorDataError(err instanceof Error ? err.message : 'Failed to delete account from Cloudflare.');
    }
  };

  const resetAccountPassword = (account: DirectorRow) => {
    const password = window.prompt(`${t.resetPassword} — ${account.username}`);
    if (password === null) return;
    if (!password || password.length > 1024) {
      setDirectorDataError(`${t.passwordLabel}: 1–1,024`);
      return;
    }
    void updateAccount(account, { password });
  };

  const handleStreamSetup = async () => {
    if (!directorToken) return;
    setStreamSetupLoading(true);
    setStreamSetupError('');
    try {
      setStreamSetup(await setupLiveStream(directorToken));
    } catch (error) {
      setStreamSetupError(error instanceof Error ? error.message : t.liveBroadcastSetupRequired);
    } finally {
      setStreamSetupLoading(false);
    }
  };

  // Restrict opening "Live Broadcast Room" to registered, active, and paid accounts only
  const openSharedLiveRoom = () => {
    // 1. Must be registered and signed in
    if (!registeredAccount || !sessionToken) {
      onShowMessage(
        currentLang === 'ar'
          ? 'يجب تسجيل الدخول أولاً للوصول إلى غرفة البث المباشر.'
          : currentLang === 'fr'
          ? 'Veuillez vous connecter pour accéder à la salle de diffusion.'
          : 'Please sign in to access the live broadcast room.'
      );
      return;
    }

    // 2. Must be paid and activated by Director
    const expiryTime = registeredAccount?.expiresAt
      ? Date.parse(`${registeredAccount.expiresAt.replace(' ', 'T').replace(/Z$/, '')}Z`)
      : null;
    const isExpired = expiryTime !== null && (!Number.isFinite(expiryTime) || expiryTime <= Date.now());

    if (!registeredAccount.activated || isExpired) {
      onShowMessage(
        currentLang === 'ar'
          ? 'غرفة البث المباشر متاحة فقط للحسابات المفعّلة والمدفوعة. يرجى انتظار تفعيل الحساب وتأكيد الدفع من الإدارة.'
          : currentLang === 'fr'
          ? 'Accès réservé aux comptes activés et payés. En attente de validation du paiement.'
          : 'Access restricted to active and paid accounts. Please wait for payment confirmation and Director activation.'
      );
      return;
    }

    // 3. User is registered, paid, and active -> open live room!
    const targetGrade = LEBANESE_GRADE_LEVELS.find((g) => {
      if (!registeredAccount?.gradeId) return false;
      const cleanAccGrade = registeredAccount.gradeId.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanGId = g.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanGName = g.name.en.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanGId === cleanAccGrade || cleanGName.includes(cleanAccGrade);
    }) || LEBANESE_GRADE_LEVELS[0];

    setActiveGradeTab('live');
    setActiveGradeForSessions(targetGrade);
  };

  const renderDirectorTable = (title: string, rows: DirectorRow[]) => (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <h3 className="px-4 py-3 text-sm font-black text-slate-900 bg-slate-100 border-b border-slate-200">
        {title} ({rows.length})
      </h3>
      <table className="min-w-full text-xs">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.fullNameLabel}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.usernameLabel}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.passwordLabel}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.emailLabel}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.phoneNumber}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{currentLang === 'ar' ? 'المدرسة / المادة' : currentLang === 'fr' ? 'École / matière' : 'School / subject'}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.registeredSessionLabel}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.joiningDate}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.expiryDate}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{currentLang === 'ar' ? 'مفعّل' : currentLang === 'fr' ? 'Activé' : 'Activated'}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{currentLang === 'ar' ? 'مدفوع' : currentLang === 'fr' ? 'Payé' : 'Paid'}</th>
            <th className="px-3 py-3 text-center font-black text-rose-700">{t.delete}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-200">
              <td className="px-3 py-3 font-semibold text-slate-800">{row.fullName}</td>
              <td className="px-3 py-3 text-slate-700">{row.username}</td>
              <td className="px-3 py-3 text-slate-700">
                <span aria-label={t.passwordNotStored}>••••••••</span>
                <button type="button" onClick={() => resetAccountPassword(row)} className="ms-2 text-indigo-700 underline cursor-pointer">{t.resetPassword}</button>
              </td>
              <td className="px-3 py-3 text-slate-700">{row.email}</td>
              <td className="px-3 py-3 text-slate-700">{row.phone || '—'}</td>
              <td className="px-3 py-3 text-slate-700">{row.schoolOrSubject || '—'}</td>
              <td className="px-3 py-3 text-slate-700">
                <select
                  aria-label={`${row.fullName} ${t.registeredSessionLabel}`}
                  value={row.registeredSessionId || ''}
                  onChange={(event) => void updateAccount(row, { registeredSessionId: event.target.value })}
                  className="max-w-56 rounded border border-slate-300 bg-white p-1.5 text-[10px]"
                >
                  <option value="">{t.registrationChooseSession}</option>
                  {registrationSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.gradeId.toUpperCase()} · {session.subject} — {session.title}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-3 text-slate-700">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3 text-slate-700">
                <div>{formatDate(row.expiresAt)}</div>
                <button type="button" onClick={() => void updateAccount(row, { renew: true })} className="mt-1 text-indigo-700 underline cursor-pointer">{t.renewMonth}</button>
              </td>
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
              <td className="px-3 py-3 text-center">
                <button
                  type="button"
                  onClick={() => void deleteAccount(row)}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 text-[11px] font-black transition cursor-pointer border border-rose-200 shadow-2xs"
                  title={t.delete}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.delete}</span>
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
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
        initialTab={activeGradeTab}
        registeredAccount={registeredAccount}
        sessionToken={sessionToken}
        onBack={() => {
          setActiveGradeForSessions(null);
          setActiveGradeTab('stored');
        }}
        onEnterLiveClassroom={onEnterLiveClassroom}
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
            onClick={returnToMain}
            className="text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
          >
            {t.backToMain}
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
                type={showDirectorPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={directorForm.password}
                onChange={e => setDirectorForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-indigo-600"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowDirectorPassword(!showDirectorPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title={showDirectorPassword ? 'Hide password' : 'Show password'}
              >
                {showDirectorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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
            onClick={returnToMain}
            className="text-slate-600 hover:text-slate-800 text-xs font-bold cursor-pointer"
          >
            {t.backToMain}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setDirectorTab('accounts')} className={`rounded-xl px-4 py-2 text-xs font-black cursor-pointer ${directorTab === 'accounts' ? 'bg-indigo-700 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
            {currentLang === 'ar' ? 'الحسابات' : currentLang === 'fr' ? 'Comptes' : 'Accounts'}
          </button>
          <button type="button" onClick={() => setDirectorTab('sessions')} className={`rounded-xl px-4 py-2 text-xs font-black cursor-pointer ${directorTab === 'sessions' ? 'bg-indigo-700 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
            {t.sessionsTab}
          </button>
        </div>

        <section className="rounded-2xl border border-rose-200 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-black text-slate-900">{t.liveBroadcast}</h3>
            <button type="button" onClick={() => void handleStreamSetup()} disabled={streamSetupLoading} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white disabled:opacity-60 cursor-pointer">
              {streamSetupLoading ? '…' : t.setupLiveBroadcast}
            </button>
          </div>
          {streamSetupError && <p role="alert" className="text-xs text-red-700">{streamSetupError}</p>}
          {streamSetup && (
            <div className="space-y-3 text-xs text-slate-700">
              <p>{t.liveWaiting}</p>
              <LiveBroadcastHost currentLang={currentLang} stream={streamSetup} directorToken={directorToken} />
            </div>
          )}
        </section>

        {directorDataError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {directorDataError}
          </div>
        )}
        {directorMessage && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
            {directorMessage}
          </div>
        )}
        {directorTab === 'sessions' && directorToken ? (
          <DirectorSessionsPanel currentLang={currentLang} token={directorToken} grades={LEBANESE_GRADE_LEVELS} />
        ) : directorLoading ? (
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
        <div className="max-w-6xl mx-auto items-center relative z-10">
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                {t.heroTitle}
              </h1>
              <p className="text-slate-100 text-sm sm:text-base font-semibold max-w-2xl mx-auto">
                {t.heroSubtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={openSharedLiveRoom}
              className="block w-full text-start bg-slate-950/40 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 max-w-2xl mx-auto shadow-lg space-y-1 cursor-pointer transition hover:bg-slate-950/55 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                {currentLang === 'ar' ? 'غرفة البث المباشر' : currentLang === 'fr' ? 'Salle de diffusion en direct' : 'Live broadcast room'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-sm sm:text-base font-black text-white">
              {currentLang === 'ar'
                ? 'افتح غرفة البث المباشر المشتركة لجميع الصفوف'
                : currentLang === 'fr'
                  ? 'Ouvrir la salle de diffusion commune à toutes les classes'
                  : 'Open the shared live room for all grades'}
            </p>
            </button>
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
                ? 'انقر على الصف لعرض موارده التعليمية وغرفة البث المباشر'
                : currentLang === 'fr'
                  ? 'Sélectionnez une classe pour consulter ses ressources et le direct'
                  : 'Select a grade to browse its learning resources and live room'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {LEBANESE_GRADE_LEVELS.map(grade => (
            <button
              key={grade.id}
              onClick={() => {
                setActiveGradeTab('stored');
                setActiveGradeForSessions(grade);
              }}
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
      </div>
    </div>
  );
};
