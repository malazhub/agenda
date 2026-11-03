import React, { useState } from 'react';
import { AgendaItem, Language, ExamSubject } from '../types';
import { translations } from '../translations';
import { 
  Clock, 
  Plus, 
  BookOpen, 
  ArrowRight, 
  Trash2,
  Sparkles,
  Calculator,
  Atom,
  Dna,
  Coins,
  Globe2
} from 'lucide-react';

interface HomeworkAgendaProps {
  currentLang: Language;
  agendaItems: AgendaItem[];
  onAddAssignment: (item: Omit<AgendaItem, 'id'>) => void;
  onDeleteAssignment: (id: string) => void;
  onRequestTutorHelp: (item: AgendaItem) => void;
  onViewLinkedExam: (year: number) => void;
}

export const HomeworkAgenda: React.FC<HomeworkAgendaProps> = ({
  currentLang,
  agendaItems,
  onAddAssignment,
  onDeleteAssignment,
  onRequestTutorHelp,
  onViewLinkedExam
}) => {
  const t = translations[currentLang];
  const [showAddModal, setShowAddModal] = useState(false);

  // New assignment form state
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newSubject, setNewSubject] = useState<ExamSubject>('math');
  const [newDueDate, setNewDueDate] = useState('غداً');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState(45);

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddAssignment({
      date: new Date().toISOString().split('T')[0],
      dayLabel: 'Today',
      subject: newSubject,
      track: 'BAC_SG',
      title: newTitle,
      details: newDetails || 'حل التمارين والتحضير للحصة القادمة.',
      dueDate: newDueDate,
      estimatedMinutes: Number(newEstimatedMinutes) || 45,
      status: 'todo',
      linkedOfficialExamTopic: {
        topic: `${newSubject.toUpperCase()}`,
        suggestedExamYear: 2026,
        questionNumber: 'Exercice 1'
      }
    });

    setNewTitle('');
    setNewDetails('');
    setShowAddModal(false);
  };

  // Color mappings per subject
  const getSubjectStyle = (subject: ExamSubject) => {
    switch (subject) {
      case 'math':
        return {
          bg: 'bg-blue-50 border-blue-200',
          badge: 'bg-blue-600 text-white',
          accent: 'text-blue-700',
          icon: Calculator
        };
      case 'physics':
        return {
          bg: 'bg-purple-50 border-purple-200',
          badge: 'bg-purple-600 text-white',
          accent: 'text-purple-700',
          icon: Atom
        };
      case 'biology':
        return {
          bg: 'bg-emerald-50 border-emerald-200',
          badge: 'bg-emerald-600 text-white',
          accent: 'text-emerald-700',
          icon: Dna
        };
      case 'economics':
        return {
          bg: 'bg-amber-50 border-amber-200',
          badge: 'bg-amber-600 text-white',
          accent: 'text-amber-800',
          icon: Coins
        };
      case 'arabic':
        return {
          bg: 'bg-rose-50 border-rose-200',
          badge: 'bg-rose-600 text-white',
          accent: 'text-rose-700',
          icon: BookOpen
        };
      default:
        return {
          bg: 'bg-sky-50 border-sky-200',
          badge: 'bg-sky-600 text-white',
          accent: 'text-sky-700',
          icon: Globe2
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.agendaTitle}
            </h1>
            <span className="text-xs font-extrabold bg-linear-to-r from-purple-600 to-indigo-600 text-white px-2.5 py-0.5 rounded-full">
              {agendaItems.length} Assignments
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            {t.agendaSubtitle}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addAssignment}</span>
        </button>
      </div>

      {/* Homework Cards with Multiple Vibrant Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agendaItems.map(item => {
          const style = getSubjectStyle(item.subject);
          const Icon = style.icon;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition shadow-sm hover:shadow-md ${style.bg} flex flex-col justify-between`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${style.badge}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.subjects[item.subject] || item.subject}</span>
                    </span>
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {item.dueDate} (~{item.estimatedMinutes} min)
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteAssignment(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white/70 backdrop-blur-xs p-3 rounded-xl border border-white/60">
                  {item.details}
                </p>
              </div>

              {/* Bottom Actions: Linked Exam & Solve with Tutor */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                {item.linkedOfficialExamTopic ? (
                  <button
                    onClick={() => onViewLinkedExam(item.linkedOfficialExamTopic!.suggestedExamYear)}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>تمرين رسمي مطابق</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                ) : (
                  <div />
                )}

                <button
                  onClick={() => onRequestTutorHelp(item)}
                  className="bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{t.solveWithTutor}</span>
                </button>
              </div>
            </div>
          );
        })}

        {agendaItems.length === 0 && (
          <div className="col-span-2 p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            لا توجد فروض حالياً. انقر على "إضافة فرض" لإضافة واجبات جديدة.
          </div>
        )}
      </div>

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">
                {t.addAssignment}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-3.5 text-start">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان الفرض
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: Exercice 14 p. 82 - Dérivation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-purple-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المادة
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value as ExamSubject)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="math">{t.subjects.math}</option>
                    <option value="physics">{t.subjects.physics}</option>
                    <option value="chemistry">{t.subjects.chemistry}</option>
                    <option value="biology">{t.subjects.biology}</option>
                    <option value="economics">{t.subjects.economics}</option>
                    <option value="arabic">{t.subjects.arabic}</option>
                    <option value="french">{t.subjects.french}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الموعد
                  </label>
                  <input
                    type="text"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    placeholder="غداً، الأربعاء..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تفاصيل التمرين
                </label>
                <textarea
                  rows={2}
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  placeholder="أرقام الصفحات أو ملاحظات الأستاذ..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs px-5 py-2 rounded-xl shadow-md cursor-pointer"
                >
                  حفظ الفرض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
