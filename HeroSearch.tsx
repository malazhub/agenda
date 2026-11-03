import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { 
  Search, 
  Sparkles, 
  Users, 
  BookOpen, 
  FileText, 
  Video, 
  Calendar, 
  Compass, 
  Star, 
  ArrowRight,
  Calculator,
  Atom,
  Dna,
  Coins,
  Globe2,
  Code
} from 'lucide-react';

interface HeroSearchProps {
  currentLang: Language;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectCategory: (cat: string) => void;
  activeCategory: string;
  onNavigateTab: (tab: 'agenda' | 'tutors' | 'archive' | 'classroom' | 'guide') => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  currentLang,
  searchQuery,
  onSearchChange,
  onSelectCategory,
  activeCategory,
  onNavigateTab
}) => {
  const t = translations[currentLang];

  const quickSubjects = [
    { id: 'math', label: 'Mathématiques / رياضيات', color: 'from-blue-600 to-indigo-600', icon: Calculator },
    { id: 'physics', label: 'Physique / فيزياء', color: 'from-purple-600 to-violet-700', icon: Atom },
    { id: 'biology', label: 'Biologie (SVT)', color: 'from-emerald-500 to-teal-700', icon: Dna },
    { id: 'economics', label: 'Économie / اقتصاد', color: 'from-amber-500 to-orange-600', icon: Coins },
    { id: 'arabic', label: 'اللغة العربية', color: 'from-rose-500 to-pink-600', icon: BookOpen },
    { id: 'french', label: 'Français / English', color: 'from-sky-500 to-cyan-600', icon: Globe2 },
  ];

  return (
    <div className="space-y-8">
      {/* Top Hero Section: Inspiring, Bold, Multi-Colored */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-10 lg:p-12 shadow-2xl border border-white/10">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5">
          {/* Tagline Badge with multiple colors */}
          <div className="inline-flex items-center gap-2 bg-linear-to-r from-amber-400/20 via-emerald-400/20 to-teal-400/20 border border-emerald-400/40 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>K-12 Education & Certified 1-on-1 Tutoring • 7$ Flat Rate</span>
          </div>

          {/* Main User Requested Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            {t.heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-slate-200 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            {t.heroSubtitle}
          </p>

          {/* Prominent Search Bar */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl p-1.5 border-2 border-emerald-400/50 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-400/20 transition">
              <Search className="w-5 h-5 text-slate-400 ml-3 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 bg-transparent focus:outline-hidden py-2"
              />
              <button
                onClick={() => onNavigateTab('tutors')}
                className="bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-md shrink-0 cursor-pointer"
              >
                {t.searchBtn}
              </button>
            </div>
          </div>

          {/* Colorful Quick Subject Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {quickSubjects.map(sub => {
              const Icon = sub.icon;
              return (
                <button
                  key={sub.id}
                  onClick={() => onSearchChange(sub.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition text-white shadow-xs cursor-pointer bg-linear-to-r ${sub.color} hover:scale-105 active:scale-95`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visual Collage of Learners & Educational Offerings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {currentLang === 'ar' ? 'استكشف مسارات التعليم المتكاملة' : 'Explore Learning Paths & Activities'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {t.heroCollageTitle}
            </p>
          </div>
        </div>

        {/* 4 Colorful Interactive Collage Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: 1-on-1 Tutoring (Vibrant Amber / Gold) */}
          <div 
            onClick={() => onNavigateTab('tutors')}
            className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-amber-500 via-amber-600 to-orange-700 p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-black bg-white text-slate-950 px-2 py-0.5 rounded-md shadow-xs">
                7$ / Session
              </span>
            </div>
            <h3 className="font-extrabold text-base text-white group-hover:underline">
              {currentLang === 'ar' ? 'دروس خصوصية فردية' : '1-on-1 Live Tutoring'}
            </h3>
            <p className="text-xs text-amber-100 font-medium mt-1 leading-relaxed">
              {currentLang === 'ar' ? 'نخبة من أساتذة كبرى المدارس لمتابعة الطالب خطوة بخطوة.' : 'Certified teachers from top schools providing tailored academic coaching.'}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-white">
              <span>{currentLang === 'ar' ? 'احجز مدرّساً' : 'Find a Tutor'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Official Exam Prep & Barèmes (Vibrant Emerald / Cyan) */}
          <div 
            onClick={() => onNavigateTab('archive')}
            className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-600 via-teal-600 to-cyan-700 p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold bg-emerald-950/40 border border-white/20 text-white px-2 py-0.5 rounded-md">
                Brevet & Bac
              </span>
            </div>
            <h3 className="font-extrabold text-base text-white group-hover:underline">
              {currentLang === 'ar' ? 'الامتحانات وسلالم التصحيح' : 'Official Exams & Barème'}
            </h3>
            <p className="text-xs text-emerald-100 font-medium mt-1 leading-relaxed">
              {currentLang === 'ar' ? 'مسابقات الشهادات الرسمية وحلول نموذجية وفق معايير المركز التربوي.' : 'Past official exams with exact Barème points rubrics and model solutions.'}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-white">
              <span>{currentLang === 'ar' ? 'استعراض المسابقات' : 'Explore Exams'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: School Agenda & Homework Help (Vibrant Violet / Purple) */}
          <div 
            onClick={() => onNavigateTab('agenda')}
            className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-purple-600 via-indigo-600 to-blue-700 p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold bg-purple-950/40 border border-white/20 text-white px-2 py-0.5 rounded-md">
                Daily Prep
              </span>
            </div>
            <h3 className="font-extrabold text-base text-white group-hover:underline">
              {currentLang === 'ar' ? 'المفكرة المدرسية والفروض' : 'Daily Homework & Agenda'}
            </h3>
            <p className="text-xs text-purple-100 font-medium mt-1 leading-relaxed">
              {currentLang === 'ar' ? 'تتبع فروضك اليومية وطلب المساعدة المباشرة لحل المسائل المستعصية.' : 'Organize school assignments and solve challenging exercises with an educator.'}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-white">
              <span>{currentLang === 'ar' ? 'فتح الأجندة' : 'View Agenda'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Live Interactive Classroom (Vibrant Rose / Coral) */}
          <div 
            onClick={() => onNavigateTab('classroom')}
            className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-rose-500 via-pink-600 to-rose-700 p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold bg-rose-950/40 border border-white/20 text-white px-2 py-0.5 rounded-md">
                Live Whiteboard
              </span>
            </div>
            <h3 className="font-extrabold text-base text-white group-hover:underline">
              {currentLang === 'ar' ? 'الصف الرقمي التفاعلي' : 'Live Interactive Classroom'}
            </h3>
            <p className="text-xs text-rose-100 font-medium mt-1 leading-relaxed">
              {currentLang === 'ar' ? 'لوح رسم ومسائل رياضية وصوت وصورة في بيئة تعليمية مباشرة.' : 'Shared interactive digital board with math tools, formula inserts, and live notes.'}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-white">
              <span>{currentLang === 'ar' ? 'دخول الصف' : 'Enter Classroom'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
