import React, { useMemo, useState } from 'react';
import {
  Activity,
  Code2,
  Eye,
  FileText,
  Flame,
  Share2,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import {
  Badge,
  Card,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { SdkPropertiesPanel } from './SdkPropertiesPanel';
import {
  aggregateBuckets,
  shortenUrlPath,
  type HeatmapOverlayResponseDto,
  type WebPropertyDto,
  type WebSessionDto,
  type WebTrackingSummaryDto,
} from './webTrackingTypes';

type OverviewSubTabKey = 'general' | 'pages' | 'sources' | 'devices_geo' | 'sdk_properties';

export interface OverviewSubTabsProps {
  properties: WebPropertyDto[];
  sessions: WebSessionDto[];
  summary: WebTrackingSummaryDto;
  heatmap: HeatmapOverlayResponseDto;
  onInspectPage: (pageUrl: string) => void;
  onOpenLiveTraffic: () => void;
  onReload: () => Promise<void>;
}

const BucketBars: React.FC<{
  title: string;
  subtitle?: string;
  rows: Array<{ key: string; count: number }>;
  color?: string;
}> = ({ title, subtitle, rows, color = '#1E40FF' }) => {
  const top = rows.slice(0, 6);
  const max = Math.max(1, top[0]?.count || 1);
  return (
    <Card title={title} subtitle={subtitle}>
      {top.length === 0 ? (
        <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Chưa ghi nhận dữ liệu phân bổ.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {top.map((r) => (
            <div key={r.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{r.key}</span>
                <strong style={{ color }}>{r.count.toLocaleString('vi-VN')}</strong>
              </div>
              <div style={{ height: 7, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.max(8, Math.round((r.count / max) * 100))}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export const OverviewSubTabs: React.FC<OverviewSubTabsProps> = ({
  properties,
  sessions,
  summary,
  heatmap,
  onInspectPage,
  onOpenLiveTraffic,
  onReload,
}) => {
  const [subTab, setSubTab] = useState<OverviewSubTabKey>('general');
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://domation.net';
  const rawTrackedPages = heatmap.tracked_pages;

  const trackedPages = useMemo(() => {
    if (rawTrackedPages && rawTrackedPages.length > 0) {
      return rawTrackedPages;
    }
    return aggregateBuckets(
      sessions.map((s) => s.last_url || s.entry_url),
      '/'
    ).map((b) => ({ page_url: b.key, event_count: b.count }));
  }, [rawTrackedPages, sessions]);

  const utmSources = useMemo(() => aggregateBuckets(sessions.map((s) => s.utm_source), 'direct'), [sessions]);
  const utmMediums = useMemo(() => aggregateBuckets(sessions.map((s) => s.utm_medium), '(none)'), [sessions]);
  const utmCampaigns = useMemo(() => aggregateBuckets(sessions.map((s) => s.utm_campaign), '(organic)'), [sessions]);
  const referrers = useMemo(() => aggregateBuckets(sessions.map((s) => s.referrer), 'Trực tiếp (Direct)'), [sessions]);
  const devices = useMemo(() => aggregateBuckets(sessions.map((s) => s.device_type), 'desktop'), [sessions]);
  const countries = useMemo(
    () =>
      aggregateBuckets(
        sessions.map((s) => (s.geo_city ? `${s.geo_city}, ${s.geo_country || 'VN'}` : s.geo_country || 'VN')),
        'VN'
      ),
    [sessions]
  );
  const browsers = useMemo(() => aggregateBuckets(sessions.map((s) => s.browser || s.os), 'Chrome / Web'), [sessions]);

  const pageCols: Array<TableColumn<{ page_url: string; event_count: number }>> = [
    {
      key: 'url',
      header: 'Đường Dẫn Trang (Page URL)',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{shortenUrlPath(r.page_url)}</div>
          <code style={{ fontSize: '0.73rem', color: '#64748B' }}>{r.page_url}</code>
        </div>
      ),
    },
    {
      key: 'intent',
      header: 'Loại Trang',
      render: (r) =>
        /pricing|bang-gia|bao-gia/i.test(r.page_url) ? (
          <Badge tone="danger" icon={<Flame size={11} />}>
            Pricing Intent
          </Badge>
        ) : (
          <Badge tone="neutral">Nội dung / Landing</Badge>
        ),
    },
    {
      key: 'cnt',
      header: 'Tổng Sự Kiện',
      numeric: true,
      render: (r) => <strong style={{ color: '#1E40FF' }}>{r.event_count.toLocaleString('vi-VN')}</strong>,
    },
    {
      key: 'act',
      header: 'Phân Tích Sâu',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          onClick={() => onInspectPage(r.page_url)}
          className="btn secondary sm"
          style={{ height: 34, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <Eye size={13} /> Chi tiết trang
        </button>
      ),
    },
  ];

  const stitchRate =
    summary.total_sessions > 0
      ? Math.round((summary.identified_leads / summary.total_sessions) * 100)
      : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <PillTabs
          tabs={[
            { key: 'general', label: 'General (Phễu Tổng Quan)', icon: <Activity size={14} /> },
            { key: 'pages', label: 'Pages (Trang & Sự Kiện)', icon: <FileText size={14} />, count: trackedPages.length },
            { key: 'sources', label: 'Sources / UTMs', icon: <Share2 size={14} /> },
            { key: 'devices_geo', label: 'Devices / GeoIP', icon: <Smartphone size={14} /> },
            { key: 'sdk_properties', label: 'SDK Properties', icon: <Code2 size={14} />, count: properties.length },
          ]}
          activeKey={subTab}
          onChange={setSubTab}
        />

        <button
          type="button"
          onClick={onOpenLiveTraffic}
          style={{
            height: 38,
            padding: '0 1rem',
            borderRadius: 999,
            border: '1px solid #A7F3D0',
            background: '#ECFDF5',
            color: '#059669',
            fontWeight: 800,
            fontSize: '0.78rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <Sparkles size={13} /> Mở Live Traffic Radar
        </button>
      </div>

      {subTab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <Card title="Phễu Chuyển Đổi & Khâu Danh Tính 360°" subtitle="Từ phiên ẩn danh thành Lead định danh sẵn sàng chốt Sale">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: '1. Tổng phiên truy cập Website', val: summary.total_sessions, color: '#1E40FF' },
                { label: '2. Tổng lượt tương tác / xem trang', val: summary.total_pageviews, color: '#0284C7' },
                { label: '3. Phát hiện ý định xem Bảng giá (Pricing Intent)', val: summary.pricing_intent_alerts, color: '#DC2626' },
                { label: `4. Khâu thành công vào Hồ sơ 360° (${stitchRate}%)`, val: summary.identified_leads, color: '#059669' },
              ].map((step) => (
                <div
                  key={step.label}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 12,
                    background: '#F8FAFF',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>{step.label}</span>
                  <strong style={{ fontSize: '1.05rem', fontWeight: 800, color: step.color }}>
                    {step.val.toLocaleString('vi-VN')}
                  </strong>
                </div>
              ))}
            </div>
          </Card>

          <BucketBars
            title="Top Trang Thu Hút Tương Tác"
            subtitle="Bấm sang tab 'Pages' để mở PageDetailsModal cho từng URL"
            rows={trackedPages.map((p) => ({ key: shortenUrlPath(p.page_url), count: p.event_count }))}
            color="#1E40FF"
          />
        </div>
      )}

      {subTab === 'pages' && (
        <Table
          columns={pageCols}
          rows={trackedPages}
          rowKey={(r) => r.page_url}
          emptyTitle="Chưa có trang nào được ghi nhận"
          emptyDescription="Nhúng JS SDK hoặc bấm nút giả lập sự kiện ở tab SDK Properties để thu thập lượt xem trang."
        />
      )}

      {subTab === 'sources' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <BucketBars title="UTM Source" subtitle="Nguồn chiến dịch mang khách về" rows={utmSources} color="#1E40FF" />
          <BucketBars title="UTM Medium & Campaign" subtitle="Phương thức & tên chiến dịch" rows={utmCampaigns.length > 0 ? utmCampaigns : utmMediums} color="#0284C7" />
          <BucketBars title="Referrer Domains" subtitle="Website giới thiệu bên ngoài" rows={referrers} color="#059669" />
        </div>
      )}

      {subTab === 'devices_geo' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <BucketBars title="Phân Bổ Thiết Bị (Device Type)" subtitle="Desktop vs Mobile vs Tablet" rows={devices} color="#1E40FF" />
          <BucketBars title="Vị Trí Địa Lý GeoIP (City / Country)" subtitle="Tự động phân giải theo IP phiên truy cập" rows={countries} color="#059669" />
          <BucketBars title="Trình Duyệt & Hệ Điều Hành" subtitle="Browser / OS Telemetry" rows={browsers} color="#0284C7" />
        </div>
      )}

      {subTab === 'sdk_properties' && (
        <SdkPropertiesPanel properties={properties} originUrl={originUrl} onReload={onReload} />
      )}
    </div>
  );
};

export default OverviewSubTabs;
