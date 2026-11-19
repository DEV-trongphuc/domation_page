export interface CompanyStrength {
  num: string;
  title: string;
  subtitle: string;
  desc: string;
  metric: string;
  decorImg: string;
}

export interface SolutionPillar {
  id: 'erp' | 'data-capi' | 'crm' | 'autoflow' | 'meta-report' | 'web-3d';
  num: string;
  badge: string;
  title: string;
  editorialAccent: string;
  summary: string;
  illustration: string;
  decorPng: string;
  highlights: string[];
  routeUrl: string;
  liveDemoUrl?: string;
  liveDemoLabel?: string;
  screenCountLabel: string;
}

export interface ScreenItem {
  id?: string;
  src: string;
  title: string;
  badge: string;
  desc: string;
  category?: string;
}

export interface FlagshipPartner {
  id: string;
  name: string;
  role: string;
  subtitle: string;
  logo: string;
  url?: string;
  badge: string;
  metrics: string[];
}

export interface F1AgencyPartner {
  id: string;
  name: string;
  shortName: string;
  role: string;
  logo: string;
  routeMetric: string;
  note: string;
}

export interface EcosystemBrand {
  name: string;
  image: string;
  website: string;
  industry: string;
}

export interface CaseStudySpotlightItem {
  id: string;
  company: string;
  sector: string;
  logo: string;
  secondaryLogo?: string;
  result: string;
  cost: string;
  impact: string;
  tags: string[];
  summary: string;
  inspectionTab?: SolutionPillar['id'] | 'inkica';
  url?: string;
}

export const DECOR_PNGS = {
  prism: '/imgs/enterprise/decor-crystal-prism.png',
  torus: '/imgs/enterprise/decor-torus-ring.png',
  shield: '/imgs/enterprise/decor-shield-node.png',
  funnel: '/imgs/enterprise/decor-funnel-orb.png',
};

export interface EnterpriseStoryChapter {
  step: string;
  tag: string;
  title: string;
  desc: string;
  decorImg: string;
}

export interface MultiAgentNode {
  id: string;
  roleTag: string;
  name: string;
  focus: string;
}

export interface CoreOperationPillar {
  id: 'erp' | 'crm-flow' | 'data-capi' | 'web-brand';
  pillarTag: string;
  tabLabel: string;
  eyebrow: string;
  title: string;
  accent: string;
  summary: string;
  keyTags: string[];
  image: string;
  inspectionTab: SolutionPillar['id'];
  routeUrl: string;
  routeLabel: string;
}

export const ENTERPRISE_STORY_CHAPTERS: EnterpriseStoryChapter[] = [
  {
    step: '01',
    tag: 'THỰC TRẠNG ĐỨT GÃY',
    title: 'Công Cụ Rời Rạc Làm Chậm Đà Tăng Trưởng',
    desc: 'Quảng cáo, Sale, Nhân sự và Kế toán vận hành trên nhiều phần mềm tách biệt khiến thất thoát khách hàng và nghẽn luồng phê duyệt.',
    decorImg: DECOR_PNGS.funnel,
  },
  {
    step: '02',
    tag: 'KIẾN TRÚC MAY ĐO 100%',
    title: 'Thiết Kế Riêng Theo Mô Hình Từng Doanh Nghiệp',
    desc: 'Không ép doanh nghiệp vào khuôn mẫu đóng gói — DOMATION thiết kế phân hệ ERP, cấp duyệt và phễu CRM khớp chính xác sơ đồ tổ chức của bạn.',
    decorImg: DECOR_PNGS.prism,
  },
  {
    step: '03',
    tag: 'TỰ ĐỘNG HÓA LIÊN PHÒNG BAN',
    title: 'Đội Ngũ AI Agent Vận Hành Xuyên Suốt 24/7',
    desc: 'Các AI Agent chuyên trách học tri thức nội bộ, tự động phối hợp xử lý tác vụ từ đón khách, chia số đến nhắc việc và báo cáo doanh thu.',
    decorImg: DECOR_PNGS.torus,
  },
];

export const MULTI_AGENT_NODES: MultiAgentNode[] = [
  {
    id: 'lead-agent',
    roleTag: 'ĐIỀU PHỐI < 5S',
    name: 'Lead & Routing Agent',
    focus: 'Lọc trùng dữ liệu, chấm điểm nhu cầu và chia khách đúng Sale hoặc Đại lý F1 tức thì.',
  },
  {
    id: 'cskh-agent',
    roleTag: 'ĐA KÊNH 24/7',
    name: 'Omnichannel CSKH Agent',
    focus: 'Nắm vững bảng giá, chính sách nội bộ để tư vấn, gửi tài liệu và đặt lịch hẹn tự động.',
  },
  {
    id: 'ops-agent',
    roleTag: 'VẬN HÀNH NỘI BỘ',
    name: 'ERP & HR Ops Agent',
    focus: 'Theo dõi tiến độ Task, đối soát công ca GPS và tự động luân chuyển hồ sơ phê duyệt.',
  },
  {
    id: 'revenue-agent',
    roleTag: 'TỐI ƯU CHUYỂN ĐỔI',
    name: 'Flow & Revenue Agent',
    focus: 'Kích hoạt kịch bản rẽ nhánh IF / ELSE và phản hồi tín hiệu doanh thu thực về quảng cáo.',
  },
];

export const CORE_OPERATION_PILLARS: CoreOperationPillar[] = [
  {
    id: 'erp',
    pillarTag: 'TRỤ CỘT NỘI BỘ',
    tabLabel: 'Vận Hành ERP 5.0',
    eyebrow: 'QUẢN TRỊ NỘI BỘ MAY ĐO',
    title: 'Task Kanban, Nhân Sự GPS &',
    accent: 'Phê Duyệt Đa Cấp',
    summary:
      'Điều hành toàn bộ công việc phòng ban, chấm công định vị AI, tự động tính lương PDF và ký duyệt đơn từ, chi phí theo đúng phân cấp doanh nghiệp.',
    keyTags: ['Task & KPI Phòng Ban', 'Chấm Công GPS & Payroll PDF', 'Phê Duyệt Đa Cấp'],
    image: '/imgs/enterprise/sol-erp-operations.webp',
    inspectionTab: 'erp',
    routeUrl: '/erp',
    routeLabel: 'Chuyên Trang ERP',
  },
  {
    id: 'crm-flow',
    pillarTag: 'TRỤ CỘT CHĂM SÓC',
    tabLabel: 'CRM & Flow Rẽ Nhánh',
    eyebrow: 'CHĂM SÓC & NUÔI DƯỠNG TỰ ĐỘNG',
    title: 'Phễu CRM 360° & Kịch Bản',
    accent: 'Điều Kiện IF / ELSE',
    summary:
      'Thiết kế bước phễu bán hàng sát thực tế, tự động rẽ nhánh chăm sóc qua Email SES và Zalo ZNS theo hành vi mở mail, bấm link và đồng bộ hóa đơn bán hàng.',
    keyTags: ['Pipeline Bán Hàng Riêng', 'Flow Rẽ Nhánh IF / ELSE', 'Đồng Bộ Hóa Đơn Điện Tử'],
    image: '/imgs/enterprise/sol-flow-branching.webp',
    inspectionTab: 'autoflow',
    routeUrl: '/crm',
    routeLabel: 'Chuyên Trang CRM',
  },
  {
    id: 'data-capi',
    pillarTag: 'TRỤ CỘT TĂNG TRƯỞNG',
    tabLabel: 'Auto Data & Ads BI',
    eyebrow: 'PHÂN BỔ LEAD & ĐO LƯỜNG ROI',
    title: 'Chia Data Dưới 5 Giây &',
    accent: 'Meta CAPI HTTP 200',
    summary:
      'Thu nhận khách hàng đa nguồn, lọc trùng 6 tháng, chia vòng công bằng qua ZaloBot & Telegram Bot, đối chiếu ngân sách quảng cáo với doanh thu thực tế.',
    keyTags: ['ZaloBot & Telegram < 5s', 'Meta CAPI Chuẩn SHA-256', 'Báo Cáo ROI Realtime'],
    image: '/imgs/enterprise/sol-data-capi.webp',
    inspectionTab: 'data-capi',
    routeUrl: '/data',
    routeLabel: 'Chuyên Trang Data',
  },
  {
    id: 'web-brand',
    pillarTag: 'TRỤ CỘT HIỆN DIỆN SỐ',
    tabLabel: 'Website Thương Hiệu',
    eyebrow: 'KHÔNG GIAN SỐ CHUYỂN ĐỔI CAO',
    title: 'Website Thiết Kế Riêng &',
    accent: 'Trải Nghiệm Tương Tác',
    summary:
      'Kiến tạo diện mạo số chuẩn nhận diện thương hiệu tốc độ cao, tích hợp sa bàn trực quan và gắn sẵn đo lường hành vi đẩy thẳng về CRM.',
    keyTags: ['UI/UX Thiết Kế Riêng', 'Sa Bàn Tương Tác Trực Quan', 'Tracking Đồng Bộ CRM'],
    image: '/imgs/enterprise/hero-domation-hub.webp',
    inspectionTab: 'web-3d',
    routeUrl: '/web-design',
    routeLabel: 'Dự Toán Website',
  },
];

