import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  GitBranch,
  PenTool,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import {
  APPROVER_TYPE_LABELS,
  CATEGORY_LABELS,
  FALLBACK_STRATEGY_LABELS,
  type ApprovalCategory,
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

export interface ApprovalRuleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingWorkflow: ApprovalWorkflowDto | null;
  users: DirectoryUserItem[];
  roles: DirectoryRoleItem[];
  token: string | null;
  tenantSlug: string | null;
  onSaved: () => void;
}

export const ApprovalRuleBuilderModal: React.FC<ApprovalRuleBuilderModalProps> = ({
  isOpen,
  onClose,
  editingWorkflow,
  users,
  roles,
  token,
  tenantSlug,
  onSaved,
}) => {
  const [name, setName] = useState(editingWorkflow?.name || '');
  const [category, setCategory] = useState<ApprovalCategory>(editingWorkflow?.category || 'expense');
  const [description, setDescription] = useState(editingWorkflow?.description || '');
  const [requireAttachment, setRequireAttachment] = useState(Boolean(editingWorkflow?.require_attachment));
  const [steps, setSteps] = useState<WorkflowStepDto[]>(() =>
    editingWorkflow?.steps && editingWorkflow.steps.length > 0
      ? editingWorkflow.steps.map((s, idx) => ({
          ...s,
          step_order: idx + 1,
          require_signature: Boolean(s.require_signature),
        }))
      : [
          {
            step_order: 1,
            step_name: 'Trưởng bộ phận phê duyệt nghiệp vụ',
            approver_type: 'department_head',
            min_amount_threshold: 0,
            max_amount_threshold: null,
            approval_mode: 'any_one',
            fallback_strategy: 'escalate_parent_dept',
            sla_hours: 24,
            require_signature: false,
          },
          {
            step_order: 2,
            step_name: 'Giám đốc Chi nhánh phê duyệt hạn mức cao',
            approver_type: 'branch_director',
            min_amount_threshold: 20_000_000,
            max_amount_threshold: null,
            approval_mode: 'any_one',
            fallback_strategy: 'tenant_admin',
            sla_hours: 12,
            require_signature: true,
          },
        ]
  );
  const [fields, setFields] = useState<DynamicFormFieldSchema[]>(editingWorkflow?.form_schema || []);
  const [saving, setSaving] = useState(false);

  // Condition-branch simulation tester
  const [testAmount, setTestAmount] = useState('25000000');
  const [simResult, setSimResult] = useState<SimulatedStepPlan[] | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        step_order: prev.length + 1,
        step_name: `Cấp phê duyệt điều kiện #${prev.length + 1}`,
        approver_type: 'branch_director',
        min_amount_threshold: 50_000_000,
        max_amount_threshold: null,
        approval_mode: 'any_one',
        fallback_strategy: 'tenant_admin',
        sla_hours: 24,
        require_signature: false,
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
      toast.error('Quy trình phê duyệt cần tối thiểu 1 bước.');
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
      { key: `custom_${prev.length + 1}`, label: 'Trường biểu mẫu mới', type: 'text', required: false },
    ]);
  };

  const handleRunSimulate = async () => {
    if (!editingWorkflow) return;
    setSimLoading(true);
    try {
      const res = await apiRequest<{ steps: SimulatedStepPlan[] }>(
        `/approvals/workflows/${editingWorkflow.id}/simulate`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: { amount_vnd: Number(testAmount || 0) },
        }
      );
      setSimResult(res.steps || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể mô phỏng nhánh điều kiện.'));
    } finally {
      setSimLoading(false);
    }
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
        require_attachment: requireAttachment,
        form_schema: fields,
        steps: steps.map((s, idx) => ({
          ...s,
          step_order: idx + 1,
          min_amount_threshold: Math.max(0, Number(s.min_amount_threshold || 0)),
          max_amount_threshold:
            s.max_amount_threshold !== null && s.max_amount_threshold !== undefined
              ? Math.max(0, Number(s.max_amount_threshold))
              : null,
          sla_hours: Math.max(1, Number(s.sla_hours || 24)),
          require_signature: Boolean(s.require_signature),
        })),
      };

      if (editingWorkflow) {
        await apiRequest(`/approvals/workflows/${editingWorkflow.id}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã lưu quy tắc Nhánh điều kiện & Luồng N bước!');
      } else {
        await apiRequest('/approvals/workflows', {
          method: 'POST',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã tạo quy trình phê duyệt điều kiện mới!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu quy trình phê duyệt.'));
    } finally {
      setSaving(false);
    }
  };

  const formatConditionLabel = (st: WorkflowStepDto): string => {
    const min = Number(st.min_amount_threshold || 0);
    const max = st.max_amount_threshold;
    if (min <= 0 && (max === null || max === undefined)) {
      return 'Nhánh mặc định: Áp dụng mọi hạn mức (≥ 0₫)';
    }
    if (max !== null && max !== undefined && max > 0) {
      return `Nhánh điều kiện: ${formatVnd(min)} ≤ Giá trị ≤ ${formatVnd(max)}`;
    }
    return `Nhánh điều kiện: Giá trị ≥ ${formatVnd(min)}`;
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingWorkflow
          ? `Trình Thiết Kế Nhánh Điều Kiện • ${editingWorkflow.name}`
          : 'Thiết Kế Quy Trình Phê Duyệt N Bước & Nhánh Điều Kiện Hạn Mức'
      }
      width={900}
    >
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '0.85rem' }}>
          <div>
            <label style={LABEL_STYLE}>Tên quy trình phê duyệt *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Phê duyệt Thanh toán & PO Đa Cấp Theo Ngưỡng Ngân Sách"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Phân loại chứng từ gốc</label>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '0.85rem', alignItems: 'center' }}>
          <div>
            <label style={LABEL_STYLE}>Hướng dẫn / Mô tả quy trình</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả quy định chứng từ kèm theo..."
              style={INPUT_STYLE}
            />
          </div>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#0F172A',
              marginTop: 18,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={requireAttachment}
              onChange={(e) => setRequireAttachment(e.target.checked)}
            />
            Bắt buộc đính kèm chứng từ gốc / hóa đơn
          </label>
        </div>

        <Card
          title={`Sơ Đồ Chuỗi Bước & Nhánh Điều Kiện Hạn Mức (${steps.length} cấp)`}
          subtitle="Cấu hình rẽ nhánh tự động `>= min_amount_threshold` & `<= max_amount_threshold`, SLA leo thang và bắt buộc Chữ ký số"
          actions={
            <button
              type="button"
              onClick={addStep}
              style={{
                height: 38,
                padding: '0 0.95rem',
                borderRadius: 10,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Thêm bước điều kiện
            </button>
          }
          padding="1rem 1.15rem"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {steps.map((st, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: 16,
                  background: '#F8F9FA',
                  border: '1px solid #DBEAFE',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Badge tone="primary" icon={<GitBranch size={12} />}>
                      Bước #{idx + 1}
                    </Badge>
                    <Badge tone={st.min_amount_threshold > 0 ? 'warning' : 'info'}>
                      {formatConditionLabel(st)}
                    </Badge>
                    {st.require_signature && (
                      <Badge tone="purple" icon={<PenTool size={11} />}>
                        Bắt buộc Chữ ký số
                      </Badge>
                    )}
                  </div>

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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: 10 }}>
                  <div>
                    <label style={LABEL_STYLE}>Tên bước phê duyệt</label>
                    <input
                      type="text"
                      value={st.step_name}
                      onChange={(e) => updateStep(idx, { step_name: e.target.value })}
                      style={INPUT_STYLE}
                    />
                  </div>

                  <div>
                    <label style={LABEL_STYLE}>Người duyệt theo Tổ chức / RBAC</label>
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
                    <label style={LABEL_STYLE}>Điều kiện `≥` Hạn mức tối thiểu (VNĐ)</label>
                    <input
                      type="number"
                      min={0}
                      step={1000000}
                      value={st.min_amount_threshold}
                      onChange={(e) => updateStep(idx, { min_amount_threshold: Number(e.target.value || 0) })}
                      style={INPUT_STYLE}
                    />
                  </div>

                  <div>
                    <label style={LABEL_STYLE}>Điều kiện `≤` Hạn mức trần (Để trống = Không trần)</label>
                    <input
                      type="number"
                      min={0}
                      step={1000000}
                      value={st.max_amount_threshold ?? ''}
                      onChange={(e) =>
                        updateStep(idx, {
                          max_amount_threshold: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      placeholder="Không giới hạn trần"
                      style={INPUT_STYLE}
                    />
                  </div>

                  <div>
                    <label style={LABEL_STYLE}>Cơ chế đồng thuận</label>
                    <select
                      value={st.approval_mode}
                      onChange={(e) =>
                        updateStep(idx, { approval_mode: e.target.value as 'any_one' | 'all_must_approve' })
                      }
                      style={INPUT_STYLE}
                    >
                      <option value="any_one">Chỉ cần 1 người duyệt (Any One)</option>
                      <option value="all_must_approve">Tất cả đồng thuận 100% (All Must Approve)</option>
                    </select>
                  </div>

                  <div>
                    <label style={LABEL_STYLE}>Chiến lược Dự phòng / Leo thang</label>
                    <select
                      value={st.fallback_strategy}
                      onChange={(e) =>
                        updateStep(idx, {
                          fallback_strategy: e.target.value as 'escalate_parent_dept' | 'tenant_admin',
                        })
                      }
                      style={INPUT_STYLE}
                    >
                      {Object.entries(FALLBACK_STRATEGY_LABELS).map(([k, lbl]) => (
                        <option key={k} value={k}>
                          {lbl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={LABEL_STYLE}>Cam kết thời gian SLA (Giờ)</label>
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={st.sla_hours}
                      onChange={(e) => updateStep(idx, { sla_hours: Number(e.target.value || 24) })}
                      style={INPUT_STYLE}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: 20 }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#1E40FF',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(st.require_signature)}
                        onChange={(e) => updateStep(idx, { require_signature: e.target.checked })}
                      />
                      Bắt buộc ký số Canvas khi duyệt
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Custom Dynamic Form Fields */}
        <Card
          title="Trường Biểu Mẫu Động Tùy Chỉnh (Form Schema)"
          actions={
            <button
              type="button"
              onClick={addFormField}
              className="btn secondary"
              style={{ height: 36, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Plus size={14} /> Thêm trường dữ liệu
            </button>
          }
          padding="0.95rem 1.15rem"
        >
          {fields.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Sử dụng các trường chuẩn (Tiêu đề, Ngân sách VNĐ, Ngày hiệu lực, Chứng từ đính kèm). Bấm "Thêm trường dữ liệu" nếu cần thu thập thêm thông tin riêng.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fields.map((f, idx) => (
                <div
                  key={idx}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr auto auto', gap: 8, alignItems: 'center' }}
                >
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
                    <option value="textarea">Đoạn văn</option>
                  </select>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="checkbox"
                      checked={Boolean(f.required)}
                      onChange={(e) =>
                        setFields((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, required: e.target.checked } : item))
                        )
                      }
                    />
                    Bắt buộc
                  </label>
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

        {editingWorkflow && (
          <Card title="Kiểm Thử Nhánh Điều Kiện Trực Tiếp (Live Rule Simulator)" padding="0.95rem 1.15rem">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <input
                type="number"
                min={0}
                step={1000000}
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                style={{ ...INPUT_STYLE, width: 220 }}
              />
              <button
                type="button"
                disabled={simLoading}
                onClick={() => void handleRunSimulate()}
                className="btn secondary"
                style={{ height: 44, color: '#1E40FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Sparkles size={15} /> {simLoading ? 'Đang kiểm thử...' : 'Mô phỏng nhánh kích hoạt'}
              </button>
            </div>
            {simResult && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {simResult.map((s) => (
                  <Badge key={s.step_order} tone="primary">
                    B{s.step_order}: {s.step_name} ({s.sla_hours}h SLA)
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44, padding: '0 1.2rem' }}>
            Đóng
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              height: 44,
              padding: '0 1.5rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(30, 64, 255, 0.24)',
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu Cấu Hình Nhánh Điều Kiện'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};

export default ApprovalRuleBuilderModal;
