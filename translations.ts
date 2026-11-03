import { Language } from './types';

export interface Translations {
  appName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCollageTitle: string;
  searchPlaceholder: string;
  searchBtn: string;
  
  registerBtn: string;
  bookTutor: string;
  sessionRate: string;
  sessionDurationNote: string;
  archiveSessions: string;
  
  categories: {
    all: string;
    academics: string;
    officialExams: string;
    homeworkSolver: string;
    enrichment: string;
    languages: string;
  };

  archiveTitle: string;
  archiveSubtitle: string;
  filterYear: string;
  filterTrack: string;
  filterSubject: string;
  filterSession: string;
  session1: string;
  session2: string;
  allYears: string;
  allSubjects: string;
  allTracks: string;
  
  viewBareme: string;
  viewSolution: string;
  viewPrompt: string;
  pointsTotal: string;
  minutesDuration: string;
  downloadPrint: string;
  startPracticeMode: string;
  bookTutorForQuestion: string;
  
  agendaTitle: string;
  agendaSubtitle: string;
  addAssignment: string;
  solveWithTutor: string;
  relatedExamInArchive: string;
  
  tutorsTitle: string;
  tutorsSubtitle: string;
  streamFilter: string;
  allStreams: string;
  francophone: string;
  anglophone: string;
  bilingual: string;
  vettedTeacher: string;
  sessionsCompleted: string;
  passRate: string;
  bookSession: string;
  
  classroomTitle: string;
  sharedWhiteboard: string;
  examSplitView: string;
  timerLabel: string;
  endSession: string;
  drawTool: string;
  eraserTool: string;
  clearBoard: string;
  saveNotes: string;
  chatPlaceholder: string;
  
  roleStudent: string;
  roleTeacher: string;
  
  paymentMethods: string;
  whishMoney: string;
  omtCash: string;
  freshUSD: string;
  cardPayment: string;
  
  tracks: {
    BREVET: string;
    BAC_SG: string;
    BAC_SV: string;
    BAC_SE: string;
    BAC_LH: string;
    ELEMENTARY: string;
    COMPLEMENTAIRE: string;
  };
  
  subjects: {
    math: string;
    physics: string;
    chemistry: string;
    biology: string;
    economics: string;
    sociology: string;
    philosophy: string;
    arabic: string;
    french: string;
    english: string;
    civics: string;
    history: string;
    geography: string;
  };
}

