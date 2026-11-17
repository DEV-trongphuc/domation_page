import React, { useMemo, useState } from 'react';
import { CheckCircle2, Eye, MailCheck, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { parseRecipientsInput } from './editorUtils';
import type { EmailBlockItem, MergeTagDefinition } from './templateTypes';

export interface QuickSendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
  tenantSlug?: string | null;
  templateId: string | null;
  templateName: string;
  defaultSubject: string;
  blocks: EmailBlockItem[];
  mergeTags: MergeTagDefinition[];
}

interface QuickSendApiResponse {
  sent?: number;
  failed?: number;
  provider?: string;
}

interface TestSendApiResponse {
  to_email: string;
  provider: string;
  rendered_subject: string;
  rendered_html: string;
}

const QuickSendModalBody: React.FC<Omit<QuickSendEmailModalProps, 'isOpen'>> = ({
  onClose,
  token,
  tenantSlug,
  templateId,
  templateName,
  defaultSubject,
  blocks,
  mergeTags,
}) => {
  const [tab, setTab] = useState<'quick' | 'test'>('quick');
  const [subject, setSubject] = useState(defaultSubject || templateName);
  const [recipientsRaw, setRecipientsRaw] = useState('');
  const [fallbackName, setFallbackName] = useState('Quý khách hàng');
  const [fallbackVoucher, setFallbackVoucher] = useState('DOM-VIP20');
  const [sending, setSending] = useState(false);
  const [quickDone, setQuickDone] = useState<QuickSendApiResponse | null>(null);

  const [testEmail, setTestEmail] = useState('');
  const [sampleName, setSampleName] = useState('Nguyễn Minh Anh');
  const [testResult, setTestResult] = useState<TestSendApiResponse | null>(null);

  const parsedRecipients = useMemo(() => parseRecipientsInput(recipientsRaw), [recipientsRaw]);

  const handleQuickSend = async () => {
    if (!subject.trim()) {
      toast.error('Vui lòng nhập tiêu đề Email.');
      return;
    }
    if (parsedRecipients.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 địa chỉ Email người nhận hợp lệ.');
      return;
    }
    setSending(true);
    try {
      const res = await apiRequest<QuickSendApiResponse>('/marketing/templates/quick-send', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          template_id: templateId,
          recipients: parsedRecipients,
          subject: subject.trim(),
          blocks,
          fallback_vars: {
            'lead.name': fallbackName.trim() || 'Quý khách',
            'lead.voucher_code': fallbackVoucher.trim() || 'DOM-VIP20',
          },
        },
      });
      setQuickDone(res);
      toast.success(
        `Đã phát lệnh gửi nhanh tới ${res.sent ?? parsedRecipients.length} địa chỉ Email!`
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi Email nhanh.'));
    } finally {
      setSending(false);
    }
  };

  const handleTestSend = async () => {
    if (!templateId) {
      toast.error('Vui lòng lưu mẫu Email vào thư viện trước khi gửi thử qua Vault.');
      return;
    }
    if (!testEmail.trim() || !testEmail.includes('@')) {
      toast.error('Vui lòng nhập địa chỉ Email nhận bản thử hợp lệ.');
      return;
    }
    setSending(true);
    try {
      const res = await apiRequest<TestSendApiResponse>(
        `/marketing/templates/${templateId}/test-send`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            to_email: testEmail.trim(),
            sample_name: sampleName.trim() || 'Khách hàng Doanh nghiệp',
          },
        }
      );
      setTestResult(res);
      toast.success(`Đã kết xuất gửi thử qua ${res.provider}!`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thực hiện gửi thử Email.'));
    } finally {
      setSending(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    padding: '0 12px',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    fontSize: '0.8rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PillTabs
        tabs={[
          { key: 'quick', label: 'Gửi Nhanh Cá Nhân Hóa (Quick Send)', count: parsedRecipients.length },
          { key: 'test', label: 'Gửi Thử Kiểm Duyệt Vault' },
        ]}
        activeKey={tab}
        onChange={(k) => setTab(k as 'quick' | 'test')}
      />

      {tab === 'quick' ? (
        <>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
              Tiêu đề Email gửi đi (Subject)
            </label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
              {mergeTags.slice(0, 5).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSubject((prev) => `${prev} ${t.key}`.trim())}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 7,
                    border: '1px solid #DBEAFE',
                    background: '#EFF6FF',
                    color: '#1E40FF',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + {t.key}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                Danh sách Email người nhận (cách nhau bởi dấu phẩy hoặc xuống dòng)
              </label>
              <Badge tone="primary">{parsedRecipients.length} Email hợp lệ</Badge>
            </div>
            <textarea
              rows={4}
              value={recipientsRaw}
              onChange={(e) => setRecipientsRaw(e.target.value)}
              placeholder={'ceo@company.vn\nkhachhang@doitac.com.vn'}
              style={{ ...inputStyle, height: 'auto', padding: 10, marginTop: 4 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#334155' }}>
                Giá trị dự phòng {'{{lead.name}}'}
              </label>
              <input value={fallbackName} onChange={(e) => setFallbackName(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#334155' }}>
                Giá trị dự phòng {'{{lead.voucher_code}}'}
              </label>
              <input value={fallbackVoucher} onChange={(e) => setFallbackVoucher(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
            </div>
          </div>

          {quickDone && (
            <div style={{ padding: 12, borderRadius: 12, background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 8, color: '#065F46', fontSize: '0.8rem', fontWeight: 700 }}>
              <CheckCircle2 size={16} /> Đã gửi thành công {quickDone.sent ?? parsedRecipients.length} email (Lỗi: {quickDone.failed ?? 0}).
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
            <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>Đóng</button>
            <button
              type="button"
              disabled={sending}
              onClick={() => void handleQuickSend()}
              style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <Send size={15} /> {sending ? 'Đang gửi...' : `Gửi ngay (${parsedRecipients.length})`}
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>Email nhận bản gửi thử</label>
              <input type="email" placeholder="qa@company.vn" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>Tên khách hàng giả lập</label>
              <input value={sampleName} onChange={(e) => setSampleName(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
            </div>
          </div>

          {testResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ padding: '8px 12px', borderRadius: 10, background: '#EFF6FF', border: '1px solid #DBEAFE', fontSize: '0.76rem', color: '#1E40FF', fontWeight: 700 }}>
                <MailCheck size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                Subject đã trộn: {testResult.rendered_subject} ({testResult.provider})
              </div>
              <iframe
                title="Test Send Rendered Preview"
                sandbox=""
                srcDoc={testResult.rendered_html}
                style={{ width: '100%', height: 240, borderRadius: 12, border: '1px solid #E2E8F0', background: '#FFFFFF' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
            <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>Đóng</button>
            <button
              type="button"
              disabled={sending}
              onClick={() => void handleTestSend()}
              style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <Eye size={15} /> {sending ? 'Đang kết xuất...' : 'Gửi bản thử qua Vault'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const QuickSendEmailModal: React.FC<QuickSendEmailModalProps> = (props) => (
  <CustomModal
    isOpen={props.isOpen}
    onClose={props.onClose}
    title={`Gửi Nhanh & Gửi Thử — ${props.templateName}`}
    width={650}
  >
    {props.isOpen && <QuickSendModalBody {...props} />}
  </CustomModal>
);

export default QuickSendEmailModal;
