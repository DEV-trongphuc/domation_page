import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ChevronDown, ChevronUp, RefreshCw, Search, Users } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type { FlowStepNode, StepParticipantItem } from './flowConstants';

export interface StepParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowId: string | null;
  step: FlowStepNode | null;
}

export const StepParticipantsModal: React.FC<StepParticipantsModalProps> = ({
  isOpen,
  onClose,
  flowId,
  step,
}) => {
  const { token, tenantSlug } = useAuth();

  const [loading, setLoading] = useState<boolean>(() => Boolean(isOpen && flowId && step?.id));
  const [items, setItems] = useState<StepParticipantItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchParticipantsPure = useCallback(
    async (fId: string, sId: string) => {
      const res = await apiRequest<{
        items?: StepParticipantItem[];
        participants?: StepParticipantItem[];
      }>(`/marketing/flows/${fId}/steps/${sId}/participants`, {
        token,
        tenantSlug,
      });
      return res?.items || res?.participants || [];
    },
    [token, tenantSlug]
  );

  const handleReload = async () => {
    if (!flowId || !step?.id) return;
    setLoading(true);
    try {
      const list = await fetchParticipantsPure(flowId, step.id);
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !flowId || !step?.id) return;
    let cancelled = false;
    fetchParticipantsPure(flowId, step.id)
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, flowId, step?.id, fetchParticipantsPure]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(p.lead_name || '').toLowerCase().includes(q) ||
        String(p.email || '').toLowerCase().includes(q) ||
        String(p.phone || '').toLowerCase().includes(q)
      );
    });
  }, [items, statusFilter, search]);

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Live Step Debugger: ${step?.label || step?.type || 'Bước xử lý'}`}
      width={740}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', 'completed', 'waiting', 'running', 'failed', 'exited'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  height: 32,
                  padding: '0 0.75rem',
                  borderRadius: 999,
                  border: statusFilter === st ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                  background: statusFilter === st ? '#1E40FF' : '#F8F9FA',
                  color: statusFilter === st ? '#FFFFFF' : '#475569',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {st.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94A3B8' }} />
              <input
                className="form-input"
                style={{ height: 34, paddingLeft: 32 }}
                placeholder="Tìm khách hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => void handleReload()}
              className="btn secondary sm"
              style={{ height: 34 }}
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {loading ? (
          <ModalBodySkeleton rows={3} />
        ) : !flowId ? (
          <div style={{ padding: '1.75rem', textAlign: 'center', color: '#64748B', fontSize: '0.83rem' }}>
            Vui lòng lưu kịch bản trước khi truy vấn danh sách khách hàng thực tế tại bước này.
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              borderRadius: 14,
              border: '1px dashed #CBD5E1',
              background: '#F8F9FA',
              textAlign: 'center',
              color: '#64748B',
              fontSize: '0.83rem',
            }}
          >
            <Users size={22} color="#94A3B8" style={{ marginBottom: 6 }} />
            <div>Chưa có khách hàng nào đi qua bước này khớp bộ lọc hiện tại.</div>
          </div>
        ) : (
          <div style={{ maxHeight: 390, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((p) => {
              const isExpanded = expandedId === p.id;
              return (
                <div
                  key={p.id}
                  style={{
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    style={{
                      padding: '0.75rem 0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: isExpanded ? '#F8FAFF' : '#FFFFFF',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>
                        {p.lead_name || p.email || p.lead_id}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>
                        {p.email || p.phone || '—'} • Score: {p.lead_score ?? 0} • Vào luồng: {formatShortDate(p.enrolled_at)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge tone={p.status === 'completed' ? 'success' : p.status === 'failed' ? 'danger' : 'primary'}>
                        {p.status.toUpperCase()}
                      </Badge>
                      {isExpanded ? <ChevronUp size={15} color="#64748B" /> : <ChevronDown size={15} color="#64748B" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #F1F5F9', background: '#F8F9FA' }}>
                      <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#1E40FF', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Activity size={13} /> Nhật Ký Vết Thực Thi (Step Execution Trace)
                      </div>
                      {!p.execution_trace || p.execution_trace.length === 0 ? (
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Đã hoàn tất ghi nhận tại bước hiện tại.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {p.execution_trace.map((tr, idx) => (
                            <div
                              key={`${tr.step_id}-${idx}`}
                              style={{
                                padding: '5px 8px',
                                borderRadius: 8,
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                fontSize: '0.74rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>
                                <strong>#{idx + 1} {tr.label}</strong>: {tr.outcome}
                              </span>
                              <span style={{ color: '#64748B' }}>{formatShortDate(tr.timestamp)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CustomModal>
  );
};

export default StepParticipantsModal;
