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

export interface PayrollSlipDto {
  id: string;
  period_id: string;
  employee_id: string;
  employee_code?: string;
  employee_name?: string;
  department_name?: string | null;
  tax_code?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  standard_workdays: number;
  actual_workdays: number;
  overtime_hours: number;
  base_salary_vnd: number;
  prorated_base_pay_vnd: number;
  allowances_vnd: number;
  tax_exempt_vnd: number;
  overtime_pay_vnd: number;
  commission_pay_vnd: number;
  bonus_vnd: number;
  gross_pay_vnd: number;
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
  payment_status: 'unpaid' | 'paid';
  breakdown?: {
    pit_breakdown?: ProgressiveTaxSliceDto[];
    allowance_lines?: Array<{ key: string; name: string; amount_vnd: number; exempt_vnd: number }>;
  };
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
