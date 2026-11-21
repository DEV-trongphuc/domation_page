import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './CustomModal.module.css';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  width?: string | number;
  children: React.ReactNode;
  showCloseIcon?: boolean;
  disableAnimation?: boolean;
}

export const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  title,
  width,
  children,
  showCloseIcon = true,
  disableAnimation = false
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const sheetBody = (
    <>
      <div className={styles.grabHandleWrap} aria-hidden="true">
        <div className={styles.grabHandle} />
      </div>

      {title && (
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {showCloseIcon && (
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          )}
        </div>
      )}
      {!title && showCloseIcon && (
        <button type="button" className={`${styles.closeBtn} ${styles.floatingClose}`} onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
      )}

      <div className={`${styles.content} custom-scrollbar`}>
        {children}
      </div>
    </>
  );

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        disableAnimation ? (
          <div className={styles.overlay}>
            <div
              className={styles.backdrop}
              onClick={onClose}
            />

            <div
              className={`${styles.modal} ${isMobile ? styles.mobileSheetStatic : ''}`}
              style={width ? { width, maxWidth: '95vw' } : {}}
            >
              {sheetBody}
            </div>
          </div>
        ) : (
          <div className={styles.overlay}>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: isMobile ? 0.2 : 0.22 }}
              onClick={onClose}
            />

            <motion.div
              className={styles.modal}
              style={width ? { width, maxWidth: '95vw' } : {}}
              initial={isMobile ? { opacity: 0.9, y: 48 } : { opacity: 0, scale: 0.95, y: 15 }}
              animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isMobile ? { opacity: 0, y: 48 } : { opacity: 0, scale: 0.95, y: 15 }}
              transition={
                isMobile
                  ? { type: 'spring', stiffness: 420, damping: 36, mass: 0.9 }
                  : { type: 'spring', duration: 0.4, bounce: 0.12 }
              }
            >
              {sheetBody}
            </motion.div>
          </div>
        )
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
