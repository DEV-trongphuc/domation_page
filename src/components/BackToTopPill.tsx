import React from 'react';
import { ArrowUp } from 'lucide-react';

export interface BackToTopPillProps {
  /** Controls visibility when bound to scroll state; defaults to always visible when rendered */
  show?: boolean;
  /** Override bottom offset (e.g. "bottom-[92px] sm:bottom-[88px]" above fixed footers) */
  bottomClassName?: string;
}

export const BackToTopPill: React.FC<BackToTopPillProps> = ({
  show = true,
  bottomClassName = 'bottom-4',
}) => {
  if (!show) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Lên đầu trang"
      className={`fixed ${bottomClassName} left-1/2 -translate-x-1/2 z-40 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-full bg-[#1E40FF] hover:bg-[#1D35D6] text-white text-xs font-semibold shadow-[0_10px_28px_-6px_rgba(30,64,255,0.48)] border border-blue-400/35 whitespace-nowrap active:scale-95 transition-all cursor-pointer`}
    >
      <ArrowUp className="w-3.5 h-3.5 shrink-0" />
      <span>Đầu trang</span>
    </button>
  );
};

export default BackToTopPill;
