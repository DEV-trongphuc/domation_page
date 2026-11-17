import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  LogIn,
  LogOut,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  computeHaversineDistanceMeters,
  formatIsoOrHmToHm,
  type HrmAttendanceOverviewSnapshot,
  type HrmAttendancePolicyDto,
} from './hrmTypes';
import { CheckOutConfirmModal } from './CheckOutConfirmModal';

export interface SmartCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEFAULT_POLICY: HrmAttendancePolicyDto = {
  geofence_mode: 'flexible',
  require_gps: false,
  require_selfie: false,
  max_gps_accuracy_meters: 150,
  grace_late_minutes: 15,
  grace_early_minutes: 15,
  allow_any_branch_checkin: false,
  allow_remote_with_approved_leave: true,
};

const SmartCheckInInner: React.FC<{
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ onClose, onSuccess }) => {
  const { token, tenantSlug, user } = useAuth();

  const [loadingInit, setLoadingInit] = useState(true);
  const [overview, setOverview] = useState<HrmAttendanceOverviewSnapshot | null>(null);
  const [policy, setPolicy] = useState<HrmAttendancePolicyDto>(DEFAULT_POLICY);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Real Browser Geolocation — NEVER mock or fall back to fake branch coordinates!
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // WebRTC Live Selfie Camera
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Trình duyệt không hỗ trợ WebRTC Camera.');
      return;
    }
    setCameraError(null);
    setCapturedSelfie(null);
    try {
      stopCamera();
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError('Chưa cấp quyền Camera hoặc thiết bị không có webcam.');
      setCameraActive(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => null);
    }
  }, [cameraActive]);

  const requestRealBrowserGps = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsLat(null);
      setGpsLng(null);
      setGpsAccuracy(null);
      setGpsError('Trình duyệt không hỗ trợ định vị GPS vệ tinh.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(Number(pos.coords.latitude.toFixed(6)));
        setGpsLng(Number(pos.coords.longitude.toFixed(6)));
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setGpsError(null);
        setGpsLoading(false);
      },
      (err) => {
        // STRICT ANTI-SPOOFING RULE: NEVER mock or fall back to branch coordinates!
        setGpsLat(null);
        setGpsLng(null);
        setGpsAccuracy(null);
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Quyền truy cập vị trí GPS đã bị từ chối trong trình duyệt.');
        } else if (err.code === err.TIMEOUT) {
          setGpsError('Hết thời gian chờ tín hiệu vệ tinh GPS. Vui lòng bấm Định vị lại.');
        } else {
          setGpsError('Không thể xác định tọa độ GPS hiện tại của thiết bị.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        const [ovRes, polRes] = await Promise.all([
          apiRequest<HrmAttendanceOverviewSnapshot>('/attendance/overview', { token, tenantSlug }).catch(() => null),
          apiRequest<Partial<HrmAttendancePolicyDto>>('/attendance/policy', { token, tenantSlug }).catch(() => null),
        ]);
        if (!mounted) return;
        if (ovRes) {
          setOverview(ovRes);
          if (ovRes.active_branch?.id) {
            setSelectedBranchId(ovRes.active_branch.id);
          } else if (ovRes.branches?.[0]?.id) {
            setSelectedBranchId(ovRes.branches[0].id);
          }
          if (ovRes.policy) {
            setPolicy((prev) => ({ ...prev, ...ovRes.policy }));
          }
        }
        if (polRes) {
          setPolicy((prev) => ({ ...prev, ...polRes }));
        }
      } finally {
        if (mounted) {
          setLoadingInit(false);
          requestRealBrowserGps();
          void startCamera();
        }
      }
    };
    void bootstrap();
    return () => {
      mounted = false;
      stopCamera();
    };
  }, [token, tenantSlug, requestRealBrowserGps, startCamera, stopCamera]);

  const activeBranch = useMemo(() => {
    const list = overview?.branches || [];
    return (
      list.find((b) => b.id === selectedBranchId) ||
      overview?.active_branch ||
      list[0] ||
      null
    );
  }, [overview, selectedBranchId]);

  const distanceMeters = useMemo(() => {
    if (
      gpsLat === null ||
      gpsLng === null ||
      !activeBranch ||
      activeBranch.gps_lat === null ||
      activeBranch.gps_lng === null
    ) {
      return null;
    }
    return computeHaversineDistanceMeters(gpsLat, gpsLng, activeBranch.gps_lat, activeBranch.gps_lng);
  }, [gpsLat, gpsLng, activeBranch]);

  const branchRadius = Math.max(10, Number(activeBranch?.gps_radius_meters || 150));
  const resolvedExemption = overview?.effective_exemption || overview?.exemption;
  const hasGpsExemption = Boolean(
    resolvedExemption?.exempt_gps ||
      resolvedExemption?.exempt_checkin ||
      resolvedExemption?.approved_remote_leave ||
      resolvedExemption?.ip_whitelisted ||
      overview?.approved_remote_leave ||
      overview?.client_ip_whitelisted ||
      overview?.ip_whitelist_matched
  );
  const hasSelfieExemption = Boolean(
    resolvedExemption?.exempt_selfie || resolvedExemption?.exempt_checkin
  );

  const isWithinRadius = distanceMeters !== null ? distanceMeters <= branchRadius : false;
  const isAccuracyValid =
    gpsAccuracy !== null ? gpsAccuracy <= Math.max(20, Number(policy.max_gps_accuracy_meters || 150)) : false;

  const isStrictBlocked =
    policy.geofence_mode === 'strict_radius' &&
    !hasGpsExemption &&
    Boolean(activeBranch && activeBranch.gps_lat !== null && activeBranch.gps_lng !== null) &&
    (distanceMeters === null || !isWithinRadius || !isAccuracyValid);

  const isCheckOutMode = Boolean(
    overview?.today_log?.check_in_at && !overview?.today_log?.check_out_at
  );

  const captureSnapshot = (): string | null => {
    if (capturedSelfie) return capturedSelfie;
    const video = videoRef.current;
    if (!video || !cameraActive) return null;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    if (w <= 0 || h <= 0) return null;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
    setCapturedSelfie(dataUrl);
    stopCamera();
    return dataUrl;
  };

  const validateBeforeSubmit = (selfieUrl: string | null): boolean => {
    if (policy.require_selfie && !hasSelfieExemption && !selfieUrl) {
      toast.error('Chính sách doanh nghiệp yêu cầu chụp ảnh Selfie trực tiếp trước khi chấm công.');
      return false;
    }
    if (isStrictBlocked) {
      toast.error('Bạn đang nằm ngoài bán kính GPS cho phép hoặc độ chính xác GPS chưa đạt chuẩn.');
      return false;
    }
    if (
      policy.geofence_mode === 'warn_with_explanation' &&
      !hasGpsExemption &&
      (distanceMeters === null || !isWithinRadius) &&
      !note.trim()
    ) {
      toast.error('Vui lòng nhập lý do giải trình khi chấm công ngoài bán kính văn phòng.');
      return false;
    }
    return true;
  };

  const handleCheckInSubmit = async () => {
    const selfieUrl = captureSnapshot();
    if (!validateBeforeSubmit(selfieUrl)) return;

    setSubmitting(true);
    try {
      await apiRequest('/attendance/check-in', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          branch_id: activeBranch?.id || null,
          shift_id: overview?.active_shift?.id || null,
          latitude: gpsLat,
          longitude: gpsLng,
          accuracy_meters: gpsAccuracy,
          selfie_data_url: selfieUrl,
          note: note.trim() || null,
          device_info: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : 'Web Browser',
        },
      });
      toast.success('Đã ghi nhận Chấm công Vào Ca thành công!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thực hiện Check-in.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCheckOutConfirm = () => {
    const selfieUrl = captureSnapshot();
    if (!validateBeforeSubmit(selfieUrl)) return;
    setCheckoutConfirmOpen(true);
  };

  const executeCheckOutApi = async (): Promise<boolean> => {
    setSubmitting(true);
    try {
      await apiRequest('/attendance/check-out', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          latitude: gpsLat,
          longitude: gpsLng,
          accuracy_meters: gpsAccuracy,
          selfie_data_url: capturedSelfie,
          note: note.trim() || null,
        },
      });
      onSuccess?.();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thực hiện Check-out.'));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInit) {
    return <ModalBodySkeleton rows={4} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Policy Mode Banner */}
      <div
        style={{
          padding: '0.85rem 1.05rem',
          borderRadius: 16,
          background: '#F8FAFF',
          border: '1px solid #DBEAFE',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {policy.geofence_mode === 'flexible' && (
            <Badge tone="success" icon={<ShieldCheck size={12} />}>
              Chế độ thoải mái — Không khóa GPS
            </Badge>
          )}
          {policy.geofence_mode === 'warn_with_explanation' && (
            <Badge tone="warning" icon={<AlertTriangle size={12} />}>
              Cảnh báo ngoài vùng — Cho phép kèm giải trình
            </Badge>
          )}
          {policy.geofence_mode === 'strict_radius' && (
            <Badge tone="primary" icon={<MapPin size={12} />}>
              Khóa bán kính GPS nghiêm ngặt ({branchRadius}m)
            </Badge>
          )}

          {hasGpsExemption && (
            <Badge tone="info">
              Miễn khóa GPS ({overview?.exemption?.reason_label || 'Đặc cách / WFH / IP Văn phòng'})
            </Badge>
          )}
        </div>

        <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
          Ca: <strong>{overview?.active_shift?.name || 'Hành chính'}</strong> (
          {overview?.active_shift?.start_time?.slice(0, 5) || '08:30'} –{' '}
          {overview?.active_shift?.end_time?.slice(0, 5) || '17:30'})
        </div>
      </div>

      {/* Camera + GPS Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {/* Selfie Camera Panel */}
        <Card title="1. Camera Selfie AI Xác Thực" padding="0.95rem 1.05rem">
          <div
            style={{
              width: '100%',
              height: 215,
              borderRadius: 14,
              background: '#0F172A',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {capturedSelfie ? (
              <img
                src={capturedSelfie}
                alt="Ảnh chụp chấm công"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : cameraActive ? (
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#CBD5E1', fontSize: '0.8rem' }}>
                <Camera size={28} style={{ margin: '0 auto 8px', opacity: 0.8 }} />
                <div>{cameraError || 'Đang khởi tạo luồng Camera trực tiếp...'}</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 10 }}>
            {capturedSelfie ? (
              <button
                type="button"
                onClick={() => void startCamera()}
                className="btn secondary"
                style={{ height: 40, flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <RefreshCw size={14} /> Chụp lại ảnh
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const snap = captureSnapshot();
                  if (!snap) void startCamera();
                }}
                className="btn secondary"
                style={{ height: 40, flex: 1, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Camera size={14} /> {cameraActive ? 'Chụp khung hình ngay' : 'Bật lại Camera'}
              </button>
            )}
          </div>
        </Card>

        {/* Live Haversine GPS Panel */}
        <Card
          title="2. Định vị Vệ tinh GPS & Bán kính"
          actions={
            <button
              type="button"
              onClick={requestRealBrowserGps}
              className="btn secondary"
              style={{ height: 34, padding: '0 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Navigation size={12} color="#1E40FF" /> {gpsLoading ? 'Đang dò...' : 'Định vị lại'}
            </button>
          }
          padding="0.95rem 1.05rem"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(overview?.branches?.length || 0) > 1 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Điểm chấm công Chi nhánh
                </label>
                <select
                  value={activeBranch?.id || ''}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  disabled={!policy.allow_any_branch_checkin && Boolean(overview?.active_branch?.id)}
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 0.75rem',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.82rem',
                  }}
                >
                  {(overview?.branches || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Bán kính {b.gps_radius_meters}m)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {gpsError ? (
              <div
                style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: 12,
                  background: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.24)',
                  fontSize: '0.79rem',
                  color: '#B91C1C',
                  lineHeight: 1.45,
                }}
              >
                <strong>Chưa có tọa độ GPS thật:</strong> {gpsError}
              </div>
            ) : gpsLat !== null && gpsLng !== null ? (
              <div
                style={{
                  padding: '0.8rem 0.95rem',
                  borderRadius: 12,
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: 700 }}>
                  Tọa độ thật: {gpsLat.toFixed(6)}, {gpsLng.toFixed(6)}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <Badge tone={isAccuracyValid ? 'success' : 'warning'}>
                    Sai số GPS: ±{gpsAccuracy ?? 0}m / tối đa {policy.max_gps_accuracy_meters}m
                  </Badge>
                  {distanceMeters !== null && (
                    <Badge tone={isWithinRadius ? 'primary' : 'danger'}>
                      {isWithinRadius
                        ? `Còn ${Math.max(0, branchRadius - distanceMeters)}m / Bán kính ${branchRadius}m (Cách ${distanceMeters}m)`
                        : `Ngoài vùng +${distanceMeters - branchRadius}m / Bán kính ${branchRadius}m`}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Đang xác thực tọa độ GPS trực tiếp từ trình duyệt...
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Ghi chú / Giải trình vị trí (nếu đi gặp khách hàng / ngoài vùng)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú công tác hoặc lý do..."
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 0.85rem',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '0.84rem',
                }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Strict Geofence Block Notice */}
      {isStrictBlocked && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 14,
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.28)',
            color: '#DC2626',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={17} />
          Chế độ Khóa Bán kính GPS Nghiêm ngặt đang bật: Không thể gửi chấm công khi chưa có GPS hợp lệ trong phạm vi{' '}
          {branchRadius}m của {activeBranch?.name || 'Chi nhánh'}.
        </div>
      )}

      {/* Footer Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingTop: 4 }}>
        <div style={{ fontSize: '0.8rem', color: '#475569' }}>
          {overview?.today_log?.check_in_at ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle2 size={14} color="#059669" /> Đã vào ca lúc{' '}
              <strong>{formatIsoOrHmToHm(overview.today_log.check_in_at)}</strong>
              {overview.today_log.check_out_at
                ? ` • Đã ra ca lúc ${formatIsoOrHmToHm(overview.today_log.check_out_at)}`
                : ''}
            </span>
          ) : (
            <span>Chưa ghi nhận lượt vào ca hôm nay</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44, padding: '0 1.2rem' }}>
            Đóng
          </button>

          {isCheckOutMode ? (
            <button
              type="button"
              disabled={submitting || isStrictBlocked}
              onClick={handleOpenCheckOutConfirm}
              style={{
                height: 44,
                padding: '0 1.4rem',
                borderRadius: 12,
                border: 'none',
                background: isStrictBlocked ? '#94A3B8' : '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.86rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                cursor: isStrictBlocked ? 'not-allowed' : 'pointer',
              }}
            >
              <LogOut size={16} /> Chấm công Ra Ca
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || isStrictBlocked}
              onClick={() => void handleCheckInSubmit()}
              style={{
                height: 44,
                padding: '0 1.45rem',
                borderRadius: 12,
                border: 'none',
                background: isStrictBlocked ? '#94A3B8' : '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.86rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                cursor: isStrictBlocked ? 'not-allowed' : 'pointer',
                boxShadow: isStrictBlocked ? 'none' : '0 6px 18px rgba(30, 64, 255, 0.25)',
              }}
            >
              <LogIn size={16} /> {submitting ? 'Đang xác thực...' : 'Chấm công Vào Ca'}
            </button>
          )}
        </div>
      </div>

      <CheckOutConfirmModal
        isOpen={checkoutConfirmOpen}
        onClose={() => setCheckoutConfirmOpen(false)}
        onConfirm={executeCheckOutApi}
        capturedImage={capturedSelfie}
        userName={user?.name}
        checkInTime={overview?.today_log?.check_in_at}
        shiftStartTime={overview?.active_shift?.start_time || '08:30'}
        shiftEndTime={overview?.active_shift?.end_time || '17:30'}
        breakMinutes={overview?.active_shift?.break_minutes ?? 60}
        branchName={activeBranch?.name}
        submitting={submitting}
      />
    </div>
  );
};

export const SmartCheckInModal: React.FC<SmartCheckInModalProps> = ({ isOpen, onClose, onSuccess }) => {
  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Chấm Công Nhanh Thông Minh (AI Camera & GPS Haversine)"
      width={780}
    >
      {isOpen && <SmartCheckInInner onClose={onClose} onSuccess={onSuccess} />}
    </CustomModal>
  );
};

export default SmartCheckInModal;
