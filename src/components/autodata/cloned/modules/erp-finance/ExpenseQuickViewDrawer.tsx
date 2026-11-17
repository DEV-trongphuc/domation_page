import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  CreditCard,
  MessageSquare,
  QrCode,
  Receipt,
  RotateCcw,
  Send,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DrawerSkeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { numberToVietnameseWords, type ExpenseRecord } from './financeTypes';

interface ExpenseQuickViewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  expenseId: string | null;
  initialExpense?: ExpenseRecord | null;
  onUpdated: () => void;
}

export const ExpenseQuickViewDrawer: React.FC<ExpenseQuickViewDrawerProps> = ({
  isOpen,
  onClose,
  expenseId,
  initialExpense,
  onUpdated,
}) => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const canEdit = can('erp_finance_inventory', 'edit');
  const canApprove = can('erp_finance_inventory', 'approve');

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<ExpenseRecord | null>(initialExpense || null);
  const [commentText, setCommentText] = useState('');
  const [refundUrl, setRefundUrl] = useState('');
  const [showRefundInput, setShowRefundInput] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadDetail = useCallback(
    async (targetId: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await apiRequest<ExpenseRecord>(`/finance/expenses/${targetId}`, {
          token,
          tenantSlug,
        });
        setDetail(res);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Không thể tải chi tiết đề nghị chi phí.'));
      } finally {
        setLoading(false);
      }
    },
    [token, tenantSlug]
  );

  useEffect(() => {
    if (!isOpen || !expenseId) return;
    const timer = window.setTimeout(() => {
      void loadDetail(expenseId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, expenseId, loadDetail]);

  if (!isOpen || typeof document === 'undefined') return null;

  const runDecision = async (
    action: 'approve' | 'reject' | 'pay' | 'refund' | 'comment',
    extraBody?: Record<string, unknown>
  ) => {
    if (!detail) return;
    setProcessing(true);
    try {
      await apiRequest(`/finance/expenses/${detail.id}/decision`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { action, ...extraBody },
      });
      if (action === 'approve') toast.success('Đã phê duyệt đề nghị chi phí!');
      if (action === 'reject') toast.success('Đã từ chối đề nghị chi phí.');
      if (action === 'pay') toast.success('Đã xác nhận giải ngân & ghi Sổ quỹ Chi!');
      if (action === 'refund') {
        toast.success('Đã ghi nhận hoàn ứng chi phí vào Sổ quỹ Thu!');
        setShowRefundInput(false);
      }
      await loadDetail(detail.id);
      onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xử lý phê duyệt phiếu chi.'));
    } finally {
      setProcessing(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(15, 23, 42, 0.42)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(900px, 100vw)',
          height: '100%',
          background: '#FFFFFF',
          boxShadow: '-12px 0 36px rgba(15, 23, 42, 0.16)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading && !detail ? (
          <DrawerSkeleton />
        ) : !detail ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>
            Không tìm thấy dữ liệu phiếu chi phí.
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              style={{
                padding: '1.1rem 1.4rem',
                borderBottom: '1px solid #E2E8F0',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: '#EFF6FF',
                    color: '#1E40FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Wallet size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '1.04rem', fontWeight: 800, color: '#0F172A' }}>
                      {detail.expense_code} — {detail.title}
                    </h2>
                    <Badge
                      tone={
                        detail.approval_status === 'paid' || detail.approval_status === 'approved'
                          ? 'success'
                          : detail.approval_status === 'rejected'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {detail.approval_status}
                    </Badge>
                    {detail.has_vat_invoice && (
                      <Badge tone="info" icon={<Receipt size={11} />}>
                        VAT {detail.vat_invoice_no || 'Có HĐ Đỏ'}
                      </Badge>
                    )}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
                    Đề xuất bởi: <strong>{detail.requester_name || '—'}</strong> • Ngày chứng từ:{' '}
                    {formatShortDate(detail.expense_date)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color="#475569" />
              </button>
            </div>

            {/* Action Bar */}
            {(canApprove || canEdit) && (
              <div
                style={{
                  padding: '0.75rem 1.4rem',
                  background: '#F8FAFF',
                  borderBottom: '1px solid #DBEAFE',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {canApprove && detail.approval_status === 'pending_approval' && (
                  <>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => void runDecision('approve')}
                      className="btn primary"
                      style={{ height: 38, background: '#059669', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <CheckCircle2 size={15} /> Duyệt Đề Nghị
                    </button>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => void runDecision('reject')}
                      className="btn secondary"
                      style={{ height: 38, color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <XCircle size={15} /> Từ chối
                    </button>
                  </>
                )}
                {canEdit && (detail.approval_status === 'approved' || detail.approval_status === 'pending_approval') && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => void runDecision('pay')}
                    className="btn primary"
                    style={{ height: 38, background: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <CreditCard size={15} /> Xác nhận Giải ngân & Ghi Sổ Chi
                  </button>
                )}
                {canEdit && detail.approval_status === 'paid' && detail.refund_status !== 'refunded' && (
                  <button
                    type="button"
                    onClick={() => setShowRefundInput((p) => !p)}
                    className="btn secondary"
                    style={{ height: 38, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <RotateCcw size={14} /> Ghi nhận Hoàn ứng / Thu hồi
                  </button>
                )}
              </div>
            )}

            {/* Split Content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              }}
            >
              {/* Left Info & Line Items */}
              <div
                style={{
                  padding: '1.25rem 1.4rem',
                  borderRight: '1px solid #F1F5F9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                {showRefundInput && (
                  <div
                    style={{
                      padding: '0.9rem',
                      borderRadius: 12,
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1E40FF' }}>
                      Đính kèm UNC Hoàn ứng ({formatVnd(detail.total_amount_vnd)})
                    </div>
                    <input
                      className="form-input"
                      style={{ height: 38, background: '#FFFFFF' }}
                      placeholder="Link chứng từ UNC hoàn tiền..."
                      value={refundUrl}
                      onChange={(e) => setRefundUrl(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        type="button"
                        className="btn primary"
                        style={{ height: 36, background: '#1E40FF' }}
                        onClick={() =>
                          void runDecision('refund', {
                            refund_amount_vnd: detail.total_amount_vnd,
                            refund_attachment_url: refundUrl || null,
                          })
                        }
                      >
                        Xác nhận đã thu hoàn ứng
                      </button>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 14,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
                      TỔNG CHI PHÍ ĐỀ NGHỊ
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1E40FF' }}>
                      {formatVnd(detail.total_amount_vnd)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>
                      {numberToVietnameseWords(detail.total_amount_vnd)}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 4 }}>
                      Trước thuế: {formatVnd(detail.subtotal_vnd)} • VAT: {formatVnd(detail.vat_amount_vnd)}
                    </div>
                  </div>

                  {detail.payout_vietqr_url && (
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={detail.payout_vietqr_url}
                        alt="Vendor Payout QR"
                        style={{ width: 90, height: 90, borderRadius: 10, border: '1px solid #DBEAFE' }}
                      />
                      <div style={{ fontSize: '0.68rem', color: '#1E40FF', fontWeight: 700 }}>
                        <QrCode size={11} /> QR Chuyển khoản NCC
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.82rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Đơn vị thụ hưởng: </span>
                    <strong>{detail.vendor_name || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>MST: </span>
                    <strong>{detail.vendor_tax_code || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Ngân hàng nhận: </span>
                    <strong>{detail.bank_name || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Số TK: </span>
                    <strong>{detail.bank_account_no || '—'}</strong>
                  </div>
                </div>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: 8, textAlign: 'left' }}>Hạng mục</th>
                        <th style={{ padding: 8, textAlign: 'right' }}>SL</th>
                        <th style={{ padding: 8, textAlign: 'right' }}>Đơn giá</th>
                        <th style={{ padding: 8, textAlign: 'center' }}>VAT</th>
                        <th style={{ padding: 8, textAlign: 'right' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.line_items || []).map((li) => (
                        <tr key={li.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: 8, fontWeight: 600 }}>{li.content}</td>
                          <td style={{ padding: 8, textAlign: 'right' }}>{li.qty}</td>
                          <td style={{ padding: 8, textAlign: 'right' }}>{formatVnd(li.unit_price_vnd)}</td>
                          <td style={{ padding: 8, textAlign: 'center' }}>{li.vat_pct}%</td>
                          <td style={{ padding: 8, textAlign: 'right', fontWeight: 700 }}>
                            {formatVnd(li.line_total_vnd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Audit & Discussion */}
              <div
                style={{
                  padding: '1.25rem 1.4rem',
                  background: '#F8FAFC',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.88rem' }}>
                  <MessageSquare size={16} color="#1E40FF" /> Tiến trình Phê duyệt & Trao đổi
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                  {(detail.history || []).map((h) => (
                    <div
                      key={h.id}
                      style={{
                        padding: '0.75rem 0.9rem',
                        borderRadius: 12,
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
                        <strong style={{ color: '#0F172A' }}>{h.actor_name}</strong>
                        <span>{formatShortDate(h.created_at)}</span>
                      </div>
                      <div style={{ marginTop: 4, color: '#334155' }}>{h.note}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <input
                    className="form-input"
                    style={{ height: 42, background: '#FFFFFF' }}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Nhập ghi chú trao đổi trên phiếu chi..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && commentText.trim()) {
                        e.preventDefault();
                        const txt = commentText.trim();
                        setCommentText('');
                        void runDecision('comment', { note: txt });
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      if (!commentText.trim()) return;
                      const txt = commentText.trim();
                      setCommentText('');
                      void runDecision('comment', { note: txt });
                    }}
                    style={{ height: 42, background: '#1E40FF', padding: '0 14px' }}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};
