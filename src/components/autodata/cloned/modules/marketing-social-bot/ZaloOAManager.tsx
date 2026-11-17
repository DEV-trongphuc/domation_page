import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, Save, ShieldCheck, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { Skeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type { ZaloOaConfigDto } from './socialBotTypes';

export interface ZaloOAManagerProps {
  onOaLoaded?: (oa: ZaloOaConfigDto) => void;
}

export const ZaloOAManager: React.FC<ZaloOAManagerProps> = ({ onOaLoaded }) => {
  const { token, tenantSlug } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [oa, setOa] = useState<ZaloOaConfigDto>({
    oa_id: '',
    oa_name: 'Zalo Official Account',
    app_id: '',
    status: 'connected',
    daily_quota: 1000,
    sent_today: 0,
    quality_rating: 'high',
  });

  const loadOa = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<ZaloOaConfigDto>('/marketing/social-bot/zalo-oa', {
        token,
        tenantSlug,
      });
      setOa(res);
      onOaLoaded?.(res);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải cấu hình Zalo Official Account.'));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, onOaLoaded]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest<ZaloOaConfigDto>('/marketing/social-bot/zalo-oa', {
          token,
          tenantSlug,
        });
        if (!cancelled) {
          setOa(res);
          onOaLoaded?.(res);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tenantSlug, onOaLoaded]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await apiRequest<ZaloOaConfigDto>('/marketing/social-bot/zalo-oa', {
        method: 'PUT',
        token,
        tenantSlug,
        body: oa,
      });
      setOa(saved);
      onOaLoaded?.(saved);
      toast.success('Đã lưu cấu hình kết nối Zalo Official Account (`mkt_zalo_oa_configs`)!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu cấu hình Zalo OA.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton width={240} height={18} />
          <Skeleton width="100%" height={44} borderRadius={10} />
        </div>
      </Card>
    );
  }

  const quotaPct = Math.min(
    100,
    Math.round(((oa.sent_today || 0) / Math.max(1, oa.daily_quota || 1000)) * 100)
  );

  return (
    <Card
      title="Cổng Kết Nối Zalo Official Account & Hạn Mức ZNS (`mkt_zalo_oa_configs`)"
      subtitle="Đồng bộ trực tiếp với Kho Khóa Bảo Mật (Integration Vault) theo từng doanh nghiệp"
      actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge
            tone={oa.status === 'connected' ? 'success' : 'info'}
            icon={<CheckCircle2 size={12} />}
          >
            {oa.status === 'connected' ? 'OA Đã xác thực' : 'Chế độ Sandbox'}
          </Badge>
          <Badge tone="primary" icon={<ShieldCheck size={12} />}>
            Chất lượng: {(oa.quality_rating || 'high').toUpperCase()}
          </Badge>
          <button
            type="button"
            onClick={() => void loadOa()}
            className="btn secondary sm"
            style={{ height: 34 }}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      }
    >
      <form onSubmit={(e) => void handleSave(e)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 150px', gap: 10 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              <Smartphone size={13} style={{ display: 'inline', marginRight: 4 }} /> Tên hiển thị Zalo OA
            </label>
            <input
              className="form-input"
              style={{ height: 42 }}
              value={oa.oa_name}
              onChange={(e) => setOa((p) => ({ ...p, oa_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Zalo OA ID</label>
            <input
              className="form-input"
              style={{ height: 42 }}
              placeholder="VD: 409281726354..."
              value={oa.oa_id}
              onChange={(e) => setOa((p) => ({ ...p, oa_id: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Zalo App ID</label>
            <input
              className="form-input"
              style={{ height: 42 }}
              placeholder="VD: 2819283746..."
              value={oa.app_id}
              onChange={(e) => setOa((p) => ({ ...p, app_id: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Hạn mức / ngày</label>
            <input
              type="number"
              min={10}
              className="form-input"
              style={{ height: 42 }}
              value={oa.daily_quota}
              onChange={(e) => setOa((p) => ({ ...p, daily_quota: Number(e.target.value || 1000) }))}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>
                Đã gửi hôm nay: <b>{(oa.sent_today || 0).toLocaleString('vi-VN')}</b> / {(oa.daily_quota || 1000).toLocaleString('vi-VN')} tin
              </span>
              <strong style={{ color: '#1E40FF' }}>{quotaPct}%</strong>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: '#E2E8F0', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.max(4, quotaPct)}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #1E40FF 0%, #06B6D4 100%)',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              height: 42,
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
            <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu Kết Nối OA'}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default ZaloOAManager;
