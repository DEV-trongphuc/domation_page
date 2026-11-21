import {
  ORG_ID,
  SITE_URL,
  buildSoftwareAppSchema,
  type PageFaqItem,
  type PageSeoConfig,
} from '../utils/seoSchema.ts';

export const HOME_FAQS: PageFaqItem[] = [
  {
    question: 'Hệ sinh thái DOMATION gồm những sản phẩm và điểm chạm nào cho doanh nghiệp?',
    answer:
      'DOMATION kết hợp trọn bộ hai mặt trận: (1) Mặt tiền hút khách gồm Website thương hiệu, Landing Page chuyển đổi cao và Sa bàn 3D tương tác; (2) Bộ máy vận hành nội bộ gồm CRM Auto Data chia khách tức thì, Báo cáo Meta Ads & mở rộng Google Ads hợp nhất Lead CRM, Automation nuôi dưỡng khách hàng (Zalo ZNS, Email, tracking lượt mở/click & thời gian xem Website), và DOMATION ERP 5.0 tích hợp Đa Trợ Lý AI nội bộ.',
  },
  {
    question: 'DOMATION kết hợp Báo cáo Quảng cáo Meta & Google Ads với CRM như thế nào?',
    answer:
      'Thay vì chỉ đếm lượt nhấp hay tin nhắn trên trình quản lý quảng cáo, DOMATION kết nối 2 chiều giữa từng bài quảng cáo và danh sách khách hàng trong CRM/ERP: biết rõ nội dung nào ra khách, đồng thời từ từng khách hàng biết rõ đến từ nội dung nào, giao cho Sale nào, gọi ra sao và chốt bao nhiêu doanh thu.',
  },
  {
    question: 'Hệ thống Automation nuôi dưỡng khách hàng và tracking hành vi Website làm được gì?',
    answer:
      'DOMATION ghi nhận từng cú click, lượt cuộn trang, thời gian khách ở lại xem bảng giá trên Website và lượt mở/bấm Email để tự chấm điểm nhu cầu. Kịch bản tự động rẽ nhánh gửi Zalo ZNS nhắc hẹn, Zalo OA, Email cá nhân hóa, mã Voucher ưu đãi và báo nóng ngay cho Sale khi khách quay lại tìm hiểu.',
  },
  {
    question: 'Doanh nghiệp dùng DOMATION ERP có thể tùy chỉnh theo quy trình riêng và làm chủ dữ liệu không?',
    answer:
      'Có. DOMATION ERP 5.0 được thiết kế linh hoạt theo đúng sơ đồ tổ chức và cấp duyệt của từng doanh nghiệp: quản lý Pipeline bán hàng 360°, chia data công bằng, chấm công GPS, phê duyệt đơn từ/chi phí đa cấp cùng 4 Trợ Lý AI chạy ngầm bên trong ERP theo tài liệu nội bộ riêng, đảm bảo phân quyền chặt chẽ và bảo mật dữ liệu độc lập.',
  },
  {
    question: 'Chi phí các gói phần mềm DOMATION và Thiết kế Website chuẩn SEO là bao nhiêu?',
    answer:
      'Auto Data CRM và DOM Meta Report đều có 30 ngày dùng thử miễn phí 0₫. Sau dùng thử: DOM Meta Report từ 490.000₫/tháng (năm); Auto Data Standard 1.500.000₫/tháng (20 Sale • 15.000 Leads); Auto Data Pro 3.000.000₫/tháng (85 Sale • 100.000 Leads); Automation • CRM 360° • ERP 5.0 6.000.000₫/tháng (9.999 Users • 1.000.000 Leads, giảm 15% khi đóng năm). Gói Bespoke Enterprise ERP 5.0 may đo theo quy mô, và Website/3D WebGL từ 12.000.000₫ thanh toán 1 lần sở hữu toàn bộ source code.',
  },
  {
    question: 'Ai là Founder & CEO sáng lập và trực tiếp kiến trúc hệ sinh thái DOMATION?',
    answer:
      'DOMATION được sáng lập và trực tiếp kiến trúc từ A–Z bởi Huỳnh Trọng Phúc (TurnioDEV) — Founder & CEO DOMATION, Chuyên Gia AI Automation, Chuyên Gia Digital Marketing & MarTech với kinh nghiệm xây dựng 35+ hệ thống thực chiến cho 30+ doanh nghiệp (Capital House, INKICA AI, IDEAS Business, Phúc Lộc Thọ, Ampersand, En Group, Flora), xử lý 150,000+ Leads, ROAS 4.8x–8.2x và là tác giả sách "Facebook Ads: AI Chạy Không Được" (154 trang). Xem Portfolio chính thức tại https://portfo-turnio.vercel.app/.',
  },
];

export const AUTODATA_FAQS: PageFaqItem[] = [
  {
    question: 'DOMATION Auto Data chia Lead về máy Sale trong bao lâu?',
    answer:
      'Lead từ Meta Instant Form, TikTok, Ladipage hoặc Website được lọc trùng 180 ngày và phân bổ Round-Robin qua ZaloBot / Telegram Bot tức thì.',
  },
  {
    question: 'Cơ chế đền bù Ticket lỗi 1:1 và Van SLA 120s hoạt động như thế nào?',
    answer:
      'Nếu quá 120 giây Sale chưa nhận số, hệ thống tự thu hồi chuyển vòng để không rớt khách. Khi Sale hoặc Đại lý F1 báo số lỗi được Admin duyệt, hệ thống tự động bù +1 lượt mới ở vòng kế tiếp.',
  },
  {
    question: 'Hệ thống có đồng bộ Webhook từ TikTok Instant Form, Ladipage và Website tự động không?',
    answer:
      'Có. Cổng tiếp nhận một cửa tự động chuẩn hóa số điện thoại +84, gắn thẻ nguồn chiến dịch UTM và lọc trùng đa kênh 180 ngày từ Meta Ads, TikTok Instant Form, Ladipage, Google Ads và Website tức thì.',
  },
  {
    question: 'Làm sao chia data công bằng cho nhiều Đại lý F1 mà vẫn bảo mật RLS không lộ SĐT?',
    answer:
      'DOMATION áp dụng kiến trúc Row-Level Security (RLS) cấp cơ sở dữ liệu kết hợp che số điện thoại một phần và Round-Robin có trọng số, đảm bảo các sàn F1 không nhìn chéo dữ liệu của nhau và độ lệch phân bổ gần ~0%.',
  },
  {
    question: 'Chi phí sử dụng DOMATION Auto Data và Meta CAPI là bao nhiêu?',
    answer:
      'Gói tiêu chuẩn từ 1.500.000₫/tháng kèm 30 ngày dùng thử 0₫, bao gồm chia vòng 5 cổng, lọc trùng 6 tháng và tự động bắn Meta CAPI SHA-256 đạt HTTP 200.',
  },
];

