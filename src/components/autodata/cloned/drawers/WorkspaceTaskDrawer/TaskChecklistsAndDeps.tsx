import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckSquare, Link2, Plus, Trash2 } from 'lucide-react';
import type {
  TaskChecklistItem,
  TaskDependencyItem,
  WorkspaceTaskRecord,
} from '../crmTypes';
import { crmMutate, type CrmAuthCreds } from '../crm360Api';

export interface TaskChecklistsAndDepsProps {
  task: WorkspaceTaskRecord;
  dependencies: TaskDependencyItem[];
  candidateTasks: Array<{ id: string; title: string; status_key: string }>;
  canEdit: boolean;
  creds: CrmAuthCreds;
  onReload: () => Promise<void> | void;
}

export const TaskChecklistsAndDeps: React.FC<TaskChecklistsAndDepsProps> = ({
  task,
  dependencies,
  candidateTasks,
  canEdit,
  creds,
  onReload,
}) => {
  const [newSubtask, setNewSubtask] = useState('');
  const [depTargetId, setDepTargetId] = useState('');
  const [depType, setDepType] = useState<'blocked_by' | 'blocks' | 'relates_to'>('blocked_by');

  const checklist: TaskChecklistItem[] = Array.isArray(task.checklist_json)
    ? task.checklist_json
    : [];
  const doneCount = checklist.filter((c) => c.done).length;
  const pct = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : task.progress_pct;

  const saveChecklist = async (nextList: TaskChecklistItem[]) => {
    try {
      await crmMutate(`/workspace/tasks/${task.id}`, 'PUT', creds, {
        checklist_json: nextList,
      });
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu danh sách việc con');
    }
  };

  const handleAddSubtask = async () => {
    const t = newSubtask.trim();
    if (!t) return;
    setNewSubtask('');
    await saveChecklist([
      ...checklist,
      { id: `chk-${Date.now()}`, title: t, done: false },
    ]);
  };

  const handleToggleItem = async (id: string) => {
    if (!canEdit) return;
    await saveChecklist(
      checklist.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleRemoveItem = async (id: string) => {
    if (!canEdit) return;
    await saveChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleAddDependency = async () => {
    if (!depTargetId) {
      toast.error('Vui lòng chọn công việc liên quan');
      return;
    }
    try {
      await crmMutate(`/workspace/tasks/${task.id}/dependencies`, 'POST', creds, {
        depends_on_task_id: depTargetId,
        dependency_type: depType,
      });
      toast.success('Đã thiết lập ràng buộc công việc (`tenant_task_dependencies`)');
      setDepTargetId('');
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể thêm phụ thuộc');
    }
  };

  const handleRemoveDependency = async (depId: string) => {
    try {
      await crmMutate(`/workspace/tasks/${task.id}/dependencies/${depId}`, 'DELETE', creds);
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gỡ phụ thuộc');
    }
  };

  const hasOpenBlocker = dependencies.some(
    (d) => d.dependency_type === 'blocked_by' && d.depends_on_status !== 'done'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Subtasks & Checklists */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckSquare size={17} color="#1E40FF" />
            <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
              Subtasks & Checklist kiểm thử ({doneCount}/{checklist.length})
            </strong>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1E40FF' }}>{pct}%</span>
        </div>

        <div style={{ height: 8, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#1E40FF', transition: 'width 0.2s ease' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {checklist.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                background: item.done ? '#F8FAFC' : '#FFFFFF',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: canEdit ? 'pointer' : 'default', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={item.done}
                  disabled={!canEdit}
                  onChange={() => void handleToggleItem(item.id)}
                  style={{ width: 17, height: 17, accentColor: '#1E40FF' }}
                />
                <span
                  style={{
                    fontSize: '0.84rem',
                    color: item.done ? '#94A3B8' : '#0F172A',
                    textDecoration: item.done ? 'line-through' : 'none',
                  }}
                >
                  {item.title}
                </span>
              </label>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => void handleRemoveItem(item.id)}
                  style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {canEdit && (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="Thêm việc con (Subtask) mới..."
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleAddSubtask();
                }
              }}
              style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.84rem' }}
            />
            <button
              type="button"
              onClick={() => void handleAddSubtask()}
              style={{ height: 44, padding: '0 16px', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
            >
              <Plus size={14} /> Thêm bước
            </button>
          </div>
        )}
      </div>

      {/* Task Dependencies (`tenant_task_dependencies`) */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link2 size={17} color="#1E40FF" />
            <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
              Phụ thuộc Công việc (`tenant_task_dependencies`) ({dependencies.length})
            </strong>
          </div>
          {hasOpenBlocker && (
            <span style={{ fontSize: '0.73rem', fontWeight: 800, padding: '2px 10px', borderRadius: 999, background: '#FEF3C7', color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={12} /> Đang chờ việc tiên quyết
            </span>
          )}
        </div>

        {canEdit && (
          <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.6fr auto', gap: 8, marginBottom: 12 }}>
            <select
              value={depType}
              onChange={(e) => setDepType(e.target.value as 'blocked_by' | 'blocks' | 'relates_to')}
              style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.82rem', background: '#FFFFFF' }}
            >
              <option value="blocked_by">Chờ hoàn thành (Blocked by)</option>
              <option value="blocks">Chặn công việc (Blocks)</option>
              <option value="relates_to">Liên quan tới (Relates to)</option>
            </select>
            <select
              value={depTargetId}
              onChange={(e) => setDepTargetId(e.target.value)}
              style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.82rem', background: '#FFFFFF' }}
            >
              <option value="">— Chọn công việc phụ thuộc —</option>
              {candidateTasks.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.title} ({ct.status_key})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleAddDependency()}
              style={{ height: 44, padding: '0 14px', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Liên kết
            </button>
          </div>
        )}

        {dependencies.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Chưa thiết lập ràng buộc phụ thuộc nào.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dependencies.map((d) => (
              <div key={d.id} style={{ padding: '8px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.83rem' }}>
                  <span style={{ fontWeight: 700, color: '#1E40FF', marginRight: 6 }}>[{d.dependency_type}]</span>
                  <strong style={{ color: '#0F172A' }}>{d.depends_on_title || d.depends_on_task_id}</strong>{' '}
                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>({d.depends_on_status || 'todo'})</span>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => void handleRemoveDependency(d.id)}
                    style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
