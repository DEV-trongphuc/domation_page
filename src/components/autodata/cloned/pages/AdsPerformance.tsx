import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone, RefreshCw, Search, Eye, Flame,
  AlertTriangle, ChevronDown, ChevronUp,
  DollarSign, Users, Award,
  Sparkles, Layers, Filter, KeyRound, Check, Copy,
  ChevronLeft, ChevronRight, BarChart3, GitCompare, X, Zap, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAPI } from '../utils/api';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import { DomUnifiedDatePicker } from '../../../common/DomUnifiedDatePicker';
import { useUnifiedDateFilter } from '../../../common/unifiedDateFilter';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton, KpiCardSkeleton } from '../components/ui/Skeleton';
import { LeadQualityBadge } from '../components/LeadQualityBadge';
import { AdPreviewModal } from '../components/AdPreviewModal';
import { AdsAnalyticsPanel, AdsCompareModal } from '../components/AdsAnalyticsPanel';
import { AdsCapiPanel } from '../components/AdsCapiPanel';
import { withRouterFreezer } from '../components/RouterFreezer';

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
}> = ({ adId, src, alt = 'Ad', size = 42, borderRadius = 8, onClick }) => {
  const proxyUrl = `/data/sale_data/api.php?action=ad_thumb&ad_id=${encodeURIComponent(adId)}`;
  const [imgSrc, setImgSrc] = useState<string>(src || proxyUrl);
  const [triedProxy, setTriedProxy] = useState<boolean>(!src || src.includes('action=ad_thumb'));
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    setImgSrc(src || proxyUrl);
    setTriedProxy(!src || src.includes('action=ad_thumb'));
    setFailed(false);
  }, [adId, src, proxyUrl]);

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
          onError={() => {
            if (!triedProxy && adId) {
              setTriedProxy(true);
              setImgSrc(proxyUrl);
            } else {
              setFailed(true);
            }
          }}
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

