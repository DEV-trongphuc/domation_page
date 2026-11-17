import { apiRequest } from '../../../autodataApi';
import type { SampleSimulationLead } from './FlowSimulateModal';
import type { FlowReviewData } from './FlowReviewModal';
import type {
  FlowDefinitionDto,
  FlowNodeType11,
  FlowSettingsConfig,
  FlowSnapshotItem,
  FlowStepNode,
  FlowTraceItem,
} from './flowConstants';

export function buildStarterFlowSteps(): { steps: FlowStepNode[]; defaultSelectedId: string } {
  const s1 = crypto.randomUUID();
  const s2 = crypto.randomUUID();
  const s3 = crypto.randomUUID();
  const s4 = crypto.randomUUID();

  return {
    defaultSelectedId: s4,
    steps: [
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
        config: { field: 'lead_score', operator: 'gte', value: '30' },
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
    ],
  };
}

export function insertFlowNode(
  steps: FlowStepNode[],
  pendingInsert: { parentId: string | null; branch: 'next' | 'yes' | 'no' | 'A' | 'B' },
  nodeType: FlowNodeType11,
  label: string
): { nextSteps: FlowStepNode[]; newId: string } {
  const newId = crypto.randomUUID();
  const defaultCfg: Record<string, unknown> =
    nodeType === 'if_else_condition'
      ? { field: 'lead_score', operator: 'gte', value: '30' }
      : nodeType === 'ab_split'
        ? { ratio_a: 50 }
        : nodeType === 'update_lead_score'
          ? { delta: 20 }
          : nodeType === 'wait_delay'
            ? { duration: 24, unit: 'hours' }
            : {};

  if (!pendingInsert.parentId) {
    const referenced = new Set<string>();
    for (const s of steps) {
      for (const r of [s.nextStepId, s.yesStepId, s.noStepId, s.pathAStepId, s.pathBStepId]) {
        if (r) referenced.add(r);
      }
    }
    const prevRoot = steps.find((s) => !referenced.has(s.id)) || steps[0] || null;
    const newNode: FlowStepNode = {
      id: newId,
      type: nodeType,
      label,
      config: defaultCfg,
      nextStepId: prevRoot?.id || null,
    };
    return { nextSteps: [newNode, ...steps], newId };
  }

  const parent = steps.find((s) => s.id === pendingInsert.parentId);
  const existingChildId =
    pendingInsert.branch === 'yes'
      ? parent?.yesStepId
      : pendingInsert.branch === 'no'
        ? parent?.noStepId
        : pendingInsert.branch === 'A'
          ? parent?.pathAStepId
          : pendingInsert.branch === 'B'
            ? parent?.pathBStepId
            : parent?.nextStepId;

  const newNode: FlowStepNode = {
    id: newId,
    type: nodeType,
    label,
    config: defaultCfg,
    nextStepId: existingChildId || null,
  };

  const updated = steps.map((s) => {
    if (s.id !== pendingInsert.parentId) return s;
    if (pendingInsert.branch === 'yes') return { ...s, yesStepId: newId };
    if (pendingInsert.branch === 'no') return { ...s, noStepId: newId };
    if (pendingInsert.branch === 'A') return { ...s, pathAStepId: newId };
    if (pendingInsert.branch === 'B') return { ...s, pathBStepId: newId };
    return { ...s, nextStepId: newId };
  });

  return { nextSteps: [...updated, newNode], newId };
}

export function duplicateFlowNode(
  steps: FlowStepNode[],
  stepId: string
): { nextSteps: FlowStepNode[]; copyId: string } | null {
  const src = steps.find((s) => s.id === stepId);
  if (!src) return null;
  const copyId = crypto.randomUUID();
  const copyNode: FlowStepNode = {
    ...src,
    id: copyId,
    label: `${src.label || src.type} (Bản sao)`,
    nextStepId: src.nextStepId || null,
    yesStepId: null,
    noStepId: null,
    pathAStepId: null,
    pathBStepId: null,
  };
  return {
    nextSteps: [...steps.map((s) => (s.id === stepId ? { ...s, nextStepId: copyId } : s)), copyNode],
    copyId,
  };
}

