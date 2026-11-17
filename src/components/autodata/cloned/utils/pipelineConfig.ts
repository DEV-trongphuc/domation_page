export type PipelineStageGroup = 'positive' | 'neutral' | 'negative';

export interface PipelineStageConfig {
  key: string;
  label: string;
  short_label: string;
  color: string;
  group: PipelineStageGroup;
  is_qualified: boolean;
  capi_event: string;
  enabled: boolean;
  order: number;
}

export interface NoteTypeConfig {
  value: string;
  label: string;
  cat: 'call' | 'zalo' | 'note';
  internal_only?: boolean;
}

export interface NotificationTemplatesConfig {
  assign_email_subject: string;
  assign_email_body: string;
  assign_bot_message: string;
  sla_warning_message: string;
  ticket_admin_subject: string;
  ticket_approved_subject: string;
  ticket_rejected_subject: string;
  bot_chatid_reply: string;
  bot_help_reply: string;
  daily_report_subject: string;
}

export interface TenantSettingsDto {
  distribution_mode?: 'weighted_round_robin' | 'strict_round_robin' | 'least_loaded' | 'manual_only';
  auto_accept_on_assign?: boolean;
  auto_drain_on_online?: boolean;
  queue_drain_batch_limit?: number;
  drain_recalled_leads?: boolean;
  enable_vacation_credits?: boolean;
  vacation_credit_cap?: number;
  duplicate_threshold_days?: number;
  duplicate_lead_action?: 'route_to_previous_sale' | 'round_robin' | 'reject_duplicate' | 'update_existing';
  fallback_type?: 'round' | 'admin';
  fallback_round_id?: string | null;
  fallback_admin_id?: string | null;
  fallback_cc_email?: string;
  starvation_prevention_enabled?: boolean;
  starvation_max_leads_per_hour?: number;
  default_sla_minutes?: number;
  use_default_sla_fallback?: boolean;
  sla_auto_recall_enabled?: boolean;
  sla_target_seconds?: number;
  enforce_work_schedule?: boolean;
  work_schedule_start?: string;
  work_schedule_end?: string;
  work_schedule_saturday_end?: string;
  work_schedule_sunday_enabled?: boolean;
  timezone_name?: string;
  default_dial_code?: string;
  default_currency?: string;
  allow_international_phones?: boolean;
  allow_landline_phones?: boolean;
  vn_mobile_prefixes?: string[];
  custom_phone_regex?: string;
  block_repeated_digits?: boolean;
  blocked_phone_sequences?: string[];
  default_lead_source?: string;
  default_lead_name_prefix?: string;
  default_staff_password?: string;
  pii_masking_enabled?: boolean;
  pii_mask_before_accept?: boolean;
  pii_mask_all_sales?: boolean;
  pii_mask_phone_prefix?: number;
  pii_mask_phone_suffix?: number;
  pii_mask_char?: string;
  pii_mask_email?: boolean;
  pii_hide_internal_notes?: boolean;
  role_permissions?: {
    allow_manager_export_csv?: boolean;
    allow_manager_manage_pipelines?: boolean;
    allow_sale_create_lead?: boolean;
    allow_sale_reassign_lead?: boolean;
  };
  max_co_managers_per_consultant?: number;
  default_table_page_size?: number;
  default_date_filter?: 'today' | '7d' | '30d' | 'all';
  max_export_rows?: number;
  ticket_auto_approve_enabled?: boolean;
  ticket_auto_approve_rules?: any[];
  ticket_reasons?: Array<{ value: string; label: string; auto_disqualify: boolean }>;
  compensation_credits_per_ticket?: number;
  auto_disqualify_on_ticket_approve?: boolean;
  note_types?: NoteTypeConfig[];
  pipeline_capi_stages?: PipelineStageConfig[];
  capi_rules?: { fire_on_assign?: boolean; dual_send?: boolean; require_phone?: boolean };
  capi_action_source?: string;
  capi_api_version?: string;
  capi_event_source_name?: string;
  capi_value_custom_field_key?: string;
  capi_timeout_ms?: number;
  outbound_webhook_max_retries?: number;
  zalo_accept_command?: string;
  zalo_report_command?: string;
  zalo_approve_command?: string;
  zalo_reject_command?: string;
  telegram_accept_command?: string;
  telegram_report_command?: string;
  zalo_rate_limit_per_sec?: number;
  brand_display_name?: string;
  brand_logo_url?: string;
  brand_primary_color?: string;
  brand_email_accent_color?: string;
  brand_email_footer_text?: string;
  support_email?: string;
  notification_templates?: NotificationTemplatesConfig;
  default_closed_deal_value_vnd?: number;
  ads_target_cpl_vnd?: number;
  ads_min_positive_rate_pct?: number;
  ads_max_frequency_fatigue?: number;
  fairness_warning_threshold_pct?: number;
  [key: string]: any;
}

