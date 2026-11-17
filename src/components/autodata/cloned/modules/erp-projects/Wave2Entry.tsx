import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Clock,
  Columns3,
  FolderKanban,
  GitBranch,
  LifeBuoy,
  MessageSquare,
  Pause,
  PenTool,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Timer,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  EmptyState,
  FormCard,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import {
  apiRequest,
  formatShortDate,
  formatVnd,
  getErrorMessage,
} from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';

type ProjectsTabKey =
  | 'kanban'
  | 'gantt'
  | 'whiteboard'
  | 'pomodoro'
  | 'automation'
  | 'helpdesk';

interface KanbanColumnItem {
  key: string;
  label: string;
  color: string;
  is_done?: boolean;
}

interface WhiteboardElementItem {
  id: string;
  type: 'sticky' | 'milestone' | 'box';
  text: string;
  x: number;
  y: number;
  color: string;
}

interface ProjectRow {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  priority: string;
  owner_name?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  budget_vnd: number;
  progress_pct: number;
  task_count: number;
  task_columns: KanbanColumnItem[];
  whiteboard_elements: WhiteboardElementItem[];
}

interface ChecklistEntry {
  id: string;
  text: string;
  done: boolean;
}

interface TaskRow {
  id: string;
  project_id?: string | null;
  project_name?: string | null;
  lead_id?: string | null;
  lead_name?: string | null;
  lead_phone?: string | null;
  title: string;
  description?: string | null;
  status_key: string;
  priority: string;
  assignee_user_id?: string | null;
  assignee_name?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  estimated_minutes: number;
  logged_minutes: number;
  progress_pct: number;
  checklist: ChecklistEntry[];
}

interface PomodoroSessionRow {
  id: string;
  task_id?: string | null;
  task_title?: string | null;
  user_name?: string | null;
  duration_minutes: number;
  mode: string;
  note?: string | null;
  created_at: string;
}

interface WorkflowTemplateRow {
  id: string;
  pipeline_id?: string | null;
  pipeline_name?: string | null;
  stage_id?: string | null;
  stage_name?: string | null;
  stage_key?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  title_template: string;
  priority: string;
  due_offset_hours: number;
  checklist: ChecklistEntry[];
  is_active: boolean;
}

interface HelpdeskTicketRow {
  id: string;
  ticket_code: string;
  subject: string;
  description?: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  lead_id?: string | null;
  lead_name?: string | null;
  customer_name?: string | null;
  customer_contact?: string | null;
  assignee_name?: string | null;
  sla_response_hours: number;
  sla_resolution_hours: number;
  response_due_at: string;
  resolution_due_at: string;
  first_responded_at?: string | null;
  sla_breached: boolean;
  resolution_remaining_minutes: number;
  created_at: string;
}

interface HelpdeskCommentRow {
  id: string;
  author_name: string;
  content: string;
  is_internal_note: boolean;
  created_at: string;
}

interface OverviewPayload {
  summary: {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    total_tasks: number;
    done_tasks: number;
    in_progress_tasks: number;
    logged_minutes_total: number;
    focus_sessions: number;
    focus_minutes: number;
    total_tickets: number;
    open_tickets: number;
    breached_tickets: number;
  };
  staff: Array<{ id: string; full_name: string; email: string; role: string }>;
  pipelines: Array<{ id: string; name: string; is_default?: boolean }>;
  stages: Array<{ id: string; pipeline_id: string; stage_key: string; stage_name: string; color_hex: string }>;
}

const DEFAULT_COLUMNS: KanbanColumnItem[] = [
  { key: 'todo', label: 'Cần làm', color: '#64748B' },
  { key: 'in_progress', label: 'Đang thực hiện', color: '#1E40FF' },
  { key: 'review', label: 'Chờ nghiệm thu', color: '#D97706' },
  { key: 'done', label: 'Hoàn thành', color: '#10B981', is_done: true },
];

const PRIORITY_BADGE_MAP: Record<string, { label: string; tone: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  low: { label: 'Thấp', tone: 'neutral' },
  medium: { label: 'Trung bình', tone: 'info' },
  high: { label: 'Cao', tone: 'warning' },
  urgent: { label: 'Khẩn cấp', tone: 'danger' },
};

const STICKY_COLORS = [
  { label: 'Vàng ghi chú', hex: '#FEF3C7' },
  { label: 'Xanh Sapphire', hex: '#DBEAFE' },
  { label: 'Ngọc lục bảo', hex: '#D1FAE5' },
  { label: 'Hồng nhạt', hex: '#FCE7F3' },
];

function formatRemainingCountdown(mins: number, status: string): string {
  if (status === 'resolved' || status === 'closed') return 'Đã hoàn tất SLA';
  if (mins < 0) {
    const over = Math.abs(mins);
    return over >= 60 ? `Quá hạn ${Math.floor(over / 60)}h ${over % 60}p` : `Quá hạn ${over}p`;
  }
  return mins >= 60 ? `Còn ${Math.floor(mins / 60)}h ${mins % 60}p` : `Còn ${mins}p`;
}

