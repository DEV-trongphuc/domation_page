import React, { useEffect, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  KeyRound,
  Play,
  RefreshCw,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  buildWebhookCurlSnippet,
  buildWebhookJsSnippet,
  type CustomEventDto,
  type EventDetailResponse,
} from './types';

interface DetailInnerProps {
  event: CustomEventDto;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}

const CustomEventDetailInner: React.FC<DetailInnerProps> = ({ event, onClose, onUpdated }) => {
  const { token, tenantSlug } = useAuth();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<CustomEventDto>(event);
  const [webhookSecret, setWebhookSecret] = useState<string>(
    () => event.webhook_secret || `whsec_dom_${event.id.slice(0, 12)}`
  );
  const [rotating, setRotating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sdkTab, setSdkTab] = useState<'curl' | 'js'>('curl');

  const [testName, setTestName] = useState('');
  const [testPhone, setTestPhone] = useState('0909123456');
  const [testEmail, setTestEmail] = useState('');
  const [testJson, setTestJson] = useState('{"source_page":"/bang-gia","feature":"pricing_calculator"}');
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
        // Keep initial event row when detail inspection endpoint is optional
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
      const nextSecret = res?.webhook_secret || res?.secret;
      if (nextSecret) {
        setWebhookSecret(nextSecret);
      }
      toast.success('Đã xoay vòng khóa bảo mật Webhook Secret mới!');
      await onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xoay vòng khóa Webhook Secret.'));
    } finally {
      setRotating(false);
    }
  };

  const handleTriggerTest = async () => {
    if (!testPhone.trim() && !testEmail.trim()) {
      toast.error('Vui lòng nhập ít nhất Số điện thoại hoặc Email để định danh khách hàng.');
      return;
    }
    let parsedPayload: Record<string, unknown> = {};
    if (testJson.trim()) {
      try {
        parsedPayload = JSON.parse(testJson) as Record<string, unknown>;
      } catch {
        toast.error('JSON Payload thử nghiệm không hợp lệ.');
        return;
      }
    }

    setFiring(true);
    try {
      await apiRequest(`/marketing/forms/events/${detail.id}/trigger`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: testName.trim() || 'Khách Thử Nghiệm Event',
          phone: testPhone.trim() || undefined,
          email: testEmail.trim() || undefined,
          payload: parsedPayload,
        },
      });
      setDetail((prev) => ({ ...prev, trigger_count: prev.trigger_count + 1 }));
      toast.success('Đã kích hoạt Custom Event & ghi nhận vào Timeline 360° + Automation Flow!');
      await onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Kích hoạt thử sự kiện thất bại.'));
    } finally {
      setFiring(false);
    }
  };

  if (loading) {
    return <ModalBodySkeleton rows={4} />;
  }

  const curlCode = buildWebhookCurlSnippet(originUrl, detail, webhookSecret);
  const jsCode = buildWebhookJsSnippet(originUrl, detail, webhookSecret);
  const schemaEntries = Object.entries(detail.schema_json || {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPI & Schema Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        <Card padding="0.85rem 1rem">
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Mã API Event Key</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E40FF', fontFamily: 'monospace', marginTop: 4 }}>
            {detail.event_key}
          </div>
        </Card>
        <Card padding="0.85rem 1rem">
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Tổng Lượt Kích Hoạt</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
            {detail.trigger_count.toLocaleString('vi-VN')} lượt
          </div>
        </Card>
        <Card padding="0.85rem 1rem">
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Cập Nhật Gần Nhất</div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginTop: 5 }}>
            {formatShortDate(detail.updated_at || detail.created_at)}
          </div>
        </Card>
      </div>

      {/* Schema JSON Inspector */}
      <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Zap size={14} color="#1E40FF" /> Cấu Trúc Schema Sự Kiện (`schema_json`)
          </span>
          <Badge tone="primary">Custom Behavioral Trigger</Badge>
        </div>
        {schemaEntries.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {schemaEntries.map(([k, v]) => (
              <Badge key={k} tone="neutral">
                {k}: {String(v)}
              </Badge>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
            Chấp nhận Payload động linh hoạt (`phone` hoặc `email` + `payload: Record&lt;string, unknown&gt;`).
          </div>
        )}
      </div>

      {/* Webhook Secret & Rotation */}
      <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: '#FFFFFF', border: '1px solid #DBEAFE', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1E40FF', display: 'flex', alignItems: 'center', gap: 5 }}>
            <KeyRound size={14} /> Header xác thực `X-Domation-Webhook-Secret`
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

      {/* cURL / JS SDK Code Block */}
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
              <Code2 size={13} /> Node / JS SDK
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

      {/* Live Test Trigger */}
      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
          Bắn Thử Sự Kiện Trực Tiếp (`POST /marketing/forms/events/{detail.id}/trigger`)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
          <input
            className="form-input"
            style={{ height: 40, background: '#FFFFFF' }}
            placeholder="Họ tên khách hàng..."
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
          />
          <input
            className="form-input"
            style={{ height: 40, background: '#FFFFFF' }}
            placeholder="SĐT (VD: 0909123456)..."
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
        </div>
        <input
          className="form-input"
          style={{ height: 40, background: '#F8F9FA', fontFamily: 'monospace', fontSize: '0.76rem' }}
          value={testJson}
          onChange={(e) => setTestJson(e.target.value)}
          placeholder='JSON Payload: {"action":"watched_demo"}'
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>
            Đóng
          </button>
          <button
            type="button"
            disabled={firing}
            onClick={() => void handleTriggerTest()}
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
            <Play size={14} /> {firing ? 'Đang bắn...' : 'Kích Hoạt Thử Custom Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface CustomEventDetailModalProps {
  event: CustomEventDto | null;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}

export const CustomEventDetailModal: React.FC<CustomEventDetailModalProps> = ({
  event,
  onClose,
  onUpdated,
}) => (
  <CustomModal
    isOpen={Boolean(event)}
    onClose={onClose}
    title={`Chi Tiết Custom Event & Webhook — ${event?.event_name || ''}`}
    width={820}
  >
    {event && (
      <CustomEventDetailInner
        key={event.id}
        event={event}
        onClose={onClose}
        onUpdated={onUpdated}
      />
    )}
  </CustomModal>
);

export default CustomEventDetailModal;
