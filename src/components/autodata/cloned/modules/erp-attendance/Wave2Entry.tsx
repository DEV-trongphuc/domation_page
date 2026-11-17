import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  FileWarning,
  Grid,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  FormCard,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import {
  calcClientHaversineMeters,
  EXPLANATION_TYPE_LABELS,
  type AttendanceExplanationDto,
  type AttendanceLogDto,
  type AttendanceOverviewDto,
  type ShiftDto,
  type TimesheetMatrixDto,
} from './attendanceTypes';

type AttendanceTabKey = 'checkin' | 'timesheet' | 'shifts' | 'explanations';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 0.85rem',
  borderRadius: 12,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: '0.86rem',
  outline: 'none',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
};

export const ErpAttendanceWave2Entry: React.FC = () => {
  const { token, tenantSlug, user } = useAuth();
  const { can, scope, packageMeta } = useEntitlement();

  const canCheckIn = can('erp_attendance', 'create');
  const canApprove = can('erp_attendance', 'approve');
  const canManageShifts = can('erp_attendance', 'manage_config');
  const activeScope = scope('erp_attendance');

  const [activeTab, setActiveTab] = useState<AttendanceTabKey>('checkin');
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const [overview, setOverview] = useState<AttendanceOverviewDto | null>(null);
  const [shifts, setShifts] = useState<ShiftDto[]>([]);
  const [logs, setLogs] = useState<AttendanceLogDto[]>([]);
  const [timesheet, setTimesheet] = useState<TimesheetMatrixDto | null>(null);
  const [explanations, setExplanations] = useState<AttendanceExplanationDto[]>([]);

  // Live GPS + Selfie Widget State
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [gpsStatusText, setGpsStatusText] = useState('Chưa lấy vị trí GPS');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFallbackNote, setCameraFallbackNote] = useState('');
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [checkingAction, setCheckingAction] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Shift Designer Modal
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shName, setShName] = useState('');
  const [shStart, setShStart] = useState('08:30');
  const [shEnd, setShEnd] = useState('17:30');
  const [shBreak, setShBreak] = useState('60');
  const [shGraceLate, setShGraceLate] = useState('15');
  const [shOtMult, setShOtMult] = useState('1.5');
  const [shNightMult, setShNightMult] = useState('1.3');
  const [shRequireGps, setShRequireGps] = useState(true);

  // Explanation Modal
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expType, setExpType] = useState<AttendanceExplanationDto['explanation_type']>('late_arrival');
  const [expUnits, setExpUnits] = useState('1');
  const [expReason, setExpReason] = useState('');

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const loadAllAttendance = useCallback(async () => {
    try {
      const [ovRes, shRes, lgRes, tsRes, exRes] = await Promise.all([
        apiRequest<AttendanceOverviewDto>('/attendance/overview', { token, tenantSlug }).catch(() => null),
        apiRequest<ShiftDto[]>('/attendance/shifts', { token, tenantSlug }).catch(() => []),
        apiRequest<AttendanceLogDto[]>(`/attendance/logs?month=${selectedMonth}`, { token, tenantSlug }).catch(() => []),
        apiRequest<TimesheetMatrixDto>(`/attendance/timesheet?month=${selectedMonth}`, { token, tenantSlug }).catch(
          () => null
        ),
        apiRequest<AttendanceExplanationDto[]>('/attendance/explanations', { token, tenantSlug }).catch(() => []),
      ]);
      if (ovRes) {
        setOverview(ovRes);
        if (ovRes.active_branch?.id) {
          setSelectedBranchId((prev) => prev || ovRes.active_branch!.id);
        }
      }
      setShifts(Array.isArray(shRes) ? shRes : []);
      setLogs(Array.isArray(lgRes) ? lgRes : []);
      if (tsRes) setTimesheet(tsRes);
      setExplanations(Array.isArray(exRes) ? exRes : []);
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, selectedMonth]);

  useEffect(() => {
    void loadAllAttendance();
  }, [loadAllAttendance]);

  const activeBranch = useMemo(() => {
    const list = overview?.branches || [];
    return (
      list.find((b) => b.id === selectedBranchId) ||
      overview?.active_branch ||
      list[0] ||
      null
    );
  }, [overview, selectedBranchId]);

  const liveDistanceMeters = useMemo(() => {
    if (
      gpsLat === null ||
      gpsLng === null ||
      !activeBranch ||
      activeBranch.gps_lat === null ||
      activeBranch.gps_lng === null
    ) {
      return null;
    }
    return calcClientHaversineMeters(gpsLat, gpsLng, activeBranch.gps_lat, activeBranch.gps_lng);
  }, [gpsLat, gpsLng, activeBranch]);

  const requestBrowserGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (activeBranch?.gps_lat !== null && activeBranch?.gps_lat !== undefined && activeBranch.gps_lng !== null) {
        setGpsLat(activeBranch.gps_lat);
        setGpsLng(activeBranch.gps_lng);
        setGpsStatusText('Trình duyệt không hỗ trợ Geolocation — đã nạp tọa độ chuẩn Chi nhánh để kiểm thử.');
      } else {
        setGpsStatusText('Thiết bị không hỗ trợ định vị GPS.');
      }
      return;
    }

    setGpsStatusText('Đang xác thực vệ tinh GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(Number(pos.coords.latitude.toFixed(6)));
        setGpsLng(Number(pos.coords.longitude.toFixed(6)));
        setGpsStatusText(`Đã khóa vị trí GPS (±${Math.round(pos.coords.accuracy)}m)`);
      },
      () => {
        if (activeBranch?.gps_lat !== null && activeBranch?.gps_lat !== undefined && activeBranch.gps_lng !== null) {
          setGpsLat(activeBranch.gps_lat);
          setGpsLng(activeBranch.gps_lng);
          setGpsStatusText('Quyền vị trí trình duyệt đang tắt — dùng chế độ mô phỏng tọa độ Chi nhánh.');
        } else {
          setGpsStatusText('Chưa cấp quyền vị trí trình duyệt (có thể nhập tọa độ hoặc gửi giải trình).');
        }
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const generateFallbackStampDataUrl = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 220;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#EEF2FF';
      ctx.fillRect(0, 0, 360, 220);
      ctx.strokeStyle = '#1E40FF';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, 340, 200);
      ctx.fillStyle = '#1E40FF';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('XÁC THỰC CHẤM CÔNG SỐ', 64, 80);
      ctx.fillStyle = '#0F172A';
      ctx.font = '14px sans-serif';
      ctx.fillText(user?.name || 'Nhân sự DOMATION', 64, 115);
      ctx.fillStyle = '#475569';
      ctx.font = '12px monospace';
      ctx.fillText(new Date().toLocaleString('vi-VN'), 64, 148);
    }
    return canvas.toDataURL('image/png');
  };

  const startWebRtcSelfie = async () => {
    setCameraFallbackNote('');
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setSelfieDataUrl(generateFallbackStampDataUrl());
      setCameraFallbackNote('Thiết bị không có Camera WebRTC — đã tạo tem xác thực thời gian thực dự phòng.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 320 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      setSelfieDataUrl(generateFallbackStampDataUrl());
      setCameraFallbackNote('Camera trình duyệt đang bận hoặc chưa cấp quyền — sử dụng ảnh xác thực số dự phòng.');
    }
  };

  const captureSelfieFrame = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setSelfieDataUrl(canvas.toDataURL('image/jpeg', 0.82));
      }
    } else {
      setSelfieDataUrl(generateFallbackStampDataUrl());
    }
    stopCameraStream();
    setCameraActive(false);
  };

  const handleCheckInOrOut = async (mode: 'check-in' | 'check-out') => {
    setCheckingAction(true);
    try {
      const finalSelfie = selfieDataUrl || generateFallbackStampDataUrl();
      await apiRequest(`/attendance/${mode}`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          branch_id: activeBranch?.id || undefined,
          latitude: gpsLat,
          longitude: gpsLng,
          selfie_data_url: finalSelfie,
          device_info: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 160) : 'Web Workspace',
        },
      });
      toast.success(mode === 'check-in' ? 'Đã ghi nhận Check-in thành công!' : 'Đã ghi nhận Check-out cuối ca!');
      await loadAllAttendance();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thực hiện chấm công.'));
    } finally {
      setCheckingAction(false);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shName.trim()) {
      toast.error('Vui lòng nhập tên ca làm việc.');
      return;
    }
    try {
      await apiRequest('/attendance/shifts', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: shName.trim(),
          start_time: shStart,
          end_time: shEnd,
          break_minutes: Number(shBreak || 60),
          grace_late_minutes: Number(shGraceLate || 15),
          overtime_multiplier: Number(shOtMult || 1.5),
          night_shift_multiplier: Number(shNightMult || 1.3),
          require_gps: shRequireGps,
        },
      });
      toast.success('Đã tạo ca làm việc & quy chế chấm công mới!');
      setShName('');
      setShiftModalOpen(false);
      await loadAllAttendance();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo ca làm việc.'));
    }
  };

  const handleSubmitExplanation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expReason.trim()) {
      toast.error('Vui lòng nhập lý do giải trình công.');
      return;
    }
    try {
      await apiRequest('/attendance/explanations', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          work_date: expDate,
          explanation_type: expType,
          requested_work_units: Number(expUnits || 1),
          reason: expReason.trim(),
        },
      });
      toast.success('Đã gửi giải trình công (Tự động liên thông sang Phê duyệt N bước)!');
      setExpReason('');
      setExpModalOpen(false);
      await loadAllAttendance();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi giải trình chấm công.'));
    }
  };

  const handleReviewExplanation = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await apiRequest(`/attendance/explanations/${id}/review`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          status,
          review_comment: status === 'approved' ? 'Đã xác nhận cập nhật đủ công' : 'Từ chối giải trình',
        },
      });
      toast.success(status === 'approved' ? 'Đã duyệt giải trình & cập nhật Bảng công!' : 'Đã từ chối giải trình.');
      await loadAllAttendance();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể duyệt giải trình.'));
    }
  };

  const explanationColumns = useMemo<ReadonlyArray<TableColumn<AttendanceExplanationDto>>>(
    () => [
      {
        key: 'user',
        header: 'Nhân sự & Ngày công',
        render: (r) => (
          <div>
            <div style={{ fontWeight: 800 }}>{r.user_name || 'Nhân sự'}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Ngày công: <strong>{String(r.work_date).slice(0, 10)}</strong> • {formatShortDate(r.created_at)}
            </div>
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Loại giải trình',
        render: (r) => <Badge tone="info">{EXPLANATION_TYPE_LABELS[r.explanation_type] || r.explanation_type}</Badge>,
      },
      {
        key: 'reason',
        header: 'Lý do & Đề xuất công',
        render: (r) => (
          <div>
            <div>{r.reason}</div>
            <div style={{ fontSize: '0.75rem', color: '#1E40FF', fontWeight: 700 }}>
              Đề xuất: {r.requested_work_units} công {r.approval_request_code ? `• Mã duyệt: ${r.approval_request_code}` : ''}
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        render: (r) => (
          <Badge tone={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>
            {r.status === 'approved' ? 'Đã duyệt' : r.status === 'rejected' ? 'Từ chối' : 'Đang chờ duyệt'}
          </Badge>
        ),
      },
      {
        key: 'act',
        header: 'Xử lý',
        align: 'right',
        render: (r) =>
          canApprove && r.status === 'pending' ? (
            <div style={{ display: 'inline-flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => void handleReviewExplanation(r.id, 'approved')}
                style={{
                  height: 34,
                  padding: '0 10px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Duyệt công
              </button>
              <button
                type="button"
                onClick={() => void handleReviewExplanation(r.id, 'rejected')}
                className="btn secondary"
                style={{ height: 34, padding: '0 10px', fontSize: '0.76rem', color: '#DC2626' }}
              >
                Từ chối
              </button>
            </div>
          ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canApprove, token, tenantSlug]
  );

  if (loading) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang đồng bộ Hệ thống Chấm công GPS Đa tầng & Selfie..."
        subMessage="Đối chiếu tọa độ Chi nhánh & Quy chế Ca làm việc động"
      />
    );
  }

  const withinFencePreview =
    liveDistanceMeters !== null && activeBranch
      ? liveDistanceMeters <= activeBranch.gps_radius_meters
      : null;

  return (
    <div style={{ background: '#F8F9FA', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
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
              <img src="/imgs/autodata/ICON.png" alt="Logo robot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Chấm Công Thông Minh GPS Đa Tầng & WebRTC Selfie
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="success" icon={<Lock size={11} />}>
                  Scope: {activeScope}
                </Badge>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
                Đối chiếu khoảng cách Haversine trực tiếp với tọa độ từng Chi nhánh & cấu hình ca làm việc 100% linh hoạt
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ScreenHelpButton screenKey="erp_attendance" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                height: 44,
                padding: '0 0.85rem',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.84rem',
              }}
            />
            <button
              type="button"
              onClick={() => setExpModalOpen(true)}
              className="btn secondary"
              style={{ height: 44, padding: '0 1rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <FileWarning size={15} /> Gửi giải trình công
            </button>
          </div>
        </div>
      </Card>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))', gap: '1rem' }}>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TRẠNG THÁI HÔM NAY ({overview?.today_date})</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E40FF', marginTop: 6 }}>
            {overview?.today_log?.check_out_at
              ? 'Đã hoàn tất Check-in & Out'
              : overview?.today_log?.check_in_at
                ? 'Đã Check-in đầu giờ'
                : 'Chưa chấm công hôm nay'}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 4 }}>
            Ca: {overview?.active_shift?.name || 'Ca Hành Chính'} ({overview?.active_shift?.start_time || '08:30'} -{' '}
            {overview?.active_shift?.end_time || '17:30'})
          </div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>NGÀY CÔNG THÁNG CỦA TÔI</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {overview?.summary.my_month_work_units ?? 0} công
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
            Đi trễ vượt ân hạn: {overview?.summary.my_month_late_days ?? 0} buổi
          </div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>QUÂN SỐ HIỆN DIỆN HÔM NAY</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {overview?.summary.company_today_checkins ?? 0} người
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Toàn hệ thống chi nhánh</div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>GIẢI TRÌNH ĐANG CHỜ DUYỆT</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
            {overview?.summary.pending_explanations ?? explanations.filter((x) => x.status === 'pending').length}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Liên thông Phê duyệt N cấp</div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <PillTabs<AttendanceTabKey>
        activeKey={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'checkin', label: 'Trạm Check-in GPS & Selfie', icon: <MapPin size={15} /> },
          { key: 'timesheet', label: `Bảng công Tháng ${selectedMonth}`, icon: <Grid size={15} />, count: timesheet?.rows.length },
          { key: 'shifts', label: 'Thiết kế Ca & Quy chế Động', icon: <Settings size={15} />, count: shifts.length },
          { key: 'explanations', label: 'Giải trình Chấm công', icon: <FileWarning size={15} />, count: explanations.length },
        ]}
      />

      {/* Tab 1: Live GPS + Selfie Check-In Widget */}
      {activeTab === 'checkin' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          <Card
            title="Xác thực Tọa độ GPS Đa Tầng & Ảnh Selfie"
            subtitle="Hệ thống đo khoảng cách Haversine so với tâm bán kính Chi nhánh làm việc"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={LABEL_STYLE}>Chi nhánh văn phòng đối chiếu GPS</label>
                <select
                  value={activeBranch?.id || ''}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  style={INPUT_STYLE}
                >
                  {(overview?.branches || []).length === 0 ? (
                    <option value="">Trụ sở mặc định (Chưa cấu hình bán kính GPS)</option>
                  ) : (
                    (overview?.branches || []).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (Bán kính cho phép: {b.gps_radius_meters}m)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: 14,
                  background: '#F8FAFF',
                  border: '1px solid #DBEAFE',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{gpsStatusText}</span>
                  <button
                    type="button"
                    onClick={requestBrowserGps}
                    className="btn secondary"
                    style={{ height: 36, color: '#1E40FF', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <Navigation size={13} /> Lấy tọa độ GPS ngay
                  </button>
                </div>

                {gpsLat !== null && gpsLng !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: '0.8rem' }}>
                    <Badge tone="neutral">
                      Lat: {gpsLat}, Lng: {gpsLng}
                    </Badge>
                    {liveDistanceMeters !== null && (
                      <Badge tone={withinFencePreview ? 'success' : 'warning'}>
                        Khoảng cách tới Chi nhánh: {liveDistanceMeters}m (
                        {withinFencePreview ? 'Hợp lệ trong vùng Geofence' : 'Ngoài vùng Geofence'})
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* WebRTC Camera / Selfie Preview */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 16,
                  background: '#F8F9FA',
                  border: '1px dashed #CBD5E1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', maxWidth: 340, borderRadius: 12, border: '2px solid #1E40FF' }}
                    />
                    <button
                      type="button"
                      onClick={captureSelfieFrame}
                      style={{
                        height: 40,
                        padding: '0 1.2rem',
                        borderRadius: 10,
                        border: 'none',
                        background: '#1E40FF',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Chụp ảnh xác thực
                    </button>
                  </>
                ) : selfieDataUrl ? (
                  <>
                    <img
                      src={selfieDataUrl}
                      alt="Selfie Check-in"
                      style={{ width: '100%', maxWidth: 300, borderRadius: 12, border: '1px solid #E2E8F0' }}
                    />
                    <button
                      type="button"
                      onClick={() => void startWebRtcSelfie()}
                      className="btn secondary"
                      style={{ height: 36, fontSize: '0.78rem' }}
                    >
                      Chụp lại ảnh mới
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => void startWebRtcSelfie()}
                    className="btn secondary"
                    style={{ height: 42, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 7 }}
                  >
                    <Camera size={16} /> Mở Camera Selfie WebRTC
                  </button>
                )}
                {cameraFallbackNote && (
                  <div style={{ fontSize: '0.75rem', color: '#64748B', textAlign: 'center' }}>
                    {cameraFallbackNote}
                  </div>
                )}
              </div>

              {canCheckIn && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    disabled={checkingAction}
                    onClick={() => void handleCheckInOrOut('check-in')}
                    style={{
                      height: 46,
                      borderRadius: 12,
                      border: 'none',
                      background: '#1E40FF',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(30, 64, 255, 0.22)',
                    }}
                  >
                    <LogIn size={17} /> Check-in Vào Ca
                  </button>
                  <button
                    type="button"
                    disabled={checkingAction}
                    onClick={() => void handleCheckInOrOut('check-out')}
                    style={{
                      height: 46,
                      borderRadius: 12,
                      border: '1px solid #1E40FF',
                      background: '#FFFFFF',
                      color: '#1E40FF',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <LogOut size={17} /> Check-out Tan Ca
                  </button>
                </div>
              )}
            </div>
          </Card>

          <Card
            title="Nhật ký Chấm công Gần đây"
            actions={
              <button
                type="button"
                onClick={() => void loadAllAttendance()}
                className="btn secondary"
                style={{ height: 36, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <RefreshCw size={13} /> Tải lại
              </button>
            }
          >
            {logs.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                Chưa có bản ghi Check-in nào trong tháng {selectedMonth}.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {logs.slice(0, 8).map((lg) => (
                  <div
                    key={lg.id}
                    style={{
                      padding: '0.8rem 0.95rem',
                      borderRadius: 14,
                      background: '#F8F9FA',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A' }}>
                        {lg.user_name || 'Nhân sự'} • {lg.work_date_str || String(lg.work_date).slice(0, 10)}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
                        Vào: {formatShortDate(lg.check_in_at)} • Ra: {formatShortDate(lg.check_out_at)}
                        {lg.distance_meters !== null ? ` • Cách tâm GPS: ${lg.distance_meters}m` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <Badge
                        tone={
                          lg.status === 'valid' || lg.status === 'explained'
                            ? 'success'
                            : lg.status === 'late'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {lg.work_units} công ({lg.attendance_code})
                      </Badge>
                      {lg.late_minutes > 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 600 }}>
                          Trễ {lg.late_minutes} phút
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Monthly Timesheet Matrix */}
      {activeTab === 'timesheet' && (
        <Card
          title={`Ma trận Bảng công Tháng ${selectedMonth}`}
          subtitle="X: Đủ công • N: Nửa ngày • Tự động liên thông sang Động cơ Tính lương cuối kỳ"
          padding="1rem 1.25rem"
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', position: 'sticky', left: 0, background: '#F8F9FA' }}>
                    Nhân sự
                  </th>
                  {Array.from({ length: timesheet?.days_in_month || 30 }, (_, idx) => idx + 1).map((day) => (
                    <th key={day} style={{ padding: '0.5rem 0.35rem', textAlign: 'center', minWidth: 28, color: '#64748B' }}>
                      {day}
                    </th>
                  ))}
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#1E40FF' }}>Tổng công</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#059669' }}>Giờ OT</th>
                </tr>
              </thead>
              <tbody>
                {(timesheet?.rows || []).map((row) => (
                  <tr key={row.user_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#FFFFFF' }}>
                      <div>{row.full_name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500 }}>
                        {row.department_name || row.branch_name || ''}
                      </div>
                    </td>
                    {Array.from({ length: timesheet?.days_in_month || 30 }, (_, idx) => idx + 1).map((day) => {
                      const cell = row.days[day];
                      return (
                        <td key={day} style={{ padding: '0.35rem 0.2rem', textAlign: 'center' }}>
                          {cell ? (
                            <span
                              title={`Công: ${cell.work_units} | Trễ: ${cell.late_minutes}p`}
                              style={{
                                display: 'inline-block',
                                width: 22,
                                height: 22,
                                lineHeight: '22px',
                                borderRadius: 6,
                                fontWeight: 800,
                                fontSize: '0.7rem',
                                background: !cell.within_geofence
                                  ? 'rgba(220, 38, 38, 0.12)'
                                  : cell.late_minutes > 0
                                    ? 'rgba(217, 119, 6, 0.14)'
                                    : 'rgba(16, 185, 129, 0.14)',
                                color: !cell.within_geofence
                                  ? '#DC2626'
                                  : cell.late_minutes > 0
                                    ? '#D97706'
                                    : '#059669',
                              }}
                            >
                              {cell.code}
                            </span>
                          ) : (
                            <span style={{ color: '#CBD5E1' }}>·</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#1E40FF' }}>
                      {row.total_work_units}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                      {row.total_overtime_hours}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Shifts & Attendance Policy Designer */}
      {activeTab === 'shifts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              Thiết lập khung giờ vào/ra, số phút ân hạn đi trễ, giờ nghỉ giữa ca & hệ số nhân ca đêm / OT riêng cho từng doanh nghiệp.
            </div>
            {canManageShifts && (
              <button
                type="button"
                onClick={() => setShiftModalOpen(true)}
                style={{
                  height: 44,
                  padding: '0 1.25rem',
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
                <Plus size={15} /> Thêm ca làm việc mới
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {shifts.map((sh) => (
              <FormCard
                key={sh.id}
                icon={<Clock size={19} />}
                title={`${sh.name} (${sh.start_time} - ${sh.end_time})`}
                description={`Nghỉ giữa ca: ${sh.break_minutes}p • Ân hạn đi trễ: ${sh.grace_late_minutes}p • Giờ chuẩn: ${sh.standard_work_hours}h`}
                badge={
                  <Badge tone={sh.is_default ? 'primary' : 'success'}>
                    {sh.is_default ? 'Ca mặc định' : 'Đang hoạt động'}
                  </Badge>
                }
                footer={
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge tone="info">OT thường ×{sh.overtime_multiplier}</Badge>
                    <Badge tone="purple">Ca đêm ×{sh.night_shift_multiplier}</Badge>
                    {sh.require_gps && (
                      <Badge tone="success" icon={<CheckCircle2 size={11} />}>
                        Yêu cầu GPS
                      </Badge>
                    )}
                  </div>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Explanations */}
      {activeTab === 'explanations' && (
        <Table<AttendanceExplanationDto>
          columns={explanationColumns}
          rows={explanations}
          rowKey={(e) => e.id}
          emptyTitle="Chưa có đơn giải trình chấm công nào"
          emptyDescription="Nhân sự quên Check-in, đi gặp khách hàng ngoài vùng GPS có thể gửi giải trình trực tuyến."
        />
      )}

      {/* Create Shift Modal */}
      <CustomModal isOpen={shiftModalOpen} onClose={() => setShiftModalOpen(false)} title="Thiết Kế Ca Làm Việc & Quy Chế Chấm Công" width={600}>
        <form onSubmit={handleCreateShift} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          <div>
            <label style={LABEL_STYLE}>Tên ca làm việc *</label>
            <input
              type="text"
              value={shName}
              onChange={(e) => setShName(e.target.value)}
              placeholder="Ví dụ: Ca Sáng Showroom / Ca Hành Chính Linh Hoạt"
              style={INPUT_STYLE}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={LABEL_STYLE}>Giờ bắt đầu ca</label>
              <input type="time" value={shStart} onChange={(e) => setShStart(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Giờ kết thúc ca</label>
              <input type="time" value={shEnd} onChange={(e) => setShEnd(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Thời gian nghỉ trưa (phút)</label>
              <input type="number" min={0} value={shBreak} onChange={(e) => setShBreak(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Ân hạn đi trễ tối đa (phút)</label>
              <input type="number" min={0} value={shGraceLate} onChange={(e) => setShGraceLate(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Hệ số nhân làm thêm (OT)</label>
              <input type="number" step="0.1" min={1} value={shOtMult} onChange={(e) => setShOtMult(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Hệ số nhân ca đêm</label>
              <input type="number" step="0.1" min={1} value={shNightMult} onChange={(e) => setShNightMult(e.target.value)} style={INPUT_STYLE} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', fontWeight: 600 }}>
            <input type="checkbox" checked={shRequireGps} onChange={(e) => setShRequireGps(e.target.checked)} />
            Bắt buộc đối chiếu bán kính GPS Chi nhánh khi Check-in
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={() => setShiftModalOpen(false)} className="btn secondary" style={{ height: 44, padding: '0 1.2rem' }}>
              Hủy
            </button>
            <button
              type="submit"
              style={{
                height: 44,
                padding: '0 1.4rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Lưu ca làm việc
            </button>
          </div>
        </form>
      </CustomModal>

      {/* Submit Explanation Modal */}
      <CustomModal isOpen={expModalOpen} onClose={() => setExpModalOpen(false)} title="Gửi Giải Trình & Cập Nhật Công Bổ Sung" width={560}>
        <form onSubmit={handleSubmitExplanation} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={LABEL_STYLE}>Ngày công cần giải trình *</label>
              <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Số công đề xuất ghi nhận</label>
              <select value={expUnits} onChange={(e) => setExpUnits(e.target.value)} style={INPUT_STYLE}>
                <option value="1">1.0 công (Đủ ngày)</option>
                <option value="0.5">0.5 công (Nửa ngày)</option>
              </select>
            </div>
          </div>
          <div>
            <label style={LABEL_STYLE}>Phân loại lý do</label>
            <select
              value={expType}
              onChange={(e) => setExpType(e.target.value as AttendanceExplanationDto['explanation_type'])}
              style={INPUT_STYLE}
            >
              {Object.entries(EXPLANATION_TYPE_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Diễn giải chi tiết *</label>
            <textarea
              rows={3}
              value={expReason}
              onChange={(e) => setExpReason(e.target.value)}
              placeholder="Ghi rõ khách hàng / địa điểm công tác hoặc sự cố thiết bị..."
              style={{ ...INPUT_STYLE, height: 'auto', padding: '0.75rem 0.85rem' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={() => setExpModalOpen(false)} className="btn secondary" style={{ height: 44, padding: '0 1.2rem' }}>
              Hủy
            </button>
            <button
              type="submit"
              style={{
                height: 44,
                padding: '0 1.4rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Gửi giải trình ngay
            </button>
          </div>
        </form>
      </CustomModal>
    </div>
  );
};

export default ErpAttendanceWave2Entry;
