import type { SaasPackageCode } from '../../autodataTypes';
export type { SaasPackageCode };

export type IndustryPresetKey =
  | 'general'
  | 'real_estate'
  | 'retail'
  | 'healthcare'
  | 'manufacturing'
  | 'agency'
  | 'fnb'
  | 'education';

export type DataScopeKey =
  | 'none'
  | 'own'
  | 'team'
  | 'department'
  | 'sub_departments'
  | 'branch'
  | 'company';

export type RbacActionKey =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'assign'
  | 'export'
  | 'import'
  | 'unmask_phone'
  | 'view_financials'
  | 'manage_config';

export interface TerminologyDictionary {
  customerLabel: string;
  customerPluralLabel: string;
  projectLabel: string;
  campaignLabel: string;
  dealLabel: string;
  productLabel: string;
  consultantLabel: string;
  orderLabel: string;
  quoteLabel: string;
  departmentLabel: string;
  customer_singular: string;
  customer_plural: string;
  project_singular: string;
  campaign_singular: string;
  deal_singular: string;
  consultant_singular: string;
  product_singular: string;
  order_singular: string;
  quote_singular: string;
  [key: string]: string;
}

export interface PackageCatalogMeta {
  code: SaasPackageCode;
  stepOrder: number;
  shortName: string;
  name: string;
  badge: string;
  tagline: string;
  priceLabel?: string;
  monthlyPriceVnd: number;
  annualMonthlyEquivalentVnd: number;
  accentColor: string;
  highlights: string[];
  defaultModules: string[];
}

export const DATA_SCOPES_CATALOG: ReadonlyArray<{
  key: DataScopeKey;
  label: string;
  shortLabel: string;
  rank: number;
  description: string;
}> = [
  { key: 'none', label: 'Không truy cập (None)', shortLabel: 'Khóa', rank: 0, description: 'Ẩn hoàn toàn dữ liệu phân hệ này' },
  { key: 'own', label: 'Cá nhân phụ trách (Own)', shortLabel: 'Cá nhân', rank: 1, description: 'Chỉ xem bản ghi do chính mình tạo hoặc phụ trách' },
  { key: 'team', label: 'Trong Tổ / Nhóm (Team)', shortLabel: 'Nhóm', rank: 2, description: 'Xem dữ liệu của các thành viên cùng Team' },
  { key: 'department', label: 'Trong Phòng ban (Department)', shortLabel: 'Phòng ban', rank: 3, description: 'Xem dữ liệu thuộc phòng ban trực tiếp' },
  { key: 'sub_departments', label: 'Phòng ban & Cấp dưới (Sub-Depts)', shortLabel: 'Khối / Cấp dưới', rank: 4, description: 'Bao gồm phòng ban hiện tại và các phòng trực thuộc' },
  { key: 'branch', label: 'Toàn Chi nhánh (Branch)', shortLabel: 'Chi nhánh', rank: 5, description: 'Toàn bộ dữ liệu trong cùng pháp nhân / chi nhánh' },
  { key: 'company', label: 'Toàn Doanh nghiệp (Company)', shortLabel: 'Toàn công ty', rank: 6, description: 'Truy cập xuyên suốt mọi chi nhánh và phòng ban' },
];

export const RBAC_ACTIONS_CATALOG: ReadonlyArray<{
  key: RbacActionKey;
  label: string;
  shortLabel: string;
  sensitive?: boolean;
}> = [
  { key: 'view', label: 'Xem danh sách & chi tiết', shortLabel: 'Xem' },
  { key: 'create', label: 'Tạo mới bản ghi', shortLabel: 'Tạo' },
  { key: 'edit', label: 'Chỉnh sửa thông tin', shortLabel: 'Sửa' },
  { key: 'delete', label: 'Xóa / Lưu trữ', shortLabel: 'Xóa', sensitive: true },
  { key: 'approve', label: 'Phê duyệt đề xuất / chứng từ', shortLabel: 'Duyệt' },
  { key: 'assign', label: 'Chia số / Chuyển người phụ trách', shortLabel: 'Chia số' },
  { key: 'export', label: 'Xuất file Excel / CSV', shortLabel: 'Xuất file', sensitive: true },
  { key: 'import', label: 'Nhập dữ liệu hàng loạt', shortLabel: 'Nhập file' },
  { key: 'unmask_phone', label: 'Xem SĐT / Email gốc (Không che)', shortLabel: 'Mở che SĐT', sensitive: true },
  { key: 'view_financials', label: 'Xem Giá vốn / Lương / Hoa hồng', shortLabel: 'Tài chính mật', sensitive: true },
  { key: 'manage_config', label: 'Cấu hình quy tắc phân hệ', shortLabel: 'Cấu hình', sensitive: true },
];

