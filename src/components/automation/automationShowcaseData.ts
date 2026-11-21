export type AutomationScreenCategory = 'flows' | 'campaigns' | 'omnichannel' | 'analytics' | 'mobile';

export interface AutomationScreenItem {
  id: string;
  category: AutomationScreenCategory;
  tabLabel: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  badgeText: string;
  modeTag: 'Standalone' | 'Standalone • Growth' | 'Growth • ERP';
  metrics: Array<{ label: string; value: string; tone?: 'blue' | 'sky' | 'cyan' | 'red' | 'emerald' }>;
  highlights: string[];
  routeLabel: string;
  isMobile?: boolean;
}

export interface FlowSimNode {
  id: string;
  stepType: 'trigger' | 'wait' | 'condition' | 'email' | 'zalo_zns' | 'webhook' | 'crm_handoff';
  title: string;
  subtitle: string;
  branch?: 'root' | 'yes' | 'no';
  timingLabel: string;
  previewHeadline: string;
  previewSummary: string;
  payloadPreview: string[];
  screenshot: string;
  metricsChip: string;
}

export interface FlowSimPreset {
  id: string;
  label: string;
  shortDesc: string;
  enrolledCount: string;
  conversionRate: string;
  avgDuration: string;
  nodes: FlowSimNode[];
}

/**
 * Centralized manifest referencing real captured PNGs under `public/imgs/automation/`.
 * Updating or replacing any screenshot file after production deployment takes effect automatically across all sections.
 */
