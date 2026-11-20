export interface DomMetaAccountItem {
  id: string;
  ad_account_id: string;
  name: string;
  has_token?: boolean;
  access_token_masked?: string;
  pixel_id?: string;
  is_active?: boolean;
  currency?: string;
  business_name?: string | null;
}

export interface DomMetaBrandFilter {
  id: string;
  name: string;
  filter: string;
  avatar?: string;
}

export interface DomMetaCustomMetric {
  id: string;
  name: string;
  formula: string;
  format?: 'money' | 'number' | 'percent';
}

export interface DomMetaColumnConfig {
  activeColumns: string[];
  customMetrics: DomMetaCustomMetric[];
}

export interface DomMetaViewPreset {
  id: string;
  name: string;
  activeColumns: string[];
  customMetrics?: DomMetaCustomMetric[];
}

export interface DomMetaAiReportEntry {
  id: string;
  timestamp: string;
  label: string;
  brand: string;
  date_range: string;
  preview: string;
  html: string;
  plain_text: string;
}

export type DomMetaGoogleAdsSetupMode = 'mcc_quick' | 'custom_script';
export type DomMetaGoogleAdsAccountStatus = 'pending_mcc' | 'pending_otp' | 'connected' | 'error';
export type DomMetaGoogleAdsVerifiedVia =
  | 'owner_email_otp'
  | 'mcc_admin_otp'
  | 'legacy_migrated'
  | 'custom_script';

export interface DomMetaGoogleAdsAccountItem {
  customer_id: string;
  label?: string;
  status: DomMetaGoogleAdsAccountStatus;
  requested_at?: string | null;
  verified_at?: string | null;
  verified_via?: DomMetaGoogleAdsVerifiedVia | null;
  otp_sent_to_masked?: string | null;
  otp_expires_at?: string | null;
  last_error?: string | null;
}

export interface DomMetaGoogleAdsConfig {
  enabled: boolean; // STRICTLY FALSE BY DEFAULT
  setup_mode?: DomMetaGoogleAdsSetupMode;
  customer_id: string;
  accounts?: DomMetaGoogleAdsAccountItem[];
  mcc_id?: string;
  apps_script_url: string;
  has_developer_token?: boolean;
  developer_token_masked?: string;
  developer_token?: string;
  last_verified_at?: string | null;
}

export interface DomMetaSharedAiConfig {
  has_api_key: boolean;
  api_key_masked: string;
  model: string;
  ai_lead_eval_enabled: boolean;
  ai_ads_eval_enabled: boolean;
  updated_at?: string | null;
}

export interface DomMetaShareMember {
  id?: string;
  email: string;
  full_name: string;
  role: 'tenant_admin' | 'viewer' | string;
  is_tenant_owner?: boolean;
  added_at?: string;
}

export interface DomMetaShareState {
  public_view: boolean;
  slug: string;
  tenant_name: string;
  members: DomMetaShareMember[];
}

export interface DomMetaWorkspaceConfig {
  primary_ad_account_id: string;
  public_view?: boolean;
  meta_summary: {
    ad_account_id: string;
    pixel_id: string;
    has_token: boolean;
    access_token_masked: string;
    total_accounts: number;
    active_accounts: number;
    accounts: DomMetaAccountItem[];
  };
  brand_filters: DomMetaBrandFilter[];
  goal_keywords: string[];
  goal_chart_mode: 'goal' | 'brand' | 'keyword';
  column_config: DomMetaColumnConfig;
  view_presets: DomMetaViewPreset[];
  summary_metrics: string[];
  ai_reports?: DomMetaAiReportEntry[];
  ai_config?: DomMetaSharedAiConfig;
  google_ads: DomMetaGoogleAdsConfig;
  updated_at?: string;
}

export interface DomMetaWorkspacePatch {
  primary_ad_account_id?: string;
  public_view?: boolean;
  brand_filters?: DomMetaBrandFilter[];
  goal_keywords?: string[];
  goal_chart_mode?: 'goal' | 'brand' | 'keyword';
  column_config?: DomMetaColumnConfig;
  view_presets?: DomMetaViewPreset[];
  summary_metrics?: string[];
  ai_reports?: DomMetaAiReportEntry[];
  ai_config?: {
    api_key?: string;
    clear_api_key?: boolean;
    model?: string;
    ai_lead_eval_enabled?: boolean;
    ai_ads_eval_enabled?: boolean;
  };
  google_ads?: Partial<DomMetaGoogleAdsConfig> & { mark_verified?: boolean };
}

export type DomMetaDatePreset =
  | 'today'
  | 'yesterday'
  | 'yesterday_to_today'
  | 'last_7days'
  | 'last_30days'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'custom_range';

export type DomMetaNavView =
  | 'dashboard'
  | 'ad_detail'
  | 'lead_attribution'
  | 'ad_library'
  | 'account'
  | 'google_ads'
  | 'meta_capi'
  | 'settings';

export type DomMetaSettingsTab =
  | 'brand'
  | 'goals'
  | 'ai_key'
  | 'google_ads'
  | 'accounts'
  | 'ecosystem'
  | 'plan';

export interface DomMetaQuickConnectStatus {
  has_meta_token: boolean;
  total_accounts: number;
  active_accounts: number;
  primary_ad_account_id: string;
  primary_account_name: string;
  has_capi_pixel: boolean;
  dom_meta_connected: boolean;
  can_auto_connect: boolean;
  accounts: DomMetaAccountItem[];
}

export interface DomMetaCrmSaleBreakdown {
  user_id: string;
  name: string;
  avatar?: string | null;
  lead_count: number;
  qualified_count: number;
  closed_count?: number;
  revenue_vnd: number;
}

export interface DomMetaCrmEntityBucket {
  entity_id: string;
  total_leads: number;
  qualified_leads: number;
  closed_leads?: number;
  negative_leads: number;
  pending_leads: number;
  positive_rate: number;
  total_revenue_vnd: number;
  capi_sent_count: number;
  pipeline: Record<string, number>;
  sales: DomMetaCrmSaleBreakdown[];
}

