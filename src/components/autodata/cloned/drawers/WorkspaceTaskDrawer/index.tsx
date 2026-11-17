import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bell,
  BellOff,
  CheckSquare,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Save,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { DrawerShell, type DrawerTabDef } from '../DrawerShell';
import type {
  CrmStaffMember,
  PomodoroSessionRecord,
  TaskAttachmentItem,
  TaskCommentItem,
  TaskDependencyItem,
  WorkspaceTaskGroup,
  WorkspaceTaskRecord,
} from '../crmTypes';
import { crmGet, crmMutate } from '../crm360Api';
import { openGlobalCustomerDrawer } from '../drawerEvents';
import { TaskChecklistsAndDeps } from './TaskChecklistsAndDeps';
import { TaskCommentsAttachmentsPomodoro } from './TaskCommentsAttachmentsPomodoro';

export interface WorkspaceTaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: { id: string; title?: string } | WorkspaceTaskRecord | null;
  staff?: CrmStaffMember[];
  taskGroups?: WorkspaceTaskGroup[];
  onUpdated?: () => void;
  zIndex?: number;
}

interface TaskDetailPayload {
  task: WorkspaceTaskRecord;
  dependencies: TaskDependencyItem[];
  comments: TaskCommentItem[];
  attachments: TaskAttachmentItem[];
  pomodoro_sessions: PomodoroSessionRecord[];
  candidate_tasks: Array<{ id: string; title: string; status_key: string }>;
}

const TaskMetaForm: React.FC<{
  task: WorkspaceTaskRecord;
  staff: CrmStaffMember[];
  groups: WorkspaceTaskGroup[];
  canEdit: boolean;
  token?: string | null;
  tenantSlug?: string | null;
  onSaved: () => void;
}> = ({ task, staff, groups, canEdit, token, tenantSlug, onSaved }) => {
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [statusKey, setStatusKey] = useState(task.status_key || 'todo');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [assigneeId, setAssigneeId] = useState(task.assignee_user_id || '');
  const [groupId, setGroupId] = useState(task.group_id || '');
  const [dueDate, setDueDate] = useState(task.due_date ? String(task.due_date).slice(0, 10) : '');
  const [estMinutes, setEstMinutes] = useState(Number(task.estimated_minutes || 45));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!canEdit || saving) return;
    setSaving(true);
    try {
      await crmMutate(`/workspace/tasks/${task.id}`, 'PUT', { token, tenantSlug }, {
        title: title.trim(),
        description: description.trim() || null,
        status_key: statusKey,
        priority,
        assignee_user_id: assigneeId || null,
        group_id: groupId || null,
        due_date: dueDate || null,
        estimated_minutes: estMinutes,
      });
      toast.success('Đã lưu thông tin công việc');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu công việc');
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    height: 44,
    width: '100%',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    padding: '0 12px',
    fontSize: '0.84rem',
    background: canEdit ? '#FFFFFF' : '#F8FAFC',
    color: '#0F172A',
  };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {task.lead_id && (
        <div>
          <button
            type="button"
            onClick={() => openGlobalCustomerDrawer(String(task.lead_id))}
            style={{ height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid #DBEAFE', background: '#EFF6FF', color: '#1E40FF', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
          >
            <User size={13} /> Khách hàng liên kết: {task.contact_name || 'Mở Hồ sơ 360°'}
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
          <span style={{ fontSize: '0.77rem', fontWeight: 700, color: '#334155' }}>Tiêu đề công việc *</span>
          <input value={title} disabled={!canEdit} onChange={(e) => setTitle(e.target.value)} style={inp} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.77rem', fontWeight: 700, color: '#334155' }}>Trạng thái</span>
          <select value={statusKey} disabled={!canEdit} onChange={(e) => setStatusKey(e.target.value)} style={inp}>
            <option value="todo">Cần làm (To Do)</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="review">Chờ nghiệm thu</option>
            <option value="done">Hoàn thành (Done)</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.77rem', fontWeight: 700, color: '#334155' }}>Độ ưu tiên</span>
          <select value={priority} disabled={!canEdit} onChange={(e) => setPriority(e.target.value)} style={inp}>
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao</option>
            <option value="urgent">Khẩn cấp</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.77rem', fontWeight: 700, color: '#334155' }}>Người thực hiện</span>
          <select value={assigneeId} disabled={!canEdit} onChange={(e) => setAssigneeId(e.target.value)} style={inp}>
            <option value="">— Chưa phân công —</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.77rem', fontWeight: 700, color: '#334155' }}>Nhóm việc cá nhân</span>
          <select value={groupId} disabled={!canEdit} onChange={(e) => setGroupId(e.target.value)} style={inp}>
            <option value="">— Chưa phân nhóm —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.77rem', fontWeight: 700, color: '#334155' }}>Hạn hoàn thành</span>
          <input type="date" value={dueDate} disabled={!canEdit} onChange={(e) => setDueDate(e.target.value)} style={inp} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.77rem', fontWeight: 700, color: '#334155' }}>Thời lượng dự kiến (phút)</span>
          <input type="number" value={estMinutes} disabled={!canEdit} onChange={(e) => setEstMinutes(Number(e.target.value || 30))} style={inp} />
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: '0.77rem', fontWeight: 700, color: '#334155' }}>Mô tả chi tiết & Yêu cầu nghiệm thu</span>
        <textarea
          rows={3}
          disabled={!canEdit}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 12px', fontSize: '0.84rem' }}
        />
      </label>

      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            style={{ height: 44, padding: '0 1.4rem', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu Công việc'}
          </button>
        </div>
      )}
    </div>
  );
};

