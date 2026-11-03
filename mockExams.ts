import { OfficialExam, AcademicTrack, ExamSubject } from '../types';

export const OFFICIAL_EXAMS: OfficialExam[] = [
  {
    id: "bac-sg-math-2026-s1",
    year: 2026,
    session: 1,
    track: "BAC_SG",
    subject: "math",
    totalPoints: 60,
    durationMinutes: 240,
    title: {
      en: "Lebanese Official Baccalaureate - General Sciences (GS) - Mathematics",
      fr: "Baccalauréat Libanais Officiel - Sciences Générales (SG) - Mathématiques",
      ar: "شهادة الثانوية العامة اللبنانية - فرع العلوم العامة (SG) - مادة الرياضيات"
    },
    overview: {
      en: "Session 1 (June 2026) - Comprehensive official exam covering Complex Numbers, Space Geometry with planes and spheres, Differential Calculus, and Probability Distributions.",
      fr: "1ère Session (Juin 2026) - Épreuve officielle complète comprenant Nombres Complexes, Géométrie dans l'Espace, Étude de Fonction et Probabilités.",
      ar: "الدورة الأولى (حزيران ٢٠٢٦) - مسابقة رسمية كاملة تشمل الأعداد العقدية، الهندسة الفضائية، دراسة الدوال والتفاضل والتكامل، والاحتمالات."
    },
    officialInstructions: {
      en: "Calculators are permitted as per MEHE regulations. The use of non-programmable scientific calculators without graphic screens is allowed. All work must be clearly justified.",
      fr: "L'usage de calculatrices scientifiques non programmables est autorisé conformément aux directives du MEHE. Justifier soigneusement tous les résultats.",
      ar: "يسمح باستعمال الآلة الحاسبة العلمية غير القابلة للبرمجة ودون رسم بياني. يرجى تبرير جميع الخطوات الحسابية بدقة."
    },
    questions: [
      {
        id: "q1-complex",
        number: "Exercice 1",
        title: "Complex Numbers & Geometrical Transformations",
        points: 12,
        prompt: {
          en: "In the complex plane referred to a direct orthonormal system (O; u, v), consider points A and B of affixes zA = 1 + i√3 and zB = 2. Let f be the transformation that associates to each point M(z) ≠ B the point M'(z') such that z' = (z - 1 - i√3) / (z - 2).",
          fr: "Dans le plan complexe rapporté à un repère orthonormé direct (O; u, v), on donne les points A et B d'affixes zA = 1 + i√3 et zB = 2. Soit f la transformation qui à tout point M(z) distinct de B associe le point M'(z') tel que z' = (z - 1 - i√3) / (z - 2).",
          ar: "في المستوي العقدي المنسوب إلى معلم متعامد متجانس مباشر (O; u, v)، نعتبر النقطتين A و B ذات اللواحق zA = 1 + i√3 و zB = 2. ليكن f التحويل الذي يربط بكل نقطة M(z) تختلف عن B النقطة M'(z') بحيث z' = (z - 1 - i√3) / (z - 2)."
        },
        subQuestions: [
          {
            label: "1.a",
            text: {
              en: "Write zA in exponential form and deduce the nature of triangle OAB.",
              fr: "Écrire zA sous forme exponentielle et en déduire la nature du triangle OAB.",
              ar: "اكتب zA بالشكل الأسي واستنتج طبيعة المثلث OAB."
            },
            points: 3,
            bareme: "zA = 2 e^(iπ/3) (1.5 pts); OA = |zA| = 2 = OB = |zB| and (OA, OB) = -π/3 => OAB is equilateral (1.5 pts)"
          },
          {
            label: "1.b",
            text: {
              en: "Interpret geometrically the modulus and argument of z'.",
              fr: "Interpréter géométriquement le module et un argument de z'.",
              ar: "فسّر هندسياً طويلة وعمدة العدد العقدي z'."
            },
            points: 4,
            bareme: "|z'| = AM / BM (2 pts); arg(z') = (BM, AM) [2π] (2 pts)"
          },
          {
            label: "1.c",
            text: {
              en: "Determine the set (E) of points M such that z' is purely imaginary.",
              fr: "Déterminer l'ensemble (E) des points M tels que z' soit imaginaire pur non nul.",
              ar: "عيّن المجموعة (E) للنقاط M بحيث يكون z' تخيلياً صرفاً غير معدوم."
            },
            points: 5,
            bareme: "z' is purely imaginary <=> arg(z') = π/2 + kπ <=> (BM, AM) = π/2 [π] (2.5 pts); Circle of diameter [AB] deprived of point B (2.5 pts)"
          }
        ],
        baremeItems: [
          { step: "Writing zA = 2 e^(iπ/3)", points: 1.5, notes: "Modulus calculation |zA| = √(1 + 3) = 2" },
          { step: "Deduction of equilateral triangle OAB", points: 1.5, notes: "OA = OB = AB = 2" },
          { step: "Geometrical interpretation of |z'| = AM/BM", points: 2.0 },
          { step: "Geometrical interpretation of arg(z')", points: 2.0 },
          { step: "Condition for purely imaginary (BM ⟂ AM)", points: 2.5 },
          { step: "Conclusion: Circle of diameter [AB] excluding B", points: 2.5, notes: "Crucial MEHE deduction penalty if B is not excluded" }
        ],
        solution: {
          en: "Step 1: |zA| = √(1² + (√3)²) = 2. cos(θ) = 1/2, sin(θ) = √3/2, so θ = π/3. Hence zA = 2·e^(iπ/3).\nStep 2: Since |zA| = 2 and zB = 2, OA = OB = 2. Distance AB = |2 - (1 + i√3)| = |1 - i√3| = 2. Because OA = OB = AB = 2, triangle OAB is equilateral.\nStep 3: |z'| = |z - zA| / |z - zB| = AM / BM. arg(z') = arg(z - zA) - arg(z - zB) = (BM, AM) [2π].\nStep 4: z' is purely imaginary <=> arg(z') = π/2 [π] <=> angle (BM, AM) = π/2 [π]. Thus M lies on the circle with diameter [AB], excluding point B where z ≠ 2.",
          fr: "Étape 1: |zA| = √(1 + 3) = 2. On a cos θ = 1/2 et sin θ = √3/2, donc θ = π/3 rad. Donc zA = 2 e^(iπ/3).\nÉtape 2: OA = |zA| = 2 et OB = |zB| = 2. AB = |zB - zA| = |2 - 1 - i√3| = |1 - i√3| = 2. Les 3 côtés sont égaux, donc OAB est un triangle équilatéral.\nÉtape 3: |z'| = AM / BM et arg(z') = (BM, AM) [2π].\nÉtape 4: z' imaginaire pur <=> (BM, AM) = π/2 (mod π) <=> triangle AMB rectangle en M. L'ensemble cherché (E) est donc le cercle de diamètre [AB] privé du point B.",
          ar: "الخطوة ١: حساب الطويلة |zA| = √(1 + 3) = 2. الزاوية θ = π/3، بالتالي zA = 2 e^(iπ/3).\nالخطوة ٢: بما أن OA = 2 و OB = 2 و AB = 2، فالمثلث OAB متساوي الأضلاع.\nالخطوة ٣: التفسير الهندسي: |z'| = AM / BM و arg(z') = (BM, AM) [2π].\nالخطوة ٤: z' تخيلي صرف يعني الزاوية بين الشعاعين تساوي π/2، أي أن المثلث AMB قائم في M. إذن مجموعة النقاط (E) هي الدائرة التي قطرها [AB] مستثنى منها النقطة B."
        }
      },
      {
        id: "q2-function",
        number: "Exercice 2",
        title: "Exponential Functions & Differential Equations",
        points: 20,
        prompt: {
          en: "Part A: Consider the function g defined on ℝ by g(x) = (1 - x)e^x + 1. Part B: Let f be the function defined on ℝ by f(x) = (2 - x)e^x + x - 1. Denote by (C) its representative curve in an orthonormal system (O; i, j).",
          fr: "Partie A: Soit la fonction g définie sur ℝ par g(x) = (1 - x)e^x + 1. Partie B: Soit f la fonction définie sur ℝ par f(x) = (2 - x)e^x + x - 1. On note (C) sa courbe représentative dans un repère orthonormé (O; i, j).",
          ar: "الجزء أ: لتكن الدالة g المعرفة على ℝ بالعلاقة g(x) = (1 - x)e^x + 1. الجزء ب: لتكن f الدالة المعرفة على ℝ بالعلاقة f(x) = (2 - x)e^x + x - 1، و(C) منحناها البياني في معلم متعامد متجانس (O; i, j)."
        },
        subQuestions: [
          {
            label: "2.a",
            text: {
              en: "Calculate the limits of g at -∞ and +∞, study the variations of g, and deduce the sign of g(x).",
              fr: "Calculer les limites de g en -∞ et +∞, dresser son tableau de variations et en déduire le signe de g(x).",
              ar: "احسب نهايات g عند -∞ و +∞، وادرس تغيراتها واستنتج إشارة g(x)."
            },
            points: 6,
            bareme: "lim at -∞ = 1 (1 pt); lim at +∞ = -∞ (1 pt); g'(x) = -x e^x (2 pts); Sign table: g > 0 on ]-∞, α[ where α ≈ 1.28 (2 pts)"
          },
          {
            label: "2.b",
            text: {
              en: "Show that the line (d): y = x - 1 is an asymptote to (C) at -∞ and determine their relative position.",
              fr: "Démontrer que la droite (d): y = x - 1 est une asymptote oblique à (C) en -∞ et préciser la position relative.",
              ar: "أثبت أن المستقيم (d): y = x - 1 هو مقارب مائل لـ (C) بجوار -∞ وحدد موقعهما النسبي."
            },
            points: 7,
            bareme: "lim [f(x) - (x-1)] = lim (2-x)e^x = 0 as x -> -∞ (4 pts); f(x) - y = (2-x)e^x > 0 for x < 2 so (C) above (d) on ]-∞, 2[ (3 pts)"
          },
          {
            label: "2.c",
            text: {
              en: "Calculate f'(x) and express it in terms of g(x). Draw the curve (C) and line (d).",
              fr: "Calculer f'(x) et l'exprimer en fonction de g(x). Tracer (C) et la droite (d).",
              ar: "احسب f'(x) وعبّر عنها بدلالة g(x). ارسم المنحنى (C) والمستقيم (d)."
            },
            points: 7,
            bareme: "f'(x) = -e^x + (2-x)e^x + 1 = (1-x)e^x + 1 = g(x) (3 pts); Curve accuracy, asymptotes, tangent (4 pts)"
          }
        ],
        baremeItems: [
          { step: "Limits of g at -∞ and +∞", points: 2.0 },
          { step: "Derivative g'(x) = -x e^x and maximum at x=0", points: 2.0 },
          { step: "Sign of g(x) using intermediate value theorem", points: 2.0 },
          { step: "Asymptote proof at -∞", points: 4.0 },
          { step: "Relative position analysis", points: 3.0 },
          { step: "f'(x) = g(x) connection", points: 3.0 },
          { step: "Neat sketch of (C) with inflections and asymptote", points: 4.0 }
        ],
        solution: {
          en: "Part A: As x -> -∞, xe^x -> 0, so lim g(x) = 1. As x -> +∞, (1-x) -> -∞ while e^x -> +∞, so lim g(x) = -∞.\ng'(x) = -e^x + (1-x)e^x = -xe^x. For x < 0, g'(x) > 0; for x > 0, g'(x) < 0. Maximum is g(0) = 2 > 0.\nPart B: f(x) - (x - 1) = (2 - x)e^x. Since lim_{x -> -∞} (2e^x - xe^x) = 0 - 0 = 0, (d): y = x - 1 is an asymptote at -∞.\nSince e^x > 0 for all x, the sign of f(x) - y depends on (2 - x). For x < 2, (C) is strictly above (d).",
          fr: "Partie A: lim_{x -> -∞} g(x) = 1 (par croissances comparées). lim_{x -> +∞} g(x) = -∞.\ng'(x) = -x e^x. g croît sur ]-∞, 0] et décroît sur [0, +∞[. Maximum g(0) = 2.\nPartie B: f(x) - (x-1) = (2-x)e^x. En -∞, cette différence tend vers 0, donc (d) est asymptote oblique.\nPour x < 2, 2-x > 0 donc (C) est au-dessus de (d). f'(x) = -e^x + (2-x)e^x + 1 = (1-x)e^x + 1 = g(x).",
          ar: "الجزء أ: نهاية g عند -∞ تساوي 1 ونهايتها عند +∞ تساوي -∞. المشتق g'(x) = -x e^x، القيمة العظمى هي g(0) = 2.\nالجزء ب: الفرق f(x) - (x - 1) = (2 - x)e^x يؤول إلى 0 عند -∞، وبالتالي (d) مقارب مائل. المنحنى (C) يقع فوق المستقيم (d) لكل x < 2 لأن 2-x > 0."
        }
      }
    ]
  },
  {
    id: "brevet-math-2025-s1",
    year: 2025,
    session: 1,
    track: "BREVET",
    subject: "math",
    totalPoints: 20,
    durationMinutes: 120,
    title: {
      en: "Lebanese Official Brevet (Grade 9 / EB9) - Mathematics",
      fr: "Brevet Officiel Libanais (EB9 / 3ème) - Mathématiques",
      ar: "الشهادة المتوسطة اللبنانية (البريفيه - الصف التاسع) - مادة الرياضيات"
    },
    overview: {
      en: "Session 1 (June 2025) - Official standard Brevet exam containing Numerical Calculations, System of Linear Equations with applied economic word problems, and Circle Geometry.",
      fr: "1ère Session (Juin 2025) - Épreuve officielle de Brevet : calculs avec radicaux, système d'équations avec problème concret et géométrie du cercle.",
      ar: "الدورة الأولى (حزيران ٢٠٢٥) - مسابقة البريفيه الرسمية: الحساب العددي والجذور، جملة معادلتين خطيتين مع مسألة حياتية، وهندسة الدائرة والمماسات."
    },
    officialInstructions: {
      en: "All 4 exercises are mandatory. Answers must be detailed with geometric theorems explicitly quoted.",
      fr: "Les 4 exercices sont obligatoires. Les justifications géométriques doivent mentionner explicitement les théorèmes utilisés.",
      ar: "الإجابة عن جميع التمارين الأربعة إجبارية. يجب ذكر النظريات الهندسية المعتمدة بالاسم."
    },
    questions: [
      {
        id: "brv-q1-algebra",
        number: "Exercice 1",
        title: "Radicals and Factorization",
        points: 5,
        prompt: {
          en: "Given A = √(108) - 2√(75) + √(300) and P(x) = (2x - 3)² - (x + 1)².",
          fr: "On donne A = √(108) - 2√(75) + √(300) et P(x) = (2x - 3)² - (x + 1)².",
          ar: "يعطى المقدار A = √(108) - 2√(75) + √(300) وكثير الحدود P(x) = (2x - 3)² - (x + 1)²."
        },
        subQuestions: [
          {
            label: "1.a",
            text: {
              en: "Write A in the form a√3 where a is an integer.",
              fr: "Écrire A sous la forme a√3 où a est un entier relatif.",
              ar: "اكتب المقدار A على الشكل a√3 حيث a عدد صحيح."
            },
            points: 2.5,
            bareme: "√(108) = 6√3 (0.75 pt); 2√(75) = 10√3 (0.75 pt); √(300) = 10√3 (0.5 pt); A = 6√3 - 10√3 + 10√3 = 6√3 (0.5 pt)"
          },
          {
            label: "1.b",
            text: {
              en: "Factorize P(x) into a product of two linear factors and solve P(x) = 0.",
              fr: "Factoriser P(x) en produit de deux facteurs du premier degré et résoudre P(x) = 0.",
              ar: "حلل P(x) إلى جداء عاملين من الدرجة الأولى وحل المعادلة P(x) = 0."
            },
            points: 2.5,
            bareme: "Identity a² - b² = (a-b)(a+b) (1 pt); P(x) = (3x - 2)(x - 4) (0.75 pt); Solutions x = 2/3 or x = 4 (0.75 pt)"
          }
        ],
        baremeItems: [
          { step: "Simplification of radicals to √3 base", points: 2.0 },
          { step: "Final exact value A = 6√3", points: 0.5 },
          { step: "Using remarkable identity a² - b²", points: 1.0 },
          { step: "Factorization: (3x - 2)(x - 4)", points: 0.75 },
          { step: "Null product property: x = 2/3 or x = 4", points: 0.75 }
        ],
        solution: {
          en: "1.a) A = √(36 × 3) - 2√(25 × 3) + √(100 × 3) = 6√3 - 2(5√3) + 10√3 = 6√3 - 10√3 + 10√3 = 6√3.\n1.b) Using a² - b² = (a - b)(a + b) with a = 2x - 3 and b = x + 1:\nP(x) = [(2x - 3) - (x + 1)][(2x - 3) + (x + 1)] = [2x - 3 - x - 1][2x - 3 + x + 1] = (x - 4)(3x - 2).\nP(x) = 0 <=> x - 4 = 0 or 3x - 2 = 0 => x = 4 or x = 2/3.",
          fr: "1.a) A = 6√3 - 10√3 + 10√3 = 6√3.\n1.b) En appliquant l'identité remarquable a² - b² = (a - b)(a + b) :\nP(x) = [(2x - 3) - (x + 1)][(2x - 3) + (x + 1)] = (x - 4)(3x - 2).\nP(x) = 0 équivaut à x = 4 ou x = 2/3.",
          ar: "١.أ) A = 6√3 - 10√3 + 10√3 = 6√3.\n١.ب) باستعمال المتطابقة الهامة a² - b² = (a - b)(a + b):\nP(x) = (x - 4)(3x - 2).\nP(x) = 0 تعني أن x = 4 أو x = 2/3."
        }
      },
      {
        id: "brv-q2-geometry",
        number: "Exercice 2",
        title: "Circle Geometry, Tangents & Inscribed Angles",
        points: 7,
        prompt: {
          en: "Let (C) be a circle of center O and diameter [AB] with AB = 8 cm. Let M be a point on (C) such that BM = 4 cm. The tangent to (C) at M intersects the line (AB) at point T.",
          fr: "Soit (C) un cercle de centre O et de diamètre [AB] tel que AB = 8 cm. Soit M un point de (C) tel que BM = 4 cm. La tangente en M à (C) coupe la droite (AB) au point T.",
          ar: "لتكن (C) دائرة مركزها O وقطرها [AB] بحيث AB = 8 cm. لتكن M نقطة من الدائرة بحيث BM = 4 cm. المماس للدائرة (C) في M يقطع المستقيم (AB) في النقطة T."
        },
        subQuestions: [
          {
            label: "2.a",
            text: {
              en: "Prove that triangle AMB is a right-angled triangle at M and calculate AM.",
              fr: "Démontrer que AMB est un triangle rectangle en M et calculer la valeur exacte de AM.",
              ar: "أثبت أن المثلث AMB قائم الزاوية في M واحسب الطول AM."
            },
            points: 3,
            bareme: "M is on circle with diameter [AB] => AMB right at M (1.5 pts); Pythagorean theorem: AM² = AB² - BM² = 64 - 16 = 48 => AM = 4√3 cm (1.5 pts)"
          },
          {
            label: "2.b",
            text: {
              en: "Prove that triangle OBM is equilateral, then deduce angle MOT.",
              fr: "Démontrer que le triangle OBM est équilatéral, puis déduire la mesure de l'angle MOT.",
              ar: "أثبت أن المثلث OBM متساوي الأضلاع، ثم استنتج قياس الزاوية MOT."
            },
            points: 4,
            bareme: "OB = OM = radius = 4 cm and BM = 4 cm => OBM equilateral (2 pts); Angle BOM = 60° => Angle MOT = 60° (2 pts)"
          }
        ],
        baremeItems: [
          { step: "Theorem of triangle inscribed in a semicircle", points: 1.5 },
          { step: "Pythagorean calculation AM = 4√3 cm", points: 1.5 },
          { step: "Equal sides OB = OM = BM = 4 cm", points: 2.0 },
          { step: "Deduction of angle MOT = 60°", points: 2.0 }
        ],
        solution: {
          en: "2.a) M is a point on circle (C) of diameter [AB], so triangle AMB is inscribed in a semicircle, which means angle AMB = 90°. In right triangle AMB, by Pythagorean theorem: AM² + BM² = AB² => AM² = 8² - 4² = 64 - 16 = 48 => AM = √48 = 4√3 cm.\n2.b) Radius R = AB/2 = 4 cm. Since O is the center, OB = OM = 4 cm. Since BM = 4 cm, all 3 sides are equal (OB = OM = BM = 4 cm). Thus triangle OBM is equilateral. Angle BOM = 60°. Points A, O, B, T are collinear, so angle MOT = 60°.",
          fr: "2.a) Le triangle AMB est inscrit dans le cercle (C) de diamètre [AB], donc AMB est rectangle en M. D'après le théorème de Pythagore : AM² = AB² - BM² = 64 - 16 = 48 d'où AM = 4√3 cm.\n2.b) OB = OM = 4 cm (rayons du cercle) et BM = 4 cm. Le triangle OBM a ses 3 côtés égaux à 4 cm, il est donc équilatéral. Par suite l'angle BOM = 60°, d'où MOT = 60°.",
          ar: "٢.أ) النقطة M تقع على الدائرة التي قطرها [AB]، فالمثلث AMB مرسوم في نصف دائرة فهو قائم في M. بتطبيق نظرية فيثاغورس: AM² = 64 - 16 = 48 أي أن AM = 4√3 cm.\n٢.ب) أنصاف الأقطار OB = OM = 4 cm والمعطى أن BM = 4 cm، فالمثلث OBM متساوي الأضلاع وجميع زواياه 60°. بالتالي الزاوية MOT = 60°."
        }
      }
    ]
  },
  {
    id: "bac-sv-biology-2024-s1",
    year: 2024,
    session: 1,
    track: "BAC_SV",
    subject: "biology",
    totalPoints: 20,
    durationMinutes: 180,
    title: {
      en: "Lebanese Official Baccalaureate - Life Sciences (LS/SV) - Biology",
      fr: "Baccalauréat Libanais Officiel - Sciences de la Vie (SV) - Biologie",
      ar: "شهادة الثانوية العامة اللبنانية - فرع علوم الحياة (SV) - مادة علوم الحياة (البيولوجيا)"
    },
    overview: {
      en: "Session 1 (June 2024) - Neurophysiology of the reflex arc and neuromuscular transmission, plus Mendelian Genetics and genetic counseling for rare inherited conditions in Lebanon.",
      fr: "1ère Session (Juin 2024) - Neurophysiologie de l'arc réflexe et transmission neuromusculaire, génétique mendélienne et conseil génétique.",
      ar: "الدورة الأولى (حزيران ٢٠٢٤) - الفيزيولوجيا العصبية والسيالة العصبية والنقل المشبكي، والوراثة المندلية وشجرة النسب الوراثية للأمراض الشائعة في لبنان."
    },
    officialInstructions: {
      en: "Use standard scientific reasoning verbs (Compare, Analyze, Deduce, Explain). Answers lacking proper data extraction will receive partial marks under MEHE guidelines.",
      fr: "Respecter les verbes d'action méthodologiques officiels (Analyser, Déduire, Interpréter). Extraire précisément les valeurs numériques des graphes.",
      ar: "يرجى الالتزام بالأفعال الإجرائية الرسمية (قارن، حلل، استنتج، فسر) واستخراج القيم الدقيقة من الرسوم البيانية."
    },
    questions: [
      {
        id: "sv-q1-neuro",
        number: "Exercice 1",
        title: "Synaptic Transmission & Curare Mechanism",
        points: 10,
        prompt: {
          en: "To investigate the mode of action of curare (a muscle relaxant) at the neuromuscular junction, an isolated nerve-muscle preparation is stimulated under two conditions: without curare (Condition 1) and with curare added to the synaptic cleft (Condition 2). Intracellular microelectrodes record the postsynaptic potential.",
          fr: "Afin de déterminer le mode d'action du curare au niveau de la jonction neuromusculaire, on applique une stimulation efficace sur le motoneurone dans deux conditions : sans curare (Condition 1) et en présence de curare dans la fente synaptique (Condition 2).",
          ar: "لدراسة آلية عمل مادة الكورار (Curare) على مستوى المشبك العصبي العضلي، يتم تنبيه العصب المحرك تنبيهاً فعالاً في حالتين: بدون كورار (الحالة ١) وبوجود الكورار في الشق المشبكي (الحالة ٢)."
        },
        subQuestions: [
          {
            label: "1.a",
            text: {
              en: "Analyze the recordings obtained and deduce the effect of curare on muscle contraction.",
              fr: "Analyser les enregistrements obtenus et déduire l'effet du curare sur la contraction musculaire.",
              ar: "حلل التسجيلات المحصلة واستنتج أثر الكورار على التقلص العضلي."
            },
            points: 5,
            bareme: "Proper comparative analysis with numerical values: amplitude 40 mV with action potential vs only 5 mV subthreshold with curare (3 pts); Deduction: curare blocks transmission and prevents muscle contraction (2 pts)"
          },
          {
            label: "1.b",
            text: {
              en: "Formulate a hypothesis regarding the molecular target of curare on the post-synaptic membrane.",
              fr: "Formuler une hypothèse sur la cible moléculaire du curare au niveau de la membrane post-synaptique.",
              ar: "صغ فرضية تفسر الهدف الجزيئي لمادة الكورار على مستوى الغشاء بعد المشبكي."
            },
            points: 5,
            bareme: "Hypothesis stating competitive inhibition: Curare binds to nicotinic acetylcholine receptors without opening Na+ channels (5 pts)"
          }
        ],
        baremeItems: [
          { step: "Precise data extraction (mV values and action potentials)", points: 2.0 },
          { step: "Logical deduction conforming to MEHE taxonomy", points: 2.0 },
          { step: "Structural formulation of molecular hypothesis", points: 3.0 },
          { step: "Reference to Acetylcholine receptors and Na+ channels", points: 3.0 }
        ],
        solution: {
          en: "In Condition 1, effective stimulation triggers an End-Plate Potential (EPP) of 45 mV exceeding the threshold (-50 mV), firing a propagating muscle action potential followed by muscle twitch. In Condition 2, in the presence of curare, the recorded EPP reaches only 6 mV, well below threshold, producing no action potential and no contraction.\nDeduction: Curare inhibits neuromuscular transmission by suppressing the post-synaptic depolarization.\nHypothesis: Curare competitively binds to nicotinic acetylcholine (ACh) receptors on the motor end-plate, preventing ACh binding and keeping ligand-gated Na+ channels closed.",
          fr: "Analyse : En absence de curare, la stimulation produit un potentiel de plaque motrice de 45 mV dépassant le seuil et générant un PA musculaire suivi de contraction. En présence de curare, l'amplitude ne dépasse pas 6 mV, restant infraliminaire sans PA musculaire.\nDéduction : Le curare bloque la transmission synaptique neuromusculaire.\nHypothèse : Le curare se fixe de manière compétitive sur les récepteurs post-synaptiques de l'acétylcholine (ACh), bloquant l'ouverture des canaux Na+ chimiodépendants.",
          ar: "التحليل: في غياب الكورار يؤدي التنبيه إلى توليد كمون لوحة محركة يتجاوز العتبة ويولد كمون عمل عضلي متبوعاً بالتقلص. بوجود الكورار، لا يتعدى الكمون 6 mV دون الوصول للعتبة وبدون تقلص.\nالاستنتاج: الكورار يثبط النقل المشبكي العصبي العضلي.\nالفرضية: يرتبط الكورار تنافسياً بمستقبلات الأسيتيل كولين على الغشاء بعد المشبكي مانعاً فتح قنوات الصوديوم الكيميائية."
        }
      }
    ]
  },
  {
    id: "bac-se-eco-2023-s1",
    year: 2023,
    session: 1,
    track: "BAC_SE",
    subject: "economics",
    totalPoints: 20,
    durationMinutes: 180,
    title: {
      en: "Lebanese Official Baccalaureate - Socio-Economics (SE/ES) - Economics",
      fr: "Baccalauréat Libanais Officiel - Sociologie & Économie (SE) - Économie",
      ar: "شهادة الثانوية العامة اللبنانية - فرع الاجتماع والاقتصاد (SE) - مادة الاقتصاد"
    },
    overview: {
      en: "Session 1 (June 2023) - Macroeconomic stabilization policies in developing countries, inflation, exchange rate volatility, balance of payments, and economic growth mechanisms.",
      fr: "1ère Session (Juin 2023) - Politiques macroéconomiques de relance et de stabilisation, inflation, taux de change, balance des paiements et croissance économique.",
      ar: "الدورة الأولى (حزيران ٢٠٢٣) - السياسات الاقتصادية والمالية، التضخم المالي، تقلبات أسعار الصرف، ميزان المدفوعات، وديناميكيات النمو الاقتصادي في لبنان."
    },
    officialInstructions: {
      en: "Answer all parts clearly. Syntheses must include proper introduction (hook, definition, problem), 2 balanced parts, and conclusion with an open perspective.",
      fr: "Respecter la structure rigoureuse de la synthèse économique : introduction (accroche, définition, problématique, plan), développement en deux parties équilibrées, conclusion avec ouverture.",
      ar: "الالتزام بهيكلية الموضوع الاقتصادي: مقدمة متكاملة (تمهيد، تعريف، إشكالية، إعلان خطة)، عرض من قسمين متوازنين، وخاتمة مع فتح آفاق."
    },
    questions: [
      {
        id: "se-q1-macro",
        number: "Partie I",
        title: "Monetary & Fiscal Policies under Inflationary Pressure",
        points: 8,
        prompt: {
          en: "Document 1 shows the evolution of inflation rates and purchasing power. Explain how an expansionary monetary policy based on lowering discount rates may inadvertently accelerate inflation when national productive capacity is rigid.",
          fr: "Le Document 1 illustre l'évolution du taux d'inflation et du pouvoir d'achat. Expliquer comment une politique monétaire de relance par baisse du taux d'escompte peut accélérer l'inflation lorsque l'appareil productif est rigide.",
          ar: "يوضح المستند ١ تطور معدل التضخم والقدرة الشرائية. اشرح كيف يمكن لسياسة نقدية توسعية عبر خفض سعر الفائدة أو سعر الخصم أن تزيد من التضخم المالي عندما يكون الجهاز الإنتاجي غير مرن."
        },
        subQuestions: [
          {
            label: "1.a",
            text: {
              en: "Trace the chain of causation from the decrease in interest rates to the demand-pull inflation.",
              fr: "Établir la chaîne causale reliant la baisse des taux d'intérêt à l'inflation par la demande.",
              ar: "حدد السلسلة السببية التي تربط بين خفض سعر الفائدة والتضخم الناتج عن زيادة الطلب."
            },
            points: 4,
            bareme: "Interest rate drops -> credits increase -> liquidity rises -> consumption/investment increases -> demand exceeds rigid supply -> prices rise / inflation (4 pts)"
          },
          {
            label: "1.b",
            text: {
              en: "Propose an alternative structural economic policy to increase domestic supply without stimulating inflation.",
              fr: "Proposer une politique structurelle permettant d'accroître l'offre nationale sans alimenter l'inflation.",
              ar: "اقترح سياسة اقتصادية بنيوية لزيادة العرض المحلي دون التسبب في تغذية التضخم."
            },
            points: 4,
            bareme: "Supply-side policy: subsidies to local agriculture/industry, reducing production costs, tax exemptions for equipment investments (4 pts)"
          }
        ],
        baremeItems: [
          { step: "Full logical economic chain of cause and effect", points: 4.0 },
          { step: "Supply-side policy justification according to MEHE syllabus", points: 4.0 }
        ],
        solution: {
          en: "1.a) Chain of causation: Central bank lowers discount rate -> commercial banks lower lending rates -> volume of bank credits to households and firms expands -> money supply (liquidity) increases -> aggregate demand for consumer and capital goods rises -> because productive capacity is rigid, supply cannot expand immediately -> aggregate demand exceeds aggregate supply -> demand-pull inflation.\n1.b) Supply-side policy: Structural policy to stimulate investment in local productive sectors (e.g., subsidized technology, industrial park infrastructure, vocational training). This shifts aggregate supply curve to the right, raising output while lowering unit costs.",
          fr: "1.a) Chaîne causale : Baisse du taux d'escompte -> baisse des taux d'intérêt bancaires -> augmentation de la distribution des crédits -> hausse de la masse monétaire en circulation -> hausse de la demande globale (consommation et investissement) -> rigidité de l'offre nationale -> la demande dépasse l'offre -> hausse généralisée des prix (inflation par la demande).\n1.b) Politique de l'offre : encouragements fiscaux aux investissements productifs locaux, subventions à l'innovation agricole et industrielle, réduction des coûts de l'énergie pour accroître la compétitivité.",
          ar: "١.أ) السلسلة السببية: خفض سعر الخصم -> انخفاض الفوائد المدينة لدى المصارف -> زيادة القروض المصرفية -> زيادة السيولة النقدية المتداولة -> ارتفاع الطلب الإجمالي على السلع والخدمات -> عدم مرونة الجهاز الإنتاجي المحلي -> تفوق الطلب على العرض -> ارتفاع الأسعار (تضخم ناشئ عن الطلب).\n١.ب) سياسة تحفيز العرض: إعفاءات ضريبية للاستثمارات الإنتاجية، دعم كلفة الطاقة للقطاعين الصناعي والزراعي، مما يرفع حجم الإنتاج المحلي ويخفض كلفة الإنتاج."
        }
      }
    ]
  },
  {
    id: "bac-sg-phys-2022-s1",
    year: 2022,
    session: 1,
    track: "BAC_SG",
    subject: "physics",
    totalPoints: 60,
    durationMinutes: 240,
    title: {
      en: "Lebanese Official Baccalaureate - General Sciences (GS) - Physics",
      fr: "Baccalauréat Libanais Officiel - Sciences Générales (SG) - Physique",
      ar: "شهادة الثانوية العامة اللبنانية - فرع العلوم العامة (SG) - مادة الفيزياء"
    },
    overview: {
      en: "Session 1 (June 2022) - Mechanics of damped and forced harmonic oscillators, Electromagnetic Induction and RLC resonant circuits.",
      fr: "1ère Session (Juin 2022) - Mécanique des oscillateurs harmoniques et amortis, Induction électromagnétique et circuits RLC résonants.",
      ar: "الدورة الأولى (حزيران ٢٠٢٢) - الميكانيك والتذبذبات التوافقية المخمدة، التحريض الكهرومغناطيسي ودارات RLC في حالة الطنين."
    },
    officialInstructions: {
      en: "Answers must follow official MEHE vector notations and SI units. Scientific calculators allowed.",
      fr: "Respecter scrupuleusement les notations vectorielles et les unités du Système International (SI).",
      ar: "يرجى الالتزام بالترميز الشعاعي الرسمي ووحدات النظام الدولي للقياس (SI)."
    },
    questions: [
      {
        id: "phys-q1-rlc",
        number: "Exercice 1",
        title: "RLC Series Circuit & Resonance Phenomenon",
        points: 20,
        prompt: {
          en: "A series circuit consists of a generator delivering an alternating sinusoidal voltage u(t) = Um cos(ωt), a resistor of resistance R = 80 Ω, an inductor of inductance L and resistance r, and a capacitor of capacitance C = 2 µF. At resonance frequency fo = 250 Hz, the current amplitude is maximum at Im = 0.1 A with Um = 10 V.",
          fr: "Un circuit série comprend un GBF délivrant une tension sinusoïdale u(t) = Um cos(ωt), un conducteur ohmique de résistance R = 80 Ω, une bobine d'inductance L et de résistance r, et un condensateur de capacité C = 2 µF. À la résonance d'intensité fo = 250 Hz, l'amplitude est maximale Im = 0,1 A pour Um = 10 V.",
          ar: "تتألف دارة تسلسلية من مولد تيار متناوب جيبي يغذي بتوتر u(t) = Um cos(ωt)، ومقاوم أومي R = 80 Ω، ووشيعة ذاتيتها L ومقاومتها الداخلية r، ومكثف سعته C = 2 µF. عند تواتر الطنين fo = 250 Hz، تصبح شدة التيار عظمى Im = 0.1 A من أجل توتر Um = 10 V."
        },
        subQuestions: [
          {
            label: "1.a",
            text: {
              en: "Calculate the internal resistance r of the coil.",
              fr: "Calculer la résistance interne r de la bobine.",
              ar: "احسب المقاومة الداخلية r للوشيعة."
            },
            points: 6,
            bareme: "At resonance Z = R + r (3 pts); R + r = Um / Im = 10 / 0.1 = 100 Ω => r = 100 - 80 = 20 Ω (3 pts)"
          },
          {
            label: "1.b",
            text: {
              en: "Calculate the inductance L of the coil.",
              fr: "Calculer l'inductance L de la bobine.",
              ar: "احسب الذاتية L للوشيعة."
            },
            points: 7,
            bareme: "Resonance condition L C ωo² = 1 (3 pts); ωo = 2π fo = 500π rad/s (2 pts); L = 1 / (C ωo²) = 1 / (2x10^-6 x (500π)²) ≈ 0.203 H (2 pts)"
          },
          {
            label: "1.c",
            text: {
              en: "Calculate the quality factor Q of the circuit and explain its physical significance.",
              fr: "Calculer le facteur de qualité Q du circuit et préciser sa signification physique.",
              ar: "احسب معامل الجودة Q للدارة واشرح مدلوله الفيزيائي."
            },
            points: 7,
            bareme: "Q = (L ωo) / (R + r) = (0.203 x 500π) / 100 ≈ 3.19 (4 pts); Represents sharpness of resonance / energy selectivity (3 pts)"
          }
        ],
        baremeItems: [
          { step: "Resonance impedance Z = R + r", points: 3.0 },
          { step: "Coil internal resistance r = 20 Ω", points: 3.0 },
          { step: "Formula for resonance frequency LCωo² = 1", points: 3.0 },
          { step: "Numerical calculation of L ≈ 0.203 H", points: 4.0 },
          { step: "Calculation of Quality factor Q ≈ 3.2", points: 4.0 },
          { step: "Physical interpretation of resonance sharpness", points: 3.0 }
        ],
        solution: {
          en: "1.a) At current resonance, inductive reactance cancels capacitive reactance (Lω = 1/Cω). The total impedance is purely resistive: Z = R + r. Since Z = Um / Im = 10 / 0.1 = 100 Ω, we get 80 + r = 100 => r = 20 Ω.\n1.b) At resonance: L·C·(2π·fo)² = 1. Therefore, L = 1 / [C·4π²·fo²] = 1 / [2×10⁻⁶ × 4π² × (250)²] = 1 / [2×10⁻⁶ × 4π² × 62500] = 1 / [4.935] ≈ 0.203 Henry.\n1.c) The quality factor is Q = L·ωo / (R + r) = (0.203 × 2π × 250) / 100 ≈ 3.19. Physically, Q measures the sharpness of resonance and the circuit's selectivity.",
          fr: "1.a) À la résonance d'intensité, l'impédance est minimale et égale à la résistance totale : Z = R + r. Um = (R + r)·Im => R + r = 10 / 0,1 = 100 Ω. Donc r = 100 - 80 = 20 Ω.\n1.b) Condition de résonance : L·C·ω₀² = 1 d'où L = 1 / (C·(2πf₀)²). Application numérique : L = 1 / (2×10⁻⁶ × 4π² × 250²) ≈ 0,203 H.\n1.c) Facteur de qualité : Q = L·ω₀ / (R + r) = (0,203 × 500π) / 100 ≈ 3,19. Il caractérise l'acuité de la résonance et la sélectivité du circuit.",
          ar: "١.أ) عند طنين الشدة، تنعدم المفاعلة الكلية وتصبح المعاوقة مساوية لمجموع المقاومات Z = R + r = Um / Im = 10 / 0.1 = 100 Ω، ومنه r = 100 - 80 = 20 Ω.\n١.ب) شرط الطنين هو L·C·ω₀² = 1، ومنه L = 1 / (C · (2π·f₀)²) ≈ 0.203 H.\n١.ج) معامل الجودة Q = (L·ω₀) / (R + r) ≈ 3.19، وهو يعبر عن حدة الطنين وقدرة الدارة على الانتقاء والفرز الترددي."
        }
      }
    ]
  }
];

