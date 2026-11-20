import React from 'react';
import styles from './Avatar.module.css';
const logoIcon = '/imgs/autodata/domation_ai_icon.svg';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: number | 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  color?: string;
  aiScreened?: boolean;
}

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
};

const getColorFromName = (name: string) => {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#1E40FF', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '', style, title, color, aiScreened }) => {
  const [hasError, setHasError] = React.useState(false);
  const sizeMap = {
    sm: 24,
    md: 32,
    lg: 48,
  };
  const finalSize = typeof size === 'number' ? size : sizeMap[size];
  const initials = name ? getInitials(name) : '?';
  const bgColor = color ? color : (name ? getColorFromName(name) : 'var(--color-primary)');

  let resolvedSrc = src;
  if (src && src.startsWith('uploads/')) {
    resolvedSrc = `/${src}`;
  }

  // Nếu name là "Hệ thống" / "System" / "HT" hoặc đang trỏ tới ecolife_logo.png cũ, gán ảnh biểu tượng tròn chuẩn
  if (resolvedSrc && resolvedSrc.endsWith('ecolife_logo.png')) {
    resolvedSrc = logoIcon;
  }
  if (!resolvedSrc && name) {
    const trimmedName = name.trim().toLowerCase();
    if (trimmedName === 'hệ thống' || trimmedName === 'system' || trimmedName === 'ht') {
      resolvedSrc = logoIcon;
    }
  }

  // Reset error state if resolvedSrc changes
  React.useEffect(() => {
    setHasError(false);
  }, [resolvedSrc]);

  const avatarEl = (
    <div 
      className={`${styles.avatar} ${className}`}
      title={title}
      style={{ 
        width: finalSize, 
        height: finalSize, 
        fontSize: finalSize * 0.4,
        backgroundColor: resolvedSrc && !hasError ? 'transparent' : bgColor,
        ...style 
      }}
    >
      {resolvedSrc && !hasError ? (
        <img 
          src={resolvedSrc} 
          alt={name} 
          referrerPolicy="no-referrer"
          className={styles.image} 
          onError={() => setHasError(true)} 
        />
      ) : (
        <span className={styles.initials}>{initials}</span>
      )}
    </div>
  );

  if (aiScreened) {
    const badgeSize = Math.max(14, Math.floor(finalSize * 0.48));
    return (
      <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
        {avatarEl}
        <img
          src={logoIcon}
          alt="AI Evaluation"
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: badgeSize,
            height: badgeSize,
            borderRadius: '50%',
            border: '1.5px solid var(--color-surface, #ffffff)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            zIndex: 1,
            backgroundColor: '#ffffff',
            objectFit: 'contain'
          }}
        />
      </div>
    );
  }

  return avatarEl;
};
