import React, { useState } from 'react';
import { Palette, MessageSquareText, Terminal, Eye } from 'lucide-react';
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  renderClientTemplate,
  type NotificationTemplatesConfig,
  type TenantSettingsDto,
} from '../../utils/pipelineConfig';

interface Props {
  settings: TenantSettingsDto;
  updateSetting: <K extends keyof TenantSettingsDto>(key: K, val: TenantSettingsDto[K]) => void;
  companyName?: string;
  t: (s: string) => string;
}

const TEMPLATE_VARIABLES = [
  '{{brand_name}}',
  '{{customer_name}}',
  '{{phone}}',
  '{{source}}',
  '{{campaign}}',
  '{{round_name}}',
  '{{sale_name}}',
  '{{sla_minutes}}',
  '{{lead_id}}',
  '{{lead_short_id}}',
  '{{accept_cmd}}',
  '{{custom_fields.budget_vnd}}',
];

const TEMPLATE_META: Array<{ key: keyof NotificationTemplatesConfig; label: string; rows?: number }> = [
  { key: 'assign_email_subject', label: 'Tiêu đề Email Giao Lead', rows: 1 },
  { key: 'assign_email_body', label: 'Nội dung Email Giao Lead', rows: 2 },
  { key: 'assign_bot_message', label: 'Tin nhắn Bot Telegram / Zalo Giao Lead', rows: 5 },
  { key: 'sla_warning_message', label: 'Tin nhắn Cảnh báo SLA quá hạn', rows: 2 },
  { key: 'ticket_admin_subject', label: 'Tiêu đề Email Ticket mới gửi Admin', rows: 1 },
  { key: 'ticket_approved_subject', label: 'Tiêu đề Email Duyệt Ticket (Sale)', rows: 1 },
  { key: 'ticket_rejected_subject', label: 'Tiêu đề Email Từ chối Ticket (Sale)', rows: 1 },
  { key: 'bot_chatid_reply', label: 'Câu trả lời Bot cho lệnh /chatid', rows: 1 },
  { key: 'bot_help_reply', label: 'Câu trả lời Bot khi sai lệnh / Hướng dẫn', rows: 1 },
  { key: 'daily_report_subject', label: 'Tiêu đề Email Báo cáo hiệu suất ngày', rows: 1 },
];

