import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, Link2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge, Card, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  DEPENDENCY_TYPE_OPTIONS,
  PRIORITY_BADGE_MAP,
  type DependencyTypeCode,
  type TaskDependencyRow,
  type TaskRow,
} from './projectsTypes';

export interface ProjectGanttTabProps {
  projectId?: string;
  projectName?: string;
  tasks?: TaskRow[];
  canEdit?: boolean;
  onRefresh?: () => Promise<void> | void;
  onInspectTask?: (task: TaskRow) => void;
}

export const ProjectGanttTab: React.FC<ProjectGanttTabProps> = ({
  projectId,
  projectName,
  tasks: externalTasks,
  canEdit = true,
  onRefresh,
  onInspectTask,
}) => {
  const { token, tenantSlug } = useAuth();
  const [viewMode, setViewMode] = useState<'days' | 'weeks'>('days');
  const [internalTasks, setInternalTasks] = useState<TaskRow[]>([]);
  const [loadingInternal, setLoadingInternal] = useState(!externalTasks);
  const [shiftingTaskId, setShiftingTaskId] = useState<string | null>(null);
  const [anchorMs] = useState(() => Date.now());

  const [depModalTask, setDepModalTask] = useState<TaskRow | null>(null);
  const [predecessorId, setPredecessorId] = useState('');
  const [depType, setDepType] = useState<DependencyTypeCode>('FS');
  const [lagDays, setLagDays] = useState('0');
  const [cascadeOnSave, setCascadeOnSave] = useState(true);
  const [savingDep, setSavingDep] = useState(false);

  const loadStandaloneTasks = useCallback(async () => {
    const q = projectId ? `?project_id=${encodeURIComponent(projectId)}` : '';
    const res = await apiRequest<{ items: TaskRow[] }>(`/projects/tasks/list${q}`, { token, tenantSlug });
    return res.items || [];
  }, [projectId, token, tenantSlug]);

  useEffect(() => {
    if (externalTasks) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const items = await loadStandaloneTasks();
        if (!cancelled) setInternalTasks(items);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải sơ đồ tiến độ Gantt'));
      } finally {
        if (!cancelled) setLoadingInternal(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [externalTasks, loadStandaloneTasks]);

  const tasks = externalTasks || internalTasks;

  const triggerReload = async () => {
    if (onRefresh) {
      await onRefresh();
      return;
    }
    setLoadingInternal(true);
    try {
      setInternalTasks(await loadStandaloneTasks());
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải lại tiến độ Gantt'));
    } finally {
      setLoadingInternal(false);
    }
  };

  const timeline = useMemo(() => {
    const validTimes: number[] = [];
    for (const t of tasks) {
      if (t.start_date) {
        const ms = new Date(t.start_date).getTime();
        if (!Number.isNaN(ms)) validTimes.push(ms);
      }
      if (t.due_date) {
        const ms = new Date(t.due_date).getTime();
        if (!Number.isNaN(ms)) validTimes.push(ms);
      }
    }
    const minMs = validTimes.length > 0 ? Math.min(...validTimes) : anchorMs;
    const maxMs = validTimes.length > 0 ? Math.max(...validTimes) : anchorMs + 14 * 86_400_000;
    const startMs = minMs - 2 * 86_400_000;
    const endMs = Math.max(startMs + 10 * 86_400_000, maxMs + 4 * 86_400_000);
    const totalDays = Math.max(7, Math.ceil((endMs - startMs) / 86_400_000));

    const markers: Array<{ key: string; label: string }> = [];
    const step = viewMode === 'weeks' ? 7 : Math.max(1, Math.ceil(totalDays / 14));
    for (let d = 0; d < totalDays; d += step) {
      const dt = new Date(startMs + d * 86_400_000);
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      markers.push({ key: `${d}`, label: viewMode === 'weeks' ? `Tuần ${dd}/${mm}` : `${dd}/${mm}` });
    }
    const todayPct =
      anchorMs >= startMs && anchorMs <= endMs ? ((anchorMs - startMs) / (endMs - startMs)) * 100 : null;
    return { startMs, endMs, spanMs: Math.max(86_400_000, endMs - startMs), markers, todayPct };
  }, [tasks, viewMode, anchorMs]);

  const handleShiftTaskDates = async (task: TaskRow, deltaDays: number) => {
    if (!canEdit) return;
    setShiftingTaskId(task.id);
    try {
      const baseStart = task.start_date ? new Date(task.start_date).getTime() : Date.now();
      const baseDue = task.due_date ? new Date(task.due_date).getTime() : baseStart + 2 * 86_400_000;
      const shiftMs = deltaDays * 86_400_000;
      const updated = await apiRequest<{ cascaded_task_ids?: string[] }>(`/projects/tasks/${task.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: {
          start_date: new Date(baseStart + shiftMs).toISOString(),
          due_date: new Date(baseDue + shiftMs).toISOString(),
          cascade_dependencies: true,
        },
      });
      const cascadedCount = updated.cascaded_task_ids?.length || 0;
      toast.success(
        cascadedCount > 0
          ? `Đã dời ${deltaDays > 0 ? `+${deltaDays}` : deltaDays} ngày & tự động kéo theo ${cascadedCount} việc phụ thuộc!`
          : `Đã cập nhật lịch trình ${deltaDays > 0 ? `+${deltaDays}` : deltaDays} ngày`
      );
      await triggerReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể dịch chuyển ngày công việc'));
    } finally {
      setShiftingTaskId(null);
    }
  };

  const openDependencyModal = (task: TaskRow) => {
    const firstDep: TaskDependencyRow | undefined = task.dependency_links?.[0] || task.dependencies?.[0];
    setDepModalTask(task);
    setPredecessorId(firstDep?.predecessor_task_id || '');
    const code = String(firstDep?.dependency_type || 'FS').toUpperCase() as DependencyTypeCode;
    setDepType(['FS', 'SS', 'FF', 'SF'].includes(code) ? code : 'FS');
    setLagDays(String(firstDep?.lag_days ?? 0));
    setCascadeOnSave(true);
  };

  const handleSaveDependency = async () => {
    if (!depModalTask) return;
    setSavingDep(true);
    try {
      const depsPayload = predecessorId
        ? [{ predecessor_task_id: predecessorId, dependency_type: depType, lag_days: Number(lagDays || 0) }]
        : [];
      const res = await apiRequest<{ cascaded_task_ids?: string[] }>(
        `/projects/tasks/${depModalTask.id}/dependencies`,
        { method: 'PUT', token, tenantSlug, body: { dependencies: depsPayload, cascade: cascadeOnSave } }
      );
      toast.success(
        res.cascaded_task_ids?.length
          ? `Đã lưu ràng buộc ${depType} & đồng bộ lịch ${res.cascaded_task_ids.length} công việc`
          : 'Đã lưu ràng buộc phụ thuộc Gantt'
      );
      setDepModalTask(null);
      await triggerReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu phụ thuộc Gantt'));
    } finally {
      setSavingDep(false);
    }
  };

  if (loadingInternal && !externalTasks) return <TableSkeleton rows={5} cols={4} />;

  return (
    <Card
      title={`Sơ Đồ Tiến Độ Gantt & Ràng Buộc Dây Chuyền${projectName ? ` — ${projectName}` : ''}`}
      subtitle="Hỗ trợ phụ thuộc FS / SS / FF / SF, độ trễ (Lag days) & tự động dời lịch dây chuyền (Auto-Cascade)"
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: 3, borderRadius: 12, border: '1px solid #E2E8F0' }}>
            {(['days', 'weeks'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                style={{ height: 36, padding: '0 12px', borderRadius: 9, border: 'none', background: viewMode === mode ? '#FFFFFF' : 'transparent', color: viewMode === mode ? '#1E40FF' : '#475569', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
              >
                {mode === 'days' ? 'Theo Ngày' : 'Theo Tuần'}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => void triggerReload()} className="btn secondary" style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>
      }
    >
      {tasks.length === 0 ? (
        <EmptyState icon={<CalendarRange size={24} />} title="Chưa có công việc để hiển thị sơ đồ Gantt" description="Thêm công việc có ngày bắt đầu và hạn hoàn thành để theo dõi đường găng tiến độ." />
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 16 }}>
          <table style={{ width: '100%', minWidth: 860, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ width: 270, padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#64748B', borderRight: '1px solid #E2E8F0' }}>HẠNG MỤC & PHỤ THUỘC</th>
                <th style={{ width: 165, padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', color: '#64748B', borderRight: '1px solid #E2E8F0' }}>LỊCH TRÌNH & DỜI NGÀY</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#64748B' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                    {timeline.markers.map((m) => (
                      <span key={m.key} style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>{m.label}</span>
                    ))}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => {
                const sMs = t.start_date ? new Date(t.start_date).getTime() : timeline.startMs;
                const dMs = t.due_date ? new Date(t.due_date).getTime() : sMs + 2 * 86_400_000;
                const leftPct = Math.max(0, Math.min(94, ((sMs - timeline.startMs) / timeline.spanMs) * 100));
                const widthPct = Math.max(6, Math.min(100 - leftPct, ((dMs - sMs) / timeline.spanMs) * 100));
                const deps = t.dependency_links || t.dependencies || [];
                const prioMeta = PRIORITY_BADGE_MAP[t.priority] || PRIORITY_BADGE_MAP.medium;
                const barGradient =
                  t.status_key === 'done'
                    ? 'linear-gradient(90deg, #10B981, #059669)'
                    : t.priority === 'urgent'
                      ? 'linear-gradient(90deg, #DC2626, #EF4444)'
                      : t.priority === 'high'
                        ? 'linear-gradient(90deg, #D97706, #F59E0B)'
                        : 'linear-gradient(90deg, #1E40FF, #0284C7)';

                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9', background: '#FFFFFF' }}>
                    <td style={{ padding: '10px 14px', borderRight: '1px solid #F1F5F9', verticalAlign: 'middle' }}>
                      <div onClick={() => onInspectTask?.(t)} style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A', cursor: onInspectTask ? 'pointer' : 'default' }}>
                        {t.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                        <Badge tone={prioMeta.tone}>{prioMeta.label}</Badge>
                        {deps.map((d, idx) => (
                          <Badge key={`${d.predecessor_task_id}-${idx}`} tone="primary" icon={<Link2 size={10} />}>
                            {d.dependency_type}{d.lag_days ? (d.lag_days > 0 ? ` +${d.lag_days}d` : ` ${d.lag_days}d`) : ''}
                          </Badge>
                        ))}
                        {canEdit && (
                          <button type="button" onClick={() => openDependencyModal(t)} style={{ border: '1px solid #DBEAFE', background: '#EFF6FF', color: '#1E40FF', borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
                            + Ràng buộc
                          </button>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '10px 12px', borderRight: '1px solid #F1F5F9', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>
                        {formatShortDate(t.start_date)} → {formatShortDate(t.due_date)}
                      </div>
                      {canEdit && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                          <button type="button" disabled={shiftingTaskId === t.id} onClick={() => void handleShiftTaskDates(t, -1)} style={{ height: 26, padding: '0 7px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8F9FA', color: '#334155', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                            <ChevronLeft size={12} /> 1d
                          </button>
                          <button type="button" disabled={shiftingTaskId === t.id} onClick={() => void handleShiftTaskDates(t, 1)} style={{ height: 26, padding: '0 7px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8F9FA', color: '#1E40FF', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                            +1d <ChevronRight size={12} />
                          </button>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '10px 14px', position: 'relative', verticalAlign: 'middle' }}>
                      {timeline.todayPct !== null && (
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${timeline.todayPct}%`, width: 2, background: 'rgba(30, 64, 255, 0.25)', pointerEvents: 'none' }} />
                      )}
                      <div style={{ position: 'relative', height: 28, background: '#F8FAFF', borderRadius: 999, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <div
                          onClick={() => (canEdit ? openDependencyModal(t) : onInspectTask?.(t))}
                          style={{ position: 'absolute', top: 3, bottom: 3, left: `${leftPct}%`, width: `${widthPct}%`, borderRadius: 999, background: barGradient, color: '#FFFFFF', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', padding: '0 10px', whiteSpace: 'nowrap', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 6px rgba(30, 64, 255, 0.22)' }}
                        >
                          {t.status_key === 'done' ? '100%' : `${t.progress_pct}%`} • {t.assignee_name || 'Chưa gán'}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CustomModal isOpen={Boolean(depModalTask)} onClose={() => setDepModalTask(null)} title={`Cấu hình Phụ thuộc Gantt — ${depModalTask?.title || ''}`} width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select value={predecessorId} onChange={(e) => setPredecessorId(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
            <option value="">-- Không phụ thuộc (Độc lập) --</option>
            {tasks.filter((cand) => cand.id !== depModalTask?.id).map((cand) => (
              <option key={cand.id} value={cand.id}>{cand.title} ({formatShortDate(cand.due_date)})</option>
            ))}
          </select>
          {predecessorId && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: 10 }}>
              <select value={depType} onChange={(e) => setDepType(e.target.value as DependencyTypeCode)} style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
                {DEPENDENCY_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <input type="number" value={lagDays} onChange={(e) => setLagDays(e.target.value)} placeholder="Lag ngày" style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
            <input type="checkbox" checked={cascadeOnSave} onChange={(e) => setCascadeOnSave(e.target.checked)} />
            Tự động cập nhật dây chuyền ngày bắt đầu / kết thúc (Auto-Cascade)
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setDepModalTask(null)} className="btn secondary" style={{ height: 44 }}>Hủy</button>
            <button type="button" disabled={savingDep} onClick={() => void handleSaveDependency()} style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>
              {savingDep ? 'Đang lưu...' : 'Lưu phụ thuộc Gantt'}
            </button>
          </div>
        </div>
      </CustomModal>
    </Card>
  );
};
