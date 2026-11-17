/**
 * Single source of truth for workspace route -> (screenKey, moduleKey) gating.
 *
 * Shared by `AutodataClonedRoot` (AppTabs route guard), `Sidebar`, `CommandPalette`
 * and the keyboard shortcuts controller so that visibility & route access are
 * resolved ONLY through entitlement modules (`hasModule`), RBAC module actions
 * (`can`) and the per-user `screen_access` matrix (`canScreen`).
 * Zero role-string hardcoding.
 */

export interface RouteAccessRule {
  /** Screen key resolved against `screen_access` + SCREEN_ACCESS_CATALOG. */
  screenKey: string;
  /** Entitlement module key resolved through `hasModule()` + `can(moduleKey, 'view')`. */
  moduleKey: string;
  /** Academic / Education sub-views: only when the Education add-on is active. */
  requiresEducation?: boolean;
  /** Tenant owner can always reach this screen (recovery path for settings/accounts). */
  ownerRecovery?: boolean;
}

export interface RouteGateApi {
  hasModule: (moduleKey: string) => boolean;
  can: (moduleKey: string, action?: 'view') => boolean;
  canScreen: (screenKey: string) => boolean;
  isTenantOwner: boolean;
  educationAddon: boolean;
}

const r = (
  screenKey: string,
  moduleKey: string,
  extra: Omit<RouteAccessRule, 'screenKey' | 'moduleKey'> = {}
): RouteAccessRule => ({ screenKey, moduleKey, ...extra });

/**
 * Package 1 (`autodata_crm`) classic /data distribution suite paths.
 * Every other workspace path belongs to Packages 2/3/4.
 */
export const PACKAGE1_CORE_PATHS: ReadonlyArray<string> = [
  '/',
  '/data',
  '/leads',
  '/calendar',
  '/ads-performance',
  '/tickets',
  '/gatekeeper',
  '/rounds',
  '/fair-share',
  '/rules',
  '/rule-settings',
  '/consultants',
  '/integrations',
  '/accounts',
  '/settings',
  '/sale-portal',
];

