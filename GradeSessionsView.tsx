import React, { useEffect, useState } from 'react';
import { Language, GradeLevelDef } from '../types';
import { translations } from '../translations';
import { getGradeSessions, getLiveStreamStatus } from '../services/cloudflareApi';
import type { CloudflareAccount, LiveStreamStatus, StoredSessionRecord } from '../services/cloudflareApi';
import { ArrowLeft, ArrowRight, Video, FileText, ExternalLink, RefreshCw } from 'lucide-react';

interface GradeSessionsViewProps {
  currentLang: Language;
  selectedGrade: GradeLevelDef;
  registeredAccount: CloudflareAccount | null;
  sessionToken: string;
  onBack: () => void;
}

export const GradeSessionsView: React.FC<GradeSessionsViewProps> = ({
  currentLang,
  selectedGrade,
  registeredAccount,
  sessionToken,
  onBack,
}) => {
  const isRTL = currentLang === 'ar';
  const [activeTab, setActiveTab] = useState<'stored' | 'live'>('stored');
  const [sessions, setSessions] = useState<StoredSessionRecord[]>([]);
  const [liveStream, setLiveStream] = useState<LiveStreamStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const registeredSessionId = registeredAccount?.registeredSessionId || '';
  const expiryTime = registeredAccount?.expiresAt
    ? Date.parse(`${registeredAccount.expiresAt.replace(' ', 'T').replace(/Z$/, '')}Z`)
    : null;
  const accountExpired = expiryTime !== null && (!Number.isFinite(expiryTime) || expiryTime <= Date.now());
  const canJoinLiveSession = Boolean(
    registeredAccount?.activated &&
    !accountExpired &&
    registeredAccount.role !== 'director' &&
    sessionToken &&
    registeredSessionId &&
    registeredAccount.gradeId === selectedGrade.id
  );
  const liveAccessError = !registeredAccount?.activated
    ? translations[currentLang].liveActivationRequired
    : accountExpired
      ? translations[currentLang].accountExpired
    : !canJoinLiveSession
      ? translations[currentLang].liveRegisteredSessionOnly
      : null;

  useEffect(() => {
    let active = true;
    if (activeTab === 'live' && (!registeredSessionId || !canJoinLiveSession)) {
      setIsLoading(false);
      setSessions([]);
      setLiveStream(null);
      setError(liveAccessError);
      return () => {
        active = false;
      };
    }
    setIsLoading(true);
    setError(null);
    Promise.all([
      getGradeSessions(
        selectedGrade.id,
        activeTab === 'live',
        activeTab === 'live' ? sessionToken : undefined,
        activeTab === 'live' ? registeredSessionId : undefined,
      ),
      activeTab === 'live'
        ? getLiveStreamStatus(sessionToken, registeredSessionId)
        : Promise.resolve(null),
    ])
      .then(([{ sessions: loadedSessions }, stream]) => {
        if (!active) return;
        setSessions(loadedSessions);
        setLiveStream(stream);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load sessions.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedGrade.id, activeTab, reloadKey, registeredAccount, sessionToken, registeredSessionId, canJoinLiveSession, liveAccessError]);

  const openSession = (session: StoredSessionRecord) => {
    const url = session.mediaUrl || session.playbackUrl || session.sourceUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-start">
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-2xl transition cursor-pointer text-xs sm:text-sm shadow-2xs"
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{currentLang === 'ar' ? 'رجوع' : currentLang === 'fr' ? 'Retour' : 'Back'}</span>
          </button>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-100">
                {selectedGrade.cycle[currentLang]}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {currentLang === 'ar' ? 'منهاج رسمي لبناني معتمد' : currentLang === 'fr' ? 'Programme officiel libanais' : 'Certified Official Curriculum'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {selectedGrade.name[currentLang]}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('stored')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeTab === 'stored' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{currentLang === 'ar' ? 'الموارد التعليمية' : currentLang === 'fr' ? 'Ressources pédagogiques' : 'Learning resources'}</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            disabled={!canJoinLiveSession}
            title={!canJoinLiveSession ? liveAccessError || undefined : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
              canJoinLiveSession ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            } ${
              activeTab === 'live' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
            <Video className="w-4 h-4" />
            <span>{currentLang === 'ar' ? 'الحصص المباشرة' : currentLang === 'fr' ? 'Sessions en direct' : 'Live Sessions'}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
          {currentLang === 'ar' ? 'جارٍ تحميل الحصص...' : currentLang === 'fr' ? 'Chargement des sessions...' : 'Loading sessions...'}
        </div>
      ) : error ? (
        <div role="alert" className="bg-white rounded-3xl border border-red-200 p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            onClick={() => setReloadKey((key) => key + 1)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {currentLang === 'ar' ? 'إعادة المحاولة' : currentLang === 'fr' ? 'Réessayer' : 'Retry'}
          </button>
        </div>
      ) : activeTab === 'live' ? (
        <div className="space-y-4">
          {liveStream?.playbackUrl ? (
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-lg">
              <iframe
                title={currentLang === 'ar' ? 'البث المباشر' : currentLang === 'fr' ? 'Diffusion en direct' : 'Live broadcast'}
                src={liveStream.playbackUrl}
                className="aspect-video w-full"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
              <p className="px-4 py-3 text-xs font-semibold text-slate-200">
                {currentLang === 'ar' ? 'غرفة البث المشتركة — انتظر بدء البث من المدير أو المدرّس.' : currentLang === 'fr' ? 'Salle de direct commune — en attente du démarrage par le directeur ou l’enseignant.' : 'Shared live room — waiting for the Director or educator to start streaming.'}
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-rose-200 bg-white p-10 text-center space-y-2">
              <Video className="mx-auto h-8 w-8 text-rose-600" />
              <p className="text-sm font-bold text-slate-800">
                {currentLang === 'ar' ? 'غرفة البث المباشر متاحة، لكن لم يتم إعداد مصدر البث بعد.' : currentLang === 'fr' ? 'La salle de direct est disponible, mais aucune source de diffusion n’est configurée.' : 'The live room is available, but a broadcast source has not been configured yet.'}
              </p>
            </div>
          )}
          {sessions.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {sessions.map((session) => (
                <article key={session.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-rose-600">{session.subject}</p>
                  <h3 className="text-base font-black text-slate-900">{session.title}</h3>
                  <button type="button" onClick={() => openSession(session)} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white">
                    <Video className="me-2 inline h-4 w-4" />{currentLang === 'ar' ? 'افتح الفيديو' : currentLang === 'fr' ? 'Ouvrir la vidéo' : 'Open video'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
          <p className="text-sm font-bold text-slate-800">
            {currentLang === 'ar' ? 'لا توجد حصص محفوظة لهذا الصف حتى الآن.' : currentLang === 'fr' ? 'Aucune session enregistrée pour ce niveau.' : 'No stored sessions are available for this grade yet.'}
          </p>
          <p className="text-xs text-slate-500">
            {currentLang === 'ar' ? 'سيتم عرض الحصص التعليمية الموثوقة هنا عند إضافتها إلى الكتالوج.' : currentLang === 'fr' ? 'Les ressources pédagogiques vérifiées apparaîtront ici lorsqu’elles seront ajoutées au catalogue.' : 'Trusted educational sessions will appear here when added to the catalog.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map((session) => (
            <article key={session.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-indigo-600">{session.subject}</p>
                  <h3 className="mt-1 text-base font-black text-slate-900">{session.title}</h3>
                  {session.teacherName && <p className="mt-1 text-xs text-slate-500">{session.teacherName}</p>}
                </div>
                {session.isLive && (
                  <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black text-rose-700">LIVE</span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <a
                  href={session.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-2"
                >
                  {session.sourceName}
                </a>
                <button
                  type="button"
                  onClick={() => openSession(session)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black text-white ${
                    session.isLive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-700 hover:bg-indigo-800'
                  }`}
                >
                  {session.isLive ? <Video className="w-4 h-4" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  {session.isLive
                    ? currentLang === 'ar' ? 'افتح البث المباشر' : currentLang === 'fr' ? 'Ouvrir le direct' : 'Open live video'
                    : currentLang === 'ar' ? 'افتح الحصة' : currentLang === 'fr' ? 'Ouvrir la session' : 'Open session'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
