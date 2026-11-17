export interface ShiftScheduleDayConfig {
  active: boolean;
  morning_start: string;
  morning_end: string;
  afternoon_start: string;
  afternoon_end: string;
}

export type WeeklyShiftScheduleMap = Record<string, ShiftScheduleDayConfig>;

export interface HrEmployeeRbacSummary {
  role_id?: string | null;
  role_key?: string | null;
  role_name?: string | null;
  data_scope?: string | null;
  is_tenant_owner?: boolean;
  default_route?: string | null;
  modules?: Record<
    string,
    {
      scope?: string;
      data_scope?: string;
      actions?: Record<string, boolean>;
    }
  >;
}

export interface HrEmployeeDto {
  id: string;
  user_id?: string | null;
  employee_code: string;
  full_name: string;
  work_email?: string | null;
  phone?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  nationality?: string | null;
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
  resign_date?: string | null;
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
  avatar_url?: string | null;
  salary_masked?: boolean;
  metadata?: Record<string, unknown>;
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

export interface HrEmployeeDossierDto {
  employee: HrEmployeeDto;
  contracts: HrContractDto[];
  assets: HrAssetDto[];
  shift_schedule: WeeklyShiftScheduleMap;
  rbac_summary: HrEmployeeRbacSummary | null;
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

export interface OrgBranchNode {
  id: string;
  code: string;
  name: string;
  legal_entity_name?: string | null;
  tax_code?: string | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
  gps_radius_meters?: number | null;
  manager_user_id?: string | null;
}

export interface OrgDepartmentNode {
  id: string;
  code: string;
  name: string;
  branch_id?: string | null;
  parent_department_id?: string | null;
  manager_user_id?: string | null;
}

export interface OrgTeamNode {
  id: string;
  code: string;
  name: string;
  department_id?: string | null;
  leader_user_id?: string | null;
}

export interface OrgPositionNode {
  id: string;
  code: string;
  name: string;
  department_id?: string | null;
  level_rank?: number | null;
}

export interface OrgUserNode {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  role_name?: string | null;
  branch_id?: string | null;
  department_id?: string | null;
  team_id?: string | null;
  position_id?: string | null;
  reports_to_user_id?: string | null;
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
    branches: OrgBranchNode[];
    departments: OrgDepartmentNode[];
    teams: OrgTeamNode[];
    positions: OrgPositionNode[];
    users: OrgUserNode[];
  };
}

export type HrmGeofenceMode = 'flexible' | 'warn_with_explanation' | 'strict_radius';

export interface HrmAttendancePolicyDto {
  geofence_mode: HrmGeofenceMode;
  require_gps: boolean;
  require_selfie: boolean;
  max_gps_accuracy_meters: number;
  grace_late_minutes: number;
  grace_early_minutes: number;
  allow_any_branch_checkin: boolean;
  allow_remote_with_approved_leave: boolean;
}

export interface HrmAttendanceExemptionDto {
  exempt_checkin?: boolean;
  exempt_gps?: boolean;
  exempt_selfie?: boolean;
  approved_remote_leave?: boolean;
  ip_whitelisted?: boolean;
  reason_label?: string | null;
}

export interface HrmBranchGpsDto {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  gps_radius_meters: number;
  is_headquarters?: boolean;
}

export interface HrmShiftInfoDto {
  id: string;
  code?: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  grace_late_minutes?: number;
  grace_early_leave_minutes?: number;
  require_gps?: boolean;
  require_selfie?: boolean;
  allow_out_of_geofence_with_explanation?: boolean;
}

export interface HrmTodayAttendanceLogDto {
  id: string;
  work_date: string;
  check_in_at?: string | null;
  check_out_at?: string | null;
  distance_meters?: number | null;
  within_geofence?: boolean;
  late_minutes?: number;
  worked_hours?: number;
  work_units?: number;
  status?: string;
  selfie_data_url?: string | null;
}

export interface HrmAttendanceOverviewSnapshot {
  today_date: string;
  today_log: HrmTodayAttendanceLogDto | null;
  active_shift: HrmShiftInfoDto | null;
  active_branch: HrmBranchGpsDto | null;
  branches: HrmBranchGpsDto[];
  policy?: Partial<HrmAttendancePolicyDto>;
  exemption?: HrmAttendanceExemptionDto;
  effective_exemption?: HrmAttendanceExemptionDto;
  client_ip_whitelisted?: boolean;
  ip_whitelist_matched?: boolean;
  approved_remote_leave?: boolean;
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

export const EMPLOYMENT_TYPE_LABELS: Record<HrEmployeeDto['employment_type'], string> = {
  full_time: 'Toàn thời gian (Full-time)',
  part_time: 'Bán thời gian (Part-time)',
  contractor: 'Chuyên gia / Cộng tác viên',
  intern: 'Thực tập sinh (Intern)',
};

export const ASSET_CATEGORY_LABELS: Record<string, string> = {
  laptop: 'Laptop / Máy tính',
  monitor: 'Màn hình / Thiết bị VP',
  phone: 'Điện thoại / SIM công vụ',
  access_card: 'Thẻ từ / Chìa khóa',
  vehicle: 'Phương tiện đi lại',
  uniform: 'Đồng phục / Bảo hộ',
};

export const ASSET_STATUS_LABELS: Record<HrAssetDto['status'], string> = {
  assigned: 'Đang bàn giao',
  returned: 'Đã thu hồi',
  damaged: 'Hư hỏng / Bảo hành',
  lost: 'Báo mất',
};

export const WEEKDAY_ORDER = ['1', '2', '3', '4', '5', '6', '7'] as const;

export const WEEKDAY_LABELS: Record<string, string> = {
  '1': 'Thứ 2',
  '2': 'Thứ 3',
  '3': 'Thứ 4',
  '4': 'Thứ 5',
  '5': 'Thứ 6',
  '6': 'Thứ 7',
  '7': 'Chủ Nhật',
};

export const DEFAULT_WEEKLY_SCHEDULE: WeeklyShiftScheduleMap = {
  '1': { active: true, morning_start: '08:00', morning_end: '12:00', afternoon_start: '13:30', afternoon_end: '17:30' },
  '2': { active: true, morning_start: '08:00', morning_end: '12:00', afternoon_start: '13:30', afternoon_end: '17:30' },
  '3': { active: true, morning_start: '08:00', morning_end: '12:00', afternoon_start: '13:30', afternoon_end: '17:30' },
  '4': { active: true, morning_start: '08:00', morning_end: '12:00', afternoon_start: '13:30', afternoon_end: '17:30' },
  '5': { active: true, morning_start: '08:00', morning_end: '12:00', afternoon_start: '13:30', afternoon_end: '17:30' },
  '6': { active: false, morning_start: '08:00', morning_end: '12:00', afternoon_start: '13:30', afternoon_end: '17:30' },
  '7': { active: false, morning_start: '08:00', morning_end: '12:00', afternoon_start: '13:30', afternoon_end: '17:30' },
};

export const VIETNAM_BANK_OPTIONS: ReadonlyArray<{ code: string; name: string }> = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'MB', name: 'MB Bank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'ICB', name: 'VietinBank' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'VBA', name: 'Agribank' },
  { code: 'SHB', name: 'SHB' },
  { code: 'MSB', name: 'MSB' },
];

export function resolveBankVietQrCode(bankName?: string | null): string | null {
  if (!bankName) return null;
  const norm = bankName.trim().toLowerCase();
  if (!norm) return null;
  for (const item of VIETNAM_BANK_OPTIONS) {
    if (norm === item.code.toLowerCase() || norm.includes(item.name.toLowerCase())) {
      return item.code;
    }
  }
  if (norm.includes('ngoại thương') || norm.includes('vietcom')) return 'VCB';
  if (norm.includes('kỹ thương') || norm.includes('techcom')) return 'TCB';
  if (norm.includes('quân đội') || norm === 'mbbank') return 'MB';
  if (norm.includes('á châu')) return 'ACB';
  if (norm.includes('công thương') || norm.includes('vietin')) return 'ICB';
  if (norm.includes('đầu tư và phát triển')) return 'BIDV';
  if (norm.includes('tiên phong')) return 'TPB';
  if (norm.includes('thịnh vượng')) return 'VPB';
  return null;
}

export function buildVietQrPreviewUrl(params: {
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  amountVnd?: number;
  addInfo?: string;
}): string | null {
  const code = resolveBankVietQrCode(params.bankName);
  const cleanAccount = String(params.accountNumber || '').replace(/[^0-9A-Za-z]/g, '');
  if (!code || !cleanAccount) return null;
  const query = new URLSearchParams();
  if (params.accountHolder?.trim()) {
    query.set('accountName', params.accountHolder.trim().toUpperCase());
  }
  if (params.amountVnd && params.amountVnd > 0) {
    query.set('amount', String(Math.round(params.amountVnd)));
  }
  if (params.addInfo?.trim()) {
    query.set('addInfo', params.addInfo.trim());
  }
  const qs = query.toString();
  return `https://img.vietqr.io/image/${code}-${cleanAccount}-compact2.png${qs ? `?${qs}` : ''}`;
}

export function computeHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusMeters = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function parseHmMinutes(hm: string, fallback: number): number {
  const match = hm.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return fallback;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m)) return fallback;
  return h * 60 + m;
}