export interface DomMetaCrmLeadItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  pii_masked?: boolean;
  created_at: string;
  assigned_to: string | null;
  assigned_to_name: string;
  assigned_to_avatar?: string | null;
  round_name: string;
  quality_status: string;
  stage_key?: string;
  quality_note?: string | null;
  total_revenue_vnd: number;
  ad_id: string;
  ad_name: string;
  adset_id: string;
  campaign_id: string;
  campaign_name: string;
  source: string;
  capi_last_event: string | null;
  capi_last_status: 'sent' | 'failed' | null;
}

export interface DomMetaCrmAttributionPayload {
  summary: {
    total_leads: number;
    attributed_leads: number;
    qualified_leads: number;
    closed_leads: number;
    negative_leads: number;
    total_revenue_vnd: number;
    capi_sent_count: number;
    pipeline_totals?: Record<string, number>;
  };
  by_ad: Record<string, DomMetaCrmEntityBucket>;
  by_adset: Record<string, DomMetaCrmEntityBucket>;
  by_campaign: Record<string, DomMetaCrmEntityBucket>;
  by_campaign_name?: Record<string, DomMetaCrmEntityBucket>;
  entity_leads?: {
    items: DomMetaCrmLeadItem[];
    total: number;
    page: number;
    page_size: number;
    sales_filter_options: Array<{
      user_id: string;
      name: string;
      avatar?: string | null;
      count: number;
    }>;
  };
}

export interface DomMetaMetricDef {
  id: string;
  label: string;
  shortLabel: string;
  format: 'money' | 'number' | 'percent' | 'decimal';
  description?: string;
}

export const DOM_META_METRIC_REGISTRY: DomMetaMetricDef[] = [
  { id: 'status', label: 'Status', shortLabel: 'Status', format: 'number' },
  { id: 'spend', label: 'Spent', shortLabel: 'Spent', format: 'money' },
  { id: 'result', label: 'Result', shortLabel: 'Result', format: 'number' },
  { id: 'cpr', label: 'Cost per result', shortLabel: 'CPR', format: 'money' },
  { id: 'cpm', label: 'CPM', shortLabel: 'CPM', format: 'money' },
  { id: 'cpp', label: 'CPP (Cost / 1k Reach)', shortLabel: 'CPP', format: 'money' },
  { id: 'reach', label: 'Reach', shortLabel: 'Reach', format: 'number' },
  { id: 'impressions', label: 'Impressions', shortLabel: 'Impr.', format: 'number' },
  { id: 'frequency', label: 'Frequency', shortLabel: 'Freq.', format: 'decimal' },
  { id: 'clicks', label: 'All Clicks', shortLabel: 'Clicks', format: 'number' },
  { id: 'unique_clicks', label: 'Unique Clicks', shortLabel: 'Uniq. Click', format: 'number' },
  { id: 'link_click', label: 'Link Clicks', shortLabel: 'Link Click', format: 'number' },
  { id: 'outbound_click', label: 'Outbound Clicks', shortLabel: 'Outbound', format: 'number' },
  { id: 'lpv', label: 'Landing Page Views', shortLabel: 'LPV', format: 'number' },
  { id: 'lpv_rate', label: 'Connect Rate (LPV/Link)', shortLabel: 'LPV %', format: 'percent' },
  { id: 'cost_per_lpv', label: 'Cost per LPV', shortLabel: 'CP-LPV', format: 'money' },
  { id: 'ctr', label: 'CTR (%)', shortLabel: 'CTR', format: 'percent' },
  { id: 'unique_ctr', label: 'Unique CTR (%)', shortLabel: 'Uniq. CTR', format: 'percent' },
  { id: 'cpc', label: 'CPC', shortLabel: 'CPC', format: 'money' },
  { id: 'leads', label: 'Leads', shortLabel: 'Leads', format: 'number' },
  { id: 'messages', label: 'Mess. Started', shortLabel: 'Messages', format: 'number' },
  { id: 'message_connection', label: 'Mess. Connection', shortLabel: 'Mess. Conn', format: 'number' },
  { id: 'msg_reply', label: 'Mess. First Reply', shortLabel: '1st Reply', format: 'number' },
  { id: 'msg_depth_2', label: 'Mess. Depth 2+ (Hội thoại)', shortLabel: 'Msg 2+', format: 'number' },
  { id: 'msg_depth_3', label: 'Mess. Depth 3+ (Sâu)', shortLabel: 'Msg 3+', format: 'number' },
  { id: 'view_content', label: 'View Content', shortLabel: 'ViewContent', format: 'number' },
  { id: 'add_to_cart', label: 'Add to Cart', shortLabel: 'ATC', format: 'number' },
  { id: 'initiate_checkout', label: 'Initiate Checkout', shortLabel: 'Checkout', format: 'number' },
  { id: 'purchases', label: 'Purchases', shortLabel: 'Purchases', format: 'number' },
  { id: 'aov', label: 'Avg Order Value (AOV)', shortLabel: 'AOV', format: 'money' },
  { id: 'roas', label: 'Purchase ROAS', shortLabel: 'ROAS', format: 'decimal' },
  { id: 'reaction', label: 'Reactions', shortLabel: 'Reaction', format: 'number' },
  { id: 'comments', label: 'Comments', shortLabel: 'Comments', format: 'number' },
  { id: 'shares', label: 'Shares', shortLabel: 'Shares', format: 'number' },
  { id: 'post_save', label: 'Post Saves', shortLabel: 'Saves', format: 'number' },
  { id: 'photo_view', label: 'Photo Views', shortLabel: 'Photo', format: 'number' },
  { id: 'post_engagement', label: 'Post Engagement', shortLabel: 'Engagement', format: 'number' },
  { id: 'video_play', label: 'Video Plays', shortLabel: 'Video Plays', format: 'number' },
  { id: 'video_3s', label: '3s Video Views', shortLabel: '3s Views', format: 'number' },
  { id: 'thruplay', label: 'ThruPlays', shortLabel: 'ThruPlays', format: 'number' },
  { id: 'video_avg_time', label: 'Avg Watch Time (giây)', shortLabel: 'Avg Watch(s)', format: 'decimal' },
  { id: 'video_p25', label: 'Video 25%', shortLabel: '25%', format: 'number' },
  { id: 'video_p50', label: 'Video 50%', shortLabel: '50%', format: 'number' },
  { id: 'video_p75', label: 'Video 75%', shortLabel: '75%', format: 'number' },
  { id: 'video_p95', label: 'Video 95%', shortLabel: '95%', format: 'number' },
  { id: 'video_p100', label: 'Video 100%', shortLabel: '100%', format: 'number' },
  { id: 'completion_rate', label: 'Video Completion (%)', shortLabel: 'Complete %', format: 'percent' },
  { id: 'hook_rate', label: 'Hook Rate (3s/Impr)', shortLabel: 'Hook Rate', format: 'percent' },
  { id: 'hold_rate', label: 'Hold Rate (ThruPlay/3s)', shortLabel: 'Hold Rate', format: 'percent' },
  { id: 'follows', label: 'Page Likes / Follows', shortLabel: 'Follows', format: 'number' },
];