export const ERP_FAQS: PageFaqItem[] = [
  {
    question: 'DOMATION Enterprise ERP 5.0 gồm những phân hệ chuyên sâu nào?',
    answer:
      'DOMATION ERP 5.0 tích hợp 12 phân hệ may đo trên một trục dữ liệu: Tiếp nhận Lead một cửa, Thuật toán chia Lead 5 cổng & Van chống ôm, Ma trận nhiệt độ & Form TTL1, Phiếu hợp tác Co-care hoa hồng 100%, Kho Databank đồng hồ bảo mật, Giỏ hàng dự án real-time, Chấm công GPS & Selfie AI, Payroll PDF, Quản lý PO & dòng tiền, Meta CAPI Forward-Only, Bảo mật RLS và Thông báo đa kênh.',
  },
  {
    question: 'Doanh nghiệp có thể làm chủ hệ thống và custom Flow riêng trên ERP 5.0 không?',
    answer:
      'Có. DOMATION ERP 5.0 thiết kế không hardcode: Admin có thể tự cấu hình mốc thời gian SLA, hạn mức nhận lead theo giờ/ngày/tháng, quy tắc cọc, bước phê duyệt đa cấp PO/nghỉ phép và phân quyền RLS ngay trên giao diện, hoặc may đo module riêng qua kiến trúc Vibecode.',
  },
  {
    question: 'Chấm công GPS vệ tinh kết hợp Selfie AI có chống được Fake GPS không?',
    answer:
      'Hệ thống kiểm tra đồng thời tọa độ bán kính Geofence văn phòng/chi nhánh, đối chiếu Wi-Fi BSSID tại điểm làm việc, xác thực khuôn mặt Selfie AI và dấu vân tay thiết bị để ngăn chặn chấm công hộ hoặc giả lập vị trí.',
  },
  {
    question: 'Thuật toán chia Lead 5 cổng trên DOMATION ERP hoạt động ra sao?',
    answer:
      'Trước khi giao Lead mới, hệ thống kiểm tra tự động 5 rào chắn: (1) Project Roster theo dự án, (2) Đã Selfie Check-in vào ca, (3) Không bật Vacation Mode, (4) Van chống ôm Backpressure chưa vượt ngưỡng 5 lead chưa gọi, và (5) Hạn mức Quota giờ/ngày/tháng.',
  },
  {
    question: 'Triển khai phần mềm ERP may đo 12 phân hệ mất bao lâu và báo giá thế nào?',
    answer:
      'Doanh nghiệp có thể đưa lõi vận hành vào chạy thực tế sau 2–4 tuần nhờ nền tảng 12 phân hệ chuẩn hóa sẵn kết hợp custom may đo theo sơ đồ tổ chức. Chi phí được khảo sát và báo giá minh bạch theo quy mô nhân sự và mức độ tự chủ hạ tầng.',
  },
];

export const CRM_FAQS: PageFaqItem[] = [
  {
    question: 'DOMATION CRM 360° quản trị quy trình bán hàng như thế nào?',
    answer:
      'Hệ thống cung cấp bảng Pipeline Kanban 9 nấc chuẩn Meta CAPI (Qualified, Booked, Booking, Deposited, Closed, Badtiming, NoAnswer, Notlead, unrated), hợp nhất Hồ sơ Khách hàng 360° (Web Tracking, Zalo, Email, lịch sử cuộc gọi, Ticket) và lọc trùng 180 ngày (6 tháng).',
  },
  {
    question: 'Tính năng đồng bộ hóa đơn điện tử MISA hai chiều hoạt động ra sao?',
    answer:
      'Khi đơn hàng trên CRM được xác nhận hoặc thanh toán qua VietQR/UNC kế toán duyệt, Webhook hai chiều tự động map SKU, mã số thuế và đẩy sang phần mềm kế toán MISA để phát hành hóa đơn điện tử và cập nhật trạng thái gạch nợ về CRM.',
  },
  {
    question: 'Giỏ hàng bất động sản real-time chống trùng cọc và chia hoa hồng như thế nào?',
    answer:
      'Khi một Sale hoặc Đại lý F1 giữ chỗ căn hộ trên Giỏ hàng Live, trạng thái căn được khóa tức thì theo thời gian thực để tránh đặt cọc trùng; khi phát sinh cọc, hệ thống tự sinh Phiếu Hợp Tác phân chia hoa hồng tổng 100% trình Ban Giám Đốc duyệt.',
  },
  {
    question: 'Chi phí phần mềm DOMATION CRM 360° & Auto Data là bao nhiêu?',
    answer:
      'Dùng thử miễn phí 30 ngày (0₫). Gói đồng bộ theo quy mô: Auto Data Standard 1.500.000₫/tháng (20 Sale • 15.000 Leads), Auto Data Pro 3.000.000₫/tháng (85 Sale • 100.000 Leads), gói Automation • CRM 360° • ERP 5.0 6.000.000₫/tháng (9.999 Users, giảm 15% khi đóng năm) và gói Bespoke Enterprise ERP 5.0 may đo riêng.',
  },
];

