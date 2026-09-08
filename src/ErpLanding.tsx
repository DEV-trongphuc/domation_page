import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ShieldCheck,
  Zap,
  Users,
  Clock,
  CheckCircle2,
  Lock,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  PhoneCall,
  MessageSquare,
  FileSpreadsheet,
  MapPin,
  Camera,
  CalendarCheck,
  TrendingUp,
  CreditCard,
  Briefcase,
  Layers,
  ArrowRight,
  Bot,
  Sliders,
  X,
  Maximize2,
  BellRing,
  Send,
  Mail
} from 'lucide-react';
import { Navbar } from './Navbar';
import { ContactModal } from './ContactModal';

interface ErpImageItem {
  id: string;
  src: string;
  title: string;
  category: 'Vận hành & Lead' | 'CRM & Khách hàng' | 'Nhân sự & Chấm công' | 'Lương & Tài chính' | 'Hệ thống & Cài đặt';
  tag: string;
  description: string;
  highlight: string;
}

const ERP_GALLERY: ErpImageItem[] = [
  {
    id: 'splash',
    src: '/ERP-Product/1788856522396_2141578413905312186_2310722037673454867_637ed02e6f5c0e0560d1bcac82cf9a19.jpg',
    title: 'Màn hình Khởi động IDEAS ERP (AI Mascot)',
    category: 'Hệ thống & Cài đặt',
    tag: 'Splash Screen',
    description: 'Bộ nhận diện hiện đại với Mascot Robot AI, định hướng tự động hóa thông minh (AI Automation & Intelligent Workflow).',
    highlight: 'Nhận diện thương hiệu công nghệ cao'
  },
  {
    id: 'inbox',
    src: '/ERP-Product/1788856540980_2141578413905312186_2310722037673454867_a9d3d972886e0c266f4c5866dec8111d.jpg',
    title: 'Hộp thư Phê duyệt & Tồn đọng (AI Gatekeeper)',
    category: 'Vận hành & Lead',
    tag: 'Approval Inbox',
    description: 'Trung tâm kiểm duyệt dữ liệu: Ticket báo lỗi data, lead bị tạm giữ qua bộ lọc AI Pre-screener và yêu cầu hỗ trợ IT/CS.',
    highlight: 'Xử lý nút thắt cổ chai tức thì'
  },
  {
    id: 'dashboard',
    src: '/ERP-Product/1788856550308_2141578413905312186_2310722037673454867_9dee6011fca6751ff38ce855f9b34ee2.jpg',
    title: 'Tổng quan Vận hành & Phân bổ Data',
    category: 'Vận hành & Lead',
    tag: 'Executive Dashboard',
    description: 'Thống kê thời gian thực: Tổng data tiếp nhận, tỷ lệ chia thành công 100%, tỷ lệ trùng lặp 0%, biểu đồ hiệu suất theo ngày và top tư vấn viên.',
    highlight: 'Báo cáo trực quan & Real-time'
  },
  {
    id: 'kanban',
    src: '/ERP-Product/1788856559658_2141578413905312186_2310722037673454867_192068dc865f82425fa3645d12da931a.jpg',
    title: 'Bàn làm việc & Task Kanban Thông minh',
    category: 'Vận hành & Lead',
    tag: 'Workspace & Kanban',
    description: 'Quản trị công việc cá nhân và đội ngũ: Cảnh báo công việc quá hạn, đếm giờ phiên làm việc, lọc theo trạng thái và nhóm phụ trách.',
    highlight: 'Tăng 40% năng suất xử lý công việc'
  },
  {
    id: 'expenses',
    src: '/ERP-Product/1788856566822_2141578413905312186_2310722037673454867_c63e338a900a1ede4d6aa48393ce24da.jpg',
    title: 'Quản lý Chi phí Vận hành (Purchase Order)',
    category: 'Lương & Tài chính',
    tag: 'Purchase Order',
    description: 'Kiểm soát dòng tiền ra: Tổng chi phí kỳ này, hóa đơn đã duyệt, chờ duyệt, phân loại chi phí vận hành và hạn mức giải ngân.',
    highlight: 'Minh bạch từng đồng chi phí'
  },
  {
    id: 'crm_lead',
    src: '/ERP-Product/1788856586610_2141578413905312186_2310722037673454867_3a3e0cd6e45b99e3e82c953988b294c7.jpg',
    title: 'Hồ sơ Khách hàng & Pipeline Chăm sóc',
    category: 'CRM & Khách hàng',
    tag: 'Lead Detail & Pipeline',
    description: 'Theo dõi chi tiết khách hàng: Phân cấp nhiệt độ (Ấm/Nóng), AI chấm điểm tiềm năng, quy trình 8 bước, doanh thu dự kiến và ghi chú tương tác.',
    highlight: 'Quản lý 360 độ vòng đời khách hàng'
  },
  {
    id: 'hr_overview',
    src: '/ERP-Product/1788856615239_2141578413905312186_2310722037673454867_68e999d52c39291dacc6740f9084167c.jpg',
    title: 'Quản lý Nhân sự & Cơ cấu Phòng ban',
    category: 'Nhân sự & Chấm công',
    tag: 'HRM Overview',
    description: 'Toàn cảnh nhân sự doanh nghiệp: Tỷ lệ đi làm trong tuần, nhân viên đi trễ, nhân sự tăng ca OT, cơ cấu phòng ban và đơn chờ duyệt.',
    highlight: 'Tự động hóa báo cáo chấm công'
  },
  {
    id: 'leave_approval',
    src: '/ERP-Product/1788856627087_2141578413905312186_2310722037673454867_33798ebb805d3335cfcfedec3f73c1c0.jpg',
    title: 'Phê duyệt Đơn từ & Tăng ca Trực tuyến',
    category: 'Nhân sự & Chấm công',
    tag: 'Online Approval',
    description: 'Quy trình xét duyệt đa cấp: Phép năm, tăng ca, làm việc từ xa (WFH), giải trình đi trễ với đầy đủ thời gian và lý do xác thực.',
    highlight: 'Không còn giấy tờ thủ công'
  },
  {
    id: 'payroll_calc',
    src: '/ERP-Product/1788856643268_2141578413905312186_2310722037673454867_90891228871ff88a333f15fc1497741d.jpg',
    title: 'Bảng tính Lương Tháng Tự Động (Payroll Engine)',
    category: 'Lương & Tài chính',
    tag: 'Payroll System',
    description: 'Thuật toán tính lương phức hợp: Lương ngày công, thưởng chuyên cần, KPI, khấu trừ BHXH, thuế thu nhập cá nhân TNCN và thực lĩnh NET.',
    highlight: 'Tính lương tự động chuẩn xác 100%'
  },
  {
    id: 'payslip_pdf',
    src: '/ERP-Product/1788856653987_2141578413905312186_2310722037673454867_b778c3abf946efda6e8623075e8ea445.jpg',
    title: 'Phiếu Lương Điện Tử & Xuất File PDF',
    category: 'Lương & Tài chính',
    tag: 'Digital Payslip & PDF',
    description: 'Phiếu lương điện tử cá nhân hóa: Bảng kê chi tiết từng khoản cộng/trừ, hỗ trợ in hoặc xuất file PDF ký số xác nhận lương Net trực tuyến.',
    highlight: 'Bảo mật thông tin lương tuyệt đối'
  },
  {
    id: 'attendance_cal',
    src: '/ERP-Product/1788856662127_2141578413905312186_2310722037673454867_5cecf569bb851d994237076459b3995a.jpg',
    title: 'Quản lý Chấm công Theo Tháng & Ca trực',
    category: 'Nhân sự & Chấm công',
    tag: 'Monthly Attendance',
    description: 'Lịch chấm công tổng hợp: Giám sát ngày công thực tế, số lần đi trễ, phút trễ, ca trực đêm, tăng ca và cập nhật bổ sung công hợp lệ.',
    highlight: 'Minh bạch dữ liệu chuyên cần'
  },
  {
    id: 'gps_selfie',
    src: '/ERP-Product/1788856668006_2141578413905312186_2310722037673454867_72b9a0047bb54f03c54fb657c81e41dc.jpg',
    title: 'Chấm công Định vị GPS & Chụp Ảnh Selfie AI',
    category: 'Nhân sự & Chấm công',
    tag: 'GPS & Face Check-in',
    description: 'Chống gian lận chấm công tuyệt đối: Xác thực tọa độ vệ tinh GPS văn phòng, thời gian chuẩn xác đến từng giây kèm ảnh chụp selfie vào ca.',
    highlight: 'Chống Fake GPS & Gian lận ca'
  },
  {
    id: 'system_settings',
    src: '/ERP-Product/1788856679081_2141578413905312186_2310722037673454867_8628e61bf60b5866f7474a75753c6fda.jpg',
    title: 'Trung tâm Cấu hình Hệ thống & SLA (v246)',
    category: 'Hệ thống & Cài đặt',
    tag: 'System Rules & SLA',
    description: 'Cấu hình linh hoạt không hardcode: Thời gian chờ nhận lead (2 phút), van chống ôm (Backpressure), quy tắc cọc & bể cọc, hạn mức Databank.',
    highlight: 'Linh hoạt tùy biến 100% nghiệp vụ'
  },
  {
    id: 'notification_deep_config',
    src: '/ERP-Product/1788858964647_2141578413905312186_2310722037673454867_b8873435ef7af2c83ac2aa6b32603ac2.jpg',
    title: 'Hệ Thống Thông Báo Tùy Chỉnh Chuyên Sâu',
    category: 'Hệ thống & Cài đặt',
    tag: 'Multi-Channel Alert Bot',
    description: 'Hệ thống thông báo thời gian thực đa kênh: Tích hợp Zalo Bot, Telegram Bot và Email SMTP. Tùy biến thông báo khi chia Lead, cảnh báo hết hạn Databank, lời mời hợp tác Co-care hoa hồng và @mention đồng nghiệp.',
    highlight: 'Zalo Bot • Telegram • Email SMTP'
  },
  {
    id: 'nav_menu_1',
    src: '/ERP-Product/1788856691047_2141578413905312186_2310722037673454867_2dacee1206b6e8f836cdea82018d556e.jpg',
    title: 'Hệ thống Menu Điều hướng Nhanh (Phần 1)',
    category: 'Hệ thống & Cài đặt',
    tag: 'Quick Navigation 01',
    description: 'Giao diện chuyển đổi phân hệ nhanh: Tổng quan, Bàn làm việc, Lịch trình, Báo cáo, Quy trình, Purchase Order, Sales Order và Dự báo dòng tiền.',
    highlight: 'Thao tác 1 chạm toàn hệ thống'
  },
  {
    id: 'nav_menu_2',
    src: '/ERP-Product/1788856705546_2141578413905312186_2310722037673454867_91d3fd439a4e7f45eee7ae77dc8c20a1.jpg',
    title: 'Hệ sinh thái Phân hệ Mở rộng (Phần 2)',
    category: 'Hệ thống & Cài đặt',
    tag: 'Quick Navigation 02',
    description: 'Kết nối toàn diện: Quản lý khách hàng, Khóa học, Đối tác, Nhà cung cấp, Hồ sơ nhân sự, Vòng chia Lead xoay vòng và Tích hợp Webhook/Meta CAPI.',
    highlight: 'Khả năng mở rộng không giới hạn'
  }
];