export const DOM_META_SUMMARY_KPI_OPTIONS: Array<{
  id: string;
  label: string;
  shortLabel: string;
  format: 'money' | 'number' | 'percent' | 'decimal';
}> = [
  { id: 'reach', label: 'Reach (Lượt tiếp cận)', shortLabel: 'Reach', format: 'number' },
  { id: 'leads', label: 'Leads (Khách tiềm năng)', shortLabel: 'Leads', format: 'number' },
  { id: 'impressions', label: 'Impressions (Hiển thị)', shortLabel: 'Impressions', format: 'number' },
  { id: 'messages', label: 'Mess. Started (Tin nhắn mới)', shortLabel: 'Mess. Started', format: 'number' },
  { id: 'message_connection', label: 'Mess. Connection (Kết nối)', shortLabel: 'Mess. Connection', format: 'number' },
  { id: 'cpm', label: 'CPM (Mỗi 1.000 hiển thị)', shortLabel: 'CPM', format: 'money' },
  { id: 'cpc', label: 'CPC (Mỗi lượt click)', shortLabel: 'CPC', format: 'money' },
  { id: 'ctr', label: 'CTR (Tỷ lệ nhấp %)', shortLabel: 'CTR', format: 'percent' },
  { id: 'frequency', label: 'Frequency (Tần suất)', shortLabel: 'Frequency', format: 'decimal' },
  { id: 'clicks', label: 'All Clicks (Tổng click)', shortLabel: 'All Clicks', format: 'number' },
  { id: 'link_click', label: 'Link Clicks', shortLabel: 'Link Clicks', format: 'number' },
  { id: 'purchases', label: 'Purchases (Mua hàng)', shortLabel: 'Purchases', format: 'number' },
  { id: 'roas', label: 'Purchase ROAS', shortLabel: 'ROAS', format: 'decimal' },
  { id: 'post_engagement', label: 'Post Engagement (Tương tác)', shortLabel: 'Post Engagement', format: 'number' },
  { id: 'reaction', label: 'Reactions (Cảm xúc)', shortLabel: 'Reactions', format: 'number' },
  { id: 'comments', label: 'Comments (Bình luận)', shortLabel: 'Comments', format: 'number' },
  { id: 'shares', label: 'Shares (Chia sẻ)', shortLabel: 'Shares', format: 'number' },
  { id: 'follows', label: 'Page Likes / Follows', shortLabel: 'Follows', format: 'number' },
  { id: 'photo_view', label: 'Photo Views (Xem ảnh)', shortLabel: 'Photo Views', format: 'number' },
  { id: 'video_play', label: 'Video Plays (Phát video)', shortLabel: 'Video Plays', format: 'number' },
  { id: 'video_3s', label: '3s Video Views', shortLabel: '3s Views', format: 'number' },
  { id: 'thruplay', label: 'ThruPlays', shortLabel: 'ThruPlays', format: 'number' },
  { id: 'hook_rate', label: 'Hook Rate (3s/Impr)', shortLabel: 'Hook Rate', format: 'percent' },
  { id: 'hold_rate', label: 'Hold Rate (ThruPlay/3s)', shortLabel: 'Hold Rate', format: 'percent' },
  { id: 'lpv', label: 'Landing Page Views (LPV)', shortLabel: 'LPV', format: 'number' },
  { id: 'lpv_rate', label: 'Connect Rate (LPV/Link %)', shortLabel: 'Connect Rate', format: 'percent' },
  { id: 'outbound_click', label: 'Outbound Clicks', shortLabel: 'Outbound Clicks', format: 'number' },
  { id: 'unique_clicks', label: 'Unique Clicks (Người nhấp)', shortLabel: 'Unique Clicks', format: 'number' },
  { id: 'msg_depth_2', label: 'Mess. Depth 2+ (Tương tác 2 chiều)', shortLabel: 'Msg Depth 2+', format: 'number' },
  { id: 'msg_depth_3', label: 'Mess. Depth 3+ (Hội thoại sâu)', shortLabel: 'Msg Depth 3+', format: 'number' },
  { id: 'add_to_cart', label: 'Add to Cart (Giỏ hàng)', shortLabel: 'Add to Cart', format: 'number' },
  { id: 'initiate_checkout', label: 'Initiate Checkout', shortLabel: 'Checkout', format: 'number' },
  { id: 'video_avg_time', label: 'Avg Watch Time (Giây)', shortLabel: 'Avg Watch (s)', format: 'decimal' },
  { id: 'post_save', label: 'Post Saves (Lưu bài)', shortLabel: 'Post Saves', format: 'number' },
];

export interface DomMetaActionMap {
  [actionType: string]: number;
}

export interface DomMetaTargetingSpec {
  age_min?: number;
  age_max?: number;
  age_range?: [number, number];
  genders?: Array<number | string>;
  geo_locations?: {
    cities?: Array<{ name?: string; radius?: number; distance_unit?: string }>;
    regions?: Array<{ name?: string }>;
    countries?: string[];
    custom_locations?: Array<{ name?: string; radius?: number; distance_unit?: string }>;
    places?: Array<{ name?: string; radius?: number; distance_unit?: string }>;
  };
  publisher_platforms?: string[];
  device_platforms?: string[];
  flexible_spec?: Array<Record<string, Array<{ id?: string; name?: string }>>>;
  custom_audiences?: Array<{ id?: string; name?: string }>;
  excluded_custom_audiences?: Array<{ id?: string; name?: string }>;
  targeting_automation?: { advantage_audience?: number };
  locales?: number[];
}