export const RBAC_MODULES_CATALOG: ReadonlyArray<{
  key: string;
  label: string;
  suite: 'crm' | 'marketing' | 'growth' | 'erp' | 'core';
}> = [
  { key: 'leads', label: 'Khách hàng 360° & Data CRM', suite: 'crm' },
  { key: 'rounds', label: 'Vòng chia Sale & Định tuyến', suite: 'crm' },
  { key: 'tickets_data', label: 'Ticket Báo lỗi & Bù số', suite: 'crm' },
  { key: 'ads_capi', label: 'Hiệu quả Quảng cáo & Meta CAPI', suite: 'crm' },
  { key: 'deals', label: 'Cơ hội Bán hàng (Deals Kanban)', suite: 'crm' },
  { key: 'companies', label: 'Doanh nghiệp & Đối tác B2B', suite: 'crm' },
  { key: 'settings', label: 'Cấu hình Hệ thống & Từ điển', suite: 'core' },
  { key: 'users', label: 'Tài khoản, Tổ chức & Phân quyền RBAC', suite: 'core' },
  { key: 'billing', label: 'Gói cước SaaS & Ví thanh toán', suite: 'core' },
  { key: 'audiences', label: 'Tệp Data & Tệp Logic', suite: 'marketing' },
  { key: 'email_templates', label: 'Email Editor & Kho Mẫu', suite: 'marketing' },
  { key: 'forms_triggers', label: 'Form Builder, Form Cards & OTP', suite: 'marketing' },
  { key: 'surveys_quiz', label: 'Khảo sát & Trắc nghiệm (Survey/Quiz)', suite: 'marketing' },
  { key: 'campaigns', label: 'Chiến dịch Email & Zalo ZNS', suite: 'marketing' },
  { key: 'automation_flows', label: 'Automation Flow Visual Builder', suite: 'marketing' },
  { key: 'vouchers_qr', label: 'Voucher, Shortlink & QR Designer', suite: 'marketing' },
  { key: 'web_tracking', label: 'Web Tracking & Bản đồ nhiệt Heatmap', suite: 'marketing' },
  { key: 'social_bot', label: 'Social Bot (Messenger & Zalo OA)', suite: 'marketing' },
  { key: 'ai_bot_studio', label: 'Customer AI Bot Studio (RAG)', suite: 'marketing' },
  { key: 'growth_attribution', label: 'Báo cáo Doanh thu & ROAS Xuyên phễu', suite: 'growth' },
  { key: 'erp_hrm_org', label: 'Nhân sự, Hồ sơ & Hợp đồng', suite: 'erp' },
  { key: 'erp_attendance', label: 'Chấm công GPS/Selfie & Ca trực', suite: 'erp' },
  { key: 'erp_payroll', label: 'Bảng lương, Thuế TNCN & Hoa hồng', suite: 'erp' },
  { key: 'erp_approvals', label: 'Trung tâm Phê duyệt Đa cấp', suite: 'erp' },
  { key: 'erp_projects_tasks', label: 'Dự án Kanban/Gantt & Helpdesk', suite: 'erp' },
  { key: 'erp_workchat', label: 'WorkChat Nội bộ & Bảng tin Feed', suite: 'erp' },
  { key: 'erp_finance_inventory', label: 'Tài chính, Báo giá, SO/PO & Kho FIFO', suite: 'erp' },
  { key: 'erp_cloud_ocr', label: 'Tài liệu Cloud & AI OCR', suite: 'erp' },
  { key: 'dom_agent', label: 'Hội đồng Trợ lý AI DOM Agent', suite: 'erp' },
  { key: 'education_addon', label: 'Đào tạo & Quản lý Học vụ (Add-on)', suite: 'erp' },
];

export interface ScreenAccessDescriptor {
  screenKey: string;
  path: string;
  label: string;
  moduleKey: string;
  group: 'crm' | 'marketing' | 'growth' | 'erp' | 'core';
}

