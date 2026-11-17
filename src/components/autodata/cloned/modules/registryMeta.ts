import React from 'react';
import type { WorkspaceScreenKey } from '../../autodataTypes';

export type FullCloneScreenKey =
  | WorkspaceScreenKey
  | 'workspace'
  | 'contacts'
  | 'deals'
  | 'companies'
  | 'activities'
  | 'calendar'
  | 'feed'
  | 'support_tickets'
  | 'quotes'
  | 'sales_orders'
  | 'deposits'
  | 'expenses'
  | 'cash_flow'
  | 'accounting_az'
  | 'invoices'
  | 'products'
  | 'suppliers'
  | 'inventory'
  | 'purchase_orders'
  | 'my_payslips'
  | 'cooperation_slips'
  | 'account'
  | 'public_booking'
  | 'public_survey'
  | 'public_voucher_claim'
  | 'public_schedule'
  | 'public_api_docs';

export interface EcosystemRouteDescriptor {
  path: string;
  moduleKey: string;
  screenKey: FullCloneScreenKey;
  title: string;
  subtitle: string;
  group: 'crm' | 'marketing' | 'growth' | 'erp' | 'addon' | 'core' | 'public';
  wave: 1 | 2;
  entrySlug?: string;
  highlights?: string[];
  publicRoute?: boolean;
  subViewGlobs?: string[];
  publicPageGlobs?: string[];
  fallbackPath?: string;
}