export interface DomMetaAdNode {
  id: string;
  name: string;
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  status: string;
  effective_status: string;
  optimization_goal: string;
  thumbnail_url: string;
  image_url: string;
  post_url: string;
  story_id: string;
  creative_title?: string;
  creative_body?: string;
  cta_type?: string;
  link_url?: string;
  instagram_permalink_url?: string;
  quality_ranking?: string;
  engagement_rate_ranking?: string;
  conversion_rate_ranking?: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  unique_clicks?: number;
  link_click: number;
  outbound_click?: number;
  lpv?: number;
  lpv_rate?: number;
  cost_per_lpv?: number;
  leads: number;
  messages: number;
  message_connection?: number;
  msg_reply?: number;
  msg_depth_2?: number;
  msg_depth_3?: number;
  view_content?: number;
  add_to_cart?: number;
  initiate_checkout?: number;
  purchases: number;
  purchase_value: number;
  aov?: number;
  roas: number;
  reaction: number;
  comments: number;
  shares: number;
  post_save?: number;
  photo_view?: number;
  follows: number;
  post_engagement: number;
  video_play: number;
  video_3s: number;
  video_avg_time?: number;
  video_p25: number;
  video_p50: number;
  video_p75: number;
  video_p95: number;
  video_p100?: number;
  completion_rate?: number;
  thruplay: number;
  result: number;
  cpr: number;
  cpm: number;
  cpp?: number;
  cpc: number;
  ctr: number;
  unique_ctr?: number;
  frequency: number;
  hook_rate: number;
  hold_rate: number;
  actions: DomMetaActionMap;
  unique_actions?: DomMetaActionMap;
  cost_per_action?: DomMetaActionMap;
  action_values?: DomMetaActionMap;
}

export interface DomMetaAdsetNode {
  id: string;
  name: string;
  campaign_id: string;
  campaign_name: string;
  status: string;
  effective_status: string;
  optimization_goal: string;
  bid_strategy?: string;
  billing_event?: string;
  destination_type?: string;
  learning_stage_status?: string;
  daily_budget: number;
  lifetime_budget: number;
  budget_remaining?: number;
  start_time?: string;
  end_time?: string;
  targeting?: DomMetaTargetingSpec | null;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  unique_clicks?: number;
  link_click: number;
  outbound_click?: number;
  lpv?: number;
  lpv_rate?: number;
  cost_per_lpv?: number;
  leads: number;
  messages: number;
  message_connection?: number;
  msg_reply?: number;
  msg_depth_2?: number;
  msg_depth_3?: number;
  view_content?: number;
  add_to_cart?: number;
  initiate_checkout?: number;
  purchases: number;
  purchase_value: number;
  aov?: number;
  roas: number;
  reaction: number;
  comments: number;
  shares?: number;
  post_save?: number;
  photo_view?: number;
  follows: number;
  post_engagement: number;
  video_play: number;
  video_3s: number;
  video_avg_time?: number;
  video_p25: number;
  video_p50: number;
  video_p75: number;
  video_p95: number;
  video_p100?: number;
  completion_rate?: number;
  thruplay: number;
  result: number;
  cpr: number;
  cpm: number;
  cpp?: number;
  cpc: number;
  ctr: number;
  unique_ctr?: number;
  frequency: number;
  hook_rate: number;
  hold_rate: number;
  actions: DomMetaActionMap;
  unique_actions?: DomMetaActionMap;
  cost_per_action?: DomMetaActionMap;
  action_values?: DomMetaActionMap;
  ads: DomMetaAdNode[];
}

export interface DomMetaCampaignNode {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  objective: string;
  optimization_goal: string;
  buying_type?: string;
  bid_strategy?: string;
  daily_budget?: number;
  lifetime_budget?: number;
  budget_remaining?: number;
  start_time?: string;
  stop_time?: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  unique_clicks?: number;
  link_click: number;
  outbound_click?: number;
  lpv?: number;
  lpv_rate?: number;
  cost_per_lpv?: number;
  leads: number;
  messages: number;
  message_connection?: number;
  msg_reply?: number;
  msg_depth_2?: number;
  msg_depth_3?: number;
  view_content?: number;
  add_to_cart?: number;
  initiate_checkout?: number;
  purchases: number;
  purchase_value: number;
  aov?: number;
  roas: number;
  reaction: number;
  comments: number;
  shares?: number;
  post_save?: number;
  photo_view?: number;
  follows: number;
  post_engagement: number;
  video_play: number;
  video_3s: number;
  video_avg_time?: number;
  video_p25: number;
  video_p50: number;
  video_p75: number;
  video_p95: number;
  video_p100?: number;
  completion_rate?: number;
  thruplay: number;
  result: number;
  cpr: number;
  cpm: number;
  cpp?: number;
  cpc: number;
  ctr: number;
  unique_ctr?: number;
  frequency: number;
  hook_rate: number;
  hold_rate: number;
  actions: DomMetaActionMap;
  unique_actions?: DomMetaActionMap;
  cost_per_action?: DomMetaActionMap;
  action_values?: DomMetaActionMap;
  adsets: DomMetaAdsetNode[];
}

export interface DomMetaDailyPoint {
  date: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  leads: number;
  messages: number;
  follows: number;
  cpm: number;
  result?: number;
  cpr?: number;
}

export interface DomMetaPlatformSlice {
  platform: string;
  rawPlatform?: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks?: number;
  ctr?: number;
  result: number;
  cpr?: number;
}

export interface DomMetaPositionSlice {
  platform: string;
  position: string;
  label: string;
  rawPlatform?: string;
  rawPosition?: string;
  spend: number;
  impressions: number;
  clicks: number;
  result: number;
  cpr?: number;
  ctr?: number;
}

export interface DomMetaAgeGenderBucket {
  age: string;
  maleSpend: number;
  femaleSpend: number;
  unknownSpend: number;
  totalSpend: number;
  maleResult: number;
  femaleResult: number;
  unknownResult?: number;
  totalResult?: number;
  reach?: number;
  clicks?: number;
}

export interface DomMetaRegionRow {
  region: string;
  country?: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks?: number;
  ctr?: number;
  result: number;
  cpr?: number;
}

export interface DomMetaDeviceRow {
  device: string;
  rawDevice?: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach?: number;
  result?: number;
  cpr?: number;
  ctr?: number;
}

