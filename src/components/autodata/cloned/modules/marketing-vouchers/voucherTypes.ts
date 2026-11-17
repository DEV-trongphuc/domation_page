export type QrModuleShape = 'square' | 'dots' | 'rounded' | 'diamond';
export type QrEyeShape = 'square' | 'rounded' | 'circle';
export type QrGradientMode = 'solid' | 'linear' | 'radial';
export type QrFrameStyle = 'none' | 'bottom_pill' | 'card_badge';

export interface BrandedQrOptions {
  value: string;
  fgColor: string;
  bgColor: string;
  cornerRadius: number;
  logoUrl: string;
  moduleShape?: QrModuleShape;
  eyeFrameShape?: QrEyeShape;
  eyeBallShape?: QrEyeShape;
  eyeColor?: string;
  gradientMode?: QrGradientMode;
  gradientEndColor?: string;
  gradientAngle?: number;
  logoSizePct?: number;
  logoPadding?: number;
  frameStyle?: QrFrameStyle;
  frameText?: string;
  frameColor?: string;
}

export const DEFAULT_QR_DESIGN: BrandedQrOptions = {
  value: 'https://domation.net',
  fgColor: '#1E40FF',
  bgColor: '#FFFFFF',
  cornerRadius: 16,
  logoUrl: '/imgs/autodata/ICON.png',
  moduleShape: 'rounded',
  eyeFrameShape: 'rounded',
  eyeBallShape: 'rounded',
  eyeColor: '#1E40FF',
  gradientMode: 'linear',
  gradientEndColor: '#0284C7',
  gradientAngle: 135,
  logoSizePct: 22,
  logoPadding: 6,
  frameStyle: 'bottom_pill',
  frameText: 'QUÉT NHẬN ƯU ĐÃI',
  frameColor: '#1E40FF',
};

export interface VoucherPoolDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  code_prefix: string;
  discount_type: 'percentage' | 'fixed_vnd' | 'gift';
  discount_value: number;
  min_order_vnd: number;
  max_uses_per_code: number;
  expires_at: string | null;
  status: string;
  total_codes: number;
  claimed_codes: number;
  redeemed_codes: number;
  qr_design?: Partial<BrandedQrOptions>;
  created_at?: string;
}

export interface VoucherPoolPayload {
  name: string;
  description?: string;
  code_prefix: string;
  discount_type: 'percentage' | 'fixed_vnd' | 'gift';
  discount_value: number;
  min_order_vnd: number;
  max_uses_per_code: number;
  expires_at: string | null;
  status?: string;
  auto_generate_count?: number;
  qr_design?: Partial<BrandedQrOptions>;
}

export interface VoucherCodeLogDto {
  id: string;
  code: string;
  status: string;
  lead_id?: string | null;
  name?: string;
  phone?: string;
  email?: string;
  claimed_at?: string | null;
  redeemed_at?: string | null;
  redeemed_order_vnd: number;
  redeemed_by_note?: string;
  created_at?: string;
}

export interface ShortlinkItemDto {
  id: string;
  title: string;
  short_code: string;
  target_url: string;
  custom_domain?: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  qr_design?: Partial<BrandedQrOptions>;
  click_count: number;
  unique_click_count?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface BreakdownBucketDto {
  key: string;
  label?: string;
  count: number;
  pct?: number;
}

export interface RecentLinkClickDto {
  id: string;
  short_link_id?: string;
  short_code?: string;
  title?: string;
  target_url?: string;
  device_type: string;
  referrer?: string | null;
  client_ip?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  lead_name?: string | null;
  clicked_at?: string;
}

export interface ClicksAnalyticsNormalized {
  totalClicks: number;
  uniqueClicks: number;
  devices: BreakdownBucketDto[];
  utmSources: BreakdownBucketDto[];
  utmMediums: BreakdownBucketDto[];
  utmCampaigns: BreakdownBucketDto[];
  referrers: BreakdownBucketDto[];
  recentClicks: RecentLinkClickDto[];
}

export interface PosRedeemResponseDto {
  code: string;
  pool_name: string;
  discount_type: 'percentage' | 'fixed_vnd' | 'gift';
  discount_value: number;
  lead_id: string | null;
  order_vnd: number;
}

export interface PublicVoucherInfoDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  company_name?: string;
  discount_type: 'percentage' | 'fixed_vnd' | 'gift';
  discount_value: number;
  min_order_vnd: number;
  expires_at?: string | null;
  status?: string;
  remaining_codes?: number;
  qr_design?: Partial<BrandedQrOptions>;
}

export interface PublicVoucherClaimResponseDto {
  code: string;
  lead_id?: string | null;
  pool_name?: string;
  discount_type?: 'percentage' | 'fixed_vnd' | 'gift';
  discount_value?: number;
  expires_at?: string | null;
}

export interface ConfettiPieceSpec {
  id: number;
  dx: number;
  dy: number;
  rotate: number;
  color: string;
  size: number;
  delay: number;
}

