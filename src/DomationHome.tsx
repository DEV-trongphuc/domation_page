import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Bot,
  Box,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  ExternalLink,
  Globe,
  Mail,
  MonitorSmartphone,
  MousePointerClick,
  Network,
  Play,
  Sparkles,
  Users,
  Workflow,
  Zap,
  ZoomIn,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { ContactModal } from './ContactModal';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { InteractiveBrandSphere } from './components/InteractiveBrandSphere';
import { ImageZoomModal } from './components/GlassModal';
import { SmoothAppImage } from './components/SmoothAppImage';
import { preloadAppImages } from './utils/imagePreload';
import {
  type InspectionTabId,
  ProductInspectionModal,
} from './components/ProductInspectionModal';
import { WebEstimatorModal } from './components/WebEstimatorModal';
import { PartnersTrustSection } from './components/PartnersTrustSection';
import { SectionQuickDock } from './components/SectionQuickDock';
import { DomationFooter } from './components/DomationFooter';
import { ClosedLoopFlywheelSection } from './components/ClosedLoopFlywheelSection';
import {
  CASE_STUDY_SPOTLIGHTS,
  DECOR_PNGS,
  DOMATION_SAAS_PLANS,
  ENTERPRISE_STORY_CHAPTERS,
} from './data/enterpriseData';
import { ChannelLogoStrip } from './components/ChannelLogoStrip';
import { FaqAccordionSection } from './components/FaqAccordionSection';
import { handleSpaLinkClick } from './utils/navigation';
import { HOME_FAQS, getHomeSeoConfig } from './data/coreRouteSeo';
import { usePageSeo } from './utils/seo';
import { DomResponsiveSubtabs } from './components/dom-meta/DomMetaSelect';