export interface DomMetaHourlyCell {
  dayOfWeek: number; // 0 (Sun) .. 6 (Sat)
  hour: number; // 0 .. 23
  spend: number;
  clicks: number;
  leads: number;
  messages: number;
  purchases: number;
  impressions: number;
  result?: number;
  cpr?: number;
}

export interface DomMetaActivityLogItem {
  event_time: string;
  event_type: string;
  translated_event_type: string;
  actor_name: string;
  object_name: string;
  category: string;
  extra_data?: string;
}

export interface DomMetaAccountOverview {
  account_id: string;
  name: string;
  currency: string;
  balance: number;
  amount_spent: number;
  spend_cap?: number;
  funding_source: string;
  account_status: number;
  timezone_name?: string;
  business_name?: string;
  business_address?: string;
  tax_id?: string;
}

export interface DomMetaMonthlyPoint {
  month: string; // 'T1'..'T12'
  monthKey: string; // '2026-01'
  spend: number;
  leads: number;
  reach: number;
  messages: number;
  follows: number;
}

export interface DomGoogleAdsDimBucket {
  key: string;
  imp: number;
  click: number;
  conv: number;
  cost: number;
  visits: number;
  dir: number;
  calls: number;
  menu: number;
  orders: number;
}

export interface DomGoogleAdsHourlySlot {
  hour: number;
  imp: number;
  click: number;
  spent: number;
  conv: number;
  visits: number;
  dir: number;
  calls: number;
}

export interface DomGoogleAdsRow {
  date: string;
  campaign: string;
  campaign_id: string;
  customer_id?: string;
  spent: number;
  impression: number;
  click: number;
  ctr: number;
  all_conversions: number;
  directions: number;
  calls: number;
  menu: number;
  orders: number;
  other: number;
  store_visits: number;
  mobile: number;
  desktop: number;
  tablet: number;
  mobile_spent?: number;
  desktop_spent?: number;
  tablet_spent?: number;
  lead_forms?: number;
  hourly?: unknown;
  channels?: unknown;
  locations?: unknown;
  distances?: unknown;
}

export interface DomGoogleAdsKeywordItem {
  keyword: string;
  adGroup: string;
  matchType: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  spent: number;
  impressionShare: string;
}

export interface DomGoogleAdsSearchTermItem {
  searchTerm: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spent: number;
}

export interface DomMetaTotalsSnapshot {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  unique_clicks?: number;
  link_click?: number;
  outbound_click?: number;
  lpv?: number;
  lpv_rate?: number;
  cost_per_lpv?: number;
  leads: number;
  messages: number;
  message_connection?: number;
  msg_reply?: number;
  msg_depth_2?: number;
  msg_depth_3?: number;
  view_content?: number;
  add_to_cart?: number;
  initiate_checkout?: number;
  purchases: number;
  purchase_value?: number;
  aov?: number;
  roas?: number;
  video_play?: number;
  video_3s?: number;
  video_avg_time?: number;
  video_p25?: number;
  video_p50?: number;
  video_p75?: number;
  video_p95?: number;
  video_p100?: number;
  completion_rate?: number;
  thruplay?: number;
  post_engagement?: number;
  reaction?: number;
  comments?: number;
  shares?: number;
  post_save?: number;
  photo_view?: number;
  follows: number;
  cpm: number;
  cpp?: number;
  cpc?: number;
  ctr?: number;
  unique_ctr?: number;
  frequency?: number;
  hook_rate?: number;
  hold_rate?: number;
}

export interface DomMetaDashboardDataset {
  dateRange: { since: string; until: string; prevSince: string; prevUntil: string };
  currentTotals: {
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    unique_clicks?: number;
    link_click: number;
    outbound_click?: number;
    lpv?: number;
    lpv_rate?: number;
    cost_per_lpv?: number;
    leads: number;
    messages: number;
    message_connection?: number;
    msg_reply?: number;
    msg_depth_2?: number;
    msg_depth_3?: number;
    view_content?: number;
    add_to_cart?: number;
    initiate_checkout?: number;
    purchases: number;
    purchase_value: number;
    aov?: number;
    roas: number;
    video_play: number;
    video_3s: number;
    video_avg_time?: number;
    video_p25?: number;
    video_p50?: number;
    video_p75?: number;
    video_p95?: number;
    video_p100?: number;
    completion_rate?: number;
    thruplay: number;
    post_engagement: number;
    reaction: number;
    comments: number;
    shares?: number;
    post_save?: number;
    photo_view?: number;
    follows: number;
    cpm: number;
    cpp?: number;
    cpc: number;
    ctr: number;
    unique_ctr?: number;
    frequency: number;
    hook_rate: number;
    hold_rate: number;
  };
  prevTotals: DomMetaTotalsSnapshot;
  counts: {
    activeCampaigns: number;
    totalCampaigns: number;
    activeAdsets: number;
    totalAdsets: number;
    activeAds: number;
    totalAds: number;
  };
  daily: DomMetaDailyPoint[];
  campaigns: DomMetaCampaignNode[];
  platforms: DomMetaPlatformSlice[];
  positions: DomMetaPositionSlice[];
  platformDevices?: DomMetaPositionSlice[];
  ageGender: DomMetaAgeGenderBucket[];
  regions: DomMetaRegionRow[];
  countries?: DomMetaRegionRow[];
  devices: DomMetaDeviceRow[];
  heatmap: DomMetaHourlyCell[];
  hourlyAudience?: DomMetaEntityHourPoint[];
  accountOverview: DomMetaAccountOverview | null;
  monthlyByYear: DomMetaMonthlyPoint[];
  activities: DomMetaActivityLogItem[];
  actions?: DomMetaActionMap;
  uniqueActions?: DomMetaActionMap;
  actionValues?: DomMetaActionMap;
}

