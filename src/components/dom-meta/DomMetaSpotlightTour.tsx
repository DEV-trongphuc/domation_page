/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useId, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';

export interface DomMetaTourStep {
  id: string;
  target: string;
  selector?: string;
  eyebrow: string;
  title: string;
  description: string;
  chips: string[];
}

export const DOM_META_TOUR_STORAGE_KEY = 'domation_dom_meta_tour_done_v1';

export const DOM_META_SPOTLIGHT_STEPS: DomMetaTourStep[] = [
  {
    id: 'dm-kpis',
    target: 'dom-meta-kpis',
    selector: '[data-testid="open-perf-compare"], [data-tour="dom-meta-kpis"]',
    eyebrow: 'BƯỚC 1 / 5 • CHỈ SỐ TỔNG QUAN',
    title: 'KPI Quảng cáo Realtime & Tỷ lệ Giữ chân 3 giây',
    description:
      'Theo dõi tức thì Chi tiêu, Tin nhắn, Lead Ads và điểm giữ chân Video 3 giây mà không cần tải lại Trình quản lý Quảng cáo Meta.',
    chips: ['Graph v25.0', 'Video 3s Hook'],
  },
  {
    id: 'dm-campaigns',
    target: 'dom-meta-campaigns',
    selector: '[data-tour="dom-meta-campaigns"], [data-testid="dom-meta-nav-campaigns"]',
    eyebrow: 'BƯỚC 2 / 5 • ĐỐI CHIẾU CRM THẬT',
    title: 'Chiến dịch → Nhóm → Bài QC & Tỷ lệ Lead Qualified CRM',
    description:
      'Bấm vào từng chiến dịch hoặc bài quảng cáo để xem số Lead chất lượng, Đặt cọc & Doanh thu thực tế đối chiếu trực tiếp từ CRM.',
    chips: ['CPQL Thực', 'ROAS CRM'],
  },
  {
    id: 'dm-heatmap',
    target: 'dom-meta-heatmap',
    selector: '[data-tour="dom-meta-heatmap"], .recharts-responsive-container',
    eyebrow: 'BƯỚC 3 / 5 • KHUNG GIỜ VÀNG & ĐỊA LÝ',
    title: 'Bản đồ nhiệt 24/7, Tuổi/Giới tính & Vùng miền',
    description:
      'Phát hiện chính xác khung giờ có nhiều khách nhắn tin/điền form nhất và vùng miền mang lại doanh thu cao nhất.',
    chips: ['Heatmap 24/7', 'Age & Gender'],
  },
  {
    id: 'dm-gads',
    target: 'dom-meta-gads',
    selector: '[data-testid="open-google-ads-settings"], [data-tour="dom-meta-gads"]',
    eyebrow: 'BƯỚC 4 / 5 • MỞ RỘNG GOOGLE ADS',
    title: 'Bật Google Ads 5 bước khi chạy đa kênh',
    description:
      'Mặc định giữ gọn chỉ hiển thị Meta Ads. Khi cần theo dõi thêm Google Ads & từ khóa tìm kiếm, gạt công tắc trong Cài đặt kết nối.',
    chips: ['Opt-in Đa kênh', 'Từ khóa Search'],
  },
  {
    id: 'dm-capi',
    target: 'dom-meta-capi',
    selector: '[data-testid="dom-meta-nav-capi"], [data-tour="dom-meta-capi"]',
    eyebrow: 'BƯỚC 5 / 5 • VÒNG TRÒN CAPI',
    title: 'Bắn ngược tín hiệu học tệp SHA-256 về Meta Pixel',
    description:
      'Tự động gửi tín hiệu khách mua hàng (Purchase/Lead) và chặn lead rác (DisqualifiedLead) giúp AI Meta phân phối ngày càng chuẩn xác.',
    chips: ['SHA-256 CAPI', 'Closed-Loop'],
  },
];

interface DomMetaSpotlightTourProps {
  open: boolean;
  steps?: DomMetaTourStep[];
  activeStepIndex: number;
  onStepChange: (nextIndex: number) => void;
  onClose: () => void;
  onFinish?: () => void;
}

