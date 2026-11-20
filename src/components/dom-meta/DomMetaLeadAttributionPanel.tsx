import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  DollarSign,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Layers,
  Megaphone,
  Search,
  Users,
} from 'lucide-react';
import {
  formatDomMoneyShort,
  formatDomNumber,
  type DomMetaAdNode,
  type DomMetaCrmAttributionPayload,
  type DomMetaCrmEntityBucket,
  type DomMetaCrmLeadItem,
  type DomMetaDashboardDataset,
} from './domMetaTypes';
import { fetchDomMetaCrmAttribution, type DomMetaAuthContext } from './domMetaApi';
import { CreativeThumbFan } from './DomMetaCharts';
import { DomMetaSelect, DomResponsiveSubtabs } from './DomMetaSelect';

const PIPELINE_COLS: Array<{
  key: string;
  label: string;
  headerLabel: string;
  color: string;
  bg: string;
  cellTint: string;
  border: string;
}> = [
  {
    key: 'Qualified',
    label: 'Thiện chí',
    headerLabel: 'THIỆN CHÍ',
    color: '#15803D',
    bg: 'rgba(22, 163, 74, 0.10)',
    cellTint: 'rgba(22, 163, 74, 0.07)',
    border: 'rgba(22, 163, 74, 0.25)',
  },
  {
    key: 'Booked',
    label: 'Hẹn gặp',
    headerLabel: 'HẸN GẶP',
    color: '#1D4ED8',
    bg: 'rgba(37, 99, 235, 0.10)',
    cellTint: 'rgba(37, 99, 235, 0.06)',
    border: 'rgba(37, 99, 235, 0.24)',
  },
  {
    key: 'Booking',
    label: 'Booking',
    headerLabel: 'BOOKING',
    color: '#BE185D',
    bg: 'rgba(236, 72, 153, 0.11)',
    cellTint: 'rgba(236, 72, 153, 0.06)',
    border: 'rgba(236, 72, 153, 0.26)',
  },
  {
    key: 'Deposited',
    label: 'Đặt cọc',
    headerLabel: 'ĐẶT CỌC',
    color: '#B45309',
    bg: 'rgba(217, 119, 6, 0.12)',
    cellTint: 'rgba(217, 119, 6, 0.06)',
    border: 'rgba(217, 119, 6, 0.28)',
  },
  {
    key: 'Closed',
    label: 'Đã chốt',
    headerLabel: 'ĐÃ CHỐT',
    color: '#7E22CE',
    bg: 'rgba(147, 51, 234, 0.11)',
    cellTint: 'rgba(147, 51, 234, 0.06)',
    border: 'rgba(147, 51, 234, 0.26)',
  },
  {
    key: 'Badtiming',
    label: 'Hẹn gọi lại',
    headerLabel: 'GỌI LẠI',
    color: '#A16207',
    bg: 'rgba(202, 138, 4, 0.11)',
    cellTint: 'rgba(202, 138, 4, 0.05)',
    border: 'rgba(202, 138, 4, 0.24)',
  },
  {
    key: 'NoAnswer',
    label: 'KNM / Thuê bao',
    headerLabel: 'KNM',
    color: '#C2410C',
    bg: 'rgba(234, 88, 12, 0.11)',
    cellTint: 'rgba(234, 88, 12, 0.06)',
    border: 'rgba(234, 88, 12, 0.24)',
  },
  {
    key: 'Notlead',
    label: 'Notlead',
    headerLabel: 'NOTLEAD',
    color: '#B91C1C',
    bg: 'rgba(220, 38, 38, 0.11)',
    cellTint: 'rgba(220, 38, 38, 0.06)',
    border: 'rgba(220, 38, 38, 0.25)',
  },
  {
    key: 'unrated',
    label: 'Chưa ĐG',
    headerLabel: 'CHƯA ĐG',
    color: '#475569',
    bg: 'rgba(100, 116, 139, 0.11)',
    cellTint: 'rgba(100, 116, 139, 0.05)',
    border: 'rgba(100, 116, 139, 0.22)',
  },
];