export const SCREEN_ACCESS_CATALOG: ReadonlyArray<ScreenAccessDescriptor> = [
  { screenKey: 'dashboard', path: '/', label: 'Dashboard Tổng quan', moduleKey: 'crm_dashboard', group: 'crm' },
  { screenKey: 'sale_portal', path: '/sale-portal', label: 'Cổng Sale Portal', moduleKey: 'sale_portal', group: 'crm' },
  { screenKey: 'data_list', path: '/data', label: 'Quản lý Data & Lịch hẹn', moduleKey: 'leads', group: 'crm' },
  { screenKey: 'calendar', path: '/calendar', label: 'Lịch hẹn & Sự kiện', moduleKey: 'leads', group: 'crm' },
  { screenKey: 'contacts', path: '/contacts', label: 'Khách hàng 360° (Contacts)', moduleKey: 'leads', group: 'crm' },
  { screenKey: 'deals', path: '/deals', label: 'Pipeline Deals Kanban', moduleKey: 'deals', group: 'crm' },
  { screenKey: 'companies', path: '/companies', label: 'Doanh nghiệp B2B (Companies)', moduleKey: 'companies', group: 'crm' },
  { screenKey: 'activities', path: '/activities', label: 'Hoạt động & Nhắc việc', moduleKey: 'leads', group: 'crm' },
  { screenKey: 'ads_performance', path: '/ads-performance', label: 'Hiệu suất Ads & Meta CAPI', moduleKey: 'ads_capi', group: 'crm' },
  { screenKey: 'tickets', path: '/tickets', label: 'Ticket Lỗi Data', moduleKey: 'tickets_data', group: 'crm' },
  { screenKey: 'gatekeeper', path: '/gatekeeper', label: 'AI Pre-screener Gatekeeper', moduleKey: 'gatekeeper', group: 'crm' },
  { screenKey: 'rounds', path: '/rounds', label: 'Vòng phân bổ Sale', moduleKey: 'rounds', group: 'crm' },
  { screenKey: 'fair_share', path: '/fair-share', label: 'Đối soát Công bằng (Fair-Share)', moduleKey: 'fair_share', group: 'crm' },
  { screenKey: 'routing_rules', path: '/rules', label: 'Logic xử lý & Định tuyến', moduleKey: 'routing_rules', group: 'crm' },
  { screenKey: 'consultants', path: '/consultants', label: 'Nhân sự Sale & Đại lý', moduleKey: 'consultants', group: 'crm' },
  { screenKey: 'integrations', path: '/integrations', label: 'Tích hợp Webhook, Sheet & Bot', moduleKey: 'integrations_autodata', group: 'crm' },
  { screenKey: 'mkt_dashboard', path: '/marketing-dashboard', label: 'Dashboard Marketing', moduleKey: 'mkt_dashboard', group: 'marketing' },
  { screenKey: 'audiences', path: '/audiences', label: 'Tệp Data & Tệp Logic', moduleKey: 'audiences', group: 'marketing' },
  { screenKey: 'mkt_templates', path: '/marketing/templates', label: 'Email Templates Editor', moduleKey: 'email_templates', group: 'marketing' },
  { screenKey: 'mkt_forms', path: '/marketing/forms', label: 'Form Builder & OTP', moduleKey: 'forms_triggers', group: 'marketing' },
  { screenKey: 'mkt_surveys', path: '/marketing/surveys', label: 'Surveys & Quiz', moduleKey: 'surveys_quiz', group: 'marketing' },
  { screenKey: 'mkt_campaigns', path: '/marketing/campaigns', label: 'Chiến dịch Email / ZNS', moduleKey: 'campaigns', group: 'marketing' },
  { screenKey: 'mkt_flows', path: '/marketing/flows', label: 'Automation Flows', moduleKey: 'automation_flows', group: 'marketing' },
  { screenKey: 'mkt_vouchers', path: '/marketing/vouchers', label: 'Voucher & QR Designer', moduleKey: 'vouchers_qr', group: 'marketing' },
  { screenKey: 'mkt_web_tracking', path: '/marketing/web-tracking', label: 'Web Tracking & Heatmap', moduleKey: 'web_tracking', group: 'marketing' },
  { screenKey: 'mkt_social_bot', path: '/marketing/social-bot', label: 'Social Bot & AI Inbox', moduleKey: 'social_bot', group: 'marketing' },
  { screenKey: 'marketing_connect', path: '/marketing-connect', label: 'Kênh gửi SES / ZNS / SDK', moduleKey: 'integrations_marketing', group: 'marketing' },
  { screenKey: 'growth_attribution', path: '/growth-attribution', label: 'Doanh thu & ROAS Xuyên phễu', moduleKey: 'growth_attribution', group: 'growth' },
  { screenKey: 'workspace', path: '/workspace', label: 'Bàn làm việc Cá nhân', moduleKey: 'erp_projects_tasks', group: 'erp' },
  { screenKey: 'feed', path: '/feed', label: 'Bảng tin Nội bộ (Feed)', moduleKey: 'erp_workchat', group: 'erp' },
  { screenKey: 'support_tickets', path: '/support-tickets', label: 'Helpdesk CSKH (SLA)', moduleKey: 'erp_projects_tasks', group: 'erp' },
  { screenKey: 'dom_agent', path: '/dom-agent', label: 'Hội đồng DOM Agent AI', moduleKey: 'dom_agent', group: 'erp' },
  { screenKey: 'erp_hrm', path: '/erp/hrm', label: 'Nhân sự HRM & Hợp đồng', moduleKey: 'erp_hrm_org', group: 'erp' },
  { screenKey: 'erp_attendance', path: '/erp/attendance', label: 'Chấm công GPS / Selfie', moduleKey: 'erp_attendance', group: 'erp' },
  { screenKey: 'erp_payroll', path: '/erp/payroll', label: 'Bảng lương & Thuế TNCN', moduleKey: 'erp_payroll', group: 'erp' },
  { screenKey: 'my_payslips', path: '/my-payslips', label: 'Phiếu lương Cá nhân', moduleKey: 'erp_payroll', group: 'erp' },
  { screenKey: 'cooperation_slips', path: '/cooperation-slips', label: 'Phiếu Hợp tác Hoa hồng', moduleKey: 'erp_payroll', group: 'erp' },
  { screenKey: 'erp_approvals', path: '/erp/approvals', label: 'Trung tâm Phê duyệt Đa cấp', moduleKey: 'erp_approvals', group: 'erp' },
  { screenKey: 'erp_projects', path: '/erp/projects', label: 'Dự án Kanban & Gantt', moduleKey: 'erp_projects_tasks', group: 'erp' },
  { screenKey: 'erp_workchat', path: '/erp/workchat', label: 'WorkChat Doanh nghiệp', moduleKey: 'erp_workchat', group: 'erp' },
  { screenKey: 'erp_finance', path: '/erp/finance', label: 'Tài chính & Vận hành Thương mại', moduleKey: 'erp_finance_inventory', group: 'erp' },
  { screenKey: 'quotes', path: '/quotes', label: 'Báo giá (Quotes)', moduleKey: 'erp_finance_inventory', group: 'erp' },
  { screenKey: 'sales_orders', path: '/sales-orders', label: 'Đơn bán hàng (Sales Orders)', moduleKey: 'erp_finance_inventory', group: 'erp' },
  { screenKey: 'deposits', path: '/deposits', label: 'Đặt cọc & Thu tiền (Deposits)', moduleKey: 'erp_finance_inventory', group: 'erp' },
  { screenKey: 'expenses', path: '/expenses', label: 'Chi phí & Tạm ứng (Expenses)', moduleKey: 'erp_finance_inventory', group: 'erp' },
  { screenKey: 'cash_flow', path: '/cash-flow', label: 'Dòng tiền (Cash Flow)', moduleKey: 'erp_finance_inventory', group: 'erp' },
  { screenKey: 'accounting_az', path: '/accounting-az', label: 'Kế toán & Thuế A-Z', moduleKey: 'erp_finance_inventory', group: 'erp' },
  { screenKey: 'invoices', path: '/invoices', label: 'Hóa đơn & Công nợ', moduleKey: 'erp_finance_inventory', group: 'erp' },
  { screenKey: 'products', path: '/products', label: 'Sản phẩm / Dịch vụ (SKU)', moduleKey: 'erp_finance_inventory', group: 'erp' },
  { screenKey: 'suppliers', path: '/suppliers', label: 'Nhà cung cấp (Suppliers)', moduleKey: 'erp_finance_inventory', group: 'erp' },
  { screenKey: 'inventory', path: '/inventory', label: 'Kho vận FIFO & Vật tư', moduleKey: 'erp_finance_inventory', group: 'erp' },
  { screenKey: 'purchase_orders', path: '/purchase-orders', label: 'Đơn mua hàng (Purchase Orders)', moduleKey: 'erp_finance_inventory', group: 'erp' },
  { screenKey: 'erp_cloud_files', path: '/erp/cloud-files', label: 'Tài liệu Cloud & AI OCR', moduleKey: 'erp_cloud_ocr', group: 'erp' },
  { screenKey: 'erp_education', path: '/erp/education', label: 'Đào tạo & Học vụ (Add-on)', moduleKey: 'education_addon', group: 'erp' },
  { screenKey: 'account', path: '/account', label: 'Tài khoản Cá nhân & 2FA', moduleKey: 'settings', group: 'core' },
  { screenKey: 'accounts', path: '/accounts', label: 'Quản lý Tài khoản & Nhân viên', moduleKey: 'users', group: 'core' },
  { screenKey: 'settings', path: '/settings', label: 'Cài đặt Hệ thống (10 Nhóm)', moduleKey: 'settings', group: 'core' },
  { screenKey: 'report_data', path: '/report-data', label: 'Báo lỗi Data Nhanh', moduleKey: 'tickets_data', group: 'crm' },
];

