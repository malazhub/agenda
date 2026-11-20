import React, { useEffect, useState, useRef } from 'react';
import { Language, GradeLevelDef } from '../types';
import { LEBANESE_GRADE_LEVELS } from '../data/mockGradesAndSessions';
import { translations } from '../translations';
import { LearningResourcesView } from './LearningResourcesView';
import {
  OwnCapability,
  type Call,
  type StreamVideoClient,
} from '@stream-io/video-client';
import {
  getLiveEducators,
  getSchoolEducators,
  getEducatorAssignedSession,
  createGuestLiveStream,
  setEducatorLiveSession,
  getLiveStreamStatus,
  getClassroomMessages,
  sendClassroomMessage,
  uploadClassroomAttachment,
  clearClassroomMessages,
} from '../services/cloudflareApi';

import type {
  CloudflareAccount,
  ClassroomMessage,
  StoredSessionRecord,
  SchoolEducator,
} from '../services/cloudflareApi';

import {
  ArrowLeft,
  ArrowRight,
  Video,
  VideoOff,
  FileText,
 
  Maximize2,
  Minimize,
  Mic,
  MicOff,
  Users,
  Clock,
  Radio,
  CheckCircle2,
  PhoneOff,
  Camera,
  Paperclip,
  Trash2,
  X,
} from 'lucide-react';

interface GradeSessionsViewProps {
  currentLang: Language;
  selectedGrade: GradeLevelDef;
  schoolId: string;
  initialTab?: 'stored' | 'live';
  autoOpenLiveClassroom?: boolean;
  registeredAccount: CloudflareAccount | null;
  sessionToken: string;
  onBack: () => void;
  onEnterLiveClassroom?: (session?: any) => void;
  onShowMessage: (message: string) => void;
  onRegisterSignOutCleanup?: (
    cleanup: (() => Promise<void>) | null
  ) => void;
}
const StreamParticipantVideo: React.FC<{
  call: Call;
  sessionId: string;
  muted: boolean;
}> = ({ call, sessionId, muted }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) return;

    const unbind = call.bindVideoElement(
      videoElement,
      sessionId,
      'videoTrack'
    );

    return () => {
      unbind?.();
    };
  }, [call, sessionId]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className="absolute inset-0 w-full h-full object-contain bg-black"
    />
  );
};