function getInitials(name?: string | null): string {
  const parts = String(name || 'KH')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'KH';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

const AVATAR_GRADIENTS = [
  'from-[#1E40FF] to-[#06B6D4]',
  'from-orange-500 to-amber-500',
  'from-emerald-600 to-teal-500',
  'from-violet-600 to-indigo-500',
  'from-rose-500 to-pink-500',
];

function pickAvatarGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

function getPipelineStageBadge(stageKey?: string, rawStatus?: string) {
  const k = String(stageKey || rawStatus || 'unrated').trim();
  switch (k) {
    case 'Qualified':
      return { label: 'Thiện chí', color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0' };
    case 'Booked':
      return { label: 'Hẹn gặp', color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE' };
    case 'Booking':
      return { label: 'Booking', color: '#BE185D', bg: '#FCE7F3', border: '#FBCFE8' };
    case 'Deposited':
      return { label: 'Đặt cọc', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' };
    case 'Closed':
      return { label: 'Đã chốt', color: '#7E22CE', bg: '#F3E8FF', border: '#E9D5FF' };
    case 'Badtiming':
      return { label: 'Hẹn gọi lại', color: '#A16207', bg: '#FEF9C3', border: '#FEF08A' };
    case 'NoAnswer':
      return { label: 'Ko liên lạc được', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' };
    case 'Notlead':
      return { label: 'Notlead', color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA' };
    default:
      return { label: 'Chưa đánh giá', color: '#475569', bg: '#F1F5F9', border: '#E2E8F0' };
  }
}

interface CombinedAdMatrixRow {
  adId: string;
  adName: string;
  adsetName: string;
  campaignId: string;
  campaignName: string;
  goal: string;
  thumbnailUrl: string;
  imageUrl: string;
  spend: number;
  frequency: number;
  adNode: DomMetaAdNode | null;
  bucket: DomMetaCrmEntityBucket;
  totalLeads: number;
  qualifiedLeads: number;
  ratedLeads: number;
  qualRateAmongRated: number;
  cpl: number;
  cpql: number;
}

export const DomMetaLeadAttributionPanel: React.FC<{
  authContext: DomMetaAuthContext;
  dataset: DomMetaDashboardDataset | null;
  crmAttribution: DomMetaCrmAttributionPayload | null;
  dateRange: { since: string; until: string };
  currency?: string;
  onInspectAd?: (ad: DomMetaAdNode, initialTab?: 'insights' | 'crm_leads') => void;
  onOpenLead?: (lead: DomMetaCrmLeadItem) => void;
}> = ({
  authContext,
  dataset,
  crmAttribution,
  dateRange,
  currency = 'VND',
  onInspectAd,
  onOpenLead,
}) => {
  const [subTab, setSubTab] = useState<'by_ad' | 'by_lead'>('by_ad');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [adScopeFilter, setAdScopeFilter] = useState<'with_leads' | 'all_ads'>('with_leads');
  const [saleFilter, setSaleFilter] = useState<string>('all');
  const [adsPage, setAdsPage] = useState(1);
  const [leadsPage, setLeadsPage] = useState(1);
  const [copiedAdId, setCopiedAdId] = useState<string | null>(null);

  // Expanded ad inline leads cache
  const [expandedAdIds, setExpandedAdIds] = useState<Record<string, boolean>>({});
  const [inlineAdLeads, setInlineAdLeads] = useState<
    Record<string, { loading: boolean; items: DomMetaCrmLeadItem[] }>
  >({});

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 260);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Flatten all Meta Ad nodes from dataset for lookup
  const metaAdsMap = useMemo(() => {
    const map = new Map<string, DomMetaAdNode>();
    for (const camp of dataset?.campaigns || []) {
      for (const adset of camp.adsets || []) {
        for (const ad of adset.ads || []) {
          map.set(ad.id, ad);
        }
      }
    }
    return map;
  }, [dataset]);

  // Build combined Ad × Pipeline matrix rows (merging Meta Ads + CRM `by_ad` buckets)
  const allMatrixRows = useMemo<CombinedAdMatrixRow[]>(() => {
    const byAd = crmAttribution?.by_ad || {};
    const seenIds = new Set<string>();
    const rows: CombinedAdMatrixRow[] = [];

    const emptyBucket = (id: string): DomMetaCrmEntityBucket => ({
      entity_id: id,
      total_leads: 0,
      qualified_leads: 0,
      closed_leads: 0,
      negative_leads: 0,
      pending_leads: 0,
      positive_rate: 0,
      total_revenue_vnd: 0,
      capi_sent_count: 0,
      pipeline: {},
      sales: [],
    });

    for (const [adId, bucket] of Object.entries(byAd)) {
      seenIds.add(adId);
      const metaAd = metaAdsMap.get(adId) || null;
      const unrated = Number(bucket.pipeline?.unrated || 0);
      const rated = Math.max(0, bucket.total_leads - unrated);
      const qual = bucket.qualified_leads;
      const spend = metaAd?.spend || 0;
      rows.push({
        adId,
        adName: metaAd?.name || `Bài quảng cáo #${adId.slice(-6)}`,
        adsetName: metaAd?.adset_name || '',
        campaignId: metaAd?.campaign_id || '',
        campaignName: metaAd?.campaign_name || '',
        goal: metaAd?.optimization_goal || 'QUALITY LEAD',
        thumbnailUrl: metaAd?.thumbnail_url || '',
        imageUrl: metaAd?.image_url || '',
        spend,
        frequency: metaAd?.frequency || 0,
        adNode: metaAd,
        bucket,
        totalLeads: bucket.total_leads,
        qualifiedLeads: qual,
        ratedLeads: rated,
        qualRateAmongRated: rated > 0 ? Math.round((qual / rated) * 100) : 0,
        cpl: bucket.total_leads > 0 && spend > 0 ? spend / bucket.total_leads : 0,
        cpql: qual > 0 && spend > 0 ? spend / qual : 0,
      });
    }

    for (const [adId, metaAd] of metaAdsMap.entries()) {
      if (seenIds.has(adId)) continue;
      rows.push({
        adId,
        adName: metaAd.name,
        adsetName: metaAd.adset_name,
        campaignId: metaAd.campaign_id,
        campaignName: metaAd.campaign_name,
        goal: metaAd.optimization_goal || 'QUALITY LEAD',
        thumbnailUrl: metaAd.thumbnail_url,
        imageUrl: metaAd.image_url,
        spend: metaAd.spend,
        frequency: metaAd.frequency,
        adNode: metaAd,
        bucket: emptyBucket(adId),
        totalLeads: 0,
        qualifiedLeads: 0,
        ratedLeads: 0,
        qualRateAmongRated: 0,
        cpl: 0,
        cpql: 0,
      });
    }

    return rows.sort((a, b) => b.totalLeads - a.totalLeads || b.spend - a.spend);
  }, [crmAttribution, metaAdsMap]);

  // Compute pipeline totals across all attributed leads
  const pipelineTotals = useMemo(() => {
    const totals: Record<string, number> = {
      Qualified: 0,
      Booked: 0,
      Booking: 0,
      Deposited: 0,
      Closed: 0,
      Badtiming: 0,
      NoAnswer: 0,
      Notlead: 0,
      unrated: 0,
    };
    if (crmAttribution?.summary?.pipeline_totals) {
      for (const [k, v] of Object.entries(crmAttribution.summary.pipeline_totals)) {
        totals[k] = (totals[k] || 0) + Number(v || 0);
      }
      return totals;
    }
    for (const b of Object.values(crmAttribution?.by_ad || {})) {
      for (const [k, v] of Object.entries(b.pipeline || {})) {
        totals[k] = (totals[k] || 0) + Number(v || 0);
      }
    }
    return totals;
  }, [crmAttribution]);

  const adsWithLeadsCount = useMemo(
    () => allMatrixRows.filter((r) => r.totalLeads > 0).length,
    [allMatrixRows]
  );

  const totalAttributedLeads = crmAttribution?.summary?.attributed_leads || 0;
  const totalQualifiedLeads = crmAttribution?.summary?.qualified_leads || 0;
  const totalUnrated = pipelineTotals.unrated || 0;
  const totalRated = Math.max(0, totalAttributedLeads - totalUnrated);
  const overallQualPct =
    totalRated > 0 ? ((totalQualifiedLeads / totalRated) * 100).toFixed(1) : '0.0';
  const knmAndNotlead = (pipelineTotals.NoAnswer || 0) + (pipelineTotals.Notlead || 0);
  const bookDepositClosed =
    (pipelineTotals.Booking || 0) +
    (pipelineTotals.Deposited || 0) +
    (pipelineTotals.Closed || 0);

  const totalMetaSpend = dataset?.currentTotals?.spend || 0;
  const avgCpl = totalAttributedLeads > 0 && totalMetaSpend > 0 ? totalMetaSpend / totalAttributedLeads : 0;
  const avgCpql = totalQualifiedLeads > 0 && totalMetaSpend > 0 ? totalMetaSpend / totalQualifiedLeads : 0;

  const filteredMatrixRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allMatrixRows.filter((r) => {
      if (adScopeFilter === 'with_leads' && r.totalLeads <= 0) return false;
      if (pipelineFilter !== 'all' && Number(r.bucket.pipeline?.[pipelineFilter] || 0) <= 0) {
        return false;
      }
      if (goalFilter !== 'all') {
        const g = r.goal.toUpperCase();
        if (goalFilter === 'lead' && !g.includes('LEAD')) return false;
        if (goalFilter === 'message' && !g.includes('MESSAG')) return false;
        if (goalFilter === 'traffic' && !g.includes('TRAFFIC') && !g.includes('LINK')) return false;
        if (goalFilter === 'reach' && !g.includes('REACH') && !g.includes('ENGAGEMENT')) return false;
      }
      if (q) {
        const hay = `${r.adName} ${r.adId} ${r.campaignName} ${r.adsetName} ${r.bucket.sales
          .map((s) => s.name)
          .join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allMatrixRows, adScopeFilter, pipelineFilter, goalFilter, searchTerm]);

  const ADS_PER_PAGE = 15;
  const totalAdsPages = Math.max(1, Math.ceil(filteredMatrixRows.length / ADS_PER_PAGE));
  const safeAdsPage = Math.min(adsPage, totalAdsPages);
  const pagedMatrixRows = filteredMatrixRows.slice(
    (safeAdsPage - 1) * ADS_PER_PAGE,
    safeAdsPage * ADS_PER_PAGE
  );

  // Fetch flat leads when on `by_lead` tab
  const LEADS_PER_PAGE = 25;
  const flatLeadsFetchKey =
    subTab === 'by_lead'
      ? `${dateRange.since}:${dateRange.until}:${pipelineFilter}:${saleFilter}:${debouncedSearch}:${leadsPage}`
      : '';

  const [flatLeadsResp, setFlatLeadsResp] = useState<{
    key: string;
    items: DomMetaCrmLeadItem[];
    total: number;
    salesOptions: Array<{ user_id: string; name: string; avatar?: string | null; count: number }>;
  } | null>(null);

  useEffect(() => {
    if (!flatLeadsFetchKey) return;
    let cancelled = false;
    fetchDomMetaCrmAttribution(authContext, {
      since: dateRange.since,
      until: dateRange.until,
      entity_type: 'all',
      only_attributed: true,
      quality_status: pipelineFilter !== 'all' ? pipelineFilter : undefined,
      sale_id: saleFilter !== 'all' ? saleFilter : undefined,
      search: debouncedSearch || undefined,
      page: leadsPage,
      page_size: LEADS_PER_PAGE,
    })
      .then((res) => {
        if (cancelled) return;
        setFlatLeadsResp({
          key: flatLeadsFetchKey,
          items: res.entity_leads?.items || [],
          total: res.entity_leads?.total || 0,
          salesOptions: res.entity_leads?.sales_filter_options || [],
        });
      })
      .catch(() => {
        if (cancelled) return;
        setFlatLeadsResp({
          key: flatLeadsFetchKey,
          items: [],
          total: 0,
          salesOptions: [],
        });
      });
    return () => {
      cancelled = true;
    };
  }, [
    flatLeadsFetchKey,
    authContext,
    dateRange.since,
    dateRange.until,
    pipelineFilter,
    saleFilter,
    debouncedSearch,
    leadsPage,
  ]);

  const isLoadingFlatLeads = Boolean(flatLeadsFetchKey && flatLeadsResp?.key !== flatLeadsFetchKey);
  const flatLeads = flatLeadsResp?.key === flatLeadsFetchKey ? flatLeadsResp.items : [];
  const flatLeadsTotal = flatLeadsResp?.total ?? totalAttributedLeads;
  const totalLeadsPages = Math.max(1, Math.ceil(flatLeadsTotal / LEADS_PER_PAGE));

  const toggleExpandAd = (adId: string) => {
    const nextOpen = !expandedAdIds[adId];
    setExpandedAdIds((prev) => ({ ...prev, [adId]: nextOpen }));
    if (nextOpen && !inlineAdLeads[adId]) {
      setInlineAdLeads((prev) => ({ ...prev, [adId]: { loading: true, items: [] } }));
      fetchDomMetaCrmAttribution(authContext, {
        since: dateRange.since,
        until: dateRange.until,
        entity_type: 'ad',
        entity_id: adId,
        page: 1,
        page_size: 50,
      })
        .then((res) => {
          setInlineAdLeads((prev) => ({
            ...prev,
            [adId]: { loading: false, items: res.entity_leads?.items || [] },
          }));
        })
        .catch(() => {
          setInlineAdLeads((prev) => ({ ...prev, [adId]: { loading: false, items: [] } }));
        });
    }
  };

  return (
    <div data-testid="dom-meta-lead-attribution-view" className="space-y-3.5 sm:space-y-4 min-w-0">
      {/* Row 1: 4 Executive Lead-Attribution KPI Summary Cards (2x2 compact grid on mobile) */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="rounded-2xl bg-white border border-slate-200/85 shadow-[0_2px_12px_rgba(15,23,42,0.03)] p-3 sm:p-4 flex flex-col justify-between gap-1.5 sm:gap-2 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              TỔNG LEAD QC
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-[#1E40FF] flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums">
              {formatDomNumber(totalAttributedLeads)}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Lead</span>
          </div>
          <div className="text-[10.5px] sm:text-[11.5px] text-slate-500 truncate">
            <strong className="text-slate-800">{adsWithLeadsCount}</strong> / {allMatrixRows.length} bài QC
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-emerald-200/80 shadow-[0_2px_12px_rgba(16,185,129,0.04)] p-3 sm:p-4 flex flex-col justify-between gap-1.5 sm:gap-2 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700 truncate">
              LEAD CHẤT LƯỢNG
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 tabular-nums">
              {formatDomNumber(totalQualifiedLeads)}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] font-bold text-emerald-700 tabular-nums">
              {overallQualPct}%
            </span>
          </div>
          <div className="text-[10.5px] sm:text-[11.5px] text-slate-500 truncate">
            TC: <strong className="text-slate-800">{pipelineTotals.Qualified || 0}</strong> · Chốt:{' '}
            <strong className="text-slate-800">{bookDepositClosed}</strong>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-rose-200/75 shadow-[0_2px_12px_rgba(225,29,72,0.03)] p-3 sm:p-4 flex flex-col justify-between gap-1.5 sm:gap-2 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-700 truncate">
              KNM &amp; SAI SỐ
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-extrabold text-rose-600 tabular-nums">
              {formatDomNumber(knmAndNotlead)}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Lead</span>
          </div>
          <div className="text-[10.5px] sm:text-[11.5px] text-slate-500 truncate">
            KNM: <strong className="text-slate-800">{pipelineTotals.NoAnswer || 0}</strong> ·
            Chưa ĐG: <strong className="text-slate-800">{totalUnrated}</strong>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/85 shadow-[0_2px_12px_rgba(15,23,42,0.03)] p-3 sm:p-4 flex flex-col justify-between gap-1.5 sm:gap-2 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              CPL / CPQL TB
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-[#1E40FF] flex items-center justify-center shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-xl font-extrabold text-slate-900 tabular-nums truncate">
            {avgCpl > 0 ? formatDomMoneyShort(avgCpl, currency) : '—'}
          </div>
          <div className="text-[10.5px] sm:text-[11.5px] text-slate-500 truncate">
            CPQL:{' '}
            <strong className="text-emerald-700 tabular-nums">
              {avgCpql > 0 ? formatDomMoneyShort(avgCpql, currency) : '—'}
            </strong>
          </div>
        </div>
      </div>

      {/* Row 2: Mode Switcher + Search + Filters + Non-Wrapping Pipeline Subtabs */}
      <div className="rounded-2xl bg-white border border-slate-200/85 shadow-[0_2px_12px_rgba(15,23,42,0.03)] p-3.5 sm:p-4 space-y-3 min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3 min-w-0">
          {/* Sub-Tab Switcher: Strictly 2 Equal Tabs on Mobile */}
          <div className="grid grid-cols-2 sm:inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              data-testid="attr-subtab-by-ad"
              onClick={() => setSubTab('by_ad')}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer dom-ios-press truncate ${
                subTab === 'by_ad'
                  ? 'bg-[#1E40FF] text-white font-bold shadow-sm'
                  : 'text-slate-600 font-semibold hover:text-slate-900'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Theo Bài QC ({adsWithLeadsCount})</span>
            </button>

            <button
              type="button"
              data-testid="attr-subtab-by-lead"
              onClick={() => {
                setSubTab('by_lead');
                setLeadsPage(1);
              }}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer dom-ios-press truncate ${
                subTab === 'by_lead'
                  ? 'bg-[#1E40FF] text-white font-bold shadow-sm'
                  : 'text-slate-600 font-semibold hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Từng Lead ({formatDomNumber(totalAttributedLeads)})</span>
            </button>
          </div>

          {/* Search & Custom Selects (Strictly <= 2 selects side-by-side on mobile) */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 min-w-0">
            <div className="relative w-full sm:w-72 lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setAdsPage(1);
                  setLeadsPage(1);
                }}
                placeholder="Tìm bài QC, ID, khách, SĐT..."
                className="w-full !pl-10 pr-3.5 py-2 rounded-full border border-slate-200 bg-slate-50/90 text-xs sm:text-[13px] text-slate-800 outline-none focus:bg-white focus:border-[#1E40FF] transition-all"
              />
            </div>

            {subTab === 'by_ad' ? (
              <div className="grid grid-cols-2 sm:flex items-center gap-2">
                <DomMetaSelect
                  ariaLabel="Lọc theo mục tiêu quảng cáo"
                  value={goalFilter}
                  onChange={(v) => {
                    setGoalFilter(v);
                    setAdsPage(1);
                  }}
                  variant="pill"
                  className="w-full sm:w-auto"
                  options={[
                    { value: 'all', label: 'Goal: Tất cả' },
                    { value: 'lead', label: 'Goal: Lead Form' },
                    { value: 'message', label: 'Goal: Messaging' },
                    { value: 'traffic', label: 'Goal: Traffic' },
                    { value: 'reach', label: 'Goal: Reach / Eng.' },
                  ]}
                />

                <DomMetaSelect
                  ariaLabel="Phạm vi hiển thị bài quảng cáo"
                  value={adScopeFilter}
                  onChange={(v) => {
                    setAdScopeFilter(v as 'with_leads' | 'all_ads');
                    setAdsPage(1);
                  }}
                  variant="pill"
                  className="w-full sm:w-auto"
                  options={[
                    { value: 'with_leads', label: `Có Lead (${adsWithLeadsCount})` },
                    { value: 'all_ads', label: `Tất cả QC (${allMatrixRows.length})` },
                  ]}
                />
              </div>
            ) : (
              <DomMetaSelect
                ariaLabel="Lọc theo đại lý hoặc Sale phụ trách"
                value={saleFilter}
                onChange={(v) => {
                  setSaleFilter(v);
                  setLeadsPage(1);
                }}
                variant="pill"
                className="w-full sm:w-auto"
                options={[
                  { value: 'all', label: 'Tất cả Đại lý / Sale' },
                  ...(flatLeadsResp?.salesOptions || []).map((s) => ({
                    value: s.user_id,
                    label: `${s.name} (${s.count})`,
                  })),
                ]}
              />
            )}
          </div>
        </div>

        {/* Interactive PIPELINE Filter Bar (Non-wrapping via DomResponsiveSubtabs on mobile/tablet!) */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 min-w-0">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            <Filter className="w-3 h-3" />
            <span>PIPELINE:</span>
          </span>

          <DomResponsiveSubtabs
            maxMobile={2}
            maxTablet={4}
            maxDesktop={7}
            moreLabel="Pipeline"
            value={pipelineFilter}
            onChange={(nextKey) => {
              setPipelineFilter(nextKey === pipelineFilter && nextKey !== 'all' ? 'all' : nextKey);
              setAdsPage(1);
              setLeadsPage(1);
            }}
            tabs={[
              {
                id: 'all',
                label: 'Tất cả',
                badge: formatDomNumber(totalAttributedLeads),
              },
              ...PIPELINE_COLS.map((col) => ({
                id: col.key,
                label: col.label,
                badge: Number(pipelineTotals[col.key] || 0),
              })),
            ]}
          />
        </div>
      </div>

      {/* Row 3A: Theo Bài Quảng Cáo Matrix (Mobile Cards + Desktop Table) */}
      {subTab === 'by_ad' ? (
        <div className="rounded-2xl bg-white border border-slate-200/85 shadow-[0_2px_12px_rgba(15,23,42,0.03)] overflow-hidden min-w-0">
          {pagedMatrixRows.length === 0 ? (
            <div className="py-14 text-center text-xs text-slate-400">
              Chưa ghi nhận bài quảng cáo nào khớp bộ lọc trong khoảng ngày đã chọn.
            </div>
          ) : (
            <>
              {/* Mobile Native Ad Attribution Cards (< md) */}
              <div className="md:hidden p-3 space-y-2.5">
                {pagedMatrixRows.map((row) => {
                  const nonZeroStages = PIPELINE_COLS.filter(
                    (c) => Number(row.bucket.pipeline?.[c.key] || 0) > 0
                  );
                  return (
                    <div
                      key={`m_attr_${row.adId}`}
                      className="rounded-2xl border border-slate-200/90 bg-slate-50/45 p-3 space-y-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CreativeThumbFan
                          urls={[row.thumbnailUrl || row.imageUrl].filter(Boolean)}
                          goal={row.goal}
                          active={row.adNode?.effective_status?.toUpperCase() === 'ACTIVE'}
                          variant="adset"
                          alt={row.adName}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 line-clamp-1">
                            {row.adName}
                          </div>
                          <div className="text-[10.5px] text-slate-400 truncate mt-0.5">
                            {row.campaignName || 'Meta Lead Ads'} · #{row.adId.slice(-6)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white border border-slate-100 p-2 text-center">
                        <div>
                          <div className="text-[9.5px] text-slate-400">Chi tiêu</div>
                          <div className="text-xs font-bold text-slate-800 tabular-nums truncate">
                            {row.spend > 0 ? formatDomMoneyShort(row.spend, currency) : '0 ₫'}
                          </div>
                        </div>
                        <div className="border-x border-slate-100">
                          <div className="text-[9.5px] text-slate-400">Tổng Lead</div>
                          <div className="text-xs font-extrabold text-[#1E40FF] tabular-nums">
                            {row.totalLeads}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9.5px] text-slate-400">Khách Nét</div>
                          <div className="text-xs font-extrabold text-emerald-700 tabular-nums">
                            {row.qualifiedLeads}{' '}
                            {row.ratedLeads > 0 ? `(${row.qualRateAmongRated}%)` : ''}
                          </div>
                        </div>
                      </div>

                      {nonZeroStages.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {nonZeroStages.slice(0, 5).map((st) => (
                            <span
                              key={st.key}
                              style={{
                                backgroundColor: st.bg,
                                color: st.color,
                                borderColor: st.border,
                              }}
                              className="px-2 py-0.5 rounded-full border text-[10px] font-bold tabular-nums"
                            >
                              {st.label}: {Number(row.bucket.pipeline?.[st.key] || 0)}
                            </span>
                          ))}
                        </div>
                      )}

                      {row.adNode && onInspectAd && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onInspectAd(row.adNode!, 'insights')}
                            className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-1 cursor-pointer dom-ios-press"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chỉ số Ad</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onInspectAd(row.adNode!, 'crm_leads')}
                            className="py-2 px-2.5 rounded-xl bg-[#1E40FF] text-white text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer dom-ios-press"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>DS Lead ({row.totalLeads})</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block dom-meta-table-scroll overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/95 border-b border-slate-200 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4 min-w-[270px]">BÀI QUẢNG CÁO</th>
                    <th className="py-3 px-3 min-w-[185px]">HIỆU SUẤT &amp; CHI PHÍ</th>
                    <th className="py-3 px-2.5 text-center">TỔNG</th>
                    {PIPELINE_COLS.map((col) => (
                      <th
                        key={col.key}
                        style={{ color: col.color }}
                        className="py-3 px-2 text-center whitespace-nowrap"
                      >
                        {col.headerLabel}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-right whitespace-nowrap">CHI TIẾT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedMatrixRows.map((row) => {
                    const isExpanded = Boolean(expandedAdIds[row.adId]);
                    const inlineState = inlineAdLeads[row.adId];
                    const tierInfo = (() => {
                      if (row.totalLeads === 0) {
                        return {
                          label: 'Chưa phát sinh Lead',
                          cls: 'bg-slate-100 text-slate-600 border-slate-200',
                        };
                      }
                      if (row.ratedLeads === 0) {
                        return {
                          label: 'Chờ đánh giá',
                          cls: 'bg-amber-50 text-amber-700 border-amber-200',
                        };
                      }
                      if (row.qualRateAmongRated >= 30) {
                        return {
                          label: 'Hiệu quả cao',
                          cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        };
                      }
                      if (row.qualRateAmongRated >= 15) {
                        return {
                          label: 'Đạt chuẩn',
                          cls: 'bg-blue-50 text-[#1E40FF] border-blue-200',
                        };
                      }
                      return {
                        label: 'Cần tối ưu',
                        cls: 'bg-rose-50 text-rose-700 border-rose-200',
                      };
                    })();

                    return (
                      <React.Fragment key={row.adId}>
                        <tr className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 max-w-[310px]">
                            <div className="flex items-center gap-3 min-w-0">
                              <CreativeThumbFan
                                urls={[row.thumbnailUrl || row.imageUrl].filter(Boolean)}
                                goal={row.goal}
                                active={row.adNode?.effective_status?.toUpperCase() === 'ACTIVE'}
                                variant="adset"
                                alt={row.adName}
                              />
                              <div className="min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (row.adNode && onInspectAd) {
                                      onInspectAd(row.adNode, 'insights');
                                    } else {
                                      toggleExpandAd(row.adId);
                                    }
                                  }}
                                  className="font-bold text-slate-900 hover:text-[#1E40FF] truncate block max-w-full text-left cursor-pointer"
                                  title={row.adName}
                                >
                                  {row.adName}
                                </button>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                  <span className="truncate max-w-[160px]">
                                    {row.campaignName || 'Meta Lead Ads'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard?.writeText(row.adId).catch(() => {});
                                      setCopiedAdId(row.adId);
                                      setTimeout(() => setCopiedAdId(null), 1200);
                                    }}
                                    className="inline-flex items-center gap-0.5 font-mono text-[10px] text-slate-400 hover:text-[#1E40FF] shrink-0 cursor-pointer"
                                    title={`Sao chép Ad ID: ${row.adId}`}
                                  >
                                    <span>#{row.adId.slice(-6)}</span>
                                    {copiedAdId === row.adId ? (
                                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              {row.adNode && onInspectAd && (
                                <button
                                  type="button"
                                  onClick={() => onInspectAd(row.adNode!, 'insights')}
                                  title="Mở Drawer phân tích chuyên sâu bài quảng cáo"
                                  className="w-7 h-7 rounded-lg bg-blue-50/80 hover:bg-[#1E40FF] text-[#1E40FF] hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-wrap items-center gap-1">
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[10.5px] font-bold ${tierInfo.cls}`}
                              >
                                {tierInfo.label}
                              </span>
                              {row.ratedLeads > 0 && (
                                <span className="text-[11px] font-bold text-emerald-700 tabular-nums">
                                  {row.qualRateAmongRated}% ({row.qualifiedLeads}/{row.ratedLeads})
                                </span>
                              )}
                              {row.cpl > 0 && avgCpl > 0 && row.cpl > avgCpl * 1.4 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[10px] font-bold">
                                  CPL Cao
                                </span>
                              )}
                              {row.spend <= 0 && row.totalLeads > 0 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium">
                                  Chưa cắn tiền kỳ này
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                              Chi:{' '}
                              <strong className="text-slate-800">
                                {row.spend > 0 ? formatDomMoneyShort(row.spend, currency) : '0 ₫'}
                              </strong>
                              {row.cpl > 0 && (
                                <>
                                  {' '}
                                  • CPL:{' '}
                                  <strong className="text-slate-700">
                                    {formatDomMoneyShort(row.cpl, currency)}
                                  </strong>
                                </>
                              )}
                              {row.frequency > 0 && (
                                <>
                                  {' '}
                                  • F: <strong>{row.frequency.toFixed(1)}</strong>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-2.5 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-blue-50 text-[#1E40FF] font-extrabold tabular-nums">
                              {row.totalLeads}
                            </span>
                          </td>

                          {PIPELINE_COLS.map((col) => {
                            const val = Number(row.bucket.pipeline?.[col.key] || 0);
                            return (
                              <td
                                key={col.key}
                                style={{
                                  backgroundColor: val > 0 ? col.cellTint : undefined,
                                }}
                                className="py-3 px-2 text-center tabular-nums"
                              >
                                <span
                                  style={{ color: val > 0 ? col.color : '#CBD5E1' }}
                                  className={val > 0 ? 'font-extrabold' : 'font-normal'}
                                >
                                  {val}
                                </span>
                              </td>
                            );
                          })}

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {row.totalLeads > 0 ? (
                              <button
                                type="button"
                                onClick={() => toggleExpandAd(row.adId)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                                  isExpanded
                                    ? 'bg-[#1E40FF] text-white border-[#1E40FF]'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                <span>Xem ({row.totalLeads})</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>

                        {/* Inline Expandable Lead Drawer for this Ad */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70">
                            <td colSpan={13} className="p-3.5">
                              <div className="rounded-xl bg-white border border-blue-200/70 p-3.5 space-y-2.5 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-slate-800">
                                    Danh sách {row.totalLeads} khách hàng từ bài quảng cáo &ldquo;
                                    {row.adName}&rdquo;
                                  </span>
                                  {row.adNode && onInspectAd && (
                                    <button
                                      type="button"
                                      onClick={() => onInspectAd(row.adNode!, 'crm_leads')}
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E40FF] hover:underline cursor-pointer"
                                    >
                                      <span>Mở trong Slide-Over Drawer</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>

                                {inlineState?.loading ? (
                                  <div className="space-y-2 py-2">
                                    {[0, 1, 2].map((idx) => (
                                      <div
                                        key={idx}
                                        className="h-10 rounded-lg dom-meta-skeleton-soft"
                                      />
                                    ))}
                                  </div>
                                ) : (inlineState?.items || []).length === 0 ? (
                                  <div className="py-4 text-center text-xs text-slate-400">
                                    Không tìm thấy dữ liệu khách hàng chi tiết.
                                  </div>
                                ) : (
                                  <div className="dom-meta-table-scroll overflow-x-auto max-h-64 rounded-lg border border-slate-100">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                          <th className="py-2 px-3">Khách hàng</th>
                                          <th className="py-2 px-3">Số ĐT</th>
                                          <th className="py-2 px-3">Đại lý / Sale nhận</th>
                                          <th className="py-2 px-3">Pipeline</th>
                                          <th className="py-2 px-3">Thời gian</th>
                                          {onOpenLead && (
                                            <th className="py-2 px-3 text-right">Hồ sơ</th>
                                          )}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {(inlineState?.items || []).map((ld) => {
                                          const st = getPipelineStageBadge(
                                            ld.stage_key,
                                            ld.quality_status
                                          );
                                          return (
                                            <tr key={ld.id} className="hover:bg-slate-50">
                                              <td className="py-2 px-3 font-semibold text-slate-800">
                                                {ld.name}
                                              </td>
                                              <td className="py-2 px-3 font-mono text-slate-600 tabular-nums">
                                                {ld.phone || '—'}
                                              </td>
                                              <td className="py-2 px-3 text-slate-700">
                                                {ld.assigned_to_name}
                                                {ld.round_name ? (
                                                  <span className="text-slate-400">
                                                    {' '}
                                                    · {ld.round_name}
                                                  </span>
                                                ) : null}
                                              </td>
                                              <td className="py-2 px-3">
                                                <span
                                                  style={{
                                                    backgroundColor: st.bg,
                                                    color: st.color,
                                                    borderColor: st.border,
                                                  }}
                                                  className="px-2 py-0.5 rounded-full border text-[10.5px] font-bold"
                                                >
                                                  • {st.label}
                                                </span>
                                              </td>
                                              <td className="py-2 px-3 text-slate-500 tabular-nums">
                                                {ld.created_at}
                                              </td>
                                              {onOpenLead && (
                                                <td className="py-2 px-3 text-right">
                                                  <button
                                                    type="button"
                                                    onClick={() => onOpenLead(ld)}
                                                    className="px-2 py-1 rounded-md bg-blue-50 hover:bg-[#1E40FF] text-[#1E40FF] hover:text-white font-semibold cursor-pointer"
                                                  >
                                                    Mở
                                                  </button>
                                                </td>
                                              )}
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}

          {totalAdsPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Trang <strong className="text-slate-800">{safeAdsPage}</strong> / {totalAdsPages} (
                {filteredMatrixRows.length} bài quảng cáo)
              </span>
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safeAdsPage <= 1}
                  onClick={() => setAdsPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={safeAdsPage >= totalAdsPages}
                  onClick={() => setAdsPage((p) => Math.min(totalAdsPages, p + 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Row 3B: Đối Chiếu Từng Lead Table */
        <div className="rounded-2xl bg-white border border-slate-200/85 shadow-[0_2px_12px_rgba(15,23,42,0.03)] overflow-hidden">
          {isLoadingFlatLeads ? (
            <div className="p-4 space-y-2.5">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="h-14 rounded-xl dom-meta-skeleton-soft" />
              ))}
            </div>
          ) : flatLeads.length === 0 ? (
            <div className="py-14 text-center text-xs text-slate-400">
              Chưa ghi nhận khách hàng nào khớp bộ lọc trong khoảng ngày đã chọn.
            </div>
          ) : (
            <>
              {/* Mobile Native Lead Cards (< md) */}
              <div className="md:hidden p-3 space-y-2.5">
                {flatLeads.map((ld) => {
                  const matchedAd = ld.ad_id ? metaAdsMap.get(ld.ad_id) : undefined;
                  const stBadge = getPipelineStageBadge(ld.stage_key, ld.quality_status);
                  return (
                    <div
                      key={`ml_${ld.id}`}
                      className="rounded-2xl border border-slate-200/90 bg-slate-50/45 p-3 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${pickAvatarGradient(
                              ld.name || ld.id
                            )} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}
                          >
                            {getInitials(ld.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {ld.name}
                            </div>
                            <div className="text-[11px] font-mono text-slate-600 tabular-nums">
                              {ld.phone || '—'}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            backgroundColor: stBadge.bg,
                            color: stBadge.color,
                            borderColor: stBadge.border,
                          }}
                          className="px-2 py-0.5 rounded-full border text-[10.5px] font-bold shrink-0"
                        >
                          {stBadge.label}
                        </span>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-100 px-2.5 py-2 text-[11px] text-slate-600 space-y-1">
                        <div className="truncate">
                          Bài QC:{' '}
                          <strong className="text-slate-800">
                            {ld.ad_name || matchedAd?.name || `Ad #${ld.ad_id || 'N/A'}`}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[10.5px] text-slate-500">
                          <span className="truncate">Sale: {ld.assigned_to_name}</span>
                          <span className="font-mono shrink-0">{ld.created_at}</span>
                        </div>
                      </div>

                      {(onOpenLead || (matchedAd && onInspectAd)) && (
                        <div
                          className={`grid ${
                            onOpenLead && matchedAd && onInspectAd ? 'grid-cols-2' : 'grid-cols-1'
                          } gap-2`}
                        >
                          {matchedAd && onInspectAd && (
                            <button
                              type="button"
                              onClick={() => onInspectAd(matchedAd, 'insights')}
                              className="py-1.5 px-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem bài Ad</span>
                            </button>
                          )}
                          {onOpenLead && (
                            <button
                              type="button"
                              onClick={() => onOpenLead(ld)}
                              className="py-1.5 px-2.5 rounded-xl bg-[#1E40FF] text-white text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>Hồ sơ khách</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block dom-meta-table-scroll overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/95 border-b border-slate-200 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4 min-w-[180px]">KHÁCH HÀNG</th>
                    <th className="py-3 px-3 min-w-[120px]">SỐ ĐT</th>
                    <th className="py-3 px-3 min-w-[270px]">BÀI QUẢNG CÁO</th>
                    <th className="py-3 px-3 min-w-[190px]">ĐẠI LÝ / SALE NHẬN</th>
                    <th className="py-3 px-3 min-w-[175px]">PIPELINE</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">THỜI GIAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {flatLeads.map((ld) => {
                    const matchedAd = ld.ad_id ? metaAdsMap.get(ld.ad_id) : undefined;
                    const stBadge = getPipelineStageBadge(ld.stage_key, ld.quality_status);
                    return (
                      <tr key={ld.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-full bg-gradient-to-br ${pickAvatarGradient(
                                ld.name || ld.id
                              )} text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm`}
                            >
                              {getInitials(ld.name)}
                            </div>
                            <div className="min-w-0">
                              {onOpenLead ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenLead(ld)}
                                  className="font-bold text-slate-900 hover:text-[#1E40FF] truncate block text-left cursor-pointer"
                                >
                                  {ld.name}
                                </button>
                              ) : (
                                <div className="font-bold text-slate-900 truncate">{ld.name}</div>
                              )}
                              <div className="text-[10.5px] text-slate-400 font-mono">
                                Lead #{String(ld.id).slice(0, 8)}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-bold font-mono text-slate-800 tabular-nums whitespace-nowrap">
                          {ld.phone || '—'}
                        </td>

                        <td className="py-3 px-3 max-w-[300px]">
                          <div className="rounded-xl bg-slate-50/90 border border-slate-200/75 px-2.5 py-2 flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CreativeThumbFan
                                urls={
                                  matchedAd
                                    ? [matchedAd.thumbnail_url || matchedAd.image_url].filter(
                                        Boolean
                                      )
                                    : []
                                }
                                goal={matchedAd?.optimization_goal || 'QUALITY LEAD'}
                                active={matchedAd?.effective_status?.toUpperCase() === 'ACTIVE'}
                                variant="ad"
                                alt={ld.ad_name || 'Ad'}
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 truncate">
                                  {ld.ad_name || matchedAd?.name || `Ad #${ld.ad_id || 'N/A'}`}
                                </div>
                                <div className="text-[10.5px] text-slate-400 truncate">
                                  {ld.campaign_name || matchedAd?.campaign_name || ld.source}
                                </div>
                              </div>
                            </div>
                            {matchedAd && onInspectAd && (
                              <button
                                type="button"
                                onClick={() => onInspectAd(matchedAd, 'insights')}
                                title="Xem chi tiết bài quảng cáo"
                                className="w-7 h-7 rounded-lg bg-white hover:bg-[#1E40FF] border border-slate-200 text-slate-600 hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {ld.assigned_to_avatar ? (
                              <img
                                src={ld.assigned_to_avatar}
                                alt={ld.assigned_to_name}
                                className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-[#1E40FF] text-[10px] font-bold flex items-center justify-center shrink-0">
                                {getInitials(ld.assigned_to_name)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 truncate">
                                {ld.assigned_to_name}
                              </div>
                              <div className="text-[10.5px] text-slate-400 truncate">
                                {ld.round_name || ld.source || 'Meta Lead Ads'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <span
                              style={{
                                backgroundColor: stBadge.bg,
                                color: stBadge.color,
                                borderColor: stBadge.border,
                              }}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-bold"
                            >
                              • {stBadge.label}
                            </span>
                            {ld.quality_note && (
                              <div
                                className="text-[11px] text-slate-500 italic truncate max-w-[190px]"
                                title={ld.quality_note}
                              >
                                {ld.quality_note}
                              </div>
                            )}
                            {ld.capi_last_status === 'sent' && (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>CAPI: {ld.capi_last_event || 'Lead'} (200)</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px] whitespace-nowrap tabular-nums">
                          {ld.created_at}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}

          {totalLeadsPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Trang <strong className="text-slate-800">{leadsPage}</strong> / {totalLeadsPages} (
                {formatDomNumber(flatLeadsTotal)} khách hàng)
              </span>
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={leadsPage <= 1}
                  onClick={() => setLeadsPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={leadsPage >= totalLeadsPages}
                  onClick={() => setLeadsPage((p) => Math.min(totalLeadsPages, p + 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
