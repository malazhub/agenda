import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { GoogleGenAI } from '@google/genai';
import { getSchoolPublicContext } from '../services/cloudflareApi';
import type { SchoolPublicContext } from '../services/cloudflareApi';
import { LEBANESE_GRADE_LEVELS } from '../data/mockGradesAndSessions';
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
  'Agenda is an education and school-management platform for students, educators, and school Directors.',
  'Students use their school-specific link to register, sign in, join their assigned live classes, and access saved learning resources.',
  'Educators manage and deliver their assigned classes, start live broadcasts, and upload or edit only their own lesson/resource slots.',
  'Directors manage their own school from the Director Dashboard. They manage student and educator accounts, activate accounts, configure classes and grade-specific monthly prices, and monitor every classroom belonging to their school.',
  'Live-class access requires an activated, paid student account assigned to the same educator session. The educator must start the broadcast before the student can join.',
  'Every Director has a separate school tenant and school ID. Student accounts, educator accounts, classes, saved educator lessons, and grade-specific prices are isolated by school. A Director cannot access another school\'s accounts or files. The school-specific share link selects the school; there is no public school dropdown.',
  'Registration: open the correct school link, choose Student or Educator, enter the requested details, create a username and password, and select an available grade and educator/session. The Director activates the account.',
  'Sign-in uses the username and password created during registration. A user who forgets a password must ask their school Director to reset it. Never ask the user to share a password.',
  'Saved lessons: sign in, open the classroom, choose Learning Resources, and select the educator to view their published lessons and files.',
  'Monthly school fees are configured by the Director for each grade. The default is USD 125 per student per month unless that school has saved a different grade rate. Always use the live school configuration for actual prices and distinguish monthly school fees from other fees.',
  'An independent Agenda copy is available for a one-time USD 150 price. The purchaser becomes the Director of that separate copy and can manage its school name, educators, students, classes, saved lessons, monthly grade pricing, and classroom monitoring/delivery. The copy and its data remain isolated from other schools. This is not the monthly student fee. The AI chat does not process payments.',
  'To rename a school, sign in from the Director Login card, open Director Dashboard > Accounts, edit the School name field, and save. The new name updates the platform branding for that school.',
  'The school context supplied with each request is authoritative for that school\'s name, educators, sessions, and saved grade prices. Never invent school records, credentials, schedules, or custom prices, and never disclose private data or information from another school.',
  'The application supports Arabic, English, French, Spanish, and Italian. All user-visible questions and assistant answers must follow the currently selected language.'
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
  const getSavedResponse = (query: string, context = schoolContext): string | null => {
    const q = query.toLowerCase();

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
      'présentation', 'présentez', 'à propos', 'comment naviguer', 'changer le nom de l’école', 'prix d’une copie',
      'renommer mon école', 'ma propre copie', 'ma propre version', 'acheter une copie',
      'presentación', 'sobre agenda', 'cómo navegar', 'como navegar', 'cambiar el nombre de la escuela',
      'mi propia copia', 'obtener una copia', 'comprar una copia', 'precio de una copia',
      'presentazione', 'informazioni su agenda', 'come navigare', 'cambiare il nome della scuola',
      'la mia copia', 'ottenere una copia', 'acquistare una copia', 'prezzo di una copia',
      'شرح التطبيق', 'نبذة عن التطبيق', 'ما هو أجندة', 'كيف أتنقل', 'كيفية التنقل',
      'تغيير اسم المدرسة', 'تغيير اسم مدرستي', 'نسختي الخاصة', 'نسخة خاصة', 'شراء نسخة', 'سعر النسخة', 'ثمن النسخة'
    ].some((keyword) => q.includes(keyword));

    if (applicationOverviewQuestion) {
      if (currentLang === 'ar') return [
        'نبذة عن Agenda:',
        'Agenda منصة تعليمية وإدارية للمدارس. تتيح للطلاب الوصول إلى الصفوف المباشرة والدروس والموارد التعليمية المحفوظة، وللمعلمين تقديم الحصص وإدارة موادهم، وللمدير إدارة المدرسة ومراقبة الصفوف.',
        'تغيير اسم المدرسة: سجّل الدخول من بطاقة «دخول المدير» في الشاشة الرئيسية، ثم افتح «لوحة المدير» ← «الحسابات». غيّر حقل «اسم المدرسة» واضغط «حفظ». سيظهر الاسم الجديد في رأس المنصة وفي هوية رابط المدرسة.',
        'التنقل: يستخدم الطلاب «غرفة البث» للدخول إلى الحصة المباشرة المخصصة لهم عندما يبدأ الأستاذ البث، ثم يفتحون «الموارد التعليمية» لاسترجاع الدروس والملفات المحفوظة. يفتح المعلم غرفته من «غرفة البث» ويبدأ الحصة. ومن «لوحة المدير» ← «الحسابات» يدير المدير الطلاب والمعلمين، ومن «إدارة الحصص» يضيف الحصص ويحدد السعر الشهري لكل صف ويراقب الصفوف.',
        'نسختك الخاصة: يمكن لأي مستخدم الحصول على نسخة مستقلة من Agenda مقابل 150 دولاراً أمريكياً. يصبح صاحب النسخة مديرها، ويمكنه إدارة مدرسته واسمها ومعلميها وطلابها وحصصها ودروسها المحفوظة وأسعارها الشهرية، ومراقبة الحصص وتقديمها. وتبقى مدرسته وبياناتها مستقلة عن مدارس المديرين الآخرين.',
        'لطلب نسخة مستقلة، تواصل مع إدارة Agenda؛ هذه المحادثة لا تعالج المدفوعات.'
      ].join('\n\n');
      if (currentLang === 'fr') return [
        'Présentation d’Agenda :',
        'Agenda est une plateforme éducative et de gestion scolaire. Les élèves y accèdent aux cours en direct et aux ressources enregistrées, les éducateurs donnent leurs cours et gèrent leurs supports, et le Directeur administre son établissement et surveille les classes.',
        'Renommer votre établissement : connectez-vous avec la carte « Connexion Directeur » sur l’écran principal, puis ouvrez « Tableau de bord » → « Comptes ». Modifiez le champ « Nom de l’établissement » et cliquez sur « Enregistrer ». Le nouvel intitulé apparaît dans l’en-tête de la plateforme et l’identité du lien de l’établissement.',
        'Navigation : les élèves ouvrent « Salle de diffusion » pour rejoindre leur cours attribué lorsque l’éducateur démarre la diffusion, puis « Ressources pédagogiques » pour retrouver les leçons et fichiers enregistrés. Les éducateurs ouvrent leur salle depuis « Salle de diffusion » et démarrent le cours. Dans « Tableau de bord » → « Comptes », le Directeur gère les élèves et les éducateurs ; dans « Gestion des cours », il ajoute des cours, fixe le tarif mensuel de chaque classe et surveille les salles.',
        'Votre propre copie : tout utilisateur peut obtenir une copie indépendante d’Agenda au prix de 150 USD. L’acheteur en devient le Directeur et peut gérer son établissement, son nom, ses éducateurs, ses élèves, ses cours, ses leçons enregistrées et ses tarifs mensuels, ainsi que surveiller et animer les cours. Son établissement et ses données restent séparés de ceux des autres Directeurs.',
        'Pour demander votre copie indépendante, contactez l’administration d’Agenda ; cette conversation ne traite pas les paiements.'
      ].join('\n\n');
      if (currentLang === 'es') return [
        'Presentación de Agenda:',
        'Agenda es una plataforma educativa y de gestión escolar. Los estudiantes acceden a clases en directo y recursos guardados; los educadores imparten clases y gestionan sus materiales; y el Director administra su escuela y supervisa las aulas.',
        'Cambiar el nombre de la escuela: inicia sesión desde la tarjeta «Acceso del Director» en la pantalla principal y abre «Panel del Director» → «Cuentas». Cambia el campo «Nombre de la escuela» y pulsa «Guardar». El nuevo nombre aparecerá en el encabezado de la plataforma y en la identidad del enlace escolar.',
        'Navegación: los estudiantes abren «Sala de emisión» para entrar en la sesión que tienen asignada cuando el educador inicia la emisión y después seleccionan «Recursos educativos» para recuperar lecciones y archivos guardados. Los educadores abren su aula desde «Sala de emisión» e inician la clase. En «Panel del Director» → «Cuentas», el Director gestiona estudiantes y educadores; en «Gestionar sesiones» añade clases, establece la tarifa mensual de cada curso y supervisa las aulas.',
        'Tu propia copia: cualquier usuario puede obtener una copia independiente de Agenda por 150 USD. El comprador se convierte en el Director de esa copia y puede gestionar su escuela, el nombre, los educadores, los estudiantes, las clases, las lecciones guardadas y las tarifas mensuales, además de supervisar e impartir las clases. Su escuela y sus datos permanecen separados de los de otros Directores.',
        'Para solicitar tu copia independiente, contacta con la administración de Agenda; este chat no procesa pagos.'
      ].join('\n\n');
      if (currentLang === 'it') return [
        'Presentazione di Agenda:',
        'Agenda è una piattaforma educativa e di gestione scolastica. Gli studenti accedono alle lezioni in diretta e alle risorse salvate; gli educatori tengono le lezioni e gestiscono i propri materiali; il Direttore amministra la scuola e monitora le classi.',
        'Rinominare la scuola: accedi dalla scheda «Accesso Direttore» nella schermata principale, quindi apri «Dashboard del Direttore» → «Account». Modifica il campo «Nome della scuola» e premi «Salva». Il nuovo nome apparirà nell’intestazione della piattaforma e nell’identità del link della scuola.',
        'Navigazione: gli studenti aprono «Sala trasmissione» per entrare nella lezione loro assegnata quando l’educatore avvia la diretta, poi scelgono «Risorse didattiche» per recuperare lezioni e file salvati. Gli educatori aprono la propria aula da «Sala trasmissione» e avviano la lezione. In «Dashboard del Direttore» → «Account», il Direttore gestisce studenti ed educatori; in «Gestione lezioni» aggiunge lezioni, imposta la tariffa mensile per ogni classe e monitora le aule.',
        'La tua copia: qualsiasi utente può ottenere una copia indipendente di Agenda al prezzo di 150 USD. L’acquirente diventa il Direttore di quella copia e può gestire la propria scuola, il nome, gli educatori, gli studenti, le lezioni, i contenuti salvati e le tariffe mensili, oltre a monitorare e tenere le lezioni. La scuola e i relativi dati restano separati da quelli degli altri Direttori.',
        'Per richiedere la tua copia indipendente, contatta l’amministrazione di Agenda; questa chat non gestisce pagamenti.'
      ].join('\n\n');
      return [
        'About Agenda:',
        'Agenda is an education and school-management platform. Students can join live classes and retrieve saved learning resources; educators deliver classes and manage their materials; and the Director manages the school and monitors classrooms.',
        'Rename your school: sign in using the «Director Login» card on the main screen, then open «Director Dashboard» → «Accounts». Edit the «School name» field and select «Save». The new name appears in the platform header and in your school link identity.',
        'Navigation: students open «Broadcast Room» to join their assigned class after the educator starts broadcasting, then choose «Learning Resources» to retrieve saved lessons and files. Educators open their classroom from «Broadcast Room» and start the class. In «Director Dashboard» → «Accounts», the Director manages students and educators; in «Manage Sessions», the Director adds classes, sets each grade’s monthly rate, and monitors classrooms.',
        'Your own copy: any user can obtain an independent copy of Agenda for USD 150. The purchaser becomes the Director of that copy and can manage the school and its name, educators, students, classes, saved lessons, and monthly pricing, as well as monitor and deliver classes. Their school and data remain separate from those of other Directors.',
        'To request an independent copy, contact the Agenda administration team; this chat does not process payments.'
      ].join('\n\n');
    }
    const prices = context?.prices || [];
    const monthlyPriceQuestion = [
      'price', 'pricing', 'rate', 'rates', 'cost', 'fee', 'fees', 'usd', 'dollar', 'payment',
      'tarif', 'tarifa', 'tarifas', 'prix', 'precio', 'precios', 'prezzo', 'prezzi', 'tariffa', 'tariffe', 'coût', 'cout', 'costo', 'coste', 'quanto', 'cuanto', 'cuánto', 'how much', 'payer', 'mensuel', 'mensual', 'mensile',
      'month', 'monthly', 'per month', 'شهري', 'سعر', 'اسعار', 'أسعار', 'تكلف', 'بكم', 'دولار', 'دفع'
    ].some((keyword) => q.includes(keyword));

    if (monthlyPriceQuestion) {
      const priceMap = new Map(prices.map((price) => [price.gradeId, price.monthlyRateUsd]));
      const gradeNumber = q.match(/(?:grade|grado|curso|classe|class)\s*(\d{1,2})/)?.[1];
      const relevantGrades = gradeNumber
        ? LEBANESE_GRADE_LEVELS.filter((grade) =>
            [grade.name.en, grade.name.fr, grade.name.it, grade.name.es]
              .some((name) => name?.match(new RegExp(`\\b${gradeNumber}\\b`)))
          )
        : LEBANESE_GRADE_LEVELS.filter((grade) => priceMap.has(grade.id));
      const rateLines = relevantGrades.length
        ? relevantGrades.map((grade) => `${grade.name[currentLang] || grade.name.en}: ${priceMap.get(grade.id) ?? context?.defaultMonthlyRateUsd ?? 125} USD`).join('\n')
        : currentLang === 'ar'
          ? `${context?.defaultMonthlyRateUsd ?? 125} دولار شهرياً (السعر الافتراضي)`
          : currentLang === 'fr'
            ? `${context?.defaultMonthlyRateUsd ?? 125} USD par mois (tarif par défaut)`
            : currentLang === 'es'
              ? `${context?.defaultMonthlyRateUsd ?? 125} USD al mes (tarifa predeterminada)`
              : currentLang === 'it'
                ? `${context?.defaultMonthlyRateUsd ?? 125} USD al mese (tariffa predefinita)`
                : `${context?.defaultMonthlyRateUsd ?? 125} USD per month (default rate)`;
      if (currentLang === 'ar') return `المدرسة: ${context?.schoolName || schoolName || 'Agenda'}\nالأسعار الشهرية المعتمدة حسب الصف:\n${rateLines}\nالسعر الافتراضي للصف الذي لم يحدد المدير سعره هو 125 دولاراً شهرياً. هذه الأسعار خاصة بمدرستك.`;
      if (currentLang === 'fr') return `Établissement : ${context?.schoolName || schoolName || 'Agenda'}\nTarifs mensuels par classe :\n${rateLines}\nLe tarif par défaut d'une classe sans prix personnalisé est de 125 USD par mois. Ces tarifs sont propres à votre établissement.`;
      if (currentLang === 'es') return `Escuela: ${context?.schoolName || schoolName || 'Agenda'}\nTarifas mensuales por curso:\n${rateLines}\nEl precio predeterminado para un curso sin tarifa personalizada es de 125 USD al mes. Estas tarifas pertenecen a tu escuela.`;
      if (currentLang === 'it') return `Scuola: ${context?.schoolName || schoolName || 'Agenda'}\nTariffe mensili per classe:\n${rateLines}\nLa tariffa predefinita per una classe senza prezzo personalizzato è di 125 USD al mese. Queste tariffe appartengono alla tua scuola.`;
      return `School: ${context?.schoolName || schoolName || 'Agenda'}\nApproved monthly rates by grade:\n${rateLines}\nThe default rate for a grade without a custom price is 125 USD per month. These prices belong to this school.`;
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

    const architectureQuestion = ['school', 'director', 'separate', 'data', 'privacy', 'educator', 'student', 'tenant', 'architecture', 'école', 'établissement', 'directeur', 'élève', 'éducateur', 'données', 'confidentialité', 'datos', 'escuela', 'estudiante', 'educador', 'privacidad', 'scuola', 'direttore', 'studente', 'educatore', 'privacy', 'مدرسة', 'مدير', 'طلاب', 'معلمين', 'خصوصية', 'بيانات', 'مدرستي'].some((keyword) => q.includes(keyword));
    if (architectureQuestion) {
      if (currentLang === 'ar') return 'تعمل المنصة بنظام مدارس مستقلة: لكل مدير مدرسة خاصة به ومعرّف مدرسة مستقل، وطلاب ومدرسون وحصص وموارد تعليمية وأسعار منفصلة. لا يستطيع مدير الوصول إلى حسابات أو ملفات مدرسة أخرى. استخدم رابط المدرسة الخاص بها لتسجيل الطلاب والمدرسين.';
      if (currentLang === 'fr') return "La plateforme fonctionne avec des établissements séparés : chaque Directeur possède son propre établissement et identifiant, ses élèves, éducateurs, cours, ressources et tarifs. Un Directeur ne peut pas accéder aux comptes ni aux fichiers d’un autre établissement. Utilisez le lien propre à votre établissement pour les inscriptions.";
      if (currentLang === 'es') return 'La plataforma utiliza escuelas independientes: cada Director tiene su propia escuela e identificador, estudiantes, educadores, clases, recursos y tarifas. Un Director no puede acceder a las cuentas ni archivos de otra escuela. Utiliza el enlace específico de tu escuela para registrarte.';
      if (currentLang === 'it') return "La piattaforma utilizza scuole separate: ogni Direttore ha la propria scuola e il proprio identificativo, studenti, educatori, lezioni, risorse e tariffe. Un Direttore non può accedere agli account o ai file di un'altra scuola. Usa il link specifico della tua scuola per registrarti.";
      return 'Agenda uses separate school spaces: every Director has an independently identified school, its own students, educators, classes, saved learning resources, and pricing. A Director cannot access another school’s accounts or files. Use your school-specific link when registering.';
    }

    return null;
  };

  const handleSend = async (textToSend?: string) => {
    const recentConversation = messages.slice(-8).map((message) =>
      `${message.sender === 'user' ? 'User' : 'Assistant'}: ${message.text}`
    ).join('\\n');
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) || '';
    const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
    setInputText('');
    setIsTyping(true);

    // Never put a question in the conversation until it is available in the
    // selected language. If translation is unavailable, preserve the draft
    // and show a localized explanation instead of mixing languages.
    let selectedLanguageQuestion = '';
    if (ai) {
      try {
        const translation = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{
            text: `Translate the user question below into ${languageNames[currentLang]}.
Return ONLY the translation: no explanation, no answer, no quotes, and no language label.
Preserve proper names, school names, usernames, numbers, prices, grade identifiers, and technical product names exactly.
If the question is already in ${languageNames[currentLang]}, return it unchanged.
Question: ${JSON.stringify(text)}`,
          }],
        });
        selectedLanguageQuestion = translation.text?.trim().replace(/^["']|["']$/g, '') || '';
      } catch (translationError) {
        console.warn('Unable to translate the submitted AI question.', translationError);
      }
    }

    if (!selectedLanguageQuestion) {
      if (activeLanguageRef.current === currentLang) {
        setInputText(text);
        setMessages(prev => [...prev, {
          id: `bot_${Date.now()}`,
          sender: 'assistant',
          text: currentLang === 'ar'
            ? 'تعذرت ترجمة سؤالك إلى اللغة المحددة حالياً. بقي سؤالك في خانة الكتابة؛ حاول مرة أخرى بعد استعادة خدمة الترجمة.'
            : currentLang === 'fr'
              ? 'La traduction de votre question dans la langue sélectionnée est momentanément indisponible. Votre question a été conservée dans le champ de saisie ; veuillez réessayer lorsque le service sera rétabli.'
              : currentLang === 'es'
                ? 'La traducción de tu pregunta al idioma seleccionado no está disponible en este momento. Tu pregunta se ha conservado en el campo de texto; inténtalo de nuevo cuando se restablezca el servicio.'
                : currentLang === 'it'
                  ? 'La traduzione della domanda nella lingua selezionata non è momentaneamente disponibile. La domanda è stata conservata nel campo di testo; riprova quando il servizio sarà ripristinato.'
                  : 'Translation into your selected language is temporarily unavailable. Your question has been kept in the input field; please try again when the translation service is available.',
          time: formatChatTime(),
        }]);
      }
      setIsTyping(false);
      return;
    }

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

    // Load the current school's authoritative configuration.
    let currentSchoolContext = schoolContext;
    if (schoolId) {
      try {
        currentSchoolContext = await getSchoolPublicContext(schoolId);
        setSchoolContext(currentSchoolContext);
      } catch {
        // Retain the most recently loaded school context if the API is temporarily unavailable.
      }
    }
    const savedAnswer = getSavedResponse(selectedLanguageQuestion, currentSchoolContext) ||
      (selectedLanguageQuestion !== text ? getSavedResponse(text, currentSchoolContext) : null);
    if (savedAnswer) {
      await new Promise(r => setTimeout(r, 350));
      if (activeLanguageRef.current !== currentLang) {
        setIsTyping(false);
        return;
      }
      setMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'assistant',
          text: savedAnswer,
          time: formatChatTime()
        }
      ]);
      setIsTyping(false);
      return;
    }

    // 2. For all other questions, use Gemini AI
    let reply = '';
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              text: `You are the AI academic assistant for Agenda (منصة الأجندة اللبنانية).
CANONICAL AGENDA KNOWLEDGE (always available; do not rely on previous chat messages to remember these facts):
${AGENDA_ASSISTANT_KNOWLEDGE}
RECENT CONVERSATION (use only to understand follow-up references; canonical knowledge and current school data take precedence):
${recentConversation || '(No previous chat messages.)'}
Platform constraints:
- Use the selected school's live configuration for all monthly rates, educators, sessions, and school identity.
- Do not claim a fixed platform-wide price or timetable. Do not invent payment methods, schedules, account credentials, or school records.
- Explain academic concepts, official Lebanese curriculum, homework, camera exercise submissions, and classroom navigation.
REQUIRED OUTPUT LANGUAGE: ${languageNames[currentLang]}.
MANDATORY LANGUAGE POLICY:
- The user's visible question has already been translated into ${languageNames[currentLang]}.
- Answer in ${languageNames[currentLang]} only, using natural, fluent, complete sentences.
- Do not answer in the source language of the original question.
- Do not mix English with the selected language. Translate explanations, headings, lists, UI navigation names, examples, and ordinary text.
- Keep only proper names, school names, usernames, URLs, code, and standard technical product terms unchanged where translation would be incorrect.
- Do not quote or restate the question in its original language.
- Before sending, check that every sentence is in ${languageNames[currentLang]} and rewrite any sentence that is not.
Authoritative school configuration (use current values, never invent a rate):
${JSON.stringify(currentSchoolContext || { schoolName: schoolName || 'Agenda', defaultMonthlyRateUsd: 125, prices: [], sessions: [], educators: [] })}
Platform architecture and navigation:
- Each Director owns one separate school tenant. Students, educators, classes, saved educator lessons, and grade-specific monthly prices are isolated by that school's owner and school ID.
- The correct school is selected by its dedicated share link. There is no public school dropdown.
- Registration: open the school's link, choose Student or Educator, enter the required details, create a username and password, and choose an available grade and educator/session. The Director activates the account.
- Sign-in: use the username and password created at registration. Ask the Director to reset a forgotten password.
- Live class: an activated and paid student joins only their assigned educator session after the educator starts it. Educators enter their own assigned classroom. Directors can monitor every class belonging to their school from Director Dashboard > Manage Sessions, even if no educator account is registered for that class.
- Saved lessons: sign in, open the classroom, select Learning Resources, and choose an educator. Educators can upload and edit only their own lesson slots.
- Monthly prices are set by the Director for each grade. The default is 125 USD/month unless the school has saved a different rate. Clearly distinguish these monthly school fees from any separate booking or tutoring fee.
- An independent Agenda copy is available to any user for USD 150. The purchaser becomes the Director of that independent copy and can manage their own school's name, educators, students, classes, saved lessons, monthly grade pricing, and classroom monitoring/delivery. Each copy remains isolated from other schools. Explain this price when users ask about obtaining, buying, or owning their own copy; do not confuse it with monthly school fees.
- To rename a school, the Director signs in from the Director Login card on the main screen, opens Director Dashboard > Accounts, edits the School name field, and saves. The new name updates the platform branding.
- Explain the current school's prices, educators, grades and sessions using the supplied school configuration. Do not expose private account data, passwords, or other schools' information.
User question (translated to the selected language): "${selectedLanguageQuestion}"`
            }
          ]
        });

        reply = response.text?.trim() || '';
        if (reply) {
          // Run a final translation pass so even an imperfectly compliant model
          // cannot leave the assistant response in a different language.
          const localizedResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [{
              text: `Translate the complete assistant response below into ${languageNames[currentLang]}.
Return ONLY the translated response, preserving every factual detail, number, price, list item, warning, and paragraph.
Do not summarize, omit, add facts, or answer the user separately.
Keep only proper names, school names, usernames, URLs, code, and standard technical product terms unchanged where necessary.
If it is already fully in ${languageNames[currentLang]}, return it unchanged.
Response to translate:
${JSON.stringify(reply)}`,
            }],
          });
          reply = localizedResponse.text?.trim() || reply;
        }
      } catch (e) {
        console.warn('Gemini chat error:', e);
      }
    }

    // Fallback if API key is missing or the network is unavailable.
    if (!reply) {
      await new Promise(r => setTimeout(r, 250));
      if (currentLang === 'ar') {
        reply = `يمكنني مساعدتك بشأن مدرسة ${currentSchoolContext?.schoolName || schoolName || 'Agenda'}: التسجيل، الدخول، الصفوف المباشرة، الموارد التعليمية والأسعار الشهرية. اكتب سؤالك بتفصيل أكبر لأرشدك خطوة بخطوة.`;
      } else if (currentLang === 'fr') {
        reply = `Je peux vous aider pour l’établissement ${currentSchoolContext?.schoolName || schoolName || 'Agenda'} : inscription, connexion, cours en direct, ressources pédagogiques et tarifs mensuels. Précisez votre question pour obtenir des étapes détaillées.`;
      } else if (currentLang === 'es') {
        reply = `Puedo ayudarte con la escuela ${currentSchoolContext?.schoolName || schoolName || 'Agenda'}: registro, inicio de sesión, clases en directo, recursos educativos y tarifas mensuales. Especifica tu pregunta para recibir instrucciones paso a paso.`;
      } else if (currentLang === 'it') {
        reply = `Posso aiutarti con la scuola ${currentSchoolContext?.schoolName || schoolName || 'Agenda'}: registrazione, accesso, lezioni dal vivo, risorse didattiche e tariffe mensili. Specifica la domanda per ricevere istruzioni dettagliate.`;
      } else {
        reply = `I can help with ${currentSchoolContext?.schoolName || schoolName || 'Agenda'}: registration, sign-in, live classes, learning resources, and monthly prices. Please add a little detail so I can guide you step by step.`;
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
