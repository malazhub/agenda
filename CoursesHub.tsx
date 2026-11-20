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
  saveDirectorAccountUpdates,
  deleteDirectorAccount,
  getDirectorLiveStream,
  getDirectorPayment,
  updateDirectorPayment,
  getSchools,
  getDirectorGradePricing,
  updateDirectorGradePricing,
  deleteDirectorGradePricing,
} from '../services/cloudflareApi';
import type { CloudflareAccount, RegistrationSession, StoredSessionRecord, LiveStreamStatus, DirectorPaymentMethod, DirectorAccountUpdate, SchoolRecord } from '../services/cloudflareApi';
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
  registeredAccount: CloudflareAccount | null;
  schoolId: string;
  sessionToken: string;
  onSchoolBrandChange: (schoolId: string, schoolName: string) => void;
  onOwnerLogin?: (account: CloudflareAccount, token: string) => void;
  ownerSchoolToken?: string;
  onBackToOwner?: () => void;
  onOwnerTokenRefresh?: (token: string) => void;
  directorAccessToken?: string;
  initialDirectorLogin?: boolean;
  initialGuestLiveRoom?: boolean;
  onDirectorRedirect?: () => void;
  onRegisterSignOutCleanup?: (
    cleanup: (() => Promise<void>) | null
  ) => void;
}

type DirectorRow = CloudflareAccount;

