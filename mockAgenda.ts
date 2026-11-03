import { AgendaItem } from '../types';

export const INITIAL_AGENDA_ITEMS: AgendaItem[] = [
  {
    id: "agenda-1",
    date: "2026-11-02",
    dayLabel: "Monday",
    subject: "math",
    track: "BAC_SG",
    title: "Complex Numbers & Geometrical Transformations",
    details: "Solve Exercice 14 page 84 (Mathématiques Terminale SG - Collection CRDP). Express z' in algebraic form and determine the locus of point M.",
    dueDate: "Tomorrow at 8:00 AM",
    estimatedMinutes: 45,
    status: "needs_tutor",
    linkedOfficialExamTopic: {
      topic: "Complex Numbers Transformations & Circles",
      suggestedExamYear: 2026,
      questionNumber: "Exercice 1"
    },
    teacherNotes: "Remember: Check the forbidden points where the denominator vanishes (z ≠ 2)!"
  },
  {
    id: "agenda-2",
    date: "2026-11-02",
    dayLabel: "Monday",
    subject: "physics",
    track: "BAC_SG",
    title: "RLC Resonance & Oscillating Circuits Problem Set",
    details: "Problems 3 and 7 on page 112 (Physique Série Scientifique). Calculate the quality factor Q and plot the current resonance curve.",
    dueDate: "Wednesday",
    estimatedMinutes: 50,
    status: "in_progress",
    linkedOfficialExamTopic: {
      topic: "RLC Series Circuit at Resonance",
      suggestedExamYear: 2022,
      questionNumber: "Exercice 1"
    }
  },
  {
    id: "agenda-3",
    date: "2026-11-03",
    dayLabel: "Tuesday",
    subject: "biology",
    track: "BAC_SV",
    title: "Synaptic Transmission & Neurotoxins",
    details: "Analyze the graph of post-synaptic potentials in presence of botulinum toxin and curare. Write a comparative synthesis.",
    dueDate: "Thursday",
    estimatedMinutes: 35,
    status: "todo",
    linkedOfficialExamTopic: {
      topic: "Curare mechanism at neuromuscular junction",
      suggestedExamYear: 2024,
      questionNumber: "Exercice 1"
    }
  },
  {
    id: "agenda-4",
    date: "2026-11-03",
    dayLabel: "Tuesday",
    subject: "arabic",
    track: "BAC_SG",
    title: "تحليل نص أدبي: المقالة الأدبية اللبنانية الحديثة",
    details: "إعراب الكلمات المحددة في الصفحة ٦٢، واستخراج الصور البيانية (استعارة وكناية) وشرح أبعادها الدلالية.",
    dueDate: "Thursday",
    estimatedMinutes: 40,
    status: "done"
  },
  {
    id: "agenda-5",
    date: "2026-11-04",
    dayLabel: "Wednesday",
    subject: "economics",
    track: "BAC_SE",
    title: "Synthesis: Inflation & Currency Depreciation in Lebanon",
    details: "Write a 2-page economic synthesis explaining the transmission mechanism between exchange rate devaluation and domestic prices.",
    dueDate: "Friday",
    estimatedMinutes: 60,
    status: "needs_tutor",
    linkedOfficialExamTopic: {
      topic: "Macroeconomic stabilization & supply-side policy",
      suggestedExamYear: 2023,
      questionNumber: "Partie I"
    }
  }
];
