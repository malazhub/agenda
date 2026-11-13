import React, { useEffect, useState, useRef } from 'react';

import { Language, GradeLevelDef } from '../types';
import { translations } from '../translations';

import type {
  Call,
  StreamVideoClient,
} from '@stream-io/video-client';

import {
  getGradeSessions,
  getLiveEducators,
  setEducatorLiveSession,
  getLiveStreamStatus,
} from '../services/cloudflareApi';

import type {
  CloudflareAccount,
  StoredSessionRecord,
} from '../services/cloudflareApi';
import { 
  ArrowLeft, 
  ArrowRight, 
  Video, 
  VideoOff,
  FileText, 
  ExternalLink, 
  RefreshCw, 
  Lock, 
  Maximize2, 
  Minimize, 
  Mic, 
  MicOff, 
  Users, 
  Clock, 
  Radio,
  CheckCircle2,
  PhoneOff
} from 'lucide-react';

interface GradeSessionsViewProps {
  currentLang: Language;
  selectedGrade: GradeLevelDef;
  initialTab?: 'stored' | 'live';
  autoOpenLiveClassroom?: boolean;
  registeredAccount: CloudflareAccount | null;
  sessionToken: string;
  onBack: () => void;
  onEnterLiveClassroom?: (session?: any) => void;
}

