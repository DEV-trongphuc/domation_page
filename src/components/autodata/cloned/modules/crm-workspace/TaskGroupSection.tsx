import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Briefcase,
  Check,
  Flame,
  Folder,
  Inbox,
  Layers,
  Pin,
  Plus,
  Star,
  Target,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { CustomModal } from '../../components/ui/CustomModal';
import type {
  WorkspaceTaskGroup,
  WorkspaceTaskGroupsSummary,
} from '../../drawers/crmTypes';
import { crmMutate, type CrmAuthCreds } from '../../drawers/crm360Api';

const GROUP_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Folder,
  Star,
  Zap,
  Target,
  Briefcase,
  Flame,
  Layers,
  Inbox,
  User,
};

const GROUP_COLORS = [
  '#1E40FF',
  '#0284C7',
  '#059669',
  '#D97706',
  '#7C3AED',
  '#EC4899',
  '#14B8A6',
  '#64748B',
];

export interface TaskGroupSectionProps {
  groups: WorkspaceTaskGroup[];
  summary: WorkspaceTaskGroupsSummary;
  selectedGroupKey: string;
  onSelectGroup: (key: string) => void;
  onDropTaskToGroup: (taskId: string, groupId: string | null) => void;
  canEdit: boolean;
  creds: CrmAuthCreds;
  onReload: () => Promise<void> | void;
}

