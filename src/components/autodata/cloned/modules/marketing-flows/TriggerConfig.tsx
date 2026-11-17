import React from 'react';
import { Filter, Globe, Webhook, Zap } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { FLOW_TRIGGERS_15, type FlowCatalogResources } from './flowConstants';

export interface TriggerConfigProps {
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  resources: FlowCatalogResources;
  onChangeTriggerType: (nextType: string) => void;
  onChangeTriggerConfig: (nextConfig: Record<string, unknown>) => void;
}

export const TriggerConfig: React.FC<TriggerConfigProps> = ({
  triggerType,
  triggerConfig,
  resources,
  onChangeTriggerType,
  onChangeTriggerConfig,
}) => {
  const activeMeta = FLOW_TRIGGERS_15.find((t) => t.key === triggerType) || FLOW_TRIGGERS_15[0];

  const patchCfg = (patch: Record<string, unknown>) => {
    onChangeTriggerConfig({ ...triggerConfig, ...patch });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          padding: '0.8rem 0.95rem',
          borderRadius: 12,
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Zap size={14} /> Sự Kiện Mở Đầu Luồng
          </span>
          <Badge tone="primary">{activeMeta.category.toUpperCase()}</Badge>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 4 }}>{activeMeta.hint}</div>
      </div>

      <div>
        <label className="form-label" style={{ fontWeight: 700 }}>Chọn Sự Kiện Kích Hoạt (15 Triggers)</label>
        <select
          className="form-input"
          style={{ height: 42 }}
          value={triggerType}
          onChange={(e) => onChangeTriggerType(e.target.value)}
        >
          {FLOW_TRIGGERS_15.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Contextual Filters for all 15 Triggers */}
      {triggerType === 'form_submitted' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Lọc theo Biểu mẫu (`mkt_forms`)</label>
            <select
              className="form-input"
              style={{ height: 40 }}
              value={String(triggerConfig.form_id || '')}
              onChange={(e) => patchCfg({ form_id: e.target.value || null })}
            >
              <option value="">— Bất kỳ Biểu mẫu thu thập nào —</option>
              {resources.forms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Lọc UTM Source (Tùy chọn)</label>
            <input
              className="form-input"
              style={{ height: 40 }}
              placeholder="VD: facebook_ads, google_search..."
              value={String(triggerConfig.utm_source || '')}
              onChange={(e) => patchCfg({ utm_source: e.target.value })}
            />
          </div>
        </div>
      )}

      {triggerType === 'audience_joined' && (
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Tệp Khách Hàng Đích (`tenant_audiences`)</label>
          <select
            className="form-input"
            style={{ height: 40 }}
            value={String(triggerConfig.audience_id || '')}
            onChange={(e) => patchCfg({ audience_id: e.target.value || null })}
          >
            <option value="">— Chọn Tệp Data / Tệp Logic —</option>
            {resources.audiences.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.audience_type === 'dynamic_logic' ? 'Logic Động' : 'Data Tĩnh'})
              </option>
            ))}
          </select>
        </div>
      )}

      {triggerType === 'tag_added' && (
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Tên Nhãn (Tag) Kích Hoạt</label>
          <input
            className="form-input"
            style={{ height: 40 }}
            placeholder="VD: VIP, Hot_Lead, Quan_Tam_Bang_Gia"
            value={String(triggerConfig.tag_name || '')}
            onChange={(e) => patchCfg({ tag_name: e.target.value })}
          />
        </div>
      )}

      {triggerType === 'stage_changed' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Từ bước (Tùy chọn)</label>
            <input
              className="form-input"
              style={{ height: 40 }}
              placeholder="new_lead"
              value={String(triggerConfig.from_stage || '')}
              onChange={(e) => patchCfg({ from_stage: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Sang bước đích *</label>
            <input
              className="form-input"
              style={{ height: 40 }}
              placeholder="qualified / quoting"
              value={String(triggerConfig.to_stage || 'qualified')}
              onChange={(e) => patchCfg({ to_stage: e.target.value })}
            />
          </div>
        </div>
      )}

      {(triggerType === 'email_opened' || triggerType === 'link_clicked') && (
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>
            {triggerType === 'link_clicked' ? 'URL Liên kết chứa từ khóa' : 'Lọc tiêu đề Chiến dịch Email'}
          </label>
          <input
            className="form-input"
            style={{ height: 40 }}
            placeholder={triggerType === 'link_clicked' ? 'VD: /bang-gia hoặc /dang-ky-demo' : 'Để trống để bắt mọi chiến dịch'}
            value={String(triggerConfig.url_or_campaign_filter || '')}
            onChange={(e) => patchCfg({ url_or_campaign_filter: e.target.value })}
          />
        </div>
      )}

      {triggerType === 'survey_completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Bài Khảo sát / Quiz</label>
            <select
              className="form-input"
              style={{ height: 40 }}
              value={String(triggerConfig.survey_id || '')}
              onChange={(e) => patchCfg({ survey_id: e.target.value || null })}
            >
              <option value="">— Tất cả bài Khảo sát —</option>
              {resources.surveys.map((sv) => (
                <option key={sv.id} value={sv.id}>{sv.title || sv.name || sv.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Điểm Quiz tối thiểu (Tùy chọn)</label>
            <input
              type="number"
              className="form-input"
              style={{ height: 40 }}
              value={String(triggerConfig.min_quiz_score ?? 0)}
              onChange={(e) => patchCfg({ min_quiz_score: Number(e.target.value || 0) })}
            />
          </div>
        </div>
      )}

      {triggerType === 'page_visited' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              <Globe size={13} style={{ display: 'inline', marginRight: 4 }} /> Đường dẫn URL chứa
            </label>
            <input
              className="form-input"
              style={{ height: 40 }}
              placeholder="VD: /pricing, /enterprise"
              value={String(triggerConfig.url_contains || '/pricing')}
              onChange={(e) => patchCfg({ url_contains: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Số lượt xem tối thiểu trong 7 ngày</label>
            <input
              type="number"
              min={1}
              className="form-input"
              style={{ height: 40 }}
              value={String(triggerConfig.min_visits ?? 2)}
              onChange={(e) => patchCfg({ min_visits: Math.max(1, Number(e.target.value || 1)) })}
            />
          </div>
        </div>
      )}

      {(triggerType === 'voucher_redeemed' || triggerType === 'purchase_event') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {triggerType === 'voucher_redeemed' ? (
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Chiến dịch Voucher</label>
              <select
                className="form-input"
                style={{ height: 40 }}
                value={String(triggerConfig.voucher_campaign_id || '')}
                onChange={(e) => patchCfg({ voucher_campaign_id: e.target.value || null })}
              >
                <option value="">— Mọi chiến dịch Voucher —</option>
                {resources.vouchers.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Giá trị đơn hàng tối thiểu (VNĐ)</label>
              <input
                type="number"
                min={0}
                className="form-input"
                style={{ height: 40 }}
                value={String(triggerConfig.min_order_vnd ?? 1000000)}
                onChange={(e) => patchCfg({ min_order_vnd: Number(e.target.value || 0) })}
              />
            </div>
          )}
        </div>
      )}

      {triggerType === 'score_threshold' && (
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>
            <Filter size={13} style={{ display: 'inline', marginRight: 4 }} /> Ngưỡng Lead Score kích hoạt
          </label>
          <input
            type="number"
            min={5}
            max={500}
            className="form-input"
            style={{ height: 40 }}
            value={String(triggerConfig.min_score ?? 50)}
            onChange={(e) => patchCfg({ min_score: Number(e.target.value || 50) })}
          />
        </div>
      )}

      {(triggerType === 'birthday' || triggerType === 'inactivity') && (
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>
            {triggerType === 'birthday' ? 'Gửi trước ngày sinh nhật (Số ngày)' : 'Số ngày không tương tác liên tiếp'}
          </label>
          <input
            type="number"
            min={0}
            className="form-input"
            style={{ height: 40 }}
            value={String(triggerConfig.days_offset ?? (triggerType === 'birthday' ? 3 : 30))}
            onChange={(e) => patchCfg({ days_offset: Math.max(0, Number(e.target.value || 0)) })}
          />
        </div>
      )}

      {triggerType === 'webhook_received' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              <Webhook size={13} style={{ display: 'inline', marginRight: 4 }} /> Mã sự kiện Webhook (`event_key`)
            </label>
            <input
              className="form-input"
              style={{ height: 40 }}
              placeholder="VD: trial_activated, webinar_attended"
              value={String(triggerConfig.event_key || 'trial_activated')}
              onChange={(e) => patchCfg({ event_key: e.target.value })}
            />
          </div>
          <code
            style={{
              padding: '0.6rem',
              borderRadius: 8,
              background: '#F8F9FA',
              border: '1px solid #E2E8F0',
              fontSize: '0.7rem',
              color: '#334155',
              wordBreak: 'break-all',
            }}
          >
            POST /api/v1/public/marketing/events/webhook {`{"event_key":"${String(triggerConfig.event_key || 'trial_activated')}","email":"..."}`}
          </code>
        </div>
      )}
    </div>
  );
};

export default TriggerConfig;
