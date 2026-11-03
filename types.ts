export type Language = 'ar' | 'en' | 'fr';

export type AcademicTrack = 
  | 'BREVET' // Grade 9 / EB9
  | 'BAC_SG' // Baccalauréat Général - Sciences Générales
  | 'BAC_SV' // Baccalauréat Général - Sciences de la Vie
  | 'BAC_SE' // Baccalauréat Général - Sociologie & Économie
  | 'BAC_LH' // Baccalauréat Général - Lettres & Humanités
  | 'ELEMENTARY' // Grades 1-6
  | 'COMPLEMENTAIRE'; // Grades 7-8

export type InstructionLanguage = 'fr' | 'en' | 'bilingual' | 'ar';

export type ExamSubject = 
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'economics'
  | 'sociology'
  | 'philosophy'
  | 'arabic'
  | 'french'
  | 'english'
  | 'civics'
  | 'history'
  | 'geography';

export interface BaremeItem {
  step: string;
  points: number; // e.g. 0.5, 1.25, 2.0
  notes?: string;
}

export interface ExamQuestion {
  id: string;
  number: string; // e.g. "Question I", "Exercice 1"
  title: string;
  points: number; // total points for this exercise (e.g. 15 / 60)
  prompt: {
    en: string;
    fr: string;
    ar: string;
  };
  subQuestions?: {
    label: string; // "1.a", "1.b", etc.
    text: { en: string; fr: string; ar: string };
    points: number;
    bareme: string;
  }[];
  baremeItems: BaremeItem[];
  solution: {
    en: string;
    fr: string;
    ar: string;
    keyFormulas?: string[];
    tips?: string;
  };
}

export interface OfficialExam {
  id: string;
  year: number; // 2000 to 2026
  session: 1 | 2; // 1st Session (June) or 2nd Session (August/September)
  track: AcademicTrack;
  subject: ExamSubject;
  totalPoints: number; // e.g. 60, 20, 40
  durationMinutes: number; // e.g. 120, 180, 240
  title: {
    en: string;
    fr: string;
    ar: string;
  };
  overview: {
    en: string;
    fr: string;
    ar: string;
  };
  questions: ExamQuestion[];
  officialInstructions: {
    en: string;
    fr: string;
    ar: string;
  };
  pdfAvailable?: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  title: string;
  avatar: string;
  location: string; // e.g. Beirut, Mount Lebanon, Tripoli, Saida
  education: string; // e.g. "AUB MSc Mathematics", "USJ Faculté de Pédagogie", "LU Physics"
  schoolExperience: string; // e.g. "Grand Lycée Franco-Libanais", "International College (IC)", "Collège Notre-Dame de Jamhour"
  streams: ('Francophone' | 'Anglophone' | 'Bilingual')[];
  subjects: ExamSubject[];
  tracks: AcademicTrack[];
  yearsExperience: number;
  hourlyRate: 7; // Fixed flat $7 rate platform-wide
  sessionDuration: 45; // 45 minutes
  rating: number; // e.g. 4.95
  reviewsCount: number;
  completedSessions: number;
  officialExamPassRate: string; // "98% pass rate, 42 Mention Très Bien"
  bio: {
    en: string;
    fr: string;
    ar: string;
  };
  availableSlots: string[]; // e.g. ["Today 4:00 PM", "Today 5:30 PM", "Tomorrow 3:00 PM"]
  acceptsTrials: boolean; // all certified teachers accept the 3 free trials
  verifiedMEHE: boolean; // certified for official curriculum
}

export type HomeworkStatus = 'todo' | 'in_progress' | 'done' | 'needs_tutor';

export interface AgendaItem {
  id: string;
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. Monday
  subject: ExamSubject;
  track: AcademicTrack;
  title: string;
  details: string;
  dueDate: string;
  estimatedMinutes: number;
  status: HomeworkStatus;
  linkedOfficialExamTopic?: {
    topic: string;
    suggestedExamYear: number;
    questionNumber: string;
  };
  teacherNotes?: string;
}

export interface TutorBooking {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar: string;
  subject: ExamSubject;
  track: AcademicTrack;
  date: string;
  timeSlot: string;
  priceUSD: number;
  isFreeTrial: boolean;
  paymentMethod: 'free_trial' | 'fresh_usd' | 'whish_money' | 'omt' | 'card';
  topic: string;
  linkedExamId?: string;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  classroomLink: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: 'student' | 'teacher';
  grade: AcademicTrack;
  schoolSystem: 'Francophone' | 'Anglophone';
  schoolName: string;
  freeTrialsRemaining: number;
  completedSessions: number;
  savedExamCount: number;
  preferredLanguage: Language;
}

export type GradeLevelId = 
  | 'kg'           // الروضات / التحضيري
  | 'eb1'          // الصف الأول الابتدائي (CP)
  | 'eb2'          // الصف الثاني الابتدائي (CE1)
  | 'eb3'          // الصف الثالث الابتدائي (CE2)
  | 'eb4'          // الصف الرابع الابتدائي (CM1)
  | 'eb5'          // الصف الخامس الابتدائي (CM2)
  | 'eb6'          // الصف السادس الأساسي (6ème)
  | 'eb7'          // الصف السابع الأساسي (5ème)
  | 'eb8'          // الصف الثامن الأساسي (4ème)
  | 'brevet'       // الصف التاسع - الشهادة المتوسطة الرسمية (EB9 Brevet)
  | 'seconde'      // الأول الثانوي - Seconde (EB10)
  | 'premiere_sc'  // الثاني الثانوي - 1ère Sciences
  | 'premiere_lit' // الثاني الثانوي - 1ère Littéraire
  | 'bac_sg'       // الثالث الثانوي - الثانوية العامة علوم عامة (SG)
  | 'bac_sv'       // الثالث الثانوي - الثانوية العامة علوم الحياة (SV)
  | 'bac_se'       // الثالث الثانوي - الثانوية العامة اجتماع واقتصاد (SE)
  | 'bac_lh'       // الثالث الثانوي - الثانوية العامة آداب وإنسانيات (LH)
  | 'primary'      // الابتدائي العام
  | 'middle'       // المتوسط العام
  | 'premiere';    // الثاني الثانوي عام

export interface GradeLevelDef {
  id: GradeLevelId;
  name: { ar: string; fr: string; en: string };
  badge: string;
  cycle: { ar: string; fr: string; en: string };
  color: string;
  iconBg: string;
}

export interface StoredSession {
  id: string;
  gradeId: GradeLevelId;
  subject: string;
  title: string;
  teacherName: string;
  teacherAvatar: string;
  date: string;
  timeSlot: string; // e.g. "4:15 PM – 5:00 PM"
  duration: string;
  summary: string;
  exerciseTitle: string;
  baremePoints: string;
  keyPoints: string[];
  recordingPreview: string;
}

export interface LiveSessionInfo {
  id: string;
  gradeId: GradeLevelId;
  subject: string;
  title: string;
  teacherName: string;
  teacherAvatar: string;
  timeSlot: string; // Daily within 4:00 PM - 8:00 PM window
  isLiveNow: boolean;
  activeStudentsCount: number;
  currentChapter: string;
  participants: { id: string; name: string; avatar: string; role: 'student' | 'teacher' }[];
}

export interface ExerciseSubmission {
  id: string;
  studentName: string;
  studentAvatar: string;
  submittedAt: string;
  imageUrl: string;
  exerciseNote?: string;
  aiSolution?: {
    transcription: string;
    stepByStepSolution: string[];
    baremeBreakdown: { criteria: string; points: number }[];
    officialTips: string;
  };
}

