import type { BadgeTone } from '../../components/ui/AutoDataLoadingModal';

export type ApprovalCategory =
  | 'deposit'
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
  auto_approve_if_creator_is_approver?: boolean;
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
  require_signature?: boolean;
}

export interface RequestSlaStatusDto {
  due_at?: string | null;
  remaining_hours?: number | null;
  is_overdue?: boolean;
  escalation_state?: 'overdue' | 'due_soon' | 'on_track' | 'completed';
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
  linked_entity_type?: string | null;
  linked_entity_id?: string | null;
  linked_preview?: Record<string, unknown> | null;
  form_data: Record<string, unknown>;
  attachments: string[];
  resolved_steps_snapshot?: Array<Record<string, unknown>>;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled';
  current_step_order: number;
  total_steps: number;
  step_logs: ApprovalStepLogDto[];
  can_current_user_act?: boolean;
  sla_status?: RequestSlaStatusDto;
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

/* ============================================================================
 * DEEP LINKED-ENTITY PREVIEW NORMALIZED TYPES
 * ============================================================================ */
export interface DepositTranchePreviewItem {
  tranche_no: number;
  title: string;
  due_date?: string | null;
  percentage?: number | null;
  amount_vnd: number;
  status: string;
}

export interface ExpenseVoucherLinePreview {
  description: string;
  category?: string | null;
  qty: number;
  unit_price_vnd: number;
  vat_vnd: number;
  total_vnd: number;
}

export interface OverlappingDeptLeaveItem {
  id?: string;
  request_code?: string;
  requester_name: string;
  title?: string;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
}

export interface OrderSkuLineItemPreview {
  sku: string;
  product_name: string;
  unit: string;
  qty: number;
  unit_price_vnd: number;
  tax_pct: number;
  tax_vnd: number;
  line_total_vnd: number;
}

export type ResolvedApprovalLinkedPreview =
  | {
      kind: 'deposit';
      customer_name: string | null;
      deal_or_project: string | null;
      amount_vnd: number;
      bank_name: string | null;
      bank_account: string | null;
      bank_holder: string | null;
      vietqr_url: string | null;
      tranches: DepositTranchePreviewItem[];
    }
  | {
      kind: 'expense';
      expense_category: string;
      cost_center_or_branch: string | null;
      has_vat_invoice: boolean;
      vat_amount_vnd: number;
      amount_vnd: number;
      beneficiary_bank: string | null;
      beneficiary_account: string | null;
      lines: ExpenseVoucherLinePreview[];
      receipt_urls: string[];
    }
  | {
      kind: 'leave';
      employee_code: string | null;
      employee_name: string;
      department_name: string | null;
      annual_leave_quota: number;
      annual_leave_used: number;
      annual_leave_remaining: number;
      requested_days: number;
      leave_type: string | null;
      date_range_label: string;
      overlapping_leaves: OverlappingDeptLeaveItem[];
    }
  | {
      kind: 'order';
      is_purchase_order: boolean;
      order_code: string;
      partner_name: string | null;
      delivery_note: string | null;
      subtotal_vnd: number;
      tax_total_vnd: number;
      grand_total_vnd: number;
      sku_items: OrderSkuLineItemPreview[];
    };

export const CATEGORY_LABELS: Record<ApprovalCategory, string> = {
  deposit: 'Đặt cọc / Tiến độ đợt thu',
  leave: 'Nghỉ phép / Chế độ',
  overtime: 'Tăng ca (OT)',
  cash_advance: 'Tạm ứng ngân sách',
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

export const FALLBACK_STRATEGY_LABELS: Record<WorkflowStepDto['fallback_strategy'], string> = {
  escalate_parent_dept: 'Tự động leo thang Khối / Phòng cấp trên',
  tenant_admin: 'Chuyển về Chủ doanh nghiệp (Tenant Admin)',
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

export interface EvaluatedSlaMeta {
  state: 'overdue' | 'warning' | 'active' | 'none';
  label: string;
  tone: BadgeTone;
  dueAt: string | null;
}

export function evaluateStepSla(
  dueAtIso: string | null | undefined,
  stepStatus: string,
  nowMs: number
): EvaluatedSlaMeta {
  if (stepStatus !== 'pending' || !dueAtIso) {
    return { state: 'none', label: '', tone: 'neutral', dueAt: dueAtIso || null };
  }
  const dueMs = new Date(dueAtIso).getTime();
  if (Number.isNaN(dueMs)) {
    return { state: 'none', label: '', tone: 'neutral', dueAt: null };
  }
  const diffHours = Math.round(((dueMs - nowMs) / 3_600_000) * 10) / 10;
  if (diffHours < 0) {
    return {
      state: 'overdue',
      label: `QUÁ HẠN SLA (${Math.abs(diffHours)}h) — Tự động leo thang`,
      tone: 'danger',
      dueAt: dueAtIso,
    };
  }
  if (diffHours <= 4) {
    return {
      state: 'warning',
      label: `Sắp hết hạn SLA: còn ${diffHours}h`,
      tone: 'warning',
      dueAt: dueAtIso,
    };
  }
  return {
    state: 'active',
    label: `Còn ${diffHours}h SLA`,
    tone: 'info',
    dueAt: dueAtIso,
  };
}

export function evaluateRequestSla(req: ApprovalRequestDto, nowMs: number): EvaluatedSlaMeta {
  if (req.status !== 'pending') {
    return { state: 'none', label: '', tone: 'neutral', dueAt: null };
  }
  if (req.sla_status?.is_overdue) {
    const h = Math.abs(Number(req.sla_status.remaining_hours || 0));
    return {
      state: 'overdue',
      label: h > 0 ? `QUÁ HẠN SLA (${h}h) — Tự động leo thang` : 'QUÁ HẠN SLA — Tự động leo thang',
      tone: 'danger',
      dueAt: req.sla_status.due_at || null,
    };
  }
  const activeStep = (req.step_logs || []).find((l) => l.status === 'pending' && l.due_at);
  const dueCandidate = activeStep?.due_at || req.sla_status?.due_at || null;
  return evaluateStepSla(dueCandidate, 'pending', nowMs);
}

const BANK_QR_CODES: ReadonlyArray<{ code: string; match: string }> = [
  { code: 'VCB', match: 'vietcom' },
  { code: 'TCB', match: 'techcom' },
  { code: 'MB', match: 'mb' },
  { code: 'ACB', match: 'acb' },
  { code: 'BIDV', match: 'bidv' },
  { code: 'ICB', match: 'vietin' },
  { code: 'VPB', match: 'vpbank' },
  { code: 'TPB', match: 'tpbank' },
  { code: 'STB', match: 'sacom' },
  { code: 'VIB', match: 'vib' },
  { code: 'VBA', match: 'agri' },
];

export function buildApprovalVietQrUrl(
  bankName?: string | null,
  accountNumber?: string | null,
  accountHolder?: string | null,
  amountVnd?: number,
  memo?: string
): string | null {
  if (!bankName || !accountNumber) return null;
  const low = bankName.trim().toLowerCase();
  const found = BANK_QR_CODES.find((b) => low === b.code.toLowerCase() || low.includes(b.match));
  const cleanAcc = accountNumber.replace(/[^0-9A-Za-z]/g, '');
  if (!found || !cleanAcc) return null;
  const qs = new URLSearchParams();
  if (accountHolder?.trim()) qs.set('accountName', accountHolder.trim().toUpperCase());
  if (amountVnd && amountVnd > 0) qs.set('amount', String(Math.round(amountVnd)));
  if (memo?.trim()) qs.set('addInfo', memo.trim());
  const qStr = qs.toString();
  return `https://img.vietqr.io/image/${found.code}-${cleanAcc}-compact2.png${qStr ? `?${qStr}` : ''}`;
}

function asNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asStr(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return null;
}

export function resolveDeepLinkedPreview(
  req: ApprovalRequestDto,
  rawPreview: Record<string, unknown> | null
): ResolvedApprovalLinkedPreview {
  const src = rawPreview || req.linked_preview || {};
  const fd = req.form_data || {};
  const linkedType = (req.linked_entity_type || '').toLowerCase();
  const pType = asStr(src.preview_type)?.toLowerCase() || '';

  // 1. Leave / Overtime / Attendance Explanation
  if (
    pType === 'leave_balance' ||
    req.category === 'leave' ||
    req.category === 'overtime' ||
    req.category === 'attendance_explanation'
  ) {
    const empObj =
      src.employee && typeof src.employee === 'object' ? (src.employee as Record<string, unknown>) : {};
    const quota = asNum(empObj.annual_leave_quota, 12);
    const used = asNum(empObj.annual_leave_used, 0);
    const remaining = asNum(empObj.annual_leave_remaining, Math.max(0, quota - used));
    const reqDays = asNum(src.requested_days ?? fd.total_days ?? fd.days, 1);

    const rawOverlaps = Array.isArray(src.overlapping_department_leaves)
      ? (src.overlapping_department_leaves as Array<Record<string, unknown>>)
      : [];

    const startStr = req.start_date ? String(req.start_date).slice(0, 10) : asStr(fd.work_date) || '—';
    const endStr = req.end_date ? String(req.end_date).slice(0, 10) : startStr;

    return {
      kind: 'leave',
      employee_code: asStr(empObj.employee_code),
      employee_name: asStr(empObj.full_name) || req.requester_name || 'Nhân sự đề xuất',
      department_name: asStr(empObj.department_name) || req.requester_department_name || null,
      annual_leave_quota: quota,
      annual_leave_used: used,
      annual_leave_remaining: remaining,
      requested_days: reqDays,
      leave_type: asStr(src.leave_type) || asStr(fd.leave_type),
      date_range_label: startStr === endStr ? startStr : `${startStr} → ${endStr}`,
      overlapping_leaves: rawOverlaps.map((o) => ({
        id: asStr(o.id) || undefined,
        request_code: asStr(o.request_code) || undefined,
        requester_name: asStr(o.requester_name) || asStr(o.employee_name) || 'Đồng nghiệp cùng phòng',
        title: asStr(o.title) || undefined,
        start_date: o.start_date ? String(o.start_date).slice(0, 10) : null,
        end_date: o.end_date ? String(o.end_date).slice(0, 10) : null,
        status: asStr(o.status) || 'pending',
      })),
    };
  }

  // 2. Purchase Order / Sales Order
  if (
    pType === 'purchase_order' ||
    pType === 'sales_order' ||
    req.category === 'purchase_order' ||
    req.category === 'sales_order' ||
    linkedType === 'purchase_order' ||
    linkedType === 'sales_order'
  ) {
    const isPo =
      pType === 'purchase_order' || req.category === 'purchase_order' || linkedType === 'purchase_order';
    const rawItems = Array.isArray(src.line_items)
      ? (src.line_items as Array<Record<string, unknown>>)
      : Array.isArray(fd.items)
        ? (fd.items as Array<Record<string, unknown>>)
        : [];

    const skuItems: OrderSkuLineItemPreview[] =
      rawItems.length > 0
        ? rawItems.map((it, idx) => {
            const qty = Math.max(1, asNum(it.quantity ?? it.qty, 1));
            const unitPrice = asNum(it.unit_price_vnd ?? it.unit_price ?? it.price, 0);
            const taxPct = asNum(it.tax_rate_pct ?? it.tax_pct ?? it.vat_pct, 8);
            const base = qty * unitPrice;
            const taxVnd = asNum(it.tax_amount_vnd ?? it.tax_vnd, Math.round((base * taxPct) / 100));
            const lineTotal = asNum(it.line_total_vnd ?? it.total_vnd, base + taxVnd);
            return {
              sku: asStr(it.sku ?? it.product_code) || `SKU-${idx + 1}`,
              product_name: asStr(it.product_name ?? it.item_name ?? it.description) || req.title,
              unit: asStr(it.unit) || 'Cái',
              qty,
              unit_price_vnd: unitPrice,
              tax_pct: taxPct,
              tax_vnd: taxVnd,
              line_total_vnd: lineTotal,
            };
          })
        : [
            {
              sku: req.request_code,
              product_name: req.title,
              unit: 'Gói',
              qty: 1,
              unit_price_vnd: req.amount_vnd,
              tax_pct: 0,
              tax_vnd: 0,
              line_total_vnd: req.amount_vnd,
            },
          ];

    const subtotal = skuItems.reduce((s, i) => s + i.qty * i.unit_price_vnd, 0);
    const taxTotal = skuItems.reduce((s, i) => s + i.tax_vnd, 0);
    const grandTotal = asNum(src.total_amount_vnd, subtotal + taxTotal || req.amount_vnd);

    return {
      kind: 'order',
      is_purchase_order: isPo,
      order_code: asStr(src.order_code) || req.request_code,
      partner_name: asStr(src.partner_name ?? fd.vendor_name ?? fd.customer_name),
      delivery_note: src.delivery_days ? `${src.delivery_days} ngày giao hàng` : asStr(fd.delivery_note),
      subtotal_vnd: subtotal,
      tax_total_vnd: taxTotal,
      grand_total_vnd: grandTotal,
      sku_items: skuItems,
    };
  }

  // 3. Deposit / Cash Advance
  if (
    pType === 'deposit_milestone' ||
    req.category === 'deposit' ||
    req.category === 'cash_advance' ||
    linkedType === 'deposit'
  ) {
    const bankName = asStr(src.beneficiary_bank ?? fd.beneficiary_bank ?? fd.bank_name);
    const bankAcc = asStr(src.beneficiary_account ?? fd.beneficiary_account ?? fd.bank_account);
    const bankHolder = asStr(src.beneficiary_holder ?? fd.beneficiary_holder) || req.requester_name || null;
    const rawMilestones = Array.isArray(src.milestones)
      ? (src.milestones as Array<Record<string, unknown>>)
      : [];

    const tranches: DepositTranchePreviewItem[] =
      rawMilestones.length > 0
        ? rawMilestones.map((m, idx) => ({
            tranche_no: asNum(m.tranche_number ?? m.tranche_no, idx + 1),
            title: asStr(m.title ?? m.milestone_name ?? m.name) || `Đợt thanh toán #${idx + 1}`,
            due_date: m.due_date ? String(m.due_date).slice(0, 10) : null,
            percentage: m.percentage !== undefined ? asNum(m.percentage, 0) : null,
            amount_vnd: asNum(m.amount_vnd ?? m.amount, 0),
            status: asStr(m.status) || 'pending',
          }))
        : [
            {
              tranche_no: 1,
              title: req.title,
              due_date: req.start_date ? String(req.start_date).slice(0, 10) : null,
              percentage: 100,
              amount_vnd: req.amount_vnd,
              status: req.status,
            },
          ];

    return {
      kind: 'deposit',
      customer_name: asStr(src.customer_name ?? fd.customer_name),
      deal_or_project: asStr(src.deal_title ?? fd.project_name ?? fd.purpose),
      amount_vnd: asNum(src.amount_vnd, req.amount_vnd),
      bank_name: bankName,
      bank_account: bankAcc,
      bank_holder: bankHolder,
      vietqr_url: buildApprovalVietQrUrl(
        bankName,
        bankAcc,
        bankHolder,
        req.amount_vnd,
        `${req.request_code} ${req.title}`.slice(0, 45)
      ),
      tranches,
    };
  }

  // 4. Expense Voucher / General Financial Document
  const rawExpenseItems = Array.isArray(src.items)
    ? (src.items as Array<Record<string, unknown>>)
    : Array.isArray(fd.items)
      ? (fd.items as Array<Record<string, unknown>>)
      : [];

  const vatAmount = asNum(src.vat_amount_vnd ?? fd.vat_amount_vnd, 0);
  const hasVat = Boolean(src.has_vat_invoice ?? fd.has_vat_invoice ?? vatAmount > 0);
  const legalEntity =
    src.legal_entity && typeof src.legal_entity === 'object'
      ? (src.legal_entity as Record<string, unknown>)
      : {};

  const lines: ExpenseVoucherLinePreview[] =
    rawExpenseItems.length > 0
      ? rawExpenseItems.map((it) => {
          const qty = Math.max(1, asNum(it.qty ?? it.quantity, 1));
          const unit = asNum(it.unit_price_vnd ?? it.amount_vnd, 0);
          const vat = asNum(it.vat_vnd, 0);
          return {
            description: asStr(it.description ?? it.name) || req.title,
            category: asStr(it.category),
            qty,
            unit_price_vnd: unit,
            vat_vnd: vat,
            total_vnd: asNum(it.total_vnd, qty * unit + vat),
          };
        })
      : [
          {
            description: req.title,
            category: asStr(src.expense_category ?? fd.expense_category) || CATEGORY_LABELS[req.category],
            qty: 1,
            unit_price_vnd: Math.max(0, req.amount_vnd - vatAmount),
            vat_vnd: vatAmount,
            total_vnd: req.amount_vnd,
          },
        ];

  return {
    kind: 'expense',
    expense_category: asStr(src.expense_category ?? fd.expense_category) || CATEGORY_LABELS[req.category],
    cost_center_or_branch:
      asStr(fd.cost_center) || asStr(legalEntity.name) || req.requester_department_name || null,
    has_vat_invoice: hasVat,
    vat_amount_vnd: vatAmount,
    amount_vnd: asNum(src.amount_vnd, req.amount_vnd),
    beneficiary_bank: asStr(src.beneficiary_bank ?? fd.beneficiary_bank),
    beneficiary_account: asStr(src.beneficiary_account ?? fd.beneficiary_account),
    lines,
    receipt_urls: (req.attachments || []).filter((u) => typeof u === 'string' && u.trim().length > 0),
  };
}
