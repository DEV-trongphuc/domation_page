export type AudienceType = 'static_data' | 'sync_data' | 'dynamic_logic';

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'gte'
  | 'lte'
  | 'in'
  | 'is_empty'
  | 'is_not_empty';

export interface FilterCondition {
  id: string;
  layer: 'profile' | 'crm' | 'marketing' | 'revenue';
  field: string;
  operator: FilterOperator;
  value: string;
}

export interface FilterBranch {
  id: string;
  name?: string;
  logic: 'AND';
  conditions: FilterCondition[];
}

export interface AudienceItem {
  id: string;
  name: string;
  description?: string;
  audience_type: AudienceType;
  filter_branches?: FilterBranch[];
  cached_member_count: number;
  auto_push_to_sale_round?: boolean;
  target_round_id?: string | null;
  target_round_name?: string | null;
  sync_source_url?: string | null;
  color_hex?: string;
  exclusions_count?: number;
  updated_at?: string;
  created_at?: string;
}

export interface AudienceTag {
  id: string;
  name: string;
  color_hex: string;
  usage_count?: number;
}

export interface MasterContactRow {
  id: string;
  name: string;
  phone?: string | null;
  masked_phone?: string | null;
  email?: string | null;
  source?: string | null;
  utm_source?: string | null;
  campaign?: string | null;
  product_interest?: string | null;
  status?: string;
  lifecycle_stage?: string;
  lead_score?: number;
  email_consent?: string;
  zns_consent?: string;
  total_revenue_vnd?: number;
  stage_id?: string | null;
  stage_name?: string | null;
  pipeline_id?: string | null;
  assigned_to_name?: string | null;
  tags?: AudienceTag[];
  custom_fields?: Record<string, unknown>;
  last_engaged_at?: string | null;
  created_at?: string;
}

export interface AudienceExclusionItem {
  id: string;
  lead_id?: string | null;
  email?: string | null;
  phone?: string | null;
  reason?: string | null;
  created_at?: string;
}

export interface AudienceFieldDefinition {
  key: string;
  label: string;
  layer: 'profile' | 'crm' | 'marketing' | 'revenue';
  valueType: 'text' | 'number' | 'select' | 'boolean';
  options?: Array<{ value: string; label: string }>;
}

export const FILTER_OPERATOR_OPTIONS: ReadonlyArray<{
  value: FilterOperator;
  label: string;
  types: ReadonlyArray<'text' | 'number' | 'select' | 'boolean'>;
}> = [
  { value: 'equals', label: 'Bằng chính xác (=)', types: ['text', 'number', 'select', 'boolean'] },
  { value: 'not_equals', label: 'Khác (!=)', types: ['text', 'number', 'select'] },
  { value: 'contains', label: 'Chứa từ khóa', types: ['text'] },
  { value: 'not_contains', label: 'Không chứa từ khóa', types: ['text'] },
  { value: 'gte', label: 'Lớn hơn hoặc bằng (>=)', types: ['number'] },
  { value: 'lte', label: 'Nhỏ hơn hoặc bằng (<=)', types: ['number'] },
  { value: 'in', label: 'Thuộc danh sách (cách dấu phẩy)', types: ['text', 'select'] },
  { value: 'is_empty', label: 'Đang để trống', types: ['text', 'select'] },
  { value: 'is_not_empty', label: 'Có dữ liệu (Không trống)', types: ['text', 'select'] },
];

export const LAYER_LABELS: Record<AudienceFieldDefinition['layer'], { label: string; badgeTone: 'primary' | 'info' | 'purple' | 'success' }> = {
  profile: { label: 'Tầng 1 • Hồ sơ & Custom Fields', badgeTone: 'primary' },
  crm: { label: 'Tầng 2 • Phễu CRM & Auto Data', badgeTone: 'info' },
  marketing: { label: 'Tầng 3 • Tương tác Đa kênh Marketing', badgeTone: 'purple' },
  revenue: { label: 'Tầng 4 • Giao dịch & Doanh thu ERP', badgeTone: 'success' },
};

