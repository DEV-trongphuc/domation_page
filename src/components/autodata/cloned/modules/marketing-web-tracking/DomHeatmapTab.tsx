import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MousePointerClick, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { HeatmapInteractiveCanvas } from './HeatmapInteractiveCanvas';
import type {
  HeatmapOverlayResponseDto,
  WebHeatmapConfigDto,
  WebPropertyDto,
} from './webTrackingTypes';

export interface DomHeatmapTabProps {
  properties: WebPropertyDto[];
  selectedPropertyId: string;
}

export const DomHeatmapTab: React.FC<DomHeatmapTabProps> = ({
  properties,
  selectedPropertyId,
}) => {
  const { token, tenantSlug } = useAuth();

  const [configs, setConfigs] = useState<WebHeatmapConfigDto[]>([]);
  const [overlay, setOverlay] = useState<HeatmapOverlayResponseDto>({
    click_points: [],
    scroll_reach_pct: { depth_25: 0, depth_50: 0, depth_75: 0, depth_100: 0 },
  });

  const [activePropId, setActivePropId] = useState<string>(
    selectedPropertyId || properties[0]?.id || ''
  );
  const [pagePattern, setPagePattern] = useState<string>('/bang-gia');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [thermalMode, setThermalMode] = useState<'click' | 'scroll'>('click');
  const [newHeatmapName, setNewHeatmapName] = useState('');
  const [creating, setCreating] = useState(false);

  const activeProp = useMemo(
    () => properties.find((p) => p.id === activePropId) || properties[0] || null,
    [properties, activePropId]
  );

  const fetchHeatmapAll = useCallback(async () => {
    const qs = new URLSearchParams();
    if (activePropId) qs.set('property_id', activePropId);
    if (pagePattern.trim()) qs.set('page_url', pagePattern.trim());
    const [cfgRes, ovRes] = await Promise.all([
      apiRequest<{ items?: WebHeatmapConfigDto[] }>('/marketing/web-tracking/heatmaps', {
        token,
        tenantSlug,
      }),
      apiRequest<HeatmapOverlayResponseDto>(
        `/marketing/web-tracking/heatmap?${qs.toString()}`,
        { token, tenantSlug }
      ),
    ]);
    return { items: cfgRes.items || [], ov: ovRes };
  }, [activePropId, pagePattern, token, tenantSlug]);

  const reloadHeatmap = useCallback(async () => {
    try {
      const { items, ov } = await fetchHeatmapAll();
      setConfigs(items);
      setOverlay(ov);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải dữ liệu Bản đồ nhiệt DOM.'));
    }
  }, [fetchHeatmapAll]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items, ov } = await fetchHeatmapAll();
        if (!cancelled) {
          setConfigs(items);
          setOverlay(ov);
        }
      } catch {
        // Ignore silent initial load failure
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchHeatmapAll]);

  const hotspotRanking = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const pt of overlay.click_points) {
      const sel = pt.element_selector || 'DIV.section';
      counts[sel] = (counts[sel] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([selector, count]) => ({ selector, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [overlay.click_points]);

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProp) {
      toast.error('Vui lòng thêm ít nhất 1 Website theo dõi trước.');
      return;
    }
    if (!newHeatmapName.trim()) {
      toast.error('Vui lòng nhập tên Snapshot Bản đồ nhiệt.');
      return;
    }
    setCreating(true);
    try {
      await apiRequest('/marketing/web-tracking/heatmaps', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          property_id: activeProp.id,
          name: newHeatmapName.trim(),
          page_url_pattern: pagePattern.trim() || '/',
          device_filter: viewportMode,
          viewport_width: viewportMode === 'mobile' ? 390 : 1440,
          viewport_height: 900,
        },
      });
      setNewHeatmapName('');
      toast.success('Đã lưu Snapshot Bản đồ nhiệt vào `mkt_web_heatmaps`!');
      await reloadHeatmap();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo cấu hình Heatmap.'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      await apiRequest(`/marketing/web-tracking/heatmaps/${id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã xóa cấu hình Heatmap.');
      await reloadHeatmap();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa Heatmap.'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card title="Quản Lý Bản Đồ Nhiệt Tọa Độ DOM (`mkt_web_heatmaps`)">
        <form
          onSubmit={(e) => void handleCreateConfig(e)}
          style={{ display: 'grid', gridTemplateColumns: '200px 180px 1fr auto', gap: 8, alignItems: 'center' }}
        >
          <select className="form-input" style={{ height: 42 }} value={activePropId} onChange={(e) => setActivePropId(e.target.value)}>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.domain})
              </option>
            ))}
          </select>
          <input className="form-input" style={{ height: 42 }} placeholder="URL pattern (/bang-gia)" value={pagePattern} onChange={(e) => setPagePattern(e.target.value)} />
          <input className="form-input" style={{ height: 42 }} placeholder="Tên Snapshot lưu trữ (VD: Heatmap Trang Bảng Giá Quý 4)..." value={newHeatmapName} onChange={(e) => setNewHeatmapName(e.target.value)} />
          <button
            type="submit"
            disabled={creating}
            style={{
              height: 42,
              padding: '0 1.1rem',
              borderRadius: 12,
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
            <Plus size={15} /> Lưu Snapshot
          </button>
        </form>

        {configs.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {configs.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setActivePropId(c.property_id);
                  setPagePattern(c.page_url_pattern);
                  if (c.device_filter === 'mobile' || c.device_filter === 'desktop') {
                    setViewportMode(c.device_filter);
                  }
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: 999,
                  border: pagePattern === c.page_url_pattern ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                  background: pagePattern === c.page_url_pattern ? '#EFF6FF' : '#F8FAFC',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <span>{c.name}</span>
                <Badge tone="primary">{c.page_url_pattern}</Badge>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDeleteConfig(c.id);
                  }}
                  style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer', padding: 2 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '1rem', alignItems: 'start' }}>
        <HeatmapInteractiveCanvas
          activeProp={activeProp}
          pagePattern={pagePattern}
          viewportMode={viewportMode}
          thermalMode={thermalMode}
          overlay={overlay}
          onChangeViewport={setViewportMode}
          onChangeThermal={setThermalMode}
          onSimulatedClick={reloadHeatmap}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card title="Xếp Hạng Điểm Nóng Phần Tử DOM" subtitle={`${overlay.click_points.length} tọa độ Click`}>
            {hotspotRanking.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                Nhấp trực tiếp vào khung trang bên trái để tạo điểm nóng tương tác đầu tiên!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {hotspotRanking.map((item, idx) => (
                  <div
                    key={item.selector}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: 10,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <MousePointerClick size={13} color="#1E40FF" />
                      <code style={{ fontSize: '0.73rem', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        #{idx + 1} {item.selector}
                      </code>
                    </div>
                    <Badge tone="primary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Độ Sâu Cuộn Trang (Scroll Reach)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Cuộn tới 25% trang', val: overlay.scroll_reach_pct.depth_25 },
                { label: 'Cuộn tới 50% trang', val: overlay.scroll_reach_pct.depth_50 },
                { label: 'Cuộn tới 75% trang', val: overlay.scroll_reach_pct.depth_75 },
                { label: 'Đọc hết 100% trang', val: overlay.scroll_reach_pct.depth_100 },
              ].map((r) => (
                <div
                  key={r.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 10,
                    background: '#F8F9FA',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.78rem',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#334155' }}>{r.label}</span>
                  <Badge tone="info">{r.val}%</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DomHeatmapTab;
