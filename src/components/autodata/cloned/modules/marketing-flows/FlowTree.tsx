import React from 'react';
import { Copy, GitBranch, Plus, Trash2, Users, Zap } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import {
  FLOW_NODES_11,
  FLOW_TRIGGERS_15,
  summarizeStepConfig,
  type FlowStepNode,
} from './flowConstants';

export interface FlowTreeProps {
  triggerType: string;
  steps: FlowStepNode[];
  selectedStepId: string | null;
  highlightedStepIds?: Set<string>;
  stepParticipantCounts?: Record<string, number>;
  onSelectTrigger: () => void;
  onSelectStep: (stepId: string) => void;
  onRequestAddAfter: (parentId: string | null, branch?: 'next' | 'yes' | 'no' | 'A' | 'B') => void;
  onDuplicateStep?: (stepId: string) => void;
  onDeleteStep: (stepId: string) => void;
  onOpenParticipants?: (step: FlowStepNode) => void;
}

export const FlowTree: React.FC<FlowTreeProps> = ({
  triggerType,
  steps,
  selectedStepId,
  highlightedStepIds = new Set(),
  stepParticipantCounts = {},
  onSelectTrigger,
  onSelectStep,
  onRequestAddAfter,
  onDuplicateStep,
  onDeleteStep,
  onOpenParticipants,
}) => {
  const stepMap = new Map<string, FlowStepNode>();
  const referencedIds = new Set<string>();

  for (const s of steps) {
    stepMap.set(s.id, s);
    for (const ref of [s.nextStepId, s.yesStepId, s.noStepId, s.pathAStepId, s.pathBStepId]) {
      if (ref) referencedIds.add(ref);
    }
  }

  const rootStep = steps.find((s) => !referencedIds.has(s.id)) || steps[0] || null;
  const triggerMeta = FLOW_TRIGGERS_15.find((t) => t.key === triggerType);

  const renderConnector = (parentId: string | null, branch: 'next' | 'yes' | 'no' | 'A' | 'B') => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: 2, height: 14, background: '#CBD5E1' }} />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRequestAddAfter(parentId, branch);
        }}
        title="Chèn thêm Node hành động tại vị trí này"
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: '1.5px solid #BFDBFE',
          background: '#FFFFFF',
          color: '#1E40FF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(30, 64, 255, 0.12)',
        }}
      >
        <Plus size={13} />
      </button>
      <div style={{ width: 2, height: 14, background: '#CBD5E1' }} />
    </div>
  );

  const renderSubtree = (stepId: string | null | undefined, visited: Set<string>): React.ReactNode => {
    if (!stepId || visited.has(stepId)) return null;
    const node = stepMap.get(stepId);
    if (!node) return null;

    const nextVisited = new Set(visited);
    nextVisited.add(stepId);

    const nodeMeta = FLOW_NODES_11.find((n) => n.type === node.type);
    const isSelected = selectedStepId === node.id;
    const isTraced = highlightedStepIds.has(node.id);
    const isSaleNode = node.type === 'push_to_autodata_sale_round';
    const participantCount = stepParticipantCounts[node.id] ?? node.participants_count ?? 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Node Card */}
        <div
          onClick={() => onSelectStep(node.id)}
          style={{
            width: 325,
            padding: '0.85rem 1rem',
            borderRadius: 16,
            background: isSaleNode ? '#F0FDF4' : '#FFFFFF',
            border: isTraced
              ? '2px solid #059669'
              : isSelected
                ? '2px solid #1E40FF'
                : isSaleNode
                  ? '1.5px solid #10B981'
                  : '1px solid #E2E8F0',
            boxShadow: isTraced
              ? '0 0 0 4px rgba(16, 185, 129, 0.18)'
              : isSelected
                ? '0 8px 24px rgba(30, 64, 255, 0.16)'
                : '0 2px 8px rgba(15, 23, 42, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.16s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <Badge tone={nodeMeta?.tone || 'primary'}>{nodeMeta?.label || node.type}</Badge>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {onOpenParticipants && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenParticipants(node);
                  }}
                  title="Xem danh sách khách hàng & Execution Trace tại bước này"
                  style={{
                    border: '1px solid #DBEAFE',
                    background: '#EFF6FF',
                    color: '#1E40FF',
                    borderRadius: 999,
                    padding: '2px 8px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                >
                  <Users size={11} /> {participantCount}
                </button>
              )}

              {onDuplicateStep && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateStep(node.id);
                  }}
                  style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', padding: 3 }}
                  title="Nhân bản Node"
                >
                  <Copy size={13} />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteStep(node.id);
                }}
                style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer', padding: 3 }}
                title="Xóa bước này"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A', marginTop: 6 }}>
            {node.label || nodeMeta?.label || node.type}
          </div>

          <div style={{ fontSize: '0.73rem', color: isSaleNode ? '#047857' : '#64748B', marginTop: 3, fontWeight: isSaleNode ? 700 : 500 }}>
            {summarizeStepConfig(node)}
          </div>
        </div>

        {/* Branching vs Linear Children */}
        {node.type === 'if_else_condition' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: 2, height: 16, background: '#CBD5E1' }} />
            <div style={{ width: 380, height: 2, background: '#CBD5E1' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 12, background: '#CBD5E1' }} />
                <Badge tone="success">Nhánh ĐÚNG (Yes)</Badge>
                {renderConnector(node.id, 'yes')}
                {node.yesStepId ? renderSubtree(node.yesStepId, nextVisited) : null}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 12, background: '#CBD5E1' }} />
                <Badge tone="danger">Nhánh SAI (No)</Badge>
                {renderConnector(node.id, 'no')}
                {node.noStepId ? renderSubtree(node.noStepId, nextVisited) : null}
              </div>
            </div>
          </div>
        ) : node.type === 'ab_split' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: 2, height: 16, background: '#CBD5E1' }} />
            <div style={{ width: 380, height: 2, background: '#CBD5E1' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 12, background: '#CBD5E1' }} />
                <Badge tone="primary" icon={<GitBranch size={11} />}>
                  Nhánh A ({Number(node.config?.ratio_a ?? 50)}%)
                </Badge>
                {renderConnector(node.id, 'A')}
                {node.pathAStepId ? renderSubtree(node.pathAStepId, nextVisited) : null}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 12, background: '#CBD5E1' }} />
                <Badge tone="info" icon={<GitBranch size={11} />}>
                  Nhánh B ({100 - Number(node.config?.ratio_a ?? 50)}%)
                </Badge>
                {renderConnector(node.id, 'B')}
                {node.pathBStepId ? renderSubtree(node.pathBStepId, nextVisited) : null}
              </div>
            </div>
          </div>
        ) : (
          <>
            {renderConnector(node.id, 'next')}
            {node.nextStepId ? renderSubtree(node.nextStepId, nextVisited) : null}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 2rem' }}>
      {/* Trigger Card */}
      <div
        onClick={onSelectTrigger}
        style={{
          width: 340,
          padding: '0.95rem 1.15rem',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
          color: '#FFFFFF',
          border: selectedStepId === null ? '2.5px solid #0F172A' : '2px solid transparent',
          boxShadow: '0 8px 20px rgba(30, 64, 255, 0.24)',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, opacity: 0.92 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Zap size={14} /> ĐIỂM KÍCH HOẠT (15 TRIGGERS)
          </span>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 7px', borderRadius: 999 }}>Cấu hình</span>
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: 5 }}>
          {triggerMeta?.label || triggerType}
        </div>
      </div>

      {renderConnector(null, 'next')}
      {rootStep ? renderSubtree(rootStep.id, new Set()) : null}
    </div>
  );
};

export default FlowTree;
