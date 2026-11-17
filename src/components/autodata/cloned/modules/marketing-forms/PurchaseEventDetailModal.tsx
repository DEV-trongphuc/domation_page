import React, { useEffect, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  KeyRound,
  Play,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  buildWebhookCurlSnippet,
  buildWebhookJsSnippet,
  type CustomEventDto,
  type EventDetailResponse,
} from './types';

interface PurchaseInnerProps {
  event: CustomEventDto;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}

const PurchaseEventDetailInner: React.FC<PurchaseInnerProps> = ({ event, onClose, onUpdated }) => {
  const { token, tenantSlug } = useAuth();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<CustomEventDto>(event);
  const [webhookSecret, setWebhookSecret] = useState<string>(
    () => event.webhook_secret || `whsec_pur_${event.id.slice(0, 12)}`
  );
  const [rotating, setRotating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sdkTab, setSdkTab] = useState<'curl' | 'js'>('curl');

  const [testName, setTestName] = useState('');
  const [testPhone, setTestPhone] = useState('0909888999');
  const [testEmail, setTestEmail] = useState('');
  const [testAmount, setTestAmount] = useState('4500000');
  const [testOrderCode, setTestOrderCode] = useState('ORD-2026-001');
  const [firing, setFiring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiRequest<EventDetailResponse>(`/marketing/forms/events/${event.id}`, { token, tenantSlug })
      .then((res) => {
        if (cancelled || !res) return;
        const resolved = res.event || (res.id ? (res as unknown as CustomEventDto) : null);
        if (resolved) setDetail((prev) => ({ ...prev, ...resolved }));
        const sec = res.webhook_secret || res.event?.webhook_secret;
        if (sec) setWebhookSecret(sec);
      })
      .catch(() => {
        // Keep initial row data if optional detail route not needed
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [event.id, token, tenantSlug]);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://domation.vn';

  const copyText = (text: string, key: string) => {
    void navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    toast.success('Đã sao chép vào bộ nhớ tạm!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRotateSecret = async () => {
    setRotating(true);
    try {
      const res = await apiRequest<{ webhook_secret?: string; secret?: string }>(
        `/marketing/forms/events/${detail.id}/rotate-secret`,
        {
          method: 'POST',
          token,
          tenantSlug,
        }
      );
      const nextSec = res?.webhook_secret || res?.secret;
      if (nextSec) setWebhookSecret(nextSec);
      toast.success('Đã xoay vòng khóa bảo mật Webhook Secret cho Purchase Event!');
      await onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xoay vòng Webhook Secret.'));
    } finally {
      setRotating(false);
    }
  };

  const handleTriggerPurchase = async () => {
    if (!testPhone.trim() && !testEmail.trim()) {
      toast.error('Vui lòng nhập SĐT hoặc Email khách mua hàng.');
      return;
    }
    const amountNum = Math.max(0, Math.round(Number(testAmount || 0)));
    setFiring(true);
    try {
      await apiRequest(`/marketing/forms/events/${detail.id}/trigger`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: testName.trim() || 'Khách Mua Hàng Thực Tế',
          phone: testPhone.trim() || undefined,
          email: testEmail.trim() || undefined,
          amount_vnd: amountNum,
          payload: {
            order_id: testOrderCode.trim() || 'ORD-SANDBOX',
            currency: 'VND',
            amount_vnd: amountNum,
          },
        },
      });
      setDetail((prev) => ({
        ...prev,
        trigger_count: prev.trigger_count + 1,
        total_revenue_vnd: prev.total_revenue_vnd + amountNum,
      }));
      toast.success(`Đã ghi nhận đơn hàng +${formatVnd(amountNum)} vào Doanh thu Hồ sơ 360° & Deal Won!`);
      await onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể kích hoạt sự kiện mua hàng.'));
    } finally {
      setFiring(false);
    }
  };

  if (loading) {
    return <ModalBodySkeleton rows={4} />;
  }

  const aov = detail.trigger_count > 0 ? Math.round(detail.total_revenue_vnd / detail.trigger_count) : 0;
  const curlCode = buildWebhookCurlSnippet(originUrl, detail, webhookSecret);
  const jsCode = buildWebhookJsSnippet(originUrl, detail, webhookSecret);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Revenue Attribution Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        <Card padding="0.85rem 1rem">
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Tổng Đơn Hàng Ghi Nhận</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E40FF', marginTop: 2 }}>
            {detail.trigger_count.toLocaleString('vi-VN')} đơn
          </div>
        </Card>
        <Card padding="0.85rem 1rem">
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Doanh Thu Phân Bổ (LTV)</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669', marginTop: 2 }}>
            {formatVnd(detail.total_revenue_vnd)}
          </div>
        </Card>
        <Card padding="0.85rem 1rem">
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Giá Trị Đơn Trung Bình (AOV)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: 3 }}>
            {formatVnd(aov)}
          </div>
        </Card>
      </div>

      <div style={{ padding: '0.8rem 1rem', borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
          <ShoppingBag size={15} color="#059669" />
          Event Key: <code style={{ color: '#1E40FF' }}>{detail.event_key}</code> — tự động cộng `leads.total_revenue_vnd` & phát `deal.won`
        </div>
        <Badge tone="success">Revenue Attribution Active</Badge>
      </div>

      {/* Webhook Secret & Rotation */}
      <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: '#FFFFFF', border: '1px solid #DBEAFE', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1E40FF', display: 'flex', alignItems: 'center', gap: 5 }}>
            <KeyRound size={14} /> Khóa Bảo Mật `X-Domation-Webhook-Secret`
          </div>
          <code style={{ fontSize: '0.78rem', color: '#0F172A', wordBreak: 'break-all' }}>{webhookSecret}</code>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => copyText(webhookSecret, 'secret')}
            className="btn secondary sm"
            style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            {copiedKey === 'secret' ? <Check size={13} /> : <Copy size={13} />} Copy Secret
          </button>
          <button
            type="button"
            disabled={rotating}
            onClick={() => void handleRotateSecret()}
            className="btn secondary sm"
            style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <RefreshCw size={13} /> {rotating ? 'Đang xoay...' : 'Rotate Secret'}
          </button>
        </div>
      </div>

      {/* SDK Snippets */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setSdkTab('curl')}
              className="btn secondary sm"
              style={{ height: 32, color: sdkTab === 'curl' ? '#1E40FF' : '#475569', borderColor: sdkTab === 'curl' ? '#1E40FF' : '#E2E8F0' }}
            >
              cURL Webhook
            </button>
            <button
              type="button"
              onClick={() => setSdkTab('js')}
              className="btn secondary sm"
              style={{ height: 32, color: sdkTab === 'js' ? '#1E40FF' : '#475569', borderColor: sdkTab === 'js' ? '#1E40FF' : '#E2E8F0' }}
            >
              <Code2 size={13} /> Checkout JS SDK
            </button>
          </div>
          <button
            type="button"
            onClick={() => copyText(sdkTab === 'curl' ? curlCode : jsCode, 'code')}
            className="btn secondary sm"
            style={{ height: 32, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            {copiedKey === 'code' ? <Check size={13} /> : <Copy size={13} />} Sao chép mã tích hợp
          </button>
        </div>
        <pre
          style={{
            margin: 0,
            background: '#0F172A',
            color: '#E2E8F0',
            borderRadius: 12,
            padding: '0.85rem',
            fontSize: '0.73rem',
            lineHeight: 1.5,
            overflowX: 'auto',
            maxHeight: 185,
          }}
        >
          {sdkTab === 'curl' ? curlCode : jsCode}
        </pre>
      </div>

      {/* Live Test Purchase Trigger */}
      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
          Giả Lập Đơn Hàng Thành Công & Đối Soát Doanh Thu
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
          <input
            className="form-input"
            style={{ height: 40, background: '#FFFFFF' }}
            placeholder="Tên người mua..."
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
          />
          <input
            className="form-input"
            style={{ height: 40, background: '#FFFFFF' }}
            placeholder="SĐT người mua..."
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
          />
          <input
            className="form-input"
            style={{ height: 40, background: '#FFFFFF' }}
            placeholder="Email (Tùy chọn)..."
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          <input
            className="form-input"
            style={{ height: 40, background: '#FFFFFF', fontFamily: 'monospace' }}
            placeholder="Mã đơn hàng..."
            value={testOrderCode}
            onChange={(e) => setTestOrderCode(e.target.value)}
          />
          <input
            type="number"
            className="form-input"
            style={{ height: 40, background: '#FFFFFF', fontWeight: 700, color: '#059669' }}
            placeholder="Giá trị đơn VNĐ..."
            value={testAmount}
            onChange={(e) => setTestAmount(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>
            Đóng
          </button>
          <button
            type="button"
            disabled={firing}
            onClick={() => void handleTriggerPurchase()}
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
            <Play size={14} /> {firing ? 'Đang ghi nhận...' : 'Bắn Đơn Hàng Thử Nghiệm'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface PurchaseEventDetailModalProps {
  event: CustomEventDto | null;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}

export const PurchaseEventDetailModal: React.FC<PurchaseEventDetailModalProps> = ({
  event,
  onClose,
  onUpdated,
}) => (
  <CustomModal
    isOpen={Boolean(event)}
    onClose={onClose}
    title={`Chi Tiết Purchase Event & Doanh Thu — ${event?.event_name || ''}`}
    width={820}
  >
    {event && (
      <PurchaseEventDetailInner
        key={event.id}
        event={event}
        onClose={onClose}
        onUpdated={onUpdated}
      />
    )}
  </CustomModal>
);

export default PurchaseEventDetailModal;
