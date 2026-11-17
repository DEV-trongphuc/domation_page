import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { DrawerSkeleton } from '../components/ui/Skeleton';

export interface DrawerTabDef {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface DrawerShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  avatarNode?: React.ReactNode;
  headerActions?: React.ReactNode;
  headerSubBar?: React.ReactNode;
  tabs?: DrawerTabDef[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  footer?: React.ReactNode;
  loading?: boolean;
  width?: string;
  zIndex?: number;
  children: React.ReactNode;
}

export const DrawerShell: React.FC<DrawerShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  avatarNode,
  headerActions,
  headerSubBar,
  tabs,
  activeTab,
  onTabChange,
  footer,
  loading = false,
  width = 'min(1140px, calc(100vw - 64px))',
  zIndex = 1200,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex,
              background: 'rgba(15, 23, 42, 0.36)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              cursor: 'pointer',
            }}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x: '100%', opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width,
              maxWidth: '100vw',
              zIndex: zIndex + 5,
              background: '#F8F9FA',
              boxShadow: '-16px 0 40px rgba(15, 23, 42, 0.14)',
              borderLeft: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: '#FFFFFF',
                borderBottom: '1px solid #E2E8F0',
                padding: '1rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0, flex: 1 }}>
                  {avatarNode}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: '#0F172A',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      {title}
                    </div>
                    {subtitle && (
                      <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 3 }}>
                        {subtitle}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {headerActions}
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Đóng ngăn trượt"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      color: '#475569',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {headerSubBar}
            </div>

            {/* Body with optional Left Tab Rail */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              {tabs && tabs.length > 0 && (
                <nav
                  aria-label="Drawer tabs"
                  style={{
                    width: 230,
                    flexShrink: 0,
                    background: '#FFFFFF',
                    borderRight: '1px solid #E2E8F0',
                    padding: '1rem 0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    overflowY: 'auto',
                  }}
                >
                  {tabs.map((tb) => {
                    const isActive = activeTab === tb.id;
                    return (
                      <button
                        key={tb.id}
                        type="button"
                        onClick={() => onTabChange?.(tb.id)}
                        style={{
                          minHeight: 42,
                          padding: '0.55rem 0.85rem',
                          borderRadius: 10,
                          border: isActive ? '1px solid #DBEAFE' : '1px solid transparent',
                          background: isActive ? '#EFF6FF' : 'transparent',
                          color: isActive ? '#1E40FF' : '#475569',
                          fontWeight: isActive ? 700 : 600,
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          {tb.icon}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tb.label}
                          </span>
                        </span>
                        {tb.badge !== undefined && tb.badge !== 0 && tb.badge !== '0' && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '1px 7px',
                              borderRadius: 999,
                              background: isActive ? '#1E40FF' : '#F1F5F9',
                              color: isActive ? '#FFFFFF' : '#475569',
                            }}
                          >
                            {tb.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              )}

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflowY: 'auto',
                  padding: '1.35rem 1.5rem',
                  background: '#F8F9FA',
                }}
              >
                {loading ? <DrawerSkeleton /> : children}
              </div>
            </div>

            {footer && (
              <div
                style={{
                  background: '#FFFFFF',
                  borderTop: '1px solid #E2E8F0',
                  padding: '0.85rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 10,
                  flexShrink: 0,
                }}
              >
                {footer}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
