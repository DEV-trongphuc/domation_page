export type MotionVideoId =
  | 'ecosystem'
  | 'autodata'
  | 'erp'
  | 'crm'
  | 'automation'
  | 'meta-report'
  | 'dom-ai'
  | 'web3d';

export interface MotionVideoChapter {
  time: number;
  code: string;
  label: string;
  posterSrc?: string;
}

export interface MotionVideoItem {
  id: MotionVideoId;
  fileId: string;
  route: string;
  shortLabel: string;
  badge: string;
  title: string;
  titleAccent?: string;
  subtitle: string;
  painHook: string;
  strengthBullets: string[];
  videoSrc: string;
  posterSrc: string;
  durationSec: number;
  initialTime: number;
  showInHub?: boolean;
  chapters: MotionVideoChapter[];
  ctaLabel: string;
  ctaRoute: string;
}

export const MASTER_ECOSYSTEM_VIDEO_SRC = '/videos/domation-ecosystem-master.mp4';
export const MASTER_ECOSYSTEM_DURATION_SEC = 44;

export const MASTER_ECOSYSTEM_CHAPTERS: MotionVideoChapter[] = [
  {
    time: 0.0,
    code: 'NỖI ĐAU',
    label: 'Dữ liệu rời rạc',
    posterSrc: '/videos/posters/chapter-01-pain.webp',
  },
  {
    time: 4.2,
    code: 'HỆ SINH THÁI',
    label: 'Hệ điều hành AI 5.0',
    posterSrc: '/videos/posters/chapter-02-ecosystem.webp',
  },
  {
    time: 8.5,
    code: 'AUTO CHIA DATA',
    label: 'Phân phối < 3 giây',
    posterSrc: '/videos/posters/chapter-03-autodata.webp',
  },
  {
    time: 12.8,
    code: 'VÒNG LẶP CAPI',
    label: 'Chia Sale • Học tệp',
    posterSrc: '/videos/posters/chapter-04-flywheel.webp',
  },
  {
    time: 17.5,
    code: 'CRM 360°',
    label: 'Chốt đơn tập trung',
    posterSrc: '/videos/posters/chapter-05-crm.webp',
  },
  {
    time: 21.8,
    code: 'REPORT BI',
    label: 'Rõ từng đồng lời lỗ',
    posterSrc: '/videos/posters/chapter-06-report.webp',
  },
  {
    time: 26.1,
    code: 'AUTOMATION AI',
    label: 'Kịch bản chăm sóc riêng',
    posterSrc: '/videos/posters/chapter-07-automation.webp',
  },
  {
    time: 30.8,
    code: 'ERP 5.0',
    label: 'May đo quy trình',
    posterSrc: '/videos/posters/chapter-08-erp.webp',
  },
  {
    time: 35.1,
    code: 'MULTI-AGENT AI',
    label: 'Biệt đội trợ lý AI',
    posterSrc: '/videos/posters/chapter-09-multiagent.webp',
  },
];

