import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit2,
  History,
  Play,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Workflow,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  EmptyState,
  FormCard,
} from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import {
  FLOW_NODES_11,
  FLOW_TRIGGERS_15,
  type FlowDefinitionDto,
  type FlowNodeType11,
  type FlowSnapshotItem,
  type FlowStepNode,
  type FlowTraceItem,
} from './flowConstants';
import { FlowTree } from './FlowTree';
import {
  FlowReviewModal,
  FlowSimulateModal,
  FlowSnapshotHistoryModal,
} from './FlowModals';

interface FlowsListResponse {
  items?: FlowDefinitionDto[];
  templates?: Array<{ id: string; name: string }>;
  rounds?: Array<{ id: string; name: string }>;
  vouchers?: Array<{ id: string; name: string }>;
}

export const MarketingFlowsPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology, can } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'canvas'>('list');
  const [flows, setFlows] = useState<FlowDefinitionDto[]>([]);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
  const [rounds, setRounds] = useState<Array<{ id: string; name: string }>>([]);
  const [vouchers, setVouchers] = useState<Array<{ id: string; name: string }>>([]);

  // Canvas Editor State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState('Kịch bản Nuôi dưỡng -> Đẩy Vòng Chia Sale');
  const [triggerType, setTriggerType] = useState('form_submitted');
  const [steps, setSteps] = useState<FlowStepNode[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Add Node Picker Modal
  const [pendingInsert, setPendingInsert] = useState<{
    parentId: string | null;
    branch: 'next' | 'yes' | 'no' | 'A' | 'B';
  } | null>(null);

  // Modals
  const [simOpen, setSimOpen] = useState(false);
  const [reviewData, setReviewData] = useState<{
    score: number;
    grade: string;
    findings: Array<{ severity: string; message: string }>;
  } | null>(null);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<FlowSnapshotItem[]>([]);

  const fetchFlows = useCallback(async () => {
    return apiRequest<FlowsListResponse>('/marketing/flows', { token, tenantSlug });
  }, [token, tenantSlug]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFlows();
      setFlows(res.items || []);
      setTemplates(res.templates || []);
      setRounds(res.rounds || []);
      setVouchers(res.vouchers || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách Automation Flows.'));
    } finally {
      setLoading(false);
    }
  }, [fetchFlows]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchFlows();
        if (cancelled) return;
        setFlows(res.items || []);
        setTemplates(res.templates || []);
        setRounds(res.rounds || []);
        setVouchers(res.vouchers || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchFlows]);

  const openNewCanvas = () => {
    const s1 = crypto.randomUUID();
    const s2 = crypto.randomUUID();
    const s3 = crypto.randomUUID();
    const s4 = crypto.randomUUID();

    setEditingId(null);
    setFlowName(`Nuôi dưỡng ${terminology.customerLabel} Nóng -> Chia Sale Auto Data`);
    setTriggerType('form_submitted');
    setSteps([
      {
        id: s1,
        type: 'send_email',
        label: 'Gửi Email chào mừng & Tài liệu',
        config: { subject: 'Tài liệu dành riêng cho {{lead.name}}' },
        nextStepId: s2,
      },
      {
        id: s2,
        type: 'update_lead_score',
        label: 'Cộng +35 Điểm nóng tương tác',
        config: { delta: 35 },
        nextStepId: s3,
      },
      {
        id: s3,
        type: 'if_else_condition',
        label: 'Kiểm tra Điểm nóng >= 30',
        config: { field: 'lead_score', operator: 'gte', value: 30 },
        yesStepId: s4,
        noStepId: null,
      },
      {
        id: s4,
        type: 'push_to_autodata_sale_round',
        label: 'Đẩy vào Vòng chia Sale Auto Data',
        config: { round_id: '' },
        nextStepId: null,
      },
    ]);
    setSelectedStepId(s4);
    setMode('canvas');
  };

  const openExistingFlow = (f: FlowDefinitionDto) => {
    setEditingId(f.id);
    setFlowName(f.name);
    setTriggerType(f.trigger_type);
    setSteps(f.steps || []);
    setSelectedStepId(f.steps[0]?.id || null);
    setMode('canvas');
  };

  const handleConfirmAddNode = (nodeType: FlowNodeType11, label: string) => {
    if (!pendingInsert) return;
    const newId = crypto.randomUUID();
    const newNode: FlowStepNode = {
      id: newId,
      type: nodeType,
      label,
      config:
        nodeType === 'if_else_condition'
          ? { field: 'lead_score', operator: 'gte', value: 30 }
          : nodeType === 'ab_split'
            ? { ratio_a: 50 }
            : nodeType === 'update_lead_score'
              ? { delta: 15 }
              : nodeType === 'wait_delay'
                ? { duration: 24, unit: 'hours' }
                : {},
      nextStepId: null,
    };

    setSteps((prev) => {
      if (!pendingInsert.parentId) {
        return [...prev, newNode];
      }
      return [
        ...prev.map((s) => {
          if (s.id !== pendingInsert.parentId) return s;
          if (pendingInsert.branch === 'yes') return { ...s, yesStepId: newId };
          if (pendingInsert.branch === 'no') return { ...s, noStepId: newId };
          if (pendingInsert.branch === 'A') return { ...s, pathAStepId: newId };
          if (pendingInsert.branch === 'B') return { ...s, pathBStepId: newId };
          return { ...s, nextStepId: newId };
        }),
        newNode,
      ];
    });

    setSelectedStepId(newId);
    setPendingInsert(null);
  };

  const handleDeleteNode = (stepId: string) => {
    setSteps((prev) =>
      prev
        .filter((s) => s.id !== stepId)
        .map((s) => ({
          ...s,
          nextStepId: s.nextStepId === stepId ? null : s.nextStepId,
          yesStepId: s.yesStepId === stepId ? null : s.yesStepId,
          noStepId: s.noStepId === stepId ? null : s.noStepId,
          pathAStepId: s.pathAStepId === stepId ? null : s.pathAStepId,
          pathBStepId: s.pathBStepId === stepId ? null : s.pathBStepId,
        }))
    );
    if (selectedStepId === stepId) setSelectedStepId(null);
  };

  const selectedStep = useMemo(
    () => steps.find((s) => s.id === selectedStepId) || null,
    [steps, selectedStepId]
  );

  const updateSelectedStep = (patch: Partial<FlowStepNode>) => {
    if (!selectedStepId) return;
    setSteps((prev) => prev.map((s) => (s.id === selectedStepId ? { ...s, ...patch } : s)));
  };

  const ensureSavedFlowId = async (): Promise<string | null> => {
    setSaving(true);
    try {
      const payload = {
        name: flowName.trim(),
        trigger_type: triggerType,
        steps,
      };
      if (editingId) {
        await apiRequest(`/marketing/flows/${editingId}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body: payload,
        });
        return editingId;
      }
      const created = await apiRequest<FlowDefinitionDto>('/marketing/flows', {
        method: 'POST',
        token,
        tenantSlug,
        body: payload,
      });
      setEditingId(created.id);
      return created.id;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu kịch bản Flow.'));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    const id = await ensureSavedFlowId();
    if (id) {
      toast.success('Đã lưu sơ đồ Automation Flow!');
      await reload();
    }
  };

  const handlePublishSnapshot = async () => {
    const id = await ensureSavedFlowId();
    if (!id) return;
    try {
      const res = await apiRequest<{
        flow: FlowDefinitionDto;
        review: { score: number; grade: string; findings: Array<{ severity: string; message: string }> };
      }>(`/marketing/flows/${id}/publish`, {
        method: 'POST',
        token,
        tenantSlug,
      });
      toast.success(`Đã kích hoạt Flow (Snapshot v${res.flow.version}) & đăng ký Event-Bus Real-time!`);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể kích hoạt Flow.'));
    }
  };

  const handleRunReview = async () => {
    const id = await ensureSavedFlowId();
    if (!id) return;
    try {
      const res = await apiRequest<{
        score: number;
        grade: string;
        findings: Array<{ severity: string; message: string }>;
      }>(`/marketing/flows/${id}/review`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { trigger_type: triggerType, steps },
      });
      setReviewData(res);
    } catch (err) {
      toast.error(getErrorMessage(err, 'DOM Agent không thể kiểm toán Flow.'));
    }
  };

  const handleOpenSnapshots = async () => {
    const id = await ensureSavedFlowId();
    if (!id) return;
    try {
      const res = await apiRequest<{ snapshots?: FlowSnapshotItem[] }>(`/marketing/flows/${id}`, {
        token,
        tenantSlug,
      });
      setSnapshots(res.snapshots || []);
      setSnapshotsOpen(true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải lịch sử phiên bản.'));
    }
  };

  const handleRestoreSnapshot = async (snapId: string) => {
    if (!editingId) return;
    try {
      const restored = await apiRequest<FlowDefinitionDto>(
        `/marketing/flows/${editingId}/restore-snapshot`,
        {
          method: 'POST',
          token,
          tenantSlug,
          body: { snapshot_id: snapId },
        }
      );
      setTriggerType(restored.trigger_type);
      setSteps(restored.steps || []);
      setSnapshotsOpen(false);
      toast.success('Đã khôi phục sơ đồ từ Snapshot thành công!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể khôi phục Snapshot.'));
    }
  };

  const runDrySimulate = async (sample: { name: string; lead_score: number; email_consent: string }) => {
    const id = await ensureSavedFlowId();
    if (!id) return null;
    return apiRequest<{ trace: FlowTraceItem[]; wouldPushToSaleRound: boolean }>(
      `/marketing/flows/${id}/simulate`,
      {
        method: 'POST',
        token,
        tenantSlug,
        body: { steps, sample_lead: sample },
      }
    );
  };

  const handleDeleteFlow = async (id: string) => {
    try {
      await apiRequest(`/marketing/flows/${id}`, { method: 'DELETE', token, tenantSlug });
      toast.success('Đã xóa kịch bản Flow.');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa Flow.'));
    }
  };

  if (loading) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang tải Visual Automation Flow Builder (15 Triggers × 11 Nodes)..."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#F8F9FA' }}>
      <Card padding="1.25rem 1.5rem" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 15,
                background: '#EEF2FF',
                border: '1px solid #DBEAFE',
                color: '#1E40FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Workflow size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Automation Flows (15 Triggers × 11 Nodes)
                </h1>
                <Badge tone="primary">Event-Bus Real-time</Badge>
                <Badge tone="success">Cross-Ecosystem Sale Handoff</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
                Sơ đồ cây trực quan, giả lập nhánh, <strong>DOM Agent</strong> rà lỗi & Node đẩy thẳng vào <strong>Vòng chia Sale Auto Data</strong>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ScreenHelpButton screenKey="mkt_flows" />
            {mode === 'list' ? (
              <>
                <button type="button" onClick={() => void reload()} className="btn secondary" style={{ height: 44 }}>
                  <RefreshCw size={15} />
                </button>
                {can('automation_flows', 'create') && (
                  <button
                    type="button"
                    onClick={openNewCanvas}
                    style={{
                      height: 44,
                      padding: '0 1.2rem',
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
                    <Plus size={16} /> Tạo Kịch Bản Mới
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="button" onClick={() => setMode('list')} className="btn secondary" style={{ height: 44 }}>
                  Danh sách Flow
                </button>
                <button
                  type="button"
                  onClick={() => void handleOpenSnapshots()}
                  className="btn secondary"
                  style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <History size={15} /> Snapshots
                </button>
                <button
                  type="button"
                  onClick={() => setSimOpen(true)}
                  className="btn secondary"
                  style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Play size={15} /> Giả lập
                </button>
                <button
                  type="button"
                  onClick={() => void handleRunReview()}
                  className="btn secondary"
                  style={{ height: 44, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700 }}
                >
                  <Sparkles size={15} /> DOM Agent Rà Lỗi
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveDraft()}
                  className="btn secondary"
                  style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Save size={15} /> Lưu nháp
                </button>
                <button
                  type="button"
                  onClick={() => void handlePublishSnapshot()}
                  style={{
                    height: 44,
                    padding: '0 1.2rem',
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
                  <CheckCircle2 size={15} /> Kích Hoạt & Lưu Snapshot
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      {mode === 'list' ? (
        flows.length === 0 ? (
          <EmptyState
            icon={<Workflow size={24} />}
            title="Chưa có Kịch bản Tự động hóa nào"
            description="Thiết kế luồng chăm sóc tự động 24/7 kết nối trực tiếp từ Form/Survey/Email sang Vòng chia Sale Fair-Share."
            action={
              <button
                type="button"
                onClick={openNewCanvas}
                style={{
                  height: 44,
                  padding: '0 1.25rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Mở Visual Flow Builder
              </button>
            }
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
            {flows.map((f) => (
              <FormCard
                key={f.id}
                icon={<Workflow size={18} />}
                title={f.name}
                description={`Trigger: ${f.trigger_type} • v${f.version}`}
                badge={
                  <Badge tone={f.status === 'active' ? 'success' : 'neutral'}>
                    {f.status === 'active' ? 'Đang chạy Real-time' : 'Bản nháp'}
                  </Badge>
                }
                footer={
                  <>
                    <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                      {f.enrolled_count} lượt chạy • {f.pushed_to_sale_count} chuyển Sale • {formatShortDate(f.updated_at)}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => openExistingFlow(f)}
                        className="btn secondary sm"
                        style={{ height: 36, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Edit2 size={13} /> Mở Sơ đồ
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteFlow(f.id)}
                        className="btn secondary sm"
                        style={{ height: 36, color: '#DC2626' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                }
              >
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Badge tone="primary">{f.steps?.length || 0} Nodes</Badge>
                  {f.steps?.some((s) => s.type === 'push_to_autodata_sale_round') && (
                    <Badge tone="success">Có Node Đẩy Vòng Chia Sale</Badge>
                  )}
                </div>
              </FormCard>
            ))}
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card title="Cấu Hình Kịch Bản & Điểm Kích Hoạt (15 Triggers)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Tên kịch bản Automation Flow</label>
                  <input className="form-input" style={{ height: 44 }} value={flowName} onChange={(e) => setFlowName(e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Chọn sự kiện Kích hoạt (15 Triggers)</label>
                  <select
                    className="form-input"
                    style={{ height: 44 }}
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                  >
                    {FLOW_TRIGGERS_15.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            <FlowTree
              triggerType={triggerType}
              steps={steps}
              selectedStepId={selectedStepId}
              onSelectStep={setSelectedStepId}
              onRequestAddAfter={(parentId, branch = 'next') => setPendingInsert({ parentId, branch })}
              onDeleteStep={handleDeleteNode}
            />
          </div>

          <Card
            title="Cấu Hình Node Đang Chọn"
            subtitle={selectedStep ? `Loại node: ${selectedStep.type}` : 'Nhấn vào 1 Node trên sơ đồ cây'}
          >
            {selectedStep ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Nhãn hiển thị trên Sơ đồ</label>
                  <input
                    className="form-input"
                    style={{ height: 44 }}
                    value={selectedStep.label || ''}
                    onChange={(e) => updateSelectedStep({ label: e.target.value })}
                  />
                </div>

                {selectedStep.type === 'send_email' && (
                  <>
                    <div>
                      <label className="form-label" style={{ fontWeight: 700 }}>Mẫu Email sử dụng</label>
                      <select
                        className="form-input"
                        style={{ height: 44 }}
                        value={String(selectedStep.config?.template_id || '')}
                        onChange={(e) =>
                          updateSelectedStep({ config: { ...(selectedStep.config || {}), template_id: e.target.value } })
                        }
                      >
                        <option value="">— Chọn mẫu Email —</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontWeight: 700 }}>Tiêu đề gửi</label>
                      <input
                        className="form-input"
                        style={{ height: 44 }}
                        value={String(selectedStep.config?.subject || '')}
                        onChange={(e) =>
                          updateSelectedStep({ config: { ...(selectedStep.config || {}), subject: e.target.value } })
                        }
                      />
                    </div>
                  </>
                )}

                {selectedStep.type === 'if_else_condition' && (
                  <>
                    <div>
                      <label className="form-label" style={{ fontWeight: 700 }}>Trường kiểm tra</label>
                      <select
                        className="form-input"
                        style={{ height: 44 }}
                        value={String(selectedStep.config?.field || 'lead_score')}
                        onChange={(e) =>
                          updateSelectedStep({ config: { ...(selectedStep.config || {}), field: e.target.value } })
                        }
                      >
                        <option value="lead_score">Điểm nóng (lead_score)</option>
                        <option value="email_consent">Trạng thái Email (email_consent)</option>
                        <option value="total_revenue_vnd">Tổng doanh thu (total_revenue_vnd)</option>
                        <option value="tags">Nhãn phân loại (tags)</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <select
                        className="form-input"
                        style={{ height: 44 }}
                        value={String(selectedStep.config?.operator || 'gte')}
                        onChange={(e) =>
                          updateSelectedStep({ config: { ...(selectedStep.config || {}), operator: e.target.value } })
                        }
                      >
                        <option value="gte">&gt;= (Lớn hơn bằng)</option>
                        <option value="eq">= (Bằng chính xác)</option>
                        <option value="contains">Chứa giá trị</option>
                      </select>
                      <input
                        className="form-input"
                        style={{ height: 44 }}
                        value={String(selectedStep.config?.value ?? '30')}
                        onChange={(e) =>
                          updateSelectedStep({ config: { ...(selectedStep.config || {}), value: e.target.value } })
                        }
                      />
                    </div>
                  </>
                )}

                {selectedStep.type === 'update_lead_score' && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 700 }}>Số điểm cộng / trừ (Delta)</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ height: 44 }}
                      value={String(selectedStep.config?.delta ?? 15)}
                      onChange={(e) =>
                        updateSelectedStep({ config: { ...(selectedStep.config || {}), delta: Number(e.target.value) } })
                      }
                    />
                  </div>
                )}

                {selectedStep.type === 'add_remove_tag' && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 700 }}>Tên Nhãn (Tag)</label>
                    <input
                      className="form-input"
                      style={{ height: 44 }}
                      value={String(selectedStep.config?.tag || 'VIP')}
                      onChange={(e) =>
                        updateSelectedStep({ config: { ...(selectedStep.config || {}), tag: e.target.value } })
                      }
                    />
                  </div>
                )}

                {selectedStep.type === 'issue_voucher' && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 700 }}>Kho Mã Voucher phát hành</label>
                    <select
                      className="form-input"
                      style={{ height: 44 }}
                      value={String(selectedStep.config?.voucher_campaign_id || '')}
                      onChange={(e) =>
                        updateSelectedStep({
                          config: { ...(selectedStep.config || {}), voucher_campaign_id: e.target.value },
                        })
                      }
                    >
                      <option value="">— Mã tự sinh mặc định —</option>
                      {vouchers.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedStep.type === 'push_to_autodata_sale_round' && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      Vòng chia Sale Auto Data đích (Fair-Share)
                    </label>
                    <select
                      className="form-input"
                      style={{ height: 44 }}
                      value={String(selectedStep.config?.round_id || '')}
                      onChange={(e) =>
                        updateSelectedStep({ config: { ...(selectedStep.config || {}), round_id: e.target.value } })
                      }
                    >
                      <option value="">— Vòng chia mặc định ưu tiên cao nhất —</option>
                      {rounds.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                Chọn một Node bất kỳ trên Sơ đồ cây để cấu hình chi tiết.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 11-Node Picker Modal */}
      <CustomModal
        isOpen={Boolean(pendingInsert)}
        onClose={() => setPendingInsert(null)}
        title="Chọn Bước Tiếp Theo (11 Action & Logic Nodes)"
        width={640}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {FLOW_NODES_11.map((n) => (
            <FormCard
              key={n.type}
              title={n.label}
              description={n.desc}
              badge={<Badge tone={n.tone}>{n.type === 'push_to_autodata_sale_round' ? 'Auto Data' : 'Node'}</Badge>}
              onClick={() => handleConfirmAddNode(n.type, n.label)}
            />
          ))}
        </div>
      </CustomModal>

      <FlowSimulateModal
        isOpen={simOpen}
        onClose={() => setSimOpen(false)}
        onRunSimulate={runDrySimulate}
      />

      <FlowReviewModal
        isOpen={Boolean(reviewData)}
        onClose={() => setReviewData(null)}
        review={reviewData}
      />

      <FlowSnapshotHistoryModal
        isOpen={snapshotsOpen}
        onClose={() => setSnapshotsOpen(false)}
        snapshots={snapshots}
        onRestore={(sid) => void handleRestoreSnapshot(sid)}
      />
    </div>
  );
};

export default MarketingFlowsPage;
