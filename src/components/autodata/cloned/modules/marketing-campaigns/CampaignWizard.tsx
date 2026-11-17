import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { AudienceSelector } from './AudienceSelector';
import { CampaignWizardStep2, CampaignWizardStep3, CampaignWizardStep5 } from './CampaignWizardSteps';
import { ReminderManager } from './ReminderManager';
import { TestEmailModal } from './TestEmailModal';
import { PreSendReviewModal } from './PreSendReviewModal';
import type {
  AudienceOptionDto,
  CampaignRowDto,
  CampaignWizardDraft,
  EmailTemplateOptionDto,
} from './campaignTypes';

export interface CampaignWizardProps {
  isOpen: boolean;
  onClose: () => void;
  editingCampaign: CampaignRowDto | null;
  audiences: AudienceOptionDto[];
  templates: EmailTemplateOptionDto[];
  suppressionCount: number;
  customerLabel: string;
  onSaved: () => Promise<void>;
}

const WIZARD_STEPS = [
  { step: 1, title: '1. Tệp Đích & Loại Trừ' },
  { step: 2, title: '2. Kênh, A/B & Fallback' },
  { step: 3, title: '3. Mẫu Tin & Người Gửi' },
  { step: 4, title: '4. Nhắc Lại & Nhịp Gửi' },
  { step: 5, title: '5. Kiểm Duyệt & Phát Hành' },
] as const;

