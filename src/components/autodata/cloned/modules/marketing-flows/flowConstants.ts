export type FlowNodeType11 =
  | 'send_email'
  | 'send_zns'
  | 'wait_delay'
  | 'if_else_condition'
  | 'ab_split'
  | 'add_remove_tag'
  | 'update_lead_score'
  | 'issue_voucher'
  | 'webhook_http'
  | 'notify_internal'
  | 'push_to_autodata_sale_round';

export interface ConditionRuleItem {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface ConditionRuleGroup {
  id: string;
  logic: 'AND' | 'OR';
  rules: ConditionRuleItem[];
}

export interface FlowStepNode {
  id: string;
  type: FlowNodeType11;
  label?: string;
  config?: Record<string, unknown>;
  nextStepId?: string | null;
  yesStepId?: string | null;
  noStepId?: string | null;
  pathAStepId?: string | null;
  pathBStepId?: string | null;
  participants_count?: number;
}

export interface FlowSettingsConfig {
  quiet_hours_enabled: boolean;
  quiet_start: string;
  quiet_end: string;
  active_days: number[];
  reentry_mode: 'once' | 'always' | 'cooldown_days';
  cooldown_days: number;
  goal_exit_enabled: boolean;
  goal_criteria: 'pushed_to_sale_round' | 'deal_won' | 'purchase_completed' | 'score_gte';
  goal_score_target: number;
  exit_on_unsubscribe: boolean;
  exit_on_hard_bounce: boolean;
  exit_on_spam_complaint: boolean;
}

export interface FlowDefinitionDto {
  id: string;
  name: string;
  description: string;
  status: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  settings?: Partial<FlowSettingsConfig>;
  steps: FlowStepNode[];
  version: number;
  enrolled_count: number;
  completed_count: number;
  pushed_to_sale_count: number;
  attributed_revenue_vnd: number;
  updated_at?: string;
}

export interface FlowTraceItem {
  step_id: string;
  node_type: string;
  label: string;
  outcome: string;
  branch?: string;
  timestamp: string;
}

export interface FlowSnapshotItem {
  id: string;
  version: number;
  trigger_type: string;
  review_score: number;
  created_at: string;
}

export interface EmailTemplateItemDto {
  id: string;
  name: string;
  subject?: string;
  compiled_html?: string;
}

export interface ZaloTemplateDto {
  id: string;
  template_id: string;
  name: string;
  status?: string;
  params: string[];
  sample_body?: string;
}

export interface FlowCatalogResources {
  templates: EmailTemplateItemDto[];
  forms: Array<{ id: string; name: string }>;
  audiences: Array<{ id: string; name: string; audience_type?: string }>;
  rounds: Array<{ id: string; name: string; pipeline_id?: string }>;
  vouchers: Array<{ id: string; name: string; code_prefix?: string }>;
  surveys: Array<{ id: string; title?: string; name?: string }>;
}

export interface FlowStepFunnelMetric {
  step_id: string;
  label: string;
  type: string;
  entered: number;
  completed: number;
  conversion_pct: number;
  yes_count?: number;
  no_count?: number;
  branch_a_count?: number;
  branch_b_count?: number;
  opened_count?: number;
  clicked_count?: number;
  zns_delivered?: number;
}

export interface FlowAnalyticsResponse {
  enrolled_count?: number;
  completed_count?: number;
  completion_rate_pct?: number;
  pushed_to_sale_count?: number;
  attributed_revenue_vnd?: number;
  email_sent?: number;
  email_opened?: number;
  email_clicked?: number;
  zns_sent?: number;
  steps_funnel?: FlowStepFunnelMetric[];
}

export interface StepParticipantItem {
  id: string;
  lead_id: string;
  lead_name: string;
  email?: string;
  phone?: string;
  lead_score?: number;
  status: string;
  enrolled_at?: string;
  completed_at?: string | null;
  execution_trace?: FlowTraceItem[];
}

export const DEFAULT_FLOW_SETTINGS: FlowSettingsConfig = {
  quiet_hours_enabled: true,
  quiet_start: '21:30',
  quiet_end: '07:30',
  active_days: [1, 2, 3, 4, 5, 6],
  reentry_mode: 'cooldown_days',
  cooldown_days: 14,
  goal_exit_enabled: true,
  goal_criteria: 'pushed_to_sale_round',
  goal_score_target: 60,
  exit_on_unsubscribe: true,
  exit_on_hard_bounce: true,
  exit_on_spam_complaint: true,
};

export const FLOW_TRIGGERS_15: ReadonlyArray<{
  key: string;
  label: string;
  category: 'acquisition' | 'engagement' | 'crm' | 'lifecycle';
  hint: string;
}> = [
  { key: 'form_submitted', label: '1. Điền Biểu mẫu đăng ký (Form Submitted)', category: 'acquisition', hint: 'Bắt sự kiện khách gửi Form / Landing Page' },
  { key: 'tag_added', label: '2. Được gắn Nhãn phân loại (Tag Added)', category: 'crm', hint: 'Chạy khi Hồ sơ 360° được gắn Tag mục tiêu' },
  { key: 'audience_joined', label: '3. Đi vào Tệp Data / Tệp Logic (Audience Joined)', category: 'acquisition', hint: 'Kích hoạt khi Lead khớp điều kiện Tệp Đích' },
  { key: 'stage_changed', label: '4. Chuyển bước Pipeline CRM (Stage Changed)', category: 'crm', hint: 'Tự động chăm sóc khi Deal/Lead đổi cột Kanban' },
  { key: 'email_opened', label: '5. Mở Email chiến dịch (Email Opened)', category: 'engagement', hint: 'Bám đuổi tức thì khi khách mở đọc Email' },
  { key: 'link_clicked', label: '6. Nhấn liên kết Email / Shortlink (Link Clicked)', category: 'engagement', hint: 'Bắt tín hiệu quan tâm cao khi nhấn CTA' },
  { key: 'survey_completed', label: '7. Hoàn thành Khảo sát / Quiz (Survey Completed)', category: 'acquisition', hint: 'Phân luồng theo điểm số bài khảo sát' },
  { key: 'page_visited', label: '8. Truy cập Website / Trang bảng giá (Page Visited)', category: 'engagement', hint: 'Nhận diện khách xem trang Pricing / Sản phẩm' },
  { key: 'voucher_redeemed', label: '9. Nhận hoặc Đổi mã Voucher (Voucher Redeemed)', category: 'lifecycle', hint: 'Chăm sóc sau khi kích hoạt mã ưu đãi' },
  { key: 'purchase_event', label: '10. Phát sinh Mua hàng (Purchase Event)', category: 'lifecycle', hint: 'Onboarding & Upsell tự động sau thanh toán' },
  { key: 'score_threshold', label: '11. Đạt ngưỡng Điểm nóng (Lead Score Threshold)', category: 'crm', hint: 'Đẩy sang Vòng chia Sale ngay khi đủ điểm nóng' },
  { key: 'birthday', label: '12. Ngày Sinh nhật / Kỷ niệm (Birthday)', category: 'lifecycle', hint: 'Tặng quà & Voucher tự động dịp đặc biệt' },
  { key: 'inactivity', label: '13. Ngủ đông không tương tác (Inactivity)', category: 'lifecycle', hint: 'Hâm nóng lại khách hàng lâu chưa phản hồi' },
  { key: 'webhook_received', label: '14. Nhận sự kiện Custom Webhook (Webhook Received)', category: 'acquisition', hint: 'Kết nối sự kiện Real-time từ hệ thống ngoài' },
  { key: 'manual_enroll', label: '15. Đưa vào kịch bản thủ công / 1 chạm (Manual Enroll)', category: 'crm', hint: 'Sale hoặc Marketer chủ động ghi danh khách' },
];

export const FLOW_NODES_11: ReadonlyArray<{
  type: FlowNodeType11;
  label: string;
  desc: string;
  category: 'messaging' | 'logic' | 'crm_handoff';
  tone: 'primary' | 'info' | 'success' | 'warning' | 'purple';
}> = [
  { type: 'send_email', label: 'Gửi Email tự động', desc: 'Kết xuất mẫu HTML 15 khối qua SES/SMTP Vault', category: 'messaging', tone: 'primary' },
  { type: 'send_zns', label: 'Gửi tin nhắn Zalo ZNS', desc: 'Gửi thông báo ZNS cá nhân hóa qua Zalo OA', category: 'messaging', tone: 'info' },
  { type: 'wait_delay', label: 'Chờ theo thời gian', desc: 'Đặt khoảng trễ phút/giờ/ngày & khung giờ hành chính', category: 'logic', tone: 'warning' },
  { type: 'if_else_condition', label: 'Rẽ nhánh Điều kiện (If / Else)', desc: 'Đơn điều kiện hoặc Đa nhóm AND/OR -> Đúng / Sai', category: 'logic', tone: 'purple' },
  { type: 'ab_split', label: 'Phân luồng A/B Split', desc: 'Tách ngẫu nhiên theo tỉ lệ % sang 2 nhánh A / B', category: 'logic', tone: 'purple' },
  { type: 'add_remove_tag', label: 'Gắn / Gỡ Nhãn (Tag)', desc: 'Phân loại tự động trên Hồ sơ 360°', category: 'crm_handoff', tone: 'info' },
  { type: 'update_lead_score', label: 'Cộng / Trừ Điểm nóng', desc: 'Tăng/giảm Lead Score theo mức độ tương tác', category: 'crm_handoff', tone: 'primary' },
  { type: 'issue_voucher', label: 'Cấp Mã Ưu Đãi Voucher', desc: 'Sinh mã ưu đãi độc nhất gắn vào Timeline khách', category: 'crm_handoff', tone: 'success' },
  { type: 'webhook_http', label: 'Bắn Outbound HTTP Webhook', desc: 'Đồng bộ dữ liệu sang hệ thống bên thứ 3', category: 'crm_handoff', tone: 'info' },
  { type: 'notify_internal', label: 'Thông báo Nội bộ', desc: 'Báo tin cho Quản lý / Chuyên viên phụ trách', category: 'crm_handoff', tone: 'warning' },
  {
    type: 'push_to_autodata_sale_round',
    label: 'Đẩy vào Vòng chia Sale Auto Data',
    desc: 'Chuyển marketing_nurture -> Vòng chia Sale Fair-Share ngay!',
    category: 'crm_handoff',
    tone: 'success',
  },
];

export const CONDITION_FIELDS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'lead_score', label: 'Điểm nóng tương tác (lead_score)' },
  { value: 'email_consent', label: 'Trạng thái Email (email_consent)' },
  { value: 'zns_consent', label: 'Trạng thái Zalo ZNS (zns_consent)' },
  { value: 'total_revenue_vnd', label: 'Tổng doanh thu tích lũy (VNĐ)' },
  { value: 'tags', label: 'Nhãn phân loại CRM (tags)' },
  { value: 'stage_key', label: 'Bước Pipeline hiện tại (stage_key)' },
  { value: 'source', label: 'Nguồn thu thập Lead (source)' },
  { value: 'opened_previous_email', label: 'Đã mở Email bước trước' },
  { value: 'clicked_link', label: 'Đã nhấn liên kết CTA' },
];

