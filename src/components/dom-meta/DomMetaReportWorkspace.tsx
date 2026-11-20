import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  HelpCircle,
  Images,
  KeyRound,
  Layers,
  LayoutDashboard,
  List,
  LogOut,
  MapPin,
  Menu,
  PlusCircle,
  Rocket,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
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
  type DomMetaEntityHourPoint,
  type DomMetaNavView,
  type DomMetaSettingsTab,
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
  getCachedPrimaryAdAccountId,
  loadDomGoogleAdsDataset,
  loadDomGoogleAdsKeywords,
  loadFullDomMetaDataset,
  prefetchDomMetaEntityDeepDetail,
  quickConnectDomMeta,
  setCachedPrimaryAdAccountId,
  updateDomMetaWorkspaceConfig,
  type DomMetaAuthContext,
} from './domMetaApi';
import {
  AgeGenderBarChart,
  CreativeThumbFan,
  DailyTrendAreaChart,
  DaypartingHeatmapGrid,
  DeviceDonutCard,
  GoogleAdsCampaignDonutCard,
  GoogleAdsChannelCard,
  GoogleAdsHourlyBarChart,
  GoogleAdsLocationBarChart,
  HourlySpendResultChart,
  MetaGoalBarChart,
  MonthlyYearBarChart,
  RegionSpentBarChart,
  SpentPlatformDonutCard,
  UserBehaviorFunnelCard,
  VideoFunnelBars,
  type DomGoogleAdsDimMetric,
} from './DomMetaCharts';
import {
  AccountManagerModal,
  AdEntityDetailModal,
  AiSummaryModal,
  CampaignCompareModal,
  ColumnPresetModal,
  CrmUpgradeShowcaseModal,
  DomMetaSettingsPage,
  GoogleAdsKeywordModal,
  PerformanceCompareModal,
  ShareAccessModal,
} from './DomMetaModals';
import { DOM_META_SUMMARY_KPI_OPTIONS } from './domMetaTypes';
import {
  DomMetaSelect,
  DomOverflowMenu,
  DomResponsiveSubtabs,
} from './DomMetaSelect';
import {
  DOM_META_TOUR_STORAGE_KEY,
  DomMetaSpotlightTour,
} from './DomMetaSpotlightTour';
import { ClosedLoopFlywheelCockpit } from './ClosedLoopFlywheelCockpit';

const DomMetaQuickConnectModal = lazy(() =>
  import('./DomMetaQuickConnectModal').then((m) => ({ default: m.DomMetaQuickConnectModal }))
);
const DomMetaLeadAttributionPanel = lazy(() =>
  import('./DomMetaLeadAttributionPanel').then((m) => ({ default: m.DomMetaLeadAttributionPanel }))
);

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
  | 'result'
  | 'cpr'
  | 'impressions'
  | 'reach'
  | 'leads'
  | 'messages'
  | 'follows'
  | 'cpm';

