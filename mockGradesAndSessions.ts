import { GradeLevelDef, StoredSession, LiveSessionInfo } from '../types';

export const LEBANESE_GRADE_LEVELS: GradeLevelDef[] = [
  // 1. Terminale / Baccalauréat
  {
    id: 'bac_sg',
    name: {
      ar: 'الثانوية العامة - علوم عامة (SG)',
      fr: 'Terminale - Sciences Générales (SG)',
      en: 'Grade 12 - General Sciences (SG)'
    },
    badge: 'Bac SG',
    cycle: { ar: 'المرحلة الثانوية', fr: 'Cycle Secondaire', en: 'Secondary' },
    color: 'from-blue-600 to-indigo-700',
    iconBg: 'bg-blue-600'
  },
  {
    id: 'bac_se',
    name: {
      ar: 'الثانوية العامة - اجتماع واقتصاد (SE)',
      fr: 'Terminale - Sociologie & Économie (SE)',
      en: 'Grade 12 - Socio-Economics (SE)'
    },
    badge: 'Bac SE',
    cycle: { ar: 'المرحلة الثانوية', fr: 'Cycle Secondaire', en: 'Secondary' },
    color: 'from-amber-600 to-orange-700',
    iconBg: 'bg-amber-600'
  },
  {
    id: 'bac_lh',
    name: {
      ar: 'الثانوية العامة - آداب وإنسانيات (LH)',
      fr: 'Terminale - Lettres & Humanités (LH)',
      en: 'Grade 12 - Literature & Humanities (LH)'
    },
    badge: 'Bac LH',
    cycle: { ar: 'المرحلة الثانوية', fr: 'Cycle Secondaire', en: 'Secondary' },
    color: 'from-purple-600 to-pink-700',
    iconBg: 'bg-purple-600'
  },

  // 2. Secondary 1 & 2
  {
    id: 'premiere_sc',
    name: {
      ar: 'الثانوي الثاني - علمي (1ère S)',
      fr: 'Première Scientifique (1ère S)',
      en: 'Grade 11 - Science Track'
    },
    badge: '1ère Sc',
    cycle: { ar: 'المرحلة الثانوية', fr: 'Cycle Secondaire', en: 'Secondary' },
    color: 'from-indigo-600 to-blue-800',
    iconBg: 'bg-indigo-600'
  },
  {
    id: 'premiere_lit',
    name: {
      ar: 'الثانوي الثاني - أدبي (1ère L)',
      fr: 'Première Littéraire (1ère L)',
      en: 'Grade 11 - Humanities Track'
    },
    badge: '1ère Lit',
    cycle: { ar: 'المرحلة الثانوية', fr: 'Cycle Secondaire', en: 'Secondary' },
    color: 'from-violet-600 to-purple-800',
    iconBg: 'bg-violet-600'
  },
  {
    id: 'seconde',
    name: {
      ar: 'الثانوي الأول - مشترك (Seconde)',
      fr: 'Seconde - Tronc Commun (2nde)',
      en: 'Grade 10 - Sophomore (2nde)'
    },
    badge: '2nde / EB10',
    cycle: { ar: 'المرحلة الثانوية', fr: 'Cycle Secondaire', en: 'Secondary' },
    color: 'from-teal-600 to-emerald-800',
    iconBg: 'bg-teal-600'
  },

  // 3. Middle School / Cycle Complémentaire
  {
    id: 'brevet',
    name: {
      ar: 'الشهادة المتوسطة - البريفيه (EB9)',
      fr: 'Brevet Officiel - EB9 (3ème)',
      en: 'Grade 9 - Official Brevet (EB9)'
    },
    badge: 'Brevet EB9',
    cycle: { ar: 'المرحلة المتوسطة', fr: 'Cycle Complémentaire', en: 'Middle School' },
    color: 'from-cyan-600 to-blue-700',
    iconBg: 'bg-cyan-600'
  },
  {
    id: 'eb8',
    name: {
      ar: 'الصف الثامن الأساسي (EB8 - 4ème)',
      fr: 'Classe de 4ème (EB8)',
      en: 'Grade 8 (EB8 - 4ème)'
    },
    badge: 'EB8 / 4ème',
    cycle: { ar: 'المرحلة المتوسطة', fr: 'Cycle Complémentaire', en: 'Middle School' },
    color: 'from-sky-600 to-indigo-700',
    iconBg: 'bg-sky-600'
  },
  {
    id: 'eb7',
    name: {
      ar: 'الصف السابع الأساسي (EB7 - 5ème)',
      fr: 'Classe de 5ème (EB7)',
      en: 'Grade 7 (EB7 - 5ème)'
    },
    badge: 'EB7 / 5ème',
    cycle: { ar: 'المرحلة المتوسطة', fr: 'Cycle Complémentaire', en: 'Middle School' },
    color: 'from-blue-500 to-sky-700',
    iconBg: 'bg-blue-500'
  },

  // 4. Elementary / Cycle Primaire (EB1 to EB6)
  {
    id: 'eb6',
    name: {
      ar: 'الصف السادس الأساسي (EB6 - 6ème)',
      fr: 'Classe de 6ème (EB6)',
      en: 'Grade 6 (EB6 - 6ème)'
    },
    badge: 'EB6 / 6ème',
    cycle: { ar: 'المرحلة الابتدائية', fr: 'Cycle Primaire', en: 'Elementary' },
    color: 'from-emerald-500 to-teal-700',
    iconBg: 'bg-emerald-500'
  },
  {
    id: 'eb5',
    name: {
      ar: 'الصف الخامس الابتدائي (EB5 - CM2)',
      fr: 'Classe de CM2 (EB5)',
      en: 'Grade 5 (EB5 - CM2)'
    },
    badge: 'EB5 / CM2',
    cycle: { ar: 'المرحلة الابتدائية', fr: 'Cycle Primaire', en: 'Elementary' },
    color: 'from-teal-500 to-emerald-700',
    iconBg: 'bg-teal-500'
  },
  {
    id: 'eb4',
    name: {
      ar: 'الصف الرابع الابتدائي (EB4 - CM1)',
      fr: 'Classe de CM1 (EB4)',
      en: 'Grade 4 (EB4 - CM1)'
    },
    badge: 'EB4 / CM1',
    cycle: { ar: 'المرحلة الابتدائية', fr: 'Cycle Primaire', en: 'Elementary' },
    color: 'from-cyan-500 to-blue-600',
    iconBg: 'bg-cyan-500'
  },
  {
    id: 'eb3',
    name: {
      ar: 'الصف الثالث الابتدائي (EB3 - CE2)',
      fr: 'Classe de CE2 (EB3)',
      en: 'Grade 3 (EB3 - CE2)'
    },
    badge: 'EB3 / CE2',
    cycle: { ar: 'المرحلة الابتدائية', fr: 'Cycle Primaire', en: 'Elementary' },
    color: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-500'
  },
  {
    id: 'eb2',
    name: {
      ar: 'الصف الثاني الابتدائي (EB2 - CE1)',
      fr: 'Classe de CE1 (EB2)',
      en: 'Grade 2 (EB2 - CE1)'
    },
    badge: 'EB2 / CE1',
    cycle: { ar: 'المرحلة الابتدائية', fr: 'Cycle Primaire', en: 'Elementary' },
    color: 'from-orange-500 to-rose-600',
    iconBg: 'bg-orange-500'
  },
  {
    id: 'eb1',
    name: {
      ar: 'الصف الأول الابتدائي (EB1 - CP)',
      fr: 'Classe de CP (EB1)',
      en: 'Grade 1 (EB1 - CP)'
    },
    badge: 'EB1 / CP',
    cycle: { ar: 'المرحلة الابتدائية', fr: 'Cycle Primaire', en: 'Elementary' },
    color: 'from-rose-500 to-red-600',
    iconBg: 'bg-rose-500'
  },

  // 5. Kindergarten / Maternelle
  {
    id: 'kg',
    name: {
      ar: 'الروضات والتحضيري (KG / Maternelle)',
      fr: 'Maternelle (Grande Section - KG)',
      en: 'Kindergarten & Preschool (KG)'
    },
    badge: 'KG / Maternelle',
    cycle: { ar: 'التعليم التحضيري', fr: 'Cycle Préscolaire', en: 'Preschool' },
    color: 'from-pink-500 to-rose-600',
    iconBg: 'bg-pink-500'
  }
];

