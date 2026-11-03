import React, { useState } from 'react';
import { Teacher, Language, ExamSubject, AcademicTrack } from '../types';
import { MOCK_TEACHERS } from '../data/mockTeachers';
import { translations } from '../translations';
import { 
  Star, 
  MapPin, 
  GraduationCap, 
  Clock, 
  Building,
  CheckCircle,
  Sparkles,
  Award,
  Video
} from 'lucide-react';

interface TutorMarketplaceProps {
  currentLang: Language;
  onBookTeacher: (teacher: Teacher, slot: string) => void;
}

export const TutorMarketplace: React.FC<TutorMarketplaceProps> = ({
  currentLang,
  onBookTeacher
}) => {
  const t = translations[currentLang];
  const [selectedStream, setSelectedStream] = useState<'all' | 'Francophone' | 'Anglophone' | 'Bilingual'>('all');
  const [selectedSubject, setSelectedSubject] = useState<ExamSubject | 'all'>('all');
  const [selectedTrack, setSelectedTrack] = useState<AcademicTrack | 'all'>('all');

  const filteredTeachers = MOCK_TEACHERS.filter(teacher => {
    if (selectedStream !== 'all' && !teacher.streams.includes(selectedStream as any)) return false;
    if (selectedSubject !== 'all' && !teacher.subjects.includes(selectedSubject)) return false;
    if (selectedTrack !== 'all' && !teacher.tracks.includes(selectedTrack)) return false;
    return true;
  });

  const getSubjectBadgeColor = (sub: ExamSubject) => {
    switch (sub) {
      case 'math': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'physics': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'chemistry': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'biology': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'economics': return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'arabic': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.tutorsTitle}
            </h1>
            <span className="text-xs font-black bg-linear-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
              7$ / Session
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            {t.tutorsSubtitle}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {t.streamFilter}
          </label>
          <select
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value as any)}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 cursor-pointer"
          >
            <option value="all">{t.allStreams}</option>
            <option value="Francophone">{t.francophone}</option>
            <option value="Anglophone">{t.anglophone}</option>
            <option value="Bilingual">{t.bilingual}</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {t.filterSubject}
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as any)}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 cursor-pointer"
          >
            <option value="all">{t.allSubjects}</option>
            <option value="math">{t.subjects.math}</option>
            <option value="physics">{t.subjects.physics}</option>
            <option value="chemistry">{t.subjects.chemistry}</option>
            <option value="biology">{t.subjects.biology}</option>
            <option value="economics">{t.subjects.economics}</option>
            <option value="arabic">{t.subjects.arabic}</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {t.filterTrack}
          </label>
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value as any)}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 cursor-pointer"
          >
            <option value="all">{t.allTracks}</option>
            <option value="BREVET">{t.tracks.BREVET}</option>
            <option value="BAC_SG">{t.tracks.BAC_SG}</option>
            <option value="BAC_SV">{t.tracks.BAC_SV}</option>
            <option value="BAC_SE">{t.tracks.BAC_SE}</option>
            <option value="BAC_LH">{t.tracks.BAC_LH}</option>
          </select>
        </div>
      </div>

      {/* Teachers Directory Grid with Multiple Vibrant Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeachers.map(teacher => {
          return (
            <div
              key={teacher.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:-translate-y-0.5"
            >
              <div className="p-5 space-y-3.5 text-start">
                {/* Header */}
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={teacher.avatar}
                      alt={teacher.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                      <CheckCircle className="w-2.5 h-2.5 text-white" />
                    </span>
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 text-base group-hover:text-emerald-700 transition truncate">
                      {teacher.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold truncate">
                      {teacher.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{teacher.rating}</span>
                      <span className="text-slate-400 font-normal">({teacher.reviewsCount} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Subject & Stream Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {teacher.subjects.map(sub => (
                    <span key={sub} className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border ${getSubjectBadgeColor(sub)}`}>
                      {t.subjects[sub] || sub}
                    </span>
                  ))}
                  {teacher.streams.map(stream => (
                    <span key={stream} className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg">
                      {stream}
                    </span>
                  ))}
                </div>

                {/* Credentials */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate font-semibold">{teacher.schoolExperience}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate font-semibold">{teacher.education}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="font-semibold">{teacher.location}</span>
                  </div>
                </div>

                {/* Pass Rate Highlight */}
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60">
                  <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{teacher.officialExamPassRate}</span>
                </div>

                {/* Available Slots */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {currentLang === 'ar' ? 'المواعيد القريبة المتاحة:' : 'Next Available Slots:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.availableSlots.slice(0, 2).map(slot => (
                      <span key={slot} className="text-[11px] bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg font-bold">
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="p-4 bg-linear-to-r from-slate-50 to-slate-100 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Flat Rate</div>
                  <div className="text-base font-black text-slate-900">$7.00 <span className="text-xs text-slate-500 font-semibold">/ 45 min</span></div>
                </div>

                <button
                  onClick={() => onBookTeacher(teacher, teacher.availableSlots[0])}
                  className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>{t.bookSession}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
