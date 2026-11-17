import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, Smile, Sparkles, X } from 'lucide-react';
import { useEntitlement } from '../contexts/EntitlementContext';
import {
  CHAT_STICKERS,
  POPULAR_EMOJIS,
  getVisibleStickerPacks,
  type ChatSticker,
  type CommercialStickerPack,
} from './ChatStickers';

export interface StickerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker?: (stickerCodeOrUrl: string, packId: string, displayLabel?: string) => void;
  onSelectWorkBadge?: (badge: ChatSticker) => void;
  onSelectCorporateSticker?: (badge: ChatSticker) => void;
  onSelectEmoji?: (emoji: string) => void;
  corporateStickers?: ChatSticker[];
  anchorEl?: HTMLElement | null;
  mode?: 'modal' | 'popover';
  zIndex?: number;
  initialTab?: string;
}

export const StickerPickerModal: React.FC<StickerPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSticker,
  onSelectWorkBadge,
  onSelectCorporateSticker,
  onSelectEmoji,
  corporateStickers,
  anchorEl,
  mode = 'popover',
  zIndex = 10040,
  initialTab = 'work',
}) => {
  const { enableIdeasMascot } = useEntitlement();
  const visiblePacks = useMemo<CommercialStickerPack[]>(
    () => getVisibleStickerPacks(enableIdeasMascot),
    [enableIdeasMascot]
  );

  const sanitizedDefaultTab = useMemo(() => {
    if (!initialTab || (initialTab === 'ideas' && !enableIdeasMascot)) {
      return 'work';
    }
    if (initialTab === 'corporate') return 'work';
    return initialTab;
  }, [initialTab, enableIdeasMascot]);

  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTab = useMemo(() => {
    const candidate = selectedTab ?? sanitizedDefaultTab;
    if (candidate === 'ideas' && !enableIdeasMascot) {
      return visiblePacks[0]?.id || 'work';
    }
    if (candidate === 'work' || candidate === 'emoji') {
      return candidate;
    }
    const exists = visiblePacks.some((p) => p.id === candidate);
    return exists ? candidate : 'work';
  }, [selectedTab, sanitizedDefaultTab, enableIdeasMascot, visiblePacks]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      if (anchorEl?.contains(target)) return;
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen) return null;

  const workBadges = corporateStickers && corporateStickers.length > 0 ? corporateStickers : CHAT_STICKERS;
  const currentPack = visiblePacks.find((p) => p.id === activeTab) || null;

  const computePopoverStyle = (): React.CSSProperties => {
    if (mode === 'popover' && anchorEl && typeof window !== 'undefined') {
      const rect = anchorEl.getBoundingClientRect();
      const width = 376;
      const height = 430;
      let top = rect.top - height - 10;
      if (top < 12) {
        top = Math.min(window.innerHeight - height - 12, rect.bottom + 10);
      }
      let left = rect.left - 80;
      if (left + width > window.innerWidth - 14) {
        left = window.innerWidth - width - 14;
      }
      if (left < 14) left = 14;
      return {
        position: 'fixed',
        top,
        left,
        zIndex,
      };
    }

    return {
      position: 'fixed',
      inset: 0,
      zIndex,
      background: 'rgba(15, 23, 42, 0.35)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    };
  };

  const handlePickBadge = (badge: ChatSticker) => {
    if (onSelectWorkBadge) onSelectWorkBadge(badge);
    if (onSelectCorporateSticker) onSelectCorporateSticker(badge);
    onClose();
  };

  const handlePickCommercialSticker = (pack: CommercialStickerPack, index: number) => {
    const emoji = pack.sampleEmojis[index % pack.sampleEmojis.length] || '✨';
    const stickerUrl = `/stickers/${pack.id}/${pack.id}_${index + 1}.${pack.ext}`;
    const displayLabel = `${emoji} [${pack.name} #${index + 1}]`;
    if (onSelectSticker) {
      onSelectSticker(stickerUrl, pack.id, displayLabel);
    }
    onClose();
  };

  const pickerCard = (
    <div style={computePopoverStyle()}>
      <div
        ref={containerRef}
        style={{
          width: 376,
          maxWidth: '94vw',
          height: 430,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 20,
          boxShadow: '0 20px 50px -12px rgba(30, 64, 255, 0.22), 0 8px 20px -6px rgba(15, 23, 42, 0.10)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#0F172A',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '11px 14px',
            borderBottom: '1px solid #E2E8F0',
            background: 'linear-gradient(135deg, #F8FAFF 0%, #FFFFFF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: 'rgba(30, 64, 255, 0.10)',
                color: '#1E40FF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={14} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.83rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {activeTab === 'work'
                  ? '12 Nhãn Trạng Thái Công Việc'
                  : activeTab === 'emoji'
                    ? 'Biểu Cảm Nhanh (Emoji)'
                    : `${currentPack?.name || 'Bộ Nhãn Dán'} (${currentPack?.count || 0})`}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng nhãn dán"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#64748B',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#FFFFFF' }}>
          {activeTab === 'work' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              {workBadges.map((stk) => (
                <button
                  key={stk.id}
                  type="button"
                  onClick={() => handlePickBadge(stk)}
                  style={{
                    padding: '9px 10px',
                    borderRadius: 12,
                    border: 'none',
                    background: stk.bgGradient,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: '0 3px 10px rgba(15, 23, 42, 0.10)',
                    transition: 'transform 0.14s ease',
                  }}
                >
                  <span style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}>{stk.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.73rem',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {stk.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.62rem',
                        opacity: 0.9,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {stk.badgeText}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'emoji' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 4 }}>
              {POPULAR_EMOJIS.map((emoji, idx) => (
                <button
                  key={`${emoji}_${idx}`}
                  type="button"
                  onClick={() => {
                    if (onSelectEmoji) onSelectEmoji(emoji);
                    onClose();
                  }}
                  style={{
                    height: 38,
                    borderRadius: 10,
                    border: '1px solid transparent',
                    background: '#F8FAFC',
                    fontSize: '1.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {currentPack && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
              {Array.from({ length: currentPack.count }).map((_, idx) => {
                const imgKey = `${currentPack.id}_${idx + 1}`;
                const imgSrc = `/stickers/${currentPack.id}/${currentPack.id}_${idx + 1}.${currentPack.ext}`;
                const fallbackEmoji =
                  currentPack.sampleEmojis[idx % currentPack.sampleEmojis.length] || '✨';
                const showFallback = Boolean(failedImages[imgKey]);

                return (
                  <button
                    key={imgKey}
                    type="button"
                    onClick={() => handlePickCommercialSticker(currentPack, idx)}
                    title={`${currentPack.name} #${idx + 1}`}
                    style={{
                      height: 76,
                      borderRadius: 14,
                      border: '1px solid #E2E8F0',
                      background: 'linear-gradient(145deg, #F8FAFF 0%, #FFFFFF 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                      padding: 6,
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {!showFallback ? (
                      <img
                        src={imgSrc}
                        alt={`${currentPack.name} ${idx + 1}`}
                        loading="lazy"
                        onError={() =>
                          setFailedImages((prev) =>
                            prev[imgKey] ? prev : { ...prev, [imgKey]: true }
                          )
                        }
                        style={{
                          width: 46,
                          height: 46,
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.85rem', lineHeight: 1 }}>{fallbackEmoji}</span>
                    )}
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: '#64748B',
                      }}
                    >
                      #{idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pack Switcher Footer */}
        <div
          style={{
            padding: '8px 10px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8F9FA',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedTab('work')}
            title="12 Nhãn công việc"
            style={{
              padding: '6px 10px',
              borderRadius: 10,
              border: activeTab === 'work' ? '1px solid #1E40FF' : '1px solid #E2E8F0',
              background: activeTab === 'work' ? '#EEF2FF' : '#FFFFFF',
              color: activeTab === 'work' ? '#1E40FF' : '#475569',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Briefcase size={13} />
            <span>Công việc</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab('emoji')}
            title="Biểu cảm Emoji"
            style={{
              padding: '6px 9px',
              borderRadius: 10,
              border: activeTab === 'emoji' ? '1px solid #1E40FF' : '1px solid #E2E8F0',
              background: activeTab === 'emoji' ? '#EEF2FF' : '#FFFFFF',
              color: activeTab === 'emoji' ? '#1E40FF' : '#475569',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Smile size={13} />
            <span>Emoji</span>
          </button>

          {visiblePacks.map((pack) => {
            const isSelected = activeTab === pack.id;
            const leadEmoji = pack.sampleEmojis[0] || '✨';
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => setSelectedTab(pack.id)}
                title={`${pack.name} (${pack.count} sticker)`}
                style={{
                  padding: '5px 9px',
                  borderRadius: 10,
                  border: isSelected ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                  background: isSelected ? '#EEF2FF' : '#FFFFFF',
                  color: isSelected ? '#1E40FF' : '#475569',
                  fontSize: '0.72rem',
                  fontWeight: isSelected ? 800 : 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{leadEmoji}</span>
                <span>{pack.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(pickerCard, document.body) : pickerCard;
};

export default StickerPickerModal;
