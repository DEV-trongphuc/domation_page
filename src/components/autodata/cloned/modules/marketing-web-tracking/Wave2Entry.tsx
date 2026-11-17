import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Code2,
  Copy,
  Flame,
  Globe,
  MousePointerClick,
  Plus,
  RefreshCw,
  Trash2,
  UserCheck,
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
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';

type TrackingTab = 'sdk' | 'sessions' | 'heatmap';

interface WebPropertyDto {
  id: string;
  name: string;
  domain: string;
  site_key: string;
  pricing_url_pattern: string;
  target_audience_id: string | null;
  target_audience_name?: string | null;
}

interface WebSessionDto {
  id: string;
  visitor_token: string;
  lead_id: string | null;
  name?: string;
  phone?: string;
  email?: string;
  lead_score?: number;
  property_domain?: string;
  last_url?: string;
  device_type: string;
  pageviews_count: number;
  pricing_intent_detected: boolean;
  last_seen_at?: string;
}

interface HeatmapResponseDto {
  click_points: Array<{
    id: string;
    x_pct: number;
    y_pct: number;
    element_selector: string;
    page_url: string;
  }>;
  scroll_reach_pct: {
    depth_25: number;
    depth_50: number;
    depth_75: number;
    depth_100: number;
  };
}

export const MarketingWebTrackingPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology, can } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TrackingTab>('sdk');
  const [properties, setProperties] = useState<WebPropertyDto[]>([]);
  const [audiences, setAudiences] = useState<Array<{ id: string; name: string }>>([]);
  const [sessions, setSessions] = useState<WebSessionDto[]>([]);
  const [summary, setSummary] = useState({
    total_sessions: 0,
    identified_leads: 0,
    pricing_intent_alerts: 0,
    total_pageviews: 0,
  });
  const [heatmap, setHeatmap] = useState<HeatmapResponseDto>({
    click_points: [],
    scroll_reach_pct: { depth_25: 0, depth_50: 0, depth_75: 0, depth_100: 0 },
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // Add Property Modal
  const [propModalOpen, setPropModalOpen] = useState(false);
  const [propName, setPropName] = useState('');
  const [propDomain, setPropDomain] = useState('');
  const [pricingPattern, setPricingPattern] = useState('/bang-gia,/pricing');
  const [targetAudienceId, setTargetAudienceId] = useState('');

  // Simulator State
  const [simPhone, setSimPhone] = useState('');
  const [simPageUrl, setSimPageUrl] = useState('https://company.vn/bang-gia');

  const fetchAll = useCallback(async () => {
    const [ov, sess, hm] = await Promise.all([
      apiRequest<{
        properties?: WebPropertyDto[];
        audiences?: Array<{ id: string; name: string }>;
        summary?: typeof summary;
      }>('/marketing/web-tracking', { token, tenantSlug }),
      apiRequest<{ items?: WebSessionDto[] }>('/marketing/web-tracking/sessions', {
        token,
        tenantSlug,
      }),
      apiRequest<HeatmapResponseDto>('/marketing/web-tracking/heatmap', {
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
      if (props[0] && !selectedPropertyId) setSelectedPropertyId(props[0].id);
      setAudiences(ov.audiences || []);
      if (ov.summary) setSummary(ov.summary);
      setSessions(sess.items || []);
      setHeatmap(hm);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải dữ liệu Web Tracking.'));
    } finally {
      setLoading(false);
    }
  }, [fetchAll, selectedPropertyId]);

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
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  const handleCreateProperty = async () => {
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
      toast.error(getErrorMessage(err, 'Không thể thêm Website.'));
    }
  };

  const handleSimulateTrack = async (prop: WebPropertyDto) => {
    try {
      await apiRequest('/public/marketing/track', {
        method: 'POST',
        body: {
          site_key: prop.site_key,
          visitor_token: `vis_${prop.id.slice(0, 6)}`,
          event_type: 'click',
          page_url: simPageUrl,
          x_pct: 52,
          y_pct: 38,
          element_selector: 'BUTTON.pricing-cta',
          phone: simPhone.trim() || undefined,
        },
      });
      await apiRequest('/public/marketing/track', {
        method: 'POST',
        body: {
          site_key: prop.site_key,
          visitor_token: `vis_${prop.id.slice(0, 6)}`,
          event_type: 'scroll',
          page_url: simPageUrl,
          scroll_depth_pct: 80,
          phone: simPhone.trim() || undefined,
        },
      });
      toast.success('Đã mô phỏng sự kiện Click/Scroll, Hợp nhất danh tính & Cảnh báo xem trang giá!');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể bắn sự kiện thử nghiệm.'));
    }
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://domation.net';
  const activeProp = properties.find((p) => p.id === selectedPropertyId) || properties[0] || null;

  const sessionCols: Array<TableColumn<WebSessionDto>> = [
    {
      key: 'visitor',
      header: `Khách Truy Cập & Định Danh ${terminology.customerLabel} 360°`,
      render: (r) => (
        <div>
          {r.lead_id ? (
            <div style={{ fontWeight: 800, color: '#1E40FF' }}>
              <UserCheck size={14} style={{ display: 'inline', marginRight: 5 }} />
              {r.name} ({r.phone || r.email})
            </div>
          ) : (
            <div style={{ fontWeight: 700, color: '#475569' }}>Khách ẩn danh ({r.visitor_token})</div>
          )}
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
            Trang cuối: {r.last_url || '/'}
          </div>
        </div>
      ),
    },
    {
      key: 'intent',
      header: 'Tín hiệu Mua hàng (Intent)',
      render: (r) =>
        r.pricing_intent_detected ? (
          <Badge tone="danger" icon={<Flame size={11} />}>
            Đang xem Bảng giá!
          </Badge>
        ) : (
          <Badge tone="neutral">Đang tham khảo</Badge>
        ),
    },
    {
      key: 'views',
      header: 'Số trang xem',
      numeric: true,
      render: (r) => `${r.pageviews_count} trang (${r.device_type})`,
    },
    {
      key: 'time',
      header: 'Hoạt động cuối',
      align: 'right',
      render: (r) => formatShortDate(r.last_seen_at),
    },
  ];

  if (loading) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang tải Web Tracking SDK, Phiên Truy Cập & Bản Đồ Nhiệt Heatmap..."
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
              <Globe size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Web Tracking, Hợp Nhất Danh Tính & Bản Đồ Nhiệt Heatmap
                </h1>
                <Badge tone="primary">Visitor-to-Lead Stitching</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
                Tự động khâu phiên ẩn danh vào Hồ sơ {terminology.customerLabel} 360° & bắn cảnh báo khi khách xem trang Bảng giá.
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <Card padding="1.1rem 1.25rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Phiên Truy Cập Trực Tiếp</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>{summary.total_sessions}</div>
        </Card>
        <Card padding="1.1rem 1.25rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Đã Hợp Nhất Hồ Sơ 360°</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>{summary.identified_leads}</div>
        </Card>
        <Card padding="1.1rem 1.25rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Cảnh Báo Xem Bảng Giá</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#DC2626', marginTop: 4 }}>{summary.pricing_intent_alerts}</div>
        </Card>
        <Card padding="1.1rem 1.25rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Tổng Lượt Xem Trang</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{summary.total_pageviews}</div>
        </Card>
      </div>

      <PillTabs
        tabs={[
          { key: 'sdk', label: 'Website & Mã JS Tracking SDK', icon: <Code2 size={15} />, count: properties.length },
          { key: 'sessions', label: 'Phiên Truy Cập & Pricing Intent', icon: <Activity size={15} />, count: sessions.length },
          { key: 'heatmap', label: 'Bản Đồ Nhiệt Click & Scroll', icon: <MousePointerClick size={15} />, count: heatmap.click_points.length },
        ]}
        activeKey={tab}
        onChange={setTab}
      />

      {tab === 'sdk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {properties.map((p) => {
            const snippet = `<script>
  window.DOMATION_TRACKER_CONFIG = {
    siteKey: "${p.site_key}",
    endpoint: "${originUrl}/api/v1/public/marketing/track"
  };
</script>
<script async src="${originUrl}/api/v1/public/marketing/sdk.js?site_key=${p.site_key}"></script>`;

            return (
              <Card
                key={p.id}
                title={`${p.name} (${p.domain})`}
                subtitle={`Từ khóa nhận diện trang giá: ${p.pricing_url_pattern} ${p.target_audience_name ? `• Đẩy tự động vào Tệp: ${p.target_audience_name}` : ''}`}
                actions={
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(snippet);
                        toast.success('Đã sao chép đoạn mã JS Tracking SDK!');
                      }}
                      className="btn secondary sm"
                      style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    >
                      <Copy size={13} /> Sao chép JS SDK
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiRequest(`/marketing/web-tracking/properties/${p.id}`, {
                          method: 'DELETE',
                          token,
                          tenantSlug,
                        });
                        toast.success('Đã xóa cấu hình Website.');
                        await reload();
                      }}
                      className="btn secondary sm"
                      style={{ height: 36, color: '#DC2626' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                }
              >
                <pre
                  style={{
                    padding: '0.85rem',
                    borderRadius: 12,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                  }}
                >
                  {snippet}
                </pre>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <input
                    className="form-input"
                    style={{ height: 40, maxWidth: 260 }}
                    placeholder="URL giả lập (VD: /bang-gia)"
                    value={simPageUrl}
                    onChange={(e) => setSimPageUrl(e.target.value)}
                  />
                  <input
                    className="form-input"
                    style={{ height: 40, maxWidth: 220 }}
                    placeholder="SĐT định danh khách..."
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => void handleSimulateTrack(p)}
                    className="btn secondary sm"
                    style={{ height: 40, color: '#1E40FF', fontWeight: 700 }}
                  >
                    Bắn Thử Click + Pricing Intent
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'sessions' && (
        <Table
          columns={sessionCols}
          rows={sessions}
          rowKey={(r) => r.id}
          emptyTitle="Chưa ghi nhận phiên truy cập nào"
          emptyDescription="Nhúng đoạn mã JS SDK lên Website hoặc bấm nút 'Bắn Thử Click + Pricing Intent' để kiểm chứng hợp nhất danh tính."
        />
      )}

      {tab === 'heatmap' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem', alignItems: 'start' }}>
          <Card
            title={`Bản Đồ Nhiệt Điểm Nhấp Chuột Thực Tế (${activeProp?.domain || 'Website'})`}
            subtitle="Tọa độ phần trăm (x%, y%) thu thập trực tiếp từ JS SDK"
          >
            <div
              style={{
                position: 'relative',
                height: 380,
                borderRadius: 16,
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '1.25rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>
                Khung mô phỏng bố cục trang Landing / Bảng giá ({heatmap.click_points.length} điểm tương tác)
              </div>
              {heatmap.click_points.map((pt) => (
                <div
                  key={pt.id}
                  title={`${pt.element_selector} (${pt.x_pct}%, ${pt.y_pct}%)`}
                  style={{
                    position: 'absolute',
                    left: `${pt.x_pct}%`,
                    top: `${pt.y_pct}%`,
                    width: 28,
                    height: 28,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(220,38,38,0.75) 0%, rgba(30,64,255,0.35) 60%, transparent 100%)',
                    pointerEvents: 'auto',
                  }}
                />
              ))}
            </div>
          </Card>

          <Card title="Độ Sâu Cuộn Trang (Scroll Reach)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Cuộn tới 25% trang', val: heatmap.scroll_reach_pct.depth_25 },
                { label: 'Cuộn tới 50% trang', val: heatmap.scroll_reach_pct.depth_50 },
                { label: 'Cuộn tới 75% trang', val: heatmap.scroll_reach_pct.depth_75 },
                { label: 'Đọc hết 100% trang', val: heatmap.scroll_reach_pct.depth_100 },
              ].map((row) => (
                <FormCard
                  key={row.label}
                  title={row.label}
                  badge={<Badge tone="primary">{row.val}%</Badge>}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      <CustomModal
        isOpen={propModalOpen}
        onClose={() => setPropModalOpen(false)}
        title="Đăng Ký Website Theo Dõi & Cảnh Báo Trang Giá"
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="form-input"
            style={{ height: 44 }}
            placeholder="Tên Website (VD: Landing Page Dự Án Mới)..."
            value={propName}
            onChange={(e) => setPropName(e.target.value)}
          />
          <input
            className="form-input"
            style={{ height: 44 }}
            placeholder="Tên miền (VD: company.vn)..."
            value={propDomain}
            onChange={(e) => setPropDomain(e.target.value)}
          />
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Đường dẫn nhận diện Ý định mua cao (Pricing URL)</label>
            <input
              className="form-input"
              style={{ height: 44 }}
              value={pricingPattern}
              onChange={(e) => setPricingPattern(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Đẩy khách xem trang giá vào Tệp Khách hàng</label>
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
              type="button"
              onClick={() => void handleCreateProperty()}
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
        </div>
      </CustomModal>
    </div>
  );
};

export default MarketingWebTrackingPage;