export const COMPANY_STRENGTHS: CompanyStrength[] = [
  {
    num: '01',
    title: 'ERP Vận Hành 5.0 • 12 Phân Hệ',
    subtitle: 'Task Kanban • Nhân Sự • Phê Duyệt',
    desc: 'Quản lý công việc Task, chấm công GPS AI Selfie, bảng lương PDF và quy trình phê duyệt đa cấp.',
    metric: '12 Phân Hệ ERP • Payroll PDF',
    decorImg: DECOR_PNGS.prism,
  },
  {
    num: '02',
    title: 'CRM Chăm Sóc & Auto Chia Data',
    subtitle: 'Pipeline 8 Nấc • ZaloBot & Telegram < 5s • CRM 360°',
    desc: 'Phễu chăm sóc khách hàng 360°, chia số Round-Robin 5 cổng qua ZaloBot & Telegram và đồng bộ doanh thu bán hàng.',
    metric: 'Chia Data < 5s • Meta CAPI 200',
    decorImg: DECOR_PNGS.funnel,
  },
  {
    num: '03',
    title: 'Marketing Mail & Flow Rẽ Nhánh',
    subtitle: 'Visual Flow • IF / ELSE Condition',
    desc: 'Kịch bản chăm sóc tự động rẽ nhánh theo điều kiện click, mở mail và điểm Lead Score trên Email & ZNS.',
    metric: 'IF/ELSE Condition • SES 98%',
    decorImg: DECOR_PNGS.shield,
  },
  {
    num: '04',
    title: 'Setup AI Training & Chatbot Đa Kênh',
    subtitle: 'AI Knowledge • 6 Kênh Hợp Nhất',
    desc: 'Huấn luyện AI từ tài liệu PDF nội bộ, tự động chăm sóc & chốt lịch 24/7 đồng bộ toàn kênh.',
    metric: 'AI Phòng Ban • 6 Kênh Tích Hợp',
    decorImg: DECOR_PNGS.torus,
  },
];

export interface OperationalHighlightTrack {
  id: 'erp-ops' | 'flow-condition' | 'ai-omnichannel';
  step: string;
  tag: string;
  title: string;
  shortDesc: string;
  image: string;
  routeUrl: string;
  routeLabel: string;
  inspectionTab: SolutionPillar['id'];
  highlights: string[];
}

export const OPERATIONAL_HIGHLIGHT_TRACKS: OperationalHighlightTrack[] = [
  {
    id: 'erp-ops',
    step: '01',
    tag: 'ERP 5.0 • VẬN HÀNH DOANH NGHIỆP',
    title: 'Quản Lý Task, Nhân Sự Chấm Công & Phê Duyệt',
    shortDesc: 'Điều phối toàn bộ công việc phòng ban, chấm công GPS AI Selfie, bảng lương PDF và ký duyệt đơn từ.',
    image: '/imgs/enterprise/sol-erp-operations.webp',
    routeUrl: '/erp',
    routeLabel: 'Trang ERP 5.0',
    inspectionTab: 'erp',
    highlights: [
      'Bàn làm việc & Task Kanban giao việc theo KPI từng phòng ban',
      'Chấm công định vị GPS văn phòng + Selfie AI & lịch ca trực',
      'Hộp thư Phê duyệt đơn từ, nghỉ phép, tạm ứng & Purchase Order',
      'Payroll Engine tự tính lương, BHXH, thuế TNCN & xuất phiếu PDF',
    ],
  },
  {
    id: 'flow-condition',
    step: '02',
    tag: 'MARKETING & CRM • FLOW AUTOMATION',
    title: 'Kịch Bản Chăm Sóc Rẽ Nhánh, Flow & Condition',
    shortDesc: 'Tự động chia Lead CRM 8 nấc, rẽ nhánh IF/ELSE theo điều kiện mở mail, bấm link hoặc chưa phản hồi.',
    image: '/imgs/enterprise/sol-flow-branching.webp',
    routeUrl: '/automation',
    routeLabel: 'Trang Automation',
    inspectionTab: 'autoflow',
    highlights: [
      'Visual Flow Builder thiết lập Wait Time & điều kiện IF / ELSE trực quan',
      'Chăm sóc kịch bản đa chặng kết hợp Email Amazon SES & Zalo ZNS',
      'CRM Pipeline 8 nấc + Form rào cản TTL1 chống Sale bỏ sót Lead',
      'Tự động bắn Meta CAPI & điều chuyển nhánh khi đủ điểm Lead Score',
    ],
  },
  {
    id: 'ai-omnichannel',
    step: '03',
    tag: 'ENTERPRISE AI • SETUP & KẾT NỐI ĐA KÊNH',
    title: 'Training AI Nội Bộ & Chatbot Kết Nối Toàn Kênh',
    shortDesc: 'Nạp tài liệu PDF bảng giá, chính sách; Chatbot trả lời tự động 24/7 đồng bộ trên cả 6 kênh.',
    image: '/imgs/enterprise/sol-ai-omnichannel.webp',
    routeUrl: '/automation',
    routeLabel: 'Trang AI Space',
    inspectionTab: 'autoflow',
    highlights: [
      'Setup AI Training từ PDF bảng giá, hợp đồng & quy trình doanh nghiệp',
      'AI Space phân quyền riêng cho Sales, Marketing, HR & CSKH 24/7',
      'Kết nối đa kênh: Website Live Chat, ZaloBot, Telegram Bot, Zalo OA & Facebook Messenger',
      'Đồng bộ kịch bản phản hồi sang Zalo ZNS & Email giao dịch tự động',
    ],
  },
];