const StreamParticipantAudio: React.FC<{
  call: Call;
  sessionId: string;
}> = ({ call, sessionId }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement) return;

    audioElement.autoplay = true;
    audioElement.muted = false;

    const unbind = call.bindAudioElement(
      audioElement,
      sessionId,
      'audioTrack'
    );

    return () => {
      unbind?.();
    };
  }, [call, sessionId]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
    />
  );
};
export const GradeSessionsView: React.FC<GradeSessionsViewProps> = ({
  currentLang,
  selectedGrade,
  schoolId,
  initialTab = 'stored',
  autoOpenLiveClassroom = false,
  registeredAccount,
  sessionToken,
  onBack,
  onShowMessage,
  onRegisterSignOutCleanup,
}) => {
    const isRTL = currentLang === 'ar';

  const t = translations[currentLang];

  const inlineLabels: Record<string, { es: string; it: string }> = {
    'Your classroom role does not allow video publishing.': { es: 'Tu función en el aula no permite publicar vídeo.', it: 'Il tuo ruolo in aula non consente di trasmettere video.' },
    'Unable to change camera settings.': { es: 'No se pudo cambiar la configuración de la cámara.', it: 'Impossibile modificare le impostazioni della fotocamera.' },
    'Unable to send the message or file.': { es: 'No se pudo enviar el mensaje o el archivo.', it: 'Impossibile inviare il messaggio o il file.' },
    'Unable to clear the conversation.': { es: 'No se pudo borrar la conversación.', it: 'Impossibile cancellare la conversazione.' },
    'Close enlarged camera': { es: 'Cerrar cámara ampliada', it: 'Chiudi fotocamera ingrandita' },
    'Enlarge camera': { es: 'Ampliar cámara', it: 'Ingrandisci fotocamera' },
    'Click to return to small view': { es: 'Haz clic para volver al tamaño pequeño', it: 'Fai clic per tornare alla visualizzazione ridotta' },
    'Click to enlarge camera': { es: 'Haz clic para ampliar la cámara', it: 'Fai clic per ingrandire la fotocamera' },
    'Private Chat': { es: 'Chat privado', it: 'Chat privato' },
    'Clear all messages for both participants': { es: 'Borrar todos los mensajes para ambos participantes', it: 'Elimina tutti i messaggi per entrambi i partecipanti' },
    'Clear chat': { es: 'Borrar chat', it: 'Cancella chat' },
    'Select a student to start chatting': { es: 'Selecciona un estudiante para iniciar el chat', it: 'Seleziona uno studente per iniziare la chat' },
    'Your private conversation with the educator': { es: 'Tu conversación privada con el educador', it: 'La tua conversazione privata con l’educatore' },
    'The maximum file size is 25 MB.': { es: 'El tamaño máximo del archivo es de 25 MB.', it: 'La dimensione massima del file è di 25 MB.' },
    'Remove attachment': { es: 'Eliminar archivo adjunto', it: 'Rimuovi allegato' },
    'Write a private message...': { es: 'Escribe un mensaje privado...', it: 'Scrivi un messaggio privato...' },
    'Attach': { es: 'Adjuntar', it: 'Allega' },
    'Sending...': { es: 'Enviando...', it: 'Invio in corso...' },
    'Send': { es: 'Enviar', it: 'Invia' },
    'Self Cam': { es: 'Mi cámara', it: 'La mia fotocamera' },
    'Flip Camera': { es: 'Cambiar cámara', it: 'Inverti fotocamera' },
    'Turn Camera Off': { es: 'Apagar cámara', it: 'Spegni fotocamera' },
    'Turn Camera On': { es: 'Encender cámara', it: 'Accendi fotocamera' },
    'Private chat requires sign-in and an assigned educator.': { es: 'El chat privado requiere iniciar sesión y tener un educador asignado.', it: 'La chat privata richiede l’accesso e un educatore assegnato.' },
    'Select a student thumbnail to open the conversation.': { es: 'Selecciona la imagen de un estudiante para abrir la conversación.', it: 'Seleziona la miniatura di uno studente per aprire la conversazione.' },
    'No messages yet.': { es: 'Todavía no hay mensajes.', it: 'Ancora nessun messaggio.' },
    'Actual connected participants:': { es: 'Participantes conectados:', it: 'Partecipanti connessi:' },
    'Mute Microphone': { es: 'Silenciar micrófono', it: 'Disattiva microfono' },
    'Unmute Microphone': { es: 'Activar micrófono', it: 'Attiva microfono' },
    'Choose a section': { es: 'Elige una sección', it: 'Scegli una sezione' },
    'Learning resources': { es: 'Recursos educativos', it: 'Risorse didattiche' },
    'Live Sessions': { es: 'Sesiones en directo', it: 'Lezioni dal vivo' },
    'Opening live classroom...': { es: 'Abriendo el aula en directo...', it: 'Apertura dell’aula dal vivo...' },
    'Click to join as a guest': { es: 'Haz clic para entrar como invitado', it: 'Clicca per entrare come ospite' },
  };

  const classroomLabel = (ar: string, fr: string, en: string) => {
    if (currentLang === 'ar') return ar;
    if (currentLang === 'fr') return fr;
    if (currentLang === 'es' || currentLang === 'it') return inlineLabels[en]?.[currentLang] || en;
    return en;
  };
  const [activeTab, setActiveTab] = useState<'stored' | 'live'>(initialTab);
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
const [isGuestMode, setIsGuestMode] = useState(false);
const [guestUserId, setGuestUserId] = useState('');
const [isFullscreen, setIsFullscreen] = useState(false);
const [isStudentPreviewExpanded, setIsStudentPreviewExpanded] =
  useState(false);
const [isPrimaryVideoExpanded, setIsPrimaryVideoExpanded] = useState(false);
const [chatAllStudents, setChatAllStudents] = useState(false);
const [assignedClassroomDetails, setAssignedClassroomDetails] = useState<StoredSessionRecord | null>(null);
const [studentCameraDirection, setStudentCameraDirection] =
  useState<'front' | 'back' | null>(null);
const [cameraError, setCameraError] = useState<string | null>(null);
const [chatMessages, setChatMessages] =
  useState<ClassroomMessage[]>([]);

const [chatDraft, setChatDraft] = useState('');

const [chatAttachmentFile, setChatAttachmentFile] =
  useState<File | null>(null);

const chatAttachmentInputRef =
  useRef<HTMLInputElement | null>(null);
const chatRequestVersionRef = useRef(0);

const signOutCleanupRef =
  useRef<(() => Promise<void>) | null>(null);
const [chatError, setChatError] = useState<string | null>(null);
const [chatLoading, setChatLoading] = useState(false);
const [chatClearing, setChatClearing] = useState(false);
const [selectedParticipantId, setSelectedParticipantId] =
  useState<string | null>(null);
const [permissionRequests, setPermissionRequests] = useState<any[]>([]);
const [raisedHandIds, setRaisedHandIds] = useState<string[]>([]);
const [canSpeak, setCanSpeak] = useState(false);
const [allowedStudentIds, setAllowedStudentIds] = useState<string[]>([]);

useEffect(() => {
  if (!isEducator || !sessionToken || !registeredAccount?.registeredSessionId) {
    setAssignedClassroomDetails(null);
    return;
  }
  let active = true;
  getEducatorAssignedSession(sessionToken)
    .then(({ session }) => { if (active) setAssignedClassroomDetails(session); })
    .catch((error) => {
      console.warn('Unable to load the Director-assigned classroom details:', error);
      if (active) setAssignedClassroomDetails(null);
    });
  return () => { active = false; };
}, [isEducator, sessionToken, registeredAccount?.registeredSessionId]);

const callEventUnsubs = useRef<Array<() => void>>([]);
const containerRef = useRef<HTMLDivElement>(null);

  
  // Directory of every educator in this school, enriched with live status.
  const [liveSessionsList, setLiveSessionsList] = useState<Array<{
    id: string;
    educatorId: string;
    sessionId: string | null;
    grade: string;
    educatorName: string;
    subject: string;
    isLive: boolean;
  }>>([]);

  // Students and guests can see the full school educator directory.
  // Only the educator's exact assigned session can be joined by a student.
  useEffect(() => {
    let active = true;
    const loadEducatorDirectory = async () => {
      const currentSchoolId = registeredAccount?.schoolId || schoolId || '';
      if (!currentSchoolId) {
        setLiveSessionsList([]);
        return;
      }
      try {
        const [{ educators: schoolEducators }, { educators: liveEducators }] = await Promise.all([
          getSchoolEducators(currentSchoolId),
          getLiveEducators(currentSchoolId),
        ]);
        if (!active) return;

        const liveBySessionId = new Map(
          (liveEducators || [])
            .filter((educator) => educator.isLive)
            .map((educator) => [String(educator.sessionId), educator])
        );

        const directory = (schoolEducators || []).map((educator: SchoolEducator) => {
          const sessionId = educator.registeredSessionId || null;
          const liveSession = sessionId ? liveBySessionId.get(String(sessionId)) : undefined;
          return {
            id: sessionId || `educator-${educator.id}`,
            educatorId: educator.id,
            sessionId,
            grade: (liveSession?.gradeId || educator.gradeId || '').toUpperCase(),
            educatorName: educator.fullName,
            subject: liveSession?.subject || educator.subject || (currentLang === 'ar' ? 'المادة' : currentLang === 'fr' ? 'Matière' : currentLang === 'es' ? 'Materia' : currentLang === 'it' ? 'Materia' : 'Subject'),
            isLive: Boolean(liveSession?.isLive),
          };
        });

        setLiveSessionsList(directory.sort((a, b) => Number(b.isLive) - Number(a.isLive) || a.educatorName.localeCompare(b.educatorName)));
      } catch (error) {
        console.error('Failed to load the school educator directory:', error);
        if (active) setLiveSessionsList([]);
      }
    };

    void loadEducatorDirectory();
    const refreshInterval = window.setInterval(() => {
      void loadEducatorDirectory();
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, [schoolId, registeredAccount?.schoolId, reloadKey]);
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
  

  try {
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
    call = client.call('default', credentials.callId);

// The Worker creates the classroom before returning educator credentials.
// Neither educator nor student creates a second call in the browser.
await call.join({
  create: false,
});
    
    joinedCall = true;
    
    // Publish the educator as live only after Stream has created
    // and successfully joined the classroom call.
    if (isEducator) {
      await setEducatorLiveSession(sessionToken, true);
      setReloadKey((key) => key + 1);
    }

           


if (isEducator || isStudent) {
  // Enable the camera for both educator and student.
  // Do not inspect call.camera.state.status here:
  // camera.enable() is the operation that requests
  // and enables the camera.
  try {
    await call.camera.enable();

    setIsVideoOn(true);
    setCameraError(null);

    console.log(
      'Classroom camera enable completed:',
      call.camera.state
    );
    } catch (cameraError) {
    console.warn(
      'Classroom camera startup failed; camera remains disabled:',
      cameraError
    );

    setIsVideoOn(false);
    setCameraError(null);
  }

    // Enable the microphone independently.
  // Educators may publish audio immediately.
  // Students must wait until the educator grants SEND_AUDIO.
  if (isEducator) {
    try {
      await call.microphone.enable();
      setIsMicOn(true);
    } catch (micError) {
      console.error(
        'Classroom microphone startup failed:',
        micError
      );
      setIsMicOn(false);
    }
  } else if (isStudent) {
    try {
      await call.microphone.disable();
    } catch (micError) {
      console.warn(
        'Unable to keep the student microphone disabled:',
        micError
      );
    }

    setIsMicOn(false);
    setCanSpeak(
      call.permissionsContext.hasPermission(
        OwnCapability.SEND_AUDIO
      )
    );
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
  // Remove old event listeners before registering new ones.
callEventUnsubs.current.forEach((unsubscribe) => unsubscribe());
callEventUnsubs.current = [];

// Receive Raise Hand / Lower Hand notifications.
const unsubscribeCustom = call.on('custom', (event: any) => {
  const custom = event.custom;
  const senderId = event.user?.id;

  if (!senderId || custom?.type !== 'classroom.hand') {
    return;
  }

  const targetId = custom.targetUserId || senderId;

  if (custom.targetUserId) {
    const senderIsEducator = (call?.state.participants ?? []).some(
      (participant) =>
        participant.userId === senderId &&
        participant.roles?.some(
          (role: string) => role === 'admin' || role === 'host'
        )
    );

    if (!senderIsEducator) {
      return;
    }
  }

  setRaisedHandIds((current) => {
    if (custom.raised === true) {
      return current.includes(targetId)
        ? current
        : [...current, targetId];
    }

    return current.filter((id) => id !== targetId);
  });
});

// Keep the student's speaking permission synchronized with
// Stream's actual local capabilities.
const permissionStateSubscription =
  call!.state.ownCapabilities$.subscribe((capabilities) => {
    if (!isStudent) return;

    const allowed = capabilities.includes(
      OwnCapability.SEND_AUDIO
    );

    setCanSpeak(allowed);

    if (!allowed) {
      setIsMicOn(false);
      return;
    }

    // Permission is granted, but the student still controls
    // whether their microphone is switched on.
    setIsMicOn(call?.microphone.enabled ?? false);
    setCameraError(null);
  });

const unsubscribePermissions = () => {
  permissionStateSubscription.unsubscribe();
};

// Receive actual Stream microphone permission requests from students.
const unsubscribePermissionRequests = call.on(
  'call.permission_request',
  (event: any) => {
    if (
      !isEducator ||
      !event.user?.id ||
      !event.permissions?.includes(OwnCapability.SEND_AUDIO)
    ) {
      return;
    }

    setPermissionRequests((current) =>
      current.some(
        (request) => request.user?.id === event.user.id
      )
        ? current
        : [...current, event]
    );
  }
);

callEventUnsubs.current.push(
  unsubscribeCustom,
  unsubscribePermissions,
  unsubscribePermissionRequests
);

    setStreamClient(client);
    setStreamCall(call);
    setActiveCallSession(session);
    setInLiveConference(true);

    setTimeLeft(45 * 60);
    setTimerRunning(true);

  } catch (error) {
    callEventUnsubs.current.forEach((unsubscribe) => unsubscribe());
callEventUnsubs.current = [];
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

        otherHostPresent = call!.state.participants.some(
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
      'Unable to connect to the live classroom. Please try again.'
    );

  } finally {
    startCallInProgressRef.current = false;
    setIsLoading(false);
  }
};
// Create a separate, empty test room for visitors who are not signed in.
const startGuestLiveCall = async () => {
  if (startCallInProgressRef.current || inLiveConference) return;

  startCallInProgressRef.current = true;
  setIsLoading(true);
  setCameraError(null);

  let client: StreamVideoClient | null = null;
  let call: Call | null = null;

  try {
    // The Worker creates a unique guest identity and unique call ID.
    const credentials = await createGuestLiveStream();

    if (
      !credentials.apiKey ||
      !credentials.callId ||
      !credentials.token ||
      !credentials.userId
    ) {
      throw new Error(
        'The guest classroom credentials are incomplete.'
      );
    }

    const { StreamVideoClient: VideoClient } =
      await import('@stream-io/video-client');

    client = new VideoClient({
      apiKey: credentials.apiKey,
      token: credentials.token,
      user: {
        id: credentials.userId,
        name: credentials.userName || 'Guest',
      },
    });

    // This call is unique to this guest.
    // It is not an educator's assigned classroom.
    call = client.call('default', credentials.callId);

    await call.join({
      create: true,
    });

    // Enable the guest camera so the visitor can test it.
    try {
      await call.camera.selectDirection('front');
      await call.camera.enable();

      setIsVideoOn(
        call.camera.state.status === 'enabled'
      );
    } catch (cameraError) {
      console.warn(
        'Guest test camera could not start:',
        cameraError
      );

      setIsVideoOn(false);
    }

    // Keep the microphone off until the guest chooses to enable it.
    try {
      await call.microphone.disable();
    } catch (microphoneError) {
      console.warn(
        'Unable to keep the guest microphone disabled:',
        microphoneError
      );
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

    callEventUnsubs.current.forEach((unsubscribe) => unsubscribe());
    callEventUnsubs.current = [];

    setGuestUserId(credentials.userId);
    setIsGuestMode(true);

    setStreamClient(client);
    setStreamCall(call);

    // No grade, educator or subject is assigned to a guest test room.
    setActiveCallSession({
      id: credentials.callId,
      educatorName: '',
      subject: '',
      isLive: true,
      isGuest: true,
    });

    setInLiveConference(true);

    setTimeLeft(45 * 60);
    setTimerRunning(true);

    setCanSpeak(true);
    setIsMicOn(false);

  } catch (error) {
    console.error(
      'Unable to open the guest test room:',
      error
    );

    if (call) {
      await call.leave().catch(() => undefined);
    }

    if (client) {
      await client.disconnectUser().catch(() => undefined);
    }

    setGuestUserId('');
    setIsGuestMode(false);
    setIsVideoOn(false);
    setIsMicOn(false);

    setCameraError(
      'Unable to open the guest test room. Please try again.'
    );

  } finally {
    startCallInProgressRef.current = false;
    setIsLoading(false);
  }
};
    // Stop the broadcast and leave the assigned Stream classroom.
  
const endLiveCall = async () => {
  // Invalidate pending chat requests before leaving the classroom.
  chatRequestVersionRef.current += 1;

  setIsStudentPreviewExpanded(false);

  let shouldStopSharedBroadcast = false;
  try {
    participantsSubscription.current?.unsubscribe();
    participantsSubscription.current = null;
    callEventUnsubs.current.forEach((unsubscribe) => unsubscribe());
callEventUnsubs.current = [];
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

        if (streamCall && isGuestMode) {
      try {
        await streamCall.camera.disable();
      } catch (error) {
        console.warn(
          'Unable to disable guest camera:',
          error
        );
      }

      try {
        await streamCall.microphone.disable();
      } catch (error) {
        console.warn(
          'Unable to disable guest microphone:',
          error
        );
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
    // Clear connected participants and classroom permissions.
    setCallParticipants([]);
    setSelectedParticipantId(null);
    setRaisedHandIds([]);
    setCanSpeak(false);
    setAllowedStudentIds([]);
    setPermissionRequests([]);

    // Completely clear private chat from this browser session.
    setChatMessages([]);
    setChatDraft('');
    setChatAttachmentFile(null);
    setChatError(null);
    setChatLoading(false);
    setChatClearing(false);

    // Reset the file selector so the old attachment is not retained.
    if (chatAttachmentInputRef.current) {
      chatAttachmentInputRef.current.value = '';
    }

    // Disconnect the live classroom.
    setStreamCall(null);
    setStreamClient(null);

    setInLiveConference(false);
    setTimerRunning(false);
    setTimeLeft(45 * 60);

        setIsVideoOn(false);
    setIsMicOn(false);

    setIsGuestMode(false);
    setGuestUserId('');

    setActiveCallSession(null);
    setCameraError(null);
  }
};
// Keep the newest endLiveCall function available to App.tsx.
signOutCleanupRef.current = endLiveCall;

// Allow the app-level Sign Out button to clean up this classroom
// before the account and session token are removed.
useEffect(() => {
  if (!onRegisterSignOutCleanup) return;

  const cleanup = () => {
    const currentCleanup = signOutCleanupRef.current;

    return currentCleanup
      ? currentCleanup()
      : Promise.resolve();
  };

  onRegisterSignOutCleanup(cleanup);

  return () => {
    onRegisterSignOutCleanup(null);
  };
}, [onRegisterSignOutCleanup]);
  const handleRaiseHand = async () => {
  if (!streamCall || !isStudent) return;

  try {
    // Show the raised hand to the educator.
    await streamCall.sendCustomEvent({
      type: 'classroom.hand',
      raised: true,
    });

    setRaisedHandIds((current) =>
      current.includes(registeredAccount!.id)
        ? current
        : [...current, registeredAccount!.id]
    );

    // Ask Stream for permission to publish audio.
    await streamCall.requestPermissions({
      permissions: [OwnCapability.SEND_AUDIO],
    });
  } catch (error) {
    console.error('Unable to raise hand or request speaking permission:', error);
    setCameraError(
      'Unable to request speaking permission. Please try again.'
    );

    // Do not leave a false raised-hand indicator behind.
    await streamCall.sendCustomEvent({
      type: 'classroom.hand',
      raised: false,
    }).catch(() => undefined);

    setRaisedHandIds((current) =>
      current.filter((id) => id !== registeredAccount?.id)
    );
  }
};

const handleLowerHand = async () => {
  if (!streamCall || !isStudent || !registeredAccount) return;

  try {
    await streamCall.sendCustomEvent({
      type: 'classroom.hand',
      raised: false,
    });

    setRaisedHandIds((current) =>
      current.filter((id) => id !== registeredAccount.id)
    );
  } catch (error) {
    console.error('Unable to lower hand:', error);
    setCameraError('Unable to lower your hand. Please try again.');
  }
};
const clearStudentHand = async (studentId: string) => {
  if (!streamCall || !isEducator || !studentId) return;

  try {
    await streamCall.sendCustomEvent({
      type: 'classroom.hand',
      raised: false,
      targetUserId: studentId,
    });

    setRaisedHandIds((current) =>
      current.filter((id) => id !== studentId)
    );
  } catch (error) {
    console.error('Unable to clear student raised hand:', error);
    setCameraError('Unable to clear the student raised hand.');
  }
};

const allowStudentToSpeak = async (studentId: string) => {
  const call = streamCall;

  if (!call || !isEducator || !studentId) return;

  if (
    !call.permissionsContext.hasPermission(
      OwnCapability.UPDATE_CALL_PERMISSIONS
    )
  ) {
    setCameraError(
      'Your educator account does not have permission to manage student speaking permissions.'
    );
    return;
  }

  try {
    await call.grantPermissions(
      studentId,
      [OwnCapability.SEND_AUDIO]
    );

    setAllowedStudentIds((current) =>
      current.includes(studentId)
        ? current
        : [...current, studentId]
    );

    setPermissionRequests((current) =>
      current.filter(
        (request) => request.user?.id !== studentId
      )
    );

    setCameraError(null);
  } catch (error) {
    console.error(
      'Unable to grant speaking permission:',
      error
    );

    setCameraError(
      error instanceof Error
        ? `Unable to allow this student to speak: ${error.message}`
        : 'Unable to allow this student to speak.'
    );
  }
};

const stopStudentSpeaking = async (studentId: string) => {
  const call = streamCall;

  if (!call || !isEducator || !studentId) return;

  if (
    !call.permissionsContext.hasPermission(
      OwnCapability.UPDATE_CALL_PERMISSIONS
    )
  ) {
    setCameraError(
      'Your educator account does not have permission to manage student speaking permissions.'
    );
    return;
  }

  try {
    await call.revokePermissions(
      studentId,
      [OwnCapability.SEND_AUDIO]
    );

    setAllowedStudentIds((current) =>
      current.filter((id) => id !== studentId)
    );

    setPermissionRequests((current) =>
      current.filter(
        (request) => request.user?.id !== studentId
      )
    );

    setCameraError(null);
  } catch (error) {
    console.error(
      'Unable to revoke speaking permission:',
      error
    );

    setCameraError(
      error instanceof Error
        ? `Unable to stop this student from speaking: ${error.message}`
        : 'Unable to stop this student from speaking.'
    );
  }
};

// Start the student's front-facing camera.
const startStudentSelfCam = async () => {
  const call = streamCall;

  if (!call || (!isStudent && !isGuestMode)) return;

  if (
    !call.permissionsContext.hasPermission(
      OwnCapability.SEND_VIDEO
    )
  ) {
    setCameraError(
      classroomLabel(
        'لم يمنح نظام الصف إذن إرسال الفيديو.',
        'Le rôle dans la classe ne permet pas l’envoi vidéo.',
        'Your classroom role does not allow video publishing.'
      )
    );
    return;
  }

  try {
    await call.camera.selectDirection('front');
    await call.camera.enable();

    const cameraEnabled =
      call.camera.state.status === 'enabled';

    setIsVideoOn(cameraEnabled);

    if (!cameraEnabled) {
      throw new Error('The front camera did not become enabled.');
    }

    setStudentCameraDirection('front');
    setCameraError(null);
    } catch (error) {
    // Keep the technical error in the browser console only.
    // Never display browser or Stream video-source errors to students.
    console.warn(
      'Student front camera could not start:',
      error
    );

    setIsVideoOn(
      call.camera.state.status === 'enabled'
    );

    setCameraError(null);
  }
};

// Switch between the student's front and rear cameras.
const flipStudentCamera = async () => {
  const call = streamCall;

  if (!call || (!isStudent && !isGuestMode)) return;

  if (
    !call.permissionsContext.hasPermission(
      OwnCapability.SEND_VIDEO
    )
  ) {
    setCameraError(
      classroomLabel(
        'لم يمنح نظام الصف إذن إرسال الفيديو.',
        'Le rôle dans la classe ne permet pas l’envoi vidéo.',
        'Your classroom role does not allow video publishing.'
      )
    );
    return;
  }

  try {
    const nextDirection =
      call.camera.state.direction === 'back'
        ? 'front'
        : 'back';

    await call.camera.selectDirection(nextDirection);
    await call.camera.enable();

    const cameraEnabled =
      call.camera.state.status === 'enabled';

    setIsVideoOn(cameraEnabled);

    if (!cameraEnabled) {
      throw new Error('The selected camera did not become enabled.');
    }

    setStudentCameraDirection(nextDirection);
    setCameraError(null);
    } catch (error) {
    // Keep the technical error in the browser console only.
    console.warn(
      'Student camera switch failed:',
      error
    );

    setIsVideoOn(
      call.camera.state.status === 'enabled'
    );

    setCameraError(null);
  }
};

// Normal camera on/off control.
const toggleVideoTrack = async () => {
  const call = streamCall;

  if (
    !call ||
    (!isStudent && !isEducator && !isGuestMode)
  ) {
    return;
  }

  const cameraWasOn = isVideoOn;

  try {
    if (cameraWasOn) {
      await call.camera.disable();
      setIsVideoOn(false);
      setStudentCameraDirection(null);
      setIsStudentPreviewExpanded(false);
    } else {
      if (isStudent || isGuestMode) {
        await call.camera.selectDirection('front', {
          enableCamera: false,
        });
        setStudentCameraDirection('front');
      }

      await call.camera.enable();
      setIsVideoOn(true);
    }

    setCameraError(null);

  } catch (error) {
    console.error(
      'Unable to toggle classroom camera:',
      error
    );

    setCameraError(
      classroomLabel(
        'تعذر تغيير إعدادات الكاميرا.',
        'Impossible de modifier les paramètres de la caméra.',
        'Unable to change camera settings.'
      )
    );
  }
};

  // Mic track toggle
  const toggleAudioTrack = async () => {
  const call = streamCall;

  if (!call || (!isEducator && !isStudent && !isGuestMode)) return;

  // A real button click is a browser user gesture.
  // Use it to resume incoming classroom audio if autoplay was blocked.
  call.resumeAudio();

  // Students must have explicit Stream permission before publishing audio.
  if (
    isStudent &&
    !call.permissionsContext.hasPermission(
      OwnCapability.SEND_AUDIO
    )
  ) {
    setCanSpeak(false);
    setIsMicOn(false);
    setCameraError(
      'Your educator must grant microphone permission before you can speak. Raise your hand to request permission.'
    );
    return;
  }

  try {
    if (call.microphone.enabled) {
      await call.microphone.disable();
      setIsMicOn(false);
      setCameraError(null);
    } else {
      await call.microphone.enable();

      setIsMicOn(call!.microphone.enabled);
      setCameraError(null);
    }
  } catch (error) {
    console.error(
      'Classroom microphone operation failed:',
      error
    );

    setIsMicOn(false);

    setCameraError(
      error instanceof Error
        ? `Microphone could not start: ${error.message}`
        : 'Microphone could not start. Check browser and operating-system microphone permissions.'
    );
  }
};

  // Students may join only the exact classroom assigned by the Director.
const isStudentSessionMatch = (session: any): boolean => {
  if (!isStudent || !session || !assignedSessionId) {
    return false;
  }

  return Boolean(session.isLive) &&
    String(session.sessionId || session.id) === String(assignedSessionId);
};

  // Show every educator who is currently broadcasting.
const visibleLiveSessions = isEducator ? [] : [...liveSessionsList].sort((a, b) => Number(b.isLive) - Number(a.isLive) || a.educatorName.localeCompare(b.educatorName));

// Keep the student's own assigned classroom identified separately.
const studentPrimarySession =
  visibleLiveSessions.find(
    (session) =>
      session.isLive &&
      String(session.sessionId || session.id) === String(assignedSessionId)
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
        grade: assignedClassroomDetails?.gradeId || selectedGrade.name[currentLang],
        gradeId: assignedClassroomDetails?.gradeId || registeredAccount?.gradeId || '',
        educatorName,
        subject: assignedClassroomDetails?.subject || educatorSubject,
        title: assignedClassroomDetails?.title || '',
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

       // Identify the local Stream user for both registered users and guests.
  const localStreamUserId =
    registeredAccount?.id || guestUserId;

  // Keep chat selection independent from the main classroom video.
  const selectedParticipant =
    callParticipants.find((participant) => participant.userId === selectedParticipantId) ||
    callParticipants.find((participant) => participant.userId !== localStreamUserId && !participant.roles?.some((role: string) => role === 'admin' || role === 'host')) ||
    null;

  const connectedStudentParticipants = callParticipants.filter(
    (participant) => participant.userId !== localStreamUserId &&
      !participant.roles?.some((role: string) => role === 'admin' || role === 'host')
  );

  // Educators always see their own camera as the primary video.
  const educatorOwnParticipant = callParticipants.find(
    (participant) =>
      participant.userId === localStreamUserId
  );

  // A guest has no educator video.
  // Registered students retain the normal educator selection logic.
  const studentEducatorParticipant = isGuestMode
    ? null
    : (
        callParticipants.find(
          (participant) =>
            participant.roles?.some(
              (role: string) => role === 'admin' || role === 'host'
            )
        ) ||
        callParticipants.find(
          (participant) =>
            participant.name?.trim().toLowerCase() ===
            activeCallSession?.educatorName?.trim().toLowerCase()
        ) ||
        callParticipants.find(
          (participant) =>
            participant.userId !== localStreamUserId
        ) ||
        null
      );

  const studentOwnParticipant =
    isStudent || isGuestMode
      ? callParticipants.find(
          (participant) =>
            participant.userId === localStreamUserId
        ) || null
      : null;

  const primaryVideoParticipant = isGuestMode
    ? null
    : isEducator
      ? educatorOwnParticipant || null
      : studentEducatorParticipant;

  const chatStudentIds = isEducator
    ? (chatAllStudents
        ? connectedStudentParticipants.map((participant) => participant.userId)
        : (selectedParticipant && selectedParticipant.userId !== registeredAccount?.id ? [selectedParticipant.userId] : []))
    : isStudent ? [registeredAccount?.id || ''].filter(Boolean) : [];
  const chatStudentIdsKey = chatStudentIds.join('|');
  const chatStudentId = chatStudentIds[0] || '';
  const classroomSessionId = String(activeCallSession?.id || '');

  useEffect(() => {
    if (!isEducator || !inLiveConference || !sessionToken || !classroomSessionId) return;
    let active = true;
    const heartbeat = () => void setEducatorLiveSession(sessionToken, true).catch((error) => {
      if (active) console.warn('Educator live-presence heartbeat failed:', error);
    });
    heartbeat();
    const heartbeatId = window.setInterval(heartbeat, 25_000);
    return () => { active = false; window.clearInterval(heartbeatId); };
  }, [isEducator, inLiveConference, sessionToken, classroomSessionId]);
// Refresh each selected student's private thread; group mode merges individual threads.
useEffect(() => {
  const version = ++chatRequestVersionRef.current;
  const targets = chatStudentIdsKey ? chatStudentIdsKey.split('|').filter(Boolean) : [];
  if (!inLiveConference || !sessionToken || !classroomSessionId || !targets.length) {
    setChatMessages([]); setChatDraft(''); setChatAttachmentFile(null);
    setChatError(null); setChatLoading(false); setChatClearing(false);
    if (chatAttachmentInputRef.current) chatAttachmentInputRef.current.value = '';
    return;
  }
  let cancelled = false;
  let busy = false;
  const current = () => !cancelled && version === chatRequestVersionRef.current;
  const load = async (initial: boolean) => {
    if (busy || !current()) return;
    busy = true;
    if (initial) { setChatLoading(true); setChatError(null); }
    try {
      const groups = await Promise.all(targets.map(async (studentId) => {
        const result = await getClassroomMessages(sessionToken, classroomSessionId, studentId);
        return (result.messages || []).map((message) => ({ ...message, studentId }));
      }));
      if (!current()) return;
      setChatMessages((old) => {
        const all = new Map<number, ClassroomMessage>();
        old.forEach((message) => all.set(message.id, message));
        groups.flat().forEach((message) => all.set(message.id, message));
        return [...all.values()].sort((x, y) => x.id - y.id).slice(-200);
      });
      setChatError(null);
    } catch (error) {
      if (current()) setChatError(error instanceof Error ? error.message : 'Unable to receive classroom messages.');
    } finally {
      busy = false;
      if (initial && current()) setChatLoading(false);
    }
  };
  void load(true);
  const intervalId = window.setInterval(() => void load(false), 2000);
  return () => { cancelled = true; window.clearInterval(intervalId); };
}, [inLiveConference, sessionToken, classroomSessionId, chatStudentIdsKey]);

const handleSendChatMessage = async () => {
  const message = chatDraft.trim();
  if (!sessionToken || !classroomSessionId || !chatStudentIds.length || (!message && !chatAttachmentFile) || chatLoading || chatClearing) return;
  const version = chatRequestVersionRef.current;
  setChatLoading(true); setChatError(null);
  try {
    const saved: ClassroomMessage[] = [];
    // Whole-class mode fans out to individual private threads.
    for (const studentId of chatStudentIds) {
      let attachment:
        | { attachmentKey: string; attachmentName: string; attachmentType: string }
        | undefined;
      if (chatAttachmentFile) {
        attachment = await uploadClassroomAttachment(sessionToken, classroomSessionId, studentId, chatAttachmentFile);
        if (version !== chatRequestVersionRef.current) return;
      }
      const result = await sendClassroomMessage(sessionToken, classroomSessionId, studentId, message, attachment);
      if (version !== chatRequestVersionRef.current) return;
      if (!result.sent || !result.message) throw new Error('The server did not confirm that the message was saved.');
      saved.push({ ...result.message, studentId });
    }
    setChatMessages((old) => {
      const all = new Map<number, ClassroomMessage>(old.map((item) => [item.id, item]));
      saved.forEach((item) => all.set(item.id, item));
      return [...all.values()].sort((x, y) => x.id - y.id).slice(-200);
    });
    setChatDraft(''); setChatAttachmentFile(null);
    if (chatAttachmentInputRef.current) chatAttachmentInputRef.current.value = '';
  } catch (error) {
    if (version === chatRequestVersionRef.current) {
      setChatError(error instanceof Error ? error.message : 'Unable to send the message or file.');
    }
  } finally {
    if (version === chatRequestVersionRef.current) setChatLoading(false);
  }
};

const handleClearChatMessages = async () => {
  if (
    !sessionToken ||
    !classroomSessionId ||
    !chatStudentIds.length ||
    chatLoading ||
    chatClearing
  ) {
    return;
  }

  const confirmed = window.confirm(
    classroomLabel(
      'هل تريد حذف جميع الرسائل والملفات من المحادثة بينك وبين الطرف الآخر؟ لا يمكن التراجع عن هذا الإجراء.',
      'Voulez-vous supprimer tous les messages et fichiers de cette conversation pour les deux participants ? Cette action est irréversible.',
      'Clear all messages and files from this conversation for both participants? This cannot be undone.'
    )
  );

  if (!confirmed) return;

  // Track the request so it cannot update the screen after sign-out.
  const requestVersion = chatRequestVersionRef.current;

  setChatClearing(true);
  setChatError(null);

  try {
    const results = await Promise.all(chatStudentIds.map((studentId) =>
      clearClassroomMessages(sessionToken, classroomSessionId, studentId)
    ));
    const result = { cleared: results.every((item) => item.cleared) };

    // Ignore an old response if classroom cleanup has started.
    if (
      requestVersion !== chatRequestVersionRef.current
    ) {
      return;
    }

    if (!result.cleared) {
      throw new Error(
        'The conversation could not be cleared.'
      );
    }

    setChatMessages([]);
    setChatDraft('');
    setChatAttachmentFile(null);

    if (chatAttachmentInputRef.current) {
      chatAttachmentInputRef.current.value = '';
    }

  } catch (error) {
    if (
      requestVersion === chatRequestVersionRef.current
    ) {
      console.error(
        'Unable to clear classroom conversation:',
        error
      );

      setChatError(
        error instanceof Error
          ? error.message
          : classroomLabel(
              'تعذر مسح المحادثة.',
              'Impossible d’effacer la conversation.',
              'Unable to clear the conversation.'
            )
      );
    }
  } finally {
    if (
      requestVersion === chatRequestVersionRef.current
    ) {
      setChatClearing(false);
    }
  }
};

  // Do not create attendee records from the signed-in account alone.

  return (
    <div   className="space-y-6 animate-in fade-in duration-300 text-start"   ref={containerRef}   onPointerDown={() => {     if (isEducator && streamCall) {       streamCall.resumeAudio();     }   }} >
      
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
                <span>{currentLang === 'ar' ? 'الرئيسية' : currentLang === 'fr' ? 'Accueil' : currentLang === 'es' ? 'Inicio' : currentLang === 'it' ? 'Home' : 'Main'}</span>
              </button>

              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>

              <div>
                {isGuestMode ? (
                  <h3 className="font-bold text-sm">
                    {currentLang === 'ar' ? 'غرفة البث المباشر' : currentLang === 'fr' ? 'Salle de diffusion' : currentLang === 'es' ? 'Sala de emisión' : currentLang === 'it' ? 'Sala trasmissione' : 'Broadcast Room'}
                  </h3>
                ) : (
                  <>
                    <h3 className="font-bold text-sm">
                      {(() => {
                        const gradeId = activeCallSession.gradeId || assignedClassroomDetails?.gradeId || registeredAccount?.gradeId;
                        const gradeName = gradeId ? (LEBANESE_GRADE_LEVELS.find((grade) => grade.id.toLowerCase() === String(gradeId).toLowerCase())?.name[currentLang] || String(gradeId).toUpperCase()) : (activeCallSession.grade || selectedGrade.name[currentLang]);
                        const subject = activeCallSession.subject || assignedClassroomDetails?.subject || educatorSubject;
                        return `${gradeName} — ${subject}`;
                      })()}
                    </h3>
                    <p className="text-xs text-slate-300">{currentLang === 'ar' ? 'الأستاذ: ' : currentLang === 'fr' ? 'Éducateur : ' : currentLang === 'es' ? 'Educador: ' : currentLang === 'it' ? 'Educatore: ' : 'Educator: '}{activeCallSession.educatorName || educatorName}</p>
                  </>
                )}
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

                    {/* RECEIVE AUDIO FROM ALL REMOTE CLASSROOM PARTICIPANTS */}
          {streamCall &&
            callParticipants
                            .filter(
                (participant) =>
                  participant.userId !== localStreamUserId
              )
              .map((participant) => (
                <StreamParticipantAudio
                  key={participant.sessionId}
                  call={streamCall}
                  sessionId={participant.sessionId}
                />
              ))}

          {/* REAL STREAM VIDEO PARTICIPANTS */}
          {/* CLASSROOM VIDEO, STUDENT THUMBNAILS AND PRIVATE CHAT */}
<div className="flex-1 min-h-0 overflow-y-auto overscroll-contain lg:overflow-hidden bg-slate-950 p-4 flex flex-col">

  <div className="flex items-center justify-between gap-3 mb-4">
    <div>
      <h3 className="text-sm font-black text-white">
        {currentLang === 'ar' ? 'البث المباشر للصف' : currentLang === 'fr' ? 'Classe en direct' : currentLang === 'es' ? 'Aula en directo' : currentLang === 'it' ? 'Aula dal vivo' : 'Live Classroom'}
      </h3>
      <p className="text-xs text-slate-400 mt-1">
        {currentLang === 'ar' ? 'الفيديو المباشر للمشاركين المتصلين فعلياً' : currentLang === 'fr' ? 'Vidéo en direct des participants connectés' : currentLang === 'es' ? 'Vídeo en directo de los participantes conectados' : currentLang === 'it' ? 'Video in diretta dei partecipanti collegati' : 'Live video from connected classroom participants'}
      </p>
    </div>

    <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/30">
      {callParticipants.length}
      {' '}
      {currentLang === 'ar' ? 'مشاركون' : currentLang === 'fr' ? 'connectés' : currentLang === 'es' ? 'conectados' : currentLang === 'it' ? 'connessi' : 'Connected'}
    </span>
  </div>

    <div
    className={`flex-none lg:flex-1 min-h-0 grid grid-cols-1 gap-4 ${
      isEducator
        ? 'lg:grid-cols-[minmax(0,1fr)_18rem_20rem]'
        : 'lg:grid-cols-[minmax(0,1fr)_20rem]'
    }`}
  >
    {callParticipants.length === 0 && !isGuestMode ? (
      <div className="lg:col-span-2 min-h-[40vh] flex flex-col items-center justify-center text-center">
        <Users className="w-12 h-12 text-slate-500 mb-3" />

        <h4 className="text-sm font-bold text-white">
          {currentLang === 'ar' ? 'في انتظار المشاركين' : currentLang === 'fr' ? 'En attente des participants' : currentLang === 'es' ? 'Esperando a los participantes' : currentLang === 'it' ? 'In attesa dei partecipanti' : 'Waiting for participants'}
        </h4>

        <p className="text-xs text-slate-400 mt-2">
          {currentLang === 'ar' ? 'سيظهر الفيديو هنا عندما ينضم المشاركون إلى الصف.' : currentLang === 'fr' ? 'La vidéo apparaîtra ici lorsque les participants rejoindront la classe.' : currentLang === 'es' ? 'El vídeo aparecerá aquí cuando los participantes entren en el aula.' : currentLang === 'it' ? 'Il video apparirà qui quando i partecipanti entreranno nell’aula.' : 'Participant video will appear here when people join the classroom.'}
        </p>
      </div>
    ) : (
      <>
      {/* MAIN VIDEO */}
      <div className="min-w-0 min-h-0 flex flex-col">

                <div
                  onClick={() => setIsPrimaryVideoExpanded((expanded) => !expanded)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setIsPrimaryVideoExpanded((expanded) => !expanded); } }}
                  aria-label={isPrimaryVideoExpanded ? 'Minimize educator video' : 'Enlarge educator video'}
                  className={`${isPrimaryVideoExpanded ? 'fixed inset-0 z-[100] bg-black p-3 sm:p-6' : 'relative flex-1 min-h-[240px] bg-black rounded-2xl overflow-hidden border border-slate-700'} cursor-zoom-in`}
                >

          <button type="button" onClick={(event) => { event.stopPropagation(); setIsPrimaryVideoExpanded((expanded) => !expanded); }} className="absolute right-3 top-3 z-20 rounded-lg bg-black/75 p-2 text-white hover:bg-black" title={isPrimaryVideoExpanded ? 'Close enlarged video' : 'Click to enlarge classroom video'} aria-label={isPrimaryVideoExpanded ? 'Minimize classroom video' : 'Enlarge classroom video'}>
            {isPrimaryVideoExpanded ? <Minimize className="h-4 w-4"/> : <Maximize2 className="h-4 w-4"/>}
          </button>
          {streamCall && primaryVideoParticipant && (
            <StreamParticipantVideo
              call={streamCall}
              sessionId={primaryVideoParticipant.sessionId}
              muted={
                primaryVideoParticipant.userId === localStreamUserId
              }
            />
          )}
          {isGuestMode && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="rounded-xl bg-black/70 px-5 py-3 text-sm font-bold text-white">
                {currentLang === 'ar'
                  ? 'لم يتم اختيار أستاذ'
                  : currentLang === 'fr'
                    ? 'Aucun éducateur sélectionné'
                    : 'No educator selected'}
              </span>
            </div>
          )}
          {primaryVideoParticipant && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
              <span className="bg-black/75 text-white text-xs font-bold px-3 py-2 rounded-lg truncate">
                {primaryVideoParticipant.name ||
                  primaryVideoParticipant.userId ||
                  'Participant'}
                {primaryVideoParticipant.userId === localStreamUserId
                  ? (currentLang === 'ar' ? ' (أنت)' : currentLang === 'fr' ? ' (Vous)' : currentLang === 'es' ? ' (Tú)' : currentLang === 'it' ? ' (Tu)' : ' (You)')
                  : ''}
              </span>

              <span className="shrink-0 bg-emerald-950/90 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-md">
                ● LIVE
              </span>
            </div>
          )}

                                 {(isStudent || isGuestMode) &&
            isVideoOn &&
            streamCall &&
            studentOwnParticipant && (
              <button
                type="button"
                onClick={() =>
                  setIsStudentPreviewExpanded((expanded) => !expanded)
                }
                aria-expanded={isStudentPreviewExpanded}
                aria-label={
                  isStudentPreviewExpanded
                    ? classroomLabel(
                        'إغلاق عرض الكاميرا المكبّر',
                        'Fermer la vidéo agrandie',
                        'Close enlarged camera'
                      )
                    : classroomLabel(
                        'تكبير الكاميرا',
                        'Agrandir la caméra',
                        'Enlarge camera'
                      )
                }
                title={
                  isStudentPreviewExpanded
                    ? classroomLabel(
                        'اضغط للعودة إلى الحجم الصغير',
                        'Cliquer pour réduire',
                        'Click to return to small view'
                      )
                    : classroomLabel(
                        'اضغط لتكبير الكاميرا',
                        'Cliquer pour agrandir',
                        'Click to enlarge camera'
                      )
                }
                className={
                  isStudentPreviewExpanded
                    ? 'fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 sm:p-6 cursor-zoom-out'
                    : 'absolute top-3 right-3 z-10 block w-32 sm:w-44 aspect-video overflow-hidden rounded-xl border-2 border-white shadow-xl bg-black cursor-zoom-in'
                }
              >
                <div className="relative w-full h-full overflow-hidden">
                  <StreamParticipantVideo
                    call={streamCall}
                    sessionId={studentOwnParticipant.sessionId}
                    muted={true}
                  />
                  {!isStudentPreviewExpanded && (
                    <span className="pointer-events-none absolute inset-x-1 bottom-1 rounded-md bg-black/80 px-1.5 py-1 text-center text-[8px] font-bold leading-tight text-white shadow sm:text-[9px]">
                      {classroomLabel(
                        'اضغط لتكبير الكاميرا',
                        'Cliquer pour agrandir',
                        'Click to enlarge camera'
                      )}
                    </span>
                  )}
                </div>
              </button>
            )}
        </div>
      </div>

      {/* EDUCATOR'S STUDENT THUMBNAILS */}
        {isEducator && (
          <div className="min-w-0 min-h-0 lg:flex lg:flex-col">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-slate-300">{currentLang === 'ar' ? 'الطلاب المتصلون' : currentLang === 'fr' ? 'Élèves connectés' : currentLang === 'es' ? 'Estudiantes conectados' : currentLang === 'it' ? 'Studenti connessi' : 'Connected students'}</p>
              <label className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/50 bg-indigo-950 px-3 py-2 text-[10px] font-bold text-indigo-100 cursor-pointer">
                <input type="checkbox" checked={chatAllStudents} onChange={(event) => { setChatAllStudents(event.target.checked); if (event.target.checked) setSelectedParticipantId(null); }} className="h-4 w-4 accent-indigo-400"/>
                {currentLang === 'ar' ? 'إرسال إلى جميع الطلاب' : currentLang === 'fr' ? 'Envoyer à tous les élèves' : currentLang === 'es' ? 'Enviar a todos los estudiantes' : currentLang === 'it' ? 'Invia a tutti gli studenti' : 'Chat with all students'}
              </label>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 lg:flex-1 lg:min-h-0 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pr-1">
                            {callParticipants
                .filter(
                  (participant) =>
                    participant.userId !== registeredAccount?.id &&
                    !participant.roles?.some(
                      (role: string) => role === 'admin' || role === 'host'
                    )
                )
                .map((participant) => {
                  const studentId = participant.userId;
                  const handRaised = raisedHandIds.includes(studentId);
                  const selected = chatAllStudents || selectedParticipantId === studentId || (!selectedParticipantId && !chatAllStudents && selectedParticipant?.userId === studentId);

                  return (
                    <div
                      key={participant.sessionId || studentId}
                      className={`w-64 lg:w-full shrink-0 rounded-xl border p-2 ${
                        selected
                          ? 'border-indigo-400 bg-indigo-950'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => { setChatAllStudents(false); setSelectedParticipantId(studentId); }}
                        className="w-full text-left cursor-pointer"
                      >
                        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                        {streamCall && (
                          <StreamParticipantVideo
                            call={streamCall}
                            sessionId={participant.sessionId}
                            muted={true}
                          />
                        )}
                      </div>

                        <p className="text-xs font-bold text-white truncate mt-2">
                          {participant.name || studentId}
                        </p>
                      </button>

                                            {/* Student raised-hand status */}
                      <div className="mt-2 flex flex-col gap-2">

                        <span
                          className={`text-[10px] font-bold ${
                            handRaised
                              ? 'text-amber-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {handRaised
                            ? (
                                currentLang === 'ar'
                                  ? '✋ الطالب يطلب الكلام'
                                  : currentLang === 'fr' ? '✋ L’élève demande la parole' : currentLang === 'es' ? '✋ El estudiante pide la palabra' : currentLang === 'it' ? '✋ Lo studente chiede la parola' : '✋ Student requests to speak'
                              )
                            : (
                                currentLang === 'ar'
                                  ? 'لم يرفع يده'
                                  : currentLang === 'fr' ? 'Aucune main levée' : currentLang === 'es' ? 'No ha levantado la mano' : currentLang === 'it' ? 'Nessuna mano alzata' : 'No raised hand'
                              )}
                        </span>

                        {/* Educator clears this student's raised hand */}
                        {handRaised && (
                          <button
                            type="button"
                            onClick={() => void clearStudentHand(studentId)}
                            className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black py-2 cursor-pointer"
                          >
                            {currentLang === 'ar'
                              ? 'مسح طلب رفع اليد'
                              : currentLang === 'fr' ? 'Effacer la demande de parole' : currentLang === 'es' ? 'Borrar solicitud de palabra' : currentLang === 'it' ? 'Cancella richiesta di parola' : 'Clear Raised Hand'}
                          </button>
                        )}

                      </div>

                      {/* Educator microphone permission controls */}
                      <div className="mt-2">

                                                <button
                          type="button"
                          onClick={() => void allowStudentToSpeak(studentId)}
                          className={`w-full rounded-lg text-white text-[11px] font-bold py-2 cursor-pointer transition ${
                            allowedStudentIds.includes(studentId)
                              ? 'bg-emerald-500 ring-2 ring-emerald-300'
                              : 'bg-slate-600 hover:bg-emerald-600'
                          }`}
                        >
                          {allowedStudentIds.includes(studentId)
                            ? (
                                currentLang === 'ar'
                                  ? '✓ مسموح له بالكلام'
                                  : currentLang === 'fr' ? '✓ Autorisé à parler' : currentLang === 'es' ? '✓ Puede hablar' : currentLang === 'it' ? '✓ Può parlare' : '✓ Speaking Allowed'
                              )
                            : (
                                currentLang === 'ar'
                                  ? 'السماح بالكلام'
                                  : currentLang === 'fr' ? 'Autoriser à parler' : currentLang === 'es' ? 'Permitir hablar' : currentLang === 'it' ? 'Consenti di parlare' : 'Allow to speak'
                              )}
                        </button>

                        <button
                          type="button"
                          onClick={() => void stopStudentSpeaking(studentId)}
                          className="w-full rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-[11px] font-bold py-2 mt-1 cursor-pointer"
                        >
                          {currentLang === 'ar'
                            ? 'إيقاف الكلام'
                            : currentLang === 'fr' ? 'Retirer l’autorisation de parler' : currentLang === 'es' ? 'Dejar de hablar' : currentLang === 'it' ? 'Interrompi la possibilità di parlare' : 'Stop speaking'}
                        </button>

                      </div>
                    </div>
                                    );
                 })}
            </div>
          </div>
        )}

      </>
    )}

      {/* PRIVATE CHAT */}
      <aside className="w-full lg:w-80 shrink-0 min-h-[360px] lg:min-h-0 bg-slate-900 border border-slate-700 rounded-2xl flex flex-col overflow-hidden">

                <div className="px-3 py-3 border-b border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-black text-white">
              {classroomLabel(
                'محادثة خاصة',
                'Chat privé',
                'Private Chat'
              )}
            </h4>

            <button
              type="button"
              onClick={() => void handleClearChatMessages()}
              disabled={
                !chatStudentIds.length ||
                chatLoading ||
                chatClearing
              }
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white text-[10px] font-bold transition cursor-pointer disabled:cursor-not-allowed"
              title={classroomLabel(
                'حذف جميع الرسائل للطرفين',
                'Effacer tous les messages pour les deux participants',
                'Clear all messages for both participants'
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />

              {classroomLabel(
                'مسح المحادثة',
                'Effacer',
                'Clear chat'
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-1">
            {isEducator
              ? (chatAllStudents
                  ? classroomLabel('جميع الطلاب المتصلين', 'Tous les élèves connectés', 'All connected students')
                  : (selectedParticipant && selectedParticipant.userId !== registeredAccount?.id
                    ? (selectedParticipant.name || selectedParticipant.userId)
                    : classroomLabel('اختر طالباً لبدء المحادثة', 'Choisissez un élève pour démarrer la conversation', 'Select a student to start chatting')))
              : classroomLabel(
                  'محادثتك الخاصة مع الأستاذ',
                  'Votre conversation privée avec le professeur',
                  'Your private conversation with the educator'
                )}
          </p>
        </div>
         <div className="flex-1 min-h-[120px] overflow-y-auto p-3 space-y-2">
          {!chatStudentId ? (
                        <p className="text-xs text-slate-400 text-center mt-6">
              {isGuestMode
                ? (
                    classroomLabel(
                      'المحادثة الخاصة متاحة بعد تسجيل الدخول واختيار أستاذ.',
                      'La conversation privée nécessite une connexion et un éducateur.',
                      'Private chat requires sign-in and an assigned educator.'
                    )
                  )
                : (
                    classroomLabel(
                      'اختر طالباً من الصور لفتح المحادثة.',
                      'Sélectionnez la vignette d’un élève pour ouvrir la conversation.',
                      'Select a student thumbnail to open the conversation.'
                    )
                  )}
            </p>
          ) : chatMessages.length === 0 ? (
            <p className="text-xs text-slate-400 text-center mt-6">
              {classroomLabel('لا توجد رسائل بعد.', 'Aucun message pour le moment.', 'No messages yet.')}
            </p>
          ) : (
                        chatMessages.map((message) => {
              const ownMessage = message.senderId === registeredAccount?.id;
              const recipientId = message.studentId || chatStudentId;
              const recipientName = connectedStudentParticipants.find((participant) => participant.userId === recipientId)?.name || recipientId;
              const senderName = ownMessage
                ? (currentLang === 'ar' ? 'أنت' : currentLang === 'fr' ? 'Vous' : currentLang === 'es' ? 'Tú' : currentLang === 'it' ? 'Tu' : 'You')
                : (isEducator ? (connectedStudentParticipants.find((participant) => participant.userId === message.senderId)?.name || message.senderId) : (activeCallSession?.educatorName || educatorName));
              const attribution = isEducator
                ? (ownMessage ? `${senderName} → ${chatAllStudents ? classroomLabel('جميع الطلاب', 'Tous les élèves', 'All students') : recipientName}` : `${senderName} → ${educatorName}`)
                : ownMessage
                    ? `${senderName} → ${activeCallSession?.educatorName || educatorName}`
                    : `${senderName} → ${registeredAccount?.fullName || classroomLabel('أنت', 'Vous', 'You')}`;

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    ownMessage ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[95%] min-w-0 rounded-xl px-3 py-2 text-xs ${
                      ownMessage
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-slate-100'
                    }`}
                  >
                    <p className={`mb-1 text-[10px] font-black ${ownMessage ? 'text-indigo-100' : 'text-amber-200'}`}>{attribution}</p>
                    {message.message !== '[Attachment]' && (
                      <p className="whitespace-pre-wrap break-words">
                        {message.message}
                      </p>
                    )}

                    {message.attachmentUrl &&
                      message.attachmentType?.startsWith('image/') && (
                        <a
                          href={message.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={message.attachmentUrl}
                            alt={message.attachmentName || 'Exercise image'}
                            className="mt-2 max-h-64 w-full rounded-lg object-contain bg-black"
                          />
                        </a>
                      )}

                    {message.attachmentUrl &&
                      message.attachmentType?.startsWith('video/') && (
                        <video
                          src={message.attachmentUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="mt-2 w-full max-h-64 rounded-lg bg-black"
                        />
                      )}

                    {message.attachmentUrl &&
                      message.attachmentType === 'application/pdf' && (
                        <a
                          href={message.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-2 rounded-lg bg-slate-950/40 p-3 text-white underline break-all"
                        >
                          <FileText className="w-5 h-5 shrink-0" />
                          {message.attachmentName || 'PDF'}
                        </a>
                      )}

                    <p className="text-[9px] opacity-60 mt-1">
                      {message.createdAt}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {chatError && (
          <p className="px-3 pb-2 text-[11px] text-rose-300" role="alert">
            {chatError}
          </p>
        )}

                <div className="p-3 border-t border-slate-700">           <input             ref={chatAttachmentInputRef}             type="file"             accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/pdf"             className="hidden"             onChange={(event) => {               const file = event.currentTarget.files?.[0] || null;                event.currentTarget.value = '';                if (!file) return;                if (file.size > 25 * 1024 * 1024) {                 setChatError(                   classroomLabel(                     'الحد الأقصى لحجم الملف هو 25 ميغابايت.',                     'La taille maximale du fichier est de 25 Mo.',                     'The maximum file size is 25 MB.'                   )                 );                 return;               }                setChatError(null);               setChatAttachmentFile(file);             }}           />            {chatAttachmentFile && (             <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-slate-800 border border-slate-600 p-2">               <span className="min-w-0 truncate text-[11px] text-slate-200">                 {chatAttachmentFile.name}               </span>                <button                 type="button"                 onClick={() => setChatAttachmentFile(null)}                 className="shrink-0 rounded-lg p-1 text-slate-300 hover:bg-slate-700"                 title={classroomLabel(                   'إزالة المرفق',                   'Retirer le fichier',                   'Remove attachment'                 )}               >                 <X className="w-4 h-4" />               </button>             </div>           )}            <textarea             value={chatDraft}             onChange={(event) => setChatDraft(event.target.value)}             maxLength={2000}             rows={2}             disabled={!chatStudentIds.length || chatLoading || chatClearing}             placeholder={classroomLabel(               'اكتب رسالة خاصة...',               'Écrire un message privé...',               'Write a private message...'             )}             className="w-full resize-none rounded-lg bg-slate-800 border border-slate-600 text-white text-xs p-2 outline-none focus:border-indigo-400 disabled:opacity-50"           />            <div className="mt-2 flex gap-2">             <button               type="button"               onClick={() => chatAttachmentInputRef.current?.click()}               disabled={                 !chatStudentIds.length ||                 chatLoading ||                 chatClearing               }               className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs font-bold py-2 cursor-pointer disabled:cursor-not-allowed"             >               <Paperclip className="w-4 h-4" />                {classroomLabel(                 'إرفاق',                 'Joindre',                 'Attach'               )}             </button>              <button               type="button"               onClick={() => void handleSendChatMessage()}               disabled={                 !chatStudentIds.length ||                 (!chatDraft.trim() && !chatAttachmentFile) ||                 chatLoading ||                 chatClearing               }               className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold py-2 cursor-pointer disabled:cursor-not-allowed"             >               {chatLoading                 ? classroomLabel(                     'جارٍ الإرسال...',                     'Envoi...',                     'Sending...'                   )                 : classroomLabel(                     'إرسال',                     'Envoyer',                     'Send'                   )}             </button>           </div>         </div>
            </aside>
    </div>
</div>

          {/* CLASSROOM CONTROLS AND PARTICIPANT COUNT */}
          <div className="w-full bg-slate-800 p-4 border-t border-slate-700">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-300">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>
                  {classroomLabel('المشاركون المتصلون فعلياً:', 'Participants actuellement connectés :', 'Actual connected participants:')}
                </span>

                <span className="text-emerald-400">
                  {callParticipants.length}
                </span>
              </div>

                            {/* Live classroom controls */}
              {(isEducator || isStudent || isGuestMode) && (
               <div className="flex flex-wrap items-center gap-2">

                  {/* Student Raise Hand / Lower Hand */}
                  {isStudent && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          registeredAccount &&
                          raisedHandIds.includes(registeredAccount.id)
                        ) {
                          void handleLowerHand();
                        } else {
                          void handleRaiseHand();
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        registeredAccount &&
                        raisedHandIds.includes(registeredAccount.id)
                          ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                          : 'bg-amber-600 text-white hover:bg-amber-500'
                      }`}
                    >
                      <span className="text-base">✋</span>

                      {registeredAccount &&
                      raisedHandIds.includes(registeredAccount.id)
                        ? (
                            currentLang === 'ar'
                              ? 'خفض اليد'
                              : currentLang === 'fr' ? 'Baisser la main' : currentLang === 'es' ? 'Bajar la mano' : currentLang === 'it' ? 'Abbassa la mano' : 'Lower Hand'
                          )
                        : (
                            currentLang === 'ar'
                              ? 'رفع اليد'
                              : currentLang === 'fr' ? 'Lever la main' : currentLang === 'es' ? 'Levantar la mano' : currentLang === 'it' ? 'Alza la mano' : 'Raise Hand'
                          )}
                    </button>
                  )}
                  {isStudent && (
                    <span
                      className={`text-[10px] font-bold ${
                        canSpeak
                          ? 'text-emerald-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {canSpeak
                        ? (
                            isMicOn
                              ? (
                                  currentLang === 'ar'
                                    ? 'الميكروفون يعمل'
                                    : currentLang === 'fr' ? 'Microphone activé' : currentLang === 'es' ? 'Micrófono encendido' : currentLang === 'it' ? 'Microfono attivo' : 'Microphone on'
                                )
                              : (
                                  currentLang === 'ar'
                                    ? 'مسموح لك بالكلام — اضغط الميكروفون'
                                    : currentLang === 'fr' ? 'Vous pouvez parler — appuyez sur le micro' : currentLang === 'es' ? 'Puedes hablar — pulsa el micrófono' : currentLang === 'it' ? 'Puoi parlare — tocca il microfono' : 'Allowed — tap the microphone to speak'
                                )
                          )
                        : (
                            currentLang === 'ar'
                              ? 'بانتظار إذن الأستاذ'
                              : currentLang === 'fr' ? 'En attente de l’autorisation de l’éducateur' : currentLang === 'es' ? 'Esperando el permiso del educador' : currentLang === 'it' ? 'In attesa del permesso dell’educatore' : 'Waiting for educator permission'
                          )}
                    </span>
                  )}
                   {(isStudent || isGuestMode) && (
                    <>
                      <button
                        type="button"
                        onClick={() => void startStudentSelfCam()}
                        aria-pressed={studentCameraDirection === 'front'}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-white text-xs font-bold transition cursor-pointer ${
                          studentCameraDirection === 'front'
                            ? 'bg-emerald-600 hover:bg-emerald-500 ring-2 ring-emerald-300'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        {classroomLabel(
                          'كاميرتي الأمامية',
                          'Caméra avant',
                          'Self Cam'
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => void flipStudentCamera()}
                        aria-pressed={studentCameraDirection === 'back'}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-white text-xs font-bold transition cursor-pointer ${
                          studentCameraDirection === 'back'
                            ? 'bg-sky-600 hover:bg-sky-500 ring-2 ring-sky-300'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        {classroomLabel(
                          'تبديل الكاميرا',
                          'Retourner la caméra',
                          'Flip Camera'
                        )}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => void toggleVideoTrack()}
                    className={`p-2.5 rounded-xl transition cursor-pointer ${
                      isVideoOn
                        ? 'bg-slate-700 text-slate-200'
                        : 'bg-rose-600 text-white'
                    }`}
                    title={
                      isVideoOn
                        ? classroomLabel(
                            'إيقاف الكاميرا',
                            'Désactiver la caméra',
                            'Turn Camera Off'
                          )
                        : classroomLabel(
                            'تشغيل الكاميرا',
                            'Activer la caméra',
                            'Turn Camera On'
                          )
                    }
                  >
                    {isVideoOn
                      ? <Video className="w-4 h-4" />
                      : <VideoOff className="w-4 h-4" />}
                  </button>

                                    {/* Microphone control */}
                  <button
                    type="button"
                    onClick={() => void toggleAudioTrack()}
                    disabled={isStudent && !canSpeak}
                    className={`p-2.5 rounded-xl transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                      isMicOn
                        ? 'bg-slate-700 text-slate-200'
                        : 'bg-rose-600 text-white'
                    }`}
                    title={
                      isStudent && !canSpeak
                        ? (
                            currentLang === 'ar'
                              ? 'بانتظار إذن الأستاذ'
                              : currentLang === 'fr' ? 'En attente de l’autorisation de l’éducateur' : currentLang === 'es' ? 'Esperando el permiso del educador' : currentLang === 'it' ? 'In attesa del permesso dell’educatore' : 'Waiting for educator permission'
                          )
                        : isMicOn
                          ? classroomLabel('كتم الميكروفون', 'Couper le microphone', 'Mute Microphone')
                          : classroomLabel('تشغيل الميكروفون', 'Activer le microphone', 'Unmute Microphone')
                    }
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
                <span>{currentLang === 'ar' ? 'رجوع' : currentLang === 'fr' ? 'Retour' : currentLang === 'es' ? 'Volver' : currentLang === 'it' ? 'Indietro' : 'Back'}</span>
              </button>

                 <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {registeredAccount && sessionToken
                    ? selectedGrade.name[currentLang]
                    : currentLang === 'ar'
                      ? 'اختر القسم الذي تريده'
                      : currentLang === 'fr'
                        ? 'Choisissez une section'
                        : 'Choose a section'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
               <button
                type="button"
               onClick={() => setActiveTab('stored')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  activeTab === 'stored'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>
                  {currentLang === 'ar'
                    ? 'الموارد التعليمية'
                    : 'Learning resources'}
                </span>
              </button>
                <button
                type="button"
                onClick={() => setActiveTab('live')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  activeTab === 'live'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
                <Video className="w-4 h-4" />
                <span>
                  {currentLang === 'ar' ? 'الحصص المباشرة' : currentLang === 'fr' ? 'Cours en direct' : currentLang === 'es' ? 'Sesiones en directo' : currentLang === 'it' ? 'Lezioni dal vivo' : 'Live Sessions'}
                </span>
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
        {currentLang === 'ar' ? 'جارٍ فتح الصف المباشر...' : currentLang === 'fr' ? 'Ouverture de la classe en direct...' : currentLang === 'es' ? 'Abriendo el aula en directo...' : currentLang === 'it' ? 'Apertura dell’aula dal vivo...' : 'Opening live classroom...'}
      </div>
    )}
                    {/* Guest test room — shown only to visitors who are not signed in. */}
              {(!registeredAccount || !sessionToken) && (
                <button
                  type="button"
                  onClick={() => void startGuestLiveCall()}
                  disabled={isLoading}
                  className="w-full rounded-3xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm sm:text-base py-5 px-6 shadow-xl transition cursor-pointer disabled:cursor-not-allowed"
                >
                  {currentLang === 'ar' ? 'انقر للانضمام كضيف' : currentLang === 'fr' ? 'Cliquez pour rejoindre en tant qu’invité' : currentLang === 'es' ? 'Haz clic para entrar como invitado' : currentLang === 'it' ? 'Clicca per entrare come ospite' : 'Click to join as a guest'}
                </button>
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
                          : currentLang === 'fr' ? 'Veuillez vous connecter avec votre compte éducateur.'
                          : currentLang === 'es' ? 'Inicia sesión con tu cuenta de educador.'
                          : currentLang === 'it' ? 'Accedi con il tuo account educatore.'
                          : 'Please sign in with your educator account.'
                      );
                      return;
                    }

                    // Only activated, non-expired accounts may open a class
                    if (!isPaidAndActivated) {
                      alert(
                        currentLang === 'ar'
                          ? 'حسابك غير مفعل أو انتهت صلاحيته. يرجى مراجعة الإدارة لتفعيل حسابك.'
                          : currentLang === 'fr' ? 'Votre compte éducateur n’est pas activé ou a expiré. Contactez le Directeur.'
                          : currentLang === 'es' ? 'Tu cuenta de educador no está activada o ha caducado. Contacta con el Director.'
                          : currentLang === 'it' ? 'Il tuo account educatore non è attivato o è scaduto. Contatta il Direttore.'
                          : 'Your educator account is not activated or has expired. Please contact the Director to activate your account.'
                      );
                      return;
                    }

                    // Open the educator's own class directly.
                    // Do not require the educator to appear in liveSessionsList.
                    const mySession = {
                      id: registeredAccount?.registeredSessionId || '',
                      grade: assignedClassroomDetails?.gradeId || selectedGrade.name[currentLang],
                      gradeId: assignedClassroomDetails?.gradeId || registeredAccount?.gradeId || '',
                      educatorName,
                      subject: assignedClassroomDetails?.subject || educatorSubject,
                      title: assignedClassroomDetails?.title || '',
                      isLive: true,
                    };
                    
                                        handleEducatorOpenRoom(mySession);
                  }}
                  disabled={isLoading}
                  className="w-full text-start bg-slate-900 hover:bg-indigo-950 text-white rounded-3xl p-5 border-2 border-slate-800 hover:border-indigo-400 flex flex-wrap items-center justify-between gap-3 shadow-md transition-all cursor-pointer active:scale-[0.99]"
                  >
                  <div>
                    <div className="flex items-center gap-2">
                      <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                      <h3 className="font-black text-base">
                        {currentLang === 'ar' ? 'بدء الحصة المباشرة' : currentLang === 'fr' ? 'Démarrer le cours en direct' : currentLang === 'es' ? 'Iniciar sesión en directo' : currentLang === 'it' ? 'Avvia lezione dal vivo' : 'Start Live Session'}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-300 mt-2">
                      {currentLang === 'ar'
                        ? `اضغط هنا لفتح صفك المباشر وبدء البث في مادة (${educatorSubject})`
                        : currentLang === 'fr'
                          ? `Cliquez pour ouvrir votre classe et démarrer la diffusion de ${educatorSubject}.`
                          : currentLang === 'es'
                            ? `Haz clic para abrir tu aula e iniciar la emisión de ${educatorSubject}.`
                            : currentLang === 'it'
                              ? `Clicca per aprire la tua aula e avviare la trasmissione di ${educatorSubject}.`
                              : `Click here to open your live classroom and start broadcasting ${educatorSubject}.`}
                    </p>
                  </div>

                  <span className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-5 py-3 rounded-xl shadow-md">
                    <Video className="w-4 h-4" />
                    {currentLang === 'ar' ? 'افتح الحصة الآن' : currentLang === 'fr' ? 'OUVRIR LE COURS' : currentLang === 'es' ? 'ABRIR CLASE' : currentLang === 'it' ? 'APRI LEZIONE' : 'OPEN LIVE CLASS'}
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
                    {currentLang === 'ar' ? 'لا يوجد معلمون مسجلون في هذه المدرسة بعد.' : currentLang === 'fr' ? 'Aucun éducateur n’est encore inscrit dans cet établissement.' : currentLang === 'es' ? 'Todavía no hay educadores registrados en esta escuela.' : currentLang === 'it' ? 'Non ci sono ancora educatori registrati in questa scuola.' : 'No educators are registered at this school yet.'}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2">
                    {currentLang === 'ar' ? 'تُحدّث قائمة المدرسة وحالة الاتصال تلقائياً.' : currentLang === 'fr' ? 'La liste de l’établissement et le statut de connexion s’actualisent automatiquement.' : currentLang === 'es' ? 'El directorio de la escuela y el estado de conexión se actualizan automáticamente.' : currentLang === 'it' ? 'L’elenco della scuola e lo stato di connessione si aggiornano automaticamente.' : 'The school directory and connection status refresh automatically.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleLiveSessions.map((session) => {
                    const isMyAssignedRoom =
                      isStudentSessionMatch(session) && session.isLive;

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

                            <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md border ${session.isLive ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${session.isLive ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`} />
                              {session.isLive
                                ? (currentLang === 'ar' ? 'مباشر' : currentLang === 'fr' ? 'EN DIRECT' : currentLang === 'es' ? 'EN DIRECTO' : currentLang === 'it' ? 'IN DIRETTA' : 'LIVE')
                                : (currentLang === 'ar' ? 'غير متصل' : currentLang === 'fr' ? 'HORS LIGNE' : currentLang === 'es' ? 'DESCONECTADO' : currentLang === 'it' ? 'NON IN LINEA' : 'OFFLINE')}
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
                                  ? 'أستاذك المسجّل يبث الآن'
                                  : currentLang === 'fr'
                                    ? 'Votre éducateur inscrit est en direct'
                                    : currentLang === 'es'
                                      ? 'Tu educador asignado está en directo'
                                      : currentLang === 'it'
                                        ? 'Il tuo educatore assegnato è in diretta'
                                        : 'Your assigned educator is live'}
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
                                {currentLang === 'ar' ? 'انضم إلى الحصة المباشرة' : currentLang === 'fr' ? 'Rejoindre le cours en direct' : currentLang === 'es' ? 'Unirse a la sesión en directo' : currentLang === 'it' ? 'Partecipa alla lezione dal vivo' : 'Join Live Session'}
                              </span>
                            </button>
                          ) : (
                            <div className="w-full py-2.5 text-center text-xs font-bold text-slate-400 bg-slate-100 rounded-xl">
                              {isStudent && Boolean(assignedSessionId) && Boolean(session.sessionId) && String(session.sessionId) === String(assignedSessionId) && !session.isLive
                                ? (currentLang === 'ar' ? 'الأستاذ المسجّل غير متصل حالياً' : currentLang === 'fr' ? 'Votre éducateur inscrit est actuellement hors ligne' : currentLang === 'es' ? 'Tu educador asignado está desconectado' : currentLang === 'it' ? 'Il tuo educatore assegnato è offline' : 'Your assigned educator is currently offline')
                                : (currentLang === 'ar' ? 'غير مسجل في هذه الحصة' : currentLang === 'fr' ? 'Non inscrit à ce cours' : currentLang === 'es' ? 'No estás asignado a esta sesión' : currentLang === 'it' ? 'Non sei assegnato a questa lezione' : 'Not assigned to this session')}
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
            <LearningResourcesView
              currentLang={currentLang}
              schoolId={schoolId}
              registeredAccount={registeredAccount}
              sessionToken={sessionToken}
            />
          )}
        </>
      )}
    </div>
  );
};
