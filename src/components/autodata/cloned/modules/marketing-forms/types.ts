export type FormsTabKey = 'forms' | 'custom_events' | 'purchases' | 'otp';

export type FormFieldType =
  | 'text'
  | 'phone'
  | 'email'
  | 'select'
  | 'textarea'
  | 'number'
  | 'checkbox';

export interface FormFieldItem {
  id: string;
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export type FormLayoutMode = 'card' | 'split' | 'minimal';

export interface FormThemeConfig {
  primaryColor: string;
  borderRadius: number;
  layout: FormLayoutMode;
  buttonLabel: string;
  accentBadge?: string;
}

export interface FormThankYouConfig {
  title: string;
  message: string;
  redirectUrl?: string;
}

export interface MktFormDto {
  id: string;
  name: string;
  description: string;
  public_token: string;
  status: string;
  routing_mode: 'marketing_nurture' | 'sale_round';
  target_audience_id: string | null;
  target_audience_name?: string | null;
  distribution_round_id: string | null;
  distribution_round_name?: string | null;
  require_otp: boolean;
  otp_channel: 'email' | 'sms';
  fields: FormFieldItem[];
  theme?: Partial<FormThemeConfig>;
  thank_you?: Partial<FormThankYouConfig>;
  submission_count: number;
  created_at?: string;
  updated_at?: string;
}

export type EmbedMode = 'iframe' | 'popup_modal' | 'floating_bar' | 'slide_in';

export interface EmbedConfigResponse {
  form_id?: string;
  public_token?: string;
  public_url?: string;
  submit_url?: string;
  otp_send_url?: string;
  otp_verify_url?: string;
  theme?: Partial<FormThemeConfig>;
  snippets?: Partial<Record<EmbedMode, string>>;
}

export interface FormSubmissionDto {
  id: string;
  form_id: string;
  lead_id?: string | null;
  routing_mode: 'marketing_nurture' | 'sale_round';
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  lead_status?: string | null;
  submitted_data: Record<string, unknown>;
  utm_data: Record<string, unknown>;
  otp_verified: boolean;
  created_at?: string;
}

export interface CustomEventDto {
  id: string;
  event_key: string;
  event_name: string;
  event_category: 'custom' | 'purchase' | 'otp';
  description?: string | null;
  schema_json?: Record<string, unknown>;
  webhook_secret?: string | null;
  status?: string;
  trigger_count: number;
  total_revenue_vnd: number;
  created_at?: string;
  updated_at?: string;
}

export interface EventDetailResponse {
  event?: CustomEventDto;
  id?: string;
  event_key?: string;
  event_name?: string;
  event_category?: 'custom' | 'purchase' | 'otp';
  description?: string | null;
  schema_json?: Record<string, unknown>;
  webhook_secret?: string | null;
  trigger_count?: number;
  total_revenue_vnd?: number;
  webhook_url?: string;
  recent_triggers?: Array<{
    id: string;
    title?: string;
    content?: string;
    actor_name?: string;
    created_at?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface AudienceRef {
  id: string;
  name: string;
  audience_type?: string;
  cached_member_count?: number;
}

export interface RoundRef {
  id: string;
  name: string;
  pipeline_id?: string;
}

export interface FormsOverviewResponse {
  items?: MktFormDto[];
  audiences?: AudienceRef[];
  rounds?: RoundRef[];
  events?: CustomEventDto[];
  otp_summary?: {
    total_sent: number;
    verified_count: number;
  };
}

export interface OtpAuditItemDto {
  id: string;
  channel: 'email' | 'sms';
  recipient: string;
  purpose: string;
  attempts: number;
  verified: boolean;
  verified_at?: string | null;
  expires_at?: string | null;
  created_at?: string;
}

export interface OtpAuditResponse {
  summary?: {
    total_sent: number;
    verified_count: number;
    verification_rate?: number;
    email_count?: number;
    sms_count?: number;
    expired_or_failed?: number;
  };
  by_channel?: {
    email?: { sent: number; verified: number };
    sms?: { sent: number; verified: number };
  };
  rate_limit_policy?: {
    max_attempts: number;
    ttl_seconds: number;
    hash_algorithm?: string;
  };
  items?: OtpAuditItemDto[];
  logs?: OtpAuditItemDto[];
}

export interface FieldPaletteEntry {
  type: FormFieldType;
  defaultKey: string;
  label: string;
  hint: string;
  placeholder: string;
}

export const FIELD_PALETTE_ITEMS: ReadonlyArray<FieldPaletteEntry> = [
  { type: 'phone', defaultKey: 'phone', label: 'Số điện thoại', hint: 'Định danh SĐT / Zalo', placeholder: '0909 123 456' },
  { type: 'email', defaultKey: 'email', label: 'Địa chỉ Email', hint: 'Định danh Email', placeholder: 'name@company.vn' },
  { type: 'text', defaultKey: 'name', label: 'Văn bản ngắn', hint: 'Họ tên, Công ty, Chức vụ', placeholder: 'Nhập thông tin...' },
  { type: 'select', defaultKey: 'service_pkg', label: 'Danh sách chọn', hint: 'Dropdown lựa chọn', placeholder: 'Chọn gói dịch vụ...' },
  { type: 'textarea', defaultKey: 'product_interest', label: 'Đoạn văn dài', hint: 'Ghi chú / Nhu cầu tư vấn', placeholder: 'Mô tả nhu cầu chi tiết...' },
  { type: 'number', defaultKey: 'team_size', label: 'Con số', hint: 'Quy mô, Ngân sách, Số lượng', placeholder: '10' },
  { type: 'checkbox', defaultKey: 'consent_terms', label: 'Hộp kiểm (Checkbox)', hint: 'Đồng ý điều khoản / Nhận tin', placeholder: '' },
];

export const DEFAULT_FORM_THEME: FormThemeConfig = {
  primaryColor: '#1E40FF',
  borderRadius: 14,
  layout: 'card',
  buttonLabel: 'Đăng ký ngay',
  accentBadge: 'Tư vấn 1-1 Miễn phí',
};

export const DEFAULT_FORM_THANK_YOU: FormThankYouConfig = {
  title: 'Cảm ơn bạn đã đăng ký!',
  message: 'Thông tin đã được tiếp nhận. Đội ngũ chuyên viên sẽ phản hồi trong thời gian sớm nhất.',
  redirectUrl: '',
};

export const SAPPHIRE_COLOR_SWATCHES: ReadonlyArray<string> = [
  '#1E40FF',
  '#2563EB',
  '#0284C7',
  '#0D9488',
  '#059669',
  '#4F46E5',
  '#7C3AED',
  '#0F172A',
];

export function resolveFormTheme(raw?: Partial<FormThemeConfig> | null): FormThemeConfig {
  const rawColor = typeof raw?.primaryColor === 'string' && raw.primaryColor.trim() ? raw.primaryColor.trim() : '#1E40FF';
  const safeColor = /^#bd1d/i.test(rawColor) ? '#1E40FF' : rawColor;
  return {
    primaryColor: safeColor,
    borderRadius: typeof raw?.borderRadius === 'number' && Number.isFinite(raw.borderRadius) ? raw.borderRadius : 14,
    layout: raw?.layout === 'split' || raw?.layout === 'minimal' ? raw.layout : 'card',
    buttonLabel: typeof raw?.buttonLabel === 'string' && raw.buttonLabel.trim() ? raw.buttonLabel : 'Đăng ký ngay',
    accentBadge: typeof raw?.accentBadge === 'string' ? raw.accentBadge : 'Tư vấn 1-1 Miễn phí',
  };
}

export function resolveFormThankYou(raw?: Partial<FormThankYouConfig> | null): FormThankYouConfig {
  return {
    title: typeof raw?.title === 'string' && raw.title.trim() ? raw.title : DEFAULT_FORM_THANK_YOU.title,
    message: typeof raw?.message === 'string' && raw.message.trim() ? raw.message : DEFAULT_FORM_THANK_YOU.message,
    redirectUrl: typeof raw?.redirectUrl === 'string' ? raw.redirectUrl : '',
  };
}

export function createPresetFormFields(preset: 'phone_only' | 'email_only' | 'full'): FormFieldItem[] {
  if (preset === 'phone_only') {
    return [
      { id: crypto.randomUUID(), key: 'name', label: 'Họ và tên', type: 'text', required: true, placeholder: 'Nguyễn Văn A' },
      { id: crypto.randomUUID(), key: 'phone', label: 'Số điện thoại / Zalo', type: 'phone', required: true, placeholder: '0909 123 456' },
    ];
  }
  if (preset === 'email_only') {
    return [
      { id: crypto.randomUUID(), key: 'name', label: 'Họ và tên', type: 'text', required: false, placeholder: 'Nguyễn Văn A' },
      { id: crypto.randomUUID(), key: 'email', label: 'Địa chỉ Email nhận tài liệu', type: 'email', required: true, placeholder: 'ban@congty.vn' },
    ];
  }
  return [
    { id: crypto.randomUUID(), key: 'name', label: 'Họ và tên', type: 'text', required: true, placeholder: 'Nguyễn Văn A' },
    { id: crypto.randomUUID(), key: 'phone', label: 'Số điện thoại liên hệ', type: 'phone', required: true, placeholder: '0909 123 456' },
    { id: crypto.randomUUID(), key: 'email', label: 'Email công việc (Tùy chọn)', type: 'email', required: false, placeholder: 'name@company.vn' },
    {
      id: crypto.randomUUID(),
      key: 'service_pkg',
      label: 'Gói giải pháp quan tâm',
      type: 'select',
      required: false,
      placeholder: 'Chọn giải pháp...',
      options: ['Auto Data CRM', 'Marketing Automation', 'Growth Suite', 'DOMATION PROMAX'],
    },
    { id: crypto.randomUUID(), key: 'product_interest', label: 'Ghi chú nhu cầu', type: 'textarea', required: false, placeholder: 'Mô tả quy mô đội ngũ...' },
  ];
}

export function hasAtLeastOneIdentityField(fields: ReadonlyArray<FormFieldItem>): boolean {
  return fields.some(
    (f) => f.type === 'phone' || f.key === 'phone' || f.type === 'email' || f.key === 'email'
  );
}

export function buildFormEmbedSnippet(
  origin: string,
  form: MktFormDto,
  mode: EmbedMode,
  serverSnippets?: Partial<Record<EmbedMode, string>>
): string {
  if (serverSnippets && typeof serverSnippets[mode] === 'string' && serverSnippets[mode]?.trim()) {
    return serverSnippets[mode] as string;
  }
  const theme = resolveFormTheme(form.theme);
  const publicEndpoint = `${origin}/api/v1/public/marketing/forms/${form.public_token}`;
  const submitEndpoint = `${publicEndpoint}/submit`;

  if (mode === 'iframe') {
    return `<!-- DOMATION Embedded Form (Iframe Mode - ${form.routing_mode}) -->
<iframe
  src="${publicEndpoint}"
  title="${form.name.replace(/"/g, '&quot;')}"
  width="100%"
  height="520"
  style="border:0;border-radius:${theme.borderRadius}px;background:#FFFFFF;box-shadow:0 8px 24px rgba(15,23,42,0.06);"
  loading="lazy"
></iframe>`;
  }

  if (mode === 'popup_modal') {
    return `<!-- DOMATION Popup Modal Trigger (${form.name}) -->
<button
  type="button"
  onclick="window.DomationForms&&window.DomationForms.openModal('${form.public_token}')"
  style="height:44px;padding:0 20px;border-radius:${theme.borderRadius}px;border:0;background:${theme.primaryColor};color:#FFFFFF;font-weight:700;cursor:pointer;"
>
  ${theme.buttonLabel}
</button>
<script
  src="${origin}/sdk/domation-forms.js"
  data-token="${form.public_token}"
  data-mode="popup_modal"
  data-submit="${submitEndpoint}"
  data-primary="${theme.primaryColor}"
  async
></script>`;
  }

  if (mode === 'floating_bar') {
    return `<!-- DOMATION Sticky Floating Bar Widget (${form.name}) -->
<script
  src="${origin}/sdk/domation-forms.js"
  data-token="${form.public_token}"
  data-mode="floating_bar"
  data-position="bottom"
  data-cta="${theme.buttonLabel.replace(/"/g, '&quot;')}"
  data-submit="${submitEndpoint}"
  data-primary="${theme.primaryColor}"
  async
></script>`;
  }

  return `<!-- DOMATION Slide-In Lead Box (${form.name}) -->
<script
  src="${origin}/sdk/domation-forms.js"
  data-token="${form.public_token}"
  data-mode="slide_in"
  data-trigger-scroll="40"
  data-submit="${submitEndpoint}"
  data-primary="${theme.primaryColor}"
  async
></script>`;
}

export function buildWebhookCurlSnippet(
  origin: string,
  ev: CustomEventDto,
  secret: string
): string {
  const endpoint = `${origin}/api/v1/marketing/forms/events/${ev.id}/trigger`;
  const isPurchase = ev.event_category === 'purchase';
  const payload = isPurchase
    ? `{
    "phone": "0909123456",
    "email": "khachhang@congty.vn",
    "name": "Nguyễn Văn A",
    "amount_vnd": 4500000,
    "payload": {
      "order_id": "ORD-2026-889",
      "currency": "VND",
      "items": [{ "sku": "PROMAX-1Y", "qty": 1, "price": 4500000 }]
    }
  }`
    : `{
    "phone": "0909123456",
    "email": "khachhang@congty.vn",
    "name": "Nguyễn Văn A",
    "payload": {
      "event_key": "${ev.event_key}",
      "source_page": "/bang-gia",
      "plan_interest": "Growth Suite"
    }
  }`;

  return `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "X-Domation-Webhook-Secret: ${secret}" \\
  -d '${payload}'`;
}

export function buildWebhookJsSnippet(
  origin: string,
  ev: CustomEventDto,
  secret: string
): string {
  const endpoint = `${origin}/api/v1/marketing/forms/events/${ev.id}/trigger`;
  const isPurchase = ev.event_category === 'purchase';
  return `// Server-to-Server Webhook (${isPurchase ? 'Purchase Revenue Attribution' : 'Custom Behavioral Trigger'})
await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Domation-Webhook-Secret": "${secret}"
  },
  body: JSON.stringify({
    phone: customer.phone, // Hỗ trợ chỉ SĐT hoặc chỉ Email
    email: customer.email,${isPurchase ? '\n    amount_vnd: order.totalVnd,' : ''}
    payload: {
      event_key: "${ev.event_key}",${isPurchase ? '\n      order_id: order.code,' : '\n      action: "feature_activated",'}
      triggered_at: new Date().toISOString()
    }
  })
});`;
}