export const TaskGroupSection: React.FC<TaskGroupSectionProps> = ({
  groups,
  summary,
  selectedGroupKey,
  onSelectGroup,
  onDropTaskToGroup,
  canEdit,
  creds,
  onReload,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WorkspaceTaskGroup | null>(null);
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState('#1E40FF');
  const [iconName, setIconName] = useState('Folder');
  const [dragGroupIdx, setDragGroupIdx] = useState<number | null>(null);

  const openCreate = () => {
    setEditingGroup(null);
    setName('');
    setColorHex('#1E40FF');
    setIconName('Folder');
    setShowModal(true);
  };

  const handleSaveGroup = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên nhóm công việc');
      return;
    }
    try {
      if (editingGroup) {
        await crmMutate(`/workspace/groups/${editingGroup.id}`, 'PUT', creds, {
          name: name.trim(),
          color_hex: colorHex,
          icon_name: iconName,
        });
        toast.success('Đã cập nhật nhóm công việc');
      } else {
        await crmMutate('/workspace/groups', 'POST', creds, {
          name: name.trim(),
          color_hex: colorHex,
          icon_name: iconName,
          sort_order: groups.length,
        });
        toast.success('Đã tạo nhóm công việc cá nhân');
      }
      setShowModal(false);
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu nhóm công việc');
    }
  };

  const handleTogglePin = async (g: WorkspaceTaskGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await crmMutate(`/workspace/groups/${g.id}`, 'PUT', creds, {
        is_pinned: !g.is_pinned,
      });
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể ghim nhóm');
    }
  };

  const handleDeleteGroup = async (g: WorkspaceTaskGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await crmMutate(`/workspace/groups/${g.id}`, 'DELETE', creds);
      if (selectedGroupKey === g.id) onSelectGroup('all');
      toast.success('Đã xóa nhóm công việc');
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa nhóm');
    }
  };

  const handleGroupDropReorder = async (targetIdx: number) => {
    if (dragGroupIdx === null || dragGroupIdx === targetIdx) return;
    const next = [...groups];
    const [moved] = next.splice(dragGroupIdx, 1);
    next.splice(targetIdx, 0, moved);
    setDragGroupIdx(null);
    try {
      await crmMutate('/workspace/groups/reorder', 'POST', creds, {
        ordered_ids: next.map((x) => x.id),
      });
      await onReload();
    } catch {
      // ignore transient reorder error
    }
  };

  const systemCards = [
    { key: 'all', title: 'Tất cả Việc của tôi', color: '#1E40FF', icon: Layers, stats: summary.all, droppable: false },
    { key: 'personal', title: 'Việc Cá nhân', color: '#0284C7', icon: User, stats: summary.personal, droppable: false },
    { key: 'unassigned', title: 'Chưa phân nhóm', color: '#64748B', icon: Inbox, stats: summary.unassigned, droppable: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {systemCards.map((sc) => {
          const IconComp = sc.icon;
          const selected = selectedGroupKey === sc.key;
          return (
            <div
              key={sc.key}
              onClick={() => onSelectGroup(sc.key)}
              onDragOver={(e) => {
                if (sc.droppable) e.preventDefault();
              }}
              onDrop={(e) => {
                const tid = e.dataTransfer.getData('text/dom-task-id');
                if (sc.droppable && tid) {
                  e.preventDefault();
                  onDropTaskToGroup(tid, null);
                }
              }}
              style={{
                minWidth: 190,
                padding: '10px 14px',
                borderRadius: 14,
                background: '#FFFFFF',
                border: selected ? `2px solid ${sc.color}` : '1px solid #E2E8F0',
                boxShadow: selected ? '0 4px 14px rgba(30, 64, 255, 0.1)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>
                  <IconComp size={15} color={sc.color} /> {sc.title}
                </span>
                <span style={{ fontSize: '0.73rem', fontWeight: 700, color: sc.color }}>
                  {sc.stats.completed_tasks}/{sc.stats.total_tasks}
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden' }}>
                <div style={{ width: `${sc.stats.progress_percent}%`, height: '100%', background: sc.color }} />
              </div>
            </div>
          );
        })}

        {groups.map((g, idx) => {
          const IconComp = GROUP_ICONS[g.icon_name] || Folder;
          const selected = selectedGroupKey === g.id;
          return (
            <div
              key={g.id}
              draggable={canEdit}
              onDragStart={() => setDragGroupIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const tid = e.dataTransfer.getData('text/dom-task-id');
                if (tid) {
                  onDropTaskToGroup(tid, g.id);
                } else {
                  void handleGroupDropReorder(idx);
                }
              }}
              onClick={() => onSelectGroup(g.id)}
              style={{
                minWidth: 200,
                padding: '10px 14px',
                borderRadius: 14,
                background: '#FFFFFF',
                border: selected
                  ? `2px solid ${g.color_hex}`
                  : g.is_pinned
                  ? '1.5px solid #F59E0B'
                  : '1px solid #E2E8F0',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <IconComp size={15} color={g.color_hex} /> {g.name}
                </span>
                {canEdit && (
                  <div style={{ display: 'inline-flex', gap: 4 }}>
                    <button type="button" onClick={(e) => void handleTogglePin(g, e)} style={{ border: 'none', background: 'transparent', color: g.is_pinned ? '#D97706' : '#94A3B8', cursor: 'pointer', padding: 2 }}>
                      <Pin size={12} />
                    </button>
                    <button type="button" onClick={(e) => void handleDeleteGroup(g, e)} style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: 2 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
                <span>Tiến độ {g.progress_percent}%</span>
                <strong>{g.completed_tasks}/{g.total_tasks}</strong>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden' }}>
                <div style={{ width: `${g.progress_percent}%`, height: '100%', background: g.color_hex }} />
              </div>
            </div>
          );
        })}

        {canEdit && (
          <button
            type="button"
            onClick={openCreate}
            style={{
              minWidth: 145,
              height: 66,
              borderRadius: 14,
              border: '1.5px dashed #CBD5E1',
              background: '#FFFFFF',
              color: '#1E40FF',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Plus size={15} /> Nhóm việc mới
          </button>
        )}
      </div>

      <CustomModal isOpen={showModal} onClose={() => setShowModal(false)} title="Tạo Nhóm Công việc Cá nhân">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Tên nhóm việc (VD: Ưu tiên Q4, Việc khách VIP)..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>Chọn màu sắc:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {GROUP_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColorHex(c)}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: colorHex === c ? '2px solid #0F172A' : 'none', background: c, color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {colorHex === c && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>Chọn biểu tượng:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(GROUP_ICONS).map(([key, Ic]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIconName(key)}
                  style={{ width: 38, height: 38, borderRadius: 10, border: iconName === key ? '1.5px solid #1E40FF' : '1px solid #E2E8F0', background: iconName === key ? '#EFF6FF' : '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Ic size={16} color={iconName === key ? '#1E40FF' : '#475569'} />
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSaveGroup()}
            style={{ height: 44, borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Lưu Nhóm Công việc
          </button>
        </div>
      </CustomModal>
    </div>
  );
};
