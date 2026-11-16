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
    title: 'Đội Ngũ Multi-Agent Vận Hành Xuyên Suốt 24/7',
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
    title: 'DOMATION DATA & Auto Meta CAPI — Giao Diện Thực Tế',
    subtitle: 'Minh họa 4 màn hình V2 Auto Routing + Meta CAPI HTTP 200 (đã che SĐT bảo mật) & 4 màn hình Engine chia vòng.',
    liveUrl: 'https://ideas-data.vercel.app/demo',
    liveLabel: 'Mở Demo Auto Data',
    items: [
      {
        src: '/assets/domation/data_v2_overview.webp',
        badge: '01 • AUTO CHIA DATA ZALOBOT',
        title: 'Phân Bổ Data Real-Time Qua ZaloBot & SalePortal',
        desc: 'Tự động thu Lead từ Meta Form & Website, lọc trùng 6 tháng và chia vòng công bằng cho 3 Đại lý F1 dưới 5 giây.',
      },
      {
        src: '/assets/domation/data_v2_capi_masked.webp',
        badge: '02 • META CAPI HTTP 200',
        title: 'Nhật Ký Tự Động Bắn CAPI Thiện Chí & Notlead (SĐT Ẩn Bảo Mật)',
        desc: 'Tự động hash SHA-256 bắn sự kiện Qualified / Schedule / DisqualifiedLead về Facebook Dataset.',
      },
      {
        src: '/assets/domation/data_v2_ads_pipeline.webp',
        badge: '03 • PIPELINE THEO MẪU AD',
        title: 'Đo Lường Từng Mẫu Quảng Cáo Đến Booking & Đặt Cọc',
        desc: 'Nhìn thấu CPL thực & tỷ lệ Thiện chí/Notlead trên từng Carousel, Video, Lead Form.',
      },
      {
        src: '/assets/domation/data_v2_fair_audit.webp',
        badge: '04 • ĐỐI SOÁT CÔNG BẰNG',
        title: 'Bảng Thống Kê Độ Lệch & Bù Data Minh Bạch Giữa 3 Đại Lý F1',
        desc: 'Công thức Thành công = Đã chia + Bù tự động cân bằng gần 0% sai lệch giữa Tùng Long, Hợp Nhất & IHD.',
      },
      {
        src: '/assets/domation/chia_data_1.webp',
        badge: 'V1 ENGINE #1',
        title: 'Cơ Chế Phân Bổ Lead 5-Port Round-Robin',
        desc: 'Cân bằng nguồn khách hàng theo khung giờ và tỷ lệ chia của từng đơn vị.',
      },
      {
        src: '/assets/domation/chia_data_14.webp',
        badge: 'V1 ENGINE #2',
        title: 'Xử Lý Trùng Số & Cảnh Báo Ticket Lỗi',
        desc: 'Chặn lead trùng 6 tháng và lưu vết xử lý bù lead công bằng.',
      },
      {
        src: '/assets/domation/chia_data_18.webp',
        badge: 'V1 ENGINE #3',
        title: 'Webhook Kết Nối Đa Nguồn Instant Form',
        desc: 'Bắt dữ liệu tức thì từ Meta Ads, TikTok Form, Ladipage và Website.',
      },
      {
        src: '/assets/domation/chia_data_21.webp',
        badge: 'V1 ENGINE #4',
        title: 'Thông Báo ZaloBot Tức Thì Cho Sale',
        desc: 'Sale nhận thông tin khách ngay trên Zalo cá nhân dưới 5 giây.',
      },
    ],
  },
  erp: {
    title: 'DOMATION Enterprise ERP 5.0 — 16 Màn Hình Phân Hệ',
    subtitle: 'Đầy đủ 16 giao diện vận hành thực tế: Executive Dashboard, Kanban, Chấm công GPS AI Selfie, Payroll PDF & Cấu hình SLA.',
    liveUrl: '/erp',
    liveLabel: 'Mở Trang ERP 5.0',
    items: [
      {
        category: 'Hệ thống & Cài đặt',
        src: '/ERP-Product/1788856522396_2141578413905312186_2310722037673454867_637ed02e6f5c0e0560d1bcac82cf9a19.jpg',
        badge: 'SPLASH SCREEN',
        title: 'Màn hình Khởi động ERP (AI Mascot)',
        desc: 'Nhận diện công nghệ AI Automation & Intelligent Workflow.',
      },
      {
        category: 'Vận hành & Lead',
        src: '/ERP-Product/1788856540980_2141578413905312186_2310722037673454867_a9d3d972886e0c266f4c5866dec8111d.jpg',
        badge: 'APPROVAL INBOX',
        title: 'Hộp thư Phê duyệt & Tồn đọng (AI Gatekeeper)',
        desc: 'Trung tâm kiểm duyệt Ticket lỗi data, lead tạm giữ & yêu cầu hỗ trợ.',
      },
      {
        category: 'Vận hành & Lead',
        src: '/ERP-Product/1788856550308_2141578413905312186_2310722037673454867_9dee6011fca6751ff38ce855f9b34ee2.jpg',
        badge: 'EXECUTIVE DASHBOARD',
        title: 'Tổng quan Vận hành & Phân bổ Data Real-Time',
        desc: 'Thống kê tổng data, tỷ lệ chia thành công 100%, trùng lặp 0% & top tư vấn viên.',
      },
      {
        category: 'Vận hành & Lead',
        src: '/ERP-Product/1788856559658_2141578413905312186_2310722037673454867_192068dc865f82425fa3645d12da931a.jpg',
        badge: 'WORKSPACE & KANBAN',
        title: 'Bàn làm việc & Task Kanban Thông minh',
        desc: 'Quản trị công việc đội ngũ, cảnh báo quá hạn & đếm giờ phiên làm việc.',
      },
      {
        category: 'Lương & Tài chính',
        src: '/ERP-Product/1788856566822_2141578413905312186_2310722037673454867_c63e338a900a1ede4d6aa48393ce24da.jpg',
        badge: 'PURCHASE ORDER',
        title: 'Quản lý Chi phí Vận hành & Giải ngân',
        desc: 'Kiểm soát hóa đơn đã duyệt, chờ duyệt & phân loại chi phí minh bạch.',
      },
      {
        category: 'CRM & Khách hàng',
        src: '/ERP-Product/1788856586610_2141578413905312186_2310722037673454867_3a3e0cd6e45b99e3e82c953988b294c7.jpg',
        badge: 'LEAD PIPELINE',
        title: 'Hồ sơ Khách hàng & Pipeline Chăm sóc 8 nấc',
        desc: 'Phân cấp nhiệt độ (Nóng/Ấm), AI chấm điểm tiềm năng & nhật ký tương tác.',
      },
      {
        category: 'Nhân sự & Chấm công',
        src: '/ERP-Product/1788856615239_2141578413905312186_2310722037673454867_68e999d52c39291dacc6740f9084167c.jpg',
        badge: 'HRM OVERVIEW',
        title: 'Quản lý Nhân sự & Cơ cấu Phòng ban',
        desc: 'Theo dõi tỷ lệ đi làm, đi trễ, tăng ca OT và đơn từ chờ duyệt.',
      },
      {
        category: 'Nhân sự & Chấm công',
        src: '/ERP-Product/1788856627087_2141578413905312186_2310722037673454867_33798ebb805d3335cfcfedec3f73c1c0.jpg',
        badge: 'ONLINE APPROVAL',
        title: 'Phê duyệt Đơn từ & Tăng ca Trực tuyến',
        desc: 'Quy trình xét duyệt đa cấp phép năm, OT, WFH không giấy tờ.',
      },
      {
        category: 'Lương & Tài chính',
        src: '/ERP-Product/1788856643268_2141578413905312186_2310722037673454867_90891228871ff88a333f15fc1497741d.jpg',
        badge: 'PAYROLL ENGINE',
        title: 'Bảng tính Lương Tháng Tự Động',
        desc: 'Thuật toán tính ngày công, KPI, hoa hồng, BHXH, thuế TNCN & thực lĩnh NET.',
      },
      {
        category: 'Lương & Tài chính',
        src: '/ERP-Product/1788856653987_2141578413905312186_2310722037673454867_b778c3abf946efda6e8623075e8ea445.jpg',
        badge: 'DIGITAL PAYSLIP',
        title: 'Phiếu Lương Điện Tử & Xuất PDF Ký Số',
        desc: 'Kê chi tiết từng khoản cộng/trừ & xuất phiếu lương cá nhân bảo mật.',
      },
      {
        category: 'Nhân sự & Chấm công',
        src: '/ERP-Product/1788856662127_2141578413905312186_2310722037673454867_5cecf569bb851d994237076459b3995a.jpg',
        badge: 'ATTENDANCE',
        title: 'Quản lý Chấm công Theo Tháng & Ca trực',
        desc: 'Giám sát ngày công thực tế, ca trực và bổ sung công hợp lệ.',
      },
      {
        category: 'Nhân sự & Chấm công',
        src: '/ERP-Product/1788856668006_2141578413905312186_2310722037673454867_72b9a0047bb54f03c54fb657c81e41dc.jpg',
        badge: 'GPS & FACE AI',
        title: 'Chấm công Định vị GPS & Selfie AI Chống Fake',
        desc: 'Xác thực tọa độ GPS văn phòng chuẩn từng giây kèm ảnh Selfie AI.',
      },
      {
        category: 'Hệ thống & Cài đặt',
        src: '/ERP-Product/1788856679081_2141578413905312186_2310722037673454867_8628e61bf60b5866f7474a75753c6fda.jpg',
        badge: 'SLA RULES',
        title: 'Trung tâm Cấu hình Hệ thống & Van Chống Ôm',
        desc: 'Cấu hình SLA 2 phút nhận lead, van Backpressure & quy tắc hoàn cọc.',
      },
      {
        category: 'Hệ thống & Cài đặt',
        src: '/ERP-Product/1788856691047_2141578413905312186_2310722037673454867_2dacee1206b6e8f836cdea82018d556e.jpg',
        badge: 'NAVIGATION 1',
        title: 'Điều hướng Nhanh Đa Phân Hệ (Phần 1)',
        desc: 'Truy cập Lead một cửa, Databank, Giỏ hàng dự án, HRM & Phê duyệt.',
      },
      {
        category: 'Hệ thống & Cài đặt',
        src: '/ERP-Product/1788856705546_2141578413905312186_2310722037673454867_91d3fd439a4e7f45eee7ae77dc8c20a1.jpg',
        badge: 'ECOSYSTEM 2',
        title: 'Hệ sinh thái Phân hệ Mở rộng (Phần 2)',
        desc: 'Chấm công GPS, Payroll Engine, Tài chính & phân quyền bảo mật RLS.',
      },
      {
        category: 'Vận hành & Lead',
        src: '/assets/domation/erp_16.webp',
        badge: 'OPERATIONS MATRIX',
        title: 'Báo Cáo Vận Hành & Công Suất Đa Cơ Sở Real-Time',
        desc: 'Theo dõi tồn quỹ tài nguyên, lịch vận hành & đối soát tức thì.',
      },
    ],
  },
  crm: {
    title: 'DOMATION CRM 360° & Quản Trị Bán Hàng — 10 Màn Hình',
    subtitle: 'Trọn bộ giao diện Sales Pipeline Kanban, Hồ sơ 360°, Giỏ hàng live, Hóa đơn & Chăm sóc khách hàng.',
    liveUrl: 'https://crm-domation.vercel.app/',
    liveLabel: 'Mở Demo CRM 4.0',
    items: [
      { src: '/assets/domation/crm_1.webp', badge: 'CRM #01', title: 'Dashboard Tổng Quan Doanh Thu & Pipeline', desc: 'Theo dõi tổng quan nguồn lead, doanh số kỳ và tốc độ xử lý.' },
      { src: '/assets/domation/crm_2.webp', badge: 'CRM #02', title: 'Phân Bổ Lead Đa Kênh Round-Robin', desc: 'Tự động chia đều Lead từ Ads/Web về từng Sales & nhóm kinh doanh.' },
      { src: '/assets/domation/crm_3.webp', badge: 'CRM #03', title: 'Quản Lý Hồ Sơ Khách Hàng 360 Độ', desc: 'Gom trọn lịch sử tương tác, ghi chú, tài liệu & nhu cầu mua hàng.' },
      { src: '/assets/domation/crm_4.webp', badge: 'CRM #04', title: 'Tự Động Chăm Sóc ZaloBot & ZNS', desc: 'Kích hoạt nhắc hẹn, gửi thông tin dự án qua Zalo trực tiếp từ CRM.' },
      { src: '/assets/domation/crm_5.webp', badge: 'CRM #05', title: 'Báo Cáo Hiệu Suất Sale & KPI Chốt Đơn', desc: 'Xếp hạng chuyển đổi theo cá nhân, phòng ban và nguồn Lead.' },
      { src: '/assets/domation/crm_6.webp', badge: 'CRM #06', title: 'Theo Dõi Lịch Hẹn, Booking & Đặt Cọc', desc: 'Quản lý lịch tư vấn, xác nhận cọc và nhắc hạn thanh toán theo đợt.' },
      { src: '/assets/domation/crm_7.webp', badge: 'CRM #07', title: 'Lọc Trùng Số Điện Thoại Đa Chiến Dịch', desc: 'Chống xung đột data giữa các nhóm Sales và chi nhánh.' },
      { src: '/assets/domation/crm_8.webp', badge: 'CRM #08', title: 'Đồng Bộ Webhook Hai Chiều CRM <-> Meta', desc: 'Phản hồi tự động trạng thái Thiện chí / Chốt đơn sang Meta CAPI.' },
      { src: '/assets/domation/crm_9.webp', badge: 'CRM #09', title: 'Quản Trị Giỏ Hàng & Chính Sách Bán Hàng', desc: 'Cập nhật rổ hàng căn hộ / dịch vụ và chiết khấu theo thời gian thực.' },
      { src: '/assets/domation/crm_10.webp', badge: 'CRM #10', title: 'Lịch Sử Tương Tác & Kết Nối Hóa Đơn', desc: 'Xuất hóa đơn và đồng bộ chứng từ doanh thu bán hàng tức thì.' },
    ],
  },
  autoflow: {
    title: 'Marketing Automation & AI Phòng Ban — 9 Màn Hình',
    subtitle: 'Visual Flow Builder kéo thả, Email Builder, Web Tracking Heatmap, AI Knowledge Vault & QR Offline.',
    liveUrl: '/automation',
    liveLabel: 'Mở Trang Automation',
    items: [
      { src: '/assets/domation/auto_home.webp', badge: 'TỔNG QUAN', title: 'Bảng Điều Khiển Chiến Dịch & Tỷ Lệ Chuyển Đổi', desc: 'Theo dõi lưu lượng email, Zalo ZNS, kịch bản tự động & tỷ lệ mở/click.' },
      { src: '/assets/domation/auto_flow.webp', badge: 'FLOW BUILDER', title: 'Trình Tạo Kịch Bản Kéo Thả Đa Nhánh (IF/ELSE)', desc: 'Thiết kế phễu nuôi dưỡng theo hành vi mở mail, click link & trạng thái CRM.' },
      { src: '/assets/domation/auto_email.webp', badge: 'EMAIL DESIGN', title: 'Thiết Kế Email Chuyên Nghiệp Kéo Thả', desc: 'Thư viện template cao cấp tối ưu hiển thị đa thiết bị, >95% vào Inbox.' },
      { src: '/assets/domation/auto_tracking.webp', badge: 'WEB TRACKING', title: 'Pixel Tracking Hành Vi Khách Hàng Ẩn Danh', desc: 'Ghi nhận từng click, scroll trang giá và tự động gắn nhãn về CRM.' },
      { src: '/assets/domation/auto_ai_group.webp', badge: 'AI PHÒNG BAN', title: 'Hệ Thống AI Agent Phân Quyền Từng Bộ Phận', desc: 'Xây dựng trợ lý AI chuyên biệt cho Marketing, Sale & CSKH.' },
      { src: '/assets/domation/auto_ai_chatbot.webp', badge: 'AI CHATBOT 24/7', title: 'Trợ Lý AI Tư Vấn Đa Kênh Zalo & Messenger', desc: 'Tự động trả lời thông số, bảng giá PDF và đặt lịch hẹn 24/7.' },
      { src: '/assets/domation/auto_voucher.webp', badge: 'VOUCHER HUB', title: 'Phát Hành & Kiểm Soát Mã Ưu Đãi Tự Động', desc: 'Sinh mã giảm giá duy nhất theo từng Lead & theo dõi lượt đổi.' },
      { src: '/assets/domation/auto_qr.webp', badge: 'QR TRACKING', title: 'Đo Lường Offline OOH Qua Mã QR Động', desc: 'Theo dõi chính xác lượt quét từ Standee, Tờ gập, Hoarding về Web.' },
      { src: '/assets/domation/auto_survey.webp', badge: 'SURVEY BUILDER', title: 'Khảo Sát Nhu Cầu & Chấm Điểm Lead Tự Động', desc: 'Thu thập insight và tự động phân nhóm kích hoạt chuỗi chăm sóc.' },
    ],
  },
  'meta-report': {
    title: 'Meta Ads Realtime Report — Dashboard & Video Demo',
    subtitle: 'Báo cáo hiệu suất quảng cáo Meta realtime độc lập Business Manager kết hợp video hướng dẫn chi tiết.',
    liveUrl: 'https://meta.domation.net',
    liveLabel: 'Mở Meta Ad Report',
    youtubeEmbed: 'https://www.youtube.com/embed/fvIHSrpsAlI',
    items: [
      { src: '/assets/domation/meta_rp_1.webp', badge: 'REPORT #01', title: 'Tổng Quan Chỉ Số Meta Ads Real-Time (Spend, ROAS, CPA)', desc: 'Cập nhật liên tục chi phí, lượt chuyển đổi & hiệu suất chiến dịch.' },
      { src: '/assets/domation/meta_rp_2.webp', badge: 'REPORT #02', title: 'Phân Tích Phễu Video Hook Rate & Hold Rate', desc: 'Đánh giá chính xác video Creative giữ chân khách trong 3s đầu.' },
      { src: '/assets/domation/meta_rp_3.webp', badge: 'REPORT #03', title: 'Đối Chiếu Chi Phí Ads Với Doanh Thu CRM Thực Tế', desc: 'Biết rõ mẫu quảng cáo nào thực sự tạo ra Khách Thiện Chí & Đặt cọc.' },
      { src: '/assets/domation/meta_rp_4.webp', badge: 'REPORT #04', title: 'Báo Cáo Hiệu Suất Creative & Độ Bão Hòa Tệp', desc: 'Cảnh báo Ad lặp tần suất cao hoặc chi phí/Qualified tăng bất thường.' },
      { src: '/assets/domation/meta_rp_5.webp', badge: 'REPORT #05', title: 'Ma Trận Tối Ưu Ngân Sách Campaign / Adset', desc: 'Hỗ trợ ra quyết định vít hay tắt ngân sách bằng dữ liệu thực.' },
      { src: '/assets/domation/meta_rp_6.webp', badge: 'REPORT #06', title: 'Nhật Ký Đồng Bộ Token & Dataset CAPI', desc: 'Giám sát kết nối Graph API & trạng thái phản hồi HTTP 200.' },
    ],
  },
  'web-3d': {
    title: 'Web 3D Bóc Mái & Hệ Thống Website Đã Triển Khai',
    subtitle: 'Trải nghiệm Flagship EcoLife Signature 3D Bóc Mái 8 Căn Hộ + 6 Website Thương Hiệu Quy Mô Cao.',
    liveUrl: '/web-design',
    liveLabel: 'Dự Toán Website Từ 12.0M₫',
    items: [
      { src: '/assets/ecolife/TO_GAP_2_MAT_ONLINE_WEBSITE_BO_TRI_HOP_LY.webp', badge: 'FLAGSHIP 360°', title: 'EcoLife Signature — Website & 25 Ấn Phẩm OOH', desc: 'Chiến dịch toàn diện cho Tập đoàn Capital House & 3 Sàn F1.' },
      { src: '/assets/ecolife/bocmai/bocmai_3d_a1.webp', badge: '3D CĂN A1 • 66M²', title: 'Mô Hình Bóc Mái 3D Căn 2PN A1', desc: 'Trình diễn WebGL Three.js xoay 360 độ trực tiếp trên trình duyệt.' },
      { src: '/assets/ecolife/bocmai/bocmai_3d_b3.webp', badge: '3D CĂN B3 • 88.8M²', title: 'Mô Hình Bóc Mái 3D Căn Góc Panorama B3', desc: 'Hiển thị chuẩn vật liệu & bố trí công thái học từng phòng.' },
      { src: '/landingpage_avatar/nava.webp', badge: 'E-COMMERCE', title: 'Nava Store (navastore.vn)', desc: 'Website thương mại điện tử tối ưu mua hàng, gắn Pixel Tracking sâu.' },
      { src: '/landingpage_avatar/ideasmba.webp', badge: 'EDUCATION MBA', title: 'Viện IDEAS MBA (ideas.edu.vn/mba)', desc: 'Landing Page tuyển sinh Thạc sĩ Quản trị Kinh doanh Quốc tế.' },
      { src: '/landingpage_avatar/brandson.webp', badge: 'MEDICAL ACADEMY', title: 'Brandson Academy (brandson.vn)', desc: 'Landing Page đào tạo Nha khoa CME tỷ lệ chuyển đổi Lead cao.' },
      { src: '/landingpage_avatar/flora.webp', badge: 'DENTAL CLINIC', title: 'Nha Khoa Flora (nhakhoaflora.com)', desc: 'Landing Page Ngày Hội Implant kết nối đặt hẹn thẳng về CRM.' },
      { src: '/landingpage_avatar/ideasedu.webp', badge: 'INSTITUTIONAL', title: 'Viện Đào Tạo IDEAS (ideas.edu.vn)', desc: 'Cổng thông tin đa trang & hệ thống SEO từ khóa Top 1 Google.' },
      { src: '/landingpage_avatar/portfolio.webp', badge: 'EXECUTIVE PROFILE', title: 'Turnio Architecture Portal (portfo-turnio.vercel.app)', desc: 'Hồ sơ năng lực điều hành hệ sinh thái Marketing × App đa tầng.' },
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
    tags: ['Multi-Agent Chat', '208 SKU 3D', '300 DPI AI'],
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
    company: 'Phúc Lộc Thọ & Ampersand',
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
      'Nền tảng Multi-Agent Prepress phục vụ thị trường in ấn toàn cầu với 6 tác nhân AI chuyên biệt xử lý đồ họa và rập 3D tự động.',
    logo: '/assets/partners/logo_inkica_icon.svg',
    url: 'https://ai.inkica.com/',
    badge: 'AI.INKICA.COM',
    metrics: ['6 AI Prepress Agents', '208 SKU AOP 3D'],
  },
  {
    id: 'ideas-business',
    name: 'IDEAS Business',
    role: 'ĐỐI TÁC GIÁO DỤC • MULTI-AGENT AI',
    subtitle:
      'Vận hành hệ thống Multi-Agent AI phối hợp xuyên suốt cùng ERP 5.0, CRM tuyển sinh và tự động chia vòng Lead cho đội ngũ tư vấn.',
    logo: '/assets/partners/logo_ideas.webp',
    url: 'https://ideas.edu.vn/mba',
    badge: 'IDEAS.EDU.VN • MULTI-AGENT',
    metrics: ['Multi-Agent AI 24/7', 'ERP 5.0 & CRM'],
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
  { name: 'Duyên Mai', image: '/assets/partners/partner_duyenmai.webp', website: 'https://duyenmai.vn', industry: 'Fashion / Retail' },
  { name: 'Cowboy Steak', image: '/assets/partners/partner_cowboysteak.webp', website: 'https://www.facebook.com/CowboySteakhouseVietnam/', industry: 'FNB / Restaurant' },
  { name: 'En Group', image: '/assets/partners/partner_engroup.webp', website: 'https://engroup.vn', industry: 'FNB / Holdings' },
  { name: 'Abiru-EN', image: '/assets/partners/partner_abiruen.webp', website: 'https://ka-en.com.vn/', industry: 'FNB / Restaurant' },
  { name: 'KA-EN', image: '/assets/partners/partner_kaen.webp', website: 'https://ka-en.com.vn/', industry: 'FNB / Restaurant' },
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
  { name: 'Swiss UMEF', image: '/assets/partners/partner_swissumef.webp', website: 'https://www.umef.ch/', industry: 'Education / University' },
  { name: 'IDEAS Business', image: '/assets/partners/partner_ideasinstitute.webp', website: 'https://ideas.edu.vn/', industry: 'Education / Research' },
  { name: 'Navastore', image: '/assets/partners/partner_navastore.webp', website: 'https://navastore.vn/', industry: 'Retail / Ecommerce' },
  { name: 'Nha khoa Flora', image: '/assets/partners/partner_flora.webp', website: 'https://nhakhoaflora.com', industry: 'Dental / Clinic' },
  { name: 'Brandson', image: '/assets/partners/partner_brandson.webp', website: 'https://brandson.vn', industry: 'Branding / Agency' },
  { name: 'Ampersand', image: '/assets/partners/partner_ampersand.jpg', website: 'https://www.ampersand.vn/', industry: 'FNB / Management' },
  { name: 'Implantswiss', image: '/assets/partners/partner_implantswiss.png', website: 'https://implantswiss.vn/', industry: 'Dental / Implant' },
  { name: 'Richland', image: '/assets/partners/partner_richland.webp', website: 'https://rich-land.vercel.app/', industry: 'Real Estate / PropTech' },
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
    desc: 'Khảo sát và kiến tạo hệ điều hành ERP, CRM & Multi-Agent khớp hoàn toàn cơ cấu tổ chức doanh nghiệp.',
    popular: true,
    features: [
      'Thiết kế riêng ERP 5.0, cấp phê duyệt & phễu CRM đặc thù',
      'Hệ Multi-Agent liên phòng ban & tích hợp API / Webhook / CAPI',
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
