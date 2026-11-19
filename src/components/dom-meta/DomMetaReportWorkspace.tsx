import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bell,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  Images,
  KeyRound,
  Layers,
  LayoutDashboard,
  List,
  LogOut,
  MapPin,
  PlusCircle,
  RefreshCw,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { DomationLogoMark } from '../DomationLogoMark';
import {
  DOM_META_METRIC_REGISTRY,
  calcDeltaPercent,
  collectEntityThumbs,
  evaluateCustomFormula,
  formatDomMoney,
  formatDomMoneyShort,
  formatDomNumber,
  formatIsoToVnDisplay,
  parseGoogleAdsChannelsFromRows,
  parseGoogleAdsHourlyFromRows,
  parseGoogleAdsLocationsFromRows,
  resolveDateRangeFromPreset,
  type DomGoogleAdsKeywordItem,
  type DomGoogleAdsRow,
  type DomGoogleAdsSearchTermItem,
  type DomMetaAdNode,
  type DomMetaAdsetNode,
  type DomMetaAiReportEntry,
  type DomMetaCampaignNode,
  type DomMetaCrmAttributionPayload,
  type DomMetaCrmEntityBucket,
  type DomMetaCrmLeadItem,
  type DomMetaDailyPoint,
  type DomMetaDashboardDataset,
  type DomMetaDatePreset,
  type DomMetaNavView,
  type DomMetaWorkspaceConfig,
  type DomMetaWorkspacePatch,
} from './domMetaTypes';
import {
  connectBatchMetaAccounts,
  createEmptyWorkspaceConfig,
  discoverMetaAccountsFromToken,
  fetchDomMetaCrmAttribution,
  fetchDomMetaQuickConnectStatus,
  fetchDomMetaWorkspaceConfig,
  loadDomGoogleAdsDataset,
  loadDomGoogleAdsKeywords,
  loadFullDomMetaDataset,
  quickConnectDomMeta,
  updateDomMetaWorkspaceConfig,
  type DomMetaAuthContext,
} from './domMetaApi';
import {
  AgeGenderBarChart,
  CreativeThumbFan,
  DailyTrendAreaChart,
  DaypartingHeatmapGrid,
  GoogleAdsCampaignDonutCard,
  GoogleAdsChannelCard,
  GoogleAdsHourlyBarChart,
  GoogleAdsLocationBarChart,
  MetaGoalBarChart,
  MonthlyYearBarChart,
  RegionSpentBarChart,
  SpentPlatformDonutCard,
  VideoFunnelBars,
  type DomGoogleAdsDimMetric,
} from './DomMetaCharts';
import {
  AccountManagerModal,
  AdEntityDetailModal,
  AiSummaryModal,
  CampaignCompareModal,
  ColumnPresetModal,
  GoogleAdsKeywordModal,
  PerformanceCompareModal,
  ShareAccessModal,
  WorkspaceSettingsModal,
} from './DomMetaModals';
import { DOM_META_SUMMARY_KPI_OPTIONS } from './domMetaTypes';
import { DomMetaQuickConnectModal } from './DomMetaQuickConnectModal';
import { DomMetaSelect } from './DomMetaSelect';

function formatScheduleDateVn(iso?: string): string {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function buildScheduleText(start?: string, end?: string, isActive?: boolean): string {
  const s = formatScheduleDateVn(start);
  const e = formatScheduleDateVn(end);
  if (s && e) return `${s} → ${e}`;
  if (s) return isActive ? `Từ ${s} · Liên tục` : `Bắt đầu: ${s}`;
  if (e) return `Kết thúc: ${e}`;
  return '';
}

function normalizeStatusBadgeInfo(
  row: DomMetaCampaignNode | DomMetaAdsetNode | DomMetaAdNode,
  nowMs: number
): { label: string; tone: 'active' | 'complete' | 'paused'; activeCount?: number } {
  if ('adsets' in row && Array.isArray(row.adsets)) {
    const activeChildren = row.adsets.filter(
      (as) =>
        as.effective_status.toUpperCase() === 'ACTIVE' ||
        as.ads.some((a) => a.effective_status.toUpperCase() === 'ACTIVE')
    ).length;
    const stopTs = row.stop_time ? new Date(row.stop_time).getTime() : NaN;
    const isStopped = Number.isFinite(stopTs) && stopTs < nowMs;
    const isAct = row.effective_status.toUpperCase() === 'ACTIVE' || activeChildren > 0;
    if (isStopped && !isAct) return { label: 'Complete', tone: 'complete' };
    if (isAct) {
      return {
        label: activeChildren > 0 ? `${activeChildren} Active` : 'Active',
        tone: 'active',
        activeCount: activeChildren,
      };
    }
    return { label: 'Paused', tone: 'paused' };
  }
  if ('ads' in row && Array.isArray(row.ads)) {
    const endTs = row.end_time ? new Date(row.end_time).getTime() : NaN;
    const isEnded =
      (Number.isFinite(endTs) && endTs < nowMs) ||
      row.effective_status.toUpperCase() === 'COMPLETED';
    const isAct =
      !isEnded &&
      (row.effective_status.toUpperCase() === 'ACTIVE' ||
        row.ads.some((a) => a.effective_status.toUpperCase() === 'ACTIVE'));
    if (isEnded) return { label: 'Complete', tone: 'complete' };
    if (isAct) return { label: 'Active', tone: 'active' };
    return { label: 'Paused', tone: 'paused' };
  }
  const eff = row.effective_status.toUpperCase();
  if (eff === 'ACTIVE') return { label: 'Active', tone: 'active' };
  if (eff === 'COMPLETED') return { label: 'Complete', tone: 'complete' };
  return { label: 'Paused', tone: 'paused' };
}

export interface DomMetaReportWorkspaceProps {
  mode?: 'standalone' | 'embedded';
  authContext: DomMetaAuthContext;
  workspaceName?: string;
  userDisplayName?: string;
  userRoleLabel?: string;
  daysRemaining?: number;
  canManageConfig?: boolean;
  initialView?: DomMetaNavView;
  initialDatePreset?: DomMetaDatePreset;
  initialCustomRange?: { since: string; until: string };
  workspacesCount?: number;
  enableCrmAttribution?: boolean;
  erpMode?: boolean;
  capiPanel?: React.ReactNode;
  capiTabLabel?: string;
  focusAdId?: string;
  focusCampaignId?: string;
  initialEntityModalTab?: 'insights' | 'crm_leads';
  defaultQuickConnectOpen?: boolean;
  onOpenLead?: (lead: DomMetaCrmLeadItem) => void;
  onFilterCampaignLeads?: (campaignId: string, campaignName: string) => void;
  onRequestSwitchWorkspace?: () => void;
  onRequestCreateWorkspace?: () => void;
  onExitStandalone?: () => void;
  onLogout?: () => void;
}

type DomQuickFilterKey =
  | 'all'
  | 'active'
  | 'spent'
  | 'lead'
  | 'message'
  | 'traffic'
  | 'sales'
  | 'video'
  | 'app'
  | 'awareness'
  | 'engagement'
  | 'high_ctr'
  | 'high_roas';

type DomEndingFilterKey = 'all' | 'ending_1d' | 'ending_3d' | 'ended';

type DailyMetricKey =
  | 'spend'
  | 'impressions'
  | 'reach'
  | 'leads'
  | 'messages'
  | 'follows'
  | 'cpm';

type HeatmapMetricKey = 'spend' | 'leads' | 'messages' | 'purchases' | 'clicks';
type YearMetricKey = 'spend' | 'leads' | 'reach' | 'messages' | 'follows';
type GadsTrendMetricKey = 'spend' | 'clicks' | 'impressions' | 'leads';
type GadsBarMetricKey = 'spent' | 'click' | 'conv' | 'ctr' | 'cpc' | 'cpa';

const DATE_PRESET_OPTIONS: Array<{ key: DomMetaDatePreset; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'yesterday_to_today', label: 'Yesterday - Today' },
  { key: 'last_7days', label: 'Last 7 days' },
  { key: 'last_30days', label: 'Last 30 days' },
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'custom_range', label: 'Custom Date' },
];

const CALENDAR_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatDomMetaRoleBadge(rawRole?: string): string {
  const key = String(rawRole || 'admin')
    .trim()
    .toLowerCase();
  if (
    !key ||
    key === 'tenant_admin' ||
    key === 'super_admin' ||
    key === 'superadmin' ||
    key === 'owner' ||
    key === 'admin'
  ) {
    return 'Admin';
  }
  if (key === 'manager') return 'Manager';
  if (key === 'sale') return 'Sale';
  if (key === 'viewer') return 'Viewer';
  return rawRole || 'Admin';
}

function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildCalendarMonthGrid(
  year: number,
  month: number
): Array<{ iso: string; day: number; inMonth: boolean }> {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0=Sun .. 6=Sat
  const gridStart = new Date(year, month, 1 - startOffset);
  const cells: Array<{ iso: string; day: number; inMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const cur = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({
      iso: toIsoDateLocal(cur),
      day: cur.getDate(),
      inMonth: cur.getMonth() === month && cur.getFullYear() === year,
    });
  }
  return cells;
}

function readInitialUrlParams(): {
  since?: string;
  until?: string;
  brand?: string;
  view?: DomMetaNavView;
  focusAdId?: string;
  focusCampaignId?: string;
} {
  if (typeof window === 'undefined') return {};
  try {
    const p = new URLSearchParams(window.location.search);
    const since = p.get('since') || '';
    const until = p.get('until') || '';
    const brand = (p.get('brand') || '').trim();
    const rawView = (p.get('view') || '').trim();
    const focusAdId = (p.get('focusAdId') || p.get('ad_id') || '').trim();
    const focusCampaignId = (p.get('focusCampaignId') || p.get('campaign_id') || '').trim();
    const validViews: DomMetaNavView[] = [
      'dashboard',
      'ad_detail',
      'ad_library',
      'account',
      'google_ads',
      'meta_capi',
    ];
    return {
      since: /^\d{4}-\d{2}-\d{2}$/.test(since) ? since : undefined,
      until: /^\d{4}-\d{2}-\d{2}$/.test(until) ? until : undefined,
      brand: brand || undefined,
      view: validViews.includes(rawView as DomMetaNavView)
        ? (rawView as DomMetaNavView)
        : undefined,
      focusAdId: focusAdId || undefined,
      focusCampaignId: focusCampaignId || undefined,
    };
  } catch {
    return {};
  }
}

