import React from 'react';
import { CalendarClock, Clock, ShieldCheck } from 'lucide-react';

export interface WaitConfigProps {
  config: Record<string, unknown>;
  onChange: (nextConfig: Record<string, unknown>, suggestedLabel?: string) => void;
}

export const WaitConfig: React.FC<WaitConfigProps> = ({ config, onChange }) => {
  const mode = String(config.mode || 'duration') as 'duration' | 'until_time';
  const duration = Number(config.duration ?? 24);
  const unit = String(config.unit || 'hours') as 'minutes' | 'hours' | 'days';
  const untilTime = String(config.until_time || '09:00');
  const businessHoursOnly = Boolean(config.business_hours_only ?? false);

  const emit = (patch: Record<string, unknown>) => {
    const merged = { ...config, ...patch };
    const nextMode = String(merged.mode || 'duration');
    const nextUnit = String(merged.unit || 'hours');
    const nextDur = Number(merged.duration ?? 24);
    const unitLabel = nextUnit === 'minutes' ? 'phút' : nextUnit === 'days' ? 'ngày' : 'giờ';
    const label =
      nextMode === 'until_time'
        ? `Chờ tới ${String(merged.until_time || '09:00')}`
        : `Chờ ${nextDur} ${unitLabel}${merged.business_hours_only ? ' (Giờ HC)' : ''}`;
    onChange(merged, label);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button
          type="button"
          onClick={() => emit({ mode: 'duration' })}
          style={{
            height: 38,
            borderRadius: 10,
            border: mode === 'duration' ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
            background: mode === 'duration' ? '#EEF2FF' : '#FFFFFF',
            color: mode === 'duration' ? '#1E40FF' : '#475569',
            fontWeight: 700,
            fontSize: '0.78rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            cursor: 'pointer',
          }}
        >
          <Clock size={14} /> Khoảng Thời Gian
        </button>

        <button
          type="button"
          onClick={() => emit({ mode: 'until_time' })}
          style={{
            height: 38,
            borderRadius: 10,
            border: mode === 'until_time' ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
            background: mode === 'until_time' ? '#EEF2FF' : '#FFFFFF',
            color: mode === 'until_time' ? '#1E40FF' : '#475569',
            fontWeight: 700,
            fontSize: '0.78rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            cursor: 'pointer',
          }}
        >
          <CalendarClock size={14} /> Đúng Giờ Trong Ngày
        </button>
      </div>

      {mode === 'duration' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Thời lượng chờ</label>
            <input
              type="number"
              min={1}
              max={365}
              className="form-input"
              style={{ height: 42 }}
              value={duration}
              onChange={(e) => emit({ duration: Math.max(1, Number(e.target.value || 1)) })}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Đơn vị</label>
            <select
              className="form-input"
              style={{ height: 42 }}
              value={unit}
              onChange={(e) => emit({ unit: e.target.value })}
            >
              <option value="minutes">Phút (minutes)</option>
              <option value="hours">Giờ (hours)</option>
              <option value="days">Ngày (days)</option>
            </select>
          </div>
        </div>
      ) : (
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Giữ khách lại cho tới khung giờ</label>
          <input
            type="time"
            className="form-input"
            style={{ height: 42 }}
            value={untilTime}
            onChange={(e) => emit({ until_time: e.target.value })}
          />
        </div>
      )}

      {/* Business Hours Toggle */}
      <label
        style={{
          padding: '0.75rem 0.9rem',
          borderRadius: 12,
          background: businessHoursOnly ? '#EFF6FF' : '#F8F9FA',
          border: businessHoursOnly ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={businessHoursOnly}
          onChange={(e) => emit({ business_hours_only: e.target.checked })}
          style={{ width: 16, height: 16, marginTop: 2, accentColor: '#1E40FF' }}
        />
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
            <ShieldCheck size={14} color="#1E40FF" /> Chỉ nhả bước trong Giờ Hành Chính (08:30 – 18:00)
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>
            Nếu hết thời gian chờ rơi vào ban đêm hoặc Chủ nhật, hệ thống tự dời sang 08:30 sáng ngày làm việc kế tiếp.
          </div>
        </div>
      </label>
    </div>
  );
};

export default WaitConfig;
