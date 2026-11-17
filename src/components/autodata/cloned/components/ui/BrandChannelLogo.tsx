import React, { useId } from 'react';

export type BrandChannelKey =
  | 'zalo'
  | 'zalo_oa'
  | 'zalobot'
  | 'telegram'
  | 'webhook'
  | 'landing_page'
  | 'sheets'
  | 'sheets_email'
  | 'gmail'
  | 'email'
  | 'aws_ses'
  | 'meta'
  | 'meta_capi'
  | 'gemini'
  | 'domation'
  | 'sms'
  | 'web_sdk'
  | 'dkim';

export interface BrandChannelLogoProps {
  brand: BrandChannelKey;
  size?: number;
  className?: string;
}

const IMAGE_ASSET_MAP: Partial<Record<BrandChannelKey, { src: string; alt: string; rounded?: string }>> = {
  zalobot: { src: '/assets/brands/zalobot-logo.webp', alt: 'ZaloBot', rounded: '28%' },
  sheets: { src: '/assets/brands/sheets-icon.svg', alt: 'Google Sheets' },
  gmail: { src: '/assets/brands/gmail-logo.webp', alt: 'Gmail' },
  email: { src: '/assets/brands/gmail-logo.webp', alt: 'Email' },
  aws_ses: { src: '/assets/brands/aws-ses.svg', alt: 'Amazon SES', rounded: '24%' },
  meta: { src: '/assets/brands/meta-icon.svg', alt: 'Meta', rounded: '24%' },
  meta_capi: { src: '/assets/brands/meta-icon.svg', alt: 'Meta CAPI', rounded: '24%' },
  gemini: { src: '/assets/brands/gemini-icon.svg', alt: 'Google Gemini' },
  domation: { src: '/assets/brands/dom_logo.webp', alt: 'DOMATION', rounded: '24%' },
};

/**
 * Shared brand logo renderer for AutoData Connect & Integrations surfaces.
 * Uses crisp local brand assets and vector badges with unique gradient IDs.
 */
export const BrandChannelLogo: React.FC<BrandChannelLogoProps> = ({
  brand,
  size = 24,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const asset = IMAGE_ASSET_MAP[brand];

  if (asset) {
    return (
      <img
        src={asset.src}
        alt={asset.alt}
        width={size}
        height={size}
        loading="lazy"
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          borderRadius: asset.rounded || undefined,
          display: 'block',
          flexShrink: 0,
        }}
      />
    );
  }

  if (brand === 'zalo' || brand === 'zalo_oa') {
    const gradId = `zaloG-${uid}`;
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        className={className}
        aria-label="Zalo Official Account"
        style={{ flexShrink: 0, display: 'block' }}
      >
        <defs>
          <linearGradient id={gradId} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0190F3" />
            <stop offset="100%" stopColor="#0068FF" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="16" fill={`url(#${gradId})`} />
        <path
          d="M14 19.5C14 16.5 16.5 14 19.5 14h25C47.5 14 50 16.5 50 19.5v20c0 3-2.5 5.5-5.5 5.5H27.5L17.5 51.5V45h-1c-1.4 0-2.5-1.1-2.5-2.5v-23Z"
          fill="#FFFFFF"
          fillOpacity="0.16"
        />
        <text
          x="32"
          y="37"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="17"
          fontWeight="800"
          fontFamily="Plus Jakarta Sans, Be Vietnam Pro, Inter, sans-serif"
          letterSpacing="-0.5"
        >
          Zalo
        </text>
      </svg>
    );
  }

  if (brand === 'telegram') {
    const gradId = `tgG-${uid}`;
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        className={className}
        aria-label="Telegram"
        style={{ flexShrink: 0, display: 'block' }}
      >
        <defs>
          <linearGradient id={gradId} x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2AABEE" />
            <stop offset="100%" stopColor="#229ED9" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="28" fill={`url(#${gradId})`} />
        <path
          d="M46.4 19.3 16.6 31c-2 .8-2 1.9-.3 2.4l7.6 2.4 17.7-11.2c.8-.5 1.6-.2 1 .3L28.2 37.8l-.6 8c.8 0 1.2-.4 1.6-.8l3.9-3.7 8 5.9c1.5.8 2.5.4 2.9-1.4l5.3-24.8c.5-2.2-.8-3.1-2.9-1.7Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (brand === 'webhook' || brand === 'landing_page') {
    const gradId = `whG-${uid}`;
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        className={className}
        aria-label="Inbound Webhook API"
        style={{ flexShrink: 0, display: 'block' }}
      >
        <defs>
          <linearGradient id={gradId} x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="16" fill={`url(#${gradId})`} />
        <path
          d="M29.4 22.8 20.6 38M34.6 22.8l8.8 15.2M24.2 42h15.6"
          stroke="#C4B5FD"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="32" cy="18.5" r="5.5" fill="#FFFFFF" />
        <circle cx="19" cy="42" r="5.5" fill="#FFFFFF" />
        <circle cx="45" cy="42" r="5.5" fill="#38BDF8" />
      </svg>
    );
  }

  if (brand === 'sheets_email') {
    return (
      <div
        className={className}
        style={{
          position: 'relative',
          width: size,
          height: size,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Google Sheets & Email Relay"
      >
        <img
          src="/assets/brands/sheets-icon.svg"
          alt="Google Sheets"
          width={size}
          height={size}
          style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
        />
        <img
          src="/assets/brands/gmail-logo.webp"
          alt="Gmail Relay"
          width={Math.max(11, Math.round(size * 0.48))}
          height={Math.max(11, Math.round(size * 0.48))}
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            width: Math.max(11, Math.round(size * 0.48)),
            height: Math.max(11, Math.round(size * 0.48)),
            objectFit: 'contain',
            background: '#FFFFFF',
            borderRadius: 4,
            padding: 1,
            boxShadow: '0 1px 3px rgba(15,23,42,0.22)',
          }}
        />
      </div>
    );
  }

  if (brand === 'sms') {
    const gradId = `smsG-${uid}`;
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} style={{ flexShrink: 0, display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="16" fill={`url(#${gradId})`} />
        <path
          d="M16 22a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H26l-8 6.5V42h-2a4 4 0 0 1-4-4V22Z"
          fill="#FFFFFF"
          fillOpacity="0.22"
        />
        <text x="32" y="34" textAnchor="middle" fill="#FFFFFF" fontSize="13.5" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
          SMS
        </text>
      </svg>
    );
  }

  if (brand === 'web_sdk') {
    const gradId = `sdkG-${uid}`;
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} style={{ flexShrink: 0, display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E40FF" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="16" fill={`url(#${gradId})`} />
        <path d="M24 23 15 32l9 9M40 23l9 9-9 9M35 20l-6 24" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // dkim
  const gradId = `dkimG-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} style={{ flexShrink: 0, display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill={`url(#${gradId})`} />
      <circle cx="32" cy="32" r="15" stroke="#FFFFFF" strokeWidth="3" />
      <ellipse cx="32" cy="32" rx="6.5" ry="15" stroke="#BAE6FD" strokeWidth="2.4" />
      <path d="M17 32h30" stroke="#BAE6FD" strokeWidth="2.4" />
    </svg>
  );
};
