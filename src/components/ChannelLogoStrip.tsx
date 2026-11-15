import React, { useId } from 'react';

export interface ChannelLogoStripProps {
  variant?: 'compact' | 'strip' | 'platforms';
  className?: string;
}

const ZALO_FAVICON = 'https://stc-zpl.zdn.vn/favicon.ico';

const WebsiteLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" stroke="#1E40FF" strokeWidth="1.8" fill="#EFF6FF" />
    <ellipse cx="12" cy="12" rx="4.2" ry="9.5" stroke="#0284C7" strokeWidth="1.5" />
    <path d="M3 12h18" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4.5 7.5h15" stroke="#38BDF8" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M4.5 16.5h15" stroke="#38BDF8" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const MessengerLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => {
  const uid = useId();
  const gradId = `msg-grad-${uid}`;
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00B2FF" />
          <stop offset="48%" stopColor="#006AFF" />
          <stop offset="82%" stopColor="#A033FF" />
          <stop offset="100%" stopColor="#FF5280" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.2C6.48 2.2 2 6.32 2 11.4c0 2.9 1.46 5.49 3.74 7.18v3.22l3.42-1.88c.91.25 1.86.38 2.84.38 5.52 0 10-4.12 10-9.2C22 6.32 17.52 2.2 12 2.2Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="m13.02 14.32-2.55-2.72-4.97 2.72 5.47-5.8 2.61 2.72 4.91-2.72-5.47 5.8Z"
        fill="#FFFFFF"
      />
    </svg>
  );
};

const EmailLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="2.5" y="4.5" width="19" height="15" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
    <path d="M3 7.5 12 13.8 21 7.5" stroke="#EA4335" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 16.5V8.2l5 3.6v6.7H4.8A1.8 1.8 0 0 1 3 16.5Z" fill="#4285F4" />
    <path d="M21 16.5V8.2l-5 3.6v6.7h3.2a1.8 1.8 0 0 0 1.8-1.8Z" fill="#34A853" />
    <path d="M16 11.8 21 8.2V6.8a2 2 0 0 0-2-2l-7 5-7-5a2 2 0 0 0-2 2v1.4l5 3.6 4 2.8 4-2.8Z" fill="#FBBC05" opacity="0.92" />
  </svg>
);

const MetaLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M6.8 7.5C4.1 7.5 2.2 10.1 2.2 13.2c0 2.6 1.6 4.3 3.7 4.3 1.8 0 3.2-1.2 5-3.9l1.1-1.7 1.1 1.7c1.8 2.7 3.2 3.9 5 3.9 2.1 0 3.7-1.7 3.7-4.3 0-3.1-1.9-5.7-4.6-5.7-2 0-3.6 1.4-5.2 3.8C10.4 8.9 8.8 7.5 6.8 7.5Z"
      stroke="#0081FB"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SheetsLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M6 2.8h8.2L19.5 8v11.7a1.8 1.8 0 0 1-1.8 1.8H6.3a1.8 1.8 0 0 1-1.8-1.8V4.6A1.8 1.8 0 0 1 6.3 2.8Z"
      fill="#0F9D58"
    />
    <path d="M14.2 2.8V8h5.3L14.2 2.8Z" fill="#87CEAC" />
    <rect x="7.5" y="10.8" width="9" height="6.8" rx="0.8" stroke="#FFFFFF" strokeWidth="1.3" />
    <path d="M7.5 14.2h9M12 10.8v6.8" stroke="#FFFFFF" strokeWidth="1.2" />
  </svg>
);

const MisaLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#1D4ED8" />
    <path
      d="M6.5 16.5V7.8l5.5 5.2 5.5-5.2v8.7"
      stroke="#FFFFFF"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WebhookLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="6.5" r="2.6" stroke="#1E40FF" strokeWidth="1.9" />
    <circle cx="6.5" cy="16.5" r="2.6" stroke="#0284C7" strokeWidth="1.9" />
    <circle cx="17.5" cy="16.5" r="2.6" stroke="#06B6D4" strokeWidth="1.9" />
    <path
      d="M10.7 8.8 7.8 14.1M13.3 8.8l2.9 5.3M9.1 16.5h5.8"
      stroke="#475569"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const ChannelLogoStrip: React.FC<ChannelLogoStripProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const isCompact = variant === 'compact';

  const channels = [
    {
      id: 'website',
      title: 'Website Doanh Nghiệp & Live Chat',
      shortTag: '',
      fullLabel: 'Website',
      renderIcon: () => <WebsiteLogoSvg className="w-4 h-4" />,
    },
    {
      id: 'zalobot',
      title: 'ZaloBot Điều Phối & Trợ Lý Tự Động',
      shortTag: 'Bot',
      fullLabel: 'ZaloBot',
      renderIcon: () => (
        <img
          src={ZALO_FAVICON}
          alt="ZaloBot"
          className="w-4 h-4 rounded-full object-contain"
        />
      ),
    },
    {
      id: 'zalo-oa',
      title: 'Zalo Official Account (OA)',
      shortTag: 'OA',
      fullLabel: 'Zalo OA',
      renderIcon: () => (
        <img
          src={ZALO_FAVICON}
          alt="Zalo OA"
          className="w-4 h-4 rounded-full object-contain"
        />
      ),
    },
    {
      id: 'messenger',
      title: 'Facebook Messenger',
      shortTag: '',
      fullLabel: 'Messenger',
      renderIcon: () => <MessengerLogoSvg className="w-4 h-4" />,
    },
    {
      id: 'zalo-zns',
      title: 'Zalo ZNS Tin Nhắn Định Danh',
      shortTag: 'ZNS',
      fullLabel: 'Zalo ZNS',
      renderIcon: () => (
        <img
          src={ZALO_FAVICON}
          alt="Zalo ZNS"
          className="w-4 h-4 rounded-full object-contain"
        />
      ),
    },
    {
      id: 'email',
      title: 'Email Automation & Amazon SES',
      shortTag: '',
      fullLabel: 'Email SES',
      renderIcon: () => <EmailLogoSvg className="w-4 h-4" />,
    },
  ];

  const enterprisePlatforms = [
    {
      id: 'meta-capi',
      title: 'Meta Conversions API & Graph API',
      fullLabel: 'Meta CAPI',
      renderIcon: () => <MetaLogoSvg className="w-4 h-4" />,
    },
    {
      id: 'misa',
      title: 'Kế Toán & Hóa Đơn Điện Tử MISA',
      fullLabel: 'MISA',
      renderIcon: () => <MisaLogoSvg className="w-4 h-4" />,
    },
    {
      id: 'sheets',
      title: 'Đồng Bộ Google Sheets Real-Time',
      fullLabel: 'Sheets',
      renderIcon: () => <SheetsLogoSvg className="w-4 h-4" />,
    },
    {
      id: 'webhook',
      title: 'REST API & Webhook 2 Chiều',
      fullLabel: 'Webhook API',
      renderIcon: () => <WebhookLogoSvg className="w-4 h-4" />,
    },
  ];

  if (variant === 'platforms') {
    const allItems = [...channels, ...enterprisePlatforms];
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {allItems.map((item) => (
          <span
            key={item.id}
            title={item.title}
            aria-label={item.title}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-white/95 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.03)] text-xs font-medium text-slate-700"
          >
            {item.renderIcon()}
            <span>{item.fullLabel}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {channels.map((ch) => (
        <span
          key={ch.id}
          title={ch.title}
          aria-label={ch.title}
          className={
            isCompact
              ? 'inline-flex items-center gap-1 h-7 px-2 rounded-lg bg-white border border-slate-200/80 shadow-[0_1px_4px_rgba(15,23,42,0.04)]'
              : 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/95 border border-slate-200/80 shadow-xs text-[11px] font-medium text-slate-700'
          }
        >
          {ch.renderIcon()}
          {isCompact ? (
            ch.shortTag ? (
              <span className="text-[10px] font-semibold tracking-tight text-slate-600">
                {ch.shortTag}
              </span>
            ) : null
          ) : (
            <span>{ch.fullLabel}</span>
          )}
        </span>
      ))}
    </div>
  );
};
