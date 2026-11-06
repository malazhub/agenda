import React, { useEffect, useMemo, useState } from 'react';
import { Language, GradeLevelDef } from '../types';
import { deleteDirectorSession, getDirectorSessions, createDirectorSession } from '../services/cloudflareApi';
import type { SessionInput, StoredSessionRecord } from '../services/cloudflareApi';
import { Plus, RefreshCw, Trash2, Video } from 'lucide-react';

interface DirectorSessionsPanelProps {
  currentLang: Language;
  token: string;
  grades: GradeLevelDef[];
}

export const DirectorSessionsPanel: React.FC<DirectorSessionsPanelProps> = ({ currentLang, token, grades }) => {
  const isRTL = currentLang === 'ar';
  const t = {
    title: currentLang === 'ar' ? 'العنوان' : currentLang === 'fr' ? 'Titre' : 'Title',
    subject: currentLang === 'ar' ? 'المادة' : currentLang === 'fr' ? 'Matière' : 'Subject',
    sourceName: currentLang === 'ar' ? 'المصدر' : currentLang === 'fr' ? 'Source' : 'Source name',
    sourceUrl: currentLang === 'ar' ? 'رابط المصدر' : currentLang === 'fr' ? 'Lien de la source' : 'Source URL',
    playbackUrl: currentLang === 'ar' ? 'رابط الفيديو (اختياري)' : currentLang === 'fr' ? 'Lien vidéo (facultatif)' : 'Playback URL (optional)',
    grade: currentLang === 'ar' ? 'الصف' : currentLang === 'fr' ? 'Classe' : 'Grade',
    add: currentLang === 'ar' ? 'إضافة حصة' : currentLang === 'fr' ? 'Ajouter un cours' : 'Add session',
    save: currentLang === 'ar' ? 'حفظ الحصة' : currentLang === 'fr' ? 'Enregistrer le cours' : 'Save session',
    delete: currentLang === 'ar' ? 'حذف' : currentLang === 'fr' ? 'Supprimer' : 'Delete',
    liveCheckbox: currentLang === 'ar' ? 'حصة مباشرة' : currentLang === 'fr' ? 'En direct' : 'Live session',
    liveBadge: currentLang === 'ar' ? 'مباشر' : currentLang === 'fr' ? 'DIRECT' : 'LIVE',
    empty: currentLang === 'ar' ? 'لا توجد حصص لهذا الصف.' : currentLang === 'fr' ? 'Aucun cours pour cette classe.' : 'No sessions for this grade.',
    confirm: currentLang === 'ar' ? 'هل تريد حذف هذه الحصة؟' : currentLang === 'fr' ? 'Supprimer ce cours ?' : 'Delete this session?',
    loadError: currentLang === 'ar' ? 'تعذر تحميل الحصص.' : currentLang === 'fr' ? 'Impossible de charger les cours.' : 'Unable to load sessions.',
    sessionSaved: currentLang === 'ar' ? 'تم حفظ الحصة.' : currentLang === 'fr' ? 'Cours enregistré.' : 'Session saved.',
    sessionDeleted: currentLang === 'ar' ? 'تم حذف الحصة.' : currentLang === 'fr' ? 'Cours supprimé.' : 'Session deleted.',
    refresh: currentLang === 'ar' ? 'تحديث الحصص' : currentLang === 'fr' ? 'Actualiser les cours' : 'Refresh sessions',
  };
  const [gradeId, setGradeId] = useState<string>(grades[0]?.id || '');
  const [sessions, setSessions] = useState<StoredSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject: '',
    sourceName: '',
    sourceUrl: '',
    playbackUrl: '',
  });

  const loadSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const { sessions: loadedSessions } = await getDirectorSessions(token);
      setSessions(loadedSessions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, [token]);

  const gradeSessions = useMemo(() => sessions.filter((session) => session.gradeId === gradeId), [sessions, gradeId]);

  const saveSession = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const newSession: SessionInput = {
      ...form,
      gradeId,
      isLive,
      playbackUrl: form.playbackUrl || form.sourceUrl,
    };
    try {
      await createDirectorSession(token, newSession);
      setForm({ title: '', subject: '', sourceName: '', sourceUrl: '', playbackUrl: '' });
      setIsLive(false);
      setMessage(t.sessionSaved);
      await loadSessions();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t.loadError);
    } finally {
      setSaving(false);
    }
  };

  const removeSession = async (session: StoredSessionRecord) => {
    if (!window.confirm(t.confirm)) return;
    setError('');
    setMessage('');
    try {
      await deleteDirectorSession(token, session.id);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      setMessage(t.sessionDeleted);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t.loadError);
    }
  };

  const fieldClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800';

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <form onSubmit={saveSession} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-xs font-bold text-slate-700">
            {t.grade}
            <select className={fieldClass} value={gradeId} onChange={(event) => setGradeId(event.target.value)} required>
              {grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.name[currentLang]}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-bold text-slate-700">
            {t.title}
            <input className={fieldClass} required maxLength={200} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="space-y-1 text-xs font-bold text-slate-700">
            {t.subject}
            <input className={fieldClass} required maxLength={80} value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
          </label>
          <label className="space-y-1 text-xs font-bold text-slate-700">
            {t.sourceName}
            <input className={fieldClass} required maxLength={100} value={form.sourceName} onChange={(event) => setForm({ ...form, sourceName: event.target.value })} />
          </label>
          <label className="space-y-1 text-xs font-bold text-slate-700">
            {t.sourceUrl}
            <input className={fieldClass} type="url" required value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} />
          </label>
          <label className="space-y-1 text-xs font-bold text-slate-700">
            {t.playbackUrl}
            <input className={fieldClass} type="url" value={form.playbackUrl} onChange={(event) => setForm({ ...form, playbackUrl: event.target.value })} />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input type="checkbox" checked={isLive} onChange={(event) => setIsLive(event.target.checked)} className="accent-rose-600" />
            <Video className="h-4 w-4 text-rose-600" />
            {t.liveCheckbox}
          </label>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-60">
            <Plus className="h-4 w-4" />
            {saving ? '…' : t.save}
          </button>
        </div>
      </form>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p>}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900">{grades.find((grade) => grade.id === gradeId)?.name[currentLang]}</h3>
        <button type="button" onClick={() => void loadSessions()} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={t.refresh}>
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      {loading ? (
        <p className="py-5 text-center text-xs text-slate-500">…</p>
      ) : gradeSessions.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-center text-xs text-slate-500">{t.empty}</p>
      ) : (
        <div className="space-y-2">
          {gradeSessions.map((session) => {
            const studentCountKey = `students_count_${session.id}`;
            const maxCountKey = `max_students_${session.id}`;
            const currentStudents = parseInt(localStorage.getItem(studentCountKey) || '14', 10);
            const currentMax = parseInt(localStorage.getItem(maxCountKey) || '25', 10);

            return (
              <article key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase text-indigo-600">{session.subject}</p>
                  <p className="truncate text-sm font-bold text-slate-800">{session.title}</p>
                  <a className="text-xs text-slate-500 underline" href={session.sourceUrl} target="_blank" rel="noreferrer">{session.sourceName}</a>
                </div>

                {/* Director Columns: Number of Students & Maximum Allowed */}
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                  <div className="text-center">
                    <span className="block text-[10px] font-semibold text-slate-500">
                      {currentLang === 'ar' ? 'عدد الطلاب' : 'Students Enrolled'}
                    </span>
                    <span className="font-black text-emerald-700 text-sm">{currentStudents}</span>
                  </div>

                  <div className="text-center">
                    <span className="block text-[10px] font-semibold text-slate-500">
                      {currentLang === 'ar' ? 'الحد الأقصى' : 'Max Allowed'}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={150}
                      defaultValue={currentMax}
                      id={`input-max-${session.id}`}
                      className="w-16 text-center border border-slate-300 rounded-md font-bold text-xs p-0.5 bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(`input-max-${session.id}`) as HTMLInputElement;
                      if (input) {
                        localStorage.setItem(maxCountKey, input.value);
                        alert(currentLang === 'ar' ? `تم تحديث الحد الأقصى إلى ${input.value}` : `Max students updated to ${input.value}`);
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-md cursor-pointer"
                  >
                    {currentLang === 'ar' ? 'تثبيت' : 'Save'}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {session.isLive && <span className="text-[10px] font-black text-rose-600">{t.liveBadge}</span>}
                  <button type="button" onClick={() => void removeSession(session)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />{t.delete}
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
