import React from 'react';
import { Language, UserProfile } from '../types';
import { translations } from '../translations';
import { UserPlus, LogOut, Share2 } from 'lucide-react';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: 'agenda' | 'tutors' | 'archive' | 'classroom' | 'guide';
  userProfile: UserProfile;
  onRoleChange: (role: 'student' | 'teacher') => void;
  onOpenRegister: () => void;
  signedInName?: string;
  schoolName?: string;
  schoolId?: string;
  onOpenArchiveSessions?: () => void;
  onSignOut?: () => void;
  isOwner?: boolean;
  onOpenOwner?: () => void;
  compact?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  onOpenRegister,
  signedInName,
  schoolName,
  schoolId = 'default-agenda-school',
  onSignOut,
  isOwner = false,
  onOpenOwner,
  compact = false,
}) => {
  const t = translations[currentLang];

  if (compact) {
    return (
      <header className="sticky top-0 z-40 shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="w-full px-3 py-2">
          <span className="block truncate text-center text-lg font-black tracking-tight text-slate-900">
            {schoolName || 'Agenda'}
          </span>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 py-2">
        <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(180px,0.8fr)_minmax(0,1.3fr)] items-center gap-x-2 gap-y-2">
          {/* Left Side: Register OR Sign Out action */}
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2 justify-start order-2 sm:order-2 xl:order-1">
            {signedInName ? (
              /* Sign Out Card (Displayed when user is signed in) */
              <div className="flex min-w-0 items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2 sm:px-2.5 py-1 shadow-xs">
                <span className="max-w-28 sm:max-w-40 truncate text-[10px] sm:text-xs font-bold text-slate-800" title={signedInName}>
                  {signedInName}
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="ml-0.5 flex shrink-0 items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-bold text-[10px] sm:text-xs transition cursor-pointer"
                  title={currentLang === 'ar' ? 'تسجيل الخروج والعودة كضيف' : currentLang === 'fr' ? 'Se déconnecter et revenir en mode invité' : currentLang === 'es' ? 'Cerrar sesión y volver como invitado' : currentLang === 'it' ? 'Esci e torna come ospite' : 'Sign out and return to guest mode'}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{currentLang === 'ar' ? 'خروج' : currentLang === 'fr' ? 'Déconnexion' : currentLang === 'es' ? 'Cerrar sesión' : currentLang === 'it' ? 'Esci' : 'Sign Out'}</span>
                </button>
              </div>
            ) : (
              /* Register Card (Returns when in guest mode / signed out) */
              <button
                type="button"
                onClick={onOpenRegister}
                className="flex shrink-0 items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.registerBtn}</span>
              </button>
            )}
            {/* Share Agenda Platform Button */}
            <button
              type="button"
              onClick={async () => {
                // Every share action intentionally distributes the single
                // canonical owner/platform entry point, never a school-specific URL.
                const shareUrl = 'https://agenda.mycamp.workers.dev/';
                const shareData = {
                  title: schoolName || 'Agenda',
                  text: currentLang === 'ar' ? `منصة ${schoolName || 'Agenda'} للتعليم والدروس الخصوصية` : currentLang === 'fr' ? `Plateforme éducative ${schoolName || 'Agenda'}` : currentLang === 'es' ? `Plataforma educativa ${schoolName || 'Agenda'}` : currentLang === 'it' ? `Piattaforma educativa ${schoolName || 'Agenda'}` : `${schoolName || 'Agenda'} Educational Platform`,
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
                      ? `تم نسخ رابط المدرسة: ${shareUrl}`
                      : currentLang === 'fr'
                      ? 'Lien de l’établissement copié.'
                      : currentLang === 'es' ? 'Enlace de la escuela copiado.' : currentLang === 'it' ? 'Link della scuola copiato.' : 'School link copied.'
                  );
                }
              }}
              className="flex shrink-0 items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer shadow-2xs mr-0.5"
              title={currentLang === 'ar' ? 'مشاركة رابط المدرسة' : currentLang === 'fr' ? 'Partager le lien de l’établissement' : currentLang === 'es' ? 'Compartir enlace de la escuela' : currentLang === 'it' ? 'Condividi il link della scuola' : 'Share school link'}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{currentLang === 'ar' ? 'مشاركة' : currentLang === 'fr' ? 'Partager' : currentLang === 'es' ? 'Compartir' : currentLang === 'it' ? 'Condividi' : 'Share'}</span>
            </button>
          </div>

          {/* Middle of Top Bar: Agenda without 'A' logo and without dot, with 'التعليم والدروس الخصوصية' in RED, YELLOW, BLUE */}
          <div className="flex min-w-0 items-center justify-center order-1 sm:col-span-2 xl:col-span-1 xl:order-2">
            <div className="min-w-0 max-w-full text-center">
              <span className="block max-w-full truncate px-1 text-lg sm:text-xl xl:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                {schoolName || 'Agenda'}
              </span>
                            {/* Subtitle follows the selected language; keep the original colors. */}
              <span className="inline-block max-w-full text-[10px] sm:text-xs xl:text-sm font-black tracking-wide leading-snug">
                {currentLang === 'ar' ? (
                  <>
                    <span className="text-rose-600">التعليم </span>
                    <span className="text-amber-500">والدروس </span>
                    <span className="text-blue-600">الخصوصية</span>
                  </>
                ) : currentLang === 'fr' ? (
                  <>
                    <span className="text-rose-600">Éducation </span>
                    <span className="text-amber-500">et cours </span>
                    <span className="text-blue-600">particuliers</span>
                  </>
                ) : currentLang === 'es' ? (
                  <>
                    <span className="text-rose-600">Educación </span>
                    <span className="text-amber-500">y clases </span>
                    <span className="text-blue-600">particulares</span>
                  </>
                ) : currentLang === 'it' ? (
                  <>
                    <span className="text-rose-600">Istruzione </span>
                    <span className="text-amber-500">e lezioni </span>
                    <span className="text-blue-600">private</span>
                  </>
                ) : (
                  <>
                    <span className="text-rose-600">Education </span>
                    <span className="text-amber-500">& Private </span>
                    <span className="text-blue-600">Tutoring</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Right Side: Share Button & 3 Languages */}
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1 sm:gap-1.5 order-3 sm:order-3 xl:order-3">
            {isOwner && <button type="button" onClick={onOpenOwner} className="rounded-lg bg-amber-100 px-2 sm:px-2.5 py-1.5 text-[10px] sm:text-xs font-black text-amber-900">{currentLang === 'ar' ? 'لوحة المالك' : currentLang === 'fr' ? 'Contrôle propriétaire' : currentLang === 'es' ? 'Panel del propietario' : currentLang === 'it' ? 'Pannello proprietario' : 'Owner Control'}</button>}
            
            {/* Arabic: Vibrant Emerald Green */}
            <button
              type="button"
              onClick={() => onLanguageChange('ar')}
              className={`shrink-0 px-2 sm:px-2.5 xl:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition cursor-pointer border ${
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

            {/* Italian */}
            <button type="button" onClick={() => onLanguageChange('it')} className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${currentLang === 'it' ? 'bg-green-700 text-white border-green-700 shadow-sm scale-105' : 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'}`}>
              Italiano
            </button>

            {/* Spanish */}
            <button type="button" onClick={() => onLanguageChange('es')} className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${currentLang === 'es' ? 'bg-red-600 text-white border-red-600 shadow-sm scale-105' : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'}`}>
              Español
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
