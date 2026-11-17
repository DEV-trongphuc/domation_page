import React, { useState } from 'react';
import { ArrowRight, CheckSquare, MessageSquare, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  PRIORITY_BADGE_MAP,
  type KanbanColumnItem,
  type ProjectRow,
  type StaffMemberLookup,
  type TaskRow,
} from './projectsTypes';

export interface ProjectsKanbanBoardProps {
  columns: KanbanColumnItem[];
  tasks: TaskRow[];
  activeProject: ProjectRow | null;
  selectedProjectId: string;
  staff: StaffMemberLookup[];
  canEdit: boolean;
  projectModalOpen: boolean;
  onCloseProjectModal: () => void;
  onProjectCreated: (created: ProjectRow) => Promise<void> | void;
  columnModalOpen: boolean;
  onCloseColumnModal: () => void;
  taskModalOpen: boolean;
  onCloseTaskModal: () => void;
  onInspectTask: (task: TaskRow) => void;
  onReload: () => Promise<void> | void;
}

export const ProjectsKanbanBoard: React.FC<ProjectsKanbanBoardProps> = ({
  columns,
  tasks,
  activeProject,
  selectedProjectId,
  staff,
  canEdit,
  projectModalOpen,
  onCloseProjectModal,
  onProjectCreated,
  columnModalOpen,
  onCloseColumnModal,
  taskModalOpen,
  onCloseTaskModal,
  onInspectTask,
  onReload,
}) => {
  const { token, tenantSlug } = useAuth();
  const [projName, setProjName] = useState('');
  const [projBudget, setProjBudget] = useState('250000000');
  const [projDueDate, setProjDueDate] = useState('');

  const [newColLabel, setNewColLabel] = useState('');
  const [newColColor, setNewColColor] = useState('#1E40FF');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskEstimate, setTaskEstimate] = useState('90');

  const handleCreateProject = async () => {
    if (!projName.trim()) {
      toast.error('Vui lòng nhập tên dự án');
      return;
    }
    try {
      const created = await apiRequest<ProjectRow>('/projects', {
        method: 'POST',
        token,
        tenantSlug,
        body: { name: projName.trim(), budget_vnd: Number(projBudget || 0), due_date: projDueDate || null },
      });
      toast.success('Đã khởi tạo dự án mới');
      setProjName('');
      onCloseProjectModal();
      await onProjectCreated(created);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo dự án'));
    }
  };

  const handleAddColumn = async () => {
    if (!activeProject || !newColLabel.trim()) return;
    const slugKey = newColLabel
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_');
    const nextCols: KanbanColumnItem[] = [
      ...columns.filter((c) => !c.is_done),
      { key: `${slugKey}_${columns.length + 1}`, label: newColLabel.trim(), color: newColColor },
      ...columns.filter((c) => c.is_done),
    ];
    try {
      await apiRequest(`/projects/${activeProject.id}/columns`, {
        method: 'PUT',
        token,
        tenantSlug,
        body: { columns: nextCols },
      });
      toast.success('Đã lưu cột trạng thái Kanban');
      setNewColLabel('');
      onCloseColumnModal();
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thêm cột Kanban'));
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề công việc');
      return;
    }
    try {
      await apiRequest('/projects/tasks', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          project_id: selectedProjectId || null,
          title: taskTitle.trim(),
          priority: taskPriority,
          assignee_user_id: taskAssigneeId || undefined,
          start_date: taskStartDate || undefined,
          due_date: taskDueDate || undefined,
          estimated_minutes: Number(taskEstimate || 60),
        },
      });
      toast.success('Đã thêm công việc vào dự án');
      setTaskTitle('');
      onCloseTaskModal();
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo công việc'));
    }
  };

  const handleMoveTask = async (task: TaskRow, nextStatusKey: string) => {
    try {
      await apiRequest(`/projects/tasks/${task.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { status_key: nextStatusKey },
      });
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể chuyển cột công việc'));
    }
  };

  return (
    <>
      {columns.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))`, gap: '1rem', overflowX: 'auto', alignItems: 'start' }}>
          {columns.map((col, colIdx) => {
            const colTasks = tasks.filter((t) => t.status_key === col.key);
            const nextCol = columns[colIdx + 1];
            return (
              <div key={col.key} style={{ background: '#F8F9FA', border: '1px solid #E2E8F0', borderTop: `3px solid ${col.color}`, borderRadius: 18, padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>{col.label}</strong>
                  <Badge tone="neutral">{colTasks.length}</Badge>
                </div>
                {colTasks.map((t) => {
                  const prio = PRIORITY_BADGE_MAP[t.priority] || PRIORITY_BADGE_MAP.medium;
                  const doneChecks = (t.checklist || []).filter((c) => c.done).length;
                  return (
                    <div
                      key={t.id}
                      onClick={() => onInspectTask(t)}
                      style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 8 }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{t.title}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        <Badge tone={prio.tone}>{prio.label}</Badge>
                        {t.checklist.length > 0 && <Badge tone="info" icon={<CheckSquare size={11} />}>{doneChecks}/{t.checklist.length}</Badge>}
                        {(t.comments_count || 0) > 0 && <Badge tone="neutral" icon={<MessageSquare size={11} />}>{t.comments_count}</Badge>}
                        {(t.attachments_count || 0) > 0 && <Badge tone="neutral" icon={<Paperclip size={11} />}>{t.attachments_count}</Badge>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748B', paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
                        <span>{t.assignee_name || 'Chưa gán'} • {formatShortDate(t.due_date)}</span>
                        {canEdit && nextCol && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleMoveTask(t, nextCol.key);
                            }}
                            style={{ border: 'none', background: '#EFF6FF', color: '#1E40FF', borderRadius: 8, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          >
                            {nextCol.label} <ArrowRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <CustomModal isOpen={projectModalOpen} onClose={onCloseProjectModal} title="Khởi Tạo Dự Án Mới" width={480}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="Tên dự án..." style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          <input type="number" value={projBudget} onChange={(e) => setProjBudget(e.target.value)} placeholder="Ngân sách dự kiến (VNĐ)..." style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          <input type="date" value={projDueDate} onChange={(e) => setProjDueDate(e.target.value)} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          <button type="button" onClick={() => void handleCreateProject()} style={{ height: 44, borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>Tạo dự án</button>
        </div>
      </CustomModal>

      <CustomModal isOpen={columnModalOpen} onClose={onCloseColumnModal} title="Thêm Cột Trạng Thái Kanban" width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={newColLabel} onChange={(e) => setNewColLabel(e.target.value)} placeholder="Tên cột mới (VD: Kiểm thử QA)..." style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          <input type="color" value={newColColor} onChange={(e) => setNewColColor(e.target.value)} style={{ height: 44, width: '100%', borderRadius: 12, border: '1px solid #E2E8F0' }} />
          <button type="button" onClick={() => void handleAddColumn()} style={{ height: 44, borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>Lưu cột Kanban</button>
        </div>
      </CustomModal>

      <CustomModal isOpen={taskModalOpen} onClose={onCloseTaskModal} title="Giao Công Việc Mới" width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Tiêu đề công việc..." style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
              <option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option><option value="urgent">Khẩn cấp</option>
            </select>
            <select value={taskAssigneeId} onChange={(e) => setTaskAssigneeId(e.target.value)} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
              <option value="">-- Người phụ trách --</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            <input type="date" value={taskStartDate} onChange={(e) => setTaskStartDate(e.target.value)} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
            <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          </div>
          <input type="number" value={taskEstimate} onChange={(e) => setTaskEstimate(e.target.value)} placeholder="Thời lượng ước tính (phút)..." style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
          <button type="button" onClick={() => void handleCreateTask()} style={{ height: 44, borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>Thêm công việc</button>
        </div>
      </CustomModal>
    </>
  );
};
