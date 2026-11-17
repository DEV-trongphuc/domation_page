import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Send,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import {
  CATEGORY_LABELS,
  evaluateRequestSla,
  type ApprovalCategory,
  type ApprovalRequestDto,
  type ApprovalWorkflowDto,
  type DirectoryUserItem,
  type SimulatedStepPlan,
} from './approvalTypes';

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

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '0.76rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
};

/* ============================================================================
 * 1. NEW REQUEST MODAL (Dynamic form_schema + Linked Entity Meta + Live Preview)
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
  const [selectedWfId, setSelectedWfId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [amountVnd, setAmountVnd] = useState<string>('0');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [beneficiaryBank, setBeneficiaryBank] = useState('');
  const [beneficiaryAccount, setBeneficiaryAccount] = useState('');
  const [hasVatInvoice, setHasVatInvoice] = useState(false);
  const [totalDays, setTotalDays] = useState('1');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [simulatedSteps, setSimulatedSteps] = useState<SimulatedStepPlan[] | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentWf =
    activeWorkflows.find((w) => w.id === selectedWfId) || activeWorkflows[0] || null;

  const isFinancialCategory =
    currentWf?.category === 'deposit' ||
    currentWf?.category === 'cash_advance' ||
    currentWf?.category === 'expense';
  const isLeaveCategory =
    currentWf?.category === 'leave' ||
    currentWf?.category === 'overtime' ||
    currentWf?.category === 'attendance_explanation';

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
    if (currentWf.require_attachment && !attachmentUrl.trim()) {
      toast.error('Quy trình này bắt buộc đính kèm đường dẫn chứng từ gốc.');
      return;
    }

    setSubmitting(true);
    try {
      const parsedFormData: Record<string, unknown> = {};
      if (isFinancialCategory) {
        if (beneficiaryBank.trim()) parsedFormData.beneficiary_bank = beneficiaryBank.trim();
        if (beneficiaryAccount.trim()) parsedFormData.beneficiary_account = beneficiaryAccount.trim();
        parsedFormData.has_vat_invoice = hasVatInvoice;
      }
      if (isLeaveCategory) {
        parsedFormData.total_days = Math.max(0.5, Number(totalDays || 1));
      }

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
          linked_entity_type: currentWf.category === 'deposit' ? 'deposit' : null,
          form_data: parsedFormData,
          attachments: attachmentUrl.trim() ? [attachmentUrl.trim()] : [],
        },
      });
      toast.success('Đã trình duyệt tờ trình thành công!');
      setTitle('');
      setAmountVnd('0');
      setDescription('');
      setAttachmentUrl('');
      setBeneficiaryBank('');
      setBeneficiaryAccount('');
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
            <label style={LABEL_STYLE}>Giá trị ngân sách / Hạn mức tiền (VNĐ)</label>
            <input
              type="number"
              min={0}
              step={100000}
              value={amountVnd}
              onChange={(e) => {
                setAmountVnd(e.target.value);
                setSimulatedSteps(null);
              }}
              placeholder="0"
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
            placeholder="Ví dụ: Đề xuất giải ngân đặt cọc đợt 1 / Tạm ứng công tác phí..."
            style={INPUT_STYLE}
          />
        </div>

        {isFinancialCategory && (
          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: 14,
              background: '#F8FAFF',
              border: '1px solid #DBEAFE',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.8rem',
              alignItems: 'center',
            }}
          >
            <div>
              <label style={LABEL_STYLE}>Ngân hàng thụ hưởng (VietQR)</label>
              <input
                type="text"
                value={beneficiaryBank}
                onChange={(e) => setBeneficiaryBank(e.target.value)}
                placeholder="Vietcombank / Techcombank / MB..."
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Số tài khoản nhận giải ngân</label>
              <input
                type="text"
                value={beneficiaryAccount}
                onChange={(e) => setBeneficiaryAccount(e.target.value)}
                placeholder="Nhập số tài khoản..."
                style={INPUT_STYLE}
              />
            </div>
            {currentWf?.category === 'expense' && (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 700, marginTop: 18 }}>
                <input
                  type="checkbox"
                  checked={hasVatInvoice}
                  onChange={(e) => setHasVatInvoice(e.target.checked)}
                />
                Có kèm Hóa đơn Đỏ VAT (GTGT)
              </label>
            )}
          </div>
        )}

        {isLeaveCategory && (
          <div style={{ maxWidth: 260 }}>
            <label style={LABEL_STYLE}>Tổng số ngày nghỉ / công đề xuất</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={totalDays}
              onChange={(e) => setTotalDays(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
        )}

        {(currentWf?.form_schema || []).length > 0 && (
          <div
            style={{
              padding: '0.95rem 1rem',
              borderRadius: 14,
              background: '#F8F9FA',
              border: '1px solid #E2E8F0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
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
            <label style={LABEL_STYLE}>Từ ngày</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Đến ngày</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>
              Đường dẫn chứng từ đính kèm {currentWf?.require_attachment ? '*' : ''}
            </label>
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
            placeholder="Nhập căn cứ phê duyệt..."
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
              Kiểm tra trước các cấp duyệt kích hoạt theo Hạn mức tiền & Sơ đồ Tổ chức
            </span>
            <button
              type="button"
              onClick={() => void handleSimulate()}
              disabled={simulating || !currentWf}
              className="btn secondary"
              style={{ height: 38, fontSize: '0.8rem', color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Sparkles size={14} /> {simulating ? 'Đang tính...' : 'Xem trước lộ trình N bước'}
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
                    <strong style={{ color: '#1E40FF' }}>Bước {st.step_order}:</strong> {st.step_name} ({st.sla_hours}h SLA)
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {st.assignees.map((a) => (
                      <Badge key={a.assigned_user_id} tone={a.delegated_from_user_id ? 'warning' : 'info'}>
                        {a.assigned_user_name}
                        {a.delegated_from_user_id ? ' (Duyệt thay OOO)' : ''}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
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
            <Send size={15} /> {submitting ? 'Đang trình duyệt...' : 'Trình duyệt ngay'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};

/* ============================================================================
 * 2. OUT-OF-OFFICE DELEGATION MODAL
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
  const [validUntil, setValidUntil] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().slice(0, 10);
  });
  const [selectedCategories, setSelectedCategories] = useState<ApprovalCategory[]>([]);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleCategory = (cat: ApprovalCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

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
          categories: selectedCategories,
          valid_from: `${validFrom}T00:00:00.000Z`,
          valid_until: `${validUntil}T23:59:59.000Z`,
          reason: reason.trim() || 'Ủy quyền phê duyệt vắng mặt (Out-of-Office)',
        },
      });
      toast.success('Đã kích hoạt ủy quyền phê duyệt vắng mặt!');
      setDelegateUserId('');
      setReason('');
      setSelectedCategories([]);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo ủy quyền phê duyệt.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Thiết Lập Ủy Quyền Duyệt Thay (Out-of-Office)" width={600}>
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
          <label style={LABEL_STYLE}>Phạm vi nhóm tờ trình (Để trống = Ủy quyền toàn bộ)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(Object.entries(CATEGORY_LABELS) as Array<[ApprovalCategory, string]>).map(([cat, lbl]) => {
              const active = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 999,
                    border: active ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                    background: active ? '#EEF2FF' : '#FFFFFF',
                    color: active ? '#1E40FF' : '#475569',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>Lý do ủy quyền</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Đi công tác đối tác nước ngoài / Nghỉ phép năm..."
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

/* ============================================================================
 * 3. INLINE TIMELINE & SLA ESCALATION BADGES FOR TABLE ROWS
 * ============================================================================ */
export const StepTimelineInlineBadge: React.FC<{ req: ApprovalRequestDto }> = ({ req }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
    {(req.step_logs || []).map((lg) => (
      <span
        key={lg.id}
        title={`Bước ${lg.step_order}: ${lg.step_name} (${lg.assigned_user_name || ''})${lg.delegated_from_user_name ? ` — Duyệt thay cho ${lg.delegated_from_user_name}` : ''}`}
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
        B{lg.step_order}: {lg.assigned_user_name || 'Người duyệt'}
        {lg.delegated_from_user_name ? ' (OOO)' : ''}
      </span>
    ))}
  </div>
);

export const RequestSlaInlineBadge: React.FC<{
  req: ApprovalRequestDto;
  nowMs: number;
}> = ({ req, nowMs }) => {
  const sla = evaluateRequestSla(req, nowMs);
  if (sla.state === 'none') return null;
  return (
    <Badge
      tone={sla.tone}
      icon={sla.state === 'overdue' ? <AlertTriangle size={11} /> : <Clock size={11} />}
    >
      {sla.label}
    </Badge>
  );
};
