import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { UserPlus, X, CheckCircle2, CreditCard, ArrowLeft, ArrowRight } from 'lucide-react';
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
  const [schoolOrSubject, setSchoolOrSubject] = useState('');
  const [registeredGradeId, setRegisteredGradeId] = useState('');
  const [registrationGrades, setRegistrationGrades] = useState<string[]>([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
                className="inline-flex items-center gap-2 text-sm font-bold text-white"
              >
                {currentLang === 'ar' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                <span>{t.registerBtn}</span>
              </button>
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold">{isLogin ? t.signInLabel : t.registerBtn}</h2>
              </>
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
              <input
                type="password"
                required
                maxLength={1024}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
              />
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
          {!isLogin && <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-indigo-950">{t.paymentTitle}</span>
              <button type="button" onClick={() => setShowPayment(true)} className="text-xs font-bold text-indigo-700 underline">
                {t.paymentBtn}
              </button>
            </div>
            <p className="text-xs font-semibold text-indigo-900">{t.paymentDescription}</p>
            <a
              href="https://payments.suyool.com/RluEji2qtjDlMKyk9xm4G"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-lg bg-indigo-700 px-3 py-2 text-xs font-black text-white hover:bg-indigo-800"
            >
              {t.paymentProvider}
            </a>
          </div>}
        </form>
        )}
      </div>
    </div>
  );
};
