import React from 'react';
import { BellRing, Flame, Gift, ShieldCheck, Tag, Users, Webhook } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import type { FlowCatalogResources, FlowNodeType11 } from './flowConstants';

export interface CrmActionConfigProps {
  nodeType: FlowNodeType11;
  config: Record<string, unknown>;
  resources: FlowCatalogResources;
  onChange: (nextConfig: Record<string, unknown>) => void;
}

export const CrmActionConfig: React.FC<CrmActionConfigProps> = ({
  nodeType,
  config,
  resources,
  onChange,
}) => {
  const patch = (next: Record<string, unknown>) => {
    onChange({ ...config, ...next });
  };

  if (nodeType === 'add_remove_tag') {
    const operation = String(config.operation || 'add') as 'add' | 'remove';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>
            <Tag size={13} style={{ display: 'inline', marginRight: 4 }} /> Thao tác với Nhãn (Tag)
          </label>
          <select
            className="form-input"
            style={{ height: 40 }}
            value={operation}
            onChange={(e) => patch({ operation: e.target.value })}
          >
            <option value="add">Gắn thêm Nhãn vào Hồ sơ 360° (Add Tag)</option>
            <option value="remove">Gỡ bỏ Nhãn khỏi Hồ sơ (Remove Tag)</option>
          </select>
        </div>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Tên Nhãn phân loại</label>
          <input
            className="form-input"
            style={{ height: 40 }}
            placeholder="VD: SQL_Hot, Da_Nhan_Bao_Gia, VIP"
            value={String(config.tag || 'VIP')}
            onChange={(e) => patch({ tag: e.target.value })}
          />
        </div>
      </div>
    );
  }

  if (nodeType === 'update_lead_score') {
    const delta = Number(config.delta ?? 25);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>
            <Flame size={13} style={{ display: 'inline', marginRight: 4, color: '#D97706' }} />
            Số điểm cộng / trừ (Lead Score Delta)
          </label>
          <input
            type="number"
            className="form-input"
            style={{ height: 42 }}
            value={delta}
            onChange={(e) => patch({ delta: Number(e.target.value || 0) })}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[10, 25, 50, -15].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => patch({ delta: preset })}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                border: delta === preset ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                background: delta === preset ? '#EEF2FF' : '#F8F9FA',
                color: preset >= 0 ? '#1E40FF' : '#DC2626',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {preset >= 0 ? `+${preset}` : preset} điểm
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (nodeType === 'issue_voucher') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>
            <Gift size={13} style={{ display: 'inline', marginRight: 4, color: '#059669' }} />
            Chiến Dịch Mã Ưu Đãi (`mkt_voucher_campaigns`)
          </label>
          <select
            className="form-input"
            style={{ height: 42 }}
            value={String(config.voucher_campaign_id || '')}
            onChange={(e) => patch({ voucher_campaign_id: e.target.value })}
          >
            <option value="">— Tự động sinh mã ưu đãi độc nhất —</option>
            {resources.vouchers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.code_prefix ? `(${v.code_prefix}***)` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Hiệu lực sử dụng (Số ngày)</label>
          <input
            type="number"
            min={1}
            className="form-input"
            style={{ height: 40 }}
            value={String(config.valid_days ?? 14)}
            onChange={(e) => patch({ valid_days: Math.max(1, Number(e.target.value || 14)) })}
          />
        </div>
      </div>
    );
  }

  if (nodeType === 'webhook_http') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Method</label>
            <select
              className="form-input"
              style={{ height: 40 }}
              value={String(config.method || 'POST')}
              onChange={(e) => patch({ method: e.target.value })}
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              <Webhook size={13} style={{ display: 'inline', marginRight: 4 }} /> Endpoint URL Đích
            </label>
            <input
              className="form-input"
              style={{ height: 40 }}
              placeholder="https://api.partner.vn/v1/leads/sync"
              value={String(config.url || '')}
              onChange={(e) => patch({ url: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Header Secret / Bearer Token (Tùy chọn)</label>
          <input
            className="form-input"
            style={{ height: 38 }}
            placeholder="X-Webhook-Secret..."
            value={String(config.secret_header || '')}
            onChange={(e) => patch({ secret_header: e.target.value })}
          />
        </div>
      </div>
    );
  }

  if (nodeType === 'notify_internal') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>
            <BellRing size={13} style={{ display: 'inline', marginRight: 4 }} /> Kênh Thông Báo Nội Bộ
          </label>
          <select
            className="form-input"
            style={{ height: 40 }}
            value={String(config.channel || 'workchat')}
            onChange={(e) => patch({ channel: e.target.value })}
          >
            <option value="workchat">Tin nhắn WorkChat + Chuông Thông báo</option>
            <option value="in_app">Chuông thông báo In-App</option>
            <option value="email">Email Quản lý trực tiếp</option>
          </select>
        </div>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Đối tượng nhận tin</label>
          <select
            className="form-input"
            style={{ height: 40 }}
            value={String(config.recipient_role || 'assigned_sale')}
            onChange={(e) => patch({ recipient_role: e.target.value })}
          >
            <option value="assigned_sale">Chuyên viên Sale đang phụ trách Lead</option>
            <option value="team_leader">Trưởng nhóm Kinh doanh (Team Leader)</option>
            <option value="tenant_admin">Quản trị viên hệ thống</option>
          </select>
        </div>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Nội dung cảnh báo</label>
          <textarea
            className="form-input"
            style={{ minHeight: 68, padding: '8px 10px' }}
            value={String(config.message || 'Khách hàng {{lead.name}} vừa tương tác nóng — Liên hệ tư vấn ngay!')}
            onChange={(e) => patch({ message: e.target.value })}
          />
        </div>
      </div>
    );
  }

  // Highlighted `push_to_autodata_sale_round`
  return (
    <div
      style={{
        padding: '0.95rem',
        borderRadius: 14,
        background: 'linear-gradient(135deg, #ECFDF5 0%, #EFF6FF 100%)',
        border: '1.5px solid #10B981',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065F46', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Users size={15} /> Bàn Giao Sang Vòng Chia Sale Auto Data
        </span>
        <Badge tone="success" icon={<ShieldCheck size={11} />}>Fair-Share</Badge>
      </div>

      <div style={{ fontSize: '0.73rem', color: '#047857', lineHeight: 1.45 }}>
        Chuyển trạng thái hồ sơ từ <code>marketing_nurture</code> sang hàng đợi phân bổ tự động công bằng cho đội ngũ Sale!
      </div>

      <div>
        <label className="form-label" style={{ fontWeight: 800, color: '#0F172A' }}>
          Chọn Vòng Chia Sale Đích (`distribution_rounds`)
        </label>
        <select
          className="form-input"
          style={{ height: 42, background: '#FFFFFF', borderColor: '#10B981' }}
          value={String(config.round_id || '')}
          onChange={(e) => patch({ round_id: e.target.value })}
        >
          <option value="">— Vòng chia mặc định có độ ưu tiên cao nhất —</option>
          {resources.rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.74rem' }}>Độ ưu tiên SLA</label>
          <select
            className="form-input"
            style={{ height: 38, background: '#FFFFFF' }}
            value={String(config.priority || 'urgent_hot')}
            onChange={(e) => patch({ priority: e.target.value })}
          >
            <option value="urgent_hot">🔥 Nóng Khẩn Cấp (SLA 5p)</option>
            <option value="high">⚡ Ưu tiên cao (SLA 15p)</option>
            <option value="normal">Tiêu chuẩn</option>
          </select>
        </div>
        <div>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.74rem' }}>Ghi chú bàn giao Sale</label>
          <input
            className="form-input"
            style={{ height: 38, background: '#FFFFFF' }}
            placeholder="Đã nuôi dưỡng đủ điểm..."
            value={String(config.handoff_note || 'Đạt chuẩn MQL từ Automation Flow')}
            onChange={(e) => patch({ handoff_note: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

export default CrmActionConfig;