export function formatDomMoney(val: number, currency = 'VND'): string {
  const num = Number.isFinite(val) ? val : 0;
  if (currency === 'VND') {
    return `${Math.round(num).toLocaleString('en-US')}đ`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(num);
}

export function formatDomMoneyShort(val: number, currency = 'VND'): string {
  const num = Number.isFinite(val) ? val : 0;
  const abs = Math.abs(num);
  const suffix = currency === 'VND' ? 'đ' : '';
  const prefix = currency === 'USD' ? '$' : '';
  if (abs >= 1e9) return `${prefix}${(num / 1e9).toFixed(2)}B${suffix}`;
  if (abs >= 1e6) return `${prefix}${(num / 1e6).toFixed(2)}M${suffix}`;
  if (abs >= 1e3) return `${prefix}${Math.round(num / 1e3)}K${suffix}`;
  return `${prefix}${Math.round(num)}${suffix}`;
}

export function formatDomNumber(val: number): string {
  const num = Number.isFinite(val) ? val : 0;
  return Math.round(num).toLocaleString('vi-VN');
}

export function calcDeltaPercent(curr: number, prev: number): number | null {
  if (!Number.isFinite(prev) || prev <= 0) return curr > 0 ? 100 : null;
  return ((curr - prev) / prev) * 100;
}

export function resolveDateRangeFromPreset(
  preset: DomMetaDatePreset,
  customStart?: string,
  customEnd?: string
): { since: string; until: string; prevSince: string; prevUntil: string; label: string } {
  const now = new Date();
  const toIso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let label = 'Last 7 days';

  switch (preset) {
    case 'today':
      label = 'Today';
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      label = 'Yesterday';
      break;
    case 'yesterday_to_today':
      start.setDate(start.getDate() - 1);
      label = 'Yesterday - Today';
      break;
    case 'last_7days':
      start.setDate(start.getDate() - 6);
      label = 'Last 7 days';
      break;
    case 'last_30days':
      start.setDate(start.getDate() - 29);
      label = 'Last 30 days';
      break;
    case 'this_week': {
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      label = 'This Week';
      break;
    }
    case 'last_week': {
      const day = start.getDay() || 7;
      end.setDate(end.getDate() - day);
      start = new Date(end);
      start.setDate(end.getDate() - 6);
      label = 'Last Week';
      break;
    }
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      label = 'This Month';
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      label = 'Last Month';
      break;
    case 'custom_range':
      if (customStart && customEnd) {
        start = new Date(`${customStart}T00:00:00`);
        end = new Date(`${customEnd}T00:00:00`);
      } else {
        start.setDate(start.getDate() - 6);
      }
      label = 'Custom Date';
      break;
  }

  if (start > end) {
    const tmp = start;
    start = end;
    end = tmp;
  }

  const diffMs = Math.max(86_400_000, end.getTime() - start.getTime() + 86_400_000);
  const prevEnd = new Date(start.getTime() - 86_400_000);
  const prevStart = new Date(prevEnd.getTime() - diffMs + 86_400_000);

  return {
    since: toIso(start),
    until: toIso(end),
    prevSince: toIso(prevStart),
    prevUntil: toIso(prevEnd),
    label,
  };
}

export function formatIsoToVnDisplay(iso: string): string {
  const parts = String(iso || '').split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/** Safe, CSP-compliant recursive-descent arithmetic evaluator (no Function/eval) */
function evalSafeArithmetic(expr: string): number {
  let pos = 0;
  const s = expr.replace(/\s+/g, '');
  if (!s || !/^[0-9+\-*/().]+$/.test(s)) return 0;

  const parseExpression = (): number => {
    let val = parseTerm();
    while (pos < s.length && (s[pos] === '+' || s[pos] === '-')) {
      const op = s[pos++];
      const rhs = parseTerm();
      val = op === '+' ? val + rhs : val - rhs;
    }
    return val;
  };

  const parseTerm = (): number => {
    let val = parseFactor();
    while (pos < s.length && (s[pos] === '*' || s[pos] === '/')) {
      const op = s[pos++];
      const rhs = parseFactor();
      if (op === '*') {
        val *= rhs;
      } else {
        if (rhs === 0) return Number.NaN;
        val /= rhs;
      }
    }
    return val;
  };

  const parseFactor = (): number => {
    if (s[pos] === '+') {
      pos++;
      return parseFactor();
    }
    if (s[pos] === '-') {
      pos++;
      return -parseFactor();
    }
    if (s[pos] === '(') {
      pos++;
      const inner = parseExpression();
      if (s[pos] !== ')') return Number.NaN;
      pos++;
      return inner;
    }
    const start = pos;
    while (pos < s.length && ((s[pos] >= '0' && s[pos] <= '9') || s[pos] === '.')) {
      pos++;
    }
    if (start === pos) return Number.NaN;
    return Number(s.slice(start, pos));
  };

  const result = parseExpression();
  if (pos !== s.length || !Number.isFinite(result)) return 0;
  return result;
}

export function evaluateCustomFormula(
  formula: string,
  row: Record<string, unknown>
): number {
  if (!formula) return 0;
  const num = (v: unknown) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };
  const aliasMap: Record<string, number> = {
    spend: num(row.spend),
    impressions: num(row.impressions),
    reach: num(row.reach),
    clicks: num(row.clicks),
    unique_clicks: num(row.unique_clicks),
    link_click: num(row.link_click),
    outbound_click: num(row.outbound_click),
    lpv: num(row.lpv),
    lpv_rate: num(row.lpv_rate),
    cost_per_lpv: num(row.cost_per_lpv),
    result: num(row.result),
    leads: num(row.leads),
    messages: num(row.messages),
    msg_reply: num(row.msg_reply),
    msg_depth_2: num(row.msg_depth_2),
    msg_depth_3: num(row.msg_depth_3),
    view_content: num(row.view_content),
    add_to_cart: num(row.add_to_cart),
    initiate_checkout: num(row.initiate_checkout),
    purchases: num(row.purchases),
    aov: num(row.aov),
    roas: num(row.roas),
    video_view: num(row.video_play || row.video_3s),
    video_play: num(row.video_play),
    video_3s: num(row.video_3s),
    video_avg_time: num(row.video_avg_time),
    completion_rate: num(row.completion_rate),
    thruplay: num(row.thruplay),
    post_engagement: num(row.post_engagement),
    reaction: num(row.reaction),
    comments: num(row.comments),
    shares: num(row.shares),
    post_save: num(row.post_save),
    follows: num(row.follows),
    cpr: num(row.cpr),
    cpm: num(row.cpm),
    cpp: num(row.cpp),
    cpc: num(row.cpc),
    ctr: num(row.ctr),
    unique_ctr: num(row.unique_ctr),
    hook_rate: num(row.hook_rate),
    hold_rate: num(row.hold_rate),
  };

  const formatNumericToken = (v: number): string => {
    if (!Number.isFinite(v) || v === 0) return '0';
    const plain = Math.abs(v) < 1e-6 || Math.abs(v) >= 1e15
      ? v.toFixed(10).replace(/\.?0+$/, '') || '0'
      : String(v);
    return v < 0 ? `(${plain})` : plain;
  };

  const expr = formula.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const v = aliasMap[key] ?? num(row[key]);
    return formatNumericToken(v);
  });

  return evalSafeArithmetic(expr);
}

