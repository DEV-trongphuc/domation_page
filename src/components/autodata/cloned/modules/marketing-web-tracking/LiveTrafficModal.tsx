import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Flame,
  Globe,
  MapPin,
  Monitor,
  RefreshCw,
  Smartphone,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { shortenUrlPath, type LiveTrafficResponseDto } from './webTrackingTypes';

export interface LiveTrafficModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveTrafficModal: React.FC<LiveTrafficModalProps> = ({ isOpen, onClose }) => {
  const { token, tenantSlug } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LiveTrafficResponseDto | null>(null);

  const loadLiveTraffic = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<LiveTrafficResponseDto>(
        '/marketing/web-tracking/live-traffic',
        { token, tenantSlug }
      );
      setData(res);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải luồng truy cập trực tiếp.'));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const fetchOnce = async () => {
      try {
        const res = await apiRequest<LiveTrafficResponseDto>(
          '/marketing/web-tracking/live-traffic',
          { token, tenantSlug }
        );
        if (!cancelled) setData(res);
      } catch {
        // Silent background refresh fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchOnce();
    const timer = window.setInterval(() => {
      void fetchOnce();
    }, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isOpen, token, tenantSlug]);

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Live Traffic Radar — Khách Truy Cập Trực Tiếp (30 Phút Qua)"
      width={860}
    >
      {loading && !data ? (
        <ModalBodySkeleton rows={4} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge tone="success" icon={<Activity size={12} />}>
                {data?.active_now_count ?? 0} đang online
              </Badge>
              <Badge tone="info">Tổng gần đây: {data?.recent_total_count ?? 0} phiên</Badge>
            </div>
            <button
              type="button"
              onClick={() => void loadLiveTraffic()}
              className="btn secondary sm"
              style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <RefreshCw size={13} /> Làm mới ngay
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            <Card title="Trang Đang Xem Nhiều Nhất" padding="0.95rem 1.1rem">
              {(data?.top_pages || []).length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Chưa có lượt xem trang</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(data?.top_pages || []).slice(0, 4).map((p) => (
                    <div key={p.page_url} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', gap: 8 }}>
                      <span style={{ color: '#0F172A', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shortenUrlPath(p.page_url)}
                      </span>
                      <strong style={{ color: '#1E40FF' }}>{p.views}</strong>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Vị Trí GeoIP & Thiết Bị" padding="0.95rem 1.1rem">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(data?.by_country || []).map((c) => (
                  <Badge key={c.country} tone="primary" icon={<MapPin size={11} />}>
                    {c.country}: {c.count}
                  </Badge>
                ))}
                {(data?.by_device || []).map((d) => (
                  <Badge key={d.device} tone="neutral">
                    {d.device}: {d.count}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>

          {(data?.active_visitors || []).length === 0 ? (
            <EmptyState
              icon={<Globe size={24} />}
              title="Hiện không có khách đang truy cập trong 30 phút qua"
              description="Bắn thử sự kiện từ tab 'SDK Properties' hoặc nhúng mã JS SDK lên Website để theo dõi khách trực tiếp."
            />
          ) : (
            <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(data?.active_visitors || []).map((v) => (
                <div
                  key={v.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 14,
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {v.lead_id ? (
                        <span style={{ fontWeight: 800, color: '#1E40FF', fontSize: '0.86rem' }}>
                          <UserCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
                          {v.name || 'Khách 360°'} ({v.phone || v.email || 'Đã định danh'})
                        </span>
                      ) : (
                        <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.86rem' }}>
                          Khách ẩn danh ({v.visitor_token})
                        </span>
                      )}
                      {v.pricing_intent_detected && (
                        <Badge tone="danger" icon={<Flame size={11} />}>
                          Đang xem Bảng giá
                        </Badge>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 3 }}>
                      Trang hiện tại: <code>{v.last_url || '/'}</code>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge
                      tone="neutral"
                      icon={v.device_type === 'mobile' ? <Smartphone size={11} /> : <Monitor size={11} />}
                    >
                      {v.geo_city ? `${v.geo_city}, ` : ''}
                      {v.geo_country || 'VN'}
                    </Badge>
                    <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                      {formatShortDate(v.last_seen_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </CustomModal>
  );
};

export default LiveTrafficModal;