type HeatmapMetricKey = 'spend' | 'result' | 'cpr' | 'leads' | 'messages' | 'purchases' | 'clicks';
type YearMetricKey = 'spend' | 'leads' | 'reach' | 'messages' | 'follows';
type GadsTrendMetricKey = 'spend' | 'leads' | 'cpr' | 'clicks' | 'impressions';
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
      'lead_attribution',
      'ad_library',
      'account',
      'google_ads',
      'meta_capi',
      'settings',
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
  const forceRefreshRef = useRef(false);
  const autoConnectCheckedRef = useRef(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dashboard interactive states
  const [dailyMetric, setDailyMetric] = useState<DailyMetricKey>('spend');
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetricKey>('spend');
  const [ageOnly, setAgeOnly] = useState(false);
  const [ageMetric, setAgeMetric] = useState<'spend' | 'result' | 'cpr'>('spend');
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
  const [mobileHierarchyMode, setMobileHierarchyMode] = useState<'cards' | 'table'>('cards');

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
  const [detailHistory, setDetailHistory] = useState<
    Array<{
      entity: DomMetaCampaignNode | DomMetaAdNode | DomMetaAdsetNode;
      type: 'campaign' | 'ad' | 'adset';
      initialTab?: 'insights' | 'crm_leads';
    }>
  >([]);
  const [crmUpgradeOpen, setCrmUpgradeOpen] = useState(false);
  const [handledFocusKey, setHandledFocusKey] = useState('');
  const [quickConnectOpen, setQuickConnectOpen] = useState(Boolean(defaultQuickConnectOpen));
  const [perfCompareOpen, setPerfCompareOpen] = useState(false);
  const [referenceNowMs, setReferenceNowMs] = useState<number>(() => Date.now());
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [compareCampaignsOpen, setCompareCampaignsOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStepIdx, setTourStepIdx] = useState(0);
  const isAiAdsEvalAllowed = config.ai_config?.ai_ads_eval_enabled !== false;
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<DomMetaSettingsTab>('brand');
  const [metaGoalMetric, setMetaGoalMetric] = useState<'spend' | 'result' | 'cpr'>('spend');
  const [adLibGoalFilter, setAdLibGoalFilter] = useState<string>('ALL');

  const openSettingsPage = useCallback((tab: DomMetaSettingsTab = 'brand') => {
    setSettingsTab(tab);
    setActiveView('settings');
  }, []);

  const stableAuthContext = useMemo<DomMetaAuthContext>(
    () => ({
      apiBaseUrl: authContext.apiBaseUrl,
      accessToken: authContext.accessToken,
      tenantSlug: authContext.tenantSlug,
      standaloneSessionRecovery: authContext.standaloneSessionRecovery,
      directMetaToken: authContext.directMetaToken,
      directAdAccountId: authContext.directAdAccountId,
      directGoogleAds: authContext.directGoogleAds,
      previewDataset: authContext.previewDataset,
      previewCrmAttribution: authContext.previewCrmAttribution,
      previewEntityLeadsByEntityId: authContext.previewEntityLeadsByEntityId,
      previewQuickConnectStatus: authContext.previewQuickConnectStatus,
      previewActiveColumns: authContext.previewActiveColumns,
    }),
    [
      authContext.apiBaseUrl,
      authContext.accessToken,
      authContext.tenantSlug,
      authContext.standaloneSessionRecovery,
      authContext.directMetaToken,
      authContext.directAdAccountId,
      authContext.directGoogleAds,
      authContext.previewDataset,
      authContext.previewCrmAttribution,
      authContext.previewEntityLeadsByEntityId,
      authContext.previewQuickConnectStatus,
      authContext.previewActiveColumns,
    ]
  );

  const resolvedRange = useMemo(
    () => resolveDateRangeFromPreset(datePreset, customStart, customEnd),
    [datePreset, customStart, customEnd]
  );

  // Derived view fallback if Google Ads is turned OFF, CAPI panel is absent, or CRM attribution is disabled
  const effectiveView: DomMetaNavView =
    (!config.google_ads.enabled && activeView === 'google_ads') ||
    (!capiPanel && activeView === 'meta_capi') ||
    (!isCrmEnabled && activeView === 'lead_attribution')
      ? 'dashboard'
      : activeView;

  useEffect(() => {
    let cancelled = false;
    const ctx = stableAuthContext;
    const run = async () => {
      try {
        // Zero-Friction Auto-Connect in embedded CRM/ERP mode when Meta token already exists
        if (
          mode === 'embedded' &&
          canManageConfig &&
          ctx.accessToken &&
          !autoConnectCheckedRef.current
        ) {
          autoConnectCheckedRef.current = true;
          try {
            const st = await fetchDomMetaQuickConnectStatus(ctx);
            if (!cancelled && st.can_auto_connect && !st.dom_meta_connected) {
              await quickConnectDomMeta(ctx, { auto_reuse: true });
            }
          } catch {
            // Non-blocking auto-connect check
          }
        }

        const shouldForce = forceRefreshRef.current;
        forceRefreshRef.current = false;

        // Fire CRM attribution asynchronously so Meta Ads KPIs & charts paint without waiting on CRM DB
        if (isCrmEnabled) {
          fetchDomMetaCrmAttribution(ctx, {
            since: resolvedRange.since,
            until: resolvedRange.until,
          })
            .then((crmRes) => {
              if (!cancelled) setCrmAttribution(crmRes);
            })
            .catch(() => {
              if (!cancelled) setCrmAttribution(null);
            });
        } else {
          setCrmAttribution(null);
        }

        // Parallelize workspace config + speculative Meta Batch dataset when primary ad account is cached
        const speculativeAcc =
          ctx.directAdAccountId ||
          getCachedPrimaryAdAccountId(ctx.tenantSlug) ||
          '';
        const speculativeDatasetPromise = speculativeAcc
          ? loadFullDomMetaDataset(
              ctx,
              speculativeAcc,
              resolvedRange,
              selectedYear,
              { forceRefresh: shouldForce }
            ).catch(() => null)
          : null;

        const cfg = await fetchDomMetaWorkspaceConfig(ctx);
        if (cancelled) return;
        setConfig(cfg);
        if (Array.isArray(cfg.ai_reports) && cfg.ai_reports.length > 0) {
          setLocalAiReports(cfg.ai_reports);
          saveLocalAiReports(ctx.tenantSlug, cfg.ai_reports);
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

        if (cfg.google_ads.enabled) {
          setGadsLoading(true);
          loadDomGoogleAdsDataset(ctx, resolvedRange)
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

        const targetAcc =
          cfg.primary_ad_account_id ||
          cfg.meta_summary.ad_account_id ||
          cfg.meta_summary.accounts[0]?.ad_account_id ||
          ctx.directAdAccountId ||
          '';

        if (!targetAcc) {
          setDataset(null);
          setError(null);
          setLoading(false);
          return;
        }

        setCachedPrimaryAdAccountId(ctx.tenantSlug, targetAcc);

        let ds: DomMetaDashboardDataset | null = null;
        if (
          speculativeDatasetPromise &&
          targetAcc.replace(/^act_/i, '').trim() === speculativeAcc.replace(/^act_/i, '').trim()
        ) {
          ds = await speculativeDatasetPromise;
        }
        if (!ds) {
          ds = await loadFullDomMetaDataset(
            ctx,
            targetAcc,
            resolvedRange,
            selectedYear,
            { forceRefresh: shouldForce }
          );
        }
        if (cancelled) return;
        setDataset(ds);
        setReferenceNowMs(Date.now());
        setError(null);
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
    stableAuthContext,
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

  const activeAdAccountId = activeAccountObj?.ad_account_id || authContext.directAdAccountId || '';

  const handleHoverPrefetchEntity = useCallback(
    (
      entity: DomMetaCampaignNode | DomMetaAdsetNode | DomMetaAdNode,
      type: 'campaign' | 'adset' | 'ad'
    ) => {
      if (!activeAdAccountId || !entity?.id) return;
      prefetchDomMetaEntityDeepDetail(
        authContext,
        activeAdAccountId,
        type,
        entity.id,
        entity.optimization_goal || 'QUALITY LEAD',
        { since: resolvedRange.since, until: resolvedRange.until }
      );
    },
    [activeAdAccountId, authContext, resolvedRange.since, resolvedRange.until]
  );

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
      if ((c.spend || 0) <= 0) {
        return false;
      }
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
          .filter((as) => (as.spend || 0) > 0)
          .map((as) => ({
            ...as,
            ads: [...as.ads].filter((ad) => (ad.spend || 0) > 0).sort(compareEntities),
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

  // Meta Goal / Custom Bar Chart aggregation (with Spent + Result + CPR)
  const metaGoalBars = useMemo(() => {
    const chartMode = config.goal_chart_mode || 'goal';
    if (chartMode === 'brand' && config.brand_filters.length > 0) {
      const items = config.brand_filters.map((b) => {
        const kw = b.filter.toLowerCase();
        const matched = filteredCampaigns.filter(
          (c) => kw && c.name.toLowerCase().includes(kw)
        );
        return {
          label: b.name,
          spend: matched.reduce((acc, c) => acc + c.spend, 0),
          result: matched.reduce((acc, c) => acc + (c.result || 0), 0),
        };
      });
      if (items.some((i) => i.spend > 0)) return items;
    }

    if (chartMode === 'keyword' && config.goal_keywords.length > 0) {
      const items = config.goal_keywords.map((kw) => {
        const lower = kw.toLowerCase();
        const matched = filteredCampaigns.filter(
          (c) => lower && c.name.toLowerCase().includes(lower)
        );
        return {
          label: kw.toUpperCase(),
          spend: matched.reduce((acc, c) => acc + c.spend, 0),
          result: matched.reduce((acc, c) => acc + (c.result || 0), 0),
        };
      });
      if (items.some((i) => i.spend > 0)) return items;
    }

    const map = new Map<string, { spend: number; result: number }>();
    for (const c of filteredCampaigns) {
      const g = c.optimization_goal || 'QUALITY LEAD';
      const cur = map.get(g) || { spend: 0, result: 0 };
      cur.spend += c.spend;
      cur.result += c.result || 0;
      map.set(g, cur);
    }
    return Array.from(map.entries()).map(([label, v]) => ({
      label,
      spend: v.spend,
      result: v.result,
    }));
  }, [filteredCampaigns, config.goal_chart_mode, config.brand_filters, config.goal_keywords]);

  // 24h Hourly Spend & Result aggregated from dataset.heatmap (Advertiser TZ)
  const dashboardHourly = useMemo<DomMetaEntityHourPoint[]>(() => {
    if (!dataset?.heatmap?.length) return [];
    const byH = new Map<number, { spend: number; impr: number; clicks: number; res: number }>();
    for (const cell of dataset.heatmap) {
      const prev = byH.get(cell.hour) || { spend: 0, impr: 0, clicks: 0, res: 0 };
      const cellRes =
        cell.result ?? (cell.leads || 0) + (cell.messages || 0) + (cell.purchases || 0);
      prev.spend += cell.spend || 0;
      prev.impr += cell.impressions || 0;
      prev.clicks += cell.clicks || 0;
      prev.res += cellRes;
      byH.set(cell.hour, prev);
    }
    return Array.from({ length: 24 }, (_, h) => {
      const cur = byH.get(h) || { spend: 0, impr: 0, clicks: 0, res: 0 };
      return {
        hour: h,
        label: `${String(h).padStart(2, '0')}:00`,
        spend: cur.spend,
        impressions: cur.impr,
        clicks: cur.clicks,
        result: cur.res,
        cpr: cur.res > 0 ? cur.spend / cur.res : 0,
      };
    });
  }, [dataset]);

  const dashboardTotalResults = useMemo(() => {
    const campSum = filteredCampaigns.reduce((acc, c) => acc + (c.result || 0), 0);
    if (campSum > 0) return campSum;
    const t = dataset?.currentTotals;
    return (t?.leads || 0) + (t?.messages || 0) + (t?.purchases || 0);
  }, [filteredCampaigns, dataset]);

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
        colId === 'unique_ctr' ||
        colId === 'lpv_rate' ||
        colId === 'hook_rate' ||
        colId === 'hold_rate' ||
        colId === 'completion_rate' ||
        colId === 'video_avg_time' ||
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
    row: DomMetaCampaignNode | DomMetaAdsetNode | DomMetaAdNode,
    parentCamp?: DomMetaCampaignNode
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
        const inheritedCbo =
          Boolean(parentCamp) &&
          dailyBudget === 0 &&
          lifetimeBudget === 0 &&
          (Number(parentCamp?.daily_budget || 0) > 0 ||
            Number(parentCamp?.lifetime_budget || 0) > 0);
        const startStr = 'start_time' in row ? row.start_time : undefined;
        const endStr =
          'end_time' in row ? row.end_time : 'stop_time' in row ? row.stop_time : undefined;
        const schedText = buildScheduleText(startStr, endStr, badge.tone === 'active');

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
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
              {inheritedCbo && (
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#1E40FF] text-[9.5px] font-bold">
                  CBO
                </span>
              )}
            </div>
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
      case 'cpp':
        return Number(row.cpp || 0) > 0 ? (
          <span className="text-slate-600">{formatDomMoney(Number(row.cpp || 0), currency)}</span>
        ) : (
          <span className="text-slate-300">—</span>
        );
      case 'cpc':
        return <span className="text-slate-600">{formatDomMoney(row.cpc, currency)}</span>;
      case 'cost_per_lpv':
        return Number(row.cost_per_lpv || 0) > 0 ? (
          <span className="text-slate-600">
            {formatDomMoney(Number(row.cost_per_lpv || 0), currency)}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        );
      case 'aov':
        return Number(row.aov || 0) > 0 ? (
          <span className="font-medium text-emerald-700">
            {formatDomMoney(Number(row.aov || 0), currency)}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        );
      case 'ctr':
        return <span className="text-slate-600">{`${row.ctr.toFixed(2)}%`}</span>;
      case 'unique_ctr':
        return (
          <span className="text-slate-600">{`${Number(row.unique_ctr || 0).toFixed(2)}%`}</span>
        );
      case 'lpv_rate':
        return Number(row.lpv_rate || 0) > 0 ? (
          <span className="font-medium text-cyan-700">{`${Number(row.lpv_rate || 0).toFixed(1)}%`}</span>
        ) : (
          <span className="text-slate-300">—</span>
        );
      case 'hook_rate':
        return <span className="text-slate-600">{`${row.hook_rate.toFixed(1)}%`}</span>;
      case 'hold_rate':
        return <span className="text-slate-600">{`${row.hold_rate.toFixed(1)}%`}</span>;
      case 'completion_rate':
        return Number(row.completion_rate || 0) > 0 ? (
          <span className="text-slate-600">{`${Number(row.completion_rate || 0).toFixed(1)}%`}</span>
        ) : (
          <span className="text-slate-300">—</span>
        );
      case 'video_avg_time':
        return Number(row.video_avg_time || 0) > 0 ? (
          <span className="text-slate-600">{`${Number(row.video_avg_time || 0).toFixed(1)}s`}</span>
        ) : (
          <span className="text-slate-300">—</span>
        );
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

  const navItems: Array<{
    id: DomMetaNavView;
    label: string;
    shortLabel: string;
    icon: React.ElementType;
  }> = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'ad_detail', label: 'Campaign details', shortLabel: 'Campaigns', icon: List },
    ...(isCrmEnabled
      ? [
          {
            id: 'lead_attribution' as const,
            label: 'Đối chiếu Lead',
            shortLabel: 'Đối chiếu Lead',
            icon: Users,
          },
        ]
      : []),
    { id: 'ad_library', label: 'Ads Library', shortLabel: 'Ads Library', icon: Images },
    { id: 'account', label: 'Ad Account', shortLabel: 'Ad Account', icon: CreditCard },
    ...(config.google_ads.enabled
      ? [
          {
            id: 'google_ads' as const,
            label: 'Google ads',
            shortLabel: 'Google Ads',
            icon: TrendingUp,
          },
        ]
      : []),
    ...(capiPanel
      ? [
          {
            id: 'meta_capi' as const,
            label: capiTabLabel,
            shortLabel: capiTabLabel,
            icon: ShieldCheck,
          },
        ]
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
              onClick={(e) => {
                e.stopPropagation();
                setDetailModal({ entity, type, initialTab: 'crm_leads' });
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                setDetailModal({ entity, type, initialTab: 'crm_leads' });
              }}
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
      className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 min-w-0"
    >
      {sectionTitle && (
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 min-w-0">
            <List className="w-4 h-4 text-[#1E40FF] shrink-0" />
            <span className="truncate">{sectionTitle}</span>
          </div>
          <span className="text-xs font-medium text-slate-500 shrink-0 tabular-nums">
            {filteredCampaigns.length} CD
          </span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 min-w-0">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 flex-1 min-w-0">
          <div className="relative w-full sm:w-72 lg:w-88">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên / ID Campaign, Adset, Ad..."
              className="w-full !pl-10 pr-3.5 py-2 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E40FF] focus:ring-2 focus:ring-[#1E40FF]/10 text-[13px] text-slate-800 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 min-w-0">
            <DomMetaSelect
              ariaLabel="Quick filter chiến dịch"
              testId="campaign-quick-filter"
              value={quickFilter}
              onChange={(val) => setQuickFilter(val as DomQuickFilterKey)}
              variant="pill"
              className="w-full sm:w-auto"
              options={[
                { value: 'all', label: 'Bộ lọc: Tất cả' },
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
              className="w-full sm:w-auto"
              options={[
                { value: 'all', label: 'Hạn chạy: Tất cả' },
                { value: 'ending_1d', label: 'Sắp hết 1 ngày' },
                { value: 'ending_3d', label: 'Sắp hết 3 ngày' },
                { value: 'ended', label: 'Đã kết thúc' },
              ]}
            />
          </div>
        </div>

        {/* Mobile Action Row: Strictly <= 2 controls! Desktop (>= sm): Preset + Column + Export */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="hidden sm:block">
            {config.view_presets.length > 0 && (
              <DomMetaSelect
                ariaLabel="Chọn nhanh Preset cột"
                value=""
                placeholder="Preset cột..."
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
                options={config.view_presets.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
              />
            )}
          </div>

          <button
            type="button"
            data-testid="open-column-preset"
            onClick={() => setColumnModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-50 hover:bg-blue-50 border border-slate-200 text-xs font-medium text-slate-700 hover:text-[#1E40FF] cursor-pointer dom-ios-press"
          >
            <Layers className="w-3.5 h-3.5 text-[#1E40FF]" />
            <span>Cột &amp; Preset</span>
          </button>

          <button
            type="button"
            onClick={handleExportCampaignCsv}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-sm dom-ios-press"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <div className="sm:hidden">
            <DomOverflowMenu
              variant="pill"
              label="Tác vụ"
              items={[
                {
                  id: 'toggle_mode',
                  label:
                    mobileHierarchyMode === 'cards'
                      ? 'Chuyển sang Bảng nhiều cột'
                      : 'Chuyển sang Thẻ Mobile App',
                  description:
                    mobileHierarchyMode === 'cards'
                      ? 'Cuộn ngang xem đầy đủ cột tùy chỉnh'
                      : 'Tối ưu đọc nhanh trên điện thoại',
                  icon: <List className="w-3.5 h-3.5" />,
                  onClick: () =>
                    setMobileHierarchyMode((m) => (m === 'cards' ? 'table' : 'cards')),
                },
                {
                  id: 'export_csv',
                  label: 'Xuất báo cáo CSV',
                  icon: <Download className="w-3.5 h-3.5" />,
                  onClick: handleExportCampaignCsv,
                },
                ...config.view_presets.map((p) => ({
                  id: `preset_${p.id}`,
                  label: `Preset: ${p.name}`,
                  icon: <Layers className="w-3.5 h-3.5" />,
                  onClick: () => {
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
                    setMobileHierarchyMode('table');
                    if (canManageConfig) {
                      void handleSaveSettingsPatch({ column_config: nextCol });
                    }
                  },
                })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* Selection Summary Bar when >= 1 Campaign is checked (Max 2 action buttons!) */}
      {selectedCompareCampaigns.length >= 1 && (
        <div className="rounded-2xl bg-[#F4F8FF] border border-blue-200 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#1E40FF]">
              <span>Đã chọn {selectedCompareCampaigns.length} CD</span>
              <button
                type="button"
                onClick={() => setSelectedCampaignIds({})}
                className="w-[18px] h-[18px] rounded-full bg-blue-100 hover:bg-blue-200 text-[#1E40FF] inline-flex items-center justify-center cursor-pointer"
                title="Bỏ chọn tất cả"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
            <span className="text-slate-600">
              Spent:{' '}
              <span className="font-semibold text-slate-800 tabular-nums">
                {formatDomMoneyShort(
                  selectedCompareCampaigns.reduce((s, c) => s + c.spend, 0),
                  currency
                )}
              </span>
            </span>
            <span className="text-slate-600">
              KQ:{' '}
              <span className="font-semibold text-slate-800 tabular-nums">
                {formatDomNumber(selectedCompareCampaigns.reduce((s, c) => s + c.result, 0))}
              </span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            {selectedCompareCampaigns.length >= 2 ? (
              <button
                type="button"
                onClick={() => setCompareCampaignsOpen(true)}
                className="px-3 py-1.5 rounded-full bg-[#1E40FF] text-white font-semibold cursor-pointer text-center"
              >
                So sánh ({selectedCompareCampaigns.length})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedCampaignIds({})}
                className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 font-semibold cursor-pointer text-center"
              >
                Bỏ chọn
              </button>
            )}
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="px-3 py-1.5 rounded-full bg-white border border-blue-200 text-[#1E40FF] font-semibold cursor-pointer text-center truncate"
            >
              AI Phân tích
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

      {/* ====================================================================
          DEDICATED MOBILE APP CAMPAIGN / ADSET / AD CARD-LIST (< md)
         ==================================================================== */}
      {mobileHierarchyMode === 'cards' && (
        <div data-testid="campaign-mobile-cards" className="md:hidden space-y-2.5">
          {filteredCampaigns.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 rounded-2xl border border-slate-200/80 bg-slate-50/50 px-4">
              Không có chiến dịch nào khớp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredCampaigns.map((camp, campIdx) => {
              const isOpen = Boolean(
                expandedCampaigns[camp.id] ?? camp.id === pendingFocusMatch?.campaignId
              );
              const campAds = camp.adsets.flatMap((as) => as.ads);
              const campThumbs = collectEntityThumbs(campAds, 2);
              const badge = normalizeStatusBadgeInfo(camp, referenceNowMs);
              const crmB = showCrmColumns
                ? getEntityCrmBucket('campaign', camp.id, camp.name)
                : undefined;
              return (
                <div
                  key={camp.id}
                  className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)] p-3 space-y-2.5"
                >
                  <div
                    onClick={
                      camp.adsets.length > 0
                        ? () =>
                            setExpandedCampaigns((prev) => ({
                              ...prev,
                              [camp.id]: !isOpen,
                            }))
                        : undefined
                    }
                    className={`flex items-start gap-2.5 min-w-0 ${
                      camp.adsets.length > 0 ? 'cursor-pointer' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(selectedCampaignIds[camp.id])}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setSelectedCampaignIds((prev) => ({
                          ...prev,
                          [camp.id]: e.target.checked,
                        }))
                      }
                      className="accent-[#1E40FF] mt-1 shrink-0"
                    />
                    <CreativeThumbFan
                      urls={campThumbs}
                      goal={camp.optimization_goal}
                      active={badge.tone === 'active'}
                      variant="adset"
                      eager={campIdx < 6}
                      alt={camp.name}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            badge.tone === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : badge.tone === 'complete'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-slate-100 text-slate-500'
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
                        <span className="text-[10px] font-semibold uppercase text-slate-400 truncate">
                          {camp.optimization_goal}
                        </span>
                      </div>
                      <div className="text-[13px] font-bold text-slate-900 line-clamp-2 leading-snug mt-0.5">
                        {camp.name}
                      </div>
                    </div>
                  </div>

                  {/* 3-Column Native App KPI Strip */}
                  <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-50/95 border border-slate-100 p-2 text-center">
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium text-slate-400">Spent</div>
                      <div className="text-xs font-bold text-slate-800 tabular-nums truncate">
                        {formatDomMoneyShort(camp.spend, currency)}
                      </div>
                    </div>
                    <div className="min-w-0 border-x border-slate-200/70 px-1">
                      <div className="text-[10px] font-medium text-slate-400">Results</div>
                      <div className="text-xs font-bold text-slate-800 tabular-nums truncate">
                        {formatDomNumber(camp.result)}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium text-slate-400">CPR</div>
                      <div className="text-xs font-bold text-[#1E40FF] tabular-nums truncate">
                        {camp.result > 0 ? formatDomMoneyShort(camp.cpr, currency) : '—'}
                      </div>
                    </div>
                  </div>

                  {crmB && crmB.total_leads > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDetailModal({ entity: camp, type: 'campaign', initialTab: 'crm_leads' })
                      }
                      className="w-full rounded-xl bg-[#F4F8FF] border border-blue-200/80 px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-[#1E40FF] cursor-pointer"
                    >
                      <span>
                        Lead CRM: {crmB.total_leads} ({crmB.positive_rate}% CL)
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  )}

                  {/* Strictly 2 Action Buttons Horizontally */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCampaigns((prev) => ({
                          ...prev,
                          [camp.id]: !isOpen,
                        }))
                      }
                      className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-1 cursor-pointer dom-ios-press"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180 text-[#1E40FF]' : ''}`}
                      />
                      <span>Nhóm QC ({camp.adsets.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailModal({ entity: camp, type: 'campaign' })}
                      className="py-2 px-2.5 rounded-xl bg-[#1E40FF] text-white text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer dom-ios-press"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Insight</span>
                    </button>
                  </div>

                  {/* Nested Mobile Adsets & Ads */}
                  {isOpen && camp.adsets.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      {camp.adsets.map((as) => {
                        const asOpen = Boolean(expandedAdsets[as.id]);
                        return (
                          <div
                            key={as.id}
                            className="rounded-xl bg-slate-50/90 border border-slate-200/75 p-2.5 space-y-2"
                          >
                            <div
                              onClick={
                                as.ads.length > 0
                                  ? () =>
                                      setExpandedAdsets((prev) => ({
                                        ...prev,
                                        [as.id]: !asOpen,
                                      }))
                                  : undefined
                              }
                              className={`flex items-center justify-between gap-2 min-w-0 ${
                                as.ads.length > 0 ? 'cursor-pointer' : ''
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                                  {as.name}
                                </div>
                                <div className="text-[10.5px] text-slate-500 tabular-nums mt-0.5">
                                  {formatDomMoneyShort(as.spend, currency)} · {formatDomNumber(as.result)} KQ
                                  {as.result > 0 ? ` · CPR ${formatDomMoneyShort(as.cpr, currency)}` : ''}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedAdsets((prev) => ({ ...prev, [as.id]: !asOpen }))
                                }
                                className="py-1.5 px-2 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 inline-flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <ChevronDown
                                  className={`w-3 h-3 transition-transform ${asOpen ? 'rotate-180' : ''}`}
                                />
                                <span>Bài Ad ({as.ads.length})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailModal({ entity: as, type: 'adset' })}
                                className="py-1.5 px-2 rounded-lg bg-blue-50 text-[#1E40FF] text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span>Chi tiết Adset</span>
                              </button>
                            </div>

                            {asOpen && as.ads.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                {as.ads.map((ad) => (
                                  <button
                                    key={ad.id}
                                    type="button"
                                    onClick={() => setDetailModal({ entity: ad, type: 'ad' })}
                                    className="w-full rounded-lg bg-white border border-slate-200/80 p-2 flex items-center justify-between gap-2 text-left cursor-pointer dom-ios-press"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <CreativeThumbFan
                                        urls={[ad.thumbnail_url || ad.image_url].filter(Boolean)}
                                        goal={ad.optimization_goal || as.optimization_goal}
                                        active={ad.effective_status.toUpperCase() === 'ACTIVE'}
                                        variant="ad"
                                        alt={ad.name}
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="text-[11.5px] font-semibold text-slate-800 truncate">
                                          {ad.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500 tabular-nums">
                                          {formatDomMoneyShort(ad.spend, currency)} · {formatDomNumber(ad.result)} KQ
                                        </div>
                                      </div>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <div
        data-testid="campaign-table-scroll"
        className={`${
          mobileHierarchyMode === 'cards' ? 'hidden md:block' : 'block'
        } dom-meta-table-scroll overflow-x-auto overflow-y-auto max-h-[540px] rounded-2xl border border-slate-200/85 bg-white`}
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
                    <tr
                      onClick={
                        camp.adsets.length > 0
                          ? () =>
                              setExpandedCampaigns((prev) => ({
                                ...prev,
                                [camp.id]: !isOpen,
                              }))
                          : undefined
                      }
                      className={`group/row hover:bg-slate-50/80 transition-colors ${
                        camp.adsets.length > 0 ? 'cursor-pointer' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
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
                        <div className="flex items-center gap-2.5 text-left font-medium text-slate-800 group-hover/row:text-[#1E40FF] min-w-0">
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
                            <div className="line-clamp-1 font-semibold text-slate-900 group-hover/row:text-[#1E40FF] transition-colors">
                              {camp.name}
                            </div>
                            <div className="text-[10.5px] font-mono text-slate-400 mt-0.5">
                              {camp.adsets.length} adsets · ID: {camp.id}
                            </div>
                          </div>
                        </div>
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
                          onMouseEnter={() => handleHoverPrefetchEntity(camp, 'campaign')}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailModal({ entity: camp, type: 'campaign' });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E40FF] font-medium cursor-pointer dom-ios-press"
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
                            <tr
                              onClick={
                                as.ads.length > 0
                                  ? () =>
                                      setExpandedAdsets((prev) => ({
                                        ...prev,
                                        [as.id]: !asOpen,
                                      }))
                                  : undefined
                              }
                              className={`group/row bg-slate-50/55 hover:bg-blue-50/35 transition-colors ${
                                as.ads.length > 0 ? 'cursor-pointer' : ''
                              }`}
                            >
                              <td className="py-2 px-3" />
                              <td className="py-2 pl-8 pr-3">
                                <div className="flex items-center gap-2.5 text-left font-medium text-slate-700 group-hover/row:text-[#1E40FF] min-w-0">
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
                                    <span className="line-clamp-1 font-medium text-slate-800 group-hover/row:text-[#1E40FF] transition-colors">
                                      {as.name}
                                    </span>
                                    <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                                      {as.ads.length} ads · ID: {as.id}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              {config.column_config.activeColumns.map((colId) => (
                                <td
                                  key={colId}
                                  className="py-2 px-3 tabular-nums whitespace-nowrap"
                                >
                                  {renderMetricCell(colId, as, camp)}
                                </td>
                              ))}
                              {renderCrmAttributionCells(as, 'adset')}
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onMouseEnter={() => handleHoverPrefetchEntity(as, 'adset')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailModal({ entity: as, type: 'adset' });
                                  }}
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
                                      onMouseEnter={() => handleHoverPrefetchEntity(ad, 'ad')}
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

  const datePickerControl = (
    <div ref={datePickerRef} className="relative flex items-center gap-2 shrink-0">
      <button
        type="button"
        data-testid="open-date-picker"
        title={`${formatIsoToVnDisplay(resolvedRange.since)} - ${formatIsoToVnDisplay(
          resolvedRange.until
        )}`}
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-full bg-slate-50 hover:bg-blue-50/60 border border-slate-200/90 text-xs font-semibold text-slate-800 cursor-pointer transition-colors dom-ios-press"
      >
        <Calendar className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
        <span className="whitespace-nowrap">
          {DATE_PRESET_OPTIONS.find((p) => p.key === datePreset)?.label || 'Last 7 days'}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {mode === 'standalone' && (
        <span className="hidden lg:inline text-xs font-medium text-slate-400 tabular-nums whitespace-nowrap">
          {formatIsoToVnDisplay(resolvedRange.since)} -{' '}
          {formatIsoToVnDisplay(resolvedRange.until)}
        </span>
      )}

      {dateMenuOpen && (
        <div
          className={`fixed sm:absolute inset-x-3 sm:inset-x-auto ${
            mode === 'standalone' ? 'sm:right-0 lg:right-auto lg:left-0' : 'sm:right-0'
          } top-[68px] sm:top-full sm:mt-2.5 sm:w-[570px] max-h-[calc(100dvh-84px)] sm:max-h-none overflow-y-auto sm:overflow-hidden rounded-2xl bg-white border border-slate-200/95 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.24)] z-50 flex flex-col sm:flex-row dom-ios-modal-responsive`}
        >
          {/* Left Column: Preset Radio List */}
          <div className="sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100 bg-slate-50/55 p-2.5 grid grid-cols-2 sm:grid-cols-1 gap-0.5 max-h-44 sm:max-h-none overflow-y-auto">
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
                  className={`w-full px-2.5 py-2 rounded-xl flex items-center gap-2 text-left text-xs transition-colors cursor-pointer ${
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
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#1E40FF]" />}
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
                  <div key={wd} className="text-[11px] font-semibold text-slate-400 py-1">
                    {wd}
                  </div>
                ))}
                {buildCalendarMonthGrid(calendarMonth.year, calendarMonth.month).map((cell) => {
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
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2">
              <div className="grid grid-cols-2 sm:flex items-center gap-1.5 min-w-0">
                <input
                  type="date"
                  value={draftStart}
                  onChange={(e) => {
                    setDraftPreset('custom_range');
                    setDraftStart(e.target.value);
                  }}
                  className="w-full sm:w-[136px] min-w-0 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 focus:border-[#1E40FF] outline-none"
                />
                <span className="hidden sm:inline text-slate-400 text-xs">-</span>
                <input
                  type="date"
                  value={draftEnd}
                  onChange={(e) => {
                    setDraftPreset('custom_range');
                    setDraftEnd(e.target.value);
                  }}
                  className="w-full sm:w-[136px] min-w-0 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 focus:border-[#1E40FF] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:ml-auto">
                <button
                  type="button"
                  onClick={() => setDateMenuOpen(false)}
                  className="px-3 py-2 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 cursor-pointer text-center"
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
                  className="px-4 py-2 sm:py-1.5 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-xs font-semibold text-white shadow-xs cursor-pointer text-center"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`${
        mode === 'standalone'
          ? 'min-h-screen flex bg-[#F8F9FA] relative overflow-x-clip'
          : 'w-full'
      } dom-meta-scope text-slate-800`}
    >
      {/* ====================================================================
          STANDALONE MOBILE iOS SLIDE-OVER NAVIGATION DRAWER (< lg)
         ==================================================================== */}
      {mode === 'standalone' && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-50 lg:hidden bg-slate-950/45 backdrop-blur-xs flex dom-ios-backdrop"
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="w-[282px] max-w-[84vw] h-full bg-gradient-to-b from-white via-[#F8FAFF] to-[#F1F5F9] border-r border-slate-200 shadow-2xl flex flex-col justify-between select-none dom-ios-drawer-left"
          >
            <div className="overflow-y-auto">
              {/* Mobile Drawer Brand Header — Static DOMATION.NET Logo */}
              <div className="h-[76px] px-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <DomationLogoMark className="w-9 h-9 shadow-sm rounded-xl shrink-0" />
                  <div className="flex flex-col leading-none">
                    <span className="text-[17px] font-bold tracking-tight text-slate-900">
                      DOMATION<span className="text-[#1E40FF]">.NET</span>
                    </span>
                    <span className="text-[9px] font-semibold tracking-[0.15em] uppercase text-slate-500 mt-0.5">
                      Meta Report
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer dom-ios-press"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Ad Account CTA + Workspace Switcher */}
              <div className="p-3.5 border-b border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAccountModalOpen(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #60A5FA 0%, #1E40FF 55%, #1D4ED8 100%)',
                  }}
                  className="w-full rounded-xl px-3.5 py-2.5 text-white shadow-[0_6px_18px_rgba(30,64,255,0.26)] flex items-center justify-between gap-2 text-left cursor-pointer dom-ios-press"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {activeAccountObj?.name || 'Chọn / Kết nối Ad Account'}
                    </div>
                    <div className="text-[10px] font-mono text-white/80 truncate">
                      {activeAccountObj?.ad_account_id
                        ? `act_${activeAccountObj.ad_account_id}`
                        : 'Chưa gắn tài khoản QC'}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/90 shrink-0" />
                </button>

                {(onRequestSwitchWorkspace || onRequestCreateWorkspace) && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {onRequestSwitchWorkspace && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onRequestSwitchWorkspace();
                        }}
                        className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer dom-ios-press"
                      >
                        <Building2 className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                        <span className="truncate">
                          /{authContext.tenantSlug || 'workspace'}
                        </span>
                      </button>
                    )}
                    {onRequestCreateWorkspace && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onRequestCreateWorkspace();
                        }}
                        className="px-2.5 py-2 rounded-xl bg-[#F4F8FF] border border-blue-200 text-[11px] font-semibold text-[#1E40FF] flex items-center justify-center gap-1 cursor-pointer dom-ios-press"
                      >
                        <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Tạo mới</span>
                      </button>
                    )}
                  </div>
                )}

                {config.brand_filters.length > 0 && (
                  <DomMetaSelect
                    ariaLabel="Lọc theo thương hiệu"
                    value={activeBrandFilter}
                    onChange={(val) => {
                      setActiveBrandFilter(val);
                      setMobileMenuOpen(false);
                    }}
                    variant="pill"
                    className="w-full justify-between bg-white"
                    options={[
                      { value: '', label: 'Tất cả thương hiệu' },
                      ...config.brand_filters.map((b) => ({
                        value: b.filter,
                        label: b.name,
                        avatarUrl: b.avatar || undefined,
                      })),
                    ]}
                  />
                )}
              </div>

              {/* Navigation Items */}
              <div className="p-3 space-y-1">
                <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  CHỨC NĂNG CHÍNH
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = effectiveView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`mobile-nav-${item.id}`}
                      onClick={() => {
                        setActiveView(item.id);
                        setMobileMenuOpen(false);
                      }}
                      style={
                        active
                          ? {
                              background:
                                'linear-gradient(90deg, rgba(30, 64, 255, 0.14) 0%, rgba(30, 64, 255, 0.02) 100%)',
                            }
                          : undefined
                      }
                      className={`relative w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-[13px] cursor-pointer dom-ios-press ${
                        active ? 'text-[#1E40FF] font-bold' : 'text-slate-600 font-medium'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-[#3B82F6] to-[#0284C7]" />
                      )}
                      <span
                        className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${
                          active
                            ? 'bg-gradient-to-br from-[#3B82F6] to-[#0284C7] text-white shadow-[0_4px_10px_rgba(30,64,255,0.24)]'
                            : 'bg-white border border-slate-200/80 text-slate-500'
                        }`}
                      >
                        <Icon className="w-[17px] h-[17px]" />
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t border-slate-200/80 space-y-1.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCrmUpgradeOpen(true);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] text-white flex items-center justify-between gap-2 text-xs font-bold shadow-sm cursor-pointer dom-ios-press"
              >
                <span className="inline-flex items-center gap-2">
                  <Rocket className="w-4 h-4 shrink-0" />
                  <span>Upgrade lên CRM AutoData</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px]">30d 0₫</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openSettingsPage('brand');
                }}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-[13px] cursor-pointer dom-ios-press ${
                  effectiveView === 'settings'
                    ? 'bg-gradient-to-r from-[#EFF6FF] to-transparent text-[#1E40FF] font-semibold'
                    : 'font-medium text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${
                    effectiveView === 'settings'
                      ? 'bg-[#1E40FF] text-white'
                      : 'bg-white border border-slate-200/80 text-slate-500'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                </span>
                <span>Cài đặt hệ thống</span>
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer dom-ios-press"
                >
                  <span className="w-8 h-8 rounded-[10px] bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-600">
                    <LogOut className="w-4 h-4" />
                  </span>
                  <span>Đăng xuất</span>
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ====================================================================
          LEFT SIDEBAR — STANDALONE DESKTOP SHELL (100% Aligned with data.domation.net CRM)
         ==================================================================== */}
      {mode === 'standalone' && (
        <aside
          data-dom-meta-sidebar="true"
          style={{
            width: isSidebarCollapsed ? 72 : 260,
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 52%, #EEF4FF 100%)',
          }}
          className="hidden lg:flex shrink-0 border-r border-slate-200/90 shadow-[4px_0_20px_rgba(30,64,255,0.04)] flex-col justify-between select-none sticky top-0 h-screen z-40 transition-[width] duration-300 ease-out relative"
        >
          {/* Floating Circular Collapse Toggle (<) — z-50 above sticky header so never clipped */}
          <button
            type="button"
            data-testid="sidebar-collapse-toggle"
            onClick={() => setIsSidebarCollapsed((v) => !v)}
            title={isSidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            className="absolute -right-3.5 top-[30px] z-50 w-7 h-7 rounded-full bg-white border border-slate-200/95 shadow-[0_3px_10px_rgba(15,23,42,0.12)] flex items-center justify-center text-slate-600 hover:text-[#1E40FF] hover:border-blue-300 cursor-pointer transition-all"
          >
            <ChevronLeft
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                isSidebarCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className="flex flex-col min-h-0 flex-1">
            {/* Static DOMATION.NET Brand Header (86px — Aligned with Landing Page) */}
            <div
              onClick={onExitStandalone}
              className={`h-[86px] border-b border-slate-100 flex items-center shrink-0 ${
                isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-2.5'
              } ${onExitStandalone ? 'cursor-pointer' : ''}`}
            >
              <DomationLogoMark className="w-10 h-10 shadow-sm rounded-xl shrink-0" />
              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1 flex flex-col leading-none">
                  <span className="text-[19px] font-bold tracking-tight text-slate-900 whitespace-nowrap">
                    DOMATION<span className="text-[#1E40FF]">.NET</span>
                  </span>
                  <span className="text-[9.5px] font-semibold tracking-[0.16em] uppercase text-slate-500 mt-1 whitespace-nowrap">
                    Meta Report
                  </span>
                </div>
              )}
            </div>

            {/* Primary Gradient CTA — Active Ad Account Switcher */}
            <div
              className={`border-b border-slate-100 flex justify-center shrink-0 ${
                isSidebarCollapsed ? 'py-3 px-2' : 'px-4 py-4'
              }`}
            >
              {isSidebarCollapsed ? (
                <button
                  type="button"
                  data-testid="open-account-manager"
                  onClick={() => setAccountModalOpen(true)}
                  title={activeAccountObj?.name || 'Quản lý Ad Account'}
                  style={{
                    background: 'linear-gradient(135deg, #60A5FA 0%, #1E40FF 55%, #1D4ED8 100%)',
                  }}
                  className="w-11 h-11 rounded-full text-white shadow-[0_4px_14px_rgba(37,99,235,0.28)] flex items-center justify-center cursor-pointer dom-ios-press"
                >
                  <CreditCard className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="open-account-manager"
                  onClick={() => setAccountModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #60A5FA 0%, #1E40FF 55%, #1D4ED8 100%)',
                  }}
                  className="w-full rounded-2xl px-3.5 py-2.5 text-white shadow-[0_6px_18px_rgba(30,64,255,0.26)] hover:brightness-105 flex items-center justify-between gap-2 text-left cursor-pointer dom-ios-press"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white/40 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {activeAccountObj?.name || 'Kết nối Ad Account'}
                      </div>
                      <div className="text-[10px] font-mono text-white/80 truncate">
                        {activeAccountObj?.ad_account_id
                          ? `#${activeAccountObj.ad_account_id}`
                          : 'Bấm để chọn tài khoản'}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/85 shrink-0" />
                </button>
              )}
            </div>

            {/* Scrollable Nav Container */}
            <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-5">
              <div>
                {!isSidebarCollapsed && (
                  <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    CHỨC NĂNG CHÍNH
                  </div>
                )}
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = effectiveView === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`nav-${item.id}`}
                        onClick={() => setActiveView(item.id)}
                        title={isSidebarCollapsed ? item.label : undefined}
                        style={
                          active
                            ? {
                                background:
                                  'linear-gradient(90deg, rgba(30, 64, 255, 0.14) 0%, rgba(30, 64, 255, 0.02) 100%)',
                              }
                            : undefined
                        }
                        className={`relative w-full rounded-xl flex items-center transition-all cursor-pointer dom-ios-press ${
                          isSidebarCollapsed
                            ? 'justify-center py-2 px-0'
                            : 'px-3 py-2 gap-3 text-[13px]'
                        } ${
                          active
                            ? 'text-[#1E40FF] font-bold'
                            : 'text-slate-600 font-medium hover:bg-blue-50/50 hover:text-slate-900'
                        }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-[#3B82F6] to-[#0284C7]" />
                        )}
                        <span
                          className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-all ${
                            active
                              ? 'bg-gradient-to-br from-[#3B82F6] to-[#0284C7] text-white shadow-[0_4px_10px_rgba(30,64,255,0.24)]'
                              : 'bg-white border border-slate-200/80 text-slate-500'
                          }`}
                        >
                          <Icon className="w-[17px] h-[17px]" />
                        </span>
                        {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div>
                {!isSidebarCollapsed && (
                  <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    CÀI ĐẶT HỆ THỐNG
                  </div>
                )}
                <div className="space-y-1">
                  <button
                    type="button"
                    data-testid="open-workspace-settings"
                    onClick={() => openSettingsPage('brand')}
                    title={isSidebarCollapsed ? 'Cài đặt hệ thống' : undefined}
                    className={`relative w-full rounded-xl flex items-center transition-all cursor-pointer dom-ios-press ${
                      isSidebarCollapsed
                        ? 'justify-center py-2 px-0'
                        : 'px-3 py-2 gap-3 text-[13px]'
                    } ${
                      effectiveView === 'settings'
                        ? 'bg-gradient-to-r from-[#EFF6FF] to-transparent text-[#1E40FF] font-semibold shadow-xs'
                        : 'text-slate-600 font-medium hover:bg-blue-50/50 hover:text-slate-900'
                    }`}
                  >
                    {effectiveView === 'settings' && !isSidebarCollapsed && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3.5px] rounded-r-full bg-[#1E40FF]" />
                    )}
                    <span
                      className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${
                        effectiveView === 'settings'
                          ? 'bg-gradient-to-br from-[#1E40FF] to-[#0284C7] text-white shadow-sm'
                          : 'bg-white border border-slate-200/80 text-slate-500'
                      }`}
                    >
                      <Settings className="w-[17px] h-[17px]" />
                    </span>
                    {!isSidebarCollapsed && (
                      <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
                        <span className="truncate">Cài đặt hệ thống</span>
                        {config.ai_config?.has_api_key && (
                          <span
                            className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                            title="AI API Key đã cấu hình"
                          />
                        )}
                      </div>
                    )}
                  </button>

                  {onRequestCreateWorkspace && (
                    <button
                      type="button"
                      data-testid="standalone-create-workspace"
                      onClick={onRequestCreateWorkspace}
                      title={isSidebarCollapsed ? 'Tạo Workspace mới' : undefined}
                      className={`w-full rounded-xl flex items-center text-slate-600 font-medium hover:bg-blue-50/50 hover:text-[#1E40FF] transition-all cursor-pointer dom-ios-press ${
                        isSidebarCollapsed
                          ? 'justify-center py-2 px-0'
                          : 'px-3 py-2 gap-3 text-[13px]'
                      }`}
                    >
                      <span className="w-9 h-9 rounded-[10px] bg-white border border-slate-200/80 flex items-center justify-center text-[#1E40FF] shrink-0">
                        <PlusCircle className="w-[17px] h-[17px]" />
                      </span>
                      {!isSidebarCollapsed && <span className="truncate">Tạo Workspace mới</span>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lower Sidebar Architectural Blueprint Decor + Upgrade to CRM AutoData CTA */}
          <div className="relative overflow-hidden shrink-0">
            {/* Subtle Architectural '+' Crosshair & Hairline Blueprint Decor (matching workspace canvas corner) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden select-none"
            >
              <div className="absolute left-4 top-0 bottom-0 w-px bg-[#1E40FF]/[0.09]" />
              <div className="absolute left-0 right-0 top-3.5 h-px bg-[#1E40FF]/[0.09]" />
              <span className="absolute left-[11.5px] top-[5px] text-[13px] font-medium leading-none text-[#1E40FF]/45">
                +
              </span>
              {!isSidebarCollapsed && (
                <>
                  <div className="absolute right-4 top-0 bottom-0 w-px bg-[#1E40FF]/[0.06]" />
                  <span className="absolute right-[11.5px] top-[5px] text-[12px] font-medium leading-none text-[#1E40FF]/30">
                    +
                  </span>
                  <svg
                    viewBox="0 0 260 150"
                    className="absolute inset-0 w-full h-full opacity-75"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M -10,125 C 65,65 145,140 270,55"
                      fill="none"
                      stroke="#1E40FF"
                      strokeWidth="1"
                      strokeOpacity="0.14"
                    />
                    <path
                      d="M -10,145 C 80,95 160,150 270,82"
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth="0.9"
                      strokeOpacity="0.11"
                    />
                  </svg>
                </>
              )}
            </div>

            {/* Upgrade to CRM AutoData Card / Button (Compact Light UI) */}
            <div className={`relative z-10 ${isSidebarCollapsed ? 'px-2 pt-3 pb-2 flex justify-center' : 'px-3 pt-3 pb-2'}`}>
              {isSidebarCollapsed ? (
                <button
                  type="button"
                  data-testid="open-crm-upgrade-modal"
                  onClick={() => setCrmUpgradeOpen(true)}
                  title="Upgrade lên CRM AutoData (Dùng thử 30 ngày 0₫)"
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white shadow-[0_6px_14px_rgba(30,64,255,0.28)] flex items-center justify-center cursor-pointer dom-ios-press"
                >
                  <Rocket className="w-4 h-4" />
                </button>
              ) : (
                <div className="rounded-2xl bg-gradient-to-br from-[#F4F8FF] via-white to-blue-50/70 backdrop-blur-md border border-blue-200/80 shadow-[0_6px_18px_-8px_rgba(30,64,255,0.16)] p-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-blue-100 text-[#1E40FF] text-[9.5px] font-extrabold uppercase tracking-wide">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>CRM AutoData</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9.5px] font-bold">
                      30d 0₫
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 leading-snug px-0.5">
                    <strong className="text-slate-900 block text-[11.5px]">Auto Chia Số &amp; Track Lead</strong>
                    Đồng bộ khách nét về từng Ad &lt;1s
                  </div>
                  <button
                    type="button"
                    data-testid="open-crm-upgrade-modal"
                    onClick={() => setCrmUpgradeOpen(true)}
                    className="w-full py-1.5 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer dom-ios-press"
                  >
                    <Rocket className="w-3 h-3" />
                    <span>Upgrade CRM</span>
                  </button>
                </div>
              )}
            </div>

            {onLogout && (
              <div className="relative z-10 px-2.5 py-2 border-t border-slate-200/75 bg-white/75 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={onLogout}
                  title="Đăng xuất"
                  className={`w-full rounded-xl flex items-center text-rose-600 font-medium hover:bg-rose-50 transition-all cursor-pointer dom-ios-press ${
                    isSidebarCollapsed
                      ? 'justify-center py-2 px-0'
                      : 'justify-between px-3 py-1.5 text-[13px]'
                  }`}
                >
                  {!isSidebarCollapsed && <span className="truncate font-semibold">Đăng xuất</span>}
                  <span className="w-8 h-8 rounded-[10px] bg-white border border-rose-200/75 flex items-center justify-center text-rose-500 shrink-0">
                    <LogOut className="w-4 h-4" />
                  </span>
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ====================================================================
          RIGHT WORKSPACE COLUMN (Standalone Canvas w/ Luxury Decor OR Single-Padding Embedded Column)
         ==================================================================== */}
      <div
        className={
          mode === 'standalone'
            ? 'dom-meta-app-canvas flex-1 min-w-0 flex flex-col relative'
            : 'w-full flex flex-col gap-3.5'
        }
      >
        {/* Architectural Hairline Frame + '+' Crosshairs + Silk Waves + Watermarks (Standalone Only — Embedded Already Inherits CRM's LuxuryBackgroundDecor) */}
        {mode === 'standalone' && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 top-[60px] lg:top-[66px] overflow-hidden z-0 select-none"
            aria-hidden="true"
          >
            <div className="dom-meta-brochure-frame">
              <span className="dom-frame-cross bl">+</span>
              <span className="dom-frame-cross br">+</span>
            </div>
            <svg
              className="absolute inset-0 w-full h-full opacity-60"
              viewBox="0 0 1440 500"
              preserveAspectRatio="none"
            >
              <path
                d="M -50,420 C 320,180 680,480 1050,240 C 1280,100 1390,260 1500,190"
                fill="none"
                stroke="#1E40FF"
                strokeWidth="1.2"
                strokeOpacity="0.22"
              />
              <path
                d="M -50,460 C 360,230 720,510 1090,280 C 1310,140 1410,300 1500,230"
                fill="none"
                stroke="#0284C7"
                strokeWidth="0.9"
                strokeOpacity="0.16"
              />
              <path
                d="M -50,140 C 380,310 820,40 1220,240 C 1360,310 1440,220 1500,260"
                fill="none"
                stroke="#1E40FF"
                strokeWidth="0.8"
                strokeOpacity="0.13"
              />
            </svg>
            <DomationLogoMark className="absolute -top-7 -left-9 w-[250px] h-[250px] opacity-[0.065] pointer-events-none select-none" />
            <DomationLogoMark className="absolute -bottom-9 -right-9 w-[230px] h-[230px] opacity-[0.055] pointer-events-none select-none" />
          </div>
        )}

        {/* ====================================================================
            TOP HEADER BAR
            - Standalone: 66px White CRM-Style Header (Date + /slug on left | Brand + Actions + Profile on right)
            - Embedded (CRM / ERP): Compact Single-Row Toolbar (1 Layer of Padding Only!)
           ==================================================================== */}
        <header
          className={
            mode === 'standalone'
              ? 'sticky top-0 z-30 h-[60px] lg:h-[66px] bg-white/[0.97] md:bg-white/92 backdrop-blur-xl border-b border-slate-200/85 px-3.5 sm:px-6 flex items-center gap-2 sm:gap-2.5 shrink-0'
              : 'relative z-20 rounded-2xl bg-white border border-slate-200/85 shadow-[0_2px_10px_rgba(15,23,42,0.03)] px-3 py-2 flex items-center justify-between gap-2 flex-wrap xl:flex-nowrap'
          }
        >
          {mode === 'standalone' ? (
            <>
              {/* Mobile Hamburger + Account Pill (< lg, pushed left via mr-auto) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden order-1 w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 shrink-0 cursor-pointer dom-ios-press"
                aria-label="Mở menu điều hướng"
              >
                <Menu className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setAccountModalOpen(true)}
                className="lg:hidden order-2 mr-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-800 max-w-[150px] truncate cursor-pointer dom-ios-press"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">
                  {activeAccountObj?.name || authContext.tenantSlug || 'Ad Account'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {/* Standalone Date Range Picker: Left on Desktop (>= lg), Right on Mobile/Tablet (< lg) */}
              <div className="order-3 lg:order-1 shrink-0">{datePickerControl}</div>

              {/* Desktop Workspace Switcher Pill (>= lg) right beside Date Picker */}
              {authContext.tenantSlug && (
                <button
                  type="button"
                  data-testid="standalone-switch-workspace"
                  onClick={onRequestSwitchWorkspace}
                  className={`hidden lg:inline-flex lg:order-2 items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-50 hover:bg-blue-50/70 border border-slate-200/90 text-xs font-bold text-slate-700 hover:text-[#1E40FF] transition-colors shrink-0 ${
                    onRequestSwitchWorkspace ? 'cursor-pointer dom-ios-press' : 'cursor-default'
                  }`}
                  title={`Không gian: ${workspaceName}`}
                >
                  <Building2 className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                  <span className="max-w-[140px] truncate">
                    {authContext.tenantSlug}
                    {workspacesCount > 1 ? ` (${workspacesCount})` : ''}
                  </span>
                  {onRequestSwitchWorkspace && (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>
              )}
            </>
          ) : (
            /* Embedded Mode: Compact Account Pill + Desktop Single-Line View Tabs */
            <div className="flex items-center gap-2 min-w-0 shrink lg:flex-1">
              {hasConnectedAccounts ? (
                <div className="inline-flex items-center gap-1 min-w-0">
                  <button
                    type="button"
                    data-testid="open-account-manager"
                    onClick={() => setAccountModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer dom-ios-press min-w-0"
                    title={
                      activeAccountObj?.ad_account_id
                        ? `Tài khoản: ${activeAccountObj.name} (act_${activeAccountObj.ad_account_id})`
                        : 'Chọn tài khoản quảng cáo'
                    }
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="max-w-[100px] sm:max-w-[140px] truncate">
                      {activeAccountObj?.name || 'Tài khoản QC'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                  {canManageConfig && (
                    <button
                      type="button"
                      data-testid="open-quick-connect"
                      onClick={() => setQuickConnectOpen(true)}
                      title="Kết nối nhanh hoặc thêm tài khoản Meta"
                      className="w-7 h-7 rounded-lg bg-[#F4F8FF] hover:bg-blue-100/80 border border-blue-200/80 text-[#1E40FF] flex items-center justify-center cursor-pointer dom-ios-press shrink-0"
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  data-testid="open-quick-connect"
                  onClick={() => setQuickConnectOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#1E40FF] to-[#0284C7] text-white text-xs font-semibold shadow-xs cursor-pointer shrink-0 dom-ios-press"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Kết nối Meta</span>
                </button>
              )}

              <div className="hidden lg:block min-w-0">
                <DomResponsiveSubtabs
                  variant="segmented"
                  maxMobile={2}
                  maxTablet={4}
                  maxDesktop={6}
                  value={effectiveView}
                  onChange={(id) => setActiveView(id as DomMetaNavView)}
                  tabs={navItems.map((item) => ({
                    id: item.id,
                    label: item.shortLabel,
                    shortLabel: item.shortLabel,
                    testId: `nav-${item.id}`,
                  }))}
                />
              </div>
            </div>
          )}

          {/* Right Side of Header — Brand Filter + Embedded Date Picker + Compact Action Capsule + User Profile */}
          <div
            className={`flex items-center gap-1.5 sm:gap-2 shrink-0 ${
              mode === 'standalone' ? 'order-4 lg:order-3 lg:ml-auto' : ''
            }`}
          >
            {/* Brand Quick Filter (Desktop) */}
            {config.brand_filters.length > 0 && (
              <div className="hidden md:block">
                <DomMetaSelect
                  ariaLabel="Lọc theo thương hiệu"
                  testId="brand-filter-select"
                  value={activeBrandFilter}
                  onChange={(val) => setActiveBrandFilter(val)}
                  variant="pill"
                  className="bg-slate-50/90"
                  options={[
                    { value: '', label: 'Tất cả thương hiệu' },
                    ...config.brand_filters.map((b) => ({
                      value: b.filter,
                      label: b.name,
                      avatarUrl: b.avatar || undefined,
                    })),
                  ]}
                />
              </div>
            )}

            {mode !== 'standalone' && datePickerControl}

            {/* Mobile Header Overflow Menu (< md): Strictly 2 right-side controls (Date Pill + More) */}
            <div className="md:hidden">
              <DomOverflowMenu
                testId="mobile-header-overflow"
                badgeCount={smartAlerts.length}
                items={[
                  ...(dataset && isAiAdsEvalAllowed
                    ? [
                        {
                          id: 'ai_summary',
                          label: 'AI Phân tích hiệu suất',
                          description: 'Chẩn đoán chiến dịch & đề xuất tối ưu',
                          icon: <Sparkles className="w-3.5 h-3.5 text-[#1E40FF]" />,
                          onClick: () => setAiModalOpen(true),
                        },
                      ]
                    : []),
                  {
                    id: 'focus_tour',
                    label: 'Tour Hướng Dẫn',
                    description: 'Xem chỉ điểm 5 bước trực quan',
                    icon: <HelpCircle className="w-3.5 h-3.5 text-[#1E40FF]" />,
                    onClick: () => {
                      setTourStepIdx(0);
                      setTourOpen(true);
                    },
                  },
                  {
                    id: 'share',
                    label: 'Chia sẻ báo cáo & phân quyền',
                    icon: <Share2 className="w-3.5 h-3.5" />,
                    onClick: () => setShareModalOpen(true),
                  },
                  {
                    id: 'settings',
                    label: 'Cài đặt Workspace & API',
                    icon: <Settings className="w-3.5 h-3.5" />,
                    onClick: () => openSettingsPage('brand'),
                  },
                ]}
              />
            </div>

            {/* Desktop/Tablet Compact Action Capsule (>= md) */}
            <div className="hidden md:inline-flex items-center gap-0.5 p-0.5 rounded-full bg-slate-50 border border-slate-200/90">
              <button
                type="button"
                data-testid="open-dom-meta-tour"
                onClick={() => {
                  setTourStepIdx(0);
                  setTourOpen(true);
                }}
                title="Tour Hướng Dẫn DOM Meta Report"
                className="w-7 h-7 rounded-full hover:bg-white flex items-center justify-center text-slate-600 hover:text-[#1E40FF] cursor-pointer dom-ios-press"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              {dataset && (
                <button
                  type="button"
                  data-testid="open-ai-summary"
                  onClick={() =>
                    isAiAdsEvalAllowed ? setAiModalOpen(true) : openSettingsPage('ai_key')
                  }
                  title={
                    isAiAdsEvalAllowed
                      ? 'AI Phân tích hiệu suất'
                      : 'AI đánh giá Quảng cáo đang tắt — bấm để mở Cài đặt AI'
                  }
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer dom-ios-press ${
                    isAiAdsEvalAllowed
                      ? 'bg-[#F4F8FF] hover:bg-blue-100/80 text-[#1E40FF]'
                      : 'bg-slate-100 text-slate-500 hover:text-[#1E40FF]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden 2xl:inline">{isAiAdsEvalAllowed ? 'AI' : 'AI (Tắt)'}</span>
                </button>
              )}

              {/* Alerts Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAlertsOpen((v) => !v)}
                  title="Trung tâm cảnh báo chiến dịch"
                  className="relative w-7 h-7 rounded-full hover:bg-white flex items-center justify-center text-slate-600 cursor-pointer dom-ios-press"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {smartAlerts.length > 0 && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {smartAlerts.length}
                    </span>
                  )}
                </button>
                {alertsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-3.5 space-y-2 dom-ios-modal">
                    <div className="text-xs font-bold text-slate-800">
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
                  onClick={() => openSettingsPage('brand')}
                  className="w-7 h-7 rounded-full hover:bg-white flex items-center justify-center text-slate-600 cursor-pointer dom-ios-press"
                  title="Cài đặt Workspace & API"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                data-testid="copy-share-url"
                onClick={() => setShareModalOpen(true)}
                className="w-7 h-7 rounded-full hover:bg-white flex items-center justify-center text-slate-600 hover:text-[#1E40FF] cursor-pointer dom-ios-press"
                title="Chia sẻ báo cáo & phân quyền truy cập"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Standalone Desktop User Profile Block (Aligned with data.domation.net CRM Header) */}
            {mode === 'standalone' && (
              <div className="hidden lg:flex items-center gap-2.5 pl-2.5 border-l border-slate-200/80">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white text-xs font-bold flex items-center justify-center shadow-xs shrink-0">
                  {userDisplayName.slice(0, 1).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-bold text-slate-900 max-w-[125px] truncate">
                    {userDisplayName}
                  </div>
                  <div className="text-[10.5px] font-semibold text-slate-400">
                    {formatDomMetaRoleBadge(userRoleLabel)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Embedded Mobile/Tablet Dedicated View Subtabs Row (< lg): Clean full-width row with zero header collision */}
          {mode === 'embedded' && (
            <div className="lg:hidden w-full pt-1.5 border-t border-slate-100 min-w-0">
              <DomResponsiveSubtabs
                variant="segmented"
                maxMobile={1}
                maxTablet={4}
                maxDesktop={6}
                className="w-full justify-between"
                value={effectiveView}
                onChange={(id) => setActiveView(id as DomMetaNavView)}
                tabs={navItems.map((item) => ({
                  id: item.id,
                  label: item.shortLabel,
                  shortLabel: item.shortLabel,
                  testId: `nav-mobile-${item.id}`,
                }))}
              />
            </div>
          )}
        </header>

        {/* ====================================================================
            MAIN BODY CONTENT WRAPPER
            - Standalone: Padded inside architectural frame (+ mobile bottom tab clearance)
            - Embedded: Zero extra wrapper padding (1 layer of padding from CRM/ERP <main>)
           ==================================================================== */}
        <div
          className={
            mode === 'standalone'
              ? 'relative z-10 flex-1 min-w-0 p-3.5 sm:p-6 lg:px-8 lg:py-6 pb-24 lg:pb-8 flex flex-col gap-4 max-w-[1640px] w-full mx-auto'
              : 'relative z-10 flex flex-col gap-4'
          }
        >
          {/* Empty Onboarding Prompt when no Meta Ad Account connected yet */}
          {!loading &&
            !hasConnectedAccounts &&
            effectiveView !== 'meta_capi' &&
            effectiveView !== 'google_ads' && (
            <div className="flex-1 min-h-[calc(100vh-180px)] flex items-center justify-center py-6">
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
                      className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#1E40FF] to-[#0284C7] hover:brightness-110 text-white text-xs sm:text-sm font-semibold shadow-[0_12px_28px_-8px_rgba(30,64,255,0.5)] cursor-pointer inline-flex items-center gap-2 transition-all dom-ios-press"
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
                className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 font-semibold cursor-pointer shrink-0 dom-ios-press"
              >
                Kiểm tra Token
              </button>
            </div>
          )}

          {/* ====================================================================
              COMPLETE VIEW-ACCURATE NEUTRAL SHIMMER SKELETONS (Zero Green Borders!)
             ==================================================================== */}
          {loading && effectiveView === 'dashboard' && (
            <div className="space-y-4">
              {/* Row 1 Skeleton: KPI Stack + Daily Spent + Meta Goal */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200/80 p-3.5 space-y-2.5">
                  <div className="h-[104px] rounded-xl dom-meta-skeleton p-4 flex flex-col justify-between" />
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-[60px] rounded-xl dom-meta-skeleton-soft p-3 flex flex-col justify-between"
                    >
                      <div className="h-2.5 w-20 rounded dom-meta-skeleton" />
                      <div className="h-4 w-28 rounded dom-meta-skeleton" />
                    </div>
                  ))}
                </div>
                <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 rounded dom-meta-skeleton" />
                    <div className="h-7 w-28 rounded-full dom-meta-skeleton-soft" />
                  </div>
                  <div className="h-[225px] rounded-xl dom-meta-skeleton-soft mt-4" />
                </div>
                <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 rounded dom-meta-skeleton" />
                    <div className="h-7 w-24 rounded-lg dom-meta-skeleton-soft" />
                  </div>
                  <div className="h-[215px] flex items-end justify-around gap-5 px-4 pt-6">
                    <div className="w-14 h-[84%] rounded-t-xl dom-meta-skeleton" />
                    <div className="w-14 h-[42%] rounded-t-xl dom-meta-skeleton-soft" />
                    <div className="w-14 h-[22%] rounded-t-xl dom-meta-skeleton-soft" />
                  </div>
                </div>
              </div>

              {/* Row 2 Skeleton: Active/Interaction + Spent Platform + Age & Gender */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5 space-y-3.5">
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-16 rounded-xl dom-meta-skeleton-soft" />
                    ))}
                  </div>
                  <div className="h-3.5 w-24 rounded dom-meta-skeleton" />
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-14 rounded-xl dom-meta-skeleton-soft" />
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 rounded dom-meta-skeleton" />
                    <div className="h-6 w-16 rounded-lg dom-meta-skeleton-soft" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center pt-2">
                    <div className="space-y-2.5">
                      <div className="h-12 rounded-xl dom-meta-skeleton-soft" />
                      <div className="h-12 rounded-xl dom-meta-skeleton-soft" />
                      <div className="h-12 rounded-xl dom-meta-skeleton-soft" />
                    </div>
                    <div className="w-32 h-32 rounded-full dom-meta-skeleton mx-auto" />
                  </div>
                </div>
                <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 rounded dom-meta-skeleton" />
                    <div className="h-6 w-20 rounded-lg dom-meta-skeleton-soft" />
                  </div>
                  <div className="h-[180px] flex items-end justify-around gap-3 px-2 pt-4">
                    {[38, 76, 92, 64, 42, 24].map((h, i) => (
                      <div
                        key={i}
                        className="w-7 rounded-t-lg dom-meta-skeleton"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3 Skeleton: Dayparting Heatmap + Regional/Funnel/Device/Top 5 */}
              <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-48 rounded dom-meta-skeleton" />
                  <div className="h-7 w-28 rounded-full dom-meta-skeleton-soft" />
                </div>
                <div className="h-40 rounded-xl dom-meta-skeleton-soft" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-3"
                  >
                    <div className="h-4 w-36 rounded dom-meta-skeleton" />
                    {[0, 1, 2, 3, 4].map((r) => (
                      <div key={r} className="h-9 rounded-xl dom-meta-skeleton-soft" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading &&
            (effectiveView === 'ad_detail' || effectiveView === 'lead_attribution') && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-56 rounded-full dom-meta-skeleton-soft" />
                    <div className="h-8 w-36 rounded-full dom-meta-skeleton-soft" />
                  </div>
                  <div className="h-8 w-28 rounded-full dom-meta-skeleton" />
                </div>
                <div className="space-y-2.5 pt-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="h-14 rounded-xl dom-meta-skeleton-soft" />
                  ))}
                </div>
              </div>
            )}

          {loading && effectiveView === 'ad_library' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white border border-slate-200/80 p-3.5 space-y-3"
                >
                  <div className="aspect-square rounded-xl dom-meta-skeleton-soft" />
                  <div className="h-4 w-3/4 rounded dom-meta-skeleton" />
                  <div className="h-8 rounded-xl dom-meta-skeleton-soft" />
                </div>
              ))}
            </div>
          )}

          {loading && effectiveView === 'account' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-2xl dom-meta-skeleton-soft" />
                ))}
              </div>
              <div className="h-64 rounded-2xl bg-white border border-slate-200/80 p-5">
                <div className="h-full rounded-xl dom-meta-skeleton-soft" />
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
              <div className="lg:col-span-3 relative rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-3.5 flex flex-col justify-between gap-2.5 min-w-0">
                <button
                  type="button"
                  data-testid="open-perf-compare"
                  onClick={() => setPerfCompareOpen(true)}
                  title="Báo cáo đối soát kỳ trước"
                  className="absolute right-5 top-5 lg:-right-3 lg:top-1/2 lg:-translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:text-[#1E40FF] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Hero Royal Sapphire Spent Card */}
                <div className="rounded-xl bg-gradient-to-br from-[#1E40FF] via-[#1B4DFF] to-[#0284C7] text-white p-3.5 sm:p-4 pr-12 sm:pr-12 lg:pr-4 shadow-[0_10px_24px_-8px_rgba(30,64,255,0.45)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-white/90">Spent</span>
                    {renderDeltaPill(
                      dataset.currentTotals.spend,
                      dataset.prevTotals.spend,
                      true
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl xl:text-[26px] font-bold tracking-tight mt-1.5 sm:mt-2 tabular-nums">
                    {formatDomMoney(dataset.currentTotals.spend, currency)}
                  </div>
                </div>

                {/* 3 Customizable Secondary KPI Cards (3-col native mobile strip < lg, stacked on lg) */}
                <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 lg:gap-2.5">
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
                        ? formatDomMoneyShort(currVal, currency)
                        : fmt === 'percent'
                          ? `${currVal.toFixed(2)}%`
                          : fmt === 'decimal'
                            ? currVal.toFixed(2)
                            : formatDomNumber(currVal);

                    return (
                      <div
                        key={metricId}
                        className="rounded-xl bg-slate-50/95 border border-slate-100 px-2.5 sm:px-3.5 py-2 sm:py-2.5 flex flex-col justify-between min-w-0"
                      >
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <span className="text-[10.5px] sm:text-xs font-medium text-slate-500 truncate">
                            {kpiLabel}
                          </span>
                          <span className="hidden sm:inline-flex">{renderDeltaPill(currVal, prevVal)}</span>
                        </div>
                        <div className="text-sm sm:text-[17px] font-bold sm:font-semibold text-slate-800 mt-1 tabular-nums truncate">
                          {formattedVal}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Daily Spent Smooth Area Chart */}
              <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 shrink-0">
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
                      { value: 'result', label: 'Results (KQ)' },
                      { value: 'cpr', label: 'CPR (Chi phí/KQ)' },
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
              <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 shrink-0 flex-nowrap min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 shrink-0">
                    <Target className="w-4 h-4 text-[#1E40FF]" />
                    <span>Meta Goal</span>
                  </div>
                  <div className="flex items-center gap-1 flex-nowrap min-w-0">
                    {metaGoalBars.some((x) => Number(x.result || 0) > 0) && (
                      <DomMetaSelect
                        ariaLabel="Chọn chỉ số Meta Goal"
                        value={metaGoalMetric}
                        onChange={(v) => setMetaGoalMetric(v as 'spend' | 'result' | 'cpr')}
                        variant="compact"
                        align="right"
                        options={[
                          { value: 'spend', label: 'Chi tiêu (Spent)' },
                          { value: 'result', label: 'Kết quả (Result)' },
                          { value: 'cpr', label: 'Chi phí/KQ (CPR)' },
                        ]}
                      />
                    )}
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
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-[11px] font-medium text-slate-700 hover:text-[#1E40FF] cursor-pointer whitespace-nowrap shrink-0"
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
                      onClick={() => openSettingsPage('goals')}
                      className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-[#1E40FF] cursor-pointer shrink-0"
                      title="Cài đặt từ khóa Goal & 3 chỉ số KPI"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <MetaGoalBarChart
                  items={metaGoalBars}
                  currency={currency}
                  metric={metaGoalMetric}
                  onMetricChange={setMetaGoalMetric}
                  hideMetricSelect
                />
              </div>
            </div>

            {/* ROW 2: Active Status + Interaction (No Empty Gap!) | Spent Platform Donut | Age & Gender */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5 flex flex-col gap-3.5">
                {(() => {
                  const spendCamps = filteredCampaigns;
                  const spendAdsets = spendCamps.flatMap((c) => c.adsets);
                  const spendAds = spendAdsets.flatMap((a) => a.ads);
                  const actCamps = spendCamps.filter(
                    (c) => c.effective_status.toUpperCase() === 'ACTIVE'
                  ).length;
                  const actAdsets = spendAdsets.filter(
                    (a) => a.effective_status.toUpperCase() === 'ACTIVE'
                  ).length;
                  const actAds = spendAds.filter(
                    (ad) => ad.effective_status.toUpperCase() === 'ACTIVE'
                  ).length;
                  return (
                    <div className="grid grid-cols-3 gap-2 shrink-0">
                      {[
                        {
                          label: 'Active Campaign',
                          active: actCamps,
                          total: spendCamps.length,
                        },
                        {
                          label: 'Active Adset',
                          active: actAdsets,
                          total: spendAdsets.length,
                        },
                        {
                          label: 'Active Ads',
                          active: actAds,
                          total: spendAds.length,
                        },
                      ].map((st) => {
                        const ratio =
                          st.total > 0 ? Math.round((st.active / st.total) * 100) : 0;
                        return (
                          <div
                            key={st.label}
                            className="rounded-xl bg-slate-50/95 border border-slate-100 px-2.5 py-2.5 flex flex-col justify-between"
                          >
                            <div className="text-[10.5px] font-medium text-slate-500 leading-tight truncate">
                              {st.label}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-sm sm:text-[15px] font-bold text-slate-800 tabular-nums">
                                {st.active}/{st.total}
                              </span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-slate-200/85 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">Interaction</span>
                    <span className="text-[11px] font-medium text-slate-400">
                      CTR {dataset.currentTotals.ctr.toFixed(2)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 flex-1">
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
                        className="rounded-xl bg-slate-50/90 border border-slate-100 px-3 py-2.5 flex flex-col justify-between"
                      >
                        <div className="text-[10.5px] font-medium text-slate-500 leading-tight truncate">
                          {lbl}
                        </div>
                        <div className="text-sm sm:text-[15px] font-bold text-slate-800 mt-1 tabular-nums">
                          {formatDomNumber(Number(val || 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5 flex flex-col">
                <SpentPlatformDonutCard
                  platforms={dataset.platforms}
                  positions={dataset.positions}
                  platformDevices={dataset.platformDevices}
                  currency={currency}
                />
              </div>

              <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#1E40FF]" />
                    <span>Age &amp; Gender</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DomMetaSelect
                      ariaLabel="Chọn chỉ số Age & Gender"
                      value={ageMetric}
                      onChange={(v) => setAgeMetric(v as 'spend' | 'result' | 'cpr')}
                      variant="compact"
                      align="right"
                      options={[
                        { value: 'spend', label: 'Spent' },
                        { value: 'result', label: 'Result' },
                        { value: 'cpr', label: 'CPR' },
                      ]}
                    />
                    <button
                      type="button"
                      onClick={() => setAgeOnly((v) => !v)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        ageOnly
                          ? 'bg-[#1E40FF] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-[#1E40FF]'
                      }`}
                    >
                      {ageOnly ? 'By Gender' : 'Age Only'}
                    </button>
                  </div>
                </div>
                <AgeGenderBarChart
                  buckets={dataset.ageGender}
                  ageOnly={ageOnly}
                  metric={ageMetric}
                  currency={currency}
                />
              </div>
            </div>

            {/* ROW 3: Dayparting Heatmap (8 cols) + Region Spent (4 cols, Scroll-Bounded Same Height) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5 flex flex-col lg:h-[365px]">
                <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
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
                      { value: 'result', label: 'Results (KQ)' },
                      { value: 'cpr', label: 'CPR (Chi phí/KQ)' },
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

              <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-4 sm:p-5 flex flex-col lg:h-[365px] overflow-hidden">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2.5 shrink-0">
                  <MapPin className="w-4 h-4 text-[#1E40FF]" />
                  <span>Địa Lý &amp; Tỉnh Thành</span>
                </div>
                <RegionSpentBarChart
                  regions={dataset.regions}
                  countries={dataset.countries}
                  currency={currency}
                />
              </div>
            </div>

            {/* Full Dashboard Analytics Section (Auto-Shown) */}
            <div className="space-y-4">
              {/* Deep Row A: 24h Hourly Spend/Result (Advertiser vs Audience TZ) + Full User Behavior Funnel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  <div className="lg:col-span-7 rounded-2xl bg-white/95 border border-slate-200/85 shadow-[0_2px_12px_rgba(15,23,42,0.03)] p-4 sm:p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 shrink-0">
                      <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#1E40FF]" />
                        <span>Phân Bổ 24 Khung Giờ (Chi Tiêu, Kết Quả &amp; Múi Giờ)</span>
                      </h3>
                      <span className="text-[11px] font-medium text-slate-400">00:00 – 23:59</span>
                    </div>
                    <HourlySpendResultChart
                      hourly={dashboardHourly}
                      hourlyAudience={dataset.hourlyAudience}
                      currency={currency}
                    />
                  </div>

                  <div className="lg:col-span-5 rounded-2xl bg-white/95 border border-slate-200/85 shadow-[0_2px_12px_rgba(15,23,42,0.03)] p-4 sm:p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 shrink-0">
                      <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#1E40FF]" />
                        <span>Phễu Hành Vi &amp; Tương Tác Người Dùng</span>
                      </h3>
                      <span className="text-[11px] font-medium text-slate-400">Full Funnel</span>
                    </div>
                    <UserBehaviorFunnelCard
                      metrics={{
                        ...dataset.currentTotals,
                        result: dashboardTotalResults,
                      }}
                      currency={currency}
                      compact
                    />
                  </div>
                </div>

                {/* Deep Row B: Video Retention + Hardware Device Donut + Top 5 Campaigns */}
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
                      avgWatchTimeSec={dataset.currentTotals.video_avg_time}
                      completionRate={dataset.currentTotals.completion_rate}
                      p25={dataset.currentTotals.video_p25}
                      p50={dataset.currentTotals.video_p50}
                      p75={dataset.currentTotals.video_p75}
                      p95={dataset.currentTotals.video_p95}
                      p100={dataset.currentTotals.video_p100}
                      linkClicks={dataset.currentTotals.link_click}
                    />
                  </div>

                  <div className="rounded-2xl bg-white/95 border border-slate-200/85 shadow-[0_2px_12px_rgba(15,23,42,0.03)] p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between shrink-0">
                      <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#06B6D4]" />
                        <span>Device Breakdown</span>
                      </h3>
                      <span className="text-[11px] font-medium text-slate-400">
                        {dataset.devices.length} thiết bị
                      </span>
                    </div>
                    <DeviceDonutCard devices={dataset.devices} currency={currency} compact />
                  </div>

                  <div className="rounded-2xl bg-white/95 border border-slate-200/85 shadow-[0_2px_12px_rgba(15,23,42,0.03)] p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#0284C7]" />
                        <span>Top 5 Campaigns by Spend</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveView('ad_detail')}
                        className="text-[11px] font-semibold text-[#1E40FF] hover:underline cursor-pointer"
                      >
                        Xem tất cả →
                      </button>
                    </div>
                    <div className="space-y-2 pt-0.5">
                      {(() => {
                        const top5 = filteredCampaigns.slice(0, 5);
                        const maxTopSpend = Math.max(1, ...top5.map((x) => x.spend));
                        return top5.map((c, i) => {
                          const cThumbs = collectEntityThumbs(
                            c.adsets.flatMap((as) => as.ads || []),
                            2
                          );
                          const barW = Math.max(6, Math.round((c.spend / maxTopSpend) * 100));
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onMouseEnter={() => handleHoverPrefetchEntity(c, 'campaign')}
                              onClick={() => setDetailModal({ entity: c, type: 'campaign' })}
                              className="w-full rounded-xl bg-slate-50/90 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200/80 px-2.5 py-2 flex items-center justify-between gap-2.5 text-xs text-left cursor-pointer dom-ios-press"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span
                                  className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                    i === 0
                                      ? 'bg-[#1E40FF] text-white'
                                      : 'bg-slate-200/80 text-slate-700'
                                  }`}
                                >
                                  {i + 1}
                                </span>
                                <CreativeThumbFan
                                  urls={cThumbs}
                                  goal={c.optimization_goal}
                                  active={c.effective_status.toUpperCase() === 'ACTIVE'}
                                  variant="adset"
                                  alt={c.name}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-slate-800 truncate">{c.name}</div>
                                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200/75 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-[#1E40FF] to-[#06B6D4]"
                                      style={{ width: `${barW}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0 tabular-nums">
                                <div className="font-bold text-[#1E40FF]">
                                  {formatDomMoneyShort(c.spend, currency)}
                                </div>
                                {c.result > 0 && (
                                  <div className="text-[10px] text-slate-400">
                                    {formatDomNumber(c.result)} KQ
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
          </div>
        )}

        {/* ====================================================================
            VIEW 2: CAMPAIGN DETAILS — Full Hierarchical Tree + Filters + Sort
           ==================================================================== */}
        {!loading &&
          dataset &&
          effectiveView === 'ad_detail' &&
          renderCampaignHierarchyCard('Campaign Details — Cây Chiến Dịch Đa Tầng')}

        {/* ====================================================================
            VIEW 2B: LEAD ATTRIBUTION (CRM & ERP — Theo Bài Quảng Cáo & Đối Chiếu Từng Lead)
           ==================================================================== */}
        {!loading && isCrmEnabled && effectiveView === 'lead_attribution' && (
          <div className="space-y-4">
            <ClosedLoopFlywheelCockpit
              compact
              metrics={{
                spendVnd: dataset?.currentTotals.spend || 0,
                adLeads: dataset?.currentTotals.leads || 0,
                crmAttributedLeads: crmAttribution?.summary?.attributed_leads || 0,
                qualifiedLeads: crmAttribution?.summary?.qualified_leads || 0,
                closedRevenueVnd: crmAttribution?.summary?.total_revenue_vnd || 0,
                capiSentCount: crmAttribution?.summary?.capi_sent_count || 0,
                blockedJunkCount: crmAttribution?.summary?.negative_leads || 0,
              }}
              onOpenCampaigns={() => setActiveView('ad_detail')}
              onOpenAttribution={() => setActiveView('lead_attribution')}
              onOpenCapi={capiPanel ? () => setActiveView('meta_capi') : undefined}
            />
            <Suspense
              fallback={
                <div className="rounded-2xl bg-white border border-slate-200 p-6 text-xs text-slate-500">
                  Đang tải bảng đối chiếu Lead CRM...
                </div>
              }
            >
              <DomMetaLeadAttributionPanel
                authContext={authContext}
                dataset={dataset}
                crmAttribution={crmAttribution}
                dateRange={{ since: resolvedRange.since, until: resolvedRange.until }}
                currency={currency}
                onInspectAd={(ad, tab = 'insights') =>
                  setDetailModal({ entity: ad, type: 'ad', initialTab: tab })
                }
                onOpenLead={onOpenLead}
              />
            </Suspense>
          </div>
        )}

        {/* ====================================================================
            VIEW 3: ADS LIBRARY — Grouped by Optimization Goal + Hook/Hold Rate
           ==================================================================== */}
        {!loading && dataset && effectiveView === 'ad_library' && (() => {
          const getGoalBucket = (rawGoal?: string): { key: string; label: string } => {
            const g = String(rawGoal || '').trim().toUpperCase();
            if (!g) return { key: 'OTHER', label: 'Mục tiêu khác (General)' };
            if (g.includes('LEAD')) return { key: 'LEAD', label: 'Leads (Thu thập khách tiềm năng)' };
            if (g.includes('MESSAG') || g.includes('CONVERSATION')) {
              return { key: 'MESSAGE', label: 'Messages (Tin nhắn tư vấn)' };
            }
            if (g.includes('REACH') || g.includes('IMPRESSION') || g.includes('AWARENESS') || g.includes('AD_RECALL')) {
              return { key: 'AWARENESS', label: 'Awareness & Reach (Phủ thương hiệu)' };
            }
            if (g.includes('LINK_CLICK') || g.includes('LANDING_PAGE') || g.includes('TRAFFIC')) {
              return { key: 'TRAFFIC', label: 'Traffic (Truy cập trang đích)' };
            }
            if (g.includes('THRUPLAY') || g.includes('VIDEO') || g.includes('ENGAGEMENT') || g.includes('POST')) {
              return { key: 'ENGAGEMENT', label: 'Engagement & Video (Tương tác)' };
            }
            if (g.includes('PURCHASE') || g.includes('OFFSITE') || g.includes('CONVERSION') || g.includes('VALUE')) {
              return { key: 'CONVERSION', label: 'Conversions / Doanh số' };
            }
            return { key: g, label: g.replace(/_/g, ' ') };
          };

          const groupMap = new Map<
            string,
            { key: string; label: string; spend: number; result: number; ads: DomMetaAdNode[] }
          >();
          for (const ad of activeAdsLibrary) {
            const b = getGoalBucket(ad.optimization_goal);
            const cur = groupMap.get(b.key) || {
              key: b.key,
              label: b.label,
              spend: 0,
              result: 0,
              ads: [],
            };
            cur.spend += ad.spend;
            cur.result += ad.result || 0;
            cur.ads.push(ad);
            groupMap.set(b.key, cur);
          }
          const goalGroups = Array.from(groupMap.values()).sort((a, b) => b.spend - a.spend);
          const visibleGroups =
            adLibGoalFilter === 'ALL'
              ? goalGroups
              : goalGroups.filter((g) => g.key === adLibGoalFilter);

          return (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white border border-slate-200/80 px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Images className="w-5 h-5 text-[#1E40FF] shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-semibold text-slate-800 truncate">
                      Ads Library — Thư Viện Quảng Cáo Theo Mục Tiêu
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {activeAdsLibrary.length} mẫu quảng cáo · {goalGroups.length} nhóm mục tiêu chạy
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <DomMetaSelect
                    ariaLabel="Lọc thư viện quảng cáo theo mục tiêu"
                    value={adLibGoalFilter}
                    onChange={(v) => setAdLibGoalFilter(v)}
                    variant="pill"
                    align="right"
                    options={[
                      { value: 'ALL', label: `Tất cả mục tiêu (${activeAdsLibrary.length})` },
                      ...goalGroups.map((g) => ({
                        value: g.key,
                        label: `${g.label.split(' (')[0]} (${g.ads.length})`,
                      })),
                    ]}
                  />
                </div>
              </div>

              {visibleGroups.map((grp) => (
                <div key={grp.key} className="space-y-3">
                  <div className="rounded-xl bg-[#F4F8FF]/90 border border-blue-200/70 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Target className="w-4 h-4 text-[#1E40FF] shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {grp.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-blue-200 text-[#1E40FF] text-[10.5px] font-bold shrink-0">
                        {grp.ads.length} mẫu
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs tabular-nums">
                      <span className="text-slate-600">
                        Chi tiêu:{' '}
                        <strong className="text-slate-900">
                          {formatDomMoneyShort(grp.spend, currency)}
                        </strong>
                      </span>
                      <span className="text-slate-600">
                        Kết quả:{' '}
                        <strong className="text-[#1E40FF]">
                          {formatDomNumber(grp.result)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {grp.ads.slice(0, 16).map((ad, idx) => (
                      <div
                        key={ad.id}
                        role="button"
                        tabIndex={0}
                        onMouseEnter={() => handleHoverPrefetchEntity(ad, 'ad')}
                        onClick={() => setDetailModal({ entity: ad, type: 'ad' })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setDetailModal({ entity: ad, type: 'ad' });
                          }
                        }}
                        className="group rounded-2xl bg-white border border-slate-200/85 hover:border-blue-300 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer text-left"
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
                            {(ad.image_url || ad.thumbnail_url) && (
                              <img
                                src={ad.image_url || ad.thumbnail_url}
                                alt={ad.name}
                                className="relative z-10 w-full h-full object-cover bg-slate-100 group-hover:scale-[1.02] transition-transform duration-300"
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
                            <h3 className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-[#1E40FF] transition-colors line-clamp-2">
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailModal({
                                      entity: ad,
                                      type: 'ad',
                                      initialTab: 'crm_leads',
                                    });
                                  }}
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
                          <span className="text-xs font-semibold text-[#1E40FF] group-hover:underline">
                            Xem Insight Chi Tiết →
                          </span>
                          {ad.post_url && (
                            <a
                              href={ad.post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-400 hover:text-slate-700 p-1 -m-1"
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
              ))}
            </div>
          );
        })()}

        {/* ====================================================================
            VIEW 4: AD ACCOUNT — Balance + VAT + Monthly Spend + Activity Logs
           ==================================================================== */}
        {!loading && dataset && effectiveView === 'account' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between gap-3.5">
                <div className="rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1E40FF] to-[#0284C7] text-white p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-cyan-200 truncate">
                      {dataset.accountOverview?.name || activeAccountObj?.name || 'Meta Ad Account'}
                    </span>
                    {dataset.accountOverview?.timezone_name && (
                      <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-mono text-white/90 shrink-0">
                        {dataset.accountOverview.timezone_name}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold tabular-nums">
                    {formatDomMoney(dataset.currentTotals.spend, currency)}
                  </div>
                  <div className="text-[11px] text-white/80">
                    {dataset.accountOverview?.funding_source || 'Thanh toán trực tiếp Meta Ads'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-0.5">
                    <div className="text-[10.5px] font-medium text-slate-500">
                      Ước tính gồm VAT (+10%)
                    </div>
                    <div className="text-sm sm:text-base font-bold text-slate-800 tabular-nums">
                      {formatDomMoney(dataset.currentTotals.spend * 1.1, currency)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-0.5">
                    <div className="text-[10.5px] font-medium text-slate-500">
                      Tổng chi tiêu lũy kế TK
                    </div>
                    <div className="text-sm sm:text-base font-bold text-[#1E40FF] tabular-nums">
                      {dataset.accountOverview?.amount_spent
                        ? formatDomMoneyShort(dataset.accountOverview.amount_spent, currency)
                        : formatDomMoneyShort(dataset.currentTotals.spend, currency)}
                    </div>
                  </div>
                </div>

                {(dataset.accountOverview?.business_name ||
                  (dataset.accountOverview?.spend_cap ?? 0) > 0 ||
                  (dataset.accountOverview?.balance ?? 0) > 0 ||
                  dataset.accountOverview?.tax_id) && (
                  <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-3.5 space-y-1.5 text-xs">
                    {dataset.accountOverview?.business_name && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Doanh nghiệp (BM):</span>
                        <span className="font-semibold text-slate-800 truncate">
                          {dataset.accountOverview.business_name}
                        </span>
                      </div>
                    )}
                    {(dataset.accountOverview?.balance ?? 0) > 0 && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Dư nợ hiện tại:</span>
                        <span className="font-semibold text-amber-700 tabular-nums">
                          {formatDomMoney(dataset.accountOverview?.balance || 0, currency)}
                        </span>
                      </div>
                    )}
                    {(dataset.accountOverview?.spend_cap ?? 0) > 0 && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Hạn mức chi tiêu (Cap):</span>
                        <span className="font-semibold text-slate-800 tabular-nums">
                          {formatDomMoney(dataset.accountOverview?.spend_cap || 0, currency)}
                        </span>
                      </div>
                    )}
                    {dataset.accountOverview?.tax_id && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Mã số thuế:</span>
                        <span className="font-mono font-semibold text-slate-700">
                          {dataset.accountOverview.tax_id}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="lg:col-span-8 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col">
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
            <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 space-y-3.5 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate">
                  Nhật Ký Thao Tác Tài Khoản (Activities)
                </h3>
                <DomResponsiveSubtabs
                  maxMobile={2}
                  maxTablet={4}
                  maxDesktop={5}
                  value={activityCat}
                  onChange={setActivityCat}
                  tabs={[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'CAMPAIGN', label: 'Campaign' },
                    { id: 'AD_SET', label: 'Adset' },
                    { id: 'AD', label: 'Ad' },
                    { id: 'BUDGET', label: 'Budget' },
                    { id: 'STATUS', label: 'Status' },
                    { id: 'TARGETING', label: 'Targeting' },
                  ]}
                />
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
              {config.google_ads.customer_id.trim() &&
              (config.google_ads.apps_script_url.trim() || (gadsData?.currentRows.length || 0) > 0) ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Đã kết nối</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => openSettingsPage('google_ads')}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-[#1E40FF] text-xs font-semibold cursor-pointer"
                >
                  Cấu hình &amp; Hướng dẫn 5 bước
                </button>
              )}
            </div>

            {gadsLoading ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-xs text-slate-500">
                Đang đồng bộ dữ liệu Google Ads...
              </div>
            ) : (
              <>
                {/* Row 1: KPI Stack + Daily Trend + Bar by Campaign */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200/80 p-3.5 space-y-2.5 min-w-0">
                    <div className="rounded-xl bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white p-3.5 sm:p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/90">Google Ads Spent</span>
                        {renderDeltaPill(gadsSummary.spent, gadsSummary.prevSpent, true)}
                      </div>
                      <div className="text-xl sm:text-2xl font-bold mt-1.5 sm:mt-2 tabular-nums">
                        {formatDomMoney(gadsSummary.spent, 'VND')}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                      {[
                        ['Impressions', gadsSummary.impression, gadsSummary.prevImpression],
                        ['Clicks', gadsSummary.click, gadsSummary.prevClick],
                        ['Conversions', gadsSummary.conv, gadsSummary.prevConv],
                      ].map(([lbl, curV, prvV]) => (
                        <div
                          key={String(lbl)}
                          className="rounded-xl bg-slate-50 border border-slate-100 px-2.5 sm:px-3.5 py-2 sm:py-2.5 min-w-0"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10.5px] sm:text-xs font-medium text-slate-500 truncate">
                              {lbl}
                            </span>
                            <span className="hidden sm:inline-flex">
                              {renderDeltaPill(Number(curV), Number(prvV))}
                            </span>
                          </div>
                          <div className="text-sm sm:text-base font-semibold text-slate-700 mt-1 tabular-nums truncate">
                            {formatDomNumber(Number(curV))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col">
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
                          { value: 'leads', label: 'All Conversions' },
                          { value: 'cpr', label: 'CPA / CPR' },
                          { value: 'clicks', label: 'Clicks' },
                          { value: 'impressions', label: 'Impressions' },
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

                {/* Row 3: Google Ads Deep Breakdowns (Edge-to-Edge Hourly Card + Balanced Channel/Location Grid) */}
                <div className="space-y-4">
                  {/* Full-width Hourly Activity Card with integrated Filter Selectors */}
                  <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Clock className="w-4 h-4 text-[#1E40FF]" />
                        <span>Hourly Activity (0h – 23h)</span>
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

                    <div data-testid="gads-hourly-chart" className="w-full min-w-0">
                      <GoogleAdsHourlyBarChart
                        slots={gadsBreakdowns.hourly}
                        metric={gadsBreakdownMetric}
                      />
                    </div>
                  </div>

                  {/* Balanced 2-Column Channel Breakdown & Location Performance Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    <div
                      data-testid="gads-channel-card"
                      className="lg:col-span-7 rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Channel Breakdown
                        </h4>
                        <span className="text-[11px] font-medium text-slate-400">
                          {gadsBreakdowns.channels.length} kênh
                        </span>
                      </div>
                      <GoogleAdsChannelCard
                        channels={gadsBreakdowns.channels}
                        metric={gadsBreakdownMetric}
                      />
                    </div>

                    <div
                      data-testid="gads-location-chart"
                      className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Location Performance
                        </h4>
                        <span className="text-[11px] font-medium text-slate-400">
                          Top khu vực
                        </span>
                      </div>
                      <GoogleAdsLocationBarChart
                        locations={gadsBreakdowns.locations}
                        metric={gadsBreakdownMetric}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 4: Detail Google Ads Campaigns (Dedicated Mobile Cards + Desktop Table) */}
                <div className="rounded-2xl bg-white border border-slate-200/80 p-3.5 sm:p-5 space-y-3 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">
                      Chiến Dịch Google Ads ({gadsSummary.campaigns.length})
                    </h3>
                    <input
                      type="text"
                      value={gadsSearch}
                      onChange={(e) => setGadsSearch(e.target.value)}
                      placeholder="Tìm chiến dịch Google Ads..."
                      className="w-full sm:w-64 rounded-full bg-slate-50 border border-slate-200 px-3.5 py-1.5 text-xs outline-none focus:bg-white focus:border-[#1E40FF]"
                    />
                  </div>

                  {/* Mobile Native Cards (< md) */}
                  <div className="md:hidden space-y-2.5">
                    {gadsSummary.campaigns
                      .filter(
                        (gc) =>
                          !gadsSearch.trim() ||
                          gc.campaign.toLowerCase().includes(gadsSearch.toLowerCase())
                      )
                      .map((gc) => {
                        const cpc = gc.click > 0 ? gc.spent / gc.click : 0;
                        return (
                          <div
                            key={gc.campaign}
                            className="rounded-xl border border-slate-200/85 bg-slate-50/50 p-3 space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-xs font-bold text-slate-800 line-clamp-2">
                                {gc.campaign}
                              </div>
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
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1E40FF] text-[11px] font-semibold shrink-0 cursor-pointer"
                              >
                                Keywords
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-white border border-slate-100 p-2 text-center">
                              <div>
                                <div className="text-[10px] text-slate-400">Spent</div>
                                <div className="text-xs font-bold text-slate-800 tabular-nums">
                                  {formatDomMoneyShort(gc.spent, 'VND')}
                                </div>
                              </div>
                              <div className="border-x border-slate-100">
                                <div className="text-[10px] text-slate-400">Clicks / Conv</div>
                                <div className="text-xs font-bold text-[#1E40FF] tabular-nums">
                                  {formatDomNumber(gc.click)} / {formatDomNumber(gc.conv)}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400">CPC</div>
                                <div className="text-xs font-semibold text-slate-700 tabular-nums">
                                  {formatDomMoneyShort(cpc, 'VND')}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="hidden md:block dom-meta-table-scroll overflow-x-auto overflow-y-auto max-h-[480px] rounded-xl border border-slate-200 bg-white">
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

        {/* ====================================================================
            VIEW 7: SYSTEM SETTINGS PAGE (ERP-Style Vertical Tab Sidebar + AI Key)
           ==================================================================== */}
        {!loading && effectiveView === 'settings' && (
          <DomMetaSettingsPage
            activeTab={settingsTab}
            onTabChange={setSettingsTab}
            config={config}
            authContext={authContext}
            tenantSlug={authContext.tenantSlug || 'workspace'}
            shareUrlOverride={currentShareUrl}
            daysRemaining={daysRemaining}
            canManageConfig={canManageConfig}
            onSaveConfig={handleSaveSettingsPatch}
            onAiConfigSaved={(nextAi) =>
              setConfig((prev) => ({
                ...prev,
                ai_config: nextAi,
              }))
            }
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
            onOpenAccountManager={() => setAccountModalOpen(true)}
            onOpenShareModal={() => setShareModalOpen(true)}
          />
        )}
        </div>

        {/* ====================================================================
            STANDALONE MOBILE iOS FLOATING FROSTED BOTTOM TAB BAR (< lg)
           ==================================================================== */}
        {mode === 'standalone' && (
          <nav
            aria-label="Mobile bottom navigation"
            className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/[0.97] backdrop-blur-xl border-t border-slate-200/85 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_24px_rgba(15,23,42,0.06)]"
          >
            <div className="grid grid-cols-5 h-[58px] px-1">
              {(
                [
                  { id: 'dashboard' as const, label: 'Tổng quan', icon: LayoutDashboard },
                  { id: 'ad_detail' as const, label: 'Chiến dịch', icon: List },
                  { id: 'ad_library' as const, label: 'Thư viện', icon: Images },
                  { id: 'account' as const, label: 'Tài khoản', icon: CreditCard },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = effectiveView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveView(tab.id)}
                    className={`relative flex flex-col items-center justify-center gap-0.5 cursor-pointer dom-ios-press ${
                      active ? 'text-[#1E40FF] font-bold' : 'text-slate-400 font-medium'
                    }`}
                  >
                    {active && (
                      <span className="absolute top-0 w-7 h-[3px] rounded-b-full bg-[#1E40FF]" />
                    )}
                    <Icon className="w-[19px] h-[19px]" />
                    <span className="text-[10px] leading-tight">{tab.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer dom-ios-press ${
                  mobileMenuOpen ? 'text-[#1E40FF] font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <Menu className="w-[19px] h-[19px]" />
                <span className="text-[10px] leading-tight">Menu</span>
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* ====================================================================
          MODALS (Portaled to document.body with .mkt-scope & z-index 10050+)
         ==================================================================== */}
      <AdEntityDetailModal
        entity={effectiveDetailModal?.entity || null}
        entityType={effectiveDetailModal?.type || 'ad'}
        adAccountId={activeAccountObj?.ad_account_id || authContext.directAdAccountId || ''}
        currency={currency}
        sidebarWidthPx={mode === 'standalone' ? (isSidebarCollapsed ? 72 : 260) : undefined}
        canGoBack={detailHistory.length > 0}
        onNavigateBack={() => {
          setDetailHistory((prev) => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            setDetailModal(last);
            return prev.slice(0, -1);
          });
        }}
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
        aiConfig={config.ai_config}
        onOpenAiKeySetup={() => {
          setDetailModal(null);
          openSettingsPage('ai_key');
        }}
        dateRange={{ since: resolvedRange.since, until: resolvedRange.until }}
        initialTab={effectiveDetailModal?.initialTab || initialEntityModalTab}
        onOpenLead={onOpenLead}
        onFilterCampaignLeads={onFilterCampaignLeads}
        onSelectChildAdset={(as) => {
          if (effectiveDetailModal) {
            setDetailHistory((prev) => [...prev, effectiveDetailModal]);
          }
          setDetailModal({ entity: as, type: 'adset' });
        }}
        onSelectChildAd={(ad) => {
          if (effectiveDetailModal) {
            setDetailHistory((prev) => [...prev, effectiveDetailModal]);
          }
          setDetailModal({ entity: ad, type: 'ad' });
        }}
        onClose={() => {
          setDetailModal(null);
          setDetailHistory([]);
          if (currentFocusKey && currentFocusKey !== '|') {
            setHandledFocusKey(currentFocusKey);
          }
        }}
      />

      <CrmUpgradeShowcaseModal
        open={crmUpgradeOpen}
        tenantSlug={authContext.tenantSlug || ''}
        companyName={workspaceName}
        authContext={authContext}
        onRequestAuth={onRequestSwitchWorkspace || onRequestCreateWorkspace}
        onClose={() => setCrmUpgradeOpen(false)}
      />

      {quickConnectOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      <AiSummaryModal
        open={aiModalOpen}
        dataset={dataset}
        campaigns={
          selectedCompareCampaigns.length > 0 ? selectedCompareCampaigns : filteredCampaigns
        }
        currency={currency}
        activeBrandLabel={activeBrandLabel}
        savedReports={localAiReports}
        authContext={authContext}
        aiConfig={config.ai_config}
        onOpenAiKeyModal={() => {
          setAiModalOpen(false);
          openSettingsPage('ai_key');
        }}
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
        authContext={authContext}
        onPublicViewChanged={(nextPublicView) =>
          setConfig((prev) => ({ ...prev, public_view: nextPublicView }))
        }
        onClose={() => setShareModalOpen(false)}
      />

      <DomMetaSpotlightTour
        open={tourOpen}
        activeStepIndex={tourStepIdx}
        onStepChange={(idx) => setTourStepIdx(idx)}
        onClose={() => setTourOpen(false)}
        onFinish={() => {
          try {
            localStorage.setItem(DOM_META_TOUR_STORAGE_KEY, '1');
          } catch {
            // ignore
          }
          setTourOpen(false);
        }}
      />
    </div>
  );
};

export default DomMetaReportWorkspace;
