import type React from 'react';
import type { WorkspaceScreenKey } from '../../autodataTypes';

export interface EcosystemRouteDescriptor {
  path: string;
  moduleKey: string;
  screenKey: WorkspaceScreenKey;
  title: string;
  subtitle: string;
  group: 'crm' | 'marketing' | 'growth' | 'erp' | 'addon';
  wave: 1 | 2;
  entrySlug?: string;
  highlights?: string[];
}

export const ECOSYSTEM_PLUGIN_ROUTES: ReadonlyArray<EcosystemRouteDescriptor> = [
  // Wave 1 Complete Functional Modules
  {
    path: '/marketing-dashboard',
    moduleKey: 'mkt_dashboard',
    screenKey: 'mkt_dashboard',
    title: 'Dashboard Marketing Automation',
    subtitle: 'Thống kê tăng trưởng Tệp, hiệu suất gửi Email/ZNS & phễu chuyển đổi',
    group: 'marketing',
    wave: 1,
  },
  {
    path: '/audiences',
    moduleKey: 'audiences',
    screenKey: 'audiences',
    title: 'Khách hàng 360° • Tệp Data & Tệp Logic',
    subtitle: 'Quản trị Master Contact, Tệp Data tĩnh/đồng bộ & Tệp Logic AND/OR real-time',
    group: 'marketing',
    wave: 1,
  },
  {
    path: '/marketing-connect',
    moduleKey: 'integrations_marketing',
    screenKey: 'marketing_connect',
    title: 'Kết nối AWS SES, DKIM/SPF, Zalo ZNS & Web SDK',
    subtitle: 'Kho khóa kênh gửi mã hóa riêng theo từng doanh nghiệp',
    group: 'marketing',
    wave: 1,
  },
  {
    path: '/growth-attribution',
    moduleKey: 'growth_attribution',
    screenKey: 'growth_attribution',
    title: 'Doanh thu & ROAS Xuyên Phễu (Growth Attribution)',
    subtitle: 'Đo lường khép kín từ Ads / Form / Email -> Chia Sale -> Doanh thu thực',
    group: 'growth',
    wave: 1,
  },

  // Wave 2 Marketing Automation Plugin Slots
  {
    path: '/marketing/templates',
    moduleKey: 'email_templates',
    screenKey: 'mkt_templates',
    title: 'Email Templates & Trình Kéo-Thả 15 Khối',
    subtitle: 'Email Editor chuẩn Responsive, htmlCompiler, biến trộn động & DOM Agent Email Studio',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-templates',
    highlights: ['15 khối kéo-thả trực quan', 'Đồng hồ đếm ngược SVG động', 'Kiểm tra điểm chống Spam'],
  },
  {
    path: '/marketing/forms',
    moduleKey: 'forms_triggers',
    screenKey: 'mkt_forms',
    title: 'Form Builder, Form Cards & Cổng OTP',
    subtitle: 'Thiết kế Form nhúng Web, Custom/Purchase Events & xác thực mã OTP giao dịch',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-forms',
    highlights: ['Không ép buộc cột Email cứng', 'Tùy chọn Nuôi dưỡng hoặc Chia Sale ngay', 'Xác thực OTP Email tức thì'],
  },
  {
    path: '/marketing/surveys',
    moduleKey: 'surveys_quiz',
    screenKey: 'mkt_surveys',
    title: 'Khảo sát & Trắc nghiệm (Survey / Quiz 25 Khối)',
    subtitle: 'Chấm điểm tương tác cộng thẳng vào Lead Score & kích hoạt Tệp Logic',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-surveys',
    highlights: ['25 khối câu hỏi tương tác', 'Đường dẫn Public /s/:tenant/:slug', 'Cộng điểm nóng Lead Score tự động'],
  },
  {
    path: '/marketing/campaigns',
    moduleKey: 'campaigns',
    screenKey: 'mkt_campaigns',
    title: 'Chiến dịch Đa kênh (Email & Zalo ZNS)',
    subtitle: 'Phát hành hàng loạt chống trùng khóa nguyên tử, gửi nhắc tự động & đo doanh thu',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-campaigns',
    highlights: ['Khóa nguyên tử chống gửi đúp', 'Gửi nhắc khách chưa mở / chưa click', 'Tự động chặn SNS Bounce'],
  },
  {
    path: '/marketing/flows',
    moduleKey: 'automation_flows',
    screenKey: 'mkt_flows',
    title: 'Automation Flows (15 Triggers × 11 Nodes)',
    subtitle: 'Canvas kịch bản rẽ nhánh tự động kèm node "Đẩy vào Vòng chia Sale Auto Data"',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-flows',
    highlights: ['Canvas cây trực quan Bright UI', 'Giả lập nhánh & AI rà lỗi kịch bản', 'Node đẩy thẳng Vòng chia Sale'],
  },
  {
    path: '/marketing/vouchers',
    moduleKey: 'vouchers_qr',
    screenKey: 'mkt_vouchers',
    title: 'Mã Ưu Đãi Voucher, Shortlink & QR Designer',
    subtitle: 'Phát hành mã ưu đãi cá nhân hóa, rút gọn link tên miền riêng & gạch mã tại quầy',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-vouchers',
    highlights: ['Nhập CSV mã ưu đãi & gạch mã nhanh', 'Trình thiết kế QR thương hiệu', 'Ghi lịch sử nhận mã vào Timeline 360°'],
  },
  {
    path: '/marketing/web-tracking',
    moduleKey: 'web_tracking',
    screenKey: 'mkt_web_tracking',
    title: 'Web Tracking, Phiên Truy Cập & Heatmap',
    subtitle: 'Định danh khách ẩn danh sang Hồ sơ 360° & theo dõi hành vi xem trang bảng giá',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-web-tracking',
    highlights: ['Hợp nhất danh tính Visitor -> Lead', 'Bản đồ nhiệt click & cuộn trang', 'Kích hoạt Tệp Logic khi xem trang giá'],
  },
  {
    path: '/marketing/social-bot',
    moduleKey: 'social_bot',
    screenKey: 'mkt_social_bot',
    title: 'Social Bot (Messenger & Zalo OA) & AI Bot Studio',
    subtitle: 'Trợ lý AI RAG tư vấn khách hàng đa kênh 24/7 cô lập dữ liệu theo từng Tenant',
    group: 'marketing',
    wave: 2,
    entrySlug: 'marketing-social-bot',
    highlights: ['Hộp thư hợp nhất Fanpage & Zalo OA', 'Huấn luyện tài liệu PDF/DOCX riêng', 'Tự động thu SĐT đẩy vào Tệp / Sale'],
  },

  // Wave 2 DOMATION PROMAX ERP Plugin Slots (9 Core Groups + Education Add-on)
  {
    path: '/erp/hrm',
    moduleKey: 'erp_hrm_org',
    screenKey: 'erp_hrm',
    title: 'Nhân sự (HRM), Hồ sơ & Hợp đồng Lao động',
    subtitle: 'Quản trị vòng đời nhân sự, tài sản cấp phát & chữ ký số nội bộ',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-hrm',
    highlights: ['Hồ sơ nhân sự 360° gắn Sơ đồ Tổ chức', 'Quản lý hợp đồng & tài sản bàn giao', 'Cô lập RLS tuyệt đối theo doanh nghiệp'],
  },
  {
    path: '/erp/attendance',
    moduleKey: 'erp_attendance',
    screenKey: 'erp_attendance',
    title: 'Chấm công Thông minh GPS Đa tầng & Selfie',
    subtitle: 'Đối chiếu bán kính GPS theo từng Chi nhánh & quy chế ca làm việc động',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-attendance',
    highlights: ['Xác thực WebRTC Camera Selfie + GPS', 'Đọc bán kính văn phòng từ Sơ đồ Tổ chức', 'Đăng ký ca trực & giải trình công online'],
  },
  {
    path: '/erp/payroll',
    moduleKey: 'erp_payroll',
    screenKey: 'erp_payroll',
    title: 'Bảng lương, Hoa hồng, Thuế TNCN & BHXH A-Z',
    subtitle: 'Động cơ tính lương công thức động, thuế lũy tiến & kết xuất XML HTKK',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-payroll',
    highlights: ['Công thức ngày công & phụ cấp tùy biến', 'Tự động tính hoa hồng từ doanh thu chốt', 'Xuất phiếu lương & tờ khai thuế TNCN'],
  },
  {
    path: '/erp/approvals',
    moduleKey: 'erp_approvals',
    screenKey: 'erp_approvals',
    title: 'Trung tâm Phê duyệt Đa cấp Động (N Bước)',
    subtitle: 'Duyệt Nghỉ phép, OT, Tạm ứng, Chi phí, Đơn mua PO & Đơn bán SO theo ngưỡng động',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-approvals',
    highlights: ['Giải quyết người duyệt tự động theo Sơ đồ Tổ chức', 'Rẽ nhánh luồng duyệt theo hạn mức tiền', 'Hỗ trợ ủy quyền duyệt thay có thời hạn'],
  },
  {
    path: '/erp/projects',
    moduleKey: 'erp_projects_tasks',
    screenKey: 'erp_projects',
    title: 'Bàn làm việc, Dự án Kanban / Gantt & Helpdesk SLA',
    subtitle: 'Quản lý tiến độ công việc đa chiều, tự sinh Task theo bước phễu & CSKH SLA',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-projects',
    highlights: ['Bảng kéo-thả Kanban & sơ đồ Gantt', 'Tự động sinh công việc khi đổi bước CRM', 'Helpdesk xử lý yêu cầu khách hàng chuẩn SLA'],
  },
  {
    path: '/erp/workchat',
    moduleKey: 'erp_workchat',
    screenKey: 'erp_workchat',
    title: 'WorkChat Doanh nghiệp & Bảng tin Nội bộ',
    subtitle: 'Trò chuyện thời gian thực theo phòng ban / dự án & bảng vàng vinh danh',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-workchat',
    highlights: ['Nhắn tin nhóm dự án & đính kèm chứng từ', 'Bộ nhãn dán công việc chuẩn thương mại', 'Bảng tin truyền thông & vinh danh nội bộ'],
  },
  {
    path: '/erp/finance',
    moduleKey: 'erp_finance_inventory',
    screenKey: 'erp_finance',
    title: 'Tài chính, Báo giá, Đơn hàng SO/PO, Kho FIFO & Tài sản',
    subtitle: 'Khép kín từ Cơ hội B2B -> Báo giá -> Đặt cọc / Đơn bán -> Xuất kho -> Dòng tiền P&L',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-finance',
    highlights: ['B2B Accounts & Multi-Deals độc lập', 'Quản lý Báo giá, Đặt cọc, SO/PO & Thu-Chi', 'Tồn kho lô hạn FIFO & kiểm kê tài sản'],
  },
  {
    path: '/erp/cloud-files',
    moduleKey: 'erp_cloud_ocr',
    screenKey: 'erp_cloud_files',
    title: 'Tài liệu Cloud & AI OCR Hợp đồng / CCCD',
    subtitle: 'Lưu trữ phân quyền theo phòng ban & bóc tách tự động thông tin pháp nhân hợp đồng',
    group: 'erp',
    wave: 2,
    entrySlug: 'erp-cloud-files',
    highlights: ['Lưu trữ cô lập tenants/{tenant_id}/', 'AI OCR bóc tách CCCD & Hợp đồng kinh tế', 'Đối soát tự động Pháp nhân từ Chi nhánh'],
  },
  {
    path: '/dom-agent',
    moduleKey: 'dom_agent',
    screenKey: 'dom_agent',
    title: 'DOM Agent — Hội Đồng Trợ Lý AI Điều Hành Doanh Nghiệp',
    subtitle: '72 công cụ tự hành tuân thủ nghiêm ngặt quyền RBAC cá nhân & kho tri thức RAG nội bộ',
    group: 'erp',
    wave: 2,
    entrySlug: 'dom-agent',
    highlights: ['Hội đồng chuyên gia BI, Sale, Marketing, HR, Tài chính', 'Bản tin điều hành chủ động mỗi sáng', '0% rò rỉ dữ liệu chéo doanh nghiệp'],
  },
  {
    path: '/erp/education',
    moduleKey: 'education_addon',
    screenKey: 'erp_education',
    title: 'Đào tạo & Quản lý Học vụ (Education Vertical Add-on)',
    subtitle: 'Thời khóa biểu lớp học, lịch giảng viên & quản lý kết quả đào tạo chuyên biệt',
    group: 'addon',
    wave: 2,
    entrySlug: 'erp-education',
    highlights: ['Chỉ hiển thị khi bật Education Add-on', 'Quản lý khóa học, lịch giảng & học phần', 'Đồng bộ xuyên suốt với Hồ sơ Học viên'],
  },
];

const dynamicRegistry = new Map<string, React.LazyExoticComponent<React.ComponentType>>();

export function registerWave2Module(
  routePath: string,
  component: React.LazyExoticComponent<React.ComponentType>
): void {
  dynamicRegistry.set(routePath, component);
}

export function getRegisteredWave2Module(
  routePath: string
): React.LazyExoticComponent<React.ComponentType> | undefined {
  return dynamicRegistry.get(routePath);
}
