import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { LEBANESE_GRADE_LEVELS } from '../data/mockGradesAndSessions';
import { UserPlus, X, CheckCircle2, CreditCard, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import {
  getSchoolPayment,
  getRegistrationGrades,
  getRegistrationEducators,
  loginAccount,
  registerAccount,
  registerPublicDirectorSchool,
} from '../services/cloudflareApi';

import type {
  CloudflareAccount,
  RegistrationEducator,
} from '../services/cloudflareApi';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  schoolId: string;
  onRegisterSuccess: (account: CloudflareAccount, token: string) => void;
}
export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  schoolId,
  onRegisterSuccess
}) => {
  const t = translations[currentLang];
  const [role, setRole] = useState<'student' | 'educator' | 'director'>('student');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [schoolOrSubject, setSchoolOrSubject] = useState('');
  const [directorSchoolName, setDirectorSchoolName] = useState('');
  const [directorRequestSaved, setDirectorRequestSaved] = useState('');
  const [registeredGradeId, setRegisteredGradeId] = useState('');
  const [selectedEducatorId, setSelectedEducatorId] = useState<string>('');
  const [newClassName, setNewClassName] = useState('');
  const [registrationGrades, setRegistrationGrades] = useState<string[]>(
    LEBANESE_GRADE_LEVELS.map((grade) => grade.id)
  );
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showAccessChoice, setShowAccessChoice] = useState(true);
  const [isLogin, setIsLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schoolPayment, setSchoolPayment] = useState({paymentMethod:'unset',paymentValue:''});

    // All registered educators are loaded from the Cloudflare database.
  const [educatorsList, setEducatorsList] = useState<RegistrationEducator[]>([]);
  const [isLoadingEducators, setIsLoadingEducators] = useState(false);

    const selectedEducator =
    educatorsList.find(
      (educator) => educator.id === selectedEducatorId
    ) || null;

  const loadOnlyRealRegisteredEducators = () => {
    let list: any[] = [];

    // Force clear any old catalog sessions that were mistakenly stored
    try {
      localStorage.removeItem('director_saved_sessions');
      
      const stored = localStorage.getItem('agenda_registered_educators');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Keep only people who registered through the Educator registration form
          list = parsed.filter((e: any) => {
            const id = String(e.id || '');
            const n = String(e.name || '').toLowerCase();
            return (
              id.startsWith('edu_real_') && 
              !n.includes('مثال') && 
              !n.includes('example')
            );
          });
          localStorage.setItem('agenda_registered_educators', JSON.stringify(list));
        }
      }
    } catch {}

    return list;
  };

    useEffect(() => {
    if (!isOpen) return;

    let active = true;

    setIsLoadingEducators(true);

    getRegistrationEducators(schoolId)
      .then(({ educators }) => {
        if (active) {
          setEducatorsList(educators || []);
        }
      })
      .catch((requestError) => {
        console.error(
          'Unable to load registered educators:',
          requestError
        );

        if (active) {
          // Educator registration must remain available even when this school
          // has no educators yet. Students see the empty-state guidance below.
          setEducatorsList([]);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingEducators(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, schoolId, t.registrationServiceUnavailable]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setIsLoadingGrades(true);
    setRegistrationGrades(LEBANESE_GRADE_LEVELS.map((grade) => grade.id));
    getRegistrationGrades(schoolId)
      .then(({ grades }) => {
        if (!active) return;
        const available = new Set([
          ...LEBANESE_GRADE_LEVELS.map((grade) => grade.id),
          ...(Array.isArray(grades) ? grades : []),
        ]);
        setRegistrationGrades([...available]);
      })
      .catch((gradeError) => {
        console.warn('Using built-in grade catalogue:', gradeError);
        if (active) setRegistrationGrades(LEBANESE_GRADE_LEVELS.map((grade) => grade.id));
      })
      .finally(() => {
        if (active) setIsLoadingGrades(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, schoolId]);

  useEffect(() => {
    if (!isOpen) return;
    setShowAccessChoice(true);
    setShowPayment(false);
    setIsLogin(false);
    setError(null);
    setDirectorRequestSaved('');
    setRole('student');
  }, [isOpen]);

  const gradeLabel = (gradeId: string) => {
    const grade = LEBANESE_GRADE_LEVELS.find((item) => item.id === gradeId);
    return grade
      ? (grade.name[currentLang] || grade.name.en || grade.badge)
      : gradeId.toUpperCase();
  };

  const handleClose = () => {
    setShowPayment(false);
    setShowAccessChoice(true);
    setIsLogin(false);
    setError(null);
    setDirectorRequestSaved('');
    onClose();
  };

  useEffect(() => { if (!isOpen || !showPayment) return; getSchoolPayment(schoolId).then(setSchoolPayment).catch(() => setSchoolPayment({paymentMethod:'unset',paymentValue:''})); }, [isOpen, showPayment, schoolId]);

  if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && role === 'director') {
      setIsSubmitting(true);
      setError(null);
      setDirectorRequestSaved('');
      try {
        const result = await registerPublicDirectorSchool({
          fullName: name.trim(),
          schoolName: directorSchoolName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        });

        // Replace this Agenda page in the current browser tab with the newly
        // created school's canonical URL. Using replace() intentionally means
        // the Director lands inside their school rather than returning to the
        // generic Agenda registration screen with the Back button.
        if (!result.directorLink || !result.schoolId) {
          throw new Error('The school was created, but its school link was not returned. Please contact the Owner.');
        }
        window.location.replace(result.directorLink);
        return;
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : t.registrationServiceUnavailable);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!isLogin && role === 'student' && !selectedEducatorId) {
      setError(
        currentLang === 'ar' ? 'يرجى اختيار الأستاذ الذي ترغب بالتسجيل معه.' :
        currentLang === 'fr' ? 'Veuillez choisir votre éducateur.' :
        currentLang === 'es' ? 'Selecciona tu educador.' :
        currentLang === 'it' ? 'Seleziona il tuo educatore.' :
        'Please select the educator you want to register with.'
      );
      return;
    }

    if (!isLogin && role === 'educator' && newClassName.trim().length < 2) {
      setError(currentLang === 'ar' ? 'يرجى إدخال اسم الصف الذي ستدرّسه.' : currentLang === 'fr' ? 'Veuillez saisir le nom de la classe que vous enseignerez.' : currentLang === 'es' ? 'Introduce el nombre de la clase que impartirás.' : currentLang === 'it' ? 'Inserisci il nome della classe che insegnerai.' : 'Please enter the name of the class you will teach.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { account, token } = isLogin
        ? await loginAccount(username, password)
        : await registerAccount({
            schoolId,
            username,
            password,
            role: role === 'educator' ? 'educator' : 'student',
            fullName: name,
            email,
            phone,
            schoolOrSubject,

            // Students inherit their selected educator's grade and current classroom.
            gradeId: role === 'student' ? selectedEducator!.gradeId : registeredGradeId,
            registeredEducatorId: role === 'student' ? selectedEducatorId : undefined,
            registeredSessionId: role === 'student' ? selectedEducator!.registeredSessionId || undefined : undefined,
            // Every educator creates a dedicated class that the API assigns to the account.
            className: role === 'educator' ? newClassName.trim() : undefined,
          });
      onRegisterSuccess(account, token);
      handleClose();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : '';
      setError(
        /has expired/i.test(message)
          ? t.accountExpired
          : /waiting for director activation|not activated/i.test(message)
          ? t.accountNotActivated
          : /invalid username or password/i.test(message)
            ? t.invalidLogin
          : /registered for another session/i.test(message)
            ? t.registrationSessionConflict
            : /(?:invalid.*session|session.*invalid|choose a valid session)/i.test(message)
              ? t.registrationChooseGrade
            : /already registered|already exists/i.test(message)
          ? t.registrationUsernameTaken
          : /complete the required|invalid .* fields/i.test(message)
            ? t.registrationRequiredFields
            : /cloudflare api url|failed to fetch|networkerror/i.test(message)
              ? t.registrationServiceUnavailable
              : message || t.registrationServiceUnavailable,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 text-start">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showPayment ? (
              <button
                type="button"
                onClick={() => { setShowPayment(false); setShowAccessChoice(true); }}
                className="inline-flex items-center gap-2 text-sm font-bold text-white cursor-pointer"
              >
                {currentLang === 'ar' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                <span>{t.registerBtn}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer mr-1"
                  title="Back to Home"
                >
                  {currentLang === 'ar' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                  <span>{t.backToMain}</span>
                </button>
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold">{isLogin ? t.signInLabel : t.registerBtn}</h2>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded"
            aria-label={t.closeLabel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showAccessChoice ? (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                {currentLang === 'ar' ? 'مرحباً بك' : currentLang === 'fr' ? 'Bienvenue' : currentLang === 'es' ? 'Bienvenido' : currentLang === 'it' ? 'Benvenuto' : 'Welcome'}
              </h3>
              <p className="text-sm text-slate-600">
                {currentLang === 'ar' ? 'اختر ما تريد القيام به للمتابعة.' : currentLang === 'fr' ? 'Choisissez comment continuer.' : currentLang === 'es' ? 'Elige cómo quieres continuar.' : currentLang === 'it' ? 'Scegli come continuare.' : 'Choose how you would like to continue.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setShowAccessChoice(false); setError(null); }}
              className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-3 text-sm font-black text-white transition"
            >
              {t.createAccountLabel}
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(true); setShowAccessChoice(false); setError(null); }}
              className="w-full rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition"
            >
              {t.signInLabel}
            </button>
            <button
              type="button"
              onClick={() => { setShowAccessChoice(false); setShowPayment(true); }}
              className="w-full text-center text-xs font-bold text-indigo-700 hover:text-indigo-900 underline"
            >
              {t.paymentBtn}
            </button>
          </div>
        ) : showPayment ? (
          <div className="p-5 space-y-5">
            <div className="text-center space-y-2">
              <CreditCard className="mx-auto h-10 w-10 text-indigo-700" />
              <h3 className="text-lg font-black text-slate-900">{t.paymentTitle}</h3>
              <p className="text-sm font-semibold text-slate-700">{t.paymentDescription}</p>
            </div>
            {schoolPayment.paymentMethod === 'unset' || !schoolPayment.paymentValue ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm font-semibold text-amber-900">{currentLang === 'ar' ? 'لم يحدد المدير طريقة الدفع بعد. يرجى التواصل معه.' : currentLang === 'fr' ? 'Le Directeur n’a pas encore configuré le paiement. Veuillez le contacter.' : currentLang === 'es' ? 'El Director aún no ha configurado el pago. Ponte en contacto con él.' : currentLang === 'it' ? 'Il Direttore non ha ancora configurato il pagamento. Contattalo.' : 'The Director has not configured a payment method yet. Please contact the Director.'}</p>
            ) : <a
              href={schoolPayment.paymentMethod === 'whatsapp' ? 'https://wa.me/' + schoolPayment.paymentValue.replace(/\D/g, '') : schoolPayment.paymentMethod === 'phone' ? 'tel:' + schoolPayment.paymentValue : schoolPayment.paymentMethod === 'email' ? 'mailto:' + schoolPayment.paymentValue : schoolPayment.paymentValue}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-xl bg-indigo-700 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-800"
            >
              {schoolPayment.paymentMethod === 'whatsapp' ? (currentLang === 'ar' ? 'فتح واتساب' : currentLang === 'fr' ? 'Ouvrir WhatsApp' : currentLang === 'es' ? 'Abrir WhatsApp' : currentLang === 'it' ? 'Apri WhatsApp' : 'Open WhatsApp') : schoolPayment.paymentMethod === 'phone' ? (currentLang === 'ar' ? 'اتصال بالمدير' : currentLang === 'fr' ? 'Appeler le directeur' : currentLang === 'es' ? 'Llamar al director' : currentLang === 'it' ? 'Chiama il direttore' : 'Call Director') : schoolPayment.paymentMethod === 'email' ? (currentLang === 'ar' ? 'مراسلة المدير' : currentLang === 'fr' ? 'Écrire au directeur' : currentLang === 'es' ? 'Escribir al director' : currentLang === 'it' ? 'Scrivi al direttore' : 'Email Director') : schoolPayment.paymentMethod === 'bank' ? (currentLang === 'ar' ? 'فتح رابط الدفع المصرفي' : currentLang === 'fr' ? 'Ouvrir le paiement bancaire' : currentLang === 'es' ? 'Abrir pago bancario' : currentLang === 'it' ? 'Apri pagamento bancario' : 'Open bank payment') : t.paymentProvider}
            </a>}
          </div>
        ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {!isLogin && <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.accountTypeLabel}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer border ${
                  role === 'student'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.roleStudent}
              </button>
              <button
                type="button"
                onClick={() => setRole('educator')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer border ${
                  role === 'educator'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.roleTeacher}
              </button>
              <button
                type="button"
                onClick={() => { setRole('director'); setDirectorRequestSaved(''); setError(null); }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer border ${
                  role === 'director'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {currentLang === 'ar' ? 'مدير' : currentLang === 'fr' ? 'Directeur' : currentLang === 'es' ? 'Director' : currentLang === 'it' ? 'Direttore' : 'Director'}
              </button>
            </div>
          </div>}

          {(isLogin || role !== 'director') && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.usernameLabel}
            </label>
            <input
              type="text"
              required
              autoComplete={isLogin ? 'username' : 'username'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isLogin ? (currentLang === 'ar' ? 'اسم المستخدم أو البريد الإلكتروني' : currentLang === 'fr' ? 'Nom d’utilisateur ou e-mail' : currentLang === 'es' ? 'Usuario o correo electrónico' : currentLang === 'it' ? 'Nome utente o e-mail' : 'Username or email') : t.usernamePlaceholder}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
            />
          </div>
          )}

          {!isLogin && role !== 'director' && <div>
            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="registration-grade">
              {currentLang === 'ar' ? 'الصف (اختياري عند إدخال اسم صف جديد)' : currentLang === 'fr' ? 'Niveau (facultatif si vous saisissez une nouvelle classe)' : currentLang === 'es' ? 'Curso (opcional si introduce una clase nueva)' : currentLang === 'it' ? 'Classe (facoltativa se inserisci una nuova classe)' : 'Grade (optional when entering a new class name)'}
            </label>
            <select
              id="registration-grade"
              value={registeredGradeId}
              onChange={(event) => setRegisteredGradeId(event.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
            >
              <option value="">
                {isLoadingGrades ? t.registrationLoadingGrades : registrationGrades.length ? t.registrationChooseGrade : t.registrationNoGrades}
              </option>
              {registrationGrades.map((gradeId) => (
                <option key={gradeId} value={gradeId}>
                  {gradeLabel(gradeId)}
                </option>
              ))}
            </select>
          </div>}

          {!isLogin && role === 'educator' && (
            <label className="block text-xs font-bold text-slate-700">
              {currentLang === 'ar' ? 'اسم الصف أو الحصة التي ستُنشئها' : currentLang === 'fr' ? 'Nom de votre nouvelle classe / séance' : currentLang === 'es' ? 'Nombre de tu nueva clase / sesión' : currentLang === 'it' ? 'Nome della tua nuova classe / lezione' : 'Your new class / session name'}
              <input
                required
                minLength={2}
                maxLength={160}
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
                placeholder={currentLang === 'ar' ? 'مثال: صف الرياضيات EB8' : currentLang === 'fr' ? 'Ex. : Classe de mathématiques EB8' : currentLang === 'es' ? 'Ej.: Clase de matemáticas EB8' : currentLang === 'it' ? 'Es.: Classe di matematica EB8' : 'e.g. Mathematics Class EB8'}
                className="mt-1 w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              />
              <span className="mt-1 block text-[10px] font-medium text-slate-500">
                {currentLang === 'ar' ? 'سيُنشأ هذا الصف ويُربط بحسابك تلقائياً.' : currentLang === 'fr' ? 'Cette classe sera créée et attribuée automatiquement à votre compte.' : currentLang === 'es' ? 'Esta clase se creará y se asignará automáticamente a tu cuenta.' : currentLang === 'it' ? 'Questa classe verrà creata e assegnata automaticamente al tuo account.' : 'This class will be created and assigned to your account automatically.'}
              </span>
            </label>
          )}

          {/* Full Name */}
          {!isLogin && <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.fullNameLabel}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.fullNamePlaceholder}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
            />
          </div>}

          {/* Email / Phone */}
          {!isLogin && role === 'director' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {currentLang === 'ar' ? 'اسم المدرسة' : currentLang === 'fr' ? 'Nom de l’école' : currentLang === 'es' ? 'Nombre de la escuela' : currentLang === 'it' ? 'Nome della scuola' : 'School name'}
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={160}
                value={directorSchoolName}
                onChange={(event) => setDirectorSchoolName(event.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
              />
            </div>
          )}

          {!isLogin && <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.emailLabel}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.phoneLabel}
              </label>
              <input
                type="tel"
                required={!isLogin && role === 'director'}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
              />
            </div>
          </div>}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.passwordLabel}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={isLogin ? 'current-password' : 'off'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full text-xs p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer" title={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          {!isLogin && role !== 'director' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {role === 'student' ? t.schoolOrGradeLabel : t.educatorSubjectLabel}
              </label>
              <input
                type="text"
                value={schoolOrSubject}
                onChange={(event) => setSchoolOrSubject(event.target.value)}
                placeholder={role === 'student' ? t.schoolPlaceholder : t.educatorSubjectPlaceholder}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              />
            </div>
          )}
          {directorRequestSaved && (
            <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              {directorRequestSaved}
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

                    {/* All registered educators from Cloudflare */}
          {!isLogin && role === 'student' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-700">
                  {currentLang === 'ar' ? 'اختر الأستاذ المسجل:' : currentLang === 'fr' ? 'Choisissez votre éducateur :' : currentLang === 'es' ? 'Elige tu educador registrado:' : currentLang === 'it' ? 'Scegli il tuo educatore registrato:' : 'Select your registered educator:'}
                </label>

                <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
                  {educatorsList.length}{' '}
                  {currentLang === 'ar' ? 'أساتذة مسجلون' : currentLang === 'fr' ? 'éducateurs inscrits' : currentLang === 'es' ? 'educadores registrados' : currentLang === 'it' ? 'educatori registrati' : 'registered educators'}
                </span>
              </div>

              {isLoadingEducators ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  {currentLang === 'ar' ? 'جارٍ تحميل جميع الأساتذة المسجلين...' : currentLang === 'fr' ? 'Chargement des éducateurs inscrits...' : currentLang === 'es' ? 'Cargando educadores registrados...' : currentLang === 'it' ? 'Caricamento degli educatori registrati...' : 'Loading registered educators...'}
                </div>
              ) : educatorsList.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  {currentLang === 'ar' ? 'لا يوجد أساتذة مسجلون حالياً.' : currentLang === 'fr' ? 'Aucun éducateur inscrit n’est disponible pour le moment.' : currentLang === 'es' ? 'Todavía no hay educadores registrados disponibles.' : currentLang === 'it' ? 'Non ci sono ancora educatori registrati disponibili.' : 'No registered educators are available yet.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1">
                  {educatorsList.map((educator) => {
                    const isSelected =
                      selectedEducatorId === educator.id;

                    return (
                      <button
                        key={educator.id}
                        type="button"
                        onClick={() => {
                          setError(null);
                          setSelectedEducatorId(educator.id);
                          setRegisteredGradeId(educator.gradeId);
                        }}
                        className={`p-3 rounded-xl border text-start transition flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs">
                            {educator.name}
                          </span>

                          {isSelected && (
                            <span className="text-xs font-black">✓</span>
                          )}
                        </div>

                        <span
                          className={`text-[10px] ${
                            isSelected
                              ? 'text-emerald-100'
                              : 'text-slate-500'
                          }`}
                        >
                          {educator.subject}
                        </span>

                        <span
                          className={`text-[10px] font-semibold ${
                            isSelected
                              ? 'text-emerald-100'
                              : 'text-slate-500'
                          }`}
                        >
                          {educator.gradeId.toUpperCase()}
                        </span>

                        <span
                          className={`text-[10px] font-bold ${
                            isSelected
                              ? 'text-emerald-100'
                              : educator.hasAssignedClassroom
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                          }`}
                        >
                          {educator.hasAssignedClassroom
                            ? currentLang === 'ar' ? 'صف محدد' : currentLang === 'fr' ? 'Classe attribuée' : currentLang === 'es' ? 'Clase asignada' : currentLang === 'it' ? 'Classe assegnata' : 'Classroom assigned'
                            : currentLang === 'ar' ? 'سيتم تعيين الصف لاحقاً' : currentLang === 'fr' ? 'Classe à attribuer ultérieurement' : currentLang === 'es' ? 'Clase pendiente de asignación' : currentLang === 'it' ? 'Classe da assegnare' : 'Classroom to be assigned later'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedEducator && (
                <p className="text-[11px] font-bold text-emerald-700">
                  {currentLang === 'ar' ? `الأستاذ المختار: ${selectedEducator.name}` : currentLang === 'fr' ? `Éducateur choisi : ${selectedEducator.name}` : currentLang === 'es' ? `Educador seleccionado: ${selectedEducator.name}` : currentLang === 'it' ? `Educatore selezionato: ${selectedEducator.name}` : `Selected educator: ${selectedEducator.name}`}
                </p>
              )}
            </div>
          )}
          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? isLogin ? t.signingInLabel : t.creatingAccountLabel
                  : isLogin ? t.signInLabel : t.createAccountLabel}
              </span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setShowAccessChoice(true); setError(null); }}
            className="w-full text-center text-xs font-semibold text-slate-500 underline"
          >
            {currentLang === 'ar' ? 'العودة إلى الخيارات' : currentLang === 'fr' ? 'Retour aux options' : currentLang === 'es' ? 'Volver a las opciones' : currentLang === 'it' ? 'Torna alle opzioni' : 'Back to options'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};
