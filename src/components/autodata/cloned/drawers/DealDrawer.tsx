import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Briefcase,
  FileText,
  History,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEntitlement } from '../contexts/EntitlementContext';
import { DrawerShell, type DrawerTabDef } from './DrawerShell';
import type {
  CrmActivityRecord,
  CrmDealRecord,
  CrmDealStageHistoryRow,
} from './crmTypes';
import {
  DEAL_STAGES_META,
  crmGet,
  crmMutate,
  formatCurrencyVnd,
  formatDateTimeVi,
  formatDurationCompact,
} from './crm360Api';
import { FormattedMentionText, MentionNoteComposer } from './MentionNoteComposer';
import { DealFormBody } from './DealFormBody';

export interface DealDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  deal: { id: string; title?: string } | CrmDealRecord | null;
  onSaved?: () => void;
  zIndex?: number;
}

interface DealDetailResponse {
  deal: CrmDealRecord;
  stage_history: CrmDealStageHistoryRow[];
  activities: CrmActivityRecord[];
  quotes: Array<{ id: string; quote_code: string; title: string; total_vnd: number; status: string }>;
}

export const DealDrawer: React.FC<DealDrawerProps> = ({
  isOpen,
  onClose,
  deal,
  onSaved,
  zIndex = 1235,
}) => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const [activeTab, setActiveTab] = useState('info');
  const [detail, setDetail] = useState<DealDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoteTitle, setQuoteTitle] = useState('');

  const dealId = deal?.id ? String(deal.id) : '';
  const canEdit = can('deals', 'edit') || can('pipelines', 'edit') || can('leads', 'edit');

  const loadDeal = useCallback(async () => {
    if (!isOpen || !dealId) return;
    setLoading(true);
    try {
      const res = await crmGet<DealDetailResponse>(`/deals/${dealId}`, { token, tenantSlug });
      setDetail(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải chi tiết cơ hội');
    } finally {
      setLoading(false);
    }
  }, [isOpen, dealId, token, tenantSlug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDeal();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDeal]);

  const d = detail?.deal;

  const handleStageTransition = async (nextStage: string) => {
    if (!canEdit || !d || d.stage === nextStage) return;
    try {
      await crmMutate(`/deals/${d.id}/stage`, 'PATCH', { token, tenantSlug }, {
        stage: nextStage,
      });
      toast.success(
        nextStage === 'won'
          ? 'Chúc mừng! Đã chốt thành công Cơ hội (Won)!'
          : 'Đã chuyển bước & lưu vết kiểm toán'
      );
      onSaved?.();
      await loadDeal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể chuyển bước cơ hội');
    }
  };

  const handleAddActivityNote = async (payload: { content: string; mentions: string[] }) => {
    if (!d) return;
    try {
      await crmMutate('/activities', 'POST', { token, tenantSlug }, {
        activity_type: 'note',
        subject: `Ghi chú đàm phán Deal ${d.deal_code}`,
        body: payload.content,
        deal_id: d.id,
        lead_id: d.lead_id || null,
        company_id: d.company_id || null,
        mentions: payload.mentions,
        status: 'done',
      });
      toast.success('Đã thêm ghi chú tương tác cho Deal');
      await loadDeal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu ghi chú');
    }
  };

  const handleQuickQuote = async () => {
    if (!d || !d.lead_id) {
      toast.error('Cần liên kết Khách hàng (Contact) vào Deal trước khi phát hành Báo giá nhanh');
      return;
    }
    try {
      await crmMutate(`/contacts/${d.lead_id}/quick-quote`, 'POST', { token, tenantSlug }, {
        title: quoteTitle.trim() || `Báo giá cho ${d.title}`,
        total_vnd: d.amount_vnd,
        deal_id: d.id,
        company_id: d.company_id || null,
      });
      toast.success('Đã tạo Báo giá gắn trực tiếp với Deal');
      setQuoteTitle('');
      await loadDeal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo báo giá');
    }
  };

  const tabs: DrawerTabDef[] = [
    { id: 'info', label: 'Tổng quan Cơ hội', icon: <Briefcase size={15} /> },
    { id: 'history', label: 'Lịch sử Chuyển bước', icon: <History size={15} />, badge: detail?.stage_history.length },
    { id: 'activities', label: 'Tương tác & @Ghi chú', icon: <MessageSquare size={15} />, badge: detail?.activities.length },
    { id: 'quotes', label: 'Báo giá & Hợp đồng', icon: <FileText size={15} />, badge: detail?.quotes.length },
  ];

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={zIndex}
      loading={loading || !d}
      title={
        <>
          <span>{d?.title || deal?.title || 'Chi tiết Cơ hội Kinh doanh'}</span>
          {d && (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF' }}>
              {d.deal_code}
            </span>
          )}
        </>
      }
      subtitle={
        d ? (
          <span>
            Giá trị: <strong style={{ color: '#1E40FF' }}>{formatCurrencyVnd(d.amount_vnd)}</strong> • Xác suất:{' '}
            <strong>{d.probability}%</strong> • Phụ trách: <strong>{d.owner_name || '—'}</strong>
          </span>
        ) : undefined
      }
      headerSubBar={
        d ? (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingTop: 4 }}>
            {DEAL_STAGES_META.map((st) => {
              const active = d.stage === st.key;
              return (
                <button
                  key={st.key}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => void handleStageTransition(st.key)}
                  style={{
                    height: 34,
                    padding: '0 12px',
                    borderRadius: 999,
                    border: active ? `1.5px solid ${st.color}` : '1px solid #E2E8F0',
                    background: active ? st.color : '#FFFFFF',
                    color: active ? '#FFFFFF' : '#475569',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: canEdit ? 'pointer' : 'default',
                  }}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        ) : undefined
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {d && detail && (
        <>
          {activeTab === 'info' && (
            <DealFormBody
              key={`${d.id}-${d.updated_at || ''}`}
              deal={d}
              canEdit={canEdit}
              token={token}
              tenantSlug={tenantSlug}
              onSaved={() => {
                onSaved?.();
                void loadDeal();
              }}
            />
          )}

          {activeTab === 'history' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                Nhật ký Chuyển bước Phễu (`tenant_deal_stage_history`) ({detail.stage_history.length})
              </strong>
              {detail.stage_history.map((h) => (
                <div key={h.id} style={{ padding: '10px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{h.from_stage || 'Khởi tạo'}</span>
                      <ArrowRight size={14} color="#1E40FF" />
                      <span style={{ color: '#1E40FF' }}>{h.to_stage}</span>
                      <span style={{ fontSize: '0.74rem', color: '#64748B' }}>({h.probability}%)</span>
                    </div>
                    {h.note && <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 2 }}>{h.note}</div>}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.74rem', color: '#64748B' }}>
                    <div>{h.changed_by_name || 'Thành viên'} • Thời gian lưu: {formatDurationCompact(h.duration_seconds)}</div>
                    <div>{formatDateTimeVi(h.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {canEdit && <MentionNoteComposer onSubmit={handleAddActivityNote} placeholder="Ghi nhận biên bản đàm phán hoặc @mention đồng nghiệp..." />}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {detail.activities.length === 0 ? (
                  <div style={{ fontSize: '0.83rem', color: '#64748B' }}>Chưa có nhật ký tương tác cho cơ hội này.</div>
                ) : (
                  detail.activities.map((a) => (
                    <div key={a.id} style={{ padding: '10px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748B' }}>
                        <strong style={{ color: '#0F172A' }}>{a.subject}</strong>
                        <span>{a.owner_name} • {formatDateTimeVi(a.created_at)}</span>
                      </div>
                      {a.body && (
                        <div style={{ marginTop: 4, fontSize: '0.83rem', color: '#334155' }}>
                          <FormattedMentionText text={a.body} />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'quotes' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {canEdit && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    placeholder="Tiêu đề Báo giá phát hành từ Deal..."
                    value={quoteTitle}
                    onChange={(e) => setQuoteTitle(e.target.value)}
                    style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.84rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => void handleQuickQuote()}
                    style={{ height: 44, padding: '0 16px', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  >
                    <Plus size={15} /> Phát hành Báo giá
                  </button>
                </div>
              )}

              {detail.quotes.length === 0 ? (
                <div style={{ fontSize: '0.83rem', color: '#64748B' }}>Chưa có báo giá nào gắn với cơ hội này.</div>
              ) : (
                detail.quotes.map((q) => (
                  <div key={q.id} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>{q.quote_code}</strong> •{' '}
                      <span style={{ fontSize: '0.83rem', color: '#475569' }}>{q.title}</span>
                    </div>
                    <strong style={{ color: '#1E40FF', fontSize: '0.86rem' }}>{formatCurrencyVnd(q.total_vnd)}</strong>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </DrawerShell>
  );
};

export default DealDrawer;
