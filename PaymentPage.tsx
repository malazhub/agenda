import React from 'react';
import { ArrowLeft, ArrowRight, CreditCard, ExternalLink } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface PaymentPageProps {
  currentLang: Language;
  onBack: () => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({ currentLang, onBack }) => {
  const isRTL = currentLang === 'ar';
  const t = translations[currentLang];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-200"
        >
          {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          <span>{translations[currentLang].backToMain}</span>
        </button>

        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
            <CreditCard className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">{t.paymentTitle}</h1>
          <p className="text-base font-semibold text-slate-700">{t.paymentDescription}</p>
        </div>

        <div className="flex justify-center">
          <a
            href="https://payments.suyool.com/RluEji2qtjDlMKyk9xm4G"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-800"
          >
            <span>{t.paymentProvider}</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  );
};