export const SOLUTION_PILLARS: SolutionPillar[] = [
  {
    id: 'data-capi',
    num: '01',
    badge: 'AUTO DATA & CAPI',
    title: 'Auto Chia Data &',
    editorialAccent: 'Meta CAPI HTTP 200',
    summary:
      'Thu Lead tức thì, lọc trùng 6 tháng, chia đều qua ZaloBot & Telegram Bot < 5s và phản hồi Meta CAPI 24/7.',
    illustration: '/imgs/enterprise/sol-data-capi.webp',
    decorPng: DECOR_PNGS.funnel,
    highlights: [
      'Round-Robin 5 cổng & Van chống ôm Lead quá 2 phút',
      'Bắn Meta CAPI cả Qualified & Notlead chuẩn SHA-256',
      'Đối soát bù Ticket lỗi giữa các Sàn F1 minh bạch',
      'Báo cáo ZaloBot & Telegram cuối ngày tự động cho Quản lý',
    ],
    routeUrl: '/data',
    liveDemoUrl: 'https://ideas-data.vercel.app/demo',
    liveDemoLabel: 'Mở Demo Auto Data',
    screenCountLabel: 'Xem 8 màn hình thực tế',
  },
  {
    id: 'erp',
    num: '02',
    badge: 'ERP 5.0 • 12 PHÂN HỆ',
    title: 'Vận Hành ERP:',
    editorialAccent: 'Task, Nhân Sự & Phê Duyệt',
    summary:
      'Điều hành doanh nghiệp toàn diện: Task Kanban, Chấm công GPS AI, Bảng lương PDF và Phê duyệt đa cấp.',
    illustration: '/imgs/enterprise/sol-erp-operations.webp',
    decorPng: DECOR_PNGS.shield,
    highlights: [
      'Task Kanban thông minh, KPI phòng ban & quản lý chi phí',
      'Chấm công định vị GPS văn phòng + Selfie AI nhận diện ca',
      'Quy trình phê duyệt đơn từ, nghỉ phép, tăng ca & Purchase Order',
      'Bảng tính lương Payroll Engine tự động xuất PDF ký số',
    ],
    routeUrl: '/erp',
    screenCountLabel: 'Xem 16 màn hình ERP 5.0',
  },
  {
    id: 'crm',
    num: '03',
    badge: 'CRM 360° & BÁN HÀNG',
    title: 'CRM Chăm Sóc &',
    editorialAccent: 'Quản Trị Bán Hàng 360°',
    summary:
      'Pipeline Kanban 8 nấc, Hồ sơ 360°, Giỏ hàng real-time và xuất hóa đơn bán hàng.',
    illustration: '/imgs/enterprise/sol-crm-misa.webp',
    decorPng: DECOR_PNGS.prism,
    highlights: [
      'Pipeline Kanban 8 nấc từ Tiếp nhận đến Booking & Đặt cọc',
      'Giỏ hàng sản phẩm live & Hợp tác số chia hoa hồng 100%',
      'Đồng bộ dữ liệu 2 chiều qua Webhook & hệ thống hóa đơn điện tử',
      'Nhắc việc tự động, ma trận nhiệt độ & rào cản chống sót Lead',
    ],
    routeUrl: '/crm',
    liveDemoUrl: 'https://crm-domation.vercel.app/',
    liveDemoLabel: 'Mở Demo CRM 4.0',
    screenCountLabel: 'Xem 10 màn hình CRM',
  },
  {
    id: 'autoflow',
    num: '04',
    badge: 'FLOW CONDITION & AI CHATBOT',
    title: 'Marketing Flow Rẽ Nhánh &',
    editorialAccent: 'AI Training Đa Kênh',
    summary:
      'Kịch bản Email SES & ZNS rẽ nhánh IF/ELSE theo điều kiện hành vi; Chatbot AI kết nối Web, ZaloBot, Telegram, OA, Mess, Mail.',
    illustration: '/imgs/enterprise/sol-flow-branching.webp',
    decorPng: DECOR_PNGS.torus,
    highlights: [
      'Flow Builder rẽ nhánh IF / ELSE & Condition theo click/scroll/score',
      'Email Drag & Drop Amazon SES (98% Inbox) + Zalo ZNS + Voucher Hub',
      'Setup AI Training từ PDF bảng giá, kịch bản & chính sách nội bộ',
      'AI Chatbot kết nối trực tiếp Website, ZaloBot, Telegram, Zalo OA, Mess & Mail',
    ],
    routeUrl: '/automation',
    screenCountLabel: 'Xem 9 màn hình Automation',
  },
  {
    id: 'meta-report',
    num: '05',
    badge: 'META GRAPH API',
    title: 'Báo Cáo Quảng Cáo',
    editorialAccent: 'Realtime & Hook Rate',
    summary:
      'Đối chiếu chi phí Meta Ads với Lead Thiện chí và Doanh thu thực trên CRM, đo Hook Rate chuẩn xác.',
    illustration: '/imgs/enterprise/sol-web3d-meta.webp',
    decorPng: DECOR_PNGS.prism,
    highlights: [
      'Tính CPL thực & Cost / Qualified Lead theo từng mẫu Ad',
      'Phân tích Video Hook Rate, Hold Rate & Creative Fatigue',
      'Thống kê Khung Giờ Vàng chốt đơn & Admin Audit Log',
      'Kết nối trực tiếp Graph API minh bạch từng đồng chi phí',
    ],
    routeUrl: '/meta-report',
    liveDemoUrl: 'https://meta.domation.net',
    liveDemoLabel: 'Mở Meta Report Portal',
    screenCountLabel: 'Xem 6 màn hình + Video Demo',
  },
  {
    id: 'web-3d',
    num: '06',
    badge: 'WEB CHUYỂN ĐỔI & 3D',
    title: 'Website Doanh Nghiệp &',
    editorialAccent: 'Sa Bàn Tương Tác',
    summary:
      'Website chuẩn thương hiệu tốc độ < 3s, sa bàn căn hộ Three.js, gắn sẵn Tracking đồng bộ CRM & ZaloBot.',
    illustration: '/imgs/enterprise/hero-domation-hub.webp',
    decorPng: DECOR_PNGS.torus,
    highlights: [
      'UI/UX thiết kế riêng theo bộ nhận diện & chuẩn SEO kỹ thuật',
      'Tích hợp Three.js tương tác 8 mẫu căn hộ 3D bóc mái mượt mà',
      'Gắn sẵn Tracking hành vi, Form Webhook & Meta CAPI server-side',
      'Bảng dự toán chi phí minh bạch khởi điểm từ 12.000.000₫',
    ],
    routeUrl: '/web-design',
    liveDemoUrl: 'https://ai.ecolifesignature.vn/',
    liveDemoLabel: 'Xem Flagship EcoLife',
    screenCountLabel: 'Xem 8 căn hộ 3D & 6 Web Live',
  },
];

export const ECOSYSTEM_18_MODULES = [
  { id: 'chia-data', group: 'Data & Ads', name: 'Phân Bổ Data V2', tag: 'Routing', desc: 'Chia số ZaloBot dưới 5s cho Đại lý F1 & Sale.' },
  { id: 'meta-capi', group: 'Data & Ads', name: 'Auto Bắn Meta CAPI', tag: 'CAPI 200', desc: 'Phản hồi Qualified / Notlead về Meta Dataset.' },
  { id: 'meta-api', group: 'Data & Ads', name: 'Meta Ads API Report', tag: 'Analytics', desc: 'Đối chiếu chi phí Graph API & doanh thu CRM.' },
  { id: 'web-tracking', group: 'Data & Ads', name: 'Behavior Tracking', tag: 'Pixel', desc: 'Đo lượt click/scroll chấm điểm Lead Score.' },
  { id: 'qr-tracking', group: 'Data & Ads', name: 'QR Offline Tracking', tag: 'O2O', desc: 'Đo lường quét QR Standee & ấn phẩm sự kiện.' },

  { id: 'campaigns', group: 'Automation', name: 'Email SES & Zalo ZNS', tag: 'Omnichannel', desc: 'Chiến dịch Email SES 98% Inbox & ZNS tự động.' },
  { id: 'automation', group: 'Automation', name: 'Flow Rẽ Nhánh IF/ELSE', tag: 'Condition', desc: 'Kịch bản chăm sóc rẽ nhánh theo điều kiện hành vi.' },
  { id: 'email-design', group: 'Automation', name: 'Email Builder Kéo Thả', tag: 'Template', desc: 'Thiết kế email chiến dịch nhanh không cần code.' },
  { id: 'zalo-connect', group: 'Automation', name: 'ZaloBot & OA & Mess', tag: 'Channels', desc: 'Kết nối ZaloBot, Zalo OA, Messenger & Email.' },
  { id: 'voucher-hub', group: 'Automation', name: 'Voucher Hub Real-Time', tag: 'Loyalty', desc: 'Phát mã ưu đãi động tự động trong Flow.' },
  { id: 'survey-builder', group: 'Automation', name: 'Survey & Lead Score', tag: 'Qualify', desc: 'Khảo sát nhu cầu và tự chấm điểm tiềm năng.' },

  { id: 'crm-360', group: 'CRM & ERP', name: 'CRM Chăm Sóc 8 Nấc', tag: 'Pipeline', desc: 'Pipeline 360°, giỏ hàng live & chống sót Lead.' },
  { id: 'erp-suite', group: 'CRM & ERP', name: 'ERP Task & Phê Duyệt', tag: 'ERP 5.0', desc: 'Task Kanban, KPI & duyệt đơn từ/chi phí đa cấp.' },
  { id: 'gps-payroll', group: 'CRM & ERP', name: 'Nhân Sự GPS & Payroll', tag: 'HRM', desc: 'Chấm công GPS Selfie AI & xuất phiếu lương PDF.' },
  { id: 'api-triggers', group: 'CRM & ERP', name: 'Hóa đơn ĐT & Webhook 2 Chiều', tag: 'Sync', desc: 'Đồng bộ hóa đơn điện tử, Sheets & hệ ngoại vi.' },

  { id: 'ai-training', group: 'AI & Web 3D', name: 'Setup AI Training PDF', tag: 'Knowledge', desc: 'Nạp PDF bảng giá, quy trình & tri thức nội bộ.' },
  { id: 'ai-space', group: 'AI & Web 3D', name: 'AI Chatbot Đa Kênh', tag: '24/7 Bot', desc: 'Trợ lý AI kết nối Web, ZaloBot, OA, Mess, ZNS & Mail.' },
  { id: 'web-design', group: 'AI & Web 3D', name: 'Web Chuyển Đổi & 3D', tag: 'Frontend', desc: 'Website tốc độ < 3s chuẩn SEO & sa bàn WebGL.' },
];

export const MODAL_SCREEN_GALLERIES: Record<
  SolutionPillar['id'] | 'inkica',
  {
    title: string;
    subtitle: string;
    liveUrl?: string;
    liveLabel?: string;
    youtubeEmbed?: string;
    items: ScreenItem[];
  }
