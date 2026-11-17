import React, { useEffect, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  KeyRound,
  Layout,
  Maximize2,
  MessageSquare,
  PanelBottom,
  Play,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  buildFormEmbedSnippet,
  resolveFormTheme,
  type EmbedConfigResponse,
  type EmbedMode,
  type MktFormDto,
} from './types';

interface EmbedInnerProps {
  form: MktFormDto;
  onClose: () => void;
  onSubmitted: () => Promise<void>;
}

const FormEmbedInner: React.FC<EmbedInnerProps> = ({ form, onClose, onSubmitted }) => {
  const { token, tenantSlug } = useAuth();
  const [loadingCfg, setLoadingCfg] = useState(true);
  const [embedCfg, setEmbedCfg] = useState<EmbedConfigResponse | null>(null);
  const [embedMode, setEmbedMode] = useState<EmbedMode>('iframe');
  const [copied, setCopied] = useState(false);

  const [sandboxValues, setSandboxValues] = useState<Record<string, string>>({});
  const [otpId, setOtpId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiRequest<EmbedConfigResponse>(`/marketing/forms/${form.id}/embed-config`, {
      token,
      tenantSlug,
    })
      .then((res) => {
        if (!cancelled && res) setEmbedCfg(res);
      })
      .catch(() => {
        // Fallback to client snippet generator when embed-config endpoint is optional
      })
      .finally(() => {
        if (!cancelled) setLoadingCfg(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.id, token, tenantSlug]);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://domation.vn';
  const theme = resolveFormTheme(embedCfg?.theme || form.theme);
  const snippet = buildFormEmbedSnippet(originUrl, form, embedMode, embedCfg?.snippets);

  const handleCopy = () => {
    void navigator.clipboard?.writeText(snippet);
    setCopied(true);
    toast.success('Đã sao chép mã nhúng HTML/JS!');
    setTimeout(() => setCopied(false), 2000);
  };

  const resolveRecipient = (): string => {
    const phoneFld = form.fields.find((f) => f.type === 'phone' || f.key === 'phone');
    const emailFld = form.fields.find((f) => f.type === 'email' || f.key === 'email');
    const phoneVal = (phoneFld ? sandboxValues[phoneFld.key] : sandboxValues.phone) || '';
    const emailVal = (emailFld ? sandboxValues[emailFld.key] : sandboxValues.email) || '';
    return form.otp_channel === 'sms' ? phoneVal || emailVal : emailVal || phoneVal;
  };

  const handleSendOtp = async () => {
    const recipient = resolveRecipient().trim();
    if (!recipient) {
      toast.error('Vui lòng nhập SĐT hoặc Email trong ô thử nghiệm trước khi lấy mã OTP.');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await apiRequest<{ otp_id: string; sandbox_otp_code?: string }>(
        '/public/marketing/otp/send',
        {
          method: 'POST',
          body: {
            form_token: form.public_token,
            recipient,
            channel: form.otp_channel,
          },
        }
      );
      setOtpId(res.otp_id);
      if (res.sandbox_otp_code) {
        setOtpCode(res.sandbox_otp_code);
        toast.success(`Mã OTP Sandbox đã sinh: ${res.sandbox_otp_code}`);
      } else {
        toast.success('Đã gửi mã OTP xác thực!');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi mã OTP.'));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSandboxSubmit = async () => {
    setSubmitting(true);
    try {
      if (form.require_otp) {
        if (!otpCode.trim()) {
          toast.error('Biểu mẫu bật bảo vệ OTP — vui lòng bấm Lấy OTP trước.');
          setSubmitting(false);
          return;
        }
        if (otpId) {
          await apiRequest('/public/marketing/otp/verify', {
            method: 'POST',
            body: { otp_id: otpId, code: otpCode.trim(), form_token: form.public_token },
          });
        }
      }

      const payload: Record<string, unknown> = {
        ...sandboxValues,
        otp_id: otpId || undefined,
        otp_code: otpCode.trim() || undefined,
        utm_source: 'embed_sandbox',
      };

      const res = await apiRequest<{ routing_mode: string }>(
        `/public/marketing/forms/${form.public_token}/submit`,
        {
          method: 'POST',
          body: payload,
        }
      );
      toast.success(
        res.routing_mode === 'sale_round'
          ? 'Đã gửi thành công & đẩy thẳng vào Vòng chia Sale Auto Data!'
          : 'Đã lưu hồ sơ vào kho Marketing Nurture & Tệp khách hàng!'
      );
      await onSubmitted();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gửi thử Biểu mẫu thất bại.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCfg) {
    return <ModalBodySkeleton rows={4} />;
  }

  const embedTabs: Array<{ mode: EmbedMode; label: string; icon: React.ReactNode; desc: string }> = [
    { mode: 'iframe', label: 'Iframe Inline', icon: <Layout size={14} />, desc: 'Nhúng trực tiếp vào nội dung trang' },
    { mode: 'popup_modal', label: 'Popup Modal', icon: <Maximize2 size={14} />, desc: 'Bật hộp thoại giữa màn hình khi bấm CTA' },
    { mode: 'floating_bar', label: 'Floating Bar', icon: <PanelBottom size={14} />, desc: 'Thanh ghim nổi cuối trang thu SĐT nhanh' },
    { mode: 'slide_in', label: 'Slide-in Box', icon: <MessageSquare size={14} />, desc: 'Trượt góc phải khi cuộn 40% trang' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mode Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
        {embedTabs.map((t) => {
          const active = embedMode === t.mode;
          return (
            <button
              key={t.mode}
              type="button"
              onClick={() => setEmbedMode(t.mode)}
              style={{
                padding: '0.65rem 0.75rem',
                borderRadius: 12,
                border: active ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                background: active ? '#EEF2FF' : '#FFFFFF',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: active ? '#1E40FF' : '#0F172A' }}>
                {t.icon} {t.label}
              </div>
              <div style={{ fontSize: '0.69rem', color: '#64748B', marginTop: 3 }}>{t.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Live Visual Mode Mock Frame + Code Snippet */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 12, alignItems: 'stretch' }}>
        <div style={{ borderRadius: 14, border: '1px solid #E2E8F0', background: '#F8F9FA', padding: '0.85rem', position: 'relative', minHeight: 195, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>
            Mô phỏng hiển thị trên Website ({embedMode})
          </div>

          {embedMode === 'iframe' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #DBEAFE', borderRadius: theme.borderRadius, padding: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>{form.name}</div>
              <div style={{ height: 28, borderRadius: 8, background: '#F8F9FA', border: '1px solid #E2E8F0', margin: '6px 0' }} />
              <div style={{ height: 30, borderRadius: 8, background: theme.primaryColor, color: '#FFF', fontSize: '0.74rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {theme.buttonLabel}
              </div>
            </div>
          )}

          {embedMode === 'popup_modal' && (
            <div style={{ background: 'rgba(15,23,42,0.08)', borderRadius: 12, padding: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, marginTop: 6 }}>
              <div style={{ width: '84%', background: '#FFFFFF', borderRadius: theme.borderRadius, padding: '0.75rem', boxShadow: '0 10px 24px rgba(15,23,42,0.14)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>{form.name}</div>
                <div style={{ marginTop: 6, height: 28, borderRadius: 8, background: theme.primaryColor, color: '#FFF', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {theme.buttonLabel}
                </div>
              </div>
            </div>
          )}

          {embedMode === 'floating_bar' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginTop: 8 }}>
              <div style={{ background: '#FFFFFF', border: `1.5px solid ${theme.primaryColor}`, borderRadius: 12, padding: '0.55rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {form.name}
                </span>
                <span style={{ padding: '4px 10px', borderRadius: 8, background: theme.primaryColor, color: '#FFF', fontSize: '0.7rem', fontWeight: 700 }}>
                  {theme.buttonLabel}
                </span>
              </div>
            </div>
          )}

          {embedMode === 'slide_in' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', marginTop: 8 }}>
              <div style={{ width: '74%', background: '#FFFFFF', border: '1px solid #DBEAFE', borderRadius: theme.borderRadius, padding: '0.7rem', boxShadow: '0 8px 20px rgba(30,64,255,0.12)' }}>
                <Badge tone="primary">Slide-in 40%</Badge>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, marginTop: 4 }}>{form.name}</div>
                <div style={{ marginTop: 6, height: 26, borderRadius: 7, background: theme.primaryColor, color: '#FFF', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {theme.buttonLabel}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Code2 size={14} color="#1E40FF" /> Mã nhúng HTML / JS SDK
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="btn secondary sm"
              style={{ height: 32, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Đã sao chép' : 'Copy Snippet'}
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              flex: 1,
              background: '#0F172A',
              color: '#E2E8F0',
              borderRadius: 12,
              padding: '0.8rem',
              fontSize: '0.72rem',
              lineHeight: 1.5,
              overflowX: 'auto',
              maxHeight: 170,
            }}
          >
            {snippet}
          </pre>
        </div>
      </div>

      {/* Live Public Form Sandbox Tester */}
      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A' }}>
              Sandbox Kiểm Thử Cổng Public (`/public/marketing/forms/{form.public_token}/submit`)
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
              Kiểm chứng thực tế {form.routing_mode === 'sale_round' ? 'Mode B: Đẩy thẳng Vòng chia Sale Auto Data' : 'Mode A: Lưu kho Marketing Nurture & Audience'}
            </div>
          </div>
          {form.require_otp && <Badge tone="warning">Yêu cầu OTP ({form.otp_channel.toUpperCase()})</Badge>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
          {form.fields
            .filter((f) => f.type !== 'checkbox')
            .map((fld) => (
              <input
                key={fld.id}
                className="form-input"
                style={{ height: 42, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                placeholder={`${fld.label}${fld.required ? ' *' : ''}...`}
                value={sandboxValues[fld.key] || ''}
                onChange={(e) => setSandboxValues((p) => ({ ...p, [fld.key]: e.target.value }))}
              />
            ))}

          {form.require_otp && (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="form-input"
                style={{ height: 42, background: '#FFFFFF', border: '1px solid #DBEAFE', fontFamily: 'monospace' }}
                placeholder="Mã OTP 6 số..."
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
              />
              <button
                type="button"
                disabled={sendingOtp}
                onClick={() => void handleSendOtp()}
                className="btn secondary"
                style={{ height: 42, whiteSpace: 'nowrap', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <KeyRound size={14} /> {sendingOtp ? '...' : 'Lấy OTP'}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>
            Đóng
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSandboxSubmit()}
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
            <Play size={14} /> {submitting ? 'Đang gửi...' : 'Gửi Thử Dữ Liệu Thực Tế'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface FormEmbedModalProps {
  form: MktFormDto | null;
  onClose: () => void;
  onSubmitted: () => Promise<void>;
}

export const FormEmbedModal: React.FC<FormEmbedModalProps> = ({ form, onClose, onSubmitted }) => (
  <CustomModal
    isOpen={Boolean(form)}
    onClose={onClose}
    title={`Trình Tạo Mã Nhúng Đa Giao Diện & Sandbox — ${form?.name || ''}`}
    width={860}
  >
    {form && <FormEmbedInner key={form.id} form={form} onClose={onClose} onSubmitted={onSubmitted} />}
  </CustomModal>
);

export default FormEmbedModal;
