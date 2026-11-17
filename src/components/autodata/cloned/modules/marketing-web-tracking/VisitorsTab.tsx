import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Flame,
  MapPin,
  Monitor,
  RefreshCw,
  Search,
  Smartphone,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Card,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { VisitorTimelineDrawer } from './VisitorTimelineDrawer';
import {
  shortenUrlPath,
  type VisitorDetailResponseDto,
  type WebPropertyDto,
  type WebSessionDto,
} from './webTrackingTypes';

export interface VisitorsTabProps {
  properties: WebPropertyDto[];
  selectedPropertyId: string;
}

export const VisitorsTab: React.FC<VisitorsTabProps> = ({
  properties,
  selectedPropertyId,
}) => {
  const { token, tenantSlug } = useAuth();
  const { terminology } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<WebSessionDto[]>([]);
  const [propertyFilter, setPropertyFilter] = useState<string>(selectedPropertyId || '');
  const [onlyPricingIntent, setOnlyPricingIntent] = useState(false);
  const [onlyIdentified, setOnlyIdentified] = useState(false);
  const [search, setSearch] = useState('');

  const [inspectSessionId, setInspectSessionId] = useState<string | null>(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [inspectorData, setInspectorData] = useState<VisitorDetailResponseDto | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (propertyFilter) qs.set('property_id', propertyFilter);
      if (onlyPricingIntent) qs.set('pricing_intent', 'true');
      const queryStr = qs.toString() ? `?${qs.toString()}` : '';
      const res = await apiRequest<{ items?: WebSessionDto[] }>(
        `/marketing/web-tracking/sessions${queryStr}`,
        { token, tenantSlug }
      );
      setSessions(res.items || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách khách truy cập.'));
    } finally {
      setLoading(false);
    }
  }, [propertyFilter, onlyPricingIntent, token, tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const qs = new URLSearchParams();
        if (propertyFilter) qs.set('property_id', propertyFilter);
        if (onlyPricingIntent) qs.set('pricing_intent', 'true');
        const queryStr = qs.toString() ? `?${qs.toString()}` : '';
        const res = await apiRequest<{ items?: WebSessionDto[] }>(
          `/marketing/web-tracking/sessions${queryStr}`,
          { token, tenantSlug }
        );
        if (!cancelled) setSessions(res.items || []);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải phiên truy cập.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyFilter, onlyPricingIntent, token, tenantSlug]);

  const openInspector = async (sessionId: string) => {
    setInspectSessionId(sessionId);
    setInspectorLoading(true);
    setInspectorData(null);
    try {
      const res = await apiRequest<VisitorDetailResponseDto>(
        `/marketing/web-tracking/visitors/${sessionId}`,
        { token, tenantSlug }
      );
      setInspectorData(res);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải Timeline chi tiết phiên truy cập.'));
      setInspectSessionId(null);
    } finally {
      setInspectorLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      if (onlyIdentified && !s.lead_id) return false;
      if (!q) return true;
      return (
        (s.name || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        s.visitor_token.toLowerCase().includes(q) ||
        (s.geo_city || '').toLowerCase().includes(q) ||
        (s.utm_source || '').toLowerCase().includes(q) ||
        (s.last_url || '').toLowerCase().includes(q)
      );
    });
  }, [sessions, onlyIdentified, search]);

  const columns: Array<TableColumn<WebSessionDto>> = [
    {
      key: 'visitor',
      header: `Khách Truy Cập & Định Danh ${terminology.customerLabel} 360°`,
      render: (r) => (
        <div>
          {r.lead_id ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: '#1E40FF' }}>
                <UserCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
                {r.name || 'Khách 360°'}
              </span>
              <Badge tone="primary">Score {r.lead_score ?? 0}</Badge>
              <div style={{ width: '100%', fontSize: '0.73rem', color: '#475569' }}>
                {[r.phone, r.email].filter(Boolean).join(' • ') || 'Đã khâu hồ sơ CRM'}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 700, color: '#334155' }}>Khách ẩn danh ({r.visitor_token})</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Chưa để lại SĐT / Email</div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'geo_device',
      header: 'GeoIP & Thiết Bị',
      render: (r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} color="#1E40FF" />
            {r.geo_city ? `${r.geo_city}, ` : ''}
            {r.geo_country || 'VN'}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {r.device_type === 'mobile' ? <Smartphone size={12} /> : <Monitor size={12} />}
            {r.device_type} {r.browser ? `• ${r.browser}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'utm',
      header: 'UTM & Trang Đang Xem',
      render: (r) => (
        <div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
            <Badge tone="info">{r.utm_source || 'direct'}</Badge>
            {r.utm_campaign && <Badge tone="neutral">{r.utm_campaign}</Badge>}
          </div>
          <code style={{ fontSize: '0.73rem', color: '#475569' }}>
            {shortenUrlPath(r.last_url)} ({r.pageviews_count} trang)
          </code>
        </div>
      ),
    },
    {
      key: 'intent',
      header: 'Tín Hiệu Mua Hàng',
      render: (r) =>
        r.pricing_intent_detected ? (
          <Badge tone="danger" icon={<Flame size={11} />}>
            Pricing Intent!
          </Badge>
        ) : (
          <Badge tone="neutral">Đang tham khảo</Badge>
        ),
    },
    {
      key: 'time',
      header: 'Hoạt Động Cuối',
      align: 'right',
      render: (r) => (
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A' }}>
            {formatShortDate(r.last_seen_at)}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#1E40FF', fontWeight: 700, marginTop: 2 }}>
            Xem Timeline →
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card padding="0.95rem 1.25rem">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 13, color: '#94A3B8' }} />
            <input
              className="form-input"
              style={{ height: 40, paddingLeft: 36 }}
              placeholder="Tìm tên khách 360°, SĐT, Email, Thành phố GeoIP, UTM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-input"
              style={{ height: 40, minWidth: 180 }}
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
            >
              <option value="">Tất cả Website ({properties.length})</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.domain})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setOnlyIdentified((v) => !v)}
              className="btn secondary sm"
              style={{
                height: 40,
                borderColor: onlyIdentified ? '#1E40FF' : undefined,
                color: onlyIdentified ? '#1E40FF' : undefined,
                background: onlyIdentified ? '#EFF6FF' : undefined,
              }}
            >
              <UserCheck size={14} style={{ marginRight: 4 }} /> Đã khâu 360°
            </button>

            <button
              type="button"
              onClick={() => setOnlyPricingIntent((v) => !v)}
              className="btn secondary sm"
              style={{
                height: 40,
                borderColor: onlyPricingIntent ? '#DC2626' : undefined,
                color: onlyPricingIntent ? '#DC2626' : undefined,
                background: onlyPricingIntent ? '#FEF2F2' : undefined,
              }}
            >
              <Flame size={14} style={{ marginRight: 4 }} /> Xem Bảng giá
            </button>

            <button type="button" onClick={() => void loadSessions()} className="btn secondary sm" style={{ height: 40 }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </Card>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <Table
          columns={columns}
          rows={filteredRows}
          rowKey={(r) => r.id}
          onRowClick={(r) => void openInspector(r.id)}
          emptyTitle="Chưa có phiên truy cập nào khớp bộ lọc"
          emptyDescription="Bấm vào bất kỳ dòng khách truy cập nào để mở Ngăn kéo Hành trình Visitor Timeline Inspector."
        />
      )}

      <VisitorTimelineDrawer
        isOpen={Boolean(inspectSessionId)}
        loading={inspectorLoading}
        data={inspectorData}
        onClose={() => setInspectSessionId(null)}
      />
    </div>
  );
};

export default VisitorsTab;
