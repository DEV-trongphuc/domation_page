import type { PortfolioProject } from './boostTypes';

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'ecolife-signature',
    name: 'EcoLife Signature Đà Nẵng • Web 3D & Auto F1 Router',
    client: 'Capital House Group',
    industry: 'Bất Động Sản Xanh chuẩn IFC EDGE',
    category: 'Bất Động Sản',
    year: '2026',
    logo: '/assets/partners/logo_capital_house.webp',
    previewImage: '/assets/ecolife/bocmai/bocmai_3d_b3.webp',
    liveUrl: 'https://ai.ecolifesignature.vn/',
    problem:
      'Chủ đầu tư cần không gian số Quiet Luxury tương xứng chuẩn BĐS Xanh EDGE, cho phép khách hàng từ xa xem mặt bằng 3D căn hộ và chia Lead tự động minh bạch cho 3 Đại lý F1 (Tùng Long, Hợp Nhất, IHD).',
    implementationPain:
      'Mô hình 3D kiến trúc gốc nặng 80MB gây giật lag trên iPhone Safari; tranh cãi dễ phát sinh nếu chia số lệch hoặc Sàn F1 báo lỗi số thuê bao không được bù kịp thời.',
    architecture:
      'Nén Draco GLB 8 mẫu căn hộ 3D (<3.5MB/căn) + Trợ lý AI Sale 24/7 + Auto Chia Data 3 cổng F1 qua ZaloBot <5s + Bù Ticket lỗi 1:1 + Meta CAPI SHA-256 + 25 ấn phẩm OOH gắn QR Tracking.',
    deliverables: [
      'Website Quiet Luxury & Sa bàn Three.js 8 căn hộ 3D',
      'Trợ lý AI Sale trực dự án 24/7 (ai.ecolifesignature.vn)',
      'Auto Data Router 3 cổng F1 độ lệch ~0% & Meta CAPI HTTP 200',
      '25 ấn phẩm OOH tích hợp QR Tracking ID',
    ],
    metrics: ['8 Mẫu Căn 3D', 'Chia Lead < 5s', '3 Đại Lý F1 ~0% lệch', '25 Ấn Phẩm OOH'],
    relatedArticleSlug: 'minh-bach-chia-gio-hang-bu-ticket-loi-3-dai-ly-f1-ecolife',
    inspectionTab: 'web-3d',
  },
  {
    id: 'inkica-ai',
    name: 'INKICA AI POD Studio • Multi-Agent 3D CAD Prepress',
    client: 'INKICA Global Studio',
    industry: 'Print-on-Demand & AI 3D Garment',
    category: 'AI & Prepress 3D',
    year: '2026',
    logo: '/assets/partners/logo_inkica_icon.svg',
    previewImage: '/assets/inkica/inkica_aop_3d.jpg',
    liveUrl: 'https://ai.inkica.com/',
    problem:
      'Ngành sản xuất may mặc in ấn POD toàn cầu tốn 45–60 phút chỉnh tay từng SKU để tách nền 300 DPI, áp rập .PSD và render Mockup đa màu vải.',
    implementationPain:
      'Chạy 20+ mô hình AI (SAM 3, ViTMatte, Upscaler) đồng thời gây tràn VRAM GPU và méo tọa độ lưới UV đường may khi áp lên mô hình 3D.',
    architecture:
      'Next.js 14 + Three.js + BullMQ GPU Worker Pool điều phối 6 AI Prepress Agents trong 1 khung Chat Orchestrator với chuẩn hóa Cubic Bezier UV.',
    deliverables: [
      'Omni Orchestrator 6 AI Prepress Agents qua Chat',
      'Neural Extract tách nền 300 DPI (SAM 3 + ViTMatte)',
      'AOP 3D CAD 208 SKU & 88 Canonical Models không lệch mép',
      'Quick Mockup Render 4K đa màu vải hàng loạt',
    ],
    metrics: ['208 SKU AOP 3D', '6 AI Agents', '0 px lệch đường may', '300 DPI AI'],
    relatedArticleSlug: 'trien-khai-multi-agent-ai-prepress-208-sku-3d-cad-inkica',
    inspectionTab: 'inkica',
  },
  {
    id: 'ideas-business',
    name: 'IDEAS Business • ERP 5.0 12 Phân Hệ & Phễu MBA',
    client: 'Viện Quản Trị & Đào Tạo IDEAS',
    industry: 'Giáo Dục Sau Đại Học • MBA Quốc Tế',
    category: 'Giáo Dục & ERP',
    year: '2025–2026',
    logo: '/assets/partners/logo_ideas.webp',
    previewImage: '/landingpage_avatar/ideasmba.webp',
    liveUrl: 'https://ideas.edu.vn/mba',
    problem:
      'Viện cần scale quy mô tuyển sinh MBA Quốc tế đồng thời thay thế 14 file Excel vận hành rời rạc giữa Tuyển sinh, Đào tạo, Nhân sự và Kế toán.',
    implementationPain:
      'Chu kỳ cân nhắc khóa học 30–90 ngày khiến Tư vấn viên bỏ sót 70% Lead ấm; nhân sự ngại chuyển từ Excel sang ERP nếu thao tác quá phức tạp.',
    architecture:
      'ERP 5.0 May đo 12 phân hệ (Task Kanban, Chấm công GPS AI, Duyệt đơn, Payroll PDF) + Auto Lead Router + Flow Amazon SES & Zalo Mini App + Meta Ad Realtime Report.',
    deliverables: [
      'Enterprise ERP 5.0 May đo 12 Phân hệ & Payroll PDF',
      'Hệ thống Phễu Tuyển sinh & CRM 8 nấc nuôi dưỡng dài ngày',
      'Meta Ad Realtime Report & Auto Lead Router',
      'Hệ thống Website IDEAS & Trang MBA chuẩn SEO Top 1',
    ],
    metrics: ['+300% Quy mô (20->60 HV)', '-30% CPA (12-14M)', '12,600+ Leads', '12 Phân Hệ ERP'],
    relatedArticleSlug: 'quan-ly-pheu-tuyen-sinh-mba-nang-quy-mo-60-hoc-vien-giam-30-cpa',
    inspectionTab: 'erp',
  },
  {
    id: 'phucloctho-ampersand',
    name: 'Phúc Lộc Thọ • POS ZNS & Phễu Nhượng Quyền',
    client: 'Cơm Tấm Phúc Lộc Thọ',
    industry: 'Chuỗi F&B & Nhượng Quyền 30+ Cửa Hàng',
    category: 'F&B & Nhượng Quyền',
    year: '2025–2026',
    logo: '/assets/partners/logo_phucloctho.webp',
    previewImage: '/assets/domation/auto_voucher.webp',
    liveUrl: 'https://phucloctho.vn',
    problem:
      'Kết nối dữ liệu mua hàng tại 30+ cửa hàng POS để chăm sóc khách quay lại tự động và xây dựng phễu sàng lọc đối tác Nhượng quyền chất lượng cao.',
    implementationPain:
      'POS không đồng nhất webhook push realtime; phát mã giảm giá tĩnh bị lạm dụng; 80% người điền form nhượng quyền không đủ vốn tối thiểu.',
    architecture:
      'POS Middleware Adapter -> Zalo ZNS hậu mãi & Survey 2h sau ăn -> Voucher Hub mã động 1 lần -> Phễu Nhượng quyền 2 tầng chấm Lead Score vốn/mặt bằng.',
    deliverables: [
      'Đồng bộ POS đa chi nhánh với Zalo ZNS & Audience Hub',
      'Voucher Hub phát mã ưu đãi động chống gian lận',
      'Phễu Survey & Lead Score Nhượng quyền 1.600+ hồ sơ',
      'Quảng cáo tối ưu chuyển đổi đạt ROAS 5+',
    ],
    metrics: ['30+ Cửa Hàng', '20+ Cửa Hàng Mới', '1,600+ Leads Franchise', 'ROAS 5+'],
    relatedArticleSlug: 'dut-gay-du-lieu-pos-cskh-chuoi-fb-zalo-zns-voucher-hub-roas-5',
    inspectionTab: 'autoflow',
  },
  {
    id: 'flora-dental',
    name: 'Nha Khoa Flora • Hệ Thống Affiliate KOL, VietQR ACB & Voucher Hub',
    client: 'Hệ Thống Nha Khoa Flora',
    industry: 'Y Tế & Nha Khoa Thẩm Mỹ',
    category: 'Y Tế & Nha Khoa',
    year: '2026',
    logo: '/assets/partners/partner_flora.webp',
    previewImage: '/assets/flora/flora_admin_dashboard.webp',
    liveUrl: 'https://nhakhoaflora.com',
    problem:
      'Xây dựng mạng lưới Affiliate KOL & Bác sĩ giới thiệu gói dịch vụ nha khoa (Care Plus, White Up, Implant), tự động đối soát thanh toán VietQR ACB và chi trả hoa hồng minh bạch.',
    implementationPain:
      'Đơn hàng dễ thất lạc mã giới thiệu khi khách chuyển khoản; KOL ngại đăng nhập tài khoản phức tạp; thông tin khách hàng y tế cần che SĐT chuẩn bảo mật HIPAA.',
    architecture:
      'Cổng đặt Voucher sinh mã VietQR ACB chuẩn cú pháp FLORA <MÃ_KOL> <SĐT> <MÃ_ĐƠN>, ACB Webhook đối soát tức thì, Link Partner Portal qua Secret Hash Token, che SĐT chuẩn HIPAA và Zalo OA + Email báo hoa hồng.',
    deliverables: [
      'Cổng Affiliate Partner Portal không cần đăng nhập (Secret Token) & Bảng kê doanh thu',
      'Cổng Checkout E-Voucher & VietQR ACB Webhook đối soát tự động 100%',
      'Quản trị Admin duyệt rút tiền Napas 24/7, Zalo OA & Email thông báo hoa hồng',
    ],
    metrics: ['Webhook ACB Tức Thì', 'Hoa Hồng Chỉ Tính Paid', 'Chuẩn Y Khoa HIPAA'],
    relatedArticleSlug: 'chong-sot-lich-hen-tu-dong-nhac-tai-kham-nha-khoa-flow-if-else',
    inspectionTab: 'autoflow',
  },
  {
    id: 'navastore-ecommerce',
    name: 'Nava Store • Website E-Commerce & Tracking CRM',
    client: 'Nava Store',
    industry: 'Thương Mại Điện Tử & Bán Lẻ',
    category: 'E-Commerce & B2B',
    year: '2025',
    logo: '/assets/partners/partner_navastore.webp',
    previewImage: '/landingpage_avatar/nava.webp',
    liveUrl: 'https://navastore.vn/',
    problem:
      'Xây dựng cửa hàng trực tuyến hiện đại, tốc độ cao, tối ưu trải nghiệm mua hàng Mobile và kết nối đồng bộ đơn hàng về CRM/Kế toán.',
    implementationPain:
      'Các nền tảng E-commerce template nặng làm chậm tải trang khi chạy Ads và dễ lệch tồn kho/hóa đơn khi đối soát kế toán.',
    architecture:
      'Giao diện thiết kế riêng tối ưu chuyển đổi + Tracking hành vi Pixel/CAPI + Đồng bộ giỏ hàng, thanh toán và hóa đơn điện tử.',
    deliverables: [
      'Website E-Commerce UI/UX hiện đại tốc độ < 3s',
      'Gắn sâu Web Tracking & Meta CAPI tối ưu đơn hàng',
      'Đồng bộ đơn hàng & danh mục SKU chuẩn hóa',
    ],
    metrics: ['Tốc độ tải < 3s', 'SEO On-Page 100%', 'Pixel + CAPI Sync'],
    relatedArticleSlug: 'dong-bo-hoa-don-dien-tu-misa-hai-chieu-tu-crm-360',
    inspectionTab: 'web-3d',
  },
  {
    id: 'brandson-academy',
    name: 'Brandson Academy • Landing Page CME & Phễu Đào Tạo Y Khoa',
    client: 'Brandson Academy',
    industry: 'Đào Tạo Nha Khoa & Y Khoa CME',
    category: 'Y Tế & Nha Khoa',
    year: '2025',
    logo: '/assets/partners/partner_brandson.webp',
    previewImage: '/landingpage_avatar/brandson.webp',
    liveUrl: 'https://brandson.vn',
    problem:
      'Thiết kế Landing Page đào tạo chuyên sâu cho giới Bác sĩ Nha khoa đạt tỷ lệ chuyển đổi đăng ký khóa học cao và đồng bộ CSKH tự động.',
    implementationPain:
      'Khách hàng là Bác sĩ bận lịch khám, khó nghe điện thoại giờ hành chính -> cần luồng đăng ký tinh gọn và gửi tài liệu qua Email/Zalo tức thì.',
    architecture:
      'Landing Page Storytelling học thuật + Email Amazon SES xác nhận & gửi Syllabus + Webhook đẩy hồ sơ về CRM.',
    deliverables: [
      'Landing Page Brandson Academy chuẩn nhận diện',
      'Tích hợp Form đăng ký tức thì & Email xác nhận 98% Inbox',
      'Hệ thống Tracking chuyển đổi đa kênh',
    ],
    metrics: ['98% Inbox Email', 'Chuyển đổi cao B2B', 'Sync CRM < 5s'],
    relatedArticleSlug: 'email-marketing-amazon-ses-98-inbox-flow-if-else-theo-hanh-vi',
    inspectionTab: 'web-3d',
  },
  {
    id: 'richland-proptech',
    name: 'Rich Land • CRM Chia Lead & Kho DataBank',
    client: 'Rich Land',
    industry: 'Phát Triển & Phân Phối Bất Động Sản',
    category: 'Bất Động Sản',
    year: '2026',
    logo: '/assets/partners/partner_richland.webp',
    previewImage: '/assets/domation/data_v2_ads_pipeline.webp',
    liveUrl: 'https://rich-land.vercel.app/',
    problem:
      'Cần nền tảng CRM điều phối nguồn khách hàng đa dự án theo cả cơ chế tranh nhận data tốc độ cao lẫn chia theo vòng công bằng, kết hợp kho DataBank lưu trữ & khai thác lại.',
    implementationPain:
      'Lead đổ về từ nhiều chiến dịch dễ bị rơi rớt khi Sale bận, khó kiểm soát ai đang giữ khách và nguồn data cũ chưa được đưa về kho DataBank dùng lại.',
    architecture:
      'CRM chia Lead hai chế độ (Tranh nhận / Chia vòng) + Kho DataBank tập trung + Lọc trùng đa kênh & SLA tự thu hồi + Meta CAPI.',
    deliverables: [
      'Cơ chế tranh nhận data (Pool Claim) & chia theo vòng tự động',
      'Kho DataBank phân loại nguồn, tái phân bổ & chống trùng SĐT',
      'Ads Pipeline Tracker đo tỷ lệ Thiện chí từng chiến dịch',
    ],
    metrics: ['Tranh Nhận / Chia Vòng', 'Kho DataBank Tập Trung', 'Lọc trùng đa kênh'],
    relatedArticleSlug: 'bay-chi-so-cpl-ao-meta-ads-doi-chieu-graph-api-doanh-thu-crm',
    inspectionTab: 'data-capi',
  },
  {
    id: 'implantswiss-crm',
    name: 'ImplantSwiss Việt Nam • Hạ Tầng Data & Bảo Mật RLS',
    client: 'ImplantSwiss',
    industry: 'Thiết Bị Nha Khoa & Cấy Ghép Implant',
    category: 'Y Tế & Nha Khoa',
    year: '2025–2026',
    logo: '/assets/partners/partner_implantswiss.png',
    previewImage: '/assets/domation/data_v2_capi_masked.webp',
    liveUrl: 'https://implantswiss.vn/',
    problem:
      'Quản lý data khách hàng B2B (Bác sĩ/Phòng khám) và khách hàng nha khoa với yêu cầu bảo mật thông tin nghiêm ngặt và chống trùng chéo giữa các vùng.',
    implementationPain:
      'Cần che số điện thoại trên báo cáo tổng hợp và kiểm soát chặt quyền truy cập dữ liệu giữa các khu vực bán hàng.',
    architecture:
      'CRM phân quyền Row-Level Security theo khu vực + Phone Masking Audit + Auto Meta CAPI SHA-256.',
    deliverables: [
      'Phân quyền RLS cô lập dữ liệu từng vùng kinh doanh',
      'Nhật ký kiểm toán dữ liệu che SĐT bảo mật',
      'Chuẩn hóa phễu chăm sóc B2B & Bác sĩ đối tác',
    ],
    metrics: ['100% RLS Data Guard', 'SHA-256 CAPI Sync', '0% Lộ dữ liệu vùng'],
    relatedArticleSlug: 'bao-mat-du-lieu-benh-an-phan-quyen-rls-chi-nhanh-meta-ads',
    inspectionTab: 'data-capi',
  },
  {
    id: 'turnio-executive-portal',
    name: 'DOMATION / Turnio Architecture • Cổng Tri Thức SEO & GEO',
    client: 'DOMATION Enterprise (Internal Flagship)',
    industry: 'Martech • Enterprise OS • AI Automation',
    category: 'E-Commerce & B2B',
    year: '2026',
    logo: '/domation-logo.svg',
    previewImage: '/landingpage_avatar/portfolio.webp',
    liveUrl: 'https://portfo-turnio.vercel.app/',
    problem:
      'Xây dựng kiến trúc cổng thông tin doanh nghiệp tích hợp trợ lý AI RAG nội bộ, 24+ bài chuyên sâu chuẩn SEO/GEO và bản đồ 50 chủ đề tăng trưởng B2B.',
    implementationPain:
      'Ứng dụng React SPA dễ gặp lỗi trùng lặp thẻ Canonical/Title ở các trang con và thiếu chuẩn dữ liệu `llms.txt` cho AI Search.',
    architecture:
      'Dynamic SEO & JSON-LD Engine (`src/utils/seo.ts`) + RAG Hybrid Vector Search (`gemini-embedding-001`) + `/boost` Knowledge Hub + `/boost/:slug` Singlepost + `sitemap.xml` & `llms.txt`.',
    deliverables: [
      'Cổng thông tin Đa chuyên trang DOMATION.NET',
      'Trung tâm Tri thức /boost (24+ Bài SEO, 50 Chủ đề, 10 Keyword Clusters)',
      'Trợ lý AI RAG tư vấn giải pháp & báo giá 24/7',
      'Chuẩn hóa GEO llms.txt & Dynamic Schema.org',
    ],
    metrics: ['24+ Bài Chuẩn SEO', '50 Chủ Đề SEO', '100+ Từ Khóa', 'Full GEO llms.txt'],
    relatedArticleSlug: 'chien-luoc-seo-geo-2026-dua-doanh-nghiep-b2b-top-google-ai-overview',
    inspectionTab: 'web-3d',
  },
];