export const AUTOMATION_FAQS: PageFaqItem[] = [
  {
    question: 'DOMATION Marketing Automation & AI Space 5.0 hỗ trợ những kênh và Flow nào?',
    answer:
      'Hệ thống tích hợp Visual Flow Builder kéo thả rẽ nhánh IF/ELSE đa kênh: Email Marketing Amazon SES (tỷ lệ vào Inbox 98%), Zalo OA / Zalo ZNS, Voucher Hub mã động, Survey chấm điểm Lead Score, Web Tracking / QR O2O và Multi-Agent AI RAG 24/7.',
  },
  {
    question: 'Multi-Agent AI và AI RAG nội bộ của DOMATION có bịa thông tin giá bán không?',
    answer:
      'Không. Các AI Agent của DOMATION sử dụng kiến trúc RAG đọc chính xác tài liệu PDF bảng giá, chính sách chiết khấu, giáo trình và kiểm soát ngưỡng tin cậy trước khi phản hồi; khi gặp khách hàng thiện chí cao, AI tự động tóm tắt 4 thông số vàng và chuyển nóng về ZaloBot cho Sale (Human Handover).',
  },
  {
    question: 'Doanh nghiệp có thể tách riêng AI Agent cho từng phòng ban không?',
    answer:
      'Có. Tính năng AI Space cho phép phân quyền bộ não AI độc lập cho Sales, CSKH, Pháp lý, Kế toán và Nhân sự để nhân viên tra cứu quy chế hoặc soạn thảo theo dữ liệu phòng ban mình mà không rò rỉ thông tin chéo.',
  },
  {
    question: 'Chi phí nền tảng Marketing Automation & Multi-Agent AI DOMATION là bao nhiêu?',
    answer:
      'Khởi điểm với Auto Data Standard 1.500.000₫/tháng (20 Sale), Auto Data Pro 3.000.000₫/tháng (85 Sale), gói hợp nhất Automation • CRM 360° • ERP 5.0 6.000.000₫/tháng (9.999 Users, giảm 15% theo năm) và gói Bespoke Enterprise ERP 5.0 may đo riêng.',
  },
];

export const META_REPORT_FAQS: PageFaqItem[] = [
  {
    question: 'DOM Meta Report có được dùng thử miễn phí 1 tháng và sử dụng độc lập không?',
    answer:
      'Có. Doanh nghiệp được miễn phí dùng thử trọn vẹn 1 tháng đầu đầy đủ tính năng. Bạn có thể sử dụng DOM Meta Report hoàn toàn độc lập cho đội ngũ Marketing, hoặc đồng bộ một chạm vào phân hệ riêng bên trong DOMATION ERP và Auto Chia Data.',
  },
  {
    question: 'Hệ thống đồng bộ dữ liệu từ Meta Ads qua Google Sheets lên Dashboard như thế nào?',
    answer:
      'Hệ thống tự động lấy số liệu chiến dịch từ tài khoản Meta Ads, chuẩn hóa và lưu trữ minh bạch qua Google Sheets rồi trực quan hóa thành biểu đồ chi tiêu, tỷ lệ giữ chân video 3 giây, khung giờ ra khách tốt nhất và lịch sử chỉnh sửa tài khoản.',
  },
  {
    question: 'Tính năng báo cáo Google Ads có bắt buộc phải bật ngay từ đầu không?',
    answer:
      'Không bắt buộc. Giao diện được giữ tinh gọn hoàn toàn cho đội ngũ chuyên chạy Meta Ads. Bất cứ khi nào doanh nghiệp chạy thêm Google Ads, bạn chỉ cần bật tính năng mở rộng để hiển thị bảng báo cáo Google Ads kèm hướng dẫn kết nối 5 bước qua Google Sheets.',
  },
  {
    question: 'Xem báo cáo và lịch sử chỉnh sửa có cần cấp quyền quản trị Business Manager không?',
    answer:
      'Không. Ban Giám Đốc, Quản lý và Đối tác chỉ cần truy cập không gian báo cáo riêng có phân quyền trên DOMATION để xem số liệu và lịch sử thao tác mà không cần cấp quyền trực tiếp vào Business Manager gốc.',
  },
  {
    question: 'Chi phí gia hạn DOM Meta Report sau 1 tháng miễn phí là bao nhiêu?',
    answer:
      'Sau 30 ngày dùng thử DOM Meta Report miễn phí (/meta-report), gói thanh toán theo năm chỉ 490.000₫/tháng — tương đương 5.880.000₫/năm, tiết kiệm 29% — hoặc gói linh hoạt từng tháng 690.000₫/tháng.',
  },
];

export const WEB_DESIGN_FAQS: PageFaqItem[] = [
  {
    question: 'Chi phí thiết kế Website doanh nghiệp & Landing Page chuẩn SEO tại DOMATION là bao nhiêu?',
    answer:
      'Gói Core Website Doanh Nghiệp (8 Module) có giá từ 12.000.000₫ thanh toán 1 lần, bàn giao 100% source code sở hữu vĩnh viễn. Các module mở rộng như Sa bàn 3D WebGL Three.js, Booking hoặc kết nối CRM được dự toán minh bạch.',
  },
  {
    question: 'Website do DOMATION thiết kế có đạt chuẩn SEO, GEO và tốc độ tải nhanh không?',
    answer:
      'Có. Mọi website và Landing Page đều tối ưu tải dưới 1.5 giây, kiến trúc Semantic HTML5, Pre-render tĩnh, JSON-LD Unified @graph, llms.txt chuẩn AI Search (GEO) và tích hợp sẵn Tracking Webhook về ZaloBot/CRM/Meta CAPI.',
  },
  {
    question: 'Sa bàn 3D WebGL bóc mái căn hộ chạy có mượt trên điện thoại không?',
    answer:
      'Mô hình 3D Three.js được nén bằng chuẩn Draco GLB (<5MB) và tối ưu lightmap giúp khách hàng xoay, bóc mái căn hộ trực tiếp trên trình duyệt di động ở tốc độ mượt mà mà không cần cài ứng dụng.',
  },
];

