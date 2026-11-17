import React, { useState } from 'react';
import { BarChart3, Copy, ExternalLink, QrCode, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, Table, type TableColumn } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type { BrandedQrOptions, ShortlinkItemDto } from './voucherTypes';

export interface ShortlinksTabPanelProps {
  shortlinks: ShortlinkItemDto[];
  originUrl: string;
  onReload: () => Promise<void>;
  onOpenAnalytics: (shortlinkId: string) => void;
  onOpenQrDesigner: (args: {
    title: string;
    defaultValue: string;
    initialDesign?: Partial<BrandedQrOptions>;
    target: { kind: 'shortlink'; id: string };
  }) => void;
}

export const ShortlinksTabPanel: React.FC<ShortlinksTabPanelProps> = ({
  shortlinks,
  originUrl,
  onReload,
  onOpenAnalytics,
  onOpenQrDesigner,
}) => {
  const { token, tenantSlug } = useAuth();
  const [linkTitle, setLinkTitle] = useState('');
  const [targetUrl, setTargetUrl] = useState('https://domation.net');
  const [utmSource, setUtmSource] = useState('qr_standee');
  const [utmMedium, setUtmMedium] = useState('offline_qr');
  const [utmCampaign, setUtmCampaign] = useState('promo_q4');

  const handleCreateShortlink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !targetUrl.trim()) {
      toast.error('Vui lòng nhập tiêu đề và URL đích (http/https).');
      return;
    }
    try {
      const created = await apiRequest<ShortlinkItemDto>('/marketing/vouchers/shortlinks', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          title: linkTitle.trim(),
          target_url: targetUrl.trim(),
          utm_source: utmSource.trim() || undefined,
          utm_medium: utmMedium.trim() || undefined,
          utm_campaign: utmCampaign.trim() || undefined,
        },
      });
      setLinkTitle('');
      toast.success('Đã tạo Shortlink rút gọn kèm UTM Tracking!');
      await onReload();
      onOpenQrDesigner({
        title: `Thiết Kế QR Cho Shortlink — ${created.title}`,
        defaultValue: `${originUrl}/api/v1/public/marketing/r/${created.short_code}`,
        initialDesign: created.qr_design,
        target: { kind: 'shortlink', id: created.id },
      });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Shortlink.'));
    }
  };

  const handleDeleteShortlink = async (link: ShortlinkItemDto) => {
    try {
      await apiRequest(`/marketing/vouchers/shortlinks/${link.id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã xóa Shortlink.');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa Shortlink.'));
    }
  };

  const shortlinkCols: Array<TableColumn<ShortlinkItemDto>> = [
    {
      key: 'title',
      header: 'Chiến Dịch Shortlink & Đường Dẫn Rút Gọn',
      render: (r) => {
        const fullShort = `${originUrl}/api/v1/public/marketing/r/${r.short_code}`;
        return (
          <div>
            <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.title}</div>
            <code style={{ fontSize: '0.75rem', color: '#1E40FF' }}>{fullShort}</code>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>Đích: {r.target_url}</div>
          </div>
        );
      },
    },
    {
      key: 'utm',
      header: 'Tham Số UTM',
      render: (r) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Badge tone="primary">{r.utm_source || 'direct'}</Badge>
          {r.utm_medium && <Badge tone="neutral">{r.utm_medium}</Badge>}
          <Badge tone="info">{r.utm_campaign || 'default'}</Badge>
        </div>
      ),
    },
    {
      key: 'clicks',
      header: 'Tổng / Unique Click',
      numeric: true,
      render: (r) => (
        <div>
          <strong style={{ color: '#1E40FF' }}>{r.click_count.toLocaleString('vi-VN')}</strong>
          <span style={{ color: '#64748B', fontSize: '0.75rem' }}>
            {' '}
            ({(r.unique_click_count ?? r.click_count).toLocaleString('vi-VN')} unique)
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'right',
      render: (r) => {
        const fullShort = `${originUrl}/api/v1/public/marketing/r/${r.short_code}`;
        return (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(fullShort);
                toast.success('Đã sao chép Shortlink!');
              }}
              className="btn secondary sm"
              style={{ height: 34 }}
              title="Sao chép link"
            >
              <Copy size={13} />
            </button>
            <button
              type="button"
              onClick={() => onOpenAnalytics(r.id)}
              className="btn secondary sm"
              style={{ height: 34, color: '#0284C7', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <BarChart3 size={13} /> Thống kê
            </button>
            <button
              type="button"
              onClick={() =>
                onOpenQrDesigner({
                  title: `Branded QR — ${r.title}`,
                  defaultValue: fullShort,
                  initialDesign: r.qr_design,
                  target: { kind: 'shortlink', id: r.id },
                })
              }
              className="btn secondary sm"
              style={{ height: 34, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <QrCode size={13} /> Thiết kế QR
            </button>
            <a href={fullShort} target="_blank" rel="noreferrer" className="btn secondary sm" style={{ height: 34, display: 'inline-flex', alignItems: 'center' }}>
              <ExternalLink size={13} />
            </a>
            <button type="button" onClick={() => void handleDeleteShortlink(r)} className="btn secondary sm" style={{ height: 34, color: '#DC2626' }}>
              <Trash2 size={13} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card title="Tạo Đường Dẫn Rút Gọn Kèm UTM Tracking (`/api/v1/public/marketing/r/:code`)">
        <form
          onSubmit={(e) => void handleCreateShortlink(e)}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 120px 120px 130px auto', gap: 8 }}
        >
          <input className="form-input" style={{ height: 44 }} placeholder="Tên chiến dịch Shortlink..." value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
          <input className="form-input" style={{ height: 44 }} placeholder="URL đích (https://...)" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
          <input className="form-input" style={{ height: 44 }} placeholder="utm_source" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} />
          <input className="form-input" style={{ height: 44 }} placeholder="utm_medium" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} />
          <input className="form-input" style={{ height: 44 }} placeholder="utm_campaign" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} />
          <button
            type="submit"
            style={{
              height: 44,
              padding: '0 1.15rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Rút gọn & Tạo QR
          </button>
        </form>
      </Card>

      <Table
        columns={shortlinkCols}
        rows={shortlinks}
        rowKey={(r) => r.id}
        emptyTitle="Chưa có Shortlink nào"
        emptyDescription="Tạo đường dẫn rút gọn để đo chính xác lượt quét QR Standee, SMS hoặc Zalo."
      />
    </div>
  );
};

export default ShortlinksTabPanel;
