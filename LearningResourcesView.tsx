import React, { useEffect, useState } from 'react';
import type { Language } from './types';
import type { CloudflareAccount } from './cloudflareApi';
import {
  deleteEducatorLesson,
  getEducatorLessons,
  getSchoolEducators,
  saveEducatorLesson,
} from './cloudflareApi';
import type {
  EducatorLesson,
  SchoolEducator,
} from './cloudflareApi';

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const text = {
    title: isArabic ? 'الموارد التعليمية' : isFrench ? 'Ressources pédagogiques' : 'Learning Resources',
    chooseEducator: isArabic ? 'اختر الأستاذ' : isFrench ? 'Choisir un éducateur' : 'Choose an educator',
    noEducators: isArabic ? 'لا يوجد أساتذة مسجلون في هذه المدرسة بعد.' : isFrench ? 'Aucun éducateur inscrit dans cette école.' : 'No educators are registered in this school yet.',
    lesson: isArabic ? 'الدرس' : isFrench ? 'Leçon' : 'Lesson',
    empty: isArabic ? 'لم ينشر الأستاذ هذا الدرس بعد.' : isFrench ? 'Cet éducateur n’a pas encore publié cette leçon.' : 'This educator has not published this lesson yet.',
    open: isArabic ? 'فتح الدرس' : isFrench ? 'Ouvrir la leçon' : 'Open lesson',
    edit: isArabic ? 'تعديل الدرس' : isFrench ? 'Modifier la leçon' : 'Edit lesson',
    back: isArabic ? 'رجوع إلى الدروس' : isFrench ? 'Retour aux leçons' : 'Back to lessons',
    lessonTitle: isArabic ? 'عنوان الدرس' : isFrench ? 'Titre de la leçon' : 'Lesson title',
    subject: isArabic ? 'المادة' : isFrench ? 'Matière' : 'Subject',
    description: isArabic ? 'وصف الدرس' : isFrench ? 'Description' : 'Lesson description',
    attachment: isArabic ? 'رفع ملف أو صورة أو فيديو' : isFrench ? 'Ajouter un fichier, une image ou une vidéo' : 'Upload a file, photo or video',
    currentFile: isArabic ? 'الملف المحفوظ' : isFrench ? 'Fichier enregistré' : 'Saved file',
    save: isArabic ? 'حفظ الدرس' : isFrench ? 'Enregistrer la leçon' : 'Save lesson',
    delete: isArabic ? 'حذف محتوى الدرس' : isFrench ? 'Supprimer le contenu' : 'Delete lesson content',
    published: isArabic ? 'تم حفظ الدرس بنجاح.' : isFrench ? 'Leçon enregistrée.' : 'Lesson saved successfully.',
    deleted: isArabic ? 'تم حذف محتوى الدرس.' : isFrench ? 'Contenu de la leçon supprimé.' : 'Lesson content deleted.',
    readOnly: isArabic ? 'وضع القراءة فقط' : isFrench ? 'Lecture seule' : 'Read-only access',
    noFile: isArabic ? 'لم يتم إرفاق ملف.' : isFrench ? 'Aucun fichier joint.' : 'No file attached.',
    fileLimit: isArabic ? 'الحد الأقصى لحجم الملف 100 ميغابايت.' : isFrench ? 'La taille maximale du fichier est de 100 Mo.' : 'The maximum file size is 100 MB.',
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
    setError('');

    if (!schoolId) return;

    getSchoolEducators(schoolId)
      .then(({ educators: loaded }) => {
        if (!active) return;

        setEducators(loaded);

        if (isEducator && registeredAccount?.id) {
          setEducatorId(registeredAccount.id);
          return;
        }

        const assignedEducator = loaded.find(
          (educator) =>
            Boolean(registeredAccount?.registeredSessionId) &&
            educator.registeredSessionId === registeredAccount?.registeredSessionId
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
      });

    return () => {
      active = false;
    };
  }, [
    schoolId,
    registeredAccount?.id,
    registeredAccount?.role,
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

  if (educators.length === 0 && !loading) {
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
                    {educator.fullName} · {educator.subject}
                  </option>
                ))}
              </select>
            </label>
          )}

          {isEducator && (
            <p className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">
              {registeredAccount?.fullName}
            </p>
          )}
        </div>
      </div>

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
