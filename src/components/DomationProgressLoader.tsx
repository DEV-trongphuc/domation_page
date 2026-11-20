import React from 'react';
import { DomationLogoMark } from './DomationLogoMark';

export interface DomationProgressLoaderProps {
  title?: string;
  subtitle?: string;
  /** Render inside a section container instead of full-viewport fixed overlay */
  embedded?: boolean;
  className?: string;
}

/**
 * Background-matched ambient light Progress Loading modal (no spinners).
 * Reused across React Suspense fallbacks and async workspace resolution gates
 * so transitions match the pre-hydration HTML splash seamlessly.
 */
export const DomationProgressLoader: React.FC<DomationProgressLoaderProps> = ({
  title = 'DOMATION Suite',
  subtitle = 'Đang tải không gian làm việc...',
  embedded = false,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`${
        embedded ? 'min-h-[380px] w-full rounded-2xl' : 'min-h-screen w-full'
      } relative flex items-center justify-center p-6 overflow-hidden bg-[#F8F9FA] text-[#0F172A] ${className}`}
      style={{
        backgroundImage:
          'radial-gradient(circle at 18% 20%, rgba(30, 64, 255, 0.11), transparent 44%), radial-gradient(circle at 82% 80%, rgba(6, 182, 212, 0.12), transparent 46%)',
      }}
    >
      <div className="relative z-10 w-full max-w-[340px] rounded-[22px] bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)] px-6 py-7 flex flex-col items-center text-center gap-4">
        <div className="flex items-center gap-3">
          <DomationLogoMark size={38} />
          <div className="text-left">
            <div className="text-sm font-black tracking-tight text-[#0F172A] leading-none">
              {title}
            </div>
            <div className="text-[11px] font-semibold text-[#1E40FF] mt-1 tracking-wide">
              ENTERPRISE ECOSYSTEM
            </div>
          </div>
        </div>

        <div className="w-full space-y-2">
          <div className="w-full h-2 rounded-full bg-slate-200/90 overflow-hidden relative">
            <div className="domation-progress-bar h-full rounded-full bg-gradient-to-r from-[#1E40FF] via-[#2563EB] to-[#06B6D4]" />
          </div>
          <p className="text-xs font-medium text-slate-600">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
