import React from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  PenTool,
  QrCode,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import {
  buildVietQrPreviewUrl,
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  VIETNAM_BANK_OPTIONS,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  type HrEmployeeDto,
  type HrmOverviewDto,
  type ShiftScheduleDayConfig,
  type WeeklyShiftScheduleMap,
} from './hrmTypes';

export interface EmployeeDossierFormState {
  employee_code: string;
  full_name: string;
  user_id: string;
  work_email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  nationality: string;
  id_card_number: string;
  tax_code: string;
  dependents_count: string;
  social_insurance_number: string;
  insurance_enrolled: boolean;
  is_resident: boolean;
  union_member: boolean;
  address: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  bank_branch: string;
  branch_id: string;
  department_id: string;
  team_id: string;
  position_id: string;
  manager_user_id: string;
  employment_status: HrEmployeeDto['employment_status'];
  employment_type: HrEmployeeDto['employment_type'];
  join_date: string;
  annual_leave_quota: string;
  annual_leave_used: string;
  compensatory_leave_balance: string;
  base_salary_vnd: string;
  insurance_salary_vnd: string;
  meal_allowance_vnd: string;
  responsibility_allowance_vnd: string;
  travel_allowance_vnd: string;
  phone_allowance_vnd: string;
  digital_signature_data_url: string;
  shift_schedule: WeeklyShiftScheduleMap;
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 0.85rem',
  borderRadius: 12,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: '0.85rem',
  outline: 'none',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '0.76rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
};

