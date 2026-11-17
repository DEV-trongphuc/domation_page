import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  GitMerge,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { TableSkeleton } from '../../components/ui/Skeleton';
import type { OrgRole } from './saasSettingsTypes';

interface WorkflowStepDto {
  step_order: number;
  step_name: string;
  approver_type: 'direct_manager' | 'department_manager' | 'role' | 'specific_user' | 'tenant_admin';
  approver_role_id?: string | null;
  approver_user_id?: string | null;
  min_amount_threshold?: number;
  max_amount_threshold?: number | null;
  sla_hours?: number;
  approval_mode?: 'any_one' | 'all_must_approve';
}

interface ApprovalWorkflowRecord {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  is_active: boolean;
  steps?: WorkflowStepDto[];
}

interface ApprovalDelegationRecord {
  id: string;
  delegator_name?: string;
  delegate_user_id: string;
  delegate_name?: string;
  valid_from: string;
  valid_until: string;
  reason?: string | null;
  is_active: boolean;
}

interface PeerUser {
  id: string;
  full_name: string;
  email?: string;
}

export interface AutoApproveRuleItem {
  id?: string | number;
  name?: string;
  active?: boolean;
  reason?: string;
  condition?: string;
  min_call_attempts?: number;
  max_wait_minutes?: number;
  auto_compensate?: boolean;
  label?: string;
  keywords?: string[];
  min_calls?: number;
  enabled?: boolean;
}

interface ApprovalsRulesSettingsTabProps {
  ticketAutoApproveEnabled?: boolean;
  onChangeTicketAutoApproveEnabled?: (next: boolean) => void;
  ticketAutoApproveRules?: AutoApproveRuleItem[];
  onOpenRuleModal?: () => void;
  onEditRule?: (rule: AutoApproveRuleItem, index: number) => void;
  onDeleteTicketRule?: (index: number) => void;
}

const WORKFLOW_CATEGORIES = [
  { key: 'leave', label: 'Nghỉ phép & Công tác' },
  { key: 'expense', label: 'Đề nghị Tạm ứng / Chi phí' },
  { key: 'purchase', label: 'Mua sắm PO & Tài sản' },
  { key: 'discount_quote', label: 'Duyệt Giảm giá / Báo giá VIP' },
  { key: 'ticket', label: 'Ticket Bù số & Ngoại lệ' },
  { key: 'custom_form', label: 'Quy trình Nội bộ tùy chỉnh' },
];

