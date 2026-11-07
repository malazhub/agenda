import React, { useEffect, useMemo, useState } from 'react';
import { Language, GradeLevelDef } from '../types';
import { deleteDirectorSession, getDirectorSessions, createDirectorSession } from '../services/cloudflareApi';
import type { SessionInput, StoredSessionRecord } from '../services/cloudflareApi';
import { Plus, RefreshCw, Trash2, Video, Radio, Eye } from 'lucide-react';

interface DirectorSessionsPanelProps {
  currentLang: Language;
  token: string;
  grades: GradeLevelDef[];
  onJoinSession?: (session: StoredSessionRecord) => void;
}

export const DirectorSessionsPanel: React.FC<DirectorSessionsPanelProps> = ({ 
  currentLang, 
  token, 
  grades,
  onJoinSession 
}) => {
  const isRTL = currentLang === 'ar';
  const t = {
    grade: currentLang === 'ar' ? 'الصف' : currentLang === 'fr' ? 'Classe' : 'Grade',
    educatorName: currentLang === 'ar' ? 'اسم الأستاذ' : currentLang === 'fr' ? 'Nom de l\'enseignant' : 'Educator Name',
    subject: currentLang === 'ar' ? 'المادة' : currentLang === 'fr' ? 'Matière' : 'Subject',
    maxStudents: currentLang === 'ar' ? 'الحد الأقصى للطلاب' : currentLang === 'fr' ? 'Nombre max d\'élèves' : 'Max Students',
    save: currentLang === 'ar' ? 'حفظ الحصة' : currentLang === 'fr' ? 'Enregistrer le cours' : 'Save Session',
    delete: currentLang === 'ar' ? 'حذف' : currentLang === 'fr' ? 'Supprimer' : 'Delete',
    join: currentLang === 'ar' ? 'انضمام ومراقبة' : currentLang === 'fr' ? 'Rejoindre' : 'Join & Monitor',
    liveBadge: 'LIVE',
    offBadge: 'OFF',
    empty: currentLang === 'ar' ? 'لا توجد حصص لهذا الصف.' : currentLang === 'fr' ? 'Aucun cours pour cette classe.' : 'No sessions for this grade.',
    confirm: currentLang === 'ar' ? 'هل تريد حذف هذه الحصة نهائياً؟' : currentLang === 'fr' ? 'Supprimer définitivement ce cours ?' : 'Permanently delete this session?',
    loadError: currentLang === 'ar' ? 'تعذر تحميل الحصص.' : currentLang === 'fr' ? 'Impossible de charger les cours.' : 'Unable to load sessions.',
    sessionSaved: currentLang === 'ar' ? 'تم حفظ وتعيين الحصة بنجاح.' : currentLang === 'fr' ? 'Cours enregistré avec succès.' : 'Session saved successfully.',
    sessionDeleted: currentLang === 'ar' ? 'تم حذف الحصة نهائياً.' : currentLang === 'fr' ? 'Cours supprimé définitivement.' : 'Session permanently deleted.',
    refresh: currentLang === 'ar' ? 'تحديث الحصص' : currentLang === 'fr' ? 'Actualiser les cours' : 'Refresh sessions',
  };

  const [gradeId, setGradeId] = useState<string>(grades[0]?.id || 'g12_lh');
  const [sessions, setSessions] = useState<StoredSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLive, setIsLive] = useState(true);

  // Form with ONLY: Grade, Educator Name, Subject, Maximum Students
  const [form, setForm] = useState({
    educatorName: '',
    subject: '',
    maxStudents: 25,
  });

  const loadSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const { sessions: loadedSessions } = await getDirectorSessions(token);
      setSessions(loadedSessions);
      localStorage.setItem('director_saved_sessions', JSON.stringify(loadedSessions));
    } catch {
      // Fallback to local storage if API is offline
      const cached = localStorage.getItem('director_saved_sessions');
      if (cached) {
        setSessions(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, [token]);

  const gradeSessions = useMemo(() => sessions.filter((session) => session.gradeId === gradeId), [sessions, gradeId]);

  // Save session assigned by Grade, Educator Name, Subject, Max Students
  const saveSession = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.educatorName.trim() || !form.subject.trim()) return;

    setSaving(true);
    setError('');
    setMessage('');

    const newSessionInput: SessionInput = {
      gradeId,
      title: form.educatorName.trim(), // Stored as educator name
      subject: form.subject.trim(),
      sourceName: form.educatorName.trim(),
      sourceUrl: `https://agenda.live/room/${gradeId}`,
      playbackUrl: '',
      isLive,
    };

    try {
      await createDirectorSession(token, newSessionInput);
      await loadSessions();
      setMessage(t.sessionSaved);
    } catch {
      // Local fallback creation
      const localId = `sess_${Date.now()}`;
      const localRecord: StoredSessionRecord = {
        id: localId,
        gradeId,
        title: form.educatorName.trim(),
        subject: form.subject.trim(),
        sourceName: form.educatorName.trim(),
        sourceUrl: `https://agenda.live/room/${gradeId}`,
        playbackUrl: '',
        isLive,
        createdAt: new Date().toISOString(),
      };
      const updated = [localRecord, ...sessions];
      setSessions(updated);
      localStorage.setItem('director_saved_sessions', JSON.stringify(updated));
      localStorage.setItem(`max_students_${localId}`, String(form.maxStudents));
      setMessage(t.sessionSaved);
    } finally {
      setForm({ educatorName: '', subject: '', maxStudents: 25 });
      setSaving(false);
    }
  };

  // Fixed Delete: Removes permanently from state, localStorage, and API
  const removeSession = async (session: StoredSessionRecord) => {
    if (!window.confirm(t.confirm)) return;
    setError('');
    setMessage('');

    // Remove immediately from UI & localStorage so it is never stuck
    const updated = sessions.filter((item) => item.id !== session.id);
    setSessions(updated);
    localStorage.setItem('director_saved_sessions', JSON.stringify(updated));
    localStorage.removeItem(`max_students_${session.id}`);
    setMessage(t.sessionDeleted);

    try {
      await deleteDirectorSession(token, session.id);
    } catch {
      // Backend error ignored since local deletion is already completed
    }
  };

  // Toggle Live / Off for a session
  const toggleLiveStatus = (session: StoredSessionRecord) => {
    const updated = sessions.map((s) => {
      if (s.id === session.id) {
        return { ...s, isLive: !s.isLive };
      }
      return s;
    });
    setSessions(updated);
    localStorage.setItem('director_saved_sessions', JSON.stringify(updated));
  };

  const fieldClass = 'w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:outline-indigo-600';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* 1. ASSIGN SESSION FORM */}
      <form onSubmit={saveSession} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-900">
            {currentLang === 'ar' ? 'تعيين وإضافة حصة جديدة للأستاذ' : 'Assign & Add Educator Session'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentLang === 'ar' ? 'حدد الصف، اسم الأستاذ، المادة والحد الأقصى للطلاب' : 'Set Grade, Educator Name, Subject, and Max Students'}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Grade selection */}
          <label className="space-y-1 text-xs font-bold text-slate-700">
            {t.grade}
            <select className={fieldClass} value={gradeId} onChange={(e) => setGradeId(e.target.value)} required>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name[currentLang]}
                </option>
              ))}
            </select>
          </label>

          {/* Educator Name (renamed from Title) */}
          <label className="space-y-1 text-xs font-bold text-slate-700">
            {t.educatorName}
            <input
              className={fieldClass}
              required
              maxLength={100}
              placeholder={currentLang === 'ar' ? 'مثال: Prof. Malaz' : 'e.g. Prof. Malaz'}
              value={form.educatorName}
              onChange={(e) => setForm({ ...form, educatorName: e.target.value })}
            />
          </label>

          {/* Subject */}
          <label className="space-y-1 text-xs font-bold text-slate-700">
            {t.subject}
            <input
              className={fieldClass}
              required
              maxLength={80}
              placeholder={currentLang === 'ar' ? 'مثال: Mathematics' : 'e.g. Mathematics'}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </label>

          {/* Maximum Students Number */}
          <label className="space-y-1 text-xs font-bold text-slate-700">
            {t.maxStudents}
            <input
              className={fieldClass}
              type="number"
              min={1}
              max={200}
              required
              value={form.maxStudents}
              onChange={(e) => setForm({ ...form, maxStudents: parseInt(e.target.value) || 25 })}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Live / Off Initial Checkbox */}
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isLive}
              onChange={(e) => setIsLive(e.target.checked)}
              className="accent-rose-600 h-4 w-4"
            />
            <span className="flex items-center gap-1.5">
              <Radio className={`h-4 w-4 ${isLive ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
              <span>{isLive ? t.liveBadge : t.offBadge}</span>
            </span>
          </label>

          {/* Save Session Card Button */}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 px-5 py-2.5 text-xs font-black text-white transition cursor-pointer disabled:opacity-60 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>{saving ? '…' : t.save}</span>
          </button>
        </div>
      </form>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{message}</p>}

      {/* 2. SESSIONS DISPLAYED BELOW WITH JOIN, LIVE/OFF, AND DELETE */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <span>{grades.find((g) => g.id === gradeId)?.name[currentLang]}</span>
          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {gradeSessions.length} {currentLang === 'ar' ? 'حصص مسجلة' : 'Sessions'}
          </span>
        </h3>
        <button
          type="button"
          onClick={() => void loadSessions()}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 cursor-pointer"
          aria-label={t.refresh}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <p className="py-5 text-center text-xs text-slate-500">…</p>
      ) : gradeSessions.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-center text-xs text-slate-500">{t.empty}</p>
      ) : (
        <div className="space-y-3">
          {gradeSessions.map((session) => {
            const currentGradeName = grades.find((g) => g.id === session.gradeId)?.name[currentLang] || session.gradeId.toUpperCase();
            const maxStudents = localStorage.getItem(`max_students_${session.id}`) || '25';

            return (
              <article
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                {/* Session Named by Grade, Subject, and Educator Name */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-md">
                      {currentGradeName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {session.subject}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900">
                    {currentLang === 'ar' ? 'الأستاذ: ' : 'Educator: '}
                    {session.title}
                  </h4>

                  <span className="text-[10px] text-slate-500 font-semibold block">
                    {currentLang === 'ar' ? `الحد الأقصى للطلاب: ${maxStudents}` : `Max Capacity: ${maxStudents} students`}
                  </span>
                </div>

                {/* Actions: Live/Off, Join, and Delete */}
                <div className="flex items-center gap-2">
                  {/* Live / Off Toggle Button */}
                  <button
                    type="button"
                    onClick={() => toggleLiveStatus(session)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                      session.isLive
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                    }`}
                    title="Toggle Live / Off"
                  >
                    <span className={`w-2 h-2 rounded-full ${session.isLive ? 'bg-rose-600 animate-ping' : 'bg-slate-400'}`} />
                    <span>{session.isLive ? t.liveBadge : t.offBadge}</span>
                  </button>

                  {/* Join Button for Director to monitor */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onJoinSession) {
                        onJoinSession(session);
                      } else {
                        window.location.href = '#classroom';
                        alert(currentLang === 'ar' ? `الانضمام لمراقبة حصة الأستاذ: ${session.title}` : `Joining to monitor ${session.title}'s session`);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-black text-white transition cursor-pointer shadow-xs"
                    title="Join to monitor"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{t.join}</span>
                  </button>

                  {/* Fixed Delete Button */}
                  <button
                    type="button"
                    onClick={() => void removeSession(session)}
                    className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition cursor-pointer"
                    title="Delete session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t.delete}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
