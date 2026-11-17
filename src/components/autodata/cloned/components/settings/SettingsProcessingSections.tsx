import React from 'react';
import { GitBranch, Clock, ShieldCheck, PhoneCall } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import type { TenantSettingsDto } from '../../utils/pipelineConfig';

interface Props {
  settings: TenantSettingsDto;
  updateSetting: <K extends keyof TenantSettingsDto>(key: K, val: TenantSettingsDto[K]) => void;
  t: (s: string) => string;
}

const COMMON_TIMEZONES = [
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'UTC',
  'America/New_York',
  'Europe/London',
];

export const SettingsProcessingSections: React.FC<Props> = ({ settings, updateSetting, t }) => {
  const blockedSeqText = Array.isArray(settings.blocked_phone_sequences)
    ? settings.blocked_phone_sequences.join(', ')
    : '';
  const prefixesText = Array.isArray(settings.vn_mobile_prefixes)
    ? settings.vn_mobile_prefixes.join(', ')
    : '03, 05, 07, 08, 09';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
      {/* 1. Distribution Algorithm & Queue Drain */}
      <div data-tour="settings-proc-distribution" className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', background: '#1E40FF', color: 'white', padding: 4, borderRadius: 6 }}>
            <GitBranch size={16} />
          </span>
          {t('Thuật toán Phân bổ & Hàng đợi Queue')}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
          {t('Điều chỉnh cách chia Lead giữa các Sale/Đại lý, chính sách xử lý Data trùng, hàng đợi khi có Sale online lại và quỹ bù ca nghỉ phép.')}
        </p>

        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">{t('Chế độ chia Lead mặc định')}</label>
            <CustomSelect
              options={[
                { value: 'weighted_round_robin', label: t('Chia theo Tỷ trọng (Weighted Round Robin)') },
                { value: 'strict_round_robin', label: t('Xoay vòng đều tuyệt đối (Strict 1:1)') },
                { value: 'least_loaded', label: t('Ưu tiên người ít Lead nhất (Least Loaded)') },
                { value: 'manual_only', label: t('Chỉ xếp hàng đợi — Điều phối Thủ công') },
              ]}
              value={settings.distribution_mode || 'weighted_round_robin'}
              onChange={(val) => updateSetting('distribution_mode', String(val) as any)}
              width="100%"
            />
          </div>
          <div>
            <label className="form-label">{t('Xử lý khi trùng Số điện thoại')}</label>
            <CustomSelect
              options={[
                { value: 'route_to_previous_sale', label: t('Giao lại Sale cũ chăm sóc tiếp (Nhắc trùng)') },
                { value: 'round_robin', label: t('Vẫn chia vòng mới bình thường') },
                { value: 'update_existing', label: t('Cập nhật ghi chú vào Lead cũ (Không tạo dòng mới)') },
                { value: 'reject_duplicate', label: t('Từ chối / Chặn Data trùng lặp') },
              ]}
              value={settings.duplicate_lead_action || 'route_to_previous_sale'}
              onChange={(val) => updateSetting('duplicate_lead_action', String(val) as any)}
              width="100%"
            />
          </div>
          <div>
            <label className="form-label">{t('Số Lead xả mỗi lượt khi Sale mở trực')}</label>
            <input
              type="number"
              min={1}
              max={100}
              className="form-input"
              value={settings.queue_drain_batch_limit ?? 20}
              onChange={(e) => updateSetting('queue_drain_batch_limit', Math.max(1, Math.min(100, Number(e.target.value) || 20)))}
            />
          </div>
          <div>
            <label className="form-label">{t('Trần tích lũy lượt bù nghỉ phép (Vacation Cap)')}</label>
            <input
              type="number"
              min={0}
              max={50}
              className="form-input"
              value={settings.vacation_credit_cap ?? 5}
              onChange={(e) => updateSetting('vacation_credit_cap', Math.max(0, Math.min(50, Number(e.target.value) || 0)))}
            />
          </div>
        </div>

        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { key: 'auto_accept_on_assign', label: 'Tự động Xác nhận tiếp nhận ngay khi chia', val: settings.auto_accept_on_assign ?? false },
            { key: 'auto_drain_on_online', label: 'Tự động xả Queue chờ khi Sale Online', val: settings.auto_drain_on_online ?? true },
            { key: 'drain_recalled_leads', label: 'Gom cả Lead bị Thu hồi SLA vào hàng đợi xả lại', val: settings.drain_recalled_leads ?? true },
            { key: 'enable_vacation_credits', label: 'Bù lượt nghỉ phép khi Sale bật lại trạng thái nhận', val: settings.enable_vacation_credits ?? true },
          ].map((item) => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text)' }}>{t(item.label)}</span>
              <ToggleSwitch
                checked={Boolean(item.val)}
                onChange={(checked) => updateSetting(item.key as any, checked)}
                small
              />
            </div>
          ))}
        </div>
      </div>

      {/* 2. Default Work Schedule & Timezone */}
      <div data-tour="settings-proc-schedule" className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', background: '#0ea5e9', color: 'white', padding: 4, borderRadius: 6 }}>
            <Clock size={16} />
          </span>
          {t('Lịch Làm Việc Mặc Định & Múi Giờ Báo Cáo')}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
          {t('Dùng chung cho Dashboard (tỷ lệ Lead ngoài giờ), Cron SLA/Drain và lịch mặc định khi tạo Sale/Đại lý mới.')}
        </p>

        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">{t('Múi giờ (Timezone)')}</label>
            <CustomSelect
              options={COMMON_TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
              value={settings.timezone_name || 'Asia/Ho_Chi_Minh'}
              onChange={(val) => updateSetting('timezone_name', String(val))}
              width="100%"
            />
          </div>
          <div>
            <label className="form-label">{t('Giờ bắt đầu ca')}</label>
            <input
              type="time"
              className="form-input"
              value={settings.work_schedule_start || '08:30'}
              onChange={(e) => updateSetting('work_schedule_start', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">{t('Giờ kết thúc (T2–T6)')}</label>
            <input
              type="time"
              className="form-input"
              value={settings.work_schedule_end || '18:00'}
              onChange={(e) => updateSetting('work_schedule_end', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">{t('Giờ kết thúc Thứ 7')}</label>
            <input
              type="time"
              className="form-input"
              value={settings.work_schedule_saturday_end || '12:00'}
              onChange={(e) => updateSetting('work_schedule_saturday_end', e.target.value)}
            />
          </div>
        </div>

        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{t('Bắt buộc chia số chỉ trong Giờ hành chính')}</span>
            <ToggleSwitch
              checked={Boolean(settings.enforce_work_schedule)}
              onChange={(checked) => updateSetting('enforce_work_schedule', checked)}
              small
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{t('Làm việc ngày Chủ Nhật mặc định')}</span>
            <ToggleSwitch
              checked={Boolean(settings.work_schedule_sunday_enabled)}
              onChange={(checked) => updateSetting('work_schedule_sunday_enabled', checked)}
              small
            />
          </div>
        </div>
      </div>

      {/* 3. SLA & Auto-Recall Policy */}
      <div data-tour="settings-proc-sla" className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', background: '#f59e0b', color: 'white', padding: 4, borderRadius: 6 }}>
            <ShieldCheck size={16} />
          </span>
          {t('SLA Tiếp Nhận & Tự Động Thu Hồi (Auto-Recall)')}
        </h3>
        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">{t('Thời hạn SLA mặc định (Phút)')}</label>
            <input
              type="number"
              min={0}
              max={1440}
              className="form-input"
              value={settings.default_sla_minutes ?? 15}
              onChange={(e) => updateSetting('default_sla_minutes', Math.max(0, Math.min(1440, Number(e.target.value) || 0)))}
            />
          </div>
          <div>
            <label className="form-label">{t('Ngưỡng mục tiêu tốc độ chia số KPI (Giây)')}</label>
            <input
              type="number"
              min={5}
              max={86400}
              className="form-input"
              value={settings.sla_target_seconds ?? 120}
              onChange={(e) => updateSetting('sla_target_seconds', Math.max(5, Math.min(86400, Number(e.target.value) || 120)))}
            />
          </div>
        </div>
        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{t('Tự động thu hồi & chuyển Sale khác khi quá hạn SLA')}</span>
            <ToggleSwitch
              checked={Boolean(settings.sla_auto_recall_enabled)}
              onChange={(checked) => updateSetting('sla_auto_recall_enabled', checked)}
              small
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{t('Dùng SLA mặc định nếu Stage chưa cài SLA riêng')}</span>
            <ToggleSwitch
              checked={settings.use_default_sla_fallback ?? true}
              onChange={(checked) => updateSetting('use_default_sla_fallback', checked)}
              small
            />
          </div>
        </div>
      </div>

      {/* 4. Phone Validation & Lead Onboarding Defaults */}
      <div data-tour="settings-proc-phone" className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', background: '#10b981', color: 'white', padding: 4, borderRadius: 6 }}>
            <PhoneCall size={16} />
          </span>
          {t('Chuẩn Hóa Số Điện Thoại, Mã Quốc Gia & Mặc Định Lead')}
        </h3>
        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">{t('Mã vùng Quốc gia mặc định (Dial Code)')}</label>
            <input
              className="form-input"
              placeholder="84"
              value={settings.default_dial_code ?? '84'}
              onChange={(e) => updateSetting('default_dial_code', e.target.value.replace(/\D/g, '').slice(0, 5) || '84')}
            />
          </div>
          <div>
            <label className="form-label">{t('Tiền tệ mặc định (Currency)')}</label>
            <CustomSelect
              options={[
                { value: 'VND', label: 'VND (₫)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'SGD', label: 'SGD (S$)' },
                { value: 'THB', label: 'THB (฿)' },
              ]}
              value={settings.default_currency || 'VND'}
              onChange={(val) => updateSetting('default_currency', String(val))}
              width="100%"
            />
          </div>
          <div>
            <label className="form-label">{t('Đầu số di động hợp lệ (cách nhau dấu phẩy)')}</label>
            <input
              className="form-input"
              value={prefixesText}
              onChange={(e) =>
                updateSetting(
                  'vn_mobile_prefixes',
                  e.target.value.split(/[,\s;]+/).map((s) => s.trim()).filter(Boolean)
                )
              }
            />
          </div>
          <div>
            <label className="form-label">{t('Regex SĐT tùy chỉnh (bỏ trống = chuẩn quốc gia)')}</label>
            <input
              className="form-input"
              placeholder="VD: ^(0|\\+84)[0-9]{9}$"
              value={settings.custom_phone_regex ?? ''}
              onChange={(e) => updateSetting('custom_phone_regex', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">{t('Nguồn Lead mặc định khi nhập tay / Webhook thiếu source')}</label>
            <input
              className="form-input"
              value={settings.default_lead_source ?? 'Manual CRM'}
              onChange={(e) => updateSetting('default_lead_source', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">{t('Tiền tố tên Khách hàng khi thiếu tên')}</label>
            <input
              className="form-input"
              value={settings.default_lead_name_prefix ?? 'Khách hàng'}
              onChange={(e) => updateSetting('default_lead_name_prefix', e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">{t('Dãy số điện thoại ảo bị chặn trên Cổng Sale (cách nhau dấu phẩy)')}</label>
          <input
            className="form-input"
            placeholder="0123456789, 0987654321, 1234567890"
            value={blockedSeqText}
            onChange={(e) =>
              updateSetting(
                'blocked_phone_sequences',
                e.target.value.split(/[,\s;]+/).map((s) => s.replace(/\D/g, '')).filter(Boolean)
              )
            }
          />
        </div>

        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('Chặn SĐT lặp chữ số ảo')}</span>
            <ToggleSwitch checked={settings.block_repeated_digits ?? true} onChange={(c) => updateSetting('block_repeated_digits', c)} small />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('Cho phép SĐT quốc tế')}</span>
            <ToggleSwitch checked={settings.allow_international_phones ?? true} onChange={(c) => updateSetting('allow_international_phones', c)} small />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('Cho phép số máy bàn 02x')}</span>
            <ToggleSwitch checked={settings.allow_landline_phones ?? true} onChange={(c) => updateSetting('allow_landline_phones', c)} small />
          </div>
        </div>
      </div>
    </div>
  );
};