export const QUICK_ACTIONS_CATALOG: ReadonlyArray<{
  key: string;
  label: string;
  moduleKey: string;
  requiredAction: RbacActionKey;
}> = [
  { key: 'quick_add_lead', label: 'Thêm Data / Lead Nhanh', moduleKey: 'leads', requiredAction: 'create' },
  { key: 'create_audience', label: 'Tạo Tệp Data / Tệp Logic', moduleKey: 'audiences', requiredAction: 'create' },
  { key: 'create_deal', label: 'Tạo Cơ hội / Deal mới', moduleKey: 'deals', requiredAction: 'create' },
  { key: 'create_task', label: 'Giao Công việc / Task mới', moduleKey: 'erp_projects_tasks', requiredAction: 'create' },
  { key: 'create_approval', label: 'Gửi Đề xuất Phê duyệt', moduleKey: 'erp_approvals', requiredAction: 'create' },
  { key: 'create_expense', label: 'Lập Phiếu chi / Tạm ứng', moduleKey: 'erp_finance_inventory', requiredAction: 'create' },
  { key: 'create_deposit', label: 'Lập Phiếu Đặt cọc / POS', moduleKey: 'erp_finance_inventory', requiredAction: 'create' },
  { key: 'open_workchat', label: 'Mở WorkChat Nhanh', moduleKey: 'erp_workchat', requiredAction: 'view' },
  { key: 'open_qr_call', label: 'Quét QR Gọi điện Nhanh', moduleKey: 'leads', requiredAction: 'view' },
];

const CRM_MODULES = [
  'crm_dashboard',
  'leads',
  'deals',
  'companies',
  'activities',
  'pipelines',
  'rounds',
  'fair_share',
  'routing_rules',
  'gatekeeper',
  'tickets_data',
  'ads_capi',
  'consultants',
  'sale_portal',
  'appointments',
  'integrations_autodata',
  'dom_sales_copilot',
  'settings',
  'users',
  'org_rbac',
  'billing',
];

const MARKETING_MODULES = [
  'mkt_dashboard',
  'audiences',
  'email_templates',
  'forms_triggers',
  'surveys_quiz',
  'campaigns',
  'automation_flows',
  'vouchers_qr',
  'web_tracking',
  'social_bot',
  'ai_bot_studio',
  'integrations_marketing',
  'dom_marketing_copilot',
  'settings',
  'users',
  'org_rbac',
  'billing',
];

const GROWTH_MODULES = Array.from(
  new Set([
    ...CRM_MODULES,
    ...MARKETING_MODULES,
    'growth_attribution',
    'integrations_unified',
  ])
);

const ERP_PROMAX_MODULES = Array.from(
  new Set([
    ...GROWTH_MODULES,
    'workspace_personal',
    'crm_b2b',
    'enterprise_feed',
    'helpdesk',
    'quotes_orders',
    'inventory_assets',
    'reports_bi',
    'erp_hrm_org',
    'erp_attendance',
    'erp_payroll',
    'erp_approvals',
    'erp_projects_tasks',
    'erp_workchat',
    'erp_finance_inventory',
    'erp_cloud_ocr',
    'dom_agent',
  ])
);

