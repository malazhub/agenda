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
  updateDirectorProfile,
  getRegistrationSessions,
  loginAccount,
  updateDirectorAccount,
  deleteDirectorAccount,
  getDirectorLiveStream,
  getDirectorPayment,
  updateDirectorPayment,
} from '../services/cloudflareApi';
import type { CloudflareAccount, RegistrationSession, StoredSessionRecord, LiveStreamStatus, DirectorPaymentMethod } from '../services/cloudflareApi';
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
  onOwnerLogin?: (account: CloudflareAccount, token: string) => void;
  ownerSchoolToken?: string;
  onBackToOwner?: () => void;
  onOwnerTokenRefresh?: (token: string) => void;
  directorAccessToken?: string;
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
  onOwnerLogin,
  ownerSchoolToken,
  onBackToOwner,
  onOwnerTokenRefresh,
  directorAccessToken,
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
  const [directorSchoolName, setDirectorSchoolName] = useState('');
  const [directorUsername, setDirectorUsername] = useState('');
  const [directorPaymentMethod, setDirectorPaymentMethod] = useState<DirectorPaymentMethod>('unset');
  const [directorPaymentValue, setDirectorPaymentValue] = useState('');
  const [directorPaymentSaving, setDirectorPaymentSaving] = useState(false);
  const [schoolNameSaving, setSchoolNameSaving] = useState(false);
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
    if (!ownerSchoolToken) return;
    setDirectorToken(ownerSchoolToken);
    setDirectorScreen('dashboard');
  }, [ownerSchoolToken]);

  useEffect(() => {
    if (!directorAccessToken) return;
    sessionStorage.setItem('agenda-director-token', directorAccessToken);
    setDirectorToken(directorAccessToken);
    setDirectorScreen('dashboard');
  }, [directorAccessToken]);

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
        setDirectorSchoolName(profile.schoolName);
        setDirectorUsername(profile.username);
        onSchoolBrandChange(profile.schoolId, profile.schoolName);
      })
      .catch((profileError) => {
        if (active) setDirectorDataError(currentLang === 'ar' ? 'تعذر تحميل معلومات المدرسة.' : currentLang === 'fr' ? 'Impossible de charger les informations de l’établissement.' : currentLang === 'es' ? 'No se pudo cargar la información de la escuela.' : currentLang === 'it' ? 'Impossibile caricare le informazioni della scuola.' : profileError instanceof Error ? profileError.message : 'Unable to load Director school profile.');
      });
    return () => { active = false; };
  }, [directorToken]);

  useEffect(() => {
    if (!directorToken) return;
    let active = true;
    getDirectorPayment(directorToken).then((payment) => {
      if (!active) return;
      setDirectorPaymentMethod(payment.paymentMethod);
      setDirectorPaymentValue(payment.paymentValue);
    }).catch(() => {
      if (active) { setDirectorPaymentMethod('unset'); setDirectorPaymentValue(''); }
    });
    return () => { active = false; };
  }, [directorToken]);

  const saveDirectorPayment = async () => {
    if (!directorToken) return;
    setDirectorPaymentSaving(true);
    try {
      await updateDirectorPayment(directorToken, directorPaymentMethod, directorPaymentValue);
      setDirectorMessage(currentLang === 'ar' ? 'تم حفظ وجهة الدفع الخاصة بمدرستك.' : 'Your school payment/contact destination has been saved.');
      setDirectorDataError('');
    } catch (error) {
      setDirectorDataError(error instanceof Error ? error.message : 'Unable to save payment destination.');
    } finally { setDirectorPaymentSaving(false); }
  };

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
          gradeName.includes(accountGrade ?? '')
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
    if (ownerSchoolToken) {
      setStudentRows([]);
      setEducatorRows([]);
      setActiveGradeForSessions(null);
      onBackToOwner?.();
      return;
    }
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
        if (active) setDirectorDataError(currentLang === 'ar' ? 'تعذر تحميل الحسابات والتسجيلات.' : currentLang === 'fr' ? 'Impossible de charger les comptes et les inscriptions.' : currentLang === 'es' ? 'No se pudieron cargar las cuentas y los registros.' : currentLang === 'it' ? 'Impossibile caricare gli account e le registrazioni.' : error instanceof Error ? error.message : 'Unable to load registrations.');
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
      if (account.role === 'owner') { onOwnerLogin?.(account, token); setDirectorForm({ username: '', password: '' }); return; }
      if (account.role !== 'director') {
        throw new Error(currentLang === 'ar' ? 'هذا الحساب لا يملك صلاحية المدير.' : currentLang === 'fr' ? 'Ce compte ne dispose pas des droits de Directeur.' : currentLang === 'es' ? 'Esta cuenta no tiene permisos de Director.' : currentLang === 'it' ? 'Questo account non dispone dei permessi di Direttore.' : 'This account does not have Director access.');
      }
      sessionStorage.setItem('agenda-director-token', token);
      setDirectorToken(token);
      setDirectorScreen('dashboard');
      setDirectorForm({ username: '', password: '' });
    } catch (error) {
      setDirectorError(currentLang === 'ar' ? 'تعذر تسجيل دخول المدير. تحقق من اسم المستخدم وكلمة المرور.' : currentLang === 'fr' ? 'Connexion du Directeur impossible. Vérifiez le nom d’utilisateur et le mot de passe.' : currentLang === 'es' ? 'No se pudo iniciar sesión como Director. Comprueba el usuario y la contraseña.' : currentLang === 'it' ? 'Accesso Direttore non riuscito. Verifica nome utente e password.' : error instanceof Error ? error.message : 'Unable to sign in.');
    }
  };

  const handleSchoolNameSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!directorToken || !directorSchoolName.trim()) return;
    setSchoolNameSaving(true);
    setDirectorDataError('');
    setDirectorMessage('');
    try {
      const { profile, token } = await updateDirectorProfile(directorToken, {
        schoolName: directorSchoolName.trim(),
        username: directorUsername,
      });
      sessionStorage.setItem('agenda-director-token', token);
      setDirectorToken(token);
      if (ownerSchoolToken) onOwnerTokenRefresh?.(token);
      setDirectorSchoolId(profile.schoolId);
      setDirectorSchoolName(profile.schoolName);
      setDirectorUsername(profile.username);
      onSchoolBrandChange(profile.schoolId, profile.schoolName);
      setDirectorMessage(
        currentLang === 'ar' ? 'تم تحديث اسم المدرسة في المنصة.' :
        currentLang === 'fr' ? 'Le nom de l’établissement a été mis à jour sur la plateforme.' :
        currentLang === 'es' ? 'El nombre de la escuela se ha actualizado en la plataforma.' :
        currentLang === 'it' ? 'Il nome della scuola è stato aggiornato sulla piattaforma.' :
        'The school name has been updated across the platform.'
      );
    } catch (error) {
      setDirectorDataError(
        currentLang === 'ar' ? 'تعذر تحديث اسم المدرسة.' :
        currentLang === 'fr' ? 'Impossible de mettre à jour le nom de l’établissement.' :
        currentLang === 'es' ? 'No se pudo actualizar el nombre de la escuela.' :
        currentLang === 'it' ? 'Impossibile aggiornare il nome della scuola.' :
        error instanceof Error ? error.message : 'Unable to update the school name.'
      );
    } finally {
      setSchoolNameSaving(false);
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
      setMonitorError(currentLang === 'ar' ? 'تعذر فتح الصف للمراقبة.' : currentLang === 'fr' ? 'Impossible d’ouvrir cette classe pour la surveillance.' : currentLang === 'es' ? 'No se pudo abrir esta aula para supervisarla.' : currentLang === 'it' ? 'Impossibile aprire questa classe per il monitoraggio.' : error instanceof Error ? error.message : 'Unable to open this classroom for monitoring.');
    } finally {
      setMonitorLoading(false);
    }
  };


