import React, { useEffect, useState } from 'react';
import type { Language } from '../types';
import type {
  CloudflareAccount,
  EducatorLesson,
  SchoolEducator,
} from '../services/cloudflareApi';
import {
  deleteEducatorLesson,
  getEducatorLessons,
  getSchoolEducators,
  saveEducatorLesson,
} from '../services/cloudflareApi';

interface LearningResourcesViewProps {
  currentLang: Language;
  schoolId: string;
  registeredAccount: CloudflareAccount | null;
  sessionToken: string;
}

export const LearningResourcesView: React.FC<LearningResourcesViewProps> = ({
  currentLang,
  schoolId,
  registeredAccount,
  sessionToken,
}) => {
  const isArabic = currentLang === 'ar';
  const isFrench = currentLang === 'fr';
  const isEducator = registeredAccount?.role === 'educator';

  const [educators, setEducators] = useState<SchoolEducator[]>([]);
  const [educatorId, setEducatorId] = useState('');
  const [lessons, setLessons] = useState<EducatorLesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<EducatorLesson | null>(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
  const [educatorsLoading, setEducatorsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const text = {
    title: currentLang === 'ar' ? 'الموارد التعليمية' : currentLang === 'fr' ? 'Ressources pédagogiques' : currentLang === 'es' ? 'Recursos educativos' : currentLang === 'it' ? 'Risorse didattiche' : 'Learning Resources',
    chooseEducator: currentLang === 'ar' ? 'اختر الأستاذ' : currentLang === 'fr' ? 'Choisir un éducateur' : currentLang === 'es' ? 'Elegir educador' : currentLang === 'it' ? 'Scegli educatore' : 'Choose an educator',
    classGrade: currentLang === 'ar' ? 'الصف' : currentLang === 'fr' ? 'Classe' : currentLang === 'es' ? 'Clase' : currentLang === 'it' ? 'Classe' : 'Class / Grade',
    noEducators: currentLang === 'ar' ? 'لا يوجد أساتذة مسجلون في هذه المدرسة بعد.' : currentLang === 'fr' ? 'Aucun éducateur inscrit dans cet établissement.' : currentLang === 'es' ? 'Todavía no hay educadores registrados en esta escuela.' : currentLang === 'it' ? 'Non ci sono ancora educatori registrati in questa scuola.' : 'No educators are registered in this school yet.',
    lesson: currentLang === 'ar' ? 'الدرس' : currentLang === 'fr' ? 'Leçon' : currentLang === 'es' ? 'Lección' : currentLang === 'it' ? 'Lezione' : 'Lesson',
    empty: currentLang === 'ar' ? 'لم ينشر الأستاذ هذا الدرس بعد.' : currentLang === 'fr' ? 'Cet éducateur n’a pas encore publié cette leçon.' : currentLang === 'es' ? 'Este educador aún no ha publicado esta lección.' : currentLang === 'it' ? 'Questo educatore non ha ancora pubblicato questa lezione.' : 'This educator has not published this lesson yet.',
    open: currentLang === 'ar' ? 'فتح الدرس' : currentLang === 'fr' ? 'Ouvrir la leçon' : currentLang === 'es' ? 'Abrir lección' : currentLang === 'it' ? 'Apri lezione' : 'Open lesson',
    edit: currentLang === 'ar' ? 'تعديل الدرس' : currentLang === 'fr' ? 'Modifier la leçon' : currentLang === 'es' ? 'Editar lección' : currentLang === 'it' ? 'Modifica lezione' : 'Edit lesson',
    back: currentLang === 'ar' ? 'رجوع إلى الدروس' : currentLang === 'fr' ? 'Retour aux leçons' : currentLang === 'es' ? 'Volver a las lecciones' : currentLang === 'it' ? 'Torna alle lezioni' : 'Back to lessons',
    lessonTitle: currentLang === 'ar' ? 'عنوان الدرس' : currentLang === 'fr' ? 'Titre de la leçon' : currentLang === 'es' ? 'Título de la lección' : currentLang === 'it' ? 'Titolo della lezione' : 'Lesson title',
    subject: currentLang === 'ar' ? 'المادة' : currentLang === 'fr' ? 'Matière' : currentLang === 'es' ? 'Materia' : currentLang === 'it' ? 'Materia' : 'Subject',
    description: currentLang === 'ar' ? 'وصف الدرس' : currentLang === 'fr' ? 'Description de la leçon' : currentLang === 'es' ? 'Descripción de la lección' : currentLang === 'it' ? 'Descrizione della lezione' : 'Lesson description',
    attachment: currentLang === 'ar' ? 'رفع ملف أو صورة أو فيديو' : currentLang === 'fr' ? 'Ajouter un fichier, une image ou une vidéo' : currentLang === 'es' ? 'Subir archivo, imagen o vídeo' : currentLang === 'it' ? 'Carica file, immagine o video' : 'Upload a file, image or video',
    currentFile: currentLang === 'ar' ? 'الملف المحفوظ' : currentLang === 'fr' ? 'Fichier enregistré' : currentLang === 'es' ? 'Archivo guardado' : currentLang === 'it' ? 'File salvato' : 'Saved file',
    save: currentLang === 'ar' ? 'حفظ الدرس' : currentLang === 'fr' ? 'Enregistrer la leçon' : currentLang === 'es' ? 'Guardar lección' : currentLang === 'it' ? 'Salva lezione' : 'Save lesson',
    delete: currentLang === 'ar' ? 'حذف محتوى الدرس' : currentLang === 'fr' ? 'Supprimer le contenu de la leçon' : currentLang === 'es' ? 'Eliminar contenido de la lección' : currentLang === 'it' ? 'Elimina contenuto della lezione' : 'Delete lesson content',
    published: currentLang === 'ar' ? 'تم حفظ الدرس بنجاح.' : currentLang === 'fr' ? 'Leçon enregistrée avec succès.' : currentLang === 'es' ? 'Lección guardada correctamente.' : currentLang === 'it' ? 'Lezione salvata correttamente.' : 'Lesson saved successfully.',
    deleted: currentLang === 'ar' ? 'تم حذف محتوى الدرس.' : currentLang === 'fr' ? 'Contenu de la leçon supprimé.' : currentLang === 'es' ? 'Contenido de la lección eliminado.' : currentLang === 'it' ? 'Contenuto della lezione eliminato.' : 'Lesson content deleted.',
    readOnly: currentLang === 'ar' ? 'وضع القراءة فقط' : currentLang === 'fr' ? 'Accès en lecture seule' : currentLang === 'es' ? 'Solo lectura' : currentLang === 'it' ? 'Sola lettura' : 'Read-only access',
    noFile: currentLang === 'ar' ? 'لم يتم إرفاق ملف.' : currentLang === 'fr' ? 'Aucun fichier joint.' : currentLang === 'es' ? 'No se ha adjuntado ningún archivo.' : currentLang === 'it' ? 'Nessun file allegato.' : 'No file attached.',
    fileLimit: currentLang === 'ar' ? 'الحد الأقصى لحجم الملف 50 ميغابايت.' : currentLang === 'fr' ? 'La taille maximale du fichier est de 50 Mo.' : currentLang === 'es' ? 'El tamaño máximo del archivo es de 50 MB.' : currentLang === 'it' ? 'La dimensione massima del file è di 50 MB.' : 'The maximum file size is 50 MB.',
  };

  const canEdit =
    isEducator &&
    Boolean(sessionToken) &&
    educatorId === registeredAccount?.id;

    useEffect(() => {
    let active = true;

    setEducators([]);
    setLessons([]);
    setSelectedLesson(null);
    setEducatorId('');
    setError('');
    setEducatorsLoading(true);

    if (!schoolId) {
      setEducatorsLoading(false);
      return () => {
        active = false;
      };
    }

    getSchoolEducators(schoolId)
      .then(({ educators: loaded }) => {
        if (!active) return;

        setEducators(loaded);

        if (isEducator && registeredAccount?.id) {
          const ownEducator = loaded.find(
            (educator) => educator.id === registeredAccount.id
          );

          if (!ownEducator) {
            setError('Your educator account does not belong to this school.');
            return;
          }

          setEducatorId(ownEducator.id);
          return;
        }

        const assignedEducator = loaded.find(
          (educator) =>
            Boolean(registeredAccount?.registeredSessionId) &&
            educator.registeredSessionId ===
              registeredAccount?.registeredSessionId
        );

        setEducatorId(
          assignedEducator?.id ||
          loaded[0]?.id ||
          ''
        );
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Unable to load educators.'
          );
        }
      })
      .finally(() => {
        if (active) setEducatorsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    schoolId,
    isEducator,
    registeredAccount?.id,
    registeredAccount?.registeredSessionId,
  ]);

  useEffect(() => {
    let active = true;

    setLessons([]);
    setSelectedLesson(null);
    setError('');

    if (!schoolId || !educatorId) return;

    setLoading(true);

    getEducatorLessons(schoolId, educatorId)
      .then(({ lessons: loaded }) => {
        if (active) {
          setLessons(loaded);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Unable to load lessons.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [schoolId, educatorId]);

  const openLesson = (lesson: EducatorLesson) => {
    setSelectedLesson(lesson);
    setTitle(lesson.title);
    setSubject(lesson.subject);
    setDescription(lesson.description);
    setFile(null);
    setError('');
    setMessage('');
  };

  const returnToLessons = () => {
    setSelectedLesson(null);
    setFile(null);
    setError('');
    setMessage('');
  };

  const saveLesson = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedLesson || !canEdit || !sessionToken) return;

    if (!title.trim() || !subject.trim()) {
      setError(
        isArabic
          ? 'يرجى إدخال عنوان الدرس والمادة.'
          : isFrench
            ? 'Veuillez saisir le titre et la matière.'
            : 'Enter both the lesson title and subject.'
      );
      return;
    }

    if (file && file.size > 100 * 1024 * 1024) {
      setError(text.fileLimit);
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const result = await saveEducatorLesson(
        sessionToken,
        selectedLesson.id,
        {
          title: title.trim(),
          subject: subject.trim(),
          description: description.trim(),
          file,
        }
      );

      setLessons((current) =>
        current.map((lesson) =>
          lesson.id === result.lesson.id
            ? result.lesson
            : lesson
        )
      );

      setSelectedLesson(result.lesson);
      setFile(null);
      setMessage(text.published);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to save this lesson.'
      );
    } finally {
      setSaving(false);
    }
  };

  const removeLesson = async () => {
    if (!selectedLesson || !canEdit || !sessionToken) return;

    const confirmed = window.confirm(
      isArabic
        ? 'هل تريد حذف محتوى هذا الدرس نهائياً؟'
        : isFrench
          ? 'Supprimer définitivement le contenu de cette leçon ?'
          : 'Permanently delete this lesson content?'
    );

    if (!confirmed) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const result = await deleteEducatorLesson(
        sessionToken,
        selectedLesson.id
      );

      setLessons((current) =>
        current.map((lesson) =>
          lesson.id === result.lesson.id
            ? result.lesson
            : lesson
        )
      );

      setSelectedLesson(result.lesson);
      setTitle('');
      setSubject('');
      setDescription('');
      setFile(null);
      setMessage(text.deleted);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to delete this lesson.'
      );
    } finally {
      setSaving(false);
    }
  };

  const mediaPreview = (lesson: EducatorLesson) => {
    if (!lesson.mediaUrl) {
      return <p className="text-xs text-slate-500">{text.noFile}</p>;
    }

    if (lesson.mediaType?.startsWith('image/')) {
      return (
        <a href={lesson.mediaUrl} target="_blank" rel="noreferrer">
          <img
            src={lesson.mediaUrl}
            alt={lesson.mediaName || lesson.title}
            className="max-h-96 w-full rounded-xl border border-slate-200 object-contain bg-slate-50"
          />
        </a>
      );
    }

    if (lesson.mediaType?.startsWith('video/')) {
      return (
        <video
          controls
          playsInline
          preload="metadata"
          src={lesson.mediaUrl}
          className="w-full max-h-96 rounded-xl bg-black"
        />
      );
    }

    return (
      <a
        href={lesson.mediaUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 underline"
      >
        {lesson.mediaName || text.open}
      </a>
    );
  };

  if (!schoolId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        {text.chooseEducator}
      </div>
    );
  }

    if (educatorsLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        …
      </div>
    );
  }

  if (educators.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        {text.noEducators}
      </div>
    );
  }

  return (
    <section className="space-y-5" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">{text.title}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {canEdit
                ? text.edit
                : text.readOnly}
            </p>
          </div>

          {!isEducator && (
            <label className="min-w-56 space-y-1">
              <span className="block text-xs font-bold text-slate-600">
                {text.chooseEducator}
              </span>
              <select
                value={educatorId}
                onChange={(event) => setEducatorId(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800"
              >
                {educators.map((educator) => (
                  <option key={educator.id} value={educator.id}>
                    {educator.username} · {educator.fullName} · {educator.subject} · {educator.className || educator.gradeId}
                  </option>
                ))}
              </select>
            </label>
          )}

          {isEducator && (
            <p className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">
              {registeredAccount?.username} · {registeredAccount?.fullName} · {registeredAccount?.schoolOrSubject} · {educators.find((educator) => educator.id === registeredAccount?.id)?.className || registeredAccount?.gradeId}
            </p>
          )}
        </div>
      </div>

      {educatorId && (() => {
        const selectedEducator = educators.find((educator) => educator.id === educatorId);
        if (!selectedEducator) return null;
        return (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold text-indigo-950">
              <span>{selectedEducator.username}</span>
              <span>{selectedEducator.fullName}</span>
              <span>{selectedEducator.subject}</span>
              <span>{text.classGrade}: {selectedEducator.className || selectedEducator.gradeId}</span>
            </div>
          </div>
        );
      })()}

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          {message}
        </p>
      )}

      {selectedLesson ? (
        <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <button
            type="button"
            onClick={returnToLessons}
            className="text-sm font-bold text-indigo-700 underline"
          >
            ← {text.back}
          </button>

          {canEdit ? (
            <form onSubmit={saveLesson} className="space-y-4">
              <h3 className="text-lg font-black text-slate-900">
                {text.lesson} {selectedLesson.slot}
              </h3>

              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-700">{text.lessonTitle}</span>
                <input
                  required
                  maxLength={150}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-700">{text.subject}</span>
                <input
                  required
                  maxLength={100}
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-700">{text.description}</span>
                <textarea
                  rows={5}
                  maxLength={5000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                />
              </label>

              {selectedLesson.mediaUrl && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700">{text.currentFile}</p>
                  {mediaPreview(selectedLesson)}
                </div>
              )}

              <label className="block space-y-2">
                <span className="text-xs font-bold text-slate-700">{text.attachment}</span>
                <input
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                />
                {file && (
                  <span className="block text-xs text-slate-500">
                    {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                )}
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {saving ? '…' : text.save}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void removeLesson()}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 disabled:opacity-50"
                >
                  {text.delete}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                  {selectedLesson.subject || text.lesson}
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-900">
                  {selectedLesson.title || `${text.lesson} ${selectedLesson.slot}`}
                </h3>
                {selectedLesson.description && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {selectedLesson.description}
                  </p>
                )}
              </div>

              {selectedLesson.title || selectedLesson.mediaUrl
                ? mediaPreview(selectedLesson)
                : <p className="text-sm text-slate-500">{text.empty}</p>}
            </div>
          )}
        </article>
      ) : loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          …
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 10 }, (_, index) => {
            const slot = index + 1;
            const lesson = lessons.find((item) => item.slot === slot);

            return (
              <button
                key={slot}
                type="button"
                onClick={() => lesson && openLesson(lesson)}
                disabled={!lesson}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-start shadow-sm transition hover:border-indigo-300 hover:shadow-md disabled:opacity-50"
              >
                <span className="text-[10px] font-black uppercase tracking-wide text-indigo-600">
                  {text.lesson} {slot}
                </span>
                <h3 className="mt-2 text-base font-black text-slate-900">
                  {lesson?.title || (canEdit ? text.edit : text.empty)}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {lesson?.subject || '—'}
                </p>
                {lesson?.mediaUrl && (
                  <span className="mt-3 inline-block text-xs font-bold text-indigo-700 underline">
                    {text.open}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
