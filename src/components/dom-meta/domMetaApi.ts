import type {
  DomGoogleAdsKeywordItem,
  DomGoogleAdsRow,
  DomGoogleAdsSearchTermItem,
  DomMetaAccountOverview,
  DomMetaActionMap,
  DomMetaActivityLogItem,
  DomMetaAdNode,
  DomMetaAdsetNode,
  DomMetaAgeGenderBucket,
  DomMetaCampaignNode,
  DomMetaCrmAttributionPayload,
  DomMetaCrmLeadItem,
  DomMetaDailyPoint,
  DomMetaDashboardDataset,
  DomMetaDeviceRow,
  DomMetaHourlyCell,
  DomMetaMonthlyPoint,
  DomMetaPlatformSlice,
  DomMetaPositionSlice,
  DomMetaQuickConnectStatus,
  DomMetaRegionRow,
  DomMetaTargetingSpec,
  DomMetaTotalsSnapshot,
  DomMetaWorkspaceConfig,
  DomMetaWorkspacePatch,
} from './domMetaTypes';

export interface DomMetaAuthContext {
  apiBaseUrl?: string; // default ''
  accessToken?: string; // Tenant JWT Bearer token
  tenantSlug?: string;
  /** Optional inline Meta token used only in-memory for instant preview/capture */
  directMetaToken?: string;
  directAdAccountId?: string;
  directGoogleAds?: {
    enabled: boolean;
    customer_id: string;
    apps_script_url: string;
    developer_token?: string;
  };
  /** Optional preview-only payloads injected exclusively by headless screenshot scripts */
  previewDataset?: DomMetaDashboardDataset;
  previewCrmAttribution?: DomMetaCrmAttributionPayload;
  previewEntityLeadsByEntityId?: Record<string, DomMetaCrmLeadItem[]>;
  previewQuickConnectStatus?: DomMetaQuickConnectStatus;
  previewActiveColumns?: string[];
}

interface GraphActionEntry {
  action_type?: string;
  value?: string | number;
}

interface GraphInsightRow {
  date_start?: string;
  spend?: string | number;
  impressions?: string | number;
  reach?: string | number;
  clicks?: string | number;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  objective?: string;
  optimization_goal?: string;
  publisher_platform?: string;
  platform_position?: string;
  age?: string;
  gender?: string;
  region?: string;
  device_platform?: string;
  hourly_stats_aggregated_by_advertiser_time_zone?: string;
  actions?: GraphActionEntry[];
  action_values?: GraphActionEntry[];
  purchase_roas?: GraphActionEntry[];
  video_play_actions?: GraphActionEntry[];
  video_thruplay_watched_actions?: GraphActionEntry[];
  video_p25_watched_actions?: GraphActionEntry[];
  video_p50_watched_actions?: GraphActionEntry[];
  video_p75_watched_actions?: GraphActionEntry[];
  video_p95_watched_actions?: GraphActionEntry[];
  video_p100_watched_actions?: GraphActionEntry[];
}

interface GraphCampaignRow {
  id?: string;
  name?: string;
  status?: string;
  effective_status?: string;
  objective?: string;
  daily_budget?: string | number;
  lifetime_budget?: string | number;
  start_time?: string;
  stop_time?: string;
}

interface GraphAdsetRow {
  id?: string;
  name?: string;
  campaign_id?: string;
  status?: string;
  effective_status?: string;
  optimization_goal?: string;
  daily_budget?: string | number;
  lifetime_budget?: string | number;
  start_time?: string;
  end_time?: string;
  targeting?: DomMetaTargetingSpec | null;
}

interface GraphAdRow {
  id?: string;
  name?: string;
  adset_id?: string;
  campaign_id?: string;
  status?: string;
  effective_status?: string;
  creative?: {
    id?: string;
    thumbnail_url?: string;
    image_url?: string;
    effective_object_story_id?: string;
  };
}

interface GraphActivityRow {
  event_time?: string;
  event_type?: string;
  translated_event_type?: string;
  actor_name?: string;
  object_name?: string;
  extra_data?: unknown;
}

interface GraphAccountInfoResponse {
  account_id?: string;
  name?: string;
  currency?: string;
  balance?: string | number;
  amount_spent?: string | number;
  account_status?: string | number;
  funding_source_details?: { display_string?: string };
}

interface GraphListResponse<T> {
  data?: T[];
  paging?: { next?: string };
  error?: { message?: string; code?: number };
}

function buildAuthHeaders(ctx: DomMetaAuthContext): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (ctx.accessToken) {
    headers.Authorization = `Bearer ${ctx.accessToken}`;
  }
  if (ctx.tenantSlug) {
    headers['X-Tenant-Slug'] = ctx.tenantSlug;
  }
  return headers;
}

function resolveApiUrl(ctx: DomMetaAuthContext, path: string): string {
  const base = (ctx.apiBaseUrl || '').replace(/\/+$/, '');
  return `${base}${path}`;
}

export function createEmptyWorkspaceConfig(): DomMetaWorkspaceConfig {
  return {
    primary_ad_account_id: '',
    meta_summary: {
      ad_account_id: '',
      pixel_id: '',
      has_token: false,
      access_token_masked: '',
      total_accounts: 0,
      active_accounts: 0,
      accounts: [],
    },
    brand_filters: [],
    goal_keywords: [],
    goal_chart_mode: 'goal',
    column_config: {
      activeColumns: ['status', 'spend', 'result', 'cpr', 'cpm', 'reach', 'frequency', 'reaction'],
      customMetrics: [],
    },
    view_presets: [
      {
        id: 'preset_lead_default',
        name: 'Báo cáo Lead & CPL',
        activeColumns: ['status', 'spend', 'result', 'cpr', 'cpm', 'reach', 'frequency', 'ctr'],
      },
      {
        id: 'preset_crm_fusion',
        name: 'Đối soát Lead CRM & Sale',
        activeColumns: ['status', 'spend', 'result', 'cpr'],
      },
      {
        id: 'preset_creative_hook',
        name: 'Creative Hook & Hold Rate',
        activeColumns: ['status', 'spend', 'impressions', 'video_3s', 'hook_rate', 'thruplay', 'hold_rate', 'ctr'],
      },
    ],
    summary_metrics: ['reach', 'leads', 'impressions'],
    ai_reports: [],
    google_ads: {
      enabled: false, // STRICTLY OFF BY DEFAULT
      customer_id: '',
      apps_script_url: '',
      has_developer_token: false,
      developer_token_masked: '',
      last_verified_at: null,
    },
  };
}

