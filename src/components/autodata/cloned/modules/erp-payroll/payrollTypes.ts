export interface TaxBracketItem {
  up_to: number | null;
  rate: number;
}

export interface AllowanceDefinitionItem {
  key: string;
  name: string;
  tax_mode: 'taxable' | 'meal_cap' | 'exempt';
  prorate: boolean;
  include_insurance: boolean;
}

export interface PayrollConfigDto {
  id?: string;
  currency: string;
  standard_workdays_mode: 'calendar' | 'fixed';
  fixed_standard_workdays: number;
  saturday_work_mode: 'off' | 'half' | 'full';
  emp_bhxh_rate: number;
  emp_bhyt_rate: number;
  emp_bhtn_rate: number;
  er_bhxh_rate: number;
  er_bhyt_rate: number;
  er_bhtn_rate: number;
  er_union_rate: number;
  emp_union_rate: number;
  bhxh_salary_cap_vnd: number;
  bhtn_salary_cap_vnd: number;
  personal_deduction_vnd: number;
  dependent_deduction_vnd: number;
  meal_allowance_exempt_cap_vnd: number;
  non_resident_flat_tax_rate?: number;
  casual_withholding_threshold_vnd?: number;
  casual_flat_tax_rate?: number;
  pit_brackets: TaxBracketItem[];
  allowance_definitions: AllowanceDefinitionItem[];
  tax_authority_code?: string | null;
  tax_authority_name?: string | null;
}

export interface PayrollPeriodDto {
  id: string;
  period_key: string;
  year: number;
  month: number;
  title: string;
  standard_workdays: number;
  status: 'draft' | 'calculated' | 'pending_approval' | 'approved' | 'paid' | 'locked';
  employee_count: number;
  total_gross_vnd: number;
  total_emp_insurance_vnd: number;
  total_er_insurance_vnd: number;
  total_pit_tax_vnd: number;
  total_commission_vnd: number;
  total_net_vnd: number;
}

export interface ProgressiveTaxSliceDto {
  bracket_index: number;
  from_vnd: number;
  to_vnd: number | null;
  rate: number;
  taxable_slice_vnd: number;
  tax_vnd: number;
}

export interface AllowanceLineDto {
  key: string;
  name: string;
  amount_vnd: number;
  exempt_vnd: number;
}

export interface PayrollSlipBreakdownDto {
  pit_breakdown?: ProgressiveTaxSliceDto[];
  allowance_lines?: AllowanceLineDto[];
  er_bhxh_vnd?: number;
  er_bhyt_vnd?: number;
  er_bhtn_vnd?: number;
  er_union_vnd?: number;
  signature_data_url?: string;
  signed_at?: string;
  signed_ip?: string;
  dispute_reason?: string;
  disputed_at?: string;
}

export interface PayrollSlipDto {
  id: string;
  period_id: string;
  period_key?: string;
  employee_id: string;
  user_id?: string | null;
  employee_code?: string;
  employee_name?: string;
  job_title?: string | null;
  department_name?: string | null;
  tax_code?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  standard_workdays: number;
  actual_workdays: number;
  paid_leave_days?: number;
  unpaid_leave_days?: number;
  overtime_hours: number;
  base_salary_vnd: number;
  prorated_base_pay_vnd: number;
  allowances_vnd: number;
  tax_exempt_vnd: number;
  overtime_pay_vnd: number;
  commission_pay_vnd: number;
  bonus_vnd: number;
  gross_pay_vnd: number;
  insurance_salary_base_vnd?: number;
  emp_bhxh_vnd: number;
  emp_bhyt_vnd: number;
  emp_bhtn_vnd: number;
  emp_union_vnd: number;
  er_insurance_total_vnd: number;
  dependents_count: number;
  family_deduction_vnd: number;
  taxable_income_vnd: number;
  assessable_income_vnd: number;
  pit_tax_vnd: number;
  advance_deduction_vnd: number;
  other_deduction_vnd: number;
  net_pay_vnd: number;
  tax_method?: string;
  payment_status: 'unpaid' | 'paid';
  confirmation_status?: 'pending' | 'signed' | 'confirmed' | 'disputed';
  signature_data_url?: string | null;
  signed_at?: string | null;
  signed_ip?: string | null;
  dispute_reason?: string | null;
  disputed_at?: string | null;
  breakdown?: PayrollSlipBreakdownDto;
}

