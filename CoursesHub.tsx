import React, { useEffect, useState } from 'react';
import { Language, GradeLevelDef, LiveSessionInfo } from '../types';
import { translations } from '../translations';
import { LEBANESE_GRADE_LEVELS } from '../data/mockGradesAndSessions';
import { GradeSessionsView } from './GradeSessionsView';
import { DirectorSessionsPanel } from './DirectorSessionsPanel';
import { LiveVideoPlayer } from './LiveVideoPlayer';
import { 
  getDirectorAccounts,
  getDirectorProfile,
  getRegistrationSessions,
  loginAccount,
  updateDirectorProfile,
  updateDirectorAccount,
  deleteDirectorAccount,
  getDirectorLiveStream,
} from '../services/cloudflareApi';
import type { CloudflareAccount, RegistrationSession, StoredSessionRecord, LiveStreamStatus } from '../services/cloudflareApi';
import {
  Clock,
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
  schoolId: string;
  sessionToken: string;
  onSchoolBrandChange: (schoolId: string, schoolName: string) => void;
  onRegisterSignOutCleanup?: (
    cleanup: (() => Promise<void>) | null
  ) => void;
}

type DirectorRow = CloudflareAccount;

export const CoursesHub: React.FC<CoursesHubProps> = ({
  currentLang,
  directorLoginRequest,
  registeredAccount,
  schoolId,
  sessionToken,
  onSchoolBrandChange,
  onShowMessage,
  onEnterLiveClassroom,
  onRegisterSignOutCleanup,
}) => {
  const t = translations[currentLang];

    const [activeGradeForSessions, setActiveGradeForSessions] = useState<GradeLevelDef | null>(null);
  const [activeGradeTab, setActiveGradeTab] = useState<'stored' | 'live'>('stored');
  const [autoOpenLiveClassroom, setAutoOpenLiveClassroom] = useState(false);
  const [directorScreen, setDirectorScreen] = useState<'home' | 'login' | 'dashboard'>('home');
  const [directorForm, setDirectorForm] = useState({ username: '', password: '' });
  const [showDirectorPassword, setShowDirectorPassword] = useState(false);
  const [directorError, setDirectorError] = useState('');
  const [directorToken, setDirectorToken] = useState(() =>
    typeof window === 'undefined' ? '' : window.sessionStorage.getItem('agenda-director-token') || ''
  );
  const [directorSchoolId, setDirectorSchoolId] = useState('');
  const [settingsSchoolName, setSettingsSchoolName] = useState('');
  const [settingsUsername, setSettingsUsername] = useState('');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [studentRows, setStudentRows] = useState<DirectorRow[]>([]);
  const [educatorRows, setEducatorRows] = useState<DirectorRow[]>([]);
  const [registrationSessions, setRegistrationSessions] = useState<RegistrationSession[]>([]);
  const [directorLoading, setDirectorLoading] = useState(false);
  const [directorDataError, setDirectorDataError] = useState('');
  const [directorMessage, setDirectorMessage] = useState('');
  const [directorTab, setDirectorTab] = useState<'accounts' | 'sessions'>('accounts');
  const [monitorSession, setMonitorSession] = useState<StoredSessionRecord | null>(null);
  const [monitorStream, setMonitorStream] = useState<LiveStreamStatus | null>(null);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorError, setMonitorError] = useState('');

    useEffect(() => {
    if (directorLoginRequest > 0) {
      setDirectorScreen('login');
    }
  }, [directorLoginRequest]);

  useEffect(() => {
    if (!directorToken) {
      setDirectorSchoolId('');
      return;
    }
    let active = true;
    getDirectorProfile(directorToken)
      .then(({ profile }) => {
        if (!active) return;
        setDirectorSchoolId(profile.schoolId);
        setSettingsSchoolName(profile.schoolName);
        setSettingsUsername(profile.username);
        onSchoolBrandChange(profile.schoolId, profile.schoolName);
      })
      .catch((profileError) => {
        if (active) setDirectorDataError(profileError instanceof Error ? profileError.message : 'Unable to load Director school profile.');
      });
    return () => { active = false; };
  }, [directorToken]);

  // Once a visitor signs in, load the grade assigned to that account.
  useEffect(() => {
    if (
      !activeGradeForSessions ||
      !registeredAccount?.gradeId
    ) {
      return;
    }

    const accountGrade = registeredAccount.gradeId
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const matchingGrade = LEBANESE_GRADE_LEVELS.find((grade) => {
      const gradeId = grade.id
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      const gradeName = grade.name.en
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      return (
        Boolean(accountGrade) &&
        (
          gradeId === accountGrade ||
          gradeName.includes(accountGrade)
        )
      );
    });

    if (
      matchingGrade &&
      matchingGrade.id !== activeGradeForSessions.id
    ) {
      setActiveGradeForSessions(matchingGrade);
    }
  }, [
    registeredAccount?.gradeId,
    activeGradeForSessions?.id
  ]);

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
    if (directorScreen !== 'dashboard' || !directorToken || !directorSchoolId) return;
    let active = true;
    setDirectorLoading(true);
    setDirectorDataError('');
    Promise.all([getDirectorAccounts(directorToken), getRegistrationSessions(directorSchoolId)])
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
  }, [directorScreen, directorToken, directorSchoolId]);

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

  const handleMonitorSession = async (session: StoredSessionRecord) => {
    if (!directorToken) return;
    setMonitorLoading(true);
    setMonitorError('');
    setMonitorSession(session);
    setMonitorStream(null);
    try {
      const stream = await getDirectorLiveStream(directorToken, session.id);
      setMonitorStream(stream);
    } catch (error) {
      setMonitorError(error instanceof Error ? error.message : 'Unable to open this classroom for monitoring.');
    } finally {
      setMonitorLoading(false);
    }
  };

  const handleSaveDirectorSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!directorToken) return;
    setSettingsSaving(true);
    setDirectorDataError('');
    setDirectorMessage('');
    try {
      const input = {
        schoolName: settingsSchoolName.trim(),
        username: settingsUsername.trim(),
        ...(settingsPassword ? { password: settingsPassword } : {}),
      };
      const { profile, token } = await updateDirectorProfile(directorToken, input);
      sessionStorage.setItem('agenda-director-token', token);
      setDirectorToken(token);
      setDirectorSchoolId(profile.schoolId);
      setSettingsSchoolName(profile.schoolName);
      setSettingsUsername(profile.username);
      setSettingsPassword('');
      onSchoolBrandChange(profile.schoolId, profile.schoolName);
      setDirectorMessage(
        currentLang === 'ar'
          ? 'تم حفظ اسم المدرسة وبيانات المدير وتحديث اسم المنصة.'
          : currentLang === 'fr'
            ? 'Le nom de l\u2019établissement et les identifiants du directeur ont été enregistrés.'
            : currentLang === 'es'
              ? 'Se guardaron el nombre de la escuela y las credenciales del Director. Se actualizó el encabezado.'
              : currentLang === 'it'
                ? 'Il nome della scuola e le credenziali del Direttore sono stati salvati. L\u2019intestazione è stata aggiornata.'
                : 'School name and Director credentials saved. The main header is updated.'
      );
    } catch (error) {
      setDirectorDataError(error instanceof Error ? error.message : 'Unable to save Director settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  
const updateAccount = async (
  account: DirectorRow,
    update: {
    activated?: boolean;
    paid?: boolean;
    renew?: boolean;
    password?: string;
    registeredSessionId?: string;
    educatorId?: string;
  }
) => {
  if (!directorToken) return;

  setDirectorDataError('');
  setDirectorMessage('');

  try {
    const { account: savedAccount } =
      await updateDirectorAccount(
        directorToken,
        account.id,
        update
      );

    const setRows =
      account.role === 'student'
        ? setStudentRows
        : setEducatorRows;

    setRows((rows) =>
      rows.map((row) =>
        row.id === savedAccount.id ? savedAccount : row
      )
    );

    // Reload the room list because assigning an educator
    // may have created a new educator-specific classroom.
    if (typeof update.registeredSessionId === 'string') {
      const { sessions } = await getRegistrationSessions(directorSchoolId);
      setRegistrationSessions(sessions);
    }

    setDirectorMessage(
      update.password
        ? t.resetPassword
        : update.renew
          ? t.renewMonth
          : ''
    );
  } catch (error) {
    setDirectorDataError(
      error instanceof Error
        ? error.message
        : 'Unable to save the account status.'
    );
  }
};


  // Permanent Delete: Calls Cloudflare Worker to delete the row from D1 database
  const deleteAccount = async (account: DirectorRow) => {
    const confirmMessage = currentLang === 'ar'
      ? `هل أنت متأكد من حذف حساب (${account.fullName}) نهائياً؟ سيتم مسح بياناته من Cloudflare للأبد.`
      : currentLang === 'fr'
        ? `Voulez-vous vraiment supprimer définitivement le compte de ${account.fullName} ? Toutes ses données seront supprimées de Cloudflare.`
        : currentLang === 'es'
          ? `¿Seguro que deseas eliminar permanentemente la cuenta de ${account.fullName}? Se borrarán todos sus datos de Cloudflare.`
          : currentLang === 'it'
            ? `Vuoi eliminare definitivamente l\u2019account di ${account.fullName}? Tutti i suoi dati saranno rimossi da Cloudflare.`
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
          : currentLang === 'fr'
            ? `Le compte de ${account.fullName} a été définitivement supprimé de Cloudflare.`
            : currentLang === 'es'
              ? `La cuenta de ${account.fullName} se eliminó permanentemente de Cloudflare.`
              : currentLang === 'it'
                ? `L\u2019account di ${account.fullName} è stato eliminato definitivamente da Cloudflare.`
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

        // Open Broadcast Room for both signed-in users and guests.
  const openSharedLiveRoom = () => {
    const accountGrade = registeredAccount?.gradeId
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '') || '';

    const targetGrade =
      LEBANESE_GRADE_LEVELS.find((grade) => {
        const gradeId = grade.id
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');

        const gradeName = grade.name.en
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');

        return (
          Boolean(accountGrade) &&
          (
            gradeId === accountGrade ||
            gradeName.includes(accountGrade)
          )
        );
      }) || LEBANESE_GRADE_LEVELS[0];

    // Guests open directly on Live Sessions.
    // Signed-in users retain Learning Resources as their first tab.
    setActiveGradeTab(
      registeredAccount && sessionToken
        ? 'stored'
        : 'live'
    );

    setAutoOpenLiveClassroom(false);
    setActiveGradeForSessions(targetGrade);
  };

    const renderDirectorTable = (     title: string,     rows: DirectorRow[],     showEducatorColumn = false   ) => (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <h3 className="px-4 py-3 text-sm font-black text-slate-900 bg-slate-100 border-b border-slate-200">
        {title} ({rows.length})
      </h3>
      <table className="min-w-full text-xs">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.fullNameLabel}</th>
                        {showEducatorColumn && (
              <th className="px-3 py-3 text-left font-black text-slate-700">
                {currentLang === 'ar' ? 'المعلّم' : currentLang === 'fr' ? 'Éducateur' : currentLang === 'es' ? 'Educador' : currentLang === 'it' ? 'Educatore' : 'Educator'}
              </th>
            )}
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.usernameLabel}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.passwordLabel}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.emailLabel}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.phoneNumber}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{currentLang === 'ar' ? 'المدرسة / المادة' : currentLang === 'fr' ? 'Établissement / matière' : currentLang === 'es' ? 'Escuela / materia' : currentLang === 'it' ? 'Scuola / materia' : 'School / subject'}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.registeredSessionLabel}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.joiningDate}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{t.expiryDate}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{currentLang === 'ar' ? 'مفعّل' : currentLang === 'fr' ? 'Activé' : currentLang === 'es' ? 'Activado' : currentLang === 'it' ? 'Attivato' : 'Activated'}</th>
            <th className="px-3 py-3 text-left font-black text-slate-700">{currentLang === 'ar' ? 'مدفوع' : currentLang === 'fr' ? 'Payé' : currentLang === 'es' ? 'Pagado' : currentLang === 'it' ? 'Pagato' : 'Paid'}</th>
            <th className="px-3 py-3 text-center font-black text-rose-700">{currentLang === 'ar' ? 'حذف' : currentLang === 'fr' ? 'Supprimer' : currentLang === 'es' ? 'Eliminar' : currentLang === 'it' ? 'Elimina' : 'Delete'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-200">
              <td className="px-3 py-3 font-semibold text-slate-800">{row.fullName}</td>
                            {showEducatorColumn && (
                <td className="px-3 py-3 text-slate-700">
                  <select
  aria-label={`${row.fullName} educator`}
  value={
    educatorRows.find(
      (educator) =>
        educator.registeredSessionId === row.registeredSessionId &&
        Boolean(educator.registeredSessionId)
    )?.id || '__assignment_not_found__'
  }
  onChange={(event) =>
    void updateAccount(row, {
      educatorId: event.target.value
    })
  }
  className="min-w-40 max-w-56 rounded border border-slate-300 bg-white p-2 text-xs"
>
  {!educatorRows.some(
    (educator) =>
      educator.registeredSessionId === row.registeredSessionId &&
      Boolean(educator.registeredSessionId)
  ) && (
    <option value="__assignment_not_found__" disabled>
      {currentLang === 'ar' ? 'لم يتم العثور على المعلّم المسجّل' : currentLang === 'fr' ? 'Éducateur inscrit introuvable' : currentLang === 'es' ? 'No se encontró el educador registrado' : currentLang === 'it' ? 'Educatore registrato non trovato' : 'Registered educator not found'}
    </option>
  )}

  {educatorRows.map((educator) => (
    <option
      key={educator.id}
      value={educator.id}
      disabled={!educator.registeredSessionId}
    >
      {educator.fullName}
      {!educator.registeredSessionId
        ? ' — no classroom assigned'
        : ''}
    </option>
  ))}
</select>
                </td>
              )}
              <td className="px-3 py-3 text-slate-700">{row.username}</td>
              <td className="px-3 py-3 text-slate-700">
                <span aria-label={t.passwordNotStored}>••••••••</span>
                <button type="button" onClick={() => resetAccountPassword(row)} className="ms-2 text-indigo-700 underline cursor-pointer">{t.resetPassword}</button>
              </td>
              <td className="px-3 py-3 text-slate-700">{row.email}</td>
              <td className="px-3 py-3 text-slate-700">{row.phone || '—'}</td>
              <td className="px-3 py-3 text-slate-700">{row.schoolOrSubject || '—'}</td>
              
<td className="px-3 py-3 text-slate-700">
  <div className="flex flex-col items-start gap-2">
    <select
      aria-label={`${row.fullName} ${t.registeredSessionLabel}`}
      value={row.registeredSessionId || ''}
      onChange={(event) =>
        void updateAccount(row, {
          registeredSessionId: event.target.value
        })
      }
      className="max-w-64 rounded border border-slate-300 bg-white p-1.5 text-[10px]"
    >
      <option value="">
        {t.registrationChooseSession}
      </option>

      {registrationSessions.map((session) => (
        <option key={session.id} value={session.id}>
          {session.gradeId.toUpperCase()}
          {' · '}
          {session.subject}
          {' · '}
          {session.teacherName || 'Unassigned lesson'}
          {' · '}
          {session.title}
        </option>
      ))}
    </select>

    {row.role === 'educator' && row.registeredSessionId && (
      <button
        type="button"
        onClick={() =>
          void updateAccount(row, {
            registeredSessionId: row.registeredSessionId!
          })
        }
        className="text-[10px] font-bold text-indigo-700 underline"
      >
        {currentLang === 'ar' ? 'فصل الصف' : currentLang === 'fr' ? 'Dissocier la classe' : currentLang === 'es' ? 'Desvincular aula' : currentLang === 'it' ? 'Scollega aula' : 'Separate classroom'}
      </button>
    )}
  </div>
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
                  title={currentLang === 'ar' ? 'حذف' : currentLang === 'fr' ? 'Supprimer' : currentLang === 'es' ? 'Eliminar' : currentLang === 'it' ? 'Elimina' : 'Delete'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{currentLang === 'ar' ? 'حذف' : currentLang === 'fr' ? 'Supprimer' : currentLang === 'es' ? 'Eliminar' : currentLang === 'it' ? 'Elimina' : 'Delete'}</span>
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
                            <td                 colSpan={showEducatorColumn ? 13 : 12}                 className="px-4 py-8 text-center text-slate-500"               >
                {currentLang === 'ar' ? 'لا توجد تسجيلات بعد.' : currentLang === 'fr' ? 'Aucune inscription pour le moment.' : currentLang === 'es' ? 'Todavía no hay registros.' : currentLang === 'it' ? 'Non ci sono ancora registrazioni.' : 'No registrations yet.'}
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
        schoolId={schoolId}
        initialTab={activeGradeTab}
        autoOpenLiveClassroom={autoOpenLiveClassroom}
        registeredAccount={registeredAccount}
        sessionToken={sessionToken}
        onShowMessage={onShowMessage}
        onRegisterSignOutCleanup={onRegisterSignOutCleanup}
        onBack={() => {
          setActiveGradeForSessions(null);
          setActiveGradeTab('stored');
          setAutoOpenLiveClassroom(false);
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
                {currentLang === 'ar' ? 'دخول المدير' : currentLang === 'fr' ? 'Connexion du Directeur' : currentLang === 'es' ? 'Acceso del Director' : currentLang === 'it' ? 'Accesso Direttore' : 'Director Login'}
              </h2>
              <p className="text-xs text-slate-500">
                {currentLang === 'ar' ? 'لوحة التحكم الداخلية' : currentLang === 'fr' ? 'Panneau de contrôle interne' : currentLang === 'es' ? 'Panel de control interno' : currentLang === 'it' ? 'Pannello di controllo interno' : 'Internal control panel'}
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
              {t.usernameLabel}
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
              {t.passwordLabel}
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
            {currentLang === 'ar' ? 'دخول المدير' : currentLang === 'fr' ? 'Connexion Directeur' : currentLang === 'es' ? 'Iniciar sesión como Director' : currentLang === 'it' ? 'Accedi come Direttore' : 'Login as Director'}
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
                {currentLang === 'ar' ? 'لوحة المدير' : currentLang === 'fr' ? 'Tableau de bord du Directeur' : currentLang === 'es' ? 'Panel del Director' : currentLang === 'it' ? 'Dashboard del Direttore' : 'Director Dashboard'}
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
            {currentLang === 'ar' ? 'الحسابات' : currentLang === 'fr' ? 'Comptes' : currentLang === 'es' ? 'Cuentas' : currentLang === 'it' ? 'Account' : 'Accounts'}
          </button>
          <button type="button" onClick={() => setDirectorTab('sessions')} className={`rounded-xl px-4 py-2 text-xs font-black cursor-pointer ${directorTab === 'sessions' ? 'bg-indigo-700 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
            {t.sessionsTab}
          </button>
        </div>

        <section className="rounded-2xl border border-indigo-200 bg-white p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {currentLang === 'ar' ? 'إعدادات المدرسة والمدير' : currentLang === 'fr' ? 'Établissement et compte Directeur' : currentLang === 'es' ? 'Configuración de escuela y Director' : currentLang === 'it' ? 'Impostazioni scuola e Direttore' : 'School & Director Settings'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {currentLang === 'ar'
                ? 'لكل مدير مدرسته وموظفوه وطلابه ودروسه وأسعاره المستقلة. يظهر اسم المدرسة المحفوظ في رأس المنصة.'
                : currentLang === 'fr'
                  ? 'Chaque Directeur possède son établissement, son équipe, ses élèves, ses leçons et ses tarifs. Le nom enregistré apparaît dans l\u2019en-tête.'
                  : 'Each Director has a separate school, staff, students, lessons, and pricing. The saved school name becomes this school\u2019s platform header.'}
            </p>
          </div>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveDirectorSettings}>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700">
                {currentLang === 'ar' ? 'اسم مدرستك' : currentLang === 'fr' ? 'Nom de votre établissement' : currentLang === 'es' ? 'Nombre de tu escuela' : currentLang === 'it' ? 'Nome della tua scuola' : 'Your school name'}
              </span>
              <input
                required
                maxLength={160}
                value={settingsSchoolName}
                onChange={(event) => setSettingsSchoolName(event.target.value)}
                placeholder="Example Agenda"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700">
                {currentLang === 'ar' ? 'اسم مستخدم المدير' : currentLang === 'fr' ? 'Nom d\u2019utilisateur du directeur' : currentLang === 'es' ? 'Usuario del Director' : currentLang === 'it' ? 'Nome utente del Direttore' : 'Director username'}
              </span>
              <input
                required
                minLength={3}
                maxLength={32}
                pattern="[a-zA-Z0-9._-]{3,32}"
                autoComplete="username"
                value={settingsUsername}
                onChange={(event) => setSettingsUsername(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700">
                {currentLang === 'ar' ? 'كلمة مرور جديدة (اختياري)' : currentLang === 'fr' ? 'Nouveau mot de passe (facultatif)' : currentLang === 'es' ? 'Nueva contraseña (opcional)' : currentLang === 'it' ? 'Nuova password (facoltativa)' : 'New password (optional)'}
              </span>
              <input
                type="password"
                maxLength={1024}
                autoComplete="new-password"
                value={settingsPassword}
                onChange={(event) => setSettingsPassword(event.target.value)}
                placeholder={currentLang === 'ar' ? 'اتركه فارغاً للإبقاء على الحالية' : currentLang === 'fr' ? 'Laisser vide pour conserver l\u2019actuel' : currentLang === 'es' ? 'Déjalo vacío para mantener la actual' : currentLang === 'it' ? 'Lascia vuoto per mantenere quella attuale' : 'Leave blank to keep current password'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
              />
            </label>
            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-slate-500">
                {currentLang === 'ar'
                  ? 'هذه المدرسة ملك لحساب المدير الحالي فقط. سيظهر اسمها في رابط المدرسة ورأس المنصة.'
                  : currentLang === 'fr'
                    ? 'Cet établissement appartient uniquement à ce compte Directeur. Son nom apparaît dans le lien et l\u2019en-tête.'
                    : currentLang === 'es'
                      ? 'Esta escuela pertenece únicamente a esta cuenta de Director. Su nombre aparece en el enlace y en la cabecera.'
                      : currentLang === 'it'
                        ? 'Questa scuola appartiene solo a questo account Direttore. Il nome appare nel link e nell\u2019intestazione.'
                        : 'This school belongs only to this Director account. Its name appears in the school link and platform header.'}
              </p>
              <button
                type="submit"
                disabled={settingsSaving || !settingsSchoolName.trim() || !settingsUsername.trim()}
                className="rounded-xl bg-indigo-700 px-5 py-3 text-xs font-black text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {settingsSaving
                  ? '…'
                  : currentLang === 'ar' ? 'حفظ الإعدادات' : currentLang === 'fr' ? 'Enregistrer' : currentLang === 'es' ? 'Guardar configuración' : currentLang === 'it' ? 'Salva impostazioni' : 'Save school & Director settings'}
              </button>
            </div>
          </form>
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
          <>
            <DirectorSessionsPanel
              currentLang={currentLang}
              token={directorToken}
              grades={LEBANESE_GRADE_LEVELS}
              onJoinSession={handleMonitorSession}
            />
            {monitorSession && (
              <section className="rounded-2xl border border-emerald-200 bg-white p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {currentLang === 'ar' ? 'مراقبة الصف' : currentLang === 'fr' ? 'Surveillance de la classe' : currentLang === 'es' ? 'Supervisión de la clase' : currentLang === 'it' ? 'Monitoraggio della classe' : 'Class monitoring'}
                    </h3>
                    <p className="text-xs text-slate-500">{monitorSession.gradeId.toUpperCase()} · {monitorSession.subject} · {monitorSession.title}</p>
                  </div>
                  <button type="button" onClick={() => { setMonitorSession(null); setMonitorStream(null); setMonitorError(''); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
                    {currentLang === 'ar' ? 'إغلاق' : currentLang === 'fr' ? 'Fermer' : currentLang === 'es' ? 'Cerrar' : currentLang === 'it' ? 'Chiudi' : 'Close'}
                  </button>
                </div>
                {monitorLoading ? <p className="py-8 text-center text-sm text-slate-500">…</p> : monitorError ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{monitorError}</p> : monitorStream ? (
                  <LiveVideoPlayer currentLang={currentLang} stream={monitorStream} sessionToken="" gradeId={monitorSession.id} directorToken={directorToken} />
                ) : null}
              </section>
            )}
          </>
        ) : directorLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            {currentLang === 'ar' ? 'جارٍ تحميل التسجيلات...' : currentLang === 'fr' ? 'Chargement des inscriptions...' : currentLang === 'es' ? 'Cargando registros...' : currentLang === 'it' ? 'Caricamento delle registrazioni...' : 'Loading registrations...'}
          </div>
        ) : (
          <div className="space-y-6">
                        {renderDirectorTable(
              currentLang === 'ar' ? 'الطلاب' : currentLang === 'fr' ? 'Étudiants' : 'Students',
              studentRows,
              true
            )}

            {renderDirectorTable(
              currentLang === 'ar' ? 'المعلمون' : currentLang === 'fr' ? 'Éducateurs' : 'Educators',
              educatorRows
            )}
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
              className="block w-full text-start bg-slate-950/40 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 max-w-2xl mx-auto shadow-lg cursor-pointer transition hover:bg-slate-950/55 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-amber-300 animate-pulse" />

                <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  {currentLang === 'ar'
                    ? 'غرفة البث'
                    : currentLang === 'fr'
                      ? 'Salle de diffusion'
                      : currentLang === 'es' ? 'Sala de emisión' : currentLang === 'it' ? 'Sala trasmissione' : 'Broadcast Room'}
                </span>

                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </button>
          </div>
        </div>
      </div>

      
    </div>
  );
};
