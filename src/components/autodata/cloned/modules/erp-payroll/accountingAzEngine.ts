import * as XLSX from 'xlsx';
import type {
  LegalEntityInfoDto,
  PayrollConfigDto,
  PayrollSlipDto,
  TaxBracketItem,
} from './payrollTypes';
import { normalizeLegalEntity, normalizeSlipRecord } from './payrollTypes';

export type AzAccountingRegime = 'TT200' | 'TT133';
export type AzPitRegimeKey = 'vn_7_brackets' | 'vn_5_brackets_2026' | 'tenant_config';
export type AzContractCategory = 'KXD' | 'XD' | 'TV' | 'DV';
export type ExcelCellValue = string | number | boolean | null;

export interface AzPitRegimeDefinition {
  key: AzPitRegimeKey;
  label: string;
  personal_deduction_vnd: number;
  dependent_deduction_vnd: number;
  brackets: TaxBracketItem[];
}

export const AZ_PIT_REGIMES: Record<
  Exclude<AzPitRegimeKey, 'tenant_config'>,
  AzPitRegimeDefinition
> = {
  vn_7_brackets: {
    key: 'vn_7_brackets',
    label: 'Biểu lũy tiến 7 bậc chuẩn (Giảm trừ 11tr / NPT 4,4tr)',
    personal_deduction_vnd: 11_000_000,
    dependent_deduction_vnd: 4_400_000,
    brackets: [
      { up_to: 5_000_000, rate: 0.05 },
      { up_to: 10_000_000, rate: 0.1 },
      { up_to: 18_000_000, rate: 0.15 },
      { up_to: 32_000_000, rate: 0.2 },
      { up_to: 52_000_000, rate: 0.25 },
      { up_to: 80_000_000, rate: 0.3 },
      { up_to: null, rate: 0.35 },
    ],
  },
  vn_5_brackets_2026: {
    key: 'vn_5_brackets_2026',
    label: 'Biểu lũy tiến 5 bậc mới 2026 (Giảm trừ 15,5tr / NPT 6,2tr)',
    personal_deduction_vnd: 15_500_000,
    dependent_deduction_vnd: 6_200_000,
    brackets: [
      { up_to: 10_000_000, rate: 0.05 },
      { up_to: 30_000_000, rate: 0.1 },
      { up_to: 60_000_000, rate: 0.2 },
      { up_to: 100_000_000, rate: 0.3 },
      { up_to: null, rate: 0.35 },
    ],
  },
};

export const AZ_CONTRACT_TYPE_LABELS: Record<AzContractCategory, string> = {
  KXD: 'HĐLĐ không xác định thời hạn',
  XD: 'HĐLĐ xác định thời hạn (≥ 3 tháng)',
  TV: 'Hợp đồng thử việc',
  DV: 'Hợp đồng dịch vụ / Cộng tác viên',
};

export interface AzEmployeeRecord {
  id: string;
  user_id: string | null;
  employee_code: string;
  full_name: string;
  gender: string;
  birth_date: string;
  nationality: string;
  address: string;
  id_number: string;
  tax_code: string;
  education_level: string;
  skill_grade: string;
  job_title: string;
  department_name: string;
  cost_bucket: 'admin' | 'sales' | 'production';
  join_date: string;
  resign_date: string;
  resign_reason: string;
  employment_type: string;
  is_resident: boolean;
  insurance_enrolled: boolean;
  bhxh_number: string;
  union_member: boolean;
  base_salary_vnd: number;
  insurance_salary_vnd: number;
  allowances_map: Record<string, number>;
  dependents_count: number;
  authorize_qtt: boolean;
  bank_name: string;
  bank_account_number: string;
  bank_branch: string;
  phone: string;
  email: string;
  promotion_note: string;
  training_note: string;
  discipline_note: string;
  accident_note: string;
}

export interface AzContractRecord {
  id: string;
  employee_id: string;
  contract_code: string;
  category: AzContractCategory;
  start_date: string;
  end_date: string;
  base_salary_vnd: number;
  status: string;
}

export interface AzEmployeePeriodAdjustment {
  actual_workdays?: number;
  paid_leave_days?: number;
  unpaid_leave_days?: number;
  overtime_hours?: number;
  bonus_vnd?: number;
  commission_pay_vnd?: number;
  tax_exempt_other_vnd?: number;
  advance_deduction_vnd?: number;
  other_deduction_vnd?: number;
  dependents_override?: number;
}

export interface AzSopStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
}

export interface AzPersistedWorkspaceState {
  accounting_regime: AzAccountingRegime;
  pit_regime: AzPitRegimeKey;
  payment_account: '112' | '111';
  kk_period_type: 'M' | 'Q';
  kk_period_num: number;
  kk_year: number;
  qtt_year: number;
  unc_transfer_note: string;
  sop_checklist: AzSopStep[];
  adjustments: Record<string, AzEmployeePeriodAdjustment>;
  manual_kk: Record<string, number>;
  manual_qtt: Record<string, number>;
}

export interface AzHydratedBundle {
  period_key: string;
  legal_entity: LegalEntityInfoDto;
  payroll_config: PayrollConfigDto;
  employees: AzEmployeeRecord[];
  contracts: AzContractRecord[];
  slips: PayrollSlipDto[];
  workspace_state: AzPersistedWorkspaceState;
}

export interface AzCalculatedRow {
  employee: AzEmployeeRecord;
  contract: AzContractRecord | null;
  has_labour_contract: boolean;
  standard_workdays: number;
  actual_workdays: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  overtime_hours: number;
  base_salary_vnd: number;
  prorated_base_pay_vnd: number;
  allowances_vnd: number;
  meal_exempt_vnd: number;
  ot_pay_vnd: number;
  ot_exempt_vnd: number;
  commission_pay_vnd: number;
  bonus_vnd: number;
  tax_exempt_other_vnd: number;
  gross_pay_vnd: number;
  total_exempt_vnd: number;
  taxable_income_vnd: number;
  insurance_active: boolean;
  bhxh_base_vnd: number;
  bhtn_base_vnd: number;
  emp_bhxh_vnd: number;
  emp_bhyt_vnd: number;
  emp_bhtn_vnd: number;
  emp_insurance_total_vnd: number;
  emp_union_vnd: number;
  er_bhxh_vnd: number;
  er_bhyt_vnd: number;
  er_bhtn_vnd: number;
  er_insurance_total_vnd: number;
  er_kpcd_vnd: number;
  dependents_count: number;
  family_deduction_vnd: number;
  assessable_income_vnd: number;
  tax_method_label: string;
  pit_tax_vnd: number;
  advance_deduction_vnd: number;
  other_deduction_vnd: number;
  net_pay_vnd: number;
  total_employer_cost_vnd: number;
}

export interface AzComplianceAlert {
  id: string;
  severity: 'danger' | 'warning' | 'info';
  category: 'contract' | 'tax_id' | 'bank' | 'bhxh';
  employee_name: string;
  employee_code: string;
  message: string;
}

export interface AzJournalEntry {
  seq: number;
  doc_date: string;
  doc_no: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount_vnd: number;
  group_tag: 'salary' | 'insurance' | 'union' | 'pit' | 'payment';
}

export interface AzKk05Summary {
  period_type: 'M' | 'Q';
  period_num: number;
  year: number;
  indicators: Record<string, number>;
}

export interface AzQtt05Bk1Row {
  stt: number;
  employee_code: string;
  full_name: string;
  tax_code: string;
  id_number: string;
  authorized: boolean;
  taxable_income_vnd: number;
  dependents_count: number;
  family_deduction_vnd: number;
  insurance_deduction_vnd: number;
  assessable_income_vnd: number;
  pit_withheld_vnd: number;
  pit_payable_annual_vnd: number;
  pit_overpaid_vnd: number;
  pit_remaining_vnd: number;
  pit_exempt_under_50k_vnd: number;
}

export interface AzQtt05Bk2Row {
  stt: number;
  employee_code: string;
  full_name: string;
  tax_code: string;
  id_number: string;
  is_resident: boolean;
  taxable_income_vnd: number;
  pit_withheld_vnd: number;
}

export interface AzQtt05Bk3Row {
  stt: number;
  taxpayer_name: string;
  taxpayer_mst: string;
  dependent_slot: string;
  deduction_months: number;
  deduction_amount_vnd: number;
}

export interface AzQtt05Summary {
  year: number;
  regime_label: string;
  indicators: Record<string, number>;
  bk1: AzQtt05Bk1Row[];
  bk2: AzQtt05Bk2Row[];
  bk3: AzQtt05Bk3Row[];
}

export const AZ_KK_INDICATOR_ROWS: ReadonlyArray<{
  code: string;
  label: string;
  isTotal?: boolean;
  editable?: boolean;
}> = [
  { code: '16', label: 'Tổng số người lao động nhận thu nhập trong kỳ', isTotal: true },
  { code: '17', label: 'Trong đó: Cá nhân cư trú có hợp đồng lao động (≥ 3 tháng)' },
  { code: '18', label: 'Tổng số cá nhân đã khấu trừ thuế TNCN [18] = [19] + [20]', isTotal: true },
  { code: '19', label: 'Cá nhân cư trú có khấu trừ thuế' },
  { code: '20', label: 'Cá nhân không cư trú có khấu trừ thuế' },
  { code: '21', label: 'Tổng thu nhập chịu thuế (TNCT) trả cho cá nhân [21] = [22] + [23]', isTotal: true },
  { code: '22', label: 'TNCT trả cho cá nhân cư trú' },
  { code: '23', label: 'TNCT trả cho cá nhân không cư trú' },
  { code: '24', label: 'Trong đó: TNCT từ phí mua BH nhân thọ không bắt buộc', editable: true },
  { code: '25', label: 'Trong đó: TNCT được miễn theo Hiệp định / Dầu khí', editable: true },
  { code: '26', label: 'Tổng TNCT trả cho cá nhân thuộc diện phải khấu trừ thuế [26] = [27] + [28]', isTotal: true },
  { code: '27', label: 'TNCT thuộc diện khấu trừ của cá nhân cư trú' },
  { code: '28', label: 'TNCT thuộc diện khấu trừ của cá nhân không cư trú' },
  { code: '29', label: 'Tổng số thuế TNCN đã khấu trừ [29] = [30] + [31]', isTotal: true },
  { code: '30', label: 'Thuế TNCN đã khấu trừ của cá nhân cư trú' },
  { code: '31', label: 'Thuế TNCN đã khấu trừ của cá nhân không cư trú' },
  { code: '32', label: 'Trong đó: Thuế khấu trừ trên phí mua BH nhân thọ', editable: true },
];

