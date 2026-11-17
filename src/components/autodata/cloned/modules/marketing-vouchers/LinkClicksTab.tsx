import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Globe,
  Monitor,
  MousePointerClick,
  RefreshCw,
  Smartphone,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, Table, type TableColumn } from '../../components/ui/AutoDataLoadingModal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  normalizeClicksAnalytics,
  type BreakdownBucketDto,
  type ClicksAnalyticsNormalized,
  type RecentLinkClickDto,
  type ShortlinkItemDto,
} from './voucherTypes';

export interface LinkClicksTabProps {
  shortlinks: ShortlinkItemDto[];
  initialShortLinkId?: string;
}

const BarBreakdownCard: React.FC<{
  title: string;
  subtitle?: string;
  items: BreakdownBucketDto[];
  accentColor?: string;
}> = ({ title, subtitle, items, accentColor = '#1E40FF' }) => {
  const maxVal = Math.max(1, ...items.map((x) => x.count));
  return (
    <Card title={title} subtitle={subtitle}>
      {items.length === 0 ? (
        <div style={{ fontSize: '0.8rem', color: '#94A3B8', padding: '0.75rem 0' }}>
          Chưa ghi nhận dữ liệu phân bổ cho nhóm này.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.slice(0, 6).map((item) => {
            const widthPct = Math.max(6, Math.round((item.count / maxVal) * 100));
            return (
              <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{item.label || item.key || 'direct'}</span>
                  <strong style={{ color: accentColor }}>{item.count.toLocaleString('vi-VN')} lượt</strong>
                </div>
                <div style={{ height: 7, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${widthPct}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: accentColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export const LinkClicksTab: React.FC<LinkClicksTabProps> = ({
  shortlinks,
  initialShortLinkId = '',
}) => {
  const { token, tenantSlug } = useAuth();
  const [selectedLinkId, setSelectedLinkId] = useState<string>(initialShortLinkId);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ClicksAnalyticsNormalized>(() =>
    normalizeClicksAnalytics(null)
  );

  const fetchAnalytics = useCallback(
    async (linkId: string) => {
      const qs = linkId ? `?short_link_id=${encodeURIComponent(linkId)}` : '';
      const raw = await apiRequest<Record<string, unknown>>(
        `/marketing/vouchers/clicks-analytics${qs}`,
        { token, tenantSlug }
      );
      return normalizeClicksAnalytics(raw);
    },
    [token, tenantSlug]
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAnalytics(selectedLinkId);
      setAnalytics(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải báo cáo phân tích lượt Click Shortlink.'));
    } finally {
      setLoading(false);
    }
  }, [fetchAnalytics, selectedLinkId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAnalytics(selectedLinkId);
        if (!cancelled) setAnalytics(data);
      } catch {
        // Fallback to aggregated counts from shortlinks list if endpoint has zero clicks yet
        if (!cancelled) {
          const filtered = selectedLinkId
            ? shortlinks.filter((s) => s.id === selectedLinkId)
            : shortlinks;
          const totalClicks = filtered.reduce((sum, s) => sum + (s.click_count || 0), 0);
          const uniqueClicks = filtered.reduce(
            (sum, s) => sum + (s.unique_click_count ?? s.click_count ?? 0),
            0
          );
          setAnalytics({
            totalClicks,
            uniqueClicks,
            devices: [],
            utmSources: filtered
              .filter((s) => s.utm_source)
              .map((s) => ({ key: s.utm_source, label: s.utm_source, count: s.click_count })),
            utmMediums: filtered
              .filter((s) => s.utm_medium)
              .map((s) => ({ key: s.utm_medium, label: s.utm_medium, count: s.click_count })),
            utmCampaigns: filtered
              .filter((s) => s.utm_campaign)
              .map((s) => ({ key: s.utm_campaign, label: s.utm_campaign, count: s.click_count })),
            referrers: [],
            recentClicks: [],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAnalytics, selectedLinkId, shortlinks]);

  const recentColumns: Array<TableColumn<RecentLinkClickDto>> = [
    {
      key: 'link',
      header: 'Shortlink / Khách Hàng',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>
            {r.title || (r.short_code ? `/r/${r.short_code}` : 'Shortlink Redirect')}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
            {r.lead_name ? `Khách 360°: ${r.lead_name}` : r.client_ip ? `IP: ${r.client_ip}` : 'Khách vãng lai'}
          </div>
        </div>
      ),
    },
    {
      key: 'device',
      header: 'Thiết Bị',
      render: (r) => (
        <Badge
          tone={r.device_type === 'mobile' ? 'info' : 'neutral'}
          icon={r.device_type === 'mobile' ? <Smartphone size={11} /> : <Monitor size={11} />}
        >
          {r.device_type === 'mobile' ? 'Mobile' : 'Desktop'}
        </Badge>
      ),
    },
    {
      key: 'utm',
      header: 'UTM Source / Medium / Campaign',
      render: (r) => (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <Badge tone="primary">{r.utm_source || 'direct'}</Badge>
          {r.utm_medium && <Badge tone="neutral">{r.utm_medium}</Badge>}
          {r.utm_campaign && <Badge tone="info">{r.utm_campaign}</Badge>}
        </div>
      ),
    },
    {
      key: 'referrer',
      header: 'Nguồn Giới Thiệu (Referrer)',
      render: (r) => (
        <span style={{ fontSize: '0.78rem', color: '#475569' }}>
          <Globe size={12} style={{ display: 'inline', marginRight: 4, color: '#94A3B8' }} />
          {r.referrer || 'Trực tiếp (Direct)'}
        </span>
      ),
    },
    {
      key: 'time',
      header: 'Thời Gian Click',
      align: 'right',
      render: (r) => formatShortDate(r.clicked_at),
    },
  ];

  const mobileCount =
    analytics.devices.find((d) => d.key.toLowerCase().includes('mobile'))?.count || 0;
  const desktopCount =
    analytics.devices.find((d) => d.key.toLowerCase().includes('desktop'))?.count || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card padding="1rem 1.25rem">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color="#1E40FF" />
            <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
              Báo Cáo Lượt Quét QR & Click Shortlink Theo UTM
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              className="form-input"
              style={{ height: 40, minWidth: 240 }}
              value={selectedLinkId}
              onChange={(e) => setSelectedLinkId(e.target.value)}
            >
              <option value="">Tất cả Shortlink ({shortlinks.length})</option>
              {shortlinks.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} (/r/{s.short_code} • {s.click_count} clicks)
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void reload()}
              className="btn secondary sm"
              style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <RefreshCw size={14} /> Làm mới
            </button>
          </div>
        </div>
      </Card>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Card padding="1.1rem 1.25rem">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TỔNG LƯỢT CLICK</span>
                <MousePointerClick size={16} color="#1E40FF" />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
                {analytics.totalClicks.toLocaleString('vi-VN')}
              </div>
            </Card>
            <Card padding="1.1rem 1.25rem">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>UNIQUE CLICKS</span>
                <Users size={16} color="#059669" />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
                {analytics.uniqueClicks.toLocaleString('vi-VN')}
              </div>
            </Card>
            <Card padding="1.1rem 1.25rem">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>THIẾT BỊ DI ĐỘNG</span>
                <Smartphone size={16} color="#0284C7" />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>
                {mobileCount.toLocaleString('vi-VN')}
              </div>
            </Card>
            <Card padding="1.1rem 1.25rem">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>MÁY TÍNH DESKTOP</span>
                <Monitor size={16} color="#475569" />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                {desktopCount.toLocaleString('vi-VN')}
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <BarBreakdownCard
              title="Phân Bổ Thiết Bị (Device Breakdown)"
              subtitle="Tỷ trọng quét QR trên Mobile so với Desktop"
              items={analytics.devices}
              accentColor="#1E40FF"
            />
            <BarBreakdownCard
              title="UTM Source & Medium"
              subtitle="Kênh phát tán mang lại nhiều lượt truy cập nhất"
              items={
                analytics.utmSources.length > 0 ? analytics.utmSources : analytics.utmMediums
              }
              accentColor="#0284C7"
            />
            <BarBreakdownCard
              title="UTM Campaign & Referrer"
              subtitle="Chiến dịch quảng cáo và tên miền giới thiệu"
              items={
                analytics.utmCampaigns.length > 0 ? analytics.utmCampaigns : analytics.referrers
              }
              accentColor="#059669"
            />
          </div>

          <Card title="Nhật Ký Lượt Click Gần Nhất (Real-Time Click Stream)">
            <Table
              columns={recentColumns}
              rows={analytics.recentClicks}
              rowKey={(r) => r.id}
              emptyTitle="Chưa có nhật ký Click chi tiết"
              emptyDescription="Mở hoặc quét thử bất kỳ đường dẫn `/api/v1/public/marketing/r/:code` nào để ghi nhận thiết bị, UTM và Referrer tức thì."
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default LinkClicksTab;