export const CONDITION_OPERATORS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'gte', label: '>= (Lớn hơn hoặc bằng)' },
  { value: 'lte', label: '<= (Nhỏ hơn hoặc bằng)' },
  { value: 'eq', label: '= (Bằng chính xác)' },
  { value: 'neq', label: '!= (Khác giá trị)' },
  { value: 'contains', label: 'Chứa chuỗi / nhãn' },
  { value: 'not_contains', label: 'Không chứa chuỗi' },
  { value: 'is_set', label: 'Đã có dữ liệu' },
];

export const LEAD_MERGE_FIELDS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'lead.name', label: 'Họ tên khách hàng (lead.name)' },
  { value: 'lead.phone', label: 'Số điện thoại (lead.phone)' },
  { value: 'lead.email', label: 'Email khách hàng (lead.email)' },
  { value: 'lead.company', label: 'Tên doanh nghiệp (lead.company)' },
  { value: 'lead.product_interest', label: 'Sản phẩm quan tâm (lead.product_interest)' },
  { value: 'lead.id', label: 'Mã hồ sơ Lead (lead.id)' },
  { value: 'tenant.name', label: 'Tên thương hiệu (tenant.name)' },
];

export function summarizeStepConfig(node: FlowStepNode): string {
  const cfg = node.config || {};
  switch (node.type) {
    case 'send_email':
      return cfg.subject ? `Tiêu đề: ${String(cfg.subject)}` : 'Gửi mẫu Email cá nhân hóa';
    case 'send_zns':
      return cfg.zns_template_id ? `ZNS ID: ${String(cfg.zns_template_id)}` : 'Gửi thông báo Zalo ZNS';
    case 'wait_delay':
      return cfg.mode === 'until_time'
        ? `Chờ tới ${String(cfg.until_time || '09:00')}`
        : `Chờ ${String(cfg.duration ?? 24)} ${String(cfg.unit || 'hours')}${cfg.business_hours_only ? ' (Giờ HC)' : ''}`;
    case 'if_else_condition':
      return Array.isArray(cfg.groups) && cfg.groups.length > 0
        ? `Đa nhóm ${String(cfg.root_logic || 'AND')} (${cfg.groups.length} nhóm điều kiện)`
        : `Nếu ${String(cfg.field || 'lead_score')} ${String(cfg.operator || '>=')} ${String(cfg.value ?? 30)}`;
    case 'ab_split':
      return `Chia ${Number(cfg.ratio_a ?? 50)}% Nhánh A / ${100 - Number(cfg.ratio_a ?? 50)}% Nhánh B`;
    case 'add_remove_tag':
      return `${cfg.operation === 'remove' ? 'Gỡ' : 'Gắn'} nhãn: ${String(cfg.tag || 'VIP')}`;
    case 'update_lead_score':
      return `Điểm nóng: ${Number(cfg.delta ?? 15) >= 0 ? '+' : ''}${String(cfg.delta ?? 15)} điểm`;
    case 'issue_voucher':
      return cfg.voucher_campaign_id ? 'Cấp mã từ Chiến dịch Voucher' : 'Phát hành mã Voucher tự động';
    case 'webhook_http':
      return `${String(cfg.method || 'POST')} ${String(cfg.url || 'https://api.partner.vn/webhook')}`;
    case 'notify_internal':
      return `Báo ${String(cfg.channel || 'WorkChat')}: ${String(cfg.recipient_role || 'Phụ trách Lead')}`;
    case 'push_to_autodata_sale_round':
      return cfg.round_id ? 'Đẩy vào Vòng chia Sale đã chọn' : 'Đẩy vào Vòng chia Sale Fair-Share ưu tiên';
    default:
      return '';
  }
}