export const IDEAS_FAQS: PageFaqItem[] = [
  {
    question: 'IDEAS Company Ecosystem Portal triển khai những hệ thống gì của DOMATION?',
    answer:
      'Viện IDEAS vận hành đồng bộ 3 phân hệ may đo từ DOMATION: Marketing Automation nuôi dưỡng phễu tuyển sinh dài ngày, Meta Ad Realtime Report tối ưu chi phí quảng cáo và Auto Lead Router kết hợp ERP 5.0 thay thế 14 file Excel nội bộ.',
  },
  {
    question: 'Hiệu quả thực tế sau khi IDEAS triển khai hệ thống ERP & Automation may đo là gì?',
    answer:
      'Hệ thống giúp IDEAS tăng 300% quy mô lớp học MBA (từ 20 lên 60 học viên/khóa), giảm 30% chi phí thu học viên (CPA), vận hành hơn 12.600 Leads và tự động hóa chấm công GPS AI cùng Payroll PDF.',
  },
];

export const DOM_AI_FAQS: PageFaqItem[] = [
  {
    question: 'DOM AI Assistant có thực sự miễn phí 100% trọn đời không?',
    answer:
      'Có. DOM AI Assistant hoàn toàn miễn phí 0₫/tháng trọn đời khi doanh nghiệp sử dụng theo mô hình BYOK (Bring Your Own Key) — cắm trực tiếp Gemini API Key miễn phí hoặc trả phí từ Google AI Studio của chính doanh nghiệp. DOMATION không thu phí thuê bao phần mềm cho Portal độc lập.',
  },
  {
    question: 'Gemini API Key của doanh nghiệp có được bảo mật khi cắm vào DOM AI Assistant không?',
    answer:
      'Có. API Key được mã hóa AES-256 trên máy chủ và chỉ phục vụ riêng cho Portal của doanh nghiệp bạn. Hệ thống không bao giờ chia sẻ khóa API giữa các tenant khác nhau và có nút kiểm tra kết nối trực tiếp ngay trong Admin Suite.',
  },
  {
    question: 'DOM AI Assistant hỗ trợ những chế độ đăng nhập và phân quyền nào?',
    answer:
      'Bạn có thể chuyển đổi 1 chạm giữa 3 chế độ: (1) Bypass mở công khai cho khách hàng tra cứu ngay không cần đăng nhập; (2) Đăng nhập mở bằng Email/Tên để lưu lịch sử chat và Group cá nhân; (3) Whitelist nội bộ chỉ cho phép các Email được cấp quyền truy cập đúng các Collection được phân công.',
  },
  {
    question: 'AI trả lời có bịa đặt số liệu bảng giá hoặc chính sách nội bộ không?',
    answer:
      'Không. DOM AI Assistant vận hành theo kiến trúc RAG truy hồi trực tiếp từ Kho Tài Liệu & Collections của bạn, hiển thị thẻ Nguồn trích dẫn (Citations) bấm xem ngay tài liệu gốc. Ngoài ra, quản trị viên có thể biến mọi câu hỏi thực tế trong Log hội thoại thành cặp Q&A Huấn luyện chỉ với 1 cú nhấp chuột.',
  },
  {
    question: 'Mất bao lâu để triển khai một Cổng Trợ Lý AI riêng mang thương hiệu công ty?',
    answer:
      'Chỉ mất khoảng 3 phút qua 3 bước: (1) Tạo Portal tùy biến Logo, màu chủ đạo, đường dẫn /ai/ten-du-an và dán Gemini API Key; (2) Nạp tài liệu (.md/.txt/.csv hoặc soạn Q&A) và chia Collections; (3) Chia sẻ link hoặc nhúng Iframe vào Website và theo dõi Dashboard thống kê.',
  },
];

export function getHomeSeoConfig(): PageSeoConfig {
  return {
    title: 'DOMATION | AutoData Chia Lead, Meta CAPI CRM, DomMeta Ads AI & ERP 5.0',
    description:
      'Hệ sinh thái DOMATION hợp nhất Web/Landing 3D với vòng tròn tối ưu khép kín Meta Ads ↔ CRM ↔ CAPI: AutoData chia lead tự động tức thì, lọc trùng 180 ngày, báo cáo Meta Ads AI realtime & ERP 5.0.',
    path: '/',
    keywords: [
      'DOMATION',
      'domation.net',
      'AutoData DOMATION',
      'phần mềm chia lead tự động',
      'CRM bất động sản thẩm mỹ nha khoa',
      'Meta CAPI CRM',
      'tối ưu quảng cáo Meta AI',
      'báo cáo Meta Ads AI',
      'ERP doanh nghiệp AI Việt Nam',
      'GEO AI search optimization',
      'hệ sinh thái phần mềm doanh nghiệp',
      'Automation nuôi dưỡng khách hàng Zalo ZNS',
      'sa bàn 3D bất động sản WebGL',
    ],
    ogImage: '/imgs/og-domation-v2.jpg',
    ogImageAlt: 'Hệ Sinh Thái Công Nghệ Doanh Nghiệp DOMATION — CRM, Meta Ads Report, Automation, ERP & Web 3D',
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageType: 'image/jpeg',
    faqs: HOME_FAQS,
    jsonLd: [
      buildSoftwareAppSchema({
        name: 'DOMATION Enterprise Ecosystem — CRM Auto Data, Meta & Google Ads Report, Automation & ERP 5.0',
        description:
          'Hệ sinh thái hợp nhất Website & Landing Page chuyển đổi 3D với vòng tròn tối ưu khép kín: CRM Auto Data chia số tức thì, lọc trùng 180 ngày, SHA-256 Meta CAPI, Báo cáo Meta & Google Ads AI, Automation Zalo ZNS & ERP 5.0.',
        path: '/',
        screenshot: '/imgs/erp-screens/dashboard-lead.webp',
        featureList: [
          'AutoData DOMATION: Thu lead đa nguồn, lọc trùng 180 ngày, AI Pre-Score & chia vòng ZaloBot tức thì + bù 1:1',
          'Vòng Tròn Khép Kín Meta CAPI CRM: 9 trạng thái Sale Pipeline bắn SHA-256 về Meta Ads tối ưu CPL/CPA',
          'DOM Meta Report AI & Google Ads: Video Hook Rate 3s, khung giờ vàng và đối soát từng Lead & Sale',
          'Automation Nuôi Dưỡng Đa Kênh: Tracking click/mở Email, hành vi Website, Zalo ZNS, Zalo OA & Voucher',
          'DOMATION ERP 5.0 May Đo & Web 3D WebGL: Pipeline 360°, Chấm công GPS AI, Phê duyệt đa cấp & Sa bàn 3D',
        ],
        offers: [
          {
            name: 'DOM Meta Report (Miễn phí 30 ngày)',
            price: '490000',
            description: '490.000₫/tháng (thanh toán năm) • Báo cáo Meta Ads AI realtime, mở rộng Google Ads & đồng bộ CRM',
            url: '/meta-report',
          },
          {
            name: 'Auto Data Standard (Miễn phí 30 ngày)',
            price: '1500000',
            description: '1.500.000₫/tháng (15.300.000₫/năm) • 20 Sale, 5 QL, 15.000 Leads/tháng, lọc trùng 180 ngày & Meta CAPI',
            url: '/data#pricing',
          },
          {
            name: 'Auto Data Pro',
            price: '3000000',
            description: '3.000.000₫/tháng (30.600.000₫/năm) • 85 Sale, 15 QL (100 Users), 100.000 Leads/tháng & AI Pre-Score',
            url: '/data#pricing',
          },
          {
            name: 'Automation • CRM 360° • ERP 5.0',
            price: '6000000',
            description: '6.000.000₫/tháng (61.200.000₫/năm) • 9.999 Users, 1.000.000 Leads/tháng, Full Suite & MISA 2 chiều',
            url: '/#pricing',
          },
        ],
      }),
    ],
  };
}

