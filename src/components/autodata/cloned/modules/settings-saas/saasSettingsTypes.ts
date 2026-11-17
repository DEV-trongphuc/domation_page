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
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
  vietqr_template?: string;
  gps_lat?: number | null;
  gps_lng?: number | null;
  gps_radius_meters?: number;
  branch_ip_whitelist?: string[];
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
  default_route?: string | null;
  screen_access?: Record<string, boolean>;
  quick_actions?: Record<string, boolean>;
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

export interface CustomFieldDef {
  id: string;
  entity_type: string;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'url' | 'email' | 'phone' | 'textarea';
  options_json: string[];
  is_required: boolean;
  is_filterable: boolean;
  show_in_table: boolean;
  default_value?: string | null;
  placeholder?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface EntityTabDef {
  id: string;
  entity_type: string;
  tab_key: string;
  label: string;
  icon_name: string;
  tab_type: 'fields' | 'timeline' | 'files' | 'checklist' | 'embed';
  config_json: Record<string, unknown>;
  allowed_role_ids: string[];
  sort_order: number;
  is_active: boolean;
}

export interface LeadScoringRuleDef {
  id: string;
  name: string;
  description?: string | null;
  trigger_type: 'field_match' | 'stage_reached' | 'email_opened' | 'form_submitted' | 'web_visit';
  condition_json: { field?: string; operator?: string; value?: string };
  score_delta: number;
  max_applications: number;
  priority: number;
  is_active: boolean;
}

export interface CustomKpiDef {
  id: string;
  kpi_key: string;
  name: string;
  description?: string | null;
  module_key: string;
  source_entity: string;
  metric_op: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'CONVERSION_RATE';
  target_field?: string | null;
  target_value: number;
  unit: string;
  color_hex: string;
  is_active: boolean;
  computed_value?: number | null;
}

export interface NotificationRuleDef {
  id: string;
  event_key: string;
  name: string;
  description?: string | null;
  recipient_strategy: 'assigned_and_managers' | 'role_based' | 'department_based' | 'all_admins';
  target_roles_json: string[];
  target_departments_json: string[];
  include_owner: boolean;
  include_team_leader: boolean;
  channels_json: {
    in_app: boolean;
    email: boolean;
    zalo: boolean;
    telegram: boolean;
  };
  is_active: boolean;
}

export interface SystemEmailTemplateDef {
  id: string;
  template_key: string;
  name: string;
  category: string;
  subject_template: string;
  body_html: string;
  body_text?: string | null;
  variables_json: string[];
  is_system?: boolean;
  is_active: boolean;
}

export interface CronStatusJob {
  id?: string;
  subroutine_key: string;
  label?: string;
  schedule?: string;
  status: 'success' | 'running' | 'failed' | 'idle';
  items_processed: number;
  duration_ms: number;
  last_run_at?: string | null;
  started_at?: string | null;
  error_message?: string | null;
}

export interface WorkflowTaskTemplateDef {
  id: string;
  name: string;
  trigger_stage_id?: string | null;
  task_title: string;
  due_hours: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee_strategy: 'lead_owner' | 'team_leader' | 'specific_role';
  is_active: boolean;
}

export interface ApprovalWorkflowStepDef {
  step_order: number;
  approver_type: 'department_manager' | 'team_leader' | 'role' | 'position_rank' | 'specific_user';
  target_id?: string | null;
  label?: string;
}

export interface ApprovalWorkflowDto {
  id: string;
  name: string;
  entity_type: string;
  min_amount: number;
  max_amount?: number | null;
  steps_json: ApprovalWorkflowStepDef[];
  is_active: boolean;
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