export const DEFAULT_PIPELINE_CAPI_STAGES: PipelineStageConfig[] = [
  { key: 'Qualified', label: 'Thiện Chí (Qualified)', short_label: 'Thiện Chí', color: '#10B981', group: 'positive', is_qualified: true, capi_event: 'Lead', enabled: true, order: 1 },
  { key: 'Booked', label: 'Đã hẹn gặp / Xem mẫu', short_label: 'Đã hẹn gặp', color: '#8B5CF6', group: 'positive', is_qualified: true, capi_event: 'Schedule', enabled: true, order: 2 },
  { key: 'Booking', label: 'Booking (Giữ chỗ)', short_label: 'Booking', color: '#EC4899', group: 'positive', is_qualified: true, capi_event: 'InitiateCheckout', enabled: true, order: 3 },
  { key: 'Deposited', label: 'Đặt cọc (Cọc)', short_label: 'Đặt cọc', color: '#F59E0B', group: 'positive', is_qualified: true, capi_event: 'AddPaymentInfo', enabled: true, order: 4 },
  { key: 'Closed', label: 'Chốt thành công (Chốt)', short_label: 'Chốt HĐ', color: '#059669', group: 'positive', is_qualified: true, capi_event: 'Purchase', enabled: true, order: 5 },
  { key: 'Badtiming', label: 'Hẹn gọi lại (Bad Timing)', short_label: 'Hẹn gọi lại', color: '#EAB308', group: 'neutral', is_qualified: false, capi_event: '', enabled: true, order: 6 },
  { key: 'NoAnswer', label: 'Không liên lạc được (No Answer)', short_label: 'KBM / Ko nghe', color: '#3B82F6', group: 'neutral', is_qualified: false, capi_event: '', enabled: true, order: 7 },
  { key: 'Notlead', label: 'Không đúng đối tượng (Not Lead)', short_label: 'Sai số / Rác', color: '#EF4444', group: 'negative', is_qualified: false, capi_event: '', enabled: true, order: 8 },
];

export const DEFAULT_NOTE_TYPES: NoteTypeConfig[] = [
  { value: 'CALL_CONNECTED', label: 'Gọi điện — Khách nghe máy', cat: 'call', internal_only: false },
  { value: 'CALL_NO_ANSWER', label: 'Gọi điện — Không nghe / Máy bận', cat: 'call', internal_only: false },
  { value: 'ZALO_MESSAGE', label: 'Nhắn Zalo / Kết bạn Zalo', cat: 'zalo', internal_only: false },
  { value: 'MEETING_SCHEDULED', label: 'Hẹn gặp / Xem thực tế', cat: 'call', internal_only: false },
  { value: 'INTERNAL_NOTE', label: 'Ghi chú nội bộ (Admin)', cat: 'note', internal_only: true },
];

export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplatesConfig = {
  assign_email_subject: '[{{brand_name}}] Lead mới: {{customer_name}} ({{phone}})',
  assign_email_body: 'Chào {{sale_name}}, bạn vừa được phân bổ Lead mới: {{customer_name}} - SĐT: {{phone}} - Nguồn: {{source}}.',
  assign_bot_message: '🎯 <b>Khách hàng mới được phân bổ!</b>\n👤 Tên: <b>{{customer_name}}</b>\n📞 SĐT: <b>{{phone}}</b>\n📌 Nguồn: {{source}}\n🔄 Vòng: {{round_name}}\n⏱️ SLA: {{sla_minutes}} phút\n🔑 Mã: <code>{{lead_id}}</code>\n⚡ Tiếp nhận: <code>{{accept_cmd}} {{lead_id}}</code>',
  sla_warning_message: '⚠️ Cảnh báo SLA: Lead {{customer_name}} ({{phone}}) sắp quá hạn tiếp nhận {{sla_minutes}} phút!',
  ticket_admin_subject: '[Ticket mới] Yêu cầu báo lỗi Lead #{{lead_short_id}}',
  ticket_approved_subject: '[Đã duyệt Ticket] Hoàn lượt phân bổ Lead #{{lead_short_id}}',
  ticket_rejected_subject: '[Từ chối Ticket] Phiếu báo lỗi Lead #{{lead_short_id}}',
  bot_chatid_reply: '✅ Chat ID của bạn/nhóm là: <code>{{chat_id}}</code>',
  bot_help_reply: 'ℹ️ Lệnh không được nhận diện. Các lệnh hỗ trợ: /chatid, {{accept_cmd}} <mã_lead>, {{report_cmd}} <mã_lead> <lý_do>',
  daily_report_subject: '[{{brand_name}}] Báo cáo hiệu suất Data {{report_date}}',
};

export const DEFAULT_BLOCKED_PHONE_SEQUENCES: string[] = [
  '0123456789',
  '0987654321',
  '1234567890',
  '0912345678',
  '0901234567',
];

export interface ResolvedPipelineStage {
  key: string;
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
  group: PipelineStageGroup;
  isQualified: boolean;
  capiEvent: string;
  order: number;
  desc: string;
}

