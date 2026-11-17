import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { generateGeminiContent, getSchoolPublicContext } from '../services/cloudflareApi';
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

  // All conversational answers are generated by Gemini. Agenda-specific facts are supplied in the system prompt below.

  const handleSend = async (textToSend?: string) => {
    const recentConversation = messages.slice(-8).map((message) =>
      `${message.sender === 'user' ? 'User' : 'Assistant'}: ${message.text}`
    ).join('\\n');
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    setInputText('');
    setIsTyping(true);

    // Send the user's original question directly to Gemini. Gemini can
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
    // Route every user question through Gemini; never substitute a canned answer.

    // Generate the assistant's answer with Gemini
    let reply = '';
    {
      try {
        const response = await generateGeminiContent([
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
- The user's question may be written in any supported language. Understand it directly and answer in ${languageNames[currentLang]}.
- Answer in ${languageNames[currentLang]} only, using natural, fluent, complete sentences.
- Do not answer in the source language of the original question.
- Do not mix English with the selected language. Translate explanations, headings, lists, UI navigation names, examples, and ordinary text.
- Keep only proper names, school names, usernames, URLs, code, and standard technical product terms unchanged where translation would be incorrect.
- Do not quote or restate the question in a different language.
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
Original user question (understand it directly; answer only in the selected language): "${selectedLanguageQuestion}"`
            }
          ], { thinkingLevel: 'low', model: 'gemini-3.6-flash', maxOutputTokens: 1024 });

        // The system prompt already requires the selected output language.
        // Skip a second Gemini call just to translate the generated answer.
        reply = response.text?.trim() || '';
      } catch (e) {
        console.warn('Gemini chat error:', e);
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
