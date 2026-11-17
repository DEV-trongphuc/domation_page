import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Power,
  QrCode,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { generateQrVisualGrid } from './surveyLogicHelpers';
import { normalizeSurveyDto, type SurveyItemDto } from './surveyTypes';

interface PublishInnerProps {
  survey: SurveyItemDto;
  onClose: () => void;
  onUpdated: (next: SurveyItemDto) => Promise<void>;
}

const SurveyPublishInner: React.FC<PublishInnerProps> = ({ survey, onClose, onUpdated }) => {
  const { token, tenantSlug } = useAuth();
  const [tab, setTab] = useState<'link' | 'qr' | 'embed'>('link');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://domation.vn';
  const publicUrl = `${origin}/s/${survey.slug}`;
  const workspaceUrl = tenantSlug ? `${origin}/s/${tenantSlug}/${survey.slug}` : publicUrl;
  const emailTrackUrl = `${publicUrl}?utm_source=email&email={{lead.email}}&phone={{lead.phone}}&name={{lead.name}}`;

  const iframeSnippet = `<iframe src="${publicUrl}" title="${survey.title.replace(/"/g, '&quot;')}" width="100%" height="620" style="border:0;border-radius:16px;background:#FFFFFF;"></iframe>`;
  const popupSnippet = `<button type="button" onclick="window.open('${publicUrl}','domationSurvey','width=560,height=740')" style="height:44px;padding:0 20px;border-radius:12px;border:0;background:#1E40FF;color:#FFFFFF;font-weight:700;cursor:pointer;">Tham gia khảo sát</button>`;

  const qrMatrix = useMemo(() => generateQrVisualGrid(publicUrl), [publicUrl]);

  const copyText = (text: string, key: string) => {
    void navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    toast.success('Đã sao chép vào bộ nhớ tạm!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleStatus = async () => {
    const nextStatus = survey.status === 'active' ? 'paused' : 'active';
    setToggling(true);
    try {
      const raw = await apiRequest<Record<string, unknown>>(`/marketing/surveys/${survey.id}`, {
        method: 'PUT',
        token,
        tenantSlug,
        body: { status: nextStatus },
      });
      const updated = normalizeSurveyDto(raw);
      toast.success(nextStatus === 'active' ? 'Khảo sát đã kích hoạt công khai!' : 'Đã tạm dừng nhận phản hồi!');
      await onUpdated(updated);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái Khảo sát.'));
    } finally {
      setToggling(false);
    }
  };

  const handleDownloadQrSvg = () => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-survey-${survey.slug || survey.id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isActive = survey.status === 'active';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Live Status Bar */}
      <div
        style={{
          padding: '0.85rem 1rem',
          borderRadius: 14,
          background: isActive ? '#F0FDF4' : '#FFFBEB',
          border: isActive ? '1px solid #BBF7D0' : '1px solid #FDE68A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge tone={isActive ? 'success' : 'warning'}>
            {isActive ? 'Đang mở công khai (Active)' : 'Đang tạm dừng (Paused)'}
          </Badge>
          <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
            Slug: <code>/s/{survey.slug}</code>
          </span>
        </div>
        <button
          type="button"
          disabled={toggling}
          onClick={() => void handleToggleStatus()}
          className="btn secondary sm"
          style={{
            height: 36,
            color: isActive ? '#D97706' : '#059669',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontWeight: 700,
          }}
        >
          <Power size={13} />
          {toggling ? 'Đang xử lý...' : isActive ? 'Tạm dừng Khảo sát' : 'Kích hoạt Công khai'}
        </button>
      </div>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 12, background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
        {(
          [
            ['link', 'Đường Dẫn Chia Sẻ', Link2],
            ['qr', 'Mã QR Check-in', QrCode],
            ['embed', 'Nhúng Iframe / Popup', Code2],
          ] as const
        ).map(([key, label, Icon]) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                height: 36,
                borderRadius: 9,
                border: active ? '1px solid rgba(30,64,255,0.2)' : 'none',
                background: active ? '#FFFFFF' : 'transparent',
                color: active ? '#1E40FF' : '#475569',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Icon size={14} /> {label}
            </button>
          );
        })}
      </div>

      {tab === 'link' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
              Đường dẫn Công khai Ngắn gọn (`/s/:slug`)
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                readOnly
                className="form-input"
                style={{ height: 42, background: '#F8FAFF', border: '1px solid #DBEAFE', fontFamily: 'monospace', color: '#1E40FF', fontWeight: 700 }}
                value={publicUrl}
              />
              <button
                type="button"
                onClick={() => copyText(publicUrl, 'pub')}
                className="btn secondary"
                style={{ height: 42, display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                {copiedKey === 'pub' ? <Check size={14} /> : <Copy size={14} />} Copy
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  height: 42,
                  padding: '0 14px',
                  borderRadius: 12,
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                }}
              >
                Mở <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
              Đường dẫn Định danh theo Workspace (`/s/:tenant/:slug`)
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                readOnly
                className="form-input"
                style={{ height: 40, background: '#F8F9FA', fontFamily: 'monospace', fontSize: '0.76rem' }}
                value={workspaceUrl}
              />
              <button type="button" onClick={() => copyText(workspaceUrl, 'ws')} className="btn secondary sm" style={{ height: 40 }}>
                {copiedKey === 'ws' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
              Đường dẫn Gắn Biến Cá Nhân Hóa Email / Zalo Campaign
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                readOnly
                className="form-input"
                style={{ height: 40, background: '#F8F9FA', fontFamily: 'monospace', fontSize: '0.74rem' }}
                value={emailTrackUrl}
              />
              <button type="button" onClick={() => copyText(emailTrackUrl, 'em')} className="btn secondary sm" style={{ height: 40 }}>
                {copiedKey === 'em' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'qr' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '0.75rem', background: '#F8F9FA', borderRadius: 16, border: '1px solid #E2E8F0' }}>
          <div style={{ padding: 14, background: '#FFFFFF', borderRadius: 16, border: '1px solid #DBEAFE', boxShadow: '0 8px 20px rgba(30,64,255,0.08)' }}>
            <svg ref={svgRef} width={180} height={180} viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
              <rect width="25" height="25" rx="2" fill="#FFFFFF" />
              {qrMatrix.map((row, r) =>
                row.map((cell, c) =>
                  cell ? (
                    <rect
                      key={`${r}_${c}`}
                      x={c + 2}
                      y={r + 2}
                      width={0.92}
                      height={0.92}
                      rx={0.2}
                      fill={r < 7 && c < 7 ? '#1E40FF' : '#0F172A'}
                    />
                  ) : null
                )
              )}
            </svg>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
            Đặt tại quầy sự kiện / POS hoặc in lên Standee dẫn tới <code>/s/{survey.slug}</code>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleDownloadQrSvg}
              style={{
                height: 40,
                padding: '0 16px',
                borderRadius: 10,
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
              <Download size={14} /> Tải QR Vector (SVG)
            </button>
            <button type="button" onClick={() => copyText(`${publicUrl}?utm_source=qr`, 'qr')} className="btn secondary" style={{ height: 40 }}>
              <Copy size={14} /> Copy Link QR
            </button>
          </div>
        </div>
      )}

      {tab === 'embed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>1. Nhúng Iframe trực tiếp vào Website</span>
              <button type="button" onClick={() => copyText(iframeSnippet, 'if')} className="btn secondary sm" style={{ height: 30, color: '#1E40FF' }}>
                {copiedKey === 'if' ? <Check size={12} /> : <Copy size={12} />} Copy Iframe
              </button>
            </div>
            <pre style={{ margin: 0, padding: '0.75rem', borderRadius: 10, background: '#0F172A', color: '#E2E8F0', fontSize: '0.72rem', overflowX: 'auto' }}>
              {iframeSnippet}
            </pre>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>2. Nút bật Cửa sổ Khảo sát Popup</span>
              <button type="button" onClick={() => copyText(popupSnippet, 'pop')} className="btn secondary sm" style={{ height: 30, color: '#1E40FF' }}>
                {copiedKey === 'pop' ? <Check size={12} /> : <Copy size={12} />} Copy Popup
              </button>
            </div>
            <pre style={{ margin: 0, padding: '0.75rem', borderRadius: 10, background: '#0F172A', color: '#E2E8F0', fontSize: '0.72rem', overflowX: 'auto' }}>
              {popupSnippet}
            </pre>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} className="btn secondary" style={{ height: 42 }}>
          Đóng
        </button>
      </div>
    </div>
  );
};

interface SurveyPublishModalProps {
  survey: SurveyItemDto | null;
  onClose: () => void;
  onUpdated: (next: SurveyItemDto) => Promise<void>;
}

export const SurveyPublishModal: React.FC<SurveyPublishModalProps> = ({
  survey,
  onClose,
  onUpdated,
}) => (
  <CustomModal
    isOpen={Boolean(survey)}
    onClose={onClose}
    title={`Xuất Bản, Chia Sẻ Link & Mã QR — ${survey?.title || ''}`}
    width={680}
  >
    {survey && <SurveyPublishInner key={survey.id} survey={survey} onClose={onClose} onUpdated={onUpdated} />}
  </CustomModal>
);

export default SurveyPublishModal;
