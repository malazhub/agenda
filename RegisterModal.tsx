import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { UserPlus, X, CheckCircle2, CreditCard, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { getRegistrationGrades, loginAccount, registerAccount } from '../services/cloudflareApi';
import type { CloudflareAccount } from '../services/cloudflareApi';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  onRegisterSuccess: (account: CloudflareAccount, token: string) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onRegisterSuccess
}) => {
  const t = translations[currentLang];
  const [role, setRole] = useState<'student' | 'educator'>('student');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [schoolOrSubject, setSchoolOrSubject] = useState('');
  const [registeredGradeId, setRegisteredGradeId] = useState('');
  const [selectedEducatorId, setSelectedEducatorId] = useState<string>('');
  const [registrationGrades, setRegistrationGrades] = useState<string[]>([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load ONLY real registered educators (Zero hardcoded names, zero mock arrays)
  const [educatorsList, setEducatorsList] = useState<Array<{
    id: string;
    name: string;
    subject: string;
    gradeId: string;
    currentStudents: number;
    maxStudents: number;
  }>>([]);

  const loadOnlyRealRegisteredEducators = () => {
    let list: any[] = [];

    // 1. Pull real educators who registered on the platform
    try {
      const stored = localStorage.getItem('agenda_registered_educators');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Permanently purge any old mock entries from previous browser storage
          const realOnly = parsed.filter((e: any) => {
            const n = (e.name || '').toLowerCase();
            const id = (e.id || '').toLowerCase();
            return (
              !id.startsWith('ex_') &&
              !id.startsWith('edu_1') &&
              !id.startsWith('edu_2') &&
              !id.startsWith('edu_3') &&
              !id.startsWith('edu_4') &&
              !n.includes('مثال') &&
              !n.includes('example')
            );
          });
          list = realOnly;
          localStorage.setItem('agenda_registered_educators', JSON.stringify(realOnly));
        }
      }
    } catch {}

    // 2. Pull real educators added by the Director in the Director panel
    try {
      const directorSaved = localStorage.getItem('director_saved_sessions');
      if (directorSaved) {
        const parsedSessions = JSON.parse(directorSaved);
        if (Array.isArray(parsedSessions)) {
          parsedSessions.forEach((s: any) => {
            const eduName = (s.title || s.sourceName || '').trim();
            const isMock = !eduName || eduName.toLowerCase().includes('example') || eduName.toLowerCase().includes('مثال');
            if (!isMock && !list.some((e: any) => e.name.toLowerCase() === eduName.toLowerCase())) {
              list.push({
                id: `dir_edu_${s.id}`,
                name: eduName,
                subject: s.subject || 'Academic Subject',
                gradeId: s.gradeId || '',
                currentStudents: parseInt(localStorage.getItem(`students_count_${s.id}`) || '0', 10),
                maxStudents: parseInt(localStorage.getItem(`max_students_${s.id}`) || '25', 10),
              });
            }
          });
        }
      }
    } catch {}

    return list;
  };

  useEffect(() => {
    if (isOpen) {
      setEducatorsList(loadOnlyRealRegisteredEducators());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setIsLoadingGrades(true);
    getRegistrationGrades()
      .then(({ grades }) => {
        if (active) setRegistrationGrades(grades);
      })
      .catch(() => {
        if (active) setError(t.registrationServiceUnavailable);
      })
      .finally(() => {
        if (active) setIsLoadingGrades(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, t.registrationServiceUnavailable]);

  const handleClose = () => {
    setShowPayment(false);
    setIsLogin(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !registeredGradeId) {
      setError(t.registrationChooseGrade);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const { account, token } = isLogin
        ? await loginAccount(username, password)
        : await registerAccount({
            username,
            password,
            role,
            fullName: name,
            email,
            phone,
            schoolOrSubject,
            gradeId: registeredGradeId,
          });
      if (isLogin && account.role === 'director') {
        setError(t.directorSignInSeparate);
        return;
      }

      // If a real educator registers, add them to the registered list so students can select them
      if (!isLogin && role === 'educator') {
        try {
          const currentReal = JSON.parse(localStorage.getItem('agenda_registered_educators') || '[]');
          const newRealEdu = {
            id: `edu_real_${account.id || Date.now()}`,
            name: (name || account.fullName || username).trim(),
            subject: schoolOrSubject.trim() || 'Academic Subject',
            gradeId: registeredGradeId,
            currentStudents: 0,
            maxStudents: 25,
          };
          if (!currentReal.some((e: any) => e.name.toLowerCase() === newRealEdu.name.toLowerCase())) {
            currentReal.unshift(newRealEdu);
            localStorage.setItem('agenda_registered_educators', JSON.stringify(currentReal));
          }
        } catch {}
      }

      // If a student registers, link them to the chosen registered educator
      if (!isLogin && role === 'student' && selectedEducatorId) {
        const chosen = educatorsList.find(e => e.id === selectedEducatorId);
        if (chosen) {
          localStorage.setItem('registered_educator_id', chosen.id);
          localStorage.setItem('registered_educator_name', chosen.name.trim());
          localStorage.setItem('registered_grade', registeredGradeId);
        }
      }

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
                onClick={() => setShowPayment(false)}
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
                  <span>{currentLang === 'ar' ? 'الرئيسية' : 'Home'}</span>
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

        {showPayment ? (
          <div className="p-5 space-y-5">
            <div className="text-center space-y-2">
              <CreditCard className="mx-auto h-10 w-10 text-indigo-700" />
              <h3 className="text-lg font-black text-slate-900">{t.paymentTitle}</h3>
              <p className="text-sm font-semibold text-slate-700">{t.paymentDescription}</p>
            </div>
            <a
              href="https://payments.suyool.com/RluEji2qtjDlMKyk9xm4G"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-xl bg-indigo-700 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-800"
            >
              {t.paymentProvider}
            </a>
          </div>
        ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {!isLogin && <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.accountTypeLabel}
            </label>
            <div className="grid grid-cols-2 gap-2">
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
            </div>
          </div>}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.usernameLabel}
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9._-]+"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.usernamePlaceholder}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
            />
          </div>

          {!isLogin && <div>
            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="registration-grade">
              {t.registeredGradeLabel}
            </label>
            <select
              id="registration-grade"
              required
              value={registeredGradeId}
              onChange={(event) => setRegisteredGradeId(event.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
            >
              <option value="">
                {isLoadingGrades ? t.registrationLoadingGrades : registrationGrades.length ? t.registrationChooseGrade : t.registrationNoGrades}
              </option>
              {registrationGrades.map((gradeId) => (
                <option key={gradeId} value={gradeId}>
                  {gradeId.toUpperCase()}
                </option>
              ))}
            </select>
          </div>}

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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
              />
            </div>
          </div>}

          {/* Stream & School */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={1024}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full text-xs p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {!isLogin && <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {role === 'student' ? t.schoolOrGradeLabel : t.educatorSubjectLabel}
              </label>
              <input
                type="text"
                value={schoolOrSubject}
                onChange={(e) => setSchoolOrSubject(e.target.value)}
                placeholder={role === 'student' ? t.schoolPlaceholder : t.educatorSubjectPlaceholder}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              />
            </div>}
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Educator 2-Column Selection Grid for Students (ONLY Real Registered Educators - ZERO Hardcoded Names) */}
          {!isLogin && role === 'student' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  {currentLang === 'ar' ? 'اختر الأستاذ المسجل لتعليمك:' : 'Select Your Registered Educator:'}
                </label>
                {educatorsList.length > 0 && (
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
                    {educatorsList.length} {currentLang === 'ar' ? 'أساتذة مسجلون' : 'Registered Educators'}
                  </span>
                )}
              </div>

              {educatorsList.length === 0 ? (
                /* Empty state when no educators have registered yet */
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-semibold space-y-1">
                  <p className="font-bold text-slate-700">
                    {currentLang === 'ar'
                      ? 'لا يوجد أساتذة مسجلون حالياً.'
                      : 'No registered educators available yet.'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {currentLang === 'ar'
                      ? 'سيظهر أي أستاذ هنا تلقائياً بمجرد تسجيل حسابه كمعلم.'
                      : 'Educators will appear here automatically as soon as they register.'}
                  </p>
                </div>
              ) : (
                /* 2-Column Grid showing ONLY real registered educators */
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {educatorsList.map((edu) => {
                    const isSelected = selectedEducatorId === edu.id;
                    const isFull = (edu.currentStudents || 0) >= (edu.maxStudents || 25);

                    return (
                      <button
                        key={edu.id}
                        type="button"
                        onClick={() => {
                          if (isFull) {
                            setError(
                              currentLang === 'ar'
                                ? `الصف ممتلئ لدى الأستاذ (${edu.name})! لقد وصل للحد الأقصى (${edu.maxStudents} طالب). يرجى اختيار أستاذ آخر.`
                                : `Class is full for ${edu.name} (${edu.currentStudents}/${edu.maxStudents}). Please select another educator.`
                            );
                          } else {
                            setError(null);
                            setSelectedEducatorId(edu.id);
                            localStorage.setItem('registered_educator_id', edu.id);
                            localStorage.setItem('registered_educator_name', edu.name.trim());
                            localStorage.setItem('registered_grade', registeredGradeId || 'Grade 12 LH');
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300'
                            : isFull
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-80'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-xs truncate">{edu.name}</span>
                          {isSelected && <span className="text-[10px] font-black">✓</span>}
                        </div>

                        <span className={`text-[10px] mt-1 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                          {edu.subject}
                        </span>

                        <span className={`text-[9px] mt-1 font-semibold ${isFull ? 'text-rose-600' : isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {isFull ? (currentLang === 'ar' ? 'الصف ممتلئ' : 'Class Full') : `${edu.currentStudents || 0}/${edu.maxStudents || 25} ${currentLang === 'ar' ? 'طالب' : 'Students'}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || (!isLogin && (isLoadingGrades || registrationGrades.length === 0))}
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
            onClick={() => {
              setIsLogin((value) => !value);
              setError(null);
            }}
            className="w-full text-center text-xs font-bold text-indigo-700 underline"
          >
            {isLogin ? t.switchToRegister : t.signInPrompt}
          </button>
          {!isLogin && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950">{t.paymentTitle}</span>
              <button 
                type="button" 
                onClick={() => setShowPayment(true)} 
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
              >
                {t.paymentBtn}
              </button>
            </div>
          )}
        </form>
        )}
      </div>
    </div>
  );
};
