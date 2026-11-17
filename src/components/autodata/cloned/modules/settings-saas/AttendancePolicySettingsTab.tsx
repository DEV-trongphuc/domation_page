import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, Plus, Save, Shield, Trash2 } from 'lucide-react';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { fetchAPI } from '../../utils/api';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { HrmTimesheetSkeleton } from '../../components/ui/Skeleton';
import type {
  OrgBranch,
  OrgDepartment,
  OrgPosition,
  OrgRole,
  OrgTeam,
} from './saasSettingsTypes';

interface ShiftRecord {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  grace_late_minutes: number;
  standard_work_hours: number;
  night_shift_multiplier: number;
  weekend_overtime_multiplier: number;
  require_gps: boolean;
  require_selfie: boolean;
  allow_out_of_geofence_with_explanation: boolean;
  working_days: number[];
  is_default?: boolean;
}

interface PolicyState {
  geofence_mode: 'flexible' | 'warn_with_explanation' | 'strict_radius';
  max_gps_accuracy_meters: number;
  allow_ip_whitelist_bypass: boolean;
  require_selfie: boolean;
  enable_night_shift_rule: boolean;
  enable_weekend_shift_rule: boolean;
}

interface ExemptionRuleItem {
  id: string;
  target_type: 'role' | 'department' | 'team' | 'position' | 'user';
  target_id: string;
  target_name: string;
  exempt_checkin: boolean;
  exempt_gps: boolean;
  exempt_selfie: boolean;
  reason: string;
}

interface HolidayItem {
  id: string;
  date: string;
  name: string;
  multiplier: number;
}

const DEFAULT_POLICY: PolicyState = {
  geofence_mode: 'flexible',
  max_gps_accuracy_meters: 100,
  allow_ip_whitelist_bypass: true,
  require_selfie: false,
  enable_night_shift_rule: true,
  enable_weekend_shift_rule: true,
};

const WEEK_DAYS = [
  { key: 1, label: 'T2' },
  { key: 2, label: 'T3' },
  { key: 3, label: 'T4' },
  { key: 4, label: 'T5' },
  { key: 5, label: 'T6' },
  { key: 6, label: 'T7' },
  { key: 0, label: 'CN' },
];

