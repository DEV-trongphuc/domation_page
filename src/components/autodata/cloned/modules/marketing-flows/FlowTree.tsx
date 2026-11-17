import React from 'react';
import { GitBranch, Plus, Trash2, Zap } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { FLOW_NODES_11, FLOW_TRIGGERS_15, type FlowStepNode } from './flowConstants';

interface FlowTreeProps {
  triggerType: string;
  steps: FlowStepNode[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
  onRequestAddAfter: (parentId: string | null, branch?: 'next' | 'yes' | 'no' | 'A' | 'B') => void;
  onDeleteStep: (stepId: string) => void;
}

export const FlowTree: React.FC<FlowTreeProps> = ({
  triggerType,
  steps,
  selectedStepId,
  onSelectStep,
  onRequestAddAfter,
  onDeleteStep,
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

  const renderSubtree = (stepId: string | null | undefined, visited: Set<string>): React.ReactNode => {
    if (!stepId || visited.has(stepId)) return null;
    const node = stepMap.get(stepId);
    if (!node) return null;

    const nextVisited = new Set(visited);
    nextVisited.add(stepId);

    const nodeMeta = FLOW_NODES_11.find((n) => n.type === node.type);
    const isSelected = selectedStepId === node.id;
    const isSaleNode = node.type === 'push_to_autodata_sale_round';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Vertical Sapphire Connector */}
        <div style={{ width: 2, height: 22, background: '#CBD5E1' }} />

        {/* Node Card */}
        <div
          onClick={() => onSelectStep(node.id)}
          style={{
            width: 310,
            padding: '0.85rem 1rem',
            borderRadius: 16,
            background: isSaleNode ? '#F0FDF4' : '#FFFFFF',
            border: isSelected
              ? '2px solid #1E40FF'
              : isSaleNode
                ? '1.5px solid #10B981'
                : '1px solid #E2E8F0',
            boxShadow: isSelected
              ? '0 8px 24px rgba(30, 64, 255, 0.16)'
              : '0 2px 8px rgba(15, 23, 42, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.16s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <Badge tone={nodeMeta?.tone || 'primary'}>{nodeMeta?.label || node.type}</Badge>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteStep(node.id);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#DC2626',
                cursor: 'pointer',
                padding: 4,
              }}
              title="Xóa bước này"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A', marginTop: 6 }}>
            {node.label || nodeMeta?.label || node.type}
          </div>
          {node.config && Object.keys(node.config).length > 0 && (
            <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: 3 }}>
              {node.type === 'if_else_condition'
                ? `Điều kiện: ${String(node.config.field || 'lead_score')} ${String(node.config.operator || '>=')} ${String(node.config.value ?? 30)}`
                : node.type === 'update_lead_score'
                  ? `Điểm nóng: ${Number(node.config.delta ?? 10) >= 0 ? '+' : ''}${String(node.config.delta ?? 10)}`
                  : node.type === 'wait_delay'
                    ? `Chờ ${String(node.config.duration || 1)} ${String(node.config.unit || 'hours')}`
                    : node.type === 'add_remove_tag'
                      ? `Tag: ${String(node.config.tag || 'VIP')}`
                      : isSaleNode
                        ? 'Chuyển sang hàng đợi Vòng chia Sale Fair-Share'
                        : null}
            </div>
          )}
        </div>

        {/* Branching vs Linear Children */}
        {node.type === 'if_else_condition' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: 2, height: 16, background: '#CBD5E1' }} />
            <div style={{ width: 360, height: 2, background: '#CBD5E1' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 12, background: '#CBD5E1' }} />
                <Badge tone="success">Nhánh ĐÚNG (Yes)</Badge>
                {node.yesStepId ? (
                  renderSubtree(node.yesStepId, nextVisited)
                ) : (
                  <button
                    type="button"
                    onClick={() => onRequestAddAfter(node.id, 'yes')}
                    className="btn secondary sm"
                    style={{ marginTop: 10, height: 36, color: '#1E40FF' }}
                  >
                    <Plus size={13} /> Thêm bước ĐÚNG
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 12, background: '#CBD5E1' }} />
                <Badge tone="danger">Nhánh SAI (No)</Badge>
                {node.noStepId ? (
                  renderSubtree(node.noStepId, nextVisited)
                ) : (
                  <button
                    type="button"
                    onClick={() => onRequestAddAfter(node.id, 'no')}
                    className="btn secondary sm"
                    style={{ marginTop: 10, height: 36, color: '#1E40FF' }}
                  >
                    <Plus size={13} /> Thêm bước SAI
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : node.type === 'ab_split' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: 2, height: 16, background: '#CBD5E1' }} />
            <div style={{ width: 360, height: 2, background: '#CBD5E1' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 12, background: '#CBD5E1' }} />
                <Badge tone="primary" icon={<GitBranch size={11} />}>
                  Nhánh A ({Number(node.config?.ratio_a ?? 50)}%)
                </Badge>
                {node.pathAStepId ? (
                  renderSubtree(node.pathAStepId, nextVisited)
                ) : (
                  <button
                    type="button"
                    onClick={() => onRequestAddAfter(node.id, 'A')}
                    className="btn secondary sm"
                    style={{ marginTop: 10, height: 36, color: '#1E40FF' }}
                  >
                    <Plus size={13} /> Thêm bước A
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 12, background: '#CBD5E1' }} />
                <Badge tone="info" icon={<GitBranch size={11} />}>
                  Nhánh B ({100 - Number(node.config?.ratio_a ?? 50)}%)
                </Badge>
                {node.pathBStepId ? (
                  renderSubtree(node.pathBStepId, nextVisited)
                ) : (
                  <button
                    type="button"
                    onClick={() => onRequestAddAfter(node.id, 'B')}
                    className="btn secondary sm"
                    style={{ marginTop: 10, height: 36, color: '#1E40FF' }}
                  >
                    <Plus size={13} /> Thêm bước B
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : node.nextStepId ? (
          renderSubtree(node.nextStepId, nextVisited)
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 2, height: 16, background: '#CBD5E1' }} />
            <button
              type="button"
              onClick={() => onRequestAddAfter(node.id, 'next')}
              className="btn secondary sm"
              style={{ height: 38, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Plus size={14} /> Thêm Node kế tiếp
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        padding: '1.5rem',
        borderRadius: 20,
        background: '#F8F9FA',
        border: '1px solid #E2E8F0',
        overflowX: 'auto',
        minHeight: 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Trigger Header Card */}
      <div
        style={{
          width: 330,
          padding: '0.95rem 1.1rem',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
          color: '#FFFFFF',
          boxShadow: '0 8px 20px rgba(30, 64, 255, 0.22)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700, opacity: 0.9 }}>
          <Zap size={14} /> ĐIỂM KÍCH HOẠT KỊCH BẢN (TRIGGER)
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: 4 }}>
          {triggerMeta?.label || triggerType}
        </div>
      </div>

      {rootStep ? (
        renderSubtree(rootStep.id, new Set())
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 2, height: 22, background: '#CBD5E1' }} />
          <button
            type="button"
            onClick={() => onRequestAddAfter(null, 'next')}
            style={{
              height: 44,
              padding: '0 1.25rem',
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
            <Plus size={15} /> Thêm Node Hành Động Đầu Tiên
          </button>
        </div>
      )}
    </div>
  );
};
