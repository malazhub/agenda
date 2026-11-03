import React, { useState, useEffect } from 'react';
import { OfficialExam, Language } from '../types';
import { translations } from '../translations';
import { 
  Clock, 
  CheckCircle2, 
  Award, 
  AlertCircle, 
  X, 
  ChevronRight, 
  Sparkles,
  BarChart3
} from 'lucide-react';

interface ExamPracticeModalProps {
  exam: OfficialExam;
  currentLang: Language;
  onClose: () => void;
  onBookTutorReview: () => void;
}

export const ExamPracticeModal: React.FC<ExamPracticeModalProps> = ({
  exam,
  currentLang,
  onClose,
  onBookTutorReview
}) => {
  const t = translations[currentLang];
  // Countdown in seconds (duration in minutes * 60)
  const [secondsRemaining, setSecondsRemaining] = useState(exam.durationMinutes * 60);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [checkedBaremeItems, setCheckedBaremeItems] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = exam.questions[activeQuestionIdx];

  const toggleBaremeItem = (key: string) => {
    setCheckedBaremeItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Calculate self-assessed score from checked barème items
  const earnedPoints = exam.questions.reduce((total, q, qIdx) => {
    let qTotal = 0;
    q.baremeItems.forEach((item, itemIdx) => {
      if (checkedBaremeItems[`${qIdx}-${itemIdx}`]) {
        qTotal += item.points;
      }
    });
    return total + qTotal;
  }, 0);

  const percentage = (earnedPoints / exam.totalPoints) * 100;
  let mention = 'Passable (مقبول)';
  if (percentage >= 80) mention = 'Mention Très Bien (جيد جداً)';
  else if (percentage >= 70) mention = 'Mention Bien (جيد)';
  else if (percentage >= 60) mention = 'Mention Assez Bien (لا بأس به)';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Practice Header with Timer */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[11px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded uppercase">
              Official Simulation Mode
            </span>
            <h2 className="text-base font-bold text-white mt-1 line-clamp-1">
              {exam.title[currentLang]} ({exam.year})
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="font-mono font-bold text-sm text-white">
                {formatTimer(secondsRemaining)}
              </span>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Question Selector Tabs */}
        <div className="flex items-center gap-2 p-3 bg-slate-100 border-b border-slate-200 overflow-x-auto">
          {exam.questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setActiveQuestionIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeQuestionIdx === idx
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{q.number}</span>
              <span className="text-[10px] opacity-80">({q.points} pts)</span>
            </button>
          ))}

          <button
            onClick={() => setShowResults(!showResults)}
            className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              showResults ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Self-Grade ({earnedPoints.toFixed(1)} / {exam.totalPoints})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {showResults ? (
            /* Results & Barème Verification view */
            <div className="space-y-4">
              <div className="bg-linear-to-br from-emerald-900 to-slate-900 text-white p-6 rounded-2xl text-center space-y-2">
                <span className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
                  Lebanese Official Barème Self-Grading
                </span>
                <div className="text-4xl font-black text-amber-300">
                  {earnedPoints.toFixed(1)} / {exam.totalPoints}
                </div>
                <div className="text-sm font-extrabold text-emerald-200">
                  {mention}
                </div>
                <p className="text-xs text-slate-300 max-w-md mx-auto pt-1">
                  Based on the official Ministry of Education points allocation. Check all the criteria you satisfied below to calculate your estimated official exam score.
                </p>
              </div>

              {/* Callout to get verified by an official teacher for $7 */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-amber-950 block">
                    Want an Official Exam Corrector to grade your paper?
                  </span>
                  <p className="text-[11px] text-amber-800">
                    Book a $7 45-minute review session. The educator will audit every step against the exact MEHE grading guidelines.
                  </p>
                </div>
                <button
                  onClick={onBookTutorReview}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition shadow-xs shrink-0 cursor-pointer"
                >
                  Book $7 Audit
                </button>
              </div>
            </div>
          ) : (
            /* Question Paper view */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white text-xs font-black px-2.5 py-1 rounded-md">
                    {currentQuestion.number}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {currentQuestion.title}
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {currentQuestion.points} Points Total
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                {currentQuestion.prompt[currentLang]}
              </div>

              {/* Sub-questions with Barème Checkboxes */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-600 block">
                  Check each Barème requirement as you solve:
                </span>

                <div className="space-y-2">
                  {currentQuestion.baremeItems.map((item, itemIdx) => {
                    const key = `${activeQuestionIdx}-${itemIdx}`;
                    const isChecked = !!checkedBaremeItems[key];

                    return (
                      <div
                        key={itemIdx}
                        onClick={() => toggleBaremeItem(key)}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                          />
                          <span className="font-semibold">{item.step}</span>
                        </div>

                        <span className="font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded shrink-0">
                          +{item.points} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Question {activeQuestionIdx + 1} of {exam.questions.length}
          </div>

          <div className="flex items-center gap-2">
            {activeQuestionIdx < exam.questions.length - 1 ? (
              <button
                onClick={() => setActiveQuestionIdx(prev => prev + 1)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <span>Next Question</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setShowResults(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finish & View Score</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
