import React from 'react';
import {
  CheckCircle2,
  Mail,
  MessageCircle,
  Monitor,
  Send,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { Badge, Card, FormCard } from '../../components/ui/AutoDataLoadingModal';
import { formatVnd } from '../../../autodataApi';
import { VariableFallbackConfig } from './VariableFallbackConfig';
import {
  STANDARD_MERGE_TAGS,
  type CampaignChannel,
  type CampaignWizardDraft,
  type EmailTemplateOptionDto,
  type WinnerCriteria,
} from './campaignTypes';

export const CampaignWizardStep2: React.FC<{
  draft: CampaignWizardDraft;
  activeTemplateHtml: string;
  patchDraft: (patch: Partial<CampaignWizardDraft>) => void;
}> = ({ draft, activeTemplateHtml, patchDraft }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <Card padding="1rem 1.2rem" title="Tên Chiến Dịch & Kênh Truyền Thông Vault">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Tên chiến dịch *</label>
          <input
            className="form-input"
            style={{ height: 44 }}
            placeholder="VD: Chiến dịch Ra mắt Sản phẩm Q4..."
            value={draft.name}
            onChange={(e) => patchDraft({ name: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Ngân sách kênh dự kiến (VNĐ)</label>
          <input
            type="number"
            min={0}
            className="form-input"
            style={{ height: 44 }}
            value={draft.cost_vnd}
            onChange={(e) => patchDraft({ cost_vnd: Number(e.target.value || 0) })}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {(
          [
            { key: 'email', title: 'Email (AWS SES / SMTP)', icon: <Mail size={16} /> },
            { key: 'zns', title: 'Zalo ZNS Official', icon: <MessageCircle size={16} /> },
            { key: 'multi', title: 'Đa Kênh (Email + ZNS)', icon: <Send size={16} /> },
          ] as Array<{ key: CampaignChannel; title: string; icon: React.ReactNode }>
        ).map((ch) => (
          <FormCard
            key={ch.key}
            selected={draft.channel === ch.key}
            onClick={() => patchDraft({ channel: ch.key })}
            icon={ch.icon}
            title={ch.title}
          />
        ))}
      </div>
    </Card>

    <Card padding="1rem 1.2rem" title="Tiêu Đề & Thử Nghiệm Phân Tách A/B Testing">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Tiêu đề Nhánh A (Subject A) *</label>
          <input
            className="form-input"
            style={{ height: 42 }}
            value={draft.subject_a}
            onChange={(e) => patchDraft({ subject_a: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Tiêu đề Nhánh B (Tùy chọn A/B Test)</label>
          <input
            className="form-input"
            style={{ height: 42 }}
            placeholder="Nhập tiêu đề đối chứng B để bật A/B Split..."
            value={draft.subject_b}
            onChange={(e) => patchDraft({ subject_b: e.target.value })}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {STANDARD_MERGE_TAGS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => patchDraft({ subject_a: `${draft.subject_a} ${m.tag}`.trim() })}
            style={{
              padding: '3px 9px',
              borderRadius: 999,
              border: '1px solid #DBEAFE',
              background: '#F8FAFF',
              color: '#1E40FF',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + {m.tag}
          </button>
        ))}
      </div>

      {draft.subject_b.trim() && (
        <div
          style={{
            marginTop: 12,
            padding: '0.85rem 1rem',
            borderRadius: 12,
            background: '#F8F9FA',
            border: '1px solid #E2E8F0',
            display: 'grid',
            gridTemplateColumns: '1.3fr 1fr 0.7fr',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
              Tỉ lệ A/B: {draft.ab_split_ratio}% A / {100 - draft.ab_split_ratio}% B
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={draft.ab_split_ratio}
              onChange={(e) => patchDraft({ ab_split_ratio: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#1E40FF', marginTop: 6 }}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700 }}>Tiêu chí chọn Winner</label>
            <select
              className="form-input"
              style={{ height: 38, background: '#FFFFFF' }}
              value={draft.winner_criteria}
              onChange={(e) => patchDraft({ winner_criteria: e.target.value as WinnerCriteria })}
            >
              <option value="open_rate">Tỉ lệ Mở cao nhất (open_rate)</option>
              <option value="click_rate">Tỉ lệ Click cao nhất (click_rate)</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700 }}>Giờ đo lường</label>
            <input
              type="number"
              min={1}
              max={72}
              className="form-input"
              style={{ height: 38, background: '#FFFFFF' }}
              value={draft.ab_test_hours}
              onChange={(e) => patchDraft({ ab_test_hours: Math.max(1, Number(e.target.value || 4)) })}
            />
          </div>
        </div>
      )}
    </Card>

    <VariableFallbackConfig
      subjectA={draft.subject_a}
      subjectB={draft.subject_b}
      templateHtml={activeTemplateHtml}
      fallbacks={draft.fallback_vars}
      onChange={(next) => patchDraft({ fallback_vars: next })}
    />
  </div>
);

export const CampaignWizardStep3: React.FC<{
  draft: CampaignWizardDraft;
  templates: EmailTemplateOptionDto[];
  activeTemplateHtml: string;
  previewDevice: 'desktop' | 'mobile';
  onChangeDevice: (mode: 'desktop' | 'mobile') => void;
  patchDraft: (patch: Partial<CampaignWizardDraft>) => void;
}> = ({ draft, templates, activeTemplateHtml, previewDevice, onChangeDevice, patchDraft }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 14 }}>
    <Card title="Cấu Hình Người Gửi & Chọn Mẫu Nội Dung" padding="1rem 1.15rem">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Tên hiển thị Người gửi</label>
            <input
              className="form-input"
              style={{ height: 42 }}
              value={draft.sender_name}
              onChange={(e) => patchDraft({ sender_name: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Email gửi đi (SES Verified)</label>
            <input
              className="form-input"
              style={{ height: 42 }}
              placeholder="noreply@yourdomain.vn"
              value={draft.sender_email}
              onChange={(e) => patchDraft({ sender_email: e.target.value })}
            />
          </div>
        </div>

        {(draft.channel === 'zns' || draft.channel === 'multi') && (
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>Mã Mẫu Zalo ZNS (Template ID đã duyệt)</label>
            <input
              className="form-input"
              style={{ height: 42 }}
              placeholder="VD: ZNS_ORDER_CONFIRM_28991"
              value={draft.zns_template_id}
              onChange={(e) => patchDraft({ zns_template_id: e.target.value })}
            />
          </div>
        )}

        <div>
          <label className="form-label" style={{ fontWeight: 700 }}>Chọn Mẫu Email (`mkt_email_templates`)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 230, overflowY: 'auto' }}>
            {templates.map((tpl) => {
              const chosen = draft.template_id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => patchDraft({ template_id: tpl.id })}
                  style={{
                    padding: '0.7rem 0.9rem',
                    borderRadius: 12,
                    border: chosen ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                    background: chosen ? '#F8FAFF' : '#FFFFFF',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.83rem', color: '#0F172A' }}>{tpl.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{tpl.subject}</div>
                  </div>
                  {chosen && <CheckCircle2 size={16} color="#1E40FF" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>

    <Card
      title="Xem Trước Giao Diện (Desktop / Mobile)"
      actions={
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={() => onChangeDevice('desktop')}
            className="btn secondary sm"
            style={{ height: 32, color: previewDevice === 'desktop' ? '#1E40FF' : '#64748B' }}
          >
            <Monitor size={14} /> Desktop
          </button>
          <button
            type="button"
            onClick={() => onChangeDevice('mobile')}
            className="btn secondary sm"
            style={{ height: 32, color: previewDevice === 'mobile' ? '#1E40FF' : '#64748B' }}
          >
            <Smartphone size={14} /> Mobile
          </button>
        </div>
      }
      padding="1rem"
    >
      <div style={{ display: 'flex', justifyContent: 'center', background: '#F1F5F9', padding: 12, borderRadius: 14 }}>
        <iframe
          title="wizard-template-preview"
          sandbox=""
          srcDoc={
            activeTemplateHtml ||
            `<div style="font-family:Inter,sans-serif;padding:28px;color:#0F172A"><h3>${draft.subject_a}</h3><p>Chọn một mẫu từ thư viện bên trái để xem bản kết xuất HTML đầy đủ.</p></div>`
          }
          style={{ width: previewDevice === 'mobile' ? 340 : '100%', height: 300, border: '1px solid #E2E8F0', borderRadius: 12, background: '#FFFFFF' }}
        />
      </div>
    </Card>
  </div>
);

export const CampaignWizardStep5: React.FC<{
  draft: CampaignWizardDraft;
  saving: boolean;
  onOpenTest: () => void;
  onOpenPreSend: () => void;
}> = ({ draft, saving, onOpenTest, onOpenPreSend }) => (
  <Card
    title="Tổng Kết Cấu Hình & Sẵn Sàng Phát Hành Nguyên Tử (Atomic Claim)"
    subtitle="Kiểm tra toàn diện SPF/DKIM, Spam Score, Link và gửi thử trước khi phát hành chính thức"
    padding="1.15rem 1.25rem"
  >
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
      <div style={{ padding: '0.85rem', borderRadius: 12, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '0.73rem', color: '#64748B', fontWeight: 700 }}>Chiến dịch & Kênh</div>
        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', marginTop: 3 }}>{draft.name || '(Chưa đặt tên)'}</div>
        <Badge tone="primary" style={{ marginTop: 6 }}>{draft.channel.toUpperCase()}</Badge>
      </div>
      <div style={{ padding: '0.85rem', borderRadius: 12, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '0.73rem', color: '#64748B', fontWeight: 700 }}>A/B Split & Nhịp gửi</div>
        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1E40FF', marginTop: 3 }}>
          {draft.subject_b.trim() ? `${draft.ab_split_ratio}/${100 - draft.ab_split_ratio}% (${draft.winner_criteria})` : '100% Nhánh A'}
        </div>
        <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: 4 }}>
          Throttle: {draft.throttle_per_minute}/phút • {draft.reminders.length} bước nhắc
        </div>
      </div>
      <div style={{ padding: '0.85rem', borderRadius: 12, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '0.73rem', color: '#64748B', fontWeight: 700 }}>Ngân sách & Lịch chạy</div>
        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#059669', marginTop: 3 }}>{formatVnd(draft.cost_vnd)}</div>
        <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: 4 }}>
          {draft.schedule_mode === 'scheduled' && draft.scheduled_at ? `Hẹn lịch: ${draft.scheduled_at}` : 'Phát hành tức thì'}
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      <button type="button" onClick={onOpenTest} className="btn secondary" style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
        <Mail size={15} /> Gửi Bản Thử (Test Email)
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={onOpenPreSend}
        style={{ height: 44, padding: '0 1.35rem', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
      >
        <ShieldCheck size={16} /> Mở Pre-Send Checklist & Phát Hành Atomic
      </button>
    </div>
  </Card>
);
