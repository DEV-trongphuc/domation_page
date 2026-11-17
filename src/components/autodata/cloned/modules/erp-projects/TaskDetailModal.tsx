import React, { useCallback, useEffect, useState } from 'react';
import { CheckSquare, Link2, MessageSquare, Paperclip, Plus, Send, Timer, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  DEPENDENCY_TYPE_OPTIONS,
  formatBytesCompact,
  toDateInputValue,
  type ChecklistEntry,
  type DependencyTypeCode,
  type KanbanColumnItem,
  type StaffMemberLookup,
  type TaskAttachmentRow,
  type TaskCommentRow,
  type TaskDependencyRow,
  type TaskRow,
} from './projectsTypes';

type TaskDetailSubTab = 'checklist' | 'dependencies' | 'comments' | 'attachments';

export interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskRow | null;
  allTasks: TaskRow[];
  columns: KanbanColumnItem[];
  staff: StaffMemberLookup[];
  canEdit: boolean;
  onUpdated: () => Promise<void> | void;
  onStartPomodoro?: (task: TaskRow) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  allTasks,
  columns,
  staff,
  canEdit,
  onUpdated,
  onStartPomodoro,
}) => {
  const { token, tenantSlug } = useAuth();
  const [subTab, setSubTab] = useState<TaskDetailSubTab>('checklist');
  const [loading, setLoading] = useState(true);

  const [statusKey, setStatusKey] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [checklist, setChecklist] = useState<ChecklistEntry[]>([]);
  const [newCheckText, setNewCheckText] = useState('');

  const [deps, setDeps] = useState<TaskDependencyRow[]>([]);
  const [predId, setPredId] = useState('');
  const [depType, setDepType] = useState<DependencyTypeCode>('FS');
  const [lagDays, setLagDays] = useState('0');

  const [comments, setComments] = useState<TaskCommentRow[]>([]);
  const [commentText, setCommentText] = useState('');
  const [attachments, setAttachments] = useState<TaskAttachmentRow[]>([]);
  const [attName, setAttName] = useState('');
  const [attUrl, setAttUrl] = useState('');

  const loadTaskDetails = useCallback(
    async (t: TaskRow) => {
      const [depRes, comRes, attRes] = await Promise.all([
        apiRequest<{ items: TaskDependencyRow[] }>(`/projects/tasks/${t.id}/dependencies`, { token, tenantSlug }),
        apiRequest<{ items: TaskCommentRow[] }>(`/projects/tasks/${t.id}/comments`, { token, tenantSlug }),
        apiRequest<{ items: TaskAttachmentRow[] }>(`/projects/tasks/${t.id}/attachments`, { token, tenantSlug }),
      ]);
      return { deps: depRes.items || [], comments: comRes.items || [], attachments: attRes.items || [] };
    },
    [token, tenantSlug]
  );

  useEffect(() => {
    if (!isOpen || !task) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const bundle = await loadTaskDetails(task);
        if (!cancelled) {
          setStatusKey(task.status_key || 'todo');
          setPriority(task.priority || 'medium');
          setAssigneeId(task.assignee_user_id || '');
          setStartDate(toDateInputValue(task.start_date));
          setDueDate(toDateInputValue(task.due_date));
          setChecklist(task.checklist || []);
          setDeps(bundle.deps);
          setComments(bundle.comments);
          setAttachments(bundle.attachments);
          const first = bundle.deps[0];
          setPredId(first?.predecessor_task_id || '');
          const code = String(first?.dependency_type || 'FS').toUpperCase() as DependencyTypeCode;
          setDepType(['FS', 'SS', 'FF', 'SF'].includes(code) ? code : 'FS');
          setLagDays(String(first?.lag_days ?? 0));
        }
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải chi tiết công việc'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, task, loadTaskDetails]);

  if (!task) return null;

  const saveTaskPatch = async (overrideChecklist?: ChecklistEntry[]) => {
    if (!canEdit) return;
    const nextList = overrideChecklist || checklist;
    const doneCount = nextList.filter((c) => c.done).length;
    const autoPct = nextList.length > 0 ? Math.round((doneCount / nextList.length) * 100) : task.progress_pct;
    try {
      await apiRequest(`/projects/tasks/${task.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: {
          status_key: statusKey,
          priority,
          assignee_user_id: assigneeId || null,
          start_date: startDate || null,
          due_date: dueDate || null,
          checklist: nextList,
          progress_pct: statusKey === 'done' ? 100 : autoPct,
        },
      });
      toast.success('Đã cập nhật thông tin & Checklist công việc');
      await onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu công việc'));
    }
  };

  const handleToggleCheckItem = async (id: string) => {
    const next = checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c));
    setChecklist(next);
    await saveTaskPatch(next);
  };

  const handleAddCheckItem = async () => {
    if (!newCheckText.trim()) return;
    const next: ChecklistEntry[] = [
      ...checklist,
      { id: `chk-${checklist.length + 1}-${newCheckText.trim().length}`, text: newCheckText.trim(), done: false },
    ];
    setChecklist(next);
    setNewCheckText('');
    await saveTaskPatch(next);
  };

  const handleSaveDependencies = async () => {
    try {
      const payload = predId ? [{ predecessor_task_id: predId, dependency_type: depType, lag_days: Number(lagDays || 0) }] : [];
      const res = await apiRequest<{ items: TaskDependencyRow[] }>(`/projects/tasks/${task.id}/dependencies`, {
        method: 'PUT',
        token,
        tenantSlug,
        body: { dependencies: payload, cascade: true },
      });
      setDeps(res.items || []);
      toast.success('Đã cập nhật phụ thuộc Gantt');
      await onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu phụ thuộc'));
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    try {
      const added = await apiRequest<TaskCommentRow>(`/projects/tasks/${task.id}/comments`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { content: commentText.trim() },
      });
      setComments((prev) => [...prev, added]);
      setCommentText('');
      toast.success('Đã gửi bình luận công việc');
      await onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi bình luận'));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiRequest(`/projects/tasks/${task.id}/comments/${commentId}`, { method: 'DELETE', token, tenantSlug });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      await onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa bình luận'));
    }
  };

  const handleAddAttachment = async () => {
    if (!attName.trim()) {
      toast.error('Vui lòng nhập tên tệp đính kèm');
      return;
    }
    try {
      const added = await apiRequest<TaskAttachmentRow>(`/projects/tasks/${task.id}/attachments`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { file_name: attName.trim(), file_url: attUrl.trim() || undefined, size_bytes: 24576 },
      });
      setAttachments((prev) => [added, ...prev]);
      setAttName('');
      setAttUrl('');
      toast.success('Đã đính kèm tài liệu vào công việc');
      await onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đính kèm tệp'));
    }
  };

  const handleDeleteAttachment = async (attId: string) => {
    try {
      await apiRequest(`/projects/tasks/${task.id}/attachments/${attId}`, { method: 'DELETE', token, tenantSlug });
      setAttachments((prev) => prev.filter((a) => a.id !== attId));
      await onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa tệp đính kèm'));
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title={`Chi Tiết Công Việc — ${task.title}`} width={720}>
      {loading ? (
        <ModalBodySkeleton rows={4} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderRadius: 14, background: '#F8FAFF', border: '1px solid #DBEAFE' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Badge tone="primary">Đã log {task.logged_minutes}p / {task.estimated_minutes}p</Badge>
              <Badge tone="info">Tiến độ {task.progress_pct}%</Badge>
              {task.lead_name && <Badge tone="success">CRM: {task.lead_name}</Badge>}
            </div>
            {onStartPomodoro && (
              <button
                type="button"
                onClick={() => {
                  onStartPomodoro(task);
                  onClose();
                }}
                style={{ height: 38, padding: '0 14px', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Timer size={14} /> Bắt đầu phiên Pomodoro 25p
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <select value={statusKey} onChange={(e) => setStatusKey(e.target.value)} style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px' }}>
              {columns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px' }}>
              <option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option><option value="urgent">Khẩn cấp</option>
            </select>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px' }}>
              <option value="">-- Chưa phân công --</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px' }} />
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px' }} />
          </div>

          {canEdit && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => void saveTaskPatch()} className="btn secondary" style={{ height: 38, color: '#1E40FF', fontWeight: 700 }}>
                Lưu thuộc tính công việc
              </button>
            </div>
          )}

          <PillTabs<TaskDetailSubTab>
            activeKey={subTab}
            onChange={setSubTab}
            tabs={[
              { key: 'checklist', label: 'Checklist', icon: <CheckSquare size={14} />, count: checklist.length },
              { key: 'dependencies', label: 'Phụ thuộc Gantt', icon: <Link2 size={14} />, count: deps.length },
              { key: 'comments', label: 'Thảo luận @mention', icon: <MessageSquare size={14} />, count: comments.length },
              { key: 'attachments', label: 'Đính kèm', icon: <Paperclip size={14} />, count: attachments.length },
            ]}
          />

          {subTab === 'checklist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {canEdit && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={newCheckText} onChange={(e) => setNewCheckText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void handleAddCheckItem(); }} placeholder="Thêm bước kiểm tra con..." style={{ flex: 1, height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
                  <button type="button" onClick={() => void handleAddCheckItem()} className="btn secondary" style={{ height: 42, color: '#1E40FF' }}><Plus size={15} /></button>
                </div>
              )}
              {checklist.map((item) => (
                <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: '#F8F9FA', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={item.done} onChange={() => void handleToggleCheckItem(item.id)} />
                  <span style={{ fontSize: '0.84rem', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? '#64748B' : '#0F172A' }}>{item.text}</span>
                </label>
              ))}
            </div>
          )}

          {subTab === 'dependencies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select value={predId} onChange={(e) => setPredId(e.target.value)} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
                <option value="">-- Không phụ thuộc --</option>
                {allTasks.filter((cand) => cand.id !== task.id).map((cand) => <option key={cand.id} value={cand.id}>{cand.title}</option>)}
              </select>
              {predId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 10 }}>
                  <select value={depType} onChange={(e) => setDepType(e.target.value as DependencyTypeCode)} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
                    {DEPENDENCY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <input type="number" value={lagDays} onChange={(e) => setLagDays(e.target.value)} placeholder="Lag (ngày)" style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
                </div>
              )}
              {canEdit && (
                <button type="button" onClick={() => void handleSaveDependencies()} style={{ height: 42, borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>
                  Lưu & Cascade ngày tiến độ
                </button>
              )}
            </div>
          )}

          {subTab === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {staff.slice(0, 6).map((s) => (
                  <button key={s.id} type="button" onClick={() => setCommentText((prev) => `${prev}@${s.full_name.replace(/\s+/g, '_')} `)} style={{ padding: '3px 9px', borderRadius: 999, border: '1px solid #DBEAFE', background: '#EFF6FF', color: '#1E40FF', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                    @{s.full_name}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void handlePostComment(); }} placeholder="Nhập thảo luận hoặc @mention đồng nghiệp..." style={{ flex: 1, height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
                <button type="button" onClick={() => void handlePostComment()} style={{ height: 44, padding: '0 16px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}><Send size={15} /></button>
              </div>
              {comments.map((c) => (
                <div key={c.id} style={{ padding: '10px 12px', borderRadius: 12, background: '#F8F9FA', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40FF' }}>{c.author_name} • {formatShortDate(c.created_at)}</div>
                    <div style={{ fontSize: '0.84rem', color: '#0F172A', marginTop: 3 }}>{c.content}</div>
                  </div>
                  {canEdit && <button type="button" onClick={() => void handleDeleteComment(c.id)} style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={14} /></button>}
                </div>
              ))}
            </div>
          )}

          {subTab === 'attachments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {canEdit && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr auto', gap: 8 }}>
                  <input value={attName} onChange={(e) => setAttName(e.target.value)} placeholder="Tên tệp (VD: Ban_ve_v2.pdf)" style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
                  <input value={attUrl} onChange={(e) => setAttUrl(e.target.value)} placeholder="URL tài liệu (tùy chọn)..." style={{ height: 42, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px' }} />
                  <button type="button" onClick={() => void handleAddAttachment()} style={{ height: 42, padding: '0 14px', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>Đính kèm</button>
                </div>
              )}
              {attachments.map((att) => (
                <div key={att.id} style={{ padding: '10px 12px', borderRadius: 12, background: '#F8F9FA', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <a href={att.file_url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1E40FF', textDecoration: 'none' }}>{att.file_name}</a>
                    <div style={{ fontSize: '0.73rem', color: '#64748B' }}>{formatBytesCompact(att.size_bytes)} • {att.uploaded_by_name || 'Thành viên'} • {formatShortDate(att.created_at)}</div>
                  </div>
                  {canEdit && <button type="button" onClick={() => void handleDeleteAttachment(att.id)} style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={14} /></button>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </CustomModal>
  );
};