function parseJsonValue(raw: unknown): unknown {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return null;
    }
  }
  return null;
}

export function parseGoogleAdsHourlyFromRows(
  rows: DomGoogleAdsRow[],
  campaignFilter = '__all__'
): DomGoogleAdsHourlySlot[] {
  const slots: DomGoogleAdsHourlySlot[] = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    imp: 0,
    click: 0,
    spent: 0,
    conv: 0,
    visits: 0,
    dir: 0,
    calls: 0,
  }));

  const targetRows =
    campaignFilter === '__all__' ? rows : rows.filter((r) => r.campaign === campaignFilter);

  for (const row of targetRows) {
    const parsed = parseJsonValue(row.hourly);
    if (!parsed) continue;
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;
        const rec = item as Record<string, unknown>;
        const h = Number(rec.h ?? rec.hour ?? -1);
        if (!Number.isInteger(h) || h < 0 || h > 23) continue;
        slots[h].imp += Number(rec.imp ?? rec.impressions ?? 0) || 0;
        slots[h].click += Number(rec.click ?? rec.clicks ?? 0) || 0;
        slots[h].spent += Number(rec.spent ?? rec.cost ?? 0) || 0;
        slots[h].conv += Number(rec.conv ?? rec.conversions ?? 0) || 0;
        slots[h].visits += Number(rec.visits ?? rec.store_visits ?? 0) || 0;
        slots[h].dir += Number(rec.dir ?? rec.directions ?? 0) || 0;
        slots[h].calls += Number(rec.calls ?? 0) || 0;
      }
    } else if (typeof parsed === 'object') {
      for (const [k, val] of Object.entries(parsed as Record<string, unknown>)) {
        const h = parseInt(k, 10);
        if (!Number.isInteger(h) || h < 0 || h > 23) continue;
        if (typeof val === 'number') {
          slots[h].click += val;
        } else if (val && typeof val === 'object') {
          const rec = val as Record<string, unknown>;
          slots[h].imp += Number(rec.imp ?? rec.impressions ?? 0) || 0;
          slots[h].click += Number(rec.click ?? rec.clicks ?? 0) || 0;
          slots[h].spent += Number(rec.spent ?? rec.cost ?? 0) || 0;
          slots[h].conv += Number(rec.conv ?? rec.conversions ?? 0) || 0;
          slots[h].visits += Number(rec.visits ?? rec.store_visits ?? 0) || 0;
        }
      }
    }
  }
  return slots;
}

function aggregateGoogleAdsDimension(
  rows: DomGoogleAdsRow[],
  field: 'channels' | 'locations',
  keyExtract: (entry: Record<string, unknown>) => string,
  campaignFilter = '__all__'
): DomGoogleAdsDimBucket[] {
  const map = new Map<string, DomGoogleAdsDimBucket>();
  const targetRows =
    campaignFilter === '__all__' ? rows : rows.filter((r) => r.campaign === campaignFilter);

  const upsert = (key: string, rec: Record<string, unknown>) => {
    const cleanKey = key.trim();
    if (!cleanKey) return;
    const cur = map.get(cleanKey) || {
      key: cleanKey,
      imp: 0,
      click: 0,
      conv: 0,
      cost: 0,
      visits: 0,
      dir: 0,
      calls: 0,
      menu: 0,
      orders: 0,
    };
    cur.imp += Number(rec.imp ?? rec.impressions ?? rec.Impression ?? 0) || 0;
    cur.click += Number(rec.click ?? rec.clicks ?? rec.Click ?? 0) || 0;
    cur.conv += Number(rec.conv ?? rec.conversions ?? rec['All Conversions'] ?? 0) || 0;
    cur.cost += Number(rec.cost ?? rec.spent ?? rec.Spent ?? 0) || 0;
    cur.visits += Number(rec.visits ?? rec.store_visits ?? rec['Store Visits'] ?? 0) || 0;
    cur.dir += Number(rec.dir ?? rec.directions ?? rec.Directions ?? 0) || 0;
    cur.calls += Number(rec.calls ?? rec.Calls ?? 0) || 0;
    cur.menu += Number(rec.menu ?? rec.Menu ?? 0) || 0;
    cur.orders += Number(rec.orders ?? rec.Orders ?? 0) || 0;
    map.set(cleanKey, cur);
  };

  for (const row of targetRows) {
    const parsed = parseJsonValue(row[field]);
    if (!parsed) continue;
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;
        const rec = item as Record<string, unknown>;
        upsert(keyExtract(rec), rec);
      }
    } else if (typeof parsed === 'object') {
      for (const [k, val] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof val === 'number') {
          upsert(k, { cost: val, click: val });
        } else if (val && typeof val === 'object') {
          upsert(k, val as Record<string, unknown>);
        }
      }
    }
  }

  return Array.from(map.values());
}

export function parseGoogleAdsChannelsFromRows(
  rows: DomGoogleAdsRow[],
  campaignFilter = '__all__'
): DomGoogleAdsDimBucket[] {
  return aggregateGoogleAdsDimension(
    rows,
    'channels',
    (e) => String(e.ch ?? e.channel ?? e.name ?? 'Search'),
    campaignFilter
  );
}

export function parseGoogleAdsLocationsFromRows(
  rows: DomGoogleAdsRow[],
  campaignFilter = '__all__'
): DomGoogleAdsDimBucket[] {
  const list = aggregateGoogleAdsDimension(
    rows,
    'locations',
    (e) => String(e.name ?? e.location ?? (e.id ? `Loc_${String(e.id)}` : '')),
    campaignFilter
  );
  const isTotalVn = (k: string) =>
    /^vi[eệ]t\s*nam\s*\(t[oổ]ng\)$/i.test(k) || k === 'Vi?t Nam (T?ng)';
  const hasSubLocations = list.some((item) => !isTotalVn(item.key));
  return hasSubLocations ? list.filter((item) => !isTotalVn(item.key)) : list;
}