export const SAAS_PACKAGES_CATALOG: Record<SaasPackageCode, PackageCatalogMeta> = {
  autodata_crm: {
    code: 'autodata_crm',
    stepOrder: 1,
    shortName: 'Gói 1 • Auto Data & CRM',
    name: 'Auto Data & CRM',
    badge: 'Chia Số Sale Tức Thì',
    tagline: 'Chia Lead công bằng theo giây, quản lý phễu Sale, AI Gatekeeper & Meta CAPI v21.0.',
    priceLabel: '1.500.000đ / tháng',
    monthlyPriceVnd: 1_500_000,
    annualMonthlyEquivalentVnd: 1_275_000,
    accentColor: '#1E40FF',
    highlights: [
      'Vòng chia Fair-Share, Trọng số & Bù số Ticket tự động',
      'AI Pre-screener lọc rác đầu vào & Cổng trực Sale Portal',
      'Kết nối Webhook, Google Sheets 2 chiều, ZaloBot & Meta CAPI',
      'Phễu CRM Pipeline động & bảo mật che SĐT ngay từ Server',
    ],
    defaultModules: CRM_MODULES,
  },
  marketing_standalone: {
    code: 'marketing_standalone',
    stepOrder: 2,
    shortName: 'Gói 2 • Marketing Standalone',
    name: 'Marketing Automation Standalone',
    badge: 'Nuôi Dưỡng Đa Kênh',
    tagline: 'Thu thập Lead qua Form Card, phân Tệp Data / Tệp Logic, gửi Email/ZNS & Flow tự động.',
    priceLabel: '2.200.000đ / tháng',
    monthlyPriceVnd: 2_200_000,
    annualMonthlyEquivalentVnd: 1_870_000,
    accentColor: '#0284C7',
    highlights: [
      'Quản trị Tệp Data (CSV/Form) & Tệp Logic (AND/OR Real-time)',
      'Email Editor 15 khối kéo-thả, Form Cards, Survey/Quiz 25 khối',
      'Automation Flow Visual Canvas, Chiến dịch Email/ZNS & Voucher QR',
      'Kết nối riêng AWS SES / SMTP, DKIM/SPF, Zalo OA/ZNS & Web Tracking',
    ],
    defaultModules: MARKETING_MODULES,
  },
  growth_combo: {
    code: 'growth_combo',
    stepOrder: 3,
    shortName: 'Gói 3 • Growth Suite Combo',
    name: 'Growth Suite (CRM + Marketing)',
    badge: 'Khép Kín Doanh Thu',
    tagline: 'Hợp nhất 100% Gói 1 + Gói 2: Quảng cáo/Form -> Nuôi dưỡng -> Chia Sale -> Đo ROAS thực.',
    priceLabel: '3.200.000đ / tháng',
    monthlyPriceVnd: 3_200_000,
    annualMonthlyEquivalentVnd: 2_720_000,
    accentColor: '#4F46E5',
    highlights: [
      'Mở khóa trọn vẹn Auto Data & CRM + Marketing Automation trên 1 Hồ sơ 360°',
      'Tự động đẩy khách đạt ngưỡng nóng từ Tệp Logic / Flow vào Vòng chia Sale',
      'Lưu bộ lọc CRM thành Tệp Data nuôi dưỡng lại khách chưa chốt (Re-engagement)',
      'Unified Growth & Revenue Attribution: đo ROAS thực tế từng Email/Form/Ads',
    ],
    defaultModules: GROWTH_MODULES,
  },
  domation_promax: {
    code: 'domation_promax',
    stepOrder: 4,
    shortName: 'Gói 4 • DOMATION PROMAX',
    name: 'DOMATION PROMAX — Full Suite ERP',
    badge: 'Hệ Sinh Thái Toàn Diện',
    tagline: 'Quản trị toàn diện Doanh nghiệp: Growth Suite + 9 Cụm ERP Nội bộ + Hội đồng DOM Agent.',
    priceLabel: '6.000.000đ / tháng',
    monthlyPriceVnd: 6_000_000,
    annualMonthlyEquivalentVnd: 5_100_000,
    accentColor: '#0F172A',
    highlights: [
      'Bao gồm toàn bộ Growth Suite (CRM + Auto Data + Marketing Automation)',
      'Nhân sự HRM, Sơ đồ tổ chức, Chấm công GPS/Selfie & Bảng lương/Thuế A-Z',
      'Động cơ Phê duyệt N cấp động, Dự án Kanban/Gantt, WorkChat & Tài liệu OCR',
      'Tài chính, Báo giá, SO/PO, Kho FIFO, Tài sản & Hội đồng AI DOM Agent',
    ],
    defaultModules: ERP_PROMAX_MODULES,
  },
};

export const PACKAGE_CATALOG = SAAS_PACKAGES_CATALOG;

function makeDictionary(input: {
  customerLabel: string;
  customerPluralLabel: string;
  projectLabel: string;
  campaignLabel: string;
  dealLabel: string;
  productLabel: string;
  consultantLabel: string;
  orderLabel: string;
  quoteLabel: string;
  departmentLabel?: string;
}): TerminologyDictionary {
  const dept = input.departmentLabel || 'Phòng ban';
  return {
    customerLabel: input.customerLabel,
    customerPluralLabel: input.customerPluralLabel,
    projectLabel: input.projectLabel,
    campaignLabel: input.campaignLabel,
    dealLabel: input.dealLabel,
    productLabel: input.productLabel,
    consultantLabel: input.consultantLabel,
    orderLabel: input.orderLabel,
    quoteLabel: input.quoteLabel,
    departmentLabel: dept,
    customer_singular: input.customerLabel,
    customer_plural: input.customerPluralLabel,
    project_singular: input.projectLabel,
    campaign_singular: input.campaignLabel,
    deal_singular: input.dealLabel,
    consultant_singular: input.consultantLabel,
    product_singular: input.productLabel,
    order_singular: input.orderLabel,
    quote_singular: input.quoteLabel,
  };
}

export const INDUSTRY_PRESETS: Record<
  IndustryPresetKey,
  {
    key: IndustryPresetKey;
    name: string;
    subtitle: string;
    dictionary: TerminologyDictionary;
  }