const updateAccount = async (
  account: DirectorRow,
    update: {
    activated?: boolean;
    paid?: boolean;
    renew?: boolean;
    password?: string;
    username?: string;
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
      currentLang === 'ar' ? 'تعذر حفظ حالة الحساب.' : currentLang === 'fr' ? 'Impossible d’enregistrer l’état du compte.' : currentLang === 'es' ? 'No se pudo guardar el estado de la cuenta.' : currentLang === 'it' ? 'Impossibile salvare lo stato dell’account.' : error instanceof Error ? error.message : 'Unable to save the account status.'
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
      setDirectorDataError(currentLang === 'ar' ? 'تعذر حذف الحساب.' : currentLang === 'fr' ? 'Impossible de supprimer le compte.' : currentLang === 'es' ? 'No se pudo eliminar la cuenta.' : currentLang === 'it' ? 'Impossibile eliminare l’account.' : err instanceof Error ? err.message : 'Failed to delete account from Cloudflare.');
    }
  };

  const editAccountUsername = (account: DirectorRow) => {
    const nextUsername = window.prompt(
      currentLang === 'ar' ? 'اسم المستخدم الجديد' :
      currentLang === 'fr' ? 'Nouveau nom d’utilisateur' :
      currentLang === 'es' ? 'Nuevo nombre de usuario' :
      currentLang === 'it' ? 'Nuovo nome utente' : 'New username',
      account.username
    );
    if (nextUsername === null) return;
    const username = nextUsername.trim();
    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)) {
      setDirectorDataError(
        currentLang === 'ar' ? 'يجب أن يتكون اسم المستخدم من 3 إلى 40 حرفاً أو رقماً أو . _ -' :
        currentLang === 'fr' ? 'Le nom d’utilisateur doit contenir 3 à 40 caractères (lettres, chiffres, . _ -).' :
        currentLang === 'es' ? 'El nombre de usuario debe tener entre 3 y 40 caracteres (letras, números, . _ -).' :
        currentLang === 'it' ? 'Il nome utente deve contenere da 3 a 40 caratteri (lettere, numeri, . _ -).' :
        'Username must be 3–40 characters using letters, numbers, dot, underscore or hyphen.'
      );
      return;
    }
    if (username === account.username) return;
    void updateAccount(account, { username });
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
            gradeName.includes(accountGrade ?? '')
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
        ? (currentLang === 'ar' ? ' — لا يوجد صف مخصص' : currentLang === 'fr' ? ' — aucune classe attribuée' : currentLang === 'es' ? ' — aula no asignada' : currentLang === 'it' ? ' — nessuna classe assegnata' : ' — no classroom assigned')
        : ''}
    </option>
  ))}