export const AUTOMATION_SCREENS: AutomationScreenItem[] = [
  {
    id: 'dashboard',
    category: 'analytics',
    tabLabel: 'Tổng quan',
    eyebrow: 'STANDALONE MARKETING COCKPIT',
    title: 'Trung Tâm Điều Hành Marketing Automation Đa Kênh',
    subtitle:
      'Hợp nhất KPI Email SES, Automation Flow, Web Tracking Intent, Khảo sát NPS và Hội thoại Social trên một màn hình Real-time không lẫn menu ERP.',
    image: '/imgs/automation/marketing-dashboard.png',
    badgeText: '46.727 Email • 4.680 Flow • 54.652 Web Sessions',
    modeTag: 'Standalone',
    routeLabel: 'app.domation.net / marketing',
    metrics: [
      { label: 'Email Open Rate', value: '22.8%', tone: 'blue' },
      { label: 'Active Flows', value: '17/39', tone: 'emerald' },
      { label: 'Web Intent', value: '294', tone: 'red' },
      { label: 'Social Convos', value: '1.892', tone: 'sky' },
    ],
    highlights: [
      '4 thẻ KPI tinh gọn chuẩn Meta Report — không rối nút',
      'Biểu đồ vùng tương tác Chiến dịch vs Automation Flow theo ngày',
      'Bộ lọc thời gian dropdown duy nhất, tải nhanh dữ liệu lớn',
    ],
  },
  {
    id: 'flows-list',
    category: 'flows',
    tabLabel: 'Kịch bản Flow',
    eyebrow: 'LIFECYCLE ORCHESTRATION',
    title: 'Danh Sách Kịch Bản Tự Động Hóa Liên Kết Form & Phân Khúc',
    subtitle:
      'Theo dõi trạng thái Đang chạy / Tạm dừng / Bản nháp, số bước, lượt tham gia và tỷ lệ hoàn thành với liên kết trực tiếp về Biểu mẫu & Phân khúc nguồn.',
    image: '/imgs/automation/automation-flows-list.png',
    badgeText: '28 Kịch bản • 73% Hoàn thành',
    modeTag: 'Standalone',
    routeLabel: 'app.domation.net / marketing / flows',
    metrics: [
      { label: 'Đang chạy', value: '17 Flows', tone: 'emerald' },
      { label: 'Lượt tham gia', value: '4.680', tone: 'blue' },
      { label: 'Hoàn thành', value: '3.427 (73%)', tone: 'cyan' },
    ],
    highlights: [
      'Tự động ánh xạ chuẩn tên Form & Phân khúc kích hoạt',
      'Tách biệt luồng Standalone Marketing hoàn toàn sạch sẽ',
      'Nhân bản, thống kê hoặc khôi phục phiên bản chỉ với 1 chạm',
    ],
  },
  {
    id: 'flow-builder',
    category: 'flows',
    tabLabel: 'Flow Builder',
    eyebrow: 'VISUAL TREE & GRAPH CANVAS',
    title: 'Trình Dựng Kịch Bản Đa Nhánh IF/ELSE, Chờ Đợi & Đa Kênh',
    subtitle:
      'Kéo thả Trigger (Form, Segment, Tag, Purchase, Web Intent), Wait Delay chính xác từng phút/giờ/ngày và rẽ nhánh thông minh theo hành vi.',
    image: '/imgs/automation/automation-flow-builder.png',
    badgeText: 'Multi-Branch IF/ELSE • Versioned Snapshot',
    modeTag: 'Standalone',
    routeLabel: 'app.domation.net / marketing / flows / builder',
    metrics: [
      { label: 'Step Types', value: '12+ Nodes', tone: 'blue' },
      { label: 'Version Control', value: 'Auto Snapshot', tone: 'sky' },
      { label: 'Resume Engine', value: 'Cron Safe', tone: 'emerald' },
    ],
    highlights: [
      'Resume chính xác tại bước tiếp theo — không lặp lại từ đầu',
      'Hỗ trợ rẽ nhánh Đúng/Sai theo điều kiện mở Mail, Click, Tag, Điểm Quiz',
      'Chuyển tiếp tự động sang Webhook ngoài hoặc Vòng chia Sale CRM',
    ],
  },
  {
    id: 'step-email-modal',
    category: 'flows',
    tabLabel: 'Bước Gửi Email',
    eyebrow: 'TWO-COLUMN EMAIL STEP WORKSPACE',
    title: 'Cấu Hình Bước Email 2 Cột & Xem Trước HTML Live',
    subtitle:
      'Chỉnh tiêu đề, chèn biến cá nhân hóa {{fullName}}, chọn người gửi AWS SES đã xác thực và xem trước giao diện Desktop/Mobile ngay trong Flow.',
    image: '/imgs/automation/flow-step-email-modal.png',
    badgeText: 'Live HTML Preview • Verified SES Sender',
    modeTag: 'Standalone',
    routeLabel: 'StepEditor / EmailActionConfig (3xl)',
    metrics: [
      { label: 'Verified Senders', value: '4 Domains', tone: 'blue' },
      { label: 'Preview Mode', value: 'Desktop & iOS', tone: 'sky' },
      { label: 'Speed', value: '14 Mail/s', tone: 'emerald' },
    ],
    highlights: [
      'Giao diện modal 2 cột rộng thoáng, zero thanh cuộn ngang',
      'Bật/tắt khớp file đính kèm cá nhân hóa theo email người nhận',
      'Gửi test 1 chạm và chuyển sang sửa mẫu Visual bất kỳ lúc nào',
    ],
  },
  {
    id: 'step-zns-modal',
    category: 'flows',
    tabLabel: 'Bước Zalo ZNS',
    eyebrow: 'ZALO ZNS ORCHESTRATION',
    title: 'Cấu Hình Bước Zalo ZNS Với Khung Giờ Bảo Vệ 06:00–22:00',
    subtitle:
      'Chọn Zalo OA, duyệt danh sách Template ZNS đã kiểm duyệt, ánh xạ tham số động từ Lead/CRM và xem trước tin nhắn thực tế.',
    image: '/imgs/automation/flow-step-zns-modal.png',
    badgeText: 'Compliance 06:00–22:00 VN • Auto Dedup 84xxx',
    modeTag: 'Standalone',
    routeLabel: 'StepEditor / ZaloZNSStepConfig (2xl)',
    metrics: [
      { label: 'Khung giờ gửi', value: '06:00–22:00', tone: 'blue' },
      { label: 'Phone Norm', value: '0xxx ↔ 84xxx', tone: 'cyan' },
      { label: 'Template QA', value: 'Approved ZNS', tone: 'emerald' },
    ],
    highlights: [
      'Tự động kiểm tra và chống trùng số điện thoại Việt Nam',
      'Trì hoãn an toàn sang 06:00 hôm sau nếu ngoài khung giờ ZNS',
      'Kết hợp Fallback gửi Email ngay khi khách chưa có Zalo',
    ],
  },
  {
    id: 'campaigns',
    category: 'campaigns',
    tabLabel: 'Chiến dịch',
    eyebrow: 'HIGH-SPEED BROADCAST ENGINE',
    title: 'Chiến Dịch Gửi Hàng Loạt AWS SES 14 Mail/Giây & A/B Subject',
    subtitle:
      'Gửi hàng chục nghìn Email/ZNS cùng lúc bằng Token-Bucket không nghẽn Database, tự động chèn Open Pixel, Click Wrap và chống spam.',
    image: '/imgs/automation/campaigns-list.png',
    badgeText: '14 Mail/s AWS SES • A/B Subject Winner',
    modeTag: 'Standalone',
    routeLabel: 'app.domation.net / marketing / campaigns',
    metrics: [
      { label: 'Chiến dịch', value: '34 Campaigns', tone: 'blue' },
      { label: 'Throughput', value: '14 Mail/s', tone: 'sky' },
      { label: 'Claim Safety', value: '100% Idempotent', tone: 'emerald' },
    ],
    highlights: [
      'Hỗ trợ A/B Testing tiêu đề và tự động chọn bản thắng sau X giờ',
      'Khớp danh sách loại trừ (Suppressions, Unsubscribe, Bounce)',
      'Đo chính xác Unique Open, Unique Click và Revenue quy đổi',
    ],
  },
  {
    id: 'campaign-drawer',
    category: 'campaigns',
    tabLabel: 'Báo cáo Chiến dịch',
    eyebrow: 'CAMPAIGN ANALYTICS DRAWER',
    title: 'Bóc Tách Phễu Chuyển Đổi, Thiết Bị Đọc & Từng Link Click',
    subtitle:
      'Drawer báo cáo chuyên sâu ngay trên danh sách: theo dõi tỷ lệ giao thành công, mở duy nhất, CTR và Top Link được khách hàng quan tâm.',
    image: '/imgs/automation/campaign-detail-drawer.png',
    badgeText: 'Funnel + Link Heatmap + Tech Stats',
    modeTag: 'Standalone',
    routeLabel: 'CampaignDetailDrawer (Desktop & Mobile)',
    metrics: [
      { label: 'Funnel View', value: 'Sent → Click', tone: 'blue' },
      { label: 'Attribution', value: 'Link-level CTR', tone: 'cyan' },
      { label: 'Bounce Guard', value: 'Auto Suppress', tone: 'red' },
    ],
    highlights: [
      'Xem ai đã mở, ai đã click link nào theo thời gian thực',
      'Tự động gắn nhãn hoặc đẩy khách hàng click cao vào Flow chăm sóc',
      'Xuất báo cáo chi tiết và lịch sử lỗi SMTP/SES từng email',
    ],
  },
  {
    id: 'email-templates',
    category: 'campaigns',
    tabLabel: 'Kho Mẫu Thiết Kế',
    eyebrow: 'CURATED TEMPLATE LIBRARY',
    title: 'Thư Viện 116+ Mẫu Email Kéo Thả & Banner AI Đã Chuẩn Hóa',
    subtitle:
      'Quản lý thư viện mẫu phân nhóm theo thư mục, tự động chụp thumbnail sắc nét .webp, chấm điểm Anti-Spam và hỗ trợ nhân bản nhanh.',
    image: '/imgs/automation/email-templates.png',
    badgeText: '116+ Real Templates • AI Banner Ready',
    modeTag: 'Standalone',
    routeLabel: 'app.domation.net / marketing / templates',
    metrics: [
      { label: 'Mẫu thực chiến', value: '116+ Templates', tone: 'blue' },
      { label: 'Spam Checker', value: 'Real-time Score', tone: 'emerald' },
      { label: 'AI Studio', value: '1-Click Copy', tone: 'sky' },
    ],
    highlights: [
      'Thumbnail WebP tải tức thì, xem trước trực quan không cần mở từng mẫu',
      'Chia sẻ phân quyền theo nhóm hoặc thư mục phòng ban',
      'Tích hợp đồng hồ đếm ngược SVG động trong Email',
    ],
  },
  {
    id: 'email-editor',
    category: 'campaigns',
    tabLabel: 'Email Studio',
    eyebrow: 'DRAG & DROP EMAIL STUDIO',
    title: 'Trình Thiết Kế Email Visual Kéo Thả & Biên Dịch Outlook/Gmail',
    subtitle:
      'Thiết kế từng khối Hero, Nút CTA, Bảng giá, Countdown Timer, Sản phẩm & Merge Tags — tự động biên dịch HTML tương thích mọi trình duyệt mail.',
    image: '/imgs/automation/email-editor.png',
    badgeText: 'Visual Block Builder • Dark/Mobile Check',
    modeTag: 'Standalone',
    routeLabel: 'EmailEditor Studio',
    metrics: [
      { label: 'Content Blocks', value: '15+ Blocks', tone: 'blue' },
      { label: 'HTML Output', value: 'Table-Safe CSS', tone: 'sky' },
      { label: 'Unsubscribe', value: 'HMAC Compliant', tone: 'emerald' },
    ],
    highlights: [
      'Kéo thả cột, điều chỉnh padding, bo góc, font tiếng Việt chuẩn',
      'Kiểm tra giao diện Mobile ngay cạnh bản thiết kế Desktop',
      'Lưu từng Section tái sử dụng cho hàng loạt chiến dịch sau',
    ],
  },
  {
    id: 'audience-segments',
    category: 'analytics',
    tabLabel: 'Tệp & Phân khúc',
    eyebrow: 'DYNAMIC SEGMENTATION ENGINE',
    title: 'Quản Lý 20.236+ Hồ Sơ Liên Hệ & Phân Khúc Lọc Sâu Đa Điều Kiện',
    subtitle:
      'Gộp tệp Tĩnh (Import/Form/Google Sheets) và Phân khúc Động AND/OR theo hành vi Web, mở Mail, Điểm Quiz, Custom Fields & CRM Stage.',
    image: '/imgs/automation/audience-segments.png',
    badgeText: '20.236 Contacts • AND/OR Filter Builder',
    modeTag: 'Standalone',
    routeLabel: 'app.domation.net / marketing / audience',
    metrics: [
      { label: 'Contacts', value: '33.060+ Profiles', tone: 'blue' },
      { label: 'Segments', value: '39 Dynamic Rules', tone: 'cyan' },
      { label: 'Dedup Scope', value: 'Zero Overwrite', tone: 'emerald' },
    ],
    highlights: [
      'Non-destructive merge giúp giữ nguyên toàn bộ thuộc tính tùy chỉnh khi cập nhật',
      'Xem trước số lượng khớp thời gian thực trước khi chạy Chiến dịch',
      'Hỗ trợ loại trừ nhóm khách đã chuyển đổi hoặc hủy đăng ký',
    ],
  },
  {
    id: 'social-bot-messenger',
    category: 'omnichannel',
    tabLabel: 'Messenger Bot',
    eyebrow: 'META MESSENGER & RAG CHATBOT',
    title: 'Social Bot Tự Động Hóa Fanpage Messenger & Web LiveChat',
    subtitle:
      'Thu thập số điện thoại & thông tin khách hàng ngay trong hội thoại, kích hoạt Chatbot AI trả lời theo ngữ cảnh và giữ chuẩn quy tắc 24h Meta.',
    image: '/imgs/automation/social-bot.png',
    badgeText: '1.892 Convos • AI Entity Extraction',
    modeTag: 'Standalone',
    routeLabel: 'app.domation.net / marketing / social-bot',
    metrics: [
      { label: 'Conversations', value: '1.892+', tone: 'blue' },
      { label: 'Rule Check', value: '24h Policy Safe', tone: 'sky' },
      { label: 'Human Handoff', value: 'bot_paused Flag', tone: 'red' },
    ],
    highlights: [
      'Xác thực chữ ký X-Hub-Signature-256 chuẩn Meta Webhook',
      'Tự dừng Bot (bot_paused) ngay khi nhân viên vào chat trực tiếp',
      'Trích xuất SĐT/Email tự động đẩy về Flow hoặc chia Sale CRM',
    ],
  },
  {
    id: 'social-bot-zalo',
    category: 'omnichannel',
    tabLabel: 'Zalo OA & ZNS',
    eyebrow: 'ZALO OFFICIAL ACCOUNT STUDIO',
    title: 'Quản Trị Người Quan Tâm Zalo OA, Kịch Bản & Mẫu Tin ZNS',
    subtitle:
      'Đồng bộ tập khách quan tâm Zalo OA, cấu hình kịch bản phản hồi tự động, gửi Broadcast ZNS theo lịch và theo dõi quota OA minh bạch.',
    image: '/imgs/automation/social-bot-zalo.png',
    badgeText: 'Zalo OA + Broadcast + ZNS Templates',
    modeTag: 'Standalone',
    routeLabel: 'app.domation.net / marketing / social-bot?channel=zalo',
    metrics: [
      { label: '4 Sub-tabs', value: 'OA • Bot • ZNS • Sample', tone: 'blue' },
      { label: 'Zalo OA Token', value: 'Auto Refresh', tone: 'emerald' },
      { label: 'Quota Guard', value: 'Live Telemetry', tone: 'cyan' },
    ],
    highlights: [
      'Tách 4 tab gọn gàng chuẩn iOS Segmented Control — dễ thao tác',
      'Tự động refresh OAuth token và thử lại thông minh khi lỗi -124',
      'Tách biệt hoàn toàn khỏi luồng ZaloBot nội bộ thông báo Sale',
    ],
  },
  {
    id: 'ai-bot-training',
    category: 'omnichannel',
    tabLabel: 'Đào tạo AI RAG',
    eyebrow: 'ENTERPRISE AI KNOWLEDGE BASE',
    title: 'Huấn Luyện Trợ Lý AI Nội Bộ Theo Tài Liệu Riêng Từng Website',
    subtitle:
      'Nạp 150+ tài liệu PDF, URL, FAQ & Bảng giá; Bot AI hiểu ngữ cảnh từng sản phẩm, trả lời khách 24/7 với độ chính xác tri thức 98.4%.',
    image: '/imgs/automation/ai-bot-training.png',
    badgeText: '150 Docs • 1.850 AI Conversations',
    modeTag: 'Standalone',
    routeLabel: 'app.domation.net / marketing / ai-training',
    metrics: [
      { label: 'Trained Docs', value: '150 Docs', tone: 'emerald' },
      { label: 'Web Properties', value: 'Multi-Brand', tone: 'blue' },
      { label: 'RAG Accuracy', value: '98.4%', tone: 'cyan' },
    ],
    highlights: [
      'Phân vùng tri thức độc lập theo từng thương hiệu / landing page',
      'Thử nghiệm ngay widget AI sandbox trước khi nhúng lên website thật',
      'Nhận diện ý định mua hàng để kích hoạt Flow & chuyển đổi Sale',
    ],
  },
  {
    id: 'web-tracking',
    category: 'analytics',
    tabLabel: 'Web Tracking & Heatmap',
    eyebrow: 'FIRST-PARTY SERVER TRACKING',
    title: 'Đo Lường 54.652+ Phiên Truy Cập, Heatmap Click & Retroactive Stitch',
    subtitle:
      'Nhúng DOMATION SDK siêu nhẹ: ghi nhận từng trang xem, độ sâu cuộn, ý định xem Bảng giá và tự động nối lịch sử ẩn danh khi khách điền Form.',
    image: '/imgs/automation/web-tracking.png',
    badgeText: '54.652 Sessions • Anonymous-to-Known',
    modeTag: 'Standalone',
    routeLabel: 'app.domation.net / marketing / web-tracking',
    metrics: [
      { label: 'Web Sessions', value: '54.652+', tone: 'blue' },
      { label: 'Events Logged', value: '245.811', tone: 'sky' },
      { label: 'Pricing Intent', value: '294 Hot Signals', tone: 'red' },
    ],
    highlights: [
      'Retroactive Stitch: nối lại toàn bộ hành vi trước đó ngay khi biết Email/SĐT',
      'Bản đồ nhiệt click Top CTAs & phân bổ thiết bị không phụ thuộc Cookie bên thứ 3',
      'Kích hoạt Automation Flow ngay khi khách quay lại trang Bảng giá > 2 lần',
    ],
  },
  {
    id: 'surveys-forms',
    category: 'omnichannel',
    tabLabel: 'Khảo sát & Quiz',
    eyebrow: 'INTERACTIVE SURVEY & QUIZ FUNNEL',
    title: 'Khảo Sát Khách Hàng, Chấm Điểm Quiz & Phân Nhóm Redirect Rules',
    subtitle:
      'Tạo khảo sát Likert Matrix, NPS và Trắc nghiệm; tự động gắn Tag & đẩy người trả lời vào kịch bản Email/ZNS phù hợp theo điểm số.',
    image: '/imgs/automation/surveys-forms.png',
    badgeText: '10 Surveys • Auto Tagging & NPS',
    modeTag: 'Standalone',
    routeLabel: 'app.domation.net / marketing / surveys',
    metrics: [
      { label: 'NPS Tracking', value: 'Live Score', tone: 'emerald' },
      { label: 'Matrix Support', value: 'Readable Export', tone: 'blue' },
      { label: 'Routing', value: 'Score Rules', tone: 'sky' },
    ],
    highlights: [
      'Công khai link khảo sát không cần đăng nhập (erp.domation.net/s/:slug)',
      'Tự động gán Tag và kích hoạt Flow chúc mừng hoặc nhắc lịch theo kết quả',
      'Xuất CSV sạch sẽ không lỗi mã hóa ký tự hay [object Object]',
    ],
  },
  {
    id: 'survey-report',
    category: 'analytics',
    tabLabel: 'Báo cáo Khảo sát',
    eyebrow: 'SURVEY ANALYTICS & MATRIX REPORT',
    title: 'Biểu Đồ NPS, Thiết Bị & Thống Kê Từng Câu Hỏi Ma Trận Trực Quan',
    subtitle:
      'Phân tích tỷ lệ hoàn thành, điểm hài lòng Promoter/Detractor và biểu đồ Donut đa thiết bị rõ ràng để tối ưu thông điệp Marketing.',
    image: '/imgs/automation/survey-report-modal.png',
    badgeText: 'Zero Chart Jitter • Full Question Breakdown',
    modeTag: 'Standalone',
    routeLabel: 'SurveyReportModal Analytics',
    metrics: [
      { label: 'NPS Index', value: '+100 Live', tone: 'emerald' },
      { label: 'Device Pie', value: 'iOS / Web', tone: 'blue' },
      { label: 'CSV Export', value: 'UTF-8 BOM', tone: 'sky' },
    ],
    highlights: [
      'Biểu đồ Recharts tĩnh nét cao, hiển thị rõ từng mức điểm hài lòng',
      'Giải mã sạch HTML entities và bóc tách rõ từng hàng câu hỏi ma trận',
      'Theo dõi nhật ký phản hồi chi tiết gắn với hồ sơ khách hàng',
    ],
  },
  {
    id: 'vouchers-qr',
    category: 'campaigns',
    tabLabel: 'Voucher & QR',
    eyebrow: 'LOYALTY VOUCHER & DYNAMIC SHORTLINKS',
    title: 'Phát Hành Mã Ưu Đãi Tự Động, Rút Gọn Link & QR Sự Kiện Check-in',
    subtitle:
      'Cấp phát mã giảm giá cá nhân hóa trong Email/ZNS, theo dõi lượt claim qua API / Landing `/claim/:id`, rút gọn link UTM & quét QR tại quầy.',
    image: '/imgs/automation/vouchers-qr.png',
    badgeText: '50+ Promo Codes • QR Designer & Shortlinks',
    modeTag: 'Standalone',
    routeLabel: 'app.domation.net / marketing / vouchers',
    metrics: [
      { label: 'Voucher Pool', value: 'Unique Per Lead', tone: 'blue' },
      { label: 'Shortlinks', value: 'UTM Dedupe Click', tone: 'cyan' },
      { label: 'QR Export', value: 'Custom Frame', tone: 'emerald' },
    ],
    highlights: [
      'Chống trùng lượt click khi khách bấm nhiều lần cùng liên kết',
      'Nhúng Form nhận Voucher trực tiếp vào Website qua API công khai mới chuẩn v1',
      'Thiết kế mã QR logo thương hiệu phục vụ hội thảo & sự kiện offline',
    ],
  },
  {
    id: 'api-triggers',
    category: 'flows',
    tabLabel: 'Form, OTP & Webhook',
    eyebrow: 'OMNI INBOUND FORM & WEBHOOK GATEWAY',
    title: 'Quản Lý 21+ Biểu Mẫu Nhúng, Xác Thực OTP Email/SMS & Webhook HMAC',
    subtitle:
      'Kết nối Landing Page, WordPress, Elementor hoặc App ngoài thông qua REST API v1 bảo mật HMAC-SHA256 và tự động xác thực OTP trước khi vào Flow.',
    image: '/imgs/automation/api-triggers.png',
    badgeText: '21 Forms Mapped • HMAC Webhook • OTP Ready',
    modeTag: 'Standalone',
    routeLabel: 'app.domation.net / marketing / api-triggers',
    metrics: [
      { label: 'Active Forms', value: '21 Forms', tone: 'blue' },
      { label: 'Webhook Guard', value: 'HMAC-SHA256', tone: 'emerald' },
      { label: 'OTP Check', value: 'Email & SMS', tone: 'sky' },
    ],
    highlights: [
      'Gắn trực tiếp mỗi Form với Phân khúc mục tiêu để đếm chính xác lượt nộp',
      'Cơ chế thử lại Webhook 5 lần & hàng đợi DLQ không lo mất dữ liệu',
      'Xem mã nhúng JS/HTML copy 1 chạm đưa vào bất kỳ website nào',
    ],
  },
  {
    id: 'flow-analytics',
    category: 'analytics',
    tabLabel: 'Hiệu suất Từng Bước',
    eyebrow: 'STEP-BY-STEP DROP-OFF TELEMETRY',
    title: 'Đo Lường Tỷ Lệ Chuyển Đổi & Người Tham Gia Tại Từng Nút Flow',
    subtitle:
      'Biết chính xác bước Wait nào đang giữ bao nhiêu khách, bước Email/ZNS nào có tỷ lệ mở cao nhất và mở danh sách người qua từng nhánh.',
    image: '/imgs/automation/flow-analytics-tab.png',
    badgeText: 'Per-Step Funnel • Participant Inspector',
    modeTag: 'Standalone',
    routeLabel: 'FlowAnalyticsTab & StepParticipantsModal',
    metrics: [
      { label: 'Step Tracking', value: '100% Granular', tone: 'blue' },
      { label: 'Wait Queue', value: 'Live Count', tone: 'sky' },
      { label: 'Audit Logs', value: 'Full History', tone: 'emerald' },
    ],
    highlights: [
      'Click bất kỳ bước nào để xem danh sách Lead đang chờ hoặc đã đi qua',
      'So sánh hiệu suất gửi Email vs Zalo ZNS ngay trong cùng một kịch bản',
      'Tối ưu điểm nghẽn rơi rụng khách trước khi bàn giao sang Sale',
    ],
  },
  {
    id: 'meta-capi-sync',
    category: 'analytics',
    tabLabel: 'Meta CAPI Sync',
    eyebrow: 'GROWTH SUITE & PRO MAX UNLOCK',
    title: 'Đồng Bộ Tín Hiệu Chất Lượng Meta Conversions API (CAPI) v21.0',
    subtitle:
      'Nâng cấp mượt 1 chạm sang Growth Suite hoặc DOM PROMAX để chặn rác đầu vào, gửi Dual-Pixel Lead/Schedule/Purchase về Meta Ads đạt EMQ 6.4+.',
    image: '/imgs/automation/meta-capi-sync.png',
    badgeText: '100% 2xx • 6.4 EMQ • 1.07 Tỷ₫ Tracked',
    modeTag: 'Growth • ERP',
    routeLabel: 'app.domation.net / marketing / capi',
    metrics: [
      { label: 'Events Sent', value: '63 (100% 2xx)', tone: 'emerald' },
      { label: 'Match Score', value: '6.4 EMQ', tone: 'blue' },
      { label: 'Purchase Rev', value: '1,07 Tỷ₫', tone: 'red' },
    ],
    highlights: [
      'Mở khóa khi kết nối Auto Data Sale Portal hoặc DOM PROMAX ERP',
      'Gửi Dual-Pixel đồng thời trên Lead chuẩn, Lịch hẹn & Đơn chốt thực',
      'Không cần migrate lại dữ liệu — dùng chung 100% DB Multi-Tenant RLS',
    ],
  },
  {
    id: 'mobile-dashboard',
    category: 'mobile',
    tabLabel: 'Mobile Cockpit',
    eyebrow: 'IOS-FIRST MOBILE AUTOMATION',
    title: 'Giám Sát Dashboard Marketing Real-Time Ngay Trên Di Động 390px',
    subtitle:
      'Giao diện thiết kế theo chuẩn iOS Apple Human Interface: thẻ gọn sắc nét, cuộn mượt, bottom dock điều hướng 1 tay không tràn khung ngang.',
    image: '/imgs/automation/mobile-marketing-dashboard.png',
    badgeText: '390x844 iOS Viewport • Zero Overflow',
    modeTag: 'Standalone',
    routeLabel: 'Mobile Standalone /',
    isMobile: true,
    metrics: [
      { label: 'Viewport', value: '390x844 Clean', tone: 'blue' },
      { label: 'Filter Bar', value: 'Single Dropdown', tone: 'sky' },
    ],
    highlights: [
      'Kiểm soát tức thì lượt gửi Mail, Active Flows và Hot Web Intent mọi lúc',
      'Bottom bar điều hướng nhanh giữa Marketing, Automation, Chiến dịch & AI',
    ],
  },
  {
    id: 'mobile-flows',
    category: 'mobile',
    tabLabel: 'Mobile Flow List',
    eyebrow: 'MOBILE AUTOMATION CONTROL',
    title: 'Quản Lý Kịch Bản & Bật/Tắt Flow Trên Điện Thoại Chỉ Với 1 Chạm',
    subtitle:
      'Tối ưu toàn bộ thẻ Flow, badge trạng thái Xanh/Đỏ và bộ lọc Segmented Control để Quản lý duyệt và theo dõi tiến độ mọi nơi.',
    image: '/imgs/automation/mobile-automation-flows.png',
    badgeText: 'Mobile Ready • 1-Tap Pause/Resume',
    modeTag: 'Standalone',
    routeLabel: 'Mobile /marketing/flows',
    isMobile: true,
    metrics: [
      { label: 'Segmented Tab', value: '1 Row Clean', tone: 'blue' },
      { label: 'Touch Targets', value: '>= 44px', tone: 'emerald' },
    ],
    highlights: [
      'Không rớt chữ hay vỡ layout khi hiển thị tên chiến dịch dài tiếng Việt',
      'Xem ngay số Bước, Lượt tham gia & % Hoàn thành trên màn hình dọc',
    ],
  },
  {
    id: 'mobile-campaigns',
    category: 'mobile',
    tabLabel: 'Mobile Campaigns',
    eyebrow: 'MOBILE BROADCAST INSPECTOR',
    title: 'Theo Dõi Chiến Dịch Email & Zalo ZNS Mọi Lúc Mọi Nơi',
    subtitle:
      'Kiểm tra tỷ lệ gửi, mở Mail và CTR chiến dịch tức thì trước cuộc họp mà không cần mở laptop.',
    image: '/imgs/automation/mobile-email-campaigns.png',
    badgeText: 'Live Progress • Zero Clipping',
    modeTag: 'Standalone',
    routeLabel: 'Mobile /marketing/campaigns',
    isMobile: true,
    metrics: [
      { label: 'Cards Layout', value: 'Stacked Responsive', tone: 'blue' },
      { label: 'Drawer View', value: 'Swipe Sheet', tone: 'sky' },
    ],
    highlights: [
      'Card hiển thị rõ trạng thái Đã hoàn thành / Đang gửi / Nháp',
      'Mở Drawer xem chi tiết funnel & link clicks mượt như app iOS',
    ],
  },
  {
    id: 'mobile-social-bot',
    category: 'mobile',
    tabLabel: 'Mobile Social Bot',
    eyebrow: 'MOBILE OMNICHANNEL BOT',
    title: 'Điều Phối Meta Messenger & Zalo OA ZNS Gọn Gàng Trên Mobile',
    subtitle:
      'Chuyển kênh Messenger <-> Zalo OA & ZNS, duyệt kịch bản trả lời và theo dõi hội thoại AI ngay trên điện thoại không bị che bởi nút chat nổi.',
    image: '/imgs/automation/mobile-social-bot.png',
    badgeText: 'Mobile Stack • Safe Bottom Padding',
    modeTag: 'Standalone',
    routeLabel: 'Mobile /marketing/social-bot',
    isMobile: true,
    metrics: [
      { label: 'Safe Padding', value: 'pb-24 Guarded', tone: 'emerald' },
      { label: 'Channel Switch', value: '2-Button Clean', tone: 'blue' },
    ],
    highlights: [
      'Chuyển tab Messenger & Zalo ZNS mượt mà, căn lề sạch sẽ chuẩn mobile',
      'Chừa vùng an toàn phía dưới không bị đè bởi widget chat hoặc bottom dock',
    ],
  },
];

