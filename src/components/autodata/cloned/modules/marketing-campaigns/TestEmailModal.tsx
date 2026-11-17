import React, { useMemo, useState } from 'react';
import { CheckCircle2, Mail, Plus, Send, UserCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  SAMPLE_PERSONAS,
  interpolatePreviewText,
  type CampaignChannel,
} from './campaignTypes';

export interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string | null;
  campaignName: string;
  channel: CampaignChannel;
  subjectA: string;
  subjectB: string;
  templateId?: string | null;
  senderName?: string;
  senderEmail?: string;
  fallbacks: Record<string, string>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TestEmailModal: React.FC<TestEmailModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  channel,
  subjectA,
  subjectB,
  templateId,
  senderName,
  senderEmail,
  fallbacks,
}) => {
  const { token, tenantSlug, user, companyName } = useAuth();

  const [recipients, setRecipients] = useState<string[]>(() =>
    user?.email && EMAIL_RE.test(user.email) ? [user.email] : []
  );
  const [emailInput, setEmailInput] = useState('');
  const [personaId, setPersonaId] = useState(SAMPLE_PERSONAS[0].id);
  const [variant, setVariant] = useState<'A' | 'B'>('A');
  const [sending, setSending] = useState(false);
  const [sentSummary, setSentSummary] = useState<string | null>(null);

  const selectedPersona = useMemo(
    () => SAMPLE_PERSONAS.find((p) => p.id === personaId) || SAMPLE_PERSONAS[0],
    [personaId]
  );

  const hasVariantB = Boolean(subjectB.trim());
  const activeSubject = variant === 'B' && hasVariantB ? subjectB : subjectA;
  const renderedSubject = useMemo(
    () => interpolatePreviewText(activeSubject || campaignName, selectedPersona, fallbacks, companyName),
    [activeSubject, campaignName, selectedPersona, fallbacks, companyName]
  );

  const handleAddEmail = () => {
    const tokens = emailInput
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (tokens.length === 0) return;

    const next = [...recipients];
    for (const em of tokens) {
      if (!EMAIL_RE.test(em)) {
        toast.error(`Địa chỉ Email không hợp lệ: ${em}`);
        continue;
      }
      if (next.includes(em)) continue;
      if (next.length >= 5) {
        toast.error('Chỉ hỗ trợ tối đa 5 địa chỉ nhận bản gửi thử mỗi lượt.');
        break;
      }
      next.push(em);
    }
    setRecipients(next);
    setEmailInput('');
  };

  const handleRemoveEmail = (email: string) => {
    setRecipients((prev) => prev.filter((item) => item !== email));
  };

  const handleSendTest = async () => {
    if (recipients.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 địa chỉ Email nhận thử.');
      return;
    }
    setSending(true);
    setSentSummary(null);
    try {
      const res = await apiRequest<{ sent_count?: number; provider?: string }>('/marketing/campaigns/test-email', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          campaign_id: campaignId || null,
          campaign_name: campaignName,
          channel,
          recipients,
          emails: recipients,
          variant,
          subject: renderedSubject,
          subject_a: subjectA,
          subject_b: subjectB,
          template_id: templateId || null,
          sender_name: senderName || companyName,
          sender_email: senderEmail || undefined,
          fallback_vars: fallbacks,
          sample_persona: selectedPersona,
        },
      });
      const count = res?.sent_count ?? recipients.length;
      const summaryMsg = `Đã gửi bản thử nghiệm (Nhánh ${variant}) tới ${count} địa chỉ qua ${res?.provider || 'Vault Channel'}!`;
      setSentSummary(summaryMsg);
      toast.success(summaryMsg);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi Email thử nghiệm.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gửi Bản Xem Thử Chiến Dịch (Test Email & Persona Simulator)"
      width={620}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Variant A/B Toggle */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 14,
            background: '#F8FAFF',
            border: '1px solid #DBEAFE',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>Tiêu đề thực tế sau nội suy:</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1E40FF', marginTop: 2 }}>
              [TEST-{variant}] {renderedSubject}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setVariant('A')}
              style={{
                height: 34,
                padding: '0 0.85rem',
                borderRadius: 9,
                border: variant === 'A' ? '1.5px solid #1E40FF' : '1px solid #CBD5E1',
                background: variant === 'A' ? '#1E40FF' : '#FFFFFF',
                color: variant === 'A' ? '#FFFFFF' : '#475569',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Nhánh A
            </button>
            <button
              type="button"
              disabled={!hasVariantB}
              onClick={() => setVariant('B')}
              style={{
                height: 34,
                padding: '0 0.85rem',
                borderRadius: 9,
                border: variant === 'B' ? '1.5px solid #1E40FF' : '1px solid #CBD5E1',
                background: variant === 'B' ? '#1E40FF' : '#FFFFFF',
                color: variant === 'B' ? '#FFFFFF' : '#475569',
                fontWeight: 700,
                fontSize: '0.78rem',
                opacity: hasVariantB ? 1 : 0.45,
                cursor: hasVariantB ? 'pointer' : 'not-allowed',
              }}
            >
              Nhánh B
            </button>
          </div>
        </div>

        {/* Sample Persona Picker */}
        <div>
          <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserCheck size={15} color="#1E40FF" /> Chọn Chân Dung Khách Hàng Mẫu (Kiểm tra Merge Tags & Fallback)
          </label>
          <select
            className="form-input"
            style={{ height: 42 }}
            value={personaId}
            onChange={(e) => setPersonaId(e.target.value)}
          >
            {SAMPLE_PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — {p.name || '(Trống tên -> dùng Fallback)'}
              </option>
            ))}
          </select>
        </div>

        {/* Up to 5 Test Emails */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
              Danh sách Email nhận bản thử (Tối đa 5 địa chỉ)
            </label>
            <Badge tone="neutral">{recipients.length}/5 địa chỉ</Badge>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              style={{ height: 42 }}
              placeholder="Nhập email nhận thử (VD: qa@company.vn)..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddEmail();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddEmail}
              disabled={recipients.length >= 5}
              className="btn secondary"
              style={{ height: 42, display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700 }}
            >
              <Plus size={15} /> Thêm
            </button>
          </div>

          {recipients.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {recipients.map((em) => (
                <span
                  key={em}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: '#EEF2FF',
                    border: '1px solid #C7D2FE',
                    color: '#1E40FF',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                  }}
                >
                  <Mail size={12} />
                  {em}
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(em)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#475569',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'inline-flex',
                    }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {sentSummary && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 12,
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} /> {sentSummary}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>
            Đóng
          </button>
          <button
            type="button"
            disabled={sending || recipients.length === 0}
            onClick={() => void handleSendTest()}
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
            <Send size={15} /> {sending ? 'Đang gửi thử...' : 'Gửi Bản Thử Ngay'}
          </button>
        </div>
      </div>
    </CustomModal>
  );
};

export default TestEmailModal;
