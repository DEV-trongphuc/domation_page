import type { DataScopeKey, IndustryPresetKey, RbacActionKey } from '../../contexts/entitlementConstants';

export interface OrgBranch {
  id: string;
  name: string;
  code?: string;
  legal_entity_name?: string;
  tax_code?: string;
  representative_name?: string;
  representative_title?: string;
  address?: string;
  gps_lat?: number | null;
  gps_lng?: number | null;
  gps_radius_meters?: number;
  is_headquarters?: boolean;
}

export interface OrgDepartment {
  id: string;
  name: string;
  code?: string;
  branch_id?: string | null;
  parent_department_id?: string | null;
  manager_user_id?: string | null;
  default_role_id?: string | null;
  sort_order?: number;
}

export interface OrgTeam {
  id: string;
  name: string;
  code?: string;
  department_id?: string | null;
  branch_id?: string | null;
  leader_user_id?: string | null;
}

export interface OrgPosition {
  id: string;
  name: string;
  code?: string;
  department_id?: string | null;
  level_rank: number;
}

export interface OrgRole {
  id: string;
  name: string;
  role_key: string;
  description?: string;
  default_data_scope?: DataScopeKey;
  is_system?: boolean;
}

export interface PermissionMatrixEntry {
  module_key: string;
  data_scope: DataScopeKey;
  actions: Record<RbacActionKey, boolean>;
}

export interface UserPermissionOverride {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_label?: string;
  module_key: string;
  effect: 'grant' | 'deny';
  data_scope?: DataScopeKey;
  actions: Partial<Record<RbacActionKey, boolean>>;
}

export type FunnelCategoryKey =
  | 'new_uncontacted'
  | 'engaged_qualified'
  | 'negotiation_proposal'
  | 'closed_won'
  | 'closed_lost'
  | 'nurturing';

export interface StageTransitionRule {
  id: string;
  pipeline_id?: string | null;
  from_stage_id?: string | null;
  to_stage_id: string;
  required_fields: string[];
  allowed_role_ids: string[];
  require_note?: boolean;
  max_sla_hours?: number | null;
  score_delta?: number;
  auto_task_templates?: string[];
  notify_role_ids?: string[];
  trigger_flow_id?: string | null;
}

export interface PipelineQuickTab {
  id: string;
  key: string;
  label: string;
  filter_type: 'all' | 'uncontacted' | 'qualified' | 'negotiation' | 'won' | 'nurturing';
  enabled: boolean;
}

export interface PolicyDocumentItem {
  id: string;
  title: string;
  category?: 'hr_policy' | 'contract_terms' | 'warranty_return' | 'email_footer' | 'dom_agent_sop';
  doc_category?: string;
  version?: string | number;
  content?: string;
  content_html?: string;
  content_markdown?: string | null;
  allowed_department_ids?: string[];
  is_active?: boolean;
  synced_to_dom_agent?: boolean;
  sync_to_dom_agent?: boolean;
  last_synced_at?: string | null;
  last_synced_dom_agent_at?: string | null;
  updated_at?: string;
}

export interface OrgRbacBootstrapPayload {
  branches?: OrgBranch[];
  departments?: OrgDepartment[];
  teams?: OrgTeam[];
  positions?: OrgPosition[];
  roles?: OrgRole[];
  role_permissions?: Record<string, PermissionMatrixEntry[]> | Array<PermissionMatrixEntry & { role_id: string }>;
  department_permissions?: Record<string, PermissionMatrixEntry[]> | Array<PermissionMatrixEntry & { department_id: string }>;
  user_overrides?: UserPermissionOverride[];
  stage_rules?: StageTransitionRule[];
  policies?: PolicyDocumentItem[];
  terminology?: Record<string, string>;
  industry_key?: IndustryPresetKey;
  education_addon?: boolean;
  enable_ideas_mascot?: boolean;
  revenue_source?: string;
  brand_logo_url?: string;
  pipeline_tabs?: PipelineQuickTab[];
}

export const FUNNEL_CATEGORIES: ReadonlyArray<{
  key: FunnelCategoryKey;
  label: string;
  defaultScore: number;
  color: string;
}> = [
  { key: 'new_uncontacted', label: 'Mới tiếp nhận / Chưa liên hệ', defaultScore: 5, color: '#64748B' },
  { key: 'engaged_qualified', label: 'Đã tương tác / Đạt chuẩn (Qualified)', defaultScore: 25, color: '#1E40FF' },
  { key: 'negotiation_proposal', label: 'Gửi báo giá / Đàm phán sâu', defaultScore: 55, color: '#0284C7' },
  { key: 'closed_won', label: 'Chốt thành công (Closed Won)', defaultScore: 100, color: '#059669' },
  { key: 'closed_lost', label: 'Từ chối / Không phù hợp (Lost)', defaultScore: -20, color: '#DC2626' },
  { key: 'nurturing', label: 'Tạm hoãn / Đưa về Tệp Nuôi dưỡng', defaultScore: 10, color: '#D97706' },
];

export const POLICY_CATEGORIES: ReadonlyArray<{
  key: PolicyDocumentItem['category'];
  label: string;
}> = [
  { key: 'hr_policy', label: 'Nội quy Lao động, Chấm công & Nghỉ phép' },
  { key: 'contract_terms', label: 'Điều khoản Pháp lý Báo giá & Hợp đồng' },
  { key: 'warranty_return', label: 'Chính sách Bảo hành, Đổi trả & CSKH' },
  { key: 'email_footer', label: 'Chân trang Email & Tuyên bố Bảo mật' },
  { key: 'dom_agent_sop', label: 'SOP Quy trình Nội bộ cho DOM Agent' },
];

export function makeDefaultActionsMap(grantAll = false): Record<RbacActionKey, boolean> {
  return {
    view: true,
    create: grantAll,
    edit: grantAll,
    delete: grantAll,
    approve: grantAll,
    assign: grantAll,
    export: grantAll,
    import: grantAll,
    unmask_phone: grantAll,
    view_financials: grantAll,
    manage_config: grantAll,
  };
}
