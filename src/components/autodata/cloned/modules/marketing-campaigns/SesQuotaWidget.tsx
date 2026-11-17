import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Gauge,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton, Skeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  normalizeSesQuota,
  type SesQuotaNormalized,
  type SuppressionItem,
} from './campaignTypes';

export interface SesQuotaWidgetProps {
  onSuppressionChanged?: (count: number) => void;
}

export const SesQuotaWidget: React.FC<SesQuotaWidgetProps> = ({ onSuppressionChanged }) => {
  const { token, tenantSlug } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quota, setQuota] = useState<SesQuotaNormalized>(() => normalizeSesQuota(null));

  // Suppression Manager Modal
  const [supModalOpen, setSupModalOpen] = useState(false);
  const [supLoading, setSupLoading] = useState(false);
  const [supItems, setSupItems] = useState<SuppressionItem[]>([]);
  const [supSearch, setSupSearch] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [newChannel, setNewChannel] = useState<'email' | 'zns'>('email');
  const [newReason, setNewReason] = useState<'manual' | 'hard_bounce' | 'complaint' | 'unsubscribed'>('manual');
  const [addingSup, setAddingSup] = useState(false);

  const fetchQuotaPure = useCallback(async () => {
    const raw = await apiRequest<Record<string, unknown>>('/marketing/campaigns/ses-quota', {
      token,
      tenantSlug,
    });
    return normalizeSesQuota(raw);
  }, [token, tenantSlug]);

  const handleRefreshQuota = useCallback(async () => {
    setRefreshing(true);
    try {
      const next = await fetchQuotaPure();
      setQuota(next);
    } catch {
      // keep existing quota display
    } finally {
      setRefreshing(false);
    }
  }, [fetchQuotaPure]);

  const loadSuppressions = useCallback(async () => {
    setSupLoading(true);
    try {
      const res = await apiRequest<{ items?: SuppressionItem[] }>(
        '/marketing/campaigns/suppression/list',
        { token, tenantSlug }
      );
      const list = Array.isArray(res.items) ? res.items : [];
      setSupItems(list);
      onSuppressionChanged?.(list.length);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách chặn gửi (Suppression List).'));
    } finally {
      setSupLoading(false);
    }
  }, [token, tenantSlug, onSuppressionChanged]);

  useEffect(() => {
    let cancelled = false;
    fetchQuotaPure()
      .then((next) => {
        if (!cancelled) setQuota(next);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchQuotaPure]);

  const openSuppressionModal = () => {
    setSupModalOpen(true);
    void loadSuppressions();
  };

  const handleAddSuppression = async () => {
    const trimmed = newRecipient.trim();
    if (!trimmed) {
      toast.error('Vui lòng nhập địa chỉ Email hoặc SĐT cần chặn.');
      return;
    }
    setAddingSup(true);
    try {
      await apiRequest('/marketing/campaigns/suppression/list', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          recipient: trimmed,
          channel: newChannel,
          reason: newReason,
        },
      });
      toast.success('Đã đưa vào Danh sách chặn gửi tự động (Suppression List).');
      setNewRecipient('');
      await loadSuppressions();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thêm vào danh sách chặn.'));
    } finally {
      setAddingSup(false);
    }
  };

  if (loading) {
    return (
      <Card padding="1rem 1.25rem">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
          <Skeleton height={44} borderRadius={12} />
          <Skeleton height={44} borderRadius={12} />
          <Skeleton height={44} borderRadius={12} />
          <Skeleton height={44} borderRadius={12} />
        </div>
      </Card>
    );
  }

  const filteredSup = supItems.filter((item) => {
    const q = supSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      item.recipient.toLowerCase().includes(q) ||
      item.reason.toLowerCase().includes(q) ||
      item.channel.toLowerCase().includes(q)
    );
  });

  const bounceTone = quota.bounceRatePct >= 5 ? 'danger' : quota.bounceRatePct >= 2 ? 'warning' : 'success';
  const complaintTone =
    quota.complaintRatePct >= 0.1 ? 'danger' : quota.complaintRatePct >= 0.05 ? 'warning' : 'success';

  return (
    <>
      <Card
        padding="1rem 1.25rem"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* Provider + Reputation Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Badge
              tone={quota.healthStatus === 'good' ? 'success' : quota.healthStatus === 'warning' ? 'warning' : 'danger'}
              icon={quota.healthStatus === 'good' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            >
              {quota.provider} ({quota.region})
            </Badge>
            <Badge tone={quota.spfVerified ? 'primary' : 'warning'} icon={<ShieldCheck size={11} />}>
              SPF {quota.spfVerified ? 'Pass' : 'Pending'}
            </Badge>
            <Badge tone={quota.dkimVerified ? 'primary' : 'warning'} icon={<ShieldCheck size={11} />}>
              DKIM {quota.dkimVerified ? 'Signed' : 'Pending'}
            </Badge>
            <Badge tone={quota.dmarcVerified ? 'info' : 'neutral'} icon={<ShieldCheck size={11} />}>
              DMARC {quota.dmarcVerified ? 'Active' : 'Optional'}
            </Badge>
          </div>

          {/* 24h Quota Progress Bar */}
          <div style={{ flex: '1 1 260px', maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Zap size={13} color="#1E40FF" /> Hạn ngạch 24h: {quota.sent24h.toLocaleString('vi-VN')} / {quota.max24h.toLocaleString('vi-VN')}
              </span>
              <span style={{ color: '#1E40FF' }}>
                {quota.usagePct}% • Tốc độ {quota.maxRatePerSec}/giây
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: '#E2E8F0', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(2, quota.usagePct))}%`,
                  height: '100%',
                  borderRadius: 999,
                  background:
                    quota.usagePct > 85
                      ? '#DC2626'
                      : quota.usagePct > 65
                        ? '#D97706'
                        : 'linear-gradient(90deg, #1E40FF 0%, #0284C7 100%)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Badge tone={bounceTone} icon={<Gauge size={12} />}>Bounce: {quota.bounceRatePct}% (&lt;2%)</Badge>
            <Badge tone={complaintTone} icon={<Activity size={12} />}>Complaint: {quota.complaintRatePct}% (&lt;0.1%)</Badge>
            <button
              type="button"
              onClick={openSuppressionModal}
              className="btn secondary sm"
              style={{ height: 38, padding: '0 0.85rem', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#0F172A' }}
            >
              <Ban size={14} color="#DC2626" /> Suppression List
            </button>
            <button
              type="button"
              onClick={() => void handleRefreshQuota()}
              className="btn secondary sm"
              style={{ height: 38, width: 38, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              title="Làm mới hạn ngạch SES"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </Card>

      {/* Suppression List Manager Modal */}
      <CustomModal
        isOpen={supModalOpen}
        onClose={() => setSupModalOpen(false)}
        title="Quản Lý Danh Sách Chặn Gửi (Bounce, Complaint & Unsubscribe)"
        width={680}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: 14,
              background: '#F8FAFF',
              border: '1px solid #DBEAFE',
              display: 'grid',
              gridTemplateColumns: '1.4fr 0.7fr 0.9fr auto',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <input
              className="form-input"
              style={{ height: 42 }}
              placeholder="Nhập Email hoặc SĐT chặn gửi..."
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
            />
            <select
              className="form-input"
              style={{ height: 42 }}
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value as 'email' | 'zns')}
            >
              <option value="email">Email</option>
              <option value="zns">Zalo ZNS</option>
            </select>
            <select
              className="form-input"
              style={{ height: 42 }}
              value={newReason}
              onChange={(e) =>
                setNewReason(e.target.value as 'manual' | 'hard_bounce' | 'complaint' | 'unsubscribed')
              }
            >
              <option value="manual">Chặn thủ công</option>
              <option value="hard_bounce">Hard Bounce</option>
              <option value="complaint">Báo cáo Spam</option>
              <option value="unsubscribed">Đã Hủy ĐK</option>
            </select>
            <button
              type="button"
              disabled={addingSup}
              onClick={() => void handleAddSuppression()}
              style={{
                height: 42,
                padding: '0 1rem',
                borderRadius: 10,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Thêm
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: 12, top: 13, color: '#94A3B8', pointerEvents: 'none' }}
            />
            <input
              className="form-input"
              style={{ height: 40, paddingLeft: 36 }}
              placeholder="Tìm nhanh trong Suppression List..."
              value={supSearch}
              onChange={(e) => setSupSearch(e.target.value)}
            />
          </div>

          {supLoading ? (
            <ModalBodySkeleton rows={3} />
          ) : filteredSup.length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                borderRadius: 14,
                border: '1px dashed #CBD5E1',
                color: '#64748B',
                fontSize: '0.84rem',
              }}
            >
              Danh sách chặn gửi đang trống hoặc không khớp từ khóa tìm kiếm.
            </div>
          ) : (
            <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredSup.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.65rem 0.9rem',
                    borderRadius: 12,
                    background: '#F8F9FA',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{item.recipient}</div>
                    {item.created_at && (
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        Ghi nhận: {formatShortDate(item.created_at)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Badge tone={item.channel === 'zns' ? 'info' : 'primary'}>
                      {item.channel.toUpperCase()}
                    </Badge>
                    <Badge tone="danger">{item.reason}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CustomModal>
    </>
  );
};

export default SesQuotaWidget;
