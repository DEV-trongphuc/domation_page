export type SettingsGroupKey =
  | 'org_branding'
  | 'rbac_screens'
  | 'terminology_tabs'
  | 'pipelines_scoring'
  | 'approvals_rules'
  | 'attendance_policy'
  | 'lead_distribution'
  | 'comms_notifications'
  | 'ai_knowledge'
  | 'data_cron_billing';

export interface SettingsGroupDescriptor {
  key: SettingsGroupKey;
  label: string;
  requiredModule?: string;
  requiredAction?: { module: string; action: 'view' | 'manage_config' };
}

export const SETTINGS_10_GROUPS: ReadonlyArray<SettingsGroupDescriptor> = [
  { key: 'org_branding', label: '1. Tổ chức & Thương hiệu', requiredAction: { module: 'users', action: 'view' } },
  { key: 'rbac_screens', label: '2. Phân quyền & Màn hình', requiredAction: { module: 'users', action: 'manage_config' } },
  { key: 'terminology_tabs', label: '3. Từ điển & Trường Tùy chỉnh' },
  { key: 'pipelines_scoring', label: '4. Phễu, Tags & Điểm Lead' },
  { key: 'approvals_rules', label: '5. Quy trình Phê duyệt' },
  { key: 'attendance_policy', label: '6. Chấm công, Ca & GPS', requiredModule: 'erp_attendance' },
  { key: 'lead_distribution', label: '7. Phân phối Lead & SLA', requiredModule: 'rounds' },
  { key: 'comms_notifications', label: '8. Kênh Gửi, Bot & Thông báo' },
  { key: 'ai_knowledge', label: '9. AI, Policy Docs & DOM Agent' },
  { key: 'data_cron_billing', label: '10. Dữ liệu, Cron & Gói dịch vụ', requiredModule: 'billing' },
];

export function resolveLegacyTabToGroup(rawTab: string | null | undefined): SettingsGroupKey {
  switch (rawTab) {
    case 'org_branding':
    case 'org_structure':
      return 'org_branding';
    case 'rbac_screens':
    case 'rbac_matrix':
      return 'rbac_screens';
    case 'terminology_tabs':
    case 'terminology':
      return 'terminology_tabs';
    case 'pipelines_scoring':
    case 'pipeline_rules':
      return 'pipelines_scoring';
    case 'approvals_rules':
      return 'approvals_rules';
    case 'attendance_policy':
      return 'attendance_policy';
    case 'lead_distribution':
    case 'processing':
      return 'lead_distribution';
    case 'comms_notifications':
    case 'communications':
    case 'report':
      return 'comms_notifications';
    case 'ai_knowledge':
    case 'ai':
    case 'policy_docs':
      return 'ai_knowledge';
    case 'data_cron_billing':
    case 'billing':
    case 'duplicate_check':
      return 'data_cron_billing';
    default:
      return 'org_branding';
  }
}