function getSaleInitials(name: string): string {
  const parts = String(name || 'S')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

function getNumericMetricForSort(
  colId: string,
  row: DomMetaCampaignNode | DomMetaAdsetNode | DomMetaAdNode,
  customMetrics: DomMetaWorkspaceConfig['column_config']['customMetrics']
): number {
  const custom = customMetrics?.find((m) => m.id === colId);
  if (custom) {
    return evaluateCustomFormula(custom.formula, row as unknown as Record<string, unknown>);
  }
  if (colId === 'status') {
    return row.effective_status.toUpperCase() === 'ACTIVE' ? 1 : 0;
  }
  const rec = row as unknown as Record<string, unknown>;
  const num = Number(rec[colId] ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function loadLocalAiReports(tenantSlug?: string): DomMetaAiReportEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(
      `dom_meta_ai_reports_${tenantSlug || 'default'}`
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as DomMetaAiReportEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLocalAiReports(tenantSlug: string | undefined, items: DomMetaAiReportEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `dom_meta_ai_reports_${tenantSlug || 'default'}`,
      JSON.stringify(items.slice(0, 25))
    );
  } catch {
    // ignore storage quota
  }
}

export const DomMetaReportWorkspace: React.FC<DomMetaReportWorkspaceProps> = ({
  mode = 'standalone',
  authContext,
  workspaceName = 'DOM Workspace',
  userDisplayName = 'Admin',
  userRoleLabel = 'admin',
  daysRemaining = 30,
  canManageConfig = true,
  initialView = 'dashboard',
  initialDatePreset = 'last_7days',
  initialCustomRange,
  workspacesCount = 1,
  enableCrmAttribution,
  erpMode = false,
  capiPanel,
  capiTabLabel = 'Meta CAPI',
  focusAdId,
  focusCampaignId,
  initialEntityModalTab = 'insights',
  defaultQuickConnectOpen = false,
  onOpenLead,
  onFilterCampaignLeads,
  onRequestSwitchWorkspace,
  onRequestCreateWorkspace,
  onExitStandalone,
  onLogout,
}) => {
  const initialUrlState = useMemo(() => readInitialUrlParams(), []);
  const effectiveInitialRange = useMemo(
    () =>
      initialCustomRange ||
      (initialUrlState.since && initialUrlState.until
        ? { since: initialUrlState.since, until: initialUrlState.until }
        : undefined),
    [initialCustomRange, initialUrlState.since, initialUrlState.until]
  );

  const isCrmEnabled = Boolean(
    enableCrmAttribution ?? (mode === 'embedded' || Boolean(authContext.previewCrmAttribution))
  );

  const [config, setConfig] = useState<DomMetaWorkspaceConfig>(() => createEmptyWorkspaceConfig());
  const [activeView, setActiveView] = useState<DomMetaNavView>(
    initialUrlState.view || initialView
  );
  const [datePreset, setDatePreset] = useState<DomMetaDatePreset>(
    effectiveInitialRange ? 'custom_range' : initialDatePreset
  );
  const [customStart, setCustomStart] = useState(effectiveInitialRange?.since || '');
  const [customEnd, setCustomEnd] = useState(effectiveInitialRange?.until || '');
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const initialResolvedRange = useMemo(
    () =>
      resolveDateRangeFromPreset(
        effectiveInitialRange ? 'custom_range' : initialDatePreset,
        effectiveInitialRange?.since || '',
        effectiveInitialRange?.until || ''
      ),
    [effectiveInitialRange, initialDatePreset]
  );
  const [draftPreset, setDraftPreset] = useState<DomMetaDatePreset>(
    effectiveInitialRange ? 'custom_range' : initialDatePreset
  );
  const [draftStart, setDraftStart] = useState(initialResolvedRange.since);
  const [draftEnd, setDraftEnd] = useState(initialResolvedRange.until);
  const [pickPhase, setPickPhase] = useState<'start' | 'end'>('start');
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>(() => {
    const parts = initialResolvedRange.until.split('-').map(Number);
    return {
      year: parts[0] || new Date().getFullYear(),
      month: (parts[1] ? parts[1] - 1 : new Date().getMonth()),
    };
  });

  useEffect(() => {
    if (!dateMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setDateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [dateMenuOpen]);

  const [dataset, setDataset] = useState<DomMetaDashboardDataset | null>(null);
  const [crmAttribution, setCrmAttribution] = useState<DomMetaCrmAttributionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const autoConnectCheckedRef = useRef(false);

  // Dashboard interactive states
  const [dailyMetric, setDailyMetric] = useState<DailyMetricKey>('spend');
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetricKey>('spend');
  const [ageOnly, setAgeOnly] = useState(false);
  const [showExtraDetails, setShowExtraDetails] = useState(true);
  const [activeBrandFilter, setActiveBrandFilter] = useState(initialUrlState.brand || '');
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [localAiReports, setLocalAiReports] = useState<DomMetaAiReportEntry[]>(() =>
    loadLocalAiReports(authContext.tenantSlug)
  );

  // Campaign details & Dashboard Campaign Tree states
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<DomQuickFilterKey>('all');
  const [endingFilter, setEndingFilter] = useState<DomEndingFilterKey>('all');
  const [sortConfig, setSortConfig] = useState<{ colId: string; dir: 'desc' | 'asc' } | null>(
    null
  );
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  const [expandedAdsets, setExpandedAdsets] = useState<Record<string, boolean>>({});
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<Record<string, boolean>>({});

  // Ad Account states
  const [yearMetric, setYearMetric] = useState<YearMetricKey>('spend');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [activityCat, setActivityCat] = useState<string>('ALL');

  // Google Ads states (only fetched when config.google_ads.enabled === true)
  const [gadsLoading, setGadsLoading] = useState(false);
  const [gadsData, setGadsData] = useState<{
    currentRows: DomGoogleAdsRow[];
    prevRows: DomGoogleAdsRow[];
    leadForms: Record<string, unknown>[];
    syncedAt: string | null;
  } | null>(null);
  const [gadsTrendMetric, setGadsTrendMetric] = useState<GadsTrendMetricKey>('spend');
  const [gadsBarMetric, setGadsBarMetric] = useState<GadsBarMetricKey>('spent');
  const [gadsBreakdownCamp, setGadsBreakdownCamp] = useState<string>('__all__');
  const [gadsBreakdownMetric, setGadsBreakdownMetric] = useState<DomGoogleAdsDimMetric>('click');
  const [gadsSearch, setGadsSearch] = useState('');
  const [gadsKwModal, setGadsKwModal] = useState<{
    open: boolean;
    campaignName: string;
    loading: boolean;
    keywords: DomGoogleAdsKeywordItem[];
    searchTerms: DomGoogleAdsSearchTermItem[];
  }>({ open: false, campaignName: '', loading: false, keywords: [], searchTerms: [] });

  // Modals
  const [detailModal, setDetailModal] = useState<{
    entity: DomMetaCampaignNode | DomMetaAdNode | DomMetaAdsetNode;
    type: 'campaign' | 'ad' | 'adset';
    initialTab?: 'insights' | 'crm_leads';
  } | null>(null);
  const [handledFocusKey, setHandledFocusKey] = useState('');
  const [quickConnectOpen, setQuickConnectOpen] = useState(Boolean(defaultQuickConnectOpen));
  const [perfCompareOpen, setPerfCompareOpen] = useState(false);
  const [referenceNowMs, setReferenceNowMs] = useState<number>(() => Date.now());
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [compareCampaignsOpen, setCompareCampaignsOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [settingsModal, setSettingsModal] = useState<{
    open: boolean;
    tab: 'brand' | 'goals' | 'google_ads' | 'ecosystem' | 'plan';
  }>({ open: false, tab: 'brand' });

  const resolvedRange = useMemo(
    () => resolveDateRangeFromPreset(datePreset, customStart, customEnd),
    [datePreset, customStart, customEnd]
  );

  // Derived view fallback if Google Ads is turned OFF or CAPI panel is absent
  const effectiveView: DomMetaNavView =
    (!config.google_ads.enabled && activeView === 'google_ads') ||
    (!capiPanel && activeView === 'meta_capi')
      ? 'dashboard'
      : activeView;

  const triggerReload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        // Zero-Friction Auto-Connect in embedded CRM/ERP mode when Meta token already exists
        if (
          mode === 'embedded' &&
          canManageConfig &&
          authContext.accessToken &&
          !autoConnectCheckedRef.current
        ) {
          autoConnectCheckedRef.current = true;
          try {
            const st = await fetchDomMetaQuickConnectStatus(authContext);
            if (!cancelled && st.can_auto_connect && !st.dom_meta_connected) {
              await quickConnectDomMeta(authContext, { auto_reuse: true });
            }
          } catch {
            // Non-blocking auto-connect check
          }
        }

        const cfgPromise = fetchDomMetaWorkspaceConfig(authContext);
        const crmPromise = isCrmEnabled
          ? fetchDomMetaCrmAttribution(authContext, {
              since: resolvedRange.since,
              until: resolvedRange.until,
            }).catch(() => null)
          : Promise.resolve(null);

        const [cfg, crmRes] = await Promise.all([cfgPromise, crmPromise]);
        if (cancelled) return;
        setConfig(cfg);
        setCrmAttribution(crmRes);
        if (Array.isArray(cfg.ai_reports) && cfg.ai_reports.length > 0) {
          setLocalAiReports(cfg.ai_reports);
          saveLocalAiReports(authContext.tenantSlug, cfg.ai_reports);
        }

        // Normalize URL brand parameter against configured brand_filters if matched by name
        if (initialUrlState.brand && cfg.brand_filters.length > 0) {
          const lower = initialUrlState.brand.toLowerCase();
          const matched = cfg.brand_filters.find(
            (b) => b.filter.toLowerCase() === lower || b.name.toLowerCase() === lower
          );
          if (matched) {
            setActiveBrandFilter((prev) =>
              prev.toLowerCase() === lower ? matched.filter : prev
            );
          }
        }

        const targetAcc =
          cfg.primary_ad_account_id ||
          cfg.meta_summary.ad_account_id ||
          cfg.meta_summary.accounts[0]?.ad_account_id ||
          authContext.directAdAccountId ||
          '';

        if (!targetAcc) {
          setDataset(null);
          setError(null);
          setLoading(false);
          return;
        }

        const ds = await loadFullDomMetaDataset(
          authContext,
          targetAcc,
          resolvedRange,
          selectedYear
        );
        if (cancelled) return;
        setDataset(ds);
        setReferenceNowMs(Date.now());
        setError(null);

        if (cfg.google_ads.enabled) {
          setGadsLoading(true);
          loadDomGoogleAdsDataset(authContext, resolvedRange)
            .then((gd) => {
              if (!cancelled) setGadsData(gd);
            })
            .catch(() => {
              if (!cancelled) setGadsData(null);
            })
            .finally(() => {
              if (!cancelled) setGadsLoading(false);
            });
        } else {
          setGadsData(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error && err.message
              ? err.message
              : 'Không thể tải dữ liệu báo cáo Meta Ads.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [
    authContext,
    canManageConfig,
    isCrmEnabled,
    mode,
    resolvedRange,
    selectedYear,
    reloadTick,
    initialUrlState.brand,
  ]);

  // Share URL with live date range & brand filter state
  const currentShareUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return `https://domation.net/meta-report/${authContext.tenantSlug || 'workspace'}`;
    }
    const baseHref =
      mode === 'standalone'
        ? window.location.href
        : `${window.location.origin}/meta-report/${authContext.tenantSlug || 'workspace'}`;
    const u = new URL(baseHref);
    u.searchParams.set('since', resolvedRange.since);
    u.searchParams.set('until', resolvedRange.until);
    if (activeBrandFilter.trim()) {
      u.searchParams.set('brand', activeBrandFilter.trim());
    } else {
      u.searchParams.delete('brand');
    }
    if (effectiveView !== 'dashboard') {
      u.searchParams.set('view', effectiveView);
    } else {
      u.searchParams.delete('view');
    }
    return u.toString();
  }, [
    authContext.tenantSlug,
    mode,
    resolvedRange.since,
    resolvedRange.until,
    activeBrandFilter,
    effectiveView,
  ]);

  // Keep browser URL query parameters synced in standalone mode
  useEffect(() => {
    if (mode !== 'standalone' || typeof window === 'undefined') return;
    if ((window as unknown as { __DOM_META_PREVIEW__?: unknown }).__DOM_META_PREVIEW__) return;
    try {
      const next = new URL(window.location.href);
      next.searchParams.set('since', resolvedRange.since);
      next.searchParams.set('until', resolvedRange.until);
      if (activeBrandFilter.trim()) {
        next.searchParams.set('brand', activeBrandFilter.trim());
      } else {
        next.searchParams.delete('brand');
      }
      if (effectiveView !== 'dashboard') {
        next.searchParams.set('view', effectiveView);
      } else {
        next.searchParams.delete('view');
      }
      const nextRel = `${next.pathname}${next.search}${next.hash}`;
      const currRel = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextRel !== currRel) {
        window.history.replaceState(null, '', nextRel);
      }
    } catch {
      // ignore history replace errors
    }
  }, [
    mode,
    resolvedRange.since,
    resolvedRange.until,
    activeBrandFilter,
    effectiveView,
  ]);

  const currency = dataset?.accountOverview?.currency || 'VND';

  const activeAccountObj = useMemo(() => {
    const id = config.primary_ad_account_id || config.meta_summary.ad_account_id;
    return (
      config.meta_summary.accounts.find((a) => a.ad_account_id === id) ||
      config.meta_summary.accounts[0] ||
      (id ? { id, ad_account_id: id, name: `DOM - ${id.slice(-4)}` } : null)
    );
  }, [config]);

  const activeBrandLabel = useMemo(() => {
    if (!activeBrandFilter) return 'Tất cả';
    const found = config.brand_filters.find((b) => b.filter === activeBrandFilter);
    return found?.name || activeBrandFilter;
  }, [activeBrandFilter, config.brand_filters]);

  // Filtered & sorted campaigns by Brand, Search, QuickFilter, EndingFilter, and Column Sort
  const filteredCampaigns = useMemo(() => {
    const all = dataset?.campaigns || [];
    const nowMs = referenceNowMs;
    const oneDayMs = 86_400_000;

    const matchesGoal = (c: DomMetaCampaignNode, tokens: string[]) => {
      const campGoal = `${c.optimization_goal || ''} ${c.objective || ''}`.toUpperCase();
      if (tokens.some((t) => campGoal.includes(t))) return true;
      return c.adsets.some((as) => {
        const g = (as.optimization_goal || '').toUpperCase();
        return tokens.some((t) => g.includes(t));
      });
    };

    const filtered = all.filter((c) => {
      if (activeBrandFilter && !c.name.toLowerCase().includes(activeBrandFilter.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchCamp = c.name.toLowerCase().includes(q) || c.id.includes(q);
        const matchChild = c.adsets.some(
          (as) =>
            as.name.toLowerCase().includes(q) ||
            as.id.includes(q) ||
            as.ads.some((ad) => ad.name.toLowerCase().includes(q) || ad.id.includes(q))
        );
        if (!matchCamp && !matchChild) return false;
      }

      switch (quickFilter) {
        case 'active':
          if (c.effective_status.toUpperCase() !== 'ACTIVE') return false;
          break;
        case 'spent':
          if (c.spend <= 0) return false;
          break;
        case 'lead':
          if (!matchesGoal(c, ['LEAD'])) return false;
          break;
        case 'message':
          if (!matchesGoal(c, ['MESSAGING', 'CONVERSATION', 'REPLIES'])) return false;
          break;
        case 'traffic':
          if (!matchesGoal(c, ['TRAFFIC', 'LINK_CLICK', 'LANDING_PAGE'])) return false;
          break;
        case 'sales':
          if (!matchesGoal(c, ['PURCHASE', 'SALES', 'VALUE', 'OFFSITE_CONVERSIONS'])) return false;
          break;
        case 'video':
          if (!matchesGoal(c, ['VIDEO', 'THRUPLAY'])) return false;
          break;
        case 'app':
          if (!matchesGoal(c, ['APP'])) return false;
          break;
        case 'awareness':
          if (!matchesGoal(c, ['REACH', 'IMPRESSION', 'RECALL', 'AWARENESS'])) return false;
          break;
        case 'engagement':
          if (!matchesGoal(c, ['ENGAGEMENT', 'PAGE_LIKES', 'EVENT'])) return false;
          break;
        case 'high_ctr':
          if (c.ctr < 1) return false;
          break;
        case 'high_roas':
          if (
            c.roas < 2 &&
            !c.adsets.some((as) => as.roas >= 2 || as.ads.some((ad) => ad.roas >= 2))
          ) {
            return false;
          }
          break;
        default:
          break;
      }

      if (endingFilter !== 'all') {
        const rawEndDates = [
          c.stop_time,
          ...c.adsets.map((as) => as.end_time),
        ]
          .filter((d): d is string => Boolean(d))
          .map((d) => new Date(d).getTime())
          .filter((ts) => Number.isFinite(ts));

        if (endingFilter === 'ended') {
          const isStatusCompleted = c.effective_status.toUpperCase() === 'COMPLETED';
          const hasEndedTime = rawEndDates.some((ts) => ts < nowMs);
          if (!isStatusCompleted && !hasEndedTime) return false;
        } else {
          if (rawEndDates.length === 0) return false;
          const maxDays = endingFilter === 'ending_1d' ? 1 : 3;
          const withinWindow = rawEndDates.some((ts) => {
            const diff = ts - nowMs;
            return diff > 0 && diff <= maxDays * oneDayMs;
          });
          if (!withinWindow) return false;
        }
      }

      return true;
    });

    const compareEntities = <T extends DomMetaCampaignNode | DomMetaAdsetNode | DomMetaAdNode>(
      a: T,
      b: T
    ): number => {
      if (!sortConfig) {
        const aAct = a.effective_status.toUpperCase() === 'ACTIVE' ? 1 : 0;
        const bAct = b.effective_status.toUpperCase() === 'ACTIVE' ? 1 : 0;
        if (aAct !== bAct) return bAct - aAct;
        return b.spend - a.spend;
      }
      const mult = sortConfig.dir === 'asc' ? 1 : -1;
      if (sortConfig.colId === 'name') {
        return a.name.localeCompare(b.name, 'vi') * mult;
      }
      const resolveSortVal = (item: T): number => {
        if (sortConfig.colId.startsWith('crm_')) {
          const normName = (item.name || '').normalize('NFC').trim().toLowerCase();
          const b =
            crmAttribution?.by_campaign[item.id] ||
            crmAttribution?.by_adset[item.id] ||
            crmAttribution?.by_ad[item.id] ||
            (normName ? crmAttribution?.by_campaign_name?.[normName] : undefined);
          if (sortConfig.colId === 'crm_leads') return b?.total_leads || 0;
          if (sortConfig.colId === 'crm_cpql') {
            return b && b.qualified_leads > 0 && item.spend > 0
              ? item.spend / b.qualified_leads
              : 0;
          }
          if (sortConfig.colId === 'crm_revenue') return b?.total_revenue_vnd || 0;
        }
        return getNumericMetricForSort(
          sortConfig.colId,
          item,
          config.column_config.customMetrics
        );
      };
      const av = resolveSortVal(a);
      const bv = resolveSortVal(b);
      if (av === bv) return b.spend - a.spend;
      return (av - bv) * mult;
    };

    return filtered
      .map((camp) => ({
        ...camp,
        adsets: [...camp.adsets]
          .map((as) => ({
            ...as,
            ads: [...as.ads].sort(compareEntities),
          }))
          .sort(compareEntities),
      }))
      .sort(compareEntities);
  }, [
    dataset,
    crmAttribution,
    activeBrandFilter,
    searchQuery,
    quickFilter,
    endingFilter,
    sortConfig,
    referenceNowMs,
    config.column_config.customMetrics,
  ]);

  const handleToggleSortColumn = (colId: string) => {
    setSortConfig((prev) => {
      if (!prev || prev.colId !== colId) return { colId, dir: 'desc' };
      if (prev.dir === 'desc') return { colId, dir: 'asc' };
      return null;
    });
  };

  // Meta Goal / Custom Bar Chart aggregation
  const metaGoalBars = useMemo(() => {
    const chartMode = config.goal_chart_mode || 'goal';
    if (chartMode === 'brand' && config.brand_filters.length > 0) {
      const items = config.brand_filters.map((b) => {
        const kw = b.filter.toLowerCase();
        const spend = filteredCampaigns
          .filter((c) => kw && c.name.toLowerCase().includes(kw))
          .reduce((acc, c) => acc + c.spend, 0);
        return { label: b.name, spend };
      });
      if (items.some((i) => i.spend > 0)) return items;
    }

    if (chartMode === 'keyword' && config.goal_keywords.length > 0) {
      const items = config.goal_keywords.map((kw) => {
        const lower = kw.toLowerCase();
        const spend = filteredCampaigns
          .filter((c) => lower && c.name.toLowerCase().includes(lower))
          .reduce((acc, c) => acc + c.spend, 0);
        return { label: kw.toUpperCase(), spend };
      });
      if (items.some((i) => i.spend > 0)) return items;
    }

    const map = new Map<string, number>();
    for (const c of filteredCampaigns) {
      const g = c.optimization_goal || 'QUALITY LEAD';
      map.set(g, (map.get(g) || 0) + c.spend);
    }
    return Array.from(map.entries()).map(([label, spend]) => ({ label, spend }));
  }, [filteredCampaigns, config.goal_chart_mode, config.brand_filters, config.goal_keywords]);

  // Smart Campaign Alerts
  const smartAlerts = useMemo(() => {
    const list: Array<{ title: string; detail: string; severity: 'warn' | 'info' }> = [];
    for (const c of filteredCampaigns) {
      if (c.frequency >= 3.2 && c.spend > 0) {
        list.push({
          title: `Tần suất cao (${c.frequency.toFixed(1)})`,
          detail: `${c.name} có dấu hiệu lặp tệp, cân nhắc làm mới Creative.`,
          severity: 'warn',
        });
      }
      if (c.spend >= 1_500_000 && c.result === 0 && !c.optimization_goal.includes('REACH')) {
        list.push({
          title: `Chi tiêu chưa ra Result (${formatDomMoneyShort(c.spend, currency)})`,
          detail: `${c.name} đã chi tiêu nhưng chưa ghi nhận chuyển đổi mục tiêu.`,
          severity: 'warn',
        });
      }
    }
    return list.slice(0, 8);
  }, [filteredCampaigns, currency]);

  // Active Ads for Ads Library
  const activeAdsLibrary = useMemo(() => {
    const ads: DomMetaAdNode[] = [];
    for (const c of filteredCampaigns) {
      for (const as of c.adsets) {
        for (const ad of as.ads) {
          if (ad.effective_status.toUpperCase() === 'ACTIVE' || ad.spend > 0) {
            ads.push({
              ...ad,
              campaign_name: ad.campaign_name || c.name,
              adset_name: ad.adset_name || as.name,
            });
          }
        }
      }
    }
    return ads.sort((a, b) => b.spend - a.spend);
  }, [filteredCampaigns]);

  // Google Ads Aggregations & Breakdowns
  const gadsSummary = useMemo(() => {
    const rawCur = gadsData?.currentRows || [];
    const rawPrv = gadsData?.prevRows || [];
    const cur = activeBrandFilter
      ? rawCur.filter((r) => r.campaign.toLowerCase().includes(activeBrandFilter.toLowerCase()))
      : rawCur;
    const prv = activeBrandFilter
      ? rawPrv.filter((r) => r.campaign.toLowerCase().includes(activeBrandFilter.toLowerCase()))
      : rawPrv;

    const sumField = (rows: DomGoogleAdsRow[], k: keyof DomGoogleAdsRow) =>
      rows.reduce((acc, r) => acc + (Number(r[k] || 0) || 0), 0);

    const byCampMap = new Map<
      string,
      {
        campaign: string;
        campaign_id: string;
        spent: number;
        impression: number;
        click: number;
        conv: number;
        calls: number;
        store_visits: number;
      }
    >();
    const byDateMap = new Map<string, DomMetaDailyPoint>();

    for (const r of cur) {
      const prevC = byCampMap.get(r.campaign) || {
        campaign: r.campaign,
        campaign_id: r.campaign_id,
        spent: 0,
        impression: 0,
        click: 0,
        conv: 0,
        calls: 0,
        store_visits: 0,
      };
      if (!prevC.campaign_id && r.campaign_id) prevC.campaign_id = r.campaign_id;
      prevC.spent += r.spent;
      prevC.impression += r.impression;
      prevC.click += r.click;
      prevC.conv += r.all_conversions;
      prevC.calls += r.calls;
      prevC.store_visits += r.store_visits;
      byCampMap.set(r.campaign, prevC);

      const prevD = byDateMap.get(r.date) || {
        date: r.date,
        spend: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        leads: 0,
        messages: 0,
        follows: 0,
        cpm: 0,
      };
      prevD.spend += r.spent;
      prevD.impressions += r.impression;
      prevD.clicks += r.click;
      prevD.leads += r.all_conversions;
      byDateMap.set(r.date, prevD);
    }

    return {
      filteredRows: cur,
      spent: sumField(cur, 'spent'),
      prevSpent: sumField(prv, 'spent'),
      impression: sumField(cur, 'impression'),
      prevImpression: sumField(prv, 'impression'),
      click: sumField(cur, 'click'),
      prevClick: sumField(prv, 'click'),
      conv: sumField(cur, 'all_conversions'),
      prevConv: sumField(prv, 'all_conversions'),
      calls: sumField(cur, 'calls'),
      directions: sumField(cur, 'directions'),
      storeVisits: sumField(cur, 'store_visits'),
      mobile: sumField(cur, 'mobile'),
      desktop: sumField(cur, 'desktop'),
      tablet: sumField(cur, 'tablet'),
      campaigns: Array.from(byCampMap.values()).sort((a, b) => b.spent - a.spent),
      daily: Array.from(byDateMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }, [gadsData, activeBrandFilter]);

  const gadsBreakdowns = useMemo(() => {
    const rows = gadsSummary.filteredRows;
    const validCamp =
      gadsBreakdownCamp !== '__all__' &&
      gadsSummary.campaigns.some((c) => c.campaign === gadsBreakdownCamp)
        ? gadsBreakdownCamp
        : '__all__';
    return {
      effectiveCamp: validCamp,
      hourly: parseGoogleAdsHourlyFromRows(rows, validCamp),
      channels: parseGoogleAdsChannelsFromRows(rows, validCamp),
      locations: parseGoogleAdsLocationsFromRows(rows, validCamp),
    };
  }, [gadsSummary, gadsBreakdownCamp]);

  const handleSaveSettingsPatch = async (patch: DomMetaWorkspacePatch) => {
    const updated = await updateDomMetaWorkspaceConfig(authContext, patch);
    setConfig(updated);
    if (patch.ai_reports) {
      setLocalAiReports(patch.ai_reports);
      saveLocalAiReports(authContext.tenantSlug, patch.ai_reports);
    }
    if (patch.google_ads?.enabled === true) {
      setGadsLoading(true);
      loadDomGoogleAdsDataset(authContext, resolvedRange)
        .then((gd) => setGadsData(gd))
        .catch(() => setGadsData(null))
        .finally(() => setGadsLoading(false));
    }
  };

  const handlePersistAiReports = async (nextReports: DomMetaAiReportEntry[]) => {
    setLocalAiReports(nextReports);
    saveLocalAiReports(authContext.tenantSlug, nextReports);
    setConfig((prev) => ({ ...prev, ai_reports: nextReports }));
    if (canManageConfig) {
      await updateDomMetaWorkspaceConfig(authContext, { ai_reports: nextReports }).catch(() => null);
    }
  };

  const formatCustomMetricVal = (val: number, fmt?: 'money' | 'number' | 'percent') => {
    if (fmt === 'percent') return `${val.toFixed(2)}%`;
    if (fmt === 'number') return formatDomNumber(val);
    return formatDomMoney(val, currency);
  };

  const handleExportCampaignCsv = () => {
    const activeCols = config.column_config.activeColumns;
    const colHeaders = activeCols.map(
      (colId) =>
        DOM_META_METRIC_REGISTRY.find((m) => m.id === colId)?.label ||
        config.column_config.customMetrics?.find((m) => m.id === colId)?.name ||
        colId
    );
    const headers = ['Campaign ID', 'Campaign Name', 'Goal', ...colHeaders];

    const extractCsvValue = (colId: string, c: DomMetaCampaignNode): string | number => {
      const custom = config.column_config.customMetrics?.find((m) => m.id === colId);
      if (custom) {
        const val = evaluateCustomFormula(
          custom.formula,
          c as unknown as Record<string, unknown>
        );
        return custom.format === 'percent' ? val.toFixed(2) : Math.round(val);
      }
      if (colId === 'status') return c.effective_status;
      if (
        colId === 'ctr' ||
        colId === 'hook_rate' ||
        colId === 'hold_rate' ||
        colId === 'frequency' ||
        colId === 'roas'
      ) {
        const rec = c as unknown as Record<string, unknown>;
        return Number(rec[colId] ?? 0).toFixed(2);
      }
      const rec = c as unknown as Record<string, unknown>;
      return Math.round(Number(rec[colId] ?? 0));
    };

    const lines = [
      headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...filteredCampaigns.map((c) =>
        [
          c.id,
          `"${c.name.replace(/"/g, '""')}"`,
          `"${c.optimization_goal}"`,
          ...activeCols.map((colId) => extractCsvValue(colId, c)),
        ].join(',')
      ),
    ];
    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dom-meta-report-${resolvedRange.since}-${resolvedRange.until}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderMetricCell = (
    colId: string,
    row: DomMetaCampaignNode | DomMetaAdsetNode | DomMetaAdNode
  ) => {
    const custom = config.column_config.customMetrics?.find((m) => m.id === colId);
    if (custom) {
      const val = evaluateCustomFormula(
        custom.formula,
        row as unknown as Record<string, unknown>
      );
      return (
        <span className="font-semibold text-slate-800">
          {formatCustomMetricVal(val, custom.format)}
        </span>
      );
    }
    switch (colId) {
      case 'status': {
        const badge = normalizeStatusBadgeInfo(row, referenceNowMs);
        const dailyBudget =
          'daily_budget' in row && typeof row.daily_budget === 'number' ? row.daily_budget : 0;
        const lifetimeBudget =
          'lifetime_budget' in row && typeof row.lifetime_budget === 'number'
            ? row.lifetime_budget
            : 0;
        const startStr = 'start_time' in row ? row.start_time : undefined;
        const endStr =
          'end_time' in row ? row.end_time : 'stop_time' in row ? row.stop_time : undefined;
        const schedText = buildScheduleText(startStr, endStr, badge.tone === 'active');

        return (
          <div className="space-y-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                badge.tone === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : badge.tone === 'complete'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200/70'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  badge.tone === 'active'
                    ? 'bg-emerald-500'
                    : badge.tone === 'complete'
                      ? 'bg-indigo-500'
                      : 'bg-slate-400'
                }`}
              />
              {badge.label}
            </span>
            {(dailyBudget > 0 || lifetimeBudget > 0) && (
              <div className="text-[10.5px] font-semibold text-slate-700 tabular-nums leading-tight">
                <span className="text-slate-400 font-medium">
                  {dailyBudget > 0 ? 'Daily: ' : 'Lifetime: '}
                </span>
                {formatDomMoney(dailyBudget > 0 ? dailyBudget : lifetimeBudget, currency)}
              </div>
            )}
            {schedText && (
              <div className="inline-flex items-center gap-1 text-[10px] text-slate-400 leading-tight">
                <Clock className="w-2.5 h-2.5 shrink-0" />
                <span>{schedText}</span>
              </div>
            )}
          </div>
        );
      }
      case 'spend':
        return (
          <span className="font-medium text-slate-700">
            {formatDomMoney(row.spend, currency)}
          </span>
        );
      case 'result':
        return (
          <div>
            <span className="font-semibold text-slate-800">{formatDomNumber(row.result)}</span>
            <span className="block text-[10px] text-slate-400 uppercase">
              {row.optimization_goal}
            </span>
          </div>
        );
      case 'cpr':
        return row.result > 0 ? (
          <span className="font-semibold text-[#1E40FF]">{formatDomMoney(row.cpr, currency)}</span>
        ) : (
          <span className="text-slate-300">—</span>
        );
      case 'cpm':
        return <span className="text-slate-600">{formatDomMoney(row.cpm, currency)}</span>;
      case 'cpc':
        return <span className="text-slate-600">{formatDomMoney(row.cpc, currency)}</span>;
      case 'ctr':
        return <span className="text-slate-600">{`${row.ctr.toFixed(2)}%`}</span>;
      case 'hook_rate':
        return <span className="text-slate-600">{`${row.hook_rate.toFixed(1)}%`}</span>;
      case 'hold_rate':
        return <span className="text-slate-600">{`${row.hold_rate.toFixed(1)}%`}</span>;
      case 'frequency':
        return <span className="text-slate-600">{row.frequency.toFixed(2)}</span>;
      case 'roas':
        return row.roas > 0 ? (
          <span className="font-semibold text-emerald-700">{row.roas.toFixed(2)}x</span>
        ) : (
          <span className="text-slate-300">—</span>
        );
      default: {
        const rec = row as unknown as Record<string, unknown>;
        return <span className="text-slate-600">{formatDomNumber(Number(rec[colId] ?? 0))}</span>;
      }
    }
  };

  const renderDeltaPill = (curr: number, prev: number, invertSurface = false) => {
    const d = calcDeltaPercent(curr, prev);
    if (d === null) return null;
    const isUp = d >= 0;
    if (invertSurface) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-white text-emerald-700 text-[11px] font-semibold tabular-nums shadow-sm">
          {isUp ? '+' : ''}
          {d.toFixed(1)}%
        </span>
      );
    }
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
          isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
        }`}
      >
        {isUp ? '+' : ''}
        {d.toFixed(1)}%
      </span>
    );
  };

  const navItems: Array<{ id: DomMetaNavView; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ad_detail', label: 'Campaign details', icon: List },
    { id: 'ad_library', label: 'Ads Library', icon: Images },
    { id: 'account', label: 'Ad Account', icon: CreditCard },
    ...(config.google_ads.enabled
      ? [{ id: 'google_ads' as const, label: 'Google ads', icon: TrendingUp }]
      : []),
    ...(capiPanel
      ? [{ id: 'meta_capi' as const, label: capiTabLabel, icon: ShieldCheck }]
      : []),
  ];

  const effectiveFocusAdId = (focusAdId || initialUrlState.focusAdId || '').trim();
  const effectiveFocusCampaignId = (
    focusCampaignId ||
    initialUrlState.focusCampaignId ||
    ''
  ).trim();
  const currentFocusKey = `${effectiveFocusAdId}|${effectiveFocusCampaignId}`;

  const getEntityCrmBucket = useCallback(
    (
      type: 'campaign' | 'adset' | 'ad',
      id: string,
      name?: string
    ): DomMetaCrmEntityBucket | undefined => {
      if (!crmAttribution || !id) return undefined;
      if (type === 'ad') return crmAttribution.by_ad[id];
      if (type === 'adset') return crmAttribution.by_adset[id];
      if (crmAttribution.by_campaign[id]) return crmAttribution.by_campaign[id];
      if (name) {
        const normKey = name.normalize('NFC').trim().toLowerCase();
        if (normKey && crmAttribution.by_campaign_name?.[normKey]) {
          return crmAttribution.by_campaign_name[normKey];
        }
      }
      return undefined;
    },
    [crmAttribution]
  );

  const pendingFocusMatch = (() => {
    if (!currentFocusKey || currentFocusKey === '|' || handledFocusKey === currentFocusKey) {
      return null;
    }
    if (dataset) {
      if (effectiveFocusAdId) {
        for (const c of dataset.campaigns) {
          for (const as of c.adsets) {
            const matchedAd = as.ads.find((a) => a.id === effectiveFocusAdId);
            if (matchedAd) {
              const hasCrm = Boolean(getEntityCrmBucket('ad', matchedAd.id));
              return {
                campaignId: c.id,
                adsetId: as.id,
                modalTarget: {
                  entity: matchedAd,
                  type: 'ad' as const,
                  initialTab:
                    mode === 'embedded' && hasCrm ? ('crm_leads' as const) : initialEntityModalTab,
                },
              };
            }
          }
        }
      }
      if (effectiveFocusCampaignId) {
        const matchedCamp = dataset.campaigns.find(
          (c) =>
            c.id === effectiveFocusCampaignId ||
            c.name.normalize('NFC').trim().toLowerCase() ===
              effectiveFocusCampaignId.normalize('NFC').trim().toLowerCase()
        );
        if (matchedCamp) {
          const hasCrm = Boolean(
            getEntityCrmBucket('campaign', matchedCamp.id, matchedCamp.name)
          );
          return {
            campaignId: matchedCamp.id,
            adsetId: '',
            modalTarget: {
              entity: matchedCamp,
              type: 'campaign' as const,
              initialTab:
                mode === 'embedded' && hasCrm ? ('crm_leads' as const) : initialEntityModalTab,
            },
          };
        }
      }
    }

    // Fallback when focused Ad / Campaign is older than current insights window or in offline CRM mode
    if (!loading && isCrmEnabled) {
      const zeroMetrics = {
        spend: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        link_click: 0,
        leads: 0,
        messages: 0,
        purchases: 0,
        purchase_value: 0,
        roas: 0,
        reaction: 0,
        comments: 0,
        shares: 0,
        follows: 0,
        post_engagement: 0,
        video_play: 0,
        video_3s: 0,
        video_p25: 0,
        video_p50: 0,
        video_p75: 0,
        video_p95: 0,
        thruplay: 0,
        result: 0,
        cpr: 0,
        cpm: 0,
        cpc: 0,
        ctr: 0,
        frequency: 0,
        hook_rate: 0,
        hold_rate: 0,
        actions: {},
      };
      if (effectiveFocusAdId) {
        const fallbackAd: DomMetaAdNode = {
          id: effectiveFocusAdId,
          name: `Bài quảng cáo #${effectiveFocusAdId}`,
          adset_id: '',
          adset_name: '',
          campaign_id: effectiveFocusCampaignId || '',
          campaign_name: '',
          status: 'PAUSED',
          effective_status: 'PAUSED',
          optimization_goal: 'QUALITY LEAD',
          thumbnail_url: '',
          image_url: '',
          post_url: '',
          story_id: '',
          ...zeroMetrics,
        };
        return {
          campaignId: effectiveFocusCampaignId || '',
          adsetId: '',
          modalTarget: {
            entity: fallbackAd,
            type: 'ad' as const,
            initialTab: 'crm_leads' as const,
          },
        };
      }
      if (effectiveFocusCampaignId) {
        const fallbackCamp: DomMetaCampaignNode = {
          id: effectiveFocusCampaignId,
          name: `Chiến dịch #${effectiveFocusCampaignId}`,
          status: 'PAUSED',
          effective_status: 'PAUSED',
          objective: 'LEAD_GENERATION',
          optimization_goal: 'QUALITY LEAD',
          adsets: [],
          ...zeroMetrics,
        };
        return {
          campaignId: effectiveFocusCampaignId,
          adsetId: '',
          modalTarget: {
            entity: fallbackCamp,
            type: 'campaign' as const,
            initialTab: 'crm_leads' as const,
          },
        };
      }
    }
    return null;
  })();

  const effectiveDetailModal = detailModal || pendingFocusMatch?.modalTarget || null;

  const showCrmColumns = Boolean(isCrmEnabled && crmAttribution !== null);
  const showCrmRevenueCol = Boolean(
    showCrmColumns && (erpMode || (crmAttribution?.summary.total_revenue_vnd || 0) > 0)
  );
  const extraCrmColCount = showCrmColumns ? (showCrmRevenueCol ? 4 : 3) : 0;

  const renderCrmAttributionCells = (
    entity: DomMetaCampaignNode | DomMetaAdsetNode | DomMetaAdNode,
    type: 'campaign' | 'adset' | 'ad'
  ) => {
    if (!showCrmColumns) return null;
    const bucket = getEntityCrmBucket(type, entity.id, entity.name);
    const total = bucket?.total_leads || 0;
    const qual = bucket?.qualified_leads || 0;
    const pend = bucket?.pending_leads || 0;
    const neg = bucket?.negative_leads || 0;
    const rev = bucket?.total_revenue_vnd || 0;
    const sales = bucket?.sales || [];
    const cpql = qual > 0 && entity.spend > 0 ? entity.spend / qual : 0;
    const realRoas = rev > 0 && entity.spend > 0 ? rev / entity.spend : 0;
    const qualPct = total > 0 ? Math.round((qual / total) * 100) : 0;
    const pendPct = total > 0 ? Math.round((pend / total) * 100) : 0;
    const negPct = total > 0 ? Math.max(0, 100 - qualPct - pendPct) : 0;
    const salesTooltip = sales
      .map((s) => `${s.name}: ${s.lead_count} khách (${s.qualified_count} chất lượng)`)
      .join(' · ');

    return (
      <>
        <td className="py-2 px-3 whitespace-nowrap">
          {total > 0 ? (
            <button
              type="button"
              data-testid={`open-crm-leads-${entity.id}`}
              onClick={() =>
                setDetailModal({ entity, type, initialTab: 'crm_leads' })
              }
              title="Bấm xem danh sách khách hàng & Sale phụ trách"
              className="text-left group/crm cursor-pointer space-y-1 min-w-[98px]"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-800 group-hover/crm:text-[#1E40FF] tabular-nums">
                  {formatDomNumber(total)}
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold tabular-nums">
                  {bucket?.positive_rate || 0}% CL
                </span>
              </div>
              <div
                className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden flex"
                title={`Chất lượng: ${qual} · Chờ xử lý: ${pend} · Không phù hợp: ${neg}`}
              >
                {qualPct > 0 && (
                  <div className="h-full bg-emerald-500" style={{ width: `${qualPct}%` }} />
                )}
                {pendPct > 0 && (
                  <div className="h-full bg-amber-400" style={{ width: `${pendPct}%` }} />
                )}
                {negPct > 0 && (
                  <div className="h-full bg-rose-400" style={{ width: `${negPct}%` }} />
                )}
              </div>
            </button>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>

        <td className="py-2 px-3 whitespace-nowrap tabular-nums">
          {cpql > 0 ? (
            <span className="font-semibold text-[#1E40FF]">
              {formatDomMoney(cpql, currency)}
            </span>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>

        {showCrmRevenueCol && (
          <td className="py-2 px-3 whitespace-nowrap tabular-nums">
            {rev > 0 ? (
              <div>
                <span className="font-semibold text-emerald-700">
                  {formatDomMoneyShort(rev, currency)}
                </span>
                {realRoas > 0 && (
                  <span className="block text-[10px] font-medium text-slate-500">
                    {realRoas.toFixed(1)}x ROAS
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </td>
        )}

        <td className="py-2 px-3 whitespace-nowrap">
          {sales.length > 0 ? (
            <button
              type="button"
              onClick={() =>
                setDetailModal({ entity, type, initialTab: 'crm_leads' })
              }
              title={salesTooltip}
              className="inline-flex items-center gap-1.5 cursor-pointer group/sale"
            >
              <div className="flex items-center -space-x-1.5">
                {sales.slice(0, 3).map((s) =>
                  s.avatar ? (
                    <img
                      key={s.user_id}
                      src={s.avatar}
                      alt={s.name}
                      className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <span
                      key={s.user_id}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white text-[9.5px] font-semibold flex items-center justify-center ring-2 ring-white"
                    >
                      {getSaleInitials(s.name)}
                    </span>
                  )
                )}
                {sales.length > 3 && (
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[9.5px] font-semibold flex items-center justify-center ring-2 ring-white">
                    +{sales.length - 3}
                  </span>
                )}
              </div>
            </button>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
      </>
    );
  };

  const selectedCompareCampaigns = useMemo(
    () => filteredCampaigns.filter((c) => selectedCampaignIds[c.id]),
    [filteredCampaigns, selectedCampaignIds]
  );

  const hasConnectedAccounts =
    Boolean(activeAccountObj?.ad_account_id) || Boolean(authContext.directAdAccountId);

  const renderSortIcon = (colId: string) => {
    if (!sortConfig || sortConfig.colId !== colId) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />;
    }
    return sortConfig.dir === 'desc' ? (
      <ArrowDown className="w-3 h-3 text-[#1E40FF] shrink-0" />
    ) : (
      <ArrowUp className="w-3 h-3 text-[#1E40FF] shrink-0" />
    );
  };

  const renderCampaignHierarchyCard = (sectionTitle?: string) => (
    <div
      data-testid="campaign-hierarchy-card"
      className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-4"
    >
      {sectionTitle && (
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <List className="w-4 h-4 text-[#1E40FF]" />
            <span>{sectionTitle}</span>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {filteredCampaigns.length} chiến dịch
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc theo tên / ID Campaign, Adset, Ad..."
              className="w-full pl-9 pr-3 py-2 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] text-xs outline-none"
            />
          </div>

          <DomMetaSelect
            ariaLabel="Quick filter chiến dịch"
            testId="campaign-quick-filter"
            value={quickFilter}
            onChange={(val) => setQuickFilter(val as DomQuickFilterKey)}
            variant="pill"
            options={[
              { value: 'all', label: 'Quick filter: Tất cả' },
              { value: 'active', label: 'Active Campaigns' },
              { value: 'spent', label: 'Có chi tiêu (> 0đ)' },
              { value: 'lead', label: 'Lead Campaign', group: 'Mục tiêu (Goal Filters)' },
              { value: 'message', label: 'Message Campaign', group: 'Mục tiêu (Goal Filters)' },
              { value: 'traffic', label: 'Traffic Campaign', group: 'Mục tiêu (Goal Filters)' },
              { value: 'sales', label: 'Sales Campaign', group: 'Mục tiêu (Goal Filters)' },
              { value: 'video', label: 'Video Campaign', group: 'Mục tiêu (Goal Filters)' },
              { value: 'app', label: 'App Promotion', group: 'Mục tiêu (Goal Filters)' },
              { value: 'awareness', label: 'Brand Awareness', group: 'Mục tiêu (Goal Filters)' },
              { value: 'engagement', label: 'Engagement Page', group: 'Mục tiêu (Goal Filters)' },
              { value: 'high_ctr', label: 'High CTR (> 1%)', group: 'Hiệu suất (Performance)' },
              { value: 'high_roas', label: 'High ROAS (> 2)', group: 'Hiệu suất (Performance)' },
            ]}
          />

          <DomMetaSelect
            ariaLabel="Bộ lọc thời hạn kết thúc"
            testId="ending-status-filter"
            value={endingFilter}
            onChange={(val) => setEndingFilter(val as DomEndingFilterKey)}
            variant="pill"
            options={[
              { value: 'all', label: 'Sắp kết thúc: Tất cả' },
              { value: 'ending_1d', label: 'Sắp kết thúc 1 ngày' },
              { value: 'ending_3d', label: 'Sắp kết thúc 3 ngày' },
              { value: 'ended', label: 'Đã kết thúc' },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {config.view_presets.length > 0 && (
            <DomMetaSelect
              ariaLabel="Chọn nhanh Preset cột"
              value=""
              placeholder="Chọn nhanh Preset..."
              align="right"
              variant="pill"
              onChange={(presetId) => {
                const p = config.view_presets.find((x) => x.id === presetId);
                if (!p) return;
                const mergedCustom = [...(config.column_config.customMetrics || [])];
                for (const cm of p.customMetrics || []) {
                  if (!mergedCustom.some((x) => x.id === cm.id)) {
                    mergedCustom.push(cm);
                  }
                }
                const nextCol = {
                  activeColumns: p.activeColumns,
                  customMetrics: mergedCustom,
                };
                setConfig((prev) => ({ ...prev, column_config: nextCol }));
                if (canManageConfig) {
                  void handleSaveSettingsPatch({ column_config: nextCol });
                }
              }}
              options={[
                ...config.view_presets.map((p) => ({
                  value: p.id,
                  label: p.name,
                })),
              ]}
            />
          )}

          <button
            type="button"
            data-testid="open-column-preset"
            onClick={() => setColumnModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-50 hover:bg-blue-50 border border-slate-200 text-xs font-medium text-slate-700 hover:text-[#1E40FF] cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#1E40FF]" />
            <span>Cột &amp; Preset</span>
          </button>

          <button
            type="button"
            onClick={handleExportCampaignCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Selection Summary Bar when >= 1 Campaign is checked */}
      {selectedCompareCampaigns.length >= 1 && (
        <div className="rounded-2xl bg-[#F4F8FF] border border-blue-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-[#1E40FF]">
              Đã chọn {selectedCompareCampaigns.length} chiến dịch
            </span>
            <span className="text-slate-600">
              Spent:{' '}
              <span className="font-semibold text-slate-800 tabular-nums">
                {formatDomMoney(
                  selectedCompareCampaigns.reduce((s, c) => s + c.spend, 0),
                  currency
                )}
              </span>
            </span>
            <span className="text-slate-600">
              Results:{' '}
              <span className="font-semibold text-slate-800 tabular-nums">
                {formatDomNumber(selectedCompareCampaigns.reduce((s, c) => s + c.result, 0))}
              </span>
            </span>
            <span className="text-slate-600">
              Reach:{' '}
              <span className="font-semibold text-slate-800 tabular-nums">
                {formatDomNumber(selectedCompareCampaigns.reduce((s, c) => s + c.reach, 0))}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedCompareCampaigns.length >= 2 && (
              <button
                type="button"
                onClick={() => setCompareCampaignsOpen(true)}
                className="px-3 py-1.5 rounded-full bg-[#1E40FF] text-white font-semibold cursor-pointer"
              >
                So sánh ({selectedCompareCampaigns.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="px-3 py-1.5 rounded-full bg-white border border-blue-200 text-[#1E40FF] font-semibold cursor-pointer"
            >
              AI Phân tích nhóm chọn
            </button>
            <button
              type="button"
              onClick={() => setSelectedCampaignIds({})}
              className="px-2.5 py-1.5 rounded-full text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Closed-Loop CRM Attribution Summary Strip */}
      {showCrmColumns && crmAttribution && crmAttribution.summary.attributed_leads > 0 && (
        <div
          data-testid="crm-attribution-summary-strip"
          className="rounded-2xl bg-gradient-to-r from-[#F4F8FF] via-white to-emerald-50/50 border border-blue-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#1E40FF]">
              <Users className="w-3.5 h-3.5" />
              <span>Đối soát Lead CRM thực tế:</span>
            </span>
            <span className="text-slate-600">
              Lead từ Ads:{' '}
              <strong className="text-slate-900 tabular-nums">
                {formatDomNumber(crmAttribution.summary.attributed_leads)}
              </strong>
            </span>
            <span className="text-slate-600">
              Khách chất lượng:{' '}
              <strong className="text-emerald-700 tabular-nums">
                {formatDomNumber(crmAttribution.summary.qualified_leads)} (
                {Math.round(
                  (crmAttribution.summary.qualified_leads /
                    Math.max(1, crmAttribution.summary.attributed_leads)) *
                    100
                )}
                %)
              </strong>
            </span>
            {crmAttribution.summary.qualified_leads > 0 && (dataset?.currentTotals.spend || 0) > 0 && (
              <span className="text-slate-600">
                CPQL thực:{' '}
                <strong className="text-[#1E40FF] tabular-nums">
                  {formatDomMoney(
                    (dataset?.currentTotals.spend || 0) /
                      crmAttribution.summary.qualified_leads,
                    currency
                  )}
                </strong>
              </span>
            )}
            {crmAttribution.summary.total_revenue_vnd > 0 && (
              <span className="text-slate-600">
                Doanh thu chốt:{' '}
                <strong className="text-emerald-700 tabular-nums">
                  {formatDomMoneyShort(crmAttribution.summary.total_revenue_vnd, currency)}
                </strong>
              </span>
            )}
            {crmAttribution.summary.capi_sent_count > 0 && (
              <span className="text-slate-600">
                Đã gửi CAPI:{' '}
                <strong className="text-slate-800 tabular-nums">
                  {formatDomNumber(crmAttribution.summary.capi_sent_count)}
                </strong>
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Bấm vào số Lead CRM bất kỳ để xem chi tiết khách &amp; Sale phụ trách
          </span>
        </div>
      )}

      <div
        data-testid="campaign-table-scroll"
        className="dom-meta-table-scroll overflow-x-auto overflow-y-auto max-h-[540px] rounded-2xl border border-slate-200/85 bg-white"
      >
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold select-none">
              <th className="sticky top-0 z-20 py-3 px-3 w-8 bg-slate-50 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] text-xs normal-case tracking-normal">
                <input
                  type="checkbox"
                  checked={
                    filteredCampaigns.length > 0 &&
                    filteredCampaigns.every((c) => Boolean(selectedCampaignIds[c.id]))
                  }
                  onChange={(e) => {
                    const next: Record<string, boolean> = {};
                    if (e.target.checked) {
                      filteredCampaigns.forEach((c) => {
                        next[c.id] = true;
                      });
                    }
                    setSelectedCampaignIds(next);
                  }}
                  className="accent-[#1E40FF]"
                />
              </th>
              <th
                className={`sticky top-0 z-20 py-3 px-3 ${
                  showCrmColumns ? 'min-w-[235px]' : 'min-w-[290px]'
                } bg-slate-50 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] text-xs normal-case tracking-normal text-left`}
              >
                <button
                  type="button"
                  data-testid="sort-col-name"
                  onClick={() => handleToggleSortColumn('name')}
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-[#1E40FF] cursor-pointer"
                >
                  <span>Campaign / Adset / Ad</span>
                  {renderSortIcon('name')}
                </button>
              </th>
              {config.column_config.activeColumns.map((colId) => {
                const std = DOM_META_METRIC_REGISTRY.find((m) => m.id === colId);
                const custom = config.column_config.customMetrics?.find((m) => m.id === colId);
                return (
                  <th
                    key={colId}
                    className="sticky top-0 z-20 py-3 px-3 whitespace-nowrap bg-slate-50 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] text-xs normal-case tracking-normal text-left"
                  >
                    <button
                      type="button"
                      data-testid={`sort-col-${colId}`}
                      onClick={() => handleToggleSortColumn(colId)}
                      className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-[#1E40FF] cursor-pointer"
                    >
                      <span>{std?.shortLabel || custom?.name || colId}</span>
                      {renderSortIcon(colId)}
                    </button>
                  </th>
                );
              })}
              {showCrmColumns && (
                <>
                  <th className="sticky top-0 z-20 py-3 px-3 whitespace-nowrap bg-[#F4F8FF] shadow-[inset_0_-1px_0_0_rgba(191,219,254,1)] text-xs normal-case tracking-normal text-left">
                    <button
                      type="button"
                      data-testid="sort-col-crm_leads"
                      onClick={() => handleToggleSortColumn('crm_leads')}
                      className="inline-flex items-center gap-1 font-semibold text-[#1E40FF] cursor-pointer"
                    >
                      <span>Lead CRM</span>
                      {renderSortIcon('crm_leads')}
                    </button>
                  </th>
                  <th className="sticky top-0 z-20 py-3 px-3 whitespace-nowrap bg-[#F4F8FF] shadow-[inset_0_-1px_0_0_rgba(191,219,254,1)] text-xs normal-case tracking-normal text-left">
                    <button
                      type="button"
                      data-testid="sort-col-crm_cpql"
                      onClick={() => handleToggleSortColumn('crm_cpql')}
                      className="inline-flex items-center gap-1 font-semibold text-[#1E40FF] cursor-pointer"
                    >
                      <span>CPQL thực</span>
                      {renderSortIcon('crm_cpql')}
                    </button>
                  </th>
                  {showCrmRevenueCol && (
                    <th className="sticky top-0 z-20 py-3 px-3 whitespace-nowrap bg-[#F4F8FF] shadow-[inset_0_-1px_0_0_rgba(191,219,254,1)] text-xs normal-case tracking-normal text-left">
                      <button
                        type="button"
                        data-testid="sort-col-crm_revenue"
                        onClick={() => handleToggleSortColumn('crm_revenue')}
                        className="inline-flex items-center gap-1 font-semibold text-[#1E40FF] cursor-pointer"
                      >
                        <span>Doanh thu / ROAS</span>
                        {renderSortIcon('crm_revenue')}
                      </button>
                    </th>
                  )}
                  <th className="sticky top-0 z-20 py-3 px-3 whitespace-nowrap bg-[#F4F8FF] shadow-[inset_0_-1px_0_0_rgba(191,219,254,1)] text-xs font-semibold text-[#1E40FF] normal-case tracking-normal text-left">
                    Sale phụ trách
                  </th>
                </>
              )}
              <th className="sticky top-0 z-20 py-3 px-3 text-right bg-slate-50 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] text-xs font-semibold text-slate-600 normal-case tracking-normal">
                Insight
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCampaigns.length === 0 ? (
              <tr>
                <td
                  colSpan={config.column_config.activeColumns.length + extraCrmColCount + 3}
                  className="py-10 text-center text-xs text-slate-400"
                >
                  Không có chiến dịch nào khớp với bộ lọc hiện tại.{' '}
                  {(quickFilter !== 'all' || endingFilter !== 'all' || searchQuery.trim()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickFilter('all');
                        setEndingFilter('all');
                        setSearchQuery('');
                      }}
                      className="text-[#1E40FF] font-semibold hover:underline cursor-pointer ml-1"
                    >
                      Đặt lại bộ lọc
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((camp, campIdx) => {
                const isOpen = Boolean(
                  expandedCampaigns[camp.id] ?? camp.id === pendingFocusMatch?.campaignId
                );
                const campAds = camp.adsets.flatMap((as) => as.ads);
                const campThumbs = collectEntityThumbs(campAds, 3);
                const campActive =
                  camp.effective_status.toUpperCase() === 'ACTIVE' ||
                  camp.adsets.some((as) => as.effective_status.toUpperCase() === 'ACTIVE');
                return (
                  <React.Fragment key={camp.id}>
                    <tr className="group/row hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedCampaignIds[camp.id])}
                          onChange={(e) =>
                            setSelectedCampaignIds((prev) => ({
                              ...prev,
                              [camp.id]: e.target.checked,
                            }))
                          }
                          className="accent-[#1E40FF]"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCampaigns((prev) => ({
                              ...prev,
                              [camp.id]: !isOpen,
                            }))
                          }
                          className="flex items-center gap-2.5 text-left font-medium text-slate-800 hover:text-[#1E40FF] cursor-pointer min-w-0"
                        >
                          <ChevronRight
                            className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                              isOpen ? 'rotate-90 text-[#1E40FF]' : ''
                            }`}
                          />
                          <CreativeThumbFan
                            urls={campThumbs}
                            goal={camp.optimization_goal}
                            active={campActive}
                            variant="campaign"
                            eager={campIdx < 12}
                            alt={camp.name}
                          />
                          <div className="min-w-0">
                            <div className="line-clamp-1">{camp.name}</div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] font-normal text-slate-400 mt-0.5">
                              <span className="font-mono">
                                {camp.adsets.length} adsets · ID: {camp.id}
                              </span>
                              {(Number(camp.daily_budget || 0) > 0 ||
                                Number(camp.lifetime_budget || 0) > 0) && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-50/80 text-[#1E40FF] font-semibold tabular-nums">
                                  {Number(camp.daily_budget || 0) > 0
                                    ? `Daily: ${formatDomMoney(Number(camp.daily_budget), currency)}`
                                    : `Lifetime: ${formatDomMoney(Number(camp.lifetime_budget), currency)}`}
                                </span>
                              )}
                              {buildScheduleText(camp.start_time, camp.stop_time, campActive) && (
                                <span className="inline-flex items-center gap-1 text-slate-500">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>
                                    {buildScheduleText(camp.start_time, camp.stop_time, campActive)}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </td>
                      {config.column_config.activeColumns.map((colId) => (
                        <td key={colId} className="py-2.5 px-3 tabular-nums whitespace-nowrap">
                          {renderMetricCell(colId, camp)}
                        </td>
                      ))}
                      {renderCrmAttributionCells(camp, 'campaign')}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          data-testid={`open-insight-${camp.id}`}
                          onClick={() => setDetailModal({ entity: camp, type: 'campaign' })}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E40FF] font-medium cursor-pointer"
                        >
                          Insight
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Adsets */}
                    {isOpen &&
                      camp.adsets.map((as, asIdx) => {
                        const asOpen = Boolean(
                          expandedAdsets[as.id] ?? as.id === pendingFocusMatch?.adsetId
                        );
                        const asThumbs = collectEntityThumbs(as.ads, 2);
                        const asActive = as.effective_status.toUpperCase() === 'ACTIVE';
                        return (
                          <React.Fragment key={as.id}>
                            <tr className="group/row bg-slate-50/55 hover:bg-blue-50/30 transition-colors">
                              <td className="py-2 px-3" />
                              <td className="py-2 pl-8 pr-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedAdsets((prev) => ({
                                      ...prev,
                                      [as.id]: !asOpen,
                                    }))
                                  }
                                  className="flex items-center gap-2.5 text-left font-medium text-slate-700 hover:text-[#1E40FF] cursor-pointer min-w-0"
                                >
                                  <ChevronRight
                                    className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
                                      asOpen ? 'rotate-90 text-[#1E40FF]' : ''
                                    }`}
                                  />
                                  <CreativeThumbFan
                                    urls={asThumbs}
                                    goal={as.optimization_goal}
                                    active={asActive}
                                    variant="adset"
                                    eager={asIdx < 6}
                                    alt={as.name}
                                  />
                                  <div className="min-w-0">
                                    <span className="line-clamp-1">{as.name}</span>
                                    {(() => {
                                      const effDaily =
                                        as.daily_budget > 0
                                          ? as.daily_budget
                                          : Number(camp.daily_budget || 0);
                                      const effLifetime =
                                        as.lifetime_budget > 0
                                          ? as.lifetime_budget
                                          : Number(camp.lifetime_budget || 0);
                                      const isCbo =
                                        as.daily_budget === 0 &&
                                        as.lifetime_budget === 0 &&
                                        (Number(camp.daily_budget || 0) > 0 ||
                                          Number(camp.lifetime_budget || 0) > 0);
                                      const sched = buildScheduleText(
                                        as.start_time,
                                        as.end_time,
                                        asActive
                                      );
                                      if (!effDaily && !effLifetime && !sched) return null;
                                      return (
                                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-normal text-slate-500 mt-0.5">
                                          {effDaily > 0 && (
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold tabular-nums">
                                              {isCbo ? 'CBO · Daily: ' : 'Daily Budget: '}
                                              {formatDomMoney(effDaily, currency)}
                                            </span>
                                          )}
                                          {effDaily === 0 && effLifetime > 0 && (
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold tabular-nums">
                                              {isCbo ? 'CBO · Lifetime: ' : 'Lifetime Budget: '}
                                              {formatDomMoney(effLifetime, currency)}
                                            </span>
                                          )}
                                          {sched && (
                                            <span className="inline-flex items-center gap-1 text-slate-400">
                                              <Clock className="w-2.5 h-2.5" />
                                              <span>{sched}</span>
                                            </span>
                                          )}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </button>
                              </td>
                              {config.column_config.activeColumns.map((colId) => (
                                <td
                                  key={colId}
                                  className="py-2 px-3 tabular-nums whitespace-nowrap"
                                >
                                  {renderMetricCell(colId, as)}
                                </td>
                              ))}
                              {renderCrmAttributionCells(as, 'adset')}
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setDetailModal({ entity: as, type: 'adset' })}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[#1E40FF] font-medium cursor-pointer"
                                >
                                  Adset
                                </button>
                              </td>
                            </tr>

                            {asOpen &&
                              as.ads.map((ad, adIdx) => (
                                <tr
                                  key={ad.id}
                                  className="group/row bg-white hover:bg-blue-50/20 transition-colors"
                                >
                                  <td className="py-2 px-3" />
                                  <td className="py-2 pl-24 pr-3">
                                    <div className="flex items-center gap-2.5 min-w-0 pl-2.5 border-l-2 border-slate-200/80">
                                      <CreativeThumbFan
                                        urls={[ad.thumbnail_url || ad.image_url].filter(Boolean)}
                                        goal={ad.optimization_goal || as.optimization_goal}
                                        active={ad.effective_status.toUpperCase() === 'ACTIVE'}
                                        variant="ad"
                                        eager={adIdx < 6}
                                        alt={ad.name}
                                      />
                                      <div className="min-w-0">
                                        <span className="font-normal text-slate-700 line-clamp-1">
                                          {ad.name}
                                        </span>
                                        <span className="block text-[10px] font-mono text-slate-400">
                                          ID: {ad.id}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  {config.column_config.activeColumns.map((colId) => (
                                    <td
                                      key={colId}
                                      className="py-2 px-3 tabular-nums whitespace-nowrap"
                                    >
                                      {renderMetricCell(colId, ad)}
                                    </td>
                                  ))}
                                  {renderCrmAttributionCells(ad, 'ad')}
                                  <td className="py-2 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setDetailModal({ entity: ad, type: 'ad' })}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1E40FF] text-white font-medium cursor-pointer"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Ad</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </React.Fragment>
                        );
                      })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div
      className={`${
        mode === 'standalone'
          ? 'min-h-screen flex bg-gradient-to-br from-[#F4F8FF] via-[#F8FAFC] to-[#EEF4FF] relative overflow-x-clip'
          : 'w-full bg-[#F4F6FA] rounded-2xl'
      } dom-meta-scope text-slate-800`}
    >
      {mode === 'standalone' && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute -top-28 left-1/3 w-[480px] h-[480px] rounded-full bg-blue-400/12 blur-3xl" />
          <div className="absolute -bottom-24 right-1/5 w-[440px] h-[440px] rounded-full bg-cyan-400/12 blur-3xl" />
        </div>
      )}

      {/* ====================================================================
          LEFT SIDEBAR — STANDALONE WORKSPACE SHELL (Matching /data CRM Style)
         ==================================================================== */}
      {mode === 'standalone' && (
        <aside className="hidden lg:flex w-[258px] shrink-0 bg-gradient-to-b from-white via-[#F8FAFF] to-[#F1F5F9] border-r border-slate-200/85 shadow-[4px_0_24px_rgba(30,64,255,0.04)] flex-col justify-between p-4 select-none sticky top-0 h-screen z-10">
          <div className="space-y-5">
            {/* Official DOMATION Logo & Meta Report Sub-brand (Framed like /data CRM) */}
            <div className="flex items-center justify-between px-1 pt-1 pb-3 border-b border-slate-100">
              <div
                onClick={onExitStandalone}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 shadow-[0_4px_14px_rgba(30,64,255,0.14)] flex items-center justify-center shrink-0">
                  <DomationLogoMark size={34} />
                </div>
                <div>
                  <div className="text-[17px] font-extrabold tracking-tight text-slate-900 leading-none">
                    DOMATION
                  </div>
                  <div className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-slate-400 mt-1.5">
                    <span className="text-[#1E40FF]">/</span> META REPORT
                  </div>
                </div>
              </div>
            </div>

            {/* PROJECT VIEW Switcher + Workspace Management */}
            <div className="space-y-2">
              <div className="px-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  PROJECT VIEW
                </span>
                {authContext.tenantSlug && (
                  <span className="text-[10px] font-mono font-medium text-[#1E40FF] truncate max-w-[110px]">
                    /{authContext.tenantSlug}
                  </span>
                )}
              </div>
              <button
                type="button"
                data-testid="open-account-manager"
                onClick={() => setAccountModalOpen(true)}
                className="w-full rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/90 hover:border-blue-200 px-3 py-2.5 flex items-center justify-between gap-2 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    D
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {activeAccountObj?.name || workspaceName}
                    </div>
                    <div className="text-[10.5px] font-mono text-slate-500 truncate">
                      {activeAccountObj?.ad_account_id || 'Chưa gắn Ad Account'}
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {(onRequestSwitchWorkspace || onRequestCreateWorkspace) && (
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  {onRequestSwitchWorkspace && (
                    <button
                      type="button"
                      data-testid="standalone-switch-workspace"
                      onClick={onRequestSwitchWorkspace}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-[11px] font-medium text-slate-700 hover:text-[#1E40FF] flex items-center justify-center gap-1 cursor-pointer"
                      title="Chuyển sang Workspace khác"
                    >
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        Workspace{workspacesCount > 1 ? ` (${workspacesCount})` : ''}
                      </span>
                    </button>
                  )}
                  {onRequestCreateWorkspace && (
                    <button
                      type="button"
                      data-testid="standalone-create-workspace"
                      onClick={onRequestCreateWorkspace}
                      className="px-2.5 py-1.5 rounded-xl bg-[#F4F8FF] hover:bg-blue-100/70 border border-blue-200 text-[11px] font-semibold text-[#1E40FF] flex items-center justify-center gap-1 cursor-pointer"
                      title="Khởi tạo thêm Workspace mới"
                    >
                      <PlusCircle className="w-3 h-3 shrink-0" />
                      <span className="truncate">Tạo mới</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* META REPORT Navigation */}
            <div>
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                META REPORT
              </div>
              <nav className="space-y-2">
                {navItems
                  .filter((i) => i.id !== 'google_ads')
                  .map((item) => {
                    const Icon = item.icon;
                    const active = effectiveView === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`nav-${item.id}`}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full px-4 py-3.5 rounded-2xl flex items-center gap-3.5 text-[13px] transition-all cursor-pointer ${
                          active
                            ? 'bg-[#F4F8FF] text-slate-900 font-semibold shadow-[0_1px_4px_rgba(30,64,255,0.12)] border border-blue-200/80'
                            : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon
                          className={`w-[18px] h-[18px] shrink-0 ${
                            active ? 'text-[#1E40FF]' : 'text-slate-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
              </nav>
            </div>

            {/* GOOGLE ADS Conditional Navigation (Hidden when Toggle is OFF!) */}
            {config.google_ads.enabled && (
              <div>
                <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  GOOGLE ADS
                </div>
                <button
                  type="button"
                  data-testid="nav-google_ads"
                  onClick={() => setActiveView('google_ads')}
                  className={`w-full px-4 py-3.5 rounded-2xl flex items-center gap-3.5 text-[13px] transition-all cursor-pointer ${
                    effectiveView === 'google_ads'
                      ? 'bg-[#F4F8FF] text-slate-900 font-semibold shadow-[0_1px_4px_rgba(30,64,255,0.12)] border border-blue-200/80'
                      : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold text-[11px] ${
                      effectiveView === 'google_ads'
                        ? 'bg-[#1E40FF] text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    G
                  </span>
                  <span>Google ads</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom SYSTEM & Ecosystem Links */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              SYSTEM
            </div>
            <button
              type="button"
              data-testid="open-workspace-settings"
              onClick={() => setSettingsModal({ open: true, tab: 'brand' })}
              className="w-full px-4 py-3 rounded-2xl flex items-center gap-3.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <Settings className="w-[18px] h-[18px] text-slate-400" />
              <span>Setting</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full px-4 py-3 rounded-2xl flex items-center gap-3.5 text-[13px] font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <LogOut className="w-[18px] h-[18px]" />
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        </aside>
      )}

      {/* ====================================================================
          MAIN CONTENT CONTAINER
         ==================================================================== */}
      <div className="relative z-10 flex-1 min-w-0 p-4 sm:p-6 lg:px-8 lg:py-5 flex flex-col gap-5">
        {/* Top Header Bar — Classic Compact Capsule Style */}
        <header
          className={
            mode === 'standalone'
              ? 'flex flex-wrap items-center justify-between gap-3 py-1'
              : 'rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_rgba(15,23,42,0.03)] px-4 py-3 flex flex-wrap items-center justify-between gap-3'
          }
        >
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Embedded Mode: Account Pill / Quick-Connect + Sub-Tab Switcher */}
            {mode === 'embedded' && (
              <>
                {hasConnectedAccounts ? (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      data-testid="open-account-manager"
                      onClick={() => setAccountModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{activeAccountObj?.name || 'Chọn tài khoản QC'}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    {canManageConfig && (
                      <button
                        type="button"
                        data-testid="open-quick-connect"
                        onClick={() => setQuickConnectOpen(true)}
                        title="Kết nối nhanh hoặc đồng bộ tài khoản Meta"
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#F4F8FF] hover:bg-blue-100/70 border border-blue-200 text-[#1E40FF] text-xs font-semibold cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Kết nối nhanh</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    data-testid="open-quick-connect"
                    onClick={() => setQuickConnectOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] text-white text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Kết nối nhanh Meta</span>
                  </button>
                )}

                <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl overflow-x-auto">
                  {navItems.map((item) => {
                    const active = effectiveView === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`nav-${item.id}`}
                        onClick={() => setActiveView(item.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-white text-[#1E40FF] font-semibold shadow-sm'
                            : 'text-slate-600 font-medium hover:text-slate-900'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Mobile Sub-Tab Switcher for Standalone (< lg) */}
            {mode === 'standalone' && (
              <div className="flex lg:hidden items-center gap-1 bg-slate-100/90 p-1 rounded-xl overflow-x-auto">
                {navItems.map((item) => {
                  const active = effectiveView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveView(item.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-white text-[#1E40FF] font-semibold shadow-sm'
                          : 'text-slate-600 font-medium hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Classic Date Range Picker Dropdown Pill + Readable Range */}
            <div ref={datePickerRef} className="relative flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="open-date-picker"
                onClick={() => {
                  if (!dateMenuOpen) {
                    setDraftPreset(datePreset);
                    setDraftStart(resolvedRange.since);
                    setDraftEnd(resolvedRange.until);
                    setPickPhase('start');
                    const parts = resolvedRange.until.split('-').map(Number);
                    if (parts[0] && parts[1]) {
                      setCalendarMonth({ year: parts[0], month: parts[1] - 1 });
                    }
                  }
                  setDateMenuOpen((v) => !v);
                }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 shadow-[0_2px_8px_rgba(15,23,42,0.04)] text-xs font-semibold text-slate-800 cursor-pointer transition-colors"
              >
                <Calendar className="w-4 h-4 text-[#1E40FF]" />
                <span>
                  {DATE_PRESET_OPTIONS.find((p) => p.key === datePreset)?.label || 'Last 7 days'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dateMenuOpen && (
                <div className="absolute left-0 top-full mt-2.5 w-[330px] sm:w-[570px] rounded-2xl bg-white border border-slate-200/95 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.22)] z-50 overflow-hidden flex flex-col sm:flex-row">
                  {/* Left Column: Preset Radio List */}
                  <div className="sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100 bg-slate-50/55 p-2.5 grid grid-cols-2 sm:grid-cols-1 gap-0.5">
                    {DATE_PRESET_OPTIONS.map((opt) => {
                      const isSelected = draftPreset === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setDraftPreset(opt.key);
                            if (opt.key !== 'custom_range') {
                              const next = resolveDateRangeFromPreset(opt.key);
                              setDraftStart(next.since);
                              setDraftEnd(next.until);
                              const parts = next.until.split('-').map(Number);
                              if (parts[0] && parts[1]) {
                                setCalendarMonth({ year: parts[0], month: parts[1] - 1 });
                              }
                            }
                          }}
                          className={`w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/90 text-[#1E40FF] font-semibold'
                              : 'text-slate-600 font-medium hover:bg-white'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-[#1E40FF]' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1E40FF]" />
                            )}
                          </span>
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Column: Interactive Monthly Calendar Grid + Footer */}
                  <div className="flex-1 p-4 flex flex-col justify-between gap-3">
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-900">Select Date Range</div>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setCalendarMonth((prev) =>
                              prev.month === 0
                                ? { year: prev.year - 1, month: 11 }
                                : { year: prev.year, month: prev.month - 1 }
                            )
                          }
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="text-xs sm:text-sm font-bold text-slate-800">
                          {CALENDAR_MONTH_NAMES[calendarMonth.month]} {calendarMonth.year}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setCalendarMonth((prev) =>
                              prev.month === 11
                                ? { year: prev.year + 1, month: 0 }
                                : { year: prev.year, month: prev.month + 1 }
                            )
                          }
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                          aria-label="Next month"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
                          <div
                            key={wd}
                            className="text-[11px] font-semibold text-slate-400 py-1"
                          >
                            {wd}
                          </div>
                        ))}
                        {buildCalendarMonthGrid(calendarMonth.year, calendarMonth.month).map(
                          (cell) => {
                            const sMin = draftStart <= draftEnd ? draftStart : draftEnd;
                            const sMax = draftStart <= draftEnd ? draftEnd : draftStart;
                            const isEdge = cell.iso === sMin || cell.iso === sMax;
                            const inRange = cell.iso > sMin && cell.iso < sMax;
                            return (
                              <button
                                key={cell.iso}
                                type="button"
                                onClick={() => {
                                  setDraftPreset('custom_range');
                                  if (pickPhase === 'start') {
                                    setDraftStart(cell.iso);
                                    setDraftEnd(cell.iso);
                                    setPickPhase('end');
                                  } else {
                                    if (cell.iso < draftStart) {
                                      setDraftEnd(draftStart);
                                      setDraftStart(cell.iso);
                                    } else {
                                      setDraftEnd(cell.iso);
                                    }
                                    setPickPhase('start');
                                  }
                                }}
                                className={`h-8 w-full rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                  isEdge
                                    ? 'bg-[#1E40FF] text-white font-bold shadow-xs'
                                    : inRange
                                      ? 'bg-blue-50 text-[#1E40FF] font-semibold'
                                      : cell.inMonth
                                        ? 'text-slate-700 hover:bg-slate-100'
                                        : 'text-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {cell.day}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          value={draftStart}
                          onChange={(e) => {
                            setDraftPreset('custom_range');
                            setDraftStart(e.target.value);
                          }}
                          className="w-[126px] rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 focus:border-[#1E40FF] outline-none"
                        />
                        <span className="text-slate-400 text-xs">-</span>
                        <input
                          type="date"
                          value={draftEnd}
                          onChange={(e) => {
                            setDraftPreset('custom_range');
                            setDraftEnd(e.target.value);
                          }}
                          className="w-[126px] rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 focus:border-[#1E40FF] outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => setDateMenuOpen(false)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDatePreset(draftPreset);
                            if (draftPreset === 'custom_range') {
                              const sMin = draftStart <= draftEnd ? draftStart : draftEnd;
                              const sMax = draftStart <= draftEnd ? draftEnd : draftStart;
                              setCustomStart(sMin);
                              setCustomEnd(sMax);
                            }
                            setLoading(true);
                            setDateMenuOpen(false);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-xs font-semibold text-white shadow-xs cursor-pointer"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <span className="text-xs font-medium text-slate-500 tabular-nums">
              {formatIsoToVnDisplay(resolvedRange.since)} - {formatIsoToVnDisplay(resolvedRange.until)}
            </span>

            {/* Brand Quick Filter */}
            {config.brand_filters.length > 0 && (
              <DomMetaSelect
                ariaLabel="Lọc theo thương hiệu"
                testId="brand-filter-select"
                value={activeBrandFilter}
                onChange={(val) => setActiveBrandFilter(val)}
                variant="pill"
                className="bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] py-2"
                options={[
                  { value: '', label: 'Tất cả thương hiệu' },
                  ...config.brand_filters.map((b) => ({
                    value: b.filter,
                    label: b.name,
                  })),
                ]}
              />
            )}
          </div>

          {/* Right Toolbar — Classic Unified White Pill Capsule */}
          <div className="flex items-center gap-2">
            {dataset && (
              <button
                type="button"
                data-testid="open-ai-summary"
                onClick={() => setAiModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F4F8FF] hover:bg-blue-100/70 border border-blue-200 text-xs font-semibold text-[#1E40FF] transition-colors cursor-pointer"
                title="AI Chẩn đoán hiệu suất"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Phân tích</span>
              </button>
            )}

            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white border border-slate-200/90 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
              {mode === 'standalone' && (
                <div className="hidden sm:flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white text-[10px] font-bold flex items-center justify-center">
                    {userDisplayName.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-slate-700 max-w-[120px] truncate">
                    {userDisplayName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#1E40FF] text-white text-[10px] font-semibold">
                    {formatDomMetaRoleBadge(userRoleLabel)}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={triggerReload}
                title="Làm mới dữ liệu"
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-[#1E40FF] cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#1E40FF]' : ''}`} />
              </button>

              {/* Alerts Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAlertsOpen((v) => !v)}
                  className="relative w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {smartAlerts.length > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {smartAlerts.length}
                    </span>
                  )}
                </button>
                {alertsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-3.5 space-y-2">
                    <div className="text-xs font-semibold text-slate-800">
                      Trung tâm cảnh báo chiến dịch
                    </div>
                    {smartAlerts.length === 0 ? (
                      <div className="text-xs text-slate-500 py-3 text-center">
                        Mọi chiến dịch đang phân phối ổn định
                      </div>
                    ) : (
                      smartAlerts.map((al, i) => (
                        <div
                          key={i}
                          className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-2.5 text-xs"
                        >
                          <div className="font-semibold text-amber-900">{al.title}</div>
                          <div className="text-[11px] text-amber-800 mt-0.5">{al.detail}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {mode === 'embedded' && (
                <button
                  type="button"
                  data-testid="open-workspace-settings"
                  onClick={() => setSettingsModal({ open: true, tab: 'brand' })}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
                  title="Cài đặt Workspace"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                data-testid="copy-share-url"
                onClick={() => setShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 text-xs font-medium text-slate-700 cursor-pointer transition-colors"
                title="Chia sẻ báo cáo & phân quyền truy cập"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </header>

        {/* Empty Onboarding Prompt when no Meta Ad Account connected yet — Vertically Centered Quiet Luxury Card */}
        {!loading && !hasConnectedAccounts && effectiveView !== 'meta_capi' && (
          <div className="flex-1 min-h-[calc(100vh-140px)] flex items-center justify-center py-6">
            <div className="w-full max-w-xl rounded-[28px] bg-white/95 backdrop-blur-xl border border-slate-200/85 shadow-[0_20px_50px_-15px_rgba(30,64,255,0.12)] p-8 sm:p-11 text-center relative overflow-hidden">
              <div className="relative space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white flex items-center justify-center mx-auto shadow-[0_14px_28px_-8px_rgba(30,64,255,0.45)]">
                  <KeyRound className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-[11px] font-semibold uppercase tracking-wider text-[#1E40FF]">
                    KHỞI TẠO BÁO CÁO QUẢNG CÁO
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                    Kết Nối Tài Khoản Quảng Cáo Meta
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                    Tự động đồng bộ toàn bộ chiến dịch, phân tích tỷ lệ giữ chân video 3 giây và đối soát trực tiếp từng khách hàng cùng Sale phụ trách.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {['Biết rõ bài nào ra khách', 'Đối soát Sale & CPQL', 'Cảnh báo Video 3s'].map(
                    (chip) => (
                      <span
                        key={chip}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700"
                      >
                        <Check className="w-3 h-3 text-[#1E40FF]" />
                        <span>{chip}</span>
                      </span>
                    )
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    data-testid="onboarding-quick-connect-btn"
                    onClick={() =>
                      mode === 'embedded' ? setQuickConnectOpen(true) : setAccountModalOpen(true)
                    }
                    className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-xs sm:text-sm font-semibold shadow-[0_12px_28px_-8px_rgba(30,64,255,0.5)] cursor-pointer inline-flex items-center gap-2 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Kết Nối Tài Khoản Meta Ngay</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 px-5 py-3.5 flex items-center justify-between gap-4 text-xs font-medium text-rose-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setAccountModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 font-semibold cursor-pointer shrink-0"
            >
              Kiểm tra Token
            </button>
          </div>
        )}

        {/* Loading Skeleton — Matching 3-Row Dashboard Structure */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200/80 p-3.5 space-y-2.5">
                <div className="h-[108px] rounded-xl bg-gradient-to-r from-blue-600/20 to-cyan-500/20 animate-pulse p-3.5 flex flex-col justify-between">
                  <div className="h-3 w-16 rounded bg-blue-300/60" />
                  <div className="h-6 w-36 rounded bg-blue-300/70" />
                </div>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[58px] rounded-xl bg-slate-50 border border-slate-100 p-3 animate-pulse flex flex-col justify-between">
                    <div className="h-2.5 w-20 rounded bg-slate-200" />
                    <div className="h-4 w-24 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
              <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
                  <div className="h-7 w-32 rounded-full bg-slate-100 animate-pulse" />
                </div>
                <div className="h-[220px] rounded-xl bg-gradient-to-t from-blue-50/80 via-slate-50/40 to-transparent animate-pulse mt-4" />
              </div>
              <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
                  <div className="h-7 w-24 rounded-lg bg-slate-100 animate-pulse" />
                </div>
                <div className="h-[210px] flex items-end justify-around gap-5 px-4 pt-6">
                  <div className="w-14 h-[82%] rounded-t-lg bg-blue-100 animate-pulse" />
                  <div className="w-14 h-[35%] rounded-t-lg bg-slate-200 animate-pulse" />
                  <div className="w-14 h-[18%] rounded-t-lg bg-slate-100 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4 h-[230px] rounded-2xl bg-white border border-slate-200/80 p-5 animate-pulse space-y-4">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="h-24 rounded-xl bg-slate-100" />
                  <div className="h-24 rounded-xl bg-slate-100" />
                </div>
              </div>
              <div className="lg:col-span-4 h-[230px] rounded-2xl bg-white border border-slate-200/80 p-5 animate-pulse space-y-3">
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="grid grid-cols-2 gap-4 items-center pt-2">
                  <div className="space-y-2">
                    <div className="h-11 rounded-xl bg-slate-100" />
                    <div className="h-11 rounded-xl bg-slate-100" />
                  </div>
                  <div className="w-32 h-32 rounded-full border-[14px] border-slate-100 mx-auto" />
                </div>
              </div>
              <div className="lg:col-span-4 h-[230px] rounded-2xl bg-white border border-slate-200/80 p-5 animate-pulse flex flex-col justify-between">
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="h-[150px] flex items-end justify-around gap-3 px-2">
                  {[45, 75, 92, 60, 35].map((h, i) => (
                    <div key={i} className="w-8 rounded-t-lg bg-slate-200" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            VIEW 1: DASHBOARD — Executive Overview Layout + Campaign Tree at Bottom
           ==================================================================== */}
        {!loading && dataset && effectiveView === 'dashboard' && (
          <div className="space-y-4">
            {/* ROW 1: Spent KPI Stack + Daily Spent Area Chart + Meta Goal Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* KPI Stack Card */}
              <div className="lg:col-span-3 relative rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-3.5 flex flex-col justify-between gap-2.5">
                <button
                  type="button"
                  data-testid="open-perf-compare"
                  onClick={() => setPerfCompareOpen(true)}
                  title="Báo cáo đối soát kỳ trước"
                  className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-[#1E40FF] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Hero Royal Sapphire Spent Card */}
                <div className="rounded-xl bg-gradient-to-br from-[#1E40FF] via-[#1B4DFF] to-[#0284C7] text-white p-4 shadow-[0_10px_24px_-8px_rgba(30,64,255,0.45)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-white/90">Spent</span>
                    {renderDeltaPill(
                      dataset.currentTotals.spend,
                      dataset.prevTotals.spend,
                      true
                    )}
                  </div>
                  <div className="text-2xl xl:text-[26px] font-bold tracking-tight mt-2 tabular-nums">
                    {formatDomMoney(dataset.currentTotals.spend, currency)}
                  </div>
                </div>

                {/* 3 Customizable Secondary KPI Cards */}
                {(config.summary_metrics?.length === 3
                  ? config.summary_metrics
                  : ['reach', 'leads', 'impressions']
                ).map((metricId) => {
                  const optMeta = DOM_META_SUMMARY_KPI_OPTIONS.find((o) => o.id === metricId);
                  const curRec = dataset.currentTotals as unknown as Record<string, number | undefined>;
                  const prvRec = dataset.prevTotals as unknown as Record<string, number | undefined>;
                  const isLeadFallback =
                    metricId === 'leads' &&
                    dataset.currentTotals.leads === 0 &&
                    dataset.currentTotals.messages > 0;
                  const currVal = isLeadFallback
                    ? dataset.currentTotals.messages
                    : Number(curRec[metricId] ?? 0);
                  const prevVal = isLeadFallback
                    ? dataset.prevTotals.messages
                    : Number(prvRec[metricId] ?? 0);
                  const kpiLabel = isLeadFallback
                    ? 'Messages'
                    : optMeta?.shortLabel || metricId;
                  const fmt = optMeta?.format || 'number';
                  const formattedVal =
                    fmt === 'money'
                      ? formatDomMoney(currVal, currency)
                      : fmt === 'percent'
                        ? `${currVal.toFixed(2)}%`
                        : fmt === 'decimal'
                          ? currVal.toFixed(2)
                          : formatDomNumber(currVal);

                  return (
                    <div
                      key={metricId}
                      className="rounded-xl bg-slate-50/95 border border-slate-100 px-3.5 py-2.5 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">{kpiLabel}</span>
                        {renderDeltaPill(currVal, prevVal)}
                      </div>
                      <div className="text-base sm:text-[17px] font-semibold text-slate-700 mt-1 tabular-nums">
                        {formattedVal}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Daily Spent Smooth Area Chart */}
              <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <TrendingUp className="w-4 h-4 text-[#1E40FF]" />
                    <span>Daily Spent</span>
                  </div>
                  <DomMetaSelect
                    ariaLabel="Chọn chỉ số biểu đồ theo ngày"
                    value={dailyMetric}
                    onChange={(val) => setDailyMetric(val as DailyMetricKey)}
                    align="right"
                    variant="pill"
                    options={[
                      { value: 'spend', label: 'Spent' },
                      { value: 'impressions', label: 'Impressions' },
                      { value: 'reach', label: 'Reach' },
                      { value: 'leads', label: 'Leads' },
                      { value: 'messages', label: 'Messages' },
                      { value: 'follows', label: 'Follows' },
                      { value: 'cpm', label: 'CPM' },
                    ]}
                  />
                </div>
                <DailyTrendAreaChart
                  data={dataset.daily}
                  metric={dailyMetric}
                  currency={currency}
                />
              </div>

              {/* Meta Goal Bar Chart */}
              <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Target className="w-4 h-4 text-[#1E40FF]" />
                    <span>Meta Goal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const order: Array<'goal' | 'keyword' | 'brand'> = [
                          'goal',
                          'keyword',
                          'brand',
                        ];
                        const nextMode =
                          order[(order.indexOf(config.goal_chart_mode || 'goal') + 1) % order.length];
                        setConfig((prev) => ({ ...prev, goal_chart_mode: nextMode }));
                        if (canManageConfig) {
                          void handleSaveSettingsPatch({ goal_chart_mode: nextMode });
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-[11px] font-medium text-slate-700 hover:text-[#1E40FF] cursor-pointer"
                      title="Chuyển chế độ gom nhóm cột: Optimization Goal / Keyword / Brand"
                    >
                      ⇄{' '}
                      {config.goal_chart_mode === 'brand'
                        ? 'Brand'
                        : config.goal_chart_mode === 'keyword'
                          ? 'Keyword'
                          : 'Goal'}
                    </button>
                    <button
                      type="button"
                      data-testid="open-goal-settings"
                      onClick={() => setSettingsModal({ open: true, tab: 'goals' })}
                      className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-[#1E40FF] cursor-pointer"
                      title="Cài đặt từ khóa Goal & 3 chỉ số KPI"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <MetaGoalBarChart items={metaGoalBars} currency={currency} />
              </div>
            </div>

            {/* ROW 2: Active Status + Interaction | Spent Platform Donut | Age & Gender */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5 flex flex-col justify-between gap-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: 'Active Campaign',
                      active: dataset.counts.activeCampaigns,
                      total: dataset.counts.totalCampaigns,
                    },
                    {
                      label: 'Active Adset',
                      active: dataset.counts.activeAdsets,
                      total: dataset.counts.totalAdsets,
                    },
                    {
                      label: 'Active Ads',
                      active: dataset.counts.activeAds,
                      total: dataset.counts.totalAds,
                    },
                  ].map((st) => (
                    <div
                      key={st.label}
                      className="rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-2.5"
                    >
                      <div className="text-[10.5px] font-medium text-slate-500 leading-tight truncate">
                        {st.label}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-sm sm:text-[15px] font-semibold text-slate-700 tabular-nums">
                          {st.active}/{st.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-2.5">Interaction</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['Video Plays', dataset.currentTotals.video_play],
                      ['ThruPlays', dataset.currentTotals.thruplay],
                      ['Link Click', dataset.currentTotals.link_click],
                      ['Post Engagement', dataset.currentTotals.post_engagement],
                      ['Reactions', dataset.currentTotals.reaction],
                      ['Follows', dataset.currentTotals.follows],
                    ].map(([lbl, val]) => (
                      <div
                        key={String(lbl)}
                        className="rounded-xl bg-slate-50/90 border border-slate-100 px-2.5 py-2.5"
                      >
                        <div className="text-[10.5px] font-medium text-slate-500 leading-tight truncate">
                          {lbl}
                        </div>
                        <div className="text-sm sm:text-[15px] font-semibold text-slate-700 mt-1 tabular-nums">
                          {formatDomNumber(Number(val || 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5">
                <SpentPlatformDonutCard
                  platforms={dataset.platforms}
                  positions={dataset.positions}
                  currency={currency}
                />
              </div>

              <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#1E40FF]" />
                    <span>Age &amp; Gender</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAgeOnly((v) => !v)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      ageOnly
                        ? 'bg-[#1E40FF] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-[#1E40FF]'
                    }`}
                  >
                    {ageOnly ? 'By Gender' : 'Age Only'}
                  </button>
                </div>
                <AgeGenderBarChart
                  buckets={dataset.ageGender}
                  ageOnly={ageOnly}
                  currency={currency}
                />
              </div>
            </div>

            {/* ROW 3: Dayparting Heatmap (8 cols) + Region Spent (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Clock className="w-4 h-4 text-[#1E40FF]" />
                    <span>Dayparting Heatmap</span>
                  </div>
                  <DomMetaSelect
                    ariaLabel="Chọn chỉ số Dayparting Heatmap"
                    value={heatmapMetric}
                    onChange={(val) => setHeatmapMetric(val as HeatmapMetricKey)}
                    align="right"
                    variant="pill"
                    options={[
                      { value: 'spend', label: 'Spend' },
                      { value: 'leads', label: 'Leads' },
                      { value: 'messages', label: 'Messages' },
                      { value: 'purchases', label: 'Purchases' },
                      { value: 'clicks', label: 'Clicks' },
                    ]}
                  />
                </div>
                <DaypartingHeatmapGrid
                  cells={dataset.heatmap}
                  metric={heatmapMetric}
                  currency={currency}
                />
              </div>

              <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  <MapPin className="w-4 h-4 text-[#1E40FF]" />
                  <span>Region Spent</span>
                </div>
                <RegionSpentBarChart regions={dataset.regions} currency={currency} />
              </div>
            </div>

            {/* Expandable Extra Details */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowExtraDetails((v) => !v)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-medium text-slate-700 hover:text-[#1E40FF] cursor-pointer"
              >
                <span>
                  {showExtraDetails
                    ? 'Thu gọn Extra Details'
                    : 'Mở rộng Extra Details & Creative Hook Rate'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    showExtraDetails ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {showExtraDetails && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white/95 border border-slate-200/85 shadow-[0_2px_12px_rgba(15,23,42,0.03)] p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#1E40FF]" />
                      <span>Video Funnel (Hook &amp; Hold Rate)</span>
                    </h3>
                    <span className="text-[11px] font-medium text-slate-400">Creative</span>
                  </div>
                  <VideoFunnelBars
                    impressions={dataset.currentTotals.impressions}
                    video3s={dataset.currentTotals.video_3s}
                    thruplay={dataset.currentTotals.thruplay}
                    linkClicks={dataset.currentTotals.link_click}
                  />
                </div>

                <div className="rounded-2xl bg-white/95 border border-slate-200/85 shadow-[0_2px_12px_rgba(15,23,42,0.03)] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#06B6D4]" />
                      <span>Device Breakdown</span>
                    </h3>
                    <span className="text-[11px] font-medium text-slate-400">
                      {dataset.devices.length} thiết bị
                    </span>
                  </div>
                  <div className="space-y-3 pt-1">
                    {dataset.devices.map((dv) => {
                      const totalDvSpend = Math.max(
                        dataset.devices.reduce((acc, x) => acc + x.spend, 0),
                        1
                      );
                      const maxDv = Math.max(...dataset.devices.map((x) => x.spend), 1);
                      const barPct = Math.max(5, Math.round((dv.spend / maxDv) * 100));
                      const sharePct = ((dv.spend / totalDvSpend) * 100).toFixed(1);
                      return (
                        <div key={dv.device} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="font-medium capitalize text-slate-700">
                              {dv.device.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center gap-2 tabular-nums">
                              <span className="text-[11px] font-medium text-slate-400">
                                {sharePct}%
                              </span>
                              <span className="font-semibold text-slate-800">
                                {formatDomMoney(dv.spend, currency)}
                              </span>
                            </div>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/95 border border-slate-200/85 shadow-[0_2px_12px_rgba(15,23,42,0.03)] p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#0284C7]" />
                      <span>Top 5 Campaigns by Spend</span>
                    </h3>
                    <span className="text-[11px] font-medium text-slate-400">Chi tiêu cao</span>
                  </div>
                  <div className="space-y-2 pt-0.5">
                    {filteredCampaigns.slice(0, 5).map((c, i) => (
                      <div
                        key={c.id}
                        className="rounded-xl bg-slate-50/90 border border-slate-100 px-3 py-2 flex items-center justify-between gap-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                              i === 0
                                ? 'bg-[#1E40FF] text-white'
                                : 'bg-slate-200/80 text-slate-700'
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="font-medium text-slate-700 truncate">{c.name}</span>
                        </div>
                        <span className="font-semibold text-[#1E40FF] tabular-nums shrink-0">
                          {formatDomMoneyShort(c.spend, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ROW 4: Hierarchical Campaign -> Adset -> Ad Tree directly on Dashboard (DOMATION_META parity) */}
            {renderCampaignHierarchyCard('Campaign Details — Cây Chiến Dịch Đa Tầng')}
          </div>
        )}

        {/* ====================================================================
            VIEW 2: CAMPAIGN DETAILS — Full Hierarchical Tree + Filters + Sort
           ==================================================================== */}
        {!loading && dataset && effectiveView === 'ad_detail' && renderCampaignHierarchyCard()}

        {/* ====================================================================
            VIEW 3: ADS LIBRARY — Active Creative Cards + Hook/Hold Rate
           ==================================================================== */}
        {!loading && dataset && effectiveView === 'ad_library' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200/80 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Images className="w-5 h-5 text-[#1E40FF]" />
                <h2 className="text-base font-semibold text-slate-800">
                  Ads Library — Thư Viện Quảng Cáo &amp; Creative Hook Rate
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {activeAdsLibrary.length} mẫu quảng cáo ghi nhận phân phối
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeAdsLibrary.slice(0, 24).map((ad, idx) => (
                <div
                  key={ad.id}
                  className="rounded-2xl bg-white border border-slate-200/85 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-900 via-[#1E40FF]/90 to-[#0284C7] overflow-hidden">
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white/90 select-none">
                        <Images className="w-7 h-7 text-cyan-300 mb-1.5 opacity-90" />
                        <span className="text-[11px] font-semibold line-clamp-2 max-w-[90%]">
                          {ad.name}
                        </span>
                        <span className="text-[9.5px] text-cyan-200/80 mt-0.5 font-mono">
                          {ad.optimization_goal || 'META CREATIVE'}
                        </span>
                      </div>
                      {(ad.thumbnail_url || ad.image_url) && (
                        <img
                          src={ad.thumbnail_url || ad.image_url}
                          alt={ad.name}
                          className="relative z-10 w-full h-full object-cover bg-slate-100"
                          loading={idx < 8 ? 'eager' : 'lazy'}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <span className="absolute top-2.5 left-2.5 z-20 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-semibold">
                        {ad.effective_status}
                      </span>
                      {ad.hook_rate > 0 && (
                        <span className="absolute top-2.5 right-2.5 z-20 px-2.5 py-0.5 rounded-full bg-[#1E40FF] text-white text-[10px] font-semibold">
                          Hook {ad.hook_rate.toFixed(1)}%
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="text-[10.5px] font-medium text-[#1E40FF] truncate">
                        {ad.campaign_name}
                      </div>
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2">
                        {ad.name}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10.5px] text-slate-400 block">Spent</span>
                          <span className="font-semibold text-slate-800 tabular-nums">
                            {formatDomMoneyShort(ad.spend, currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10.5px] text-slate-400 block">Results</span>
                          <span className="font-semibold text-slate-800 tabular-nums">
                            {formatDomNumber(ad.result)}
                          </span>
                        </div>
                      </div>

                      {showCrmColumns && (() => {
                        const adBucket = getEntityCrmBucket('ad', ad.id);
                        if (!adBucket || adBucket.total_leads === 0) return null;
                        const adCpql =
                          adBucket.qualified_leads > 0 && ad.spend > 0
                            ? ad.spend / adBucket.qualified_leads
                            : 0;
                        return (
                          <button
                            type="button"
                            onClick={() =>
                              setDetailModal({
                                entity: ad,
                                type: 'ad',
                                initialTab: 'crm_leads',
                              })
                            }
                            className="w-full mt-1 rounded-xl bg-[#F4F8FF] hover:bg-blue-100/70 border border-blue-200/80 px-3 py-2 text-left space-y-1.5 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="font-semibold text-[#1E40FF]">
                                Lead CRM: {adBucket.total_leads} ({adBucket.positive_rate}% CL)
                              </span>
                              {adCpql > 0 && (
                                <span className="font-semibold text-slate-700 tabular-nums">
                                  CPQL: {formatDomMoneyShort(adCpql, currency)}
                                </span>
                              )}
                            </div>
                            {adBucket.sales.length > 0 && (
                              <div className="flex items-center justify-between gap-2 text-[10.5px] text-slate-600">
                                <div className="flex items-center -space-x-1">
                                  {adBucket.sales.slice(0, 3).map((s) => (
                                    <span
                                      key={s.user_id}
                                      className="w-4 h-4 rounded-full bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white text-[8px] font-bold flex items-center justify-center ring-1 ring-white"
                                    >
                                      {getSaleInitials(s.name)}
                                    </span>
                                  ))}
                                </div>
                                <span className="truncate">
                                  {adBucket.sales[0]?.name}
                                  {adBucket.sales.length > 1
                                    ? ` +${adBucket.sales.length - 1}`
                                    : ''}
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailModal({ entity: ad, type: 'ad' })}
                      className="text-xs font-semibold text-[#1E40FF] hover:underline cursor-pointer"
                    >
                      Xem Insight Chi Tiết →
                    </button>
                    {ad.post_url && (
                      <a
                        href={ad.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-700"
                        title="Mở bài viết Facebook"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================================
            VIEW 4: AD ACCOUNT — Balance + VAT + Monthly Spend + Activity Logs
           ==================================================================== */}
        {!loading && dataset && effectiveView === 'account' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1E40FF] to-[#0284C7] text-white p-5 space-y-2">
                  <div className="text-xs font-medium text-cyan-200">
                    {dataset.accountOverview?.name || activeAccountObj?.name || 'Meta Ad Account'}
                  </div>
                  <div className="text-2xl font-bold tabular-nums">
                    {formatDomMoney(dataset.currentTotals.spend, currency)}
                  </div>
                  <div className="text-[11px] text-white/80">
                    {dataset.accountOverview?.funding_source || 'Thanh toán trực tiếp Meta Ads'}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-1">
                  <div className="text-xs font-medium text-slate-500">
                    Ước tính bao gồm thuế VAT (+10%)
                  </div>
                  <div className="text-xl font-semibold text-slate-800 tabular-nums">
                    {formatDomMoney(dataset.currentTotals.spend * 1.1, currency)}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 rounded-2xl bg-white border border-slate-200/80 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="text-sm font-semibold text-slate-800">
                    Advertising by Month ({selectedYear})
                  </div>
                  <div className="flex items-center gap-2">
                    <DomMetaSelect
                      ariaLabel="Chọn chỉ số biểu đồ theo tháng"
                      value={yearMetric}
                      onChange={(val) => setYearMetric(val as YearMetricKey)}
                      align="right"
                      variant="pill"
                      options={[
                        { value: 'spend', label: 'Spent' },
                        { value: 'leads', label: 'Leads' },
                        { value: 'reach', label: 'Reach' },
                        { value: 'messages', label: 'Messages' },
                        { value: 'follows', label: 'Follows' },
                      ]}
                    />
                    <DomMetaSelect
                      ariaLabel="Chọn năm thống kê"
                      value={selectedYear}
                      onChange={(val) => {
                        setLoading(true);
                        setSelectedYear(Number(val));
                      }}
                      align="right"
                      variant="pill"
                      options={[0, 1, 2].map((off) => {
                        const y = new Date().getFullYear() - off;
                        return { value: y, label: `Năm ${y}` };
                      })}
                    />
                  </div>
                </div>
                <MonthlyYearBarChart
                  months={dataset.monthlyByYear}
                  metric={yearMetric}
                  currency={currency}
                />
              </div>
            </div>

            {/* Admin Activities Logs */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                  Activities Logs — Nhật Ký Thao Tác Tài Khoản Quảng Cáo
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {['ALL', 'CAMPAIGN', 'AD_SET', 'AD', 'BUDGET', 'STATUS', 'TARGETING'].map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActivityCat(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                          activityCat === cat
                            ? 'bg-[#1E40FF] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="dom-meta-table-scroll space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {dataset.activities
                  .filter((a) => activityCat === 'ALL' || a.category === activityCat)
                  .slice(0, 30)
                  .map((act, i) => (
                    <div
                      key={`${act.event_time}-${i}`}
                      className="rounded-xl bg-slate-50/90 border border-slate-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800">
                          {act.translated_event_type} ·{' '}
                          <span className="text-[#1E40FF] font-semibold">{act.object_name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Thực hiện bởi: <span className="font-medium text-slate-700">{act.actor_name}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {act.event_time ? new Date(act.event_time).toLocaleString('vi-VN') : ''}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            VIEW 5: GOOGLE ADS REPORT (ONLY WHEN TOGGLED ON!)
           ==================================================================== */}
        {!loading && config.google_ads.enabled && effectiveView === 'google_ads' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200/80 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                <Sparkles className="w-4 h-4 text-[#1E40FF]" />
                <span>
                  Google Ads Customer ID:{' '}
                  <span className="font-mono font-semibold text-slate-800">
                    {config.google_ads.customer_id || 'Chưa nhập'}
                  </span>
                </span>
                {gadsData?.syncedAt && (
                  <span>
                    · Đồng bộ lúc:{' '}
                    <span className="font-medium text-slate-700">
                      {new Date(gadsData.syncedAt).toLocaleString('vi-VN')}
                    </span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSettingsModal({ open: true, tab: 'google_ads' })}
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-[#1E40FF] text-xs font-semibold cursor-pointer"
              >
                Cấu hình &amp; Hướng dẫn 5 bước
              </button>
            </div>

            {gadsLoading ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-xs text-slate-500">
                Đang đồng bộ dữ liệu Google Ads...
              </div>
            ) : (
              <>
                {/* Row 1: KPI Stack + Daily Trend + Bar by Campaign */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200/80 p-3.5 space-y-2.5">
                    <div className="rounded-xl bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/90">Google Ads Spent</span>
                        {renderDeltaPill(gadsSummary.spent, gadsSummary.prevSpent, true)}
                      </div>
                      <div className="text-2xl font-bold mt-2 tabular-nums">
                        {formatDomMoney(gadsSummary.spent, 'VND')}
                      </div>
                    </div>
                    {[
                      ['Impressions', gadsSummary.impression, gadsSummary.prevImpression],
                      ['Clicks', gadsSummary.click, gadsSummary.prevClick],
                      ['Conversions', gadsSummary.conv, gadsSummary.prevConv],
                    ].map(([lbl, curV, prvV]) => (
                      <div
                        key={String(lbl)}
                        className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500">{lbl}</span>
                          {renderDeltaPill(Number(curV), Number(prvV))}
                        </div>
                        <div className="text-base font-semibold text-slate-700 mt-1 tabular-nums">
                          {formatDomNumber(Number(curV))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/80 p-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-800">
                        Google Ads Daily Trend
                      </span>
                      <DomMetaSelect
                        ariaLabel="Chọn chỉ số Google Ads Daily Trend"
                        value={gadsTrendMetric}
                        onChange={(val) => setGadsTrendMetric(val as GadsTrendMetricKey)}
                        align="right"
                        variant="pill"
                        options={[
                          { value: 'spend', label: 'Spent' },
                          { value: 'clicks', label: 'Clicks' },
                          { value: 'impressions', label: 'Impressions' },
                          { value: 'leads', label: 'All Conversions' },
                        ]}
                      />
                    </div>
                    <DailyTrendAreaChart
                      data={gadsSummary.daily}
                      metric={gadsTrendMetric}
                      currency="VND"
                    />
                  </div>

                  <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-800">
                        Hiệu Quả Theo Chiến Dịch
                      </span>
                      <DomMetaSelect
                        ariaLabel="Chọn chỉ số hiệu quả chiến dịch Google Ads"
                        value={gadsBarMetric}
                        onChange={(val) => setGadsBarMetric(val as GadsBarMetricKey)}
                        align="right"
                        variant="pill"
                        options={[
                          { value: 'spent', label: 'Spent' },
                          { value: 'click', label: 'Clicks' },
                          { value: 'conv', label: 'Conversions' },
                          { value: 'cpc', label: 'CPC' },
                          { value: 'cpa', label: 'CPA' },
                        ]}
                      />
                    </div>
                    <MetaGoalBarChart
                      items={gadsSummary.campaigns.map((c) => {
                        const cpc = c.click > 0 ? c.spent / c.click : 0;
                        const cpa = c.conv > 0 ? c.spent / c.conv : 0;
                        const val =
                          gadsBarMetric === 'click'
                            ? c.click
                            : gadsBarMetric === 'conv'
                              ? c.conv
                              : gadsBarMetric === 'cpc'
                                ? cpc
                                : gadsBarMetric === 'cpa'
                                  ? cpa
                                  : c.spent;
                        return { label: c.campaign, spend: val };
                      })}
                      currency={gadsBarMetric === 'click' || gadsBarMetric === 'conv' ? 'USD' : 'VND'}
                    />
                  </div>
                </div>

                {/* Row 2: Spent by Campaign Donut + Funnel & Device Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  <div
                    data-testid="gads-spent-donut"
                    className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/80 p-5 space-y-2"
                  >
                    <h3 className="text-sm font-semibold text-slate-800">
                      Spent by Campaign (Tỷ Trọng Chi Tiêu)
                    </h3>
                    <GoogleAdsCampaignDonutCard campaigns={gadsSummary.campaigns} />
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-3">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Funnel Performance &amp; O2O Signals
                      </h3>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          ['Clicks', gadsSummary.click],
                          ['Conversions', gadsSummary.conv],
                          ['Calls', gadsSummary.calls],
                          ['Store Visits', gadsSummary.storeVisits],
                        ].map(([lbl, v]) => (
                          <div
                            key={String(lbl)}
                            className="rounded-xl bg-slate-50 border border-slate-100 p-3"
                          >
                            <div className="text-[11px] font-medium text-slate-500">{lbl}</div>
                            <div className="text-base font-semibold text-slate-700 mt-1 tabular-nums">
                              {formatDomNumber(Number(v || 0))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-2.5">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Google Ads Device Breakdown
                      </h3>
                      {[
                        { label: 'Mobile', val: gadsSummary.mobile },
                        { label: 'Desktop', val: gadsSummary.desktop },
                        { label: 'Tablet', val: gadsSummary.tablet },
                      ].map((dv) => {
                        const maxDv = Math.max(
                          gadsSummary.mobile,
                          gadsSummary.desktop,
                          gadsSummary.tablet,
                          1
                        );
                        const pct = dv.val > 0 ? Math.max(6, Math.round((dv.val / maxDv) * 100)) : 0;
                        return (
                          <div key={dv.label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-slate-700">{dv.label}</span>
                              <span className="font-semibold text-slate-800 tabular-nums">
                                {formatDomNumber(dv.val)} clicks
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#1E40FF]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Row 3: Google Ads Deep Breakdowns (Hourly Activity + Channel + Location) */}
                <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Clock className="w-4 h-4 text-[#1E40FF]" />
                      <span>Phân Bổ Khung Giờ (Hourly Activity), Kênh (Channel) &amp; Vị Trí (Location)</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <DomMetaSelect
                        ariaLabel="Chọn chiến dịch Google Ads"
                        value={gadsBreakdowns.effectiveCamp}
                        onChange={(val) => setGadsBreakdownCamp(val)}
                        align="right"
                        variant="pill"
                        className="max-w-[220px]"
                        options={[
                          { value: '__all__', label: 'All Campaigns' },
                          ...gadsSummary.campaigns.map((c) => ({
                            value: c.campaign,
                            label: c.campaign,
                          })),
                        ]}
                      />
                      <DomMetaSelect
                        ariaLabel="Chọn chỉ số Breakdown Google Ads"
                        value={gadsBreakdownMetric}
                        onChange={(val) =>
                          setGadsBreakdownMetric(val as DomGoogleAdsDimMetric)
                        }
                        align="right"
                        variant="pill"
                        options={[
                          { value: 'click', label: 'Clicks' },
                          { value: 'cost', label: 'Spent' },
                          { value: 'imp', label: 'Impressions' },
                          { value: 'conv', label: 'All Conversions' },
                          { value: 'cpc', label: 'CPC' },
                        ]}
                      />
                    </div>
                  </div>

                  <div data-testid="gads-hourly-chart">
                    <div className="text-xs font-semibold text-slate-600 mb-1">
                      Hourly Activity (0h – 23h)
                    </div>
                    <GoogleAdsHourlyBarChart
                      slots={gadsBreakdowns.hourly}
                      metric={gadsBreakdownMetric}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                    <div data-testid="gads-channel-card" className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Channel Breakdown
                      </h4>
                      <GoogleAdsChannelCard
                        channels={gadsBreakdowns.channels}
                        metric={gadsBreakdownMetric}
                      />
                    </div>

                    <div data-testid="gads-location-chart" className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Location Performance
                      </h4>
                      <GoogleAdsLocationBarChart
                        locations={gadsBreakdowns.locations}
                        metric={gadsBreakdownMetric}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 4: Detail Google Ads Campaigns Table */}
                <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Detail Google Ads Campaigns ({gadsSummary.campaigns.length})
                    </h3>
                    <input
                      type="text"
                      value={gadsSearch}
                      onChange={(e) => setGadsSearch(e.target.value)}
                      placeholder="Tìm chiến dịch Google Ads..."
                      className="rounded-full bg-slate-50 border border-slate-200 px-3.5 py-1.5 text-xs outline-none focus:bg-white focus:border-[#1E40FF]"
                    />
                  </div>
                  <div className="dom-meta-table-scroll overflow-x-auto overflow-y-auto max-h-[480px] rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 font-semibold text-slate-600">
                          <th className="sticky top-0 z-10 py-3 px-4 text-xs bg-slate-50 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] normal-case tracking-normal text-left">
                            Campaign Name
                          </th>
                          <th className="sticky top-0 z-10 py-3 px-4 text-xs bg-slate-50 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] normal-case tracking-normal text-right">
                            Spent
                          </th>
                          <th className="sticky top-0 z-10 py-3 px-4 text-xs bg-slate-50 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] normal-case tracking-normal text-right">
                            Impressions
                          </th>
                          <th className="sticky top-0 z-10 py-3 px-4 text-xs bg-slate-50 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] normal-case tracking-normal text-right">
                            Clicks
                          </th>
                          <th className="sticky top-0 z-10 py-3 px-4 text-xs bg-slate-50 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] normal-case tracking-normal text-right">
                            CTR
                          </th>
                          <th className="sticky top-0 z-10 py-3 px-4 text-xs bg-slate-50 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] normal-case tracking-normal text-right">
                            Conversions
                          </th>
                          <th className="sticky top-0 z-10 py-3 px-4 text-xs bg-slate-50 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] normal-case tracking-normal text-right">
                            CPC
                          </th>
                          <th className="sticky top-0 z-10 py-3 px-4 text-xs bg-slate-50 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)] normal-case tracking-normal text-right">
                            Keywords
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {gadsSummary.campaigns
                          .filter(
                            (gc) =>
                              !gadsSearch.trim() ||
                              gc.campaign.toLowerCase().includes(gadsSearch.toLowerCase())
                          )
                          .map((gc) => {
                            const ctr = gc.impression > 0 ? (gc.click / gc.impression) * 100 : 0;
                            const cpc = gc.click > 0 ? gc.spent / gc.click : 0;
                            return (
                              <tr key={gc.campaign} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-medium text-slate-800">{gc.campaign}</td>
                                <td className="py-3 px-4 text-right font-semibold text-slate-800 tabular-nums">
                                  {formatDomMoney(gc.spent, 'VND')}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                                  {formatDomNumber(gc.impression)}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                                  {formatDomNumber(gc.click)}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                                  {ctr.toFixed(2)}%
                                </td>
                                <td className="py-3 px-4 text-right font-semibold text-[#1E40FF] tabular-nums">
                                  {formatDomNumber(gc.conv)}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                                  {formatDomMoney(cpc, 'VND')}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cid = gc.campaign_id || gc.campaign;
                                      setGadsKwModal({
                                        open: true,
                                        campaignName: gc.campaign,
                                        loading: true,
                                        keywords: [],
                                        searchTerms: [],
                                      });
                                      loadDomGoogleAdsKeywords(authContext, cid, resolvedRange)
                                        .then((res) =>
                                          setGadsKwModal((prev) => ({
                                            ...prev,
                                            loading: false,
                                            keywords: res.keywords,
                                            searchTerms: res.searchTerms,
                                          }))
                                        )
                                        .catch(() =>
                                          setGadsKwModal((prev) => ({ ...prev, loading: false }))
                                        );
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E40FF] font-medium cursor-pointer"
                                  >
                                    Keywords
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ====================================================================
            VIEW 6: META CAPI SUB-TAB (Unified CRM /data Advertising Hub)
           ==================================================================== */}
        {capiPanel && effectiveView === 'meta_capi' && (
          <div data-testid="dom-meta-capi-subtab" className="pt-1">
            {capiPanel}
          </div>
        )}
      </div>

      {/* ====================================================================
          MODALS (Portaled to document.body with .mkt-scope & z-index 10050+)
         ==================================================================== */}
      <AdEntityDetailModal
        entity={effectiveDetailModal?.entity || null}
        entityType={effectiveDetailModal?.type || 'ad'}
        currency={currency}
        enableCrmAttribution={isCrmEnabled}
        crmBucket={
          effectiveDetailModal
            ? getEntityCrmBucket(
                effectiveDetailModal.type,
                effectiveDetailModal.entity.id,
                effectiveDetailModal.entity.name
              ) || null
            : null
        }
        authContext={authContext}
        dateRange={{ since: resolvedRange.since, until: resolvedRange.until }}
        initialTab={effectiveDetailModal?.initialTab || initialEntityModalTab}
        onOpenLead={onOpenLead}
        onFilterCampaignLeads={onFilterCampaignLeads}
        onSelectChildAdset={(as) => setDetailModal({ entity: as, type: 'adset' })}
        onClose={() => {
          setDetailModal(null);
          if (currentFocusKey && currentFocusKey !== '|') {
            setHandledFocusKey(currentFocusKey);
          }
        }}
      />

      <DomMetaQuickConnectModal
        open={quickConnectOpen}
        authContext={authContext}
        onConnected={(res) => {
          setConfig(res.config);
          setLoading(true);
          setReloadTick((t) => t + 1);
        }}
        onClose={() => setQuickConnectOpen(false)}
      />

      <AiSummaryModal
        open={aiModalOpen}
        dataset={dataset}
        campaigns={
          selectedCompareCampaigns.length > 0 ? selectedCompareCampaigns : filteredCampaigns
        }
        currency={currency}
        activeBrandLabel={activeBrandLabel}
        savedReports={localAiReports}
        onSaveReports={handlePersistAiReports}
        onClose={() => setAiModalOpen(false)}
      />

      <GoogleAdsKeywordModal
        open={gadsKwModal.open}
        campaignName={gadsKwModal.campaignName}
        dateRangeLabel={`${resolvedRange.since} → ${resolvedRange.until}`}
        loading={gadsKwModal.loading}
        keywords={gadsKwModal.keywords}
        searchTerms={gadsKwModal.searchTerms}
        onClose={() => setGadsKwModal((prev) => ({ ...prev, open: false }))}
      />

      <PerformanceCompareModal
        open={perfCompareOpen}
        dataset={dataset}
        authContext={authContext}
        adAccountId={activeAccountObj?.ad_account_id || authContext.directAdAccountId || ''}
        currency={currency}
        brandFilters={config.brand_filters}
        summaryMetrics={config.summary_metrics}
        canManageConfig={canManageConfig}
        onSaveSummaryMetrics={async (nextMetrics) => {
          if (canManageConfig) {
            await handleSaveSettingsPatch({ summary_metrics: nextMetrics });
          }
        }}
        onClose={() => setPerfCompareOpen(false)}
      />

      <ColumnPresetModal
        open={columnModalOpen}
        columnConfig={config.column_config}
        presets={config.view_presets}
        onSave={(nextCol, nextPresets) => {
          setConfig((prev) => ({
            ...prev,
            column_config: nextCol,
            view_presets: nextPresets,
          }));
          if (canManageConfig) {
            void handleSaveSettingsPatch({
              column_config: nextCol,
              view_presets: nextPresets,
            });
          }
        }}
        onClose={() => setColumnModalOpen(false)}
      />

      {compareCampaignsOpen && (
        <CampaignCompareModal
          campaigns={selectedCompareCampaigns}
          currency={currency}
          onClose={() => setCompareCampaignsOpen(false)}
        />
      )}

      <AccountManagerModal
        open={accountModalOpen}
        config={config}
        onSelectPrimary={async (accId) => {
          setLoading(true);
          if (canManageConfig) {
            await handleSaveSettingsPatch({ primary_ad_account_id: accId });
          } else {
            setConfig((prev) => ({ ...prev, primary_ad_account_id: accId }));
          }
          setReloadTick((t) => t + 1);
          setAccountModalOpen(false);
        }}
        onDiscoverAccounts={(tok) => discoverMetaAccountsFromToken(authContext, tok)}
        onConnectAccounts={async (tok, selected) => {
          setLoading(true);
          const nextCfg = await connectBatchMetaAccounts(authContext, {
            access_token: tok,
            accounts: selected,
            primary_ad_account_id: selected[0]?.ad_account_id,
          });
          setConfig(nextCfg);
          setReloadTick((t) => t + 1);
        }}
        onClose={() => setAccountModalOpen(false)}
      />

      <ShareAccessModal
        open={shareModalOpen}
        shareUrl={currentShareUrl}
        tenantSlug={authContext.tenantSlug || 'workspace'}
        currentUserName={userDisplayName}
        canManageConfig={canManageConfig}
        onClose={() => setShareModalOpen(false)}
      />

      <WorkspaceSettingsModal
        open={settingsModal.open}
        initialTab={settingsModal.tab}
        config={config}
        tenantSlug={authContext.tenantSlug || 'workspace'}
        shareUrlOverride={currentShareUrl}
        daysRemaining={daysRemaining}
        canManageConfig={canManageConfig}
        onSaveConfig={handleSaveSettingsPatch}
        onTestGoogleAds={async (cfg) => {
          const res = await loadDomGoogleAdsDataset(authContext, resolvedRange, {
            testConnection: true,
            overrideConfig: {
              customer_id: cfg.customer_id,
              apps_script_url: cfg.apps_script_url,
              developer_token: cfg.developer_token,
            },
          });
          return { rowsCount: res.currentRows.length + res.prevRows.length };
        }}
        onClose={() => setSettingsModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default DomMetaReportWorkspace;
