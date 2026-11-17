import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CalendarRange,
  Columns3,
  FolderKanban,
  GitBranch,
  LifeBuoy,
  PenTool,
  Plus,
  RefreshCw,
  Timer,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { Badge, Card, FormCard, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { KanbanProjectsSkeleton, ProjectsTabSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import {
  DEFAULT_COLUMNS,
  type HelpdeskTicketRow,
  type KanbanColumnItem,
  type OverviewPayload,
  type PomodoroSessionRow,
  type ProjectRow,
  type ProjectsTabKey,
  type TaskRow,
  type WhiteboardElementItem,
  type WorkflowTemplateRow,
} from './projectsTypes';
import { ProjectGanttTab } from './ProjectGanttTab';
import { ProjectWhiteboardTab } from './ProjectWhiteboardTab';
import { ProjectRosterModal } from './ProjectRosterModal';
import { TaskDetailModal } from './TaskDetailModal';
import { SupportTicketsView } from './SupportTicketsView';
import { ProjectsAutomationPomoSection } from './ProjectsAutomationPomoSection';
import { ProjectsKanbanBoard } from './ProjectsKanbanBoard';

export { ProjectGanttTab, SupportTicketsView };

export const ErpProjectsWave2Entry: React.FC = () => {
  const location = useLocation();
  const { token, tenantSlug } = useAuth();
  const { terminology, packageMeta, scope, can } = useEntitlement();
  const canCreate = can('erp_projects_tasks', 'create');
  const canEdit = can('erp_projects_tasks', 'edit');

  const isStandaloneTicketsRoute = location.pathname === '/support-tickets';

  const [activeTab, setActiveTab] = useState<ProjectsTabKey>('kanban');
  const [loading, setLoading] = useState(!isStandaloneTicketsRoute);
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSessionRow[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplateRow[]>([]);
  const [tickets, setTickets] = useState<HelpdeskTicketRow[]>([]);
  const [boardElements, setBoardElements] = useState<WhiteboardElementItem[]>([]);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [inspectedTask, setInspectedTask] = useState<TaskRow | null>(null);
  const [pomoPreselectedTaskId, setPomoPreselectedTaskId] = useState('');

  const fetchAll = useCallback(async () => {
    const [ov, pr, tk, pm, wt, hd] = await Promise.all([
      apiRequest<OverviewPayload>('/projects/overview', { token, tenantSlug }),
      apiRequest<{ items: ProjectRow[] }>('/projects', { token, tenantSlug }),
      apiRequest<{ items: TaskRow[] }>('/projects/tasks/list', { token, tenantSlug }),
      apiRequest<{ items: PomodoroSessionRow[] }>('/projects/pomodoro/sessions', { token, tenantSlug }),
      apiRequest<{ items: WorkflowTemplateRow[] }>('/projects/workflow-templates/list', { token, tenantSlug }),
      apiRequest<{ items: HelpdeskTicketRow[] }>('/projects/tickets/list', { token, tenantSlug }),
    ]);
    return {
      ov,
      pr: pr.items || [],
      tk: tk.items || [],
      pm: pm.items || [],
      wt: wt.items || [],
      hd: hd.items || [],
    };
  }, [token, tenantSlug]);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchAll>>) => {
    setOverview(bundle.ov);
    setProjects(bundle.pr);
    setTasks(bundle.tk);
    setPomodoroSessions(bundle.pm);
    setTemplates(bundle.wt);
    setTickets(bundle.hd);
    if (bundle.pr.length > 0) {
      setSelectedProjectId((prev) => {
        const chosen = bundle.pr.find((p) => p.id === prev) || bundle.pr[0];
        setBoardElements(chosen.whiteboard_elements || []);
        return chosen.id;
      });
    }
  }, []);

  useEffect(() => {
    if (isStandaloneTicketsRoute) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const bundle = await fetchAll();
        if (!cancelled) applyBundle(bundle);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải không gian Dự án & Helpdesk'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isStandaloneTicketsRoute, fetchAll, applyBundle]);

  const reloadData = useCallback(async () => {
    setLoading(true);
    try {
      applyBundle(await fetchAll());
    } catch (err) {
      toast.error(getErrorMessage(err, 'Làm mới dữ liệu thất bại'));
    } finally {
      setLoading(false);
    }
  }, [fetchAll, applyBundle]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const activeColumns = useMemo<KanbanColumnItem[]>(
    () => (activeProject?.task_columns?.length ? activeProject.task_columns : DEFAULT_COLUMNS),
    [activeProject]
  );

  const visibleTasks = useMemo(
    () =>
      selectedProjectId
        ? tasks.filter((t) => !t.project_id || t.project_id === selectedProjectId)
        : tasks,
    [tasks, selectedProjectId]
  );

  if (isStandaloneTicketsRoute) {
    return <SupportTicketsView standalone />;
  }

  if (loading && !overview) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <ProjectsTabSkeleton />
        <KanbanProjectsSkeleton />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Card padding="1.25rem 1.5rem" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: '#EEF2FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E40FF' }}>
              <FolderKanban size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.16rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Dự Án {terminology.projectLabel} Kanban / Gantt, Whiteboard Snapshots & Helpdesk SLA
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="info">Scope: {scope('erp_projects_tasks')}</Badge>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>
                Phân quyền thành viên Roster ACL, phụ thuộc Gantt FS/SS Cascade, lịch sử phiên bản Whiteboard & CSKH SLA
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {activeProject && (
              <button type="button" onClick={() => setRosterModalOpen(true)} className="btn secondary" style={{ height: 44, color: '#1E40FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Users size={15} /> Roster ACL ({activeProject.roster_count || 0})
              </button>
            )}
            {canCreate && (
              <>
                <button type="button" onClick={() => setProjectModalOpen(true)} className="btn secondary" style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={15} /> Dự án mới
                </button>
                <button type="button" onClick={() => setTaskModalOpen(true)} style={{ height: 44, padding: '0 16px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={15} /> Giao việc mới
                </button>
              </>
            )}
            <button type="button" onClick={() => void reloadData()} className="btn secondary" style={{ height: 44 }}>
              <RefreshCw size={15} />
            </button>
            <ScreenHelpButton screenKey="erp_projects" />
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem' }}>
        <FormCard title={`${overview?.summary.active_projects || 0} / ${overview?.summary.total_projects || 0} Dự án`} description="Đang triển khai hoạt động" badge={<Badge tone="primary">{activeProject ? `${activeProject.progress_pct}%` : '0%'}</Badge>} />
        <FormCard title={`${overview?.summary.done_tasks || 0} / ${overview?.summary.total_tasks || 0} Công việc`} description={`Đã log ${overview?.summary.logged_minutes_total || 0} phút thực làm`} badge={<Badge tone="success">Kanban + Gantt</Badge>} />
        <FormCard title={`${overview?.summary.open_tickets || 0} Ticket CSKH mở`} description={`${overview?.summary.breached_tickets || 0} Ticket quá hạn SLA`} badge={<Badge tone={(overview?.summary.breached_tickets || 0) > 0 ? 'danger' : 'info'}>Helpdesk</Badge>} />
      </div>

      {projects.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedProjectId(p.id);
                  setBoardElements(p.whiteboard_elements || []);
                }}
                style={{ height: 40, padding: '0 14px', borderRadius: 12, border: selectedProjectId === p.id ? '1.5px solid #1E40FF' : '1px solid #E2E8F0', background: selectedProjectId === p.id ? '#EFF6FF' : '#FFFFFF', color: selectedProjectId === p.id ? '#1E40FF' : '#334155', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                {p.code} • {p.name} ({p.progress_pct}%) • {formatVnd(p.budget_vnd)}
              </button>
            ))}
          </div>
          {canEdit && activeProject && (
            <button type="button" onClick={() => setColumnModalOpen(true)} className="btn secondary" style={{ height: 40, color: '#1E40FF', fontSize: '0.8rem' }}>
              + Tùy biến cột Kanban
            </button>
          )}
        </div>
      )}

      <PillTabs<ProjectsTabKey>
        activeKey={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'kanban', label: 'Bảng Kanban', icon: <Columns3 size={15} />, count: visibleTasks.length },
          { key: 'gantt', label: 'Tiến độ Gantt & Cascade', icon: <CalendarRange size={15} /> },
          { key: 'whiteboard', label: 'Bảng trắng & Snapshots', icon: <PenTool size={15} />, count: boardElements.length },
          { key: 'pomodoro', label: 'Focus Pomodoro', icon: <Timer size={15} />, count: pomodoroSessions.length },
          { key: 'automation', label: 'Stage → Task Auto', icon: <GitBranch size={15} />, count: templates.length },
          { key: 'helpdesk', label: 'Helpdesk CSKH SLA', icon: <LifeBuoy size={15} />, count: tickets.length },
        ]}
      />

      <ProjectsKanbanBoard
        columns={activeTab === 'kanban' ? activeColumns : []}
        tasks={visibleTasks}
        activeProject={activeProject}
        selectedProjectId={selectedProjectId}
        staff={overview?.staff || []}
        canEdit={canEdit}
        projectModalOpen={projectModalOpen}
        onCloseProjectModal={() => setProjectModalOpen(false)}
        onProjectCreated={async (created) => {
          await reloadData();
          setSelectedProjectId(created.id);
          setBoardElements(created.whiteboard_elements || []);
        }}
        columnModalOpen={columnModalOpen}
        onCloseColumnModal={() => setColumnModalOpen(false)}
        taskModalOpen={taskModalOpen}
        onCloseTaskModal={() => setTaskModalOpen(false)}
        onInspectTask={setInspectedTask}
        onReload={reloadData}
      />

      {activeTab === 'gantt' && (
        <ProjectGanttTab
          projectId={selectedProjectId}
          projectName={activeProject?.name}
          tasks={visibleTasks}
          canEdit={canEdit}
          onRefresh={reloadData}
          onInspectTask={setInspectedTask}
        />
      )}

      {activeTab === 'whiteboard' && (
        <ProjectWhiteboardTab
          project={activeProject}
          elements={boardElements}
          onChangeElements={setBoardElements}
          canEdit={canEdit}
          onRefreshProject={reloadData}
        />
      )}

      {(activeTab === 'pomodoro' || activeTab === 'automation') && (
        <ProjectsAutomationPomoSection
          mode={activeTab}
          tasks={visibleTasks}
          pomodoroSessions={pomodoroSessions}
          templates={templates}
          overview={overview}
          selectedProjectId={selectedProjectId}
          initialPomodoroTaskId={pomoPreselectedTaskId}
          canCreate={canCreate}
          onReload={reloadData}
        />
      )}

      {activeTab === 'helpdesk' && <SupportTicketsView tickets={tickets} onRefresh={reloadData} />}

      <ProjectRosterModal
        isOpen={rosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        project={activeProject}
        staff={overview?.staff || []}
        canEdit={canEdit}
        onChanged={reloadData}
      />

      <TaskDetailModal
        isOpen={Boolean(inspectedTask)}
        onClose={() => setInspectedTask(null)}
        task={inspectedTask}
        allTasks={visibleTasks}
        columns={activeColumns}
        staff={overview?.staff || []}
        canEdit={canEdit}
        onUpdated={reloadData}
        onStartPomodoro={(t) => {
          setPomoPreselectedTaskId(t.id);
          setActiveTab('pomodoro');
        }}
      />
    </div>
  );
};

export const Wave2Entry = ErpProjectsWave2Entry;
export default ErpProjectsWave2Entry;
