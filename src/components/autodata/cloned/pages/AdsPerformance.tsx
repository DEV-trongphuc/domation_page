import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone, RefreshCw, Search, Eye, Flame,
  AlertTriangle, ChevronDown, ChevronUp,
  DollarSign, Users, Award,
  Sparkles, Layers, Filter, KeyRound, Check, Copy,
  ChevronLeft, ChevronRight, BarChart3, GitCompare, X, Zap, Send,
  Plus, Trash2, Edit2, Pause, Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAPI, getDefaultDateFilter, normalizeGlobalDateFilter } from '../utils/api';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton, KpiCardSkeleton } from '../components/ui/Skeleton';
import { LeadQualityBadge } from '../components/LeadQualityBadge';
import { AdPreviewModal } from '../components/AdPreviewModal';
import { AdsAnalyticsPanel, AdsCompareModal } from '../components/AdsAnalyticsPanel';
import { AdsCapiPanel } from '../components/AdsCapiPanel';
import { withRouterFreezer } from '../components/RouterFreezer';
import { useAuth } from '../contexts/AuthContext';
import { resolveTenantPipelines } from '../utils/pipelineConfig';
import { ScreenHelpButton } from '../components/ui/ScreenHelpButton';

interface AdLeadItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  quality_status: string;
  quality_note: string;
  quality_updated_at?: string | null;
  ai_screener_status?: string | null;
  ai_evaluation?: string | null;
  created_at: string;
  assigned_to_name: string;
  assigned_to_avatar?: string | null;
  round_name: string;
  ad_id?: string;
  ad_name?: string;
  campaign_name?: string;
  adset_name?: string;
  thumbnail_url?: string;
  has_meta_lead_id?: boolean;
  has_fbclid?: boolean;
  capi_last_event?: string | null;
  capi_last_status?: number | null;
  capi_sent_at?: string | null;
}

interface AdPerformanceRow {
  ad_id: string;
  ad_name: string;
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  platform: string;
  status: string;
  thumbnail_url: string;
  image_url: string;
  creative_title: string;
  creative_body: string;
  story_id: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  cpm: number;
  ctr: number;
  reach: number;
  total_leads: number;
  assigned_leads: number;
  pipeline: {
    Qualified: number;
    Booked: number;
    Booking: number;
    Deposited: number;
    Closed: number;
    Badtiming: number;
    NoAnswer: number;
    Notlead: number;
    unrated: number;
  };
  positive_leads: number;
  negative_leads: number;
  rated_leads: number;
  positive_rate: number;
  negative_rate: number;
  quality_score: number;
  cpl: number;
  cpql: number;
  optimization_goal?: string;
  goal_group?: string;
  meta_leads?: number;
  meta_results?: number;
  frequency?: number;
  total_meta_spend?: number;
  smart_badges?: Array<{ key: string; label: string; title: string }>;
  rating_tier: 'excellent' | 'good' | 'pending' | 'poor' | 'no_leads';
  rating_label: string;
  leads: AdLeadItem[];
}

interface DashboardSummary {
  total_ads_tracked: number;
  ads_with_leads: number;
  total_ad_leads: number;
  unattributed_leads: number;
  total_positive_leads: number;
  total_negative_leads: number;
  total_rated_leads: number;
  overall_positive_rate: number;
  total_spend: number;
  avg_cpl: number;
  avg_cpql: number;
  avg_cpm?: number;
  avg_ctr?: number;
  avg_frequency?: number;
  total_meta_leads?: number;
  pipeline_totals: {
    Qualified: number;
    Booked: number;
    Booking: number;
    Deposited: number;
    Closed: number;
    Badtiming: number;
    NoAnswer: number;
    Notlead: number;
    unrated: number;
  };
}

const PIPELINE_COLUMNS: Array<{
  key: keyof AdPerformanceRow['pipeline'];
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
  group: 'positive' | 'neutral' | 'negative';
}> = [
  { key: 'Qualified', label: 'Thiện chí', shortLabel: 'Thiện chí', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)', border: 'rgba(22, 163, 74, 0.25)', group: 'positive' },
  { key: 'Booked', label: 'Hẹn gặp', shortLabel: 'Hẹn gặp', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)', border: 'rgba(37, 99, 235, 0.25)', group: 'positive' },
  { key: 'Booking', label: 'Booking', shortLabel: 'Booking', color: '#db2777', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.28)', group: 'positive' },
  { key: 'Deposited', label: 'Đặt cọc', shortLabel: 'Đặt cọc', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)', border: 'rgba(217, 119, 6, 0.3)', group: 'positive' },
  { key: 'Closed', label: 'Đã chốt', shortLabel: 'Đã chốt', color: '#9333ea', bg: 'rgba(147, 51, 234, 0.12)', border: 'rgba(147, 51, 234, 0.3)', group: 'positive' },
  { key: 'Badtiming', label: 'Hẹn gọi lại', shortLabel: 'Gọi lại', color: '#ca8a04', bg: 'rgba(202, 138, 4, 0.1)', border: 'rgba(202, 138, 4, 0.25)', group: 'neutral' },
  { key: 'NoAnswer', label: 'KNM / Thuê bao', shortLabel: 'KNM', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)', border: 'rgba(234, 88, 12, 0.25)', group: 'negative' },
  { key: 'Notlead', label: 'Notlead', shortLabel: 'Notlead', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.25)', group: 'negative' },
  { key: 'unrated', label: 'Chưa ĐG', shortLabel: 'Chưa ĐG', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.22)', group: 'neutral' },
];

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

const AdThumbnail: React.FC<{
  adId: string;
  src?: string | null;
  alt?: string;
  size?: number;
  borderRadius?: number;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ src, alt = 'Ad', size = 42, borderRadius = 8, onClick }) => {
  const [imgSrc, setImgSrc] = useState<string>(src || '');
  const [failed, setFailed] = useState<boolean>(!src);

  useEffect(() => {
    setImgSrc(src || '');
    setFailed(!src);
  }, [src]);

  return (
    <div
      onClick={onClick}
      title={onClick ? 'Xem bài quảng cáo' : undefined}
      style={{
        width: size,
        height: size,
        borderRadius,
        overflow: 'hidden',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid rgba(30, 64, 255, 0.35)',
        background: 'rgba(30, 64, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {!failed && imgSrc ? (
        <img
          src={imgSrc}
          alt={alt}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Megaphone size={Math.round(size * 0.43)} color="#1E40FF" />
      )}
    </div>
  );
};

const buildPageNumbers = (current: number, total: number): Array<number | 'ellipsis'> => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: Array<number | 'ellipsis'> = [1];
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
};

const CompactPaginationBar: React.FC<{
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  unitLabel?: string;
  compact?: boolean;
}> = ({ currentPage, totalItems, pageSize, onPageChange, unitLabel = 'mục', compact = false }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(totalItems, safePage * pageSize);
  const pages = buildPageNumbers(safePage, totalPages);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        padding: compact ? '6px 12px' : '9px 14px',
        background: compact ? 'rgba(30, 64, 255, 0.05)' : 'var(--color-bg)',
        borderTop: '1px solid var(--color-border-light)',
        fontSize: compact ? '0.7rem' : '0.75rem',
        color: 'var(--color-text-muted)'
      }}
    >
      <div>
        Hiển thị <strong style={{ color: 'var(--color-text)' }}>{startIdx}–{endIdx}</strong> / <strong style={{ color: '#1E40FF' }}>{totalItems}</strong> {unitLabel}
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          style={{
            width: compact ? 24 : 26,
            height: compact ? 24 : 26,
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: safePage <= 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
            opacity: safePage <= 1 ? 0.45 : 1
          }}
          title="Trang trước"
        >
          <ChevronLeft size={13} />
        </button>

        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`el-${idx}`} style={{ padding: '0 3px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              style={{
                minWidth: compact ? 24 : 26,
                height: compact ? 24 : 26,
                padding: '0 6px',
                borderRadius: 6,
                border: p === safePage ? '1px solid #1E40FF' : '1px solid var(--color-border)',
                background: p === safePage ? 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)' : 'var(--color-surface)',
                color: p === safePage ? '#fff' : 'var(--color-text)',
                fontSize: compact ? '0.69rem' : '0.73rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          style={{
            width: compact ? 24 : 26,
            height: compact ? 24 : 26,
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: safePage >= totalPages ? 'var(--color-text-muted)' : 'var(--color-text)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
            opacity: safePage >= totalPages ? 0.45 : 1
          }}
          title="Trang tiếp"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

const DRAWER_PAGE_SIZE = 8;
const ADS_PAGE_SIZE = 10;
const LEADS_PAGE_SIZE = 12;

const normalizeAdsDateFilter = (val: string | null | undefined): string => {
  if (!val) return 'this_month';
  const v = val.trim();
  const map: Record<string, string> = {
    'Tất cả': 'all',
    'Tất cả thời gian': 'all',
    'all': 'all',
    'Hôm nay': 'today',
    'today': 'today',
    'Hôm qua': 'yesterday',
    'yesterday': 'yesterday',
    '7 ngày qua': '7days',
    '7days': '7days',
    'Tuần này': '7days',
    'this_week': '7days',
    '30 ngày qua': '30days',
    '30days': '30days',
    'Tháng này': 'this_month',
    'this_month': 'this_month',
    'Tháng trước': 'last_month',
    'last_month': 'last_month',
  };
  return map[v] || 'this_month';
};

