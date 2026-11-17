import React from 'react';
import { BellRing, CalendarClock, Clock, Gauge, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import type {
  CampaignReminderStepDto,
  EmailTemplateOptionDto,
  ReminderCondition,
} from './campaignTypes';

export interface ReminderManagerProps {
  reminders: CampaignReminderStepDto[];
  templates: EmailTemplateOptionDto[];
  mainSubject: string;
  throttlePerMinute: number;
  scheduleMode: 'now' | 'scheduled';
  scheduledAt: string;
  onChangeReminders: (next: CampaignReminderStepDto[]) => void;
  onChangeThrottle: (rate: number) => void;
  onChangeScheduleMode: (mode: 'now' | 'scheduled') => void;
  onChangeScheduledAt: (iso: string) => void;
}

const CONDITION_OPTIONS: ReadonlyArray<{ value: ReminderCondition; label: string; desc: string }> = [
  {
    value: 'no_open',
    label: 'Chưa mở tin (no_open)',
    desc: 'Tự động gửi nhắc những khách đã nhận nhưng chưa mở Email / ZNS',
  },
  {
    value: 'no_click',
    label: 'Đã mở nhưng chưa Click (no_click)',
    desc: 'Thúc đẩy hành động với nhóm đã đọc nội dung nhưng chưa nhấn CTA',
  },
  {
    value: 'clicked_no_convert',
    label: 'Đã Click nhưng chưa Chuyển đổi (clicked_no_convert)',
    desc: 'Bám đuổi chốt đơn nhóm khách quan tâm cao chưa hoàn tất đăng ký/mua',
  },
];

export const ReminderManager: React.FC<ReminderManagerProps> = ({
  reminders,
  templates,
  mainSubject,
  throttlePerMinute,
  scheduleMode,
  scheduledAt,
  onChangeReminders,
  onChangeThrottle,
  onChangeScheduleMode,
  onChangeScheduledAt,
}) => {
  const handleAddReminder = () => {
    if (reminders.length >= 3) {
      toast.error('Khuyến nghị tối đa 3 bước gửi nhắc để bảo vệ điểm uy tín tên miền (Sender Reputation).');
      return;
    }
    const nextOrder = reminders.length + 1;
    const defaultCondition: ReminderCondition =
      nextOrder === 1 ? 'no_open' : nextOrder === 2 ? 'no_click' : 'clicked_no_convert';
    const nextItem: CampaignReminderStepDto = {
      id: crypto.randomUUID(),
      step_order: nextOrder,
      condition: defaultCondition,
      wait_hours: nextOrder * 24,
      subject: `[Nhắc lần ${nextOrder}] ${mainSubject || 'Ưu đãi dành riêng cho {{lead.name}}'}`,
      template_id: null,
    };
    onChangeReminders([...reminders, nextItem]);
  };

  const handleUpdate = (id: string, patch: Partial<CampaignReminderStepDto>) => {
    onChangeReminders(reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleRemove = (id: string) => {
    onChangeReminders(reminders.filter((r) => r.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Multi-step Follow-up Reminders */}
      <Card
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <BellRing size={16} color="#1E40FF" /> Chuỗi Gửi Nhắc Tự Động Đa Bước (`mkt_campaign_reminders`)
          </span>
        }
        subtitle="Hệ thống tự động kiểm tra trạng thái mở/click/chuyển đổi trên mkt_send_claims trước khi phát nhắc"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge tone="primary">{reminders.length}/3 bước nhắc</Badge>
            <button
              type="button"
              onClick={handleAddReminder}
              style={{
                height: 38,
                padding: '0 0.95rem',
                borderRadius: 10,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Thêm Bước Nhắc
            </button>
          </div>
        }
        padding="1rem 1.25rem"
      >
        {reminders.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              borderRadius: 14,
              border: '1px dashed #CBD5E1',
              background: '#F8F9FA',
              textAlign: 'center',
              fontSize: '0.83rem',
              color: '#64748B',
            }}
          >
            Chưa bật bước gửi nhắc tự động nào. Nhấn <strong>+ Thêm Bước Nhắc</strong> để tăng thêm 25–40% tỉ lệ mở!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reminders.map((rem, idx) => (
              <div
                key={rem.id}
                style={{
                  padding: '1rem',
                  borderRadius: 14,
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge tone="primary">Bước nhắc #{idx + 1}</Badge>
                    <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                      Chờ {rem.wait_hours} giờ sau lần gửi chính
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(rem.id)}
                    className="btn secondary sm"
                    style={{ height: 32, color: '#DC2626' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.6fr 1fr', gap: 10 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
                      Điều kiện kích hoạt nhắc
                    </label>
                    <select
                      className="form-input"
                      style={{ height: 42, background: '#FFFFFF' }}
                      value={rem.condition}
                      onChange={(e) => handleUpdate(rem.id, { condition: e.target.value as ReminderCondition })}
                    >
                      {CONDITION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
                      Độ trễ chờ (Giờ)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={720}
                      className="form-input"
                      style={{ height: 42, background: '#FFFFFF' }}
                      value={rem.wait_hours}
                      onChange={(e) => handleUpdate(rem.id, { wait_hours: Math.max(1, Number(e.target.value || 24)) })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
                      Mẫu Email nhắc (Tùy chọn)
                    </label>
                    <select
                      className="form-input"
                      style={{ height: 42, background: '#FFFFFF' }}
                      value={rem.template_id || ''}
                      onChange={(e) => handleUpdate(rem.id, { template_id: e.target.value || null })}
                    >
                      <option value="">— Kế thừa mẫu của chiến dịch chính —</option>
                      {templates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
                    Tiêu đề thư nhắc (Subject Follow-up)
                  </label>
                  <input
                    className="form-input"
                    style={{ height: 42, background: '#FFFFFF' }}
                    value={rem.subject}
                    onChange={(e) => handleUpdate(rem.id, { subject: e.target.value })}
                    placeholder="VD: Nhắc nhẹ {{lead.name}} — Ưu đãi sẽ khép lại hôm nay"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Throttle & Schedule */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Gauge size={15} color="#1E40FF" /> Nhịp Độ Điều Tiết Gửi (`throttle_per_minute`)
            </span>
          }
          subtitle="Chống nghẽn hàng đợi SMTP/SES và tránh kích hoạt bộ lọc Rate-Limit của Gmail/Outlook"
          padding="1rem 1.15rem"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Tốc độ tối đa mỗi phút:</span>
              <Badge tone="primary">{throttlePerMinute.toLocaleString('vi-VN')} tin / phút</Badge>
            </div>
            <input
              type="range"
              min={10}
              max={1000}
              step={10}
              value={throttlePerMinute}
              onChange={(e) => onChangeThrottle(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#1E40FF' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
              <span>10/phút (Ấm IP mới)</span>
              <span>250/phút (Chuẩn B2B)</span>
              <span>1.000/phút (AWS SES Cao tốc)</span>
            </div>
          </div>
        </Card>

        <Card
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CalendarClock size={15} color="#1E40FF" /> Lịch Phát Hành Chiến Dịch
            </span>
          }
          subtitle="Phát hành ngay lập tức hoặc đặt lịch tự động qua Master Cron"
          padding="1rem 1.15rem"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => onChangeScheduleMode('now')}
                style={{
                  height: 40,
                  borderRadius: 10,
                  border: scheduleMode === 'now' ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                  background: scheduleMode === 'now' ? '#EEF2FF' : '#FFFFFF',
                  color: scheduleMode === 'now' ? '#1E40FF' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  cursor: 'pointer',
                }}
              >
                <Clock size={14} /> Gửi Ngay Khi Duyệt
              </button>
              <button
                type="button"
                onClick={() => onChangeScheduleMode('scheduled')}
                style={{
                  height: 40,
                  borderRadius: 10,
                  border: scheduleMode === 'scheduled' ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                  background: scheduleMode === 'scheduled' ? '#EEF2FF' : '#FFFFFF',
                  color: scheduleMode === 'scheduled' ? '#1E40FF' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  cursor: 'pointer',
                }}
              >
                <CalendarClock size={14} /> Hẹn Giờ Phát Hành
              </button>
            </div>

            {scheduleMode === 'scheduled' && (
              <input
                type="datetime-local"
                className="form-input"
                style={{ height: 42 }}
                value={scheduledAt}
                onChange={(e) => onChangeScheduledAt(e.target.value)}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReminderManager;
