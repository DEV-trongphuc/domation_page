import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { DrawerSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  formatRemainingCountdown,
  TICKET_STATUS_OPTIONS,
  type HelpdeskCommentRow,
  type HelpdeskTicketRow,
} from './projectsTypes';

export interface TicketReplyDrawerProps {
  ticket: HelpdeskTicketRow | null;
  comments: HelpdeskCommentRow[];
  loading: boolean;
  canEdit: boolean;
  onClose: () => void;
  onTicketUpdated: (next: HelpdeskTicketRow) => void;
  onCommentAdded: (added: HelpdeskCommentRow) => void;
  onRefreshList: () => Promise<void> | void;
}

export const TicketReplyDrawer: React.FC<TicketReplyDrawerProps> = ({
  ticket,
  comments,
  loading,
  canEdit,
  onClose,
  onTicketUpdated,
  onCommentAdded,
  onRefreshList,
}) => {
  const { token, tenantSlug } = useAuth();
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  if (!ticket || typeof document === 'undefined') return null;

  const handleUpdateStatus = async (status: string) => {
    if (!canEdit) return;
    try {
      const updated = await apiRequest<HelpdeskTicketRow>(`/projects/tickets/${ticket.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { status },
      });
      onTicketUpdated(updated);
      toast.success('Đã cập nhật trạng thái Ticket CSKH');
      await onRefreshList();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đổi trạng thái Ticket'));
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    try {
      const created = await apiRequest<HelpdeskCommentRow>(`/projects/tickets/${ticket.id}/comments`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { content: replyText.trim(), is_internal_note: isInternalNote },
      });
      onCommentAdded(created);
      setReplyText('');
      toast.success(isInternalNote ? 'Đã lưu ghi chú nội bộ' : 'Đã gửi phản hồi khách hàng & ghi nhận SLA');
      await onRefreshList();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi phản hồi'));
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15, 23, 42, 0.38)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'flex-end' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(540px, 96vw)', height: '100%', background: '#FFFFFF', borderLeft: '1px solid #E2E8F0', boxShadow: '-12px 0 36px rgba(15,23,42,0.14)', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ padding: '1.1rem 1.35rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge tone="primary">{ticket.ticket_code}</Badge>
              <Badge tone={ticket.sla_breached ? 'danger' : 'success'}>
                {formatRemainingCountdown(ticket.resolution_remaining_minutes, ticket.status)}
              </Badge>
            </div>
            <h3 style={{ margin: '6px 0 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>{ticket.subject}</h3>
          </div>
          <button type="button" onClick={onClose} style={{ border: '1px solid #E2E8F0', background: '#F8F9FA', borderRadius: 10, width: 36, height: 36, cursor: 'pointer' }}>
            <X size={17} />
          </button>
        </div>

        {loading ? (
          <DrawerSkeleton />
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.35rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 12, borderRadius: 14, background: '#F8F9FA', border: '1px solid #E2E8F0', fontSize: '0.83rem', color: '#334155' }}>
              <div><strong>Khách hàng:</strong> {ticket.customer_name || ticket.lead_name || '—'} ({ticket.customer_contact || '—'})</div>
              <div style={{ marginTop: 4 }}>{ticket.description || 'Không có mô tả chi tiết.'}</div>
            </div>

            {canEdit && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {TICKET_STATUS_OPTIONS.map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => void handleUpdateStatus(st.value)}
                    style={{ height: 34, padding: '0 12px', borderRadius: 999, border: ticket.status === st.value ? '1.5px solid #1E40FF' : '1px solid #E2E8F0', background: ticket.status === st.value ? '#EFF6FF' : '#FFFFFF', color: ticket.status === st.value ? '#1E40FF' : '#475569', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{ padding: '10px 12px', borderRadius: 12, background: c.is_internal_note ? '#FFFBEB' : '#F8FAFF', border: c.is_internal_note ? '1px solid #FDE68A' : '1px solid #DBEAFE' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: c.is_internal_note ? '#B45309' : '#1E40FF' }}>
                    <span>{c.author_name} {c.is_internal_note ? '(Ghi chú nội bộ)' : '(Phản hồi KH)'}</span>
                    <span>{formatShortDate(c.created_at)}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#0F172A', marginTop: 4 }}>{c.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {canEdit && (
          <div style={{ padding: '1rem 1.35rem', borderTop: '1px solid #E2E8F0', background: '#F8F9FA', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: isInternalNote ? '#B45309' : '#475569', cursor: 'pointer' }}>
              <input type="checkbox" checked={isInternalNote} onChange={(e) => setIsInternalNote(e.target.checked)} />
              <Lock size={13} /> Ghi chú nội bộ (Ẩn với khách hàng)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void handleSendReply(); }} placeholder={isInternalNote ? 'Nhập ghi chú nội bộ...' : 'Nhập phản hồi gửi khách hàng...'} style={{ flex: 1, height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF' }} />
              <button type="button" onClick={() => void handleSendReply()} style={{ height: 44, padding: '0 16px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>
                <Send size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
