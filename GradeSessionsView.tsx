import React, { useState, useEffect } from 'react';
import { Language, GradeLevelDef } from '../types';
import { ArrowLeft, ArrowRight, Video, Clock, Users, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, Award, Sparkles, Play, FileText } from 'lucide-react';

interface GradeSessionsViewProps {
  currentLang: Language;
  selectedGrade: GradeLevelDef;
  onBack: () => void;
  onEnterLiveClassroom: () => void;
}

export const GradeSessionsView: React.FC<GradeSessionsViewProps> = ({
  currentLang,
  selectedGrade,
  onBack,
  onEnterLiveClassroom
}) => {
  const isRTL = currentLang === 'ar';
  const [activeTab, setActiveTab] = useState<'stored' | 'live'>('stored');

  useEffect(() => {
    const timer = setInterval(() => {
      // keep the component stable but no live content is rendered
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-start">
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-2xl transition cursor-pointer text-xs sm:text-sm shadow-2xs group"
          >
            {isRTL ? <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> : <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />}
            <span>{currentLang === 'ar' ? 'العودة إلى اختيار الصفوف' : 'Back to Grades'}</span>
          </button>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-100">
                {selectedGrade.cycle[currentLang]}
              </span>
              <span className="text-xs font-bold text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-500">
                {currentLang === 'ar' ? 'منهاج رسمي لبناني معتمد' : 'Certified Official Curriculum'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {selectedGrade.name[currentLang]}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('stored')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeTab === 'stored'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{currentLang === 'ar' ? 'الحصص السابقة المخزنة (20)' : 'Stored Sessions (20)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeTab === 'live'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
            <Video className="w-4 h-4" />
            <span>{currentLang === 'ar' ? 'الحصة المباشرة التفاعلية' : 'Live Interactive Session'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="text-slate-500 text-xs">
          {currentLang === 'ar'
            ? 'تم إخفاء المحتوى الداخلي وفق طلب المستخدم.'
            : currentLang === 'fr'
            ? 'Contenu interne masqué selon votre demande.'
            : 'Internal content hidden by request.'}
        </div>
      </div>
    </div>
  );
};
