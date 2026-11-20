import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { generateAIContent, getSchoolPublicContext, getFounderMessages, sendFounderMessage } from '../services/cloudflareApi';
import type { SchoolPublicContext, CloudflareAccount, FounderMessage } from '../services/cloudflareApi';
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
 account?: CloudflareAccount | null;
 sessionToken?: string;
 chatOnlyMode?: boolean;
 isOwner?: boolean;
 onFounderBackHome?: () => void;
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
 'The application supports Arabic, English, French, Spanish, and Italian. Answer in the language of the user\'s latest message unless they explicitly request another response language.',
 'For questions outside Agenda operations, use the AI model for educational, general-knowledge, reasoning, and study questions. Understand the original question directly and answer naturally in the language requested by the user.'
].join('\\n');


/**
 * Prefer the language of the user's latest message. Explicit language requests
 * take priority; the interface language is only the fallback for ambiguous text.
 */
function detectChatLanguage(text: string, fallback: Language): Language {
 const q = text.toLowerCase();

 if (/\b(in arabic|arabic please|answer in arabic|reply in arabic)\b|بالعربية|بالعربي|باللغة العربية|أجب بالعربية|اعد بالعربي|أعد بالعربية/u.test(q)) return 'ar';
 if (/\b(in french|french please|answer in french|reply in french|en français)\b|بالفرنسية|باللغة الفرنسية/u.test(q)) return 'fr';
 if (/\b(in spanish|spanish please|answer in spanish|reply in spanish|en español)\b|بالإسبانية|باللغة الإسبانية/u.test(q)) return 'es';
 if (/\b(in italian|italian please|answer in italian|reply in italian|in italiano)\b|بالإيطالية|باللغة الإيطالية/u.test(q)) return 'it';
 if (/\b(in english|english please|answer in english|reply in english)\b|بالإنجليزية|باللغة الإنجليزية/u.test(q)) return 'en';

 if (/[\u0600-\u06FF]/u.test(text)) return 'ar';
 if (/[¿¡ñáéíóúü]/i.test(text) || /\b(hola|gracias|por favor|cómo|qué|dónde|puedes|quiero|necesito|buenos días|buenas tardes)\b/u.test(q)) return 'es';
 if (/[àâçéèêëîïôûùüÿœ]/i.test(text) || /\b(bonjour|merci|s'il vous plaît|comment|pourquoi|où|avec|je voudrais|pouvez-vous|salut)\b/u.test(q)) return 'fr';
 if (/[ìòù]/i.test(text) || /\b(ciao|grazie|per favore|perché|come|vorrei|puoi|buongiorno|buonasera)\b/u.test(q)) return 'it';
 if (/\b(hello|hi|hey|how|what|why|where|when|please|thanks|thank you|could|would|can you|tell me|explain|about)\b/u.test(q)) return 'en';

 return fallback;
}

export const AIChatBot: React.FC<AIChatBotProps> = ({ currentLang, schoolId, schoolName, account, sessionToken = '', chatOnlyMode = false, isOwner = false, onFounderBackHome }) => {
 const [isOpen, setIsOpen] = useState(false);
 const [inputText, setInputText] = useState('');
 const [isTyping, setIsTyping] = useState(false);
 const [usMode, setUsMode] = useState(false);
 const [usMessages, setFounderMessages] = useState<FounderMessage[]>([]);
 const [usDraft, setUsDraft] = useState('');
 const [usBusy, setUsBusy] = useState(false);
 const [usError, setUsError] = useState('');
 const messagesEndRef = useRef<HTMLDivElement>(null);
 const usRefreshSequenceRef = useRef(0);
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
 responseLanguage: currentLang === 'ar' ? 'سيجيب المساعد بلغة رسالتك' : currentLang === 'fr' ? 'Les réponses suivent la langue de votre message' : currentLang === 'es' ? 'Las respuestas siguen el idioma de tu mensaje' : currentLang === 'it' ? 'Le risposte seguono la lingua del tuo messaggio' : 'Replies follow your message language',
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
 // Us Chat opens only when the user explicitly selects Contact us.
 useEffect(() => {
  if (!isOpen) return;
  const closeOnEscape = (event: KeyboardEvent) => {
   if (event.key === 'Escape') {
    setUsMode(false);
    setIsOpen(false);
   }
  };
  window.addEventListener('keydown', closeOnEscape);
  return () => window.removeEventListener('keydown', closeOnEscape);
 }, [isOpen]);
 useEffect(() => {
  if (!usMode || !sessionToken || !account || isOwner) return;
  let active = true;
  const refresh = async () => {
   const sequence = ++usRefreshSequenceRef.current;
   try {
    const response = await getFounderMessages(sessionToken);
    if (active && sequence === usRefreshSequenceRef.current) {
     setFounderMessages(response.messages || []);
     setUsError('');
    }
   } catch (error) {
    if (active && sequence === usRefreshSequenceRef.current) {
     setUsError(error instanceof Error ? error.message : 'Unable to load the conversation.');
    }
   }
  };
  void refresh();
  const intervalId = window.setInterval(() => void refresh(), 3000);
  return () => { active = false; window.clearInterval(intervalId); };
 }, [usMode, sessionToken, account?.id, isOwner]);
 const submitFounderMessage = async () => {
  const message = usDraft.trim();
  if (!message || !sessionToken || !account || isOwner || usBusy) return;
  const optimisticId = 'pending-' + crypto.randomUUID();
  const optimisticMessage: FounderMessage = {
   id: optimisticId,
   senderId: account.id,
   senderRole: account.role,
   message,
   createdAt: new Date().toISOString(),
   readAt: null,
  };
  // Render immediately, then reconcile with the canonical saved transcript.
  setFounderMessages((previous) => [...previous, optimisticMessage]);
  setUsBusy(true);
  setUsError('');
  setUsDraft('');
  ++usRefreshSequenceRef.current; // Invalidate polls started before this send.
  let saved = false;
  try {
   await sendFounderMessage(sessionToken, message);
   saved = true;
   const sequence = ++usRefreshSequenceRef.current;
   const response = await getFounderMessages(sessionToken);
   if (sequence === usRefreshSequenceRef.current) setFounderMessages(response.messages || []);
  } catch (error) {
   if (!saved) {
    setFounderMessages((previous) => previous.filter((item) => item.id !== optimisticId));
    setUsDraft(message);
   }
   // If the POST succeeded but its follow-up GET failed, keep the actual
   // sent message on screen; the next poll reconciles the saved transcript.
   setUsError(error instanceof Error ? error.message : 'Unable to send your message. Please try again.');
  } finally {
   setUsBusy(false);
  }
 };

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
 const getSavedResponse = (query: string, context = schoolContext, allowComposite = true, responseLang: Language = currentLang): string | null => {
 const q = query.toLowerCase().trim();

 // Lightweight greetings should be instant and should not spend a the AI model
 // request. Detailed questions continue through the the AI model integration.
 if (/^(hi|hello|hey|how are you|how's it going|good morning|good afternoon|good evening|مرحبا|مرحباً|أهلاً|اهلا|كيف حالك|كيفك|السلام عليكم|bonjour|salut|comment ça va|hola|¿cómo estás\??|buenos días|ciao|come stai|buongiorno)[!.?؟ ]*$/iu.test(q)) {
 if (responseLang === 'ar') return 'مرحباً! أنا بخير، شكراً لسؤالك. كيف يمكنني مساعدتك اليوم؟';
 if (responseLang === 'fr') return 'Bonjour ! Je vais bien, merci. Comment puis-je vous aider aujourd’hui ?';
 if (responseLang === 'es') return '¡Hola! Estoy bien, gracias. ¿Cómo puedo ayudarte hoy?';
 if (responseLang === 'it') return 'Ciao! Sto bene, grazie. Come posso aiutarti oggi?';
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
 .map((topic) => getSavedResponse(topic.seed, context, false, responseLang))
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
 if (responseLang === 'ar') return 'تكلفة إنشاء مدرسة مستقلة على Agenda هي 150 دولاراً أمريكياً مرة واحدة. يُستخدم المبلغ لشراء/إنشاء هوية المدرسة واسمها ومساحتها المستقلة على المنصة، ويصبح المشتري مدير تلك المدرسة. هذا المبلغ منفصل عن رسوم الطالب لكل حصة. لا تتم معالجة الدفع من خلال هذه المحادثة؛ تواصل مع إدارة Agenda لإتمام الطلب.';
 if (responseLang === 'fr') return 'La création/l’achat d’un espace scolaire indépendant sur Agenda coûte 150 USD une seule fois. Ce montant sert à obtenir l’identité et le nom de l’établissement ainsi que son espace séparé sur la plateforme ; l’acheteur devient le Directeur de cette école. Ce coût est distinct du tarif par séance des élèves. Le chat ne traite pas les paiements : contactez l’administration d’Agenda pour effectuer la demande.';
 if (responseLang === 'es') return 'La compra/creación de una escuela independiente en Agenda cuesta 150 USD una sola vez. Este importe sirve para adquirir la identidad y el nombre de la escuela y su espacio separado en la plataforma; el comprador se convierte en Director de esa escuela. Este coste es distinto de la tarifa por sesión del estudiante. El chat no procesa pagos: contacta con la administración de Agenda para solicitarla.';
 if (responseLang === 'it') return 'L’acquisto/la creazione di uno spazio scolastico indipendente su Agenda costa 150 USD una sola volta. L’importo serve per ottenere l’identità e il nome della scuola e il suo spazio separato sulla piattaforma; l’acquirente diventa il Direttore di quella scuola. Questo costo è distinto dalla tariffa per lezione dello studente. La chat non gestisce pagamenti: contatta l’amministrazione di Agenda per fare richiesta.';
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
 if (responseLang === 'ar') return [
 'نبذة عن Agenda:',
 'Agenda منصة تعليمية وإدارية للمدارس. تتيح للطلاب الوصول إلى الصفوف المباشرة والدروس والموارد التعليمية المحفوظة، وللمعلمين تقديم الحصص وإدارة موادهم، وللمدير إدارة المدرسة ومراقبة الصفوف.',
 'تغيير اسم المدرسة: سجّل الدخول من بطاقة «دخول المدير» في الشاشة الرئيسية، ثم افتح «لوحة المدير» ← «الحسابات». غيّر حقل «اسم المدرسة» واضغط «حفظ». سيظهر الاسم الجديد في رأس المنصة وفي هوية رابط المدرسة.',
 'التنقل: يستخدم الطلاب «غرفة البث» للدخول إلى الحصة المباشرة المخصصة لهم عندما يبدأ الأستاذ البث، ثم يفتحون «الموارد التعليمية» لاسترجاع الدروس والملفات المحفوظة. يفتح المعلم غرفته من «غرفة البث» ويبدأ الحصة. ومن «لوحة المدير» ← «الحسابات» يدير المدير الطلاب والمعلمين، ومن «إدارة الحصص» يضيف الحصص ويحدد رسوم الطالب لكل حصة ويراقب الصفوف.',
 'نسختك الخاصة: يمكن لأي مستخدم الحصول على نسخة مستقلة من Agenda مقابل 150 دولاراً أمريكياً. يصبح صاحب النسخة مديرها، ويمكنه إدارة مدرسته واسمها ومعلميها وطلابها وحصصها ودروسها المحفوظة وأسعارها الشهرية، ومراقبة الحصص وتقديمها. وتبقى مدرسته وبياناتها مستقلة عن مدارس المديرين الآخرين.',
 'لطلب نسخة مستقلة، تواصل مع إدارة Agenda؛ هذه المحادثة لا تعالج المدفوعات.'
 ].join('\n\n');
 if (responseLang === 'fr') return [
 'Présentation d’Agenda :',
 'Agenda est une plateforme éducative et de gestion scolaire. Les élèves y accèdent aux cours en direct et aux ressources enregistrées, les éducateurs donnent leurs cours et gèrent leurs supports, et le Directeur administre son établissement et surveille les classes.',
 'Renommer votre établissement : connectez-vous avec la carte « Connexion Directeur » sur l’écran principal, puis ouvrez « Tableau de bord » → « Comptes ». Modifiez le champ « Nom de l’établissement » et cliquez sur « Enregistrer ». Le nouvel intitulé apparaît dans l’en-tête de la plateforme et l’identité du lien de l’établissement.',
 'Navigation : les élèves ouvrent « Salle de diffusion » pour rejoindre leur cours attribué lorsque l’éducateur démarre la diffusion, puis « Ressources pédagogiques » pour retrouver les leçons et fichiers enregistrés. Les éducateurs ouvrent leur salle depuis « Salle de diffusion » et démarrent le cours. Dans « Tableau de bord » → « Comptes », le Directeur gère les élèves et les éducateurs ; dans « Gestion des cours », il ajoute des cours, fixe le tarif par séance de chaque classe et surveille les salles.',
 'Votre propre copie : tout utilisateur peut obtenir une copie indépendante d’Agenda au prix de 150 USD. L’acheteur en devient le Directeur et peut gérer son établissement, son nom, ses éducateurs, ses élèves, ses cours, ses leçons enregistrées et ses tarifs mensuels, ainsi que surveiller et animer les cours. Son établissement et ses données restent séparés de ceux des autres Directeurs.',
 'Pour demander votre copie indépendante, contactez l’administration d’Agenda ; cette conversation ne traite pas les paiements.'
 ].join('\n\n');
 if (responseLang === 'es') return [
 'Presentación de Agenda:',
 'Agenda es una plataforma educativa y de gestión escolar. Los estudiantes acceden a clases en directo y recursos guardados; los educadores imparten clases y gestionan sus materiales; y el Director administra su escuela y supervisa las aulas.',
 'Cambiar el nombre de la escuela: inicia sesión desde la tarjeta «Acceso del Director» en la pantalla principal y abre «Panel del Director» → «Cuentas». Cambia el campo «Nombre de la escuela» y pulsa «Guardar». El nuevo nombre aparecerá en el encabezado de la plataforma y en la identidad del enlace escolar.',
 'Navegación: los estudiantes abren «Sala de emisión» para entrar en la sesión que tienen asignada cuando el educador inicia la emisión y después seleccionan «Recursos educativos» para recuperar lecciones y archivos guardados. Los educadores abren su aula desde «Sala de emisión» e inician la clase. En «Panel del Director» → «Cuentas», el Director gestiona estudiantes y educadores; en «Gestionar sesiones» añade clases, establece la tarifa por sesión de cada curso y supervisa las aulas.',
 'Tu propia copia: cualquier usuario puede obtener una copia independiente de Agenda por 150 USD. El comprador se convierte en el Director de esa copia y puede gestionar su escuela, el nombre, los educadores, los estudiantes, las clases, las lecciones guardadas y las tarifas mensuales, además de supervisar e impartir las clases. Su escuela y sus datos permanecen separados de los de otros Directores.',
 'Para solicitar tu copia independiente, contacta con la administración de Agenda; este chat no procesa pagos.'
 ].join('\n\n');
 if (responseLang === 'it') return [
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
 if (responseLang === 'ar') return `السعر الافتراضي للطالب هو 125 دولاراً أمريكياً لكل حصة. يمكن أن يختلف السعر بحسب ظروف المدرسة وقرار مديرها؛ لذلك يُرجى تأكيد السعر النهائي وعدد الحصص مع مدير مدرستك. هذه رسوم لكل حصة وليست رسوماً شهرية.\\nالمدرسة الحالية: ${context?.schoolName || schoolName || 'Agenda'}.`;
 if (responseLang === 'fr') return `Le tarif étudiant par défaut est de 125 USD par séance. Le montant peut varier selon les conditions de l’établissement et la décision du Directeur ; veuillez donc confirmer le tarif final et le nombre de séances auprès de votre Directeur. Il s’agit d’un tarif par séance, et non d’un abonnement mensuel.\\nÉtablissement : ${context?.schoolName || schoolName || 'Agenda'}.`;
 if (responseLang === 'es') return `La tarifa predeterminada para el estudiante es de 125 USD por sesión. Puede variar según las condiciones de la escuela y la decisión del Director; confirma el precio final y el número de sesiones con el Director de tu escuela. Es una tarifa por sesión, no una cuota mensual.\\nEscuela: ${context?.schoolName || schoolName || 'Agenda'}.`;
 if (responseLang === 'it') return `La tariffa predefinita per lo studente è di 125 USD per lezione. Può variare in base alle condizioni della scuola e alla decisione del Direttore; conferma quindi il prezzo finale e il numero di lezioni con il Direttore della tua scuola. È una tariffa per lezione, non un costo mensile.\\nScuola: ${context?.schoolName || schoolName || 'Agenda'}.`;
 return `The default student rate is USD 125 per session. The Director may adjust it according to the school’s circumstances, so confirm the final rate and number of sessions with your school Director. This is charged per session.\\nSchool: ${context?.schoolName || schoolName || 'Agenda'}.`;
 }

 const directorRegistrationQuestion = [
    'register as director', 'register as a director', 'director registration', 'director account registration',
    'create director account', 'create an account as director', 'how to become a director',
    'inscription comme directeur', 'créer un compte directeur', 'creer un compte directeur',
    'registro como director', 'registrarse como director', 'crear cuenta de director',
    'registrazione come direttore', 'creare account direttore',
    'التسجيل كمدير', 'تسجيل كمدير', 'كيف اسجل كمدير', 'كيف أسجل كمدير', 'كيف أسجل كمدير مدرسة',
    'كيف انشئ حساب مدير', 'كيف أنشئ حساب مدير', 'إنشاء حساب مدير', 'انشاء حساب مدير',
    'حساب المدير', 'تسجيل مدير جديد'
  ].some((keyword) => q.includes(keyword));
  if (directorRegistrationQuestion) {
    if (responseLang === 'ar') return 'لإنشاء حساب مدير: افتح صفحة Agenda الرئيسية، اختر «إنشاء حساب»، ثم اختر «مدير». أدخل اسمك الكامل واسم المدرسة والبريد الإلكتروني ورقم الهاتف وكلمة المرور، ثم أرسل الطلب. إنشاء مساحة مدرسة مستقلة يتطلب رسم إعداد لمرة واحدة قدره 150 دولاراً أمريكياً. بعد مراجعة الطلب وتأكيد الدفع وتفعيل الحساب من المالك، افتح رابط المدرسة وسجّل الدخول ببريدك أو بيانات الحساب. إذا كان الحساب بانتظار الموافقة، يمكنك استخدام «تواصل معنا» لمراسلة المالك ومتابعة الرد.';
    if (responseLang === 'fr') return 'Pour créer un compte Directeur : ouvrez la page principale d’Agenda, choisissez « Créer un compte », puis « Directeur ». Saisissez votre nom complet, le nom de l’établissement, votre e-mail, votre téléphone et un mot de passe, puis envoyez la demande. La création d’un espace scolaire indépendant nécessite des frais uniques de configuration de 150 USD. Après vérification de la demande, confirmation du paiement et activation par le propriétaire de la plateforme, ouvrez le lien de votre établissement et connectez-vous. Pendant l’attente, vous pouvez utiliser « Contactez-nous » pour écrire au propriétaire.';
    if (responseLang === 'es') return 'Para crear una cuenta de Director: abre la página principal de Agenda, elige «Crear cuenta» y después «Director». Introduce tu nombre completo, el nombre de la escuela, correo electrónico, teléfono y contraseña; luego envía la solicitud. La creación de un espacio escolar independiente requiere un pago único de configuración de 150 USD. Cuando el propietario de la plataforma revise la solicitud, confirme el pago y active la cuenta, abre el enlace de tu escuela e inicia sesión. Mientras esperas, puedes usar «Contáctanos» para escribir al propietario.';
    if (responseLang === 'it') return 'Per creare un account Direttore: apri la pagina principale di Agenda, scegli «Crea account» e poi «Direttore». Inserisci nome completo, nome della scuola, e-mail, telefono e password, quindi invia la richiesta. La creazione di uno spazio scolastico indipendente richiede una quota unica di configurazione di 150 USD. Dopo la verifica della richiesta, la conferma del pagamento e l’attivazione da parte del proprietario della piattaforma, apri il link della scuola ed effettua l’accesso. Durante l’attesa puoi usare «Contattaci» per scrivere al proprietario.';
    return 'To register as a Director, open the main Agenda page, choose Create Account, then select Director. Enter your full name, school name, email, phone number and password, then submit the request. Creating an independent school space has a one-time USD 150 setup fee. Once the platform Owner reviews the request, confirms payment and activates the account, open your school link and sign in. While waiting for approval, use Contact us to message the Owner.';
  }

  const registrationQuestion = ['register', 'registration', 'sign up', 'create account', 'inscrire', 'inscription', 'créer un compte', 'm’inscrire', 'registrar', 'registro', 'registración', 'inscripción', 'crear cuenta', 'registrarme', 'registrazione', 'registrarmi', 'creare account', 'crea un account', 'تسجيل', 'سجل', 'اسجل', 'أسجل', 'التسجيل', 'إنشاء حساب', 'انشاء حساب', 'تسجيل حساب', 'كيف اسجل', 'كيف أسجل'].some((keyword) => q.includes(keyword));
 if (registrationQuestion) {
 if (responseLang === 'ar') return 'للتسجيل: افتح رابط المدرسة الصحيح، اختر طالباً أو معلماً، أدخل الاسم والبريد الإلكتروني واسم المستخدم وكلمة المرور، ثم اختر الصف والأستاذ/الحصة المتاحة. بعد التسجيل ينتظر الحساب موافقة المدير وتفعيله.';
 if (responseLang === 'fr') return "Pour vous inscrire : ouvrez le lien de votre établissement, choisissez Élève ou Éducateur, saisissez vos coordonnées, créez un nom d’utilisateur et un mot de passe, puis choisissez la classe et l’éducateur disponibles. Le Directeur doit ensuite activer le compte.";
 if (responseLang === 'es') return 'Para registrarte: abre el enlace de tu escuela, elige Estudiante o Educador, introduce tus datos, crea un usuario y una contraseña y selecciona el curso y educador disponibles. El Director debe activar la cuenta después del registro.';
 if (responseLang === 'it') return "Per registrarti: apri il link della tua scuola, scegli Studente o Educatore, inserisci i tuoi dati, crea nome utente e password e seleziona la classe e l'educatore disponibili. Il Direttore dovrà attivare l'account dopo la registrazione.";
 return 'To register: open your school-specific link, choose Student or Educator, enter your details, create a username and password, and select an available grade and educator/session. The Director must activate the account after registration.';
 }

 const signInQuestion = ['password', 'username', 'sign in', 'sign-in', 'login', 'log in', 'mot de passe', 'identifiant', 'connexion', 'se connecter', 'contraseña', 'usuario', 'iniciar sesión', 'iniciar sesion', 'acceso', 'accedi', 'accesso', 'nome utente', 'effettua il login', 'كلمة المرور', 'اسم المستخدم', 'دخول', 'تسجيل الدخول', 'نسيت كلمة المرور', 'نسيت كلمة السر'].some((keyword) => q.includes(keyword));
 if (signInQuestion) {
 if (responseLang === 'ar') return 'لتسجيل الدخول، استخدم اسم المستخدم وكلمة المرور اللذين أنشأتهما عند التسجيل، واختر اسم مدرستك من القائمة. إذا كان الحساب بانتظار تفعيل المالك، فسيُسمح لك بفتح محادثة «تواصل معنا» فقط لقراءة الردود وإرسال الرسائل، ولن تتمكن من استخدام وظائف المدرسة حتى التفعيل. بعد التفعيل، سجّل الدخول مجدداً للوصول الكامل. إذا نسيت كلمة المرور، تواصل مع مدير مدرستك لإعادة تعيينها.';
 if (responseLang === 'fr') return "Pour vous connecter, utilisez le nom d’utilisateur et le mot de passe créés lors de l’inscription et choisissez le nom de votre établissement dans la liste. Si votre compte attend l’activation du propriétaire, vous pourrez uniquement ouvrir « Contactez-nous », lire les réponses et envoyer des messages. Les fonctions scolaires resteront verrouillées jusqu’à l’activation. Après activation, reconnectez-vous pour obtenir l’accès complet. En cas d’oubli, contactez le Directeur pour réinitialiser le mot de passe.";
 if (responseLang === 'es') return 'Para iniciar sesión, utiliza el usuario y la contraseña creados al registrarte y selecciona el nombre de tu escuela en la lista. Si la cuenta está pendiente de activación por el propietario, solo podrás abrir «Contáctanos», leer respuestas y enviar mensajes; las funciones escolares permanecerán bloqueadas hasta la activación. Después de la activación, vuelve a iniciar sesión para obtener acceso completo. Si olvidas la contraseña, contacta con el Director para restablecerla.';
 if (responseLang === 'it') return "Per accedere, usa il nome utente e la password creati durante la registrazione e seleziona il nome della scuola nell’elenco. Se l’account è in attesa dell’attivazione del proprietario, potrai soltanto aprire «Contattaci», leggere le risposte e inviare messaggi; le funzioni scolastiche resteranno bloccate fino all’attivazione. Dopo l’attivazione, accedi di nuovo per ottenere l’accesso completo. Se dimentichi la password, contatta il Direttore per reimpostarla.";
 return 'Sign in with the username and password you created during registration, and select your school from the list. If your account is waiting for the Owner to activate it, you can open Contact us, read replies and send messages only; school features remain locked until activation. After activation, sign in again for full access. If you forget your password, contact your school Director to reset it.';
 }

 const classroomControlsQuestion = [
    'zoom in', 'zoom out', 'enlarge video', 'minimize video', 'enlarge screen', 'shrink screen',
    'camera thumbnail', 'flip camera', 'self cam', 'self camera', 'mirror camera', 'reverse camera',
    'agrandir la vidéo', 'réduire la vidéo', 'zoom caméra', 'caméra inversée',
    'ampliar vídeo', 'reducir vídeo', 'voltear cámara', 'cámara frontal',
    'ingrandire video', 'ridurre video', 'capovolgere telecamera',
    'تكبير الشاشة', 'تصغير الشاشة', 'تكبير الفيديو', 'تصغير الفيديو', 'تكبير الكاميرا',
    'قلب الكاميرا', 'عكس الكاميرا', 'الكاميرا الأمامية', 'زووم'
  ].some((keyword) => q.includes(keyword));
  if (classroomControlsQuestion) {
    if (responseLang === 'ar') return 'داخل الصف المباشر: انقر على صورة الفيديو أو الصورة المصغّرة لتكبيرها، ثم انقر مرة أخرى للعودة إلى الحجم الطبيعي. استخدم أزرار الكاميرا والميكروفون لتشغيلهما أو إيقافهما. زر «Self Cam» يبدّل حالة كاميرتك، وزر «Flip Cam» يعكس اتجاه الصورة؛ ويتغير لون الزر لإظهار الاختيار الحالي.';
    if (responseLang === 'fr') return 'Dans la classe en direct, cliquez sur la vidéo ou sa vignette pour l’agrandir, puis cliquez de nouveau pour revenir à la taille normale. Utilisez les commandes de caméra et de microphone pour les activer ou les couper. « Self Cam » commande votre caméra et « Flip Cam » inverse l’image ; la couleur du bouton indique l’état sélectionné.';
    if (responseLang === 'es') return 'En el aula en directo, haz clic en el vídeo o en su miniatura para ampliarlo y vuelve a hacer clic para recuperar el tamaño normal. Usa los controles de cámara y micrófono para activarlos o desactivarlos. «Self Cam» controla tu cámara y «Flip Cam» invierte la imagen; el color del botón indica el estado seleccionado.';
    if (responseLang === 'it') return 'Nell’aula in diretta, fai clic sul video o sulla miniatura per ingrandirlo e fai clic di nuovo per tornare alle dimensioni normali. Usa i controlli della videocamera e del microfono per attivarli o disattivarli. «Self Cam» controlla la tua videocamera e «Flip Cam» capovolge l’immagine; il colore del pulsante mostra lo stato selezionato.';
    return 'In the live classroom, click the video or thumbnail to enlarge it, then click again to return to normal size. Use the camera and microphone controls to turn them on or off. Self Cam controls your camera, and Flip Cam mirrors the image; the button colour indicates the selected state.';
  }

  const privateChatQuestion = [
    'private chat', 'send private message', 'message a student', 'message students', 'chat with student',
    'send attachment', 'share attachment', 'message all students', 'chat all students', 'send to everyone',
    'group message', 'conversation with student', 'messagerie privée', 'message privé', 'envoyer à tous les élèves',
    'chat privado', 'mensaje privado', 'enviar a todos los estudiantes',
    'chat privato', 'messaggio privato', 'invia a tutti gli studenti',
    'المحادثة الخاصة', 'محادثة خاصة', 'رسالة خاصة', 'إرسال مرفق', 'ارسال مرفق',
    'إرسال للجميع', 'ارسال للجميع', 'كل الطلاب', 'جميع الطلاب', 'محادثة جميع الطلاب',
    'إرسال رسالة للطلاب', 'إرسال رسالة للطالب'
  ].some((keyword) => q.includes(keyword));
  if (privateChatQuestion) {
    if (responseLang === 'ar') return 'في الصف المباشر، اختر صورة الطالب لإرسال رسالة أو مرفق إليه وحده. لإرسال رسالة أو مرفق إلى جميع الطلاب، فعّل مربع «Chat all students»؛ ستُحدد صور جميع الطلاب ويُرسل المحتوى إلى الجميع. أزل التحديد أو اختر طالباً واحداً للعودة إلى المحادثة الفردية. تُعرض الرسائل مع اسم المرسل أو المستلم لتسهيل متابعة كل محادثة.';
    if (responseLang === 'fr') return 'Dans la classe en direct, sélectionnez la vignette d’un élève pour lui envoyer un message ou une pièce jointe en privé. Pour écrire à toute la classe, cochez « Chat all students » : toutes les vignettes sont sélectionnées et le message ou le fichier est envoyé à tous. Décochez cette option ou sélectionnez un seul élève pour revenir à une conversation individuelle. Les messages indiquent l’expéditeur et le destinataire.';
    if (responseLang === 'es') return 'En el aula en directo, selecciona la miniatura de un estudiante para enviarle un mensaje o archivo privado. Para escribir a toda la clase, marca «Chat all students»: se seleccionarán todas las miniaturas y el mensaje o archivo se enviará a todos. Desmarca la opción o selecciona a un solo estudiante para volver al chat individual. Los mensajes identifican al remitente y al destinatario.';
    if (responseLang === 'it') return 'Nell’aula in diretta, seleziona la miniatura di uno studente per inviargli un messaggio o un allegato privato. Per scrivere a tutta la classe, seleziona «Chat all students»: tutte le miniature verranno selezionate e il messaggio o il file sarà inviato a tutti. Deseleziona l’opzione o scegli un solo studente per tornare alla chat individuale. I messaggi indicano mittente e destinatario.';
    return 'In the live classroom, select one student’s thumbnail to send a private message or attachment to that student. To send to the whole class, check “Chat all students”; all student thumbnails become selected and the message or attachment is sent to everyone. Uncheck it or select one student to return to a one-to-one chat. Messages identify their sender and recipient.';
  }

  const lessonQuestion = ['saved lesson', 'saved lessons', 'recording', 'lesson', 'archive', 'ressource', 'ressources', 'leçon', 'lecon', 'cours enregistré', 'cours enregistrés', 'leçons enregistrées', 'clase guardada', 'clases guardadas', 'lección', 'lecciones guardadas', 'recursos guardados', 'lezione', 'lezioni salvate', 'lezioni registrate', 'risorse salvate', 'registrazione', 'دروس محفوظة', 'الدروس المحفوظة', 'درس', 'أرشيف', 'استرجاع الدروس'].some((keyword) => q.includes(keyword));
 if (lessonQuestion) {
 if (responseLang === 'ar') return 'لاسترجاع الدروس المحفوظة، سجّل الدخول وافتح غرفة الصف ثم اختر «الموارد التعليمية». اختر الأستاذ لعرض خانات الدروس والملفات التي نشرها. يمكن للمدرس تعديل موارده الخاصة فقط.';
 if (responseLang === 'fr') return "Pour retrouver les leçons enregistrées, connectez-vous, ouvrez la salle de classe puis choisissez « Ressources pédagogiques ». Sélectionnez l’éducateur pour consulter les leçons et fichiers publiés. Chaque éducateur ne peut modifier que ses propres ressources.";
 if (responseLang === 'es') return 'Para recuperar lecciones guardadas, inicia sesión, abre el aula y selecciona «Recursos educativos». Elige al educador para ver las lecciones y archivos publicados. Cada educador solo puede modificar sus propios recursos.';
 if (responseLang === 'it') return "Per recuperare le lezioni salvate, accedi, apri l'aula e seleziona «Risorse didattiche». Scegli l'educatore per vedere lezioni e file pubblicati. Ogni educatore può modificare solo le proprie risorse.";
 return 'To retrieve saved lessons, sign in, open the classroom, and select Learning Resources. Choose the educator to view published lesson slots and files. Each educator can edit only their own resources.';
 }

 const liveQuestion = ['live', 'broadcast', 'join class', 'join the class', 'classroom', 'direct', 'en direct', 'cours en direct', 'salle de diffusion', 'rejoindre le cours', 'en vivo', 'aula en vivo', 'clase en directo', 'unirse a la clase', 'diretta', 'lezione dal vivo', 'sala trasmissione', 'partecipa alla lezione', 'بث', 'مباشر', 'صف مباشر', 'الصف المباشر', 'غرفة الصف', 'غرفة البث', 'الانضمام للحصة'].some((keyword) => q.includes(keyword));
 if (liveQuestion) {
 if (responseLang === 'ar') return 'للدخول إلى الصف المباشر، سجّل الدخول بالحساب المفعّل والمسدد والمسجل في حصة الأستاذ نفسها. افتح «البث المباشر» واختر صفك. يبدأ الأستاذ البث أولاً، ويمكن للمدير مراقبة أي صف من لوحة التحكم ← إدارة الحصص.';
 if (responseLang === 'fr') return "Pour rejoindre un cours en direct, connectez-vous avec un compte activé, payé et inscrit à la même séance que l’éducateur. Ouvrez « Diffusion en direct » et choisissez votre classe. L’éducateur démarre la diffusion. Le Directeur peut surveiller toute classe depuis Tableau de bord → Gestion des cours.";
 if (responseLang === 'es') return 'Para entrar en una clase en directo, inicia sesión con una cuenta activada, pagada y asignada a la misma sesión del educador. Abre «Emisión en directo» y elige tu curso. El educador inicia la emisión. El Director puede supervisar cualquier clase desde Panel → Gestionar sesiones.';
 if (responseLang === 'it') return "Per entrare in una lezione dal vivo, accedi con un account attivato, pagato e assegnato alla stessa sessione dell'educatore. Apri «Diretta» e scegli la tua classe. L'educatore avvia la trasmissione. Il Direttore può monitorare qualsiasi classe da Pannello → Gestione lezioni.";
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
 if (responseLang === 'ar') return 'توجد ثلاث واجهات حسب نوع الحساب: الطالب، والأستاذ، والمدير. الطالب يسجّل الدخول ثم يفتح الصف أو غرفة البث المخصصة له، ويمكنه الانتقال إلى «الموارد التعليمية» لمشاهدة الدروس المحفوظة. الأستاذ يسجّل الدخول بحساب Educator ويفتح صفه المخصص لبدء البث وحفظ محاضراته. المدير يختار «دخول المدير» ثم يستخدم «لوحة المدير» لإدارة الحسابات والحصص ومراقبة الصفوف. استخدم حساب الدور الصحيح؛ صلاحيات كل واجهة تختلف.';
 if (responseLang === 'fr') return 'Agenda propose trois espaces selon le type de compte : Élève, Éducateur et Directeur. L’élève se connecte puis ouvre sa classe ou sa salle de diffusion attribuée ; « Ressources pédagogiques » permet de consulter les cours enregistrés. L’éducateur se connecte avec son compte Educator, ouvre sa propre classe, démarre la diffusion et enregistre ses leçons. Le Directeur choisit « Connexion Directeur », puis utilise le tableau de bord pour gérer les comptes, les cours et surveiller les classes. Utilisez le compte correspondant à votre rôle.';
 if (responseLang === 'es') return 'Agenda tiene tres espacios según el tipo de cuenta: Estudiante, Educador y Director. El estudiante inicia sesión y abre su aula o sala de emisión asignada; en «Recursos educativos» consulta las lecciones guardadas. El educador entra con su cuenta Educator, abre su propia aula, inicia la emisión y guarda sus lecciones. El Director selecciona «Acceso del Director» y usa el panel para gestionar cuentas, sesiones y supervisar las aulas. Utiliza la cuenta del rol que te corresponde.';
 if (responseLang === 'it') return 'Agenda offre tre aree in base al tipo di account: Studente, Educatore e Direttore. Lo studente accede e apre la propria aula o sala trasmissione assegnata; in «Risorse didattiche» consulta le lezioni salvate. L’educatore accede con il proprio account Educator, apre la sua aula, avvia la diretta e salva le lezioni. Il Direttore seleziona «Accesso Direttore» e usa il pannello per gestire account, sessioni e monitorare le aule. Usa l’account corrispondente al tuo ruolo.';
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
 if (responseLang === 'ar') return 'كل طالب مرتبط بأستاذ وصف محدد، ويختار الطالب الأستاذ/الحصة المتاحة أثناء التسجيل. يستطيع المدير تغيير تعيين الطالب لاحقاً من «لوحة المدير» ← «الحسابات» عبر قائمة الأستاذ، كما يمكنه تعديل تعيين جلسة الأستاذ. بعد التغيير، يدخل الطالب إلى الصف المرتبط بالتعيين الجديد.';
 if (responseLang === 'fr') return 'Chaque élève est lié à un éducateur et à une classe précise. L’élève choisit l’éducateur/la séance disponible lors de l’inscription. Le Directeur peut modifier cette affectation ensuite dans « Tableau de bord » → « Comptes », à l’aide de la liste des éducateurs, et modifier également la séance attribuée à un éducateur. L’élève rejoint ensuite la classe correspondant à la nouvelle affectation.';
 if (responseLang === 'es') return 'Cada estudiante está vinculado a un educador y a un aula concreta. Durante el registro, el estudiante elige el educador o la sesión disponible. El Director puede cambiar esa asignación después desde «Panel del Director» → «Cuentas», usando la lista de educadores, y también puede cambiar la sesión asignada a un educador. El estudiante entrará en el aula de la nueva asignación.';
 if (responseLang === 'it') return 'Ogni studente è collegato a un educatore e a una classe specifica. Durante la registrazione, lo studente sceglie l’educatore o la lezione disponibile. Il Direttore può modificare l’assegnazione da «Dashboard del Direttore» → «Account», usando l’elenco degli educatori, e può anche cambiare la lezione assegnata a un educatore. Lo studente accederà quindi alla classe della nuova assegnazione.';
 return 'Each student is linked to one assigned educator and classroom. During registration, the student chooses an available educator/session. The Director can later change that assignment in Director Dashboard → Accounts using the educator selector, and can also change an educator’s assigned session. The student then accesses the classroom linked to the new assignment.';
 }

 const directorManagementQuestion = [
 'director manage', 'manage accounts', 'director dashboard', 'reset password', 'change username',
 'change user name', 'change password', 'activate account', 'deactivate account', 'mark as paid',
 'renew account', 'student account management', 'educator account management', 'approve students', 'approve educators', 'activate students', 'activate educators', 'confirm registration', 'how to approve', 'how to activate', 'approve account', 'pending account', 'enable account',
 'gestion des comptes', 'réinitialiser le mot de passe', 'gestionar cuentas', 'restablecer contraseña',
 'gestione account', 'reimpostare password', 'إدارة الحسابات', 'لوحة المدير', 'تغيير اسم المستخدم',
 'تغيير كلمة المرور', 'إعادة تعيين كلمة المرور', 'تفعيل الحساب', 'تجديد الحساب', 'حالة الدفع', 'الموافقة على الطلاب', 'الموافقة على المعلمين', 'اعتماد الطلاب', 'اعتماد المعلمين', 'تفعيل الطلاب', 'تفعيل المعلمين', 'تفعيل حسابات الطلاب', 'تفعيل حسابات المعلمين', 'كيف يفعّل المدير', 'كيف يفعل المدير', 'تأكيد التسجيل', 'قبول طلب التسجيل', 'الحسابات المعلقة'
 ].some((keyword) => q.includes(keyword));
 if (directorManagementQuestion) {
 if (responseLang === 'ar') return 'لتأكيد حساب طالب أو معلم: سجّل الدخول كمدير، ثم افتح «لوحة المدير» ← «الحسابات». ابحث عن الحساب المطلوب، فعّل خانة «الحساب نشط»، وحدّث حالة الدفع عند تأكيد استلام الرسوم، ثم اضغط «حفظ جميع التغييرات». كرر ذلك لكل حساب. يستطيع المدير أيضاً تعديل الصف أو الحصة وتعيين الطالب للمعلم المناسب. أما تفعيل حساب مدير مدرسة جديدة فيتم من «مركز تحكم المالك» بواسطة المالك.';
 if (responseLang === 'fr') return 'Pour confirmer un compte élève ou éducateur : connectez-vous en tant que Directeur, ouvrez « Tableau de bord » → « Comptes », trouvez le compte, cochez « Compte actif », mettez à jour le statut de paiement lorsque le règlement est confirmé, puis cliquez sur « Enregistrer toutes les modifications ». Répétez pour chaque compte. Le Directeur peut également modifier la classe, la séance et l’affectation de l’élève. L’activation d’un nouveau compte Directeur est effectuée par le propriétaire dans le Centre de contrôle propriétaire.';
 if (responseLang === 'es') return 'Para confirmar una cuenta de estudiante o educador: inicia sesión como Director, abre «Panel del Director» → «Cuentas», busca la cuenta, activa la casilla «Cuenta activa», actualiza el estado de pago cuando el pago esté confirmado y pulsa «Guardar todos los cambios». Repite el proceso para cada cuenta. El Director también puede modificar el curso, la sesión y la asignación del estudiante. La activación de una nueva cuenta de Director la realiza el propietario desde el Centro de control del propietario.';
 if (responseLang === 'it') return 'Per confermare un account studente o educatore: accedi come Direttore, apri «Dashboard del Direttore» → «Account», trova l’account, attiva la casella «Account attivo», aggiorna lo stato di pagamento dopo averne confermato la ricezione e premi «Salva tutte le modifiche». Ripeti per ogni account. Il Direttore può anche modificare classe, lezione e assegnazione dello studente. L’attivazione di un nuovo account Direttore viene eseguita dal proprietario nel Centro di controllo del proprietario.';
 return 'To confirm a Student or Educator account, sign in as Director, open Director Dashboard → Accounts, find the account, check Account Active, update the payment status after confirming receipt, then select Save all changes. Repeat for each account. The Director can also change the student’s grade, session and educator assignment. The platform Owner activates new Director accounts from Owner Control Center.';
 }

 const classSizeQuestion = [
 'how many students', 'number of students', 'class size', 'students per class',
 'five students', '5 students', 'unlimited students', 'unlimited educators',
 'combien d’élèves', 'combien eleves', 'taille de classe', 'alumnos por clase',
 'estudiantes por clase', 'studenti per classe', 'quanti studenti',
 'عدد الطلاب', 'عدد التلاميذ', 'كم طالب', 'خمسة طلاب', '5 طلاب', 'عدد الأساتذة'
 ].some((keyword) => q.includes(keyword));
 if (classSizeQuestion) {
 if (responseLang === 'ar') return 'يمكن للمدرسة إنشاء أعداد غير محدودة من حسابات الطلاب والأساتذة؛ لا يوجد حد إجمالي ثابت لعدد الحسابات. متوسط التخطيط المعتاد هو نحو خمسة طلاب في الصف الواحد، لكنه متوسط إرشادي وليس سقفاً عاماً ثابتاً. يحدد المدير تنظيم الصفوف وفق ظروف المدرسة.';
 if (responseLang === 'fr') return 'L’établissement peut créer un nombre illimité de comptes élèves et éducateurs ; il n’existe pas de plafond global fixe pour les comptes. La moyenne habituelle visée est d’environ cinq élèves par classe, à titre indicatif et non comme une limite absolue. Le Directeur organise les classes selon les besoins de l’établissement.';
 if (responseLang === 'es') return 'La escuela puede crear un número ilimitado de cuentas de estudiantes y educadores; no existe un límite global fijo de cuentas. La referencia habitual es un promedio de unos cinco estudiantes por clase, no un máximo absoluto. El Director organiza las clases según las necesidades de la escuela.';
 if (responseLang === 'it') return 'La scuola può creare un numero illimitato di account per studenti ed educatori; non esiste un limite complessivo fisso agli account. Il riferimento medio è di circa cinque studenti per classe, come indicazione e non come limite assoluto. Il Direttore organizza le classi secondo le esigenze della scuola.';
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
 if (responseLang === 'ar') return 'غرفة الصف المباشر هي قاعة مؤتمر فيديو تجمع الأستاذ والطلاب المسجلين في صفه نفسه. يمكن للمشاركين الانضمام إلى البث المباشر واستخدام الكاميرا والميكروفون، كما تتوفر محادثة صفية لإرسال الرسائل والمرفقات المدعومة. يبدأ الأستاذ البث، وينضم الطلاب بعد تسجيل الدخول وتفعيل حساباتهم وتسديدها وتعيينهم إلى الصف الصحيح. يستطيع المدير دخول صفوف مدرسته لمراقبتها.';
 if (responseLang === 'fr') return 'La salle de classe en direct est une salle de visioconférence réunissant l’éducateur et les élèves inscrits à sa classe. Les participants peuvent rejoindre la diffusion, utiliser la caméra et le microphone, et communiquer par le chat de classe avec les pièces jointes prises en charge. L’éducateur démarre la diffusion ; les élèves rejoignent après connexion, activation, confirmation du paiement et affectation à la bonne classe. Le Directeur peut entrer dans les classes de son établissement pour les surveiller.';
 if (responseLang === 'es') return 'El aula en directo es una sala de videoconferencia que reúne al educador y a los estudiantes inscritos en su clase. Los participantes pueden unirse a la emisión, utilizar la cámara y el micrófono y comunicarse mediante el chat del aula con archivos adjuntos compatibles. El educador inicia la emisión; los estudiantes se unen después de iniciar sesión, activar la cuenta, confirmar el pago y estar asignados al aula correcta. El Director puede entrar en las clases de su escuela para supervisarlas.';
 if (responseLang === 'it') return 'L’aula in diretta è una sala di videoconferenza che riunisce l’educatore e gli studenti iscritti alla sua classe. I partecipanti possono entrare nella diretta, usare videocamera e microfono e comunicare tramite la chat della classe con allegati supportati. L’educatore avvia la trasmissione; gli studenti accedono dopo il login, l’attivazione, la conferma del pagamento e l’assegnazione alla classe corretta. Il Direttore può entrare nelle classi della propria scuola per monitorarle.';
 return 'The live classroom is a video-conference room for an educator and the students registered in that educator’s class. Participants can join the live session, use camera and microphone controls, and communicate through classroom chat with supported attachments. The educator starts the broadcast; students join after signing in, account activation, payment confirmation, and assignment to the correct class. The Director can enter any class in their own school to monitor it.';
 }

 const architectureQuestion = ['separate school', 'another school', 'school data', 'data isolation', 'tenant', 'privacy', 'confidentiality', 'écoles séparées', 'autre établissement', 'confidentialité', 'escuelas separadas', 'otra escuela', 'privacidad', 'scuole separate', 'altra scuola', 'riservatezza', 'مدارس منفصلة', 'مدرسة أخرى', 'خصوصية البيانات', 'عزل البيانات'].some((keyword) => q.includes(keyword));
 if (architectureQuestion) {
 if (responseLang === 'ar') return 'تعمل المنصة بنظام مدارس مستقلة: لكل مدير مدرسة خاصة به ومعرّف مدرسة مستقل، وطلاب ومدرسون وحصص وموارد تعليمية وأسعار منفصلة. لا يستطيع مدير الوصول إلى حسابات أو ملفات مدرسة أخرى. استخدم رابط المدرسة الخاص بها لتسجيل الطلاب والمدرسين.';
 if (responseLang === 'fr') return "La plateforme fonctionne avec des établissements séparés : chaque Directeur possède son propre établissement et identifiant, ses élèves, éducateurs, cours, ressources et tarifs. Un Directeur ne peut pas accéder aux comptes ni aux fichiers d’un autre établissement. Utilisez le lien propre à votre établissement pour les inscriptions.";
 if (responseLang === 'es') return 'La plataforma utiliza escuelas independientes: cada Director tiene su propia escuela e identificador, estudiantes, educadores, clases, recursos y tarifas. Un Director no puede acceder a las cuentas ni archivos de otra escuela. Utiliza el enlace específico de tu escuela para registrarte.';
 if (responseLang === 'it') return "La piattaforma utilizza scuole separate: ogni Direttore ha la propria scuola e il proprio identificativo, studenti, educatori, lezioni, risorse e tariffe. Un Direttore non può accedere agli account o ai file di un'altra scuola. Usa il link specifico della tua scuola per registrarti.";
 return 'Agenda uses separate school spaces: every Director has an independently identified school, its own students, educators, classes, saved learning resources, and pricing. A Director cannot access another school’s accounts or files. Use your school-specific link when registering.';
 }


 const paymentQuestion = [
 'how do i pay', 'how can i pay', 'payment method', 'make a payment', 'pay for', 'pay online',
 'suyool', 'payer', 'paiement', 'pagar', 'pago', 'pagamento',
 'كيف أدفع', 'كيف ادفع', 'طريقة الدفع', 'طرق الدفع', 'الدفع', 'تسديد', 'ادفع'
 ].some((keyword) => q.includes(keyword));
 if (paymentQuestion) {
 if (responseLang === 'ar') return 'للدفع، افتح قسم «الدفع» في خطوات التسجيل واتبع رابط Suyool وتعليماته. لا يعالج هذا المساعد المدفوعات ولا يؤكدها؛ يؤكد مدير المدرسة حالة الدفع من لوحة المدير. لا ترسل بيانات البطاقة أو كلمات المرور في المحادثة.';
 if (responseLang === 'fr') return 'Pour payer, ouvrez la section « Paiement » pendant l’inscription et suivez le lien et les instructions de Suyool. Cet assistant ne traite ni ne vérifie les paiements ; le Directeur confirme le statut depuis son tableau de bord. Ne partagez jamais vos données de carte ou mots de passe dans le chat.';
 if (responseLang === 'es') return 'Para pagar, abre la sección «Pago» durante el registro y sigue el enlace y las instrucciones de Suyool. Este asistente no procesa ni verifica pagos; el Director confirma el estado desde su panel. No compartas datos de tarjeta ni contraseñas en el chat.';
 if (responseLang === 'it') return 'Per pagare, apri la sezione «Pagamento» durante la registrazione e segui il link e le istruzioni di Suyool. Questo assistente non elabora né verifica i pagamenti; il Direttore conferma lo stato dal proprio pannello. Non condividere dati della carta o password nella chat.';
 return 'To pay, open the Payment section during registration and follow the Suyool link and instructions. This assistant does not process or verify payments; your school Director confirms payment status in the Director Dashboard. Never share card details or passwords in chat.';
 }

 const usContactQuestion = [
    'contact us', 'message us', 'contact the us', 'talk to us', 'message the owner',
    'contact platform owner', 'write to the us', 'us support',
    'nous contacter', 'nous écrire', 'contacter le propriétaire',
    'contactarnos', 'escribir al fundador', 'contactar al propietario',
    'contattarci', 'scrivere al fondatore', 'contattare il proprietario',
    'تواصل معنا', 'اتصل بالمؤسس', 'مراسلة المؤسس', 'تواصل معنا',
    'مراسلة المالك', 'كيف أتواصل مع المؤسس', 'كيف اتواصل مع المالك'
  ].some((keyword) => q.includes(keyword));
  if (usContactQuestion) {
    if (responseLang === 'ar') return 'افتح «المساعد الذكي» واضغط زر «تواصل معنا» الكامل الظاهر فوق خانة السؤال. سجّل الدخول بحسابك أولاً لإرسال الرسالة ومتابعة الردود. إذا كان حسابك بانتظار التفعيل، يمكنك استخدام هذه المحادثة وحدها حتى يفعّله المالك. تظهر الرسائل الواردة للمؤسس في مركز تحكم المالك ضمن قوائم المديرين والمعلمين والطلاب.';
    if (responseLang === 'fr') return 'Ouvrez l’« Assistant IA » et cliquez sur le bouton « Contactez-nous », affiché en pleine largeur au-dessus du champ de question. Connectez-vous d’abord pour envoyer un message et suivre les réponses. Si votre compte attend son activation, cette conversation reste disponible jusqu’à l’activation par le propriétaire. Les messages reçus apparaissent dans le Centre de contrôle du propriétaire, dans les listes des directeurs, éducateurs et élèves.';
    if (responseLang === 'es') return 'Abre el «Asistente de IA» y pulsa el botón «Contáctanos», que aparece a todo lo ancho encima del campo de preguntas. Primero inicia sesión para enviar mensajes y consultar las respuestas. Si tu cuenta está pendiente de activación, podrás usar este chat hasta que el propietario la active. Los mensajes recibidos aparecen en el Centro de control del propietario, en las listas de directores, educadores y estudiantes.';
    if (responseLang === 'it') return 'Apri l’«Assistente IA» e premi il pulsante «Contattaci», visualizzato a tutta larghezza sopra il campo della domanda. Accedi prima per inviare messaggi e leggere le risposte. Se l’account è in attesa di attivazione, questa chat resta disponibile finché il proprietario non lo attiva. I messaggi ricevuti appaiono nel Centro di controllo del proprietario, negli elenchi di direttori, educatori e studenti.';
    return 'Open the AI Assistant and select the full-width Contact us button above the question field. Sign in first to send a message and follow replies. If your account is awaiting activation, this chat remains available until the Owner activates it. Incoming messages appear in Owner Control Center under the Directors, Educators and Students lists.';
  }

  const contactQuestion = [
 'contact', 'contact us', 'contact details', 'support', 'help desk', 'helpdesk', 'email address',
 'phone number', 'telephone', 'whatsapp', 'reach the school', 'contacter', 'coordonnées',
 'assistance', 'contacto', 'soporte', 'teléfono', 'telefono', 'contatti', 'assistenza',
 'numero di telefono', 'اتصل', 'تواصل', 'التواصل', 'رقم الهاتف', 'رقم التواصل', 'البريد الإلكتروني'
 ].some((keyword) => q.includes(keyword));
 if (contactQuestion) {
 if (responseLang === 'ar') return 'للمساعدة المتعلقة بحسابك أو التفعيل أو الصفوف أو الرسوم، تواصل مع مدير مدرستك عبر بيانات الاتصال التي زودتك بها المدرسة. لا يعرض هذا المساعد أرقاماً أو عناوين اتصال خاصة غير متاحة للعامة. وللاستفسارات العامة عن منصة Agenda، استخدم قناة التواصل الرسمية التي حصلت منها على رابط المنصة.';
 if (responseLang === 'fr') return 'Pour toute aide concernant votre compte, son activation, les cours ou les frais, contactez le Directeur de votre établissement avec les coordonnées fournies par l’école. Cet assistant ne divulgue pas de numéros ou adresses privés. Pour les demandes générales sur Agenda, utilisez le canal officiel par lequel vous avez reçu le lien de la plateforme.';
 if (responseLang === 'es') return 'Para obtener ayuda con tu cuenta, activación, clases o tarifas, contacta con el Director de tu escuela mediante los datos de contacto que te proporcionó el centro. Este asistente no inventa ni divulga números o direcciones privadas. Para consultas generales sobre Agenda, utiliza el canal oficial por el que recibiste el enlace de la plataforma.';
 if (responseLang === 'it') return 'Per assistenza con account, attivazione, lezioni o tariffe, contatta il Direttore della tua scuola tramite i recapiti forniti dall’istituto. Questo assistente non inventa né divulga numeri o indirizzi privati. Per richieste generali su Agenda, usa il canale ufficiale tramite cui hai ricevuto il link della piattaforma.';
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
 const responseLanguage = detectChatLanguage(selectedLanguageQuestion, currentLang);

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
 const savedAnswer = getSavedResponse(selectedLanguageQuestion, currentSchoolContext, true, responseLanguage);
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
 const systemPrompt = `You are the AI academic assistant for Agenda.

HIGHEST-PRIORITY LANGUAGE RULES:
- The application supports Arabic, English, French, Spanish, and Italian.
- Detect the language of the user's latest message and answer in that same language by default.
- If the user explicitly asks for a response language (for example, "Please repeat in Arabic"), follow that request even when it differs from the language of the question or the interface.
- For Arabic, write fluent, natural Arabic in Arabic script. For French, Spanish, and Italian, use fluent natural language with correct spelling and accents.
- Never claim that Agenda supports English only. Never refuse a language from the five supported languages.
- Do not let older assistant messages or earlier language choices override the latest user's request.
- Use the interface language (${languageNames[currentLang]}) only when the latest message is too short or ambiguous to identify a language.

CANONICAL AGENDA KNOWLEDGE (always available; do not rely on previous chat messages to remember these facts):
${AGENDA_ASSISTANT_KNOWLEDGE}
RECENT CONVERSATION (use only to understand follow-up references; the latest user message determines the answer language):
${recentConversation || '(No previous chat messages.)'}
Platform constraints:
- Use the selected school's live configuration for its name, educators, and sessions. The default student rate is USD 125 per session and may be adjusted by the Director; users should confirm the current rate with their Director.
- Do not claim a fixed platform-wide price or timetable. Do not invent payment methods, schedules, account credentials, or school records.
- Explain academic concepts, official curricula, homework, camera exercise submissions, and classroom navigation.
- Answer in the language used in the latest question. Cover Student, Educator, Director, registration, activation, lessons, live classroom, camera controls, chat, and payment procedures.
- When a question is ambiguous, ask one concise clarification instead of returning an unrelated or empty answer.
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
`;

 const response = await generateAIContent([
 { role: 'system', parts: [{ text: systemPrompt }] },
 { role: 'user', parts: [{ text: selectedLanguageQuestion }] },
 ], { maxOutputTokens: 1024 });

 // The system prompt already requires the selected output language.
 // The model answers directly in the requested language; no translation pass is needed.
 reply = response.text?.trim() || '';
 } catch (e) {
 console.warn('AI chat error (diagnostic):', e instanceof Error ? e.message : String(e));
 }
 }

 // Do not disguise an upstream/API failure as an AI answer. Restore the
 // question so the user can retry, and show a clear localized service error.
 if (!reply) {
 setInputText(text);
 if (responseLanguage === 'ar') {
 reply = 'تعذر الاتصال بخدمة الذكاء الاصطناعي حالياً. احتفظنا بسؤالك في خانة الكتابة؛ يرجى المحاولة مجدداً بعد قليل.';
 } else if (responseLanguage === 'fr') {
 reply = 'Le service IA est momentanément inaccessible. Votre question a été conservée dans le champ de saisie ; veuillez réessayer dans un instant.';
 } else if (responseLanguage === 'es') {
 reply = 'No se pudo conectar con el servicio de IA. Tu pregunta se ha conservado en el campo de texto; inténtalo de nuevo en unos instantes.';
 } else if (responseLanguage === 'it') {
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
 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-2 sm:p-4" onClick={() => setIsOpen(false)}>
 <div role="dialog" aria-modal="true" aria-label={currentLang === 'ar' ? 'المساعد الذكي' : currentLang === 'fr' ? 'Assistant IA' : currentLang === 'es' ? 'Asistente de IA' : currentLang === 'it' ? 'Assistente IA' : 'AI Assistant'} onClick={(event) => event.stopPropagation()} className="relative flex h-[min(88dvh,740px)] max-h-[calc(100dvh-1rem)] w-full max-w-[460px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-start shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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

 {!isOwner && (
  <div className="shrink-0 border-t border-slate-100 bg-white px-3 pt-2">
   <button type="button" onClick={() => setUsMode(true)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-900 transition hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
    <span aria-hidden="true">✉</span>
    <span>{currentLang === 'ar' ? 'تواصل معنا' : currentLang === 'fr' ? 'Contactez-nous' : currentLang === 'es' ? 'Contáctanos' : currentLang === 'it' ? 'Contattaci' : 'Contact us'}</span>
   </button>
  </div>
 )}

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
 {usMode && (
  <div className="absolute inset-0 z-[5] flex flex-col bg-white">
   <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-950 p-4 text-white">
    <div><h5 className="text-sm font-black">{currentLang === 'ar' ? 'تواصل معنا' : currentLang === 'fr' ? 'Contactez-nous' : currentLang === 'es' ? 'Contáctanos' : currentLang === 'it' ? 'Contattaci' : 'Contact us'}</h5>
    <p className="mt-0.5 text-[10px] text-slate-300">{currentLang === 'ar' ? 'أرسل رسالتك وتابع ردنا هنا.' : currentLang === 'fr' ? 'Envoyez-nous un message et suivez notre réponse ici.' : currentLang === 'es' ? 'Envíanos tu mensaje y consulta nuestra respuesta aquí.' : currentLang === 'it' ? 'Scrivici e consulta qui la nostra risposta.' : 'Send us a message and follow our reply here.'}</p></div>
    <div className="flex shrink-0 items-center gap-2">
     <button type="button" onClick={() => { setUsMode(false); setIsOpen(false); if (chatOnlyMode) { onFounderBackHome?.(); if (!onFounderBackHome) window.location.replace('https://agenda.mycamp.workers.dev/'); } }} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold">{currentLang === 'ar' ? 'عودة' : currentLang === 'fr' ? 'Retour' : currentLang === 'es' ? 'Volver' : currentLang === 'it' ? 'Indietro' : 'Back'}</button>
     <button type="button" onClick={() => { setUsMode(false); setIsOpen(false); }} aria-label={chatLabels.close} title={chatLabels.close} className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"><X className="h-4 w-4"/></button>
    </div>
   </div>
   <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
    {!account || !sessionToken ? (
      <div className="mx-3 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-semibold leading-6 text-amber-950" role="status">
       {currentLang === 'ar' ? 'أنشئ حساباً لتتمكن من الدردشة معنا.' : currentLang === 'fr' ? 'Créez un compte pour discuter avec nous.' : currentLang === 'es' ? 'Crea una cuenta para chatear con nosotros.' : currentLang === 'it' ? 'Crea un account per chattare con noi.' : 'Create an account to chat with us.'}
      </div>
) : (
     <>
      {usMessages.map((msg) => <div key={msg.id} className={msg.senderRole === 'owner' ? 'flex justify-start' : 'flex justify-end'}>
       <div className={msg.senderRole === 'owner' ? 'max-w-[88%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 shadow-sm' : 'max-w-[88%] rounded-2xl rounded-br-sm bg-indigo-700 px-3 py-2.5 text-xs text-white shadow-sm'}>
        <p className="mb-1 text-[9px] font-black opacity-70">{msg.senderRole === 'owner' ? (currentLang === 'ar' ? 'نحن' : currentLang === 'fr' ? 'Nous' : currentLang === 'es' ? 'Nosotros' : currentLang === 'it' ? 'Noi' : 'Us') : (account.fullName || account.username)}</p>
        <p className="whitespace-pre-wrap">{msg.message}</p>
        <time className="mt-1 block text-end text-[9px] opacity-60">{new Date(msg.createdAt).toLocaleString(chatLocale[currentLang], { dateStyle: 'short', timeStyle: 'short' })}</time>
       </div>
      </div>)}
      {usMessages.length === 0 && !usError && <p className="py-8 text-center text-xs text-slate-400">{currentLang === 'ar' ? 'لا توجد رسائل بعد. اكتب رسالتك الأولى أدناه.' : currentLang === 'fr' ? 'Aucun message. Écrivez le premier ci-dessous.' : currentLang === 'es' ? 'Todavía no hay mensajes. Escribe el primero abajo.' : currentLang === 'it' ? 'Nessun messaggio. Scrivi il primo qui sotto.' : 'No messages yet. Write the first message below.'}</p>}
      {usError && <p role="alert" className="rounded-lg bg-rose-50 p-2 text-[11px] text-rose-700">{usError}</p>}
     </>
    )}
   </div>
   {account && sessionToken && <form onSubmit={(event) => { event.preventDefault(); void submitFounderMessage(); }} className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-white p-3">
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
     <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">{currentLang === 'ar' ? 'السؤال' : currentLang === 'fr' ? 'Question' : currentLang === 'es' ? 'Pregunta' : currentLang === 'it' ? 'Domanda' : 'Question'}</span>
     <textarea value={usDraft} onChange={(event) => setUsDraft(event.target.value)} maxLength={4000} rows={2} placeholder={currentLang === 'ar' ? 'اكتب سؤالك أو رسالتك...' : currentLang === 'fr' ? 'Écrivez votre question ou message...' : currentLang === 'es' ? 'Escribe tu pregunta o mensaje...' : currentLang === 'it' ? 'Scrivi la tua domanda o il messaggio...' : 'Write your question or message...'} className="min-h-14 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs outline-indigo-600" />
    </label>
    <button type="submit" disabled={!usDraft.trim() || usBusy} className="rounded-xl bg-indigo-700 p-3 text-white disabled:opacity-40" aria-label={currentLang === 'ar' ? 'إرسال' : 'Send'}><Send className="h-4 w-4"/></button>
   </form>}
  </div>
 )}

 </div>
 </div>
 )}
 </>
 );
};
