import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { StudioBuilderSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { FlowStudioHeader, type StudioSubTab } from './FlowStudioHeader';
import { FlowBuilderTab } from './FlowBuilderTab';
import { FlowAnalyticsTab } from './FlowAnalyticsTab';
import { FlowSettingsTab } from './FlowSettingsTab';
import { FlowListSection, type FlowStatusFilter } from './FlowListSection';
import { FlowStudioOverlays } from './FlowStudioOverlays';
import type { SampleSimulationLead } from './FlowSimulateModal';
import type { FlowReviewData } from './FlowReviewModal';
import {
  buildStarterFlowSteps,
  duplicateFlowNode,
  fetchFlowSnapshotsApi,
  insertFlowNode,
  publishFlowSnapshotApi,
  removeFlowNode,
  restoreFlowSnapshotApi,
  reviewFlowWithDomAgentApi,
  saveFlowDraftApi,
  simulateFlowPathApi,
} from './flowGraphHelpers';
import {
  DEFAULT_FLOW_SETTINGS,
  type FlowCatalogResources,
  type FlowDefinitionDto,
  type FlowSettingsConfig,
  type FlowSnapshotItem,
  type FlowStepNode,
} from './flowConstants';

interface FlowsListResponse {
  items?: FlowDefinitionDto[];
  templates?: FlowCatalogResources['templates'];
  forms?: FlowCatalogResources['forms'];
  audiences?: FlowCatalogResources['audiences'];
  rounds?: FlowCatalogResources['rounds'];
  vouchers?: FlowCatalogResources['vouchers'];
  surveys?: FlowCatalogResources['surveys'];
}

export const MarketingFlowsPage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology, can } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'canvas'>('list');
  const [studioTab, setStudioTab] = useState<StudioSubTab>('builder');
  const [flows, setFlows] = useState<FlowDefinitionDto[]>([]);
  const [resources, setResources] = useState<FlowCatalogResources>({
    templates: [], forms: [], audiences: [], rounds: [], vouchers: [], surveys: [],
  });
  const [statusFilter, setStatusFilter] = useState<FlowStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState('');
  const [flowDesc, setFlowDesc] = useState('');
  const [flowVersion, setFlowVersion] = useState(1);
  const [triggerType, setTriggerType] = useState('form_submitted');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>({});
  const [flowSettings, setFlowSettings] = useState<FlowSettingsConfig>(DEFAULT_FLOW_SETTINGS);
  const [steps, setSteps] = useState<FlowStepNode[]>([]);
  const [undoStack, setUndoStack] = useState<FlowStepNode[][]>([]);
  const [redoStack, setRedoStack] = useState<FlowStepNode[][]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [highlightedStepIds, setHighlightedStepIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const [pendingInsert, setPendingInsert] = useState<{ parentId: string | null; branch: 'next' | 'yes' | 'no' | 'A' | 'B' } | null>(null);
  const [participantsTarget, setParticipantsTarget] = useState<FlowStepNode | null>(null);
  const [manualTriggerTarget, setManualTriggerTarget] = useState<{ id: string | null; name: string } | null>(null);
  const [simOpen, setSimOpen] = useState(false);
  const [reviewData, setReviewData] = useState<FlowReviewData | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<FlowSnapshotItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<FlowDefinitionDto | null>(null);

  const fetchFlowsPure = useCallback(async () => apiRequest<FlowsListResponse>('/marketing/flows', { token, tenantSlug }), [token, tenantSlug]);

  const applyOverview = useCallback((res: FlowsListResponse) => {
    setFlows(res.items || []);
    setResources({
      templates: res.templates || [],
      forms: res.forms || [],
      audiences: res.audiences || [],
      rounds: res.rounds || [],
      vouchers: res.vouchers || [],
      surveys: res.surveys || [],
    });
  }, []);

  const reload = useCallback(async () => {
    try {
      applyOverview(await fetchFlowsPure());
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách Automation Flows.'));
    } finally {
      setLoading(false);
    }
  }, [fetchFlowsPure, applyOverview]);

  useEffect(() => {
    let cancelled = false;
    fetchFlowsPure()
      .then((res) => { if (!cancelled) applyOverview(res); })
      .catch((err) => { if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải Automation Flows.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchFlowsPure, applyOverview]);

  const filteredFlows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return flows.filter((f) => {
      if (statusFilter === 'active' && f.status !== 'active') return false;
      if (statusFilter === 'draft' && f.status === 'active') return false;
      return !q || f.name.toLowerCase().includes(q) || f.trigger_type.toLowerCase().includes(q);
    });
  }, [flows, statusFilter, searchQuery]);

  const commitSteps = (next: FlowStepNode[]) => {
    setUndoStack((prev) => [...prev.slice(-19), steps]);
    setRedoStack([]);
    setSteps(next);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    setRedoStack((r) => [...r, steps]);
    setSteps(undoStack[undoStack.length - 1]);
    setUndoStack((u) => u.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    setUndoStack((u) => [...u, steps]);
    setSteps(redoStack[redoStack.length - 1]);
    setRedoStack((r) => r.slice(0, -1));
  };

  const openNewCanvas = () => {
    const starter = buildStarterFlowSteps();
    setEditingId(null);
    setFlowName(`Nuôi dưỡng ${terminology.customerLabel} Nóng -> Chia Sale Auto Data`);
    setFlowDesc('Tự động gửi tài liệu, chấm điểm tương tác và bàn giao sang Vòng chia Sale Fair-Share');
    setFlowVersion(1);
    setTriggerType('form_submitted');
    setTriggerConfig({});
    setFlowSettings(DEFAULT_FLOW_SETTINGS);
    setUndoStack([]);
    setRedoStack([]);
    setHighlightedStepIds(new Set());
    setSteps(starter.steps);
    setSelectedStepId(starter.defaultSelectedId);
    setStudioTab('builder');
    setMode('canvas');
  };

  const openExistingFlow = (f: FlowDefinitionDto) => {
    setEditingId(f.id);
    setFlowName(f.name);
    setFlowDesc(f.description || '');
    setFlowVersion(f.version || 1);
    setTriggerType(f.trigger_type);
    setTriggerConfig(f.trigger_config || {});
    setFlowSettings({ ...DEFAULT_FLOW_SETTINGS, ...(f.settings || {}) });
    setUndoStack([]);
    setRedoStack([]);
    setHighlightedStepIds(new Set());
    setSteps(f.steps || []);
    setSelectedStepId(f.steps?.[0]?.id || null);
    setStudioTab('builder');
    setMode('canvas');
  };

  const ensureSavedFlowId = async (): Promise<string | null> => {
    setSaving(true);
    try {
      const id = await saveFlowDraftApi({ editingId, name: flowName, description: flowDesc, triggerType, triggerConfig, flowSettings, steps, token, tenantSlug });
      setEditingId(id);
      return id;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu kịch bản Flow.'));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handlePublishSnapshot = async () => {
    const id = await ensureSavedFlowId();
    if (!id) return;
    try {
      const published = await publishFlowSnapshotApi(id, token, tenantSlug);
      setFlowVersion(published.version);
      toast.success(`Đã kích hoạt Real-time (Snapshot v${published.version})!`);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể kích hoạt Flow.'));
    }
  };

  const handleRunReview = async () => {
    setAuditing(true);
    try {
      const id = await ensureSavedFlowId();
      if (id) setReviewData(await reviewFlowWithDomAgentApi(id, triggerType, steps, token, tenantSlug));
    } catch (err) {
      toast.error(getErrorMessage(err, 'DOM Agent không thể kiểm toán kịch bản.'));
    } finally {
      setAuditing(false);
    }
  };

  const handleOpenSnapshots = async () => {
    const id = await ensureSavedFlowId();
    if (!id) return;
    try {
      setSnapshots(await fetchFlowSnapshotsApi(id, token, tenantSlug));
      setSnapshotsOpen(true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách Snapshot.'));
    }
  };

  const handleRestoreSnapshot = async (snapId: string) => {
    if (!editingId) return;
    try {
      const restored = await restoreFlowSnapshotApi(editingId, snapId, token, tenantSlug);
      setTriggerType(restored.trigger_type);
      setSteps(restored.steps || []);
      setSnapshotsOpen(false);
      toast.success('Đã khôi phục sơ đồ từ Snapshot thành công!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể khôi phục Snapshot.'));
    }
  };

  const handleRunSimulate = async (sample: SampleSimulationLead) => {
    const id = await ensureSavedFlowId();
    return id ? simulateFlowPathApi(id, steps, sample, token, tenantSlug) : null;
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/marketing/flows/${deleteTarget.id}`, { method: 'DELETE', token, tenantSlug });
      toast.success('Đã xóa kịch bản Flow.');
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa Flow.'));
    }
  };

  const currentFlowDto = useMemo(() => (editingId ? flows.find((f) => f.id === editingId) || null : null), [editingId, flows]);

  if (loading) return <StudioBuilderSkeleton />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', background: '#F8F9FA' }}>
      <FlowStudioHeader
        mode={mode}
        studioTab={studioTab}
        flowName={flowName}
        stepsCount={steps.length}
        canCreate={can('automation_flows', 'create')}
        saving={saving}
        auditing={auditing}
        onChangeFlowName={setFlowName}
        onChangeStudioTab={setStudioTab}
        onReload={() => void reload()}
        onCreateNew={openNewCanvas}
        onBackToList={() => setMode('list')}
        onOpenManualTrigger={() => {
          void ensureSavedFlowId().then((id) => { if (id) setManualTriggerTarget({ id, name: flowName }); });
        }}
        onOpenSimulate={() => setSimOpen(true)}
        onRunReview={() => void handleRunReview()}
        onSaveDraft={() => {
          void ensureSavedFlowId().then((id) => {
            if (id) {
              toast.success('Đã lưu cấu hình Visual Flow Studio!');
              void reload();
            }
          });
        }}
        onPublishSnapshot={() => void handlePublishSnapshot()}
      />

      {mode === 'list' ? (
        <FlowListSection
          flows={flows}
          filteredFlows={filteredFlows}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          onChangeStatus={setStatusFilter}
          onChangeSearch={setSearchQuery}
          onCreateNew={openNewCanvas}
          onOpenStudio={openExistingFlow}
          onOpenManualTrigger={(f) => setManualTriggerTarget({ id: f.id, name: f.name })}
          onRequestDelete={setDeleteTarget}
        />
      ) : studioTab === 'builder' ? (
        <FlowBuilderTab
          triggerType={triggerType}
          triggerConfig={triggerConfig}
          steps={steps}
          selectedStepId={selectedStepId}
          highlightedStepIds={highlightedStepIds}
          stepParticipantCounts={{}}
          resources={resources}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          version={flowVersion}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onOpenSnapshots={() => void handleOpenSnapshots()}
          onClearHighlightedPath={() => setHighlightedStepIds(new Set())}
          onChangeTriggerType={setTriggerType}
          onChangeTriggerConfig={setTriggerConfig}
          onSelectStep={setSelectedStepId}
          onUpdateStep={(stepId, patch) => setSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, ...patch } : s)))}
          onRequestAddAfter={(parentId, branch = 'next') => setPendingInsert({ parentId, branch })}
          onDuplicateStep={(stepId) => {
            const dup = duplicateFlowNode(steps, stepId);
            if (dup) { commitSteps(dup.nextSteps); setSelectedStepId(dup.copyId); }
          }}
          onDeleteStep={(stepId) => {
            commitSteps(removeFlowNode(steps, stepId));
            if (selectedStepId === stepId) setSelectedStepId(null);
          }}
          onOpenParticipants={(node) => setParticipantsTarget(node)}
        />
      ) : studioTab === 'analytics' ? (
        <FlowAnalyticsTab flowId={editingId} flowSummary={currentFlowDto} steps={steps} onInspectStepParticipants={(node) => setParticipantsTarget(node)} />
      ) : (
        <FlowSettingsTab description={flowDesc} settings={flowSettings} onChangeDescription={setFlowDesc} onChangeSettings={setFlowSettings} />
      )}

      <FlowStudioOverlays
        pendingInsert={pendingInsert}
        onCloseInsert={() => setPendingInsert(null)}
        onPickNode={(nodeType, label) => {
          if (!pendingInsert) return;
          const { nextSteps, newId } = insertFlowNode(steps, pendingInsert, nodeType, label);
          commitSteps(nextSteps);
          setSelectedStepId(newId);
          setPendingInsert(null);
        }}
        participantsTarget={participantsTarget}
        onCloseParticipants={() => setParticipantsTarget(null)}
        editingId={editingId}
        manualTriggerTarget={manualTriggerTarget}
        onCloseManualTrigger={() => setManualTriggerTarget(null)}
        flowName={flowName}
        audiences={resources.audiences}
        onReload={reload}
        simOpen={simOpen}
        onCloseSim={() => setSimOpen(false)}
        onRunSimulate={handleRunSimulate}
        onHighlightTrace={(ids) => { setHighlightedStepIds(new Set(ids)); setStudioTab('builder'); }}
        reviewData={reviewData}
        onCloseReview={() => setReviewData(null)}
        auditing={auditing}
        onReAudit={handleRunReview}
        onSelectStepFromReview={(id) => { setSelectedStepId(id); setStudioTab('builder'); }}
        snapshotsOpen={snapshotsOpen}
        onCloseSnapshots={() => setSnapshotsOpen(false)}
        snapshots={snapshots}
        onRestoreSnapshot={(snapId) => void handleRestoreSnapshot(snapId)}
        deleteTarget={deleteTarget}
        onCloseDelete={() => setDeleteTarget(null)}
        onConfirmDelete={() => void handleConfirmDelete()}
      />
    </div>
  );
};

export default MarketingFlowsPage;