export const FLOW_SIM_PRESETS: FlowSimPreset[] = [
  {
    id: 'webinar_ai',
    label: 'Webinar MSc AI & Tuyển Sinh',
    shortDesc: 'Khi khách điền Form Webinar → Gửi Mail xác nhận → Chờ 2 giờ → Nhắc Zalo ZNS → Phân nhánh theo Mở Mail',
    enrolledCount: '1.758 khách/chiến dịch',
    conversionRate: '32.4% Đặt lịch Tư vấn',
    avgDuration: '7 ngày nuôi dưỡng',
    nodes: [
      {
        id: 'n1',
        stepType: 'trigger',
        title: 'Trigger: Nộp Form Webinar 25.11',
        subtitle: 'Form đã ánh xạ Phân khúc ĐK Webinar',
        branch: 'root',
        timingLabel: 'T+0 giây (Instant)',
        previewHeadline: 'Sự kiện Trigger: form.submitted → UUID Form Webinar',
        previewSummary:
          'Ngay khi học viên điền Form trên Landing Page (ideas.edu.vn / chiefaiofficer.vn), hệ thống tự động chống trùng Lead theo SĐT/Email, bảo toàn custom fields và đưa vào nhánh chính.',
        payloadPreview: [
          'trigger_type: "form"',
          'form_id: "61f60b95-6307-5763-9439-0866609e2141"',
          'audience_sync: "Đăng ký Webinar 25/11 (+1 member)"',
        ],
        screenshot: '/imgs/automation/automation-flows-list.png',
        metricsChip: '17 Active Flows Live',
      },
      {
        id: 'n2',
        stepType: 'email',
        title: 'Action 1: Gửi Email Xác Nhận AWS SES',
        subtitle: 'Kèm link Zoom & tài liệu brochure PDF',
        branch: 'root',
        timingLabel: 'T+5 giây (14 mail/s)',
        previewHeadline: '[IDEAS] Xác nhận đăng ký tư vấn & Link tham dự Webinar',
        previewSummary:
          'Gửi qua AWS SES v2 từ sender đã xác thực (tuyensinh@ideas.edu.vn), tự động nhúng biến {{lead.name}}, Open Pixel HMAC và Click Wrapping để đo từng liên kết.',
        payloadPreview: [
          'provider: "aws_ses_token_bucket (14/s)"',
          'template: "3de64fc1-00a8-5eeb-a584-dcf64cf7e07d"',
          'tracking: "open_pixel + hmac_unsubscribe"',
        ],
        screenshot: '/imgs/automation/flow-step-email-modal.png',
        metricsChip: 'Live HTML Preview',
      },
      {
        id: 'n3',
        stepType: 'wait',
        title: 'Wait Delay: Chờ 02 Giờ trước sự kiện',
        subtitle: 'Tạm dừng an toàn, Worker Cron đánh thức đúng bước kế',
        branch: 'root',
        timingLabel: 'T+2 giờ',
        previewHeadline: 'Lưu trạng thái wait_until tại PostgreSQL & resume đúng bước',
        previewSummary:
          'Flow không chạy vòng lặp ngốn RAM mà lưu mốc `next_run_at`. Master Cron đánh thức và nối tiếp chính xác sang bước Condition/ZNS — zero duplication.',
        payloadPreview: [
          'state: "waiting" -> next_step: "condition_opened"',
          'cron_worker: "marketing-flows (PostgreSQL Lock)"',
        ],
        screenshot: '/imgs/automation/automation-flow-builder.png',
        metricsChip: 'Zero-Duplicate Resume',
      },
      {
        id: 'n4',
        stepType: 'condition',
        title: 'Condition: Đã mở Email & Xem Bảng Giá?',
        subtitle: 'Kiểm tra mở Mail hoặc Web Tracking /pricing Intent',
        branch: 'root',
        timingLabel: 'Đánh giá tức thì',
        previewHeadline: 'Rẽ nhánh thông minh (Nhánh ĐÚNG → Ưu tiên / Nhánh SAI → ZNS)',
        previewSummary:
          'Kết hợp hành vi mở Email, Click link Brochure và lịch sử Retroactive Web Tracking trên website để chia đúng luồng chăm sóc.',
        payloadPreview: [
          'IF opened_email == true OR web_intent == "/hoc-phi"',
          '  TRUE  → Push to CRM Sale Round + Tag "Hot_Webinar"',
          '  FALSE → Nhắc Zalo ZNS Template #565864 (06:00–22:00)',
        ],
        screenshot: '/imgs/automation/flow-analytics-tab.png',
        metricsChip: 'Hành vi + Web Tracking',
      },
      {
        id: 'n5',
        stepType: 'zalo_zns',
        title: 'Nhánh Bổ Trợ: Gửi Tin Nhắn Zalo ZNS',
        subtitle: 'Tự động lùi sang 06:00 sáng nếu ngoài giờ 22:00',
        branch: 'no',
        timingLabel: '06:00–22:00 VN',
        previewHeadline: 'ZNS Template #565864: Nhắc lịch tham gia Webinar AI',
        previewSummary:
          'Chuẩn hóa SĐT 0909... <-> 84909..., kiểm tra danh sách từ chối/chống spam, điền biến {{customer_name}} & {{time}} và gửi qua Zalo OA chính thức.',
        payloadPreview: [
          'zalo_template: "565864 • Nhắc lịch Webinar"',
          'quiet_hours_guard: "06:00 - 22:00 Asia/Ho_Chi_Minh"',
          'retry_on_token_expiry: "-124 OAuth Auto Refresh"',
        ],
        screenshot: '/imgs/automation/flow-step-zns-modal.png',
        metricsChip: 'Đúng chuẩn Zalo ZNS',
      },
      {
        id: 'n6',
        stepType: 'crm_handoff',
        title: 'Nhánh Nóng: Đẩy Sale Portal & Meta CAPI',
        subtitle: 'Khách quan tâm cao → Chia Sale công bằng & Bắn CAPI',
        branch: 'yes',
        timingLabel: 'Khi đạt Intent >= 70',
        previewHeadline: 'Đồng bộ thẳng sang Auto Data Sale & Meta CAPI Schedule',
        previewSummary:
          'Trong hệ sinh thái Growth Suite / DOM PROMAX, Flow kích hoạt vòng chia số Round-Robin thông báo ZaloBot cho Sale nhận khách trong < 3 giây và bắn Meta CAPI.',
        payloadPreview: [
          'action: "promote_to_crm_round + send_capi_schedule"',
          'target: "Growth Suite / DOM PROMAX Shared DB"',
          'capi_event: "Schedule (EMQ 6.4+)"',
        ],
        screenshot: '/imgs/automation/meta-capi-sync.png',
        metricsChip: 'Growth Suite Bridge',
      },
    ],
  },
  {
    id: 'lead_nurture',
    label: 'Nuôi Dưỡng & Lọc Ý Định AI',
    shortDesc: 'Gia nhập phân khúc Tổng Data → Chấm điểm hành vi AI RAG → Cá nhân hóa lộ trình 3 điểm chạm',
    enrolledCount: '4.680+ lượt chạy thực tế',
    conversionRate: '22.8% Mở Mail trung bình',
    avgDuration: '14 ngày tự động',
    nodes: [
      {
        id: 'l1',
        stepType: 'trigger',
        title: 'Trigger: Gia Nhập Phân Khúc Tổng Data',
        subtitle: 'Đồng bộ từ Sheet / Segment AND-OR',
        branch: 'root',
        timingLabel: 'Realtime Sync',
        previewHeadline: 'Audience Trigger: audience.entered -> Tổng Data',
        previewSummary:
          'Bất kỳ Lead nào đạt bộ lọc Phân khúc Động (ví dụ: quan tâm Chief AI Officer, chưa chốt tư vấn 7 ngày) sẽ tự động nhập luồng không trùng lặp.',
        payloadPreview: [
          'audience: "Tổng Data (35264443-bf17-...)"',
          'dedup_policy: "enrollStrategy = new_only"',
        ],
        screenshot: '/imgs/automation/audience-segments.png',
        metricsChip: '39 Phân khúc động',
      },
      {
        id: 'l2',
        stepType: 'email',
        title: 'Email 1: Gửi Case Study Thực Chiến + CTA Quiz',
        subtitle: 'Dẫn link Khảo sát định hướng có Tag tự động',
        branch: 'root',
        timingLabel: 'T+1 phút',
        previewHeadline: 'Khảo sát nhu cầu + tự động gắn Tag phân loại khách hàng',
        previewSummary:
          'Khách trả lời Khảo sát công khai tại /s/:slug sẽ tự động được chấm điểm Quiz và phân loại nhu cầu (Quản lý, Kỹ thuật, Doanh nghiệp).',
        payloadPreview: [
          'survey_slug: "/s/khao-sat-dinh-huong-..."',
          'on_complete: "redirect_rules -> assignTag + Segment"',
        ],
        screenshot: '/imgs/automation/survey-report-modal.png',
        metricsChip: 'Auto Tagging Survey',
      },
      {
        id: 'l3',
        stepType: 'wait',
        title: 'Wait & Theo Dõi Truy Cập Website',
        subtitle: 'Lắng nghe sự kiện DOMATION SDK trên mọi trang',
        branch: 'root',
        timingLabel: 'Chờ 3 ngày / Web Event',
        previewHeadline: 'Theo dõi Web Tracking & kích hoạt AI Bot hỗ trợ trực tiếp',
        previewSummary:
          'Khi khách đọc lại bài viết hoặc mở khung Chat AI trên website, Bot AI sử dụng RAG 150+ tài liệu đã huấn luyện để tư vấn chuẩn xác.',
        payloadPreview: [
          'web_tracking_sessions: "54.652 sessions"',
          'ai_rag_docs: "150 trained docs across 2 properties"',
        ],
        screenshot: '/imgs/automation/ai-bot-training.png',
        metricsChip: '150 Docs RAG Ready',
      },
      {
        id: 'l4',
        stepType: 'zalo_zns',
        title: 'Zalo ZNS Cá Nhân Hóa Theo Kết Quả Quiz',
        subtitle: 'Gửi đúng mẫu tin tương ứng ngành nghề',
        branch: 'yes',
        timingLabel: 'Tự động trong giờ vàng',
        previewHeadline: 'Zalo ZNS Template #446723: Gửi bộ tài liệu chuyên sâu',
        previewSummary:
          'Đính kèm đúng quyền lợi tư vấn đã khớp ở bước Survey/Web Tracking giúp tăng gấp 3 lần tỷ lệ phản hồi qua Zalo OA.',
        payloadPreview: [
          'zns_template_code: "446723"',
          'params: "{ customer_name, program }"',
        ],
        screenshot: '/imgs/automation/social-bot-zalo.png',
        metricsChip: 'Zalo OA Connected',
      },
      {
        id: 'l5',
        stepType: 'webhook',
        title: 'Outbound Webhook HMAC Về Hệ Thống Ngoài',
        subtitle: 'Hỗ trợ chữ ký SHA-256 + 5 lần Retry + DLQ Replay',
        branch: 'no',
        timingLabel: 'Server-to-Server',
        previewHeadline: 'Webhook SSRF-Safe + Idempotency Key 24h',
        previewSummary:
          'Gửi sự kiện khách đạt điểm Lead Score cao về MISA, Google Sheets hoặc ERP riêng của doanh nghiệp, bảo vệ bằng SSRF guard.',
        payloadPreview: [
          'headers: "X-Webhook-Signature: hmac-sha256(...)"',
          'dlq_retry: "Exponential backoff x5"',
        ],
        screenshot: '/imgs/automation/marketing-dashboard.png',
        metricsChip: 'DLQ Safe Replay',
      },
    ],
  },
  {
    id: 'voucher_reactivation',
    label: 'Voucher, Shortlink & Winback',
    shortDesc: 'Cấp mã Voucher độc bản → Đếm ngược SVG Email → Quét QR sự kiện → Thu hồi khách ngủ đông',
    enrolledCount: '1.200+ khách quay lại',
    conversionRate: '18.5% Đổi mã ưu đãi',
    avgDuration: '72 giờ tạo độ khan hiếm',
    nodes: [
      {
        id: 'v1',
        stepType: 'trigger',
        title: 'Trigger: Khách Ngủ Đông > 30 Ngày / Nhận Voucher',
        subtitle: 'Tự lọc tập ít tương tác gần đây',
        branch: 'root',
        timingLabel: 'T+0 (Scheduled)',
        previewHeadline: 'Tự động phát hiện tập khách chưa tương tác > 30 ngày',
        previewSummary:
          'Sinh mã ưu đãi duy nhất cho từng khách hàng (ví dụ: DOM-AI20) và kích hoạt chuỗi nhắc nhở đa kênh với đồng hồ đếm ngược.',
        payloadPreview: [
          'voucher_campaign: "Học bổng / Ưu đãi doanh nghiệp"',
          'code_mode: "unique_per_lead"',
        ],
        screenshot: '/imgs/automation/vouchers-qr.png',
        metricsChip: 'Unique Voucher Pool',
      },
      {
        id: 'v2',
        stepType: 'email',
        title: 'Email Ưu Đãi Kèm Countdown SVG Động',
        subtitle: 'Đếm ngược trực tiếp theo múi giờ +07:00 VN',
        branch: 'root',
        timingLabel: 'T+0 giây',
        previewHeadline: 'Countdown SVG Live: /api/v1/public/marketing/timer',
        previewSummary:
          'Mỗi khi khách mở Mail, ảnh SVG đếm ngược Ngày/Giờ/Phút/Giây được dựng động từ backend, hiển thị sắc nét kể cả nền tối hay sáng.',
        payloadPreview: [
          'timer_svg: "https://data.domation.net/api/v1/public/marketing/timer?color=ffffff&bg=transparent"',
          'claim_url: "https://erp.domation.net/claim/:id"',
        ],
        screenshot: '/imgs/automation/email-editor.png',
        metricsChip: 'Live Countdown SVG',
      },
      {
        id: 'v3',
        stepType: 'condition',
        title: 'Condition: Đã Click Shortlink hoặc Claim Voucher?',
        subtitle: 'Đo dedup click link rút gọn `/r/:code`',
        branch: 'root',
        timingLabel: 'Sau 48 giờ',
        previewHeadline: 'Đo chính xác Unique Link Click & trạng thái Claimed',
        previewSummary:
          'Nếu khách đã nhận mã nhưng chưa sử dụng, tự động gửi tin nhắn nhắc Zalo ZNS trước khi hết hạn 12 giờ cuối.',
        payloadPreview: [
          'IF voucher.status == "claimed" AND redeemed == false',
          '  SEND Reminder Zalo ZNS + Messenger Card',
        ],
        screenshot: '/imgs/automation/campaign-detail-drawer.png',
        metricsChip: 'Dedup Click Tracking',
      },
      {
        id: 'v4',
        stepType: 'crm_handoff',
        title: 'Hoàn Tất: Gạch Mã QR Tại Quầy & Ghi Doanh Thu',
        subtitle: 'Đồng bộ doanh số vào báo cáo Marketing ROI',
        branch: 'yes',
        timingLabel: 'Khi Đổi Mã',
        previewHeadline: 'Đối soát doanh thu thực theo từng chiến dịch & mã Voucher',
        previewSummary:
          'Nhân viên quét QR Code sự kiện hoặc xác nhận mã tại quầy -> hệ thống tự cập nhật Revenue về Marketing Cockpit & CRM.',
        payloadPreview: [
          'status: "redeemed"',
          'attributed_revenue_vnd: "+25.000.000₫"',
        ],
        screenshot: '/imgs/automation/web-tracking.png',
        metricsChip: 'Closed-Loop ROI',
      },
    ],
  },
];

