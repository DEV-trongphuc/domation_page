import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  GitCompare,
  Globe,
  HelpCircle,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  Plus,
  Save,
  Search,
  Settings2,
  Share2,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Target,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  DOM_META_METRIC_REGISTRY,
  DOM_META_SUMMARY_KPI_OPTIONS,
  calcDeltaPercent,
  collectEntityThumbs,
  formatDomMoney,
  formatDomMoneyShort,
  formatDomNumber,
  type DomGoogleAdsKeywordItem,
  type DomGoogleAdsSearchTermItem,
  type DomMetaAdNode,
  type DomMetaAdsetNode,
  type DomMetaAiReportEntry,
  type DomMetaBrandFilter,
  type DomMetaCampaignNode,
  type DomMetaColumnConfig,
  type DomMetaCrmEntityBucket,
  type DomMetaCrmLeadItem,
  type DomMetaCustomMetric,
  type DomMetaDashboardDataset,
  type DomMetaGoogleAdsConfig,
  type DomMetaTotalsSnapshot,
  type DomMetaViewPreset,
  type DomMetaWorkspaceConfig,
  type DomMetaWorkspacePatch,
} from './domMetaTypes';
import {
  fetchDomMetaCompareTotals,
  fetchDomMetaCrmAttribution,
  type DomMetaAuthContext,
} from './domMetaApi';
import {
  CreativeThumbFan,
  VideoFunnelBars,
} from './DomMetaCharts';
import { DomMetaSelect } from './DomMetaSelect';
import { GoogleAdsSetupGuide } from './GoogleAdsSetupGuide';

export const DOM_META_MODAL_BASE_Z = 2147483636;
export const DOM_META_MODAL_NESTED_Z = 2147483638;

export const DomMetaModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="mkt-scope dom-meta-scope" style={{ display: 'contents' }}>
      {children}
    </div>,
    document.body
  );
};

function getErrText(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}

function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSafeAiReportNodes(html: string, fallbackPlainText: string): React.ReactNode {
  if (!html.trim() || typeof DOMParser === 'undefined') {
    return <div className="whitespace-pre-line">{fallbackPlainText}</div>;
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node: ChildNode, keyPrefix: string): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();
    const children = Array.from(el.childNodes).map((c, idx) => walk(c, `${keyPrefix}_${idx}`));

    switch (tag) {
      case 'H2':
      case 'H3':
        return (
          <h4
            key={keyPrefix}
            className="text-xs sm:text-sm font-semibold text-slate-800 pt-2 pb-1 border-b border-slate-200/80 first:pt-0"
          >
            {children}
          </h4>
        );
      case 'P':
        return (
          <p key={keyPrefix} className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {children}
          </p>
        );
      case 'STRONG':
      case 'B':
        return (
          <strong key={keyPrefix} className="font-semibold text-slate-800">
            {children}
          </strong>
        );
      case 'UL':
        return (
          <ul key={keyPrefix} className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-700">
            {children}
          </ul>
        );
      case 'LI':
        return <li key={keyPrefix}>{children}</li>;
      case 'TABLE':
        return (
          <div key={keyPrefix} className="overflow-x-auto rounded-xl border border-slate-200 bg-white my-2">
            <table className="w-full text-left border-collapse text-xs">{children}</table>
          </div>
        );
      case 'THEAD':
        return (
          <thead key={keyPrefix} className="bg-slate-100 border-b border-slate-200">
            {children}
          </thead>
        );
      case 'TBODY':
        return (
          <tbody key={keyPrefix} className="divide-y divide-slate-100">
            {children}
          </tbody>
        );
      case 'TR':
        return (
          <tr key={keyPrefix} className="hover:bg-slate-50/80">
            {children}
          </tr>
        );
      case 'TH':
        return (
          <th
            key={keyPrefix}
            className="py-2.5 px-3 text-xs font-semibold text-slate-600 bg-slate-100 normal-case tracking-normal whitespace-nowrap"
          >
            {children}
          </th>
        );
      case 'TD':
        return (
          <td key={keyPrefix} className="py-2.5 px-3 text-xs text-slate-800 tabular-nums">
            {children}
          </td>
        );
      case 'BR':
        return <br key={keyPrefix} />;
      default:
        return <React.Fragment key={keyPrefix}>{children}</React.Fragment>;
    }
  };

  return (
    <div className="space-y-2.5">
      {Array.from(doc.body.childNodes).map((n, idx) => walk(n, `air_${idx}`))}
    </div>
  );
}

function buildStandaloneReportDocument(params: {
  title: string;
  dateRange: string;
  brandLabel: string;
  timestamp: string;
  bodyHtml: string;
  forWord?: boolean;
}): string {
  const { title, dateRange, brandLabel, timestamp, bodyHtml, forWord } = params;
  const rootAttrs = forWord
    ? 'xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"'
    : 'lang="vi"';
  const wordXml = forWord
    ? `<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->`
    : '';

  return `<!DOCTYPE html>
<html ${rootAttrs}>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  ${wordXml}
  <style>
    @page { margin: 1.8cm 2cm 2cm 2cm; }
    body { font-family: "Segoe UI", "Calibri", Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.6; margin: 0; padding: ${forWord ? '0' : '32px'}; background: #ffffff; }
    .doc-wrap { max-width: 860px; margin: 0 auto; }
    .doc-header { padding: 12pt 0 10pt; border-bottom: 2px solid #1E40FF; margin-bottom: 12pt; }
    .doc-eyebrow { font-size: 8.5pt; font-weight: 700; color: #1E40FF; letter-spacing: 0.1em; text-transform: uppercase; }
    .doc-header h1 { font-size: 18pt; font-weight: 800; color: #0f172a; margin: 4pt 0 0; }
    .doc-meta { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8pt 12pt; margin: 10pt 0 14pt; font-size: 9.5pt; color: #475569; }
    .doc-meta strong { color: #0f172a; }
    h2 { font-size: 13pt; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 3pt; margin: 16pt 0 6pt; }
    p, li { color: #334155; margin: 4pt 0; }
    ul { padding-left: 18pt; margin: 4pt 0; }
    table { border-collapse: collapse; width: 100%; margin: 10pt 0 14pt; font-size: 9.5pt; }
    th { background: #f1f5f9; color: #0f172a; font-weight: 700; padding: 7pt 9pt; border: 1px solid #cbd5e1; text-align: left; }
    td { padding: 6pt 9pt; border: 1px solid #e2e8f0; color: #1e293b; }
    tr:nth-child(even) td { background: #f8fafc; }
    .doc-footer { border-top: 1px solid #e2e8f0; margin-top: 18pt; padding-top: 8pt; font-size: 8.5pt; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="doc-wrap">
    <div class="doc-header">
      <div class="doc-eyebrow">DOMATION META REPORT AI — BÁO CÁO PHÂN TÍCH QUẢNG CÁO</div>
      <h1>${escapeHtml(title)}</h1>
    </div>
    <div class="doc-meta">
      Chu kỳ dữ liệu: <strong>${escapeHtml(dateRange)}</strong>
      &nbsp;|&nbsp; Thương hiệu: <strong>${escapeHtml(brandLabel || 'Tất cả')}</strong>
      &nbsp;|&nbsp; Xuất lúc: <strong>${escapeHtml(timestamp)}</strong>
    </div>
    <div class="doc-body">${bodyHtml}</div>
    <div class="doc-footer">
      <strong>DOMATION Meta Report AI</strong> — Hệ sinh thái Báo cáo Quảng cáo &amp; Tăng trưởng Đa kênh
    </div>
  </div>
</body>
</html>`;
}