export const MOCK_LIVE_SESSIONS: LiveSessionInfo[] = [
  {
    id: 'live_bac_sg_math',
    gradeId: 'bac_sg',
    subject: 'Mathématiques / رياضيات',
    title: 'Nombres Complexes & Transformations Géométriques (Barème MEHE)',
    teacherName: 'Prof. Jad Khoury',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    timeSlot: '4:00 PM – 4:45 PM',
    isLiveNow: true,
    activeStudentsCount: 5,
    currentChapter: 'Forme exponentielle, arguments et lieux géométriques',
    participants: [
      { id: 't_1', name: 'Prof. Jad Khoury', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', role: 'teacher' },
      { id: 's_1', name: 'كريم منصور (You)', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80', role: 'student' }
    ]
  },
  {
    id: 'live_bac_sg_phys',
    gradeId: 'bac_sg',
    subject: 'Physique / فيزياء',
    title: 'Circuits RLC en régime sinusoïdal forcé & Résonance d’intensité',
    teacherName: 'Dr. Ziad Gemayel',
    teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    timeSlot: '5:00 PM – 5:45 PM',
    isLiveNow: true,
    activeStudentsCount: 4,
    currentChapter: 'Oscillations électriques & Déphasage (Barème 20 pts)',
    participants: [
      { id: 't_2', name: 'Dr. Ziad Gemayel', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', role: 'teacher' }
    ]
  },
  {
    id: 'live_bac_se_eco',
    gradeId: 'bac_se',
    subject: 'Économie & Sociologie',
    title: 'Politiques Économiques Conjoncturelles & Croissance Durable',
    teacherName: 'Prof. Walid Boustani',
    teacherAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    timeSlot: '7:00 PM – 7:45 PM',
    isLiveNow: true,
    activeStudentsCount: 5,
    currentChapter: 'Schémas fléchés & Analyse causale des crises',
    participants: []
  },
  {
    id: 'live_bac_lh_phil',
    gradeId: 'bac_lh',
    subject: 'Philosophie & Arabe',
    title: 'L’Inconscient, la Morale et la Dissertation Méthodique',
    teacherName: 'Prof. Georges Haddad',
    teacherAvatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&auto=format&fit=crop&q=80',
    timeSlot: '5:30 PM – 6:15 PM',
    isLiveNow: true,
    activeStudentsCount: 3,
    currentChapter: 'Problématique philosophique et plan dialectique',
    participants: []
  },
  {
    id: 'live_brevet_math',
    gradeId: 'brevet',
    subject: 'Mathématiques / رياضيات',
    title: 'Théorème de Thalès, Trigonométrie & Géométrie du Cercle',
    teacherName: 'Mme. Nayla Rizk',
    teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    timeSlot: '4:30 PM – 5:15 PM',
    isLiveNow: true,
    activeStudentsCount: 6,
    currentChapter: 'Démonstrations géométriques types Brevet officiel',
    participants: []
  },
  {
    id: 'live_seconde_math',
    gradeId: 'seconde',
    subject: 'Mathématiques / رياضيات',
    title: 'Vecteurs du Plan, Équations de Droites & Polynômes',
    teacherName: 'Prof. Jad Khoury',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    timeSlot: '5:00 PM – 5:45 PM',
    isLiveNow: true,
    activeStudentsCount: 4,
    currentChapter: 'Calcul vectoriel et colinéarité',
    participants: []
  },
  {
    id: 'live_eb8_phys',
    gradeId: 'eb8',
    subject: 'Physique-Chimie',
    title: 'Masse Volumique, Pression et Circuits en Série/Dérivation',
    teacherName: 'Dr. Ziad Gemayel',
    teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    timeSlot: '4:15 PM – 5:00 PM',
    isLiveNow: true,
    activeStudentsCount: 3,
    currentChapter: 'Lois des tensions et intensités',
    participants: []
  },
  {
    id: 'live_eb7_math',
    gradeId: 'eb7',
    subject: 'Mathématiques',
    title: 'Nombres Relatifs, Priorités Opératoires et Triangles',
    teacherName: 'Mme. Nayla Rizk',
    teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    timeSlot: '4:30 PM – 5:15 PM',
    isLiveNow: true,
    activeStudentsCount: 5,
    currentChapter: 'Addition et soustraction des relatifs',
    participants: []
  },
  {
    id: 'live_eb6_french',
    gradeId: 'eb6',
    subject: 'Français & Grammaire',
    title: 'Nature et Fonction des Mots, Conjugaison des Temps du Récit',
    teacherName: 'Mme. Rania Chehab',
    teacherAvatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
    timeSlot: '4:00 PM – 4:45 PM',
    isLiveNow: true,
    activeStudentsCount: 4,
    currentChapter: 'Passé simple et imparfait dans le conte',
    participants: []
  },
  {
    id: 'live_eb5_math',
    gradeId: 'eb5',
    subject: 'Mathématiques / حساب',
    title: 'Fractions, Nombres Décimaux et Résolution de Problèmes',
    teacherName: 'Mme. Rania Chehab',
    teacherAvatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
    timeSlot: '4:30 PM – 5:15 PM',
    isLiveNow: true,
    activeStudentsCount: 4,
    currentChapter: 'Addition des fractions de même dénominateur',
    participants: []
  },
  {
    id: 'live_eb1_4_support',
    gradeId: 'eb1',
    subject: 'Lecture, Écriture & Calcul',
    title: 'Apprentissage des Sons, Décodage Syllabique et Additions',
    teacherName: 'Mme. Carole Nader',
    teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    timeSlot: '4:00 PM – 4:45 PM',
    isLiveNow: true,
    activeStudentsCount: 3,
    currentChapter: 'Les familles de syllabes et petites opérations',
    participants: []
  },
  {
    id: 'live_kg_early',
    gradeId: 'kg',
    subject: 'Éveil, Langage & Motricité',
    title: 'Histoires Raconte-Moi, Vocabulaire Bilingue et Chiffres Magiques',
    teacherName: 'Mme. Carole Nader',
    teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    timeSlot: '4:00 PM – 4:40 PM',
    isLiveNow: true,
    activeStudentsCount: 3,
    currentChapter: 'Jeux d’éveil cognitif et reconnaissance des formes',
    participants: []
  }
];

export const MOCK_STORED_SESSIONS: StoredSession[] = [];