export const ErpLanding: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'lead' | 'crm' | 'hr' | 'finance' | 'settings'>('all');
  const [lightboxImg, setLightboxImg] = useState<ErpImageItem | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredGallery = ERP_GALLERY.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'lead') return item.category === 'Vận hành & Lead';
    if (activeTab === 'crm') return item.category === 'CRM & Khách hàng';
    if (activeTab === 'hr') return item.category === 'Nhân sự & Chấm công';
    if (activeTab === 'finance') return item.category === 'Lương & Tài chính';
    if (activeTab === 'settings') return item.category === 'Hệ thống & Cài đặt';
    return true;
  });

  const enterpriseModules = [
    {
      num: '01',
      title: 'Tiếp Nhận Lead Một Cửa & Chống Trùng',
      desc: 'Mọi nguồn (Meta, Google, Hotline, Giới thiệu) đổ về 1 điểm. Tách biệt Lead và Person để nhận diện trùng lặp qua SĐT. Dữ liệu lead nguồn bất biến.',
      icon: Layers,
      color: 'from-rose-500 to-red-600'
    },
    {
      num: '02',
      title: 'Thuật Toán Chia Lead 5 Cổng & Van Chống Ôm',
      desc: 'Phân phối lead tới cá nhân Sales qua 5 rào chắn: Roster dự án, Check-in selfie, Vacation Mode, Van chống ôm (Backpressure) và Hạn mức giờ/ngày/tháng.',
      icon: Zap,
      color: 'from-amber-500 to-orange-600'
    },
    {
      num: '03',
      title: 'Chăm Sóc, Ma Trận Nhiệt Độ & Form Rào Cản TTL1',
      desc: 'Phân loại nhiệt độ (Nóng, Ấm, Lạnh). Tự động hạ nhiệt (Decay) sau 5 ngày không tương tác. Bắt buộc hoàn thiện form TTL1 trước khi lên lịch gặp khách.',
      icon: TrendingUp,
      color: 'from-orange-500 to-rose-600'
    },
    {
      num: '04',
      title: 'Hợp Tác Số & Phân Chia Hoa Hồng 100%',
      desc: 'Tự động sinh Phiếu Hợp Tác khi phát sinh cọc. Ghi nhận toàn bộ thành viên hỗ trợ, kiểm tra tổng hoa hồng 100%, ký số xác nhận và Ban Giám Đốc phê duyệt.',
      icon: Users,
      color: 'from-purple-500 to-indigo-600'
    },
    {
      num: '05',
      title: 'Kho Databank & Đồng Hồ Bảo Mật Lead',
      desc: 'Đồng hồ bảo mật tái khai thác: Lead chưa tương tác tự động trả về kho chung (3h - 1 ngày - 4 ngày). Hỗ trợ chia song song 2 Sales để giải cứu khách.',
      icon: Clock,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      num: '06',
      title: 'Quản Lý Dự Án & Giỏ Hàng Thời Gian Thực',
      desc: 'Dự án là thực thể rễ gắn kết tài liệu dự án, bảng giá, chính sách bán hàng, chiến dịch Ads UTM và Roster nhân sự. Kiểm soát phân quyền mở tài liệu.',
      icon: Building2,
      color: 'from-emerald-500 to-teal-600'
    },
    {
      num: '07',
      title: 'Quản Trị Nhân Sự HRM & Chấm Công GPS AI',
      desc: 'Chấm công định vị tọa độ vệ tinh GPS văn phòng, chụp ảnh Selfie AI nhận diện vào ca. Quản lý ngày công, đi muộn, tăng ca OT và duyệt đơn phép đa cấp.',
      icon: MapPin,
      color: 'from-rose-500 to-pink-600'
    },
    {
      num: '08',
      title: 'Bảng Tính Lương Tự Động & Xuất Phiếu PDF',
      desc: 'Thuật toán tính lương phức hợp: Lương ngày công, phụ cấp, thưởng chuyên cần, KPI, khấu trừ BHXH, thuế TNCN lũy tiến và xuất phiếu lương PDF điện tử.',
      icon: FileSpreadsheet,
      color: 'from-red-500 to-amber-600'
    },
    {
      num: '09',
      title: 'Dòng Tiền, Cọc & Phí Môi Giới',
      desc: 'Theo dõi phiếu cọc, tiến độ thanh toán từng đợt (UNC kế toán duyệt). Quản lý Purchase Order, chi phí vận hành doanh nghiệp và dự báo dòng tiền.',
      icon: CreditCard,
      color: 'from-teal-500 to-emerald-600'
    },
    {
      num: '10',
      title: 'Dữ Liệu Ngược Meta CAPI (Forward-Only)',
      desc: 'Bắn tín hiệu chuyển đổi CAPI trực tiếp về Meta Pixel (Lead -> Schedule -> Purchase). Forward-only không bắn lùi sự kiện, tự động join chi phí Ads tính ROAS.',
      icon: Bot,
      color: 'from-indigo-500 to-blue-600'
    },
    {
      num: '11',
      title: 'Bảo Mật Row-Level Security (RLS) & Audit Log',
      desc: 'Phân quyền sâu đến từng dòng dữ liệu: Sales chỉ thấy khách của mình, Quản lý xem toàn team, Ban Giám Đốc giám sát toàn diện. Audit log bất biến.',
      icon: ShieldCheck,
      color: 'from-fuchsia-500 to-purple-600'
    },
    {
      num: '12',
      title: 'Hệ Thống Thông Báo Đa Kênh Chuyên Sâu',
      desc: 'Ma trận thông báo thời gian thực: Kết nối Zalo Bot, Telegram Bot, Email SMTP. Tự động thông báo khi chia Lead, đếm ngược hạn bảo mật Databank, Co-care hoa hồng và @mention.',
      icon: BellRing,
      color: 'from-pink-500 to-rose-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] rounded-full bg-rose-600/[0.08] blur-[150px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-red-800/[0.07] blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />
      </div>

      {/* Navigation */}
      <Navbar activePage="erp" onOpenContact={() => setShowContactModal(true)} />

      {/* Hero Section */}
      <section className="relative z-10 pt-28 pb-12 md:pt-36 md:pb-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          {/* Top Pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] sm:text-xs font-medium mb-4 backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Hệ Thống Quản Trị Doanh Nghiệp 5.0 • AI Automation
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight md:leading-[1.25] mb-3.5"
          >
            Hệ Thống Quản Trị Doanh Nghiệp{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-300 to-red-400">
              Toàn Diện &amp; Tự Động Hóa
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-xs sm:text-sm md:text-[15px] text-slate-400 max-w-2xl mx-auto leading-relaxed mb-6 font-normal"
          >
            Giải pháp ERP thế hệ mới tích hợp sâu AI Workflow: từ tiếp nhận Lead đa kênh, tự động phân bổ 5 cổng,
            quản lý nhân sự &amp; chấm công GPS AI đến bảng lương tự động và dữ liệu ngược Meta CAPI.
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="flex flex-wrap items-center justify-center gap-2.5 mb-10 md:mb-12"
          >
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-rose-600/25 hover:shadow-rose-600/40 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Đăng Ký Tư Vấn Triển Khai</span>
            </button>

            <a
              href="#phan-he"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium text-xs sm:text-sm transition-all hover:-translate-y-0.5"
            >
              <Building2 className="w-3.5 h-3.5 text-rose-400" />
              <span>12 Phân Hệ</span>
            </a>

            <a
              href="#thu-vien-anh"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium text-xs sm:text-sm transition-all hover:-translate-y-0.5"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span>16 Ảnh Thực Tế</span>
            </a>
          </motion.div>

          {/* Hero Featured Image Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative max-w-5xl mx-auto rounded-2xl md:rounded-3xl p-1.5 md:p-2.5 bg-gradient-to-b from-white/15 via-white/5 to-transparent border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.8)] backdrop-blur-xl group cursor-zoom-in"
            onClick={() => setLightboxImg(ERP_GALLERY[2])}
          >
            <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-[#0a0d16] aspect-[16/9]">
              <img
                src={ERP_GALLERY[2].src}
                alt="IDEAS ERP Executive Dashboard"
                className="w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080b12] via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 flex items-center justify-between pointer-events-none">
                <div className="text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/80 backdrop-blur-md text-[10px] sm:text-[11px] font-semibold text-white mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Giao diện điều hành thời gian thực
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-white drop-shadow-md">
                    Dashboard Vận Hành &amp; Phân Bổ Data Doanh Nghiệp
                  </h3>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/20 text-xs font-medium text-white backdrop-blur-md">
                  <Maximize2 className="w-3 h-3 text-rose-400" /> Bấm để phóng to
                </div>
              </div>
            </div>
          </motion.div>

          {/* Key Metrics Counter Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mt-8 text-left">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-rose-500/25 transition-all">
              <div className="text-xl md:text-2xl font-bold text-rose-400 mb-0.5">12+</div>
              <div className="text-xs font-semibold text-white mb-0.5">Phân Hệ Cốt Lõi</div>
              <div className="text-[11px] text-slate-400">Enterprise Blueprint</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/25 transition-all">
              <div className="text-xl md:text-2xl font-bold text-amber-400 mb-0.5">5 Cổng</div>
              <div className="text-xs font-semibold text-white mb-0.5">Auto-Routing Lead</div>
              <div className="text-[11px] text-slate-400">Loại bỏ cảm tính 100%</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/25 transition-all">
              <div className="text-xl md:text-2xl font-bold text-emerald-400 mb-0.5">GPS &amp; AI</div>
              <div className="text-xs font-semibold text-white mb-0.5">Selfie Chấm Công</div>
              <div className="text-[11px] text-slate-400">Chống gian lận vị trí</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/25 transition-all">
              <div className="text-xl md:text-2xl font-bold text-purple-400 mb-0.5">100% RLS</div>
              <div className="text-xs font-semibold text-white mb-0.5">Bảo Mật Dữ Liệu</div>
              <div className="text-[11px] text-slate-400">Phân quyền hàng DB</div>
            </div>
          </div>
        </div>
      </section>

      {/* 12 Modules Architecture Section */}
      <section id="phan-he" className="py-24 relative z-10 border-t border-white/5 bg-[#090d18]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Layers className="w-3.5 h-3.5" /> Kiến Trúc Hệ Thống
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-4">
              12 Phân Hệ Doanh Nghiệp Chuẩn Hóa
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Toàn bộ chu trình vận hành từ khi khách hàng xuất hiện trên Ads đến chấm công, chia hoa hồng,
              tính lương và báo cáo tài chính đều được số hóa chặt chẽ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enterpriseModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.num}
                  className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-rose-500/40 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${mod.color} text-white shadow-lg`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-white/20 group-hover:text-rose-500/40 transition-colors">
                      {mod.num}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-rose-300 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Tabs: Deep-Dive into Key Capabilities */}
      <section className="py-24 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Khám Phá Trực Quan
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-4">
              Chi Tiết Tính Năng Thực Chiến
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Hệ thống được thiết kế tỉ mỉ, phục vụ chính xác các nhu cầu khắt khe của doanh nghiệp vận hành quy mô lớn.
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex items-center justify-center flex-wrap gap-2 mb-12">
            {[
              { id: 'all', label: 'Tất Cả (16 Ảnh)' },
              { id: 'lead', label: 'Vận Hành & Lead' },
              { id: 'crm', label: 'CRM & Pipeline' },
              { id: 'hr', label: 'Nhân Sự & Chấm Công' },
              { id: 'finance', label: 'Lương & Tài Chính' },
              { id: 'settings', label: 'Hệ Thống & Cài Đặt' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div id="thu-vien-anh" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="group rounded-2xl overflow-hidden bg-[#0d121f] border border-white/10 hover:border-rose-500/40 transition-all duration-300 shadow-xl flex flex-col"
              >
                {/* Image Container */}
                <div
                  className="relative aspect-[16/10] overflow-hidden bg-black cursor-zoom-in"
                  onClick={() => setLightboxImg(item)}
                >
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                    <span className="text-[11px] font-bold text-white px-2.5 py-1 rounded-full bg-rose-500/80 backdrop-blur-sm">
                      {item.highlight}
                    </span>
                    <span className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Info Container */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                        {item.category}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 px-2 py-0.5 rounded bg-white/5">
                        {item.tag}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors mb-2">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLightboxImg(item)}
                    className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-rose-400 group-hover:text-rose-300 cursor-pointer"
                  >
                    <span>Xem phóng to chi tiết</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep-Dive Feature Highlights */}
      <section className="py-24 relative z-10 border-t border-white/5 bg-[#0a0f1d]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-4">
                <Zap className="w-3.5 h-3.5" /> Đột phá Vận hành Lead
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-4">
                Thuật Toán Chia Lead 5 Cổng & Van Chống Ôm
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Chấm dứt hoàn toàn tình trạng Sales “ôm số” nhưng không gọi khách, gây lãng phí ngân sách Marketing:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>Cổng 1 - Project Roster:</strong> Chỉ Sales có tên trong danh sách chiến dịch dự án mới được phân phối lead.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>Cổng 2 - Selfie Check-in:</strong> Phải điểm danh chụp ảnh selfie vào ca đầu ngày mới được nhận số.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>Cổng 3 - Vacation Mode:</strong> Tự động loại trừ nhân sự đang bật chế độ nghỉ phép, tạm vắng.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>Cổng 4 - Van Chống Ôm (Backpressure):</strong> Vượt quá 5 lead chưa gọi/chưa có tương tác =&gt; Khóa nhận lead mới ngay lập tức.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>Cổng 5 - Hạn mức Quota:</strong> Giới hạn nhận số theo giờ (3 số), theo ngày (2 số) và theo tháng (300 số).
                  </div>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black cursor-zoom-in group"
              onClick={() => setLightboxImg(ERP_GALLERY[12])}
            >
              <img
                src={ERP_GALLERY[12].src}
                alt="Cài đặt hệ thống v246"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="p-4 bg-[#0d121f] flex items-center justify-between text-xs text-slate-300">
                <span>Giao diện Cài đặt Nghiệp vụ & Hạn mức v246 (Không hardcode)</span>
                <Maximize2 className="w-4 h-4 text-rose-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div
              className="order-2 lg:order-1 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black cursor-zoom-in group"
              onClick={() => setLightboxImg(ERP_GALLERY[11])}
            >
              <img
                src={ERP_GALLERY[11].src}
                alt="Chấm công GPS và Selfie"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="p-4 bg-[#0d121f] flex items-center justify-between text-xs text-slate-300">
                <span>Chi tiết tọa độ GPS thực tế & Ảnh Selfie check-in từng nhân sự</span>
                <Maximize2 className="w-4 h-4 text-rose-400" />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                <Camera className="w-3.5 h-3.5" /> Minh Bạch Chấm Công & Tính Lương
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-4">
                Chấm Công GPS Vệ Tinh, AI Selfie & Bảng Lương Tự Động
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Giải quyết triệt để bài toán chấm công gian lận và tính toán lương thưởng cồng kềnh cho doanh nghiệp:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>Định Vị Tọa Độ GPS:</strong> Bắt buộc nhân viên có mặt trong bán kính cho phép của văn phòng hoặc chi nhánh mới mở nút check-in.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>Chụp Ảnh Selfie Nhận Diện:</strong> Chụp trực tiếp từ camera thiết bị, chống chụp lại màn hình hoặc nhờ người khác bấm hộ.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>Bảng Lương Động Chuẩn Pháp Lý:</strong> Tự động tính công chuẩn, trừ phút trễ, cộng làm thêm OT, tính thuế TNCN lũy tiến từng bậc và BHXH.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>Xuất Phiếu Lương PDF & Ký Số:</strong> Mỗi nhân sự có phiếu lương điện tử riêng, xem và xác nhận trực tuyến trên điện thoại.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Notification Highlight */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-24">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-wider mb-4">
                <BellRing className="w-3.5 h-3.5" /> Thông Báo Thời Gian Thực
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-4">
                Cấu Hình Thông Báo Tùy Chỉnh Chuyên Sâu
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Chấm dứt hoàn toàn trễ nải thông tin và bỏ sót khách hàng nóng với ma trận thông báo đa kênh tự động:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>Đa Kênh Tích Hợp Sẵn:</strong> Kết nối trực tiếp Zalo Bot, Telegram Bot và Email SMTP cá nhân / công ty nhanh chóng.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>Phân Quyền Ma Trận Sự Kiện:</strong> Phân chia riêng luồng thông báo cho Cá nhân &amp; Quản lý vs Dành cho Quản trị &amp; Ban Giám Đốc.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>Bắn Lead Mới Tức Thì:</strong> Ngay khi hệ thống chia lead, Sales nhận ngay tin nhắn Zalo/Telegram kèm tóm tắt nhu cầu để phản hồi trong SLA 2 phút.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>Cảnh Báo Hạn Bảo Mật Databank:</strong> Tự động đếm ngược và nhắc trước khi Data bị thu hồi về kho chung do không tương tác đúng hạn.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>Hợp Tác Co-Care &amp; @Mention:</strong> Thông báo ngay khi có lời mời hợp tác chăm sóc, tạo phiếu chia hoa hồng hoặc được đồng nghiệp nhắc tên.
                  </div>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black cursor-zoom-in group"
              onClick={() => {
                const notifImg = ERP_GALLERY.find((img) => img.id === 'notification_deep_config');
                if (notifImg) setLightboxImg(notifImg);
              }}
            >
              <img
                src="/ERP-Product/1788858964647_2141578413905312186_2310722037673454867_b8873435ef7af2c83ac2aa6b32603ac2.jpg"
                alt="Cấu hình thông báo tùy chỉnh chuyên sâu"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="p-4 bg-[#0d121f] flex items-center justify-between text-xs text-slate-300">
                <span>Ma trận Cấu hình Thông báo Đa Kênh (Zalo Bot • Telegram • Email SMTP)</span>
                <Maximize2 className="w-4 h-4 text-pink-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 relative z-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-4">
              So Sánh ERP Truyền Thống vs IDEAS ERP Tự Động Hóa
            </h2>
            <p className="text-slate-400 text-sm">
              Sự khác biệt khi chuyển đổi từ quy trình thủ công sang hệ thống thông minh.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-slate-300">
                  <th className="p-4 sm:p-5 font-bold uppercase tracking-wider text-white">Nghiệp Vụ</th>
                  <th className="p-4 sm:p-5 font-bold uppercase tracking-wider text-slate-400">ERP & Excel Truyền Thống</th>
                  <th className="p-4 sm:p-5 font-bold uppercase tracking-wider text-rose-400">IDEAS ERP (DOMATION)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-white">Phân phối Lead</td>
                  <td className="p-4 sm:p-5 text-slate-400">Chia thủ công bằng tay, dễ thiên vị, ôm số, chậm trễ</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-semibold">Tự động 100% qua 5 cổng kiểm duyệt, SLA 2 phút</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-white">Chấm công nhân sự</td>
                  <td className="p-4 sm:p-5 text-slate-400">Vân tay tại văn phòng, dễ quên quẹt hoặc can thiệp file</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-semibold">GPS vệ tinh + Selfie AI xác thực theo thời gian thực</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-white">Tính lương & hoa hồng</td>
                  <td className="p-4 sm:p-5 text-slate-400">Mất hàng tuần nhập liệu Excel, dễ nhầm công thức thuế</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-semibold">Tính tự động theo ngày công & UNC cọc, xuất PDF 1 chạm</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-white">Thông báo vận hành</td>
                  <td className="p-4 sm:p-5 text-slate-400">Tra cứu thủ công, trễ nải thông tin, dễ bỏ sót khách nóng</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-semibold">Zalo Bot, Telegram Bot &amp; Email SMTP thông báo tức thì theo SLA</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-white">Kho dữ liệu lead</td>
                  <td className="p-4 sm:p-5 text-slate-400">Lead cũ bị bỏ quên, thất thoát tài nguyên quảng cáo</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-semibold">Kho Databank đồng hồ bảo mật, tái khai thác song song</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-white">Bảo mật dữ liệu</td>
                  <td className="p-4 sm:p-5 text-slate-400">Dễ lộ số điện thoại, nhân viên nghỉ việc mang theo data</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-semibold">Row-Level Security (RLS), ẩn số điện thoại, Audit Log</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-white">Tối ưu Marketing</td>
                  <td className="p-4 sm:p-5 text-slate-400">Không đo được lead nào ra deal, lãng phí ngân sách Ads</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-semibold">Bắn Meta CAPI forward-only, tính chính xác CAC/ROAS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="tu-van" className="py-24 relative z-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-rose-950/30 via-[#0d121f] to-[#080b12] border border-rose-500/30 shadow-[0_0_80px_rgba(244,63,94,0.2)]">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-4">
              Sẵn Sàng Chuyển Đổi Số Doanh Nghiệp Của Bạn?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mb-8">
              Liên hệ ngay với đội ngũ kỹ sư của <strong>DOMATION</strong> để nhận tư vấn kiến trúc ERP,
              bản dùng thử hệ thống và lộ trình triển khai chi tiết cho doanh nghiệp của bạn.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-sm shadow-[0_0_30px_rgba(244,63,94,0.5)] hover:-translate-y-1 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Liên Hệ Tư Vấn Trực Tiếp</span>
              </button>

              <a
                href="https://zalo.me/0378859736"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#0068ff] text-white font-bold text-sm shadow-[0_0_30px_rgba(0,104,255,0.4)] hover:-translate-y-1 transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Chat Zalo: 0378 859 736</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#06080e] relative z-10 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/imgs/ICON.png" alt="DOMATION Logo" className="w-8 h-8 rounded-xl object-contain" />
            <div>
              <div className="font-bold text-white text-sm">DOMATION ECOSYSTEM</div>
              <div className="text-[11px] text-slate-400">Hệ sinh thái Quản trị & Công nghệ Bất Động Sản</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <a href="/" className="hover:text-white transition-colors">Trang chủ</a>
            <a href="/erp" className="text-rose-400 font-bold">Hệ thống ERP</a>
            <a href="/crm" className="hover:text-white transition-colors">Hệ thống CRM</a>
            <a href="/data" className="hover:text-white transition-colors">Auto Data Lead</a>
            <a href="/automation" className="hover:text-white transition-colors">Marketing Automation</a>
            <a href="/meta-report" className="hover:text-white transition-colors">Meta-Report Ads</a>
            <a href="/web-design" className="hover:text-white transition-colors">Web & Landing Page</a>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-400">
            © 2026 DOMATION & IDEAS JSC. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImg && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setLightboxImg(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl max-h-[95vh] bg-[#0c101c] rounded-2xl border border-white/15 overflow-hidden shadow-2xl z-10 flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#080b12]">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {lightboxImg.tag}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md sm:max-w-xl">
                    {lightboxImg.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxImg(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Image */}
              <div className="flex-1 overflow-auto bg-black/50 p-2 sm:p-4 flex items-center justify-center">
                <img
                  src={lightboxImg.src}
                  alt={lightboxImg.title}
                  className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-2xl"
                />
              </div>

              {/* Modal Footer Description */}
              <div className="p-4 border-t border-white/10 bg-[#0a0d17] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-300">
                <p className="flex-1 leading-relaxed">
                  {lightboxImg.description}
                </p>
                <div className="shrink-0 flex items-center gap-2">
                  <a
                    href={lightboxImg.src}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
                  >
                    <span>Mở ảnh gốc HD</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        themeColor="purple-500"
      />
    </div>
  );
};