export const ErpProjectsWave2Entry: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { terminology, packageMeta, scope, can } = useEntitlement();
  const canCreate = can('erp_projects_tasks', 'create');
  const canEdit = can('erp_projects_tasks', 'edit');

  const [activeTab, setActiveTab] = useState<ProjectsTabKey>('kanban');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSessionRow[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplateRow[]>([]);
  const [tickets, setTickets] = useState<HelpdeskTicketRow[]>([]);

  // Project & Task Modals
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projName, setProjName] = useState('');
  const [projBudget, setProjBudget] = useState('150000000');
  const [projDueDate, setProjDueDate] = useState('');

  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const [newColColor, setNewColColor] = useState('#1E40FF');

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskEstimate, setTaskEstimate] = useState('90');

  // Whiteboard State
  const [boardElements, setBoardElements] = useState<WhiteboardElementItem[]>([]);
  const [newStickyText, setNewStickyText] = useState('');
  const [newStickyType, setNewStickyType] = useState<'sticky' | 'milestone' | 'box'>('sticky');
  const [newStickyColor, setNewStickyColor] = useState('#FEF3C7');
  const [savingBoard, setSavingBoard] = useState(false);

  // Focus Pomodoro Timer State
  const [pomoTaskId, setPomoTaskId] = useState('');
  const [pomoMinutesPreset, setPomoMinutesPreset] = useState(25);
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoNote, setPomoNote] = useState('');

  // Stage -> Task Automation Form
  const [tplPipelineId, setTplPipelineId] = useState('');
  const [tplStageId, setTplStageId] = useState('');
  const [tplTitle, setTplTitle] = useState('Gọi khảo sát & gửi báo giá cho {{lead.name}}');
  const [tplDueHours, setTplDueHours] = useState('24');
  const [tplChecklistRaw, setTplChecklistRaw] = useState('Xác nhận nhu cầu thực tế\nGửi tài liệu giải pháp');

  // Helpdesk SLA Modal & Drawer
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [tkSubject, setTkSubject] = useState('');
  const [tkCustomerName, setTkCustomerName] = useState('');
  const [tkCustomerContact, setTkCustomerContact] = useState('');
  const [tkPriority, setTkPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [tkRespHours, setTkRespHours] = useState('2');
  const [tkResHours, setTkResHours] = useState('12');
  const [tkDesc, setTkDesc] = useState('');

  const [activeTicket, setActiveTicket] = useState<HelpdeskTicketRow | null>(null);
  const [ticketComments, setTicketComments] = useState<HelpdeskCommentRow[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  const fetchAll = useCallback(async () => {
    const [ov, pr, tk, pm, wt, hd] = await Promise.all([
      apiRequest<OverviewPayload>('/projects/overview', { token, tenantSlug }),
      apiRequest<{ items: ProjectRow[] }>('/projects', { token, tenantSlug }),
      apiRequest<{ items: TaskRow[] }>('/projects/tasks/list', { token, tenantSlug }),
      apiRequest<{ items: PomodoroSessionRow[] }>('/projects/pomodoro/sessions', { token, tenantSlug }),
      apiRequest<{ items: WorkflowTemplateRow[] }>('/projects/workflow-templates/list', { token, tenantSlug }),
      apiRequest<{ items: HelpdeskTicketRow[] }>('/projects/tickets/list', { token, tenantSlug }),
    ]);
    return { ov, pr: pr.items || [], tk: tk.items || [], pm: pm.items || [], wt: wt.items || [], hd: hd.items || [] };
  }, [token, tenantSlug]);

  const applyBundle = useCallback(
    (bundle: Awaited<ReturnType<typeof fetchAll>>) => {
      setOverview(bundle.ov);
      setProjects(bundle.pr);
      setTasks(bundle.tk);
      setPomodoroSessions(bundle.pm);
      setTemplates(bundle.wt);
      setTickets(bundle.hd);

      if (bundle.pr.length > 0) {
        setSelectedProjectId((prev) => {
          const exists = bundle.pr.find((p) => p.id === prev);
          const chosen = exists || bundle.pr[0];
          setBoardElements(chosen.whiteboard_elements || []);
          return chosen.id;
        });
      }
      if (bundle.ov.pipelines.length > 0) {
        const defPipe = bundle.ov.pipelines[0].id;
        setTplPipelineId((prev) => prev || defPipe);
        const firstSt = bundle.ov.stages.find((s) => s.pipeline_id === defPipe);
        if (firstSt) {
          setTplStageId((prev) => prev || firstSt.id);
        }
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await fetchAll();
        if (!cancelled) applyBundle(bundle);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải dữ liệu Dự án & Helpdesk SLA'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAll, applyBundle]);

  const reloadData = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await fetchAll();
      applyBundle(bundle);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Làm mới dữ liệu thất bại'));
    } finally {
      setLoading(false);
    }
  }, [fetchAll, applyBundle]);

  // Pomodoro 1-second ticker when active
  useEffect(() => {
    if (!pomoRunning) return undefined;
    const timer = window.setInterval(() => {
      setPomoSecondsLeft((prev) => {
        if (prev <= 1) {
          setPomoRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [pomoRunning]);

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

  const filteredStagesForTemplate = useMemo(
    () => (overview?.stages || []).filter((s) => !tplPipelineId || s.pipeline_id === tplPipelineId),
    [overview?.stages, tplPipelineId]
  );

  const handleSelectProject = (nextId: string) => {
    setSelectedProjectId(nextId);
    const found = projects.find((p) => p.id === nextId);
    setBoardElements(found?.whiteboard_elements || []);
  };

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
        body: {
          name: projName.trim(),
          budget_vnd: Number(projBudget || 0),
          due_date: projDueDate || null,
        },
      });
      toast.success('Đã khởi tạo dự án mới');
      setProjName('');
      setProjectModalOpen(false);
      await reloadData();
      setSelectedProjectId(created.id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo dự án'));
    }
  };

  const handleAddKanbanColumn = async () => {
    if (!activeProject || !newColLabel.trim()) return;
    const slugKey = newColLabel
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_');
    const nextCols: KanbanColumnItem[] = [
      ...activeColumns.filter((c) => !c.is_done),
      { key: `${slugKey}_${activeColumns.length + 1}`, label: newColLabel.trim(), color: newColColor },
      ...activeColumns.filter((c) => c.is_done),
    ];
    try {
      await apiRequest(`/projects/${activeProject.id}/columns`, {
        method: 'PUT',
        token,
        tenantSlug,
        body: { columns: nextCols },
      });
      toast.success('Đã thêm cột trạng thái Kanban tùy chỉnh');
      setNewColLabel('');
      setColumnModalOpen(false);
      await reloadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu cột Kanban'));
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
      toast.success('Đã thêm công việc vào bảng tiến độ');
      setTaskTitle('');
      setTaskModalOpen(false);
      await reloadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo công việc'));
    }
  };

  const handleMoveTaskColumn = async (task: TaskRow, nextStatusKey: string) => {
    try {
      await apiRequest(`/projects/tasks/${task.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { status_key: nextStatusKey },
      });
      toast.success('Đã chuyển bước công việc');
      await reloadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể chuyển trạng thái'));
    }
  };

  const handleAddWhiteboardElement = () => {
    if (!newStickyText.trim()) {
      toast.error('Vui lòng nhập nội dung thẻ trên bảng trắng');
      return;
    }
    const idx = boardElements.length;
    const nextItem: WhiteboardElementItem = {
      id: `wb-${idx + 1}-${newStickyText.length}`,
      type: newStickyType,
      text: newStickyText.trim(),
      x: 32 + (idx % 4) * 230,
      y: 32 + Math.floor(idx / 4) * 145,
      color: newStickyColor,
    };
    setBoardElements((prev) => [...prev, nextItem]);
    setNewStickyText('');
  };

  const handleSaveWhiteboard = async () => {
    if (!activeProject) {
      toast.error('Hãy tạo hoặc chọn 1 dự án trước khi lưu Bảng trắng');
      return;
    }
    setSavingBoard(true);
    try {
      await apiRequest(`/projects/${activeProject.id}/whiteboard`, {
        method: 'PUT',
        token,
        tenantSlug,
        body: { elements: boardElements },
      });
      toast.success('Đã lưu Bảng trắng cộng tác vào dự án');
      await reloadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Bảng trắng'));
    } finally {
      setSavingBoard(false);
    }
  };

  const handleLogPomodoroSession = async () => {
    try {
      await apiRequest('/projects/pomodoro/sessions', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          task_id: pomoTaskId || null,
          duration_minutes: pomoMinutesPreset,
          mode: 'focus',
          note: pomoNote.trim() || `Hoàn thành phiên Focus ${pomoMinutesPreset} phút`,
        },
      });
      toast.success(`Đã ghi nhận +${pomoMinutesPreset} phút Focus vào công việc`);
      setPomoRunning(false);
      setPomoSecondsLeft(pomoMinutesPreset * 60);
      setPomoNote('');
      await reloadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu phiên Pomodoro'));
    }
  };

  const handleCreateWorkflowTemplate = async () => {
    if (!tplTitle.trim() || !tplStageId) {
      toast.error('Vui lòng chọn Bước Pipeline và tiêu đề công việc mẫu');
      return;
    }
    const checklist: ChecklistEntry[] = tplChecklistRaw
      .split('\n')
      .map((line, i) => ({ id: `chk-${i + 1}`, text: line.trim(), done: false }))
      .filter((item) => item.text.length > 0);
    try {
      await apiRequest('/projects/workflow-templates', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          pipeline_id: tplPipelineId || null,
          stage_id: tplStageId,
          project_id: selectedProjectId || null,
          title_template: tplTitle.trim(),
          due_offset_hours: Number(tplDueHours || 24),
          priority: 'high',
          checklist,
        },
      });
      toast.success('Đã kích hoạt luật tự sinh công việc khi chuyển bước CRM');
      await reloadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo luật tự động hóa'));
    }
  };

  const handleDeleteWorkflowTemplate = async (id: string) => {
    try {
      await apiRequest(`/projects/workflow-templates/${id}`, {
        method: 'DELETE',
        token,
        tenantSlug,
      });
      toast.success('Đã gỡ mẫu tự động hóa');
      await reloadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa mẫu'));
    }
  };

  const handleCreateHelpdeskTicket = async () => {
    if (!tkSubject.trim()) {
      toast.error('Vui lòng nhập tiêu đề yêu cầu hỗ trợ CSKH');
      return;
    }
    try {
      await apiRequest('/projects/tickets', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          subject: tkSubject.trim(),
          customer_name: tkCustomerName.trim() || undefined,
          customer_contact: tkCustomerContact.trim() || undefined,
          priority: tkPriority,
          sla_response_hours: Number(tkRespHours || 2),
          sla_resolution_hours: Number(tkResHours || 12),
          description: tkDesc.trim() || undefined,
        },
      });
      toast.success('Đã mở Ticket CSKH kèm đồng hồ cam kết SLA');
      setTkSubject('');
      setTkDesc('');
      setTicketModalOpen(false);
      await reloadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Ticket CSKH'));
    }
  };

  const openTicketDetail = async (ticket: HelpdeskTicketRow) => {
    setActiveTicket(ticket);
    try {
      const res = await apiRequest<{ items: HelpdeskCommentRow[] }>(`/projects/tickets/${ticket.id}/comments`, {
        token,
        tenantSlug,
      });
      setTicketComments(res.items || []);
    } catch {
      setTicketComments([]);
    }
  };

  const handleSendTicketComment = async () => {
    if (!activeTicket || !newCommentText.trim()) return;
    try {
      const added = await apiRequest<HelpdeskCommentRow>(`/projects/tickets/${activeTicket.id}/comments`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { content: newCommentText.trim() },
      });
      setTicketComments((prev) => [...prev, added]);
      setNewCommentText('');
      toast.success('Đã gửi phản hồi & ghi nhận SLA phản hồi đầu tiên');
      await reloadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi phản hồi'));
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updated = await apiRequest<HelpdeskTicketRow>(`/projects/tickets/${ticketId}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { status },
      });
      setActiveTicket(updated);
      toast.success('Đã cập nhật trạng thái Ticket CSKH');
      await reloadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái'));
    }
  };

  const ticketColumns: ReadonlyArray<TableColumn<HelpdeskTicketRow>> = [
    {
      key: 'code',
      header: 'Mã Ticket & Yêu cầu',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{row.subject}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            {row.ticket_code} • {row.customer_name || row.lead_name || terminology.customerLabel}
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Mức ưu tiên',
      render: (row) => {
        const meta = PRIORITY_BADGE_MAP[row.priority] || PRIORITY_BADGE_MAP.medium;
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: 'sla',
      header: 'Cam kết SLA & Đếm ngược',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Badge
            tone={row.sla_breached ? 'danger' : row.status === 'resolved' ? 'success' : 'primary'}
            icon={row.sla_breached ? <AlertTriangle size={12} /> : <Clock size={12} />}
          >
            {formatRemainingCountdown(row.resolution_remaining_minutes, row.status)}
          </Badge>
          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Phản hồi {row.sla_response_hours}h • Xử lý {row.sla_resolution_hours}h
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <Badge tone={row.status === 'resolved' || row.status === 'closed' ? 'success' : 'info'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'created',
      header: 'Thời gian mở',
      render: (row) => formatShortDate(row.created_at),
    },
  ];

  if (loading && !overview) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang đồng bộ Bàn làm việc Dự án Kanban/Gantt & Helpdesk SLA..."
      />
    );
  }

  const mm = String(Math.floor(pomoSecondsLeft / 60)).padStart(2, '0');
  const ss = String(pomoSecondsLeft % 60).padStart(2, '0');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <Card
        padding="1.25rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: '#EEF2FF',
                border: '1px solid #DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1E40FF',
              }}
            >
              <FolderKanban size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Dự án {terminology.projectLabel} Kanban / Gantt, Whiteboard & Helpdesk CSKH SLA
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="info">Scope: {scope('erp_projects_tasks')}</Badge>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
                Quản trị cột trạng thái động, sơ đồ tiến độ Gantt, Bảng trắng cộng tác, Pomodoro Focus & Ticket CSKH độc lập với Ticket bù số Sale
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={reloadData}
              className="btn secondary"
              style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={15} /> Làm mới
            </button>
            {canCreate && (
              <>
                <button
                  type="button"
                  onClick={() => setProjectModalOpen(true)}
                  className="btn secondary"
                  style={{ height: 44, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={16} /> Tạo {terminology.projectLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(true)}
                  className="btn-inkica-primary"
                  style={{
                    height: 44,
                    padding: '0 1.1rem',
                    borderRadius: 14,
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} /> Giao việc mới
                </button>
              </>
            )}
            <ScreenHelpButton screenKey="erp_projects" />
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.9rem' }}>
        <FormCard
          icon={<FolderKanban size={18} />}
          title={`${overview?.summary.active_projects ?? 0} / ${overview?.summary.total_projects ?? 0}`}
          description={`${terminology.projectsLabel} đang triển khai`}
          badge={<Badge tone="primary">Active</Badge>}
        />
        <FormCard
          icon={<CheckCircle2 size={18} />}
          title={`${overview?.summary.done_tasks ?? 0} / ${overview?.summary.total_tasks ?? 0}`}
          description="Công việc đã hoàn thành"
          badge={<Badge tone="success">Kanban</Badge>}
        />
        <FormCard
          icon={<Timer size={18} />}
          title={`${overview?.summary.logged_minutes_total ?? 0} phút`}
          description={`${overview?.summary.focus_sessions ?? 0} phiên Focus Pomodoro đã ghi`}
          badge={<Badge tone="purple">Deep Work</Badge>}
        />
        <FormCard
          icon={<LifeBuoy size={18} />}
          title={`${overview?.summary.open_tickets ?? 0} mở • ${overview?.summary.breached_tickets ?? 0} trễ`}
          description="Helpdesk CSKH & Cam kết SLA"
          badge={
            <Badge tone={(overview?.summary.breached_tickets ?? 0) > 0 ? 'danger' : 'success'}>
              SLA Monitor
            </Badge>
          }
        />
      </div>

      {/* Project Selector + Navigation PillTabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <PillTabs<ProjectsTabKey>
          activeKey={activeTab}
          onChange={setActiveTab}
          tabs={[
            { key: 'kanban', label: 'Bảng Kanban', icon: <Columns3 size={15} />, count: visibleTasks.length },
            { key: 'gantt', label: 'Sơ đồ Gantt', icon: <CalendarRange size={15} /> },
            { key: 'whiteboard', label: 'Whiteboard Cộng tác', icon: <PenTool size={15} />, count: boardElements.length },
            { key: 'pomodoro', label: 'Focus Pomodoro', icon: <Timer size={15} />, count: pomodoroSessions.length },
            { key: 'automation', label: 'Stage → Task Tự động', icon: <GitBranch size={15} />, count: templates.length },
            { key: 'helpdesk', label: 'Helpdesk CSKH SLA', icon: <LifeBuoy size={15} />, count: tickets.length },
          ]}
        />

        {projects.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={selectedProjectId}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="form-input"
              style={{ height: 44, minWidth: 240, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name} ({p.progress_pct}%)
                </option>
              ))}
            </select>
            {canEdit && activeTab === 'kanban' && (
              <button
                type="button"
                onClick={() => setColumnModalOpen(true)}
                className="btn secondary"
                style={{ height: 44, whiteSpace: 'nowrap' }}
              >
                + Cột trạng thái
              </button>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: INTERACTIVE KANBAN BOARD */}
      {activeTab === 'kanban' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.max(3, activeColumns.length)}, minmax(265px, 1fr))`,
            gap: '1rem',
            overflowX: 'auto',
            paddingBottom: 6,
          }}
        >
          {activeColumns.map((col, colIdx) => {
            const colTasks = visibleTasks.filter((t) => t.status_key === col.key);
            return (
              <div
                key={col.key}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  borderRadius: 20,
                  padding: '0.95rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  minHeight: 380,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: col.color || '#1E40FF',
                      }}
                    />
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>{col.label}</span>
                  </div>
                  <Badge tone="neutral">{colTasks.length}</Badge>
                </div>

                {colTasks.length === 0 ? (
                  <div
                    style={{
                      padding: '1.5rem 0.75rem',
                      textAlign: 'center',
                      fontSize: '0.78rem',
                      color: '#64748B',
                      border: '1px dashed #CBD5E1',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.65)',
                    }}
                  >
                    Chưa có thẻ công việc ở bước này
                  </div>
                ) : (
                  colTasks.map((t) => {
                    const prMeta = PRIORITY_BADGE_MAP[t.priority] || PRIORITY_BADGE_MAP.medium;
                    const nextCol = activeColumns[colIdx + 1];
                    return (
                      <div
                        key={t.id}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: 16,
                          padding: '0.9rem',
                          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                          <Badge tone={prMeta.tone}>{prMeta.label}</Badge>
                          {t.logged_minutes > 0 && (
                            <Badge tone="purple" icon={<Timer size={11} />}>
                              {t.logged_minutes}p
                            </Badge>
                          )}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>{t.title}</div>
                        {t.lead_name && (
                          <div style={{ fontSize: '0.75rem', color: '#1E40FF', fontWeight: 600 }}>
                            Khách CRM: {t.lead_name} {t.lead_phone ? `(${t.lead_phone})` : ''}
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: 6,
                            borderTop: '1px solid #F1F5F9',
                            fontSize: '0.74rem',
                            color: '#64748B',
                          }}
                        >
                          <span>{t.assignee_name || 'Chưa gán'}</span>
                          {canEdit && nextCol && (
                            <button
                              type="button"
                              onClick={() => handleMoveTaskColumn(t, nextCol.key)}
                              style={{
                                border: '1px solid #DBEAFE',
                                background: '#EFF6FF',
                                color: '#1E40FF',
                                borderRadius: 8,
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              Sang {nextCol.label} <ArrowRight size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: GANTT TIMELINE VIEW */}
      {activeTab === 'gantt' && (
        <Card
          title="Sơ đồ Tiến độ Gantt Theo Mốc Thời Gian"
          subtitle="Trực quan hóa ngày bắt đầu, hạn hoàn thành và tỷ lệ % hoàn tất của từng hạng mục"
        >
          {visibleTasks.length === 0 ? (
            <EmptyState
              title="Chưa có hạng mục trên sơ đồ Gantt"
              description="Hãy thêm công việc có ngày bắt đầu và hạn hoàn thành để hiển thị thanh tiến độ."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visibleTasks.map((t, idx) => {
                const pct = t.status_key === 'done' ? 100 : Math.max(15, t.progress_pct || 35);
                const leftOffsetPct = Math.min(55, (idx % 5) * 11);
                const widthPct = Math.min(100 - leftOffsetPct, Math.max(25, Math.round(t.estimated_minutes / 3)));
                return (
                  <div
                    key={t.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(220px, 280px) 1fr 90px',
                      alignItems: 'center',
                      gap: 14,
                      padding: '0.75rem 1rem',
                      borderRadius: 14,
                      border: '1px solid #E2E8F0',
                      background: '#F8F9FA',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A' }}>{t.title}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        {formatShortDate(t.start_date)} → {formatShortDate(t.due_date)}
                      </div>
                    </div>
                    <div
                      style={{
                        height: 24,
                        background: '#E2E8F0',
                        borderRadius: 999,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: `${leftOffsetPct}%`,
                          width: `${widthPct}%`,
                          top: 3,
                          bottom: 3,
                          borderRadius: 999,
                          background:
                            t.status_key === 'done'
                              ? 'linear-gradient(90deg, #10B981, #059669)'
                              : 'linear-gradient(90deg, #1E40FF, #06B6D4)',
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Badge tone={t.status_key === 'done' ? 'success' : 'primary'}>{pct}%</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: COLLABORATIVE WHITEBOARD CANVAS */}
      {activeTab === 'whiteboard' && (
        <Card
          title={`Bảng Trắng Cộng Tác (Whiteboard) — ${activeProject?.name || 'Chưa chọn dự án'}`}
          subtitle="Ghim Sticky Notes, Mốc chiến dịch & Khối kiến trúc lưu trực tiếp theo từng Dự án"
          actions={
            canEdit && (
              <button
                type="button"
                disabled={savingBoard}
                onClick={handleSaveWhiteboard}
                className="btn-inkica-primary"
                style={{
                  height: 40,
                  padding: '0 1rem',
                  borderRadius: 12,
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Save size={15} /> {savingBoard ? 'Đang lưu...' : 'Lưu Bảng trắng'}
              </button>
            )
          }
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '1rem' }}>
            <input
              value={newStickyText}
              onChange={(e) => setNewStickyText(e.target.value)}
              placeholder="Nhập ý tưởng, ghi chú họp hoặc mốc triển khai..."
              className="form-input"
              style={{ flex: 1, minWidth: 240, height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 14px' }}
            />
            <select
              value={newStickyType}
              onChange={(e) => setNewStickyType(e.target.value as 'sticky' | 'milestone' | 'box')}
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            >
              <option value="sticky">Sticky Note</option>
              <option value="milestone">Mốc Milestone</option>
              <option value="box">Khối quy trình</option>
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {STICKY_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.label}
                  onClick={() => setNewStickyColor(c.hex)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    background: c.hex,
                    border: newStickyColor === c.hex ? '2px solid #1E40FF' : '1px solid #CBD5E1',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
            <button type="button" onClick={handleAddWhiteboardElement} className="btn secondary" style={{ height: 44 }}>
              + Thêm vào Canvas
            </button>
          </div>

          <div
            style={{
              minHeight: 380,
              borderRadius: 18,
              border: '1px solid #E2E8F0',
              backgroundColor: '#F8F9FA',
              backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              position: 'relative',
              padding: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '1rem',
              alignContent: 'start',
            }}
          >
            {boardElements.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem', color: '#64748B' }}>
                Canvas đang trống — thêm Sticky Note đầu tiên để bắt đầu động não cùng đội dự án.
              </div>
            ) : (
              boardElements.map((el) => (
                <div
                  key={el.id}
                  style={{
                    background: el.color || '#FEF3C7',
                    border: '1px solid rgba(15, 23, 42, 0.1)',
                    borderRadius: el.type === 'milestone' ? 999 : 16,
                    padding: '1rem',
                    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.45 }}>
                    {el.text}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Badge tone="neutral">{el.type}</Badge>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setBoardElements((prev) => prev.filter((item) => item.id !== el.id))}
                        style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* TAB 4: FOCUS POMODORO TIMER */}
      {activeTab === 'pomodoro' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          <Card
            title="Đồng Hồ Tập Trung Sâu (Focus Pomodoro)"
            subtitle="Tự động cộng thời gian làm việc thực tế vào thẻ công việc đang chọn"
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '1rem 0' }}>
              <div
                className="autodata-tabular-nums"
                style={{
                  fontSize: '3.2rem',
                  fontWeight: 800,
                  color: '#1E40FF',
                  background: '#F8FAFF',
                  border: '2px solid #DBEAFE',
                  borderRadius: 24,
                  padding: '0.75rem 2.25rem',
                }}
              >
                {mm}:{ss}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {[15, 25, 45].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setPomoRunning(false);
                      setPomoMinutesPreset(preset);
                      setPomoSecondsLeft(preset * 60);
                    }}
                    className="btn secondary"
                    style={{
                      height: 38,
                      borderColor: pomoMinutesPreset === preset ? '#1E40FF' : '#E2E8F0',
                      color: pomoMinutesPreset === preset ? '#1E40FF' : '#475569',
                    }}
                  >
                    {preset} phút
                  </button>
                ))}
              </div>

              <select
                value={pomoTaskId}
                onChange={(e) => setPomoTaskId(e.target.value)}
                className="form-input"
                style={{ width: '100%', height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
              >
                <option value="">-- Gắn phiên Focus vào công việc (Tùy chọn) --</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} (Đã ghi {t.logged_minutes}p)
                  </option>
                ))}
              </select>

              <input
                value={pomoNote}
                onChange={(e) => setPomoNote(e.target.value)}
                placeholder="Ghi chú kết quả đạt được trong phiên Focus..."
                className="form-input"
                style={{ width: '100%', height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
              />

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setPomoRunning((r) => !r)}
                  className="btn secondary"
                  style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1E40FF' }}
                >
                  {pomoRunning ? <Pause size={16} /> : <Play size={16} />}
                  {pomoRunning ? 'Tạm dừng' : 'Bắt đầu đếm'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPomoRunning(false);
                    setPomoSecondsLeft(pomoMinutesPreset * 60);
                  }}
                  className="btn secondary"
                  style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RotateCcw size={15} /> Đặt lại
                </button>
                <button
                  type="button"
                  onClick={handleLogPomodoroSession}
                  className="btn-inkica-primary"
                  style={{
                    height: 44,
                    padding: '0 1.15rem',
                    borderRadius: 14,
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Hoàn tất & Ghi +{pomoMinutesPreset}p
                </button>
              </div>
            </div>
          </Card>

          <Card title="Nhật Ký Các Phiên Focus Gần Đây" subtitle="Đồng bộ thời gian thực cho toàn đội ngũ">
            {pomodoroSessions.length === 0 ? (
              <EmptyState title="Chưa có phiên Pomodoro nào" description="Bấm Hoàn tất phiên để lưu thời lượng làm việc." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pomodoroSessions.slice(0, 8).map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 14,
                      border: '1px solid #E2E8F0',
                      background: '#F8F9FA',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                        {s.task_title || s.note || 'Phiên làm việc tập trung'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        {s.user_name || 'Nhân sự'} • {formatShortDate(s.created_at)}
                      </div>
                    </div>
                    <Badge tone="purple">+{s.duration_minutes} phút</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 5: STAGE -> TASK AUTOMATION TEMPLATES */}
      {activeTab === 'automation' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
          <Card
            title="Thiết Lập Tự Động Sinh Việc Theo Bước Phễu CRM"
            subtitle="Kết nối trực tiếp Event Bus 'lead.stage_changed' — hễ khách chuyển bước là tự giao Checklist cho Sale"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select
                value={tplPipelineId}
                onChange={(e) => {
                  const nextPipe = e.target.value;
                  setTplPipelineId(nextPipe);
                  const st = (overview?.stages || []).find((s) => s.pipeline_id === nextPipe);
                  if (st) setTplStageId(st.id);
                }}
                className="form-input"
                style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
              >
                {(overview?.pipelines || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    Pipeline: {p.name}
                  </option>
                ))}
              </select>

              <select
                value={tplStageId}
                onChange={(e) => setTplStageId(e.target.value)}
                className="form-input"
                style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
              >
                {filteredStagesForTemplate.map((s) => (
                  <option key={s.id} value={s.id}>
                    Khi chuyển tới bước: {s.stage_name}
                  </option>
                ))}
              </select>

              <input
                value={tplTitle}
                onChange={(e) => setTplTitle(e.target.value)}
                placeholder="Tiêu đề việc mẫu (hỗ trợ biến {{lead.name}})"
                className="form-input"
                style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
              />

              <input
                type="number"
                value={tplDueHours}
                onChange={(e) => setTplDueHours(e.target.value)}
                placeholder="Hạn hoàn thành (số giờ sau khi chuyển bước)"
                className="form-input"
                style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
              />

              <textarea
                value={tplChecklistRaw}
                onChange={(e) => setTplChecklistRaw(e.target.value)}
                rows={3}
                placeholder="Mỗi dòng là 1 mục Checklist..."
                style={{ borderRadius: 14, border: '1px solid #E2E8F0', padding: '10px 12px', fontSize: '0.84rem' }}
              />

              {canCreate && (
                <button
                  type="button"
                  onClick={handleCreateWorkflowTemplate}
                  className="btn-inkica-primary"
                  style={{
                    height: 44,
                    borderRadius: 14,
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Kích hoạt Mẫu Tự Động Hóa
                </button>
              )}
            </div>
          </Card>

          <Card title="Các Luật Tự Sinh Công Việc Đang Hoạt Động" subtitle={`${templates.length} mẫu đang lắng nghe phễu CRM`}>
            {templates.length === 0 ? (
              <EmptyState
                title="Chưa có mẫu tự động hóa nào"
                description="Tạo mẫu bên trái để tự động sinh Checklist ngay khi Sale kéo khách sang bước mới."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {templates.map((wt) => (
                  <div
                    key={wt.id}
                    style={{
                      padding: '0.9rem 1rem',
                      borderRadius: 16,
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>{wt.title_template}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 3 }}>
                        Bước kích hoạt: <strong>{wt.stage_name || wt.stage_key}</strong> • Hạn +{wt.due_offset_hours}h •{' '}
                        {wt.checklist.length} checklist
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteWorkflowTemplate(wt.id)}
                      style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 6: HELPDESK CUSTOMER SLA */}
      {activeTab === 'helpdesk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: '0.84rem', color: '#475569' }}>
              Hệ thống <strong>Helpdesk CSKH chuẩn SLA</strong> (tách biệt hoàn toàn với phân hệ duyệt bù số rác của Auto Data)
            </div>
            {canCreate && (
              <button
                type="button"
                onClick={() => setTicketModalOpen(true)}
                className="btn-inkica-primary"
                style={{
                  height: 44,
                  padding: '0 1.15rem',
                  borderRadius: 14,
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus size={16} /> Mở Ticket Hỗ Trợ CSKH
              </button>
            )}
          </div>

          <Table
            columns={ticketColumns}
            rows={tickets}
            rowKey={(r) => r.id}
            onRowClick={openTicketDetail}
            emptyTitle="Chưa có yêu cầu hỗ trợ CSKH nào"
            emptyDescription="Mở Ticket CSKH để theo dõi cam kết thời gian phản hồi & xử lý SLA theo từng mức độ ưu tiên."
          />
        </div>
      )}

      {/* MODAL: Create Project */}
      <CustomModal isOpen={projectModalOpen} onClose={() => setProjectModalOpen(false)} title={`Khởi tạo ${terminology.projectLabel} mới`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={projName}
            onChange={(e) => setProjName(e.target.value)}
            placeholder={`Tên ${terminology.projectLabel}...`}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            type="number"
            value={projBudget}
            onChange={(e) => setProjBudget(e.target.value)}
            placeholder="Ngân sách dự kiến (VNĐ)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
            Ngân sách hiển thị: <strong>{formatVnd(Number(projBudget || 0))}</strong>
          </div>
          <input
            type="date"
            value={projDueDate}
            onChange={(e) => setProjDueDate(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <button
            type="button"
            onClick={handleCreateProject}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Tạo {terminology.projectLabel}
          </button>
        </div>
      </CustomModal>

      {/* MODAL: Add Kanban Column */}
      <CustomModal isOpen={columnModalOpen} onClose={() => setColumnModalOpen(false)} title="Thêm cột trạng thái Kanban tùy chỉnh">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={newColLabel}
            onChange={(e) => setNewColLabel(e.target.value)}
            placeholder="Tên cột trạng thái (VD: Kiểm thử QA, Chờ khách ký...)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <input
            type="color"
            value={newColColor}
            onChange={(e) => setNewColColor(e.target.value)}
            style={{ height: 44, width: 80, borderRadius: 10, border: '1px solid #E2E8F0', cursor: 'pointer' }}
          />
          <button
            type="button"
            onClick={handleAddKanbanColumn}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Lưu cột Kanban
          </button>
        </div>
      </CustomModal>

      {/* MODAL: Create Task */}
      <CustomModal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} title="Giao công việc mới">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Tiêu đề công việc..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <select
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="low">Ưu tiên Thấp</option>
            <option value="medium">Ưu tiên Trung bình</option>
            <option value="high">Ưu tiên Cao</option>
            <option value="urgent">Khẩn cấp</option>
          </select>
          <select
            value={taskAssigneeId}
            onChange={(e) => setTaskAssigneeId(e.target.value)}
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          >
            <option value="">-- Người phụ trách (mặc định: Tôi) --</option>
            {(overview?.staff || []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role})
              </option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              type="date"
              value={taskStartDate}
              onChange={(e) => setTaskStartDate(e.target.value)}
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
            <input
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
          </div>
          <input
            type="number"
            value={taskEstimate}
            onChange={(e) => setTaskEstimate(e.target.value)}
            placeholder="Thời lượng ước tính (phút)"
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <button
            type="button"
            onClick={handleCreateTask}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Tạo công việc
          </button>
        </div>
      </CustomModal>

      {/* MODAL: Create Helpdesk Ticket */}
      <CustomModal isOpen={ticketModalOpen} onClose={() => setTicketModalOpen(false)} title="Mở Ticket Hỗ trợ CSKH chuẩn SLA">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={tkSubject}
            onChange={(e) => setTkSubject(e.target.value)}
            placeholder="Tiêu đề sự cố / yêu cầu hỗ trợ..."
            className="form-input"
            style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              value={tkCustomerName}
              onChange={(e) => setTkCustomerName(e.target.value)}
              placeholder={`Tên ${terminology.customerLabel}...`}
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
            <input
              value={tkCustomerContact}
              onChange={(e) => setTkCustomerContact(e.target.value)}
              placeholder="SĐT / Email liên hệ..."
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <select
              value={tkPriority}
              onChange={(e) => setTkPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 10px' }}
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="urgent">Khẩn cấp</option>
            </select>
            <input
              type="number"
              value={tkRespHours}
              onChange={(e) => setTkRespHours(e.target.value)}
              placeholder="SLA Phản hồi (giờ)"
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 10px' }}
            />
            <input
              type="number"
              value={tkResHours}
              onChange={(e) => setTkResHours(e.target.value)}
              placeholder="SLA Xử lý (giờ)"
              className="form-input"
              style={{ height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 10px' }}
            />
          </div>
          <textarea
            value={tkDesc}
            onChange={(e) => setTkDesc(e.target.value)}
            rows={3}
            placeholder="Mô tả chi tiết yêu cầu của khách hàng..."
            style={{ borderRadius: 14, border: '1px solid #E2E8F0', padding: '10px 12px', fontSize: '0.84rem' }}
          />
          <button
            type="button"
            onClick={handleCreateHelpdeskTicket}
            className="btn-inkica-primary"
            style={{ height: 44, borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
          >
            Tạo Ticket & Kích hoạt SLA
          </button>
        </div>
      </CustomModal>

      {/* MODAL: Ticket Detail & SLA Thread */}
      <CustomModal
        isOpen={Boolean(activeTicket)}
        onClose={() => setActiveTicket(null)}
        title={activeTicket ? `${activeTicket.ticket_code} — ${activeTicket.subject}` : ''}
        width={680}
      >
        {activeTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge tone={activeTicket.sla_breached ? 'danger' : 'primary'}>
                  {formatRemainingCountdown(activeTicket.resolution_remaining_minutes, activeTicket.status)}
                </Badge>
                <Badge tone="info">Trạng thái: {activeTicket.status}</Badge>
              </div>
              {canEdit && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => handleUpdateTicketStatus(activeTicket.id, 'in_progress')}
                    className="btn secondary"
                    style={{ height: 36, fontSize: '0.78rem' }}
                  >
                    Đang xử lý
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateTicketStatus(activeTicket.id, 'resolved')}
                    className="btn-inkica-primary"
                    style={{
                      height: 36,
                      padding: '0 12px',
                      borderRadius: 10,
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Đánh dấu Đã giải quyết
                  </button>
                </div>
              )}
            </div>

            {activeTicket.description && (
              <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: '#F8F9FA', fontSize: '0.85rem' }}>
                {activeTicket.description}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
              {ticketComments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 14,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                  }}
                >
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1E40FF' }}>
                    <MessageSquare size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {c.author_name} • {formatShortDate(c.created_at)}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#0F172A', marginTop: 4 }}>{c.content}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Nhập phản hồi hỗ trợ khách hàng..."
                className="form-input"
                style={{ flex: 1, height: 44, borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 12px' }}
              />
              <button
                type="button"
                onClick={handleSendTicketComment}
                className="btn-inkica-primary"
                style={{
                  height: 44,
                  padding: '0 1.1rem',
                  borderRadius: 14,
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Gửi phản hồi
              </button>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
};

export default ErpProjectsWave2Entry;
