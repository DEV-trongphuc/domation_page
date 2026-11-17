import type { BadgeTone } from '../../components/ui/AutoDataLoadingModal';

export type ApprovalCategory =
  | 'leave'
  | 'overtime'
  | 'cash_advance'
  | 'expense'
  | 'purchase_order'
  | 'sales_order'
  | 'contract'
  | 'custom_form'
  | 'attendance_explanation';

export type ApproverType =
  | 'direct_manager'
  | 'team_leader'
  | 'department_head'
  | 'parent_department_head'
  | 'branch_director'
  | 'specific_role'
  | 'specific_user';

export interface DynamicFormFieldSchema {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea';
  required?: boolean;
  options?: string[];
}

export interface WorkflowStepDto {
  id?: string;
  step_order: number;
  step_name: string;
  approver_type: ApproverType;
  approver_role_id?: string | null;
  approver_role_name?: string | null;
  approver_user_id?: string | null;
  approver_user_name?: string | null;
  min_amount_threshold: number;
  max_amount_threshold: number | null;
  approval_mode: 'any_one' | 'all_must_approve';
  fallback_strategy: 'escalate_parent_dept' | 'tenant_admin';
  sla_hours: number;
  require_signature?: boolean;
}

export interface ApprovalWorkflowDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  category: ApprovalCategory;
  form_schema: DynamicFormFieldSchema[];
  icon_name?: string;
  color_hex?: string;
  require_attachment?: boolean;
  is_active: boolean;
  steps: WorkflowStepDto[];
}

export interface ApprovalStepLogDto {
  id: string;
  request_id: string;
  step_order: number;
  step_name: string;
  approval_mode: 'any_one' | 'all_must_approve';
  assigned_user_id: string;
  assigned_user_name?: string | null;
  assigned_user_email?: string | null;
  delegated_from_user_id?: string | null;
  delegated_from_user_name?: string | null;
  status: 'pending' | 'waiting' | 'approved' | 'rejected' | 'returned' | 'skipped';
  action_comment?: string | null;
  signature_data_url?: string | null;
  due_at?: string | null;
  acted_at?: string | null;
}

export interface ApprovalRequestDto {
  id: string;
  request_code: string;
  workflow_id: string;
  workflow_name?: string | null;
  workflow_color?: string | null;
  category: ApprovalCategory;
  title: string;
  description?: string | null;
  requester_user_id: string;
  requester_name?: string | null;
  requester_email?: string | null;
  requester_department_name?: string | null;
  amount_vnd: number;
  currency: string;
  start_date?: string | null;
  end_date?: string | null;
  form_data: Record<string, unknown>;
  attachments: string[];
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled';
  current_step_order: number;
  total_steps: number;
  step_logs: ApprovalStepLogDto[];
  can_current_user_act?: boolean;
  submitted_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface ApprovalDelegationDto {
  id: string;
  delegator_user_id: string;
  delegator_name?: string | null;
  delegator_email?: string | null;
  delegate_user_id: string;
  delegate_name?: string | null;
  delegate_email?: string | null;
  categories: string[];
  valid_from: string;
  valid_until: string;
  reason?: string | null;
  is_active: boolean;
}

export interface DirectoryUserItem {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface DirectoryRoleItem {
  id: string;
  role_key: string;
  name: string;
}

export interface ApprovalsOverviewDto {
  summary: {
    pending_to_approve: number;
    my_pending_requests: number;
    approved_requests: number;
    rejected_or_returned: number;
    active_workflows: number;
    active_delegations: number;
  };
  directory: {
    users: DirectoryUserItem[];
    roles: DirectoryRoleItem[];
    departments: Array<{ id: string; code: string; name: string }>;
    branches: Array<{ id: string; code: string; name: string }>;
  };
}

export interface SimulatedStepPlan {
  step_order: number;
  step_name: string;
  approver_type: string;
  approval_mode: 'any_one' | 'all_must_approve';
  sla_hours: number;
  assignees: Array<{
    assigned_user_id: string;
    assigned_user_name: string;
    delegated_from_user_id: string | null;
  }>;
}

export const CATEGORY_LABELS: Record<ApprovalCategory, string> = {
  leave: 'Nghỉ phép / Chế độ',
  overtime: 'Tăng ca (OT)',
  cash_advance: 'Tạm ứng',
  expense: 'Thanh toán chi phí',
  purchase_order: 'Đơn mua hàng (PO)',
  sales_order: 'Đơn bán hàng (SO)',
  contract: 'Hợp đồng pháp lý',
  custom_form: 'Biểu mẫu tùy chỉnh',
  attendance_explanation: 'Giải trình chấm công',
};

export const APPROVER_TYPE_LABELS: Record<ApproverType, string> = {
  direct_manager: 'Quản lý trực tiếp (Direct Manager)',
  team_leader: 'Trưởng nhóm (Team Leader)',
  department_head: 'Trưởng phòng ban (Department Head)',
  parent_department_head: 'Trưởng Khối / Phòng cấp trên (Parent Dept)',
  branch_director: 'Giám đốc Chi nhánh (Branch Director)',
  specific_role: 'Theo Vai trò RBAC cụ thể',
  specific_user: 'Chỉ định đích danh nhân sự',
};

export function getStatusBadgeMeta(status: string): { label: string; tone: BadgeTone } {
  switch (status) {
    case 'approved':
      return { label: 'Đã phê duyệt', tone: 'success' };
    case 'rejected':
      return { label: 'Đã từ chối', tone: 'danger' };
    case 'returned':
      return { label: 'Trả lại bổ sung', tone: 'warning' };
    case 'waiting':
      return { label: 'Đợi bước trước', tone: 'neutral' };
    case 'skipped':
      return { label: 'Bỏ qua', tone: 'neutral' };
    default:
      return { label: 'Đang chờ duyệt', tone: 'primary' };
  }
}
