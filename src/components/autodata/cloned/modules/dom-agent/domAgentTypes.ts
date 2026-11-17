import type { ActionProposalSpec, DynamicChartSpec } from '../../chat/actionProposalUtils';

export type DomAgentTabKey = 'council_chat' | 'morning_briefing' | 'rag_studio' | 'tools_audit';

export type DomToolGroupKey =
  | 'crm_autodata'
  | 'marketing_audiences'
  | 'org_rbac_rag'
  | 'hrm_payroll'
  | 'erp_ops_finance';

export interface DomAgentConfigDto {
  id: string;
  tenant_id: string;
  agent_name: string;
  avatar_url: string;
  greeting_message: string;
  persona_tone: string;
  preferred_model: string;
  temperature: number;
  enable_morning_briefing: boolean;
  guardrail_rules: string[];
  has_byok_gemini: boolean;
  gemini_key_hint: string | null;
  updated_at?: string;
}

export interface DomSpecialistItem {
  key: string;
  name: string;
  badge: string;
  description: string;
  required_module: string;
  unlocked: boolean;
  upgrade_package: 'autodata_crm' | 'marketing_standalone' | 'growth_combo' | 'domation_promax' | null;
  quick_prompts: string[];
}

export interface DomToolParamSpec {
  type: 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN';
  description: string;
  enum?: string[];
}

export interface DomToolCatalogItem {
  name: string;
  title: string;
  description: string;
  group: DomToolGroupKey;
  group_label: string;
  module_key: string;
  extra_required_modules: string[];
  required_action: string;
  is_mutating: boolean;
  specialist_keys: string[];
  parameters: Record<string, DomToolParamSpec>;
  entitled: boolean;
  permitted: boolean;
  allowed: boolean;
  effective_scope: string;
  locked_reason: 'MODULE_NOT_ENTITLED' | 'FORBIDDEN_RBAC_PERMISSION' | null;
  upgrade_hint: string | null;
}

export interface DomToolExecutionRecord {
  allowed: boolean;
  status_code: number;
  error_code?: string;
  denial_reason?: string;
  upgrade_hint?: string;
  tool_name: string;
  tool_title?: string;
  module_key: string;
  required_action: string;
  effective_scope: string;
  pii_masked: boolean;
  audit_log_id: string;
  latency_ms: number;
  output?: Record<string, unknown>;
}

export interface DomRagCitationItem {
  chunk_id: string;
  doc_id: string;
  title: string;
  category: string;
  source_type: string;
  chunk_index: number;
  snippet: string;
  score: number;
}

export interface DomThreadItem {
  id: string;
  tenant_id: string;
  user_id: string;
  specialist_key: string;
  title: string;
  is_pinned: boolean;
  last_message_at: string;
  created_at?: string;
}

export interface DomMessageItem {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls: DomToolExecutionRecord[];
  citations: DomRagCitationItem[];
  chart_data?: DynamicChartSpec | null;
  action_proposal?: ActionProposalSpec | null;
  latency_ms: number;
  model_used?: string | null;
  created_at?: string;
}

export interface DomDepartmentOption {
  id: string;
  code: string;
  name: string;
  parent_department_id: string | null;
}

export interface DomKnowledgeDocItem {
  id: string;
  title: string;
  category: string;
  source_type: 'manual' | 'policy_sync' | 'file_upload';
  source_policy_id?: string | null;
  file_name?: string | null;
  content_text: string;
  allowed_department_ids: string[];
  chunk_count: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DomToolAuditLogItem {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  tool_name: string;
  module_key: string;
  required_action: string;
  data_scope: string;
  allowed: boolean;
  denial_reason?: string | null;
  args_summary: Record<string, unknown>;
  latency_ms: number;
  created_at: string;
}

export interface DomAgentBootstrapPayload {
  config: DomAgentConfigDto;
  package_code: string;
  can_manage_agent: boolean;
  caller_department_id: string | null;
  specialists: DomSpecialistItem[];
  tools: DomToolCatalogItem[];
  tools_summary: {
    total_count: number;
    entitled_count: number;
    allowed_count: number;
    locked_by_package_count: number;
    locked_by_rbac_count: number;
  };
  threads: DomThreadItem[];
  departments: DomDepartmentOption[];
  knowledge_docs: DomKnowledgeDocItem[];
  audit_logs: DomToolAuditLogItem[];
}

export interface DomBriefingSection {
  tool_name: string;
  title: string;
  module_key: string;
  scope: string;
  metrics: Record<string, unknown>;
}

export interface DomMorningBriefingPayload {
  generated_at: string;
  agent_name: string;
  avatar_url: string;
  tenant_name: string;
  package_code: string;
  package_name: string;
  industry_label: string;
  active_knowledge_docs: number;
  sections: DomBriefingSection[];
  priority_actions: string[];
}

export const KNOWLEDGE_CATEGORIES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'company_policy', label: 'Nội quy & Quy chế Công ty' },
  { value: 'sales_playbook', label: 'Kịch bản Tư vấn & Bảng giá Kinh doanh' },
  { value: 'contract_terms', label: 'Điều khoản Hợp đồng & Pháp lý' },
  { value: 'warranty_return', label: 'Chính sách Bảo hành, Đổi trả & SLA' },
  { value: 'hr_onboarding', label: 'Hướng dẫn Hội nhập & Phúc lợi Nhân sự' },
  { value: 'dom_agent_sop', label: 'Quy trình Vận hành Chuẩn (SOP)' },
];

export const TOOL_GROUP_OPTIONS: ReadonlyArray<{ value: 'all' | DomToolGroupKey; label: string }> = [
  { value: 'all', label: 'Tất cả 5 Nhóm (80 Công cụ RBAC)' },
  { value: 'crm_autodata', label: 'Nhóm 1: CRM & Auto Data (16)' },
  { value: 'marketing_audiences', label: 'Nhóm 2: Audiences & Marketing (17)' },
  { value: 'org_rbac_rag', label: 'Nhóm 3: Tổ chức, RBAC & RAG (10)' },
  { value: 'hrm_payroll', label: 'Nhóm 4: HRM, Chấm công & Lương A-Z (15)' },
  { value: 'erp_ops_finance', label: 'Nhóm 5: Dự án, Phê duyệt, Tài chính & Kho (22)' },
];

export const PERSONA_TONE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'executive_concise', label: 'Điều hành Ngắn gọn, Đi thẳng Trọng tâm (Executive Concise)' },
  { value: 'analytical_precise', label: 'Phân tích Số liệu Chuyên sâu (Analytical & Data-Driven)' },
  { value: 'consultative_warm', label: 'Tư vấn Đồng hành & Thân thiện (Consultative)' },
];

export const DEFAULT_ROBOT_AVATAR = '/imgs/autodata/ICON.png';