export interface SimulationResultDto {
  gross_pay_vnd: number;
  emp_bhxh_vnd: number;
  emp_bhyt_vnd: number;
  emp_bhtn_vnd: number;
  emp_insurance_total_vnd: number;
  er_insurance_total_vnd: number;
  family_deduction_vnd: number;
  assessable_income_vnd: number;
  pit_tax_vnd: number;
  net_pay_vnd: number;
  total_employer_cost_vnd: number;
  pit_breakdown: ProgressiveTaxSliceDto[];
}

export interface CommissionRuleDto {
  id: string;
  name: string;
  description?: string | null;
  rule_type: 'percentage_revenue' | 'tiered_revenue' | 'fixed_per_won_lead';
  flat_rate_pct: number;
  fixed_amount_vnd: number;
  min_revenue_threshold_vnd: number;
  is_active: boolean;
}

export interface CommissionLedgerDto {
  id: string;
  period_key: string;
  user_id: string;
  user_name?: string | null;
  rule_name?: string | null;
  source_title: string;
  revenue_base_vnd: number;
  commission_amount_vnd: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
}

export interface LegalEntityInfoDto {
  legal_entity_name: string;
  tax_code: string;
  address: string;
  phone: string;
  email: string;
  representative_name: string;
  logo_url: string;
  tax_authority_code: string;
  tax_authority_name: string;
}

export interface ApprovalWorkflowLiteDto {
  id: string;
  code: string;
  name: string;
  category: string;
  is_active: boolean;
}

export interface ApprovalStepLogLiteDto {
  id: string;
  step_order: number;
  step_name: string;
  status: string;
  assigned_user_name?: string | null;
  comment?: string | null;
  acted_at?: string | null;
}

export interface PersonalApprovalRequestDto {
  id: string;
  workflow_id: string;
  workflow_name?: string | null;
  category: string;
  title: string;
  description?: string | null;
  amount_vnd: number;
  start_date?: string | null;
  end_date?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled' | string;
  form_data: Record<string, unknown>;
  step_logs: ApprovalStepLogLiteDto[];
  created_at: string;
}

export type CooperationSlipStatus =
  | 'pending_signatures'
  | 'pending_manager_approval'
  | 'approved'
  | 'disputed'
  | 'rejected';

export interface CooperationShareholderDto {
  user_id: string;
  user_name: string;
  email: string;
  percentage: number;
  amount_vnd: number;
  signed: boolean;
  signature_data_url: string | null;
  signed_at: string | null;
  signed_ip: string | null;
}