export const ECOSYSTEM_PLUGIN_ROUTES: ReadonlyArray<EcosystemRouteDescriptor> = [
  // ======================== MARKETING SUITE (WAVE 1 & WAVE 2) ========================
  {
    path: '/audiences',
    moduleKey: 'audiences',
    screenKey: 'audiences',
    title: 'Tệp Data & Tệp Logic Động (Master Audiences)',
    subtitle: 'Quản lý danh sách tĩnh, bộ lọc hành vi động RFM và đồng bộ tệp đa kênh.',
    group: 'marketing',
    wave: 1,
    entrySlug: 'audiences',
    highlights: ['Tệp tĩnh & Tệp Logic', 'Rule Builder đa điều kiện', 'Đồng bộ 1-1 sang CRM'],
  },
  {
    path: '/marketing-connect',
    moduleKey: 'integrations_marketing',
    screenKey: 'marketing_connect',
    title: 'Kết nối Kênh gửi SES, ZNS & Tracking SDK',
    subtitle: 'Cấu hình AWS SES, SMTP doanh nghiệp, Zalo ZNS OA và gắn DOMATION Pixel SDK.',
    group: 'marketing',
    wave: 1,
    entrySlug: 'connect',
    highlights: ['Amazon SES / SMTP', 'Zalo ZNS OA API', 'Tracking SDK Snippet'],
  },
  {
    path: '/marketing-dashboard',
    moduleKey: 'mkt_dashboard',
    screenKey: 'mkt_dashboard',
    title: 'Dashboard Marketing & Phễu chuyển đổi',
    subtitle: 'Theo dõi lượt gửi chiến dịch, tỷ lệ mở Mail/ZNS và chuyển đổi phễu Marketing.',
    group: 'marketing',
    wave: 2,
    entrySlug: 'dashboards',
    highlights: ['Tổng quan Multi-Channel', 'Live Tracking Events', 'Tốc độ tăng trưởng Audience'],
  },
  {
    path: '/marketing/templates',
    moduleKey: 'email_templates',
    screenKey: 'mkt_templates',
    title: 'Email Templates Studio (Block Builder)',
    subtitle: 'Thiết kế email responsive kéo thả MJML, xem trước trên Desktop/Mobile và biến động.',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-templates',
    highlights: ['Drag-and-Drop Blocks', 'Dynamic Lead Tokens', 'Test Send qua SES / SMTP'],
  },
  {
    path: '/marketing/forms',
    moduleKey: 'forms_triggers',
    screenKey: 'mkt_forms',
    title: 'Form Builder, Booking & OTP Triggers',
    subtitle: 'Tạo form thu thập Lead nhúng đa trang, lịch hẹn 1-1 Booking và xác thực OTP.',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-forms',
    highlights: ['Nhúng iframe / Script SDK', 'Đồng bộ trực tiếp CRM', 'Rule Anti-Spam & OTP'],
  },
  {
    path: '/marketing/surveys',
    moduleKey: 'surveys_quiz',
    screenKey: 'mkt_surveys',
    title: 'Surveys, NPS & Interactive Quiz',
    subtitle: 'Khảo sát mức độ hài lòng CSAT/NPS và chấm điểm nhu cầu khách hàng tự động.',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-surveys',
    highlights: ['Conditional Branching', 'Tự động gán Tag Segment', 'Public URL /s/:slug'],
  },
  {
    path: '/marketing/campaigns',
    moduleKey: 'campaigns',
    screenKey: 'mkt_campaigns',
    title: 'Chiến dịch Email, ZNS & SMS Broadcast',
    subtitle: 'Lên lịch gửi hàng loạt theo tệp Audiences, A/B testing tiêu đề và chống nghẽn quota.',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-campaigns',
    highlights: ['Multi-Channel Broadcast', 'Tracking Open / Click / Bounce', 'Bám đuổi tự động'],
  },
  {
    path: '/marketing/flows',
    moduleKey: 'automation_flows',
    screenKey: 'mkt_flows',
    title: 'Automation Flows (Workflow Visual Canvas)',
    subtitle: 'Kịch bản nuôi dưỡng Lead đa bước theo hành vi thực tế: mở mail, click link, đổi stage.',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-flows',
    highlights: ['Trigger -> Condition -> Action', 'Delay & Business Hours', 'Execution Logs'],
  },
  {
    path: '/marketing/vouchers',
    moduleKey: 'vouchers_qr',
    screenKey: 'mkt_vouchers',
    title: 'Voucher & Branded QR Code Designer',
    subtitle: 'Phát hành mã ưu đãi cá nhân hóa, QR gắn logo doanh nghiệp và đối soát đổi mã POS.',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-vouchers',
    highlights: ['Sinh SVG QR Branded', 'Giới hạn lượt sử dụng', 'Trang nhận mã /claim/:id'],
  },
  {
    path: '/marketing/web-tracking',
    moduleKey: 'web_tracking',
    screenKey: 'mkt_web_tracking',
    title: 'Web Tracking, Pixel SDK & Behavior Heatmap',
    subtitle: 'Ghi nhận lượt xem trang, thời gian dừng và chuyển đổi ẩn danh về hồ sơ Contact.',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-web-tracking',
    highlights: ['DOMATION Pixel 1-line', 'Pageview & Custom Events', 'UTM Multi-Touch Log'],
  },
  {
    path: '/marketing/social-bot',
    moduleKey: 'social_bot',
    screenKey: 'mkt_social_bot',
    title: 'Social Bot, Omnichannel AI Inbox & Fanpages',
    subtitle: 'Tập trung hội thoại Facebook Page, Zalo OA và trợ lý AI trực 24/7 chốt lịch hẹn.',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-social-bot',
    highlights: ['Unified Inbox Đa kênh', 'AI Auto-Reply theo RAG', 'Đẩy thẳng vào Gatekeeper'],
  },

  // ======================== GROWTH ATTRIBUTION ========================
  {
    path: '/growth-attribution',
    moduleKey: 'growth_attribution',
    screenKey: 'growth_attribution',
    title: 'Growth & Revenue Attribution',
    subtitle: 'Phân bổ doanh thu đa điểm chạm (First / Linear / Time-Decay) & Meta CAPI ROAS.',
    group: 'growth',
    wave: 2,
    entrySlug: 'dashboards',
    highlights: ['CAC vs LTV Cohort', 'Cross-Funnel Attribution', 'Meta Ads Offline CAPI'],
  },

  // ======================== CRM FULL-CLONE SCREENS ========================
  {
    path: '/workspace',
    moduleKey: 'erp_projects_tasks',
    screenKey: 'workspace',
    title: 'Bàn làm việc Cá nhân (My Workspace)',
    subtitle: 'Tổng hợp việc cần làm hôm nay, cuộc gọi follow-up, phê duyệt chờ và KPI cá nhân.',
    group: 'crm',
    wave: 2,
    entrySlug: 'crm-workspace',
    fallbackPath: '/erp/projects',
    highlights: ['My Tasks Today', 'Follow-up Nhắc hẹn', 'Tóm tắt Hiệu suất cá nhân'],
  },
  {
    path: '/contacts',
    moduleKey: 'leads',
    screenKey: 'contacts',
    title: 'Hồ sơ Khách hàng 360° (Master Contacts)',
    subtitle: 'Danh bạ hợp nhất Lead, Khách hàng, Lịch sử tương tác đa kênh và Customer Drawer.',
    group: 'crm',
    wave: 2,
    entrySlug: 'crm-contacts',
    fallbackPath: '/data',
    highlights: ['Unified Customer 360', 'Timeline đa kênh', 'Segment Tags & Ghi chú'],
  },
  {
    path: '/deals',
    moduleKey: 'deals',
    screenKey: 'deals',
    title: 'Pipeline Cơ hội Kinh doanh (Deals Kanban)',
    subtitle: 'Kéo thả Deal qua các giai đoạn, dự báo doanh số có trọng số và liên kết Báo giá.',
    group: 'crm',
    wave: 2,
    entrySlug: 'crm-deals',
    fallbackPath: '/data',
    highlights: ['Multi-Pipeline Kanban', 'Weighted Revenue Forecast', 'Chuyển đổi từ Lead'],
  },
  {
    path: '/companies',
    moduleKey: 'companies',
    screenKey: 'companies',
    title: 'Quản lý Doanh nghiệp B2B (Companies)',
    subtitle: 'Hồ sơ tài khoản tổ chức, sơ đồ người ra quyết định, hợp đồng và lịch sử giao dịch.',
    group: 'crm',
    wave: 2,
    entrySlug: 'crm-companies',
    fallbackPath: '/data',
    highlights: ['Account-Based CRM', 'Liên kết Contacts & Deals', 'Theo dõi MST & Hợp đồng'],
  },
  {
    path: '/activities',
    moduleKey: 'leads',
    screenKey: 'activities',
    title: 'Hoạt động Chăm sóc & Nhắc việc (Activities)',
    subtitle: 'Nhật ký cuộc gọi, lịch họp, email follow-up và danh sách việc cần xử lý theo SLA.',
    group: 'crm',
    wave: 2,
    entrySlug: 'crm-activities',
    fallbackPath: '/data',
    highlights: ['Nhật ký Call / Meeting', 'Checklist Nhắc việc', 'Lọc Quá hạn & Hôm nay'],
  },

  // ======================== DOM AGENT & CORE ERP ========================
  {
    path: '/dom-agent',
    moduleKey: 'dom_agent',
    screenKey: 'dom_agent',
    title: 'Hội đồng DOM Agent AI (Autonomous Agents)',
    subtitle: 'Trợ lý điều hành doanh nghiệp đa tác vụ, Daily Briefing và Tool Audit Log.',
    group: 'erp',
    wave: 2,
    entrySlug: 'dom-agent',
    highlights: ['Executive AI Briefing', 'Knowledge RAG Workspace', 'RBAC Safe Tool Execution'],
  },
  {
    path: '/erp/approvals',
    moduleKey: 'erp_approvals',
    screenKey: 'erp_approvals',
    title: 'Trung tâm Phê duyệt Đa cấp (Approvals)',
    subtitle: 'Duyệt đơn nghỉ phép, tăng ca, tạm ứng, thanh toán chi phí và đề xuất mua sắm.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-approvals',
    highlights: ['Luồng duyệt Đa cấp', 'Thông báo tức thì', 'Nhật ký Audit chữ ký'],
  },
  {
    path: '/erp/finance',
    moduleKey: 'erp_finance_inventory',
    screenKey: 'erp_finance',
    title: 'Tài chính, Công nợ & Kho vận Tổng hợp',
    subtitle: 'Điều hành báo giá, đặt cọc POS, hóa đơn, thu chi tiền mặt, sản phẩm và tồn kho FIFO.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-finance',
    highlights: ['Quotes -> Deposits -> Invoices', 'Sổ quỹ & Dòng tiền', 'Kho vận FIFO'],
  },
  {
    path: '/erp/hrm',
    moduleKey: 'erp_hrm_org',
    screenKey: 'erp_hrm',
    title: 'Nhân sự HRM, Sơ đồ Tổ chức & Hợp đồng',
    subtitle: 'Quản lý hồ sơ nhân viên, cây phòng ban, chức danh, KPI và hợp đồng lao động.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-hrm',
    highlights: ['Org Chart Trực quan', 'Hợp đồng & Phụ lục', 'Đánh giá Năng lực'],
  },
  {
    path: '/erp/attendance',
    moduleKey: 'erp_attendance',
    screenKey: 'erp_attendance',
    title: 'Chấm công GPS, Wifi & Ca làm việc',
    subtitle: 'Ghi nhận check-in/out theo tọa độ văn phòng, bảng công tháng và giải trình ca.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-attendance',
    highlights: ['GPS Geofencing + Selfie', 'Quản lý Ca & Tăng ca', 'Đồng bộ Bảng lương'],
  },
  {
    path: '/erp/payroll',
    moduleKey: 'erp_payroll',
    screenKey: 'erp_payroll',
    title: 'Bảng lương Tự động, BHXH & Thuế TNCN',
    subtitle: 'Tính lương tự động từ bảng công, hoa hồng chốt đơn CRM, phụ cấp và khấu trừ thuế.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-payroll',
    highlights: ['Công thức lương linh hoạt', 'Tích hợp Hoa hồng Sale', 'Xuất phiếu lương hàng loạt'],
  },
  {
    path: '/erp/projects',
    moduleKey: 'erp_projects_tasks',
    screenKey: 'erp_projects',
    title: 'Quản lý Dự án Kanban, Gantt & Tiến độ',
    subtitle: 'Tổ chức sprint công việc, kéo thả Kanban, biểu đồ Gantt phụ thuộc và báo cáo SLA.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-projects',
    highlights: ['Board Kanban & Timeline', 'Subtasks & Checklists', 'Time Tracking & SLA'],
  },
  {
    path: '/erp/workchat',
    moduleKey: 'erp_workchat',
    screenKey: 'erp_workchat',
    title: 'WorkChat Doanh nghiệp & Kênh Phòng ban',
    subtitle: 'Nhắn tin nội bộ realtime theo phòng ban, dự án, gắn thẻ @mention và đính kèm Lead/Deal.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-workchat',
    highlights: ['Kênh nhóm & Chat 1-1', 'Gắn ngữ cảnh Lead / Deal', 'Tìm kiếm lịch sử nhanh'],
  },
  {
    path: '/erp/cloud-files',
    moduleKey: 'erp_cloud_ocr',
    screenKey: 'erp_cloud_files',
    title: 'Tài liệu Cloud Drive & AI OCR Chứng từ',
    subtitle: 'Lưu trữ tập trung phân quyền thư mục, tự động bóc tách hóa đơn & CCCD bằng AI OCR.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-cloud-files',
    highlights: ['Folder RBAC Bảo mật', 'AI OCR Hóa đơn / CCCD', 'Xem trước PDF / Ảnh'],
  },
  {
    path: '/erp/education',
    moduleKey: 'education_addon',
    screenKey: 'erp_education',
    title: 'Đào tạo & Học vụ Trung tâm (Education Add-on)',
    subtitle: 'Quản lý lớp học, lịch giảng dạy giảng viên, điểm danh học viên và bảo lưu học phí.',
    group: 'addon',
    wave: 2,
    entrySlug: 'erp-education',
    highlights: ['Xếp lớp & TKB', 'Điểm danh & Học vụ', 'Lịch sử đóng học phí'],
  },

  // ======================== EXPANDED ERP / FINANCE / SOCIAL ROUTES ========================
  {
    path: '/feed',
    moduleKey: 'erp_workchat',
    screenKey: 'feed',
    title: 'Bảng tin Nội bộ & Khen thưởng (Enterprise Feed)',
    subtitle: 'Truyền thông nội bộ toàn công ty, ghim thông báo ban lãnh đạo và ghi nhận thành tích.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-feed',
    subViewGlobs: ['erp-workchat/EnterpriseFeed', 'erp-workchat/FeedView'],
    fallbackPath: '/erp/workchat',
    highlights: ['Thông báo nội bộ', 'Tương tác & Bình luận', 'Vinh danh chốt đơn'],
  },
  {
    path: '/support-tickets',
    moduleKey: 'erp_projects_tasks',
    screenKey: 'support_tickets',
    title: 'Helpdesk CSKH & Khiếu nại SLA',
    subtitle: 'Tiếp nhận yêu cầu hỗ trợ hậu mãi, phân công xử lý theo SLA và đo lường CSAT.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-support-tickets',
    subViewGlobs: ['erp-projects/SupportTicketsView', 'erp-projects/HelpdeskView'],
    fallbackPath: '/erp/projects',
    highlights: ['Theo dõi SLA CSKH', 'Gắn Ticket vào Contact', 'Lịch sử xử lý'],
  },
  {
    path: '/quotes',
    moduleKey: 'erp_finance_inventory',
    screenKey: 'quotes',
    title: 'Quản lý Báo giá (Quotes)',
    subtitle: 'Khởi tạo báo giá chi tiết theo SKU, chiết khấu hạng mục và xuất PDF gửi khách hàng.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-finance',
    fallbackPath: '/erp/finance',
  },
  {
    path: '/sales-orders',
    moduleKey: 'erp_finance_inventory',
    screenKey: 'sales_orders',
    title: 'Đơn bán hàng (Sales Orders)',
    subtitle: 'Quản lý đơn hàng bán, tiến độ giao hàng, đặt cọc và xuất hóa đơn tự động.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-finance',
    fallbackPath: '/erp/finance',
  },
  {
    path: '/deposits',
    moduleKey: 'erp_finance_inventory',
    screenKey: 'deposits',
    title: 'Phiếu Đặt cọc & Thu tiền (Deposits / POS)',
    subtitle: 'Ghi nhận tiền đặt cọc theo từng đợt thanh toán, xuất biên lai QR chuyển khoản.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-finance',
    fallbackPath: '/erp/finance',
  },
  {
    path: '/expenses',
    moduleKey: 'erp_finance_inventory',
    screenKey: 'expenses',
    title: 'Chi phí, Tạm ứng & Hoàn ứng (Expenses)',
    subtitle: 'Theo dõi khoản chi vận hành, chi phí Marketing và đối soát chứng từ đính kèm.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-finance',
    fallbackPath: '/erp/finance',
  },
  {
    path: '/cash-flow',
    moduleKey: 'erp_finance_inventory',
    screenKey: 'cash_flow',
    title: 'Báo cáo Dòng tiền (Cash Flow & Sổ quỹ)',
    subtitle: 'Biểu đồ thu chi thực tế theo ngày/tháng và dự báo số dư tài khoản ngân hàng.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-finance',
    fallbackPath: '/erp/finance',
  },
  {
    path: '/accounting-az',
    moduleKey: 'erp_finance_inventory',
    screenKey: 'accounting_az',
    title: 'Kế toán & Quyết toán Thuế A-Z',
    subtitle: 'Sổ cái kế toán, hạch toán chứng từ đầu vào/ra và bảng cân đối phát sinh.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-accounting-az',
    subViewGlobs: ['erp-payroll/HrmAccountingAzWorkspace', 'erp-finance/AccountingAzPage'],
    fallbackPath: '/erp/finance',
  },
  {
    path: '/invoices',
    moduleKey: 'erp_finance_inventory',
    screenKey: 'invoices',
    title: 'Hóa đơn Bán hàng & Công nợ Phải thu',
    subtitle: 'Quản lý trạng thái xuất hóa đơn VAT, theo dõi công nợ quá hạn và nhắc thanh toán.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-finance',
    fallbackPath: '/erp/finance',
  },
  {
    path: '/products',
    moduleKey: 'erp_finance_inventory',
    screenKey: 'products',
    title: 'Danh mục Sản phẩm & Dịch vụ (SKU)',
    subtitle: 'Quản lý bảng giá niêm yết, định mức tồn kho tối thiểu và gói dịch vụ CRM/ERP.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-finance',
    fallbackPath: '/erp/finance',
  },
  {
    path: '/suppliers',
    moduleKey: 'erp_finance_inventory',
    screenKey: 'suppliers',
    title: 'Nhà cung cấp & Công nợ Phải trả (Suppliers)',
    subtitle: 'Lưu trữ thông tin đối tác cung ứng, hợp đồng nhập hàng và lịch sử thanh toán.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-finance',
    fallbackPath: '/erp/finance',
  },
  {
    path: '/inventory',
    moduleKey: 'erp_finance_inventory',
    screenKey: 'inventory',
    title: 'Kho vận FIFO & Xuất nhập tồn',
    subtitle: 'Kiểm soát phiếu nhập kho, xuất kho bán hàng, điều chuyển đa chi nhánh theo lô FIFO.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-finance',
    fallbackPath: '/erp/finance',
  },
  {
    path: '/purchase-orders',
    moduleKey: 'erp_finance_inventory',
    screenKey: 'purchase_orders',
    title: 'Đơn mua hàng & Nhập kho (Purchase Orders)',
    subtitle: 'Quản lý đơn đặt mua nhà cung cấp, theo dõi giao hàng và nhập kho lô FIFO.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-finance',
    fallbackPath: '/erp/finance',
  },
  {
    path: '/my-payslips',
    moduleKey: 'erp_payroll',
    screenKey: 'my_payslips',
    title: 'Phiếu lương Cá nhân (My Payslips)',
    subtitle: 'Xem chi tiết bảng lương hàng tháng, ngày công thực tế, thưởng KPI và tải PDF bảo mật.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-my-payslips',
    subViewGlobs: ['erp-payroll/MyPayslipsView', 'erp-payroll/MyPayslipsPage'],
    fallbackPath: '/erp/payroll',
  },
  {
    path: '/cooperation-slips',
    moduleKey: 'erp_payroll',
    screenKey: 'cooperation_slips',
    title: 'Phiếu Hợp tác & Đối soát Hoa hồng CTV',
    subtitle: 'Quản lý phiếu chia sẻ doanh thu cộng tác viên, đại lý và lịch sử quyết toán.',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-cooperation-slips',
    subViewGlobs: ['erp-payroll/CooperationSlipsView', 'erp-payroll/CooperationSlipsPage'],
    fallbackPath: '/erp/payroll',
  },
  {
    path: '/account',
    moduleKey: 'settings',
    screenKey: 'account',
    title: 'Tài khoản Cá nhân, Bảo mật & Đổi mật khẩu',
    subtitle: 'Quản lý thông tin hồ sơ nhân viên, đổi mật khẩu và cấu hình nhận thông báo cá nhân.',
    group: 'core',
    wave: 2,
    entrySlug: 'erp-account',
    subViewGlobs: ['erp-workchat/AccountSecurityView', 'settings-saas/AccountPage'],
    fallbackPath: '/settings',
  },

  // ======================== PUBLIC STANDALONE PAGES ========================
  {
    path: '/booking/:slug',
    moduleKey: 'forms_triggers',
    screenKey: 'public_booking',
    title: 'Đặt lịch Hẹn Tư vấn 1-1',
    subtitle: 'Trang đặt lịch công khai đồng bộ trực tiếp với lịch trống của chuyên viên.',
    group: 'public',
    wave: 2,
    entrySlug: 'public-booking',
    publicRoute: true,
    publicPageGlobs: ['PublicBooking1on1Page'],
  },
  {
    path: '/public-booking/1on1/:slug',
    moduleKey: 'forms_triggers',
    screenKey: 'public_booking',
    title: 'Đặt lịch Hẹn Tư vấn 1-1',
    subtitle: 'Trang đặt lịch công khai đồng bộ trực tiếp với lịch trống của chuyên viên.',
    group: 'public',
    wave: 2,
    entrySlug: 'public-booking',
    publicRoute: true,
    publicPageGlobs: ['PublicBooking1on1Page'],
  },
  {
    path: '/s/:slug',
    moduleKey: 'surveys_quiz',
    screenKey: 'public_survey',
    title: 'Khảo sát & Interactive Quiz',
    subtitle: 'Biểu mẫu khảo sát khách hàng trực tuyến.',
    group: 'public',
    wave: 2,
    entrySlug: 'public-survey',
    publicRoute: true,
    publicPageGlobs: ['PublicSurveyPage'],
  },
  {
    path: '/s/:tenant/:slug',
    moduleKey: 'surveys_quiz',
    screenKey: 'public_survey',
    title: 'Khảo sát & Interactive Quiz',
    subtitle: 'Biểu mẫu khảo sát khách hàng trực tuyến theo Workspace.',
    group: 'public',
    wave: 2,
    entrySlug: 'public-survey',
    publicRoute: true,
    publicPageGlobs: ['PublicSurveyPage'],
  },
  {
    path: '/claim/:id',
    moduleKey: 'vouchers_qr',
    screenKey: 'public_voucher_claim',
    title: 'Nhận Ưu đãi & Mã Voucher QR',
    subtitle: 'Trang kích hoạt và hiển thị mã QR ưu đãi cho khách hàng.',
    group: 'public',
    wave: 2,
    entrySlug: 'public-voucher-claim',
    publicRoute: true,
    publicPageGlobs: ['PublicVoucherClaimPage'],
  },
  {
    path: '/schedule/:slug',
    moduleKey: 'erp_hrm_org',
    screenKey: 'public_schedule',
    title: 'Lịch Công khai & Sự kiện',
    subtitle: 'Xem thời khóa biểu / lịch làm việc chia sẻ công khai.',
    group: 'public',
    wave: 2,
    entrySlug: 'public-schedule',
    publicRoute: true,
    publicPageGlobs: ['PublicSchedulePage'],
  },
  {
    path: '/public-schedule/:slug',
    moduleKey: 'erp_hrm_org',
    screenKey: 'public_schedule',
    title: 'Lịch Công khai & Sự kiện',
    subtitle: 'Xem thời khóa biểu / lịch làm việc chia sẻ công khai.',
    group: 'public',
    wave: 2,
    entrySlug: 'public-schedule',
    publicRoute: true,
    publicPageGlobs: ['PublicSchedulePage'],
  },
  {
    path: '/docs/api-v1',
    moduleKey: 'integrations_autodata',
    screenKey: 'public_api_docs',
    title: 'DOMATION Public REST API v1 Docs',
    subtitle: 'Tài liệu OpenAPI tích hợp Webhook, Leads, Contacts và ERP cho đội ngũ kỹ thuật.',
    group: 'public',
    wave: 2,
    entrySlug: 'public-api-docs',
    publicRoute: true,
    publicPageGlobs: ['ApiV1DocsPage'],
  },
];

