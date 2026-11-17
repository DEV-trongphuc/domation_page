import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Braces, MessageCircle, RefreshCw } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { Skeleton } from '../../components/ui/Skeleton';
import { apiRequest } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { LEAD_MERGE_FIELDS, type ZaloTemplateDto } from './flowConstants';

export interface ZaloZNSStepConfigProps {
  config: Record<string, unknown>;
  onChange: (nextConfig: Record<string, unknown>) => void;
}

const STARTER_ZNS_TEMPLATES: ZaloTemplateDto[] = [
  {
    id: 'zns_welcome_01',
    template_id: 'ZNS_WELCOME_2026',
    name: 'Xác nhận đăng ký & Gửi tài liệu tư vấn',
    status: 'APPROVED',
    params: ['customer_name', 'product_name', 'hotline'],
    sample_body: 'Xin chào {{customer_name}}, cảm ơn bạn đã quan tâm {{product_name}}. Hỗ trợ nhanh: {{hotline}}.',
  },
  {
    id: 'zns_voucher_02',
    template_id: 'ZNS_VIP_VOUCHER_88',
    name: 'Gửi mã ưu đãi đặc quyền Zalo OA',
    status: 'APPROVED',
    params: ['customer_name', 'voucher_code', 'expire_date'],
    sample_body: 'Ưu đãi dành riêng cho {{customer_name}}: Mã {{voucher_code}} có hiệu lực đến {{expire_date}}.',
  },
];

export const ZaloZNSStepConfig: React.FC<ZaloZNSStepConfigProps> = ({ config, onChange }) => {
  const { token, tenantSlug } = useAuth();

  const [loading, setLoading] = useState(true);
  const [znsTemplates, setZnsTemplates] = useState<ZaloTemplateDto[]>(STARTER_ZNS_TEMPLATES);

  const fetchZaloTemplates = useCallback(async () => {
    const res = await apiRequest<{ items?: Array<Record<string, unknown>> }>(
      '/marketing/flows/zalo-templates',
      { token, tenantSlug }
    );
    const rows = Array.isArray(res?.items) ? res.items : [];
    if (rows.length === 0) return STARTER_ZNS_TEMPLATES;
    return rows.map((r) => ({
      id: String(r.id || r.template_id || ''),
      template_id: String(r.template_id || r.id || ''),
      name: String(r.name || r.template_name || 'Mẫu Zalo ZNS'),
      status: String(r.status || 'APPROVED'),
      params: Array.isArray(r.params)
        ? r.params.map((p) => String(p))
        : ['customer_name', 'phone'],
      sample_body: r.sample_body ? String(r.sample_body) : undefined,
    }));
  }, [token, tenantSlug]);

  const handleManualReload = async () => {
    setLoading(true);
    try {
      const next = await fetchZaloTemplates();
      setZnsTemplates(next);
    } catch {
      setZnsTemplates(STARTER_ZNS_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchZaloTemplates()
      .then((next) => {
        if (!cancelled) setZnsTemplates(next);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchZaloTemplates]);

  const selectedTplId = String(config.zns_template_id || znsTemplates[0]?.template_id || '');
  const paramMap = useMemo(
    () =>
      (config.param_mapping && typeof config.param_mapping === 'object'
        ? config.param_mapping
        : { customer_name: 'lead.name' }) as Record<string, string>,
    [config.param_mapping]
  );
  const fallbackEmailOnFail = Boolean(config.fallback_email_on_fail ?? true);

  const activeTemplate = useMemo(
    () => znsTemplates.find((t) => t.template_id === selectedTplId || t.id === selectedTplId) || znsTemplates[0],
    [znsTemplates, selectedTplId]
  );

  const handleSelectTemplate = (tplId: string) => {
    const tpl = znsTemplates.find((t) => t.template_id === tplId || t.id === tplId);
    const nextMap: Record<string, string> = { ...paramMap };
    for (const p of tpl?.params || []) {
      if (!nextMap[p]) {
        nextMap[p] = p.includes('name') ? 'lead.name' : p.includes('phone') ? 'lead.phone' : 'lead.product_interest';
      }
    }
    onChange({
      ...config,
      zns_template_id: tplId,
      param_mapping: nextMap,
    });
  };

  const handleMapParam = (paramKey: string, leadField: string) => {
    onChange({
      ...config,
      zns_template_id: selectedTplId,
      param_mapping: {
        ...paramMap,
        [paramKey]: leadField,
      },
    });
  };

  if (loading) {
    return <Skeleton height={150} borderRadius={12} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
            <MessageCircle size={13} style={{ display: 'inline', marginRight: 4, color: '#0284C7' }} />
            Mẫu Zalo ZNS Đã Duyệt
          </label>
          <button
            type="button"
            onClick={() => void handleManualReload()}
            style={{ border: 'none', background: 'transparent', color: '#1E40FF', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <RefreshCw size={11} /> Đồng bộ OA
          </button>
        </div>

        <select
          className="form-input"
          style={{ height: 42 }}
          value={selectedTplId}
          onChange={(e) => handleSelectTemplate(e.target.value)}
        >
          {znsTemplates.map((tpl) => (
            <option key={tpl.id} value={tpl.template_id}>
              {tpl.name} ({tpl.template_id})
            </option>
          ))}
        </select>
      </div>

      {activeTemplate?.sample_body && (
        <div
          style={{
            padding: '0.75rem 0.9rem',
            borderRadius: 12,
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            fontSize: '0.76rem',
            color: '#0C4A6E',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <strong>Xem trước nội dung ZNS</strong>
            <Badge tone="info">{activeTemplate.status || 'APPROVED'}</Badge>
          </div>
          {activeTemplate.sample_body}
        </div>
      )}

      {/* Dynamic {{param}} -> Lead Field Mapper */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Braces size={14} color="#1E40FF" /> Ánh Xạ Biến Động ZNS Sang Trường Hồ Sơ Lead
        </div>

        {(activeTemplate?.params || ['customer_name']).map((paramKey) => (
          <div
            key={paramKey}
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 10,
              background: '#F8F9FA',
              border: '1px solid #E2E8F0',
              display: 'grid',
              gridTemplateColumns: '0.9fr 1.1fr',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <code style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0284C7' }}>{`{{${paramKey}}}`}</code>
            <select
              className="form-input"
              style={{ height: 36, fontSize: '0.75rem', background: '#FFFFFF' }}
              value={paramMap[paramKey] || 'lead.name'}
              onChange={(e) => handleMapParam(paramKey, e.target.value)}
            >
              {LEAD_MERGE_FIELDS.map((lf) => (
                <option key={lf.value} value={lf.value}>{lf.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={fallbackEmailOnFail}
          onChange={(e) => onChange({ ...config, fallback_email_on_fail: e.target.checked })}
          style={{ accentColor: '#1E40FF' }}
        />
        Tự động chuyển tiếp gửi Email dự phòng nếu SĐT chưa dùng Zalo
      </label>
    </div>
  );
};

export default ZaloZNSStepConfig;
