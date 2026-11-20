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
  DomMetaEntityCreativeSpec,
  DomMetaEntityDailyPoint,
  DomMetaEntityDeepBreakdownRow,
  DomMetaEntityDeepDetail,
  DomMetaEntityDeliveryDiagnostics,
  DomMetaEntityHourPoint,
  DomMetaHourlyCell,
  DomMetaMonthlyPoint,
  DomMetaPlatformSlice,
  DomMetaPositionSlice,
  DomMetaQuickConnectStatus,
  DomMetaRegionRow,
  DomMetaSharedAiConfig,
  DomMetaShareState,
  DomMetaTargetingSpec,
  DomMetaTotalsSnapshot,
  DomMetaWorkspaceConfig,
  DomMetaWorkspacePatch,
} from './domMetaTypes';

export interface DomMetaAuthContext {
  apiBaseUrl?: string; // default ''
  accessToken?: string; // Tenant JWT Bearer token
  tenantSlug?: string;
  /** Enable standalone session recovery / public slug access fallback on 401 */
  standaloneSessionRecovery?: boolean;
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
  frequency?: string | number;
  cpm?: string | number;
  cpc?: string | number;
  cpp?: string | number;
  ctr?: string | number;
  clicks?: string | number;
  unique_clicks?: string | number;
  unique_ctr?: string | number;
  inline_link_clicks?: string | number;
  inline_link_click_ctr?: string | number;
  inline_post_engagement?: string | number;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  objective?: string;
  optimization_goal?: string;
  quality_ranking?: string;
  engagement_rate_ranking?: string;
  conversion_rate_ranking?: string;
  publisher_platform?: string;
  platform_position?: string;
  age?: string;
  gender?: string;
  region?: string;
  country?: string;
  device_platform?: string;
  impression_device?: string;
  hourly_stats_aggregated_by_advertiser_time_zone?: string;
  hourly_stats_aggregated_by_audience_time_zone?: string;
  outbound_clicks?: GraphActionEntry[];
  unique_actions?: GraphActionEntry[];
  actions?: GraphActionEntry[];
  action_values?: GraphActionEntry[];
  cost_per_action_type?: GraphActionEntry[];
  purchase_roas?: GraphActionEntry[];
  video_play_actions?: GraphActionEntry[];
  video_avg_time_watched_actions?: GraphActionEntry[];
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
  buying_type?: string;
  bid_strategy?: string;
  daily_budget?: string | number;
  lifetime_budget?: string | number;
  budget_remaining?: string | number;
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
  bid_strategy?: string;
  billing_event?: string;
  destination_type?: string;
  learning_stage_info?: { status?: string; conversions?: number };
  attribution_spec?: Array<{ event_type?: string; window_days?: number }>;
  daily_budget?: string | number;
  lifetime_budget?: string | number;
  budget_remaining?: string | number;
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
    title?: string;
    body?: string;
    call_to_action_type?: string;
    link_url?: string;
    object_type?: string;
    video_id?: string;
    actor_id?: string;
    instagram_permalink_url?: string;
    thumbnail_url?: string;
    image_url?: string;
    object_story_spec?: unknown;
    effective_object_story_id?: string;
    effective_instagram_media_id?: string;
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
  spend_cap?: string | number;
  account_status?: string | number;
  timezone_name?: string;
  business_name?: string;
  business_city?: string;
  business_country_code?: string;
  tax_id?: string;
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

const DOM_META_SESSION_STORAGE_KEY = 'domation_autodata_session_v2';
let domMetaRefreshInFlight: Promise<string | null> | null = null;

async function tryRecoverDomMetaSession(ctx: DomMetaAuthContext): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (ctx.standaloneSessionRecovery !== true && !localStorage.getItem(DOM_META_SESSION_STORAGE_KEY)) {
    return null;
  }
  if (domMetaRefreshInFlight) return domMetaRefreshInFlight;

  domMetaRefreshInFlight = (async (): Promise<string | null> => {
    const slug = (ctx.tenantSlug || '').trim().toLowerCase();
    try {
      const raw = localStorage.getItem(DOM_META_SESSION_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
      const refreshToken = parsed && typeof parsed.refresh_token === 'string' ? parsed.refresh_token : '';
      const accountToken = parsed && typeof parsed.account_token === 'string' ? parsed.account_token : '';

      if (refreshToken || accountToken) {
        const res = await fetch(resolveApiUrl(ctx, '/api/v1/auth/refresh'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(slug ? { 'X-Tenant-Slug': slug } : {}),
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
            account_token: accountToken,
            tenant_slug: slug || (parsed && typeof parsed.tenant_slug === 'string' ? parsed.tenant_slug : ''),
          }),
        });
        const json = (await res.json().catch(() => null)) as {
          success?: boolean;
          data?: {
            access_token?: string;
            refresh_token?: string;
            account_token?: string;
            tenant?: { slug?: string; name?: string; industry?: string };
            user?: { id?: string; email?: string; full_name?: string; role?: string };
            workspaces?: unknown[];
            subscription?: unknown;
          };
        } | null;

        if (res.ok && json?.success && json.data?.access_token && parsed) {
          const d = json.data;
          const updated: Record<string, unknown> = {
            ...parsed,
            access_token: d.access_token,
            refresh_token: d.refresh_token || refreshToken,
            account_token: d.account_token || accountToken,
            tenant_slug: d.tenant?.slug || slug || parsed.tenant_slug,
            company_name: d.tenant?.name || parsed.company_name,
            industry: d.tenant?.industry || parsed.industry,
            admin_email: d.user?.email || parsed.admin_email,
            user_id: d.user?.id || parsed.user_id,
            user_name: d.user?.full_name || parsed.user_name,
            role: d.user?.role || parsed.role,
            ...(Array.isArray(d.workspaces) ? { workspaces: d.workspaces } : {}),
            ...(d.subscription ? { subscription: d.subscription } : {}),
          };
          localStorage.setItem(DOM_META_SESSION_STORAGE_KEY, JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('autodata-session-refreshed', { detail: updated }));
          return d.access_token || null;
        }
      }
    } catch {
      // Proceed to public fallback / session cleanup
    }

    // Session could not be refreshed -> clear stale localStorage session
    try {
      localStorage.removeItem(DOM_META_SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }

    // If visiting a public workspace slug (e.g. /ecolifesignature), seamlessly switch to public viewer token
    if (slug) {
      try {
        const pubRes = await fetch(
          resolveApiUrl(ctx, `/api/v1/public/dom-meta/${encodeURIComponent(slug)}/access`),
          { method: 'GET', headers: { Accept: 'application/json' } }
        );
        const pubJson = (await pubRes.json().catch(() => null)) as {
          success?: boolean;
          data?: DomMetaPublicAccessPayload;
        } | null;
        if (pubRes.ok && pubJson?.success && pubJson.data?.public_view && pubJson.data.access_token) {
          window.dispatchEvent(
            new CustomEvent('dom-meta-public-fallback', { detail: pubJson.data })
          );
          return pubJson.data.access_token;
        }
      } catch {
        // ignore
      }
    }

    window.dispatchEvent(new CustomEvent('autodata-session-expired'));
    return null;
  })().finally(() => {
    domMetaRefreshInFlight = null;
  });

  return domMetaRefreshInFlight;
}

async function fetchDomMetaAuthed(
  ctx: DomMetaAuthContext,
  path: string,
  init: RequestInit
): Promise<Response> {
  const url = resolveApiUrl(ctx, path);
  const res = await fetch(url, {
    ...init,
    headers: {
      ...buildAuthHeaders(ctx),
      ...((init.headers as Record<string, string>) || {}),
    },
  });
  if (res.status === 401 && ctx.accessToken) {
    // Distinguish upstream Meta OAuth 190 / Google Ads 401 from expired DOMATION Tenant JWT
    const peek = (await res
      .clone()
      .json()
      .catch(() => null)) as { error?: { code?: string } } | null;
    const errCode = String(peek?.error?.code || '');
    if (errCode.startsWith('DOM_META_GRAPH_') || errCode.startsWith('DOM_GOOGLE_ADS_')) {
      return res;
    }

    const recoveredToken = await tryRecoverDomMetaSession(ctx);
    if (recoveredToken) {
      ctx.accessToken = recoveredToken;
      return fetch(url, {
        ...init,
        headers: {
          ...buildAuthHeaders({ ...ctx, accessToken: recoveredToken }),
          ...((init.headers as Record<string, string>) || {}),
        },
      });
    }
  }
  return res;
}