export function getDataSeoConfig(): PageSeoConfig {
  return {
    title: 'AutoData DOMATION | Phần Mềm Chia Lead Tự Động Tức Thì & Meta CAPI CRM',
    description:
      'Phần mềm chia lead tự động AutoData DOMATION tức thì qua ZaloBot & Telegram, AI Pre-Score, lọc trùng 180 ngày, Van SLA 120s, đền bù Ticket 1:1 và bắn Meta CAPI SHA-256.',
    path: '/data',
    keywords: [
      'AutoData DOMATION',
      'phần mềm chia lead tự động',
      'Meta CAPI CRM',
      'tối ưu quảng cáo Meta AI',
      'CRM bất động sản thẩm mỹ nha khoa',
      'Auto Chia Data ZaloBot',
      'hệ thống chia lead round robin',
      'Lọc trùng Lead 180 ngày',
      'Đền bù Ticket lỗi 1:1',
    ],
    ogImage: '/imgs/enterprise/sol-data-capi.webp',
    ogImageAlt: 'DOMATION Auto Chia Data ZaloBot Tức Thì & Meta CAPI SHA-256',
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'Auto Data & Meta CAPI', url: '/data' },
    ],
    faqs: AUTODATA_FAQS,
    jsonLd: [
      buildSoftwareAppSchema({
        name: 'DOMATION Auto Data & Meta CAPI Router',
        description:
          'Phần mềm tự động chia Lead tức thì qua ZaloBot & Telegram, lọc trùng 180 ngày và bắn Meta Conversions API SHA-256 9 trạng thái.',
        path: '/data',
        screenshot: '/imgs/autodata/showcase/screen_dashboard.jpg',
        featureList: [
          'Chia vòng Round-Robin 5 cổng tức thì qua ZaloBot & Telegram + AI Pre-Score 0–100',
          'Chuẩn hóa SĐT +84 & lọc trùng Lead đa kênh 180 ngày (6 tháng)',
          'Van SLA 120s chống ôm số & Đền bù Ticket lỗi 1:1',
          'Vòng tròn khép kín Meta CAPI SHA-256 9 trạng thái (Qualified -> Purchase & DisqualifiedLead)',
        ],
        offers: [
          {
            name: 'Auto Data Standard',
            price: '1500000',
            description:
              '1.500.000₫/tháng (hoặc 1.275.000₫/tháng khi đóng năm 15.300.000₫ • 20 Sale, 5 QL, 15.000 Leads/tháng • Dùng thử 30 ngày 0₫)',
            url: '/data#pricing',
          },
          {
            name: 'Auto Data Pro',
            price: '3000000',
            description:
              '3.000.000₫/tháng (hoặc 2.550.000₫/tháng khi đóng năm 30.600.000₫ • Tối đa 85 Sale, 15 QL, 100 Users • 100.000 Leads/tháng)',
            url: '/data#pricing',
          },
          {
            name: 'Automation • CRM 360° • ERP 5.0',
            price: '6000000',
            description:
              '6.000.000₫/tháng (hoặc 5.100.000₫/tháng khi đóng năm 61.200.000₫ • 9.999 Users • 1.000.000 Leads/tháng)',
            url: '/data#pricing',
          },
        ],
      }),
    ],
  };
}