export const ApprovalsRulesSettingsTab: React.FC<ApprovalsRulesSettingsTabProps> = ({
  ticketAutoApproveEnabled,
  onChangeTicketAutoApproveEnabled,
  ticketAutoApproveRules,
  onOpenRuleModal,
  onEditRule,
  onDeleteTicketRule,
}) => {
  const { hasModule, can } = useEntitlement();
  const canManage = can('approvals', 'manage_config') || can('settings', 'manage_config');
  const hasErpApprovals = hasModule('erp_approvals');

  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<ApprovalWorkflowRecord[]>([]);
  const [delegations, setDelegations] = useState<ApprovalDelegationRecord[]>([]);
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [peers, setPeers] = useState<PeerUser[]>([]);

  // New Workflow Builder
  const [wfName, setWfName] = useState('');
  const [wfCategory, setWfCategory] = useState('expense');
  const [steps, setSteps] = useState<WorkflowStepDto[]>([
    {
      step_order: 1,
      step_name: 'Trưởng bộ phận duyệt',
      approver_type: 'direct_manager',
      min_amount_threshold: 0,
      max_amount_threshold: null,
      sla_hours: 24,
      approval_mode: 'any_one',
    },
  ]);

  // New Delegation Form
  const [delegateUserId, setDelegateUserId] = useState('');
  const [delegateUntil, setDelegateUntil] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400_000);
    return d.toISOString().slice(0, 10);
  });
  const [delegateReason, setDelegateReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [wfRes, delRes, roleRows, peerRows] = await Promise.all([
        hasErpApprovals ? apiRequest<ApprovalWorkflowRecord[]>('/approvals/workflows').catch(() => []) : Promise.resolve([]),
        hasErpApprovals ? apiRequest<ApprovalDelegationRecord[]>('/approvals/delegations').catch(() => []) : Promise.resolve([]),
        apiRequest<OrgRole[]>('/org-rbac/roles').catch(() => []),
        apiRequest<PeerUser[]>('/users/peers').catch(() => []),
      ]);
      setWorkflows(Array.isArray(wfRes) ? wfRes : []);
      setDelegations(Array.isArray(delRes) ? delRes : []);
      setRoles(Array.isArray(roleRows) ? roleRows : []);
      setPeers(Array.isArray(peerRows) ? peerRows : []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải cấu hình Quy trình Phê duyệt'));
    } finally {
      setLoading(false);
    }
  }, [hasErpApprovals]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await loadData();
    })();
    return () => {
      active = false;
    };
  }, [loadData]);

  const handleAddStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        step_order: prev.length + 1,
        step_name: `Bước duyệt ${prev.length + 1}`,
        approver_type: 'department_manager',
        min_amount_threshold: 10_000_000,
        max_amount_threshold: null,
        sla_hours: 24,
        approval_mode: 'any_one',
      },
    ]);
  };

  const handleCreateWorkflow = async () => {
    if (!wfName.trim()) {
      toast.error('Vui lòng nhập Tên quy trình phê duyệt');
      return;
    }
    try {
      const created = await apiRequest<ApprovalWorkflowRecord>('/approvals/workflows', {
        method: 'POST',
        body: {
          name: wfName.trim(),
          category: wfCategory,
          steps: steps.map((s, idx) => ({ ...s, step_order: idx + 1 })),
        },
      });
      setWorkflows((prev) => [created, ...prev]);
      setWfName('');
      toast.success(`Đã tạo quy trình phê duyệt "${created.name}"`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo quy trình phê duyệt'));
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    const prev = workflows;
    setWorkflows((list) => list.filter((w) => w.id !== id));
    try {
      await apiRequest(`/approvals/workflows/${id}`, { method: 'DELETE' });
      toast.success('Đã xóa quy trình phê duyệt');
    } catch (err) {
      setWorkflows(prev);
      toast.error(getErrorMessage(err, 'Không thể xóa quy trình phê duyệt'));
    }
  };

  const handleCreateDelegation = async () => {
    if (!delegateUserId) {
      toast.error('Vui lòng chọn Người nhận ủy quyền');
      return;
    }
    try {
      const created = await apiRequest<ApprovalDelegationRecord>('/approvals/delegations', {
        method: 'POST',
        body: {
          delegate_user_id: delegateUserId,
          valid_from: new Date().toISOString(),
          valid_until: new Date(`${delegateUntil}T23:59:59`).toISOString(),
          reason: delegateReason.trim() || 'Ủy quyền xử lý hồ sơ',
        },
      });
      setDelegations((prev) => [created, ...prev]);
      setDelegateUserId('');
      setDelegateReason('');
      toast.success('Đã thiết lập ủy quyền phê duyệt');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo ủy quyền phê duyệt'));
    }
  };

  const handleDeleteDelegation = async (id: string) => {
    const prev = delegations;
    setDelegations((list) => list.filter((d) => d.id !== id));
    try {
      await apiRequest(`/approvals/delegations/${id}`, { method: 'DELETE' });
      toast.success('Đã thu hồi ủy quyền');
    } catch (err) {
      setDelegations(prev);
      toast.error(getErrorMessage(err, 'Không thể thu hồi ủy quyền'));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Auto-Approve Ticket Rules (CRM SLA & Compensations) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E40FF] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tự động Duyệt Ticket Báo lỗi Data & Bù số
              </h3>
              <p className="text-xs text-slate-500">
                Thiết lập quy tắc tự động duyệt Ticket khi Sale đã nỗ lực gọi đủ số lần và đúng lý do quy định.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onChangeTicketAutoApproveEnabled && (
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(ticketAutoApproveEnabled)}
                  onChange={(e) => onChangeTicketAutoApproveEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-[#1E40FF] focus:ring-[#1E40FF]"
                />
                Bật Auto-Approve Ticket
              </label>
            )}
            {onOpenRuleModal && canManage && (
              <button
                type="button"
                onClick={onOpenRuleModal}
                className="h-10 px-4 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm quy tắc Ticket
              </button>
            )}
          </div>
        </div>

        {!ticketAutoApproveRules || ticketAutoApproveRules.length === 0 ? (
          <div className="text-sm text-slate-500 py-4 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200">
            Chưa có quy tắc Auto-Approve Ticket nào. Nhấn &quot;Thêm quy tắc Ticket&quot; hoặc bật công tắc để thiết lập.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ticketAutoApproveRules.map((rule, idx) => (
              <div
                key={rule.id || idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {rule.name || rule.label || rule.reason || `Quy tắc #${idx + 1}`}
                  </div>
                  <div className="text-xs text-slate-500">
                    {Array.isArray(rule.keywords) && rule.keywords.length > 0
                      ? `Từ khóa: ${rule.keywords.join(', ')}`
                      : `Tối thiểu ${rule.min_call_attempts ?? rule.min_calls ?? 0} cuộc gọi`}{' '}
                    •{' '}
                    {rule.active === false || rule.enabled === false
                      ? 'Đang tạm tắt'
                      : rule.auto_compensate
                        ? 'Tự động bù số'
                        : 'Tự động duyệt'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {onEditRule && (
                    <button
                      type="button"
                      onClick={() => onEditRule(rule, idx)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                    >
                      Sửa
                    </button>
                  )}
                  {onDeleteTicketRule && (
                    <button
                      type="button"
                      onClick={() => onDeleteTicketRule(idx)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Multi-step Approval Workflows + Delegations */}
      {hasErpApprovals && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <GitMerge className="w-5 h-5 text-[#1E40FF]" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Quy trình Phê duyệt Đa cấp N-Bước (N-Step Workflows)
                </h4>
                <p className="text-xs text-slate-500">
                  Định tuyến chứng từ theo bậc hạn mức tiền, phòng ban hoặc vai trò cụ thể.
                </p>
              </div>
            </div>

            {canManage && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    value={wfName}
                    onChange={(e) => setWfName(e.target.value)}
                    placeholder="Tên quy trình (VD: Duyệt chi trên 10tr)"
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                  />
                  <select
                    value={wfCategory}
                    onChange={(e) => setWfCategory(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                  >
                    {WORKFLOW_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  {steps.map((st, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                      <input
                        value={st.step_name}
                        onChange={(e) =>
                          setSteps((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, step_name: e.target.value } : x))
                          )
                        }
                        placeholder={`Bước ${idx + 1}`}
                        className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold"
                      />
                      <select
                        value={st.approver_type}
                        onChange={(e) =>
                          setSteps((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? { ...x, approver_type: e.target.value as WorkflowStepDto['approver_type'] }
                                : x
                            )
                          )
                        }
                        className="h-9 px-2 rounded-lg border border-slate-200 text-xs"
                      >
                        <option value="direct_manager">Quản lý trực tiếp</option>
                        <option value="department_manager">Trưởng phòng ban</option>
                        <option value="role">Theo Vai trò</option>
                        <option value="specific_user">Nhân sự chỉ định</option>
                        <option value="tenant_admin">Quản trị viên (CEO)</option>
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={st.min_amount_threshold ?? 0}
                        onChange={(e) =>
                          setSteps((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, min_amount_threshold: Number(e.target.value) || 0 } : x
                            )
                          )
                        }
                        placeholder="Ngưỡng tiền từ (VND)"
                        className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs tabular-nums"
                      />
                      {st.approver_type === 'role' && (
                        <select
                          value={st.approver_role_id || ''}
                          onChange={(e) =>
                            setSteps((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, approver_role_id: e.target.value } : x))
                            )
                          }
                          className="h-9 px-2 rounded-lg border border-slate-200 text-xs sm:col-span-3"
                        >
                          <option value="">-- Chọn Vai trò duyệt --</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {st.approver_type === 'specific_user' && (
                        <select
                          value={st.approver_user_id || ''}
                          onChange={(e) =>
                            setSteps((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, approver_user_id: e.target.value } : x))
                            )
                          }
                          className="h-9 px-2 rounded-lg border border-slate-200 text-xs sm:col-span-3"
                        >
                          <option value="">-- Chọn Người duyệt --</option>
                          {peers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.full_name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="text-xs font-semibold text-[#1E40FF] hover:underline"
                    >
                      + Thêm cấp duyệt tiếp theo
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCreateWorkflow()}
                      className="h-10 px-4 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      Lưu Quy trình
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <TableSkeleton rows={3} cols={2} />
            ) : workflows.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">Chưa có quy trình đa cấp nào.</div>
            ) : (
              <div className="space-y-2">
                {workflows.map((wf) => (
                  <div
                    key={wf.id}
                    className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">{wf.name}</div>
                      <div className="text-xs text-slate-500">
                        {wf.category} • {wf.steps?.length || 1} cấp duyệt
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Hoạt động
                      </span>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteWorkflow(wf.id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <UserCheck className="w-5 h-5 text-[#1E40FF]" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Ủy quyền Phê duyệt Tạm thời (Delegations)</h4>
                <p className="text-xs text-slate-500">
                  Bàn giao quyền ký duyệt khi Trưởng bộ phận nghỉ phép hoặc công tác.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <select
                value={delegateUserId}
                onChange={(e) => setDelegateUserId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="">-- Chọn người nhận ủy quyền --</option>
                {peers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} {p.email ? `(${p.email})` : ''}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="date"
                  value={delegateUntil}
                  onChange={(e) => setDelegateUntil(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                />
                <input
                  value={delegateReason}
                  onChange={(e) => setDelegateReason(e.target.value)}
                  placeholder="Lý do ủy quyền..."
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleCreateDelegation()}
                className="w-full h-10 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold"
              >
                + Thiết lập Ủy quyền
              </button>
            </div>

            <div className="space-y-2">
              {delegations.map((del) => (
                <div
                  key={del.id}
                  className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {del.delegator_name || 'Bạn'} → {del.delegate_name || del.delegate_user_id}
                    </div>
                    <div className="text-slate-500">
                      Hết hạn: {new Date(del.valid_until).toLocaleDateString('vi-VN')} • {del.reason || 'Ủy quyền'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteDelegation(del.id)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
