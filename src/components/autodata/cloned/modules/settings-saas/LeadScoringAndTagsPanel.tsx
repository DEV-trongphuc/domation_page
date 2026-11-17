import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Award, CheckSquare, GitBranch, Plus, Power, Tag, Trash2 } from 'lucide-react';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { fetchAPI } from '../../utils/api';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { TableSkeleton } from '../../components/ui/Skeleton';
import type {
  LeadScoringRuleDef,
  WorkflowTaskTemplateDef,
} from './saasSettingsTypes';

interface PipelineStageDto {
  id?: string;
  stage_key: string;
  stage_name: string;
  stage_order: number;
  color_hex: string;
  sla_timeout_minutes: number;
  capi_event_mapping?: string | null;
  is_won_stage?: boolean;
  is_lost_stage?: boolean;
  funnel_category?: string | null;
  score_delta?: number;
}

interface PipelineDto {
  id: string;
  name: string;
  description?: string | null;
  is_default?: boolean;
  stages: PipelineStageDto[];
}

interface TenantTagDto {
  id: string;
  name: string;
  color_hex: string;
  category: string;
}

const TAG_PALETTE = ['#1E40FF', '#0284C7', '#059669', '#D97706', '#DC2626', '#7C3AED', '#475569'];

export const LeadScoringAndTagsPanel: React.FC = () => {
  const { can } = useEntitlement();
  const canManage = can('settings', 'manage_config');

  const [tab, setTab] = useState<'pipelines' | 'scoring' | 'tags' | 'tasks'>('pipelines');
  const [loading, setLoading] = useState(true);

  const [pipelines, setPipelines] = useState<PipelineDto[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#1E40FF');
  const [newStageSla, setNewStageSla] = useState('15');
  const [newStageCapi, setNewStageCapi] = useState('Skip');

  const [scoringRules, setScoringRules] = useState<LeadScoringRuleDef[]>([]);
  const [ruleName, setRuleName] = useState('');
  const [ruleTrigger, setRuleTrigger] = useState<LeadScoringRuleDef['trigger_type']>('field_match');
  const [ruleField, setRuleField] = useState('source');
  const [ruleOperator, setRuleOperator] = useState('equals');
  const [ruleValue, setRuleValue] = useState('');
  const [ruleDelta, setRuleDelta] = useState('15');

  const [tags, setTags] = useState<TenantTagDto[]>([]);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#1E40FF');
  const [tagCategory, setTagCategory] = useState('lead');

  const [taskTemplates, setTaskTemplates] = useState<WorkflowTaskTemplateDef[]>([]);
  const [taskTplName, setTaskTplName] = useState('');
  const [taskTplTitle, setTaskTplTitle] = useState('');
  const [taskTplStage, setTaskTplStage] = useState('');
  const [taskTplDueHours, setTaskTplDueHours] = useState('24');
  const [taskTplPriority, setTaskTplPriority] = useState<WorkflowTaskTemplateDef['priority']>('medium');

  const loadAll = useCallback(async () => {
    try {
      const [pRows, sRows, tRows, legacySettings] = await Promise.all([
        apiRequest<PipelineDto[]>('/pipelines').catch(() => []),
        apiRequest<LeadScoringRuleDef[]>('/org-rbac/lead-scoring-rules').catch(() => []),
        apiRequest<TenantTagDto[]>('/org-rbac/tags').catch(() => []),
        fetchAPI('get_settings').catch(() => null),
      ]);
      const pList = Array.isArray(pRows) ? pRows : [];
      setPipelines(pList);
      setSelectedPipelineId((prev) => prev || pList[0]?.id || '');
      setScoringRules(Array.isArray(sRows) ? sRows : []);
      setTags(Array.isArray(tRows) ? tRows : []);
      const legacyObj =
        legacySettings && typeof legacySettings === 'object'
          ? (legacySettings as Record<string, unknown>)
          : {};
      const legacyData =
        legacyObj.data && typeof legacyObj.data === 'object'
          ? (legacyObj.data as Record<string, unknown>)
          : legacyObj;
      const rawSettings =
        legacyData.settings && typeof legacyData.settings === 'object'
          ? (legacyData.settings as Record<string, unknown>)
          : legacyData;
      if (Array.isArray(rawSettings.workflow_task_templates)) {
        setTaskTemplates(rawSettings.workflow_task_templates as WorkflowTaskTemplateDef[]);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải cấu hình Phễu, Điểm Lead & Nhãn'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await loadAll();
    })();
    return () => {
      active = false;
    };
  }, [loadAll]);

  const activePipeline = pipelines.find((p) => p.id === selectedPipelineId) || pipelines[0] || null;

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) {
      toast.error('Vui lòng nhập Tên Pipeline mới');
      return;
    }
    try {
      const created = await apiRequest<PipelineDto>('/pipelines', {
        method: 'POST',
        body: { name: newPipelineName.trim(), is_default: pipelines.length === 0 },
      });
      setPipelines((prev) => [...prev, created]);
      setSelectedPipelineId(created.id);
      setNewPipelineName('');
      toast.success(`Đã tạo Pipeline "${created.name}"`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Pipeline'));
    }
  };

  const handleDeletePipeline = async (pipelineId: string) => {
    const prev = pipelines;
    setPipelines((p) => p.filter((x) => x.id !== pipelineId));
    try {
      await apiRequest(`/pipelines/${pipelineId}`, { method: 'DELETE' });
      toast.success('Đã xóa Pipeline');
      await loadAll();
    } catch (err) {
      setPipelines(prev);
      toast.error(getErrorMessage(err, 'Không thể xóa Pipeline'));
    }
  };

  const handleAddStage = async () => {
    if (!activePipeline || !newStageName.trim()) {
      toast.error('Vui lòng chọn Pipeline và nhập tên bước mới');
      return;
    }
    const nextStages = [
      ...(activePipeline.stages || []),
      {
        stage_key: newStageName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_'),
        stage_name: newStageName.trim(),
        stage_order: (activePipeline.stages?.length || 0) + 1,
        color_hex: newStageColor,
        sla_timeout_minutes: Math.max(0, Number(newStageSla) || 0),
        capi_event_mapping: newStageCapi || 'Skip',
      },
    ];
    try {
      const updated = await apiRequest<PipelineStageDto[]>(
        `/pipelines/${activePipeline.id}/stages/reorder`,
        { method: 'PUT', body: { stages: nextStages } }
      );
      setPipelines((prev) =>
        prev.map((p) => (p.id === activePipeline.id ? { ...p, stages: updated } : p))
      );
      setNewStageName('');
      toast.success('Đã thêm bước mới vào Pipeline');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thêm bước Pipeline'));
    }
  };

  const handleDeleteStage = async (stageId?: string) => {
    if (!activePipeline || !stageId) return;
    try {
      await apiRequest(`/pipelines/${activePipeline.id}/stages/${stageId}`, { method: 'DELETE' });
      toast.success('Đã xóa bước Pipeline');
      await loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa bước Pipeline'));
    }
  };

  const handleCreateScoringRule = async () => {
    if (!ruleName.trim()) {
      toast.error('Vui lòng nhập Tên luật chấm điểm Lead');
      return;
    }
    try {
      const created = await apiRequest<LeadScoringRuleDef>('/org-rbac/lead-scoring-rules', {
        method: 'POST',
        body: {
          name: ruleName.trim(),
          trigger_type: ruleTrigger,
          condition_json: { field: ruleField.trim(), operator: ruleOperator, value: ruleValue.trim() },
          score_delta: Math.trunc(Number(ruleDelta) || 0),
          priority: scoringRules.length + 1,
        },
      });
      setScoringRules((prev) => [...prev, created]);
      setRuleName('');
      setRuleValue('');
      toast.success(`Đã tạo luật chấm điểm "${created.name}"`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo luật chấm điểm Lead'));
    }
  };

  const handleToggleScoringRule = async (rule: LeadScoringRuleDef) => {
    const prev = scoringRules;
    setScoringRules((list) => list.map((r) => (r.id === rule.id ? { ...r, is_active: !rule.is_active } : r)));
    try {
      await apiRequest(`/org-rbac/lead-scoring-rules/${rule.id}`, {
        method: 'PUT',
        body: { is_active: !rule.is_active },
      });
    } catch (err) {
      setScoringRules(prev);
      toast.error(getErrorMessage(err, 'Không thể cập nhật luật chấm điểm'));
    }
  };

  const handleDeleteScoringRule = async (id: string) => {
    const prev = scoringRules;
    setScoringRules((list) => list.filter((r) => r.id !== id));
    try {
      await apiRequest(`/org-rbac/lead-scoring-rules/${id}`, { method: 'DELETE' });
      toast.success('Đã xóa luật chấm điểm');
    } catch (err) {
      setScoringRules(prev);
      toast.error(getErrorMessage(err, 'Không thể xóa luật chấm điểm'));
    }
  };

  const handleCreateTag = async () => {
    if (!tagName.trim()) {
      toast.error('Vui lòng nhập Tên nhãn (Tag)');
      return;
    }
    try {
      const created = await apiRequest<TenantTagDto>('/org-rbac/tags', {
        method: 'POST',
        body: { name: tagName.trim(), color_hex: tagColor, category: tagCategory },
      });
      setTags((prev) => [...prev, created]);
      setTagName('');
      toast.success(`Đã thêm nhãn "${created.name}"`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo nhãn'));
    }
  };

  const handleDeleteTag = async (id: string) => {
    const prev = tags;
    setTags((list) => list.filter((t) => t.id !== id));
    try {
      await apiRequest(`/org-rbac/tags/${id}`, { method: 'DELETE' });
      toast.success('Đã xóa nhãn');
    } catch (err) {
      setTags(prev);
      toast.error(getErrorMessage(err, 'Không thể xóa nhãn'));
    }
  };

  const persistTaskTemplates = async (next: WorkflowTaskTemplateDef[]) => {
    const prev = taskTemplates;
    setTaskTemplates(next);
    try {
      await apiRequest('/auth/tenant-settings', {
        method: 'PATCH',
        body: { settings: { workflow_task_templates: next } },
      });
      toast.success('Đã lưu Mẫu công việc tự động (Workflow Task Templates)');
    } catch (err) {
      setTaskTemplates(prev);
      toast.error(getErrorMessage(err, 'Không thể lưu Mẫu công việc tự động'));
    }
  };

  const handleAddTaskTemplate = async () => {
    if (!taskTplName.trim() || !taskTplTitle.trim()) {
      toast.error('Vui lòng nhập Tên mẫu và Tiêu đề công việc tạo tự động');
      return;
    }
    const item: WorkflowTaskTemplateDef = {
      id: `tpl_${Date.now()}`,
      name: taskTplName.trim(),
      trigger_stage_id: taskTplStage.trim() || null,
      task_title: taskTplTitle.trim(),
      due_hours: Math.max(1, Number(taskTplDueHours) || 24),
      priority: taskTplPriority,
      assignee_strategy: 'lead_owner',
      is_active: true,
    };
    await persistTaskTemplates([...taskTemplates, item]);
    setTaskTplName('');
    setTaskTplTitle('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E40FF] flex items-center justify-center">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Đa Phễu Bán hàng (Multi-Pipeline), Điểm Lead, Nhãn & Mẫu Công việc
            </h3>
            <p className="text-xs text-slate-500">
              Cấu hình từng bước trong nhiều Pipeline, chấm điểm Lead Score tự động, bộ nhãn và task theo giai đoạn.
            </p>
          </div>
        </div>

        <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1">
          {[
            { id: 'pipelines', label: `Phễu & Bước (${pipelines.length})`, icon: <GitBranch className="w-3.5 h-3.5" /> },
            { id: 'scoring', label: `Điểm Lead (${scoringRules.length})`, icon: <Award className="w-3.5 h-3.5" /> },
            { id: 'tags', label: `Nhãn Tag (${tags.length})`, icon: <Tag className="w-3.5 h-3.5" /> },
            { id: 'tasks', label: `Mẫu Task (${taskTemplates.length})`, icon: <CheckSquare className="w-3.5 h-3.5" /> },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as typeof tab)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                tab === item.id ? 'bg-[#1E40FF] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : tab === 'pipelines' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={activePipeline?.id || ''}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold min-w-[220px]"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.is_default ? '(Mặc định)' : ''}
                </option>
              ))}
            </select>
            {canManage && (
              <>
                <input
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  placeholder="Tên Pipeline mới (VD: Dự án B2B Enterprise)"
                  className="h-11 px-3 rounded-xl border border-slate-200 text-sm flex-1 min-w-[220px]"
                />
                <button
                  type="button"
                  onClick={() => void handleCreatePipeline()}
                  className="h-11 px-4 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Tạo Phễu
                </button>
                {activePipeline && pipelines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => void handleDeletePipeline(activePipeline.id)}
                    className="h-11 px-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-semibold"
                  >
                    Xóa Phễu này
                  </button>
                )}
              </>
            )}
          </div>

          {activePipeline && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(activePipeline.stages || []).map((st, idx) => (
                  <div
                    key={st.id || `${st.stage_key}-${idx}`}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: st.color_hex || '#1E40FF' }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {idx + 1}. {st.stage_name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {st.stage_key} • SLA {st.sla_timeout_minutes || 0}p • CAPI: {st.capi_event_mapping || 'Skip'}
                        </div>
                      </div>
                    </div>
                    {canManage && st.id && (activePipeline.stages?.length || 0) > 1 && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteStage(st.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {canManage && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  <input
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="Tên bước mới..."
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm sm:col-span-2"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newStageColor}
                      onChange={(e) => setNewStageColor(e.target.value)}
                      className="w-10 h-10 p-1 rounded-xl border border-slate-200 bg-white"
                    />
                    <input
                      type="number"
                      min={0}
                      value={newStageSla}
                      onChange={(e) => setNewStageSla(e.target.value)}
                      placeholder="SLA (phút)"
                      className="w-full h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                    />
                  </div>
                  <select
                    value={newStageCapi}
                    onChange={(e) => setNewStageCapi(e.target.value)}
                    className="h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  >
                    <option value="Skip">Không bắn CAPI</option>
                    <option value="Lead">Meta: Lead</option>
                    <option value="Schedule">Meta: Schedule</option>
                    <option value="InitiateCheckout">Meta: InitiateCheckout</option>
                    <option value="Purchase">Meta: Purchase</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleAddStage()}
                    className="h-10 px-3 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm bước
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : tab === 'scoring' ? (
        <div className="space-y-4">
          {canManage && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
              <input
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Tên luật (VD: Khách để lại Email DN)"
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm lg:col-span-2"
              />
              <select
                value={ruleTrigger}
                onChange={(e) => setRuleTrigger(e.target.value as LeadScoringRuleDef['trigger_type'])}
                className="h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="field_match">Khớp dữ liệu trường</option>
                <option value="stage_reached">Đạt bước Pipeline</option>
                <option value="form_submitted">Điền Form Web</option>
                <option value="email_opened">Mở Email chiến dịch</option>
                <option value="web_visit">Truy cập trang định giá</option>
              </select>
              <input
                value={ruleField}
                onChange={(e) => setRuleField(e.target.value)}
                placeholder="Trường (VD: source)"
                className="h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono"
              />
              <div className="flex items-center gap-1.5">
                <select
                  value={ruleOperator}
                  onChange={(e) => setRuleOperator(e.target.value)}
                  className="h-10 px-2 rounded-xl border border-slate-200 bg-white text-xs"
                >
                  <option value="equals">=</option>
                  <option value="contains">chứa</option>
                  <option value="not_empty">có giá trị</option>
                </select>
                <input
                  value={ruleValue}
                  onChange={(e) => setRuleValue(e.target.value)}
                  placeholder="Giá trị..."
                  className="w-full h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={ruleDelta}
                  onChange={(e) => setRuleDelta(e.target.value)}
                  placeholder="+Điểm"
                  className="w-20 h-10 px-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-[#1E40FF]"
                />
                <button
                  type="button"
                  onClick={() => void handleCreateScoringRule()}
                  className="flex-1 h-10 px-3 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  + Lưu luật
                </button>
              </div>
            </div>
          )}

          {scoringRules.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
              Chưa có quy tắc chấm điểm Lead tự động.
            </div>
          ) : (
            <div className="space-y-2">
              {scoringRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{rule.name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {rule.trigger_type} • {rule.condition_json?.field || '*'}{' '}
                      {rule.condition_json?.operator || '='} &quot;{rule.condition_json?.value || '*'}&quot;
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${
                        rule.score_delta >= 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {rule.score_delta >= 0 ? `+${rule.score_delta}` : rule.score_delta} điểm
                    </span>
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleToggleScoringRule(rule)}
                          className={`p-2 rounded-lg border ${
                            rule.is_active
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-100 text-slate-400'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteScoringRule(rule.id)}
                          className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === 'tags' ? (
        <div className="space-y-4">
          {canManage && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3">
              <input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Tên Nhãn toàn hệ thống (VD: VIP Enterprise, Cần gấp)"
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm flex-1 min-w-[200px]"
              />
              <select
                value={tagCategory}
                onChange={(e) => setTagCategory(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="lead">Phạm vi: Lead</option>
                <option value="deal">Phạm vi: Deal</option>
                <option value="contact">Phạm vi: Contact</option>
                <option value="ticket">Phạm vi: Ticket</option>
                <option value="project">Phạm vi: Dự án</option>
              </select>
              <div className="flex items-center gap-1">
                {TAG_PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setTagColor(hex)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      tagColor === hex ? 'border-slate-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => void handleCreateTag()}
                className="h-10 px-4 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold"
              >
                + Thêm Nhãn
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2.5">
            {tags.length === 0 ? (
              <div className="w-full text-center py-8 text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
                Chưa có nhãn hệ thống nào.
              </div>
            ) : (
              tags.map((tg) => (
                <div
                  key={tg.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm text-xs font-semibold"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tg.color_hex }} />
                  <span className="text-slate-800">{tg.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase">{tg.category}</span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteTag(tg.id)}
                      className="text-slate-400 hover:text-red-600 ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {canManage && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <input
                value={taskTplName}
                onChange={(e) => setTaskTplName(e.target.value)}
                placeholder="Tên quy trình mẫu"
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
              />
              <input
                value={taskTplTitle}
                onChange={(e) => setTaskTplTitle(e.target.value)}
                placeholder="Tiêu đề Task tự động (VD: Gửi báo giá PDF)"
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm lg:col-span-2"
              />
              <input
                value={taskTplStage}
                onChange={(e) => setTaskTplStage(e.target.value)}
                placeholder="Khi đạt bước (VD: Qualified)"
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-mono"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  value={taskTplDueHours}
                  onChange={(e) => setTaskTplDueHours(e.target.value)}
                  className="w-16 h-10 px-2 rounded-xl border border-slate-200 bg-white text-sm"
                  title="Hạn hoàn thành (giờ)"
                />
                <select
                  value={taskTplPriority}
                  onChange={(e) => setTaskTplPriority(e.target.value as WorkflowTaskTemplateDef['priority'])}
                  className="h-10 px-2 rounded-xl border border-slate-200 bg-white text-xs"
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Vừa</option>
                  <option value="high">Cao</option>
                  <option value="urgent">Khẩn</option>
                </select>
                <button
                  type="button"
                  onClick={() => void handleAddTaskTemplate()}
                  className="h-10 px-3 rounded-xl bg-[#1E40FF] hover:bg-blue-700 text-white text-xs font-semibold shrink-0"
                >
                  + Thêm
                </button>
              </div>
            </div>
          )}

          {taskTemplates.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
              Chưa có mẫu công việc (Task Template) tự động theo bước Pipeline.
            </div>
          ) : (
            <div className="space-y-2">
              {taskTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-900">
                      {tpl.name} → <span className="text-[#1E40FF]">{tpl.task_title}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Trigger bước: <code>{tpl.trigger_stage_id || 'Bất kỳ'}</code> • Hạn: {tpl.due_hours}h • Ưu tiên:{' '}
                      <span className="uppercase">{tpl.priority}</span>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() =>
                        void persistTaskTemplates(taskTemplates.filter((item) => item.id !== tpl.id))
                      }
                      className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
