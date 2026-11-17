import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Inbox } from 'lucide-react';
import { useOptionalAuth } from '../../contexts/AuthContext';
import { TableSkeleton } from './Skeleton';

export interface AutoDataLoadingModalProps {
  isOpen?: boolean;
  inline?: boolean;
  message?: string;
  subMessage?: string;
  progress?: number;
  brandLogoUrl?: string | null;
}

declare global {
  interface Window {
    hideSplashScreen?: () => void;
  }
}

const DEFAULT_ROBOT_LOGO = '/imgs/autodata/ICON.png';

export const AutoDataLoadingModal: React.FC<AutoDataLoadingModalProps> = ({
  isOpen = true,
  inline = false,
  message = 'Đang đồng bộ không gian làm việc DOMATION...',
  subMessage = 'Hệ sinh thái SaaS Đa Phân Hệ • Zero-Leakage RLS',
  progress,
  brandLogoUrl,
}) => {
  const auth = useOptionalAuth();
  const [failedCustomLogo, setFailedCustomLogo] = useState<string | null>(null);

  const candidateLogo =
    brandLogoUrl ||
    (typeof auth?.tenantSettings?.brand_logo_url === 'string' && auth.tenantSettings.brand_logo_url.trim()
      ? auth.tenantSettings.brand_logo_url.trim()
      : '');
  const resolvedLogo =
    candidateLogo && candidateLogo !== failedCustomLogo ? candidateLogo : DEFAULT_ROBOT_LOGO;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prevHide = window.hideSplashScreen;
    window.hideSplashScreen = () => {
      window.dispatchEvent(new CustomEvent('splash-dismissed'));
    };
    if (!isOpen) {
      window.dispatchEvent(new CustomEvent('splash-dismissed'));
    }
    return () => {
      if (prevHide) {
        window.hideSplashScreen = prevHide;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasDeterminateProgress =
    typeof progress === 'number' && Number.isFinite(progress) && progress >= 0;
  const clampedProgress = hasDeterminateProgress ? Math.min(100, Math.max(4, progress)) : 0;

  const cardBody = (
    <div
      className="inkica-glass-card"
      role="status"
      aria-live="polite"
      style={{
        width: inline ? 'min(380px, 92vw)' : 'min(410px, 92vw)',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '24px',
        padding: inline ? '1.75rem 1.75rem' : '2.15rem 2rem',
        boxShadow: '0 24px 64px -12px rgba(30, 64, 255, 0.20), 0 8px 20px -6px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes autodata-float-gentle {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-6px) scale(1.025); }
        }
        @keyframes autodata-orbit-cw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes autodata-orbit-ccw {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes autodata-progress-sweep {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(40%); }
          100% { transform: translateX(220%); }
        }
        .autodata-tabular-nums {
          font-variant-numeric: lining-nums tabular-nums;
        }
        .autodata-bright-tr {
          position: relative;
          transition: background-color 0.16s ease;
        }
        .autodata-bright-tr:hover {
          background-color: rgba(30, 64, 255, 0.04) !important;
        }
        .autodata-bright-tr td:first-child {
          position: relative;
        }
        .autodata-bright-tr td:first-child::before {
          content: '';
          position: absolute;
          left: 0;
          top: 6px;
          bottom: 6px;
          width: 3.5px;
          border-radius: 0 4px 4px 0;
          background: linear-gradient(180deg, #1E40FF 0%, #06B6D4 100%);
          opacity: 0;
          transform: scaleY(0.4);
          transition: opacity 0.18s ease, transform 0.18s ease;
        }
        .autodata-bright-tr:hover td:first-child::before {
          opacity: 1;
          transform: scaleY(1);
        }
      `}</style>

      {/* Subtle ambient Sapphire radial aura */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-48px',
          width: '220px',
          height: '140px',
          background: 'radial-gradient(circle, rgba(30, 64, 255, 0.11) 0%, rgba(6, 182, 212, 0.05) 55%, transparent 75%)',
          pointerEvents: 'none',
        }}
      />

      {/* Dual Sapphire-Cyan Orbital Ring + Floating Robot Logo */}
      <div
        style={{
          position: 'relative',
          width: 108,
          height: 108,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.15rem',
        }}
      >
        {/* Outer clockwise Sapphire -> Cyan ring */}
        <svg
          width="108"
          height="108"
          viewBox="0 0 108 108"
          style={{
            position: 'absolute',
            inset: 0,
            animation: 'autodata-orbit-cw 2.4s linear infinite',
          }}
        >
          <defs>
            <linearGradient id="autodata-sapphire-cyan-outer" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E40FF" stopOpacity="1" />
              <stop offset="60%" stopColor="#0284C7" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <circle
            cx="54"
            cy="54"
            r="50"
            fill="none"
            stroke="#EEF2FF"
            strokeWidth="3"
          />
          <circle
            cx="54"
            cy="54"
            r="50"
            fill="none"
            stroke="url(#autodata-sapphire-cyan-outer)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray="195 125"
          />
        </svg>

        {/* Inner counter-clockwise Cyan -> Sapphire orbital ring */}
        <svg
          width="88"
          height="88"
          viewBox="0 0 88 88"
          style={{
            position: 'absolute',
            width: 88,
            height: 88,
            animation: 'autodata-orbit-ccw 3.1s linear infinite',
          }}
        >
          <defs>
            <linearGradient id="autodata-sapphire-cyan-inner" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.95" />
              <stop offset="65%" stopColor="#1E40FF" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#1E40FF" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <circle
            cx="44"
            cy="44"
            r="40"
            fill="none"
            stroke="url(#autodata-sapphire-cyan-inner)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="110 145"
          />
        </svg>

        {/* Center Floating Robot Logo */}
        <div
          className="animate-float-gentle"
          style={{
            width: 66,
            height: 66,
            borderRadius: '20px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 20px rgba(30, 64, 255, 0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8,
            animation: 'autodata-float-gentle 2.8s ease-in-out infinite',
            zIndex: 2,
          }}
        >
          <img
            src={resolvedLogo}
            alt="DOMATION Robot Logo"
            onError={() => {
              if (candidateLogo) setFailedCustomLogo(candidateLogo);
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              userSelect: 'none',
            }}
          />
        </div>
      </div>

      {/* Dynamic Status Message */}
      <div
        style={{
          fontSize: '0.95rem',
          fontWeight: 700,
          color: '#0F172A',
          lineHeight: 1.4,
          marginBottom: '0.35rem',
        }}
      >
        {message}
      </div>

      {subMessage && (
        <div
          style={{
            fontSize: '0.76rem',
            fontWeight: 500,
            color: '#64748B',
            marginBottom: '1.1rem',
          }}
        >
          {subMessage}
        </div>
      )}

      {/* Thin 4px Royal Sapphire -> Cyan Progress Bar */}
      <div
        style={{
          width: '100%',
          height: 4,
          borderRadius: 9999,
          background: '#E2E8F0',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {hasDeterminateProgress ? (
          <div
            style={{
              width: `${clampedProgress}%`,
              height: '100%',
              borderRadius: 9999,
              background: 'linear-gradient(90deg, #1E40FF 0%, #0284C7 55%, #06B6D4 100%)',
              transition: 'width 0.25s ease',
            }}
          />
        ) : (
          <div
            style={{
              width: '46%',
              height: '100%',
              borderRadius: 9999,
              background: 'linear-gradient(90deg, #1E40FF 0%, #0284C7 55%, #06B6D4 100%)',
              animation: 'autodata-progress-sweep 1.55s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />
        )}
      </div>
    </div>
  );

  if (inline) {
    return (
      <div
        style={{
          minHeight: 360,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        {cardBody}
      </div>
    );
  }

  const overlay = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {cardBody}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(overlay, document.body) : null;
};

/* ============================================================================
 * SHARED ROYAL SAPPHIRE BRIGHT UI PRIMITIVES
 * (#F8F9FA Canvas / #FFFFFF Pure Surface / #1E40FF Primary / #E2E8F0 Border)
 * ============================================================================ */

export interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  padding?: string | number;
  className?: string;
  style?: React.CSSProperties;
  dataTour?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  actions,
  padding = '1.25rem 1.5rem',
  className = '',
  style,
  dataTour,
}) => (
  <div
    data-tour={dataTour}
    className={`card inkica-glass-card ${className}`.trim()}
    style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 20,
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
      padding,
      color: '#0F172A',
      ...style,
    }}
  >
    {(title || subtitle || actions) && (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          {title && (
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A' }}>{title}</div>
          )}
          {subtitle && (
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>{actions}</div>}
      </div>
    )}
    {children}
  </div>
);

export const BrightCard = Card;

export interface FormCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const FormCard: React.FC<FormCardProps> = ({
  title,
  description,
  icon,
  badge,
  selected = false,
  onClick,
  footer,
  children,
  style,
}) => (
  <div
    onClick={onClick}
    className="inkica-glass-card hover-lift"
    style={{
      background: '#FFFFFF',
      border: selected ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
      borderRadius: 20,
      padding: '1.25rem',
      boxShadow: selected
        ? '0 8px 24px -4px rgba(30, 64, 255, 0.18), 0 0 0 3px rgba(30, 64, 255, 0.08)'
        : '0 2px 8px rgba(15, 23, 42, 0.04)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '0.85rem',
      ...style,
    }}
  >
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          {icon && (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: selected ? 'rgba(30, 64, 255, 0.12)' : '#F8FAFF',
                border: '1px solid #E2E8F0',
                color: '#1E40FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>{title}</div>
            {description && (
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2, lineHeight: 1.45 }}>
                {description}
              </div>
            )}
          </div>
        </div>
        {badge && <div style={{ flexShrink: 0 }}>{badge}</div>}
      </div>
      {children && <div style={{ marginTop: '0.85rem' }}>{children}</div>}
    </div>
    {footer && (
      <div
        style={{
          paddingTop: '0.75rem',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        {footer}
      </div>
    )}
  </div>
);

export const BrightFormCard = FormCard;

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

export interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

const BADGE_PALETTE: Record<BadgeTone, { bg: string; color: string; border: string }> = {
  primary: { bg: 'rgba(30, 64, 255, 0.10)', color: '#1E40FF', border: 'rgba(30, 64, 255, 0.22)' },
  success: { bg: 'rgba(16, 185, 129, 0.10)', color: '#059669', border: 'rgba(16, 185, 129, 0.24)' },
  warning: { bg: 'rgba(217, 119, 6, 0.10)', color: '#D97706', border: 'rgba(217, 119, 6, 0.24)' },
  danger: { bg: 'rgba(220, 38, 38, 0.10)', color: '#1E40FF', border: 'rgba(220, 38, 38, 0.24)' },
  info: { bg: 'rgba(2, 132, 199, 0.10)', color: '#0284C7', border: 'rgba(2, 132, 199, 0.24)' },
  neutral: { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' },
  purple: { bg: '#F3E8FF', color: '#7E22CE', border: 'rgba(126, 34, 206, 0.22)' },
};

export const Badge: React.FC<BadgeProps> = ({ children, tone = 'primary', icon, style }) => {
  const palette = BADGE_PALETTE[tone];
  return (
    <span
      className="autodata-tabular-nums"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 9999,
        fontSize: '0.72rem',
        fontWeight: 700,
        lineHeight: 1.35,
        background: palette.bg,
        color: palette.color,
        border: `1px solid ${palette.border}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  );
};

export const BrightBadge = Badge;

export interface PillTabItem<K extends string = string> {
  key: K;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}

export interface PillTabsProps<K extends string = string> {
  tabs: ReadonlyArray<PillTabItem<K>>;
  activeKey: K;
  onChange: (nextKey: K) => void;
  dataTour?: string;
  style?: React.CSSProperties;
}

export function PillTabs<K extends string = string>({
  tabs,
  activeKey,
  onChange,
  dataTour,
  style,
}: PillTabsProps<K>) {
  return (
    <div
      data-tour={dataTour}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: 5,
        borderRadius: 16,
        background: '#F1F5F9',
        border: '1px solid #E2E8F0',
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '0.5rem 0.95rem',
              borderRadius: 12,
              border: isActive ? '1px solid rgba(30, 64, 255, 0.18)' : '1px solid transparent',
              background: isActive ? '#FFFFFF' : 'transparent',
              color: isActive ? '#1E40FF' : '#475569',
              fontSize: '0.82rem',
              fontWeight: isActive ? 700 : 600,
              cursor: 'pointer',
              boxShadow: isActive ? '0 2px 8px rgba(30, 64, 255, 0.10)' : 'none',
              transition: 'all 0.18s ease',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className="autodata-tabular-nums"
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '1px 7px',
                  borderRadius: 9999,
                  background: isActive ? 'rgba(30, 64, 255, 0.12)' : '#E2E8F0',
                  color: isActive ? '#1E40FF' : '#475569',
                }}
              >
                {tab.count.toLocaleString('vi-VN')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export const BrightPillTabs = PillTabs;

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div
    style={{
      padding: '2.75rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      background: '#FFFFFF',
      borderRadius: 18,
      border: '1px dashed #CBD5E1',
    }}
  >
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 16,
        background: 'rgba(30, 64, 255, 0.08)',
        color: '#1E40FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '0.85rem',
      }}
    >
      {icon || <Inbox size={24} />}
    </div>
    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>{title}</div>
    {description && (
      <div style={{ fontSize: '0.82rem', color: '#64748B', maxWidth: 460, marginTop: 4, lineHeight: 1.5 }}>
        {description}
      </div>
    )}
    {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
  </div>
);

export const BrightEmptyState = EmptyState;

export interface TableColumn<T> {
  key: string;
  header: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  numeric?: boolean;
  width?: string | number;
  render: (row: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
  columns: ReadonlyArray<TableColumn<T>>;
  rows: ReadonlyArray<T>;
  rowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  emptyAction?: React.ReactNode;
  loading?: boolean;
  dataTour?: string;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyTitle = 'Chưa có dữ liệu hiển thị',
  emptyDescription,
  emptyAction,
  loading = false,
  dataTour,
}: TableProps<T>) {
  if (loading) {
    return <TableSkeleton rows={5} cols={Math.max(3, Math.min(columns.length || 4, 6))} />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div
      data-tour={dataTour}
      className="card"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 20,
        overflow: 'hidden',
        padding: 0,
      }}
    >
      <div className="table-wrap" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '0.85rem 1.15rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#64748B',
                    textAlign: col.align || (col.numeric ? 'right' : 'left'),
                    width: col.width,
                    background: '#F8F9FA',
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={rowKey(row, idx)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className="autodata-bright-tr"
                style={{
                  borderBottom: idx === rows.length - 1 ? 'none' : '1px solid #F1F5F9',
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={col.numeric ? 'autodata-tabular-nums' : undefined}
                    style={{
                      padding: '0.95rem 1.15rem',
                      fontSize: '0.84rem',
                      color: '#0F172A',
                      textAlign: col.align || (col.numeric ? 'right' : 'left'),
                      verticalAlign: 'middle',
                    }}
                  >
                    {col.render(row, idx)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const BrightTable = Table;