> = {
  'data-capi': {
    title: 'CRM Auto Data & Đối Soát Quảng Cáo — 8 Màn Hình Thực Tế',
    subtitle:
      'Giao diện chia khách dưới 5 giây qua ZaloBot & Telegram, lọc trùng tự động, đối soát công bằng và hợp nhất trực tiếp với Báo cáo Meta Ads.',
    liveUrl: '/data',
    liveLabel: 'Mở CRM Auto Data',
    items: [
      {
        src: '/imgs/autodata/showcase/screen_dashboard.jpg',
        badge: '01 • TỔNG QUAN CHIA DATA',
        title: 'Tổng Quan Phân Bổ Data Real-Time',
        desc: 'Theo dõi tức thì tổng lượng khách về, tỷ lệ chia thành công 100%, số lượng lọc trùng và xếp hạng Sale/Đại lý nhận khách.',
      },
      {
        src: '/imgs/autodata/showcase/screen_datalist.jpg',
        badge: '02 • QUẢN LÝ DANH SÁCH DATA',
        title: 'Danh Sách Khách Hàng Gắn Sẵn Bài Quảng Cáo',
        desc: 'Che SĐT bảo mật, hiển thị rõ bài quảng cáo mang khách về, đơn vị phụ trách và trạng thái đánh giá chất lượng cuộc gọi.',
      },
      {
        src: '/imgs/meta-screens/fusion-campaign-crm-leads.webp',
        badge: '03 • HỢP NHẤT ADS & LEAD CRM',
        title: 'Đo Lường Lead CRM, CPQL Thực & Sale Trên Từng Bài Ads',
        desc: 'Nhìn thấu từng chiến dịch và bài quảng cáo tạo ra bao nhiêu khách chất lượng, giao cho Sale nào và mang về bao nhiêu doanh thu.',
      },
      {
        src: '/imgs/meta-screens/fusion-ad-leads-sale-modal.webp',
        badge: '04 • CHI TIẾT KHÁCH THEO BÀI ADS',
        title: 'Xem Từng Khách Hàng & Phân Bổ Sale Trong Mỗi Bài Quảng Cáo',
        desc: 'Bấm vào bất kỳ bài quảng cáo nào để xem danh sách khách chi tiết, Sale đang chăm, vòng chia và mở thẳng hồ sơ khách.',
      },
      {
        src: '/imgs/meta-screens/fusion-quick-connect-crm.webp',
        badge: '05 • KẾT NỐI NHANH 1 CHẠM',
        title: 'Kích Hoạt Báo Cáo Meta Ads & CAPI Ngay Trong CRM',
        desc: 'Tự nhận diện tài khoản quảng cáo đã kết nối sẵn để bật báo cáo trong 1 chạm, không cần cấu hình lặp lại.',
      },
      {
        src: '/imgs/autodata/showcase/screen_fairshare.jpg',
        badge: '06 • ĐỐI SOÁT CÔNG BẰNG',
        title: 'Bảng Thống Kê Độ Lệch & Bù Data Minh Bạch',
        desc: 'Cân bằng tự động giữa các Sale và Đại lý, kiểm soát ticket báo lỗi và bù số minh bạch theo thời gian thực.',
      },
      {
        src: '/imgs/autodata/showcase/screen_rounds.jpg',
        badge: '07 • VÒNG PHÂN BỔ ĐA DỰ ÁN',
        title: 'Thiết Lập Vòng Chia Theo Dự Án, Tỷ Lệ & Khung Giờ',
        desc: 'Cấu hình linh hoạt nhiều vòng chia độc lập cho từng chiến dịch, từng nhóm Sale và khung giờ làm việc.',
      },
      {
        src: '/imgs/autodata/showcase/screen_integrations.jpg',
        badge: '08 • KẾT NỐI ĐA KÊNH & CAPI',
        title: 'Tích Hợp ZaloBot, Telegram, Email & Phản Hồi Meta CAPI',
        desc: 'Kết nối đa nguồn đổ khách và tự động phản hồi khách chất lượng về Meta để tối ưu chi phí quảng cáo.',
      },
    ],
  },
  erp: {
    title: 'DOMATION Enterprise ERP 5.0 — 18 Màn Hình Phân Hệ Thực Tế',
    subtitle:
      'Trọn bộ giao diện DOMATION ERP phiên bản mới: Dashboard điều hành, Pipeline bán hàng Kanban, Chấm công GPS, Phê duyệt đa cấp, Chi phí & Marketing đa kênh.',
    liveUrl: '/erp',
    liveLabel: 'Mở Trang ERP 5.0',
    items: [
      {
        category: 'Hệ thống & Cài đặt',
        src: '/imgs/erp_v3/automation.png',
        badge: 'DOM ERP 5.0',
        title: 'Màn Hình Khởi Động Hệ Điều Hành DOM ERP',
        desc: 'Nhận diện thống nhất hệ sinh thái DOMATION Enterprise ERP & AI vận hành đa phòng ban.',
      },
      {
        category: 'Vận hành & Lead',
        src: '/imgs/erp-screens/dashboard-lead.webp',
        badge: 'EXECUTIVE DASHBOARD',
        title: 'Tổng Quan Điều Hành & Phân Bổ Data Real-Time',
        desc: 'Nắm trọn lượng khách tiếp nhận, tỷ lệ xử lý đúng hạn SLA, biểu đồ hiệu suất ngày và lịch sử chia data.',
      },
      {
        category: 'Vận hành & Lead',
        src: '/imgs/erp-screens/data-log.webp',
        badge: 'DATA LOG',
        title: 'Nhật Ký & Quản Lý Data Tập Trung',
        desc: 'Ghi nhận đầy đủ trạng thái chia, Sale phụ trách, vòng chia và lịch sử chăm sóc cho từng khách hàng.',
      },
      {
        category: 'Vận hành & Lead',
        src: '/imgs/erp-screens/fair-share.webp',
        badge: 'FAIRNESS AUDIT',
        title: 'Đối Soát Công Bằng Phân Phối Theo Sale',
        desc: 'Đo lường chỉ số công bằng, độ lệch chuẩn và cân bằng chất lượng nguồn khách giữa toàn đội ngũ.',
      },
      {
        category: 'Vận hành & Lead',
        src: '/imgs/erp-screens/rounds.webp',
        badge: 'ROUND-ROBIN',
        title: 'Vòng Phân Bổ Tự Động Theo Dự Án',
        desc: 'Quản trị đồng thời nhiều vòng chia độc lập theo dự án, biết ngay nhân sự nào đang tới lượt nhận khách.',
      },
      {
        category: 'CRM & Khách hàng',
        src: '/imgs/erp-screens/deals.webp',
        badge: 'PIPELINE KANBAN',
        title: 'Pipeline Khách Hàng Kéo Thả Theo Giai Đoạn',
        desc: 'Quản lý từng cơ hội bán hàng từ tiếp nhận, tư vấn, hẹn gặp đến đặt cọc ngay trên bảng Kanban trực quan.',
      },
      {
        category: 'CRM & Khách hàng',
        src: '/imgs/erp-screens/contacts.webp',
        badge: 'CONTACT 360°',
        title: 'Danh Sách Tiềm Năng & Hồ Sơ 360 Độ',
        desc: 'Lọc nhanh theo trạng thái, xem nhật ký tương tác gần nhất và toàn bộ lịch sử chăm sóc của từng khách.',
      },
      {
        category: 'CRM & Khách hàng',
        src: '/imgs/erp-screens/students.webp',
        badge: 'WON CUSTOMERS',
        title: 'Khách Hàng Đã Chốt & Quản Lý Hợp Đồng',
        desc: 'Theo dõi mã khách hàng, sản phẩm/dịch vụ đã ký kết, tiến độ bàn giao và nhân sự phụ trách.',
      },
      {
        category: 'CRM & Khách hàng',
        src: '/imgs/erp-screens/companies.webp',
        badge: 'B2B PARTNERS',
        title: 'Đối Tác & Khách Hàng Doanh Nghiệp',
        desc: 'Quản trị hồ sơ đối tác B2B, phân hạng khách hàng doanh nghiệp và lịch sử giao dịch theo công ty.',
      },
      {
        category: 'Tài chính & Phê duyệt',
        src: '/imgs/erp-screens/approvals.webp',
        badge: 'APPROVAL FLOW',
        title: 'Quy Trình & Phê Duyệt Đa Cấp Trực Tuyến',
        desc: 'Duyệt đơn nghỉ phép, tạm ứng, hoa hồng và đề xuất vận hành rõ người tạo, người duyệt và thời gian.',
      },
      {
        category: 'Tài chính & Phê duyệt',
        src: '/imgs/erp-screens/expenses.webp',
        badge: 'PURCHASE ORDER',
        title: 'Quản Lý Chi Phí Vận Hành & Đề Xuất Chi',
        desc: 'Kiểm soát chặt chẽ từng khoản chi, trạng thái thanh toán và luồng xét duyệt minh bạch.',
      },
      {
        category: 'Nhân sự & Chấm công',
        src: '/imgs/erp-screens/attendance.webp',
        badge: 'ATTENDANCE',
        title: 'Quản Lý Chấm Công Theo Tháng Toàn Công Ty',
        desc: 'Tổng hợp ngày công, đi muộn, nghỉ phép và xuất bảng công tự động chuẩn xác từng nhân sự.',
      },
      {
        category: 'Nhân sự & Chấm công',
        src: '/imgs/erp-screens/attendance-detail.webp',
        badge: 'GPS CHECK-IN',
        title: 'Chi Tiết Chấm Công Theo Ngày & Vị Trí GPS',
        desc: 'Xem rõ giờ vào/ra ca từng nhân sự kèm vị trí check-in thực tế và đối soát ca trực.',
      },
      {
        category: 'Nhân sự & Chấm công',
        src: '/imgs/erp-screens/consultants.webp',
        badge: 'COMPANY STAFF',
        title: 'Danh Sách Nhân Sự & Kênh Nhận Thông Báo',
        desc: 'Quản lý tài khoản nhân viên, kết nối ZaloBot/Telegram nhận việc và trạng thái hoạt động.',
      },
      {
        category: 'Hệ thống & Cài đặt',
        src: '/imgs/erp-screens/marketing.webp',
        badge: 'MARKETING HUB',
        title: 'Trung Tâm Marketing Đa Kênh & Automation',
        desc: 'Tập hợp chiến dịch Email, Zalo OA, Automation, AI Training, Voucher, Khảo sát và Báo cáo Meta Ads.',
      },
      {
        category: 'Hệ thống & Cài đặt',
        src: '/imgs/erp-screens/settings.webp',
        badge: 'SYSTEM RULES',
        title: 'Cài Đặt Nghiệp Vụ, SLA & Phân Quyền Linh Hoạt',
        desc: 'Tùy biến hạn mức nhận khách, thời gian phản hồi, quy tắc đặt cọc và phân quyền ngay trên giao diện.',
      },
      {
        category: 'Hệ thống & Cài đặt',
        src: '/imgs/erp-screens/quick-menu-1.jpg',
        badge: 'QUICK MENU 1',
        title: 'Điều Hướng Nhanh Toàn Bộ Phân Hệ (Phần 1)',
        desc: 'Truy cập một chạm vào Dashboard, Quy trình, Tài chính, Pipeline, Nhật ký Data và Trợ lý nội bộ.',
      },
      {
        category: 'Hệ thống & Cài đặt',
        src: '/imgs/erp-screens/quick-menu-2.jpg',
        badge: 'QUICK MENU 2',
        title: 'Hệ Sinh Thái Phân Hệ Mở Rộng (Phần 2)',
        desc: 'Kết nối mượt mà Marketing Automation, Đào tạo AI, Nhân sự & Lương, Phòng ban và Cấu hình hệ thống.',
      },
    ],
  },
  crm: {
    title: 'DOMATION CRM 360° & Quản Trị Bán Hàng — 9 Màn Hình Thực Tế',
    subtitle:
      'Trọn bộ giao diện Pipeline bán hàng Kanban, Hồ sơ khách hàng 360°, chia số tự động và truy vết từ bài quảng cáo đến hợp đồng.',
    liveUrl: '/crm',
    liveLabel: 'Khám Phá CRM 360°',
    items: [
      {
        src: '/imgs/erp-screens/deals.webp',
        badge: 'CRM #01',
        title: 'Pipeline Bán Hàng Kanban Theo Từng Giai Đoạn',
        desc: 'Theo dõi trực quan toàn bộ khách hàng đang tư vấn, hẹn gặp, đặt cọc và chốt hợp đồng.',
      },
      {
        src: '/imgs/erp-screens/contacts.webp',
        badge: 'CRM #02',
        title: 'Quản Lý Hồ Sơ Khách Hàng 360 Độ',
        desc: 'Gom trọn lịch sử gọi điện, ghi chú, nhu cầu và nhân sự phụ trách trên một bảng duy nhất.',
      },
      {
        src: '/imgs/erp-screens/students.webp',
        badge: 'CRM #03',
        title: 'Quản Trị Khách Hàng Đã Chốt & Hợp Đồng',
        desc: 'Chuyển đổi mượt mà từ khách tiềm năng sang hồ sơ hợp đồng và theo dõi chăm sóc sau bán.',
      },
      {
        src: '/imgs/erp-screens/companies.webp',
        badge: 'CRM #04',
        title: 'Quản Lý Đối Tác & Khách Hàng Doanh Nghiệp B2B',
        desc: 'Phân hạng đối tác, theo dõi nhiều đầu mối liên hệ và lịch sử giao dịch theo tổ chức.',
      },
      {
        src: '/imgs/autodata/showcase/screen_dashboard.jpg',
        badge: 'CRM #05',
        title: 'Tổng Quan Lưu Lượng Lead & Tốc Độ Phân Bổ',
        desc: 'Đo lường lưu lượng khách đổ về theo ngày/giờ và hiệu suất tiếp nhận của từng Sale.',
      },
      {
        src: '/imgs/autodata/showcase/screen_datalist.jpg',
        badge: 'CRM #06',
        title: 'Lọc Trùng SĐT & Đánh Giá Chất Lượng Cuộc Gọi',
        desc: 'Tự động chặn trùng số, phân loại khách thiện chí/chưa nghe máy và gắn bài quảng cáo gốc.',
      },
      {
        src: '/imgs/meta-screens/fusion-ad-leads-sale-modal.webp',
        badge: 'CRM #07',
        title: 'Truy Vết Từ Bài Quảng Cáo Đến Sale Chốt Đơn',
        desc: 'Xem ngay bài quảng cáo nào tạo ra danh sách khách hàng nào, ai chăm và mang về bao nhiêu doanh thu.',
      },
      {
        src: '/imgs/erp-screens/fair-share.webp',
        badge: 'CRM #08',
        title: 'Báo Cáo Hiệu Suất Sale & Đối Soát Công Bằng',
        desc: 'Xếp hạng tỷ lệ chuyển đổi theo cá nhân, vòng chia và cân bằng phân bổ minh bạch.',
      },
      {
        src: '/imgs/erp-screens/marketing.webp',
        badge: 'CRM #09',
        title: 'Chăm Sóc Đa Kênh Zalo, Email & Kịch Bản Tự Động',
        desc: 'Kích hoạt chuỗi chăm sóc tự động, gửi ưu đãi và đồng bộ phản hồi chất lượng về Meta CAPI.',
      },
    ],
  },
  autoflow: {
    title: 'Marketing Đa Kênh, Automation & AI Nội Bộ — 6 Màn Hình Thực Tế',
    subtitle:
      'Trung tâm điều phối chiến dịch Email, Zalo OA, kịch bản chăm sóc tự động, AI đào tạo theo dữ liệu công ty và mạng xã hội nội bộ.',
    liveUrl: '/automation',
    liveLabel: 'Mở Trang Automation',
    items: [
      {
        src: '/imgs/erp-screens/marketing.webp',
        badge: 'MARKETING HUB',
        title: 'Trung Tâm Marketing & Tự Động Hóa Đa Kênh',
        desc: 'Quản lý tập trung chiến dịch gửi hàng loạt, kịch bản tự động, mẫu Email, Voucher, Khảo sát và AI.',
      },
      {
        src: '/imgs/erp-screens/quick-menu-2.jpg',
        badge: 'AI & AUTOMATION',
        title: 'Hệ Sinh Thái Kịch Bản, AI Training & Kênh Tích Hợp',
        desc: 'Kết nối liền mạch Đào tạo AI nội bộ, Social Bot, Web Tracking, Meta CAPI và Webhook 2 chiều.',
      },
      {
        src: '/imgs/autodata/showcase/screen_integrations.jpg',
        badge: 'ĐỒNG BỘ KÊNH',
        title: 'Kết Nối ZaloBot, Telegram, Email & Meta Tự Động',
        desc: 'Tự động gửi thông báo tức thì khi có khách mới, nhắc hẹn và cập nhật trạng thái chăm sóc.',
      },
      {
        src: '/imgs/meta-screens/fusion-quick-connect-crm.webp',
        badge: 'KẾT NỐI 1 CHẠM',
        title: 'Tự Động Đồng Bộ Tài Khoản Quảng Cáo & Tệp Khách',
        desc: 'Liên kết 2 chiều dữ liệu khách hàng với tài khoản quảng cáo để tối ưu tệp đối tượng tự động.',
      },
      {
        src: '/imgs/erp-screens/settings.webp',
        badge: 'LUẬT VẬN HÀNH',
        title: 'Thiết Lập Luật Chăm Sóc, SLA & Tự Động Hóa',
        desc: 'Cấu hình điều kiện phân luồng, nhắc lịch và tự động thu hồi/chuyển tiếp khi quá hạn phản hồi.',
      },
      {
        src: '/imgs/erp-screens/feed.webp',
        badge: 'CỘNG ĐỒNG NỘI BỘ',
        title: 'Bảng Tin Doanh Nghiệp & Vinh Danh Thành Tích',
        desc: 'Kết nối đội ngũ, tự động cập nhật tin tức vận hành và vinh danh nhân sự xuất sắc ngay trong hệ thống.',
      },
    ],
  },
  'meta-report': {
    title: 'DOM Meta Report & Mở Rộng Google Ads — 9 Màn Hình + Video Demo',
    subtitle:
      'Báo cáo quảng cáo Meta realtime, mở rộng theo dõi Google Ads khi cần và hợp nhất trực tiếp với Lead CRM & Sale phụ trách.',
    liveUrl: '/meta-report',
    liveLabel: 'Mở DOM Meta Report',
    youtubeEmbed: 'https://www.youtube.com/embed/fvIHSrpsAlI',
    items: [
      {
        src: '/imgs/meta-screens/meta-dashboard.webp',
        badge: 'REPORT #01',
        title: 'Tổng Quan Chi Tiêu & Hiệu Suất Quảng Cáo Real-Time',
        desc: 'Theo dõi tức thì tổng chi tiêu, tăng giảm so với kỳ trước, biểu đồ ngày, nền tảng và độ tuổi khách hàng.',
      },
      {
        src: '/imgs/meta-screens/fusion-campaign-crm-leads.webp',
        badge: 'REPORT #02',
        title: 'Bảng Chiến Dịch Hợp Nhất Lead CRM, CPQL & Sale',
        desc: 'Đối chiếu trực tiếp chi phí từng chiến dịch, nhóm và bài quảng cáo với khách chất lượng, doanh thu và Sale phụ trách.',
      },
      {
        src: '/imgs/meta-screens/fusion-ad-leads-sale-modal.webp',
        badge: 'REPORT #03',
        title: 'Xem Từng Khách Hàng & Phân Bổ Sale Trong Từng Bài Ads',
        desc: 'Bấm vào bất kỳ bài chạy nào để xem danh sách khách, Sale đang gọi, trạng thái chất lượng và doanh thu chốt.',
      },
      {
        src: '/imgs/meta-screens/meta-heatmap-region.webp',
        badge: 'REPORT #04',
        title: 'Bản Đồ Nhiệt Khung Giờ Ra Khách & Tỉnh Thành',
        desc: 'Chỉ rõ khung giờ vàng 7 ngày × 24 giờ và tỉnh thành mang về khách rẻ nhất để tập trung ngân sách.',
      },
      {
        src: '/imgs/meta-screens/meta-ad-detail-modal.webp',
        badge: 'REPORT #05',
        title: 'Phân Tích Giữ Chân Video 3 Giây & Tần Suất Lặp',
        desc: 'Đánh giá chính xác tỷ lệ giữ chân 3 giây đầu, tỷ lệ xem hết video và cảnh báo sớm khi mẫu quảng cáo bão hòa.',
      },
      {
        src: '/imgs/meta-screens/meta-performance-compare-modal.webp',
        badge: 'REPORT #06',
        title: 'So Sánh Trực Diện Hiệu Quả Giữa Hai Giai Đoạn',
        desc: 'Đối chiếu nhanh chi tiêu, tiếp cận, lượt nhấp và chi phí/khách giữa hai chu kỳ ngay trên một bảng.',
      },
      {
        src: '/imgs/meta-screens/meta-ads-library.webp',
        badge: 'REPORT #07',
        title: 'Thư Viện Trực Quan Toàn Bộ Bài Quảng Cáo Đang Chạy',
        desc: 'Xem trực tiếp hình ảnh, video kèm chi phí, số khách thu về và nút mở thẳng bài viết gốc trên Facebook.',
      },
      {
        src: '/imgs/meta-screens/meta-ad-account-logs.webp',
        badge: 'REPORT #08',
        title: 'Quản Lý Nhiều Tài Khoản & Lịch Sử Thao Tác',
        desc: 'Theo dõi trạng thái tài khoản, hạn mức chi tiêu và toàn bộ lịch sử bật/tắt, chỉnh sửa ngân sách.',
      },
      {
        src: '/imgs/meta-screens/meta-google-ads-guide-modal.webp',
        badge: 'REPORT #09',
        title: 'Mở Rộng Báo Cáo Google Ads Trên Cùng Giao Diện',
        desc: 'Bật thêm báo cáo Google Ads bất cứ khi nào cần với hướng dẫn thiết lập từng bước đơn giản.',
      },
    ],
  },
  'web-3d': {
    title: 'Website Chuyển Đổi & Sa Bàn 3D Đã Triển Khai',
    subtitle: 'Hệ thống Website, Landing Page chuẩn SEO và công nghệ Sa bàn 3D bóc mái trực tiếp trên trình duyệt.',
    liveUrl: '/web-design',
    liveLabel: 'Báo giá Website & 3D',
    items: [
      { src: '/assets/ecolife/ecolife_official_live.jpg', badge: 'BĐS XANH • WEBSITE', title: 'EcoLife Signature (ecolifesignature.vn)', desc: 'Website dự án chuẩn Quiet Luxury tích hợp Trợ lý AI Sale & đẩy Lead CRM.' },
      { src: '/landingpage_avatar/nava.webp', badge: 'E-COMMERCE', title: 'Nava Store (navastore.vn)', desc: 'Website thương mại điện tử tối ưu mua hàng, gắn Pixel Tracking sâu.' },
      { src: '/landingpage_avatar/ideasmba.webp', badge: 'EDUCATION MBA', title: 'Viện IDEAS MBA (ideas.edu.vn/mba)', desc: 'Landing Page tuyển sinh Thạc sĩ Quản trị Kinh doanh Quốc tế.' },
      { src: '/landingpage_avatar/flora.webp', badge: 'NHA KHOA • SỰ KIỆN', title: 'Nha Khoa Flora — Ngày Hội Implant', desc: 'Landing Page sự kiện y khoa tối ưu đăng ký và đồng bộ tổng đài.' },
      { src: '/landingpage_avatar/brandson.webp', badge: 'MEDICAL ACADEMY', title: 'Brandson Academy (brandson.vn)', desc: 'Landing Page đào tạo Nha khoa CME tỷ lệ chuyển đổi Lead cao.' },
      { src: '/landingpage_avatar/ideasedu.webp', badge: 'INSTITUTIONAL', title: 'Viện Đào Tạo IDEAS (ideas.edu.vn)', desc: 'Cổng thông tin đa trang & hệ thống SEO từ khóa Top 1 Google.' },
      { src: '/assets/ecolife/bocmai/bocmai_3d_a1.webp', badge: '3D CĂN A1 • 66M²', title: 'Sa Bàn 3D Bóc Mái Căn 2PN A1', desc: 'Trình diễn WebGL Three.js xoay 360 độ trực tiếp trên trình duyệt.' },
      { src: '/assets/ecolife/bocmai/bocmai_3d_b3.webp', badge: '3D CĂN B3 • 88.8M²', title: 'Sa Bàn 3D Bóc Mái Căn Góc Panorama B3', desc: 'Hiển thị chuẩn vật liệu & bố trí công thái học từng phòng.' },
      { src: '/assets/flora/flora_admin_dashboard.webp', badge: 'AFFILIATE ADMIN', title: 'Nha Khoa Flora — Trung Tâm Quản Trị KOL & Đơn Hàng', desc: 'Quản lý đối tác liên kết, đối soát đơn VietQR ACB & duyệt chi trả Napas 24/7.' },
      { src: '/assets/flora/flora_checkout_qr.webp', badge: 'VIETQR CHECKOUT', title: 'Cổng Đặt Gói Care Plus / White Up & VietQR ACB', desc: 'Tự động gán mã REF KOL vào cú pháp chuyển khoản không lo thất lạc đơn.' },
      { src: '/landingpage_avatar/kaen_event.webp', badge: 'F&B • SỰ KIỆN', title: 'KA-EN Japanese Event (ka-en.com.vn/event)', desc: 'Microsite đặt bàn sự kiện ẩm thực Nhật Bản cao cấp.' },
    ],
  },
  inkica: {
    title: 'INKICA AI POD Studio — Đối Tác Công Nghệ Prepress & 3D',
    subtitle: '5 phân hệ lõi tại ai.inkica.com: Neural Extract 300 DPI, AOP 3D CAD 208 SKU, Multi-Color Mockup & Chat Orchestrator.',
    liveUrl: 'https://ai.inkica.com/',
    liveLabel: 'Truy Cập ai.inkica.com',
    items: [
      { src: '/assets/inkica/inkica_quick_mockup.jpg', badge: 'QUICK MOCKUP', title: 'Render Mockup 3D Người Mẫu Thật Đa Màu Vải', desc: 'Tạo mockup 4K chuẩn chân thực hàng loạt cho Catalog POD.' },
      { src: '/assets/inkica/inkica_orchestrator.jpg', badge: 'OMNI ORCHESTRATOR', title: '6 Tác Nhân AI Prepress Trong Một Khung Chat', desc: 'Tự động tách nền, redesign và xuất mockup từ lệnh chat tự nhiên.' },
      { src: '/assets/inkica/inkica_aop_3d.jpg', badge: 'AOP 3D CAD', title: 'Bóc Rập .PSD Bezier & Live 3D Mockup 4 Góc Xoay', desc: '208 SKU AOP & 88 Canonical Models chuẩn rập (0 px lệch đường may).' },
      { src: '/assets/inkica/inkica_extract_dynamic.jpg', badge: 'NEURAL EXTRACT', title: 'Tách Nền 300 DPI (SAM 3 + ViTMatte)', desc: 'Tách hình in PNG trong suốt từ ảnh chụp để áp ngay lên áo/cốc.' },
      { src: '/assets/inkica/inkica_template_mockup.jpg', badge: 'TEMPLATES HUB', title: 'Nhận Diện Phôi Trống & Quản Lý Thư Viện POD', desc: 'Quản lý kho phôi sản phẩm & template đồng bộ thương hiệu.' },
    ],
  },
};

