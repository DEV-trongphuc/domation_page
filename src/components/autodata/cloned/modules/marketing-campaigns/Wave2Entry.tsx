import React, { useCallback, useEffect, useState } from 'react';
import {
  Ban,
  Clock,
  DollarSign,
  Mail,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  FormCard,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';

interface CampaignRowDto {
  id: string;
  name: string;
  channel: 'email' | 'zns' | 'multi';
  status: string;
  audience_id: string | null;
  audience_name?: string | null;
  audience_type?: string | null;
  template_id: string | null;
  subject_a: string;
  subject_b: string;
  ab_split_ratio: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  open_rate_pct: number;
  click_rate_pct: number;
  cost_vnd: number;
  attributed_revenue_vnd: number;
  roi_multiple: number;
}

interface CampaignsOverviewResponse {
  items?: CampaignRowDto[];
  audiences?: Array<{ id: string; name: string; audience_type: string; cached_member_count: number }>;
  templates?: Array<{ id: string; name: string; subject: string }>;
  suppression_count?: number;
  vault_channels?: {
    email: { configured: boolean; provider: string | null };
    zns: { configured: boolean; provider: string | null };
  };
  summary?: {
    sent: number;
    opened: number;
    clicked: number;
    revenue_vnd: number;
    cost_vnd: number;
  };
}

interface SuppressionItem {
  id: string;
  channel: string;
  recipient: string;
  reason: string;
}

export const MarketingCampaignsPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology, can } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'campaigns' | 'suppression'>('campaigns');
  const [campaigns, setCampaigns] = useState<CampaignRowDto[]>([]);
  const [audiences, setAudiences] = useState<NonNullable<CampaignsOverviewResponse['audiences']>>([]);
  const [templates, setTemplates] = useState<NonNullable<CampaignsOverviewResponse['templates']>>([]);
  const [vaultChannels, setVaultChannels] = useState<CampaignsOverviewResponse['vault_channels']>();
  const [summary, setSummary] = useState({ sent: 0, opened: 0, clicked: 0, revenue_vnd: 0, cost_vnd: 0 });
  const [suppressionList, setSuppressionList] = useState<SuppressionItem[]>([]);

  // Create Wizard Modal
  const [wizardOpen, setWizardOpen] = useState(false);
  const [campName, setCampName] = useState('');
  const [channel, setChannel] = useState<'email' | 'zns' | 'multi'>('email');
  const [audienceId, setAudienceId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [subjectA, setSubjectA] = useState('Ưu đãi dành riêng cho {{lead.name}}');
  const [subjectB, setSubjectB] = useState('');
  const [abRatio, setAbRatio] = useState(50);
  const [reminderCondition, setReminderCondition] = useState<'none' | 'no_open' | 'no_click'>('no_open');
  const [costVnd, setCostVnd] = useState('500000');

  //Suppression input
  const [supRecipient, setSupRecipient] = useState('');

  const fetchAll = useCallback(async () => {
    const [ov, sup] = await Promise.all([
      apiRequest<CampaignsOverviewResponse>('/marketing/campaigns', { token, tenantSlug }),
      apiRequest<{ items?: SuppressionItem[] }>('/marketing/campaigns/suppression/list', {
        token,
        tenantSlug,
      }).catch(() => ({ items: [] })),
    ]);
    return { ov, sup };
  }, [token, tenantSlug]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { ov, sup } = await fetchAll();
      setCampaigns(ov.items || []);
      setAudiences(ov.audiences || []);
      setTemplates(ov.templates || []);
      setVaultChannels(ov.vault_channels);
      if (ov.summary) setSummary(ov.summary);
      setSuppressionList(sup.items || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách Chiến dịch.'));
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { ov, sup } = await fetchAll();
        if (cancelled) return;
        setCampaigns(ov.items || []);
        setAudiences(ov.audiences || []);
        setTemplates(ov.templates || []);
        setVaultChannels(ov.vault_channels);
        if (ov.summary) setSummary(ov.summary);
        setSuppressionList(sup.items || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  const handleCreateCampaign = async () => {
    if (!campName.trim()) {
      toast.error('Vui lòng nhập tên Chiến dịch.');
      return;
    }
    try {
      await apiRequest('/marketing/campaigns', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: campName.trim(),
          channel,
          audience_id: audienceId || null,
          template_id: templateId || null,
          subject_a: subjectA.trim(),
          subject_b: subjectB.trim(),
          ab_split_ratio: subjectB.trim() ? abRatio : 100,
          cost_vnd: Number(costVnd || 0),
          reminder_config: {
            enabled: reminderCondition !== 'none',
            trigger_condition: reminderCondition === 'none' ? 'no_open' : reminderCondition,
            wait_hours: 24,
          },
        },
      });
      toast.success('Đã khởi tạo Chiến dịch đa kênh!');
      setWizardOpen(false);
      setCampName('');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Chiến dịch.'));
    }
  };

  const handleDispatchCampaign = async (id: string) => {
    try {
      const res = await apiRequest<{ newly_sent: number; duplicate_claims_prevented: number }>(
        `/marketing/campaigns/${id}/send`,
        {
          method: 'POST',
          token,
          tenantSlug,
        }
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
        {
          method: 'POST',
          token,
          tenantSlug,
        }
      );
      toast.success(`Đã kích hoạt gửi nhắc (${res.condition}) tới ${res.reminders_dispatched} khách hàng!`);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi nhắc.'));
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
      toast.success('Đã đồng bộ Doanh thu quy đổi thực tế từ các khách hàng mở/click chiến dịch!');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đồng bộ doanh thu.'));
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await apiRequest(`/marketing/campaigns/${id}`, { method: 'DELETE', token, tenantSlug });
      toast.success('Đã xóa Chiến dịch.');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa Chiến dịch.'));
    }
  };

  const handleAddSuppression = async () => {
    if (!supRecipient.trim()) return;
    try {
      await apiRequest('/marketing/campaigns/suppression/list', {
        method: 'POST',
        token,
        tenantSlug,
        body: { recipient: supRecipient.trim(), channel: 'email', reason: 'manual' },
      });
      setSupRecipient('');
      toast.success('Đã thêm vào danh sách chặn gửi (Suppression List).');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thêm vào danh sách chặn.'));
    }
  };

  const columns: Array<TableColumn<CampaignRowDto>> = [
    {
      key: 'name',
      header: 'Chiến Dịch & Tệp Đích',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
            Tệp: {r.audience_name || `Toàn bộ ${terminology.customerLabel}`} • Tiêu đề A: {r.subject_a}
            {r.subject_b ? ` (A/B ${r.ab_split_ratio}/${100 - r.ab_split_ratio})` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'channel',
      header: 'Kênh Gửi Vault',
      render: (r) => (
        <Badge tone={r.channel === 'zns' ? 'info' : r.channel === 'multi' ? 'purple' : 'primary'}>
          {r.channel.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'metrics',
      header: 'Gửi / Mở / Click',
      numeric: true,
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700 }}>
            {r.sent_count} gửi • {r.opened_count} mở ({r.open_rate_pct}%)
          </div>
          <div style={{ fontSize: '0.74rem', color: '#1E40FF' }}>
            {r.clicked_count} click ({r.click_rate_pct}%)
          </div>
        </div>
      ),
    },
    {
      key: 'roi',
      header: 'Doanh Thu Quy Đổi & ROI',
      numeric: true,
      render: (r) => (
        <div>
          <div style={{ fontWeight: 800, color: '#059669' }}>{formatVnd(r.attributed_revenue_vnd)}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Chi phí: {formatVnd(r.cost_vnd)} ({r.roi_multiple}x)
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => void handleDispatchCampaign(r.id)}
            className="btn secondary sm"
            style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            title="Phát hành với khóa nguyên tử chống trùng"
          >
            <Send size={13} /> Phát hành
          </button>
          <button
            type="button"
            onClick={() => void handleRunReminder(r.id)}
            className="btn secondary sm"
            style={{ height: 36 }}
            title="Gửi nhắc khách chưa mở / chưa click"
          >
            <Clock size={13} />
          </button>
          <button
            type="button"
            onClick={() => void handleSyncRevenue(r.id)}
            className="btn secondary sm"
            style={{ height: 36, color: '#059669' }}
            title="Đồng bộ Doanh thu quy đổi"
          >
            <DollarSign size={13} />
          </button>
          <button
            type="button"
            onClick={() => void handleDeleteCampaign(r.id)}
            className="btn secondary sm"
            style={{ height: 36, color: '#DC2626' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang tải Chiến dịch Đa Kênh Email & Zalo ZNS..."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#F8F9FA' }}>
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
                Chống gửi trùng tuyệt đối, tự động trừ danh sách loại trừ & đo lường Doanh thu quy đổi (`attributed_revenue_vnd`).
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
                onClick={() => setWizardOpen(true)}
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
                <Plus size={16} /> Tạo Chiến Dịch Mới
              </button>
            )}
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <Card padding="1.1rem 1.25rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Tổng Lượt Đã Gửi</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
            {summary.sent.toLocaleString('vi-VN')}
          </div>
        </Card>
        <Card padding="1.1rem 1.25rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Lượt Mở / Click Thực Tế</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284C7', marginTop: 4 }}>
            {summary.opened} / {summary.clicked}
          </div>
        </Card>
        <Card padding="1.1rem 1.25rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Doanh Thu Quy Đổi Chiến Dịch</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {formatVnd(summary.revenue_vnd)}
          </div>
        </Card>
        <Card padding="1.1rem 1.25rem">
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Danh Sách Chặn (Suppression)</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {suppressionList.length.toLocaleString('vi-VN')}
          </div>
        </Card>
      </div>

      <PillTabs
        tabs={[
          { key: 'campaigns', label: 'Danh sách Chiến dịch', icon: <Mail size={15} />, count: campaigns.length },
          { key: 'suppression', label: 'Bounce & Unsubscribe Suppression', icon: <Ban size={15} />, count: suppressionList.length },
        ]}
        activeKey={tab}
        onChange={setTab}
      />

      {tab === 'campaigns' ? (
        <Table
          columns={columns}
          rows={campaigns}
          rowKey={(r) => r.id}
          emptyTitle="Chưa có Chiến dịch Email / Zalo ZNS nào"
          emptyDescription="Tạo chiến dịch gửi hàng loạt tới Tệp Data hoặc Tệp Logic với cơ chế khóa nguyên tử chống gửi đúp."
        />
      ) : (
        <Card title="Danh Sách Chặn Gửi Tự Động (Hard Bounce, Complaint & Unsubscribe)">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              className="form-input"
              style={{ height: 44, maxWidth: 360 }}
              placeholder="Nhập Email hoặc SĐT cần chặn gửi..."
              value={supRecipient}
              onChange={(e) => setSupRecipient(e.target.value)}
            />
            <button
              type="button"
              onClick={() => void handleAddSuppression()}
              style={{
                height: 44,
                padding: '0 1.2rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Đưa vào Suppression
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suppressionList.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: '0.65rem 0.9rem',
                  borderRadius: 12,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontWeight: 700 }}>{s.recipient}</span>
                <Badge tone="danger">{s.channel.toUpperCase()} • {s.reason}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Campaign Wizard Modal */}
      <CustomModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title="Khởi Tạo Chiến Dịch Email / Zalo ZNS Đa Kênh"
        width={620}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="form-input"
            style={{ height: 44 }}
            placeholder="Tên chiến dịch (VD: Ưu đãi Tri ân Khách hàng Q4)..."
            value={campName}
            onChange={(e) => setCampName(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <FormCard
              selected={channel === 'email'}
              onClick={() => setChannel('email')}
              icon={<Mail size={16} />}
              title="Email (SES/SMTP)"
            />
            <FormCard
              selected={channel === 'zns'}
              onClick={() => setChannel('zns')}
              icon={<MessageCircle size={16} />}
              title="Zalo ZNS"
            />
            <FormCard
              selected={channel === 'multi'}
              onClick={() => setChannel('multi')}
              icon={<Send size={16} />}
              title="Đa kênh kết hợp"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Tệp Khách hàng đích (Tự động trừ Exclusions)</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={audienceId}
                onChange={(e) => setAudienceId(e.target.value)}
              >
                <option value="">— Toàn bộ {terminology.customerLabel} đủ điều kiện —</option>
                {audiences.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.audience_type === 'dynamic_logic' ? 'Tệp Logic' : 'Tệp Data'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Mẫu Email thiết kế</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">— Chọn mẫu Email —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Tiêu đề Nhánh A (Subject A)</label>
              <input className="form-input" style={{ height: 44 }} value={subjectA} onChange={(e) => setSubjectA(e.target.value)} />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Tiêu đề A/B Test Nhánh B (Tùy chọn)</label>
              <input
                className="form-input"
                style={{ height: 44 }}
                placeholder="Để trống nếu không chạy A/B..."
                value={subjectB}
                onChange={(e) => setSubjectB(e.target.value)}
              />
            </div>
          </div>

          {subjectB.trim() && (
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Tỉ lệ chia A/B: {abRatio}% Nhánh A / {100 - abRatio}% Nhánh B
              </label>
              <input
                type="range"
                min={10}
                max={90}
                value={abRatio}
                onChange={(e) => setAbRatio(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Tự động gửi nhắc (Automated Reminder)</label>
              <select
                className="form-input"
                style={{ height: 44 }}
                value={reminderCondition}
                onChange={(e) => setReminderCondition(e.target.value as 'none' | 'no_open' | 'no_click')}
              >
                <option value="no_open">Gửi nhắc khách chưa mở (no_open sau 24h)</option>
                <option value="no_click">Gửi nhắc khách đã mở nhưng chưa click (no_click)</option>
                <option value="none">Không gửi nhắc</option>
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Chi phí phân bổ kênh (VNĐ)</label>
              <input
                type="number"
                className="form-input"
                style={{ height: 44 }}
                value={costVnd}
                onChange={(e) => setCostVnd(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
            <button type="button" onClick={() => setWizardOpen(false)} className="btn secondary" style={{ height: 44 }}>
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleCreateCampaign()}
              style={{
                height: 44,
                padding: '0 1.25rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Lưu Chiến Dịch
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default MarketingCampaignsPage;
