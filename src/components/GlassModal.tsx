import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';
import { lockBodyScroll, pushOverlay, unlockBodyScroll } from '../utils/overlayStack';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  maxWidthClass?: string;
  headerActions?: React.ReactNode;
  hideHeader?: boolean;
  noPaddingBody?: boolean;
  children: React.ReactNode;
}

const IOS_SHEET_EASE = [0.32, 0.72, 0, 1] as const;
const MACOS_SPRING_EASE = [0.22, 1, 0.36, 1] as const;

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  eyebrow,
  maxWidthClass = 'max-w-5xl',
  headerActions,
  hideHeader = false,
  noPaddingBody = false,
  children,
}) => {
  const reactId = useId();
  const overlayId = `glass_modal_${reactId.replace(/:/g, '')}`;
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    const unregister = pushOverlay(overlayId, () => onCloseRef.current(), 220);
    return () => {
      unlockBodyScroll();
      unregister();
    };
  }, [isOpen, overlayId]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="modal-backdrop fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-slate-950/60 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={isMobile ? { y: '100%', opacity: 1 } : { opacity: 0, scale: 0.96, y: 10 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: '100%', opacity: 0.95 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{
              duration: isMobile ? 0.28 : 0.22,
              ease: isMobile ? IOS_SHEET_EASE : MACOS_SPRING_EASE,
            }}
            className={`relative w-full ${maxWidthClass} max-h-[93dvh] sm:max-h-[90dvh] flex flex-col rounded-t-[24px] sm:rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_28px_80px_-18px_rgba(15,23,42,0.35)] overflow-hidden`}
            style={{ willChange: 'transform, opacity' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile iOS grabber bar */}
            <div className="sm:hidden w-10 h-1.5 rounded-full bg-slate-300/80 mx-auto mt-2.5 mb-0.5 shrink-0" />

            {/* Header */}
            {!hideHeader && (
              <div className="flex items-start justify-between gap-3 sm:gap-4 px-4 sm:px-7 py-3.5 sm:py-5 border-b border-slate-100 bg-white/95 shrink-0">
                <div className="min-w-0">
                  {eyebrow && (
                    <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E40FF] mb-1">
                      {eyebrow}
                    </div>
                  )}
                  {title && (
                    <h3 className="text-base sm:text-2xl font-extrabold text-slate-900 leading-snug tracking-tight">
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
                    data-dom-overlay-close="true"
                    onClick={onClose}
                    aria-label="Đóng cửa sổ"
                    className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-[#1E40FF] border border-slate-200/80 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable body */}
            <div
              className={`overflow-y-auto flex-1 custom-modal-scroll ${
                noPaddingBody
                  ? 'p-0'
                  : 'px-4 sm:px-7 py-4 sm:py-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]'
              }`}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

interface ImageZoomModalProps {
  image: { src: string; title: string; badge?: string; desc?: string } | null;
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ image, onClose }) => {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!image) return;
    lockBodyScroll();
    const unregister = pushOverlay('landing_image_zoom_modal', () => onCloseRef.current(), 260);
    return () => {
      unlockBodyScroll();
      unregister();
    };
  }, [image]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="modal-backdrop fixed inset-0 z-[140] flex flex-col items-center justify-center p-3 sm:p-8 bg-slate-950/90 backdrop-blur-lg"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22, ease: MACOS_SPRING_EASE }}
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
                data-dom-overlay-close="true"
                onClick={onClose}
                aria-label="Đóng ảnh phóng to"
                className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-slate-900/80 border border-white/15 shadow-2xl max-h-[82dvh] w-full flex items-center justify-center">
              <img
                src={image.src}
                alt={image.title}
                className="max-w-full max-h-[80dvh] object-contain select-none"
              />
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/75 text-white/80 text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-sm">
                <ZoomIn className="w-3.5 h-3.5 text-cyan-400" /> Vuốt Back, ESC hoặc chạm ngoài để đóng
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