export const WorkspaceTaskDrawer: React.FC<WorkspaceTaskDrawerProps> = ({
  isOpen,
  onClose,
  task,
  staff = [],
  taskGroups = [],
  onUpdated,
  zIndex = 1240,
}) => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const creds = React.useMemo(() => ({ token, tenantSlug }), [token, tenantSlug]);

  const [activeTab, setActiveTab] = useState('overview');
  const [detail, setDetail] = useState<TaskDetailPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const taskId = task?.id ? String(task.id) : '';
  const canEdit =
    can('workspace_personal', 'edit') ||
    can('projects', 'edit') ||
    can('leads', 'edit');

  const loadTask = useCallback(async () => {
    if (!isOpen || !taskId) return;
    setLoading(true);
    try {
      const res = await crmGet<TaskDetailPayload>(`/workspace/tasks/${taskId}`, creds);
      setDetail(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải chi tiết công việc');
    } finally {
      setLoading(false);
    }
  }, [isOpen, taskId, creds]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTask();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTask]);

  const tk = detail?.task;

  const toggleFlag = async (field: 'is_muted' | 'is_hidden') => {
    if (!tk || !canEdit) return;
    try {
      await crmMutate(`/workspace/tasks/${tk.id}`, 'PUT', creds, {
        [field]: !tk[field],
      });
      toast.success(
        field === 'is_muted'
          ? !tk.is_muted
            ? 'Đã tắt thông báo cho công việc này'
            : 'Đã bật lại thông báo công việc'
          : !tk.is_hidden
          ? 'Đã ẩn công việc khỏi Bàn làm việc'
          : 'Đã hiển thị lại công việc'
      );
      onUpdated?.();
      await loadTask();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật tùy chọn');
    }
  };

  const tabs: DrawerTabDef[] = [
    { id: 'overview', label: 'Chi tiết & Phân công', icon: <FileText size={15} /> },
    {
      id: 'checklists',
      label: 'Subtasks & Ràng buộc',
      icon: <CheckSquare size={15} />,
      badge: (tk?.checklist_json?.length || 0) + (detail?.dependencies.length || 0),
    },
    {
      id: 'collab',
      label: 'Pomodoro, Tệp & @Thảo luận',
      icon: <Clock size={15} />,
      badge: (detail?.comments.length || 0) + (detail?.attachments.length || 0),
    },
  ];

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={zIndex}
      loading={loading || !tk}
      title={tk?.title || task?.title || 'Chi tiết Công việc'}
      subtitle={
        tk
          ? `Tiến độ: ${tk.progress_pct}% • Đã tập trung: ${tk.logged_minutes} phút / Dự kiến: ${tk.estimated_minutes} phút`
          : undefined
      }
      headerActions={
        tk && canEdit ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => void toggleFlag('is_muted')}
              style={{
                height: 38,
                padding: '0 10px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: tk.is_muted ? '#EFF6FF' : '#FFFFFF',
                color: tk.is_muted ? '#1E40FF' : '#475569',
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              {tk.is_muted ? <BellOff size={14} /> : <Bell size={14} />}
              {tk.is_muted ? 'Đang tắt chuông' : 'Chuông bật'}
            </button>
            <button
              type="button"
              onClick={() => void toggleFlag('is_hidden')}
              style={{
                height: 38,
                padding: '0 10px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: tk.is_hidden ? '#EFF6FF' : '#FFFFFF',
                color: tk.is_hidden ? '#1E40FF' : '#475569',
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              {tk.is_hidden ? <EyeOff size={14} /> : <Eye size={14} />}
              {tk.is_hidden ? 'Đang ẩn' : 'Hiển thị'}
            </button>
          </div>
        ) : undefined
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {tk && detail && (
        <>
          {activeTab === 'overview' && (
            <TaskMetaForm
              key={`${tk.id}-${tk.completed_at || ''}`}
              task={tk}
              staff={staff}
              groups={taskGroups}
              canEdit={canEdit}
              token={token}
              tenantSlug={tenantSlug}
              onSaved={() => {
                onUpdated?.();
                void loadTask();
              }}
            />
          )}

          {activeTab === 'checklists' && (
            <TaskChecklistsAndDeps
              task={tk}
              dependencies={detail.dependencies}
              candidateTasks={detail.candidate_tasks}
              canEdit={canEdit}
              creds={creds}
              onReload={async () => {
                onUpdated?.();
                await loadTask();
              }}
            />
          )}

          {activeTab === 'collab' && (
            <TaskCommentsAttachmentsPomodoro
              taskId={tk.id}
              loggedMinutes={tk.logged_minutes}
              comments={detail.comments}
              attachments={detail.attachments}
              pomodoroSessions={detail.pomodoro_sessions}
              staff={staff}
              canEdit={canEdit}
              creds={creds}
              onReload={async () => {
                onUpdated?.();
                await loadTask();
              }}
            />
          )}
        </>
      )}
    </DrawerShell>
  );
};

export default WorkspaceTaskDrawer;
