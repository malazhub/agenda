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

export const AIChatBot: React.FC<AIChatBotProps> = ({ currentLang, schoolId, schoolName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    const prices = context?.prices || [];
    const monthlyPriceQuestion = [
      'price', 'pricing', 'cost', 'fee', 'fees', 'usd', 'dollar', 'payment',
      'tarif', 'tarifa', 'tarifas', 'prix', 'precio', 'precios', 'prezzo', 'prezzi', 'tariffa', 'tariffe', 'coût', 'cout', 'costo', 'coste', 'quanto', 'cuanto', 'cuánto', 'how much', 'payer', 'mensuel', 'mensual', 'mensile',
      'month', 'monthly', 'per month', 'شهري', 'سعر', 'اسعار', 'أسعار', 'تكلف', 'بكم', 'دولار', 'دفع'
    ].some((keyword) => q.includes(keyword));

    if (monthlyPriceQuestion) {
      const rateLines = prices.length
        ? prices.map((price) => `${LEBANESE_GRADE_LEVELS.find((grade) => grade.id === price.gradeId)?.name[currentLang] || price.gradeId}: ${price.monthlyRateUsd} USD`).join('\n')
        : `${context?.defaultMonthlyRateUsd ?? 125} USD per month (default rate)`;
      if (currentLang === 'ar') return `المدرسة: ${context?.schoolName || schoolName || 'Agenda'}\nالأسعار الشهرية المعتمدة حسب الصف:\n${rateLines}\nالسعر الافتراضي للصف الذي لم يحدد المدير سعره هو 125 دولاراً شهرياً. هذه الأسعار خاصة بمدرستك.`;
      if (currentLang === 'fr') return `Établissement : ${context?.schoolName || schoolName || 'Agenda'}\nTarifs mensuels par classe :\n${rateLines}\nLe tarif par défaut d'une classe sans prix personnalisé est de 125 USD par mois. Ces tarifs sont propres à votre établissement.`;
      if (currentLang === 'es') return `Escuela: ${schoolContext?.schoolName || schoolName || 'Agenda'}\nTarifas mensuales por curso:\n${rateLines}\nEl precio predeterminado para un curso sin tarifa personalizada es de 125 USD al mes. Estas tarifas pertenecen a tu escuela.`;
      if (currentLang === 'it') return `Scuola: ${schoolContext?.schoolName || schoolName || 'Agenda'}\nTariffe mensili per classe:\n${rateLines}\nLa tariffa predefinita per una classe senza prezzo personalizzato è di 125 USD al mese. Queste tariffe appartengono alla tua scuola.`;
      return `School: ${schoolContext?.schoolName || schoolName || 'Agenda'}\nApproved monthly rates by grade:\n${rateLines}\nThe default rate for a grade without a custom price is 125 USD per month. These prices belong to this school.`;
    }

    const registrationQuestion = ['register', 'registration', 'sign up', 'create account', 'inscrire', 'inscription', 'registrar', 'registro', 'registrazione', 'تسجيل', 'سجل'].some((keyword) => q.includes(keyword));
    if (registrationQuestion) {
      if (currentLang === 'ar') return 'للتسجيل: افتح رابط المدرسة الصحيح، اختر طالباً أو معلماً، أدخل الاسم والبريد الإلكتروني واسم المستخدم وكلمة المرور، ثم اختر الصف والأستاذ/الحصة المتاحة. بعد التسجيل ينتظر الحساب موافقة المدير وتفعيله.';
      if (currentLang === 'fr') return "Pour vous inscrire : ouvrez le lien de votre établissement, choisissez Élève ou Éducateur, saisissez vos coordonnées, créez un nom d’utilisateur et un mot de passe, puis choisissez la classe et l’éducateur disponibles. Le Directeur doit ensuite activer le compte.";
      if (currentLang === 'es') return 'Para registrarte: abre el enlace de tu escuela, elige Estudiante o Educador, introduce tus datos, crea un usuario y una contraseña y selecciona el curso y educador disponibles. El Director debe activar la cuenta después del registro.';
      if (currentLang === 'it') return "Per registrarti: apri il link della tua scuola, scegli Studente o Educatore, inserisci i tuoi dati, crea nome utente e password e seleziona la classe e l'educatore disponibili. Il Direttore dovrà attivare l'account dopo la registrazione.";
      return 'To register: open your school-specific link, choose Student or Educator, enter your details, create a username and password, and select an available grade and educator/session. The Director must activate the account after registration.';
    }

    const signInQuestion = ['password', 'username', 'sign in', 'login', 'mot de passe', 'identifiant', 'contraseña', 'usuario', 'password', 'accedi', 'nome utente', 'كلمة المرور', 'اسم المستخدم', 'دخول'].some((keyword) => q.includes(keyword));
    if (signInQuestion) {
      if (currentLang === 'ar') return 'لتسجيل الدخول، استخدم اسم المستخدم وكلمة المرور اللذين أنشأتهما عند التسجيل. إذا نسيت كلمة المرور، تواصل مع مدير مدرستك ليعيد تعيينها. لا تشارك كلمة المرور مع أي شخص.';
      if (currentLang === 'fr') return "Pour vous connecter, utilisez le nom d’utilisateur et le mot de passe créés lors de l’inscription. En cas d’oubli, contactez le Directeur de votre établissement pour réinitialiser le mot de passe. Ne partagez jamais votre mot de passe.";
      if (currentLang === 'es') return 'Para iniciar sesión, utiliza el nombre de usuario y la contraseña que creaste al registrarte. Si los olvidas, contacta con el Director de tu escuela para restablecer la contraseña. No compartas tu contraseña.';
      if (currentLang === 'it') return "Per accedere, usa il nome utente e la password creati durante la registrazione. Se li dimentichi, contatta il Direttore della tua scuola per reimpostare la password. Non condividere la password.";
      return 'Sign in with the username and password you created during registration. If you forget them, contact your school Director to reset the password. Never share your password.';
    }

    const lessonQuestion = ['saved lesson', 'recording', 'lesson', 'archive', 'ressource', 'leçon', 'lecon', 'clase guardada', 'lección', 'lezione', 'registrazione', 'دروس محفوظة', 'درس', 'أرشيف'].some((keyword) => q.includes(keyword));
    if (lessonQuestion) {
      if (currentLang === 'ar') return 'لاسترجاع الدروس المحفوظة، سجّل الدخول وافتح غرفة الصف ثم اختر «الموارد التعليمية». اختر الأستاذ لعرض خانات الدروس والملفات التي نشرها. يمكن للمدرس تعديل موارده الخاصة فقط.';
      if (currentLang === 'fr') return "Pour retrouver les leçons enregistrées, connectez-vous, ouvrez la salle de classe puis choisissez « Ressources pédagogiques ». Sélectionnez l’éducateur pour consulter les leçons et fichiers publiés. Chaque éducateur ne peut modifier que ses propres ressources.";
      if (currentLang === 'es') return 'Para recuperar lecciones guardadas, inicia sesión, abre el aula y selecciona «Recursos educativos». Elige al educador para ver las lecciones y archivos publicados. Cada educador solo puede modificar sus propios recursos.';
      if (currentLang === 'it') return "Per recuperare le lezioni salvate, accedi, apri l'aula e seleziona «Risorse didattiche». Scegli l'educatore per vedere lezioni e file pubblicati. Ogni educatore può modificare solo le proprie risorse.";
      return 'To retrieve saved lessons, sign in, open the classroom, and select Learning Resources. Choose the educator to view published lesson slots and files. Each educator can edit only their own resources.';
    }

    const liveQuestion = ['live', 'broadcast', 'join class', 'classroom', 'direct', 'en direct', 'en vivo', 'aula', 'diretta', 'بث', 'صف مباشر', 'غرفة الصف'].some((keyword) => q.includes(keyword));
    if (liveQuestion) {
      if (currentLang === 'ar') return 'للدخول إلى الصف المباشر، سجّل الدخول بالحساب المفعّل والمسدد والمسجل في حصة الأستاذ نفسها. افتح «البث المباشر» واختر صفك. يبدأ الأستاذ البث أولاً، ويمكن للمدير مراقبة أي صف من لوحة التحكم ← إدارة الحصص.';
      if (currentLang === 'fr') return "Pour rejoindre un cours en direct, connectez-vous avec un compte activé, payé et inscrit à la même séance que l’éducateur. Ouvrez « Diffusion en direct » et choisissez votre classe. L’éducateur démarre la diffusion. Le Directeur peut surveiller toute classe depuis Tableau de bord → Gestion des cours.";
      if (currentLang === 'es') return 'Para entrar en una clase en directo, inicia sesión con una cuenta activada, pagada y asignada a la misma sesión del educador. Abre «Emisión en directo» y elige tu curso. El educador inicia la emisión. El Director puede supervisar cualquier clase desde Panel → Gestionar sesiones.';
      if (currentLang === 'it') return "Per entrare in una lezione dal vivo, accedi con un account attivato, pagato e assegnato alla stessa sessione dell'educatore. Apri «Diretta» e scegli la tua classe. L'educatore avvia la trasmissione. Il Direttore può monitorare qualsiasi classe da Pannello → Gestione lezioni.";
      return 'To join a live class, sign in with an activated, paid account assigned to the same educator session. Open Broadcast Room and choose your grade. The educator starts the broadcast. The Director can monitor any class from Dashboard → Manage Sessions.';
    }

    const architectureQuestion = ['school', 'director', 'separate', 'data', 'privacy', 'educator', 'student', 'tenant', 'architecture', 'école', 'directeur', 'datos', 'escuela', 'scuola', 'direttore', 'مدرسة', 'مدير', 'طلاب', 'معلمين', 'خصوصية'].some((keyword) => q.includes(keyword));
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
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // 1. Check if user is asking about price or timing (strictly return saved facts)
    let currentSchoolContext = schoolContext;
    if (schoolId) {
      try {
        currentSchoolContext = await getSchoolPublicContext(schoolId);
        setSchoolContext(currentSchoolContext);
      } catch {
        // Retain the most recently loaded school context if the API is temporarily unavailable.
      }
    }
    const savedAnswer = getSavedResponse(text, currentSchoolContext);
    if (savedAnswer) {
      await new Promise(r => setTimeout(r, 350));
      setMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'assistant',
          text: savedAnswer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
      return;
    }

    // 2. For all other questions, use Gemini AI
    let reply = '';
    const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) || '';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              text: `You are the AI academic assistant for Agenda (منصة الأجندة اللبنانية).
Platform constraints:
- Use the selected school's live configuration for all monthly rates, educators, sessions, and school identity.
- Do not claim a fixed platform-wide price or timetable. Do not invent payment methods, schedules, account credentials, or school records.
- Explain academic concepts, official Lebanese curriculum, homework, camera exercise submissions, and classroom navigation.
Language to answer: ${({ ar: 'Arabic', en: 'English', fr: 'French', it: 'Italian', es: 'Spanish' } as Record<Language, string>)[currentLang]}.
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
- Explain the current school's prices, educators, grades and sessions using the supplied school configuration. Do not expose private account data, passwords, or other schools' information.
User question: "${text}"`
            }
          ]
        });

        reply = response.text || '';
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

    setIsTyping(false);
    setMessages(prev => [
      ...prev,
      {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
          title="AI Chat"
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
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Body - Blank by default, zero clutter */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-300 text-xs text-center p-6 select-none">
                <p>
                  {currentLang === 'ar' ? 'اكتب رسالتك للبدء...' : currentLang === 'fr' ? 'Écrivez votre message pour commencer...' : currentLang === 'es' ? 'Escribe un mensaje para comenzar...' : currentLang === 'it' ? 'Scrivi un messaggio per iniziare...' : 'Type a message to begin...'}
                </p>
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs shadow-xs font-bold">
                    AI
                  </div>
                )}

                <div
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
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                  AI
                </div>
                <div className="bg-white text-slate-500 border border-slate-200 p-3 rounded-2xl text-xs rounded-bl-none shadow-xs flex items-center gap-1.5">
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
                  : 'Type your question here...'
              }
              className="flex-1 text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-indigo-600 font-medium"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
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
