import React from 'react';
import { Moon, Repeat, ShieldAlert, Target } from 'lucide-react';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { DEFAULT_FLOW_SETTINGS, type FlowSettingsConfig } from './flowConstants';

export interface FlowSettingsTabProps {
  description: string;
  settings: FlowSettingsConfig;
  onChangeDescription: (desc: string) => void;
  onChangeSettings: (next: FlowSettingsConfig) => void;
}

const WEEK_DAYS: ReadonlyArray<{ id: number; label: string }> = [
  { id: 1, label: 'Thứ 2' },
  { id: 2, label: 'Thứ 3' },
  { id: 3, label: 'Thứ 4' },
  { id: 4, label: 'Thứ 5' },
  { id: 5, label: 'Thứ 6' },
  { id: 6, label: 'Thứ 7' },
  { id: 0, label: 'Chủ nhật' },
];

export const FlowSettingsTab: React.FC<FlowSettingsTabProps> = ({
  description,
  settings,
  onChangeDescription,
  onChangeSettings,
}) => {
  const merged = { ...DEFAULT_FLOW_SETTINGS, ...settings };

  const patch = (updates: Partial<FlowSettingsConfig>) => {
    onChangeSettings({ ...merged, ...updates });
  };

  const toggleDay = (dayId: number) => {
    const exists = merged.active_days.includes(dayId);
    const nextDays = exists
      ? merged.active_days.filter((d) => d !== dayId)
      : [...merged.active_days, dayId];
    patch({ active_days: nextDays });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="Mô Tả Mục Tiêu Vận Hành Kịch Bản">
        <textarea
          className="form-input"
          style={{ minHeight: 74, padding: '0.75rem' }}
          placeholder="Ghi chú mục tiêu kinh doanh, đối tượng áp dụng và quy chuẩn bàn giao cho đội ngũ Sale..."
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
        />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Quiet Hours Window */}
        <Card
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Moon size={16} color="#1E40FF" /> Khung Giờ Yên Tĩnh (Quiet Hours)
            </span>
          }
          subtitle="Tạm hoãn gửi Email / Zalo ZNS ban đêm để bảo vệ trải nghiệm khách hàng"
          actions={
            <Badge tone={merged.quiet_hours_enabled ? 'primary' : 'neutral'}>
              {merged.quiet_hours_enabled ? 'Đang bật' : 'Tắt'}
            </Badge>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={merged.quiet_hours_enabled}
                onChange={(e) => patch({ quiet_hours_enabled: e.target.checked })}
                style={{ accentColor: '#1E40FF', width: 16, height: 16 }}
              />
              Kích hoạt chế độ đóng băng gửi tin ngoài giờ cho phép
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Bắt đầu yên tĩnh từ</label>
                <input
                  type="time"
                  className="form-input"
                  style={{ height: 40 }}
                  disabled={!merged.quiet_hours_enabled}
                  value={merged.quiet_start}
                  onChange={(e) => patch({ quiet_start: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Mở gửi trở lại lúc</label>
                <input
                  type="time"
                  className="form-input"
                  style={{ height: 40 }}
                  disabled={!merged.quiet_hours_enabled}
                  value={merged.quiet_end}
                  onChange={(e) => patch({ quiet_end: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Ngày được phép phát tin trong tuần</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {WEEK_DAYS.map((d) => {
                  const active = merged.active_days.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id)}
                      style={{
                        height: 34,
                        padding: '0 0.75rem',
                        borderRadius: 9,
                        border: active ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                        background: active ? '#EEF2FF' : '#F8F9FA',
                        color: active ? '#1E40FF' : '#64748B',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Re-entry Rules */}
        <Card
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Repeat size={16} color="#1E40FF" /> Quy Tắc Tái Tham Gia Luồng (Re-entry Rules)
            </span>
          }
          subtitle="Kiểm soát việc một khách hàng đi vào cùng kịch bản nhiều lần"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(
              [
                { value: 'once', title: 'Chỉ duy nhất 1 lần trọn đời (once)', desc: 'Phù hợp luồng Chào mừng khách mới / Onboarding' },
                { value: 'cooldown_days', title: 'Cho phép lặp lại sau thời gian nghỉ (cooldown_days)', desc: 'Chống gửi trùng liên tục trong thời gian ngắn' },
                { value: 'always', title: 'Luôn cho phép mỗi khi khớp Trigger (always)', desc: 'Phù hợp luồng Xác nhận đơn hàng / Sự kiện giao dịch' },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                style={{
                  padding: '0.7rem 0.9rem',
                  borderRadius: 12,
                  border: merged.reentry_mode === opt.value ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                  background: merged.reentry_mode === opt.value ? '#F8FAFF' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="reentry_mode"
                  checked={merged.reentry_mode === opt.value}
                  onChange={() => patch({ reentry_mode: opt.value })}
                  style={{ marginTop: 3, accentColor: '#1E40FF' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A' }}>{opt.title}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{opt.desc}</div>
                </div>
              </label>
            ))}

            {merged.reentry_mode === 'cooldown_days' && (
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Số ngày nghỉ tối thiểu trước khi vào lại</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  className="form-input"
                  style={{ height: 40, maxWidth: 180 }}
                  value={merged.cooldown_days}
                  onChange={(e) => patch({ cooldown_days: Math.max(1, Number(e.target.value || 14)) })}
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Goal Exit & Auto-Exit Safety */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Target size={16} color="#059669" /> Tiêu Chí Đạt Mục Tiêu & Dừng Chăm Sóc (Goal Exit)
            </span>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={merged.goal_exit_enabled}
                onChange={(e) => patch({ goal_exit_enabled: e.target.checked })}
                style={{ accentColor: '#059669', width: 16, height: 16 }}
              />
              Tự động rút khách khỏi luồng nuôi dưỡng ngay khi đạt mục tiêu
            </label>

            <select
              className="form-input"
              style={{ height: 42 }}
              disabled={!merged.goal_exit_enabled}
              value={merged.goal_criteria}
              onChange={(e) =>
                patch({ goal_criteria: e.target.value as FlowSettingsConfig['goal_criteria'] })
              }
            >
              <option value="pushed_to_sale_round">Đã chuyển vào Vòng chia Sale Auto Data</option>
              <option value="deal_won">Chốt thành công cơ hội bán hàng (Deal Won)</option>
              <option value="purchase_completed">Phát sinh đơn hàng thanh toán thực tế</option>
              <option value="score_gte">Lead Score chạm ngưỡng mục tiêu</option>
            </select>
          </div>
        </Card>

        <Card
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={16} color="#DC2626" /> Lá Chắn An Toàn Tự Động Thoát Luồng
            </span>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(
              [
                { key: 'exit_on_unsubscribe', label: 'Dừng ngay lập tức khi khách nhấn Hủy đăng ký (Unsubscribe)' },
                { key: 'exit_on_hard_bounce', label: 'Tự động dừng khi phát hiện địa chỉ Email lỗi vĩnh viễn (Hard Bounce)' },
                { key: 'exit_on_spam_complaint', label: 'Đưa vào danh sách chặn nếu có phản hồi khiếu nại Spam' },
              ] as const
            ).map((item) => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={merged[item.key]}
                  onChange={(e) => patch({ [item.key]: e.target.checked })}
                  style={{ accentColor: '#1E40FF', width: 16, height: 16 }}
                />
                {item.label}
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FlowSettingsTab;
