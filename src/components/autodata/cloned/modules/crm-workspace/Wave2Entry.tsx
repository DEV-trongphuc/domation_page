import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  BarChart3,
  Layers,
  Palette,
  Plus,
  Search,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { WorkspaceTabSkeleton } from '../../components/ui/Skeleton';
import { WorkspaceTaskDrawer } from '../../drawers/WorkspaceTaskDrawer';
import type {
  CrmStaffMember,
  PomodoroSessionRecord,
  WorkspaceTaskGroup,
  WorkspaceTaskGroupsSummary,
  WorkspaceTaskRecord,
} from '../../drawers/crmTypes';
import { crmGet, crmMutate } from '../../drawers/crm360Api';
import { FocusPomodoroWidget } from './FocusPomodoroWidget';
import { SortableTaskCard } from './SortableTaskCard';
import { TaskGroupSection } from './TaskGroupSection';
import {
  WorkspaceCustomizerModal,
  type WorkspacePreferencesState,
} from './WorkspaceCustomizerModal';
import { WorkspaceTaskStatsModal } from './WorkspaceTaskStatsModal';

interface WorkspaceBootstrapPayload {
  preferences: WorkspacePreferencesState;
  groups: WorkspaceTaskGroup[];
  summary: WorkspaceTaskGroupsSummary;
  tasks: WorkspaceTaskRecord[];
  pomodoro_sessions: PomodoroSessionRecord[];
  staff: CrmStaffMember[];
}

