import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Building2, Calendar, GripVertical, User } from 'lucide-react';
import type { CrmDealRecord } from '../../drawers/crmTypes';
import {
  DEAL_STAGES_META,
  formatCompactVnd,
  formatCurrencyVnd,
} from '../../drawers/crm360Api';
import {
  openGlobalCompanyDrawer,
  openGlobalCustomerDrawer,
} from '../../drawers/drawerEvents';

interface KanbanCardProps {
  deal: CrmDealRecord;
  canDrag: boolean;
  onSelectDeal: (deal: CrmDealRecord) => void;
}

const DraggableDealCard: React.FC<KanbanCardProps> = ({
  deal,
  canDrag,
  onSelectDeal,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    disabled: !canDrag,
    data: { deal },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.35 : 1,
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 12,
    padding: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
    cursor: 'pointer',
  };

  return (
    <div ref={setNodeRef} style={style} onClick={() => onSelectDeal(deal)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0F172A', lineHeight: 1.35 }}>
          {deal.title}
        </div>
        {canDrag && (
          <span
            {...listeners}
            {...attributes}
            onClick={(e) => e.stopPropagation()}
            style={{ color: '#94A3B8', cursor: 'grab', padding: 2 }}
            title="Kéo sang cột khác"
          >
            <GripVertical size={15} />
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong style={{ fontSize: '0.88rem', color: '#1E40FF' }}>
          {formatCurrencyVnd(deal.amount_vnd)}
        </strong>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF' }}>
          {deal.probability}%
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {deal.contact_name && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (deal.lead_id) openGlobalCustomerDrawer(String(deal.lead_id));
            }}
            style={{ border: 'none', background: '#F8FAFC', borderRadius: 6, padding: '3px 7px', fontSize: '0.72rem', color: '#334155', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
          >
            <User size={11} color="#1E40FF" /> {deal.contact_name}
          </button>
        )}
        {deal.company_name && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (deal.company_id) openGlobalCompanyDrawer(String(deal.company_id));
            }}
            style={{ border: 'none', background: '#F8FAFC', borderRadius: 6, padding: '3px 7px', fontSize: '0.72rem', color: '#334155', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
          >
            <Building2 size={11} color="#1E40FF" /> {deal.company_name}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: 6 }}>
        <span>{deal.owner_name || 'Chưa phân công'}</span>
        {deal.expected_close_date && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Calendar size={11} /> {String(deal.expected_close_date).slice(0, 10)}
          </span>
        )}
      </div>
    </div>
  );
};

const DroppableStageColumn: React.FC<{
  stageKey: string;
  label: string;
  color: string;
  deals: CrmDealRecord[];
  canDrag: boolean;
  onSelectDeal: (d: CrmDealRecord) => void;
}> = ({ stageKey, label, color, deals, canDrag, onSelectDeal }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  const totalVnd = deals.reduce((s, d) => s + Number(d.amount_vnd || 0), 0);
  const weightedVnd = deals.reduce(
    (s, d) => s + Math.round((Number(d.amount_vnd || 0) * Number(d.probability || 0)) / 100),
    0
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: 285,
        width: 285,
        flexShrink: 0,
        background: isOver ? '#EFF6FF' : '#FFFFFF',
        border: isOver ? `2px dashed ${color}` : '1px solid #E2E8F0',
        borderTop: `3px solid ${color}`,
        borderRadius: 16,
        padding: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxHeight: 'calc(100vh - 280px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>{label}</strong>
        <span style={{ fontSize: '0.73rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#F1F5F9', color: '#334155' }}>
          {deals.length}
        </span>
      </div>
      <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
        <span>Tổng: <strong style={{ color: '#0F172A' }}>{formatCompactVnd(totalVnd)}</strong></span>
        <span>Dự báo: <strong style={{ color: '#1E40FF' }}>{formatCompactVnd(weightedVnd)}</strong></span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1, minHeight: 120 }}>
        {deals.map((d) => (
          <DraggableDealCard
            key={d.id}
            deal={d}
            canDrag={canDrag}
            onSelectDeal={onSelectDeal}
          />
        ))}
      </div>
    </div>
  );
};

export interface DealsKanbanBoardProps {
  deals: CrmDealRecord[];
  canEdit: boolean;
  onMoveDealStage: (deal: CrmDealRecord, nextStage: string) => void;
  onSelectDeal: (deal: CrmDealRecord) => void;
}

export const DealsKanbanBoard: React.FC<DealsKanbanBoardProps> = ({
  deals,
  canEdit,
  onMoveDealStage,
  onSelectDeal,
}) => {
  const [activeDeal, setActiveDeal] = useState<CrmDealRecord | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const d = event.active.data.current?.deal as CrmDealRecord | undefined;
    if (d) setActiveDeal(d);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const d = activeDeal;
    setActiveDeal(null);
    if (!d || !event.over) return;
    const targetStage = String(event.over.id);
    if (targetStage && targetStage !== d.stage) {
      onMoveDealStage(d, targetStage);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
        {DEAL_STAGES_META.map((st) => (
          <DroppableStageColumn
            key={st.key}
            stageKey={st.key}
            label={st.label}
            color={st.color}
            deals={deals.filter((d) => d.stage === st.key)}
            canDrag={canEdit}
            onSelectDeal={onSelectDeal}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div style={{ width: 270, background: '#FFFFFF', border: '2px solid #1E40FF', borderRadius: 12, padding: '0.85rem', boxShadow: '0 14px 30px rgba(30, 64, 255, 0.2)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>{activeDeal.title}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E40FF', marginTop: 4 }}>
              {formatCurrencyVnd(activeDeal.amount_vnd)}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