export function buildDefaultFieldCatalog(params: {
  customerLabel: string;
  dealLabel: string;
  stages: Array<{ id: string; stage_name: string }>;
  pipelines: Array<{ id: string; name: string }>;
  customFields: Array<{ field_key: string; field_label: string; field_type: string }>;
  tags: AudienceTag[];
}): AudienceFieldDefinition[] {
  const base: AudienceFieldDefinition[] = [
    { key: 'name', label: `Tên ${params.customerLabel}`, layer: 'profile', valueType: 'text' },
    { key: 'phone', label: 'Số điện thoại', layer: 'profile', valueType: 'text' },
    { key: 'email', label: 'Địa chỉ Email', layer: 'profile', valueType: 'text' },
    { key: 'source', label: 'Nguồn thu thập (Source)', layer: 'profile', valueType: 'text' },
    { key: 'utm_source', label: 'UTM Source', layer: 'profile', valueType: 'text' },
    { key: 'campaign', label: 'Chiến dịch Quảng cáo', layer: 'profile', valueType: 'text' },
    { key: 'product_interest', label: 'Sản phẩm / Nhu cầu quan tâm', layer: 'profile', valueType: 'text' },
    { key: 'lead_score', label: 'Điểm nóng Lead Score', layer: 'profile', valueType: 'number' },
    {
      key: 'lifecycle_stage',
      label: 'Vòng đời khách hàng (Lifecycle)',
      layer: 'profile',
      valueType: 'select',
      options: [
        { value: 'subscriber', label: 'Subscriber (Đăng ký mới)' },
        { value: 'lead', label: 'Lead (Tiềm năng)' },
        { value: 'mql', label: 'MQL (Marketing Qualified)' },
        { value: 'sql', label: 'SQL (Sales Qualified)' },
        { value: 'customer', label: 'Customer (Đã mua)' },
        { value: 'evangelist', label: 'Evangelist (Khách trung thành)' },
      ],
    },
    ...(params.tags.length > 0
      ? [
          {
            key: 'tag',
            label: 'Nhãn phân loại (Tag)',
            layer: 'profile' as const,
            valueType: 'select' as const,
            options: params.tags.map((t) => ({ value: t.id, label: t.name })),
          },
        ]
      : []),
    ...params.customFields.map((cf) => ({
      key: `custom_fields.${cf.field_key}`,
      label: `Trường động: ${cf.field_label}`,
      layer: 'profile' as const,
      valueType: (cf.field_type === 'number' ? 'number' : 'text') as 'number' | 'text',
    })),

    // Layer 2: CRM & Auto Data
    {
      key: 'status',
      label: 'Trạng thái Điều phối (Status)',
      layer: 'crm',
      valueType: 'select',
      options: [
        { value: 'marketing_nurture', label: 'Đang nuôi dưỡng Marketing (Chưa chia Sale)' },
        { value: 'unassigned_pending', label: 'Chờ chia vòng Sale (Unassigned)' },
        { value: 'assigned', label: 'Đã giao Sale chăm sóc' },
      ],
    },
    ...(params.pipelines.length > 0
      ? [
          {
            key: 'pipeline_id',
            label: 'Thuộc Pipeline',
            layer: 'crm' as const,
            valueType: 'select' as const,
            options: params.pipelines.map((p) => ({ value: p.id, label: p.name })),
          },
        ]
      : []),
    ...(params.stages.length > 0
      ? [
          {
            key: 'stage_id',
            label: 'Bước chăm sóc (Pipeline Stage)',
            layer: 'crm' as const,
            valueType: 'select' as const,
            options: params.stages.map((s) => ({ value: s.id, label: s.stage_name })),
          },
        ]
      : []),
    {
      key: 'funnel_category',
      label: 'Nhóm phễu chuẩn hóa (Funnel Category)',
      layer: 'crm',
      valueType: 'select',
      options: [
        { value: 'new_uncontacted', label: 'Mới tiếp nhận / Chưa liên hệ' },
        { value: 'engaged_qualified', label: 'Đạt chuẩn tư vấn (Qualified)' },
        { value: 'negotiation_proposal', label: 'Gửi báo giá / Đàm phán' },
        { value: 'closed_won', label: 'Chốt thành công (Won)' },
        { value: 'closed_lost', label: 'Từ chối (Lost)' },
        { value: 'nurturing', label: 'Đang nuôi dưỡng lại' },
      ],
    },
    {
      key: 'sla_breached',
      label: 'Vi phạm SLA tiếp nhận',
      layer: 'crm',
      valueType: 'boolean',
      options: [
        { value: 'true', label: 'Có vi phạm SLA' },
        { value: 'false', label: 'Đạt chuẩn SLA' },
      ],
    },
    { key: 'inactive_days', label: 'Số ngày chưa tương tác', layer: 'crm', valueType: 'number' },

    // Layer 3: Marketing Omnichannel Engagement
    {
      key: 'email_consent',
      label: 'Trạng thái Nhận Email',
      layer: 'marketing',
      valueType: 'select',
      options: [
        { value: 'subscribed', label: 'Đang nhận (Subscribed)' },
        { value: 'unsubscribed', label: 'Đã hủy đăng ký (Unsubscribed)' },
        { value: 'bounced', label: 'Email lỗi (Bounced)' },
      ],
    },
    {
      key: 'zns_consent',
      label: 'Trạng thái Zalo OA / ZNS',
      layer: 'marketing',
      valueType: 'select',
      options: [
        { value: 'opted_in', label: 'Đã quan tâm / Opt-in' },
        { value: 'opted_out', label: 'Từ chối nhận tin' },
      ],
    },
    { key: 'opened_email', label: 'Đã mở Email Marketing', layer: 'marketing', valueType: 'text' },
    { key: 'clicked_email', label: 'Đã click Link trong Email', layer: 'marketing', valueType: 'text' },
    { key: 'submitted_form', label: 'Đã điền Form Card', layer: 'marketing', valueType: 'text' },
    { key: 'completed_survey', label: 'Đã hoàn thành Khảo sát / Quiz', layer: 'marketing', valueType: 'text' },
    { key: 'quiz_score', label: 'Điểm khảo sát / Quiz', layer: 'marketing', valueType: 'number' },
    { key: 'visited_url', label: 'Đã truy cập URL Website', layer: 'marketing', valueType: 'text' },
    { key: 'claimed_voucher', label: 'Đã nhận mã Voucher', layer: 'marketing', valueType: 'text' },

    // Layer 4: Revenue & ERP Orders
    { key: 'total_revenue_vnd', label: `Tổng giá trị ${params.dealLabel} (VNĐ)`, layer: 'revenue', valueType: 'number' },
    {
      key: 'is_won_stage',
      label: 'Đã chốt thành công (Won Stage)',
      layer: 'revenue',
      valueType: 'boolean',
      options: [
        { value: 'true', label: 'Đã chốt thành công' },
        { value: 'false', label: 'Chưa chốt' },
      ],
    },
  ];
  return base;
}

