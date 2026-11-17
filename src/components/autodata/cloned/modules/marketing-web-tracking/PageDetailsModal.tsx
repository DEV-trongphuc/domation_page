import React, { useEffect, useState } from 'react';
import { Eye, MousePointerClick, UserCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type { PageDetailsResponseDto } from './webTrackingTypes';

export interface PageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageUrl: string | null;
}

export const PageDetailsModal: React.FC<PageDetailsModalProps> = ({
  isOpen,
  onClose,
  pageUrl,
}) => {
  const { token, tenantSlug } = useAuth();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<PageDetailsResponseDto | null>(null);

  useEffect(() => {
    if (!isOpen || !pageUrl) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiRequest<PageDetailsResponseDto>(
          `/marketing/web-tracking/page-details?page_url=${encodeURIComponent(pageUrl)}`,
          { token, tenantSlug }
        );
        if (!cancelled) setDetails(res);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải phân tích chi tiết trang.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, pageUrl, token, tenantSlug]);

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Phân Tích Chi Tiết Trang — ${pageUrl || ''}`}
      width={760}
    >
      {loading || !details ? (
        <ModalBodySkeleton rows={4} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: '#F8FAFF', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Eye size={12} /> LƯỢT XEM
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
                {details.pageviews.toLocaleString('vi-VN')}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: '#F8FAFF', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={12} /> PHIÊN DUY NHẤT
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                {details.unique_sessions.toLocaleString('vi-VN')}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                <UserCheck size={12} /> KHÁCH 360°
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
                {details.identified_leads.toLocaleString('vi-VN')}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: '#EFF6FF', border: '1px solid #DBEAFE' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1E40FF', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MousePointerClick size={12} /> CUỘN TRUNG BÌNH
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
                {details.avg_scroll_depth_pct}%
              </div>
            </div>
          </div>

          <Card
            title="Xếp Hạng Phần Tử DOM Được Nhấp Nhiều Nhất (Element Selector Hotspots)"
            subtitle={`Tổng ${details.clicks.toLocaleString('vi-VN')} sự kiện Click ghi nhận trên URL này`}
          >
            {details.top_elements.length === 0 ? (
              <EmptyState
                title="Chưa ghi nhận Click vào phần tử DOM nào trên trang này"
                description="Khi khách hàng click vào nút CTA hoặc liên kết, bộ chọn CSS (element_selector) sẽ được xếp hạng tại đây."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {details.top_elements.map((el, idx) => {
                  const maxCnt = Math.max(1, details.top_elements[0]?.count || 1);
                  const pct = Math.max(8, Math.round((el.count / maxCnt) * 100));
                  return (
                    <div
                      key={el.selector}
                      style={{
                        padding: '0.65rem 0.9rem',
                        borderRadius: 12,
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 5,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Badge tone={idx === 0 ? 'primary' : 'neutral'}>#{idx + 1}</Badge>
                          <code style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>
                            {el.selector}
                          </code>
                        </div>
                        <strong style={{ color: '#1E40FF', fontSize: '0.82rem' }}>
                          {el.count} clicks
                        </strong>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            borderRadius: 999,
                            background: 'linear-gradient(90deg, #1E40FF 0%, #06B6D4 100%)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </CustomModal>
  );
};

export default PageDetailsModal;
