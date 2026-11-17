import React, { useState } from 'react';
import { Award, Clock, Palette, Plus, Settings2, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import type {
  AudienceRefDto,
  ScoreRedirectRule,
  SurveySettingsDto,
  SurveyThemeDto,
  VoucherCampaignRefDto,
} from './surveyTypes';

const SAPPHIRE_SWATCHES = ['#1E40FF', '#2563EB', '#0284C7', '#0D9488', '#059669', '#4F46E5', '#7C3AED', '#0F172A'];

interface SettingsTabProps {
  theme: SurveyThemeDto;
  settings: SurveySettingsDto;
  audiences: AudienceRefDto[];
  voucherCampaigns: VoucherCampaignRefDto[];
  onUpdateTheme: (patch: Partial<SurveyThemeDto>) => void;
  onUpdateSettings: (patch: Partial<SurveySettingsDto>) => void;
}

export const SurveyPropertiesSettingsTab: React.FC<SettingsTabProps> = ({
  theme,
  settings,
  audiences,
  voucherCampaigns,
  onUpdateTheme,
  onUpdateSettings,
}) => {
  const [subTab, setSubTab] = useState<'crm' | 'cover' | 'rules'>('crm');
  const rules = settings.redirect_rules || [];

  const addRule = () => {
    const nextRule: ScoreRedirectRule = {
      id: crypto.randomUUID(),
      minScore: rules.length === 0 ? 0 : 30,
      maxScore: rules.length === 0 ? 29 : 100,
      thankYouTitle: rules.length === 0 ? 'Cảm ơn bạn đã tham gia!' : 'Chúc mừng! Bạn đạt nhóm Khách hàng Ưu tiên!',
      thankYouMessage: 'Phần quà ưu đãi dành riêng cho bạn đã sẵn sàng bên dưới.',
      redirectUrl: '',
      assignTag: rules.length === 0 ? 'Survey Warm' : 'Survey VIP Hot',
      voucherCampaignId: voucherCampaigns[0]?.id || '',
    };
    onUpdateSettings({ redirect_rules: [...rules, nextRule] });
  };

  const updateRule = (id: string, patch: Partial<ScoreRedirectRule>) => {
    onUpdateSettings({
      redirect_rules: rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const removeRule = (id: string) => {
    onUpdateSettings({
      redirect_rules: rules.filter((r) => r.id !== id),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 10, background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
        {(
          [
            ['crm', 'CRM & Điểm', Settings2],
            ['cover', 'Cover & Hẹn giờ', Palette],
            ['rules', `Luật Điểm (${rules.length})`, Award],
          ] as const
        ).map(([key, label, Icon]) => {
          const active = subTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSubTab(key)}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 8,
                border: active ? '1px solid rgba(30,64,255,0.2)' : 'none',
                background: active ? '#FFFFFF' : 'transparent',
                color: active ? '#1E40FF' : '#475569',
                fontSize: '0.73rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <Icon size={12} /> {label}
            </button>
          );
        })}
      </div>

      {subTab === 'crm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
              Điểm cộng Lead Score cơ bản khi hoàn thành
            </label>
            <input
              type="number"
              className="form-input"
              style={{ height: 40, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
              value={settings.base_lead_score ?? 10}
              onChange={(e) => onUpdateSettings({ base_lead_score: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
              Tag tự động gắn vào Hồ sơ 360° (`auto_tag`)
            </label>
            <input
              className="form-input"
              style={{ height: 40, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
              placeholder="VD: Đã Khảo Sát Q4"
              value={settings.auto_tag || ''}
              onChange={(e) => onUpdateSettings({ auto_tag: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
              Tự động thêm vào Tệp Khách hàng (`target_audience_id`)
            </label>
            <select
              className="form-input"
              style={{ height: 40, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
              value={settings.target_audience_id || ''}
              onChange={(e) => onUpdateSettings({ target_audience_id: e.target.value || null })}
            >
              <option value="">— Không gắn cố định —</option>
              {audiences.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
              Tiêu đề Màn hình Cảm ơn mặc định
            </label>
            <input
              className="form-input"
              style={{ height: 38, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
              value={settings.thank_you_title || ''}
              onChange={(e) => onUpdateSettings({ thank_you_title: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
              Thông điệp Cảm ơn mặc định
            </label>
            <textarea
              rows={2}
              className="form-input"
              style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}
              value={settings.thank_you_message || ''}
              onChange={(e) => onUpdateSettings({ thank_you_message: e.target.value })}
            />
          </div>
        </div>
      )}

      {subTab === 'cover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>Màu chủ đạo (Primary Sapphire)</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {SAPPHIRE_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => onUpdateTheme({ primaryColor: hex })}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: hex,
                    border: theme.primaryColor === hex ? '2.5px solid #0F172A' : '2px solid #FFFFFF',
                    boxShadow: '0 0 0 1px #CBD5E1',
                    cursor: 'pointer',
                  }}
                />
              ))}
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => onUpdateTheme({ primaryColor: e.target.value })}
                style={{ width: 34, height: 28, border: '1px solid #E2E8F0', borderRadius: 6 }}
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>Phong cách Cover Header</label>
            <select
              className="form-input"
              style={{ height: 40, background: '#FFFFFF', border: '1px solid #E2E8F0' }}
              value={theme.coverStyle}
              onChange={(e) => onUpdateTheme({ coverStyle: e.target.value as SurveyThemeDto['coverStyle'] })}
            >
              <option value="gradient">Royal Sapphire Gradient</option>
              <option value="minimal">Minimal Trắng Tinh Khiết</option>
              <option value="image">Ảnh Bìa Tùy Chỉnh</option>
            </select>
          </div>

          {theme.coverStyle === 'image' && (
            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>URL Ảnh Bìa Cover</label>
              <input
                className="form-input"
                style={{ height: 38, background: '#FFFFFF' }}
                placeholder="https://..."
                value={theme.coverImageUrl || ''}
                onChange={(e) => onUpdateTheme({ coverImageUrl: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.76rem' }}>Nhãn Huy Hiệu Trên Cover</label>
            <input
              className="form-input"
              style={{ height: 38, background: '#FFFFFF' }}
              value={theme.coverBadge || ''}
              onChange={(e) => onUpdateTheme({ coverBadge: e.target.value })}
            />
          </div>

          <div style={{ padding: '0.75rem', borderRadius: 12, background: '#F8FAFF', border: '1px solid #DBEAFE' }}>
            <label className="form-label" style={{ fontWeight: 800, fontSize: '0.75rem', color: '#1E40FF', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={13} /> Đồng Hồ Đếm Ngược Trên Cover (`coverCountdown`)
            </label>
            <input
              type="datetime-local"
              className="form-input"
              style={{ height: 38, background: '#FFFFFF', marginTop: 4, fontSize: '0.76rem' }}
              value={theme.coverCountdown ? theme.coverCountdown.slice(0, 16) : ''}
              onChange={(e) => onUpdateTheme({ coverCountdown: e.target.value })}
            />
          </div>
        </div>
      )}

      {subTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A' }}>
              Luật Điểm → Redirect & Tặng Voucher
            </span>
            <button
              type="button"
              onClick={addRule}
              className="btn secondary sm"
              style={{ height: 30, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}
            >
              <Plus size={12} /> Thêm khoảng điểm
            </button>
          </div>

          {rules.length === 0 ? (
            <div style={{ padding: '1rem', borderRadius: 12, background: '#F8F9FA', border: '1px dashed #CBD5E1', fontSize: '0.75rem', color: '#64748B', textAlign: 'center' }}>
              Chưa có luật phân tầng theo điểm Quiz. Bấm <strong>+ Thêm khoảng điểm</strong> để cấu hình chuyển hướng URL & phát mã Voucher theo dải điểm `[min, max]`.
            </div>
          ) : (
            rules.map((rule, idx) => (
              <div
                key={rule.id}
                style={{
                  padding: '0.7rem',
                  borderRadius: 12,
                  background: '#F8F9FA',
                  border: '1px solid #DBEAFE',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge tone="primary">Luật #{idx + 1}: {rule.minScore}đ → {rule.maxScore}đ</Badge>
                  <button
                    type="button"
                    onClick={() => removeRule(rule.id)}
                    style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <input
                    type="number"
                    className="form-input"
                    style={{ height: 34, background: '#FFFFFF', fontSize: '0.75rem' }}
                    placeholder="Điểm Min"
                    value={rule.minScore}
                    onChange={(e) => updateRule(rule.id, { minScore: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    className="form-input"
                    style={{ height: 34, background: '#FFFFFF', fontSize: '0.75rem' }}
                    placeholder="Điểm Max"
                    value={rule.maxScore}
                    onChange={(e) => updateRule(rule.id, { maxScore: Number(e.target.value) })}
                  />
                </div>

                <input
                  className="form-input"
                  style={{ height: 34, background: '#FFFFFF', fontSize: '0.75rem' }}
                  placeholder="Tiêu đề cảm ơn riêng cho mức điểm này..."
                  value={rule.thankYouTitle}
                  onChange={(e) => updateRule(rule.id, { thankYouTitle: e.target.value })}
                />

                <input
                  className="form-input"
                  style={{ height: 34, background: '#FFFFFF', fontSize: '0.75rem' }}
                  placeholder="URL Chuyển hướng (https://...)"
                  value={rule.redirectUrl || ''}
                  onChange={(e) => updateRule(rule.id, { redirectUrl: e.target.value })}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <input
                    className="form-input"
                    style={{ height: 34, background: '#FFFFFF', fontSize: '0.74rem' }}
                    placeholder="Tag gắn thêm..."
                    value={rule.assignTag || ''}
                    onChange={(e) => updateRule(rule.id, { assignTag: e.target.value })}
                  />
                  <select
                    className="form-input"
                    style={{ height: 34, background: '#FFFFFF', fontSize: '0.73rem' }}
                    value={rule.voucherCampaignId || ''}
                    onChange={(e) => updateRule(rule.id, { voucherCampaignId: e.target.value })}
                  >
                    <option value="">— Không tặng Voucher —</option>
                    {voucherCampaigns.map((vc) => (
                      <option key={vc.id} value={vc.id}>{vc.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SurveyPropertiesSettingsTab;
