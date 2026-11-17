import React, { useEffect, useId, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  HelpCircle,
  X,
} from 'lucide-react';
import { DomationLogoMark } from '../DomationLogoMark';
import type { HelpTopicKey } from './autodataTypes';

export interface SpotlightTourStep {
  id: string;
  target: string;
  selector?: string;
  eyebrow: string;
  title: string;
  description: string;
  chips: string[];
  topics?: HelpTopicKey[];
  actionLabel?: string;
}

interface AutoDataHelpTriggerProps {
  topic: HelpTopicKey;
  label?: string;
  tone?: 'light' | 'dark';
  webhookUrl?: string;
  saleEmail?: string;
  onOpenTour?: (topic?: HelpTopicKey) => void;
}

/**
 * In-app "?" contextual button: clicking directly launches the interactive
 * Spotlight Highlight + Floating Coachmark Tour pointing at that exact panel.
 */
export function AutoDataHelpTrigger({
  topic,
  label,
  tone = 'light',
  onOpenTour,
}: AutoDataHelpTriggerProps) {
  if (!onOpenTour) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpenTour(topic);
      }}
      aria-label={`Mở hướng dẫn tương tác cho mục ${topic}`}
      title="Nhấn để xem hướng dẫn chỉ điểm ngay trên màn hình"
      className={`inline-flex items-center gap-1 rounded-full border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
        label ? 'px-2.5 py-1 text-[11px] font-semibold' : 'w-5 h-5 justify-center text-[11px] font-bold'
      } ${
        tone === 'dark'
          ? 'border-blue-400/50 bg-blue-500/20 text-blue-200 hover:bg-blue-500/35'
          : 'border-blue-200/90 bg-blue-50 text-[#1E40FF] hover:bg-blue-100'
      }`}
    >
      <HelpCircle className="w-3.5 h-3.5 shrink-0" />
      {label && <span>{label}</span>}
    </button>
  );
}

interface AutoDataSpotlightTourProps {
  open: boolean;
  steps: SpotlightTourStep[];
  activeStepIndex: number;
  onStepChange: (nextIndex: number) => void;
  onClose: () => void;
  onFinish?: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function AutoDataSpotlightTour({
  open,
  steps,
  activeStepIndex,
  onStepChange,
  onClose,
  onFinish,
}: AutoDataSpotlightTourProps) {
  const maskId = useId().replace(/:/g, '');
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
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
        const list = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
        return (
          list.find((node) => {
            const r = node.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          }) || null
        );
      };

      const el =
        findVisibleEl(`[data-tour~="${current.target}"], [data-tour="${current.target}"]`) ||
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

    // Wait briefly so parent tab/step React render + scroll settle cleanly
    const t1 = window.setTimeout(() => findAndMeasure(true), 60);
    const t2 = window.setTimeout(() => findAndMeasure(false), 320);

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

  // Spotlight frame padding
  const pad = 10;
  const spotlight = targetRect
    ? {
        top: Math.max(8, targetRect.top - pad),
        left: Math.max(8, targetRect.left - pad),
        width: Math.min(viewport.w - 16, targetRect.width + pad * 2),
        height: Math.min(viewport.h - 16, targetRect.height + pad * 2),
      }
    : null;

  // Calculate smart anchored floating card coordinates beside the spotlight cutout
  const cardWidth = Math.min(372, viewport.w - 24);
  const estimatedCardHeight = 290;
  const margin = 16;

  let cardStyle: React.CSSProperties = {
    width: `${cardWidth}px`,
    left: `${Math.max(12, Math.round((viewport.w - cardWidth) / 2))}px`,
    top: `${Math.max(12, Math.round((viewport.h - estimatedCardHeight) / 2))}px`,
  };

