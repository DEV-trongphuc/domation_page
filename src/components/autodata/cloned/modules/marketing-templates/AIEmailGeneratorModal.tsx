import React, { useState } from 'react';
import { Check, Monitor, RefreshCw, Smartphone, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import type { DomStudioGenerateResponse, EmailBlockItem } from './templateTypes';

export interface AIEmailGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
  tenantSlug?: string | null;
  onApplyGenerated: (payload: {
    subject: string;
    preheader: string;
    blocks: EmailBlockItem[];
  }) => void;
}

const STUDIO_QUICK_ANGLES: ReadonlyArray<{ label: string; goal: string; industry: string }> = [
  {
    label: 'Ra mắt Giải pháp B2B',
    goal: 'Giới thiệu nền tảng tự động hóa đa kênh & tặng gói tư vấn triển khai 1-1',
    industry: 'B2B SaaS & Chuyển đổi số',
  },
  {
    label: 'Flash Voucher Cuối Tuần',
    goal: 'Tặng mã ưu đãi đặc quyền 20% giới hạn trong 72 giờ cho khách hàng tiềm năng',
    industry: 'Thương mại & Bán lẻ',
  },
  {
    label: 'Thư mời Hội thảo VIP',
    goal: 'Trân trọng kính mời tham dự Executive Workshop tối ưu tăng trưởng doanh thu thực',
    industry: 'Sự kiện Doanh nghiệp',
  },
];

const AIEmailStudioBody: React.FC<Omit<AIEmailGeneratorModalProps, 'isOpen'>> = ({
  onClose,
  token,
  tenantSlug,
  onApplyGenerated,
}) => {
  const [goal, setGoal] = useState('Giới thiệu giải pháp mới & tặng mã ưu đãi đặc quyền 20%');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'urgent'>('professional');
  const [industryAngle, setIndustryAngle] = useState('B2B SaaS & Chuyển đổi số');
  const [ctaUrl, setCtaUrl] = useState('https://domation.net');
  const [includeVoucher, setIncludeVoucher] = useState(true);
  const [includeCountdown, setIncludeCountdown] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [generated, setGenerated] = useState<DomStudioGenerateResponse | null>(null);

  const handleGenerate = async () => {
    if (!goal.trim()) {
      toast.error('Vui lòng mô tả mục tiêu chiến dịch Email.');
      return;
    }
    setGenerating(true);
    try {
      const res = await apiRequest<DomStudioGenerateResponse>('/marketing/templates/ai-generate', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          goal: `${goal.trim()} (${industryAngle.trim()})`,
          industry_angle: industryAngle.trim(),
          tone,
          cta_url: ctaUrl.trim() || 'https://domation.net',
          include_voucher: includeVoucher,
          include_countdown: includeCountdown,
        },
      });
      setGenerated(res);
      toast.success('DOM Agent Email Studio đã sinh bố cục sẵn sàng để xem trước!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'DOM Agent không thể sinh mẫu Email lúc này.'));
    } finally {
      setGenerating(false);
    }
  };

  if (generating) {
    return <ModalBodySkeleton rows={4} />;
  }

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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {STUDIO_QUICK_ANGLES.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setGoal(p.goal);
              setIndustryAngle(p.industry);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid #DBEAFE',
              background: '#EFF6FF',
              color: '#1E40FF',
              fontSize: '0.73rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✦ {p.label}
          </button>
        ))}
      </div>

      <div>
        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
          Mục tiêu Chiến dịch Email
        </label>
        <textarea
          rows={3}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          style={{ ...inputStyle, height: 'auto', padding: 10, marginTop: 4 }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        <div>
          <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#334155' }}>Giọng văn thương hiệu</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as 'professional' | 'friendly' | 'urgent')}
            style={{ ...inputStyle, marginTop: 4 }}
          >
            <option value="professional">Chuyên nghiệp & Uy tín B2B</option>
            <option value="friendly">Thân thiện & Chăm sóc 1-1</option>
            <option value="urgent">Thúc đẩy Chuyển đổi Nhanh</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#334155' }}>Góc tiếp cận ngành hàng</label>
          <input
            value={industryAngle}
            onChange={(e) => setIndustryAngle(e.target.value)}
            style={{ ...inputStyle, marginTop: 4 }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#334155' }}>Đường dẫn CTA chính</label>
          <input
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            style={{ ...inputStyle, marginTop: 4 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}>
          <input type="checkbox" checked={includeVoucher} onChange={(e) => setIncludeVoucher(e.target.checked)} />
          Tự chèn Khối Voucher {'{{lead.voucher_code}}'}
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}>
          <input type="checkbox" checked={includeCountdown} onChange={(e) => setIncludeCountdown(e.target.checked)} />
          Tự chèn Đồng hồ Đếm ngược SVG
        </label>
      </div>

      {generated && (
        <div
          style={{
            padding: 12,
            borderRadius: 14,
            background: '#F8FAFF',
            border: '1px solid #DBEAFE',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>
                Subject: {generated.subject}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                {generated.blocks.length} khối thiết kế • Xem trước trực tiếp trước khi nạp vào Canvas
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {typeof generated.spam_analysis?.score === 'number' && (
                <Badge tone="success">Spam Risk: {generated.spam_analysis.score}/100</Badge>
              )}
              <button
                type="button"
                onClick={() => setPreviewViewport('desktop')}
                style={{ height: 32, padding: '0 10px', borderRadius: 8, border: previewViewport === 'desktop' ? '1px solid #1E40FF' : '1px solid #E2E8F0', background: previewViewport === 'desktop' ? '#EFF6FF' : '#FFFFFF', color: '#1E40FF', cursor: 'pointer' }}
              >
                <Monitor size={13} />
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport('mobile')}
                style={{ height: 32, padding: '0 10px', borderRadius: 8, border: previewViewport === 'mobile' ? '1px solid #1E40FF' : '1px solid #E2E8F0', background: previewViewport === 'mobile' ? '#EFF6FF' : '#FFFFFF', color: '#1E40FF', cursor: 'pointer' }}
              >
                <Smartphone size={13} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', background: '#F8F9FA', padding: 10, borderRadius: 12 }}>
            <iframe
              title="DOM Agent Studio Preview"
              sandbox=""
              srcDoc={generated.compiled_html}
              style={{
                width: previewViewport === 'mobile' ? 375 : '100%',
                height: 290,
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
        <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44 }}>
          Đóng
        </button>
        <button
          type="button"
          onClick={() => void handleGenerate()}
          className="btn secondary"
          style={{ height: 44, color: '#1E40FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {generated ? <RefreshCw size={15} /> : <Sparkles size={15} />}
          {generated ? 'Sinh Phương Án Khác' : 'Sinh Bố Cục & Xem Trước'}
        </button>
        {generated && (
          <button
            type="button"
            onClick={() => {
              onApplyGenerated({
                subject: generated.subject,
                preheader: generated.preheader,
                blocks: generated.blocks,
              });
              onClose();
            }}
            style={{
              height: 44,
              padding: '0 18px',
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
            <Check size={15} /> Áp Dụng Vào Canvas
          </button>
        )}
      </div>
    </div>
  );
};

export const AIEmailGeneratorModal: React.FC<AIEmailGeneratorModalProps> = (props) => (
  <CustomModal
    isOpen={props.isOpen}
    onClose={props.onClose}
    title="DOM Agent Email Studio — Tự Động Thiết Kế & Chống Spam"
    width={720}
  >
    {props.isOpen && <AIEmailStudioBody {...props} />}
  </CustomModal>
);

export default AIEmailGeneratorModal;
