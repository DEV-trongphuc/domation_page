export interface WebPropertyDto {
  id: string;
  name: string;
  domain: string;
  site_key: string;
  pricing_url_pattern: string;
  target_audience_id: string | null;
  target_audience_name?: string | null;
  auto_alert_pricing?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface WebTrackingSummaryDto {
  total_sessions: number;
  identified_leads: number;
  pricing_intent_alerts: number;
  total_pageviews: number;
}

export interface WebSessionDto {
  id: string;
  property_id: string;
  property_name?: string;
  property_domain?: string;
  visitor_token: string;
  lead_id: string | null;
  name?: string;
  phone?: string;
  email?: string;
  lead_score?: number;
  lead_status?: string;
  lifecycle_stage?: string;
  entry_url?: string;
  last_url?: string;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  device_type: string;
  geo_country?: string;
  geo_city?: string | null;
  browser?: string | null;
  os?: string | null;
  duration_seconds?: number;
  pageviews_count: number;
  pricing_intent_detected: boolean;
  started_at?: string;
  last_seen_at?: string;
}

export interface WebEventItemDto {
  id: string;
  event_type: string;
  page_url: string;
  element_selector?: string | null;
  x_pct?: number | null;
  y_pct?: number | null;
  scroll_depth_pct?: number | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface VisitorDetailResponseDto {
  session: WebSessionDto;
  events: WebEventItemDto[];
}

export interface LiveTrafficResponseDto {
  active_now_count: number;
  recent_total_count: number;
  active_visitors: WebSessionDto[];
  top_pages: Array<{ page_url: string; views: number }>;
  by_country: Array<{ country: string; count: number }>;
  by_device: Array<{ device: string; count: number }>;
}

export interface PageDetailsResponseDto {
  page_url: string;
  pageviews: number;
  clicks: number;
  unique_sessions: number;
  identified_leads: number;
  avg_scroll_depth_pct: number;
  top_elements: Array<{ selector: string; count: number }>;
}

export interface HeatmapClickPointDto {
  id: string;
  x_pct: number;
  y_pct: number;
  element_selector: string;
  page_url: string;
}

export interface HeatmapOverlayResponseDto {
  click_points: HeatmapClickPointDto[];
  scroll_reach_pct: {
    depth_25: number;
    depth_50: number;
    depth_75: number;
    depth_100: number;
  };
  tracked_pages?: Array<{ page_url: string; event_count: number }>;
  recent_events?: WebEventItemDto[];
}

export interface WebHeatmapConfigDto {
  id: string;
  property_id: string;
  property_name?: string;
  property_domain?: string;
  name: string;
  page_url_pattern: string;
  device_filter: 'all' | 'desktop' | 'mobile';
  snapshot_html?: string | null;
  viewport_width: number;
  viewport_height: number;
  click_count: number;
  scroll_avg_pct: number;
  is_active: boolean;
  created_at?: string;
}

export interface WebChatMsgDto {
  id: string;
  sender_type: 'customer' | 'bot' | 'agent';
  sender_name?: string;
  content: string;
  created_at?: string;
}

export interface WebChatPageTrailDto {
  page_url: string;
  event_type: string;
  created_at?: string;
}

export interface WebChatConversationDto {
  id: string;
  channel: string;
  customer_name: string;
  extracted_phone?: string | null;
  extracted_email?: string | null;
  lead_id?: string | null;
  lead_name?: string | null;
  lead_score?: number;
  unread_count?: number;
  status?: string;
  last_message_preview?: string;
  last_message_at?: string;
  messages: WebChatMsgDto[];
  page_trail: WebChatPageTrailDto[];
}

export function formatDurationSec(seconds?: number | null): string {
  const s = Math.max(0, Math.round(Number(seconds || 0)));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}p ${rem}s`;
}

export function shortenUrlPath(rawUrl?: string | null): string {
  if (!rawUrl) return '/';
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.pathname || '/'}${parsed.search || ''}`;
  } catch {
    return rawUrl;
  }
}

export function aggregateBuckets(
  values: Array<string | null | undefined>,
  fallbackLabel = 'Trực tiếp (Direct)'
): Array<{ key: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const v of values) {
    const k = (v && String(v).trim()) || fallbackLabel;
    counts[k] = (counts[k] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}
