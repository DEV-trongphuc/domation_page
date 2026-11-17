import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  Eraser,
  GitBranch,
  PenTool,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  UserCheck,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import {
  APPROVER_TYPE_LABELS,
  CATEGORY_LABELS,
  getStatusBadgeMeta,
  type ApprovalCategory,
  type ApprovalRequestDto,
  type ApprovalWorkflowDto,
  type ApproverType,
  type DirectoryRoleItem,
  type DirectoryUserItem,
  type DynamicFormFieldSchema,
  type SimulatedStepPlan,
  type WorkflowStepDto,
} from './approvalTypes';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 0.85rem',
  borderRadius: 12,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: '0.86rem',
  outline: 'none',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
};

/* ============================================================================
 * 1. NEW REQUEST MODAL (Dynamic form_schema + Live N-Step Resolver Preview)
 * ============================================================================ */
export const NewApprovalRequestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  workflows: ApprovalWorkflowDto[];
  token: string | null;
  tenantSlug: string | null;
  onCreated: () => void;
}> = ({ isOpen, onClose, workflows, token, tenantSlug, onCreated }) => {
  const activeWorkflows = workflows.filter((w) => w.is_active);
  const [selectedWfId, setSelectedWfId] = useState<string>(activeWorkflows[0]?.id || '');
  const [title, setTitle] = useState('');
  const [amountVnd, setAmountVnd] = useState<string>('0');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [simulatedSteps, setSimulatedSteps] = useState<SimulatedStepPlan[] | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentWf = activeWorkflows.find((w) => w.id === selectedWfId) || activeWorkflows[0] || null;

  const handleSimulate = async () => {
    if (!currentWf) return;
    setSimulating(true);
    try {
      const res = await apiRequest<{ steps: SimulatedStepPlan[] }>(
        `/approvals/workflows/${currentWf.id}/simulate`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: { amount_vnd: Number(amountVnd || 0) },
        }
      );
      setSimulatedSteps(res.steps || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể mô phỏng lộ trình phê duyệt.'));
    } finally {
      setSimulating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWf) {
      toast.error('Vui lòng chọn quy trình phê duyệt.');
      return;
    }
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề tờ trình.');
      return;
    }
    setSubmitting(true);
    try {
      const parsedFormData: Record<string, unknown> = {};
      for (const field of currentWf.form_schema || []) {
        const val = formValues[field.key] ?? '';
        if (field.required && !String(val).trim()) {
          toast.error(`Vui lòng nhập trường bắt buộc: ${field.label}`);
          setSubmitting(false);
          return;
        }
        parsedFormData[field.key] = field.type === 'number' && val !== '' ? Number(val) : val;
      }

      await apiRequest('/approvals/requests', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          workflow_id: currentWf.id,
          title: title.trim(),
          description: description.trim() || null,
          amount_vnd: Number(amountVnd || 0),
          start_date: startDate || null,
          end_date: endDate || null,
          form_data: parsedFormData,
          attachments: attachmentUrl.trim() ? [attachmentUrl.trim()] : [],
        },
      });
      toast.success('Đã gửi tờ trình phê duyệt thành công!');
      setTitle('');
      setAmountVnd('0');
      setDescription('');
      setAttachmentUrl('');
      setFormValues({});
      setSimulatedSteps(null);
      onCreated();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi tờ trình phê duyệt.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Khởi Tạo Tờ Trình Phê Duyệt Động" width={760}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
          <div>
            <label style={LABEL_STYLE}>Quy trình áp dụng *</label>
            <select
              value={currentWf?.id || ''}
              onChange={(e) => {
                setSelectedWfId(e.target.value);
                setSimulatedSteps(null);
              }}
              style={INPUT_STYLE}
            >
              {activeWorkflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({CATEGORY_LABELS[w.category] || w.category})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Giá trị / Hạn mức tiền (VNĐ)</label>
            <input
              type="number"
              min={0}
              step={100000}
              value={amountVnd}
              onChange={(e) => {
                setAmountVnd(e.target.value);
                setSimulatedSteps(null);
              }}
              placeholder="0 (Nhập nếu có ngân sách/chi phí)"
              style={INPUT_STYLE}
            />
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>Tiêu đề tờ trình *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Đề xuất tạm ứng công tác phí / Xin nghỉ phép năm..."
            style={INPUT_STYLE}
          />
        </div>

        {(currentWf?.form_schema || []).length > 0 && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 16,
              background: '#F8FAFF',
              border: '1px solid #DBEAFE',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.85rem',
            }}
          >
            {(currentWf?.form_schema || []).map((field) => (
              <div key={field.key}>
                <label style={LABEL_STYLE}>
                  {field.label} {field.required ? '*' : ''}
                </label>
                {field.type === 'select' && Array.isArray(field.options) ? (
                  <select
                    value={formValues[field.key] || ''}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    style={INPUT_STYLE}
                  >
                    <option value="">-- Chọn --</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    value={formValues[field.key] || ''}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
          <div>
            <label style={LABEL_STYLE}>Từ ngày (Tùy chọn)</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Đến ngày (Tùy chọn)</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Liên kết chứng từ đính kèm</label>
            <input
              type="text"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://..."
              style={INPUT_STYLE}
            />
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>Diễn giải chi tiết</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập lý do hoặc căn cứ phê duyệt..."
            style={{ ...INPUT_STYLE, height: 'auto', padding: '0.75rem 0.85rem' }}
          />
        </div>

        <div
          style={{
            padding: '0.9rem 1rem',
            borderRadius: 14,
            background: '#F8F9FA',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
              Kiểm tra trước lộ trình người duyệt theo Sơ đồ Tổ chức & Hạn mức tiền
            </span>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={simulating || !currentWf}
              className="btn secondary"
              style={{ height: 38, fontSize: '0.8rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Sparkles size={14} /> {simulating ? 'Đang tính...' : 'Xem trước các cấp duyệt'}
            </button>
          </div>
          {simulatedSteps && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {simulatedSteps.map((st) => (
                <div
                  key={st.step_order}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.85rem',
                    borderRadius: 10,
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <strong style={{ color: '#1E40FF' }}>Bước {st.step_order}:</strong> {st.step_name}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {st.assignees.map((a) => (
                      <Badge key={a.assigned_user_id} tone={a.delegated_from_user_id ? 'warning' : 'info'}>
                        {a.assigned_user_name}
                        {a.delegated_from_user_id ? ' (Nhận ủy quyền)' : ''}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44, padding: '0 1.2rem' }}>
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              height: 44,
              padding: '0 1.4rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <Send size={15} /> {submitting ? 'Đang gửi...' : 'Trình duyệt ngay'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};

/* ============================================================================
 * 2. REQUEST DETAIL & 1-CLICK DECISION MODAL (Visual Stepper + Digital Signature)
 * ============================================================================ */
export const ApprovalRequestDetailModal: React.FC<{
  request: ApprovalRequestDto | null;
  onClose: () => void;
  canApprove: boolean;
  token: string | null;
  tenantSlug: string | null;
  onDecided: () => void;
}> = ({ request, onClose, canApprove, token, tenantSlug, onDecided }) => {
  const [comment, setComment] = useState('');
  const [showSigPad, setShowSigPad] = useState(false);
  const [hasDrawnSig, setHasDrawnSig] = useState(false);
  const [acting, setActing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  if (!request) return null;

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    drawingRef.current = true;
    ctx.strokeStyle = '#1E40FF';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const moveDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    if (!hasDrawnSig) setHasDrawnSig(true);
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clearSig = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSig(false);
  };

  const handleDecision = async (decision: 'approve' | 'reject' | 'return') => {
    setActing(true);
    try {
      const sigDataUrl =
        hasDrawnSig && canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;
      await apiRequest(`/approvals/requests/${request.id}/decide`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          decision,
          comment: comment.trim() || null,
          signature_data_url: sigDataUrl,
        },
      });
      toast.success(
        decision === 'approve'
          ? 'Đã phê duyệt tờ trình!'
          : decision === 'return'
            ? 'Đã trả lại tờ trình để bổ sung.'
            : 'Đã từ chối tờ trình.'
      );
      setComment('');
      setHasDrawnSig(false);
      onDecided();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thực hiện thao tác phê duyệt.'));
    } finally {
      setActing(false);
    }
  };

  const statusMeta = getStatusBadgeMeta(request.status);
  const canActNow = Boolean(canApprove && request.status === 'pending' && request.can_current_user_act);

  return (
    <CustomModal
      isOpen={Boolean(request)}
      onClose={onClose}
      title={`Chi Tiết Tờ Trình • ${request.request_code}`}
      width={780}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div
          style={{
            padding: '1rem 1.2rem',
            borderRadius: 16,
            background: '#F8F9FA',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0F172A' }}>{request.title}</span>
              <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
              <Badge tone="info">{CATEGORY_LABELS[request.category] || request.category}</Badge>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
              Người trình: <strong>{request.requester_name || request.requester_email}</strong>
              {request.requester_department_name ? ` • ${request.requester_department_name}` : ''} • Gửi lúc{' '}
              {formatShortDate(request.created_at)}
            </div>
          </div>
          {request.amount_vnd > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>GIÁ TRỊ ĐỀ XUẤT</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E40FF' }}>
                {formatVnd(request.amount_vnd)}
              </div>
            </div>
          )}
        </div>

        {request.description && (
          <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.55 }}>
            <strong>Nội dung diễn giải:</strong> {request.description}
          </div>
        )}

        {Object.keys(request.form_data || {}).length > 0 && (
          <Card title="Thông tin biểu mẫu chi tiết" padding="0.95rem 1.15rem">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              {Object.entries(request.form_data).map(([k, v]) => (
                <div key={k} style={{ padding: '0.55rem 0.75rem', borderRadius: 10, background: '#F8F9FA' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>{k}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {String(v ?? '—')}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card
          title={`Tiến trình Phê duyệt N Cấp (Bước hiện tại: ${request.current_step_order}/${request.total_steps})`}
          padding="1rem 1.15rem"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(request.step_logs || []).map((log) => {
              const lgMeta = getStatusBadgeMeta(log.status);
              return (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '0.75rem 0.95rem',
                    borderRadius: 14,
                    background: log.status === 'pending' ? '#F8FAFF' : '#FFFFFF',
                    border: log.status === 'pending' ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        background: log.status === 'approved' ? '#10B981' : '#1E40FF',
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
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>{log.step_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 2 }}>
                        Người duyệt: <strong>{log.assigned_user_name || log.assigned_user_id}</strong>
                        {log.delegated_from_user_name && (
                          <span style={{ color: '#D97706', fontWeight: 600 }}>
                            {' '}
                            (Nhận ủy quyền từ {log.delegated_from_user_name})
                          </span>
                        )}
                      </div>
                      {log.action_comment && (
                        <div style={{ fontSize: '0.78rem', color: '#0F172A', marginTop: 4, fontStyle: 'italic' }}>
                          “{log.action_comment}”
                        </div>
                      )}
                      {log.signature_data_url && (
                        <img
                          src={log.signature_data_url}
                          alt="Chữ ký số phê duyệt"
                          style={{
                            marginTop: 6,
                            height: 44,
                            borderRadius: 8,
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            padding: 4,
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge tone={lgMeta.tone}>{lgMeta.label}</Badge>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
                      {log.acted_at
                        ? `Lúc ${formatShortDate(log.acted_at)}`
                        : log.due_at
                          ? `Hạn SLA: ${formatShortDate(log.due_at)}`
                          : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {canActNow && (
          <Card title="Xử lý Phê duyệt Tờ trình" padding="1rem 1.15rem" style={{ borderColor: '#1E40FF' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={LABEL_STYLE}>Ý kiến phê duyệt / Ghi chú phản hồi</label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Nhập nhận xét hoặc yêu cầu bổ sung chứng từ..."
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowSigPad((v) => !v)}
                  className="btn secondary"
                  style={{ height: 38, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <PenTool size={14} color="#1E40FF" />
                  {showSigPad ? 'Ẩn khung ký số tay' : 'Đính kèm Chữ ký số xác nhận'}
                </button>
                {showSigPad && (
                  <div style={{ marginTop: 8 }}>
                    <canvas
                      ref={canvasRef}
                      width={420}
                      height={120}
                      onMouseDown={startDraw}
                      onMouseMove={moveDraw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      style={{
                        border: '1px dashed #1E40FF',
                        borderRadius: 12,
                        background: '#FFFFFF',
                        cursor: 'crosshair',
                        maxWidth: '100%',
                      }}
                    />
                    <div>
                      <button
                        type="button"
                        onClick={clearSig}
                        style={{
                          marginTop: 4,
                          border: 'none',
                          background: 'transparent',
                          color: '#64748B',
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Eraser size={13} /> Xóa ký lại
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => handleDecision('reject')}
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
                  onClick={() => handleDecision('return')}
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
                  onClick={() => handleDecision('approve')}
                  style={{
                    height: 44,
                    padding: '0 1.4rem',
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
                  }}
                >
                  <CheckCircle2 size={16} /> Phê duyệt ngay
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </CustomModal>
  );
};

/* ============================================================================
 * 3. WORKFLOW BUILDER STUDIO MODAL (Dynamic N Steps + Thresholds + Form Schema)
 * ============================================================================ */
export const WorkflowBuilderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  editingWorkflow: ApprovalWorkflowDto | null;
  users: DirectoryUserItem[];
  roles: DirectoryRoleItem[];
  token: string | null;
  tenantSlug: string | null;
  onSaved: () => void;
}> = ({ isOpen, onClose, editingWorkflow, users, roles, token, tenantSlug, onSaved }) => {
  const [name, setName] = useState(editingWorkflow?.name || '');
  const [category, setCategory] = useState<ApprovalCategory>(editingWorkflow?.category || 'expense');
  const [description, setDescription] = useState(editingWorkflow?.description || '');
  const [steps, setSteps] = useState<WorkflowStepDto[]>(
    editingWorkflow?.steps && editingWorkflow.steps.length > 0
      ? editingWorkflow.steps
      : [
          {
            step_order: 1,
            step_name: 'Trưởng phòng duyệt nghiệp vụ',
            approver_type: 'department_head',
            min_amount_threshold: 0,
            max_amount_threshold: null,
            approval_mode: 'any_one',
            fallback_strategy: 'escalate_parent_dept',
            sla_hours: 24,
          },
        ]
  );
  const [fields, setFields] = useState<DynamicFormFieldSchema[]>(editingWorkflow?.form_schema || []);
  const [saving, setSaving] = useState(false);

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        step_order: prev.length + 1,
        step_name: `Cấp phê duyệt ${prev.length + 1}`,
        approver_type: 'branch_director',
        min_amount_threshold: 10_000_000,
        max_amount_threshold: null,
        approval_mode: 'any_one',
        fallback_strategy: 'tenant_admin',
        sla_hours: 24,
      },
    ]);
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    const copy = [...steps];
    const tmp = copy[idx];
    copy[idx] = copy[target];
    copy[target] = tmp;
    setSteps(copy.map((s, i) => ({ ...s, step_order: i + 1 })));
  };

  const removeStep = (idx: number) => {
    if (steps.length <= 1) {
      toast.error('Quy trình cần tối thiểu 1 bước phê duyệt.');
      return;
    }
    setSteps(steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_order: i + 1 })));
  };

  const updateStep = (idx: number, patch: Partial<WorkflowStepDto>) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addFormField = () => {
    setFields((prev) => [
      ...prev,
      { key: `field_${prev.length + 1}`, label: 'Trường thông tin mới', type: 'text', required: false },
    ]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên quy trình phê duyệt.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        description: description.trim() || null,
        form_schema: fields,
        steps: steps.map((s, idx) => ({ ...s, step_order: idx + 1 })),
      };
      if (editingWorkflow) {
        await apiRequest(`/approvals/workflows/${editingWorkflow.id}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã cập nhật quy trình phê duyệt N bước!');
      } else {
        await apiRequest('/approvals/workflows', {
          method: 'POST',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã tạo quy trình phê duyệt động mới!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu quy trình phê duyệt.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingWorkflow ? `Chỉnh Sửa Quy Trình: ${editingWorkflow.name}` : 'Thiết Kế Quy Trình Phê Duyệt N Bước'}
      width={860}
    >
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
          <div>
            <label style={LABEL_STYLE}>Tên quy trình phê duyệt *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Phê duyệt Đơn mua hàng PO Đa cấp"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Nhóm nghiệp vụ</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ApprovalCategory)}
              style={INPUT_STYLE}
            >
              {Object.entries(CATEGORY_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>Mô tả ngắn</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Hướng dẫn khi nhân sự chọn luồng duyệt này..."
            style={INPUT_STYLE}
          />
        </div>

        <Card
          title={`Chuỗi Bước Duyệt Động (${steps.length} cấp)`}
          subtitle="Tự động định tuyến theo Sơ đồ Tổ chức & kích hoạt cấp cao hơn theo ngưỡng tiền"
          actions={
            <button
              type="button"
              onClick={addStep}
              className="btn secondary"
              style={{ height: 38, color: '#1E40FF', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Plus size={14} /> Thêm bước duyệt
            </button>
          }
          padding="1rem 1.15rem"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {steps.map((st, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.95rem',
                  borderRadius: 14,
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Badge tone="primary" icon={<GitBranch size={12} />}>
                    Bước {idx + 1}
                  </Badge>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => moveStep(idx, -1)}
                      disabled={idx === 0}
                      className="btn secondary"
                      style={{ height: 32, padding: '0 8px' }}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(idx, 1)}
                      disabled={idx === steps.length - 1}
                      className="btn secondary"
                      style={{ height: 32, padding: '0 8px' }}
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      className="btn secondary"
                      style={{ height: 32, padding: '0 8px', color: '#DC2626' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
                  <div>
                    <label style={LABEL_STYLE}>Tên bước duyệt</label>
                    <input
                      type="text"
                      value={st.step_name}
                      onChange={(e) => updateStep(idx, { step_name: e.target.value })}
                      style={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Cơ chế tìm người duyệt</label>
                    <select
                      value={st.approver_type}
                      onChange={(e) =>
                        updateStep(idx, {
                          approver_type: e.target.value as ApproverType,
                          approver_role_id: null,
                          approver_user_id: null,
                        })
                      }
                      style={INPUT_STYLE}
                    >
                      {Object.entries(APPROVER_TYPE_LABELS).map(([k, lbl]) => (
                        <option key={k} value={k}>
                          {lbl}
                        </option>
                      ))}
                    </select>
                  </div>

                  {st.approver_type === 'specific_role' && (
                    <div>
                      <label style={LABEL_STYLE}>Chọn Vai trò RBAC</label>
                      <select
                        value={st.approver_role_id || ''}
                        onChange={(e) => updateStep(idx, { approver_role_id: e.target.value || null })}
                        style={INPUT_STYLE}
                      >
                        <option value="">-- Chọn vai trò --</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {st.approver_type === 'specific_user' && (
                    <div>
                      <label style={LABEL_STYLE}>Chọn Nhân sự đích danh</label>
                      <select
                        value={st.approver_user_id || ''}
                        onChange={(e) => updateStep(idx, { approver_user_id: e.target.value || null })}
                        style={INPUT_STYLE}
                      >
                        <option value="">-- Chọn nhân sự --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={LABEL_STYLE}>Ngưỡng tiền tối thiểu (VNĐ)</label>
                    <input
                      type="number"
                      min={0}
                      step={500000}
                      value={st.min_amount_threshold}
                      onChange={(e) => updateStep(idx, { min_amount_threshold: Number(e.target.value || 0) })}
                      style={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Chế độ duyệt & SLA (giờ)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: 6 }}>
                      <select
                        value={st.approval_mode}
                        onChange={(e) =>
                          updateStep(idx, { approval_mode: e.target.value as 'any_one' | 'all_must_approve' })
                        }
                        style={INPUT_STYLE}
                      >
                        <option value="any_one">1 người duyệt là qua</option>
                        <option value="all_must_approve">Tất cả phải đồng thuận</option>
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={st.sla_hours}
                        onChange={(e) => updateStep(idx, { sla_hours: Number(e.target.value || 24) })}
                        style={INPUT_STYLE}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Trường dữ liệu động trên Biểu mẫu (Form Schema)"
          actions={
            <button
              type="button"
              onClick={addFormField}
              className="btn secondary"
              style={{ height: 36, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Plus size={14} /> Thêm trường
            </button>
          }
          padding="0.95rem 1.15rem"
        >
          {fields.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Sử dụng các trường mặc định (Tiêu đề, Giá trị tiền, Ngày bắt đầu/kết thúc, Diễn giải). Bấm "Thêm trường" để mở rộng.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fields.map((f, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr auto', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={f.key}
                    onChange={(e) =>
                      setFields((prev) => prev.map((item, i) => (i === idx ? { ...item, key: e.target.value } : item)))
                    }
                    placeholder="Mã trường"
                    style={INPUT_STYLE}
                  />
                  <input
                    type="text"
                    value={f.label}
                    onChange={(e) =>
                      setFields((prev) => prev.map((item, i) => (i === idx ? { ...item, label: e.target.value } : item)))
                    }
                    placeholder="Nhãn hiển thị"
                    style={INPUT_STYLE}
                  />
                  <select
                    value={f.type}
                    onChange={(e) =>
                      setFields((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, type: e.target.value as DynamicFormFieldSchema['type'] } : item
                        )
                      )
                    }
                    style={INPUT_STYLE}
                  >
                    <option value="text">Văn bản</option>
                    <option value="number">Con số</option>
                    <option value="date">Ngày tháng</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setFields((prev) => prev.filter((_, i) => i !== idx))}
                    className="btn secondary"
                    style={{ height: 44, padding: '0 10px', color: '#DC2626' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44, padding: '0 1.2rem' }}>
            Đóng
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              height: 44,
              padding: '0 1.45rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu cấu hình quy trình'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};

/* ============================================================================
 * 4. OUT-OF-OFFICE DELEGATION MODAL
 * ============================================================================ */
export const DelegationCreateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  users: DirectoryUserItem[];
  token: string | null;
  tenantSlug: string | null;
  onSaved: () => void;
}> = ({ isOpen, onClose, users, token, tenantSlug, onSaved }) => {
  const [delegateUserId, setDelegateUserId] = useState('');
  const [validFrom, setValidFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(() =>
    new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10)
  );
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateUserId) {
      toast.error('Vui lòng chọn người nhận ủy quyền duyệt thay.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/approvals/delegations', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          delegate_user_id: delegateUserId,
          valid_from: `${validFrom}T00:00:00.000Z`,
          valid_until: `${validUntil}T23:59:59.000Z`,
          reason: reason.trim() || 'Ủy quyền phê duyệt khi đi công tác / nghỉ phép',
        },
      });
      toast.success('Đã kích hoạt ủy quyền phê duyệt có thời hạn!');
      setDelegateUserId('');
      setReason('');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo ủy quyền phê duyệt.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Thiết Lập Ủy Quyền Duyệt Thay (Out-of-Office)" width={560}>
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={LABEL_STYLE}>Người nhận ủy quyền duyệt thay *</label>
          <select value={delegateUserId} onChange={(e) => setDelegateUserId(e.target.value)} style={INPUT_STYLE}>
            <option value="">-- Chọn nhân sự nhận ủy quyền --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          <div>
            <label style={LABEL_STYLE}>Hiệu lực từ ngày *</label>
            <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Đến hết ngày *</label>
            <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} style={INPUT_STYLE} />
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>Lý do ủy quyền</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Đi công tác miền Bắc / Nghỉ phép năm..."
            style={INPUT_STYLE}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44, padding: '0 1.2rem' }}>
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              height: 44,
              padding: '0 1.35rem',
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
            <UserCheck size={16} /> {saving ? 'Đang lưu...' : 'Kích hoạt ủy quyền'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};

export const StepTimelineInlineBadge: React.FC<{ req: ApprovalRequestDto }> = ({ req }) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {(req.step_logs || []).map((lg) => (
        <span
          key={lg.id}
          title={`Bước ${lg.step_order}: ${lg.step_name} (${lg.assigned_user_name || ''})`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '2px 8px',
            borderRadius: 999,
            fontSize: '0.7rem',
            fontWeight: 700,
            background:
              lg.status === 'approved'
                ? 'rgba(16, 185, 129, 0.12)'
                : lg.status === 'pending'
                  ? 'rgba(30, 64, 255, 0.12)'
                  : lg.status === 'rejected'
                    ? 'rgba(220, 38, 38, 0.12)'
                    : '#F1F5F9',
            color:
              lg.status === 'approved'
                ? '#059669'
                : lg.status === 'pending'
                  ? '#1E40FF'
                  : lg.status === 'rejected'
                    ? '#DC2626'
                    : '#64748B',
          }}
        >
          {lg.status === 'pending' && <Clock size={11} />}
          B{lg.step_order}: {lg.assigned_user_name || 'Approver'}
        </span>
      ))}
    </div>
  );
};
