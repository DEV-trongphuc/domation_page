import React from 'react';
import { createPortal } from 'react-dom';
import { Clock, Flame, Globe, MousePointerClick, X } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { DrawerSkeleton } from '../../components/ui/Skeleton';
import { formatShortDate } from '../../../autodataApi';
import { formatDurationSec, type VisitorDetailResponseDto } from './webTrackingTypes';

export interface VisitorTimelineDrawerProps {
  isOpen: boolean;
  loading: boolean;
  data: VisitorDetailResponseDto | null;
  onClose: () => void;
}

export const VisitorTimelineDrawer: React.FC<VisitorTimelineDrawerProps> = ({
  isOpen,
  loading,
  data,
  onClose,
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        background: 'rgba(15, 23, 42, 0.36)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(540px, 95vw)',
          height: '100vh',
          background: '#FFFFFF',
          boxShadow: '-12px 0 40px rgba(15, 23, 42, 0.14)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {loading || !data ? (
          <DrawerSkeleton />
        ) : (
          <>
            <div
              style={{
                padding: '1.15rem 1.35rem',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#F8FAFF',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                    {data.session.lead_id
                      ? data.session.name || 'Khách Hàng Đã Định Danh 360°'
                      : `Khách Ẩn Danh (${data.session.visitor_token})`}
                  </h3>
                  {data.session.pricing_intent_detected && (
                    <Badge tone="danger" icon={<Flame size={11} />}>
                      Pricing Intent
                    </Badge>
                  )}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 3 }}>
                  {[
                    data.session.phone,
                    data.session.email,
                    data.session.geo_city || data.session.geo_country || 'VN',
                    formatDurationSec(data.session.duration_seconds),
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn secondary sm"
                style={{ height: 34, width: 34, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: '0.75rem', borderRadius: 12, background: '#F8F9FA', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                  <div style={{ color: '#64748B', fontWeight: 600 }}>UTM Nguồn</div>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                    {data.session.utm_source || 'direct'} / {data.session.utm_campaign || '(none)'}
                  </div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: 12, background: '#F8F9FA', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                  <div style={{ color: '#64748B', fontWeight: 600 }}>Thiết Bị & OS</div>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                    {data.session.device_type} • {data.session.os || 'Web'}
                  </div>
                </div>
              </div>

              <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0F172A', marginTop: 4 }}>
                Dòng Thời Gian Hành Vi Chi Tiết ({data.events.length} sự kiện)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.events.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      padding: '0.75rem 0.9rem',
                      borderRadius: 12,
                      border: ev.event_type === 'pricing_intent' ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0',
                      background: ev.event_type === 'pricing_intent' ? '#FEF2F2' : '#FFFFFF',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 9,
                        background: '#EFF6FF',
                        color: '#1E40FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {ev.event_type === 'click' ? (
                        <MousePointerClick size={14} />
                      ) : ev.event_type === 'pricing_intent' ? (
                        <Flame size={14} color="#DC2626" />
                      ) : ev.event_type === 'scroll' ? (
                        <Clock size={14} />
                      ) : (
                        <Globe size={14} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0F172A', textTransform: 'uppercase' }}>
                          {ev.event_type}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {formatShortDate(ev.created_at)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#1E40FF', wordBreak: 'break-all', marginTop: 2 }}>
                        {ev.page_url}
                      </div>
                      {(ev.element_selector || ev.scroll_depth_pct !== null) && (
                        <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 3 }}>
                          {ev.element_selector && (
                            <span>
                              DOM: <code>{ev.element_selector}</code>{' '}
                              {ev.x_pct !== null && ev.y_pct !== null ? `(${ev.x_pct}%, ${ev.y_pct}%)` : ''}
                            </span>
                          )}
                          {ev.scroll_depth_pct !== null && ev.scroll_depth_pct !== undefined && (
                            <span>Cuộn đạt: <b>{ev.scroll_depth_pct}%</b></span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default VisitorTimelineDrawer;
