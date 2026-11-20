/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
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
    selector: '[data-tour="dom-meta-kpis"], [data-testid="open-perf-compare"]',
    eyebrow: 'BƯỚC 1 / 5 • CHỈ SỐ TỔNG QUAN',
    title: 'KPI Quảng cáo Realtime & Tỷ lệ Giữ chân 3 giây',
    description:
      'Theo dõi tức thì Chi tiêu, Tin nhắn, Lead Ads và điểm giữ chân Video 3 giây mà không cần tải lại Trình quản lý Quảng cáo Meta.',
    chips: ['Graph v25.0', 'Video 3s Hook'],
  },
  {
    id: 'dm-campaigns',
    target: 'dom-meta-campaigns',
    selector:
      '[data-tour="dom-meta-campaigns"], [data-testid="nav-ad_detail"], [data-testid="sidebar-meta-sub-ad_detail"], [data-testid="erp-sidebar-meta-sub-ad_detail"]',
    eyebrow: 'BƯỚC 2 / 5 • ĐỐI CHIẾU CRM THẬT',
    title: 'Chiến dịch → Nhóm → Bài QC & Tỷ lệ Lead Qualified CRM',
    description:
      'Bấm vào từng chiến dịch hoặc bài quảng cáo để xem số Lead chất lượng, Đặt cọc & Doanh thu thực tế đối chiếu trực tiếp từ CRM.',
    chips: ['CPQL Thực', 'ROAS CRM'],
  },
  {
    id: 'dm-heatmap',
    target: 'dom-meta-heatmap',
    selector:
      '[data-tour="dom-meta-heatmap"], [data-testid="dashboard-hourly-funnel-row"], .recharts-responsive-container',
    eyebrow: 'BƯỚC 3 / 5 • KHUNG GIỜ VÀNG & ĐỊA LÝ',
    title: 'Bản đồ nhiệt 24/7, Tuổi/Giới tính & Vùng miền',
    description:
      'Phát hiện chính xác khung giờ có nhiều khách nhắn tin/điền form nhất và vùng miền mang lại doanh thu cao nhất.',
    chips: ['Heatmap 24/7', 'Age & Gender'],
  },
  {
    id: 'dm-gads',
    target: 'dom-meta-gads',
    selector:
      '[data-tour="dom-meta-gads"], [data-testid="nav-google_ads"], [data-testid="sidebar-meta-sub-google_ads"], [data-testid="erp-sidebar-meta-sub-google_ads"], [data-testid="open-workspace-settings"], [data-testid="mobile-header-overflow"], [data-testid="mobile-nav-menu-btn"]',
    eyebrow: 'BƯỚC 4 / 5 • MỞ RỘNG GOOGLE ADS',
    title: 'Bật Google Ads 5 bước khi chạy đa kênh',
    description:
      'Mặc định giữ gọn chỉ hiển thị Meta Ads. Khi cần theo dõi thêm Google Ads & từ khóa tìm kiếm, gạt công tắc trong Cài đặt kết nối.',
    chips: ['Opt-in Đa kênh', 'Từ khóa Search'],
  },
  {
    id: 'dm-capi',
    target: 'dom-meta-capi',
    selector:
      '[data-tour="dom-meta-capi"], [data-testid="nav-meta_capi"], [data-testid="sidebar-meta-sub-meta_capi"], [data-testid="erp-sidebar-meta-sub-meta_capi"], [data-testid="nav-lead_attribution"], [data-testid="sidebar-meta-sub-lead_attribution"], [data-testid="erp-sidebar-meta-sub-lead_attribution"], [data-testid="open-workspace-settings"], [data-testid="open-account-manager"], [data-testid="mobile-nav-menu-btn"]',
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
  const maskId = `dom_meta_mask_${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [viewport, setViewport] = useState(() =>
    typeof window !== 'undefined'
      ? { w: window.innerWidth, h: window.innerHeight }
      : { w: 1280, h: 800 }
  );
  const [measuredCardHeight, setMeasuredCardHeight] = useState(296);

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
    let targetResizeObserver: ResizeObserver | null = null;
    let observedEl: HTMLElement | null = null;

    const findVisibleEl = (selectorList: string): HTMLElement | null => {
      const parts = selectorList
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const sel of parts) {
        try {
          const list = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
          const found = list.find((node) => {
            const style = window.getComputedStyle(node);
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              parseFloat(style.opacity || '1') <= 0.02
            ) {
              return false;
            }
            const r = node.getBoundingClientRect();
            return r.width > 4 && r.height > 4;
          });
          if (found) return found;
        } catch {
          // skip invalid selector
        }
      }
      return null;
    };

    const findAndMeasure = (shouldScroll: boolean) => {
      if (cancelled) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setViewport((prev) => (prev.w === vw && prev.h === vh ? prev : { w: vw, h: vh }));

      const el =
        findVisibleEl(`[data-tour="${current.target}"]`) ||
        (current.selector ? findVisibleEl(current.selector) : null);

      if (!el) {
        if (observedEl && targetResizeObserver) {
          targetResizeObserver.disconnect();
          observedEl = null;
        }
        setTargetRect((prev) => (prev === null ? prev : null));
        return;
      }

      if (typeof ResizeObserver !== 'undefined' && el !== observedEl) {
        targetResizeObserver?.disconnect();
        observedEl = el;
        targetResizeObserver = new ResizeObserver(() => {
          cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => findAndMeasure(false));
        });
        targetResizeObserver.observe(el);
      }

      const preRect = el.getBoundingClientRect();
      if (shouldScroll) {
        const comfortablyInView =
          preRect.top >= 74 &&
          preRect.bottom <= vh - 32 &&
          preRect.left >= 0 &&
          preRect.right <= vw;
        if (!comfortablyInView) {
          el.scrollIntoView({
            behavior: 'smooth',
            block: preRect.height > vh * 0.65 ? 'start' : 'center',
            inline: 'nearest',
          });
        }
      }

      const rect = el.getBoundingClientRect();
      if (rect.width > 4 && rect.height > 4) {
        const nextRect = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
        setTargetRect((prev) =>
          prev &&
          Math.abs(prev.top - nextRect.top) < 0.5 &&
          Math.abs(prev.left - nextRect.left) < 0.5 &&
          Math.abs(prev.width - nextRect.width) < 0.5 &&
          Math.abs(prev.height - nextRect.height) < 0.5
            ? prev
            : nextRect
        );
      } else {
        setTargetRect((prev) => (prev === null ? prev : null));
      }
    };

    const handleReposition = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => findAndMeasure(false));
    };

    findAndMeasure(true);
    const t1 = window.setTimeout(() => findAndMeasure(true), 80);
    const t2 = window.setTimeout(() => findAndMeasure(false), 260);
    const t3 = window.setTimeout(() => findAndMeasure(false), 520);
    const t4 = window.setTimeout(() => findAndMeasure(false), 820);
    const pollTimer = window.setInterval(() => findAndMeasure(false), 450);

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
      window.clearInterval(pollTimer);
      targetResizeObserver?.disconnect();
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, current]);

  useLayoutEffect(() => {
    if (!open || !current) return;
    const measureCard = () => {
      const node = cardRef.current;
      if (!node) return;
      const h = Math.ceil(node.getBoundingClientRect().height || node.offsetHeight || 0);
      if (h > 0) {
        setMeasuredCardHeight((prev) => (Math.abs(h - prev) >= 2 ? h : prev));
      }
    };
    measureCard();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && cardRef.current) {
      ro = new ResizeObserver(measureCard);
      ro.observe(cardRef.current);
    }
    return () => ro?.disconnect();
  }, [open, current, safeIndex, viewport.w, viewport.h]);

  if (!open || !current || typeof document === 'undefined') return null;

  const isFirst = safeIndex === 0;
  const isLast = safeIndex === steps.length - 1;
  const pad = 8;
  const spotlight = targetRect
    ? (() => {
        const x1 = Math.max(6, targetRect.left - pad);
        const y1 = Math.max(6, targetRect.top - pad);
        const x2 = Math.min(viewport.w - 6, targetRect.left + targetRect.width + pad);
        const y2 = Math.min(viewport.h - 6, targetRect.top + targetRect.height + pad);
        const width = x2 - x1;
        const height = y2 - y1;
        if (width < 8 || height < 8) return null;
        return { top: y1, left: x1, width, height };
      })()
    : null;

  const cardWidth = Math.min(372, viewport.w - 24);
  const effectiveCardHeight = Math.min(viewport.h - 32, Math.max(260, measuredCardHeight));
  const margin = 16;

  let cardStyle: React.CSSProperties = {
    position: 'fixed',
    width: `${cardWidth}px`,
    left: `${Math.max(12, Math.round((viewport.w - cardWidth) / 2))}px`,
    bottom: '16px',
  };

  if (spotlight && viewport.w >= 768) {
    const spaceRight = viewport.w - (spotlight.left + spotlight.width) - margin;
    const spaceLeft = spotlight.left - margin;
    const spaceBottom = viewport.h - (spotlight.top + spotlight.height) - margin;
    const spaceTop = spotlight.top - margin;
    const maxTop = Math.max(16, viewport.h - effectiveCardHeight - 16);
    const centeredLeft = Math.max(
      12,
      Math.min(viewport.w - cardWidth - 12, spotlight.left + (spotlight.width - cardWidth) / 2)
    );

    if (spaceRight >= cardWidth) {
      cardStyle = {
        position: 'fixed',
        width: `${cardWidth}px`,
        left: `${spotlight.left + spotlight.width + margin}px`,
        top: `${Math.max(16, Math.min(maxTop, spotlight.top))}px`,
      };
    } else if (spaceLeft >= cardWidth) {
      cardStyle = {
        position: 'fixed',
        width: `${cardWidth}px`,
        left: `${Math.max(16, spotlight.left - cardWidth - margin)}px`,
        top: `${Math.max(16, Math.min(maxTop, spotlight.top))}px`,
      };
    } else if (spaceBottom >= effectiveCardHeight) {
      cardStyle = {
        position: 'fixed',
        width: `${cardWidth}px`,
        left: `${centeredLeft}px`,
        top: `${Math.max(16, Math.min(maxTop, spotlight.top + spotlight.height + margin))}px`,
      };
    } else if (spaceTop >= effectiveCardHeight) {
      cardStyle = {
        position: 'fixed',
        width: `${cardWidth}px`,
        left: `${centeredLeft}px`,
        top: `${Math.max(16, spotlight.top - effectiveCardHeight - margin)}px`,
      };
    } else {
      // Target is very large: dock in whichever corner avoids overlapping the top-left of the target
      cardStyle = {
        position: 'fixed',
        width: `${cardWidth}px`,
        right: '20px',
        bottom: '20px',
      };
    }
  } else if (spotlight && viewport.w < 768) {
    const spaceBottom = viewport.h - (spotlight.top + spotlight.height) - 12;
    const spaceTop = spotlight.top - 12;
    if (spaceBottom >= effectiveCardHeight) {
      cardStyle = {
        position: 'fixed',
        width: `${cardWidth}px`,
        left: `${Math.max(12, Math.round((viewport.w - cardWidth) / 2))}px`,
        top: `${spotlight.top + spotlight.height + 12}px`,
      };
    } else if (spaceTop >= effectiveCardHeight) {
      cardStyle = {
        position: 'fixed',
        width: `${cardWidth}px`,
        left: `${Math.max(12, Math.round((viewport.w - cardWidth) / 2))}px`,
        top: `${Math.max(12, spotlight.top - effectiveCardHeight - 12)}px`,
      };
    }
  }

  return createPortal(
    <div className="mkt-scope" style={{ display: 'contents' }}>
      <div
        className="fixed inset-0 z-[2147483640] pointer-events-none"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2147483640,
          pointerEvents: 'none',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`Hướng dẫn DOM Meta bước ${safeIndex + 1}: ${current.title}`}
      >
        <svg
          width={viewport.w}
          height={viewport.h}
          viewBox={`0 0 ${viewport.w} ${viewport.h}`}
          className="fixed inset-0 w-full h-full pointer-events-auto"
          style={{
            position: 'fixed',
            inset: 0,
            width: `${viewport.w}px`,
            height: `${viewport.h}px`,
            pointerEvents: 'auto',
          }}
          onClick={onClose}
        >
          <defs>
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={viewport.w}
              height={viewport.h}
            >
              <rect x="0" y="0" width={viewport.w} height={viewport.h} fill="white" />
              {spotlight && (
                <rect
                  x={spotlight.left}
                  y={spotlight.top}
                  width={spotlight.width}
                  height={spotlight.height}
                  rx={16}
                  ry={16}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width={viewport.w}
            height={viewport.h}
            fill="rgba(15, 23, 42, 0.56)"
            mask={`url(#${maskId})`}
          />
        </svg>

        {spotlight && (
          <div
            aria-hidden="true"
            data-testid="dom-meta-tour-spotlight"
            style={{
              position: 'fixed',
              top: `${spotlight.top}px`,
              left: `${spotlight.left}px`,
              width: `${spotlight.width}px`,
              height: `${spotlight.height}px`,
              borderRadius: '16px',
              border: '2px solid #1E40FF',
              boxShadow:
                '0 0 0 4px rgba(255, 255, 255, 0.94), 0 18px 48px -12px rgba(30, 64, 255, 0.44)',
              pointerEvents: 'none',
              boxSizing: 'border-box',
              transition: 'top 180ms ease, left 180ms ease, width 180ms ease, height 180ms ease',
            }}
          />
        )}

        <div
          ref={cardRef}
          data-testid="dom-meta-tour-card"
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
                className="min-h-[36px] px-2 text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer whitespace-nowrap"
              >
                Bỏ qua tour
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng hướng dẫn"
                className="w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
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
              className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
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
              className="min-h-[42px] rounded-xl bg-[#1E40FF] hover:bg-[#1E3A8A] px-3 py-2 text-xs font-bold text-white cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{isLast ? 'Hoàn tất' : 'Tiếp theo'}</span>
              {isLast ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
