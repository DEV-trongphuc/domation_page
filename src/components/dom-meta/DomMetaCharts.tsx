import React, { useId, useMemo, useState } from 'react';
import {
  Eye,
  MessageCircle,
  MousePointerClick,
  Play,
  ShoppingBag,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  formatDomMoney,
  formatDomMoneyShort,
  formatDomNumber,
  type DomGoogleAdsDimBucket,
  type DomGoogleAdsHourlySlot,
  type DomMetaAgeGenderBucket,
  type DomMetaDailyPoint,
  type DomMetaHourlyCell,
  type DomMetaMonthlyPoint,
  type DomMetaPlatformSlice,
  type DomMetaPositionSlice,
  type DomMetaRegionRow,
} from './domMetaTypes';

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

export const DailyTrendAreaChart: React.FC<{
  data: DomMetaDailyPoint[];
  metric: 'spend' | 'impressions' | 'reach' | 'clicks' | 'leads' | 'messages' | 'follows' | 'cpm';
  currency?: string;
}> = ({ data, metric, currency = 'VND' }) => {
  const uid = useId().replace(/:/g, '');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 560;
  const height = 240;
  const padLeft = 24;
  const padRight = 24;
  const padTop = 34;
  const padBottom = 34;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const values = useMemo(
    () => data.map((d) => Number(d[metric] || 0)),
    [data, metric]
  );
  const maxVal = Math.max(...values, 1);

  const coords = useMemo(() => {
    if (data.length === 0) return [];
    return data.map((d, idx) => {
      const x =
        data.length === 1
          ? padLeft + innerW / 2
          : padLeft + (idx / (data.length - 1)) * innerW;
      const ratio = Number(d[metric] || 0) / (maxVal * 1.12);
      const y = padTop + innerH - ratio * innerH;
      return { x, y, raw: Number(d[metric] || 0), date: d.date };
    });
  }, [data, metric, maxVal, innerW, innerH]);

  const formatVal = (v: number) =>
    metric === 'spend' || metric === 'cpm'
      ? formatDomMoneyShort(v, currency)
      : formatDomNumber(v);

  if (coords.length === 0) {
    return (
      <div className="h-[230px] flex items-center justify-center text-xs text-slate-400">
        Chưa có dữ liệu theo ngày trong khoảng thời gian này
      </div>
    );
  }

  const linePath = buildSmoothLinePath(coords);
  const baselineY = padTop + innerH;
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${baselineY} L ${coords[0].x.toFixed(1)} ${baselineY} Z`;
  const labelStep = coords.length <= 10 ? 1 : Math.ceil(coords.length / 8);

  return (
    <div className="relative w-full select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[235px] overflow-visible">
        <defs>
          <linearGradient id={`domArea-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E40FF" stopOpacity="0.18" />
            <stop offset="65%" stopColor="#06B6D4" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#1E40FF" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id={`domStroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1E40FF" />
            <stop offset="60%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>

        {/* Subtle horizontal + vertical grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const gy = padTop + innerH * t;
          return (
            <line
              key={t}
              x1={padLeft}
              y1={gy}
              x2={width - padRight}
              y2={gy}
              stroke="rgba(15,23,42,0.045)"
              strokeWidth="1"
            />
          );
        })}
        {coords.map((pt, idx) =>
          idx % labelStep === 0 ? (
            <line
              key={`vg-${pt.date}`}
              x1={pt.x}
              y1={padTop}
              x2={pt.x}
              y2={baselineY}
              stroke="rgba(15,23,42,0.035)"
              strokeWidth="1"
            />
          ) : null
        )}

        <path d={areaPath} fill={`url(#domArea-${uid})`} />
        <path
          d={linePath}
          fill="none"
          stroke={`url(#domStroke-${uid})`}
          strokeWidth="2.6"
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
              <circle cx={pt.x} cy={pt.y} r={12} fill="transparent" />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 5.2 : 3.8}
                fill="#1E40FF"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              {showLabel && pt.raw > 0 && (
                <text
                  x={pt.x}
                  y={Math.max(14, pt.y - 11)}
                  textAnchor="middle"
                  className="fill-slate-600 font-medium"
                  fontSize="10"
                >
                  {formatVal(pt.raw)}
                </text>
              )}
              {(idx % labelStep === 0 || idx === coords.length - 1) && (
                <text
                  x={pt.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-slate-500 font-normal"
                  fontSize="9.5"
                >
                  {pt.date}
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
  items: Array<{ label: string; spend: number }>;
  currency?: string;
}> = ({ items, currency = 'VND' }) => {
  const uid = useId().replace(/:/g, '');
  const sorted = useMemo(
    () => [...items].filter((x) => x.spend > 0).sort((a, b) => b.spend - a.spend).slice(0, 5),
    [items]
  );
  const maxVal = Math.max(...sorted.map((x) => x.spend), 1);

  if (sorted.length === 0) {
    return (
      <div className="h-[230px] flex items-center justify-center text-xs text-slate-400">
        Chưa có dữ liệu phân bổ mục tiêu chiến dịch
      </div>
    );
  }

  return (
    <div className="h-[235px] flex flex-col justify-end pt-4 pb-1 px-2 select-none">
      <svg viewBox="0 0 360 210" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={`goalPrimary-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E40FF" />
            <stop offset="65%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
          <linearGradient id={`goalMuted-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={12}
            y1={24 + 154 * t}
            x2={348}
            y2={24 + 154 * t}
            stroke="rgba(15,23,42,0.045)"
            strokeWidth="1"
          />
        ))}

        {sorted.map((item, idx) => {
          const slotW = 336 / sorted.length;
          const barW = Math.min(72, slotW * 0.62);
          const x = 12 + idx * slotW + (slotW - barW) / 2;
          const h = Math.max(6, (item.spend / (maxVal * 1.12)) * 154);
          const y = 24 + 154 - h;
          return (
            <g key={item.label}>
              <path
                d={roundedTopBarPath(x, y, barW, h, 7)}
                fill={idx === 0 ? `url(#goalPrimary-${uid})` : `url(#goalMuted-${uid})`}
              />
              <text
                x={x + barW / 2}
                y={Math.max(15, y - 8)}
                textAnchor="middle"
                className="fill-slate-700 font-semibold"
                fontSize="10.5"
              >
                {formatDomMoneyShort(item.spend, currency)}
              </text>
              <text
                x={x + barW / 2}
                y={196}
                textAnchor="middle"
                className="fill-slate-500 font-medium uppercase"
                fontSize="8.5"
              >
                {item.label.length > 16 ? `${item.label.slice(0, 15)}…` : item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const SpentPlatformDonutCard: React.FC<{
  platforms: DomMetaPlatformSlice[];
  positions: DomMetaPositionSlice[];
  currency?: string;
}> = ({ platforms, positions, currency = 'VND' }) => {
  const uid = useId();
  const [showPositions, setShowPositions] = useState(false);

  const totalSpend = useMemo(
    () => platforms.reduce((acc, p) => acc + p.spend, 0),
    [platforms]
  );

  const fb = platforms.find((p) => p.platform === 'Facebook')?.spend || 0;
  const ig = platforms.find((p) => p.platform === 'Instagram')?.spend || 0;
  const other = platforms.find((p) => p.platform === 'Other Platform')?.spend || 0;

  const dominant = useMemo(() => {
    const arr = [
      { name: 'Facebook', val: fb, color: '#1E40FF' },
      { name: 'Instagram', val: ig, color: '#06B6D4' },
      { name: 'Other', val: other, color: '#CBD5E1' },
    ].sort((a, b) => b.val - a.val);
    return arr[0];
  }, [fb, ig, other]);

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const fbLen = totalSpend > 0 ? (fb / totalSpend) * circumference : circumference;
  const igLen = totalSpend > 0 ? (ig / totalSpend) * circumference : 0;
  const otherLen = Math.max(0, circumference - fbLen - igLen);
  const domPct = totalSpend > 0 ? ((dominant.val / totalSpend) * 100).toFixed(1) : '0.0';

  if (showPositions) {
    const maxPos = Math.max(...positions.map((p) => p.spend), 1);
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <span className="w-2 h-2 rounded-full bg-[#1E40FF]" />
            <span>Platform Positions</span>
          </div>
          <button
            type="button"
            onClick={() => setShowPositions(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#1E40FF] text-xs font-medium text-slate-700 transition-colors cursor-pointer"
          >
            <span>⇄ Platforms</span>
          </button>
        </div>
        <div className="space-y-2.5 max-h-[225px] overflow-y-auto pr-1">
          {positions.slice(0, 8).map((pos) => {
            const pct = Math.max(4, Math.round((pos.spend / maxPos) * 100));
            return (
              <div key={pos.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 truncate max-w-[62%] capitalize">
                    {pos.label}
                  </span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {formatDomMoney(pos.spend, currency)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#1E40FF]" />
          <span>Spent Platform</span>
        </div>
        <button
          type="button"
          onClick={() => setShowPositions(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#1E40FF] text-xs font-medium text-slate-700 transition-colors cursor-pointer"
        >
          <span>⇄ Details</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center flex-1">
        <div className="space-y-2.5">
          {[
            {
              name: 'Facebook',
              spend: fb,
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="11" fill="#1877F2" />
                  <path
                    d="M14.7 13.4l.42-2.7h-2.6V8.95c0-.74.36-1.46 1.52-1.46H15.2V5.2s-1.07-.18-2.1-.18c-2.14 0-3.54 1.3-3.54 3.65v2.03H7.2v2.7h2.36V21a9.4 9.4 0 0 0 2.96 0v-7.6h2.18Z"
                    fill="#FFFFFF"
                  />
                </svg>
              ),
            },
            {
              name: 'Instagram',
              spend: ig,
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
                  <defs>
                    <linearGradient id={`ig-plat-${uid}`} x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#F58529" />
                      <stop offset="35%" stopColor="#DD2A7B" />
                      <stop offset="70%" stopColor="#8134AF" />
                      <stop offset="100%" stopColor="#515BD4" />
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="6" fill={`url(#ig-plat-${uid})`} />
                  <rect x="6.2" y="6.2" width="11.6" height="11.6" rx="3.4" stroke="#FFFFFF" strokeWidth="1.6" fill="none" />
                  <circle cx="12" cy="12" r="2.7" stroke="#FFFFFF" strokeWidth="1.6" fill="none" />
                  <circle cx="15.7" cy="8.3" r="0.9" fill="#FFFFFF" />
                </svg>
              ),
            },
            {
              name: 'Other Platform',
              spend: other,
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10.5" fill="#0F172A" />
                  <path
                    d="M7.2 9.4c-1.5 0-2.6 1.5-2.6 3.3 0 1.5.9 2.5 2.1 2.5 1 0 1.8-.7 2.8-2.2l.7-1 .7 1c1 1.5 1.8 2.2 2.8 2.2 1.2 0 2.1-1 2.1-2.5 0-1.8-1.1-3.3-2.6-3.3-1.1 0-2 .8-3 2.2-.9-1.4-1.9-2.2-3-2.2Z"
                    stroke="#FFFFFF"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              ),
            },
          ].map((item) => (
            <div
              key={item.name}
              className="rounded-xl bg-slate-50/90 border border-slate-100 px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2 mb-1">
                {item.icon}
                <span className="text-xs font-medium text-slate-600">{item.name}</span>
              </div>
              <div className="text-sm font-semibold text-slate-700 tabular-nums">
                {formatDomMoney(item.spend, currency)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center">
          <div className="relative w-[172px] h-[172px] flex items-center justify-center">
            <svg viewBox="0 0 172 172" className="w-full h-full -rotate-90">
              <circle
                cx="86"
                cy="86"
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="22"
              />
              {totalSpend > 0 && (
                <>
                  <circle
                    cx="86"
                    cy="86"
                    r={radius}
                    fill="none"
                    stroke="#1E40FF"
                    strokeWidth="22"
                    strokeDasharray={`${fbLen} ${circumference}`}
                    strokeDashoffset="0"
                  />
                  {igLen > 0 && (
                    <circle
                      cx="86"
                      cy="86"
                      r={radius}
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="22"
                      strokeDasharray={`${igLen} ${circumference}`}
                      strokeDashoffset={-fbLen}
                    />
                  )}
                  {otherLen > 0 && (
                    <circle
                      cx="86"
                      cy="86"
                      r={radius}
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="22"
                      strokeDasharray={`${otherLen} ${circumference}`}
                      strokeDashoffset={-(fbLen + igLen)}
                    />
                  )}
                </>
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-lg font-bold text-slate-800 tabular-nums">{domPct}%</span>
              <span className="text-[11px] font-normal text-slate-500">{dominant.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AgeGenderBarChart: React.FC<{
  buckets: DomMetaAgeGenderBucket[];
  ageOnly: boolean;
  currency?: string;
}> = ({ buckets, ageOnly, currency = 'VND' }) => {
  const uid = useId().replace(/:/g, '');

  const peakAge = useMemo(() => {
    let best = '';
    let max = -1;
    for (const b of buckets) {
      if (b.totalSpend > max) {
        max = b.totalSpend;
        best = b.age;
      }
    }
    return best;
  }, [buckets]);

  const maxBar = useMemo(() => {
    if (ageOnly) return Math.max(...buckets.map((b) => b.totalSpend), 1);
    return Math.max(...buckets.flatMap((b) => [b.maleSpend, b.femaleSpend]), 1);
  }, [buckets, ageOnly]);

  return (
    <div className="h-[225px] w-full select-none pt-2">
      <svg viewBox="0 0 380 205" className="w-full h-full overflow-visible">
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
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id={`ageSlateB-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={10}
            y1={16 + 158 * t}
            x2={370}
            y2={16 + 158 * t}
            stroke="rgba(15,23,42,0.045)"
            strokeWidth="1"
          />
        ))}

        {buckets.map((b, idx) => {
          const slotW = 360 / buckets.length;
          const baseX = 10 + idx * slotW;
          const isPeak = b.age === peakAge && b.totalSpend > 0;

          if (ageOnly) {
            const bw = 28;
            const bx = baseX + (slotW - bw) / 2;
            const h = Math.max(4, (b.totalSpend / (maxBar * 1.1)) * 158);
            const by = 16 + 158 - h;
            return (
              <g key={b.age}>
                <title>{`${b.age}: ${formatDomMoney(b.totalSpend, currency)}`}</title>
                <path
                  d={roundedTopBarPath(bx, by, bw, h, 6)}
                  fill={isPeak ? `url(#agePeakM-${uid})` : `url(#ageSlateA-${uid})`}
                />
                <text
                  x={baseX + slotW / 2}
                  y={192}
                  textAnchor="middle"
                  className="fill-slate-500 font-medium"
                  fontSize="9.5"
                >
                  {b.age}
                </text>
              </g>
            );
          }

          const bw = 16;
          const gap = 5;
          const startX = baseX + (slotW - (bw * 2 + gap)) / 2;
          const hMale = Math.max(4, (b.maleSpend / (maxBar * 1.1)) * 158);
          const hFemale = Math.max(4, (b.femaleSpend / (maxBar * 1.1)) * 158);
          return (
            <g key={b.age}>
              <title>
                {`${b.age} — Nam: ${formatDomMoney(b.maleSpend, currency)} | Nữ: ${formatDomMoney(
                  b.femaleSpend,
                  currency
                )}`}
              </title>
              <path
                d={roundedTopBarPath(startX, 16 + 158 - hMale, bw, hMale, 5)}
                fill={isPeak ? `url(#agePeakM-${uid})` : `url(#ageSlateA-${uid})`}
              />
              <path
                d={roundedTopBarPath(startX + bw + gap, 16 + 158 - hFemale, bw, hFemale, 5)}
                fill={isPeak ? `url(#agePeakF-${uid})` : `url(#ageSlateB-${uid})`}
              />
              <text
                x={baseX + slotW / 2}
                y={192}
                textAnchor="middle"
                className="fill-slate-500 font-medium"
                fontSize="9.5"
              >
                {b.age}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const DaypartingHeatmapGrid: React.FC<{
  cells: DomMetaHourlyCell[];
  metric: 'spend' | 'leads' | 'messages' | 'purchases' | 'clicks';
  currency?: string;
}> = ({ cells, metric, currency = 'VND' }) => {
  const dayOrder = [
    { idx: 1, label: 'Thứ 2' },
    { idx: 2, label: 'Thứ 3' },
    { idx: 3, label: 'Thứ 4' },
    { idx: 4, label: 'Thứ 5' },
    { idx: 5, label: 'Thứ 6' },
    { idx: 6, label: 'Thứ 7' },
    { idx: 0, label: 'CN' },
  ];

  const { lookup, maxVal } = useMemo(() => {
    const map = new Map<string, number>();
    let m = 0;
    for (const c of cells) {
      const val = Number(c[metric] || 0);
      map.set(`${c.dayOfWeek}_${c.hour}`, val);
      if (val > m) m = val;
    }
    return { lookup: map, maxVal: Math.max(m, 1) };
  }, [cells, metric]);

  return (
    <div className="w-full overflow-x-auto pt-2">
      <div className="min-w-[650px] flex flex-col gap-1.5">
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
              const intensity = val > 0 ? 0.16 + (val / maxVal) * 0.84 : 0;
              const bg =
                val > 0 ? `rgba(30, 64, 255, ${intensity.toFixed(2)})` : '#F1F5F9';
              const fmt =
                metric === 'spend' ? formatDomMoney(val, currency) : formatDomNumber(val);
              return (
                <div
                  key={h}
                  title={`${d.label} · ${h}:00 — ${fmt}`}
                  className="flex-1 h-6 rounded-[5px] transition-transform hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: bg }}
                />
              );
            })}
          </div>
        ))}

        <div className="flex items-center justify-center gap-2 pt-3 text-[11px] font-medium text-slate-500">
          <span>Ít</span>
          <div className="flex items-center gap-1">
            {[0, 0.22, 0.48, 0.75, 1].map((alpha) => (
              <span
                key={alpha}
                className="w-3.5 h-3.5 rounded-[4px]"
                style={{
                  backgroundColor: alpha === 0 ? '#F1F5F9' : `rgba(30, 64, 255, ${alpha})`,
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
  regions: DomMetaRegionRow[];
  currency?: string;
}> = ({ regions, currency = 'VND' }) => {
  const top = regions.slice(0, 7);
  const maxVal = Math.max(...top.map((r) => r.spend), 1);

  if (top.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
        Chưa có dữ liệu vùng địa lý
      </div>
    );
  }

  return (
    <div className="space-y-2.5 pt-2">
      {top.map((r, idx) => {
        const pct = Math.max(5, Math.round((r.spend / maxVal) * 100));
        return (
          <div key={r.region} className="space-y-1">
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="font-medium text-slate-700 truncate">
                {idx + 1}. {r.region}
              </span>
              <span className="font-semibold text-slate-800 tabular-nums shrink-0">
                {formatDomMoneyShort(r.spend, currency)}
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

export const MonthlyYearBarChart: React.FC<{
  months: DomMetaMonthlyPoint[];
  metric: 'spend' | 'leads' | 'reach' | 'messages' | 'follows';
  currency?: string;
}> = ({ months, metric, currency = 'VND' }) => {
  const uid = useId().replace(/:/g, '');
  const maxVal = Math.max(...months.map((m) => Number(m[metric] || 0)), 1);

  return (
    <div className="w-full h-[240px] pt-3 select-none">
      <svg viewBox="0 0 640 220" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={`monthBar-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E40FF" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={16}
            y1={24 + 164 * t}
            x2={624}
            y2={24 + 164 * t}
            stroke="rgba(15,23,42,0.045)"
            strokeWidth="1"
          />
        ))}
        {months.map((m, idx) => {
          const val = Number(m[metric] || 0);
          const slotW = 608 / 12;
          const bw = 28;
          const bx = 16 + idx * slotW + (slotW - bw) / 2;
          const h = val > 0 ? Math.max(6, (val / (maxVal * 1.12)) * 164) : 3;
          const by = 24 + 164 - h;
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
                  className="fill-slate-700 font-semibold"
                  fontSize="9.5"
                >
                  {fmt}
                </text>
              )}
              <text
                x={bx + bw / 2}
                y={206}
                textAnchor="middle"
                className="fill-slate-500 font-medium"
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
  p50?: number;
  p95?: number;
  linkClicks: number;
}> = ({ impressions, video3s, thruplay, p50 = 0, p95 = 0, linkClicks }) => {
  const hookRate = impressions > 0 ? ((video3s / impressions) * 100).toFixed(1) : '0.0';
  const holdRate = video3s > 0 ? ((thruplay / video3s) * 100).toFixed(1) : '0.0';

  const stages = [
    { label: 'Impressions', val: impressions, sub: '100% hiển thị' },
    { label: '3s Video Views (Hook)', val: video3s, sub: `Hook Rate: ${hookRate}%` },
    { label: 'ThruPlay (Hold)', val: thruplay, sub: `Hold Rate: ${holdRate}%` },
    ...(p50 > 0 ? [{ label: '50% Watched', val: p50, sub: 'Xem nửa thời lượng' }] : []),
    ...(p95 > 0 ? [{ label: '95% Completed', val: p95, sub: 'Xem trọn vẹn' }] : []),
    { label: 'Link Clicks', val: linkClicks, sub: 'Chuyển đổi nhấp chuột' },
  ];
  const base = Math.max(impressions, 1);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-3">
          <div className="text-[11px] font-medium text-slate-500">Creative Hook Rate (3s)</div>
          <div className="text-lg font-bold text-[#1E40FF] tabular-nums">{hookRate}%</div>
        </div>
        <div className="rounded-xl bg-cyan-50/80 border border-cyan-100 p-3">
          <div className="text-[11px] font-medium text-slate-500">Creative Hold Rate</div>
          <div className="text-lg font-bold text-sky-700 tabular-nums">{holdRate}%</div>
        </div>
      </div>

      <div className="space-y-2">
        {stages.map((st, idx) => {
          const widthPct = Math.max(8, Math.min(100, Math.round((st.val / base) * 100)));
          return (
            <div key={st.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{st.label}</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {formatDomNumber(st.val)}{' '}
                  <span className="text-[10px] font-normal text-slate-400">({st.sub})</span>
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]"
                  style={{
                    width: `${idx === 0 ? 100 : widthPct}%`,
                    opacity: Math.max(0.45, 1 - idx * 0.1),
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
      <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">
        Chưa có dữ liệu phân bổ theo khung giờ (hourly) trong kỳ này
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pt-2 select-none">
      <svg viewBox="0 0 640 205" className="w-full min-w-[540px] h-[200px] overflow-visible">
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
            x1={14}
            y1={22 + 150 * t}
            x2={626}
            y2={22 + 150 * t}
            stroke="rgba(15,23,42,0.045)"
            strokeWidth="1"
          />
        ))}

        {slots.map((slot, idx) => {
          const val = values[idx] || 0;
          const slotW = 612 / 24;
          const bw = 16;
          const bx = 14 + idx * slotW + (slotW - bw) / 2;
          const h = val > 0 ? Math.max(5, (val / (maxVal * 1.15)) * 150) : 3;
          const by = 22 + 150 - h;
          const isPeak = idx === peakIdx && val > 0;
          const fmt = formatGoogleAdsDimVal(val, metric);
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
              {val > 0 && (isPeak || idx % 3 === 0) && (
                <text
                  x={bx + bw / 2}
                  y={Math.max(13, by - 5)}
                  textAnchor="middle"
                  className="fill-slate-700 font-semibold"
                  fontSize="8.5"
                >
                  {fmt}
                </text>
              )}
              {idx % 2 === 0 && (
                <text
                  x={bx + bw / 2}
                  y={190}
                  textAnchor="middle"
                  className="fill-slate-500 font-medium"
                  fontSize="9"
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
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {item.bucket.key}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pl-[18px] mt-0.5 tabular-nums">
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
