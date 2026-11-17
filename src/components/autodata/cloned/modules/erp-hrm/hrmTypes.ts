export interface HrEmployeeDto {
  id: string;
  user_id?: string | null;
  employee_code: string;
  full_name: string;
  work_email?: string | null;
  phone?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  nationality?: string;
  id_card_number?: string | null;
  address?: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  team_id?: string | null;
  team_name?: string | null;
  position_id?: string | null;
  position_name?: string | null;
  manager_user_id?: string | null;
  manager_name?: string | null;
  employment_status: 'probation' | 'active' | 'on_leave' | 'resigned' | 'terminated';
  employment_type: 'full_time' | 'part_time' | 'contractor' | 'intern';
  join_date?: string | null;
  base_salary_vnd: number;
  insurance_salary_vnd: number;
  insurance_enrolled: boolean;
  social_insurance_number?: string | null;
  is_resident: boolean;
  tax_code?: string | null;
  dependents_count: number;
  union_member: boolean;
  allowances_json: Record<string, number>;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_holder?: string | null;
  bank_branch?: string | null;
  annual_leave_quota: number;
  annual_leave_used: number;
  compensatory_leave_balance: number;
  digital_signature_data_url?: string | null;
  salary_masked?: boolean;
}

export interface HrContractDto {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  contract_number: string;
  contract_type: 'probation' | 'fixed_term' | 'indefinite' | 'addendum' | 'service';
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'superseded';
  start_date: string;
  end_date?: string | null;
  base_salary_vnd: number;
  insurance_salary_vnd: number;
  signed_by_employee: boolean;
  employee_signature_url?: string | null;
  signed_by_employer: boolean;
  employer_signer_name?: string | null;
  signed_at?: string | null;
  notes?: string | null;
}

export interface HrAssetDto {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  asset_code: string;
  asset_name: string;
  category: string;
  serial_number?: string | null;
  asset_value_vnd: number;
  condition_on_handover: string;
  status: 'assigned' | 'returned' | 'damaged' | 'lost';
  handed_over_at: string;
  returned_at?: string | null;
  acknowledged_by_employee: boolean;
  notes?: string | null;
}

export interface BookingAvailabilityRule {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface BookingLinkDto {
  id: string;
  slug: string;
  public_token: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  meeting_purpose: string;
  duration_minutes: number;
  buffer_minutes: number;
  timezone: string;
  location_type: string;
  location_value?: string | null;
  host_user_name?: string | null;
  confirmed_count?: number;
  is_active: boolean;
  availability_rules: BookingAvailabilityRule[];
}

export interface BookingAppointmentDto {
  id: string;
  booking_link_id: string;
  booking_link_title?: string;
  booking_link_slug?: string;
  guest_name: string;
  guest_email?: string | null;
  guest_phone?: string | null;
  guest_company?: string | null;
  topic?: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
}

export interface PublicBookingPreviewDto {
  booking_link: {
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    description?: string | null;
    duration_minutes: number;
    buffer_minutes: number;
    location_type: string;
    location_value?: string | null;
    host_name: string;
  };
  organization: {
    name: string;
    customer_label: string;
  };
  available_days: Array<{
    date: string;
    day_of_week: number;
    slots: Array<{ start_time: string; end_time: string; available: boolean }>;
  }>;
}

export interface HrmOverviewDto {
  summary: {
    total_employees: number;
    active_employees: number;
    probation_employees: number;
    active_contracts: number;
    assigned_assets: number;
    active_booking_links: number;
    confirmed_appointments: number;
  };
  org: {
    branches: Array<{ id: string; code: string; name: string }>;
    departments: Array<{ id: string; code: string; name: string }>;
    teams: Array<{ id: string; code: string; name: string }>;
    positions: Array<{ id: string; code: string; name: string }>;
    users: Array<{ id: string; full_name: string; email: string }>;
  };
}

export const CONTRACT_TYPE_LABELS: Record<HrContractDto['contract_type'], string> = {
  probation: 'Hợp đồng Thử việc',
  fixed_term: 'HĐLĐ Xác định thời hạn',
  indefinite: 'HĐLĐ Không xác định thời hạn',
  addendum: 'Phụ lục Hợp đồng',
  service: 'Hợp đồng Dịch vụ / Chuyên gia',
};

export const EMPLOYMENT_STATUS_LABELS: Record<HrEmployeeDto['employment_status'], string> = {
  probation: 'Đang thử việc',
  active: 'Chính thức',
  on_leave: 'Tạm nghỉ chế độ',
  resigned: 'Đã nghỉ việc',
  terminated: 'Chấm dứt HĐ',
};
