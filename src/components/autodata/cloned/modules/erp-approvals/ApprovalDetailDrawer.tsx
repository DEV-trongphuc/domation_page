import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eraser,
  PenTool,
  RotateCcw,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { DrawerSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import {
  CATEGORY_LABELS,
  evaluateRequestSla,
  evaluateStepSla,
  getStatusBadgeMeta,
  resolveDeepLinkedPreview,
  type ApprovalRequestDto,
  type ApprovalWorkflowDto,
} from './approvalTypes';
import { ApprovalLinkedPreviewCards } from './ApprovalLinkedPreviewCards';

export interface ApprovalDetailDrawerProps {
  request: ApprovalRequestDto | null;
  workflows?: ApprovalWorkflowDto[];
  onClose: () => void;
  canApprove: boolean;
  token: string | null;
  tenantSlug: string | null;
  onDecided: () => void;
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 0.85rem',
  borderRadius: 12,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: '0.85rem',
  outline: 'none',
};

const ApprovalDetailDrawerInner: React.FC<{
  initialRequest: ApprovalRequestDto;
  workflows: ApprovalWorkflowDto[];
  onClose: () => void;
  canApprove: boolean;
  token: string | null;
  tenantSlug: string | null;
  onDecided: () => void;
}> = ({ initialRequest, workflows, onClose, canApprove, token, tenantSlug, onDecided }) => {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ApprovalRequestDto>(initialRequest);
  const [rawLinkedPreview, setRawLinkedPreview] = useState<Record<string, unknown> | null>(
    initialRequest.linked_preview || null
  );
  const [nowMs, setNowMs] = useState<number>(() => new Date().getTime());

  // Decision Action Bar States
  const [comment, setComment] = useState('');
  const [manualSigOpen, setManualSigOpen] = useState(false);
  const [hasDrawnSig, setHasDrawnSig] = useState(false);
  const [acting, setActing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(new Date().getTime()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadDetail = async () => {
      try {
        const [reqRes, prevRes] = await Promise.all([
          apiRequest<ApprovalRequestDto>(`/approvals/requests/${initialRequest.id}`, {
            token,
            tenantSlug,
          }).catch(() => null),
          apiRequest<Record<string, unknown>>(`/approvals/requests/${initialRequest.id}/linked-preview`, {
            token,
            tenantSlug,
          }).catch(() => null),
        ]);
        if (!mounted) return;
        if (reqRes) {
          setDetail((prev) => ({
            ...prev,
            ...reqRes,
            can_current_user_act: reqRes.can_current_user_act ?? prev.can_current_user_act,
          }));
        }
        if (prevRes) {
          setRawLinkedPreview(prevRes);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadDetail();
    return () => {
      mounted = false;
    };
  }, [initialRequest.id, token, tenantSlug]);

  const matchedWorkflow = useMemo(
    () => workflows.find((w) => w.id === detail.workflow_id) || null,
    [workflows, detail.workflow_id]
  );

  const currentStepRequiresSignature = useMemo(() => {
    const activeLog = (detail.step_logs || []).find(
      (l) => l.step_order === detail.current_step_order && l.status === 'pending'
    );
    if (activeLog?.require_signature) return true;
    const wfStep = matchedWorkflow?.steps.find((s) => s.step_order === detail.current_step_order);
    return Boolean(wfStep?.require_signature);
  }, [detail.step_logs, detail.current_step_order, matchedWorkflow]);

  const showSigCanvas = currentStepRequiresSignature || manualSigOpen;

  const resolvedPreview = useMemo(
    () => resolveDeepLinkedPreview(detail, rawLinkedPreview),
    [detail, rawLinkedPreview]
  );

  const requestSla = useMemo(() => evaluateRequestSla(detail, nowMs), [detail, nowMs]);
  const statusMeta = getStatusBadgeMeta(detail.status);
  const canActNow = Boolean(canApprove && detail.status === 'pending' && detail.can_current_user_act);

  const getPt = (
    ev: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in ev && ev.touches.length > 0) {
      return { x: ev.touches[0].clientX - rect.left, y: ev.touches[0].clientY - rect.top };
    }
    const me = ev as React.MouseEvent<HTMLCanvasElement>;
    return { x: me.clientX - rect.left, y: me.clientY - rect.top };
  };

  const startDraw = (ev: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pt = getPt(ev, canvas);
    drawingRef.current = true;
    ctx.strokeStyle = '#1E40FF';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const moveDraw = (ev: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pt = getPt(ev, canvas);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    if (!hasDrawnSig) setHasDrawnSig(true);
  };

  const stopDraw = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSig(false);
  };

  const handleDecision = async (decision: 'approve' | 'reject' | 'return') => {
    if (decision === 'approve' && currentStepRequiresSignature && !hasDrawnSig) {
      toast.error('Bước phê duyệt này bắt buộc đính kèm Chữ ký số xác nhận trên khung Canvas.');
      return;
    }
    setActing(true);
    try {
      const signatureDataUrl =
        hasDrawnSig && canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;
      await apiRequest(`/approvals/requests/${detail.id}/decide`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          decision,
          comment: comment.trim() || null,
          signature_data_url: signatureDataUrl,
        },
      });
      toast.success(
        decision === 'approve'
          ? `Đã phê duyệt tờ trình ${detail.request_code}!`
          : decision === 'return'
            ? `Đã trả lại tờ trình ${detail.request_code} để bổ sung.`
            : `Đã từ chối tờ trình ${detail.request_code}.`
      );
      onDecided();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xử lý phê duyệt tờ trình.'));
    } finally {
      setActing(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9992,
        background: 'rgba(15, 23, 42, 0.44)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(900px, 96vw)',
          height: '100vh',
          background: '#FFFFFF',
          boxShadow: '-16px 0 48px rgba(15, 23, 42, 0.16)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Badge tone="primary">{detail.request_code}</Badge>
              <Badge tone="info">{CATEGORY_LABELS[detail.category] || detail.category}</Badge>
              <Badge tone={statusMeta.tone}>
                {statusMeta.label} ({detail.current_step_order}/{detail.total_steps})
              </Badge>
              {requestSla.state !== 'none' && (
                <Badge
                  tone={requestSla.tone}
                  icon={requestSla.state === 'overdue' ? <AlertTriangle size={11} /> : <Clock size={11} />}
                >
                  {requestSla.label}
                </Badge>
              )}
            </div>
            <h2 style={{ margin: '8px 0 4px', fontSize: '1.12rem', fontWeight: 800, color: '#0F172A' }}>
              {detail.title}
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Người đề xuất: <strong>{detail.requester_name || detail.requester_email}</strong>
              {detail.requester_department_name ? ` • ${detail.requester_department_name}` : ''} • Khởi tạo lúc{' '}
              {formatShortDate(detail.created_at)}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {detail.amount_vnd > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>GIÁ TRỊ PHÊ DUYỆT</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E40FF' }}>
                  {formatVnd(detail.amount_vnd)}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn secondary"
              style={{ width: 40, height: 40, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#F8F9FA', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {loading ? (
            <DrawerSkeleton />
          ) : (
            <>
              {detail.description && (
                <Card title="Nội dung tờ trình & Căn cứ đề xuất" padding="0.95rem 1.15rem">
                  <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.55 }}>
                    {detail.description}
                  </div>
                </Card>
              )}

              {/* Deep Linked-Entity Preview */}
              <ApprovalLinkedPreviewCards preview={resolvedPreview} />

              {/* Additional Custom Form Data */}
              {Object.keys(detail.form_data || {}).length > 0 && (
                <Card title="Dữ liệu Biểu mẫu Mở rộng" padding="0.95rem 1.15rem">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
                    {Object.entries(detail.form_data).map(([k, v]) => {
                      if (v === null || v === undefined || typeof v === 'object') return null;
                      return (
                        <div key={k} style={{ padding: '0.55rem 0.75rem', borderRadius: 10, background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                            {k}
                          </div>
                          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                            {String(v)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* N-Step Visual Workflow Timeline */}
              <Card
                title={`Lộ trình Phê duyệt N Bước (${detail.current_step_order}/${detail.total_steps})`}
                subtitle="Theo dõi thời gian thực SLA leo thang, ủy quyền duyệt thay OOO và chữ ký số từng cấp"
                padding="1rem 1.15rem"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(detail.step_logs || []).map((log) => {
                    const lgMeta = getStatusBadgeMeta(log.status);
                    const stepSla = evaluateStepSla(log.due_at, log.status, nowMs);

                    return (
                      <div
                        key={log.id}
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '0.85rem 1rem',
                          borderRadius: 14,
                          background: log.status === 'pending' ? '#F8FAFF' : '#FFFFFF',
                          border:
                            stepSla.state === 'overdue'
                              ? '1.5px solid #DC2626'
                              : log.status === 'pending'
                                ? '1.5px solid #1E40FF'
                                : '1px solid #E2E8F0',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 999,
                              background:
                                log.status === 'approved'
                                  ? '#10B981'
                                  : log.status === 'rejected'
                                    ? '#DC2626'
                                    : '#1E40FF',
                              color: '#FFFFFF',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {log.step_order}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                                {log.step_name}
                              </span>
                              <Badge tone="neutral">
                                {log.approval_mode === 'all_must_approve' ? 'Tất cả đồng thuận' : '1 người duyệt'}
                              </Badge>
                              {log.delegated_from_user_name && (
                                <Badge tone="warning" icon={<UserCheck size={11} />}>
                                  Duyệt thay cho {log.delegated_from_user_name}
                                </Badge>
                              )}
                            </div>

                            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 4 }}>
                              Người phê duyệt: <strong>{log.assigned_user_name || log.assigned_user_id}</strong>
                            </div>

                            {log.action_comment && (
                              <div style={{ fontSize: '0.8rem', color: '#0F172A', marginTop: 4, fontStyle: 'italic' }}>
                                “{log.action_comment}”
                              </div>
                            )}

                            {log.signature_data_url && (
                              <img
                                src={log.signature_data_url}
                                alt="Chữ ký số"
                                style={{
                                  marginTop: 8,
                                  height: 46,
                                  borderRadius: 8,
                                  border: '1px solid #E2E8F0',
                                  background: '#FFFFFF',
                                  padding: 4,
                                }}
                              />
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                          <Badge tone={lgMeta.tone}>{lgMeta.label}</Badge>
                          {stepSla.state !== 'none' && (
                            <Badge
                              tone={stepSla.tone}
                              icon={stepSla.state === 'overdue' ? <AlertTriangle size={11} /> : <Clock size={11} />}
                            >
                              {stepSla.label}
                            </Badge>
                          )}
                          {log.acted_at && (
                            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              Xử lý lúc {formatShortDate(log.acted_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </div>

        {/* Sticky Decision Action Bar */}
        {canActNow && !loading && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #DBEAFE',
              background: '#FFFFFF',
              boxShadow: '0 -8px 24px rgba(15, 23, 42, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhập ý kiến phê duyệt, ghi chú kế toán hoặc lý do trả lại..."
                style={{ ...INPUT_STYLE, flex: 1, minWidth: 240 }}
              />
              {!currentStepRequiresSignature && (
                <button
                  type="button"
                  onClick={() => setManualSigOpen((v) => !v)}
                  className="btn secondary"
                  style={{ height: 44, padding: '0 0.95rem', fontSize: '0.8rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <PenTool size={14} /> {manualSigOpen ? 'Ẩn ký số' : 'Đính kèm Chữ ký số'}
                </button>
              )}
            </div>

            {showSigCanvas && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 14,
                  background: '#F8FAFF',
                  border: '1px dashed #1E40FF',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E40FF' }}>
                    {currentStepRequiresSignature
                      ? 'Bước duyệt này bắt buộc Chữ ký số xác nhận *'
                      : 'Khung vẽ Chữ ký số xác nhận (HTML5 Canvas)'}
                  </span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#64748B',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0,
                    }}
                  >
                    <Eraser size={13} /> Xóa ký lại
                  </button>
                </div>

                <canvas
                  ref={canvasRef}
                  width={360}
                  height={96}
                  onMouseDown={startDraw}
                  onMouseMove={moveDraw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={moveDraw}
                  onTouchEnd={stopDraw}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    cursor: 'crosshair',
                    maxWidth: '100%',
                    touchAction: 'none',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={acting}
                onClick={() => void handleDecision('reject')}
                style={{
                  height: 44,
                  padding: '0 1.15rem',
                  borderRadius: 12,
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  background: 'rgba(220, 38, 38, 0.08)',
                  color: '#DC2626',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <XCircle size={16} /> Từ chối
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={() => void handleDecision('return')}
                style={{
                  height: 44,
                  padding: '0 1.15rem',
                  borderRadius: 12,
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  background: 'rgba(217, 119, 6, 0.08)',
                  color: '#D97706',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={16} /> Trả lại bổ sung
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={() => void handleDecision('approve')}
                style={{
                  height: 44,
                  padding: '0 1.45rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(30, 64, 255, 0.25)',
                }}
              >
                <CheckCircle2 size={16} /> {acting ? 'Đang xử lý...' : 'Phê duyệt ngay'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ApprovalDetailDrawer: React.FC<ApprovalDetailDrawerProps> = ({
  request,
  workflows = [],
  onClose,
  canApprove,
  token,
  tenantSlug,
  onDecided,
}) => {
  if (!request || typeof document === 'undefined') return null;
  return createPortal(
    <ApprovalDetailDrawerInner
      key={request.id}
      initialRequest={request}
      workflows={workflows}
      onClose={onClose}
      canApprove={canApprove}
      token={token}
      tenantSlug={tenantSlug}
      onDecided={onDecided}
    />,
    document.body
  );
};

export default ApprovalDetailDrawer;
