import React, { useMemo, useState } from 'react';
import {
  GitBranch,
  History,
  Maximize2,
  Minimize2,
  Redo2,
  RotateCcw,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Badge, Card } from '../../components/ui/AutoDataLoadingModal';
import { FlowTree } from './FlowTree';
import { FlowMinimap } from './FlowMinimap';
import { TriggerConfig } from './TriggerConfig';
import { EmailActionConfig } from './EmailActionConfig';
import { ZaloZNSStepConfig } from './ZaloZNSStepConfig';
import { WaitConfig } from './WaitConfig';
import { ConditionConfig } from './ConditionConfig';
import { CrmActionConfig } from './CrmActionConfig';
import {
  FLOW_NODES_11,
  type FlowCatalogResources,
  type FlowStepNode,
} from './flowConstants';

export interface FlowBuilderTabProps {
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  steps: FlowStepNode[];
  selectedStepId: string | null;
  highlightedStepIds: Set<string>;
  stepParticipantCounts: Record<string, number>;
  resources: FlowCatalogResources;
  canUndo: boolean;
  canRedo: boolean;
  version: number;
  onUndo: () => void;
  onRedo: () => void;
  onOpenSnapshots: () => void;
  onClearHighlightedPath: () => void;
  onChangeTriggerType: (nextType: string) => void;
  onChangeTriggerConfig: (nextCfg: Record<string, unknown>) => void;
  onSelectStep: (stepId: string | null) => void;
  onUpdateStep: (stepId: string, patch: Partial<FlowStepNode>) => void;
  onRequestAddAfter: (parentId: string | null, branch?: 'next' | 'yes' | 'no' | 'A' | 'B') => void;
  onDuplicateStep: (stepId: string) => void;
  onDeleteStep: (stepId: string) => void;
  onOpenParticipants: (step: FlowStepNode) => void;
}

