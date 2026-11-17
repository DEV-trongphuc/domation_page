import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Ban,
  CheckCircle2,
  Clock,
  ExternalLink,
  Landmark,
  MessageSquare,
  Plus,
  QrCode,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DrawerSkeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { numberToVietnameseWords, type DepositRecord } from './financeTypes';

interface DepositDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  depositId: string | null;
  initialDeposit?: DepositRecord | null;
  onUpdated: () => void;
}

export const DepositDetailDrawer: React.FC<DepositDetailDrawerProps> = ({
  isOpen,
  onClose,
  depositId,
  initialDeposit,
  onUpdated,
}) => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const canEdit = can('erp_finance_inventory', 'edit');
  const canApprove = can('erp_finance_inventory', 'approve');

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<DepositRecord | null>(initialDeposit || null);
  const [newTrancheName, setNewTrancheName] = useState('');
  const [newTrancheAmount, setNewTrancheAmount] = useState('');
  const [newTrancheDate, setNewTrancheDate] = useState('');
  const [showAddTranche, setShowAddTranche] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [showRefundBox, setShowRefundBox] = useState(false);
  const [commentText, setCommentText] = useState('');

  const loadDetail = useCallback(
    async (targetId: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await apiRequest<DepositRecord>(`/finance/deposits/${targetId}`, {
          token,
          tenantSlug,
        });
        setDetail(res);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Không thể tải chi tiết phiếu đặt cọc.'));
      } finally {
        setLoading(false);
      }
    },
    [token, tenantSlug]
  );

  useEffect(() => {
    if (!isOpen || !depositId) return;
    const timer = window.setTimeout(() => {
      void loadDetail(depositId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, depositId, loadDetail]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleMilestoneAction = async (
    milestoneId: string,
    action: 'confirm' | 'reject',
    uncUrl?: string
  ) => {
    if (!detail) return;
    try {
      await apiRequest(`/finance/deposits/${detail.id}/milestones/${milestoneId}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { action, unc_url: uncUrl },
      });
      toast.success(
        action === 'confirm'
          ? 'Kế toán đã xác nhận thu tiền đợt cọc & ghi sổ quỹ!'
          : 'Đã từ chối chứng từ UNC của đợt này.'
      );
      await loadDetail(detail.id);
      onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái đợt đặt cọc.'));
    }
  };

  const handleAddTranche = async () => {
    if (!detail || Number(newTrancheAmount || 0) <= 0) {
      toast.error('Vui lòng nhập số tiền đợt thanh toán > 0.');
      return;
    }
    try {
      await apiRequest(`/finance/deposits/${detail.id}/milestones`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: newTrancheName || `Đợt ${(detail.milestones?.length || 0) + 1}`,
          amount_vnd: Number(newTrancheAmount),
          expected_pay_date: newTrancheDate || null,
        },
      });
      toast.success('Đã bổ sung đợt thanh toán mới!');
      setNewTrancheName('');
      setNewTrancheAmount('');
      setShowAddTranche(false);
      await loadDetail(detail.id);
      onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thêm đợt thanh toán mới.'));
    }
  };

  const handleRefundDeposit = async () => {
    if (!detail) return;
    try {
      await apiRequest(`/finance/deposits/${detail.id}/refund`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          refund_amount_vnd: detail.amount_vnd,
          refund_reason: refundReason || 'Hoàn cọc theo đề nghị khách hàng',
        },
      });
      toast.success('Đã hoàn tiền đặt cọc & hạch toán phiếu chi hoàn cọc!');
      setShowRefundBox(false);
      await loadDetail(detail.id);
      onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thực hiện hoàn cọc.'));
    }
  };

  const handleSendComment = async () => {
    if (!detail || !commentText.trim()) return;
    try {
      await apiRequest(`/finance/deposits/${detail.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { comment_text: commentText.trim() },
      });
      setCommentText('');
      await loadDetail(detail.id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi trao đổi nội bộ.'));
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
          width: 'min(940px, 100vw)',
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
            Không tìm thấy thông tin phiếu đặt cọc.
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
                  <Landmark size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ margin: 0, fontSize: '1.06rem', fontWeight: 800, color: '#0F172A' }}>
                      {detail.deposit_code} — {detail.customer_name}
                    </h2>
                    <Badge
                      tone={
                        detail.status === 'received'
                          ? 'success'
                          : detail.status === 'refunded'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {detail.status}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
                    Mã sản phẩm/căn: <strong>{detail.unit_code || '—'}</strong> • Tạo ngày:{' '}
                    {formatShortDate(detail.created_at)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {canApprove && detail.status !== 'refunded' && (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setShowRefundBox((p) => !p)}
                    style={{ height: 38, color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <RotateCcw size={14} /> Hoàn tiền cọc
                  </button>
                )}
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
            </div>

            {/* Body Split Layout */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: 0,
              }}
            >
              {/* Left Column: Milestones, UNC & VietQR */}
              <div
                style={{
                  padding: '1.25rem 1.4rem',
                  borderRight: '1px solid #F1F5F9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {showRefundBox && (
                  <div
                    style={{
                      padding: '0.9rem 1rem',
                      borderRadius: 12,
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#991B1B' }}>
                      Xác nhận Kế toán Chi hoàn tiền đặt cọc ({formatVnd(detail.amount_vnd)})
                    </div>
                    <input
                      className="form-input"
                      style={{ height: 38, background: '#FFFFFF' }}
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Nhập lý do hoàn cọc / biên bản thanh lý..."
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        type="button"
                        className="btn secondary"
                        style={{ height: 36 }}
                        onClick={() => setShowRefundBox(false)}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="btn primary"
                        style={{ height: 36, background: '#DC2626' }}
                        onClick={() => void handleRefundDeposit()}
                      >
                        Xác nhận Hoàn cọc
                      </button>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 14,
                    background: '#F8FAFF',
                    border: '1px solid #DBEAFE',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
                      SỐ TIỀN ĐẶT CỌC GHI NHẬN
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1E40FF' }}>
                      {formatVnd(detail.amount_vnd)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>
                      {numberToVietnameseWords(detail.amount_vnd)}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#334155', marginTop: 4 }}>
                      Giá trị HĐ: <strong>{formatVnd(detail.contract_value_vnd)}</strong> • Hoa hồng dự kiến:{' '}
                      <strong style={{ color: '#059669' }}>{formatVnd(detail.expected_commission_vnd)}</strong>
                    </div>
                  </div>
                  {detail.vietqr_url && (
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={detail.vietqr_url}
                        alt="VietQR Deposit"
                        style={{
                          width: 92,
                          height: 92,
                          borderRadius: 10,
                          border: '1px solid #BFDBFE',
                          background: '#FFFFFF',
                        }}
                      />
                      <div style={{ fontSize: '0.68rem', color: '#1E40FF', fontWeight: 700, marginTop: 2 }}>
                        <QrCode size={11} /> VietQR Pháp nhân
                      </div>
                    </div>
                  )}
                </div>

                {/* Milestones List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                      Tiến độ các đợt Đặt cọc / Thanh toán ({detail.milestones?.length || 0})
                    </h3>
                    {canEdit && (
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => setShowAddTranche((p) => !p)}
                        style={{ height: 34, color: '#1E40FF', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Plus size={13} /> Thêm đợt
                      </button>
                    )}
                  </div>

                  {showAddTranche && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr 0.9fr auto',
                        gap: 6,
                        padding: 8,
                        borderRadius: 10,
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <input
                        className="form-input"
                        style={{ height: 36 }}
                        placeholder="Tên đợt"
                        value={newTrancheName}
                        onChange={(e) => setNewTrancheName(e.target.value)}
                      />
                      <input
                        type="number"
                        className="form-input"
                        style={{ height: 36 }}
                        placeholder="Số tiền"
                        value={newTrancheAmount}
                        onChange={(e) => setNewTrancheAmount(e.target.value)}
                      />
                      <input
                        type="date"
                        className="form-input"
                        style={{ height: 36 }}
                        value={newTrancheDate}
                        onChange={(e) => setNewTrancheDate(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn primary"
                        style={{ height: 36, background: '#1E40FF' }}
                        onClick={() => void handleAddTranche()}
                      >
                        Lưu
                      </button>
                    </div>
                  )}

                  {(detail.milestones || []).map((ms) => (
                    <div
                      key={ms.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 12,
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0F172A' }}>
                            {ms.name}
                          </span>
                          <Badge
                            tone={
                              ms.status === 'confirmed'
                                ? 'success'
                                : ms.status === 'rejected'
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {ms.status}
                          </Badge>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E40FF', marginTop: 2 }}>
                          {formatVnd(ms.amount_vnd)}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
                          Hạn nộp: {formatShortDate(ms.expected_pay_date)}
                          {ms.confirmed_by_name ? ` • Xác nhận bởi: ${ms.confirmed_by_name}` : ''}
                        </div>
                        {ms.unc_url && (
                          <a
                            href={ms.unc_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '0.74rem',
                              color: '#1E40FF',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 4,
                            }}
                          >
                            <ExternalLink size={12} /> Xem chứng từ UNC ngân hàng
                          </a>
                        )}
                      </div>

                      {canEdit && ms.status !== 'confirmed' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn primary"
                            onClick={() => void handleMilestoneAction(ms.id, 'confirm')}
                            style={{
                              height: 34,
                              background: '#059669',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <CheckCircle2 size={13} /> Xác nhận UNC
                          </button>
                          <button
                            type="button"
                            className="btn secondary"
                            onClick={() => void handleMilestoneAction(ms.id, 'reject')}
                            style={{ height: 34, color: '#DC2626', fontSize: '0.75rem' }}
                          >
                            <Ban size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Commission Participants */}
                {(detail.commission_shares || []).length > 0 && (
                  <div
                    style={{
                      padding: '0.9rem 1rem',
                      borderRadius: 12,
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                      Phân bổ Hoa hồng Kinh doanh
                    </div>
                    {detail.commission_shares.map((cs) => (
                      <div
                        key={cs.user_id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.8rem',
                          padding: '4px 0',
                        }}
                      >
                        <span>{cs.user_name} ({cs.share_pct}%)</span>
                        <strong style={{ color: '#059669' }}>{formatVnd(cs.amount_vnd)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Discussion & Audit History */}
              <div
                style={{
                  padding: '1.25rem 1.4rem',
                  background: '#F8FAFC',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>
                  <MessageSquare size={16} color="#1E40FF" /> Nhật ký Đối soát & Thảo luận Nội bộ
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                  {(detail.history || []).length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', padding: '1rem 0' }}>
                      Chưa có trao đổi nào trên phiếu đặt cọc này.
                    </div>
                  ) : (
                    detail.history.map((h) => (
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.72rem' }}>
                          <strong style={{ color: '#0F172A' }}>{h.actor_name}</strong>
                          <span>
                            <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                            {formatShortDate(h.created_at)}
                          </span>
                        </div>
                        <div style={{ marginTop: 4, color: '#334155' }}>{h.note}</div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <input
                    className="form-input"
                    style={{ height: 42, background: '#FFFFFF' }}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Gửi ghi chú cho Kế toán / Kinh doanh..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleSendComment();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => void handleSendComment()}
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
