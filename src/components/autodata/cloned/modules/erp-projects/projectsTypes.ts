export type ProjectsTabKey =
  | 'kanban'
  | 'gantt'
  | 'whiteboard'
  | 'pomodoro'
  | 'automation'
  | 'helpdesk';

export interface KanbanColumnItem {
  key: string;
  label: string;
  color: string;
  is_done?: boolean;
}

export interface WhiteboardElementItem {
  id: string;
  type: 'sticky' | 'milestone' | 'box';
  text: string;
  x: number;
  y: number;
  color: string;
}

export interface WhiteboardSnapshotRow {
  id: string;
  project_id: string;
  snapshot_name: string;
  version_no: number;
  snapshot_json: WhiteboardElementItem[];
  elements?: WhiteboardElementItem[];
  thumbnail_note?: string | null;
  created_by_name?: string | null;
  created_at: string;
}

export interface ProjectRosterRow {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  user_email?: string | null;
  department_name?: string | null;
  role_in_project: 'owner' | 'manager' | 'member' | 'viewer' | string;
  can_edit_tasks: boolean;
  can_manage_roster: boolean;
  can_edit_whiteboard: boolean;
  allocation_pct: number;
  created_at: string;
}

export interface ProjectRow {
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
  roster_count?: number;
  snapshot_count?: number;
  task_columns: KanbanColumnItem[];
  whiteboard_elements: WhiteboardElementItem[];
}

export interface ChecklistEntry {
  id: string;
  text: string;
  done: boolean;
}

export type DependencyTypeCode = 'FS' | 'SS' | 'FF' | 'SF';

export interface TaskDependencyRow {
  id?: string;
  task_id?: string;
  predecessor_task_id: string;
  predecessor_title?: string | null;
  successor_title?: string | null;
  dependency_type: DependencyTypeCode | string;
  lag_days: number;
}

export interface TaskCommentRow {
  id: string;
  task_id: string;
  author_user_id?: string | null;
  author_name: string;
  content: string;
  mentions: string[];
  created_at: string;
}

export interface TaskAttachmentRow {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_name?: string | null;
  created_at: string;
}

export interface TaskRow {
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
  comments_count?: number;
  attachments_count?: number;
  checklist: ChecklistEntry[];
  dependencies?: TaskDependencyRow[];
  dependency_links?: TaskDependencyRow[];
}

export interface PomodoroSessionRow {
  id: string;
  task_id?: string | null;
  task_title?: string | null;
  user_name?: string | null;
  duration_minutes: number;
  mode: string;
  note?: string | null;
  created_at: string;
}

export interface WorkflowTemplateRow {
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

export interface HelpdeskTicketRow {
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
  assignee_user_id?: string | null;
  assignee_name?: string | null;
  sla_response_hours: number;
  sla_resolution_hours: number;
  response_due_at: string;
  resolution_due_at: string;
  first_responded_at?: string | null;
  sla_breached: boolean;
  response_breached?: boolean;
  resolution_remaining_minutes: number;
  created_at: string;
}

export interface HelpdeskCommentRow {
  id: string;
  author_name: string;
  content: string;
  is_internal_note: boolean;
  created_at: string;
}

export interface StaffMemberLookup {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department_id?: string | null;
}

export interface OverviewPayload {
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
  staff: StaffMemberLookup[];
  pipelines: Array<{ id: string; name: string; is_default?: boolean }>;
  stages: Array<{ id: string; pipeline_id: string; stage_key: string; stage_name: string; color_hex: string }>;
}

export const DEFAULT_COLUMNS: KanbanColumnItem[] = [
  { key: 'todo', label: 'Cần làm', color: '#64748B' },
  { key: 'in_progress', label: 'Đang thực hiện', color: '#1E40FF' },
  { key: 'review', label: 'Chờ nghiệm thu', color: '#D97706' },
  { key: 'done', label: 'Hoàn thành', color: '#10B981', is_done: true },
];

export const PRIORITY_BADGE_MAP: Record<
  string,
  { label: string; tone: 'neutral' | 'info' | 'warning' | 'danger' }
> = {
  low: { label: 'Thấp', tone: 'neutral' },
  medium: { label: 'Trung bình', tone: 'info' },
  high: { label: 'Cao', tone: 'warning' },
  urgent: { label: 'Khẩn cấp', tone: 'danger' },
};

export const STICKY_COLORS = [
  { label: 'Vàng ghi chú', hex: '#FEF3C7' },
  { label: 'Xanh Sapphire', hex: '#DBEAFE' },
  { label: 'Ngọc lục bảo', hex: '#D1FAE5' },
  { label: 'Tím sáng', hex: '#EDE9FE' },
];

export const DEPENDENCY_TYPE_OPTIONS: Array<{ value: DependencyTypeCode; label: string }> = [
  { value: 'FS', label: 'FS — Kết thúc -> Bắt đầu (Finish-to-Start)' },
  { value: 'SS', label: 'SS — Bắt đầu -> Bắt đầu (Start-to-Start)' },
  { value: 'FF', label: 'FF — Kết thúc -> Kết thúc (Finish-to-Finish)' },
  { value: 'SF', label: 'SF — Bắt đầu -> Kết thúc (Start-to-Finish)' },
];

export const PROJECT_ROLE_OPTIONS = [
  { value: 'owner', label: 'Chủ dự án (Project Owner)' },
  { value: 'manager', label: 'Quản trị tiến độ (PM)' },
  { value: 'member', label: 'Thành viên thực thi' },
  { value: 'viewer', label: 'Người quan sát (Chỉ xem)' },
];

export const TICKET_STATUS_OPTIONS = [
  { value: 'open', label: 'Mới mở', tone: 'primary' as const },
  { value: 'in_progress', label: 'Đang xử lý', tone: 'info' as const },
  { value: 'waiting_customer', label: 'Chờ khách phản hồi', tone: 'warning' as const },
  { value: 'resolved', label: 'Đã giải quyết', tone: 'success' as const },
  { value: 'closed', label: 'Đã đóng', tone: 'neutral' as const },
];

export function formatRemainingCountdown(mins: number, status: string): string {
  if (status === 'resolved' || status === 'closed') return 'Đã hoàn tất SLA';
  if (mins < 0) {
    const over = Math.abs(mins);
    return over >= 60 ? `Quá hạn ${Math.floor(over / 60)}h ${over % 60}p` : `Quá hạn ${over}p`;
  }
  return mins >= 60 ? `Còn ${Math.floor(mins / 60)}h ${mins % 60}p` : `Còn ${mins}p`;
}

export function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function formatBytesCompact(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
