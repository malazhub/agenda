export interface BarèmeCriterion {
  step: string;
  points: string;
}

export interface DetailedExerciseSession {
  id: string;
  sessionNumber: number;
  subject: string;
  subjectIcon: string;
  title: string;
  topic: string;
  teacherName: string;
  teacherAvatar: string;
  date: string;
  duration: string;
  pointsTotal: string;
  exercisePrompt: string;
  baremeBreakdown: BarèmeCriterion[];
  stepByStepSolution: string[];
  officialExamWarning: string;
  calculatorAllowed: boolean;
}

export const MOCK_20_STORED_SESSIONS: DetailedExerciseSession[] = [
  {
    id: 'stored_sess_01',
    sessionNumber: 1,
    subject: 'Mathématiques / رياضيات',
    subjectIcon: '📐',
    title: 'Nombres Complexes & Lieux Géométriques',
    topic: 'Forme exponentielle, arguments et orthogonalité (MEHE Officiel)',
    teacherName: 'Prof. Jad Khoury',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    date: 'أمس • 4:15 PM',
    duration: '45 دقيقة',
    pointsTotal: '12 / 12 pts',
    exercisePrompt: `Dans le plan complexe rapporté à un repère orthonormé direct (O; u, v), on donne les points A d'affixe zA = 1 + i√3 et B d'affixe zB = 2.
À tout point M distinct de B, on associe le point M' d'affixe z' = (z - 1 - i√3) / (z - 2).
1.a Écrire zA sous forme exponentielle et en déduire la nature du triangle OAB.
1.b Exprimer le module |z'| et un argument arg(z') en fonction de longueurs et d'angles de vecteurs.
1.c Déterminer l'ensemble (E) des points M tels que z' soit un imaginaire pur non nul.`,
    baremeBreakdown: [
      { step: '1.a |zA| = √(1 + 3) = 2, cos θ = 1/2, sin θ = √3/2 ⇒ zA = 2 e^(iπ/3)', points: '+2.0 pts' },
      { step: '1.a OA = 2, OB = 2, AB = |2 - 1 - i√3| = |1 - i√3| = 2 ⇒ OAB équilatéral', points: '+1.5 pts' },
      { step: '1.b |z\'| = |z - zA| / |z - zB| = AM / BM', points: '+2.0 pts' },
      { step: '1.b arg(z\') = (BM, AM) [2π]', points: '+2.0 pts' },
      { step: '1.c z\' imaginaire pur ⇔ arg(z\') = π/2 [π] ⇔ (BM ⟂ AM)', points: '+2.5 pts' },
      { step: '1.c Cercle de diamètre [AB] privé des points A et B (car z ≠ 2 et z\' ≠ 0)', points: '+2.0 pts' }
    ],
    stepByStepSolution: [
      '1.a Module et argument de zA : |zA| = √(1² + (√3)²) = √4 = 2. On a cos(θ) = 1/2 et sin(θ) = √3/2, d\'où θ = π/3. Donc zA = 2·e^(iπ/3). Comme OA = |zA| = 2, OB = |zB| = 2, et AB = |zB - zA| = |1 - i√3| = 2, les 3 côtés sont égaux à 2 : le triangle OAB est équilatéral direct.',
      '1.b Par quotient des modules : |z\'| = |z - (1 + i√3)| / |z - 2| = |z - zA| / |z - zB| = AM / BM. Pour l\'argument : arg(z\') = arg(z - zA) - arg(z - zB) = (u, AM) - (u, BM) = (BM, AM) [2π].',
      '1.c z\' est imaginaire pur non nul ⇔ arg(z\') = π/2 + kπ (k ∈ ℤ) ⇔ Les vecteurs BM et AM sont orthogonaux, avec M ≠ B et M ≠ A. L\'ensemble (E) est donc le cercle de diamètre [AB], privé des points A et B.'
    ],
    officialExamWarning: 'تنبيه لجنة الامتحانات الرسمية (MEHE): يُحسم 1.0 نقطة فوراً إذا نسي التلميذ استثناء النقطة B من المحل الهندسي لأن المقام ينعدم عندها (z ≠ 2)!',
    calculatorAllowed: true
  },
  {
    id: 'stored_sess_02',
    sessionNumber: 2,
    subject: 'Physique / فيزياء',
    subjectIcon: '⚡',
    title: 'Circuits RLC en Régime Sinusoïdal Forcé & Résonance',
    topic: 'Équation différentielle, déphasage et bande passante (MEHE Bac SG/SV)',
    teacherName: 'Dr. Ziad Gemayel',
    teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    date: '28 تشرين الأول • 5:00 PM',
    duration: '45 دقيقة',
    pointsTotal: '20 / 20 pts',
    exercisePrompt: `Un dipôle RLC série comprend une bobine (L = 0.2 H, r = 10 Ω), un conducteur ohmique R = 40 Ω et un condensateur de capacité C = 5 μF.
Le circuit est alimenté par une tension sinusoïdale u(t) = Um cos(ωt) de valeur efficace U = 12 V.
1. Établir l'équation différentielle régissant l'intensité instantanée i(t).
2. Déterminer la pulsation propre ω0 et la pulsation de résonance d'intensité.
3. Calculer l'intensité efficace I0 à la résonance ainsi que le facteur de qualité Q.
4. Calculer la tension efficace maximale aux bornes du condensateur à la résonance.`,
    baremeBreakdown: [
      { step: '1. Loi des mailles: u(t) = uR + ub + uC = (R+r)i + L(di/dt) + q/C', points: '+3.0 pts' },
      { step: '1. Dérivation par rapport au temps: L(d²i/dt²) + (R+r)(di/dt) + i/C = du/dt', points: '+3.0 pts' },
      { step: '2. Pulsation propre ω0 = 1/√(LC) = 1/√(0.2 × 5×10⁻⁶) = 1000 rad/s', points: '+3.0 pts' },
      { step: '2. À la résonance d\'intensité, ω = ω0 = 1000 rad/s (car impédance Z minimale = R+r)', points: '+2.0 pts' },
      { step: '3. Z_min = R + r = 50 Ω ⇒ I0 = U / (R+r) = 12 / 50 = 0.24 A', points: '+3.0 pts' },
      { step: '3. Facteur de qualité Q = (L·ω0) / (R+r) = (0.2 × 1000) / 50 = 4.0', points: '+3.0 pts' },
      { step: '4. UC0 = I0 / (C·ω0) = Q × U = 4.0 × 12 = 48 V (Phénomène de surtension)', points: '+3.0 pts' }
    ],
    stepByStepSolution: [
      '1. En appliquant la loi d\'additivité des tensions le long de la maille : u(t) = Ri(t) + [ri(t) + L·di/dt] + uc(t). Sachant que i = dq/dt et uc = q/C, on dérive les deux membres par rapport au temps pour obtenir : L(d²i/dt²) + (R+r)(di/dt) + i/C = du/dt.',
      '2. La pulsation propre est ω0 = 1/√(LC) = 1/√(0.2 × 5×10⁻⁶) = 1000 rad/s. À la résonance d\'intensité, la réactance totale s\'annule (Lω - 1/(Cω) = 0), donc ω_res = ω0 = 1000 rad/s.',
      '3. À la résonance, l\'impédance est purement résistive : Z = R + r = 40 + 10 = 50 Ω. L\'intensité efficace maximale vaut I0 = U / (R+r) = 12 / 50 = 0.24 A. Le facteur de surtension vaut Q = Lω0 / (R+r) = 200 / 50 = 4.0 (sans unité).',
      '4. La tension efficace aux bornes du condensateur vaut UC = I0 / (C·ω0) = 0.24 / (5×10⁻⁶ × 1000) = 48 V. On remarque que UC = Q × U = 4 × 12 = 48 V, ce qui illustre le phénomène de surtension aux bornes du dipôle réactif.'
    ],
    officialExamWarning: 'ملاحظة التصحيح الرسمية: ذكر قانون التوترات بدقة وتحديد وحدة معامل الجودة Q بأنه رقم مجرد (Sans unité) مطلوب لنيل العلامة الكاملة.',
    calculatorAllowed: true
  },
  {
    id: 'stored_sess_03',
    sessionNumber: 3,
    subject: 'Mathématiques / رياضيات',
    subjectIcon: '📈',
    title: 'Étude de Fonctions Exponentielles & Asymptotes',
    topic: 'Limites aux bornes, branches infinies, dérivée et théorème de bijection',
    teacherName: 'Prof. Jad Khoury',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    date: '27 تشرين الأول • 4:00 PM',
    duration: '45 دقيقة',
    pointsTotal: '15 / 15 pts',
    exercisePrompt: `Soit la fonction f définie sur ℝ par f(x) = (x - 1)·e^x + 2.
1. Calculer lim_{x→-∞} f(x) et interpréter graphiquement le résultat.
2. Calculer lim_{x→+∞} f(x) et lim_{x→+∞} [f(x)/x]. Préciser la branche infinie.
3. Dresser le tableau de variation complet de f.
4. Démontrer que l'équation f(x) = 0 admet une unique solution α sur ]-∞, 1[ et encadrer α à 10⁻² près.`,
    baremeBreakdown: [
      { step: '1. lim_{x→-∞} x·e^x = 0 et lim e^x = 0 ⇒ lim f(x) = 2. Asymptote horizontale y = 2', points: '+3.0 pts' },
      { step: '2. lim f(x) = +∞ et lim f(x)/x = +∞ ⇒ Branche parabolique de direction (Oy)', points: '+3.0 pts' },
      { step: '3. f\'(x) = 1·e^x + (x - 1)·e^x = x·e^x. Signe de f\' et extremum f(0) = 1', points: '+4.0 pts' },
      { step: '4. Continuité et stricte monotonie sur ]-∞, 0] : f(]-∞, 0]) = [1, 2[. Pas de zéro.', points: '+2.0 pts' },
      { step: '4. Sur [0, +∞[, f(x) ≥ 1 > 0. Sur ]-∞, -1[, étude du signe et encadrement.', points: '+3.0 pts' }
    ],
    stepByStepSolution: [
      '1. En développant : f(x) = x·e^x - e^x + 2. Or lim_{x→-∞} x·e^x = 0 (croissances comparées) et lim_{x→-∞} e^x = 0, donc lim_{x→-∞} f(x) = 2. La droite d\'équation y = 2 est asymptote horizontale à la courbe (Cf) en -∞.',
      '2. En +∞ : lim (x - 1) = +∞ et lim e^x = +∞, d\'où lim_{x→+∞} f(x) = +∞. De plus, f(x)/x = (1 - 1/x)e^x + 2/x → +∞. La courbe admet une branche parabolique de direction asymptotique l\'axe des ordonnées (Oy).',
      '3. Pour tout réel x : f\'(x) = 1·e^x + (x - 1)·e^x = x·e^x. Comme e^x > 0, f\'(x) est du signe de x. f est strictement décroissante sur ]-∞, 0] et strictement croissante sur [0, +∞[. Le minimum absolu est f(0) = (0 - 1)·1 + 2 = 1 > 0.',
      '4. Comme le minimum de f est 1 > 0, f(x) ≥ 1 pour tout x ∈ ℝ, donc f(x) ne s\'annule jamais sur ℝ.'
    ],
    officialExamWarning: 'تنبيه: تطبيق مبرهنة التزايد المقارن (Croissances comparées) lim_{x→-∞} x·e^x = 0 شرط إلزامي لكسب علامة النهاية.',
    calculatorAllowed: true
  },
  {
    id: 'stored_sess_04',
    sessionNumber: 4,
    subject: 'Chimie / كيمياء',
    subjectIcon: '🧪',
    title: 'Cinétique Chimique & Suivi par Spectrophotométrie',
    topic: 'Loi de Beer-Lambert, vitesse volumique et temps de demi-réaction t1/2',
    teacherName: 'Dr. Ziad Gemayel',
    teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    date: '26 تشرين الأول • 6:00 PM',
    duration: '45 دقيقة',
    pointsTotal: '14 / 14 pts',
    exercisePrompt: `On étudie la réaction totale d'oxydation des ions iodure I⁻ par les ions peroxodisulfate S2O8²⁻ en milieu aqueux :
S2O8²⁻ + 2 I⁻ → 2 SO4²⁻ + I2.
Le diiode I2 formé est la seule espèce colorée absorbant à 450 nm (A = k·[I2]).
1. Dresser le tableau descriptif d'évolution du système en fonction de l'avancement x(t).
2. Établir l'expression de la vitesse volumique de formation du diiode en fonction de dA/dt.
3. Définir le temps de demi-réaction t1/2 et le déterminer graphiquement sachant A_max = 1.60.`,
    baremeBreakdown: [
      { step: '1. Tableau d\'avancement complet avec état initial, intermédiaire et final', points: '+3.0 pts' },
      { step: '2. [I2](t) = x(t)/V_tot et A(t) = k·[I2] ⇒ x(t) = (V·A)/(k)', points: '+3.0 pts' },
      { step: '2. v = (1/V)·dx/dt = (1/k)·(dA/dt) (Pente de la tangente à l\'instant t)', points: '+3.0 pts' },
      { step: '3. Définition officielle: durée au bout de laquelle l\'avancement atteint la moitié de sa valeur finale x_f/2', points: '+2.5 pts' },
      { step: '3. A(t1/2) = A_max / 2 = 1.60 / 2 = 0.80 ⇒ Projection sur l\'axe des temps t1/2 = 8.5 min', points: '+2.5 pts' }
    ],
    stepByStepSolution: [
      '1. Tableau d\'avancement : à t = 0, n(S2O8²⁻) = n1, n(I⁻) = n2, n(I2) = 0. À t quelconque, n(I2) = x(t), n(SO4²⁻) = 2x(t). À l\'état final, x_max = min(n1, n2/2).',
      '2. D\'après la loi de Beer-Lambert, A(t) = k·[I2](t) = k·(x(t)/VT). Donc x(t) = (VT/k)·A(t). La vitesse volumique de réaction s\'écrit : v(t) = (1/VT)·(dx/dt) = (1/VT)·(VT/k)·(dA/dt) = (1/k)·(dA/dt). Elle est directement proportionnelle au coefficient directeur de la tangente à la courbe A(t).',
      '3. Le temps de demi-réaction t1/2 est la durée au bout de laquelle x(t1/2) = x_max / 2. Comme A est proportionnelle à x, A(t1/2) = A_max / 2 = 1.60 / 2 = 0.80. Par lecture graphique de l\'abscisse correspondant à l\'ordonnée 0.80, on obtient t1/2 = 8.5 minutes.'
    ],
    officialExamWarning: 'تنبيه: يجب كتابة تعريف t1/2 بدقة مستخدماً كلمة "Avancement atteint la moitié de sa valeur finale" لنيل العلامة الكاملة.',
    calculatorAllowed: true
  },
  {
    id: 'stored_sess_05',
    sessionNumber: 5,
    subject: 'Physique / فيزياء',
    subjectIcon: '🎯',
    title: 'Mouvement d’un Projectile dans le Champ de Pesanteur',
    topic: '2ème loi de Newton, équations horaires et équation de la trajectoire',
    teacherName: 'Dr. Ziad Gemayel',
    teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    date: '25 تشرين الأول • 5:15 PM',
    duration: '45 دقيقة',
    pointsTotal: '18 / 18 pts',
    exercisePrompt: `Un ballon est lancé depuis l'origine O avec une vitesse initiale v0 = 20 m/s faisant un angle α = 30° avec l'horizontale (g = 9.8 m/s²).
1. Par application du principe fondamental de la dynamique, déterminer le vecteur accélération a(t).
2. Établir les équations horaires x(t) et y(t) du mouvement.
3. Déduire l'équation cartésienne de la trajectoire y = f(x).
4. Calculer la flèche H (hauteur maximale) et la portée horizontale XP.`,
    baremeBreakdown: [
      { step: '1. Système: ballon {m}. Bilan des forces: P = m·g. RFD: m·a = m·g ⇒ a = g', points: '+3.0 pts' },
      { step: '1. ax = 0 et ay = -g (repère orienté vers le haut)', points: '+2.0 pts' },
      { step: '2. vx(t) = v0·cos α et vy(t) = -gt + v0·sin α', points: '+3.0 pts' },
      { step: '2. x(t) = (v0·cos α)·t et y(t) = -1/2 g t² + (v0·sin α)·t', points: '+3.0 pts' },
      { step: '3. Trajectoire: y = (-g / (2·v0²·cos²α))·x² + (tan α)·x (Arc de parabole)', points: '+3.0 pts' },
      { step: '4. Flèche H = (v0²·sin²α)/(2g) = 5.10 m. Portée XP = (v0²·sin 2α)/g = 35.3 m', points: '+4.0 pts' }
    ],
    stepByStepSolution: [
      '1. Système : {ballon de masse m}. Référentiel terrestre supposé galiléen. La seule force appliquée est le poids P = mg. D\'après la 2ème loi de Newton : Σ F = m·a ⇒ m·g = m·a ⇒ a = g. En projetant sur les axes : ax = 0 et ay = -g.',
      '2. Par intégrations successives avec conditions initiales (x0=0, y0=0, v0x=v0 cos α, v0y=v0 sin α) : vx(t) = v0 cos α, vy(t) = -gt + v0 sin α. Donc x(t) = (v0 cos α)·t et y(t) = -1/2 gt² + (v0 sin α)·t.',
      '3. On élimine t : t = x / (v0 cos α). En remplaçant dans y(t) : y = -g / (2 v0² cos² α) · x² + (tan α) · x.',
      '4. Au sommet S (flèche), vy = 0 ⇒ tS = (v0 sin α)/g = (20 × 0.5)/9.8 = 1.02 s. H = y(tS) = (20² × 0.25) / (2 × 9.8) = 5.10 m. Au sol y = 0 ⇒ XP = (v0² sin 2α)/g = (400 × sin 60°)/9.8 = 35.3 m.'
    ],
    officialExamWarning: 'ملاحظة: التأكيد على تحديد الجملة الميكانيكية (Système) والمرجع العطالي (Référentiel galiléen) شرط إلزامي في بداية التمرين.',
    calculatorAllowed: true
  },
  {
    id: 'stored_sess_06',
    sessionNumber: 6,
    subject: 'Mathématiques / رياضيات',
    subjectIcon: '🎲',
    title: 'Probabilités Conditionnelles & Loi Binomiale',
    topic: 'Arbre pondéré, formule des probabilités totales et schéma de Bernoulli',
    teacherName: 'Prof. Jad Khoury',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    date: '24 تشرين الأول • 4:30 PM',
    duration: '45 دقيقة',
    pointsTotal: '10 / 10 pts',
    exercisePrompt: `Une usine produit des calculatrices avec deux chaînes A et B. La chaîne A assure 60% de la production, avec 2% de pièces défectueuses (D). La chaîne B produit le reste avec 5% de défectueuses.
1. Construire l'arbre de probabilité pondéré complet.
2. Calculer la probabilité qu'une calculatrice choisie au hasard soit défectueuse P(D).
3. La calculatrice est défectueuse. Quelle est la probabilité qu'elle provienne de la chaîne A ?
4. On prélève 10 calculatrices au hasard avec remise. Calculer la probabilité d'avoir exactement 1 défectueuse.`,
    baremeBreakdown: [
      { step: '1. Arbre pondéré complet avec probabilités sur chaque branche', points: '+2.0 pts' },
      { step: '2. Formule des probabilités totales : P(D) = P(A ∩ D) + P(B ∩ D)', points: '+2.5 pts' },
      { step: '2. P(D) = 0.60 × 0.02 + 0.40 × 0.05 = 0.012 + 0.020 = 0.032', points: '+1.5 pts' },
      { step: '3. Probabilité a posteriori (Bayes) : P(A|D) = P(A ∩ D) / P(D) = 0.012 / 0.032 = 0.375', points: '+2.0 pts' },
      { step: '4. Schéma de Bernoulli B(10, 0.032) : P(X = 1) = 10 × (0.032)¹ × (0.968)⁹ = 0.238', points: '+2.0 pts' }
    ],
    stepByStepSolution: [
      '1. Branches principales : P(A) = 0.60, P(B) = 0.40. Branches secondaires : P(D|A) = 0.02, P(D̄|A) = 0.98, P(D|B) = 0.05, P(D̄|B) = 0.95.',
      '2. D\'après la formule des probabilités totales (car {A, B} forme une partition de l\'univers) : P(D) = P(A)·P(D|A) + P(B)·P(D|B) = 0.60 × 0.02 + 0.40 × 0.05 = 0.012 + 0.020 = 0.032 (soit 3.2%).',
      '3. On cherche la probabilité conditionnelle P_D(A) = P(A|D) = P(A ∩ D) / P(D) = 0.012 / 0.032 = 12/32 = 3/8 = 0.375 (soit 37.5%).',
      '4. Le prélèvement de 10 calculatrices constitue la répétition de 10 épreuves de Bernoulli identiques et indépendantes de paramètre p = 0.032. La variable aléatoire X suit la loi binomiale B(10, 0.032). P(X = 1) = C(10, 1) · (0.032)¹ · (1 - 0.032)⁹ = 10 · 0.032 · (0.968)⁹ ≈ 0.2385.'
    ],
    officialExamWarning: 'تنبيه الامتحان الرسمي: يجب ذكر شروط تطبيق قانون برنولي (Tirages indépendants et avec remise) لتبرير استخدام القانون الثنائي B(n, p).',
    calculatorAllowed: true
  },
  {
    id: 'stored_sess_07',
    sessionNumber: 7,
    subject: 'Biologie / علوم الحياة',
    subjectIcon: '🧬',
    title: 'Transmission Synaptique & Potentiel d’Action',
    topic: 'PPSE, PPSI, sommation spatiale et temporelle au niveau du cône axonique',
    teacherName: 'Mme. Nayla Rizk',
    teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    date: '23 تشرين الأول • 5:00 PM',
    duration: '45 دقيقة',
    pointsTotal: '15 / 15 pts',
    exercisePrompt: `On étudie la transmission de l'influx nerveux au niveau d'un motoneurone recevant deux synapses excitatrices S1 et S2 et une synapse inhibitrice S3.
1. Décrire les étapes chimiques de la transmission synaptique suite à l'arrivée d'un train de potentiels d'action au bouton présynaptique.
2. Expliquer l'origine ionique d'un PPSE (dépolarisation) et d'un PPSI (hyperpolarisation).
3. Analyser le phénomène de sommation spatio-temporelle et préciser la condition d'émission d'un potentiel d'action au segment initial.`,
    baremeBreakdown: [
      { step: '1. Arrivée du PA ⇒ ouverture canaux Ca²+ voltage-dépendants ⇒ exocytose neurotransmetteur', points: '+3.5 pts' },
      { step: '1. Fixation sur récepteurs postsynaptiques ⇒ ouverture canaux chimio-dépendants', points: '+2.5 pts' },
      { step: '2. PPSE : Entrée d\'ions Na+ dépolarisante. PPSI : Entrée d\'ions Cl- ou sortie K+ hyperpolarisante', points: '+3.0 pts' },
      { step: '3. Sommation spatiale (plusieurs synapses simultanées) et temporelle (fréquence élevée)', points: '+3.0 pts' },
      { step: '3. Si le potentiel membranaire résultant franchit le seuil (-50 mV) ⇒ émission PA obéissant à la loi du tout ou rien', points: '+3.0 pts' }
    ],
    stepByStepSolution: [
      '1. Étapes : Arrivée du PA présynaptique → Dépolarisation ouvrant les canaux à Ca²+ voltage-dépendants → Entrée massive d\'ions Ca²+ déclenchant la migration et l\'exocytose des vésicules de neurotransmetteur dans la fente synaptique → Diffusion du neurotransmetteur et fixation spécifique sur les récepteurs canaux chimio-dépendants postsynaptiques.',
      '2. Origine ionique : Au niveau d\'une synapse excitatrice (ex: glutamate ou acétylcholine), l\'ouverture des canaux entraîne une entrée nette de Na+, créant une dépolarisation locale appelée PPSE. Au niveau d\'une synapse inhibitrice (ex: GABA), l\'ouverture de canaux à Cl- ou K+ entraîne une entrée de Cl- (ou sortie de K+), hyperpolarisant la membrane (PPSI).',
      '3. Intégration neuronale : Le motoneurone effectue la sommation algébrique (spatiale et temporelle) des PPSE et PPSI au niveau du cône d\'émergence (segment initial). Si la dépolarisation globale atteint ou dépasse le seuil d\'excitation (environ -50 mV), un ou plusieurs potentiels d\'action propagés sont émis selon la loi du tout ou rien.'
    ],
    officialExamWarning: 'ملاحظة التصحيح: التركيز على التفريق الدقيق بين القنوات الفولطية (Voltage-dépendants) والقنوات الكيميائية (Chimio-dépendants).',
    calculatorAllowed: false
  },
  {
    id: 'stored_sess_08',
    sessionNumber: 8,
    subject: 'Économie & Sociologie',
    subjectIcon: '📊',
    title: 'Politiques Économiques Conjoncturelles & Croissance',
    topic: 'Schémas fléchés causaux, relance budgétaire vs politique monétaire restrictive',
    teacherName: 'Prof. Walid Boustani',
    teacherAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    date: '22 تشرين الأول • 7:00 PM',
    duration: '45 دقيقة',
    pointsTotal: '20 / 20 pts',
    exercisePrompt: `En vous basant sur les mécanismes économiques de la politique de relance par la demande globale :
1. Construire le schéma fléché officiel MEHE reliant la baisse des taux d'intérêt directeurs à la stimulation de l'investissement et de la croissance économique.
2. Analyser les effets pervers possibles d'une telle politique sur le solde de la balance commerciale et le taux d'inflation.
3. Proposer deux mesures correctives relevant de la politique de l'offre pour juguler l'inflation importée.`,
    baremeBreakdown: [
      { step: '1. Baisse taux directeurs → Baisse coût crédit → Hausse investissement (I) & consommation (C) → Hausse demande globale → Hausse production (PIB)', points: '+6.0 pts' },
      { step: '2. Risque inflationniste : Tension sur capacités de production → Hausse des prix (inflation par la demande)', points: '+4.0 pts' },
      { step: '2. Risque extérieur : Hausse pouvoir d\'achat orientée vers produits importés → Creusement du déficit commercial', points: '+4.0 pts' },
      { step: '3. Politique d\'offre: Allègement des charges sociales/fiscales des entreprises pour comprimer les coûts de production', points: '+3.0 pts' },
      { step: '3. Subventions ciblées à l\'innovation et à la transition énergétique pour accroître la productivité globale', points: '+3.0 pts' }
    ],
    stepByStepSolution: [
      '1. Schéma fléché causal complet : Baisse des taux d\'intérêt directeurs de la Banque Centrale → Baisse des taux d\'intérêt débiteurs des banques commerciales → Réduction du coût du crédit → Augmentation des crédits à la consommation des ménages et des investissements des entreprises (I) → Augmentation de la demande globale anticipée → Augmentation de la production industrielle → Hausse de la croissance du PIB et résorption du chômage.',
      '2. Effets pervers conjoncturels : Si l\'appareil productif intérieur est rigide ou proche de la pleine capacité, la hausse de la demande crée des tensions inflationnistes (inflation par la demande). De plus, une partie du pouvoir d\'achat supplémentaire s\'oriente vers l\'importation de biens étrangers, dégradant la balance courante et affaiblissant la monnaie nationale.',
      '3. Mesures correctives d\'offre : Réduction de la fiscalité pesant sur les intrants productifs des entreprises (baisser les coûts marginaux) et investissement dans les infrastructures logistiques afin d\'améliorer la compétitivité-prix et hors-prix nationale.'
    ],
    officialExamWarning: 'ملاحظة الامتحانات الرسمية: رسم الأسهم برأس سهم واضح (→) وكتابة الكلمات الاقتصادية المفتاحية بدقة لضمان العلامة التامة في الشق التحليلي.',
    calculatorAllowed: false
  },
  {
    id: 'stored_sess_09',
    sessionNumber: 9,
    subject: 'Mathématiques / رياضيات',
    subjectIcon: '🌐',
    title: 'Géométrie dans l’Espace: Droites & Plans',
    topic: 'Équation cartésienne, produit vectoriel, orthogonalité et distance',
    teacherName: 'Prof. Jad Khoury',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    date: '21 تشرين الأول • 4:00 PM',
    duration: '45 دقيقة',
    pointsTotal: '12 / 12 pts',
    exercisePrompt: `L'espace est rapporté à un repère orthonormé (O; i, j, k). On considère les points A(1, 0, 2), B(2, -1, 3) et C(0, 1, 1).
1. Démontrer que les points A, B et C définissent un unique plan (P).
2. Déterminer un vecteur normal n au plan (P) et en déduire son équation cartésienne.
3. Calculer la distance du point S(3, 2, -1) au plan (P).`,
    baremeBreakdown: [
      { step: '1. Vecteurs AB(1, -1, 1) et AC(-1, 1, -1)... Vérification de non colinéarité', points: '+2.5 pts' },
      { step: '2. Vecteur normal n = AB ∧ AC ou système n·AB = 0 et n·AC = 0', points: '+3.5 pts' },
      { step: '2. Équation cartésienne: ax + by + cz + d = 0 avec calcul de d', points: '+2.5 pts' },
      { step: '3. Formule officielle: d(S, P) = |a xS + b yS + c zS + d| / √(a² + b² + c²)', points: '+3.5 pts' }
    ],
    stepByStepSolution: [
      '1. On calcule les composantes des vecteurs : AB(1, -1, 1) et AC(-1, 1, -1). Pour avoir des points non alignés, les composantes ne doivent pas être proportionnelles. On vérifie la non-colinéarité des deux vecteurs directeurs, donc les trois points A, B, C ne sont pas alignés et définissent un plan unique (P).',
      '2. Soit n(a, b, c) normal à (P). n ⟂ AB ⇔ a - b + c = 0 et n ⟂ AC. On en déduit l\'équation cartésienne du plan sous la forme standard ax + by + cz + d = 0, et en substituant les coordonnées du point A(1, 0, 2), on détermine la constante d.',
      '3. La distance du point S(xS, yS, zS) au plan (P) est donnée par la formule officielle MEHE : d(S, P) = |a·xS + b·yS + c·zS + d| / √(a² + b² + c²).'
    ],
    officialExamWarning: 'تنبيه: يجب كتابة القانون الرياضي لحساب المسافة بحروفه قبل التعويض بالأرقام تجنباً لحسم ربع علامة.',
    calculatorAllowed: true
  },
  {
    id: 'stored_sess_10',
    sessionNumber: 10,
    subject: 'Physique / فيزياء',
    subjectIcon: '🧲',
    title: 'Induction Électromagnétique & Loi de Lenz',
    topic: 'Flux magnétique, f.é.m. induite e = -dΦ/dt et courant induit',
    teacherName: 'Dr. Ziad Gemayel',
    teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    date: '20 تشرين الأول • 5:30 PM',
    duration: '45 دقيقة',
    pointsTotal: '16 / 16 pts',
    exercisePrompt: `Un cadre rectangulaire conducteur de résistance R = 2 Ω, de largeur l = 10 cm, pénètre à vitesse constante v = 5 m/s dans une région où règne un champ magnétique uniforme B = 0.4 T perpendiculaire au plan du cadre.
1. Exprimer le flux magnétique Φ(t) traversant le cadre en fonction du temps.
2. Calculer la force électromotrice induite e(t) et le courant induit i(t).
3. Déterminer le sens du courant induit en appliquant la loi de Lenz.
4. Calculer la force de Laplace freinant le cadre.`,
    baremeBreakdown: [
      { step: '1. Expression du flux Φ = B·S(t) = B·l·x(t) = B·l·v·t', points: '+4.0 pts' },
      { step: '2. f.é.m. e = -dΦ/dt = -B·l·v = -0.4 × 0.10 × 5 = -0.2 V', points: '+3.0 pts' },
      { step: '2. Courant induit i = |e| / R = 0.2 / 2 = 0.1 A', points: '+3.0 pts' },
      { step: '3. Loi de Lenz: le courant induit s\'oppose par ses effets à la cause qui lui donne naissance', points: '+3.0 pts' },
      { step: '4. Force de Laplace F = i·l·B = 0.1 × 0.10 × 0.4 = 4.0×10⁻³ N (force de freinage opposée à v)', points: '+3.0 pts' }
    ],
    stepByStepSolution: [
      '1. La surface immergée dans le champ magnétique à l\'instant t est S(t) = l · x(t) = l · v · t. Le flux magnétique vaut donc Φ(t) = B · S(t) = B · l · v · t = 0.4 × 0.10 × 5 × t = 0.2·t (en Wb).',
      '2. D\'après la loi de Faraday, la f.é.m. induite est e = -dΦ/dt = -0.2 V. L\'intensité du courant induit dans le circuit fermé est i = |e| / R = 0.2 / 2 = 0.1 A.',
      '3. Loi de Lenz : Le flux magnétique augmentant au cours de l\'entrée du cadre, le champ magnétique induit Bind doit s\'opposer à cette augmentation en étant de sens opposé au champ extérieur B. D\'après la règle de la main droite, le courant induit circule dans le sens trigonométrique indirect.',
      '4. Le conducteur frontal traversé par le courant i est soumis à la force de Laplace F = i · l ∧ B. Comme l et B sont orthogonaux, F = i · l · B = 0.1 × 0.10 × 0.4 = 4×10⁻³ N. D\'après la règle des trois doigts, cette force est orientée dans le sens opposé au vecteur vitesse : c\'est une force de freinage.'
    ],
    officialExamWarning: 'تنبيه: نص قانون لينز "Le sens du courant induit s\'oppose à la cause qui lui donne naissance" مطلوب حرفياً لنيل علامة التفسير.',
    calculatorAllowed: true
  },
  {
    id: 'stored_sess_11',
    sessionNumber: 11,
    subject: 'Chimie / كيمياء',
    subjectIcon: '🧪',
    title: 'Titrage pH-métrique Acide Faible / Base Forte',
    topic: 'Point d’équivalence, méthode des tangentes, pKa et zone tampon',
    teacherName: 'Dr. Ziad Gemayel',
    teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    date: '19 تشرين الأول • 6:15 PM',
    duration: '45 دقيقة',
    pointsTotal: '15 / 15 pts',
    exercisePrompt: `On dose un volume VA = 20 mL d'une solution d'acide éthanoïque CH3COOH de concentration inconnue CA par une solution d'hydroxyde de sodium NaOH de concentration CB = 0.10 mol/L.
1. Écrire l'équation bilan de la réaction support de titrage.
2. Le volume équivalent obtenu par la méthode des tangentes parallèles est VBE = 15.0 mL. Calculer CA.
3. Déterminer la valeur du pKa du couple acide/base à la demi-équivalence.
4. Justifier pourquoi le pH à l'équivalence est basique (pH_E > 7).`,
    baremeBreakdown: [
      { step: '1. Équation: CH3COOH + OH⁻ → CH3COO⁻ + H2O (réaction totale et rapide)', points: '+3.0 pts' },
      { step: '2. Relation à l\'équivalence : nA = nB_versé ⇒ CA·VA = CB·VBE', points: '+3.0 pts' },
      { step: '2. CA = (CB × VBE) / VA = (0.10 × 15.0) / 20.0 = 0.075 mol/L', points: '+3.0 pts' },
      { step: '3. À la demi-équivalence VB = VBE/2 = 7.5 mL, pH = pKa = 4.8', points: '+3.0 pts' },
      { step: '4. À l\'équivalence, la solution contient la base faible CH3COO⁻ dont l\'hydrolyse donne des ions OH⁻ (pH_E ≈ 8.7 > 7)', points: '+3.0 pts' }
    ],
    stepByStepSolution: [
      '1. Équation de la réaction chimique : CH3COOH (aq) + OH⁻ (aq) → CH3COO⁻ (aq) + H2O (l). La réaction est quasi-totale (constante d\'équilibre K = Ka / Ke = 10^9.2 >> 10^4) et très rapide.',
      '2. À l\'équivalence, les réactifs ont été mélangés dans les proportions stœchiométriques : n(acide initial) = n(base versée) ⇒ CA · VA = CB · VBE. D\'où CA = (0.10 mol/L × 15.0 mL) / 20.0 mL = 0.075 mol/L.',
      '3. À la demi-équivalence (VB = VBE / 2 = 7.5 mL), la moitié de l\'acide a été transformée en sa base conjuguée : [CH3COOH] = [CH3COO⁻]. Selon l\'équation d\'Henderson-Hasselbalch, pH = pKa + log([Base]/[Acide]) = pKa + log(1) = pKa. La lecture graphique donne pKa = 4.8.',
      '4. À l\'équivalence, tout l\'acide éthanoïque et tous les ions hydroxydes ont réagi. Le milieu ne contient plus que des ions spectateurs Na+ et la base faible acétate CH3COO⁻. La réaction de cette base faible avec l\'eau (CH3COO⁻ + H2O ⇌ CH3COOH + OH⁻) produit un excès d\'ions hydroxydes, ce qui confère à la solution un caractère basique (pH_E > 7).'
    ],
    officialExamWarning: 'ملاحظة لجان التصحيح: يجب كتابة جملة التكافؤ "Les réactifs sont introduits dans les proportions stœchiométriques" للحصول على العلامة التامة.',
    calculatorAllowed: true
  },
  {
    id: 'stored_sess_12',
    sessionNumber: 12,
    subject: 'Mathématiques / رياضيات',
    subjectIcon: '∫',
    title: 'Intégration par Parties & Calcul d’Aires',
    topic: 'Calcul de l’aire délimitée par une courbe exponentielle et ses tangentes',
    teacherName: 'Prof. Jad Khoury',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    date: '18 تشرين الأول • 4:00 PM',
    duration: '45 دقيقة',
    pointsTotal: '10 / 10 pts',
    exercisePrompt: `On considère l'intégrale I = ∫[0 à 1] (2x + 1)·e^(-x) dx.
1. Calculer I en utilisant la formule d'intégration par parties.
2. Interpréter géométriquement la valeur de I en termes d'aire de domaine en unités d'aire (u.a.).`,
    baremeBreakdown: [
      { step: '1. Choix judicieux: u(x) = 2x + 1 ⇒ u\'(x) = 2; v\'(x) = e^(-x) ⇒ v(x) = -e^(-x)', points: '+3.0 pts' },
      { step: '1. Formule: I = [uv] - ∫ u\'v = [-(2x+1)e^(-x)]_0^1 - ∫_0^1 -2 e^(-x) dx', points: '+3.0 pts' },
      { step: '1. Calcul exact: I = (-3/e + 1) - [2 e^(-x)]_0^1 = 3 - 5/e ≈ 1.16 u.a.', points: '+2.0 pts' },
      { step: '2. Interprétation: Aire du domaine plan délimité par Cf, l\'axe (Ox), x=0 et x=1', points: '+2.0 pts' }
    ],
    stepByStepSolution: [
      '1. On pose : u(x) = 2x + 1 qui est dérivable de dérivée u\'(x) = 2. On pose v\'(x) = e^(-x) dont une primitive est v(x) = -e^(-x). Les fonctions u et v sont de classe C1 sur [0, 1]. D\'après la formule d\'intégration par parties : I = [-(2x + 1)e^(-x)] de 0 à 1 - ∫[0 à 1] -2e^(-x) dx = (-3e^(-1) - (-1)) - [2e^(-x)] de 0 à 1 = (1 - 3/e) - (2/e - 2) = 3 - 5/e.',
      '2. Comme pour tout x ∈ [0, 1], f(x) = (2x + 1)e^(-x) > 0, l\'intégrale I représente l\'aire géométrique de la surface délimitée par la courbe (Cf), l\'axe des abscisses (Ox), et les droites verticales x = 0 et x = 1. La valeur exacte est (3 - 5/e) unités d\'aire.'
    ],
    officialExamWarning: 'تنبيه: يجب التحقق من استمرار الدوال C1 على المجال المحدد لتبرير استخدام قانون التكامل بالتجزئة.',
    calculatorAllowed: true
  },
  {
    id: 'stored_sess_13',
    sessionNumber: 13,
    subject: 'Philosophie / فلسفة',
    subjectIcon: '🏛️',
    title: 'L’Inconscient et la Liberté Humaine',
    topic: 'Dissertation philosophique officielle: Thèse freudienne vs Liberté sartrienne',
    teacherName: 'Prof. Georges Haddad',
    teacherAvatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&auto=format&fit=crop&q=80',
    date: '17 تشرين الأول • 5:00 PM',
    duration: '45 دقيقة',
    pointsTotal: '20 / 20 pts',
    exercisePrompt: `Sujet : « L'hypothèse de l'inconscient rend-elle illusoire toute liberté chez l'homme ? »
1. Dégager la problématique philosophique centrale et formuler les enjeux conceptuels.
2. Développer la thèse déterministe freudienne (la blessure narcissique et la souveraineté du Moi contestée).
3. Développer l'antithèse phénoménologique et existentialiste (Sartre et la mauvaise foi).
4. Proposer une synthèse dialectique constructive.`,
    baremeBreakdown: [
      { step: '1. Introduction: Accroche, définition des termes, paradoxe et problématique', points: '+4.0 pts' },
      { step: '2. Thèse: Psychanalyse freudienne, pulsions refoulées, le Ça et le Surmoi', points: '+5.0 pts' },
      { step: '3. Antithèse: Critique sartrienne, liberté ontologique et refus du déterminisme inconscient', points: '+5.0 pts' },
      { step: '4. Synthèse et Conclusion: La prise de conscience psychanalytique comme conquête de liberté ("Wo Es war, soll Ich werden")', points: '+6.0 pts' }
    ],
    stepByStepSolution: [
      '1. Problématique : Si nos actes, désirs et choix conscients sont déterminés à notre insu par des forces psychiques inconscientes (le Ça et le Surmoi), l\'homme peut-il encore être tenu pour un sujet libre et responsable ?',
      '2. Thèse freudienne : Freud affirme que "le Moi n\'est pas maître dans sa propre maison". Les symptômes, actes manqués et rêves révèlent l\'existence de pulsions refoulées qui échappent au contrôle de la volonté consciente, brisant l\'illusion cartésienne de la transparence totale du sujet.',
      '3. Réfutation sartrienne : Jean-Paul Sartre rejette l\'hypothèse d\'un inconscient réifié, qu\'il qualifie d\'alibi de "mauvaise foi". L\'homme est condamné à être libre, et prétendre agir sous la dictée d\'un inconscient mystérieux est une tentative de fuir son angoisse et sa responsabilité inaliénable.',
      '4. Synthèse : Loin d\'anéantir la liberté, la cure psychanalytique en devient l\'instrument : "Là où était le Ça, le Moi doit advenir" (Freud). La liberté n\'est pas une donnée immédiate et magique, mais une libération progressive par l\'élucidation des traumatismes inconscients.'
    ],
    officialExamWarning: 'ملاحظة الامتحانات الرسمية: يشترط المنهج اللبناني بناء تخطيط ثلاثي جدلي (Thèse / Antithèse / Synthèse) مع الاستشهاد بالفلاسفة المعتمدين.',
    calculatorAllowed: false
  },
  {
    id: 'stored_sess_14',
    sessionNumber: 14,
    subject: 'اللغة العربية / Arabe',
    subjectIcon: '📖',
    title: 'تحليل نص أدبي ونقدي: الخطاب الإصلاحي',
    topic: 'التقنيات الحجاجية، الحقول المعجمية، والأساليب البلاغية (شهادة الثانوية العامة)',
    teacherName: 'Prof. Georges Haddad',
    teacherAvatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&auto=format&fit=crop&q=80',
    date: '16 تشرين الأول • 4:15 PM',
    duration: '45 دقيقة',
    pointsTotal: '20 / 20 pts',
    exercisePrompt: `نص مقالي تحليلي حول النهضة والتجديد الثقافي في المشرق العربي:
1. استخرج من النص حقلين معجميين مهيمنين مبيناً العلاقة الرابطة بينهما وتأثيرهما في خدمة المعنى.
2. حدد النمط المهيمن على النص مع تعليل ذلك بأربعة مؤشرات نصية مقرونة بالشواهد.
3. حلل وظيفة الصورة البيانية (الاستعارة المكنية) في الفقرة الثانية.
4. صغ خلاصة نقدية تبين فيها موقف الكاتب ومدى إقناعه للمتلقي.`,
    baremeBreakdown: [
      { step: '1. استخراج حقل التخلف والجمود وحقل التنوير والتجديد، وتبيان علاقة التضاد والتدافع', points: '+4.0 pts' },
      { step: '2. النمط الحجاجي: الروابط المنطقية، الأمثلة الواقعية، أسلوب التوكيد والشرط', points: '+5.0 pts' },
      { step: '3. تحليل الاستعارة: ذكر المستعار منه والمستعار له والقرينة المانعة وسر البلاغة', points: '+4.0 pts' },
      { step: '4. التقويم النقدي والموضوعي لأفكار الكاتب ولغته الإقناعية المباشرة', points: '+7.0 pts' }
    ],
    stepByStepSolution: [
      '1. الحقول المعجمية: يهيمن على النص حقل "الركود والتراجع" (الظلام، القيود، الجهل) وحقل "النهضة والوعي" (النور، الانطلاق، العلم). العلاقة بين الحقلين هي علاقة صراع وتضاد تعكس المفارقة التي يعيشها المجتمع والدعوة إلى كسر أغلال التخلف للانتقال إلى فجر التحديث.',
      '2. النمط المهيمن هو النمط الحجاجي، ومؤشراته: استخدام أدوات التعليل والاستنتاج (لذلك، بما أن)، التوكيد (إن، قد)، اعتماد الشواهد الواقعية والتاريخية، ووضوح الموقف الفكري للكاتب الرامي إلى تعديل قناعات المتلقي.',
      '3. الاستعارة المكنية في قول الكاتب "تصحو الآمال من غفوتها": شبه الآمال بإنسان يصحو، وحذف المشبه به (الإنسان) وأبقى على لازم من لوازمه وهو الصحوة على سبيل الاستعارة المكنية. سر جمالها: التشخيص وبث الحياة في المعاني المجردة لتجسيد فكرة الانبعاث.',
      '4. الخلاصة النقدية: نجح الكاتب في المزاوجة بين حرارة العاطفة الوطنية والمنطق الحجاجي المتماسك، فجاء خطابه مقنعاً ومؤثراً في آنٍ واحد.'
    ],
    officialExamWarning: 'تنبيه الامتحان الرسمي في اللغة العربية: لا تُقبل الإجابة عن النمط الأدبي دون ذكر الشواهد الدقيقة بين قوسين مع تحديد أرقام الأسطر.',
    calculatorAllowed: false
  },
  {
    id: 'stored_sess_15',
    sessionNumber: 15,
    subject: 'Physique / فيزياء',
    subjectIcon: '⚛️',
    title: 'Physique Nucléaire & Énergie de Liaison',
    topic: 'Défaut de masse, énergie de liaison par nucléon et réaction de fusion/fission',
    teacherName: 'Dr. Ziad Gemayel',
    teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    date: '15 تشرين الأول • 5:00 PM',
    duration: '45 دقيقة',
    pointsTotal: '12 / 12 pts',
    exercisePrompt: `On considère la réaction de fusion thermo-nucléaire suivante : ²1H + ³1H → ⁴2He + ¹0n.
Données de masses : m(²H) = 2.01355 u, m(³H) = 3.01550 u, m(⁴He) = 4.00150 u, m(n) = 1.00866 u; 1 u = 931.5 MeV/c².
1. Calculer la perte de masse Δm lors de cette réaction en unités de masse atomique (u).
2. Calculer l'énergie libérée Elibérée par cette réaction en MeV puis en Joules.
3. Justifier la très grande stabilité du noyau d'Hélium-4 à l'aide de son énergie de liaison par nucléon.`,
    baremeBreakdown: [
      { step: '1. Δm = [m(²H) + m(³H)] - [m(⁴He) + m(n)] = 0.01889 u', points: '+3.0 pts' },
      { step: '2. E_libérée = Δm × 931.5 = 17.6 MeV', points: '+3.0 pts' },
      { step: '2. Conversion en Joules: 17.6 × 10⁶ × 1.6×10⁻¹⁹ = 2.82×10⁻¹² J', points: '+2.0 pts' },
      { step: '3. El/A = 28.3 MeV / 4 = 7.07 MeV/nucléon (Noyau particulièrement stable sur la courbe d\'Aston)', points: '+4.0 pts' }
    ],
    stepByStepSolution: [
      '1. Le bilan de masse s\'écrit : Δm = m_initiale - m_finale = (2.01355 + 3.01550) - (4.00150 + 1.00866) = 5.02905 - 5.01016 = 0.01889 u.',
      '2. D\'après l\'équivalence masse-énergie d\'Einstein E = Δm·c² : Elibérée = 0.01889 u × 931.5 MeV/u = 17.596 MeV ≈ 17.6 MeV. En Joules : E = 17.6 × 10⁶ eV × 1.602×10⁻¹⁹ J/eV = 2.82×10⁻¹² Joules pour une seule réaction.',
      '3. L\'énergie de liaison totale du noyau ⁴He vaut El(⁴He) = [2 mp + 2 mn - m(⁴He)]·c² ≈ 28.3 MeV. L\'énergie de liaison par nucléon est donc El/A = 28.3 / 4 = 7.07 MeV/nucléon. Cette valeur élevée explique le pic de stabilité remarquable du noyau ⁴He sur la courbe d\'Aston.'
    ],
    officialExamWarning: 'ملاحظة التصحيح الرسمية: يجب الاحتفاظ بـ 5 أرقام معنوية بعد الفاصلة في كتل النوى لتفادي أخطاء التقريب.',
    calculatorAllowed: true
  },
  {
    id: 'stored_sess_16',
    sessionNumber: 16,
    subject: 'Mathématiques / رياضيات',
    subjectIcon: '📐',
    title: 'Théorème de Thalès & Trigonométrie (Brevet EB9)',
    topic: 'Triangles semblables, rapports métriques et cercle circonscrit (MEHE Brevet)',
    teacherName: 'Mme. Nayla Rizk',
    teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    date: '14 تشرين الأول • 4:30 PM',
    duration: '45 دقيقة',
    pointsTotal: '10 / 10 pts',
    exercisePrompt: `Soit un triangle ABC rectangle en A tel que AB = 6 cm et AC = 8 cm.
1. Calculer la longueur BC et en déduire le rayon R du cercle circonscrit au triangle ABC.
2. Soit M un point du segment [AB] tel que AM = 2 cm. La parallèle à (BC) passant par M coupe [AC] en N.
   Calculer les longueurs AN et MN en justifiant soigneusement par le théorème de Thalès.
3. Calculer cos(ABC) et déterminer la mesure de l'angle ABC arrondie au degré près.`,
    baremeBreakdown: [
      { step: '1. Pythagore: BC² = AB² + AC² = 36 + 64 = 100 ⇒ BC = 10 cm. R = BC/2 = 5 cm', points: '+3.0 pts' },
      { step: '2. Droites (MN) // (BC): AM/AB = AN/AC = MN/BC', points: '+2.0 pts' },
      { step: '2. AN = (2/6) × 8 = 8/3 ≈ 2.67 cm; MN = (2/6) × 10 = 10/3 ≈ 3.33 cm', points: '+2.5 pts' },
      { step: '3. cos(ABC) = AB / BC = 6 / 10 = 0.60 ⇒ angle ABC ≈ 53°', points: '+2.5 pts' }
    ],
    stepByStepSolution: [
      '1. Le triangle ABC étant rectangle en A, d\'après le théorème de Pythagore : BC² = AB² + AC² = 6² + 8² = 36 + 64 = 100, donc BC = √100 = 10 cm. L\'hypoténuse [BC] est le diamètre du cercle circonscrit au triangle rectangle, donc son rayon est R = BC / 2 = 5 cm.',
      '2. Dans le triangle ABC, le point M est sur [AB], le point N est sur [AC], et la droite (MN) est parallèle à (BC). D\'après le théorème de Thalès : AM / AB = AN / AC = MN / BC. On remplace par les valeurs connues : 2 / 6 = AN / 8 = MN / 10. D\'où AN = (2 × 8) / 6 = 16 / 6 = 8/3 cm ≈ 2.67 cm, et MN = (2 × 10) / 6 = 20 / 6 = 10/3 cm ≈ 3.33 cm.',
      '3. Dans le triangle ABC rectangle en A : cos(ABC) = Côté adjacent / Hypoténuse = AB / BC = 6 / 10 = 0.6. À l\'aide de la calculatrice : angle ABC = arccos(0.6) ≈ 53.13° soit 53° arrondi au degré près.'
    ],
    officialExamWarning: 'تنبيه البريفيه الرسمي: ذكر الشروط (النقاط على التوالي واستقامة الخطوط والتوازي) إلزامي قبل تطبيق مبرهنة طاليس.',
    calculatorAllowed: true
  },
  {
    id: 'stored_sess_17',
    sessionNumber: 17,
    subject: 'Mathématiques / رياضيات',
    subjectIcon: '🔢',
    title: 'Suites Numériques & Raisonnement par Récurrence',
    topic: 'Suite arithmético-géométrique un+1 = 0.5 un + 3, convergence et limite',
    teacherName: 'Prof. Jad Khoury',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    date: '13 تشرين الأول • 4:00 PM',
    duration: '45 دقيقة',
    pointsTotal: '12 / 12 pts',
    exercisePrompt: `Soit la suite (un) définie par u0 = 1 et un+1 = 0.5 un + 3 pour tout n ∈ ℕ.
1. Démontrer par récurrence que pour tout entier naturel n, un < 6.
2. Démontrer que la suite (un) est strictement croissante. En déduire qu'elle converge.
3. Soit la suite auxiliaire (vn) définie par vn = un - 6.
   a) Démontrer que (vn) est une suite géométrique dont on précisera la raison q et le premier terme v0.
   b) Exprimer vn puis un en fonction de n. Déterminer la limite de la suite (un).`,
    baremeBreakdown: [
      { step: '1. Initialisation: u0 = 1 < 6 (vrai). Hérédité: un < 6 ⇒ 0.5 un + 3 < 3 + 3 = 6. Conclusion', points: '+3.0 pts' },
      { step: '2. un+1 - un = -0.5 un + 3 = 0.5(6 - un) > 0 car un < 6 ⇒ strictement croissante', points: '+2.5 pts' },
      { step: '2. Théorème de convergence: suite croissante et majorée par 6 converge vers une limite L ≤ 6', points: '+1.5 pts' },
      { step: '3.a vn+1 = un+1 - 6 = 0.5 un + 3 - 6 = 0.5(un - 6) = 0.5 vn ⇒ q = 0.5 et v0 = 1 - 6 = -5', points: '+2.5 pts' },
      { step: '3.b vn = -5·(0.5)^n ⇒ un = 6 - 5·(0.5)^n. Comme |0.5| < 1, lim (0.5)^n = 0 ⇒ lim un = 6', points: '+2.5 pts' }
    ],
    stepByStepSolution: [
      '1. Démonstration par récurrence : Pour n = 0, u0 = 1 < 6, la propriété est vraie au rang initial. Supposons qu\'au rang k ≥ 0, uk < 6 (hypothèse de récurrence). Montrons que uk+1 < 6 : uk < 6 ⇒ 0.5 uk < 3 ⇒ 0.5 uk + 3 < 6 ⇒ uk+1 < 6. La propriété est héréditaire. Par principe de récurrence, pour tout n ∈ ℕ, un < 6.',
      '2. Sens de variation : Pour tout n, un+1 - un = 0.5 un + 3 - un = -0.5 un + 3 = 0.5 (6 - un). Or d\'après la question 1, un < 6 donc 6 - un > 0. D\'où un+1 - un > 0 : la suite (un) est strictement croissante. Étant croissante et majorée par 6, le théorème de convergence monotone garantit qu\'elle converge vers une limite réelle L.',
      '3.a vn+1 = un+1 - 6 = 0.5 un + 3 - 6 = 0.5 un - 3 = 0.5 (un - 6) = 0.5 vn. (vn) est une suite géométrique de raison q = 0.5 et de premier terme v0 = u0 - 6 = 1 - 6 = -5.',
      '3.b vn = v0 · q^n = -5 · (0.5)^n. Comme vn = un - 6, on a un = vn + 6 = 6 - 5·(0.5)^n. Puisque -1 < 0.5 < 1, lim_{n→+∞} (0.5)^n = 0, donc lim_{n→+∞} un = 6.'
    ],
    officialExamWarning: 'ملاحظة التصحيح: يجب كتابة الخطوات الثلاث للاستقراء الرياضي (Initialisation, Hérédité, Conclusion) بالتفصيل.',
    calculatorAllowed: true
  },
  {
    id: 'stored_sess_18',
    sessionNumber: 18,
    subject: 'Français / لغة فرنسية',
    subjectIcon: '✍️',
    title: 'Commentaire Composé: Baudelaire & Les Fleurs du Mal',
    topic: 'Analyse stylistique, synesthésie et tiraillement entre Spleen et Idéal',
    teacherName: 'Mme. Rania Chehab',
    teacherAvatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
    date: '12 تشرين الأول • 5:15 PM',
    duration: '45 دقيقة',
    pointsTotal: '20 / 20 pts',
    exercisePrompt: `Extrait du poème « Correspondances » de Charles Baudelaire :
1. Rédiger l'introduction complète selon la méthode officielle MEHE (Accroche, présentation de l'auteur et de l'œuvre, situation du texte, problématique et annonce du plan).
2. Développer l'Axe 1 : La Nature comme temple vivant et mystique (personnification, champ lexical du sacré et de la forêt).
3. Développer l'Axe 2 : L'alchimie poétique des synesthésies (transposition des sensations olfactives, sonores et tactiles).
4. Rédiger la conclusion et l'ouverture littéraire.`,
    baremeBreakdown: [
      { step: '1. Introduction méthodique: Situer Les Fleurs du Mal (1857), modernité poétique, annonce binaire', points: '+4.0 pts' },
      { step: '2. Axe 1: Métaphore filée du temple, piliers vivants, symbolisme baudelairien et verticalité', points: '+5.0 pts' },
      { step: '3. Axe 2: Définition et analyse des synesthésies ("parfums frais comme des chairs d\'enfants")', points: '+5.0 pts' },
      { step: '4. Conclusion: Bilan synthétique et ouverture vers Rimbaud ("Voyelles") ou Mallarmé', points: '+6.0 pts' }
    ],
    stepByStepSolution: [
      '1. Introduction : Paru en 1857 au sein des Fleurs du Mal, le sonnet "Correspondances" constitue le manifeste du symbolisme baudelairien. Face au Spleen du monde moderne, le poète se fait déchiffreur des arcanes de l\'univers. Problématique : Comment Baudelaire renouvelle-t-il la relation entre l\'homme et la Nature à travers la poétique des correspondances ? Plan : I. Une Nature sacralisée et mystérieuse ; II. L\'expérience synesthésique et l\'élévation spirituelle.',
      '2. Axe 1 : La Nature est assimilée à un "temple" architectural ("de vivants piliers"). L\'oxymore et la personnification confèrent aux arbres la parole ("laissent parfois sortir de confuses paroles"). L\'homme s\'y déplace comme dans une forêt de symboles qui le scrutent avec des "regards familiers", inversant le rapport traditionnel d\'observation.',
      '3. Axe 2 : La deuxième strophe développe les correspondances horizontales ou synesthésies ("Les parfums, les couleurs et les sons se répondent"). Le poète associe les sensations : l\'odorat ("parfums frais"), le toucher ("chairs d\'enfants") et l\'ouïe ("doux comme les hautbois"). Cette fusion sensorielle préfigure l\'élévation vers l\'Infini ("l\'expansion des choses infinies").',
      '4. Conclusion : "Correspondances" fait du poète un voyant capable de déceler l\'unité secrète du monde visible et invisible, ouvrant la voie à Arthur Rimbaud et aux avant-gardes poétiques du XXe siècle.'
    ],
    officialExamWarning: 'تنبيه MEHE في اللغة الفرنسية: يجب تجنب التلخيص السردي (Paraphrase) والتركيز حصراً على الشواهد والتحليل الأسلوبي (Procédés de style).',
    calculatorAllowed: false
  },
  {
    id: 'stored_sess_19',
    sessionNumber: 19,
    subject: 'English / لغة إنكليزية',
    subjectIcon: '📝',
    title: 'Official Argumentative Synthesis & Essay Writing',
    topic: 'Thesis statement, counter-arguments, rebuttal and conclusion (Lebanese Official Exam)',
    teacherName: 'Mme. Carole Nader',
    teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    date: '11 تشرين الأول • 4:45 PM',
    duration: '45 دقيقة',
    pointsTotal: '20 / 20 pts',
    exercisePrompt: `Write a well-organized argumentative essay (250–300 words) on the following topic:
"Some educators argue that Artificial Intelligence should be banned from secondary school classrooms to prevent academic dishonesty, while others believe it is an indispensable tool for personalized learning."
1. Provide a clear introduction ending with a strong, parallel thesis statement.
2. Develop Body Paragraph 1 supporting the pedagogical benefits of AI in tutoring and differentiation.
3. Develop Body Paragraph 2 addressing the counter-argument (plagiarism/dependency) and refuting it effectively.
4. Conclude with a synthesized summary and a forward-looking recommendation.`,
    baremeBreakdown: [
      { step: '1. Introduction: Hook, background context, and clear arguable Thesis Statement', points: '+4.0 pts' },
      { step: '2. Body 1: Topic sentence, concrete evidence, explanation of adaptive learning & 24/7 feedback', points: '+5.0 pts' },
      { step: '3. Body 2: Fair presentation of counter-argument + decisive rebuttal and ethical solutions', points: '+5.0 pts' },
      { step: '4. Conclusion: Paraphrased thesis, synthesis of main points, and thoughtful final insight', points: '+6.0 pts' }
    ],
    stepByStepSolution: [
      '1. Introduction : The rapid emergence of Artificial Intelligence has ignited intense debate across educational institutions worldwide. While critics fear that AI undermines student integrity, banning this technology is an impractical retreat. AI must be actively integrated into secondary curricula because it offers personalized pedagogical support and prepares learners for an automated workforce, provided that robust ethical guidelines are enforced.',
      '2. Body Paragraph 1 : Primarily, AI technologies act as tailored personal tutors that adapt to individual learning paces. Unlike traditional overcrowded classrooms, generative models and diagnostic systems can instantaneously break down complex mathematical proofs or provide real-time grammatical feedback. For students struggling with self-paced revision, this on-demand scaffolding demystifies intimidating concepts and builds foundational confidence.',
      '3. Body Paragraph 2 : Opponents often contend that unrestricted AI access fosters cognitive laziness and widespread plagiarism on standardized assignments. Although this concern is valid, outright prohibition historically fails, as demonstrated during the advent of electronic calculators and the internet. Instead of banning the tool, educators should pivot towards authentic process-oriented assessments and teach algorithmic literacy, transforming AI from a cheating crutch into an analytical sparring partner.',
      '4. Conclusion : In conclusion, rather than fearing technological disruption, secondary schools should embrace AI as an equalizer of educational opportunity. By balancing innovative instructional tools with ethical accountability, modern education can empower students to thrive in an AI-driven global economy.'
    ],
    officialExamWarning: 'MEHE English Rubric Note: Deductions occur if transitions (Cohesive devices) are absent or if the rebuttal fails to directly dismantle the counter-argument.',
    calculatorAllowed: false
  },
  {
    id: 'stored_sess_20',
    sessionNumber: 20,
    subject: 'Sociologie / علم اجتماع',
    subjectIcon: '👥',
    title: 'La Mobilité Sociale: Structurelle vs Nette',
    topic: 'Tables de mobilité MEHE, destinée et origine sociale, fluidité sociale',
    teacherName: 'Prof. Walid Boustani',
    teacherAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    date: '10 تشرين الأول • 6:30 PM',
    duration: '45 دقيقة',
    pointsTotal: '20 / 20 pts',
    exercisePrompt: `À partir d'une table de mobilité sociale observée entre pères et fils (CS d'origine vs CS de destinée) :
1. Définir avec précision la mobilité intergénérationnelle, la mobilité intragénérationnelle et l'immobilité sociale (reproduction sociale).
2. Expliquer comment distinguer la mobilité structurelle (liée aux mutations économiques) de la mobilité nette (liée à la fluidité sociale).
3. Analyser le rôle de l'école républicaine démocratique comme ascenseur social et ses limites selon la sociologie de Pierre Bourdieu.`,
    baremeBreakdown: [
      { step: '1. Définitions rigoureuses: mobilité intergénérationnelle (entre générations) et intragénérationnelle (au cours de la carrière)', points: '+4.0 pts' },
      { step: '2. Table de mobilité: Mobilité totale = Mobilité structurelle (changement de structure des emplois) + Mobilité nette', points: '+5.0 pts' },
      { step: '3. Analyse démocratisation scolaire: égalité des chances méritocratique vs théorie de la reproduction culturelle de Bourdieu', points: '+6.0 pts' },
      { step: '4. Synthèse et vocabulaire spécifique: capital culturel, habitus, violence symbolique et diplômes', points: '+5.0 pts' }
    ],
    stepByStepSolution: [
      '1. Définitions fondamentales : La mobilité sociale intergénérationnelle mesure le changement de position sociale d\'un individu par rapport à celle de ses parents. La mobilité intragénérationnelle (ou professionnelle) désigne l\'ascension ou le déclassement d\'un individu au cours de sa propre trajectoire active. L\'immobilité sociale caractérise le fait qu\'un individu demeure dans la même catégorie socioprofessionnelle que son géniteur (hérédité sociale).',
      '2. Mobilité structurelle vs nette : La mobilité totale observée dans les tables comprend une part contrainte par la transformation de la structure socioéconomique (tertiarisation, recul des agriculteurs et ouvriers, augmentation des cadres) : c\'est la mobilité structurelle. La mobilité nette (ou pure) mesure la circulation relative des individus indépendamment de l\'évolution des emplois disponibles, reflétant le véritable degré de fluidité et d\'ouverture démocratique de la société.',
      '3. L\'école et la reproduction : Si l\'école républicaine proclame l\'égalité formelle des chances par la méritocratie, les travaux sociologiques de Pierre Bourdieu démontrent qu\'elle tend à légitimer la reproduction des inégalités. Les enfants des classes favorisées héritent d\'un capital culturel et d\'un habitus linguistique valorisés par l\'institution scolaire, ce qui convertit un privilège social d\'origine en mérite académique individuel.'
    ],
    officialExamWarning: 'ملاحظة الامتحان الرسمي: التمييز الدقيق بين جدول الأصل (Table d\'origine) وجدول المصير (Table de destinée) مطلوب لنيل العلامة التامة.',
    calculatorAllowed: false
  }
];