function normalizeRoutePath(pathname: string): string {
  const clean = (pathname || '/').split('?')[0].split('#')[0];
  if (clean.length > 1 && clean.endsWith('/')) {
    return clean.slice(0, -1);
  }
  return clean || '/';
}

function matchPathPattern(pattern: string, pathname: string): boolean {
  const normPattern = normalizeRoutePath(pattern);
  const normPath = normalizeRoutePath(pathname);
  if (normPattern === normPath) return true;
  if (!normPattern.includes(':')) return false;

  const patternParts = normPattern.split('/').filter(Boolean);
  const pathParts = normPath.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return false;

  return patternParts.every((seg, i) => seg.startsWith(':') || seg === pathParts[i]);
}

export function matchEcosystemRoute(pathname: string): EcosystemRouteDescriptor | undefined {
  const exact = ECOSYSTEM_PLUGIN_ROUTES.find((r) => normalizeRoutePath(r.path) === normalizeRoutePath(pathname));
  if (exact) return exact;
  return ECOSYSTEM_PLUGIN_ROUTES.find((r) => matchPathPattern(r.path, pathname));
}

export const REGISTERED_WAVE2_MODULES: Record<string, React.ComponentType> = {};

export function registerWave2Module(
  path: string,
  Component: React.ComponentType
): void {
  REGISTERED_WAVE2_MODULES[normalizeRoutePath(path)] = Component;
}

export function getRegisteredWave2Module(
  path: string
): React.ComponentType | undefined {
  return REGISTERED_WAVE2_MODULES[normalizeRoutePath(path)];
}
