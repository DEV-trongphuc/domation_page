import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Briefcase,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { CustomModal } from '../../components/ui/CustomModal';
import { DealsKanbanTabSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { DealDrawer } from '../../drawers/DealDrawer';
import type {
  CrmCompanyRecord,
  CrmContactRecord,
  CrmDealRecord,
  CrmStaffMember,
} from '../../drawers/crmTypes';
import {
  DEAL_STAGES_META,
  crmGet,
  crmMutate,
  formatCurrencyVnd,
  vndToVietnameseWords,
} from '../../drawers/crm360Api';
import { DealsKanbanBoard } from './DealsKanbanBoard';

interface DealsListResponse {
  items: CrmDealRecord[];
  kpis: {
    total_deals: number;
    pipeline_value_vnd: number;
    weighted_forecast_vnd: number;
    won_value_vnd: number;
    won_count: number;
    win_rate_pct: number;
  };
  companies: CrmCompanyRecord[];
  staff: CrmStaffMember[];
}

export const CrmDealsPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const creds = useMemo(() => ({ token, tenantSlug }), [token, tenantSlug]);

  const [data, setData] = useState<DealsListResponse | null>(null);
  const [contacts, setContacts] = useState<CrmContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  const [activeDeal, setActiveDeal] = useState<CrmDealRecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState(80000000);
  const [newStage, setNewStage] = useState('qualification');
  const [newLeadId, setNewLeadId] = useState('');
  const [newCompanyId, setNewCompanyId] = useState('');
  const [newCloseDate, setNewCloseDate] = useState('');

  const [lostModalDeal, setLostModalDeal] = useState<CrmDealRecord | null>(null);
  const [lostReason, setLostReason] = useState('');

  const canCreate = can('deals', 'create') || can('pipelines', 'create');
  const canEdit = can('deals', 'edit') || can('pipelines', 'edit');

  const loadDeals = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, cRes] = await Promise.all([
        crmGet<DealsListResponse>('/deals', creds, {
          search: search.trim() || undefined,
          owner_id: ownerFilter || undefined,
          company_id: companyFilter || undefined,
        }),
        crmGet<{ items: CrmContactRecord[] }>('/contacts', creds, { limit: 60 }),
      ]);
      setData(dRes);
      setContacts(cRes.items || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải danh sách cơ hội');
    } finally {
      setLoading(false);
    }
  }, [creds, search, ownerFilter, companyFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDeals();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDeals]);

  const executeStageChange = async (
    deal: CrmDealRecord,
    nextStage: string,
    reason?: string
  ) => {
    // Optimistic Kanban card update
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((it) =>
              it.id === deal.id ? { ...it, stage: nextStage } : it
            ),
          }
        : prev
    );
    try {
      await crmMutate(`/deals/${deal.id}/stage`, 'PATCH', creds, {
        stage: nextStage,
        lost_reason: reason || undefined,
      });
      toast.success(
        nextStage === 'won'
          ? 'Chúc mừng! Đã chốt thành công Cơ hội & cộng doanh thu!'
          : 'Đã cập nhật bước phễu Kanban'
      );
      await loadDeals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể chuyển bước cơ hội');
      await loadDeals();
    }
  };

  const handleMoveDealStage = (deal: CrmDealRecord, nextStage: string) => {
    if (nextStage === 'lost') {
      setLostModalDeal(deal);
      setLostReason('');
      return;
    }
    void executeStageChange(deal, nextStage);
  };

  const handleCreateDeal = async () => {
    if (!newTitle.trim()) {
      toast.error('Vui lòng nhập tên cơ hội');
      return;
    }
    try {
      const created = await crmMutate<CrmDealRecord>('/deals', 'POST', creds, {
        title: newTitle.trim(),
        amount_vnd: newAmount,
        stage: newStage,
        lead_id: newLeadId || null,
        company_id: newCompanyId || null,
        expected_close_date: newCloseDate || null,
      });
      toast.success('Đã tạo Cơ hội Kinh doanh mới');
      setShowCreateModal(false);
      setNewTitle('');
      await loadDeals();
      setActiveDeal(created);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo cơ hội');
    }
  };

  if (loading && !data) {
    return <DealsKanbanTabSkeleton />;
  }

  const deals = data?.items || [];
  const kpis = data?.kpis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.15rem 1.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={20} color="#1E40FF" /> Cơ hội Kinh doanh & Phễu Multi-Deals Kanban
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
            Kéo-thả cơ hội theo thời gian thực, tự động lưu vết `tenant_deal_stage_history` & dự báo doanh thu trọng số
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              style={{ height: 42, padding: '0 12px', border: 'none', background: viewMode === 'kanban' ? '#EFF6FF' : '#FFFFFF', color: viewMode === 'kanban' ? '#1E40FF' : '#64748B', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
            >
              <LayoutGrid size={15} /> Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{ height: 42, padding: '0 12px', border: 'none', background: viewMode === 'list' ? '#EFF6FF' : '#FFFFFF', color: viewMode === 'list' ? '#1E40FF' : '#64748B', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
            >
              <List size={15} /> Danh sách
            </button>
          </div>

          <button
            type="button"
            onClick={() => void loadDeals()}
            style={{ height: 44, padding: '0 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
          >
            <RefreshCw size={15} />
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              style={{ height: 44, padding: '0 1.2rem', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.83rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <Plus size={16} /> Thêm Cơ hội
            </button>
          )}
        </div>
      </div>

      {/* Forecast KPIs */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.9rem' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem 1.15rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TỔNG GIÁ TRỊ PIPELINE ({kpis.total_deals})</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{formatCurrencyVnd(kpis.pipeline_value_vnd)}</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem 1.15rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>DỰ BÁO TRỌNG SỐ (WEIGHTED)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>{formatCurrencyVnd(kpis.weighted_forecast_vnd)}</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem 1.15rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>DOANH THU ĐÃ CHỐT (WON)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>{formatCurrencyVnd(kpis.won_value_vnd)}</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem 1.15rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TỶ LỆ THẮNG (WIN RATE)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>{kpis.win_rate_pct}%</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '0.75rem 1rem', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 14 }} />
          <input
            placeholder="Tìm theo mã Deal, tiêu đề, công ty, khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px 0 36px', fontSize: '0.84rem' }}
          />
        </div>
        <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.82rem', background: '#FFFFFF' }}>
          <option value="">Mọi Doanh nghiệp B2B</option>
          {(data?.companies || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.82rem', background: '#FFFFFF' }}>
          <option value="">Mọi Phụ trách</option>
          {(data?.staff || []).map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </div>

      {/* Board or Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : viewMode === 'kanban' ? (
        <DealsKanbanBoard
          deals={deals}
          canEdit={canEdit}
          onMoveDealStage={handleMoveDealStage}
          onSelectDeal={(d) => setActiveDeal(d)}
        />
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '12px 14px' }}>Mã & Tên Cơ hội</th>
                <th style={{ padding: '12px 14px' }}>Khách hàng / Công ty</th>
                <th style={{ padding: '12px 14px' }}>Bước Phễu</th>
                <th style={{ padding: '12px 14px' }}>Giá trị & Xác suất</th>
                <th style={{ padding: '12px 14px' }}>Ngày dự kiến chốt</th>
                <th style={{ padding: '12px 14px' }}>Phụ trách</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} onClick={() => setActiveDeal(d)} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A' }}>{d.title}</div>
                    <div style={{ fontSize: '0.73rem', color: '#64748B' }}>{d.deal_code}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>{d.contact_name || '—'}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{d.company_name || ''}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }} onClick={(e) => e.stopPropagation()}>
                    <select
                      disabled={!canEdit}
                      value={d.stage}
                      onChange={(e) => handleMoveDealStage(d, e.target.value)}
                      style={{ height: 36, borderRadius: 8, border: '1px solid #DBEAFE', background: '#EFF6FF', color: '#1E40FF', fontWeight: 700, fontSize: '0.78rem', padding: '0 8px' }}
                    >
                      {DEAL_STAGES_META.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <strong style={{ color: '#1E40FF' }}>{formatCurrencyVnd(d.amount_vnd)}</strong>
                    <div style={{ fontSize: '0.73rem', color: '#64748B' }}>Xác suất: {d.probability}%</div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>
                    {d.expected_close_date ? String(d.expected_close_date).slice(0, 10) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>
                    {d.owner_name || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Deal Modal */}
      <CustomModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Khởi tạo Cơ hội Kinh doanh (Multi-Deal)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input placeholder="Tên cơ hội kinh doanh *" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input type="number" placeholder="Giá trị dự kiến (VNĐ)" value={newAmount} onChange={(e) => setNewAmount(Number(e.target.value || 0))} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
            <select value={newStage} onChange={(e) => setNewStage(e.target.value)} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px' }}>
              {DEAL_STAGES_META.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            <select value={newLeadId} onChange={(e) => setNewLeadId(e.target.value)} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px' }}>
              <option value="">— Chọn Khách hàng 360° —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select value={newCompanyId} onChange={(e) => setNewCompanyId(e.target.value)} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px' }}>
              <option value="">— Chọn Doanh nghiệp B2B —</option>
              {(data?.companies || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>
            Bằng chữ: {vndToVietnameseWords(newAmount)}
          </span>
          <input type="date" value={newCloseDate} onChange={(e) => setNewCloseDate(e.target.value)} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          <button
            type="button"
            onClick={() => void handleCreateDeal()}
            style={{ height: 44, borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Tạo Cơ hội & Mở DealDrawer
          </button>
        </div>
      </CustomModal>

      {/* Lost Reason Modal */}
      <CustomModal isOpen={Boolean(lostModalDeal)} onClose={() => setLostModalDeal(null)} title="Ghi nhận Lý do Tạm dừng / Thất bại">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="VD: Vượt ngân sách, chọn đối thủ, dời sang quý sau..."
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <button
            type="button"
            onClick={() => {
              if (lostModalDeal) {
                void executeStageChange(lostModalDeal, 'lost', lostReason.trim() || 'Tạm hoãn');
                setLostModalDeal(null);
              }
            }}
            style={{ height: 44, borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Xác nhận chuyển sang Lost
          </button>
        </div>
      </CustomModal>

      {activeDeal && (
        <DealDrawer
          isOpen={Boolean(activeDeal)}
          deal={activeDeal}
          onClose={() => setActiveDeal(null)}
          onSaved={() => void loadDeals()}
        />
      )}
    </div>
  );
};

export default CrmDealsPage;
