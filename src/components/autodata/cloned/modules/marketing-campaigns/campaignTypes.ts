export type CampaignChannel = 'email' | 'zns' | 'multi';
export type WinnerCriteria = 'open_rate' | 'click_rate';
export type ReminderCondition = 'no_open' | 'no_click' | 'clicked_no_convert';

export interface AudienceOptionDto {
  id: string;
  name: string;
  audience_type: string;
  cached_member_count: number;
}

export interface EmailTemplateOptionDto {
  id: string;
  name: string;
  subject: string;
  compiled_html?: string;
  category?: string;
}

export interface CampaignReminderStepDto {
  id: string;
  step_order?: number;
  condition: ReminderCondition;
  wait_hours: number;
  subject: string;
  template_id: string | null;
  status?: string;
  sent_count?: number;
}

export interface CampaignRowDto {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: string;
  audience_id: string | null;
  audience_name?: string | null;
  audience_type?: string | null;
  exclude_audience_ids?: string[];
  template_id: string | null;
  template_name?: string | null;
  subject_a: string;
  subject_b: string;
  ab_split_ratio: number;
  winner_criteria?: WinnerCriteria;
  ab_test_hours?: number;
  zns_template_id?: string;
  sender_name?: string;
  sender_email?: string;
  fallback_vars?: Record<string, string>;
  throttle_per_minute?: number;
  reminder_config?: Record<string, unknown>;
  scheduled_at?: string | null;
  sent_at?: string | null;
  total_targeted?: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count?: number;
  unsubscribed_count?: number;
  open_rate_pct: number;
  click_rate_pct: number;
  cost_vnd: number;
  attributed_revenue_vnd: number;
  roi_multiple: number;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignsOverviewResponse {
  items?: CampaignRowDto[];
  audiences?: AudienceOptionDto[];
  templates?: EmailTemplateOptionDto[];
  suppression_count?: number;
  vault_channels?: {
    email: { configured: boolean; provider: string | null };
    zns: { configured: boolean; provider: string | null };
  };
  summary?: {
    sent: number;
    opened: number;
    clicked: number;
    revenue_vnd: number;
    cost_vnd: number;
  };
}

export interface SuppressionItem {
  id: string;
  channel: string;
  recipient: string;
  reason: string;
  created_at?: string;
}

export interface SesQuotaNormalized {
  provider: string;
  region: string;
  max24h: number;
  sent24h: number;
  remaining24h: number;
  usagePct: number;
  maxRatePerSec: number;
  bounceRatePct: number;
  complaintRatePct: number;
  spfVerified: boolean;
  dkimVerified: boolean;
  dmarcVerified: boolean;
  healthStatus: 'good' | 'warning' | 'critical';
}

export interface CampaignWizardDraft {
  id?: string;
  name: string;
  channel: CampaignChannel;
  audience_id: string;
  exclude_audience_ids: string[];
  subject_a: string;
  subject_b: string;
  ab_split_ratio: number;
  winner_criteria: WinnerCriteria;
  ab_test_hours: number;
  fallback_vars: Record<string, string>;
  template_id: string;
  zns_template_id: string;
  sender_name: string;
  sender_email: string;
  reminders: CampaignReminderStepDto[];
  throttle_per_minute: number;
  schedule_mode: 'now' | 'scheduled';
  scheduled_at: string;
  cost_vnd: number;
}

export interface PreSendReviewResponse {
  ready?: boolean;
  score?: number;
  spam_score?: number;
  spf_verified?: boolean;
  dkim_verified?: boolean;
  dmarc_verified?: boolean;
  vault_configured?: boolean;
  has_unsubscribe_tag?: boolean;
  links_checked?: number;
  broken_links?: string[];
  targeted_count?: number;
  excluded_count?: number;
  suppressed_count?: number;
  net_reachable_count?: number;
  fallback_coverage_pct?: number;
  missing_fallbacks?: string[];
  warnings?: string[];
  checks?: Array<{ key: string; label: string; passed: boolean; detail?: string }>;
}

export interface CampaignClickMapItem {
  url: string;
  total_clicks: number;
  unique_clicks: number;
  heat_share_pct: number;
}

export interface CampaignRecipientClaimItem {
  id: string;
  lead_id: string;
  lead_name?: string;
  email?: string;
  phone?: string;
  channel: string;
  variant: string;
  status: string;
  sent_at?: string | null;
  opened_at?: string | null;
  clicked_at?: string | null;
  bounce_reason?: string | null;
}

export interface CampaignDetailResponse {
  campaign?: CampaignRowDto;
  ab_comparison?: {
    variant_a: { sent: number; opened: number; clicked: number; open_rate_pct: number; click_rate_pct: number };
    variant_b: { sent: number; opened: number; clicked: number; open_rate_pct: number; click_rate_pct: number };
    winner?: 'A' | 'B' | 'tie';
  };
  click_map?: CampaignClickMapItem[];
  claims?: CampaignRecipientClaimItem[];
  reminders?: CampaignReminderStepDto[];
  tech_stats?: {
    devices?: Array<{ name: string; value: number }>;
    clients?: Array<{ name: string; value: number }>;
    locations?: Array<{ name: string; value: number }>;
  };
}

export interface SamplePersona {
  id: string;
  label: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  product_interest: string;
}

export const SAMPLE_PERSONAS: ReadonlyArray<SamplePersona> = [
  {
    id: 'p1',
    label: 'CEO Doanh nghiệp B2B (Đủ dữ liệu)',
    name: 'Nguyễn Minh Khang',
    email: 'khang.nguyen@viettech-corp.vn',
    phone: '0909123456',
    company: 'VietTech Holdings',
    product_interest: 'DOMATION ProMax Enterprise',
  },
  {
    id: 'p2',
    label: 'Trưởng phòng Kinh doanh (Thiếu tên công ty)',
    name: 'Trần Thu Hà',
    email: 'thuha.tran@growthlab.vn',
    phone: '0918234567',
    company: '',
    product_interest: 'Auto Data Fair-Share',
  },
  {
    id: 'p3',
    label: 'Khách mới đăng ký Form (Kiểm tra Fallback)',
    name: '',
    email: 'contact.new@clientmail.vn',
    phone: '0987654321',
    company: '',
    product_interest: '',
  },
];

export const STANDARD_MERGE_TAGS: ReadonlyArray<{
  tag: string;
  key: string;
  label: string;
  suggestedFallback: string;
}> = [
  { tag: '{{lead.name}}', key: 'lead.name', label: 'Họ tên khách hàng', suggestedFallback: 'Quý khách' },
  { tag: '{{lead.company}}', key: 'lead.company', label: 'Tên doanh nghiệp', suggestedFallback: 'Quý đối tác' },
  { tag: '{{lead.phone}}', key: 'lead.phone', label: 'Số điện thoại', suggestedFallback: '' },
  { tag: '{{lead.email}}', key: 'lead.email', label: 'Địa chỉ Email', suggestedFallback: '' },
  {
    tag: '{{lead.product_interest}}',
    key: 'lead.product_interest',
    label: 'Sản phẩm quan tâm',
    suggestedFallback: 'Giải pháp Tăng trưởng DOMATION',
  },
  { tag: '{{tenant.name}}', key: 'tenant.name', label: 'Tên thương hiệu gửi', suggestedFallback: 'DOMATION' },
  { tag: '{{unsubscribe_url}}', key: 'unsubscribe_url', label: 'Liên kết hủy đăng ký', suggestedFallback: '#unsubscribe' },
];

export function extractMergeVariables(...sources: Array<string | undefined | null>): string[] {
  const found = new Set<string>();
  const regex = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
  for (const src of sources) {
    if (!src) continue;
    let match: RegExpExecArray | null = regex.exec(src);
    while (match) {
      const key = match[1].trim();
      if (key && key !== 'unsubscribe_url') {
        found.add(key);
      }
      match = regex.exec(src);
    }
  }
  return Array.from(found);
}

export function interpolatePreviewText(
  raw: string,
  persona: SamplePersona,
  fallbacks: Record<string, string>,
  companyName: string
): string {
  if (!raw) return '';
  const values: Record<string, string> = {
    'lead.name': persona.name,
    name: persona.name,
    'lead.email': persona.email,
    email: persona.email,
    'lead.phone': persona.phone,
    phone: persona.phone,
    'lead.company': persona.company,
    company: persona.company,
    'lead.product_interest': persona.product_interest,
    product_interest: persona.product_interest,
    'tenant.name': companyName || 'DOMATION',
    unsubscribe_url: '#unsubscribe-preview',
  };
  return raw.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_full, rawKey: string) => {
    const key = rawKey.trim();
    const direct = values[key];
    if (direct && direct.trim()) return direct;
    const fb = fallbacks[key] || fallbacks[`{{${key}}}`];
    if (fb && fb.trim()) return fb;
    return `[${key}]`;
  });
}

