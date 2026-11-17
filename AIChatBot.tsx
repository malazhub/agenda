import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { generateAIContent, getSchoolPublicContext } from '../services/cloudflareApi';
import type { SchoolPublicContext } from '../services/cloudflareApi';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot
} from 'lucide-react';

interface AIChatBotProps {
  currentLang: Language;
  schoolId: string;
  schoolName?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

/**
 * Canonical product knowledge is included with every AI request. Keep this
 * independent from transient chat state so the assistant never relies on a
 * previous chat transcript to know how Agenda works.
 */
const AGENDA_ASSISTANT_KNOWLEDGE = [
  'Agenda is a school-management and learning platform with separate Student, Educator, and Director experiences.',
  'A separate Agenda school setup costs USD 150 once. This purchases/creates the school identity and name plus its own independent platform space; the purchaser becomes that school\'s Director. This is not a student lesson fee.',
  'The default student rate is USD 125 per student per session. The Director may set a different rate according to the school\'s circumstances and decision. Users should confirm the current rate with their own Director.',
  'A school can have an unlimited number of student and educator accounts. A typical class is planned around an average of about five students; this is a planning guideline, not a universal hard cap.',
  'Each student belongs to an assigned educator/classroom. During registration the student selects an available educator/session. The Director can later change a student\'s educator or session assignment from Director Dashboard > Accounts.',
  'Students must register and sign in with their own school-specific link and account to use their assigned classroom and learning resources. Live access requires the account to be activated, marked paid, not expired, and assigned to the exact educator session.',
  'Educators sign in with their Educator account, open their assigned classroom, and start or stop its live broadcast. Each educator has their own classroom and their own saved-lesson area.',
  'Educators can save and update their own lectures and learning materials in their lesson slots for students to view later. Supported uploads include PDF, JPG, PNG, WebP, MP4, WebM, and MOV, up to 50 MB per file.',
  'The live classroom is a real-time video-conference room for an educator and the students assigned to that educator. Participants can use camera and microphone controls and communicate through classroom chat and supported attachments.',
  'The Director can manage accounts in their own school: review students and educators, activate or deactivate accounts, mark payment status, renew account validity, change student/educator usernames, reset their passwords, reassign students to another educator/session, and manage classroom sessions.',
  'The Director can open and monitor any classroom belonging to their own school from Director Dashboard > Sessions / Manage Sessions, including joining the room as an administrator. This does not grant access to another school\'s rooms.',
  'The Director can create and manage sessions, assign educators to classrooms, and monitor live sessions. Every educator has a separate classroom assignment.',
  'The Director can update the school name and their own username/password in Director Dashboard profile settings. Student and educator usernames and passwords can be managed from the Accounts list.',
  'Student path: open the school-specific link, register as Student, choose an available educator/session, wait for Director activation and payment confirmation, sign in, then open the assigned live class or Learning Resources.',
  'Educator path: register as Educator using the school link, wait for Director activation and classroom assignment, sign in, open the assigned classroom, start the live session, and save lectures in the educator\'s own learning-resource slots.',
  'Director path: choose Director Login, sign in, open Director Dashboard, use Accounts to manage students and educators, and use Sessions / Manage Sessions to create, assign, and monitor classrooms.',
  'Payments are not processed or verified by this AI chat. Where the registration screen offers Suyool, users should follow its payment instructions. The Director confirms payment status in the Director Dashboard. Never ask users to share card details or passwords.',
  'For account, activation, payment-status, or class-assignment help, users should contact their own school Director through the school\'s provided contact channel. Never invent an email address or phone number.',
  'Each Director has an isolated school space. Student and educator accounts, assignments, classrooms, and saved lesson materials belong to that school and must not be disclosed to another school.',
  'The application supports Arabic, English, French, Spanish, and Italian. All user-visible answers must follow the currently selected app language.',
  'For questions outside Agenda operations, use the AI model for educational, general-knowledge, reasoning, and study questions. Understand the original question directly and reply in the selected app language.'
].join('\\n');

export const AIChatBot: React.FC<AIChatBotProps> = ({ currentLang, schoolId, schoolName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousLanguageRef = useRef<Language>(currentLang);
  const activeLanguageRef = useRef<Language>(currentLang);
  activeLanguageRef.current = currentLang;
  const languageNames: Record<Language, string> = {
    ar: 'Arabic',
    en: 'English',
    fr: 'French',
    es: 'Spanish',
    it: 'Italian',
  };
  const chatLocale: Record<Language, string> = {
    ar: 'ar',
    en: 'en',
    fr: 'fr',
    es: 'es',
    it: 'it',
  };
  const assistantBadge = currentLang === 'ar' ? 'مساعد' : currentLang === 'en' ? 'AI' : 'IA';
  const formatChatTime = () => new Date().toLocaleTimeString(chatLocale[currentLang], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const chatLabels = {
    close: currentLang === 'ar' ? 'إغلاق المحادثة' : currentLang === 'fr' ? 'Fermer la conversation' : currentLang === 'es' ? 'Cerrar conversación' : currentLang === 'it' ? 'Chiudi la conversazione' : 'Close chat',
    send: currentLang === 'ar' ? 'إرسال السؤال' : currentLang === 'fr' ? 'Envoyer la question' : currentLang === 'es' ? 'Enviar pregunta' : currentLang === 'it' ? 'Invia domanda' : 'Send question',
    input: currentLang === 'ar' ? 'اكتب سؤالك' : currentLang === 'fr' ? 'Saisissez votre question' : currentLang === 'es' ? 'Escribe tu pregunta' : currentLang === 'it' ? 'Scrivi la tua domanda' : 'Enter your question',
    thinking: currentLang === 'ar' ? 'المساعد يكتب...' : currentLang === 'fr' ? 'L’assistant rédige...' : currentLang === 'es' ? 'El asistente está escribiendo...' : currentLang === 'it' ? 'L’assistente sta scrivendo...' : 'Assistant is typing...',
    responseLanguage: currentLang === 'ar' ? 'ستكون الإجابات باللغة المحددة' : currentLang === 'fr' ? 'Les réponses suivent la langue sélectionnée' : currentLang === 'es' ? 'Las respuestas estarán en el idioma seleccionado' : currentLang === 'it' ? 'Le risposte saranno nella lingua selezionata' : 'Replies follow your selected language',
  };

  // Keep the conversation consistent when the visitor changes the app language.
  useEffect(() => {
    if (previousLanguageRef.current === currentLang) return;
    previousLanguageRef.current = currentLang;
    setMessages([]);
    setInputText('');
  }, [currentLang]);

  // Blank chat: Starts with no initial pre-canned text as requested
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [schoolContext, setSchoolContext] = useState<SchoolPublicContext | null>(null);

  useEffect(() => {
    let active = true;
    if (!schoolId) {
      setSchoolContext(null);
      return () => { active = false; };
    }
    getSchoolPublicContext(schoolId)
      .then((context) => { if (active) setSchoolContext(context); })
      .catch((error) => {
        console.warn('Unable to load school-specific AI context.', error);
        if (active) setSchoolContext(null);
      });
    return () => { active = false; };
  }, [schoolId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Deterministic answers use the selected school's live configuration.
  const getSavedResponse = (query: string, context = schoolContext, allowComposite = true): string | null => {
    const q = query.toLowerCase().trim();

    // Lightweight greetings should be instant and should not spend a the AI model
    // request. Detailed questions continue through the the AI model integration.
    if (/^(hi|hello|hey|how are you|how's it going|good morning|good afternoon|good evening)[!.? ]*$/.test(q)) {
      if (currentLang === 'ar') return 'مرحباً! أنا بخير، شكراً لسؤالك. كيف يمكنني مساعدتك اليوم؟';
      if (currentLang === 'fr') return 'Bonjour ! Je vais bien, merci. Comment puis-je vous aider aujourd’hui ?';
      if (currentLang === 'es') return '¡Hola! Estoy bien, gracias. ¿Cómo puedo ayudarte hoy?';
      if (currentLang === 'it') return 'Ciao! Sto bene, grazie. Come posso aiutarti oggi?';
      return 'Hello! I’m doing well, thank you. How can I help you with Agenda today?';
    }

    // Combine multiple prepared Agenda support answers when a question covers
    // more than one topic. Unmatched and educational questions continue to the AI model.
    const matchesAny = (terms: string[]) => terms.some((term) => q.includes(term));
    const quickTopics = [
      { seed: 'registration', terms: ['register', 'registration', 'sign up', 'create account', 'inscription', 'registrar', 'registrazione', 'تسجيل', 'التسجيل'] },
      { seed: 'sign in', terms: ['password', 'username', 'sign in', 'sign-in', 'login', 'log in', 'mot de passe', 'contraseña', 'nome utente', 'كلمة المرور', 'اسم المستخدم', 'دخول'] },
      { seed: 'live class', terms: ['live class', 'live classes', 'live session', 'broadcast', 'join class', 'join the class', 'classroom', 'en direct', 'en vivo', 'diretta', 'صف مباشر', 'الصف المباشر'] },
      { seed: 'saved lessons', terms: ['saved lesson', 'saved lessons', 'learning resources', 'recording', 'archive', 'lesson', 'leçon', 'lección', 'lezione', 'دروس محفوظة'] },
      { seed: 'student session rate', terms: ['student rate', 'student price', 'session rate', 'rate per session', 'per session', 'per class', 'student fee', 'tarif par séance', 'prix par séance', 'precio por sesión', 'tariffa per lezione', 'سعر الطالب', 'رسوم الطالب', 'سعر الحصة', 'لكل حصة'] },
      { seed: 'buy a school', terms: ['school price', 'price of a school', 'buy a school', 'purchase a school', 'school setup', 'school name price', 'own school', 'own copy', 'independent school', 'سعر المدرسة', 'شراء مدرسة', 'شراء اسم المدرسة', 'نسخة مستقلة'] },
      { seed: 'school privacy', terms: ['privacy', 'data isolation', 'separate schools', 'another school', 'school tenant', 'tenant isolation', 'خصوصية', 'بيانات المدارس'] },
      { seed: 'change educator', terms: ['assign student', 'student assignment', 'assigned educator', 'change educator', 'change teacher', 'reassign', 'belongs to educator', 'تعيين الطالب', 'تغيير الأستاذ', 'تغيير المعلم'] },
      { seed: 'director account management', terms: ['director dashboard', 'director manage', 'manage accounts', 'reset password', 'activate account', 'change username', 'change password', 'لوحة المدير', 'تفعيل الحساب', 'إعادة كلمة المرور'] },
      { seed: 'class size', terms: ['how many students', 'number of students', 'class size', 'students per class', 'five students', '5 students', 'unlimited students', 'unlimited educators', 'عدد الطلاب', 'خمسة طلاب', 'عدد التلاميذ'] },
      { seed: 'conference room', terms: ['conference room', 'video conference', 'video call', 'meeting room', 'classroom chat', 'camera and microphone', 'غرفة المؤتمر', 'مؤتمر فيديو', 'اجتماع مباشر'] },
      { seed: 'school navigation', terms: ['student screen', 'educator screen', 'student dashboard', 'educator dashboard', 'navigate between', 'navigation', 'how to use agenda', 'دور الطالب', 'دور المعلم', 'شاشة الطالب', 'شاشة الأستاذ', 'التنقل بين'] },
      { seed: 'payment', terms: ['payment', 'how do i pay', 'how can i pay', 'suyool', 'paiement', 'pagar', 'pagamento', 'كيف أدفع', 'طريقة الدفع', 'الدفع'] },
      { seed: 'contact', terms: ['contact', 'support', 'help desk', 'phone number', 'email address', 'whatsapp', 'contact us', 'اتصل', 'تواصل', 'رقم الهاتف', 'البريد الإلكتروني'] },
    ];
    const matchedTopics = quickTopics.filter((topic) => matchesAny(topic.terms));
    if (allowComposite && matchedTopics.length > 1) {
      const preparedAnswers = matchedTopics
        .map((topic) => getSavedResponse(topic.seed, context, false))
        .filter((answer): answer is string => Boolean(answer));
      if (preparedAnswers.length) return [...new Set(preparedAnswers)].join('\\n\\n');
    }

    const schoolPurchaseQuestion = [
      'school price', 'price of a school', 'buy a school', 'purchase a school', 'school setup',
      'school name price', 'purchase school name', 'own school', 'own copy', 'independent school',
      'prix de l’école', 'prix de l’ecole', 'acheter une école', 'acheter une ecole',
      'precio de la escuela', 'comprar una escuela', 'mi propia escuela',
      'prezzo della scuola', 'acquistare una scuola', 'la mia scuola',
      'سعر المدرسة', 'ثمن المدرسة', 'شراء مدرسة', 'شراء اسم المدرسة', 'امتلاك مدرسة', 'نسخة مستقلة'
    ].some((keyword) => q.includes(keyword));
    if (schoolPurchaseQuestion) {
      if (currentLang === 'ar') return 'تكلفة إنشاء مدرسة مستقلة على Agenda هي 150 دولاراً أمريكياً مرة واحدة. يُستخدم المبلغ لشراء/إنشاء هوية المدرسة واسمها ومساحتها المستقلة على المنصة، ويصبح المشتري مدير تلك المدرسة. هذا المبلغ منفصل عن رسوم الطالب لكل حصة. لا تتم معالجة الدفع من خلال هذه المحادثة؛ تواصل مع إدارة Agenda لإتمام الطلب.';
      if (currentLang === 'fr') return 'La création/l’achat d’un espace scolaire indépendant sur Agenda coûte 150 USD une seule fois. Ce montant sert à obtenir l’identité et le nom de l’établissement ainsi que son espace séparé sur la plateforme ; l’acheteur devient le Directeur de cette école. Ce coût est distinct du tarif par séance des élèves. Le chat ne traite pas les paiements : contactez l’administration d’Agenda pour effectuer la demande.';
      if (currentLang === 'es') return 'La compra/creación de una escuela independiente en Agenda cuesta 150 USD una sola vez. Este importe sirve para adquirir la identidad y el nombre de la escuela y su espacio separado en la plataforma; el comprador se convierte en Director de esa escuela. Este coste es distinto de la tarifa por sesión del estudiante. El chat no procesa pagos: contacta con la administración de Agenda para solicitarla.';
      if (currentLang === 'it') return 'L’acquisto/la creazione di uno spazio scolastico indipendente su Agenda costa 150 USD una sola volta. L’importo serve per ottenere l’identità e il nome della scuola e il suo spazio separato sulla piattaforma; l’acquirente diventa il Direttore di quella scuola. Questo costo è distinto dalla tariffa per lezione dello studente. La chat non gestisce pagamenti: contatta l’amministrazione di Agenda per fare richiesta.';
      return 'A separate Agenda school setup costs USD 150 as a one-time purchase. This purchases/creates the school identity and name plus its own independent space on the platform; the purchaser becomes that school’s Director. This is separate from the student rate per session. The chat does not take payments, so contact Agenda administration to arrange the school setup.';
    }

    const applicationOverviewQuestion = [
      'what is agenda', 'about agenda', 'agenda application', 'agenda app', 'about the app',
      'about this platform', 'what is this app', 'what is this platform', 'what is this application',
      'what is the platform about', 'tell me about this app', 'tell me about agenda',
      'what can i do here', 'what services do you offer', 'what does this platform do',
      'how does this work', 'application overview', 'overview', 'brief about', 'brief of the app',
      'give me a brief', 'give me an overview', 'explain agenda', 'explain this app', 'explain the platform', 'what does agenda do',
      'expliquez agenda', 'présentation de la plateforme', 'fonctionnement de la plateforme',
      'explica agenda', 'presentación de la plataforma', 'cómo funciona la plataforma',
      'spiegami agenda', 'presentazione della piattaforma', 'come funziona la piattaforma',
      'اشرح لي التطبيق', 'اشرح تطبيق أجندة', 'نبذة عن المنصة', 'كيف تعمل المنصة',
      'rename my school', 'rename school', 'change school name', 'school name',
      'own copy', 'my own copy', 'get my own copy', 'get a copy', 'buy a copy',
      'purchase a copy', 'cost of a copy', 'price of a copy', 'copy price', 'my own school',
      'présentation', 'présentez', 'présentez-moi agenda', 'donnez-moi un aperçu', 'à propos', 'comment naviguer',
      'comment renommer mon école', 'comment changer le nom de mon école', 'changer le nom de l’école', 'prix d’une copie',
      'renommer mon école', 'ma propre copie', 'ma propre copie pour', 'ma propre version', 'obtenir ma copie', 'acheter une copie',
      'presentación', 'dame una presentación', 'dame una descripción', 'explícame agenda', 'sobre agenda',
      'cómo navegar', 'como navegar', 'navegar por la plataforma', 'cómo cambiar el nombre de mi escuela',
      'cambiar el nombre de la escuela', 'mi propia copia', 'mi propia copia por', 'obtener mi copia',
      'obtener una copia', 'comprar una copia', 'precio de una copia',
      'presentazione', 'fammi una panoramica', 'spiegami agenda', 'informazioni su agenda',
      'come navigare', 'navigare nella piattaforma', 'come rinominare la mia scuola', 'cambiare il nome della scuola',
      'la mia copia', 'la mia copia per', 'ottenere la mia copia', 'ottenere una copia',
      'acquistare una copia', 'prezzo di una copia',
      'شرح التطبيق', 'نبذة عن التطبيق', 'نبذة عن', 'تطبيق agenda', 'ما هو أجندة', 'كيف أتنقل', 'كيفية التنقل',
      'تغيير اسم المدرسة', 'تغيير اسم مدرستي', 'اسم مدرستي', 'نسختي الخاصة', 'الحصول على نسختي', 'الحصول على نسخة',
      'نسخة خاصة', 'شراء نسخة', 'سعر النسخة', 'ثمن النسخة'
    ].some((keyword) => q.includes(keyword));

    if (applicationOverviewQuestion) {
      if (currentLang === 'ar') return [
        'نبذة عن Agenda:',
        'Agenda منصة تعليمية وإدارية للمدارس. تتيح للطلاب الوصول إلى الصفوف المباشرة والدروس والموارد التعليمية المحفوظة، وللمعلمين تقديم الحصص وإدارة موادهم، وللمدير إدارة المدرسة ومراقبة الصفوف.',
        'تغيير اسم المدرسة: سجّل الدخول من بطاقة «دخول المدير» في الشاشة الرئيسية، ثم افتح «لوحة المدير» ← «الحسابات». غيّر حقل «اسم المدرسة» واضغط «حفظ». سيظهر الاسم الجديد في رأس المنصة وفي هوية رابط المدرسة.',
        'التنقل: يستخدم الطلاب «غرفة البث» للدخول إلى الحصة المباشرة المخصصة لهم عندما يبدأ الأستاذ البث، ثم يفتحون «الموارد التعليمية» لاسترجاع الدروس والملفات المحفوظة. يفتح المعلم غرفته من «غرفة البث» ويبدأ الحصة. ومن «لوحة المدير» ← «الحسابات» يدير المدير الطلاب والمعلمين، ومن «إدارة الحصص» يضيف الحصص ويحدد رسوم الطالب لكل حصة ويراقب الصفوف.',
        'نسختك الخاصة: يمكن لأي مستخدم الحصول على نسخة مستقلة من Agenda مقابل 150 دولاراً أمريكياً. يصبح صاحب النسخة مديرها، ويمكنه إدارة مدرسته واسمها ومعلميها وطلابها وحصصها ودروسها المحفوظة وأسعارها الشهرية، ومراقبة الحصص وتقديمها. وتبقى مدرسته وبياناتها مستقلة عن مدارس المديرين الآخرين.',
        'لطلب نسخة مستقلة، تواصل مع إدارة Agenda؛ هذه المحادثة لا تعالج المدفوعات.'
      ].join('\n\n');
      if (currentLang === 'fr') return [
        'Présentation d’Agenda :',
        'Agenda est une plateforme éducative et de gestion scolaire. Les élèves y accèdent aux cours en direct et aux ressources enregistrées, les éducateurs donnent leurs cours et gèrent leurs supports, et le Directeur administre son établissement et surveille les classes.',
        'Renommer votre établissement : connectez-vous avec la carte « Connexion Directeur » sur l’écran principal, puis ouvrez « Tableau de bord » → « Comptes ». Modifiez le champ « Nom de l’établissement » et cliquez sur « Enregistrer ». Le nouvel intitulé apparaît dans l’en-tête de la plateforme et l’identité du lien de l’établissement.',
        'Navigation : les élèves ouvrent « Salle de diffusion » pour rejoindre leur cours attribué lorsque l’éducateur démarre la diffusion, puis « Ressources pédagogiques » pour retrouver les leçons et fichiers enregistrés. Les éducateurs ouvrent leur salle depuis « Salle de diffusion » et démarrent le cours. Dans « Tableau de bord » → « Comptes », le Directeur gère les élèves et les éducateurs ; dans « Gestion des cours », il ajoute des cours, fixe le tarif par séance de chaque classe et surveille les salles.',
        'Votre propre copie : tout utilisateur peut obtenir une copie indépendante d’Agenda au prix de 150 USD. L’acheteur en devient le Directeur et peut gérer son établissement, son nom, ses éducateurs, ses élèves, ses cours, ses leçons enregistrées et ses tarifs mensuels, ainsi que surveiller et animer les cours. Son établissement et ses données restent séparés de ceux des autres Directeurs.',
        'Pour demander votre copie indépendante, contactez l’administration d’Agenda ; cette conversation ne traite pas les paiements.'
      ].join('\n\n');
      if (currentLang === 'es') return [
        'Presentación de Agenda:',
        'Agenda es una plataforma educativa y de gestión escolar. Los estudiantes acceden a clases en directo y recursos guardados; los educadores imparten clases y gestionan sus materiales; y el Director administra su escuela y supervisa las aulas.',
        'Cambiar el nombre de la escuela: inicia sesión desde la tarjeta «Acceso del Director» en la pantalla principal y abre «Panel del Director» → «Cuentas». Cambia el campo «Nombre de la escuela» y pulsa «Guardar». El nuevo nombre aparecerá en el encabezado de la plataforma y en la identidad del enlace escolar.',
        'Navegación: los estudiantes abren «Sala de emisión» para entrar en la sesión que tienen asignada cuando el educador inicia la emisión y después seleccionan «Recursos educativos» para recuperar lecciones y archivos guardados. Los educadores abren su aula desde «Sala de emisión» e inician la clase. En «Panel del Director» → «Cuentas», el Director gestiona estudiantes y educadores; en «Gestionar sesiones» añade clases, establece la tarifa por sesión de cada curso y supervisa las aulas.',
        'Tu propia copia: cualquier usuario puede obtener una copia independiente de Agenda por 150 USD. El comprador se convierte en el Director de esa copia y puede gestionar su escuela, el nombre, los educadores, los estudiantes, las clases, las lecciones guardadas y las tarifas mensuales, además de supervisar e impartir las clases. Su escuela y sus datos permanecen separados de los de otros Directores.',
        'Para solicitar tu copia independiente, contacta con la administración de Agenda; este chat no procesa pagos.'
      ].join('\n\n');
      if (currentLang === 'it') return [
        'Presentazione di Agenda:',
        'Agenda è una piattaforma educativa e di gestione scolastica. Gli studenti accedono alle lezioni in diretta e alle risorse salvate; gli educatori tengono le lezioni e gestiscono i propri materiali; il Direttore amministra la scuola e monitora le classi.',
        'Rinominare la scuola: accedi dalla scheda «Accesso Direttore» nella schermata principale, quindi apri «Dashboard del Direttore» → «Account». Modifica il campo «Nome della scuola» e premi «Salva». Il nuovo nome apparirà nell’intestazione della piattaforma e nell’identità del link della scuola.',
        'Navigazione: gli studenti aprono «Sala trasmissione» per entrare nella lezione loro assegnata quando l’educatore avvia la diretta, poi scelgono «Risorse didattiche» per recuperare lezioni e file salvati. Gli educatori aprono la propria aula da «Sala trasmissione» e avviano la lezione. In «Dashboard del Direttore» → «Account», il Direttore gestisce studenti ed educatori; in «Gestione lezioni» aggiunge lezioni, imposta la tariffa per lezione per ogni classe e monitora le aule.',
        'La tua copia: qualsiasi utente può ottenere una copia indipendente di Agenda al prezzo di 150 USD. L’acquirente diventa il Direttore di quella copia e può gestire la propria scuola, il nome, gli educatori, gli studenti, le lezioni, i contenuti salvati e le tariffe mensili, oltre a monitorare e tenere le lezioni. La scuola e i relativi dati restano separati da quelli degli altri Direttori.',
        'Per richiedere la tua copia indipendente, contatta l’amministrazione di Agenda; questa chat non gestisce pagamenti.'
      ].join('\n\n');
      return [
        'About Agenda:',
        'Agenda is an education and school-management platform. Students can join live classes and retrieve saved learning resources; educators deliver classes and manage their materials; and the Director manages the school and monitors classrooms.',
        'Rename your school: sign in using the «Director Login» card on the main screen, then open «Director Dashboard» → «Accounts». Edit the «School name» field and select «Save». The new name appears in the platform header and in your school link identity.',
        'Navigation: students open «Broadcast Room» to join their assigned class after the educator starts broadcasting, then choose «Learning Resources» to retrieve saved lessons and files. Educators open their classroom from «Broadcast Room» and start the class. In «Director Dashboard» → «Accounts», the Director manages students and educators; in «Manage Sessions», the Director adds classes, sets each grade’s student rate per session, and monitors classrooms.',
        'Your own copy: any user can obtain an independent copy of Agenda for USD 150. The purchaser becomes the Director of that copy and can manage the school and its name, educators, students, classes, saved lessons, and student rates per session, as well as monitor and deliver classes. Their school and data remain separate from those of other Directors.',
        'To request an independent copy, contact the Agenda administration team; this chat does not process payments.'
      ].join('\n\n');
    }
    const studentSessionRateQuestion = [
      'student rate', 'student price', 'session rate', 'rate per session', 'per session', 'per lesson',
      'price per class', 'cost per class', 'how much per session', 'how much does a student pay',
      'tarif par séance', 'tarif par seance', 'prix par séance', 'prix par seance', 'prix par cours',
      'precio por sesión', 'precio por sesion', 'tarifa por sesión', 'tarifa por sesion', 'precio por clase',
      'tariffa per lezione', 'prezzo per lezione', 'costo per sessione',
      'رسوم الطالب', 'سعر الطالب', 'سعر الحصة', 'سعر كل حصة', 'لكل حصة', 'للحصة الواحدة', 'تكلفة الحصة', 'رسوم الحصة'
    ].some((keyword) => q.includes(keyword)) ||
      (['price', 'pricing', 'rate', 'cost', 'fee', 'fees', 'how much', 'tarif', 'prix', 'precio', 'prezzo', 'سعر', 'أسعار', 'بكم'].some((keyword) => q.includes(keyword)) &&
       !['school price', 'price of a school', 'buy a school', 'school setup', 'school name price', 'سعر المدرسة', 'شراء مدرسة'].some((keyword) => q.includes(keyword)));
    if (studentSessionRateQuestion) {
      if (currentLang === 'ar') return `السعر الافتراضي للطالب هو 125 دولاراً أمريكياً لكل حصة. يمكن أن يختلف السعر بحسب ظروف المدرسة وقرار مديرها؛ لذلك يُرجى تأكيد السعر النهائي وعدد الحصص مع مدير مدرستك. هذه رسوم لكل حصة وليست رسوماً شهرية.\\nالمدرسة الحالية: ${context?.schoolName || schoolName || 'Agenda'}.`;
      if (currentLang === 'fr') return `Le tarif étudiant par défaut est de 125 USD par séance. Le montant peut varier selon les conditions de l’établissement et la décision du Directeur ; veuillez donc confirmer le tarif final et le nombre de séances auprès de votre Directeur. Il s’agit d’un tarif par séance, et non d’un abonnement mensuel.\\nÉtablissement : ${context?.schoolName || schoolName || 'Agenda'}.`;
      if (currentLang === 'es') return `La tarifa predeterminada para el estudiante es de 125 USD por sesión. Puede variar según las condiciones de la escuela y la decisión del Director; confirma el precio final y el número de sesiones con el Director de tu escuela. Es una tarifa por sesión, no una cuota mensual.\\nEscuela: ${context?.schoolName || schoolName || 'Agenda'}.`;
      if (currentLang === 'it') return `La tariffa predefinita per lo studente è di 125 USD per lezione. Può variare in base alle condizioni della scuola e alla decisione del Direttore; conferma quindi il prezzo finale e il numero di lezioni con il Direttore della tua scuola. È una tariffa per lezione, non un costo mensile.\\nScuola: ${context?.schoolName || schoolName || 'Agenda'}.`;
      return `The default student rate is USD 125 per session. The Director may adjust it according to the school’s circumstances, so confirm the final rate and number of sessions with your school Director. This is charged per session.\\nSchool: ${context?.schoolName || schoolName || 'Agenda'}.`;
    }

    const registrationQuestion = ['register', 'registration', 'sign up', 'create account', 'inscrire', 'inscription', 'créer un compte', 'm’inscrire', 'registrar', 'registro', 'registración', 'inscripción', 'crear cuenta', 'registrarme', 'registrazione', 'registrarmi', 'creare account', 'crea un account', 'تسجيل', 'سجل', 'التسجيل', 'إنشاء حساب', 'انشاء حساب'].some((keyword) => q.includes(keyword));
    if (registrationQuestion) {
      if (currentLang === 'ar') return 'للتسجيل: افتح رابط المدرسة الصحيح، اختر طالباً أو معلماً، أدخل الاسم والبريد الإلكتروني واسم المستخدم وكلمة المرور، ثم اختر الصف والأستاذ/الحصة المتاحة. بعد التسجيل ينتظر الحساب موافقة المدير وتفعيله.';
      if (currentLang === 'fr') return "Pour vous inscrire : ouvrez le lien de votre établissement, choisissez Élève ou Éducateur, saisissez vos coordonnées, créez un nom d’utilisateur et un mot de passe, puis choisissez la classe et l’éducateur disponibles. Le Directeur doit ensuite activer le compte.";
      if (currentLang === 'es') return 'Para registrarte: abre el enlace de tu escuela, elige Estudiante o Educador, introduce tus datos, crea un usuario y una contraseña y selecciona el curso y educador disponibles. El Director debe activar la cuenta después del registro.';
      if (currentLang === 'it') return "Per registrarti: apri il link della tua scuola, scegli Studente o Educatore, inserisci i tuoi dati, crea nome utente e password e seleziona la classe e l'educatore disponibili. Il Direttore dovrà attivare l'account dopo la registrazione.";
      return 'To register: open your school-specific link, choose Student or Educator, enter your details, create a username and password, and select an available grade and educator/session. The Director must activate the account after registration.';
    }

    const signInQuestion = ['password', 'username', 'sign in', 'sign-in', 'login', 'log in', 'mot de passe', 'identifiant', 'connexion', 'se connecter', 'contraseña', 'usuario', 'iniciar sesión', 'iniciar sesion', 'acceso', 'accedi', 'accesso', 'nome utente', 'effettua il login', 'كلمة المرور', 'اسم المستخدم', 'دخول', 'تسجيل الدخول', 'نسيت كلمة المرور', 'نسيت كلمة السر'].some((keyword) => q.includes(keyword));
    if (signInQuestion) {
      if (currentLang === 'ar') return 'لتسجيل الدخول، استخدم اسم المستخدم وكلمة المرور اللذين أنشأتهما عند التسجيل. إذا نسيت كلمة المرور، تواصل مع مدير مدرستك ليعيد تعيينها. لا تشارك كلمة المرور مع أي شخص.';
      if (currentLang === 'fr') return "Pour vous connecter, utilisez le nom d’utilisateur et le mot de passe créés lors de l’inscription. En cas d’oubli, contactez le Directeur de votre établissement pour réinitialiser le mot de passe. Ne partagez jamais votre mot de passe.";
      if (currentLang === 'es') return 'Para iniciar sesión, utiliza el nombre de usuario y la contraseña que creaste al registrarte. Si los olvidas, contacta con el Director de tu escuela para restablecer la contraseña. No compartas tu contraseña.';
      if (currentLang === 'it') return "Per accedere, usa il nome utente e la password creati durante la registrazione. Se li dimentichi, contatta il Direttore della tua scuola per reimpostare la password. Non condividere la password.";
      return 'Sign in with the username and password you created during registration. If you forget them, contact your school Director to reset the password. Never share your password.';
    }

    const lessonQuestion = ['saved lesson', 'saved lessons', 'recording', 'lesson', 'archive', 'ressource', 'ressources', 'leçon', 'lecon', 'cours enregistré', 'cours enregistrés', 'leçons enregistrées', 'clase guardada', 'clases guardadas', 'lección', 'lecciones guardadas', 'recursos guardados', 'lezione', 'lezioni salvate', 'lezioni registrate', 'risorse salvate', 'registrazione', 'دروس محفوظة', 'الدروس المحفوظة', 'درس', 'أرشيف', 'استرجاع الدروس'].some((keyword) => q.includes(keyword));
    if (lessonQuestion) {
      if (currentLang === 'ar') return 'لاسترجاع الدروس المحفوظة، سجّل الدخول وافتح غرفة الصف ثم اختر «الموارد التعليمية». اختر الأستاذ لعرض خانات الدروس والملفات التي نشرها. يمكن للمدرس تعديل موارده الخاصة فقط.';
      if (currentLang === 'fr') return "Pour retrouver les leçons enregistrées, connectez-vous, ouvrez la salle de classe puis choisissez « Ressources pédagogiques ». Sélectionnez l’éducateur pour consulter les leçons et fichiers publiés. Chaque éducateur ne peut modifier que ses propres ressources.";
      if (currentLang === 'es') return 'Para recuperar lecciones guardadas, inicia sesión, abre el aula y selecciona «Recursos educativos». Elige al educador para ver las lecciones y archivos publicados. Cada educador solo puede modificar sus propios recursos.';
      if (currentLang === 'it') return "Per recuperare le lezioni salvate, accedi, apri l'aula e seleziona «Risorse didattiche». Scegli l'educatore per vedere lezioni e file pubblicati. Ogni educatore può modificare solo le proprie risorse.";
      return 'To retrieve saved lessons, sign in, open the classroom, and select Learning Resources. Choose the educator to view published lesson slots and files. Each educator can edit only their own resources.';
    }

    const liveQuestion = ['live', 'broadcast', 'join class', 'join the class', 'classroom', 'direct', 'en direct', 'cours en direct', 'salle de diffusion', 'rejoindre le cours', 'en vivo', 'aula en vivo', 'clase en directo', 'unirse a la clase', 'diretta', 'lezione dal vivo', 'sala trasmissione', 'partecipa alla lezione', 'بث', 'مباشر', 'صف مباشر', 'الصف المباشر', 'غرفة الصف', 'غرفة البث', 'الانضمام للحصة'].some((keyword) => q.includes(keyword));
    if (liveQuestion) {
      if (currentLang === 'ar') return 'للدخول إلى الصف المباشر، سجّل الدخول بالحساب المفعّل والمسدد والمسجل في حصة الأستاذ نفسها. افتح «البث المباشر» واختر صفك. يبدأ الأستاذ البث أولاً، ويمكن للمدير مراقبة أي صف من لوحة التحكم ← إدارة الحصص.';
      if (currentLang === 'fr') return "Pour rejoindre un cours en direct, connectez-vous avec un compte activé, payé et inscrit à la même séance que l’éducateur. Ouvrez « Diffusion en direct » et choisissez votre classe. L’éducateur démarre la diffusion. Le Directeur peut surveiller toute classe depuis Tableau de bord → Gestion des cours.";
      if (currentLang === 'es') return 'Para entrar en una clase en directo, inicia sesión con una cuenta activada, pagada y asignada a la misma sesión del educador. Abre «Emisión en directo» y elige tu curso. El educador inicia la emisión. El Director puede supervisar cualquier clase desde Panel → Gestionar sesiones.';
      if (currentLang === 'it') return "Per entrare in una lezione dal vivo, accedi con un account attivato, pagato e assegnato alla stessa sessione dell'educatore. Apri «Diretta» e scegli la tua classe. L'educatore avvia la trasmissione. Il Direttore può monitorare qualsiasi classe da Pannello → Gestione lezioni.";
      return 'To join a live class, sign in with an activated, paid account assigned to the same educator session. Open Broadcast Room and choose your grade. The educator starts the broadcast. The Director can monitor any class from Dashboard → Manage Sessions.';
    }

    const schoolNavigationQuestion = [
      'student screen', 'educator screen', 'student dashboard', 'educator dashboard', 'director dashboard',
      'navigate between', 'navigation', 'how to use agenda', 'switch between student and educator',
      'student role', 'educator role', 'director role', 'student area', 'educator area',
      'écran étudiant', 'ecran etudiant', 'espace élève', 'espace eleve', 'espace éducateur',
      'pantalla del estudiante', 'pantalla del educador', 'area del estudiante',
      'schermata studente', 'schermata educatore', 'area studenti',
      'شاشة الطالب', 'شاشة الأستاذ', 'شاشة المعلم', 'دور الطالب', 'دور المعلم', 'التنقل بين الشاشات', 'كيف أستخدم أجندة'
    ].some((keyword) => q.includes(keyword));
    if (schoolNavigationQuestion) {
      if (currentLang === 'ar') return 'توجد ثلاث واجهات حسب نوع الحساب: الطالب، والأستاذ، والمدير. الطالب يسجّل الدخول ثم يفتح الصف أو غرفة البث المخصصة له، ويمكنه الانتقال إلى «الموارد التعليمية» لمشاهدة الدروس المحفوظة. الأستاذ يسجّل الدخول بحساب Educator ويفتح صفه المخصص لبدء البث وحفظ محاضراته. المدير يختار «دخول المدير» ثم يستخدم «لوحة المدير» لإدارة الحسابات والحصص ومراقبة الصفوف. استخدم حساب الدور الصحيح؛ صلاحيات كل واجهة تختلف.';
      if (currentLang === 'fr') return 'Agenda propose trois espaces selon le type de compte : Élève, Éducateur et Directeur. L’élève se connecte puis ouvre sa classe ou sa salle de diffusion attribuée ; « Ressources pédagogiques » permet de consulter les cours enregistrés. L’éducateur se connecte avec son compte Educator, ouvre sa propre classe, démarre la diffusion et enregistre ses leçons. Le Directeur choisit « Connexion Directeur », puis utilise le tableau de bord pour gérer les comptes, les cours et surveiller les classes. Utilisez le compte correspondant à votre rôle.';
      if (currentLang === 'es') return 'Agenda tiene tres espacios según el tipo de cuenta: Estudiante, Educador y Director. El estudiante inicia sesión y abre su aula o sala de emisión asignada; en «Recursos educativos» consulta las lecciones guardadas. El educador entra con su cuenta Educator, abre su propia aula, inicia la emisión y guarda sus lecciones. El Director selecciona «Acceso del Director» y usa el panel para gestionar cuentas, sesiones y supervisar las aulas. Utiliza la cuenta del rol que te corresponde.';
      if (currentLang === 'it') return 'Agenda offre tre aree in base al tipo di account: Studente, Educatore e Direttore. Lo studente accede e apre la propria aula o sala trasmissione assegnata; in «Risorse didattiche» consulta le lezioni salvate. L’educatore accede con il proprio account Educator, apre la sua aula, avvia la diretta e salva le lezioni. Il Direttore seleziona «Accesso Direttore» e usa il pannello per gestire account, sessioni e monitorare le aule. Usa l’account corrispondente al tuo ruolo.';
      return 'Agenda has three role-based areas: Student, Educator, and Director. Students sign in and open their assigned classroom or Broadcast Room; Learning Resources is where they view saved lectures. Educators sign in with an Educator account, open their own assigned classroom, start the broadcast, and save lectures. Directors choose Director Login and use the dashboard to manage accounts, sessions, and classroom monitoring. Use the account that matches your role.';
    }

    const assignmentQuestion = [
      'assign student', 'student assignment', 'assigned educator', 'assigned teacher', 'change educator',
      'change teacher', 'reassign student', 'student belongs to', 'who is my educator',
      'changer d’éducateur', 'changer educateur', 'asignar estudiante', 'cambiar educador',
      'assegnare studente', 'cambiare educatore', 'تعيين الطالب', 'تغيير الأستاذ', 'تغيير المعلم',
      'الأستاذ المسؤول', 'لمن يتبع الطالب', 'تغيير صف الطالب'
    ].some((keyword) => q.includes(keyword));
    if (assignmentQuestion) {
      if (currentLang === 'ar') return 'كل طالب مرتبط بأستاذ وصف محدد، ويختار الطالب الأستاذ/الحصة المتاحة أثناء التسجيل. يستطيع المدير تغيير تعيين الطالب لاحقاً من «لوحة المدير» ← «الحسابات» عبر قائمة الأستاذ، كما يمكنه تعديل تعيين جلسة الأستاذ. بعد التغيير، يدخل الطالب إلى الصف المرتبط بالتعيين الجديد.';
      if (currentLang === 'fr') return 'Chaque élève est lié à un éducateur et à une classe précise. L’élève choisit l’éducateur/la séance disponible lors de l’inscription. Le Directeur peut modifier cette affectation ensuite dans « Tableau de bord » → « Comptes », à l’aide de la liste des éducateurs, et modifier également la séance attribuée à un éducateur. L’élève rejoint ensuite la classe correspondant à la nouvelle affectation.';
      if (currentLang === 'es') return 'Cada estudiante está vinculado a un educador y a un aula concreta. Durante el registro, el estudiante elige el educador o la sesión disponible. El Director puede cambiar esa asignación después desde «Panel del Director» → «Cuentas», usando la lista de educadores, y también puede cambiar la sesión asignada a un educador. El estudiante entrará en el aula de la nueva asignación.';
      if (currentLang === 'it') return 'Ogni studente è collegato a un educatore e a una classe specifica. Durante la registrazione, lo studente sceglie l’educatore o la lezione disponibile. Il Direttore può modificare l’assegnazione da «Dashboard del Direttore» → «Account», usando l’elenco degli educatori, e può anche cambiare la lezione assegnata a un educatore. Lo studente accederà quindi alla classe della nuova assegnazione.';
      return 'Each student is linked to one assigned educator and classroom. During registration, the student chooses an available educator/session. The Director can later change that assignment in Director Dashboard → Accounts using the educator selector, and can also change an educator’s assigned session. The student then accesses the classroom linked to the new assignment.';
    }

    const directorManagementQuestion = [
      'director manage', 'manage accounts', 'director dashboard', 'reset password', 'change username',
      'change user name', 'change password', 'activate account', 'deactivate account', 'mark as paid',
      'renew account', 'student account management', 'educator account management',
      'gestion des comptes', 'réinitialiser le mot de passe', 'gestionar cuentas', 'restablecer contraseña',
      'gestione account', 'reimpostare password', 'إدارة الحسابات', 'لوحة المدير', 'تغيير اسم المستخدم',
      'تغيير كلمة المرور', 'إعادة تعيين كلمة المرور', 'تفعيل الحساب', 'تجديد الحساب', 'حالة الدفع'
    ].some((keyword) => q.includes(keyword));
    if (directorManagementQuestion) {
      if (currentLang === 'ar') return 'من «دخول المدير» ثم «لوحة المدير» ← «الحسابات»، يستطيع المدير مراجعة الطلاب والأساتذة، تفعيل الحسابات أو إيقافها، تحديث حالة الدفع، تجديد صلاحية الحساب، تغيير اسم مستخدم الطالب أو الأستاذ، وإعادة تعيين كلمة المرور. كما يستطيع تغيير تعيين الطالب للأستاذ. ويستطيع المدير تعديل اسم المستخدم وكلمة المرور الخاصين به من إعدادات ملف المدير. لا يمكن للمساعد رؤية كلمات المرور الحالية أو طلبها منك.';
      if (currentLang === 'fr') return 'Depuis « Connexion Directeur » → « Tableau de bord » → « Comptes », le Directeur peut consulter les élèves et les éducateurs, activer ou désactiver les comptes, mettre à jour le statut de paiement, renouveler la validité, modifier le nom d’utilisateur d’un élève ou d’un éducateur, réinitialiser son mot de passe et modifier son affectation. Le Directeur modifie son propre identifiant et mot de passe dans les paramètres de son profil. L’assistant ne voit pas les mots de passe existants et ne vous les demandera jamais.';
      if (currentLang === 'es') return 'Desde «Acceso del Director» → «Panel del Director» → «Cuentas», el Director puede revisar estudiantes y educadores, activar o desactivar cuentas, actualizar el estado de pago, renovar la vigencia, cambiar el nombre de usuario de un estudiante o educador, restablecer su contraseña y modificar su asignación. El Director cambia su propio usuario y contraseña en la configuración de su perfil. El asistente no puede ver las contraseñas actuales y nunca te las pedirá.';
      if (currentLang === 'it') return 'Da «Accesso Direttore» → «Dashboard del Direttore» → «Account», il Direttore può consultare studenti ed educatori, attivare o disattivare gli account, aggiornare lo stato di pagamento, rinnovare la validità, modificare il nome utente di uno studente o educatore, reimpostare la password e cambiare l’assegnazione. Il Direttore modifica il proprio nome utente e la propria password nelle impostazioni del profilo. L’assistente non può vedere le password esistenti e non te le chiederà mai.';
      return 'From Director Login → Director Dashboard → Accounts, the Director can review students and educators, activate or deactivate accounts, update payment status, renew account validity, change a student’s or educator’s username, reset their password, and change student assignments. The Director can update their own username and password in Director profile settings. The assistant cannot see existing passwords and will never ask you to share one.';
    }

    const classSizeQuestion = [
      'how many students', 'number of students', 'class size', 'students per class',
      'five students', '5 students', 'unlimited students', 'unlimited educators',
      'combien d’élèves', 'combien eleves', 'taille de classe', 'alumnos por clase',
      'estudiantes por clase', 'studenti per classe', 'quanti studenti',
      'عدد الطلاب', 'عدد التلاميذ', 'كم طالب', 'خمسة طلاب', '5 طلاب', 'عدد الأساتذة'
    ].some((keyword) => q.includes(keyword));
    if (classSizeQuestion) {
      if (currentLang === 'ar') return 'يمكن للمدرسة إنشاء أعداد غير محدودة من حسابات الطلاب والأساتذة؛ لا يوجد حد إجمالي ثابت لعدد الحسابات. متوسط التخطيط المعتاد هو نحو خمسة طلاب في الصف الواحد، لكنه متوسط إرشادي وليس سقفاً عاماً ثابتاً. يحدد المدير تنظيم الصفوف وفق ظروف المدرسة.';
      if (currentLang === 'fr') return 'L’établissement peut créer un nombre illimité de comptes élèves et éducateurs ; il n’existe pas de plafond global fixe pour les comptes. La moyenne habituelle visée est d’environ cinq élèves par classe, à titre indicatif et non comme une limite absolue. Le Directeur organise les classes selon les besoins de l’établissement.';
      if (currentLang === 'es') return 'La escuela puede crear un número ilimitado de cuentas de estudiantes y educadores; no existe un límite global fijo de cuentas. La referencia habitual es un promedio de unos cinco estudiantes por clase, no un máximo absoluto. El Director organiza las clases según las necesidades de la escuela.';
      if (currentLang === 'it') return 'La scuola può creare un numero illimitato di account per studenti ed educatori; non esiste un limite complessivo fisso agli account. Il riferimento medio è di circa cinque studenti per classe, come indicazione e non come limite assoluto. Il Direttore organizza le classi secondo le esigenze della scuola.';
      return 'A school can create an unlimited number of student and educator accounts; there is no fixed overall account limit. The usual planning average is about five students per class, as a guideline rather than a universal hard cap. The Director organizes classes according to the school’s needs.';
    }

    const conferenceQuestion = [
      'conference room', 'video conference', 'video call', 'meeting room', 'classroom chat',
      'camera and microphone', 'talk to educator', 'talk with students', 'live conversation',
      'salle de conférence', 'visioconférence', 'sala de reuniones', 'videollamada',
      'sala conferenze', 'videochiamata', 'غرفة المؤتمر', 'مؤتمر فيديو', 'اجتماع مباشر',
      'التواصل مع الأستاذ', 'التحدث مع الطلاب', 'كاميرا وميكروفون'
    ].some((keyword) => q.includes(keyword));
    if (conferenceQuestion) {
      if (currentLang === 'ar') return 'غرفة الصف المباشر هي قاعة مؤتمر فيديو تجمع الأستاذ والطلاب المسجلين في صفه نفسه. يمكن للمشاركين الانضمام إلى البث المباشر واستخدام الكاميرا والميكروفون، كما تتوفر محادثة صفية لإرسال الرسائل والمرفقات المدعومة. يبدأ الأستاذ البث، وينضم الطلاب بعد تسجيل الدخول وتفعيل حساباتهم وتسديدها وتعيينهم إلى الصف الصحيح. يستطيع المدير دخول صفوف مدرسته لمراقبتها.';
      if (currentLang === 'fr') return 'La salle de classe en direct est une salle de visioconférence réunissant l’éducateur et les élèves inscrits à sa classe. Les participants peuvent rejoindre la diffusion, utiliser la caméra et le microphone, et communiquer par le chat de classe avec les pièces jointes prises en charge. L’éducateur démarre la diffusion ; les élèves rejoignent après connexion, activation, confirmation du paiement et affectation à la bonne classe. Le Directeur peut entrer dans les classes de son établissement pour les surveiller.';
      if (currentLang === 'es') return 'El aula en directo es una sala de videoconferencia que reúne al educador y a los estudiantes inscritos en su clase. Los participantes pueden unirse a la emisión, utilizar la cámara y el micrófono y comunicarse mediante el chat del aula con archivos adjuntos compatibles. El educador inicia la emisión; los estudiantes se unen después de iniciar sesión, activar la cuenta, confirmar el pago y estar asignados al aula correcta. El Director puede entrar en las clases de su escuela para supervisarlas.';
      if (currentLang === 'it') return 'L’aula in diretta è una sala di videoconferenza che riunisce l’educatore e gli studenti iscritti alla sua classe. I partecipanti possono entrare nella diretta, usare videocamera e microfono e comunicare tramite la chat della classe con allegati supportati. L’educatore avvia la trasmissione; gli studenti accedono dopo il login, l’attivazione, la conferma del pagamento e l’assegnazione alla classe corretta. Il Direttore può entrare nelle classi della propria scuola per monitorarle.';
      return 'The live classroom is a video-conference room for an educator and the students registered in that educator’s class. Participants can join the live session, use camera and microphone controls, and communicate through classroom chat with supported attachments. The educator starts the broadcast; students join after signing in, account activation, payment confirmation, and assignment to the correct class. The Director can enter any class in their own school to monitor it.';
    }

    const architectureQuestion = ['separate school', 'another school', 'school data', 'data isolation', 'tenant', 'privacy', 'confidentiality', 'écoles séparées', 'autre établissement', 'confidentialité', 'escuelas separadas', 'otra escuela', 'privacidad', 'scuole separate', 'altra scuola', 'riservatezza', 'مدارس منفصلة', 'مدرسة أخرى', 'خصوصية البيانات', 'عزل البيانات'].some((keyword) => q.includes(keyword));
    if (architectureQuestion) {
      if (currentLang === 'ar') return 'تعمل المنصة بنظام مدارس مستقلة: لكل مدير مدرسة خاصة به ومعرّف مدرسة مستقل، وطلاب ومدرسون وحصص وموارد تعليمية وأسعار منفصلة. لا يستطيع مدير الوصول إلى حسابات أو ملفات مدرسة أخرى. استخدم رابط المدرسة الخاص بها لتسجيل الطلاب والمدرسين.';
      if (currentLang === 'fr') return "La plateforme fonctionne avec des établissements séparés : chaque Directeur possède son propre établissement et identifiant, ses élèves, éducateurs, cours, ressources et tarifs. Un Directeur ne peut pas accéder aux comptes ni aux fichiers d’un autre établissement. Utilisez le lien propre à votre établissement pour les inscriptions.";
      if (currentLang === 'es') return 'La plataforma utiliza escuelas independientes: cada Director tiene su propia escuela e identificador, estudiantes, educadores, clases, recursos y tarifas. Un Director no puede acceder a las cuentas ni archivos de otra escuela. Utiliza el enlace específico de tu escuela para registrarte.';
      if (currentLang === 'it') return "La piattaforma utilizza scuole separate: ogni Direttore ha la propria scuola e il proprio identificativo, studenti, educatori, lezioni, risorse e tariffe. Un Direttore non può accedere agli account o ai file di un'altra scuola. Usa il link specifico della tua scuola per registrarti.";
      return 'Agenda uses separate school spaces: every Director has an independently identified school, its own students, educators, classes, saved learning resources, and pricing. A Director cannot access another school’s accounts or files. Use your school-specific link when registering.';
    }


    const paymentQuestion = [
      'how do i pay', 'how can i pay', 'payment method', 'make a payment', 'pay for', 'pay online',
      'suyool', 'payer', 'paiement', 'pagar', 'pago', 'pagamento',
      'كيف أدفع', 'كيف ادفع', 'طريقة الدفع', 'طرق الدفع', 'الدفع', 'تسديد', 'ادفع'
    ].some((keyword) => q.includes(keyword));
    if (paymentQuestion) {
      if (currentLang === 'ar') return 'للدفع، افتح قسم «الدفع» في خطوات التسجيل واتبع رابط Suyool وتعليماته. لا يعالج هذا المساعد المدفوعات ولا يؤكدها؛ يؤكد مدير المدرسة حالة الدفع من لوحة المدير. لا ترسل بيانات البطاقة أو كلمات المرور في المحادثة.';
      if (currentLang === 'fr') return 'Pour payer, ouvrez la section « Paiement » pendant l’inscription et suivez le lien et les instructions de Suyool. Cet assistant ne traite ni ne vérifie les paiements ; le Directeur confirme le statut depuis son tableau de bord. Ne partagez jamais vos données de carte ou mots de passe dans le chat.';
      if (currentLang === 'es') return 'Para pagar, abre la sección «Pago» durante el registro y sigue el enlace y las instrucciones de Suyool. Este asistente no procesa ni verifica pagos; el Director confirma el estado desde su panel. No compartas datos de tarjeta ni contraseñas en el chat.';
      if (currentLang === 'it') return 'Per pagare, apri la sezione «Pagamento» durante la registrazione e segui il link e le istruzioni di Suyool. Questo assistente non elabora né verifica i pagamenti; il Direttore conferma lo stato dal proprio pannello. Non condividere dati della carta o password nella chat.';
      return 'To pay, open the Payment section during registration and follow the Suyool link and instructions. This assistant does not process or verify payments; your school Director confirms payment status in the Director Dashboard. Never share card details or passwords in chat.';
    }

    const contactQuestion = [
      'contact', 'contact us', 'contact details', 'support', 'help desk', 'helpdesk', 'email address',
      'phone number', 'telephone', 'whatsapp', 'reach the school', 'contacter', 'coordonnées',
      'assistance', 'contacto', 'soporte', 'teléfono', 'telefono', 'contatti', 'assistenza',
      'numero di telefono', 'اتصل', 'تواصل', 'التواصل', 'رقم الهاتف', 'رقم التواصل', 'البريد الإلكتروني'
    ].some((keyword) => q.includes(keyword));
    if (contactQuestion) {
      if (currentLang === 'ar') return 'للمساعدة المتعلقة بحسابك أو التفعيل أو الصفوف أو الرسوم، تواصل مع مدير مدرستك عبر بيانات الاتصال التي زودتك بها المدرسة. لا يعرض هذا المساعد أرقاماً أو عناوين اتصال خاصة غير متاحة للعامة. وللاستفسارات العامة عن منصة Agenda، استخدم قناة التواصل الرسمية التي حصلت منها على رابط المنصة.';
      if (currentLang === 'fr') return 'Pour toute aide concernant votre compte, son activation, les cours ou les frais, contactez le Directeur de votre établissement avec les coordonnées fournies par l’école. Cet assistant ne divulgue pas de numéros ou adresses privés. Pour les demandes générales sur Agenda, utilisez le canal officiel par lequel vous avez reçu le lien de la plateforme.';
      if (currentLang === 'es') return 'Para obtener ayuda con tu cuenta, activación, clases o tarifas, contacta con el Director de tu escuela mediante los datos de contacto que te proporcionó el centro. Este asistente no inventa ni divulga números o direcciones privadas. Para consultas generales sobre Agenda, utiliza el canal oficial por el que recibiste el enlace de la plataforma.';
      if (currentLang === 'it') return 'Per assistenza con account, attivazione, lezioni o tariffe, contatta il Direttore della tua scuola tramite i recapiti forniti dall’istituto. Questo assistente non inventa né divulga numeri o indirizzi privati. Per richieste generali su Agenda, usa il canale ufficiale tramite cui hai ricevuto il link della piattaforma.';
      return 'For help with your account, activation, classes, or school fees, contact your school Director using the contact details your school provided. This assistant does not invent or disclose private phone numbers or email addresses. For general Agenda platform enquiries, use the official contact channel through which you received your platform link.';
    }

    return null;
  };

  const handleSend = async (textToSend?: string) => {
    const recentConversation = messages.slice(-8).map((message) =>
      `${message.sender === 'user' ? 'User' : 'Assistant'}: ${message.text}`
    ).join('\\n');
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    setInputText('');
    setIsTyping(true);

    // Send the user's original question directly to the AI model. the AI model can
    // understand the source language and answer in the selected app language;
    // a separate translation request added latency and could block the chat.
    const selectedLanguageQuestion = text;

    const userMessageId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: selectedLanguageQuestion,
      time: formatChatTime(),
    };
    if (activeLanguageRef.current !== currentLang) {
      setIsTyping(false);
      return;
    }
    setMessages(prev => [...prev, userMsg]);

    // Never make chat wait for a school-context refresh. Use the latest
    // cached context immediately, then refresh it in the background for the
    // next message. The initial context loader already runs when the chat mounts.
    const currentSchoolContext = schoolContext;
    if (schoolId) {
      void getSchoolPublicContext(schoolId)
        .then((context) => setSchoolContext(context))
        .catch((error) => console.warn('Background school AI context refresh failed.', error));
    }
    // Return the prepared, localized Agenda help for common operational questions.
    // More complex, mixed-topic and educational questions continue to the AI model.
    const savedAnswer = getSavedResponse(selectedLanguageQuestion, currentSchoolContext);
    if (savedAnswer) {
      if (activeLanguageRef.current !== currentLang) {
        setIsTyping(false);
        return;
      }
      setMessages((previous) => [...previous, {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: savedAnswer,
        time: formatChatTime(),
      }]);
      setIsTyping(false);
      return;
    }

    // Generate the assistant's answer with the AI model
    let reply = '';
    {
      try {
        const response = await generateAIContent([
            {
              text: `You are the AI academic assistant for Agenda (منصة الأجندة اللبنانية).
CANONICAL AGENDA KNOWLEDGE (always available; do not rely on previous chat messages to remember these facts):
${AGENDA_ASSISTANT_KNOWLEDGE}
RECENT CONVERSATION (use only to understand follow-up references; canonical knowledge and current school data take precedence):
${recentConversation || '(No previous chat messages.)'}
Platform constraints:
- Use the selected school's live configuration for its name, educators, and sessions. The default student rate is USD 125 per session and may be adjusted by the Director; users should confirm the current rate with their Director.
- Do not claim a fixed platform-wide price or timetable. Do not invent payment methods, schedules, account credentials, or school records.
- Explain academic concepts, official Lebanese curriculum, homework, camera exercise submissions, and classroom navigation.
REQUIRED OUTPUT LANGUAGE: ${languageNames[currentLang]}.
MANDATORY LANGUAGE POLICY:
- The user's question may be written in any supported language. Understand it directly and answer in ${languageNames[currentLang]}.
- Answer in ${languageNames[currentLang]} only, using natural, fluent, complete sentences.
- Do not answer in the source language of the original question.
- Do not mix English with the selected language. Translate explanations, headings, lists, UI navigation names, examples, and ordinary text.
- Keep only proper names, school names, usernames, URLs, code, and standard technical product terms unchanged where translation would be incorrect.
- Do not quote or restate the question in a different language.
- Before sending, check that every sentence is in ${languageNames[currentLang]} and rewrite any sentence that is not.
Authoritative school configuration (use current values, never invent a rate):
${JSON.stringify(currentSchoolContext ? { schoolName: currentSchoolContext.schoolName, sessions: currentSchoolContext.sessions, educators: currentSchoolContext.educators, guidance: currentSchoolContext.guidance } : { schoolName: schoolName || 'Agenda', sessions: [], educators: [] })}
Platform architecture and navigation:
- Each Director owns one separate school tenant. Students, educators, classes, saved educator lessons, and grade-specific student rates per session are isolated by that school's owner and school ID.
- The correct school is selected by its dedicated share link. There is no public school dropdown.
- Registration: open the school's link, choose Student or Educator, enter the required details, create a username and password, and choose an available grade and educator/session. The Director activates the account.
- Sign-in: use the username and password created at registration. Ask the Director to reset a forgotten password.
- Live class: an activated and paid student joins only their assigned educator session after the educator starts it. Educators enter their own assigned classroom. Directors can monitor every class belonging to their school from Director Dashboard > Manage Sessions, even if no educator account is registered for that class.
- Saved lessons: sign in, open the classroom, select Learning Resources, and choose an educator. Educators can upload and edit only their own lesson slots.
- The default student rate is USD 125 per session. The Director may vary it according to school conditions and their decision. Confirm the current rate with the Director.
- A separate Agenda school setup costs USD 150 one time to purchase/create the school identity/name and its independent school space. The purchaser becomes its Director. Keep this one-time setup cost distinct from the student rate per session.
- To rename a school, the Director signs in from the Director Login card on the main screen, opens Director Dashboard > Accounts, edits the School name field, and saves. The new name updates the platform branding.
- Explain the current school's prices, educators, grades and sessions using the supplied school configuration. Do not expose private account data, passwords, or other schools' information.
Original user question (understand it directly; answer only in the selected language): "${selectedLanguageQuestion}"`
            }
          ], { maxOutputTokens: 1024 });

        // The system prompt already requires the selected output language.
        // Skip a second the AI model call just to translate the generated answer.
        reply = response.text?.trim() || '';
      } catch (e) {
        console.warn('AI chat error (diagnostic):', e instanceof Error ? e.message : String(e));
      }
    }

    // Do not disguise an upstream/API failure as an AI answer. Restore the
    // question so the user can retry, and show a clear localized service error.
    if (!reply) {
      setInputText(text);
      if (currentLang === 'ar') {
        reply = 'تعذر الاتصال بخدمة الذكاء الاصطناعي حالياً. احتفظنا بسؤالك في خانة الكتابة؛ يرجى المحاولة مجدداً بعد قليل.';
      } else if (currentLang === 'fr') {
        reply = 'Le service IA est momentanément inaccessible. Votre question a été conservée dans le champ de saisie ; veuillez réessayer dans un instant.';
      } else if (currentLang === 'es') {
        reply = 'No se pudo conectar con el servicio de IA. Tu pregunta se ha conservado en el campo de texto; inténtalo de nuevo en unos instantes.';
      } else if (currentLang === 'it') {
        reply = 'Non è stato possibile raggiungere il servizio IA. La domanda è rimasta nel campo di testo; riprova tra poco.';
      } else {
        reply = 'I could not reach the AI service just now. Your question has been kept in the input field; please try again shortly.';
      }
    }

    if (activeLanguageRef.current !== currentLang) {
      setIsTyping(false);
      return;
    }
    setIsTyping(false);
    setMessages(prev => [
      ...prev,
      {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: reply,
        time: formatChatTime()
      }
    ]);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white p-3.5 sm:px-4 sm:py-3.5 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-300 hover:scale-105 cursor-pointer border-2 border-white/20"
          title={currentLang === 'ar' ? 'محادثة مع المساعد الذكي' : currentLang === 'fr' ? 'Discussion avec l’assistant IA' : currentLang === 'es' ? 'Chat con el asistente de IA' : currentLang === 'it' ? 'Chat con l’assistente IA' : 'AI Chat'}
        >
          <Bot className="w-5 h-5 text-white" />
          <span className="text-xs font-bold hidden sm:inline">
            {currentLang === 'ar' ? 'المساعد الذكي' : currentLang === 'fr' ? 'Assistant IA' : currentLang === 'es' ? 'Asistente de IA' : currentLang === 'it' ? 'Assistente IA' : 'AI Assistant'}
          </span>
        </button>
      )}

      {/* Floating AI Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[95vw] sm:w-[400px] max-h-[80vh] h-[540px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 text-start">
          {/* Header */}
          <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-4 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-sm text-white">
                    {currentLang === 'ar' ? 'المساعد الذكي' : currentLang === 'fr' ? 'Assistant IA' : currentLang === 'es' ? 'Asistente de IA' : currentLang === 'it' ? 'Assistente IA' : 'AI Assistant'}
                  </h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[10px] text-indigo-200 mt-0.5">{chatLabels.responseLanguage}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title={chatLabels.close}
              aria-label={chatLabels.close}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Body - Blank by default, zero clutter */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.length === 0 && (
              <div className="min-h-full flex flex-col items-center justify-center gap-4 text-slate-400 text-xs text-center p-6">
                <p>
                  {currentLang === 'ar' ? 'اكتب رسالتك للبدء...' : currentLang === 'fr' ? 'Écrivez votre message pour commencer...' : currentLang === 'es' ? 'Escribe un mensaje para comenzar...' : currentLang === 'it' ? 'Scrivi un messaggio per iniziare...' : 'Type a message to begin...'}
                </p>
                <button
                  type="button"
                  onClick={() => void handleSend(
                    currentLang === 'ar'
                      ? 'أعطني نبذة عن تطبيق Agenda واشرح كيفية تغيير اسم مدرستي والتنقل في المنصة والحصول على نسختي الخاصة مقابل 150 دولاراً.'
                      : currentLang === 'fr'
                        ? 'Présentez-moi Agenda et expliquez comment renommer mon établissement, naviguer sur la plateforme et obtenir ma propre copie pour 150 USD.'
                        : currentLang === 'es'
                          ? 'Dame una presentación de Agenda y explícame cómo cambiar el nombre de mi escuela, navegar por la plataforma y obtener mi propia copia por 150 USD.'
                          : currentLang === 'it'
                            ? 'Fammi una presentazione di Agenda e spiegami come rinominare la mia scuola, navigare nella piattaforma e ottenere la mia copia per 150 USD.'
                            : 'Give me an application overview and explain how to rename my school, navigate the platform, and get my own USD 150 copy.'
                  )}
                  className="rounded-xl border border-indigo-200 bg-white px-4 py-3 text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                >
                  {currentLang === 'ar' ? 'نبذة عن Agenda وكيفية استخدامه' : currentLang === 'fr' ? 'Présentation d’Agenda et guide d’utilisation' : currentLang === 'es' ? 'Presentación de Agenda y guía de uso' : currentLang === 'it' ? 'Presentazione di Agenda e guida all’uso' : 'About Agenda & how to use it'}
                </button>
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div aria-label={currentLang === 'ar' ? 'المساعد' : currentLang === 'en' ? 'AI assistant' : 'Assistant IA'} className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] shadow-xs font-bold">
                    {assistantBadge}
                  </div>
                )}

                <div
                  lang={chatLocale[currentLang]}
                  dir={currentLang === 'ar' ? 'rtl' : 'auto'}
                  className={`max-w-[85%] p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-xs font-medium'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs whitespace-pre-line'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`text-[9px] block text-end mt-1 ${
                      msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div aria-label={chatLabels.thinking} className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px] shadow-xs font-bold">
                  {assistantBadge}
                </div>
                <div role="status" aria-label={chatLabels.thinking} className="bg-white text-slate-500 border border-slate-200 p-3 rounded-2xl text-xs rounded-bl-none shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-150" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-300" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                currentLang === 'ar'
                  ? 'اكتب سؤالك هنا...'
                  : currentLang === 'fr'
                    ? 'Posez votre question ici...'
                    : currentLang === 'es'
                      ? 'Escribe tu pregunta aquí...'
                      : currentLang === 'it'
                        ? 'Scrivi qui la tua domanda...'
                        : 'Type your question here...'
              }
              aria-label={chatLabels.input}
              lang={chatLocale[currentLang]}
              dir={currentLang === 'ar' ? 'rtl' : 'auto'}
              className="flex-1 text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-indigo-600 font-medium"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              title={chatLabels.send}
              aria-label={chatLabels.send}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition shadow-xs cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