export const DOMATION_MOTION_VIDEOS: MotionVideoItem[] = [
  {
    id: 'ecosystem',
    fileId: 'domation-ecosystem-master',
    route: '/',
    shortLabel: 'Toàn Cảnh OS',
    badge: 'TỔNG QUAN HỆ SINH THÁI DOMATION',
    title: 'Một Nền Tảng —',
    titleAccent: 'Kiểm Soát Trọn Vận Hành',
    subtitle:
      'Khách hỏi có Sale gọi ngay, tự động lọc khách trùng, thấy rõ bài quảng cáo nào ra tiền và quản lý toàn bộ đội ngũ trên một màn hình.',
    painHook: 'Mỗi bộ phận một bảng tính rời khiến khách chờ 45+ phút, rớt 60% cơ hội & mù hiệu quả từng kênh.',
    strengthBullets: [
      'Khách nhắn là chia Sale gọi ngay dưới 3 giây, chống sót khách & chống ôm số',
      'Bán hàng, Chăm sóc tự động, Tài chính & Trợ lý AI đồng bộ 100%',
      '35+ hệ thống triển khai thực tế • Tăng trưởng rõ rệt từng phòng ban',
    ],
    videoSrc: MASTER_ECOSYSTEM_VIDEO_SRC,
    posterSrc: '/videos/posters/chapter-02-ecosystem.webp',
    durationSec: MASTER_ECOSYSTEM_DURATION_SEC,
    initialTime: 0.0,
    showInHub: true,
    chapters: MASTER_ECOSYSTEM_CHAPTERS,
    ctaLabel: 'Khám Phá Hệ Sinh Thái',
    ctaRoute: '#ecosystem-architecture',
  },
  {
    id: 'autodata',
    fileId: 'domation-ecosystem-master',
    route: '/data',
    shortLabel: 'Auto Chia Data',
    badge: 'CHIA SỐ TỰ ĐỘNG • CHỐNG SÓT KHÁCH',
    title: 'Khách Nhắn Chia Ngay —',
    titleAccent: 'Tiền Về Đúng Kênh',
    subtitle:
      'Tự lọc số rác, tự chia công bằng cho Sale dưới 3 giây và báo Conversion API cho Facebook biết ai đã mua thật để càng chạy quảng cáo càng rẻ.',
    painHook: 'Chậm phản hồi 45+ phút khi gom tay & quảng cáo đốt tiền vào tệp rác vì thiếu phản hồi từ Sale.',
    strengthBullets: [
      'Quy trình vòng lặp 6 bước khép kín tự tối ưu chất lượng Lead sau mỗi chu kỳ',
      'Chia số < 3 giây qua Zalo, tự lọc trùng đa kênh & chống ôm số quá hạn',
      'Bắn tín hiệu chuyển đổi thực tế CAPI giúp giảm chi phí quảng cáo và tăng tỷ lệ chốt',
    ],
    videoSrc: MASTER_ECOSYSTEM_VIDEO_SRC,
    posterSrc: '/videos/posters/chapter-04-flywheel.webp',
    durationSec: MASTER_ECOSYSTEM_DURATION_SEC,
    initialTime: 8.5,
    showInHub: true,
    chapters: MASTER_ECOSYSTEM_CHAPTERS,
    ctaLabel: 'Mở Trang Auto Chia Data',
    ctaRoute: '/data',
  },
  {
    id: 'crm',
    fileId: 'domation-ecosystem-master',
    route: '/crm',
    shortLabel: 'CRM 360°',
    badge: 'CRM 360° • CHỐT ĐƠN TẬP TRUNG',
    title: 'Kiểm Soát Từng Cơ Hội —',
    titleAccent: 'Không Lo Thất Thoát Khách Hàng',
    subtitle:
      'Theo dõi sát mọi lịch sử tư vấn, hẹn gặp đến chốt hợp đồng trên một màn hình, tính hoa hồng và doanh số hoàn toàn tự động.',
    painHook: 'Thông tin khách rải rác trên nhiều file cá nhân gây chồng chéo xử lý & thất thoát doanh thu.',
    strengthBullets: [
      'Theo dõi rõ ràng từng giai đoạn từ tiếp nhận, tư vấn đến chốt đơn và hậu mãi',
      'Tập trung toàn bộ lịch sử chăm sóc trên một hồ sơ khách hàng duy nhất',
      'Đối soát giao dịch và phân chia tỷ lệ ghi nhận doanh số hoàn toàn tự động',
    ],
    videoSrc: MASTER_ECOSYSTEM_VIDEO_SRC,
    posterSrc: '/videos/posters/chapter-05-crm.webp',
    durationSec: MASTER_ECOSYSTEM_DURATION_SEC,
    initialTime: 17.5,
    showInHub: true,
    chapters: MASTER_ECOSYSTEM_CHAPTERS,
    ctaLabel: 'Mở Trang CRM 360°',
    ctaRoute: '/crm',
  },
  {
    id: 'meta-report',
    fileId: 'domation-ecosystem-master',
    route: '/meta-report',
    shortLabel: 'Report BI',
    badge: 'BÁO CÁO ĐIỀU HÀNH • RÕ LỜI LỖ',
    title: 'Nhìn Một Màn Hình —',
    titleAccent: 'Biết Ngay Quảng Cáo Nào Ra Tiền',
    subtitle:
      'Gom chi phí quảng cáo và doanh thu chốt đơn về một chỗ, giúp Sếp cắt ngay bài đốt tiền và dồn ngân sách vào bài sinh lời.',
    painHook: 'Báo cáo Marketing, Bán hàng và Kế toán lệch số, mất nhiều giờ tổng hợp thủ công mỗi tuần.',
    strengthBullets: [
      'Cập nhật số liệu doanh thu thực khớp trực tiếp với chi phí từng chiến dịch',
      'Phát hiện nhanh mẫu nội dung mang lại khách chất lượng & điểm rơi hiệu quả',
      'Giảm tới 35% chi phí quảng cáo lãng phí & theo dõi minh bạch 24/7',
    ],
    videoSrc: MASTER_ECOSYSTEM_VIDEO_SRC,
    posterSrc: '/videos/posters/chapter-06-report.webp',
    durationSec: MASTER_ECOSYSTEM_DURATION_SEC,
    initialTime: 21.8,
    showInHub: true,
    chapters: MASTER_ECOSYSTEM_CHAPTERS,
    ctaLabel: 'Xem Report BI',
    ctaRoute: '/meta-report',
  },
  {
    id: 'automation',
    fileId: 'domation-ecosystem-master',
    route: '/automation',
    shortLabel: 'Automation AI',
    badge: 'CHĂM KHÁCH TỰ ĐỘNG 24/7',
    title: 'Nhắc Lịch & Chăm Khách —',
    titleAccent: 'Đúng Thời Điểm Không Tốn Công',
    subtitle:
      'Khách vừa quan tâm lập tức nhận Email và tin nhắn Zalo đúng nhu cầu, giữ ấm khách cũ và thúc đẩy chốt đơn tự động.',
    painHook: 'Khách đăng ký xong không được chăm sóc kịp thời hoặc bị gửi tin nhắn đại trà không theo hành vi.',
    strengthBullets: [
      'Thiết kế nhánh Flow riêng: Đăng ký Form → Gửi Email chào → Chờ 10 phút kiểm tra hành vi',
      'Nhánh đã mở mail tự động gửi Zalo ZNS nhắc lịch & ưu đãi đúng nhu cầu',
      'Nhánh chưa mở kích hoạt chuỗi Email ngày 2, ngày 5 giúp tăng 2.4x tỷ lệ tái mua',
    ],
    videoSrc: MASTER_ECOSYSTEM_VIDEO_SRC,
    posterSrc: '/videos/posters/chapter-07-automation.webp',
    durationSec: MASTER_ECOSYSTEM_DURATION_SEC,
    initialTime: 26.1,
    showInHub: true,
    chapters: MASTER_ECOSYSTEM_CHAPTERS,
    ctaLabel: 'Khám Phá Automation AI',
    ctaRoute: '/automation',
  },
  {
    id: 'erp',
    fileId: 'domation-ecosystem-master',
    route: '/erp',
    shortLabel: 'Enterprise ERP 5.0',
    badge: 'ERP 5.0 • MAY ĐO RIÊNG',
    title: 'Vận Hành Công Ty Gọn Nhẹ —',
    titleAccent: 'Sở Hữu Phần Mềm Trọn Đời',
    subtitle:
      'Gộp bán hàng, dự án, nhân sự, duyệt chi và dòng tiền vào một hệ thống thiết kế riêng theo đúng cách công ty đang chạy.',
    painHook: 'Phải gò ép nhân sự theo phần mềm đóng gói cứng nhắc & phụ thuộc chi phí thuê theo tài khoản.',
    strengthBullets: [
      'Hợp nhất Bán hàng, Dự án, Nhân sự, Phê duyệt, Kho & Tài chính trên 1 nền tảng',
      'Tiết kiệm tới 70% thời gian tổng hợp báo cáo thủ công giữa các phòng ban',
      'Triển khai may đo sát thực tế với quyền sở hữu và phân quyền chặt chẽ',
    ],
    videoSrc: MASTER_ECOSYSTEM_VIDEO_SRC,
    posterSrc: '/videos/posters/chapter-08-erp.webp',
    durationSec: MASTER_ECOSYSTEM_DURATION_SEC,
    initialTime: 30.8,
    showInHub: true,
    chapters: MASTER_ECOSYSTEM_CHAPTERS,
    ctaLabel: 'Xem Chi Tiết ERP 5.0',
    ctaRoute: '/erp',
  },
  {
    id: 'dom-ai',
    fileId: 'domation-ecosystem-master',
    route: '/dom-ai',
    shortLabel: 'Multi-Agent AI',
    badge: 'TRỢ LÝ AI NỘI BỘ 0Đ',
    title: 'Nhân Viên Hỏi Gì Đáp Nấy —',
    titleAccent: 'Chuẩn Theo Tài Liệu Công Ty',
    subtitle:
      'Biến bảng giá, quy trình và tài liệu nội bộ thành trợ lý AI hỏi đáp tức thì, giảm 80% thời gian đào tạo và hỏi qua hỏi lại.',
    painHook: 'Nhân viên mất thời gian tìm tài liệu rời rạc & lo ngại rủi ro rò rỉ dữ liệu lên công cụ bên ngoài.',
    strengthBullets: [
      'Biệt đội trợ lý AI đa nhiệm phối hợp cho Bán hàng, Marketing, Điều hành & Bảo mật',
      'Tra cứu nhanh quy trình, báo cáo và dữ liệu nội bộ kèm nguồn trích dẫn tin cậy',
      'Kiểm soát quyền truy cập nghiêm ngặt theo từng cấp bậc nhân sự trong công ty',
    ],
    videoSrc: MASTER_ECOSYSTEM_VIDEO_SRC,
    posterSrc: '/videos/posters/chapter-09-multiagent.webp',
    durationSec: MASTER_ECOSYSTEM_DURATION_SEC,
    initialTime: 35.1,
    showInHub: true,
    chapters: MASTER_ECOSYSTEM_CHAPTERS,
    ctaLabel: 'Trải Nghiệm Multi-Agent AI',
    ctaRoute: '/dom-ai',
  },
  {
    id: 'web3d',
    fileId: 'domation-ecosystem-master',
    route: '/web-design',
    shortLabel: 'Kết Nối Hệ Sinh Thái',
    badge: 'WEBSITE KẾT NỐI ĐỒNG BỘ',
    title: 'Website Ra Khách Là Đổ Về —',
    titleAccent: 'Chia Sale & Chăm Sóc Tự Động',
    subtitle:
      'Mọi lượt đăng ký trên Website chuyển thẳng về đội kinh doanh dưới 3 giây, không cần nhân sự ngồi canh nhập lại.',
    painHook: 'Website tách rời khiến nhân viên phải sao chép thông tin thủ công vào hệ thống nội bộ.',
    strengthBullets: [
      'Chuyển thông tin khách hàng từ website thẳng về đội ngũ kinh doanh dưới 3 giây',
      'Theo dõi trọn vòng đời từ lượt truy cập đến doanh thu thực trên Report BI',
      'Tự động kích hoạt kịch bản chăm sóc đa kênh & quản trị tập trung trên ERP 5.0',
    ],
    videoSrc: MASTER_ECOSYSTEM_VIDEO_SRC,
    posterSrc: '/videos/posters/chapter-02-ecosystem.webp',
    durationSec: MASTER_ECOSYSTEM_DURATION_SEC,
    initialTime: 4.2,
    showInHub: false,
    chapters: MASTER_ECOSYSTEM_CHAPTERS,
    ctaLabel: 'Xem Hệ Sinh Thái OS',
    ctaRoute: '/',
  },
];

export const MOTION_VIDEO_BY_ID: Record<MotionVideoId, MotionVideoItem> =
  DOMATION_MOTION_VIDEOS.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<MotionVideoId, MotionVideoItem>
  );