export const GradeSessionsView: React.FC<GradeSessionsViewProps> = ({
  currentLang,
  selectedGrade,
  initialTab = 'stored',
  autoOpenLiveClassroom = false,
  registeredAccount,
  sessionToken,
  onBack,
}) => {
  const isRTL = currentLang === 'ar';
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<'stored' | 'live'>(initialTab);
  const [storedSessions, setStoredSessions] = useState<StoredSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const startCallInProgressRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Authentication & safe verification
  const isSignedIn = Boolean(registeredAccount && (sessionToken || registeredAccount.id));
  const isAccountActive = Boolean(
    registeredAccount?.activated === true || 
    (registeredAccount as any)?.activated === 1 || 
    String(registeredAccount?.activated) === 'true' ||
    String(registeredAccount?.activated) === '1'
  );

  const isAccountExpired = Boolean(
    registeredAccount?.expiresAt &&
    registeredAccount.expiresAt.trim() !== '' &&
    Number.isFinite(Date.parse(registeredAccount.expiresAt.replace(' ', 'T').replace(/Z$/, '') + 'Z')) &&
    Date.parse(registeredAccount.expiresAt.replace(' ', 'T').replace(/Z$/, '') + 'Z') <= Date.now()
  );

  const isPaidAndActivated = Boolean(   registeredAccount?.paid === true &&   isAccountActive &&   !isAccountExpired );

  // Role detection
  
  const educatorName = registeredAccount?.fullName || localStorage.getItem('registered_educator_name') || 'Prof. Educator';
  const educatorSubject = registeredAccount?.schoolOrSubject || 'Academic Subject';

  // Use the Director-assigned session ID as the only source of classroom access.
const assignedSessionId =
  registeredAccount?.registeredSessionId || '';

const isStudent =
  registeredAccount?.role === 'student';

const isEducator =
  registeredAccount?.role === 'educator';

const hasValidClassroomAssignment =
  Boolean(assignedSessionId);

  const cleanText = (str: string) => 
    (str || '')
      .toLowerCase()
      .replace(/^(prof|dr|mme|mr|أستاذ|دكتور)\.?\s+/i, '')
      .replace(/[^a-z0-9\u0600-\u06FF]/gi, '')
      .trim();

  // Shared Stream Video classroom state
const [inLiveConference, setInLiveConference] = useState(false);
const [activeCallSession, setActiveCallSession] = useState<any>(null);

const [streamClient, setStreamClient] =
  useState<StreamVideoClient | null>(null);

const [streamCall, setStreamCall] =
  useState<Call | null>(null);

const [callParticipants, setCallParticipants] =
  useState<any[]>([]);

const participantsSubscription = useRef<any>(null); const autoOpenAttemptedRef = useRef(false);

const [timeLeft, setTimeLeft] = useState(45 * 60);
const [timerRunning, setTimerRunning] = useState(false);

const [isMicOn, setIsMicOn] = useState(false);
const [isVideoOn, setIsVideoOn] = useState(false);

const [isFullscreen, setIsFullscreen] = useState(false);
const [cameraError, setCameraError] = useState<string | null>(null);

const containerRef = useRef<HTMLDivElement>(null);

  
    // Directory of ALL currently broadcasting educators.
  const [liveSessionsList, setLiveSessionsList] = useState<Array<{
    id: string;
    grade: string;
    educatorName: string;
    subject: string;
    isLive: boolean;
  }>>([]);

  useEffect(() => {
    let active = true;

    const loadLiveSessions = async () => {
      try {
        const { educators } = await getLiveEducators(sessionToken);

        if (!active) return;

        const liveSessions = (educators || [])
          .filter((educator) => educator.isLive)
          .map((educator) => ({
            id: educator.sessionId,
            grade: educator.gradeId.toUpperCase(),
            educatorName: educator.educatorName,
            subject: educator.subject || 'Subject',
            isLive: true,
          }));

        setLiveSessionsList(liveSessions);
      } catch (error) {
        console.error(
          'Failed to load all live educators:',
          error
        );

        if (active) {
          setLiveSessionsList([]);
        }
      }
    };

    // Load all live educators immediately.
    void loadLiveSessions();

    // Refresh the complete live educator directory every 10 seconds.
    const refreshInterval = window.setInterval(() => {
      void loadLiveSessions();
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, [sessionToken, reloadKey]);


  // Load stored learning resources
  useEffect(() => {
    let active = true;
    if (activeTab === 'stored') {
      setIsLoading(true);
      setError(null);
      getGradeSessions(selectedGrade.id)
        .then(({ sessions: loadedSessions }) => {
          if (!active) return;
          setStoredSessions(loadedSessions);
        })
        .catch((requestError) => {
          if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load sessions.');
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [selectedGrade.id, activeTab, reloadKey]);

  // 45-minute countdown timer
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

    // Start the educator's actual video broadcast or join it as an assigned student.
  
const startLiveCall = async (session: any) => {
  if (startCallInProgressRef.current || inLiveConference) return;

  setCameraError(null);

  if (!isSignedIn || !registeredAccount || !sessionToken) {
    setCameraError('Please sign in before entering the live classroom.');
    return;
  }

  if (!isPaidAndActivated || registeredAccount.paid !== true) {
    setCameraError(
      'Your account must be activated, paid and not expired.'
    );
    return;
  }

  if (
    !assignedSessionId ||
    String(session?.id) !== String(assignedSessionId)
  ) {
    setCameraError(
      'Access denied. You can only enter your Director-assigned classroom.'
    );
    return;
  }

  if (!isEducator && !isStudent) {
    setCameraError('This account cannot enter a live classroom.');
    return;
  }

  if (isStudent && !session.isLive) {
    setCameraError(
      'Your assigned educator has not started the live class yet.'
    );
    return;
  }

  startCallInProgressRef.current = true;
  setIsLoading(true);

  let client: StreamVideoClient | null = null;
  let call: Call | null = null;
  let joinedCall = false;
  let startedBroadcastHere = false;

  try {
    // Make the assigned classroom available to its registered users.
    if (isEducator) {
      await setEducatorLiveSession(sessionToken, true);
      setReloadKey((key) => key + 1);
    }

    const credentials = await getLiveStreamStatus(
      sessionToken,
      String(session.id)
    );

    if (
      !credentials.apiKey ||
      !credentials.callId ||
      !credentials.token ||
      !credentials.userId
    ) {
      throw new Error(
        'The live classroom credentials are incomplete.'
      );
    }

    const { StreamVideoClient: VideoClient } =
      await import('@stream-io/video-client');

    client = new VideoClient({
      apiKey: credentials.apiKey,
      token: credentials.token,
      user: {
        id: credentials.userId,
        name: credentials.userName || registeredAccount.fullName,
      },
    });

    // Both assigned educators use the same registered classroom call.
    call = client.call('livestream', credentials.callId);

    await call.join({
      create: isEducator,
    });

    joinedCall = true;

            if (isEducator) {
      // Educator broadcasts audio only. Do not publish educator video.
      await call.camera.disable();
      setIsVideoOn(false);

      try {
        await call.microphone.enable();
        setIsMicOn(true);
      } catch (micError) {
        console.warn('Microphone could not be enabled:', micError);
        setIsMicOn(false);
      }

      // Start the broadcast only if it has not already started.
      if (call.state.backstage) {
        try {
          await call.goLive({
            start_hls: true,
          });

          startedBroadcastHere = true;
        } catch (goLiveError) {
          // Another assigned educator may have started it simultaneously.
          await call.get();

          if (call.state.backstage) {
            throw goLiveError;
          }
        }
      }
    } else {
      // Students may publish their own camera and microphone.
      await call.camera.enable();
      setIsVideoOn(true);

      try {
        await call.microphone.enable();
        setIsMicOn(true);
      } catch (micError) {
        console.warn('Student microphone could not be enabled:', micError);
        setIsMicOn(false);
      }
    }

    participantsSubscription.current?.unsubscribe();

    participantsSubscription.current =
      call.state.participants$.subscribe((participants) => {
        const uniqueParticipants = Array.from(
          new Map(
            participants.map((participant) => [
              participant.userId || participant.sessionId,
              participant,
            ])
          ).values()
        );

        setCallParticipants(uniqueParticipants);
      });

    setStreamClient(client);
    setStreamCall(call);
    setActiveCallSession(session);
    setInLiveConference(true);

    setTimeLeft(45 * 60);
    setTimerRunning(true);

  } catch (error) {
    console.error(
      'Unable to start or join Stream classroom:',
      error
    );

    // Never stop a shared broadcast just because one educator
    // failed to join or publish.
    if (call && joinedCall && isEducator) {
      let otherHostPresent = true;

      try {
        await call.get();

        otherHostPresent = call.state.participants.some(
          (participant) =>
            participant.userId !== registeredAccount.id &&
            participant.roles.includes('host')
        );
      } catch (stateError) {
        // If host presence cannot be checked, preserve the shared classroom.
        console.warn(
          'Unable to verify other classroom hosts:',
          stateError
        );
      }

      if (!otherHostPresent) {
        if (startedBroadcastHere) {
          await call.stopLive({
            continue_hls: false,
          }).catch(() => undefined);
        }

        try {
          await setEducatorLiveSession(sessionToken, false);
          setReloadKey((key) => key + 1);
        } catch (stopError) {
          console.error(
            'Unable to clear educator live status:',
            stopError
          );
        }
      }
    }

    if (call) {
      await call.leave().catch(() => undefined);
    }

    if (client) {
      await client.disconnectUser().catch(() => undefined);
    }

    setCameraError(
      error instanceof Error
        ? error.message
        : 'Unable to connect to the live classroom.'
    );

  } finally {
    startCallInProgressRef.current = false;
    setIsLoading(false);
  }
};

    // Stop the broadcast and leave the assigned Stream classroom.
  
const endLiveCall = async () => {
  let shouldStopSharedBroadcast = false;

  try {
    participantsSubscription.current?.unsubscribe();
    participantsSubscription.current = null;

    if (streamCall && isEducator) {
      // Refresh Stream state before deciding whether to stop the classroom.
      // Another assigned educator may still be hosting this same call.
      try {
        await streamCall.get();

        const otherHostPresent =
          streamCall.state.participants.some(
            (participant) =>
              participant.userId !== registeredAccount?.id &&
              participant.roles.includes('host')
          );

        shouldStopSharedBroadcast = !otherHostPresent;
      } catch (error) {
        // Do not risk stopping a shared classroom if host presence
        // cannot be verified.
        console.warn(
          'Unable to verify other classroom hosts:',
          error
        );
      }

      // Only the last educator leaving may stop the shared broadcast.
      if (shouldStopSharedBroadcast) {
        try {
          await streamCall.stopLive({
            continue_hls: false,
          });
        } catch (error) {
          console.warn(
            'Unable to stop live broadcast:',
            error
          );
        }
      }

      try {
        await streamCall.camera.disable();
      } catch (error) {
        console.warn('Unable to disable camera:', error);
      }

      try {
        await streamCall.microphone.disable();
      } catch (error) {
        console.warn('Unable to disable microphone:', error);
      }
    }

    if (streamCall) {
      try {
        await streamCall.leave();
      } catch (error) {
        console.warn('Unable to leave Stream call:', error);
      }
    }

    if (streamClient) {
      try {
        await streamClient.disconnectUser();
      } catch (error) {
        console.warn('Unable to disconnect Stream client:', error);
      }
    }

    // Keep the classroom live while another assigned educator remains.
    if (
      isEducator &&
      shouldStopSharedBroadcast &&
      sessionToken &&
      activeCallSession?.id
    ) {
      try {
        await setEducatorLiveSession(sessionToken, false);
        setReloadKey((key) => key + 1);
      } catch (error) {
        console.error(
          'Failed to stop educator live session:',
          error
        );
      }
    }

  } finally {
    setCallParticipants([]);

    setStreamCall(null);
    setStreamClient(null);

    setInLiveConference(false);
    setTimerRunning(false);
    setTimeLeft(45 * 60);

    setIsVideoOn(false);
    setIsMicOn(false);

    setActiveCallSession(null);
    setCameraError(null);
  }
};


  // Video track toggle
  const toggleVideoTrack = async () => {
  if (!streamCall || !isStudent) return;

  try {
    if (isVideoOn) {
      await streamCall.camera.disable();
      setIsVideoOn(false);
    } else {
      await streamCall.camera.enable();
      setIsVideoOn(true);
    }
  } catch (error) {
    console.error('Unable to toggle classroom camera:', error);
    setCameraError('Unable to change camera settings.');
  }
};

  // Mic track toggle
  const toggleAudioTrack = async () => {
  if (!streamCall || (!isEducator && !isStudent)) return;

  try {
    if (isMicOn) {
      await streamCall.microphone.disable();
      setIsMicOn(false);
    } else {
      await streamCall.microphone.enable();
      setIsMicOn(true);
    }
  } catch (error) {
    console.error('Unable to toggle classroom microphone:', error);
    setCameraError('Unable to change microphone settings.');
  }
};

  // Students may join only the exact classroom assigned by the Director.
const isStudentSessionMatch = (session: any): boolean => {
  if (!isStudent || !session || !assignedSessionId) {
    return false;
  }

  return String(session.id) === String(assignedSessionId);
};

  // Show every educator who is currently broadcasting.
const visibleLiveSessions = isEducator ? [] : liveSessionsList;

// Keep the student's own assigned classroom identified separately.
const studentPrimarySession =
  visibleLiveSessions.find(
    (session) => String(session.id) === String(assignedSessionId)
  ) || null;

    // Student join validation
  const handleStudentJoinRoom = (session: any) => {
    if (!isSignedIn || registeredAccount?.role !== 'student') {
      alert('Please sign in with your student account.');
      return;
    }

    if (!isPaidAndActivated) {
      alert('Your account must be activated, paid, and not expired.');
      return;
    }

    if (
      !assignedSessionId ||
      String(session?.id) !== String(assignedSessionId)
    ) {
      alert(
        'Access denied. You may only join the classroom assigned to you by the Director.'
      );
      return;
    }

    void startLiveCall(session);
  };

    // Educator opens their own Director-assigned live classroom.
  const handleEducatorOpenRoom = (session: any) => {
    if (!isSignedIn || !isEducator) {
      alert('Please sign in with your educator account.');
      return;
    }

    if (!assignedSessionId) {
      alert('No classroom has been assigned to your educator account.');
      return;
    }

    if (String(session?.id) !== String(assignedSessionId)) {
      alert('You can only open your Director-assigned classroom.');
      return;
    }

    void startLiveCall(session);
  };

  // Open the assigned live classroom automatically when requested
  // by the Live Broadcast Room entry button.
  useEffect(() => {
    if (!autoOpenLiveClassroom) {
      autoOpenAttemptedRef.current = false;
      return;
    }

    if (
      autoOpenAttemptedRef.current ||
      inLiveConference ||
      isLoading
    ) {
      return;
    }

    if (isEducator) {
      if (!assignedSessionId) {
        autoOpenAttemptedRef.current = true;
        setCameraError(
          'No classroom has been assigned to your educator account.'
        );
        return;
      }

      autoOpenAttemptedRef.current = true;

      void startLiveCall({
        id: assignedSessionId,
        grade: selectedGrade.name[currentLang],
        educatorName,
        subject: educatorSubject,
        isLive: true,
      });

      return;
    }

    if (isStudent) {
      // Wait until the assigned educator's live classroom appears.
      if (!studentPrimarySession) {
        return;
      }

      autoOpenAttemptedRef.current = true;
      void startLiveCall(studentPrimarySession);
    }
  }, [
    autoOpenLiveClassroom,
    inLiveConference,
    isLoading,
    isEducator,
    isStudent,
    assignedSessionId,
    studentPrimarySession,
    educatorName,
    educatorSubject,
    selectedGrade.name,
    currentLang,
    startLiveCall,
  ]);

  const openSession = (session: StoredSessionRecord) => {
    const s = session as any;
    const url = s.mediaUrl || session.playbackUrl || session.sourceUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

    // Actual connected participants are supplied by the Stream call.
  // Do not create attendee records from the signed-in account alone.

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-start" ref={containerRef}>
      
            {/* IN-CALL VIDEO CLASSROOM VIEW */}
      {inLiveConference && activeCallSession ? (
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] text-white">

          {/* CLASSROOM HEADER */}
          <div className="px-6 py-3.5 bg-slate-800/95 backdrop-blur-md flex flex-wrap items-center justify-between border-b border-slate-700 gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  void endLiveCall();
                  onBack();
                }}
                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white font-bold px-3 py-1.5 rounded-xl transition cursor-pointer text-xs"
                title="Back to Main Screen"
              >
                {isRTL
                  ? <ArrowRight className="w-4 h-4" />
                  : <ArrowLeft className="w-4 h-4" />}
                <span>{currentLang === 'ar' ? 'الرئيسية' : 'Main'}</span>
              </button>

              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>

              <div>
                <h3 className="font-bold text-sm">
              {selectedGrade.name[currentLang]}
            </h3>
            <p className="text-xs text-slate-300">
              {currentLang === 'ar' ? 'الأستاذ: ' : 'Educator: '}
              {activeCallSession.educatorName}
            </p>
            <p className="text-xs text-slate-400">
              {activeCallSession.subject}
            </p>
              </div>
            </div>

            {/* SESSION TIMER */}
            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-700 font-mono text-sm text-amber-400 font-black">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{formatTimer(timeLeft)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 transition text-slate-200 cursor-pointer"
                title="Full Screen"
              >
                {isFullscreen
                  ? <Minimize className="w-4 h-4" />
                  : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => void endLiveCall()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{t.endSession}</span>
              </button>
            </div>
          </div>

          {/* REAL STREAM VIDEO PARTICIPANTS */}
          <div className="flex-1 min-h-0 overflow-hidden bg-slate-950 p-4 flex flex-col">

            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-white">
                  {currentLang === 'ar'
                    ? 'البث المباشر للصف'
                    : 'Live Classroom'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {currentLang === 'ar'
                    ? 'الفيديو المباشر للمشاركين المتصلين فعلياً'
                    : 'Live video from participants actually connected to this call'}
                </p>
              </div>

              <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/30">
                {callParticipants.length}
                {' '}
                {currentLang === 'ar' ? 'مشاركون' : 'Connected'}
              </span>
            </div>

            {callParticipants.length === 0 ? (
              <div className="min-h-[40vh] flex flex-col items-center justify-center text-center">
                <Users className="w-12 h-12 text-slate-500 mb-3" />
                <h4 className="text-sm font-bold text-white">
                  {currentLang === 'ar'
                    ? 'في انتظار المشاركين'
                    : 'Waiting for participants'}
                </h4>
                <p className="text-xs text-slate-400 mt-2">
                  {currentLang === 'ar'
                    ? 'سيظهر الفيديو هنا عندما ينضم المشاركون إلى الصف.'
                    : 'Participant video will appear here when people join the classroom.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 grid-rows-1 gap-4 flex-1 min-h-0 w-full">

                {callParticipants.map((participant) => {
                  const participantName =
                    participant.name ||
                    participant.userId ||
                    'Participant';

                  const participantIsEducator =
                  Boolean(participant.roles?.includes('host'));
                
                const participantHasVideo =
                  !participantIsEducator &&
                  Boolean(participant.videoStream);

                  const isOwnParticipant =
                    participant.userId === registeredAccount?.id;

                  return (
                    <article
                      key={participant.sessionId || participant.userId}
                      className="relative h-full min-h-0 w-full bg-black rounded-2xl overflow-hidden border border-slate-700"
                    >
                      {participantHasVideo ? (
                        <video
                          ref={(videoElement) => {
                            if (
                              videoElement &&
                              participant.videoStream &&
                              videoElement.srcObject !== participant.videoStream
                            ) {
                              videoElement.srcObject =
                                participant.videoStream;

                              videoElement.autoplay = true;
                              videoElement.playsInline = true;

                              // Mute this user's own local preview.
                              // Keep remote participants audible.
                              videoElement.muted = isOwnParticipant;

                              void videoElement.play().catch((error) => {
                                console.warn(
                                  'Unable to play participant video:',
                                  error
                                );
                              });
                            }
                          }}
                          autoPlay
                          playsInline
                          muted={isOwnParticipant}
                          className="absolute inset-0 w-full h-full object-contain bg-black"
                        />
                      ) : (
                        <div className="min-h-[260px] flex flex-col items-center justify-center text-center p-4">
                          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                            <VideoOff className="w-8 h-8 text-slate-400" />
                          </div>

                          <p className="text-sm font-bold text-white">
                            {participantName}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            {currentLang === 'ar'
                              ? 'الكاميرا متوقفة'
                              : 'Camera is off'}
                          </p>
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="bg-black/75 backdrop-blur-md text-white text-xs font-bold px-3 py-2 rounded-lg truncate">
                          {participantName}
                          {isOwnParticipant
                            ? (currentLang === 'ar' ? ' (أنت)' : ' (You)')
                            : ''}
                        </span>

                        <span className="shrink-0 bg-emerald-950/90 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-md">
                          ● LIVE
                        </span>
                      </div>
                    </article>
                  );
                })}

              </div>
            )}
          </div>

          {/* CLASSROOM CONTROLS AND PARTICIPANT COUNT */}
          <div className="w-full bg-slate-800 p-4 border-t border-slate-700">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-300">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>
                  {currentLang === 'ar'
                    ? 'المشاركون المتصلون فعلياً:'
                    : 'Actual connected participants:'}
                </span>

                <span className="text-emerald-400">
                  {callParticipants.length}
                </span>
              </div>

              {/* Students control their camera; both roles control their microphone. */}
{(isEducator || isStudent) && (
                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    onClick={() => void toggleVideoTrack()}
                    className={`p-2.5 rounded-xl transition cursor-pointer ${
                      isVideoOn
                        ? 'bg-slate-700 text-slate-200'
                        : 'bg-rose-600 text-white'
                    }`}
                    title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
                  >
                    {isVideoOn
                      ? <Video className="w-4 h-4" />
                      : <VideoOff className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => void toggleAudioTrack()}
                    className={`p-2.5 rounded-xl transition cursor-pointer ${
                      isMicOn
                        ? 'bg-slate-700 text-slate-200'
                        : 'bg-rose-600 text-white'
                    }`}
                    title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {isMicOn
                      ? <Mic className="w-4 h-4" />
                      : <MicOff className="w-4 h-4" />}
                  </button>

                </div>
              )}
            </div>

            {cameraError && (
              <p className="mt-3 text-xs text-rose-300" role="alert">
                {cameraError}
              </p>
            )}

          </div>
        </div>
      ) : (

        /* NORMAL SESSIONS VIEW */
        <>
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-2xl transition cursor-pointer text-xs sm:text-sm shadow-2xs"
              >
                {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{currentLang === 'ar' ? 'رجوع' : 'Back'}</span>
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    {selectedGrade.cycle[currentLang]}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {currentLang === 'ar' ? 'منهاج رسمي لبناني معتمد' : 'Certified Official Curriculum'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {selectedGrade.name[currentLang]}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveTab('stored')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  activeTab === 'stored' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'الموارد التعليمية' : 'Learning resources'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('live')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  activeTab === 'live' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
                <Video className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'الحصص المباشرة' : 'Live Sessions'}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: LIVE SESSIONS */}
          {activeTab === 'live' ? (
  <div className="space-y-4">

    {cameraError && (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
      >
        {cameraError}
      </div>
    )}

    {isLoading && (
      <div
        role="status"
        className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-semibold text-indigo-800"
      >
        {currentLang === 'ar'
          ? 'جارٍ فتح الصف المباشر...'
          : 'Opening live classroom...'}
      </div>
    )}
              
              {/* STUDENT JOIN CARD */}
              {!isEducator && studentPrimarySession && (
                <div className="bg-linear-to-r from-emerald-950 via-slate-900 to-indigo-950 border-2 border-emerald-400 p-5 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4 text-white">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      {currentLang === 'ar' ? 'حصتك المباشرة المعتمدة جاهزة للانضمام' : 'Your Enrolled Live Classroom is Ready'}
                    </span>
                    <h3 className="text-xl font-black text-white">
                      {currentLang === 'ar' ? 'الأستاذ: ' : 'Educator: '}{studentPrimarySession.educatorName}
                    </h3>
                    <p className="text-xs text-slate-300 font-semibold">
                      {selectedGrade.name[currentLang]} • {studentPrimarySession.subject}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStudentJoinRoom(studentPrimarySession)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl transition cursor-pointer text-sm shadow-xl flex items-center gap-2 transform hover:scale-105 active:scale-95"
                  >
                    <Video className="w-5 h-5 text-slate-950" />
                    <span>{currentLang === 'ar' ? 'اضغط هنا للدخول إلى الصف (Join Class Now)' : 'Click to Join Class Now'}</span>
                  </button>
                </div>
              )}

                                          {/* CLICKABLE EDUCATOR START LIVE SESSION */}
              {isEducator && (
                <button
                  type="button"
                  onClick={() => {
                    // Require an authenticated educator account
                    if (!isSignedIn) {
                      alert(
                        currentLang === 'ar'
                          ? 'يرجى تسجيل الدخول بحساب الأستاذ.'
                          : 'Please sign in with your educator account.'
                      );
                      return;
                    }

                    // Only activated, non-expired accounts may open a class
                    if (!isPaidAndActivated) {
                      alert(
                        currentLang === 'ar'
                          ? 'حسابك غير مفعل أو انتهت صلاحيته. يرجى مراجعة الإدارة لتفعيل حسابك.'
                          : 'Your educator account is not activated or has expired. Please contact the Director to activate your account.'
                      );
                      return;
                    }

                    // Open the educator's own class directly.
                    // Do not require the educator to appear in liveSessionsList.
                    const mySession = {
                      id: registeredAccount?.registeredSessionId || '',
                      grade: selectedGrade.name[currentLang],
                      educatorName,
                      subject: educatorSubject,
                      isLive: true,
                    };
                    
                    handleEducatorOpenRoom(mySession);
                    disabled={isLoading}
                  }}
                  className="w-full text-start bg-slate-900 hover:bg-indigo-950 text-white rounded-3xl p-5 border-2 border-slate-800 hover:border-indigo-400 flex flex-wrap items-center justify-between gap-3 shadow-md transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                      <h3 className="font-black text-base">
                        {currentLang === 'ar'
                          ? 'بدء الحصة المباشرة'
                          : 'Start Live Session'}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-300 mt-2">
                      {currentLang === 'ar'
                        ? `اضغط هنا لفتح صفك المباشر وبدء البث في مادة (${educatorSubject})`
                        : `Click here to open your live classroom and start broadcasting ${educatorSubject}.`}
                    </p>
                  </div>

                  <span className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-5 py-3 rounded-xl shadow-md">
                    <Video className="w-4 h-4" />
                    {currentLang === 'ar' ? 'افتح الحصة الآن' : 'OPEN LIVE CLASS'}
                  </span>
                </button>
              )}
                {!isEducator && (
                <>
                  {/* Directory of ALL Live Educators */}
                  {visibleLiveSessions.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <Radio className="w-8 h-8 text-slate-400 mx-auto mb-3" />

                  <h3 className="text-sm font-black text-slate-800">
                    {currentLang === 'ar'
                      ? 'لا يوجد أساتذة يبثون مباشرة حالياً'
                      : 'No educators are broadcasting right now'}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2">
                    {currentLang === 'ar'
                      ? 'سيتم تحديث قائمة الأساتذة تلقائياً.'
                      : 'The live educator directory refreshes automatically.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleLiveSessions.map((session) => {
                    const isMyAssignedRoom =
                      isStudentSessionMatch(session);

                    const isEducatorOwnRoom =
                      isEducator &&
                      Boolean(assignedSessionId) &&
                      String(session.id) === String(assignedSessionId);

                    return (
                      <article
                        key={session.id}
                        className={`rounded-3xl border p-5 shadow-sm space-y-4 transition flex flex-col justify-between ${
                          isMyAssignedRoom || isEducatorOwnRoom
                            ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wide bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-md">
                              {session.subject}
                            </span>

                            <span className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                              LIVE
                            </span>
                          </div>

                          <h3 className="text-base font-black text-slate-900">
                            {session.educatorName}
                          </h3>

                          <p className="text-xs text-slate-500">
                            {session.grade}
                          </p>

                          {isMyAssignedRoom && !isEducator && (
                            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>
                                {currentLang === 'ar'
                                  ? 'صفك الدراسي المعتمد'
                                  : 'Your Enrolled Class'}
                              </span>
                            </span>
                          )}
                        </div>

                        <div>
                          {isEducator ? (
                            isEducatorOwnRoom ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEducatorOpenRoom(session)
                                }
                                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95"
                              >
                                <Video className="w-4 h-4" />
                                <span>
                                  {currentLang === 'ar'
                                    ? 'افتح الحصة المباشرة'
                                    : 'Open Live Video Session'}
                                </span>
                              </button>
                            ) : (
                              <div className="w-full py-2.5 text-center text-xs font-bold text-slate-400 bg-slate-100 rounded-xl">
                                {currentLang === 'ar'
                                  ? 'صف أستاذ آخر'
                                  : "Another Educator's Room"}
                              </div>
                            )
                          ) : isMyAssignedRoom ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleStudentJoinRoom(session)
                              }
                              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95"
                            >
                              <Video className="w-4 h-4" />
                              <span>
                                {currentLang === 'ar'
                                  ? 'انضم إلى الحصة المباشرة'
                                  : 'Join Live Session'}
                              </span>
                            </button>
                          ) : (
                            <div className="w-full py-2.5 text-center text-xs font-bold text-slate-400 bg-slate-100 rounded-xl">
                              {currentLang === 'ar'
                                ? 'غير مسجل في هذه الحصة'
                                : 'Not assigned to this session'}
                            </div>
                          )}
                        </div>
                      </article>
                                        );
                  })}
                </div>
              )}
  </>
)}
            </div>
          ) : (
            /* TAB 2: STORED RESOURCES */
            isLoading ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
                {currentLang === 'ar' ? 'جارٍ تحميل الحصص...' : 'Loading sessions...'}
              </div>
            ) : error ? (
              <div role="alert" className="bg-white rounded-3xl border border-red-200 p-6 text-center space-y-3">
                <p className="text-sm font-semibold text-red-700">{error}</p>
                <button
                  onClick={() => setReloadKey((key) => key + 1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {currentLang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </div>
            ) : storedSessions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
                <p className="text-sm font-bold text-slate-800">
                  {currentLang === 'ar' ? 'لا توجد حصص محفوظة لهذا الصف حتى الآن.' : 'No stored sessions are available for this grade yet.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {storedSessions.map((session) => (
                  <article key={session.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wide text-indigo-600">{session.subject}</p>
                        <h3 className="mt-1 text-base font-black text-slate-900">{session.title}</h3>
                        {(session as any).teacherName && <p className="mt-1 text-xs text-slate-500">{(session as any).teacherName}</p>}
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
                        className="text-xs font-semibold text-slate-500 underline"
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
                          ? currentLang === 'ar' ? 'افتح البث المباشر' : 'Open live video'
                          : currentLang === 'ar' ? 'افتح الحصة' : 'Open session'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};