export const FlowBuilderTab: React.FC<FlowBuilderTabProps> = ({
  triggerType,
  triggerConfig,
  steps,
  selectedStepId,
  highlightedStepIds,
  stepParticipantCounts,
  resources,
  canUndo,
  canRedo,
  version,
  onUndo,
  onRedo,
  onOpenSnapshots,
  onClearHighlightedPath,
  onChangeTriggerType,
  onChangeTriggerConfig,
  onSelectStep,
  onUpdateStep,
  onRequestAddAfter,
  onDuplicateStep,
  onDeleteStep,
  onOpenParticipants,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);

  const selectedStep = useMemo(
    () => (selectedStepId ? steps.find((s) => s.id === selectedStepId) || null : null),
    [steps, selectedStepId]
  );

  const selectedMeta = useMemo(
    () => (selectedStep ? FLOW_NODES_11.find((n) => n.type === selectedStep.type) : null),
    [selectedStep]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (el.closest('button') || el.closest('input') || el.closest('select')) return;
    setDragging(true);
    setDragOrigin({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragOrigin.x, y: e.clientY - dragOrigin.y });
  };

  const handleMouseUp = () => setDragging(false);

  const resetViewport = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      style={
        fullscreen
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 9200,
              background: '#F8F9FA',
              padding: '1rem',
              display: 'grid',
              gridTemplateColumns: '1fr 370px',
              gap: '1rem',
            }
          : {
              display: 'grid',
              gridTemplateColumns: '1fr 370px',
              gap: '1rem',
              alignItems: 'start',
            }
      }
    >
      {/* Interactive Branching Canvas */}
      <div
        style={{
          position: 'relative',
          minHeight: fullscreen ? 'calc(100vh - 2rem)' : 580,
          borderRadius: 20,
          backgroundColor: '#F8F9FA',
          backgroundImage: 'radial-gradient(#CBD5E1 1.25px, transparent 1.25px)',
          backgroundSize: '22px 22px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Top Floating Canvas Toolbar */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            zIndex: 10,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              className="btn secondary sm"
              style={{ height: 34, background: '#FFFFFF' }}
              title="Hoàn tác (Undo)"
            >
              <Undo2 size={14} />
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              className="btn secondary sm"
              style={{ height: 34, background: '#FFFFFF' }}
              title="Làm lại (Redo)"
            >
              <Redo2 size={14} />
            </button>
            <button
              type="button"
              onClick={onOpenSnapshots}
              className="btn secondary sm"
              style={{ height: 34, background: '#FFFFFF', color: '#1E40FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <History size={13} /> v{version} Snapshots
            </button>

            {highlightedStepIds.size > 0 && (
              <button
                type="button"
                onClick={onClearHighlightedPath}
                style={{
                  height: 34,
                  padding: '0 0.75rem',
                  borderRadius: 9,
                  border: '1px solid #10B981',
                  background: '#ECFDF5',
                  color: '#065F46',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                Đang tô sáng đường đi giả lập <X size={13} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
              className="btn secondary sm"
              style={{ height: 34, background: '#FFFFFF' }}
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={resetViewport}
              className="btn secondary sm"
              style={{ height: 34, background: '#FFFFFF', fontWeight: 700, fontSize: '0.75rem' }}
            >
              <RotateCcw size={12} style={{ marginRight: 4 }} />
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.1).toFixed(2))))}
              className="btn secondary sm"
              style={{ height: 34, background: '#FFFFFF' }}
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              className="btn secondary sm"
              style={{ height: 34, background: '#FFFFFF' }}
            >
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        {/* Pan + Zoom Layer */}
        <div
          style={{
            paddingTop: 52,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top center',
            transition: dragging ? 'none' : 'transform 0.12s ease-out',
          }}
        >
          <FlowTree
            triggerType={triggerType}
            steps={steps}
            selectedStepId={selectedStepId}
            highlightedStepIds={highlightedStepIds}
            stepParticipantCounts={stepParticipantCounts}
            onSelectTrigger={() => onSelectStep(null)}
            onSelectStep={(id) => onSelectStep(id)}
            onRequestAddAfter={onRequestAddAfter}
            onDuplicateStep={onDuplicateStep}
            onDeleteStep={onDeleteStep}
            onOpenParticipants={onOpenParticipants}
          />
        </div>

        <FlowMinimap
          steps={steps}
          selectedStepId={selectedStepId}
          highlightedStepIds={highlightedStepIds}
          zoom={zoom}
          onSelectStep={onSelectStep}
          onResetViewport={resetViewport}
        />
      </div>

      {/* Right-Hand Contextual Step Configurator */}
      <Card
        title={selectedStep ? `Cấu Hình Bước: ${selectedMeta?.label || selectedStep.type}` : 'Cấu Hình Điểm Kích Hoạt (Trigger)'}
        subtitle={
          selectedStep
            ? 'Thay đổi tự động cập nhật trực tiếp lên Sơ đồ cây bên trái'
            : 'Chọn 1 trong 15 sự kiện mở đầu quy trình tự động hóa'
        }
        style={{ maxHeight: fullscreen ? 'calc(100vh - 2rem)' : 640, overflowY: 'auto' }}
      >
        {!selectedStep ? (
          <TriggerConfig
            triggerType={triggerType}
            triggerConfig={triggerConfig}
            resources={resources}
            onChangeTriggerType={onChangeTriggerType}
            onChangeTriggerConfig={onChangeTriggerConfig}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Nhãn hiển thị trên Sơ đồ</label>
              <input
                className="form-input"
                style={{ height: 42 }}
                value={selectedStep.label || ''}
                onChange={(e) => onUpdateStep(selectedStep.id, { label: e.target.value })}
              />
            </div>

            {selectedStep.type === 'send_email' ? (
              <EmailActionConfig
                config={selectedStep.config || {}}
                templates={resources.templates}
                onChange={(cfg) => onUpdateStep(selectedStep.id, { config: cfg })}
              />
            ) : selectedStep.type === 'send_zns' ? (
              <ZaloZNSStepConfig
                config={selectedStep.config || {}}
                onChange={(cfg) => onUpdateStep(selectedStep.id, { config: cfg })}
              />
            ) : selectedStep.type === 'wait_delay' ? (
              <WaitConfig
                config={selectedStep.config || {}}
                onChange={(cfg, autoLabel) =>
                  onUpdateStep(selectedStep.id, { config: cfg, ...(autoLabel ? { label: autoLabel } : {}) })
                }
              />
            ) : selectedStep.type === 'if_else_condition' ? (
              <ConditionConfig
                config={selectedStep.config || {}}
                onChange={(cfg) => onUpdateStep(selectedStep.id, { config: cfg })}
              />
            ) : selectedStep.type === 'ab_split' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    <GitBranch size={13} style={{ display: 'inline', marginRight: 4 }} /> Tỉ lệ phân luồng A/B
                  </span>
                  <Badge tone="purple">
                    {Number(selectedStep.config?.ratio_a ?? 50)}% A / {100 - Number(selectedStep.config?.ratio_a ?? 50)}% B
                  </Badge>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={Number(selectedStep.config?.ratio_a ?? 50)}
                  onChange={(e) =>
                    onUpdateStep(selectedStep.id, {
                      config: { ...(selectedStep.config || {}), ratio_a: Number(e.target.value) },
                    })
                  }
                  style={{ width: '100%', accentColor: '#1E40FF' }}
                />
              </div>
            ) : (
              <CrmActionConfig
                nodeType={selectedStep.type}
                config={selectedStep.config || {}}
                resources={resources}
                onChange={(cfg) => onUpdateStep(selectedStep.id, { config: cfg })}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default FlowBuilderTab;