export function evaluateContactLocally(
  contact: MasterContactRow,
  branches: FilterBranch[]
): boolean {
  if (!branches || branches.length === 0) return true;
  return branches.some((branch) => {
    if (!branch.conditions || branch.conditions.length === 0) return true;
    return branch.conditions.every((cond) => {
      let rawVal: unknown;
      if (cond.field.startsWith('custom_fields.')) {
        const subKey = cond.field.slice('custom_fields.'.length);
        rawVal = contact.custom_fields?.[subKey];
      } else if (cond.field === 'tag' || cond.field === 'tag_id') {
        rawVal = (contact.tags || []).map((t) => `${t.id},${t.name}`).join(',');
      } else {
        rawVal = (contact as unknown as Record<string, unknown>)[cond.field];
      }
      const strVal = String(rawVal ?? '').toLowerCase().trim();
      const target = String(cond.value ?? '').toLowerCase().trim();

      switch (cond.operator) {
        case 'is_empty':
          return strVal === '';
        case 'is_not_empty':
          return strVal !== '';
        case 'equals':
          return strVal === target;
        case 'not_equals':
          return strVal !== target;
        case 'contains':
          return strVal.includes(target);
        case 'not_contains':
          return !strVal.includes(target);
        case 'gte':
          return Number(rawVal ?? 0) >= Number(cond.value || 0);
        case 'lte':
          return Number(rawVal ?? 0) <= Number(cond.value || 0);
        case 'in': {
          const items = target.split(',').map((s) => s.trim()).filter(Boolean);
          return items.some((it) => strVal.includes(it));
        }
        default:
          return true;
      }
    });
  });
}

export function summarizeFilterBranches(
  branches: FilterBranch[] | undefined,
  fieldCatalog: AudienceFieldDefinition[]
): string {
  if (!branches || branches.length === 0) return 'Tất cả hồ sơ hợp lệ trong Workspace';
  const fieldMap = new Map(fieldCatalog.map((f) => [f.key, f.label]));
  return branches
    .map((b) => {
      const parts = (b.conditions || []).map((c) => {
        const label = fieldMap.get(c.field) || c.field;
        if (c.operator === 'is_empty') return `${label} trống`;
        if (c.operator === 'is_not_empty') return `${label} có dữ liệu`;
        return `${label} ${c.operator} "${c.value}"`;
      });
      return parts.length > 1 ? `(${parts.join(' VÀ ')})` : parts[0] || '';
    })
    .filter(Boolean)
    .join(' HOẶC ');
}
