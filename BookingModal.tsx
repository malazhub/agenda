import React, { useState } from 'react';
import { Teacher, Language, ExamQuestion, OfficialExam, TutorBooking } from '../types';
import { MOCK_TEACHERS } from '../data/mockTeachers';
import { translations } from '../translations';
import { 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  Wallet, 
  Building2, 
  DollarSign,
  X
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  initialTeacher?: Teacher;
  initialQuestion?: { question: ExamQuestion; exam: OfficialExam };
  freeTrialsRemaining: number;
  onConfirmBooking: (booking: TutorBooking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  initialTeacher,
  initialQuestion,
  freeTrialsRemaining,
  onConfirmBooking
}) => {
  const t = translations[currentLang];

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher>(initialTeacher || MOCK_TEACHERS[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>(selectedTeacher.availableSlots[0] || 'Today 5:00 PM');
  const [paymentMethod, setPaymentMethod] = useState<'whish_money' | 'omt' | 'fresh_usd' | 'card'>('whish_money');
  const [sessionTopic, setSessionTopic] = useState<string>(
    initialQuestion 
      ? `${initialQuestion.question.number}: ${initialQuestion.question.title}`
      : 'مراجعة وحل تمارين'
  );

  if (!isOpen) return null;

  // The 3 free trials are applied silently under the hood without displaying trial notes
  const isFreeAppliedSilently = freeTrialsRemaining > 0;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newBooking: TutorBooking = {
      id: `booking-${Date.now()}`,
      teacherId: selectedTeacher.id,
      teacherName: selectedTeacher.name,
      teacherAvatar: selectedTeacher.avatar,
      subject: selectedTeacher.subjects[0] || 'math',
      track: selectedTeacher.tracks[0] || 'BAC_SG',
      date: new Date().toISOString().split('T')[0],
      timeSlot: selectedSlot,
      priceUSD: isFreeAppliedSilently ? 0 : 7,
      isFreeTrial: isFreeAppliedSilently,
      paymentMethod: isFreeAppliedSilently ? 'free_trial' : paymentMethod,
      topic: sessionTopic,
      linkedExamId: initialQuestion?.exam.id,
      status: 'confirmed',
      classroomLink: `/classroom/${selectedTeacher.id}`
    };

    onConfirmBooking(newBooking);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">
              {t.bookTutor}
            </h2>
            <p className="text-xs text-slate-400">
              {t.sessionDurationNote}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleBookingSubmit} className="p-4 space-y-3.5 text-start">
          {/* Educator Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              المدرّس
            </label>
            <select
              value={selectedTeacher.id}
              onChange={(e) => {
                const teacher = MOCK_TEACHERS.find(t => t.id === e.target.value);
                if (teacher) {
                  setSelectedTeacher(teacher);
                  setSelectedSlot(teacher.availableSlots[0] || 'Today 5:00 PM');
                }
              }}
              className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              {MOCK_TEACHERS.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Time Slot Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              الموعد
            </label>
            <div className="flex flex-wrap gap-1.5">
              {selectedTeacher.availableSlots.map(slot => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedSlot === slot
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الموضوع أو المسألة
            </label>
            <input
              type="text"
              value={sessionTopic}
              onChange={(e) => setSessionTopic(e.target.value)}
              className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              placeholder="مثال: مراجعة دالة لوغاريتمية أو مسابقة رسمية..."
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">{t.paymentMethods}</span>
              <span className="font-extrabold text-slate-900">7$ USD</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('whish_money')}
                className={`p-2 rounded-lg border text-start flex items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'whish_money'
                    ? 'bg-slate-900 text-white font-bold border-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 shrink-0" />
                <span>Whish Money</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('omt')}
                className={`p-2 rounded-lg border text-start flex items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'omt'
                    ? 'bg-slate-900 text-white font-bold border-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>OMT</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('fresh_usd')}
                className={`p-2 rounded-lg border text-start flex items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'fresh_usd'
                    ? 'bg-slate-900 text-white font-bold border-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 shrink-0" />
                <span>Fresh USD</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-2 rounded-lg border text-start flex items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'bg-slate-900 text-white font-bold border-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span>بطاقة مصرفية</span>
              </button>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد الحجز (7$)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