export const CELEBRATION_CONFETTI_SPECS: ReadonlyArray<ConfettiPieceSpec> = [
  { id: 1, dx: -120, dy: -95, rotate: -140, color: '#1E40FF', size: 9, delay: 0.02 },
  { id: 2, dx: -85, dy: -130, rotate: 95, color: '#06B6D4', size: 8, delay: 0.05 },
  { id: 3, dx: -42, dy: -145, rotate: -65, color: '#10B981', size: 10, delay: 0.03 },
  { id: 4, dx: 0, dy: -155, rotate: 120, color: '#F59E0B', size: 8, delay: 0.01 },
  { id: 5, dx: 46, dy: -142, rotate: -110, color: '#1E40FF', size: 9, delay: 0.04 },
  { id: 6, dx: 88, dy: -126, rotate: 85, color: '#3B82F6', size: 10, delay: 0.06 },
  { id: 7, dx: 124, dy: -92, rotate: 155, color: '#0EA5E9', size: 8, delay: 0.02 },
  { id: 8, dx: -136, dy: -36, rotate: -80, color: '#10B981', size: 7, delay: 0.07 },
  { id: 9, dx: 138, dy: -34, rotate: 110, color: '#F59E0B', size: 7, delay: 0.08 },
  { id: 10, dx: -98, dy: 38, rotate: -160, color: '#6366F1', size: 8, delay: 0.09 },
  { id: 11, dx: 102, dy: 42, rotate: 145, color: '#06B6D4', size: 8, delay: 0.05 },
  { id: 12, dx: -52, dy: 64, rotate: 75, color: '#1E40FF', size: 9, delay: 0.1 },
  { id: 13, dx: 54, dy: 66, rotate: -95, color: '#10B981', size: 9, delay: 0.07 },
];

function toBucketList(raw: unknown): BreakdownBucketDto[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item): BreakdownBucketDto | null => {
        if (!item || typeof item !== 'object') return null;
        const r = item as Record<string, unknown>;
        const key = String(
          r.key ?? r.name ?? r.source ?? r.medium ?? r.campaign ?? r.device_type ?? r.device ?? r.referrer ?? 'direct'
        );
        const count = Number(r.count ?? r.clicks ?? r.value ?? 0);
        return {
          key,
          label: r.label ? String(r.label) : key,
          count: Number.isFinite(count) ? count : 0,
          pct: typeof r.pct === 'number' ? r.pct : undefined,
        };
      })
      .filter((x): x is BreakdownBucketDto => x !== null);
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(([k, v]) => ({
      key: k,
      label: k,
      count: Number(v || 0),
    }));
  }
  return [];
}

export function normalizeClicksAnalytics(raw: Record<string, unknown> | null | undefined): ClicksAnalyticsNormalized {
  const r = raw || {};
  const summary = (r.summary && typeof r.summary === 'object' ? r.summary : r) as Record<string, unknown>;
  const utmObj = (r.utm && typeof r.utm === 'object' ? r.utm : {}) as Record<string, unknown>;
  const rawRecent = Array.isArray(r.recent_clicks)
    ? r.recent_clicks
    : Array.isArray(r.clicks)
      ? r.clicks
      : Array.isArray(r.items)
        ? r.items
        : [];

  const recentClicks: RecentLinkClickDto[] = rawRecent.map((item, idx) => {
    const c = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const utmJson = (
      c.utm && typeof c.utm === 'object'
        ? c.utm
        : c.utm_json && typeof c.utm_json === 'object'
          ? c.utm_json
          : {}
    ) as Record<string, unknown>;
    return {
      id: String(c.id || `clk_${idx}`),
      short_link_id: c.short_link_id ? String(c.short_link_id) : undefined,
      short_code: c.short_code ? String(c.short_code) : undefined,
      title: c.title || c.short_link_title ? String(c.title || c.short_link_title) : undefined,
      target_url: c.target_url ? String(c.target_url) : undefined,
      device_type: String(c.device_type || 'desktop'),
      referrer: c.referrer ? String(c.referrer) : 'Trực tiếp / QR',
      client_ip: c.client_ip ? String(c.client_ip) : undefined,
      utm_source: String(c.utm_source || utmJson.utm_source || '') || null,
      utm_medium: String(c.utm_medium || utmJson.utm_medium || '') || null,
      utm_campaign: String(c.utm_campaign || utmJson.utm_campaign || '') || null,
      lead_name: c.lead_name || c.name ? String(c.lead_name || c.name) : null,
      clicked_at: c.clicked_at ? String(c.clicked_at) : c.created_at ? String(c.created_at) : undefined,
    };
  });

  return {
    totalClicks: Number(summary.total_clicks ?? r.total_clicks ?? 0),
    uniqueClicks: Number(
      summary.unique_clicks ?? summary.unique_visitors ?? r.unique_clicks ?? r.unique_visitors ?? 0
    ),
    devices: toBucketList(r.devices ?? r.device_breakdown ?? r.by_device),
    utmSources: toBucketList(r.utm_sources ?? r.by_utm_source ?? utmObj.sources),
    utmMediums: toBucketList(r.utm_mediums ?? r.by_utm_medium ?? utmObj.mediums),
    utmCampaigns: toBucketList(r.utm_campaigns ?? r.by_utm_campaign ?? utmObj.campaigns),
    referrers: toBucketList(r.referrers ?? r.referrer_breakdown ?? r.by_referrer),
    recentClicks,
  };
}

export function formatVoucherRewardLabel(
  discountType: 'percentage' | 'fixed_vnd' | 'gift',
  discountValue: number,
  formatVndFn: (n: number) => string
): string {
  if (discountType === 'percentage') return `Giảm ${discountValue}%`;
  if (discountType === 'gift') {
    return discountValue > 0 ? `Quà tặng (${formatVndFn(discountValue)})` : 'Quà tặng hiện vật';
  }
  return `Giảm ${formatVndFn(discountValue)}`;
}
