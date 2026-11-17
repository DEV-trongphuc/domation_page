import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Clock,
  Lock,
  MessageSquare,
  Send,
  Trash2,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEntitlement } from '../contexts/EntitlementContext';
import { Avatar } from '../components/ui/Avatar';
import { DrawerShell } from './DrawerShell';
import type {
  HelpdeskTicketComment,
  HelpdeskTicketRecord,
} from './crmTypes';
import { crmGet, crmMutate, formatDateTimeVi } from './crm360Api';
import { openGlobalCustomerDrawer } from './drawerEvents';

export interface TicketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: { id: string; subject?: string } | HelpdeskTicketRecord | null;
  onUpdated?: () => void;
  zIndex?: number;
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({
  isOpen,
  onClose,
  ticket,
  onUpdated,
  zIndex = 1245,
}) => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const [tk, setTk] = useState<HelpdeskTicketRecord | null>(null);
  const [comments, setComments] = useState<HelpdeskTicketComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [mountNow] = useState(() => Date.now());

  const ticketId = ticket?.id ? String(ticket.id) : '';
  const canEdit = can('helpdesk', 'edit') || can('tickets_data', 'edit') || can('leads', 'edit');

  const loadTicket = useCallback(async () => {
    if (!isOpen || !ticketId) return;
    setLoading(true);
    try {
      const res = await crmGet<{
        ticket: HelpdeskTicketRecord;
        comments: HelpdeskTicketComment[];
      }>(`/tickets/${ticketId}`, { token, tenantSlug });
      setTk(res.ticket);
      setComments(res.comments || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải phiếu hỗ trợ SLA');
    } finally {
      setLoading(false);
    }
  }, [isOpen, ticketId, token, tenantSlug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTicket();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTicket]);

  const handleUpdateField = async (patch: Partial<HelpdeskTicketRecord>) => {
    if (!tk || !canEdit) return;
    try {
      await crmMutate(`/tickets/${tk.id}`, 'PUT', { token, tenantSlug }, patch);
      toast.success('Đã cập nhật trạng thái Phiếu hỗ trợ');
      onUpdated?.();
      await loadTicket();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật ticket');
    }
  };

  const handleSendReply = async () => {
    if (!tk || !replyText.trim()) return;
    try {
      await crmMutate(`/tickets/${tk.id}/comments`, 'POST', { token, tenantSlug }, {
        content: replyText.trim(),
        is_internal_note: isInternalNote,
      });
      toast.success(isInternalNote ? 'Đã lưu ghi chú nội bộ' : 'Đã gửi phản hồi phiếu hỗ trợ');
      setReplyText('');
      await loadTicket();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi phản hồi');
    }
  };

  const handleDeleteComment = async (cmId: string) => {
    if (!tk) return;
    try {
      await crmMutate(`/tickets/${tk.id}/comments/${cmId}`, 'DELETE', { token, tenantSlug });
      await loadTicket();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa phản hồi');
    }
  };

  const isBreached = Boolean(
    tk &&
      (tk.sla_breached ||
        (tk.status !== 'resolved' &&
          tk.status !== 'closed' &&
          tk.resolution_due_at &&
          new Date(tk.resolution_due_at).getTime() < mountNow))
  );

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={zIndex}
      width="min(880px, calc(100vw - 48px))"
      loading={loading || !tk}
      title={
        <>
          <span>{tk?.subject || ticket?.subject || 'Phiếu Hỗ trợ CSKH & SLA'}</span>
          {tk && (
            <span style={{ fontSize: '0.73rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF' }}>
              {tk.ticket_code}
            </span>
          )}
          {isBreached && (
            <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#FEF3C7', color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={12} /> Quá hạn SLA
            </span>
          )}
        </>
      }
      subtitle={
        tk ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span>
              <Clock size={13} style={{ verticalAlign: 'middle' }} /> Hạn xử lý SLA:{' '}
              <strong>{formatDateTimeVi(tk.resolution_due_at)}</strong>
            </span>
            {tk.lead_id && (
              <button
                type="button"
                onClick={() => openGlobalCustomerDrawer(String(tk.lead_id))}
                style={{ border: 'none', background: 'transparent', padding: 0, color: '#1E40FF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <User size={13} /> Khách hàng: {tk.lead_name || tk.customer_name || 'Mở Hồ sơ 360°'}
              </button>
            )}
          </span>
        ) : undefined
      }
    >
      {tk && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Controls Bar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>Trạng thái xử lý</span>
              <select
                disabled={!canEdit}
                value={tk.status}
                onChange={(e) => void handleUpdateField({ status: e.target.value })}
                style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontWeight: 700, color: '#1E40FF', background: '#FFFFFF' }}
              >
                <option value="open">Mới mở (Open)</option>
                <option value="in_progress">Đang xử lý</option>
                <option value="waiting_customer">Chờ phản hồi khách</option>
                <option value="resolved">Đã giải quyết (Resolved)</option>
                <option value="closed">Đã đóng (Closed)</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>Mức độ ưu tiên</span>
              <select
                disabled={!canEdit}
                value={tk.priority}
                onChange={(e) => void handleUpdateField({ priority: e.target.value })}
                style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontWeight: 700, background: '#FFFFFF' }}
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp (Urgent)</option>
              </select>
            </label>
          </div>

          {tk.description && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.15rem', fontSize: '0.85rem', color: '#334155', lineHeight: 1.55 }}>
              <strong style={{ display: 'block', marginBottom: 6, color: '#0F172A' }}>Nội dung yêu cầu ban đầu:</strong>
              {tk.description}
            </div>
          )}

          {/* Reply & Internal Note Composer */}
          {canEdit && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsInternalNote(false)}
                  style={{
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 8,
                    border: !isInternalNote ? '1px solid #1E40FF' : '1px solid #E2E8F0',
                    background: !isInternalNote ? '#EFF6FF' : '#FFFFFF',
                    color: !isInternalNote ? '#1E40FF' : '#64748B',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                  }}
                >
                  <MessageSquare size={14} /> Phản hồi Khách hàng
                </button>
                <button
                  type="button"
                  onClick={() => setIsInternalNote(true)}
                  style={{
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 8,
                    border: isInternalNote ? '1px solid #D97706' : '1px solid #E2E8F0',
                    background: isInternalNote ? '#FFFBEB' : '#FFFFFF',
                    color: isInternalNote ? '#D97706' : '#64748B',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                  }}
                >
                  <Lock size={14} /> Ghi chú Nội bộ (Ẩn với khách)
                </button>
              </div>

              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isInternalNote ? 'Nhập ghi chú phối hợp nội bộ giữa các phòng ban...' : 'Nhập nội dung phản hồi cho khách hàng...'}
                style={{ borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 12px', fontSize: '0.84rem', background: isInternalNote ? '#FFFBEB' : '#F8FAFC' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => void handleSendReply()}
                  style={{ height: 44, padding: '0 1.25rem', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.83rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                >
                  <Send size={15} /> Gửi {isInternalNote ? 'Ghi chú Nội bộ' : 'Phản hồi'}
                </button>
              </div>
            </div>
          )}

          {/* Thread */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {comments.map((cm) => (
              <div
                key={cm.id}
                style={{
                  background: cm.is_internal_note ? '#FFFBEB' : '#FFFFFF',
                  border: cm.is_internal_note ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                  borderRadius: 14,
                  padding: '0.9rem 1.1rem',
                  display: 'flex',
                  gap: 10,
                }}
              >
                <Avatar name={cm.author_name} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: '0.83rem', color: '#0F172A' }}>{cm.author_name}</strong>
                      {cm.is_internal_note && (
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '1px 7px', borderRadius: 999, background: '#FEF3C7', color: '#D97706' }}>
                          Nội bộ
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.73rem', color: '#94A3B8' }}>{formatDateTimeVi(cm.created_at)}</span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteComment(cm.id)}
                          style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: 4, fontSize: '0.84rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                    {cm.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DrawerShell>
  );
};

export default TicketDrawer;
