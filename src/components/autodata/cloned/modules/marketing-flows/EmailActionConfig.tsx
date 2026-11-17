import React, { useMemo, useState } from 'react';
import { Eye, Mail } from 'lucide-react';
import { EmailPreviewDrawer } from './EmailPreviewDrawer';
import type { EmailTemplateItemDto } from './flowConstants';

export interface EmailActionConfigProps {
  config: Record<string, unknown>;
  templates: EmailTemplateItemDto[];
  onChange: (nextConfig: Record<string, unknown>) => void;
}

const MERGE_CHIPS = ['{{lead.name}}', '{{lead.company}}', '{{lead.product_interest}}', '{{tenant.name}}'];

export const EmailActionConfig: React.FC<EmailActionConfigProps> = ({
  config,
  templates,
  onChange,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  const templateId = String(config.template_id || '');
  const subject = String(config.subject || 'Tài liệu chuyên sâu dành cho {{lead.name}}');
  const senderName = String(config.sender_name || '');
  const replyTo = String(config.reply_to || '');
  const trackClicks = Boolean(config.track_clicks ?? true);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) || null,
    [templates, templateId]
  );

  const patch = (next: Record<string, unknown>) => {
    onChange({ ...config, ...next });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
            <Mail size={13} style={{ display: 'inline', marginRight: 4 }} /> Mẫu Email (`mkt_email_templates`)
          </label>
          {selectedTemplate && (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              style={{
                border: 'none',
                background: '#EEF2FF',
                color: '#1E40FF',
                borderRadius: 8,
                padding: '3px 9px',
                fontSize: '0.72rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <Eye size={12} /> Xem trước Desktop/Mobile
            </button>
          )}
        </div>

        <select
          className="form-input"
          style={{ height: 42 }}
          value={templateId}
          onChange={(e) => {
            const found = templates.find((t) => t.id === e.target.value);
            patch({
              template_id: e.target.value,
              subject: found?.subject || subject,
            });
          }}
        >
          <option value="">— Chọn mẫu Email thiết kế —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label" style={{ fontWeight: 700 }}>Tiêu đề Email cá nhân hóa</label>
        <input
          className="form-input"
          style={{ height: 42 }}
          value={subject}
          onChange={(e) => patch({ subject: e.target.value })}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
          {MERGE_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => patch({ subject: `${subject} ${chip}`.trim() })}
              style={{
                padding: '2px 8px',
                borderRadius: 999,
                border: '1px solid #DBEAFE',
                background: '#F8FAFF',
                color: '#1E40FF',
                fontSize: '0.69rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + {chip}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Tên người gửi (Tùy chọn)</label>
          <input
            className="form-input"
            style={{ height: 38 }}
            placeholder="Mặc định theo Vault"
            value={senderName}
            onChange={(e) => patch({ sender_name: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Email nhận phản hồi (Reply-To)</label>
          <input
            className="form-input"
            style={{ height: 38 }}
            placeholder="support@company.vn"
            value={replyTo}
            onChange={(e) => patch({ reply_to: e.target.value })}
          />
        </div>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.76rem',
          fontWeight: 700,
          color: '#334155',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={trackClicks}
          onChange={(e) => patch({ track_clicks: e.target.checked })}
          style={{ accentColor: '#1E40FF' }}
        />
        Theo dõi mở thư (Open Pixel) & gắn UTM Click tự động
      </label>

      <EmailPreviewDrawer
        key={selectedTemplate?.id || 'empty'}
        template={selectedTemplate}
        customSubject={subject}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
};

export default EmailActionConfig;
