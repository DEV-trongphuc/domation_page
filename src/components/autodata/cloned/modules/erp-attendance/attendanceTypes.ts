export interface BranchGpsInfo {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  gps_radius_meters: number;
  is_headquarters?: boolean;
}

export interface ShiftDto {
  id: string;
  code: string;
  name: string;
  start_time: string;
  end_time: string;
  break_start_time?: string | null;
  break_end_time?: string | null;
  break_minutes: number;
  grace_late_minutes: number;
  grace_early_leave_minutes: number;
  standard_work_hours: number;
  min_half_day_hours: number;
  work_unit_value: number;
  night_shift_multiplier: number;
  overtime_multiplier: number;
  weekend_overtime_multiplier: number;
  holiday_overtime_multiplier: number;
  require_gps: boolean;
  require_selfie: boolean;
  allow_out_of_geofence_with_explanation: boolean;
  working_days: number[];
  is_default: boolean;
  is_active: boolean;
}

export interface AttendanceLogDto {
  id: string;
  user_id: string;
  user_name?: string;
  branch_name?: string | null;
  shift_name?: string | null;
  work_date: string;
  work_date_str?: string;
  attendance_code: string;
  check_in_at?: string | null;
  check_out_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance_meters: number | null;
  within_geofence: boolean;
  selfie_data_url?: string | null;
  late_minutes: number;
  worked_hours: number;
  overtime_hours: number;
  work_units: number;
  status: 'valid' | 'late' | 'out_of_geofence' | 'missing_checkout' | 'explained' | 'leave';
  note?: string | null;
}

export interface AttendanceOverviewDto {
  today_date: string;
  today_log: AttendanceLogDto | null;
  active_shift: ShiftDto | null;
  active_branch: BranchGpsInfo | null;
  branches: BranchGpsInfo[];
  summary: {
    my_month_work_units: number;
    my_month_late_days: number;
    company_today_checkins: number;
    pending_explanations: number;
  };
}

export interface TimesheetDayCell {
  code: string;
  work_units: number;
  late_minutes: number;
  overtime_hours: number;
  within_geofence: boolean;
  status: string;
}

export interface TimesheetUserRow {
  user_id: string;
  full_name: string;
  email: string;
  department_name?: string | null;
  branch_name?: string | null;
  days: Record<number, TimesheetDayCell>;
  total_work_units: number;
  late_count: number;
  out_of_geofence_count: number;
  total_overtime_hours: number;
}

export interface TimesheetMatrixDto {
  month: string;
  days_in_month: number;
  rows: TimesheetUserRow[];
}

export interface AttendanceExplanationDto {
  id: string;
  user_id: string;
  user_name?: string;
  work_date: string;
  explanation_type:
    | 'late_arrival'
    | 'early_leave'
    | 'forgot_checkin'
    | 'forgot_checkout'
    | 'out_of_geofence'
    | 'business_trip';
  requested_work_units: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approval_request_code?: string | null;
  review_comment?: string | null;
  created_at: string;
}

export const EXPLANATION_TYPE_LABELS: Record<AttendanceExplanationDto['explanation_type'], string> = {
  late_arrival: 'Đi muộn có lý do',
  early_leave: 'Về sớm có lý do',
  forgot_checkin: 'Quên Check-in đầu giờ',
  forgot_checkout: 'Quên Check-out cuối giờ',
  out_of_geofence: 'Công tác ngoài văn phòng (Ngoài vùng GPS)',
  business_trip: 'Đi gặp khách hàng / Công tác',
};

export function calcClientHaversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))));
}
