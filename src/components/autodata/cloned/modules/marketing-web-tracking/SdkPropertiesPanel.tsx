import React, { useState } from 'react';
import { Code2, Copy, MapPin, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type { WebPropertyDto } from './webTrackingTypes';

export interface SdkPropertiesPanelProps {
  properties: WebPropertyDto[];
  originUrl: string;
  onReload: () => Promise<void>;
}

export const SdkPropertiesPanel: React.FC<SdkPropertiesPanelProps> = ({
  properties,
  originUrl,
  onReload,
}) => {
  const { token, tenantSlug } = useAuth();
  const [simPhone, setSimPhone] = useState('');
  const [simEmail, setSimEmail] = useState('');
  const [simPageUrl, setSimPageUrl] = useState('https://domation.net/bang-gia');

  const handleSimulateTrack = async (prop: WebPropertyDto) => {
    try {
      const visitorToken = `vis_${prop.id.slice(0, 6)}`;
      await apiRequest('/public/marketing/track', {
        method: 'POST',
        body: {
          site_key: prop.site_key,
          visitor_token: visitorToken,
          event_type: 'pageview',
          page_url: simPageUrl,
          utm_source: 'google_search',
          utm_medium: 'cpc',
          utm_campaign: 'domation_q4',
          phone: simPhone.trim() || undefined,
          email: simEmail.trim() || undefined,
        },
      });
      await apiRequest('/public/marketing/track', {
        method: 'POST',
        body: {
          site_key: prop.site_key,
          visitor_token: visitorToken,
          event_type: 'click',
          page_url: simPageUrl,
          x_pct: 54,
          y_pct: 42,
          element_selector: 'BUTTON.pricing-cta-sapphire',
          phone: simPhone.trim() || undefined,
          email: simEmail.trim() || undefined,
        },
      });
      await apiRequest('/public/marketing/track', {
        method: 'POST',
        body: {
          site_key: prop.site_key,
          visitor_token: visitorToken,
          event_type: 'scroll',
          page_url: simPageUrl,
          scroll_depth_pct: 85,
        },
      });
      toast.success('Đã bắn sự kiện Pageview + Click + Scroll & Hợp nhất danh tính 360°!');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể bắn sự kiện thử nghiệm.'));
    }
  };

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={<Code2 size={24} />}
        title="Chưa đăng ký Website theo dõi nào"
        description="Bấm nút 'Thêm Website Theo Dõi' ở góc phải trên cùng để nhận đoạn mã JS Tracking SDK."
      />
    );
  }

  return (
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
            subtitle={`Nhận diện trang giá: ${p.pricing_url_pattern}${
              p.target_audience_name ? ` • Tự động đưa vào Tệp: ${p.target_audience_name}` : ''
            }`}
            actions={
              <div style={{ display: 'flex', gap: 8 }}>
                <Badge tone="info" icon={<MapPin size={11} />}>
                  {p.site_key}
                </Badge>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(snippet);
                    toast.success('Đã sao chép đoạn mã JS Tracking SDK!');
                  }}
                  className="btn secondary sm"
                  style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Copy size={13} /> Copy JS SDK
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await apiRequest(`/marketing/web-tracking/properties/${p.id}`, {
                        method: 'DELETE',
                        token,
                        tenantSlug,
                      });
                      toast.success('Đã xóa cấu hình Website.');
                      await onReload();
                    } catch (err) {
                      toast.error(getErrorMessage(err, 'Không thể xóa Website.'));
                    }
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
                fontSize: '0.74rem',
                overflowX: 'auto',
                margin: 0,
              }}
            >
              {snippet}
            </pre>

            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input className="form-input" style={{ height: 40, minWidth: 230, flex: 1 }} placeholder="URL giả lập (VD: https://congty.vn/bang-gia)" value={simPageUrl} onChange={(e) => setSimPageUrl(e.target.value)} />
              <input className="form-input" style={{ height: 40, width: 165 }} placeholder="SĐT định danh..." value={simPhone} onChange={(e) => setSimPhone(e.target.value)} />
              <input className="form-input" style={{ height: 40, width: 185 }} placeholder="Email định danh..." value={simEmail} onChange={(e) => setSimEmail(e.target.value)} />
              <button
                type="button"
                onClick={() => void handleSimulateTrack(p)}
                style={{
                  height: 40,
                  padding: '0 1rem',
                  borderRadius: 10,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                Bắn Thử Sự Kiện + Pricing Intent
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default SdkPropertiesPanel;