function getQualityStatusDisplay(rawStatus: string, stageKey?: string): {
  label: string;
  className: string;
} {
  const key = (stageKey || rawStatus || '').toLowerCase();
  if (key === 'closed' || key.includes('chốt') || key === 'won') {
    return {
      label: 'Chốt HĐ',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  }
  if (key === 'deposited' || key.includes('cọc')) {
    return {
      label: 'Đặt cọc',
      className: 'bg-purple-50 text-purple-700 border-purple-200',
    };
  }
  if (key === 'booking' || key.includes('giữ chỗ')) {
    return {
      label: 'Booking',
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  }
  if (key === 'booked' || key.includes('hẹn gặp')) {
    return {
      label: 'Hẹn gặp',
      className: 'bg-blue-50 text-[#1E40FF] border-blue-200',
    };
  }
  if (key === 'qualified' || key === 'good' || key === 'hot' || key.includes('thiện chí')) {
    return {
      label: 'Đủ ĐK / Thiện chí',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (key === 'badtiming' || key === 'bad_timing' || key.includes('hẹn gọi')) {
    return {
      label: 'Hẹn gọi lại',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  if (key === 'noanswer' || key === 'no_answer' || key.includes('không nghe')) {
    return {
      label: 'Chưa nghe máy',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }
  if (key === 'notlead' || key === 'disqualified' || key === 'junk' || key.includes('sai số')) {
    return {
      label: 'Không phù hợp',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }
  return {
    label: 'Chờ xử lý',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  };
}

function getInitials(name: string): string {
  const parts = String(name || 'S')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

export const AdEntityDetailModal: React.FC<{
  entity: (DomMetaCampaignNode | DomMetaAdNode | DomMetaAdsetNode) | null;
  entityType: 'campaign' | 'ad' | 'adset';
  currency?: string;
  enableCrmAttribution?: boolean;
  crmBucket?: DomMetaCrmEntityBucket | null;
  authContext?: DomMetaAuthContext;
  dateRange?: { since: string; until: string };
  initialTab?: 'insights' | 'crm_leads';
  onOpenLead?: (lead: DomMetaCrmLeadItem) => void;
  onFilterCampaignLeads?: (campaignId: string, campaignName: string) => void;
  onSelectChildAdset?: (adset: DomMetaAdsetNode) => void;
  onClose: () => void;
}> = ({
  entity,
  entityType,
  currency = 'VND',
  enableCrmAttribution = false,
  crmBucket,
  authContext,
  dateRange,
  initialTab = 'insights',
  onOpenLead,
  onFilterCampaignLeads,
  onSelectChildAdset,
  onClose,
}) => {
  const [showFunnel, setShowFunnel] = useState(true);
  const [actionQuery, setActionQuery] = useState('');

  const entityKey = entity ? `${entityType}:${entity.id}:${initialTab}` : '';
  const [tabState, setTabState] = useState<{
    key: string;
    tab: 'insights' | 'crm_leads';
    saleId: string;
    quality: string;
  }>({
    key: '',
    tab: 'insights',
    saleId: 'all',
    quality: 'all',
  });

  const activeModalTab: 'insights' | 'crm_leads' =
    tabState.key === entityKey ? tabState.tab : initialTab;
  const saleFilter = tabState.key === entityKey ? tabState.saleId : 'all';
  const qualityFilter = tabState.key === entityKey ? tabState.quality : 'all';

  const [leadsResp, setLeadsResp] = useState<{
    fetchKey: string;
    items: DomMetaCrmLeadItem[];
    total: number;
    salesOptions: Array<{ user_id: string; name: string; avatar?: string | null; count: number }>;
    bucketFallback?: DomMetaCrmEntityBucket;
    error?: string;
  } | null>(null);

  const expectedFetchKey =
    entity && enableCrmAttribution && activeModalTab === 'crm_leads' && authContext && dateRange
      ? `${entityType}:${entity.id}:${dateRange.since}:${dateRange.until}:${saleFilter}:${qualityFilter}`
      : '';

  useEffect(() => {
    if (!expectedFetchKey || !entity || !authContext || !dateRange) return;
    let cancelled = false;
    fetchDomMetaCrmAttribution(authContext, {
      since: dateRange.since,
      until: dateRange.until,
      entity_type: entityType,
      entity_id: entity.id,
      entity_name: entity.name || undefined,
      sale_id: saleFilter !== 'all' ? saleFilter : undefined,
      quality_status: qualityFilter !== 'all' ? qualityFilter : undefined,
      page: 1,
      page_size: 100,
    })
      .then((res) => {
        if (cancelled) return;
        const normNameKey = (entity.name || '').normalize('NFC').trim().toLowerCase();
        const resolvedBucket =
          entityType === 'ad'
            ? res.by_ad[entity.id]
            : entityType === 'adset'
              ? res.by_adset[entity.id]
              : res.by_campaign[entity.id] ||
                (normNameKey ? res.by_campaign_name?.[normNameKey] : undefined);
        setLeadsResp({
          fetchKey: expectedFetchKey,
          items: res.entity_leads?.items || [],
          total: res.entity_leads?.total || 0,
          salesOptions: res.entity_leads?.sales_filter_options || [],
          bucketFallback: resolvedBucket,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLeadsResp({
          fetchKey: expectedFetchKey,
          items: [],
          total: 0,
          salesOptions: [],
          error: getErrText(err, 'Không thể tải danh sách khách hàng từ chiến dịch này.'),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [expectedFetchKey, entity, entityType, authContext, dateRange, saleFilter, qualityFilter]);

  if (!entity) return null;

  const isAd = entityType === 'ad';
  const isCamp = entityType === 'campaign';
  const adNode = entity as DomMetaAdNode;
  const adsetNode = entity as DomMetaAdsetNode;
  const campNode = entity as DomMetaCampaignNode;
  const freq = entity.reach > 0 ? entity.impressions / entity.reach : 0;
  const freqPct = Math.min(100, (freq / 4) * 100);
  const goalUpper = String(entity.optimization_goal || '').toUpperCase();
  const cprHeaderLabel =
    goalUpper === 'REACH'
      ? 'Cost per 1,000 Reach'
      : goalUpper === 'IMPRESSIONS'
        ? 'Cost per 1,000 Impr.'
        : 'Cost per Result';

  const actionEntries = Object.entries(entity.actions || {})
    .filter(([k, v]) => v > 0 && k.toLowerCase().includes(actionQuery.toLowerCase()))
    .sort((a, b) => b[1] - a[1]);

  const entityThumbs = isAd
    ? [adNode.thumbnail_url || adNode.image_url].filter(Boolean)
    : isCamp
      ? collectEntityThumbs((campNode.adsets || []).flatMap((as) => as.ads || []), 3)
      : collectEntityThumbs(adsetNode.ads || [], 3);

  const effectiveBucket = crmBucket || leadsResp?.bucketFallback || null;
  const totalCrmLeads = effectiveBucket?.total_leads ?? leadsResp?.total ?? 0;
  const qualifiedCrmLeads = effectiveBucket?.qualified_leads ?? 0;
  const closedOrDepositedCrm =
    (effectiveBucket?.pipeline?.Deposited || 0) +
    (effectiveBucket?.pipeline?.Closed || effectiveBucket?.closed_leads || 0);
  const crmRevenueVnd = effectiveBucket?.total_revenue_vnd ?? 0;
  const capiSentCount = effectiveBucket?.capi_sent_count ?? 0;
  const crmPositiveRate = effectiveBucket?.positive_rate ?? 0;
  const crmRoas = entity.spend > 0 && crmRevenueVnd > 0 ? crmRevenueVnd / entity.spend : 0;
  const isLoadingLeads = Boolean(expectedFetchKey && leadsResp?.fetchKey !== expectedFetchKey);
  const currentLeads = leadsResp?.fetchKey === expectedFetchKey ? leadsResp.items : [];
  const salesOptions =
    leadsResp?.salesOptions && leadsResp.salesOptions.length > 0
      ? leadsResp.salesOptions
      : (effectiveBucket?.sales || []).map((s) => ({
          user_id: s.user_id,
          name: s.name,
          avatar: s.avatar,
          count: s.lead_count,
        }));

  const updateTabState = (
    patch: Partial<{ tab: 'insights' | 'crm_leads'; saleId: string; quality: string }>
  ) => {
    setTabState((prev) => {
      const base =
        prev.key === entityKey
          ? prev
          : { key: entityKey, tab: initialTab, saleId: 'all', quality: 'all' };
      return { ...base, ...patch };
    });
  };

  return (
    <DomMetaModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        data-testid="dom-meta-entity-modal"
        onClick={onClose}
        style={{ zIndex: DOM_META_MODAL_BASE_Z }}
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl max-h-[90vh] bg-[#F8F9FA] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800"
        >
          {/* Header */}
          <div className="px-5 sm:px-7 py-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <CreativeThumbFan
                urls={entityThumbs}
                goal={entity.optimization_goal}
                active={entity.effective_status.toUpperCase() === 'ACTIVE'}
                variant="modal"
                eager
                alt={entity.name}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1E40FF] text-[10px] font-semibold uppercase">
                    {isAd ? 'Chi tiết Quảng cáo' : isCamp ? 'Chi tiết Chiến dịch' : 'Chi tiết Nhóm QC'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">ID: {entity.id}</span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate mt-0.5">
                  {entity.name}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {enableCrmAttribution && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    data-testid="entity-modal-insights-tab"
                    onClick={() => updateTabState({ tab: 'insights' })}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      activeModalTab === 'insights'
                        ? 'bg-white text-[#1E40FF] font-semibold shadow-sm'
                        : 'text-slate-600 font-medium hover:text-slate-900'
                    }`}
                  >
                    Chỉ số Quảng cáo
                  </button>
                  <button
                    type="button"
                    data-testid="entity-modal-crm-tab"
                    onClick={() => updateTabState({ tab: 'crm_leads' })}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      activeModalTab === 'crm_leads'
                        ? 'bg-[#1E40FF] text-white font-semibold shadow-sm'
                        : 'text-slate-700 font-medium hover:text-[#1E40FF]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Lead &amp; Phân bổ Sale ({totalCrmLeads})</span>
                  </button>
                </div>
              )}

              {isAd && adNode.post_url && (
                <a
                  href={adNode.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E40FF] text-xs font-semibold"
                >
                  <span>Xem bài Post</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {activeModalTab === 'crm_leads' && enableCrmAttribution ? (
              <div data-testid="entity-modal-crm-panel" className="space-y-4">
                {/* 5 Summary KPI Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="rounded-2xl bg-gradient-to-br from-[#1E40FF] to-[#0284C7] text-white p-3.5 shadow-sm">
                    <div className="text-[11px] font-medium text-white/85">Tổng Lead CRM</div>
                    <div className="text-xl font-bold mt-1 tabular-nums">
                      {formatDomNumber(totalCrmLeads)}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-200/80 p-3.5">
                    <div className="text-[11px] font-medium text-slate-500">Khách chất lượng</div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-xl font-semibold text-emerald-700 tabular-nums">
                        {formatDomNumber(qualifiedCrmLeads)}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600">
                        ({crmPositiveRate}%)
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-200/80 p-3.5">
                    <div className="text-[11px] font-medium text-slate-500">Đặt cọc / Chốt HĐ</div>
                    <div className="text-xl font-semibold text-slate-800 mt-1 tabular-nums">
                      {formatDomNumber(closedOrDepositedCrm)}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-200/80 p-3.5">
                    <div className="text-[11px] font-medium text-slate-500">Doanh thu thực</div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-lg font-semibold text-slate-800 tabular-nums">
                        {crmRevenueVnd > 0 ? formatDomMoneyShort(crmRevenueVnd, currency) : '—'}
                      </span>
                      {crmRoas > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          {crmRoas.toFixed(1)}x
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-200/80 p-3.5">
                    <div className="text-[11px] font-medium text-slate-500">Đã đồng bộ CAPI</div>
                    <div className="text-xl font-semibold text-[#1E40FF] mt-1 tabular-nums">
                      {formatDomNumber(capiSentCount)}
                    </div>
                  </div>
                </div>

                {/* Mini Breakdown Bar by Sale */}
                {effectiveBucket && effectiveBucket.sales.length > 0 && (
                  <div className="rounded-2xl bg-white border border-slate-200/80 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Phân bổ theo Sale phụ trách ({effectiveBucket.sales.length} nhân sự)
                      </h4>
                      {saleFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => updateTabState({ saleId: 'all' })}
                          className="text-xs font-semibold text-[#1E40FF] hover:underline cursor-pointer"
                        >
                          Xem tất cả Sale
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {effectiveBucket.sales.slice(0, 6).map((s) => {
                        const maxSaleLeads = Math.max(
                          1,
                          ...effectiveBucket.sales.map((item) => item.lead_count)
                        );
                        const barPct = Math.max(8, Math.round((s.lead_count / maxSaleLeads) * 100));
                        const isSelectedSale = saleFilter === s.user_id;
                        return (
                          <button
                            key={s.user_id}
                            type="button"
                            onClick={() =>
                              updateTabState({
                                saleId: isSelectedSale ? 'all' : s.user_id,
                              })
                            }
                            className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                              isSelectedSale
                                ? 'bg-[#F4F8FF] border-[#1E40FF] shadow-sm'
                                : 'bg-slate-50/70 border-slate-200/80 hover:border-blue-200 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {s.avatar ? (
                                  <img
                                    src={s.avatar}
                                    alt={s.name}
                                    className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {getInitials(s.name)}
                                  </div>
                                )}
                                <span className="text-xs font-semibold text-slate-800 truncate">
                                  {s.name}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-[#1E40FF] tabular-nums shrink-0">
                                {s.lead_count} khách
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]"
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                              <span>
                                Chất lượng:{' '}
                                <strong className="text-emerald-700">{s.qualified_count}</strong>
                              </span>
                              {s.revenue_vnd > 0 && (
                                <span className="font-semibold text-slate-700 tabular-nums">
                                  {formatDomMoneyShort(s.revenue_vnd, currency)}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Filter Toolbar + Lead Table */}
                <div className="rounded-2xl bg-white border border-slate-200/80 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <DomMetaSelect
                        ariaLabel="Lọc theo Sale phụ trách"
                        value={saleFilter}
                        onChange={(val) => updateTabState({ saleId: val })}
                        variant="pill"
                        options={[
                          { value: 'all', label: 'Tất cả Sale phụ trách' },
                          ...salesOptions.map((opt) => ({
                            value: opt.user_id,
                            label: `${opt.name} (${opt.count})`,
                          })),
                        ]}
                      />

                      <DomMetaSelect
                        ariaLabel="Lọc theo trạng thái chất lượng"
                        value={qualityFilter}
                        onChange={(val) => updateTabState({ quality: val })}
                        variant="pill"
                        options={[
                          { value: 'all', label: 'Tất cả trạng thái chất lượng' },
                          { value: 'qualified', label: 'Khách chất lượng (Đủ ĐK / Hẹn / Cọc / Chốt)' },
                          { value: 'closed', label: 'Đã đặt cọc / Chốt HĐ' },
                          { value: 'pending', label: 'Đang chăm sóc / Chờ xử lý' },
                          { value: 'negative', label: 'Không phù hợp / Sai số' },
                        ]}
                      />
                    </div>

                    {isCamp && onFilterCampaignLeads && (
                      <button
                        type="button"
                        onClick={() => {
                          onFilterCampaignLeads(entity.id, entity.name);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F4F8FF] hover:bg-blue-100/70 border border-blue-200 text-xs font-semibold text-[#1E40FF] cursor-pointer"
                      >
                        <span>Mở trên Danh sách Khách hàng</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isLoadingLeads ? (
                    <div className="py-10 flex items-center justify-center gap-2 text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-[#1E40FF]" />
                      <span>Đang tải danh sách khách hàng đối soát...</span>
                    </div>
                  ) : leadsResp?.error ? (
                    <div className="py-8 text-center text-xs text-rose-600">{leadsResp.error}</div>
                  ) : currentLeads.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400">
                      Chưa ghi nhận khách hàng nào khớp bộ lọc trong khoảng ngày đã chọn.
                    </div>
                  ) : (
                    <div className="dom-meta-table-scroll overflow-x-auto overflow-y-auto max-h-[340px] rounded-xl border border-slate-200">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-semibold">
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">
                              Khách hàng &amp; SĐT
                            </th>
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">
                              Thời gian
                            </th>
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">
                              Sale phụ trách &amp; Vòng chia
                            </th>
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">
                              Trạng thái chất lượng
                            </th>
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">
                              Đồng bộ CAPI
                            </th>
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">
                              Doanh thu
                            </th>
                            {onOpenLead && (
                              <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">
                                Hồ sơ
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentLeads.map((ld) => {
                            const qBadge = getQualityStatusDisplay(ld.quality_status, ld.stage_key);
                            return (
                              <tr key={ld.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-slate-800">{ld.name}</div>
                                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                    {ld.phone || '—'}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap tabular-nums">
                                  {(() => {
                                    const raw = String(ld.created_at || '');
                                    if (!raw) return '—';
                                    if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
                                      const dt = new Date(raw);
                                      if (!Number.isNaN(dt.getTime())) {
                                        const timeStr = dt.toLocaleTimeString('vi-VN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: false,
                                          timeZone: 'Asia/Ho_Chi_Minh',
                                        });
                                        const dateStr = dt.toLocaleDateString('vi-VN', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          timeZone: 'Asia/Ho_Chi_Minh',
                                        });
                                        return `${timeStr} · ${dateStr}`;
                                      }
                                    }
                                    return raw;
                                  })()}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    {ld.assigned_to_avatar ? (
                                      <img
                                        src={ld.assigned_to_avatar}
                                        alt={ld.assigned_to_name}
                                        className="w-5 h-5 rounded-full object-cover shrink-0"
                                      />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-blue-100 text-[#1E40FF] text-[9.5px] font-bold flex items-center justify-center shrink-0">
                                        {getInitials(ld.assigned_to_name)}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <div className="font-medium text-slate-800 truncate">
                                        {ld.assigned_to_name}
                                      </div>
                                      {ld.round_name && (
                                        <div className="text-[10.5px] text-slate-400 truncate">
                                          {ld.round_name}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${qBadge.className}`}
                                  >
                                    {qBadge.label}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  {ld.capi_last_status === 'sent' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10.5px] font-semibold">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{ld.capi_last_event || 'Lead'}</span>
                                    </span>
                                  ) : ld.capi_last_status === 'failed' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10.5px] font-medium">
                                      Chờ gửi lại
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-semibold text-slate-800 whitespace-nowrap tabular-nums">
                                  {ld.total_revenue_vnd > 0
                                    ? formatDomMoneyShort(ld.total_revenue_vnd, currency)
                                    : '—'}
                                </td>
                                {onOpenLead && (
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      data-testid={`open-crm-lead-${ld.id}`}
                                      onClick={() => {
                                        onOpenLead(ld);
                                        onClose();
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-[#1E40FF] text-[#1E40FF] hover:text-white font-semibold transition-colors cursor-pointer"
                                    >
                                      Xem hồ sơ
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
              </div>
            ) : (
              <>
            {/* Row 1: 4 Hero Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="rounded-2xl bg-gradient-to-br from-[#1E40FF] via-[#0284C7] to-[#06B6D4] text-white p-4 shadow-sm">
                <div className="text-xs font-medium text-white/85">Spent</div>
                <div className="text-xl sm:text-2xl font-bold mt-1 tabular-nums">
                  {formatDomMoney(entity.spend, currency)}
                </div>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/80 p-4">
                <div className="text-xs font-medium text-slate-500">Optimization Goal</div>
                <div className="text-base sm:text-lg font-semibold text-slate-800 mt-1 truncate">
                  {entity.optimization_goal || 'QUALITY LEAD'}
                </div>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/80 p-4">
                <div className="text-xs font-medium text-slate-500">Results</div>
                <div className="text-xl sm:text-2xl font-semibold text-slate-800 mt-1 tabular-nums">
                  {formatDomNumber(entity.result)}
                </div>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/80 p-4">
                <div className="text-xs font-medium text-slate-500">{cprHeaderLabel}</div>
                <div className="text-xl sm:text-2xl font-semibold text-[#1E40FF] mt-1 tabular-nums">
                  {entity.result > 0 ? formatDomMoney(entity.cpr, currency) : '—'}
                </div>
              </div>
            </div>

            {/* Row 2: Video Funnel / Interaction + Frequency Semi-Donut + Targeting */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">
                    {showFunnel ? 'Creative Video Funnel (Hook & Hold Rate)' : 'Interaction Breakdown'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowFunnel((v) => !v)}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#1E40FF] text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    ⇄ {showFunnel ? 'Interaction' : 'Video Funnel'}
                  </button>
                </div>

                {showFunnel ? (
                  <VideoFunnelBars
                    impressions={entity.impressions}
                    video3s={entity.video_3s}
                    thruplay={entity.thruplay}
                    p50={entity.video_p50}
                    p95={entity.video_p95}
                    linkClicks={entity.link_click}
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      ['Video Plays', entity.video_play],
                      ['ThruPlays', entity.thruplay],
                      ['Link Clicks', entity.link_click],
                      ['Post Engagement', entity.post_engagement],
                      ['Reactions', entity.reaction],
                      ['Comments', entity.comments],
                    ].map(([lbl, val]) => (
                      <div
                        key={String(lbl)}
                        className="rounded-xl bg-slate-50 border border-slate-100 p-3"
                      >
                        <div className="text-[11px] font-medium text-slate-500">{lbl}</div>
                        <div className="text-base font-semibold text-slate-700 mt-1 tabular-nums">
                          {formatDomNumber(Number(val || 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Frequency Gauge & Targeting Summary */}
              <div className="rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">
                    Frequency &amp; Delivery
                  </h4>
                  <div className="relative flex flex-col items-center py-2">
                    <svg viewBox="0 0 180 100" className="w-44 h-24">
                      <path
                        d="M 18 88 A 72 72 0 0 1 162 88"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="16"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 18 88 A 72 72 0 0 1 162 88"
                        fill="none"
                        stroke="#1E40FF"
                        strokeWidth="16"
                        strokeLinecap="round"
                        strokeDasharray={`${(freqPct / 100) * 226} 226`}
                      />
                    </svg>
                    <div className="-mt-8 text-center">
                      <div className="text-2xl font-bold text-slate-800 tabular-nums">
                        {freq.toFixed(2)}
                      </div>
                      <div className="text-[11px] font-normal text-slate-500">
                        Tần suất lặp trung bình
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block">Impressions</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {formatDomNumber(entity.impressions)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Reach</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {formatDomNumber(entity.reach)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">CTR</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {entity.ctr.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">CPM</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {formatDomMoney(entity.cpm, currency)}
                    </span>
                  </div>
                </div>

                {entityType === 'adset' && adsetNode.targeting && (
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                    <div className="font-semibold text-slate-700">Targeting Spec:</div>
                    <div>
                      Độ tuổi: <span className="font-semibold text-slate-800">{adsetNode.targeting.age_min || 18}</span> –{' '}
                      <span className="font-semibold text-slate-800">{adsetNode.targeting.age_max || '65+'}</span>
                      {Array.isArray(adsetNode.targeting.genders) &&
                        adsetNode.targeting.genders.length === 1 && (
                          <span>
                            {' '}
                            · Giới tính:{' '}
                            <span className="font-semibold text-slate-800">
                              {Number(adsetNode.targeting.genders[0]) === 1 ? 'Nam' : 'Nữ'}
                            </span>
                          </span>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Child Adsets Breakdown when viewing Campaign Insight */}
            {isCamp && Array.isArray(campNode.adsets) && campNode.adsets.length > 0 && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">
                    Nhóm Quảng Cáo Thuộc Chiến Dịch ({campNode.adsets.length} Adsets)
                  </h4>
                </div>
                <div className="dom-meta-table-scroll overflow-x-auto overflow-y-auto max-h-[300px] rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3">Adset Name</th>
                        <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">Spent</th>
                        <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">Results</th>
                        <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">CPR</th>
                        <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">Hook Rate</th>
                        {onSelectChildAdset && <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">Chi tiết</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {campNode.adsets.map((as) => (
                        <tr key={as.id} className="group/row hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 max-w-[280px]">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CreativeThumbFan
                                urls={collectEntityThumbs(as.ads || [], 2)}
                                goal={as.optimization_goal}
                                active={as.effective_status.toUpperCase() === 'ACTIVE'}
                                variant="adset"
                                alt={as.name}
                              />
                              <span className="font-medium text-slate-700 truncate">{as.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-800 tabular-nums">
                            {formatDomMoney(as.spend, currency)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                            {formatDomNumber(as.result)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-[#1E40FF] tabular-nums">
                            {as.result > 0 ? formatDomMoney(as.cpr, currency) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                            {as.hook_rate.toFixed(1)}%
                          </td>
                          {onSelectChildAdset && (
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => onSelectChildAdset(as)}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E40FF] font-medium cursor-pointer"
                              >
                                Mở Adset
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Row 3: Full Actions Detail */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-800">
                  Full Actions Detail ({actionEntries.length} chỉ số chuyển đổi)
                </h4>
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={actionQuery}
                    onChange={(e) => setActionQuery(e.target.value)}
                    placeholder="Lọc chỉ số action..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-[#1E40FF]"
                  />
                </div>
              </div>

              {actionEntries.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Không có action chi tiết khớp bộ lọc
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {actionEntries.map(([actKey, actVal]) => (
                    <div
                      key={actKey}
                      className="rounded-xl bg-slate-50/90 border border-slate-100 px-3 py-2.5 flex items-center justify-between gap-2"
                    >
                      <span
                        className="text-[11px] font-normal text-slate-600 truncate"
                        title={actKey}
                      >
                        {actKey.replace(/^onsite_conversion\./, '').replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 tabular-nums shrink-0">
                        {formatDomNumber(actVal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DomMetaModalPortal>
  );
};


type PerfCompareMode = 'auto' | 'last_year' | 'custom';

function shiftIsoDateYear(iso: string, deltaYears: number): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const d = new Date(Number(m[1]) + deltaYears, Number(m[2]) - 1, Number(m[3]));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtShortDayMonth(iso?: string | null): string {
  if (!iso) return '??/??';
  const parts = iso.slice(0, 10).split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iso;
}

function aggregateTotalsFromCampaigns(campaigns: DomMetaCampaignNode[]): DomMetaTotalsSnapshot {
  let spend = 0;
  let impressions = 0;
  let reach = 0;
  let clicks = 0;
  let link_click = 0;
  let leads = 0;
  let messages = 0;
  let message_connection = 0;
  let purchases = 0;
  let purchase_value = 0;
  let video_play = 0;
  let video_3s = 0;
  let video_p25 = 0;
  let video_p50 = 0;
  let video_p75 = 0;
  let video_p95 = 0;
  let video_p100 = 0;
  let thruplay = 0;
  let post_engagement = 0;
  let reaction = 0;
  let comments = 0;
  let shares = 0;
  let photo_view = 0;
  let follows = 0;

  const getAct = (actions: Record<string, number> | undefined, keys: string[]) => {
    if (!actions) return 0;
    for (const k of keys) {
      if (actions[k] && actions[k] > 0) return actions[k];
    }
    return 0;
  };

  for (const c of campaigns) {
    spend += c.spend || 0;
    impressions += c.impressions || 0;
    reach += c.reach || 0;
    clicks += c.clicks || 0;
    link_click += c.link_click || 0;
    leads += c.leads || 0;
    messages += c.messages || 0;
    message_connection += getAct(c.actions, [
      'onsite_conversion.total_messaging_connection',
      'total_messaging_connection',
    ]);
    purchases += c.purchases || 0;
    purchase_value += c.purchase_value || 0;
    video_play += c.video_play || 0;
    video_3s += c.video_3s || 0;
    video_p25 += c.video_p25 || 0;
    video_p50 += c.video_p50 || 0;
    video_p75 += c.video_p75 || 0;
    video_p95 += c.video_p95 || 0;
    video_p100 += c.video_p100 || 0;
    thruplay += c.thruplay || 0;
    post_engagement += c.post_engagement || 0;
    reaction += c.reaction || 0;
    comments += c.comments || 0;
    shares += getAct(c.actions, ['post', 'share']);
    photo_view += getAct(c.actions, ['photo_view']);
    follows += c.follows || 0;
  }

  return {
    spend,
    impressions,
    reach,
    clicks,
    link_click,
    leads,
    messages,
    message_connection,
    purchases,
    purchase_value,
    roas: spend > 0 && purchase_value > 0 ? purchase_value / spend : 0,
    video_play,
    video_3s,
    video_p25,
    video_p50,
    video_p75,
    video_p95,
    video_p100,
    thruplay,
    post_engagement,
    reaction,
    comments,
    shares,
    photo_view,
    follows,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    frequency: reach > 0 ? impressions / reach : 0,
    hook_rate: impressions > 0 ? (video_3s / impressions) * 100 : 0,
    hold_rate: video_3s > 0 ? Math.min(100, (thruplay / video_3s) * 100) : 0,
  };
}

const PerfCustomCalendarGrid: React.FC<{
  monthDate: Date;
  selectedStart: string;
  selectedEnd: string;
  onSelectDay: (iso: string) => void;
  onShiftMonth: (delta: number) => void;
}> = ({ monthDate, selectedStart, selectedEnd, onSelectDay, onShiftMonth }) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const cells: Array<{ iso: string | null; day: number | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ iso: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ iso, day: d });
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onShiftMonth(-1)}
          className="w-7 h-7 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-semibold text-slate-800">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => onShiftMonth(1)}
          className="w-7 h-7 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
          <div key={`${d}-${idx}`} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((c, idx) => {
          if (!c.iso || !c.day) return <div key={`empty-${idx}`} className="h-8" />;
          const isStart = Boolean(selectedStart && c.iso === selectedStart);
          const isEnd = Boolean(selectedEnd && c.iso === selectedEnd);
          const inRange = Boolean(
            selectedStart && selectedEnd && c.iso > selectedStart && c.iso < selectedEnd
          );
          return (
            <button
              key={c.iso}
              type="button"
              onClick={() => onSelectDay(c.iso!)}
              className={`h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isStart || isEnd
                  ? 'bg-[#1E40FF] text-white font-semibold shadow-sm'
                  : inRange
                    ? 'bg-blue-50 text-[#1E40FF]'
                    : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {c.day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const PerformanceCompareModalBody: React.FC<{
  dataset: DomMetaDashboardDataset;
  authContext?: DomMetaAuthContext;
  adAccountId?: string;
  currency: string;
  brandFilters: DomMetaBrandFilter[];
  summaryMetrics: string[];
  canManageConfig: boolean;
  onSaveSummaryMetrics?: (nextMetrics: string[]) => Promise<void> | void;
  onClose: () => void;
}> = ({
  dataset,
  authContext,
  adAccountId,
  currency,
  brandFilters,
  summaryMetrics,
  canManageConfig,
  onSaveSummaryMetrics,
  onClose,
}) => {
  const [compareMode, setCompareMode] = useState<PerfCompareMode>('auto');
  const [brandFilter, setBrandFilter] = useState<string>('__all__');
  const [customStart, setCustomStart] = useState<string>(dataset.dateRange.prevSince);
  const [customEnd, setCustomEnd] = useState<string>(dataset.dateRange.prevUntil);
  const [calMonth, setCalMonth] = useState<Date>(
    () => new Date(`${dataset.dateRange.prevSince}T00:00:00`)
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [draftSummary, setDraftSummary] = useState<string[]>(() =>
    summaryMetrics.length === 3 ? [...summaryMetrics] : ['reach', 'leads', 'impressions']
  );
  const [savingSummary, setSavingSummary] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string | null>(null);
  const [settingsErrMsg, setSettingsErrMsg] = useState<string | null>(null);

  const [loadingCompare, setLoadingCompare] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [customCompareSnapshot, setCustomCompareSnapshot] =
    useState<DomMetaTotalsSnapshot | null>(null);
  const [activeCompareRange, setActiveCompareRange] = useState<{
    since: string;
    until: string;
  }>({
    since: dataset.dateRange.prevSince,
    until: dataset.dateRange.prevUntil,
  });

  const matchingBrandCampaigns = useMemo(() => {
    if (brandFilter === '__all__') return null;
    const kw = brandFilter.trim().toLowerCase();
    return dataset.campaigns.filter((c) => kw && c.name.toLowerCase().includes(kw));
  }, [brandFilter, dataset.campaigns]);

  const currentTotals: DomMetaTotalsSnapshot = useMemo(() => {
    if (!matchingBrandCampaigns) {
      return dataset.currentTotals;
    }
    return aggregateTotalsFromCampaigns(matchingBrandCampaigns);
  }, [matchingBrandCampaigns, dataset.currentTotals]);

  const prevTotals: DomMetaTotalsSnapshot = useMemo(() => {
    if (customCompareSnapshot) return customCompareSnapshot;
    if (matchingBrandCampaigns && dataset.currentTotals.spend > 0) {
      const shareRatio = currentTotals.spend / dataset.currentTotals.spend;
      const p = dataset.prevTotals;
      return {
        ...p,
        spend: p.spend * shareRatio,
        impressions: p.impressions * shareRatio,
        reach: p.reach * shareRatio,
        clicks: p.clicks * shareRatio,
        leads: p.leads * shareRatio,
        messages: p.messages * shareRatio,
        purchases: p.purchases * shareRatio,
        follows: p.follows * shareRatio,
      };
    }
    return dataset.prevTotals;
  }, [customCompareSnapshot, matchingBrandCampaigns, currentTotals.spend, dataset.currentTotals.spend, dataset.prevTotals]);

  const runCompareFetch = async (
    nextMode: PerfCompareMode,
    since: string,
    until: string,
    nextBrand: string
  ) => {
    setActiveCompareRange({ since, until });
    setCompareError(null);
    if (nextMode === 'auto' && nextBrand === '__all__') {
      setCustomCompareSnapshot(null);
      return;
    }
    if (!authContext || !adAccountId) {
      setCustomCompareSnapshot(null);
      return;
    }
    const kw = nextBrand !== '__all__' ? nextBrand.trim().toLowerCase() : '';
    const campIds = kw
      ? dataset.campaigns
          .filter((c) => c.name.toLowerCase().includes(kw))
          .map((c) => c.id)
      : undefined;

    if (kw && (!campIds || campIds.length === 0)) {
      setCustomCompareSnapshot({
        spend: 0, impressions: 0, reach: 0, clicks: 0, link_click: 0,
        leads: 0, messages: 0, message_connection: 0, purchases: 0, purchase_value: 0,
        roas: 0, video_play: 0, video_3s: 0, video_p25: 0, video_p50: 0,
        video_p75: 0, video_p95: 0, video_p100: 0, thruplay: 0, post_engagement: 0,
        reaction: 0, comments: 0, shares: 0, photo_view: 0, follows: 0,
        cpm: 0, cpc: 0, ctr: 0, frequency: 0, hook_rate: 0, hold_rate: 0,
      });
      return;
    }

    setLoadingCompare(true);
    try {
      const snap = await fetchDomMetaCompareTotals(authContext, adAccountId, since, until, campIds);
      setCustomCompareSnapshot(snap);
    } catch (err: unknown) {
      setCompareError(getErrText(err, 'Không thể tải dữ liệu kỳ so sánh từ Meta Graph API.'));
    } finally {
      setLoadingCompare(false);
    }
  };

  const handleModeChange = (nextMode: PerfCompareMode) => {
    setCompareMode(nextMode);
    if (nextMode === 'auto') {
      setPickerOpen(false);
      void runCompareFetch('auto', dataset.dateRange.prevSince, dataset.dateRange.prevUntil, brandFilter);
    } else if (nextMode === 'last_year') {
      setPickerOpen(false);
      const s = shiftIsoDateYear(dataset.dateRange.since, -1);
      const e = shiftIsoDateYear(dataset.dateRange.until, -1);
      setCustomStart(s);
      setCustomEnd(e);
      void runCompareFetch('last_year', s, e, brandFilter);
    } else {
      setPickerOpen(true);
    }
  };

  const handleBrandChange = (nextBrand: string) => {
    setBrandFilter(nextBrand);
    const s =
      compareMode === 'auto' ? dataset.dateRange.prevSince : activeCompareRange.since;
    const e =
      compareMode === 'auto' ? dataset.dateRange.prevUntil : activeCompareRange.until;
    void runCompareFetch(compareMode, s, e, nextBrand);
  };

  const handleSelectCalDay = (iso: string) => {
    if (!customStart || (customStart && customEnd && customStart !== customEnd)) {
      setCustomStart(iso);
      setCustomEnd('');
    } else if (iso < customStart) {
      setCustomEnd(customStart);
      setCustomStart(iso);
    } else {
      setCustomEnd(iso);
    }
  };

  const handleApplyCustomDates = () => {
    if (!customStart || !customEnd) return;
    setPickerOpen(false);
    setCompareMode('custom');
    void runCompareFetch('custom', customStart, customEnd, brandFilter);
  };

  const handleToggleDraftKpi = (id: string) => {
    setSettingsSavedMsg(null);
    setSettingsErrMsg(null);
    setDraftSummary((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((x) => x !== id) : prev;
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const handleSaveDraftSummary = async () => {
    if (draftSummary.length !== 3) {
      setSettingsErrMsg('Vui lòng chọn đúng 3 chỉ số phụ để hiển thị.');
      return;
    }
    if (!onSaveSummaryMetrics) return;
    setSavingSummary(true);
    setSettingsErrMsg(null);
    try {
      await onSaveSummaryMetrics(draftSummary);
      setSettingsSavedMsg('Đã cập nhật 3 chỉ số KPI lên Dashboard!');
      setShowSettings(false);
    } catch (err: unknown) {
      setSettingsErrMsg(getErrText(err, 'Không thể lưu cấu hình 3 chỉ số KPI.'));
    } finally {
      setSavingSummary(false);
    }
  };

  const getMetricValue = (snap: DomMetaTotalsSnapshot, id: string): number => {
    const rec = snap as unknown as Record<string, number | undefined>;
    return Number(rec[id] ?? 0);
  };

  const activeKpiIds = useMemo(
    () => (summaryMetrics.length === 3 ? summaryMetrics : ['reach', 'leads', 'impressions']),
    [summaryMetrics]
  );

  // Smart Insight Evaluation (1:1 parity with DOMATION_META performance_detail.js)
  const smartInsight = useMemo(() => {
    const calcDiff = (cur: number, old: number) =>
      old > 0 ? ((cur - old) / old) * 100 : cur > 0 ? 100 : 0;

    const spendDiff = calcDiff(currentTotals.spend, prevTotals.spend);
    const details = activeKpiIds.map((mid) => {
      const meta = DOM_META_SUMMARY_KPI_OPTIONS.find((o) => o.id === mid);
      const cVal = getMetricValue(currentTotals, mid);
      const pVal = getMetricValue(prevTotals, mid);
      return {
        mid,
        label: meta?.shortLabel || mid,
        diff: calcDiff(cVal, pVal),
      };
    });

    const primary =
      details.find((m) => ['leads', 'messages', 'purchases', 'link_click'].includes(m.mid)) ||
      details[details.length - 1];
    const resDiff = primary?.diff || 0;

    let title = 'HIỆU QUẢ ĐANG DUY TRÌ';
    let toneClass = 'text-[#1E40FF]';
    if (resDiff > spendDiff && spendDiff >= 0) {
      title = 'CHI PHÍ TỐI ƯU RẤT TỐT';
      toneClass = 'text-emerald-600';
    } else if (resDiff >= 0 && spendDiff < 0) {
      title = 'HIỆU QUẢ TĂNG DÙ GIẢM NGÂN SÁCH';
      toneClass = 'text-emerald-600';
    } else if (resDiff < spendDiff && spendDiff > 20) {
      title = 'CẦN TỐI ƯU LẠI QUẢNG CÁO';
      toneClass = 'text-amber-600';
    } else if (resDiff < 0) {
      title = 'HIỆU QUẢ ĐANG GIẢM SÚT';
      toneClass = 'text-rose-600';
    }

    return { title, toneClass, spendDiff, details };
  }, [currentTotals, prevTotals, activeKpiIds]);

  const sections: Array<{
    section: string;
    rows: Array<{
      id: string;
      label: string;
      fmt: 'money' | 'num' | 'percent' | 'decimal';
      inverseBad?: boolean;
    }>;
  }> = [
    {
      section: 'Tổng quan tài chính',
      rows: [
        { id: 'spend', label: 'Chi tiêu (Spent)', fmt: 'money' },
        { id: 'cpm', label: 'CPM (Mỗi 1.000 lượt hiển thị)', fmt: 'money', inverseBad: true },
        { id: 'cpc', label: 'CPC (Mỗi lượt click)', fmt: 'money', inverseBad: true },
      ],
    },
    {
      section: 'Hiển thị & Tiếp cận',
      rows: [
        { id: 'impressions', label: 'Lượt hiển thị (Impressions)', fmt: 'num' },
        { id: 'reach', label: 'Lượt tiếp cận (Reach)', fmt: 'num' },
        { id: 'frequency', label: 'Tần suất (Frequency)', fmt: 'decimal' },
        { id: 'ctr', label: 'Tỷ lệ nhấp (CTR)', fmt: 'percent' },
      ],
    },
    {
      section: 'Kết quả mục tiêu',
      rows: [
        { id: 'leads', label: 'Khách hàng tiềm năng (Leads)', fmt: 'num' },
        { id: 'messages', label: 'Tin nhắn mới (Mess. Started)', fmt: 'num' },
        { id: 'message_connection', label: 'Tin nhắn kết nối (Connection)', fmt: 'num' },
        { id: 'purchases', label: 'Mua hàng (Purchases)', fmt: 'num' },
        { id: 'roas', label: 'ROAS (Purchase)', fmt: 'decimal' },
      ],
    },
    {
      section: 'Tương tác nội dung',
      rows: [
        { id: 'post_engagement', label: 'Tương tác bài viết (Post Engagement)', fmt: 'num' },
        { id: 'reaction', label: 'Cảm xúc (Reactions)', fmt: 'num' },
        { id: 'comments', label: 'Bình luận (Comments)', fmt: 'num' },
        { id: 'shares', label: 'Chia sẻ (Shares)', fmt: 'num' },
        { id: 'follows', label: 'Lượt thích Trang (Follows / Like Page)', fmt: 'num' },
        { id: 'photo_view', label: 'Xem ảnh (Photo Views)', fmt: 'num' },
        { id: 'link_click', label: 'Link Clicks', fmt: 'num' },
        { id: 'clicks', label: 'Tổng lượt nhấp (All Clicks)', fmt: 'num' },
      ],
    },
    {
      section: 'Phát Video & Giữ chân (Video Funnel)',
      rows: [
        { id: 'video_play', label: 'Lượt phát Video (Video Plays)', fmt: 'num' },
        { id: 'video_3s', label: 'Lượt xem 3 giây (3s Views)', fmt: 'num' },
        { id: 'thruplay', label: 'ThruPlays', fmt: 'num' },
        { id: 'hook_rate', label: 'Hook Rate (3s / Impressions)', fmt: 'percent' },
        { id: 'hold_rate', label: 'Hold Rate (ThruPlay / 3s)', fmt: 'percent' },
        { id: 'video_p25', label: 'Video xem 25%', fmt: 'num' },
        { id: 'video_p50', label: 'Video xem 50%', fmt: 'num' },
        { id: 'video_p75', label: 'Video xem 75%', fmt: 'num' },
        { id: 'video_p95', label: 'Video xem 95%', fmt: 'num' },
        { id: 'video_p100', label: 'Video xem 100%', fmt: 'num' },
      ],
    },
  ];

  const formatMetricCell = (val: number, fmt: 'money' | 'num' | 'percent' | 'decimal') => {
    if (fmt === 'money') return formatDomMoney(val, currency);
    if (fmt === 'percent') return `${val.toFixed(2)}%`;
    if (fmt === 'decimal') return val.toFixed(2);
    return formatDomNumber(val);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="dom-meta-perf-compare-modal"
      onClick={onClose}
      style={{ zIndex: DOM_META_MODAL_BASE_Z }}
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800">
              Báo Cáo Hiệu Suất Chi Tiết &amp; Đối Soát Kỳ Trước
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hiện tại:{' '}
              <span className="font-semibold text-slate-700">
                {fmtShortDayMonth(dataset.dateRange.since)} → {fmtShortDayMonth(dataset.dateRange.until)}
              </span>{' '}
              · Đối soát:{' '}
              <span className="font-semibold text-[#1E40FF]">
                {fmtShortDayMonth(activeCompareRange.since)} → {fmtShortDayMonth(activeCompareRange.until)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="toggle-perf-kpi-settings"
              onClick={() => {
                setSettingsSavedMsg(null);
                setSettingsErrMsg(null);
                setShowSettings((v) => {
                  const next = !v;
                  if (next) {
                    setDraftSummary(
                      summaryMetrics.length === 3
                        ? [...summaryMetrics]
                        : ['reach', 'leads', 'impressions']
                    );
                  }
                  return next;
                });
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                showSettings
                  ? 'bg-[#1E40FF] border-[#1E40FF] text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-blue-50 border-slate-200 text-slate-700 hover:text-[#1E40FF]'
              }`}
              title="Cài đặt 3 chỉ số tóm tắt trên thẻ KPI Dashboard"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Cài đặt 3 chỉ số KPI</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compare Controls Toolbar */}
        <div className="px-6 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Kỳ hiện tại:</span>
              <strong className="text-slate-800 tabular-nums">
                {fmtShortDayMonth(dataset.dateRange.since)} - {fmtShortDayMonth(dataset.dateRange.until)}
              </strong>
            </span>
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <DomMetaSelect
              ariaLabel="Chọn chế độ kỳ so sánh"
              testId="perf-compare-mode-select"
              value={compareMode}
              onChange={(val) => handleModeChange(val as PerfCompareMode)}
              variant="pill"
              className="bg-white"
              options={[
                { value: 'auto', label: 'So sánh: Tự động (Kỳ trước)' },
                { value: 'last_year', label: 'So sánh: Cùng kỳ năm ngoái' },
                { value: 'custom', label: 'So sánh: Tùy chọn khoảng ngày...' },
              ]}
            />
            {compareMode === 'custom' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-blue-200 text-xs font-semibold text-[#1E40FF] cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="tabular-nums">
                    {fmtShortDayMonth(customStart)} → {customEnd ? fmtShortDayMonth(customEnd) : '...'}
                  </span>
                </button>
                {pickerOpen && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 space-y-3">
                    <PerfCustomCalendarGrid
                      monthDate={calMonth}
                      selectedStart={customStart}
                      selectedEnd={customEnd}
                      onSelectDay={handleSelectCalDay}
                      onShiftMonth={(delta) =>
                        setCalMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
                      }
                    />
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        {customStart ? fmtShortDayMonth(customStart) : '—'} →{' '}
                        {customEnd ? fmtShortDayMonth(customEnd) : 'Chọn ngày kết'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPickerOpen(false)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-600 cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          disabled={!customStart || !customEnd}
                          onClick={handleApplyCustomDates}
                          className="px-3 py-1 rounded-lg bg-[#1E40FF] text-white text-[11px] font-semibold disabled:opacity-50 cursor-pointer"
                        >
                          Áp dụng
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {brandFilters.length > 0 && (
            <DomMetaSelect
              ariaLabel="Lọc thương hiệu trong đối soát"
              testId="perf-compare-brand-select"
              value={brandFilter}
              onChange={handleBrandChange}
              variant="pill"
              align="right"
              className="bg-white"
              options={[
                { value: '__all__', label: 'Thương hiệu: Tất cả' },
                ...brandFilters.map((b) => ({
                  value: b.filter,
                  label: b.name,
                })),
              ]}
            />
          )}
        </div>

        {/* Inline Settings Panel for the 3 KPI Stack Metrics */}
        {showSettings && (
          <div
            data-testid="perf-compare-kpi-settings-panel"
            className="px-6 py-4 bg-[#F4F8FF]/85 border-b border-blue-200/80 space-y-3 shrink-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Cài Đặt 3 Chỉ Số Tóm Tắt Dưới Thẻ Spent ({draftSummary.length}/3)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chọn đúng 3 chỉ số quan trọng nhất ngoài Spent để hiển thị trên thẻ KPI Dashboard và dùng làm cơ sở Nhận xét nhanh.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {draftSummary.map((id) => {
                  const opt = DOM_META_SUMMARY_KPI_OPTIONS.find((x) => x.id === id);
                  return (
                    <span
                      key={id}
                      className="px-2.5 py-1 rounded-full bg-white border border-blue-200 text-[11px] font-semibold text-[#1E40FF]"
                    >
                      {opt?.shortLabel || id}
                    </span>
                  );
                })}
              </div>
            </div>

            {settingsErrMsg && (
              <div className="text-xs font-semibold text-rose-600">{settingsErrMsg}</div>
            )}
            {settingsSavedMsg && (
              <div className="text-xs font-semibold text-emerald-700">{settingsSavedMsg}</div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
              {DOM_META_SUMMARY_KPI_OPTIONS.map((opt) => {
                const isSelected = draftSummary.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!canManageConfig && !onSaveSummaryMetrics}
                    onClick={() => handleToggleDraftKpi(opt.id)}
                    className={`px-3 py-2 rounded-xl border text-[11px] font-medium text-left flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1E40FF] border-[#1E40FF] text-white font-semibold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <span className="truncate">{opt.shortLabel}</span>
                    {isSelected && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                {canManageConfig
                  ? 'Thay đổi sẽ lưu đồng bộ cho toàn Workspace.'
                  : 'Bạn đang xem ở chế độ chỉ xem; chỉ Admin mới lưu thay đổi Workspace.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={savingSummary || draftSummary.length !== 3 || !canManageConfig}
                  onClick={() => void handleSaveDraftSummary()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {savingSummary ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Lưu &amp; Áp dụng ngay</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {compareError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700">
              {compareError}
            </div>
          )}

          {/* Smart Insights Banner */}
          <div className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-4 flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 shadow-xs flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#1E40FF]" />
            </div>
            <div className="min-w-0 text-xs sm:text-sm leading-relaxed">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                Nhận xét nhanh
              </div>
              <div className="mt-0.5 text-slate-700">
                <span className={`font-bold ${smartInsight.toneClass}`}>{smartInsight.title}</span>.{' '}
                Ngân sách{' '}
                <strong>
                  {smartInsight.spendDiff >= 0 ? 'tăng' : 'giảm'}{' '}
                  <span
                    className={
                      smartInsight.spendDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }
                  >
                    {Math.abs(smartInsight.spendDiff).toFixed(1)}%
                  </span>
                </strong>
                .{' '}
                {smartInsight.details.map((d, idx) => (
                  <React.Fragment key={d.mid}>
                    {idx > 0 ? ', ' : ''}
                    <strong>{d.label}</strong> {d.diff >= 0 ? 'tăng' : 'giảm'}{' '}
                    <span
                      className={`font-semibold ${
                        d.diff > 0 ? 'text-emerald-600' : d.diff < 0 ? 'text-rose-600' : 'text-slate-600'
                      }`}
                    >
                      {Math.abs(d.diff).toFixed(1)}%
                    </span>
                  </React.Fragment>
                ))}
                .
              </div>
            </div>
          </div>

          {loadingCompare ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-[#1E40FF]" />
              <span>Đang tải dữ liệu đối soát từ Meta Ads...</span>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4 w-[38%]">Chỉ số (Metrics)</th>
                    <th className="py-3 px-4 text-right w-[22%]">Kỳ hiện tại</th>
                    <th className="py-3 px-4 text-right w-[22%]">Kỳ so sánh</th>
                    <th className="py-3 px-4 text-right w-[18%]">Thay đổi (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sections.map((sec) => (
                    <React.Fragment key={sec.section}>
                      <tr className="bg-slate-50/80">
                        <td
                          colSpan={4}
                          className="py-2 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                        >
                          {sec.section}
                        </td>
                      </tr>
                      {sec.rows.map((r) => {
                        const currVal = getMetricValue(currentTotals, r.id);
                        const prevVal = getMetricValue(prevTotals, r.id);
                        const delta = calcDeltaPercent(currVal, prevVal);
                        const isUp = (delta || 0) > 0;
                        const isDown = (delta || 0) < 0;
                        const good = r.inverseBad ? isDown : isUp;
                        const bad = r.inverseBad ? isUp : isDown;
                        const isPinned = activeKpiIds.includes(r.id);

                        return (
                          <tr key={r.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-4 font-medium text-slate-700">
                              <span className="inline-flex items-center gap-2">
                                <span>{r.label}</span>
                                {isPinned && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#1E40FF] text-[10px] font-semibold">
                                    KPI
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-semibold text-slate-800 tabular-nums">
                              {formatMetricCell(currVal, r.fmt)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-normal text-slate-500 tabular-nums">
                              {formatMetricCell(prevVal, r.fmt)}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {delta === null ? (
                                <span className="text-slate-400">0.0%</span>
                              ) : (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${
                                    good
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : bad
                                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                        : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {delta > 0 ? '+' : ''}
                                  {delta.toFixed(1)}%
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PerformanceCompareModal: React.FC<{
  open: boolean;
  dataset: DomMetaDashboardDataset | null;
  authContext?: DomMetaAuthContext;
  adAccountId?: string;
  currency?: string;
  brandFilters?: DomMetaBrandFilter[];
  summaryMetrics?: string[];
  canManageConfig?: boolean;
  onSaveSummaryMetrics?: (nextMetrics: string[]) => Promise<void> | void;
  onClose: () => void;
}> = ({
  open,
  dataset,
  authContext,
  adAccountId,
  currency = 'VND',
  brandFilters = [],
  summaryMetrics = ['reach', 'leads', 'impressions'],
  canManageConfig = true,
  onSaveSummaryMetrics,
  onClose,
}) => {
  if (!open || !dataset) return null;

  return (
    <DomMetaModalPortal>
      <PerformanceCompareModalBody
        dataset={dataset}
        authContext={authContext}
        adAccountId={adAccountId}
        currency={currency}
        brandFilters={brandFilters}
        summaryMetrics={summaryMetrics}
        canManageConfig={canManageConfig}
        onSaveSummaryMetrics={onSaveSummaryMetrics}
        onClose={onClose}
      />
    </DomMetaModalPortal>
  );
};


const ColumnPresetModalBody: React.FC<{
  columnConfig: DomMetaColumnConfig;
  presets: DomMetaViewPreset[];
  onSave: (nextCol: DomMetaColumnConfig, nextPresets: DomMetaViewPreset[]) => void;
  onClose: () => void;
}> = ({ columnConfig, presets, onSave, onClose }) => {
  const [activeCols, setActiveCols] = useState<string[]>(() => [...columnConfig.activeColumns]);
  const [customMetrics, setCustomMetrics] = useState<DomMetaCustomMetric[]>(() => [
    ...(columnConfig.customMetrics || []),
  ]);
  const [presetList, setPresetList] = useState<DomMetaViewPreset[]>(() => [...presets]);
  const [metricQuery, setMetricQuery] = useState('');
  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricFormula, setNewMetricFormula] = useState('');
  const [newMetricFormat, setNewMetricFormat] = useState<'money' | 'number' | 'percent'>('money');
  const [newPresetName, setNewPresetName] = useState('');

  const toggleColumn = (id: string) => {
    setActiveCols((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 15)
    );
  };

  const moveColumn = (idx: number, dir: -1 | 1) => {
    setActiveCols((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  };

  const handleAddCustomMetric = () => {
    if (!newMetricName.trim() || !newMetricFormula.trim()) return;
    const id = `custom_${Date.now()}`;
    const item: DomMetaCustomMetric = {
      id,
      name: newMetricName.trim(),
      formula: newMetricFormula.trim(),
      format: newMetricFormat,
    };
    setCustomMetrics((prev) => [...prev, item]);
    setActiveCols((prev) => (prev.length < 15 ? [...prev, id] : prev));
    setNewMetricName('');
    setNewMetricFormula('');
  };

  const handleRemoveCustomMetric = (id: string) => {
    setCustomMetrics((prev) => prev.filter((m) => m.id !== id));
    setActiveCols((prev) => prev.filter((c) => c !== id));
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const p: DomMetaViewPreset = {
      id: `preset_${Date.now()}`,
      name: newPresetName.trim(),
      activeColumns: [...activeCols],
      customMetrics: [...customMetrics],
    };
    setPresetList((prev) => [...prev, p]);
    setNewPresetName('');
  };

  const filteredRegistry = DOM_META_METRIC_REGISTRY.filter(
    (m) =>
      !metricQuery.trim() ||
      m.label.toLowerCase().includes(metricQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(metricQuery.toLowerCase())
  );

  const resolveColLabel = (colId: string) =>
    DOM_META_METRIC_REGISTRY.find((m) => m.id === colId)?.label ||
    customMetrics.find((m) => m.id === colId)?.name ||
    colId;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="dom-meta-column-modal"
      onClick={onClose}
      style={{ zIndex: DOM_META_MODAL_BASE_Z }}
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800"
      >
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#1E40FF]" />
            <h3 className="text-base font-semibold text-slate-800">
              Tùy Chỉnh Cột Hiển Thị &amp; View Presets
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Metrics Khả Dụng
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveCols([
                      'status',
                      'spend',
                      'result',
                      'cpr',
                      'cpm',
                      'reach',
                      'frequency',
                      'reaction',
                    ])
                  }
                  className="text-[11px] font-semibold text-[#1E40FF] hover:underline cursor-pointer"
                >
                  Reset mặc định
                </button>
              </div>
              <input
                type="text"
                value={metricQuery}
                onChange={(e) => setMetricQuery(e.target.value)}
                placeholder="Tìm nhanh metric (VD: hook, cpr, roas, thruplay)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs outline-none focus:bg-white focus:border-[#1E40FF] mb-2.5"
              />
              <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
                {filteredRegistry.map((m) => {
                  const selected = activeCols.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleColumn(m.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-blue-50 border-[#1E40FF] text-[#1E40FF]'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tạo Custom Metric (Công thức)
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newMetricName}
                  onChange={(e) => setNewMetricName(e.target.value)}
                  placeholder="Tên chỉ số (VD: CPV 3s)"
                  className="col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1E40FF]"
                />
                <DomMetaSelect
                  ariaLabel="Định dạng chỉ số"
                  value={newMetricFormat}
                  variant="rounded"
                  onChange={(v) =>
                    setNewMetricFormat(v === 'percent' || v === 'number' ? v : 'money')
                  }
                  options={[
                    { value: 'money', label: 'Tiền tệ (đ)' },
                    { value: 'percent', label: 'Tỷ lệ (%)' },
                    { value: 'number', label: 'Số nguyên' },
                  ]}
                  className="w-full"
                />
              </div>
              <input
                type="text"
                value={newMetricFormula}
                onChange={(e) => setNewMetricFormula(e.target.value)}
                placeholder="Công thức: {{spend}} / {{video_3s}}"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#1E40FF]"
              />
              <button
                type="button"
                onClick={handleAddCustomMetric}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-xs font-semibold cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Custom Metric</span>
              </button>

              {customMetrics.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {customMetrics.map((cm) => (
                    <div
                      key={cm.id}
                      className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800">{cm.name}</span>{' '}
                        <code className="text-[11px] text-slate-500">{cm.formula}</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomMetric(cm.id)}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer shrink-0"
                        title="Xóa Custom Metric"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Active Columns Order */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Cột Đang Chọn &amp; Thứ Tự ({activeCols.length})
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5">
                {activeCols.map((colId, idx) => (
                  <div
                    key={colId}
                    className="rounded-xl bg-white border border-slate-200/90 px-3 py-1.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-medium text-slate-700 truncate">
                      {idx + 1}. {resolveColLabel(colId)}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveColumn(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600 cursor-pointer"
                        title="Lên trên"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveColumn(idx, 1)}
                        disabled={idx === activeCols.length - 1}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600 cursor-pointer"
                        title="Xuống dưới"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      {activeCols.length > 1 && (
                        <button
                          type="button"
                          onClick={() => toggleColumn(colId)}
                          className="p-1 rounded hover:bg-rose-50 text-rose-500 cursor-pointer"
                          title="Bỏ cột"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                View Presets Lưu Nhanh
              </div>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
                {presetList.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {p.activeColumns.length} cột hiển thị
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCols(p.activeColumns);
                          if (p.customMetrics && p.customMetrics.length > 0) {
                            setCustomMetrics((prev) => {
                              const merged = [...prev];
                              for (const cm of p.customMetrics || []) {
                                if (!merged.some((x) => x.id === cm.id)) {
                                  merged.push(cm);
                                }
                              }
                              return merged;
                            });
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1E40FF] text-xs font-semibold cursor-pointer"
                      >
                        Áp dụng
                      </button>
                      {presetList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPresetList((prev) => prev.filter((x) => x.id !== p.id))}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Xóa Preset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Đặt tên Preset mới..."
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1E40FF]"
                />
                <button
                  type="button"
                  onClick={handleSavePreset}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 text-[#1E40FF] text-xs font-semibold cursor-pointer shrink-0"
                >
                  Lưu Preset
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({ activeColumns: activeCols, customMetrics }, presetList);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-[#1E40FF] text-white text-xs font-semibold cursor-pointer shadow-sm"
          >
            Lưu Thay Đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export const ColumnPresetModal: React.FC<{
  open: boolean;
  columnConfig: DomMetaColumnConfig;
  presets: DomMetaViewPreset[];
  onSave: (nextCol: DomMetaColumnConfig, nextPresets: DomMetaViewPreset[]) => void;
  onClose: () => void;
}> = ({ open, columnConfig, presets, onSave, onClose }) => {
  if (!open) return null;
  return (
    <DomMetaModalPortal>
      <ColumnPresetModalBody
        columnConfig={columnConfig}
        presets={presets}
        onSave={onSave}
        onClose={onClose}
      />
    </DomMetaModalPortal>
  );
};

export const CampaignCompareModal: React.FC<{
  campaigns: DomMetaCampaignNode[];
  currency?: string;
  onClose: () => void;
}> = ({ campaigns, currency = 'VND', onClose }) => {
  if (campaigns.length < 2) return null;

  return (
    <DomMetaModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        onClick={onClose}
        style={{ zIndex: DOM_META_MODAL_BASE_Z }}
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800"
        >
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800">
              So Sánh Trực Tiếp {campaigns.length} Chiến Dịch
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="dom-meta-table-scroll flex-1 overflow-auto p-5">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <th className="sticky top-0 z-10 bg-slate-50 py-3 px-3 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Chiến dịch</th>
                  <th className="sticky top-0 z-10 bg-slate-50 py-3 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Spent</th>
                  <th className="sticky top-0 z-10 bg-slate-50 py-3 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Result</th>
                  <th className="sticky top-0 z-10 bg-slate-50 py-3 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">CPR</th>
                  <th className="sticky top-0 z-10 bg-slate-50 py-3 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Reach</th>
                  <th className="sticky top-0 z-10 bg-slate-50 py-3 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">CTR</th>
                  <th className="sticky top-0 z-10 bg-slate-50 py-3 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Hook Rate</th>
                  <th className="sticky top-0 z-10 bg-slate-50 py-3 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-medium text-slate-800 max-w-[240px] truncate">
                      {c.name}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700 tabular-nums">
                      {formatDomMoney(c.spend, currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-800 tabular-nums">
                      {formatDomNumber(c.result)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-[#1E40FF] tabular-nums">
                      {c.result > 0 ? formatDomMoney(c.cpr, currency) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">{formatDomNumber(c.reach)}</td>
                    <td className="py-3 px-3 text-right tabular-nums">{c.ctr.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-right tabular-nums">{c.hook_rate.toFixed(1)}%</td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      {c.roas > 0 ? `${c.roas.toFixed(2)}x` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DomMetaModalPortal>
  );
};


export const AccountManagerModal: React.FC<{
  open: boolean;
  config: DomMetaWorkspaceConfig;
  onSelectPrimary: (adAccountId: string) => Promise<void>;
  onDiscoverAccounts: (
    token: string
  ) => Promise<
    Array<{ ad_account_id: string; name: string; currency: string; business_name?: string | null }>
  >;
  onConnectAccounts: (
    token: string,
    selected: Array<{ ad_account_id: string; name?: string }>
  ) => Promise<void>;
  onClose: () => void;
}> = ({ open, config, onSelectPrimary, onDiscoverAccounts, onConnectAccounts, onClose }) => {
  const [addingToken, setAddingToken] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [rawToken, setRawToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discovered, setDiscovered] = useState<
    Array<{ ad_account_id: string; name: string; currency: string; business_name?: string | null }>
  >([]);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const handleDiscover = async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await onDiscoverAccounts(rawToken);
      setDiscovered(list);
      const nextChecked: Record<string, boolean> = {};
      list.slice(0, 5).forEach((a) => {
        nextChecked[a.ad_account_id] = true;
      });
      setCheckedIds(nextChecked);
    } catch (err: unknown) {
      setError(getErrText(err, 'Không thể tải danh sách Ad Accounts từ Token này.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConnect = async () => {
    const selected = discovered
      .filter((a) => checkedIds[a.ad_account_id])
      .map((a) => ({ ad_account_id: a.ad_account_id, name: a.name }));
    if (selected.length === 0) {
      setError('Vui lòng chọn ít nhất 1 Ad Account.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConnectAccounts(rawToken, selected);
      setAddingToken(false);
      setRawToken('');
      setDiscovered([]);
      onClose();
    } catch (err: unknown) {
      setError(getErrText(err, 'Không thể lưu Ad Accounts.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DomMetaModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        data-testid="dom-meta-account-modal"
        onClick={onClose}
        style={{ zIndex: DOM_META_MODAL_NESTED_Z }}
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800"
        >
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Quản Lý Tài Khoản Quảng Cáo (Meta Ad Accounts)
                </h3>
                <p className="text-xs text-slate-500">
                  Đồng bộ tự động giữa DOM Meta Report, CRM Auto Data &amp; DOMATION ERP
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            {!addingToken ? (
              <>
                <div className="space-y-2.5">
                  {config.meta_summary.accounts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center space-y-2">
                      <div className="text-sm font-semibold text-slate-800">
                        Chưa có Ad Account nào được kết nối
                      </div>
                      <p className="text-xs text-slate-500">
                        Bấm nút &ldquo;Kết nối Token Mới&rdquo; bên dưới để tự động lấy danh sách tài
                        khoản quảng cáo từ Facebook.
                      </p>
                    </div>
                  ) : (
                    config.meta_summary.accounts.map((acc) => {
                      const isPrimary = acc.ad_account_id === config.primary_ad_account_id;
                      return (
                        <div
                          key={acc.id || acc.ad_account_id}
                          onClick={() => void onSelectPrimary(acc.ad_account_id)}
                          className={`rounded-2xl border p-4 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isPrimary
                              ? 'border-[#1E40FF] bg-blue-50/50 shadow-sm'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800">{acc.name}</span>
                              {isPrimary && (
                                <span className="px-2 py-0.5 rounded-full bg-[#1E40FF] text-white text-[10px] font-semibold">
                                  Đang xem
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-slate-500 mt-0.5">
                              act_{acc.ad_account_id}
                            </div>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setAddingToken(true)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kết Nối Meta Access Token Mới</span>
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Meta Access Token (EAA...)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGuide((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E40FF] cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showGuide ? 'Ẩn hướng dẫn' : 'Cách lấy Token 60 giây'}</span>
                  </button>
                </div>

                {showGuide && (
                  <div className="rounded-2xl bg-[#F4F8FF] border border-blue-200/80 p-4 text-xs text-slate-700 space-y-1.5">
                    <div>
                      <strong>1.</strong> Mở{' '}
                      <a
                        href="https://developers.facebook.com/tools/explorer/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1E40FF] font-semibold underline"
                      >
                        Meta Graph API Explorer
                      </a>{' '}
                      hoặc System User trong Business Settings.
                    </div>
                    <div>
                      <strong>2.</strong> Chọn quyền:{' '}
                      <code className="px-1.5 py-0.5 rounded bg-white border border-blue-200 font-mono text-[#1E40FF]">
                        ads_read, ads_management, business_management
                      </code>
                    </div>
                    <div>
                      <strong>3.</strong> Bấm <strong>Generate Access Token</strong>, sao chép chuỗi
                      bắt đầu bằng <code>EAA...</code> và dán vào ô bên dưới.
                    </div>
                  </div>
                )}

                <textarea
                  rows={3}
                  value={rawToken}
                  onChange={(e) => setRawToken(e.target.value)}
                  placeholder="EAA..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] p-3.5 text-xs font-mono outline-none"
                />

                <button
                  type="button"
                  disabled={loading || !rawToken.trim()}
                  onClick={() => void handleDiscover()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Tải Danh Sách Ad Accounts</span>
                </button>

                {discovered.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200">
                    <div className="text-xs font-semibold text-slate-700">
                      Tìm thấy {discovered.length} tài khoản — Chọn tài khoản muốn kết nối:
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                      {discovered.map((acc) => (
                        <label
                          key={acc.ad_account_id}
                          className="rounded-xl border border-slate-200 px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50"
                        >
                          <div>
                            <div className="text-xs font-semibold text-slate-800">{acc.name}</div>
                            <div className="text-[11px] font-mono text-slate-500">
                              ID: {acc.ad_account_id} · {acc.currency}
                              {acc.business_name ? ` · ${acc.business_name}` : ''}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(checkedIds[acc.ad_account_id])}
                            onChange={(e) =>
                              setCheckedIds((prev) => ({
                                ...prev,
                                [acc.ad_account_id]: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 accent-[#1E40FF]"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setAddingToken(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
                  >
                    Quay lại
                  </button>
                  {discovered.length > 0 && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void handleSaveConnect()}
                      className="px-5 py-2 rounded-xl bg-[#1E40FF] text-white text-xs font-semibold cursor-pointer"
                    >
                      Lưu Tài Khoản Đã Chọn
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DomMetaModalPortal>
  );
};


const WorkspaceSettingsModalBody: React.FC<{
  initialTab: 'brand' | 'goals' | 'google_ads' | 'ecosystem' | 'plan';
  config: DomMetaWorkspaceConfig;
  tenantSlug: string;
  shareUrlOverride?: string;
  daysRemaining: number;
  canManageConfig: boolean;
  onSaveConfig: (patch: DomMetaWorkspacePatch) => Promise<void>;
  onTestGoogleAds?: (cfg: DomMetaGoogleAdsConfig) => Promise<{ rowsCount: number }>;
  onClose: () => void;
}> = ({
  initialTab,
  config,
  tenantSlug,
  shareUrlOverride,
  daysRemaining,
  canManageConfig,
  onSaveConfig,
  onTestGoogleAds,
  onClose,
}) => {
  const [tab, setTab] = useState<'brand' | 'goals' | 'google_ads' | 'ecosystem' | 'plan'>(
    initialTab
  );
  const [brands, setBrands] = useState<DomMetaBrandFilter[]>(() => [
    ...(config.brand_filters || []),
  ]);
  const [goalMode, setGoalMode] = useState<'goal' | 'brand' | 'keyword'>(
    config.goal_chart_mode || 'goal'
  );
  const [goalKeywords, setGoalKeywords] = useState<string[]>(() => [
    ...(config.goal_keywords || []),
  ]);
  const [newGoalKw, setNewGoalKw] = useState('');
  const [summaryMetrics, setSummaryMetrics] = useState<string[]>(() =>
    config.summary_metrics?.length === 3
      ? [...config.summary_metrics]
      : ['reach', 'leads', 'impressions']
  );
  const [gads, setGads] = useState<DomMetaGoogleAdsConfig>(() => ({ ...config.google_ads }));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const shareUrl = useMemo(() => {
    if (shareUrlOverride) return shareUrlOverride;
    if (typeof window === 'undefined') return `https://domation.net/meta-report/${tenantSlug}`;
    return `${window.location.origin}/meta-report/${tenantSlug}`;
  }, [shareUrlOverride, tenantSlug]);

  const toggleSummaryKpi = (id: string) => {
    setSummaryMetrics((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((x) => x !== id) : prev;
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const normalizedSummary =
        summaryMetrics.length === 3
          ? summaryMetrics
          : [...summaryMetrics, 'reach', 'leads', 'impressions']
              .filter((v, i, arr) => arr.indexOf(v) === i)
              .slice(0, 3);
      await onSaveConfig({
        brand_filters: brands,
        goal_chart_mode: goalMode,
        goal_keywords: goalKeywords,
        summary_metrics: normalizedSummary,
        google_ads: gads,
      });
      onClose();
    } catch (err: unknown) {
      setSaveError(getErrText(err, 'Không thể lưu cấu hình Workspace.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="dom-meta-settings-modal"
      onClick={onClose}
      style={{ zIndex: DOM_META_MODAL_BASE_Z }}
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800"
      >
        {/* Header + Tabs */}
        <div className="px-6 pt-5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Settings2 className="w-5 h-5 text-[#1E40FF]" />
              <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                Cài Đặt Không Gian Báo Cáo (Workspace Settings)
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            {[
              { id: 'brand' as const, label: 'Brand Filters', icon: Tag },
              { id: 'goals' as const, label: 'Goal & KPI', icon: Target },
              { id: 'google_ads' as const, label: 'Tích hợp Google Ads', icon: Sliders },
              { id: 'ecosystem' as const, label: 'Đồng bộ ERP / AutoData', icon: Share2 },
              { id: 'plan' as const, label: 'Gói Free 1 Tháng & Gia Hạn', icon: Crown },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`pb-3 text-xs font-medium flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'border-[#1E40FF] text-[#1E40FF] font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {saveError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700">
              {saveError}
            </div>
          )}

          {!canManageConfig && (tab === 'brand' || tab === 'goals' || tab === 'google_ads') && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-semibold text-amber-800">
              Bạn đang xem ở quyền Quản lý / Xem báo cáo. Chỉ Quản trị viên (Admin) mới có thể lưu
              thay đổi cấu hình kết nối.
            </div>
          )}

          {tab === 'brand' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#F4F8FF] border border-blue-200/80 p-4 text-xs text-slate-700">
                Gắn từ khóa nhận diện thương hiệu/dự án (ví dụ: <strong>EcoLife</strong>,{' '}
                <strong>Signature</strong>) để lọc nhanh toàn bộ Dashboard &amp; Ads Library theo
                từng dòng sản phẩm.
              </div>

              <div className="space-y-2.5">
                {brands.map((b, idx) => (
                  <div
                    key={b.id}
                    className="rounded-xl border border-slate-200 p-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                  >
                    <input
                      type="text"
                      value={b.name}
                      onChange={(e) =>
                        setBrands((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                        )
                      }
                      placeholder="Tên thương hiệu (VD: EcoLife)"
                      className="sm:col-span-5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-[#1E40FF]"
                    />
                    <input
                      type="text"
                      value={b.filter}
                      onChange={(e) =>
                        setBrands((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, filter: e.target.value } : x))
                        )
                      }
                      placeholder="Từ khóa lọc tên Campaign..."
                      className="sm:col-span-6 rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#1E40FF]"
                    />
                    <button
                      type="button"
                      onClick={() => setBrands((prev) => prev.filter((_, i) => i !== idx))}
                      className="sm:col-span-1 w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setBrands((prev) => [
                    ...prev,
                    { id: `brand_${Date.now()}`, name: '', filter: '' },
                  ])
                }
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-[#1E40FF] text-xs font-bold text-slate-600 hover:text-[#1E40FF] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Bộ Lọc Thương Hiệu</span>
              </button>
            </div>
          )}

          {tab === 'goals' && (
            <div className="space-y-5">
              <div className="space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  1. Chế Độ Biểu Đồ Cột Mục Tiêu (Meta Goal / Custom Bar)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'goal' as const, title: 'Optimization Goal', sub: 'Gom theo mục tiêu Meta' },
                    { id: 'keyword' as const, title: 'Keyword Goal', sub: 'Gom theo từ khóa tên Camp' },
                    { id: 'brand' as const, title: 'Brand Groups', sub: 'Gom theo Brand Filters' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setGoalMode(m.id)}
                      className={`rounded-2xl border p-3 text-left transition-colors cursor-pointer ${
                        goalMode === m.id
                          ? 'border-[#1E40FF] bg-[#F4F8FF]'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-semibold text-slate-800">{m.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{m.sub}</div>
                    </button>
                  ))}
                </div>

                {goalMode === 'keyword' && (
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2.5">
                    <div className="text-xs font-bold text-slate-700">
                      Từ khóa phân nhóm chiến dịch (VD: Booking, Awareness, Remarketing)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {goalKeywords.map((kw, i) => (
                        <span
                          key={`${kw}-${i}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-blue-200 text-xs font-bold text-[#1E40FF]"
                        >
                          <span>{kw}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setGoalKeywords((prev) => prev.filter((_, idx) => idx !== i))
                            }
                            className="text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newGoalKw}
                        onChange={(e) => setNewGoalKw(e.target.value)}
                        placeholder="Nhập từ khóa mới..."
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#1E40FF]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newGoalKw.trim()) return;
                          setGoalKeywords((prev) => [...prev, newGoalKw.trim()]);
                          setNewGoalKw('');
                        }}
                        className="px-4 py-2 rounded-xl bg-[#1E40FF] text-white text-xs font-bold cursor-pointer"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  2. Tùy Biến 3 Chỉ Số Tóm Tắt Dưới Thẻ Spent ({summaryMetrics.length}/3)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                  {DOM_META_SUMMARY_KPI_OPTIONS.map((opt) => {
                    const active = summaryMetrics.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleSummaryKpi(opt.id)}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium text-left cursor-pointer ${
                          active
                            ? 'bg-blue-50 border-[#1E40FF] text-[#1E40FF] font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'google_ads' && (
            <GoogleAdsSetupGuide
              value={gads}
              onChange={setGads}
              onTestConnection={canManageConfig ? onTestGoogleAds : undefined}
            />
          )}

          {tab === 'ecosystem' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-r from-[#F4F8FF] to-white border border-blue-200/80 p-5 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1E40FF] text-white text-[10px] font-semibold uppercase">
                  <Sparkles className="w-3 h-3" />
                  <span>Hệ Sinh Thái Đồng Bộ DOMATION</span>
                </div>
                <h4 className="text-sm sm:text-base font-semibold text-slate-800">
                  1 Tài Khoản Duy Nhất — Sử Dụng Độc Lập Hoặc Mở Ngay Trong ERP &amp; Auto Chia Data
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Toàn bộ tài khoản quảng cáo, khóa kết nối bảo mật và cấu hình Google Ads của
                  Workspace <code className="font-mono font-bold text-[#1E40FF]">{tenantSlug}</code>{' '}
                  được liên thông tự động với phân hệ <strong>DOM Meta Report</strong> bên trong{' '}
                  <strong>DOMATION ERP</strong> và <strong>Auto Chia Data</strong>.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                <div className="text-xs font-bold text-slate-700">
                  Đường dẫn chia sẻ kèm bộ lọc ngày &amp; thương hiệu hiện tại
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        setCopiedShare(true);
                        setTimeout(() => setCopiedShare(false), 2000);
                      } catch {
                        // ignore
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {copiedShare ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedShare ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'plan' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <div className="text-[11px] font-bold uppercase text-emerald-700">
                    Trạng thái kích hoạt
                  </div>
                  <div className="text-lg font-bold text-emerald-800 mt-1">
                    Miễn Phí Dùng Thử 1 Tháng
                  </div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    Còn {daysRemaining} ngày trải nghiệm đầy đủ tính năng
                  </div>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-[#F4F8FF] p-4">
                  <div className="text-[11px] font-semibold uppercase text-[#1E40FF]">
                    Gói Năm Tiết Kiệm 29%
                  </div>
                  <div className="text-lg font-bold text-slate-800 mt-1">
                    490.000₫<span className="text-xs font-normal text-slate-500">/tháng</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Thanh toán năm 5.880.000₫ (hoặc gói lẻ 690.000₫/tháng)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer"
          >
            Đóng
          </button>
          {canManageConfig && (tab === 'brand' || tab === 'goals' || tab === 'google_ads') && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="px-5 py-2 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Lưu Cấu Hình</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const WorkspaceSettingsModal: React.FC<{
  open: boolean;
  initialTab?: 'brand' | 'goals' | 'google_ads' | 'ecosystem' | 'plan';
  config: DomMetaWorkspaceConfig;
  tenantSlug?: string;
  shareUrlOverride?: string;
  daysRemaining?: number;
  canManageConfig?: boolean;
  onSaveConfig: (patch: DomMetaWorkspacePatch) => Promise<void>;
  onTestGoogleAds?: (cfg: DomMetaGoogleAdsConfig) => Promise<{ rowsCount: number }>;
  onClose: () => void;
}> = ({
  open,
  initialTab = 'brand',
  config,
  tenantSlug = 'workspace',
  shareUrlOverride,
  daysRemaining = 30,
  canManageConfig = true,
  onSaveConfig,
  onTestGoogleAds,
  onClose,
}) => {
  if (!open) return null;
  return (
    <DomMetaModalPortal>
      <WorkspaceSettingsModalBody
        key={initialTab}
        initialTab={initialTab}
        config={config}
        tenantSlug={tenantSlug}
        shareUrlOverride={shareUrlOverride}
        daysRemaining={daysRemaining}
        canManageConfig={canManageConfig}
        onSaveConfig={onSaveConfig}
        onTestGoogleAds={onTestGoogleAds}
        onClose={onClose}
      />
    </DomMetaModalPortal>
  );
};

export const AiSummaryModal: React.FC<{
  open: boolean;
  dataset: DomMetaDashboardDataset | null;
  campaigns: DomMetaCampaignNode[];
  currency?: string;
  activeBrandLabel?: string;
  savedReports?: DomMetaAiReportEntry[];
  onSaveReports?: (nextReports: DomMetaAiReportEntry[]) => Promise<void> | void;
  onClose: () => void;
}> = ({
  open,
  dataset,
  campaigns,
  currency = 'VND',
  activeBrandLabel = 'Tất cả',
  savedReports = [],
  onSaveReports,
  onClose,
}) => {
  const [tab, setTab] = useState<'result' | 'compare' | 'history'>('result');
  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [compareIds, setCompareIds] = useState<Record<string, boolean>>({});
  const [viewingHistoryItem, setViewingHistoryItem] = useState<DomMetaAiReportEntry | null>(null);

  const diagnosticReport = useMemo(() => {
    if (!dataset) return null;
    const c = dataset.currentTotals;
    const p = dataset.prevTotals;
    const spendDelta = calcDeltaPercent(c.spend, p.spend);
    const sortedBySpend = [...campaigns].sort((a, b) => b.spend - a.spend);
    const topCamp = sortedBySpend[0] || null;
    const efficientLeadCamp =
      [...campaigns]
        .filter((x) => x.result > 0 && x.spend > 0 && !x.optimization_goal.includes('REACH'))
        .sort((a, b) => a.cpr - b.cpr)[0] || null;
    const fatigued = campaigns.filter((x) => x.frequency >= 3.0 && x.spend > 0);
    const zeroResultHighSpend = campaigns.filter(
      (x) => x.spend >= 1_000_000 && x.result === 0 && !x.optimization_goal.includes('REACH')
    );

    let peakHourCell = dataset.heatmap[0] || null;
    for (const cell of dataset.heatmap) {
      if (peakHourCell && cell.spend > peakHourCell.spend) {
        peakHourCell = cell;
      }
    }
    const dayLabels = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const topRegion = dataset.regions[0] || null;
    const dateRange = `${dataset.dateRange.since} → ${dataset.dateRange.until}`;

    const sections = [
      {
        heading: '1. Tổng quan ngân sách & tăng trưởng',
        body: `Chi tiêu ${formatDomMoney(c.spend, currency)} (${
          spendDelta !== null
            ? `${spendDelta >= 0 ? '+' : ''}${spendDelta.toFixed(1)}% so với kỳ trước`
            : 'kỳ đầu'
        }) · Tiếp cận ${formatDomNumber(c.reach)} người · Leads: ${formatDomNumber(
          c.leads
        )} · Tin nhắn: ${formatDomNumber(c.messages)}${
          c.roas > 0 ? ` · Purchase ROAS: ${c.roas.toFixed(2)}x` : ''
        }.`,
      },
      {
        heading: '2. Sức khỏe Creative Video (Hook & Hold Rate)',
        body: `Hook Rate 3s đạt ${c.hook_rate.toFixed(1)}% · Hold Rate (ThruPlay) đạt ${c.hold_rate.toFixed(
          1
        )}% · CTR trung bình ${c.ctr.toFixed(2)}%.`,
      },
      ...(topCamp
        ? [
            {
              heading: '3. Chiến dịch chủ lực',
              body: `"${topCamp.name}" chiếm ${formatDomMoneyShort(topCamp.spend, currency)} (${
                c.spend > 0 ? ((topCamp.spend / c.spend) * 100).toFixed(1) : '0'
              }% ngân sách), mang về ${formatDomNumber(topCamp.result)} ${topCamp.optimization_goal}.`,
            },
          ]
        : []),
      ...(efficientLeadCamp
        ? [
            {
              heading: '4. Chiến dịch tối ưu chi phí nhất',
              body: `"${efficientLeadCamp.name}" đạt CPR tốt nhất ${formatDomMoney(
                efficientLeadCamp.cpr,
                currency
              )}.`,
            },
          ]
        : []),
      ...(peakHourCell && peakHourCell.spend > 0
        ? [
            {
              heading: '5. Khung giờ vàng & Địa lý trọng điểm',
              body: `Cao điểm phân phối vào ${dayLabels[peakHourCell.dayOfWeek]} lúc ${
                peakHourCell.hour
              }:00${
                topRegion
                  ? ` · Tỉnh/thành dẫn đầu: ${topRegion.region} (${formatDomMoneyShort(
                      topRegion.spend,
                      currency
                    )})`
                  : ''
              }.`,
            },
          ]
        : []),
      {
        heading: '6. Cảnh báo lặp tệp (Frequency)',
        body:
          fatigued.length > 0
            ? `${fatigued.length} chiến dịch có Frequency ≥ 3.0 (${fatigued
                .map((f) => f.name)
                .slice(0, 2)
                .join(', ')}) — khuyến nghị bổ sung Creative góc tiếp cận mới.`
            : 'Tần suất phân phối ổn định (Frequency < 3.0 trên các chiến dịch đang chạy).',
      },
      {
        heading: '7. Khuyến nghị phân bổ ngân sách',
        body:
          zeroResultHighSpend.length > 0
            ? `Kiểm tra ngay ${zeroResultHighSpend.length} chiến dịch đã chi tiêu > 1Mđ nhưng chưa ra chuyển đổi mục tiêu.`
            : 'Phân bổ ngân sách lành mạnh, không có chiến dịch đốt ngân sách > 1Mđ không ra kết quả.',
      },
    ];

    const tableRowsHtml = sortedBySpend
      .slice(0, 8)
      .map(
        (camp) =>
          `<tr><td>${escapeHtml(camp.name)}</td><td>${escapeHtml(
            formatDomMoney(camp.spend, currency)
          )}</td><td>${escapeHtml(formatDomNumber(camp.result))} (${escapeHtml(
            camp.optimization_goal
          )})</td><td>${
            camp.result > 0 ? escapeHtml(formatDomMoney(camp.cpr, currency)) : '—'
          }</td><td>${camp.hook_rate.toFixed(1)}%</td></tr>`
      )
      .join('');

    const html = [
      ...sections.map((s) => `<h2>${escapeHtml(s.heading)}</h2><p>${escapeHtml(s.body)}</p>`),
      sortedBySpend.length > 0
        ? `<h2>Bảng Tổng Hợp Top Chiến Dịch</h2><table><thead><tr><th>Chiến dịch</th><th>Spent</th><th>Results</th><th>CPR</th><th>Hook 3s</th></tr></thead><tbody>${tableRowsHtml}</tbody></table>`
        : '',
    ].join('\n');

    const plainText = [
      `BÁO CÁO CHẨN ĐOÁN HIỆU SUẤT QUẢNG CÁO (DOM META REPORT AI)`,
      `Chu kỳ phân tích: ${dateRange} | Thương hiệu: ${activeBrandLabel}`,
      ...sections.map((s) => `${s.heading}: ${s.body}`),
    ].join('\n');

    return {
      c,
      dateRange,
      efficientLeadCamp,
      peakHourLabel:
        peakHourCell && peakHourCell.spend > 0
          ? `${dayLabels[peakHourCell.dayOfWeek]} · ${peakHourCell.hour}:00`
          : '—',
      topRegion,
      label: `Chẩn đoán hiệu suất (${campaigns.length} chiến dịch)`,
      preview: sections[0]?.body.slice(0, 180) || '',
      html,
      plainText,
    };
  }, [dataset, campaigns, currency, activeBrandLabel]);

  if (!open || !diagnosticReport) return null;

  const activeEntry = viewingHistoryItem
    ? {
        label: viewingHistoryItem.label,
        dateRange: viewingHistoryItem.date_range || diagnosticReport.dateRange,
        brand: viewingHistoryItem.brand || activeBrandLabel,
        timestamp: viewingHistoryItem.timestamp,
        html: viewingHistoryItem.html,
        plainText: viewingHistoryItem.plain_text,
        preview: viewingHistoryItem.preview,
      }
    : {
        label: diagnosticReport.label,
        dateRange: diagnosticReport.dateRange,
        brand: activeBrandLabel,
        timestamp: new Date().toLocaleString('vi-VN'),
        html: diagnosticReport.html,
        plainText: diagnosticReport.plainText,
        preview: diagnosticReport.preview,
      };

  const handlePersistReport = async (entryToSave: DomMetaAiReportEntry) => {
    const nextList = [
      entryToSave,
      ...savedReports.filter((x) => x.id !== entryToSave.id),
    ].slice(0, 25);
    await onSaveReports?.(nextList);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleGenerateCompareReport = async () => {
    const chosen = campaigns.filter((c) => compareIds[c.id]);
    if (chosen.length < 2) return;
    const bestCpr =
      [...chosen].filter((c) => c.result > 0).sort((a, b) => a.cpr - b.cpr)[0] || chosen[0];
    const rowsHtml = chosen
      .map(
        (c) =>
          `<tr><td><strong>${escapeHtml(c.name)}</strong></td><td>${escapeHtml(
            formatDomMoney(c.spend, currency)
          )}</td><td>${escapeHtml(formatDomNumber(c.reach))}</td><td>${escapeHtml(
            formatDomNumber(c.result)
          )}</td><td>${
            c.result > 0 ? escapeHtml(formatDomMoney(c.cpr, currency)) : '—'
          }</td><td>${c.ctr.toFixed(2)}%</td><td>${c.hook_rate.toFixed(1)}%</td></tr>`
      )
      .join('');
    const html = `
      <h2>1. Bảng Đối Chiếu ${chosen.length} Chiến Dịch</h2>
      <table>
        <thead><tr><th>Chiến dịch</th><th>Spent</th><th>Reach</th><th>Result</th><th>CPR</th><th>CTR</th><th>Hook 3s</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <h2>2. Kết Luận Chiến Dịch Hiệu Quả Nhất</h2>
      <p>Chiến dịch dẫn đầu tối ưu chi phí: <strong>${escapeHtml(bestCpr.name)}</strong> với ${escapeHtml(
        formatDomNumber(bestCpr.result)
      )} kết quả, CPR ${
        bestCpr.result > 0 ? escapeHtml(formatDomMoney(bestCpr.cpr, currency)) : 'N/A'
      }, Hook Rate 3s đạt ${bestCpr.hook_rate.toFixed(1)}%.</p>
      <h2>3. Khuyến Nghị Phân Bổ Ngân Sách</h2>
      <p>Ưu tiên dồn ngân sách tăng dần 15–20% vào nhóm quảng cáo có CPR thấp nhất thuộc "${escapeHtml(
        bestCpr.name
      )}" và làm mới Creative cho các chiến dịch có Hook Rate dưới 20%.</p>
    `;
    const plainText = [
      `SO SÁNH CHIẾN DỊCH (${chosen.length} CAMPAIGNS)`,
      ...chosen.map(
        (c, idx) =>
          `${idx + 1}. ${c.name}: Spent ${formatDomMoney(c.spend, currency)} | Result ${formatDomNumber(
            c.result
          )} | CPR ${c.result > 0 ? formatDomMoney(c.cpr, currency) : '—'} | Hook 3s ${c.hook_rate.toFixed(1)}%`
      ),
      `Chiến dịch tối ưu nhất: ${bestCpr.name}`,
    ].join('\n');

    const entry: DomMetaAiReportEntry = {
      id: `air_${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      label: `So sánh: ${chosen.map((c) => c.name).slice(0, 2).join(' vs ')}${
        chosen.length > 2 ? ` (+${chosen.length - 2})` : ''
      }`,
      brand: activeBrandLabel,
      date_range: diagnosticReport.dateRange,
      preview: `Đối chiếu ${chosen.length} chiến dịch · Tốt nhất: ${bestCpr.name}`,
      html,
      plain_text: plainText,
    };
    setViewingHistoryItem(entry);
    setTab('result');
    await handlePersistReport(entry);
  };

  const handleDownloadExport = (format: 'doc' | 'html') => {
    const docString = buildStandaloneReportDocument({
      title: activeEntry.label,
      dateRange: activeEntry.dateRange,
      brandLabel: activeEntry.brand,
      timestamp: activeEntry.timestamp,
      bodyHtml: activeEntry.html,
      forWord: format === 'doc',
    });
    const mime =
      format === 'doc' ? 'application/msword;charset=utf-8' : 'text/html;charset=utf-8';
    const blob = new Blob(['\ufeff', docString], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dom-meta-ai-report-${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedCompareCount = Object.values(compareIds).filter(Boolean).length;

  return (
    <DomMetaModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        data-testid="dom-meta-ai-modal"
        onClick={onClose}
        style={{ zIndex: DOM_META_MODAL_BASE_Z }}
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800"
        >
          <div className="px-6 py-4 bg-gradient-to-r from-[#0F172A] via-[#1E40FF] to-[#0284C7] text-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-cyan-300" />
              <div>
                <h3 className="text-base font-bold leading-none">DOM META REPORT AI</h3>
                <p className="text-[11px] text-cyan-100 mt-1">
                  Chẩn đoán hiệu suất, So sánh chiến dịch, Lưu lịch sử &amp; Xuất báo cáo .DOC / HTML
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-Tabs: Result / Compare / History */}
          <div className="px-6 pt-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-5 overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => setTab('result')}
              className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
                tab === 'result'
                  ? 'border-[#1E40FF] text-[#1E40FF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Báo cáo AI</span>
            </button>

            <button
              type="button"
              data-testid="ai-tab-compare"
              onClick={() => setTab('compare')}
              className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
                tab === 'compare'
                  ? 'border-[#1E40FF] text-[#1E40FF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>So sánh Chiến dịch</span>
            </button>

            <button
              type="button"
              data-testid="ai-tab-history"
              onClick={() => setTab('history')}
              className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
                tab === 'history'
                  ? 'border-[#1E40FF] text-[#1E40FF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Lịch sử ({savedReports.length})</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {tab === 'result' && (
              <>
                {viewingHistoryItem && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-2 flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-slate-700 truncate">
                      Đang xem bản lưu: <strong className="font-semibold text-[#1E40FF]">{viewingHistoryItem.label}</strong>{' '}
                      ({viewingHistoryItem.timestamp})
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewingHistoryItem(null)}
                      className="text-xs font-semibold text-[#1E40FF] hover:underline shrink-0 cursor-pointer"
                    >
                      Quay về kỳ hiện tại
                    </button>
                  </div>
                )}

                {!viewingHistoryItem && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-[#F4F8FF] border border-blue-100 p-3.5">
                      <div className="text-[11px] font-medium text-slate-500">Hook / Hold Rate</div>
                      <div className="text-base font-bold text-[#1E40FF] mt-1 tabular-nums">
                        {diagnosticReport.c.hook_rate.toFixed(1)}% /{' '}
                        {diagnosticReport.c.hold_rate.toFixed(1)}%
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {diagnosticReport.c.hook_rate >= 20
                          ? 'Hook 3s rất tốt (≥20%)'
                          : 'Cần tối ưu 3s đầu video'}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5">
                      <div className="text-[11px] font-medium text-slate-500">Khung Giờ Cao Điểm</div>
                      <div className="text-base font-bold text-slate-800 mt-1">
                        {diagnosticReport.peakHourLabel}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {diagnosticReport.topRegion
                          ? `Top vùng: ${diagnosticReport.topRegion.region}`
                          : 'Theo múi giờ TKQC'}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-3.5">
                      <div className="text-[11px] font-medium text-emerald-700">CPR Tốt Nhất</div>
                      <div className="text-base font-bold text-emerald-900 mt-1 tabular-nums">
                        {diagnosticReport.efficientLeadCamp
                          ? formatDomMoney(diagnosticReport.efficientLeadCamp.cpr, currency)
                          : '—'}
                      </div>
                      <div className="text-[11px] text-emerald-700 truncate mt-0.5">
                        {diagnosticReport.efficientLeadCamp?.name || 'Đang thu thập chuyển đổi'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {renderSafeAiReportNodes(activeEntry.html, activeEntry.plainText)}
                </div>
              </>
            )}

            {tab === 'compare' && (
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-700">
                    Chọn từ 2 chiến dịch trở lên để AI tổng hợp báo cáo đối chiếu ({selectedCompareCount} đã chọn)
                  </div>
                  <button
                    type="button"
                    disabled={selectedCompareCount < 2}
                    onClick={() => void handleGenerateCompareReport()}
                    className="px-4 py-2 rounded-xl bg-[#1E40FF] disabled:opacity-45 text-white text-xs font-semibold cursor-pointer"
                  >
                    Tạo Báo Cáo So Sánh &amp; Lưu Lịch Sử
                  </button>
                </div>

                <div className="dom-meta-table-scroll space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {campaigns.map((camp) => (
                    <label
                      key={camp.id}
                      className="rounded-2xl border border-slate-200 hover:border-blue-300 p-3.5 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={Boolean(compareIds[camp.id])}
                          onChange={(e) =>
                            setCompareIds((prev) => ({ ...prev, [camp.id]: e.target.checked }))
                          }
                          className="w-4 h-4 accent-[#1E40FF] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-800 truncate">{camp.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Result: {formatDomNumber(camp.result)} · CPR:{' '}
                            {camp.result > 0 ? formatDomMoney(camp.cpr, currency) : '—'} · Hook 3s:{' '}
                            {camp.hook_rate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#1E40FF] tabular-nums shrink-0">
                        {formatDomMoneyShort(camp.spend, currency)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {tab === 'history' && (
              <div className="space-y-2.5">
                {savedReports.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Chưa có bản báo cáo AI nào được lưu trong Workspace này. Bấm &ldquo;Lưu Lịch Sử&rdquo; ở
                    thanh dưới để lưu trữ lâu dài.
                  </div>
                ) : (
                  savedReports.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70"
                    >
                      <div
                        onClick={() => {
                          setViewingHistoryItem(item);
                          setTab('result');
                        }}
                        className="min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1E40FF] text-[10px] font-semibold">
                            {item.brand}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.date_range} · Lưu lúc {item.timestamp}
                        </div>
                        {item.preview && (
                          <div className="text-xs text-slate-600 truncate mt-1">{item.preview}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setViewingHistoryItem(item);
                            setTab('result');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#1E40FF] text-xs font-bold cursor-pointer"
                        >
                          Mở xem
                        </button>
                        {onSaveReports && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = savedReports.filter((r) => r.id !== item.id);
                              if (viewingHistoryItem?.id === item.id) setViewingHistoryItem(null);
                              void onSaveReports(next);
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Xóa báo cáo này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(activeEntry.plainText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    // ignore
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E40FF] text-white text-xs font-semibold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>

              {onSaveReports && (
                <button
                  type="button"
                  data-testid="ai-save-history"
                  onClick={() =>
                    void handlePersistReport({
                      id: viewingHistoryItem?.id || `air_${Date.now()}`,
                      timestamp: new Date().toLocaleString('vi-VN'),
                      label: activeEntry.label,
                      brand: activeEntry.brand,
                      date_range: activeEntry.dateRange,
                      preview: activeEntry.preview,
                      html: activeEntry.html,
                      plain_text: activeEntry.plainText,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                >
                  {savedNotice ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savedNotice ? 'Đã lưu Lịch sử!' : 'Lưu Lịch Sử'}</span>
                </button>
              )}

              <button
                type="button"
                data-testid="ai-export-doc"
                onClick={() => handleDownloadExport('doc')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#1E40FF]" />
                <span>Xuất .DOC</span>
              </button>

              <button
                type="button"
                data-testid="ai-export-html"
                onClick={() => handleDownloadExport('html')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                <FileCode2 className="w-3.5 h-3.5 text-[#1E40FF]" />
                <span>Xuất HTML</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </DomMetaModalPortal>
  );
};


export const GoogleAdsKeywordModal: React.FC<{
  open: boolean;
  campaignName: string;
  dateRangeLabel: string;
  loading: boolean;
  keywords: DomGoogleAdsKeywordItem[];
  searchTerms: DomGoogleAdsSearchTermItem[];
  onClose: () => void;
}> = ({ open, campaignName, dateRangeLabel, loading, keywords, searchTerms, onClose }) => {
  const [tab, setTab] = useState<'keywords' | 'terms'>('keywords');

  if (!open) return null;

  const handleExport = () => {
    const lines =
      tab === 'keywords'
        ? [
            'Keyword,Ad Group,Match Type,Impressions,Clicks,CTR (%),Conversions,Spent',
            ...keywords.map((k) =>
              [
                `"${k.keyword.replace(/"/g, '""')}"`,
                `"${k.adGroup.replace(/"/g, '""')}"`,
                k.matchType,
                k.impressions,
                k.clicks,
                k.ctr.toFixed(2),
                k.conversions,
                Math.round(k.spent),
              ].join(',')
            ),
          ]
        : [
            'Search Term,Status,Impressions,Clicks,CTR (%),CPC,Spent',
            ...searchTerms.map((s) =>
              [
                `"${s.searchTerm.replace(/"/g, '""')}"`,
                s.status,
                s.impressions,
                s.clicks,
                s.ctr.toFixed(2),
                Math.round(s.cpc),
                Math.round(s.spent),
              ].join(',')
            ),
          ];
    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-ads-${tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DomMetaModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        onClick={onClose}
        style={{ zIndex: DOM_META_MODAL_NESTED_Z }}
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800"
        >
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-800 truncate">
                Từ Khóa Chiến Dịch: {campaignName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{dateRangeLabel}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-6 pt-2 bg-white border-b border-slate-200 flex gap-5">
            {[
              { id: 'keywords' as const, label: `Keywords (${keywords.length})` },
              { id: 'terms' as const, label: `Search Terms (${searchTerms.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`pb-2.5 text-xs font-semibold border-b-2 cursor-pointer ${
                  tab === t.id
                    ? 'border-[#1E40FF] text-[#1E40FF]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="dom-meta-table-scroll flex-1 overflow-auto p-5">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-[#1E40FF] mx-auto mb-2" />
                Đang tải dữ liệu Keywords &amp; Search Terms từ Google Ads...
              </div>
            ) : tab === 'keywords' ? (
              keywords.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Chiến dịch này không có dữ liệu từ khóa tìm kiếm (ví dụ Performance Max / Display)
                  hoặc chưa phát sinh lượt nhấp.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Keyword / Ad Group</th>
                      <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Match</th>
                      <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Impr.</th>
                      <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Clicks</th>
                      <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">CTR</th>
                      <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Conv</th>
                      <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {keywords.map((k, idx) => (
                      <tr key={`${k.keyword}-${idx}`} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{k.keyword}</div>
                          <div className="text-[10.5px] text-slate-400">{k.adGroup}</div>
                        </td>
                        <td className="py-2.5 px-3 uppercase text-[11px] font-mono text-slate-500">
                          {k.matchType}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                          {formatDomNumber(k.impressions)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                          {formatDomNumber(k.clicks)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">{k.ctr.toFixed(2)}%</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-[#1E40FF] tabular-nums">
                          {formatDomNumber(k.conversions)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700 tabular-nums">
                          {formatDomMoney(k.spent, 'VND')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : searchTerms.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Chưa ghi nhận Search Terms chi tiết trong khoảng thời gian này.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Search Term</th>
                    <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Status</th>
                    <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Impr.</th>
                    <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Clicks</th>
                    <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">CPC</th>
                    <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {searchTerms.map((s, idx) => (
                    <tr key={`${s.searchTerm}-${idx}`} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-800">{s.searchTerm}</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">{s.status}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                        {formatDomNumber(s.impressions)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                        {formatDomNumber(s.clicks)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                        {formatDomMoney(s.cpc, 'VND')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700 tabular-nums">
                        {formatDomMoney(s.spent, 'VND')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DomMetaModalPortal>
  );
};


/* ============================================================================
   8. SHARE & ACCESS PERMISSIONS MODAL (CLASSIC STYLE)
   ============================================================================ */

export interface ShareMemberEntry {
  email: string;
  name?: string;
  role: 'admin' | 'viewer';
  isOwner?: boolean;
}

export interface ShareAccessModalProps {
  open: boolean;
  shareUrl: string;
  tenantSlug: string;
  currentUserName: string;
  canManageConfig?: boolean;
  onClose: () => void;
}

export const ShareAccessModal: React.FC<ShareAccessModalProps> = ({
  open,
  shareUrl,
  tenantSlug,
  currentUserName,
  canManageConfig = true,
  onClose,
}) => {
  const storageKey = `dom_meta_share_acl_${tenantSlug || 'default'}`;
  const [publicView, setPublicView] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = JSON.parse(window.localStorage.getItem(storageKey) || '{}') as {
        publicView?: boolean;
      };
      return Boolean(raw.publicView);
    } catch {
      return false;
    }
  });
  const [members, setMembers] = useState<ShareMemberEntry[]>(() => {
    const ownerEntry: ShareMemberEntry = {
      email: `${tenantSlug || 'workspace'}@domation.net`,
      name: currentUserName || 'Admin',
      role: 'admin',
      isOwner: true,
    };
    if (typeof window === 'undefined') return [ownerEntry];
    try {
      const raw = JSON.parse(window.localStorage.getItem(storageKey) || '{}') as {
        members?: ShareMemberEntry[];
      };
      if (Array.isArray(raw.members) && raw.members.length > 0) return raw.members;
      return [ownerEntry];
    } catch {
      return [ownerEntry];
    }
  });
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'viewer' | 'admin'>('viewer');
  const [copied, setCopied] = useState(false);

  const persistAcl = (nextPublic: boolean, nextMembers: ShareMemberEntry[]) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ publicView: nextPublic, members: nextMembers })
      );
    } catch {
      // ignore storage quota
    }
  };

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleAddMember = () => {
    const clean = newEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) return;
    const exists = members.some((m) => m.email.toLowerCase() === clean);
    const nextMembers = exists
      ? members.map((m) => (m.email.toLowerCase() === clean ? { ...m, role: newRole } : m))
      : [...members, { email: clean, name: clean.split('@')[0], role: newRole }];
    setMembers(nextMembers);
    persistAcl(publicView, nextMembers);
    setNewEmail('');
  };

  const handleRoleChange = (email: string, role: 'admin' | 'viewer') => {
    const nextMembers = members.map((m) => (m.email === email ? { ...m, role } : m));
    setMembers(nextMembers);
    persistAcl(publicView, nextMembers);
  };

  const handleRemoveMember = (email: string) => {
    const nextMembers = members.filter((m) => m.email !== email || m.isOwner);
    setMembers(nextMembers);
    persistAcl(publicView, nextMembers);
  };

  return (
    <DomMetaModalPortal>
      <div
        data-testid="share-access-modal"
        style={{ zIndex: DOM_META_MODAL_BASE_Z }}
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200/90"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white flex items-center justify-center shadow-sm">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Chia Sẻ Báo Cáo</h3>
                <p className="text-xs text-slate-500">
                  Quản lý quyền truy cập, chế độ xem &amp; liên kết chia sẻ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Copy Share Link Bar */}
          <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2.5">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono text-slate-600 outline-none"
            />
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã chép' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Public Access Mode Toggle */}
          <div className="px-6 py-3.5 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  publicView
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {publicView ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800">
                  Chia sẻ link cho tất cả mọi người
                </div>
                <div className="text-[11px] text-slate-500">
                  {publicView
                    ? 'Bất kỳ ai có đường dẫn đều có thể xem báo cáo (chỉ đọc)'
                    : 'Chỉ tài khoản được phân quyền trong danh sách mới xem được'}
                </div>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={publicView}
              disabled={!canManageConfig}
              onClick={() => {
                const next = !publicView;
                setPublicView(next);
                persistAcl(next, members);
              }}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 disabled:opacity-50 ${
                publicView ? 'bg-[#1E40FF]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  publicView ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Members & Role Assignment */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {canManageConfig && (
              <div className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>Thêm thành viên &amp; phân quyền</span>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddMember();
                    }}
                    placeholder="email@domain.com"
                    className="flex-1 min-w-[160px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#1E40FF]"
                  />
                  <DomMetaSelect
                    ariaLabel="Chọn vai trò thành viên mới"
                    value={newRole}
                    variant="rounded"
                    onChange={(v) => setNewRole(v as 'viewer' | 'admin')}
                    options={[
                      { value: 'viewer', label: 'Viewer' },
                      { value: 'admin', label: 'Admin' },
                    ]}
                    className="bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Thành viên có quyền truy cập ({members.length})
              </div>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
                {members.map((m) => (
                  <div
                    key={m.email}
                    className="px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {(m.name || m.email).slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {m.name || m.email}
                          {m.isOwner && (
                            <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                              (Chủ sở hữu)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{m.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <DomMetaSelect
                        ariaLabel={`Phân quyền cho ${m.name || m.email}`}
                        disabled={m.isOwner || !canManageConfig}
                        value={m.role}
                        variant="compact"
                        align="right"
                        onChange={(v) => handleRoleChange(m.email, v as 'admin' | 'viewer')}
                        options={[
                          { value: 'admin', label: 'Admin' },
                          { value: 'viewer', label: 'Viewer' },
                        ]}
                      />
                      {!m.isOwner && canManageConfig && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.email)}
                          className="w-7 h-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                          title="Gỡ quyền truy cập"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DomMetaModalPortal>
  );
};