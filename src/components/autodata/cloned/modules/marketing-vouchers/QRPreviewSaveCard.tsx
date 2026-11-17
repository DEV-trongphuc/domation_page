import React, { useState } from 'react';
import { Download, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { downloadSvgAsPng, downloadSvgString } from './qrGenerator';
import type { BrandedQrOptions, ShortlinkItemDto, VoucherPoolDto } from './voucherTypes';

export interface QRPreviewSaveCardProps {
  cfg: BrandedQrOptions;
  svgMarkup: string;
  pools: VoucherPoolDto[];
  shortlinks: ShortlinkItemDto[];
  preselectedTarget?: { kind: 'voucher' | 'shortlink'; id: string } | null;
  onSaved?: () => void;
}

export const QRPreviewSaveCard: React.FC<QRPreviewSaveCardProps> = ({
  cfg,
  svgMarkup,
  pools,
  shortlinks,
  preselectedTarget = null,
  onSaved,
}) => {
  const { token, tenantSlug } = useAuth();
  const [targetBinding, setTargetBinding] = useState<string>(() => {
    if (preselectedTarget) return `${preselectedTarget.kind}:${preselectedTarget.id}`;
    if (shortlinks[0]) return `shortlink:${shortlinks[0].id}`;
    if (pools[0]) return `voucher:${pools[0].id}`;
    return '';
  });
  const [saving, setSaving] = useState(false);

  const handleSaveToTarget = async () => {
    if (!targetBinding) {
      toast.error('Vui lòng chọn Chiến dịch Voucher hoặc Shortlink để lưu thiết kế QR.');
      return;
    }
    const [kind, id] = targetBinding.split(':');
    if (!id) return;
    setSaving(true);
    try {
      if (kind === 'voucher') {
        await apiRequest(`/marketing/vouchers/${id}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body: { qr_design: cfg },
        });
        toast.success('Đã lưu thiết kế Branded QR vào Chiến dịch Voucher!');
      } else {
        await apiRequest(`/marketing/vouchers/shortlinks/${id}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body: { qr_design: cfg },
        });
        toast.success('Đã lưu thiết kế Branded QR vào Shortlink!');
      }
      onSaved?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu cấu hình QR Design.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Bản Xem Trước Trực Tiếp"
      subtitle="Vector SVG sắc nét & Xuất ảnh in ấn 1024px"
      actions={<Badge tone="primary">High-ECC</Badge>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            padding: 16,
            borderRadius: 18,
            background: '#F8F9FA',
            border: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />

        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <button
            type="button"
            onClick={() => downloadSvgString(svgMarkup, 'domation-branded-qr.svg')}
            className="btn secondary"
            style={{ height: 44, flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Download size={15} /> Download SVG
          </button>
          <button
            type="button"
            onClick={() => downloadSvgAsPng(svgMarkup, 'domation-branded-qr-hd.png')}
            style={{
              height: 44,
              flex: 1,
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Download size={15} /> High-Res PNG
          </button>
        </div>

        {(pools.length > 0 || shortlinks.length > 0) && (
          <div
            style={{
              width: '100%',
              borderTop: '1px solid #E2E8F0',
              paddingTop: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <label className="form-label" style={{ fontWeight: 700, marginBottom: 0 }}>
              Lưu `qr_design` vào Chiến dịch hoặc Shortlink
            </label>
            <select
              className="form-input"
              style={{ height: 44 }}
              value={targetBinding}
              onChange={(e) => setTargetBinding(e.target.value)}
            >
              <option value="">— Chọn đích lưu thiết kế —</option>
              {pools.map((p) => (
                <option key={`voucher:${p.id}`} value={`voucher:${p.id}`}>
                  [Voucher] {p.name}
                </option>
              ))}
              {shortlinks.map((s) => (
                <option key={`shortlink:${s.id}`} value={`shortlink:${s.id}`}>
                  [Shortlink] {s.title} (/r/{s.short_code})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={saving || !targetBinding}
              onClick={() => void handleSaveToTarget()}
              className="btn secondary"
              style={{
                height: 44,
                color: '#1E40FF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu Cấu Hình QR Vào Hệ Thống'}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default QRPreviewSaveCard;
