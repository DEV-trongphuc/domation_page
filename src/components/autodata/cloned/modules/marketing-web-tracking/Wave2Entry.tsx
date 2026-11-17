import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Globe,
  MessageSquare,
  MousePointerClick,
  Plus,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { StudioBuilderSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { ConversationsTab } from './ConversationsTab';
import { DomHeatmapTab } from './DomHeatmapTab';
import { LiveTrafficModal } from './LiveTrafficModal';
import { OverviewSubTabs } from './OverviewSubTabs';
import { PageDetailsModal } from './PageDetailsModal';
import { VisitorsTab } from './VisitorsTab';
import type {
  HeatmapOverlayResponseDto,
  WebPropertyDto,
  WebSessionDto,
  WebTrackingSummaryDto,
} from './webTrackingTypes';

type WebTrackingMainTab = 'overview' | 'visitors' | 'conversations' | 'heatmap';

export const MarketingWebTrackingPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology, can } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<WebTrackingMainTab>('overview');
  const [properties, setProperties] = useState<WebPropertyDto[]>([]);
  const [audiences, setAudiences] = useState<Array<{ id: string; name: string }>>([]);
  const [sessions, setSessions] = useState<WebSessionDto[]>([]);
  const [summary, setSummary] = useState<WebTrackingSummaryDto>({
    total_sessions: 0,
    identified_leads: 0,
    pricing_intent_alerts: 0,
    total_pageviews: 0,
  });
  const [heatmap, setHeatmap] = useState<HeatmapOverlayResponseDto>({
    click_points: [],
    scroll_reach_pct: { depth_25: 0, depth_50: 0, depth_75: 0, depth_100: 0 },
    tracked_pages: [],
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [liveModalOpen, setLiveModalOpen] = useState(false);
  const [inspectPageUrl, setInspectPageUrl] = useState<string | null>(null);

  // Add Property Modal
  const [propModalOpen, setPropModalOpen] = useState(false);
  const [propName, setPropName] = useState('');
  const [propDomain, setPropDomain] = useState('');
  const [pricingPattern, setPricingPattern] = useState('/bang-gia,/pricing,/bao-gia');
  const [targetAudienceId, setTargetAudienceId] = useState('');

  const fetchAll = useCallback(async () => {
    const [ov, sess, hm] = await Promise.all([
      apiRequest<{
        properties?: WebPropertyDto[];
        audiences?: Array<{ id: string; name: string }>;
        summary?: WebTrackingSummaryDto;
      }>('/marketing/web-tracking', { token, tenantSlug }),
      apiRequest<{ items?: WebSessionDto[] }>('/marketing/web-tracking/sessions', {
        token,
        tenantSlug,
      }),
      apiRequest<HeatmapOverlayResponseDto>('/marketing/web-tracking/heatmap', {
        token,
        tenantSlug,
      }),
    ]);
    return { ov, sess, hm };
  }, [token, tenantSlug]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { ov, sess, hm } = await fetchAll();
      const props = ov.properties || [];
      setProperties(props);
      if (props[0]) {
        setSelectedPropertyId((prev) => prev || props[0].id);
      }
      setAudiences(ov.audiences || []);
      if (ov.summary) setSummary(ov.summary);
      setSessions(sess.items || []);
      setHeatmap(hm);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải dữ liệu Web Tracking.'));
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { ov, sess, hm } = await fetchAll();
        if (cancelled) return;
        const props = ov.properties || [];
        setProperties(props);
        if (props[0]) setSelectedPropertyId(props[0].id);
        setAudiences(ov.audiences || []);
        if (ov.summary) setSummary(ov.summary);
        setSessions(sess.items || []);
        setHeatmap(hm);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải dữ liệu Web Tracking.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName.trim() || !propDomain.trim()) {
      toast.error('Vui lòng nhập tên Website và tên miền.');
      return;
    }
    try {
      await apiRequest('/marketing/web-tracking/properties', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: propName.trim(),
          domain: propDomain.trim(),
          pricing_url_pattern: pricingPattern.trim(),
          target_audience_id: targetAudienceId || null,
        },
      });
      toast.success('Đã khởi tạo Website theo dõi & cấp mã JS Tracking SDK!');
      setPropModalOpen(false);
      setPropName('');
      setPropDomain('');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thêm Website theo dõi.'));
    }
  };

  if (loading) {
    return <StudioBuilderSkeleton />;
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
              <Globe size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Web Tracking Đa Kênh, Khâu Danh Tính 360° & Bản Đồ Nhiệt DOM
                </h1>
                <Badge tone="primary">Visitor-to-Lead Stitching</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3, marginBottom: 0 }}>
                Theo dõi GeoIP, UTM, cảnh báo xem Bảng giá, Web Live-Chat kèm hành trình xem trang và Heatmap tọa độ thực tế cho {terminology.customerLabel}.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <ScreenHelpButton screenKey="mkt_web_tracking" />
            <button type="button" onClick={() => void reload()} className="btn secondary" style={{ height: 44 }}>
              <RefreshCw size={15} />
            </button>
            {can('web_tracking', 'create') && (
              <button
                type="button"
                onClick={() => setPropModalOpen(true)}
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
                <Plus size={16} /> Thêm Website Theo Dõi
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>TỔNG PHIÊN TRUY CẬP</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
            {summary.total_sessions.toLocaleString('vi-VN')}
          </div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>ĐÃ KHÂU HỒ SƠ 360°</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {summary.identified_leads.toLocaleString('vi-VN')}
          </div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>CẢNH BÁO XEM BẢNG GIÁ</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#DC2626', marginTop: 4 }}>
            {summary.pricing_intent_alerts.toLocaleString('vi-VN')}
          </div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>TỔNG LƯỢT XEM TRANG</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {summary.total_pageviews.toLocaleString('vi-VN')}
          </div>
        </Card>
      </div>

      <PillTabs
        tabs={[
          { key: 'overview', label: 'Tổng Quan & 5 Sub-Tabs', icon: <BarChart3 size={15} /> },
          { key: 'visitors', label: 'Khách Truy Cập & Timeline 360°', icon: <Activity size={15} />, count: sessions.length },
          { key: 'conversations', label: 'Web Live-Chat & Page Trail', icon: <MessageSquare size={15} /> },
          { key: 'heatmap', label: 'Coordinate DOM Heatmap', icon: <MousePointerClick size={15} />, count: heatmap.click_points.length },
        ]}
        activeKey={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <OverviewSubTabs
          properties={properties}
          sessions={sessions}
          summary={summary}
          heatmap={heatmap}
          onInspectPage={(url) => setInspectPageUrl(url)}
          onOpenLiveTraffic={() => setLiveModalOpen(true)}
          onReload={reload}
        />
      )}

      {tab === 'visitors' && (
        <VisitorsTab properties={properties} selectedPropertyId={selectedPropertyId} />
      )}

      {tab === 'conversations' && <ConversationsTab />}

      {tab === 'heatmap' && (
        <DomHeatmapTab properties={properties} selectedPropertyId={selectedPropertyId} />
      )}

      <LiveTrafficModal isOpen={liveModalOpen} onClose={() => setLiveModalOpen(false)} />

      <PageDetailsModal
        isOpen={Boolean(inspectPageUrl)}
        onClose={() => setInspectPageUrl(null)}
        pageUrl={inspectPageUrl}
      />

      <CustomModal
        isOpen={propModalOpen}
        onClose={() => setPropModalOpen(false)}
        title="Đăng Ký Website Theo Dõi & Cảnh Báo Trang Giá"
        width={520}
      >
        <form onSubmit={(e) => void handleCreateProperty(e)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="form-input"
            style={{ height: 44 }}
            placeholder="Tên Website (VD: Website Chính Doanh Nghiệp)..."
            value={propName}
            onChange={(e) => setPropName(e.target.value)}
          />
          <input
            className="form-input"
            style={{ height: 44 }}
            placeholder="Tên miền (VD: congty.vn)..."
            value={propDomain}
            onChange={(e) => setPropDomain(e.target.value)}
          />
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              Từ khóa đường dẫn nhận diện Ý định mua cao (Pricing URL)
            </label>
            <input
              className="form-input"
              style={{ height: 44 }}
              value={pricingPattern}
              onChange={(e) => setPricingPattern(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              Tự động thêm khách xem trang giá vào Tệp Khách hàng
            </label>
            <select
              className="form-input"
              style={{ height: 44 }}
              value={targetAudienceId}
              onChange={(e) => setTargetAudienceId(e.target.value)}
            >
              <option value="">— Không gắn cố định —</option>
              {audiences.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setPropModalOpen(false)} className="btn secondary" style={{ height: 44 }}>
              Hủy
            </button>
            <button
              type="submit"
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
              Lưu & Lấy Mã JS SDK
            </button>
          </div>
        </form>
      </CustomModal>
    </div>
  );
};

export default MarketingWebTrackingPage;