export const CASE_STUDY_SPOTLIGHTS: CaseStudySpotlightItem[] = [
  {
    id: 'ecolife',
    company: 'Capital House • EcoLife Signature',
    sector: 'Bất Động Sản Xanh EDGE • Đà Nẵng',
    logo: '/assets/partners/logo_capital_house.webp',
    secondaryLogo: '/assets/partners/logo_ecolife_ngang.webp',
    result: '8 Mẫu Căn Hộ 3D',
    cost: 'Trợ Lý AI Sale',
    impact: '3 Đại Lý F1',
    tags: ['8 Mẫu Căn Hộ 3D', 'Trợ Lý AI Sale', '3 Đại Lý F1'],
    summary:
      'Thiết kế riêng không gian số Quiet Luxury tích hợp sa bàn 8 căn hộ 3D, Trợ lý AI Sale 24/7 và hệ thống chia số tự động cho 3 Đại lý F1.',
    inspectionTab: 'web-3d',
    url: 'https://ai.ecolifesignature.vn/',
  },
  {
    id: 'inkica',
    company: 'INKICA AI Studio',
    sector: 'AI Prepress & 3D Garment Studio',
    logo: '/assets/partners/logo_inkica_icon.svg',
    result: '208 SKU AOP 3D',
    cost: '6 AI Agents',
    impact: '300 DPI AI',
    tags: ['AI Agent Chat', '208 SKU 3D', '300 DPI AI'],
    summary:
      'Kiến tạo hệ điều hành 6 AI Prepress Agents tự động tách nền 300 DPI, bóc rập CAD chính xác và dựng mockup đa màu cho 208 mã sản phẩm.',
    inspectionTab: 'inkica',
    url: 'https://ai.inkica.com/',
  },
  {
    id: 'ideas',
    company: 'IDEAS Business',
    sector: 'Giáo Dục Sau Đại Học • MBA Quốc Tế',
    logo: '/assets/partners/logo_ideas.webp',
    result: '+300% Quy Mô',
    cost: '-30% CPA',
    impact: '12,600+ Leads',
    tags: ['ERP 5.0 May Đo', 'CRM Tuyển Sinh', 'Zalo Mini App'],
    summary:
      'May đo trọn bộ ERP 5.0 quản trị Task, Nhân sự, Phê duyệt kết hợp phễu tuyển sinh tự động nâng quy mô từ 20 lên 60 học viên/khóa.',
    inspectionTab: 'erp',
    url: 'https://ideas.edu.vn/mba',
  },
  {
    id: 'phucloctho',
    company: 'Phúc Lộc Thọ',
    sector: 'Chuỗi F&B & Nhượng Quyền 30+ Cửa Hàng',
    logo: '/assets/partners/logo_phucloctho.webp',
    result: '20+ Cửa Hàng Mới',
    cost: 'ROAS 5+',
    impact: '1,600+ Leads',
    tags: ['Flow ZNS & POS', 'Voucher Hub', 'CRM Nhượng Quyền'],
    summary:
      'Thiết kế luồng kết nối trực tiếp POS cửa hàng với Zalo ZNS tự động phát hành ưu đãi và phễu thu hút 1.600+ đối tác nhượng quyền.',
    inspectionTab: 'autoflow',
    url: 'https://phucloctho.vn',
  },
];