export function getCachedPrimaryAdAccountId(tenantSlug?: string): string {
  if (typeof window === 'undefined') return '';
  const key = `dom_meta_primary_acc:${(tenantSlug || 'default').toLowerCase()}`;
  try {
    return sessionStorage.getItem(key) || localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

export function setCachedPrimaryAdAccountId(tenantSlug: string | undefined, accountId: string): void {
  if (typeof window === 'undefined') return;
  const clean = accountId.replace(/^act_/i, '').trim();
  if (!clean) return;
  const key = `dom_meta_primary_acc:${(tenantSlug || 'default').toLowerCase()}`;
  try {
    sessionStorage.setItem(key, clean);
    localStorage.setItem(key, clean);
  } catch {
    // ignore storage quota
  }
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
        activeColumns: ['status', 'spend', 'impressions', 'video_3s', 'hook_rate', 'thruplay', 'hold_rate', 'video_avg_time', 'ctr'],
      },
      {
        id: 'preset_deep_funnel',
        name: 'Phễu Hành Vi, LPV & Hội Thoại Sâu',
        activeColumns: ['status', 'spend', 'result', 'cpr', 'unique_clicks', 'outbound_click', 'lpv', 'lpv_rate', 'msg_depth_2', 'msg_depth_3'],
      },
    ],
    summary_metrics: ['reach', 'leads', 'impressions'],
    ai_reports: [],
    ai_config: {
      has_api_key: false,
      api_key_masked: '',
      model: 'gemini-2.5-flash',
      ai_lead_eval_enabled: true,
      ai_ads_eval_enabled: true,
      updated_at: null,
    },
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

  const res = await fetchDomMetaAuthed(ctx, '/api/v1/integrations/dom-meta/config', {
    method: 'GET',
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
  if (json.data.primary_ad_account_id) {
    setCachedPrimaryAdAccountId(ctx.tenantSlug, json.data.primary_ad_account_id);
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
      ai_config: patch.ai_config && curr.ai_config
        ? {
            ...curr.ai_config,
            ...(patch.ai_config.model ? { model: patch.ai_config.model } : {}),
            ...(patch.ai_config.ai_lead_eval_enabled !== undefined
              ? { ai_lead_eval_enabled: patch.ai_config.ai_lead_eval_enabled }
              : {}),
            ...(patch.ai_config.ai_ads_eval_enabled !== undefined
              ? { ai_ads_eval_enabled: patch.ai_config.ai_ads_eval_enabled }
              : {}),
          }
        : curr.ai_config,
      google_ads: patch.google_ads
        ? { ...curr.google_ads, ...patch.google_ads }
        : curr.google_ads,
    };
  }
  const res = await fetchDomMetaAuthed(ctx, '/api/v1/integrations/dom-meta/config', {
    method: 'PUT',
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
  if (json.data.primary_ad_account_id) {
    setCachedPrimaryAdAccountId(ctx.tenantSlug, json.data.primary_ad_account_id);
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
    const res = await fetchDomMetaAuthed(ctx, '/api/v1/integrations/meta-ads/discover', {
      method: 'POST',
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
  const res = await fetchDomMetaAuthed(ctx, '/api/v1/integrations/dom-meta/connect-batch', {
    method: 'POST',
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
  if (json.config.primary_ad_account_id) {
    setCachedPrimaryAdAccountId(ctx.tenantSlug, json.config.primary_ad_account_id);
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

  const res = await fetchDomMetaAuthed(ctx, '/api/v1/integrations/dom-meta/meta-proxy', {
    method: 'POST',
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

interface MetaBatchRequestSpec {
  key: string;
  graph_path: string;
  params?: Record<string, string | number | boolean | undefined>;
}

interface MetaBatchSlotPayload {
  data?: Array<Record<string, unknown>>;
  targeting?: DomMetaTargetingSpec;
  creative?: GraphAdRow['creative'];
  bid_strategy?: string;
  billing_event?: string;
  destination_type?: string;
  learning_stage_info?: { status?: string; conversions?: number };
  attribution_spec?: Array<{ event_type?: string; window_days?: number }>;
  account_id?: string;
  name?: string;
  currency?: string;
  balance?: string | number;
  amount_spent?: string | number;
  spend_cap?: string | number;
  account_status?: number;
  timezone_name?: string;
  business_name?: string;
  business_city?: string;
  business_country_code?: string;
  tax_id?: string;
  funding_source_details?: { display_string?: string };
}

async function callMetaGraphBatch(
  ctx: DomMetaAuthContext,
  adAccountId: string,
  requests: MetaBatchRequestSpec[],
  options?: { forceRefresh?: boolean }
): Promise<Record<string, MetaBatchSlotPayload | null | undefined>> {
  if (requests.length === 0) return {};

  if (ctx.directMetaToken) {
    const out: Record<string, MetaBatchSlotPayload | null | undefined> = {};
    const sliceSize = requests.length > 24 ? Math.min(45, Math.ceil(requests.length / 6)) : 4;
    const chunks: MetaBatchRequestSpec[][] = [];
    for (let i = 0; i < requests.length; i += sliceSize) {
      chunks.push(requests.slice(i, i + sliceSize));
    }
    await Promise.all(
      chunks.map(async (chunk) => {
        const form = new URLSearchParams();
        form.set('access_token', ctx.directMetaToken || '');
        form.set('include_headers', 'false');
        form.set(
          'batch',
          JSON.stringify(
            chunk.map((r) => {
              const sp = new URLSearchParams();
              for (const [k, v] of Object.entries(r.params || {})) {
                if (v !== undefined && v !== null) sp.set(k, String(v));
              }
              const cleanPath = r.graph_path.replace(/^\/+/, '');
              const qs = sp.toString();
              return {
                method: 'GET',
                relative_url: qs ? `${cleanPath}?${qs}` : cleanPath,
              };
            })
          )
        );
        const resp = await fetch('https://graph.facebook.com/v25.0/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form.toString(),
        });
        const raw = (await resp.json().catch(() => null)) as unknown;
        if (!resp.ok || !Array.isArray(raw)) {
          const errObj = raw as { error?: { message?: string } } | null;
          throw new Error(errObj?.error?.message || `Meta Batch HTTP ${resp.status}`);
        }
        chunk.forEach((reqItem, idx) => {
          const slot = raw[idx] as { code?: number; body?: string } | undefined;
          if (slot && Number(slot.code) >= 200 && Number(slot.code) < 300 && slot.body) {
            try {
              out[reqItem.key] = JSON.parse(slot.body) as MetaBatchSlotPayload;
            } catch {
              out[reqItem.key] = null;
            }
          }
        });
      })
    );
    return out;
  }

  const res = await fetchDomMetaAuthed(ctx, '/api/v1/integrations/dom-meta/meta-batch', {
    method: 'POST',
    body: JSON.stringify({
      ad_account_id: adAccountId,
      requests,
      force_refresh: Boolean(options?.forceRefresh),
    }),
  });

  if (res.status === 404) {
    // Graceful fallback if talking to an older backend node before restart
    const entries = await Promise.all(
      requests.map(async (r) => {
        try {
          const d = await callMetaGraph<MetaBatchSlotPayload>(
            ctx,
            adAccountId,
            r.graph_path,
            r.params || {}
          );
          return [r.key, d] as const;
        } catch {
          return [r.key, null] as const;
        }
      })
    );
    return Object.fromEntries(entries);
  }

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: Record<string, MetaBatchSlotPayload | null | undefined>;
    message?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json?.success || !json?.data) {
    throw new Error(json?.error?.message || json?.message || 'Lỗi truy vấn Meta Graph Batch API.');
  }
  return json.data;
}

const DATASET_MEM_TTL_MS = 180_000;
const datasetMemCache = new Map<string, { ts: number; dataset: DomMetaDashboardDataset }>();
const entityDetailMemCache = new Map<string, { ts: number; detail: DomMetaEntityDeepDetail }>();
const inFlightDatasets = new Map<string, Promise<DomMetaDashboardDataset>>();
const inFlightEntityDetails = new Map<string, Promise<DomMetaEntityDeepDetail>>();

const FULL_INSIGHT_FIELDS =
  'spend,impressions,reach,frequency,cpm,cpc,cpp,ctr,clicks,unique_clicks,unique_ctr,inline_link_clicks,inline_link_click_ctr,inline_post_engagement,outbound_clicks,unique_actions,actions,action_values,cost_per_action_type,purchase_roas,video_play_actions,video_avg_time_watched_actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions';

const FULL_AD_INSIGHT_FIELDS = `${FULL_INSIGHT_FIELDS},quality_ranking,engagement_rate_ranking,conversion_rate_ranking`;

const FAST_ENTITY_INSIGHT_FIELDS =
  'spend,impressions,reach,frequency,cpm,cpc,cpp,ctr,clicks,unique_clicks,unique_ctr,inline_link_clicks,inline_link_click_ctr,inline_post_engagement,outbound_clicks,actions,action_values,purchase_roas,video_play_actions,video_avg_time_watched_actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions';

const FAST_AD_INSIGHT_FIELDS = `${FAST_ENTITY_INSIGHT_FIELDS},quality_ranking,engagement_rate_ranking,conversion_rate_ranking`;

function formatCountryCodeLabel(rawCode: unknown): string {
  const code = String(rawCode || '').trim().toUpperCase();
  const map: Record<string, string> = {
    VN: 'Việt Nam (VN)',
    US: 'Hoa Kỳ (US)',
    JP: 'Nhật Bản (JP)',
    KR: 'Hàn Quốc (KR)',
    SG: 'Singapore (SG)',
    TW: 'Đài Loan (TW)',
    AU: 'Úc (AU)',
    CA: 'Canada (CA)',
    GB: 'Vương quốc Anh (GB)',
    DE: 'Đức (DE)',
    FR: 'Pháp (FR)',
    TH: 'Thái Lan (TH)',
    MY: 'Malaysia (MY)',
    PH: 'Philippines (PH)',
    ID: 'Indonesia (ID)',
    KH: 'Campuchia (KH)',
    LA: 'Lào (LA)',
    CN: 'Trung Quốc (CN)',
    HK: 'Hồng Kông (HK)',
  };
  if (map[code]) return map[code];
  return code || 'Khác';
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

function formatMetaPublisherLabel(raw: unknown): string {
  const key = String(raw || 'other').trim().toLowerCase();
  if (key === 'facebook') return 'Facebook';
  if (key === 'instagram') return 'Instagram';
  if (key === 'messenger') return 'Messenger';
  if (key === 'audience_network') return 'Audience Network';
  if (key === 'threads') return 'Threads';
  if (key === 'whatsapp') return 'WhatsApp';
  if (!key || key === 'other' || key === 'unknown') return 'Other Platform';
  return key
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

function formatMetaPositionLabel(rawPos: unknown, rawPlat?: unknown): string {
  let pos = String(rawPos || 'feed').trim().toLowerCase();
  const plat = String(rawPlat || '').trim().toLowerCase();
  if (plat && pos.startsWith(`${plat}_`)) {
    pos = pos.slice(plat.length + 1);
  }
  if (pos.startsWith('an_')) {
    pos = pos.slice(3);
  }
  const knownMap: Record<string, string> = {
    feed: 'Feed',
    stories: 'Stories',
    reels: 'Reels',
     reels_overlay: 'Reels Overlay',
    instream_video: 'In-Stream Video',
    video_feeds: 'Video Feeds',
    right_hand_column: 'Right Column',
    marketplace: 'Marketplace',
    search: 'Search Results',
    profile_feed: 'Profile Feed',
    profile_reels: 'Profile Reels',
    explore: 'Explore',
    explore_home: 'Explore Home',
    classic: 'Classic',
    rewarded_video: 'Rewarded Video',
    messenger_home: 'Inbox',
    inbox: 'Inbox',
    sponsored_messages: 'Sponsored Messages',
    instant_articles: 'Instant Articles',
    facebook_reels: 'Reels',
    facebook_reels_overlay: 'Reels Overlay',
    facebook_stories: 'Stories',
    instagram_stories: 'Stories',
    instagram_reels: 'Reels',
    instagram_explore: 'Explore',
    instagram_profile_feed: 'Profile Feed',
    threads_stream: 'Threads Feed',
  };
  if (knownMap[pos]) return knownMap[pos];
  return pos
    .split('_')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function formatMetaDeviceLabel(raw: unknown): string {
  const key = String(raw || '').trim().toLowerCase();
  const map: Record<string, string> = {
    iphone: 'iPhone',
    ipad: 'iPad',
    ipod: 'iPod',
    android_smartphone: 'Android Smartphone',
    android_tablet: 'Android Tablet',
    desktop: 'Desktop',
    mobile_app: 'Mobile App',
    mobile_web: 'Mobile Web',
    connected_tv: 'Connected TV',
    other: 'Other Device',
    uncategorized: 'Other Device',
  };
  if (map[key]) return map[key];
  if (!key) return 'Mobile App';
  return key
    .split('_')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function extractEntityResultByGoal(
  actions: DomMetaActionMap,
  goal: string,
  reach: number,
  impressions: number,
  thruplay: number,
  linkClick: number,
  video3s = 0
): number {
  const g = String(goal || '').trim().toUpperCase();
  const leads = pickActionVal(actions, [
    'lead',
    'onsite_conversion.lead_grouped',
    'offsite_conversion.fb_pixel_lead',
    'onsite_web_lead',
    'offsite_complete_registration_add_meta_leads',
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
    'onsite_web_purchase',
  ]);
  const postEng = pickActionVal(actions, ['post_engagement', 'page_engagement']);
  const landingPageView = pickActionVal(actions, ['landing_page_view']);
  const likes = pickActionVal(actions, [
    'page_like',
    'like',
    'page_follow',
    'follow',
    'instagram_profile_follow',
  ]);

  // Account-level breakdowns with no specific campaign goal: count real conversions only
  if (!g) {
    return leads || messages || purchases;
  }

  if (g.includes('REACH') || g.includes('AWARENESS') || g.includes('AD_RECALL')) return reach;
  if (g.includes('IMPRESSION')) return impressions;
  if (g.includes('POST ENGAGEMENT') || g.includes('POST_ENGAGEMENT') || g === 'ENGAGEMENT') {
    return postEng;
  }
  if (g.includes('MESSAGING') || g.includes('CONVERSATION') || g.includes('REPLIES')) {
    return messages;
  }
  if (g.includes('LEAD')) {
    return leads;
  }
  if (g.includes('PURCHASE') || g.includes('SALES') || g.includes('VALUE')) {
    return purchases;
  }
  if (g.includes('OFFSITE_CONVERSIONS') || g.includes('CONVERSIONS')) {
    return purchases || leads;
  }
  if (g.includes('VIDEO') || g.includes('THRUPLAY')) {
    return thruplay || video3s;
  }
  if (g.includes('LANDING')) {
    return landingPageView || linkClick;
  }
  if (g.includes('TRAFFIC') || g.includes('LINK')) {
    return linkClick;
  }
  if (g.includes('LIKE') || g.includes('FOLLOW')) {
    return likes;
  }
  return leads || messages || purchases;
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
  const unique_clicks = Number(row?.unique_clicks || 0);
  const actions = toActionsMap(row?.actions);
  const unique_actions = toActionsMap(row?.unique_actions);
  const cost_per_action = toActionsMap(row?.cost_per_action_type);
  const actionValues = toActionsMap(row?.action_values);
  const outboundMap = toActionsMap(row?.outbound_clicks);
  const roasMap = toActionsMap(row?.purchase_roas);
  const videoPlayMap = toActionsMap(row?.video_play_actions);
  const videoAvgTimeMap = toActionsMap(row?.video_avg_time_watched_actions);
  const thruplayMap = toActionsMap(row?.video_thruplay_watched_actions);
  const p25Map = toActionsMap(row?.video_p25_watched_actions);
  const p50Map = toActionsMap(row?.video_p50_watched_actions);
  const p75Map = toActionsMap(row?.video_p75_watched_actions);
  const p95Map = toActionsMap(row?.video_p95_watched_actions);
  const p100Map = toActionsMap(row?.video_p100_watched_actions);

  const outbound_click =
    pickActionVal(outboundMap, ['outbound_click']) || pickActionVal(actions, ['outbound_click']);
  const link_click =
    Number(row?.inline_link_clicks || 0) ||
    pickActionVal(actions, ['link_click']) ||
    outbound_click;
  const lpv = pickActionVal(actions, ['landing_page_view', 'omni_landing_page_view']);
  const lpv_rate = link_click > 0 && lpv > 0 ? Math.min(100, (lpv / link_click) * 100) : 0;
  const cost_per_lpv = lpv > 0 ? spend / lpv : 0;

  const leads = pickActionVal(actions, [
    'lead',
    'onsite_conversion.lead_grouped',
    'offsite_conversion.fb_pixel_lead',
    'onsite_web_lead',
    'offsite_complete_registration_add_meta_leads',
  ]);
  const messages = pickActionVal(actions, [
    'onsite_conversion.messaging_conversation_started_7d',
    'messaging_conversation_started_7d',
    'onsite_conversion.total_messaging_connection',
  ]);
  const message_connection = pickActionVal(actions, [
    'onsite_conversion.total_messaging_connection',
    'total_messaging_connection',
  ]);
  const msg_reply = pickActionVal(actions, [
    'onsite_conversion.messaging_first_reply',
    'messaging_first_reply',
  ]);
  const msg_depth_2 = pickActionVal(actions, [
    'onsite_conversion.messaging_user_depth_2_message_send',
    'messaging_user_depth_2_message_send',
  ]);
  const msg_depth_3 = pickActionVal(actions, [
    'onsite_conversion.messaging_user_depth_3_message_send',
    'messaging_user_depth_3_message_send',
  ]);
  const view_content = pickActionVal(actions, [
    'omni_view_content',
    'view_content',
    'offsite_conversion.fb_pixel_view_content',
    'onsite_web_view_content',
  ]);
  const add_to_cart = pickActionVal(actions, [
    'omni_add_to_cart',
    'add_to_cart',
    'offsite_conversion.fb_pixel_add_to_cart',
    'onsite_web_add_to_cart',
  ]);
  const initiate_checkout = pickActionVal(actions, [
    'omni_initiated_checkout',
    'initiate_checkout',
    'offsite_conversion.fb_pixel_initiate_checkout',
    'onsite_web_initiate_checkout',
  ]);
  const purchases = pickActionVal(actions, [
    'purchase',
    'omni_purchase',
    'onsite_conversion.purchase',
    'offsite_conversion.fb_pixel_purchase',
    'onsite_web_purchase',
  ]);
  const photo_view = pickActionVal(actions, ['photo_view']);
  const post_save = pickActionVal(actions, ['onsite_conversion.post_save', 'post_save']);
  const purchase_value = pickActionVal(actionValues, [
    'omni_purchase',
    'purchase',
    'onsite_conversion.purchase',
    'offsite_conversion.fb_pixel_purchase',
  ]);
  const aov = purchases > 0 && purchase_value > 0 ? purchase_value / purchases : 0;
  const directRoas = pickActionVal(roasMap, [
    'omni_purchase',
    'purchase',
    'omni_purchase_roas',
    'purchase_roas',
  ]);
  const roas = directRoas > 0 ? directRoas : spend > 0 && purchase_value > 0 ? purchase_value / spend : 0;

  const rawVideoPlay = pickActionVal(videoPlayMap, ['video_view']);
  const rawActionView = pickActionVal(actions, ['video_view']);
  const video_avg_time = pickActionVal(videoAvgTimeMap, ['video_view']);
  const thruplay =
    pickActionVal(thruplayMap, ['video_view']) ||
    pickActionVal(actions, ['video_thruplay_watched_actions']);
  const video_p25 = pickActionVal(p25Map, ['video_view']);
  const video_p50 = pickActionVal(p50Map, ['video_view']);
  const video_p75 = pickActionVal(p75Map, ['video_view']);
  const video_p95 = pickActionVal(p95Map, ['video_view']);
  const video_p100 = pickActionVal(p100Map, ['video_view']);
  const video_play = Math.max(rawVideoPlay, rawActionView);
  const completion_rate =
    video_play > 0 && video_p100 > 0 ? Math.min(100, (video_p100 / video_play) * 100) : 0;
  const hasRealVideoSignals =
    rawActionView > 0 || video_p25 > 0 || video_p50 > 0 || thruplay > 0;
  const video_3s = hasRealVideoSignals
    ? Math.max(rawActionView, video_p25, video_p50, thruplay)
    : 0;
  const post_engagement =
    Number(row?.inline_post_engagement || 0) ||
    pickActionVal(actions, ['post_engagement', 'page_engagement']);
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

  const goal = optimizationGoal ? resolveGoalLabel(optimizationGoal) : '';
  const result = extractEntityResultByGoal(
    actions,
    goal,
    reach,
    impressions,
    thruplay,
    link_click,
    video_3s
  );
  const resolvedGoal = goal || 'QUALITY LEAD';
  const isPerThousand = resolvedGoal === 'REACH' || resolvedGoal === 'IMPRESSIONS';
  const cpr = result > 0 ? (isPerThousand ? (spend / result) * 1000 : spend / result) : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const cpp = Number(row?.cpp || 0) || (reach > 0 ? (spend / reach) * 1000 : 0);
  const cpc = clicks > 0 ? spend / clicks : 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const unique_ctr =
    Number(row?.unique_ctr || 0) ||
    (reach > 0 && unique_clicks > 0 ? (unique_clicks / reach) * 100 : 0);
  const frequency = reach > 0 ? impressions / reach : 0;
  const hook_rate = impressions > 0 ? (video_3s / impressions) * 100 : 0;
  const hold_rate = video_3s > 0 ? Math.min(100, (thruplay / video_3s) * 100) : 0;

  return {
    spend,
    impressions,
    reach,
    clicks,
    unique_clicks,
    link_click,
    outbound_click,
    lpv,
    lpv_rate,
    cost_per_lpv,
    leads,
    messages,
    message_connection,
    msg_reply,
    msg_depth_2,
    msg_depth_3,
    view_content,
    add_to_cart,
    initiate_checkout,
    purchases,
    purchase_value,
    aov,
    roas,
    video_play,
    video_3s,
    video_avg_time,
    video_p25,
    video_p50,
    video_p75,
    video_p95,
    video_p100,
    completion_rate,
    thruplay,
    post_engagement,
    reaction,
    comments,
    shares,
    post_save,
    photo_view,
    follows,
    result,
    cpr,
    cpm,
    cpp,
    cpc,
    ctr,
    unique_ctr,
    frequency,
    hook_rate,
    hold_rate,
    quality_ranking: row?.quality_ranking ? String(row.quality_ranking) : undefined,
    engagement_rate_ranking: row?.engagement_rate_ranking
      ? String(row.engagement_rate_ranking)
      : undefined,
    conversion_rate_ranking: row?.conversion_rate_ranking
      ? String(row.conversion_rate_ranking)
      : undefined,
    actions,
    unique_actions,
    cost_per_action,
    action_values: actionValues,
    optimization_goal: resolvedGoal,
  };
}

export async function loadFullDomMetaDataset(
  ctx: DomMetaAuthContext,
  adAccountId: string,
  range: { since: string; until: string; prevSince: string; prevUntil: string },
  selectedYear = new Date().getFullYear(),
  options?: { forceRefresh?: boolean }
): Promise<DomMetaDashboardDataset> {
  if (ctx.previewDataset && !ctx.directMetaToken && !ctx.accessToken) {
    return ctx.previewDataset;
  }
  const cleanAcc = adAccountId.replace(/^act_/i, '').trim();
  const memKey = `${ctx.tenantSlug || 'local'}:${cleanAcc}:${range.since}:${range.until}:${selectedYear}`;
  if (!options?.forceRefresh) {
    const cached = datasetMemCache.get(memKey);
    if (cached && Date.now() - cached.ts < DATASET_MEM_TTL_MS) {
      return cached.dataset;
    }
    const inflight = inFlightDatasets.get(memKey);
    if (inflight) {
      return inflight;
    }
  }

  const loadPromise = (async (): Promise<DomMetaDashboardDataset> => {
  const actPath = `act_${cleanAcc}`;
  const timeRangeJson = JSON.stringify({ since: range.since, until: range.until });
  const prevRangeJson = JSON.stringify({ since: range.prevSince, until: range.prevUntil });
  const yearRangeJson = JSON.stringify({
    since: `${selectedYear}-01-01`,
    until: `${selectedYear}-12-31`,
  });

  const insightFields = FULL_INSIGHT_FIELDS;
  const entityInsightFields = FAST_ENTITY_INSIGHT_FIELDS;
  const adInsightFields = FAST_AD_INSIGHT_FIELDS;
  const spendFilterJson = JSON.stringify([
    { field: 'spend', operator: 'GREATER_THAN', value: 0 },
  ]);

  // Fire slow account activity audit log concurrently without letting it block Dashboard / Campaign Tree!
  const activitiesReqPromise = callMetaGraph<GraphListResponse<GraphActivityRow>>(
    ctx,
    cleanAcc,
    `${actPath}/activities`,
    {
      fields: 'event_time,event_type,translated_event_type,actor_name,object_name,extra_data',
      limit: 30,
    }
  ).catch(() => null);

  const batchMap = await callMetaGraphBatch(
    ctx,
    cleanAcc,
    [
      {
        key: 'currSummary',
        graph_path: `${actPath}/insights`,
        params: { fields: insightFields, time_range: timeRangeJson },
      },
      {
        key: 'prevSummary',
        graph_path: `${actPath}/insights`,
        params: { fields: insightFields, time_range: prevRangeJson },
      },
      {
        key: 'daily',
        graph_path: `${actPath}/insights`,
        params: {
          fields: 'date_start,spend,impressions,reach,clicks,inline_link_clicks,actions',
          time_increment: 1,
          limit: 120,
          time_range: timeRangeJson,
        },
      },
      {
        key: 'campList',
        graph_path: `${actPath}/campaigns`,
        params: {
          fields:
            'id,name,status,effective_status,objective,buying_type,bid_strategy,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time',
          limit: 300,
        },
      },
      {
        key: 'campIns',
        graph_path: `${actPath}/insights`,
        params: {
          level: 'campaign',
          fields: `campaign_id,campaign_name,objective,${entityInsightFields}`,
          filtering: spendFilterJson,
          limit: 300,
          time_range: timeRangeJson,
        },
      },
      {
        key: 'adsetList',
        graph_path: `${actPath}/adsets`,
        params: {
          fields:
            'id,name,campaign_id,status,effective_status,optimization_goal,bid_strategy,billing_event,destination_type,learning_stage_info,daily_budget,lifetime_budget,budget_remaining,start_time,end_time,targeting',
          limit: 500,
        },
      },
      {
        key: 'adsetIns',
        graph_path: `${actPath}/insights`,
        params: {
          level: 'adset',
          fields: `adset_id,adset_name,campaign_id,campaign_name,optimization_goal,${entityInsightFields}`,
          filtering: spendFilterJson,
          limit: 500,
          time_range: timeRangeJson,
        },
      },
      {
        key: 'adList',
        graph_path: `${actPath}/ads`,
        params: {
          fields:
            'id,name,adset_id,campaign_id,status,effective_status,creative.thumbnail_width(720).thumbnail_height(720){id,title,body,call_to_action_type,link_url,instagram_permalink_url,thumbnail_url,image_url,effective_object_story_id}',
          limit: 250,
        },
      },
      {
        key: 'adIns',
        graph_path: `${actPath}/insights`,
        params: {
          level: 'ad',
          fields: `ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,optimization_goal,${adInsightFields}`,
          filtering: spendFilterJson,
          limit: 500,
          time_range: timeRangeJson,
        },
      },
      {
        key: 'platPos',
        graph_path: `${actPath}/insights`,
        params: {
          fields: 'spend,impressions,reach,clicks,actions',
          breakdowns: 'publisher_platform,platform_position',
          limit: 200,
          time_range: timeRangeJson,
        },
      },
      {
        key: 'platDevice',
        graph_path: `${actPath}/insights`,
        params: {
          fields: 'spend,impressions,reach,clicks,actions',
          breakdowns: 'publisher_platform,device_platform',
          limit: 100,
          time_range: timeRangeJson,
        },
      },
      {
        key: 'ageGender',
        graph_path: `${actPath}/insights`,
        params: {
          fields: 'spend,impressions,reach,clicks,actions',
          breakdowns: 'age,gender',
          limit: 200,
          time_range: timeRangeJson,
        },
      },
      {
        key: 'region',
        graph_path: `${actPath}/insights`,
        params: {
          fields: 'spend,impressions,reach,clicks,actions',
          breakdowns: 'region',
          limit: 200,
          time_range: timeRangeJson,
        },
      },
      {
        key: 'country',
        graph_path: `${actPath}/insights`,
        params: {
          fields: 'spend,impressions,reach,clicks,actions',
          breakdowns: 'country',
          limit: 100,
          time_range: timeRangeJson,
        },
      },
      {
        key: 'device',
        graph_path: `${actPath}/insights`,
        params: {
          fields: 'spend,impressions,reach,clicks,actions',
          breakdowns: 'impression_device',
          limit: 50,
          time_range: timeRangeJson,
        },
      },
      {
        key: 'hourly',
        graph_path: `${actPath}/insights`,
        params: {
          fields: 'date_start,spend,impressions,clicks,actions',
          breakdowns: 'hourly_stats_aggregated_by_advertiser_time_zone',
          time_increment: 1,
          limit: 1000,
          time_range: timeRangeJson,
        },
      },
      {
        key: 'hourlyAudience',
        graph_path: `${actPath}/insights`,
        params: {
          fields: 'spend,impressions,clicks,actions',
          breakdowns: 'hourly_stats_aggregated_by_audience_time_zone',
          limit: 100,
          time_range: timeRangeJson,
        },
      },
      {
        key: 'accInfo',
        graph_path: actPath,
        params: {
          fields:
            'account_id,name,currency,balance,amount_spent,spend_cap,account_status,timezone_name,business_name,business_city,business_country_code,tax_id,funding_source_details',
        },
      },
      {
        key: 'yearMonthly',
        graph_path: `${actPath}/insights`,
        params: {
          fields: 'date_start,spend,reach,actions',
          time_increment: 'monthly',
          limit: 24,
          time_range: yearRangeJson,
        },
      },
    ],
    options
  );

  // Give activities at most 300ms grace if already cached, otherwise let Dashboard paint immediately!
  const fastActivitiesRes = await Promise.race([
    activitiesReqPromise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 300)),
  ]);

  const currSummaryRes = (batchMap.currSummary || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const prevSummaryRes = (batchMap.prevSummary || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const dailyRes = (batchMap.daily || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const campListRes = (batchMap.campList || { data: [] }) as unknown as GraphListResponse<GraphCampaignRow>;
  const campInsRes = (batchMap.campIns || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const adsetListRes = (batchMap.adsetList || { data: [] }) as unknown as GraphListResponse<GraphAdsetRow>;
  const adsetInsRes = (batchMap.adsetIns || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const adListRes = (batchMap.adList || { data: [] }) as unknown as GraphListResponse<GraphAdRow>;
  const adInsRes = (batchMap.adIns || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const platPosRes = (batchMap.platPos || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const platDeviceRes = (batchMap.platDevice || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const ageGenderRes = (batchMap.ageGender || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const regionRes = (batchMap.region || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const countryRes = (batchMap.country || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const deviceRes = (batchMap.device || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const hourlyRes = (batchMap.hourly || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const hourlyAudRes = (batchMap.hourlyAudience || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const accInfoRes = (batchMap.accInfo || null) as unknown as GraphAccountInfoResponse | null;
  const yearMonthlyRes = (batchMap.yearMonthly || { data: [] }) as unknown as GraphListResponse<GraphInsightRow>;
  const activitiesRes = (fastActivitiesRes || { data: [] }) as GraphListResponse<GraphActivityRow>;

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
        result: m.result,
        cpr: m.cpr,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build hierarchical Campaign -> Adset -> Ad tree (ONLY entities with spend > 0 in selected range, matching DOMATION_META)
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

  // Micro-batch backfill for any spending ad whose metadata wasn't in the first 500 ads page
  const missingSpendingAdIds: string[] = [];
  for (const ins of Array.isArray(adInsRes?.data) ? adInsRes.data : []) {
    const aid = String(ins.ad_id || '').trim();
    if (aid && Number(ins.spend || 0) > 0 && !adMetaMap.has(aid) && missingSpendingAdIds.length < 45) {
      missingSpendingAdIds.push(aid);
    }
  }
  if (missingSpendingAdIds.length > 0) {
    try {
      const backfill = await callMetaGraphBatch(
        ctx,
        cleanAcc,
        missingSpendingAdIds.map((aid) => ({
        key: `ad_${aid}`,
        graph_path: aid,
        params: {
          fields:
            'id,name,adset_id,campaign_id,status,effective_status,creative.thumbnail_width(720).thumbnail_height(720){id,title,body,call_to_action_type,link_url,instagram_permalink_url,thumbnail_url,image_url,effective_object_story_id}',
        },
      }))
    );
    for (const aid of missingSpendingAdIds) {
      const item = backfill[`ad_${aid}`] as unknown as GraphAdRow | null | undefined;
      if (item && item.id) {
        adMetaMap.set(String(item.id), item);
      }
    }
  } catch {
    // Non-fatal: continue with insights metadata
  }
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
    if (!adId || seenAdIds.has(adId)) continue;
    const meta = adMetaMap.get(adId) || {};
    const parentAdsetMeta = adsetMetaMap.get(String(ins.adset_id || meta.adset_id || '')) || {};
    const goalRaw = ins.optimization_goal || parentAdsetMeta.optimization_goal || '';
    const m = parseInsightMetrics(ins, goalRaw);
    if (m.spend <= 0) continue;
    seenAdIds.add(adId);
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
      image_url: normImage || normThumb,
      post_url: postUrl,
      story_id: storyId,
      creative_title: meta.creative?.title ? String(meta.creative.title) : undefined,
      creative_body: meta.creative?.body ? String(meta.creative.body) : undefined,
      cta_type: meta.creative?.call_to_action_type
        ? String(meta.creative.call_to_action_type)
        : undefined,
      link_url: meta.creative?.link_url ? String(meta.creative.link_url) : undefined,
      instagram_permalink_url: meta.creative?.instagram_permalink_url
        ? String(meta.creative.instagram_permalink_url)
        : undefined,
      ...m,
    };
    const arr = adsByAdset.get(node.adset_id) || [];
    arr.push(node);
    adsByAdset.set(node.adset_id, arr);
  }

  const adsetsByCampaign = new Map<string, DomMetaAdsetNode[]>();
  const seenAdsetIds = new Set<string>();

  for (const ins of Array.isArray(adsetInsRes?.data) ? adsetInsRes.data : []) {
    const adsetId = String(ins.adset_id || '');
    if (!adsetId || seenAdsetIds.has(adsetId)) continue;
    const meta = adsetMetaMap.get(adsetId) || {};
    const goalRaw = ins.optimization_goal || meta.optimization_goal || '';
    const m = parseInsightMetrics(ins, goalRaw);
    if (m.spend <= 0) continue;
    seenAdsetIds.add(adsetId);
    const childAds = (adsByAdset.get(adsetId) || []).sort((a, b) => b.spend - a.spend);
    const node: DomMetaAdsetNode = {
      id: adsetId,
      name: String(ins.adset_name || meta.name || `Adset #${adsetId}`),
      campaign_id: String(ins.campaign_id || meta.campaign_id || ''),
      campaign_name: String(ins.campaign_name || ''),
      status: String(meta.status || 'ACTIVE'),
      effective_status: String(meta.effective_status || meta.status || 'ACTIVE'),
      bid_strategy: meta.bid_strategy ? String(meta.bid_strategy) : undefined,
      billing_event: meta.billing_event ? String(meta.billing_event) : undefined,
      destination_type: meta.destination_type ? String(meta.destination_type) : undefined,
      learning_stage_status: meta.learning_stage_info?.status
        ? String(meta.learning_stage_info.status)
        : undefined,
      daily_budget: normalizeMetaBudget(meta.daily_budget, resolvedCurrency),
      lifetime_budget: normalizeMetaBudget(meta.lifetime_budget, resolvedCurrency),
      budget_remaining: normalizeMetaBudget(meta.budget_remaining, resolvedCurrency),
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

  // Fallback only for adsets that have spending childAds if adsetIns omitted them
  for (const [adsetId, childAds] of adsByAdset.entries()) {
    if (seenAdsetIds.has(adsetId) || childAds.length === 0) continue;
    const meta = adsetMetaMap.get(adsetId) || {};
    const sortedAds = [...childAds].sort((a, b) => b.spend - a.spend);
    const m = rollupMetricsFromChildren(sortedAds, meta.optimization_goal || sortedAds[0]?.optimization_goal || '');
    if (m.spend <= 0) continue;
    seenAdsetIds.add(adsetId);
    const campId = String(meta.campaign_id || sortedAds[0]?.campaign_id || '');
    const eff = String(meta.effective_status || meta.status || 'PAUSED').toUpperCase();
    const node: DomMetaAdsetNode = {
      id: adsetId,
      name: String(meta.name || sortedAds[0]?.adset_name || `Adset #${adsetId}`),
      campaign_id: campId,
      campaign_name: sortedAds[0]?.campaign_name || '',
      status: String(meta.status || 'PAUSED'),
      effective_status: eff || 'PAUSED',
      daily_budget: normalizeMetaBudget(meta.daily_budget, resolvedCurrency),
      lifetime_budget: normalizeMetaBudget(meta.lifetime_budget, resolvedCurrency),
      start_time: meta.start_time,
      end_time: meta.end_time,
      targeting: meta.targeting || null,
      ...m,
      ads: sortedAds,
    };
    const arr = adsetsByCampaign.get(campId) || [];
    arr.push(node);
    adsetsByCampaign.set(campId, arr);
  }

  const campaigns: DomMetaCampaignNode[] = [];
  const seenCampIds = new Set<string>();

  for (const ins of Array.isArray(campInsRes?.data) ? campInsRes.data : []) {
    const campId = String(ins.campaign_id || '');
    if (!campId || seenCampIds.has(campId)) continue;
    const meta = campMetaMap.get(campId) || {};
    const childAdsets = (adsetsByCampaign.get(campId) || []).sort((a, b) => b.spend - a.spend);
    const dominantGoal =
      childAdsets[0]?.optimization_goal || resolveGoalLabel('', ins.objective || meta.objective);
    const m = parseInsightMetrics(ins, dominantGoal);
    if (m.spend <= 0) continue;
    seenCampIds.add(campId);
    campaigns.push({
      id: campId,
      name: String(ins.campaign_name || meta.name || `Campaign #${campId}`),
      status: String(meta.status || 'ACTIVE'),
      effective_status: String(meta.effective_status || meta.status || 'ACTIVE'),
      objective: String(ins.objective || meta.objective || ''),
      buying_type: meta.buying_type ? String(meta.buying_type) : undefined,
      bid_strategy: meta.bid_strategy ? String(meta.bid_strategy) : undefined,
      daily_budget: normalizeMetaBudget(meta.daily_budget, resolvedCurrency),
      lifetime_budget: normalizeMetaBudget(meta.lifetime_budget, resolvedCurrency),
      budget_remaining: normalizeMetaBudget(meta.budget_remaining, resolvedCurrency),
      start_time: meta.start_time,
      stop_time: meta.stop_time,
      ...m,
      optimization_goal: dominantGoal,
      adsets: childAdsets,
    });
  }

  // Fallback only for campaigns that have spending childAdsets if campIns omitted them
  for (const [campId, childAdsetsRaw] of adsetsByCampaign.entries()) {
    if (seenCampIds.has(campId) || childAdsetsRaw.length === 0) continue;
    const childAdsets = [...childAdsetsRaw].sort((a, b) => b.spend - a.spend);
    const meta = campMetaMap.get(campId) || {};
    const dominantGoal =
      childAdsets[0]?.optimization_goal || resolveGoalLabel('', meta.objective || '');
    const m = rollupMetricsFromChildren(childAdsets, dominantGoal);
    if (m.spend <= 0) continue;
    seenCampIds.add(campId);
    const eff = String(meta.effective_status || meta.status || 'PAUSED').toUpperCase();
    campaigns.push({
      id: campId,
      name: String(meta.name || childAdsets[0]?.campaign_name || `Campaign #${campId}`),
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
    const platKey = formatMetaPublisherLabel(rawPlat);
    const m = parseInsightMetrics(r);
    const prev = platTotals.get(platKey) || {
      platform: platKey,
      rawPlatform: rawPlat,
      spend: 0,
      impressions: 0,
      reach: 0,
      clicks: 0,
      result: 0,
    };
    prev.spend += m.spend;
    prev.impressions += m.impressions;
    prev.reach += m.reach;
    prev.clicks = (prev.clicks || 0) + m.clicks;
    prev.result += m.result;
    platTotals.set(platKey, prev);

    const rawPos = String(r.platform_position || 'feed');
    const cleanPos = formatMetaPositionLabel(rawPos, rawPlat);
    positions.push({
      platform: platKey,
      position: cleanPos,
      label: `${platKey} · ${cleanPos}`,
      rawPlatform: rawPlat,
      rawPosition: rawPos,
      spend: m.spend,
      impressions: m.impressions,
      clicks: m.clicks,
      result: m.result,
      cpr: m.result > 0 ? m.spend / m.result : 0,
      ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
    });
  }
  positions.sort((a, b) => b.spend - a.spend);

  // Platform × Device breakdown (e.g. Facebook · Mobile App, Instagram · Mobile App, Facebook · Desktop)
  const platformDevices: DomMetaPositionSlice[] = (
    Array.isArray(platDeviceRes?.data) ? platDeviceRes.data : []
  )
    .map((r) => {
      const rawPlat = String(r.publisher_platform || 'other').toLowerCase();
      const platKey = formatMetaPublisherLabel(rawPlat);
      const rawDev = String(r.device_platform || 'mobile_app').toLowerCase();
      const cleanDev = formatMetaDeviceLabel(rawDev);
      const m = parseInsightMetrics(r);
      return {
        platform: platKey,
        position: cleanDev,
        label: `${platKey} · ${cleanDev}`,
        rawPlatform: rawPlat,
        rawPosition: rawDev,
        spend: m.spend,
        impressions: m.impressions,
        clicks: m.clicks,
        result: m.result,
        cpr: m.result > 0 ? m.spend / m.result : 0,
        ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
      };
    })
    .filter((x) => x.spend > 0 || x.impressions > 0)
    .sort((a, b) => b.spend - a.spend);

  const basePlatformKeys = ['Facebook', 'Instagram'];
  for (const extraKey of ['Messenger', 'Audience Network', 'Threads', 'WhatsApp', 'Other Platform']) {
    if ((platTotals.get(extraKey)?.spend || 0) > 0 && !basePlatformKeys.includes(extraKey)) {
      basePlatformKeys.push(extraKey);
    }
  }
  if (basePlatformKeys.length < 3) {
    basePlatformKeys.push('Audience Network');
  }
  const platforms: DomMetaPlatformSlice[] = basePlatformKeys.map((k) => {
    const p = platTotals.get(k);
    if (!p) {
      return {
        platform: k,
        spend: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        ctr: 0,
        result: 0,
        cpr: 0,
      };
    }
    return {
      ...p,
      ctr: p.impressions > 0 ? ((p.clicks || 0) / p.impressions) * 100 : 0,
      cpr: p.result > 0 ? p.spend / p.result : 0,
    };
  });

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
        unknownResult: 0,
        totalResult: 0,
        reach: 0,
        clicks: 0,
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
      bucket.unknownResult = (bucket.unknownResult || 0) + m.result;
    }
    bucket.totalSpend += m.spend;
    bucket.totalResult = (bucket.totalResult || 0) + m.result;
    bucket.reach = (bucket.reach || 0) + m.reach;
    bucket.clicks = (bucket.clicks || 0) + m.clicks;
  }
  const ageGender = ageBrackets.map((a) => ageMap.get(a)!);

  // Region breakdown (preserve ALL regions sorted by spend so UI can search/expand all provinces)
  const regions: DomMetaRegionRow[] = (Array.isArray(regionRes?.data) ? regionRes.data : [])
    .map((r) => {
      const m = parseInsightMetrics(r);
      return {
        region: String(r.region || 'Khác'),
        spend: m.spend,
        impressions: m.impressions,
        reach: m.reach,
        clicks: m.clicks,
        ctr: m.ctr,
        result: m.result,
        cpr: m.result > 0 ? m.spend / m.result : 0,
      };
    })
    .filter((r) => r.spend > 0 || r.impressions > 0 || r.result > 0)
    .sort((a, b) => b.spend - a.spend);

  // Country breakdown
  const countries: DomMetaRegionRow[] = (Array.isArray(countryRes?.data) ? countryRes.data : [])
    .map((r) => {
      const m = parseInsightMetrics(r);
      const rawCountry = String(r.country || '');
      return {
        region: formatCountryCodeLabel(rawCountry),
        country: rawCountry.toUpperCase(),
        spend: m.spend,
        impressions: m.impressions,
        reach: m.reach,
        clicks: m.clicks,
        ctr: m.ctr,
        result: m.result,
        cpr: m.result > 0 ? m.spend / m.result : 0,
      };
    })
    .filter((r) => r.spend > 0 || r.impressions > 0 || r.result > 0)
    .sort((a, b) => b.spend - a.spend);

  // Device breakdown (impression_device: iPhone, Android Smartphone, Desktop, iPad, etc.)
  const deviceMap = new Map<string, DomMetaDeviceRow>();
  for (const r of Array.isArray(deviceRes?.data) ? deviceRes.data : []) {
    const rawDev = String(r.impression_device || r.device_platform || 'mobile_app');
    const cleanDev = formatMetaDeviceLabel(rawDev);
    const m = parseInsightMetrics(r);
    const prev = deviceMap.get(cleanDev) || {
      device: cleanDev,
      rawDevice: rawDev.toLowerCase(),
      spend: 0,
      impressions: 0,
      clicks: 0,
      reach: 0,
      result: 0,
    };
    prev.spend += m.spend;
    prev.impressions += m.impressions;
    prev.clicks += m.clicks;
    prev.reach = (prev.reach || 0) + m.reach;
    prev.result = (prev.result || 0) + m.result;
    deviceMap.set(cleanDev, prev);
  }
  const devices: DomMetaDeviceRow[] = Array.from(deviceMap.values())
    .map((d) => ({
      ...d,
      cpr: (d.result || 0) > 0 ? d.spend / (d.result || 1) : 0,
      ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
    }))
    .sort((a, b) => b.spend - a.spend);

  // Dayparting Heatmap (7 days x 24 hours - Advertiser TZ)
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
        result: 0,
        cpr: 0,
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
    cell.result = (cell.result || 0) + m.result;
  }
  const heatmap = Array.from(cellMap.values()).map((c) => {
    const totRes = c.result || c.leads + c.messages + c.purchases;
    return {
      ...c,
      result: totRes,
      cpr: totRes > 0 ? c.spend / totRes : 0,
    };
  });

  // 24h Audience / Viewer Timezone series
  const audHourMap = new Map<number, DomMetaEntityHourPoint>();
  for (let h = 0; h < 24; h++) {
    audHourMap.set(h, {
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      spend: 0,
      impressions: 0,
      clicks: 0,
      result: 0,
      cpr: 0,
    });
  }
  for (const r of Array.isArray(hourlyAudRes?.data) ? hourlyAudRes.data : []) {
    const hourStr = String(r.hourly_stats_aggregated_by_audience_time_zone || '00:00:00');
    const h = Math.min(23, Math.max(0, parseInt(hourStr.split(':')[0] || '0', 10) || 0));
    const slot = audHourMap.get(h)!;
    const m = parseInsightMetrics(r);
    slot.spend += m.spend;
    slot.impressions += m.impressions;
    slot.clicks += m.clicks;
    slot.result += m.result;
  }
  const hourlyAudience = Array.from(audHourMap.values()).map((s) => ({
    ...s,
    cpr: s.result > 0 ? s.spend / s.result : 0,
  }));

  // Account Overview
  const accountOverview: DomMetaAccountOverview | null = accInfoRes?.account_id
    ? {
        account_id: String(accInfoRes.account_id),
        name: String(accInfoRes.name || `AdAccount #${cleanAcc}`),
        currency: String(accInfoRes.currency || 'VND'),
        balance: Number(accInfoRes.balance || 0),
        amount_spent: Number(accInfoRes.amount_spent || 0),
        spend_cap: Number(accInfoRes.spend_cap || 0),
        funding_source: String(
          accInfoRes.funding_source_details?.display_string || 'Thẻ tín dụng / Thanh toán tự động Meta'
        ),
        account_status: Number(accInfoRes.account_status || 1),
        timezone_name: accInfoRes.timezone_name ? String(accInfoRes.timezone_name) : undefined,
        business_name: accInfoRes.business_name ? String(accInfoRes.business_name) : undefined,
        business_address: [accInfoRes.business_city, accInfoRes.business_country_code]
          .filter(Boolean)
          .join(', ') || undefined,
        tax_id: accInfoRes.tax_id ? String(accInfoRes.tax_id) : undefined,
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
  const mapActivityList = (rawActs: GraphActivityRow[] | undefined): DomMetaActivityLogItem[] =>
    (Array.isArray(rawActs) ? rawActs : []).map((act) => {
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

  const activities: DomMetaActivityLogItem[] = mapActivityList(activitiesRes?.data);

  const builtDataset: DomMetaDashboardDataset = {
    dateRange: range,
    currentTotals: {
      spend: currParsed.spend,
      impressions: currParsed.impressions,
      reach: currParsed.reach,
      clicks: currParsed.clicks,
      unique_clicks: currParsed.unique_clicks,
      link_click: currParsed.link_click,
      outbound_click: currParsed.outbound_click,
      lpv: currParsed.lpv,
      lpv_rate: currParsed.lpv_rate,
      cost_per_lpv: currParsed.cost_per_lpv,
      leads: currParsed.leads,
      messages: currParsed.messages,
      message_connection: currParsed.message_connection,
      msg_reply: currParsed.msg_reply,
      msg_depth_2: currParsed.msg_depth_2,
      msg_depth_3: currParsed.msg_depth_3,
      view_content: currParsed.view_content,
      add_to_cart: currParsed.add_to_cart,
      initiate_checkout: currParsed.initiate_checkout,
      purchases: currParsed.purchases,
      purchase_value: currParsed.purchase_value,
      aov: currParsed.aov,
      roas: currParsed.roas,
      video_play: currParsed.video_play,
      video_3s: currParsed.video_3s,
      video_avg_time: currParsed.video_avg_time,
      video_p25: currParsed.video_p25,
      video_p50: currParsed.video_p50,
      video_p75: currParsed.video_p75,
      video_p95: currParsed.video_p95,
      video_p100: currParsed.video_p100,
      completion_rate: currParsed.completion_rate,
      thruplay: currParsed.thruplay,
      post_engagement: currParsed.post_engagement,
      reaction: currParsed.reaction,
      comments: currParsed.comments,
      shares: currParsed.shares,
      post_save: currParsed.post_save,
      photo_view: currParsed.photo_view,
      follows: currParsed.follows,
      cpm: currParsed.cpm,
      cpp: currParsed.cpp,
      cpc: currParsed.cpc,
      ctr: currParsed.ctr,
      unique_ctr: currParsed.unique_ctr,
      frequency: currParsed.frequency,
      hook_rate: currParsed.hook_rate,
      hold_rate: currParsed.hold_rate,
    },
    prevTotals: {
      spend: prevParsed.spend,
      impressions: prevParsed.impressions,
      reach: prevParsed.reach,
      clicks: prevParsed.clicks,
      unique_clicks: prevParsed.unique_clicks,
      link_click: prevParsed.link_click,
      outbound_click: prevParsed.outbound_click,
      lpv: prevParsed.lpv,
      lpv_rate: prevParsed.lpv_rate,
      cost_per_lpv: prevParsed.cost_per_lpv,
      leads: prevParsed.leads,
      messages: prevParsed.messages,
      message_connection: prevParsed.message_connection,
      msg_reply: prevParsed.msg_reply,
      msg_depth_2: prevParsed.msg_depth_2,
      msg_depth_3: prevParsed.msg_depth_3,
      view_content: prevParsed.view_content,
      add_to_cart: prevParsed.add_to_cart,
      initiate_checkout: prevParsed.initiate_checkout,
      purchases: prevParsed.purchases,
      purchase_value: prevParsed.purchase_value,
      aov: prevParsed.aov,
      roas: prevParsed.roas,
      video_play: prevParsed.video_play,
      video_3s: prevParsed.video_3s,
      video_avg_time: prevParsed.video_avg_time,
      video_p25: prevParsed.video_p25,
      video_p50: prevParsed.video_p50,
      video_p75: prevParsed.video_p75,
      video_p95: prevParsed.video_p95,
      video_p100: prevParsed.video_p100,
      completion_rate: prevParsed.completion_rate,
      thruplay: prevParsed.thruplay,
      post_engagement: prevParsed.post_engagement,
      reaction: prevParsed.reaction,
      comments: prevParsed.comments,
      shares: prevParsed.shares,
      post_save: prevParsed.post_save,
      photo_view: prevParsed.photo_view,
      follows: prevParsed.follows,
      cpm: prevParsed.cpm,
      cpp: prevParsed.cpp,
      cpc: prevParsed.cpc,
      ctr: prevParsed.ctr,
      unique_ctr: prevParsed.unique_ctr,
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
    platformDevices,
    ageGender,
    regions,
    countries,
    devices,
    heatmap,
    hourlyAudience,
    accountOverview,
    monthlyByYear,
    activities,
    actions: currParsed.actions,
    uniqueActions: currParsed.unique_actions,
    actionValues: currParsed.action_values,
  };
  datasetMemCache.set(memKey, { ts: Date.now(), dataset: builtDataset });
  if (!fastActivitiesRes) {
    void activitiesReqPromise.then((lateRes) => {
      if (lateRes?.data?.length) {
        builtDataset.activities = mapActivityList(lateRes.data);
      }
    });
  }
  return builtDataset;
  })();

  if (!options?.forceRefresh) {
    inFlightDatasets.set(memKey, loadPromise);
    try {
      return await loadPromise;
    } finally {
      inFlightDatasets.delete(memKey);
    }
  }
  return loadPromise;
}

export function prefetchDomMetaEntityDeepDetail(
  ctx: DomMetaAuthContext,
  adAccountId: string,
  entityType: 'campaign' | 'adset' | 'ad',
  entityId: string,
  optimizationGoal: string,
  range: { since: string; until: string }
): void {
  if (!adAccountId || !entityId) return;
  void fetchDomMetaEntityDeepDetail(
    ctx,
    adAccountId,
    entityType,
    entityId,
    optimizationGoal,
    range
  ).catch(() => {
    // Silent background prefetch
  });
}

export async function fetchDomMetaEntityDeepDetail(
  ctx: DomMetaAuthContext,
  adAccountId: string,
  entityType: 'campaign' | 'adset' | 'ad',
  entityId: string,
  optimizationGoal: string,
  range: { since: string; until: string }
): Promise<DomMetaEntityDeepDetail> {
  const cleanAcc = adAccountId.replace(/^act_/i, '').trim();
  const cleanEntityId = entityId.trim();
  const cacheKey = `${ctx.tenantSlug || 'local'}:${cleanAcc}:${entityType}:${cleanEntityId}:${range.since}:${range.until}`;
  const cached = entityDetailMemCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < DATASET_MEM_TTL_MS) {
    return cached.detail;
  }
  const existingInFlight = inFlightEntityDetails.get(cacheKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  const runPromise = (async (): Promise<DomMetaEntityDeepDetail> => {
  // Headless preview fallback when no real token is attached
  if (ctx.previewDataset && !ctx.directMetaToken && !ctx.accessToken) {
    const ds = ctx.previewDataset;
    const totalSpend = Math.max(1, ds.currentTotals.spend || 1);
    const previewDetail: DomMetaEntityDeepDetail = {
      entityType,
      entityId: cleanEntityId,
      optimizationGoal: optimizationGoal || 'QUALITY LEAD',
      daily: ds.daily.map((d) => ({
        date: d.date,
        spend: d.spend,
        impressions: d.impressions,
        reach: d.reach,
        clicks: d.clicks,
        leads: d.leads,
        messages: d.messages,
        purchases: 0,
        follows: d.follows,
        cpm: d.cpm,
        result: d.result ?? (d.leads || d.messages || 0),
        cpr:
          d.cpr ??
          ((d.leads || d.messages) > 0 ? d.spend / (d.leads || d.messages) : 0),
      })),
      hourly: Array.from({ length: 24 }, (_, hr) => {
        const matched = ds.heatmap.filter((c) => c.hour === hr);
        const spend = matched.reduce((s, x) => s + x.spend, 0);
        const leads = matched.reduce((s, x) => s + x.leads, 0);
        const clicks = matched.reduce((s, x) => s + x.clicks, 0);
        return {
          hour: hr,
          label: `${String(hr).padStart(2, '0')}:00`,
          spend,
          impressions: clicks * 25,
          clicks,
          result: leads,
          cpr: leads > 0 ? spend / leads : 0,
        };
      }),
      byPlatform: ds.positions.slice(0, 8).map((p) => ({
        label: p.label,
        subLabel: p.platform,
        rawKey: p.rawPlatform || p.platform.toLowerCase(),
        rawSubKey: p.rawPosition || p.position.toLowerCase(),
        spend: p.spend,
        impressions: p.impressions,
        reach: Math.round(p.impressions * 0.72),
        clicks: p.clicks,
        ctr: p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0,
        result: p.result,
        cpr: p.result > 0 ? p.spend / p.result : 0,
        sharePct: (p.spend / totalSpend) * 100,
      })),
      byAgeGender: ds.ageGender
        .filter((a) => a.totalSpend > 0)
        .map((a) => ({
          label: `${a.age} tuổi`,
          subLabel: `Nam / Nữ`,
          rawKey: 'age_gender',
          spend: a.totalSpend,
          impressions: Math.round(a.totalSpend / 80),
          reach: Math.round(a.totalSpend / 110),
          clicks: a.maleResult + a.femaleResult,
          result: a.maleResult + a.femaleResult,
          cpr:
            a.maleResult + a.femaleResult > 0
              ? a.totalSpend / (a.maleResult + a.femaleResult)
              : 0,
          sharePct: (a.totalSpend / totalSpend) * 100,
        })),
      ageGenderBuckets: ds.ageGender,
      byRegion: ds.regions.slice(0, 15).map((r) => ({
        label: r.region,
        rawKey: r.region,
        spend: r.spend,
        impressions: r.impressions,
        reach: r.reach,
        clicks: r.clicks ?? r.result * 4,
        ctr: r.ctr ?? (r.impressions > 0 ? ((r.clicks ?? r.result * 4) / r.impressions) * 100 : 0),
        result: r.result,
        cpr: r.result > 0 ? r.spend / r.result : 0,
        sharePct: (r.spend / totalSpend) * 100,
      })),
      byDevice: ds.devices.map((d) => {
        const devRes = d.result ?? Math.max(0, Math.round(d.clicks * 0.04));
        return {
          label: formatMetaDeviceLabel(d.rawDevice || d.device),
          rawKey: (d.rawDevice || d.device).toLowerCase(),
          spend: d.spend,
          impressions: d.impressions,
          reach: d.reach ?? Math.round(d.impressions * 0.75),
          clicks: d.clicks,
          ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
          result: devRes,
          cpr: devRes > 0 ? d.spend / devRes : 0,
          sharePct: (d.spend / totalSpend) * 100,
        };
      }),
      targeting: ds.campaigns[0]?.adsets[0]?.targeting || null,
      deliveryEstimate: null,
      previewIframeHtml: null,
    };
    return previewDetail;
  }

  const timeRangeJson = JSON.stringify({ since: range.since, until: range.until });
  const breakdownFields = 'spend,impressions,reach,clicks,actions';

  const requests: MetaBatchRequestSpec[] = [
    {
      key: 'entitySummary',
      graph_path: `${cleanEntityId}/insights`,
      params: {
        fields: entityType === 'ad' ? FULL_AD_INSIGHT_FIELDS : FULL_INSIGHT_FIELDS,
        time_range: timeRangeJson,
      },
    },
    {
      key: 'byDate',
      graph_path: `${cleanEntityId}/insights`,
      params: {
        fields: 'date_start,spend,impressions,reach,clicks,inline_link_clicks,actions',
        time_increment: 1,
        limit: 120,
        time_range: timeRangeJson,
      },
    },
    {
      key: 'byHour',
      graph_path: `${cleanEntityId}/insights`,
      params: {
        fields: 'spend,impressions,clicks,actions',
        breakdowns: 'hourly_stats_aggregated_by_advertiser_time_zone',
        limit: 100,
        time_range: timeRangeJson,
      },
    },
    {
      key: 'byHourAudience',
      graph_path: `${cleanEntityId}/insights`,
      params: {
        fields: 'spend,impressions,clicks,actions',
        breakdowns: 'hourly_stats_aggregated_by_audience_time_zone',
        limit: 100,
        time_range: timeRangeJson,
      },
    },
    {
      key: 'byPlatform',
      graph_path: `${cleanEntityId}/insights`,
      params: {
        fields: breakdownFields,
        breakdowns: 'publisher_platform,platform_position',
        limit: 150,
        time_range: timeRangeJson,
      },
    },
    {
      key: 'byPlatformDevice',
      graph_path: `${cleanEntityId}/insights`,
      params: {
        fields: breakdownFields,
        breakdowns: 'publisher_platform,device_platform',
        limit: 100,
        time_range: timeRangeJson,
      },
    },
    {
      key: 'byAgeGender',
      graph_path: `${cleanEntityId}/insights`,
      params: {
        fields: breakdownFields,
        breakdowns: 'age,gender',
        limit: 100,
        time_range: timeRangeJson,
      },
    },
    {
      key: 'byRegion',
      graph_path: `${cleanEntityId}/insights`,
      params: {
        fields: breakdownFields,
        breakdowns: 'region',
        limit: 150,
        time_range: timeRangeJson,
      },
    },
    {
      key: 'byCountry',
      graph_path: `${cleanEntityId}/insights`,
      params: {
        fields: breakdownFields,
        breakdowns: 'country',
        limit: 100,
        time_range: timeRangeJson,
      },
    },
    {
      key: 'byDevice',
      graph_path: `${cleanEntityId}/insights`,
      params: {
        fields: breakdownFields,
        breakdowns: 'impression_device',
        limit: 50,
        time_range: timeRangeJson,
      },
    },
  ];

  if (entityType === 'ad') {
    requests.push(
      {
        key: 'entityMeta',
        graph_path: cleanEntityId,
        params: {
          fields:
            'id,name,adset_id,targeting,creative.thumbnail_width(720).thumbnail_height(720){id,title,body,call_to_action_type,link_url,object_type,video_id,actor_id,instagram_permalink_url,image_url,thumbnail_url,object_story_spec}',
        },
      },
      {
        key: 'adPreview',
        graph_path: `${cleanEntityId}/previews`,
        params: { ad_format: 'DESKTOP_FEED_STANDARD' },
      }
    );
  } else if (entityType === 'adset') {
    requests.push(
      {
        key: 'entityMeta',
        graph_path: cleanEntityId,
        params: {
          fields:
            'id,name,targeting,optimization_goal,bid_strategy,billing_event,destination_type,learning_stage_info,attribution_spec',
        },
      },
      {
        key: 'deliveryEst',
        graph_path: `${cleanEntityId}/delivery_estimate`,
        params: { fields: 'estimate_dau,estimate_mau_lower_bound,estimate_mau_upper_bound,estimate_ready' },
      }
    );
  } else {
    requests.push({
      key: 'campAdsets',
      graph_path: `${cleanEntityId}/adsets`,
      params: {
        fields:
          'id,name,targeting,optimization_goal,bid_strategy,billing_event,destination_type,learning_stage_info',
        limit: 15,
      },
    });
  }

  const batch = await callMetaGraphBatch(ctx, cleanAcc, requests);
  const goal = resolveGoalLabel(optimizationGoal);

  const toBreakdownRows = (
    rowsRaw: unknown,
    labelFn: (row: Record<string, unknown>) => {
      label: string;
      subLabel?: string;
      rawKey?: string;
      rawSubKey?: string;
    }
  ): DomMetaEntityDeepBreakdownRow[] => {
    const arr = Array.isArray(rowsRaw) ? (rowsRaw as Array<Record<string, unknown>>) : [];
    const merged = new Map<string, DomMetaEntityDeepBreakdownRow>();
    for (const r of arr) {
      const m = parseInsightMetrics(r as unknown as GraphInsightRow, goal);
      if (m.spend <= 0 && m.impressions <= 0 && m.result <= 0) continue;
      const { label, subLabel, rawKey, rawSubKey } = labelFn(r);
      const prev = merged.get(label);
      if (prev) {
        prev.spend += m.spend;
        prev.impressions += m.impressions;
        prev.reach += m.reach;
        prev.clicks += m.clicks;
        prev.result += m.result;
      } else {
        merged.set(label, {
          label,
          subLabel,
          rawKey,
          rawSubKey,
          spend: m.spend,
          impressions: m.impressions,
          reach: m.reach,
          clicks: m.clicks,
          result: m.result,
          cpr: 0,
          sharePct: 0,
        });
      }
    }
    const isGoalPerThousand = goal === 'REACH' || goal === 'IMPRESSIONS';
    const parsed = Array.from(merged.values()).map((x) => ({
      ...x,
      ctr: x.impressions > 0 ? (x.clicks / x.impressions) * 100 : 0,
      cpr:
        x.result > 0
          ? isGoalPerThousand
            ? (x.spend / x.result) * 1000
            : x.spend / x.result
          : 0,
    }));
    const sumSpend = parsed.reduce((s, x) => s + x.spend, 0) || 1;
    return parsed
      .map((x) => ({ ...x, sharePct: (x.spend / sumSpend) * 100 }))
      .sort((a, b) => b.spend - a.spend);
  };

  const summaryRow = (Array.isArray(batch.entitySummary?.data)
    ? batch.entitySummary.data[0]
    : undefined) as unknown as GraphInsightRow | undefined;
  const summaryParsed = parseInsightMetrics(summaryRow, goal);

  const daily: DomMetaEntityDailyPoint[] = (
    Array.isArray(batch.byDate?.data)
      ? (batch.byDate.data as unknown as GraphInsightRow[])
      : []
  )
    .map((d) => {
      const m = parseInsightMetrics(d, goal);
      return {
        date: String(d.date_start || ''),
        spend: m.spend,
        impressions: m.impressions,
        reach: m.reach,
        clicks: m.clicks,
        leads: m.leads,
        messages: m.messages,
        purchases: m.purchases,
        follows: m.follows,
        cpm: m.cpm,
        result: m.result,
        cpr: m.cpr,
      };
    })
    .filter((d) => Boolean(d.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  const isPerThousand = goal === 'REACH' || goal === 'IMPRESSIONS';
  const buildHourSeries = (
    rowsRaw: unknown,
    hourField: 'hourly_stats_aggregated_by_advertiser_time_zone' | 'hourly_stats_aggregated_by_audience_time_zone'
  ): DomMetaEntityHourPoint[] => {
    const buckets = new Map<number, DomMetaEntityHourPoint>();
    for (let h = 0; h < 24; h++) {
      buckets.set(h, {
        hour: h,
        label: `${String(h).padStart(2, '0')}:00`,
        spend: 0,
        impressions: 0,
        clicks: 0,
        result: 0,
        cpr: 0,
      });
    }
    for (const r of Array.isArray(rowsRaw) ? (rowsRaw as Array<Record<string, unknown>>) : []) {
      const rawHour = String(r[hourField] || '00:00:00');
      const hr = Math.min(23, Math.max(0, parseInt(rawHour.split(':')[0] || '0', 10) || 0));
      const m = parseInsightMetrics(r as unknown as GraphInsightRow, goal);
      const slot = buckets.get(hr)!;
      slot.spend += m.spend;
      slot.impressions += m.impressions;
      slot.clicks += m.clicks;
      slot.result += m.result;
    }
    return Array.from(buckets.values()).map((slot) => ({
      ...slot,
      cpr:
        slot.result > 0
          ? isPerThousand
            ? (slot.spend / slot.result) * 1000
            : slot.spend / slot.result
          : 0,
    }));
  };

  const hourly = buildHourSeries(batch.byHour?.data, 'hourly_stats_aggregated_by_advertiser_time_zone');
  const byHourAudience = buildHourSeries(
    batch.byHourAudience?.data,
    'hourly_stats_aggregated_by_audience_time_zone'
  );

  // Day-of-week rollup (Thứ 2 .. Chủ nhật) derived from daily series
  const dowOrder = [1, 2, 3, 4, 5, 6, 0];
  const dowLabels: Record<number, string> = {
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
    0: 'Chủ nhật',
  };
  const dowMap = new Map<number, DomMetaEntityDeepBreakdownRow>();
  for (const dow of dowOrder) {
    dowMap.set(dow, {
      label: dowLabels[dow],
      rawKey: `dow_${dow}`,
      spend: 0,
      impressions: 0,
      reach: 0,
      clicks: 0,
      ctr: 0,
      result: 0,
      cpr: 0,
      sharePct: 0,
    });
  }
  for (const dp of daily) {
    const dt = new Date(`${dp.date}T00:00:00`);
    if (Number.isNaN(dt.getTime())) continue;
    const slot = dowMap.get(dt.getDay());
    if (!slot) continue;
    slot.spend += dp.spend;
    slot.impressions += dp.impressions;
    slot.reach += dp.reach;
    slot.clicks += dp.clicks;
    slot.result += dp.result;
  }
  const totalDowSpend = Array.from(dowMap.values()).reduce((s, x) => s + x.spend, 0) || 1;
  const byDayOfWeek = dowOrder.map((dow) => {
    const x = dowMap.get(dow)!;
    return {
      ...x,
      ctr: x.impressions > 0 ? (x.clicks / x.impressions) * 100 : 0,
      cpr:
        x.result > 0
          ? isPerThousand
            ? (x.spend / x.result) * 1000
            : x.spend / x.result
          : 0,
      sharePct: (x.spend / totalDowSpend) * 100,
    };
  });

  const byPlatform = toBreakdownRows(batch.byPlatform?.data, (r) => {
    const rawPlat = String(r.publisher_platform || 'facebook').toLowerCase();
    const prettyPlat = formatMetaPublisherLabel(rawPlat);
    const rawPos = String(r.platform_position || 'feed');
    const prettyPos = formatMetaPositionLabel(rawPos, rawPlat);
    return {
      label: `${prettyPlat} · ${prettyPos}`,
      subLabel: prettyPlat,
      rawKey: rawPlat,
      rawSubKey: rawPos,
    };
  });

  const byPlatformDevice = toBreakdownRows(batch.byPlatformDevice?.data, (r) => {
    const rawPlat = String(r.publisher_platform || 'facebook').toLowerCase();
    const prettyPlat = formatMetaPublisherLabel(rawPlat);
    const rawDev = String(r.device_platform || 'mobile_app').toLowerCase();
    const prettyDev = formatMetaDeviceLabel(rawDev);
    return {
      label: `${prettyPlat} · ${prettyDev}`,
      subLabel: prettyPlat,
      rawKey: rawPlat,
      rawSubKey: rawDev,
    };
  });

  const byAgeGender = toBreakdownRows(batch.byAgeGender?.data, (r) => {
    const age = String(r.age || 'N/A');
    const gRaw = String(r.gender || 'unknown').toLowerCase();
    const gLabel = gRaw === 'male' ? 'Nam' : gRaw === 'female' ? 'Nữ' : 'Khác';
    return { label: `${age} · ${gLabel}`, subLabel: age, rawKey: gRaw, rawSubKey: age };
  });

  const entityAgeBrackets = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  const entityAgeMap = new Map<string, DomMetaAgeGenderBucket>(
    entityAgeBrackets.map((age) => [
      age,
      {
        age,
        maleSpend: 0,
        femaleSpend: 0,
        unknownSpend: 0,
        totalSpend: 0,
        maleResult: 0,
        femaleResult: 0,
        unknownResult: 0,
        totalResult: 0,
        reach: 0,
        clicks: 0,
      },
    ])
  );
  for (const r of Array.isArray(batch.byAgeGender?.data)
    ? (batch.byAgeGender.data as unknown as GraphInsightRow[])
    : []) {
    const age = String(r.age || '');
    const bucket = entityAgeMap.get(age);
    if (!bucket) continue;
    const m = parseInsightMetrics(r, goal);
    const gRaw = String(r.gender || '').toLowerCase();
    if (gRaw === 'male') {
      bucket.maleSpend += m.spend;
      bucket.maleResult += m.result;
    } else if (gRaw === 'female') {
      bucket.femaleSpend += m.spend;
      bucket.femaleResult += m.result;
    } else {
      bucket.unknownSpend += m.spend;
      bucket.unknownResult = (bucket.unknownResult || 0) + m.result;
    }
    bucket.totalSpend += m.spend;
    bucket.totalResult = (bucket.totalResult || 0) + m.result;
    bucket.reach = (bucket.reach || 0) + m.reach;
    bucket.clicks = (bucket.clicks || 0) + m.clicks;
  }
  const ageGenderBuckets = entityAgeBrackets.map((a) => entityAgeMap.get(a)!);

  const byRegion = toBreakdownRows(batch.byRegion?.data, (r) => {
    const rawReg = String(r.region || 'Khác');
    return {
      label: rawReg,
      rawKey: rawReg,
    };
  });

  const byCountry = toBreakdownRows(batch.byCountry?.data, (r) => {
    const rawCode = String(r.country || '');
    return {
      label: formatCountryCodeLabel(rawCode),
      rawKey: rawCode.toUpperCase(),
    };
  });

  const byDevice = toBreakdownRows(batch.byDevice?.data, (r) => {
    const rawDev = String(r.impression_device || r.device_platform || 'mobile_app');
    return {
      label: formatMetaDeviceLabel(rawDev),
      rawKey: rawDev.toLowerCase(),
    };
  });

  let targeting: DomMetaTargetingSpec | null = null;
  if (batch.entityMeta?.targeting && typeof batch.entityMeta.targeting === 'object') {
    targeting = batch.entityMeta.targeting as DomMetaTargetingSpec;
  } else if (Array.isArray(batch.campAdsets?.data) && batch.campAdsets.data[0]?.targeting) {
    targeting = batch.campAdsets.data[0].targeting as DomMetaTargetingSpec;
  }

  let creativeSpec: DomMetaEntityCreativeSpec | null = null;
  if (batch.entityMeta?.creative && typeof batch.entityMeta.creative === 'object') {
    const cr = batch.entityMeta.creative as Record<string, unknown>;
    const normalizeCrUrl = (raw: unknown): string => {
      const u = String(raw || '').trim();
      if (!u) return '';
      return u
        .replace(/^https:\/\/scontent\.[^/]+\.fbcdn\.net\//i, 'https://scontent.xx.fbcdn.net/')
        .replace(/^https:\/\/external\.[^/]+\.fbcdn\.net\//i, 'https://external.xx.fbcdn.net/');
    };
    const carouselUrls: string[] = [];
    const seenUrls = new Set<string>();
    const pushCrUrl = (raw: unknown) => {
      const clean = normalizeCrUrl(raw);
      if (!clean || seenUrls.has(clean)) return;
      seenUrls.add(clean);
      carouselUrls.push(clean);
    };

    const storySpec = cr.object_story_spec as
      | {
          link_data?: {
            picture?: string;
            child_attachments?: Array<{ picture?: string; image_url?: string }>;
          };
          photo_data?: { url?: string };
          video_data?: { image_url?: string };
        }
      | undefined;
    if (Array.isArray(storySpec?.link_data?.child_attachments)) {
      for (const att of storySpec.link_data.child_attachments) {
        pushCrUrl(att?.image_url || att?.picture);
      }
    }
    if (carouselUrls.length === 0) {
      pushCrUrl(
        cr.image_url ||
          storySpec?.photo_data?.url ||
          storySpec?.video_data?.image_url ||
          storySpec?.link_data?.picture ||
          cr.thumbnail_url
      );
    }

    if (
      cr.title ||
      cr.body ||
      cr.call_to_action_type ||
      cr.link_url ||
      cr.instagram_permalink_url ||
      carouselUrls.length > 0
    ) {
      creativeSpec = {
        title: cr.title ? String(cr.title) : undefined,
        body: cr.body ? String(cr.body) : undefined,
        ctaType: cr.call_to_action_type ? String(cr.call_to_action_type) : undefined,
        linkUrl: cr.link_url ? String(cr.link_url) : undefined,
        instagramPermalinkUrl: cr.instagram_permalink_url ? String(cr.instagram_permalink_url) : undefined,
        objectType: cr.object_type ? String(cr.object_type) : undefined,
        videoId: cr.video_id ? String(cr.video_id) : undefined,
        pageId: cr.actor_id ? String(cr.actor_id) : undefined,
        imageUrls: carouselUrls.length > 0 ? carouselUrls : undefined,
      };
    }
  }

  const firstCampAdset = Array.isArray(batch.campAdsets?.data)
    ? (batch.campAdsets.data[0] as Record<string, unknown> | undefined)
    : undefined;
  const rawAttrSpec = Array.isArray(batch.entityMeta?.attribution_spec)
    ? batch.entityMeta.attribution_spec
    : undefined;
  const attrSummary = rawAttrSpec
    ? rawAttrSpec
        .map((a) => `${String(a.event_type || 'CLICK')}: ${Number(a.window_days || 7)}d`)
        .join(' · ')
    : undefined;
  const rawLearning =
    batch.entityMeta?.learning_stage_info ||
    (firstCampAdset?.learning_stage_info as { status?: string; conversions?: number } | undefined);

  const diagnostics: DomMetaEntityDeliveryDiagnostics = {
    qualityRanking: summaryParsed.quality_ranking,
    engagementRateRanking: summaryParsed.engagement_rate_ranking,
    conversionRateRanking: summaryParsed.conversion_rate_ranking,
    bidStrategy:
      batch.entityMeta?.bid_strategy ||
      (firstCampAdset?.bid_strategy ? String(firstCampAdset.bid_strategy) : undefined),
    billingEvent:
      batch.entityMeta?.billing_event ||
      (firstCampAdset?.billing_event ? String(firstCampAdset.billing_event) : undefined),
    destinationType:
      batch.entityMeta?.destination_type ||
      (firstCampAdset?.destination_type ? String(firstCampAdset.destination_type) : undefined),
    learningStageStatus: rawLearning?.status ? String(rawLearning.status) : undefined,
    learningStageConversions:
      rawLearning?.conversions !== undefined ? Number(rawLearning.conversions) : undefined,
    attributionSummary: attrSummary,
  };

  let deliveryEstimate: DomMetaEntityDeepDetail['deliveryEstimate'] = null;
  const rawEst = Array.isArray(batch.deliveryEst?.data) ? batch.deliveryEst.data[0] : null;
  if (rawEst) {
    const lo = Number(rawEst.estimate_mau_lower_bound || rawEst.users_lower_bound || 0);
    const hi = Number(rawEst.estimate_mau_upper_bound || rawEst.users_upper_bound || 0);
    if (lo > 0 || hi > 0) {
      deliveryEstimate = {
        usersLowerBound: lo,
        usersUpperBound: hi,
        ready: Boolean(rawEst.estimate_ready !== false),
      };
    }
  }

  const rawPreviewBody = Array.isArray(batch.adPreview?.data)
    ? batch.adPreview.data[0]?.body
    : undefined;
  const previewIframeHtml =
    typeof rawPreviewBody === 'string' && rawPreviewBody.includes('<iframe')
      ? rawPreviewBody
      : null;

  const detail: DomMetaEntityDeepDetail = {
    entityType,
    entityId: cleanEntityId,
    optimizationGoal: goal,
    daily,
    hourly,
    byHourAudience,
    byDayOfWeek,
    byPlatform,
    byPlatformDevice,
    byAgeGender,
    ageGenderBuckets,
    byRegion,
    byCountry,
    byDevice,
    targeting,
    creativeSpec,
    diagnostics,
    uniqueActions: summaryParsed.unique_actions,
    costPerAction: summaryParsed.cost_per_action,
    actionValues: summaryParsed.action_values,
    deliveryEstimate,
    previewIframeHtml,
  };

  entityDetailMemCache.set(cacheKey, { ts: Date.now(), detail });
  return detail;
  })();

  inFlightEntityDetails.set(cacheKey, runPromise);
  try {
    return await runPromise;
  } finally {
    inFlightEntityDetails.delete(cacheKey);
  }
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
  const params: Record<string, string | number | boolean | undefined> = {
    fields: FULL_INSIGHT_FIELDS,
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
    unique_clicks: parsed.unique_clicks,
    link_click: parsed.link_click,
    outbound_click: parsed.outbound_click,
    lpv: parsed.lpv,
    lpv_rate: parsed.lpv_rate,
    cost_per_lpv: parsed.cost_per_lpv,
    leads: parsed.leads,
    messages: parsed.messages,
    message_connection: parsed.message_connection,
    msg_reply: parsed.msg_reply,
    msg_depth_2: parsed.msg_depth_2,
    msg_depth_3: parsed.msg_depth_3,
    view_content: parsed.view_content,
    add_to_cart: parsed.add_to_cart,
    initiate_checkout: parsed.initiate_checkout,
    purchases: parsed.purchases,
    purchase_value: parsed.purchase_value,
    aov: parsed.aov,
    roas: parsed.roas,
    video_play: parsed.video_play,
    video_3s: parsed.video_3s,
    video_avg_time: parsed.video_avg_time,
    video_p25: parsed.video_p25,
    video_p50: parsed.video_p50,
    video_p75: parsed.video_p75,
    video_p95: parsed.video_p95,
    video_p100: parsed.video_p100,
    completion_rate: parsed.completion_rate,
    thruplay: parsed.thruplay,
    post_engagement: parsed.post_engagement,
    reaction: parsed.reaction,
    comments: parsed.comments,
    shares: parsed.shares,
    post_save: parsed.post_save,
    photo_view: parsed.photo_view,
    follows: parsed.follows,
    cpm: parsed.cpm,
    cpp: parsed.cpp,
    cpc: parsed.cpc,
    ctr: parsed.ctr,
    unique_ctr: parsed.unique_ctr,
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

  const res = await fetchDomMetaAuthed(ctx, '/api/v1/integrations/dom-meta/google-ads-proxy', {
    method: 'POST',
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

  const res = await fetchDomMetaAuthed(ctx, '/api/v1/integrations/dom-meta/google-ads-proxy', {
    method: 'POST',
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

  const res = await fetchDomMetaAuthed(
    ctx,
    '/api/v1/integrations/dom-meta/quick-connect-status',
    { method: 'GET' }
  );
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
  const res = await fetchDomMetaAuthed(ctx, '/api/v1/integrations/dom-meta/quick-connect', {
    method: 'POST',
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
    entity_type?: 'ad' | 'adset' | 'campaign' | 'all';
    entity_id?: string;
    entity_name?: string;
    sale_id?: string;
    quality_status?: string;
    search?: string;
    only_attributed?: boolean;
    page?: number;
    page_size?: number;
  }
): Promise<DomMetaCrmAttributionPayload> {
  if (ctx.previewCrmAttribution && !ctx.accessToken) {
    if (params.entity_type === 'all' || (params.entity_id && params.entity_type)) {
      const rawItems =
        params.entity_type === 'all'
          ? Object.values(ctx.previewEntityLeadsByEntityId || {}).flat()
          : ctx.previewEntityLeadsByEntityId?.[params.entity_id || ''] ||
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
  if (params.search) q.set('search', params.search);
  if (params.only_attributed !== undefined) q.set('only_attributed', String(params.only_attributed));
  if (params.page) q.set('page', String(params.page));
  if (params.page_size) q.set('page_size', String(params.page_size));

  const res = await fetchDomMetaAuthed(
    ctx,
    `/api/v1/integrations/dom-meta/crm-attribution?${q.toString()}`,
    { method: 'GET' }
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

export async function fetchDomMetaShareConfig(
  ctx: DomMetaAuthContext
): Promise<DomMetaShareState> {
  const res = await fetchDomMetaAuthed(ctx, '/api/v1/integrations/dom-meta/share', {
    method: 'GET',
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: DomMetaShareState;
    message?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json?.success || !json?.data) {
    throw new Error(json?.error?.message || json?.message || 'Không thể tải danh sách phân quyền.');
  }
  return json.data;
}

export async function saveDomMetaShareConfig(
  ctx: DomMetaAuthContext,
  payload: {
    public_view?: boolean;
    invite?: { email: string; role?: 'viewer' | 'tenant_admin'; full_name?: string };
    update_member?: { user_id?: string; email?: string; role: 'viewer' | 'tenant_admin' };
    remove_user_id?: string;
    remove_email?: string;
  }
): Promise<DomMetaShareState> {
  const res = await fetchDomMetaAuthed(ctx, '/api/v1/integrations/dom-meta/share', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: DomMetaShareState;
    message?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json?.success || !json?.data) {
    throw new Error(json?.error?.message || json?.message || 'Không thể lưu cài đặt chia sẻ.');
  }
  return json.data;
}

export async function fetchDomMetaAiConfig(
  ctx: DomMetaAuthContext
): Promise<DomMetaSharedAiConfig> {
  if (!ctx.accessToken) {
    return {
      has_api_key: false,
      api_key_masked: '',
      model: 'gemini-2.5-flash',
      ai_lead_eval_enabled: true,
      ai_ads_eval_enabled: true,
      updated_at: null,
    };
  }
  const res = await fetchDomMetaAuthed(ctx, '/api/v1/integrations/dom-meta/ai-config', {
    method: 'GET',
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: DomMetaSharedAiConfig;
    message?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json?.success || !json?.data) {
    throw new Error(json?.error?.message || json?.message || 'Không thể tải cấu hình AI API Key.');
  }
  return json.data;
}

export async function saveDomMetaAiConfig(
  ctx: DomMetaAuthContext,
  payload: {
    api_key?: string;
    clear_api_key?: boolean;
    model?: string;
    ai_lead_eval_enabled?: boolean;
    ai_ads_eval_enabled?: boolean;
  }
): Promise<DomMetaSharedAiConfig> {
  const res = await fetchDomMetaAuthed(ctx, '/api/v1/integrations/dom-meta/ai-config', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: DomMetaSharedAiConfig;
    message?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json?.success || !json?.data) {
    throw new Error(json?.error?.message || json?.message || 'Không thể lưu cấu hình AI API Key.');
  }
  return json.data;
}

export async function requestDomMetaAiAnalysis(
  ctx: DomMetaAuthContext,
  payload: {
    scope: 'workspace' | 'compare' | 'entity' | 'lead';
    context_data: Record<string, unknown>;
    prompt_focus?: string;
    model?: string;
  }
): Promise<{
  scope: string;
  model: string;
  html: string;
  plain_text: string;
  preview: string;
  timestamp: string;
}> {
  const res = await fetchDomMetaAuthed(ctx, '/api/v1/integrations/dom-meta/ai-analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: {
      scope: string;
      model: string;
      html: string;
      plain_text: string;
      preview: string;
      timestamp: string;
    };
    message?: string;
    error?: { code?: string; message?: string };
  };
  if (!res.ok || !json?.success || !json?.data) {
    const err = new Error(
      json?.error?.message || json?.message || 'Không thể thực thi phân tích AI.'
    ) as Error & { code?: string };
    err.code = json?.error?.code;
    throw err;
  }
  return json.data;
}

export interface DomMetaPublicAccessPayload {
  public_view: boolean;
  access_token: string;
  primary_ad_account_id?: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    plan_tier: string;
    package_code?: string;
  };
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_public_viewer?: boolean;
  };
}

const PUBLIC_ACCESS_CACHE_TTL_MS = 10 * 60 * 1000;

export function getCachedPublicDomMetaAccess(slug?: string | null): DomMetaPublicAccessPayload | null {
  if (typeof window === 'undefined' || !slug) return null;
  const clean = slug.trim().toLowerCase();
  if (!clean) return null;
  try {
    const raw = sessionStorage.getItem(`dom_meta_pub_access:${clean}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts?: number; payload?: DomMetaPublicAccessPayload };
    if (
      parsed?.payload?.public_view &&
      parsed.payload.access_token &&
      typeof parsed.ts === 'number' &&
      Date.now() - parsed.ts < PUBLIC_ACCESS_CACHE_TTL_MS
    ) {
      return parsed.payload;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function resolvePublicDomMetaAccess(
  slug: string,
  apiBaseUrl = ''
): Promise<DomMetaPublicAccessPayload | null> {
  const clean = slug.trim().toLowerCase();
  if (!clean) return null;
  const base = apiBaseUrl ? apiBaseUrl.replace(/\/+$/, '') : '';
  const url = `${base}/api/v1/public/dom-meta/${encodeURIComponent(clean)}/access`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    try {
      sessionStorage.removeItem(`dom_meta_pub_access:${clean}`);
    } catch {
      // ignore
    }
    return null;
  }
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: DomMetaPublicAccessPayload;
  };
  if (!json?.success || !json?.data?.public_view || !json?.data?.access_token) {
    try {
      sessionStorage.removeItem(`dom_meta_pub_access:${clean}`);
    } catch {
      // ignore
    }
    return null;
  }
  if (json.data.primary_ad_account_id) {
    setCachedPrimaryAdAccountId(clean, json.data.primary_ad_account_id);
  }
  try {
    sessionStorage.setItem(
      `dom_meta_pub_access:${clean}`,
      JSON.stringify({ ts: Date.now(), payload: json.data })
    );
  } catch {
    // ignore
  }
  return json.data;
}
