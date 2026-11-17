import React, { useState } from 'react';
import {
  BarChart3, Clock, MapPin, Users, Smartphone, Play,
  Sparkles, TrendingUp, TrendingDown, RefreshCw, Layers,
  CheckCircle2, AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LabelList
} from 'recharts';
import { CustomModal } from './ui/CustomModal';
import { Skeleton } from './ui/Skeleton';

const formatVND = (val: number) => {
  if (!val || val <= 0) return '0 ₫';
  return Math.round(val).toLocaleString('vi-VN') + ' ₫';
};

const formatCompactVND = (val: number) => {
  if (!val || val <= 0) return '0 ₫';
  if (val >= 1_000_000) {
    const tr = val / 1_000_000;
    return `${tr >= 10 ? tr.toFixed(1) : tr.toFixed(2).replace(/\.?0+$/, '')}Tr`;
  }
  if (val >= 1_000) {
    return `${Math.round(val / 1_000)}k`;
  }
  return `${Math.round(val)} ₫`;
};

interface AdsAnalyticsPanelProps {
  analytics: any;
  dailyTrend: any[];
  goalBreakdown: any[];
  loading: boolean;
  onRefresh: () => void;
}

export const AdsAnalyticsSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {/* Top Period Comparison Card Skeleton */}
    <div className="card" style={{ padding: '1rem 1.15rem', borderRadius: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <Skeleton width={180} height={24} borderRadius={8} />
          <Skeleton width="45%" height={14} borderRadius={6} />
        </div>
        <Skeleton width={130} height={30} borderRadius={8} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '0.75rem' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ padding: '0.75rem 0.9rem', borderRadius: 11, border: '1px solid var(--color-border-light)', background: 'var(--color-bg)' }}>
            <Skeleton width="55%" height={10} style={{ marginBottom: 10 }} />
            <Skeleton width="75%" height={22} style={{ marginBottom: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="40%" height={10} />
              <Skeleton width={48} height={16} borderRadius={8} />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Row 2: Daily Trend Chart + Goal Breakdown Skeleton */}
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.75fr) minmax(0, 1fr)', gap: '1rem' }} className="ads-analytics-grid-2">
      <div className="card" style={{ padding: '1.1rem 1.25rem', borderRadius: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Skeleton width={240} height={16} style={{ marginBottom: 6 }} />
            <Skeleton width={180} height={11} />
          </div>
          <Skeleton width={220} height={30} borderRadius={8} />
        </div>
        <Skeleton width="100%" height={290} borderRadius={12} />
      </div>
      <div className="card" style={{ padding: '1.1rem 1.25rem', borderRadius: 14 }}>
        <Skeleton width={220} height={16} style={{ marginBottom: 14 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={48} borderRadius={10} />
          ))}
        </div>
      </div>
    </div>

    {/* Row 3: 7x24 Heatmap Skeleton */}
    <div className="card" style={{ padding: '1.1rem 1.25rem', borderRadius: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Skeleton width={280} height={16} />
        <Skeleton width={240} height={28} borderRadius={8} />
      </div>
      <Skeleton width="100%" height={36} borderRadius={9} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={220} borderRadius={10} />
    </div>

    {/* Row 4: Age/Gender + Region Skeleton */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1rem' }}>
      <div className="card" style={{ padding: '1.1rem 1.25rem', borderRadius: 14 }}>
        <Skeleton width={220} height={16} style={{ marginBottom: 14 }} />
        <Skeleton width="100%" height={240} borderRadius={10} />
      </div>
      <div className="card" style={{ padding: '1.1rem 1.25rem', borderRadius: 14 }}>
        <Skeleton width={220} height={16} style={{ marginBottom: 14 }} />
        <Skeleton width="100%" height={240} borderRadius={10} />
      </div>
    </div>
  </div>
);

export const AdsAnalyticsPanel: React.FC<AdsAnalyticsPanelProps> = ({
  analytics,
  dailyTrend,
  goalBreakdown,
  loading,
  onRefresh
}) => {
  const [trendMode, setTrendMode] = useState<'spend_leads' | 'cpl_good' | 'cpm_ctr'>('spend_leads');
  const [heatmapMetric, setHeatmapMetric] = useState<'crm_leads' | 'meta_leads' | 'spend' | 'clicks'>('crm_leads');
  const [ageMode, setAgeMode] = useState<'gender' | 'age_only'>('gender');
  const [hoveredHeatCell, setHoveredHeatCell] = useState<{
    dayLabel: string;
    hour: number;
    crm_leads: number;
    meta_leads: number;
    spend: number;
    clicks: number;
  } | null>(null);

  if (loading && !analytics) {
    return <AdsAnalyticsSkeleton />;
  }

  const periodComp = analytics?.period_comparison || null;
  const smartInsight = periodComp?.smart_insight || null;
  const byAgeGender: any[] = analytics?.by_age_gender || [];
  const byRegion: any[] = analytics?.by_region || [];
  const byPlatform: any[] = analytics?.by_platform || [];
  const byPlacement: any[] = analytics?.by_placement || [];
  const byDevice: any[] = analytics?.by_device || [];
  const sched = analytics?.schedule_intelligence || null;
  const heatmap7x24: any[] = analytics?.heatmap_7x24 || [];
  const videoFunnel = analytics?.video_funnel || {};
  const engageMix = analytics?.engagement_mix || {};

  // Format Daily Trend data for Recharts
  const chartTrendData = dailyTrend.map((d) => ({
    ...d,
    shortDate: (d.date || '').slice(5).split('-').reverse().join('/'),
    spendTr: Number(((d.spend || 0) / 1_000_000).toFixed(2)),
    cplK: Math.round((d.cpl || 0) / 1_000),
    cpmK: Math.round((d.cpm || 0) / 1_000),
    spendLabel: formatCompactVND(d.spend || 0),
    cplLabel: formatCompactVND(d.cpl || 0)
  }));

  const totalTrendSpend = dailyTrend.reduce((s, d) => s + (d.spend || 0), 0);
  const totalTrendLeads = dailyTrend.reduce((s, d) => s + (d.crm_leads || 0), 0);
  const totalTrendGood = dailyTrend.reduce((s, d) => s + (d.good_leads || 0), 0);
  const peakDay = [...dailyTrend].sort((a, b) => (b.crm_leads || 0) - (a.crm_leads || 0))[0] || null;

  const totalGoalSpend = Math.max(1, goalBreakdown.reduce((s, g) => s + (g.total_meta_spend || 0), 0));
  const maxRegSpend = Math.max(1, ...byRegion.map((r) => r.spend || 0));

  // Compute max cell value for 7x24 heatmap
  let maxHeatVal = 1;
  heatmap7x24.forEach((dayRow) => {
    (dayRow.hours || []).forEach((c: any) => {
      const v = Number(c[heatmapMetric] || 0);
      if (v > maxHeatVal) maxHeatVal = v;
    });
  });

  const platformColors: Record<string, string> = {
    Facebook: '#1877F2',
    Instagram: '#E1306C',
    Messenger: '#00B2FF',
    'Audience Network': '#1E40FF'
  };
  const totalPlatSpend = byPlatform.reduce((s, p) => s + (p.spend || 0), 0);

  const renderDeltaBadge = (pct: number, inverseGood = false) => {
    if (!pct || Math.abs(pct) < 0.1) {
      return <span style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>0%</span>;
    }
    const isGood = inverseGood ? pct < 0 : pct > 0;
    const color = isGood ? '#15803d' : '#b91c1c';
    const bg = isGood ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.1)';
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 7px',
        borderRadius: 10,
        fontSize: '0.67rem',
        fontWeight: 800,
        background: bg,
        color
      }}>
        {pct > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {pct > 0 ? `+${pct}%` : `${pct}%`}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <style>{`
        @media (max-width: 1024px) {
          .ads-analytics-grid-2 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* 1. Smart Insight Banner & Period-over-Period Comparison Strip */}
      {periodComp && (
        <div className="card" style={{
          padding: '1rem 1.15rem',
          borderRadius: 14,
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: '0.85rem',
            paddingBottom: '0.7rem',
            borderBottom: '1px solid var(--color-border-light)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
              <div style={{
                padding: '5px 11px',
                borderRadius: 8,
                background: smartInsight?.status === 'positive'
                  ? 'rgba(22, 163, 74, 0.12)'
                  : smartInsight?.status === 'warning'
                  ? 'rgba(220, 38, 38, 0.1)'
                  : 'rgba(30, 64, 255, 0.14)',
                color: smartInsight?.status === 'positive'
                  ? '#15803d'
                  : smartInsight?.status === 'warning'
                  ? '#b91c1c'
                  : '#1E40FF',
                fontWeight: 800,
                fontSize: '0.73rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0
              }}>
                {smartInsight?.status === 'positive' ? <CheckCircle2 size={14} /> : smartInsight?.status === 'warning' ? <AlertTriangle size={14} /> : <Sparkles size={14} />}
                <span>Tổng Quan Hiệu Suất (Chuẩn CPL Lead)</span>
              </div>
              <span style={{ fontSize: '0.79rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.4 }}>
                {smartInsight?.text}
              </span>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(30, 64, 255, 0.35)',
                background: 'rgba(30, 64, 255, 0.08)',
                color: '#1E40FF',
                fontSize: '0.73rem',
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <RefreshCw size={12} className={loading ? 'spin' : ''} />
              {loading ? 'Đang cập nhật...' : 'Làm mới phân tích'}
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
            gap: '0.75rem'
          }}>
            {/* Spend (Active Lead Dates) */}
            <div style={{
              padding: '0.75rem 0.9rem',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(30, 64, 255, 0.08) 0%, rgba(30, 64, 255, 0.02) 100%)',
              border: '1px solid rgba(30, 64, 255, 0.22)'
            }}>
              <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#9A6F1A', textTransform: 'uppercase' }}>
                Chi Tiêu QC Lead (Ngày Có Lead)
              </div>
              <div style={{ fontSize: '1.22rem', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0' }} title={formatVND(periodComp.current?.spend || 0)}>
                {formatCompactVND(periodComp.current?.spend || 0)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <span style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)' }}>
                  Nửa kỳ đầu: {formatCompactVND(periodComp.previous?.spend || 0)}
                </span>
                {renderDeltaBadge(periodComp.deltas?.spend_pct || 0, false)}
              </div>
            </div>

            {/* Leads */}
            <div style={{
              padding: '0.75rem 0.9rem',
              borderRadius: 12,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border-light)'
            }}>
              <div style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Tổng Lead Hệ Thống
              </div>
              <div style={{ fontSize: '1.22rem', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0' }}>
                {periodComp.current?.crm_leads || 0} <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Lead</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <span style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)' }}>
                  Nửa kỳ đầu: {periodComp.previous?.crm_leads || 0} Lead
                </span>
                {renderDeltaBadge(periodComp.deltas?.leads_pct || 0, false)}
              </div>
            </div>

            {/* CPL */}
            <div style={{
              padding: '0.75rem 0.9rem',
              borderRadius: 12,
              background: 'rgba(37, 99, 235, 0.05)',
              border: '1px solid rgba(37, 99, 235, 0.18)'
            }}>
              <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                CPL Trung Bình
              </div>
              <div style={{ fontSize: '1.22rem', fontWeight: 800, color: '#1d4ed8', margin: '4px 0' }} title={formatVND(periodComp.current?.cpl || 0)}>
                {formatCompactVND(periodComp.current?.cpl || 0)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <span style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)' }}>
                  Nửa kỳ đầu: {formatCompactVND(periodComp.previous?.cpl || 0)}
                </span>
                {renderDeltaBadge(periodComp.deltas?.cpl_pct || 0, true)}
              </div>
            </div>

            {/* CPQL */}
            <div style={{
              padding: '0.75rem 0.9rem',
              borderRadius: 12,
              background: 'rgba(22, 163, 74, 0.06)',
              border: '1px solid rgba(22, 163, 74, 0.2)'
            }}>
              <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                CP / Lead Chất Lượng
              </div>
              <div style={{ fontSize: '1.22rem', fontWeight: 800, color: '#15803d', margin: '4px 0' }} title={formatVND(periodComp.current?.cpql || 0)}>
                {formatCompactVND(periodComp.current?.cpql || 0)}
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)' }}>
                <strong style={{ color: '#15803d' }}>{periodComp.current?.good_leads || 0}</strong> Lead thiện chí / hẹn / chốt
              </div>
            </div>

            {/* CPM & CTR */}
            <div style={{
              padding: '0.75rem 0.9rem',
              borderRadius: 12,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border-light)'
            }}>
              <div style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                CPM & Tỷ Lệ Nhấp (CTR)
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0' }}>
                {formatCompactVND(periodComp.current?.cpm || 0)} <span style={{ color: '#1E40FF', fontSize: '0.88rem' }}>• {periodComp.current?.ctr || 0}%</span>
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)' }}>
                {(periodComp.current?.clicks || 0).toLocaleString('vi-VN')} lượt nhấp (Clicks)
              </div>
            </div>

            {/* Reach & Frequency */}
            <div style={{
              padding: '0.75rem 0.9rem',
              borderRadius: 12,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border-light)'
            }}>
              <div style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Reach & Tần Suất (Freq)
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0' }}>
                {(periodComp.current?.reach || 0).toLocaleString('vi-VN')} <span style={{ fontSize: '0.8rem', color: (periodComp.current?.frequency || 0) > 3.2 ? '#dc2626' : '#1E40FF' }}>({periodComp.current?.frequency || 0})</span>
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)' }}>
                Hiển thị: {(periodComp.current?.impressions || 0).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Daily Trend Recharts ComposedChart + Meta Goal (optimization_goal) Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.75fr) minmax(0, 1fr)',
        gap: '1rem',
        alignItems: 'stretch'
      }} className="ads-analytics-grid-2">
        {/* Left: Full-Height Recharts Daily Trend Chart */}
        <div className="card" style={{
          padding: '1.15rem 1.25rem',
          borderRadius: 14,
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: '0.9rem' }}>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <BarChart3 size={17} color="#1E40FF" />
                  <span>Biểu Đồ Xu Hướng Hiệu Suất Theo Ngày Có Lead</span>
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Đối chiếu trực quan Chi tiêu QC Lead, Sản lượng Lead và CPL thực tế theo từng ngày
                </div>
              </div>
              <div style={{ display: 'inline-flex', background: 'var(--color-bg)', padding: 3, borderRadius: 9, border: '1px solid var(--color-border-light)' }}>
                {[
                  { id: 'spend_leads', label: 'Chi phí & Lead' },
                  { id: 'cpl_good', label: 'CPL & Lead CL' },
                  { id: 'cpm_ctr', label: 'CPM & CTR%' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTrendMode(m.id as any)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 7,
                      border: 'none',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: trendMode === m.id ? 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)' : 'transparent',
                      color: trendMode === m.id ? '#fff' : 'var(--color-text-muted)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {chartTrendData.length === 0 ? (
              <div style={{ height: 290, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                Chưa có dữ liệu theo ngày trong khoảng thời gian này.
              </div>
            ) : (
              <div style={{ width: '100%', height: 290 }}>
                <ResponsiveContainer width="100%" height={290}>
                  <ComposedChart data={chartTrendData} margin={{ top: 24, right: 12, left: -8, bottom: 4 }}>
                    <defs>
                      <linearGradient id="adsGoldBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E5C168" stopOpacity={1} />
                        <stop offset="55%" stopColor="#1E40FF" stopOpacity={0.96} />
                        <stop offset="100%" stopColor="#8A6218" stopOpacity={0.92} />
                      </linearGradient>
                      <linearGradient id="adsBlueBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0.9} />
                      </linearGradient>
                      <linearGradient id="adsEmeraldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                    <XAxis
                      dataKey="shortDate"
                      tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--color-text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(v) =>
                        trendMode === 'spend_leads'
                          ? `${v}Tr`
                          : `${v}k`
                      }
                      tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                      width={46}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(v) => (trendMode === 'cpm_ctr' ? `${v}%` : `${v}`)}
                      tick={{ fontSize: 10, fill: '#10B981', fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const row = payload[0].payload;
                        return (
                          <div style={{
                            background: 'var(--color-surface)',
                            padding: '10px 14px',
                            borderRadius: 11,
                            boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
                            border: '1px solid rgba(30, 64, 255, 0.35)',
                            minWidth: 190
                          }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 6, borderBottom: '1px solid var(--color-border-light)', paddingBottom: 4 }}>
                              Ngày {row.shortDate} ({row.date})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.74rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Chi tiêu QC Lead:</span>
                                <strong style={{ color: '#1E40FF' }}>{formatVND(row.spend)}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Tổng Lead về CRM:</span>
                                <strong style={{ color: '#10B981' }}>{row.crm_leads} Lead</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Lead chất lượng:</span>
                                <strong style={{ color: '#059669' }}>{row.good_leads} Lead</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>CPL trong ngày:</span>
                                <strong style={{ color: '#2563eb' }}>{formatVND(row.cpl)}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>CPM / CTR:</span>
                                <strong style={{ color: 'var(--color-text)' }}>{formatCompactVND(row.cpm)} • {row.ctr}%</strong>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    {trendMode === 'spend_leads' && (
                      <>
                        <Bar yAxisId="left" dataKey="spendTr" name="Chi tiêu (Tr)" fill="url(#adsGoldBarGrad)" radius={[8, 8, 0, 0]} maxBarSize={38}>
                          <LabelList dataKey="spendLabel" position="top" style={{ fill: '#1E3A8A', fontSize: 10, fontWeight: 800 }} offset={6} />
                        </Bar>
                        <Area yAxisId="right" type="monotone" dataKey="crm_leads" name="Lead CRM" fill="url(#adsEmeraldAreaGrad)" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} />
                      </>
                    )}
                    {trendMode === 'cpl_good' && (
                      <>
                        <Bar yAxisId="left" dataKey="cplK" name="CPL (k)" fill="url(#adsBlueBarGrad)" radius={[8, 8, 0, 0]} maxBarSize={38}>
                          <LabelList dataKey="cplLabel" position="top" style={{ fill: '#1d4ed8', fontSize: 10, fontWeight: 800 }} offset={6} />
                        </Bar>
                        <Line yAxisId="right" type="monotone" dataKey="good_leads" name="Lead Chất lượng" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} />
                      </>
                    )}
                    {trendMode === 'cpm_ctr' && (
                      <>
                        <Bar yAxisId="left" dataKey="cpmK" name="CPM (k)" fill="url(#adsGoldBarGrad)" radius={[8, 8, 0, 0]} maxBarSize={38} />
                        <Line yAxisId="right" type="monotone" dataKey="ctr" name="CTR (%)" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Bottom Summary Strip to balance card height & provide instant insights */}
          <div style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px dashed var(--color-border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: '0.73rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--color-text-muted)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: '#1E40FF', display: 'inline-block' }} />
                Tổng chi tiêu ({dailyTrend.length} ngày có Lead): <strong style={{ color: 'var(--color-text)' }}>{formatCompactVND(totalTrendSpend)}</strong>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--color-text-muted)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                Tổng Lead: <strong style={{ color: '#10B981' }}>{totalTrendLeads} Lead</strong> ({totalTrendGood} chất lượng)
              </span>
            </div>
            {peakDay && (
              <span style={{
                padding: '3px 9px',
                borderRadius: 8,
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                fontWeight: 700,
                fontSize: '0.7rem'
              }}>
                Ngày đỉnh: {(peakDay.date || '').slice(5).split('-').reverse().join('/')} ({peakDay.crm_leads} Lead • CPL {formatCompactVND(peakDay.cpl)})
              </span>
            )}
          </div>
        </div>

        {/* Right: Meta Optimization Goal Breakdown (DOMATION_META goalMapping) */}
        <div className="card" style={{
          padding: '1.15rem 1.25rem',
          borderRadius: 14,
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Layers size={17} color="#1E40FF" />
                <span>Phân Bổ Theo Meta Goal (Optimization Goal)</span>
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                Tách bạch chi phí Lead Form khỏi Tin nhắn, Tương tác, Reach & Traffic
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {goalBreakdown.map((g: any) => {
                const isLeadForm = g.goal_group === 'Lead Form';
                const sharePct = Math.round(((g.total_meta_spend || 0) / totalGoalSpend) * 1000) / 10;
                const unitCost = g.meta_results > 0 ? Math.round((g.total_meta_spend || 0) / g.meta_results) : 0;
                return (
                  <div
                    key={g.goal_group}
                    style={{
                      padding: '8px 11px',
                      borderRadius: 10,
                      background: isLeadForm ? 'rgba(30, 64, 255, 0.08)' : 'var(--color-bg)',
                      border: isLeadForm ? '1px solid rgba(30, 64, 255, 0.35)' : '1px solid var(--color-border-light)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 800, color: isLeadForm ? '#1E40FF' : 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{g.label}</span>
                          {isLeadForm && (
                            <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: 6, background: '#1E40FF', color: '#fff', fontWeight: 800 }}>
                              CHÍNH
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
                          {g.ads_count} bài QC • {(g.meta_results || 0).toLocaleString('vi-VN')} kết quả
                          {unitCost > 0 && g.goal_group !== 'Awareness' ? ` • CPR: ${formatCompactVND(unitCost)}` : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-text)' }} title={formatVND(g.total_meta_spend || 0)}>
                          {formatCompactVND(g.total_meta_spend || 0)}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          {sharePct}% tổng TK
                        </div>
                      </div>
                    </div>
                    <div style={{ height: 4, background: 'rgba(148, 163, 184, 0.16)', borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
                      <div style={{
                        width: `${Math.max(sharePct > 0 ? 3 : 0, Math.min(100, sharePct))}%`,
                        height: '100%',
                        background: isLeadForm ? 'linear-gradient(90deg, #3B82F6 0%, #1E40FF 100%)' : '#64748b',
                        borderRadius: 3
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 7x24 Dayparting Heatmap + Schedule Intelligence (Compact Luxury Style like Dashboard.tsx) */}
      <div className="card" style={{
        padding: '1.15rem 1.25rem',
        borderRadius: 14,
        border: '1px solid var(--color-border)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Clock size={17} color="#1E40FF" />
              <span>Bản Đồ Mật Độ 7 Ngày × 24 Giờ (Dayparting Heatmap) & Khung Giờ Vàng</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Rê chuột vào từng ô giờ để xem chi tiết Lead Hệ thống, Lead Meta, Chi tiêu và Lượt nhấp
            </div>
          </div>

          <div style={{ display: 'inline-flex', background: 'var(--color-bg)', padding: 3, borderRadius: 9, border: '1px solid var(--color-border-light)' }}>
            {[
              { id: 'crm_leads', label: 'Lead Hệ Thống' },
              { id: 'meta_leads', label: 'Lead Meta' },
              { id: 'spend', label: 'Chi Tiêu' },
              { id: 'clicks', label: 'Lượt Nhấp' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setHeatmapMetric(m.id as any)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 7,
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: heatmapMetric === m.id ? 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)' : 'transparent',
                  color: heatmapMetric === m.id ? '#fff' : 'var(--color-text-muted)'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Intelligence Pills */}
        {sched && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '0.85rem' }}>
            <div style={{
              flex: 1,
              minWidth: 260,
              padding: '7px 12px',
              borderRadius: 10,
              background: 'rgba(22, 163, 74, 0.07)',
              border: '1px solid rgba(22, 163, 74, 0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 6
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>
                Top 3 Khung Giờ Vàng (Hiệu Quả Nhất):
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(sched.best_hours || []).map((bh: any) => (
                  <span key={bh.hour} style={{
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: '#fff',
                    border: '1px solid rgba(22, 163, 74, 0.3)',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#15803d'
                  }}>
                    {bh.label} ({Math.max(bh.crm_leads, bh.meta_leads)} Lead • CPL: {formatCompactVND(bh.cpr)})
                  </span>
                ))}
              </div>
            </div>

            {sched.worst_hour && (
              <div style={{
                padding: '7px 12px',
                borderRadius: 10,
                background: 'rgba(220, 38, 38, 0.06)',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>
                  Khung Giờ Chi Cao / Ít Lead:
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: '#fff',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#b91c1c'
                }}>
                  {sched.worst_hour.label} (Chi: {formatCompactVND(sched.worst_hour.spend)})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Compact Sleek 7x24 Matrix */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 680 }}>
            {/* Hour Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(24, 1fr)', gap: 4, marginBottom: 5 }}>
              <div style={{ fontSize: '0.64rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>THỨ \ GIỜ</div>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  {h}h
                </div>
              ))}
            </div>

            {/* 7 Day Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {heatmap7x24.map((dayRow) => (
                <div key={dayRow.day_index} style={{ display: 'grid', gridTemplateColumns: '64px repeat(24, 1fr)', gap: 4, alignItems: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {dayRow.day_label}
                  </div>
                  {(dayRow.hours || []).map((cell: any) => {
                    const val = Number(cell[heatmapMetric] || 0);
                    const ratio = val > 0 ? Math.min(1, val / maxHeatVal) : 0;
                    const bg = val > 0
                      ? `rgba(30, 64, 255, ${0.18 + ratio * 0.78})`
                      : 'var(--color-bg)';
                    const textColor = ratio > 0.55 ? '#fff' : val > 0 ? '#785312' : 'transparent';
                    return (
                      <div
                        key={cell.hour}
                        onMouseEnter={() => setHoveredHeatCell({
                          dayLabel: dayRow.day_label,
                          hour: cell.hour,
                          crm_leads: cell.crm_leads || 0,
                          meta_leads: cell.meta_leads || 0,
                          spend: cell.spend || 0,
                          clicks: cell.clicks || 0
                        })}
                        onMouseLeave={() => setHoveredHeatCell(null)}
                        style={{
                          height: 26,
                          borderRadius: 5,
                          background: bg,
                          color: textColor,
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: val > 0 ? '1px solid rgba(30, 64, 255, 0.28)' : '1px solid var(--color-border-light)',
                          cursor: 'pointer',
                          transition: 'transform 0.12s ease'
                        }}
                      >
                        {val > 0 ? (heatmapMetric === 'spend' ? formatCompactVND(val) : val) : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Legend + Active Hover Readout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: '0.75rem',
          paddingTop: '0.6rem',
          borderTop: '1px dashed var(--color-border-light)',
          fontSize: '0.72rem'
        }}>
          <div style={{ color: 'var(--color-text-muted)', minHeight: 18 }}>
            {hoveredHeatCell ? (
              <span>
                Đang xem: <strong style={{ color: 'var(--color-text)' }}>{hoveredHeatCell.dayLabel} • {String(hoveredHeatCell.hour).padStart(2, '0')}:00</strong>
                {' — '}Lead Hệ thống: <strong style={{ color: '#10B981' }}>{hoveredHeatCell.crm_leads}</strong>
                {' • '}Lead Meta: <strong style={{ color: '#2563eb' }}>{hoveredHeatCell.meta_leads}</strong>
                {' • '}Chi tiêu: <strong style={{ color: '#1E40FF' }}>{formatVND(hoveredHeatCell.spend)}</strong>
                {' • '}Click: <strong>{hoveredHeatCell.clicks}</strong>
              </span>
            ) : (
              <span>Di chuột vào ô trên bảng nhiệt để xem chi tiết từng khung giờ</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)' }}>
            <span>Ít</span>
            {[0.12, 0.32, 0.55, 0.78, 0.96].map((op, i) => (
              <span key={i} style={{ width: 12, height: 12, borderRadius: 3, background: `rgba(30, 64, 255, ${op})`, display: 'inline-block' }} />
            ))}
            <span>Nhiều</span>
          </div>
        </div>
      </div>

      {/* 4. Age & Gender Recharts Column Chart + Top Provinces Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1rem'
      }}>
        {/* Age & Gender Breakdown (DOMATION_META render_age_gender.js Column Chart + CPL Badges) */}
        <div className="card" style={{
          padding: '1.15rem 1.25rem',
          borderRadius: 14,
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', gap: 8 }}>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Users size={17} color="#2563eb" />
                  <span>Nhân Khẩu Học: Độ Tuổi & Giới Tính</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Phân bổ ngân sách và CPL theo từng nhóm tuổi khách hàng
                </div>
              </div>
              <div style={{ display: 'inline-flex', background: 'var(--color-bg)', padding: 3, borderRadius: 8, border: '1px solid var(--color-border-light)' }}>
                <button
                  type="button"
                  onClick={() => setAgeMode('gender')}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: ageMode === 'gender' ? '#1E40FF' : 'transparent',
                    color: ageMode === 'gender' ? '#fff' : 'var(--color-text-muted)'
                  }}
                >
                  Nam & Nữ
                </button>
                <button
                  type="button"
                  onClick={() => setAgeMode('age_only')}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: ageMode === 'age_only' ? '#1E40FF' : 'transparent',
                    color: ageMode === 'age_only' ? '#fff' : 'var(--color-text-muted)'
                  }}
                >
                  Chỉ Độ Tuổi
                </button>
              </div>
            </div>

            {byAgeGender.length === 0 ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Chưa có dữ liệu Độ tuổi & Giới tính.
              </div>
            ) : (
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byAgeGender} margin={{ top: 16, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                    <XAxis dataKey="age" tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--color-text)' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => formatCompactVND(v)} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const row = payload[0].payload;
                        return (
                          <div style={{
                            background: 'var(--color-surface)',
                            padding: '10px 12px',
                            borderRadius: 10,
                            boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                            border: '1px solid var(--color-border)',
                            fontSize: '0.74rem'
                          }}>
                            <div style={{ fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>Độ tuổi: {row.age}</div>
                            <div>Tổng chi: <strong style={{ color: '#1E40FF' }}>{formatVND(row.spend)}</strong> ({row.results} KQ)</div>
                            <div style={{ color: '#2563eb' }}>Nam: <strong>{formatVND(row.male_spend)}</strong> ({row.male_results} KQ)</div>
                            <div style={{ color: '#ec4899' }}>Nữ: <strong>{formatVND(row.female_spend)}</strong> ({row.female_results} KQ)</div>
                            <div style={{ marginTop: 3, fontWeight: 700 }}>CPL nhóm tuổi: {formatVND(row.cpr)}</div>
                          </div>
                        );
                      }}
                    />
                    {ageMode === 'gender' ? (
                      <>
                        <Bar dataKey="male_spend" name="Nam" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={24} />
                        <Bar dataKey="female_spend" name="Nữ" fill="#ec4899" radius={[6, 6, 0, 0]} maxBarSize={24} />
                      </>
                    ) : (
                      <Bar dataKey="spend" name="Tổng chi" fill="url(#adsGoldBarGrad)" radius={[7, 7, 0, 0]} maxBarSize={36} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Age CPL Summary Pills */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: 6,
            marginTop: '0.75rem',
            paddingTop: '0.7rem',
            borderTop: '1px dashed var(--color-border-light)'
          }}>
            {byAgeGender.map((ag: any) => (
              <div key={ag.age} style={{
                padding: '5px 8px',
                borderRadius: 8,
                background: ag.is_best_cpr ? 'rgba(22, 163, 74, 0.08)' : ag.is_worst_cpr ? 'rgba(220, 38, 38, 0.07)' : 'var(--color-bg)',
                border: ag.is_best_cpr ? '1px solid rgba(22, 163, 74, 0.28)' : ag.is_worst_cpr ? '1px solid rgba(220, 38, 38, 0.24)' : '1px solid var(--color-border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.67rem'
              }}>
                <span style={{ fontWeight: 800, color: 'var(--color-text)' }}>{ag.age} ({ag.results})</span>
                <span style={{
                  fontWeight: 800,
                  color: ag.is_best_cpr ? '#15803d' : ag.is_worst_cpr ? '#b91c1c' : 'var(--color-text-muted)'
                }}>
                  {ag.cpr > 0 ? formatCompactVND(ag.cpr) : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Regions (Provinces) Breakdown */}
        <div className="card" style={{
          padding: '1.15rem 1.25rem',
          borderRadius: 14,
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <MapPin size={17} color="#16a34a" />
              <span>Top Tỉnh / Thành Phố (Geo Breakdown)</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Xếp hạng khu vực thu hút nhiều kết quả và ngân sách quảng cáo nhất
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {byRegion.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Chưa có dữ liệu Tỉnh / Thành phố.</div>
            ) : (
              byRegion.slice(0, 7).map((rg: any, idx: number) => {
                const pct = Math.max(4, Math.round((rg.spend / maxRegSpend) * 100));
                return (
                  <div key={rg.region} style={{
                    padding: '6px 10px',
                    borderRadius: 9,
                    background: idx === 0 ? 'rgba(16, 185, 129, 0.06)' : 'var(--color-bg)',
                    border: idx === 0 ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--color-border-light)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: 'var(--color-text)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: 5,
                          background: idx === 0 ? '#10B981' : 'rgba(148, 163, 184, 0.2)',
                          color: idx === 0 ? '#fff' : 'var(--color-text-muted)',
                          fontSize: '0.64rem', fontWeight: 800,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {idx + 1}
                        </span>
                        {rg.region}
                      </span>
                      <span style={{ fontSize: '0.71rem', color: 'var(--color-text-muted)' }}>
                        <strong style={{ color: 'var(--color-text)' }}>{formatCompactVND(rg.spend)}</strong> ({rg.share_pct}%) • <strong style={{ color: '#10B981' }}>{rg.results} KQ</strong>
                        {rg.cpr > 0 ? ` • CPR: ${formatCompactVND(rg.cpr)}` : ''}
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(148, 163, 184, 0.16)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: idx === 0 ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)' : 'linear-gradient(90deg, #3B82F6 0%, #1E40FF 100%)',
                        borderRadius: 4
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. Platform Donut + Placement Positions & Device + Video Funnel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1rem'
      }}>
        {/* Platform Donut + Placement Positions (DOMATION_META platform_position.js) */}
        <div className="card" style={{
          padding: '1.15rem 1.25rem',
          borderRadius: 14,
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Smartphone size={17} color="#1E40FF" />
              <span>Nền Tảng & Vị Trí Hiển Thị (Platform & Placements)</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Tỷ trọng phân phối giữa Facebook, Instagram, Messenger và từng vị trí hiển thị
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '165px 1fr', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 165, height: 165 }}>
              <ResponsiveContainer width="100%" height={165}>
                <PieChart>
                  <Pie
                    data={byPlatform}
                    dataKey="spend"
                    nameKey="platform"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {byPlatform.map((entry: any, i: number) => (
                      <Cell key={i} fill={platformColors[entry.platform] || '#1E40FF'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatVND(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text)' }}>{formatCompactVND(totalPlatSpend)}</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Tổng Nền Tảng</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {byPlacement.slice(0, 5).map((pos: any) => (
                <div key={pos.placement} style={{
                  padding: '6px 9px',
                  borderRadius: 8,
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border-light)',
                  fontSize: '0.72rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{pos.placement}</span>
                    <span style={{ fontWeight: 800, color: '#1E40FF' }}>{pos.share_pct}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--color-text-muted)' }}>
                    <span>Chi: {formatCompactVND(pos.spend)}</span>
                    <span>{pos.results} KQ {pos.cpr > 0 ? `• CPR: ${formatCompactVND(pos.cpr)}` : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Device Split + Video Retention Funnel & Engagement Mix */}
        <div className="card" style={{
          padding: '1.15rem 1.25rem',
          borderRadius: 14,
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.85rem'
        }}>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 7, marginBottom: '0.65rem' }}>
              <Play size={17} color="#db2777" />
              <span>Thiết Bị, Phễu Giữ Chân Video & Tương Tác</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: 7, marginBottom: '0.85rem' }}>
              {byDevice.slice(0, 4).map((dv: any) => (
                <div key={dv.device} style={{
                  padding: '7px 9px',
                  borderRadius: 9,
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border-light)'
                }}>
                  <div style={{ fontSize: '0.71rem', fontWeight: 800, color: 'var(--color-text)' }}>{dv.device}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb', marginTop: 2 }}>
                    {formatCompactVND(dv.spend)} <span style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)' }}>({dv.share_pct}%)</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
                    {dv.results} KQ {dv.cpr > 0 ? `• ${formatCompactVND(dv.cpr)}` : ''}
                  </div>
                </div>
              ))}
            </div>

            {/* Video Retention Funnel */}
            {(videoFunnel.v3s > 0 || videoFunnel.p25 > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: '0.7rem' }}>
                {[
                  { label: 'Xem 3 giây (3s View)', val: videoFunnel.v3s || 0, color: '#3b82f6' },
                  { label: 'Xem 25% thời lượng', val: videoFunnel.p25 || 0, color: '#6366f1' },
                  { label: 'Xem 50% thời lượng', val: videoFunnel.p50 || 0, color: '#8b5cf6' },
                  { label: 'ThruPlay (15s / Hoàn tất)', val: videoFunnel.thruplay || 0, color: '#ec4899' },
                  { label: 'Xem 100% Video', val: videoFunnel.p100 || 0, color: '#f43f5e' }
                ].map((st) => {
                  const base = Math.max(1, videoFunnel.v3s || videoFunnel.p25 || 1);
                  const pct = Math.min(100, Math.round((st.val / base) * 100));
                  return (
                    <div key={st.label} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 90px', alignItems: 'center', gap: 8, fontSize: '0.71rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{st.label}</span>
                      <div style={{ height: 7, background: 'var(--color-bg)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: st.color, borderRadius: 4 }} />
                      </div>
                      <span style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-text)' }}>
                        {st.val.toLocaleString('vi-VN')} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Engagement Mix Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: '0.6rem', borderTop: '1px dashed var(--color-border-light)' }}>
            {[
              { label: 'Tương tác bài viết', val: engageMix.post_engagement || 0 },
              { label: 'Cảm xúc (Reactions)', val: engageMix.reactions || 0 },
              { label: 'Bình luận', val: engageMix.comments || 0 },
              { label: 'Chia sẻ', val: engageMix.shares || 0 },
              { label: 'Lưu bài', val: engageMix.saves || 0 },
              { label: 'Nhấp liên kết', val: engageMix.link_clicks || 0 },
              { label: 'Bắt đầu tin nhắn', val: engageMix.messages_started || 0 }
            ].map((em) => (
              <span key={em.label} style={{
                padding: '4px 9px',
                borderRadius: 8,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border-light)',
                fontSize: '0.68rem',
                color: 'var(--color-text-muted)'
              }}>
                {em.label}: <strong style={{ color: 'var(--color-text)' }}>{em.val.toLocaleString('vi-VN')}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Side-by-Side Ad Comparison Modal (ported from DOMATION_META selection_bar.js openCompareModal)
interface AdsCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  adA: any | null;
  adB: any | null;
}

export const AdsCompareModal: React.FC<AdsCompareModalProps> = ({ isOpen, onClose, adA, adB }) => {
  if (!isOpen || !adA || !adB) return null;

  const metrics = [
    { label: 'Mục tiêu tối ưu (Meta Goal)', valA: adA.goal_group || 'Lead Form', valB: adB.goal_group || 'Lead Form', type: 'text' },
    { label: 'Chi tiêu (Ngày có Lead)', valA: adA.spend || 0, valB: adB.spend || 0, format: formatVND, lowerBetter: false },
    { label: 'Tổng Lead về CRM', valA: adA.total_leads || 0, valB: adB.total_leads || 0, format: (v: number) => `${v} Lead`, higherBetter: true },
    { label: 'Lead chất lượng (Thiện chí/Hẹn/Chốt)', valA: adA.positive_leads || 0, valB: adB.positive_leads || 0, format: (v: number) => `${v} Lead`, higherBetter: true },
    { label: 'Tỷ lệ Lead chất lượng', valA: adA.positive_rate || 0, valB: adB.positive_rate || 0, format: (v: number) => `${v}%`, higherBetter: true },
    { label: 'CPL (Chi phí / Lead)', valA: adA.cpl || 0, valB: adB.cpl || 0, format: formatVND, lowerBetter: true },
    { label: 'CP / Lead chất lượng', valA: adA.cpql || 0, valB: adB.cpql || 0, format: formatVND, lowerBetter: true },
    { label: 'CPM (Chi phí / 1.000 hiển thị)', valA: adA.cpm || 0, valB: adB.cpm || 0, format: formatVND, lowerBetter: true },
    { label: 'CTR (Tỷ lệ nhấp)', valA: adA.ctr || 0, valB: adB.ctr || 0, format: (v: number) => `${v}%`, higherBetter: true },
    { label: 'Tần suất (Frequency)', valA: adA.frequency || 0, valB: adB.frequency || 0, format: (v: number) => `${v}`, lowerBetter: true },
    { label: 'Điểm chất lượng Pipeline', valA: adA.quality_score || 0, valB: adB.quality_score || 0, format: (v: number) => `${v} điểm`, higherBetter: true }
  ];

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="So Sánh Trực Diện 2 Bài Quảng Cáo (Side-by-Side VS)"
      width="820px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10, padding: '0.75rem', borderRadius: 12, background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
            CHỈ SỐ ĐỐI CHIẾU
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1E40FF', textTransform: 'uppercase' }}>Bài Quảng Cáo A</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={adA.ad_name}>
              {adA.ad_name}
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)' }}>ID: #{adA.ad_id.slice(-6)}</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>Bài Quảng Cáo B</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={adB.ad_name}>
              {adB.ad_name}
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)' }}>ID: #{adB.ad_id.slice(-6)}</div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <tbody>
            {metrics.map((m) => {
              let winA = false;
              let winB = false;
              if (m.type !== 'text') {
                const a = Number(m.valA || 0);
                const b = Number(m.valB || 0);
                if (m.higherBetter && a !== b) {
                  winA = a > b;
                  winB = b > a;
                } else if (m.lowerBetter && a > 0 && b > 0 && a !== b) {
                  winA = a < b;
                  winB = b < a;
                }
              }
              return (
                <tr key={m.label} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: '9px 10px', fontWeight: 700, color: 'var(--color-text-muted)', width: '38%' }}>
                    {m.label}
                  </td>
                  <td style={{
                    padding: '9px 10px',
                    fontWeight: 800,
                    color: winA ? '#15803d' : 'var(--color-text)',
                    background: winA ? 'rgba(22, 163, 74, 0.08)' : 'transparent',
                    width: '31%'
                  }}>
                    {m.format ? m.format(m.valA) : m.valA}
                    {winA && <span style={{ marginLeft: 6, fontSize: '0.63rem', padding: '1px 5px', borderRadius: 6, background: '#16a34a', color: '#fff' }}>TỐT HƠN</span>}
                  </td>
                  <td style={{
                    padding: '9px 10px',
                    fontWeight: 800,
                    color: winB ? '#15803d' : 'var(--color-text)',
                    background: winB ? 'rgba(22, 163, 74, 0.08)' : 'transparent',
                    width: '31%'
                  }}>
                    {m.format ? m.format(m.valB) : m.valB}
                    {winB && <span style={{ marginLeft: 6, fontSize: '0.63rem', padding: '1px 5px', borderRadius: 6, background: '#16a34a', color: '#fff' }}>TỐT HƠN</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CustomModal>
  );
};