const DEFAULT_STAGE_DESCRIPTIONS: Record<string, string> = {
  Qualified: 'Khách có nhu cầu thực tế & phù hợp',
  Booked: 'Đã xác nhận lịch hẹn hoặc tư vấn chuyên sâu',
  Booking: 'Khách đã đăng ký giữ chỗ thiện chí',
  Deposited: 'Khách đã đặt cọc',
  Closed: 'Giao dịch chốt thành công',
  Badtiming: 'Khách đang bận hoặc hẹn liên hệ lại sau',
  NoAnswer: 'Thuê bao, máy bận hoặc không nghe máy',
  Notlead: 'Sai số, không đúng đối tượng hoặc data ảo',
};

export function hexToRgba(hex: string, alpha: number): string {
  const clean = String(hex || '').replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return `rgba(100, 116, 139, ${alpha})`;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function resolveTenantPipelines(tenantSettings?: TenantSettingsDto | null): ResolvedPipelineStage[] {
  const rawList =
    Array.isArray(tenantSettings?.pipeline_capi_stages) && tenantSettings!.pipeline_capi_stages.length > 0
      ? tenantSettings!.pipeline_capi_stages
      : DEFAULT_PIPELINE_CAPI_STAGES;

  const defaultsMap = new Map(DEFAULT_PIPELINE_CAPI_STAGES.map((st) => [st.key.toLowerCase(), st]));

  return rawList
    .filter((st) => st && st.enabled !== false && st.key)
    .map((st, idx) => {
      const def = defaultsMap.get(st.key.toLowerCase());
      const color = st.color || def?.color || '#64748b';
      const isQualified = st.is_qualified ?? def?.is_qualified ?? false;
      const group: PipelineStageGroup =
        st.group || def?.group || (isQualified ? 'positive' : st.key.toLowerCase() === 'notlead' ? 'negative' : 'neutral');
      return {
        key: st.key,
        label: st.label || def?.label || st.key,
        shortLabel: st.short_label || def?.short_label || st.label || st.key,
        color,
        bg: hexToRgba(color, 0.13),
        border: hexToRgba(color, 0.28),
        group,
        isQualified,
        capiEvent: st.capi_event ?? def?.capi_event ?? '',
        order: Number(st.order ?? def?.order ?? idx + 1),
        desc: DEFAULT_STAGE_DESCRIPTIONS[st.key] || `${st.label || st.key} (${group})`,
      };
    })
    .sort((a, b) => a.order - b.order);
}

export const UNRATED_RESOLVED_STAGE: ResolvedPipelineStage = {
  key: 'unrated',
  label: 'Chưa đánh giá',
  shortLabel: 'Chưa đánh giá',
  color: '#64748B',
  bg: 'rgba(100, 116, 139, 0.10)',
  border: 'rgba(100, 116, 139, 0.22)',
  group: 'neutral',
  isQualified: false,
  capiEvent: '',
  order: 999,
  desc: 'Sale & Đại lý chưa cập nhật phản hồi chất lượng',
};

export function resolvePipelineStageByKey(
  status?: string | null,
  tenantSettings?: TenantSettingsDto | null
): ResolvedPipelineStage {
  if (!status || status === 'pending' || status === 'new' || status === 'unrated') {
    return UNRATED_RESOLVED_STAGE;
  }
  const stages = resolveTenantPipelines(tenantSettings);
  const sLower = status.toLowerCase().trim();
  const exact = stages.find(
    (s) => s.key.toLowerCase() === sLower || s.label.toLowerCase() === sLower
  );
  if (exact) return exact;
  return UNRATED_RESOLVED_STAGE;
}

export function resolveTenantDefaultSchedule(
  tenantSettings?: TenantSettingsDto | null
): Record<string, { active: boolean; start: string; end: string }> {
  const start = tenantSettings?.work_schedule_start || '08:30';
  const end = tenantSettings?.work_schedule_end || '18:00';
  const satEnd = tenantSettings?.work_schedule_saturday_end || end;
  const sunEnabled = Boolean(tenantSettings?.work_schedule_sunday_enabled);
  const satActive = satEnd !== '00:00' && satEnd > start;
  return {
    '1': { active: true, start, end },
    '2': { active: true, start, end },
    '3': { active: true, start, end },
    '4': { active: true, start, end },
    '5': { active: true, start, end },
    '6': { active: satActive, start, end: satEnd },
    '7': { active: sunEnabled, start, end },
  };
}

export function resolveTenantBrandName(
  tenantSettings?: TenantSettingsDto | null,
  companyName?: string | null
): string {
  return (
    String(tenantSettings?.brand_display_name || '').trim() ||
    String(tenantSettings?.ses_sender_name || '').trim() ||
    String(companyName || '').trim() ||
    'DOMATION AutoData'
  );
}

export function getBlockedPhoneSequences(tenantSettings?: TenantSettingsDto | null): string[] {
  if (Array.isArray(tenantSettings?.blocked_phone_sequences)) {
    return tenantSettings!.blocked_phone_sequences;
  }
  return DEFAULT_BLOCKED_PHONE_SEQUENCES;
}

export function renderClientTemplate(
  template: string,
  vars: Record<string, string | number | undefined | null>
): string {
  return String(template || '').replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, key: string) => {
    const val = vars[key];
    return val === undefined || val === null ? '' : String(val);
  });
}