const DEDICATED_APP_LINKS = [
  { label: 'ERP 5.0', href: '/erp' },
  { label: 'CRM Auto Data', href: '/data' },
  { label: 'Meta & Google Ads Report', href: '/meta-report' },
  { label: 'Automation & AI', href: '/automation' },
  { label: 'CRM 360°', href: '/crm' },
  { label: 'Thiết Kế Web & 3D', href: '/web-design' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Blog', href: '/boost' },
];

const CASE_ARTICLE_MAP: Record<string, string> = {
  ecolife: '/boost/minh-bach-chia-gio-hang-bu-ticket-loi-3-dai-ly-f1-ecolife',
  inkica: '/boost/trien-khai-multi-agent-ai-prepress-208-sku-3d-cad-inkica',
  ideas: '/boost/quan-ly-pheu-tuyen-sinh-mba-nang-quy-mo-60-hoc-vien-giam-30-cpa',
  phucloctho: '/boost/dut-gay-du-lieu-pos-cskh-chuoi-fb-zalo-zns-voucher-hub-roas-5',
};

const AUTODATA_SCREENS = [
  {
    id: 'dashboard',
    label: 'Tổng quan Chia số',
    hint: 'Biết ngay lượng khách về & tốc độ nhận từng giờ',
    badge: 'REAL-TIME DASHBOARD',
    title: 'Tổng Quan Lưu Lượng Khách & Tốc Độ Phân Bổ',
    desc: 'Theo dõi tổng data về, tỷ lệ chia 100%, số trùng và bảng xếp hạng Sale/Đại lý.',
    src: '/imgs/autodata/showcase/screen_dashboard.jpg',
  },
  {
    id: 'datalist',
    label: 'Danh sách & Bài Ads',
    hint: 'Thấy rõ bài quảng cáo gốc & chất lượng gọi từng khách',
    badge: 'LEAD & NGUỒN QUẢNG CÁO',
    title: 'Danh Sách Khách Kèm Bài Quảng Cáo Gốc',
    desc: 'Che SĐT bảo mật, hiển thị rõ bài quảng cáo tạo ra khách, Sale nhận và trạng thái cuộc gọi.',
    src: '/imgs/autodata/showcase/screen_datalist.jpg',
  },
  {
    id: 'fairshare',
    label: 'Đối soát Công bằng',
    hint: 'Tự cân bằng vòng chia & duyệt bù data lỗi minh bạch',
    badge: 'ĐỐI SOÁT MINH BẠCH',
    title: 'Đối Soát Công Bằng Giữa Sale & Đại Lý F1',
    desc: 'Đo độ lệch phân bổ theo thời gian thực và tự động bù lượt khi có ticket số sai.',
    src: '/imgs/autodata/showcase/screen_fairshare.jpg',
  },
  {
    id: 'rounds',
    label: 'Vòng chia Dự án',
    hint: 'Chia theo sản phẩm, đẩy ZaloBot tức thì & chống ôm số',
    badge: 'PHÂN BỔ LINH HOẠT',
    title: 'Vòng Phân Bổ Độc Lập Theo Từng Dự Án',
    desc: 'Tùy biến tỷ lệ chia cho từng đội Sale, tự động chuyển lượt nếu quá hạn không nhận.',
    src: '/imgs/autodata/showcase/screen_rounds.jpg',
  },
];

const ADS_SPOTLIGHT_SCREENS = [
  {
    id: 'overview',
    label: 'Tổng Quan Real-Time',
    badge: 'BÁO CÁO QUẢNG CÁO',
    title: 'Bảng Tổng Quan Chi Tiêu, Xu Hướng & Nền Tảng',
    desc: 'Theo dõi tức thì ngân sách đã chi, tăng giảm kỳ trước, biểu đồ Facebook / Instagram và độ tuổi.',
    src: '/imgs/meta-screens/meta-dashboard.webp',
  },
  {
    id: 'heatmap',
    label: 'Heatmap & Vùng',
    badge: 'GIỜ VÀNG CHỐT ĐƠN',
    title: 'Bản Đồ Nhiệt 7×24 Giờ Vàng & Tỉnh Thành Ra Khách',
    desc: 'Phát hiện khung giờ ra khách rẻ nhất trong tuần và tỉnh thành có chi phí mỗi khách tối ưu nhất.',
    src: '/imgs/meta-screens/meta-heatmap-region.webp',
  },
  {
    id: 'funnel',
    label: '24h CPR & Phễu',
    badge: 'PHỄU HÀNH VI',
    title: 'Khung Giờ Vàng 24h, CPR & Phễu Chuyển Đổi Ngang',
    desc: 'Đối chiếu chi tiêu với kết quả & CPR theo từng giờ, soi phễu hành vi từ hiển thị đến chốt đơn.',
    src: '/imgs/meta-screens/meta-funnel-hourly-cpr.webp',
  },
  {
    id: 'ad-detail',
    label: 'Creative & Chẩn Đoán',
    badge: 'CHI TIẾT BÀI ADS',
    title: 'Chẩn Đoán Chất Lượng Meta Kèm Ảnh Creative & CTA',
    desc: 'Soi bảng xếp hạng phân phối Meta kèm slide ảnh creative thực tế và toàn bộ nội dung quảng cáo.',
    src: '/imgs/meta-screens/meta-ad-detail-modal.webp',
  },
  {
    id: 'drawer-deep',
    label: 'Deep Insights Bài',
    badge: 'HEATMAP × DEVICE × AGE',
    title: 'Heatmap, Thiết Bị, Độ Tuổi & Tỉnh Thành Từng Bài',
    desc: 'Từng chiến dịch, nhóm hay bài Ad đều có Heatmap 7×24 cạnh Device Breakdown và Age × Top Regions.',
    src: '/imgs/meta-screens/meta-drawer-heatmap-device.webp',
  },
  {
    id: 'library',
    label: 'Thư Viện Ads HD',
    badge: 'CREATIVE LIBRARY',
    title: 'Thư Viện Trực Quan Mọi Ảnh & Video Đang Chạy',
    desc: 'Hiển thị ảnh Creative HD 720px, tỷ lệ Hook 3s từng mẫu quảng cáo và mở nhanh chi tiết 1 chạm.',
    src: '/imgs/meta-screens/meta-ads-library.webp',
  },
  {
    id: 'lead-sale',
    label: 'Lead & Sale Từng Bài',
    badge: 'TRUY VẾT 2 CHIỀU CRM',
    title: 'Bấm Từng Bài Ads — Xem Ngay Danh Sách Khách & Sale',
    desc: 'Kiểm tra từng khách hàng đổ về từ bài viết, Sale đang phụ trách và doanh thu thực tế.',
    src: '/imgs/meta-screens/fusion-ad-leads-sale-modal.webp',
  },
];

const AUTOMATION_PILLARS = [
  {
    step: '01',
    icon: MousePointerClick,
    title: 'Tracking Website Từng Giây',
    desc: 'Đo lượt click, độ sâu cuộn trang, thời gian đọc bảng giá và số lần quay lại.',
    metric: 'Click • Scroll • Thời gian xem',
  },
  {
    step: '02',
    icon: Mail,
    title: 'Đo Mở & Click Email',
    desc: 'Kiểm tra khách đã mở mail hay bấm link chưa để rẽ nhánh chăm sóc đúng nhu cầu.',
    metric: 'Open • Click • Rẽ nhánh IF/ELSE',
  },
  {
    step: '03',
    icon: Zap,
    title: 'Gửi Zalo ZNS, OA & Voucher',
    desc: 'Tự động gửi Zalo ZNS nhắc hẹn, tin nhắn OA, Email cá nhân hóa và mã ưu đãi.',
    metric: 'Zalo ZNS • OA • Email • Voucher',
  },
  {
    step: '04',
    icon: Activity,
    title: 'Báo Nóng Sale & Đồng Bộ Ads',
    desc: 'Khách quay lại xem trang giá lập tức báo cho Sale và phản hồi Meta CAPI.',
    metric: 'Báo Sale ngay • Tối ưu tệp Ads',
  },
];

const ERP_MODULE_TRACKS = [
  {
    id: 'sales-crm',
    label: 'Bán hàng & Pipeline',
    badge: 'CRM 360° TRONG ERP',
    title: 'Pipeline Kéo Thả, Hồ Sơ 360° & Khách Đã Chốt',
    desc: 'Theo dõi xuyên suốt từ khách mới, hẹn gặp, đặt cọc đến hợp đồng và đối tác B2B.',
    highlights: ['Kéo thả giai đoạn bán hàng trực quan', 'Hồ sơ 360° lưu đủ lịch sử gọi & ghi chú', 'Quản lý hợp đồng & đối tác doanh nghiệp'],
    mainScreen: {
      src: '/imgs/erp-screens/deals.webp',
      title: 'Pipeline Khách hàng dạng Kanban',
    },
    subScreens: [
      { src: '/imgs/erp-screens/contacts.webp', title: 'Danh sách Khách tiềm năng 360°' },
      { src: '/imgs/erp-screens/students.webp', title: 'Khách hàng đã chốt & Hợp đồng' },
    ],
  },
  {
    id: 'ops-data',
    label: 'Vận hành & Chia Data',
    badge: 'ĐIỀU HÀNH THỜI GIAN THỰC',
    title: 'Dashboard Tổng Quan, Nhật Ký Data & Đối Soát Công Bằng',
    desc: 'Nắm trọn lượng data đổ về, tỷ lệ xử lý đúng hạn và cân bằng chia số toàn đội.',
    highlights: ['Tổng quan chỉ số điều hành theo thời gian thực', 'Nhật ký giao data minh bạch từng giây', 'Đối soát công bằng giữa các đội Sale'],
    mainScreen: {
      src: '/imgs/erp-screens/dashboard-lead.webp',
      title: 'Tổng quan Vận hành & Phân bổ Data',
    },
    subScreens: [
      { src: '/imgs/erp-screens/data-log.webp', title: 'Nhật ký & Quản lý Data' },
      { src: '/imgs/erp-screens/fair-share.webp', title: 'Đối soát Công bằng Phân phối' },
    ],
  },
  {
    id: 'approval-finance',
    label: 'Phê duyệt & Chi phí',
    badge: 'TÀI CHÍNH MINH BẠCH',
    title: 'Phê Duyệt Đa Cấp & Kiểm Soát Chi Phí Vận Hành',
    desc: 'Duyệt đơn từ, hoa hồng và đề xuất chi phí nhanh gọn, lưu vết chứng từ rõ ràng.',
    highlights: ['Luồng duyệt nhiều cấp rõ trách nhiệm', 'Kiểm soát chi phí vận hành & thanh toán', 'Lưu đầy đủ chứng từ & lịch sử duyệt'],
    mainScreen: {
      src: '/imgs/erp-screens/approvals.webp',
      title: 'Quy trình & Phê duyệt Đa cấp',
    },
    subScreens: [
      { src: '/imgs/erp-screens/expenses.webp', title: 'Chi phí Vận hành & Đề xuất Chi' },
      { src: '/imgs/erp-screens/companies.webp', title: 'Đối tác & Nhà cung cấp Doanh nghiệp' },
    ],
  },
  {
    id: 'hr-attendance',
    label: 'Nhân sự & Chấm công',
    badge: 'QUẢN TRỊ ĐỘI NGŨ',
    title: 'Chấm Công GPS, Lịch Công Tháng & Kênh Nhân Sự',
    desc: 'Giám sát giờ vào/ra ca, vị trí check-in thực tế và bảng công tự động toàn công ty.',
    highlights: ['Bảng công tháng trực quan toàn đội ngũ', 'Xác thực giờ làm & vị trí check-in GPS', 'Gắn sẵn ZaloBot & Telegram từng nhân sự'],
    mainScreen: {
      src: '/imgs/erp-screens/attendance.webp',
      title: 'Quản lý Chấm công theo Tháng',
    },
    subScreens: [
      { src: '/imgs/erp-screens/attendance-detail.webp', title: 'Chi tiết Chấm công & Vị trí GPS' },
      { src: '/imgs/erp-screens/consultants.webp', title: 'Nhân sự Công ty & Kênh Thông báo' },
    ],
  },
  {
    id: 'marketing-hub',
    label: 'Marketing & 30+ Phân hệ',
    badge: 'HỆ SINH THÁI MỞ RỘNG',
    title: 'Marketing Đa Kênh, Bảng Tin Nội Bộ & Điều Hướng 1 Chạm',
    desc: 'Tích hợp sẵn Email, Zalo OA, Automation, Bảng tin vinh danh và cấu hình linh hoạt.',
    highlights: ['Tích hợp sẵn Báo cáo Ads & Automation', 'Bảng tin nội bộ gắn kết & vinh danh', '30+ phân hệ mở rộng theo nhu cầu'],
    mainScreen: {
      src: '/imgs/erp-screens/marketing.webp',
      title: 'Trung tâm Marketing & Đa kênh',
    },
    subScreens: [
      { src: '/imgs/erp-screens/feed.webp', title: 'Bảng tin Doanh nghiệp & Vinh danh' },
      { src: '/imgs/erp-screens/quick-menu-1.jpg', title: 'Menu Điều hướng Nhanh Đa Phân Hệ' },
    ],
  },
];

const ERP_EMBEDDED_AGENTS = [
  {
    icon: Workflow,
    tag: 'CHIA SỐ TỨC THÌ',
    name: 'Trợ Lý Điều Phối Khách',
    desc: 'Lọc trùng số, chấm điểm và chia khách đúng Sale theo quy tắc.',
  },
  {
    icon: Bot,
    tag: 'CHĂM SÓC 24/7',
    name: 'Trợ Lý Tư Vấn Đa Kênh',
    desc: 'Đọc bảng giá nội bộ để trả lời Web, Zalo, Messenger & đặt lịch.',
  },
  {
    icon: Cpu,
    tag: 'VẬN HÀNH NỘI BỘ',
    name: 'Trợ Lý Phê Duyệt & HR',
    desc: 'Nhắc việc quá hạn, theo sát đơn chờ duyệt & tổng hợp công ca.',
  },
  {
    icon: BarChart3,
    tag: 'BÁO CÁO TỰ ĐỘNG',
    name: 'Trợ Lý Đọc Số & Tối Ưu',
    desc: 'Cảnh báo bài quảng cáo kém hiệu quả & gửi báo cáo cuối ngày.',
  },
];

const TOUCHPOINT_SHOWCASES = [
  {
    id: 'kaen',
    tag: 'F&B • SỰ KIỆN',
    title: 'KA-EN Event',
    url: 'ka-en.com.vn/event',
    desc: 'Microsite đặt bàn sự kiện ẩm thực Nhật, đồng bộ nhắc lịch tự động.',
    src: '/landingpage_avatar/kaen_event.webp',
  },
  {
    id: 'nava',
    tag: 'E-COMMERCE',
    title: 'Nava Store',
    url: 'navastore.vn',
    desc: 'Web bán hàng tốc độ cao, gắn sẵn đo lường hành vi khách.',
    src: '/landingpage_avatar/nava.webp',
  },
  {
    id: 'ideasmba',
    tag: 'TUYỂN SINH MBA',
    title: 'Viện IDEAS MBA',
    url: 'ideas.edu.vn/mba',
    desc: 'Landing Page chuyển đổi cao, đẩy thẳng khách về CRM.',
    src: '/landingpage_avatar/ideasmba.webp',
  },
  {
    id: 'flora',
    tag: 'NHA KHOA • SỰ KIỆN',
    title: 'Nha Khoa Flora',
    url: 'nhakhoaflora.com',
    desc: 'Landing Page Ngày Hội Implant, tối ưu đăng ký và đồng bộ tổng đài.',
    src: '/landingpage_avatar/flora.webp',
  },
  {
    id: 'brandson',
    tag: 'HỌC VIỆN Y KHOA',
    title: 'Brandson Academy',
    url: 'brandson.vn',
    desc: 'Trang khóa học tối ưu bố cục giúp tăng mạnh tỷ lệ đăng ký.',
    src: '/landingpage_avatar/brandson.webp',
  },
  {
    id: 'ideasedu',
    tag: 'GIÁO DỤC • SEO',
    title: 'Viện Đào Tạo IDEAS',
    url: 'ideas.edu.vn',
    desc: 'Cổng thông tin đa trang chuẩn SEO Top đầu và đa phễu tuyển sinh.',
    src: '/landingpage_avatar/ideasedu.webp',
  },
];

const EXTRA_TOUCHPOINT_SHOWCASES = [
  {
    id: 'flora-qr',
    tag: 'ĐẶT GÓI & VIETQR',
    title: 'Flora Thanh Toán VietQR',
    url: 'Cổng đặt gói & QR',
    desc: 'Chọn dịch vụ, quét VietQR nhận diện tự động cộng tác viên đối soát.',
    src: '/assets/flora/flora_checkout_qr.webp',
  },
  {
    id: 'portfolio',
    tag: 'HỒ SƠ NĂNG LỰC',
    title: 'Turnio System Portal',
    url: 'turnio.vercel.app',
    desc: 'Website giới thiệu kiến trúc hệ sinh thái Marketing & Phần mềm.',
    src: '/landingpage_avatar/portfolio.webp',
  },
];

const WEB3D_FLOORPLAN_SHOTS = [
  {
    id: 'a1',
    badge: 'CĂN 2PN A1 • 66M²',
    title: 'Sa Bàn 3D Căn 2PN A1',
    desc: 'Bóc mái trực quan phòng khách, 2 phòng ngủ và ban công đón gió.',
    src: '/assets/ecolife/bocmai/bocmai_3d_a1.webp',
  },
  {
    id: 'a2',
    badge: 'CĂN 2PN A2 • 68.9M²',
    title: 'Sa Bàn 3D Căn 2PN A2',
    desc: 'Kiểm tra bố trí nội thất và hướng ánh sáng tự nhiên trên trình duyệt.',
    src: '/assets/ecolife/bocmai/bocmai_3d_a2.webp',
  },
  {
    id: 'b1',
    badge: 'CĂN GÓC B1 • 77.8M²',
    title: 'Sa Bàn 3D Căn Góc B1',
    desc: 'Xoay 360° xem mặt bằng căn góc 2 mặt thoáng ngay trên điện thoại.',
    src: '/assets/ecolife/bocmai/bocmai_3d_b1.webp',
  },
  {
    id: 'b2',
    badge: 'CĂN 2PN+ B2 • 87.3M²',
    title: 'Sa Bàn 3D Căn 2PN+ B2',
    desc: 'Phối cảnh bóc mái không gian đa năng chuẩn vật liệu bàn giao.',
    src: '/assets/ecolife/bocmai/bocmai_3d_b2.webp',
  },
  {
    id: 'b3',
    badge: 'PANORAMA B3 • 88.8M²',
    title: 'Sa Bàn 3D Căn Góc B3',
    desc: 'Căn 3 phòng ngủ tầm nhìn toàn cảnh, gắn sẵn hỏi giá qua AI.',
    src: '/assets/ecolife/bocmai/bocmai_3d_b3.webp',
  },
  {
    id: 'b6',
    badge: 'CĂN 3PN B6 • 87.1M²',
    title: 'Sa Bàn 3D Căn 3PN B6',
    desc: 'Tải mượt dưới 3.5MB trên di động, bấm giữ căn đẩy thẳng về CRM.',
    src: '/assets/ecolife/bocmai/bocmai_3d_b6.webp',
  },
];

export const DomationHome: React.FC = () => {
  usePageSeo(getHomeSeoConfig());
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspectionTab, setInspectionTab] = useState<InspectionTabId>('erp');
  const [estimatorOpen, setEstimatorOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactDefaults, setContactDefaults] = useState<{
    service?: string;
    note?: string;
  }>({});

  const [activeAutoDataIdx, setActiveAutoDataIdx] = useState(0);
  const [activeAdsIdx, setActiveAdsIdx] = useState(0);
  const [activeErpIdx, setActiveErpIdx] = useState(0);
  const [showMoreTouchpoints, setShowMoreTouchpoints] = useState(false);
  const [show3dDetails, setShow3dDetails] = useState(false);
  const [zoomedShot, setZoomedShot] = useState<{
    src: string;
    title: string;
    badge?: string;
    desc?: string;
  } | null>(null);
  const [billingYearly, setBillingYearly] = useState(true);
  const [showBackTop, setShowBackTop] = useState(false);

  const openInspection = (tab: InspectionTabId) => {
    setInspectionTab(tab);
    setInspectionOpen(true);
  };

  const openContact = (service?: string, note?: string) => {
    setContactDefaults({ service, note });
    setContactOpen(true);
  };

  useEffect(() => {
    preloadAppImages([
      ...AUTODATA_SCREENS.map((s) => s.src),
      ...ERP_MODULE_TRACKS.flatMap((t) => [t.mainScreen.src, ...t.subScreens.map((sub) => sub.src)]),
      '/imgs/meta-screens/fusion-campaign-crm-leads.webp',
      ...ADS_SPOTLIGHT_SCREENS.map((s) => s.src),
    ]);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 560);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const currentAutoData = AUTODATA_SCREENS[activeAutoDataIdx] || AUTODATA_SCREENS[0];
  const currentAdsShot = ADS_SPOTLIGHT_SCREENS[activeAdsIdx] || ADS_SPOTLIGHT_SCREENS[0];
  const currentErpTrack = ERP_MODULE_TRACKS[activeErpIdx] || ERP_MODULE_TRACKS[0];

  return (
    <div className="min-h-screen relative text-slate-900 selection:bg-blue-600 selection:text-white font-sans overflow-x-clip">
      <LuxuryGoldBackdrop />
      <SectionQuickDock />

      <Navbar
        activePage="home"
        onOpenContact={() => openContact()}
        onOpenShowcase={() => openInspection('erp')}
      />

      <main className="relative z-10 pt-20 sm:pt-24">
        {/* ================================================================ */}
        {/* 1. HERO — BESPOKE ENTERPRISE OS & MULTI-AGENT FOCUS              */}
        {/* ================================================================ */}
        <section
          id="hero"
          className="relative px-4 sm:px-6 pt-4 pb-14 sm:pb-20 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Executive Narrative */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center justify-center lg:justify-start">
                  <span className="ql-eyebrow">
                    <Sparkles className="w-3.5 h-3.5 text-[#1E40FF]" />
                    <span>HỆ SINH THÁI DOMATION</span>
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl xl:text-[44px] font-bold text-slate-900 tracking-[-0.015em] space-y-2">
                  <span className="block leading-[1.3]">Hệ Điều Hành Doanh Nghiệp</span>
                  <span className="block leading-[1.3] text-gradient-inkica">
                    Từ Hút Khách Đến Vận Hành
                  </span>
                </h1>

                <div className="relative rounded-2xl inkica-glass-card px-4 py-3.5 sm:px-5 sm:py-4 max-w-xl mx-auto lg:mx-0">
                  <p className="text-sm sm:text-[15px] text-slate-600 leading-[1.65] font-normal">
                    Kết nối{' '}
                    <span className="font-semibold text-[#1E40FF]">Website · Landing Page · 3D</span>{' '}
                    với{' '}
                    <span className="font-semibold text-slate-900">
                      Auto Data Tức Thì, Báo cáo Ads, Automation Zalo ZNS &amp; ERP tích hợp AI
                    </span>.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/80 p-4 sm:p-5 shadow-sm max-w-xl mx-auto lg:mx-0 text-left space-y-2.5">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Hai Mặt Trận Đồng Bộ
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                      ALL-IN-ONE OS
                    </span>
                  </div>

                  <div className="space-y-2 text-xs sm:text-[13px] text-slate-600">
                    <div className="flex items-start gap-2.5">
                      <Globe className="w-4 h-4 text-[#1E40FF] shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-semibold text-slate-800">Mặt tiền hút khách:</strong>{' '}
                        Web, Landing Page &amp; 3D chốt niềm tin
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Cpu className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-semibold text-slate-800">App nội bộ vận hành:</strong>{' '}
                        Chia số Tức Thì · Báo cáo Ads · ZNS · ERP 5.0
                      </span>
                    </div>

                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
                        <Bot className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Kết nối:</span>
                      </span>
                      <ChannelLogoStrip variant="compact" />
                    </div>
                  </div>
                </div>

                {/* 2 Buttons on 1 Single Row */}
                <div className="grid grid-cols-2 sm:inline-flex items-center gap-2.5 sm:gap-3 pt-1 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() =>
                      openContact(
                        'Tư Vấn Hệ Sinh Thái DOMATION (ERP • CRM • Ads Report • Web)',
                        'Mong muốn khảo sát quy trình và tư vấn triển khai hệ sinh thái phù hợp cho doanh nghiệp'
                      )
                    }
                    className="btn-inkica-primary min-h-[44px] justify-center px-3 sm:px-6 py-3 text-[11px] sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <span>Tư Vấn Triển Khai</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openInspection('erp')}
                    className="ql-btn-outline min-h-[44px] justify-center px-3 sm:px-5 py-3 text-[11px] sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <MonitorSmartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1E40FF] shrink-0" />
                    <span>Màn Hình Thực Tế</span>
                  </button>
                </div>
              </div>

              {/* Right Enlarged Interactive Brand Sphere */}
              <div className="lg:col-span-6 relative flex flex-col items-center">
                <div className="w-full max-w-[580px] lg:max-w-[600px] mx-auto">
                  <InteractiveBrandSphere />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 2. ENTERPRISE STORY — WHY BESPOKE DESIGN MATTERS                 */}
        {/* ================================================================ */}
        <section id="story" className="relative py-16 sm:py-22 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div className="max-w-2xl">
                <div className="ql-eyebrow mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>CÂU CHUYỆN DOANH NGHIỆP • TRIẾT LÝ MAY ĐO</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                  Mỗi Doanh Nghiệp Là Một{' '}
                  <span className="text-gradient-inkica">Bản Thiết Kế Riêng</span>
                </h2>
              </div>
              <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                Phần mềm đóng gói buộc đội ngũ sửa quy trình theo công cụ; DOMATION kiến tạo hệ thống xoay quanh chính mô hình của bạn.
              </p>
            </div>

            <div className="rounded-[28px] bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/75 overflow-hidden">
              {ENTERPRISE_STORY_CHAPTERS.map((chapter) => (
                <div
                  key={chapter.step}
                  className="p-7 sm:p-9 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-[#1E40FF] bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {chapter.step}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0369A1]">
                          {chapter.tag}
                        </span>
                      </div>
                      <img
                        src={chapter.decorImg}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="w-12 h-12 object-contain shrink-0 drop-shadow-[0_10px_16px_rgba(30,64,255,0.12)]"
                      />
                    </div>

                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug pt-1">
                      {chapter.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {chapter.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/90 border border-slate-200/80 px-5 py-3.5 text-xs">
              <span className="text-slate-600">
                Hai mặt trận đồng bộ: <strong className="text-slate-900">Website / Landing Page 3D</strong> hút khách ↔ <strong className="text-slate-900">App nội bộ</strong> chia số, đo Ads &amp; điều hành ERP.
              </span>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a href="#touchpoints" className="font-semibold text-[#1E40FF] hover:underline inline-flex items-center gap-1">
                  <span>Xem Website &amp; 3D</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <span className="text-slate-300">|</span>
                <a href="#crm-data" className="font-semibold text-slate-800 hover:text-[#1E40FF] inline-flex items-center gap-1">
                  <span>Xem App Nội Bộ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 4. CRM AUTO DATA — LAYOUT 1: SPLIT EDITORIAL + LIVE APP SWITCHER */}
        {/* ================================================================ */}
        <section id="crm-data" className="relative py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/85 shadow-sm p-6 sm:p-9">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-9 items-center">
                {/* Left Compact Switcher */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold uppercase tracking-wider text-[#1E40FF]">
                    <Database className="w-3.5 h-3.5" />
                    <span>01 • CRM AUTO DATA</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.22] tracking-tight">
                    Chia Khách Tới Tay Sale{' '}
                    <span className="text-gradient-inkica">Tức Thì</span>
                  </h2>

                  <p className="text-sm text-slate-600">
                    Gom lead đa nguồn, lọc trùng 6 tháng, đẩy ZaloBot/Telegram và bù ticket minh bạch.
                  </p>

                  {/* 4 Clean Compact Feature Switchers */}
                  <div className="space-y-2">
                    {AUTODATA_SCREENS.map((item, idx) => {
                      const active = activeAutoDataIdx === idx;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveAutoDataIdx(idx)}
                          className={`w-full text-left rounded-xl px-3.5 py-2.5 border transition-all cursor-pointer flex items-center gap-3 ${
                            active
                              ? 'bg-[#EEF4FF] border-[#1E40FF]/40 shadow-xs'
                              : 'bg-slate-50/70 border-slate-200/70 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center shrink-0 ${
                              active ? 'bg-[#1E40FF] text-white' : 'bg-white text-slate-500 border border-slate-200'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className={`text-xs sm:text-sm font-semibold ${active ? 'text-[#1E40FF]' : 'text-slate-900'}`}>
                              {item.label}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{item.hint}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <a
                      href="/data"
                      onClick={(e) => handleSpaLinkClick(e, '/data')}
                      className="btn-inkica-primary min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold"
                    >
                      <span>Mở Auto Data</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => openInspection('data-capi')}
                      className="ql-btn-outline min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      <span>Xem 8 Màn Hình</span>
                    </button>
                  </div>
                </div>

                {/* Right Real App Screenshot Frame */}
                <div className="lg:col-span-7">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setZoomedShot({
                        src: currentAutoData.src,
                        title: currentAutoData.title,
                        badge: currentAutoData.badge,
                        desc: currentAutoData.desc,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setZoomedShot({
                          src: currentAutoData.src,
                          title: currentAutoData.title,
                          badge: currentAutoData.badge,
                          desc: currentAutoData.desc,
                        });
                      }
                    }}
                    className="group relative rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-md cursor-zoom-in"
                  >
                    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200/80">
                      <span className="text-[11px] font-semibold text-slate-700 truncate">
                        {currentAutoData.title}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1E40FF] shrink-0">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Phóng to</span>
                      </span>
                    </div>
                    <SmoothAppImage
                      src={currentAutoData.src}
                      alt={currentAutoData.title}
                      fit="contain"
                      aspectClass="aspect-[16/10]"
                      eager
                      hoverZoom
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 5. META & GOOGLE ADS REPORT FUSED WITH CRM — LIGHT FROSTED BENTO */}
        {/* ================================================================ */}
        <section id="ads-report" className="relative py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-[28px] bg-gradient-to-br from-[#F5F9FF] via-white to-[#F0FDFA] border border-blue-200/85 shadow-sm p-6 sm:p-9">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-7">
                <div className="max-w-2xl">
                  <div className="ql-eyebrow mb-2.5">
                    <BarChart3 className="w-3.5 h-3.5 text-[#1E40FF]" />
                    <span>02 • META &amp; GOOGLE ADS REPORT × CRM</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.22] tracking-tight">
                    Biết Rõ Nội Dung Nào Ra Khách —{' '}
                    <span className="text-gradient-inkica">Biết Rõ Khách Nào Từ Nội Dung Nào</span>
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href="/meta-report"
                    onClick={(e) => handleSpaLinkClick(e, '/meta-report')}
                    className="btn-inkica-primary min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold"
                  >
                    <span>Dùng Thử Free 1 Tháng</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => openInspection('meta-report')}
                    className="ql-btn-outline min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    <MonitorSmartphone className="w-4 h-4 text-[#1E40FF]" />
                    <span>12 Màn Hình + Video</span>
                  </button>
                </div>
              </div>

              {/* Light Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Left Main Fusion Table */}
                <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                      Bảng Chiến Dịch Phủ Lead CRM, CPQL Thực, Doanh Thu &amp; Sale Phụ Trách
                    </h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1E40FF] bg-blue-50 px-2.5 py-0.5 rounded-full shrink-0">
                      REAL-TIME
                    </span>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setZoomedShot({
                        src: '/imgs/meta-screens/fusion-campaign-crm-leads.webp',
                        title: 'Bảng Chiến Dịch Hợp Nhất Lead CRM, CPQL & Sale Phụ Trách',
                        badge: 'META REPORT × CRM',
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setZoomedShot({
                          src: '/imgs/meta-screens/fusion-campaign-crm-leads.webp',
                          title: 'Bảng Chiến Dịch Hợp Nhất Lead CRM, CPQL & Sale Phụ Trách',
                          badge: 'META REPORT × CRM',
                        });
                      }
                    }}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white cursor-zoom-in"
                  >
                    <SmoothAppImage
                      src="/imgs/meta-screens/fusion-campaign-crm-leads.webp"
                      alt="Bảng Chiến Dịch Hợp Nhất Lead CRM và Sale Phụ Trách"
                      fit="contain"
                      aspectClass="aspect-[16/10]"
                      eager
                      hoverZoom
                    />
                    <span className="absolute bottom-2.5 right-2.5 z-20 px-2.5 py-1 rounded-lg bg-slate-900/75 text-[11px] font-medium text-white inline-flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5 text-cyan-300" />
                      Phóng to
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 mt-3.5">
                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-2.5">
                      <div className="text-xs font-semibold text-[#1E40FF]">1 Chạm Kết Nối</div>
                      <div className="text-[11px] text-slate-600">Tự nhận tài khoản CRM</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-2.5">
                      <div className="text-xs font-semibold text-[#1E40FF]">Hook Video 3s</div>
                      <div className="text-[11px] text-slate-600">Cảnh báo bão hòa sớm</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-2.5">
                      <div className="text-xs font-semibold text-[#1E40FF]">Heatmap &amp; Phễu</div>
                      <div className="text-[11px] text-slate-600">Theo bài &amp; theo giờ</div>
                    </div>
                  </div>
                </div>

                {/* Right Spotlight: Interactive Main Meta Report UI Showcase */}
                <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 gap-3 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                      {currentAdsShot.label}
                    </h3>
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">
                      Bấm ảnh để phóng to
                    </span>
                  </div>

                  {/* Main Capture Switcher Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {ADS_SPOTLIGHT_SCREENS.map((shot, idx) => {
                      const active = idx === activeAdsIdx;
                      return (
                        <button
                          key={shot.id}
                          type="button"
                          data-testid={`home-meta-shot-tab-${shot.id}`}
                          onClick={() => setActiveAdsIdx(idx)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                            active
                              ? 'bg-[#1E40FF] text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#1E40FF]'
                          }`}
                        >
                          {shot.label}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setZoomedShot({
                        src: currentAdsShot.src,
                        title: currentAdsShot.title,
                        badge: currentAdsShot.badge,
                        desc: currentAdsShot.desc,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setZoomedShot({
                          src: currentAdsShot.src,
                          title: currentAdsShot.title,
                          badge: currentAdsShot.badge,
                          desc: currentAdsShot.desc,
                        });
                      }
                    }}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white cursor-zoom-in"
                  >
                    <SmoothAppImage
                      src={currentAdsShot.src}
                      alt={currentAdsShot.title}
                      fit="contain"
                      aspectClass="aspect-[16/10]"
                      eager
                      hoverZoom
                    />
                    <span className="absolute bottom-2.5 right-2.5 z-20 px-2.5 py-1 rounded-lg bg-slate-900/75 text-[11px] font-medium text-white inline-flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5 text-cyan-300" />
                      Phóng to
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {currentAdsShot.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {currentAdsShot.desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 5B. CLOSED-LOOP INTELLIGENCE CIRCLE (META ADS <-> CRM <-> CAPI)  */}
        {/* Placed right below Biết Rõ Nội Dung Nào Ra Khách Section         */}
        {/* ================================================================ */}
        <ClosedLoopFlywheelSection variant="home" />

        {/* ================================================================ */}
        {/* 6. AUTOMATION NURTURING & BEHAVIOR TRACKING — COMPACT 4 STEPS    */}
        {/* ================================================================ */}
        <section id="automation-hub" className="relative py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
              <div>
                <div className="ql-eyebrow mb-2.5">
                  <Zap className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>03 • AUTOMATION &amp; TRACKING HÀNH VI</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                  Nuôi Dưỡng Tự Động 24/7 —{' '}
                  <span className="text-gradient-inkica">Đo Click, Lượt Mở &amp; Thời Gian Xem Web</span>
                </h2>
              </div>
              <a
                href="/automation"
                onClick={(e) => handleSpaLinkClick(e, '/automation')}
                className="btn-inkica-primary min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold w-fit shrink-0"
              >
                <span>Khám Phá Automation</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {AUTOMATION_PILLARS.map((step) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="rounded-2xl bg-white/95 border border-slate-200/85 p-5 shadow-xs hover:border-blue-300/80 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E40FF] flex items-center justify-center border border-blue-100">
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-slate-400">
                          {step.step}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                    </div>
                    <div className="pt-2.5 border-t border-slate-100 text-[11px] font-semibold text-[#1E40FF]">
                      {step.metric}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  setZoomedShot({
                    src: '/imgs/erp-screens/marketing.webp',
                    title: 'Trung Tâm Chiến Dịch, Flow Nuôi Dưỡng, Zalo OA & Web Tracking',
                    badge: 'MARKETING HUB',
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setZoomedShot({
                      src: '/imgs/erp-screens/marketing.webp',
                      title: 'Trung Tâm Chiến Dịch, Flow Nuôi Dưỡng, Zalo OA & Web Tracking',
                      badge: 'MARKETING HUB',
                    });
                  }
                }}
                className="group rounded-2xl bg-white/95 border border-slate-200/85 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-zoom-in"
              >
                <div className="overflow-hidden border-b border-slate-100">
                  <SmoothAppImage
                    src="/imgs/erp-screens/marketing.webp"
                    alt="Trung tâm Marketing Đa kênh & Automation"
                    fit="contain"
                    aspectClass="aspect-[16/9]"
                    hoverZoom
                  />
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-xs sm:text-sm font-semibold text-slate-900">
                    Chiến Dịch Email, Zalo ZNS, Voucher &amp; Web Tracking
                  </span>
                  <ZoomIn className="w-4 h-4 text-[#1E40FF] shrink-0" />
                </div>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  setZoomedShot({
                    src: '/imgs/autodata/showcase/screen_integrations.jpg',
                    title: 'Đồng Bộ ZaloBot, Telegram, Email & Phản Hồi Quảng Cáo',
                    badge: 'ĐỒNG BỘ KÊNH',
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setZoomedShot({
                      src: '/imgs/autodata/showcase/screen_integrations.jpg',
                      title: 'Đồng Bộ ZaloBot, Telegram, Email & Phản Hồi Quảng Cáo',
                      badge: 'ĐỒNG BỘ KÊNH',
                    });
                  }
                }}
                className="group rounded-2xl bg-white/95 border border-slate-200/85 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-zoom-in"
              >
                <div className="overflow-hidden border-b border-slate-100">
                  <SmoothAppImage
                    src="/imgs/autodata/showcase/screen_integrations.jpg"
                    alt="Kết nối ZaloBot, Telegram, Email & Meta CAPI"
                    fit="contain"
                    aspectClass="aspect-[16/9]"
                    hoverZoom
                  />
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-xs sm:text-sm font-semibold text-slate-900">
                    Báo Nóng ZaloBot, Telegram &amp; Đồng Bộ Meta CAPI
                  </span>
                  <ZoomIn className="w-4 h-4 text-[#1E40FF] shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 7. DOMATION ERP 5.0 + EMBEDDED MULTI-AGENT AI                    */}
        {/* ================================================================ */}
        <section id="erp-suite" className="relative py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <div className="ql-eyebrow mb-2.5">
                  <Building2 className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>04 • DOMATION ERP 5.0 &amp; AI NỘI BỘ</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                  Bán Hàng, Phê Duyệt &amp; Chấm Công —{' '}
                  <span className="text-gradient-inkica">Gọn Trong Một Hệ Điều Hành</span>
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href="/erp"
                  onClick={(e) => handleSpaLinkClick(e, '/erp')}
                  className="btn-inkica-primary min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold"
                >
                  <span>Khám Phá ERP 5.0</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => openInspection('erp')}
                  className="ql-btn-outline min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <span>Xem 18 Màn Hình</span>
                </button>
              </div>
            </div>

            <div className="mb-5">
              <DomResponsiveSubtabs
                tabs={ERP_MODULE_TRACKS.map((track, idx) => ({
                  id: String(idx),
                  label: track.label,
                }))}
                value={String(activeErpIdx)}
                onChange={(id) => setActiveErpIdx(Number(id) || 0)}
                maxMobile={2}
                className="[&>button]:min-h-[44px] sm:[&>button]:min-h-0"
              />
            </div>

            <div className="rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/85 shadow-sm p-5 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setZoomedShot({
                        src: currentErpTrack.mainScreen.src,
                        title: currentErpTrack.mainScreen.title,
                        badge: currentErpTrack.badge,
                        desc: currentErpTrack.desc,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setZoomedShot({
                          src: currentErpTrack.mainScreen.src,
                          title: currentErpTrack.mainScreen.title,
                          badge: currentErpTrack.badge,
                        });
                      }
                    }}
                    className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm cursor-zoom-in"
                  >
                    <SmoothAppImage
                      src={currentErpTrack.mainScreen.src}
                      alt={currentErpTrack.mainScreen.title}
                      fit="contain"
                      aspectClass="aspect-[16/10]"
                      eager
                      hoverZoom
                    />
                    <span className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-slate-900/75 text-white text-[11px] font-medium inline-flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5 text-cyan-300" />
                      Phóng to
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1E40FF]">
                      {currentErpTrack.badge}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      {currentErpTrack.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600">{currentErpTrack.desc}</p>
                    <div className="space-y-1.5 pt-1">
                      {currentErpTrack.highlights.map((hl) => (
                        <div key={hl} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {currentErpTrack.subScreens.map((sub) => (
                      <button
                        key={sub.src}
                        type="button"
                        onClick={() =>
                          setZoomedShot({
                            src: sub.src,
                            title: sub.title,
                            badge: currentErpTrack.badge,
                          })
                        }
                        className="group text-left rounded-xl overflow-hidden border border-slate-200 bg-white hover:border-blue-300 transition-all cursor-zoom-in"
                      >
                        <SmoothAppImage
                          src={sub.src}
                          alt={sub.title}
                          fit="contain"
                          aspectClass="aspect-[16/10]"
                          eager
                          hoverZoom
                        />
                        <div className="px-2.5 py-1.5 bg-white text-[11px] font-semibold text-slate-700 truncate border-t border-slate-100">
                          {sub.title}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Embedded Multi-Agent AI Inside ERP */}
              <div id="multi-agent" className="pt-5 border-t border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E40FF] to-[#06B6D4] text-white flex items-center justify-center shrink-0">
                      <Network className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1E40FF]">
                        ĐA TRỢ LÝ AI BÊN TRONG ERP
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        4 Trợ Lý AI Chuyên Trách Phối Hợp Theo Tài Liệu Nội Bộ
                      </h4>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3 py-1 rounded-full w-fit shrink-0">
                    <Users className="w-3.5 h-3.5" />
                    Phân quyền từng phòng ban
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {ERP_EMBEDDED_AGENTS.map((agent) => {
                    const AgentIcon = agent.icon;
                    return (
                      <div key={agent.name} className="rounded-xl bg-slate-50/90 border border-slate-200/80 p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-[#1E40FF] flex items-center justify-center">
                            <AgentIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-semibold uppercase text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200/80">
                            {agent.tag}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-900">{agent.name}</div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{agent.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 8. MODERN CUSTOMER TOUCHPOINTS — WEBSITE & LANDING PAGE          */}
        {/* ================================================================ */}
        <section id="touchpoints" className="relative py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="ql-eyebrow mb-2.5">
                  <Globe className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>05 • ĐIỂM CHẠM CUỐI THẾ HỆ MỚI</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                  Website &amp; Landing Page —{' '}
                  <span className="text-gradient-inkica">Chốt Niềm Tin, Đẩy Về CRM</span>
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  aria-expanded={showMoreTouchpoints}
                  onClick={() => setShowMoreTouchpoints((prev) => !prev)}
                  className="btn-inkica-primary min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <span>{showMoreTouchpoints ? 'Thu gọn chi tiết' : 'Xem chi tiết'}</span>
                  {showMoreTouchpoints ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEstimatorOpen(true)}
                  className="ql-btn-outline min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <span>Báo giá</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {TOUCHPOINT_SHOWCASES.map((site) => (
                <div
                  key={site.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setZoomedShot({
                      src: site.src,
                      title: `${site.title} (${site.url})`,
                      badge: site.tag,
                      desc: site.desc,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setZoomedShot({
                        src: site.src,
                        title: `${site.title} (${site.url})`,
                        badge: site.tag,
                        desc: site.desc,
                      });
                    }
                  }}
                  className="group rounded-2xl bg-white/95 border border-slate-200/85 overflow-hidden shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col cursor-zoom-in"
                >
                  <div className="relative overflow-hidden border-b border-slate-100">
                    <img
                      src={site.src}
                      alt={site.title}
                      loading="lazy"
                      className="w-full aspect-[16/10] object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/95 text-[10px] font-semibold text-[#1E40FF] shadow-sm">
                      {site.tag}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">{site.title}</h3>
                      <span className="text-[11px] font-mono text-slate-400 truncate">{site.url}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{site.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {showMoreTouchpoints && (
              <div className="mt-5 pt-5 border-t border-slate-200/80 space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {EXTRA_TOUCHPOINT_SHOWCASES.map((site) => (
                    <div
                      key={site.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setZoomedShot({
                          src: site.src,
                          title: `${site.title} (${site.url})`,
                          badge: site.tag,
                          desc: site.desc,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setZoomedShot({
                            src: site.src,
                            title: `${site.title} (${site.url})`,
                            badge: site.tag,
                            desc: site.desc,
                          });
                        }
                      }}
                      className="group rounded-2xl bg-white/95 border border-slate-200/85 overflow-hidden shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col cursor-zoom-in"
                    >
                      <div className="relative overflow-hidden border-b border-slate-100">
                        <img
                          src={site.src}
                          alt={site.title}
                          loading="lazy"
                          className="w-full aspect-[16/10] object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/95 text-[10px] font-semibold text-[#1E40FF] shadow-sm">
                          {site.tag}
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900">{site.title}</h3>
                          <span className="text-[11px] font-mono text-slate-400 truncate">{site.url}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{site.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-white/90 border border-blue-200/75 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      'Chuẩn SEO & Schema',
                      'Tải nhanh < 1.5s',
                      'Tracking Click & Thời gian đọc',
                      'Đẩy Lead CRM Tức Thì',
                    ].map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs font-medium text-slate-800"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1E40FF] shrink-0" />
                        <span>{item}</span>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <a
                      href="/web-design"
                      onClick={(e) => handleSpaLinkClick(e, '/web-design')}
                      className="ql-btn-outline px-4 py-2 text-xs font-semibold"
                    >
                      <span>Xem trang Thiết kế Web</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setEstimatorOpen(true)}
                      className="btn-inkica-primary px-4 py-2 text-xs font-semibold cursor-pointer"
                    >
                      <span>Báo giá</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================================================================ */}
        {/* 9. DEDICATED INTERACTIVE 3D WEBGL SHOWCASE SECTION               */}
        {/* ================================================================ */}
        <section id="web-3d-experience" className="relative py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="ql-eyebrow mb-2.5">
                  <Box className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>06 • CÔNG NGHỆ SA BÀN 3D TƯƠNG TÁC</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25] tracking-tight">
                  Sa Bàn 3D Bóc Mái —{' '}
                  <span className="text-gradient-inkica">Nhập Vai Trực Tiếp Trên Web</span>
                </h2>
                <p className="text-sm text-slate-600 mt-2 max-w-2xl">
                  Khách tự xoay từng căn hộ ngay trên trình duyệt điện thoại, soi ánh sáng công năng và hỏi giá đẩy thẳng về CRM.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  aria-expanded={show3dDetails}
                  onClick={() => setShow3dDetails((prev) => !prev)}
                  className="btn-inkica-primary min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <span>{show3dDetails ? 'Thu gọn chi tiết' : 'Xem chi tiết'}</span>
                  {show3dDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEstimatorOpen(true)}
                  className="ql-btn-outline min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <span>Báo giá</span>
                </button>
              </div>
            </div>

            <div className="rounded-[26px] bg-white/95 backdrop-blur-xl border border-slate-200/90 p-5 sm:p-7 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                  <video
                    src="/assets/ecolife/ecolife_3d_preview.mp4"
                    poster="/assets/ecolife/bocmai/bocmai_3d_b3.webp"
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full aspect-video object-cover block"
                  />
                  <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-[#1E40FF] text-[10px] sm:text-[11px] font-semibold shadow-sm border border-blue-100">
                    <Play className="w-3 h-3 fill-[#1E40FF]" />
                    <span>CLIP DEMO 3D THỰC TẾ • XOAY 360°</span>
                  </span>
                </div>

                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80">
                      <h3 className="text-sm font-bold text-slate-900">Bóc Mái 3D Từng Không Gian</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Khách hàng xoay tự do, phóng to từng phòng trước khi gặp Sale.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80">
                      <h3 className="text-sm font-bold text-slate-900">Mở Tức Thì Trên Điện Thoại</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Nén siêu nhẹ dưới 3.5MB, chạy thẳng Safari &amp; Chrome không cần app.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80">
                      <h3 className="text-sm font-bold text-slate-900">Gắn Sẵn Hỏi Giá &amp; Đẩy CRM</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Ghi nhận đúng căn đang xem và chia số Sale phụ trách tức thì.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {WEB3D_FLOORPLAN_SHOTS.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setZoomedShot({
                            src: item.src,
                            title: item.title,
                            badge: item.badge,
                            desc: item.desc,
                          })
                        }
                        className="group rounded-xl overflow-hidden border border-slate-200/90 bg-white hover:border-blue-400 transition-all text-left cursor-zoom-in"
                      >
                        <img
                          src={item.src}
                          alt={item.title}
                          loading="lazy"
                          className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="px-2 py-1 text-[10px] font-semibold text-slate-700 truncate">
                          {item.badge.split('•')[0].trim()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {show3dDetails && (
                <div className="mt-6 pt-6 border-t border-slate-200/80 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1E40FF]">
                      6 Mẫu Sa Bàn Căn Hộ 3D Đã Triển Khai (Bấm Để Phóng To)
                    </span>
                    <button
                      type="button"
                      onClick={() => setEstimatorOpen(true)}
                      className="text-xs font-semibold text-[#1E40FF] hover:underline cursor-pointer"
                    >
                      Nhận báo giá làm Web 3D →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {WEB3D_FLOORPLAN_SHOTS.map((item) => (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setZoomedShot({
                            src: item.src,
                            title: item.title,
                            badge: item.badge,
                            desc: item.desc,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setZoomedShot({
                              src: item.src,
                              title: item.title,
                              badge: item.badge,
                              desc: item.desc,
                            });
                          }
                        }}
                        className="group rounded-2xl bg-slate-50/70 border border-slate-200/85 overflow-hidden hover:border-blue-300 hover:bg-white transition-all cursor-zoom-in"
                      >
                        <div className="relative overflow-hidden border-b border-slate-100">
                          <img
                            src={item.src}
                            alt={item.title}
                            loading="lazy"
                            className="w-full aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/95 text-[10px] font-semibold text-[#1E40FF] shadow-sm">
                            {item.badge}
                          </span>
                        </div>
                        <div className="p-3.5">
                          <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                          <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 px-4 py-3 rounded-2xl bg-white/85 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Mở nhanh từng ứng dụng:</span>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-x-5 sm:gap-y-1.5">
                {DEDICATED_APP_LINKS.map((app) => (
                  <a
                    key={app.href}
                    href={app.href}
                    onClick={(e) => handleSpaLinkClick(e, app.href)}
                    className="font-semibold text-slate-700 hover:text-[#1E40FF] inline-flex items-center gap-1 transition-colors"
                  >
                    <span>{app.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 5. BESPOKE ENTERPRISE CASE STUDIES                               */}
        {/* ================================================================ */}
        <section id="cases" className="relative py-20 sm:py-26 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div className="max-w-2xl">
                <div className="ql-eyebrow mb-3">
                  <Building2 className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>CÂU CHUYỆN TRIỂN KHAI THỰC TẾ</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-[1.25]">
                  Kiến Trúc May Đo{' '}
                  <span className="text-gradient-inkica">Tại Doanh Nghiệp Đối Tác</span>
                </h2>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <p className="text-sm text-slate-600 max-w-md leading-relaxed md:text-right">
                  Mỗi dự án được thiết kế riêng từ luồng dữ liệu, trợ lý AI đến giao diện vận hành để giải quyết đúng bài toán ngành.
                </p>
                <a
                  href="/portfolio"
                  onClick={(e) => handleSpaLinkClick(e, '/portfolio')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E40FF] hover:text-cyan-600 transition-colors"
                >
                  <span>Xem toàn bộ Portfolio &amp; Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-xs grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/75 overflow-hidden">
              {CASE_STUDY_SPOTLIGHTS.map((cs, idx) => {
                const isInkica = cs.id === 'inkica';
                return (
                  <div
                    key={cs.id}
                    className={`p-7 sm:p-9 flex flex-col justify-between gap-5 ${
                      idx >= 2 ? 'lg:border-t lg:border-slate-200/75' : ''
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3.5">
                          <div className="h-11 px-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2 shrink-0">
                            <img
                              src={cs.logo}
                              alt={cs.company}
                              loading="lazy"
                              className="h-6 max-w-[115px] object-contain"
                            />
                            {cs.secondaryLogo && (
                              <>
                                <span className="h-4 w-px bg-slate-200 shrink-0" />
                                <img
                                  src={cs.secondaryLogo}
                                  alt={cs.company}
                                  loading="lazy"
                                  className="h-6 max-w-[105px] object-contain"
                                />
                              </>
                            )}
                            {isInkica && (
                              <span className="text-sm font-bold tracking-tight text-slate-900">
                                inkica<span className="text-[#1E40FF]">.</span>
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">
                              {cs.company}
                            </h3>
                            <div className="text-xs font-medium text-slate-500">
                              {cs.sector}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {cs.summary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[#1E40FF]">
                          {cs.result}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                          {cs.cost}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                          {cs.impact}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        {CASE_ARTICLE_MAP[cs.id] && (
                          <a
                            href={CASE_ARTICLE_MAP[cs.id]}
                            onClick={(e) => handleSpaLinkClick(e, CASE_ARTICLE_MAP[cs.id])}
                            className="text-xs font-semibold text-slate-700 hover:text-[#1E40FF] flex items-center gap-1"
                          >
                            <span>Phân tích triển khai</span>
                            <ArrowRight className="w-3 h-3" />
                          </a>
                        )}
                        {cs.inspectionTab && (
                          <button
                            type="button"
                            onClick={() => openInspection(cs.inspectionTab!)}
                            className="text-xs font-semibold text-[#1E40FF] hover:text-cyan-600 flex items-center gap-1 cursor-pointer"
                          >
                            <MonitorSmartphone className="w-3.5 h-3.5" />
                            <span>Xem Thực Tế</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 6. STRATEGIC PARTNERS & F1 DISTRIBUTION NETWORK                  */}
        {/* ================================================================ */}
        <PartnersTrustSection excludeFlagshipIds={['ecolife-signature']} />

        {/* ================================================================ */}
        {/* 7. TRANSPARENT INVESTMENT & BESPOKE ROADMAP                      */}
        {/* ================================================================ */}
        <section id="pricing" className="relative py-20 sm:py-26 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <div className="ql-eyebrow mb-3">
                  <Database className="w-3.5 h-3.5 text-[#1E40FF]" />
                  <span>LỘ TRÌNH ĐẦU TƯ MINH BẠCH • KHỞI ĐỘNG NHANH HOẶC MAY ĐO RIÊNG</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Giải Pháp Tương Xứng{' '}
                  <span className="text-gradient-inkica">Quy Mô Từng Doanh Nghiệp</span>
                </h2>
              </div>

              <div className="inline-flex items-center p-1 rounded-full bg-white border border-slate-200 shadow-2xs w-fit">
                <button
                  type="button"
                  onClick={() => setBillingYearly(false)}
                  className={`min-h-[44px] sm:min-h-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    !billingYearly ? 'bg-[#1E40FF] text-white' : 'text-slate-600'
                  }`}
                >
                  Theo Tháng
                </button>
                <button
                  type="button"
                  onClick={() => setBillingYearly(true)}
                  className={`min-h-[44px] sm:min-h-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    billingYearly ? 'bg-[#1E40FF] text-white' : 'text-slate-600'
                  }`}
                >
                  <span>Theo Năm</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      billingYearly
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    -15%
                  </span>
                </button>
              </div>
            </div>

            {/* Clean 4-Column Canonical SaaS Matrix */}
            <div className="rounded-[28px] overflow-hidden border border-slate-200/85 bg-white/85 backdrop-blur-xl shadow-xs grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200/75 mb-10">
              {DOMATION_SAAS_PLANS.map((plan, idx) => {
                const isCustom = plan.monthly === 'May Đo';
                return (
                  <div
                    key={plan.name}
                    className={`p-6 sm:p-7 flex flex-col justify-between ${
                      idx >= 2 ? 'md:border-t md:border-slate-200/75 xl:border-t-0' : ''
                    } ${
                      plan.popular
                        ? 'bg-gradient-to-br from-[#EEF4FF] via-white to-[#ECFEFF] ring-2 ring-inset ring-[#1E40FF]/35'
                        : ''
                    }`}
                  >
                    <div>
                      <div
                        className={`inline-block text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4 ${
                          plan.popular
                            ? 'bg-gradient-to-r from-[#1E40FF] to-[#06B6D4] text-white'
                            : 'bg-slate-100 text-[#1E40FF]'
                        }`}
                      >
                        {plan.badge}
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                        {plan.name}
                      </h3>

                      <div className="mt-3 mb-2.5 flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                          {billingYearly ? plan.yearly : plan.monthly}
                        </span>
                        {!isCustom && (
                          <span className="text-xs font-medium text-slate-500">
                            {billingYearly ? '/ năm' : '/ tháng'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm leading-relaxed mb-6 text-slate-600">
                        {plan.desc}
                      </p>

                      <div className="space-y-3 pt-5 border-t border-slate-200/75">
                        {plan.features.map((feat) => (
                          <div key={feat} className="flex items-start gap-2.5 text-xs sm:text-[13px]">
                            <CheckCircle2
                              className={`w-4 h-4 shrink-0 mt-0.5 ${
                                plan.popular ? 'text-[#1E40FF]' : 'text-emerald-500'
                              }`}
                            />
                            <span className="text-slate-700">
                              {feat}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openContact(
                          isCustom
                            ? 'Thiết Kế Riêng Bespoke Enterprise (ERP • CRM • AI Agent)'
                            : 'Hệ thống Auto Chia Data ZaloBot & Flow Automation',
                          `Quan tâm gói DOMATION ${plan.name} (${
                            billingYearly ? plan.yearly : plan.monthly
                          })`
                        )
                      }
                      className={`mt-8 min-h-[44px] w-full py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        plan.popular
                          ? 'bg-gradient-to-r from-[#1E40FF] via-[#2563EB] to-[#06B6D4] text-white hover:brightness-110 shadow-lg'
                          : 'ql-btn-outline'
                      }`}
                    >
                      <span>
                        {isCustom ? 'Đặt Lịch Khảo Sát & Thiết Kế Riêng' : `Chọn Gói ${plan.name}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Clean Website Estimator Banner (2 Buttons 1 Row) */}
            <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-slate-200/80 p-6 sm:p-9 relative overflow-hidden shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-2 hidden lg:flex items-center justify-center">
                  <img
                    src={DECOR_PNGS.prism}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="w-20 h-20 object-contain animate-float-decor drop-shadow-[0_14px_22px_rgba(30,64,255,0.16)]"
                  />
                </div>

                <div className="lg:col-span-6 space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1E40FF]">
                    <Calculator className="w-4 h-4" />
                    <span>THIẾT KẾ WEBSITE THƯƠNG HIỆU &amp; TƯƠNG TÁC</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Dự Toán &amp; Báo Giá{' '}
                    <span className="text-[#1E40FF]">Website Theo Nhu Cầu</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Tùy chọn linh hoạt các hạng mục giao diện, bảng hàng, cổng thanh toán và đồng bộ CRM ngay trên bảng tính trực quan.
                  </p>
                </div>

                <div className="lg:col-span-4 grid grid-cols-2 items-center gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setEstimatorOpen(true)}
                    className="btn-inkica-primary min-h-[44px] justify-center px-3 sm:px-5 py-3 text-[11px] sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>Báo giá</span>
                  </button>
                  <a
                    href="/web-design"
                    onClick={(e) => handleSpaLinkClick(e, '/web-design')}
                    className="ql-btn-outline min-h-[44px] justify-center px-3 sm:px-5 py-3 text-[11px] sm:text-sm font-semibold whitespace-nowrap"
                  >
                    <span>Chi Tiết Hạng Mục</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FaqAccordionSection
          faqs={HOME_FAQS}
          heading="Câu Hỏi Thường Gặp Về Hệ Sinh Thái DOMATION"
          subtitle="Thông tin trực diện về giải pháp may đo Enterprise OS, chi phí SaaS và dịch vụ thiết kế Website chuẩn SEO/GEO."
        />
      </main>

      {/* ================================================================ */}
      {/* 8. EXECUTIVE NAVY-SAPPHIRE FOOTER (SHARED)                       */}
      {/* ================================================================ */}
      <DomationFooter onOpenContact={() => openContact()} />

      {showBackTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Lên đầu trang"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 min-h-[44px] px-4 py-2 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200 shadow-lg text-xs font-semibold text-slate-800 hover:text-[#1E40FF] flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5 text-[#1E40FF]" />
          <span>Đầu trang</span>
        </button>
      )}

      <ProductInspectionModal
        isOpen={inspectionOpen}
        initialTab={inspectionTab}
        onClose={() => setInspectionOpen(false)}
        onOpenContact={(topic) => openContact(undefined, topic)}
      />

      <WebEstimatorModal
        isOpen={estimatorOpen}
        onClose={() => setEstimatorOpen(false)}
        onRequestQuote={(summary) =>
          openContact('Website Thương Hiệu & Tương Tác', summary)
        }
      />

      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        defaultService={contactDefaults.service}
        defaultNote={contactDefaults.note}
      />

      <ImageZoomModal
        image={zoomedShot}
        onClose={() => setZoomedShot(null)}
      />
    </div>
  );
};