  if (spotlight) {
    const spaceRight = viewport.w - (spotlight.left + spotlight.width) - margin;
    const spaceLeft = spotlight.left - margin;
    const spaceBottom = viewport.h - (spotlight.top + spotlight.height) - margin;
    const spaceTop = spotlight.top - margin;

    if (viewport.w >= 768 && spaceRight >= cardWidth) {
      // Place cleanly to the RIGHT of the highlighted element
      cardStyle = {
        width: `${cardWidth}px`,
        left: `${spotlight.left + spotlight.width + margin}px`,
        top: `${Math.max(16, Math.min(viewport.h - estimatedCardHeight - 16, spotlight.top + 12))}px`,
      };
    } else if (viewport.w >= 768 && spaceLeft >= cardWidth) {
      // Place cleanly to the LEFT of the highlighted element (matches reference image)
      cardStyle = {
        width: `${cardWidth}px`,
        left: `${Math.max(16, spotlight.left - cardWidth - margin)}px`,
        top: `${Math.max(16, Math.min(viewport.h - estimatedCardHeight - 16, spotlight.top + 12))}px`,
      };
    } else if (spaceBottom >= estimatedCardHeight) {
      // Place BELOW target
      cardStyle = {
        width: `${cardWidth}px`,
        left: `${Math.max(12, Math.min(viewport.w - cardWidth - 12, spotlight.left))}px`,
        top: `${spotlight.top + spotlight.height + margin}px`,
      };
    } else if (spaceTop >= estimatedCardHeight) {
      // Place ABOVE target
      cardStyle = {
        width: `${cardWidth}px`,
        left: `${Math.max(12, Math.min(viewport.w - cardWidth - 12, spotlight.left))}px`,
        top: `${Math.max(12, spotlight.top - estimatedCardHeight - margin)}px`,
      };
    } else {
      // Target fills viewport -> dock cleanly near bottom center
      cardStyle = {
        width: `${cardWidth}px`,
        left: `${Math.max(12, Math.round((viewport.w - cardWidth) / 2))}px`,
        bottom: '20px',
      };
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[140] pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Hướng dẫn bước ${safeIndex + 1}: ${current.title}`}
    >
      {/* Translucent Dimmed Backdrop with Crisp Bright Spotlight Cutout */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto"
        onClick={onClose}
      >
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx={20}
                ry={20}
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
          fill="rgba(15, 23, 42, 0.54)"
          mask={`url(#${maskId})`}
        />
      </svg>

      {/* Luminous Highlight Ring Around Target */}
      {spotlight && (
        <div
          aria-hidden="true"
          style={{
            top: `${spotlight.top}px`,
            left: `${spotlight.left}px`,
            width: `${spotlight.width}px`,
            height: `${spotlight.height}px`,
          }}
          className="fixed rounded-[20px] border-2 border-[#1E40FF] ring-4 ring-white/95 shadow-[0_18px_48px_-12px_rgba(30,64,255,0.42)] pointer-events-none transition-all duration-200"
        />
      )}

      {/* Anchored Floating Coachmark Card */}
      <div
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
        className="fixed pointer-events-auto rounded-2xl bg-white border border-slate-200/95 shadow-[0_24px_64px_-12px_rgba(15,23,42,0.34)] p-5 space-y-3.5 transition-all duration-200"
      >
        {/* Top Row: DOMATION Mark + Badge + Close */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <DomationLogoMark size={20} className="shrink-0" />
            <span className="text-xs font-extrabold tracking-tight text-slate-900">
              DOMATION
            </span>
            <span className="rounded-full bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[10px] font-bold text-[#1E40FF] whitespace-nowrap">
              AUTO DATA TOUR
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hướng dẫn"
            className="w-7 h-7 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Eyebrow + Title + Explanation */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#1E40FF]">
            BƯỚC {safeIndex + 1} / {steps.length} • {current.eyebrow}
          </div>
          <h4 className="text-base font-bold text-slate-900 leading-snug">
            {current.title}
          </h4>
          <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Clean Feature / Instruction Pill Chips */}
        {current.chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {current.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-lg bg-slate-100/90 border border-slate-200/70 px-2.5 py-1 text-[11px] font-medium text-slate-700"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Footer: Progress Dots + Skip + Back / Next */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1" aria-hidden="true">
              {steps.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onStepChange(idx)}
                  aria-label={`Chuyển đến bước ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === safeIndex
                      ? 'w-5 bg-[#1E40FF]'
                      : idx < safeIndex
                        ? 'w-1.5 bg-blue-300'
                        : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer whitespace-nowrap"
            >
              Bỏ qua tour
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isFirst && (
              <button
                type="button"
                onClick={() => onStepChange(safeIndex - 1)}
                aria-label="Quay lại bước trước"
                className="ql-btn-outline rounded-xl px-2.5 py-2 text-xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
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
              className="btn-inkica-primary rounded-xl px-3.5 py-2 text-xs cursor-pointer whitespace-nowrap"
            >
              <span>{isLast ? current.actionLabel || 'Hoàn tất' : 'Tiếp theo'}</span>
              {isLast ? (
                <Check className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
