import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Code2,
  Edit3,
  Gift,
  Link2,
  Plus,
  QrCode,
  RefreshCw,
  Ticket,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Card,
  EmptyState,
  FormCard,
  PillTabs,
} from '../../components/ui/AutoDataLoadingModal';
import { StudioBuilderSkeleton } from '../../components/ui/Skeleton';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { LinkClicksTab } from './LinkClicksTab';
import { PosRedeemPanel } from './PosRedeemPanel';
import { QRDesignerModal, QRDesignerStudio } from './QRDesignerModal';
import { ShortlinksTabPanel } from './ShortlinksTabPanel';
import { VoucherCampaignModal } from './VoucherCampaignModal';
import { VoucherCodeManager } from './VoucherCodeManager';
import {
  formatVoucherRewardLabel,
  type BrandedQrOptions,
  type ShortlinkItemDto,
  type VoucherPoolDto,
} from './voucherTypes';

type VoucherModuleTab = 'pools' | 'pos_redeem' | 'shortlinks' | 'clicks_analytics' | 'qr_designer';

export const MarketingVouchersPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology, can } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<VoucherModuleTab>('pools');
  const [pools, setPools] = useState<VoucherPoolDto[]>([]);
  const [shortlinks, setShortlinks] = useState<ShortlinkItemDto[]>([]);

  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<VoucherPoolDto | null>(null);
  const [codeManagerPool, setCodeManagerPool] = useState<VoucherPoolDto | null>(null);
  const [codeManagerTab, setCodeManagerTab] = useState<'codes' | 'api_embed'>('codes');
  const [selectedAnalyticsLinkId, setSelectedAnalyticsLinkId] = useState<string>('');

  const [qrModalState, setQrModalState] = useState<{
    open: boolean;
    title?: string;
    defaultValue?: string;
    initialDesign?: Partial<BrandedQrOptions>;
    target?: { kind: 'voucher' | 'shortlink'; id: string } | null;
  }>({ open: false });

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
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải Kho Voucher.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  const handleDeletePool = async (pool: VoucherPoolDto) => {
    try {
      await apiRequest(`/marketing/vouchers/${pool.id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success(`Đã xóa chiến dịch "${pool.name}".`);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa chiến dịch Voucher.'));
    }
  };

  if (loading) {
    return <StudioBuilderSkeleton />;
  }

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://domation.net';
  const totalCodes = pools.reduce((s, p) => s + (p.total_codes || 0), 0);
  const totalRedeemed = pools.reduce((s, p) => s + (p.redeemed_codes || 0), 0);
  const totalLinkClicks = shortlinks.reduce((s, l) => s + (l.click_count || 0), 0);

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
                  Mã Ưu Đãi Voucher, Shortlink UTM & Branded QR Studio
                </h1>
                <Badge tone="primary">POS Redeem & Anti-Fraud</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3, marginBottom: 0 }}>
                Quản lý lô mã ưu đãi, trang nhận mã công khai `/claim/:slug`, gạch mã tại quầy ghi vào Timeline {terminology.customerLabel} 360° & xuất QR thương hiệu.
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
                onClick={() => {
                  setEditingPool(null);
                  setCampaignModalOpen(true);
                }}
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
                <Plus size={16} /> Tạo Chiến Dịch Voucher
              </button>
            )}
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>CHIẾN DỊCH VOUCHER</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{pools.length}</div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>TỔNG MÃ ĐÃ PHÁT HÀNH</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>{totalCodes.toLocaleString('vi-VN')}</div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>ĐÃ QUY ĐỔI TẠI QUẦY (POS)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>{totalRedeemed.toLocaleString('vi-VN')}</div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>LƯỢT QUÉT QR / SHORTLINK</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>{totalLinkClicks.toLocaleString('vi-VN')}</div>
        </Card>
      </div>

      <PillTabs
        tabs={[
          { key: 'pools', label: 'Chiến Dịch & Kho Mã', icon: <Gift size={15} />, count: pools.length },
          { key: 'pos_redeem', label: 'Gạch Mã Quầy POS / SO', icon: <CheckCircle2 size={15} /> },
          { key: 'shortlinks', label: 'Rút Gọn Link & QR', icon: <Link2 size={15} />, count: shortlinks.length },
          { key: 'clicks_analytics', label: 'Phân Tích Click & UTM', icon: <BarChart3 size={15} /> },
          { key: 'qr_designer', label: 'Branded QR Studio', icon: <QrCode size={15} /> },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'pools' &&
        (pools.length === 0 ? (
          <EmptyState
            icon={<Gift size={24} />}
            title="Chưa có Chiến dịch Voucher nào"
            description="Khởi tạo kho mã ưu đãi theo %, giảm tiền mặt hoặc quà tặng kèm trang nhận mã công khai."
            action={
              <button
                type="button"
                onClick={() => {
                  setEditingPool(null);
                  setCampaignModalOpen(true);
                }}
                style={{ height: 42, padding: '0 1.2rem', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
              >
                + Tạo Chiến dịch đầu tiên
              </button>
            }
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
            {pools.map((p) => {
              const claimUrl = `${originUrl}/claim/${p.slug || p.id}`;
              return (
                <FormCard
                  key={p.id}
                  icon={<Gift size={18} />}
                  title={p.name}
                  description={`${p.code_prefix}-XXXXXX • ${formatVoucherRewardLabel(
                    p.discount_type,
                    p.discount_value,
                    formatVnd
                  )}${p.min_order_vnd > 0 ? ` • Đơn tối thiểu ${formatVnd(p.min_order_vnd)}` : ''}`}
                  badge={
                    <Badge tone={p.status === 'active' ? 'success' : 'neutral'}>
                      {p.redeemed_codes}/{p.total_codes} đã gạch
                    </Badge>
                  }
                  footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.73rem', color: '#64748B' }}>
                        Đã cấp: <b>{p.claimed_codes}</b>
                        {p.expires_at ? ` • HSD: ${formatShortDate(p.expires_at)}` : ''}
                      </span>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setCodeManagerPool(p);
                            setCodeManagerTab('codes');
                          }}
                          className="btn secondary sm"
                          style={{ height: 34, color: '#1E40FF', fontWeight: 700 }}
                        >
                          Kho mã
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCodeManagerPool(p);
                            setCodeManagerTab('api_embed');
                          }}
                          className="btn secondary sm"
                          style={{ height: 34 }}
                          title="Link nhận công khai & API"
                        >
                          <Code2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setQrModalState({
                              open: true,
                              title: `Branded QR Nhận Ưu Đãi — ${p.name}`,
                              defaultValue: claimUrl,
                              initialDesign: p.qr_design,
                              target: { kind: 'voucher', id: p.id },
                            })
                          }
                          className="btn secondary sm"
                          style={{ height: 34, color: '#1E40FF' }}
                          title="Thiết kế mã QR nhận Voucher"
                        >
                          <QrCode size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPool(p);
                            setCampaignModalOpen(true);
                          }}
                          className="btn secondary sm"
                          style={{ height: 34 }}
                          title="Sửa quy tắc"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeletePool(p)}
                          className="btn secondary sm"
                          style={{ height: 34, color: '#DC2626' }}
                          title="Xóa chiến dịch"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
        ))}

      {activeTab === 'pos_redeem' && <PosRedeemPanel onRedeemed={() => void reload()} />}

      {activeTab === 'shortlinks' && (
        <ShortlinksTabPanel
          shortlinks={shortlinks}
          originUrl={originUrl}
          onReload={reload}
          onOpenAnalytics={(id) => {
            setSelectedAnalyticsLinkId(id);
            setActiveTab('clicks_analytics');
          }}
          onOpenQrDesigner={(args) =>
            setQrModalState({
              open: true,
              title: args.title,
              defaultValue: args.defaultValue,
              initialDesign: args.initialDesign,
              target: args.target,
            })
          }
        />
      )}

      {activeTab === 'clicks_analytics' && (
        <LinkClicksTab shortlinks={shortlinks} initialShortLinkId={selectedAnalyticsLinkId} />
      )}

      {activeTab === 'qr_designer' && (
        <QRDesignerStudio pools={pools} shortlinks={shortlinks} onSaved={() => void reload()} />
      )}

      <VoucherCampaignModal
        isOpen={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        editingPool={editingPool}
        onSaved={() => void reload()}
      />

      <VoucherCodeManager
        isOpen={Boolean(codeManagerPool)}
        onClose={() => setCodeManagerPool(null)}
        pool={codeManagerPool}
        initialTab={codeManagerTab}
        onChanged={() => void reload()}
      />

      <QRDesignerModal
        isOpen={qrModalState.open}
        onClose={() => setQrModalState({ open: false })}
        title={qrModalState.title}
        defaultValue={qrModalState.defaultValue}
        initialDesign={qrModalState.initialDesign}
        pools={pools}
        shortlinks={shortlinks}
        preselectedTarget={qrModalState.target || null}
        onSaved={() => void reload()}
      />
    </div>
  );
};

export default MarketingVouchersPage;