> = {
  general: {
    key: 'general',
    name: 'Đa ngành Chuẩn B2B/B2C',
    subtitle: 'Thuật ngữ thương mại trung lập cho mọi loại hình doanh nghiệp',
    dictionary: makeDictionary({
      customerLabel: 'Khách hàng',
      customerPluralLabel: 'Danh sách Khách hàng',
      projectLabel: 'Dự án',
      campaignLabel: 'Chiến dịch',
      dealLabel: 'Cơ hội / Giao dịch',
      productLabel: 'Sản phẩm / Dịch vụ',
      consultantLabel: 'Chuyên viên tư vấn',
      orderLabel: 'Đơn bán hàng',
      quoteLabel: 'Báo giá',
    }),
  },
  real_estate: {
    key: 'real_estate',
    name: 'Bất động sản (CĐT & Sàn F1)',
    subtitle: 'Tối ưu cho Chủ đầu tư, Sàn phân phối F1, Giỏ hàng & Booking giữ chỗ',
    dictionary: makeDictionary({
      customerLabel: 'Khách mua / Nhà đầu tư',
      customerPluralLabel: 'Khách mua & Nhà đầu tư',
      projectLabel: 'Dự án BĐS',
      campaignLabel: 'Giỏ hàng / Đợt mở bán',
      dealLabel: 'Giao dịch / Booking',
      productLabel: 'Căn hộ / Sản phẩm',
      consultantLabel: 'Chuyên viên Sàn / F1',
      orderLabel: 'Phiếu Đặt cọc / HĐMB',
      quoteLabel: 'Bảng tính dòng tiền',
    }),
  },
  retail: {
    key: 'retail',
    name: 'Bán lẻ & Thương mại điện tử',
    subtitle: 'Tối ưu cho chuỗi cửa hàng bán lẻ, D2C, SKU & Chương trình khuyến mãi',
    dictionary: makeDictionary({
      customerLabel: 'Khách mua hàng',
      customerPluralLabel: 'Tệp Người mua',
      projectLabel: 'Dòng sản phẩm',
      campaignLabel: 'Chương trình Khuyến mãi',
      dealLabel: 'Đơn hàng tiềm năng',
      productLabel: 'Sản phẩm SKU',
      consultantLabel: 'Nhân viên Bán hàng',
      orderLabel: 'Đơn bán hàng',
      quoteLabel: 'Báo giá đơn hàng',
    }),
  },
  healthcare: {
    key: 'healthcare',
    name: 'Y tế, Nha khoa & Thẩm mỹ',
    subtitle: 'Tối ưu cho Phòng khám, Nha khoa, Spa công nghệ cao & Liệu trình',
    dictionary: makeDictionary({
      customerLabel: 'Bệnh nhân / Khách hàng',
      customerPluralLabel: 'Hồ sơ Bệnh nhân',
      projectLabel: 'Chuyên khoa / Dịch vụ',
      campaignLabel: 'Gói liệu trình',
      dealLabel: 'Hồ sơ điều trị',
      productLabel: 'Dịch vụ / Liệu trình',
      consultantLabel: 'Bác sĩ / Tư vấn viên',
      orderLabel: 'Phiếu thu dịch vụ',
      quoteLabel: 'Phác đồ & Chi phí',
    }),
  },
  manufacturing: {
    key: 'manufacturing',
    name: 'Sản xuất & Phân phối B2B',
    subtitle: 'Tối ưu cho Nhà máy, Đại lý cấp 1-2, Hợp đồng khung & Đơn sỉ PO/SO',
    dictionary: makeDictionary({
      customerLabel: 'Đại lý / Đối tác',
      customerPluralLabel: 'Hệ thống Đại lý & Đối tác',
      projectLabel: 'Hợp đồng khung',
      campaignLabel: 'Đợt chào hàng',
      dealLabel: 'Đơn sỉ B2B',
      productLabel: 'Vật tư / Thành phẩm',
      consultantLabel: 'Kinh doanh B2B',
      orderLabel: 'Đơn đặt hàng SO/PO',
      quoteLabel: 'Báo giá sỉ',
    }),
  },
  agency: {
    key: 'agency',
    name: 'Agency & Dịch vụ Chuyên nghiệp',
    subtitle: 'Tối ưu cho Marketing/IT Agency, Tư vấn doanh nghiệp & Hợp đồng Retainer',
    dictionary: makeDictionary({
      customerLabel: 'Client',
      customerPluralLabel: 'Danh sách Clients',
      projectLabel: 'Dự án / Retainer',
      campaignLabel: 'Chiến dịch Marketing',
      dealLabel: 'Hợp đồng dịch vụ',
      productLabel: 'Gói giải pháp',
      consultantLabel: 'Account Manager',
      orderLabel: 'Service Order',
      quoteLabel: 'Proposal / Báo giá',
    }),
  },
  fnb: {
    key: 'fnb',
    name: 'F&B & Chuỗi Nhượng quyền',
    subtitle: 'Tối ưu cho Nhà hàng, Cafe, Hội viên tích điểm & Ưu đãi Voucher',
    dictionary: makeDictionary({
      customerLabel: 'Thực khách / Hội viên',
      customerPluralLabel: 'Hội viên Thực khách',
      projectLabel: 'Thương hiệu / Chi nhánh',
      campaignLabel: 'Ưu đãi Voucher',
      dealLabel: 'Đặt tiệc / Nhượng quyền',
      productLabel: 'Menu / Combo',
      consultantLabel: 'Quản lý Cửa hàng',
      orderLabel: 'Hóa đơn POS / Đặt tiệc',
      quoteLabel: 'Báo giá Sự kiện',
    }),
  },
  education: {
    key: 'education',
    name: 'Giáo dục & Đào tạo (Add-on)',
    subtitle: 'Mở nhãn Học viên / Khóa học & có thể bật thêm phân hệ Học vụ chuyên sâu',
    dictionary: makeDictionary({
      customerLabel: 'Học viên',
      customerPluralLabel: 'Danh sách Học viên',
      projectLabel: 'Chương trình đào tạo',
      campaignLabel: 'Khóa học / Đợt tuyển sinh',
      dealLabel: 'Hồ sơ nhập học',
      productLabel: 'Khóa học / Học phần',
      consultantLabel: 'Tư vấn tuyển sinh',
      orderLabel: 'Phiếu thu học phí',
      quoteLabel: 'Thông báo học phí',
    }),
  },
};

export function normalizePackageCode(
  rawPackage?: string | null,
  rawPlanTier?: string | null,
  rawPlanCode?: string | null
): SaasPackageCode {
  const candidates = [rawPackage, rawPlanTier, rawPlanCode]
    .map((v) => String(v || '').trim().toLowerCase())
    .filter(Boolean);

  for (const c of candidates) {
    if (
      c === 'autodata_crm' ||
      c === 'marketing_standalone' ||
      c === 'growth_combo' ||
      c === 'domation_promax'
    ) {
      return c;
    }
    if (c === 'domation_crm_erp' || c === 'enterprise' || c === 'promax') {
      return 'domation_promax';
    }
    if (c === 'marketing' || c === 'mkt_standalone') {
      return 'marketing_standalone';
    }
    if (c === 'combo' || c === 'growth_suite') {
      return 'growth_combo';
    }
  }
  return 'autodata_crm';
}

