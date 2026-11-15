import React, { useId } from 'react';

interface DomationLogoMarkProps {
  className?: string;
  size?: number;
}

export const DomationLogoMark: React.FC<DomationLogoMarkProps> = ({
  className,
  size,
}) => {
  const uid = useId().replace(/:/g, '');
  const tileGradId = `domTileGrad-${uid}`;
  const accentGradId = `domCyanAccent-${uid}`;
  const resolvedClassName = className ?? (size ? 'shrink-0' : 'w-9 h-9 shrink-0');

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={resolvedClassName}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={tileGradId} x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="52%" stopColor="#1E40FF" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id={accentGradId} x1="20" y1="16" x2="50" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${tileGradId})`} />
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="15"
        stroke="white"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />
      <path d="M18 16H25V48H18V16Z" fill="#FFFFFF" />
      <path
        d="M27 16H34.5C43.6 16 49 21.8 49 32C49 42.2 43.6 48 34.5 48H27V41.2H34C39.2 41.2 42.2 37.8 42.2 32C42.2 26.2 39.2 22.8 34 22.8H27V16Z"
        fill={`url(#${accentGradId})`}
      />
      <circle cx="32.5" cy="32" r="3.6" fill="#22D3EE" />
      <circle cx="32.5" cy="32" r="1.6" fill="#FFFFFF" />
    </svg>
  );
};