export const FLAGSHIP_PARTNERS: FlagshipPartner[] = [
  {
    id: 'capital-house',
    name: 'Capital House Group',
    role: 'CHỦ ĐẦU TƯ CHIẾN LƯỢC',
    subtitle:
      'Kiến tạo hạ tầng chuyển đổi số riêng cho Chủ đầu tư BĐS Xanh chuẩn IFC EDGE: Website thương hiệu, AI hỗ trợ Sale và CRM điều phối sàn.',
    logo: '/assets/partners/logo_capital_house.webp',
    url: 'https://chgroup.vn',
    badge: 'CHỦ ĐẦU TƯ • BĐS XANH',
    metrics: ['8 Mẫu Căn Hộ 3D', 'Trợ Lý AI Sale & CRM'],
  },
  {
    id: 'ecolife-signature',
    name: 'EcoLife Signature Đà Nẵng',
    role: 'DỰ ÁN TRỌNG ĐIỂM',
    subtitle:
      'Vận hành khép kín cổng thông tin dự án, AI tư vấn chính sách 24/7 và luồng phân bổ khách hàng thời gian thực cho 3 Đại lý F1.',
    logo: '/assets/partners/logo_ecolife_ngang.webp',
    url: 'https://ai.ecolifesignature.vn/',
    badge: 'AI.ECOLIFESIGNATURE.VN',
    metrics: ['AI Sales Portal 24/7', 'Auto Chia 3 Đại Lý F1 < 5s'],
  },
  {
    id: 'inkica',
    name: 'INKICA AI POD Studio',
    role: 'ĐỐI TÁC CÔNG NGHỆ AI',
    subtitle:
      'Nền tảng AI Agent Prepress phục vụ thị trường in ấn toàn cầu với 6 tác nhân AI chuyên biệt xử lý đồ họa và rập 3D tự động.',
    logo: '/assets/partners/logo_inkica_icon.svg',
    url: 'https://ai.inkica.com/',
    badge: 'AI.INKICA.COM',
    metrics: ['6 AI Prepress Agents', '208 SKU AOP 3D'],
  },
  {
    id: 'ideas-business',
    name: 'IDEAS Business',
    role: 'ĐỐI TÁC GIÁO DỤC • AI AGENT',
    subtitle:
      'Vận hành hệ thống AI Agent phối hợp xuyên suốt cùng ERP 5.0, CRM tuyển sinh và tự động chia vòng Lead cho đội ngũ tư vấn.',
    logo: '/assets/partners/logo_ideas.webp',
    url: 'https://ideas.edu.vn/mba',
    badge: 'IDEAS.EDU.VN • AI AGENT',
    metrics: ['AI Agent 24/7', 'ERP 5.0 & CRM'],
  },
  {
    id: 'richland',
    name: 'Rich Land',
    role: 'SÀN BĐS • CRM & KHO DATABANK',
    subtitle:
      'Vận hành hệ thống CRM chia Lead linh hoạt theo hai chế độ (tranh nhận data tức thì hoặc chia theo vòng công bằng), quản lý kho DataBank tập trung, lọc trùng đa kênh và kiểm soát SLA chăm sóc khách hàng.',
    logo: '/assets/partners/partner_richland.webp',
    url: 'https://rich-land.vercel.app/',
    badge: 'CRM • CHIA LEAD & DATABANK',
    metrics: ['Tranh Nhận / Chia Vòng', 'Kho DataBank Tập Trung'],
  },
];