export function normalizeIndustryKey(raw?: string | null): IndustryPresetKey {
  const key = String(raw || '').trim().toLowerCase();
  if (key in INDUSTRY_PRESETS) {
    return key as IndustryPresetKey;
  }
  if (key.includes('bất động sản') || key.includes('bds') || key.includes('real')) return 'real_estate';
  if (key.includes('y tế') || key.includes('nha khoa') || key.includes('spa')) return 'healthcare';
  if (key.includes('bán lẻ') || key.includes('ecommerce')) return 'retail';
  if (key.includes('sản xuất')) return 'manufacturing';
  if (key.includes('agency')) return 'agency';
  if (key.includes('f&b') || key.includes('nhà hàng')) return 'fnb';
  if (key.includes('giáo dục') || key.includes('đào tạo')) return 'education';
  return 'general';
}

export function buildResolvedTerminology(
  industryKey: IndustryPresetKey,
  overrides?: Record<string, unknown> | null
): TerminologyDictionary {
  const base = INDUSTRY_PRESETS[industryKey]?.dictionary || INDUSTRY_PRESETS.general.dictionary;
  const raw = overrides && typeof overrides === 'object' ? overrides : {};
  const strOverrides: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string' && v.trim()) {
      strOverrides[k] = v.trim();
    }
  }

  const customerLabel =
    strOverrides.customerLabel || strOverrides.customer_singular || base.customerLabel;
  const customerPluralLabel =
    strOverrides.customerPluralLabel || strOverrides.customer_plural || base.customerPluralLabel;
  const projectLabel =
    strOverrides.projectLabel || strOverrides.project_singular || base.projectLabel;
  const campaignLabel =
    strOverrides.campaignLabel || strOverrides.campaign_singular || base.campaignLabel;
  const dealLabel =
    strOverrides.dealLabel || strOverrides.deal_singular || base.dealLabel;
  const productLabel =
    strOverrides.productLabel || strOverrides.product_singular || base.productLabel;
  const consultantLabel =
    strOverrides.consultantLabel || strOverrides.consultant_singular || base.consultantLabel;
  const orderLabel =
    strOverrides.orderLabel || strOverrides.order_singular || base.orderLabel;
  const quoteLabel =
    strOverrides.quoteLabel || strOverrides.quote_singular || base.quoteLabel;
  const departmentLabel =
    strOverrides.departmentLabel || strOverrides.department_singular || base.departmentLabel;

  return {
    ...base,
    ...strOverrides,
    customerLabel,
    customerPluralLabel,
    projectLabel,
    campaignLabel,
    dealLabel,
    productLabel,
    consultantLabel,
    orderLabel,
    quoteLabel,
    departmentLabel,
    customer_singular: customerLabel,
    customer_plural: customerPluralLabel,
    project_singular: projectLabel,
    campaign_singular: campaignLabel,
    deal_singular: dealLabel,
    consultant_singular: consultantLabel,
    product_singular: productLabel,
    order_singular: orderLabel,
    quote_singular: quoteLabel,
  };
}

export const FRONTEND_TO_BACKEND_MODULE_MAP: Readonly<Record<string, string>> = {
  crm_dashboard: 'dashboard_crm',
  deals: 'pipelines',
  companies: 'crm_b2b',
  activities: 'leads',
  users: 'org_rbac',
  fair_share: 'rounds',
  consultants: 'sale_portal',
  integrations_autodata: 'integrations_crm',
  mkt_dashboard: 'dashboard_marketing',
  email_templates: 'mkt_templates',
  forms_triggers: 'mkt_forms',
  surveys_quiz: 'mkt_surveys',
  campaigns: 'mkt_campaigns',
  automation_flows: 'mkt_flows',
  vouchers_qr: 'mkt_vouchers',
  web_tracking: 'mkt_web_tracking',
  social_bot: 'mkt_social_bot',
  ai_bot_studio: 'mkt_ai_bot',
  growth_attribution: 'revenue_attribution',
  integrations_unified: 'dashboard_growth',
  erp_hrm_org: 'hrm',
  erp_attendance: 'attendance',
  erp_payroll: 'payroll',
  erp_approvals: 'approvals',
  erp_projects_tasks: 'projects',
  erp_workchat: 'workchat',
  erp_finance_inventory: 'finance',
  erp_cloud_ocr: 'cloud_files_ocr',
  education_addon: 'education',
};

