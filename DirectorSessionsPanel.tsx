import React, { useEffect, useMemo, useState } from 'react';
import { Language, GradeLevelDef } from '../types';
import { deleteDirectorSession, getDirectorSessions, createDirectorSession, updateDirectorSessionLive, getDirectorGradePricing, updateDirectorGradePricing } from '../services/cloudflareApi';
import type { SessionInput, StoredSessionRecord } from '../services/cloudflareApi';
import { Plus, RefreshCw, Trash2, Eye } from 'lucide-react';

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
    grade: currentLang === 'ar' ? 'الصف' : currentLang === 'fr' ? 'Classe' : currentLang === 'es' ? 'Curso' : currentLang === 'it' ? 'Classe' : 'Grade',
    educatorName: currentLang === 'ar' ? 'اسم الأستاذ' : currentLang === 'fr' ? 'Nom de l’enseignant' : currentLang === 'es' ? 'Nombre del educador' : currentLang === 'it' ? 'Nome dell’educatore' : 'Educator name',
    subject: currentLang === 'ar' ? 'المادة' : currentLang === 'fr' ? 'Matière' : currentLang === 'es' ? 'Materia' : currentLang === 'it' ? 'Materia' : 'Subject',
    maxStudents: currentLang === 'ar' ? 'الحد الأقصى للطلاب' : currentLang === 'fr' ? 'Nombre maximum d’élèves' : currentLang === 'es' ? 'Máximo de estudiantes' : currentLang === 'it' ? 'Numero massimo di studenti' : 'Maximum students',
    save: currentLang === 'ar' ? 'حفظ الحصة' : currentLang === 'fr' ? 'Enregistrer le cours' : currentLang === 'es' ? 'Guardar sesión' : currentLang === 'it' ? 'Salva lezione' : 'Save session',
    delete: currentLang === 'ar' ? 'حذف' : currentLang === 'fr' ? 'Supprimer' : currentLang === 'es' ? 'Eliminar' : currentLang === 'it' ? 'Elimina' : 'Delete',
    join: currentLang === 'ar' ? 'انضمام ومراقبة' : currentLang === 'fr' ? 'Rejoindre et surveiller' : currentLang === 'es' ? 'Entrar y supervisar' : currentLang === 'it' ? 'Entra e monitora' : 'Join & monitor',
    liveBadge: currentLang === 'ar' ? 'مباشر' : currentLang === 'fr' ? 'EN DIRECT' : currentLang === 'es' ? 'EN DIRECTO' : currentLang === 'it' ? 'IN DIRETTA' : 'LIVE',
    offBadge: currentLang === 'ar' ? 'متوقف' : currentLang === 'fr' ? 'HORS LIGNE' : currentLang === 'es' ? 'INACTIVO' : currentLang === 'it' ? 'NON ATTIVO' : 'OFF',
    empty: currentLang === 'ar' ? 'لا توجد حصص لهذا الصف.' : currentLang === 'fr' ? 'Aucun cours pour cette classe.' : currentLang === 'es' ? 'No hay sesiones para este curso.' : currentLang === 'it' ? 'Nessuna lezione per questa classe.' : 'No sessions for this grade.',
    confirm: currentLang === 'ar' ? 'هل تريد حذف هذه الحصة نهائياً؟' : currentLang === 'fr' ? 'Supprimer définitivement ce cours ?' : currentLang === 'es' ? '¿Eliminar esta sesión definitivamente?' : currentLang === 'it' ? 'Eliminare definitivamente questa lezione?' : 'Permanently delete this session?',
    loadError: currentLang === 'ar' ? 'تعذر تحميل الحصص.' : currentLang === 'fr' ? 'Impossible de charger les cours.' : currentLang === 'es' ? 'No se pudieron cargar las sesiones.' : currentLang === 'it' ? 'Impossibile caricare le lezioni.' : 'Unable to load sessions.',
    sessionSaved: currentLang === 'ar' ? 'تم حفظ وتعيين الحصة بنجاح.' : currentLang === 'fr' ? 'Cours enregistré avec succès.' : currentLang === 'es' ? 'Sesión guardada correctamente.' : currentLang === 'it' ? 'Lezione salvata correttamente.' : 'Session saved successfully.',
    sessionDeleted: currentLang === 'ar' ? 'تم حذف الحصة نهائياً.' : currentLang === 'fr' ? 'Cours supprimé définitivement.' : currentLang === 'es' ? 'Sesión eliminada definitivamente.' : currentLang === 'it' ? 'Lezione eliminata definitivamente.' : 'Session permanently deleted.',
    refresh: currentLang === 'ar' ? 'تحديث الحصص' : currentLang === 'fr' ? 'Actualiser les cours' : currentLang === 'es' ? 'Actualizar sesiones' : currentLang === 'it' ? 'Aggiorna lezioni' : 'Refresh sessions',
    monthlyRate: currentLang === 'ar' ? 'السعر الشهري (USD)' : currentLang === 'fr' ? 'Tarif mensuel (USD)' : currentLang === 'es' ? 'Tarifa mensual (USD)' : currentLang === 'it' ? 'Tariffa mensile (USD)' : 'Monthly rate (USD)',
    title: currentLang === 'ar' ? 'تعيين وإضافة حصة للأستاذ' : currentLang === 'fr' ? 'Attribuer et ajouter un cours à un éducateur' : currentLang === 'es' ? 'Asignar y añadir una sesión al educador' : currentLang === 'it' ? 'Assegna e aggiungi una lezione all’educatore' : 'Assign & add educator session',
    subtitle: currentLang === 'ar' ? 'حدد الصف واسم الأستاذ والمادة والحد الأقصى للطلاب والسعر الشهري.' : currentLang === 'fr' ? 'Définissez la classe, l’éducateur, la matière, le nombre maximum d’élèves et le tarif mensuel.' : currentLang === 'es' ? 'Define el curso, el educador, la materia, el máximo de estudiantes y la tarifa mensual.' : currentLang === 'it' ? 'Imposta la classe, l’educatore, la materia, il numero massimo di studenti e la tariffa mensile.' : 'Set the grade, educator, subject, maximum students, and monthly rate.',
    educatorPrefix: currentLang === 'ar' ? 'الأستاذ: ' : currentLang === 'fr' ? 'Éducateur : ' : currentLang === 'es' ? 'Educador: ' : currentLang === 'it' ? 'Educatore: ' : 'Educator: ',
    month: currentLang === 'ar' ? 'شهرياً' : currentLang === 'fr' ? 'par mois' : currentLang === 'es' ? 'al mes' : currentLang === 'it' ? 'al mese' : 'per month',
    saveError: currentLang === 'ar' ? 'تعذر حفظ الحصة والسعر الشهري.' : currentLang === 'fr' ? 'Impossible d’enregistrer le cours et le tarif mensuel.' : currentLang === 'es' ? 'No se pudieron guardar la sesión y la tarifa mensual.' : currentLang === 'it' ? 'Impossibile salvare la lezione e la tariffa mensile.' : 'Unable to save session and monthly rate.',
    deleteError: currentLang === 'ar' ? 'تعذر حذف الحصة.' : currentLang === 'fr' ? 'Impossible de supprimer le cours.' : currentLang === 'es' ? 'No se pudo eliminar la sesión.' : currentLang === 'it' ? 'Impossibile eliminare la lezione.' : 'Unable to delete session.',
    statusError: currentLang === 'ar' ? 'تعذر تحديث حالة البث.' : currentLang === 'fr' ? 'Impossible de mettre à jour l’état du direct.' : currentLang === 'es' ? 'No se pudo actualizar el estado de la emisión.' : currentLang === 'it' ? 'Impossibile aggiornare lo stato della diretta.' : 'Unable to update live status.',
    educatorPlaceholder: currentLang === 'ar' ? 'مثال: الأستاذ مالاز' : currentLang === 'fr' ? 'Ex. : Prof. Malaz' : currentLang === 'es' ? 'P. ej.: Prof. Malaz' : currentLang === 'it' ? 'Es.: Prof. Malaz' : 'e.g. Prof. Malaz',
    subjectPlaceholder: currentLang === 'ar' ? 'مثال: الرياضيات' : currentLang === 'fr' ? 'Ex. : Mathématiques' : currentLang === 'es' ? 'P. ej.: Matemáticas' : currentLang === 'it' ? 'Es.: Matematica' : 'e.g. Mathematics',
    maxCapacity: currentLang === 'ar' ? (count: string) => `الحد الأقصى: ${count} طالباً` : currentLang === 'fr' ? (count: string) => `Capacité max. : ${count} élèves` : currentLang === 'es' ? (count: string) => `Capacidad máx.: ${count} estudiantes` : currentLang === 'it' ? (count: string) => `Capienza max.: ${count} studenti` : (count: string) => `Max capacity: ${count} students`,
    monitorAlert: currentLang === 'ar' ? (name: string) => `جارٍ الانضمام لمراقبة حصة الأستاذ: ${name}` : currentLang === 'fr' ? (name: string) => `Connexion pour surveiller le cours de ${name}` : currentLang === 'es' ? (name: string) => `Entrando para supervisar la sesión de ${name}` : currentLang === 'it' ? (name: string) => `Accesso per monitorare la lezione di ${name}` : (name: string) => `Joining to monitor ${name}’s session`,
  };

  const [gradeId, setGradeId] = useState<string>(grades[0]?.id || 'g12_lh');
  const [sessions, setSessions] = useState<StoredSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [monthlyRateUsd, setMonthlyRateUsd] = useState(125);
  const [pricesByGrade, setPricesByGrade] = useState<Record<string, number>>({});

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
      const [{ sessions: loadedSessions }, { prices }] = await Promise.all([
        getDirectorSessions(token),
        getDirectorGradePricing(token),
      ]);
      setSessions(loadedSessions);
      const nextPrices = Object.fromEntries(prices.map((price) => [price.gradeId, price.monthlyRateUsd]));
      setPricesByGrade(nextPrices);
      setMonthlyRateUsd(nextPrices[gradeId] ?? 125);
    } catch (loadError) {
      setError(currentLang === 'en' && loadError instanceof Error ? loadError.message : t.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, [token, gradeId]);

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
      isLive: false,
    };

    try {
      await updateDirectorGradePricing(token, gradeId, monthlyRateUsd);
      await createDirectorSession(token, newSessionInput);
      setPricesByGrade((current) => ({ ...current, [gradeId]: monthlyRateUsd }));
      await loadSessions();
      setMessage(t.sessionSaved);
    } catch (saveError) {
      setError(currentLang === 'en' && saveError instanceof Error ? saveError.message : t.saveError);
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
    try {
      await deleteDirectorSession(token, session.id);
      await loadSessions();
      setMessage(t.sessionDeleted);
    } catch (deleteError) {
      setError(currentLang === 'en' && deleteError instanceof Error ? deleteError.message : t.deleteError);
    }
  };

  // Toggle Live / Off for a session
  const toggleLiveStatus = async (session: StoredSessionRecord) => {
    setError('');
    setMessage('');
    try {
      await updateDirectorSessionLive(token, session.id, !session.isLive);
      await loadSessions();
    } catch (toggleError) {
      setError(currentLang === 'en' && toggleError instanceof Error ? toggleError.message : t.statusError);
    }
  };

  const fieldClass = 'w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:outline-indigo-600';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* 1. ASSIGN SESSION FORM */}
      <form onSubmit={saveSession} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-900">
            {t.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.subtitle}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Grade selection */}
          <label className="space-y-1 text-xs font-bold text-slate-700">
            {t.grade}
            <select className={fieldClass} value={gradeId} onChange={(e) => { setGradeId(e.target.value); setMonthlyRateUsd(pricesByGrade[e.target.value] ?? 125); }} required>
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
              placeholder={t.educatorPlaceholder}
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
              placeholder={t.subjectPlaceholder}
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

        <label className="space-y-1 text-xs font-bold text-slate-700">
          {t.monthlyRate}
          <input
            className={fieldClass}
            type="number"
            min={0}
            max={1000000}
            step="0.01"
            required
            value={monthlyRateUsd}
            onChange={(event) => setMonthlyRateUsd(Number(event.target.value))}
          />
        </label>
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
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
            {gradeSessions.length} {currentLang === 'ar' ? 'حصص مسجلة' : currentLang === 'fr' ? 'cours' : currentLang === 'es' ? 'sesiones' : currentLang === 'it' ? 'lezioni' : 'sessions'}
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
                    {t.educatorPrefix}
                    {session.title}
                  </h4>
                  <span className="text-[10px] text-indigo-700 font-bold block">
                    {(pricesByGrade[session.gradeId] ?? 125).toLocaleString(currentLang, { maximumFractionDigits: 2 })} USD / {t.month}
                  </span>

                  <span className="text-[10px] text-slate-500 font-semibold block">
                    {t.maxCapacity(maxStudents)}
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
                    title={currentLang === 'ar' ? 'تغيير حالة البث' : currentLang === 'fr' ? 'Changer l’état du direct' : currentLang === 'es' ? 'Cambiar estado de directo' : currentLang === 'it' ? 'Cambia stato della diretta' : 'Toggle live status'}
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
                        alert(t.monitorAlert(session.title));
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-black text-white transition cursor-pointer shadow-xs"
                    title={t.join}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{t.join}</span>
                  </button>

                  {/* Fixed Delete Button */}
                  <button
                    type="button"
                    onClick={() => void removeSession(session)}
                    className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition cursor-pointer"
                    title={t.delete}
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
