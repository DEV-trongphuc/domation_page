import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import type { PageFaqItem } from '../utils/seo';

interface FaqAccordionSectionProps {
  faqs: PageFaqItem[];
  eyebrow?: string;
  heading?: string;
  subtitle?: string;
  className?: string;
}

export const FaqAccordionSection: React.FC<FaqAccordionSectionProps> = ({
  faqs,
  eyebrow = 'CÂU HỎI THƯỜNG GẶP • GEO FAQ',
  heading = 'Giải Đáp Nhanh Về Hệ Thống & Chi Phí',
  subtitle,
  className = '',
}) => {
  const [collapsedSet, setCollapsedSet] = useState<Record<number, boolean>>({});

  if (!faqs || faqs.length === 0) return null;

  const toggleIdx = (idx: number) => {
    setCollapsedSet((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <section
      id="faq"
      className={`scroll-mt-28 py-14 px-4 sm:px-6 relative z-10 ${className}`}
    >
      <div className="max-w-5xl mx-auto">
        <div className="rounded-[28px] bg-white/90 backdrop-blur-xl border border-slate-200/85 p-6 sm:p-9 shadow-[0_20px_54px_-24px_rgba(15,23,42,0.08)] space-y-6">
          <div className="space-y-2">
            <div className="ql-eyebrow">
              <HelpCircle className="w-3.5 h-3.5 text-[#1E40FF]" />
              <span>{eyebrow}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {heading}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>

          <div className="divide-y divide-slate-200/80 border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
            {faqs.map((faq, idx) => {
              const isOpen = !collapsedSet[idx];
              return (
                <div key={faq.question}>
                  <button
                    type="button"
                    onClick={() => toggleIdx(idx)}
                    aria-expanded={isOpen}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50/90 transition-colors cursor-pointer"
                  >
                    <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#1E40FF]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