export const CampaignWizard: React.FC<CampaignWizardProps> = ({
  isOpen,
  onClose,
  editingCampaign,
  audiences,
  templates,
  suppressionCount,
  customerLabel,
  onSaved,
}) => {
  const { token, tenantSlug, companyName, user } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [draft, setDraft] = useState<CampaignWizardDraft>(() => ({
    id: editingCampaign?.id,
    name: editingCampaign?.name || '',
    channel: editingCampaign?.channel || 'email',
    audience_id: editingCampaign?.audience_id || '',
    exclude_audience_ids: editingCampaign?.exclude_audience_ids || [],
    subject_a: editingCampaign?.subject_a || 'Ưu đãi chiến lược dành riêng cho {{lead.name}}',
    subject_b: editingCampaign?.subject_b || '',
    ab_split_ratio: editingCampaign?.ab_split_ratio ?? 50,
    winner_criteria: editingCampaign?.winner_criteria || 'open_rate',
    ab_test_hours: editingCampaign?.ab_test_hours ?? 4,
    fallback_vars: editingCampaign?.fallback_vars || { 'lead.name': 'Quý khách', 'lead.company': 'Quý đối tác' },
    template_id: editingCampaign?.template_id || '',
    zns_template_id: editingCampaign?.zns_template_id || '',
    sender_name: editingCampaign?.sender_name || companyName || 'DOMATION Growth',
    sender_email: editingCampaign?.sender_email || user?.email || '',
    reminders: [],
    throttle_per_minute: editingCampaign?.throttle_per_minute ?? 250,
    schedule_mode: editingCampaign?.scheduled_at ? 'scheduled' : 'now',
    scheduled_at: editingCampaign?.scheduled_at ? String(editingCampaign.scheduled_at).slice(0, 16) : '',
    cost_vnd: editingCampaign?.cost_vnd ?? 500000,
  }));

  const [templateHtmlMap, setTemplateHtmlMap] = useState<Record<string, string>>({});
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === draft.template_id) || null,
    [templates, draft.template_id]
  );

  useEffect(() => {
    if (!isOpen || !draft.template_id || templateHtmlMap[draft.template_id] || selectedTemplate?.compiled_html) return;
    let cancelled = false;
    apiRequest<{ compiled_html?: string; template?: { compiled_html?: string } }>(
      `/marketing/templates/${draft.template_id}`,
      { token, tenantSlug }
    )
      .then((res) => {
        if (cancelled) return;
        const html = res?.compiled_html || res?.template?.compiled_html || '';
        if (html) setTemplateHtmlMap((prev) => ({ ...prev, [draft.template_id]: html }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, draft.template_id, selectedTemplate?.compiled_html, templateHtmlMap, token, tenantSlug]);

  const activeTemplateHtml =
    selectedTemplate?.compiled_html || (draft.template_id ? templateHtmlMap[draft.template_id] || '' : '');

  const patchDraft = (patch: Partial<CampaignWizardDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const persistCampaign = useCallback(async (): Promise<string | null> => {
    if (!draft.name.trim()) {
      toast.error('Vui lòng nhập Tên Chiến Dịch ở Bước 2.');
      setStep(2);
      return null;
    }
    setSaving(true);
    try {
      const firstReminder = draft.reminders[0];
      const payload = {
        name: draft.name.trim(),
        channel: draft.channel,
        audience_id: draft.audience_id || null,
        exclude_audience_ids: draft.exclude_audience_ids,
        template_id: draft.template_id || null,
        subject_a: draft.subject_a.trim(),
        subject_b: draft.subject_b.trim(),
        ab_split_ratio: draft.subject_b.trim() ? draft.ab_split_ratio : 100,
        winner_criteria: draft.winner_criteria,
        ab_test_hours: draft.ab_test_hours,
        zns_template_id: draft.zns_template_id.trim() || null,
        sender_name: draft.sender_name.trim() || null,
        sender_email: draft.sender_email.trim() || null,
        fallback_vars: draft.fallback_vars,
        throttle_per_minute: draft.throttle_per_minute,
        scheduled_at: draft.schedule_mode === 'scheduled' && draft.scheduled_at ? draft.scheduled_at : null,
        cost_vnd: Math.max(0, Number(draft.cost_vnd || 0)),
        reminder_config: {
          enabled: draft.reminders.length > 0,
          trigger_condition: firstReminder?.condition || 'no_open',
          wait_hours: firstReminder?.wait_hours || 24,
          reminder_subject: firstReminder?.subject || '',
          steps: draft.reminders,
        },
      };

      let savedId = draft.id;
      if (savedId) {
        await apiRequest(`/marketing/campaigns/${savedId}`, { method: 'PUT', token, tenantSlug, body: payload });
      } else {
        const created = await apiRequest<CampaignRowDto>('/marketing/campaigns', {
          method: 'POST',
          token,
          tenantSlug,
          body: payload,
        });
        savedId = created.id;
        setDraft((prev) => ({ ...prev, id: created.id }));
      }

      if (savedId && draft.reminders.length > 0) {
        for (const rem of draft.reminders) {
          await apiRequest(`/marketing/campaigns/${savedId}/reminders`, {
            method: 'POST',
            token,
            tenantSlug,
            body: {
              condition: rem.condition,
              wait_hours: rem.wait_hours,
              subject: rem.subject,
              template_id: rem.template_id,
              step_order: rem.step_order,
            },
          }).catch(() => {});
        }
      }
      return savedId || null;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu cấu hình Chiến dịch.'));
      return null;
    } finally {
      setSaving(false);
    }
  }, [draft, token, tenantSlug]);

  const handleSaveDraftClick = async () => {
    const id = await persistCampaign();
    if (!id) return;
    toast.success('Đã lưu Chiến dịch thành công!');
    await onSaved();
    onClose();
  };

  const handleOpenPreSend = async () => {
    const id = await persistCampaign();
    if (!id) return;
    setReviewOpen(true);
  };

  const handleConfirmAtomicLaunch = async () => {
    setLaunching(true);
    try {
      const id = draft.id || (await persistCampaign());
      if (!id) return;
      const res = await apiRequest<{ newly_sent: number; duplicate_claims_prevented: number }>(
        `/marketing/campaigns/${id}/send`,
        { method: 'POST', token, tenantSlug }
      );
      toast.success(
        `Phát hành hoàn tất: Đã gửi ${res.newly_sent} người, khóa Atomic chặn trùng ${res.duplicate_claims_prevented} lượt!`
      );
      setReviewOpen(false);
      await onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể phát hành Chiến dịch.'));
    } finally {
      setLaunching(false);
    }
  };

  return (
    <>
      <CustomModal
        isOpen={isOpen}
        onClose={onClose}
        title={editingCampaign ? `Chỉnh Sửa Chiến Dịch: ${editingCampaign.name}` : 'Trình Thuật Sĩ 5 Bước Khởi Tạo Chiến Dịch Đa Kênh'}
        width={960}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
            {WIZARD_STEPS.map((item) => {
              const active = step === item.step;
              const done = step > item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setStep(item.step)}
                  style={{
                    padding: '0.65rem 0.7rem',
                    borderRadius: 12,
                    border: active ? '1.5px solid #1E40FF' : done ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                    background: active ? '#1E40FF' : done ? '#EFF6FF' : '#F8F9FA',
                    color: active ? '#FFFFFF' : done ? '#1E40FF' : '#475569',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {item.title}
                </button>
              );
            })}
          </div>

          {step === 1 && (
            <AudienceSelector
              audiences={audiences}
              selectedAudienceId={draft.audience_id}
              excludeAudienceIds={draft.exclude_audience_ids}
              suppressionCount={suppressionCount}
              customerLabel={customerLabel}
              onSelectAudience={(id) => patchDraft({ audience_id: id })}
              onChangeExclusions={(ids) => patchDraft({ exclude_audience_ids: ids })}
            />
          )}

          {step === 2 && (
            <CampaignWizardStep2
              draft={draft}
              activeTemplateHtml={activeTemplateHtml}
              patchDraft={patchDraft}
            />
          )}

          {step === 3 && (
            <CampaignWizardStep3
              draft={draft}
              templates={templates}
              activeTemplateHtml={activeTemplateHtml}
              previewDevice={previewDevice}
              onChangeDevice={setPreviewDevice}
              patchDraft={patchDraft}
            />
          )}

          {step === 4 && (
            <ReminderManager
              reminders={draft.reminders}
              templates={templates}
              mainSubject={draft.subject_a}
              throttlePerMinute={draft.throttle_per_minute}
              scheduleMode={draft.schedule_mode}
              scheduledAt={draft.scheduled_at}
              onChangeReminders={(next) => patchDraft({ reminders: next })}
              onChangeThrottle={(rate) => patchDraft({ throttle_per_minute: rate })}
              onChangeScheduleMode={(mode) => patchDraft({ schedule_mode: mode })}
              onChangeScheduledAt={(iso) => patchDraft({ scheduled_at: iso })}
            />
          )}

          {step === 5 && (
            <CampaignWizardStep5
              draft={draft}
              saving={saving}
              onOpenTest={() => setTestOpen(true)}
              onOpenPreSend={() => void handleOpenPreSend()}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="btn secondary"
              style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <ChevronLeft size={15} /> Quay lại
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveDraftClick()}
                className="btn secondary"
                style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700 }}
              >
                <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu Chiến Dịch'}
              </button>
              {step < 5 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(5, s + 1))}
                  style={{
                    height: 44,
                    padding: '0 1.2rem',
                    borderRadius: 12,
                    border: 'none',
                    background: '#1E40FF',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                  }}
                >
                  Bước tiếp theo <ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </CustomModal>

      <TestEmailModal
        isOpen={testOpen}
        onClose={() => setTestOpen(false)}
        campaignId={draft.id}
        campaignName={draft.name || 'Chiến dịch mới'}
        channel={draft.channel}
        subjectA={draft.subject_a}
        subjectB={draft.subject_b}
        templateId={draft.template_id}
        senderName={draft.sender_name}
        senderEmail={draft.sender_email}
        fallbacks={draft.fallback_vars}
      />

      <PreSendReviewModal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        draft={draft}
        templateHtml={activeTemplateHtml}
        launching={launching}
        onOpenTestEmail={() => setTestOpen(true)}
        onConfirmAtomicLaunch={handleConfirmAtomicLaunch}
      />
    </>
  );
};

export default CampaignWizard;
