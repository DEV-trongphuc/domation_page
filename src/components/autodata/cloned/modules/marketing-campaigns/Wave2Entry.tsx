import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { StudioBuilderSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { SesQuotaWidget } from './SesQuotaWidget';
import { CampaignWizard } from './CampaignWizard';
import { CampaignDetailDrawer } from './CampaignDetailDrawer';
import { CampaignListSection, type CampaignStatusTabFilter } from './CampaignListSection';
import type {
  AudienceOptionDto,
  CampaignChannel,
  CampaignRowDto,
  CampaignsOverviewResponse,
  EmailTemplateOptionDto,
} from './campaignTypes';

export const MarketingCampaignsPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology, can } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignRowDto[]>([]);
  const [audiences, setAudiences] = useState<AudienceOptionDto[]>([]);
  const [templates, setTemplates] = useState<EmailTemplateOptionDto[]>([]);
  const [suppressionCount, setSuppressionCount] = useState(0);
  const [vaultChannels, setVaultChannels] = useState<CampaignsOverviewResponse['vault_channels']>();
  const [summary, setSummary] = useState({ sent: 0, opened: 0, clicked: 0, revenue_vnd: 0, cost_vnd: 0 });

  const [statusFilter, setStatusFilter] = useState<CampaignStatusTabFilter>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | CampaignChannel>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [wizardState, setWizardState] = useState<{
    open: boolean;
    key: number;
    editing: CampaignRowDto | null;
  }>({ open: false, key: 0, editing: null });
  const [detailCampaign, setDetailCampaign] = useState<CampaignRowDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampaignRowDto | null>(null);

  const fetchOverview = useCallback(async () => {
    return apiRequest<CampaignsOverviewResponse>('/marketing/campaigns', { token, tenantSlug });
  }, [token, tenantSlug]);

  const reload = useCallback(async () => {
    try {
      const ov = await fetchOverview();
      setCampaigns(ov.items || []);
      setAudiences(ov.audiences || []);
      setTemplates(ov.templates || []);
      setSuppressionCount(Number(ov.suppression_count || 0));
      setVaultChannels(ov.vault_channels);
      if (ov.summary) setSummary(ov.summary);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách Chiến dịch Đa kênh.'));
    } finally {
      setLoading(false);
    }
  }, [fetchOverview]);

  useEffect(() => {
    let cancelled = false;
    fetchOverview()
      .then((ov) => {
        if (cancelled) return;
        setCampaigns(ov.items || []);
        setAudiences(ov.audiences || []);
        setTemplates(ov.templates || []);
        setSuppressionCount(Number(ov.suppression_count || 0));
        setVaultChannels(ov.vault_channels);
        if (ov.summary) setSummary(ov.summary);
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải danh sách Chiến dịch.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchOverview]);

  const filteredCampaigns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.subject_a.toLowerCase().includes(q) ||
        String(c.audience_name || '').toLowerCase().includes(q)
      );
    });
  }, [campaigns, statusFilter, channelFilter, searchQuery]);

  const openWizard = (editing: CampaignRowDto | null) => {
    setWizardState((prev) => ({ open: true, key: prev.key + 1, editing }));
  };

  const handleDispatchCampaign = async (id: string) => {
    try {
      const res = await apiRequest<{ newly_sent: number; duplicate_claims_prevented: number }>(
        `/marketing/campaigns/${id}/send`,
        { method: 'POST', token, tenantSlug }
      );
      toast.success(
        `Phát hành hoàn tất: Đã gửi mới ${res.newly_sent} người, khóa nguyên tử chặn trùng ${res.duplicate_claims_prevented} lượt!`
      );
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể phát hành Chiến dịch.'));
    }
  };

  const handleRunReminder = async (id: string) => {
    try {
      const res = await apiRequest<{ reminders_dispatched: number; condition: string }>(
        `/marketing/campaigns/${id}/process-reminders`,
        { method: 'POST', token, tenantSlug }
      );
      toast.success(`Đã kích hoạt gửi nhắc (${res.condition}) tới ${res.reminders_dispatched} khách hàng!`);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể chạy gửi nhắc.'));
    }
  };

  const handleSyncRevenue = async (id: string) => {
    try {
      await apiRequest(`/marketing/campaigns/${id}/attribute-revenue`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { amount_vnd: 0 },
      });
      toast.success('Đã đồng bộ Doanh thu quy đổi thực tế từ CRM!');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đồng bộ doanh thu.'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/marketing/campaigns/${deleteTarget.id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã xóa Chiến dịch.');
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa Chiến dịch.'));
    }
  };

  if (loading) {
    return <StudioBuilderSkeleton />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', background: '#F8F9FA' }}>
      <Card padding="1.25rem 1.5rem" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 15,
                background: '#EEF2FF',
                border: '1px solid #DBEAFE',
                color: '#1E40FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Chiến Dịch Đa Kênh (AWS SES / SMTP & Zalo ZNS)
                </h1>
                <Badge tone="primary" icon={<ShieldCheck size={12} />}>
                  Atomic Claim Lock
                </Badge>
                {vaultChannels?.email.configured && <Badge tone="success">Email Vault Active</Badge>}
                {vaultChannels?.zns.configured && <Badge tone="info">Zalo ZNS Active</Badge>}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
                Thuật sĩ 5 bước A/B Split, Biến dự phòng `fallback_vars`, Chuỗi nhắc tự động, Click Map & Doanh thu quy đổi.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <ScreenHelpButton screenKey="mkt_campaigns" />
            <button type="button" onClick={() => void reload()} className="btn secondary" style={{ height: 44 }}>
              <RefreshCw size={15} />
            </button>
            {can('campaigns', 'create') && (
              <button
                type="button"
                onClick={() => openWizard(null)}
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
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} /> Tạo Chiến Dịch 5 Bước
              </button>
            )}
          </div>
        </div>
      </Card>

      <SesQuotaWidget onSuppressionChanged={(cnt) => setSuppressionCount(cnt)} />

      <CampaignListSection
        campaigns={campaigns}
        filteredCampaigns={filteredCampaigns}
        summary={summary}
        suppressionCount={suppressionCount}
        customerLabel={terminology.customerLabel}
        statusFilter={statusFilter}
        channelFilter={channelFilter}
        searchQuery={searchQuery}
        onChangeStatus={setStatusFilter}
        onChangeChannel={setChannelFilter}
        onChangeSearch={setSearchQuery}
        onOpenDetail={setDetailCampaign}
        onOpenEdit={(c) => openWizard(c)}
        onDispatch={(id) => void handleDispatchCampaign(id)}
        onRunReminder={(id) => void handleRunReminder(id)}
        onSyncRevenue={(id) => void handleSyncRevenue(id)}
        onRequestDelete={setDeleteTarget}
      />

      {wizardState.open && (
        <CampaignWizard
          key={wizardState.key}
          isOpen={wizardState.open}
          onClose={() => setWizardState((prev) => ({ ...prev, open: false }))}
          editingCampaign={wizardState.editing}
          audiences={audiences}
          templates={templates}
          suppressionCount={suppressionCount}
          customerLabel={terminology.customerLabel}
          onSaved={reload}
        />
      )}

      <CampaignDetailDrawer
        key={detailCampaign?.id || 'closed'}
        campaign={detailCampaign}
        isOpen={Boolean(detailCampaign)}
        onClose={() => setDetailCampaign(null)}
        onChanged={reload}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        title="Xác nhận xóa Chiến dịch"
        message={`Bạn có chắc chắn muốn xóa chiến dịch "${deleteTarget?.name || ''}" không?`}
      />
    </div>
  );
};

export default MarketingCampaignsPage;
