import React from 'react';
import { Flame, Layers, Monitor, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import type { HeatmapOverlayResponseDto, WebPropertyDto } from './webTrackingTypes';

export interface HeatmapInteractiveCanvasProps {
  activeProp: WebPropertyDto | null;
  pagePattern: string;
  viewportMode: 'desktop' | 'mobile';
  thermalMode: 'click' | 'scroll';
  overlay: HeatmapOverlayResponseDto;
  onChangeViewport: (mode: 'desktop' | 'mobile') => void;
  onChangeThermal: (mode: 'click' | 'scroll') => void;
  onSimulatedClick: () => Promise<void>;
}

export const HeatmapInteractiveCanvas: React.FC<HeatmapInteractiveCanvasProps> = ({
  activeProp,
  pagePattern,
  viewportMode,
  thermalMode,
  overlay,
  onChangeViewport,
  onChangeThermal,
  onSimulatedClick,
}) => {
  const handleCanvasClickSimulate = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeProp) {
      toast.error('Chưa có Website theo dõi để bắn tọa độ Click.');
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / Math.max(1, rect.width)) * 1000) / 10;
    const yPct = Math.round(((e.clientY - rect.top) / Math.max(1, rect.height)) * 1000) / 10;
    const targetTag = (e.target as HTMLElement)?.getAttribute('data-dom-selector') || 'SECTION.landing-canvas';
    const fullUrl = `https://${activeProp.domain}${pagePattern.startsWith('/') ? pagePattern : `/${pagePattern}`}`;

    try {
      await apiRequest('/public/marketing/track', {
        method: 'POST',
        body: {
          site_key: activeProp.site_key,
          event_type: 'click',
          device_type: viewportMode,
          page_url: fullUrl,
          x_pct: xPct,
          y_pct: yPct,
          element_selector: targetTag,
        },
      });
      toast.success(`Đã ghi nhận Click thử nghiệm tại (${xPct}%, ${yPct}%) -> ${targetTag}`);
      await onSimulatedClick();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi tọa độ Click thử nghiệm.'));
    }
  };

  const togglePillStyle = (active: boolean): React.CSSProperties => ({
    height: 36,
    padding: '0 0.85rem',
    borderRadius: 10,
    border: active ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
    background: active ? '#EFF6FF' : '#FFFFFF',
    color: active ? '#1E40FF' : '#475569',
    fontWeight: 700,
    fontSize: '0.78rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    cursor: 'pointer',
  });

  return (
    <Card
      title={`Khung Nhiệt Tương Tác Trực Tiếp — ${activeProp?.domain || 'Website'}${pagePattern}`}
      subtitle="Click trực tiếp vào bất kỳ vị trí nào trên khung trang bên dưới để bắn thử tọa độ (x%, y%)!"
      actions={
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => onChangeViewport('desktop')} style={togglePillStyle(viewportMode === 'desktop')}>
            <Monitor size={13} /> Desktop 1440px
          </button>
          <button type="button" onClick={() => onChangeViewport('mobile')} style={togglePillStyle(viewportMode === 'mobile')}>
            <Smartphone size={13} /> Mobile 390px
          </button>
          <button type="button" onClick={() => onChangeThermal('click')} style={togglePillStyle(thermalMode === 'click')}>
            <Flame size={13} /> Click Thermal
          </button>
          <button type="button" onClick={() => onChangeThermal('scroll')} style={togglePillStyle(thermalMode === 'scroll')}>
            <Layers size={13} /> Scroll Depth
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'center', background: '#F1F5F9', padding: '1rem', borderRadius: 16 }}>
        <div
          onClick={(e) => void handleCanvasClickSimulate(e)}
          style={{
            position: 'relative',
            width: viewportMode === 'mobile' ? 360 : '100%',
            height: 430,
            borderRadius: 16,
            background: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
            overflow: 'hidden',
            cursor: 'crosshair',
            userSelect: 'none',
          }}
        >
          <div
            data-dom-selector="HEADER.top-nav"
            style={{
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span data-dom-selector="A.brand-logo" style={{ fontWeight: 800, color: '#1E40FF', fontSize: '0.82rem' }}>
              {activeProp?.domain || 'domation.net'}
            </span>
            <span
              data-dom-selector="BUTTON.nav-book-demo"
              style={{ padding: '4px 10px', borderRadius: 8, background: '#EFF6FF', color: '#1E40FF', fontSize: '0.72rem', fontWeight: 700 }}
            >
              Đăng ký Demo
            </span>
          </div>

          <div style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div data-dom-selector="H1.hero-headline" style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>
              Bảng Giá Giải Pháp Đa Phân Hệ Doanh Nghiệp
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748B', maxWidth: 420 }}>
              Nhấp chuột vào nút CTA hoặc thẻ gói cước bên dưới để mô phỏng điểm nóng nhiệt độ Click.
            </div>
            <div
              data-dom-selector="BUTTON.pricing-cta-primary"
              style={{
                marginTop: 4,
                padding: '0.55rem 1.25rem',
                borderRadius: 10,
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.78rem',
              }}
            >
              Nhận Báo Giá Ngay
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: viewportMode === 'mobile' ? '1fr' : 'repeat(3, 1fr)', gap: 10, width: '100%', marginTop: 12 }}>
              {['CARD.plan-starter', 'CARD.plan-growth', 'CARD.plan-promax'].map((sel, idx) => (
                <div
                  key={sel}
                  data-dom-selector={sel}
                  style={{
                    padding: '0.9rem',
                    borderRadius: 12,
                    border: idx === 2 ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                    background: idx === 2 ? '#F8FAFF' : '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#334155',
                  }}
                >
                  {sel.replace('CARD.plan-', 'Gói ').toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          {thermalMode === 'click' ? (
            overlay.click_points.map((pt) => (
              <div
                key={pt.id}
                title={`${pt.element_selector} (${pt.x_pct}%, ${pt.y_pct}%)`}
                style={{
                  position: 'absolute',
                  left: `${pt.x_pct}%`,
                  top: `${pt.y_pct}%`,
                  width: 38,
                  height: 38,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, rgba(239,68,68,0.78) 0%, rgba(245,158,11,0.52) 42%, rgba(30,64,255,0.22) 72%, transparent 100%)',
                  pointerEvents: 'none',
                }}
              />
            ))
          ) : (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column' }}>
              {[
                { label: '25% Đầu trang', pct: overlay.scroll_reach_pct.depth_25, bg: 'rgba(239, 68, 68, 0.18)' },
                { label: '50% Giữa trang', pct: overlay.scroll_reach_pct.depth_50, bg: 'rgba(245, 158, 11, 0.16)' },
                { label: '75% Thân dưới', pct: overlay.scroll_reach_pct.depth_75, bg: 'rgba(6, 182, 212, 0.16)' },
                { label: '100% Chân trang', pct: overlay.scroll_reach_pct.depth_100, bg: 'rgba(30, 64, 255, 0.15)' },
              ].map((band) => (
                <div
                  key={band.label}
                  style={{
                    flex: 1,
                    background: band.bg,
                    borderBottom: '1px dashed rgba(15, 23, 42, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 1rem',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    color: '#0F172A',
                  }}
                >
                  <span>{band.label}</span>
                  <span>{band.pct}% khách cuộn tới</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default HeatmapInteractiveCanvas;