const AdsPerformanceInner: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const [unifiedDate, setUnifiedDate, unifiedDateHelpers] = useUnifiedDateFilter({
    allowAllTime: false,
    allTimeFallbackPreset: 'last_30days',
  });
  const dateFilter = unifiedDateHelpers.legacyDate;
  const dateQueryString = unifiedDateHelpers.queryString;

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

  // Meta Token Config Modal State
  const [configModalOpen, setConfigModalOpen] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [adAccountId, setAdAccountId] = useState<string>('302787476028580');
  const [lastSyncAt, setLastSyncAt] = useState<string>('');
  const [cachedAdsCount, setCachedAdsCount] = useState<number>(0);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Reset pagination when filters change
  useEffect(() => {
    setAdsPage(1);
    setLeadsPage(1);
    setDrawerPages({});
  }, [searchTerm, tierFilter, pipelineFilter, dateQueryString, goalFilter, viewMode]);

  const loadDashboard = async (silent = false) => {
    const cacheKey = `ecolife_ads_dash_${dateQueryString}_${goalFilter}`;
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
        `get_ads_performance_dashboard&${dateQueryString}&goal=${encodeURIComponent(goalFilter)}`
      );
      if (res?.success) {
        setAds(Array.isArray(res.ads) ? res.ads : []);
        setSummary(res.summary || null);
        setDailyTrend(Array.isArray(res.daily_trend) ? res.daily_trend : []);
        setGoalBreakdown(Array.isArray(res.goal_breakdown) ? res.goal_breakdown : []);
        if (res.meta_config) {
          setAdAccountId(res.meta_config.ad_account_id || '302787476028580');
          setLastSyncAt(res.meta_config.last_sync || '');
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
    const cacheKey = `ecolife_ads_analytics_${dateQueryString}_${goalFilter}`;
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
        `get_ads_analytics_breakdowns&${dateQueryString}&goal=${encodeURIComponent(goalFilter)}${forceRefresh ? '&refresh=1' : ''}`
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
        setAccessToken(res.data.access_token || '');
        setAdAccountId(res.data.ad_account_id || '302787476028580');
        setLastSyncAt(res.data.last_sync || '');
        setCachedAdsCount(res.data.cached_ads_count || 0);
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
  }, [isActive, dateQueryString, goalFilter]);

  const handleSyncMetaAds = async () => {
    setSyncing(true);
    const toastId = toast.loading('Đang đồng bộ dữ liệu bài quảng cáo từ Meta...');
    try {
      const res = await fetchAPI('sync_meta_ads_data', {
        method: 'POST',
        body: JSON.stringify({})
      });
      if (res?.success) {
        toast.success(
          `Đã đồng bộ ${res.synced_ads || 0} bài quảng cáo!`,
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

  const handleSaveMetaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken.trim()) {
      toast.error('Vui lòng nhập Meta Access Token');
      return;
    }
    if (!adAccountId.trim()) {
      toast.error('Vui lòng nhập Ad Account ID');
      return;
    }
    setSavingConfig(true);
    const toastId = toast.loading('Đang lưu cấu hình & đồng bộ Meta API...');
    try {
      const saveRes = await fetchAPI('save_meta_ads_config', {
        method: 'POST',
        body: JSON.stringify({
          access_token: accessToken.trim(),
          ad_account_id: adAccountId.trim()
        })
      });
      if (!saveRes?.success) {
        toast.error(saveRes?.error || saveRes?.message || 'Không thể lưu cấu hình', { id: toastId });
        setSavingConfig(false);
        return;
      }

      const syncRes = await fetchAPI('sync_meta_ads_data', {
        method: 'POST',
        body: JSON.stringify({})
      });
      if (syncRes?.success) {
        toast.success(`Đã cập nhật Token & đồng bộ ${syncRes.synced_ads || 0} bài quảng cáo!`, { id: toastId });
        setConfigModalOpen(false);
        await loadDashboard(true);
        await loadMetaConfig();
      } else {
        toast.error(syncRes?.error || syncRes?.message || 'Đã lưu Token nhưng lỗi khi gọi Meta API.', { id: toastId });
      }
    } catch (err: any) {
      toast.error('Lỗi lưu cấu hình: ' + (err.message || ''), { id: toastId });
    } finally {
      setSavingConfig(false);
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
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              Hiệu Suất Quảng Cáo & Đối Chiếu Lead
            </h1>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span>TK: <strong style={{ color: 'var(--color-text)' }}>act_{adAccountId}</strong></span>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <DomUnifiedDatePicker
            value={unifiedDate}
            onChange={setUnifiedDate}
            allowAllTime={false}
            lang="vi"
            variant="auto"
            align="right"
            showRangeBadge={true}
            buttonTestId="crm-ads-date-picker"
          />

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
            Token Meta
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div style={{
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
                  onChange={setGoalFilter}
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
                  onChange={setTierFilter}
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
          {PIPELINE_COLUMNS.map((col) => {
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
        <div style={{
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
              {PIPELINE_COLUMNS.map((col) => (
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
                {PIPELINE_COLUMNS.map((col) => (
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
                        {PIPELINE_COLUMNS.map((col) => {
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
        <div style={{
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

      {/* Meta Token & Ad Account Configuration Modal */}
      <CustomModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        title="Cấu Hình Meta Ads"
      >
        <form onSubmit={handleSaveMetaConfig} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
              Ad Account ID
            </label>
            <input
              type="text"
              value={adAccountId}
              onChange={(e) => setAdAccountId(e.target.value)}
              placeholder="VD: 302787476028580"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '0.86rem',
                fontWeight: 700,
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
              Meta Access Token
            </label>
            <textarea
              rows={4}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Nhập Access Token..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.6rem 0.85rem',
            borderRadius: 10,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border-light)',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)'
          }}>
            <span>Đã đồng bộ: <strong style={{ color: 'var(--color-text)' }}>{cachedAdsCount} bài QC</strong></span>
            <span>Cập nhật: <strong style={{ color: 'var(--color-text)' }}>{lastSyncAt || 'Chưa đồng bộ'}</strong></span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setConfigModalOpen(false)}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={savingConfig}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: savingConfig ? 'not-allowed' : 'pointer',
                opacity: savingConfig ? 0.7 : 1
              }}
            >
              {savingConfig ? 'Đang lưu...' : 'Lưu & Đồng bộ'}
            </button>
          </div>
        </form>
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
