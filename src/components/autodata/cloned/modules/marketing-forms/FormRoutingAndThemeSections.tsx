import React from 'react';
import { Badge, FormCard } from '../../components/ui/AutoDataLoadingModal';
import {
  SAPPHIRE_COLOR_SWATCHES,
  type AudienceRef,
  type FormLayoutMode,
  type FormThankYouConfig,
  type FormThemeConfig,
  type RoundRef,
} from './types';

interface RoutingSectionProps {
  routingMode: 'marketing_nurture' | 'sale_round';
  onChangeRoutingMode: (next: 'marketing_nurture' | 'sale_round') => void;
  hasSaleRoundEntitlement: boolean;
  targetAudienceId: string;
  onChangeAudience: (id: string) => void;
  distributionRoundId: string;
  onChangeRound: (id: string) => void;
  requireOtp: boolean;
  onChangeRequireOtp: (val: boolean) => void;
  otpChannel: 'email' | 'sms';
  onChangeOtpChannel: (ch: 'email' | 'sms') => void;
  audiences: AudienceRef[];
  rounds: RoundRef[];
}

export const FormRoutingSection: React.FC<RoutingSectionProps> = ({
  routingMode,
  onChangeRoutingMode,
  hasSaleRoundEntitlement,
  targetAudienceId,
  onChangeAudience,
  distributionRoundId,
  onChangeRound,
  requireOtp,
  onChangeRequireOtp,
  otpChannel,
  onChangeOtpChannel,
  audiences,
  rounds,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <FormCard
        selected={routingMode === 'marketing_nurture'}
        onClick={() => onChangeRoutingMode('marketing_nurture')}
        title="Mode A: Marketing Nurture"
        description="Lưu vào kho nuôi dưỡng, gắn Tệp Audience & kích hoạt Automation Flow."
        badge={<Badge tone="primary">Nurture</Badge>}
      />
      <FormCard
        selected={routingMode === 'sale_round'}
        onClick={() => onChangeRoutingMode('sale_round')}
        title="Mode B: Chia Sale Auto Data"
        description={
          hasSaleRoundEntitlement
            ? 'Đẩy thẳng vào Vòng chia Fair-Share để chuyên viên Sale gọi ngay!'
            : 'Định tuyến hàng đợi Kinh doanh (Vòng chia Fair-Share ở Growth Suite).'
        }
        badge={<Badge tone="success">Chốt Nóng</Badge>}
      />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: routingMode === 'sale_round' ? '1fr 1fr' : '1fr', gap: 10 }}>
      <div>
        <label className="form-label" style={{ fontWeight: 700 }}>Tệp Khách hàng đích (Target Audience)</label>
        <select
          className="form-input"
          style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
          value={targetAudienceId}
          onChange={(e) => onChangeAudience(e.target.value)}
        >
          <option value="">— Không gắn cố định —</option>
          {audiences.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      {routingMode === 'sale_round' && (
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Vòng chia Sale Auto Data đích</label>
          <select
            className="form-input"
            style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
            value={distributionRoundId}
            onChange={(e) => onChangeRound(e.target.value)}
          >
            <option value="">— Tự động chọn Vòng chia ưu tiên —</option>
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>

    <div style={{ padding: '0.9rem 1rem', borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.84rem', color: '#0F172A', cursor: 'pointer' }}>
        <input type="checkbox" checked={requireOtp} onChange={(e) => onChangeRequireOtp(e.target.checked)} />
        Bật xác thực OTP 6 số (HMAC-SHA256, hiệu lực 5 phút, tối đa 5 lần thử)
      </label>
      {requireOtp && (
        <select
          className="form-input"
          style={{ height: 40, width: 190, background: '#FFFFFF', border: '1px solid #DBEAFE' }}
          value={otpChannel}
          onChange={(e) => onChangeOtpChannel(e.target.value as 'email' | 'sms')}
        >
          <option value="sms">Gửi OTP qua SMS</option>
          <option value="email">Gửi OTP qua Email</option>
        </select>
      )}
    </div>
  </div>
);

interface ThemeSectionProps {
  theme: FormThemeConfig;
  onChangeTheme: (patch: Partial<FormThemeConfig>) => void;
  thankYou: FormThankYouConfig;
  onChangeThankYou: (patch: Partial<FormThankYouConfig>) => void;
}

export const FormThemeSection: React.FC<ThemeSectionProps> = ({
  theme,
  onChangeTheme,
  thankYou,
  onChangeThankYou,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
      <div>
        <label className="form-label" style={{ fontWeight: 700 }}>Bố cục hiển thị (Layout)</label>
        <select
          className="form-input"
          style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
          value={theme.layout}
          onChange={(e) => onChangeTheme({ layout: e.target.value as FormLayoutMode })}
        >
          <option value="card">Card tiêu chuẩn</option>
          <option value="split">Split 2 cột thương hiệu</option>
          <option value="minimal">Minimal phẳng tối giản</option>
        </select>
      </div>
      <div>
        <label className="form-label" style={{ fontWeight: 700 }}>Độ bo góc ({theme.borderRadius}px)</label>
        <select
          className="form-input"
          style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
          value={theme.borderRadius}
          onChange={(e) => onChangeTheme({ borderRadius: Number(e.target.value) })}
        >
          <option value={8}>Sắc nét (8px)</option>
          <option value={14}>Chuẩn Sapphire (14px)</option>
          <option value={20}>Mềm mại (20px)</option>
          <option value={26}>Bo tròn cao (26px)</option>
        </select>
      </div>
      <div>
        <label className="form-label" style={{ fontWeight: 700 }}>Nhãn nút Gửi (CTA)</label>
        <input
          className="form-input"
          style={{ height: 44, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
          value={theme.buttonLabel}
          onChange={(e) => onChangeTheme({ buttonLabel: e.target.value })}
        />
      </div>
    </div>

    <div>
      <label className="form-label" style={{ fontWeight: 700 }}>Màu chủ đạo thương hiệu (Primary Color)</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {SAPPHIRE_COLOR_SWATCHES.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => onChangeTheme({ primaryColor: hex })}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: hex,
              border: theme.primaryColor === hex ? '3px solid #0F172A' : '2px solid #FFFFFF',
              boxShadow: '0 0 0 1px #CBD5E1',
              cursor: 'pointer',
            }}
          />
        ))}
        <input
          type="color"
          value={theme.primaryColor}
          onChange={(e) => onChangeTheme({ primaryColor: e.target.value })}
          style={{ width: 38, height: 32, border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer' }}
        />
      </div>
    </div>

    <div style={{ padding: '0.85rem', borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>Màn hình Cảm ơn sau khi nộp</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input
          className="form-input"
          style={{ height: 40, background: '#FFFFFF' }}
          placeholder="Tiêu đề cảm ơn..."
          value={thankYou.title}
          onChange={(e) => onChangeThankYou({ title: e.target.value })}
        />
        <input
          className="form-input"
          style={{ height: 40, background: '#FFFFFF' }}
          placeholder="URL chuyển hướng (Tùy chọn: https://...)"
          value={thankYou.redirectUrl || ''}
          onChange={(e) => onChangeThankYou({ redirectUrl: e.target.value })}
        />
      </div>
      <input
        className="form-input"
        style={{ height: 40, background: '#FFFFFF' }}
        placeholder="Thông điệp cảm ơn..."
        value={thankYou.message}
        onChange={(e) => onChangeThankYou({ message: e.target.value })}
      />
    </div>
  </div>
);
