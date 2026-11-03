import React, { useState, useMemo } from 'react';
import { OfficialExam, AcademicTrack, ExamSubject, Language, ExamQuestion } from '../types';
import { OFFICIAL_EXAMS } from '../data/mockExams';
import { translations } from '../translations';
import { 
  Search, 
  FileText, 
  CheckCircle2, 
  Printer, 
  Play, 
  Award, 
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface ArchiveExplorerProps {
  currentLang: Language;
  onSelectQuestionForBooking: (question: ExamQuestion, exam: OfficialExam) => void;
  onStartPractice: (exam: OfficialExam) => void;
}

export const ArchiveExplorer: React.FC<ArchiveExplorerProps> = ({
  currentLang,
  onSelectQuestionForBooking,
  onStartPractice
}) => {
  const t = translations[currentLang];

  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedTrack, setSelectedTrack] = useState<AcademicTrack | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<ExamSubject | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active exam currently selected for viewing
  const [activeExamId, setActiveExamId] = useState<string>(OFFICIAL_EXAMS[0].id);
  // View mode for each question: 'question' | 'bareme' | 'solution'
  const [questionViewModes, setQuestionViewModes] = useState<Record<string, 'question' | 'bareme' | 'solution'>>({});

  // Filter exams
  const filteredExams = useMemo(() => {
    return OFFICIAL_EXAMS.filter(exam => {
      if (selectedYear !== 'all' && exam.year !== selectedYear) return false;
      if (selectedTrack !== 'all' && exam.track !== selectedTrack) return false;
      if (selectedSubject !== 'all' && exam.subject !== selectedSubject) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = exam.title[currentLang].toLowerCase().includes(query) ||
                             exam.title.en.toLowerCase().includes(query) ||
                             exam.title.fr.toLowerCase().includes(query);
        const matchesQuestions = exam.questions.some(q => 
          q.title.toLowerCase().includes(query) ||
          q.prompt[currentLang].toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesQuestions) return false;
      }
      return true;
    });
  }, [selectedYear, selectedTrack, selectedSubject, searchQuery, currentLang]);

  const activeExam = useMemo(() => {
    const found = OFFICIAL_EXAMS.find(e => e.id === activeExamId);
    return found || filteredExams[0] || OFFICIAL_EXAMS[0];
  }, [activeExamId, filteredExams]);

  const toggleQuestionMode = (questionId: string, mode: 'question' | 'bareme' | 'solution') => {
    setQuestionViewModes(prev => ({
      ...prev,
      [questionId]: prev[questionId] === mode ? 'question' : mode
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  // Distinct available years from dataset
  const availableYears = [2026, 2025, 2024, 2023, 2022];

  return (
    <div className="space-y-6">
      {/* Clean, Simple Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t.archiveTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t.archiveSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onStartPractice(activeExam)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.startPracticeMode}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.downloadPrint}</span>
          </button>
        </div>
      </div>

      {/* Compact Clean Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Year Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {t.filterYear}
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 cursor-pointer"
          >
            <option value="all">{t.allYears}</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>

        {/* Track Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {t.filterTrack}
          </label>
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value as any)}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 cursor-pointer"
          >
            <option value="all">{t.allTracks}</option>
            <option value="BREVET">{t.tracks.BREVET}</option>
            <option value="BAC_SG">{t.tracks.BAC_SG}</option>
            <option value="BAC_SV">{t.tracks.BAC_SV}</option>
            <option value="BAC_SE">{t.tracks.BAC_SE}</option>
            <option value="BAC_LH">{t.tracks.BAC_LH}</option>
          </select>
        </div>

        {/* Subject Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {t.filterSubject}
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as any)}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 cursor-pointer"
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

        {/* Search */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            بحث في المسابقات
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="ابحث عن درس أو تمرين..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Papers List */}
        <div className="lg:col-span-4 space-y-2">
          {filteredExams.map(exam => {
            const isSelected = exam.id === activeExam.id;
            return (
              <div
                key={exam.id}
                onClick={() => setActiveExamId(exam.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer text-start ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {exam.year} • {exam.session === 1 ? 'Session 1' : 'Session 2'}
                  </span>
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-emerald-300' : 'text-slate-500'}`}>
                    {exam.totalPoints} pts • {exam.durationMinutes} min
                  </span>
                </div>

                <h3 className="text-xs font-bold line-clamp-2">
                  {exam.title[currentLang]}
                </h3>

                <div className="mt-2 flex items-center justify-between text-[11px] opacity-75">
                  <span>{exam.questions.length} تمارين مع سلّم التصحيح</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}

          {filteredExams.length === 0 && (
            <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
              لا توجد مسابقات مطابقة لخيارات البحث.
            </div>
          )}
        </div>

        {/* Right Column: Active Paper */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header of Active Paper */}
          <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-1 text-start">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-slate-900">
                {activeExam.title[currentLang]}
              </h2>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{activeExam.year}</span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{activeExam.totalPoints} pts</span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{activeExam.durationMinutes} min</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {activeExam.officialInstructions[currentLang]}
            </p>
          </div>

          {/* Exercises */}
          <div className="p-4 sm:p-5 space-y-6 divide-y divide-slate-100">
            {activeExam.questions.map((question, qIdx) => {
              const currentMode = questionViewModes[question.id] || 'question';

              return (
                <div key={question.id} className={qIdx > 0 ? 'pt-6' : ''}>
                  {/* Exercise Title and Mode Switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold bg-slate-900 text-white px-2 py-0.5 rounded">
                        {question.number}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {question.title}
                      </h3>
                      <span className="text-xs text-slate-500 font-semibold">
                        ({question.points} pts)
                      </span>
                    </div>

                    {/* Mode Buttons */}
                    <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs">
                      <button
                        onClick={() => toggleQuestionMode(question.id, 'question')}
                        className={`px-2.5 py-1 rounded font-bold transition cursor-pointer ${
                          currentMode === 'question' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        {t.viewPrompt}
                      </button>
                      <button
                        onClick={() => toggleQuestionMode(question.id, 'bareme')}
                        className={`px-2.5 py-1 rounded font-bold transition cursor-pointer flex items-center gap-1 ${
                          currentMode === 'bareme' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        <Award className="w-3 h-3" />
                        <span>Barème</span>
                      </button>
                      <button
                        onClick={() => toggleQuestionMode(question.id, 'solution')}
                        className={`px-2.5 py-1 rounded font-bold transition cursor-pointer flex items-center gap-1 ${
                          currentMode === 'solution' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Solution</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode Content */}
                  {currentMode === 'question' && (
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                        {question.prompt[currentLang]}
                      </div>

                      {question.subQuestions && question.subQuestions.length > 0 && (
                        <div className="space-y-2 pl-3 border-l-2 border-slate-300">
                          {question.subQuestions.map(sub => (
                            <div key={sub.label} className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-slate-900">{sub.label}</span>
                                <span className="text-[11px] text-slate-400">({sub.points} pts)</span>
                              </div>
                              <p className="text-slate-700 leading-relaxed font-medium">
                                {sub.text[currentLang]}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {currentMode === 'bareme' && (
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                      <div className="text-xs font-bold text-slate-800">
                        {t.viewBareme} ({question.points} pts)
                      </div>
                      <div className="space-y-1.5">
                        {question.baremeItems.map((item, idx) => (
                          <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-xs flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-800">{item.step}</span>
                            <span className="font-bold text-slate-900 shrink-0">+{item.points} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentMode === 'solution' && (
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                      <div className="text-xs font-bold text-slate-800">{t.viewSolution}</div>
                      <div className="bg-white p-3 rounded border border-slate-200 text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-line">
                        {question.solution[currentLang]}
                      </div>
                    </div>
                  )}

                  {/* Clean Booking Action */}
                  <div className="mt-3 flex items-center justify-between text-xs pt-2">
                    <span className="text-slate-500 font-medium">{t.bookTutorForQuestion}</span>
                    <button
                      onClick={() => onSelectQuestionForBooking(question, activeExam)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      {t.bookTutor}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