export function formatIsoOrHmToHm(isoOrHm?: string | null): string {
  if (!isoOrHm) return '—';
  if (/^\d{1,2}:\d{2}/.test(isoOrHm.trim())) {
    return isoOrHm.trim().slice(0, 5);
  }
  const parsed = new Date(isoOrHm);
  if (Number.isNaN(parsed.getTime())) return String(isoOrHm);
  return parsed.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export interface NetWorkedShiftSummary {
  currentHm: string;
  currentDateLabel: string;
  checkInHm: string;
  lunchDeductedMinutes: number;
  netWorkedMinutes: number;
  netWorkedLabel: string;
  isEarlyLeave: boolean;
  earlyLeaveMinutes: number;
}

export function computeNetWorkedShiftSummary(params: {
  checkInIsoOrHm?: string | null;
  nowMs: number;
  shiftStartHm?: string;
  shiftEndHm?: string;
  breakMinutes?: number;
}): NetWorkedShiftSummary {
  const nowDate = new Date(params.nowMs);
  const curHours = nowDate.getHours();
  const curMins = nowDate.getMinutes();
  const curTotalMin = curHours * 60 + curMins;
  const currentHm = `${String(curHours).padStart(2, '0')}:${String(curMins).padStart(2, '0')}`;
  const currentDateLabel = nowDate.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const shiftStartMin = parseHmMinutes(params.shiftStartHm || '08:30', 8 * 60 + 30);
  const shiftEndMin = parseHmMinutes(params.shiftEndHm || '17:30', 17 * 60 + 30);
  const configuredBreak = Math.max(0, Number(params.breakMinutes ?? 60));

  const checkInHm = formatIsoOrHmToHm(params.checkInIsoOrHm);
  const inMin = checkInHm !== '—' ? parseHmMinutes(checkInHm, shiftStartMin) : shiftStartMin;

  const effectiveIn = Math.max(inMin, shiftStartMin);
  const effectiveOut = Math.min(curTotalMin, shiftEndMin);

  const lunchStart = 12 * 60;
  const lunchEnd = lunchStart + configuredBreak;
  const lunchOverlap =
    configuredBreak > 0
      ? Math.max(0, Math.min(effectiveOut, lunchEnd) - Math.max(effectiveIn, lunchStart))
      : 0;

  const netWorkedMinutes = Math.max(0, effectiveOut - effectiveIn - lunchOverlap);
  const h = Math.floor(netWorkedMinutes / 60);
  const m = netWorkedMinutes % 60;
  const netWorkedLabel = `${h}h ${String(m).padStart(2, '0')}m`;

  const earlyDiff = Math.max(0, shiftEndMin - curTotalMin);
  return {
    currentHm,
    currentDateLabel,
    checkInHm,
    lunchDeductedMinutes: lunchOverlap,
    netWorkedMinutes,
    netWorkedLabel,
    isEarlyLeave: earlyDiff > 0,
    earlyLeaveMinutes: earlyDiff,
  };
}

export function extractWeeklyScheduleFromEmployee(emp?: HrEmployeeDto | null): WeeklyShiftScheduleMap {
  const rawMeta = emp?.metadata;
  const candidate =
    rawMeta && typeof rawMeta === 'object' && rawMeta.shift_schedule && typeof rawMeta.shift_schedule === 'object'
      ? (rawMeta.shift_schedule as Record<string, unknown>)
      : null;

  const result: WeeklyShiftScheduleMap = {};
  for (const dayKey of WEEKDAY_ORDER) {
    const def = DEFAULT_WEEKLY_SCHEDULE[dayKey];
    const item = candidate && typeof candidate[dayKey] === 'object' && candidate[dayKey] !== null
      ? (candidate[dayKey] as Record<string, unknown>)
      : null;
    result[dayKey] = {
      active: item && typeof item.active === 'boolean' ? item.active : def.active,
      morning_start: item && typeof item.morning_start === 'string' ? item.morning_start : def.morning_start,
      morning_end: item && typeof item.morning_end === 'string' ? item.morning_end : def.morning_end,
      afternoon_start: item && typeof item.afternoon_start === 'string' ? item.afternoon_start : def.afternoon_start,
      afternoon_end: item && typeof item.afternoon_end === 'string' ? item.afternoon_end : def.afternoon_end,
    };
  }
  return result;
}

export function normalizeEmployeeDossier(
  raw: unknown,
  fallbackEmployee: HrEmployeeDto | null
): HrEmployeeDossierDto | null {
  if (!raw || typeof raw !== 'object') {
    if (!fallbackEmployee) return null;
    return {
      employee: fallbackEmployee,
      contracts: [],
      assets: [],
      shift_schedule: extractWeeklyScheduleFromEmployee(fallbackEmployee),
      rbac_summary: null,
    };
  }

  const obj = raw as Record<string, unknown>;
  const empSource =
    obj.employee && typeof obj.employee === 'object'
      ? (obj.employee as unknown as HrEmployeeDto)
      : (obj as unknown as HrEmployeeDto);

  const userAcc =
    obj.user_account && typeof obj.user_account === 'object'
      ? (obj.user_account as Record<string, unknown>)
      : null;

  const mergedEmp: HrEmployeeDto = {
    ...(fallbackEmployee || ({} as HrEmployeeDto)),
    ...empSource,
    avatar_url:
      empSource.avatar_url ||
      (userAcc && typeof userAcc.avatar_url === 'string' ? userAcc.avatar_url : fallbackEmployee?.avatar_url) ||
      null,
    base_salary_vnd: Number(empSource.base_salary_vnd ?? fallbackEmployee?.base_salary_vnd ?? 0),
    insurance_salary_vnd: Number(empSource.insurance_salary_vnd ?? fallbackEmployee?.insurance_salary_vnd ?? 0),
    allowances_json:
      empSource.allowances_json && typeof empSource.allowances_json === 'object'
        ? empSource.allowances_json
        : fallbackEmployee?.allowances_json || {},
  };

  const contracts = Array.isArray(obj.contracts) ? (obj.contracts as HrContractDto[]) : [];
  const assets = Array.isArray(obj.assets) ? (obj.assets as HrAssetDto[]) : [];

  let shiftSchedule = extractWeeklyScheduleFromEmployee(mergedEmp);
  if (obj.shift_schedule && typeof obj.shift_schedule === 'object') {
    const rawSched = obj.shift_schedule as Record<string, unknown>;
    const nextSched: WeeklyShiftScheduleMap = {};
    for (const dayKey of WEEKDAY_ORDER) {
      const base = shiftSchedule[dayKey];
      const d = rawSched[dayKey];
      if (d && typeof d === 'object') {
        const doObj = d as Record<string, unknown>;
        nextSched[dayKey] = {
          active: typeof doObj.active === 'boolean' ? doObj.active : base.active,
          morning_start: typeof doObj.morning_start === 'string' ? doObj.morning_start : base.morning_start,
          morning_end: typeof doObj.morning_end === 'string' ? doObj.morning_end : base.morning_end,
          afternoon_start: typeof doObj.afternoon_start === 'string' ? doObj.afternoon_start : base.afternoon_start,
          afternoon_end: typeof doObj.afternoon_end === 'string' ? doObj.afternoon_end : base.afternoon_end,
        };
      } else {
        nextSched[dayKey] = base;
      }
    }
    shiftSchedule = nextSched;
  }

  const rbacSummary: HrEmployeeRbacSummary | null =
    obj.rbac_summary && typeof obj.rbac_summary === 'object'
      ? (obj.rbac_summary as HrEmployeeRbacSummary)
      : obj.rbac && typeof obj.rbac === 'object'
        ? (obj.rbac as HrEmployeeRbacSummary)
        : userAcc
          ? {
              role_key: typeof userAcc.role === 'string' ? userAcc.role : null,
              role_name: typeof userAcc.role === 'string' ? userAcc.role.toUpperCase() : null,
              is_tenant_owner: Boolean(userAcc.is_tenant_owner),
            }
          : null;

  return {
    employee: mergedEmp,
    contracts,
    assets,
    shift_schedule: shiftSchedule,
    rbac_summary: rbacSummary,
  };
}
