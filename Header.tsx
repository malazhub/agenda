import React from 'react';
import { Language, UserProfile } from '../types';
import { translations } from '../translations';
import { CreditCard, UserPlus } from 'lucide-react';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: 'agenda' | 'tutors' | 'archive' | 'classroom' | 'guide';
  onTabChange: (tab: 'agenda' | 'tutors' | 'archive' | 'classroom' | 'guide') => void;
  userProfile: UserProfile;
  onRoleChange: (role: 'student' | 'teacher') => void;
  onOpenRegister: () => void;
  onOpenPayment: () => void;
  onOpenArchiveSessions?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  onTabChange,
  onOpenRegister,
  onOpenPayment
}) => {
  const t = translations[currentLang];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
          {/* Left Side: Register and payment actions */}
          <div className="flex flex-wrap items-center gap-2 justify-start order-2 md:order-1">
            <button
              onClick={onOpenRegister}
              className="flex items-center gap-1.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.registerBtn}</span>
            </button>
            <button
              onClick={onOpenPayment}
              className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{t.paymentBtn}</span>
            </button>
          </div>

          {/* Middle of Top Bar: Agenda without 'A' logo and without dot, with 'التعليم والدروس الخصوصية' in RED, YELLOW, BLUE */}
          <div 
            onClick={() => onTabChange('tutors')}
            className="flex items-center justify-center cursor-pointer order-1 md:order-2"
          >
            <div className="text-center">
              <span className="text-2xl font-black tracking-tight text-slate-900 block leading-tight">
                Agenda
              </span>
              {/* Text colored in Red, Yellow, Blue */}
              <span className="text-xs sm:text-sm font-black tracking-wide inline-block leading-snug">
                <span className="text-rose-600">التعليم </span>
                <span className="text-amber-500">والدروس </span>
                <span className="text-blue-600">الخصوصية</span>
              </span>
            </div>
          </div>

          {/* Right Side: 3 Languages with 3 DIFFERENT DISTINCT COLORS */}
          <div className="flex items-center justify-end gap-2 order-3">
            {/* Arabic: Vibrant Emerald Green */}
            <button
              onClick={() => onLanguageChange('ar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                currentLang === 'ar'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              العربية
            </button>

            {/* French: Vibrant Royal Blue */}
            <button
              onClick={() => onLanguageChange('fr')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                currentLang === 'fr'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-105'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              Français
            </button>

            {/* English: Vibrant Amber / Orange */}
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                currentLang === 'en'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm scale-105'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