export const translations: Record<Language, Translations> = {
  ar: {
    appName: "Agenda",
    heroTitle: "التعليم الذي يستحقه الطالب",
    heroSubtitle: "اكتشف آلاف الحصص الحية الفردية والمكثفة بإشراف نخبة من خيرة الأساتذة المعتمدين في المناهج الأكاديمية.",
    heroCollageTitle: "مجتمع متكامل من المتعلمين لاستكشاف المناهج والامتحانات والدروس الخصوصية والنوادي",
    searchPlaceholder: "ابحث عن مادة، أستاذ، مسابقة رسمية، أو فرض مدرسي...",
    searchBtn: "بحث",
    
    registerBtn: "تسجيل جديد",
    bookTutor: "حجز حصة (٧$)",
    sessionRate: "٧$ / ٤٥ دقيقة",
    sessionDurationNote: "حصة مباشرة فردية ٤٥ دقيقة مع مدرّس معتمد",
    archiveSessions: "أرشيف الحصص",
    
    categories: {
      all: "جميع المواد",
      academics: "المناهج الأكاديمية",
      officialExams: "الامتحانات الرسمية",
      homeworkSolver: "حل الفروض والأجندة",
      enrichment: "الأنشطة الإثرائية",
      languages: "اللغات والآداب",
    },

    archiveTitle: "الامتحانات الرسمية وسلالم التصحيح",
    archiveSubtitle: "بنك المسابقات الرسمية مع سلّم التصحيح المعتمد والحلول النموذجية.",
    filterYear: "السنة",
    filterTrack: "الفرع",
    filterSubject: "المادة",
    filterSession: "الدورة",
    session1: "الدورة الأولى",
    session2: "الدورة الثانية",
    allYears: "جميع السنوات",
    allSubjects: "جميع المواد",
    allTracks: "جميع الفروع",
    
    viewBareme: "سلّم التصحيح (Barème)",
    viewSolution: "الحل النموذجي",
    viewPrompt: "نص المسابقة",
    pointsTotal: "العلامة",
    minutesDuration: "المدة",
    downloadPrint: "طباعة",
    startPracticeMode: "محاكاة الامتحان",
    bookTutorForQuestion: "حل التمرين مع أستاذ (٧$)",
    
    agendaTitle: "المفكرة المدرسية وحل التمارين",
    agendaSubtitle: "تنظيم الفروض اليومية وربط التمارين بالامتحانات الرسمية وحجز المساعدة المباشرة.",
    addAssignment: "إضافة فرض",
    solveWithTutor: "حل مع أستاذ (٧$)",
    relatedExamInArchive: "تمرين مشابه في الأرشيف",
    
    tutorsTitle: "نخبة المدرّسين المعتمدين",
    tutorsSubtitle: "أساتذة معتمدون من كبرى المدارس والجامعات. سعر الحصة موحد: ٧$ فقط.",
    streamFilter: "النظام",
    allStreams: "الكل",
    francophone: "فرنكوفوني",
    anglophone: "أنغلوفوني",
    bilingual: "ثنائي اللغة",
    vettedTeacher: "مدرّس معتمد",
    sessionsCompleted: "حصة منجزة",
    passRate: "نسبة النجاح",
    bookSession: "حجز حصة (٧$)",
    
    classroomTitle: "غرفة الدرس التفاعلية",
    sharedWhiteboard: "لوح رقمي مشترك",
    examSplitView: "المسابقة والفرض",
    timerLabel: "الوقت المتبقي",
    endSession: "إنهاء الحصة",
    drawTool: "قلم",
    eraserTool: "ممحاة",
    clearBoard: "مسح",
    saveNotes: "تنزيل الشرح",
    chatPlaceholder: "اكتب رسالة للمدرّس...",
    
    roleStudent: "طالب",
    roleTeacher: "مدرّس",
    
    paymentMethods: "طرق الدفع",
    whishMoney: "Whish Money",
    omtCash: "OMT",
    freshUSD: "Fresh USD كاش",
    cardPayment: "بطاقة مصرفية",
    
    tracks: {
      BREVET: "البريفيه (Grade 9)",
      BAC_SG: "علوم عامة (SG)",
      BAC_SV: "علوم الحياة (SV)",
      BAC_SE: "اجتماع واقتصاد (SE)",
      BAC_LH: "آداب وإنسانيات (LH)",
      ELEMENTARY: "المرحلة الابتدائية",
      COMPLEMENTAIRE: "المرحلة المتوسطة",
    },
    
    subjects: {
      math: "رياضيات",
      physics: "فيزياء",
      chemistry: "كيمياء",
      biology: "علوم الحياة (SVT)",
      economics: "اقتصاد",
      sociology: "اجتماع",
      philosophy: "فلسفة",
      arabic: "لغة عربية",
      french: "لغة فرنسية",
      english: "لغة إنكليزية",
      civics: "تربية مدنية",
      history: "تاريخ",
      geography: "جغرافيا",
    }
  },
  
  fr: {
    appName: "Agenda",
    heroTitle: "L'éducation que l'élève mérite",
    heroSubtitle: "Découvrez des milliers de cours vivants en petit format dispensés par des enseignants certifiés dans les programmes académiques.",
    heroCollageTitle: "Une communauté d'apprenants explorant programmes scolaires, annales officielles, tutorat et clubs",
    searchPlaceholder: "Rechercher une matière, un prof, un examen officiel ou un devoir...",
    searchBtn: "Rechercher",
    
    registerBtn: "S'inscrire",
    bookTutor: "Réserver (7 $)",
    sessionRate: "7 $ / 45 min",
    sessionDurationNote: "Séance individuelle de 45 minutes avec un enseignant certifié",
    archiveSessions: "Archives des Séances",
    
    categories: {
      all: "Toutes disciplines",
      academics: "Matières Scolaires",
      officialExams: "Examens Officiels",
      homeworkSolver: "Aide aux Devoirs",
      enrichment: "Enrichissement & Clubs",
      languages: "Langues & Lettres",
    },

    archiveTitle: "Examens Officiels Libanais",
    archiveSubtitle: "Épreuves officielles avec barèmes officiels et solutions complètes.",
    filterYear: "Année",
    filterTrack: "Série",
    filterSubject: "Matière",
    filterSession: "Session",
    session1: "1ère Session",
    session2: "2ème Session",
    allYears: "Toutes les années",
    allSubjects: "Toutes les matières",
    allTracks: "Toutes les séries",
    
    viewBareme: "Barème Officiel",
    viewSolution: "Solution",
    viewPrompt: "Énoncé",
    pointsTotal: "Total",
    minutesDuration: "Durée",
    downloadPrint: "Imprimer",
    startPracticeMode: "Mode Chronométré",
    bookTutorForQuestion: "Résoudre avec un prof (7 $)",
    
    agendaTitle: "Agenda Scolaire & Devoirs",
    agendaSubtitle: "Organisation des devoirs, préparation d'examens et appui tuteur à la demande.",
    addAssignment: "Ajouter un devoir",
    solveWithTutor: "Résoudre avec un prof (7 $)",
    relatedExamInArchive: "Exercice similaire",
    
    tutorsTitle: "Professeurs Certifiés",
    tutorsSubtitle: "Enseignants qualifiés des meilleurs collèges et lycées. Tarif fixe : 7 $ la séance.",
    streamFilter: "Régime",
    allStreams: "Tous régimes",
    francophone: "Francophone",
    anglophone: "Anglophone",
    bilingual: "Bilingue",
    vettedTeacher: "Certifié",
    sessionsCompleted: "séances données",
    passRate: "Taux de réussite",
    bookSession: "Réserver pour 7 $",
    
    classroomTitle: "Salle de Classe en Direct",
    sharedWhiteboard: "Tableau blanc partagé",
    examSplitView: "Document de travail",
    timerLabel: "Temps restant",
    endSession: "Terminer",
    drawTool: "Stylo",
    eraserTool: "Gomme",
    clearBoard: "Effacer",
    saveNotes: "Télécharger",
    chatPlaceholder: "Écrire au professeur...",
    
    roleStudent: "Élève",
    roleTeacher: "Professeur",
    
    paymentMethods: "Moyens de Paiement",
    whishMoney: "Whish Money",
    omtCash: "OMT",
    freshUSD: "Fresh USD",
    cardPayment: "Carte bancaire",
    
    tracks: {
      BREVET: "Brevet (Grade 9)",
      BAC_SG: "Sciences Générales (SG)",
      BAC_SV: "Sciences de la Vie (SV)",
      BAC_SE: "Socio-Économie (SE)",
      BAC_LH: "Lettres & Humanités (LH)",
      ELEMENTARY: "Primaire",
      COMPLEMENTAIRE: "Complémentaire",
    },
    
    subjects: {
      math: "Mathématiques",
      physics: "Physique",
      chemistry: "Chimie",
      biology: "SVT",
      economics: "Économie",
      sociology: "Sociologie",
      philosophy: "Philosophie",
      arabic: "Arabe",
      french: "Français",
      english: "Anglais",
      civics: "Éducation Civique",
      history: "Histoire",
      geography: "Géographie",
    }
  },
  
  en: {
    appName: "Agenda",
    heroTitle: "The Education the Student Deserves",
    heroSubtitle: "Discover thousands of small-format, live classes taught by expert teachers, across academics.",
    heroCollageTitle: "A collage of learners exploring academic curriculum, enrichment, tutoring, clubs and more",
    searchPlaceholder: "Search subjects, teachers, official exams, or homework topics...",
    searchBtn: "Search",
    
    registerBtn: "Register",
    bookTutor: "Book Session ($7)",
    sessionRate: "$7 / 45 min",
    sessionDurationNote: "45-minute 1-on-1 session with a certified educator",
    archiveSessions: "Archive Sessions",
    
    categories: {
      all: "All Subjects",
      academics: "Academic Curriculum",
      officialExams: "Official Exam Prep",
      homeworkSolver: "Homework & Agenda",
      enrichment: "Enrichment & STEM",
      languages: "Languages & Arts",
    },

    archiveTitle: "Official Exam Archive",
    archiveSubtitle: "Official state exam papers with complete Barème rubrics and worked solutions.",
    filterYear: "Year",
    filterTrack: "Track",
    filterSubject: "Subject",
    filterSession: "Session",
    session1: "1st Session",
    session2: "2nd Session",
    allYears: "All Years",
    allSubjects: "All Subjects",
    allTracks: "All Tracks",
    
    viewBareme: "Official Barème",
    viewSolution: "Solution",
    viewPrompt: "Problem",
    pointsTotal: "Total Marks",
    minutesDuration: "Duration",
    downloadPrint: "Print",
    startPracticeMode: "Timed Simulation",
    bookTutorForQuestion: "Solve with Tutor ($7)",
    
    agendaTitle: "School Agenda & Homework",
    agendaSubtitle: "Track homework, solve difficult exercises, and book on-demand certified tutoring.",
    addAssignment: "Add Homework",
    solveWithTutor: "Solve with Tutor ($7)",
    relatedExamInArchive: "Similar Exam Question",
    
    tutorsTitle: "Certified Educators",
    tutorsSubtitle: "Vetted teachers from top schools across Lebanon. Strict flat rate: $7 / session.",
    streamFilter: "Stream",
    allStreams: "All Streams",
    francophone: "Francophone",
    anglophone: "Anglophone",
    bilingual: "Bilingual",
    vettedTeacher: "Certified",
    sessionsCompleted: "sessions delivered",
    passRate: "Pass Rate",
    bookSession: "Book for $7",
    
    classroomTitle: "Live Classroom",
    sharedWhiteboard: "Interactive Whiteboard",
    examSplitView: "Exam Sheet",
    timerLabel: "Time Remaining",
    endSession: "Leave Classroom",
    drawTool: "Pen",
    eraserTool: "Eraser",
    clearBoard: "Clear",
    saveNotes: "Save Notes",
    chatPlaceholder: "Type a note or message...",
    
    roleStudent: "Student",
    roleTeacher: "Educator",
    
    paymentMethods: "Payment Methods",
    whishMoney: "Whish Money",
    omtCash: "OMT",
    freshUSD: "Fresh USD",
    cardPayment: "Credit / Debit Card",
    
    tracks: {
      BREVET: "Brevet (Grade 9)",
      BAC_SG: "General Sciences (SG)",
      BAC_SV: "Life Sciences (SV)",
      BAC_SE: "Socio-Economics (SE)",
      BAC_LH: "Humanities (LH)",
      ELEMENTARY: "Elementary",
      COMPLEMENTAIRE: "Middle School",
    },
    
    subjects: {
      math: "Mathematics",
      physics: "Physics",
      chemistry: "Chemistry",
      biology: "Biology",
      economics: "Economics",
      sociology: "Sociology",
      philosophy: "Philosophy",
      arabic: "Arabic",
      french: "French",
      english: "English",
      civics: "Civics",
      history: "History",
      geography: "Geography",
    }
  }
};