export async function fetchDomMetaWorkspaceConfig(
  ctx: DomMetaAuthContext
): Promise<DomMetaWorkspaceConfig> {
  if ((ctx.directMetaToken || ctx.previewDataset) && ctx.directAdAccountId && !ctx.accessToken) {
    const cleanId = ctx.directAdAccountId.replace(/^act_/i, '');
    const base = createEmptyWorkspaceConfig();
    const previewAccName = ctx.previewDataset?.accountOverview?.name || `DOM - ${cleanId.slice(-4)}`;
    return {
      ...base,
      primary_ad_account_id: cleanId,
      column_config:
        Array.isArray(ctx.previewActiveColumns) && ctx.previewActiveColumns.length > 0
          ? { ...base.column_config, activeColumns: ctx.previewActiveColumns }
          : base.column_config,
      meta_summary: {
        ad_account_id: cleanId,
        pixel_id: '',
        has_token: true,
        access_token_masked: ctx.directMetaToken ? `${ctx.directMetaToken.slice(0, 6)}...` : 'EAA••••••',
        total_accounts: 1,
        active_accounts: 1,
        accounts: [
          {
            id: `direct_${cleanId}`,
            ad_account_id: cleanId,
            name: previewAccName,
            has_token: true,
            is_active: true,
          },
        ],
      },
      google_ads: ctx.directGoogleAds
        ? {
            enabled: Boolean(ctx.directGoogleAds.enabled),
            customer_id: ctx.directGoogleAds.customer_id,
            apps_script_url: ctx.directGoogleAds.apps_script_url,
            has_developer_token: Boolean(ctx.directGoogleAds.developer_token),
            developer_token_masked: ctx.directGoogleAds.developer_token ? '••••••' : '',
          }
        : base.google_ads,
    };
  }

  const res = await fetch(resolveApiUrl(ctx, '/api/v1/integrations/dom-meta/config'), {
    method: 'GET',
    headers: buildAuthHeaders(ctx),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: DomMetaWorkspaceConfig;
    message?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json?.success || !json?.data) {
    throw new Error(json?.error?.message || json?.message || 'Không thể tải cấu hình DOM Meta Report.');
  }
  return json.data;
}

export async function updateDomMetaWorkspaceConfig(
  ctx: DomMetaAuthContext,
  patch: DomMetaWorkspacePatch
): Promise<DomMetaWorkspaceConfig> {
  if (!ctx.accessToken) {
    const curr = await fetchDomMetaWorkspaceConfig(ctx);
    return {
      ...curr,
      ...patch,
      google_ads: patch.google_ads
        ? { ...curr.google_ads, ...patch.google_ads }
        : curr.google_ads,
    };
  }
  const res = await fetch(resolveApiUrl(ctx, '/api/v1/integrations/dom-meta/config'), {
    method: 'PUT',
    headers: buildAuthHeaders(ctx),
    body: JSON.stringify(patch),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: DomMetaWorkspaceConfig;
    message?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json?.success || !json?.data) {
    throw new Error(json?.error?.message || json?.message || 'Không thể lưu cấu hình DOM Meta Report.');
  }
  return json.data;
}

export async function discoverMetaAccountsFromToken(
  ctx: DomMetaAuthContext,
  rawMetaToken: string
): Promise<
  Array<{
    ad_account_id: string;
    name: string;
    currency: string;
    business_name?: string | null;
    default_pixel_id?: string;
  }>
> {
  const token = rawMetaToken.trim();
  if (!token) throw new Error('Vui lòng nhập Meta Access Token.');

  if (ctx.accessToken) {
    const res = await fetch(resolveApiUrl(ctx, '/api/v1/integrations/meta-ads/discover'), {
      method: 'POST',
      headers: buildAuthHeaders(ctx),
      body: JSON.stringify({ access_token: token }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      ad_accounts?: Array<Record<string, unknown>>;
    };
    if (res.ok && json?.success && Array.isArray(json.ad_accounts)) {
      return json.ad_accounts.map((a) => {
        const rawId = String(a.ad_account_id || a.id || '').replace(/^act_/i, '');
        const rawPixels = Array.isArray(a.pixels)
          ? (a.pixels as Array<{ id?: string }>)
          : [];
        const firstPixelId = String(rawPixels[0]?.id || '').trim();
        return {
          ad_account_id: rawId,
          name: String(a.name || `TK #${rawId}`),
          currency: String(a.currency || 'VND'),
          business_name: a.business_name ? String(a.business_name) : null,
          ...(firstPixelId ? { default_pixel_id: firstPixelId } : {}),
        };
      });
    }
  }

  // Fallback direct Graph discovery with cursor pagination (up to 5 pages / 500 Ad Accounts)
  const collected: Array<{
    ad_account_id: string;
    name: string;
    currency: string;
    business_name?: string | null;
  }> = [];
  const seenIds = new Set<string>();
  let nextUrl: string | null =
    `https://graph.facebook.com/v25.0/me/adaccounts?fields=id,account_id,name,currency&limit=100&access_token=${encodeURIComponent(token)}`;
  let pages = 0;

  while (nextUrl && pages < 5) {
    pages += 1;
    const r = await fetch(nextUrl);
    const j = (await r.json().catch(() => ({}))) as GraphListResponse<{
      id?: string;
      account_id?: string;
      name?: string;
      currency?: string;
      business?: { name?: string };
    }>;
    if (!r.ok || j?.error) {
      if (pages === 1) {
        throw new Error(
          j?.error?.message || 'Meta Access Token không hợp lệ hoặc thiếu quyền ads_read.'
        );
      }
      break;
    }
    for (const a of Array.isArray(j.data) ? j.data : []) {
      const cleanId = String(a.account_id || a.id || '').replace(/^act_/i, '');
      if (!cleanId || seenIds.has(cleanId)) continue;
      seenIds.add(cleanId);
      collected.push({
        ad_account_id: cleanId,
        name: String(a.name || `TK #${cleanId}`),
        currency: String(a.currency || 'VND'),
        business_name: a.business?.name || null,
      });
    }
    nextUrl = typeof j?.paging?.next === 'string' && j.paging.next ? j.paging.next : null;
  }

  return collected;
}

export async function connectBatchMetaAccounts(
  ctx: DomMetaAuthContext,
  payload: {
    access_token: string;
    accounts: Array<{ ad_account_id: string; name?: string }>;
    primary_ad_account_id?: string;
  }
): Promise<DomMetaWorkspaceConfig> {
  const res = await fetch(resolveApiUrl(ctx, '/api/v1/integrations/dom-meta/connect-batch'), {
    method: 'POST',
    headers: buildAuthHeaders(ctx),
    body: JSON.stringify(payload),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    config?: DomMetaWorkspaceConfig;
    message?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json?.success || !json?.config) {
    throw new Error(json?.error?.message || json?.message || 'Không thể kết nối danh sách Ad Account.');
  }
  return json.config;
}

async function callMetaGraph<T = unknown>(
  ctx: DomMetaAuthContext,
  adAccountId: string,
  graphPath: string,
  params: Record<string, string | number | boolean | undefined>
): Promise<T> {
  if (ctx.directMetaToken) {
    const url = new URL(`https://graph.facebook.com/v25.0/${graphPath.replace(/^\/+/, '')}`);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
    url.searchParams.set('access_token', ctx.directMetaToken);
    const r = await fetch(url.toString());
    const j = (await r.json().catch(() => ({}))) as T & { error?: { message?: string } };
    if (!r.ok || j?.error) {
      throw new Error(j?.error?.message || `Meta Graph HTTP ${r.status}`);
    }
    return j;
  }

  const res = await fetch(resolveApiUrl(ctx, '/api/v1/integrations/dom-meta/meta-proxy'), {
    method: 'POST',
    headers: buildAuthHeaders(ctx),
    body: JSON.stringify({
      ad_account_id: adAccountId,
      graph_path: graphPath,
      params,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    message?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message || json?.message || 'Lỗi truy vấn Meta Graph API.');
  }
  return json.data as T;
}

function toActionsMap(actionsArr: unknown): DomMetaActionMap {
  const map: DomMetaActionMap = {};
  if (!Array.isArray(actionsArr)) return map;
  for (const item of actionsArr) {
    if (item && typeof item === 'object') {
      const rec = item as GraphActionEntry;
      if (rec.action_type) {
        const key = String(rec.action_type);
        map[key] = (map[key] || 0) + Number(rec.value || 0);
      }
    }
  }
  return map;
}

function pickActionVal(map: DomMetaActionMap, keys: string[]): number {
  for (const k of keys) {
    if (map[k] !== undefined && map[k] > 0) return map[k];
  }
  return 0;
}

function resolveGoalLabel(rawGoal: string, rawObjective?: string): string {
  const g = String(rawGoal || rawObjective || '').toUpperCase();
  if (
    g.includes('QUALITY_LEAD') ||
    g.includes('LEAD_GENERATION') ||
    g === 'LEADS' ||
    g.includes('OFFSITE_CONVERSIONS')
  ) {
    if (g.includes('QUALITY') || g.includes('LEAD')) return 'QUALITY LEAD';
  }
  if (g.includes('CONVERSATIONS') || g.includes('MESSAGING') || g.includes('REPLIES')) {
    return 'MESSAGING';
  }
  if (g.includes('REACH')) return 'REACH';
  if (g.includes('POST_ENGAGEMENT') || g.includes('ENGAGEMENT')) return 'POST ENGAGEMENT';
  if (g.includes('THRUPLAY') || g.includes('VIDEO')) return 'VIDEO VIEWS';
  if (g.includes('LINK_CLICKS') || g.includes('LANDING_PAGE')) return 'TRAFFIC';
  if (g.includes('IMPRESSIONS')) return 'IMPRESSIONS';
  if (g.includes('PAGE_LIKES')) return 'PAGE LIKES';
  if (g.includes('APP_INSTALL') || g.includes('APP_EVENT')) return 'APP PROMOTION';
  return g ? g.replace(/_/g, ' ') : 'QUALITY LEAD';
}

function extractEntityResultByGoal(
  actions: DomMetaActionMap,
  goal: string,
  reach: number,
  impressions: number,
  thruplay: number,
  linkClick: number
): number {
  const g = String(goal || '').toUpperCase();
  const leads = pickActionVal(actions, [
    'lead',
    'onsite_conversion.lead_grouped',
    'offsite_conversion.fb_pixel_lead',
  ]);
  const messages = pickActionVal(actions, [
    'onsite_conversion.messaging_conversation_started_7d',
    'messaging_conversation_started_7d',
    'onsite_conversion.total_messaging_connection',
  ]);
  const purchases = pickActionVal(actions, [
    'purchase',
    'omni_purchase',
    'onsite_conversion.purchase',
    'offsite_conversion.fb_pixel_purchase',
  ]);
  const postEng = pickActionVal(actions, ['post_engagement', 'page_engagement']);
  const likes = pickActionVal(actions, ['like', 'comment']);

  if (g.includes('REACH')) return reach;
  if (g.includes('IMPRESSION')) return impressions;
  if (g.includes('POST ENGAGEMENT') || g.includes('POST_ENGAGEMENT')) return postEng;
  if (g.includes('MESSAGING') || g.includes('CONVERSATIONS')) return messages || leads;
  if (g.includes('VIDEO') || g.includes('THRUPLAY')) return thruplay;
  if (g.includes('TRAFFIC') || g.includes('LINK')) return linkClick;
  if (g.includes('LIKE')) return likes;
  if (purchases > 0 && (g.includes('PURCHASE') || g.includes('SALES') || g.includes('VALUE'))) {
    return purchases;
  }
  return leads || messages || purchases || postEng || linkClick;
}

const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW',
  'MGA', 'PYG', 'RWF', 'TWD', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

function normalizeMetaBudget(raw: unknown, currency = 'VND'): number {
  const num = Number(raw || 0);
  if (!Number.isFinite(num) || num <= 0) return 0;
  const cur = String(currency || 'VND').trim().toUpperCase();
  return ZERO_DECIMAL_CURRENCIES.has(cur) ? num : num / 100;
}

function parseInsightMetrics(row: GraphInsightRow | undefined, optimizationGoal = '') {
  const spend = Number(row?.spend || 0);
  const impressions = Number(row?.impressions || 0);
  const reach = Number(row?.reach || 0);
  const clicks = Number(row?.clicks || 0);
  const actions = toActionsMap(row?.actions);
  const actionValues = toActionsMap(row?.action_values);
  const roasMap = toActionsMap(row?.purchase_roas);
  const videoPlayMap = toActionsMap(row?.video_play_actions);
  const thruplayMap = toActionsMap(row?.video_thruplay_watched_actions);
  const p25Map = toActionsMap(row?.video_p25_watched_actions);
  const p50Map = toActionsMap(row?.video_p50_watched_actions);
  const p75Map = toActionsMap(row?.video_p75_watched_actions);
  const p95Map = toActionsMap(row?.video_p95_watched_actions);
  const p100Map = toActionsMap(row?.video_p100_watched_actions);

  const link_click = pickActionVal(actions, ['link_click', 'outbound_click']);
  const leads = pickActionVal(actions, [
    'lead',
    'onsite_conversion.lead_grouped',
    'offsite_conversion.fb_pixel_lead',
  ]);
  const messages = pickActionVal(actions, [
    'onsite_conversion.messaging_conversation_started_7d',
    'messaging_conversation_started_7d',
    'onsite_conversion.total_messaging_connection',
  ]);
  const purchases = pickActionVal(actions, [
    'purchase',
    'omni_purchase',
    'onsite_conversion.purchase',
  ]);
  const message_connection = pickActionVal(actions, [
    'onsite_conversion.total_messaging_connection',
    'total_messaging_connection',
  ]);
  const photo_view = pickActionVal(actions, ['photo_view']);
  const purchase_value = pickActionVal(actionValues, [
    'omni_purchase',
    'purchase',
    'onsite_conversion.purchase',
    'offsite_conversion.fb_pixel_purchase',
  ]);
  const directRoas = pickActionVal(roasMap, [
    'omni_purchase',
    'purchase',
    'omni_purchase_roas',
    'purchase_roas',
  ]);
  const roas = directRoas > 0 ? directRoas : spend > 0 && purchase_value > 0 ? purchase_value / spend : 0;

  const rawVideoPlay = pickActionVal(videoPlayMap, ['video_view']);
  const rawActionView = pickActionVal(actions, ['video_view']);
  const thruplay =
    pickActionVal(thruplayMap, ['video_view']) ||
    pickActionVal(actions, ['video_thruplay_watched_actions']);
  const video_p25 = pickActionVal(p25Map, ['video_view']);
  const video_p50 = pickActionVal(p50Map, ['video_view']);
  const video_p75 = pickActionVal(p75Map, ['video_view']);
  const video_p95 = pickActionVal(p95Map, ['video_view']);
  const video_p100 = pickActionVal(p100Map, ['video_view']);
  const video_play = Math.max(rawVideoPlay, rawActionView);
  const hasRealVideoSignals =
    rawActionView > 0 || video_p25 > 0 || video_p50 > 0 || thruplay > 0;
  const video_3s = hasRealVideoSignals
    ? Math.max(rawActionView, video_p25, video_p50, thruplay)
    : 0;
  const post_engagement = pickActionVal(actions, ['post_engagement', 'page_engagement']);
  const reaction = pickActionVal(actions, ['post_reaction', 'reaction']);
  const comments = pickActionVal(actions, ['comment']);
  const shares = pickActionVal(actions, ['post']);
  const follows = pickActionVal(actions, [
    'page_like',
    'like',
    'page_follow',
    'follow',
    'instagram_profile_follow',
  ]);

  const goal = resolveGoalLabel(optimizationGoal);
  const result = extractEntityResultByGoal(actions, goal, reach, impressions, thruplay, link_click);
  const isPerThousand = goal === 'REACH' || goal === 'IMPRESSIONS';
  const cpr = result > 0 ? (isPerThousand ? (spend / result) * 1000 : spend / result) : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const frequency = reach > 0 ? impressions / reach : 0;
  const hook_rate = impressions > 0 ? (video_3s / impressions) * 100 : 0;
  const hold_rate = video_3s > 0 ? Math.min(100, (thruplay / video_3s) * 100) : 0;

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
    roas,
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
    result,
    cpr,
    cpm,
    cpc,
    ctr,
    frequency,
    hook_rate,
    hold_rate,
    actions,
    optimization_goal: goal,
  };
}

export async function loadFullDomMetaDataset(
  ctx: DomMetaAuthContext,
  adAccountId: string,
  range: { since: string; until: string; prevSince: string; prevUntil: string },
  selectedYear = new Date().getFullYear()
): Promise<DomMetaDashboardDataset> {
  if (ctx.previewDataset && !ctx.directMetaToken && !ctx.accessToken) {
    return ctx.previewDataset;
  }
  const cleanAcc = adAccountId.replace(/^act_/i, '').trim();
  const actPath = `act_${cleanAcc}`;
  const timeRangeJson = JSON.stringify({ since: range.since, until: range.until });
  const prevRangeJson = JSON.stringify({ since: range.prevSince, until: range.prevUntil });
  const yearRangeJson = JSON.stringify({
    since: `${selectedYear}-01-01`,
    until: `${selectedYear}-12-31`,
  });

  const insightFields =
    'spend,impressions,reach,clicks,actions,action_values,purchase_roas,video_play_actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions';

  const safeListCall = async <T>(
    path: string,
    params: Record<string, string | number | boolean | undefined>
  ): Promise<GraphListResponse<T>> => {
    try {
      return await callMetaGraph<GraphListResponse<T>>(ctx, cleanAcc, path, params);
    } catch {
      return { data: [] };
    }
  };

  const safeObjCall = async <T>(
    path: string,
    params: Record<string, string | number | boolean | undefined>
  ): Promise<T | null> => {
    try {
      return await callMetaGraph<T>(ctx, cleanAcc, path, params);
    } catch {
      return null;
    }
  };

  const [
    currSummaryRes,
    prevSummaryRes,
    dailyRes,
    campListRes,
    campInsRes,
    adsetListRes,
    adsetInsRes,
    adListRes,
    adInsRes,
    platPosRes,
    ageGenderRes,
    regionRes,
    deviceRes,
    hourlyRes,
    accInfoRes,
    yearMonthlyRes,
    activitiesRes,
  ] = await Promise.all([
    callMetaGraph<GraphListResponse<GraphInsightRow>>(ctx, cleanAcc, `${actPath}/insights`, {
      fields: insightFields,
      time_range: timeRangeJson,
    }),
    safeListCall<GraphInsightRow>(`${actPath}/insights`, {
      fields: insightFields,
      time_range: prevRangeJson,
    }),
    safeListCall<GraphInsightRow>(`${actPath}/insights`, {
      fields: 'date_start,spend,impressions,reach,clicks,actions',
      time_increment: 1,
      limit: 100,
      time_range: timeRangeJson,
    }),
    safeListCall<GraphCampaignRow>(`${actPath}/campaigns`, {
      fields: 'id,name,status,effective_status,objective,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time',
      limit: 250,
    }),
    safeListCall<GraphInsightRow>(`${actPath}/insights`, {
      level: 'campaign',
      fields: `campaign_id,campaign_name,objective,${insightFields}`,
      limit: 250,
      time_range: timeRangeJson,
    }),
    safeListCall<GraphAdsetRow>(`${actPath}/adsets`, {
      fields:
        'id,name,campaign_id,status,effective_status,optimization_goal,daily_budget,lifetime_budget,start_time,end_time,targeting',
      limit: 400,
    }),
    safeListCall<GraphInsightRow>(`${actPath}/insights`, {
      level: 'adset',
      fields: `adset_id,adset_name,campaign_id,campaign_name,optimization_goal,${insightFields}`,
      limit: 400,
      time_range: timeRangeJson,
    }),
    safeListCall<GraphAdRow>(`${actPath}/ads`, {
      fields:
        'id,name,adset_id,campaign_id,status,effective_status,creative.thumbnail_width(600).thumbnail_height(600){id,thumbnail_url,image_url,effective_object_story_id}',
      limit: 400,
    }),
    safeListCall<GraphInsightRow>(`${actPath}/insights`, {
      level: 'ad',
      fields: `ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,optimization_goal,${insightFields}`,
      limit: 400,
      time_range: timeRangeJson,
    }),
    safeListCall<GraphInsightRow>(`${actPath}/insights`, {
      fields: 'spend,impressions,reach,clicks,actions',
      breakdowns: 'publisher_platform,platform_position',
      limit: 200,
      time_range: timeRangeJson,
    }),
    safeListCall<GraphInsightRow>(`${actPath}/insights`, {
      fields: 'spend,impressions,actions',
      breakdowns: 'age,gender',
      limit: 200,
      time_range: timeRangeJson,
    }),
    safeListCall<GraphInsightRow>(`${actPath}/insights`, {
      fields: 'spend,impressions,reach,actions',
      breakdowns: 'region',
      limit: 100,
      time_range: timeRangeJson,
    }),
    safeListCall<GraphInsightRow>(`${actPath}/insights`, {
      fields: 'spend,impressions,clicks',
      breakdowns: 'device_platform',
      limit: 50,
      time_range: timeRangeJson,
    }),
    safeListCall<GraphInsightRow>(`${actPath}/insights`, {
      fields: 'date_start,spend,impressions,clicks,actions',
      breakdowns: 'hourly_stats_aggregated_by_advertiser_time_zone',
      time_increment: 1,
      limit: 1000,
      time_range: timeRangeJson,
    }),
    safeObjCall<GraphAccountInfoResponse>(actPath, {
      fields: 'account_id,name,currency,balance,amount_spent,account_status,funding_source_details',
    }),
    safeListCall<GraphInsightRow>(`${actPath}/insights`, {
      fields: 'date_start,spend,reach,actions',
      time_increment: 'monthly',
      limit: 24,
      time_range: yearRangeJson,
    }),
    safeListCall<GraphActivityRow>(`${actPath}/activities`, {
      fields: 'event_time,event_type,translated_event_type,actor_name,object_name,extra_data',
      limit: 60,
    }),
  ]);

  const resolvedCurrency = String(accInfoRes?.currency || 'VND');

  const currRow = currSummaryRes?.data?.[0];
  const currParsed = parseInsightMetrics(currRow);

  const prevRow = prevSummaryRes?.data?.[0];
  const prevParsed = parseInsightMetrics(prevRow);

  // Daily series
  const daily: DomMetaDailyPoint[] = (Array.isArray(dailyRes?.data) ? dailyRes.data : [])
    .map((d) => {
      const m = parseInsightMetrics(d);
      return {
        date: String(d.date_start || ''),
        spend: m.spend,
        impressions: m.impressions,
        reach: m.reach,
        clicks: m.clicks,
        leads: m.leads,
        messages: m.messages,
        follows: m.follows,
        cpm: m.cpm,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build hierarchical Campaign -> Adset -> Ad tree
  const campMetaMap = new Map<string, GraphCampaignRow>();
  for (const c of Array.isArray(campListRes?.data) ? campListRes.data : []) {
    if (c.id) campMetaMap.set(String(c.id), c);
  }
  const adsetMetaMap = new Map<string, GraphAdsetRow>();
  for (const as of Array.isArray(adsetListRes?.data) ? adsetListRes.data : []) {
    if (as.id) adsetMetaMap.set(String(as.id), as);
  }
  const adMetaMap = new Map<string, GraphAdRow>();
  for (const ad of Array.isArray(adListRes?.data) ? adListRes.data : []) {
    if (ad.id) adMetaMap.set(String(ad.id), ad);
  }

  const normalizeMetaCdnUrl = (raw: unknown): string => {
    const u = String(raw || '').trim();
    if (!u) return '';
    return u
      .replace(/^https:\/\/scontent\.[^/]+\.fbcdn\.net\//i, 'https://scontent.xx.fbcdn.net/')
      .replace(/^https:\/\/external\.[^/]+\.fbcdn\.net\//i, 'https://external.xx.fbcdn.net/');
  };

  const adsByAdset = new Map<string, DomMetaAdNode[]>();
  const seenAdIds = new Set<string>();

  for (const ins of Array.isArray(adInsRes?.data) ? adInsRes.data : []) {
    const adId = String(ins.ad_id || '');
    if (!adId) continue;
    seenAdIds.add(adId);
    const meta = adMetaMap.get(adId) || {};
    const parentAdsetMeta = adsetMetaMap.get(String(ins.adset_id || meta.adset_id || '')) || {};
    const goalRaw = ins.optimization_goal || parentAdsetMeta.optimization_goal || '';
    const m = parseInsightMetrics(ins, goalRaw);
    const storyId = String(meta.creative?.effective_object_story_id || '');
    const postUrl = storyId.includes('_')
      ? `https://www.facebook.com/${storyId.split('_')[0]}/posts/${storyId.split('_')[1]}`
      : '';
    const normThumb = normalizeMetaCdnUrl(meta.creative?.thumbnail_url);
    const normImage = normalizeMetaCdnUrl(meta.creative?.image_url);
    const node: DomMetaAdNode = {
      id: adId,
      name: String(ins.ad_name || meta.name || `Ad #${adId}`),
      adset_id: String(ins.adset_id || meta.adset_id || ''),
      adset_name: String(ins.adset_name || parentAdsetMeta.name || ''),
      campaign_id: String(ins.campaign_id || meta.campaign_id || ''),
      campaign_name: String(ins.campaign_name || ''),
      status: String(meta.status || 'ACTIVE'),
      effective_status: String(meta.effective_status || meta.status || 'ACTIVE'),
      thumbnail_url: normThumb || normImage,
      image_url: normThumb || normImage,
      post_url: postUrl,
      story_id: storyId,
      ...m,
    };
    const arr = adsByAdset.get(node.adset_id) || [];
    arr.push(node);
    adsByAdset.set(node.adset_id, arr);
  }

  for (const [adId, meta] of adMetaMap.entries()) {
    if (seenAdIds.has(adId)) continue;
    const eff = String(meta.effective_status || meta.status || 'PAUSED').toUpperCase();
    if (eff === 'DELETED') continue;
    const adsetId = String(meta.adset_id || '');
    const parentAdsetMeta = adsetMetaMap.get(adsetId) || {};
    const emptyMetrics = parseInsightMetrics(undefined, parentAdsetMeta.optimization_goal || '');
    const storyId = String(meta.creative?.effective_object_story_id || '');
    const normThumb = normalizeMetaCdnUrl(meta.creative?.thumbnail_url);
    const normImage = normalizeMetaCdnUrl(meta.creative?.image_url);
    const node: DomMetaAdNode = {
      id: adId,
      name: String(meta.name || `Ad #${adId}`),
      adset_id: adsetId,
      adset_name: String(parentAdsetMeta.name || ''),
      campaign_id: String(meta.campaign_id || parentAdsetMeta.campaign_id || ''),
      campaign_name: '',
      status: String(meta.status || 'ACTIVE'),
      effective_status: eff,
      thumbnail_url: normThumb || normImage,
      image_url: normThumb || normImage,
      post_url: storyId.includes('_')
        ? `https://www.facebook.com/${storyId.split('_')[0]}/posts/${storyId.split('_')[1]}`
        : '',
      story_id: storyId,
      ...emptyMetrics,
    };
    const arr = adsByAdset.get(adsetId) || [];
    arr.push(node);
    adsByAdset.set(adsetId, arr);
  }

  const adsetsByCampaign = new Map<string, DomMetaAdsetNode[]>();
  const seenAdsetIds = new Set<string>();

  for (const ins of Array.isArray(adsetInsRes?.data) ? adsetInsRes.data : []) {
    const adsetId = String(ins.adset_id || '');
    if (!adsetId) continue;
    seenAdsetIds.add(adsetId);
    const meta = adsetMetaMap.get(adsetId) || {};
    const goalRaw = ins.optimization_goal || meta.optimization_goal || '';
    const m = parseInsightMetrics(ins, goalRaw);
    const childAds = (adsByAdset.get(adsetId) || []).sort((a, b) => b.spend - a.spend);
    const node: DomMetaAdsetNode = {
      id: adsetId,
      name: String(ins.adset_name || meta.name || `Adset #${adsetId}`),
      campaign_id: String(ins.campaign_id || meta.campaign_id || ''),
      campaign_name: String(ins.campaign_name || ''),
      status: String(meta.status || 'ACTIVE'),
      effective_status: String(meta.effective_status || meta.status || 'ACTIVE'),
      daily_budget: normalizeMetaBudget(meta.daily_budget, resolvedCurrency),
      lifetime_budget: normalizeMetaBudget(meta.lifetime_budget, resolvedCurrency),
      start_time: meta.start_time,
      end_time: meta.end_time,
      targeting: meta.targeting || null,
      ...m,
      ads: childAds,
    };
    const arr = adsetsByCampaign.get(node.campaign_id) || [];
    arr.push(node);
    adsetsByCampaign.set(node.campaign_id, arr);
  }

  const rollupMetricsFromChildren = <
    T extends {
      spend: number;
      impressions: number;
      reach: number;
      clicks: number;
      link_click: number;
      leads: number;
      messages: number;
      purchases: number;
      purchase_value: number;
      roas: number;
      video_play: number;
      video_3s: number;
      video_p25: number;
      video_p50: number;
      video_p75: number;
      video_p95: number;
      thruplay: number;
      post_engagement: number;
      reaction: number;
      comments: number;
      follows: number;
      result: number;
      actions: DomMetaActionMap;
    },
  >(
    children: T[],
    rawGoal: string
  ) => {
    const base = parseInsightMetrics(undefined, rawGoal);
    if (children.length === 0) return base;
    for (const ch of children) {
      base.spend += ch.spend;
      base.impressions += ch.impressions;
      base.reach += ch.reach;
      base.clicks += ch.clicks;
      base.link_click += ch.link_click;
      base.leads += ch.leads;
      base.messages += ch.messages;
      base.purchases += ch.purchases;
      base.purchase_value += ch.purchase_value;
      base.video_play += ch.video_play;
      base.video_3s += ch.video_3s;
      base.video_p25 += ch.video_p25;
      base.video_p50 += ch.video_p50;
      base.video_p75 += ch.video_p75;
      base.video_p95 += ch.video_p95;
      base.thruplay += ch.thruplay;
      base.post_engagement += ch.post_engagement;
      base.reaction += ch.reaction;
      base.comments += ch.comments;
      base.follows += ch.follows;
      base.result += ch.result;
      for (const [k, v] of Object.entries(ch.actions || {})) {
        base.actions[k] = (base.actions[k] || 0) + v;
      }
    }
    const isPerThousand = base.optimization_goal === 'REACH' || base.optimization_goal === 'IMPRESSIONS';
    base.cpr =
      base.result > 0 ? (isPerThousand ? (base.spend / base.result) * 1000 : base.spend / base.result) : 0;
    base.cpm = base.impressions > 0 ? (base.spend / base.impressions) * 1000 : 0;
    base.cpc = base.clicks > 0 ? base.spend / base.clicks : 0;
    base.ctr = base.impressions > 0 ? (base.clicks / base.impressions) * 100 : 0;
    base.frequency = base.reach > 0 ? base.impressions / base.reach : 0;
    base.hook_rate = base.impressions > 0 ? (base.video_3s / base.impressions) * 100 : 0;
    base.hold_rate = base.video_3s > 0 ? Math.min(100, (base.thruplay / base.video_3s) * 100) : 0;
    base.roas =
      base.spend > 0 && base.purchase_value > 0
        ? base.purchase_value / base.spend
        : Math.max(0, ...children.map((c) => c.roas));
    return base;
  };

  for (const [adsetId, meta] of adsetMetaMap.entries()) {
    if (seenAdsetIds.has(adsetId)) continue;
    const childAds = adsByAdset.get(adsetId) || [];
    const eff = String(meta.effective_status || meta.status || '').toUpperCase();
    if (eff !== 'ACTIVE' && eff !== 'COMPLETED' && !meta.end_time && childAds.length === 0) {
      continue;
    }
    const m = rollupMetricsFromChildren(childAds, meta.optimization_goal || '');
    const campId = String(meta.campaign_id || '');
    const node: DomMetaAdsetNode = {
      id: adsetId,
      name: String(meta.name || `Adset #${adsetId}`),
      campaign_id: campId,
      campaign_name: '',
      status: String(meta.status || 'PAUSED'),
      effective_status: eff || 'PAUSED',
      daily_budget: normalizeMetaBudget(meta.daily_budget, resolvedCurrency),
      lifetime_budget: normalizeMetaBudget(meta.lifetime_budget, resolvedCurrency),
      start_time: meta.start_time,
      end_time: meta.end_time,
      targeting: meta.targeting || null,
      ...m,
      ads: childAds,
    };
    const arr = adsetsByCampaign.get(campId) || [];
    arr.push(node);
    adsetsByCampaign.set(campId, arr);
  }

  const campaigns: DomMetaCampaignNode[] = [];
  const seenCampIds = new Set<string>();

  for (const ins of Array.isArray(campInsRes?.data) ? campInsRes.data : []) {
    const campId = String(ins.campaign_id || '');
    if (!campId) continue;
    seenCampIds.add(campId);
    const meta = campMetaMap.get(campId) || {};
    const childAdsets = (adsetsByCampaign.get(campId) || []).sort((a, b) => b.spend - a.spend);
    const dominantGoal =
      childAdsets[0]?.optimization_goal || resolveGoalLabel('', ins.objective || meta.objective);
    const m = parseInsightMetrics(ins, dominantGoal);
    campaigns.push({
      id: campId,
      name: String(ins.campaign_name || meta.name || `Campaign #${campId}`),
      status: String(meta.status || 'ACTIVE'),
      effective_status: String(meta.effective_status || meta.status || 'ACTIVE'),
      objective: String(ins.objective || meta.objective || ''),
      daily_budget: normalizeMetaBudget(meta.daily_budget, resolvedCurrency),
      lifetime_budget: normalizeMetaBudget(meta.lifetime_budget, resolvedCurrency),
      start_time: meta.start_time,
      stop_time: meta.stop_time,
      ...m,
      optimization_goal: dominantGoal,
      adsets: childAdsets,
    });
  }

  for (const [campId, meta] of campMetaMap.entries()) {
    if (seenCampIds.has(campId)) continue;
    const childAdsets = (adsetsByCampaign.get(campId) || []).sort((a, b) => b.spend - a.spend);
    const eff = String(meta.effective_status || meta.status || '').toUpperCase();
    if (eff !== 'ACTIVE' && eff !== 'COMPLETED' && !meta.stop_time && childAdsets.length === 0) {
      continue;
    }
    const dominantGoal =
      childAdsets[0]?.optimization_goal || resolveGoalLabel('', meta.objective || '');
    const m = rollupMetricsFromChildren(childAdsets, dominantGoal);
    campaigns.push({
      id: campId,
      name: String(meta.name || `Campaign #${campId}`),
      status: String(meta.status || 'PAUSED'),
      effective_status: eff || 'PAUSED',
      objective: String(meta.objective || ''),
      daily_budget: normalizeMetaBudget(meta.daily_budget, resolvedCurrency),
      lifetime_budget: normalizeMetaBudget(meta.lifetime_budget, resolvedCurrency),
      start_time: meta.start_time,
      stop_time: meta.stop_time,
      ...m,
      optimization_goal: dominantGoal,
      adsets: childAdsets,
    });
  }

  campaigns.sort((a, b) => b.spend - a.spend);

  const activeCampaigns = campaigns.filter(
    (c) => c.effective_status.toUpperCase() === 'ACTIVE'
  ).length;
  const allAdsets = campaigns.flatMap((c) => c.adsets);
  const activeAdsets = allAdsets.filter(
    (a) => a.effective_status.toUpperCase() === 'ACTIVE'
  ).length;
  const allAds = allAdsets.flatMap((a) => a.ads);
  const activeAds = allAds.filter((a) => a.effective_status.toUpperCase() === 'ACTIVE').length;

  // Platform & Position breakdown
  const platTotals = new Map<string, DomMetaPlatformSlice>();
  const positions: DomMetaPositionSlice[] = [];
  for (const r of Array.isArray(platPosRes?.data) ? platPosRes.data : []) {
    const rawPlat = String(r.publisher_platform || 'other').toLowerCase();
    const platKey =
      rawPlat === 'facebook'
        ? 'Facebook'
        : rawPlat === 'instagram'
          ? 'Instagram'
          : 'Other Platform';
    const m = parseInsightMetrics(r);
    const prev = platTotals.get(platKey) || {
      platform: platKey,
      spend: 0,
      impressions: 0,
      reach: 0,
      result: 0,
    };
    prev.spend += m.spend;
    prev.impressions += m.impressions;
    prev.reach += m.reach;
    prev.result += m.result;
    platTotals.set(platKey, prev);

    const posRaw = String(r.platform_position || 'feed').replace(/_/g, ' ');
    positions.push({
      platform: platKey,
      position: posRaw,
      label: `${platKey} · ${posRaw}`,
      spend: m.spend,
      impressions: m.impressions,
      clicks: m.clicks,
      result: m.result,
    });
  }
  positions.sort((a, b) => b.spend - a.spend);
  const platforms: DomMetaPlatformSlice[] = ['Facebook', 'Instagram', 'Other Platform'].map(
    (k) =>
      platTotals.get(k) || {
        platform: k,
        spend: 0,
        impressions: 0,
        reach: 0,
        result: 0,
      }
  );

  // Age & Gender breakdown
  const ageBrackets = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  const ageMap = new Map<string, DomMetaAgeGenderBucket>(
    ageBrackets.map((age) => [
      age,
      {
        age,
        maleSpend: 0,
        femaleSpend: 0,
        unknownSpend: 0,
        totalSpend: 0,
        maleResult: 0,
        femaleResult: 0,
      },
    ])
  );
  for (const r of Array.isArray(ageGenderRes?.data) ? ageGenderRes.data : []) {
    const age = String(r.age || '');
    if (!ageMap.has(age)) continue;
    const bucket = ageMap.get(age)!;
    const m = parseInsightMetrics(r);
    const gender = String(r.gender || '').toLowerCase();
    if (gender === 'male') {
      bucket.maleSpend += m.spend;
      bucket.maleResult += m.result;
    } else if (gender === 'female') {
      bucket.femaleSpend += m.spend;
      bucket.femaleResult += m.result;
    } else {
      bucket.unknownSpend += m.spend;
    }
    bucket.totalSpend += m.spend;
  }
  const ageGender = ageBrackets.map((a) => ageMap.get(a)!);

  // Region breakdown
  const regions: DomMetaRegionRow[] = (Array.isArray(regionRes?.data) ? regionRes.data : [])
    .map((r) => {
      const m = parseInsightMetrics(r);
      return {
        region: String(r.region || 'Khác'),
        spend: m.spend,
        impressions: m.impressions,
        reach: m.reach,
        result: m.result,
      };
    })
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 12);

  // Device breakdown
  const devices: DomMetaDeviceRow[] = (Array.isArray(deviceRes?.data) ? deviceRes.data : [])
    .map((r) => ({
      device: String(r.device_platform || 'mobile_app').replace(/_/g, ' '),
      spend: Number(r.spend || 0),
      impressions: Number(r.impressions || 0),
      clicks: Number(r.clicks || 0),
    }))
    .sort((a, b) => b.spend - a.spend);

  // Dayparting Heatmap (7 days x 24 hours)
  const cellMap = new Map<string, DomMetaHourlyCell>();
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      cellMap.set(`${d}_${h}`, {
        dayOfWeek: d,
        hour: h,
        spend: 0,
        clicks: 0,
        leads: 0,
        messages: 0,
        purchases: 0,
        impressions: 0,
      });
    }
  }
  for (const r of Array.isArray(hourlyRes?.data) ? hourlyRes.data : []) {
    const dt = new Date(`${String(r.date_start || '')}T00:00:00`);
    const day = Number.isNaN(dt.getTime()) ? 1 : dt.getDay();
    const hourStr = String(r.hourly_stats_aggregated_by_advertiser_time_zone || '00:00:00');
    const hour = Math.min(23, Math.max(0, parseInt(hourStr.split(':')[0] || '0', 10) || 0));
    const cell = cellMap.get(`${day}_${hour}`);
    if (!cell) continue;
    const m = parseInsightMetrics(r);
    cell.spend += m.spend;
    cell.clicks += m.clicks;
    cell.leads += m.leads;
    cell.messages += m.messages;
    cell.purchases += m.purchases;
    cell.impressions += m.impressions;
  }
  const heatmap = Array.from(cellMap.values());

  // Account Overview
  const accountOverview: DomMetaAccountOverview | null = accInfoRes?.account_id
    ? {
        account_id: String(accInfoRes.account_id),
        name: String(accInfoRes.name || `AdAccount #${cleanAcc}`),
        currency: String(accInfoRes.currency || 'VND'),
        balance: Number(accInfoRes.balance || 0),
        amount_spent: Number(accInfoRes.amount_spent || 0),
        funding_source: String(
          accInfoRes.funding_source_details?.display_string || 'Thẻ tín dụng / Thanh toán tự động Meta'
        ),
        account_status: Number(accInfoRes.account_status || 1),
      }
    : null;

  // Monthly Year Breakdown
  const monthBuckets = new Map<number, DomMetaMonthlyPoint>();
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0');
    monthBuckets.set(m, {
      month: `T${m}`,
      monthKey: `${selectedYear}-${mm}`,
      spend: 0,
      leads: 0,
      reach: 0,
      messages: 0,
      follows: 0,
    });
  }
  for (const r of Array.isArray(yearMonthlyRes?.data) ? yearMonthlyRes.data : []) {
    const mIdx = parseInt(String(r.date_start || '').split('-')[1] || '0', 10);
    const bucket = monthBuckets.get(mIdx);
    if (!bucket) continue;
    const parsed = parseInsightMetrics(r);
    bucket.spend += parsed.spend;
    bucket.leads += parsed.leads;
    bucket.reach += parsed.reach;
    bucket.messages += parsed.messages;
    bucket.follows += parsed.follows;
  }
  const monthlyByYear = Array.from(monthBuckets.values());

  // Activity Logs
  const activities: DomMetaActivityLogItem[] = (
    Array.isArray(activitiesRes?.data) ? activitiesRes.data : []
  ).map((act) => {
    const ev = String(act.event_type || '').toUpperCase();
    let category = 'ACCOUNT';
    if (ev.includes('CAMPAIGN')) category = 'CAMPAIGN';
    else if (ev.includes('AD_SET') || ev.includes('ADSET')) category = 'AD_SET';
    else if (ev.includes('BUDGET')) category = 'BUDGET';
    else if (ev.includes('TARGET')) category = 'TARGETING';
    else if (ev.includes('AUDIENCE')) category = 'AUDIENCE';
    else if (ev.includes('STATUS')) category = 'STATUS';
    else if (ev.includes('AD')) category = 'AD';
    return {
      event_time: String(act.event_time || ''),
      event_type: String(act.event_type || ''),
      translated_event_type: String(act.translated_event_type || act.event_type || ''),
      actor_name: String(act.actor_name || 'System'),
      object_name: String(act.object_name || 'Meta Object'),
      category,
      extra_data:
        typeof act.extra_data === 'string'
          ? act.extra_data
          : JSON.stringify(act.extra_data ?? ''),
    };
  });

  return {
    dateRange: range,
    currentTotals: {
      spend: currParsed.spend,
      impressions: currParsed.impressions,
      reach: currParsed.reach,
      clicks: currParsed.clicks,
      link_click: currParsed.link_click,
      leads: currParsed.leads,
      messages: currParsed.messages,
      message_connection: currParsed.message_connection,
      purchases: currParsed.purchases,
      purchase_value: currParsed.purchase_value,
      roas: currParsed.roas,
      video_play: currParsed.video_play,
      video_3s: currParsed.video_3s,
      video_p25: currParsed.video_p25,
      video_p50: currParsed.video_p50,
      video_p75: currParsed.video_p75,
      video_p95: currParsed.video_p95,
      video_p100: currParsed.video_p100,
      thruplay: currParsed.thruplay,
      post_engagement: currParsed.post_engagement,
      reaction: currParsed.reaction,
      comments: currParsed.comments,
      shares: currParsed.shares,
      photo_view: currParsed.photo_view,
      follows: currParsed.follows,
      cpm: currParsed.cpm,
      cpc: currParsed.cpc,
      ctr: currParsed.ctr,
      frequency: currParsed.frequency,
      hook_rate: currParsed.hook_rate,
      hold_rate: currParsed.hold_rate,
    },
    prevTotals: {
      spend: prevParsed.spend,
      impressions: prevParsed.impressions,
      reach: prevParsed.reach,
      clicks: prevParsed.clicks,
      link_click: prevParsed.link_click,
      leads: prevParsed.leads,
      messages: prevParsed.messages,
      message_connection: prevParsed.message_connection,
      purchases: prevParsed.purchases,
      purchase_value: prevParsed.purchase_value,
      roas: prevParsed.roas,
      video_play: prevParsed.video_play,
      video_3s: prevParsed.video_3s,
      video_p25: prevParsed.video_p25,
      video_p50: prevParsed.video_p50,
      video_p75: prevParsed.video_p75,
      video_p95: prevParsed.video_p95,
      video_p100: prevParsed.video_p100,
      thruplay: prevParsed.thruplay,
      post_engagement: prevParsed.post_engagement,
      reaction: prevParsed.reaction,
      comments: prevParsed.comments,
      shares: prevParsed.shares,
      photo_view: prevParsed.photo_view,
      follows: prevParsed.follows,
      cpm: prevParsed.cpm,
      cpc: prevParsed.cpc,
      ctr: prevParsed.ctr,
      frequency: prevParsed.frequency,
      hook_rate: prevParsed.hook_rate,
      hold_rate: prevParsed.hold_rate,
    },
    counts: {
      activeCampaigns,
      totalCampaigns: Math.max(activeCampaigns, campaigns.length),
      activeAdsets,
      totalAdsets: Math.max(activeAdsets, allAdsets.length),
      activeAds,
      totalAds: Math.max(activeAds, allAds.length),
    },
    daily,
    campaigns,
    platforms,
    positions,
    ageGender,
    regions,
    devices,
    heatmap,
    accountOverview,
    monthlyByYear,
    activities,
  };
}

export async function fetchDomMetaCompareTotals(
  ctx: DomMetaAuthContext,
  adAccountId: string,
  since: string,
  until: string,
  campaignIds?: string[]
): Promise<DomMetaTotalsSnapshot> {
  if (ctx.previewDataset && !ctx.directMetaToken && !ctx.accessToken) {
    return { ...ctx.previewDataset.prevTotals };
  }
  const cleanAcc = adAccountId.replace(/^act_/i, '').trim();
  const actPath = `act_${cleanAcc}`;
  const insightFields =
    'spend,impressions,reach,clicks,actions,action_values,purchase_roas,video_play_actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions';
  const params: Record<string, string | number | boolean | undefined> = {
    fields: insightFields,
    time_range: JSON.stringify({ since, until }),
  };
  if (campaignIds && campaignIds.length > 0) {
    params.filtering = JSON.stringify([
      { field: 'campaign.id', operator: 'IN', value: campaignIds },
    ]);
  }
  const resp = await callMetaGraph<GraphListResponse<GraphInsightRow>>(
    ctx,
    cleanAcc,
    `${actPath}/insights`,
    params
  );
  const parsed = parseInsightMetrics(resp?.data?.[0]);
  return {
    spend: parsed.spend,
    impressions: parsed.impressions,
    reach: parsed.reach,
    clicks: parsed.clicks,
    link_click: parsed.link_click,
    leads: parsed.leads,
    messages: parsed.messages,
    message_connection: parsed.message_connection,
    purchases: parsed.purchases,
    purchase_value: parsed.purchase_value,
    roas: parsed.roas,
    video_play: parsed.video_play,
    video_3s: parsed.video_3s,
    video_p25: parsed.video_p25,
    video_p50: parsed.video_p50,
    video_p75: parsed.video_p75,
    video_p95: parsed.video_p95,
    video_p100: parsed.video_p100,
    thruplay: parsed.thruplay,
    post_engagement: parsed.post_engagement,
    reaction: parsed.reaction,
    comments: parsed.comments,
    shares: parsed.shares,
    photo_view: parsed.photo_view,
    follows: parsed.follows,
    cpm: parsed.cpm,
    cpc: parsed.cpc,
    ctr: parsed.ctr,
    frequency: parsed.frequency,
    hook_rate: parsed.hook_rate,
    hold_rate: parsed.hold_rate,
  };
}

function parseDeviceField(val: unknown): { clicks: number; spent: number } {
  if (typeof val === 'number') {
    return { clicks: Number.isFinite(val) ? val : 0, spent: 0 };
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return { clicks: 0, spent: 0 };
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return { clicks: Number(trimmed) || 0, spent: 0 };
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === 'object') {
        const rec = parsed as Record<string, unknown>;
        return {
          clicks: Number(rec.Click ?? rec.click ?? rec.clicks ?? 0) || 0,
          spent: Number(rec.Spent ?? rec.spent ?? rec.cost ?? 0) || 0,
        };
      }
    } catch {
      return { clicks: 0, spent: 0 };
    }
  }
  if (val && typeof val === 'object') {
    const rec = val as Record<string, unknown>;
    return {
      clicks: Number(rec.Click ?? rec.click ?? rec.clicks ?? 0) || 0,
      spent: Number(rec.Spent ?? rec.spent ?? rec.cost ?? 0) || 0,
    };
  }
  return { clicks: 0, spent: 0 };
}

function mapGoogleAdsObjectRow(obj: Record<string, unknown>): DomGoogleAdsRow {
  const mob = parseDeviceField(obj.mobile);
  const desk = parseDeviceField(obj.desktop);
  const tab = parseDeviceField(obj.tablet);
  return {
    date: String(obj.date || obj.day || ''),
    campaign: String(obj.campaign || obj.campaign_name || 'Google Campaign'),
    campaign_id: String(obj.campaign_id || obj.campaignId || ''),
    spent: Number(obj.spent ?? obj.cost ?? obj.spend ?? 0) || 0,
    impression: Number(obj.impression ?? obj.impressions ?? 0) || 0,
    click: Number(obj.click ?? obj.clicks ?? 0) || 0,
    ctr: Number(obj.ctr ?? 0) || 0,
    all_conversions: Number(obj.all_conversions ?? obj.conversions ?? obj.conv ?? 0) || 0,
    directions: Number(obj.directions ?? 0) || 0,
    calls: Number(obj.calls ?? 0) || 0,
    menu: Number(obj.menu ?? 0) || 0,
    orders: Number(obj.orders ?? 0) || 0,
    other: Number(obj.other ?? 0) || 0,
    store_visits: Number(obj.store_visits ?? obj.storeVisits ?? 0) || 0,
    mobile: mob.clicks,
    desktop: desk.clicks,
    tablet: tab.clicks,
    mobile_spent: mob.spent,
    desktop_spent: desk.spent,
    tablet_spent: tab.spent,
    lead_forms: Number(obj.lead_forms ?? 0) || 0,
    hourly: obj.hourly,
    channels: obj.channels,
    locations: obj.locations,
    distances: obj.distances,
  };
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return Boolean(val && typeof val === 'object' && !Array.isArray(val));
}

function expandCompactGoogleAds(compact: unknown): {
  rows: DomGoogleAdsRow[];
  leadForms: Record<string, unknown>[];
  syncedAt: string | null;
} {
  if (Array.isArray(compact)) {
    return {
      rows: compact.filter(isRecord).map((item) => mapGoogleAdsObjectRow(item)),
      leadForms: [],
      syncedAt: null,
    };
  }

  if (isRecord(compact)) {
    const syncedAt = compact.syncedAt ? String(compact.syncedAt) : null;
    const leadForms = Array.isArray(compact.leadForms)
      ? compact.leadForms.filter(isRecord)
      : [];

    if (Array.isArray(compact.h) && Array.isArray(compact.d)) {
      const headers = compact.h.map((h) => String(h));
      const rows: DomGoogleAdsRow[] = compact.d
        .filter((arr): arr is unknown[] => Array.isArray(arr))
        .map((arr) => {
          const obj: Record<string, unknown> = {};
          for (let i = 0; i < headers.length; i++) {
            obj[headers[i]] = arr[i];
          }
          return mapGoogleAdsObjectRow(obj);
        });
      return { rows, leadForms, syncedAt };
    }

    const altObjectRows = Array.isArray(compact.rows)
      ? compact.rows
      : Array.isArray(compact.data)
        ? compact.data
        : null;

    if (altObjectRows) {
      return {
        rows: altObjectRows.filter(isRecord).map((item) => mapGoogleAdsObjectRow(item)),
        leadForms,
        syncedAt,
      };
    }

    return { rows: [], leadForms, syncedAt };
  }

  return { rows: [], leadForms: [], syncedAt: null };
}

export async function loadDomGoogleAdsKeywords(
  ctx: DomMetaAuthContext,
  campaignId: string,
  range: { since: string; until: string }
): Promise<{
  keywords: DomGoogleAdsKeywordItem[];
  searchTerms: DomGoogleAdsSearchTermItem[];
}> {
  const parsePayload = (raw: unknown) => {
    const rec = isRecord(raw) ? raw : {};
    const kwRaw: unknown[] = Array.isArray(rec.keywords)
      ? rec.keywords
      : Array.isArray(rec.kw)
        ? rec.kw
        : [];
    const stRaw: unknown[] = Array.isArray(rec.searchTerms)
      ? rec.searchTerms
      : Array.isArray(rec.terms)
        ? rec.terms
        : [];

    const keywords: DomGoogleAdsKeywordItem[] = kwRaw.map((item) => {
      if (Array.isArray(item)) {
        return {
          keyword: String(item[0] ?? ''),
          adGroup: String(item[1] ?? ''),
          matchType: String(item[2] ?? 'BROAD'),
          impressions: Number(item[3] ?? 0) || 0,
          clicks: Number(item[4] ?? 0) || 0,
          ctr: Number(item[5] ?? 0) || 0,
          conversions: Number(item[6] ?? 0) || 0,
          spent: Number(item[7] ?? 0) || 0,
          impressionShare: String(item[8] ?? '—'),
        };
      }
      const k = isRecord(item) ? item : {};
      return {
        keyword: String(k.keyword || k.criterion || ''),
        adGroup: String(k.adGroup || k.ad_group || ''),
        matchType: String(k.matchType || k.match_type || 'BROAD'),
        impressions: Number(k.impressions ?? k.imp ?? 0) || 0,
        clicks: Number(k.clicks ?? k.click ?? 0) || 0,
        ctr: Number(k.ctr ?? 0) || 0,
        conversions: Number(k.conversions ?? k.conv ?? 0) || 0,
        spent: Number(k.spent ?? k.cost ?? 0) || 0,
        impressionShare: String(k.impressionShare ?? k.imp_share ?? k.impShare ?? '—'),
      };
    });

    const searchTerms: DomGoogleAdsSearchTermItem[] = stRaw.map((item) => {
      if (Array.isArray(item)) {
        return {
          searchTerm: String(item[0] ?? ''),
          status: String(item[1] ?? 'NONE'),
          impressions: Number(item[2] ?? 0) || 0,
          clicks: Number(item[3] ?? 0) || 0,
          ctr: Number(item[4] ?? 0) || 0,
          cpc: Number(item[5] ?? 0) || 0,
          spent: Number(item[6] ?? 0) || 0,
        };
      }
      const s = isRecord(item) ? item : {};
      return {
        searchTerm: String(s.searchTerm || s.term || ''),
        status: String(s.status || 'NONE'),
        impressions: Number(s.impressions ?? s.imp ?? 0) || 0,
        clicks: Number(s.clicks ?? s.click ?? 0) || 0,
        ctr: Number(s.ctr ?? 0) || 0,
        cpc: Number(s.cpc ?? 0) || 0,
        spent: Number(s.spent ?? s.cost ?? 0) || 0,
      };
    });

    return { keywords, searchTerms };
  };

  if (ctx.directGoogleAds?.apps_script_url && !ctx.accessToken) {
    const target = new URL(ctx.directGoogleAds.apps_script_url);
    target.searchParams.set('type', 'keywords');
    target.searchParams.set('campaignId', campaignId);
    target.searchParams.set('since', range.since);
    target.searchParams.set('until', range.until);
    if (ctx.directGoogleAds.customer_id) {
      target.searchParams.set('account_id', ctx.directGoogleAds.customer_id);
    }
    if (ctx.directGoogleAds.developer_token) {
      target.searchParams.set('token', ctx.directGoogleAds.developer_token);
    }
    const r = await fetch(target.toString());
    const data: unknown = r.ok ? await r.json().catch(() => ({})) : {};
    return parsePayload(data);
  }

  const res = await fetch(resolveApiUrl(ctx, '/api/v1/integrations/dom-meta/google-ads-proxy'), {
    method: 'POST',
    headers: buildAuthHeaders(ctx),
    body: JSON.stringify({
      action: 'keywords',
      campaign_id: campaignId,
      since: range.since,
      until: range.until,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: unknown;
    message?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message || json?.message || 'Không thể tải từ khóa Google Ads.');
  }
  return parsePayload(json.data);
}

export async function loadDomGoogleAdsDataset(
  ctx: DomMetaAuthContext,
  range: { since: string; until: string; prevSince: string; prevUntil: string },
  options?: {
    testConnection?: boolean;
    overrideConfig?: { customer_id?: string; apps_script_url?: string; developer_token?: string };
  }
): Promise<{
  currentRows: DomGoogleAdsRow[];
  prevRows: DomGoogleAdsRow[];
  leadForms: Record<string, unknown>[];
  syncedAt: string | null;
}> {
  if (ctx.directGoogleAds?.apps_script_url && !ctx.accessToken) {
    const target = new URL(ctx.directGoogleAds.apps_script_url);
    target.searchParams.set(
      'time_range',
      JSON.stringify({ since: range.prevSince, until: range.until })
    );
    if (ctx.directGoogleAds.customer_id) {
      target.searchParams.set('account_id', ctx.directGoogleAds.customer_id);
    }
    if (ctx.directGoogleAds.developer_token) {
      target.searchParams.set('token', ctx.directGoogleAds.developer_token);
    }
    const r = await fetch(target.toString());
    const compact: unknown = r.ok ? await r.json().catch(() => ({ h: [], d: [] })) : { h: [], d: [] };
    const expanded = expandCompactGoogleAds(compact);
    return {
      currentRows: expanded.rows.filter((x) => x.date >= range.since && x.date <= range.until),
      prevRows: expanded.rows.filter((x) => x.date >= range.prevSince && x.date <= range.prevUntil),
      leadForms: expanded.leadForms,
      syncedAt: expanded.syncedAt,
    };
  }

  const res = await fetch(resolveApiUrl(ctx, '/api/v1/integrations/dom-meta/google-ads-proxy'), {
    method: 'POST',
    headers: buildAuthHeaders(ctx),
    body: JSON.stringify({
      time_range: { since: range.prevSince, until: range.until },
      test_connection: Boolean(options?.testConnection),
      override_config: options?.overrideConfig,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: unknown;
    message?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message || json?.message || 'Không thể tải dữ liệu Google Ads.');
  }
  const expanded = expandCompactGoogleAds(json.data);
  return {
    currentRows: expanded.rows.filter((x) => x.date >= range.since && x.date <= range.until),
    prevRows: expanded.rows.filter((x) => x.date >= range.prevSince && x.date <= range.prevUntil),
    leadForms: expanded.leadForms,
    syncedAt: expanded.syncedAt,
  };
}

export async function fetchDomMetaQuickConnectStatus(
  ctx: DomMetaAuthContext
): Promise<DomMetaQuickConnectStatus> {
  if (ctx.previewQuickConnectStatus && !ctx.accessToken) {
    return ctx.previewQuickConnectStatus;
  }
  if ((ctx.directMetaToken || ctx.previewDataset) && ctx.directAdAccountId && !ctx.accessToken) {
    const cleanId = ctx.directAdAccountId.replace(/^act_/i, '');
    return {
      has_meta_token: true,
      total_accounts: 1,
      active_accounts: 1,
      primary_ad_account_id: cleanId,
      primary_account_name: ctx.previewDataset?.accountOverview?.name || `TK #${cleanId.slice(-4)}`,
      has_capi_pixel: true,
      dom_meta_connected: true,
      can_auto_connect: false,
      accounts: [
        {
          id: `direct_${cleanId}`,
          ad_account_id: cleanId,
          name: ctx.previewDataset?.accountOverview?.name || `TK #${cleanId.slice(-4)}`,
          has_token: true,
          is_active: true,
        },
      ],
    };
  }
  if (!ctx.accessToken) {
    return {
      has_meta_token: false,
      total_accounts: 0,
      active_accounts: 0,
      primary_ad_account_id: '',
      primary_account_name: '',
      has_capi_pixel: false,
      dom_meta_connected: false,
      can_auto_connect: false,
      accounts: [],
    };
  }

  const res = await fetch(resolveApiUrl(ctx, '/api/v1/integrations/dom-meta/quick-connect-status'), {
    method: 'GET',
    headers: buildAuthHeaders(ctx),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: DomMetaQuickConnectStatus;
    has_meta_token?: boolean;
    message?: string;
    error?: { message?: string };
  } & Partial<DomMetaQuickConnectStatus>;
  if (!res.ok || json?.success === false) {
    throw new Error(
      json?.error?.message || json?.message || 'Không thể kiểm tra trạng thái kết nối Meta.'
    );
  }
  if (json.data) return json.data;
  return {
    has_meta_token: Boolean(json.has_meta_token),
    total_accounts: Number(json.total_accounts || 0),
    active_accounts: Number(json.active_accounts || 0),
    primary_ad_account_id: String(json.primary_ad_account_id || ''),
    primary_account_name: String(json.primary_account_name || ''),
    has_capi_pixel: Boolean(json.has_capi_pixel),
    dom_meta_connected: Boolean(json.dom_meta_connected),
    can_auto_connect: Boolean(json.can_auto_connect),
    accounts: Array.isArray(json.accounts) ? json.accounts : [],
  };
}

export async function quickConnectDomMeta(
  ctx: DomMetaAuthContext,
  payload: {
    auto_reuse?: boolean;
    access_token?: string;
    accounts?: Array<{ ad_account_id: string; name?: string; pixel_id?: string }>;
    ad_account_id?: string;
    name?: string;
    pixel_id?: string;
    primary_ad_account_id?: string;
  }
): Promise<{
  mode: 'auto_reuse' | 'token_connect';
  connected_count: number;
  status: DomMetaQuickConnectStatus;
  config: DomMetaWorkspaceConfig;
  message?: string;
}> {
  const res = await fetch(resolveApiUrl(ctx, '/api/v1/integrations/dom-meta/quick-connect'), {
    method: 'POST',
    headers: buildAuthHeaders(ctx),
    body: JSON.stringify(payload),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    mode?: 'auto_reuse' | 'token_connect';
    connected_count?: number;
    status?: DomMetaQuickConnectStatus;
    config?: DomMetaWorkspaceConfig;
    message?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json?.success || !json?.status || !json?.config) {
    throw new Error(
      json?.error?.message || json?.message || 'Không thể kích hoạt kết nối nhanh Meta.'
    );
  }
  return {
    mode: json.mode || 'auto_reuse',
    connected_count: Number(json.connected_count || 1),
    status: json.status,
    config: json.config,
    message: json.message,
  };
}

export async function fetchDomMetaCrmAttribution(
  ctx: DomMetaAuthContext,
  params: {
    since: string;
    until: string;
    entity_type?: 'ad' | 'adset' | 'campaign';
    entity_id?: string;
    entity_name?: string;
    sale_id?: string;
    quality_status?: string;
    page?: number;
    page_size?: number;
  }
): Promise<DomMetaCrmAttributionPayload> {
  if (ctx.previewCrmAttribution && !ctx.accessToken) {
    if (params.entity_id && params.entity_type) {
      const rawItems =
        ctx.previewEntityLeadsByEntityId?.[params.entity_id] ||
        Object.values(ctx.previewEntityLeadsByEntityId || {})
          .flat()
          .filter((item) =>
            params.entity_type === 'ad'
              ? item.ad_id === params.entity_id
              : params.entity_type === 'adset'
                ? item.adset_id === params.entity_id
                : item.campaign_id === params.entity_id
          );

      const salesMap = new Map<
        string,
        { user_id: string; name: string; avatar?: string | null; count: number }
      >();
      for (const l of rawItems) {
        const sid = l.assigned_to || 'unassigned';
        const cur = salesMap.get(sid) || {
          user_id: sid,
          name: l.assigned_to_name || 'Chưa phân bổ',
          avatar: l.assigned_to_avatar,
          count: 0,
        };
        cur.count += 1;
        salesMap.set(sid, cur);
      }

      const filtered = rawItems.filter((item) => {
        if (params.sale_id && params.sale_id !== 'all') {
          if ((item.assigned_to || 'unassigned') !== params.sale_id) return false;
        }
        if (params.quality_status && params.quality_status !== 'all') {
          const qs = params.quality_status.toLowerCase();
          const st = (item.stage_key || item.quality_status || '').toLowerCase();
          const isQual = ['qualified', 'booked', 'booking', 'deposited', 'closed'].includes(st);
          const isClosed = st === 'closed' || st === 'deposited';
          const isNeg = st === 'notlead';
          if (qs === 'qualified' && !isQual) return false;
          if (qs === 'closed' && !isClosed) return false;
          if (qs === 'negative' && !isNeg) return false;
          if (qs === 'pending' && (isQual || isNeg)) return false;
        }
        return true;
      });

      return {
        ...ctx.previewCrmAttribution,
        entity_leads: {
          items: filtered,
          total: filtered.length,
          page: params.page || 1,
          page_size: params.page_size || 50,
          sales_filter_options: Array.from(salesMap.values()).sort((a, b) => b.count - a.count),
        },
      };
    }
    return ctx.previewCrmAttribution;
  }

  if (!ctx.accessToken) {
    return {
      summary: {
        total_leads: 0,
        attributed_leads: 0,
        qualified_leads: 0,
        closed_leads: 0,
        negative_leads: 0,
        total_revenue_vnd: 0,
        capi_sent_count: 0,
      },
      by_ad: {},
      by_adset: {},
      by_campaign: {},
    };
  }

  const q = new URLSearchParams();
  if (params.since) q.set('since', params.since);
  if (params.until) q.set('until', params.until);
  if (params.entity_type) q.set('entity_type', params.entity_type);
  if (params.entity_id) q.set('entity_id', params.entity_id);
  if (params.entity_name) q.set('entity_name', params.entity_name);
  if (params.sale_id) q.set('sale_id', params.sale_id);
  if (params.quality_status) q.set('quality_status', params.quality_status);
  if (params.page) q.set('page', String(params.page));
  if (params.page_size) q.set('page_size', String(params.page_size));

  const res = await fetch(
    resolveApiUrl(ctx, `/api/v1/integrations/dom-meta/crm-attribution?${q.toString()}`),
    {
      method: 'GET',
      headers: buildAuthHeaders(ctx),
    }
  );
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: DomMetaCrmAttributionPayload;
    message?: string;
    error?: { message?: string };
  } & Partial<DomMetaCrmAttributionPayload>;

  if (!res.ok || json?.success === false) {
    throw new Error(
      json?.error?.message || json?.message || 'Không thể tải dữ liệu đối soát khách hàng.'
    );
  }
  if (json.data) return json.data;
  return {
    summary: json.summary || {
      total_leads: 0,
      attributed_leads: 0,
      qualified_leads: 0,
      closed_leads: 0,
      negative_leads: 0,
      total_revenue_vnd: 0,
      capi_sent_count: 0,
    },
    by_ad: json.by_ad || {},
    by_adset: json.by_adset || {},
    by_campaign: json.by_campaign || {},
    ...(json.by_campaign_name ? { by_campaign_name: json.by_campaign_name } : {}),
    ...(json.entity_leads ? { entity_leads: json.entity_leads } : {}),
  };
}
