import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Camera,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileSignature,
  FolderTree,
  Laptop,
  Lock,
  PenTool,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Card,
  EmptyState,
  FormCard,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { HrmTimesheetSkeleton } from '../../components/ui/Skeleton';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import {
  CONTRACT_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  type BookingAppointmentDto,
  type BookingLinkDto,
  type HrAssetDto,
  type HrContractDto,
  type HrEmployeeDto,
  type HrmOverviewDto,
} from './hrmTypes';
import {
  AssetHandoverModal,
  BookingLinkCreateModal,
  ContractCreateModal,
  PublicBookingInteractivePreviewModal,
  SignaturePadModal,
} from './HrmModals';
import { AccountDetailDrawer } from './AccountDetailDrawer';
import { SmartCheckInModal } from './SmartCheckInModal';
import { OrgChartTreeView } from './OrgChartTreeView';

type HrmTabKey = 'org_chart' | 'employees' | 'contracts' | 'assets' | 'booking';

export const ErpHrmWave2Entry: React.FC = () => {
  const { token, tenantSlug, companyName } = useAuth();
  const { can, scope, packageMeta } = useEntitlement();

  const canCreate = can('erp_hrm_org', 'create');
  const canEdit = can('erp_hrm_org', 'edit');
  const activeScope = scope('erp_hrm_org');

  const [activeTab, setActiveTab] = useState<HrmTabKey>('employees');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<HrmOverviewDto | null>(null);
  const [employees, setEmployees] = useState<HrEmployeeDto[]>([]);
  const [contracts, setContracts] = useState<HrContractDto[]>([]);
  const [assets, setAssets] = useState<HrAssetDto[]>([]);
  const [bookingLinks, setBookingLinks] = useState<BookingLinkDto[]>([]);
  const [appointments, setAppointments] = useState<BookingAppointmentDto[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Slide-over 360° Drawer & Modals
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEmployee, setDrawerEmployee] = useState<HrEmployeeDto | null>(null);
  const [smartCheckInOpen, setSmartCheckInOpen] = useState(false);

  const [sigTarget, setSigTarget] = useState<
    | { kind: 'employee'; id: string; title: string }
    | { kind: 'contract'; id: string; title: string }
    | null
  >(null);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [previewBookingSlug, setPreviewBookingSlug] = useState<string | null>(null);

  const loadAllHrm = useCallback(async () => {
    try {
      const [ovRes, empRes, ctRes, astRes, blRes, apRes] = await Promise.all([
        apiRequest<HrmOverviewDto>('/hrm/overview', { token, tenantSlug }).catch(() => null),
        apiRequest<HrEmployeeDto[]>('/hrm/employees', { token, tenantSlug }).catch(() => []),
        apiRequest<HrContractDto[]>('/hrm/contracts', { token, tenantSlug }).catch(() => []),
        apiRequest<HrAssetDto[]>('/hrm/assets', { token, tenantSlug }).catch(() => []),
        apiRequest<BookingLinkDto[]>('/hrm/booking-links', { token, tenantSlug }).catch(() => []),
        apiRequest<BookingAppointmentDto[]>('/hrm/booking-appointments', { token, tenantSlug }).catch(() => []),
      ]);
      if (ovRes) setOverview(ovRes);
      setEmployees(Array.isArray(empRes) ? empRes : []);
      setContracts(Array.isArray(ctRes) ? ctRes : []);
      setAssets(Array.isArray(astRes) ? astRes : []);
      setBookingLinks(Array.isArray(blRes) ? blRes : []);
      setAppointments(Array.isArray(apRes) ? apRes : []);
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

  useEffect(() => {
    void loadAllHrm();
  }, [loadAllHrm]);

  const openEmployeeDrawer = useCallback((emp: HrEmployeeDto | null) => {
    setDrawerEmployee(emp);
    setDrawerOpen(true);
  }, []);

  const handleSyncWorkspaceUsers = async () => {
    try {
      const res = await apiRequest<{ synced_new_profiles: number }>('/hrm/employees/sync-users', {
        method: 'POST',
        token,
        tenantSlug,
      });
      toast.success(`Đã đồng bộ ${res.synced_new_profiles} tài khoản sang Hồ sơ Nhân sự 360°!`);
      await loadAllHrm();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đồng bộ danh sách tài khoản.'));
    }
  };

  const handleSaveDigitalSignature = async (dataUrl: string) => {
    if (!sigTarget) return;
    if (sigTarget.kind === 'employee') {
      await apiRequest(`/hrm/employees/${sigTarget.id}/signature`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { digital_signature_data_url: dataUrl },
      });
      toast.success('Đã lưu chữ ký số vào Hồ sơ Nhân sự!');
    } else {
      await apiRequest(`/hrm/contracts/${sigTarget.id}/sign`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { party: 'employee', signature_data_url: dataUrl },
      });
      toast.success('Đã ký số Hợp đồng Lao động thành công!');
    }
    await loadAllHrm();
  };

  const handleReturnAsset = useCallback(
    async (assetId: string) => {
      try {
        await apiRequest(`/hrm/assets/${assetId}`, {
          method: 'PATCH',
          token,
          tenantSlug,
          body: { status: 'returned' },
        });
        toast.success('Đã xác nhận thu hồi tài sản bàn giao!');
        await loadAllHrm();
      } catch (err) {
        toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái tài sản.'));
      }
    },
    [token, tenantSlug, loadAllHrm]
  );

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (deptFilter !== 'all' && e.department_id !== deptFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${e.employee_code} ${e.full_name} ${e.work_email || ''} ${e.phone || ''} ${e.department_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [employees, deptFilter, searchQuery]);

  const employeeColumns = useMemo<ReadonlyArray<TableColumn<HrEmployeeDto>>>(
    () => [
      {
        key: 'emp',
        header: 'Nhân sự 360°',
        render: (row) => (
          <div>
            <div style={{ fontWeight: 800, color: '#0F172A' }}>{row.full_name}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
              <span style={{ color: '#1E40FF', fontWeight: 700 }}>{row.employee_code}</span> •{' '}
              {row.work_email || row.phone || 'Chưa cập nhật liên hệ'}
            </div>
          </div>
        ),
      },
      {
        key: 'org',
        header: 'Phòng ban & Chi nhánh',
        render: (row) => (
          <div>
            <div style={{ fontWeight: 700 }}>{row.department_name || 'Chưa phân phòng'}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {row.branch_name || 'Trụ sở chính'}
              {row.position_name ? ` • ${row.position_name}` : ''}
            </div>
          </div>
        ),
      },
      {
        key: 'salary',
        header: 'Lương cơ bản',
        numeric: true,
        render: (row) =>
          row.salary_masked ? (
            <Badge tone="neutral">Bảo mật RBAC</Badge>
          ) : (
            <span style={{ fontWeight: 800 }}>{formatVnd(row.base_salary_vnd)}</span>
          ),
      },
      {
        key: 'leave',
        header: 'Quỹ phép năm',
        align: 'center',
        render: (row) => (
          <Badge tone="info">
            Còn {Math.max(0, row.annual_leave_quota - row.annual_leave_used)}/{row.annual_leave_quota} ngày
          </Badge>
        ),
      },
      {
        key: 'sig',
        header: 'Chữ ký số',
        align: 'center',
        render: (row) =>
          row.digital_signature_data_url ? (
            <Badge tone="success" icon={<CheckCircle2 size={11} />}>
              Đã đăng ký
            </Badge>
          ) : (
            <Badge tone="neutral">Chưa ký mẫu</Badge>
          ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        render: (row) => (
          <Badge
            tone={
              row.employment_status === 'active'
                ? 'success'
                : row.employment_status === 'probation'
                  ? 'warning'
                  : 'neutral'
            }
          >
            {EMPLOYMENT_STATUS_LABELS[row.employment_status] || row.employment_status}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Thao tác',
        align: 'right',
        render: (row) => (
          <div style={{ display: 'inline-flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSigTarget({ kind: 'employee', id: row.id, title: row.full_name })}
              className="btn secondary"
              style={{ height: 34, padding: '0 10px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <PenTool size={13} color="#1E40FF" /> Ký số
            </button>
            <button
              type="button"
              onClick={() => openEmployeeDrawer(row)}
              className="btn secondary"
              style={{ height: 34, padding: '0 10px', fontSize: '0.76rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <UserCheck size={13} /> Hồ sơ 360°
            </button>
          </div>
        ),
      },
    ],
    [openEmployeeDrawer]
  );

  const contractColumns = useMemo<ReadonlyArray<TableColumn<HrContractDto>>>(
    () => [
      {
        key: 'num',
        header: 'Số Hợp đồng',
        render: (c) => (
          <div>
            <div style={{ fontWeight: 800, color: '#1E40FF' }}>{c.contract_number}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {CONTRACT_TYPE_LABELS[c.contract_type] || c.contract_type}
            </div>
          </div>
        ),
      },
      {
        key: 'emp',
        header: 'Nhân sự',
        render: (c) => <span style={{ fontWeight: 700 }}>{c.employee_name || c.employee_code}</span>,
      },
      {
        key: 'dates',
        header: 'Thời hạn hiệu lực',
        render: (c) => (
          <span style={{ fontSize: '0.82rem' }}>
            {String(c.start_date).slice(0, 10)} → {c.end_date ? String(c.end_date).slice(0, 10) : 'Không thời hạn'}
          </span>
        ),
      },
      {
        key: 'salary',
        header: 'Mức lương HĐ',
        numeric: true,
        render: (c) => <span style={{ fontWeight: 800 }}>{formatVnd(c.base_salary_vnd)}</span>,
      },
      {
        key: 'signed',
        header: 'Xác thực chữ ký số',
        render: (c) =>
          c.signed_by_employee ? (
            <Badge tone="success" icon={<CheckCircle2 size={11} />}>
              Đã ký điện tử
            </Badge>
          ) : (
            <button
              type="button"
              onClick={() => setSigTarget({ kind: 'contract', id: c.id, title: c.contract_number })}
              className="btn secondary"
              style={{ height: 32, padding: '0 10px', fontSize: '0.75rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <PenTool size={12} /> Ký ngay
            </button>
          ),
      },
    ],
    []
  );

  const assetColumns = useMemo<ReadonlyArray<TableColumn<HrAssetDto>>>(
    () => [
      {
        key: 'asset',
        header: 'Tài sản & Mã thiết bị',
        render: (a) => (
          <div>
            <div style={{ fontWeight: 800 }}>{a.asset_name}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {a.asset_code} {a.serial_number ? `• SN: ${a.serial_number}` : ''}
            </div>
          </div>
        ),
      },
      {
        key: 'emp',
        header: 'Người giữ tài sản',
        render: (a) => <span style={{ fontWeight: 700 }}>{a.employee_name}</span>,
      },
      {
        key: 'val',
        header: 'Giá trị',
        numeric: true,
        render: (a) => <span>{formatVnd(a.asset_value_vnd)}</span>,
      },
      {
        key: 'status',
        header: 'Trạng thái bàn giao',
        render: (a) => (
          <Badge tone={a.status === 'assigned' ? 'primary' : 'success'}>
            {a.status === 'assigned' ? 'Đang bàn giao' : 'Đã thu hồi'}
          </Badge>
        ),
      },
      {
        key: 'act',
        header: '',
        align: 'right',
        render: (a) =>
          a.status === 'assigned' && canEdit ? (
            <button
              type="button"
              onClick={() => void handleReturnAsset(a.id)}
              className="btn secondary"
              style={{ height: 34, padding: '0 10px', fontSize: '0.76rem' }}
            >
              Thu hồi tài sản
            </button>
          ) : null,
      },
    ],
    [canEdit, handleReturnAsset]
  );

  const appointmentColumns = useMemo<ReadonlyArray<TableColumn<BookingAppointmentDto>>>(
    () => [
      {
        key: 'guest',
        header: 'Khách hẹn / Ứng viên',
        render: (ap) => (
          <div>
            <div style={{ fontWeight: 800 }}>{ap.guest_name}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {ap.guest_phone || ap.guest_email || '—'} {ap.guest_company ? `• ${ap.guest_company}` : ''}
            </div>
          </div>
        ),
      },
      {
        key: 'link',
        header: 'Lịch hẹn 1-1',
        render: (ap) => <span style={{ fontWeight: 600 }}>{ap.booking_link_title}</span>,
      },
      {
        key: 'slot',
        header: 'Ngày & Khung giờ',
        render: (ap) => (
          <Badge tone="primary">
            {String(ap.booking_date).slice(0, 10)} • {ap.start_time} - {ap.end_time}
          </Badge>
        ),
      },
      {
        key: 'topic',
        header: 'Chủ đề trao đổi',
        render: (ap) => <span>{ap.topic || '—'}</span>,
      },
      {
        key: 'st',
        header: 'Trạng thái',
        render: (ap) => (
          <Badge tone={ap.status === 'confirmed' ? 'success' : 'neutral'}>
            {ap.status === 'confirmed' ? 'Đã xác nhận' : ap.status}
          </Badge>
        ),
      },
    ],
    []
  );

  if (loading) {
    return <HrmTimesheetSkeleton />;
  }

  return (
    <div style={{ background: '#F8F9FA', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <Card
        padding="1.3rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: '#FFFFFF',
                border: '1px solid #DBEAFE',
                boxShadow: '0 6px 18px rgba(30, 64, 255, 0.12)',
                padding: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img src="/imgs/autodata/ICON.png" alt="DOMATION" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Nhân Sự 360° (HRM), Sơ Đồ Tổ Chức, Chữ Ký Số & Đặt Lịch 1-1
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="success" icon={<Lock size={11} />}>
                  Scope: {activeScope}
                </Badge>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
                Quản trị trọn vòng đời nhân sự gắn Sơ đồ Tổ chức trực quan, hợp đồng ký số, tài sản cấp phát & chấm công AI Camera
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ScreenHelpButton screenKey="erp_hrm" />
            <button
              type="button"
              onClick={() => setSmartCheckInOpen(true)}
              className="btn secondary"
              style={{
                height: 44,
                padding: '0 1rem',
                borderColor: '#1E40FF',
                color: '#1E40FF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.83rem',
              }}
            >
              <Camera size={15} /> Chấm công nhanh (AI Camera)
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={() => void handleSyncWorkspaceUsers()}
                className="btn secondary"
                style={{ height: 44, padding: '0 1rem', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.83rem' }}
              >
                <RefreshCw size={14} /> Đồng bộ từ Tài khoản
              </button>
            )}
            {canCreate && (
              <button
                type="button"
                onClick={() => openEmployeeDrawer(null)}
                style={{
                  height: 44,
                  padding: '0 1.25rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(30, 64, 255, 0.24)',
                }}
              >
                <UserPlus size={16} /> Thêm hồ sơ nhân sự
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))', gap: '1rem' }}>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TỔNG NHÂN SỰ HỆ THỐNG</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
            {overview?.summary.total_employees ?? employees.length}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
            Chính thức: {overview?.summary.active_employees ?? 0} • Thử việc: {overview?.summary.probation_employees ?? 0}
          </div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>HỢP ĐỒNG ĐANG HIỆU LỰC</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {overview?.summary.active_contracts ?? contracts.length}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Hỗ trợ ký số điện tử HTML5 Canvas</div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TÀI SẢN ĐANG CẤP PHÁT</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {overview?.summary.assigned_assets ?? assets.length}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Theo dõi Serial & biên bản thu hồi</div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>LỊCH HẸN 1-1 ĐÃ ĐẶT</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>
            {overview?.summary.confirmed_appointments ?? appointments.length}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
            Trên {bookingLinks.length} trang đặt lịch thông minh
          </div>
        </Card>
      </div>

      {/* 5 Tabs & Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <PillTabs<HrmTabKey>
          activeKey={activeTab}
          onChange={setActiveTab}
          tabs={[
            {
              key: 'org_chart',
              label: 'Sơ đồ Tổ chức Trực quan',
              icon: <FolderTree size={15} />,
              count: (overview?.org.departments || []).length,
            },
            { key: 'employees', label: 'Danh bạ Nhân sự 360°', icon: <Users size={15} />, count: employees.length },
            {
              key: 'contracts',
              label: 'Hợp đồng & Chữ ký số',
              icon: <FileSignature size={15} />,
              count: contracts.length,
            },
            { key: 'assets', label: 'Tài sản Cấp phát', icon: <Laptop size={15} />, count: assets.length },
            {
              key: 'booking',
              label: 'Lịch hẹn 1-1 Smart Booking',
              icon: <Calendar size={15} />,
              count: bookingLinks.length,
            },
          ]}
        />

        {activeTab === 'employees' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 14 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã NV, họ tên, email..."
                style={{
                  height: 44,
                  padding: '0 0.85rem 0 2.2rem',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '0.84rem',
                }}
              />
            </div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                height: 44,
                padding: '0 0.85rem',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '0.84rem',
              }}
            >
              <option value="all">Tất cả phòng ban</option>
              {(overview?.org.departments || []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'contracts' && canCreate && (
          <button
            type="button"
            onClick={() => setContractModalOpen(true)}
            style={{
              height: 44,
              padding: '0 1.2rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Tạo hợp đồng lao động
          </button>
        )}

        {activeTab === 'assets' && canCreate && (
          <button
            type="button"
            onClick={() => setAssetModalOpen(true)}
            style={{
              height: 44,
              padding: '0 1.2rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Bàn giao thiết bị mới
          </button>
        )}

        {activeTab === 'booking' && canCreate && (
          <button
            type="button"
            onClick={() => setBookingModalOpen(true)}
            style={{
              height: 44,
              padding: '0 1.2rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Tạo trang đặt lịch 1-1
          </button>
        )}
      </div>

      {/* Tab Views */}
      {activeTab === 'org_chart' && (
        <OrgChartTreeView
          companyName={companyName}
          org={overview?.org}
          employees={employees}
          onSelectEmployee={(emp) => openEmployeeDrawer(emp)}
        />
      )}

      {activeTab === 'employees' && (
        <Table<HrEmployeeDto>
          columns={employeeColumns}
          rows={filteredEmployees}
          rowKey={(r) => r.id}
          onRowClick={(r) => openEmployeeDrawer(r)}
          emptyTitle="Chưa có hồ sơ nhân sự 360°"
          emptyDescription="Bấm 'Đồng bộ từ Tài khoản' hoặc 'Thêm hồ sơ nhân sự' để quản lý lương, phép năm, tài sản và chữ ký số."
        />
      )}

      {activeTab === 'contracts' && (
        <Table<HrContractDto>
          columns={contractColumns}
          rows={contracts}
          rowKey={(c) => c.id}
          emptyTitle="Chưa có hợp đồng lao động nào"
          emptyDescription="Quản lý Hợp đồng thử việc, xác định thời hạn, không thời hạn & ký số điện tử trực tuyến."
        />
      )}

      {activeTab === 'assets' && (
        <Table<HrAssetDto>
          columns={assetColumns}
          rows={assets}
          rowKey={(a) => a.id}
          emptyTitle="Chưa có tài sản nào được bàn giao"
          emptyDescription="Ghi nhận Laptop, điện thoại, thẻ ra vào cấp phát cho từng nhân sự kèm số Serial."
        />
      )}

      {activeTab === 'booking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {bookingLinks.length === 0 ? (
            <EmptyState
              icon={<Calendar size={24} />}
              title="Chưa tạo trang Đặt lịch 1-1 Thông minh nào"
              description="Tạo link chia sẻ cho Phỏng vấn Tuyển dụng, Tư vấn Khách hàng VIP hoặc Demo B2B 1-1."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1rem' }}>
              {bookingLinks.map((bl) => {
                const publicApiUrl = `${window.location.origin}/booking/${bl.slug}`;
                return (
                  <FormCard
                    key={bl.id}
                    icon={<Calendar size={19} />}
                    title={bl.title}
                    description={`${bl.duration_minutes} phút / ca • Nghỉ đệm ${bl.buffer_minutes}p • ${bl.location_value || 'Online'}`}
                    badge={<Badge tone="primary">{bl.confirmed_count ?? 0} lịch đã đặt</Badge>}
                    footer={
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(publicApiUrl);
                            toast.success('Đã sao chép đường dẫn Public Booking!');
                          }}
                          className="btn secondary"
                          style={{ height: 36, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        >
                          <Copy size={13} /> Sao chép Link
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewBookingSlug(bl.slug)}
                          style={{
                            height: 36,
                            padding: '0 0.95rem',
                            borderRadius: 10,
                            border: 'none',
                            background: '#1E40FF',
                            color: '#FFFFFF',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            cursor: 'pointer',
                          }}
                        >
                          <ExternalLink size={13} /> Mở & Đặt thử Slot
                        </button>
                      </>
                    }
                  />
                );
              })}
            </div>
          )}

          <Card title="Danh sách các buổi hẹn 1-1 đã xác nhận" padding="1.15rem 1.35rem">
            <Table<BookingAppointmentDto>
              columns={appointmentColumns}
              rows={appointments}
              rowKey={(ap) => ap.id}
              emptyTitle="Chưa có lịch hẹn 1-1 nào được đặt"
              emptyDescription="Chia sẻ link đặt lịch hoặc bấm 'Mở & Đặt thử Slot' ở trên để kiểm tra luồng chống trùng giờ."
            />
          </Card>
        </div>
      )}

      {/* Drawers & Modals */}
      <AccountDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        employee={drawerEmployee}
        org={overview?.org}
        onSaved={() => void loadAllHrm()}
      />

      <SmartCheckInModal
        isOpen={smartCheckInOpen}
        onClose={() => setSmartCheckInOpen(false)}
        onSuccess={() => void loadAllHrm()}
      />

      <SignaturePadModal
        isOpen={Boolean(sigTarget)}
        onClose={() => setSigTarget(null)}
        targetTitle={sigTarget?.title || ''}
        onSaveSignature={handleSaveDigitalSignature}
      />

      <ContractCreateModal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        employees={employees}
        token={token}
        tenantSlug={tenantSlug}
        onSaved={() => void loadAllHrm()}
      />

      <AssetHandoverModal
        isOpen={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        employees={employees}
        token={token}
        tenantSlug={tenantSlug}
        onSaved={() => void loadAllHrm()}
      />

      <BookingLinkCreateModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        token={token}
        tenantSlug={tenantSlug}
        onSaved={() => void loadAllHrm()}
      />

      <PublicBookingInteractivePreviewModal
        slug={previewBookingSlug}
        onClose={() => setPreviewBookingSlug(null)}
        onBooked={() => void loadAllHrm()}
      />
    </div>
  );
};

export const Wave2Entry = ErpHrmWave2Entry;
export default ErpHrmWave2Entry;
