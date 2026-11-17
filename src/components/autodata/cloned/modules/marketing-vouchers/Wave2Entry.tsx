import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Gift,
  Link2,
  Plus,
  QrCode,
  RefreshCw,
  Ticket,
  Trash2,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  FormCard,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import {
  downloadSvgAsPng,
  downloadSvgString,
  generateBrandedQrSvg,
} from './qrGenerator';

type VoucherModuleTab = 'pools' | 'pos_redeem' | 'shortlinks' | 'qr_designer';

interface VoucherPoolDto {
  id: string;
  name: string;
  slug: string;
  code_prefix: string;
  discount_type: 'percentage' | 'fixed_vnd' | 'gift';
  discount_value: number;
  min_order_vnd: number;
  expires_at: string | null;
  total_codes: number;
  claimed_codes: number;
  redeemed_codes: number;
}

interface VoucherCodeLogDto {
  id: string;
  code: string;
  status: string;
  name?: string;
  phone?: string;
  email?: string;
  redeemed_order_vnd: number;
  redeemed_by_note?: string;
  redeemed_at?: string;
}

interface ShortlinkItemDto {
  id: string;
  title: string;
  short_code: string;
  target_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  click_count: number;
  created_at?: string;
}

export const MarketingVouchersPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology, can } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<VoucherModuleTab>('pools');
  const [pools, setPools] = useState<VoucherPoolDto[]>([]);
  const [shortlinks, setShortlinks] = useState<ShortlinkItemDto[]>([]);

  // Create Pool Modal
  const [poolModalOpen, setPoolModalOpen] = useState(false);
  const [poolName, setPoolName] = useState('');
  const [prefix, setPrefix] = useState('DOM');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_vnd'>('percentage');
  const [discountValue, setDiscountValue] = useState('20');
  const [batchCount, setBatchCount] = useState('25');

  // Codes & CSV Modal
  const [selectedPool, setSelectedPool] = useState<VoucherPoolDto | null>(null);
  const [poolCodes, setPoolCodes] = useState<VoucherCodeLogDto[]>([]);
  const [csvText, setCsvText] = useState('');

  // POS Quick Redeem State
  const [posCode, setPosCode] = useState('');
  const [posPhone, setPosPhone] = useState('');
  const [posOrderVnd, setPosOrderVnd] = useState('1500000');
  const [posNote, setPosNote] = useState('Gạch mã tại quầy thu ngân');

  // Shortlink State
  const [linkTitle, setLinkTitle] = useState('');
  const [targetUrl, setTargetUrl] = useState('https://domation.net');
  const [utmSource, setUtmSource] = useState('qr_standee');
  const [utmCampaign, setUtmCampaign] = useState('promo_q4');

  // Branded QR Designer State
  const [qrTargetText, setQrTargetText] = useState('https://domation.net');
  const [qrFgColor, setQrFgColor] = useState('#1E40FF');
  const [qrBgColor, setQrBgColor] = useState('#FFFFFF');
  const [qrCornerRadius, setQrCornerRadius] = useState(16);
  const [qrLogoUrl, setQrLogoUrl] = useState('/imgs/autodata/ICON.png');

  const fetchAll = useCallback(async () => {
    return apiRequest<{ items?: VoucherPoolDto[]; shortlinks?: ShortlinkItemDto[] }>(
      '/marketing/vouchers',
      { token, tenantSlug }
    );
  }, [token, tenantSlug]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAll();
      setPools(res.items || []);
      setShortlinks(res.shortlinks || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách Voucher & Shortlink.'));
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAll();
        if (cancelled) return;
        setPools(res.items || []);
        setShortlinks(res.shortlinks || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  const handleCreatePool = async () => {
    if (!poolName.trim()) {
      toast.error('Vui lòng nhập tên Chiến dịch Voucher.');
      return;
    }
    try {
      await apiRequest('/marketing/vouchers', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: poolName.trim(),
          code_prefix: prefix,
          discount_type: discountType,
          discount_value: Number(discountValue || 10),
          auto_generate_count: Number(batchCount || 10),
        },
      });
      toast.success('Đã tạo Kho Voucher & phát hành lô mã ưu đãi tự động!');
      setPoolModalOpen(false);
      setPoolName('');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Kho Voucher.'));
    }
  };

  const openPoolCodes = async (pool: VoucherPoolDto) => {
    setSelectedPool(pool);
    try {
      const res = await apiRequest<{ codes?: VoucherCodeLogDto[] }>(
        `/marketing/vouchers/${pool.id}/codes`,
        { token, tenantSlug }
      );
      setPoolCodes(res.codes || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách mã.'));
    }
  };

  const handleImportCsv = async () => {
    if (!selectedPool || !csvText.trim()) return;
    try {
      await apiRequest(`/marketing/vouchers/${selectedPool.id}/import-csv`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { csv_text: csvText },
      });
      toast.success('Đã nhập danh sách mã CSV thành công!');
      setCsvText('');
      await openPoolCodes(selectedPool);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể nhập CSV mã Voucher.'));
    }
  };

  const handlePosRedeem = async () => {
    if (!posCode.trim()) {
      toast.error('Vui lòng nhập mã Voucher cần gạch.');
      return;
    }
    try {
      const res = await apiRequest<{ code: string; pool_name: string }>(
        '/marketing/vouchers/redeem',
        {
          method: 'POST',
          token,
          tenantSlug,
          body: {
            code: posCode.trim(),
            phone: posPhone.trim() || undefined,
            order_vnd: Number(posOrderVnd || 0),
            note: posNote,
          },
        }
      );
      toast.success(`Đã gạch mã ${res.code} (${res.pool_name}) & ghi vào Timeline 360°!`);
      setPosCode('');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gạch mã thất bại.'));
    }
  };

  const handleCreateShortlink = async () => {
    if (!linkTitle.trim() || !targetUrl.trim()) return;
    try {
      const created = await apiRequest<ShortlinkItemDto>('/marketing/vouchers/shortlinks', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          title: linkTitle.trim(),
          target_url: targetUrl.trim(),
          utm_source: utmSource.trim(),
          utm_campaign: utmCampaign.trim(),
        },
      });
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://domation.net';
      setQrTargetText(`${origin}/api/v1/public/marketing/r/${created.short_code}`);
      setLinkTitle('');
      toast.success('Đã tạo Shortlink & đồng bộ sang QR Designer!');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Shortlink.'));
    }
  };

  const qrSvg = useMemo(
    () =>
      generateBrandedQrSvg({
        value: qrTargetText,
        fgColor: qrFgColor,
        bgColor: qrBgColor,
        cornerRadius: qrCornerRadius,
        logoUrl: qrLogoUrl,
      }),
    [qrTargetText, qrFgColor, qrBgColor, qrCornerRadius, qrLogoUrl]
  );

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://domation.net';

  const shortlinkCols: Array<TableColumn<ShortlinkItemDto>> = [
    {
      key: 'title',
      header: 'Chiến dịch Shortlink & Đường dẫn Rút gọn',
      render: (r) => {
        const fullShort = `${originUrl}/api/v1/public/marketing/r/${r.short_code}`;
        return (
          <div>
            <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.title}</div>
            <code style={{ fontSize: '0.75rem', color: '#1E40FF' }}>{fullShort}</code>
          </div>
        );
      },
    },
    {
      key: 'utm',
      header: 'Tham số UTM',
      render: (r) => (
        <Badge tone="info">
          {r.utm_source || 'direct'} / {r.utm_campaign || 'default'}
        </Badge>
      ),
    },
    {
      key: 'clicks',
      header: 'Lượt Click Thực Tế',
      numeric: true,
      render: (r) => <strong style={{ color: '#1E40FF' }}>{r.click_count.toLocaleString('vi-VN')}</strong>,
    },
    {
      key: 'act',
      header: 'Thao tác',
      align: 'right',
      render: (r) => {
        const fullShort = `${originUrl}/api/v1/public/marketing/r/${r.short_code}`;
        return (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(fullShort);
                toast.success('Đã sao chép Shortlink!');
              }}
              className="btn secondary sm"
              style={{ height: 34 }}
            >
              <Copy size={13} />
            </button>
            <button
              type="button"
              onClick={() => {
                setQrTargetText(fullShort);
                setActiveTab('qr_designer');
              }}
              className="btn secondary sm"
              style={{ height: 34, color: '#1E40FF' }}
            >
              <QrCode size={13} /> Tạo QR
            </button>
            <a
              href={fullShort}
              target="_blank"
              rel="noreferrer"
              className="btn secondary sm"
              style={{ height: 34, display: 'inline-flex', alignItems: 'center' }}
            >
              <ExternalLink size={13} />
            </a>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang tải Kho Mã Ưu Đãi Voucher, Shortlink & QR Designer..."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#F8F9FA' }}>
      <Card padding="1.25rem 1.5rem" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 15,
                background: '#EEF2FF',
                border: '1px solid #DBEAFE',
                color: '#1E40FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ticket size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Mã Ưu Đãi Voucher, Shortlink & Trình Thiết Kế QR Thương Hiệu
                </h1>
                <Badge tone="primary">POS Redeem & UTM Tracker</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
                Tự sinh mã tiền tố, nhập CSV, gạch mã nhanh tại quầy ghi vào Timeline {terminology.customerLabel} 360° & xuất QR SVG/PNG.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <ScreenHelpButton screenKey="mkt_vouchers" />
            <button type="button" onClick={() => void reload()} className="btn secondary" style={{ height: 44 }}>
              <RefreshCw size={15} />
            </button>
            {can('vouchers_qr', 'create') && (
              <button
                type="button"
                onClick={() => setPoolModalOpen(true)}
                style={{
                  height: 44,
                  padding: '0 1.2rem',
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
                <Plus size={16} /> Tạo Kho Voucher Mới
              </button>
            )}
          </div>
        </div>
      </Card>

      <PillTabs
        tabs={[
          { key: 'pools', label: 'Kho Mã Voucher', icon: <Gift size={15} />, count: pools.length },
          { key: 'pos_redeem', label: 'Gạch Mã Nhanh Tại Quầy (POS)', icon: <CheckCircle2 size={15} /> },
          { key: 'shortlinks', label: 'Shortlink & UTM Analytics', icon: <Link2 size={15} />, count: shortlinks.length },
          { key: 'qr_designer', label: 'Branded QR Designer', icon: <QrCode size={15} /> },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'pools' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {pools.map((p) => (
            <FormCard
              key={p.id}
              icon={<Gift size={18} />}
              title={p.name}
              description={`Tiền tố: ${p.code_prefix}-XXXXXX • Mức giảm: ${
                p.discount_type === 'percentage' ? `${p.discount_value}%` : formatVnd(p.discount_value)
              }`}
              badge={<Badge tone="success">{p.redeemed_codes}/{p.total_codes} đã gạch</Badge>}
              footer={
                <>
                  <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                    Đã cấp: {p.claimed_codes} mã
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => void openPoolCodes(p)}
                      className="btn secondary sm"
                      style={{ height: 36, color: '#1E40FF' }}
                    >
                      Quản lý mã & Nhập CSV
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiRequest(`/marketing/vouchers/${p.id}`, { method: 'DELETE', token, tenantSlug });
                        toast.success('Đã xóa Kho Voucher.');
                        await reload();
                      }}
                      className="btn secondary sm"
                      style={{ height: 36, color: '#DC2626' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              }
            />
          ))}
        </div>
      )}

      {activeTab === 'pos_redeem' && (
        <Card
          title="Đối Soát & Gạch Mã Ưu Đãi Trực Tiếp Tại Quầy (POS Quick Redeem)"
          subtitle="Tự động kiểm tra hạn dùng, chống dùng trùng 2 lần và ghi lịch sử quy đổi vào Hồ sơ Khách hàng 360°"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Mã Voucher khách xuất trình</label>
              <input
                className="form-input"
                style={{ height: 44, fontWeight: 800, letterSpacing: '0.06em' }}
                placeholder="VD: DOM-VIP20..."
                value={posCode}
                onChange={(e) => setPosCode(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>SĐT {terminology.customerLabel} (Gắn Timeline 360°)</label>
              <input
                className="form-input"
                style={{ height: 44 }}
                placeholder="0909..."
                value={posPhone}
                onChange={(e) => setPosPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Giá trị hóa đơn (VNĐ)</label>
              <input
                type="number"
                className="form-input"
                style={{ height: 44 }}
                value={posOrderVnd}
                onChange={(e) => setPosOrderVnd(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Ghi chú quầy thu ngân</label>
              <input
                className="form-input"
                style={{ height: 44 }}
                value={posNote}
                onChange={(e) => setPosNote(e.target.value)}
              />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={() => void handlePosRedeem()}
              style={{
                height: 44,
                padding: '0 1.4rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Xác Nhận Hợp Lệ & Gạch Mã Ngay
            </button>
          </div>
        </Card>
      )}

      {activeTab === 'shortlinks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card title="Tạo Đường Dẫn Rút Gọn Kèm UTM Tracking (`/api/v1/public/marketing/r/:code`)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 140px 140px auto', gap: 8 }}>
              <input
                className="form-input"
                style={{ height: 44 }}
                placeholder="Tên chiến dịch link..."
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
              />
              <input
                className="form-input"
                style={{ height: 44 }}
                placeholder="URL đích (https://...)"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
              <input
                className="form-input"
                style={{ height: 44 }}
                placeholder="utm_source"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
              />
              <input
                className="form-input"
                style={{ height: 44 }}
                placeholder="utm_campaign"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
              />
              <button
                type="button"
                onClick={() => void handleCreateShortlink()}
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
                Rút gọn
              </button>
            </div>
          </Card>

          <Table
            columns={shortlinkCols}
            rows={shortlinks}
            rowKey={(r) => r.id}
            emptyTitle="Chưa có Shortlink nào"
            emptyDescription="Tạo đường dẫn rút gọn để đo chính xác lượt quét QR Standee, SMS hoặc Zalo."
          />
        </div>
      )}

      {activeTab === 'qr_designer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', alignItems: 'start' }}>
          <Card title="Trình Thiết Kế QR Thương Hiệu (Branded QR Designer)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Đường dẫn hoặc Mã ưu đãi cần mã hóa QR</label>
                <input
                  className="form-input"
                  style={{ height: 44 }}
                  value={qrTargetText}
                  onChange={(e) => setQrTargetText(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Màu mắt QR (Foreground)</label>
                  <input
                    type="color"
                    className="form-input"
                    style={{ height: 44, padding: 4 }}
                    value={qrFgColor}
                    onChange={(e) => setQrFgColor(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Màu nền (Background)</label>
                  <input
                    type="color"
                    className="form-input"
                    style={{ height: 44, padding: 4 }}
                    value={qrBgColor}
                    onChange={(e) => setQrBgColor(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Độ bo góc khung ({qrCornerRadius}px)</label>
                  <input
                    type="range"
                    min={0}
                    max={28}
                    value={qrCornerRadius}
                    onChange={(e) => setQrCornerRadius(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 12 }}
                  />
                </div>
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Logo Trung Tâm (Mặc định Logo robot <code>/imgs/autodata/ICON.png</code> hoặc URL riêng)
                </label>
                <input
                  className="form-input"
                  style={{ height: 44 }}
                  value={qrLogoUrl}
                  onChange={(e) => setQrLogoUrl(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card title="Xem Trước & Tải Xuống SVG / PNG">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button
                  type="button"
                  onClick={() => downloadSvgString(qrSvg, 'domation-branded-qr.svg')}
                  className="btn secondary"
                  style={{ height: 44, flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Download size={15} /> Tải SVG
                </button>
                <button
                  type="button"
                  onClick={() => downloadSvgAsPng(qrSvg, 'domation-branded-qr.png')}
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
                  <Download size={15} /> Tải PNG
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Voucher Pool Modal */}
      <CustomModal
        isOpen={poolModalOpen}
        onClose={() => setPoolModalOpen(false)}
        title="Khởi Tạo Kho Mã Ưu Đãi Voucher"
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="form-input"
            style={{ height: 44 }}
            placeholder="Tên chiến dịch ưu đãi (VD: Ưu đãi Khai trương Chi nhánh Mới)..."
            value={poolName}
            onChange={(e) => setPoolName(e.target.value)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Tiền tố mã (Prefix)</label>
              <input className="form-input" style={{ height: 44 }} value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Số lượng sinh tự động ban đầu</label>
              <input type="number" className="form-input" style={{ height: 44 }} value={batchCount} onChange={(e) => setBatchCount(e.target.value)} />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Hình thức giảm</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed_vnd')}
              >
                <option value="percentage">Giảm theo %</option>
                <option value="fixed_vnd">Giảm tiền mặt VNĐ</option>
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Giá trị giảm</label>
              <input type="number" className="form-input" style={{ height: 44 }} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setPoolModalOpen(false)} className="btn secondary" style={{ height: 44 }}>
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleCreatePool()}
              style={{
                height: 44,
                padding: '0 1.25rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Khởi Tạo & Sinh Mã
            </button>
          </div>
        </div>
      </CustomModal>

      {/* Pool Codes + CSV Import Modal */}
      <CustomModal
        isOpen={Boolean(selectedPool)}
        onClose={() => setSelectedPool(null)}
        title={`Danh Sách Mã & Nhật Ký Quy Đổi 360° — ${selectedPool?.name || ''}`}
        width={680}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              className="form-input"
              rows={2}
              style={{ flex: 1, padding: '0.5rem' }}
              placeholder="Dán CSV mã ưu đãi ngoài (Mỗi dòng 1 mã, dòng đầu là header 'code')..."
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            <button
              type="button"
              onClick={() => void handleImportCsv()}
              className="btn secondary"
              style={{ height: 44, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Upload size={15} /> Nhập CSV
            </button>
          </div>

          <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {poolCodes.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '0.6rem 0.85rem',
                  borderRadius: 12,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <code style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem' }}>{c.code}</code>
                  {c.name && (
                    <span style={{ fontSize: '0.76rem', color: '#475569', marginLeft: 8 }}>
                      • {c.name} ({c.phone || c.email})
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {c.redeemed_at && (
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{formatShortDate(c.redeemed_at)}</span>
                  )}
                  <Badge tone={c.status === 'redeemed' ? 'success' : c.status === 'claimed' ? 'info' : 'neutral'}>
                    {c.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default MarketingVouchersPage;
