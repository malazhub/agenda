import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { GoogleGenAI } from '@google/genai';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot
} from 'lucide-react';

interface AIChatBotProps {
  currentLang: Language;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export const AIChatBot: React.FC<AIChatBotProps> = ({ currentLang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Blank chat: Starts with no initial pre-canned text as requested
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Saved responses for Price and Timing
  const getSavedResponse = (query: string): string | null => {
    const q = query.toLowerCase();

    // 1. Price check (7 USD as saved)
    const priceKeywords = [
      'سعر', 'اسعار', 'أسعار', 'تكلف', 'بكم', 'دولار', 'دفع', 'whish', 'omt', 'اشتراك',
      'price', 'pricing', 'cost', 'fee', 'fees', 'usd', 'dollar', 'payment', 'pay',
      'tarif', 'prix', 'cout', 'coût', 'payer'
    ];
    if (priceKeywords.some(kw => q.includes(kw))) {
      if (currentLang === 'ar') {
        return `سعر الحصة هو 7 USD موحد لجميع الصفوف والمواد، مع 3 حصص تجريبية مجانية عند التسجيل.\nطرق الدفع المعتمدة: Whish Money، OMT Cash، و Fresh USD.`;
      } else if (currentLang === 'fr') {
        return `Le tarif est fixé à 7 USD par séance pour l'ensemble des classes et matières, avec 3 séances d'essai gratuites à l'inscription.\nMoyens de paiement acceptés : Whish Money, OMT Cash et Fresh USD.`;
      } else {
        return `Session rate is 7 USD flat across all grade levels and subjects, including 3 free trial sessions upon registration.\nAccepted payment methods: Whish Money, OMT Cash, and Fresh USD.`;
      }
    }

    // 2. Timing check (4:00 PM to 8:00 PM as saved)
    const timingKeywords = [
      'مواعيد', 'ساعة', 'وقت', 'توقيت', 'متى', 'دوام', 'بث',
      'timing', 'schedule', 'hours', 'time', 'when',
      'horaire', 'horaires', 'heure', 'quand'
    ];
    if (timingKeywords.some(kw => q.includes(kw))) {
      if (currentLang === 'ar') {
        return `تبدأ الحصص المباشرة يومياً من الساعة 4:00 بعد الظهر حتى 8:00 مساءً (بتوقيت بيروت) لجميع المراحل والصفوف.`;
      } else if (currentLang === 'fr') {
        return `Les sessions en direct se déroulent quotidiennement de 16h00 à 20h00 (Heure de Beyrouth) pour tous les niveaux scolaires.`;
      } else {
        return `Live sessions run daily from 4:00 PM to 8:00 PM (Beirut Time) for all grade levels.`;
      }
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
    const savedAnswer = getSavedResponse(text);
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
- Saved Price: 7 USD flat rate per 1-on-1 session with 3 free trials upon registration (Whish Money, OMT Cash, Fresh USD).
- Saved Timing: Live sessions operate daily strictly from 4:00 PM to 8:00 PM (Beirut Time).
- You can explain academic concepts, exercises, homework problems, official Lebanese curriculum (Brevet, Bac SG, SE, LH), camera exercise submissions with AI Barèmes, and educator breakout rooms.
Language to answer: ${currentLang === 'ar' ? 'Arabic' : currentLang === 'fr' ? 'French' : 'English'}.
User question: "${text}"`
            }
          ]
        });

        reply = response.text || '';
      } catch (e) {
        console.warn('Gemini chat error:', e);
      }
    }

    // Fallback if API key missing or network fails
    if (!reply) {
      await new Promise(r => setTimeout(r, 400));
      if (currentLang === 'ar') {
        reply = `تم استلام استفسارك بخصوص "${text}". يتميز نظام الأجندة بمتابعة الفروض اليومية، وتصحيح التمارين عبر الكاميرا مع سلالم التصحيح الرسمية، وتوفير حصص فردية مباشرة مع نخبة من الأساتذة.`;
      } else if (currentLang === 'fr') {
        reply = `Votre demande concernant "${text}" a été reçue. La plateforme Agenda vous offre le suivi quotidien des devoirs, la résolution d'exercices par caméra avec le barème officiel, et des cours interactifs en direct.`;
      } else {
        reply = `We have received your question regarding "${text}". Agenda provides complete daily homework tracking, camera-based exercise solving with official Lebanese Barèmes, and interactive live mentoring.`;
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
            {currentLang === 'ar' ? 'المساعد الذكي' : currentLang === 'fr' ? 'Assistant IA' : 'AI Assistant'}
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
                    {currentLang === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
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
                  {currentLang === 'ar' 
                    ? 'اكتب رسالتك للبدء...' 
                    : currentLang === 'fr'
                    ? 'Écrivez votre message pour commencer...'
                    : 'Type a message to begin...'}
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
