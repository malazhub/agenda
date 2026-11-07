import React, { useState, useRef, useEffect } from 'react';
import { Language, OfficialExam, ExamQuestion, Teacher, ExerciseSubmission } from '../types';
import { translations } from '../translations';
import { solveStudentExercise, AISolutionResult } from '../services/aiSolverService';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Clock, 
  PenTool, 
  Eraser, 
  RotateCcw, 
  Download, 
  MessageSquare, 
  SplitSquareVertical, 
  Award, 
  CheckCircle2, 
  Sparkles,
  Send,
  BookOpen,
  Camera,
  Upload,
  Users,
  Lock,
  Unlock,
  AlertCircle,
  FileCheck,
  Maximize2
} from 'lucide-react';

interface VirtualClassroomProps {
  currentLang: Language;
  teacher?: Teacher;
  activeExam?: OfficialExam;
  activeQuestion?: ExamQuestion;
  onLeaveClassroom: () => void;
  currentUserRole?: 'student' | 'educator' | 'teacher';
  currentUserName?: string;
}

interface OnlineStudent {
  id: string;
  name: string;
  avatar: string;
  isRaisingHand?: boolean;
}

export const VirtualClassroom: React.FC<VirtualClassroomProps> = ({
  currentLang,
  teacher,
  activeExam,
  activeQuestion,
  onLeaveClassroom,
  currentUserRole = 'student',
  currentUserName = ''
}) => {
  const t = translations[currentLang];
  const isEducator = currentUserRole === 'educator' || currentUserRole === 'teacher';

  // Synchronized 45-minute countdown timer (2700 seconds)

  // Fullscreen & Active Session controls
  const mainClassroomRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teacher?.id || 't_malaz');

  // Enrolled student attendance roster (Live vs Absent)
  const [studentsAttendance, setStudentsAttendance] = useState([
    { id: 'st_1', name: 'Bilal Ahmad', isLive: true },
    { id: 'st_2', name: 'كريم منصور (You)', isLive: true },
    { id: 'st_3', name: 'نور حداد', isLive: false },
    { id: 'st_4', name: 'Marc Abou-Jaoudé', isLive: true },
    { id: 'st_5', name: 'Céline Khater', isLive: false }
  ]);

  // Student's registered educator and grade from registration
  const myRegisteredEducatorId = localStorage.getItem('registered_educator_id') || 'edu_1';
  const myRegisteredEducatorName = localStorage.getItem('registered_educator_name') || 'Prof. Malaz';
  const myRegisteredGrade = localStorage.getItem('registered_grade') || 'Grade 12 LH';
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // All live classrooms by Grade and Educator
  const allLiveClassrooms = [
    { id: 'sess_1', educatorId: 'edu_1', educatorName: 'Prof. Malaz', grade: 'Grade 12 LH', subject: 'Mathematics', isLiveNow: true },
    { id: 'sess_2', educatorId: 'edu_2', educatorName: 'Prof. Jad Khoury', grade: 'Grade 12 LH', subject: 'Mathematics', isLiveNow: true },
    { id: 'sess_3', educatorId: 'edu_3', educatorName: 'Prof. Samer Daher', grade: 'Grade 12 LH', subject: 'Physics', isLiveNow: true },
    { id: 'sess_4', educatorId: 'edu_4', educatorName: 'Prof. Rima Kassir', grade: 'Grade 12 LH', subject: 'Philosophy', isLiveNow: true },
    { id: 'sess_5', educatorId: 'edu_5', educatorName: 'Prof. Hadi Zein', grade: 'Grade 12 LH', subject: 'Arabic Literature', isLiveNow: true },
    { id: 'sess_6', educatorId: 'edu_6', educatorName: 'Prof. Samer Daher', grade: 'Grade 12 GS', subject: 'Advanced Physics', isLiveNow: true },
    { id: 'sess_7', educatorId: 'edu_7', educatorName: 'Prof. Jad Khoury', grade: 'Grade 12 GS', subject: 'Pure Mathematics', isLiveNow: true },
    { id: 'sess_8', educatorId: 'edu_8', educatorName: 'Mme. Céline', grade: 'Grade 12 LS', subject: 'Biology & Genetics', isLiveNow: true },
    { id: 'sess_9', educatorId: 'edu_9', educatorName: 'Prof. Malaz', grade: 'Grade 11', subject: 'Mathematics Core', isLiveNow: true },
  ];

  const handleJoinClassroom = (classroom: typeof allLiveClassrooms[0]) => {
    // If the user is an educator / teacher, allow entering their classroom
    if (teacher) {
      setIsSessionStarted(true);
      setIsTimerRunning(true);
      return;
    }

    // If student: check if this is their registered educator
    if (classroom.educatorId === myRegisteredEducatorId || classroom.educatorName === myRegisteredEducatorName) {
      setAccessDeniedMessage(null);
      setIsSessionStarted(true);
      setIsTimerRunning(true);
    } else {
      // Fire error: block entry and tell them to go to their registered room
      const msg = currentLang === 'ar'
        ? `توجه إلى صفك الدراسي! أنت مسجل مع الأستاذ (${myRegisteredEducatorName}) في (${myRegisteredGrade}). لا يمكنك دخول صف (${classroom.educatorName}).`
        : `Go to your classroom! You are registered with ${myRegisteredEducatorName} for ${myRegisteredGrade}. You cannot join ${classroom.educatorName}'s room.`;
      setAccessDeniedMessage(msg);
      alert(msg);
    }
  };

  const toggleFullScreen = () => {
    if (!mainClassroomRef.current) return;
    if (!document.fullscreenElement) {
      mainClassroomRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Synchronized 45-minute countdown timer (2700 seconds)
  const initialDuration = 45 * 60;
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // AV controls & real video streams
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localMediaStreamRef = useRef<MediaStream | null>(null);

  // Whiteboard drawing tools
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState('#0f172a');
  const [brushSize, setBrushSize] = useState(3);

  // Split view toggle (Left: Exam reference, Right: Canvas)
  const [showSplitExam, setShowSplitExam] = useState(true);

  // Breakout 1-on-1 separate session state
  const [onlineStudents, setOnlineStudents] = useState<OnlineStudent[]>([
    { id: 's_1', name: 'كريم منصور (You)', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80' },
    { id: 's_2', name: 'نور حداد', avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80' },
    { id: 's_3', name: 'Marc Abou-Jaoudé', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&auto=format&fit=crop&q=80' },
    { id: 's_4', name: 'Céline Khater', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80' }
  ]);
  const [breakoutStudent, setBreakoutStudent] = useState<OnlineStudent | null>(null);

  // Camera exercise capture & AI solution state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraSnapshot, setCameraSnapshot] = useState<string | null>(null);
  const [exerciseNotesInput, setExerciseNotesInput] = useState('');
  const [isSubmittingExercise, setIsSubmittingExercise] = useState(false);
  const [incomingSubmissions, setIncomingSubmissions] = useState<ExerciseSubmission[]>([
    {
      id: 'sub_init_1',
      studentName: 'كريم منصور (You)',
      studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      submittedAt: '4:08 PM',
      imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
      exerciseNote: 'سؤال 1.ب: كيف نثبت أن المثلث OAB متساوي الأضلاع باستخدام العقدية؟',
      aiSolution: {
        transcription: 'Exercice: Montrer que le triangle OAB est équilatéral sachant que zA = 1 + i√3 et zB = 2.',
        stepByStepSolution: [
          'Calcul du module |zA| = √(1 + 3) = 2, donc OA = 2.',
          'OB = |zB| = |2| = 2.',
          'Calcul de AB = |zB - zA| = |2 - 1 - i√3| = |1 - i√3| = √(1 + 3) = 2.',
          'Puisque OA = OB = AB = 2, le triangle OAB est équilatéral.'
        ],
        baremeBreakdown: [
          { criteria: 'Calcul exact des longueurs OA et OB', points: 1.0 },
          { criteria: 'Calcul de la distance AB avec module de zB - zA', points: 1.5 },
          { criteria: 'Conclusion rigoureuse triangle équilatéral', points: 0.5 }
        ],
        officialTips: 'تنبيه MEHE: تأكد من حساب AB بدلالة الأعداد العقدية |zB - zA| لنيل كامل علامة المعيار.'
      }
    }
  ]);
  const [selectedSubmissionForReview, setSelectedSubmissionForReview] = useState<ExerciseSubmission | null>(null);

  // Camera feed in capture modal
  const captureVideoRef = useRef<HTMLVideoElement>(null);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);

  // Chat messages
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: teacher ? teacher.name : 'Prof. Jad Khoury',
      text: 'مرحباً بالجميع! بدأت جلستنا المباشرة (4:00 PM – 8:00 PM). يمكنكم تصوير أي تمرين بالكاميرا وإرساله وسيقوم الذكاء الاصطناعي مع الأستاذ بحله فوراً.',
      time: '04:02'
    }
  ]);
  const [inputChat, setInputChat] = useState('');

  // Synchronized countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Request actual camera video stream for student
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((s) => {
          stream = s;
          localMediaStreamRef.current = s;
          setHasCameraAccess(true);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          // Camera permission denied or not found; gracefully use simulated HD video
          setHasCameraAccess(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update video track mute when isVideoOn toggled
  useEffect(() => {
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = isVideoOn;
      });
    }
  }, [isVideoOn]);

  // Update audio track mute when isMicOn toggled
  useEffect(() => {
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMicOn;
      });
    }
  }, [isMicOn]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerProgressPercentage = Math.round(((initialDuration - timeLeft) / initialDuration) * 100);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Agenda Live Video Session — Interactive Board (لوح الشرح المباشر)', 24, 34);

    ctx.fillStyle = '#475569';
    ctx.font = '13px monospace';
    ctx.fillText('zA = 2·e^(iπ/3)  •  OA = OB = AB = 2  ==>  Triangle OAB Équilatéral', 24, 68);
    ctx.fillText('Locus: Cercle de diamètre [AB] privé de A et B', 24, 92);

    // Sketch coordinate axis
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(350, 120);
    ctx.lineTo(350, 260);
    ctx.moveTo(220, 190);
    ctx.lineTo(480, 190);
    ctx.stroke();

    // Circle sketch
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(350, 190, 55, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(405, 190, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText('B(2)', 412, 185);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 22;
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = color + '40';
      ctx.lineWidth = 16;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const insertFormula = (formula: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.font = '15px monospace';
    ctx.fillText(formula, 40, 160 + Math.random() * 80);
  };

  const downloadCanvasNotes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Agenda-Live-Notes-${Date.now()}.png`;
    a.click();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setChatMessages(prev => [
      ...prev,
      { sender: 'You (Student)', text: inputChat, time: timeStr }
    ]);
    setInputChat('');
  };

  // Start webcam for exercise snapshot
  const startCameraCapture = async () => {
    setIsCameraModalOpen(true);
    setCameraSnapshot(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setIsLiveCameraActive(true);
        if (captureVideoRef.current) {
          captureVideoRef.current.srcObject = stream;
        }
      }
    } catch {
      setIsLiveCameraActive(false);
    }
  };

  // Capture snapshot from webcam
  const takeSnapshot = () => {
    if (captureVideoRef.current) {
      const video = captureVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCameraSnapshot(dataUrl);
      }
    }
  };

  // Handle file input for exercise photo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCameraSnapshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit exercise to educator + trigger AI solution
  const handleSubmitExerciseToEducator = async () => {
    if (!cameraSnapshot && !exerciseNotesInput.trim()) return;

    setIsSubmittingExercise(true);
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Run AI solver
    const aiResult = await solveStudentExercise(
      cameraSnapshot || undefined,
      exerciseNotesInput,
      teacher?.subjects?.[0] || 'math'
    );

    const newSub: ExerciseSubmission = {
      id: `sub_${Date.now()}`,
      studentName: 'كريم منصور (You)',
      studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      submittedAt: timeStr,
      imageUrl: cameraSnapshot || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
      exerciseNote: exerciseNotesInput,
      aiSolution: aiResult
    };

    setIncomingSubmissions(prev => [newSub, ...prev]);
    setSelectedSubmissionForReview(newSub);
    setIsSubmittingExercise(false);
    setIsCameraModalOpen(false);
    setCameraSnapshot(null);
    setExerciseNotesInput('');

    // Add notification into chat
    setChatMessages(prev => [
      ...prev,
      {
        sender: 'System (AI Solver)',
        text: `📸 استلم الأستاذ تمرين الطالب وتم استخراج الحل وسلّم التصحيح (Barème) بنجاح!`,
        time: timeStr
      }
    ]);
  };

  // Insert AI solution onto whiteboard for educator explanation
  const insertAISolutionToBoard = (solution: AISolutionResult) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('--- حل الذكاء الاصطناعي مع سلّم التصحيح (Barème MEHE) ---', 30, 220);

    ctx.fillStyle = '#1e293b';
    ctx.font = '12px sans-serif';
    solution.stepByStepSolution.slice(0, 3).forEach((step, idx) => {
      ctx.fillText(step.substring(0, 75) + '...', 30, 245 + idx * 22);
    });
  };

  return (
    <div className="space-y-4" ref={mainClassroomRef}>
      {/* Grade Sessions Lobby: Shown ONLY after entering Live Broadcast Room */}
      {!isSessionStarted ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-start">
          {/* Back to Main Screen Arrow */}
          <button
            type="button"
            onClick={onLeaveClassroom}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            <span>←</span>
            <span>{currentLang === 'ar' ? 'العودة للشاشة الرئيسية' : 'Back to Main Screen'}</span>
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {currentLang === 'ar' ? 'حصص البث المباشر — Grade 12 LH' : 'Live Sessions Catalog — Grade 12 LH'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {teacher 
                  ? (currentLang === 'ar' ? 'لوحة الأستاذ: تفقد حضور الطلاب واضغط فتح الحصة المباشرة' : 'Teacher Panel: Check student attendance and start live video session')
                  : (currentLang === 'ar' ? 'يحق للطالب الانضمام فقط لصف الأستاذ المسجل معه' : 'Students can only join the session of their selected registered educator')}
              </p>
            </div>

            {/* Teacher Roster: Live vs Absent */}
            {teacher && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                <span className="block text-xs font-bold text-slate-800 mb-1">
                  {currentLang === 'ar' ? 'حالة حضور طلاب صفك الآن:' : 'Student Attendance Status:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {studentsAttendance.map(st => (
                    <span 
                      key={st.id} 
                      className={`text-[11px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                        st.isLive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      <span>{st.name}</span>
                      <span>{st.isLive ? '● Live' : 'Absent'}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Warning Banner if user clicked wrong room */}
          {accessDeniedMessage && (
            <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-bounce">
              <span>⚠️</span>
              <span>{accessDeniedMessage}</span>
            </div>
          )}

          {/* Student's Assigned Room Notice */}
          {!teacher && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-semibold text-emerald-900">
              <span>
                {currentLang === 'ar' 
                  ? `أنت مسجل مع الأستاذ: ${myRegisteredEducatorName} (${myRegisteredGrade})`
                  : `Your Assigned Classroom: ${myRegisteredEducatorName} (${myRegisteredGrade})`}
              </span>
              <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                {currentLang === 'ar' ? 'صفك المعتمد' : 'Your Enrolled Class'}
              </span>
            </div>
          )}

          {/* All Live Classrooms Listed by Grade & Educator */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allLiveClassrooms.map((room) => {
              const isMyClassroom = room.educatorId === myRegisteredEducatorId || room.educatorName === myRegisteredEducatorName;

              return (
                <div 
                  key={room.id} 
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                    isMyClassroom
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-sm ring-1 ring-emerald-300'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                        {room.grade}
                      </span>
                      <span className="text-[10px] font-black text-rose-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        LIVE
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-base">{room.educatorName}</h4>
                    <p className="text-xs text-slate-600 font-medium">{room.subject}</p>
                    
                    {isMyClassroom && (
                      <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        ✓ {currentLang === 'ar' ? 'صفك الدراسي المعتمد' : 'Your Registered Classroom'}
                      </span>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleJoinClassroom(room)}
                      className={`w-full py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                        isMyClassroom || teacher
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-800 hover:bg-slate-900 text-slate-100'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>{currentLang === 'ar' ? 'انضمام (Join)' : 'Join Classroom'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Synchronized Live Classroom View */}
      {isSessionStarted && (
        <>
          {/* 1. SYNCHRONIZED BUILT-IN SESSION TIMER (VISIBLE TO ALL STUDENTS AND EDUCATORS) */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-4 rounded-3xl shadow-xl border-2 border-indigo-500/30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Educator & Room Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={teacher?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"}
                alt="Teacher"
                className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
              />
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5" />
            </div>

            <div className="text-start">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base text-white">
                  {teacher ? teacher.name : 'Prof. Jad Khoury'}
                </span>
                <span className="text-[11px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  Live Classroom
                </span>
              </div>
              <p className="text-xs text-indigo-300 font-semibold">
                {teacher ? teacher.title : 'Official Mathematics Corrector'} • Live Video Room
              </p>
            </div>
          </div>

          {/* Center: Large Synchronized Countdown Timer (Visible to all students and educators) */}
          <div className="flex items-center gap-3 bg-black/40 px-5 py-2.5 rounded-2xl border border-white/15 shadow-inner">
            <div className="relative flex items-center justify-center">
              <Clock className={`w-6 h-6 ${timeLeft < 300 ? 'text-rose-400 animate-bounce' : 'text-emerald-400'}`} />
            </div>

            <div className="text-center">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-wider">
                  {formatTime(timeLeft)}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-indigo-200 font-bold block">
                Session Timer (Visible to All)
              </span>
            </div>

            <div className="hidden sm:block text-end pl-3 border-l border-white/10 text-xs">
              <span className="text-slate-400 block text-[10px]">Daily Window</span>
              <span className="text-amber-300 font-mono font-bold">4:00 PM – 8:00 PM</span>
            </div>
          </div>

          {/* Right: Audio/Video & Camera Exercise Buttons */}
          <div className="flex items-center gap-2">
            {/* Student Submit Exercise via Camera Button */}
            <button
              onClick={startCameraCapture}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-2xl transition shadow-lg flex items-center gap-2 cursor-pointer border border-amber-300 animate-pulse"
              title="Submit Exercise via Camera"
            >
              <Camera className="w-4 h-4 text-slate-950" />
              <span>{currentLang === 'ar' ? 'تصوير تمرين بالكاميرا' : 'Submit via Cam'}</span>
            </button>

            {/* Mic Toggle */}
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-2.5 rounded-xl transition cursor-pointer ${
                isMicOn ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-rose-600 text-white'
              }`}
              title={isMicOn ? 'Mute' : 'Unmute'}
            >
              {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            {/* Video Toggle */}
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-2.5 rounded-xl transition cursor-pointer ${
                isVideoOn ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-rose-600 text-white'
              }`}
              title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
            >
              {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullScreen}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Full Screen Click"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Full Screen'}</span>
            </button>

            {/* Split Screen Reference Toggle */}
            <button
              onClick={() => setShowSplitExam(!showSplitExam)}
              className={`p-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                showSplitExam ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
              title="Toggle Split Screen"
            >
              <SplitSquareVertical className="w-4 h-4" />
              <span className="hidden md:inline">Split Exam</span>
            </button>

            {/* Leave Room */}
            <button
              onClick={onLeaveClassroom}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-3.5 py-2.5 rounded-xl transition cursor-pointer shadow-md"
            >
              {t.endSession}
            </button>
          </div>
        </div>

        {/* Linear Progress Bar for Elapsed Time */}
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-emerald-400 via-indigo-400 to-amber-400 transition-all duration-1000"
            style={{ width: `${timerProgressPercentage}%` }}
          />
        </div>

        {/* 2. BREAKOUT ROOM BANNER (TEACHER 1-ON-1 WITH A STUDENT WHILE OTHERS STAY ONLINE) */}
        {breakoutStudent && (
          <div className="bg-amber-500/20 border-2 border-amber-400/60 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-start animate-in fade-in">
            <div className="flex items-center gap-2.5 text-amber-200">
              <Lock className="w-4 h-4 text-amber-300 shrink-0" />
              <div className="text-xs">
                <span className="font-black text-white">
                  {currentLang === 'ar' ? 'جلسة فردية منفصلة 1-on-1 نشطة الآن:' : 'Private 1-on-1 Breakout Room Active:'}
                </span>
                <span className="text-amber-200 font-semibold ml-1">
                  الأستاذ في خلوة متابعة خاصة مع الطالب [{breakoutStudent.name}].
                </span>
                <span className="text-slate-300 block text-[11px] mt-0.5">
                  باقي الطلاب متصلون أونلاين في القاعة العامة ويتابعون التمارين المستقلة.
                </span>
              </div>
            </div>

            <button
              onClick={() => setBreakoutStudent(null)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{currentLang === 'ar' ? 'إنهاء الخلوة والعودة للعامة' : 'End Breakout (Return)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. PARTICIPANTS ROSTER WITH TEACHER 1-ON-1 SEPARATE SESSION CONTROLS */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-start">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-black text-slate-800">
            {currentLang === 'ar' ? 'المشاركون في الحصة المباشرة (أونلاين):' : 'Online Participants:'}
          </span>
          <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
            {onlineStudents.length} Online
          </span>
        </div>

        {/* Student Pills with Teacher Breakout Action */}
        <div className="flex flex-wrap items-center gap-2">
          {onlineStudents.map(student => {
            const isCurrentInBreakout = breakoutStudent?.id === student.id;

            return (
              <div
                key={student.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                  isCurrentInBreakout
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs font-semibold">{student.name}</span>

                {/* Teacher Action: Launch separate 1-on-1 session for this student */}
                <button
                  onClick={() => {
                    if (isCurrentInBreakout) {
                      setBreakoutStudent(null);
                    } else {
                      setBreakoutStudent(student);
                    }
                  }}
                  className={`text-[10px] font-black px-2 py-0.5 rounded cursor-pointer transition ${
                    isCurrentInBreakout
                      ? 'bg-amber-500 text-white'
                      : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800'
                  }`}
                  title="Make separate 1-on-1 session for this student while others remain online"
                >
                  {isCurrentInBreakout ? 'In 1-on-1' : 'جلسة خاصة (1-on-1)'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN WORKSPACE: SPLIT SCREEN (EXAM & LIVE VIDEO + WHITEBOARD) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Official Exam Reference & LIVE VIDEO FEEDS */}
        {showSplitExam && (
          <div className="lg:col-span-5 space-y-4">
            {/* REAL LIVE VIDEO GRID */}
            <div className="bg-slate-900 rounded-3xl p-3 border border-slate-800 shadow-lg space-y-2">
              <div className="flex items-center justify-between px-1 text-white text-xs">
                <span className="font-black flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Live Video Feeds (بث الفيديو المباشر)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">1080p HD</span>
              </div>

              {/* 2x Video Windows: Teacher + Student */}
              <div className="grid grid-cols-2 gap-2">
                {/* Educator Video Feed */}
                <div className="rounded-2xl overflow-hidden aspect-video bg-slate-950 relative border border-slate-700 shadow-md">
                  <img
                    src={teacher?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"}
                    alt="Teacher Feed"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{teacher ? teacher.name : 'Prof. Jad'} (Educator)</span>
                  </div>
                </div>

                {/* Student Video Feed (Live webcam with WebRTC or smart fallback) */}
                <div className="rounded-2xl overflow-hidden aspect-video bg-slate-950 relative border border-slate-700 shadow-md flex items-center justify-center">
                  {hasCameraAccess && isVideoOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                    />
                  ) : (
                    <img
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80"
                      alt="Student Feed"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>You (Student Live)</span>
                  </div>
                  {!isVideoOn && (
                    <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center text-slate-400 text-xs font-bold">
                      Camera Muted
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Official Exam Reference Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3 max-h-[500px] overflow-y-auto text-start">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Official Exam Reference</span>
                </span>
                <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                  Official Barème
                </span>
              </div>

              <div className="space-y-2">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-emerald-800 block mb-1">
                    Exercice 1 — Complex Numbers & Transformations (12 pts)
                  </span>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    Dans le plan complexe rapporté à un repère orthonormé (O; u, v), on donne A(zA = 1 + i√3) et B(zB = 2). Déterminer le module et l'argument de z', puis déduire la nature du triangle OAB.
                  </p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    MEHE Barème Criteria:
                  </span>
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <span>1.a zA = 2·e^(iπ/3) & OAB équilatéral</span>
                    <span className="font-bold text-emerald-800">+3.0 pts</span>
                  </div>
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <span>1.b Modulus |z'| = AM/BM and arg(z') = (BM, AM)</span>
                    <span className="font-bold text-emerald-800">+4.0 pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Incoming Student Submissions & AI Solutions */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3 text-start">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-500" />
                  <h5 className="text-xs font-black text-slate-900">
                    {currentLang === 'ar' ? 'تمارين مستلمة بالكاميرا + حل بالذكاء الاصطناعي' : 'Exercise Submissions (AI Solved)'}
                  </h5>
                </div>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                  {incomingSubmissions.length} Exercise
                </span>
              </div>

              <div className="space-y-2">
                {incomingSubmissions.map(sub => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-indigo-300 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={sub.studentAvatar}
                          alt={sub.studentName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-slate-800">{sub.studentName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{sub.submittedAt}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={sub.imageUrl}
                        alt="Captured Exercise"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs text-slate-700 font-medium line-clamp-2">
                          {sub.exerciseNote || sub.aiSolution?.transcription}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedSubmissionForReview(sub)}
                            className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>عرض حل الـ AI والـ Barème</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {sub.aiSolution && (
                      <button
                        onClick={() => insertAISolutionToBoard(sub.aiSolution!)}
                        className="w-full text-center text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1.5 rounded-xl border border-indigo-200 transition cursor-pointer"
                      >
                        + إدراج خطوات الحل على اللوح التفاعلي
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Shared Whiteboard & Math Tools */}
        <div className={`${showSplitExam ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
          {/* Whiteboard Toolbar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Tools */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setTool('pen')}
                className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  tool === 'pen' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Pen"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pen</span>
              </button>

              <button
                onClick={() => setTool('highlighter')}
                className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  tool === 'highlighter' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Highlighter"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Highlight</span>
              </button>

              <button
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  tool === 'eraser' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Eraser"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Eraser</span>
              </button>
            </div>

            {/* Colors */}
            <div className="flex items-center gap-1.5">
              {['#0f172a', '#2563eb', '#059669', '#dc2626', '#7c3aed'].map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                    color === c ? 'border-amber-400 scale-110 shadow-xs' : 'border-white'
                  }`}
                />
              ))}
            </div>

            {/* Clear & Save */}
            <div className="flex items-center gap-2">
              <button
                onClick={clearCanvas}
                className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                title="Clear Board"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={downloadCanvasNotes}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Notes</span>
              </button>
            </div>
          </div>

          {/* Quick Math Symbols Insertion Toolbar */}
          <div className="bg-slate-100 p-2 rounded-xl flex items-center gap-1 overflow-x-auto text-xs font-mono">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-2 shrink-0">Quick Insert:</span>
            {[
              'zA = 2·e^(iπ/3)',
              '|z\'| = AM/BM',
              'arg(z\') = π/2 [π]',
              'lim_{x→∞}',
              'e^x + 1',
              '∫ f(x) dx',
              'T0 = 2π√(m/k)',
              '√3',
              '⟂'
            ].map(sym => (
              <button
                key={sym}
                onClick={() => insertFormula(sym)}
                className="bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-800 px-2 py-1 rounded-md border border-slate-200 transition shrink-0 cursor-pointer font-bold"
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Canvas Whiteboard Element */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-inner overflow-hidden cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={820}
              height={470}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full h-[450px] touch-none block"
            />
          </div>

          {/* Chat & Notes Drawer below whiteboard */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Real-Time Classroom Chat & AI Solving Notes</span>
              </div>
              <span className="text-[11px] text-slate-400">4:00 PM – 8:00 PM Live</span>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {chatMessages.map((msg, i) => (
                <div key={i} className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-0.5 text-start">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                    <span>{msg.sender}</span>
                    <span className="text-slate-400 font-normal">{msg.time}</span>
                  </div>
                  <p className="text-slate-800 font-medium">{msg.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder={t.chatPlaceholder}
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-medium"
              />
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white p-2.5 rounded-xl transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL: SUBMIT EXERCISE VIA CAMERA / SNAPSHOT */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-start">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                <h4 className="font-black text-slate-900 text-base">
                  {currentLang === 'ar' ? 'تصوير التمرين وإرساله للأستاذ مع الحل بالذكاء الاصطناعي' : 'Capture & Submit Exercise to Educator'}
                </h4>
              </div>
              <button
                onClick={() => setIsCameraModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold bg-slate-100 px-2.5 py-1 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Video Snapshot or Preview */}
            <div className="rounded-2xl overflow-hidden aspect-video bg-slate-900 relative flex items-center justify-center border border-slate-700">
              {cameraSnapshot ? (
                <img
                  src={cameraSnapshot}
                  alt="Exercise Snapshot"
                  className="w-full h-full object-cover"
                />
              ) : isLiveCameraActive ? (
                <video
                  ref={captureVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4 space-y-2 text-slate-300">
                  <Camera className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs font-semibold">
                    {currentLang === 'ar'
                      ? 'وجّه الكاميرا نحو دفتر التمارين أو اختر صورة من جهازك'
                      : 'Point camera at your notebook or upload exercise picture'}
                  </p>
                </div>
              )}
            </div>

            {/* Capture & Upload Buttons */}
            <div className="flex items-center gap-2">
              {isLiveCameraActive && !cameraSnapshot && (
                <button
                  type="button"
                  onClick={takeSnapshot}
                  className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-2.5 rounded-xl transition cursor-pointer shadow-xs text-center"
                >
                  📸 التقاط الصورة الآن
                </button>
              )}

              <label className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5 border border-slate-200">
                <Upload className="w-3.5 h-3.5" />
                <span>{currentLang === 'ar' ? 'رفع صورة من الجهاز' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {cameraSnapshot && (
                <button
                  type="button"
                  onClick={() => setCameraSnapshot(null)}
                  className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl"
                >
                  إعادة الالتقاط
                </button>
              )}
            </div>

            {/* Notes input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {currentLang === 'ar' ? 'ملاحظة حول المسألة (اختياري):' : 'Question / Notes (optional):'}
              </label>
              <textarea
                value={exerciseNotesInput}
                onChange={(e) => setExerciseNotesInput(e.target.value)}
                placeholder={currentLang === 'ar' ? 'مثال: أين نقطة الضعف في إثبات المثلث أو التعويض؟' : 'E.g. How to prove equilateral triangle with complex numbers?'}
                rows={2}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-indigo-600"
              />
            </div>

            {/* Submit Action */}
            <button
              onClick={handleSubmitExerciseToEducator}
              disabled={isSubmittingExercise || (!cameraSnapshot && !exerciseNotesInput.trim())}
              className="w-full bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs py-3 rounded-2xl transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {isSubmittingExercise 
                  ? 'جارٍ التحليل بالذكاء الاصطناعي والإرسال للأستاذ...' 
                  : (currentLang === 'ar' ? 'إرسال للأستاذ وحل بالذكاء الاصطناعي' : 'Submit & Solve with AI')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DETAILED AI SOLUTION & BARÈME */}
      {selectedSubmissionForReview && selectedSubmissionForReview.aiSolution && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[85vh] overflow-y-auto text-start">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-wider block">
                  AI Solution Engine • Official MEHE Standards
                </span>
                <h4 className="text-base sm:text-lg font-black text-slate-900">
                  {selectedSubmissionForReview.studentName} — حل التمرين وسلّم التصحيح
                </h4>
              </div>
              <button
                onClick={() => setSelectedSubmissionForReview(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Exercise Preview & Notes */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">نص المسألة المستخرجة:</span>
              <p className="text-xs text-slate-800 font-medium">
                {selectedSubmissionForReview.aiSolution.transcription}
              </p>
            </div>

            {/* Step-by-Step AI Solution */}
            <div className="space-y-2">
              <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>خطوات الحل المعتمدة رسمياً:</span>
              </h5>
              <div className="space-y-1.5">
                {selectedSubmissionForReview.aiSolution.stepByStepSolution.map((step, i) => (
                  <div key={i} className="text-xs p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-slate-800 font-medium">
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Official Lebanese Barème breakdown */}
            <div className="space-y-2">
              <h5 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>توزيع درجات سلّم التصحيح (MEHE Barème):</span>
              </h5>
              <div className="space-y-1.5 text-xs">
                {selectedSubmissionForReview.aiSolution.baremeBreakdown.map((b, i) => (
                  <div key={i} className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <span className="text-slate-800">{b.criteria}</span>
                    <span className="font-black text-emerald-800 font-mono">+{b.points} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Official warning */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <span className="font-black text-amber-800 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                تنبيه لتفادي خسارة العلامات:
              </span>
              <p className="text-[11px] font-medium leading-relaxed">
                {selectedSubmissionForReview.aiSolution.officialTips}
              </p>
            </div>

            {/* Actions: Insert on board or close */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  insertAISolutionToBoard(selectedSubmissionForReview.aiSolution!);
                  setSelectedSubmissionForReview(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-md"
              >
                + إدراج خطوات الحل على اللوح التفاعلي الآن
              </button>
              <button
                onClick={() => setSelectedSubmissionForReview(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
