import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  Clock,
  Copy,
  CreditCard,
  Crown,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  GitCompare,
  Globe,
  HelpCircle,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  MapPin,
  PhoneCall,
  Plus,
  Rocket,
  Save,
  Search,
  Settings2,
  Share2,
  ShieldCheck,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Target,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  X,
  Zap,
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
  type DomMetaEntityDailyPoint,
  type DomMetaEntityDeepBreakdownRow,
  type DomMetaEntityDeepDetail,
  type DomMetaGoogleAdsConfig,
  type DomMetaSettingsTab,
  type DomMetaSharedAiConfig,
  type DomMetaTotalsSnapshot,
  type DomMetaViewPreset,
  type DomMetaWorkspaceConfig,
  type DomMetaWorkspacePatch,
} from './domMetaTypes';
import {
  fetchDomMetaAiConfig,
  fetchDomMetaCompareTotals,
  fetchDomMetaCrmAttribution,
  fetchDomMetaEntityDeepDetail,
  fetchDomMetaShareConfig,
  requestDomMetaAiAnalysis,
  saveDomMetaAiConfig,
  saveDomMetaShareConfig,
  type DomMetaAuthContext,
} from './domMetaApi';
import {
  AgeGenderBarChart,
  CreativeThumbFan,
  DailyTrendAreaChart,
  DeviceBrandLogo,
  DeviceDonutCard,
  HourlySpendResultChart,
  PlatformBrandLogo,
  RegionSpentBarChart,
  UserBehaviorFunnelCard,
  VideoFunnelBars,
  type DomMetaDailyChartMetric,
} from './DomMetaCharts';
import {
  DomMetaSelect,
  DomOverflowMenu,
  DomResponsiveSubtabs,
} from './DomMetaSelect';
import { GoogleAdsSetupGuide } from './GoogleAdsSetupGuide';

export const DOM_META_MODAL_BASE_Z = 2147483636;
export const DOM_META_MODAL_NESTED_Z = 2147483638;

let activeDomMetaModalLocks = 0;
let savedScrollLocks: Array<{ el: HTMLElement; overflow: string; overscrollBehavior: string }> = [];

/** Reference-counted scroll lock across documentElement, body, and any scrollable workspace shell */
function useLockBodyAndShellScroll(locked = true): void {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;
    if (activeDomMetaModalLocks === 0) {
      const targets = new Set<HTMLElement>([document.documentElement, document.body]);
      document
        .querySelectorAll<HTMLElement>('main, [data-dom-scroll-shell="true"]')
        .forEach((el) => targets.add(el));
      savedScrollLocks = Array.from(targets).map((el) => ({
        el,
        overflow: el.style.overflow,
        overscrollBehavior: el.style.overscrollBehavior,
      }));
      for (const item of savedScrollLocks) {
        item.el.style.overflow = 'hidden';
        item.el.style.overscrollBehavior = 'contain';
      }
    }
    activeDomMetaModalLocks += 1;
    return () => {
      activeDomMetaModalLocks = Math.max(0, activeDomMetaModalLocks - 1);
      if (activeDomMetaModalLocks === 0) {
        for (const item of savedScrollLocks) {
          item.el.style.overflow = item.overflow;
          item.el.style.overscrollBehavior = item.overscrollBehavior;
        }
        savedScrollLocks = [];
      }
    };
  }, [locked]);
}

