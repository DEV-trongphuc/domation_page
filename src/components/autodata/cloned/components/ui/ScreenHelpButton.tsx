import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export interface ScreenHelpButtonProps {
  /**
   * Tùy chọn chỉ định mã Deck tour cần mở (ví dụ 'ads_performance', 'settings_processing').
   * Nếu không truyền, hệ thống sẽ tự động suy diễn theo route pathname và search params hiện tại.
   */
  screenKey?: string;
  /** Tiêu đề hiển thị khi hover (Tooltip) */
  tooltip?: string;
  /** Kích thước nút bấm */
  size?: 'sm' | 'md';
  /** Có hiển thị chữ "Hướng dẫn" kèm theo hay chỉ icon '?' */
  showLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ScreenHelpButton: React.FC<ScreenHelpButtonProps> = ({
  screenKey,
  tooltip,
  size = 'md',
  showLabel = false,
  className = '',
  style = {},
}) => {
  let openTour: ((deckKey?: string) => void) | undefined;
  try {
    const auth = useAuth();
    openTour = auth.openTour;
  } catch {
    // Outside AuthProvider fallback
  }

  let t = (str: string) => str;
  try {
    const lang = useLanguage();
    if (lang?.t) t = lang.t;
  } catch {
    // Outside LanguageProvider fallback
  }

  const isSmall = size === 'sm';
  const defaultTooltip = t('Xem hướng dẫn từng bước màn hình này (?)');

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (openTour) {
          openTour(screenKey);
        } else {
          window.dispatchEvent(new CustomEvent('autodata-open-tour', { detail: { screenKey } }));
        }
      }}
      title={tooltip || defaultTooltip}
      aria-label={tooltip || defaultTooltip}
      className={`screen-help-trigger-btn inline-flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
        isSmall
          ? 'h-7 px-2 text-[11px] rounded-lg'
          : 'h-9 px-2.5 text-xs rounded-xl'
      } border border-blue-200/90 bg-blue-50/80 text-[#1E40FF] hover:bg-blue-100/90 hover:border-blue-300 hover:shadow-sm active:scale-95 ${className}`}
      style={{
        boxShadow: '0 1px 3px rgba(30, 64, 255, 0.08)',
        ...style,
      }}
    >
      <HelpCircle size={isSmall ? 14 : 16} className="shrink-0 text-[#1E40FF]" />
      {showLabel && (
        <span className="font-semibold whitespace-nowrap text-[#1E40FF]">
          {t('Hướng dẫn')}
        </span>
      )}
    </button>
  );
};

export default ScreenHelpButton;