export function removeFlowNode(steps: FlowStepNode[], stepId: string): FlowStepNode[] {
  return steps
    .filter((s) => s.id !== stepId)
    .map((s) => ({
      ...s,
      nextStepId: s.nextStepId === stepId ? null : s.nextStepId,
      yesStepId: s.yesStepId === stepId ? null : s.yesStepId,
      noStepId: s.noStepId === stepId ? null : s.noStepId,
      pathAStepId: s.pathAStepId === stepId ? null : s.pathAStepId,
      pathBStepId: s.pathBStepId === stepId ? null : s.pathBStepId,
    }));
}

export async function saveFlowDraftApi(params: {
  editingId: string | null;
  name: string;
  description: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  flowSettings: FlowSettingsConfig;
  steps: FlowStepNode[];
  token: string | null;
  tenantSlug: string | null;
}): Promise<string> {
  const payload = {
    name: params.name.trim() || 'Automation Flow',
    description: params.description.trim(),
    trigger_type: params.triggerType,
    trigger_config: { ...params.triggerConfig, settings: params.flowSettings },
    settings: params.flowSettings,
    steps: params.steps,
  };
  if (params.editingId) {
    await apiRequest(`/marketing/flows/${params.editingId}`, {
      method: 'PUT',
      token: params.token,
      tenantSlug: params.tenantSlug,
      body: payload,
    });
    return params.editingId;
  }
  const created = await apiRequest<FlowDefinitionDto>('/marketing/flows', {
    method: 'POST',
    token: params.token,
    tenantSlug: params.tenantSlug,
    body: payload,
  });
  return created.id;
}

export async function publishFlowSnapshotApi(
  flowId: string,
  token: string | null,
  tenantSlug: string | null
): Promise<FlowDefinitionDto> {
  const res = await apiRequest<{ flow: FlowDefinitionDto }>(`/marketing/flows/${flowId}/publish`, {
    method: 'POST',
    token,
    tenantSlug,
  });
  return res.flow;
}

export async function reviewFlowWithDomAgentApi(
  flowId: string,
  triggerType: string,
  steps: FlowStepNode[],
  token: string | null,
  tenantSlug: string | null
): Promise<FlowReviewData> {
  return apiRequest<FlowReviewData>(`/marketing/flows/${flowId}/review`, {
    method: 'POST',
    token,
    tenantSlug,
    body: { trigger_type: triggerType, steps },
  });
}

export async function fetchFlowSnapshotsApi(
  flowId: string,
  token: string | null,
  tenantSlug: string | null
): Promise<FlowSnapshotItem[]> {
  const res = await apiRequest<{ snapshots?: FlowSnapshotItem[] }>(`/marketing/flows/${flowId}`, {
    token,
    tenantSlug,
  });
  return res.snapshots || [];
}

export async function restoreFlowSnapshotApi(
  flowId: string,
  snapshotId: string,
  token: string | null,
  tenantSlug: string | null
): Promise<FlowDefinitionDto> {
  return apiRequest<FlowDefinitionDto>(`/marketing/flows/${flowId}/restore-snapshot`, {
    method: 'POST',
    token,
    tenantSlug,
    body: { snapshot_id: snapshotId },
  });
}

export async function simulateFlowPathApi(
  flowId: string,
  steps: FlowStepNode[],
  sample: SampleSimulationLead,
  token: string | null,
  tenantSlug: string | null
): Promise<{ trace: FlowTraceItem[]; wouldPushToSaleRound: boolean }> {
  return apiRequest<{ trace: FlowTraceItem[]; wouldPushToSaleRound: boolean }>(
    `/marketing/flows/${flowId}/simulate`,
    { method: 'POST', token, tenantSlug, body: { steps, sample_lead: sample } }
  );
}