export const MODULE_KEY_ALIASES: Readonly<Record<string, readonly string[]>> = {
  crm_dashboard: ['crm_dashboard', 'dashboard_crm'],
  dashboard_crm: ['dashboard_crm', 'crm_dashboard'],
  deals: ['deals', 'pipelines', 'crm_b2b'],
  pipelines: ['pipelines', 'deals'],
  companies: ['companies', 'crm_b2b'],
  activities: ['activities', 'leads', 'workspace_personal'],
  users: ['users', 'org_rbac'],
  org_rbac: ['org_rbac', 'users'],
  rounds: ['rounds', 'fair_share'],
  fair_share: ['fair_share', 'rounds'],
  sale_portal: ['sale_portal', 'consultants'],
  consultants: ['consultants', 'sale_portal'],
  integrations_autodata: ['integrations_autodata', 'integrations_crm'],
  integrations_crm: ['integrations_crm', 'integrations_autodata'],
  mkt_dashboard: ['mkt_dashboard', 'dashboard_marketing'],
  dashboard_marketing: ['dashboard_marketing', 'mkt_dashboard'],
  email_templates: ['email_templates', 'mkt_templates'],
  mkt_templates: ['mkt_templates', 'email_templates'],
  forms_triggers: ['forms_triggers', 'mkt_forms'],
  mkt_forms: ['mkt_forms', 'forms_triggers'],
  surveys_quiz: ['surveys_quiz', 'mkt_surveys'],
  mkt_surveys: ['mkt_surveys', 'surveys_quiz'],
  campaigns: ['campaigns', 'mkt_campaigns'],
  mkt_campaigns: ['mkt_campaigns', 'campaigns'],
  automation_flows: ['automation_flows', 'mkt_flows'],
  mkt_flows: ['mkt_flows', 'automation_flows'],
  vouchers_qr: ['vouchers_qr', 'mkt_vouchers'],
  mkt_vouchers: ['mkt_vouchers', 'vouchers_qr'],
  web_tracking: ['web_tracking', 'mkt_web_tracking'],
  mkt_web_tracking: ['mkt_web_tracking', 'web_tracking'],
  social_bot: ['social_bot', 'mkt_social_bot'],
  mkt_social_bot: ['mkt_social_bot', 'social_bot'],
  ai_bot_studio: ['ai_bot_studio', 'mkt_ai_bot'],
  mkt_ai_bot: ['mkt_ai_bot', 'ai_bot_studio'],
  growth_attribution: ['growth_attribution', 'revenue_attribution', 'dashboard_growth'],
  revenue_attribution: ['revenue_attribution', 'growth_attribution'],
  dashboard_growth: ['dashboard_growth', 'growth_attribution', 'integrations_unified'],
  integrations_unified: ['integrations_unified', 'dashboard_growth'],
  erp_hrm_org: ['erp_hrm_org', 'hrm'],
  hrm: ['hrm', 'erp_hrm_org'],
  erp_attendance: ['erp_attendance', 'attendance'],
  attendance: ['attendance', 'erp_attendance'],
  erp_payroll: ['erp_payroll', 'payroll'],
  payroll: ['payroll', 'erp_payroll'],
  erp_approvals: ['erp_approvals', 'approvals'],
  approvals: ['approvals', 'erp_approvals'],
  erp_projects_tasks: ['erp_projects_tasks', 'projects', 'workspace_personal', 'helpdesk'],
  projects: ['projects', 'erp_projects_tasks'],
  workspace_personal: ['workspace_personal', 'erp_projects_tasks'],
  helpdesk: ['helpdesk', 'erp_projects_tasks'],
  erp_workchat: ['erp_workchat', 'workchat', 'enterprise_feed'],
  workchat: ['workchat', 'erp_workchat'],
  enterprise_feed: ['enterprise_feed', 'erp_workchat'],
  erp_finance_inventory: ['erp_finance_inventory', 'finance', 'quotes_orders', 'inventory_assets', 'crm_b2b', 'reports_bi'],
  finance: ['finance', 'erp_finance_inventory'],
  quotes_orders: ['quotes_orders', 'erp_finance_inventory'],
  inventory_assets: ['inventory_assets', 'erp_finance_inventory'],
  crm_b2b: ['crm_b2b', 'erp_finance_inventory', 'companies'],
  reports_bi: ['reports_bi', 'erp_finance_inventory'],
  erp_cloud_ocr: ['erp_cloud_ocr', 'cloud_files_ocr'],
  cloud_files_ocr: ['cloud_files_ocr', 'erp_cloud_ocr'],
  education_addon: ['education_addon', 'education'],
  education: ['education', 'education_addon'],
};

export function toBackendModuleKey(moduleKey: string): string {
  return FRONTEND_TO_BACKEND_MODULE_MAP[moduleKey] || moduleKey;
}

export function getModuleKeyAliases(moduleKey: string): string[] {
  const aliases = MODULE_KEY_ALIASES[moduleKey];
  if (aliases) {
    return Array.from(new Set([moduleKey, toBackendModuleKey(moduleKey), ...aliases]));
  }
  return Array.from(new Set([moduleKey, toBackendModuleKey(moduleKey)]));
}

export function computeDefaultEnabledModules(
  packageCode: SaasPackageCode,
  educationAddon: boolean
): string[] {
  const base = SAAS_PACKAGES_CATALOG[packageCode]?.defaultModules || SAAS_PACKAGES_CATALOG.autodata_crm.defaultModules;
  if (educationAddon && packageCode === 'domation_promax') {
    return Array.from(new Set([...base, 'education_addon', 'education']));
  }
  return base.filter((m) => (m !== 'education_addon' && m !== 'education') || educationAddon);
}

export function expandEnabledModulesForPackage(
  packageCode: SaasPackageCode,
  educationAddon: boolean,
  rawServerModules?: ReadonlyArray<string> | null
): string[] {
  const defaults = computeDefaultEnabledModules(packageCode, educationAddon);
  const merged = new Set<string>();

  for (const mod of defaults) {
    for (const alias of getModuleKeyAliases(mod)) {
      merged.add(alias);
    }
  }

  if (Array.isArray(rawServerModules)) {
    for (const mod of rawServerModules) {
      if (!mod) continue;
      for (const alias of getModuleKeyAliases(mod)) {
        merged.add(alias);
      }
    }
  }

  if (packageCode === 'autodata_crm') {
    merged.delete('audiences');
  }

  if (!(educationAddon && packageCode === 'domation_promax')) {
    merged.delete('education_addon');
    merged.delete('education');
  } else {
    merged.add('education_addon');
    merged.add('education');
  }

  return Array.from(merged);
}

export function maskPiiPhone(phone?: string | null, canUnmask = false): string {
  if (!phone) return '—';
  if (canUnmask || phone.includes('*')) return phone;
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.length <= 6) return `${digits.slice(0, 2)}****`;
  return `${digits.slice(0, 3)}****${digits.slice(-3)}`;
}

export function maskPiiEmail(email?: string | null, canUnmask = false): string {
  if (!email) return '—';
  if (canUnmask || email.includes('*')) return email;
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 2) return `${local.slice(0, 1)}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export function localPackageOverrideKey(tenantSlug: string): string {
  return `domation_pkg_override_${tenantSlug || 'default'}`;
}
