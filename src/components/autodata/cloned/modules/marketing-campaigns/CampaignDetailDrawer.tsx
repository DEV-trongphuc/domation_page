import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BarChart3,
  BellRing,
  Check,
  Edit2,
  Laptop,
  Mail,
  MousePointerClick,
  RefreshCw,
  Send,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { DrawerSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  CampaignClickMapTab,
  CampaignFunnelAbTab,
  CampaignRecipientLogsTab,
} from './CampaignDetailTabs';
import {
  CampaignRemindersTab,
  CampaignTechRoiTab,
} from './CampaignDetailRoiRemindersTab';
import { TestEmailModal } from './TestEmailModal';
import type {
  CampaignDetailResponse,
  CampaignReminderStepDto,
  CampaignRowDto,
  ReminderCondition,
} from './campaignTypes';

export interface CampaignDetailDrawerProps {
  campaign: CampaignRowDto | null;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}

type DetailTabKey = 'funnel' | 'click_map' | 'claims' | 'reminders' | 'tech_roi';

export const CampaignDetailDrawer: React.FC<CampaignDetailDrawerProps> = ({
  campaign,
  isOpen,
  onClose,
  onChanged,
}) => {
  const { token, tenantSlug } = useAuth();

  const [activeTab, setActiveTab] = useState<DetailTabKey>('funnel');
  const [loading, setLoading] = useState<boolean>(() => Boolean(isOpen && campaign?.id));
  const [detail, setDetail] = useState<CampaignDetailResponse | null>(null);
  const [reminders, setReminders] = useState<CampaignReminderStepDto[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [testModalOpen, setTestModalOpen] = useState(false);

  const fetchDetailPure = useCallback(
    async (campId: string) => {
      const [detRes, remRes] = await Promise.all([
        apiRequest<CampaignDetailResponse>(`/marketing/campaigns/${campId}/detail`, {
          token,
          tenantSlug,
        }).catch(() => ({} as CampaignDetailResponse)),
        apiRequest<{ items?: CampaignReminderStepDto[] }>(`/marketing/campaigns/${campId}/reminders`, {
          token,
          tenantSlug,
        }).catch(() => ({ items: [] })),
      ]);
      return { detRes, remItems: remRes.items || detRes.reminders || [] };
    },
    [token, tenantSlug]
  );

  const reloadDetail = useCallback(
    async (campId: string) => {
      setLoading(true);
      try {
        const { detRes, remItems } = await fetchDetailPure(campId);
        setDetail(detRes);
        setReminders(remItems);
      } finally {
        setLoading(false);
      }
    },
    [fetchDetailPure]
  );

  useEffect(() => {
    if (!isOpen || !campaign?.id) return;
    let cancelled = false;
    fetchDetailPure(campaign.id)
      .then(({ detRes, remItems }) => {
        if (cancelled) return;
        setDetail(detRes);
        setReminders(remItems);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, campaign?.id, fetchDetailPure]);

  if (!isOpen || !campaign) return null;

  const liveCampaign = detail?.campaign || campaign;
  const sent = liveCampaign.sent_count || 0;
  const clicked = liveCampaign.clicked_count || 0;

  const handleSaveRename = async () => {
    if (!nameDraft.trim()) return;
    try {
      await apiRequest(`/marketing/campaigns/${liveCampaign.id}`, {
        method: 'PUT',
        token,
        tenantSlug,
        body: { name: nameDraft.trim() },
      });
      toast.success('Đã cập nhật tên Chiến dịch!');
      setEditingName(false);
      await reloadDetail(liveCampaign.id);
      await onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đổi tên Chiến dịch.'));
    }
  };

  const handleDispatchNow = async () => {
    try {
      const res = await apiRequest<{ newly_sent: number; duplicate_claims_prevented: number }>(
        `/marketing/campaigns/${liveCampaign.id}/send`,
        { method: 'POST', token, tenantSlug }
      );
      toast.success(
        `Đã phát hành ${res.newly_sent} người (Chặn trùng nguyên tử: ${res.duplicate_claims_prevented})!`
      );
      await reloadDetail(liveCampaign.id);
      await onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể phát hành Chiến dịch.'));
    }
  };

  const handleAddReminder = async (payload: {
    condition: ReminderCondition;
    wait_hours: number;
    subject: string;
  }) => {
    try {
      await apiRequest(`/marketing/campaigns/${liveCampaign.id}/reminders`, {
        method: 'POST',
        token,
        tenantSlug,
        body: payload,
      });
      toast.success('Đã thêm bước gửi nhắc tự động!');
      await reloadDetail(liveCampaign.id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo bước nhắc.'));
    }
  };

  const handleDeleteReminder = async (remId: string) => {
    try {
      await apiRequest(`/marketing/campaigns/${liveCampaign.id}/reminders/${remId}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã xóa bước gửi nhắc.');
      await reloadDetail(liveCampaign.id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa bước nhắc.'));
    }
  };

  const handleProcessReminders = async () => {
    try {
      const res = await apiRequest<{ reminders_dispatched: number; condition: string }>(
        `/marketing/campaigns/${liveCampaign.id}/process-reminders`,
        { method: 'POST', token, tenantSlug }
      );
      toast.success(`Đã kích hoạt gửi nhắc (${res.condition}) tới ${res.reminders_dispatched} người nhận!`);
      await reloadDetail(liveCampaign.id);
      await onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xử lý gửi nhắc.'));
    }
  };

  const handleSyncRevenue = async (amountVnd: number) => {
    try {
      await apiRequest(`/marketing/campaigns/${liveCampaign.id}/attribute-revenue`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { amount_vnd: amountVnd },
      });
      toast.success('Đã đồng bộ Doanh thu quy đổi từ CRM!');
      await reloadDetail(liveCampaign.id);
      await onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đồng bộ doanh thu.'));
    }
  };

  const drawerNode = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9500,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(940px, 96vw)',
          height: '100vh',
          background: '#FFFFFF',
          borderLeft: '1px solid #E2E8F0',
          boxShadow: '-16px 0 48px rgba(15, 23, 42, 0.14)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            background: '#FFFFFF',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {editingName ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  className="form-input"
                  style={{ height: 38, width: 280 }}
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                />
                <button type="button" onClick={() => void handleSaveRename()} className="btn secondary sm" style={{ height: 38, color: '#059669' }}>
                  <Check size={15} />
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {liveCampaign.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setNameDraft(liveCampaign.name);
                      setEditingName(true);
                    }}
                    style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <Badge tone="primary">{liveCampaign.channel.toUpperCase()}</Badge>
                  <Badge tone={liveCampaign.status === 'completed' ? 'success' : 'info'}>
                    {liveCampaign.status.toUpperCase()}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 3 }}>
                  Tệp đích: {liveCampaign.audience_name || 'Toàn bộ khách hàng đủ điều kiện'} • Subject A: {liveCampaign.subject_a}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => void reloadDetail(liveCampaign.id)}
              className="btn secondary sm"
              style={{ height: 38 }}
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={() => setTestModalOpen(true)}
              className="btn secondary sm"
              style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700 }}
            >
              <Mail size={14} /> Test Email
            </button>
            <button
              type="button"
              onClick={() => void handleDispatchNow()}
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
              <Send size={14} /> Phát Hành Atomic
            </button>
            <button type="button" onClick={onClose} className="btn secondary sm" style={{ height: 38 }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: '0.85rem 1.5rem', background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
          <PillTabs
            tabs={[
              { key: 'funnel', label: '1. Phễu & So Sánh A/B', icon: <BarChart3 size={14} /> },
              { key: 'click_map', label: '2. Click Map URL', icon: <MousePointerClick size={14} />, count: detail?.click_map?.length || 0 },
              { key: 'claims', label: '3. Người Nhận & Bounce', icon: <Users size={14} />, count: detail?.claims?.length || sent },
              { key: 'reminders', label: '4. Chuỗi Nhắc Lại', icon: <BellRing size={14} />, count: reminders.length },
              { key: 'tech_roi', label: '5. Thiết Bị & ROI', icon: <Laptop size={14} /> },
            ]}
            activeKey={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', background: '#F8F9FA' }}>
          {loading ? (
            <DrawerSkeleton />
          ) : activeTab === 'funnel' ? (
            <CampaignFunnelAbTab liveCampaign={liveCampaign} abComparison={detail?.ab_comparison} />
          ) : activeTab === 'click_map' ? (
            <CampaignClickMapTab clickMap={detail?.click_map || []} totalClicks={clicked} />
          ) : activeTab === 'claims' ? (
            <CampaignRecipientLogsTab claims={detail?.claims || []} />
          ) : activeTab === 'reminders' ? (
            <CampaignRemindersTab
              reminders={reminders}
              onAddReminder={handleAddReminder}
              onDeleteReminder={handleDeleteReminder}
              onProcessReminders={handleProcessReminders}
            />
          ) : (
            <CampaignTechRoiTab
              campaign={liveCampaign}
              devices={detail?.tech_stats?.devices || []}
              clients={detail?.tech_stats?.clients || []}
              onSyncRevenue={handleSyncRevenue}
            />
          )}
        </div>
      </div>

      <TestEmailModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        campaignId={liveCampaign.id}
        campaignName={liveCampaign.name}
        channel={liveCampaign.channel}
        subjectA={liveCampaign.subject_a}
        subjectB={liveCampaign.subject_b}
        templateId={liveCampaign.template_id}
        senderName={liveCampaign.sender_name}
        senderEmail={liveCampaign.sender_email}
        fallbacks={liveCampaign.fallback_vars || { 'lead.name': 'Quý khách' }}
      />
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerNode, document.body) : null;
};

export default CampaignDetailDrawer;
