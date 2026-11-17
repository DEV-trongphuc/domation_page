import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  BellOff,
  CheckCircle2,
  Clock,
  GripVertical,
  Link2,
  MessageSquare,
  Paperclip,
} from 'lucide-react';
import type { WorkspaceTaskRecord } from '../../drawers/crmTypes';

export interface SortableTaskCardProps {
  task: WorkspaceTaskRecord;
  canEdit: boolean;
  onOpen: (t: WorkspaceTaskRecord) => void;
  onQuickToggleDone: (t: WorkspaceTaskRecord) => void;
}

export const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
  task,
  canEdit,
  onOpen,
  onQuickToggleDone,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: !canEdit });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    padding: '1rem 1.1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
  };

  const isDone = task.status_key === 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      draggable={canEdit}
      onDragStart={(e) => e.dataTransfer.setData('text/dom-task-id', task.id)}
      onClick={() => onOpen(task)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickToggleDone(task);
            }}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: isDone ? 'none' : '1.5px solid #CBD5E1',
              background: isDone ? '#059669' : '#FFFFFF',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canEdit ? 'pointer' : 'default',
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            {isDone && <CheckCircle2 size={14} />}
          </button>
          <strong
            style={{
              fontSize: '0.88rem',
              color: isDone ? '#94A3B8' : '#0F172A',
              textDecoration: isDone ? 'line-through' : 'none',
              lineHeight: 1.35,
            }}
          >
            {task.title}
          </strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {task.is_muted && <BellOff size={13} color="#94A3B8" />}
          {canEdit && (
            <span
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              style={{ color: '#94A3B8', cursor: 'grab' }}
            >
              <GripVertical size={15} />
            </span>
          )}
        </div>
      </div>

      <div style={{ height: 5, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden' }}>
        <div style={{ width: `${task.progress_pct}%`, height: '100%', background: isDone ? '#059669' : '#1E40FF' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748B', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ padding: '2px 7px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF', fontWeight: 700 }}>
            {task.priority}
          </span>
          {Boolean(task.dependencies_count) && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Link2 size={12} /> {task.dependencies_count}
            </span>
          )}
          {Boolean(task.comments_count) && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <MessageSquare size={12} /> {task.comments_count}
            </span>
          )}
          {Boolean(task.attachments_count) && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Paperclip size={12} /> {task.attachments_count}
            </span>
          )}
        </div>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Clock size={12} color="#1E40FF" /> {task.logged_minutes}p
        </span>
      </div>
    </div>
  );
};
