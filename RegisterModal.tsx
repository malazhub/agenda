import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { UserPlus, X, CheckCircle2 } from 'lucide-react';
import { registerAccount } from '../services/cloudflareApi';
import type { CloudflareAccount } from '../services/cloudflareApi';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  onRegisterSuccess: (account: CloudflareAccount) => void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { account, token } = await registerAccount({
        username,
        password,
        role,
        fullName: name,
        email,
        phone,
        schoolOrSubject,
        gradeId: '',
      });
      sessionStorage.setItem('agenda-session-token', token);
      onRegisterSuccess(account);
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create the account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden text-start">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold">
              {t.registerBtn}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              نوع الحساب
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم المستخدم
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
              placeholder="username"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الاسم الكامل
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: كريم خوري"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
            />
          </div>

          {/* Email / Phone */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البريد الإلكتروني
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
                رقم الهاتف (لبنان)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+961 70 123 456"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
              />
            </div>
          </div>

          {/* Stream & School */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                كلمة المرور
              </label>
              <input
                type="password"
                required
                minLength={12}
                maxLength={256}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="12 حرفاً على الأقل"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {role === 'student' ? 'المدرسة / الصف' : 'المادة التعليمية'}
              </label>
              <input
                type="text"
                value={schoolOrSubject}
                onChange={(e) => setSchoolOrSubject(e.target.value)}
                placeholder={role === 'student' ? 'مثال: Terminale SG' : 'مثال: رياضيات وفيزياء'}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              />
            </div>
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
              disabled={isSubmitting}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