export const CoursesHub: React.FC<CoursesHubProps> = ({
  currentLang,
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
  initialDirectorLogin,
  initialGuestLiveRoom = false,
  onDirectorRedirect,
}) => {
  const t = translations[currentLang];

  useEffect(() => {
    if (initialDirectorLogin) setDirectorScreen('login');
  }, [initialDirectorLogin]);


    const [activeGradeForSessions, setActiveGradeForSessions] = useState<GradeLevelDef | null>(null);
  const [activeGradeTab, setActiveGradeTab] = useState<'stored' | 'live'>('stored');
  const [autoOpenLiveClassroom, setAutoOpenLiveClassroom] = useState(false);
  const [directorScreen, setDirectorScreen] = useState<'home' | 'login' | 'dashboard'>(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('directorLogin') === '1' ? 'login' : 'home'
  );
  const [directorForm, setDirectorForm] = useState({ username: '', password: '' });
  const [directorLoginSchools, setDirectorLoginSchools] = useState<SchoolRecord[]>([]);
  const [directorLoginSchoolId, setDirectorLoginSchoolId] = useState('default-agenda-school');

  useEffect(() => {
    if (directorScreen !== 'login') return;
    let active = true;
    getSchools(schoolId).then(({ schools, activeSchoolId: preferred }) => {
      if (!active) return;
      const options = schools || [];
      setDirectorLoginSchools(options);
      setDirectorLoginSchoolId(options.some((school) => school.id === 'default-agenda-school') ? 'default-agenda-school' : (preferred || options[0]?.id || 'default-agenda-school'));
    }).catch(() => {
      if (!active) return;
      setDirectorLoginSchools([{ id: 'default-agenda-school', name: 'Agenda' }]);
      setDirectorLoginSchoolId('default-agenda-school');
    });
    return () => { active = false; };
  }, [directorScreen, schoolId]);


  const [showDirectorPassword, setShowDirectorPassword] = useState(false);
  const [directorError, setDirectorError] = useState('');
  const [directorToken, setDirectorToken] = useState(() =>
    typeof window === 'undefined' ? '' : window.sessionStorage.getItem('agenda-director-token') || ''
  );
  const [directorSchoolId, setDirectorSchoolId] = useState('');
  const [directorSchoolName, setDirectorSchoolName] = useState('');
  const [directorUsername, setDirectorUsername] = useState('');
  const [directorNewPassword, setDirectorNewPassword] = useState('');
  const [directorConfirmPassword, setDirectorConfirmPassword] = useState('');
  const [directorPasswordNeedsChange, setDirectorPasswordNeedsChange] = useState(false);
  const [directorPaymentMethod, setDirectorPaymentMethod] = useState<DirectorPaymentMethod>('unset');
  const [directorPaymentValue, setDirectorPaymentValue] = useState('');
  const [directorPaymentSaving, setDirectorPaymentSaving] = useState(false);
  const [gradePricingRows, setGradePricingRows] = useState<Array<{ gradeId: string; amount: string }>>([]);
  const [gradePricingSaving, setGradePricingSaving] = useState(false);

  const [schoolNameSaving, setSchoolNameSaving] = useState(false);
  const [studentRows, setStudentRows] = useState<DirectorRow[]>([]);
  const [educatorRows, setEducatorRows] = useState<DirectorRow[]>([]);
  const [registrationSessions, setRegistrationSessions] = useState<RegistrationSession[]>([]);
  const [pendingDirectorUpdates, setPendingDirectorUpdates] = useState<Record<string, DirectorAccountUpdate>>({});
  const [savingDirectorUpdates, setSavingDirectorUpdates] = useState(false);
  const [directorLoading, setDirectorLoading] = useState(false);
  const [directorDataError, setDirectorDataError] = useState('');
  const [directorMessage, setDirectorMessage] = useState('');
  const [directorTab, setDirectorTab] = useState<'accounts' | 'sessions'>('accounts');
  const [monitorSession, setMonitorSession] = useState<StoredSessionRecord | null>(null);
  const [monitorStream, setMonitorStream] = useState<LiveStreamStatus | null>(null);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorError, setMonitorError] = useState('');

  useEffect(() => {
    if (!ownerSchoolToken) return;
    setDirectorToken(ownerSchoolToken);
    setDirectorScreen('dashboard');
  }, [ownerSchoolToken]);

  useEffect(() => {
    if (registeredAccount?.role === 'director') setDirectorPasswordNeedsChange(Boolean(registeredAccount.mustChangePassword));
  }, [registeredAccount?.role, registeredAccount?.mustChangePassword]);

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
  useEffect(() => {
    if (!directorToken) { setGradePricingRows([]); return; }
    let active = true;
    getDirectorGradePricing(directorToken).then(({ prices }) => {
      if (!active) return;
      setGradePricingRows((prices || []).map((price) => ({ gradeId: price.gradeId, amount: String(price.monthlyRateUsd) })));
    }).catch((error) => {
      if (active) setDirectorDataError(error instanceof Error ? error.message : 'Unable to load grade fees.');
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
    sessionStorage.removeItem('agenda-session-token');
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
      const { account, token, directorLink } = await loginAccount(directorForm.username, directorForm.password, directorLoginSchoolId || schoolId);
      if (account.role === 'owner') { onOwnerLogin?.(account, token); setDirectorForm({ username: '', password: '' }); return; }
      if (account.role !== 'director') {
        throw new Error(currentLang === 'ar' ? 'هذا الحساب لا يملك صلاحية المدير.' : currentLang === 'fr' ? 'Ce compte ne dispose pas des droits de Directeur.' : currentLang === 'es' ? 'Esta cuenta no tiene permisos de Director.' : currentLang === 'it' ? 'Questo account non dispone dei permessi di Direttore.' : 'This account does not have Director access.');
      }
      // Always replace the currently open school with the authenticated
      // Director's own school, regardless of which school entry URL was open.
      if (account.role === 'director') {
        sessionStorage.setItem('agenda-director-token', token);
        sessionStorage.setItem('agenda-session-token', token);
        onDirectorRedirect?.();
        const destination = directorLink || `https://agenda.mycamp.workers.dev/?schoolId=${encodeURIComponent(account.schoolId)}`;
        window.location.replace(destination);
        return;
      }
      sessionStorage.setItem('agenda-director-token', token);
      sessionStorage.setItem('agenda-session-token', token);
      setDirectorPasswordNeedsChange(Boolean(account.mustChangePassword));
      setDirectorToken(token);
      setDirectorScreen('dashboard');
      setDirectorForm({ username: '', password: '' });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unable to sign in.';
      const prefix = currentLang === 'ar' ? 'تعذر تسجيل دخول المدير' : currentLang === 'fr' ? 'Connexion du Directeur impossible' : currentLang === 'es' ? 'No se pudo iniciar sesión como Director' : currentLang === 'it' ? 'Accesso Direttore non riuscito' : 'Director sign-in failed';
      setDirectorError(currentLang === 'en' ? detail : `${prefix}: ${detail}`);

    }
  };

  const handleSchoolNameSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!directorToken || !directorSchoolName.trim()) return;
    if (directorPasswordNeedsChange && !directorNewPassword) {
      setDirectorDataError(currentLang === 'ar' ? 'اختر كلمة مرور جديدة قبل متابعة استخدام لوحة المدير.' : 'Please choose your own password before continuing.');
      return;
    }
    if (directorNewPassword !== directorConfirmPassword) {
      setDirectorDataError(currentLang === 'ar' ? 'كلمتا المرور غير متطابقتين.' : 'The new passwords do not match.');
      return;
    }
    setSchoolNameSaving(true);
    setDirectorDataError('');
    setDirectorMessage('');
    try {
      const { profile, token } = await updateDirectorProfile(directorToken, {
        schoolName: directorSchoolName.trim(),
        username: directorUsername,
        password: directorNewPassword || undefined,
      });
      sessionStorage.setItem('agenda-director-token', token);
      setDirectorToken(token);
      if (ownerSchoolToken) onOwnerTokenRefresh?.(token);
      setDirectorSchoolId(profile.schoolId);
      setDirectorSchoolName(profile.schoolName);
      setDirectorUsername(profile.username);
      if (directorNewPassword) {
        setDirectorPasswordNeedsChange(false);
        setDirectorNewPassword('');
        setDirectorConfirmPassword('');
      }
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

  const saveGradePricing = async () => {
    if (!directorToken) return;
    const normalized = gradePricingRows.map((row) => ({
      gradeId: row.gradeId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 40),
      monthlyRateUsd: Number(row.amount),
    }));
    if (normalized.some((row) => !row.gradeId || !Number.isFinite(row.monthlyRateUsd) || row.monthlyRateUsd < 0 || row.monthlyRateUsd > 1000000)) {
      setDirectorDataError('Enter a valid grade and a fee from 0 to USD 1,000,000.');
      return;
    }
    if (new Set(normalized.map((row) => row.gradeId)).size !== normalized.length) {
      setDirectorDataError('Each grade can appear only once.');
      return;
    }
    setGradePricingSaving(true); setDirectorDataError(''); setDirectorMessage('');
    try {
      const existing = await getDirectorGradePricing(directorToken);
      const keep = new Set(normalized.map((row) => row.gradeId));
      await Promise.all([
        ...normalized.map((row) => updateDirectorGradePricing(directorToken, row.gradeId, row.monthlyRateUsd)),
        ...(existing.prices || []).filter((row) => !keep.has(row.gradeId)).map((row) => deleteDirectorGradePricing(directorToken, row.gradeId)),
      ]);
      setGradePricingRows(normalized.map((row) => ({ gradeId: row.gradeId, amount: String(row.monthlyRateUsd) })));
      setDirectorMessage(currentLang === 'ar' ? 'تم حفظ رسوم الصفوف.' : currentLang === 'fr' ? 'Les tarifs par niveau ont été enregistrés.' : currentLang === 'es' ? 'Se guardaron las tarifas por grado.' : currentLang === 'it' ? 'Le tariffe per classe sono state salvate.' : 'Grade fees saved.');
    } catch (error) {
      setDirectorDataError(error instanceof Error ? error.message : 'Unable to save grade fees.');
    } finally { setGradePricingSaving(false); }
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


const directorAccountDefaults = (row: DirectorRow): DirectorAccountUpdate => ({
  id: row.id,
  activated: row.activated,
  paid: row.paid,
  gradeId: row.gradeId || '',
  registeredSessionId: row.registeredSessionId || null,
  registeredEducatorId: row.registeredEducatorId || null,
  schoolOrSubject: row.schoolOrSubject || '',
});

const stagedDirectorAccount = (row: DirectorRow): DirectorAccountUpdate =>
  pendingDirectorUpdates[row.id] || directorAccountDefaults(row);

const stageDirectorAccountUpdate = (
  row: DirectorRow,
  change: Partial<Omit<DirectorAccountUpdate, 'id'>>
) => {
  setPendingDirectorUpdates((current) => ({
    ...current,
    [row.id]: { ...(current[row.id] || directorAccountDefaults(row)), ...change, id: row.id },
  }));
  setDirectorDataError('');
  setDirectorMessage('');
};

const saveAllDirectorAccountUpdates = async () => {
  const updates = Object.values(pendingDirectorUpdates);
  if (!directorToken || !updates.length) return;
  setSavingDirectorUpdates(true);
  setDirectorDataError('');
  setDirectorMessage('');
  try {
    const result = await saveDirectorAccountUpdates(directorToken, updates);
    const savedById = new Map<string, CloudflareAccount>(result.accounts.map((account) => [account.id, account] as const));
    setStudentRows((rows) => rows.map((row) => savedById.get(row.id) || row));
    setEducatorRows((rows) => rows.map((row) => savedById.get(row.id) || row));
    setPendingDirectorUpdates({});
    try {
      const { sessions } = await getRegistrationSessions(directorSchoolId);
      setRegistrationSessions(sessions);
    } catch (refreshError) {
      console.warn('Accounts were saved, but the session list could not be refreshed:', refreshError);
    }
    setDirectorMessage(
      currentLang === 'ar' ? 'تم حفظ جميع تعديلات الحسابات بنجاح.' :
      currentLang === 'fr' ? 'Toutes les modifications des comptes ont été enregistrées.' :
      currentLang === 'es' ? 'Se guardaron todos los cambios de las cuentas.' :
      currentLang === 'it' ? 'Tutte le modifiche agli account sono state salvate.' :
      'All account changes were saved successfully.'
    );
  } catch (error) {
    setDirectorDataError(
      currentLang === 'ar' ? 'تعذر حفظ التعديلات. لم يتم تأكيد حفظ جميع التغييرات.' :
      currentLang === 'fr' ? 'Impossible d’enregistrer les modifications. La sauvegarde complète n’a pas été confirmée.' :
      currentLang === 'es' ? 'No se pudieron guardar los cambios. No se confirmó el guardado completo.' :
      currentLang === 'it' ? 'Impossibile salvare le modifiche. Il salvataggio completo non è stato confermato.' :
      error instanceof Error ? error.message : 'Unable to save all account changes.'
    );
  } finally {
    setSavingDirectorUpdates(false);
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
    if (password.length === 0) {
      setDirectorDataError(t.passwordLabel);
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

  // Owner guest testing opens the real Broadcast Room Live Sessions view,
  // not the unrelated demo VirtualClassroom component.
  useEffect(() => {
    if (initialGuestLiveRoom && !registeredAccount && !activeGradeForSessions) {
      openSharedLiveRoom();
    }
  }, [initialGuestLiveRoom, registeredAccount, activeGradeForSessions]);

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
            <th className="px-3 py-3 text-left font-black text-slate-700">{currentLang === 'ar' ? 'اسم المستخدم أو البريد الإلكتروني' : currentLang === 'fr' ? 'Nom d’utilisateur ou e-mail' : currentLang === 'es' ? 'Usuario o correo electrónico' : currentLang === 'it' ? 'Nome utente o e-mail' : 'Username or email address'}</th>
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
                    aria-label={row.fullName + ' educator'}
                    value={stagedDirectorAccount(row).registeredEducatorId || ''}
                    onChange={(event) => {
                      const selected = educatorRows.find((educator) => educator.id === event.target.value);
                      stageDirectorAccountUpdate(row, {
                        registeredEducatorId: selected?.id || null,
                        registeredSessionId: selected?.registeredSessionId || null,
                        gradeId: selected?.gradeId || stagedDirectorAccount(row).gradeId,
                      });
                    }}
                    className="min-w-40 max-w-56 rounded border border-slate-300 bg-white p-2 text-xs"
                  >
                    <option value="">{currentLang === 'ar' ? 'بدون أستاذ — يمكن تعيينه لاحقاً' : currentLang === 'fr' ? 'Aucun éducateur — attribution ultérieure' : currentLang === 'es' ? 'Sin educador — asignar más tarde' : currentLang === 'it' ? 'Nessun educatore — assegnare dopo' : 'No educator — assign later'}</option>
                    {educatorRows.map((educator) => (
                      <option key={educator.id} value={educator.id}>
                        {educator.fullName}{educator.gradeId ? ' · ' + educator.gradeId.toUpperCase() : ''}
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
              <td className="px-3 py-3 text-slate-700">
                {row.role === 'educator' ? (
                  <input aria-label={row.fullName + ' school/subject'} value={stagedDirectorAccount(row).schoolOrSubject || ''}
                    onChange={(event) => stageDirectorAccountUpdate(row, { schoolOrSubject: event.target.value.slice(0, 160) })}
                    placeholder={currentLang === 'ar' ? 'المدرسة / المادة' : currentLang === 'fr' ? 'École / matière' : currentLang === 'es' ? 'Escuela / materia' : currentLang === 'it' ? 'Scuola / materia' : 'School / subject'}
                    className="min-w-40 w-full rounded border border-slate-300 bg-white p-2 text-xs"/>
                ) : (row.schoolOrSubject || '—')}
              </td>
              
<td className="px-3 py-3 text-slate-700">
  <div className="flex min-w-56 flex-col items-start gap-2">
    {row.role === 'educator' ? (
      <select
        aria-label={row.fullName + ' ' + t.registeredSessionLabel}
        value={stagedDirectorAccount(row).registeredSessionId || ''}
        onChange={(event) => {
          const selected = registrationSessions.find((session) => session.id === event.target.value);
          stageDirectorAccountUpdate(row, {
            registeredSessionId: selected?.id || null,
            ...(selected ? { gradeId: selected.gradeId } : {}),
          });
        }}
        className="w-full max-w-64 rounded border border-slate-300 bg-white p-1.5 text-[10px]"
      >
        {registrationSessions.map((session) => (
          <option key={session.id} value={session.id}>{session.gradeId.toUpperCase()} · {session.subject} · {session.title}</option>
        ))}
      </select>
    ) : (
      <span className="max-w-64 text-[10px] font-semibold text-slate-600">
        {registrationSessions.find((session) => session.id === stagedDirectorAccount(row).registeredSessionId)?.title
          || (stagedDirectorAccount(row).registeredSessionId
            ? stagedDirectorAccount(row).registeredSessionId
            : (currentLang === 'ar' ? 'لم يعيّن الأستاذ صفاً بعد' : currentLang === 'fr' ? 'Aucune classe attribuée à l’éducateur' : currentLang === 'es' ? 'El educador aún no tiene clase' : currentLang === 'it' ? 'L’educatore non ha ancora una classe' : 'Educator has no assigned class yet'))}
      </span>
    )}
    {row.role === 'educator' ? (
      <>
        <select
          aria-label={row.fullName + ' grade'}
          value={stagedDirectorAccount(row).gradeId || ''}
          onChange={(event) => stageDirectorAccountUpdate(row, { gradeId: event.target.value, registeredSessionId: null })}
          className="w-full max-w-64 rounded border border-slate-300 bg-white p-1.5 text-[10px]"
        >
          {LEBANESE_GRADE_LEVELS.map((grade) => (
            <option key={grade.id} value={grade.id}>{grade.name[currentLang] || grade.name.en}</option>
          ))}
          {!LEBANESE_GRADE_LEVELS.some((grade) => grade.id === stagedDirectorAccount(row).gradeId) && stagedDirectorAccount(row).gradeId && (
            <option value={stagedDirectorAccount(row).gradeId}>{stagedDirectorAccount(row).gradeId.toUpperCase()}</option>
          )}
        </select>
        <input
          aria-label={row.fullName + ' custom grade'}
          value={LEBANESE_GRADE_LEVELS.some((grade) => grade.id === stagedDirectorAccount(row).gradeId) ? '' : stagedDirectorAccount(row).gradeId}
          onChange={(event) => stageDirectorAccountUpdate(row, { gradeId: event.target.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 40), registeredSessionId: null })}
          placeholder={currentLang === 'ar' ? 'أو اكتب صفاً جديداً' : currentLang === 'fr' ? 'Ou saisir une nouvelle classe' : currentLang === 'es' ? 'O escribe un nuevo curso' : currentLang === 'it' ? 'Oppure inserisci una nuova classe' : 'Or enter a new grade'}
          className="w-full max-w-64 rounded border border-slate-300 bg-white p-1.5 text-[10px]"
        />
      </>
    ) : (
      <span className="text-[10px] font-semibold text-slate-600">
        {row.studentGradeLabel
          ? (LEBANESE_GRADE_LEVELS.find((grade) => grade.id === row.studentGradeLabel)?.name[currentLang] || row.studentGradeLabel)
          : (LEBANESE_GRADE_LEVELS.find((grade) => grade.id === stagedDirectorAccount(row).gradeId)?.name[currentLang] || stagedDirectorAccount(row).gradeId.toUpperCase())}
      </span>
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
                  checked={stagedDirectorAccount(row).activated}
                  onChange={() => stageDirectorAccountUpdate(row, { activated: !stagedDirectorAccount(row).activated })}
                  aria-label={currentLang === 'ar' ? `تفعيل ${row.fullName}` : currentLang === 'fr' ? `Compte activé : ${row.fullName}` : currentLang === 'es' ? `Cuenta activada: ${row.fullName}` : currentLang === 'it' ? `Account attivato: ${row.fullName}` : `${row.fullName} activated`}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </td>
              <td className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={stagedDirectorAccount(row).paid}
                  onChange={() => stageDirectorAccountUpdate(row, { paid: !stagedDirectorAccount(row).paid })}
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
              {currentLang === 'ar' ? 'البريد الإلكتروني أو اسم المستخدم' : currentLang === 'fr' ? 'Adresse e-mail ou nom d’utilisateur' : currentLang === 'es' ? 'Correo electrónico o nombre de usuario' : currentLang === 'it' ? 'E-mail o nome utente' : 'Email address or username'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                value={directorForm.username}
                onChange={e => setDirectorForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-indigo-600"
                placeholder={currentLang === 'ar' ? 'اسم المستخدم أو البريد الإلكتروني' : currentLang === 'fr' ? 'Nom d’utilisateur ou e-mail' : currentLang === 'es' ? 'Usuario o correo electrónico' : currentLang === 'it' ? 'Nome utente o e-mail' : 'Username or email address'}
              />
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {currentLang === 'ar' ? 'في الحسابات التي أُنشئت من تسجيل المدير، استخدم البريد الإلكتروني الذي أدخلته عند إنشاء الحساب، أو الاسم الكامل للمدير.' : currentLang === 'fr' ? 'Pour un compte Directeur créé par inscription, utilisez l’e-mail saisi à la création ou le nom complet exact du Directeur.' : currentLang === 'es' ? 'Para una cuenta de Director creada al registrarse, use el correo introducido al crearla o el nombre completo exacto del Director.' : currentLang === 'it' ? 'Per un account Direttore creato durante la registrazione, usa l’e-mail inserita o il nome completo esatto del Direttore.' : 'For a Director account created during registration, use the email address entered at sign-up, or the Director’s exact full name.'}
            </p>
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
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">${currentLang === 'ar' ? 'المدرسة' : currentLang === 'fr' ? 'École' : currentLang === 'es' ? 'Escuela' : currentLang === 'it' ? 'Scuola' : 'School'}</label>
            <select value={directorLoginSchoolId} onChange={(event) => setDirectorLoginSchoolId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
              {directorLoginSchools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
            </select>
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
            <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
              {directorPasswordNeedsChange && <p className="text-xs font-semibold text-slate-600">{currentLang === 'ar' ? 'يرجى تعيين كلمة مرورك الشخصية للمتابعة.' : 'Set your personal password to continue.'}</p>}
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block text-xs font-bold text-slate-700">{currentLang === 'ar' ? 'كلمة المرور الجديدة' : 'New password'}<input type="password" autoComplete="new-password"  required={directorPasswordNeedsChange} value={directorNewPassword} onChange={event=>setDirectorNewPassword(event.target.value)} className="mt-1 w-full rounded-lg border p-2.5 text-sm" placeholder={currentLang === 'ar' ? 'اختر كلمة مرورك' : 'Choose your password'}/></label>
                <label className="block text-xs font-bold text-slate-700">{currentLang === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm new password'}<input type="password" autoComplete="new-password"  required={directorPasswordNeedsChange} value={directorConfirmPassword} onChange={event=>setDirectorConfirmPassword(event.target.value)} className="mt-1 w-full rounded-lg border p-2.5 text-sm" placeholder={currentLang === 'ar' ? 'أعد كتابة كلمة المرور' : 'Enter it again'}/></label>
              </div>
              <p className="text-[11px] text-slate-500">{currentLang === 'ar' ? 'لا يوجد حد أدنى للطول؛ يمكن استخدام حرف واحد.' : 'No minimum password length; a single character is accepted.'}</p>
            </div>
            <button
              type="submit"
              disabled={schoolNameSaving || !directorSchoolName.trim() || (directorPasswordNeedsChange && !directorNewPassword)}
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


        {directorTab === 'accounts' && directorToken && (
          <section className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">{currentLang === 'ar' ? 'رسوم كل صف دراسي' : currentLang === 'fr' ? 'Tarif par niveau scolaire' : currentLang === 'es' ? 'Tarifa por grado escolar' : currentLang === 'it' ? 'Tariffa per classe' : 'Fee for each grade'}</h3>
              <p className="mt-1 text-xs text-slate-600">{currentLang === 'ar' ? 'أدخل المبلغ بالدولار لكل حصة. أضف أو احذف الصفوف؛ ستظهر الرسوم للطلاب في صفحة الدفع.' : currentLang === 'fr' ? 'Saisissez le montant en USD par séance. Ajoutez ou supprimez des niveaux ; les tarifs seront affichés aux élèves.' : currentLang === 'es' ? 'Introduzca el importe en USD por sesión. Añada o elimine grados; los precios se mostrarán a los estudiantes.' : currentLang === 'it' ? 'Inserisci l’importo in USD per lezione. Aggiungi o rimuovi classi; le tariffe saranno mostrate agli studenti.' : 'Set the USD fee per session for each grade. Add or remove grades; configured prices appear on the student payment screen.'}</p>
            </div>
            <div className="space-y-2">
              {gradePricingRows.map((row, index) => (
                <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto] gap-2 items-center">
                  <input aria-label="Grade name" value={row.gradeId} onChange={(event) => setGradePricingRows((current) => current.map((item, i) => i === index ? { ...item, gradeId: event.target.value } : item))} placeholder="Grade name or ID" maxLength={40} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"/>
                  <input aria-label="USD per session" type="number" min="0" max="1000000" step="0.01" value={row.amount} onChange={(event) => setGradePricingRows((current) => current.map((item, i) => i === index ? { ...item, amount: event.target.value } : item))} placeholder="USD / session" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"/>
                  <button type="button" onClick={() => setGradePricingRows((current) => current.filter((_, i) => i !== index))} aria-label="Remove grade fee" className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-700">×</button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={() => setGradePricingRows((current) => [...current, { gradeId: '', amount: '' }])} className="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-indigo-800">+ Add grade and fee</button>
              <button type="button" onClick={() => void saveGradePricing()} disabled={gradePricingSaving} className="rounded-lg bg-indigo-700 px-4 py-2 text-xs font-black text-white disabled:opacity-50">{gradePricingSaving ? '…' : 'Save grade fees'}</button>
            </div>
          </section>
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
            <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-white/95 p-4 shadow-lg backdrop-blur">
              <span className="text-xs font-bold text-slate-700">
                {Object.keys(pendingDirectorUpdates).length
                  ? (currentLang === 'ar' ? Object.keys(pendingDirectorUpdates).length + ' تعديلات غير محفوظة' : currentLang === 'fr' ? Object.keys(pendingDirectorUpdates).length + ' modifications non enregistrées' : currentLang === 'es' ? Object.keys(pendingDirectorUpdates).length + ' cambios sin guardar' : currentLang === 'it' ? Object.keys(pendingDirectorUpdates).length + ' modifiche non salvate' : Object.keys(pendingDirectorUpdates).length + ' unsaved account changes')
                  : (currentLang === 'ar' ? 'جميع التعديلات محفوظة' : currentLang === 'fr' ? 'Toutes les modifications sont enregistrées' : currentLang === 'es' ? 'Todos los cambios están guardados' : currentLang === 'it' ? 'Tutte le modifiche sono salvate' : 'All changes are saved')}
              </span>
              <button type="button" disabled={!Object.keys(pendingDirectorUpdates).length || savingDirectorUpdates} onClick={() => void saveAllDirectorAccountUpdates()} className="rounded-xl bg-indigo-700 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-40">
                {savingDirectorUpdates
                  ? (currentLang === 'ar' ? 'جارٍ الحفظ...' : currentLang === 'fr' ? 'Enregistrement...' : currentLang === 'es' ? 'Guardando...' : currentLang === 'it' ? 'Salvataggio...' : 'Saving...')
                  : (currentLang === 'ar' ? 'حفظ' : currentLang === 'fr' ? 'Enregistrer' : currentLang === 'es' ? 'Guardar' : currentLang === 'it' ? 'Salva' : 'Save')}
              </button>
            </div>
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
