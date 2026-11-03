import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { 
  GraduationCap, 
  DollarSign, 
  Languages, 
  CheckCircle2
} from 'lucide-react';

interface CurriculumOverviewProps {
  currentLang: Language;
  onExploreArchive: () => void;
  onBrowseTutors: () => void;
}

export const CurriculumOverview: React.FC<CurriculumOverviewProps> = ({
  currentLang,
  onExploreArchive,
  onBrowseTutors
}) => {
  const t = translations[currentLang];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 text-start">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {currentLang === 'ar' ? 'دليل الشهادات والمناهج الرسمية' : currentLang === 'fr' ? 'Guide des Séries & Examens' : 'Official Curriculum & Exam Guide'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {currentLang === 'ar' 
            ? 'نظرة شاملة على فروع الشهادة الثانوية والبريفيه ومعايير سلالم التصحيح.' 
            : currentLang === 'fr' 
            ? 'Aperçu complet des séries du Baccalauréat, du Brevet et des barèmes officiels.' 
            : 'Overview of official Brevet and Baccalaureate tracks and official Barème standards.'}
        </p>
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Brevet */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5 text-start">
          <span className="text-[11px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded inline-block">
            {t.tracks.BREVET}
          </span>
          <h4 className="font-bold text-slate-900 text-xs">الشهادة المتوسطة (Grade 9)</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            المواد الأساسية: رياضيات، فيزياء، كيمياء، علوم الحياة، لغة عربية، ولغات أجنبية.
          </p>
        </div>

        {/* Bac SG */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5 text-start">
          <span className="text-[11px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded inline-block">
            {t.tracks.BAC_SG}
          </span>
          <h4 className="font-bold text-slate-900 text-xs">علوم عامة (General Sciences)</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            تركيز مكثف على الرياضيات المتقدمة (معامل ٦)، الفيزياء (معامل ٤)، والكيمياء.
          </p>
        </div>

        {/* Bac SV */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5 text-start">
          <span className="text-[11px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded inline-block">
            {t.tracks.BAC_SV}
          </span>
          <h4 className="font-bold text-slate-900 text-xs">علوم الحياة (Life Sciences)</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            تركيز رئيسي على علوم الحياة (معامل ٥)، الكيمياء (معامل ٣)، والرياضيات.
          </p>
        </div>

        {/* Bac SE */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5 text-start">
          <span className="text-[11px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded inline-block">
            {t.tracks.BAC_SE}
          </span>
          <h4 className="font-bold text-slate-900 text-xs">اجتماع واقتصاد (Socio-Economics)</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            تركيز على الاقتصاد، علم الاجتماع، والرياضيات التطبيقية والإحصاء.
          </p>
        </div>

        {/* Bac LH */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5 text-start">
          <span className="text-[11px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded inline-block">
            {t.tracks.BAC_LH}
          </span>
          <h4 className="font-bold text-slate-900 text-xs">آداب وإنسانيات (Humanities)</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            تركيز على الفلسفة والحضارات، الأدب العربي، واللغات الأجنبية والتاريخ.
          </p>
        </div>

        {/* Flat Rate Standard */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-start flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold bg-emerald-800 text-white px-2 py-0.5 rounded inline-block">
              تسعير موحد
            </span>
            <h4 className="font-bold text-slate-900 text-xs mt-1">٧$ للحصة (٤٥ دقيقة)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              سعر ثابت لكافة المواد والمراحل الدراسية عبر Whish Money أو OMT أو Fresh USD.
            </p>
          </div>
          <button
            onClick={onBrowseTutors}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer pt-2"
          >
            <span>استعراض المدرّسين</span>
            <span>←</span>
          </button>
        </div>
      </div>
    </div>
  );
};