export const DossierProfileLegalTab: React.FC<{
  form: EmployeeDossierFormState;
  onPatch: (patch: Partial<EmployeeDossierFormState>) => void;
  org: HrmOverviewDto['org'] | undefined;
  readOnly: boolean;
  isCreateMode: boolean;
  onOpenSignaturePad: () => void;
}> = ({ form, onPatch, org, readOnly, isCreateMode, onOpenSignaturePad }) => {
  const vietQrUrl = buildVietQrPreviewUrl({
    bankName: form.bank_name,
    accountNumber: form.bank_account_number,
    accountHolder: form.bank_account_holder || form.full_name,
    addInfo: `LUONG ${form.employee_code || form.full_name}`.trim(),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <Card title="Thông tin Định danh & Pháp lý Cá nhân" padding="1.05rem 1.2rem">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
          <div>
            <label style={LABEL_STYLE}>Mã nhân sự</label>
            <input
              type="text"
              disabled={readOnly}
              value={form.employee_code}
              onChange={(e) => onPatch({ employee_code: e.target.value })}
              placeholder={isCreateMode ? 'Tự động sinh nếu để trống' : 'NV-001'}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Họ và tên đầy đủ *</label>
            <input
              type="text"
              disabled={readOnly}
              value={form.full_name}
              onChange={(e) => onPatch({ full_name: e.target.value })}
              placeholder="Nguyễn Văn A"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Liên kết Tài khoản Workspace</label>
            <select
              disabled={readOnly}
              value={form.user_id}
              onChange={(e) => onPatch({ user_id: e.target.value })}
              style={INPUT_STYLE}
            >
              <option value="">-- Chưa liên kết tài khoản --</option>
              {(org?.users || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Email công việc</label>
            <input
              type="email"
              disabled={readOnly}
              value={form.work_email}
              onChange={(e) => onPatch({ work_email: e.target.value })}
              placeholder="ten.nhanvien@congty.vn"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Số điện thoại liên hệ</label>
            <input
              type="text"
              disabled={readOnly}
              value={form.phone}
              onChange={(e) => onPatch({ phone: e.target.value })}
              placeholder="090xxxxxxx"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Giới tính & Ngày sinh</label>
            <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 6 }}>
              <select
                disabled={readOnly}
                value={form.gender}
                onChange={(e) => onPatch({ gender: e.target.value })}
                style={INPUT_STYLE}
              >
                <option value="">-- Chọn --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
              <input
                type="date"
                disabled={readOnly}
                value={form.date_of_birth}
                onChange={(e) => onPatch({ date_of_birth: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
          </div>
          <div>
            <label style={LABEL_STYLE}>Số CCCD / Hộ chiếu</label>
            <input
              type="text"
              disabled={readOnly}
              value={form.id_card_number}
              onChange={(e) => onPatch({ id_card_number: e.target.value })}
              placeholder="0790xxxxxxxx"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Mã số thuế TNCN</label>
            <input
              type="text"
              disabled={readOnly}
              value={form.tax_code}
              onChange={(e) => onPatch({ tax_code: e.target.value })}
              placeholder="8xxxxxxxxx"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Số người phụ thuộc (Giảm trừ gia cảnh)</label>
            <input
              type="number"
              min={0}
              max={20}
              disabled={readOnly}
              value={form.dependents_count}
              onChange={(e) => onPatch({ dependents_count: e.target.value })}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Mã số sổ BHXH</label>
            <input
              type="text"
              disabled={readOnly}
              value={form.social_insurance_number}
              onChange={(e) => onPatch({ social_insurance_number: e.target.value })}
              placeholder="79xxxxxxxx"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Quốc tịch</label>
            <input
              type="text"
              disabled={readOnly}
              value={form.nationality}
              onChange={(e) => onPatch({ nationality: e.target.value })}
              placeholder="Việt Nam"
              style={INPUT_STYLE}
            />
          </div>
        </div>

        <div style={{ marginTop: '0.85rem' }}>
          <label style={LABEL_STYLE}>Địa chỉ thường trú / Liên hệ hiện tại</label>
          <input
            type="text"
            disabled={readOnly}
            value={form.address}
            onChange={(e) => onPatch({ address: e.target.value })}
            placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố..."
            style={INPUT_STYLE}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: '0.9rem' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, cursor: readOnly ? 'default' : 'pointer' }}>
            <input
              type="checkbox"
              disabled={readOnly}
              checked={form.is_resident}
              onChange={(e) => onPatch({ is_resident: e.target.checked })}
            />
            Cá nhân cư trú (Thuế lũy tiến từng phần)
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, cursor: readOnly ? 'default' : 'pointer' }}>
            <input
              type="checkbox"
              disabled={readOnly}
              checked={form.insurance_enrolled}
              onChange={(e) => onPatch({ insurance_enrolled: e.target.checked })}
            />
            Tham gia BHXH / BHYT / BHTN bắt buộc
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, cursor: readOnly ? 'default' : 'pointer' }}>
            <input
              type="checkbox"
              disabled={readOnly}
              checked={form.union_member}
              onChange={(e) => onPatch({ union_member: e.target.checked })}
            />
            Đoàn viên Công đoàn cơ sở
          </label>
        </div>
      </Card>

      <Card
        title="Tài khoản Ngân hàng Nhận Lương & Mã VietQR"
        subtitle="Tự động đồng bộ vào Phiếu lương UNC và Phê duyệt tạm ứng / hoàn ứng"
        padding="1.05rem 1.2rem"
      >
        <div style={{ display: 'grid', gridTemplateColumns: vietQrUrl ? 'minmax(0, 1.5fr) 210px' : '1fr', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '0.85rem' }}>
            <div>
              <label style={LABEL_STYLE}>Ngân hàng thụ hưởng</label>
              <select
                disabled={readOnly}
                value={form.bank_name}
                onChange={(e) => onPatch({ bank_name: e.target.value })}
                style={INPUT_STYLE}
              >
                <option value="">-- Chọn ngân hàng --</option>
                {VIETNAM_BANK_OPTIONS.map((bk) => (
                  <option key={bk.code} value={bk.name}>
                    {bk.name} ({bk.code})
                  </option>
                ))}
                {form.bank_name &&
                  !VIETNAM_BANK_OPTIONS.some((b) => b.name === form.bank_name) && (
                    <option value={form.bank_name}>{form.bank_name}</option>
                  )}
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Số tài khoản ngân hàng</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.bank_account_number}
                  onChange={(e) => onPatch({ bank_account_number: e.target.value })}
                  placeholder="Nhập số tài khoản..."
                  style={INPUT_STYLE}
                />
                {form.bank_account_number && (
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(form.bank_account_number);
                      toast.success('Đã sao chép số tài khoản!');
                    }}
                    className="btn secondary"
                    title="Sao chép STK"
                    style={{ height: 44, padding: '0 12px', flexShrink: 0 }}
                  >
                    <Copy size={15} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label style={LABEL_STYLE}>Chủ tài khoản (IN HOA KHÔNG DẤU)</label>
              <input
                type="text"
                disabled={readOnly}
                value={form.bank_account_holder}
                onChange={(e) => onPatch({ bank_account_holder: e.target.value.toUpperCase() })}
                placeholder="NGUYEN VAN A"
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Chi nhánh mở tài khoản</label>
              <input
                type="text"
                disabled={readOnly}
                value={form.bank_branch}
                onChange={(e) => onPatch({ bank_branch: e.target.value })}
                placeholder="Chi nhánh TP.HCM / Hà Nội..."
                style={INPUT_STYLE}
              />
            </div>
          </div>

          {vietQrUrl ? (
            <div
              style={{
                padding: '0.85rem',
                borderRadius: 16,
                border: '1px solid #DBEAFE',
                background: '#F8FAFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                textAlign: 'center',
              }}
            >
              <Badge tone="primary" icon={<QrCode size={11} />}>
                VietQR Napas 24/7
              </Badge>
              <img
                src={vietQrUrl}
                alt="VietQR Nhân sự"
                style={{ width: 150, height: 150, objectFit: 'contain', borderRadius: 10, background: '#FFFFFF', padding: 4 }}
              />
              <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                {form.bank_name} • {form.bank_account_number}
              </span>
            </div>
          ) : (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 14,
                background: '#F8F9FA',
                border: '1px dashed #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.8rem',
                color: '#64748B',
              }}
            >
              <CreditCard size={18} color="#1E40FF" />
              Chọn ngân hàng và nhập số tài khoản để hiển thị mã VietQR chuyển khoản tức thì.
            </div>
          )}
        </div>
      </Card>

      {!isCreateMode && (
        <Card
          title="Chữ ký số Mẫu của Nhân sự"
          actions={
            <button
              type="button"
              onClick={onOpenSignaturePad}
              className="btn secondary"
              style={{ height: 38, color: '#1E40FF', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <PenTool size={14} /> {form.digital_signature_data_url ? 'Ký cập nhật mẫu mới' : 'Đăng ký chữ ký mẫu'}
            </button>
          }
          padding="0.95rem 1.2rem"
        >
          {form.digital_signature_data_url ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <img
                src={form.digital_signature_data_url}
                alt="Chữ ký mẫu nhân sự"
                style={{
                  height: 64,
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  padding: '6px 14px',
                }}
              />
              <Badge tone="success" icon={<CheckCircle2 size={12} />}>
                Đã xác thực chữ ký điện tử nội bộ
              </Badge>
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
              Chưa đăng ký chữ ký mẫu. Bấm nút <strong>Đăng ký chữ ký mẫu</strong> để ký trực tiếp trên Canvas HTML5.
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export const DossierOrgScheduleTab: React.FC<{
  form: EmployeeDossierFormState;
  onPatch: (patch: Partial<EmployeeDossierFormState>) => void;
  org: HrmOverviewDto['org'] | undefined;
  readOnly: boolean;
}> = ({ form, onPatch, org, readOnly }) => {
  const updateDaySchedule = (dayKey: string, patch: Partial<ShiftScheduleDayConfig>) => {
    const curDay = form.shift_schedule[dayKey];
    if (!curDay) return;
    onPatch({
      shift_schedule: {
        ...form.shift_schedule,
        [dayKey]: { ...curDay, ...patch },
      },
    });
  };

  const activeDaysCount = WEEKDAY_ORDER.filter((k) => form.shift_schedule[k]?.active).length;
  const remainingLeave = Math.max(0, Number(form.annual_leave_quota || 0) - Number(form.annual_leave_used || 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <Card
        title="Định vị Sơ đồ Tổ chức & Quỹ Phép Năm"
        actions={
          <Badge tone="info" icon={<ShieldCheck size={12} />}>
            Phép năm còn lại: {remainingLeave}/{form.annual_leave_quota || 12} ngày
          </Badge>
        }
        padding="1.05rem 1.2rem"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
          <div>
            <label style={LABEL_STYLE}>
              <Building2 size={13} style={{ display: 'inline', marginRight: 4 }} />
              Chi nhánh / Pháp nhân
            </label>
            <select
              disabled={readOnly}
              value={form.branch_id}
              onChange={(e) => onPatch({ branch_id: e.target.value })}
              style={INPUT_STYLE}
            >
              <option value="">-- Trụ sở chính / Tất cả --</option>
              {(org?.branches || []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Phòng ban chuyên môn</label>
            <select
              disabled={readOnly}
              value={form.department_id}
              onChange={(e) => onPatch({ department_id: e.target.value })}
              style={INPUT_STYLE}
            >
              <option value="">-- Chưa phân phòng ban --</option>
              {(org?.departments || []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Đội / Nhóm (Team)</label>
            <select
              disabled={readOnly}
              value={form.team_id}
              onChange={(e) => onPatch({ team_id: e.target.value })}
              style={INPUT_STYLE}
            >
              <option value="">-- Không thuộc nhóm con --</option>
              {(org?.teams || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Chức danh (Position)</label>
            <select
              disabled={readOnly}
              value={form.position_id}
              onChange={(e) => onPatch({ position_id: e.target.value })}
              style={INPUT_STYLE}
            >
              <option value="">-- Chọn chức danh --</option>
              {(org?.positions || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>
              <UserCheck size={13} style={{ display: 'inline', marginRight: 4 }} />
              Quản lý trực tiếp (Direct Manager)
            </label>
            <select
              disabled={readOnly}
              value={form.manager_user_id}
              onChange={(e) => onPatch({ manager_user_id: e.target.value })}
              style={INPUT_STYLE}
            >
              <option value="">-- Báo cáo trực tiếp Ban Giám đốc --</option>
              {(org?.users || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Trạng thái nhân sự</label>
            <select
              disabled={readOnly}
              value={form.employment_status}
              onChange={(e) =>
                onPatch({ employment_status: e.target.value as HrEmployeeDto['employment_status'] })
              }
              style={INPUT_STYLE}
            >
              {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Hình thức làm việc</label>
            <select
              disabled={readOnly}
              value={form.employment_type}
              onChange={(e) =>
                onPatch({ employment_type: e.target.value as HrEmployeeDto['employment_type'] })
              }
              style={INPUT_STYLE}
            >
              {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Ngày gia nhập chính thức</label>
            <input
              type="date"
              disabled={readOnly}
              value={form.join_date}
              onChange={(e) => onPatch({ join_date: e.target.value })}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Tổng quỹ phép năm / Đã nghỉ</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <input
                type="number"
                min={0}
                step={0.5}
                disabled={readOnly}
                value={form.annual_leave_quota}
                onChange={(e) => onPatch({ annual_leave_quota: e.target.value })}
                title="Quỹ phép năm"
                style={INPUT_STYLE}
              />
              <input
                type="number"
                min={0}
                step={0.5}
                disabled={readOnly}
                value={form.annual_leave_used}
                onChange={(e) => onPatch({ annual_leave_used: e.target.value })}
                title="Số ngày đã nghỉ"
                style={INPUT_STYLE}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="Lịch Ca Làm Việc Chuẩn Trong Tuần (Thứ 2 → Chủ Nhật)"
        subtitle="Áp dụng kiểm tra khung giờ vào/ra ca, nghỉ trưa và tính công tự động"
        actions={
          <Badge tone="primary" icon={<Clock size={12} />}>
            {activeDaysCount}/7 ngày làm việc
          </Badge>
        }
        padding="1rem 1.2rem"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {WEEKDAY_ORDER.map((dayKey) => {
            const row = form.shift_schedule[dayKey];
            if (!row) return null;
            return (
              <div
                key={dayKey}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px minmax(0, 1fr)',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0.65rem 0.9rem',
                  borderRadius: 12,
                  background: row.active ? '#F8FAFF' : '#F8F9FA',
                  border: row.active ? '1px solid #DBEAFE' : '1px solid #E2E8F0',
                }}
              >
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    color: row.active ? '#1E40FF' : '#64748B',
                    cursor: readOnly ? 'default' : 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={row.active}
                    onChange={(e) => updateDaySchedule(dayKey, { active: e.target.checked })}
                  />
                  {WEEKDAY_LABELS[dayKey]}
                </label>

                {row.active ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600 }}>Ca sáng:</span>
                    <input
                      type="time"
                      disabled={readOnly}
                      value={row.morning_start}
                      onChange={(e) => updateDaySchedule(dayKey, { morning_start: e.target.value })}
                      style={{ ...INPUT_STYLE, width: 112, height: 38, padding: '0 0.55rem' }}
                    />
                    <span style={{ color: '#94A3B8' }}>→</span>
                    <input
                      type="time"
                      disabled={readOnly}
                      value={row.morning_end}
                      onChange={(e) => updateDaySchedule(dayKey, { morning_end: e.target.value })}
                      style={{ ...INPUT_STYLE, width: 112, height: 38, padding: '0 0.55rem' }}
                    />
                    <span style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600, marginLeft: 8 }}>
                      Ca chiều:
                    </span>
                    <input
                      type="time"
                      disabled={readOnly}
                      value={row.afternoon_start}
                      onChange={(e) => updateDaySchedule(dayKey, { afternoon_start: e.target.value })}
                      style={{ ...INPUT_STYLE, width: 112, height: 38, padding: '0 0.55rem' }}
                    />
                    <span style={{ color: '#94A3B8' }}>→</span>
                    <input
                      type="time"
                      disabled={readOnly}
                      value={row.afternoon_end}
                      onChange={(e) => updateDaySchedule(dayKey, { afternoon_end: e.target.value })}
                      style={{ ...INPUT_STYLE, width: 112, height: 38, padding: '0 0.55rem' }}
                    />
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic' }}>
                    Ngày nghỉ định kỳ cuối tuần
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
