import React from 'react';
import { ArrowUpRight, MessageCircle, ShieldCheck } from 'lucide-react';

export const SPECIALIST_ZALO_URL = 'https://zalo.me/0378859736';
export const SPECIALIST_ZALO_DISPLAY = '0378.859.736';

export type ZaloSpecialistContext = 'setup' | 'upgrade' | 'custom' | 'general';

const CONTEXT_COPY: Record<
  ZaloSpecialistContext,
  { title: string; subtitle: string; ctaLabel: string }
> = {
  setup: {
    title: 'Chuyên viên hỗ trợ setup toàn bộ A–Z qua Zalo',
    subtitle:
      'Ngại thao tác kỹ thuật từng bước? Nhắn Zalo để chuyên viên DOMATION cài đặt trọn gói & bàn giao chạy ngay miễn phí.',
    ctaLabel: 'Chat Zalo Setup 1-1',
  },
  upgrade: {
    title: 'Nâng cấp gói & chuyển đổi dữ liệu 1-1 qua Zalo',
    subtitle:
      'Để chuyên viên hỗ trợ mở khóa CRM 360° / ERP 5.0, nạp ví và nâng cấp trọn bộ — giữ nguyên 100% Data cũ.',
    ctaLabel: 'Nâng Cấp Qua Zalo',
  },
  custom: {
    title: 'Để chuyên viên tạo giải pháp Custom riêng cho doanh nghiệp',
    subtitle:
      'Chuyên viên & Solution Architect DOMATION trực tiếp khảo sát, thiết kế flow may đo và setup toàn bộ hệ thống hoàn chỉnh.',
    ctaLabel: 'Chuyên Viên Tạo (Zalo)',
  },
  general: {
    title: 'Chuyên viên DOMATION hỗ trợ trực tiếp qua Zalo',
    subtitle: 'Kết nối 1-1 để được tư vấn & setup toàn bộ nhanh nhất trong ngày.',
    ctaLabel: 'Nhắn Zalo Chuyên Viên',
  },
};

export interface ZaloSpecialistBannerProps {
  context?: ZaloSpecialistContext;
  variant?: 'banner' | 'compact' | 'dark';
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  className?: string;
}

/**
 * Shared 1-click Specialist Zalo Support banner (`https://zalo.me/0378859736`)
 * for every Setup Step Modal, Onboarding Wizard, Upgrade panel, and Custom flow.
 */
export const ZaloSpecialistBanner: React.FC<ZaloSpecialistBannerProps> = ({
  context = 'setup',
  variant = 'banner',
  title,
  subtitle,
  ctaLabel,
  className = '',
}) => {
  const defaults = CONTEXT_COPY[context];
  const resolvedTitle = title ?? defaults.title;
  const resolvedSubtitle = subtitle ?? defaults.subtitle;
  const resolvedCta = ctaLabel ?? defaults.ctaLabel;

  if (variant === 'compact') {
    return (
      <div
        className={`rounded-2xl border border-blue-200/85 bg-[#F4F8FF]/95 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#0068FF]/10 text-[#0068FF] border border-[#0068FF]/20 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 shrink-0" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 leading-snug">{resolvedTitle}</div>
            {title === undefined ? (
              <div className="text-[11px] text-slate-600 leading-snug">
                Nhắn Zalo {SPECIALIST_ZALO_DISPLAY} — không cần tự thao tác.
              </div>
            ) : (
              resolvedSubtitle && (
                <div className="text-[11px] text-slate-600 leading-snug">{resolvedSubtitle}</div>
              )
            )}
          </div>
        </div>
        <a
          href={SPECIALIST_ZALO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[40px] sm:min-h-[38px] px-3.5 py-2 rounded-xl bg-[#0068FF] hover:bg-[#0057D9] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs transition-colors shrink-0"
        >
          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{resolvedCta}</span>
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
        </a>
      </div>
    );
  }

  if (variant === 'dark') {
    return (
      <div
        className={`rounded-2xl border border-cyan-300/30 bg-white/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left ${className}`}
      >
        <div className="min-w-0 space-y-0.5">
          <div className="text-xs sm:text-sm font-bold text-white leading-snug">{resolvedTitle}</div>
          <p className="text-[11px] text-blue-100 leading-relaxed m-0">{resolvedSubtitle}</p>
        </div>
        <a
          href={SPECIALIST_ZALO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0068FF] hover:bg-[#1A7AFF] border border-white/25 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-md transition-colors shrink-0"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span>{resolvedCta}</span>
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
        </a>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-blue-200/90 bg-gradient-to-r from-[#F4F8FF] via-white to-cyan-50/60 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0068FF] text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="text-xs sm:text-[13px] font-extrabold text-slate-900 leading-snug">
            {resolvedTitle}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed m-0">
            {resolvedSubtitle}{' '}
            <span className="font-mono font-bold text-[#0068FF] whitespace-nowrap">
              (Zalo: {SPECIALIST_ZALO_DISPLAY})
            </span>
          </p>
        </div>
      </div>

      <a
        href={SPECIALIST_ZALO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0068FF] hover:bg-[#0057D9] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm transition-colors shrink-0"
      >
        <MessageCircle className="w-4 h-4 shrink-0" />
        <span>{resolvedCta}</span>
        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
      </a>
    </div>
  );
};

export default ZaloSpecialistBanner;
