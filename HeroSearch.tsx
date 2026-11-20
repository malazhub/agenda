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
    { id: 'math', label: currentLang === 'ar' ? 'رياضيات' : currentLang === 'fr' ? 'Mathématiques' : currentLang === 'es' ? 'Matemáticas' : currentLang === 'it' ? 'Matematica' : 'Mathematics', color: 'from-blue-600 to-indigo-600', icon: Calculator },
    { id: 'physics', label: currentLang === 'ar' ? 'فيزياء' : currentLang === 'fr' ? 'Physique' : currentLang === 'es' ? 'Física' : currentLang === 'it' ? 'Fisica' : 'Physics', color: 'from-purple-600 to-violet-700', icon: Atom },
    { id: 'biology', label: currentLang === 'ar' ? 'علم الأحياء' : currentLang === 'fr' ? 'Biologie (SVT)' : currentLang === 'es' ? 'Biología' : currentLang === 'it' ? 'Biologia' : 'Biology', color: 'from-emerald-500 to-teal-700', icon: Dna },
    { id: 'economics', label: currentLang === 'ar' ? 'اقتصاد' : currentLang === 'fr' ? 'Économie' : currentLang === 'es' ? 'Economía' : currentLang === 'it' ? 'Economia' : 'Economics', color: 'from-amber-500 to-orange-600', icon: Coins },
    { id: 'arabic', label: currentLang === 'ar' ? 'اللغة العربية' : currentLang === 'fr' ? 'Arabe' : currentLang === 'es' ? 'Árabe' : currentLang === 'it' ? 'Arabo' : 'Arabic', color: 'from-rose-500 to-pink-600', icon: BookOpen },
    { id: 'french', label: currentLang === 'ar' ? 'الفرنسية والإنجليزية' : currentLang === 'fr' ? 'Français et anglais' : currentLang === 'es' ? 'Francés e inglés' : currentLang === 'it' ? 'Francese e inglese' : 'French & English', color: 'from-sky-500 to-cyan-600', icon: Globe2 },
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
            <span>{currentLang === 'ar' ? 'تعليم من الروضة حتى الصف الثاني عشر ودروس فردية معتمدة' : currentLang === 'fr' ? 'Enseignement de la maternelle au lycée et cours particuliers certifiés' : currentLang === 'es' ? 'Educación desde infantil hasta secundaria y tutorías individuales certificadas' : currentLang === 'it' ? 'Istruzione dalla scuola dell’infanzia alle superiori e lezioni individuali certificate' : 'K-12 Education & Certified 1-on-1 Tutoring'}</span>
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


      {/* Decorative academic formulas collage - requested homepage feature */}
      <section aria-label="Colourful academic formulas and science facts" className="relative isolate overflow-hidden rounded-[2rem] border border-indigo-200/20 bg-[#10152f] px-4 py-7 shadow-2xl sm:px-7 sm:py-9">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_12%_18%,rgba(34,211,238,.28),transparent_35%),radial-gradient(ellipse_at_82%_22%,rgba(217,70,239,.25),transparent_32%),radial-gradient(ellipse_at_52%_100%,rgba(99,102,241,.34),transparent_45%)]"/>
        <div className="pointer-events-none absolute -right-12 top-8 -z-10 h-52 w-52 rounded-full border border-cyan-300/15"/>
        <div className="pointer-events-none absolute -bottom-24 left-1/4 -z-10 h-64 w-64 rounded-full border border-fuchsia-300/15"/>
        <div className="relative z-10 mb-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.28em] text-cyan-300">{currentLang === 'ar' ? 'الرياضيات والعلوم والجغرافيا' : currentLang === 'fr' ? 'Mathématiques · Sciences · Géographie' : currentLang === 'es' ? 'Matemáticas · Ciencias · Geografía' : currentLang === 'it' ? 'Matematica · Scienze · Geografia' : 'Mathematics · Science · Geography'}</p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-white sm:text-2xl">{currentLang === 'ar' ? 'اكتشف جمال المعرفة' : currentLang === 'fr' ? 'Découvrez la beauté du savoir' : currentLang === 'es' ? 'Descubre la belleza del conocimiento' : currentLang === 'it' ? 'Scopri la bellezza della conoscenza' : 'Discover the beauty of knowledge'}</h2>
          </div>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9px] font-bold tracking-widest text-slate-300">MATH · BIOLOGY · CHEMISTRY · PHYSICS · GEOGRAPHY</span>
        </div>
        <div className="relative z-10 flex min-h-[300px] flex-wrap items-center justify-center gap-x-3 gap-y-4 sm:min-h-[355px] sm:gap-x-5 sm:gap-y-5">
          <div className="rotate-[-3deg] rounded-2xl border border-sky-300/30 bg-sky-400/10 px-4 py-3 text-center shadow-lg backdrop-blur-sm"><span className="block text-[9px] font-black uppercase tracking-widest text-sky-200">Geometry</span><span className="block whitespace-nowrap font-serif text-2xl font-black text-white sm:text-4xl">a² + b² = c²</span></div>
          <div className="rotate-[2deg] rounded-xl border border-fuchsia-300/30 bg-fuchsia-400/10 px-3 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-fuchsia-200">Quadratic formula</span><span className="block whitespace-nowrap font-serif text-lg font-bold text-fuchsia-50 sm:text-2xl">x = (−b ± √(b²−4ac)) / 2a</span></div>
          <div className="rotate-[4deg] rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-amber-200">Circle area</span><span className="block font-serif text-3xl font-black italic text-amber-50 sm:text-4xl">A = πr²</span></div>
          <div className="rotate-[-2deg] rounded-xl border border-violet-300/30 bg-violet-400/10 px-3 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-violet-200">Sine rule</span><span className="block whitespace-nowrap font-serif text-base font-bold text-violet-50 sm:text-xl">a/sinA = b/sinB = c/sinC</span></div>
          <div className="rotate-[2deg] rounded-2xl border border-orange-300/30 bg-orange-400/10 px-4 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-orange-200">Newton's second law</span><span className="block font-mono text-3xl font-black text-orange-50 sm:text-4xl">F = ma</span></div>
          <div className="rotate-[-4deg] rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-cyan-200">Motion</span><span className="block font-serif text-xl font-black italic text-cyan-50 sm:text-2xl">v = u + at</span></div>
          <div className="rotate-[3deg] rounded-xl border border-lime-300/30 bg-lime-400/10 px-4 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-lime-200">Kinetic energy</span><span className="block font-serif text-2xl font-black text-lime-50">KE = ½mv²</span></div>
          <div className="rotate-[-2deg] rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-rose-200">Ohm's law</span><span className="block font-mono text-3xl font-black text-rose-50">V = IR</span></div>
          <div className="rotate-[2deg] rounded-xl border border-blue-300/30 bg-blue-400/10 px-3 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-blue-200">Ideal gas law</span><span className="block font-serif text-xl font-bold text-blue-50 sm:text-2xl">PV = nRT</span></div>
          <div className="rotate-[-3deg] rounded-xl border border-teal-300/30 bg-teal-400/10 px-3 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-teal-200">Heat energy</span><span className="block font-mono text-xl font-black text-teal-50">q = mcΔT</span></div>
          <div className="rotate-[3deg] rounded-xl border border-yellow-300/30 bg-yellow-400/10 px-3 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-yellow-200">Dilution</span><span className="block font-serif text-xl font-black text-yellow-50">M₁V₁ = M₂V₂</span></div>
          <div className="rotate-[-1deg] rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-emerald-200">Photosynthesis</span><span className="block text-sm font-bold text-emerald-50 sm:text-base">6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂</span></div>
          <div className="rotate-[2deg] rounded-2xl border border-pink-300/30 bg-pink-400/10 px-4 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-pink-200">Cellular respiration</span><span className="block text-sm font-bold text-pink-50 sm:text-base">C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP</span></div>
          <div className="rotate-[-3deg] rounded-xl border border-purple-300/30 bg-purple-400/10 px-3 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-purple-200">Population genetics</span><span className="block font-serif text-2xl font-black text-purple-50">p² + 2pq + q² = 1</span></div>
          <div className="rotate-[2deg] max-w-[260px] rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-cyan-200">Geography · Rivers</span><span className="block text-sm font-semibold text-cyan-50">Rivers erode and deposit sediment</span></div>
          <div className="rotate-[-2deg] max-w-[250px] rounded-xl border border-orange-300/30 bg-orange-400/10 px-4 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-orange-200">Earth science · Tectonics</span><span className="block text-sm font-semibold text-orange-50">Plates collide, forming mountains</span></div>
          <div className="rotate-[3deg] max-w-[230px] rounded-xl border border-red-300/30 bg-red-400/10 px-4 py-3 text-center shadow-lg"><span className="block text-[9px] font-black uppercase tracking-widest text-red-200">Human biology</span><span className="block text-sm font-semibold text-red-50">Blood carries oxygen to cells</span></div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-slate-400"><span>Explore</span><span className="text-cyan-300">·</span><span>Question</span><span className="text-fuchsia-300">·</span><span>Discover</span><span className="text-amber-300">·</span><span>Understand</span></div>
      </section>

      {/* Visual Collage of Learners & Educational Offerings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {currentLang === 'ar' ? 'استكشف مسارات التعليم المتكاملة' : currentLang === 'fr' ? 'Explorez les parcours et activités pédagogiques' : currentLang === 'es' ? 'Explora itinerarios y actividades educativas' : currentLang === 'it' ? 'Esplora percorsi e attività formative' : 'Explore Learning Paths & Activities'}
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
              {currentLang === 'ar' ? 'نخبة من أساتذة كبرى المدارس لمتابعة الطالب خطوة بخطوة.' : currentLang === 'fr' ? 'Des enseignants certifiés des meilleures écoles pour un accompagnement personnalisé.' : currentLang === 'es' ? 'Educadores certificados de las mejores escuelas con apoyo académico personalizado.' : currentLang === 'it' ? 'Educatori certificati delle migliori scuole per un supporto didattico personalizzato.' : 'Certified teachers from top schools providing tailored academic coaching.'}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-white">
              <span>{currentLang === 'ar' ? 'احجز مدرّساً' : currentLang === 'fr' ? 'Trouver un éducateur' : currentLang === 'es' ? 'Buscar educador' : currentLang === 'it' ? 'Trova un educatore' : 'Find a Tutor'}</span>
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
              {currentLang === 'ar' ? 'الامتحانات وسلالم التصحيح' : currentLang === 'fr' ? 'Examens officiels et barème' : currentLang === 'es' ? 'Exámenes oficiales y criterios de corrección' : currentLang === 'it' ? 'Esami ufficiali e criteri di valutazione' : 'Official Exams & Barème'}
            </h3>
            <p className="text-xs text-emerald-100 font-medium mt-1 leading-relaxed">
              {currentLang === 'ar' ? 'مسابقات الشهادات الرسمية وحلول نموذجية وفق معايير المركز التربوي.' : currentLang === 'fr' ? 'Anciens examens officiels avec barèmes détaillés et solutions types.' : currentLang === 'es' ? 'Exámenes oficiales anteriores con criterios de puntuación y soluciones modelo.' : currentLang === 'it' ? 'Esami ufficiali precedenti con criteri di valutazione e soluzioni modello.' : 'Past official exams with exact Barème points rubrics and model solutions.'}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-white">
              <span>{currentLang === 'ar' ? 'استعراض المسابقات' : currentLang === 'fr' ? 'Consulter les examens' : currentLang === 'es' ? 'Explorar exámenes' : currentLang === 'it' ? 'Esplora gli esami' : 'Explore Exams'}</span>
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
              {currentLang === 'ar' ? 'المفكرة المدرسية والفروض' : currentLang === 'fr' ? 'Devoirs quotidiens et agenda' : currentLang === 'es' ? 'Tareas diarias y agenda' : currentLang === 'it' ? 'Compiti quotidiani e agenda' : 'Daily Homework & Agenda'}
            </h3>
            <p className="text-xs text-purple-100 font-medium mt-1 leading-relaxed">
              {currentLang === 'ar' ? 'تتبع فروضك اليومية وطلب المساعدة المباشرة لحل المسائل المستعصية.' : currentLang === 'fr' ? 'Organisez les devoirs et résolvez les exercices difficiles avec un éducateur.' : currentLang === 'es' ? 'Organiza las tareas escolares y resuelve ejercicios difíciles con un educador.' : currentLang === 'it' ? 'Organizza i compiti e risolvi esercizi difficili con un educatore.' : 'Organize school assignments and solve challenging exercises with an educator.'}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-white">
              <span>{currentLang === 'ar' ? 'فتح الأجندة' : currentLang === 'fr' ? 'Voir l’agenda' : currentLang === 'es' ? 'Ver agenda' : currentLang === 'it' ? 'Visualizza agenda' : 'View Agenda'}</span>
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
              {currentLang === 'ar' ? 'الصف الرقمي التفاعلي' : currentLang === 'fr' ? 'Salle de classe interactive en direct' : currentLang === 'es' ? 'Aula interactiva en directo' : currentLang === 'it' ? 'Aula interattiva dal vivo' : 'Live Interactive Classroom'}
            </h3>
            <p className="text-xs text-rose-100 font-medium mt-1 leading-relaxed">
              {currentLang === 'ar' ? 'لوح رسم ومسائل رياضية وصوت وصورة في بيئة تعليمية مباشرة.' : currentLang === 'fr' ? 'Tableau numérique partagé avec outils mathématiques, formules et notes en direct.' : currentLang === 'es' ? 'Pizarra digital compartida con herramientas matemáticas, fórmulas y notas en directo.' : currentLang === 'it' ? 'Lavagna digitale condivisa con strumenti matematici, formule e appunti in diretta.' : 'Shared interactive digital board with math tools, formula inserts, and live notes.'}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-white">
              <span>{currentLang === 'ar' ? 'دخول الصف' : currentLang === 'fr' ? 'Entrer dans la classe' : currentLang === 'es' ? 'Entrar en el aula' : currentLang === 'it' ? 'Entra in aula' : 'Enter Classroom'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
