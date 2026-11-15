import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn } from 'lucide-react';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  maxWidthClass?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  eyebrow,
  maxWidthClass = 'max-w-5xl',
  headerActions,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-md animate-[fadeIn_0.18s_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full ${maxWidthClass} max-h-[92vh] flex flex-col rounded-[24px] sm:rounded-[30px] bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_28px_80px_-18px_rgba(15,23,42,0.42)] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top subtle sapphire-cyan accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#1E40FF] via-[#0284C7] to-[#06B6D4] shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-100 bg-white/90 shrink-0">
          <div className="min-w-0">
            {eyebrow && (
              <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E40FF] mb-1">
                {eyebrow}
              </div>
            )}
            {title && (
              <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-snug tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-[#1E40FF] border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 sm:px-8 py-5 sm:py-6 custom-modal-scroll">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

interface ImageZoomModalProps {
  image: { src: string; title: string; badge?: string; desc?: string } | null;
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ image, onClose }) => {
  useEffect(() => {
    if (!image) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [image, onClose]);

  if (!image || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[140] flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-950/90 backdrop-blur-lg"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-6xl w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex items-center justify-between gap-4 mb-3 px-1">
          <div className="min-w-0">
            {image.badge && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-cyan-300 mb-0.5">
                {image.badge}
              </span>
            )}
            <h4 className="text-sm sm:text-base font-bold text-white truncate">{image.title}</h4>
            {image.desc && <p className="text-xs text-slate-300 truncate">{image.desc}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng ảnh phóng to"
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-slate-900/80 border border-white/15 shadow-2xl max-h-[82vh] w-full flex items-center justify-center">
          <img
            src={image.src}
            alt={image.title}
            className="max-w-full max-h-[80vh] object-contain select-none"
          />
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/75 text-white/80 text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-sm">
            <ZoomIn className="w-3.5 h-3.5 text-cyan-400" /> Nhấn ESC hoặc ra ngoài để đóng
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