export const AZ_QTT_INDICATOR_ROWS: ReadonlyArray<{
  code: string;
  label: string;
  isTotal?: boolean;
  editable?: boolean;
}> = [
  { code: '16', label: 'Tổng số người lao động nhận thu nhập trong năm', isTotal: true },
  { code: '17', label: 'Trong đó: Cá nhân cư trú có hợp đồng lao động' },
  { code: '18', label: 'Tổng số cá nhân đã khấu trừ thuế [18] = [19] + [20]', isTotal: true },
  { code: '19', label: 'Cá nhân cư trú đã khấu trừ thuế' },
  { code: '20', label: 'Cá nhân không cư trú đã khấu trừ thuế' },
  { code: '22', label: 'Tổng số cá nhân tính giảm trừ gia cảnh', isTotal: true },
  { code: '23', label: 'Tổng TNCT trả cho cá nhân [23] = [24] + [25]', isTotal: true },
  { code: '24', label: 'TNCT trả cho cá nhân cư trú' },
  { code: '25', label: 'TNCT trả cho cá nhân không cư trú' },
  { code: '28', label: 'Tổng TNCT thuộc diện phải khấu trừ thuế [28] = [29] + [30]', isTotal: true },
  { code: '29', label: 'TNCT diện khấu trừ của cá nhân cư trú' },
  { code: '30', label: 'TNCT diện khấu trừ của cá nhân không cư trú' },
  { code: '31', label: 'Tổng số thuế TNCN đã khấu trừ [31] = [32] + [33]', isTotal: true },
  { code: '32', label: 'Thuế đã khấu trừ của cá nhân cư trú' },
  { code: '33', label: 'Thuế đã khấu trừ của cá nhân không cư trú' },
  { code: '35', label: 'Tổng số cá nhân ủy quyền quyết toán thay (Phụ lục 05-1/BK)', isTotal: true },
  { code: '36', label: 'Tổng số thuế TNCN đã khấu trừ của cá nhân ủy quyền' },
  { code: '37', label: 'Thuế đã khấu trừ tại tổ chức trước khi điều chuyển', editable: true },
  { code: '38', label: 'Tổng số thuế TNCN phải nộp của cá nhân ủy quyền', isTotal: true },
  { code: '39', label: 'Thuế được miễn do số còn phải nộp sau quyết toán ≤ 50.000đ' },
  { code: '40', label: 'Tổng số thuế TNCN còn phải nộp thêm [38] - [36] - [39] > 0', isTotal: true },
  { code: '41', label: 'Tổng số thuế TNCN đã nộp thừa [38] - [36] - [39] < 0', isTotal: true },
];

export const LABOR_BOOK_HEADERS: ReadonlyArray<string> = [
  'STT',
  'Mã NV',
  'Họ và tên',
  'Giới tính',
  'Ngày sinh',
  'Quốc tịch',
  'Địa chỉ cư trú',
  'Số CCCD / Hộ chiếu',
  'Mã số thuế TNCN',
  'Trình độ chuyên môn',
  'Bậc kỹ năng nghề',
  'Vị trí công việc / Phòng ban',
  'Loại hợp đồng lao động',
  'Ngày bắt đầu làm việc',
  'Tham gia BHXH / Mã sổ',
  'Mức lương cơ bản & Phụ cấp',
  'Nâng bậc, nâng lương',
  'Số ngày nghỉ phép năm',
  'Số giờ làm thêm',
  'Đào tạo / Kỷ luật / TNLĐ',
  'Ngày chấm dứt HĐ & Lý do',
];