export const DomMetaSpotlightTour: React.FC<DomMetaSpotlightTourProps> = ({
  open,
  steps = DOM_META_SPOTLIGHT_STEPS,
  activeStepIndex,
  onStepChange,
  onClose,
  onFinish,
}) => {
  const maskId = useId().replace(/:/g, '');
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [viewport, setViewport] = useState({ w: 1280, h: 800 });

  const safeIndex = Math.max(0, Math.min(steps.length - 1, activeStepIndex));
  const current = steps[safeIndex];

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && safeIndex < steps.length - 1) {
        onStepChange(safeIndex + 1);
      }
      if (e.key === 'ArrowLeft' && safeIndex > 0) {
        onStepChange(safeIndex - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, safeIndex, steps.length, onClose, onStepChange]);

  useLayoutEffect(() => {
    if (!open || !current) return;
    let cancelled = false;
    let rafId = 0;

    const findAndMeasure = (shouldScroll: boolean) => {
      if (cancelled) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setViewport({ w: vw, h: vh });

      const findVisibleEl = (sel: string): HTMLElement | null => {
        try {
          const list = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
          return (
            list.find((node) => {
              const r = node.getBoundingClientRect();
              return r.width > 0 && r.height > 0;
            }) || null
          );
        } catch {
          return null;
        }
      };

      const el =
        findVisibleEl(`[data-tour="${current.target}"]`) ||
        (current.selector ? findVisibleEl(current.selector) : null);

      if (!el) {
        setTargetRect(null);
        return;
      }

      if (shouldScroll) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }

      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setTargetRect(null);
      }
    };

    const t1 = window.setTimeout(() => findAndMeasure(true), 60);
    const t2 = window.setTimeout(() => findAndMeasure(false), 280);
    const handleReposition = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => findAndMeasure(false));
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, current]);

  if (!open || !current || typeof document === 'undefined') return null;

  const isFirst = safeIndex === 0;
  const isLast = safeIndex === steps.length - 1;
  const pad = 10;
  const spotlight = targetRect
    ? {
        top: Math.max(8, targetRect.top - pad),
        left: Math.max(8, targetRect.left - pad),
        width: Math.min(viewport.w - 16, targetRect.width + pad * 2),
        height: Math.min(viewport.h - 16, targetRect.height + pad * 2),
      }
    : null;

  const cardWidth = Math.min(368, viewport.w - 24);
  const estimatedCardHeight = 295;
  const margin = 16;

  let cardStyle: React.CSSProperties = {
    width: `${cardWidth}px`,
    left: `${Math.max(12, Math.round((viewport.w - cardWidth) / 2))}px`,
    bottom: '16px',
  };

  if (spotlight && viewport.w >= 768) {
    const spaceRight = viewport.w - (spotlight.left + spotlight.width) - margin;
    const spaceLeft = spotlight.left - margin;
    const spaceBottom = viewport.h - (spotlight.top + spotlight.height) - margin;
    const spaceTop = spotlight.top - margin;

    if (spaceRight >= cardWidth) {
      cardStyle = {
        width: `${cardWidth}px`,
        left: `${spotlight.left + spotlight.width + margin}px`,
        top: `${Math.max(16, Math.min(viewport.h - estimatedCardHeight - 16, spotlight.top + 12))}px`,
      };
    } else if (spaceLeft >= cardWidth) {
      cardStyle = {
        width: `${cardWidth}px`,
        left: `${Math.max(16, spotlight.left - cardWidth - margin)}px`,
        top: `${Math.max(16, Math.min(viewport.h - estimatedCardHeight - 16, spotlight.top + 12))}px`,
      };
    } else if (spaceBottom >= estimatedCardHeight) {
      cardStyle = {
        width: `${cardWidth}px`,
        left: `${Math.max(12, Math.min(viewport.w - cardWidth - 12, spotlight.left))}px`,
        top: `${spotlight.top + spotlight.height + margin}px`,
      };
    } else if (spaceTop >= estimatedCardHeight) {
      cardStyle = {
        width: `${cardWidth}px`,
        left: `${Math.max(12, Math.min(viewport.w - cardWidth - 12, spotlight.left))}px`,
        top: `${Math.max(12, spotlight.top - estimatedCardHeight - margin)}px`,
      };
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483640] pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Hướng dẫn DOM Meta bước ${safeIndex + 1}: ${current.title}`}
    >
      <svg className="fixed inset-0 w-full h-full pointer-events-auto" onClick={onClose}>
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx={18}
                ry={18}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.56)"
          mask={`url(#${maskId})`}
        />
      </svg>

      {spotlight && (
        <div
          aria-hidden="true"
          style={{
            top: `${spotlight.top}px`,
            left: `${spotlight.left}px`,
            width: `${spotlight.width}px`,
            height: `${spotlight.height}px`,
          }}
          className="fixed rounded-[18px] border-2 border-[#1E40FF] ring-4 ring-white/95 shadow-[0_18px_48px_-12px_rgba(30,64,255,0.42)] pointer-events-none transition-all duration-200"
        />
      )}

      <div
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
        className="fixed pointer-events-auto rounded-2xl bg-white border border-slate-200/95 shadow-[0_24px_64px_-12px_rgba(15,23,42,0.34)] p-4 sm:p-5 space-y-3 transition-all duration-200"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-5 h-5 rounded-md bg-[#1E40FF] text-white text-[10px] font-black flex items-center justify-center shrink-0">
              D
            </span>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#1E40FF] whitespace-nowrap">
              META REPORT TOUR
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-2 text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer whitespace-nowrap"
            >
              Bỏ qua tour
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng hướng dẫn"
              className="w-11 h-11 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#1E40FF]">
            {current.eyebrow}
          </div>
          <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {current.title}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">{current.description}</p>
        </div>

        {current.chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {current.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-lg bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-[11px] font-medium text-slate-700"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onStepChange(Math.max(0, safeIndex - 1))}
            className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isLast) {
                onStepChange(safeIndex + 1);
              } else if (onFinish) {
                onFinish();
              } else {
                onClose();
              }
            }}
            className="min-h-[44px] rounded-xl bg-[#1E40FF] hover:bg-[#1E3A8A] px-3 py-2 text-xs font-bold text-white cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>{isLast ? 'Hoàn tất' : 'Tiếp theo'}</span>
            {isLast ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