export const F1_AGENCY_PARTNERS: F1AgencyPartner[] = [
  {
    id: 'tung-long',
    name: 'Địa Ốc Tùng Long',
    shortName: 'TÙNG LONG PROPERTY',
    role: 'Đại lý F1 Chính thức',
    logo: '/assets/partners/logo_tung_long.webp',
    routeMetric: 'ZaloBot < 5s • Ratio 1:1',
    note: 'Nhận khách tự động và đối soát bù ticket thời gian thực.',
  },
  {
    id: 'hop-nhat',
    name: 'Bất Động Sản Hợp Nhất',
    shortName: 'HỢP NHẤT LAND',
    role: 'Đại lý F1 Chính thức',
    logo: '/assets/partners/logo_hop_nhat.webp',
    routeMetric: 'Webhook Sync • Ratio 1:1',
    note: 'Đồng bộ thẳng về đội ngũ kinh doanh và rổ hàng dự án.',
  },
  {
    id: 'ihd-group',
    name: 'Tập Đoàn IHD',
    shortName: 'IHD GROUP',
    role: 'Đại lý F1 Chính thức',
    logo: '/assets/partners/logo_ihd_group.webp',
    routeMetric: 'Meta CAPI • Ratio 1:1',
    note: 'Phản hồi trạng thái khách thiện chí và đặt chỗ về Dataset.',
  },
];