// Helper to generate the complete 26-year historical archive directory (2000 to 2026)
export interface ArchiveYearSummary {
  year: number;
  availableTracks: AcademicTrack[];
  sessionsCount: number;
  subjectsCount: number;
  isCurriculumShiftYear?: boolean; // e.g. 2000 (New curriculum launch) or 2020-2021 (modified Covid sessions)
  historicalContext: {
    en: string;
    fr: string;
    ar: string;
  };
}

export const ARCHIVE_YEARS: ArchiveYearSummary[] = Array.from({ length: 27 }, (_, i) => {
  const year = 2026 - i;
  let context = {
    en: `Standard Lebanese official exam session covering Brevet and all 4 Baccalaureate branches.`,
    fr: `Session officielle libanaise couvrant le Brevet et les 4 séries du Baccalauréat.`,
    ar: `دورة الامتحانات الرسمية اللبنانية الشاملة لشهادة البريفيه وفروع البكالوريا الأربعة.`
  };

  if (year === 2026) {
    context = {
      en: `Current Academic Year - Full official exams, preview sample papers, and comprehensive Barème rubrics.`,
      fr: `Année Scolaire en cours - Sujets complets, modèles types et barèmes ministériels.`,
      ar: `العام الدراسي الحالي - المسابقات الرسمية الكاملة والنماذج التدريبية وسلالم التصحيح.`
    };
  } else if (year === 2020) {
    context = {
      en: `Exceptional Covid-19 modified program with adjusted thematic weights by MEHE.`,
      fr: `Programme allégé Covid-19 avec ajustement des chapitres par le CRDP/MEHE.`,
      ar: `البرنامج الاستثنائي المخفف بسبب جائحة كورونا مع تعديل أوزان المحاور من المركز التربوي.`
    };
  } else if (year === 2006) {
    context = {
      en: `Special August session with focused core competencies.`,
      fr: `Session spéciale d'août avec ciblage des compétences fondamentales.`,
      ar: `دورة آب الخاصة المتميزة بالتركيز على الكفايات الأساسية للمنهج.`
    };
  } else if (year === 2000) {
    context = {
      en: `Inaugural implementation year of the modern Lebanese Reformed Curriculum (Decree 10227).`,
      fr: `Année inaugurale du nouveau curriculum libanais réformé (Décret 10227).`,
      ar: `سنة التدشين الأولى للمنهج اللبناني الحديث المطور (المرسوم ١٠٢٢٧).`
    };
  }

  return {
    year,
    availableTracks: ['BAC_SG', 'BAC_SV', 'BAC_SE', 'BAC_LH', 'BREVET'],
    sessionsCount: 2,
    subjectsCount: 13,
    isCurriculumShiftYear: year === 2000 || year === 2020 || year === 2026,
    historicalContext: context
  };
});
