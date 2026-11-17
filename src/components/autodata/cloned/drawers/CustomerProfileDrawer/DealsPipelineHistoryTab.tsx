import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowRight, Briefcase, ExternalLink, History, Plus } from 'lucide-react';
import { TableSkeleton } from '../../components/ui/Skeleton';
import type { CrmDealRecord, CrmDealStageHistoryRow } from '../crmTypes';
import {
  DEAL_STAGES_META,
  crmGet,
  crmMutate,
  formatCurrencyVnd,
  formatDateTimeVi,
  formatDurationCompact,
  type CrmAuthCreds,
} from '../crm360Api';
import { openGlobalDealDrawer } from '../drawerEvents';

export interface DealsPipelineHistoryTabProps {
  contactId: string;
  companyId?: string | null;
  canEdit: boolean;
  creds: CrmAuthCreds;
}

export const DealsPipelineHistoryTab: React.FC<DealsPipelineHistoryTabProps> = ({
  contactId,
  companyId,
  canEdit,
  creds,
}) => {
  const [deals, setDeals] = useState<CrmDealRecord[]>([]);
  const [history, setHistory] = useState<CrmDealStageHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState(50000000);
  const [newStage, setNewStage] = useState('qualification');

  const loadCommercial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmGet<{
        deals: CrmDealRecord[];
        stage_history: CrmDealStageHistoryRow[];
      }>(`/contacts/${contactId}/commercial`, creds);
      setDeals(res.deals || []);
      setHistory(res.stage_history || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  }, [contactId, creds]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCommercial();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCommercial]);

  const handleQuickCreateDeal = async () => {
    if (!newTitle.trim()) {
      toast.error('Vui lòng nhập tên cơ hội kinh doanh');
      return;
    }
    setCreating(true);
    try {
      await crmMutate('/deals', 'POST', creds, {
        title: newTitle.trim(),
        lead_id: contactId,
        company_id: companyId || null,
        stage: newStage,
        amount_vnd: newAmount,
      });
      toast.success('Đã khởi tạo Cơ hội (Deal) mới');
      setNewTitle('');
      await loadCommercial();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo cơ hội');
    } finally {
      setCreating(false);
    }
  };

  const handleMoveStage = async (dealId: string, stage: string) => {
    try {
      await crmMutate(`/deals/${dealId}/stage`, 'PATCH', creds, { stage });
      toast.success('Đã chuyển bước cơ hội & ghi nhận lịch sử');
      await loadCommercial();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể chuyển bước cơ hội');
    }
  };

  if (loading) {
    return <TableSkeleton rows={4} cols={4} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {canEdit && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '1rem 1.25rem',
            display: 'grid',
            gridTemplateColumns: '2fr 1.2fr 1.2fr auto',
            gap: 10,
            alignItems: 'end',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Tên cơ hội (Multi-Deal)</span>
            <input
              placeholder="VD: Gói triển khai giải pháp năm 2026..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.84rem' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Giá trị (VNĐ)</span>
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(Number(e.target.value || 0))}
              style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.84rem' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Bước khởi đầu</span>
            <select
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.84rem', background: '#FFFFFF' }}
            >
              {DEAL_STAGES_META.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={creating}
            onClick={() => void handleQuickCreateDeal()}
            style={{
              height: 44,
              padding: '0 16px',
              borderRadius: 10,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Thêm Deal
          </button>
        </div>
      )}

      {/* Multi-Deals List */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Briefcase size={17} color="#1E40FF" />
          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
            Danh sách Cơ hội Kinh doanh ({deals.length})
          </h4>
        </div>

        {deals.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.84rem' }}>
            Khách hàng chưa có cơ hội (Deal) nào.
          </div>
        ) : (
          deals.map((d) => {
            const stMeta = DEAL_STAGES_META.find((s) => s.key === d.stage) || DEAL_STAGES_META[0];
            return (
              <div
                key={d.id}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '0.9rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => openGlobalDealDrawer(d)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        color: '#1E40FF',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      {d.title} <ExternalLink size={13} />
                    </button>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{d.deal_code}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: 4 }}>
                    Giá trị: <strong>{formatCurrencyVnd(d.amount_vnd)}</strong> • Xác suất:{' '}
                    <strong>{d.probability}%</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    disabled={!canEdit}
                    value={d.stage}
                    onChange={(e) => void handleMoveStage(d.id, e.target.value)}
                    style={{
                      height: 38,
                      borderRadius: 8,
                      border: `1px solid ${stMeta.color}40`,
                      background: stMeta.bg,
                      color: stMeta.color,
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      padding: '0 10px',
                    }}
                  >
                    {DEAL_STAGES_META.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stage Transition History (`tenant_deal_stage_history`) */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={17} color="#1E40FF" />
          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
            Lịch sử Luân chuyển Phễu (`tenant_deal_stage_history`) ({history.length})
          </h4>
        </div>

        {history.length === 0 ? (
          <div style={{ padding: '1rem', color: '#64748B', fontSize: '0.83rem' }}>
            Chưa phát sinh lịch sử chuyển bước.
          </div>
        ) : (
          history.map((h) => (
            <div
              key={h.id}
              style={{
                padding: '0.75rem 0.9rem',
                borderRadius: 10,
                background: '#F8FAFC',
                border: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{h.deal_title || h.deal_code}</span>
                  <span style={{ color: '#64748B' }}>({h.from_stage || 'Mới'})</span>
                  <ArrowRight size={13} color="#1E40FF" />
                  <span style={{ color: '#1E40FF' }}>{h.to_stage}</span>
                </div>
                {h.note && <div style={{ fontSize: '0.77rem', color: '#475569', marginTop: 2 }}>{h.note}</div>}
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.74rem', color: '#64748B' }}>
                <div>
                  {h.changed_by_name || 'Hệ thống'} • Lưu bước {formatDurationCompact(h.duration_seconds)}
                </div>
                <div>{formatDateTimeVi(h.created_at)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DealsPipelineHistoryTab;
