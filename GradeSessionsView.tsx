import React, { useState, useEffect } from 'react';
import { Language, GradeLevelDef } from '../types';
import { MOCK_20_STORED_SESSIONS, DetailedExerciseSession } from '../data/mock20StoredSessions';
import { 
  ArrowLeft, 
  ArrowRight,
  Video, 
  Clock, 
  Users, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  Award,
  Sparkles,
  Play,
  Share2,
  FileText
} from 'lucide-react';

interface GradeSessionsViewProps {
  currentLang: Language;
  selectedGrade: GradeLevelDef;
  onBack: () => void;
  onEnterLiveClassroom: () => void;
}

export const GradeSessionsView: React.FC<GradeSessionsViewProps> = ({
  currentLang,
  selectedGrade,
  onBack,
  onEnterLiveClassroom
}) => {
  const isRTL = currentLang === 'ar';
  const [activeTab, setActiveTab] = useState<'stored' | 'live'>('stored');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(MOCK_20_STORED_SESSIONS[0].id);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Real-time live session simulation to prove student is watching live
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(864); // ~14m 24s into session
  const [onlineStudents, setOnlineStudents] = useState(7);
  const [liveMessages, setLiveMessages] = useState<{ id: string; sender: string; text: string; time: string }[]>([
    { id: '1', sender: 'كريم منصور', text: 'أستاذ هل نحدد شرط استثناء النقطة B؟', time: '16:14' },
    { id: '2', sender: 'Prof. Jad Khoury (المدرس)', text: 'نعم تماماً يا كريم، z ≠ 2 لأن المقام ينعدم', time: '16:15' },
    { id: '3', sender: 'سناء شيتو', text: 'هل يمكن إعادة شرح الزاوية arg(z\')؟', time: '16:18' }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const filteredSessions = subjectFilter === 'all' 
    ? MOCK_20_STORED_SESSIONS 
    : MOCK_20_STORED_SESSIONS.filter(s => s.subject.includes(subjectFilter));

  const subjects = [
    { id: 'all', label: currentLang === 'ar' ? 'الكل (20 حصة)' : 'All (20 Sessions)' },
    { id: 'Math', label: 'Mathématiques / رياضيات' },
    { id: 'Physique', label: 'Physique / فيزياء' },
    { id: 'Chimie', label: 'Chimie / كيمياء' },
    { id: 'Biologie', label: 'Biologie / علوم الحياة' },
    { id: 'Économie', label: 'Économie & Sociologie' },
    { id: 'Arabe', label: 'اللغة العربية' },
    { id: 'Philosophie', label: 'Philosophie / فلسفة' },
    { id: 'Français', label: 'Français' },
    { id: 'English', label: 'English' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-start">
      {/* Top Navigation Bar with Back Button & Selected Grade Info */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-2xl transition cursor-pointer text-xs sm:text-sm shadow-2xs group"
          >
            {isRTL ? <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> : <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />}
            <span>{currentLang === 'ar' ? 'العودة إلى اختيار الصفوف' : 'Back to Grades'}</span>
          </button>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-100">
                {selectedGrade.cycle[currentLang]}
              </span>
              <span className="text-xs font-bold text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-500">
                {currentLang === 'ar' ? 'منهاج رسمي لبناني معتمد' : 'Certified Official Curriculum'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {selectedGrade.name[currentLang]}
            </h2>
          </div>
        </div>

        {/* Action Toggle Buttons: Stored Sessions (20) vs Live Session */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('stored')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeTab === 'stored'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{currentLang === 'ar' ? 'الحصص السابقة المخزنة (20)' : 'Stored Sessions (20)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeTab === 'live'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
            <Video className="w-4 h-4" />
            <span>{currentLang === 'ar' ? 'الحصة المباشرة التفاعلية' : 'Live Interactive Session'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: STORED SESSIONS (20 Detailed Sessions with accurate exercises and solutions) */}
      {activeTab === 'stored' && (
        <div className="space-y-5">
          {/* Section Subheading & Subject Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>
                  {currentLang === 'ar' 
                    ? 'أرشيف الـ 20 حصة السابقة: مسائل نموذجية مع سلالم التصحيح والحلول الكاملة' 
                    : '20 Previous Sessions: Official Exercises with Barèmes & Full Solutions'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {currentLang === 'ar'
                  ? 'تمارين نموذجية ومسابقات امتحانات رسمية سابقة محلولة خطوة بخطوة وفق معايير المركز التربوي MEHE'
                  : 'Official past exercises solved step-by-step according to Lebanese MEHE standards.'}
              </p>
            </div>

            {/* Quick subject filter chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
              {subjects.slice(0, 5).map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSubjectFilter(sub.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 border ${
                    subjectFilter === sub.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of 20 Sessions */}
          <div className="space-y-3.5">
            {filteredSessions.map((sess) => {
              const isExpanded = expandedSessionId === sess.id;

              return (
                <div
                  key={sess.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all duration-200 hover:border-indigo-200"
                >
                  {/* Card Header Summary */}
                  <div 
                    onClick={() => setExpandedSessionId(isExpanded ? null : sess.id)}
                    className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg font-black shrink-0 shadow-2xs">
                        {sess.subjectIcon}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-md">
                            {currentLang === 'ar' ? `الحصة ${sess.sessionNumber} من 20` : `Session ${sess.sessionNumber}/20`}
                          </span>
                          <span className="text-xs font-bold text-indigo-700">
                            {sess.subject}
                          </span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs font-semibold text-slate-500">
                            {sess.date}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                          {sess.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {sess.topic}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-end hidden sm:block">
                        <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl block">
                          {sess.pointsTotal}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {sess.duration}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <img
                          src={sess.teacherAvatar}
                          alt={sess.teacherName}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-2xs"
                        />
                        <button className="p-2 text-slate-400 hover:text-indigo-600 transition">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail View: Exercise Prompt, Official MEHE Barème Breakdown & Complete Solution */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 bg-slate-50/60 border-t border-slate-100 space-y-6">
                      {/* Exercise Prompt Box */}
                      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-100/80 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-indigo-600" />
                            {currentLang === 'ar' ? 'نص المسألة الرسمية (Sujet Officiel)' : 'Official Exercise Prompt'}
                          </span>
                          <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                            {sess.pointsTotal}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-800 font-mono whitespace-pre-line leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          {sess.exercisePrompt}
                        </div>
                      </div>

                      {/* Official Barème Breakdown Steps */}
                      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100/90 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            {currentLang === 'ar' ? 'سلّم التصحيح المعتمد رسميّاً (Barème Officiel MEHE)' : 'Official MEHE Grading Rubric'}
                          </h5>
                          <span className="text-[11px] font-bold text-slate-500">
                            {currentLang === 'ar' ? 'توزيع دقيق لكل خطوة' : 'Step-by-step scoring'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {sess.baremeBreakdown.map((item, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-between p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200/60 text-xs"
                            >
                              <span className="text-slate-800 font-medium pr-2">
                                {item.step}
                              </span>
                              <span className="font-mono font-black text-emerald-800 bg-white px-2 py-0.5 rounded-md shadow-2xs shrink-0">
                                {item.points}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Complete Step-by-Step Solution */}
                      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-100 shadow-2xs space-y-3">
                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          {currentLang === 'ar' ? 'الحل التفصيلي والنموذجي (Corrigé Type)' : 'Step-by-Step Model Solution'}
                        </h5>

                        <div className="space-y-2.5">
                          {sess.stepByStepSolution.map((sol, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                              {sol}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Official Exam Warning Trap */}
                      <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-xs">
                          <h6 className="font-black text-amber-950">
                            {currentLang === 'ar' ? 'تنبيه لجنة الامتحانات الرسمية لتفادي حسم العلامات' : 'MEHE Official Grading Trap Warning'}
                          </h6>
                          <p className="text-amber-900 leading-snug">
                            {sess.officialExamWarning}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Action inside session: Practice on Whiteboard */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="text-xs text-slate-500 font-medium">
                          {currentLang === 'ar' ? `المدرّس المشرف: ${sess.teacherName}` : `Certified Educator: ${sess.teacherName}`}
                        </div>

                        <button
                          onClick={onEnterLiveClassroom}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                        >
                          <Play className="w-4 h-4 text-white" />
                          <span>{currentLang === 'ar' ? 'فتح التمرين على اللوح التفاعلي والمباشر' : 'Open Exercise on Interactive Whiteboard'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE SESSION (Accurate real-time proof that the student is watching live) */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {/* Live Session Simulation Card */}
          <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-rose-500/30 space-y-6 relative overflow-hidden">
            {/* Top Live Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 bg-rose-600 text-white font-black text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span>LIVE • بث مباشر الآن</span>
                </span>

                <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-1 rounded-xl text-xs font-mono font-bold text-amber-300">
                  <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>{formatElapsed(liveElapsedSeconds)}</span>
                  <span className="text-[10px] text-slate-400 font-sans">(مباشر متزامن)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>{onlineStudents} طلاب متصلون بالفيديو الآن</span>
              </div>
            </div>

            {/* Live Video & Classroom Stage Proof */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Teacher Video Stream Preview */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-400/40 shadow-2xl bg-black aspect-video flex items-center justify-center group">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
                  alt="Teacher Live Feed"
                  className="w-full h-full object-cover opacity-85 group-hover:opacity-95 transition"
                />
                
                {/* Live sound wave overlay */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px] font-bold text-emerald-400 border border-white/10">
                  <span className="w-1.5 h-3 bg-emerald-400 animate-pulse rounded-full" />
                  <span className="w-1.5 h-4 bg-emerald-400 animate-pulse delay-75 rounded-full" />
                  <span className="w-1.5 h-2 bg-emerald-400 animate-pulse delay-150 rounded-full" />
                  <span className="ml-1 text-white">Audio Sync</span>
                </div>

                <div className="absolute bottom-3 right-3 left-3 bg-black/75 backdrop-blur-md p-2 rounded-xl text-xs flex items-center justify-between border border-white/10">
                  <span className="font-bold text-white">Prof. Jad Khoury (Head of Mathematics)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">1080p HD Live</span>
                </div>
              </div>

              {/* Live Lesson Details & Real-Time Sync Chat */}
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-300">
                    {selectedGrade.name[currentLang]} • Mathématiques & Sciences
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    حل نماذج ومسائل الامتحانات الرسمية مع سلالم التصحيح التفاعلية
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    الحصة جارية الآن ضمن الفترة الرسمية (4:00 - 8:00 مساءً). يستطيع الطالب تصوير تمرين بكاميرا جهازه وتسلّمه مباشرة للمدرس ليتم حله مع الذكاء الاصطناعي وتطبيق سلّم التصحيح.
                  </p>
                </div>

                {/* Real-time chat ticker proof */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 space-y-2">
                  <span className="text-[10px] font-bold text-slate-300 block">
                    محادثات الطلاب المباشرة في هذه الحصة:
                  </span>
                  <div className="space-y-1.5">
                    {liveMessages.map(msg => (
                      <div key={msg.id} className="text-xs flex items-center justify-between gap-2 bg-black/30 p-2 rounded-lg">
                        <div>
                          <span className="font-bold text-amber-300 ml-1">{msg.sender}:</span>
                          <span className="text-slate-200">{msg.text}</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 shrink-0">{msg.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enter Live Session Primary Button */}
                <div className="pt-2">
                  <button
                    onClick={onEnterLiveClassroom}
                    className="w-full sm:w-auto bg-linear-to-r from-rose-600 via-rose-700 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 active:scale-95 text-white font-black text-base px-8 py-4 rounded-2xl transition shadow-2xl flex items-center justify-center gap-3 cursor-pointer border-2 border-white/20"
                  >
                    <Video className="w-5 h-5 text-white" />
                    <span>
                      {currentLang === 'ar' ? 'دخول الحصة المباشرة والتفاعل مع الأستاذ الآن 📹' : 'Join Live Video & Whiteboard Room Now'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
