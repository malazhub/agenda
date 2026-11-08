import React from 'react';
import { Language, UserProfile } from '../types';
import { translations } from '../translations';
import { UserPlus, LogOut, Share2 } from 'lucide-react';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: 'agenda' | 'tutors' | 'archive' | 'classroom' | 'guide';
  onTabChange: (tab: 'agenda' | 'tutors' | 'archive' | 'classroom' | 'guide') => void;
  userProfile: UserProfile;
  onRoleChange: (role: 'student' | 'teacher') => void;
  onOpenRegister: () => void;
  signedInName?: string;
  onOpenArchiveSessions?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  onTabChange,
  onOpenRegister,
  signedInName,
  onSignOut,
}) => {
  const t = translations[currentLang];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
          {/* Left Side: Register OR Sign Out action */}
          <div className="flex flex-wrap items-center gap-2 justify-start order-2 md:order-1">
            {signedInName ? (
              /* Sign Out Card (Displayed when user is signed in) */
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
                <span className="max-w-40 truncate text-xs font-bold text-slate-800" title={signedInName}>
                  {signedInName}
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-bold text-xs transition cursor-pointer"
                  title="Sign out and return to guest mode"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{currentLang === 'ar' ? 'خروج' : currentLang === 'fr' ? 'Quitter' : 'Sign Out'}</span>
                </button>
              </div>
            ) : (
              /* Register Card (Returns when in guest mode / signed out) */
              <button
                type="button"
                onClick={onOpenRegister}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.registerBtn}</span>
              </button>
            )}
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

          {/* Right Side: Share Button & 3 Languages */}
          <div className="flex items-center justify-end gap-2 order-3">
            {/* Share Agenda Platform Button */}
            <button
              type="button"
              onClick={async () => {
                const shareUrl = 'https://malazhub.github.io/agenda/';
                const shareData = {
                  title: 'Agenda',
                  text: currentLang === 'ar' ? 'منصة Agenda للتعليم والدروس الخصوصية' : 'Agenda Educational Platform',
                  url: shareUrl,
                };
                if (navigator.share) {
                  try {
                    await navigator.share(shareData);
                  } catch {}
                } else {
                  await navigator.clipboard.writeText(shareUrl);
                  alert(
                    currentLang === 'ar'
                      ? 'تم نسخ رابط المنصة: https://malazhub.github.io/agenda/'
                      : currentLang === 'fr'
                      ? 'Lien copié: https://malazhub.github.io/agenda/'
                      : 'Link copied: https://malazhub.github.io/agenda/'
                  );
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer shadow-2xs mr-1"
              title="Share Agenda"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{currentLang === 'ar' ? 'مشاركة' : currentLang === 'fr' ? 'Partager' : 'Share'}</span>
            </button>
            {/* Arabic: Vibrant Emerald Green */}
            <button
              type="button"
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
              type="button"
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
              type="button"
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