function isObj(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function toNumber(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function toStr(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : val == null ? fallback : String(val);
}

function inferCostBucket(deptName: string, jobTitle: string): 'admin' | 'sales' | 'production' {
  const combined = `${deptName} ${jobTitle}`.toLowerCase();
  if (
    combined.includes('kinh doanh') ||
    combined.includes('sale') ||
    combined.includes('marketing') ||
    combined.includes('tư vấn')
  ) {
    return 'sales';
  }
  if (
    combined.includes('sản xuất') ||
    combined.includes('kỹ thuật') ||
    combined.includes('vận hành') ||
    combined.includes('công nghệ') ||
    combined.includes('triển khai')
  ) {
    return 'production';
  }
  return 'admin';
}

export function buildDefaultPayrollConfig(): PayrollConfigDto {
  return {
    currency: 'VND',
    standard_workdays_mode: 'fixed',
    fixed_standard_workdays: 22,
    saturday_work_mode: 'off',
    emp_bhxh_rate: 0.08,
    emp_bhyt_rate: 0.015,
    emp_bhtn_rate: 0.01,
    er_bhxh_rate: 0.175,
    er_bhyt_rate: 0.03,
    er_bhtn_rate: 0.01,
    er_union_rate: 0.02,
    emp_union_rate: 0.01,
    bhxh_salary_cap_vnd: 46_800_000,
    bhtn_salary_cap_vnd: 99_200_000,
    personal_deduction_vnd: 11_000_000,
    dependent_deduction_vnd: 4_400_000,
    meal_allowance_exempt_cap_vnd: 730_000,
    non_resident_flat_tax_rate: 0.2,
    casual_withholding_threshold_vnd: 2_000_000,
    casual_flat_tax_rate: 0.1,
    pit_brackets: AZ_PIT_REGIMES.vn_7_brackets.brackets,
    allowance_definitions: [],
    tax_authority_code: '',
    tax_authority_name: '',
  };
}

export function buildDefaultSopChecklist(): AzSopStep[] {
  return [
    {
      id: 'sop_1_dossier',
      title: '1. Rà soát biến động nhân sự, MST cá nhân & HĐLĐ',
      description: 'Đảm bảo 100% nhân sự trong kỳ có hợp đồng hiệu lực, mã số thuế và STK ngân hàng.',
      done: false,
    },
    {
      id: 'sop_2_attendance',
      title: '2. Đối soát công chuẩn, nghỉ phép, nghỉ ốm & tăng ca OT',
      description: 'Khóa bảng chấm công tháng và cập nhật các tờ trình nghỉ phép / tăng ca đã duyệt.',
      done: false,
    },
    {
      id: 'sop_3_commission',
      title: '3. Đồng bộ Hoa hồng CRM & Phiếu hợp tác đa Sale',
      description: 'Tổng hợp hoa hồng Deal thắng và các phiếu hợp tác đã đủ chữ ký số 100%.',
      done: false,
    },
    {
      id: 'sop_4_bhxh_pit',
      title: '4. Đối chiếu BHXH (10.5% / 21.5%), KPCĐ 2% & Thuế TNCN lũy tiến',
      description: 'Kiểm tra trần đóng BHXH/BHTN, giảm trừ gia cảnh người phụ thuộc và khấu trừ 10%/20%.',
      done: false,
    },
    {
      id: 'sop_5_journal',
      title: '5. Lập Bút toán Hạch toán Lương & Bảo hiểm (TT200 / TT133)',
      description: 'Ghi sổ Nhật ký chung TK 642/641/154 đối ứng TK 334, 3383, 3384, 3386, 3382, 3335.',
      done: false,
    },
    {
      id: 'sop_6_unc',
      title: '6. Xuất lệnh Chi lương Ngân hàng (UNC) & Gửi phiếu lương ký số',
      description: 'Xuất file Excel UNC giữ nguyên số 0 đầu STK và phát hành phiếu lương cho nhân sự ký nhận.',
      done: false,
    },
    {
      id: 'sop_7_htkk',
      title: '7. Kết xuất Tờ khai XML 05/KK-TNCN & Lưu trữ Sổ quản lý lao động',
      description: 'Tải file XML chuẩn HTKK (TT80/2021/TT-BTC) nộp Thuế điện tử.',
      done: false,
    },
  ];
}

export function buildDefaultWorkspaceState(periodKey: string): AzPersistedWorkspaceState {
  const [yrStr, moStr] = String(periodKey || '2026-01').split('-');
  const yr = toNumber(yrStr, 2026);
  const mo = Math.min(12, Math.max(1, toNumber(moStr, 1)));
  return {
    accounting_regime: 'TT200',
    pit_regime: yr >= 2026 ? 'vn_5_brackets_2026' : 'vn_7_brackets',
    payment_account: '112',
    kk_period_type: 'Q',
    kk_period_num: Math.ceil(mo / 3),
    kk_year: yr,
    qtt_year: yr,
    unc_transfer_note: `Thanh toan luong thang ${String(mo).padStart(2, '0')}/${yr}`,
    sop_checklist: buildDefaultSopChecklist(),
    adjustments: {},
    manual_kk: {},
    manual_qtt: {},
  };
}

function mapContractCategory(rawType: string): AzContractCategory {
  const t = rawType.toLowerCase();
  if (t.includes('indefinite') || t.includes('kxd') || t.includes('khong_xac_dinh')) return 'KXD';
  if (t.includes('probation') || t.includes('thu_viec') || t === 'tv') return 'TV';
  if (
    t.includes('service') ||
    t.includes('freelance') ||
    t.includes('casual') ||
    t.includes('ctv') ||
    t === 'dv'
  ) {
    return 'DV';
  }
  return 'XD';
}

export function hydrateAzWorkspaceFromApi(
  raw: unknown,
  fallbackConfig: PayrollConfigDto | null,
  fallbackSlips: PayrollSlipDto[],
  fallbackCompanyName: string,
  fallbackLogoUrl: string,
  periodKey: string
): AzHydratedBundle {
  const obj = isObj(raw) ? raw : {};
  const cfgRaw = isObj(obj.payroll_config) ? obj.payroll_config : null;
  const baseCfg = fallbackConfig || buildDefaultPayrollConfig();
  const payrollConfig: PayrollConfigDto = cfgRaw
    ? {
        ...baseCfg,
        ...(cfgRaw as Partial<PayrollConfigDto>),
        pit_brackets: Array.isArray(cfgRaw.pit_brackets)
          ? (cfgRaw.pit_brackets as TaxBracketItem[])
          : baseCfg.pit_brackets,
      }
    : baseCfg;

  const legalEntity = normalizeLegalEntity(
    obj.legal_entity ?? obj.branch ?? obj.company,
    fallbackCompanyName,
    fallbackLogoUrl
  );
  if (!legalEntity.tax_authority_code && payrollConfig.tax_authority_code) {
    legalEntity.tax_authority_code = payrollConfig.tax_authority_code;
  }
  if (!legalEntity.tax_authority_name && payrollConfig.tax_authority_name) {
    legalEntity.tax_authority_name = payrollConfig.tax_authority_name;
  }

  const rawSlips = Array.isArray(obj.slips) ? obj.slips : [];
  const parsedSlips = rawSlips
    .map(normalizeSlipRecord)
    .filter((s): s is PayrollSlipDto => s !== null);
  const effectiveSlips = parsedSlips.length > 0 ? parsedSlips : fallbackSlips;

  const rawEmps = Array.isArray(obj.employees) ? obj.employees : [];
  const employees: AzEmployeeRecord[] = rawEmps.filter(isObj).map((e) => {
    const deptName = toStr(e.department_name || e.phong);
    const jobTitle = toStr(e.position_name || e.job_title || e.position_title || e.viTri);
    const allowRaw = isObj(e.allowances_json)
      ? e.allowances_json
      : isObj(e.allowances_map)
        ? e.allowances_map
        : {};
    const allowancesMap: Record<string, number> = {};
    for (const [k, v] of Object.entries(allowRaw)) {
      allowancesMap[k] = toNumber(v, 0);
    }

    return {
      id: toStr(e.id),
      user_id: e.user_id ? toStr(e.user_id) : null,
      employee_code: toStr(e.employee_code || e.ma || 'NV'),
      full_name: toStr(e.full_name || e.ten || 'Nhân sự'),
      gender: toStr(e.gender || 'Nam'),
      birth_date: toStr(e.birth_date || e.date_of_birth).slice(0, 10),
      nationality: toStr(e.nationality || 'Việt Nam'),
      address: toStr(e.address || e.permanent_address),
      id_number: toStr(e.id_card_number || e.id_number || e.citizen_id || e.cccd),
      tax_code: toStr(e.tax_code || e.mst),
      education_level: toStr(e.education_level || 'Đại học'),
      skill_grade: toStr(e.skill_grade),
      job_title: jobTitle,
      department_name: deptName,
      cost_bucket: inferCostBucket(deptName, jobTitle),
      join_date: toStr(e.join_date || e.hire_date || e.start_date).slice(0, 10),
      resign_date: toStr(e.resign_date || e.termination_date).slice(0, 10),
      resign_reason: toStr(e.resign_reason),
      employment_type: toStr(e.employment_type || 'full_time'),
      is_resident: e.is_resident !== false,
      insurance_enrolled: e.insurance_enrolled !== false,
      bhxh_number: toStr(e.bhxh_number || e.social_insurance_no),
      union_member: Boolean(e.union_member),
      base_salary_vnd: toNumber(e.base_salary_vnd, 0),
      insurance_salary_vnd: toNumber(e.insurance_salary_vnd, 0),
      allowances_map: allowancesMap,
      dependents_count: Math.max(0, Math.round(toNumber(e.dependents_count, 0))),
      authorize_qtt: e.authorize_qtt !== false,
      bank_name: toStr(e.bank_name),
      bank_account_number: toStr(e.bank_account_number),
      bank_branch: toStr(e.bank_branch),
      phone: toStr(e.phone),
      email: toStr(e.email),
      promotion_note: toStr(e.promotion_note),
      training_note: toStr(e.training_note),
      discipline_note: toStr(e.discipline_note),
      accident_note: toStr(e.accident_note),
    };
  });

  // If employee array is empty but slips exist, derive strictly from tenant slips (never hardcoded samples)
  if (employees.length === 0 && effectiveSlips.length > 0) {
    for (const sl of effectiveSlips) {
      const dept = sl.department_name || '';
      const job = sl.job_title || '';
      employees.push({
        id: sl.employee_id || sl.id,
        user_id: sl.user_id || null,
        employee_code: sl.employee_code || 'NV',
        full_name: sl.employee_name || 'Nhân sự',
        gender: 'Nam',
        birth_date: '',
        nationality: 'Việt Nam',
        address: '',
        id_number: '',
        tax_code: sl.tax_code || '',
        education_level: '',
        skill_grade: '',
        job_title: job,
        department_name: dept,
        cost_bucket: inferCostBucket(dept, job),
        join_date: '',
        resign_date: '',
        resign_reason: '',
        employment_type: 'full_time',
        is_resident: true,
        insurance_enrolled: sl.emp_bhxh_vnd > 0,
        bhxh_number: '',
        union_member: sl.emp_union_vnd > 0,
        base_salary_vnd: sl.base_salary_vnd,
        insurance_salary_vnd: sl.insurance_salary_base_vnd || sl.base_salary_vnd,
        allowances_map: sl.allowances_vnd > 0 ? { allowance_default: sl.allowances_vnd } : {},
        dependents_count: sl.dependents_count,
        authorize_qtt: true,
        bank_name: sl.bank_name || '',
        bank_account_number: sl.bank_account_number || '',
        bank_branch: '',
        phone: '',
        email: '',
        promotion_note: '',
        training_note: '',
        discipline_note: '',
        accident_note: '',
      });
    }
  }

  const rawContracts = Array.isArray(obj.contracts) ? obj.contracts : [];
  const contracts: AzContractRecord[] = rawContracts.filter(isObj).map((c) => ({
    id: toStr(c.id),
    employee_id: toStr(c.employee_id),
    contract_code: toStr(c.contract_number || c.contract_code || c.code || 'HĐLĐ'),
    category: mapContractCategory(toStr(c.contract_type || c.category || 'XD')),
    start_date: toStr(c.start_date || c.effective_from).slice(0, 10),
    end_date: toStr(c.end_date || c.effective_until).slice(0, 10),
    base_salary_vnd: toNumber(c.base_salary_vnd || c.salary_vnd, 0),
    status: toStr(c.status || 'active'),
  }));

  const defaultWs = buildDefaultWorkspaceState(periodKey);
  const wsRaw = isObj(obj.workspace_state) ? obj.workspace_state : {};
  const rawSop = Array.isArray(wsRaw.sop_checklist) ? wsRaw.sop_checklist : null;
  const mergedSop = defaultWs.sop_checklist.map((defStep) => {
    const found = rawSop?.find((item) => isObj(item) && toStr(item.id) === defStep.id);
    return isObj(found) ? { ...defStep, done: Boolean(found.done) } : defStep;
  });

  const pitCandidate = wsRaw.pit_regime ?? wsRaw.tax_rule_mode;
  const workspaceState: AzPersistedWorkspaceState = {
    accounting_regime:
      wsRaw.accounting_regime === 'TT133' || obj.accounting_regime === 'TT133'
        ? 'TT133'
        : 'TT200',
    pit_regime:
      pitCandidate === 'vn_7_brackets' ||
      pitCandidate === 'vn_5_brackets_2026' ||
      pitCandidate === 'tenant_config'
        ? pitCandidate
        : defaultWs.pit_regime,
    payment_account: wsRaw.payment_account === '111' ? '111' : '112',
    kk_period_type: wsRaw.kk_period_type === 'M' ? 'M' : defaultWs.kk_period_type,
    kk_period_num: toNumber(wsRaw.kk_period_num, defaultWs.kk_period_num),
    kk_year: toNumber(wsRaw.kk_year, defaultWs.kk_year),
    qtt_year: toNumber(wsRaw.qtt_year, defaultWs.qtt_year),
    unc_transfer_note: toStr(wsRaw.unc_transfer_note, defaultWs.unc_transfer_note),
    sop_checklist: mergedSop,
    adjustments: isObj(wsRaw.adjustments)
      ? (wsRaw.adjustments as Record<string, AzEmployeePeriodAdjustment>)
      : {},
    manual_kk: isObj(wsRaw.manual_kk) ? (wsRaw.manual_kk as Record<string, number>) : {},
    manual_qtt: isObj(wsRaw.manual_qtt) ? (wsRaw.manual_qtt as Record<string, number>) : {},
  };

  return {
    period_key: periodKey,
    legal_entity: legalEntity,
    payroll_config: payrollConfig,
    employees,
    contracts,
    slips: effectiveSlips,
    workspace_state: workspaceState,
  };
}

export function resolveActivePitRegime(
  regimeKey: AzPitRegimeKey,
  cfg: PayrollConfigDto
): AzPitRegimeDefinition {
  if (regimeKey === 'vn_7_brackets') return AZ_PIT_REGIMES.vn_7_brackets;
  if (regimeKey === 'vn_5_brackets_2026') return AZ_PIT_REGIMES.vn_5_brackets_2026;
  return {
    key: 'tenant_config',
    label: `Biểu tùy chỉnh DN (Giảm trừ ${Math.round(cfg.personal_deduction_vnd / 100_000) / 10}tr / NPT ${Math.round(cfg.dependent_deduction_vnd / 100_000) / 10}tr)`,
    personal_deduction_vnd: cfg.personal_deduction_vnd || 11_000_000,
    dependent_deduction_vnd: cfg.dependent_deduction_vnd || 4_400_000,
    brackets:
      cfg.pit_brackets && cfg.pit_brackets.length > 0
        ? cfg.pit_brackets
        : AZ_PIT_REGIMES.vn_7_brackets.brackets,
  };
}

export function computeProgressivePit(
  assessableVnd: number,
  brackets: TaxBracketItem[],
  annualMultiplier = 1
): number {
  if (assessableVnd <= 0) return 0;
  let tax = 0;
  let prevCap = 0;
  for (const b of brackets) {
    const cap = b.up_to != null ? b.up_to * annualMultiplier : Infinity;
    const slice = Math.min(assessableVnd, cap) - prevCap;
    if (slice > 0) {
      tax += slice * b.rate;
    }
    if (assessableVnd <= cap) break;
    prevCap = cap;
  }
  return Math.round(tax);
}

export function calculateAzPayrollSheet(bundle: AzHydratedBundle): AzCalculatedRow[] {
  const cfg = bundle.payroll_config;
  const ws = bundle.workspace_state;
  const pitRegime = resolveActivePitRegime(ws.pit_regime, cfg);
  const stdDefault = cfg.fixed_standard_workdays || 22;

  return bundle.employees.map((emp) => {
    const slip = bundle.slips.find((s) => s.employee_id === emp.id);
    const adj = ws.adjustments[emp.id] || {};
    const empContracts = bundle.contracts.filter((c) => c.employee_id === emp.id);
    const activeContract = empContracts[empContracts.length - 1] || null;

    const isCasualOrProbation =
      emp.employment_type === 'freelance' ||
      emp.employment_type === 'part_time' ||
      emp.employment_type === 'probation' ||
      activeContract?.category === 'DV' ||
      activeContract?.category === 'TV';
    const hasLabourContract = !isCasualOrProbation;

    const standardWorkdays = slip?.standard_workdays || stdDefault;
    const actualWorkdays =
      adj.actual_workdays ?? slip?.actual_workdays ?? standardWorkdays;
    const paidLeaveDays = adj.paid_leave_days ?? slip?.paid_leave_days ?? 0;
    const unpaidLeaveDays = adj.unpaid_leave_days ?? slip?.unpaid_leave_days ?? 0;
    const overtimeHours = adj.overtime_hours ?? slip?.overtime_hours ?? 0;

    const baseSalary = emp.base_salary_vnd || slip?.base_salary_vnd || 0;
    const paidRatio =
      standardWorkdays > 0
        ? Math.min(1.5, Math.max(0, (actualWorkdays + paidLeaveDays) / standardWorkdays))
        : 1;
    const proratedBase = Math.round(baseSalary * paidRatio);

    const rawAllowancesSum = Object.values(emp.allowances_map).reduce((s, v) => s + v, 0);
    const allowancesVnd =
      rawAllowancesSum > 0
        ? Math.round(rawAllowancesSum * Math.min(1, paidRatio))
        : slip?.allowances_vnd || 0;
    const mealCap = cfg.meal_allowance_exempt_cap_vnd || 730_000;
    const mealCandidate =
      emp.allowances_map.meal ?? emp.allowances_map.antrua ?? Math.min(allowancesVnd, mealCap);
    const mealExemptVnd = allowancesVnd > 0 ? Math.min(mealCandidate, mealCap) : 0;

    const hourlyRate = standardWorkdays > 0 ? baseSalary / standardWorkdays / 8 : 0;
    const otPayVnd =
      overtimeHours > 0
        ? Math.round(hourlyRate * overtimeHours * 1.5)
        : slip?.overtime_pay_vnd || 0;
    const otBasePart = Math.round(hourlyRate * overtimeHours);
    const otExemptVnd = Math.max(0, otPayVnd - otBasePart);

    const commissionPayVnd = adj.commission_pay_vnd ?? slip?.commission_pay_vnd ?? 0;
    const bonusVnd = adj.bonus_vnd ?? slip?.bonus_vnd ?? 0;
    const taxExemptOtherVnd = adj.tax_exempt_other_vnd ?? 0;

    const grossPayVnd =
      proratedBase + allowancesVnd + otPayVnd + commissionPayVnd + bonusVnd + taxExemptOtherVnd;
    const totalExemptVnd = mealExemptVnd + otExemptVnd + taxExemptOtherVnd;
    const taxableIncomeVnd = Math.max(0, grossPayVnd - totalExemptVnd);

    const insuranceActive =
      emp.insurance_enrolled && hasLabourContract && unpaidLeaveDays < 14 && actualWorkdays > 0;
    const insBaseRaw = emp.insurance_salary_vnd > 0 ? emp.insurance_salary_vnd : baseSalary;
    const bhxhCap = cfg.bhxh_salary_cap_vnd || 46_800_000;
    const bhtnCap = cfg.bhtn_salary_cap_vnd || 99_200_000;
    const bhxhBaseVnd = insuranceActive ? Math.min(insBaseRaw, bhxhCap) : 0;
    const isForeigner =
      emp.nationality.trim().toLowerCase() !== 'việt nam' &&
      emp.nationality.trim().toLowerCase() !== 'viet nam';
    const bhtnBaseVnd = insuranceActive && !isForeigner ? Math.min(insBaseRaw, bhtnCap) : 0;

    const empBhxh = Math.round(bhxhBaseVnd * (cfg.emp_bhxh_rate ?? 0.08));
    const empBhyt = Math.round(bhxhBaseVnd * (cfg.emp_bhyt_rate ?? 0.015));
    const empBhtn = Math.round(bhtnBaseVnd * (cfg.emp_bhtn_rate ?? 0.01));
    const empInsTotal = empBhxh + empBhyt + empBhtn;
    const empUnion =
      emp.union_member && insuranceActive
        ? Math.round(bhxhBaseVnd * (cfg.emp_union_rate ?? 0.01))
        : 0;

    const erBhxh = Math.round(bhxhBaseVnd * (cfg.er_bhxh_rate ?? 0.175));
    const erBhyt = Math.round(bhxhBaseVnd * (cfg.er_bhyt_rate ?? 0.03));
    const erBhtn = Math.round(bhtnBaseVnd * (cfg.er_bhtn_rate ?? 0.01));
    const erInsTotal = erBhxh + erBhyt + erBhtn;
    const erKpcd = insuranceActive
      ? Math.round(bhxhBaseVnd * (cfg.er_union_rate ?? 0.02))
      : 0;

    const dependentsCount = Math.max(0, adj.dependents_override ?? emp.dependents_count);
    let familyDeductionVnd = 0;
    let assessableIncomeVnd = 0;
    let pitTaxVnd = 0;
    let taxMethodLabel = 'Biểu lũy tiến';

    if (!emp.is_resident) {
      const nonResRate = cfg.non_resident_flat_tax_rate ?? 0.2;
      taxMethodLabel = `Không cư trú (${Math.round(nonResRate * 100)}%)`;
      assessableIncomeVnd = taxableIncomeVnd;
      pitTaxVnd = Math.round(taxableIncomeVnd * nonResRate);
    } else if (!hasLabourContract) {
      const casualThreshold = cfg.casual_withholding_threshold_vnd ?? 2_000_000;
      const casualRate = cfg.casual_flat_tax_rate ?? 0.1;
      taxMethodLabel = `Vãng lai ${Math.round(casualRate * 100)}% (≥ ${Math.round(casualThreshold / 1_000_000)}tr)`;
      assessableIncomeVnd = taxableIncomeVnd;
      pitTaxVnd =
        taxableIncomeVnd >= casualThreshold ? Math.round(taxableIncomeVnd * casualRate) : 0;
    } else {
      familyDeductionVnd =
        pitRegime.personal_deduction_vnd + dependentsCount * pitRegime.dependent_deduction_vnd;
      assessableIncomeVnd = Math.max(0, taxableIncomeVnd - empInsTotal - familyDeductionVnd);
      pitTaxVnd = computeProgressivePit(assessableIncomeVnd, pitRegime.brackets, 1);
    }

    const advanceDeductionVnd = adj.advance_deduction_vnd ?? slip?.advance_deduction_vnd ?? 0;
    const otherDeductionVnd = adj.other_deduction_vnd ?? slip?.other_deduction_vnd ?? 0;
    const netPayVnd =
      grossPayVnd - empInsTotal - empUnion - pitTaxVnd - advanceDeductionVnd - otherDeductionVnd;

    return {
      employee: emp,
      contract: activeContract,
      has_labour_contract: hasLabourContract,
      standard_workdays: standardWorkdays,
      actual_workdays: actualWorkdays,
      paid_leave_days: paidLeaveDays,
      unpaid_leave_days: unpaidLeaveDays,
      overtime_hours: overtimeHours,
      base_salary_vnd: baseSalary,
      prorated_base_pay_vnd: proratedBase,
      allowances_vnd: allowancesVnd,
      meal_exempt_vnd: mealExemptVnd,
      ot_pay_vnd: otPayVnd,
      ot_exempt_vnd: otExemptVnd,
      commission_pay_vnd: commissionPayVnd,
      bonus_vnd: bonusVnd,
      tax_exempt_other_vnd: taxExemptOtherVnd,
      gross_pay_vnd: grossPayVnd,
      total_exempt_vnd: totalExemptVnd,
      taxable_income_vnd: taxableIncomeVnd,
      insurance_active: insuranceActive,
      bhxh_base_vnd: bhxhBaseVnd,
      bhtn_base_vnd: bhtnBaseVnd,
      emp_bhxh_vnd: empBhxh,
      emp_bhyt_vnd: empBhyt,
      emp_bhtn_vnd: empBhtn,
      emp_insurance_total_vnd: empInsTotal,
      emp_union_vnd: empUnion,
      er_bhxh_vnd: erBhxh,
      er_bhyt_vnd: erBhyt,
      er_bhtn_vnd: erBhtn,
      er_insurance_total_vnd: erInsTotal,
      er_kpcd_vnd: erKpcd,
      dependents_count: dependentsCount,
      family_deduction_vnd: familyDeductionVnd,
      assessable_income_vnd: assessableIncomeVnd,
      tax_method_label: taxMethodLabel,
      pit_tax_vnd: pitTaxVnd,
      advance_deduction_vnd: advanceDeductionVnd,
      other_deduction_vnd: otherDeductionVnd,
      net_pay_vnd: netPayVnd,
      total_employer_cost_vnd: grossPayVnd + erInsTotal + erKpcd,
    };
  });
}

export function generateAzGeneralJournal(
  rows: AzCalculatedRow[],
  periodKey: string,
  regime: AzAccountingRegime,
  paymentAccount: '112' | '111'
): {
  entries: AzJournalEntry[];
  total_debit_vnd: number;
  total_credit_vnd: number;
} {
  const [yrStr, moStr] = periodKey.split('-');
  const yr = toNumber(yrStr, 2026);
  const mo = toNumber(moStr, 1);
  const lastDay = new Date(yr, mo, 0).getDate();
  const docDate = `${String(lastDay).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${yr}`;
  const suffix = `${String(mo).padStart(2, '0')}${String(yr).slice(-2)}`;

  const mapExpenseAccount = (bucket: 'admin' | 'sales' | 'production'): string => {
    if (regime === 'TT133') {
      if (bucket === 'sales') return '6421';
      if (bucket === 'production') return '154';
      return '6422';
    }
    if (bucket === 'sales') return '641';
    if (bucket === 'production') return '154';
    return '642';
  };

  const bhtnAccount = regime === 'TT133' ? '3385' : '3386';
  const cashAccount = paymentAccount === '111' ? '1111' : '1121';

  const entries: AzJournalEntry[] = [];
  let seq = 1;
  const pushEntry = (
    docNo: string,
    description: string,
    debit: string,
    credit: string,
    amount: number,
    tag: AzJournalEntry['group_tag']
  ) => {
    const rounded = Math.round(amount);
    if (rounded <= 0) return;
    entries.push({
      seq: seq++,
      doc_date: docDate,
      doc_no: docNo,
      description,
      debit_account: debit,
      credit_account: credit,
      amount_vnd: rounded,
      group_tag: tag,
    });
  };

  const buckets: Array<{ key: 'admin' | 'sales' | 'production'; label: string }> = [
    { key: 'admin', label: 'Bộ phận Quản lý doanh nghiệp' },
    { key: 'sales', label: 'Bộ phận Kinh doanh & Bán hàng' },
    { key: 'production', label: 'Bộ phận Kỹ thuật / Sản xuất / Vận hành' },
  ];

  for (const b of buckets) {
    const sub = rows.filter((r) => r.employee.cost_bucket === b.key);
    if (sub.length === 0) continue;
    const expAcc = mapExpenseAccount(b.key);

    const sumGross = sub.reduce((s, r) => s + r.gross_pay_vnd, 0);
    const sumErBhxh = sub.reduce((s, r) => s + r.er_bhxh_vnd, 0);
    const sumErBhyt = sub.reduce((s, r) => s + r.er_bhyt_vnd, 0);
    const sumErBhtn = sub.reduce((s, r) => s + r.er_bhtn_vnd, 0);
    const sumErKpcd = sub.reduce((s, r) => s + r.er_kpcd_vnd, 0);

    pushEntry(
      `PKT-LUONG-${suffix}`,
      `Hạch toán chi phí tiền lương, phụ cấp & hoa hồng phải trả NLĐ (${b.label})`,
      expAcc,
      '334',
      sumGross,
      'salary'
    );
    pushEntry(
      `PKT-BHXH-${suffix}`,
      `Trích BHXH 17.5% tính vào chi phí DN (${b.label})`,
      expAcc,
      '3383',
      sumErBhxh,
      'insurance'
    );
    pushEntry(
      `PKT-BHYT-${suffix}`,
      `Trích BHYT 3% tính vào chi phí DN (${b.label})`,
      expAcc,
      '3384',
      sumErBhyt,
      'insurance'
    );
    pushEntry(
      `PKT-BHTN-${suffix}`,
      `Trích BHTN 1% tính vào chi phí DN (${b.label})`,
      expAcc,
      bhtnAccount,
      sumErBhtn,
      'insurance'
    );
    pushEntry(
      `PKT-KPCD-${suffix}`,
      `Trích Kinh phí Công đoàn 2% tính vào chi phí DN (${b.label})`,
      expAcc,
      '3382',
      sumErKpcd,
      'union'
    );
  }

  const totalEmpBhxh = rows.reduce((s, r) => s + r.emp_bhxh_vnd, 0);
  const totalEmpBhyt = rows.reduce((s, r) => s + r.emp_bhyt_vnd, 0);
  const totalEmpBhtn = rows.reduce((s, r) => s + r.emp_bhtn_vnd, 0);
  const totalEmpUnion = rows.reduce((s, r) => s + r.emp_union_vnd, 0);
  const totalPit = rows.reduce((s, r) => s + r.pit_tax_vnd, 0);
  const totalAdvance = rows.reduce((s, r) => s + r.advance_deduction_vnd, 0);
  const totalNet = rows.reduce((s, r) => s + Math.max(0, r.net_pay_vnd), 0);

  pushEntry(
    `PKT-KTBH-${suffix}`,
    'Khấu trừ lương NLĐ đóng BHXH bắt buộc (8%)',
    '334',
    '3383',
    totalEmpBhxh,
    'insurance'
  );
  pushEntry(
    `PKT-KTBH-${suffix}`,
    'Khấu trừ lương NLĐ đóng BHYT bắt buộc (1.5%)',
    '334',
    '3384',
    totalEmpBhyt,
    'insurance'
  );
  pushEntry(
    `PKT-KTBH-${suffix}`,
    'Khấu trừ lương NLĐ đóng BHTN bắt buộc (1%)',
    '334',
    bhtnAccount,
    totalEmpBhtn,
    'insurance'
  );
  pushEntry(
    `PKT-DPCD-${suffix}`,
    'Khấu trừ đoàn phí công đoàn NLĐ (1%)',
    '334',
    '3382',
    totalEmpUnion,
    'union'
  );
  pushEntry(
    `PKT-TNCN-${suffix}`,
    'Khấu trừ Thuế TNCN phải nộp vào lương tháng (TK 3335)',
    '334',
    '3335',
    totalPit,
    'pit'
  );
  pushEntry(
    `PKT-TU-${suffix}`,
    'Khấu trừ hoàn tạm ứng lương của người lao động (TK 141)',
    '334',
    '141',
    totalAdvance,
    'salary'
  );
  pushEntry(
    paymentAccount === '112' ? `UNC-LUONG-${suffix}` : `PC-LUONG-${suffix}`,
    paymentAccount === '112'
      ? `Chi trả lương thực lĩnh qua Ngân hàng UNC kỳ ${periodKey}`
      : `Chi trả lương thực lĩnh bằng Tiền mặt kỳ ${periodKey}`,
    '334',
    cashAccount,
    totalNet,
    'payment'
  );

  const totalDebit = entries.reduce((s, e) => s + e.amount_vnd, 0);
  return {
    entries,
    total_debit_vnd: totalDebit,
    total_credit_vnd: totalDebit,
  };
}

export function computeAzComplianceAlerts(
  bundle: AzHydratedBundle,
  referenceDateIso: string
): AzComplianceAlert[] {
  const alerts: AzComplianceAlert[] = [];
  const refTime = new Date(`${referenceDateIso.slice(0, 10)}T00:00:00`).getTime();

  for (const emp of bundle.employees) {
    if (!emp.tax_code.trim()) {
      alerts.push({
        id: `mst-${emp.id}`,
        severity: 'warning',
        category: 'tax_id',
        employee_name: emp.full_name,
        employee_code: emp.employee_code,
        message: 'Thiếu Mã số thuế TNCN (cần bổ sung để lên Bảng kê 05-1/BK-QTT-TNCN).',
      });
    }
    if (!emp.bank_account_number.trim() || !emp.bank_name.trim()) {
      alerts.push({
        id: `bank-${emp.id}`,
        severity: 'warning',
        category: 'bank',
        employee_name: emp.full_name,
        employee_code: emp.employee_code,
        message: 'Chưa cập nhật đầy đủ Số tài khoản / Ngân hàng nhận lương UNC.',
      });
    }

    const empContracts = bundle.contracts.filter((c) => c.employee_id === emp.id);
    if (empContracts.length === 0) {
      alerts.push({
        id: `ct-missing-${emp.id}`,
        severity: 'info',
        category: 'contract',
        employee_name: emp.full_name,
        employee_code: emp.employee_code,
        message: 'Chưa gắn bản ghi Hợp đồng lao động chi tiết trên hệ thống.',
      });
    } else {
      const latest = empContracts[empContracts.length - 1];
      if (latest.end_date) {
        const endTime = new Date(`${latest.end_date}T00:00:00`).getTime();
        if (!Number.isNaN(endTime)) {
          const daysLeft = Math.round((endTime - refTime) / 86_400_000);
          if (daysLeft < 0) {
            alerts.push({
              id: `ct-exp-${emp.id}`,
              severity: 'danger',
              category: 'contract',
              employee_name: emp.full_name,
              employee_code: emp.employee_code,
              message: `Hợp đồng ${latest.contract_code} đã quá hạn ${Math.abs(daysLeft)} ngày (${latest.end_date}).`,
            });
          } else if (daysLeft <= 30) {
            alerts.push({
              id: `ct-soon-${emp.id}`,
              severity: 'warning',
              category: 'contract',
              employee_name: emp.full_name,
              employee_code: emp.employee_code,
              message: `Hợp đồng ${latest.contract_code} sắp hết hạn sau ${daysLeft} ngày (${latest.end_date}).`,
            });
          }
        }
      }
      const fixedCount = empContracts.filter((c) => c.category === 'XD').length;
      if (fixedCount >= 2 && latest.category === 'XD') {
        alerts.push({
          id: `ct-art20-${emp.id}`,
          severity: 'info',
          category: 'contract',
          employee_name: emp.full_name,
          employee_code: emp.employee_code,
          message: `Đã ký ${fixedCount} HĐ xác định thời hạn — lần gia hạn tiếp theo cần chuyển sang HĐ không xác định thời hạn (Điều 20 BLLĐ 2019).`,
        });
      }
    }
  }

  return alerts;
}

export function buildAzLaborBookRows(rows: AzCalculatedRow[]): ExcelCellValue[][] {
  return rows.map((r, idx) => {
    const e = r.employee;
    const ctLabel = r.contract
      ? `${AZ_CONTRACT_TYPE_LABELS[r.contract.category]} (${r.contract.contract_code})`
      : e.employment_type === 'probation'
        ? 'Hợp đồng thử việc'
        : 'HĐLĐ xác định thời hạn';
    const allowSum = Object.values(e.allowances_map).reduce((s, v) => s + v, 0);
    const notesCombined = [e.training_note, e.discipline_note, e.accident_note]
      .filter(Boolean)
      .join(' | ');

    return [
      idx + 1,
      e.employee_code,
      e.full_name,
      e.gender || '—',
      e.birth_date || '—',
      e.nationality || 'Việt Nam',
      e.address || '—',
      e.id_number || '—',
      e.tax_code || '—',
      e.education_level || '—',
      e.skill_grade || '—',
      [e.job_title, e.department_name].filter(Boolean).join(' • ') || '—',
      ctLabel,
      e.join_date || '—',
      r.insurance_active
        ? `Tham gia${e.bhxh_number ? ` (${e.bhxh_number})` : ''}`
        : 'Không thuộc diện',
      `${e.base_salary_vnd.toLocaleString('vi-VN')}đ${allowSum > 0 ? ` + PC ${allowSum.toLocaleString('vi-VN')}đ` : ''}`,
      e.promotion_note || '—',
      r.paid_leave_days,
      r.overtime_hours,
      notesCombined || 'Không phát sinh',
      e.resign_date ? `${e.resign_date}${e.resign_reason ? ` (${e.resign_reason})` : ''}` : 'Đang làm việc',
    ];
  });
}

export function computeAzKk05(
  rows: AzCalculatedRow[],
  periodType: 'M' | 'Q',
  periodNum: number,
  year: number,
  manualOverrides: Record<string, number>
): AzKk05Summary {
  const activeRows = rows.filter((r) => r.gross_pay_vnd > 0);
  const multiplier = periodType === 'Q' ? 3 : 1;

  const resRows = activeRows.filter((r) => r.employee.is_resident);
  const nonResRows = activeRows.filter((r) => !r.employee.is_resident);
  const withheldRes = resRows.filter((r) => r.pit_tax_vnd > 0);
  const withheldNon = nonResRows.filter((r) => r.pit_tax_vnd > 0);

  const indicators: Record<string, number> = {
    ct16: activeRows.length,
    ct17: resRows.filter((r) => r.has_labour_contract).length,
    ct19: withheldRes.length,
    ct20: withheldNon.length,
    ct22: Math.round(resRows.reduce((s, r) => s + r.taxable_income_vnd, 0) * multiplier),
    ct23: Math.round(nonResRows.reduce((s, r) => s + r.taxable_income_vnd, 0) * multiplier),
    ct24: manualOverrides.ct24 ?? 0,
    ct25: manualOverrides.ct25 ?? 0,
    ct27: Math.round(withheldRes.reduce((s, r) => s + r.taxable_income_vnd, 0) * multiplier),
    ct28: Math.round(withheldNon.reduce((s, r) => s + r.taxable_income_vnd, 0) * multiplier),
    ct30: Math.round(withheldRes.reduce((s, r) => s + r.pit_tax_vnd, 0) * multiplier),
    ct31: Math.round(withheldNon.reduce((s, r) => s + r.pit_tax_vnd, 0) * multiplier),
    ct32: manualOverrides.ct32 ?? 0,
  };
  indicators.ct18 = indicators.ct19 + indicators.ct20;
  indicators.ct21 = indicators.ct22 + indicators.ct23;
  indicators.ct26 = indicators.ct27 + indicators.ct28;
  indicators.ct29 = indicators.ct30 + indicators.ct31;

  return {
    period_type: periodType,
    period_num: periodNum,
    year,
    indicators,
  };
}

export function computeAzQtt05(
  rows: AzCalculatedRow[],
  year: number,
  pitRegimeKey: AzPitRegimeKey,
  cfg: PayrollConfigDto,
  manualOverrides: Record<string, number>
): AzQtt05Summary {
  const regime = resolveActivePitRegime(pitRegimeKey, cfg);
  const activeRows = rows.filter((r) => r.gross_pay_vnd > 0);
  const monthsFactor = 12;

  const bk1Source = activeRows.filter((r) => r.employee.is_resident && r.has_labour_contract);
  const bk2Source = activeRows.filter((r) => !(r.employee.is_resident && r.has_labour_contract));

  const bk1: AzQtt05Bk1Row[] = bk1Source.map((r, idx) => {
    const annualTnct = r.taxable_income_vnd * monthsFactor;
    const annualIns = r.emp_insurance_total_vnd * monthsFactor;
    const annualFam =
      regime.personal_deduction_vnd * 12 +
      r.dependents_count * regime.dependent_deduction_vnd * 12;
    const annualAssessable = Math.max(0, annualTnct - annualIns - annualFam);
    const annualPayable = computeProgressivePit(annualAssessable, regime.brackets, 12);
    const annualWithheld = r.pit_tax_vnd * monthsFactor;
    const diff = annualPayable - annualWithheld;
    const authorized = r.employee.authorize_qtt;
    const exempt50k = authorized && diff > 0 && diff <= 50_000 ? diff : 0;

    return {
      stt: idx + 1,
      employee_code: r.employee.employee_code,
      full_name: r.employee.full_name,
      tax_code: r.employee.tax_code,
      id_number: r.employee.id_number,
      authorized,
      taxable_income_vnd: annualTnct,
      dependents_count: r.dependents_count,
      family_deduction_vnd: annualFam,
      insurance_deduction_vnd: annualIns,
      assessable_income_vnd: annualAssessable,
      pit_withheld_vnd: annualWithheld,
      pit_payable_annual_vnd: annualPayable,
      pit_overpaid_vnd: diff < 0 ? -diff : 0,
      pit_remaining_vnd: diff > 0 ? Math.max(0, diff - exempt50k) : 0,
      pit_exempt_under_50k_vnd: exempt50k,
    };
  });

  const bk2: AzQtt05Bk2Row[] = bk2Source.map((r, idx) => ({
    stt: idx + 1,
    employee_code: r.employee.employee_code,
    full_name: r.employee.full_name,
    tax_code: r.employee.tax_code,
    id_number: r.employee.id_number,
    is_resident: r.employee.is_resident,
    taxable_income_vnd: r.taxable_income_vnd * monthsFactor,
    pit_withheld_vnd: r.pit_tax_vnd * monthsFactor,
  }));

  const bk3: AzQtt05Bk3Row[] = [];
  let depStt = 1;
  for (const r of bk1Source) {
    for (let d = 1; d <= r.dependents_count; d++) {
      bk3.push({
        stt: depStt++,
        taxpayer_name: r.employee.full_name,
        taxpayer_mst: r.employee.tax_code || '—',
        dependent_slot: `Người phụ thuộc #${d} của ${r.employee.full_name}`,
        deduction_months: 12,
        deduction_amount_vnd: regime.dependent_deduction_vnd * 12,
      });
    }
  }

  const resAll = activeRows.filter((r) => r.employee.is_resident);
  const nonResAll = activeRows.filter((r) => !r.employee.is_resident);
  const wRes = resAll.filter((r) => r.pit_tax_vnd > 0);
  const wNon = nonResAll.filter((r) => r.pit_tax_vnd > 0);
  const authBk1 = bk1.filter((b) => b.authorized);

  const indicators: Record<string, number> = {
    ct16: activeRows.length,
    ct17: bk1.length,
    ct19: wRes.length,
    ct20: wNon.length,
    ct22: bk1.length,
    ct24: resAll.reduce((s, r) => s + r.taxable_income_vnd * monthsFactor, 0),
    ct25: nonResAll.reduce((s, r) => s + r.taxable_income_vnd * monthsFactor, 0),
    ct29: wRes.reduce((s, r) => s + r.taxable_income_vnd * monthsFactor, 0),
    ct30: wNon.reduce((s, r) => s + r.taxable_income_vnd * monthsFactor, 0),
    ct32: wRes.reduce((s, r) => s + r.pit_tax_vnd * monthsFactor, 0),
    ct33: wNon.reduce((s, r) => s + r.pit_tax_vnd * monthsFactor, 0),
    ct35: authBk1.length,
    ct36: authBk1.reduce((s, b) => s + b.pit_withheld_vnd, 0),
    ct37: manualOverrides.ct37 ?? 0,
    ct38: authBk1.reduce((s, b) => s + b.pit_payable_annual_vnd, 0),
    ct39: authBk1.reduce((s, b) => s + b.pit_exempt_under_50k_vnd, 0),
  };
  indicators.ct18 = indicators.ct19 + indicators.ct20;
  indicators.ct23 = indicators.ct24 + indicators.ct25;
  indicators.ct28 = indicators.ct29 + indicators.ct30;
  indicators.ct31 = indicators.ct32 + indicators.ct33;
  const netDiff = indicators.ct38 - indicators.ct36 - indicators.ct37 - indicators.ct39;
  indicators.ct40 = Math.max(0, netDiff);
  indicators.ct41 = Math.max(0, -netDiff);

  return {
    year,
    regime_label: regime.label,
    indicators,
    bk1,
    bk2,
    bk3,
  };
}

function escapeXml(str: string | number | null | undefined): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildHtkk05KkXmlString(
  entity: LegalEntityInfoDto,
  kk: AzKk05Summary,
  signDateIso: string
): { filename: string; xml: string } {
  const m1 = kk.period_type === 'Q' ? (kk.period_num - 1) * 3 + 1 : kk.period_num;
  const m2 = kk.period_type === 'Q' ? kk.period_num * 3 : kk.period_num;
  const lastDay = new Date(kk.year, m2, 0).getDate();
  const kyKKhai =
    kk.period_type === 'Q'
      ? `${kk.period_num}/${kk.year}`
      : `${String(m1).padStart(2, '0')}/${kk.year}`;
  const tuNgay = `01/${String(m1).padStart(2, '0')}/${kk.year}`;
  const denNgay = `${String(lastDay).padStart(2, '0')}/${String(m2).padStart(2, '0')}/${kk.year}`;
  const v = kk.indicators;
  const mstClean = entity.tax_code.trim() || '0000000000';
  const periodToken =
    kk.period_type === 'Q'
      ? `Q${kk.period_num}${kk.year}`
      : `M${String(kk.period_num).padStart(2, '0')}${kk.year}`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HSoThueDTu xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://kekhaithue.gdt.gov.vn/TKhaiThue">
  <HSoKhaiThue id="ID_1">
    <TTinChung>
      <TTinDVu>
        <maDVu>HTKK</maDVu>
        <tenDVu>HỖ TRỢ KÊ KHAI THUẾ</tenDVu>
        <pbanDVu>5.7.9</pbanDVu>
      </TTinDVu>
      <TTinTKhaiThue>
        <TKhaiThue>
          <maTKhai>864</maTKhai>
          <tenTKhai>TK khấu trừ thuế thu nhập cá nhân Mẫu 05/KK-TNCN (TT80/2021)</tenTKhai>
          <pbanTKhaiXML>2.9.3</pbanTKhaiXML>
          <loaiTKhai>C</loaiTKhai>
          <soLan>0</soLan>
          <KyKKhaiThue>
            <kieuKy>${kk.period_type}</kieuKy>
            <kyKKhai>${escapeXml(kyKKhai)}</kyKKhai>
            <kyKKhaiTuNgay>${escapeXml(tuNgay)}</kyKKhaiTuNgay>
            <kyKKhaiDenNgay>${escapeXml(denNgay)}</kyKKhaiDenNgay>
            <kyKKhaiTuThang />
            <kyKKhaiDenThang />
          </KyKKhaiThue>
          <maCQTNoiNop>${escapeXml(entity.tax_authority_code)}</maCQTNoiNop>
          <tenCQTNoiNop>${escapeXml(entity.tax_authority_name)}</tenCQTNoiNop>
          <ngayLapTKhai>${escapeXml(signDateIso)}</ngayLapTKhai>
          <nguoiKy>${escapeXml(entity.representative_name)}</nguoiKy>
          <ngayKy>${escapeXml(signDateIso)}</ngayKy>
        </TKhaiThue>
        <NNT>
          <mst>${escapeXml(mstClean)}</mst>
          <tenNNT>${escapeXml(entity.legal_entity_name)}</tenNNT>
          <dchiNNT>${escapeXml(entity.address)}</dchiNNT>
          <dthoaiNNT>${escapeXml(entity.phone)}</dthoaiNNT>
          <emailNNT>${escapeXml(entity.email)}</emailNNT>
        </NNT>
      </TTinTKhaiThue>
    </TTinChung>
    <CTieuTKhaiChinh>
      <ct15>0</ct15>
      <ct16>${v.ct16 || 0}</ct16>
      <ct17>${v.ct17 || 0}</ct17>
      <ct18>${v.ct18 || 0}</ct18>
      <ct19>${v.ct19 || 0}</ct19>
      <ct20>${v.ct20 || 0}</ct20>
      <ct21>${v.ct21 || 0}</ct21>
      <ct22>${v.ct22 || 0}</ct22>
      <ct23>${v.ct23 || 0}</ct23>
      <ct24>${v.ct24 || 0}</ct24>
      <ct25>${v.ct25 || 0}</ct25>
      <ct25_1>0</ct25_1>
      <ct26>${v.ct26 || 0}</ct26>
      <ct27>${v.ct27 || 0}</ct27>
      <ct28>${v.ct28 || 0}</ct28>
      <ct29>${v.ct29 || 0}</ct29>
      <ct30>${v.ct30 || 0}</ct30>
      <ct31>${v.ct31 || 0}</ct31>
      <ct32>${v.ct32 || 0}</ct32>
    </CTieuTKhaiChinh>
  </HSoKhaiThue>
</HSoThueDTu>`;

  return {
    filename: `${mstClean}-05_KK_TNCN_TT80-${periodToken}-L00.xml`,
    xml,
  };
}

export function buildHtkk05QttXmlString(
  entity: LegalEntityInfoDto,
  qtt: AzQtt05Summary,
  signDateIso: string
): { filename: string; xml: string } {
  const v = qtt.indicators;
  const mstClean = entity.tax_code.trim() || '0000000000';
  const hasAuth = (v.ct35 || 0) > 0 ? 1 : 0;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HSoThueDTu xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://kekhaithue.gdt.gov.vn/TKhaiThue">
  <HSoKhaiThue id="ID_1">
    <TTinChung>
      <TTinDVu>
        <maDVu>HTKK</maDVu>
        <tenDVu>HỖ TRỢ KÊ KHAI THUẾ</tenDVu>
        <pbanDVu>5.7.9</pbanDVu>
      </TTinDVu>
      <TTinTKhaiThue>
        <TKhaiThue>
          <maTKhai>953</maTKhai>
          <tenTKhai>TỜ KHAI QUYẾT TOÁN THUẾ THU NHẬP CÁ NHÂN (Mẫu số 05/QTT-TNCN)</tenTKhai>
          <pbanTKhaiXML>2.9.3</pbanTKhaiXML>
          <loaiTKhai>C</loaiTKhai>
          <soLan>0</soLan>
          <KyKKhaiThue>
            <kieuKy>Y</kieuKy>
            <kyKKhai>${qtt.year}</kyKKhai>
            <kyKKhaiTuNgay />
            <kyKKhaiDenNgay />
            <kyKKhaiTuThang>01/${qtt.year}</kyKKhaiTuThang>
            <kyKKhaiDenThang>12/${qtt.year}</kyKKhaiDenThang>
          </KyKKhaiThue>
          <maCQTNoiNop>${escapeXml(entity.tax_authority_code)}</maCQTNoiNop>
          <tenCQTNoiNop>${escapeXml(entity.tax_authority_name)}</tenCQTNoiNop>
          <ngayLapTKhai>${escapeXml(signDateIso)}</ngayLapTKhai>
          <nguoiKy>${escapeXml(entity.representative_name)}</nguoiKy>
          <ngayKy>${escapeXml(signDateIso)}</ngayKy>
        </TKhaiThue>
        <NNT>
          <mst>${escapeXml(mstClean)}</mst>
          <tenNNT>${escapeXml(entity.legal_entity_name)}</tenNNT>
          <dchiNNT>${escapeXml(entity.address)}</dchiNNT>
          <dthoaiNNT>${escapeXml(entity.phone)}</dthoaiNNT>
          <emailNNT>${escapeXml(entity.email)}</emailNNT>
        </NNT>
      </TTinTKhaiThue>
    </TTinChung>
    <CTieuTKhaiChinh>
      <Header>
        <toChucCoQTTTheoUyQuyen>${hasAuth}</toChucCoQTTTheoUyQuyen>
        <ma_THQuyetToan>01</ma_THQuyetToan>
        <ten_THQuyetToan>QT định kỳ</ten_THQuyetToan>
      </Header>
      <NVuKhauTruThue>
        <ct16>${v.ct16 || 0}</ct16>
        <ct17>${v.ct17 || 0}</ct17>
        <ct18>${v.ct18 || 0}</ct18>
        <ct19>${v.ct19 || 0}</ct19>
        <ct20>${v.ct20 || 0}</ct20>
        <ct21>0</ct21>
        <ct22>${v.ct22 || 0}</ct22>
        <ct23>${v.ct23 || 0}</ct23>
        <ct24>${v.ct24 || 0}</ct24>
        <ct25>${v.ct25 || 0}</ct25>
        <ct26>0</ct26>
        <ct27>0</ct27>
        <ct28>${v.ct28 || 0}</ct28>
        <ct29>${v.ct29 || 0}</ct29>
        <ct30>${v.ct30 || 0}</ct30>
        <ct31>${v.ct31 || 0}</ct31>
        <ct32>${v.ct32 || 0}</ct32>
        <ct33>${v.ct33 || 0}</ct33>
        <ct34>0</ct34>
      </NVuKhauTruThue>
      <NVuQToanThay>
        <ct35>${v.ct35 || 0}</ct35>
        <ct36>${v.ct36 || 0}</ct36>
        <ct37>${v.ct37 || 0}</ct37>
        <ct38>${v.ct38 || 0}</ct38>
        <ct39>${v.ct39 || 0}</ct39>
        <ct40>${v.ct40 || 0}</ct40>
        <ct41>${v.ct41 || 0}</ct41>
      </NVuQToanThay>
    </CTieuTKhaiChinh>
  </HSoKhaiThue>
</HSoThueDTu>`;

  return {
    filename: `${mstClean}-05_QTT_TNCN_TT80-Y${qtt.year}-L00.xml`,
    xml,
  };
}

/* ---------- XLSX Excel Exporters ---------- */
function buildWorksheet(aoa: ExcelCellValue[][], colWidths?: number[]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  if (colWidths && colWidths.length > 0) {
    ws['!cols'] = colWidths.map((wch) => ({ wch }));
  }
  return ws;
}

function writeWorkbook(filename: string, sheets: Array<[string, XLSX.WorkSheet]>): void {
  const wb = XLSX.utils.book_new();
  for (const [sheetName, ws] of sheets) {
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  }
  XLSX.writeFile(wb, filename);
}

export function exportAzPayrollAndBhxhExcel(
  entity: LegalEntityInfoDto,
  periodKey: string,
  rows: AzCalculatedRow[]
): void {
  const headerBlock: ExcelCellValue[][] = [
    [entity.legal_entity_name],
    [`MST: ${entity.tax_code || '—'} | Địa chỉ: ${entity.address || '—'}`],
    [`BẢNG THANH TOÁN TIỀN LƯƠNG & THUẾ TNCN KỲ ${periodKey}`],
    [],
  ];

  const payHeaders: ExcelCellValue[] = [
    'STT',
    'Mã NV',
    'Họ và tên',
    'Phòng ban',
    'Công thực tế / Chuẩn',
    'Lương cơ bản',
    'Lương theo công',
    'Phụ cấp',
    'Tăng ca OT',
    'Hoa hồng & Thưởng',
    'Tổng Gross',
    'BHXH 8%',
    'BHYT 1.5%',
    'BHTN 1%',
    'Số NPT',
    'Giảm trừ gia cảnh',
    'TN tính thuế',
    'Thuế TNCN',
    'Tạm ứng',
    'Thực lĩnh Net',
  ];

  const payBody: ExcelCellValue[][] = rows.map((r, idx) => [
    idx + 1,
    r.employee.employee_code,
    r.employee.full_name,
    r.employee.department_name || '—',
    `${r.actual_workdays}/${r.standard_workdays}`,
    r.base_salary_vnd,
    r.prorated_base_pay_vnd,
    r.allowances_vnd,
    r.ot_pay_vnd,
    r.commission_pay_vnd + r.bonus_vnd,
    r.gross_pay_vnd,
    r.emp_bhxh_vnd,
    r.emp_bhyt_vnd,
    r.emp_bhtn_vnd,
    r.dependents_count,
    r.family_deduction_vnd,
    r.assessable_income_vnd,
    r.pit_tax_vnd,
    r.advance_deduction_vnd,
    r.net_pay_vnd,
  ]);

  const bhxhHeaders: ExcelCellValue[] = [
    'STT',
    'Mã NV',
    'Họ và tên',
    'Mức lương đóng BHXH',
    'BHXH NLĐ 8%',
    'BHYT NLĐ 1.5%',
    'BHTN NLĐ 1%',
    'BHXH DN 17.5%',
    'BHYT DN 3%',
    'BHTN DN 1%',
    'KPCĐ DN 2%',
    'Tổng phải nộp cơ quan BHXH',
  ];

  const bhxhBody: ExcelCellValue[][] = rows.map((r, idx) => [
    idx + 1,
    r.employee.employee_code,
    r.employee.full_name,
    r.bhxh_base_vnd,
    r.emp_bhxh_vnd,
    r.emp_bhyt_vnd,
    r.emp_bhtn_vnd,
    r.er_bhxh_vnd,
    r.er_bhyt_vnd,
    r.er_bhtn_vnd,
    r.er_kpcd_vnd,
    r.emp_insurance_total_vnd + r.er_insurance_total_vnd,
  ]);

  writeWorkbook(`Bang_Luong_Va_BHXH_${periodKey}.xlsx`, [
    ['Bang_Luong', buildWorksheet([...headerBlock, payHeaders, ...payBody])],
    ['Doi_Soat_BHXH', buildWorksheet([...headerBlock, bhxhHeaders, ...bhxhBody])],
  ]);
}

export function exportAzBankUncExcel(
  periodKey: string,
  rows: AzCalculatedRow[],
  transferNote: string
): void {
  const validRows = rows.filter((r) => r.net_pay_vnd > 0);
  const aoa: ExcelCellValue[][] = [
    ['STT', 'Mã NV', 'Họ và tên người thụ hưởng', 'Số tài khoản', 'Ngân hàng', 'Chi nhánh', 'Số tiền chuyển (VNĐ)', 'Nội dung chuyển khoản UNC'],
    ...validRows.map((r, idx) => [
      idx + 1,
      r.employee.employee_code,
      r.employee.full_name,
      r.employee.bank_account_number,
      r.employee.bank_name,
      r.employee.bank_branch,
      r.net_pay_vnd,
      transferNote || `Thanh toan luong ky ${periodKey}`,
    ]),
  ];

  const ws = buildWorksheet(aoa, [6, 12, 28, 22, 20, 18, 18, 34]);
  validRows.forEach((r, idx) => {
    const cellAddr = XLSX.utils.encode_cell({ r: idx + 1, c: 3 });
    const cell = ws[cellAddr] as XLSX.CellObject | undefined;
    if (cell) {
      cell.t = 's';
      cell.v = String(r.employee.bank_account_number || '');
    }
  });

  writeWorkbook(`UNC_Chi_Luong_Ngan_Hang_${periodKey}.xlsx`, [['UNC_Chi_Luong', ws]]);
}

export function exportAzJournalExcel(
  entity: LegalEntityInfoDto,
  periodKey: string,
  regime: AzAccountingRegime,
  entries: AzJournalEntry[]
): void {
  const aoa: ExcelCellValue[][] = [
    [entity.legal_entity_name],
    [`SỔ NHẬT KÝ CHUNG HẠCH TOÁN LƯƠNG & THUẾ (${regime}) — KỲ ${periodKey}`],
    [],
    ['STT', 'Ngày ghi sổ', 'Số chứng từ', 'Diễn giải nghiệp vụ kinh tế', 'TK Nợ', 'TK Có', 'Số tiền phát sinh (VNĐ)'],
    ...entries.map((e) => [
      e.seq,
      e.doc_date,
      e.doc_no,
      e.description,
      e.debit_account,
      e.credit_account,
      e.amount_vnd,
    ]),
  ];
  writeWorkbook(`So_Nhat_Ky_Chung_${regime}_${periodKey}.xlsx`, [
    [`Nhat_Ky_${regime}`, buildWorksheet(aoa, [6, 14, 20, 54, 10, 10, 20])],
  ]);
}

export function exportAzLaborBookExcel(
  entity: LegalEntityInfoDto,
  year: number,
  rows: AzCalculatedRow[]
): void {
  const aoa: ExcelCellValue[][] = [
    [entity.legal_entity_name],
    [`MST: ${entity.tax_code || '—'} | Địa chỉ: ${entity.address || '—'}`],
    [`SỔ QUẢN LÝ LAO ĐỘNG NĂM ${year} (Theo Nghị định 145/2020/NĐ-CP)`],
    [],
    [...LABOR_BOOK_HEADERS],
    ...buildAzLaborBookRows(rows),
  ];
  writeWorkbook(`So_Quan_Ly_Lao_Dong_${year}.xlsx`, [
    ['So_QLLD', buildWorksheet(aoa, LABOR_BOOK_HEADERS.map((_, i) => (i === 2 ? 26 : i === 0 ? 6 : 18)))],
  ]);
}

export function exportAzQttAppendicesExcel(qtt: AzQtt05Summary): void {
  const bk1Aoa: ExcelCellValue[][] = [
    [
      '[06] STT',
      'Mã NV',
      '[07] Họ và tên',
      '[08] MST cá nhân',
      '[09] CCCD/Hộ chiếu',
      '[10] Ủy quyền QT thay',
      '[12] Tổng TNCT năm',
      '[16] Số NPT',
      '[17] Tổng giảm trừ gia cảnh',
      '[19] Bảo hiểm bắt buộc',
      '[21] Thu nhập tính thuế',
      '[22] Thuế TNCN đã khấu trừ',
      '[24] Thuế TNCN phải nộp năm',
      '[25] Thuế nộp thừa',
      '[26] Thuế còn phải nộp',
      '[27] Thuế được miễn (≤50k)',
    ],
    ...qtt.bk1.map((r) => [
      r.stt,
      r.employee_code,
      r.full_name,
      r.tax_code,
      r.id_number,
      r.authorized ? 'x' : '',
      r.taxable_income_vnd,
      r.dependents_count,
      r.family_deduction_vnd,
      r.insurance_deduction_vnd,
      r.assessable_income_vnd,
      r.pit_withheld_vnd,
      r.pit_payable_annual_vnd,
      r.pit_overpaid_vnd,
      r.pit_remaining_vnd,
      r.pit_exempt_under_50k_vnd,
    ]),
  ];

  const bk2Aoa: ExcelCellValue[][] = [
    ['STT', 'Mã NV', 'Họ và tên', 'MST cá nhân', 'CCCD/Hộ chiếu', 'Cá nhân không cư trú', 'Tổng TNCT', 'Thuế TNCN đã khấu trừ'],
    ...qtt.bk2.map((r) => [
      r.stt,
      r.employee_code,
      r.full_name,
      r.tax_code,
      r.id_number,
      r.is_resident ? '' : 'x',
      r.taxable_income_vnd,
      r.pit_withheld_vnd,
    ]),
  ];

  const bk3Aoa: ExcelCellValue[][] = [
    ['STT', 'Họ tên người nộp thuế', 'MST người nộp thuế', 'Thông tin người phụ thuộc', 'Số tháng giảm trừ', 'Tổng mức giảm trừ NPT (VNĐ)'],
    ...qtt.bk3.map((r) => [
      r.stt,
      r.taxpayer_name,
      r.taxpayer_mst,
      r.dependent_slot,
      r.deduction_months,
      r.deduction_amount_vnd,
    ]),
  ];

  writeWorkbook(`Bang_Ke_05_QTT_TNCN_${qtt.year}.xlsx`, [
    ['05-1_BK_QTT', buildWorksheet(bk1Aoa)],
    ['05-2_BK_QTT', buildWorksheet(bk2Aoa)],
    ['05-3_BK_NPT', buildWorksheet(bk3Aoa)],
  ]);
}
