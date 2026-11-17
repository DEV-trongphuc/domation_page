import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coffee,
  LogOut,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { computeNetWorkedShiftSummary } from './hrmTypes';

export interface CheckOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean | void>;
  capturedImage?: string | null;
  userName?: string;
  checkInTime?: string | null;
  shiftStartTime?: string;
  shiftEndTime?: string;
  breakMinutes?: number;
  branchName?: string | null;
  submitting?: boolean;
}

const CheckOutConfirmInner: React.FC<Omit<CheckOutConfirmModalProps, 'isOpen'>> = ({
  onClose,
  onConfirm,
  capturedImage,
  userName,
  checkInTime,
  shiftStartTime = '08:30',
  shiftEndTime = '17:30',
  breakMinutes = 60,
  branchName,
  submitting = false,
}) => {
  const [nowMs, setNowMs] = useState<number>(() => new Date().getTime());
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(new Date().getTime());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const summary = computeNetWorkedShiftSummary({
    checkInIsoOrHm: checkInTime,
    nowMs,
    shiftStartHm: shiftStartTime,
    shiftEndHm: shiftEndTime,
    breakMinutes,
  });

  const liveClockSeconds = new Date(nowMs).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const handleConfirmClick = async () => {
    if (submitting || isSuccess) return;
    const ok = await onConfirm();
    if (ok !== false) {
      setIsSuccess(true);
      window.setTimeout(() => {
        onClose();
      }, 1700);
    }
  };

  return (
    <div
      onClick={submitting || isSuccess ? undefined : onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(490px, 95vw)',
          background: '#FFFFFF',
          borderRadius: 24,
          border: '1px solid #E2E8F0',
          boxShadow: '0 24px 56px rgba(30, 64, 255, 0.22)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {!isSuccess && (
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid #E2E8F0',
              background: '#F8F9FA',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            <X size={16} />
          </button>
        )}

        {isSuccess ? (
          <div
            style={{
              padding: '2.5rem 1.75rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 78,
                height: 78,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 28px rgba(16, 185, 129, 0.35)',
              }}
            >
              <CheckCircle2 size={42} />
            </div>
            <Badge tone="success" icon={<Sparkles size={12} />}>
              HOÀN THÀNH CA LÀM VIỆC
            </Badge>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
              Chấm Công Ra Ca Thành Công!
            </h3>
            <div style={{ fontSize: '0.84rem', color: '#64748B', lineHeight: 1.5 }}>
              Đã ghi nhận giờ ra ca lúc <strong>{summary.currentHm}</strong> • Thời lượng thực tế:{' '}
              <strong style={{ color: '#1E40FF' }}>{summary.netWorkedLabel}</strong>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1.75rem 1.6rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Top Header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 18,
                  background: 'rgba(30, 64, 255, 0.10)',
                  border: '1px solid rgba(30, 64, 255, 0.22)',
                  color: '#1E40FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogOut size={27} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                Xác Nhận Chấm Công Ra Ca
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                {userName ? `${userName} • ` : ''}
                {summary.currentDateLabel}
              </div>
            </div>

            {/* Live Clock & Selfie Preview */}
            <div
              style={{
                padding: '0.95rem 1.1rem',
                borderRadius: 16,
                background: '#F8FAFF',
                border: '1px solid #DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Đồng hồ thời gian thực
                </div>
                <div
                  className="autodata-tabular-nums"
                  style={{ fontSize: '1.55rem', fontWeight: 800, color: '#1E40FF', marginTop: 2 }}
                >
                  {liveClockSeconds}
                </div>
                {branchName && (
                  <div style={{ fontSize: '0.76rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <MapPin size={12} color="#1E40FF" /> {branchName}
                  </div>
                )}
              </div>

              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Selfie ra ca"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 14,
                    objectFit: 'cover',
                    border: '2px solid #1E40FF',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>

            {/* Shift Breakdown Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
                background: '#F8F9FA',
                padding: '0.95rem',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Giờ vào ca hôm nay</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                  {summary.checkInHm}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Khung ca tiêu chuẩn</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                  {shiftStartTime.slice(0, 5)} – {shiftEndTime.slice(0, 5)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Coffee size={12} color="#0284C7" /> Khấu trừ nghỉ trưa
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0284C7', marginTop: 2 }}>
                  -{breakMinutes} phút ({summary.lunchDeductedMinutes}p thực trừ)
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} color="#059669" /> Thời lượng ròng (Net)
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#059669', marginTop: 2 }}>
                  {summary.netWorkedLabel}
                </div>
              </div>
            </div>

            {/* Early Leave Warning */}
            {summary.isEarlyLeave && (
              <div
                style={{
                  padding: '0.8rem 0.95rem',
                  borderRadius: 14,
                  background: 'rgba(217, 119, 6, 0.10)',
                  border: '1px solid rgba(217, 119, 6, 0.28)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: '0.8rem', color: '#92400E', lineHeight: 1.45 }}>
                  <strong>Cảnh báo ra ca sớm {summary.earlyLeaveMinutes} phút</strong> so với giờ kết thúc ca quy định (
                  {shiftEndTime.slice(0, 5)}). Hệ thống sẽ ghi nhận thời gian thực tế lên Bảng công.
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="btn secondary"
                style={{ height: 44, padding: '0 1.2rem' }}
              >
                Quay lại
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleConfirmClick()}
                style={{
                  height: 44,
                  padding: '0 1.45rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 18px rgba(30, 64, 255, 0.25)',
                }}
              >
                <LogOut size={16} /> {submitting ? 'Đang ghi nhận...' : 'Xác nhận Ra Ca'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const CheckOutConfirmModal: React.FC<CheckOutConfirmModalProps> = ({ isOpen, ...rest }) => {
  if (!isOpen || typeof document === 'undefined') return null;
  return createPortal(<CheckOutConfirmInner {...rest} />, document.body);
};

export default CheckOutConfirmModal;