export const SettingsCommunicationsSections: React.FC<Props> = ({
  settings,
  updateSetting,
  companyName,
  t,
}) => {
  const [focusedTpl, setFocusedTpl] = useState<keyof NotificationTemplatesConfig>('assign_bot_message');

  const templates: NotificationTemplatesConfig = {
    ...DEFAULT_NOTIFICATION_TEMPLATES,
    ...(settings.notification_templates || {}),
  };

  const updateTemplate = (key: keyof NotificationTemplatesConfig, val: string) => {
    updateSetting('notification_templates', {
      ...templates,
      [key]: val,
    });
  };

  const insertVariable = (variable: string) => {
    const cur = templates[focusedTpl] || '';
    updateTemplate(focusedTpl, cur ? `${cur} ${variable}` : variable);
  };

  const brandPreviewName =
    String(settings.brand_display_name || '').trim() || companyName || 'DOMATION AutoData';
  const accentColor = settings.brand_email_accent_color || '#1E40FF';

  const renderedPreview = renderClientTemplate(templates[focusedTpl] || '', {
    brand_name: brandPreviewName,
    customer_name: 'Nguyễn Minh Quân',
    phone: '0918 777 888',
    source: 'Facebook Lead Ads',
    campaign: 'Chiến dịch Q4',
    round_name: 'Vòng ưu tiên HCM',
    sale_name: 'Lan Anh (Sale)',
    sla_minutes: settings.default_sla_minutes ?? 15,
    lead_id: '#a1b2c3d4',
    lead_short_id: 'a1b2c3d4',
    accept_cmd: settings.telegram_accept_command || settings.zalo_accept_command || '/tiepnhan',
    report_cmd: settings.telegram_report_command || settings.zalo_report_command || '/baoloi',
    chat_id: '-100889900',
    report_date: 'Hôm nay',
    'custom_fields.budget_vnd': '3.5 Tỷ',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
      {/* 1. White-Label Brand Identity */}
      <div data-tour="settings-comm-whitelabel" className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', background: '#1E40FF', color: 'white', padding: 4, borderRadius: 6 }}>
            <Palette size={16} />
          </span>
          {t('Thương Hiệu White-Label (Email & Thông Báo)')}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
          {t('Loại bỏ tên/màu cứng — toàn bộ Email gửi Sale, Modal xem trước & Footer dùng đúng tên và nhận diện doanh nghiệp của bạn.')}
        </p>

        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">{t('Tên thương hiệu hiển thị (Brand Display Name)')}</label>
            <input
              className="form-input"
              placeholder={companyName || 'VD: Novaland Elite CRM'}
              value={settings.brand_display_name ?? ''}
              onChange={(e) => updateSetting('brand_display_name', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">{t('Email Hỗ trợ / Reply-To (Support Email)')}</label>
            <input
              type="email"
              className="form-input"
              placeholder="support@yourcompany.vn"
              value={settings.support_email ?? ''}
              onChange={(e) => updateSetting('support_email', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">{t('URL Logo Thương hiệu (HTTPS hoặc /imgs/...)')}</label>
            <input
              className="form-input"
              placeholder="/imgs/autodata/domation_ai_icon.svg"
              value={settings.brand_logo_url ?? '/imgs/autodata/domation_ai_icon.svg'}
              onChange={(e) => updateSetting('brand_logo_url', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">{t('Chân trang Email (Email Footer Text)')}</label>
            <input
              className="form-input"
              value={settings.brand_email_footer_text ?? 'Hệ thống phân phối Lead tự động'}
              onChange={(e) => updateSetting('brand_email_footer_text', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">{t('Màu nhấn Email (Email Accent Hex)')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="color"
                value={settings.brand_email_accent_color || '#1E40FF'}
                onChange={(e) => updateSetting('brand_email_accent_color', e.target.value)}
                style={{ width: 42, height: 38, borderRadius: 8, border: '1px solid var(--color-border)', padding: 0, cursor: 'pointer' }}
              />
              <input
                className="form-input"
                value={settings.brand_email_accent_color || '#1E40FF'}
                onChange={(e) => updateSetting('brand_email_accent_color', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="form-label">{t('Màu chủ đạo Workspace (Primary Hex)')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="color"
                value={settings.brand_primary_color || '#1E40FF'}
                onChange={(e) => updateSetting('brand_primary_color', e.target.value)}
                style={{ width: 42, height: 38, borderRadius: 8, border: '1px solid var(--color-border)', padding: 0, cursor: 'pointer' }}
              />
              <input
                className="form-input"
                value={settings.brand_primary_color || '#1E40FF'}
                onChange={(e) => updateSetting('brand_primary_color', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Mini live banner preview */}
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <div style={{ background: `linear-gradient(135deg, ${accentColor}, #0f172a)`, color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src={settings.brand_logo_url || '/imgs/autodata/domation_ai_icon.svg'}
                alt="Brand"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', background: '#fff' }}
              />
              <strong style={{ letterSpacing: '0.04em', fontSize: '0.9rem' }}>{brandPreviewName.toUpperCase()}</strong>
            </div>
            <span style={{ fontSize: '0.72rem', opacity: 0.9 }}>{settings.brand_email_footer_text || 'Hệ thống phân phối Lead tự động'}</span>
          </div>
        </div>
      </div>

      {/* 2. Dynamic Notification Templates Editor */}
      <div data-tour="settings-comm-templates" className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', background: '#7c3aed', color: 'white', padding: 4, borderRadius: 6 }}>
            <MessageSquareText size={16} />
          </span>
          {t('Trình Soạn Thảo Mẫu Tin Nhắn & Email Tự Động')}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          {t('Bấm vào bất kỳ ô mẫu nào bên dưới rồi click các thẻ biến để chèn tự động (hỗ trợ cả Custom Fields của Lead dạng {{custom_fields.ten_truong}}).')}
        </p>

        {/* Variable chips picker */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1rem', padding: '10px', borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertVariable(v)}
              style={{
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid rgba(30, 64, 255, 0.28)',
                background: 'rgba(30, 64, 255, 0.08)',
                color: '#1E40FF',
                cursor: 'pointer',
              }}
            >
              + {v}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {TEMPLATE_META.map((item) => (
            <div key={item.key}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t(item.label)}</span>
                {focusedTpl === item.key && (
                  <span style={{ fontSize: '0.7rem', color: '#1E40FF', fontWeight: 700 }}>{t('Đang chọn xem trước')}</span>
                )}
              </label>
              {(item.rows || 1) > 1 ? (
                <textarea
                  rows={item.rows}
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem', minHeight: 72 }}
                  value={templates[item.key] || ''}
                  onFocus={() => setFocusedTpl(item.key)}
                  onChange={(e) => updateTemplate(item.key, e.target.value)}
                />
              ) : (
                <input
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                  value={templates[item.key] || ''}
                  onFocus={() => setFocusedTpl(item.key)}
                  onChange={(e) => updateTemplate(item.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Live Rendered Output Preview */}
        <div style={{ marginTop: '1rem', padding: '12px 14px', borderRadius: 10, background: 'var(--color-bg)', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Eye size={14} /> {t('Xem trước kết quả hiển thị thực tế')}:
          </div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: 'var(--color-text)', fontFamily: 'inherit', lineHeight: 1.5 }}>
            {renderedPreview}
          </pre>
        </div>
      </div>

      {/* 3. Interactive Bot Commands & Rate Limit */}
      <div data-tour="settings-comm-commands" className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', background: '#059669', color: 'white', padding: 4, borderRadius: 6 }}>
            <Terminal size={16} />
          </span>
          {t('Tùy Chỉnh Cú Pháp Lệnh Bot Zalo / Telegram')}
        </h3>
        <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <label className="form-label">{t('Zalo: Lệnh Tiếp nhận Lead')}</label>
            <input className="form-input" value={settings.zalo_accept_command ?? '/tiepnhan'} onChange={(e) => updateSetting('zalo_accept_command', e.target.value)} />
          </div>
          <div>
            <label className="form-label">{t('Zalo: Lệnh Báo lỗi Lead')}</label>
            <input className="form-input" value={settings.zalo_report_command ?? '/baoloi'} onChange={(e) => updateSetting('zalo_report_command', e.target.value)} />
          </div>
          <div>
            <label className="form-label">{t('Zalo: Lệnh Duyệt Ticket')}</label>
            <input className="form-input" value={settings.zalo_approve_command ?? '/duyet'} onChange={(e) => updateSetting('zalo_approve_command', e.target.value)} />
          </div>
          <div>
            <label className="form-label">{t('Zalo: Lệnh Từ chối Ticket')}</label>
            <input className="form-input" value={settings.zalo_reject_command ?? '/tuchoi'} onChange={(e) => updateSetting('zalo_reject_command', e.target.value)} />
          </div>
          <div>
            <label className="form-label">{t('Telegram: Lệnh Tiếp nhận')}</label>
            <input className="form-input" value={settings.telegram_accept_command ?? '/tiepnhan'} onChange={(e) => updateSetting('telegram_accept_command', e.target.value)} />
          </div>
          <div>
            <label className="form-label">{t('Telegram: Lệnh Báo lỗi')}</label>
            <input className="form-input" value={settings.telegram_report_command ?? '/baoloi'} onChange={(e) => updateSetting('telegram_report_command', e.target.value)} />
          </div>
          <div>
            <label className="form-label">{t('Giới hạn Rate Limit Zalo OA (tin/giây)')}</label>
            <input
              type="number"
              min={1}
              max={100}
              className="form-input"
              value={settings.zalo_rate_limit_per_sec ?? 5}
              onChange={(e) => updateSetting('zalo_rate_limit_per_sec', Math.max(1, Math.min(100, Number(e.target.value) || 5)))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
