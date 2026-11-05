import { Language } from './types';

export interface Translations {
  appName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCollageTitle: string;
  searchPlaceholder: string;
  searchBtn: string;
  
  registerBtn: string;
  signInLabel: string;
  signInPrompt: string;
  switchToRegister: string;
  signingInLabel: string;
  directorSignInSeparate: string;
  invalidLogin: string;
  accountSignedIn: string;
  paymentBtn: string;
  paymentTitle: string;
  paymentDescription: string;
  paymentProvider: string;
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
  accountTypeLabel: string;
  usernameLabel: string;
  fullNameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  schoolOrGradeLabel: string;
  educatorSubjectLabel: string;
  passwordLabel: string;
  usernamePlaceholder: string;
  fullNamePlaceholder: string;
  phonePlaceholder: string;
  schoolPlaceholder: string;
  educatorSubjectPlaceholder: string;
  passwordPlaceholder: string;
  createAccountLabel: string;
  creatingAccountLabel: string;
  closeLabel: string;
  registrationUsernameTaken: string;
  registrationRequiredFields: string;
  registrationServiceUnavailable: string;
  registrationPendingActivation: string;
  accountNotActivated: string;
  accountExpired: string;
  registrationSessionConflict: string;
  registrationChooseSession: string;
  registrationLoadingSessions: string;
  registrationNoSessions: string;
  registeredSessionLabel: string;
  liveActivationRequired: string;
  liveRegisteredSessionOnly: string;
  backToMain: string;
  joiningDate: string;
  expiryDate: string;
  phoneNumber: string;
  renewMonth: string;
  resetPassword: string;
  passwordNotStored: string;
  sessionsTab: string;
  addSession: string;
  deleteSession: string;
  saveSession: string;
  liveBroadcast: string;
  setupLiveBroadcast: string;
  liveWaiting: string;
  liveNotConfigured: string;
  liveBroadcastSetupRequired: string;
  streamUrl: string;
  streamKey: string;
  subjectLabel: string;
  titleLabel: string;
  sourceNameLabel: string;
  sourceUrlLabel: string;
  playbackUrlLabel: string;
  gradeLabel: string;
  deleteConfirm: string;
  
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
    signInLabel: "تسجيل الدخول",
    signInPrompt: "لديك حساب؟ سجّل الدخول",
    switchToRegister: "إنشاء حساب جديد",
    signingInLabel: "جارٍ تسجيل الدخول...",
    directorSignInSeparate: "استخدم بطاقة المدير لتسجيل الدخول كمدير.",
    invalidLogin: "اسم المستخدم أو كلمة المرور غير صحيحة.",
    accountSignedIn: "تم تسجيل الدخول بنجاح.",
    paymentBtn: "الدفع",
    paymentTitle: "الدفع",
    paymentDescription: "الرسوم الشهرية لكل حصة هي ١٢٥ دولاراً أمريكياً.",
    paymentProvider: "المتابعة عبر Suyool",
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
    accountTypeLabel: "نوع الحساب",
    usernameLabel: "اسم المستخدم",
    fullNameLabel: "الاسم الكامل",
    emailLabel: "البريد الإلكتروني",
    phoneLabel: "رقم الهاتف",
    schoolOrGradeLabel: "المدرسة / الصف",
    educatorSubjectLabel: "المادة التعليمية",
    passwordLabel: "كلمة المرور",
    usernamePlaceholder: "اسم المستخدم",
    fullNamePlaceholder: "مثال: كريم خوري",
    phonePlaceholder: "+961 70 123 456",
    schoolPlaceholder: "اسم المدرسة أو الصف",
    educatorSubjectPlaceholder: "المواد التي تدرّسها",
    passwordPlaceholder: "أدخل كلمة المرور",
    createAccountLabel: "إنشاء الحساب",
    creatingAccountLabel: "جارٍ إنشاء الحساب...",
    closeLabel: "إغلاق",
    registrationUsernameTaken: "اسم المستخدم مستخدم بالفعل. اختر اسماً آخر.",
    registrationRequiredFields: "يرجى التحقق من جميع الحقول المطلوبة.",
    registrationServiceUnavailable: "تعذر الاتصال بخدمة التسجيل. حاول مرة أخرى.",
    registrationPendingActivation: "تم حفظ التسجيل. انتظر تفعيل المدير قبل الدخول إلى الحصص المباشرة.",
    accountNotActivated: "لم يفعّل المدير حسابك بعد. يرجى الانتظار قبل تسجيل الدخول.",
    accountExpired: "انتهت صلاحية حسابك. يرجى التواصل مع المدير لتجديده.",
    registrationSessionConflict: "هذا الحساب مسجل في حصة أخرى.",
    registrationChooseSession: "اختر الحصة التي تسجل فيها.",
    registrationLoadingSessions: "جارٍ تحميل الحصص...",
    registrationNoSessions: "لا توجد حصص متاحة للتسجيل حالياً.",
    registeredSessionLabel: "الحصة المسجل فيها",
    liveActivationRequired: "يجب تفعيل حسابك من المدير قبل الدخول إلى البث المباشر.",
    liveRegisteredSessionOnly: "يمكنك الدخول إلى الحصة المباشرة المسجل فيها فقط.",
    backToMain: "العودة إلى الشاشة الرئيسية",
    joiningDate: "تاريخ الانضمام",
    expiryDate: "تاريخ الانتهاء",
    phoneNumber: "رقم الهاتف",
    renewMonth: "تجديد شهر",
    resetPassword: "تغيير كلمة المرور",
    passwordNotStored: "لا يتم حفظ كلمات المرور بصيغتها المقروءة",
    sessionsTab: "إدارة الحصص",
    addSession: "إضافة حصة",
    deleteSession: "حذف",
    saveSession: "حفظ الحصة",
    liveBroadcast: "البث المباشر",
    setupLiveBroadcast: "إعداد البث",
    liveWaiting: "البث جاهز — بانتظار بدء الإرسال من المدرّس.",
    liveNotConfigured: "لم يتم إعداد بث مباشر بعد.",
    liveBroadcastSetupRequired: "يلزم إعداد Cloudflare Stream قبل بدء البث.",
    streamUrl: "عنوان البث",
    streamKey: "مفتاح البث",
    subjectLabel: "المادة",
    titleLabel: "العنوان",
    sourceNameLabel: "المصدر",
    sourceUrlLabel: "رابط المصدر",
    playbackUrlLabel: "رابط الفيديو",
    gradeLabel: "الصف",
    deleteConfirm: "هل تريد حذف هذه الحصة؟",
    
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
    signInLabel: "Connexion",
    signInPrompt: "Déjà inscrit ? Connectez-vous",
    switchToRegister: "Créer un compte",
    signingInLabel: "Connexion...",
    directorSignInSeparate: "Utilisez la carte Directeur pour vous connecter en tant que directeur.",
    invalidLogin: "Nom d’utilisateur ou mot de passe incorrect.",
    accountSignedIn: "Connexion réussie.",
    paymentBtn: "Paiement",
    paymentTitle: "Paiement",
    paymentDescription: "Le paiement mensuel par séance est de 125 USD.",
    paymentProvider: "Continuer avec Suyool",
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
    accountTypeLabel: "Type de compte",
    usernameLabel: "Nom d’utilisateur",
    fullNameLabel: "Nom complet",
    emailLabel: "Adresse e-mail",
    phoneLabel: "Téléphone",
    schoolOrGradeLabel: "École / classe",
    educatorSubjectLabel: "Matière enseignée",
    passwordLabel: "Mot de passe",
    usernamePlaceholder: "Nom d’utilisateur",
    fullNamePlaceholder: "Ex. : Karim Khoury",
    phonePlaceholder: "+961 70 123 456",
    schoolPlaceholder: "Nom de l’école ou classe",
    educatorSubjectPlaceholder: "Matières enseignées",
    passwordPlaceholder: "Saisir le mot de passe",
    createAccountLabel: "Créer le compte",
    creatingAccountLabel: "Création du compte...",
    closeLabel: "Fermer",
    registrationUsernameTaken: "Ce nom d’utilisateur existe déjà. Choisissez-en un autre.",
    registrationRequiredFields: "Vérifiez les champs obligatoires.",
    registrationServiceUnavailable: "Le service d’inscription est indisponible. Réessayez.",
    registrationPendingActivation: "Inscription enregistrée. Attendez l’activation du directeur pour accéder aux cours en direct.",
    accountNotActivated: "Le directeur n’a pas encore activé votre compte. Veuillez patienter.",
    accountExpired: "Votre compte a expiré. Contactez le directeur pour le renouveler.",
    registrationSessionConflict: "Ce compte est déjà inscrit à une autre séance.",
    registrationChooseSession: "Choisissez la séance à laquelle vous vous inscrivez.",
    registrationLoadingSessions: "Chargement des séances...",
    registrationNoSessions: "Aucune séance n’est disponible pour l’inscription.",
    registeredSessionLabel: "Séance inscrite",
    liveActivationRequired: "Le directeur doit activer votre compte avant l’accès au direct.",
    liveRegisteredSessionOnly: "Vous pouvez accéder uniquement à votre séance inscrite.",
    backToMain: "Retour à l’écran principal",
    joiningDate: "Date d’inscription",
    expiryDate: "Date d’expiration",
    phoneNumber: "Téléphone",
    renewMonth: "Renouveler un mois",
    resetPassword: "Réinitialiser le mot de passe",
    passwordNotStored: "Les mots de passe ne sont pas conservés en clair",
    sessionsTab: "Gérer les cours",
    addSession: "Ajouter un cours",
    deleteSession: "Supprimer",
    saveSession: "Enregistrer le cours",
    liveBroadcast: "Diffusion en direct",
    setupLiveBroadcast: "Configurer la diffusion",
    liveWaiting: "Le direct est prêt — en attente du démarrage par l’enseignant.",
    liveNotConfigured: "Aucune diffusion en direct n’est configurée.",
    liveBroadcastSetupRequired: "Configurez Cloudflare Stream avant de lancer le direct.",
    streamUrl: "Adresse de diffusion",
    streamKey: "Clé de diffusion",
    subjectLabel: "Matière",
    titleLabel: "Titre",
    sourceNameLabel: "Source",
    sourceUrlLabel: "Lien de la source",
    playbackUrlLabel: "Lien vidéo",
    gradeLabel: "Classe",
    deleteConfirm: "Supprimer ce cours ?",
    
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
    signInLabel: "Sign in",
    signInPrompt: "Already registered? Sign in",
    switchToRegister: "Create an account",
    signingInLabel: "Signing in...",
    directorSignInSeparate: "Use the Director card to sign in as Director.",
    invalidLogin: "The username or password is incorrect.",
    accountSignedIn: "You are signed in.",
    paymentBtn: "Payment",
    paymentTitle: "Payment",
    paymentDescription: "Monthly payment per session is 125 USD.",
    paymentProvider: "Continue with Suyool",
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
    accountTypeLabel: "Account type",
    usernameLabel: "Username",
    fullNameLabel: "Full name",
    emailLabel: "Email address",
    phoneLabel: "Phone number",
    schoolOrGradeLabel: "School / grade",
    educatorSubjectLabel: "Teaching subject",
    passwordLabel: "Password",
    usernamePlaceholder: "Choose a username",
    fullNamePlaceholder: "Your full name",
    phonePlaceholder: "+961 70 123 456",
    schoolPlaceholder: "School name or grade",
    educatorSubjectPlaceholder: "Subjects you teach",
    passwordPlaceholder: "Enter a password",
    createAccountLabel: "Create account",
    creatingAccountLabel: "Creating account...",
    closeLabel: "Close",
    registrationUsernameTaken: "That username is already registered. Choose another.",
    registrationRequiredFields: "Check that all required fields are complete.",
    registrationServiceUnavailable: "Registration service is unavailable. Try again.",
    registrationPendingActivation: "Registration saved. Wait for Director activation before joining live sessions.",
    accountNotActivated: "The Director has not activated your account yet. Please wait before signing in.",
    accountExpired: "Your account has expired. Contact the Director to renew it.",
    registrationSessionConflict: "This account is already registered for another session.",
    registrationChooseSession: "Choose the session you are registering for.",
    registrationLoadingSessions: "Loading sessions...",
    registrationNoSessions: "No sessions are currently available for registration.",
    registeredSessionLabel: "Registered session",
    liveActivationRequired: "The Director must activate your account before you can join live sessions.",
    liveRegisteredSessionOnly: "You can join only the live session you registered for.",
    backToMain: "Back to main screen",
    joiningDate: "Joining date",
    expiryDate: "Expiry date",
    phoneNumber: "Phone number",
    renewMonth: "Renew one month",
    resetPassword: "Reset password",
    passwordNotStored: "Passwords are never stored in readable form",
    sessionsTab: "Manage sessions",
    addSession: "Add session",
    deleteSession: "Delete",
    saveSession: "Save session",
    liveBroadcast: "Live broadcast",
    setupLiveBroadcast: "Set up broadcast",
    liveWaiting: "The live room is ready — waiting for the teacher to start streaming.",
    liveNotConfigured: "No live broadcast has been configured yet.",
    liveBroadcastSetupRequired: "Configure Cloudflare Stream before starting a broadcast.",
    streamUrl: "Stream URL",
    streamKey: "Stream key",
    subjectLabel: "Subject",
    titleLabel: "Title",
    sourceNameLabel: "Source name",
    sourceUrlLabel: "Source URL",
    playbackUrlLabel: "Video URL",
    gradeLabel: "Grade",
    deleteConfirm: "Delete this session?",
    
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
