import React, { useState } from 'react';
import { CheckCircle2, Receipt, ShieldCheck, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { formatVoucherRewardLabel, type PosRedeemResponseDto } from './voucherTypes';

export interface PosRedeemPanelProps {
  onRedeemed?: () => void;
}

interface SessionRedeemReceipt extends PosRedeemResponseDto {
  netPayableVnd: number;
  discountAmountVnd: number;
  redeemedTimeLabel: string;
}

export const PosRedeemPanel: React.FC<PosRedeemPanelProps> = ({ onRedeemed }) => {
  const { token, tenantSlug } = useAuth();
  const { terminology } = useEntitlement();

  const [code, setCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [orderVnd, setOrderVnd] = useState('1500000');
  const [note, setNote] = useState('Gạch mã tại quầy thu ngân POS / Đơn hàng SO');
  const [submitting, setSubmitting] = useState(false);
  const [receipts, setReceipts] = useState<SessionRedeemReceipt[]>([]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Vui lòng nhập hoặc quét mã Voucher cần đối soát.');
      return;
    }
    setSubmitting(true);
    try {
      const orderNum = Math.max(0, Number(orderVnd || 0));
      const res = await apiRequest<PosRedeemResponseDto>('/marketing/vouchers/redeem', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          code: code.trim().toUpperCase(),
          customer_name: customerName.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          order_vnd: orderNum,
          note: note.trim() || undefined,
        },
      });

      const discountAmountVnd =
        res.discount_type === 'percentage'
          ? Math.round((orderNum * res.discount_value) / 100)
          : res.discount_type === 'fixed_vnd'
            ? Math.min(orderNum, res.discount_value)
            : 0;
      const netPayableVnd = Math.max(0, orderNum - discountAmountVnd);
      const timeLabel = new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });

      setReceipts((prev) => [
        {
          ...res,
          discountAmountVnd,
          netPayableVnd,
          redeemedTimeLabel: timeLabel,
        },
        ...prev.slice(0, 9),
      ]);

      toast.success(`Đã gạch mã ${res.code} (${res.pool_name}) & ghi vào Timeline 360°!`);
      setCode('');
      onRedeemed?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Đối soát / gạch mã Voucher thất bại.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(300px, 1fr)', gap: '1.15rem', alignItems: 'start' }}>
      <Card
        title="Quầy Đối Soát & Gạch Mã Nhanh (POS / Đơn Hàng SO)"
        subtitle={`Kiểm tra hạn dùng, giá trị đơn tối thiểu, chống dùng trùng 2 lần và tự động khâu vào Hồ sơ ${terminology.customerLabel} 360°`}
        actions={
          <Badge tone="primary" icon={<ShieldCheck size={12} />}>
            Anti-Replay Lock
          </Badge>
        }
      >
        <form onSubmit={(e) => void handleRedeem(e)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Mã Voucher khách xuất trình / Quét Barcode *
              </label>
              <input
                className="form-input"
                style={{
                  height: 44,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                  color: '#1E40FF',
                }}
                placeholder="VD: DOM-VIP889..."
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Tổng giá trị hóa đơn / Đơn hàng SO (VNĐ)
              </label>
              <input
                type="number"
                min={0}
                className="form-input"
                style={{ height: 44, fontWeight: 700 }}
                value={orderVnd}
                onChange={(e) => setOrderVnd(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Tên {terminology.customerLabel}
              </label>
              <input
                className="form-input"
                style={{ height: 44 }}
                placeholder="Nguyễn Minh Anh..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Số điện thoại (Khâu 360°)
              </label>
              <input
                className="form-input"
                style={{ height: 44 }}
                placeholder="0909..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Email (Tùy chọn)
              </label>
              <input
                type="email"
                className="form-input"
                style={{ height: 44 }}
                placeholder="khach@congty.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              Ghi chú thu ngân / Mã chứng từ SO
            </label>
            <input
              className="form-input"
              style={{ height: 44 }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                height: 44,
                padding: '0 1.4rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                cursor: 'pointer',
              }}
            >
              <CheckCircle2 size={16} />
              {submitting ? 'Đang đối soát & khóa mã...' : 'Xác Nhận Hợp Lệ & Gạch Mã Ngay'}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Phiếu Đối Soát Vừa Thực Hiện" subtitle="Nhật ký quy đổi ưu đãi trong phiên thu ngân">
        {receipts.length === 0 ? (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: '#64748B',
              fontSize: '0.82rem',
              borderRadius: 14,
              border: '1px dashed #CBD5E1',
            }}
          >
            <Receipt size={24} color="#94A3B8" style={{ marginBottom: 6 }} />
            <div>Nhập mã ưu đãi bên trái để kiểm tra hiệu lực và tính số tiền giảm trừ tự động.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {receipts.map((r, idx) => (
              <div
                key={`${r.code}-${idx}`}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 14,
                  background: idx === 0 ? '#EFF6FF' : '#F8FAFC',
                  border: idx === 0 ? '1.5px solid #93C5FD' : '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ fontWeight: 800, color: '#1E40FF', fontSize: '0.9rem' }}>{r.code}</code>
                  <Badge tone="success">Đã gạch • {r.redeemedTimeLabel}</Badge>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{r.pool_name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#475569' }}>
                  <span>Ưu đãi: {formatVoucherRewardLabel(r.discount_type, r.discount_value, formatVnd)}</span>
                  <strong style={{ color: '#059669' }}>Còn thu: {formatVnd(r.netPayableVnd)}</strong>
                </div>
                {r.lead_id && (
                  <div style={{ fontSize: '0.72rem', color: '#1E40FF', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <UserCheck size={12} /> Đã ghi nhận vào Timeline 360°
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PosRedeemPanel;