export interface DeploymentModeRow {
  capability: string;
  standalone: string;
  growthCombo: string;
  domPromax: string;
}

export const DEPLOYMENT_MODE_COMPARISON: DeploymentModeRow[] = [
  {
    capability: 'Triển khai UI & Sidebar',
    standalone: 'App Marketing độc lập — 0 nút ERP, gọn nhẹ 100%',
    growthCombo: 'Hợp nhất Auto Chia Data Sale + Marketing Suite',
    domPromax: 'Full Hệ điều hành 12 phân hệ ERP + Marketing + Meta',
  },
  {
    capability: 'Email Studio, AWS SES 14/s & A/B Test',
    standalone: 'Đầy đủ 100%',
    growthCombo: 'Đầy đủ 100%',
    domPromax: 'Đầy đủ 100%',
  },
  {
    capability: 'Visual Flow Builder, Zalo ZNS & Social Bot',
    standalone: 'Đầy đủ 100% (Kịch bản + Khảo sát + Voucher + AI RAG)',
    growthCombo: 'Đầy đủ + Đẩy thẳng khách nóng sang Sale Round',
    domPromax: 'Đầy đủ + Kích hoạt Flow theo Trạng thái Đóng phí/Học vụ',
  },
  {
    capability: 'Meta Conversions API (CAPI) & DOM Meta Report',
    standalone: 'Nâng cấp 1 chạm khi cần chạy Ads',
    growthCombo: 'Đã mở khóa sẵn (Dual-Pixel + Lead/Purchase CAPI)',
    domPromax: 'Mở khóa toàn bộ + Đối soát CPA/ROAS theo doanh thu thực',
  },
  {
    capability: 'Chia số Sale ZaloBot, Chống trùng 180 ngày & Pipeline',
    standalone: 'Chỉ chuyển qua Webhook ngoài',
    growthCombo: 'Mở khóa gốc ngay trong cùng hệ thống',
    domPromax: 'Full CRM 360°, Đơn hàng, Công nợ & Chấm công GPS/Payroll',
  },
  {
    capability: 'Nâng cấp mở rộng hệ thống',
    standalone: '1-Click nâng cấp — ZERO migrate dữ liệu',
    growthCombo: '1-Click bật thêm phân hệ ERP 5.0',
    domPromax: 'Toàn bộ kiến trúc Multi-Tenant RLS đồng nhất',
  },
];