export const DomMetaModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useLockBodyAndShellScroll(true);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      data-modal-portal="true"
      className="mkt-scope dom-meta-scope"
      style={{ display: 'contents' }}
    >
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
      case 'H1':
      case 'H2':
      case 'H3':
      case 'H4':
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
      case 'EM':
      case 'I':
        return (
          <em key={keyPrefix} className="italic text-slate-700">
            {children}
          </em>
        );
      case 'CODE':
        return (
          <code
            key={keyPrefix}
            className="px-1.5 py-0.5 rounded-md bg-blue-50/90 border border-blue-100 text-[#1E40FF] font-mono text-[11px] font-semibold"
          >
            {children}
          </code>
        );
      case 'HR':
        return <hr key={keyPrefix} className="my-2 border-slate-200/80" />;
      case 'UL':
        return (
          <ul key={keyPrefix} className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-700">
            {children}
          </ul>
        );
      case 'OL':
        return (
          <ol key={keyPrefix} className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
            {children}
          </ol>
        );
      case 'LI':
        return <li key={keyPrefix}>{children}</li>;
      case 'TABLE':
        return (
          <div key={keyPrefix} className="dom-table-scroll-x overflow-x-auto rounded-xl border border-slate-200 bg-white my-2">
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

const ACTION_PRETTY_LABELS: Record<string, string> = {
  lead: 'Leads (Khách tiềm năng)',
  'onsite_conversion.lead_grouped': 'On-Facebook Leads',
  'offsite_conversion.fb_pixel_lead': 'Website Pixel Leads',
  'onsite_conversion.messaging_conversation_started_7d': 'Tin nhắn bắt đầu (7d)',
  messaging_conversation_started_7d: 'Tin nhắn mới',
  'onsite_conversion.total_messaging_connection': 'Kết nối tin nhắn',
  'onsite_conversion.messaging_first_reply': 'Phản hồi tin nhắn đầu',
  post_engagement: 'Tương tác bài viết',
  page_engagement: 'Tương tác Trang',
  link_click: 'Nhấp liên kết (Link Clicks)',
  outbound_click: 'Nhấp ra ngoài (Outbound)',
  landing_page_view: 'Xem trang đích (LPV)',
  video_view: 'Lượt xem Video (3s+)',
  post_reaction: 'Cảm xúc bài viết (Reactions)',
  comment: 'Bình luận (Comments)',
  post: 'Chia sẻ bài viết (Shares)',
  photo_view: 'Lượt xem ảnh (Photo Views)',
  like: 'Thích Trang / Theo dõi',
  'onsite_conversion.post_save': 'Lưu bài viết (Post Saves)',
  'onsite_conversion.messaging_user_depth_2_message_send': 'Hội thoại tin nhắn 2+ câu (Depth 2)',
  'onsite_conversion.messaging_user_depth_3_message_send': 'Hội thoại tin nhắn sâu 3+ câu (Depth 3)',
  messaging_user_depth_2_message_send: 'Hội thoại 2+ câu',
  messaging_user_depth_3_message_send: 'Hội thoại sâu 3+ câu',
  omni_landing_page_view: 'Omni Landing Page Views',
  omni_view_content: 'Xem nội dung / Sản phẩm (ViewContent)',
  view_content: 'Xem nội dung (ViewContent)',
  omni_add_to_cart: 'Thêm vào giỏ hàng (Add to Cart)',
  add_to_cart: 'Thêm vào giỏ hàng',
  omni_initiated_checkout: 'Bắt đầu thanh toán (Checkout)',
  initiate_checkout: 'Bắt đầu thanh toán',
  onsite_web_lead: 'Website Leads',
  onsite_web_purchase: 'Website Purchases',
  instagram_profile_follow: 'Theo dõi Instagram',
  page_follow: 'Theo dõi Fanpage',
  purchase: 'Mua hàng (Purchases)',
  omni_purchase: 'Omni Purchases',
};

function formatHumanActionKey(rawKey: string): string {
  if (ACTION_PRETTY_LABELS[rawKey]) return ACTION_PRETTY_LABELS[rawKey];
  return rawKey
    .replace(/^(onsite_conversion|offsite_conversion)\./, '')
    .replace(/^fb_pixel_/, 'Pixel ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const AdEntityDetailModal: React.FC<{
  entity: (DomMetaCampaignNode | DomMetaAdNode | DomMetaAdsetNode) | null;
  entityType: 'campaign' | 'ad' | 'adset';
  adAccountId?: string;
  currency?: string;
  sidebarWidthPx?: number;
  canGoBack?: boolean;
  onNavigateBack?: () => void;
  enableCrmAttribution?: boolean;
  crmBucket?: DomMetaCrmEntityBucket | null;
  authContext?: DomMetaAuthContext;
  aiConfig?: DomMetaSharedAiConfig;
  onOpenAiKeySetup?: () => void;
  dateRange?: { since: string; until: string };
  initialTab?: 'insights' | 'crm_leads';
  onOpenLead?: (lead: DomMetaCrmLeadItem) => void;
  onFilterCampaignLeads?: (campaignId: string, campaignName: string) => void;
  onSelectChildAdset?: (adset: DomMetaAdsetNode) => void;
  onSelectChildAd?: (ad: DomMetaAdNode) => void;
  onClose: () => void;
}> = ({
  entity,
  entityType,
  adAccountId = '',
  currency = 'VND',
  sidebarWidthPx,
  canGoBack = false,
  onNavigateBack,
  enableCrmAttribution = false,
  crmBucket,
  authContext,
  aiConfig,
  onOpenAiKeySetup,
  dateRange,
  initialTab = 'insights',
  onOpenLead,
  onFilterCampaignLeads,
  onSelectChildAdset,
  onSelectChildAd,
  onClose,
}) => {
  const [funnelOverride, setFunnelOverride] = useState<{ key: string; show: boolean } | null>(null);
  const [actionQuery, setActionQuery] = useState('');
  const [trendMetric, setTrendMetric] = useState<DomMetaDailyChartMetric>('spend');
  const [cprDimTab, setCprDimTab] = useState<
    | 'platform'
    | 'plat_device'
    | 'age_gender'
    | 'region'
    | 'country'
    | 'device'
    | 'hour_user'
    | 'day_of_week'
  >('platform');
  const [dimSortBy, setDimSortBy] = useState<'spend' | 'result' | 'cpr' | 'ctr'>('spend');
  const [drawerAgeOnly, setDrawerAgeOnly] = useState(false);
  const [drawerAgeMetric, setDrawerAgeMetric] = useState<'spend' | 'result' | 'cpr'>('spend');
  const [quickPreviewOpen, setQuickPreviewOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [entityAiState, setEntityAiState] = useState<{
    key: string;
    loading: boolean;
    html: string;
    plainText: string;
    model?: string;
    error?: string;
  } | null>(null);
  const [measuredSidebarPx, setMeasuredSidebarPx] = useState<number>(260);
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Live desktop viewport + sidebar width sync so drawer always reaches the exact sidebar edge
  useEffect(() => {
    if (!entity || typeof window === 'undefined') return;
    const syncLayout = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktopViewport(desktop);
      if (!desktop) {
        setMeasuredSidebarPx(0);
        return;
      }
      if (typeof sidebarWidthPx === 'number' && sidebarWidthPx > 0) {
        setMeasuredSidebarPx(sidebarWidthPx);
        return;
      }
      const asideEl = document.querySelector<HTMLElement>(
        '[data-dom-meta-sidebar="true"], aside.responsive-sidebar, aside'
      );
      if (asideEl) {
        const w = Math.round(asideEl.getBoundingClientRect().width);
        if (w >= 48 && w <= 360) {
          setMeasuredSidebarPx(w);
          return;
        }
      }
      setMeasuredSidebarPx(260);
    };
    const raf = window.requestAnimationFrame(syncLayout);
    window.addEventListener('resize', syncLayout);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', syncLayout);
    };
  }, [entity, sidebarWidthPx]);

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

  // Close drawer on Escape key
  useEffect(() => {
    if (!entity) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [entity, onClose]);

  // Deep Meta Breakdown Batch Fetch (1 single batch call for trend, hourly, platform, age/gender, region, device, targeting, preview)
  const [deepDetailResp, setDeepDetailResp] = useState<{
    key: string;
    detail: DomMetaEntityDeepDetail | null;
  } | null>(null);

  const deepFetchKey =
    entity && authContext && dateRange && (adAccountId || authContext.directAdAccountId || authContext.previewDataset)
      ? `${entityType}:${entity.id}:${dateRange.since}:${dateRange.until}`
      : '';

  useEffect(() => {
    if (!deepFetchKey || !entity || !authContext || !dateRange) return;
    let cancelled = false;
    const resolvedAcc = adAccountId || authContext.directAdAccountId || '';
    fetchDomMetaEntityDeepDetail(
      authContext,
      resolvedAcc,
      entityType,
      entity.id,
      entity.optimization_goal || 'QUALITY LEAD',
      dateRange
    )
      .then((detail) => {
        if (!cancelled) {
          setDeepDetailResp({ key: deepFetchKey, detail });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDeepDetailResp({ key: deepFetchKey, detail: null });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [deepFetchKey, entity, entityType, adAccountId, authContext, dateRange]);

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
  const isAdset = entityType === 'adset';
  const isCamp = entityType === 'campaign';
  const adNode = entity as DomMetaAdNode;
  const adsetNode = entity as DomMetaAdsetNode;
  const campNode = entity as DomMetaCampaignNode;
  const isActiveStatus = entity.effective_status.toUpperCase() === 'ACTIVE';
  const freq = entity.reach > 0 ? entity.impressions / entity.reach : 0;
  const freqPct = Math.min(100, (freq / 4) * 100);
  const freqHealth =
    freq < 2.2
      ? { label: 'Tần suất tối ưu', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      : freq < 3.2
        ? { label: 'Tần suất ổn định', cls: 'bg-blue-50 text-[#1E40FF] border-blue-200' }
        : { label: 'Cảnh báo lặp cao', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  const goalUpper = String(entity.optimization_goal || '').toUpperCase();
  const cprHeaderLabel =
    goalUpper === 'REACH'
      ? 'Cost per 1,000 Reach'
      : goalUpper === 'IMPRESSIONS'
        ? 'Cost per 1,000 Impr.'
        : 'Cost per Result';

  const hasVideoData = (entity.video_3s || 0) > 0 || (entity.thruplay || 0) > 0;
  const showFunnel =
    funnelOverride && funnelOverride.key === entityKey ? funnelOverride.show : hasVideoData;

  const actionEntries = Object.entries(entity.actions || {})
    .filter(([k, v]) => {
      if (v <= 0) return false;
      if (!actionQuery.trim()) return true;
      const q = actionQuery.toLowerCase();
      return k.toLowerCase().includes(q) || formatHumanActionKey(k).toLowerCase().includes(q);
    })
    .sort((a, b) => b[1] - a[1]);

  const entityThumbs = isAd
    ? [adNode.image_url || adNode.thumbnail_url].filter(Boolean)
    : isCamp
      ? collectEntityThumbs((campNode.adsets || []).flatMap((as) => as.ads || []), 3)
      : collectEntityThumbs(adsetNode.ads || [], 3);

  const isDeepLoading = Boolean(deepFetchKey && deepDetailResp?.key !== deepFetchKey);
  const deepDetail = deepDetailResp?.key === deepFetchKey ? deepDetailResp.detail : null;

  const dailyChartData: DomMetaEntityDailyPoint[] = (deepDetail?.daily || []).map((d) => ({
    ...d,
    follows: d.follows || 0,
    cpm: d.cpm ?? (d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0),
  }));

  const rawDimRows = ((): DomMetaEntityDeepBreakdownRow[] => {
    switch (cprDimTab) {
      case 'platform':
        return deepDetail?.byPlatform || [];
      case 'plat_device':
        return deepDetail?.byPlatformDevice || [];
      case 'age_gender':
        return deepDetail?.byAgeGender || [];
      case 'region':
        return deepDetail?.byRegion || [];
      case 'country':
        return deepDetail?.byCountry || [];
      case 'device':
        return deepDetail?.byDevice || [];
      case 'hour_user': {
        const hrs = (deepDetail?.byHourAudience || []).filter(
          (h) => h.spend > 0 || h.impressions > 0 || h.result > 0
        );
        const totHrSpend = hrs.reduce((s, h) => s + h.spend, 0) || 1;
        return hrs.map((h) => ({
          label: `${h.label} – ${String(h.hour).padStart(2, '0')}:59`,
          rawKey: `hr_${h.hour}`,
          spend: h.spend,
          impressions: h.impressions,
          reach: 0,
          clicks: h.clicks,
          ctr: h.impressions > 0 ? (h.clicks / h.impressions) * 100 : 0,
          result: h.result,
          cpr: h.cpr,
          sharePct: (h.spend / totHrSpend) * 100,
        }));
      }
      case 'day_of_week':
        return (deepDetail?.byDayOfWeek || []).filter(
          (d) => d.spend > 0 || d.impressions > 0 || d.result > 0
        );
    }
  })();

  const activeDimRows = [...rawDimRows].sort((a, b) => {
    if (dimSortBy === 'result') return b.result - a.result || b.spend - a.spend;
    if (dimSortBy === 'ctr') return (b.ctr || 0) - (a.ctr || 0) || b.spend - a.spend;
    if (dimSortBy === 'cpr') {
      if (a.result > 0 && b.result > 0) return a.cpr - b.cpr;
      if (a.result > 0) return -1;
      if (b.result > 0) return 1;
      return b.spend - a.spend;
    }
    return b.spend - a.spend;
  });

  const bestCprRowLabel = (() => {
    const withResults = activeDimRows.filter((r) => r.result > 0 && r.cpr > 0);
    if (withResults.length < 2) return '';
    return [...withResults].sort((a, b) => a.cpr - b.cpr)[0]?.label || '';
  })();

  const resolvedTargeting =
    deepDetail?.targeting ||
    (isAdset ? adsetNode.targeting : isCamp ? campNode.adsets?.[0]?.targeting : null) ||
    null;

  const hourlyBars = deepDetail?.hourly || [];
  const bestHourSlot = hourlyBars
    .filter((h) => h.result > 0 && h.spend > 0)
    .sort((a, b) => a.cpr - b.cpr || b.result - a.result)[0];

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

  const ageMin = Math.max(13, Math.min(65, Number(resolvedTargeting?.age_min || 18)));
  const ageMax = Math.max(ageMin, Math.min(65, Number(resolvedTargeting?.age_max || 65)));
  const ageLeftPct = Math.round(((ageMin - 13) / (65 - 13)) * 100);
  const ageWidthPct = Math.max(8, Math.round(((ageMax - ageMin) / (65 - 13)) * 100));

  const genderLabel = (() => {
    const g = resolvedTargeting?.genders;
    if (!Array.isArray(g) || g.length === 0 || g.length >= 2) return 'Nam & Nữ';
    return Number(g[0]) === 1 ? 'Nam (Male)' : Number(g[0]) === 2 ? 'Nữ (Female)' : 'Tất cả';
  })();

  const cleanGeoName = (raw: string) => raw.replace(/\s+Province$/i, '').trim();
  const geoBadges: string[] = [];
  if (resolvedTargeting?.geo_locations) {
    const gl = resolvedTargeting.geo_locations;
    for (const c of gl.cities || []) {
      if (c?.name) {
        const cn = cleanGeoName(c.name);
        geoBadges.push(c.radius ? `${cn} (+${c.radius}${c.distance_unit || 'km'})` : cn);
      }
    }
    for (const rg of gl.regions || []) {
      if (rg?.name) geoBadges.push(cleanGeoName(rg.name));
    }
    for (const cl of gl.custom_locations || []) {
      if (cl?.name) geoBadges.push(cl.radius ? `${cleanGeoName(cl.name)} (+${cl.radius}km)` : cleanGeoName(cl.name));
    }
    for (const pl of gl.places || []) {
      if (pl?.name) geoBadges.push(cleanGeoName(pl.name));
    }
    if (geoBadges.length === 0 && Array.isArray(gl.countries)) {
      geoBadges.push(...gl.countries.map((ct) => (ct === 'VN' ? 'Việt Nam' : ct)));
    }
  }
  const uniqueGeoBadges = Array.from(new Set(geoBadges));

  const customAuds: string[] = [
    ...(resolvedTargeting?.custom_audiences || []).map((a) => a.name || a.id || '').filter(Boolean),
  ];
  const excludedAuds: string[] = [
    ...(resolvedTargeting?.excluded_custom_audiences || [])
      .map((a) => a.name || a.id || '')
      .filter(Boolean),
  ];
  const interestsList: string[] = [];
  for (const spec of resolvedTargeting?.flexible_spec || []) {
    for (const arr of Object.values(spec || {})) {
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item?.name) interestsList.push(item.name);
        }
      }
    }
  }
  const uniqueInterests = Array.from(new Set(interestsList));

  const targetPubPlats = Array.isArray(resolvedTargeting?.publisher_platforms)
    ? resolvedTargeting.publisher_platforms
    : [];
  const targetDevPlats = Array.isArray(resolvedTargeting?.device_platforms)
    ? resolvedTargeting.device_platforms
    : [];

  const effectiveLeftOffsetPx = isDesktopViewport
    ? Math.max(64, sidebarWidthPx ?? measuredSidebarPx)
    : 0;

  const entityActionShares = Number(entity.actions?.post || 0);
  const entityPostSaves = Number(entity.actions?.['onsite_conversion.post_save'] || 0);

  const derivedAgeBuckets =
    deepDetail?.ageGenderBuckets && deepDetail.ageGenderBuckets.some((b) => b.totalSpend > 0)
      ? deepDetail.ageGenderBuckets
      : [];

  const derivedRegions = (deepDetail?.byRegion || []).map((r) => ({
    region: r.label,
    spend: r.spend,
    impressions: r.impressions,
    reach: r.reach,
    clicks: r.clicks,
    ctr: r.ctr,
    result: r.result,
  }));

  const derivedCountries = (deepDetail?.byCountry || []).map((c) => ({
    region: c.label,
    spend: c.spend,
    impressions: c.impressions,
    reach: c.reach,
    clicks: c.clicks,
    ctr: c.ctr,
    result: c.result,
  }));

  const resolvedCreative =
    deepDetail?.creativeSpec ||
    (isAd &&
    (adNode.creative_title ||
      adNode.creative_body ||
      adNode.cta_type ||
      adNode.link_url ||
      adNode.instagram_permalink_url)
      ? {
          title: adNode.creative_title,
          body: adNode.creative_body,
          ctaType: adNode.cta_type,
          linkUrl: adNode.link_url,
          instagramPermalinkUrl: adNode.instagram_permalink_url,
        }
      : null);

  const resolvedDiagnostics = {
    qualityRanking:
      deepDetail?.diagnostics?.qualityRanking || (isAd ? adNode.quality_ranking : undefined),
    engagementRateRanking:
      deepDetail?.diagnostics?.engagementRateRanking ||
      (isAd ? adNode.engagement_rate_ranking : undefined),
    conversionRateRanking:
      deepDetail?.diagnostics?.conversionRateRanking ||
      (isAd ? adNode.conversion_rate_ranking : undefined),
    bidStrategy:
      deepDetail?.diagnostics?.bidStrategy ||
      (isAdset ? adsetNode.bid_strategy : isCamp ? campNode.bid_strategy : undefined),
    billingEvent:
      deepDetail?.diagnostics?.billingEvent || (isAdset ? adsetNode.billing_event : undefined),
    destinationType:
      deepDetail?.diagnostics?.destinationType || (isAdset ? adsetNode.destination_type : undefined),
    learningStageStatus:
      deepDetail?.diagnostics?.learningStageStatus ||
      (isAdset ? adsetNode.learning_stage_status : undefined),
    learningStageConversions: deepDetail?.diagnostics?.learningStageConversions,
    attributionSummary: deepDetail?.diagnostics?.attributionSummary,
  };

  const hasDiagnosticBadges = Boolean(
    resolvedDiagnostics.qualityRanking ||
      resolvedDiagnostics.engagementRateRanking ||
      resolvedDiagnostics.conversionRateRanking ||
      resolvedDiagnostics.bidStrategy ||
      resolvedDiagnostics.learningStageStatus ||
      resolvedDiagnostics.destinationType ||
      resolvedDiagnostics.attributionSummary
  );

  const uniqueActionsMap = deepDetail?.uniqueActions || entity.unique_actions || {};
  const costPerActionMap = deepDetail?.costPerAction || entity.cost_per_action || {};
  const actionValuesMap = deepDetail?.actionValues || entity.action_values || {};

  const currentEntityAi = entityAiState?.key === entityKey ? entityAiState : null;

  const handleRunEntityAiAnalysis = async () => {
    if (!authContext?.accessToken) {
      onOpenAiKeySetup?.();
      return;
    }
    if (aiConfig && !aiConfig.has_api_key) {
      onOpenAiKeySetup?.();
      return;
    }
    if (aiConfig && aiConfig.ai_ads_eval_enabled === false) {
      setEntityAiState({
        key: entityKey,
        loading: false,
        html: '',
        plainText: '',
        error:
          'Công tắc "Cho phép dùng AI đánh giá Quảng cáo" đang tắt. Hãy bật lại trong Thiết lập AI API Key.',
      });
      return;
    }
    setEntityAiState({
      key: entityKey,
      loading: true,
      html: '',
      plainText: '',
    });
    try {
      const res = await requestDomMetaAiAnalysis(authContext, {
        scope: 'entity',
        context_data: {
          entity_type: entityType,
          id: entity.id,
          name: entity.name,
          status: entity.effective_status,
          optimization_goal: entity.optimization_goal,
          date_range: dateRange,
          spend: entity.spend,
          result: entity.result,
          cpr: entity.cpr,
          impressions: entity.impressions,
          reach: entity.reach,
          frequency: freq,
          clicks: entity.clicks,
          unique_clicks: entity.unique_clicks,
          link_click: entity.link_click,
          outbound_click: entity.outbound_click,
          lpv: entity.lpv,
          lpv_rate: entity.lpv_rate,
          ctr: entity.ctr,
          cpm: entity.cpm,
          cpc: entity.cpc,
          hook_rate: entity.hook_rate,
          hold_rate: entity.hold_rate,
          video_avg_time: entity.video_avg_time,
          leads: entity.leads,
          messages: entity.messages,
          msg_depth_2: entity.msg_depth_2,
          msg_depth_3: entity.msg_depth_3,
          purchases: entity.purchases,
          purchase_value: entity.purchase_value,
          roas: entity.roas,
          diagnostics: resolvedDiagnostics,
          creative: resolvedCreative,
          top_platforms: (deepDetail?.byPlatform || []).slice(0, 5),
          top_age_gender: (deepDetail?.byAgeGender || []).slice(0, 5),
          top_regions: (deepDetail?.byRegion || []).slice(0, 6),
          top_devices: (deepDetail?.byDevice || []).slice(0, 4),
          golden_hours: hourlyBars
            .filter((h) => h.result > 0)
            .sort((a, b) => a.cpr - b.cpr)
            .slice(0, 4),
        },
      });
      setEntityAiState({
        key: entityKey,
        loading: false,
        html: res.html,
        plainText: res.plain_text,
        model: res.model,
      });
    } catch (err: unknown) {
      setEntityAiState({
        key: entityKey,
        loading: false,
        html: '',
        plainText: '',
        error: getErrText(err, 'Không thể gọi Gemini AI phân tích đối tượng này.'),
      });
    }
  };

  return (
    <DomMetaModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        data-testid="dom-meta-entity-modal"
        style={{ zIndex: DOM_META_MODAL_BASE_Z }}
        className="fixed inset-0 flex items-stretch overflow-hidden dom-ios-backdrop"
      >
        {/* Left Sidebar Overlay Strip with Prominent Back Icon Button (matches DOMATION_META .dom_overlay) */}
        {effectiveLeftOffsetPx > 0 && (
          <button
            type="button"
            data-testid="dom-meta-drawer-overlay-back"
            onClick={onClose}
            style={{ width: `${effectiveLeftOffsetPx}px` }}
            title="Đóng bảng chi tiết (Esc)"
            className="group h-full shrink-0 bg-slate-950/55 hover:bg-slate-950/68 backdrop-blur-[3px] flex flex-col items-center justify-center gap-2 text-white transition-colors cursor-pointer select-none border-r border-white/10"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/15 group-hover:bg-white/25 border border-white/25 shadow-lg backdrop-blur-md transition-transform group-hover:-translate-x-0.5">
              <ChevronsLeft className="w-4 h-4 text-white shrink-0" />
              {effectiveLeftOffsetPx >= 140 && (
                <span className="text-xs font-bold tracking-wide text-white">Quay lại</span>
              )}
            </span>
          </button>
        )}

        {/* Full-Width Slide-Over Drawer Stretching Right Up to Sidebar Edge */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={
            effectiveLeftOffsetPx > 0
              ? { width: `calc(100vw - ${effectiveLeftOffsetPx}px)` }
              : undefined
          }
          className="flex-1 min-w-0 w-full h-full bg-[#F8FAFC] shadow-[-24px_0_60px_rgba(15,23,42,0.22)] overflow-hidden flex flex-col text-slate-800 dom-ios-drawer-right"
        >
          {/* Sticky Drawer Header */}
          <div className="px-3.5 sm:px-6 py-3 sm:py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200/90 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => {
                  if (canGoBack && onNavigateBack) {
                    onNavigateBack();
                  } else {
                    onClose();
                  }
                }}
                title={canGoBack ? 'Quay lại cấp trước' : 'Đóng bảng chi tiết'}
                className="inline-flex items-center justify-center gap-1 h-9 w-9 sm:w-auto sm:px-2.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-[#1E40FF] text-slate-600 text-xs font-semibold shrink-0 cursor-pointer dom-ios-press"
              >
                <ChevronLeft className="w-4 h-4" />
                {canGoBack && <span className="hidden sm:inline pr-0.5">Trở lại</span>}
              </button>

              <CreativeThumbFan
                urls={entityThumbs}
                goal={entity.optimization_goal}
                active={isActiveStatus}
                variant="modal"
                eager
                alt={entity.name}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#1E40FF] text-[10px] font-bold uppercase tracking-wide shrink-0">
                    {isAd ? 'Ad' : isCamp ? 'Campaign' : 'Adset'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                      isActiveStatus
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActiveStatus ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span>{isActiveStatus ? 'Active' : 'Paused'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(entity.id).catch(() => {});
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 1500);
                    }}
                    className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-100 text-[11px] font-mono text-slate-400 hover:text-slate-700 cursor-pointer truncate"
                    title="Sao chép ID"
                  >
                    <span className="truncate">ID: {entity.id}</span>
                    {copiedId ? (
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 shrink-0" />
                    )}
                  </button>
                </div>
                <h3 className="text-[13.5px] sm:text-[15px] font-bold text-slate-900 truncate mt-0.5">
                  {entity.name}
                </h3>
              </div>

              {/* Mobile Close Button in Top Row */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng"
                className="sm:hidden w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 cursor-pointer dom-ios-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Segmented View Switcher (Strictly 2 Tabs when CRM enabled) */}
            {enableCrmAttribution && (
              <div className="grid grid-cols-2 sm:hidden gap-1 bg-slate-100 p-1 rounded-xl w-full">
                <button
                  type="button"
                  onClick={() => updateTabState({ tab: 'insights' })}
                  className={`py-1.5 px-2 rounded-lg text-xs text-center truncate transition-all cursor-pointer dom-ios-press ${
                    activeModalTab === 'insights'
                      ? 'bg-white text-[#1E40FF] font-semibold shadow-xs'
                      : 'text-slate-600 font-medium'
                  }`}
                >
                  Chỉ số Quảng cáo
                </button>
                <button
                  type="button"
                  onClick={() => updateTabState({ tab: 'crm_leads' })}
                  className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs truncate transition-all cursor-pointer dom-ios-press ${
                    activeModalTab === 'crm_leads'
                      ? 'bg-[#1E40FF] text-white font-semibold shadow-xs'
                      : 'text-slate-700 font-medium'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Lead &amp; Sale ({totalCrmLeads})</span>
                </button>
              </div>
            )}

            {/* Mobile Action Row (< sm): Strictly MAX 2 Controls (AI Button + More Overflow Menu) */}
            <div className="flex sm:hidden items-center gap-2 w-full">
              <button
                type="button"
                disabled={currentEntityAi?.loading}
                onClick={() => void handleRunEntityAiAnalysis()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] text-white text-xs font-semibold shadow-xs cursor-pointer dom-ios-press disabled:opacity-60"
              >
                {currentEntityAi?.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                )}
                <span className="truncate">
                  {currentEntityAi?.loading ? 'Đang phân tích AI...' : 'AI Phân tích chuyên sâu'}
                </span>
              </button>

              <DomOverflowMenu
                ariaLabel="Thao tác khác trên đối tượng quảng cáo"
                items={[
                  ...(isAd
                    ? [
                        {
                          id: 'preview',
                          label: quickPreviewOpen ? 'Ẩn bản xem trước' : 'Quick Preview mẫu QC',
                          icon: <Eye className="w-3.5 h-3.5 text-[#1E40FF]" />,
                          active: quickPreviewOpen,
                          onClick: () => setQuickPreviewOpen((v) => !v),
                        },
                      ]
                    : []),
                  ...(isAd && adNode.post_url
                    ? [
                        {
                          id: 'post_url',
                          label: 'Mở bài Post Facebook',
                          icon: <ExternalLink className="w-3.5 h-3.5 text-[#1E40FF]" />,
                          onClick: () => {
                            window.open(adNode.post_url, '_blank', 'noopener,noreferrer');
                          },
                        },
                      ]
                    : []),
                  ...(onOpenAiKeySetup
                    ? [
                        {
                          id: 'ai_key',
                          label: 'Thiết lập AI API Key (Chung)',
                          icon: <KeyRound className="w-3.5 h-3.5 text-emerald-600" />,
                          onClick: onOpenAiKeySetup,
                        },
                      ]
                    : []),
                  {
                    id: 'copy_id',
                    label: copiedId ? 'Đã chép mã ID!' : `Sao chép ID (${entity.id})`,
                    icon: <Copy className="w-3.5 h-3.5" />,
                    onClick: () => {
                      navigator.clipboard?.writeText(entity.id).catch(() => {});
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 1500);
                    },
                  },
                ]}
              />
            </div>

            {/* Desktop/Tablet Action Bar (>= sm) */}
            <div className="hidden sm:flex flex-wrap items-center gap-2 shrink-0">
              {enableCrmAttribution && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    data-testid="entity-modal-insights-tab"
                    onClick={() => updateTabState({ tab: 'insights' })}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer dom-ios-press ${
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
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer dom-ios-press ${
                      activeModalTab === 'crm_leads'
                        ? 'bg-[#1E40FF] text-white font-semibold shadow-sm'
                        : 'text-slate-700 font-medium hover:text-[#1E40FF]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Lead &amp; Sale ({totalCrmLeads})</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                data-testid="entity-ai-analyze-btn"
                disabled={currentEntityAi?.loading}
                onClick={() => void handleRunEntityAiAnalysis()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-xs font-semibold shadow-sm cursor-pointer dom-ios-press disabled:opacity-60"
              >
                {currentEntityAi?.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                )}
                <span>{currentEntityAi?.loading ? 'Đang phân tích...' : 'AI Phân tích'}</span>
              </button>

              {isAd && (
                <button
                  type="button"
                  onClick={() => setQuickPreviewOpen((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer dom-ios-press ${
                    quickPreviewOpen
                      ? 'bg-[#1E40FF] text-white border-[#1E40FF]'
                      : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#1E40FF] border-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Quick Preview</span>
                </button>
              )}

              {isAd && adNode.post_url && (
                <a
                  href={adNode.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E40FF] text-xs font-semibold dom-ios-press"
                >
                  <span>Xem bài Post</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer dom-ios-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Drawer Body (overscroll-contain prevents background scroll bleed) */}
          <div
            data-testid="dom-meta-drawer-scroll-body"
            className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-3.5 sm:p-6 space-y-3.5 sm:space-y-4 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]"
          >
            {/* Optional Live Gemini AI Entity Diagnosis Card */}
            {currentEntityAi && (currentEntityAi.loading || currentEntityAi.html || currentEntityAi.error) && (
              <div className="rounded-2xl bg-gradient-to-br from-[#F4F8FF] via-white to-cyan-50/40 border border-blue-200/90 shadow-sm p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#1E40FF] to-[#0284C7] text-white inline-flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        AI Đánh Giá &amp; Chẩn Đoán Chuyên Sâu ({entity.name})
                      </h4>
                      {currentEntityAi.model && (
                        <span className="text-[10.5px] font-medium text-slate-500">
                          Mô hình: {currentEntityAi.model} (API Key dùng chung CRM &amp; Meta)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onOpenAiKeySetup && (
                      <button
                        type="button"
                        onClick={onOpenAiKeySetup}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 text-[11px] font-semibold text-slate-700 cursor-pointer"
                      >
                        Cài đặt AI Key
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEntityAiState(null)}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>

                {currentEntityAi.loading ? (
                  <div className="py-6 flex items-center justify-center gap-2.5 text-xs font-semibold text-[#1E40FF]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI đang tổng hợp tín hiệu phễu, khung giờ vàng, tỉnh thành &amp; đề xuất tối ưu...</span>
                  </div>
                ) : currentEntityAi.error ? (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
                    <span>{currentEntityAi.error}</span>
                    {onOpenAiKeySetup && (
                      <button
                        type="button"
                        onClick={onOpenAiKeySetup}
                        className="px-3 py-1 rounded-lg bg-[#1E40FF] text-white font-bold cursor-pointer"
                      >
                        Mở Thiết lập AI Key
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-white/95 border border-slate-200/80 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {renderSafeAiReportNodes(currentEntityAi.html, currentEntityAi.plainText)}
                  </div>
                )}
              </div>
            )}

            {/* Optional Quick Ad Preview Collapsible Banner */}
            {isAd && quickPreviewOpen && (
              <div className="rounded-2xl bg-white border border-blue-200/80 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#1E40FF]" />
                    <span className="text-xs font-bold text-slate-800">
                      Bản xem trước mẫu quảng cáo (Meta Feed Preview)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickPreviewOpen(false)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    Thu gọn
                  </button>
                </div>
                {deepDetail?.previewIframeHtml ? (
                  <div
                    className="w-full overflow-x-auto flex justify-center bg-slate-50 rounded-xl p-3 border border-slate-100 [&_iframe]:max-w-full [&_iframe]:rounded-lg [&_iframe]:border-0"
                    dangerouslySetInnerHTML={{ __html: deepDetail.previewIframeHtml }}
                  />
                ) : adNode.image_url || adNode.thumbnail_url ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <img
                      src={adNode.image_url || adNode.thumbnail_url}
                      alt={adNode.name}
                      className="w-44 h-44 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                    />
                    <div className="space-y-2 text-xs text-slate-600 min-w-0">
                      <div className="font-bold text-sm text-slate-900">{adNode.name}</div>
                      {adNode.campaign_name && (
                        <div>
                          Chiến dịch: <strong className="text-slate-800">{adNode.campaign_name}</strong>
                        </div>
                      )}
                      {adNode.adset_name && (
                        <div>
                          Nhóm QC: <strong className="text-slate-800">{adNode.adset_name}</strong>
                        </div>
                      )}
                      {adNode.story_id && (
                        <div className="font-mono text-[11px] text-slate-400">
                          Story ID: {adNode.story_id}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    {isDeepLoading
                      ? 'Đang tải bản xem trước từ Meta Graph...'
                      : 'Mẫu quảng cáo này không có bản xem trước công khai.'}
                  </div>
                )}
              </div>
            )}

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
                    <div className="space-y-2.5 py-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <div key={idx} className="h-12 rounded-xl dom-meta-skeleton-soft" />
                      ))}
                    </div>
                  ) : leadsResp?.error ? (
                    <div className="py-8 text-center text-xs text-rose-600">{leadsResp.error}</div>
                  ) : currentLeads.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400">
                      Chưa ghi nhận khách hàng nào khớp bộ lọc trong khoảng ngày đã chọn.
                    </div>
                  ) : (
                    <>
                      {/* Mobile Lead Cards (< sm) */}
                      <div className="sm:hidden space-y-2.5 max-h-[420px] overflow-y-auto pr-0.5">
                        {currentLeads.map((ld) => {
                          const qBadge = getQualityStatusDisplay(ld.quality_status, ld.stage_key);
                          return (
                            <div
                              key={ld.id}
                              className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 truncate">
                                    {ld.name}
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                    {ld.phone || '—'}
                                  </div>
                                </div>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10.5px] font-semibold shrink-0 ${qBadge.className}`}
                                >
                                  {qBadge.label}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600 pt-1.5 border-t border-slate-100">
                                <span className="truncate">
                                  Sale: <strong className="text-slate-800">{ld.assigned_to_name}</strong>
                                </span>
                                {onOpenLead ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onOpenLead(ld);
                                      onClose();
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1E40FF] font-semibold shrink-0 cursor-pointer"
                                  >
                                    Xem hồ sơ
                                  </button>
                                ) : ld.total_revenue_vnd > 0 ? (
                                  <span className="font-bold text-slate-800 tabular-nums shrink-0">
                                    {formatDomMoneyShort(ld.total_revenue_vnd, currency)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="hidden sm:block dom-meta-table-scroll overflow-x-auto overflow-y-auto max-h-[420px] rounded-xl border border-slate-200">
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
                                  {ld.quality_note && (
                                    <div className="text-[10.5px] text-slate-400 italic truncate max-w-[180px] mt-0.5">
                                      {ld.quality_note}
                                    </div>
                                  )}
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
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Row 1: 4 Hero Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="rounded-2xl bg-gradient-to-br from-[#1E40FF] via-[#1B4DFF] to-[#0284C7] text-white p-4 shadow-[0_10px_24px_-8px_rgba(30,64,255,0.4)]">
                    <div className="text-xs font-medium text-white/85">Spent</div>
                    <div className="text-xl sm:text-2xl font-bold mt-1 tabular-nums">
                      {formatDomMoney(entity.spend, currency)}
                    </div>
                    {(isCamp || isAdset) && (
                      <div className="text-[11px] text-white/80 mt-1.5 truncate">
                        {Number((entity as DomMetaCampaignNode).daily_budget || 0) > 0
                          ? `Daily: ${formatDomMoney(Number((entity as DomMetaCampaignNode).daily_budget || 0), currency)}`
                          : Number((entity as DomMetaCampaignNode).lifetime_budget || 0) > 0
                            ? `Lifetime: ${formatDomMoney(Number((entity as DomMetaCampaignNode).lifetime_budget || 0), currency)}`
                            : isAdset
                              ? 'Ngân sách CBO Chiến dịch'
                              : 'Ngân sách cấp Adset (ABO)'}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-white border border-slate-200/80 p-4 flex flex-col justify-between">
                    <div className="text-xs font-medium text-slate-500">Optimization Goal</div>
                    <div className="text-base sm:text-lg font-bold text-slate-800 mt-1 truncate">
                      {entity.optimization_goal || 'QUALITY LEAD'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      Reach: <strong className="text-slate-700">{formatDomNumber(entity.reach)}</strong> · Impr:{' '}
                      <strong className="text-slate-700">{formatDomNumber(entity.impressions)}</strong>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white border border-slate-200/80 p-4 flex flex-col justify-between">
                    <div className="text-xs font-medium text-slate-500">Results</div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 tabular-nums">
                      {formatDomNumber(entity.result)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      CTR: <strong className="text-slate-700">{entity.ctr.toFixed(2)}%</strong> · Link Clicks:{' '}
                      <strong className="text-slate-700">{formatDomNumber(entity.link_click)}</strong>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white border border-slate-200/80 p-4 flex flex-col justify-between">
                    <div className="text-xs font-medium text-slate-500">{cprHeaderLabel}</div>
                    <div className="text-xl sm:text-2xl font-bold text-[#1E40FF] mt-1 tabular-nums">
                      {entity.result > 0 ? formatDomMoney(entity.cpr, currency) : '—'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      CPM: <strong className="text-slate-700">{formatDomMoney(entity.cpm, currency)}</strong> · CPC:{' '}
                      <strong className="text-slate-700">{formatDomMoney(entity.cpc, currency)}</strong>
                    </div>
                  </div>
                </div>

                {/* Row 2: View Daily Trend Chart (7 cols) + Creative Video Funnel / Interaction (5 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">View Daily Trend</h4>
                        <p className="text-[11px] text-slate-400">
                          Biến động chi tiêu, kết quả &amp; CPR theo từng ngày
                        </p>
                      </div>
                      <DomMetaSelect
                        ariaLabel="Chọn chỉ số biểu đồ ngày"
                        value={trendMetric}
                        onChange={(v) => setTrendMetric(v as DomMetaDailyChartMetric)}
                        variant="pill"
                        options={[
                          { value: 'spend', label: 'Spent (Chi tiêu)' },
                          { value: 'result', label: 'Results (Kết quả)' },
                          { value: 'cpr', label: 'Cost per Result (CPR)' },
                          { value: 'leads', label: 'Leads (Khách tiềm năng)' },
                          { value: 'messages', label: 'Messages (Tin nhắn)' },
                          { value: 'reach', label: 'Reach (Tiếp cận)' },
                          { value: 'impressions', label: 'Impressions (Hiển thị)' },
                          { value: 'clicks', label: 'All Clicks' },
                          { value: 'cpm', label: 'CPM' },
                        ]}
                      />
                    </div>

                    {isDeepLoading ? (
                      <div className="flex-1 min-h-[245px] rounded-xl dom-meta-skeleton-soft" />
                    ) : (
                      <DailyTrendAreaChart
                        data={dailyChartData}
                        metric={trendMetric}
                        currency={currency}
                        minHeight={245}
                      />
                    )}
                  </div>

                  <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col gap-3.5">
                    <div className="flex items-center justify-between gap-2 shrink-0">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {showFunnel ? 'Creative Video Funnel' : 'Interaction Breakdown'}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {showFunnel
                            ? 'Tỷ lệ giữ chân người xem qua từng mốc thời lượng'
                            : 'Chi tiết tương tác bài viết, tin nhắn & nhấp chuột'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFunnelOverride({ key: entityKey, show: !showFunnel })
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#1E40FF] text-xs font-semibold text-slate-700 cursor-pointer shrink-0 dom-ios-press"
                      >
                        ⇄ {showFunnel ? 'Interaction' : 'Video Funnel'}
                      </button>
                    </div>

                    {showFunnel ? (
                      <VideoFunnelBars
                        impressions={entity.impressions}
                        video3s={entity.video_3s}
                        thruplay={entity.thruplay}
                        avgWatchTimeSec={entity.video_avg_time}
                        completionRate={entity.completion_rate}
                        p25={entity.video_p25}
                        p50={entity.video_p50}
                        p75={entity.video_p75}
                        p95={entity.video_p95}
                        p100={entity.video_p100}
                        linkClicks={entity.link_click}
                      />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-1 content-between">
                        {[
                          ['Post Engagement', entity.post_engagement],
                          ['Link Clicks', entity.link_click],
                          ['LPV (Trang đích)', entity.lpv || 0],
                          ['Reactions', entity.reaction],
                          ['Comments', entity.comments],
                          ['Shares', entityActionShares],
                          ['Follows / Likes', entity.follows],
                          ['Post Saves', entityPostSaves],
                          ['Mess. Started', entity.messages],
                        ].map(([lbl, val]) => (
                          <div
                            key={String(lbl)}
                            className="rounded-xl bg-slate-50/90 border border-slate-100 px-3 py-2.5 flex flex-col justify-between"
                          >
                            <div className="text-[10.5px] font-medium text-slate-500 truncate">
                              {lbl}
                            </div>
                            <div className="text-sm sm:text-[15px] font-bold text-slate-800 mt-1 tabular-nums">
                              {formatDomNumber(Number(val || 0))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2B: Full User Journey Funnel & Behavioral Micro-Signals (60/40 Balanced Split) */}
                <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5">
                  <UserBehaviorFunnelCard metrics={entity} currency={currency} />
                </div>

                {/* Row 2C: Creative Copy/CTA & Meta Ad Relevance / Delivery Diagnostics */}
                {(resolvedCreative || hasDiagnosticBadges) && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    {resolvedCreative && (
                      <div
                        className={`${
                          hasDiagnosticBadges ? 'lg:col-span-7' : 'lg:col-span-12'
                        } rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col gap-3`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-800">
                            Nội dung Creative &amp; CTA (Meta Ad Creative Spec)
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {resolvedCreative.ctaType && (
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-[10.5px] font-bold uppercase">
                                CTA: {resolvedCreative.ctaType.replace(/_/g, ' ')}
                              </span>
                            )}
                            {resolvedCreative.linkUrl && (
                              <a
                                href={resolvedCreative.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1E40FF] text-[10.5px] font-semibold"
                              >
                                <span>Landing URL</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {resolvedCreative.instagramPermalinkUrl && (
                              <a
                                href={resolvedCreative.instagramPermalinkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 text-[10.5px] font-semibold"
                              >
                                <span>IG Post</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        {resolvedCreative.title && (
                          <div className="text-xs sm:text-sm font-bold text-slate-900">
                            {resolvedCreative.title}
                          </div>
                        )}
                        {resolvedCreative.body && (
                          <div className="text-[12.5px] text-slate-700 leading-relaxed whitespace-pre-line flex-1 min-h-[170px] max-h-[340px] overflow-y-auto rounded-xl bg-slate-50/90 border border-slate-200/75 p-3.5">
                            {resolvedCreative.body}
                          </div>
                        )}
                      </div>
                    )}

                    {hasDiagnosticBadges && (
                      <div
                        className={`${
                          resolvedCreative ? 'lg:col-span-5' : 'lg:col-span-12'
                        } rounded-2xl bg-white border border-slate-200/80 p-5 space-y-3`}
                      >
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">
                            Chẩn đoán Chất lượng &amp; Đấu thầu Meta
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Relevance Diagnostics, Learning Stage &amp; Bid Strategy trực tiếp từ Meta API
                          </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          {resolvedDiagnostics.qualityRanking && (
                            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                              <span className="text-[10px] text-slate-400 block">Quality Ranking</span>
                              <strong className="text-slate-800 font-bold text-[11px]">
                                {resolvedDiagnostics.qualityRanking.replace(/_/g, ' ')}
                              </strong>
                            </div>
                          )}
                          {resolvedDiagnostics.engagementRateRanking && (
                            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                              <span className="text-[10px] text-slate-400 block">Engagement Rank</span>
                              <strong className="text-slate-800 font-bold text-[11px]">
                                {resolvedDiagnostics.engagementRateRanking.replace(/_/g, ' ')}
                              </strong>
                            </div>
                          )}
                          {resolvedDiagnostics.conversionRateRanking && (
                            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                              <span className="text-[10px] text-slate-400 block">Conversion Rank</span>
                              <strong className="text-slate-800 font-bold text-[11px]">
                                {resolvedDiagnostics.conversionRateRanking.replace(/_/g, ' ')}
                              </strong>
                            </div>
                          )}
                          {resolvedDiagnostics.learningStageStatus && (
                            <div className="rounded-xl bg-blue-50/70 border border-blue-100 px-3 py-2">
                              <span className="text-[10px] text-slate-500 block">Máy học (Learning)</span>
                              <strong className="text-[#1E40FF] font-bold text-[11px]">
                                {resolvedDiagnostics.learningStageStatus}
                                {resolvedDiagnostics.learningStageConversions !== undefined
                                  ? ` (${resolvedDiagnostics.learningStageConversions} KQ)`
                                  : ''}
                              </strong>
                            </div>
                          )}
                          {resolvedDiagnostics.bidStrategy && (
                            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                              <span className="text-[10px] text-slate-400 block">Bid Strategy</span>
                              <strong className="text-slate-800 font-bold text-[11px]">
                                {resolvedDiagnostics.bidStrategy.replace(/_/g, ' ')}
                              </strong>
                            </div>
                          )}
                          {(resolvedDiagnostics.destinationType || resolvedDiagnostics.billingEvent) && (
                            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                              <span className="text-[10px] text-slate-400 block">Đích / Tính phí</span>
                              <strong className="text-slate-800 font-bold text-[11px]">
                                {(
                                  resolvedDiagnostics.destinationType ||
                                  resolvedDiagnostics.billingEvent ||
                                  ''
                                ).replace(/_/g, ' ')}
                              </strong>
                            </div>
                          )}
                        </div>
                        {resolvedDiagnostics.attributionSummary && (
                          <div className="text-[11px] text-slate-500 pt-0.5">
                            Cửa sổ phân bổ (Attribution):{' '}
                            <strong className="text-slate-700">
                              {resolvedDiagnostics.attributionSummary}
                            </strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Row 3: Deep 8-Dimension Breakdown with Sort Select & Non-Wrapping Subtabs (7 cols) + Clean Audiences & Targeting Card (5 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200/80 p-3.5 sm:p-5 flex flex-col gap-3 min-w-0">
                    <div className="flex items-start sm:items-center justify-between gap-2 shrink-0 min-w-0">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-800 truncate">
                          Phân rã Chuyên sâu Đa chiều
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          8 chiều dữ liệu Meta Graph API (Spent, CTR, Result &amp; CPR)
                        </p>
                      </div>
                      <DomMetaSelect
                        ariaLabel="Sắp xếp bảng phân rã"
                        value={dimSortBy}
                        onChange={(v) => setDimSortBy(v as 'spend' | 'result' | 'cpr' | 'ctr')}
                        variant="compact"
                        align="right"
                        options={[
                          { value: 'spend', label: 'Xếp: Spent cao' },
                          { value: 'result', label: 'Xếp: Kết quả cao' },
                          { value: 'cpr', label: 'Xếp: CPR tối ưu' },
                          { value: 'ctr', label: 'Xếp: CTR % cao' },
                        ]}
                      />
                    </div>

                    <DomResponsiveSubtabs
                      variant="segmented"
                      maxMobile={2}
                      maxTablet={3}
                      maxDesktop={4}
                      value={cprDimTab}
                      onChange={(id) =>
                        setCprDimTab(
                          id as
                            | 'platform'
                            | 'plat_device'
                            | 'age_gender'
                            | 'region'
                            | 'country'
                            | 'device'
                            | 'hour_user'
                            | 'day_of_week'
                        )
                      }
                      tabs={[
                        { id: 'platform', label: 'Platform × Vị trí', shortLabel: 'Platform' },
                        { id: 'age_gender', label: 'Tuổi & Giới tính', shortLabel: 'Tuổi & Giới' },
                        { id: 'region', label: 'Tỉnh / Thành', shortLabel: 'Tỉnh thành' },
                        { id: 'device', label: 'Thiết bị', shortLabel: 'Thiết bị' },
                        { id: 'plat_device', label: 'Platform × Thiết bị' },
                        { id: 'country', label: 'Quốc gia' },
                        { id: 'hour_user', label: '24h Giờ KH' },
                        { id: 'day_of_week', label: 'Thứ T2–CN' },
                      ]}
                    />

                    {isDeepLoading ? (
                      <div className="space-y-2.5 py-2 flex-1">
                        {[0, 1, 2, 3, 4].map((idx) => (
                          <div key={idx} className="h-11 rounded-xl dom-meta-skeleton-soft" />
                        ))}
                      </div>
                    ) : activeDimRows.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400 flex-1 flex items-center justify-center">
                        Chưa có dữ liệu phân rã chi tiết trong khoảng thời gian này
                      </div>
                    ) : (
                      <>
                        {/* Mobile Native Breakdown Cards (< sm) */}
                        <div className="sm:hidden space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
                          {activeDimRows.map((row, idx) => {
                            const isBestCpr =
                              Boolean(bestCprRowLabel) && row.label === bestCprRowLabel;
                            const rowCtr =
                              row.ctr ??
                              (row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0);
                            return (
                              <div
                                key={`m_${row.label}_${idx}`}
                                className="rounded-xl border border-slate-200/80 bg-slate-50/45 p-2.5 space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2 min-w-0">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {cprDimTab === 'platform' || cprDimTab === 'plat_device' ? (
                                      <PlatformBrandLogo
                                        platform={row.rawKey || row.subLabel || row.label}
                                        size="sm"
                                      />
                                    ) : cprDimTab === 'device' ? (
                                      <DeviceBrandLogo
                                        device={row.rawKey || row.label}
                                        size="sm"
                                      />
                                    ) : (
                                      <span className="w-5 h-5 rounded-md bg-blue-50 text-[#1E40FF] inline-flex items-center justify-center shrink-0 text-[10px] font-bold">
                                        {idx + 1}
                                      </span>
                                    )}
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {row.label.replace(/\s+Province$/i, '')}
                                    </span>
                                    {isBestCpr && (
                                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9.5px] font-bold shrink-0">
                                        Tối ưu
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10.5px] font-semibold text-slate-400 tabular-nums shrink-0">
                                    {row.sharePct.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]"
                                    style={{
                                      width: `${Math.max(4, Math.min(100, row.sharePct))}%`,
                                    }}
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-white border border-slate-100 p-1.5 text-center">
                                  <div>
                                    <div className="text-[9.5px] text-slate-400">Spent</div>
                                    <div className="text-[11.5px] font-bold text-slate-800 tabular-nums truncate">
                                      {formatDomMoneyShort(row.spend, currency)}
                                    </div>
                                  </div>
                                  <div className="border-x border-slate-100">
                                    <div className="text-[9.5px] text-slate-400">KQ · CTR</div>
                                    <div className="text-[11.5px] font-bold text-slate-700 tabular-nums truncate">
                                      {formatDomNumber(row.result)} · {rowCtr.toFixed(1)}%
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[9.5px] text-slate-400">CPR</div>
                                    <div className="text-[11.5px] font-bold text-[#1E40FF] tabular-nums truncate">
                                      {row.result > 0 ? formatDomMoneyShort(row.cpr, currency) : '—'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="hidden sm:block dom-meta-table-scroll overflow-x-auto overflow-y-auto max-h-[340px] flex-1 rounded-xl border border-slate-100">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                              <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3">Phân khúc</th>
                              <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">
                                Total Spend
                              </th>
                              <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">
                                Clicks / CTR
                              </th>
                              <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">
                                Result
                              </th>
                              <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">
                                CPR
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeDimRows.map((row, idx) => {
                              const isBestCpr =
                                Boolean(bestCprRowLabel) && row.label === bestCprRowLabel;
                              const rowCtr =
                                row.ctr ?? (row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0);
                              return (
                                <tr key={`${row.label}_${idx}`} className="hover:bg-slate-50/80">
                                  <td className="py-2.5 px-3 min-w-[185px]">
                                    <div className="flex items-center gap-2.5">
                                      {cprDimTab === 'platform' || cprDimTab === 'plat_device' ? (
                                        <PlatformBrandLogo
                                          platform={row.rawKey || row.subLabel || row.label}
                                          size="sm"
                                        />
                                      ) : cprDimTab === 'device' ? (
                                        <DeviceBrandLogo
                                          device={row.rawKey || row.label}
                                          size="sm"
                                        />
                                      ) : cprDimTab === 'region' || cprDimTab === 'country' ? (
                                        <span className="w-5 h-5 rounded-md bg-blue-50 text-[#1E40FF] inline-flex items-center justify-center shrink-0">
                                          {cprDimTab === 'country' ? (
                                            <Globe className="w-3 h-3" />
                                          ) : (
                                            <MapPin className="w-3 h-3" />
                                          )}
                                        </span>
                                      ) : cprDimTab === 'hour_user' || cprDimTab === 'day_of_week' ? (
                                        <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 inline-flex items-center justify-center shrink-0">
                                          <Clock className="w-3 h-3" />
                                        </span>
                                      ) : (
                                        <span
                                          className={`w-5 h-5 rounded-md text-[10px] font-bold inline-flex items-center justify-center shrink-0 ${
                                            row.rawKey === 'female'
                                              ? 'bg-cyan-50 text-cyan-700'
                                              : 'bg-blue-50 text-[#1E40FF]'
                                          }`}
                                        >
                                          {row.rawKey === 'female' ? 'Nữ' : row.rawKey === 'male' ? 'Nam' : 'Độ'}
                                        </span>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-semibold text-slate-800 truncate">
                                            {row.label.replace(/\s+Province$/i, '')}
                                          </span>
                                          {isBestCpr && (
                                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9.5px] font-bold shrink-0">
                                              Tối ưu
                                            </span>
                                          )}
                                        </div>
                                        <div className="mt-1 h-1.5 w-full max-w-[160px] rounded-full bg-slate-100 overflow-hidden">
                                          <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]"
                                            style={{
                                              width: `${Math.max(4, Math.min(100, row.sharePct))}%`,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums">
                                    <div className="font-semibold text-slate-800">
                                      {formatDomMoney(row.spend, currency)}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {row.sharePct.toFixed(1)}%
                                      {row.reach > 0 ? ` · ${formatDomNumber(row.reach)} reach` : ''}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums">
                                    <div className="font-semibold text-slate-700">
                                      {formatDomNumber(row.clicks)}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {rowCtr.toFixed(2)}%
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-slate-700 tabular-nums">
                                    {formatDomNumber(row.result)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-[#1E40FF] whitespace-nowrap tabular-nums">
                                    {row.result > 0 ? formatDomMoney(row.cpr, currency) : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      </>
                    )}
                  </div>

                  {/* Right Column: Clean, Scannable Audiences & Targeting Card */}
                  <div
                    data-testid="dom-meta-targeting-card"
                    className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col gap-3.5"
                  >
                    <div className="flex items-center justify-between gap-2 shrink-0">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          Audiences &amp; Targeting
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Chân dung đối tượng, vị trí địa lý &amp; tệp nhắm mục tiêu
                        </p>
                      </div>
                      {resolvedTargeting?.targeting_automation?.advantage_audience === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[10.5px] font-bold text-[#1E40FF] shrink-0">
                          <Sparkles className="w-3 h-3" />
                          <span>Advantage+</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10.5px] font-semibold text-slate-600 shrink-0">
                          Manual Spec
                        </span>
                      )}
                    </div>

                    {isDeepLoading && !resolvedTargeting ? (
                      <div className="space-y-3 flex-1">
                        <div className="h-16 rounded-xl dom-meta-skeleton-soft" />
                        <div className="h-16 rounded-xl dom-meta-skeleton-soft" />
                        <div className="h-16 rounded-xl dom-meta-skeleton-soft" />
                      </div>
                    ) : resolvedTargeting ? (
                      <div className="space-y-3 text-xs flex-1 flex flex-col justify-between">
                        {/* Block 1: Demographics (Age + Gender) & Estimated Audience Scale */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="rounded-xl bg-slate-50/95 border border-slate-200/70 p-3 space-y-2">
                            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                              Độ tuổi mục tiêu
                            </div>
                            <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                              {ageMin} – {ageMax >= 65 ? '65+' : ageMax} tuổi
                            </div>
                            <div className="relative h-2 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]"
                                style={{ left: `${ageLeftPct}%`, width: `${ageWidthPct}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9.5px] text-slate-400 font-mono">
                              <span>13</span>
                              <span>25</span>
                              <span>45</span>
                              <span>65+</span>
                            </div>
                          </div>

                          <div className="rounded-xl bg-slate-50/95 border border-slate-200/70 p-3 flex flex-col justify-between">
                            <div>
                              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                                Giới tính &amp; Quy mô tệp
                              </div>
                              <div className="text-sm font-extrabold text-slate-900 mt-1">
                                {genderLabel}
                              </div>
                            </div>
                            {deepDetail?.deliveryEstimate ? (
                              <div className="mt-2 pt-2 border-t border-slate-200/70">
                                <div className="text-[10px] text-slate-500">Ước tính tiếp cận tháng</div>
                                <div className="text-xs font-bold text-[#1E40FF] tabular-nums">
                                  {formatDomNumber(deepDetail.deliveryEstimate.usersLowerBound)} –{' '}
                                  {formatDomNumber(deepDetail.deliveryEstimate.usersUpperBound)}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10.5px]">
                                <span className="text-slate-500">Phân phối</span>
                                <span className="font-semibold text-emerald-700">Tối ưu tự động</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Block 2: Clean Geo Locations */}
                        <div className="rounded-xl bg-slate-50/75 border border-slate-200/70 p-3 space-y-2">
                          <div className="flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#1E40FF]" />
                              <span>Khu vực địa lý</span>
                            </span>
                            <span className="text-slate-500 normal-case font-semibold">
                              {uniqueGeoBadges.length > 0 ? `${uniqueGeoBadges.length} vị trí` : 'Toàn quốc'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                            {(uniqueGeoBadges.length > 0 ? uniqueGeoBadges.slice(0, 12) : ['Việt Nam']).map(
                              (loc, i) => (
                                <span
                                  key={`${loc}_${i}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200/90 text-slate-700 text-[11px] font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E40FF]" />
                                  <span>{loc}</span>
                                </span>
                              )
                            )}
                          </div>
                        </div>

                        {/* Block 3: Interests, Custom Audiences & Exclusions */}
                        {(uniqueInterests.length > 0 ||
                          customAuds.length > 0 ||
                          excludedAuds.length > 0) ? (
                          <div className="rounded-xl bg-slate-50/75 border border-slate-200/70 p-3 space-y-2.5 max-h-36 overflow-y-auto">
                            {uniqueInterests.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Sở thích &amp; Hành vi ({uniqueInterests.length})
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {uniqueInterests.slice(0, 10).map((intName, i) => (
                                    <span
                                      key={`int_${i}`}
                                      className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200/70 text-[#1E40FF] text-[10.5px] font-semibold"
                                    >
                                      {intName}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {customAuds.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                  Tệp đối tượng bao gồm ({customAuds.length})
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {customAuds.slice(0, 6).map((aud, i) => (
                                    <span
                                      key={`inc_${i}`}
                                      className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10.5px] font-semibold"
                                    >
                                      + {aud}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {excludedAuds.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                                  Tệp loại trừ ({excludedAuds.length})
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {excludedAuds.slice(0, 5).map((aud, i) => (
                                    <span
                                      key={`exc_${i}`}
                                      className="px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-200/80 text-rose-700 text-[10.5px] font-semibold"
                                    >
                                      − {aud}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-xl bg-[#F4F8FF] border border-blue-100 p-3 flex items-center gap-2.5 text-[11px] text-slate-600">
                            <Sparkles className="w-4 h-4 text-[#1E40FF] shrink-0" />
                            <span>
                              Mở rộng sở thích tự động theo tín hiệu chuyển đổi Meta Advantage+
                            </span>
                          </div>
                        )}

                        {/* Block 4: Publisher Platforms & Device Spec Logos */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10.5px] font-medium text-slate-400 mr-1">
                              Nền tảng:
                            </span>
                            {(targetPubPlats.length > 0
                              ? targetPubPlats
                              : ['facebook', 'instagram', 'messenger', 'audience_network']
                            ).map((plat) => (
                              <PlatformBrandLogo key={plat} platform={plat} size="xs" />
                            ))}
                          </div>
                          {targetDevPlats.length > 0 && (
                            <div className="flex items-center gap-1">
                              {targetDevPlats.map((dv) => (
                                <span
                                  key={dv}
                                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold capitalize"
                                >
                                  {dv.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-500 flex-1 flex items-center justify-center text-center">
                        Phân phối tự động theo thuật toán Meta Advantage+ Audience
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 4: 24-Hour Spent & Result Chart (8 cols) + Dedicated Frequency & Delivery Card (4 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  <div className="lg:col-span-8 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          24-Hour Spent &amp; Result Distribution
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Phân bổ ngân sách, kết quả chuyển đổi &amp; CPR thực tế theo 24 khung giờ (00h–23h)
                        </p>
                      </div>
                      {bestHourSlot && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-700">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            Giờ tối ưu: <strong>{bestHourSlot.label}</strong> (
                            {formatDomNumber(bestHourSlot.result)} KQ · CPR{' '}
                            {formatDomMoneyShort(bestHourSlot.cpr, currency)})
                          </span>
                        </span>
                      )}
                    </div>

                    {isDeepLoading ? (
                      <div className="flex-1 min-h-[225px] rounded-xl dom-meta-skeleton-soft" />
                    ) : (
                      <HourlySpendResultChart
                        hourly={hourlyBars}
                        hourlyAudience={deepDetail?.byHourAudience}
                        currency={currency}
                      />
                    )}
                  </div>

                  {/* Dedicated Frequency & Delivery Health Card (Separated cleanly from Targeting) */}
                  <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Frequency &amp; Delivery</h4>
                        <p className="text-[11px] text-slate-400">Tần suất lặp &amp; độ phủ hiển thị</p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-[10.5px] font-bold ${freqHealth.cls}`}
                      >
                        {freqHealth.label}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-1">
                      <svg viewBox="0 0 160 92" className="w-40 h-24 overflow-visible">
                        <path
                          d="M 16 80 A 64 64 0 0 1 144 80"
                          fill="none"
                          stroke="#E2E8F0"
                          strokeWidth="14"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 16 80 A 64 64 0 0 1 144 80"
                          fill="none"
                          stroke={freq >= 3.2 ? '#F59E0B' : '#1E40FF'}
                          strokeWidth="14"
                          strokeLinecap="round"
                          strokeDasharray={`${(freqPct / 100) * 201} 201`}
                        />
                      </svg>
                      <div className="-mt-7 text-center">
                        <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                          {freq.toFixed(2)}
                        </div>
                        <div className="text-[11px] font-medium text-slate-400">
                          Lượt hiển thị / Người
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <span className="text-slate-400 text-[10.5px] block">Reach</span>
                        <span className="font-bold text-slate-800 tabular-nums text-sm">
                          {formatDomNumber(entity.reach)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <span className="text-slate-400 text-[10.5px] block">Impressions</span>
                        <span className="font-bold text-slate-800 tabular-nums text-sm">
                          {formatDomNumber(entity.impressions)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <span className="text-slate-400 text-[10.5px] block">CPM</span>
                        <span className="font-bold text-slate-800 tabular-nums text-sm">
                          {formatDomMoneyShort(entity.cpm, currency)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <span className="text-slate-400 text-[10.5px] block">CTR (All)</span>
                        <span className="font-bold text-[#1E40FF] tabular-nums text-sm">
                          {entity.ctr.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 5: Full Visual Breakdown Charts (Age & Gender | Device Donut with Labels & Logos | Top Regions) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                      <h4 className="text-sm font-bold text-slate-800">Age &amp; Gender</h4>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setDrawerAgeMetric((m) =>
                              m === 'spend' ? 'result' : m === 'result' ? 'cpr' : 'spend'
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-[11px] font-semibold text-slate-700 hover:text-[#1E40FF] cursor-pointer"
                        >
                          ⇄ {drawerAgeMetric === 'spend' ? 'Spent' : drawerAgeMetric === 'result' ? 'Result' : 'CPR'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrawerAgeOnly((v) => !v)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            drawerAgeOnly
                              ? 'bg-[#1E40FF] text-white'
                              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {drawerAgeOnly ? 'By Gender' : 'Age Only'}
                        </button>
                      </div>
                    </div>
                    {isDeepLoading ? (
                      <div className="flex-1 min-h-[220px] rounded-xl dom-meta-skeleton-soft" />
                    ) : derivedAgeBuckets.length > 0 ? (
                      <AgeGenderBarChart
                        buckets={derivedAgeBuckets}
                        ageOnly={drawerAgeOnly}
                        metric={drawerAgeMetric}
                        currency={currency}
                      />
                    ) : (
                      <div className="flex-1 min-h-[210px] flex items-center justify-center text-xs text-slate-400">
                        Chưa có dữ liệu độ tuổi &amp; giới tính
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 shrink-0">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Device Breakdown</h4>
                        <p className="text-[11px] text-slate-400">Tỷ trọng iPhone, Android &amp; Desktop</p>
                      </div>
                    </div>
                    {isDeepLoading ? (
                      <div className="flex-1 min-h-[220px] rounded-xl dom-meta-skeleton-soft" />
                    ) : (
                      <DeviceDonutCard
                        devices={deepDetail?.byDevice || []}
                        currency={currency}
                        compact
                      />
                    )}
                  </div>

                  <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 shrink-0">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Top Regions</h4>
                        <p className="text-[11px] text-slate-400">Tỉnh / Thành phố chi tiêu cao nhất</p>
                      </div>
                    </div>
                    {isDeepLoading ? (
                      <div className="flex-1 min-h-[220px] rounded-xl dom-meta-skeleton-soft" />
                    ) : (
                      <RegionSpentBarChart
                        regions={derivedRegions}
                        countries={derivedCountries}
                        currency={currency}
                      />
                    )}
                  </div>
                </div>

                {/* Row 6A: Child Adsets Breakdown when viewing Campaign */}
                {isCamp && Array.isArray(campNode.adsets) && campNode.adsets.length > 0 && (
                  <div className="rounded-2xl bg-white border border-slate-200/80 p-3.5 sm:p-5 space-y-3 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800 truncate">
                        Nhóm Quảng Cáo Thuộc Chiến Dịch ({campNode.adsets.length} Adsets)
                      </h4>
                    </div>

                    {/* Mobile Child Adset Cards (< sm) */}
                    <div className="sm:hidden space-y-2 max-h-[320px] overflow-y-auto pr-0.5">
                      {campNode.adsets.map((as) => (
                        <div
                          key={`m_as_${as.id}`}
                          onClick={() => onSelectChildAdset?.(as)}
                          className="rounded-xl border border-slate-200/85 bg-slate-50/45 p-2.5 space-y-2 cursor-pointer dom-ios-press"
                        >
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <CreativeThumbFan
                                urls={collectEntityThumbs(as.ads || [], 2)}
                                goal={as.optimization_goal}
                                active={as.effective_status.toUpperCase() === 'ACTIVE'}
                                variant="adset"
                                alt={as.name}
                              />
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {as.name}
                              </span>
                            </div>
                            {onSelectChildAdset && (
                              <ChevronRight className="w-4 h-4 text-[#1E40FF] shrink-0" />
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-white border border-slate-100 p-1.5 text-center">
                            <div>
                              <div className="text-[9.5px] text-slate-400">Spent</div>
                              <div className="text-[11.5px] font-bold text-slate-800 tabular-nums truncate">
                                {formatDomMoneyShort(as.spend, currency)}
                              </div>
                            </div>
                            <div className="border-x border-slate-100">
                              <div className="text-[9.5px] text-slate-400">Results</div>
                              <div className="text-[11.5px] font-bold text-slate-700 tabular-nums">
                                {formatDomNumber(as.result)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[9.5px] text-slate-400">CPR</div>
                              <div className="text-[11.5px] font-bold text-[#1E40FF] tabular-nums truncate">
                                {as.result > 0 ? formatDomMoneyShort(as.cpr, currency) : '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden sm:block dom-meta-table-scroll overflow-x-auto overflow-y-auto max-h-[300px] rounded-xl border border-slate-100">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3">Adset Name</th>
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">Spent</th>
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">Results</th>
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">CPR</th>
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">Hook Rate</th>
                            {onSelectChildAdset && (
                              <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">
                                Chi tiết
                              </th>
                            )}
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
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E40FF] font-semibold cursor-pointer"
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

                {/* Row 6B: Child Ads Breakdown when viewing Adset */}
                {isAdset && Array.isArray(adsetNode.ads) && adsetNode.ads.length > 0 && (
                  <div className="rounded-2xl bg-white border border-slate-200/80 p-3.5 sm:p-5 space-y-3 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800 truncate">
                        Bài Quảng Cáo Thuộc Nhóm ({adsetNode.ads.length} Ads)
                      </h4>
                    </div>

                    {/* Mobile Child Ad Cards (< sm) */}
                    <div className="sm:hidden space-y-2 max-h-[320px] overflow-y-auto pr-0.5">
                      {adsetNode.ads.map((ad) => (
                        <div
                          key={`m_ad_${ad.id}`}
                          onClick={() => onSelectChildAd?.(ad)}
                          className="rounded-xl border border-slate-200/85 bg-slate-50/45 p-2.5 space-y-2 cursor-pointer dom-ios-press"
                        >
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <CreativeThumbFan
                                urls={[ad.thumbnail_url || ad.image_url].filter(Boolean)}
                                goal={ad.optimization_goal}
                                active={ad.effective_status.toUpperCase() === 'ACTIVE'}
                                variant="ad"
                                alt={ad.name}
                              />
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {ad.name}
                              </span>
                            </div>
                            {onSelectChildAd && (
                              <ChevronRight className="w-4 h-4 text-[#1E40FF] shrink-0" />
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-white border border-slate-100 p-1.5 text-center">
                            <div>
                              <div className="text-[9.5px] text-slate-400">Spent</div>
                              <div className="text-[11.5px] font-bold text-slate-800 tabular-nums truncate">
                                {formatDomMoneyShort(ad.spend, currency)}
                              </div>
                            </div>
                            <div className="border-x border-slate-100">
                              <div className="text-[9.5px] text-slate-400">Results</div>
                              <div className="text-[11.5px] font-bold text-slate-700 tabular-nums">
                                {formatDomNumber(ad.result)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[9.5px] text-slate-400">CPR</div>
                              <div className="text-[11.5px] font-bold text-[#1E40FF] tabular-nums truncate">
                                {ad.result > 0 ? formatDomMoneyShort(ad.cpr, currency) : '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden sm:block dom-meta-table-scroll overflow-x-auto overflow-y-auto max-h-[300px] rounded-xl border border-slate-100">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3">Ad Creative</th>
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">Spent</th>
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">Results</th>
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">CPR</th>
                            <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">Hook Rate</th>
                            {onSelectChildAd && (
                              <th className="sticky top-0 z-10 bg-slate-50 py-2.5 px-3 text-right">
                                Chi tiết
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {adsetNode.ads.map((ad) => (
                            <tr key={ad.id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 max-w-[280px]">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <CreativeThumbFan
                                    urls={[ad.thumbnail_url || ad.image_url].filter(Boolean)}
                                    goal={ad.optimization_goal}
                                    active={ad.effective_status.toUpperCase() === 'ACTIVE'}
                                    variant="ad"
                                    alt={ad.name}
                                  />
                                  <span className="font-medium text-slate-700 truncate">{ad.name}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold text-slate-800 tabular-nums">
                                {formatDomMoney(ad.spend, currency)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                                {formatDomNumber(ad.result)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold text-[#1E40FF] tabular-nums">
                                {ad.result > 0 ? formatDomMoney(ad.cpr, currency) : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                                {ad.hook_rate.toFixed(1)}%
                              </td>
                              {onSelectChildAd && (
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => onSelectChildAd(ad)}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E40FF] font-semibold cursor-pointer"
                                  >
                                    Mở Ad
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

                {/* Row 7: Full Actions Detail (Compact Bounded List — Zero Screen Wall) */}
                <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 truncate">
                        Full Actions Detail
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#1E40FF] text-[10.5px] font-bold shrink-0">
                        {actionEntries.length} chỉ số
                      </span>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={actionQuery}
                        onChange={(e) => setActionQuery(e.target.value)}
                        placeholder="Lọc action (lead, mess, click)..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-800 outline-none focus:border-[#1E40FF]"
                      />
                    </div>
                  </div>

                  {actionEntries.length === 0 ? (
                    <div className="py-5 text-center text-xs text-slate-400">
                      Không có action chi tiết khớp bộ lọc
                    </div>
                  ) : (
                    <div className="max-h-[285px] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {actionEntries.map(([actKey, actVal]) => {
                        const uniqVal = Number(uniqueActionsMap[actKey] || 0);
                        const cpaVal =
                          Number(costPerActionMap[actKey] || 0) ||
                          (actVal > 0 && entity.spend > 0 ? entity.spend / actVal : 0);
                        const convValue = Number(actionValuesMap[actKey] || 0);
                        return (
                          <div
                            key={actKey}
                            className="rounded-xl bg-slate-50/85 hover:bg-blue-50/40 border border-slate-200/75 px-3 py-2 flex items-center justify-between gap-2 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div
                                className="text-xs font-semibold text-slate-800 truncate"
                                title={`${formatHumanActionKey(actKey)} (${actKey})`}
                              >
                                {formatHumanActionKey(actKey)}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 tabular-nums mt-0.5">
                                {cpaVal > 0 && (
                                  <span className="text-[#1E40FF] font-semibold">
                                    CPA {formatDomMoneyShort(cpaVal, currency)}
                                  </span>
                                )}
                                {uniqVal > 0 && (
                                  <span>Unique {formatDomNumber(uniqVal)}</span>
                                )}
                                {convValue > 0 && (
                                  <span className="text-emerald-700 font-semibold">
                                    Val {formatDomMoneyShort(convValue, currency)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <strong className="text-[13px] font-extrabold text-[#1E40FF] tabular-nums shrink-0">
                              {formatDomNumber(actVal)}
                            </strong>
                          </div>
                        );
                      })}
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
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-0 sm:p-6 flex items-end sm:items-center justify-center dom-ios-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[92dvh] sm:max-h-[90vh] bg-white rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 dom-ios-modal-responsive"
      >
        <div className="sm:hidden dom-sheet-grabber" />
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-lg font-semibold text-slate-800 truncate">
              Đối Soát Hiệu Suất Kỳ Trước
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
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
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                showSettings
                  ? 'bg-[#1E40FF] border-[#1E40FF] text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-blue-50 border-slate-200 text-slate-700 hover:text-[#1E40FF]'
              }`}
              title="Cài đặt 3 chỉ số tóm tắt trên thẻ KPI Dashboard"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">3 KPI</span>
              <span className="hidden sm:inline">Cài đặt 3 chỉ số KPI</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compare Controls Toolbar */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 sm:gap-3 shrink-0 relative">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-600">
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
              className="bg-white max-w-full"
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
                  <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:left-0 top-24 sm:top-full mt-2 z-50 sm:w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 space-y-3">
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
            <div className="dom-meta-table-scroll overflow-x-auto rounded-2xl border border-slate-200">
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
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-0 sm:p-6 flex items-end sm:items-center justify-center dom-ios-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92dvh] sm:max-h-[88vh] bg-white rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 dom-ios-modal-responsive"
      >
        <div className="sm:hidden dom-sheet-grabber" />
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Layers className="w-5 h-5 text-[#1E40FF] shrink-0" />
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate">
              Tùy Chỉnh Cột Hiển Thị &amp; View Presets
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer shrink-0"
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

        <div className="px-4 sm:px-6 pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] sm:py-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 sm:flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 sm:py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer text-center"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({ activeColumns: activeCols, customMetrics }, presetList);
              onClose();
            }}
            className="px-5 py-2.5 sm:py-2 rounded-xl bg-[#1E40FF] text-white text-xs font-semibold cursor-pointer shadow-sm text-center"
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
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-0 sm:p-6 flex items-end sm:items-center justify-center dom-ios-backdrop"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl max-h-[92dvh] sm:max-h-[88vh] bg-white rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 dom-ios-modal-responsive"
        >
          <div className="sm:hidden dom-sheet-grabber" />
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate">
              So Sánh Trực Tiếp {campaigns.length} Chiến Dịch
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Compare Cards (< sm) */}
          <div className="sm:hidden flex-1 overflow-y-auto p-4 space-y-2.5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
            {campaigns.map((c) => (
              <div
                key={`mc_${c.id}`}
                className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-3.5 space-y-2.5"
              >
                <div className="text-xs font-bold text-slate-900 line-clamp-2">{c.name}</div>
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white border border-slate-100 p-2 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">Spent</div>
                    <div className="text-xs font-bold text-slate-800 tabular-nums">
                      {formatDomMoneyShort(c.spend, currency)}
                    </div>
                  </div>
                  <div className="border-x border-slate-100">
                    <div className="text-[10px] text-slate-400">Result</div>
                    <div className="text-xs font-bold text-slate-800 tabular-nums">
                      {formatDomNumber(c.result)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">CPR</div>
                    <div className="text-xs font-bold text-[#1E40FF] tabular-nums">
                      {c.result > 0 ? formatDomMoneyShort(c.cpr, currency) : '—'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                  <span>Reach: {formatDomNumber(c.reach)}</span>
                  <span>CTR: {c.ctr.toFixed(2)}%</span>
                  <span>Hook: {c.hook_rate.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block dom-meta-table-scroll flex-1 overflow-auto p-5">
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
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-0 sm:p-6 flex items-end sm:items-center justify-center dom-ios-backdrop"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] bg-white rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 dom-ios-modal-responsive"
        >
          <div className="sm:hidden dom-sheet-grabber" />
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate">
                  Quản Lý Tài Khoản Quảng Cáo
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                  Đồng bộ tự động giữa Meta Report, CRM AutoData &amp; ERP
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 space-y-4">
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


const WorkspaceSettingsTabContent: React.FC<{
  tab: 'brand' | 'goals' | 'google_ads' | 'ecosystem' | 'plan' | 'accounts';
  config: DomMetaWorkspaceConfig;
  brands: DomMetaBrandFilter[];
  setBrands: React.Dispatch<React.SetStateAction<DomMetaBrandFilter[]>>;
  goalMode: 'goal' | 'brand' | 'keyword';
  setGoalMode: React.Dispatch<React.SetStateAction<'goal' | 'brand' | 'keyword'>>;
  goalKeywords: string[];
  setGoalKeywords: React.Dispatch<React.SetStateAction<string[]>>;
  newGoalKw: string;
  setNewGoalKw: React.Dispatch<React.SetStateAction<string>>;
  summaryMetrics: string[];
  toggleSummaryKpi: (id: string) => void;
  gads: DomMetaGoogleAdsConfig;
  setGads: React.Dispatch<React.SetStateAction<DomMetaGoogleAdsConfig>>;
  tenantSlug: string;
  shareUrl: string;
  copiedShare: boolean;
  setCopiedShare: React.Dispatch<React.SetStateAction<boolean>>;
  daysRemaining: number;
  canManageConfig: boolean;
  onTestGoogleAds?: (cfg: DomMetaGoogleAdsConfig) => Promise<{ rowsCount: number }>;
  onOpenAccountManager?: () => void;
  onOpenShareModal?: () => void;
}> = ({
  tab,
  config,
  brands,
  setBrands,
  goalMode,
  setGoalMode,
  goalKeywords,
  setGoalKeywords,
  newGoalKw,
  setNewGoalKw,
  summaryMetrics,
  toggleSummaryKpi,
  gads,
  setGads,
  tenantSlug,
  shareUrl,
  copiedShare,
  setCopiedShare,
  daysRemaining,
  canManageConfig,
  onTestGoogleAds,
  onOpenAccountManager,
  onOpenShareModal,
}) => (
  <>
    {!canManageConfig && (tab === 'brand' || tab === 'goals' || tab === 'google_ads') && (
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-semibold text-amber-800">
        Bạn đang xem ở quyền Quản lý / Xem báo cáo. Chỉ Quản trị viên (Admin) mới có thể lưu thay đổi
        cấu hình kết nối.
      </div>
    )}

    {tab === 'brand' && (
      <div className="space-y-4">
        <div className="rounded-2xl bg-[#F4F8FF] border border-blue-200/80 p-4 text-xs text-slate-700">
          Gắn từ khóa nhận diện thương hiệu/dự án (ví dụ: <strong>EcoLife</strong>,{' '}
          <strong>Signature</strong>) để lọc nhanh toàn bộ Dashboard &amp; Ads Library theo từng
          dòng sản phẩm.
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
                      onClick={() => setGoalKeywords((prev) => prev.filter((_, idx) => idx !== i))}
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

    {tab === 'accounts' && (
      <div className="space-y-4">
        <div className="rounded-2xl bg-[#F4F8FF] border border-blue-200/80 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-900">
              Tài khoản Meta Business / Ad Account đã kết nối
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              Chọn tài khoản chính hoặc gắn thêm BM mới chỉ trong 1 bước.
            </div>
          </div>
          {onOpenAccountManager && (
            <button
              type="button"
              onClick={onOpenAccountManager}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Mở trình quản lý Ad Account
            </button>
          )}
        </div>

        {config.meta_summary.accounts.length > 0 ? (
          <div className="space-y-2">
            {config.meta_summary.accounts.map((acc) => {
              const isPrimary = acc.ad_account_id === config.primary_ad_account_id;
              return (
                <div
                  key={acc.ad_account_id}
                  className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
                    isPrimary ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{acc.name}</div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      act_{acc.ad_account_id} · {acc.currency}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold shrink-0 ${
                      isPrimary
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isPrimary ? 'Đang hoạt động chính' : 'Đã kết nối'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500">
            Chưa có tài khoản quảng cáo nào được gắn. Nhấn “Mở trình quản lý Ad Account” để kết nối.
          </div>
        )}
      </div>
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
            Toàn bộ tài khoản quảng cáo, khóa kết nối bảo mật và cấu hình Google Ads của Workspace{' '}
            <code className="font-mono font-bold text-[#1E40FF]">{tenantSlug}</code> được liên thông
            tự động với phân hệ <strong>DOM Meta Report</strong> bên trong{' '}
            <strong>DOMATION ERP</strong> và <strong>Auto Chia Data</strong>.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-slate-700">
              Đường dẫn chia sẻ kèm bộ lọc ngày &amp; thương hiệu hiện tại
            </div>
            {onOpenShareModal && (
              <button
                type="button"
                onClick={onOpenShareModal}
                className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E40FF] text-[11px] font-bold cursor-pointer"
              >
                Phân quyền thành viên &amp; Public View
              </button>
            )}
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
              {copiedShare ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
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
              Gói Standard Đồng Bộ (-15%/Năm)
            </div>
            <div className="text-lg font-bold text-slate-800 mt-1">
              1.500.000₫<span className="text-xs font-normal text-slate-500">/tháng</span>
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Thanh toán năm 15.300.000₫ (~1.275.000₫/tháng) • Dùng chung CRM AutoData &amp; Meta
              Report
            </div>
          </div>
        </div>
      </div>
    )}
  </>
);

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
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-0 sm:p-6 flex items-end sm:items-center justify-center dom-ios-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] bg-white rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 dom-ios-modal-responsive"
      >
        <div className="sm:hidden dom-sheet-grabber" />
        {/* Header + Non-Wrapping Subtabs */}
        <div className="px-4 sm:px-6 pt-3.5 sm:pt-5 pb-3 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <Settings2 className="w-5 h-5 text-[#1E40FF] shrink-0" />
              <h3 className="text-sm sm:text-lg font-semibold text-slate-800 truncate">
                Cài Đặt Không Gian Báo Cáo
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <DomResponsiveSubtabs
            variant="segmented"
            maxMobile={2}
            maxTablet={3}
            maxDesktop={5}
            value={tab}
            onChange={(id) =>
              setTab(id as 'brand' | 'goals' | 'google_ads' | 'ecosystem' | 'plan')
            }
            tabs={[
              {
                id: 'brand',
                label: 'Brand Filters',
                shortLabel: 'Thương hiệu',
                icon: <Tag className="w-3.5 h-3.5" />,
              },
              {
                id: 'goals',
                label: 'Goal & KPI',
                shortLabel: 'Goal & KPI',
                icon: <Target className="w-3.5 h-3.5" />,
              },
              {
                id: 'google_ads',
                label: 'Tích hợp Google Ads',
                shortLabel: 'Google Ads',
                icon: <Sliders className="w-3.5 h-3.5" />,
              },
              {
                id: 'ecosystem',
                label: 'Đồng bộ ERP / AutoData',
                shortLabel: 'Đồng bộ CRM',
                icon: <Share2 className="w-3.5 h-3.5" />,
              },
              {
                id: 'plan',
                label: 'Gói Free 1 Tháng & Gia Hạn',
                shortLabel: 'Gói dịch vụ',
                icon: <Crown className="w-3.5 h-3.5" />,
              },
            ]}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {saveError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700">
              {saveError}
            </div>
          )}

          <WorkspaceSettingsTabContent
            tab={tab}
            config={config}
            brands={brands}
            setBrands={setBrands}
            goalMode={goalMode}
            setGoalMode={setGoalMode}
            goalKeywords={goalKeywords}
            setGoalKeywords={setGoalKeywords}
            newGoalKw={newGoalKw}
            setNewGoalKw={setNewGoalKw}
            summaryMetrics={summaryMetrics}
            toggleSummaryKpi={toggleSummaryKpi}
            gads={gads}
            setGads={setGads}
            tenantSlug={tenantSlug}
            shareUrl={shareUrl}
            copiedShare={copiedShare}
            setCopiedShare={setCopiedShare}
            daysRemaining={daysRemaining}
            canManageConfig={canManageConfig}
            onTestGoogleAds={onTestGoogleAds}
          />
        </div>

        {/* Footer */}
        <div
          className={`px-4 sm:px-6 pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] sm:py-4 bg-slate-50 border-t border-slate-200 ${
            canManageConfig && (tab === 'brand' || tab === 'goals' || tab === 'google_ads')
              ? 'grid grid-cols-2 sm:flex'
              : 'flex'
          } items-center justify-end gap-2.5 shrink-0`}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer text-center"
          >
            Đóng
          </button>
          {canManageConfig && (tab === 'brand' || tab === 'goals' || tab === 'google_ads') && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="px-5 py-2.5 sm:py-2 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
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
  authContext?: DomMetaAuthContext;
  aiConfig?: DomMetaSharedAiConfig;
  onOpenAiKeyModal?: () => void;
  onSaveReports?: (nextReports: DomMetaAiReportEntry[]) => Promise<void> | void;
  onClose: () => void;
}> = ({
  open,
  dataset,
  campaigns,
  currency = 'VND',
  activeBrandLabel = 'Tất cả',
  savedReports = [],
  authContext,
  aiConfig,
  onOpenAiKeyModal,
  onSaveReports,
  onClose,
}) => {
  const [tab, setTab] = useState<'result' | 'compare' | 'history'>('result');
  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [compareIds, setCompareIds] = useState<Record<string, boolean>>({});
  const [viewingHistoryItem, setViewingHistoryItem] = useState<DomMetaAiReportEntry | null>(null);
  const [promptFocus, setPromptFocus] = useState('');
  const [liveAiBusy, setLiveAiBusy] = useState(false);
  const [liveAiError, setLiveAiError] = useState<string | null>(null);

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

  const handleRunLiveGeminiWorkspace = async (scopeMode: 'workspace' | 'compare') => {
    if (!dataset) return;
    if (!authContext?.accessToken) {
      onOpenAiKeyModal?.();
      return;
    }
    if (aiConfig && !aiConfig.has_api_key) {
      onOpenAiKeyModal?.();
      return;
    }
    if (aiConfig && aiConfig.ai_ads_eval_enabled === false) {
      setLiveAiError(
        'Công tắc "Cho phép dùng AI đánh giá Quảng cáo" đang tắt. Vui lòng bấm "Cài đặt AI Key" để bật lại.'
      );
      return;
    }

    const chosenCamps =
      scopeMode === 'compare'
        ? campaigns.filter((c) => compareIds[c.id])
        : [...campaigns].sort((a, b) => b.spend - a.spend).slice(0, 12);

    if (scopeMode === 'compare' && chosenCamps.length < 2) return;

    setLiveAiBusy(true);
    setLiveAiError(null);
    try {
      const res = await requestDomMetaAiAnalysis(authContext, {
        scope: scopeMode,
        prompt_focus: promptFocus.trim() || undefined,
        context_data: {
          brand: activeBrandLabel,
          date_range: dataset.dateRange,
          current_totals: dataset.currentTotals,
          prev_totals: dataset.prevTotals,
          platforms: dataset.platforms,
          top_positions: dataset.positions.slice(0, 6),
          age_gender: dataset.ageGender,
          top_regions: dataset.regions.slice(0, 8),
          devices: dataset.devices.slice(0, 5),
          campaigns: chosenCamps.map((c) => ({
            id: c.id,
            name: c.name,
            goal: c.optimization_goal,
            spend: c.spend,
            result: c.result,
            cpr: c.cpr,
            ctr: c.ctr,
            frequency: c.frequency,
            hook_rate: c.hook_rate,
            hold_rate: c.hold_rate,
            lpv: c.lpv,
            leads: c.leads,
            messages: c.messages,
            purchases: c.purchases,
            roas: c.roas,
          })),
        },
      });
      const entry: DomMetaAiReportEntry = {
        id: `air_${Date.now()}`,
        timestamp: res.timestamp || new Date().toLocaleString('vi-VN'),
        label:
          scopeMode === 'compare'
            ? `AI So sánh (${res.model}): ${chosenCamps
                .map((c) => c.name)
                .slice(0, 2)
                .join(' vs ')}`
            : `Gemini AI Chuyên Sâu (${res.model})`,
        brand: activeBrandLabel,
        date_range: diagnosticReport.dateRange,
        preview: res.preview,
        html: res.html,
        plain_text: res.plain_text,
      };
      setViewingHistoryItem(entry);
      setTab('result');
      await handlePersistReport(entry);
    } catch (err: unknown) {
      setLiveAiError(getErrText(err, 'Không thể kết nối Google Gemini AI.'));
    } finally {
      setLiveAiBusy(false);
    }
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
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-0 sm:p-6 flex items-end sm:items-center justify-center dom-ios-backdrop"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] bg-white rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 dom-ios-modal-responsive"
        >
          <div className="px-4 sm:px-6 pt-2 sm:pt-4 pb-3.5 sm:pb-4 bg-gradient-to-r from-[#0F172A] via-[#1E40FF] to-[#0284C7] text-white shrink-0">
            <div className="sm:hidden dom-sheet-grabber !bg-white/40 !mt-0 !mb-2.5" />
            <div className="flex items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="w-5 h-5 text-cyan-300 shrink-0" />
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold leading-none truncate !text-white">
                  DOM META REPORT AI
                </h3>
                <p className="text-[10.5px] sm:text-[11px] text-cyan-100 mt-1 truncate">
                  Chẩn đoán chuyên sâu, So sánh chiến dịch &amp; Xuất báo cáo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {onOpenAiKeyModal && (
                <button
                  type="button"
                  data-testid="open-shared-ai-key-from-summary"
                  onClick={onOpenAiKeyModal}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-semibold cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                  <span className="sm:hidden">AI Key</span>
                  <span className="hidden sm:inline">
                    {aiConfig?.has_api_key ? 'AI Key Đã Kết Nối' : 'Thiết lập AI Key'}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            </div>
          </div>

          {/* Sub-Tabs: Result / Compare / History (Non-wrapping via DomResponsiveSubtabs) */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
            <DomResponsiveSubtabs
              variant="segmented"
              maxMobile={2}
              maxTablet={3}
              maxDesktop={3}
              value={tab}
              onChange={(id) => setTab(id as 'result' | 'compare' | 'history')}
              tabs={[
                {
                  id: 'result',
                  label: 'Báo cáo AI',
                  icon: <FileText className="w-3.5 h-3.5" />,
                },
                {
                  id: 'compare',
                  label: 'So sánh Chiến dịch',
                  shortLabel: 'So sánh',
                  testId: 'ai-tab-compare',
                  icon: <GitCompare className="w-3.5 h-3.5" />,
                },
                {
                  id: 'history',
                  label: `Lịch sử (${savedReports.length})`,
                  testId: 'ai-tab-history',
                  icon: <Clock className="w-3.5 h-3.5" />,
                },
              ]}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {/* Live Gemini AI Generator Bar (Shared CRM + Meta Key) */}
            {(tab === 'result' || tab === 'compare') && (
              <div className="rounded-2xl bg-gradient-to-r from-[#F4F8FF] via-white to-cyan-50/50 border border-blue-200/80 p-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    value={promptFocus}
                    onChange={(e) => setPromptFocus(e.target.value)}
                    placeholder="Nhập yêu cầu phân tích chuyên sâu cho Gemini AI (VD: tối ưu CPR tin nhắn, giờ vàng, khu vực)..."
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#1E40FF]"
                  />
                  <button
                    type="button"
                    data-testid="run-live-gemini-ai-btn"
                    disabled={liveAiBusy || (tab === 'compare' && selectedCompareCount < 2)}
                    onClick={() =>
                      void handleRunLiveGeminiWorkspace(tab === 'compare' ? 'compare' : 'workspace')
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold cursor-pointer shrink-0 shadow-sm"
                  >
                    {liveAiBusy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                    )}
                    <span>
                      {liveAiBusy
                        ? 'Gemini AI đang phân tích...'
                        : tab === 'compare'
                          ? 'So sánh chuyên sâu bằng Gemini AI'
                          : 'Phân tích chuyên sâu bằng Gemini AI'}
                    </span>
                  </button>
                </div>
                {aiConfig && aiConfig.ai_ads_eval_enabled === false && (
                  <div className="text-[11px] font-medium text-amber-700 flex items-center justify-between gap-2">
                    <span>
                      Công tắc &ldquo;Cho phép dùng AI đánh giá Quảng cáo&rdquo; đang tắt.
                    </span>
                    {onOpenAiKeyModal && (
                      <button
                        type="button"
                        onClick={onOpenAiKeyModal}
                        className="font-bold text-[#1E40FF] hover:underline cursor-pointer"
                      >
                        Bật ngay →
                      </button>
                    )}
                  </div>
                )}
                {liveAiError && (
                  <div className="text-xs text-rose-600 font-medium">{liveAiError}</div>
                )}
              </div>
            )}

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

          {/* Footer: Mobile strictly 2 controls (Copy + Overflow Menu) | Desktop full action bar */}
          <div className="px-4 sm:px-6 pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] sm:py-4 bg-slate-50 border-t border-slate-200 shrink-0">
            <div className="flex sm:hidden items-center gap-2 w-full">
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
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1E40FF] text-white text-xs font-semibold cursor-pointer dom-ios-press"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép báo cáo'}</span>
              </button>

              <DomOverflowMenu
                variant="pill"
                label="Xuất & Khác"
                items={[
                  ...(onSaveReports
                    ? [
                        {
                          id: 'save_hist',
                          label: savedNotice ? 'Đã lưu Lịch sử!' : 'Lưu vào Lịch sử Workspace',
                          icon: <Save className="w-3.5 h-3.5 text-emerald-600" />,
                          onClick: () =>
                            void handlePersistReport({
                              id: viewingHistoryItem?.id || `air_${Date.now()}`,
                              timestamp: new Date().toLocaleString('vi-VN'),
                              label: activeEntry.label,
                              brand: activeEntry.brand,
                              date_range: activeEntry.dateRange,
                              preview: activeEntry.preview,
                              html: activeEntry.html,
                              plain_text: activeEntry.plainText,
                            }),
                        },
                      ]
                    : []),
                  {
                    id: 'exp_doc',
                    label: 'Tải báo cáo Word (.DOC)',
                    icon: <Download className="w-3.5 h-3.5 text-[#1E40FF]" />,
                    onClick: () => handleDownloadExport('doc'),
                  },
                  {
                    id: 'exp_html',
                    label: 'Tải báo cáo Web (.HTML)',
                    icon: <FileCode2 className="w-3.5 h-3.5 text-[#1E40FF]" />,
                    onClick: () => handleDownloadExport('html'),
                  },
                  {
                    id: 'close',
                    label: 'Đóng cửa sổ AI',
                    icon: <X className="w-3.5 h-3.5" />,
                    onClick: onClose,
                  },
                ]}
              />
            </div>

            <div className="hidden sm:flex flex-wrap items-center justify-between gap-2.5">
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
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-0 sm:p-6 flex items-end sm:items-center justify-center dom-ios-backdrop"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[92dvh] sm:max-h-[88vh] bg-white rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 dom-ios-modal-responsive"
        >
          <div className="sm:hidden dom-sheet-grabber" />
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate">
                Từ Khóa: {campaignName}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">{dateRangeLabel}</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden">CSV</span>
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-2 bg-white border-b border-slate-200 grid grid-cols-2 sm:flex sm:gap-5">
            {[
              { id: 'keywords' as const, label: `Keywords (${keywords.length})` },
              { id: 'terms' as const, label: `Search Terms (${searchTerms.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`py-1.5 sm:pb-2 text-xs font-semibold border-b-2 text-center cursor-pointer ${
                  tab === t.id
                    ? 'border-[#1E40FF] text-[#1E40FF]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="dom-meta-table-scroll flex-1 overflow-auto p-4 sm:p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-5">
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
                <>
                  <div className="sm:hidden space-y-2.5">
                    {keywords.map((k, idx) => (
                      <div key={`m-${k.keyword}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1.5 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{k.keyword}</div>
                            <div className="text-[10.5px] text-slate-400 truncate">{k.adGroup}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[10px] uppercase text-slate-600 shrink-0">
                            {k.matchType}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/70">
                          <div>
                            <div className="text-[10px] text-slate-400">Clicks / CTR</div>
                            <div className="font-semibold text-slate-800 tabular-nums">{formatDomNumber(k.clicks)} ({k.ctr.toFixed(1)}%)</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Conv</div>
                            <div className="font-bold text-[#1E40FF] tabular-nums">{formatDomNumber(k.conversions)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400">Chi tiêu</div>
                            <div className="font-bold text-slate-900 tabular-nums">{formatDomMoney(k.spent, 'VND')}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden sm:block">
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
                  </div>
                </>
              )
            ) : searchTerms.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Chưa ghi nhận Search Terms chi tiết trong khoảng thời gian này.
              </div>
            ) : (
              <>
                <div className="sm:hidden space-y-2.5">
                  {searchTerms.map((s, idx) => (
                    <div key={`ms-${s.searchTerm}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-slate-900 min-w-0 truncate">{s.searchTerm}</div>
                        <span className="text-[10.5px] font-semibold text-slate-500 shrink-0">{s.status}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/70">
                        <div>
                          <div className="text-[10px] text-slate-400">Clicks</div>
                          <div className="font-semibold text-slate-800 tabular-nums">{formatDomNumber(s.clicks)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">CPC</div>
                          <div className="font-semibold text-slate-800 tabular-nums">{formatDomMoney(s.cpc, 'VND')}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Chi tiêu</div>
                          <div className="font-bold text-slate-900 tabular-nums">{formatDomMoney(s.spent, 'VND')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block">
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
                </div>
              </>
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
  id?: string;
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
  authContext?: DomMetaAuthContext;
  onPublicViewChanged?: (nextPublicView: boolean) => void;
  onClose: () => void;
}

function mapServerRoleToUi(role: string, isOwner?: boolean): 'admin' | 'viewer' {
  const r = String(role || '').toLowerCase();
  if (isOwner || r === 'tenant_admin' || r === 'admin' || r === 'owner') return 'admin';
  return 'viewer';
}

function writeLocalShareAcl(
  storageKey: string,
  nextPublic: boolean,
  nextMembers: ShareMemberEntry[]
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ publicView: nextPublic, members: nextMembers })
    );
  } catch {
    // ignore storage quota
  }
}

export const ShareAccessModal: React.FC<ShareAccessModalProps> = ({
  open,
  shareUrl,
  tenantSlug,
  currentUserName,
  canManageConfig = true,
  authContext,
  onPublicViewChanged,
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
  const [loadingShare, setLoadingShare] = useState(false);
  const [savingShare, setSavingShare] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const authCtxRef = React.useRef(authContext);
  useEffect(() => {
    authCtxRef.current = authContext;
  }, [authContext]);

  const persistAclLocal = (nextPublic: boolean, nextMembers: ShareMemberEntry[]) =>
    writeLocalShareAcl(storageKey, nextPublic, nextMembers);

  useEffect(() => {
    const activeCtx = authCtxRef.current;
    if (!open || !activeCtx?.accessToken) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoadingShare(true);
      setShareError(null);
      try {
        const remote = await fetchDomMetaShareConfig(activeCtx);
        if (cancelled) return;
        const mappedMembers: ShareMemberEntry[] = remote.members.map((m) => ({
          id: m.id,
          email: m.email,
          name: m.full_name,
          role: mapServerRoleToUi(m.role, m.is_tenant_owner),
          isOwner: Boolean(m.is_tenant_owner),
        }));
        setPublicView(Boolean(remote.public_view));
        if (mappedMembers.length > 0) {
          setMembers(mappedMembers);
        }
        writeLocalShareAcl(storageKey, Boolean(remote.public_view), mappedMembers);
      } catch (err) {
        if (!cancelled) {
          setShareError(getErrText(err, 'Không thể tải danh sách chia sẻ.'));
        }
      } finally {
        if (!cancelled) setLoadingShare(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, authContext?.accessToken, storageKey]);

  if (!open) return null;

  const applyRemoteShare = (remote: Awaited<ReturnType<typeof saveDomMetaShareConfig>>) => {
    const mappedMembers: ShareMemberEntry[] = remote.members.map((m) => ({
      id: m.id,
      email: m.email,
      name: m.full_name,
      role: mapServerRoleToUi(m.role, m.is_tenant_owner),
      isOwner: Boolean(m.is_tenant_owner),
    }));
    setPublicView(Boolean(remote.public_view));
    setMembers(mappedMembers);
    persistAclLocal(Boolean(remote.public_view), mappedMembers);
    onPublicViewChanged?.(Boolean(remote.public_view));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleTogglePublicView = async () => {
    if (!canManageConfig || savingShare) return;
    const next = !publicView;
    setShareError(null);
    if (authContext?.accessToken) {
      setSavingShare(true);
      try {
        const res = await saveDomMetaShareConfig(authContext, { public_view: next });
        applyRemoteShare(res);
      } catch (err) {
        setShareError(getErrText(err, 'Không thể cập nhật chế độ công khai.'));
      } finally {
        setSavingShare(false);
      }
    } else {
      setPublicView(next);
      persistAclLocal(next, members);
      onPublicViewChanged?.(next);
    }
  };

  const handleAddMember = async () => {
    if (!canManageConfig || savingShare) return;
    const clean = newEmail.trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setShareError('Vui lòng nhập đúng định dạng email (ví dụ ten@gmail.com).');
      return;
    }
    setShareError(null);
    if (authContext?.accessToken) {
      setSavingShare(true);
      try {
        const res = await saveDomMetaShareConfig(authContext, {
          invite: {
            email: clean,
            role: newRole === 'admin' ? 'tenant_admin' : 'viewer',
          },
        });
        applyRemoteShare(res);
        setNewEmail('');
      } catch (err) {
        setShareError(getErrText(err, 'Không thể thêm thành viên.'));
      } finally {
        setSavingShare(false);
      }
    } else {
      const exists = members.some((m) => m.email.toLowerCase() === clean);
      const nextMembers = exists
        ? members.map((m) => (m.email.toLowerCase() === clean ? { ...m, role: newRole } : m))
        : [...members, { email: clean, name: clean.split('@')[0], role: newRole }];
      setMembers(nextMembers);
      persistAclLocal(publicView, nextMembers);
      setNewEmail('');
    }
  };

  const handleRoleChange = async (member: ShareMemberEntry, role: 'admin' | 'viewer') => {
    if (!canManageConfig || savingShare || member.isOwner) return;
    setShareError(null);
    if (authContext?.accessToken) {
      setSavingShare(true);
      try {
        const res = await saveDomMetaShareConfig(authContext, {
          update_member: {
            user_id: member.id,
            email: member.email,
            role: role === 'admin' ? 'tenant_admin' : 'viewer',
          },
        });
        applyRemoteShare(res);
      } catch (err) {
        setShareError(getErrText(err, 'Không thể đổi vai trò thành viên.'));
      } finally {
        setSavingShare(false);
      }
    } else {
      const nextMembers = members.map((m) => (m.email === member.email ? { ...m, role } : m));
      setMembers(nextMembers);
      persistAclLocal(publicView, nextMembers);
    }
  };

  const handleRemoveMember = async (member: ShareMemberEntry) => {
    if (!canManageConfig || savingShare || member.isOwner) return;
    setShareError(null);
    if (authContext?.accessToken) {
      setSavingShare(true);
      try {
        const res = await saveDomMetaShareConfig(authContext, {
          remove_user_id: member.id,
          remove_email: member.email,
        });
        applyRemoteShare(res);
      } catch (err) {
        setShareError(getErrText(err, 'Không thể gỡ quyền truy cập thành viên.'));
      } finally {
        setSavingShare(false);
      }
    } else {
      const nextMembers = members.filter((m) => m.email !== member.email || m.isOwner);
      setMembers(nextMembers);
      persistAclLocal(publicView, nextMembers);
    }
  };

  return (
    <DomMetaModalPortal>
      <div
        data-testid="share-access-modal"
        style={{ zIndex: DOM_META_MODAL_BASE_Z }}
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-0 sm:p-6 flex items-end sm:items-center justify-center dom-ios-backdrop"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-t-[26px] sm:rounded-3xl w-full max-w-xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200/90 dom-ios-modal-responsive"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sm:hidden dom-sheet-grabber" />
          {/* Header */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white flex items-center justify-center shadow-sm shrink-0">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Chia Sẻ Báo Cáo
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                  Quản lý quyền truy cập, chế độ xem &amp; liên kết chia sẻ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Copy Share Link Bar */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-600 outline-none"
            />
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
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
              disabled={!canManageConfig || savingShare}
              onClick={() => void handleTogglePublicView()}
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 space-y-4">
            {shareError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                {shareError}
              </div>
            )}

            {canManageConfig && (
              <div className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>Thêm thành viên &amp; phân quyền</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    disabled={savingShare}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleAddMember();
                    }}
                    placeholder="email@domain.com"
                    className="w-full sm:flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#1E40FF] disabled:opacity-60"
                  />
                  <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
                    <DomMetaSelect
                      ariaLabel="Chọn vai trò thành viên mới"
                      value={newRole}
                      disabled={savingShare}
                      variant="rounded"
                      onChange={(v) => setNewRole(v as 'viewer' | 'admin')}
                      options={[
                        { value: 'viewer', label: 'Viewer' },
                        { value: 'admin', label: 'Admin' },
                      ]}
                      className="bg-white w-full sm:w-auto"
                    />
                    <button
                      type="button"
                      disabled={savingShare}
                      onClick={() => void handleAddMember()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                    >
                      {savingShare && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Thêm</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <span>Thành viên có quyền truy cập ({members.length})</span>
                {loadingShare && (
                  <span className="inline-flex items-center gap-1 text-[#1E40FF] normal-case">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Đang tải...
                  </span>
                )}
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
                        disabled={m.isOwner || !canManageConfig || savingShare}
                        value={m.role}
                        variant="compact"
                        align="right"
                        onChange={(v) => void handleRoleChange(m, v as 'admin' | 'viewer')}
                        options={[
                          { value: 'admin', label: 'Admin' },
                          { value: 'viewer', label: 'Viewer' },
                        ]}
                      />
                      {!m.isOwner && canManageConfig && (
                        <button
                          type="button"
                          disabled={savingShare}
                          onClick={() => void handleRemoveMember(m)}
                          className="w-11 h-11 sm:w-8 sm:h-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer disabled:opacity-50"
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

interface CrmUpgradePlanItem {
  code: string;
  name: string;
  tagline: string;
  badge?: string;
  plan_tier: 'starter' | 'growth' | 'enterprise';
  monthly_price_vnd: number;
  annual_discount_pct: number;
  annual_total_vnd: number;
  annual_monthly_equivalent_vnd: number;
  annual_saved_vnd: number;
  max_users: number;
  max_rounds: number;
  monthly_lead_quota: number;
  is_enterprise_upgrade?: boolean;
  features: string[];
}

interface CrmUpgradeTopupItem {
  id: string;
  label: string;
  amount_vnd: number;
  bonus_vnd: number;
  equivalent_months_note: string;
  highlight?: boolean;
}

interface CrmUpgradeBankInfo {
  bank_name: string;
  account_number: string;
  account_holder: string;
  transfer_prefix: string;
}

interface CrmUpgradeSubscriptionInfo {
  plan_code?: string;
  plan_name?: string;
  plan_tier?: string;
  is_in_trial?: boolean;
  trial_duration_days?: number;
  days_remaining?: number;
  is_expired?: boolean;
  wallet_balance_vnd?: number;
}

const FALLBACK_CRM_PLANS: CrmUpgradePlanItem[] = [
  {
    code: 'autodata_standard',
    name: 'Auto Data Standard',
    tagline: 'Gói tiêu chuẩn sau 1 tháng dùng thử 0₫ chung toàn hệ thống.',
    badge: 'Mặc Định • Phổ Biến Nhất',
    plan_tier: 'starter',
    monthly_price_vnd: 1_500_000,
    annual_discount_pct: 15,
    annual_total_vnd: 15_300_000,
    annual_monthly_equivalent_vnd: 1_275_000,
    annual_saved_vnd: 2_700_000,
    max_users: 25,
    max_rounds: 5,
    monthly_lead_quota: 15_000,
    features: [
      'Tự động chia vòng Auto Data Router tức thì (Round-Robin / Trọng số)',
      'Track Lead chi tiết theo từng Ad & Pipeline CRM 8 bước tinh gọn',
      'Bắn thông báo ZaloBot / Telegram & đồng bộ ngược Meta CAPI v21.0',
      'Quản lý tới 25 nhân sự (20 Sale + 5 Quản lý) & 5 vòng chia song song',
    ],
  },
  {
    code: 'autodata_growth',
    name: 'Auto Data Scale Pro',
    tagline: 'Mở rộng đa phòng ban, đa chi nhánh & Dual-Send Meta CAPI nâng cao.',
    badge: 'Đội Sale Quy Mô Lớn',
    plan_tier: 'growth',
    monthly_price_vnd: 3_000_000,
    annual_discount_pct: 15,
    annual_total_vnd: 30_600_000,
    annual_monthly_equivalent_vnd: 2_550_000,
    annual_saved_vnd: 5_400_000,
    max_users: 100,
    max_rounds: 30,
    monthly_lead_quota: 100_000,
    features: [
      'Toàn bộ tính năng gói Standard + Đa phễu Pipeline độc lập theo dự án',
      'Định tuyến nâng cao theo Chiến dịch, Khu vực, Khung giờ & Ca trực',
      'Dual-Send Meta CAPI 2 Dataset + SLA Auto-Recall tự thu hồi số trễ',
      'Quản lý tới 100 nhân sự / Đại lý F1 & 100.000 Leads / tháng',
    ],
  },
  {
    code: 'domation_crm_erp',
    name: 'DOMATION CRM 360° & ERP 5.0',
    tagline: 'Nâng cấp liền mạch lên Hệ sinh thái Quản trị Toàn diện + DOM Agent.',
    badge: 'Hệ Sinh Thái Enterprise',
    plan_tier: 'enterprise',
    monthly_price_vnd: 6_000_000,
    annual_discount_pct: 15,
    annual_total_vnd: 61_200_000,
    annual_monthly_equivalent_vnd: 5_100_000,
    annual_saved_vnd: 10_800_000,
    max_users: 9_999,
    max_rounds: 999,
    monthly_lead_quota: 1_000_000,
    is_enterprise_upgrade: true,
    features: [
      'Giữ nguyên 100% dữ liệu Lead, lịch sử Timeline & cấu hình hiện có',
      'Marketing Automation đa kênh, Email/Form/Flow & CRM 360° Hợp đồng số',
      'ERP 5.0 Toàn diện: Nhân sự, Chấm công GPS, Lương KPI, Tài chính, Kho vận',
      'Hội đồng trợ lý AI điều hành DOM Agent & triển khai Private Cloud',
    ],
  },
];

const FALLBACK_CRM_TOPUPS: CrmUpgradeTopupItem[] = [
  {
    id: 'topup_1m',
    label: 'Topup 1 Tháng',
    amount_vnd: 1_500_000,
    bonus_vnd: 0,
    equivalent_months_note: 'Đủ gia hạn ngay 1 tháng gói Auto Data Standard',
  },
  {
    id: 'topup_3m',
    label: 'Topup 3 Tháng',
    amount_vnd: 4_500_000,
    bonus_vnd: 0,
    equivalent_months_note: 'Đủ gia hạn 1 quý (3 tháng) liên tục',
  },
  {
    id: 'topup_6m',
    label: 'Topup 6 Tháng (+5% Bonus)',
    amount_vnd: 9_000_000,
    bonus_vnd: 450_000,
    equivalent_months_note: 'Tặng thêm +450.000₫ (= 9.450.000₫ vào ví gia hạn)',
  },
  {
    id: 'topup_12m',
    label: 'Topup Năm (Tiết kiệm 15%)',
    amount_vnd: 15_300_000,
    bonus_vnd: 0,
    equivalent_months_note: 'Đủ mua gói Năm (-15%), chỉ 1.275.000₫/tháng',
    highlight: true,
  },
];

const FALLBACK_BANK_INFO: CrmUpgradeBankInfo = {
  bank_name: 'Techcombank (TCB)',
  account_number: '19038889996868',
  account_holder: 'CONG TY GIAI PHAP CONG NGHE DOMATION',
  transfer_prefix: 'DOMDATA',
};

export interface CrmUpgradeShowcaseModalProps {
  open: boolean;
  tenantSlug?: string;
  companyName?: string;
  authContext?: DomMetaAuthContext;
  onRequestAuth?: () => void;
  onClose: () => void;
}

export const CrmUpgradeShowcaseModal: React.FC<CrmUpgradeShowcaseModalProps> = ({
  open,
  tenantSlug = '',
  companyName = '',
  authContext,
  onRequestAuth,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pricing'>('overview');
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [plans, setPlans] = useState<CrmUpgradePlanItem[]>(FALLBACK_CRM_PLANS);
  const [topups, setTopups] = useState<CrmUpgradeTopupItem[]>(FALLBACK_CRM_TOPUPS);
  const [bankInfo, setBankInfo] = useState<CrmUpgradeBankInfo>(FALLBACK_BANK_INFO);
  const [subscription, setSubscription] = useState<CrmUpgradeSubscriptionInfo | null>(null);
  const [trialDaysDefault, setTrialDaysDefault] = useState<number>(30);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pendingTopupOrder, setPendingTopupOrder] = useState<{
    reference_code: string;
    amount_vnd: number;
    label: string;
    qr_url?: string;
  } | null>(null);
  const [supportPhone, setSupportPhone] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

  const apiBase = useMemo(() => {
    const raw = (authContext?.apiBaseUrl || '').trim().replace(/\/+$/, '');
    if (raw) return raw;
    if (typeof window !== 'undefined' && window.location.hostname === 'meta.domation.net') {
      return 'https://data.domation.net';
    }
    return '';
  }, [authContext?.apiBaseUrl]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoadingBilling(true);
      try {
        const endpoint = authContext?.accessToken
          ? `${apiBase}/api/v1/billing/overview`
          : `${apiBase}/api/v1/billing/catalog`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authContext?.accessToken) {
          headers.Authorization = `Bearer ${authContext.accessToken}`;
        }
        if (tenantSlug) {
          headers['X-Tenant-Slug'] = tenantSlug;
        }
        const res = await fetch(endpoint, { method: 'GET', headers });
        const json = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          data?: {
            subscription?: CrmUpgradeSubscriptionInfo;
            catalog?: {
              trial_duration_days?: number;
              plans?: CrmUpgradePlanItem[];
              topup_packages?: CrmUpgradeTopupItem[];
              payment_bank_info?: CrmUpgradeBankInfo;
            };
            trial_duration_days?: number;
            plans?: CrmUpgradePlanItem[];
            topup_packages?: CrmUpgradeTopupItem[];
            payment_bank_info?: CrmUpgradeBankInfo;
          };
        };
        if (cancelled || !res.ok || !json?.data) return;
        const cat = json.data.catalog || json.data;
        if (Array.isArray(cat.plans) && cat.plans.length > 0) setPlans(cat.plans);
        if (Array.isArray(cat.topup_packages) && cat.topup_packages.length > 0) {
          setTopups(cat.topup_packages);
        }
        if (cat.payment_bank_info?.account_number) {
          setBankInfo(cat.payment_bank_info);
        }
        if (typeof cat.trial_duration_days === 'number' && cat.trial_duration_days > 0) {
          setTrialDaysDefault(cat.trial_duration_days);
        }
        if (json.data.subscription) {
          setSubscription(json.data.subscription);
        }
      } catch {
        // Fallback to built-in catalog silently
      } finally {
        if (!cancelled) setLoadingBilling(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, authContext?.accessToken, apiBase, tenantSlug]);

  if (!open) return null;

  const crmWorkspaceUrl = tenantSlug
    ? `https://data.domation.net/${encodeURIComponent(tenantSlug)}`
    : 'https://data.domation.net';

  const handleCreateTopup = async (pkg: CrmUpgradeTopupItem) => {
    if (!authContext?.accessToken) {
      onClose();
      onRequestAuth?.();
      return;
    }
    setBusyAction(pkg.id);
    setNotice(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/billing/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authContext.accessToken}`,
          ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
        },
        body: JSON.stringify({ package_id: pkg.id }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        error?: { message?: string };
        data?: {
          transaction?: { reference_code?: string; amount_vnd?: number };
          payment_bank_info?: CrmUpgradeBankInfo;
          gateway_session?: { qr_url?: string; checkout_url?: string };
        };
      };
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || json?.message || 'Không thể tạo lệnh nạp ví Topup.');
      }
      const nextBank = json.data?.payment_bank_info?.account_number
        ? json.data.payment_bank_info
        : bankInfo;
      if (json.data?.payment_bank_info?.account_number) {
        setBankInfo(json.data.payment_bank_info);
      }
      const refCode =
        json.data?.transaction?.reference_code ||
        `${nextBank.transfer_prefix}-TOPUP-${(tenantSlug || 'DOM').toUpperCase()}`;
      const amtVnd = Number(json.data?.transaction?.amount_vnd || pkg.amount_vnd);
      const qrUrl =
        json.data?.gateway_session?.qr_url ||
        `https://img.vietqr.io/image/970407-${encodeURIComponent(nextBank.account_number)}-compact2.png?amount=${amtVnd}&addInfo=${encodeURIComponent(refCode)}&accountName=${encodeURIComponent(nextBank.account_holder)}`;
      setPendingTopupOrder({
        reference_code: refCode,
        amount_vnd: amtVnd,
        label: pkg.label,
        qr_url: qrUrl,
      });
      setNotice({
        type: 'ok',
        text: `Đã tạo mã nạp ví ${refCode}. Chuyển khoản đúng nội dung để cộng tiền tự động vào ví chung!`,
      });
    } catch (err) {
      setNotice({
        type: 'err',
        text: getErrText(err, 'Không thể tạo lệnh nạp ví Topup.'),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleSubscribePlan = async (plan: CrmUpgradePlanItem) => {
    if (!authContext?.accessToken) {
      onClose();
      onRequestAuth?.();
      return;
    }
    setBusyAction(plan.code);
    setNotice(null);
    try {
      const walletBal = Number(subscription?.wallet_balance_vnd || 0);
      const needed =
        billingCycle === 'annual' ? plan.annual_total_vnd : plan.monthly_price_vnd;
      const method = walletBal >= needed ? 'wallet' : 'bank_transfer';
      const res = await fetch(`${apiBase}/api/v1/billing/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authContext.accessToken}`,
          ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
        },
        body: JSON.stringify({
          plan_code: plan.code,
          billing_cycle: billingCycle,
          payment_method: method,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        error?: { message?: string };
        data?: {
          requires_payment?: boolean;
          subscription?: CrmUpgradeSubscriptionInfo;
          transaction?: { reference_code?: string; amount_vnd?: number };
          gateway_session?: { qr_url?: string };
        };
      };
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || json?.message || 'Không thể đăng ký gói cước.');
      }
      if (json.data?.subscription) {
        setSubscription(json.data.subscription);
      }
      if (method === 'wallet' && !json.data?.requires_payment) {
        setNotice({
          type: 'ok',
          text: `Đã kích hoạt gói ${plan.name} thành công từ số dư Ví dùng chung!`,
        });
      } else {
        const ref = json.data?.transaction?.reference_code || `${bankInfo.transfer_prefix}-${plan.code.toUpperCase()}`;
        const amt = Number(json.data?.transaction?.amount_vnd || needed);
        const qrUrl =
          json.data?.gateway_session?.qr_url ||
          `https://img.vietqr.io/image/970407-${encodeURIComponent(bankInfo.account_number)}-compact2.png?amount=${amt}&addInfo=${encodeURIComponent(ref)}&accountName=${encodeURIComponent(bankInfo.account_holder)}`;
        setPendingTopupOrder({
          reference_code: ref,
          amount_vnd: amt,
          label: `${plan.name} (${billingCycle === 'annual' ? '12 tháng -15%' : '1 tháng'})`,
          qr_url: qrUrl,
        });
        setNotice({
          type: 'ok',
          text: `Đã tạo yêu cầu nâng cấp ${plan.name} (Mã: ${ref}). Chuyển khoản hoặc liên hệ đội ngũ hỗ trợ để kích hoạt ngay!`,
        });
      }
    } catch (err) {
      setNotice({
        type: 'err',
        text: getErrText(err, 'Không thể xử lý nâng cấp gói.'),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleQuickUpgradeSupport = async () => {
    if (!authContext?.accessToken) {
      window.open('https://domation.net/lien-he', '_blank', 'noopener,noreferrer');
      return;
    }
    setBusyAction('quick_support');
    setNotice(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/billing/upgrade-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authContext.accessToken}`,
          ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
        },
        body: JSON.stringify({
          target_suite: 'crm',
          billing_cycle: billingCycle,
          contact_phone: supportPhone.trim() || undefined,
          note: `Yêu cầu hỗ trợ setup & nâng cấp nhanh CRM AutoData từ Meta Report (${companyName || tenantSlug})`,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        error?: { message?: string };
      };
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || json?.message || 'Không thể gửi yêu cầu hỗ trợ.');
      }
      setNotice({
        type: 'ok',
        text: 'Đã gửi yêu cầu Hỗ trợ Nâng cấp & Setup 1-1! Chuyên gia DOMATION sẽ liên hệ hỗ trợ cấu hình ngay.',
      });
      setSupportPhone('');
    } catch (err) {
      setNotice({
        type: 'err',
        text: getErrText(err, 'Không thể gửi yêu cầu hỗ trợ nâng cấp.'),
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <DomMetaModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        data-testid="crm-upgrade-showcase-modal"
        style={{ zIndex: DOM_META_MODAL_BASE_Z }}
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-0 sm:p-5 flex items-end sm:items-center justify-center dom-ios-backdrop"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[#F8FAFC] rounded-t-[26px] sm:rounded-3xl w-full max-w-5xl max-h-[93dvh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-[0_28px_80px_rgba(15,23,42,0.32)] border border-slate-200/90 text-slate-800 dom-ios-modal-responsive"
        >
          <div className="sm:hidden bg-white pt-1">
            <div className="dom-sheet-grabber" />
          </div>
          {/* Modal Header */}
          <div className="px-4 sm:px-7 py-3.5 sm:py-4 bg-white border-b border-slate-200/90 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
            <div className="flex items-center justify-between gap-2.5 min-w-0 flex-1">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#1E40FF] via-[#1B4DFF] to-[#06B6D4] text-white flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(30,64,255,0.5)] shrink-0">
                  <Rocket className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm sm:text-lg font-extrabold text-slate-900 truncate">
                      Nâng cấp DOMATION CRM &amp; Auto Chia Data
                    </h3>
                    <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                      <Sparkles className="w-3 h-3" />
                      <span>
                        {subscription?.is_in_trial
                          ? `Đang dùng thử chung · Còn ${subscription.days_remaining ?? trialDaysDefault} ngày 0₫`
                          : `Dùng thử miễn phí 1 tháng (${trialDaysDefault} ngày) dùng chung`}
                      </span>
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1">
                    Khép kín từ từng mẫu Ad → Chia số cho Sale trong 1s → Pipeline CRM &amp; Meta CAPI
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="sm:hidden w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <div className="grid grid-cols-2 sm:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
                <button
                  type="button"
                  data-testid="crm-upgrade-tab-overview"
                  onClick={() => setActiveTab('overview')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer text-center truncate ${
                    activeTab === 'overview'
                      ? 'bg-white text-[#1E40FF] font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tính năng &amp; 4 Bước
                </button>
                <button
                  type="button"
                  data-testid="crm-upgrade-tab-pricing"
                  onClick={() => setActiveTab('pricing')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer text-center truncate ${
                    activeTab === 'pricing'
                      ? 'bg-white text-[#1E40FF] font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bảng Giá &amp; Topup
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="hidden sm:flex w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 items-center justify-center text-slate-600 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4 sm:p-7 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-7 space-y-4 sm:space-y-5">
            {notice && (
              <div
                className={`rounded-2xl border px-4 py-3 text-xs font-semibold flex items-center justify-between gap-3 ${
                  notice.type === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                <span>{notice.text}</span>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {activeTab === 'overview' ? (
              <>
                {/* Visual Light Product Showcase with Real UI Captures */}
                <div className="rounded-2xl bg-gradient-to-br from-[#F4F8FF] via-white to-sky-50/75 border border-blue-200/80 p-4 sm:p-5 shadow-xs space-y-3.5 text-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1E40FF]">
                      <Zap className="w-4 h-4 shrink-0" />
                      <span>Luồng khép kín: Theo dõi từng Ad → Chia Sale 1s → Chốt đơn CAPI</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-white border border-blue-200/80 text-[11px] font-semibold text-slate-600">
                      Đồng bộ Realtime · {tenantSlug ? `/${tenantSlug}` : 'DOMATION'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                    {[
                      {
                        step: '1. Track Lead theo từng Ad',
                        badge: 'CAPI 200 OK',
                        img: '/imgs/autodata/showcase/screen_ads.jpg',
                        caption: 'Biết chính xác mẫu Ad nào ra khách thật, tự bắn sự kiện chất lượng về Meta.',
                      },
                      {
                        step: '2. Auto Chia Data Công Bằng',
                        badge: 'SLA < 1 giây',
                        img: '/imgs/autodata/showcase/screen_fairshare.jpg',
                        caption: 'Chia vòng tự động qua Zalo/Telegram, tự thu hồi & bù số khi báo sai.',
                      },
                      {
                        step: '3. Pipeline CRM & Chốt Đơn',
                        badge: 'Web & Mobile',
                        img: '/imgs/autodata/showcase/screen_dashboard.jpg',
                        caption: 'Sale cập nhật trạng thái trên điện thoại, báo cáo ROAS tức thì theo từng Ad.',
                      },
                    ].map((card) => (
                      <div
                        key={card.step}
                        className="rounded-2xl bg-white border border-slate-200/85 overflow-hidden shadow-xs flex flex-col justify-between"
                      >
                        <div className="relative aspect-[16/10] bg-slate-100 border-b border-slate-100 overflow-hidden">
                          <img
                            src={card.img}
                            alt={card.step}
                            className="w-full h-full object-cover object-top"
                            loading="lazy"
                          />
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/95 border border-emerald-200 text-emerald-700 text-[10px] font-bold shadow-xs">
                            {card.badge}
                          </span>
                        </div>
                        <div className="p-3.5 space-y-1">
                          <div className="text-xs font-extrabold text-[#1E40FF]">{card.step}</div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{card.caption}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4 Actionable Quick-Start Steps */}
                <div className="rounded-2xl bg-white border border-slate-200/85 p-4 sm:p-5 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        4 Bước Kích Hoạt Ngay Trong 5 Phút
                      </h4>
                      <p className="text-xs text-slate-500">
                        Dùng chung tài khoản &amp; 30 ngày miễn phí với DOM Meta Report
                      </p>
                    </div>
                    <a
                      href={crmWorkspaceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="crm-upgrade-open-workspace-btn"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-xs font-bold shadow-sm cursor-pointer"
                    >
                      <span>Mở CRM AutoData Ngay (30 ngày 0₫)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {[
                      { step: 'Bước 01', title: 'Mở Workspace CRM', desc: 'Đăng nhập data.domation.net bằng tài khoản hiện tại.' },
                      { step: 'Bước 02', title: 'Gắn Nguồn Lead', desc: 'Kết nối Meta Lead Form, Web/Ladipage hoặc Google Sheets.' },
                      { step: 'Bước 03', title: 'Tạo Vòng Chia Sale', desc: 'Thêm nhân sự và bật nhận lead tự động qua Zalo/Telegram.' },
                      { step: 'Bước 04', title: 'Chốt & Bắn CAPI', desc: 'Sale đổi trạng thái -> ROAS & Lead hiện ngay trên Meta Report.' },
                    ].map((s) => (
                      <div
                        key={s.step}
                        className="rounded-xl bg-[#F8FAFC] border border-slate-200/75 p-3 space-y-1"
                      >
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-[#1E40FF] text-[10px] font-bold">
                          {s.step}
                        </span>
                        <div className="text-xs font-bold text-slate-900">{s.title}</div>
                        <p className="text-[11px] text-slate-500 leading-snug">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Compact Trial + Wallet Summary Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-[#F4F8FF] border border-blue-200/80 p-3.5 flex flex-col justify-between">
                    <div className="text-[11px] font-bold text-[#1E40FF]">Miễn Phí Dùng Thử Chung</div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">
                      {trialDaysDefault} ngày · 0₫
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Dùng chung Meta Report &amp; Auto Data CRM
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                      <span>Ví Topup Workspace</span>
                      <Wallet className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-lg font-extrabold text-emerald-600 tabular-nums mt-0.5">
                      {formatDomMoney(Number(subscription?.wallet_balance_vnd || 0), 'VND')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {loadingBilling ? 'Đang đồng bộ ví...' : 'Tự cấn trừ khi gia hạn gói'}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                      <span>Chu kỳ thanh toán</span>
                      <CreditCard className="w-4 h-4 text-[#1E40FF]" />
                    </div>
                    <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold mt-1">
                      <button
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                          billingCycle === 'monthly'
                            ? 'bg-white text-[#1E40FF] font-bold shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Tháng
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle('annual')}
                        className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                          billingCycle === 'annual'
                            ? 'bg-white text-[#1E40FF] font-bold shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Năm (-15%)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Focused 3 SaaS Package Cards (Concise & Light UI) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
                  {plans.slice(0, 3).map((p) => {
                    const priceShown =
                      billingCycle === 'annual'
                        ? p.annual_monthly_equivalent_vnd
                        : p.monthly_price_vnd;
                    const isPopular = p.plan_tier === 'starter';
                    return (
                      <div
                        key={p.code}
                        className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 bg-white ${
                          isPopular
                            ? 'border-[#1E40FF] ring-2 ring-[#1E40FF]/12 shadow-sm'
                            : 'border-slate-200/90'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPopular
                                  ? 'bg-blue-50 text-[#1E40FF]'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isPopular ? 'Phổ biến nhất' : p.badge || p.plan_tier.toUpperCase()}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              ≤ {formatDomNumber(p.max_users)} nhân sự
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm sm:text-[15px] font-extrabold text-slate-900">{p.name}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {p.tagline}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-extrabold text-[#1E40FF] tabular-nums">
                                {formatDomMoney(priceShown, 'VND')}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">/ tháng</span>
                            </div>
                            <div className="text-[11px] text-emerald-700 font-medium mt-0.5 tabular-nums">
                              {billingCycle === 'annual'
                                ? `Năm: ${formatDomMoney(p.annual_total_vnd, 'VND')}`
                                : `Quota ${formatDomNumber(p.monthly_lead_quota)} leads/tháng`}
                            </div>
                          </div>

                          <ul className="space-y-1.5 pt-1 text-[11.5px] text-slate-600">
                            {p.features.slice(0, 3).map((f) => (
                              <li key={f} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="leading-snug line-clamp-2">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          disabled={busyAction === p.code}
                          onClick={() => void handleSubscribePlan(p)}
                          className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                            isPopular
                              ? 'bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white shadow-xs'
                              : 'bg-blue-50 hover:bg-[#1E40FF] text-[#1E40FF] hover:text-white border border-blue-200/80'
                          } disabled:opacity-60`}
                        >
                          {busyAction === p.code && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>
                            {authContext?.accessToken ? 'Chọn gói này' : 'Dùng thử 30 ngày 0₫'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Compact Topup Bar (Max 3 clear tiers) */}
                <div className="rounded-2xl bg-white border border-slate-200/85 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Nạp Ví Topup Gia Hạn Nhanh
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Ưu đãi Bonus +5% hoặc Gói Năm -15%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {topups.slice(0, 3).map((tp) => (
                      <div
                        key={tp.id}
                        className={`rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-2 ${
                          tp.highlight
                            ? 'bg-[#F4F8FF] border-[#1E40FF]/50'
                            : 'bg-slate-50/75 border-slate-200/80'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 truncate">{tp.label}</span>
                            {tp.bonus_vnd > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9.5px] font-extrabold shrink-0">
                                +5%
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-extrabold text-[#1E40FF] tabular-nums">
                            {formatDomMoney(tp.amount_vnd, 'VND')}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={busyAction === tp.id}
                          onClick={() => void handleCreateTopup(tp)}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#1E40FF] text-[#1E40FF] hover:text-white border border-blue-200 text-[11px] font-bold transition cursor-pointer shrink-0 disabled:opacity-60"
                        >
                          {busyAction === tp.id ? '...' : '+ Nạp ví'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {pendingTopupOrder && (
                    <div className="rounded-2xl bg-[#F4F8FF] border border-blue-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 min-w-0">
                        {pendingTopupOrder.qr_url && (
                          <img
                            src={pendingTopupOrder.qr_url}
                            alt={`VietQR thanh toán ${pendingTopupOrder.reference_code}`}
                            className="w-28 h-28 rounded-xl border border-blue-200 bg-white object-contain p-1 shrink-0"
                          />
                        )}
                        <div className="space-y-1 min-w-0">
                          <div className="font-extrabold text-slate-900">
                            Chuyển khoản VietQR ({pendingTopupOrder.label})
                          </div>
                          <div className="text-slate-600">
                            Ngân hàng: <strong>{bankInfo.bank_name}</strong> · STK:{' '}
                            <strong className="font-mono text-slate-900">{bankInfo.account_number}</strong> · Chủ TK:{' '}
                            <strong>{bankInfo.account_holder}</strong>
                          </div>
                          <div className="text-slate-600">
                            Số tiền:{' '}
                            <strong className="text-[#1E40FF]">
                              {formatDomMoney(pendingTopupOrder.amount_vnd, 'VND')}
                            </strong>{' '}
                            · Nội dung:{' '}
                            <strong className="font-mono text-emerald-700 break-all">
                              {pendingTopupOrder.reference_code}
                            </strong>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard
                            ?.writeText(pendingTopupOrder.reference_code)
                            .catch(() => {});
                          setCopiedRef(true);
                          setTimeout(() => setCopiedRef(false), 1800);
                        }}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1E40FF] text-white font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedRef ? 'Đã chép mã' : 'Copy Nội Dung CK'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Slim Support Strip (Light UI) */}
            <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5 sm:px-5 sm:py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E40FF] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-[13px] font-extrabold text-slate-900 truncate">
                    Hỗ Trợ Setup Luồng Chia Số &amp; Meta CAPI 1-1 Miễn Phí
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Kỹ thuật DOMATION hỗ trợ nối Fanpage, Ladipage &amp; ZaloBot ngay trong ngày.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 w-full lg:w-auto">
                {authContext?.accessToken && (
                  <input
                    type="tel"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="SĐT Zalo nhận hỗ trợ..."
                    className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none focus:border-[#1E40FF]"
                  />
                )}
                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    data-testid="crm-upgrade-fast-support-btn"
                    disabled={busyAction === 'quick_support'}
                    onClick={() => void handleQuickUpgradeSupport()}
                    className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E40FF] border border-blue-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {busyAction === 'quick_support' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    ) : (
                      <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate">Hỗ Trợ Setup</span>
                  </button>
                  <a
                    href={crmWorkspaceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <span className="truncate">Vào CRM Ngay</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DomMetaModalPortal>
  );
};

/** Shared AI API Key & Dual Toggle Setup Modal (CRM Lead Evaluation + Meta Ads Analysis, both ON by default) */
const DomMetaAiKeyModalBody: React.FC<{
  authContext: DomMetaAuthContext;
  initialConfig?: DomMetaSharedAiConfig;
  canManageConfig?: boolean;
  onSaved?: (next: DomMetaSharedAiConfig) => void;
  onClose: () => void;
}> = ({
  authContext,
  initialConfig,
  canManageConfig = true,
  onSaved,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(() => Boolean(authContext.accessToken));
  const [saving, setSaving] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState<boolean>(() =>
    Boolean(initialConfig?.has_api_key)
  );
  const [maskedKey, setMaskedKey] = useState<string>(() => initialConfig?.api_key_masked || '');
  const [model, setModel] = useState<string>(() => initialConfig?.model || 'gemini-2.5-flash');
  // Both toggles strictly default to TRUE per user requirement
  const [leadEvalEnabled, setLeadEvalEnabled] = useState<boolean>(
    () => initialConfig?.ai_lead_eval_enabled !== false
  );
  const [adsEvalEnabled, setAdsEvalEnabled] = useState<boolean>(
    () => initialConfig?.ai_ads_eval_enabled !== false
  );
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!authContext.accessToken) return;
    let cancelled = false;
    fetchDomMetaAiConfig(authContext)
      .then((cfg) => {
        if (cancelled) return;
        setHasExistingKey(Boolean(cfg.has_api_key));
        setMaskedKey(cfg.api_key_masked || '');
        setModel(cfg.model || 'gemini-2.5-flash');
        setLeadEvalEnabled(cfg.ai_lead_eval_enabled !== false);
        setAdsEvalEnabled(cfg.ai_ads_eval_enabled !== false);
      })
      .catch(() => {
        // keep initialConfig values
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authContext.accessToken, authContext.tenantSlug, authContext.apiBaseUrl]);

  const handleSave = async (clearKey = false) => {
    setSaving(true);
    setFeedback(null);
    try {
      const trimmedKey = apiKeyInput.trim();
      const saved = await saveDomMetaAiConfig(authContext, {
        ...(clearKey
          ? { clear_api_key: true }
          : trimmedKey
            ? { api_key: trimmedKey }
            : {}),
        model: model.trim() || 'gemini-2.5-flash',
        ai_lead_eval_enabled: leadEvalEnabled,
        ai_ads_eval_enabled: adsEvalEnabled,
      });
      setHasExistingKey(Boolean(saved.has_api_key));
      setMaskedKey(saved.api_key_masked || '');
      setApiKeyInput('');
      onSaved?.(saved);
      setFeedback({
        type: 'ok',
        text: clearKey
          ? 'Đã xóa khóa AI API Key dùng chung.'
          : 'Đã lưu AI API Key & đồng bộ quyền đánh giá cho cả CRM và Meta Report!',
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'err',
        text: getErrText(err, 'Không thể lưu cấu hình AI API Key.'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DomMetaModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        data-testid="dom-meta-ai-key-modal"
        onClick={onClose}
        style={{ zIndex: DOM_META_MODAL_NESTED_Z }}
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm p-0 sm:p-6 flex items-end sm:items-center justify-center dom-ios-backdrop"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl max-h-[92dvh] sm:max-h-[88vh] bg-white rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 dom-ios-modal-responsive"
        >
          <div className="px-4 sm:px-6 pt-2 sm:pt-4 pb-3.5 sm:pb-4 bg-gradient-to-r from-[#0F172A] via-[#1E40FF] to-[#0284C7] text-white shrink-0">
            <div className="sm:hidden dom-sheet-grabber !bg-white/40 !mt-0 !mb-2.5" />
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <KeyRound className="w-5 h-5 text-cyan-300 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold leading-tight truncate !text-white">
                    Thiết Lập AI API Key Dùng Chung
                  </h3>
                  <p className="text-[10.5px] sm:text-[11px] text-cyan-100 mt-0.5 truncate">
                    Dùng chung tự động cho cả CRM AutoData &amp; Meta Report
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto overscroll-contain">
            <div className="rounded-2xl bg-emerald-50/75 border border-emerald-200/80 px-3.5 py-3 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Mã hóa AES-256-GCM đồng bộ 2 chiều:</strong> Khi bạn thiết lập khóa API tại
                đây hoặc trong CRM AutoData, cả hai nền tảng tự động dùng chung mà không cần nhập lại.
              </div>
            </div>

            {loading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#1E40FF]" />
                <span>Đang tải cấu hình AI dùng chung...</span>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Google Gemini API Key
                    </label>
                    <div className="flex items-center gap-2">
                      {hasExistingKey && maskedKey && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-[10.5px] font-mono font-bold">
                          Đã lưu: {maskedKey}
                        </span>
                      )}
                      {canManageConfig && hasExistingKey && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleSave(true)}
                          className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                        >
                          Xóa khóa
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="password"
                    data-testid="shared-ai-key-input"
                    disabled={!canManageConfig}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={
                      hasExistingKey
                        ? 'Để trống để giữ nguyên khóa, hoặc dán AIzaSy... mới'
                        : 'Dán Google Gemini API Key (AIzaSy...)'
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3.5 py-2.5 text-xs font-mono text-slate-800 outline-none focus:border-[#1E40FF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Mô hình AI phân tích
                  </label>
                  <DomMetaSelect
                    ariaLabel="Chọn mô hình AI phân tích"
                    value={model}
                    disabled={!canManageConfig}
                    variant="rounded"
                    onChange={(v) => setModel(v)}
                    className="w-full bg-slate-50"
                    options={[
                      {
                        value: 'gemini-2.5-flash',
                        label: 'Gemini 2.5 Flash (Khuyên dùng)',
                        description: 'Tốc độ cao & Phân tích sâu đa chiều',
                      },
                      {
                        value: 'gemini-2.5-pro',
                        label: 'Gemini 2.5 Pro',
                        description: 'Chuyên sâu chiến lược ngân sách lớn',
                      },
                      {
                        value: 'gemini-2.0-flash',
                        label: 'Gemini 2.0 Flash',
                        description: 'Phản hồi tức thì & Tiết kiệm quota',
                      },
                    ]}
                  />
                </div>

                {/* Dual Toggles — Both Default ON (true) */}
                <div className="space-y-2.5 pt-1">
                  <div className="text-xs font-bold text-slate-700">
                    Quyền sử dụng AI đánh giá (Mặc định bật cả 2)
                  </div>

                  <label className="rounded-2xl border border-slate-200 hover:border-blue-200 bg-slate-50/80 px-4 py-3 flex items-center justify-between gap-3 cursor-pointer">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-[13px] font-bold text-slate-800">
                        Cho phép dùng AI đánh giá Lead (CRM AutoData)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Tự động chấm điểm chất lượng Lead, sàng lọc số rác &amp; gợi ý kịch bản cho Sale
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={leadEvalEnabled}
                      data-testid="toggle-ai-lead-eval"
                      disabled={!canManageConfig}
                      onClick={() => setLeadEvalEnabled((v) => !v)}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                        leadEvalEnabled ? 'bg-[#1E40FF]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          leadEvalEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>

                  <label className="rounded-2xl border border-slate-200 hover:border-blue-200 bg-slate-50/80 px-4 py-3 flex items-center justify-between gap-3 cursor-pointer">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-[13px] font-bold text-slate-800">
                        Cho phép dùng AI đánh giá &amp; phân tích Quảng cáo (Meta Report)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Chẩn đoán chuyên sâu Result, Spend, CPR, Phễu hành vi, Khung giờ &amp; Creative
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={adsEvalEnabled}
                      data-testid="toggle-ai-ads-eval"
                      disabled={!canManageConfig}
                      onClick={() => setAdsEvalEnabled((v) => !v)}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                        adsEvalEnabled ? 'bg-[#1E40FF]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          adsEvalEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>
                </div>

                {feedback && (
                  <div
                    className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                      feedback.type === 'ok'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-700'
                    }`}
                  >
                    {feedback.text}
                  </div>
                )}
              </>
            )}
          </div>

          <div
            className={`px-4 sm:px-6 pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] sm:py-4 bg-slate-50 border-t border-slate-200 ${
              canManageConfig ? 'grid grid-cols-2 sm:flex' : 'flex'
            } items-center justify-end gap-2 shrink-0`}
          >
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer text-center"
            >
              Đóng
            </button>
            {canManageConfig && (
              <button
                type="button"
                data-testid="save-shared-ai-key-btn"
                disabled={saving}
                onClick={() => void handleSave(false)}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <Save className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="truncate">Lưu Thiết Lập AI</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </DomMetaModalPortal>
  );
};

export const DomMetaAiKeyModal: React.FC<{
  open: boolean;
  authContext: DomMetaAuthContext;
  initialConfig?: DomMetaSharedAiConfig;
  canManageConfig?: boolean;
  onSaved?: (next: DomMetaSharedAiConfig) => void;
  onClose: () => void;
}> = ({ open, ...rest }) => {
  if (!open) return null;
  return <DomMetaAiKeyModalBody {...rest} />;
};

const AiKeyInlineSettingsPanel: React.FC<{
  authContext: DomMetaAuthContext;
  initialConfig?: DomMetaSharedAiConfig;
  canManageConfig?: boolean;
  onSaved?: (next: DomMetaSharedAiConfig) => void;
}> = ({ authContext, initialConfig, canManageConfig = true, onSaved }) => {
  const [loading, setLoading] = useState<boolean>(() => Boolean(authContext.accessToken));
  const [saving, setSaving] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState<boolean>(() =>
    Boolean(initialConfig?.has_api_key)
  );
  const [maskedKey, setMaskedKey] = useState<string>(() => initialConfig?.api_key_masked || '');
  const [model, setModel] = useState<string>(() => initialConfig?.model || 'gemini-2.5-flash');
  const [leadEvalEnabled, setLeadEvalEnabled] = useState<boolean>(
    () => initialConfig?.ai_lead_eval_enabled !== false
  );
  const [adsEvalEnabled, setAdsEvalEnabled] = useState<boolean>(
    () => initialConfig?.ai_ads_eval_enabled !== false
  );
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!authContext.accessToken) return;
    let cancelled = false;
    fetchDomMetaAiConfig(authContext)
      .then((cfg) => {
        if (cancelled) return;
        setHasExistingKey(Boolean(cfg.has_api_key));
        setMaskedKey(cfg.api_key_masked || '');
        setModel(cfg.model || 'gemini-2.5-flash');
        setLeadEvalEnabled(cfg.ai_lead_eval_enabled !== false);
        setAdsEvalEnabled(cfg.ai_ads_eval_enabled !== false);
      })
      .catch(() => {
        // ignore fallback
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authContext.accessToken, authContext.tenantSlug, authContext.apiBaseUrl]);

  const handleSave = async (clearKey = false) => {
    setSaving(true);
    setFeedback(null);
    try {
      const trimmedKey = apiKeyInput.trim();
      const saved = await saveDomMetaAiConfig(authContext, {
        ...(clearKey
          ? { clear_api_key: true }
          : trimmedKey
            ? { api_key: trimmedKey }
            : {}),
        model: model.trim() || 'gemini-2.5-flash',
        ai_lead_eval_enabled: leadEvalEnabled,
        ai_ads_eval_enabled: adsEvalEnabled,
      });
      setHasExistingKey(Boolean(saved.has_api_key));
      setMaskedKey(saved.api_key_masked || '');
      setApiKeyInput('');
      onSaved?.(saved);
      setFeedback({
        type: 'ok',
        text: clearKey
          ? 'Đã xóa khóa AI API Key dùng chung.'
          : 'Đã lưu AI API Key & đồng bộ quyền đánh giá cho cả CRM và Meta Report!',
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'err',
        text: getErrText(err, 'Không thể lưu cấu hình AI API Key.'),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!authContext.accessToken) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900">
        Đang xem ở chế độ khách (Public Viewer). Vui lòng đăng nhập tài khoản Quản trị để thiết lập
        AI API Key dùng chung giữa CRM AutoData &amp; DOM Meta Report.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-emerald-50/75 border border-emerald-200/80 px-3.5 py-3 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>Mã hóa AES-256-GCM đồng bộ 2 chiều:</strong> Thiết lập Gemini API Key một lần để
          dùng chung cho cả CRM AutoData và DOM Meta Report.
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-[#1E40FF]" />
          <span>Đang tải cấu hình AI dùng chung...</span>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <label className="text-xs font-bold text-slate-700">Google Gemini API Key</label>
              <div className="flex items-center gap-2">
                {hasExistingKey && maskedKey && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#1E40FF] text-[10.5px] font-mono font-bold">
                    Đã lưu: {maskedKey}
                  </span>
                )}
                {canManageConfig && hasExistingKey && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave(true)}
                    className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    Xóa khóa
                  </button>
                )}
              </div>
            </div>
            <input
              type="password"
              data-testid="shared-ai-key-input"
              disabled={!canManageConfig}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={
                hasExistingKey
                  ? 'Để trống để giữ nguyên khóa, hoặc dán AIzaSy... mới'
                  : 'Dán Google Gemini API Key (AIzaSy...)'
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3.5 py-2.5 text-xs font-mono text-slate-800 outline-none focus:border-[#1E40FF]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Mô hình AI phân tích</label>
            <DomMetaSelect
              ariaLabel="Chọn mô hình AI phân tích"
              value={model}
              disabled={!canManageConfig}
              variant="rounded"
              onChange={(v) => setModel(v)}
              className="w-full bg-slate-50"
              options={[
                {
                  value: 'gemini-2.5-flash',
                  label: 'Gemini 2.5 Flash (Khuyên dùng)',
                  description: 'Tốc độ cao & Phân tích sâu đa chiều',
                },
                {
                  value: 'gemini-2.5-pro',
                  label: 'Gemini 2.5 Pro',
                  description: 'Chuyên sâu chiến lược ngân sách lớn',
                },
                {
                  value: 'gemini-2.0-flash',
                  label: 'Gemini 2.0 Flash',
                  description: 'Phản hồi tức thì & Tiết kiệm quota',
                },
              ]}
            />
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="text-xs font-bold text-slate-700">
              Quyền sử dụng AI đánh giá (Mặc định bật cả 2)
            </div>

            <label className="rounded-2xl border border-slate-200 hover:border-blue-200 bg-slate-50/80 px-4 py-3 flex items-center justify-between gap-3 cursor-pointer">
              <div className="min-w-0">
                <div className="text-xs sm:text-[13px] font-bold text-slate-800">
                  Cho phép dùng AI đánh giá Lead (CRM AutoData)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Tự động chấm điểm chất lượng Lead, sàng lọc số rác &amp; gợi ý kịch bản cho Sale
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={leadEvalEnabled}
                data-testid="toggle-ai-lead-eval"
                disabled={!canManageConfig}
                onClick={() => setLeadEvalEnabled((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                  leadEvalEnabled ? 'bg-[#1E40FF]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    leadEvalEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>

            <label className="rounded-2xl border border-slate-200 hover:border-blue-200 bg-slate-50/80 px-4 py-3 flex items-center justify-between gap-3 cursor-pointer">
              <div className="min-w-0">
                <div className="text-xs sm:text-[13px] font-bold text-slate-800">
                  Cho phép dùng AI đánh giá &amp; phân tích Quảng cáo (Meta Report)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Chẩn đoán chuyên sâu Result, Spend, CPR, Phễu hành vi, Khung giờ &amp; Creative
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={adsEvalEnabled}
                data-testid="toggle-ai-ads-eval"
                disabled={!canManageConfig}
                onClick={() => setAdsEvalEnabled((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                  adsEvalEnabled ? 'bg-[#1E40FF]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    adsEvalEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </div>

          {feedback && (
            <div
              className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                feedback.type === 'ok'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {canManageConfig && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                data-testid="save-shared-ai-key-btn"
                disabled={saving}
                onClick={() => void handleSave(false)}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <Save className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>Lưu Thiết Lập AI</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const DomMetaSettingsPage: React.FC<{
  activeTab: DomMetaSettingsTab;
  onTabChange: (tab: DomMetaSettingsTab) => void;
  config: DomMetaWorkspaceConfig;
  authContext: DomMetaAuthContext;
  tenantSlug?: string;
  shareUrlOverride?: string;
  daysRemaining?: number;
  canManageConfig?: boolean;
  onSaveConfig: (patch: DomMetaWorkspacePatch) => Promise<void>;
  onAiConfigSaved?: (next: DomMetaSharedAiConfig) => void;
  onTestGoogleAds?: (cfg: DomMetaGoogleAdsConfig) => Promise<{ rowsCount: number }>;
  onOpenAccountManager?: () => void;
  onOpenShareModal?: () => void;
}> = ({
  activeTab,
  onTabChange,
  config,
  authContext,
  tenantSlug = 'workspace',
  shareUrlOverride,
  daysRemaining = 30,
  canManageConfig = true,
  onSaveConfig,
  onAiConfigSaved,
  onTestGoogleAds,
  onOpenAccountManager,
  onOpenShareModal,
}) => {
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
  const [saveNotice, setSaveNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
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
    setSaveNotice(null);
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
      setSaveNotice({ type: 'ok', text: 'Đã lưu cấu hình Workspace thành công!' });
    } catch (err: unknown) {
      setSaveNotice({
        type: 'err',
        text: getErrText(err, 'Không thể lưu cấu hình Workspace.'),
      });
    } finally {
      setSaving(false);
    }
  };

  const navTabs: Array<{
    id: DomMetaSettingsTab;
    label: string;
    desc: string;
    icon: React.ReactNode;
    badge?: string;
    badgeOk?: boolean;
  }> = [
    {
      id: 'brand',
      label: 'Thương hiệu & Dự án',
      desc: 'Lọc theo Brand / Từ khóa',
      icon: <Tag className="w-4 h-4" />,
      badge: brands.length > 0 ? String(brands.length) : undefined,
    },
    {
      id: 'goals',
      label: 'Meta Goal & KPI',
      desc: 'Biểu đồ cột & 3 thẻ chỉ số',
      icon: <Target className="w-4 h-4" />,
    },
    {
      id: 'ai_key',
      label: 'AI API Key (Chung)',
      desc: 'Gemini Key cho CRM & Meta',
      icon: <KeyRound className="w-4 h-4" />,
      badge: config.ai_config?.has_api_key ? 'Đã gắn' : undefined,
      badgeOk: Boolean(config.ai_config?.has_api_key),
    },
    {
      id: 'google_ads',
      label: 'Tích hợp Google Ads',
      desc: 'Customer ID & Apps Script',
      icon: <Sliders className="w-4 h-4" />,
      badge: config.google_ads.enabled && config.google_ads.customer_id ? 'Đã nối' : undefined,
      badgeOk: Boolean(config.google_ads.enabled && config.google_ads.customer_id),
    },
    {
      id: 'accounts',
      label: 'Tài khoản Meta Ads',
      desc: 'Chuyển & kết nối BM / Acc',
      icon: <CreditCard className="w-4 h-4" />,
      badge: config.meta_summary.accounts.length > 0 ? String(config.meta_summary.accounts.length) : undefined,
    },
    {
      id: 'ecosystem',
      label: 'Chia sẻ & Đồng bộ ERP',
      desc: 'Public link & Phân quyền',
      icon: <Share2 className="w-4 h-4" />,
    },
    {
      id: 'plan',
      label: 'Gói dịch vụ & Gia hạn',
      desc: 'Thời hạn dùng thử Workspace',
      icon: <Crown className="w-4 h-4" />,
    },
  ];

  const currentTabMeta = navTabs.find((t) => t.id === activeTab) || navTabs[0];
  const showWorkspaceSaveFooter =
    canManageConfig && (activeTab === 'brand' || activeTab === 'goals' || activeTab === 'google_ads');

  return (
    <div data-testid="dom-meta-settings-page" className="space-y-4">
      <div className="rounded-2xl bg-white border border-slate-200/80 px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E40FF] flex items-center justify-center shrink-0">
            <Settings2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              Cài Đặt Hệ Thống &amp; Tích Hợp API
            </h2>
            <p className="text-[11px] text-slate-500 truncate">
              Quản lý toàn bộ cấu hình Thương hiệu, Meta Goal, AI API Key dùng chung, Google Ads &amp;
              Phân quyền Workspace
            </p>
          </div>
        </div>
      </div>

      {/* Mobile (< lg): Compact Selector Dropdown */}
      <div className="lg:hidden">
        <DomMetaSelect
          ariaLabel="Chọn mục cài đặt"
          value={activeTab}
          onChange={(val) => {
            setSaveNotice(null);
            onTabChange(val as DomMetaSettingsTab);
          }}
          variant="rounded"
          className="w-full bg-white"
          options={navTabs.map((t) => ({
            value: t.id,
            label: t.label,
            description: t.desc,
          }))}
        />
      </div>

      {/* ERP-Style Two-Column Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Desktop Vertical Tab Sidebar */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 rounded-2xl bg-white border border-slate-200/80 p-2.5 space-y-1 shadow-xs sticky top-20">
          {navTabs.map((t) => {
            const active = t.id === activeTab;
            return (
              <button
                key={t.id}
                type="button"
                data-testid={`settings-tab-${t.id}`}
                onClick={() => {
                  setSaveNotice(null);
                  onTabChange(t.id);
                }}
                className={`w-full rounded-xl px-3 py-2.5 text-left flex items-center gap-3 transition-all cursor-pointer relative ${
                  active
                    ? 'bg-[#F4F8FF] text-[#1E40FF] shadow-xs ring-1 ring-blue-200/80'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    active
                      ? 'bg-[#1E40FF] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {t.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`text-xs truncate ${active ? 'font-bold' : 'font-semibold'}`}>
                      {t.label}
                    </span>
                    {t.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-bold shrink-0 ${
                          t.badgeOk
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10.5px] text-slate-400 truncate mt-0.5">{t.desc}</div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Right Detail Editor Pane */}
        <div className="lg:col-span-8 xl:col-span-9 rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E40FF] flex items-center justify-center shrink-0">
              {currentTabMeta.icon}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">{currentTabMeta.label}</h3>
              <p className="text-[11px] text-slate-500 truncate">{currentTabMeta.desc}</p>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {saveNotice && (
              <div
                className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${
                  saveNotice.type === 'ok'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}
              >
                {saveNotice.text}
              </div>
            )}

            {activeTab === 'ai_key' ? (
              <AiKeyInlineSettingsPanel
                authContext={authContext}
                initialConfig={config.ai_config}
                canManageConfig={canManageConfig}
                onSaved={onAiConfigSaved}
              />
            ) : (
              <WorkspaceSettingsTabContent
                tab={activeTab}
                config={config}
                brands={brands}
                setBrands={setBrands}
                goalMode={goalMode}
                setGoalMode={setGoalMode}
                goalKeywords={goalKeywords}
                setGoalKeywords={setGoalKeywords}
                newGoalKw={newGoalKw}
                setNewGoalKw={setNewGoalKw}
                summaryMetrics={summaryMetrics}
                toggleSummaryKpi={toggleSummaryKpi}
                gads={gads}
                setGads={setGads}
                tenantSlug={tenantSlug}
                shareUrl={shareUrl}
                copiedShare={copiedShare}
                setCopiedShare={setCopiedShare}
                daysRemaining={daysRemaining}
                canManageConfig={canManageConfig}
                onTestGoogleAds={onTestGoogleAds}
                onOpenAccountManager={onOpenAccountManager}
                onOpenShareModal={onOpenShareModal}
              />
            )}
          </div>

          {showWorkspaceSaveFooter && (
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Lưu Cấu Hình</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