export const GOOGLE_ADS_APPSCRIPT_SCOPES_JSON = `{
  "timeZone": "Asia/Ho_Chi_Minh",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/adwords",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}`;

export const GOOGLE_ADS_MCC_QUICK_STEPS = [
  {
    step: '01',
    title: 'Nhập 1 hoặc nhiều Google Ads ID',
    desc: 'Điền mã 10 chữ số (VD: 227-521-6666). Một Workspace có thể thêm nhiều Google Ads ID cùng nằm trong MCC DOMATION để xem riêng hoặc gộp chung.',
  },
  {
    step: '02',
    title: 'Gửi yêu cầu mời MCC & Chấp nhận',
    desc: 'Hệ thống tự gửi Email tới bộ phận MCC DOMATION (domation.net@gmail.com). Khi nhận được lời mời liên kết trong Google Ads, bạn bấm Chấp nhận (Accept).',
  },
  {
    step: '03',
    title: 'Nhập mã OTP 6 số chủ tài khoản',
    desc: 'Để chống tuyệt đối bên khác gắn nhầm ID của bạn, hệ thống gửi mã OTP 6 số trực tiếp tới email quản trị viên Google Ads của ID đó — nhập mã xong là lên báo cáo ngay.',
  },
];

export const GOOGLE_ADS_SETUP_STEPS = [
  {
    step: '01',
    title: 'Lấy Google Ads Customer ID',
    desc: 'Đăng nhập tài khoản Google Ads cần báo cáo, nhìn góc phải trên cùng và sao chép mã định danh 10 chữ số dạng XXX-XXX-XXXX (ví dụ: 295-339-0933).',
  },
  {
    step: '02',
    title: 'Tạo Google Sheet & Mở Apps Script',
    desc: 'Tạo 1 Google Sheet mới làm bộ đệm đồng bộ (hoặc dùng chế độ Direct API), vào menu Tiện ích mở rộng (Extensions) → Apps Script.',
  },
  {
    step: '03',
    title: 'Cấp Quyền OAuth Scopes trong appsscript.json',
    desc: 'Vào Cài đặt dự án (Project Settings) → tích chọn "Hiển thị tệp kê khai appsscript.json", sau đó dán khối cấu hình quyền adwords & spreadsheets.',
  },
  {
    step: '04',
    title: 'Deploy Web App & Bật Trigger Tự Động',
    desc: 'Bấm Triển khai (Deploy) → Tùy chọn triển khai mới → chọn Ứng dụng Web (Execute as: Me, Who has access: Anyone) và sao chép đường dẫn .../exec.',
  },
  {
    step: '05',
    title: 'Dán URL & Kiểm Tra Kết Nối Trực Tiếp',
    desc: 'Nhập Customer ID và Web App URL vào ô bên dưới, bấm Kiểm tra kết nối để xác thực dữ liệu chiến dịch Google Ads đổ về ngay lập tức.',
  },
];

/** Collect up to `maxCount` unique creative thumbnail URLs from an ad list */
export function collectEntityThumbs(
  ads: Array<{ thumbnail_url?: string; image_url?: string }>,
  maxCount = 3
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const ad of ads) {
    const url = (ad.image_url || ad.thumbnail_url || '').trim();
    if (url && !seen.has(url)) {
      seen.add(url);
      result.push(url);
      if (result.length >= maxCount) break;
    }
  }
  return result;
}

export interface DomMetaEntityDeepBreakdownRow {
  label: string;
  subLabel?: string;
  rawKey?: string;
  rawSubKey?: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr?: number;
  result: number;
  cpr: number;
  sharePct: number;
}

export interface DomMetaEntityDailyPoint {
  date: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  leads: number;
  messages: number;
  purchases: number;
  follows?: number;
  cpm?: number;
  result: number;
  cpr: number;
}

export interface DomMetaEntityHourPoint {
  hour: number;
  label: string;
  spend: number;
  impressions: number;
  clicks: number;
  result: number;
  cpr: number;
}

export interface DomMetaEntityCreativeSpec {
  title?: string;
  body?: string;
  ctaType?: string;
  linkUrl?: string;
  instagramPermalinkUrl?: string;
  objectType?: string;
  videoId?: string;
  pageId?: string;
  imageUrls?: string[];
}

export interface DomMetaEntityDeliveryDiagnostics {
  qualityRanking?: string;
  engagementRateRanking?: string;
  conversionRateRanking?: string;
  bidStrategy?: string;
  billingEvent?: string;
  destinationType?: string;
  learningStageStatus?: string;
  learningStageConversions?: number;
  attributionSummary?: string;
}

export interface DomMetaEntityDeepDetail {
  entityType: 'campaign' | 'adset' | 'ad';
  entityId: string;
  optimizationGoal: string;
  daily: DomMetaEntityDailyPoint[];
  hourly: DomMetaEntityHourPoint[];
  heatmap?: DomMetaHourlyCell[];
  byHourAudience?: DomMetaEntityHourPoint[];
  byDayOfWeek?: DomMetaEntityDeepBreakdownRow[];
  byPlatform: DomMetaEntityDeepBreakdownRow[];
  byPlatformDevice?: DomMetaEntityDeepBreakdownRow[];
  byAgeGender: DomMetaEntityDeepBreakdownRow[];
  ageGenderBuckets?: DomMetaAgeGenderBucket[];
  byRegion: DomMetaEntityDeepBreakdownRow[];
  byCountry?: DomMetaEntityDeepBreakdownRow[];
  byDevice: DomMetaEntityDeepBreakdownRow[];
  targeting: DomMetaTargetingSpec | null;
  creativeSpec?: DomMetaEntityCreativeSpec | null;
  diagnostics?: DomMetaEntityDeliveryDiagnostics | null;
  uniqueActions?: DomMetaActionMap;
  costPerAction?: DomMetaActionMap;
  actionValues?: DomMetaActionMap;
  deliveryEstimate?: {
    usersLowerBound: number;
    usersUpperBound: number;
    ready?: boolean;
  } | null;
  previewIframeHtml?: string | null;
}