export function getErpSeoConfig(): PageSeoConfig {
  return {
    title: 'DOMATION ERP 5.0 May Đo | ERP Doanh Nghiệp AI Việt Nam (12 Phân Hệ)',
    description:
      'ERP doanh nghiệp AI Việt Nam DOMATION 5.0 custom may đo 12 phân hệ: chia lead 5 cổng, Kanban, Chấm công GPS Selfie AI, Duyệt PO, Payroll PDF & Meta CAPI Forward-Only.',
    path: '/erp',
    keywords: [
      'ERP doanh nghiệp AI Việt Nam',
      'phần mềm ERP 5.0',
      'Enterprise ERP 5.0',
      'ERP may đo doanh nghiệp',
      'hệ thống vận hành custom may đo',
      'CRM bất động sản thẩm mỹ nha khoa',
      'Meta CAPI CRM',
      'Chấm công GPS Selfie AI',
      'Payroll PDF tự động',
    ],
    ogImage: '/imgs/enterprise/sol-erp-operations.webp',
    ogImageAlt: 'DOMATION Enterprise ERP 5.0 May Đo — 12 Phân hệ vận hành doanh nghiệp',
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'Enterprise ERP 5.0 May Đo', url: '/erp' },
    ],
    faqs: ERP_FAQS,
    jsonLd: [
      buildSoftwareAppSchema({
        name: 'DOMATION Enterprise ERP 5.0 May Đo',
        description:
          'DOMATION ERP 5.0 là hệ thống vận hành custom may đo 12 phân hệ, thiết kế flow riêng cho doanh nghiệp thời đại mới: Task Kanban, HRM Chấm công GPS AI, Duyệt PO & Payroll PDF.',
        path: '/erp',
        softwareVersion: '5.0',
        screenshot: '/imgs/erp-screens/dashboard-lead.webp',
        featureList: [
          'Thiết kế flow riêng theo sơ đồ tổ chức & cấp phê duyệt doanh nghiệp',
          'Tiếp nhận Lead một cửa & Thuật toán chia Lead 5 cổng + Van SLA',
          'Task Kanban & Phê duyệt đa cấp (PO, Tạm ứng, Nghỉ phép)',
          'Chấm công GPS vệ tinh + Selfie AI & Payroll Engine xuất PDF',
          'Row-Level Security (RLS), Audit Log & Meta CAPI Forward-Only',
        ],
        isCustomQuote: true,
        priceNote: 'Khảo sát & báo giá may đo ERP 5.0 12 phân hệ theo quy mô doanh nghiệp',
      }),
    ],
  };
}

export function getCrmSeoConfig(): PageSeoConfig {
  return {
    title: 'DOMATION CRM 360° & Auto Data | CRM BĐS, Thẩm Mỹ, Nha Khoa & MISA',
    description:
      'CRM bất động sản, thẩm mỹ, nha khoa & giáo dục DOMATION 360°: chia lead tức thì, lọc trùng 180 ngày, Pipeline 9 nấc Meta CAPI, giỏ hàng real-time & đồng bộ MISA hai chiều.',
    path: '/crm',
    keywords: [
      'DOMATION CRM 360',
      'CRM bất động sản thẩm mỹ nha khoa',
      'phần mềm chia lead tự động',
      'AutoData DOMATION',
      'Meta CAPI CRM',
      'CRM Pipeline Kanban 9 nấc',
      'Đồng bộ CRM kế toán MISA',
      'Quản lý giỏ hàng bất động sản real-time',
    ],
    ogImage: '/imgs/enterprise/sol-crm-misa.webp',
    ogImageAlt: 'DOMATION CRM 360° & Auto Data — Chia Lead Tức Thì, Pipeline 9 Nấc & Đồng bộ MISA',
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'CRM 360° & Auto Data', url: '/crm' },
    ],
    faqs: CRM_FAQS,
    jsonLd: [
      buildSoftwareAppSchema({
        name: 'DOMATION CRM 360° & Auto Data',
        description:
          'Hệ thống DOMATION CRM 360° & Auto Data: thu khách đa kênh, chia vòng ZaloBot tức thì, lọc trùng 180 ngày, Pipeline 9 nấc Meta CAPI, giỏ hàng BĐS real-time và đồng bộ hóa đơn MISA hai chiều.',
        path: '/crm',
        screenshot: '/imgs/enterprise/sol-crm-misa.webp',
        featureList: [
          'Thu khách đa kênh & Auto Chia Data ZaloBot / Telegram tức thì + lọc trùng 180 ngày',
          'Sales Pipeline Kanban 9 nấc chuẩn Meta CAPI & Hồ sơ Khách hàng 360°',
          'Quản lý Giỏ hàng bất động sản Real-time khóa căn tức thì & Phiếu hợp tác Co-care 100%',
          'Đồng bộ Hóa đơn điện tử MISA hai chiều & Báo cáo Meta/Google Ads gắn Lead',
        ],
        offers: [
          {
            name: 'Auto Data Standard',
            price: '1500000',
            description: '1.500.000₫/tháng (15.300.000₫/năm -15%) • 20 Sale, 5 Quản lý, 15.000 Leads/tháng',
            url: '/crm#pricing',
          },
          {
            name: 'Auto Data Pro',
            price: '3000000',
            description: '3.000.000₫/tháng (30.600.000₫/năm -15%) • 85 Sale, 15 Quản lý, 100.000 Leads/tháng',
            url: '/crm#pricing',
          },
          {
            name: 'Automation • CRM 360° • ERP 5.0',
            price: '6000000',
            description: '6.000.000₫/tháng (61.200.000₫/năm -15%) • 9.999 Users, Full CRM 360°, MISA & ERP 5.0',
            url: '/crm#pricing',
          },
        ],
      }),
    ],
  };
}