export const PersonalWorkspacePage: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { can } = useEntitlement();
  const creds = useMemo(() => ({ token, tenantSlug }), [token, tenantSlug]);

  const [boot, setBoot] = useState<WorkspaceBootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGroupKey, setSelectedGroupKey] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [quickTitle, setQuickTitle] = useState('');

  const [activeTask, setActiveTask] = useState<WorkspaceTaskRecord | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const canEdit =
    can('workspace_personal', 'edit') ||
    can('projects', 'edit') ||
    can('leads', 'edit');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmGet<WorkspaceBootstrapPayload>('/workspace/bootstrap', creds);
      setBoot(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải Bàn làm việc cá nhân');
    } finally {
      setLoading(false);
    }
  }, [creds]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  const visibleTasks = useMemo(() => {
    const list = boot?.tasks || [];
    return list.filter((t) => {
      if (t.is_hidden) return false;
      if (boot?.preferences.hide_completed && t.status_key === 'done') return false;
      if (selectedGroupKey === 'personal') {
        if (t.category !== 'personal' && (t.project_id || t.lead_id)) return false;
      } else if (selectedGroupKey === 'unassigned') {
        if (t.group_id) return false;
      } else if (selectedGroupKey !== 'all') {
        if (String(t.group_id || '') !== selectedGroupKey) return false;
      }
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [boot, selectedGroupKey, categoryFilter, search]);

  const handleQuickAddTask = async () => {
    const title = quickTitle.trim();
    if (!title) return;
    try {
      await crmMutate('/workspace/tasks', 'POST', creds, {
        title,
        group_id:
          selectedGroupKey !== 'all' &&
          selectedGroupKey !== 'personal' &&
          selectedGroupKey !== 'unassigned'
            ? selectedGroupKey
            : null,
        category: 'personal',
      });
      setQuickTitle('');
      toast.success('Đã thêm việc mới vào Bàn làm việc');
      await loadWorkspace();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể thêm công việc');
    }
  };

  const handleToggleDone = async (task: WorkspaceTaskRecord) => {
    if (!canEdit) return;
    try {
      await crmMutate(`/workspace/tasks/${task.id}`, 'PUT', creds, {
        status_key: task.status_key === 'done' ? 'todo' : 'done',
      });
      await loadWorkspace();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    }
  };

  const handleDropTaskToGroup = async (taskId: string, groupId: string | null) => {
    try {
      await crmMutate(`/workspace/tasks/${taskId}`, 'PUT', creds, { group_id: groupId });
      toast.success('Đã chuyển công việc sang nhóm mới');
      await loadWorkspace();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể chuyển nhóm');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !boot) return;
    const oldIdx = visibleTasks.findIndex((t) => t.id === active.id);
    const newIdx = visibleTasks.findIndex((t) => t.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const reordered = arrayMove(visibleTasks, oldIdx, newIdx);
    const orderedIds = reordered.map((t) => t.id);
    setBoot((prev) =>
      prev
        ? {
            ...prev,
            tasks: [
              ...reordered,
              ...prev.tasks.filter((x) => !orderedIds.includes(x.id)),
            ],
          }
        : prev
    );
    try {
      await crmMutate('/workspace/tasks/reorder', 'POST', creds, { ordered_ids: orderedIds });
    } catch {
      // ignore reorder network jitter
    }
  };

  const handleSavePrefs = async (next: WorkspacePreferencesState) => {
    try {
      await crmMutate('/workspace/preferences', 'PUT', creds, next);
      toast.success('Đã lưu giao diện Bàn làm việc cá nhân');
      await loadWorkspace();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu tùy biến');
    }
  };

  if (loading && !boot) {
    return <WorkspaceTabSkeleton />;
  }

  const prefs = boot?.preferences || {
    wallpaper_url: '',
    grid_columns: 3,
    overlay_opacity: 15,
    hide_completed: false,
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.1rem',
        padding: prefs.wallpaper_url ? '1rem' : 0,
        borderRadius: prefs.wallpaper_url ? 20 : 0,
        background: prefs.wallpaper_url || 'transparent',
      }}
    >
      {/* Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.15rem 1.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={20} color="#1E40FF" /> Bàn làm việc Cá nhân (Personal Focus Workspace)
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
            Tổ chức nhóm việc cá nhân, kéo-thả ưu tiên, quản lý Subtasks/Dependencies & đồng hồ Tập trung Pomodoro
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowStats(true)}
            style={{ height: 44, padding: '0 14px', borderRadius: 10, border: '1px solid #DBEAFE', background: '#EFF6FF', color: '#1E40FF', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <BarChart3 size={15} /> Thống kê Hiệu suất
          </button>
          <button
            type="button"
            onClick={() => setShowCustomizer(true)}
            style={{ height: 44, padding: '0 14px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#0F172A', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <Palette size={15} color="#1E40FF" /> Tùy biến Bàn làm việc
          </button>
        </div>
      </div>

      {/* Sticky Focus Pomodoro */}
      <FocusPomodoroWidget
        tasks={boot?.tasks || []}
        creds={creds}
        onLogged={loadWorkspace}
      />

      {/* Personal Task Groups (`TaskGroupSection`) */}
      {boot && (
        <TaskGroupSection
          groups={boot.groups}
          summary={boot.summary}
          selectedGroupKey={selectedGroupKey}
          onSelectGroup={setSelectedGroupKey}
          onDropTaskToGroup={(tid, gid) => void handleDropTaskToGroup(tid, gid)}
          canEdit={canEdit}
          creds={creds}
          onReload={loadWorkspace}
        />
      )}

      {/* Quick Add & Filter Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '0.85rem 1rem', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8, flex: '1 1 320px' }}>
            <input
              placeholder="Thêm nhanh công việc cá nhân và nhấn Enter..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleQuickAddTask();
                }
              }}
              style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '0.84rem' }}
            />
            <button
              type="button"
              onClick={() => void handleQuickAddTask()}
              style={{ height: 44, padding: '0 16px', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
            >
              <Plus size={15} /> Thêm việc
            </button>
          </div>
        )}

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '0.82rem', background: '#FFFFFF' }}>
          <option value="all">Mọi nguồn việc</option>
          <option value="personal">Cá nhân</option>
          <option value="customer">Khách hàng CRM</option>
          <option value="project">Dự án</option>
        </select>

        <div style={{ position: 'relative', minWidth: 200 }}>
          <Search size={14} color="#64748B" style={{ position: 'absolute', left: 10, top: 15 }} />
          <input placeholder="Lọc công việc..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ height: 44, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px 0 32px', fontSize: '0.82rem' }} />
        </div>
      </div>

      {/* Sortable Task Cards Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
        <SortableContext items={visibleTasks.map((t) => t.id)} strategy={rectSortingStrategy}>
          {visibleTasks.length === 0 ? (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
              Chưa có công việc nào trong nhóm hiện tại. Hãy thêm việc mới phía trên!
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${prefs.grid_columns || 3}, minmax(0, 1fr))`,
                gap: '1rem',
              }}
            >
              {visibleTasks.map((t) => (
                <SortableTaskCard
                  key={t.id}
                  task={t}
                  canEdit={canEdit}
                  onOpen={(tk) => setActiveTask(tk)}
                  onQuickToggleDone={(tk) => void handleToggleDone(tk)}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>

      <WorkspaceCustomizerModal
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        preferences={prefs}
        onSave={handleSavePrefs}
      />

      <WorkspaceTaskStatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        tasks={boot?.tasks || []}
        staff={boot?.staff || []}
        onSelectTask={(tk) => setActiveTask(tk)}
      />

      {activeTask && (
        <WorkspaceTaskDrawer
          isOpen={Boolean(activeTask)}
          task={activeTask}
          staff={boot?.staff || []}
          taskGroups={boot?.groups || []}
          onClose={() => setActiveTask(null)}
          onUpdated={() => void loadWorkspace()}
        />
      )}
    </div>
  );
};

export default PersonalWorkspacePage;
