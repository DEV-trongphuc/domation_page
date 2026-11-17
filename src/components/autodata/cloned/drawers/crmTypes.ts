export interface CrmTagItem {
  id: string;
  name: string;
  slug?: string;
  color_hex: string;
}

export interface CrmAudienceBadge {
  id: string;
  name: string;
  audience_type: string;
  color_hex: string;
  joined_at?: string;
}

export interface CrmCustomFieldDef {
  id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required?: boolean;
  options_json?: string[];
  sort_order?: number;
}

export interface CrmEntityTabField {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'select' | 'boolean';
  options?: string[];
}

export interface CrmDynamicEntityTab {
  id: string;
  tab_key: string;
  tab_label: string;
  icon_name?: string;
  sort_order?: number;
  fields_json: CrmEntityTabField[];
  allowed_roles?: string[];
}

export interface CrmPipelineStage {
  id: string;
  pipeline_id?: string;
  stage_key: string;
  stage_name: string;
  color_hex: string;
  stage_order?: number;
  is_won_stage?: boolean;
  is_lost_stage?: boolean;
}

export interface CrmStaffMember {
  id: string;
  full_name: string;
  email?: string;
  role?: string;
  team_id?: string | null;
  department_id?: string | null;
}

export interface CrmContactRecord {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  pii_masked?: boolean;
  status?: string;
  lifecycle_stage?: string;
  lead_score: number;
  email_consent?: string;
  zns_consent?: string;
  total_revenue_vnd: number;
  last_engaged_at?: string | null;
  source?: string;
  campaign?: string | null;
  product_interest?: string | null;
  budget_range?: string | null;
  pipeline_id?: string | null;
  pipeline_name?: string | null;
  stage_id?: string | null;
  stage_name?: string | null;
  stage_color?: string | null;
  assigned_to?: string | null;
  owner_name?: string | null;
  company_id?: string | null;
  company_name?: string | null;
  company_tax_code?: string | null;
  company_tier?: string | null;
  job_title?: string | null;
  address?: string | null;
  custom_fields: Record<string, unknown>;
  tags?: CrmTagItem[];
  audiences?: CrmAudienceBadge[];
  is_accepted?: boolean;
  sla_breached?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CrmEditHistoryEntry {
  edited_by_id?: string;
  edited_by_name: string;
  edited_at: string;
  old_body?: string | null;
  old_subject?: string | null;
}

export interface CrmTimelineItem {
  id: string;
  source_table: 'timeline' | 'crm_activity';
  event_type: string;
  category: string;
  actor_id?: string | null;
  actor_name: string;
  title: string;
  content?: string | null;
  status?: string;
  priority?: string;
  due_date?: string | null;
  mentions: string[];
  edit_history: CrmEditHistoryEntry[];
  created_at: string;
}

export interface CrmJourneyTouchpoint {
  id: string;
  channel: 'web' | 'email' | 'flow' | 'survey' | 'voucher' | string;
  title: string;
  detail: string;
  timestamp?: string | null;
}

export interface CrmOmnichannelJourneyData {
  completeness_pct: number;
  lead_score: number;
  lifecycle_stage?: string;
  first_touch_source: string;
  first_touch_campaign: string;
  touchpoints: CrmJourneyTouchpoint[];
  email_claims: Array<Record<string, unknown>>;
  flow_enrollments: Array<Record<string, unknown>>;
  survey_responses: Array<Record<string, unknown>>;
  vouchers: Array<Record<string, unknown>>;
  web_sessions: Array<Record<string, unknown>>;
  conversations: Array<Record<string, unknown>>;
  available_flows: Array<{ id: string; name: string; status?: string }>;
  available_campaigns: Array<{ id: string; name: string; discount_type?: string; discount_value?: number }>;
}

export interface DomJourneyAiAnalysis {
  summary: string;
  key_needs: string[];
  financial_status: string;
  potential_level: string;
  potential_score: number;
  next_best_actions: string[];
  analyzed_at: string;
  source: string;
  metrics?: {
    total_spent?: number;
    expected_revenue?: number;
    deals_count?: number;
    activities_count?: number;
  };
}

export interface CrmDealRecord {
  id: string;
  deal_code: string;
  title: string;
  company_id?: string | null;
  company_name?: string | null;
  company_tier?: string | null;
  lead_id?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  pii_masked?: boolean;
  owner_user_id?: string | null;
  owner_name?: string | null;
  pipeline_id?: string | null;
  stage_id?: string | null;
  stage: string;
  amount_vnd: number;
  probability: number;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  lost_reason?: string | null;
  notes?: string | null;
  tags_json?: string[];
  custom_fields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface CrmDealStageHistoryRow {
  id: string;
  deal_id: string;
  deal_title?: string;
  deal_code?: string;
  from_stage?: string | null;
  to_stage: string;
  probability: number;
  amount_vnd: number;
  duration_seconds: number;
  note?: string | null;
  changed_by?: string | null;
  changed_by_name?: string | null;
  created_at: string;
}

export interface CrmCompanyRecord {
  id: string;
  code: string;
  name: string;
  tax_code?: string | null;
  industry?: string | null;
  company_size?: string | null;
  website?: string | null;
  billing_address?: string | null;
  phone?: string | null;
  email?: string | null;
  representative_name?: string | null;
  owner_user_id?: string | null;
  owner_name?: string | null;
  parent_company_id?: string | null;
  parent_company_name?: string | null;
  status?: string;
  tier: 'standard' | 'silver' | 'gold' | 'enterprise' | string;
  sla_tier?: string;
  subsidiaries_count?: number;
  contact_count?: number;
  deal_count?: number;
  won_revenue_vnd?: number;
  pipeline_value_vnd?: number;
  tags_json?: string[];
  custom_fields?: Record<string, unknown>;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CrmActivityRecord {
  id: string;
  activity_type: 'call' | 'zalo_connect' | 'email' | 'meeting' | 'task' | 'note' | string;
  subject: string;
  body?: string | null;
  status: 'planned' | 'in_progress' | 'done' | 'cancelled' | string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | string;
  due_date?: string | null;
  completed_at?: string | null;
  duration_minutes?: number;
  lead_id?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  company_id?: string | null;
  company_name?: string | null;
  deal_id?: string | null;
  deal_title?: string | null;
  task_id?: string | null;
  owner_user_id?: string | null;
  owner_name?: string | null;
  mentions_json?: string[];
  edit_history_json?: CrmEditHistoryEntry[];
  created_at: string;
}

export interface TaskChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export interface WorkspaceTaskRecord {
  id: string;
  project_id?: string | null;
  project_name?: string | null;
  lead_id?: string | null;
  contact_name?: string | null;
  deal_id?: string | null;
  deal_title?: string | null;
  company_id?: string | null;
  company_name?: string | null;
  group_id?: string | null;
  title: string;
  description?: string | null;
  status_key: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | string;
  assignee_user_id?: string | null;
  assignee_name?: string | null;
  reporter_user_id?: string | null;
  reporter_name?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  estimated_minutes: number;
  logged_minutes: number;
  progress_pct: number;
  sort_order: number;
  checklist_json: TaskChecklistItem[];
  category?: string;
  is_muted: boolean;
  is_hidden: boolean;
  participant_ids_json?: string[];
  tags_json?: string[];
  comments_count?: number;
  attachments_count?: number;
  dependencies_count?: number;
  completed_at?: string | null;
  created_at?: string;
}

export interface TaskDependencyItem {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  depends_on_title?: string;
  depends_on_status?: string;
  dependency_type: 'blocks' | 'blocked_by' | 'relates_to' | string;
  note?: string | null;
  created_at: string;
}

export interface TaskCommentItem {
  id: string;
  task_id: string;
  author_user_id?: string | null;
  author_name: string;
  content: string;
  mentions_json?: string[];
  created_at: string;
}

export interface TaskAttachmentItem {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  mime_type?: string;
  size_bytes: number;
  uploaded_by_name?: string | null;
  created_at: string;
}

export interface PomodoroSessionRecord {
  id: string;
  task_id?: string | null;
  task_title?: string | null;
  duration_minutes: number;
  mode: 'focus' | 'short_break' | 'long_break' | string;
  note?: string | null;
  started_at: string;
  completed_at: string;
}

export interface WorkspaceTaskGroup {
  id: string;
  name: string;
  color_hex: string;
  icon_name: string;
  sort_order: number;
  is_pinned: boolean;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  progress_percent: number;
}

export interface WorkspaceTaskGroupsSummary {
  all: { total_tasks: number; completed_tasks: number; pending_tasks: number; progress_percent: number };
  personal: { total_tasks: number; completed_tasks: number; pending_tasks: number; progress_percent: number };
  unassigned: { total_tasks: number; completed_tasks: number; pending_tasks: number; progress_percent: number };
}

export interface HelpdeskTicketRecord {
  id: string;
  ticket_code: string;
  subject: string;
  description?: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | string;
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed' | string;
  lead_id?: string | null;
  lead_name?: string | null;
  lead_phone?: string | null;
  lead_email?: string | null;
  customer_name?: string | null;
  customer_contact?: string | null;
  assignee_user_id?: string | null;
  assignee_name?: string | null;
  sla_response_hours?: number;
  sla_resolution_hours?: number;
  response_due_at?: string;
  resolution_due_at?: string;
  first_responded_at?: string | null;
  resolved_at?: string | null;
  sla_breached?: boolean;
  created_at?: string;
}

export interface HelpdeskTicketComment {
  id: string;
  ticket_id: string;
  author_user_id?: string | null;
  author_name: string;
  content: string;
  is_internal_note: boolean;
  created_at: string;
}
