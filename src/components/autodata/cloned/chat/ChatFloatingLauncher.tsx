import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { apiRequest } from '../../autodataApi';
import { useOptionalAuth } from '../contexts/AuthContext';
import type { WorkChatChannelDto } from './workchatTypes';

const LazyWorkChatModal = React.lazy(() =>
  import('./WorkChatModal').then((m) => ({ default: m.WorkChatModal }))
);

const PUBLIC_PATH_PREFIXES = [
  '/s/',
  '/claim/',
  '/booking/',
  '/public-booking/',
  '/schedule/',
  '/public-schedule/',
  '/docs',
  '/login',
];

function isHiddenPublicPathname(pathname: string): boolean {
  if (!pathname) return false;
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

export const ChatFloatingLauncher: React.FC = () => {
  const location = useLocation();
  const auth = useOptionalAuth();
  const token = auth?.token || null;
  const user = auth?.user || null;
  const tenantSlug = auth?.tenantSlug || '';

  const [isOpen, setIsOpen] = useState(false);
  const [hasEverOpened, setHasEverOpened] = useState(false);
  const [initialChannelId, setInitialChannelId] = useState<string | undefined>(undefined);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isPublicPath = useMemo(
    () => isHiddenPublicPathname(location.pathname),
    [location.pathname]
  );

  // Listen for custom deep-link events (`domation:open-chat` & `myerp:open-chat-conversation`)
  useEffect(() => {
    const handleOpenEvent = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, unknown>>)?.detail || {};
      const chId =
        typeof detail.channelId === 'string'
          ? detail.channelId
          : typeof detail.conversationId === 'string'
            ? detail.conversationId
            : detail.conversationId !== undefined
              ? String(detail.conversationId)
              : undefined;
      if (chId) {
        setInitialChannelId(chId);
      }
      setHasEverOpened(true);
      setIsOpen(true);
    };

    window.addEventListener('domation:open-chat', handleOpenEvent);
    window.addEventListener('myerp:open-chat-conversation', handleOpenEvent);
    return () => {
      window.removeEventListener('domation:open-chat', handleOpenEvent);
      window.removeEventListener('myerp:open-chat-conversation', handleOpenEvent);
    };
  }, []);

  // Lightweight background channel/unread sync when authenticated
  useEffect(() => {
    if (!token || !user || isPublicPath) return;
    let cancelled = false;

    const syncUnread = async () => {
      try {
        const res = await apiRequest<{ items?: WorkChatChannelDto[] }>('/workchat/channels', {
          token,
          tenantSlug,
        });
        if (!cancelled && Array.isArray(res?.items)) {
          const totalUnread = res.items.reduce(
            (sum, ch) => sum + Number(ch.unread_count || 0),
            0
          );
          setUnreadCount(totalUnread);
        }
      } catch {
        // Silent background check
      }
    };

    syncUnread();
    const interval = setInterval(syncUnread, 25000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, user, tenantSlug, isPublicPath]);

  if (!token || !user || isPublicPath) {
    return null;
  }

  const launcherUi = (
    <>
      <style>{`
        @keyframes domationSapphireBeacon {
          0% { transform: scale(0.96); opacity: 0.72; }
          70% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>

      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setHasEverOpened(true);
            setIsOpen(true);
          }}
          title="Mở WorkChat Doanh Nghiệp"
          aria-label="Mở WorkChat Doanh Nghiệp"
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            width: 54,
            height: 54,
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow:
              '0 10px 28px -4px rgba(30, 64, 255, 0.48), 0 4px 10px -2px rgba(15, 23, 42, 0.16)',
            zIndex: 10010,
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Beacon Ripple */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: '50%',
              background: 'rgba(30, 64, 255, 0.35)',
              pointerEvents: 'none',
              animation: 'domationSapphireBeacon 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />

          <MessageCircle size={25} strokeWidth={2.2} />

          {/* Active Emerald Presence Dot */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 11,
              height: 11,
              borderRadius: '50%',
              background: '#10B981',
              border: '2px solid #FFFFFF',
            }}
          />

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span
              className="autodata-tabular-nums"
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 20,
                height: 20,
                padding: '0 6px',
                borderRadius: 999,
                background: '#EF4444',
                color: '#FFFFFF',
                border: '2px solid #FFFFFF',
                fontSize: '0.68rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {(isOpen || hasEverOpened) && (
        <Suspense fallback={null}>
          <LazyWorkChatModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            initialChannelId={initialChannelId}
          />
        </Suspense>
      )}
    </>
  );

  return typeof document !== 'undefined' ? createPortal(launcherUi, document.body) : launcherUi;
};

export default ChatFloatingLauncher;