export interface CooperationSlipDto {
  id: string;
  code: string;
  customer_name: string;
  customer_phone: string;
  deal_code: string;
  project_name: string;
  expected_revenue_vnd: number;
  expected_commission_vnd: number;
  total_percentage: number;
  status: CooperationSlipStatus;
  shareholders: CooperationShareholderDto[];
  dispute_reason: string | null;
  disputed_by_name: string | null;
  disputed_at: string | null;
  decision_comment: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface TenantDirectoryMemberDto {
  id: string;
  full_name: string;
  email: string;
  role?: string;
  department_name?: string | null;
}

export const PAYROLL_SHARED_INPUT_STYLE = {
  width: '100%',
  height: 44,
  padding: '0 0.85rem',
  borderRadius: 12,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: '0.86rem',
  outline: 'none',
} as const;

export const PAYROLL_SHARED_LABEL_STYLE = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
} as const;

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function asNum(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function asStr(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : val == null ? fallback : String(val);
}

export function triggerBrowserFileDownload(
  filename: string,
  content: string,
  mimeType: string
): void {
  const bom = mimeType.includes('csv') ? '\uFEFF' : '';
  const blob = new Blob([bom + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const VI_DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readThreeDigits(triple: number, showZeroHundred: boolean): string {
  const hundreds = Math.floor(triple / 100);
  const tens = Math.floor((triple % 100) / 10);
  const ones = triple % 10;
  const parts: string[] = [];

  if (hundreds > 0 || showZeroHundred) {
    parts.push(`${VI_DIGITS[hundreds]} trăm`);
  }

  if (tens > 1) {
    parts.push(`${VI_DIGITS[tens]} mươi`);
    if (ones === 1) parts.push('mốt');
    else if (ones === 4) parts.push('bốn');
    else if (ones === 5) parts.push('lăm');
    else if (ones > 0) parts.push(VI_DIGITS[ones]);
  } else if (tens === 1) {
    parts.push('mười');
    if (ones === 5) parts.push('lăm');
    else if (ones > 0) parts.push(VI_DIGITS[ones]);
  } else if (tens === 0 && ones > 0) {
    if (hundreds > 0 || showZeroHundred) {
      parts.push('lẻ');
    }
    parts.push(VI_DIGITS[ones]);
  }

  return parts.join(' ').trim();
}

function readIntegerVietnamese(n: number): string {
  const abs = Math.round(Math.abs(n));
  if (abs === 0) return 'không';

  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const groups: number[] = [];
  let rem = abs;
  while (rem > 0) {
    groups.push(rem % 1000);
    rem = Math.floor(rem / 1000);
  }

  const segments: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const grp = groups[i];
    if (grp === 0) continue;
    const isHighest = i === groups.length - 1;
    const text = readThreeDigits(grp, !isHighest);
    const unit = units[i] || '';
    segments.push(unit ? `${text} ${unit}` : text);
  }

  return segments.join(' ').replace(/\s+/g, ' ').trim();
}

export function vndToVietnameseWords(amount: number): string {
  if (!Number.isFinite(amount) || Math.round(amount) === 0) {
    return 'Không đồng';
  }
  const rounded = Math.round(amount);
  const prefix = rounded < 0 ? 'Âm ' : '';
  const body = readIntegerVietnamese(Math.abs(rounded));
  const full = `${prefix}${body} đồng chẵn`;
  return full.charAt(0).toUpperCase() + full.slice(1);
}

export function percentageToVietnameseWords(pct: number): string {
  if (!Number.isFinite(pct) || pct <= 0) return 'Không phần trăm';
  if (Math.abs(pct - 100) < 0.0001) return 'Một trăm phần trăm';

  const intPart = Math.trunc(Math.abs(pct));
  const decStr = Math.abs(pct).toFixed(2).split('.')[1]?.replace(/0+$/, '') || '';
  const intWords = readIntegerVietnamese(intPart);

  let combined = intWords;
  if (decStr) {
    const decVal = Number(decStr);
    const decWords = decStr.startsWith('0')
      ? `không ${VI_DIGITS[Number(decStr[1]) || 0]}`
      : readIntegerVietnamese(decVal);
    combined = `${intWords} phẩy ${decWords}`;
  }

  const text = `${combined} phần trăm`.replace(/\s+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatPayrollPeriodLabel(periodKey: string): string {
  const parts = String(periodKey || '').split('-');
  if (parts.length < 2) return periodKey;
  const [yr, suffix] = parts;
  if (suffix === '13') return `Lương tháng 13 / ${yr}`;
  if (suffix === 'MID') return `Thưởng giữa năm / ${yr}`;
  if (suffix === 'YEND') return `Thưởng cuối năm / ${yr}`;
  return `Tháng ${suffix}/${yr}`;
}

export function formatPayrollDocumentTitle(periodKey: string): string {
  const suffix = String(periodKey || '').split('-')[1] || '';
  if (suffix === '13') return 'PHIẾU THANH TOÁN LƯƠNG THÁNG 13';
  if (suffix === 'MID') return 'PHIẾU THANH TOÁN THƯỞNG GIỮA NĂM';
  if (suffix === 'YEND') return 'PHIẾU THANH TOÁN THƯỞNG CUỐI NĂM';
  return 'PHIẾU THANH TOÁN TIỀN LƯƠNG & THUẾ TNCN';
}

export function buildPeriodSelectorOptions(year: number): Array<{ value: string; label: string; shortLabel: string; isSpecial: boolean }> {
  const items: Array<{ value: string; label: string; shortLabel: string; isSpecial: boolean }> = [];
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0');
    items.push({
      value: `${year}-${mm}`,
      label: `Tháng ${mm}/${year}`,
      shortLabel: `Tháng ${m}`,
      isSpecial: false,
    });
  }
  items.push(
    { value: `${year}-13`, label: `Lương tháng 13 - ${year}`, shortLabel: 'Lương T13', isSpecial: true },
    { value: `${year}-MID`, label: `Thưởng giữa năm - ${year}`, shortLabel: 'Thưởng Giữa Năm', isSpecial: true },
    { value: `${year}-YEND`, label: `Thưởng cuối năm - ${year}`, shortLabel: 'Thưởng Cuối Năm', isSpecial: true }
  );
  return items;
}

export function normalizeSlipRecord(raw: unknown): PayrollSlipDto | null {
  if (!isRecord(raw)) return null;
  const bdRaw = isRecord(raw.breakdown) ? raw.breakdown : {};
  const pitBreakdown = Array.isArray(bdRaw.pit_breakdown)
    ? (bdRaw.pit_breakdown as ProgressiveTaxSliceDto[])
    : [];
  const allowanceLines = Array.isArray(bdRaw.allowance_lines)
    ? (bdRaw.allowance_lines as AllowanceLineDto[])
    : [];

  const sigUrl =
    asStr(raw.employee_signature_url) ||
    asStr(raw.signature_data_url) ||
    asStr(raw.signature_url) ||
    asStr(bdRaw.signature_data_url) ||
    null;
  const signedAt =
    asStr(raw.employee_signed_at) ||
    asStr(raw.signed_at) ||
    asStr(raw.confirmed_at) ||
    asStr(bdRaw.signed_at) ||
    null;
  const disputeReason =
    asStr(raw.dispute_note) ||
    asStr(raw.dispute_reason) ||
    asStr(raw.note) ||
    asStr(bdRaw.dispute_reason) ||
    null;

  const rawConf = asStr(raw.confirmation_status || raw.status).toLowerCase();
  const disputeStatusRaw = asStr(raw.dispute_status).toLowerCase();
  let confStatus: PayrollSlipDto['confirmation_status'] = 'pending';
  if (rawConf === 'disputed' || disputeStatusRaw === 'open') confStatus = 'disputed';
  else if (
    rawConf === 'signed' ||
    rawConf === 'confirmed' ||
    Boolean(raw.signed_by_employee) ||
    Boolean(sigUrl)
  ) {
    confStatus = 'signed';
  }

  return {
    id: asStr(raw.id),
    period_id: asStr(raw.period_id),
    period_key: asStr(raw.period_key || raw.month_year),
    employee_id: asStr(raw.employee_id),
    user_id: raw.user_id ? asStr(raw.user_id) : null,
    employee_code: asStr(raw.employee_code),
    employee_name: asStr(raw.employee_name || raw.full_name),
    job_title: raw.job_title ? asStr(raw.job_title) : null,
    department_name: raw.department_name ? asStr(raw.department_name) : null,
    tax_code: raw.tax_code ? asStr(raw.tax_code) : null,
    bank_name: raw.bank_name ? asStr(raw.bank_name) : null,
    bank_account_number: raw.bank_account_number ? asStr(raw.bank_account_number) : null,
    standard_workdays: asNum(raw.standard_workdays ?? raw.work_days_required, 22),
    actual_workdays: asNum(raw.actual_workdays ?? raw.work_days_actual, 22),
    paid_leave_days: asNum(raw.paid_leave_days, 0),
    unpaid_leave_days: asNum(raw.unpaid_leave_days, 0),
    overtime_hours: asNum(raw.overtime_hours, 0),
    base_salary_vnd: asNum(raw.base_salary_vnd ?? raw.salary_basic, 0),
    prorated_base_pay_vnd: asNum(raw.prorated_base_pay_vnd ?? raw.salary_basic_calculated, 0),
    allowances_vnd: asNum(raw.allowances_vnd ?? raw.allowance_total, 0),
    tax_exempt_vnd: asNum(raw.tax_exempt_vnd, 0),
    overtime_pay_vnd: asNum(raw.overtime_pay_vnd ?? raw.overtime_salary, 0),
    commission_pay_vnd: asNum(raw.commission_pay_vnd ?? raw.kpi_bonus, 0),
    bonus_vnd: asNum(raw.bonus_vnd ?? raw.diligence_bonus, 0),
    gross_pay_vnd: asNum(raw.gross_pay_vnd, 0),
    insurance_salary_base_vnd: asNum(raw.insurance_salary_base_vnd, 0),
    emp_bhxh_vnd: asNum(raw.emp_bhxh_vnd ?? raw.insurance_bhxh, 0),
    emp_bhyt_vnd: asNum(raw.emp_bhyt_vnd ?? raw.insurance_bhyt, 0),
    emp_bhtn_vnd: asNum(raw.emp_bhtn_vnd ?? raw.insurance_bhtn, 0),
    emp_union_vnd: asNum(raw.emp_union_vnd, 0),
    er_insurance_total_vnd: asNum(raw.er_insurance_total_vnd, 0),
    dependents_count: asNum(raw.dependents_count, 0),
    family_deduction_vnd: asNum(raw.family_deduction_vnd, 0),
    taxable_income_vnd: asNum(raw.taxable_income_vnd, 0),
    assessable_income_vnd: asNum(raw.assessable_income_vnd, 0),
    pit_tax_vnd: asNum(raw.pit_tax_vnd ?? raw.tax_pit, 0),
    advance_deduction_vnd: asNum(raw.advance_deduction_vnd ?? raw.advance_deduction, 0),
    other_deduction_vnd: asNum(raw.other_deduction_vnd ?? raw.lateness_penalty, 0),
    net_pay_vnd: asNum(raw.net_pay_vnd ?? raw.net_salary, 0),
    tax_method: asStr(raw.tax_method, 'progressive'),
    payment_status: asStr(raw.payment_status) === 'paid' ? 'paid' : 'unpaid',
    confirmation_status: confStatus,
    signature_data_url: sigUrl,
    signed_at: signedAt,
    signed_ip: asStr(raw.signed_ip || bdRaw.signed_ip) || null,
    dispute_reason: disputeReason,
    disputed_at: asStr(raw.disputed_at || bdRaw.disputed_at) || null,
    breakdown: {
      pit_breakdown: pitBreakdown,
      allowance_lines: allowanceLines,
      er_bhxh_vnd: asNum(bdRaw.er_bhxh_vnd, 0),
      er_bhyt_vnd: asNum(bdRaw.er_bhyt_vnd, 0),
      er_bhtn_vnd: asNum(bdRaw.er_bhtn_vnd, 0),
      er_union_vnd: asNum(bdRaw.er_union_vnd, 0),
    },
  };
}

export function normalizeLegalEntity(
  raw: unknown,
  fallbackCompanyName: string,
  fallbackLogoUrl = ''
): LegalEntityInfoDto {
  const r = isRecord(raw) ? raw : {};
  return {
    legal_entity_name:
      asStr(r.legal_entity_name) ||
      asStr(r.company_name) ||
      asStr(r.name) ||
      fallbackCompanyName ||
      'Doanh nghiệp thành viên',
    tax_code: asStr(r.tax_code || r.mst),
    address: asStr(r.address || r.company_address),
    phone: asStr(r.phone || r.company_phone),
    email: asStr(r.email || r.company_email),
    representative_name: asStr(r.representative_name || r.signer_name),
    logo_url: asStr(r.logo_url || r.brand_logo_url || fallbackLogoUrl),
    tax_authority_code: asStr(r.tax_authority_code),
    tax_authority_name: asStr(r.tax_authority_name),
  };
}

export function normalizeMyPayslipsPayload(
  raw: unknown,
  fallbackCompanyName: string,
  fallbackLogoUrl: string,
  selectedPeriod: string
): {
  legalEntity: LegalEntityInfoDto;
  slips: PayrollSlipDto[];
  currentSlip: PayrollSlipDto | null;
} {
  if (Array.isArray(raw)) {
    const slips = raw.map(normalizeSlipRecord).filter((x): x is PayrollSlipDto => x !== null);
    const matched = slips.find((s) => s.period_key === selectedPeriod) || slips[0] || null;
    return {
      legalEntity: normalizeLegalEntity({}, fallbackCompanyName, fallbackLogoUrl),
      slips,
      currentSlip: matched,
    };
  }

  const obj = isRecord(raw) ? raw : {};
  const legalEntity = normalizeLegalEntity(
    obj.legal_entity ?? obj.company ?? obj.branch ?? obj,
    fallbackCompanyName,
    fallbackLogoUrl
  );

  const rawList = Array.isArray(obj.all_payslips)
    ? obj.all_payslips
    : Array.isArray(obj.slips)
      ? obj.slips
      : Array.isArray(obj.payslips)
        ? obj.payslips
        : Array.isArray(obj.items)
          ? obj.items
          : [];
  const slips = rawList.map(normalizeSlipRecord).filter((x): x is PayrollSlipDto => x !== null);

  const explicitCurrent = normalizeSlipRecord(obj.current_slip ?? obj.payslip ?? obj.slip);
  const currentSlip =
    explicitCurrent ||
    slips.find((s) => s.period_key === selectedPeriod) ||
    (slips.length === 1 ? slips[0] : null);

  if (currentSlip && !slips.some((s) => s.id === currentSlip.id)) {
    slips.unshift(currentSlip);
  }

  return { legalEntity, slips, currentSlip };
}

export function normalizeCooperationSlip(raw: unknown): CooperationSlipDto | null {
  if (!isRecord(raw)) return null;
  const expectedComm = asNum(raw.expected_commission_vnd ?? raw.expected_commission, 0);
  const rawShares = Array.isArray(raw.shareholders)
    ? raw.shareholders
    : Array.isArray(raw.shares)
      ? raw.shares
      : [];

  const shareholders: CooperationShareholderDto[] = rawShares
    .filter(isRecord)
    .map((sh) => {
      const pct = asNum(sh.percentage ?? sh.share_pct, 0);
      return {
        user_id: asStr(sh.user_id),
        user_name: asStr(sh.user_name || sh.full_name || sh.name || sh.email || sh.user_id),
        email: asStr(sh.email),
        percentage: pct,
        amount_vnd: asNum(sh.amount_vnd, Math.round((expectedComm * pct) / 100)),
        signed: Boolean(
          sh.signed || sh.is_signed || sh.signature_url || sh.signature_data_url || sh.signature_img
        ),
        signature_data_url:
          asStr(sh.signature_url || sh.signature_data_url || sh.signature_img) || null,
        signed_at: asStr(sh.signed_at || sh.signature_time) || null,
        signed_ip: asStr(sh.signed_ip || sh.signature_ip) || null,
      };
    });

  const rawStatus = asStr(raw.status, 'pending_signatures') as CooperationSlipStatus;
  const validStatuses: CooperationSlipStatus[] = [
    'pending_signatures',
    'pending_manager_approval',
    'approved',
    'disputed',
    'rejected',
  ];
  const status: CooperationSlipStatus = validStatuses.includes(rawStatus)
    ? rawStatus
    : 'pending_signatures';

  const totalPct =
    raw.total_percentage !== undefined
      ? asNum(raw.total_percentage, 0)
      : shareholders.reduce((acc, s) => acc + s.percentage, 0);

  return {
    id: asStr(raw.id),
    code: asStr(raw.slip_code || raw.code || `COOP-${asStr(raw.id).slice(0, 6).toUpperCase()}`),
    customer_name: asStr(
      raw.partner_name || raw.customer_name || raw.full_name || raw.title || 'Khách hàng'
    ),
    customer_phone: asStr(raw.partner_contact || raw.customer_phone || raw.phone),
    deal_code: asStr(raw.deal_code || raw.unit_code),
    project_name: asStr(raw.project_name || raw.title),
    expected_revenue_vnd: asNum(
      raw.estimated_value_vnd ?? raw.expected_revenue_vnd ?? raw.expected_revenue,
      0
    ),
    expected_commission_vnd: expectedComm,
    total_percentage: Math.round(totalPct * 100) / 100,
    status,
    shareholders,
    dispute_reason: asStr(raw.dispute_reason || raw.dispute_details) || null,
    disputed_by_name: asStr(raw.disputed_by_name) || null,
    disputed_at: asStr(raw.disputed_at) || null,
    decision_comment: asStr(raw.decision_comment || raw.manager_comment) || null,
    approved_by_name:
      asStr(raw.approved_by_name) ||
      (isRecord(raw.approver) ? asStr(raw.approver.name) : '') ||
      null,
    approved_at:
      asStr(raw.approved_at) ||
      (isRecord(raw.approver) ? asStr(raw.approver.approved_at) : '') ||
      null,
    notes: asStr(raw.notes) || null,
    created_by: raw.created_by ? asStr(raw.created_by) : null,
    created_by_name: asStr(raw.created_by_name) || null,
    created_at: asStr(raw.created_at),
  };
}

export function normalizeCooperationSlipsList(raw: unknown): CooperationSlipDto[] {
  const list = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.items)
      ? raw.items
      : isRecord(raw) && Array.isArray(raw.slips)
        ? raw.slips
        : [];
  return list.map(normalizeCooperationSlip).filter((x): x is CooperationSlipDto => x !== null);
}

export function extractCoopSalesAccounts(raw: unknown): TenantDirectoryMemberDto[] {
  if (!isRecord(raw) || !Array.isArray(raw.sales_accounts)) return [];
  return raw.sales_accounts.filter(isRecord).map((u) => ({
    id: asStr(u.id),
    full_name: asStr(u.full_name || u.name || u.email || u.id),
    email: asStr(u.email),
    role: u.role ? asStr(u.role) : undefined,
  }));
}

export function buildSinglePayslipCsv(
  slip: PayrollSlipDto,
  legalEntity: LegalEntityInfoDto,
  periodKey: string
): string {
  const esc = (v: string | number | null | undefined) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const totalIns = slip.emp_bhxh_vnd + slip.emp_bhyt_vnd + slip.emp_bhtn_vnd;
  const rows: Array<[string, string | number]> = [
    ['Đơn vị pháp nhân', legalEntity.legal_entity_name],
    ['Mã số thuế DN', legalEntity.tax_code || '—'],
    ['Địa chỉ', legalEntity.address || '—'],
    ['Kỳ thanh toán', formatPayrollPeriodLabel(periodKey)],
    ['Mã nhân viên', slip.employee_code || '—'],
    ['Họ và tên', slip.employee_name || '—'],
    ['Phòng ban', slip.department_name || '—'],
    ['Ngày công thực tế / Công chuẩn', `${slip.actual_workdays}/${slip.standard_workdays}`],
    ['Lương cơ bản hợp đồng (VNĐ)', slip.base_salary_vnd],
    ['Lương theo ngày công (VNĐ)', slip.prorated_base_pay_vnd],
    ['Phụ cấp tháng (VNĐ)', slip.allowances_vnd],
    ['Lương làm thêm giờ OT (VNĐ)', slip.overtime_pay_vnd],
    ['Hoa hồng kinh doanh (VNĐ)', slip.commission_pay_vnd],
    ['Thưởng hiệu suất (VNĐ)', slip.bonus_vnd],
    ['Tổng thu nhập GROSS (VNĐ)', slip.gross_pay_vnd],
    ['BHXH NLĐ 8% (VNĐ)', -slip.emp_bhxh_vnd],
    ['BHYT NLĐ 1.5% (VNĐ)', -slip.emp_bhyt_vnd],
    ['BHTN NLĐ 1% (VNĐ)', -slip.emp_bhtn_vnd],
    ['Tổng bảo hiểm bắt buộc NLĐ (VNĐ)', -totalIns],
    ['Giảm trừ gia cảnh (VNĐ)', slip.family_deduction_vnd],
    ['Thu nhập tính thuế TNCN (VNĐ)', slip.assessable_income_vnd],
    ['Thuế TNCN khấu trừ (VNĐ)', -slip.pit_tax_vnd],
    ['Khấu trừ tạm ứng (VNĐ)', -slip.advance_deduction_vnd],
    ['Khấu trừ khác (VNĐ)', -slip.other_deduction_vnd],
    ['Thực lĩnh chuyển khoản NET (VNĐ)', slip.net_pay_vnd],
    ['Bằng chữ', vndToVietnameseWords(slip.net_pay_vnd)],
    ['Trạng thái ký nhận', slip.confirmation_status === 'signed' ? 'Đã ký số xác nhận' : 'Chờ ký xác nhận'],
  ];
  return rows.map(([k, v]) => `${esc(k)},${esc(v)}`).join('\n');
}
