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
  registeredGradeLabel: string;
  registrationChooseGrade: string;
  registrationLoadingGrades: string;
  registrationNoGrades: string;
  liveActivationRequired: string;
  liveRegisteredSessionOnly: string;
  liveRoomRegistrationRequired: string;
  liveRoomGradeRequired: string;
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
  liveBroadcastSetupRequired: string;
  liveVideoConnecting: string;
  liveVideoReady: string;
  liveVideoWaiting: string;
  liveVideoError: string;
  liveVideoUnsupported: string;
  liveBroadcastActive: string;
  startBroadcast: string;
  stopBroadcast: string;
  liveVideoRetry: string;
  subjectLabel: string;
  titleLabel: string;
  sourceNameLabel: string;
  sourceUrlLabel: string;
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

const baseTranslations: Record<'ar' | 'en' | 'fr', Translations> = {
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
    registrationUsernameTaken: "يوجد حساب بهذا الاسم. إذا كنت قد بدأت التسجيل فاستخدم كلمة المرور نفسها للمتابعة، وإلا فاختر اسماً آخر.",
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
    registeredGradeLabel: "الصف الدراسي",
    registrationChooseGrade: "اختر الصف الدراسي",
    registrationLoadingGrades: "جارٍ تحميل الصفوف...",
    registrationNoGrades: "لا توجد صفوف متاحة للتسجيل حالياً.",
    liveActivationRequired: "يجب تفعيل حسابك من المدير قبل الدخول إلى البث المباشر.",
    liveRegisteredSessionOnly: "يمكنك الدخول إلى البث المباشر لصفك المسجل فيه فقط.",
    liveRoomRegistrationRequired: "يرجى التسجيل لاستخدام غرفة البث المباشر.",
    liveRoomGradeRequired: "يجب أن يكون لحسابك صف دراسي مسجل لاستخدام غرفة البث المباشر.",
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
    liveBroadcastSetupRequired: "يلزم إعداد Stream Video قبل بدء البث.",
    liveVideoConnecting: "جارٍ الاتصال بغرفة البث...",
    liveVideoReady: "الكاميرا والميكروفون متوقفان. ابدأ البث عند الاستعداد.",
    liveVideoWaiting: "غرفة البث جاهزة — بانتظار بدء البث المباشر.",
    liveVideoError: "تعذر الاتصال بالبث المباشر. تحقق من بيانات Stream Video وحاول مجدداً.",
    liveVideoUnsupported: "لا يدعم هذا المتصفح تشغيل بث الفيديو.",
    liveBroadcastActive: "أنت تبث الآن مباشرة.",
    startBroadcast: "بدء البث المباشر",
    stopBroadcast: "إيقاف البث",
    liveVideoRetry: "إعادة المحاولة",
    subjectLabel: "المادة",
    titleLabel: "العنوان",
    sourceNameLabel: "المصدر",
    sourceUrlLabel: "رابط المصدر",
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
    registrationUsernameTaken: "Un compte utilise déjà ce nom. Si vous avez commencé l’inscription, utilisez le même mot de passe pour continuer ; sinon, choisissez un autre nom.",
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
    registeredGradeLabel: "Classe",
    registrationChooseGrade: "Choisissez une classe",
    registrationLoadingGrades: "Chargement des classes...",
    registrationNoGrades: "Aucune classe n’est disponible pour l’inscription.",
    liveActivationRequired: "Le directeur doit activer votre compte avant l’accès au direct.",
    liveRegisteredSessionOnly: "Vous pouvez accéder uniquement aux diffusions en direct de votre classe inscrite.",
    liveRoomRegistrationRequired: "Veuillez vous inscrire pour utiliser la salle en direct.",
    liveRoomGradeRequired: "Votre compte doit être associé à une classe pour utiliser la salle en direct.",
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
    liveBroadcastSetupRequired: "Configurez Stream Video avant de lancer le direct.",
    liveVideoConnecting: "Connexion à la salle de diffusion...",
    liveVideoReady: "La caméra et le microphone sont arrêtés. Démarrez la diffusion lorsque vous êtes prêt.",
    liveVideoWaiting: "La salle est prête — en attente du début de la diffusion.",
    liveVideoError: "Impossible de se connecter au direct. Vérifiez la configuration Stream Video et réessayez.",
    liveVideoUnsupported: "Ce navigateur ne prend pas en charge la lecture vidéo en direct.",
    liveBroadcastActive: "Vous êtes en direct.",
    startBroadcast: "Démarrer le direct",
    stopBroadcast: "Arrêter le direct",
    liveVideoRetry: "Réessayer",
    subjectLabel: "Matière",
    titleLabel: "Titre",
    sourceNameLabel: "Source",
    sourceUrlLabel: "Lien de la source",
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
    registrationUsernameTaken: "An account already uses this username. If you started registration earlier, use the same password to continue; otherwise choose another username.",
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
    registeredGradeLabel: "Grade",
    registrationChooseGrade: "Choose a grade",
    registrationLoadingGrades: "Loading grades...",
    registrationNoGrades: "No grades are currently available for registration.",
    liveActivationRequired: "The Director must activate your account before you can join live sessions.",
    liveRegisteredSessionOnly: "You can access live broadcasts only for your registered grade.",
    liveRoomRegistrationRequired: "Please register to use the live room.",
    liveRoomGradeRequired: "Your account must have a registered grade to use the live room.",
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
    liveBroadcastSetupRequired: "Configure Stream Video before starting a broadcast.",
    liveVideoConnecting: "Connecting to the broadcast room...",
    liveVideoReady: "Camera and microphone are off. Start the broadcast when ready.",
    liveVideoWaiting: "The room is ready — waiting for the live broadcast to start.",
    liveVideoError: "Could not connect to live video. Check Stream Video configuration and try again.",
    liveVideoUnsupported: "This browser does not support live video playback.",
    liveBroadcastActive: "You are live now.",
    startBroadcast: "Start live broadcast",
    stopBroadcast: "Stop broadcast",
    liveVideoRetry: "Retry",
    subjectLabel: "Subject",
    titleLabel: "Title",
    sourceNameLabel: "Source name",
    sourceUrlLabel: "Source URL",
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

export const translations: Record<Language, Translations> = {
  ...baseTranslations,
  es: {
    ...baseTranslations.en,
    appName: "Agenda",
    heroTitle: "La educación que cada estudiante merece",
    heroSubtitle: "Descubre clases en directo impartidas por educadores expertos en todas las materias académicas.",
    heroCollageTitle: "Una comunidad de estudiantes que explora el currículo, los exámenes, las tutorías y las actividades",
    searchPlaceholder: "Busca materias, educadores, exámenes oficiales o tareas...",
    searchBtn: "Buscar",
    registerBtn: "Registrarse",
    signInLabel: "Iniciar sesión",
    signInPrompt: "¿Ya tienes una cuenta? Inicia sesión",
    switchToRegister: "Crear una cuenta",
    signingInLabel: "Iniciando sesión...",
    directorSignInSeparate: "Usa el acceso de Director para iniciar sesión como Director.",
    invalidLogin: "El nombre de usuario o la contraseña no son correctos.",
    accountSignedIn: "Has iniciado sesión.",
    paymentBtn: "Pago",
    paymentTitle: "Pago",
    paymentDescription: "El pago mensual por sesión es de 125 USD.",
    paymentProvider: "Continuar con Suyool",
    bookTutor: "Reservar sesión (7 $)",
    sessionRate: "7 $ / 45 min",
    sessionDurationNote: "Sesión individual de 45 minutos con un educador certificado",
    archiveSessions: "Archivo de sesiones",
    categories: { all: "Todas las materias", academics: "Plan de estudios", officialExams: "Preparación para exámenes oficiales", homeworkSolver: "Tareas y agenda", enrichment: "Actividades y STEM", languages: "Idiomas y artes" },
    archiveTitle: "Archivo de exámenes oficiales",
    archiveSubtitle: "Exámenes oficiales con criterios de corrección y soluciones desarrolladas.",
    filterYear: "Año",
    filterTrack: "Rama",
    filterSubject: "Materia",
    filterSession: "Convocatoria",
    session1: "Primera convocatoria",
    session2: "Segunda convocatoria",
    allYears: "Todos los años",
    allSubjects: "Todas las materias",
    allTracks: "Todas las ramas",
    viewBareme: "Criterios oficiales de corrección",
    viewSolution: "Solución",
    viewPrompt: "Enunciado",
    pointsTotal: "Puntuación total",
    minutesDuration: "Duración",
    downloadPrint: "Imprimir",
    startPracticeMode: "Simulación cronometrada",
    bookTutorForQuestion: "Resolver con un educador (7 $)",
    agendaTitle: "Agenda escolar y tareas",
    agendaSubtitle: "Organiza las tareas, resuelve ejercicios y reserva tutorías certificadas.",
    addAssignment: "Añadir tarea",
    solveWithTutor: "Resolver con un educador (7 $)",
    relatedExamInArchive: "Ejercicio similar en el archivo",
    tutorsTitle: "Educadores certificados",
    tutorsSubtitle: "Educadores cualificados de las mejores escuelas. Tarifa fija: 7 $ por sesión.",
    streamFilter: "Sistema",
    allStreams: "Todos",
    francophone: "Francófono",
    anglophone: "Anglófono",
    bilingual: "Bilingüe",
    vettedTeacher: "Certificado",
    sessionsCompleted: "sesiones impartidas",
    passRate: "Tasa de aprobados",
    bookSession: "Reservar por 7 $",
    classroomTitle: "Aula virtual",
    sharedWhiteboard: "Pizarra interactiva",
    examSplitView: "Hoja del examen",
    timerLabel: "Tiempo restante",
    endSession: "Salir del aula",
    drawTool: "Lápiz",
    eraserTool: "Borrador",
    clearBoard: "Borrar",
    saveNotes: "Guardar apuntes",
    chatPlaceholder: "Escribe una nota o un mensaje...",
    roleStudent: "Estudiante",
    roleTeacher: "Educador",
    accountTypeLabel: "Tipo de cuenta",
    usernameLabel: "Nombre de usuario",
    fullNameLabel: "Nombre completo",
    emailLabel: "Correo electrónico",
    phoneLabel: "Teléfono",
    schoolOrGradeLabel: "Escuela / curso",
    educatorSubjectLabel: "Materia que imparte",
    passwordLabel: "Contraseña",
    usernamePlaceholder: "Elige un nombre de usuario",
    fullNamePlaceholder: "Tu nombre completo",
    phonePlaceholder: "+34 600 000 000",
    schoolPlaceholder: "Nombre de la escuela o curso",
    educatorSubjectPlaceholder: "Materias que impartes",
    passwordPlaceholder: "Introduce una contraseña",
    createAccountLabel: "Crear cuenta",
    creatingAccountLabel: "Creando cuenta...",
    closeLabel: "Cerrar",
    registrationUsernameTaken: "Este nombre de usuario ya existe. Si empezaste el registro, utiliza la misma contraseña; de lo contrario, elige otro nombre.",
    registrationRequiredFields: "Comprueba que todos los campos obligatorios estén completos.",
    registrationServiceUnavailable: "El servicio de registro no está disponible. Inténtalo de nuevo.",
    registrationPendingActivation: "Registro guardado. Espera a que el Director active tu cuenta antes de entrar en las clases en directo.",
    accountNotActivated: "El Director aún no ha activado tu cuenta.",
    accountExpired: "Tu cuenta ha caducado. Contacta con el Director para renovarla.",
    registrationSessionConflict: "Esta cuenta ya está registrada en otra sesión.",
    registrationChooseSession: "Elige la sesión en la que deseas registrarte.",
    registrationLoadingSessions: "Cargando sesiones...",
    registrationNoSessions: "No hay sesiones disponibles para registrarse.",
    registeredSessionLabel: "Sesión asignada",
    registeredGradeLabel: "Curso",
    registrationChooseGrade: "Elige un curso",
    registrationLoadingGrades: "Cargando cursos...",
    registrationNoGrades: "No hay cursos disponibles para registrarse.",
    liveActivationRequired: "El Director debe activar tu cuenta antes de entrar en las clases en directo.",
    liveRegisteredSessionOnly: "Solo puedes acceder a las emisiones de tu sesión registrada.",
    liveRoomRegistrationRequired: "Regístrate para utilizar el aula en directo.",
    liveRoomGradeRequired: "Tu cuenta debe tener un curso registrado para utilizar el aula.",
    backToMain: "Volver a la pantalla principal",
    joiningDate: "Fecha de alta",
    expiryDate: "Fecha de vencimiento",
    phoneNumber: "Teléfono",
    renewMonth: "Renovar un mes",
    resetPassword: "Restablecer contraseña",
    passwordNotStored: "Las contraseñas nunca se almacenan en texto legible",
    sessionsTab: "Gestionar sesiones",
    addSession: "Añadir sesión",
    deleteSession: "Eliminar",
    saveSession: "Guardar sesión",
    liveBroadcast: "Emisión en directo",
    setupLiveBroadcast: "Configurar emisión",
    liveWaiting: "El aula está lista; esperando a que el educador inicie la emisión.",
    liveBroadcastSetupRequired: "Configura Stream Video antes de iniciar una emisión.",
    liveVideoConnecting: "Conectando con el aula en directo...",
    liveVideoReady: "La cámara y el micrófono están apagados. Inicia la emisión cuando estés listo.",
    liveVideoWaiting: "El aula está lista; esperando el inicio de la emisión.",
    liveVideoError: "No se pudo conectar al vídeo en directo. Comprueba la configuración e inténtalo de nuevo.",
    liveVideoUnsupported: "Este navegador no admite reproducción de vídeo en directo.",
    liveBroadcastActive: "Estás emitiendo en directo.",
    startBroadcast: "Iniciar emisión",
    stopBroadcast: "Detener emisión",
    liveVideoRetry: "Reintentar",
    subjectLabel: "Materia",
    titleLabel: "Título",
    sourceNameLabel: "Nombre de la fuente",
    sourceUrlLabel: "URL de la fuente",
    gradeLabel: "Curso",
    deleteConfirm: "¿Eliminar esta sesión?",
    paymentMethods: "Métodos de pago",
    whishMoney: "Whish Money",
    omtCash: "OMT",
    freshUSD: "Dólares estadounidenses",
    cardPayment: "Tarjeta de crédito o débito",
    tracks: { BREVET: "Brevet (9.º curso)", BAC_SG: "Ciencias generales", BAC_SV: "Ciencias de la vida", BAC_SE: "Sociología y economía", BAC_LH: "Humanidades", ELEMENTARY: "Primaria", COMPLEMENTAIRE: "Secundaria" },
    subjects: { math: "Matemáticas", physics: "Física", chemistry: "Química", biology: "Biología", economics: "Economía", sociology: "Sociología", philosophy: "Filosofía", arabic: "Árabe", french: "Francés", english: "Inglés", civics: "Educación cívica", history: "Historia", geography: "Geografía" }
  },
  it: {
    ...baseTranslations.en,
    appName: "Agenda",
    heroTitle: "L'istruzione che ogni studente merita",
    heroSubtitle: "Scopri lezioni dal vivo in piccoli gruppi con educatori esperti in tutte le materie scolastiche.",
    heroCollageTitle: "Una comunità di studenti che esplora programmi scolastici, esami, ripetizioni e attività",
    searchPlaceholder: "Cerca materie, educatori, esami ufficiali o compiti...",
    searchBtn: "Cerca",
    registerBtn: "Registrati",
    signInLabel: "Accedi",
    signInPrompt: "Hai già un account? Accedi",
    switchToRegister: "Crea un account",
    signingInLabel: "Accesso in corso...",
    directorSignInSeparate: "Usa l'accesso Direttore per entrare come Direttore.",
    invalidLogin: "Nome utente o password non corretti.",
    accountSignedIn: "Accesso effettuato.",
    paymentBtn: "Pagamento",
    paymentTitle: "Pagamento",
    paymentDescription: "Il pagamento mensile per sessione è di 125 USD.",
    paymentProvider: "Continua con Suyool",
    bookTutor: "Prenota una lezione (7 $)",
    sessionRate: "7 $ / 45 min",
    sessionDurationNote: "Lezione individuale di 45 minuti con un educatore certificato",
    archiveSessions: "Archivio delle lezioni",
    categories: { all: "Tutte le materie", academics: "Programma scolastico", officialExams: "Preparazione agli esami ufficiali", homeworkSolver: "Compiti e agenda", enrichment: "Attività e STEM", languages: "Lingue e arti" },
    archiveTitle: "Archivio degli esami ufficiali",
    archiveSubtitle: "Prove d'esame ufficiali con criteri di valutazione e soluzioni complete.",
    filterYear: "Anno",
    filterTrack: "Indirizzo",
    filterSubject: "Materia",
    filterSession: "Sessione",
    session1: "Prima sessione",
    session2: "Seconda sessione",
    allYears: "Tutti gli anni",
    allSubjects: "Tutte le materie",
    allTracks: "Tutti gli indirizzi",
    viewBareme: "Criteri ufficiali di valutazione",
    viewSolution: "Soluzione",
    viewPrompt: "Testo del problema",
    pointsTotal: "Punteggio totale",
    minutesDuration: "Durata",
    downloadPrint: "Stampa",
    startPracticeMode: "Simulazione a tempo",
    bookTutorForQuestion: "Risolvi con un educatore (7 $)",
    agendaTitle: "Agenda scolastica e compiti",
    agendaSubtitle: "Organizza i compiti, risolvi gli esercizi e prenota lezioni con educatori certificati.",
    addAssignment: "Aggiungi compito",
    solveWithTutor: "Risolvi con un educatore (7 $)",
    relatedExamInArchive: "Esercizio simile nell'archivio",
    tutorsTitle: "Educatori certificati",
    tutorsSubtitle: "Educatori qualificati delle migliori scuole. Tariffa fissa: 7 $ a lezione.",
    streamFilter: "Sistema",
    allStreams: "Tutti",
    francophone: "Francofono",
    anglophone: "Anglofono",
    bilingual: "Bilingue",
    vettedTeacher: "Certificato",
    sessionsCompleted: "lezioni svolte",
    passRate: "Percentuale di promossi",
    bookSession: "Prenota a 7 $",
    classroomTitle: "Aula virtuale",
    sharedWhiteboard: "Lavagna interattiva",
    examSplitView: "Foglio d'esame",
    timerLabel: "Tempo rimanente",
    endSession: "Esci dall'aula",
    drawTool: "Penna",
    eraserTool: "Gomma",
    clearBoard: "Cancella",
    saveNotes: "Salva appunti",
    chatPlaceholder: "Scrivi una nota o un messaggio...",
    roleStudent: "Studente",
    roleTeacher: "Educatore",
    accountTypeLabel: "Tipo di account",
    usernameLabel: "Nome utente",
    fullNameLabel: "Nome completo",
    emailLabel: "Indirizzo e-mail",
    phoneLabel: "Numero di telefono",
    schoolOrGradeLabel: "Scuola / classe",
    educatorSubjectLabel: "Materia insegnata",
    passwordLabel: "Password",
    usernamePlaceholder: "Scegli un nome utente",
    fullNamePlaceholder: "Il tuo nome completo",
    phonePlaceholder: "+39 300 000 0000",
    schoolPlaceholder: "Nome della scuola o classe",
    educatorSubjectPlaceholder: "Materie che insegni",
    passwordPlaceholder: "Inserisci una password",
    createAccountLabel: "Crea account",
    creatingAccountLabel: "Creazione account...",
    closeLabel: "Chiudi",
    registrationUsernameTaken: "Questo nome utente è già in uso. Se hai già iniziato la registrazione, usa la stessa password; altrimenti scegline un altro.",
    registrationRequiredFields: "Verifica che tutti i campi obbligatori siano compilati.",
    registrationServiceUnavailable: "Il servizio di registrazione non è disponibile. Riprova.",
    registrationPendingActivation: "Registrazione salvata. Attendi l'attivazione del Direttore prima di accedere alle lezioni dal vivo.",
    accountNotActivated: "Il Direttore non ha ancora attivato il tuo account.",
    accountExpired: "Il tuo account è scaduto. Contatta il Direttore per rinnovarlo.",
    registrationSessionConflict: "Questo account è già registrato a un'altra sessione.",
    registrationChooseSession: "Scegli la sessione a cui desideri iscriverti.",
    registrationLoadingSessions: "Caricamento delle lezioni...",
    registrationNoSessions: "Al momento non ci sono lezioni disponibili per l'iscrizione.",
    registeredSessionLabel: "Lezione assegnata",
    registeredGradeLabel: "Classe",
    registrationChooseGrade: "Scegli una classe",
    registrationLoadingGrades: "Caricamento delle classi...",
    registrationNoGrades: "Non ci sono classi disponibili per l'iscrizione.",
    liveActivationRequired: "Il Direttore deve attivare il tuo account prima di accedere alle lezioni dal vivo.",
    liveRegisteredSessionOnly: "Puoi accedere solo alle dirette della tua lezione registrata.",
    liveRoomRegistrationRequired: "Registrati per utilizzare l'aula dal vivo.",
    liveRoomGradeRequired: "Il tuo account deve avere una classe registrata per utilizzare l'aula.",
    backToMain: "Torna alla schermata principale",
    joiningDate: "Data di iscrizione",
    expiryDate: "Data di scadenza",
    phoneNumber: "Numero di telefono",
    renewMonth: "Rinnova per un mese",
    resetPassword: "Reimposta password",
    passwordNotStored: "Le password non vengono mai salvate in formato leggibile",
    sessionsTab: "Gestione lezioni",
    addSession: "Aggiungi lezione",
    deleteSession: "Elimina",
    saveSession: "Salva lezione",
    liveBroadcast: "Diretta",
    setupLiveBroadcast: "Configura diretta",
    liveWaiting: "L'aula è pronta: in attesa che l'educatore avvii la diretta.",
    liveBroadcastSetupRequired: "Configura Stream Video prima di avviare una diretta.",
    liveVideoConnecting: "Connessione all'aula dal vivo...",
    liveVideoReady: "Telecamera e microfono sono spenti. Avvia la diretta quando sei pronto.",
    liveVideoWaiting: "L'aula è pronta: in attesa dell'inizio della diretta.",
    liveVideoError: "Impossibile connettersi al video dal vivo. Controlla la configurazione e riprova.",
    liveVideoUnsupported: "Questo browser non supporta la riproduzione video dal vivo.",
    liveBroadcastActive: "Sei in diretta.",
    startBroadcast: "Avvia diretta",
    stopBroadcast: "Interrompi diretta",
    liveVideoRetry: "Riprova",
    subjectLabel: "Materia",
    titleLabel: "Titolo",
    sourceNameLabel: "Nome della fonte",
    sourceUrlLabel: "URL della fonte",
    gradeLabel: "Classe",
    deleteConfirm: "Eliminare questa lezione?",
    paymentMethods: "Metodi di pagamento",
    whishMoney: "Whish Money",
    omtCash: "OMT",
    freshUSD: "Dollari statunitensi",
    cardPayment: "Carta di credito o debito",
    tracks: { BREVET: "Brevet (classe 9)", BAC_SG: "Scienze generali", BAC_SV: "Scienze della vita", BAC_SE: "Socio-economia", BAC_LH: "Lettere e discipline umanistiche", ELEMENTARY: "Scuola primaria", COMPLEMENTAIRE: "Scuola media" },
    subjects: { math: "Matematica", physics: "Fisica", chemistry: "Chimica", biology: "Biologia", economics: "Economia", sociology: "Sociologia", philosophy: "Filosofia", arabic: "Arabo", french: "Francese", english: "Inglese", civics: "Educazione civica", history: "Storia", geography: "Geografia" }
  }
};
