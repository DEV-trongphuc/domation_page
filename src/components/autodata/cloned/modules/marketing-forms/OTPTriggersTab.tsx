import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  KeyRound,
  Mail,
  Play,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, Table, type TableColumn } from '../../components/ui/AutoDataLoadingModal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type { OtpAuditItemDto, OtpAuditResponse } from './types';

interface OTPTriggersTabProps {
  fallbackSummary: { total_sent: number; verified_count: number };
  onParentReload: () => Promise<void>;
}

export const OTPTriggersTab: React.FC<OTPTriggersTabProps> = ({
  fallbackSummary,
  onParentReload,
}) => {
  const { token, tenantSlug } = useAuth();
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState<OtpAuditResponse | null>(null);

  // Sandbox Test State
  const [recipient, setRecipient] = useState('');
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [otpId, setOtpId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const loadAudit = useCallback(async () => {
    return apiRequest<OtpAuditResponse>('/marketing/forms/otp/audit', {
      token,
      tenantSlug,
    });
  }, [token, tenantSlug]);

  const refreshAudit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await loadAudit();
      setAuditData(res);
    } catch {
      // Fallback gracefully when audit table is empty or initializing
    } finally {
      setLoading(false);
    }
  }, [loadAudit]);

  useEffect(() => {
    let cancelled = false;
    loadAudit()
      .then((res) => {
        if (!cancelled) setAuditData(res);
      })
      .catch(() => {
        // Keep fallback summary if optional endpoint is still initializing
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadAudit]);

  const items: OtpAuditItemDto[] = auditData?.items || auditData?.logs || [];
  const totalSent = auditData?.summary?.total_sent ?? fallbackSummary.total_sent;
  const verifiedCount = auditData?.summary?.verified_count ?? fallbackSummary.verified_count;
  const verifyRate =
    totalSent > 0 ? Math.round((verifiedCount / totalSent) * 100) : 0;

  const emailSent =
    auditData?.by_channel?.email?.sent ??
    auditData?.summary?.email_count ??
    items.filter((x) => x.channel === 'email').length;
  const smsSent =
    auditData?.by_channel?.sms?.sent ??
    auditData?.summary?.sms_count ??
    items.filter((x) => x.channel === 'sms').length;
  const channelTotal = Math.max(1, emailSent + smsSent);

  const maxAttempts = auditData?.rate_limit_policy?.max_attempts ?? 5;
  const ttlMinutes = Math.round((auditData?.rate_limit_policy?.ttl_seconds ?? 300) / 60);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://domation.vn';

  const handleSandboxSend = async () => {
    if (!recipient.trim()) {
      toast.error('Vui lòng nhập SĐT hoặc Email nhận mã OTP thử nghiệm.');
      return;
    }
    setSending(true);
    try {
      const res = await apiRequest<{ otp_id: string; sandbox_otp_code?: string }>(
        '/public/marketing/otp/send',
        {
          method: 'POST',
          tenantSlug,
          body: {
            tenant_slug: tenantSlug,
            recipient: recipient.trim(),
            channel,
            purpose: 'otp_sandbox_audit',
          },
        }
      );
      setOtpId(res.otp_id);
      if (res.sandbox_otp_code) {
        setOtpCode(res.sandbox_otp_code);
        toast.success(`Đã phát hành mã OTP Sandbox: ${res.sandbox_otp_code}`);
      } else {
        toast.success('Đã gửi mã OTP tới người nhận!');
      }
      await refreshAudit();
      await onParentReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi mã OTP thử nghiệm.'));
    } finally {
      setSending(false);
    }
  };

  const handleSandboxVerify = async () => {
    if (!otpCode.trim()) {
      toast.error('Vui lòng nhập mã OTP 6 chữ số để kiểm tra.');
      return;
    }
    setVerifying(true);
    try {
      await apiRequest('/public/marketing/otp/verify', {
        method: 'POST',
        tenantSlug,
        body: {
          tenant_slug: tenantSlug,
          otp_id: otpId || undefined,
          recipient: recipient.trim() || undefined,
          code: otpCode.trim(),
        },
      });
      toast.success('Xác thực OTP thành công! Đã cập nhật Nhật ký Audit.');
      await refreshAudit();
      await onParentReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Mã OTP không chính xác hoặc đã vượt giới hạn thử.'));
      await refreshAudit();
    } finally {
      setVerifying(false);
    }
  };

  const columns: Array<TableColumn<OtpAuditItemDto>> = [
    {
      key: 'recipient',
      header: 'Người Nhận (Masked)',
      render: (r) => (
        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>
          {r.recipient}
        </span>
      ),
    },
    {
      key: 'channel',
      header: 'Kênh Gửi',
      render: (r) =>
        r.channel === 'sms' ? (
          <Badge tone="info" icon={<Smartphone size={12} />}>SMS</Badge>
        ) : (
          <Badge tone="primary" icon={<Mail size={12} />}>Email</Badge>
        ),
    },
    {
      key: 'purpose',
      header: 'Mục Đích',
      render: (r) => <span style={{ fontSize: '0.78rem', color: '#475569' }}>{r.purpose || 'form_submit'}</span>,
    },
    {
      key: 'attempts',
      header: 'Số Lần Nhập Sai',
      align: 'center',
      render: (r) => (
        <Badge tone={r.attempts >= maxAttempts ? 'danger' : r.attempts > 0 ? 'warning' : 'neutral'}>
          {r.attempts} / {maxAttempts}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái Xác Thực',
      render: (r) =>
        r.verified ? (
          <Badge tone="success" icon={<CheckCircle2 size={12} />}>Đã xác thực</Badge>
        ) : r.attempts >= maxAttempts ? (
          <Badge tone="danger">Khóa Rate-Limit</Badge>
        ) : (
          <Badge tone="warning">Chờ nhập / Hết hạn</Badge>
        ),
    },
    {
      key: 'time',
      header: 'Thời Gian Sinh Mã',
      align: 'right',
      render: (r) => <span style={{ fontSize: '0.76rem', color: '#64748B' }}>{formatShortDate(r.created_at)}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: '0.85rem' }}>
        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>Tổng Mã OTP Đã Phát Hành</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
            {totalSent.toLocaleString('vi-VN')} mã
          </div>
        </Card>
        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>Xác Thực Hợp Lệ</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {verifiedCount.toLocaleString('vi-VN')} lượt
          </div>
        </Card>
        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>Tỉ Lệ Chuyển Đổi OTP</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {verifyRate}%
          </div>
        </Card>
        <Card padding="1rem 1.2rem">
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>Chính Sách Chống Brute-Force</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <Badge tone="primary" icon={<ShieldCheck size={12} />}>Max {maxAttempts} lần</Badge>
            <Badge tone="info" icon={<Clock size={12} />}>TTL {ttlMinutes} phút</Badge>
          </div>
        </Card>
      </div>

      {/* Channel Breakdown + Live Sandbox */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.9fr) minmax(0, 1.3fr)', gap: '1rem' }}>
        <Card title="Phân Bổ Kênh Gửi OTP" subtitle="Mã băm một chiều HMAC-SHA256 không lưu cleartext">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: 5 }}>
                <span style={{ color: '#1E40FF' }}>Email Transactional</span>
                <span>{emailSent} lượt ({Math.round((emailSent / channelTotal) * 100)}%)</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((emailSent / channelTotal) * 100)}%`, background: '#1E40FF', borderRadius: 999 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: 5 }}>
                <span style={{ color: '#0284C7' }}>SMS Brandname / ZNS</span>
                <span>{smsSent} lượt ({Math.round((smsSent / channelTotal) * 100)}%)</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((smsSent / channelTotal) * 100)}%`, background: '#0284C7', borderRadius: 999 }} />
              </div>
            </div>

            <div style={{ padding: '0.75rem', borderRadius: 12, background: '#F8F9FA', border: '1px solid #E2E8F0', fontSize: '0.74rem', color: '#475569' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Public OTP Endpoints:</strong>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(`${originUrl}/api/v1/public/marketing/otp/send`);
                    toast.success('Đã sao chép URL gửi OTP!');
                  }}
                  style={{ border: 'none', background: 'transparent', color: '#1E40FF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700 }}
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
              <div style={{ marginTop: 4, fontFamily: 'monospace', fontSize: '0.7rem' }}>POST /api/v1/public/marketing/otp/send</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>POST /api/v1/public/marketing/otp/verify</div>
            </div>
          </div>
        </Card>

        <Card
          title="Sandbox Kiểm Thử Sinh & Xác Thực OTP Trực Tiếp"
          subtitle="Kiểm tra luồng sinh mã 6 số, giới hạn 5 lần nhập sai và ghi nhận vào bảng Audit bên dưới"
          actions={
            <button type="button" onClick={() => void refreshAudit()} className="btn secondary sm" style={{ height: 34 }}>
              <RefreshCw size={13} /> Làm mới Audit
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 8 }}>
              <select
                className="form-input"
                style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                value={channel}
                onChange={(e) => setChannel(e.target.value as 'sms' | 'email')}
              >
                <option value="sms">Kênh SMS</option>
                <option value="email">Kênh Email</option>
              </select>
              <input
                className="form-input"
                style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                placeholder={channel === 'sms' ? 'Nhập SĐT (VD: 0909123456)...' : 'Nhập Email (VD: khach@cty.vn)...'}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <button
                type="button"
                disabled={sending}
                onClick={() => void handleSandboxSend()}
                className="btn secondary"
                style={{ height: 44, color: '#1E40FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <KeyRound size={15} /> {sending ? 'Đang gửi...' : '1. Phát hành OTP'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
              <input
                className="form-input"
                style={{ height: 44, background: '#F8F9FA', border: '1px solid #DBEAFE', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.14em' }}
                placeholder="Nhập mã OTP 6 chữ số để xác thực..."
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
              />
              <button
                type="button"
                disabled={verifying}
                onClick={() => void handleSandboxVerify()}
                style={{
                  height: 44,
                  padding: '0 1.3rem',
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
                <Play size={14} /> {verifying ? 'Đang kiểm tra...' : '2. Xác Thực OTP'}
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <Table
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          emptyTitle="Chưa có nhật ký xác thực OTP"
          emptyDescription="Sử dụng khung Sandbox Kiểm thử phía trên hoặc gửi OTP từ Biểu mẫu công khai để xem nhật ký Audit."
        />
      )}
    </div>
  );
};

export default OTPTriggersTab;
