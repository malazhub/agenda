import React from 'react';
import { Language, TutorBooking } from '../types';
import { translations } from '../translations';
import { 
  Archive, 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Download, 
  User, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ArchiveSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  bookings: TutorBooking[];
  onBookAgain: (teacherId: string) => void;
}

export const ArchiveSessionsModal: React.FC<ArchiveSessionsModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  bookings,
  onBookAgain
}) => {
  const t = translations[currentLang];

  if (!isOpen) return null;

  // Mock archived past sessions if bookings array is small
  const defaultArchivedSessions: TutorBooking[] = [
    {
      id: 'arch-1',
      teacherId: 't1-jad-khoury',
      teacherName: 'Jad Khoury',
      teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      subject: 'math',
      track: 'BAC_SG',
      date: '2026-10-28',
      timeSlot: '4:00 PM',
      priceUSD: 7,
      isFreeTrial: true,
      paymentMethod: 'free_trial',
      topic: 'Nombres Complexes & Transformation z\' = (z-1-i√3)/(z-2)',
      status: 'completed',
      classroomLink: ''
    },
    {
      id: 'arch-2',
      teacherId: 't2-nour-haddad',
      teacherName: 'Nour Haddad',
      teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      subject: 'physics',
      track: 'BAC_SG',
      date: '2026-10-24',
      timeSlot: '5:30 PM',
      priceUSD: 7,
      isFreeTrial: false,
      paymentMethod: 'whish_money',
      topic: 'Circuits RLC en résonance d\'intensité et calcul de L',
      status: 'completed',
      classroomLink: ''
    },
    {
      id: 'arch-3',
      teacherId: 't3-charbel-daou',
      teacherName: 'Charbel Daou',
      teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      subject: 'biology',
      track: 'BAC_SV',
      date: '2026-10-18',
      timeSlot: '3:30 PM',
      priceUSD: 7,
      isFreeTrial: false,
      paymentMethod: 'fresh_usd',
      topic: 'Transmission synaptique neuromusculaire et action du curare',
      status: 'completed',
      classroomLink: ''
    }
  ];

  const allArchived = [...bookings, ...defaultArchivedSessions];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 text-start">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Archive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {t.archiveSessions}
              </h2>
              <p className="text-xs text-indigo-200">
                {currentLang === 'ar' ? 'سجل الحصص السابقة وملاحظات الأستاذ والتمارين المحلولة' : 'Past completed sessions, tutor notes, and solved exercises'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1 bg-slate-50">
          {allArchived.map(session => (
            <div
              key={session.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={session.teacherAvatar}
                    alt={session.teacherName}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {session.teacherName}
                    </h4>
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {session.date} • {session.timeSlot}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>مكتملة ومحفوظة</span>
                  </span>
                  <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    $7
                  </span>
                </div>
              </div>

              {/* Topic */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-800 font-medium leading-relaxed">
                <span className="font-bold text-slate-900 block mb-0.5">موضوع الحصة:</span>
                {session.topic}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    const sampleNote = `Agenda Classroom Notes\nTutor: ${session.teacherName}\nDate: ${session.date}\nTopic: ${session.topic}\nStatus: Certified MEHE Solution Verified`;
                    const blob = new Blob([sampleNote], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Agenda-Notes-${session.id}.txt`;
                    a.click();
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل دفتر الشرح (PDF/Notes)</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onBookAgain(session.teacherId);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <span>حجز حصة جديدة (7$)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>{allArchived.length} حصص في أرشيفك الشخصي</span>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
