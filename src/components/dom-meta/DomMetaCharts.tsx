import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Award,
  Eye,
  Flame,
  Globe2,
  MapPin,
  MessageCircle,
  Monitor,
  MousePointerClick,
  Play,
  Search,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Tablet,
  Target,
  TrendingUp,
  Tv,
  Users,
} from 'lucide-react';
import {
  formatDomMoney,
  formatDomMoneyShort,
  formatDomNumber,
  type DomGoogleAdsDimBucket,
  type DomGoogleAdsHourlySlot,
  type DomMetaAgeGenderBucket,
  type DomMetaDailyPoint,
  type DomMetaDeviceRow,
  type DomMetaEntityDailyPoint,
  type DomMetaEntityHourPoint,
  type DomMetaHourlyCell,
  type DomMetaMonthlyPoint,
  type DomMetaPlatformSlice,
  type DomMetaPositionSlice,
  type DomMetaRegionRow,
} from './domMetaTypes';
import { DomMetaSelect } from './DomMetaSelect';

/** Official-style crisp vector logos for Ad Platforms (Facebook, Instagram, Messenger, Audience Network, Threads, WhatsApp) */
export const PlatformBrandLogo: React.FC<{
  platform: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}> = ({ platform, size = 'sm', className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const p = String(platform || '').toLowerCase();
  const dim =
    size === 'xs' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-5 h-5';

  if (p.includes('facebook') || p === 'fb') {
    return (
      <svg viewBox="0 0 24 24" className={`${dim} shrink-0 ${className}`} aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#1877F2" />
        <path
          d="M14.7 13.4l.42-2.7h-2.6V8.95c0-.74.36-1.46 1.52-1.46H15.2V5.2s-1.07-.18-2.1-.18c-2.14 0-3.54 1.3-3.54 3.65v2.03H7.2v2.7h2.36V21a9.4 9.4 0 0 0 2.96 0v-7.6h2.18Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (p.includes('instagram') || p === 'ig') {
    return (
      <svg viewBox="0 0 24 24" className={`${dim} shrink-0 ${className}`} aria-hidden="true">
        <defs>
          <linearGradient
            id={`ig-logo-${uid}`}
            x1="2"
            y1="22"
            x2="22"
            y2="2"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="35%" stopColor="#DD2A7B" />
            <stop offset="70%" stopColor="#8134AF" />
            <stop offset="100%" stopColor="#515BD4" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="21" height="21" rx="6.2" fill={`url(#ig-logo-${uid})`} />
        <rect
          x="6"
          y="6"
          width="12"
          height="12"
          rx="3.6"
          stroke="#FFFFFF"
          strokeWidth="1.65"
          fill="none"
        />
        <circle cx="12" cy="12" r="2.8" stroke="#FFFFFF" strokeWidth="1.65" fill="none" />
        <circle cx="15.8" cy="8.2" r="0.95" fill="#FFFFFF" />
      </svg>
    );
  }

  if (p.includes('messenger') || p.includes('msg')) {
    return (
      <svg viewBox="0 0 24 24" className={`${dim} shrink-0 ${className}`} aria-hidden="true">
        <defs>
          <linearGradient
            id={`msg-logo-${uid}`}
            x1="4"
            y1="21"
            x2="20"
            y2="3"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#00B2FF" />
            <stop offset="52%" stopColor="#006AFF" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
        </defs>
        <path
          d="M12 2C6.35 2 2 6.13 2 11.7c0 2.92 1.2 5.44 3.16 7.18.17.15.27.36.28.59l.05 1.85a.6.6 0 0 0 .84.53l2.06-.91a.65.65 0 0 1 .44-.03c.99.27 2.05.42 3.17.42 5.65 0 10-4.13 10-9.63S17.65 2 12 2Z"
          fill={`url(#msg-logo-${uid})`}
        />
        <path
          d="M6.4 14.35l2.94-4.66a1.4 1.4 0 0 1 2.02-.37l2.18 1.63a.56.56 0 0 0 .68 0l2.94-2.23c.39-.3.9.17.64.59l-2.94 4.66a1.4 1.4 0 0 1-2.02.37l-2.18-1.63a.56.56 0 0 0-.68 0l-2.94 2.23c-.39.3-.9-.17-.64-.59Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (p.includes('threads')) {
    return (
      <svg viewBox="0 0 24 24" className={`${dim} shrink-0 ${className}`} aria-hidden="true">
        <rect x="1.5" y="1.5" width="21" height="21" rx="6.2" fill="#0F172A" />
        <path
          d="M15.4 11.4c-.4-.25-.9-.42-1.48-.5-.24-1.35-1.08-2.1-2.48-2.1-1.6 0-2.74 1.05-2.74 2.55 0 1.44 1.04 2.38 2.52 2.38 1.25 0 2.15-.62 2.48-1.68.42.22.72.55.72 1.02 0 .92-.92 1.58-2.42 1.58-2.22 0-3.7-1.42-3.7-3.68 0-2.34 1.56-3.92 3.92-3.92 2.15 0 3.58 1.25 3.84 3.28l1.28-.18C17.02 7.5 15.05 5.8 12.22 5.8c-3.16 0-5.32 2.12-5.32 5.25 0 3.06 2.08 5.05 5.14 5.05 2.35 0 3.86-1.15 3.86-2.95 0-1.02-.52-1.78-1.5-2.35Zm-3.76 1.15c-.82 0-1.34-.42-1.34-1.12 0-.72.55-1.22 1.4-1.22.84 0 1.32.46 1.42 1.26-.22.68-.75 1.08-1.48 1.08Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (p.includes('whatsapp')) {
    return (
      <svg viewBox="0 0 24 24" className={`${dim} shrink-0 ${className}`} aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#25D366" />
        <path
          d="M16.6 14.2c-.25-.12-1.48-.73-1.7-.81-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06a6.8 6.8 0 0 1-2-1.23 7.5 7.5 0 0 1-1.38-1.72c-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08s.9 2.42 1.02 2.58c.13.17 1.76 2.7 4.27 3.78.6.26 1.06.41 1.43.53.6.19 1.14.16 1.57.1.48-.07 1.48-.6 1.69-1.19.2-.58.2-1.08.14-1.19-.06-.1-.23-.16-.48-.29Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (p.includes('audience') || p.startsWith('an_') || p === 'an') {
    return (
      <svg viewBox="0 0 24 24" className={`${dim} shrink-0 ${className}`} aria-hidden="true">
        <rect x="1.5" y="1.5" width="21" height="21" rx="6.2" fill="#0F172A" />
        <circle cx="12" cy="8" r="2.1" fill="#38BDF8" />
        <circle cx="7.4" cy="15.5" r="2.1" fill="#60A5FA" />
        <circle cx="16.6" cy="15.5" r="2.1" fill="#06B6D4" />
        <path
          d="M10.7 9.8L8.5 13.7M13.3 9.8l2.2 3.9M9.6 15.5h4.8"
          stroke="#E2E8F0"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Default Meta infinity badge
  return (
    <svg viewBox="0 0 24 24" className={`${dim} shrink-0 ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="10.8" fill="#1E293B" />
      <path
        d="M7.3 9.4c-1.5 0-2.6 1.5-2.6 3.3 0 1.5.9 2.5 2.1 2.5 1 0 1.8-.7 2.8-2.2l.7-1 .7 1c1 1.5 1.8 2.2 2.8 2.2 1.2 0 2.1-1 2.1-2.5 0-1.8-1.1-3.3-2.6-3.3-1.1 0-2 .8-3 2.2-.9-1.4-1.9-2.2-3-2.2Z"
        stroke="#38BDF8"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

/** Crisp brand/platform logos for Devices (Apple iPhone/iPad, Android Smartphone/Tablet, Desktop, Mobile Web) */
export const DeviceBrandLogo: React.FC<{
  device: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}> = ({ device, size = 'sm', className = '' }) => {
  const d = String(device || '').toLowerCase();
  const dim =
    size === 'xs' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-5 h-5';

  // Apple iPhone / iPad / iPod / iOS
  if (d.includes('iphone') || d.includes('ipad') || d.includes('ipod') || d.includes('ios') || d.includes('apple')) {
    return (
      <svg viewBox="0 0 24 24" className={`${dim} shrink-0 ${className}`} aria-hidden="true">
        <rect
          x="1.5"
          y="1.5"
          width="21"
          height="21"
          rx="6.2"
          fill={d.includes('ipad') ? '#334155' : '#0F172A'}
        />
        <path
          d="M15.12 12.64c-.02-1.52 1.24-2.25 1.3-2.29-.71-1.04-1.81-1.18-2.2-1.2-.94-.1-1.83.55-2.31.55-.48 0-1.21-.54-1.99-.52-.99.02-1.94.59-2.45 1.49-1.05 1.82-.27 4.51.75 5.99.5.72 1.09 1.53 1.88 1.5.76-.03 1.04-.49 1.96-.49.91 0 1.17.49 1.97.47.82-.01 1.33-.73 1.83-1.45.58-.85.82-1.67.83-1.71-.02-.01-1.55-.6-1.57-2.34ZM13.63 8.21c.42-.51.7-1.21.62-1.91-.6.02-1.34.4-1.77.91-.38.44-.72 1.16-.63 1.84.67.05 1.36-.34 1.78-.84Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // Android Smartphone / Android Tablet
  if (d.includes('android')) {
    return (
      <svg viewBox="0 0 24 24" className={`${dim} shrink-0 ${className}`} aria-hidden="true">
        <rect x="1.5" y="1.5" width="21" height="21" rx="6.2" fill="#16A34A" />
        <path
          d="M15.65 9.15l1.18-2.04a.38.38 0 0 0-.66-.38l-1.2 2.08a6.85 6.85 0 0 0-5.94 0L7.83 6.73a.38.38 0 0 0-.66.38l1.18 2.04A6.25 6.25 0 0 0 5.5 14.3v.95c0 .41.34.75.75.75h11.5c.41 0 .75-.34.75-.75v-.95a6.25 6.25 0 0 0-2.85-5.15ZM9.35 12.6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm5.3 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // Desktop / Windows / Mac
  if (d.includes('desktop') || d.includes('pc') || d.includes('web_desktop')) {
    return (
      <span
        className={`${dim} rounded-[6px] bg-sky-600 text-white inline-flex items-center justify-center shrink-0 ${className}`}
      >
        <Monitor className="w-3 h-3" />
      </span>
    );
  }

  if (d.includes('tablet')) {
    return (
      <span
        className={`${dim} rounded-[6px] bg-indigo-600 text-white inline-flex items-center justify-center shrink-0 ${className}`}
      >
        <Tablet className="w-3 h-3" />
      </span>
    );
  }

  if (d.includes('tv')) {
    return (
      <span
        className={`${dim} rounded-[6px] bg-violet-600 text-white inline-flex items-center justify-center shrink-0 ${className}`}
      >
        <Tv className="w-3 h-3" />
      </span>
    );
  }

  return (
    <span
      className={`${dim} rounded-[6px] bg-[#1E40FF] text-white inline-flex items-center justify-center shrink-0 ${className}`}
    >
      <Smartphone className="w-3 h-3" />
    </span>
  );
};

/** Google Ads Channel Logo (Search, YouTube, Performance Max, Display, Maps) */
export const GoogleChannelLogo: React.FC<{ channel: string; className?: string }> = ({
  channel,
  className = '',
}) => {
  const c = String(channel || '').toLowerCase();
  if (c.includes('youtube') || c.includes('video')) {
    return (
      <svg viewBox="0 0 24 24" className={`w-5 h-5 shrink-0 ${className}`} aria-hidden="true">
        <rect x="1.5" y="4" width="21" height="16" rx="4.8" fill="#FF0000" />
        <path d="M10 8.8l5.5 3.2L10 15.2V8.8Z" fill="#FFFFFF" />
      </svg>
    );
  }
  if (c.includes('map') || c.includes('local')) {
    return (
      <span
        className={`w-5 h-5 rounded-[6px] bg-emerald-500 text-white inline-flex items-center justify-center shrink-0 ${className}`}
      >
        <MapPin className="w-3 h-3" />
      </span>
    );
  }
  if (c.includes('pmax') || c.includes('performance') || c.includes('multi')) {
    return (
      <svg viewBox="0 0 24 24" className={`w-5 h-5 shrink-0 ${className}`} aria-hidden="true">
        <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#EFF6FF" />
        <path d="M9.6 5.4L4.8 13.7a2.4 2.4 0 0 0 4.15 2.4l4.8-8.3A2.4 2.4 0 0 0 9.6 5.4Z" fill="#FBBC04" />
        <path d="M14.4 5.4a2.4 2.4 0 0 0-3.28.88l4.8 8.32a2.4 2.4 0 1 0 4.16-2.4l-4.8-8.32a2.4 2.4 0 0 0-.88-.48Z" fill="#4285F4" />
        <circle cx="7" cy="15.8" r="2.3" fill="#34A853" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 shrink-0 ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
      <path
        d="M17.64 12.2c0-.4-.04-.79-.1-1.16H12v2.2h3.16a2.7 2.7 0 0 1-1.17 1.77v1.47h1.9c1.11-1.02 1.75-2.53 1.75-4.28Z"
        fill="#4285F4"
      />
      <path
        d="M12 18c1.58 0 2.91-.52 3.88-1.42l-1.9-1.47c-.52.35-1.2.56-1.98.56-1.53 0-2.83-1.03-3.29-2.42H6.75v1.52A5.99 5.99 0 0 0 12 18Z"
        fill="#34A853"
      />
      <path
        d="M8.71 13.25a3.6 3.6 0 0 1 0-2.5V9.23H6.75a6 6 0 0 0 0 5.54l1.96-1.52Z"
        fill="#FBBC05"
      />
      <path
        d="M12 8.33c.86 0 1.63.3 2.24.88l1.68-1.68A5.95 5.95 0 0 0 12 6a5.99 5.99 0 0 0-5.25 3.23l1.96 1.52c.46-1.39 1.76-2.42 3.29-2.42Z"
        fill="#EA4335"
      />
    </svg>
  );
};

const GoalIconGlyph: React.FC<{ goal?: string; className?: string }> = ({ goal, className }) => {
  const g = String(goal || '').toUpperCase();
  if (g.includes('LEAD')) return <Target className={className} />;
  if (g.includes('MESSAG') || g.includes('CONVERSATION') || g.includes('REPLI')) {
    return <MessageCircle className={className} />;
  }
  if (g.includes('VIDEO') || g.includes('THRUPLAY')) return <Play className={className} />;
  if (g.includes('REACH') || g.includes('IMPRESSION') || g.includes('AWARENESS')) {
    return <Eye className={className} />;
  }
  if (g.includes('PURCHASE') || g.includes('VALUE') || g.includes('SALE') || g.includes('OFFSITE')) {
    return <ShoppingBag className={className} />;
  }
  if (g.includes('LINK_CLICK') || g.includes('TRAFFIC') || g.includes('LANDING')) {
    return <MousePointerClick className={className} />;
  }
  return <Sparkles className={className} />;
};

/** Stacked/fanned creative thumbnails matching DOMATION_META (.cmp_fan_wrap / .detail_fan_wrap) */
export const CreativeThumbFan: React.FC<{
  urls: string[];
  goal?: string;
  active?: boolean;
  variant?: 'campaign' | 'adset' | 'ad' | 'modal';
  eager?: boolean;
  alt?: string;
}> = ({
  urls,
  goal,
  active = true,
  variant = 'campaign',
  eager = false,
  alt = 'Ad creative',
}) => {
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const maxCards = variant === 'ad' ? 1 : variant === 'adset' ? 2 : 3;

  const validUrls = useMemo(
    () => urls.filter((u) => Boolean(u) && !failedUrls[u]).slice(0, maxCards),
    [urls, failedUrls, maxCards]
  );

  if (validUrls.length === 0) {
    if (variant === 'modal') {
      return (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white flex items-center justify-center shrink-0 shadow-sm">
          <GoalIconGlyph goal={goal} className="w-5 h-5" />
        </div>
      );
    }
    if (variant === 'adset') {
      return (
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            active
              ? 'bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white shadow-[0_2px_6px_rgba(30,64,255,0.22)]'
              : 'bg-slate-200 text-slate-500'
          }`}
        >
          <GoalIconGlyph goal={goal} className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (variant === 'ad') {
      return (
        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 text-slate-400 flex items-center justify-center shrink-0">
          <GoalIconGlyph goal={goal} className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
          active
            ? 'bg-blue-50/90 text-[#1E40FF] border-blue-100'
            : 'bg-slate-100 text-slate-400 border-slate-200/70'
        }`}
      >
        <GoalIconGlyph goal={goal} className="w-4 h-4" />
      </div>
    );
  }

  if (variant === 'ad') {
    return (
      <img
        src={validUrls[0]}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        referrerPolicy="no-referrer"
        onError={() => setFailedUrls((prev) => ({ ...prev, [validUrls[0]]: true }))}
        className={`w-9 h-9 rounded-[7px] object-cover bg-slate-100 border border-slate-200/90 shadow-sm shrink-0 ${
          active ? '' : 'opacity-80'
        }`}
      />
    );
  }

  const count = validUrls.length;
  const wrapClass =
    variant === 'modal'
      ? 'w-14 h-12'
      : variant === 'adset'
        ? 'w-9 h-8'
        : 'w-11 h-9';
  const imgSizeClass =
    variant === 'modal'
      ? 'w-11 h-11 rounded-xl border-2 border-white shadow-[0_3px_10px_rgba(15,23,42,0.18)]'
      : variant === 'adset'
        ? 'w-8 h-8 rounded-[6px] border-[1.5px] border-white shadow-[0_1px_5px_rgba(15,23,42,0.15)]'
        : 'w-9 h-9 rounded-[6px] border-[1.5px] border-white shadow-[0_2px_7px_rgba(15,23,42,0.16)]';

  const getTransformClass = (idx: number) => {
    if (count === 1) return 'rotate-0 z-[2]';
    if (count === 2) {
      return idx === 0
        ? '-rotate-6 -translate-x-[3px] z-[1] group-hover/row:-rotate-12 group-hover/row:-translate-x-[6px]'
        : 'rotate-[5deg] translate-x-[3px] z-[2] group-hover/row:rotate-12 group-hover/row:translate-x-[6px]';
    }
    if (idx === 0) {
      return '-rotate-[8deg] -translate-x-[4px] translate-y-[1px] z-[1] group-hover/row:-rotate-[14deg] group-hover/row:-translate-x-[8px]';
    }
    if (idx === 1) {
      return 'rotate-0 z-[2]';
    }
    return 'rotate-[7deg] translate-x-[4px] translate-y-[1px] z-[3] group-hover/row:rotate-12 group-hover/row:translate-x-[8px]';
  };

  return (
    <div
      data-testid={`thumb-fan-${variant}`}
      data-count={count}
      className={`relative ${wrapClass} flex items-center justify-center shrink-0 ${
        active ? '' : 'opacity-80'
      }`}
    >
      {validUrls.map((url, idx) => (
        <img
          key={url}
          src={url}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          referrerPolicy="no-referrer"
          onError={() => setFailedUrls((prev) => ({ ...prev, [url]: true }))}
          className={`absolute object-cover bg-slate-100 transition-transform duration-200 ${imgSizeClass} ${getTransformClass(
            idx
          )}`}
        />
      ))}
    </div>
  );
};

/** Build smooth Catmull-Rom -> Cubic Bezier SVG path through points */
function buildSmoothLinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/** Responsive SVG chart container size hook so charts stretch dynamically to fill any card height without distortion or blank gaps */
function useChartBoxSize(defaultW: number, defaultH: number, minH = 225) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: defaultW, h: defaultH });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const nextW = Math.max(220, Math.round(rect.width || defaultW));
      const nextH = Math.min(480, Math.max(minH, Math.round(rect.height || defaultH)));
      setSize((prev) =>
        Math.abs(prev.w - nextW) > 1 || Math.abs(prev.h - nextH) > 1
          ? { w: nextW, h: nextH }
          : prev
      );
    };
    const raf = window.requestAnimationFrame(measure);
    if (typeof ResizeObserver === 'undefined') {
      return () => window.cancelAnimationFrame(raf);
    }
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [defaultW, defaultH, minH]);

  return { ref, w: size.w, h: size.h };
}

export type DomMetaDailyChartMetric =
  | 'spend'
  | 'result'
  | 'cpr'
  | 'impressions'
  | 'reach'
  | 'clicks'
  | 'leads'
  | 'messages'
  | 'follows'
  | 'cpm';

export const DailyTrendAreaChart: React.FC<{
  data: Array<DomMetaDailyPoint | DomMetaEntityDailyPoint>;
  metric: DomMetaDailyChartMetric;
  currency?: string;
  minHeight?: number;
}> = ({ data, metric, currency = 'VND', minHeight = 235 }) => {
  const uid = useId().replace(/:/g, '');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const { ref: boxRef, w: width, h: height } = useChartBoxSize(560, Math.max(245, minHeight), minHeight);

  const padLeft = 26;
  const padRight = 26;
  const padTop = 30;
  const padBottom = 30;
  const innerW = Math.max(120, width - padLeft - padRight);
  const innerH = Math.max(120, height - padTop - padBottom);

  const { getMetricVal, values } = useMemo(() => {
    const readVal = (d: DomMetaDailyPoint | DomMetaEntityDailyPoint): number => {
      const rec = d as unknown as Record<string, number | undefined>;
      if (metric === 'result') {
        const explicitRes = Number(rec.result || 0);
        return explicitRes > 0 ? explicitRes : Number(d.leads || 0) + Number(d.messages || 0);
      }
      if (metric === 'cpr') {
        const explicitCpr = Number(rec.cpr || 0);
        if (explicitCpr > 0) return explicitCpr;
        const explicitRes = Number(rec.result || 0);
        const dayRes =
          explicitRes > 0 ? explicitRes : Number(d.leads || 0) + Number(d.messages || 0);
        return dayRes > 0 ? Number(d.spend || 0) / dayRes : 0;
      }
      return Number(rec[metric] || 0);
    };
    return { getMetricVal: readVal, values: data.map(readVal) };
  }, [data, metric]);
  const maxVal = Math.max(...values, 1);

  const coords = useMemo(() => {
    if (data.length === 0) return [];
    return data.map((d, idx) => {
      const raw = getMetricVal(d);
      const x =
        data.length === 1
          ? padLeft + innerW / 2
          : padLeft + (idx / (data.length - 1)) * innerW;
      const ratio = raw / (maxVal * 1.09);
      const y = padTop + innerH - ratio * innerH;
      return { x, y, raw, date: d.date };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, metric, maxVal, innerW, innerH]);

  const isMoneyMetric = metric === 'spend' || metric === 'cpm' || metric === 'cpr';
  const formatVal = (v: number) =>
    isMoneyMetric ? formatDomMoneyShort(v, currency) : formatDomNumber(v);
  const formatFullVal = (v: number) =>
    isMoneyMetric ? formatDomMoney(v, currency) : formatDomNumber(v);

  if (coords.length === 0) {
    return (
      <div
        className="flex-1 w-full flex items-center justify-center text-xs text-slate-400"
        style={{ minHeight }}
      >
        Chưa có dữ liệu theo ngày trong khoảng thời gian này
      </div>
    );
  }

  const linePath = buildSmoothLinePath(coords);
  const baselineY = padTop + innerH;
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${baselineY} L ${coords[0].x.toFixed(1)} ${baselineY} Z`;
  const labelStep = coords.length <= 9 ? 1 : Math.ceil(coords.length / 7);
  const activePt = hoverIdx !== null ? coords[hoverIdx] : null;

  return (
    <div
      ref={boxRef}
      className="relative flex-1 w-full select-none"
      style={{ minHeight }}
    >
      {activePt && (
        <div className="pointer-events-none absolute top-0 right-1 z-10 rounded-lg bg-slate-900/90 text-white px-2.5 py-1 text-[11px] font-medium shadow-md tabular-nums flex items-center gap-2">
          <span className="text-slate-300">{activePt.date}</span>
          <strong className="text-sky-300 font-bold">{formatFullVal(activePt.raw)}</strong>
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 w-full h-full block overflow-visible"
      >
        <defs>
          <linearGradient id={`domArea-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E40FF" stopOpacity="0.22" />
            <stop offset="68%" stopColor="#06B6D4" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#1E40FF" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id={`domStroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1E40FF" />
            <stop offset="60%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const gy = padTop + innerH * t;
          return (
            <line
              key={t}
              x1={padLeft}
              y1={gy}
              x2={width - padRight}
              y2={gy}
              stroke="rgba(15,23,42,0.05)"
              strokeWidth="1"
            />
          );
        })}
        {coords.map((pt, idx) =>
          idx % labelStep === 0 || hoverIdx === idx ? (
            <line
              key={`vg-${pt.date}`}
              x1={pt.x}
              y1={padTop}
              x2={pt.x}
              y2={baselineY}
              stroke={hoverIdx === idx ? 'rgba(30,64,255,0.22)' : 'rgba(15,23,42,0.035)'}
              strokeDasharray={hoverIdx === idx ? '3 3' : undefined}
              strokeWidth="1"
            />
          ) : null
        )}

        <path d={areaPath} fill={`url(#domArea-${uid})`} />
        <path
          d={linePath}
          fill="none"
          stroke={`url(#domStroke-${uid})`}
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {coords.map((pt, idx) => {
          const showLabel = coords.length <= 9 || idx % labelStep === 0 || hoverIdx === idx;
          const isHovered = hoverIdx === idx;
          return (
            <g
              key={pt.date}
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer"
            >
              <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 5.5 : 3.8}
                fill="#1E40FF"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              {showLabel && pt.raw > 0 && (
                <text
                  x={pt.x}
                  y={Math.max(13, pt.y - 11)}
                  textAnchor="middle"
                  className="fill-slate-700 font-semibold"
                  fontSize="10.5"
                >
                  {formatVal(pt.raw)}
                </text>
              )}
              {((idx % labelStep === 0 &&
                coords.length - 1 - idx >= Math.max(1, Math.ceil(labelStep * 0.6))) ||
                idx === coords.length - 1) && (
                <text
                  x={pt.x}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-slate-500 font-medium"
                  fontSize="10"
                >
                  {pt.date.length === 10 ? pt.date.slice(5) : pt.date}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

function roundedTopBarPath(x: number, y: number, w: number, h: number, r: number): string {
  const safeW = Math.max(0, w);
  const safeH = Math.max(0, h);
  const rad = Math.min(r, safeW / 2, safeH);
  if (rad <= 0) {
    return `M${x},${y} h${safeW} v${safeH} h-${safeW} Z`;
  }
  return `M${x},${y + rad} a${rad},${rad} 0 0 1 ${rad},-${rad} h${safeW - 2 * rad} a${rad},${rad} 0 0 1 ${rad},${rad} v${safeH - rad} h-${safeW} Z`;
}

export const MetaGoalBarChart: React.FC<{
  items: Array<{ label: string; spend: number; result?: number }>;
  currency?: string;
  metric?: 'spend' | 'result' | 'cpr';
  onMetricChange?: (m: 'spend' | 'result' | 'cpr') => void;
  hideMetricSelect?: boolean;
}> = ({
  items,
  currency = 'VND',
  metric: controlledMetric,
  onMetricChange,
  hideMetricSelect = false,
}) => {
  const uid = useId().replace(/:/g, '');
  const [internalMetric, setInternalMetric] = useState<'spend' | 'result' | 'cpr'>('spend');
  const barMetric = controlledMetric ?? internalMetric;
  const setBarMetric = (m: 'spend' | 'result' | 'cpr') => {
    setInternalMetric(m);
    onMetricChange?.(m);
  };
  const { ref: boxRef, w: width, h: height } = useChartBoxSize(380, 260, 225);

  const hasResultSignal = useMemo(
    () => items.some((x) => Number(x.result || 0) > 0),
    [items]
  );

  const getVal = (x: { spend: number; result?: number }) => {
    const res = Number(x.result || 0);
    if (barMetric === 'result' && hasResultSignal) return res;
    if (barMetric === 'cpr' && hasResultSignal) return res > 0 ? x.spend / res : 0;
    return x.spend;
  };

  const sorted = useMemo(
    () =>
      [...items]
        .filter((x) => x.spend > 0 || Number(x.result || 0) > 0)
        .sort((a, b) => getVal(b) - getVal(a))
        .slice(0, 5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, barMetric, hasResultSignal]
  );
  const maxVal = Math.max(...sorted.map((x) => getVal(x)), 1);

  if (sorted.length === 0) {
    return (
      <div className="flex-1 min-h-[235px] flex items-center justify-center text-xs text-slate-400">
        Chưa có dữ liệu phân bổ mục tiêu chiến dịch
      </div>
    );
  }

  const padX = 14;
  const padTop = 28;
  const padBottom = 30;
  const innerW = Math.max(160, width - padX * 2);
  const innerH = Math.max(125, height - padTop - padBottom);
  const slotW = innerW / sorted.length;
  const maxLabelChars = Math.max(7, Math.floor((slotW - 10) / 5.9));
  const fmtBarVal = (v: number) =>
    barMetric === 'result' && hasResultSignal
      ? formatDomNumber(v)
      : formatDomMoneyShort(v, currency);

  return (
    <div className="flex-1 w-full min-h-[235px] flex flex-col select-none">
      {!hideMetricSelect && hasResultSignal && (
        <div className="flex items-center justify-end pb-1 shrink-0">
          <DomMetaSelect
            ariaLabel="Chọn chỉ số Meta Goal"
            value={barMetric}
            onChange={(v) => setBarMetric(v as 'spend' | 'result' | 'cpr')}
            variant="compact"
            align="right"
            options={[
              { value: 'spend', label: 'Chi tiêu (Spent)' },
              { value: 'result', label: 'Kết quả (Result)' },
              { value: 'cpr', label: 'Chi phí/KQ (CPR)' },
            ]}
          />
        </div>
      )}
      <div ref={boxRef} className="relative flex-1 w-full min-h-[215px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 w-full h-full block overflow-visible"
        >
          <defs>
            <linearGradient id={`goalPrimary-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E40FF" />
              <stop offset="65%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id={`goalSecond-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#7DD3FC" />
            </linearGradient>
            <linearGradient id={`goalMuted-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1={padX}
              y1={padTop + innerH * t}
              x2={width - padX}
              y2={padTop + innerH * t}
              stroke="rgba(15,23,42,0.05)"
              strokeWidth="1"
            />
          ))}

          {sorted.map((item, idx) => {
            const val = getVal(item);
            const barW = Math.min(78, Math.max(28, slotW * 0.56));
            const x = padX + idx * slotW + (slotW - barW) / 2;
            const h = Math.max(8, (val / (maxVal * 1.08)) * innerH);
            const y = padTop + innerH - h;
            const fillUrl =
              idx === 0
                ? `url(#goalPrimary-${uid})`
                : idx === 1
                  ? `url(#goalSecond-${uid})`
                  : `url(#goalMuted-${uid})`;
            const res = Number(item.result || 0);
            const shortLabel =
              item.label.length > maxLabelChars
                ? `${item.label.slice(0, maxLabelChars - 1)}…`
                : item.label;
            return (
              <g key={item.label}>
                <title>{`${item.label}: ${formatDomMoney(item.spend, currency)}${res > 0 ? ` · ${formatDomNumber(res)} KQ · CPR ${formatDomMoney(item.spend / res, currency)}` : ''}`}</title>
                <path d={roundedTopBarPath(x, y, barW, h, 8)} fill={fillUrl} />
                <text
                  x={x + barW / 2}
                  y={Math.max(14, y - 8)}
                  textAnchor="middle"
                  className="fill-slate-800 font-bold"
                  fontSize="11"
                >
                  {fmtBarVal(val)}
                </text>
                <text
                  x={x + barW / 2}
                  y={height - 9}
                  textAnchor="middle"
                  className="fill-slate-500 font-semibold uppercase"
                  fontSize="9"
                >
                  {shortLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const PLATFORM_SLICE_COLORS: Record<string, string> = {
  Facebook: '#1877F2',
  Instagram: '#EC4899',
  Messenger: '#7C3AED',
  'Audience Network': '#0284C7',
  Threads: '#0F172A',
  WhatsApp: '#16A34A',
  'Other Platform': '#94A3B8',
};

export const SpentPlatformDonutCard: React.FC<{
  platforms: DomMetaPlatformSlice[];
  positions: DomMetaPositionSlice[];
  platformDevices?: DomMetaPositionSlice[];
  currency?: string;
}> = ({ platforms, positions, platformDevices = [], currency = 'VND' }) => {
  const [viewMode, setViewMode] = useState<'donut' | 'positions' | 'devices'>('donut');
  const [platMetric, setPlatMetric] = useState<'spend' | 'result' | 'cpr' | 'reach'>('spend');
  const [hoveredPlat, setHoveredPlat] = useState<string | null>(null);

  const getPlatVal = (p: DomMetaPlatformSlice) => {
    if (platMetric === 'result') return p.result || 0;
    if (platMetric === 'cpr') return p.result > 0 ? p.spend / p.result : 0;
    if (platMetric === 'reach') return p.reach || 0;
    return p.spend || 0;
  };

  const totalMetric = useMemo(
    () => platforms.reduce((acc, p) => acc + getPlatVal(p), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [platforms, platMetric]
  );

  const orderedPlatforms = useMemo(() => {
    const list = [...platforms];
    list.sort((a, b) => getPlatVal(b) - getPlatVal(a) || b.spend - a.spend);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms, platMetric]);

  const radius = 64;
  const cx = 92;
  const cy = 92;
  const circumference = 2 * Math.PI * radius;

  const slices = useMemo(() => {
    let offset = 0;
    return orderedPlatforms.map((p) => {
      const val = getPlatVal(p);
      const pct = totalMetric > 0 ? (val / totalMetric) * 100 : 0;
      const len = (pct / 100) * circumference;
      const midFrac = totalMetric > 0 ? (offset + len / 2) / circumference : 0;
      const midRad = midFrac * 2 * Math.PI - Math.PI / 2;
      const item = {
        platform: p.platform,
        spend: p.spend,
        result: p.result,
        reach: p.reach,
        clicks: p.clicks || 0,
        cpr: p.result > 0 ? p.spend / p.result : 0,
        val,
        pct,
        len,
        offset,
        color: PLATFORM_SLICE_COLORS[p.platform] || '#64748B',
        labelX: cx + radius * Math.cos(midRad),
        labelY: cy + radius * Math.sin(midRad),
      };
      offset += len;
      return item;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedPlatforms, totalMetric, circumference, platMetric]);

  const activeSlice =
    (hoveredPlat ? slices.find((s) => s.platform === hoveredPlat) : null) ||
    slices[0] || {
      platform: 'Facebook',
      spend: 0,
      val: 0,
      pct: 0,
      color: '#1877F2',
    };

  if (viewMode === 'positions' || viewMode === 'devices') {
    const activeList = viewMode === 'devices' && platformDevices.length > 0 ? platformDevices : positions;
    const posTotal = Math.max(
      activeList.reduce((s, p) => s + p.spend, 0),
      1
    );
    const maxPos = Math.max(...activeList.map((p) => p.spend), 1);
    return (
      <div className="flex flex-col h-full flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
          {platformDevices.length > 0 ? (
            <DomMetaSelect
              ariaLabel="Chế độ xem vị trí hiển thị"
              value={viewMode}
              onChange={(v) => setViewMode(v as 'positions' | 'devices')}
              variant="compact"
              options={[
                { value: 'positions', label: 'Vị trí (Placement)' },
                { value: 'devices', label: 'Platform × Thiết bị' },
              ]}
            />
          ) : (
            <span className="text-xs font-bold text-slate-800 truncate">Vị trí (Placement)</span>
          )}
          <button
            type="button"
            onClick={() => setViewMode('donut')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#1E40FF] text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0 dom-ios-press"
          >
            <span>⇄ Donut</span>
          </button>
        </div>
        <div className="space-y-2 flex-1 max-h-[258px] overflow-y-auto pr-1">
          {activeList.slice(0, 15).map((pos) => {
            const widthPct = Math.max(5, Math.round((pos.spend / maxPos) * 100));
            const sharePct = ((pos.spend / posTotal) * 100).toFixed(1);
            const cpr = pos.result > 0 ? pos.spend / pos.result : 0;
            return (
              <div
                key={pos.label}
                className="rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <PlatformBrandLogo platform={pos.rawPlatform || pos.platform} size="xs" />
                    <span className="font-semibold text-slate-700 truncate">{pos.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                    {pos.result > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        {formatDomNumber(pos.result)} KQ · {formatDomMoneyShort(cpr, currency)}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200/80 text-[10px] font-semibold text-slate-500">
                      {sharePct}%
                    </span>
                    <span className="font-bold text-slate-800">
                      {formatDomMoney(pos.spend, currency)}
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-200/70 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {activeList.length === 0 && (
            <div className="h-[180px] flex items-center justify-center text-xs text-slate-400">
              Chưa có dữ liệu vị trí hiển thị
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 min-w-0">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#1E40FF] shrink-0" />
          <span className="truncate">Platform</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DomMetaSelect
            ariaLabel="Chọn chỉ số Platform"
            value={platMetric}
            onChange={(v) => setPlatMetric(v as 'spend' | 'result' | 'cpr' | 'reach')}
            variant="compact"
            align="right"
            options={[
              { value: 'spend', label: 'Spent' },
              { value: 'result', label: 'Kết quả (KQ)' },
              { value: 'cpr', label: 'CPR (Chi phí/KQ)' },
              { value: 'reach', label: 'Reach' },
            ]}
          />
          <button
            type="button"
            onClick={() => setViewMode('positions')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#1E40FF] text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0 dom-ios-press"
          >
            <span>⇄ Vị trí</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center flex-1">
        <div className="sm:col-span-6 space-y-2">
          {slices.slice(0, 4).map((item) => (
            <div
              key={item.platform}
              onMouseEnter={() => setHoveredPlat(item.platform)}
              onMouseLeave={() => setHoveredPlat(null)}
              className={`rounded-xl border px-3 py-2 transition-colors cursor-pointer ${
                hoveredPlat === item.platform
                  ? 'bg-blue-50/70 border-blue-200'
                  : 'bg-slate-50/90 border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <PlatformBrandLogo platform={item.platform} size="sm" />
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    {item.platform}
                  </span>
                </div>
                <span className="text-[10.5px] font-bold text-slate-500 tabular-nums">
                  {platMetric === 'cpr'
                    ? formatDomMoneyShort(item.spend, currency)
                    : `${item.pct.toFixed(1)}%`}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pl-7">
                <span className="text-sm font-bold text-slate-800 tabular-nums">
                  {platMetric === 'spend'
                    ? formatDomMoney(item.spend, currency)
                    : platMetric === 'cpr'
                      ? item.result > 0
                        ? formatDomMoney(item.cpr, currency)
                        : '—'
                      : `${formatDomNumber(item.val)} ${platMetric === 'result' ? 'KQ' : 'người'}`}
                </span>
                {item.result > 0 && (
                  <span className="text-[10px] font-semibold text-emerald-700 tabular-nums">
                    {platMetric === 'result'
                      ? `CPR ${formatDomMoneyShort(item.cpr, currency)}`
                      : `${formatDomNumber(item.result)} KQ`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="sm:col-span-6 flex items-center justify-center">
          <div className="relative w-[184px] h-[184px] flex items-center justify-center">
            <svg viewBox="0 0 184 184" className="w-full h-full overflow-visible">
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="22"
              />
              {totalMetric > 0 &&
                slices
                  .filter((s) => s.len > 0)
                  .map((s) => (
                    <circle
                      key={s.platform}
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={hoveredPlat === s.platform ? 25 : 22}
                      strokeDasharray={`${s.len} ${circumference}`}
                      strokeDashoffset={-s.offset}
                      transform={`rotate(-90 ${cx} ${cy})`}
                      className="transition-all duration-150 cursor-pointer"
                      onMouseEnter={() => setHoveredPlat(s.platform)}
                      onMouseLeave={() => setHoveredPlat(null)}
                    >
                      <title>{`${s.platform}: ${formatDomMoney(s.spend, currency)} · ${formatDomNumber(s.result)} KQ (${s.pct.toFixed(1)}%)`}</title>
                    </circle>
                  ))}
              {totalMetric > 0 &&
                slices.filter((s) => s.pct >= 8).length >= 2 &&
                slices
                  .filter((s) => s.pct >= 8)
                  .map((s) => (
                    <g key={`lbl-${s.platform}`} className="pointer-events-none">
                      <rect
                        x={s.labelX - 16}
                        y={s.labelY - 8.5}
                        width={32}
                        height={17}
                        rx={8.5}
                        fill="#FFFFFF"
                        stroke={s.color}
                        strokeWidth="1.2"
                      />
                      <text
                        x={s.labelX}
                        y={s.labelY + 3.2}
                        textAnchor="middle"
                        className="fill-slate-800 font-bold"
                        fontSize="9"
                      >
                        {Math.round(s.pct)}%
                      </text>
                    </g>
                  ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
              <span className="text-lg font-extrabold text-slate-800 tabular-nums leading-tight">
                {platMetric === 'cpr'
                  ? activeSlice.val > 0
                    ? formatDomMoneyShort(activeSlice.val, currency)
                    : '—'
                  : `${activeSlice.pct.toFixed(1)}%`}
              </span>
              <span className="text-[11px] font-medium text-slate-500 truncate max-w-[92px]">
                {activeSlice.platform}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DEVICE_DONUT_PALETTE = [
  '#1E40FF',
  '#10B981',
  '#06B6D4',
  '#F59E0B',
  '#8B5CF6',
  '#64748B',
];

/** Circular Donut Chart with Slice % Labels & Device Brand Logos (used in Dashboard Extra Details & Drawer Row 4) */
export const DeviceDonutCard: React.FC<{
  devices: Array<
    | DomMetaDeviceRow
    | {
        label: string;
        rawKey?: string;
        spend: number;
        impressions?: number;
        clicks?: number;
        result?: number;
      }
  >;
  currency?: string;
  compact?: boolean;
}> = ({ devices, currency = 'VND', compact = false }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [devMetric, setDevMetric] = useState<'spend' | 'result' | 'cpr'>('spend');

  const normalized = useMemo(() => {
    return devices
      .map((d) => {
        const isRow = 'device' in d;
        const spend = Number(d.spend || 0);
        const result = Number(d.result || 0);
        return {
          label: isRow ? d.device : d.label,
          rawKey: isRow ? d.rawDevice || d.device : d.rawKey || d.label,
          spend,
          impressions: Number(d.impressions || 0),
          clicks: Number(d.clicks || 0),
          result,
          cpr: result > 0 ? spend / result : 0,
        };
      })
      .filter((d) => d.spend > 0 || d.impressions > 0)
      .sort((a, b) => {
        if (devMetric === 'result') return b.result - a.result || b.spend - a.spend;
        if (devMetric === 'cpr') return (a.cpr || Infinity) - (b.cpr || Infinity) || b.spend - a.spend;
        return b.spend - a.spend;
      })
      .slice(0, 6);
  }, [devices, devMetric]);

  const totalSpend = useMemo(
    () => normalized.reduce((s, d) => s + d.spend, 0),
    [normalized]
  );

  const getDevVal = (d: (typeof normalized)[number]) => {
    if (devMetric === 'result') return d.result;
    if (devMetric === 'cpr') return d.cpr;
    return d.spend;
  };

  const totalMetric = useMemo(
    () => normalized.reduce((s, d) => s + getDevVal(d), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [normalized, devMetric]
  );

  if (normalized.length === 0 || totalSpend <= 0) {
    return (
      <div className="flex-1 min-h-[210px] flex items-center justify-center text-xs text-slate-400">
        Chưa có dữ liệu thiết bị trong khoảng thời gian này
      </div>
    );
  }

  const cx = 92;
  const cy = 92;
  const radius = 62;
  const circumference = 2 * Math.PI * radius;

  const slices = normalized.reduce<{
    offset: number;
    items: Array<{
      idx: number;
      label: string;
      rawKey: string;
      spend: number;
      clicks: number;
      result: number;
      cpr: number;
      val: number;
      pct: number;
      len: number;
      offset: number;
      color: string;
      labelX: number;
      labelY: number;
    }>;
  }>(
    (acc, d, idx) => {
      const val = getDevVal(d);
      const pct = totalMetric > 0 ? (val / totalMetric) * 100 : 0;
      const len = (pct / 100) * circumference;
      const midFrac = totalMetric > 0 ? (acc.offset + len / 2) / circumference : 0;
      const midRad = midFrac * 2 * Math.PI - Math.PI / 2;
      acc.items.push({
        idx,
        label: d.label,
        rawKey: d.rawKey,
        spend: d.spend,
        clicks: d.clicks,
        result: d.result,
        cpr: d.cpr,
        val,
        pct,
        len,
        offset: acc.offset,
        color: DEVICE_DONUT_PALETTE[idx % DEVICE_DONUT_PALETTE.length],
        labelX: cx + radius * Math.cos(midRad),
        labelY: cy + radius * Math.sin(midRad),
      });
      acc.offset += len;
      return acc;
    },
    { offset: 0, items: [] }
  ).items;

  const active = (hoveredIdx !== null ? slices[hoveredIdx] : null) || slices[0];

  return (
    <div data-testid="device-donut-card" className="flex flex-col flex-1 gap-2 min-w-0">
      <div className="flex items-center justify-end shrink-0">
        <DomMetaSelect
          ariaLabel="Chọn chỉ số Thiết bị"
          value={devMetric}
          onChange={(v) => setDevMetric(v as 'spend' | 'result' | 'cpr')}
          variant="compact"
          align="right"
          options={[
            { value: 'spend', label: 'Spent' },
            { value: 'result', label: 'Kết quả (KQ)' },
            { value: 'cpr', label: 'CPR (Chi phí/KQ)' },
          ]}
        />
      </div>
      <div
        className={`grid grid-cols-1 ${
          compact ? 'xl:grid-cols-12' : 'sm:grid-cols-12'
        } gap-3.5 items-center flex-1`}
      >
        <div className={`${compact ? 'xl:col-span-5' : 'sm:col-span-5'} flex items-center justify-center`}>
          <div className="relative w-[178px] h-[178px] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 184 184" className="w-full h-full overflow-visible">
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#F1F5F9" strokeWidth="22" />
              {totalMetric > 0 &&
                slices
                  .filter((s) => s.len > 0)
                  .map((s) => (
                    <circle
                      key={s.label}
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={hoveredIdx === s.idx ? 25 : 22}
                      strokeDasharray={`${s.len} ${circumference}`}
                      strokeDashoffset={-s.offset}
                      transform={`rotate(-90 ${cx} ${cy})`}
                      className="transition-all duration-150 cursor-pointer"
                      onMouseEnter={() => setHoveredIdx(s.idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      <title>{`${s.label}: ${formatDomMoney(s.spend, currency)} · ${formatDomNumber(s.result)} KQ${s.cpr > 0 ? ` · CPR ${formatDomMoney(s.cpr, currency)}` : ''}`}</title>
                    </circle>
                  ))}
              {totalMetric > 0 &&
                slices
                  .filter((s) => s.pct >= 6)
                  .map((s) => (
                    <g key={`dlbl-${s.label}`} className="pointer-events-none">
                      <rect
                        x={s.labelX - 16.5}
                        y={s.labelY - 8.5}
                        width={33}
                        height={17}
                        rx={8.5}
                        fill="#FFFFFF"
                        stroke={s.color}
                        strokeWidth="1.3"
                      />
                      <text
                        x={s.labelX}
                        y={s.labelY + 3.2}
                        textAnchor="middle"
                        className="fill-slate-800 font-bold"
                        fontSize="9"
                      >
                        {s.pct >= 10 ? `${Math.round(s.pct)}%` : `${s.pct.toFixed(1)}%`}
                      </text>
                    </g>
                  ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-5">
              <DeviceBrandLogo device={active.rawKey} size="xs" className="mb-1" />
              <span className="text-base font-extrabold text-slate-900 tabular-nums leading-tight">
                {devMetric === 'cpr'
                  ? active.cpr > 0
                    ? formatDomMoneyShort(active.cpr, currency)
                    : '—'
                  : `${active.pct.toFixed(1)}%`}
              </span>
              <span className="text-[10.5px] font-semibold text-slate-500 truncate max-w-[88px]">
                {active.label}
              </span>
            </div>
          </div>
        </div>

        <div className={`${compact ? 'xl:col-span-7' : 'sm:col-span-7'} space-y-1.5 max-h-[228px] overflow-y-auto pr-0.5`}>
          {slices.map((s) => (
            <div
              key={s.label}
              onMouseEnter={() => setHoveredIdx(s.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`rounded-xl border px-2.5 py-1.5 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                hoveredIdx === s.idx
                  ? 'bg-blue-50/70 border-blue-200'
                  : 'bg-slate-50/90 border-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-1.5 h-5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <DeviceBrandLogo device={s.rawKey} size="xs" />
                <div className="min-w-0">
                  <div className="text-[11.5px] font-bold text-slate-800 truncate leading-tight">
                    {s.label}
                  </div>
                  <div className="text-[10px] text-slate-500 tabular-nums whitespace-nowrap leading-tight mt-0.5">
                    {s.result > 0
                      ? `${formatDomNumber(s.result)} KQ · CPR ${formatDomMoneyShort(s.cpr, currency)}`
                      : `${s.pct.toFixed(1)}%${s.clicks > 0 ? ` · ${formatDomNumber(s.clicks)} clicks` : ''}`}
                  </div>
                </div>
              </div>
              <div className="text-[11.5px] font-extrabold text-slate-800 tabular-nums shrink-0">
                {devMetric === 'result'
                  ? `${formatDomNumber(s.result)} KQ`
                  : devMetric === 'cpr'
                    ? s.result > 0
                      ? formatDomMoneyShort(s.cpr, currency)
                      : '—'
                    : formatDomMoneyShort(s.spend, currency)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** 24-Hour Dual Bar (Spent) + Smooth Line (Result) + Advertiser TZ vs Audience TZ Switcher */
export const HourlySpendResultChart: React.FC<{
  hourly: DomMetaEntityHourPoint[];
  hourlyAudience?: DomMetaEntityHourPoint[];
  currency?: string;
}> = ({ hourly, hourlyAudience, currency = 'VND' }) => {
  const uid = useId().replace(/:/g, '');
  const [hoverHour, setHoverHour] = useState<number | null>(null);
  const [tzMode, setTzMode] = useState<'advertiser' | 'audience'>('advertiser');
  const [hourlyMode, setHourlyMode] = useState<'spend_result' | 'cpr'>('spend_result');
  const { ref: boxRef, w: width, h: height } = useChartBoxSize(700, 225, 210);

  const hasAudienceSeries = useMemo(
    () => Boolean(hourlyAudience && hourlyAudience.some((h) => h.spend > 0 || h.result > 0)),
    [hourlyAudience]
  );

  const activeHourly =
    tzMode === 'audience' && hasAudienceSeries && hourlyAudience ? hourlyAudience : hourly;

  const slots = useMemo(() => {
    const map = new Map<number, DomMetaEntityHourPoint>();
    for (const item of activeHourly) {
      map.set(item.hour, item);
    }
    return Array.from({ length: 24 }, (_, h) => {
      return (
        map.get(h) || {
          hour: h,
          label: `${String(h).padStart(2, '0')}:00`,
          spend: 0,
          impressions: 0,
          clicks: 0,
          result: 0,
          cpr: 0,
        }
      );
    });
  }, [activeHourly]);

  const maxSpend = Math.max(...slots.map((s) => s.spend), 1);
  const maxResult = Math.max(...slots.map((s) => s.result), 1);
  const maxCpr = Math.max(...slots.map((s) => (s.result > 0 ? s.cpr : 0)), 1);
  const totalSpend = slots.reduce((s, x) => s + x.spend, 0);
  const totalResult = slots.reduce((s, x) => s + x.result, 0);
  const avgCpr = totalResult > 0 ? totalSpend / totalResult : 0;
  const hasAnyData = slots.some((s) => s.spend > 0 || s.result > 0);

  const intel = useMemo(() => {
    const withResults = slots
      .filter((s) => s.result > 0 && s.spend > 0)
      .sort((a, b) => a.cpr - b.cpr || b.result - a.result);
    const goldenHours = withResults.slice(0, 3);
    const goldenSet = new Set(goldenHours.map((g) => g.hour));
    const peakSpendSlot = [...slots].sort((a, b) => b.spend - a.spend)[0];
    const drainSlot = [...slots]
      .filter((s) => s.spend > 0 && s.result === 0)
      .sort((a, b) => b.spend - a.spend)[0];
    return { goldenHours, goldenSet, peakSpendSlot, drainSlot };
  }, [slots]);

  if (!hasAnyData) {
    return (
      <div className="flex-1 min-h-[210px] flex items-center justify-center text-xs text-slate-400">
        Chưa có dữ liệu phân bổ theo khung giờ trong khoảng thời gian này
      </div>
    );
  }

  const padLeft = 10;
  const padRight = 10;
  const padTop = 26;
  const padBottom = 26;
  const innerW = Math.max(230, width - padLeft - padRight);
  const innerH = Math.max(125, height - padTop - padBottom);
  const slotW = innerW / 24;
  const barW = Math.max(5, Math.min(20, slotW * 0.64));
  const compactLabels = width < 460;

  const resultPoints = slots.map((s, idx) => {
    const x = padLeft + idx * slotW + slotW / 2;
    const ratio = totalResult > 0 ? s.result / (maxResult * 1.18) : 0;
    const y = padTop + innerH - ratio * innerH;
    return { x, y, result: s.result };
  });
  const resultLinePath = totalResult > 0 ? buildSmoothLinePath(resultPoints) : '';
  const activeSlot = hoverHour !== null ? slots[hoverHour] : null;

  return (
    <div data-testid="hourly-spend-result-chart" className="flex flex-col flex-1 min-w-0 gap-2.5 select-none">
      {/* Legend + Non-overlapping Live Readout Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50/90 border border-slate-200/70 px-2.5 sm:px-3 py-2 text-[11px] min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-slate-600 font-medium min-w-0">
          {hourlyMode === 'spend_result' ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#1E40FF]" />
                <span>Spent</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Result</span>
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span>CPR theo giờ</span>
            </span>
          )}
          {intel.goldenHours.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Giờ vàng</span>
            </span>
          )}
          {totalResult > 0 && (
            <button
              type="button"
              onClick={() => setHourlyMode((m) => (m === 'spend_result' ? 'cpr' : 'spend_result'))}
              className={`px-2 py-0.5 rounded-lg border text-[10.5px] font-bold cursor-pointer dom-ios-press ${
                hourlyMode === 'cpr'
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-slate-200/90 text-slate-700 hover:border-[#1E40FF] hover:text-[#1E40FF]'
              }`}
            >
              ⇄ {hourlyMode === 'cpr' ? 'Spent & KQ' : 'Xem CPR'}
            </button>
          )}
          {hasAudienceSeries && (
            <button
              type="button"
              onClick={() => setTzMode((m) => (m === 'advertiser' ? 'audience' : 'advertiser'))}
              className="px-2 py-0.5 rounded-lg bg-white border border-slate-200/90 text-[10.5px] font-bold text-[#1E40FF] cursor-pointer dom-ios-press"
            >
              ⇄ {tzMode === 'audience' ? 'Giờ Khách hàng' : 'Giờ TKQC'}
            </button>
          )}
        </div>

        {activeSlot ? (
          <div className="flex flex-wrap items-center gap-2 text-[11px] tabular-nums font-semibold text-slate-800">
            <span className="px-2 py-0.5 rounded-md bg-[#1E40FF] text-white font-bold">
              {String(activeSlot.hour).padStart(2, '0')}h
            </span>
            <span>
              <strong className="text-[#1E40FF]">{formatDomMoneyShort(activeSlot.spend, currency)}</strong>
            </span>
            <span>
              KQ: <strong className="text-emerald-600">{formatDomNumber(activeSlot.result)}</strong>
            </span>
            {activeSlot.result > 0 && (
              <span>
                CPR: <strong className="text-amber-700">{formatDomMoneyShort(activeSlot.cpr, currency)}</strong>
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-500 text-[10.5px] truncate tabular-nums">
            {avgCpr > 0 ? `TB CPR ${formatDomMoneyShort(avgCpr, currency)} · ` : ''}Chạm/rê cột giờ
          </span>
        )}
      </div>

      {/* Responsive 24-Slot Single-Row SVG Chart (Zero Horizontal Overflow on Mobile!) */}
      <div className="w-full flex-1 min-h-[195px] sm:min-h-[210px] min-w-0 flex flex-col">
        <div ref={boxRef} className="relative flex-1 w-full min-w-0 min-h-[195px] sm:min-h-[210px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="absolute inset-0 w-full h-full block overflow-visible"
          >
          <defs>
            <linearGradient id={`hrBarStd-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E40FF" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
            <linearGradient id={`hrBarGold-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
            <linearGradient id={`hrBarCpr-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1={padLeft}
              y1={padTop + innerH * t}
              x2={width - padRight}
              y2={padTop + innerH * t}
              stroke="rgba(15,23,42,0.05)"
              strokeWidth="1"
            />
          ))}

          {slots.map((s, idx) => {
            const centerX = padLeft + idx * slotW + slotW / 2;
            const bx = centerX - barW / 2;
            const cprVal = s.result > 0 ? s.cpr : 0;
            const bh =
              hourlyMode === 'cpr'
                ? cprVal > 0
                  ? Math.max(6, (cprVal / (maxCpr * 1.16)) * innerH)
                  : 2.5
                : s.spend > 0
                  ? Math.max(5, (s.spend / (maxSpend * 1.12)) * innerH)
                  : 2.5;
            const by = padTop + innerH - bh;
            const isHovered = hoverHour === s.hour;
            const isGolden = intel.goldenSet.has(s.hour);

            return (
              <g
                key={s.hour}
                onMouseEnter={() => setHoverHour(s.hour)}
                onMouseLeave={() => setHoverHour(null)}
                onClick={() => setHoverHour(s.hour)}
                className="cursor-pointer"
              >
                {isHovered && (
                  <rect
                    x={padLeft + idx * slotW + 1}
                    y={padTop - 8}
                    width={slotW - 2}
                    height={innerH + 10}
                    rx={6}
                    fill="rgba(30,64,255,0.055)"
                  />
                )}
                <rect
                  x={padLeft + idx * slotW}
                  y={padTop - 8}
                  width={slotW}
                  height={innerH + 30}
                  fill="transparent"
                />
                <path
                  d={roundedTopBarPath(bx, by, barW, bh, 4.5)}
                  fill={
                    hourlyMode === 'cpr'
                      ? cprVal <= 0
                        ? '#E2E8F0'
                        : isGolden
                          ? `url(#hrBarGold-${uid})`
                          : `url(#hrBarCpr-${uid})`
                      : s.spend <= 0
                        ? '#E2E8F0'
                        : isGolden
                          ? `url(#hrBarGold-${uid})`
                          : `url(#hrBarStd-${uid})`
                  }
                  opacity={hoverHour !== null && !isHovered ? 0.68 : 1}
                />
                {hourlyMode === 'cpr' && cprVal > 0 && (isGolden || isHovered) && (
                  <text
                    x={centerX}
                    y={Math.max(12, by - 5)}
                    textAnchor="middle"
                    className={isGolden ? 'fill-emerald-700 font-extrabold' : 'fill-amber-700 font-bold'}
                    fontSize="8.5"
                  >
                    {formatDomMoneyShort(cprVal, currency)}
                  </text>
                )}
                {(!compactLabels || s.hour % 3 === 0 || isHovered) && (
                  <text
                    x={centerX}
                    y={height - 7}
                    textAnchor="middle"
                    className={
                      isHovered
                        ? 'fill-[#1E40FF] font-extrabold'
                        : 'fill-slate-500 font-medium'
                    }
                    fontSize={compactLabels ? '8.5' : '9.5'}
                  >
                    {String(s.hour).padStart(2, '0')}h
                  </text>
                )}
              </g>
            );
          })}

          {hourlyMode === 'spend_result' && totalResult > 0 && (
            <>
              <path
                d={resultLinePath}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.4"
                strokeLinecap="round"
                className="pointer-events-none"
              />
              {resultPoints.map((pt, idx) =>
                pt.result > 0 ? (
                  <g key={`res-${idx}`} className="pointer-events-none">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoverHour === idx ? 5 : 3.6}
                      fill="#10B981"
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                    />
                    <rect
                      x={pt.x - 10}
                      y={Math.max(4, pt.y - 19)}
                      width={20}
                      height={13}
                      rx={6.5}
                      fill="#ECFDF5"
                      stroke="#6EE7B7"
                      strokeWidth="1"
                    />
                    <text
                      x={pt.x}
                      y={Math.max(13, pt.y - 9.5)}
                      textAnchor="middle"
                      className="fill-emerald-700 font-extrabold"
                      fontSize="8.5"
                    >
                      {pt.result}
                    </text>
                  </g>
                ) : null
              )}
            </>
          )}
          </svg>
        </div>
      </div>

      {/* Schedule Intelligence Footer (Golden Hours & Spend Alert matching DOMATION_META) */}
      {(intel.goldenHours.length > 0 || (intel.peakSpendSlot && intel.peakSpendSlot.spend > 0)) && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
          {intel.goldenHours.map((g, idx) => (
            <span
              key={g.hour}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 font-semibold tabular-nums"
            >
              <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9.5px] font-bold">
                #{idx + 1}
              </span>
              <span>{String(g.hour).padStart(2, '0')}:00</span>
              <span className="text-emerald-600 font-normal">·</span>
              <span>{g.result} KQ</span>
              <span className="text-emerald-600 font-normal">·</span>
              <span>CPR {formatDomMoneyShort(g.cpr, currency)}</span>
            </span>
          ))}
          {intel.drainSlot && intel.drainSlot.spend >= maxSpend * 0.45 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/90 border border-amber-200/80 text-amber-800 font-medium tabular-nums">
              <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {String(intel.drainSlot.hour).padStart(2, '0')}:00 tiêu{' '}
                {formatDomMoneyShort(intel.drainSlot.spend, currency)} chưa ra KQ
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const AgeGenderBarChart: React.FC<{
  buckets: DomMetaAgeGenderBucket[];
  ageOnly: boolean;
  metric?: 'spend' | 'result' | 'cpr';
  currency?: string;
}> = ({ buckets, ageOnly, metric = 'spend', currency = 'VND' }) => {
  const uid = useId().replace(/:/g, '');
  const { ref: boxRef, w: width, h: height } = useChartBoxSize(380, 240, 220);

  const getBucketTotal = (b: DomMetaAgeGenderBucket) => {
    const totRes = b.maleResult + b.femaleResult;
    if (metric === 'result') return totRes;
    if (metric === 'cpr') return totRes > 0 ? b.totalSpend / totRes : 0;
    return b.totalSpend;
  };
  const getMaleVal = (b: DomMetaAgeGenderBucket) => {
    if (metric === 'result') return b.maleResult;
    if (metric === 'cpr') return b.maleResult > 0 ? b.maleSpend / b.maleResult : 0;
    return b.maleSpend;
  };
  const getFemaleVal = (b: DomMetaAgeGenderBucket) => {
    if (metric === 'result') return b.femaleResult;
    if (metric === 'cpr') return b.femaleResult > 0 ? b.femaleSpend / b.femaleResult : 0;
    return b.femaleSpend;
  };

  const peakAge = useMemo(() => {
    let best = '';
    if (metric === 'cpr') {
      let min = Infinity;
      for (const b of buckets) {
        const val = getBucketTotal(b);
        if (val > 0 && val < min) {
          min = val;
          best = b.age;
        }
      }
      return best;
    }
    let max = -1;
    for (const b of buckets) {
      const val = getBucketTotal(b);
      if (val > max) {
        max = val;
        best = b.age;
      }
    }
    return best;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buckets, metric]);

  const maxBar = useMemo(() => {
    if (ageOnly) return Math.max(...buckets.map((b) => getBucketTotal(b)), 1);
    return Math.max(...buckets.flatMap((b) => [getMaleVal(b), getFemaleVal(b)]), 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buckets, ageOnly, metric]);

  const padX = 12;
  const padTop = 24;
  const padBottom = 26;
  const innerW = Math.max(200, width - padX * 2);
  const innerH = Math.max(120, height - padTop - padBottom);
  const fmtVal = (v: number) =>
    metric === 'result' ? formatDomNumber(v) : v > 0 ? formatDomMoneyShort(v, currency) : '0';
  const fmtFull = (v: number) =>
    metric === 'result' ? formatDomNumber(v) : formatDomMoney(v, currency);

  return (
    <div className="flex-1 w-full min-h-[225px] select-none flex flex-col">
      {!ageOnly && (
        <div className="flex items-center justify-end gap-3 text-[10.5px] font-medium text-slate-500 pb-1 shrink-0">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#1E40FF]" />
            <span>Nam</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#06B6D4]" />
            <span>Nữ</span>
          </span>
        </div>
      )}
      <div ref={boxRef} className="relative flex-1 w-full min-h-[195px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 w-full h-full block overflow-visible"
        >
        <defs>
          <linearGradient id={`agePeakM-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E40FF" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
          <linearGradient id={`agePeakF-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#67E8F9" />
          </linearGradient>
          <linearGradient id={`ageSlateA-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id={`ageSlateB-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#BAE6FD" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padX}
            y1={padTop + innerH * t}
            x2={width - padX}
            y2={padTop + innerH * t}
            stroke="rgba(15,23,42,0.05)"
            strokeWidth="1"
          />
        ))}

        {buckets.map((b, idx) => {
          const slotW = innerW / Math.max(1, buckets.length);
          const baseX = padX + idx * slotW;
          const totalV = getBucketTotal(b);
          const isPeak = b.age === peakAge && totalV > 0;

          if (ageOnly) {
            const bw = Math.min(34, Math.max(18, slotW * 0.5));
            const bx = baseX + (slotW - bw) / 2;
            const h = totalV > 0 ? Math.max(5, (totalV / (maxBar * 1.1)) * innerH) : 3;
            const by = padTop + innerH - h;
            return (
              <g key={b.age}>
                <title>{`${b.age}: ${fmtFull(totalV)}`}</title>
                <path
                  d={roundedTopBarPath(bx, by, bw, h, 6)}
                  fill={isPeak ? `url(#agePeakM-${uid})` : `url(#ageSlateA-${uid})`}
                />
                {totalV > 0 && (
                  <text
                    x={baseX + slotW / 2}
                    y={Math.max(12, by - 5)}
                    textAnchor="middle"
                    className="fill-slate-700 font-bold"
                    fontSize="9.5"
                  >
                    {fmtVal(totalV)}
                  </text>
                )}
                <text
                  x={baseX + slotW / 2}
                  y={height - 7}
                  textAnchor="middle"
                  className="fill-slate-500 font-semibold"
                  fontSize="10"
                >
                  {b.age}
                </text>
              </g>
            );
          }

          const bw = Math.min(18, Math.max(11, slotW * 0.28));
          const gap = 4;
          const startX = baseX + (slotW - (bw * 2 + gap)) / 2;
          const mVal = getMaleVal(b);
          const fVal = getFemaleVal(b);
          const hMale = mVal > 0 ? Math.max(5, (mVal / (maxBar * 1.1)) * innerH) : 3;
          const hFemale = fVal > 0 ? Math.max(5, (fVal / (maxBar * 1.1)) * innerH) : 3;
          const topY = Math.min(padTop + innerH - hMale, padTop + innerH - hFemale);
          return (
            <g key={b.age}>
              <title>{`${b.age} — Nam: ${fmtFull(mVal)} | Nữ: ${fmtFull(fVal)}`}</title>
              <path
                d={roundedTopBarPath(startX, padTop + innerH - hMale, bw, hMale, 5)}
                fill={isPeak ? `url(#agePeakM-${uid})` : `url(#ageSlateA-${uid})`}
              />
              <path
                d={roundedTopBarPath(startX + bw + gap, padTop + innerH - hFemale, bw, hFemale, 5)}
                fill={isPeak ? `url(#agePeakF-${uid})` : `url(#ageSlateB-${uid})`}
              />
              {totalV > 0 && (isPeak || totalV >= maxBar * 0.35) && (
                <text
                  x={baseX + slotW / 2}
                  y={Math.max(12, topY - 5)}
                  textAnchor="middle"
                  className="fill-slate-700 font-bold"
                  fontSize="9"
                >
                  {fmtVal(totalV)}
                </text>
              )}
              <text
                x={baseX + slotW / 2}
                y={height - 7}
                textAnchor="middle"
                className="fill-slate-500 font-semibold"
                fontSize="10"
              >
                {b.age}
              </text>
            </g>
          );
        })}
        </svg>
      </div>
      {/* Gender Split Summary Strip */}
      {(() => {
        const totMaleSpend = buckets.reduce((s, b) => s + b.maleSpend, 0);
        const totFemaleSpend = buckets.reduce((s, b) => s + b.femaleSpend, 0);
        const totUnkSpend = buckets.reduce((s, b) => s + b.unknownSpend, 0);
        const totSpendAll = totMaleSpend + totFemaleSpend + totUnkSpend;
        const totMaleRes = buckets.reduce((s, b) => s + b.maleResult, 0);
        const totFemaleRes = buckets.reduce((s, b) => s + b.femaleResult, 0);
        if (totSpendAll <= 0) return null;
        const mPct = ((totMaleSpend / totSpendAll) * 100).toFixed(1);
        const fPct = ((totFemaleSpend / totSpendAll) * 100).toFixed(1);
        const mCpr = totMaleRes > 0 ? totMaleSpend / totMaleRes : 0;
        const fCpr = totFemaleRes > 0 ? totFemaleSpend / totFemaleRes : 0;
        return (
          <div className="grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-slate-100 text-[10.5px] tabular-nums shrink-0">
            <div className="rounded-lg bg-blue-50/60 border border-blue-100/80 px-2.5 py-1.5 flex items-center justify-between gap-1.5">
              <span className="font-bold text-[#1E40FF]">Nam ({mPct}%)</span>
              <span className="font-semibold text-slate-700">
                {totMaleRes > 0
                  ? `${formatDomNumber(totMaleRes)} KQ · ${formatDomMoneyShort(mCpr, currency)}`
                  : formatDomMoneyShort(totMaleSpend, currency)}
              </span>
            </div>
            <div className="rounded-lg bg-cyan-50/60 border border-cyan-100/80 px-2.5 py-1.5 flex items-center justify-between gap-1.5">
              <span className="font-bold text-sky-700">Nữ ({fPct}%)</span>
              <span className="font-semibold text-slate-700">
                {totFemaleRes > 0
                  ? `${formatDomNumber(totFemaleRes)} KQ · ${formatDomMoneyShort(fCpr, currency)}`
                  : formatDomMoneyShort(totFemaleSpend, currency)}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export const DaypartingHeatmapGrid: React.FC<{
  cells: DomMetaHourlyCell[];
  metric: 'spend' | 'result' | 'cpr' | 'leads' | 'messages' | 'purchases' | 'clicks';
  currency?: string;
}> = ({ cells, metric, currency = 'VND' }) => {
  const [mobileFull24h, setMobileFull24h] = useState(false);
  const [selectedMobileBlock, setSelectedMobileBlock] = useState<{
    dayLabel: string;
    blockLabel: string;
    val: number;
    spend: number;
    res: number;
  } | null>(null);

  const dayOrder = [
    { idx: 1, label: 'Thứ 2', short: 'T2' },
    { idx: 2, label: 'Thứ 3', short: 'T3' },
    { idx: 3, label: 'Thứ 4', short: 'T4' },
    { idx: 4, label: 'Thứ 5', short: 'T5' },
    { idx: 5, label: 'Thứ 6', short: 'T6' },
    { idx: 6, label: 'Thứ 7', short: 'T7' },
    { idx: 0, label: 'CN', short: 'CN' },
  ];

  const mobileBlocks = [
    { label: '00-04h', hours: [0, 1, 2, 3] },
    { label: '04-08h', hours: [4, 5, 6, 7] },
    { label: '08-12h', hours: [8, 9, 10, 11] },
    { label: '12-16h', hours: [12, 13, 14, 15] },
    { label: '16-20h', hours: [16, 17, 18, 19] },
    { label: '20-24h', hours: [20, 21, 22, 23] },
  ];

  const getCellVal = (c: DomMetaHourlyCell): number => {
    const totRes = c.result ?? (c.leads + c.messages + c.purchases);
    if (metric === 'result') return totRes;
    if (metric === 'cpr') return totRes > 0 ? c.spend / totRes : 0;
    return Number(c[metric] || 0);
  };

  const { lookup, rawCellMap, maxVal, goldenSlots } = useMemo(() => {
    const map = new Map<string, number>();
    const rawMap = new Map<string, DomMetaHourlyCell>();
    let m = 0;
    const candidates: Array<{ dayLabel: string; hour: number; res: number; cpr: number; spend: number }> = [];
    for (const c of cells) {
      const val = getCellVal(c);
      map.set(`${c.dayOfWeek}_${c.hour}`, val);
      rawMap.set(`${c.dayOfWeek}_${c.hour}`, c);
      if (val > m) m = val;
      const totRes = c.result ?? (c.leads + c.messages + c.purchases);
      if (totRes > 0 && c.spend > 0) {
        const dLabel = dayOrder.find((d) => d.idx === c.dayOfWeek)?.label || 'CN';
        candidates.push({
          dayLabel: dLabel,
          hour: c.hour,
          res: totRes,
          cpr: c.spend / totRes,
          spend: c.spend,
        });
      }
    }
    candidates.sort((a, b) => a.cpr - b.cpr || b.res - a.res);
    return {
      lookup: map,
      rawCellMap: rawMap,
      maxVal: Math.max(m, 1),
      goldenSlots: candidates.slice(0, 3),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, metric]);

  const isMoney = metric === 'spend' || metric === 'cpr';

  return (
    <div className="w-full min-w-0 pt-1 flex-1 flex flex-col justify-between gap-2.5">
      {/* Mobile Native 6-Block Daypart Matrix (< sm, Zero Horizontal Scroll!) */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-slate-500 font-medium truncate">
            {selectedMobileBlock
              ? `${selectedMobileBlock.dayLabel} (${selectedMobileBlock.blockLabel}): ${
                  isMoney
                    ? formatDomMoneyShort(selectedMobileBlock.val, currency)
                    : formatDomNumber(selectedMobileBlock.val)
                } · ${selectedMobileBlock.res} KQ`
              : 'Chạm ô khung giờ để xem chi tiết'}
          </span>
          <button
            type="button"
            onClick={() => setMobileFull24h((v) => !v)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 text-[10.5px] font-bold text-[#1E40FF] shrink-0 cursor-pointer dom-ios-press"
          >
            {mobileFull24h ? 'Gọn 6 khung' : 'Chi tiết 24h'}
          </button>
        </div>

        {!mobileFull24h && (
          <div className="space-y-1">
            <div className="grid grid-cols-7 gap-1 text-[9.5px] font-semibold text-slate-400 text-center">
              <div className="text-left pl-0.5">Thứ</div>
              {mobileBlocks.map((mb) => (
                <div key={mb.label} className="truncate">
                  {mb.label.replace('h', '')}
                </div>
              ))}
            </div>
            {dayOrder.map((d) => {
              const blockData = mobileBlocks.map((mb) => {
                let sumSpend = 0;
                let sumRes = 0;
                let sumMetric = 0;
                for (const h of mb.hours) {
                  const rc = rawCellMap.get(`${d.idx}_${h}`);
                  if (rc) {
                    const r = rc.result ?? (rc.leads + rc.messages + rc.purchases);
                    sumSpend += rc.spend;
                    sumRes += r;
                    if (metric !== 'cpr') sumMetric += lookup.get(`${d.idx}_${h}`) || 0;
                  }
                }
                const blockVal = metric === 'cpr' ? (sumRes > 0 ? sumSpend / sumRes : 0) : sumMetric;
                return { mb, blockVal, sumSpend, sumRes };
              });
              const maxBlock = Math.max(maxVal * 2.2, ...blockData.map((b) => b.blockVal), 1);

              return (
                <div key={d.idx} className="grid grid-cols-7 gap-1 items-center">
                  <div className="text-[11px] font-semibold text-slate-600">{d.short}</div>
                  {blockData.map(({ mb, blockVal, sumSpend, sumRes }) => {
                    const intensity = blockVal > 0 ? Math.min(1, 0.2 + (blockVal / maxBlock) * 0.8) : 0;
                    const bg =
                      blockVal > 0
                        ? metric === 'result'
                          ? `rgba(5, 150, 105, ${intensity.toFixed(2)})`
                          : `rgba(30, 64, 255, ${intensity.toFixed(2)})`
                        : '#F1F5F9';
                    return (
                      <button
                        key={mb.label}
                        type="button"
                        onClick={() =>
                          setSelectedMobileBlock({
                            dayLabel: d.label,
                            blockLabel: mb.label,
                            val: blockVal,
                            spend: sumSpend,
                            res: sumRes,
                          })
                        }
                        className="h-7 rounded-md transition-transform active:scale-95 cursor-pointer"
                        style={{ backgroundColor: bg }}
                        aria-label={`${d.label} ${mb.label}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full 24-Hour Heatmap Grid (Zero scrollbars on desktop; opt-in horizontal scroll only on mobile expand) */}
      <div
        className={`${
          mobileFull24h ? 'block overflow-x-auto sm:overflow-visible' : 'hidden sm:block overflow-visible'
        } w-full max-w-full`}
      >
        <div
          className={
            mobileFull24h
              ? 'min-w-[620px] sm:min-w-0 flex flex-col gap-1'
              : 'w-full flex flex-col gap-1'
          }
        >
        <div className="flex items-center gap-1 pl-12">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="flex-1 text-center text-[10px] font-normal text-slate-400">
              {h}
            </div>
          ))}
        </div>

        {dayOrder.map((d) => (
          <div key={d.idx} className="flex items-center gap-1">
            <div className="w-11 pr-1.5 text-right text-[11px] font-medium text-slate-600 shrink-0">
              {d.label}
            </div>
            {Array.from({ length: 24 }, (_, h) => {
              const val = lookup.get(`${d.idx}_${h}`) || 0;
              const rawC = rawCellMap.get(`${d.idx}_${h}`);
              const totRes = rawC ? (rawC.result ?? (rawC.leads + rawC.messages + rawC.purchases)) : 0;
              const intensity = val > 0 ? 0.16 + (val / maxVal) * 0.84 : 0;
              const bg =
                val > 0
                  ? metric === 'result'
                    ? `rgba(5, 150, 105, ${intensity.toFixed(2)})`
                    : `rgba(30, 64, 255, ${intensity.toFixed(2)})`
                  : '#F1F5F9';
              const fmt = isMoney ? formatDomMoney(val, currency) : formatDomNumber(val);
              const detailTip = rawC
                ? `${d.label} · ${String(h).padStart(2, '0')}:00 — ${fmt} | Spent: ${formatDomMoney(rawC.spend, currency)} | KQ: ${totRes}`
                : `${d.label} · ${h}:00 — ${fmt}`;
              return (
                <div
                  key={h}
                  title={detailTip}
                  className="flex-1 h-5 sm:h-[22px] rounded-[5px] transition-all hover:brightness-95 hover:ring-2 hover:ring-[#1E40FF]/35 cursor-pointer"
                  style={{ backgroundColor: bg }}
                />
              );
            })}
          </div>
        ))}

        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-medium text-slate-500">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {goldenSlots.slice(0, 2).map((gs, i) => (
            <span
              key={`${gs.dayLabel}-${gs.hour}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10.5px] font-semibold tabular-nums max-w-full truncate"
            >
              <Award className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">
                #{i + 1} {gs.dayLabel} {String(gs.hour).padStart(2, '0')}h: {gs.res} KQ · CPR{' '}
                {formatDomMoneyShort(gs.cpr, currency)}
              </span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <span>Ít</span>
          <div className="flex items-center gap-1">
            {[0, 0.22, 0.48, 0.75, 1].map((alpha) => (
              <span
                key={alpha}
                className="w-3 h-3 rounded-[3px]"
                style={{
                  backgroundColor:
                    alpha === 0
                      ? '#F1F5F9'
                      : metric === 'result'
                        ? `rgba(5, 150, 105, ${alpha})`
                        : `rgba(30, 64, 255, ${alpha})`,
                }}
              />
            ))}
          </div>
          <span>Nhiều</span>
        </div>
      </div>
    </div>
  );
};

export const RegionSpentBarChart: React.FC<{
  regions: Array<
    DomMetaRegionRow | { region: string; spend: number; result?: number; reach?: number; clicks?: number }
  >;
  countries?: Array<
    DomMetaRegionRow | { region: string; spend: number; result?: number; reach?: number; clicks?: number }
  >;
  currency?: string;
}> = ({ regions, countries = [], currency = 'VND' }) => {
  const [geoMode, setGeoMode] = useState<'region' | 'country'>('region');
  const [geoMetric, setGeoMetric] = useState<'spend' | 'result' | 'cpr' | 'reach'>('spend');
  const [searchQuery, setSearchQuery] = useState('');

  const hasCountries = useMemo(
    () => countries.some((c) => c.spend > 0 || Number(c.result || 0) > 0),
    [countries]
  );

  const sourceList = geoMode === 'country' && hasCountries ? countries : regions;

  const getGeoVal = (r: { spend: number; result?: number; reach?: number }) => {
    const res = Number(r.result || 0);
    if (geoMetric === 'result') return res;
    if (geoMetric === 'cpr') return res > 0 ? r.spend / res : 0;
    if (geoMetric === 'reach') return Number(r.reach || 0);
    return r.spend;
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sourceList
      .filter((r) => {
        if (r.spend <= 0 && Number(r.result || 0) <= 0) return false;
        if (!q) return true;
        return r.region.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (geoMetric === 'cpr') {
          const ca = getGeoVal(a);
          const cb = getGeoVal(b);
          if (ca > 0 && cb > 0) return ca - cb;
          if (ca > 0) return -1;
          if (cb > 0) return 1;
          return b.spend - a.spend;
        }
        return getGeoVal(b) - getGeoVal(a) || b.spend - a.spend;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceList, searchQuery, geoMetric]);

  const maxVal = Math.max(...filtered.map((r) => getGeoVal(r)), 1);
  const totalSpend = Math.max(
    sourceList.reduce((s, r) => s + r.spend, 0),
    1
  );

  if (sourceList.filter((r) => r.spend > 0 || Number(r.result || 0) > 0).length === 0) {
    return (
      <div className="flex-1 min-h-[210px] flex items-center justify-center text-xs text-slate-400">
        Chưa có dữ liệu vùng địa lý
      </div>
    );
  }

  return (
    <div className="space-y-2.5 pt-0.5 flex-1 min-h-0 flex flex-col min-w-0">
      {/* Deep Geography Controls: Max 2 compact controls horizontally + clean search */}
      <div className="flex items-center justify-between gap-2 shrink-0 min-w-0">
        {hasCountries ? (
          <button
            type="button"
            onClick={() => setGeoMode((m) => (m === 'region' ? 'country' : 'region'))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#1E40FF] text-xs font-semibold text-slate-700 cursor-pointer shrink-0 dom-ios-press"
          >
            <Globe2 className="w-3 h-3 text-[#1E40FF]" />
            <span>
              ⇄ {geoMode === 'country' ? `Quốc gia (${countries.length})` : `Tỉnh/Thành (${regions.length})`}
            </span>
          </button>
        ) : (
          <span className="text-xs font-medium text-slate-500 truncate">
            {regions.length} tỉnh/thành
          </span>
        )}

        <DomMetaSelect
          ariaLabel="Chọn chỉ số địa lý"
          value={geoMetric}
          onChange={(v) => setGeoMetric(v as 'spend' | 'result' | 'cpr' | 'reach')}
          variant="compact"
          align="right"
          options={[
            { value: 'spend', label: 'Chi tiêu (Spent)' },
            { value: 'result', label: 'Kết quả (KQ)' },
            { value: 'cpr', label: 'CPR tốt nhất' },
            { value: 'reach', label: 'Tiếp cận (Reach)' },
          ]}
        />
      </div>

      {sourceList.length > 7 && (
        <div className="relative flex items-center w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tỉnh/thành hoặc quốc gia..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/90 text-xs text-slate-700 outline-none focus:bg-white focus:border-[#1E40FF]"
          />
        </div>
      )}

      <div className="space-y-2.5 flex-1 min-h-0 max-h-[260px] lg:max-h-none overflow-y-auto pr-1">
        {filtered.map((r, idx) => {
          const val = getGeoVal(r);
          const pct = Math.max(5, Math.round((val / maxVal) * 100));
          const sharePct = ((r.spend / totalSpend) * 100).toFixed(1);
          const cleanName = r.region.replace(/\s+Province$/i, '');
          const resCount = Number(r.result || 0);
          const cpr = resCount > 0 ? r.spend / resCount : 0;
          return (
            <div key={r.region} className="space-y-1">
              <div className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-[18px] h-[18px] rounded-md text-[10px] font-bold inline-flex items-center justify-center shrink-0 ${
                      idx === 0
                        ? 'bg-[#1E40FF] text-white'
                        : idx < 3
                          ? 'bg-blue-50 text-[#1E40FF]'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-700 truncate" title={cleanName}>
                    {cleanName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                  {resCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      {formatDomNumber(resCount)} KQ · {formatDomMoneyShort(cpr, currency)}
                    </span>
                  )}
                  <span className="text-[10px] font-medium text-slate-400">{sharePct}%</span>
                  <span className="font-bold text-slate-800">
                    {geoMetric === 'reach'
                      ? `${formatDomNumber(Number(r.reach || 0))} reach`
                      : formatDomMoneyShort(r.spend, currency)}
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    idx === 0
                      ? 'bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]'
                      : idx < 3
                        ? 'bg-[#1E40FF]/75'
                        : 'bg-slate-300'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MonthlyYearBarChart: React.FC<{
  months: DomMetaMonthlyPoint[];
  metric: 'spend' | 'leads' | 'reach' | 'messages' | 'follows';
  currency?: string;
}> = ({ months, metric, currency = 'VND' }) => {
  const uid = useId().replace(/:/g, '');
  const { ref: boxRef, w: width, h: height } = useChartBoxSize(640, 240, 225);
  const maxVal = Math.max(...months.map((m) => Number(m[metric] || 0)), 1);

  const padX = 16;
  const padTop = 26;
  const padBottom = 26;
  const innerW = Math.max(260, width - padX * 2);
  const innerH = Math.max(130, height - padTop - padBottom);

  return (
    <div ref={boxRef} className="relative flex-1 w-full min-h-[225px] mt-2 select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 w-full h-full block overflow-visible"
      >
        <defs>
          <linearGradient id={`monthBar-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E40FF" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padX}
            y1={padTop + innerH * t}
            x2={width - padX}
            y2={padTop + innerH * t}
            stroke="rgba(15,23,42,0.05)"
            strokeWidth="1"
          />
        ))}
        {months.map((m, idx) => {
          const val = Number(m[metric] || 0);
          const slotW = innerW / 12;
          const bw = Math.min(32, Math.max(16, slotW * 0.54));
          const bx = padX + idx * slotW + (slotW - bw) / 2;
          const h = val > 0 ? Math.max(6, (val / (maxVal * 1.1)) * innerH) : 3;
          const by = padTop + innerH - h;
          const fmt =
            metric === 'spend' ? formatDomMoneyShort(val, currency) : formatDomNumber(val);
          return (
            <g key={m.monthKey}>
              <rect
                x={bx}
                y={by}
                width={bw}
                height={h}
                rx={6}
                fill={val > 0 ? `url(#monthBar-${uid})` : '#E2E8F0'}
              />
              {val > 0 && (
                <text
                  x={bx + bw / 2}
                  y={Math.max(14, by - 6)}
                  textAnchor="middle"
                  className="fill-slate-700 font-bold"
                  fontSize="9.5"
                >
                  {fmt}
                </text>
              )}
              <text
                x={bx + bw / 2}
                y={height - 7}
                textAnchor="middle"
                className="fill-slate-500 font-semibold"
                fontSize="10"
              >
                {m.month}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const VideoFunnelBars: React.FC<{
  impressions: number;
  video3s: number;
  thruplay: number;
  avgWatchTimeSec?: number;
  completionRate?: number;
  p25?: number;
  p50?: number;
  p75?: number;
  p95?: number;
  p100?: number;
  linkClicks: number;
}> = ({
  impressions,
  video3s,
  thruplay,
  avgWatchTimeSec = 0,
  completionRate = 0,
  p25 = 0,
  p50 = 0,
  p75 = 0,
  p95 = 0,
  p100 = 0,
  linkClicks,
}) => {
  const hookRate = impressions > 0 ? ((video3s / impressions) * 100).toFixed(1) : '0.0';
  const holdRate = video3s > 0 ? Math.min(100, (thruplay / video3s) * 100).toFixed(1) : '0.0';

  const stages = [
    { label: 'Impressions', val: impressions, sub: '100% hiển thị' },
    { label: '3s Video Views (Hook)', val: video3s, sub: `Hook ${hookRate}%` },
    ...(p25 > 0 ? [{ label: '25% Watched', val: p25, sub: 'Giữ chân 25%' }] : []),
    ...(p50 > 0 ? [{ label: '50% Watched', val: p50, sub: 'Xem nửa thời lượng' }] : []),
    { label: 'ThruPlay (Hold)', val: thruplay, sub: `Hold ${holdRate}%` },
    ...(p75 > 0 ? [{ label: '75% Watched', val: p75, sub: 'Giữ chân 75%' }] : []),
    ...(p95 > 0 ? [{ label: '95% Completed', val: p95, sub: 'Xem gần trọn' }] : []),
    ...(p100 > 0 ? [{ label: '100% Completed', val: p100, sub: 'Xem trọn vẹn' }] : []),
    { label: 'Link Clicks', val: linkClicks, sub: 'Nhấp liên kết' },
  ];
  const base = Math.max(impressions, 1);

  return (
    <div className="space-y-3 flex-1 flex flex-col justify-between">
      <div className={`grid ${avgWatchTimeSec > 0 || completionRate > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
        <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-2.5">
          <div className="text-[10.5px] font-medium text-slate-500">Hook Rate (3s/Impr)</div>
          <div className="text-lg font-extrabold text-[#1E40FF] tabular-nums">{hookRate}%</div>
        </div>
        <div className="rounded-xl bg-cyan-50/80 border border-cyan-100 p-2.5">
          <div className="text-[10.5px] font-medium text-slate-500">Hold Rate (ThruPlay/3s)</div>
          <div className="text-lg font-extrabold text-sky-700 tabular-nums">{holdRate}%</div>
        </div>
        {(avgWatchTimeSec > 0 || completionRate > 0) && (
          <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 p-2.5">
            <div className="text-[10.5px] font-medium text-slate-500">
              {avgWatchTimeSec > 0 ? 'Avg Watch Time' : 'Completion'}
            </div>
            <div className="text-lg font-extrabold text-emerald-700 tabular-nums">
              {avgWatchTimeSec > 0
                ? `${avgWatchTimeSec.toFixed(1)}s`
                : `${completionRate.toFixed(1)}%`}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {stages.map((st, idx) => {
          const widthPct = Math.max(7, Math.min(100, Math.round((st.val / base) * 100)));
          return (
            <div key={st.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-semibold text-slate-700 truncate">{st.label}</span>
                <span className="font-bold text-slate-800 tabular-nums shrink-0">
                  {formatDomNumber(st.val)}{' '}
                  <span className="text-[10px] font-normal text-slate-400">({st.sub})</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]"
                  style={{
                    width: `${idx === 0 ? 100 : widthPct}%`,
                    opacity: Math.max(0.45, 1 - idx * 0.08),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Deep User Behavioral & Conversion Funnel Card (Impressions -> Reach -> Clicks -> Link/Outbound -> LPV -> Intent -> Conversion + Messaging Depth & Social/Ecom micro-signals) */
export const UserBehaviorFunnelCard: React.FC<{
  metrics: {
    spend: number;
    impressions: number;
    reach: number;
    frequency?: number;
    clicks: number;
    unique_clicks?: number;
    ctr?: number;
    unique_ctr?: number;
    link_click: number;
    outbound_click?: number;
    lpv?: number;
    lpv_rate?: number;
    cost_per_lpv?: number;
    leads: number;
    messages: number;
    message_connection?: number;
    msg_reply?: number;
    msg_depth_2?: number;
    msg_depth_3?: number;
    view_content?: number;
    add_to_cart?: number;
    initiate_checkout?: number;
    purchases: number;
    purchase_value?: number;
    aov?: number;
    roas?: number;
    reaction?: number;
    comments?: number;
    shares?: number;
    post_save?: number;
    photo_view?: number;
    follows?: number;
    result?: number;
  };
  currency?: string;
  compact?: boolean;
}> = ({ metrics, currency = 'VND', compact = false }) => {
  const impr = Math.max(metrics.impressions || 0, 0);
  const reach = Math.max(metrics.reach || 0, 0);
  const freq = metrics.frequency || (reach > 0 ? impr / reach : 0);
  const clicks = Math.max(metrics.clicks || 0, 0);
  const uniqClicks = Math.max(metrics.unique_clicks || 0, 0);
  const linkClick = Math.max(metrics.link_click || 0, 0);
  const outbound = Math.max(metrics.outbound_click || 0, 0);
  const lpv = Math.max(metrics.lpv || 0, 0);
  const lpvRate =
    metrics.lpv_rate || (linkClick > 0 && lpv > 0 ? Math.min(100, (lpv / linkClick) * 100) : 0);
  const directConversions =
    (metrics.leads || 0) + (metrics.messages || 0) + (metrics.purchases || 0);
  const intentCount = Math.max(
    directConversions + (metrics.add_to_cart || 0) + (metrics.initiate_checkout || 0),
    0
  );
  // Keep final conversion step grounded to genuine conversion actions (Leads/Messages/Purchases)
  // rather than high-volume Awareness/ThruPlay view counts so the funnel always tapers properly.
  const rawMetricRes = Math.max(metrics.result || 0, 0);
  const finalConv =
    directConversions > 0
      ? directConversions
      : rawMetricRes > 0 && (impr === 0 || rawMetricRes <= Math.max(clicks, linkClick, 1000))
        ? rawMetricRes
        : intentCount;
  const cpr = finalConv > 0 ? metrics.spend / finalConv : 0;
  const clickToConvRate =
    linkClick > 0 && finalConv > 0 ? Math.min(100, (finalConv / linkClick) * 100) : 0;
  const showStandaloneLpv = lpv > 0 && (lpv >= finalConv || finalConv === 0);

  const rawFunnelSteps = [
    {
      label: 'Hiển thị (Impressions)',
      val: impr,
      badge: freq > 0 ? `Freq ${freq.toFixed(2)}x` : '100%',
      color: 'from-slate-700 to-slate-500',
    },
    {
      label: 'Tiếp cận (Reach)',
      val: reach,
      badge: impr > 0 ? `${Math.min(100, (reach / impr) * 100).toFixed(1)}% Impr` : '—',
      color: 'from-[#1E40FF] to-blue-500',
    },
    {
      label:
        uniqClicks > 0
          ? `Lượt nhấp (${formatDomNumber(uniqClicks)} người)`
          : 'Lượt nhấp (Clicks)',
      val: clicks,
      badge: `CTR ${(metrics.ctr || (impr > 0 ? (clicks / impr) * 100 : 0)).toFixed(2)}%`,
      color: 'from-blue-600 to-sky-500',
    },
    {
      label: outbound > 0 ? `Link Click (${formatDomNumber(outbound)} Outbound)` : 'Link Clicks',
      val: linkClick,
      badge:
        clicks > 0
          ? `${Math.min(100, (linkClick / clicks) * 100).toFixed(1)}% Click${
              !showStandaloneLpv && lpv > 0 ? ` · ${formatDomNumber(lpv)} LPV` : ''
            }`
          : '—',
      color: 'from-sky-600 to-cyan-500',
    },
    ...(showStandaloneLpv
      ? [
          {
            label: 'Xem trang đích (LPV)',
            val: lpv,
            badge: `Connect ${lpvRate.toFixed(1)}% · ${formatDomMoneyShort(
              metrics.cost_per_lpv || metrics.spend / lpv,
              currency
            )}`,
            color: 'from-cyan-600 to-teal-500',
          },
        ]
      : []),
    {
      label:
        directConversions > 0
          ? `Chuyển đổi (${[
              (metrics.leads || 0) > 0 ? `${formatDomNumber(metrics.leads)} Lead` : '',
              (metrics.messages || 0) > 0 ? `${formatDomNumber(metrics.messages)} Mess` : '',
              (metrics.purchases || 0) > 0 ? `${formatDomNumber(metrics.purchases)} Đơn` : '',
            ]
              .filter(Boolean)
              .join(' · ')})`
          : 'Chuyển đổi / Kết quả',
      val: finalConv,
      badge:
        finalConv > 0
          ? `${clickToConvRate > 0 ? `${clickToConvRate.toFixed(1)}% Click · ` : ''}CPR ${formatDomMoneyShort(cpr, currency)}`
          : '0 KQ',
      color: 'from-emerald-600 to-emerald-400',
    },
  ];

  // Compute strictly monotonically tapering funnel bar widths anchored to step conversion ratio
  const topFunnelVal = Math.max(rawFunnelSteps[0]?.val || 0, 1);
  let prevBarWidth = 100;
  const funnelSteps = rawFunnelSteps.map((step, idx) => {
    if (idx === 0) {
      prevBarWidth = step.val > 0 ? 100 : 12;
      return { ...step, pctOfTop: prevBarWidth };
    }
    if (step.val <= 0) {
      prevBarWidth = Math.max(8, prevBarWidth - 12);
      return { ...step, pctOfTop: 6 };
    }
    const logScaled = (Math.log10(1 + (step.val / topFunnelVal) * 999) / 3) * 100;
    const stepCeiling = Math.max(12, prevBarWidth - 11);
    const stepFloor = Math.max(10, Math.round(stepCeiling * 0.58));
    const widthPct = Math.round(Math.max(stepFloor, Math.min(stepCeiling, logScaled)));
    prevBarWidth = widthPct;
    return { ...step, pctOfTop: widthPct };
  });

  const microSignals = [
    { label: 'Tin nhắn mới', val: metrics.messages || 0, dot: 'bg-blue-500' },
    { label: 'Kết nối Mess', val: metrics.message_connection || 0, dot: 'bg-blue-500' },
    { label: 'Phản hồi đầu', val: metrics.msg_reply || 0, dot: 'bg-cyan-500' },
    { label: 'Hội thoại 2+ câu', val: metrics.msg_depth_2 || 0, dot: 'bg-cyan-500' },
    { label: 'Hội thoại sâu 3+', val: metrics.msg_depth_3 || 0, dot: 'bg-indigo-500' },
    { label: 'Leads (Form/Web)', val: metrics.leads || 0, dot: 'bg-emerald-500' },
    { label: 'Xem sản phẩm', val: metrics.view_content || 0, dot: 'bg-violet-500' },
    { label: 'Thêm giỏ hàng', val: metrics.add_to_cart || 0, dot: 'bg-violet-500' },
    { label: 'Bắt đầu thanh toán', val: metrics.initiate_checkout || 0, dot: 'bg-amber-500' },
    { label: 'Đơn mua', val: metrics.purchases || 0, dot: 'bg-emerald-600' },
    { label: 'Cảm xúc (Reaction)', val: metrics.reaction || 0, dot: 'bg-sky-500' },
    { label: 'Bình luận', val: metrics.comments || 0, dot: 'bg-sky-500' },
    { label: 'Chia sẻ', val: metrics.shares || 0, dot: 'bg-indigo-400' },
    { label: 'Lưu bài', val: metrics.post_save || 0, dot: 'bg-indigo-400' },
    { label: 'Xem ảnh', val: metrics.photo_view || 0, dot: 'bg-slate-400' },
    { label: 'Theo dõi trang', val: metrics.follows || 0, dot: 'bg-emerald-400' },
  ].filter((s) => s.val > 0);

  return (
    <div
      data-testid="user-behavior-funnel-card"
      className={compact ? 'space-y-3.5' : 'grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch'}
    >
      {/* Journey Funnel Bars (~60% on wide detail view) */}
      <div
        className={
          compact
            ? 'space-y-2'
            : 'lg:col-span-7 rounded-2xl bg-[#F8FAFC]/80 border border-slate-200/75 p-4 flex flex-col justify-between gap-2.5'
        }
      >
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 pb-0.5 shrink-0">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 min-w-0 truncate">
            <TrendingUp className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
            <span className="truncate">Hành trình chuyển đổi</span>
          </span>
          {metrics.unique_ctr && metrics.unique_ctr > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[#1E40FF] text-[10.5px] font-bold tabular-nums whitespace-nowrap shrink-0">
              Unique CTR {metrics.unique_ctr.toFixed(2)}%
            </span>
          ) : null}
        </div>

        <div className={compact ? 'space-y-1.5' : 'space-y-2 flex-1 flex flex-col justify-between'}>
          {funnelSteps.map((step) => (
            <div
              key={step.label}
              className="rounded-xl bg-white border border-slate-200/70 px-3 py-2 space-y-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
            >
              <div className="flex items-center justify-between gap-2 text-xs min-w-0">
                <span className="font-semibold text-slate-700 leading-tight">{step.label}</span>
                <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-slate-600 text-[10px] font-semibold whitespace-nowrap">
                    {step.badge}
                  </span>
                  <strong className="text-[12.5px] font-extrabold text-slate-900">
                    {formatDomNumber(step.val)}
                  </strong>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100/90 overflow-hidden flex justify-start p-[1px]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${step.color} transition-all duration-300`}
                  style={{ width: `${Math.max(4, Math.round(step.pctOfTop))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deep User Micro-Behaviors (~40% balanced equal-height card on wide view) */}
      <div
        className={`${
          compact ? '' : 'lg:col-span-5'
        } rounded-2xl bg-[#F8FAFC] border border-slate-200/75 p-4 flex flex-col gap-3`}
      >
        <div className="flex items-center justify-between gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Hành vi tương tác chi tiết</span>
          </span>
          {(metrics.purchase_value || 0) > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 text-[10.5px] font-extrabold tabular-nums whitespace-nowrap">
              Doanh thu {formatDomMoneyShort(metrics.purchase_value || 0, currency)} · ROAS{' '}
              {(metrics.roas || 0).toFixed(2)}x
            </span>
          )}
        </div>

        {microSignals.length > 0 ? (
          <div
            className={`grid gap-2 ${
              compact
                ? 'grid-cols-2 sm:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2 content-start flex-1'
            }`}
          >
            {microSignals.map((sig) => (
              <div
                key={sig.label}
                className="rounded-xl bg-white border border-slate-200/80 px-3 py-2.5 flex items-center justify-between gap-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
              >
                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-slate-600 min-w-0 leading-tight">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${sig.dot}`} />
                  <span>{sig.label}</span>
                </span>
                <strong className="text-xs font-extrabold text-slate-900 tabular-nums shrink-0">
                  {formatDomNumber(sig.val)}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400 text-center py-6">
            Chưa ghi nhận hành vi tương tác vi mô trong giai đoạn này
          </div>
        )}
      </div>
    </div>
  );
};

const GADS_PALETTE = [
  '#1E40FF',
  '#06B6D4',
  '#0284C7',
  '#10B981',
  '#6366F1',
  '#0EA5E9',
  '#334155',
  '#94A3B8',
];

export type DomGoogleAdsDimMetric = 'click' | 'cost' | 'imp' | 'conv' | 'cpc';

function getGoogleAdsBucketVal(b: DomGoogleAdsDimBucket, metric: DomGoogleAdsDimMetric): number {
  if (metric === 'cpc') return b.click > 0 ? b.cost / b.click : 0;
  return b[metric] || 0;
}

function formatGoogleAdsDimVal(val: number, metric: DomGoogleAdsDimMetric): string {
  if (metric === 'cost' || metric === 'cpc') return formatDomMoneyShort(val, 'VND');
  return formatDomNumber(val);
}

export const GoogleAdsCampaignDonutCard: React.FC<{
  campaigns: Array<{ campaign: string; spent: number }>;
}> = ({ campaigns }) => {
  const top = useMemo(
    () =>
      [...campaigns]
        .filter((c) => c.spent > 0)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 8),
    [campaigns]
  );

  const total = useMemo(() => top.reduce((s, c) => s + c.spent, 0), [top]);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;

  if (top.length === 0 || total <= 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
        Chưa có dữ liệu chi tiêu theo chiến dịch Google Ads
      </div>
    );
  }

  const topPct = ((top[0].spent / total) * 100).toFixed(1);
  const arcs = top.reduce<{
    offset: number;
    items: Array<{ key: string; len: number; offset: number; color: string; name: string; spent: number }>;
  }>(
    (acc, item, idx) => {
      const len = (item.spent / total) * circumference;
      acc.items.push({
        key: `${item.campaign}-${idx}`,
        len,
        offset: acc.offset,
        color: GADS_PALETTE[idx % GADS_PALETTE.length],
        name: item.campaign,
        spent: item.spent,
      });
      acc.offset += len;
      return acc;
    },
    { offset: 0, items: [] }
  ).items;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-1">
      <div className="sm:col-span-5 flex items-center justify-center">
        <div className="relative w-[164px] h-[164px] flex items-center justify-center">
          <svg viewBox="0 0 164 164" className="w-full h-full -rotate-90">
            <circle cx="82" cy="82" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="20" />
            {arcs.map((arc) => (
              <circle
                key={arc.key}
                cx="82"
                cy="82"
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth="20"
                strokeDasharray={`${arc.len} ${circumference}`}
                strokeDashoffset={-arc.offset}
              >
                <title>
                  {`${arc.name}: ${formatDomMoney(arc.spent, 'VND')} (${((arc.spent / total) * 100).toFixed(1)}%)`}
                </title>
              </circle>
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
            <span className="text-lg font-bold text-slate-800 tabular-nums">{topPct}%</span>
            <span className="text-[10.5px] font-medium text-slate-500 truncate max-w-[100px]">
              {top[0].campaign}
            </span>
          </div>
        </div>
      </div>

      <div className="sm:col-span-7 space-y-2 max-h-[210px] overflow-y-auto pr-1">
        {arcs.map((arc) => {
          const pct = ((arc.spent / total) * 100).toFixed(1);
          return (
            <div
              key={arc.key}
              className="rounded-xl bg-slate-50/90 border border-slate-100 px-3 py-2 flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: arc.color }}
                />
                <span className="font-medium text-slate-700 truncate" title={arc.name}>
                  {arc.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 tabular-nums">
                <span className="text-[11px] font-normal text-slate-500">
                  {formatDomMoneyShort(arc.spent, 'VND')}
                </span>
                <strong className="font-semibold text-slate-800">{pct}%</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const GoogleAdsHourlyBarChart: React.FC<{
  slots: DomGoogleAdsHourlySlot[];
  metric: DomGoogleAdsDimMetric;
}> = ({ slots, metric }) => {
  const uid = useId().replace(/:/g, '');
  const { ref: boxRef, w: width, h: height } = useChartBoxSize(820, 205, 185);
  const values = useMemo(
    () =>
      slots.map((s) => {
        if (metric === 'cpc') return s.click > 0 ? s.spent / s.click : 0;
        if (metric === 'cost') return s.spent;
        if (metric === 'imp') return s.imp;
        if (metric === 'conv') return s.conv;
        return s.click;
      }),
    [slots, metric]
  );

  const maxVal = Math.max(...values, 1);
  const hasAny = values.some((v) => v > 0);
  const peakIdx = values.indexOf(maxVal);

  if (!hasAny) {
    return (
      <div className="h-[195px] flex items-center justify-center text-xs text-slate-400">
        Chưa có dữ liệu phân bổ theo khung giờ (hourly) trong kỳ này
      </div>
    );
  }

  const padX = 12;
  const padTop = 24;
  const padBottom = 26;
  const innerW = Math.max(240, width - padX * 2);
  const innerH = Math.max(115, height - padTop - padBottom);
  const slotW = innerW / 24;
  const bw = Math.min(26, Math.max(7, slotW * 0.62));

  return (
    <div ref={boxRef} className="relative w-full h-[190px] sm:h-[205px] min-w-0 pt-1 select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 w-full h-full block overflow-visible"
      >
        <defs>
          <linearGradient id={`gadsHourPeak-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E40FF" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id={`gadsHourBar-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.65" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padX}
            y1={padTop + innerH * t}
            x2={width - padX}
            y2={padTop + innerH * t}
            stroke="rgba(15,23,42,0.045)"
            strokeWidth="1"
          />
        ))}

        {slots.map((slot, idx) => {
          const val = values[idx] || 0;
          const bx = padX + idx * slotW + (slotW - bw) / 2;
          const h = val > 0 ? Math.max(5, (val / (maxVal * 1.15)) * innerH) : 3;
          const by = padTop + innerH - h;
          const isPeak = idx === peakIdx && val > 0;
          const fmt = formatGoogleAdsDimVal(val, metric);
          const showLabel = val > 0 && (isPeak || (width >= 520 ? idx % 3 === 0 : idx % 4 === 0));
          const showHour = width >= 460 ? idx % 2 === 0 : idx % 4 === 0;
          return (
            <g key={slot.hour}>
              <title>{`${slot.hour}:00 — ${fmt}`}</title>
              <path
                d={roundedTopBarPath(bx, by, bw, h, 4)}
                fill={
                  val <= 0
                    ? '#E2E8F0'
                    : isPeak
                      ? `url(#gadsHourPeak-${uid})`
                      : `url(#gadsHourBar-${uid})`
                }
              />
              {showLabel && (
                <text
                  x={bx + bw / 2}
                  y={Math.max(13, by - 5)}
                  textAnchor="middle"
                  className={isPeak ? 'fill-[#1E40FF] font-bold' : 'fill-slate-600 font-semibold'}
                  fontSize="9"
                >
                  {fmt}
                </text>
              )}
              {showHour && (
                <text
                  x={bx + bw / 2}
                  y={height - 7}
                  textAnchor="middle"
                  className="fill-slate-500 font-medium"
                  fontSize="9.5"
                >
                  {slot.hour}h
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const GoogleAdsChannelCard: React.FC<{
  channels: DomGoogleAdsDimBucket[];
  metric: DomGoogleAdsDimMetric;
}> = ({ channels, metric }) => {
  const sorted = useMemo(
    () =>
      [...channels].sort(
        (a, b) => getGoogleAdsBucketVal(b, metric) - getGoogleAdsBucketVal(a, metric)
      ),
    [channels, metric]
  );

  const totalClicks = useMemo(
    () => sorted.reduce((acc, c) => acc + (c.click || 0), 0),
    [sorted]
  );
  const totalCost = useMemo(
    () => sorted.reduce((acc, c) => acc + (c.cost || 0), 0),
    [sorted]
  );

  if (sorted.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">
        Chưa có dữ liệu phân bổ kênh quảng cáo (Search / PMAX / YouTube / Display)
      </div>
    );
  }

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const shareBase = totalClicks > 0 ? totalClicks : Math.max(totalCost, 1);
  const getShareSource = (c: DomGoogleAdsDimBucket) => (totalClicks > 0 ? c.click : c.cost);

  const arcs = sorted.reduce<{
    offset: number;
    items: Array<{ bucket: DomGoogleAdsDimBucket; len: number; offset: number; color: string; pct: string }>;
  }>(
    (acc, bucket, idx) => {
      const shareVal = getShareSource(bucket);
      const len = (shareVal / shareBase) * circumference;
      acc.items.push({
        bucket,
        len,
        offset: acc.offset,
        color: GADS_PALETTE[idx % GADS_PALETTE.length],
        pct: ((shareVal / shareBase) * 100).toFixed(1),
      });
      acc.offset += len;
      return acc;
    },
    { offset: 0, items: [] }
  ).items;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-1">
      <div className="sm:col-span-7 space-y-2 max-h-[210px] overflow-y-auto pr-1">
        {arcs.map((item) => (
          <div
            key={item.bucket.key}
            className="rounded-xl bg-slate-50/90 border border-slate-100 px-3.5 py-2.5 flex items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <GoogleChannelLogo channel={item.bucket.key} />
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {item.bucket.key}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pl-[34px] mt-0.5 tabular-nums">
                {item.pct}% tỷ trọng · {formatDomMoneyShort(item.bucket.cost, 'VND')}
              </div>
            </div>
            <div className="text-sm font-semibold text-slate-700 tabular-nums shrink-0">
              {formatGoogleAdsDimVal(getGoogleAdsBucketVal(item.bucket, metric), metric)}
            </div>
          </div>
        ))}
      </div>

      <div className="sm:col-span-5 flex items-center justify-center">
        <div className="relative w-[148px] h-[148px] flex items-center justify-center">
          <svg viewBox="0 0 148 148" className="w-full h-full -rotate-90">
            <circle cx="74" cy="74" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="18" />
            {arcs.map((item) => (
              <circle
                key={item.bucket.key}
                cx="74"
                cy="74"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="18"
                strokeDasharray={`${item.len} ${circumference}`}
                strokeDashoffset={-item.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3 pointer-events-none">
            <span className="text-base font-bold text-slate-800 tabular-nums">
              {arcs[0]?.pct || '0.0'}%
            </span>
            <span className="text-[10px] font-medium text-slate-500 truncate max-w-[92px]">
              {arcs[0]?.bucket.key || ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GoogleAdsLocationBarChart: React.FC<{
  locations: DomGoogleAdsDimBucket[];
  metric: DomGoogleAdsDimMetric;
}> = ({ locations, metric }) => {
  const top = useMemo(
    () =>
      [...locations]
        .sort((a, b) => getGoogleAdsBucketVal(b, metric) - getGoogleAdsBucketVal(a, metric))
        .filter((x) => getGoogleAdsBucketVal(x, metric) > 0)
        .slice(0, 8),
    [locations, metric]
  );

  const maxVal = Math.max(...top.map((x) => getGoogleAdsBucketVal(x, metric)), 1);

  if (top.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">
        Chưa có dữ liệu vị trí địa lý (Locations) từ Google Ads
      </div>
    );
  }

  return (
    <div className="space-y-2.5 pt-1 max-h-[215px] overflow-y-auto pr-1">
      {top.map((loc, idx) => {
        const val = getGoogleAdsBucketVal(loc, metric);
        const pct = Math.max(6, Math.round((val / maxVal) * 100));
        return (
          <div key={loc.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="font-medium text-slate-700 truncate">
                {idx + 1}. {loc.key}
              </span>
              <span className="font-semibold text-slate-800 tabular-nums shrink-0">
                {formatGoogleAdsDimVal(val, metric)}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  idx === 0
                    ? 'bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]'
                    : idx < 3
                      ? 'bg-[#1E40FF]/75'
                      : 'bg-slate-300'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