const AdsPerformanceInner: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const { tenantSlug, tenantSettings } = useAuth();
  const pipelineColumns = useMemo(
    () => [
      ...resolveTenantPipelines(tenantSettings).map((st) => ({
        key: st.key as keyof AdPerformanceRow['pipeline'],
        label: st.shortLabel || st.label,
        shortLabel: st.shortLabel,
        color: st.color,
        bg: st.bg,
        border: st.border,
        group: st.group,
      })),
      {
        key: 'unrated' as keyof AdPerformanceRow['pipeline'],
        label: 'Chưa ĐG',
        shortLabel: 'Chưa ĐG',
        color: '#64748b',
        bg: 'rgba(100, 116, 139, 0.1)',
        border: 'rgba(100, 116, 139, 0.22)',
        group: 'neutral' as const,
      },
    ],
    [tenantSettings]
  );
  const [dateFilter, setDateFilter] = useState<string>(() => {
    return normalizeAdsDateFilter(localStorage.getItem('domation_global_date') || getDefaultDateFilter());
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [ads, setAds] = useState<AdPerformanceRow[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [goalBreakdown, setGoalBreakdown] = useState<any[]>([]);

  // Analytics Breakdowns State (from DOMATION_META Batch API)
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);

  // Filters & View Mode
  const [viewMode, setViewMode] = useState<'pipeline' | 'leads' | 'analytics' | 'capi'>('pipeline');
  const [sendingLeadCapiId, setSendingLeadCapiId] = useState<number | null>(null);
  const [goalFilter, setGoalFilter] = useState<string>('Lead Form');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('with_leads');
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  const [expandedAdIds, setExpandedAdIds] = useState<Record<string, boolean>>({});

  // Multi-select & Compare VS Modal State (from DOMATION_META selection_bar.js)
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState<boolean>(false);

  // Pagination States
  const [adsPage, setAdsPage] = useState<number>(1);
  const [leadsPage, setLeadsPage] = useState<number>(1);
  const [drawerPages, setDrawerPages] = useState<Record<string, number>>({});

  // Ad Preview Modal State
  const [previewAd, setPreviewAd] = useState<{
    adId: string;
    adName?: string | null;
    thumb?: string | null;
    leadName?: string | null;
  } | null>(null);

  // Meta Token Config Modal State (Multi-Account Vault)
  const [configModalOpen, setConfigModalOpen] = useState<boolean>(false);
  const [adAccountId, setAdAccountId] = useState<string>('');
  const [lastSyncAt, setLastSyncAt] = useState<string>('');
  const [cachedAdsCount, setCachedAdsCount] = useState<number>(0);
  const [metaAccounts, setMetaAccounts] = useState<Array<{
    id: string;
    name: string;
    ad_account_id: string;
    has_token: boolean;
    access_token_masked: string;
    pixel_id: string;
    is_active: boolean;
    last_sync: string | null;
    synced_ads_count: number;
    last_error: string | null;
  }>>([]);
  const [adAccountFilter, setAdAccountFilter] = useState<string>('all');
  const [showAccountForm, setShowAccountForm] = useState<boolean>(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountFormName, setAccountFormName] = useState<string>('');
  const [accountFormId, setAccountFormId] = useState<string>('');
  const [accountFormToken, setAccountFormToken] = useState<string>('');
  const [accountFormPixel, setAccountFormPixel] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [purgeOnDelete, setPurgeOnDelete] = useState<boolean>(false);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Meta Token Asset Discovery State (Ad Accounts & Pixels Dropdown)
  const [discoveringMetaAssets, setDiscoveringMetaAssets] = useState<boolean>(false);
  const [discoveredAdAccounts, setDiscoveredAdAccounts] = useState<Array<{
    id: string;
    ad_account_id: string;
    name: string;
    account_status: number;
    status_label: string;
    currency: string;
    business_name?: string | null;
    pixels: Array<{ id: string; name: string; last_fired_time?: string | null }>;
  }>>([]);
  const [discoveredPixels, setDiscoveredPixels] = useState<Array<{
    id: string;
    name: string;
    source_account_id?: string;
    source_account_name?: string;
  }>>([]);
  const [discoverStatusMsg, setDiscoverStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [manualAdAccountMode, setManualAdAccountMode] = useState<boolean>(false);
  const [manualPixelMode, setManualPixelMode] = useState<boolean>(false);
  const [lastAutoDiscoveredToken, setLastAutoDiscoveredToken] = useState<string>('');

  const handleUpdateDateFilter = (val: string) => {
    setDateFilter(val);
    const canonical = normalizeGlobalDateFilter(val);
    localStorage.setItem('domation_global_date', canonical);
    window.dispatchEvent(new CustomEvent('global-date-change', { detail: canonical }));
  };

  useEffect(() => {
    const onGlobalDate = (e: any) => {
      if (e.detail) {
        const norm = normalizeAdsDateFilter(e.detail);
        if (norm !== dateFilter) {
          setDateFilter(norm);
        }
      }
    };
    window.addEventListener('global-date-change', onGlobalDate);
    return () => window.removeEventListener('global-date-change', onGlobalDate);
  }, [dateFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setAdsPage(1);
    setLeadsPage(1);
    setDrawerPages({});
  }, [searchTerm, tierFilter, pipelineFilter, dateFilter, goalFilter, adAccountFilter, viewMode]);

  const loadDashboard = async (silent = false) => {
    const accQuery = adAccountFilter !== 'all' ? `&ad_account_id=${encodeURIComponent(adAccountFilter)}` : '';
    const tenantPrefix = tenantSlug || 'default';
    const cacheKey = `${tenantPrefix}_ads_dash_${dateFilter}_${goalFilter}_${adAccountFilter}`;
    if (!silent) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.ads) setAds(parsed.ads);
          if (parsed?.summary) setSummary(parsed.summary);
          if (parsed?.daily_trend) setDailyTrend(parsed.daily_trend);
          if (parsed?.goal_breakdown) setGoalBreakdown(parsed.goal_breakdown);
          setLoading(false);
        } else {
          setLoading(true);
        }
      } catch (e) {
        setLoading(true);
      }
    }
    try {
      const res = await fetchAPI(
        `get_ads_performance_dashboard&date=${encodeURIComponent(dateFilter)}&goal=${encodeURIComponent(goalFilter)}${accQuery}`
      );
      if (res?.success) {
        setAds(Array.isArray(res.ads) ? res.ads : []);
        setSummary(res.summary || null);
        setDailyTrend(Array.isArray(res.daily_trend) ? res.daily_trend : []);
        setGoalBreakdown(Array.isArray(res.goal_breakdown) ? res.goal_breakdown : []);
        if (res.meta_config) {
          setAdAccountId(res.meta_config.ad_account_id || '');
          setLastSyncAt(res.meta_config.last_sync || '');
          setCachedAdsCount(res.meta_config.cached_ads_count || 0);
          if (Array.isArray(res.meta_config.accounts)) {
            setMetaAccounts(res.meta_config.accounts);
          }
        }
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            ads: res.ads || [],
            summary: res.summary || null,
            daily_trend: res.daily_trend || [],
            goal_breakdown: res.goal_breakdown || []
          }));
        } catch (e) {
          // ignore storage quota
        }
      } else {
        toast.error(res?.error || 'Không thể tải dữ liệu hiệu suất quảng cáo');
      }
    } catch (err: any) {
      toast.error('Lỗi tải dữ liệu quảng cáo: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsBreakdowns = async (forceRefresh = false) => {
    const accQuery = adAccountFilter !== 'all' ? `&ad_account_id=${encodeURIComponent(adAccountFilter)}` : '';
    const tenantPrefix = tenantSlug || 'default';
    const cacheKey = `${tenantPrefix}_ads_analytics_${dateFilter}_${goalFilter}_${adAccountFilter}`;
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.success) {
            setAnalyticsData(parsed);
          }
        }
      } catch (e) {
        // ignore
      }
    }
    setLoadingAnalytics(true);
    try {
      const res = await fetchAPI(
        `get_ads_analytics_breakdowns&date=${encodeURIComponent(dateFilter)}&goal=${encodeURIComponent(goalFilter)}${accQuery}${forceRefresh ? '&refresh=1' : ''}`
      );
      if (res?.success) {
        setAnalyticsData(res);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(res));
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadMetaConfig = async () => {
    try {
      const res = await fetchAPI('get_meta_ads_config');
      if (res?.success && res.data) {
        setAdAccountId(res.data.ad_account_id || '');
        setLastSyncAt(res.data.last_sync || '');
        setCachedAdsCount(res.data.cached_ads_count || 0);
        if (Array.isArray(res.data.accounts)) {
          setMetaAccounts(res.data.accounts);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSendSingleLeadCapi = async (leadId: number, stage?: string | null) => {
    setSendingLeadCapiId(leadId);
    try {
      const res = await fetchAPI('send_single_lead_capi', {
        method: 'POST',
        body: JSON.stringify({
          lead_id: leadId,
          stage: stage && stage !== 'unrated' ? stage : undefined,
          force_retry: true
        })
      });
      if (res.success && !res.skipped) {
        toast.success(`Đã bắn CAPI (${res.event_name}) cho Lead #${leadId}`);
        loadDashboard(true);
      } else if (res.skipped) {
        toast(res.reason || 'Lead này chưa đủ điều kiện hoặc đang Skip');
      } else {
        const errMsg = res.results?.[0]?.response?.error?.message || res.message || 'Bắn CAPI thất bại';
        toast.error(errMsg);
      }
    } catch (e: any) {
      toast.error(e.message || 'Lỗi kết nối');
    } finally {
      setSendingLeadCapiId(null);
    }
  };

  useEffect(() => {
    if (isActive) {
      loadDashboard();
      loadMetaConfig();
      loadAnalyticsBreakdowns(false);
    }
  }, [isActive, dateFilter, goalFilter, adAccountFilter]);

  const resetDiscoveryState = () => {
    setDiscoveredAdAccounts([]);
    setDiscoveredPixels([]);
    setDiscoverStatusMsg(null);
    setManualAdAccountMode(false);
    setManualPixelMode(false);
    setLastAutoDiscoveredToken('');
  };

  const discoverAssetsFromToken = async (opts?: { tokenOverride?: string; accountIdOverride?: string | null; adAccountOverride?: string }) => {
    const tokenToUse = (opts?.tokenOverride !== undefined ? opts.tokenOverride : accountFormToken).trim();
    const accRef = opts?.accountIdOverride !== undefined ? opts.accountIdOverride : editingAccountId;
    if (!tokenToUse && !accRef) {
      toast.error('Vui lòng dán Meta Access Token trước khi tải danh sách Ad Account & Pixel.');
      return;
    }

    setDiscoveringMetaAssets(true);
    setDiscoverStatusMsg(null);
    try {
      const res = await fetchAPI('discover_meta_assets', {
        method: 'POST',
        body: JSON.stringify({
          access_token: tokenToUse || undefined,
          account_id: accRef || undefined,
          ad_account_id: opts?.adAccountOverride || accountFormId || undefined,
        }),
      });
      if (res?.success) {
        const accs = Array.isArray(res.ad_accounts) ? res.ad_accounts : [];
        const pxs = Array.isArray(res.pixels) ? res.pixels : [];
        setDiscoveredAdAccounts(accs);
        setDiscoveredPixels(pxs);
        if (tokenToUse) setLastAutoDiscoveredToken(tokenToUse);
        setManualAdAccountMode(accs.length === 0);
        setManualPixelMode(false);
        setDiscoverStatusMsg({
          ok: true,
          text: res.message || `Tìm thấy ${accs.length} Tài khoản QC và ${pxs.length} Pixel.`,
        });

        // Auto-select first active account + its primary pixel when adding a new account
        if (accs.length > 0 && !editingAccountId && !accountFormId.trim()) {
          const preferred = accs.find((a: any) => a.account_status === 1) || accs[0];
          setAccountFormId(preferred.ad_account_id);
          if (!accountFormName.trim()) {
            setAccountFormName(preferred.name);
          }
          const firstPx = preferred.pixels?.[0]?.id || pxs[0]?.id || '';
          if (firstPx && !accountFormPixel.trim()) {
            setAccountFormPixel(firstPx);
          }
        }
      } else {
        setDiscoveredAdAccounts([]);
        setDiscoveredPixels([]);
        setDiscoverStatusMsg({
          ok: false,
          text: res?.message || res?.error || 'Không thể lấy danh sách từ Token này.',
        });
      }
    } catch (err: any) {
      setDiscoverStatusMsg({
        ok: false,
        text: err?.message || 'Lỗi kết nối Meta Graph API khi kiểm tra Token.',
      });
    } finally {
      setDiscoveringMetaAssets(false);
    }
  };

  useEffect(() => {
    const cleanToken = accountFormToken.trim();
    if (!configModalOpen || (!showAccountForm && metaAccounts.length > 0)) return;
    if (cleanToken.length < 40 || cleanToken === '__KEEP_EXISTING__' || cleanToken.includes('...')) return;
    if (cleanToken === lastAutoDiscoveredToken) return;
    const timer = setTimeout(() => {
      void discoverAssetsFromToken({ tokenOverride: cleanToken });
    }, 550);
    return () => clearTimeout(timer);
  }, [accountFormToken, configModalOpen, showAccountForm, metaAccounts.length, lastAutoDiscoveredToken]);

  const availableDiscoverPixels = useMemo(() => {
    const selectedAcc = discoveredAdAccounts.find((a) => a.ad_account_id === accountFormId.trim());
    const prioritized = selectedAcc?.pixels || [];
    const seen = new Set<string>();
    const combined: Array<{ id: string; name: string; sub: string }> = [];
    for (const p of prioritized) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        combined.push({ id: p.id, name: p.name, sub: `Pixel ID: ${p.id} (Thuộc TK đã chọn)` });
      }
    }
    for (const p of discoveredPixels) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        combined.push({
          id: p.id,
          name: p.name,
          sub: `Pixel ID: ${p.id}${p.source_account_name ? ` • ${p.source_account_name}` : ''}`,
        });
      }
    }
    return combined;
  }, [discoveredAdAccounts, discoveredPixels, accountFormId]);

  const openAddAccountForm = () => {
    setEditingAccountId(null);
    setAccountFormName('');
    setAccountFormId('');
    setAccountFormToken('');
    setAccountFormPixel('');
    resetDiscoveryState();
    setShowAccountForm(true);
  };

  const openEditAccountForm = (acc: (typeof metaAccounts)[number]) => {
    setEditingAccountId(acc.id);
    setAccountFormName(acc.name || '');
    setAccountFormId(acc.ad_account_id || '');
    setAccountFormToken('');
    setAccountFormPixel(acc.pixel_id || '');
    resetDiscoveryState();
    setShowAccountForm(true);
  };

  const handleSyncMetaAds = async () => {
    setSyncing(true);
    const toastId = toast.loading('Đang đồng bộ dữ liệu bài quảng cáo từ Meta...');
    try {
      const res = await fetchAPI('sync_meta_ads_data', {
        method: 'POST',
        body: JSON.stringify(adAccountFilter !== 'all' ? { ad_account_id: adAccountFilter } : {})
      });
      if (res?.success) {
        toast.success(
          res.message || `Đã đồng bộ ${res.synced_ads || 0} bài quảng cáo!`,
          { id: toastId }
        );
        await loadDashboard(true);
        await loadMetaConfig();
        if (viewMode === 'analytics') {
          await loadAnalyticsBreakdowns(true);
        }
      } else {
        toast.error(res?.error || res?.message || 'Đồng bộ thất bại', { id: toastId });
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối Meta API: ' + (err.message || ''), { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveMetaAccount = async (andSync = false) => {
    const cleanId = accountFormId.trim().replace(/^act_/i, '').replace(/\s+/g, '');
    if (!cleanId || !/^\d{5,}$/.test(cleanId)) {
      toast.error('Ad Account ID không hợp lệ (chỉ gồm chữ số từ 5 ký tự, VD: 302787476028580).');
      return;
    }
    if (!editingAccountId && !accountFormToken.trim()) {
      toast.error('Vui lòng nhập Meta Access Token cho tài khoản mới.');
      return;
    }

    setSavingConfig(true);
    const toastId = toast.loading(andSync ? 'Đang lưu & đồng bộ Meta Graph API...' : 'Đang lưu tài khoản Meta Ads...');
    try {
      const action = editingAccountId ? 'update_meta_ad_account' : 'add_meta_ad_account';
      const saveRes = await fetchAPI(action, {
        method: 'POST',
        body: JSON.stringify({
          id: editingAccountId || undefined,
          name: accountFormName.trim() || undefined,
          ad_account_id: cleanId,
          access_token: accountFormToken.trim() ? accountFormToken.trim() : '__KEEP_EXISTING__',
          pixel_id: accountFormPixel.trim(),
        })
      });
      if (!saveRes?.success) {
        toast.error(saveRes?.error || saveRes?.message || 'Không thể lưu tài khoản Meta Ads', { id: toastId });
        setSavingConfig(false);
        return;
      }

      if (andSync) {
        const syncRes = await fetchAPI('sync_meta_ads_data', {
          method: 'POST',
          body: JSON.stringify({ account_id: saveRes.account?.id || cleanId })
        });
        if (syncRes?.success) {
          toast.success(syncRes.message || `Đã lưu & đồng bộ ${syncRes.synced_ads || 0} bài quảng cáo!`, { id: toastId });
        } else {
          toast.error(syncRes?.error || syncRes?.message || 'Đã lưu TK nhưng đồng bộ Meta lỗi.', { id: toastId });
        }
      } else {
        toast.success(saveRes.message || 'Đã lưu tài khoản Meta Ads vào Vault!', { id: toastId });
      }

      setShowAccountForm(false);
      setEditingAccountId(null);
      setAccountFormToken('');
      await loadMetaConfig();
      await loadDashboard(true);
    } catch (err: any) {
      toast.error('Lỗi lưu tài khoản: ' + (err.message || ''), { id: toastId });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleToggleMetaAccount = async (acc: (typeof metaAccounts)[number]) => {
    try {
      const res = await fetchAPI('toggle_meta_ad_account', {
        method: 'POST',
        body: JSON.stringify({ id: acc.id, is_active: !acc.is_active })
      });
      if (res?.success) {
        toast.success(res.message);
        await loadMetaConfig();
      } else {
        toast.error(res?.message || 'Không thể đổi trạng thái');
      }
    } catch {
      toast.error('Lỗi kết nối Server');
    }
  };

  const handleSyncSingleAccount = async (acc: (typeof metaAccounts)[number]) => {
    setSyncingAccountId(acc.id);
    const toastId = toast.loading(`Đang đồng bộ ${acc.name} (act_${acc.ad_account_id})...`);
    try {
      const res = await fetchAPI('sync_meta_ads_data', {
        method: 'POST',
        body: JSON.stringify({ account_id: acc.id })
      });
      if (res?.success) {
        toast.success(res.message || `Đã đồng bộ ${res.synced_ads || 0} bài QC!`, { id: toastId });
        await loadMetaConfig();
        await loadDashboard(true);
      } else {
        toast.error(res?.message || 'Đồng bộ thất bại', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi đồng bộ', { id: toastId });
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleDeleteMetaAccount = async (id: string) => {
    try {
      const target = metaAccounts.find((a) => a.id === id);
      const res = await fetchAPI('delete_meta_ad_account', {
        method: 'POST',
        body: JSON.stringify({ id, purge_insights: purgeOnDelete })
      });
      if (res?.success) {
        toast.success(res.message);
        setConfirmDeleteId(null);
        setPurgeOnDelete(false);
        if (target && adAccountFilter === target.ad_account_id) {
          setAdAccountFilter('all');
        }
        await loadMetaConfig();
        await loadDashboard(true);
      } else {
        toast.error(res?.message || 'Không thể xóa tài khoản');
      }
    } catch {
      toast.error('Lỗi kết nối Server');
    }
  };

  const filteredAds = useMemo(() => {
    return (Array.isArray(ads) ? ads : []).filter((ad) => {
      if (tierFilter === 'with_leads' && ad.total_leads === 0) return false;
      if (tierFilter === 'excellent' && ad.rating_tier !== 'excellent') return false;
      if (tierFilter === 'good' && ad.rating_tier !== 'good' && ad.rating_tier !== 'excellent') return false;
      if (tierFilter === 'poor' && ad.rating_tier !== 'poor') return false;
      if (tierFilter === 'scale_best' && !(ad.smart_badges || []).some((b) => b.key === 'scale' || b.key === 'best')) return false;
      if (tierFilter === 'high_cpl' && !(ad.smart_badges || []).some((b) => b.key === 'review')) return false;
      if (tierFilter === 'fatigue' && !(ad.smart_badges || []).some((b) => b.key === 'fatigue')) return false;
      if (tierFilter === 'active_ads' && (ad.status || '').toUpperCase() !== 'ACTIVE') return false;

      if (pipelineFilter !== 'all') {
        const key = pipelineFilter as keyof AdPerformanceRow['pipeline'];
        if (!ad.pipeline[key] || ad.pipeline[key] <= 0) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchAd =
          (ad.ad_name || '').toLowerCase().includes(q) ||
          (ad.ad_id || '').toLowerCase().includes(q) ||
          (ad.campaign_name || '').toLowerCase().includes(q) ||
          (ad.adset_name || '').toLowerCase().includes(q);
        const matchLead = (ad.leads || []).some(
          (l) =>
            (l.name || '').toLowerCase().includes(q) ||
            (l.phone || '').toLowerCase().includes(q) ||
            (l.assigned_to_name || '').toLowerCase().includes(q)
        );
        if (!matchAd && !matchLead) return false;
      }
      return true;
    });
  }, [ads, tierFilter, pipelineFilter, searchTerm]);

  const toggleSelectAd = (adId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAdIds((prev) =>
      prev.includes(adId) ? prev.filter((id) => id !== adId) : [...prev, adId]
    );
  };

  const selectedAdsObjects = useMemo(() => {
    return ads.filter((a) => selectedAdIds.includes(a.ad_id));
  }, [ads, selectedAdIds]);

  const selectionSummary = useMemo(() => {
    if (selectedAdsObjects.length === 0) return null;
    let spend = 0;
    let leads = 0;
    let good = 0;
    let imp = 0;
    let clk = 0;
    let rch = 0;
    selectedAdsObjects.forEach((a) => {
      spend += a.spend || 0;
      leads += a.total_leads || 0;
      good += a.positive_leads || 0;
      imp += a.impressions || 0;
      clk += a.clicks || 0;
      rch += a.reach || 0;
    });
    return {
      count: selectedAdsObjects.length,
      spend,
      leads,
      good,
      good_rate: leads > 0 ? Math.round((good / leads) * 1000) / 10 : 0,
      cpl: leads > 0 && spend > 0 ? Math.round(spend / leads) : 0,
      cpql: good > 0 && spend > 0 ? Math.round(spend / good) : 0,
      cpm: imp > 0 && spend > 0 ? Math.round((spend / imp) * 1000) : 0,
      ctr: imp > 0 ? Math.round((clk / imp) * 10000) / 100 : 0,
      freq: rch > 0 ? Math.round((imp / rch) * 100) / 100 : 0
    };
  }, [selectedAdsObjects]);

  const paginatedAds = useMemo(() => {
    const start = (adsPage - 1) * ADS_PAGE_SIZE;
    return filteredAds.slice(start, start + ADS_PAGE_SIZE);
  }, [filteredAds, adsPage]);

  const flattenedLeads = useMemo(() => {
    const list: Array<AdLeadItem & {
      ad_id: string;
      ad_name: string;
      campaign_name: string;
      adset_name: string;
      thumbnail_url: string;
      rating_label: string;
      rating_tier: string;
    }> = [];

    filteredAds.forEach((ad) => {
      (ad.leads || []).forEach((lead) => {
        if (pipelineFilter !== 'all' && lead.quality_status !== pipelineFilter) {
          return;
        }
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const ok =
            (lead.name || '').toLowerCase().includes(q) ||
            (lead.phone || '').toLowerCase().includes(q) ||
            (lead.assigned_to_name || '').toLowerCase().includes(q) ||
            (ad.ad_name || '').toLowerCase().includes(q) ||
            (ad.ad_id || '').toLowerCase().includes(q) ||
            (ad.campaign_name || '').toLowerCase().includes(q);
          if (!ok) return;
        }
        list.push({
          ...lead,
          ad_id: ad.ad_id,
          ad_name: ad.ad_name,
          campaign_name: ad.campaign_name,
          adset_name: ad.adset_name,
          thumbnail_url: ad.thumbnail_url || ad.image_url,
          rating_label: ad.rating_label,
          rating_tier: ad.rating_tier
        });
      });
    });

    return list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }, [filteredAds, pipelineFilter, searchTerm]);

  const paginatedLeads = useMemo(() => {
    const start = (leadsPage - 1) * LEADS_PAGE_SIZE;
    return flattenedLeads.slice(start, start + LEADS_PAGE_SIZE);
  }, [flattenedLeads, leadsPage]);

  const toggleExpandAd = (adId: string) => {
    setExpandedAdIds((prev) => ({ ...prev, [adId]: !prev[adId] }));
  };

  const getDrawerPage = (adId: string) => drawerPages[adId] || 1;
  const setDrawerPage = (adId: string, page: number) => {
    setDrawerPages((prev) => ({ ...prev, [adId]: page }));
  };

  const getTierBadgeStyle = (tier: AdPerformanceRow['rating_tier']) => {
    switch (tier) {
      case 'excellent':
        return {
          bg: 'linear-gradient(135deg, rgba(22, 163, 74, 0.14) 0%, rgba(16, 185, 129, 0.22) 100%)',
          color: '#15803d',
          border: '1px solid rgba(22, 163, 74, 0.35)'
        };
      case 'good':
        return {
          bg: 'rgba(37, 99, 235, 0.1)',
          color: '#1d4ed8',
          border: '1px solid rgba(37, 99, 235, 0.25)'
        };
      case 'poor':
        return {
          bg: 'rgba(220, 38, 38, 0.1)',
          color: '#b91c1c',
          border: '1px solid rgba(220, 38, 38, 0.25)'
        };
      case 'pending':
        return {
          bg: 'rgba(217, 119, 6, 0.1)',
          color: '#b45309',
          border: '1px solid rgba(217, 119, 6, 0.25)'
        };
      default:
        return {
          bg: 'var(--color-bg)',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border)'
        };
    }
  };

  const cleanRatingLabel = (label: string) => {
    if (!label) return '';
    return label
      .replace(/[🔥✅⏳⚠️]/gu, '')
      .replace(/Bài QC Ngon/gi, 'Hiệu quả cao')
      .replace(/Chờ ĐL đánh giá/gi, 'Chờ đánh giá')
      .trim();
  };

  return (
    <div style={{ padding: '1rem 1.25rem 2rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(30, 64, 255, 0.25)'
          }}>
            <Megaphone size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                Hiệu Suất Quảng Cáo & Đối Chiếu Lead
              </h1>
              <ScreenHelpButton screenKey={viewMode === 'capi' ? 'ads_capi' : 'ads_performance'} size="sm" />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {metaAccounts.length === 0 ? (
                <span style={{ color: '#d97706', fontWeight: 600 }}>Chưa kết nối Tài khoản Meta Ads</span>
              ) : metaAccounts.length === 1 ? (
                <span>TK: <strong style={{ color: 'var(--color-text)' }}>{metaAccounts[0].name} (act_{metaAccounts[0].ad_account_id})</strong></span>
              ) : (
                <span>
                  Đang kết nối <strong style={{ color: 'var(--color-text)' }}>{metaAccounts.filter(a => a.is_active).length}/{metaAccounts.length} TK Meta Ads</strong>
                  {adAccountFilter !== 'all' && ` • Đang lọc: act_${adAccountFilter}`}
                </span>
              )}
              {lastSyncAt && (
                <>
                  <span>•</span>
                  <span>Cập nhật: {lastSyncAt}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div data-tour="ads-export" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {metaAccounts.length > 0 && (
            <div style={{ minWidth: 195 }}>
              <CustomSelect
                value={adAccountFilter}
                onChange={(val) => setAdAccountFilter(String(val))}
                options={[
                  { value: 'all', label: `Tất cả TK QC (${metaAccounts.length})` },
                  ...metaAccounts.map((acc) => ({
                    value: acc.ad_account_id,
                    label: `${acc.name} (${acc.ad_account_id.slice(-6)})`
                  }))
                ]}
              />
            </div>
          )}

          <div style={{ minWidth: 165 }}>
            <CustomSelect
              value={dateFilter}
              onChange={handleUpdateDateFilter}
              options={[
                { value: 'all', label: 'Tất cả thời gian' },
                { value: 'today', label: 'Hôm nay' },
                { value: 'yesterday', label: 'Hôm qua' },
                { value: '7days', label: '7 ngày qua' },
                { value: '30days', label: '30 ngày qua' },
                { value: 'this_month', label: 'Tháng này' },
                { value: 'last_month', label: 'Tháng trước' }
              ]}
            />
          </div>

          <button
            type="button"
            onClick={handleSyncMetaAds}
            disabled={syncing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '0.5rem 0.85rem',
              borderRadius: 9,
              border: '1px solid rgba(30, 64, 255, 0.35)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: syncing ? 'not-allowed' : 'pointer',
              opacity: syncing ? 0.7 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            <RefreshCw size={14} className={syncing ? 'spin' : ''} />
            {syncing ? 'Đang đồng bộ...' : 'Đồng bộ Meta'}
          </button>

          <button
            type="button"
            onClick={() => {
              loadMetaConfig();
              setConfigModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '0.5rem 0.9rem',
              borderRadius: 9,
              border: 'none',
              background: 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(30, 64, 255, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <KeyRound size={14} />
            Quản lý TK Meta ({metaAccounts.length})
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div data-tour="ads-summary" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '0.75rem',
        marginBottom: '0.85rem'
      }}>
        {loading && !summary ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 13,
              padding: '0.85rem 1rem',
              minWidth: 0
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Tổng Lead Từ QC
                </span>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(30, 64, 255, 0.12)', color: '#1E40FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={14} />
                </div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
                {summary?.total_ad_leads ?? 0} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Lead</span>
              </div>
              <div style={{ fontSize: '0.71rem', color: 'var(--color-text-muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Từ <strong style={{ color: 'var(--color-text)' }}>{summary?.ads_with_leads ?? 0}</strong> / {summary?.total_ads_tracked ?? 0} bài quảng cáo
              </div>
            </div>

            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid rgba(22, 163, 74, 0.28)',
              borderRadius: 13,
              padding: '0.85rem 1rem',
              minWidth: 0
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                  Lead Chất Lượng
                </span>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(22, 163, 74, 0.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Flame size={14} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', lineHeight: 1.2 }}>
                  {summary?.total_positive_leads ?? 0}
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '1px 7px', borderRadius: 12, background: 'rgba(22, 163, 74, 0.12)', color: '#15803d' }}>
                  {summary?.overall_positive_rate ?? 0}% ĐG
                </span>
              </div>
              <div style={{ fontSize: '0.71rem', color: 'var(--color-text-muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                TC: <strong>{summary?.pipeline_totals?.Qualified ?? 0}</strong> • Hẹn: <strong>{summary?.pipeline_totals?.Booked ?? 0}</strong> • Book/Cọc/Chốt: <strong>{(summary?.pipeline_totals?.Booking ?? 0) + (summary?.pipeline_totals?.Deposited ?? 0) + (summary?.pipeline_totals?.Closed ?? 0)}</strong>
              </div>
            </div>

            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 13,
              padding: '0.85rem 1rem',
              minWidth: 0
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                  KNM & Sai Đối Tượng
                </span>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={14} />
                </div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', lineHeight: 1.2 }}>
                {summary?.total_negative_leads ?? 0} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Lead</span>
              </div>
              <div style={{ fontSize: '0.71rem', color: 'var(--color-text-muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                KNM: <strong>{summary?.pipeline_totals.NoAnswer ?? 0}</strong> • Notlead: <strong>{summary?.pipeline_totals.Notlead ?? 0}</strong> • Chưa ĐG: <strong>{summary?.pipeline_totals.unrated ?? 0}</strong>
              </div>
            </div>

            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 13,
              padding: '0.85rem 1rem',
              minWidth: 0
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Chi Phí / CPL Trung Bình
                </span>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <DollarSign size={14} />
                </div>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.25 }} title={formatVND(summary?.avg_cpl ?? 0)}>
                CPL: {formatCompactVND(summary?.avg_cpl ?? 0)}
              </div>
              <div style={{ fontSize: '0.71rem', color: 'var(--color-text-muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={formatVND(summary?.avg_cpql ?? 0)}>
                CP / Lead chất lượng: <strong style={{ color: '#16a34a' }}>{formatCompactVND(summary?.avg_cpql ?? 0)}</strong>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Unified Compact Toolbar: Mode Tabs + Meta Goal Filter + Pipeline Pills + Search + Tier Select */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 13,
        padding: '0.75rem 0.9rem',
        marginBottom: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}>
        {/* Row 1: View Switcher + Search + Meta Goal Select + Tier Filter */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10
        }}>
          {/* Mode Tabs */}
          <div style={{
            display: 'inline-flex',
            background: 'var(--color-bg)',
            padding: 3,
            borderRadius: 10,
            border: '1px solid var(--color-border)',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('pipeline')}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: 'none',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: viewMode === 'pipeline' ? 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)' : 'transparent',
                color: viewMode === 'pipeline' ? '#fff' : 'var(--color-text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap'
              }}
            >
              <Award size={14} />
              Theo Bài Quảng Cáo ({filteredAds.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('leads')}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: 'none',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: viewMode === 'leads' ? 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)' : 'transparent',
                color: viewMode === 'leads' ? '#fff' : 'var(--color-text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap'
              }}
            >
              <Layers size={14} />
              Đối Chiếu Từng Lead ({flattenedLeads.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('analytics')}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: 'none',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: viewMode === 'analytics' ? 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)' : 'transparent',
                color: viewMode === 'analytics' ? '#fff' : 'var(--color-text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap'
              }}
            >
              <BarChart3 size={14} />
              Báo Cáo & Biểu Đồ Meta
            </button>
            <button
              type="button"
              onClick={() => setViewMode('capi')}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: 'none',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: viewMode === 'capi' ? 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)' : 'transparent',
                color: viewMode === 'capi' ? '#fff' : 'var(--color-text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap'
              }}
            >
              <Zap size={14} />
              CAPI & Học Tệp Meta
            </button>
          </div>

          {/* Search & Meta Goal & Tier Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            {viewMode !== 'analytics' && viewMode !== 'capi' && (
              <div style={{ position: 'relative', minWidth: 200, maxWidth: 280, flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên bài QC, ID, khách, SĐT, đại lý..."
                  style={{
                    width: '100%',
                    padding: '7px 10px 7px 31px',
                    borderRadius: 9,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontSize: '0.77rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {/* Meta Optimization Goal Filter (DOMATION_META goalMapping) */}
            {viewMode !== 'capi' && (
              <div style={{ minWidth: 185 }} title="Lọc theo Meta Optimization Goal (adset.optimization_goal)">
                <CustomSelect
                  value={goalFilter}
                  onChange={(v) => setGoalFilter(String(v))}
                  options={[
                    { value: 'Lead Form', label: 'Meta Goal: Lead Form' },
                    { value: 'all', label: 'Meta Goal: Tất cả' },
                    { value: 'Message', label: 'Meta Goal: Tin nhắn (Msg)' },
                    { value: 'Engagement', label: 'Meta Goal: Tương tác' },
                    { value: 'Traffic', label: 'Meta Goal: Traffic / Click' },
                    { value: 'Awareness', label: 'Meta Goal: Tiếp cận / Reach' },
                    { value: 'Pagelike', label: 'Meta Goal: Thích trang' }
                  ]}
                />
              </div>
            )}

            {viewMode !== 'analytics' && viewMode !== 'capi' && (
              <div style={{ minWidth: 185 }}>
                <CustomSelect
                  value={tierFilter}
                  onChange={(v) => setTierFilter(String(v))}
                  options={[
                    { value: 'with_leads', label: 'Bài QC có sinh Lead' },
                    { value: 'all', label: 'Tất cả bài QC' },
                    { value: 'scale_best', label: 'Đề xuất Scale / Tối ưu' },
                    { value: 'excellent', label: 'Hiệu quả cao' },
                    { value: 'good', label: 'Tiềm năng' },
                    { value: 'poor', label: 'Cần tối ưu' },
                    { value: 'high_cpl', label: 'Cảnh báo CPL Cao' },
                    { value: 'fatigue', label: 'Tần suất cao (≥ 2.8)' },
                    { value: 'active_ads', label: 'Đang bật (ACTIVE)' }
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Pipeline Quick Filter Pills */}
        {viewMode !== 'capi' && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
          paddingTop: '0.55rem',
          borderTop: '1px dashed var(--color-border-light)'
        }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginRight: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Filter size={12} /> Pipeline:
          </span>
          <button
            type="button"
            onClick={() => setPipelineFilter('all')}
            style={{
              padding: '3px 9px',
              borderRadius: 16,
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: pipelineFilter === 'all' ? '1px solid #1E40FF' : '1px solid var(--color-border)',
              background: pipelineFilter === 'all' ? 'rgba(30, 64, 255, 0.14)' : 'var(--color-bg)',
              color: pipelineFilter === 'all' ? '#1E40FF' : 'var(--color-text)'
            }}
          >
            Tất cả ({summary?.total_ad_leads ?? 0})
          </button>
          {pipelineColumns.map((col) => {
            const count = summary?.pipeline_totals?.[col.key] ?? 0;
            const active = pipelineFilter === col.key;
            return (
              <button
                key={col.key}
                type="button"
                onClick={() => setPipelineFilter(active ? 'all' : col.key)}
                style={{
                  padding: '3px 9px',
                  borderRadius: 16,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: active ? `1.5px solid ${col.color}` : `1px solid ${col.border}`,
                  background: active ? col.bg : 'var(--color-bg)',
                  color: col.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>{col.label}</span>
                <span style={{
                  padding: '0px 5px',
                  borderRadius: 8,
                  background: col.bg,
                  fontSize: '0.67rem',
                  fontWeight: 800
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        )}
      </div>

      {/* Main Content */}
      {loading && ads.length === 0 && viewMode !== 'analytics' && viewMode !== 'capi' ? (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
          width: '100%'
        }}>
          <div style={{ padding: '12px 14px', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '26% 14% 6% repeat(9, 1fr) 8%', gap: 8 }}>
            {Array.from({ length: 13 }).map((_, i) => (
              <Skeleton key={i} width="80%" height={12} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {Array.from({ length: 6 }).map((_, rIdx) => (
              <div
                key={rIdx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '26% 14% 6% repeat(9, 1fr) 8%',
                  gap: 8,
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderBottom: rIdx < 5 ? '1px solid var(--color-border-light)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Skeleton width={40} height={40} borderRadius={8} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton width="88%" height={14} />
                    <Skeleton width="62%" height={11} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton width={95} height={18} borderRadius={12} />
                  <Skeleton width="78%" height={12} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Skeleton width={28} height={24} borderRadius={7} />
                </div>
                {Array.from({ length: 9 }).map((__, cIdx) => (
                  <div key={cIdx} style={{ display: 'flex', justifyContent: 'center' }}>
                    <Skeleton width={22} height={16} borderRadius={4} />
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Skeleton width={64} height={26} borderRadius={7} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === 'pipeline' ? (
        <div data-tour="ads-table" style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
          width: '100%'
        }}>
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <colgroup>
              <col style={{ width: '26%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '5.5%' }} />
              {pipelineColumns.map((col) => (
                <col key={col.key} style={{ width: '5.2%' }} />
              ))}
              <col style={{ width: '7.7%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontSize: '0.67rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Bài Quảng Cáo
                </th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.67rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', borderLeft: '1px solid var(--color-border-light)' }}>
                  Hiệu Suất & Chi Phí
                </th>
                <th style={{ padding: '10px 4px', textAlign: 'center', fontSize: '0.67rem', fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', borderLeft: '1px solid var(--color-border-light)' }}>
                  Tổng
                </th>
                {pipelineColumns.map((col) => (
                  <th
                    key={col.key}
                    title={col.label}
                    style={{
                      padding: '10px 2px',
                      textAlign: 'center',
                      fontSize: '0.64rem',
                      fontWeight: 800,
                      color: col.color,
                      textTransform: 'uppercase',
                      background: col.bg,
                      borderLeft: '1px solid var(--color-border-light)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {col.shortLabel}
                  </th>
                ))}
                <th style={{ padding: '10px 6px', textAlign: 'center', fontSize: '0.67rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', borderLeft: '1px solid var(--color-border-light)' }}>
                  Chi Tiết
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedAds.length === 0 ? (
                <tr className="no-row-hover">
                  <td colSpan={13} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.84rem' }}>
                    Không có bài quảng cáo nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedAds.map((ad) => {
                  const isExpanded = !!expandedAdIds[ad.ad_id];
                  const tierStyle = getTierBadgeStyle(ad.rating_tier);
                  const thumb = ad.thumbnail_url || ad.image_url;

                  const drawerLeads = (ad.leads || []).filter((l) => {
                    if (pipelineFilter !== 'all' && l.quality_status !== pipelineFilter) return false;
                    return true;
                  });
                  const currentDrawerPage = getDrawerPage(ad.ad_id);
                  const drawerTotalPages = Math.max(1, Math.ceil(drawerLeads.length / DRAWER_PAGE_SIZE));
                  const safeDrawerPage = Math.min(currentDrawerPage, drawerTotalPages);
                  const visibleDrawerLeads = drawerLeads.slice(
                    (safeDrawerPage - 1) * DRAWER_PAGE_SIZE,
                    safeDrawerPage * DRAWER_PAGE_SIZE
                  );

                  return (
                    <React.Fragment key={ad.ad_id}>
                      <tr
                        onClick={() => {
                          if (ad.total_leads > 0) toggleExpandAd(ad.ad_id);
                        }}
                        style={{
                          borderBottom: '1px solid var(--color-border-light)',
                          background: selectedAdIds.includes(ad.ad_id)
                            ? 'rgba(37, 99, 235, 0.05)'
                            : isExpanded
                            ? 'rgba(30, 64, 255, 0.05)'
                            : 'transparent',
                          cursor: ad.total_leads > 0 ? 'pointer' : 'default',
                          transition: 'background 0.15s'
                        }}
                      >
                        {/* Ad Info + Checkbox + Self-Healing Thumbnail + Right Eye Badge */}
                        <td style={{ padding: '9px 10px', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={selectedAdIds.includes(ad.ad_id)}
                              onClick={(e) => toggleSelectAd(ad.ad_id, e)}
                              onChange={() => {}}
                              title="Chọn bài QC để tính tổng hoặc So sánh VS"
                              style={{
                                width: 14,
                                height: 14,
                                accentColor: '#1E40FF',
                                cursor: 'pointer',
                                flexShrink: 0,
                                margin: 0
                              }}
                            />
                            <AdThumbnail
                              adId={ad.ad_id}
                              src={thumb}
                              alt={ad.ad_name}
                              size={40}
                              borderRadius={8}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewAd({ adId: ad.ad_id, adName: ad.ad_name, thumb });
                              }}
                            />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontSize: '0.79rem',
                                  fontWeight: 600,
                                  color: 'var(--color-text)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                title={ad.ad_name}
                              >
                                {ad.ad_name || `Ad #${ad.ad_id}`}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.68rem',
                                  color: 'var(--color-text-muted)',
                                  marginTop: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  minWidth: 0
                                }}
                              >
                                {ad.goal_group && (goalFilter === 'all' || ad.goal_group !== 'Lead Form') && (
                                  <span style={{
                                    padding: '0px 5px',
                                    borderRadius: 4,
                                    fontSize: '0.6rem',
                                    fontWeight: 800,
                                    background: ad.goal_group === 'Lead Form' ? 'rgba(22, 163, 74, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                                    color: ad.goal_group === 'Lead Form' ? '#16a34a' : '#2563eb',
                                    flexShrink: 0
                                  }}>
                                    {ad.goal_group}
                                  </span>
                                )}
                                <span
                                  style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}
                                  title={`${ad.campaign_name || ''}${ad.adset_name ? ` • ${ad.adset_name}` : ''}`}
                                >
                                  {ad.campaign_name || ad.adset_name || 'Meta Lead Ads'}
                                </span>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(ad.ad_id);
                                    setCopiedId(ad.ad_id);
                                    setTimeout(() => setCopiedId(null), 1500);
                                  }}
                                  title={`Copy Ad ID: ${ad.ad_id}`}
                                  style={{
                                    fontSize: '0.64rem',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                  }}
                                >
                                  #{ad.ad_id.slice(-6)} {copiedId === ad.ad_id ? <Check size={9} color="#16a34a" /> : <Copy size={9} />}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewAd({ adId: ad.ad_id, adName: ad.ad_name, thumb });
                              }}
                              title="Mở Iframe & Phân tích sâu Bài Quảng Cáo"
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 7,
                                border: '1px solid rgba(30, 64, 255, 0.35)',
                                background: 'rgba(30, 64, 255, 0.12)',
                                color: '#1E40FF',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                                padding: 0
                              }}
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        </td>

                        {/* Rating + Smart Diagnostic Badges + Spend / CPL Combined */}
                        <td style={{ padding: '9px 8px', borderLeft: '1px solid var(--color-border-light)', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 7px',
                              borderRadius: 12,
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              background: tierStyle.bg,
                              color: tierStyle.color,
                              border: tierStyle.border,
                              whiteSpace: 'nowrap'
                            }}>
                              {cleanRatingLabel(ad.rating_label)}
                            </span>
                            {ad.total_leads > 0 && (
                              <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>
                                {ad.positive_rate}% ({ad.positive_leads}/{ad.rated_leads || ad.total_leads})
                              </span>
                            )}
                            {(ad.smart_badges || []).slice(0, 2).map((b) => {
                              const toneStyle =
                                b.key === 'scale' || b.key === 'best'
                                  ? { bg: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', border: 'rgba(22, 163, 74, 0.25)' }
                                  : b.key === 'review'
                                  ? { bg: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: 'rgba(220, 38, 38, 0.25)' }
                                  : b.key === 'fatigue'
                                  ? { bg: 'rgba(217, 119, 6, 0.1)', color: '#d97706', border: 'rgba(217, 119, 6, 0.25)' }
                                  : b.key === 'learning'
                                  ? { bg: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', border: 'rgba(37, 99, 235, 0.25)' }
                                  : { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', border: 'rgba(100, 116, 139, 0.25)' };
                              return (
                                <span
                                  key={b.key}
                                  title={b.title}
                                  style={{
                                    padding: '1px 6px',
                                    borderRadius: 10,
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    background: toneStyle.bg,
                                    color: toneStyle.color,
                                    border: `1px solid ${toneStyle.border}`,
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {b.label}
                                </span>
                              );
                            })}
                          </div>
                          <div
                            style={{
                              fontSize: '0.68rem',
                              color: 'var(--color-text-muted)',
                              marginTop: 4,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={`Chi tiêu: ${formatVND(ad.spend)} • CPL: ${formatVND(ad.cpl)}${ad.frequency ? ` • Tần suất: ${ad.frequency}` : ''}`}
                          >
                            Chi: <strong style={{ color: 'var(--color-text)' }}>{formatCompactVND(ad.spend)}</strong>
                            {ad.cpl > 0 ? ` • CPL: ${formatCompactVND(ad.cpl)}` : ''}
                            {(ad.frequency ?? 0) >= 2.2 ? ` • F:${Number(ad.frequency).toFixed(1)}` : ''}
                          </div>
                        </td>

                        {/* Total Leads */}
                        <td style={{ padding: '9px 4px', textAlign: 'center', borderLeft: '1px solid var(--color-border-light)' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 28,
                            height: 24,
                            padding: '0 6px',
                            borderRadius: 6,
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            background: ad.total_leads > 0 ? 'rgba(30, 64, 255, 0.14)' : 'var(--color-bg)',
                            color: ad.total_leads > 0 ? '#1E40FF' : 'var(--color-text-muted)'
                          }}>
                            {ad.total_leads}
                          </span>
                        </td>

                        {/* 9 Pipeline Columns */}
                        {pipelineColumns.map((col) => {
                          const val = ad.pipeline[col.key] || 0;
                          return (
                            <td
                              key={col.key}
                              className={val > 0 ? 'keep-cell-bg' : ''}
                              style={{
                                padding: '9px 2px',
                                textAlign: 'center',
                                borderLeft: '1px solid var(--color-border-light)',
                                background: val > 0 ? col.bg : 'transparent'
                              }}
                            >
                              <span style={{
                                fontWeight: val > 0 ? 800 : 500,
                                fontSize: val > 0 ? '0.82rem' : '0.73rem',
                                color: val > 0 ? col.color : 'var(--color-text-muted)',
                                opacity: val > 0 ? 1 : 0.4
                              }}>
                                {val}
                              </span>
                            </td>
                          );
                        })}

                        {/* Compact Expand Leads Button */}
                        <td style={{ padding: '9px 6px', textAlign: 'center', borderLeft: '1px solid var(--color-border-light)' }}>
                          {ad.total_leads > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandAd(ad.ad_id);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 3,
                                padding: '4px 8px',
                                borderRadius: 7,
                                border: '1px solid var(--color-border)',
                                background: isExpanded ? '#1E40FF' : 'var(--color-bg)',
                                color: isExpanded ? '#fff' : 'var(--color-text)',
                                fontSize: '0.69rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <span>{isExpanded ? 'Đóng' : `Xem (${ad.total_leads})`}</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>-</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Lead Cross-Reference Drawer */}
                      {isExpanded && drawerLeads.length > 0 && (
                        <tr className="no-row-hover" style={{ cursor: 'default' }}>
                          <td
                            colSpan={13}
                            className="keep-cell-bg"
                            style={{
                              padding: '4px 12px 12px 12px',
                              background: 'rgba(30, 64, 255, 0.03)',
                              borderBottom: '2px solid rgba(30, 64, 255, 0.22)'
                            }}
                          >
                            <div style={{
                              background: 'var(--color-surface)',
                              border: '1px solid rgba(30, 64, 255, 0.28)',
                              borderRadius: 10,
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                padding: '7px 12px',
                                background: 'rgba(30, 64, 255, 0.08)',
                                borderBottom: '1px solid rgba(30, 64, 255, 0.18)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 8
                              }}>
                                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                  <Sparkles size={13} color="#1E40FF" style={{ flexShrink: 0 }} />
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    Danh sách {drawerLeads.length} Lead từ bài QC: <strong style={{ color: '#1E40FF' }}>{ad.ad_name}</strong>
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                  {drawerTotalPages > 1 && (
                                    <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                      Trang {safeDrawerPage}/{drawerTotalPages}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setPreviewAd({ adId: ad.ad_id, adName: ad.ad_name, thumb })}
                                    title="Mở Iframe Bài Quảng Cáo"
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 6,
                                      border: 'none',
                                      background: '#1E40FF',
                                      color: '#fff',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      padding: 0
                                    }}
                                  >
                                    <Eye size={13} />
                                  </button>
                                </div>
                              </div>

                              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                                <colgroup>
                                  <col style={{ width: '20%' }} />
                                  <col style={{ width: '13%' }} />
                                  <col style={{ width: '23%' }} />
                                  <col style={{ width: '16%' }} />
                                  <col style={{ width: '16%' }} />
                                  <col style={{ width: '12%' }} />
                                </colgroup>
                                <thead>
                                  <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
                                    <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>KHÁCH HÀNG</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>SỐ ĐT</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>ĐẠI LÝ NHẬN</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>PIPELINE</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>GHI CHÚ ĐL / AI</th>
                                    <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>THỜI GIAN</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {visibleDrawerLeads.map((l) => (
                                    <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border-light)', cursor: 'default' }}>
                                      <td style={{ padding: '7px 10px', fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                          <Avatar name={l.name} size={22} />
                                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={l.name}>
                                            {l.name}
                                          </span>
                                        </div>
                                      </td>
                                      <td style={{ padding: '7px 8px', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                                        {l.phone}
                                      </td>
                                      <td style={{ padding: '7px 8px', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                                          <Avatar src={l.assigned_to_avatar || undefined} name={l.assigned_to_name} size={20} />
                                          <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`${l.assigned_to_name} (${l.round_name})`}>
                                            {l.assigned_to_name}
                                          </span>
                                        </div>
                                      </td>
                                      <td style={{ padding: '7px 8px', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                                          <LeadQualityBadge status={l.quality_status === 'unrated' ? null : l.quality_status} note={l.quality_note} showNote={false} />
                                          {l.capi_last_event ? (
                                            <span
                                              title={`Đã gửi ${l.capi_last_event} (HTTP ${l.capi_last_status}) lúc ${l.capi_sent_at || ''}`}
                                              style={{
                                                padding: '1px 5px',
                                                borderRadius: 5,
                                                fontSize: '0.6rem',
                                                fontWeight: 700,
                                                background: (l.capi_last_status ?? 0) >= 200 && (l.capi_last_status ?? 0) < 300 ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                                                color: (l.capi_last_status ?? 0) >= 200 && (l.capi_last_status ?? 0) < 300 ? '#15803d' : '#dc2626'
                                              }}
                                            >
                                              CAPI: {l.capi_last_event}
                                            </span>
                                          ) : (l.quality_status && ['Qualified', 'Booked', 'Booking', 'Deposited', 'Closed', 'Notlead'].includes(l.quality_status)) ? (
                                            <button
                                              type="button"
                                              onClick={() => handleSendSingleLeadCapi(l.id, l.quality_status)}
                                              disabled={sendingLeadCapiId === l.id}
                                              title="Gửi CAPI cho Lead này"
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 3,
                                                padding: '1px 6px',
                                                borderRadius: 5,
                                                border: '1px solid rgba(30, 64, 255, 0.4)',
                                                background: 'rgba(30, 64, 255, 0.12)',
                                                color: '#1E3A8A',
                                                fontSize: '0.61rem',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                              }}
                                            >
                                              <Send size={9} />
                                              {sendingLeadCapiId === l.id ? '...' : 'Bắn CAPI'}
                                            </button>
                                          ) : null}
                                        </div>
                                      </td>
                                      <td
                                        style={{
                                          padding: '7px 8px',
                                          color: 'var(--color-text-muted)',
                                          whiteSpace: 'normal',
                                          wordBreak: 'break-word',
                                          overflowWrap: 'anywhere',
                                          lineHeight: 1.38,
                                          fontSize: '0.72rem'
                                        }}
                                        title={l.quality_note || l.ai_evaluation || ''}
                                      >
                                        {l.quality_note || l.ai_evaluation || '-'}
                                      </td>
                                      <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                                        {l.created_at}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              {/* Compact Drawer Pagination Bar */}
                              <CompactPaginationBar
                                currentPage={safeDrawerPage}
                                totalItems={drawerLeads.length}
                                pageSize={DRAWER_PAGE_SIZE}
                                onPageChange={(p) => setDrawerPage(ad.ad_id, p)}
                                unitLabel="Lead"
                                compact={true}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Main Ads Table Pagination Bar */}
          <CompactPaginationBar
            currentPage={adsPage}
            totalItems={filteredAds.length}
            pageSize={ADS_PAGE_SIZE}
            onPageChange={setAdsPage}
            unitLabel="bài quảng cáo"
          />
        </div>
      ) : viewMode === 'analytics' ? (
        /* View Mode 3: Deep Meta Ads Analytics & Charts Panel (DOMATION_META Integration) */
        <AdsAnalyticsPanel
          analytics={analyticsData}
          loading={loadingAnalytics}
          dailyTrend={dailyTrend}
          goalBreakdown={goalBreakdown}
          onRefresh={() => loadAnalyticsBreakdowns(true)}
        />
      ) : viewMode === 'capi' ? (
        /* View Mode 4: Meta CAPI Settings, Pipeline Mapping, Backfill & Logs */
        <AdsCapiPanel
          dateFilter={dateFilter}
          onSyncCompleted={() => loadDashboard(true)}
        />
      ) : (
        /* View Mode 2: Lead-by-Lead Cross-Reference Table (Zero Overflow + Paginated) */
        <div data-tour="ads-table" style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
          width: '100%'
        }}>
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '28%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Khách Hàng</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Số ĐT</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Bài Quảng Cáo</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Đại Lý Nhận</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Pipeline</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Thời Gian</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.length === 0 ? (
                <tr className="no-row-hover">
                  <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.84rem' }}>
                    Không tìm thấy Lead quảng cáo nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((item) => (
                  <tr key={`${item.id}-${item.ad_id}`} style={{ borderBottom: '1px solid var(--color-border-light)', cursor: 'default' }}>
                    <td style={{ padding: '9px 12px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <Avatar name={item.name} size={28} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.name}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Lead #{item.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '9px 8px', fontWeight: 700, fontSize: '0.79rem', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                      {item.phone}
                    </td>
                    <td style={{ padding: '9px 10px', overflow: 'hidden' }}>
                      <div
                        onClick={() => setPreviewAd({
                          adId: item.ad_id,
                          adName: item.ad_name,
                          thumb: item.thumbnail_url,
                          leadName: item.name
                        })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '5px 8px',
                          borderRadius: 9,
                          background: 'rgba(30, 64, 255, 0.08)',
                          border: '1px solid rgba(30, 64, 255, 0.25)',
                          cursor: 'pointer',
                          minWidth: 0
                        }}
                      >
                        <AdThumbnail
                          adId={item.ad_id}
                          src={item.thumbnail_url}
                          alt={item.ad_name}
                          size={34}
                          borderRadius={6}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.ad_name}>
                            {item.ad_name}
                          </div>
                          <div style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.campaign_name || `ID: ${item.ad_id}`}
                          </div>
                        </div>
                        <span
                          title="Mở Iframe Bài Quảng Cáo"
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            background: 'rgba(30, 64, 255, 0.16)',
                            border: '1px solid rgba(30, 64, 255, 0.32)',
                            color: '#1E40FF',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <Eye size={13} />
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '9px 10px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                        <Avatar src={item.assigned_to_avatar || undefined} name={item.assigned_to_name} size={24} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.assigned_to_name}>
                            {item.assigned_to_name}
                          </div>
                          <div style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.round_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '9px 10px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                        <LeadQualityBadge status={item.quality_status === 'unrated' ? null : item.quality_status} note={item.quality_note} showNote={true} />
                        {item.capi_last_event ? (
                          <span
                            title={`Đã gửi ${item.capi_last_event} (HTTP ${item.capi_last_status}) lúc ${item.capi_sent_at || ''}`}
                            style={{
                              padding: '1px 6px',
                              borderRadius: 6,
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              background: (item.capi_last_status ?? 0) >= 200 && (item.capi_last_status ?? 0) < 300 ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                              color: (item.capi_last_status ?? 0) >= 200 && (item.capi_last_status ?? 0) < 300 ? '#15803d' : '#dc2626'
                            }}
                          >
                            CAPI: {item.capi_last_event} ({item.capi_last_status})
                          </span>
                        ) : (item.quality_status && ['Qualified', 'Booked', 'Booking', 'Deposited', 'Closed', 'Notlead'].includes(item.quality_status)) ? (
                          <button
                            type="button"
                            onClick={() => handleSendSingleLeadCapi(item.id, item.quality_status)}
                            disabled={sendingLeadCapiId === item.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 7px',
                              borderRadius: 6,
                              border: '1px solid rgba(30, 64, 255, 0.4)',
                              background: 'rgba(30, 64, 255, 0.12)',
                              color: '#1E3A8A',
                              fontSize: '0.63rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <Send size={10} />
                            {sendingLeadCapiId === item.id ? 'Đang gửi...' : 'Gửi CAPI'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {item.created_at}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Main Leads Table Pagination Bar */}
          <CompactPaginationBar
            currentPage={leadsPage}
            totalItems={flattenedLeads.length}
            pageSize={LEADS_PAGE_SIZE}
            onPageChange={setLeadsPage}
            unitLabel="Lead"
          />
        </div>
      )}

      {/* Multi-Account Meta Token & Ad Account Manager Modal */}
      <CustomModal
        isOpen={configModalOpen}
        onClose={() => {
          setConfigModalOpen(false);
          setShowAccountForm(false);
          setConfirmDeleteId(null);
        }}
        title="Quản Lý Tài Khoản & Token Meta Ads (Multi-Account Vault)"
        width="min(780px, 95vw)"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {/* Summary + Add Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            padding: '0.7rem 0.9rem',
            borderRadius: 12,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border-light)',
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span>Tổng TK: <strong style={{ color: 'var(--color-text)' }}>{metaAccounts.length}</strong></span>
              <span>Đang bật: <strong style={{ color: '#059669' }}>{metaAccounts.filter(a => a.is_active).length}</strong></span>
              <span>Tổng QC đã đồng bộ: <strong style={{ color: 'var(--color-text)' }}>{cachedAdsCount} bài QC</strong></span>
              {adAccountId && <span>Mặc định: <strong style={{ color: 'var(--color-text)' }}>act_{adAccountId}</strong></span>}
            </div>
            <button
              type="button"
              onClick={openAddAccountForm}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 13px',
                borderRadius: 9,
                border: 'none',
                background: 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)',
                color: '#fff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Thêm Tài Khoản Meta
            </button>
          </div>

          {/* Add / Edit Inline Form */}
          {(showAccountForm || metaAccounts.length === 0) && (
            <div style={{
              padding: '1rem',
              borderRadius: 12,
              border: '1px solid rgba(30, 64, 255, 0.25)',
              background: 'rgba(30, 64, 255, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  {editingAccountId ? 'Chỉnh Sửa Tài Khoản Meta Ads' : 'Thêm Tài Khoản Meta Ads Mới'}
                </div>
                {metaAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountForm(false);
                      setEditingAccountId(null);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: 4
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Step 1: Meta Access Token First (Auto-discovers Ad Accounts & Pixels) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    1. Meta Access Token {editingAccountId ? '(Để trống nếu giữ nguyên Token đã mã hóa AES-256)' : <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <button
                    type="button"
                    disabled={discoveringMetaAssets || (!accountFormToken.trim() && !editingAccountId)}
                    onClick={() => void discoverAssetsFromToken()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 10px',
                      borderRadius: 7,
                      border: '1px solid rgba(30, 64, 255, 0.35)',
                      background: 'var(--color-surface)',
                      color: '#1E40FF',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: discoveringMetaAssets ? 'wait' : 'pointer',
                      opacity: discoveringMetaAssets || (!accountFormToken.trim() && !editingAccountId) ? 0.6 : 1
                    }}
                  >
                    <RefreshCw size={12} className={discoveringMetaAssets ? 'spin' : ''} />
                    {discoveringMetaAssets ? 'Đang quét TK & Pixel...' : 'Tải danh sách Ad ID & Pixel'}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={accountFormToken}
                  onChange={(e) => setAccountFormToken(e.target.value)}
                  placeholder={editingAccountId
                    ? 'Nhập Token mới để thay thế, hoặc bấm "Tải danh sách Ad ID & Pixel" để lấy từ Token đã lưu...'
                    : 'Dán Meta Access Token (EAAG...) — hệ thống tự động tải danh sách Ad Account ID & Pixel để bạn chọn...'}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
                {discoverStatusMsg && (
                  <div style={{
                    marginTop: 6,
                    padding: '6px 10px',
                    borderRadius: 8,
                    fontSize: '0.73rem',
                    fontWeight: 600,
                    background: discoverStatusMsg.ok ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${discoverStatusMsg.ok ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: discoverStatusMsg.ok ? '#047857' : '#b91c1c'
                  }}>
                    {discoverStatusMsg.text}
                  </div>
                )}
              </div>

              {/* Step 2: Select or Enter Ad Account ID, Pixel ID, and Friendly Name */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 6 }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      2. Ad Account ID <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    {discoveredAdAccounts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setManualAdAccountMode(!manualAdAccountMode)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          color: '#1E40FF',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {manualAdAccountMode ? `Chọn từ Token (${discoveredAdAccounts.length})` : 'Nhập ID thủ công'}
                      </button>
                    )}
                  </div>
                  {discoveredAdAccounts.length > 0 && !manualAdAccountMode ? (
                    <CustomSelect
                      searchable={true}
                      width="100%"
                      value={accountFormId.trim()}
                      placeholder="Chọn Tài khoản QC..."
                      options={discoveredAdAccounts.map((a) => ({
                        value: a.ad_account_id,
                        label: `${a.name} (act_${a.ad_account_id})`,
                        sublabel: `${a.currency} • ${a.status_label}${a.pixels.length > 0 ? ` • ${a.pixels.length} Pixel` : ''}`,
                      }))}
                      onChange={(val) => {
                        const chosenId = String(val || '');
                        const prevMatch = discoveredAdAccounts.find((a) => a.ad_account_id === accountFormId.trim());
                        const nextMatch = discoveredAdAccounts.find((a) => a.ad_account_id === chosenId);
                        setAccountFormId(chosenId);
                        if (nextMatch && (!accountFormName.trim() || (prevMatch && accountFormName.trim() === prevMatch.name))) {
                          setAccountFormName(nextMatch.name);
                        }
                        if (nextMatch?.pixels && nextMatch.pixels.length > 0) {
                          setAccountFormPixel(nextMatch.pixels[0].id);
                        }
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={accountFormId}
                      onChange={(e) => setAccountFormId(e.target.value)}
                      placeholder="VD: 123456789012345 hoặc act_..."
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        boxSizing: 'border-box'
                      }}
                    />
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 6 }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      3. Pixel ID liên kết (Tùy chọn)
                    </label>
                    {availableDiscoverPixels.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setManualPixelMode(!manualPixelMode)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          color: '#1E40FF',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {manualPixelMode ? `Chọn từ Token (${availableDiscoverPixels.length})` : 'Nhập Pixel thủ công'}
                      </button>
                    )}
                  </div>
                  {availableDiscoverPixels.length > 0 && !manualPixelMode ? (
                    <CustomSelect
                      searchable={true}
                      width="100%"
                      value={accountFormPixel.trim()}
                      placeholder="Chọn Pixel ID..."
                      options={[
                        { value: '', label: '-- Không gắn Pixel --', sublabel: 'Có thể chọn sau' },
                        ...availableDiscoverPixels.map((px) => ({
                          value: px.id,
                          label: `${px.name} (${px.id})`,
                          sublabel: px.sub,
                        })),
                      ]}
                      onChange={(val) => setAccountFormPixel(String(val || ''))}
                    />
                  ) : (
                    <input
                      type="text"
                      value={accountFormPixel}
                      onChange={(e) => setAccountFormPixel(e.target.value)}
                      placeholder="VD: 987654321098765 (hoặc bỏ trống)"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        fontSize: '0.8rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                    Tên gợi nhớ tài khoản
                  </label>
                  <input
                    type="text"
                    value={accountFormName}
                    onChange={(e) => setAccountFormName(e.target.value)}
                    placeholder="VD: Tài khoản QC Chính / Brand"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                {metaAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountForm(false);
                      setEditingAccountId(null);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 9,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Hủy
                  </button>
                )}
                <button
                  type="button"
                  disabled={savingConfig}
                  onClick={() => void handleSaveMetaAccount(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 9,
                    border: '1px solid rgba(30, 64, 255, 0.35)',
                    background: 'var(--color-surface)',
                    color: '#1E40FF',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: savingConfig ? 'not-allowed' : 'pointer',
                    opacity: savingConfig ? 0.7 : 1
                  }}
                >
                  Lưu Tài Khoản
                </button>
                <button
                  type="button"
                  disabled={savingConfig}
                  onClick={() => void handleSaveMetaAccount(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 9,
                    border: 'none',
                    background: 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)',
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: savingConfig ? 'not-allowed' : 'pointer',
                    opacity: savingConfig ? 0.7 : 1
                  }}
                >
                  {savingConfig ? 'Đang xử lý...' : 'Lưu & Đồng Bộ Ngay'}
                </button>
              </div>
            </div>
          )}

          {/* Configured Accounts List */}
          {metaAccounts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '45vh', overflowY: 'auto', paddingRight: 2 }}>
              {metaAccounts.map((acc) => {
                const isDeleting = confirmDeleteId === acc.id;
                const isSyncingOne = syncingAccountId === acc.id;
                return (
                  <div
                    key={acc.id}
                    style={{
                      padding: '0.8rem 0.95rem',
                      borderRadius: 12,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--color-text)' }}>
                            {acc.name}
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            background: acc.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.14)',
                            color: acc.is_active ? '#059669' : '#64748b'
                          }}>
                            {acc.is_active ? 'Đang bật đồng bộ' : 'Tạm ngưng'}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                            act_{acc.ad_account_id}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          <span>Token: <code style={{ color: 'var(--color-text)' }}>{acc.access_token_masked || 'Chưa có'}</code></span>
                          {acc.pixel_id && <span>Pixel: <code style={{ color: 'var(--color-text)' }}>{acc.pixel_id}</code></span>}
                          <span>Bài QC: <strong style={{ color: 'var(--color-text)' }}>{acc.synced_ads_count}</strong></span>
                          <span>Đồng bộ cuối: <strong style={{ color: 'var(--color-text)' }}>{acc.last_sync || 'Chưa'}</strong></span>
                        </div>
                        {acc.last_error && (
                          <div style={{ marginTop: 5, fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>
                            Lỗi đồng bộ: {acc.last_error}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          title="Đồng bộ riêng tài khoản này"
                          disabled={isSyncingOne}
                          onClick={() => void handleSyncSingleAccount(acc)}
                          style={{
                            padding: '6px 9px',
                            borderRadius: 8,
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg)',
                            color: 'var(--color-text)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: isSyncingOne ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <RefreshCw size={12} className={isSyncingOne ? 'spin' : ''} /> Đồng bộ
                        </button>
                        <button
                          type="button"
                          title={acc.is_active ? 'Tạm ngưng đồng bộ' : 'Bật đồng bộ'}
                          onClick={() => void handleToggleMetaAccount(acc)}
                          style={{
                            padding: '6px 9px',
                            borderRadius: 8,
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg)',
                            color: acc.is_active ? '#d97706' : '#059669',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          {acc.is_active ? <Pause size={12} /> : <Play size={12} />}
                          {acc.is_active ? 'Tạm ngưng' : 'Bật'}
                        </button>
                        <button
                          type="button"
                          title="Sửa tài khoản & Token"
                          onClick={() => openEditAccountForm(acc)}
                          style={{
                            padding: '6px 9px',
                            borderRadius: 8,
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg)',
                            color: '#1E40FF',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Edit2 size={12} /> Sửa
                        </button>
                        <button
                          type="button"
                          title="Xóa tài khoản"
                          onClick={() => {
                            setConfirmDeleteId(isDeleting ? null : acc.id);
                            setPurgeOnDelete(false);
                          }}
                          style={{
                            padding: '6px 9px',
                            borderRadius: 8,
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#dc2626',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Trash2 size={12} /> Xóa
                        </button>
                      </div>
                    </div>

                    {isDeleting && (
                      <div style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: 9,
                        background: 'rgba(239, 68, 68, 0.06)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                        fontSize: '0.75rem'
                      }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#991b1b', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={purgeOnDelete}
                            onChange={(e) => setPurgeOnDelete(e.target.checked)}
                          />
                          Xóa luôn lịch sử số liệu QC đã lưu của act_{acc.ad_account_id}
                        </label>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 7,
                              border: '1px solid var(--color-border)',
                              background: 'var(--color-surface)',
                              color: 'var(--color-text)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteMetaAccount(acc.id)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 7,
                              border: 'none',
                              background: '#dc2626',
                              color: '#fff',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Xác nhận Xóa TK
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setConfigModalOpen(false)}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </CustomModal>

      {/* Floating Multi-Ad Selection Summary Bar + Side-by-Side Compare (DOMATION_META selection_bar.js) */}
      {selectionSummary && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9998,
            background: '#0f172a',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 14,
            boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
            border: '1px solid rgba(30, 64, 255, 0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
            maxWidth: '94vw'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              padding: '3px 8px',
              borderRadius: 8,
              background: '#1E40FF',
              color: '#fff',
              fontSize: '0.73rem',
              fontWeight: 800
            }}>
              Đã chọn {selectionSummary.count} bài QC
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.76rem' }}>
            <span>Chi tiêu: <strong style={{ color: '#fcd34d' }}>{formatCompactVND(selectionSummary.spend)}</strong></span>
            <span>Tổng Lead: <strong style={{ color: '#fff' }}>{selectionSummary.leads}</strong></span>
            <span>Lead chất lượng: <strong style={{ color: '#4ade80' }}>{selectionSummary.good}</strong></span>
            <span>CPL gộp: <strong style={{ color: '#60a5fa' }}>{formatCompactVND(selectionSummary.cpl)}</strong></span>
            <span>CP/Lead CL: <strong style={{ color: '#4ade80' }}>{formatCompactVND(selectionSummary.cpql)}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {selectionSummary.count === 2 && (
              <button
                type="button"
                onClick={() => setCompareModalOpen(true)}
                style={{
                  padding: '5px 11px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#fff',
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <GitCompare size={13} /> So sánh VS (2 bài)
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedAdIds([])}
              style={{
                padding: '5px 9px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: '#cbd5e1',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <X size={12} /> Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Ad Comparison Modal */}
      <AdsCompareModal
        isOpen={compareModalOpen && (selectedAdsObjects.length === 2)}
        onClose={() => setCompareModalOpen(false)}
        adA={selectedAdsObjects[0] || null}
        adB={selectedAdsObjects[1] || null}
      />

      {/* Live Meta Ad Preview Iframe Modal */}
      <AdPreviewModal
        isOpen={!!previewAd}
        onClose={() => setPreviewAd(null)}
        adId={previewAd?.adId || null}
        initialAdName={previewAd?.adName}
        initialThumb={previewAd?.thumb}
        leadName={previewAd?.leadName}
      />
    </div>
  );
};

export const AdsPerformance = withRouterFreezer(AdsPerformanceInner, (path) => path === '/ads-performance');
export default AdsPerformance;