export const ROUTE_ACCESS_RULES: Readonly<Record<string, RouteAccessRule>> = {
  // ===== Package 1 — Auto Data & CRM (classic /data suite) =====
  '/': r('dashboard', 'crm_dashboard'),
  '/data': r('data_list', 'leads'),
  '/leads': r('data_list', 'leads'),
  '/calendar': r('calendar', 'leads'),
  '/personal-calendar': r('calendar', 'leads'),
  '/ads-performance': r('ads_performance', 'ads_capi'),
  '/tickets': r('tickets', 'tickets_data'),
  '/gatekeeper': r('gatekeeper', 'gatekeeper'),
  '/rounds': r('rounds', 'rounds'),
  '/fair-share': r('fair_share', 'fair_share'),
  '/rules': r('routing_rules', 'routing_rules'),
  '/rule-settings': r('routing_rules', 'routing_rules'),
  '/consultants': r('consultants', 'consultants'),
  '/integrations': r('integrations', 'integrations_autodata'),
  '/accounts': r('accounts', 'users', { ownerRecovery: true }),
  '/settings': r('settings', 'settings', { ownerRecovery: true }),
  '/sale-portal': r('sale_portal', 'sale_portal'),
  '/report-data': r('report_data', 'tickets_data'),

  // ===== Growth extras (Packages 3/4) — CRM 360 full-clone =====
  '/workspace': r('workspace', 'workspace_personal'),
  '/account': r('account', 'settings', { ownerRecovery: true }),
  '/contacts': r('contacts', 'contacts_360'),
  '/companies': r('companies', 'companies'),
  '/deals': r('deals', 'deals'),
  '/activities': r('activities', 'activities'),

  // ===== Education add-on (Package 4 + educationAddon) =====
  '/students': r('students', 'education_addon', { requiresEducation: true }),
  '/schedules': r('schedules', 'education_addon', { requiresEducation: true }),
  '/erp/education': r('erp_education', 'education_addon', { requiresEducation: true }),

  // ===== Marketing (Packages 2/3/4) =====
  '/marketing': r('mkt_dashboard', 'mkt_dashboard'),
  '/marketing-dashboard': r('mkt_dashboard', 'mkt_dashboard'),
  '/marketing/flows': r('mkt_flows', 'automation_flows'),
  '/marketing/campaigns': r('mkt_campaigns', 'campaigns'),
  '/marketing/templates': r('mkt_templates', 'email_templates'),
  '/marketing/audience': r('audiences', 'audiences'),
  '/audiences': r('audiences', 'audiences'),
  '/marketing/surveys': r('mkt_surveys', 'surveys_quiz'),
  '/marketing/forms': r('mkt_forms', 'forms_triggers'),
  '/marketing/vouchers': r('mkt_vouchers', 'vouchers_qr'),
  '/marketing/social-bot': r('mkt_social_bot', 'social_bot'),
  '/marketing/ai-training': r('mkt_ai_training', 'ai_bot_studio'),
  '/marketing/web-tracking': r('mkt_web_tracking', 'web_tracking'),
  '/marketing/api-triggers': r('mkt_api_triggers', 'integrations_marketing'),
  '/marketing-connect': r('marketing_connect', 'integrations_marketing'),
  '/marketing/capi': r('mkt_capi', 'web_tracking'),
  '/capi': r('mkt_capi', 'web_tracking'),

  // ===== ERP PROMAX (Package 4) =====
  '/feed': r('feed', 'erp_workchat'),
  '/erp/workchat': r('erp_workchat', 'erp_workchat'),
  '/approvals': r('erp_approvals', 'erp_approvals'),
  '/erp/approvals': r('erp_approvals', 'erp_approvals'),
  '/attendance': r('erp_attendance', 'erp_attendance'),
  '/erp/attendance': r('erp_attendance', 'erp_attendance'),
  '/hrm': r('erp_hrm', 'erp_hrm_org'),
  '/erp/hrm': r('erp_hrm', 'erp_hrm_org'),
  '/erp/payroll': r('erp_payroll', 'erp_payroll'),
  '/my-payslips': r('my_payslips', 'erp_payroll'),
  '/cooperation-slips': r('cooperation_slips', 'erp_payroll'),
  '/cooperations': r('cooperation_slips', 'erp_payroll'),
  '/projects': r('erp_projects', 'erp_projects_tasks'),
  '/erp/projects': r('erp_projects', 'erp_projects_tasks'),
  '/support-tickets': r('support_tickets', 'erp_projects_tasks'),
  '/files': r('erp_cloud_files', 'erp_cloud_ocr'),
  '/erp/cloud-files': r('erp_cloud_files', 'erp_cloud_ocr'),
  '/dom-agent': r('dom_agent', 'dom_agent'),
  '/qwen-agent-lab': r('dom_agent', 'dom_agent'),
  '/ai-training': r('ai_training', 'dom_agent'),
  '/reports-crm': r('reports_crm', 'reports_bi'),
  '/financial-dashboard': r('erp_finance', 'erp_finance_inventory'),
  '/erp/finance': r('erp_finance', 'erp_finance_inventory'),
  '/quotes': r('quotes', 'erp_finance_inventory'),
  '/sales-orders': r('sales_orders', 'erp_finance_inventory'),
  '/deposits': r('deposits', 'erp_finance_inventory'),
  '/expenses': r('expenses', 'erp_finance_inventory'),
  '/cash-flow': r('cash_flow', 'erp_finance_inventory'),
  '/accounting-az': r('accounting_az', 'erp_finance_inventory'),
  '/invoices': r('invoices', 'erp_finance_inventory'),
  '/products': r('products', 'erp_finance_inventory'),
  '/suppliers': r('suppliers', 'erp_finance_inventory'),
  '/inventory': r('inventory', 'erp_finance_inventory'),
  '/purchase-orders': r('purchase_orders', 'erp_finance_inventory'),

  // ===== Informational =====
  '/about-erp': r('about_erp', 'settings'),
};

/** Normalise a path or href (strips query/hash and trailing slash). */
export function normalizeRoutePathname(pathOrHref: string): string {
  const raw = String(pathOrHref || '/').split('?')[0].split('#')[0] || '/';
  if (raw.length > 1 && raw.endsWith('/')) return raw.slice(0, -1);
  return raw;
}

/** Resolve the gating rule for a path, including dynamic sub-paths. */
export function resolveRouteAccessRule(pathOrHref: string): RouteAccessRule | undefined {
  const path = normalizeRoutePathname(pathOrHref);
  const direct = ROUTE_ACCESS_RULES[path];
  if (direct) return direct;
  if (path.startsWith('/marketing/surveys/')) return ROUTE_ACCESS_RULES['/marketing/surveys'];
  if (path.startsWith('/marketing/ai-space/')) return ROUTE_ACCESS_RULES['/marketing/ai-training'];
  if (path.startsWith('/ai-space/') || path.startsWith('/chat/')) {
    return ROUTE_ACCESS_RULES['/marketing/ai-training'];
  }
  return undefined;
}

/** Evaluate a rule through entitlement + RBAC + screen_access (no role strings). */
export function canAccessRouteRule(rule: RouteAccessRule | undefined, api: RouteGateApi): boolean {
  if (!rule) return false;
  if (rule.requiresEducation && !api.educationAddon) return false;
  if (rule.ownerRecovery && api.isTenantOwner) return true;
  return (
    api.hasModule(rule.moduleKey) &&
    api.can(rule.moduleKey, 'view') &&
    api.canScreen(rule.screenKey)
  );
}

export function canAccessRoutePath(pathOrHref: string, api: RouteGateApi): boolean {
  return canAccessRouteRule(resolveRouteAccessRule(pathOrHref), api);
}