export function getAutomationSeoConfig(): PageSeoConfig {
  return {
    title: 'DOMATION Automation | Flow IF/ELSE, Zalo ZNS, Meta AI & RAG 5.0',
    description:
      'Nền tảng Automation & AI doanh nghiệp 5.0: Visual Flow IF/ELSE, Email Amazon SES 98% Inbox, Zalo ZNS, Voucher Hub, Web Tracking, tối ưu quảng cáo Meta AI & Multi-Agent RAG.',
    path: '/automation',
    keywords: [
      'Marketing Automation đa kênh',
      'Visual Flow Builder IF ELSE',
      'tối ưu quảng cáo Meta AI',
      'GEO AI search optimization',
      'Email Amazon SES 98% Inbox',
      'Zalo ZNS Automation',
      'AI Agent doanh nghiệp',
      'Multi-Agent AI tự trị',
      'AI doanh nghiệp thời đại 5.0',
    ],
    ogImage: '/imgs/enterprise/sol-ai-automation.webp',
    ogImageAlt: 'DOMATION Marketing Automation Visual Flow & AI Doanh Nghiệp 5.0',
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'Marketing Automation & AI 5.0', url: '/automation' },
    ],
    faqs: AUTOMATION_FAQS,
    jsonLd: [
      buildSoftwareAppSchema({
        name: 'DOMATION Marketing Automation & AI Space 5.0',
        description:
          'Hệ thống tự động hóa kịch bản chăm sóc đa kênh Email Amazon SES 98% Inbox, Zalo ZNS, Voucher Hub, QR Tracking & Multi-Agent AI RAG 24/7.',
        path: '/automation',
        screenshot: '/imgs/enterprise/sol-ai-automation.webp',
        featureList: [
          'Visual Flow Builder kéo thả IF/ELSE đa kênh',
          'Email Marketing Amazon SES 98% Inbox & Email Builder kéo thả',
          'Zalo OA / Zalo ZNS, Voucher Hub & Survey Lead Score',
          'QR Code Tracking O2O, Web Heatmap & Multi-Agent AI RAG 24/7',
        ],
        offers: [
          {
            name: 'Auto Data Standard',
            price: '1500000',
            description: '1.500.000₫/tháng (15.300.000₫/năm) • 20 Sale, 15.000 Leads/tháng & Chia số ZaloBot tức thì',
            url: '/automation#pricing',
          },
          {
            name: 'Auto Data Pro',
            price: '3000000',
            description: '3.000.000₫/tháng (30.600.000₫/năm) • 85 Sale, 100.000 Leads/tháng & Đa phễu chiến dịch',
            url: '/automation#pricing',
          },
          {
            name: 'Automation • CRM 360° • ERP 5.0',
            price: '6000000',
            description: '6.000.000₫/tháng (61.200.000₫/năm) • 9.999 Users, Visual Flow IF/ELSE, Zalo ZNS & AI RAG 24/7',
            url: '/automation#pricing',
          },
        ],
      }),
    ],
  };
}

export function getMetaReportSeoConfig(): PageSeoConfig {
  return {
    title: 'DomMeta Report | Báo Cáo Meta Ads AI & Tối Ưu Quảng Cáo Meta AI',
    description:
      'Báo cáo Meta Ads AI real-time kết nối Graph API v25.0 đối chiếu doanh thu thực CRM 9 nấc, phân tích Video Hook Rate 3s, Creative Fatigue & tối ưu quảng cáo Meta AI.',
    path: '/meta-report',
    keywords: [
      'báo cáo Meta Ads AI',
      'tối ưu quảng cáo Meta AI',
      'Meta CAPI CRM',
      'Meta Ad Realtime Report',
      'Video Hook Rate Meta Ads',
      'Đối chiếu CPL với CRM',
      'Meta Graph API BI',
      'tối ưu quảng cáo đa kênh',
    ],
    ogImage: '/imgs/enterprise/sol-web3d-meta.webp',
    ogImageAlt: 'DOMATION Meta Ad Realtime Report & Video Hook Rate Analytics',
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'Meta Ad Realtime Report', url: '/meta-report' },
    ],
    faqs: META_REPORT_FAQS,
    jsonLd: [
      buildSoftwareAppSchema({
        name: 'DOMATION Meta Ad Realtime Report',
        description:
          'Hệ thống phân tích hiệu suất quảng cáo Meta realtime đối chiếu doanh thu CRM, Video Hook Rate 3s, Creative Fatigue và Admin Audit Log.',
        path: '/meta-report',
        screenshot: '/imgs/enterprise/sol-web3d-meta.webp',
        featureList: [
          'Kết nối Meta Graph API đối chiếu doanh thu thực CRM',
          'Phân tích Video Hook Rate 3s, Hold Rate & Creative Fatigue',
          'Phát hiện Khung Giờ Vàng chốt đơn',
          'Admin Audit Log minh bạch không cần cấp quyền BM',
        ],
        offers: [
          {
            name: 'Dùng Thử Miễn Phí 1 Tháng Đầu',
            price: '0',
            description: '0₫ trong 30 ngày đầu • Trải nghiệm đầy đủ Dashboard, Heatmap, Ads Library & Tích hợp ERP',
            url: '/meta-report#pricing',
          },
          {
            name: 'Gói Hàng Năm (Giảm 29%)',
            price: '490000',
            description: '490.000₫/tháng (thanh toán 5.880.000₫/năm)',
            url: '/meta-report#pricing',
          },
          {
            name: 'Gói Hàng Tháng',
            price: '690000',
            description: '690.000₫/tháng',
            url: '/meta-report#pricing',
          },
        ],
      }),
    ],
  };
}