export const AttendancePolicySettingsTab: React.FC = () => {
  const { can } = useEntitlement();
  const canManage = can('attendance', 'manage_config') || can('settings', 'manage_config');

  const [loading, setLoading] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const [policy, setPolicy] = useState<PolicyState>(DEFAULT_POLICY);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [exemptions, setExemptions] = useState<ExemptionRuleItem[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);

  // Org catalogs for Exemption dropdown
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [teams, setTeams] = useState<OrgTeam[]>([]);
  const [positions, setPositions] = useState<OrgPosition[]>([]);
  const [branches, setBranches] = useState<OrgBranch[]>([]);
  const [peers, setPeers] = useState<Array<{ id: string; full_name: string }>>([]);

  // New Shift form
  const [shiftName, setShiftName] = useState('');
  const [shiftStart, setShiftStart] = useState('08:30');
  const [shiftEnd, setShiftEnd] = useState('17:30');
  const [shiftDays, setShiftDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [shiftNightMul, setShiftNightMul] = useState('1.3');
  const [shiftWeekendMul, setShiftWeekendMul] = useState('2.0');

  // New Exemption form
  const [exType, setExType] = useState<ExemptionRuleItem['target_type']>('role');
  const [exTargetId, setExTargetId] = useState('');
  const [exCheckin, setExCheckin] = useState(false);
  const [exGps, setExGps] = useState(true);
  const [exSelfie, setExSelfie] = useState(true);
  const [exReason, setExReason] = useState('');

  // New Holiday form
  const [holDate, setHolDate] = useState('');
  const [holName, setHolName] = useState('');
  const [holMul, setHolMul] = useState('3.0');

  const loadAll = useCallback(async () => {
    try {
      const [shiftRes, bootRes, peerRes, legacySettings, policyApi] = await Promise.all([
        apiRequest<ShiftRecord[]>('/attendance/shifts').catch(() => []),
        apiRequest<Record<string, unknown>>('/org-rbac/bootstrap').catch(() => ({})),
        apiRequest<Array<{ id: string; full_name: string }>>('/users/peers').catch(() => []),
        fetchAPI('get_settings').catch(() => null),
        apiRequest<Partial<PolicyState>>('/attendance/policy').catch(() => null),
      ]);

      setShifts(Array.isArray(shiftRes) ? shiftRes : []);
      const boot = (bootRes || {}) as Record<string, unknown>;
      setRoles(Array.isArray(boot.roles) ? (boot.roles as OrgRole[]) : []);
      setDepartments(Array.isArray(boot.departments) ? (boot.departments as OrgDepartment[]) : []);
      setTeams(Array.isArray(boot.teams) ? (boot.teams as OrgTeam[]) : []);
      setPositions(Array.isArray(boot.positions) ? (boot.positions as OrgPosition[]) : []);
      setBranches(Array.isArray(boot.branches) ? (boot.branches as OrgBranch[]) : []);
      setPeers(Array.isArray(peerRes) ? peerRes : []);

      const legObj =
        legacySettings && typeof legacySettings === 'object'
          ? (legacySettings as Record<string, unknown>)
          : {};
      const legData =
        legObj.data && typeof legObj.data === 'object' ? (legObj.data as Record<string, unknown>) : legObj;
      const raw =
        legData.settings && typeof legData.settings === 'object'
          ? (legData.settings as Record<string, unknown>)
          : legData;
      const storedPolicy = (policyApi || raw.attendance_policy || {}) as Partial<PolicyState>;
      setPolicy({
        geofence_mode:
          storedPolicy.geofence_mode === 'strict_radius' || storedPolicy.geofence_mode === 'warn_with_explanation'
            ? storedPolicy.geofence_mode
            : 'flexible',
        max_gps_accuracy_meters: Number(storedPolicy.max_gps_accuracy_meters || 100),
        allow_ip_whitelist_bypass: storedPolicy.allow_ip_whitelist_bypass !== false,
        require_selfie: Boolean(storedPolicy.require_selfie),
        enable_night_shift_rule: storedPolicy.enable_night_shift_rule !== false,
        enable_weekend_shift_rule: storedPolicy.enable_weekend_shift_rule !== false,
      });

      const exemptionsApi = await apiRequest<{ items?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>(
        '/attendance/exemptions'
      ).catch(() => null);
      const rawExList = Array.isArray(exemptionsApi)
        ? exemptionsApi
        : Array.isArray(exemptionsApi?.items)
          ? exemptionsApi.items
          : Array.isArray(raw.attendance_exemption_rules)
            ? (raw.attendance_exemption_rules as Array<Record<string, unknown>>)
            : [];
      setExemptions(
        rawExList.map((row) => ({
          id: String(row.id || ''),
          target_type: String(row.scope_type || row.target_type || 'user') as ExemptionRuleItem['target_type'],
          target_id: String(row.target_id || ''),
          target_name: String(row.name || row.target_name || row.target_id || ''),
          exempt_checkin: Boolean(row.exempt_checkin),
          exempt_gps: Boolean(row.exempt_gps),
          exempt_selfie: Boolean(row.exempt_selfie),
          reason: String(row.reason || ''),
        }))
      );

      if (Array.isArray((policyApi as Record<string, unknown> | null)?.holiday_schedules_json)) {
        setHolidays(
          (policyApi as Record<string, unknown>).holiday_schedules_json as HolidayItem[]
        );
      } else if (Array.isArray(raw.attendance_holidays)) {
        setHolidays(raw.attendance_holidays as HolidayItem[]);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải cấu hình Chấm công & GPS'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await loadAll();
    })();
    return () => {
      active = false;
    };
  }, [loadAll]);

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      await apiRequest('/attendance/policy', {
        method: 'PUT',
        body: policy,
      });
      toast.success('Đã lưu Chế độ GPS & Chính sách Chấm công');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Chính sách Chấm công'));
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleCreateShift = async () => {
    if (!shiftName.trim()) {
      toast.error('Vui lòng nhập Tên ca làm việc');
      return;
    }
    try {
      const created = await apiRequest<ShiftRecord>('/attendance/shifts', {
        method: 'POST',
        body: {
          name: shiftName.trim(),
          start_time: shiftStart,
          end_time: shiftEnd,
          working_days: shiftDays,
          night_shift_multiplier: Number(shiftNightMul) || 1.3,
          weekend_overtime_multiplier: Number(shiftWeekendMul) || 2.0,
          require_gps: policy.geofence_mode !== 'flexible',
          require_selfie: policy.require_selfie,
        },
      });
      setShifts((prev) => [...prev, created]);
      setShiftName('');
      toast.success(`Đã tạo ca "${created.name}"`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo ca làm việc'));
    }
  };

  const handleDeleteShift = async (id: string) => {
    const prev = shifts;
    setShifts((list) => list.filter((s) => s.id !== id));
    try {
      await apiRequest(`/attendance/shifts/${id}`, { method: 'DELETE' });
      toast.success('Đã xóa ca làm việc');
    } catch (err) {
      setShifts(prev);
      toast.error(getErrorMessage(err, 'Không thể xóa ca làm việc'));
    }
  };

  const resolveExemptionTargetOptions = () => {
    if (exType === 'role') return roles.map((r) => ({ id: r.id, label: r.name }));
    if (exType === 'department') return departments.map((d) => ({ id: d.id, label: d.name }));
    if (exType === 'team') return teams.map((t) => ({ id: t.id, label: t.name }));
    if (exType === 'position') return positions.map((p) => ({ id: p.id, label: p.name }));
    return peers.map((u) => ({ id: u.id, label: u.full_name }));
  };

  const handleAddExemption = async () => {
    const opts = resolveExemptionTargetOptions();
    const target = opts.find((o) => o.id === exTargetId);
    if (!target) {
      toast.error('Vui lòng chọn đối tượng miễn trừ');
      return;
    }
    const item: ExemptionRuleItem = {
      id: `ex_${Date.now()}`,
      target_type: exType,
      target_id: target.id,
      target_name: target.label,
      exempt_checkin: exCheckin,
      exempt_gps: exGps,
      exempt_selfie: exSelfie,
      reason: exReason.trim() || 'Chính sách linh hoạt theo vai trò/vị trí',
    };
    const prev = exemptions;
    const next = [...exemptions, item];
    setExemptions(next);
    try {
      const created = await apiRequest<Record<string, unknown>>('/attendance/exemptions', {
        method: 'POST',
        body: {
          name: target.label,
          scope_type: exType,
          target_id: target.id,
          exempt_checkin: exCheckin,
          exempt_gps: exGps,
          exempt_selfie: exSelfie,
          reason: item.reason,
        },
      });
      setExemptions((prevList) =>
        prevList.map((x) => (x.id === item.id ? { ...x, id: String(created.id || x.id) } : x))
      );
      setExTargetId('');
      setExReason('');
      toast.success(`Đã thêm miễn trừ chấm công cho ${target.label}`);
    } catch (err) {
      setExemptions(prev);
      toast.error(getErrorMessage(err, 'Không thể lưu quy tắc miễn trừ chấm công'));
    }
  };

  const handleRemoveExemption = async (id: string) => {
    const prev = exemptions;
    const next = exemptions.filter((e) => e.id !== id);
    setExemptions(next);
    try {
      await apiRequest(`/attendance/exemptions/${id}`, { method: 'DELETE' });
      toast.success('Đã xóa quy tắc miễn trừ');
    } catch (err) {
      setExemptions(prev);
      toast.error(getErrorMessage(err, 'Không thể xóa quy tắc miễn trừ'));
    }
  };

  const persistHolidays = async (next: HolidayItem[]) => {
    const prev = holidays;
    setHolidays(next);
    try {
      await apiRequest('/attendance/policy', {
        method: 'PUT',
        body: { holiday_schedules_json: next },
      });
      toast.success('Đã cập nhật Lịch Nghỉ lễ');
    } catch (err) {
      setHolidays(prev);
      toast.error(getErrorMessage(err, 'Không thể lưu Lịch Nghỉ lễ'));
    }
  };

  const handleAddHoliday = async () => {
    if (!holDate || !holName.trim()) {
      toast.error('Vui lòng chọn Ngày và nhập Tên ngày lễ');
      return;
    }
    await persistHolidays([
      ...holidays,
      { id: `hol_${Date.now()}`, date: holDate, name: holName.trim(), multiplier: Number(holMul) || 3 },
    ]);
    setHolDate('');
    setHolName('');
  };

  if (loading) return <HrmTimesheetSkeleton />;

  return (
    <div className="space-y-6">
      {/* 1. Geofence Compliance Mode */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E40FF] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chính sách Định vị GPS & Tuân thủ Địa điểm (Geofence Mode)
              </h3>
              <p className="text-xs text-slate-500">
                Mặc định Chế độ Thoải mái (Flexible) cho nhân viên mới không bị khóa GPS; bật Strict khi cần kiểm soát bán kính nghiêm ngặt.
              </p>
            </div>
          </div>
          {canManage && (
            <button
              type="button"
              disabled={savingPolicy}
              onClick={() => void handleSavePolicy()}
              className="h-11 px-4 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {savingPolicy ? 'Đang lưu...' : 'Lưu Chính sách GPS'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              key: 'flexible' as const,
              title: 'Chế độ Thoải mái (Flexible • Mặc định)',
              desc: 'Không bắt buộc GPS khi Check-in/out; vẫn ghi nhận vị trí thực nếu trình duyệt cho phép.',
            },
            {
              key: 'warn_with_explanation' as const,
              title: 'Cảnh báo & Giải trình ngoài vùng',
              desc: 'Cho phép chấm công ngoài bán kính Chi nhánh nhưng yêu cầu nhập lý do giải trình để HR duyệt.',
            },
            {
              key: 'strict_radius' as const,
              title: 'Khóa nghiêm ngặt theo Bán kính (Strict)',
              desc: 'Bắt buộc GPS chính xác trong bán kính chi nhánh (hoặc IP Wi-Fi văn phòng / Miễn trừ).',
            },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setPolicy((p) => ({ ...p, geofence_mode: opt.key }))}
              className={`text-left p-4 rounded-xl border transition ${
                policy.geofence_mode === opt.key
                  ? 'border-[#1E40FF] bg-blue-50/70 ring-1 ring-[#1E40FF]'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-sm text-slate-900">{opt.title}</div>
              <div className="text-xs text-slate-500 mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Sai số GPS tối đa cho phép (mét)
            </label>
            <input
              type="number"
              min={15}
              max={1000}
              value={policy.max_gps_accuracy_meters}
              onChange={(e) => setPolicy((p) => ({ ...p, max_gps_accuracy_meters: Number(e.target.value) || 100 }))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm tabular-nums"
            />
          </div>
          <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={policy.allow_ip_whitelist_bypass}
              onChange={(e) => setPolicy((p) => ({ ...p, allow_ip_whitelist_bypass: e.target.checked }))}
              className="rounded border-slate-300 text-[#1E40FF]"
            />
            Bỏ qua GPS nếu đúng Wi-Fi/IP chi nhánh ({branches.reduce((acc, b) => acc + (b.branch_ip_whitelist?.length || 0), 0)} IP)
          </label>
          <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={policy.enable_night_shift_rule}
              onChange={(e) => setPolicy((p) => ({ ...p, enable_night_shift_rule: e.target.checked }))}
              className="rounded border-slate-300 text-[#1E40FF]"
            />
            Tính phụ cấp Ca đêm (Night Shift)
          </label>
          <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={policy.enable_weekend_shift_rule}
              onChange={(e) => setPolicy((p) => ({ ...p, enable_weekend_shift_rule: e.target.checked }))}
              className="rounded border-slate-300 text-[#1E40FF]"
            />
            Tính tăng ca Cuối tuần & Lễ
          </label>
        </div>
      </div>

      {/* 2. Attendance Exemption Matrix ("Ai chấm / Ai không") */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <Shield className="w-5 h-5 text-[#1E40FF]" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Ma trận Miễn trừ Chấm công (&quot;Ai chấm / Ai không&quot;)
            </h4>
            <p className="text-xs text-slate-500">
              Miễn chấm công tự động, miễn kiểm tra GPS hoặc miễn Selfie theo Vai trò, Phòng ban, Nhóm, Chức danh hoặc Cá nhân.
            </p>
          </div>
        </div>

        {canManage && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <select
                value={exType}
                onChange={(e) => {
                  setExType(e.target.value as ExemptionRuleItem['target_type']);
                  setExTargetId('');
                }}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="role">Theo Vai trò (Role)</option>
                <option value="department">Theo Phòng ban (Department)</option>
                <option value="team">Theo Tổ / Nhóm (Team)</option>
                <option value="position">Theo Chức danh (Position)</option>
                <option value="user">Theo Nhân sự (User)</option>
              </select>
              <select
                value={exTargetId}
                onChange={(e) => setExTargetId(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="">-- Chọn đối tượng --</option>
                {resolveExemptionTargetOptions().map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                value={exReason}
                onChange={(e) => setExReason(e.target.value)}
                placeholder="Ghi chú lý do miễn trừ..."
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={exCheckin} onChange={(e) => setExCheckin(e.target.checked)} />
                  Miễn Check-in (Tự động tính đủ công)
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={exGps} onChange={(e) => setExGps(e.target.checked)} />
                  Miễn khóa GPS (Đi thị trường / Remote)
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={exSelfie} onChange={(e) => setExSelfie(e.target.checked)} />
                  Miễn Selfie
                </label>
              </div>
              <button
                type="button"
                onClick={() => void handleAddExemption()}
                className="h-10 px-4 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Miễn trừ
              </button>
            </div>
          </div>
        )}

        {exemptions.length === 0 ? (
          <div className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-xl">
            Chưa có quy tắc miễn trừ chấm công nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {exemptions.map((ex) => (
              <div
                key={ex.id}
                className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    [{ex.target_type.toUpperCase()}] {ex.target_name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {ex.exempt_checkin ? '✓ Miễn Check-in' : ''} {ex.exempt_gps ? '✓ Miễn GPS' : ''}{' '}
                    {ex.exempt_selfie ? '✓ Miễn Selfie' : ''} • {ex.reason}
                  </div>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => void handleRemoveExemption(ex.id)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Shifts Builder & Holiday Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-5 h-5 text-[#1E40FF]" />
            <h4 className="text-sm font-bold text-slate-900">Ca trực & Hệ số Ca đêm / Cuối tuần</h4>
          </div>
          {canManage && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  placeholder="Tên ca (VD: Hành chính)"
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                />
                <input
                  type="time"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                />
                <input
                  type="time"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {WEEK_DAYS.map((wd) => {
                    const active = shiftDays.includes(wd.key);
                    return (
                      <button
                        key={wd.key}
                        type="button"
                        onClick={() =>
                          setShiftDays((prev) =>
                            active ? prev.filter((k) => k !== wd.key) : [...prev, wd.key]
                          )
                        }
                        className={`w-8 h-8 rounded-lg text-xs font-bold ${
                          active ? 'bg-[#1E40FF] text-white' : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        {wd.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span>Đêm×</span>
                  <input
                    type="number"
                    step="0.1"
                    value={shiftNightMul}
                    onChange={(e) => setShiftNightMul(e.target.value)}
                    className="w-14 h-9 px-2 rounded-lg border border-slate-200 bg-white"
                  />
                  <span>CT×</span>
                  <input
                    type="number"
                    step="0.1"
                    value={shiftWeekendMul}
                    onChange={(e) => setShiftWeekendMul(e.target.value)}
                    className="w-14 h-9 px-2 rounded-lg border border-slate-200 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCreateShift()}
                    className="h-9 px-3 rounded-xl bg-[#1E40FF] text-white font-semibold"
                  >
                    + Ca
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {shifts.map((sh) => (
              <div key={sh.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {sh.name} ({sh.start_time} - {sh.end_time})
                  </div>
                  <div className="text-xs text-slate-500">
                    Đêm ×{sh.night_shift_multiplier} • Cuối tuần ×{sh.weekend_overtime_multiplier}
                  </div>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteShift(sh.id)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-5 h-5 text-[#1E40FF]" />
            <h4 className="text-sm font-bold text-slate-900">Lịch Nghỉ lễ Doanh nghiệp (Holiday Calendar)</h4>
          </div>
          {canManage && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="date"
                value={holDate}
                onChange={(e) => setHolDate(e.target.value)}
                className="h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-sm"
              />
              <input
                value={holName}
                onChange={(e) => setHolName(e.target.value)}
                placeholder="Tên ngày lễ (VD: Quốc khánh 2/9)"
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm sm:col-span-2"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  value={holMul}
                  onChange={(e) => setHolMul(e.target.value)}
                  className="w-16 h-10 px-2 rounded-xl border border-slate-200 bg-white text-sm"
                  title="Hệ số lương OT lễ"
                />
                <button
                  type="button"
                  onClick={() => void handleAddHoliday()}
                  className="flex-1 h-10 px-3 rounded-xl bg-[#1E40FF] text-white text-xs font-semibold"
                >
                  + Lễ
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {holidays.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-xl">
                Chưa có ngày nghỉ lễ tùy chỉnh.
              </div>
            ) : (
              holidays.map((h) => (
                <div key={h.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{h.name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {h.date} • OT ×{h.multiplier}
                    </div>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => void persistHolidays(holidays.filter((x) => x.id !== h.id))}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
