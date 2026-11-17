import React from 'react';
import { Compass, RotateCcw } from 'lucide-react';
import type { FlowStepNode } from './flowConstants';

export interface FlowMinimapProps {
  steps: FlowStepNode[];
  selectedStepId: string | null;
  highlightedStepIds: Set<string>;
  zoom: number;
  onSelectStep: (stepId: string | null) => void;
  onResetViewport: () => void;
}

export const FlowMinimap: React.FC<FlowMinimapProps> = ({
  steps,
  selectedStepId,
  highlightedStepIds,
  zoom,
  onSelectStep,
  onResetViewport,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        right: 14,
        bottom: 14,
        width: 195,
        padding: '0.65rem 0.75rem',
        borderRadius: 14,
        background: 'rgba(255, 255, 255, 0.96)',
        border: '1px solid #DBEAFE',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Compass size={12} /> MINIMAP ({Math.round(zoom * 100)}%)
        </span>
        <button
          type="button"
          onClick={onResetViewport}
          title="Đưa khung nhìn về trung tâm 100%"
          style={{
            border: 'none',
            background: '#EEF2FF',
            color: '#1E40FF',
            borderRadius: 6,
            padding: '2px 6px',
            fontSize: '0.66rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <RotateCcw size={10} /> Fit
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 130, overflowY: 'auto' }}>
        <button
          type="button"
          onClick={() => onSelectStep(null)}
          style={{
            padding: '3px 7px',
            borderRadius: 6,
            border: selectedStepId === null ? '1px solid #1E40FF' : '1px solid #BFDBFE',
            background: '#EFF6FF',
            color: '#1E40FF',
            fontSize: '0.66rem',
            fontWeight: 800,
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          ⚡ Trigger Khởi Động
        </button>

        {steps.map((s, idx) => {
          const isSelected = selectedStepId === s.id;
          const isTraced = highlightedStepIds.has(s.id);
          const isSale = s.type === 'push_to_autodata_sale_round';
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectStep(s.id)}
              style={{
                padding: '3px 7px',
                borderRadius: 6,
                border: isSelected
                  ? '1.5px solid #1E40FF'
                  : isTraced
                    ? '1.5px solid #059669'
                    : '1px solid #E2E8F0',
                background: isSale ? '#ECFDF5' : isSelected ? '#F8FAFF' : '#FFFFFF',
                color: '#0F172A',
                fontSize: '0.66rem',
                fontWeight: isSelected || isTraced ? 800 : 600,
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              #{idx + 1} {s.label || s.type}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FlowMinimap;