export function normalizeSesQuota(raw: Record<string, unknown> | null | undefined): SesQuotaNormalized {
  const aws = (raw?.aws && typeof raw.aws === 'object' ? raw.aws : {}) as Record<string, unknown>;
  const local = (raw?.local && typeof raw.local === 'object' ? raw.local : {}) as Record<string, unknown>;
  const max24h = Math.max(1, Number(raw?.max_24h ?? raw?.quota_24h ?? aws.max_24h ?? 50000));
  const sent24h = Math.max(0, Number(raw?.sent_24h ?? aws.sent_24h ?? local.sent_24h ?? 0));
  const remaining24h = Math.max(0, Number(raw?.remaining_24h ?? aws.remaining ?? max24h - sent24h));
  const usagePct = Number(
    raw?.usage_pct ?? aws.usage_pct ?? Math.min(100, Number(((sent24h / max24h) * 100).toFixed(1)))
  );
  const maxRatePerSec = Math.max(1, Number(raw?.max_send_rate ?? raw?.max_rate ?? aws.max_rate ?? 14));
  const bounceRatePct = Math.max(0, Number(raw?.bounce_rate_pct ?? raw?.bounce_rate ?? local.bounce_rate ?? 0.4));
  const complaintRatePct = Math.max(
    0,
    Number(raw?.complaint_rate_pct ?? raw?.complaint_rate ?? local.complaint_rate ?? 0.02)
  );
  const spfVerified = raw?.spf_verified !== undefined ? Boolean(raw.spf_verified) : true;
  const dkimVerified = raw?.dkim_verified !== undefined ? Boolean(raw.dkim_verified) : true;
  const dmarcVerified = raw?.dmarc_verified !== undefined ? Boolean(raw.dmarc_verified) : true;

  const healthStatus: 'good' | 'warning' | 'critical' =
    bounceRatePct >= 5 || complaintRatePct >= 0.1
      ? 'critical'
      : bounceRatePct >= 2 || complaintRatePct >= 0.05
        ? 'warning'
        : 'good';

  return {
    provider: String(raw?.provider || (raw?.is_ses ? 'Amazon SES' : 'AWS SES / SMTP Vault')),
    region: String(raw?.region || 'ap-southeast-1'),
    max24h,
    sent24h,
    remaining24h,
    usagePct,
    maxRatePerSec,
    bounceRatePct,
    complaintRatePct,
    spfVerified,
    dkimVerified,
    dmarcVerified,
    healthStatus,
  };
}