export function getWebDesignSeoConfig(): PageSeoConfig {
  return {
    title: 'Thiết Kế Website & Landing Page Từ 12M₫ Chuẩn SEO | DOMATION',
    description:
      'Thiết kế Website & Landing Page tối ưu chuyển đổi, tải <1.5s, chuẩn 100% SEO, sở hữu source code từ 12M₫, tích hợp Web 3D WebGL & CRM ZaloBot.',
    path: '/web-design',
    keywords: [
      'báo giá thiết kế website doanh nghiệp',
      'làm chủ source code website doanh nghiệp',
      'tối ưu landing page',
      'thiết kế web 3d sa bàn',
      'dự toán chi phí website',
      'thiết kế website chuẩn seo geo domation',
    ],
    ogImage: '/imgs/enterprise/hero-domation-hub.webp',
    ogImageAlt: 'Thiết Kế Website Doanh Nghiệp, Landing Page CRO & Sa Bàn 3D WebGL Từ 12.000.000₫ DOMATION',
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'Bảng Giá Thiết Kế Website', url: '/web-design' },
    ],
    faqs: WEB_DESIGN_FAQS,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${SITE_URL}/web-design#service`,
        name: 'Dịch vụ Thiết Kế Website Doanh Nghiệp, Landing Page CRO & Sa Bàn 3D WebGL',
        serviceType: 'Web Design, Landing Page CRO, 3D WebGL & CRM Integration',
        description:
          'Thiết kế Website chuẩn 100% SEO, tốc độ <1.5s, sở hữu source code vĩnh viễn từ 12.000.000₫ cùng sa bàn 3D WebGL Three.js và đồng bộ CRM/ZaloBot.',
        image: `${SITE_URL}/imgs/enterprise/hero-domation-hub.webp`,
        areaServed: { '@type': 'Country', name: 'Việt Nam' },
        provider: { '@id': ORG_ID },
        url: `${SITE_URL}/web-design`,
        offers: {
          '@type': 'Offer',
          name: 'Gói Core Website Doanh Nghiệp (8 Module)',
          priceCurrency: 'VND',
          price: '12000000',
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/web-design`,
        },
      },
    ],
  };
}

export function getIdeasSeoConfig(): PageSeoConfig {
  return {
    title: 'IDEAS Ecosystem | Hệ Thống Tuyển Sinh & ERP May Đo | DOMATION',
    description:
      'Cổng ứng dụng may đo riêng cho Viện IDEAS: Marketing Automation, Meta Ad Realtime Report và Auto Lead Router giúp tăng 300% quy mô, giảm 30% CPA.',
    path: '/ideas',
    keywords: [
      'IDEAS Ecosystem',
      'ERP Viện IDEAS',
      'ERP may đo giáo dục sau đại học',
      'Auto Lead Router IDEAS',
      'làm chủ hệ thống tuyển sinh CRM Automation',
      'DOMATION',
    ],
    ogImage: '/landingpage_avatar/ideasmba.webp',
    ogImageAlt: 'IDEAS Company Ecosystem Portal — Case Study Tuyển Sinh & Automation DOMATION',
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'IDEAS Ecosystem', url: '/ideas' },
    ],
    faqs: IDEAS_FAQS,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'IDEAS Company Ecosystem | DOMATION',
        url: `${SITE_URL}/ideas`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: 3,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'IDEAS Marketing Automation',
              url: `${SITE_URL}/automation`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'IDEAS Meta Realtime Report',
              url: `${SITE_URL}/meta-report`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'IDEAS Auto Lead Router',
              url: `${SITE_URL}/data`,
            },
          ],
        },
      },
    ],
  };
}

export function getDomAiSeoConfig(): PageSeoConfig {
  return {
    title: 'DOM AI Assistant | Trợ Lý AI RAG Doanh Nghiệp Miễn Phí 100% (BYOK) | DOMATION',
    description:
      'Khởi tạo Cổng Trợ Lý AI RAG & Kho Tài Liệu mang thương hiệu riêng MIỄN PHÍ 100% trọn đời khi cắm Gemini API Key riêng: 3-Pane Studio, 3 chế độ phân quyền, Dashboard thống kê & 1-click Q&A Training.',
    path: '/dom-ai',
    keywords: [
      'DOM AI Assistant',
      'trợ lý AI doanh nghiệp miễn phí',
      'AI RAG nội bộ doanh nghiệp',
      'BYOK Gemini API Key',
      'cổng tra cứu tài liệu AI',
      'chatbot tài liệu nội bộ miễn phí',
      'DOMATION AI Studio',
      'trợ lý AI trích dẫn nguồn',
    ],
    ogImage: '/imgs/dom-ai/portal-chat.png',
    ogImageAlt: 'DOM AI Assistant — Trợ Lý AI RAG Doanh Nghiệp Miễn Phí 100% BYOK từ DOMATION',
    breadcrumbs: [
      { name: 'Trang Chủ', url: '/' },
      { name: 'DOM AI Assistant (Miễn Phí)', url: '/dom-ai' },
    ],
    faqs: DOM_AI_FAQS,
    jsonLd: [
      buildSoftwareAppSchema({
        name: 'DOM AI Assistant — Trợ Lý AI RAG & Kho Tài Liệu Doanh Nghiệp (BYOK Free Forever)',
        description:
          'Sản phẩm độc lập miễn phí 100% trọn đời từ hệ sinh thái DOMATION khi cắm Gemini API Key riêng: 3-Pane AI Studio, Kho Tài Liệu RAG có trích dẫn, 3 chế độ Auth linh hoạt, Dashboard thống kê và 1-click Q&A Training.',
        path: '/dom-ai',
        screenshot: '/imgs/dom-ai/portal-chat.png',
        featureList: [
          'Miễn phí 100% trọn đời (0₫/tháng) với mô hình BYOK Gemini API Key mã hóa AES-256',
          'Không gian làm việc 3-Pane AI Studio: Hội thoại AI, Kho Tài Liệu & Vault tra cứu nhanh',
          '3 chế độ phân quyền truy cập: Bypass công khai, Đăng nhập lưu lịch sử & Whitelist theo Collection',
          'Admin Dashboard thống kê lưu lượng hỏi, tỷ lệ hài lòng, tài liệu trích dẫn & 1-click Q&A Training',
        ],
        offers: [
          {
            name: 'DOM AI Assistant Standalone (BYOK)',
            price: '0',
            description: '0₫/tháng — Miễn phí trọn đời khi dùng với Gemini API Key riêng của doanh nghiệp',
            url: '/dom-ai#pricing',
          },
        ],
      }),
    ],
  };
}

export function getNotFoundSeoConfig(path = '/404'): PageSeoConfig {
  return {
    title: '404 — Không Tìm Thấy Trang | DOMATION.NET',
    description:
      'Trang bạn tìm không tồn tại hoặc đã được di chuyển. Quay lại Blog DOMATION hoặc khám phá hệ thống ERP 5.0 may đo, CRM 360° và Auto Chia Data.',
    path,
    ogImage: '/imgs/boost/boost-404-lost-compass.jpg',
    ogImageAlt: '404 Không Tìm Thấy Trang — DOMATION.NET',
    noindex: true,
  };
}

export function getCoreStaticRouteSeoConfigs(): PageSeoConfig[] {
  return [
    getHomeSeoConfig(),
    getDataSeoConfig(),
    getErpSeoConfig(),
    getCrmSeoConfig(),
    getAutomationSeoConfig(),
    getMetaReportSeoConfig(),
    getDomAiSeoConfig(),
    getWebDesignSeoConfig(),
    getIdeasSeoConfig(),
  ];
}