export const ECOSYSTEM_PARTNERS: EcosystemBrand[] = [
  { name: 'Phúc Lộc Thọ', image: '/assets/partners/partner_phucloctho.webp', website: 'https://phucloctho.vn', industry: 'FNB / Franchise' },
  { name: 'Cơm Gà Đệ Nhất', image: '/assets/partners/logo_plt_partner.webp', website: '#', industry: 'FNB / Restaurant' },
  { name: 'Duyên Mai', image: '/assets/partners/partner_duyenmai.webp', website: 'https://duyenmai.vn', industry: 'Fashion / Retail' },
  { name: 'Cowboy Steak', image: '/assets/partners/partner_cowboysteak.webp', website: 'https://www.facebook.com/CowboySteakhouseVietnam/', industry: 'FNB / Restaurant' },
  { name: 'En Group', image: '/assets/partners/partner_engroup.webp', website: 'https://engroup.vn', industry: 'FNB / Holdings' },
  { name: 'Abiru-EN', image: '/assets/partners/partner_abiruen.webp', website: 'https://ka-en.com.vn/', industry: 'FNB / Restaurant' },
  { name: 'KA-EN', image: '/assets/partners/partner_kaen.webp', website: 'https://ka-en.com.vn/', industry: 'FNB / Restaurant' },
  { name: 'Kiwami Ramen', image: '/assets/partners/logo_kiwami.webp', website: 'https://ka-en.com.vn/', industry: 'FNB / Restaurant' },
  { name: 'Haagen Dazs', image: '/assets/partners/partner_haagendazs.webp', website: 'https://haagendazs.com.vn/', industry: 'FNB / Dessert' },
  { name: 'BEAN', image: '/assets/partners/partner_bean.webp', website: 'https://therunningbean.com.vn/', industry: 'FNB / Cafe' },
  { name: 'The Running Bean', image: '/assets/partners/partner_therunningbean.webp', website: 'https://therunningbean.com.vn/', industry: 'FNB / Cafe' },
  { name: 'Esta Saigon', image: '/assets/partners/partner_estasaigon.webp', website: 'https://esta-saigon.com/', industry: 'FNB / Restaurant' },
  { name: 'Le Petit', image: '/assets/partners/partner_lepetit.webp', website: 'https://lepetit.vn/', industry: 'FNB / Bistro' },
  { name: 'Snowee', image: '/assets/partners/partner_snowee.webp', website: 'https://snoweegelato.com/', industry: 'FNB / Dessert' },
  { name: 'An Ninh Tiên Hoàng', image: '/assets/partners/partner_anninhtienhoang.webp', website: 'http://anninhtienhoang.com/', industry: 'Security Service' },
  { name: 'Ascencia', image: '/assets/partners/partner_ascencia.webp', website: 'https://www.ascencia-business-school.com/', industry: 'Education / Finance' },
  { name: 'VTCI Edu', image: '/assets/partners/partner_vtciedu.webp', website: 'https://vtc.edu.vn/', industry: 'Education / Training' },
  { name: 'College de Paris', image: '/assets/partners/partner_collegedeparis.webp', website: 'https://collegedeparis.vn/', industry: 'Education / University' },
  { name: 'ESTIAM Paris', image: '/assets/partners/logo_estiam.webp', website: 'https://www.estiam.education/', industry: 'Education / University' },
  { name: 'ISTEC Paris', image: '/assets/partners/logo_istec.webp', website: 'https://www.istec.fr/', industry: 'Education / University' },
  { name: 'Swiss UMEF', image: '/assets/partners/partner_swissumef.webp', website: 'https://www.umef.ch/', industry: 'Education / University' },
  { name: 'IDEAS Business', image: '/assets/partners/partner_ideasinstitute.webp', website: 'https://ideas.edu.vn/', industry: 'Education / Research' },
  { name: 'Navastore', image: '/assets/partners/partner_navastore.webp', website: 'https://navastore.vn/', industry: 'Retail / Ecommerce' },
  { name: 'Navatek', image: '/assets/partners/logo_navatek.webp', website: 'https://navatek.vn/', industry: 'Industrial & Tech / Retail' },
  { name: 'Nha khoa Flora', image: '/assets/partners/partner_flora.webp', website: 'https://nhakhoaflora.com', industry: 'Dental / Clinic' },
  { name: 'Brandson', image: '/assets/partners/partner_brandson.webp', website: 'https://brandson.vn', industry: 'Dental / Implant Academy' },
  { name: 'Ampersand', image: '/assets/partners/partner_ampersand.jpg', website: 'https://www.ampersand.vn/', industry: 'FNB / Management' },
  { name: 'Implantswiss', image: '/assets/partners/partner_implantswiss.png', website: 'https://implantswiss.vn/', industry: 'Dental / Implant' },
  { name: 'Rich Land', image: '/assets/partners/partner_richland.webp', website: 'https://rich-land.vercel.app/', industry: 'Real Estate / PropTech' },
  { name: 'MINTH Store', image: '/assets/partners/logo_minth.webp', website: 'https://minth-store.vercel.app/', industry: 'Cosmetics & Perfume / Retail' },
  { name: 'Mystery Tarot', image: '/assets/partners/logo_mystery_tarot.webp', website: 'https://www.mystery-tarot.net/', industry: 'Spiritual AI / Entertainment' },
  { name: 'Bếp Nhà SON', image: '/assets/partners/logo_son_fnb.webp', website: '#', industry: 'FNB / Restaurant' },
];

export const DOMATION_SAAS_PLANS = [
  {
    name: 'Starter',
    badge: 'KHỞI ĐỘNG NHANH',
    monthly: '2.990.000₫',
    yearly: '30.498.000₫',
    desc: 'Dành cho đội ngũ tinh gọn cần tự động hóa chăm sóc đa kênh và đo lường chuyển đổi chuẩn.',
    popular: false,
    features: [
      'Flow Automation 5 kịch bản & 100.000 Email/tháng',
      'AI Agent trực Zalo, Messenger & Website 24/7',
      'Tracking hành vi khách hàng & báo cáo chiến dịch',
    ],
  },
  {
    name: 'Growth',
    badge: 'TIÊU CHUẨN DOANH NGHIỆP',
    monthly: '4.990.000₫',
    yearly: '50.898.000₫',
    desc: 'Phù hợp Chủ đầu tư, Sàn phân phối và Chuỗi dịch vụ cần chia số tức thì và AI học tài liệu nội bộ.',
    popular: false,
    features: [
      'Auto Chia Data ZaloBot < 5s & chấm điểm Lead Score',
      'AI Agent huấn luyện từ PDF nội bộ & Flow không giới hạn',
      '500.000 Email SMTP riêng & Heatmap hành vi chuyên sâu',
    ],
  },
  {
    name: 'Bespoke Enterprise',
    badge: 'THIẾT KẾ RIÊNG 100%',
    monthly: 'May Đo',
    yearly: 'Kiến Trúc Riêng',
    desc: 'Khảo sát và kiến tạo hệ điều hành ERP, CRM & AI Agent khớp hoàn toàn cơ cấu tổ chức doanh nghiệp.',
    popular: true,
    features: [
      'Thiết kế riêng ERP 5.0, cấp phê duyệt & phễu CRM đặc thù',
      'Hệ AI Agent liên phòng ban & tích hợp API / Webhook / CAPI',
      'Hạ tầng Server riêng biệt, phân quyền RLS & cam kết SLA 99.9%',
    ],
  },
];

export const DOMATION_WEB_MODULES = [
  { id: 'uiux', name: 'Thiết kế UI/UX Chuẩn Thương Hiệu (Desktop & Mobile)', price: 2500000 },
  { id: 'home', name: 'Trang Chủ Chuẩn Storytelling & Brand Motion', price: 1500000 },
  { id: 'about', name: 'Trang Giới Thiệu Tập Đoàn / Hồ Sơ Năng Lực', price: 1000000 },
  { id: 'products', name: 'Trang Sản Phẩm / Bảng Hàng / Bộ Sưu Tập', price: 2500000 },
  { id: 'branches', name: 'Trang Điểm Bán / Sàn Phân Phối / Bản Đồ', price: 1500000 },
  { id: 'news', name: 'Trang Cẩm Nang, Tin Tức & Tuyển Dụng', price: 1000000 },
  { id: 'cta', name: 'Module Tương Tác, Form Booking & Chuyển Đổi', price: 500000 },
  { id: 'seo', name: 'Quản Trị WordPress/NextJS + SEO Kỹ Thuật + Hosting', price: 1500000 },
];

export const DOMATION_WEB_ADDONS = [
  { id: 'sales', name: 'Bán hàng, Giỏ hàng & Đặt cọc Online', price: 3500000, desc: 'Quản lý sản phẩm, giỏ hàng, tracking đơn hàng chi tiết.' },
  { id: 'payment', name: 'Cổng Thanh Toán Tự Động (VNPay / Momo / VietQR)', price: 2000000, desc: 'Đối soát giao dịch và gạch nợ tự động tức thì.' },
  { id: 'users', name: 'Hệ thống Thành viên / Đại lý / Cộng tác viên', price: 2500000, desc: 'Phân quyền đăng nhập, cấp bậc tài khoản và lịch sử.' },
  { id: 'crmErp', name: 'Tích hợp DOMATION CRM & Auto Chia Data ZaloBot', price: 10000000, desc: 'Đồng bộ Form về CRM, chia đại lý F1 & bắn Meta CAPI.' },
  { id: 'multilingual', name: 'Hệ thống Đa ngôn ngữ Quốc tế (VI / EN / KR / JP)', price: 18623610, desc: 'Chuyển đổi ngôn ngữ mượt mà với cấu trúc URL chuẩn SEO.' },
  { id: 'automation', name: 'Chuỗi Email / Zalo ZNS Nuôi Dưỡng Tự Động', price: 8911600, desc: 'Gửi tài liệu, voucher và kịch bản bám đuổi khách xem web.' },
  { id: 'elearning', name: 'Hệ thống Đào Tạo Sale & E-Learning Nội Bộ', price: 4344610, desc: 'Quản lý học phần, bài thi sát hạch sản phẩm cho Sale.' },
];