</select>
                </td>
              )}
              <td className="px-3 py-3 text-slate-700">
                <span>{row.username}</span>
                <button type="button" onClick={() => editAccountUsername(row)} className="ms-2 text-indigo-700 underline cursor-pointer">
                  {currentLang === 'ar' ? 'تعديل' : currentLang === 'fr' ? 'Modifier' : currentLang === 'es' ? 'Editar' : currentLang === 'it' ? 'Modifica' : 'Edit'}
                </button>
              </td>
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
          {session.teacherName || (currentLang === 'ar' ? 'حصة غير مخصصة' : currentLang === 'fr' ? 'Cours non attribué' : currentLang === 'es' ? 'Sesión sin asignar' : currentLang === 'it' ? 'Lezione non assegnata' : 'Unassigned lesson')}
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
                  aria-label={currentLang === 'ar' ? `تفعيل ${row.fullName}` : currentLang === 'fr' ? `Compte activé : ${row.fullName}` : currentLang === 'es' ? `Cuenta activada: ${row.fullName}` : currentLang === 'it' ? `Account attivato: ${row.fullName}` : `${row.fullName} activated`}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </td>
              <td className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={row.paid}
                  onChange={() => void updateAccount(row, { paid: !row.paid })}
                  aria-label={currentLang === 'ar' ? `حالة الدفع لـ ${row.fullName}` : currentLang === 'fr' ? `Compte payé : ${row.fullName}` : currentLang === 'es' ? `Cuenta pagada: ${row.fullName}` : currentLang === 'it' ? `Account pagato: ${row.fullName}` : `${row.fullName} paid`}
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
                placeholder={currentLang === 'ar' ? 'اسم المستخدم' : currentLang === 'fr' ? 'Nom d’utilisateur' : currentLang === 'es' ? 'Nombre de usuario' : currentLang === 'it' ? 'Nome utente' : 'Username'}
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
                title={showDirectorPassword ? (currentLang === 'ar' ? 'إخفاء كلمة المرور' : currentLang === 'fr' ? 'Masquer le mot de passe' : currentLang === 'es' ? 'Ocultar contraseña' : currentLang === 'it' ? 'Nascondi password' : 'Hide password') : (currentLang === 'ar' ? 'إظهار كلمة المرور' : currentLang === 'fr' ? 'Afficher le mot de passe' : currentLang === 'es' ? 'Mostrar contraseña' : currentLang === 'it' ? 'Mostra password' : 'Show password')}
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
            {ownerSchoolToken
              ? currentLang === 'ar' ? 'العودة إلى مركز تحكم المالك' : currentLang === 'fr' ? 'Retour au centre du propriétaire' : currentLang === 'es' ? 'Volver al centro del propietario' : currentLang === 'it' ? 'Torna al centro proprietario' : 'Back to Owner Control Center'
              : t.backToMain}
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



        {directorTab === 'accounts' && (
          <form
            onSubmit={(event) => void handleSchoolNameSave(event)}
            className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <label className="min-w-56 flex-1 space-y-1">
              <span className="block text-xs font-bold text-slate-700">
                {currentLang === 'ar' ? 'اسم المدرسة' : currentLang === 'fr' ? 'Nom de l’établissement' : currentLang === 'es' ? 'Nombre de la escuela' : currentLang === 'it' ? 'Nome della scuola' : 'School name'}
              </span>
              <input
                required
                maxLength={160}
                value={directorSchoolName}
                onChange={(event) => setDirectorSchoolName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800"
                placeholder={currentLang === 'ar' ? 'اسم مدرستك' : currentLang === 'fr' ? 'Nom de votre établissement' : currentLang === 'es' ? 'Nombre de tu escuela' : currentLang === 'it' ? 'Nome della tua scuola' : 'Your school name'}
              />
            </label>
            <button
              type="submit"
              disabled={schoolNameSaving || !directorSchoolName.trim()}
              className="rounded-xl bg-indigo-700 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {schoolNameSaving ? '…' : currentLang === 'ar' ? 'حفظ اسم المدرسة' : currentLang === 'fr' ? 'Enregistrer le nom' : currentLang === 'es' ? 'Guardar nombre' : currentLang === 'it' ? 'Salva nome' : 'Save school name'}
            </button>
          </form>
        )}

        {directorTab === 'accounts' && directorToken && (
          <form onSubmit={(event) => { event.preventDefault(); void saveDirectorPayment(); }} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div><h3 className="text-sm font-black text-slate-900">{currentLang === 'ar' ? 'وجهة الدفع والتواصل الخاصة بمدرستك' : 'Your school payment and contact destination'}</h3><p className="mt-1 text-xs text-slate-500">{currentLang === 'ar' ? 'اختر واتساب أو الهاتف أو البريد الإلكتروني أو رابطاً مصرفياً. سيظهر هذا الرابط للمالك لمتابعة معلومات مدرستك.' : 'Choose WhatsApp, phone, email, or a bank / Suyool link. The platform Owner can view this information in the Directors table.'}</p></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-xs font-bold">{currentLang === 'ar' ? 'طريقة التواصل / الدفع' : 'Contact / payment method'}<select value={directorPaymentMethod} onChange={event => setDirectorPaymentMethod(event.target.value as DirectorPaymentMethod)} className="mt-1 w-full rounded-lg border p-2.5 text-sm"><option value="unset">{currentLang === 'ar' ? 'غير محدد' : 'Not set'}</option><option value="whatsapp">WhatsApp</option><option value="phone">{currentLang === 'ar' ? 'هاتف' : 'Phone'}</option><option value="email">Email</option><option value="bank">{currentLang === 'ar' ? 'رابط مصرفي' : 'Bank link'}</option><option value="suyool">Suyool</option></select></label>
              <label className="block text-xs font-bold">{currentLang === 'ar' ? 'رقم الهاتف أو البريد أو الرابط' : 'Phone, email or payment URL'}<input value={directorPaymentValue} onChange={event => setDirectorPaymentValue(event.target.value)} disabled={directorPaymentMethod === 'unset'} placeholder={directorPaymentMethod === 'email' ? 'school@example.com' : directorPaymentMethod === 'phone' || directorPaymentMethod === 'whatsapp' ? '+961…' : 'https://…'} className="mt-1 w-full rounded-lg border p-2.5 text-sm disabled:bg-slate-100"/></label>
            </div>
            <button type="submit" disabled={directorPaymentSaving || (directorPaymentMethod !== 'unset' && !directorPaymentValue.trim())} className="rounded-lg bg-indigo-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{directorPaymentSaving ? '…' : currentLang === 'ar' ? 'حفظ وجهة الدفع' : 'Save destination'}</button>
          </form>
        )}

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
              currentLang === 'ar' ? 'الطلاب' : currentLang === 'fr' ? 'Étudiants' : currentLang === 'es' ? 'Estudiantes' : currentLang === 'it' ? 'Studenti' : 'Students',
              studentRows,
              true
            )}

            {renderDirectorTable(
              currentLang === 'ar' ? 'المعلمون' : currentLang === 'fr' ? 'Éducateurs' : currentLang === 'es' ? 'Educadores' : currentLang === 'it' ? 'Educatori' : 'Educators',
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
